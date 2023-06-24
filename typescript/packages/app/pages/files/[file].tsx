import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BoltIcon from "@mui/icons-material/Bolt";
import ConstructionIcon from "@mui/icons-material/Construction";
import MenuIcon from "@mui/icons-material/Menu";
import { Box, IconButton, Paper, Skeleton, Tab, Tabs } from "@mui/material";
import { useRouter } from "next/router";
import React from "react";
import { DisplayExcel } from "../../src/components/file/display-excel";

import { DisplayFileChat } from "../../src/components/file/display-file-chat";
import { DisplayFileReport } from "../../src/components/file/report";
import { ViewByChunk } from "../../src/components/file/view-by-chunk";
import { useExcelAssets } from "../../src/hooks/use-fetch-excel";
import { useFetchFile } from "../../src/hooks/use-fetch-file";
import { useFetchSignedUrl } from "../../src/hooks/use-fetch-signed-url";

import GridOnIcon from "@mui/icons-material/GridOn";

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

  const { data: urls } = useExcelAssets(fileId);

  const [showPdf, setShowPdf] = React.useState(true);

  const [value, setValue] = React.useState(0);
  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const router = useRouter();

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
      {showPdf && (
        <Box display="flex" width="100%" height="100%" flexDirection="column">
          <Box display="flex" width="100%" height="auto" padding={1}>
            <IconButton onClick={() => router.back()}>
              <ArrowBackIcon />
            </IconButton>
          </Box>

          {url && showPdf ? (
            <object
              data={url}
              type="application/pdf"
              style={{ width: "100%", height: "100%", minWidth: "50%" }}
            >
              <iframe
                src={`https://docs.google.com/viewer?url=${url}&embedded=true`}
              />
            </object>
          ) : (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              animation={false}
            />
          )}
        </Box>
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
            <Tab
              icon={<AssessmentIcon />}
              iconPosition="start"
              label={"Report"}
            />
            <Tab icon={<BoltIcon />} iconPosition="start" label={"Chat"} />

            <Tab
              icon={<ConstructionIcon />}
              iconPosition="start"
              label={"Debug"}
            />

            {urls.length > 0 && (
              <Tab
                icon={<GridOnIcon />}
                iconPosition="start"
                label={"Tables"}
              />
            )}
          </Tabs>
        </Box>
        <Box
          display="flex"
          width="100%"
          height="100%"
          maxHeight="100%"
          maxWidth="100%"
          flexDirection="column"
        >
          {value === 0 && <DisplayFileReport fileReferenceId={fileId} />}
          {value === 1 && file && (
            <DisplayFileChat
              fileReferenceId={file.id}
              projectId={file.projectId}
              token={token}
            />
          )}

          {value === 2 && <ViewByChunk fileId={fileId} />}
          {value === 3 && <DisplayExcel urls={urls} />}
        </Box>
      </Box>
    </Paper>
  );
};
