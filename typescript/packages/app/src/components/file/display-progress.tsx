// write a component that displays the progress of a pdf download

import { FileToRender, ProgressTaskStatus } from "@fgpt/precedent-iso";
import { Box, Table, Typography } from "@mui/joy";

export const DisplayProgress: React.FC<{
  file: FileToRender.File;
}> = ({ file }) => {
  return (
    <Box display="flex" width="50%" padding={2}>
      <Dispatch file={file} />
    </Box>
  );
};

const Dispatch: React.FC<{
  file: FileToRender.File;
}> = ({ file }) => {
  const entries = Object.entries(file.progress.forTask);
  const display = getDisplayTasks(entries);

  return <DisplayProgressInner tasks={display} />;
};

const DisplayProgressInner: React.FC<{ tasks: DisplayTask[] }> = ({
  tasks,
}) => {
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
    const displayStatus = STATUS_MAP[progress.type] ?? progress.type;
    acc.push({ displayName, displayStatus });
  }
  return acc;
}

const DISPLAY_NAME_MAP: Record<string, string> = {
  embeddingChunk: "Chunk text for embeddings",
  reportChunk: "Chunk text for report",
  report: "Generate report",
  upsertEmbeddings: "Generate embeddings",
  extractTable: "Extract tables",
  analyzeTable: "Analyze tables (if present)",
};

const STATUS_MAP: Record<string, string> = {
  queued: "Queued",
  "in-progress": "In progress",
  succeeded: "Succeeded",
  failed: "Failed",
};
