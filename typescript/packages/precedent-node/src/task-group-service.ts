import { assertNever, ZTaskStatus } from "@fgpt/precedent-iso";
import { DatabasePool, DatabaseTransactionConnection, sql } from "slonik";
import { z } from "zod";

export interface TaskGroup {
  id: string;
  description: string;
  numPendingTasks: number;
  numCompletedTasks: number;
  numFailedTasks: number;
  numTotalTasks: number;
}

export interface InsertTaskGroup {
  description: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
}

export interface TaskGroupService {
  insertTaskGroup(taskGroup: InsertTaskGroup): Promise<TaskGroup>;
  upsertTask(taskGroupId: string, taskId: string): Promise<TaskGroup>;
  upsertTasks(taskGroupId: string, taskIds: string[]): Promise<TaskGroup>;
}

const FIELDS = sql.fragment`
task_group.id as id,
task_group.description as description,
jsonb_array_length(task_group.pending_tasks) as num_pending_tasks,
jsonb_array_length(task_group.completed_tasks) as num_completed_tasks,
jsonb_array_length(task_group.failed_tasks) as num_failed_tasks
`;

// `PsqlTaskGroupService` directly accesses the task relation so there is an implicit dependency.
// I did this because it gives us better transactional guarantees.
export class PsqlTaskGroupService implements TaskGroupService {
  constructor(private readonly pool: DatabasePool) {}

  async insertTaskGroup(args: InsertTaskGroup): Promise<TaskGroup> {
    return this.pool.transaction(async (trx) =>
      this.#insertTaskGroup(trx, args),
    );
  }

  async #insertTaskGroup(
    trx: DatabaseTransactionConnection,
    {
      description,
      organizationId,
      projectId,
      fileReferenceId,
    }: InsertTaskGroup,
  ): Promise<TaskGroup> {
    const pendingTasks: string[] = [];
    const completedTasks: string[] = [];
    const failedTasks: string[] = [];

    return trx.one(sql.type(ZTaskGroupRowForLength)`
INSERT INTO task_group (description, pending_tasks, completed_tasks, failed_tasks, organization_id, project_id, file_reference_id)
    VALUES (${description}, ${JSON.stringify(pendingTasks)}, ${JSON.stringify(
      completedTasks,
    )}, ${JSON.stringify(
      failedTasks,
    )}, ${organizationId}, ${projectId}, ${fileReferenceId})
RETURNING
    ${FIELDS}
`);
  }

  async upsertTask(taskGroupId: string, taskId: string): Promise<TaskGroup> {
    return this.upsertTasks(taskGroupId, [taskId]);
  }

  async upsertTasks(
    taskGroupId: string,
    taskIds: string[],
  ): Promise<TaskGroup> {
    const sortedUnique = [...new Set(taskIds)].sort();
    return this.pool.transaction(async (trx) =>
      this.#upsertTasks(trx, taskGroupId, sortedUnique),
    );
  }

  async #upsertTasks(
    trx: DatabaseTransactionConnection,
    taskGroupId: string,
    taskIds: string[],
  ): Promise<TaskGroup> {
    const tasksWithStatus = await this.#getTaskStatuses(trx, taskIds);
    const { pendingTasks, completedTasks, failedTasks } =
      await trx.one(sql.type(ZTaskGroupRowValues)`
SELECT
    pending_tasks,
    completed_tasks,
    failed_tasks
FROM
    task_group
WHERE
    id = ${taskGroupId}
`);

    for (const { id, status } of tasksWithStatus) {
      pendingTasks.delete(id);
      completedTasks.delete(id);
      failedTasks.delete(id);
      switch (status) {
        case "queued":
        case "in-progress":
          pendingTasks.add(id);
          break;
        case "succeeded":
          completedTasks.add(id);
          break;
        case "failed":
          failedTasks.add(id);
          break;
        default:
          assertNever(status);
      }
    }
    return trx.one(sql.type(ZTaskGroupRowForLength)`
UPDATE
    task_group
SET
    pending_tasks = ${JSON.stringify(Array.from(pendingTasks))},
    completed_tasks = ${JSON.stringify(Array.from(completedTasks))},
    failed_tasks = ${JSON.stringify(Array.from(failedTasks))}
WHERE
    id = ${taskGroupId}
RETURNING
    ${FIELDS}
`);
  }

  async #getTaskStatuses(
    trx: DatabaseTransactionConnection,
    taskIds: string[],
  ) {
    if (taskIds.length === 0) {
      return [];
    }
    const tasksWithStatus = await trx.query(sql.type(ZTaskWithStatus)`
SELECT
    id,
    status
FROM
    task
WHERE
    id IN (${sql.join(taskIds, sql.fragment`, `)})
`);
    return Array.from(tasksWithStatus.rows);
  }
}

const ZTaskWithStatus = z.object({
  id: z.string(),
  status: ZTaskStatus,
});

const ZTaskGroupRowForLength = z
  .object({
    id: z.string(),
    description: z.string(),
    num_pending_tasks: z.number(),
    num_completed_tasks: z.number(),
    num_failed_tasks: z.number(),
  })
  .transform(
    (row): TaskGroup => ({
      id: row.id,
      description: row.description,
      numPendingTasks: row.num_pending_tasks,
      numCompletedTasks: row.num_completed_tasks,
      numFailedTasks: row.num_failed_tasks,
      numTotalTasks:
        row.num_failed_tasks + row.num_completed_tasks + row.num_pending_tasks,
    }),
  );

const ZTaskGroupRowValues = z
  .object({
    pending_tasks: z.string().array(),
    completed_tasks: z.string().array(),
    failed_tasks: z.string().array(),
  })
  .transform((row) => ({
    pendingTasks: new Set(row.pending_tasks),
    completedTasks: new Set(row.completed_tasks),
    failedTasks: new Set(row.failed_tasks),
  }));
