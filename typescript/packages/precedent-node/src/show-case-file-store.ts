import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface ShowCaseFile {
  id: string;
  projectId: string;
  fileReferenceId: string;
}
export interface ShowCaseFileStore {
  set(projectId: string, fileReferenceId: string): Promise<ShowCaseFile>;
  get(projectId: string): Promise<ShowCaseFile | undefined>;
}

const FIELDS = sql.fragment`id, project_id, file_reference_id`;
export class PsqlShowCaseFileStore {
  constructor(private readonly pool: DatabasePool) {}

  async set(projectId: string, fileReferenceId: string): Promise<ShowCaseFile> {
    const res = await this.pool.maybeOne(
      sql.type(ZShowCaseFileRow)`
INSERT INTO show_case_file (project_id, file_reference_id)
    VALUES (${projectId}, ${fileReferenceId})
ON CONFLICT (project_id)
    DO UPDATE SET
        file_reference_id = ${fileReferenceId}
    RETURNING
        ${FIELDS}
`,
    );
    if (res) {
      return res;
    }
    const value = await this.get(projectId);
    if (!value) {
      throw new Error("illeal state");
    }
    return value;
  }

  async get(projectId: string): Promise<ShowCaseFile | undefined> {
    const value = await this.pool.maybeOne(sql.type(ZShowCaseFileRow)`
SELECT
    ${FIELDS}
FROM
    show_case_file
WHERE
    project_id = ${projectId}
`);
    return value ?? undefined;
  }
}

const ZShowCaseFileRow = z
  .object({
    id: z.string(),
    project_id: z.string(),
    file_reference_id: z.string(),
  })

  .transform(
    (row): ShowCaseFile => ({
      id: row.id,
      projectId: row.project_id,
      fileReferenceId: row.file_reference_id,
    }),
  );
