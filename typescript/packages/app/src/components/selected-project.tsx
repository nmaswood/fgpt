import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import { Project } from "@fgpt/precedent-iso";
import { MAX_FILE_SIZE_BYTES } from "@fgpt/precedent-iso";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BoltIcon from "@mui/icons-material/Bolt";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CollectionsIcon from "@mui/icons-material/Collections";
import DeleteIcon from "@mui/icons-material/Delete";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import SettingsIcon from "@mui/icons-material/Settings";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import XHRUpload from "@uppy/xhr-upload";
import React from "react";

import { CLIENT_SETTINGS } from "../client-settings";
import { useDeleteProject } from "../hooks/use-delete-project";
import { useEditProject } from "../hooks/use-edit-project";
import { useFetchFiles } from "../hooks/use-fetch-files";
import { Chat } from "./chat";
import { DisplayFiles } from "./display-files";
import { DisplayReports } from "./display-reports";

export const SelectedProject: React.FC<{
  project: Project;
  projects: Project[];
  token: string;
}> = ({ token, project, projects }) => {
  const [modal, setModal] = React.useState<"delete" | "edit" | undefined>(
    undefined
  );

  const closeModal = () => setModal(undefined);

  const uppy = React.useMemo(
    () =>
      new Uppy({
        restrictions: {
          allowedFileTypes: [".pdf"],
          minFileSize: 1,
          maxFileSize: MAX_FILE_SIZE_BYTES,
        },
      }).use(XHRUpload, {
        endpoint: `${CLIENT_SETTINGS.publicApiEndpoint}/api/v1/files/upload`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      }),
    [token]
  );

  React.useEffect(() => {
    return () => uppy.resetProgress();
  }, [uppy]);

  const {
    data: files,
    mutate,
    isLoading: filesLoading,
  } = useFetchFiles(project.id);

  const [value, setValue] = React.useState(2);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  React.useEffect(() => {
    uppy.cancelAll();

    uppy.on("file-added", (file) => {
      uppy.setFileMeta(file.id, {
        projectId: project.id,
      });
    });
  }, [uppy, project.id]);

  React.useEffect(() => {
    uppy.on("complete", () => {
      mutate();
    });
  }, [uppy, mutate]);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const isLargeScreen = useMediaQuery("(min-width:600px)");

  return (
    <>
      <Box display="flex" flexDirection="column" height="100%" width="100%">
        <Box
          display="flex"
          paddingX={2}
          paddingTop={1}
          marginBottom={1 / 2}
          justifyContent="space-between"
        >
          <Tabs
            value={value}
            onChange={handleChange}
            textColor="secondary"
            indicatorColor="secondary"
          >
            <Tab
              icon={<CloudUploadIcon />}
              label={isLargeScreen ? "Upload project files" : undefined}
              iconPosition="start"
            />
            <Tab
              icon={<CollectionsIcon />}
              iconPosition="start"
              label={isLargeScreen ? "Explore project files" : undefined}
            />
            <Tab
              icon={<BoltIcon />}
              iconPosition="start"
              label={isLargeScreen ? "Chat" : undefined}
            />
            <Tab
              icon={<AssessmentIcon />}
              iconPosition="start"
              label={isLargeScreen ? "Reports" : undefined}
            />
          </Tabs>
          <Box display="flex" alignItems="center">
            {isLargeScreen ? (
              <Button
                startIcon={<SettingsIcon />}
                onClick={handleClick}
                variant="outlined"
                sx={{ height: "40px" }}
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
        </Box>

        {value === 0 && (
          <Box
            display="flex"
            height="100%"
            width="100%"
            justifyContent="center"
            alignItems="center"
          >
            {/* eslint-disable-next-line*/}
            {/* @ts-ignore */}
            <Dashboard
              uppy={uppy}
              proudlyDisplayPoweredByUppy={false}
              theme="dark"
            />
          </Box>
        )}

        {value === 1 && (
          <>
            {!filesLoading && files.length === 0 && (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="100%"
                height="100%"
              >
                <Button
                  variant="outlined"
                  onClick={() => {
                    setValue(0);
                  }}
                  color="secondary"
                  size="large"
                  startIcon={<CloudUploadIcon />}
                  sx={{ width: "fit-content" }}
                >
                  Upload files to begin
                </Button>
              </Box>
            )}
            {files.length > 0 && <DisplayFiles files={files} />}
          </>
        )}

        {value === 2 && (
          <>
            {!filesLoading && files.length === 0 && (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="100%"
                height="100%"
              >
                <Button
                  variant="outlined"
                  onClick={() => {
                    setValue(0);
                  }}
                  color="secondary"
                  size="large"
                  startIcon={<CloudUploadIcon />}
                  sx={{ width: "fit-content" }}
                >
                  Upload files to begin
                </Button>
              </Box>
            )}

            {!filesLoading && files.length > 0 && (
              <Box display="flex" width="100%" height="100%">
                <Chat projectId={project.id} token={token} />
              </Box>
            )}
          </>
        )}
        {value === 3 && <DisplayReports />}
      </Box>
      {modal === "delete" && (
        <DeleteProjectModal closeModal={closeModal} projectId={project.id} />
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

const DeleteProjectModal: React.FC<{
  projectId: string;
  closeModal: () => void;
}> = ({ closeModal, projectId }) => {
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
            autoFocus
          />

          <Box display="flex" justifyContent="flex-end">
            <Button onClick={closeModal} color="primary">
              Cancel
            </Button>
            <LoadingButton
              variant="contained"
              color="secondary"
              disabled={
                trimmed.length <= 3 ||
                isMutating ||
                trimmed === projectName ||
                projectNames.has(trimmed)
              }
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
