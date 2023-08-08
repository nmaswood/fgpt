import { PromptSlug, TaskStatus } from "@fgpt/precedent-iso";

import { TaskStore } from "../task-store";

interface GetForSlugArgs {
  fileReferenceId: string;
  slug: PromptSlug;
}
export interface PromptTaskService {
  getForSlug(args: GetForSlugArgs): Promise<PromptTask[]>;
}

export interface PromptTask {
  id: string;
  status: TaskStatus;
}

export class PromptTaskServiceImpl implements PromptTaskService {
  constructor(private readonly taskStore: TaskStore) {}

  async getForSlug({
    fileReferenceId,
    slug,
  }: GetForSlugArgs): Promise<PromptTask[]> {
    const acc: PromptTask[] = [];
    const tasks = await this.taskStore.getByType(fileReferenceId, "run-prompt");

    for (const task of tasks) {
      if (task.config.type === "run-prompt" && task.config.slug === slug) {
        acc.push({
          id: task.id,
          status: task.status,
        });
      }
    }
    return acc;
  }
}
