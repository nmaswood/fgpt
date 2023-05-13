import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { assertNever, Project } from "@fgpt/precedent-iso";
import { Alert, Box, Button, Snackbar, TextField } from "@mui/material";
import * as React from "react";

import { useCreateProject } from "../src/hooks/use-create-project";
import { useFetchProjects } from "../src/hooks/use-fetch-projects";
import { useFetchUser } from "../src/hooks/use-fetch-user";

const Home: React.FC = () => {
  const { data: user, isLoading: userLoading } = useFetchUser();
  const { data: projects, isLoading: projectLoading } = useFetchProjects();

  const loading = userLoading || projectLoading;

  const [projectName, setProjectName] = React.useState("");

  return (
    <Box padding={3} gap={3}>
      <Button variant="outlined" href="/api/auth/logout">
        Logout
      </Button>
      {user && <pre>{JSON.stringify({ user }, null, 2)}</pre>}
      {projects && <pre>{JSON.stringify({ projects }, null, 2)}</pre>}
      <CreateProject
        name={projectName}
        setName={setProjectName}
        projects={projects ?? []}
        disabled={loading}
      />
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
    <Box display="flex" flexDirection="column" gap={1} width="300px">
      <TextField
        placeholder="New project name"
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
