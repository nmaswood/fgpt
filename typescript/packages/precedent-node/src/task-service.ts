import {
  TaskConfig,
  TaskOuput,
  TaskStatus,
  ZTaskConfig,
  ZTaskStatus,
} from "@fgpt/precedent-iso";
import { ZTaskType } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface Task {
  id: string;
  config: TaskConfig;
  status: TaskStatus;
  organizationId: string;
  projectId: string;
}

export interface CreateTask {
  organizationId: string;
  projectId: string;
  config: TaskConfig;
}

export interface SetAsPendingConfig {
  limit: number;
}

export interface SetAsCompleted {
  taskId: string;
  status: "succeeded" | "failed";
  output: TaskOuput;
}

export interface TaskService {
  insertMany(configs: CreateTask[]): Promise<Task[]>;
  setAsPending(config: SetAsPendingConfig): Promise<Task[]>;
}

const FIELDS = sql.fragment`task.id, task.organization_id, task.project_id, task.task_type, task.status, task.config`;
export class PSqlTaskService implements TaskService {
  constructor(private readonly pool: DatabasePool) {}

  async setAsCompleted(config: SetAsCompleted[]): Promise<Task[]> {
    if (config.length === 0) {
      return [];
    }

    const rows = config.map((c) => {
      const j = sql.jsonb(JSON.stringify(c.output));
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
      sql.fragment`, `
    )}) c (id, status, success_output, error_output)
WHERE
    task.id = c.id
RETURNING
    ${FIELDS}
`
      );

      return resp.rows.map(toTask);
    });

    return tasks;
  }

  async setAsPending({ limit }: SetAsPendingConfig): Promise<Task[]> {
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
`
      );

      return resp.rows.map(toTask);
    });

    return tasks;
  }

  async insertMany(args: CreateTask[]): Promise<Task[]> {
    if (args.length === 0) {
      return [];
    }

    const inserts = args.map(toFragment);

    const tasks = this.pool.connect(async (cnx) => {
      const resp = await cnx.query(
        sql.type(ZFromTaskRow)`
INSERT INTO task (organization_id, project_id, task_type, status, config)
    VALUES
        ${sql.join(inserts, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`
      );

      return resp.rows.map(toTask);
    });
    return tasks;
  }
}

const ZFromTaskRow = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  project_id: z.string().uuid(),
  task_type: ZTaskType,
  status: ZTaskStatus,
  config: ZTaskConfig,
});

function toTask(row: z.infer<typeof ZFromTaskRow>): Task {
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.project_id,
    status: row.status,
    config: ZTaskConfig.parse(row.config),
  };
}

function toFragment({ organizationId, projectId, config }: CreateTask) {
  return sql.fragment`(${organizationId}, ${projectId}, ${
    config.type
  }, 'queued', ${JSON.stringify(config)})`;
}
