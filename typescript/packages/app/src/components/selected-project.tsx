import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import { MAX_FILE_SIZE_BYTES } from "@fgpt/precedent-iso";
import { Project } from "@fgpt/precedent-iso";
import BoltIcon from "@mui/icons-material/Bolt";
import CollectionsIcon from "@mui/icons-material/Collections";
import DeleteIcon from "@mui/icons-material/Delete";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  ListItemDecorator,
  Tab,
  TabList,
  Tabs,
} from "@mui/joy";
import { LoadingButton } from "@mui/lab";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  TextField,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import XHRUpload from "@uppy/xhr-upload";
import { useRouter } from "next/router";
import React from "react";
import { z } from "zod";

import { CLIENT_SETTINGS } from "../client-settings";
import { useCreateChat } from "../hooks/use-create-chat";
import { useDeleteChat } from "../hooks/use-delete-chat";
import { useDeleteProject } from "../hooks/use-delete-project";
import { useEditChat } from "../hooks/use-edit-chat";
import { useEditProject } from "../hooks/use-edit-project";
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
  projects: Project[];
  token: string | undefined;
  setSelectedProjectId: (projectId: string | undefined) => void;
  loading: boolean;
}> = ({ token, project, projects, setSelectedProjectId, loading }) => {
  const [tab, setTab] = useTabState();
  const [modal, setModal] = React.useState<"delete" | "edit" | undefined>(
    undefined
  );

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const isLargeScreen = useMediaQuery("(min-width:750px)");

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
      (dashboard as any).openModal();
    }
  };

  React.useEffect(() => {
    return () => {
      // dumb hack to get around uppy bug
      // I hope this works
      if (window.location.pathname.includes("files")) {
        uppy.close();
      }
    };
  }, [uppy]);

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
        {token && project && (
          <Box display="flex" alignItems="center" gap={1}>
            <UploadFilesButton
              uppy={uppy}
              openModal={openUppyModal}
              projectId={project.id}
            />

            {isLargeScreen ? (
              <Button
                startDecorator={<SettingsIcon />}
                onClick={handleClick}
                variant="outlined"
                sx={{ height: "40px", whiteSpace: "nowrap" }}
              >
                Project settings
              </Button>
            ) : (
              <IconButton onClick={handleClick} color="primary">
                <SettingsIcon />
              </IconButton>
            )}

            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
            >
              <MenuList dense disablePadding>
                <MenuItem
                  onClick={() => {
                    setModal("delete");
                    handleClose();
                  }}
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" color="secondary" />
                  </ListItemIcon>
                  <ListItemText>Delete project</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setModal("edit");
                    handleClose();
                  }}
                >
                  <ListItemIcon>
                    <ModeEditIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Edit project name</ListItemText>
                </MenuItem>
              </MenuList>
            </Menu>
          </Box>
        )}
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
          projects={projects}
          token={token}
          setSelectedProjectId={setSelectedProjectId}
          value={tab}
          modal={modal}
          setModal={setModal}
          uppy={uppy}
          openUppyModal={openUppyModal}
        />
      )}
    </Box>
  );
};

const DeleteProjectModal: React.FC<{
  projectId: string;
  closeModal: () => void;
  resetSelectedProjectId: () => void;
}> = ({ closeModal, projectId, resetSelectedProjectId }) => {
  const { trigger, isMutating } = useDeleteProject();
  const [text, setText] = React.useState("");

  return (
    <Dialog
      open
      onClose={closeModal}
      keepMounted
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: "350px !important",
        },
      }}
    >
      <DialogTitle>Delete project</DialogTitle>
      <DialogActions>
        <Box
          display="flex"
          width="100%"
          height="100%"
          flexDirection="column"
          gap={3}
        >
          <TextField
            label="Confirmation"
            placeholder="Type DELETE to confirm"
            value={text}
            variant="outlined"
            onChange={(e) => {
              setText(e.target.value);
            }}
            autoFocus
          />
          <Box display="flex" width="100%" justifyContent="flex-end">
            <Button onClick={closeModal} color="primary">
              Cancel
            </Button>
            <LoadingButton
              variant="contained"
              color="secondary"
              loading={isMutating}
              disabled={text !== "DELETE"}
              onClick={async () => {
                await trigger({ id: projectId });
                resetSelectedProjectId();
                closeModal();
              }}
            >
              Delete project
            </LoadingButton>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

const EditProjectModal: React.FC<{
  closeModal: () => void;
  projectId: string;
  projectName: string;
  projects: Project[];
}> = ({ closeModal, projectName, projectId, projects }) => {
  const [text, setText] = React.useState("");
  const { trigger, isMutating } = useEditProject();
  const trimmed = text.trim();

  const projectNames = React.useMemo(
    () => new Set(projects.map((project) => project.name)),
    [projects]
  );

  const isDisabled =
    trimmed.length <= 3 ||
    isMutating ||
    trimmed === projectName ||
    projectNames.has(trimmed);
  return (
    <Dialog
      open
      onClose={closeModal}
      keepMounted
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: "350px !important",
        },
      }}
    >
      <DialogTitle>Edit project name</DialogTitle>
      <DialogActions>
        <Box
          display="flex"
          width="100%"
          height="100%"
          flexDirection="column"
          gap={3}
        >
          <TextField
            label="New name"
            variant="outlined"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && !isDisabled) {
                await trigger({
                  id: projectId,
                  name: trimmed,
                });
                closeModal();
              }
            }}
            autoFocus
          />

          <Box display="flex" justifyContent="flex-end">
            <Button onClick={closeModal} color="primary">
              Cancel
            </Button>
            <LoadingButton
              variant="contained"
              color="secondary"
              disabled={isDisabled}
              onClick={async () => {
                await trigger({
                  id: projectId,
                  name: trimmed,
                });
                closeModal();
              }}
            >
              Change name
            </LoadingButton>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

const SelectedProjectInner: React.FC<{
  project: Project;
  projects: Project[];
  token: string;
  setSelectedProjectId: (projectId: string | undefined) => void;
  value: Tab;
  modal: "delete" | "edit" | undefined;
  setModal: (v: "delete" | "edit" | undefined) => void;
  uppy: Uppy;
  openUppyModal: () => void;
}> = ({
  token,
  project,
  projects,
  setSelectedProjectId,
  value,
  modal,
  setModal,
  uppy,
  openUppyModal,
}) => {
  const closeModal = () => setModal(undefined);
  const { data: files, isLoading: filesLoading } = useFetchFiles(project.id);

  const { data: chats, isLoading: chatsLoading } = useFetchChats(
    "project",
    project.id
  );
  const { trigger: createChat, isMutating: createChatIsLoading } =
    useCreateChat("project", project.id);

  const { trigger: deleteChat, isMutating: isDeleteChatMutating } =
    useDeleteChat("project", project.id);

  const { trigger: editChat, isMutating: isEditingChatMutating } = useEditChat(
    "project",
    project.id
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
          {files.length > 0 && <DisplayFiles files={files} />}
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
          />
        </Box>
      )}
      {modal === "delete" && (
        <DeleteProjectModal
          closeModal={closeModal}
          projectId={project.id}
          resetSelectedProjectId={() => {
            const newProjectId = projects.find((p) => p.id !== project.id)?.id;
            setSelectedProjectId(newProjectId);
          }}
        />
      )}
      {modal === "edit" && (
        <EditProjectModal
          closeModal={closeModal}
          projectId={project.id}
          projectName={project.name}
          projects={projects}
        />
      )}
    </>
  );
};
