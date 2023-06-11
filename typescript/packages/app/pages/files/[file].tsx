import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Button, ButtonGroup, Card, Paper, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useRouter } from "next/router";
import React from "react";

import { useFetchOutput } from "../../src/hooks/use-fetch-output";
import { useFetchSignedUrl } from "../../src/hooks/use-fetch-signed-url";
import { useFetchTextChunk } from "../../src/hooks/use-fetch-text-chunk";
import { useFetchTextChunkGroup } from "../../src/hooks/use-fetch-text-chunk-group";

export default function DisplayFile() {
  const router = useRouter();
  const fileId = (() => {
    const fileId = router.query.file;
    return typeof fileId === "string" ? fileId : undefined;
  })();

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      {fileId && <ForFileId fileId={fileId} />}
    </Box>
  );
}

const ForFileId: React.FC<{ fileId: string }> = ({ fileId }) => {
  const { data: textChunkGroup } = useFetchTextChunkGroup(fileId);
  const { data: url } = useFetchSignedUrl(fileId);
  const [order, setOrder] = React.useState(0);
  const { data: outputs } = useFetchOutput(fileId);
  return (
    <Paper sx={{ display: "flex", width: "100%", height: "100%" }}>
      {url && (
        <object
          data={url}
          type="application/pdf"
          style={{ width: "100%", height: "100%" }}
        >
          <iframe
            src={`https://docs.google.com/viewer?url=${url}&embedded=true`}
          />
        </object>
      )}
      <Box width="600px" height="100%" display="flex" flexDirection="column">
        <Box display="flex" width="100%" height="50%">
          {textChunkGroup && (
            <DisplayTextChunkGroup
              textGroupId={textChunkGroup.id}
              numChunks={textChunkGroup.numChunks}
              order={order}
              onPrev={() => setOrder((order) => order - 1)}
              onNext={() => setOrder((order) => order + 1)}
            />
          )}
        </Box>

        <Box display="flex" width="100%" height="50%" overflow="auto">
          <pre>
            {JSON.stringify(
              {
                summaries: outputs.summaries.map((s) => s.summary),
                questions: outputs.questions.map((s) => s.question),
              },
              null,
              2
            )}
          </pre>
        </Box>
      </Box>
    </Paper>
  );
};

const DisplayTextChunkGroup: React.FC<{
  textGroupId: string;
  numChunks: number;
  order: number;
  onPrev: () => void;
  onNext: () => void;
}> = ({ textGroupId, numChunks, order, onPrev, onNext }) => {
  const { data } = useFetchTextChunk(textGroupId, order);

  return (
    <Card sx={{ display: "flex", padding: 3, gap: 2, flexDirection: "column" }}>
      <Box
        display="flex"
        width="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography>
          Chunk: {order + 1} / {numChunks}
        </Typography>
        <ButtonGroup>
          <Button
            disabled={!data || order === 0}
            onClick={onPrev}
            startIcon={<ArrowBackIcon />}
          >
            Prev
          </Button>
          <Button
            disabled={!data || order + 1 === numChunks}
            onClick={onNext}
            endIcon={<ArrowForwardIcon />}
          >
            Next
          </Button>
        </ButtonGroup>
      </Box>
      {data && <Typography>{data.chunkText}</Typography>}
    </Card>
  );
};
