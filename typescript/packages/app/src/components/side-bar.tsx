import { useUser } from "@auth0/nextjs-auth0/client";
import { assertNever, Project } from "@fgpt/precedent-iso";
import AddIcon from "@mui/icons-material/Add";
import FolderIcon from "@mui/icons-material/Folder";
import LogoutIcon from "@mui/icons-material/Logout";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import { LoadingButton } from "@mui/lab";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Snackbar,
  TextField,
} from "@mui/material";
import React from "react";

import { useCreateProject } from "../hooks/use-create-project";

export const Sidebar: React.FC<{
  projects: Project[];
  selectedProjectId: string | undefined;
  setSelectedProjectId: (projectId: string) => void;
  selectedProjectIdx: number;
  projectModalOpen: boolean;
  setProjectModalOpen: (v: boolean) => void;
}> = ({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  selectedProjectIdx,
  projectModalOpen,
  setProjectModalOpen,
}) => {
  return (
    <Drawer
      sx={{
        width: "240px",
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: "240px",
          boxSizing: "border-box",
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <CreateProject
        projects={projects ?? []}
        setSelectedProjectId={setSelectedProjectId}
        projectModalOpen={projectModalOpen}
        setProjectModalOpen={setProjectModalOpen}
      />
      <Divider />
      <Box
        display="flex"
        justifyContent="space-between"
        flexDirection="column"
        height="100%"
        maxHeight="100%"
        overflow="auto"
      >
        {projects && projects.length > 0 && (
          <List
            disablePadding
            sx={{ height: "100%" }}
            onKeyDown={(e) => {
              switch (e.key) {
                case "ArrowDown":
                  {
                    const nextProject = projects[selectedProjectIdx + 1];
                    if (nextProject) {
                      setSelectedProjectId(nextProject.id);
                    }
                  }
                  break;
                case "ArrowUp":
                  {
                    const previousProject = projects[selectedProjectIdx - 1];
                    if (previousProject) {
                      setSelectedProjectId(previousProject.id);
                    }
                  }
                  break;
                default:
                  break;
              }
            }}
          >
            {projects.map((project) => {
              return (
                <ListItemButton
                  key={project.id}
                  selected={project.id === selectedProjectId}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <ListItemIcon>
                    <FolderIcon color="primary" />
                  </ListItemIcon>

                  <ListItem disablePadding>
                    <ListItemText primary={project.name} />
                  </ListItem>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
      <Divider />
      <DisplayUser />
    </Drawer>
  );
};
const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 255;

const CreateProject: React.FC<{
  projects: Project[];
  setSelectedProjectId: (projectId: string) => void;
  projectModalOpen: boolean;
  setProjectModalOpen: (v: boolean) => void;
}> = ({
  projects,
  setSelectedProjectId,
  projectModalOpen,
  setProjectModalOpen,
}) => {
  const { trigger, isMutating } = useCreateProject();

  const projectNames = React.useMemo(
    () => new Set(projects.map((p) => p.name)),
    [projects]
  );

  return (
    <Box display="flex" flexDirection="column" gap={1} width="250px">
      <Box
        display="flex"
        paddingY={2}
        paddingLeft={2}
        paddingRight={3}
        justifyContent="center"
      >
        <LoadingButton
          variant="outlined"
          loading={isMutating}
          onClick={() => {
            setProjectModalOpen(true);
          }}
          size="medium"
          startIcon={<AddIcon />}
          sx={{ width: "100%" }}
          color="primary"
        >
          Create project
        </LoadingButton>
        {projectModalOpen && (
          <FormDialog
            onClose={() => setProjectModalOpen(false)}
            projectNames={projectNames}
            onCreate={async (name: string) => {
              const newlyCreatedProject = await trigger({ name });
              if (newlyCreatedProject) {
                setSelectedProjectId(newlyCreatedProject.id);
              }
            }}
            loading={isMutating}
          />
        )}
      </Box>
    </Box>
  );
};

const validate =
  (projectNames: Set<string>) =>
  (name: string): InputError | undefined => {
    if (name.length < NAME_MIN_LENGTH) {
      return "too_short";
    } else if (name.length > NAME_MAX_LENGTH) {
      return "too_long";
    } else if (projectNames.has(name)) {
      return "already_exists";
    }
    return undefined;
  };

function errorDisplayName(error: InputError) {
  switch (error) {
    case "too_short":
      return "Name is too short";
    case "too_long":
      return "Name is too long";
    case "already_exists":
      return "Name already exists";
    default:
      assertNever(error);
  }
}

type InputError = "too_long" | "too_short" | "already_exists";
declare module "@mui/material/styles" {
  interface Theme {
    status: {
      danger: string;
    };
    palette: {
      primary: {
        main: string;
      };
    };
  }
}

declare module "@mui/material/styles" {
  interface Theme {
    status: {
      danger: string;
    };
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }
}

const DisplayUser = () => {
  const { user } = useUser();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      display="flex"
      width="100%"
      height="60px"
      alignItems="center"
      padding={1}
    >
      {user && (
        <>
          <MenuItem
            sx={{ width: "100%" }}
            onClick={(event) => {
              setAnchorEl(event.currentTarget);
            }}
          >
            <ListItemIcon>
              {user.picture && (
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 30,
                    height: 30,
                  }}
                  src={user.picture}
                />
              )}
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ color: "primary" }}>
              {user.name ?? user.email}
            </ListItemText>
          </MenuItem>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: -5,
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            PaperProps={{
              sx: {
                width: "200px",
              },
            }}
          >
            <MenuList dense disablePadding>
              <MenuItem>
                <ListItemIcon>
                  <PermIdentityIcon />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </MenuItem>
              <Divider />
              <MenuItem component={Link} href="/api/auth/logout">
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </MenuItem>
            </MenuList>
          </Menu>
        </>
      )}
    </Box>
  );
};

export const FormDialog: React.FC<{
  onClose: () => void;
  projectNames: Set<string>;
  onCreate: (name: string) => Promise<void>;
  loading: boolean;
}> = ({ onClose, projectNames, onCreate, loading }) => {
  const [error, setError] = React.useState<InputError | undefined>(undefined);
  const [name, setName] = React.useState("");

  const onSubmit = async () => {
    const trimmed = name.trim();
    const inputError = validate(projectNames)(trimmed);
    if (inputError) {
      setError(inputError);
      return;
    }

    await onCreate(trimmed);
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      keepMounted
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: "350px !important",
        },
      }}
    >
      <DialogTitle>Create a project</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Project name"
          type="text"
          color="secondary"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          fullWidth
          InputProps={{
            autoFocus: true,
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={onClose} color="secondary">
          Cancel
        </Button>
        <LoadingButton
          loading={loading}
          onClick={onSubmit}
          variant="contained"
          color="secondary"
        >
          Create project
        </LoadingButton>
      </DialogActions>
      {error && (
        <Snackbar
          open={true}
          autoHideDuration={5_000}
          onClose={() => setError(undefined)}
          message={errorDisplayName(error)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="error" sx={{ width: "100%" }}>
            {errorDisplayName(error)}
          </Alert>
        </Snackbar>
      )}
    </Dialog>
  );
};
