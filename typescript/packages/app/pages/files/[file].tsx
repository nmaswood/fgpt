import { usePdf } from "@mikecousins/react-pdf";
import { Button, ButtonGroup, Paper, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useRouter } from "next/router";
import React from "react";

import { useFetchSignedUrl } from "../../src/hooks/use-fetch-signed-url";
import { useFetchTextChunk } from "../../src/hooks/use-fetch-text-chunk";
import { useFetchTextChunkGroup } from "../../src/hooks/use-fetch-text-chunk-group";

export default function Page() {
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
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <pre>{JSON.stringify(textChunkGroup, null, 2)}</pre>

      {textChunkGroup && (
        <DisplayChunks
          textGroupId={textChunkGroup.id}
          numChunks={textChunkGroup.numChunks}
        />
      )}

      {url && <DisplayPdf url={url} />}
    </Box>
  );
};

const DisplayChunks: React.FC<{ textGroupId: string; numChunks: number }> = ({
  textGroupId,
  numChunks,
}) => {
  const [order, setOrder] = React.useState(0);

  const { data } = useFetchTextChunk(textGroupId, order);

  return (
    <Paper>
      <ButtonGroup>
        <Button
          disabled={!data || order === 0}
          onClick={() => setOrder((order) => order - 1)}
        >
          Prev
        </Button>
        <Button
          disabled={!data || order + 1 === numChunks}
          onClick={() => setOrder((order) => order + 1)}
        >
          Next
        </Button>
      </ButtonGroup>
      {data && <Typography>{data.chunkText}</Typography>}
    </Paper>
  );
};

const DisplayPdf: React.FC<{ url: string }> = React.memo(({ url }) => {
  const [page, setPage] = React.useState(1);
  const canvasRef = React.useRef(null);

  const { pdfDocument } = usePdf({
    file: url,
    page,
    canvasRef,
  });

  return (
    <Paper>
      {pdfDocument && pdfDocument.numPages && (
        <Box display="flex" width="100%" justifyContent="center">
          <ButtonGroup>
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button
              disabled={page === pdfDocument.numPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </ButtonGroup>
        </Box>
      )}
      <canvas ref={canvasRef} />
    </Paper>
  );
});
DisplayPdf.displayName = "DisplayPdf";
