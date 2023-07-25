import { ChatOutlined } from "@mui/icons-material";
import AssessmentIcon from "@mui/icons-material/AssessmentOutlined";
import AutoModeOutlinedIcon from "@mui/icons-material/AutoModeOutlined";
import {
  Box,
  List,
  ListDivider,
  ListItem,
  ListItemButton,
  Typography,
} from "@mui/joy";
import { useRouter } from "next/router";
import React from "react";

import { DisplayAsset } from "../../src/components/file/display-asset";
import { DisplayFileChat } from "../../src/components/file/display-file-chat";
import { DisplayProgress } from "../../src/components/file/display-progress";
import { DisplayFileReport } from "../../src/components/file/display-report";
import { useTabState } from "../../src/components/file/use-tab-state";
import { Navbar } from "../../src/components/navbar";
import { useFetchDisplayFile } from "../../src/hooks/use-fetch-display-file";
import { useFetchFileToRender } from "../../src/hooks/use-fetch-file-to-render";
import { useFetchMe } from "../../src/hooks/use-fetch-me";
import { useFetchToken } from "../../src/hooks/use-fetch-token";
import styles from "./file.module.css";

export default function DisplayFile() {
  const router = useRouter();

  const fileId = (() => {
    const fileId = router.query.file;
    return typeof fileId === "string" ? fileId : undefined;
  })();

  return <>{fileId && <ForFileId fileId={fileId} />}</>;
}

const ForFileId: React.FC<{ fileId: string }> = ({ fileId }) => {
  const { data: file } = useFetchFileToRender(fileId);
  const { data: token } = useFetchToken();
  const { data: displayFile } = useFetchDisplayFile(fileId);
  const { data: user } = useFetchMe();

  const [tab, setTab] = useTabState();

  const showAdminOnly = (user && user.role === "superadmin") ?? false;

  const isExcel = (file && file.type === "excel") ?? false;

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
                  orientation="vertical"
                >
                  <AssessmentIcon />
                  <Typography
                    sx={{
                      fontSize: "10px",
                      ...(tab === "report"
                        ? {
                            color: "primary.600",
                          }
                        : {}),
                    }}
                  >
                    Report
                  </Typography>
                </ListItemButton>
              </ListItem>
              <ListDivider
                sx={{
                  margin: 0,
                }}
              />
              {file && file.type === "pdf" && (
                <>
                  <ListItem>
                    <ListItemButton
                      onClick={() => setTab("chat")}
                      selected={tab === "chat"}
                      orientation="vertical"
                    >
                      <ChatOutlined fontSize="small" />
                      <Typography
                        sx={{
                          fontSize: "10px",
                          ...(tab === "chat"
                            ? {
                                color: "primary.600",
                              }
                            : {}),
                        }}
                      >
                        Chat
                      </Typography>
                    </ListItemButton>
                  </ListItem>

                  <ListDivider
                    sx={{
                      margin: 0,
                    }}
                  />
                </>
              )}
              {showAdminOnly && (
                <>
                  <ListItem>
                    <ListItemButton
                      onClick={() => setTab("progress")}
                      selected={tab === "progress"}
                      orientation="vertical"
                    >
                      <AutoModeOutlinedIcon />
                      <Typography
                        sx={{
                          fontSize: "10px",
                          ...(tab === "progress"
                            ? {
                                color: "primary.600",
                              }
                            : {}),
                        }}
                      >
                        Progress
                      </Typography>
                    </ListItemButton>
                  </ListItem>
                  <ListDivider
                    sx={{
                      margin: 0,
                    }}
                  />
                </>
              )}
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
            {tab === "report" && file && (
              <DisplayFileReport file={file} showAdminOnly={showAdminOnly} />
            )}
            {tab === "chat" && file && token && (
              <DisplayFileChat
                fileReferenceId={fileId}
                projectId={file.projectId}
                token={token}
              />
            )}
          </Box>
        </Box>
        {!isExcel && (
          <Box
            width="100%"
            height="100%"
            flexDirection="column"
            padding={2}
            bgcolor="neutral.100"
            className={styles["display-asset"]}
          >
            {displayFile && displayFile.type === "pdf" && (
              <DisplayAsset signedUrl={displayFile.signedUrl} />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
