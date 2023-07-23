import AssessmentIcon from "@mui/icons-material/AssessmentOutlined";
import AutoModeOutlinedIcon from "@mui/icons-material/AutoModeOutlined";
import {
  Box,
  CircularProgress,
  List,
  ListDivider,
  ListItem,
  ListItemButton,
  ListItemDecorator,
} from "@mui/joy";
import { useRouter } from "next/router";
import React from "react";

import { DisplayAsset } from "../../src/components/file/display-asset";
import { DisplayFileChat } from "../../src/components/file/display-file-chat";
import { DisplayProgress } from "../../src/components/file/display-progress";
import { DisplayFileReport } from "../../src/components/file/display-report";
import { useTabState } from "../../src/components/file/use-tab-state";
import { Navbar } from "../../src/components/navbar";
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
    <Box
      display="flex"
      width="100%"
      height="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
    >
      {fileId && token && <ForFileId fileId={fileId} token={token} />}
    </Box>
  );
}

const ForFileId: React.FC<{ fileId: string; token: string }> = ({
  fileId,
  token,
}) => {
  const { data: file } = useFetchFileToRender(fileId);

  const [tab, setTab] = useTabState();

  return (
    <Box
      display="flex"
      width="100%"
      height="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      flexDirection="column"
    >
      <Navbar
        loading={!file}
        project={
          file
            ? {
                id: file.projectId,
                name: file.projectName,
              }
            : undefined
        }
        fileName={file ? file.fileName : undefined}
      />
      <Box
        display="flex"
        width="100%"
        height="100%"
        maxHeight="100%"
        maxWidth="100%"
        overflow="auto"
      >
        <Box
          height="100%"
          width="100%"
          maxHeight="100%"
          maxWidth="100%"
          display="flex"
        >
          <Box display="flex" gap={3}>
            <List
              variant="outlined"
              size="sm"
              sx={{
                width: "40px",
                "&.MuiList-root": {
                  borderRadius: 0,
                },
              }}
            >
              <ListItem>
                <ListItemButton
                  onClick={() => setTab("report")}
                  selected={tab === "report"}
                >
                  <ListItemDecorator>
                    <AssessmentIcon />
                  </ListItemDecorator>
                </ListItemButton>
              </ListItem>
              <ListDivider
                sx={{
                  margin: 0,
                }}
              />
              <ListItem>
                <ListItemButton
                  onClick={() => setTab("chat")}
                  selected={tab === "chat"}
                >
                  <ListItemDecorator>
                    <ChatOutlined fontSize="small" />
                  </ListItemDecorator>
                </ListItemButton>
              </ListItem>

              <ListDivider
                sx={{
                  margin: 0,
                }}
              />
              <ListItem>
                <ListItemButton
                  onClick={() => setTab("progress")}
                  selected={tab === "progress"}
                >
                  <ListItemDecorator>
                    <AutoModeOutlinedIcon />
                  </ListItemDecorator>
                </ListItemButton>
              </ListItem>
              <ListDivider
                sx={{
                  margin: 0,
                }}
              />
            </List>
          </Box>
          <Box
            display="flex"
            width="100%"
            height="100%"
            maxHeight="100%"
            maxWidth="100%"
            flexDirection="column"
          >
            {tab === "progress" && file && (
              <DisplayProgress fileReferenceId={file.id} />
            )}
            {tab === "report" && file && <DisplayFileReport file={file} />}
            {tab === "chat" && file && (
              <DisplayFileChat
                fileReferenceId={fileId}
                projectId={file.projectId}
                token={token}
              />
            )}
          </Box>
        </Box>
        <Box
          display="flex"
          width="100%"
          height="100%"
          flexDirection="column"
          padding={2}
          bgcolor="neutral.100"
        >
          {file ? (
            <DisplayAsset fileToRender={file} />
          ) : (
            <Box
              display="flex"
              width="100%"
              height="100%"
              justifyContent="center"
              alignItems="center"
            >
              <CircularProgress />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
