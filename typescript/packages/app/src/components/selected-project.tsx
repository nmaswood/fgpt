import "@uppy/dashboard/dist/style.min.css";

import { MAX_FILE_SIZE_BYTES, ZFileUpload } from "@fgpt/precedent-iso";
import { Project } from "@fgpt/precedent-iso";
import { ChatOutlined } from "@mui/icons-material";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import {
  Box,
  CircularProgress,
  List,
  ListDivider,
  ListItem,
  ListItemButton,
  Typography,
} from "@mui/joy";
import AwsS3 from "@uppy/aws-s3";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import { useRouter } from "next/router";
import React from "react";
import { z } from "zod";

import { useCreateChat } from "../hooks/use-create-chat";
import { useDeleteChat } from "../hooks/use-delete-chat";
import { useEditChat } from "../hooks/use-edit-chat";
import { useFetchFiles } from "../hooks/use-fetch-files";
import { useFetchShowCaseFile } from "../hooks/use-fetch-show-case-file";
import { useFetchChats } from "../hooks/use-list-chats";
import { useSampleForProject } from "../hooks/use-sample-questions";
import { DisplayChat } from "./chat";
import { DataRoomSummary } from "./data-room-summary";
import { DisplayFiles } from "./display-files/display-files";
import { UploadFilesButton } from "./upload-files-button";

const ZTab = z.enum(["data", "chat"]);
type Tab = z.infer<typeof ZTab>;

const useTabState = () => {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>(() => {
    const action = ZTab.safeParse(router.query.action);
    if (action.success) {
      return action.data;
    }
    return "data";
  });

  React.useEffect(() => {
    if (
      router.query.action === tab ||
      (router.query.action === undefined && tab === "data")
    ) {
      return;
    }
    router.query.action = tab;
    router.replace(router);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return [tab, setTab] as const;
};

export const SelectedProject: React.FC<{
  project: Project | undefined;
  token: string | undefined;
  loading: boolean;
}> = ({ token, project, loading }) => {
  const [tab, setTab] = useTabState();

  const uppy = React.useMemo(() => {
    return new Uppy({
      restrictions: {
        allowedFileTypes: [".pdf", ".xlsx"],
        minFileSize: 1,
        maxFileSize: MAX_FILE_SIZE_BYTES,
      },
    })
      .use(AwsS3, {
        limit: 1,
        timeout: 1000 * 60 * 60,
        async getUploadParameters(file) {
          // Send a request to our signing endpoint.
          const response = await fetch(`/api/proxy/v1/files/upload-presigned`, {
            method: "post",
            headers: {
              accept: "application/json",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              projectId: file.meta.projectId,
            }),
          });
          return await response.json();
        },
      })
      .use(Dashboard, {
        inline: false,
        proudlyDisplayPoweredByUppy: false,
        height: 470,
        browserBackButtonClose: false,
      })
      .on("upload-success", async (file) => {
        const fileData = ZFileUpload.parse({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          storageUrl: (file as any).xhrUpload.endpoint,
          projectId: file?.meta.projectId,
          fileSize: file?.size,
          contentType: file?.type,
          name: file?.meta.name,
        });

        const res = await fetch(`/api/proxy/v1/files/upload`, {
          method: "post",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify(fileData),
        });
        await res.json();
      });
  }, []);

  const projectId = project?.id;
  React.useEffect(() => {
    if (!projectId) {
      return;
    }
    uppy.cancelAll();

    uppy.on("file-added", (file) => {
      uppy.setFileMeta(file.id, {
        projectId,
      });
      uppy.setMeta({ projectId });
    });
  }, [uppy, projectId]);

  const openUppyModal = () => {
    const dashboard = uppy.getPlugin("Dashboard");
    if (dashboard) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dashboard as any).openModal();
    }
  };
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    return () => {
      // dumb hack to get around uppy bug
      if (mounted) {
        uppy.close();
      }
    };
  }, [uppy, mounted]);

  return (
    <Box
      display="flex"
      height="100%"
      width="100%"
      maxHeight="100%"
      overflow="auto"
    >
      <Box display="flex">
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
              orientation="vertical"
              onClick={() => setTab("data")}
              selected={tab === "data"}
            >
              <FolderOutlinedIcon fontSize="small" />
              <Typography
                sx={{
                  fontSize: "10px",
                  ...(tab === "data"
                    ? {
                        color: "primary.600",
                      }
                    : {}),
                }}
              >
                Data
              </Typography>
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

          <ListDivider />
        </List>
      </Box>
      {loading && (
        <Box
          display="flex"
          width="100%"
          height="100%"
          alignItems="center"
          justifyContent="center"
        >
          <CircularProgress />
        </Box>
      )}
      {project && token && (
        <SelectedProjectInner
          project={project}
          token={token}
          value={tab}
          uppy={uppy}
          openUppyModal={openUppyModal}
        />
      )}
    </Box>
  );
};

const SelectedProjectInner: React.FC<{
  project: Project;
  token: string;
  value: Tab;
  uppy: Uppy;
  openUppyModal: () => void;
}> = ({ token, project, value, uppy, openUppyModal }) => {
  const { data: showCaseFile, isLoading: showCaseFileLoading } =
    useFetchShowCaseFile(project.id);

  const { data: files, isLoading: filesLoading } = useFetchFiles(project.id);

  const {
    data: chats,
    isLoading: chatsLoading,
    mutate: refetchChats,
  } = useFetchChats("project", project.id);
  const { trigger: createChat, isMutating: createChatIsLoading } =
    useCreateChat("project", project.id);

  const { trigger: deleteChat, isMutating: isDeleteChatMutating } =
    useDeleteChat("project", project.id);

  const { trigger: editChat, isMutating: isEditingChatMutating } = useEditChat(
    "project",
    project.id,
  );
  const { data: questions } = useSampleForProject(project.id);

  return (
    <>
      {value === "data" && (
        <>
          {filesLoading && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="100%"
              height="100%"
              maxHeight="100%"
              overflow="auto"
            >
              <CircularProgress />
            </Box>
          )}

          {!filesLoading && files.length === 0 && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="100%"
              height="100%"
              maxHeight="100%"
              overflow="auto"
            >
              <UploadFilesButton
                uppy={uppy}
                openModal={openUppyModal}
                projectId={project.id}
              />
            </Box>
          )}
          {files.length > 0 && (
            <Box
              display="flex"
              width="100%"
              height="100%"
              maxHeight="100%"
              overflow="auto"
              paddingY={2}
              paddingX={3}
              flexDirection="column"
              gap={2}
            >
              <DataRoomSummary
                loading={showCaseFileLoading}
                showCaseFile={showCaseFile}
              />
              <DisplayFiles
                files={files}
                uppy={uppy}
                openModal={openUppyModal}
                projectId={project.id}
              />
            </Box>
          )}
        </>
      )}
      {value === "chat" && (
        <Box
          display="flex"
          width="100%"
          height="100%"
          maxHeight="100%"
          overflow="auto"
        >
          <DisplayChat
            projectId={project.id}
            token={token}
            chats={chats}
            chatsLoading={chatsLoading}
            createChat={createChat}
            deleteChat={deleteChat}
            editChat={editChat}
            isMutating={
              createChatIsLoading ||
              isDeleteChatMutating ||
              isEditingChatMutating
            }
            questions={questions}
            refetchChats={refetchChats}
          />
        </Box>
      )}
    </>
  );
};
