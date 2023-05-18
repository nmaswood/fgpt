import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { Box, Typography } from "@mui/material";
import * as React from "react";

import { SelectedProject } from "../src/components/selected-project";
import { Sidebar } from "../src/components/side-bar";
import { useFetchProjects } from "../src/hooks/use-fetch-projects";

const Home: React.FC = () => {
  const { data: projects } = useFetchProjects();

  const [selectedProjectId, setSelectedProjectId] = React.useState<
    string | undefined
  >(undefined);

  React.useEffect(() => {
    const [project] = projects ?? [];
    if (project && !selectedProjectId) {
      setSelectedProjectId(project.id);
    }
  }, [projects, selectedProjectId]);

  const selectedProjectIdx = projects.findIndex(
    (p) => p.id === selectedProjectId
  );

  const selectedProject =
    selectedProjectIdx === -1 ? undefined : projects[selectedProjectIdx];

  return (
    <Box display="flex" height="100%" width="100%">
      <Box display="flex" width="275px" height="100%" flexDirection="column">
        <Sidebar
          projects={projects}
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={setSelectedProjectId}
          selectedProjectIdx={selectedProjectIdx}
        />
      </Box>

      <Box display="flex" width="100%" height="100%" bgcolor="background.paper">
        {projects !== undefined && projects.length === 0 && (
          <Box
            display="flex"
            width="100%"
            height="100%"
            justifyContent="center"
            alignItems="center"
          >
            <Box>
              <Typography variant="h4" color="primary">
                🚀 Create a new project
              </Typography>
            </Box>
          </Box>
        )}

        {selectedProject !== undefined && (
          <SelectedProject project={selectedProject} />
        )}
      </Box>
    </Box>
  );
};

export default withPageAuthRequired(Home);
