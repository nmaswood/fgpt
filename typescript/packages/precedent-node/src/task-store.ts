import {
  TaskConfig,
  TaskStatus,
  ZTaskConfig,
  ZTaskStatus,
} from "@fgpt/precedent-iso";
import { ZTaskType } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

import { MessageBusService } from "./message-bus-service";

export interface Task {
  id: string;
  config: TaskConfig;
  status: TaskStatus;
  organizationId: string;
  projectId: string;
  fileReferenceId: string | undefined;
}

export interface CreateTask {
  organizationId: string;
  projectId: string;
  fileReferenceId: string | undefined;
  config: TaskConfig;
}

export interface SetManyToInProgressArgs {
  limit: number;
}

interface SetAsCompleted {
  taskId: string;
  status: "succeeded" | "failed";
}

export interface TaskStore {
  get(taskId: string): Promise<Task>;
  getByFileReferenceId(fileReferenceId: string): Promise<Task[]>;
  insert(config: CreateTask): Promise<Task>;
  insertMany(configs: CreateTask[]): Promise<Task[]>;
  getAndSetToInProgress(): Promise<Task | undefined>;
  setToInProgress(taskId: string): Promise<Task | undefined>;
  setToSuceeded(taskId: string): Promise<Task | undefined>;
  setToFailed(taskId: string): Promise<Task | undefined>;
  setToQueued(taskId: string): Promise<Task | undefined>;
}

const FIELDS = sql.fragment`task.id, task.organization_id, task.project_id, task.task_type, task.status, task.config, task.file_reference_id`;
export class PSqlTaskStore implements TaskStore {
  constructor(
    private readonly pool: DatabasePool,
    private readonly messageBusService: MessageBusService,
  ) {}

  async get(taskId: string): Promise<Task> {
    return this.pool.one(sql.type(ZFromTaskRow)`
SELECT
    ${FIELDS}
FROM
    TASK
WHERE
    id = ${taskId}
`);
  }

  async getByFileReferenceId(fileReferenceId: string): Promise<Task[]> {
    const resp = await this.pool.any(sql.type(ZFromTaskRow)`

SELECT
    ${FIELDS}
FROM
    task
WHERE
    file_reference_id = ${fileReferenceId}
`);
    return Array.from(resp);
  }

  async insert(config: CreateTask): Promise<Task> {
    const [task] = await this.insertMany([config]);
    if (task === undefined) {
      throw new Error("failed to make task");
    }
    return task;
  }

  async setToInProgress(taskId: string): Promise<Task> {
    return this.pool.one(
      sql.type(ZFromTaskRow)`
UPDATE
    task
SET
    status = 'in-progress',
    status_updated_at = now()
WHERE
    task.id = ${taskId}
RETURNING
    ${FIELDS}
`,
    );
  }

  async setToQueued(taskId: string): Promise<Task> {
    return this.pool.one(
      sql.type(ZFromTaskRow)`
UPDATE
    task
SET
    status = 'queued',
    status_updated_at = now()
WHERE
    task.id = ${taskId}
RETURNING
    ${FIELDS}
`,
    );
  }

  async getAndSetToInProgress(): Promise<Task | undefined> {
    const [row] = await this.getAndSetManyToInProgress({ limit: 1 });
    return row;
  }

  async setToFailed(taskId: string): Promise<Task | undefined> {
    const [row] = await this.setManyToCompleted([{ taskId, status: "failed" }]);
    return row;
  }

  async setToSuceeded(taskId: string): Promise<Task | undefined> {
    const [row] = await this.setManyToCompleted([
      { taskId, status: "succeeded" },
    ]);
    return row;
  }

  async setManyToCompleted(config: SetAsCompleted[]): Promise<Task[]> {
    if (config.length === 0) {
      return [];
    }

    const rows = config.map((c) => {
      const j = sql.jsonb(JSON.stringify({}));
      const nullValue = sql.jsonb(null);
      return sql.fragment`
(${c.taskId}::uuid,
    ${c.status},
    ${c.status === "succeeded" ? j : nullValue},
    ${c.status === "failed" ? j : nullValue})
`;
    });

    const tasks = this.pool.connect(async (cnx) => {
      const resp = await cnx.query(
        sql.type(ZFromTaskRow)`
UPDATE
    task
SET
    status = c.status,
    success_output = c.success_output,
    error_output = c.error_output,
    status_updated_at = now(),
    finished_at = now()
FROM (
    VALUES ${sql.join(
      rows,
      sql.fragment`, `,
    )}) c (id, status, success_output, error_output)
WHERE
    task.id = c.id
RETURNING
    ${FIELDS}
`,
      );

      return Array.from(resp.rows);
    });

    return tasks;
  }

  async getAndSetManyToInProgress({
    limit,
  }: SetManyToInProgressArgs): Promise<Task[]> {
    if (limit <= 0) {
      throw new Error("limit must be greater than 0");
    }
    const tasks = this.pool.connect(async (cnx) => {
      const resp = await cnx.query(
        sql.type(ZFromTaskRow)`
UPDATE
    task
SET
    status = 'in-progress',
    status_updated_at = now()
FROM (
    SELECT
        t2.id
    FROM
        task t2
    WHERE
        t2.status = 'queued'
    LIMIT ${limit}) AS subquery
WHERE
    task.id = subquery.id
RETURNING
    ${FIELDS}
`,
      );

      return Array.from(resp.rows);
    });

    return tasks;
  }

  async insertMany(args: CreateTask[]): Promise<Task[]> {
    if (args.length === 0) {
      return [];
    }

    const inserts = args.map(
      ({ organizationId, projectId, config, fileReferenceId }: CreateTask) =>
        sql.fragment`(${organizationId}, ${projectId}, ${
          config.type
        }, 'queued', ${JSON.stringify(config)}, ${fileReferenceId ?? null})`,
    );

    const tasks = await this.pool.connect(async (cnx) => {
      const resp = await cnx.query(
        sql.type(ZFromTaskRow)`
INSERT INTO task (organization_id, project_id, task_type, status, config, file_reference_id)
    VALUES
        ${sql.join(inserts, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`,
      );

      return Array.from(resp.rows);
    });

    await Promise.all(
      tasks.map((task) =>
        this.messageBusService.enqueue({
          type: "task",
          taskId: task.id,
        }),
      ),
    );

    return tasks;
  }
}

const ZFromTaskRow = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    project_id: z.string().uuid(),
    file_reference_id: z.string().uuid().nullable(),
    task_type: ZTaskType,
    status: ZTaskStatus,
    config: ZTaskConfig,
  })
  .transform(
    (row): Task => ({
      id: row.id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      fileReferenceId: row.file_reference_id ?? undefined,
      status: row.status,
      config: ZTaskConfig.parse(row.config),
    }),
  );
