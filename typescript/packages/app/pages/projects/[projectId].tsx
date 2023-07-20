import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { Box } from "@mui/joy";
import { useRouter } from "next/router";
import * as React from "react";

import { Navbar } from "../../src/components/navbar";
import { SelectedProject } from "../../src/components/selected-project";
import { useFetchProject } from "../../src/hooks/use-fetch-project";
import { useFetchToken } from "../../src/hooks/use-fetch-token";

const DisplayProject: React.FC = () => {
  const router = useRouter();
  const projectId = (() => {
    const projectId = router.query.projectId;
    return typeof projectId === "string" ? projectId : undefined;
  })();

  const { data: token, isLoading: isTokenLoading } = useFetchToken();

  const { data: project, isLoading: isProjectLoading } =
    useFetchProject(projectId);

  return (
    <Box
      display="flex"
      height="100%"
      width="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      flexDirection="column"
      bgcolor="background.body"
    >
      <Navbar project={project} />
      <Box
        display="flex"
        width="100%"
        height="100%"
        maxHeight="100%"
        overflow="auto"
      >
        <SelectedProject
          token={token}
          loading={isTokenLoading || isProjectLoading}
          project={project}
        />
      </Box>
    </Box>
  );
};

export default withPageAuthRequired(DisplayProject);
