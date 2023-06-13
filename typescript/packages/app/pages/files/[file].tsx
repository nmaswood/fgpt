import MenuIcon from "@mui/icons-material/Menu";
import { IconButton, Paper, Tab, Tabs } from "@mui/material";
import { Box } from "@mui/system";
import { useRouter } from "next/router";
import React from "react";

import { DisplayFileChat } from "../../src/components/file/display-file-chat";
import { DisplayFileReport } from "../../src/components/file/report";
import { ViewByChunk } from "../../src/components/file/view-by-chunk";
import { useFetchSignedUrl } from "../../src/hooks/use-fetch-signed-url";

export default function DisplayFile() {
  const router = useRouter();
  const fileId = (() => {
    const fileId = router.query.file;
    return typeof fileId === "string" ? fileId : undefined;
  })();

  return (
    <Box display="flex" width="100%" height="100%">
      {fileId && <ForFileId fileId={fileId} />}
    </Box>
  );
}

const ForFileId: React.FC<{ fileId: string }> = ({ fileId }) => {
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
            <Tab label={"Analysis (Report)"} />
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
          {value === 1 && <DisplayFileReport />}
          {value === 2 && <DisplayFileChat />}
        </Box>
      </Box>
    </Paper>
  );
};
