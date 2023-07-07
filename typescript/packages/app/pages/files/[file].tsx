import ArrowBackIcon from "@mui/icons-material/ArrowBackOutlined";
import AssessmentIcon from "@mui/icons-material/AssessmentOutlined";
import AutoModeOutlinedIcon from "@mui/icons-material/AutoModeOutlined";
import BoltIcon from "@mui/icons-material/BoltOutlined";
import ConstructionIcon from "@mui/icons-material/ConstructionOutlined";
import MenuIcon from "@mui/icons-material/MenuOutlined";
import TableViewIcon from "@mui/icons-material/TableViewOutlined";
import {
  Box,
  IconButton,
  ListItemDecorator,
  Tab,
  TabList,
  Tabs,
} from "@mui/joy";
import { Skeleton } from "@mui/material";
import { useRouter } from "next/router";
import React from "react";

import { DisplayAsset } from "../../src/components/file/display-asset";
import { DisplayDerived } from "../../src/components/file/display-derived";
import { DisplayFileChat } from "../../src/components/file/display-file-chat";
import { DisplayProgress } from "../../src/components/file/display-progress";
import { DisplayFileReport } from "../../src/components/file/report";
import { useTabState } from "../../src/components/file/use-tab-state";
import { ViewByChunk } from "../../src/components/file/view-by-chunk";
import { useFetchFileToRender } from "../../src/hooks/use-fetch-file-to-render";
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
  const { data: file } = useFetchFileToRender(fileId);

  const [showAsset, setShowAsset] = React.useState(true);

  const [tab, setTab] = useTabState();

  const router = useRouter();

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        maxWidth: "100%",
        overflow: "auto",
      }}
    >
      {showAsset && (
        <Box display="flex" width="100%" height="100%" flexDirection="column">
          <Box display="flex" width="100%" height="auto" padding={1}>
            <IconButton onClick={() => router.back()}>
              <ArrowBackIcon />
            </IconButton>
          </Box>

          {file ? (
            <DisplayAsset fileToRender={file} />
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
          <IconButton onClick={() => setShowAsset((prev) => !prev)}>
            <MenuIcon />
          </IconButton>
          <Tabs value={tab} onChange={(_, newValue) => setTab(newValue as any)}>
            <TabList>
              <Tab value="progress">
                <ListItemDecorator>
                  <AutoModeOutlinedIcon />
                </ListItemDecorator>
                Progress
              </Tab>
              <Tab value="report">
                <ListItemDecorator>
                  <AssessmentIcon />
                </ListItemDecorator>
                Report
              </Tab>
              {file && file.type === "pdf" && (
                <Tab value="chat">
                  <ListItemDecorator>
                    <BoltIcon />
                  </ListItemDecorator>
                  Chat
                </Tab>
              )}
              {file && file.type === "pdf" && file.derived && (
                <Tab value="tables">
                  <ListItemDecorator>
                    <TableViewIcon />
                  </ListItemDecorator>
                  Table
                </Tab>
              )}
              {file && file.type === "pdf" && (
                <Tab value="debug">
                  <ListItemDecorator>
                    <ConstructionIcon />
                  </ListItemDecorator>
                  Debug
                </Tab>
              )}
            </TabList>
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
          {tab === "progress" && file && <DisplayProgress file={file} />}
          {tab === "report" && file && <DisplayFileReport file={file} />}
          {tab === "chat" && file && (
            <DisplayFileChat
              fileReferenceId={fileId}
              projectId={file.projectId}
              token={token}
            />
          )}

          {tab === "debug" && <ViewByChunk fileId={fileId} />}
          {tab === "tables" && file && file.type == "pdf" && file.derived && (
            <DisplayDerived derived={file.derived} />
          )}
        </Box>
      </Box>
    </Box>
  );
};
