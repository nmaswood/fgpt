import { ChunkStrategy, Outputs } from "@fgpt/precedent-iso";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { LoadingButton } from "@mui/lab";
import {
  Button,
  ButtonGroup,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import React from "react";

import { useFetchOutputForChunk } from "../../hooks/use-fetch-output";
import { useFetchPlayground } from "../../hooks/use-fetch-playground";
import { useFetchTextChunk } from "../../hooks/use-fetch-text-chunk";
import { useFetchTextChunkGroup } from "../../hooks/use-fetch-text-chunk-group";
import { GUARD_RAILS_PROMPT } from "./default-prompt";

export const ViewByChunk: React.FC<{ fileId: string }> = ({ fileId }) => {
  const [order, setOrder] = React.useState(0);

  const [chunkStrategy, setChunkStrategy] =
    React.useState<ChunkStrategy>("greedy_5k");

  const setChunkStrategyAndResetOrder = (chunkStrategy: ChunkStrategy) => {
    setChunkStrategy(chunkStrategy);
    setOrder(0);
  };

  const { data: textChunkGroup } = useFetchTextChunkGroup(
    chunkStrategy,
    fileId
  );

  const { data: textChunk } = useFetchTextChunk(textChunkGroup?.id, order);

  const { data: outputs } = useFetchOutputForChunk(textChunk?.id);

  const [view, setView] = React.useState<"view" | "chat">("view");

  return (
    <Box display="flex" width="100%" height="100%">
      {textChunkGroup && (
        <Box
          display="flex"
          gap={2}
          flexDirection="column"
          width="100%"
          height="100%"
        >
          <Box display="flex" gap={2} alignItems="center">
            <FormControl>
              <InputLabel>Chunk strategy</InputLabel>
              <Select
                value={chunkStrategy}
                label="Chunk strategy"
                onChange={(e) =>
                  setChunkStrategyAndResetOrder(e.target.value as ChunkStrategy)
                }
              >
                <MenuItem value="greedy_v0">Greedy 500</MenuItem>
                <MenuItem value="greedy_5k">Greedy 5000</MenuItem>
              </Select>
            </FormControl>
            <Box display="flex" flexDirection="column">
              <Typography>
                Chunk: {order + 1} / {textChunkGroup.numChunks}
              </Typography>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <ButtonGroup>
                  <Button
                    disabled={order === 0}
                    onClick={() => setOrder((order) => order - 1)}
                    startIcon={<ArrowBackIcon />}
                  >
                    Prev
                  </Button>
                  <Button
                    disabled={order + 1 === textChunkGroup.numChunks}
                    onClick={() => setOrder((order) => order + 1)}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Next
                  </Button>
                </ButtonGroup>
              </Box>
            </Box>
            <ToggleButtonGroup
              color="primary"
              value={view}
              exclusive
              onChange={(_, value) => setView(value)}
            >
              <ToggleButton value="view">Data overview</ToggleButton>
              <ToggleButton value="chat">Prompt exploration</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {textChunk && outputs && view === "view" && (
            <DisplayOutput text={textChunk.chunkText} outputs={outputs} />
          )}
          {textChunk && view === "chat" && (
            <DisplayChat textChunkId={textChunk.id} />
          )}
        </Box>
      )}
    </Box>
  );
};

const DisplayOutput: React.FC<{ text: string; outputs: Outputs.Outputs }> = ({
  text,
  outputs,
}) => {
  return (
    <Box
      display="grid"
      gap={2}
      height="100%"
      maxHeight="100%"
      gridTemplateRows="1fr 1fr"
    >
      <Card
        variant="outlined"
        sx={{
          padding: 1,
          overflow: "auto",
          maxHeight: "300px",
          minHeight: "100%",
          maxWidth: "100%",
        }}
      >
        <Typography overflow="auto">{text}</Typography>
      </Card>
      <Card
        variant="outlined"
        sx={{
          padding: 1,
          overflow: "auto",
          minHeight: "100%",
          maxHeight: "100%",
          maxWidth: "100%",
        }}
      >
        <pre>
          <code>{JSON.stringify(outputs, null, 2)}</code>
        </pre>
      </Card>
    </Box>
  );
};

const DisplayChat: React.FC<{ textChunkId: string }> = ({ textChunkId }) => {
  const { data, trigger, isMutating, error } = useFetchPlayground();
  const [prompt, setPrompt] = React.useState(GUARD_RAILS_PROMPT);

  const trimmed = prompt.trim();
  return (
    <Box
      display="flex"
      height="100%"
      maxHeight="100%"
      minWidth="100%"
      flexDirection="column"
      overflow="auto"
    >
      <TextField
        placeholder="Use {{document}} to template in the text chunk"
        multiline
        rows={20}
        maxRows={Infinity}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        fullWidth
      />
      <LoadingButton
        disabled={trimmed.length === 0}
        loading={isMutating}
        onClick={() => trigger({ textChunkId, prompt: trimmed })}
      >
        Submit
      </LoadingButton>
      <Box display="flex" flexDirection="column" maxWidth="100%">
        <>
          {data && (
            <pre
              style={{
                overflow: "auto",
                maxWidth: "100%",
                height: "100%",
                border: "0.5px solid lightgray",
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
          {error && <pre>{JSON.stringify(error, null, 2)}</pre>}
        </>
      </Box>
    </Box>
  );
};
