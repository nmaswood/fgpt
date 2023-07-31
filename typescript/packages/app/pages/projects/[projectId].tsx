import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { Box } from "@mui/joy";
import { useRouter } from "next/router";
import * as React from "react";

import { Navbar } from "../../src/components/navbar";
import { SelectedProject } from "../../src/components/selected-project";
import { useFetchMe } from "../../src/hooks/use-fetch-me";
import { useFetchProject } from "../../src/hooks/use-fetch-project";
import { useFetchToken } from "../../src/hooks/use-fetch-token";

const DisplayProject: React.FC = () => {
  const router = useRouter();
  const { data: user, isLoading: userIsLoading } = useFetchMe();
  const projectId = (() => {
    const projectId = router.query.projectId;
    return typeof projectId === "string" ? projectId : undefined;
  })();

  const status = user?.status;

  React.useEffect(() => {
    if (status === "inactive") {
      router.push("/inactive");
    }
  }, [router, status]);

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
      <Navbar loading={!project} project={project} />

      <SelectedProject
        token={token}
        loading={isTokenLoading || isProjectLoading || userIsLoading}
        project={project}
      />
    </Box>
  );
};

export default withPageAuthRequired(DisplayProject);
