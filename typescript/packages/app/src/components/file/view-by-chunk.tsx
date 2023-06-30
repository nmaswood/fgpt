import { ChunkStrategy } from "@fgpt/precedent-iso";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, Button, ButtonGroup, Select,Typography } from "@mui/joy";
import {
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import React from "react";

import { useFetchPlayground } from "../../hooks/use-fetch-playground";
import { useFetchTextChunk } from "../../hooks/use-fetch-text-chunk";
import { useFetchTextChunkGroup } from "../../hooks/use-fetch-text-chunk-group";
import { useGenerateOutput } from "../../hooks/use-gen-output";
import { BASIC_SCHEMA } from "./default-prompt";

export const ViewByChunk: React.FC<{ fileId: string }> = ({ fileId }) => {
  const [order, setOrder] = React.useState(0);

  const [chunkStrategy, setChunkStrategy] =
    React.useState<ChunkStrategy>("greedy_15k");

  const setChunkStrategyAndResetOrder = (chunkStrategy: ChunkStrategy) => {
    setChunkStrategy(chunkStrategy);
    setOrder(0);
  };

  const { data: textChunkGroup } = useFetchTextChunkGroup(
    chunkStrategy,
    fileId
  );

  const { data: textChunk } = useFetchTextChunk(textChunkGroup?.id, order);

  const [view, setView] = React.useState<"view" | "chat" | "test_output">(
    "chat"
  );

  return (
    <Box display="flex" width="100%" height="100%" padding={2}>
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
                onChange={(_, value) =>
                  setChunkStrategyAndResetOrder(value as ChunkStrategy)
                }
              >
                <MenuItem value="greedy_v0">Greedy 500</MenuItem>
                <MenuItem value="greedy_5k">Greedy 5000</MenuItem>
                <MenuItem value="greedy_15k">Greedy 15000</MenuItem>
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
              onChange={(_, value) => {
                if (value) {
                  setView(value);
                }
              }}
            >
              <ToggleButton value="view">Text chunks</ToggleButton>
              <ToggleButton value="chat">Prompt playground</ToggleButton>
              <ToggleButton value="test_output">Trigger output</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {textChunk && view === "view" && (
            <DisplayOutput text={textChunk.chunkText} />
          )}
          {textChunk && view === "chat" && (
            <DisplayChat textChunkId={textChunk.id} />
          )}
          {textChunk && view === "test_output" && (
            <TestOutput textChunkId={textChunk.id} />
          )}
        </Box>
      )}
    </Box>
  );
};

const DisplayOutput: React.FC<{ text: string }> = ({ text }) => {
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
    </Box>
  );
};

const DisplayChat: React.FC<{ textChunkId: string }> = ({ textChunkId }) => {
  const { data, trigger, isMutating, error } = useFetchPlayground();
  const [functionName, setFunctionName] = React.useState("parse_document");
  const [prompt, setPrompt] = React.useState(
    "You are an expert financial analyst. Parse the document for the requested information. If the information is not available, return 'Not Available'"
  );
  const [jsonSchema, setJsonSchema] = React.useState(BASIC_SCHEMA);

  const trimmed = prompt.trim();
  return (
    <Box
      display="flex"
      height="100%"
      maxHeight="100%"
      minWidth="100%"
      flexDirection="column"
      overflow="auto"
      gap={1}
    >
      <TextField
        placeholder="Function name"
        multiline
        rows={1}
        maxRows={1}
        value={functionName}
        onChange={(e) => setFunctionName(e.target.value)}
        fullWidth
      />
      <TextField
        placeholder="Prompt"
        multiline
        rows={2}
        maxRows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        fullWidth
      />
      <TextField
        placeholder="JSON Schema"
        multiline
        rows={20}
        maxRows={Infinity}
        value={jsonSchema}
        onChange={(e) => setJsonSchema(e.target.value)}
        fullWidth
      />

      <Button
        disabled={
          trimmed.length === 0 ||
          functionName.length === 0 ||
          jsonSchema.length === 0
        }
        loading={isMutating}
        onClick={() => {
          const parsed = (() => {
            try {
              return JSON.parse(jsonSchema);
            } catch (e) {
              return null;
            }
          })();
          if (parsed !== null) {
            trigger({
              textChunkId,
              prompt: trimmed,
              functionName,
              jsonSchema: parsed,
            });
          }
        }}
      >
        Submit
      </Button>
      <Box display="flex" flexDirection="column" maxWidth="100%">
        <>
          {data && (
            <pre
              style={{
                overflow: "auto",
                maxWidth: "100%",
                height: "100%",
                minHeight: "300px",
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

const TestOutput: React.FC<{ textChunkId: string }> = ({ textChunkId }) => {
  const { data, trigger, isMutating } = useGenerateOutput();

  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100%"
      height="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      gap={2}
    >
      <Button loading={isMutating} onClick={() => trigger({ textChunkId })}>
        Generate output
      </Button>

      {data && (
        <pre
          style={{
            overflow: "auto",
            maxWidth: "100%",
            height: "100%",
            minHeight: "300px",
            border: "0.5px solid lightgray",
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </Box>
  );
};
