import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import AddIcon from "@mui/icons-material/Add";
import { Box, Button } from "@mui/material";
import * as React from "react";

import { SelectedProject } from "../src/components/selected-project";
import { Sidebar } from "../src/components/side-bar";
import { useFetchProjects } from "../src/hooks/use-fetch-projects";
import { useFetchToken } from "../src/hooks/use-fetch-token";

const Home: React.FC = () => {
  const { data: token, isLoading: isTokenLoading } = useFetchToken();
  const { data: projects, isLoading: projectsLoading } = useFetchProjects();

  const [selectedProjectId, setSelectedProjectId] = React.useState<
    string | undefined
  >(undefined);

  React.useEffect(() => {
    if (projectsLoading) {
      return;
    }
    const [project] = projects ?? [];
    if (project && !selectedProjectId) {
      setSelectedProjectId(project.id);
      return;
    }
    if (!selectedProjectId) {
      return;
    }
  }, [projects, selectedProjectId, projectsLoading]);

  const [projectModalOpen, setProjectModalOpen] = React.useState(false);

  const selectedProjectIdx = projects.findIndex(
    (p) => p.id === selectedProjectId
  );

  const selectedProject =
    selectedProjectIdx === -1 ? undefined : projects[selectedProjectIdx];

  return (
    <Box display="flex" height="100%" width="100%">
      <Sidebar
        projectsLoading={projectsLoading}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        selectedProjectIdx={selectedProjectIdx}
        projectModalOpen={projectModalOpen}
        setProjectModalOpen={setProjectModalOpen}
      />

      <Box display="flex" width="100%" height="100%" bgcolor="background.paper">
        {!projectsLoading &&
          projects !== undefined &&
          projects.length === 0 && (
            <Box
              display="flex"
              width="100%"
              height="100%"
              justifyContent="center"
              alignItems="center"
            >
              <Button
                variant="outlined"
                onClick={() => {
                  setProjectModalOpen(true);
                }}
                size="large"
                startIcon={<AddIcon />}
                sx={{ width: "fit-content" }}
                color="primary"
              >
                Create project to begin
              </Button>
            </Box>
          )}

        <SelectedProject
          token={token}
          loading={isTokenLoading || projectsLoading}
          project={selectedProject}
          projects={projects}
          setSelectedProjectId={setSelectedProjectId}
        />
      </Box>
    </Box>
  );
};

export default withPageAuthRequired(Home);
