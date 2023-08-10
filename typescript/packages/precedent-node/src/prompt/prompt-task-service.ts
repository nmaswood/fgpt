import { StatusForPrompts } from "@fgpt/precedent-iso";

import { TaskStore } from "../task-store";

export interface PromptTaskService {
  getForSlugs(fileReferenceId: string): Promise<StatusForPrompts>;
}

export class PromptTaskServiceImpl implements PromptTaskService {
  constructor(private readonly taskStore: TaskStore) {}

  async getForSlugs(fileReferenceId: string): Promise<StatusForPrompts> {
    let totalCreated = 0;

    const tasks = await this.taskStore.getByType(fileReferenceId, "run-prompt");

    const acc: StatusForPrompts = {
      kpi: "not_created",
      business_model: "not_created",
      expense_drivers: "not_created",
      ebitda_adjustments: "not_created",
    };

    for (const t of tasks) {
      if (t.config.type !== "run-prompt") {
        continue;
      }
      acc[t.config.slug] = t.status;
      totalCreated++;
    }
    return acc;
  }
}
