import {
  ZTaskConfig,
  TaskStatus,
  ZTaskStatus,
  TaskConfig,
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

export interface TaskService {
  insertMany(configs: CreateTask[]): Promise<Task[]>;
}

const FIELDS = sql.fragment` id, organization_id, project_id, task_type, status, config`;
export class PSqlTaskService implements TaskService {
  constructor(private readonly pool: DatabasePool) {}

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
  }, "queued", ${JSON.stringify(config)}`;
}
