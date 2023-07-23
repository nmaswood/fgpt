import {
  ProgressForExcelTasks,
  ProgressForPdfTasks,
  ProgressTaskStatus,
} from "@fgpt/precedent-iso";
import { Box, Table, Typography } from "@mui/joy";

import { useFetchProgress } from "../../hooks/use-fetch-progress";

export const DisplayProgress: React.FC<{
  fileReferenceId: string;
}> = ({ fileReferenceId }) => {
  const { data } = useFetchProgress(fileReferenceId);

  return (
    <Box display="flex" width="100%" padding={2}>
      {data && <DisplayProgressInner progress={data} />}
    </Box>
  );
};

const DisplayProgressInner: React.FC<{
  progress: ProgressForPdfTasks | ProgressForExcelTasks;
}> = ({ progress }) => {
  const entries = Object.entries(progress);
  const tasks = getDisplayTasks(entries);
  return (
    <Table variant="outlined">
      <thead>
        <tr>
          <th>
            <Typography>Task name</Typography>
          </th>
          <th>
            <Typography>Status</Typography>
          </th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.displayName}>
            <td>
              <Typography>{task.displayName}</Typography>
            </td>
            <td>
              <Typography>{task.displayStatus}</Typography>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

interface DisplayTask {
  displayName: string;
  displayStatus: string;
}

function getDisplayTasks(
  entries: [string, ProgressTaskStatus][],
): DisplayTask[] {
  const acc: DisplayTask[] = [];
  for (const [key, value] of entries) {
    const progress = value as ProgressTaskStatus;
    const displayName = DISPLAY_NAME_MAP[key] ?? key;
    const displayStatus = STATUS_MAP[progress] ?? "foo";
    acc.push({ displayName, displayStatus });
  }
  return acc;
}

const DISPLAY_NAME_MAP: Record<string, string> = {
  embeddingChunk: "Chunk text for embeddings",
  reportChunk: "Chunk text for report",
  report: "Generate report",
  scan: "Scan",
  longFormReport: "Long form report",
  longFormReportChunk: "Chunk text for long form report",
  upsertEmbeddings: "Generate embeddings",
  extractTable: "Extract tables",
  analyzeTable: "Analyze tables (if present)",
  analyzeTableGPT: "Analyze tables (GPT)",
  analyzeTableClaude: "Analyze tables (Claude)",
  thumbnail: "Thumbnail generation",
};

const STATUS_MAP: Record<string, string> = {
  task_does_not_exist: "Task is pending creation",
  queued: "Queued",
  "in-progress": "In progress",
  succeeded: "Succeeded",
  failed: "Failed",
};
