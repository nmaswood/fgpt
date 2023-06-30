import { useUser } from "@auth0/nextjs-auth0/client";
import { assertNever, Project } from "@fgpt/precedent-iso";
import AddIcon from "@mui/icons-material/Add";
import FolderIcon from "@mui/icons-material/Folder";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Divider,
  Input,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  Menu,
  MenuItem,
  Modal,
  ModalDialog,
  Typography,
} from "@mui/joy";
import { Collapse, Snackbar } from "@mui/material";
import React from "react";
import { TransitionGroup } from "react-transition-group";

import { useCreateProject } from "../hooks/use-create-project";

const SIDE_BAR_PIXELS = 200;
const SIDE_BAR_WIDTH = `${SIDE_BAR_PIXELS}px`;

export const Sidebar: React.FC<{
  projectsLoading: boolean;
  projects: Project[];
  selectedProjectId: string | undefined;
  setSelectedProjectId: (projectId: string) => void;
  selectedProjectIdx: number;
  projectModalOpen: boolean;
  setProjectModalOpen: (v: boolean) => void;
}> = ({
  projectsLoading,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  selectedProjectIdx,
  projectModalOpen,
  setProjectModalOpen,
}) => {
  return (
    <Box
      sx={{
        width: SIDE_BAR_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: SIDE_BAR_WIDTH,
          boxSizing: "border-box",
        },
      }}
    >
      <CreateProject
        loading={projectsLoading}
        projects={projects ?? []}
        setSelectedProjectId={setSelectedProjectId}
        projectModalOpen={projectModalOpen}
        setProjectModalOpen={setProjectModalOpen}
      />
      <Divider />
      <Box
        display="flex"
        height="2px"
        width="100%"
        visibility={projectsLoading ? "visible" : "hidden"}
      >
        <LinearProgress sx={{ width: "100%" }} />
      </Box>
      <Box display="flex" height="100%" maxHeight="100%" overflow="auto">
        {projects && projects.length > 0 && (
          <List
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
            <TransitionGroup>
              {projects.map((project) => {
                return (
                  <Collapse key={project.id}>
                    <ListItem>
                      <ListItemButton
                        selected={project.id === selectedProjectId}
                        onClick={() => setSelectedProjectId(project.id)}
                        sx={{
                          width: SIDE_BAR_WIDTH,
                        }}
                      >
                        <ListItemDecorator>
                          <FolderIcon color="primary" />
                        </ListItemDecorator>

                        <ListItemContent>{project.name}</ListItemContent>
                      </ListItemButton>
                    </ListItem>
                  </Collapse>
                );
              })}
            </TransitionGroup>
          </List>
        )}
      </Box>

      <DisplayUser />
    </Box>
  );
};
const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 255;

const CreateProject: React.FC<{
  loading: boolean;
  projects: Project[];
  setSelectedProjectId: (projectId: string) => void;
  projectModalOpen: boolean;
  setProjectModalOpen: (v: boolean) => void;
}> = ({
  loading,
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
    <Box display="flex" flexDirection="column" gap={1} width="100%">
      <Box
        display="flex"
        paddingY={2}
        paddingLeft={2}
        paddingRight={3}
        justifyContent="center"
      >
        <Button
          variant="outlined"
          loading={isMutating || loading}
          onClick={() => {
            setProjectModalOpen(true);
          }}
          startDecorator={<AddIcon />}
          sx={{ width: "100%", whiteSpace: "nowrap" }}
          color="primary"
        >
          Create project
        </Button>

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

const DisplayUser = () => {
  const { user } = useUser();

  const [open, setOpen] = React.useState(false);

  const handleClose = () => setOpen(false);
  const buttonRef = React.useRef(null);

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
          <List ref={buttonRef}>
            <ListItem>
              <ListItemButton onClick={() => setOpen(true)}>
                <ListItemDecorator>
                  {user.picture && (
                    <Avatar
                      sx={{
                        width: 30,
                        height: 30,
                      }}
                      src={user.picture}
                    />
                  )}
                </ListItemDecorator>
                {user.name ?? user.email}
              </ListItemButton>
            </ListItem>
          </List>

          <Menu
            id="basic-menu"
            anchorEl={buttonRef.current}
            open={open}
            onClose={handleClose}
          >
            <MenuItem component={Link} href="/api/auth/logout">
              <ListItemDecorator>
                <LogoutIcon />
              </ListItemDecorator>
              Logout
            </MenuItem>
          </Menu>
        </>
      )}
    </Box>
  );
};

const FormDialog: React.FC<{
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
    <Modal open onClose={onClose} keepMounted>
      <ModalDialog>
        <Typography>Create a project</Typography>
        <Input
          autoFocus
          id="name"
          type="text"
          color="primary"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          fullWidth
        />
        <ButtonGroup spacing={1}>
          <Button disabled={loading} onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button loading={loading} onClick={onSubmit} color="primary">
            Create project
          </Button>
        </ButtonGroup>
        {error && (
          <Snackbar
            open={true}
            autoHideDuration={5_000}
            onClose={() => setError(undefined)}
            message={errorDisplayName(error)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert sx={{ width: "100%" }}>{errorDisplayName(error)}</Alert>
          </Snackbar>
        )}
      </ModalDialog>
    </Modal>
  );
};
