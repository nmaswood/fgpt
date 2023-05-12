import { Subject } from "@fgpt/precedent-iso";
import { User } from "@fgpt/precedent-iso/src/subject";

export interface Project {
  id: string;
  name: string;
}

export interface CreateProjectArgs {
  name: string;
}

export interface ProjectStore {
  list: (subject: Subject) => Promise<Project[]>;
  create: (args: CreateProjectArgs) => Promise<Project>;
}

export class PSqlProjectStore implements ProjectStore {
  async list(_: User): Promise<Project[]> {
    throw new Error("foo");
  }

  async create(_: CreateProjectArgs): Promise<Project> {
    throw new Error("foo");
  }
}
