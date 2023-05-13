import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { assertNever, Project } from "@fgpt/precedent-iso";
import {
  Alert,
  AppBar,
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
import * as React from "react";

import { useCreateProject } from "../src/hooks/use-create-project";
import { useFetchProjects } from "../src/hooks/use-fetch-projects";
import { useFetchUser } from "../src/hooks/use-fetch-user";

const Home: React.FC = () => {
  const { data: user, isLoading: userLoading } = useFetchUser();
  const { data: projects, isLoading: projectLoading } = useFetchProjects();

  const [selectedProjectId, setSelectedProjectId] = React.useState<
    string | undefined
  >(undefined);

  const loading = userLoading || projectLoading;

  const [projectName, setProjectName] = React.useState("");

  React.useEffect(() => {
    const [project] = projects ?? [];
    if (project) {
      setSelectedProjectId(project.id);
    }
  }, [projects]);

  return (
    <Box gap={3} padding={1}>
      <AppBar
        position="static"
        sx={{
          background: "white",
          display: "flex",
          flexDirection: "row",
          paddingY: 1,
          paddingX: 2,
          justifyContent: "space-between",
        }}
      >
        <Image priority src="/fgpt-logo.svg" alt="me" width="40" height="40" />
        <Box display="flex" gap={2} alignItems="center">
          {user && <Typography>{user.email}</Typography>}
          <Button variant="outlined" href="/api/auth/logout" size="small">
            Logout
          </Button>
        </Box>
      </AppBar>

      <Box display="flex" flexDirection="column" width="250px" marginTop={1}>
        <CreateProject
          name={projectName}
          setName={setProjectName}
          projects={projects ?? []}
          disabled={loading}
        />
        {projects && projects.length > 0 && (
          <List>
            {projects.map((project) => {
              return (
                <ListItemButton
                  key={project.id}
                  selected={project.id === selectedProjectId}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <ListItem disablePadding>
                    <ListItemText primary={project.name} />
                  </ListItem>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};
const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 255;

const CreateProject: React.FC<{
  name: string;
  setName: (name: string) => void;
  projects: Project[];
  disabled: boolean;
}> = ({ name, setName, projects, disabled }) => {
  const { trigger, isMutating } = useCreateProject();
  const [error, setError] = React.useState<InputError | undefined>(undefined);

  const projectNames = React.useMemo(
    () => new Set(projects.map((p) => p.name)),
    [projects]
  );

  const onCreate = async () => {
    const inputError = validate(projectNames)(name);
    if (inputError) {
      setError(inputError);
      return;
    }

    await trigger({ name });
    setName("");
    setError(undefined);
  };

  return (
    <Box display="flex" flexDirection="column" gap={1} width="250px">
      <TextField
        placeholder="New project name"
        size="small"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onCreate();
            e.preventDefault();
          }
        }}
      />
      <Button
        variant="outlined"
        disabled={disabled || isMutating}
        onClick={onCreate}
        size="small"
      >
        Create project
      </Button>

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

export default withPageAuthRequired(Home);
