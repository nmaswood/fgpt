// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace RenderShowCaseFile {
  export type File = NotSet | Set;

  export interface NotSet {
    type: "not_set";
  }

  export const NOT_SET = {
    type: "not_set",
  } as const;

  export interface Set {
    type: "set";
    url: string | undefined;
  }
}
