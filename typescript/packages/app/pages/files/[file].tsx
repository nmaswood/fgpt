import MenuIcon from "@mui/icons-material/Menu";
import { Box, IconButton, Paper, Tab, Tabs } from "@mui/material";
import { useRouter } from "next/router";
import React from "react";

import { DisplayFileChat } from "../../src/components/file/display-file-chat";
import { DisplayFileReport } from "../../src/components/file/report";
import { ViewByChunk } from "../../src/components/file/view-by-chunk";
import { useFetchFile } from "../../src/hooks/use-fetch-file";
import { useFetchSignedUrl } from "../../src/hooks/use-fetch-signed-url";
import { useFetchToken } from "../../src/hooks/use-fetch-token";
export default function DisplayFile() {
  const router = useRouter();

  const { data: token } = useFetchToken();
  const fileId = (() => {
    const fileId = router.query.file;
    return typeof fileId === "string" ? fileId : undefined;
  })();

  return (
    <Box display="flex" width="100%" height="100%">
      {fileId && token && <ForFileId fileId={fileId} token={token} />}
    </Box>
  );
}

const ForFileId: React.FC<{ fileId: string; token: string }> = ({
  fileId,
  token,
}) => {
  const { data: file } = useFetchFile(fileId);
  const { data: url } = useFetchSignedUrl(fileId);

  const [showPdf, setShowPdf] = React.useState(true);

  const [value, setValue] = React.useState(0);
  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Paper
      sx={{
        display: "flex",
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        maxWidth: "100%",
      }}
    >
      {url && showPdf && (
        <object
          data={url}
          type="application/pdf"
          style={{ width: "100%", height: "100%", minWidth: "50%" }}
        >
          <iframe
            src={`https://docs.google.com/viewer?url=${url}&embedded=true`}
          />
        </object>
      )}
      <Box
        height="100%"
        width="100%"
        maxHeight="100%"
        maxWidth="100%"
        display="flex"
        flexDirection="column"
      >
        <Box display="flex" gap={3} paddingLeft={1}>
          <IconButton onClick={() => setShowPdf((prev) => !prev)}>
            <MenuIcon />
          </IconButton>
          <Tabs
            value={value}
            onChange={handleChange}
            textColor="secondary"
            indicatorColor="secondary"
          >
            <Tab label={"Text chunks"} />
            <Tab label={"Report"} />
            <Tab label={"Chat"} />
          </Tabs>
        </Box>
        <Box
          display="flex"
          width="100%"
          height="100%"
          maxHeight="100%"
          maxWidth="100%"
          flexDirection="column"
          padding={2}
        >
          {value === 0 && <ViewByChunk fileId={fileId} />}
          {value === 1 && <DisplayFileReport fileReferenceId={fileId} />}
          {value === 2 && file && (
            <DisplayFileChat
              fileReferenceId={file.id}
              projectId={file.projectId}
              token={token}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
};
