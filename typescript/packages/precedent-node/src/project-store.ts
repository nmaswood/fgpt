import { Project } from "@fgpt/precedent-iso";

export interface CreateProjectArgs {
  name: string;
}

export interface ProjectStore {
  list: (userId: string) => Promise<Project[]>;
  create: (args: CreateProjectArgs) => Promise<Project>;
}

export class PSqlProjectStore implements ProjectStore {
  async list(_: string): Promise<Project[]> {
    return [];
  }

  async create(_: CreateProjectArgs): Promise<Project> {
    throw new Error("foo");
  }
}
