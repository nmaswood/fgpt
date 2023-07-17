import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import { MAX_FILE_SIZE_BYTES } from "@fgpt/precedent-iso";
import { Project } from "@fgpt/precedent-iso";
import BoltIcon from "@mui/icons-material/BoltOutlined";
import CollectionsIcon from "@mui/icons-material/CollectionsOutlined";
import {
  Box,
  CircularProgress,
  ListItemDecorator,
  Tab,
  TabList,
  Tabs,
} from "@mui/joy";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import XHRUpload from "@uppy/xhr-upload";
import { useRouter } from "next/router";
import React from "react";
import { z } from "zod";

import { CLIENT_SETTINGS } from "../client-settings";
import { useCreateChat } from "../hooks/use-create-chat";
import { useDeleteChat } from "../hooks/use-delete-chat";
import { useEditChat } from "../hooks/use-edit-chat";
import { useFetchFiles } from "../hooks/use-fetch-files";
import { useFetchChats } from "../hooks/use-list-chats";
import { useSampleForProject } from "../hooks/use-sample-questions";
import { DisplayChat } from "./chat";
import { DisplayFiles } from "./display-files";
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
      .use(XHRUpload, {
        endpoint: `${CLIENT_SETTINGS.publicApiEndpoint}/api/v1/files/upload`,
      })
      .use(Dashboard, {
        inline: false,
        proudlyDisplayPoweredByUppy: false,
        height: 470,
        browserBackButtonClose: false,
      });
  }, []);

  React.useEffect(() => {
    if (!token) {
      return;
    }
    const plugin = uppy.getPlugin("XHRUpload");
    if (!plugin) {
      return;
    }

    plugin!.setOptions({
      endpoint: `${CLIENT_SETTINGS.publicApiEndpoint}/api/v1/files/upload`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
  }, [uppy, token]);

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
      // I hope this works
      console.log(mounted);
      if (mounted) {
        uppy.close();
      }
    };
  }, [uppy, mounted]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      width="100%"
      maxHeight="100%"
      overflow="auto"
    >
      <Box
        display="flex"
        paddingX={2}
        paddingTop={1}
        marginBottom={1 / 2}
        justifyContent="space-between"
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue as any)}>
          <TabList>
            <Tab value="data">
              <ListItemDecorator>
                <CollectionsIcon />
              </ListItemDecorator>
              Data
            </Tab>
            <Tab value="chat">
              <ListItemDecorator>
                <BoltIcon />
              </ListItemDecorator>
              Chat
            </Tab>
          </TabList>
        </Tabs>
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
}> = ({
  token,
  project,

  value,
  uppy,
  openUppyModal,
}) => {
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
            <DisplayFiles
              files={files}
              uppy={uppy}
              openModal={openUppyModal}
              projectId={project.id}
            />
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
