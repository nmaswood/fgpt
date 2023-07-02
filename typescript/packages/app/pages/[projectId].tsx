import { Box, Breadcrumbs, Typography, Link } from "@mui/joy";
import { useRouter } from "next/router";
import React from "react";
import Home from "@mui/icons-material/Home";
import { useFetchProject } from "../src/hooks/use-fetch-project";

export default function DisplayFile() {
  const router = useRouter();

  const projectId = (() => {
    const projectId = router.query.projectId;
    return typeof projectId === "string" ? projectId : undefined;
  })();

  const { data: project, isLoading } = useFetchProject(projectId);
  console.log(project);
  return (
    <Box display="flex" width="100%" height="100%">
      <Breadcrumbs separator="›" aria-label="breadcrumbs">
        <Link
          // `preventDefault` is for demo purposes
          // and is generally not needed in your app
          onClick={(event) => event.preventDefault()}
          underline="hover"
          color="primary"
          fontSize="inherit"
          href="/"
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Projects
        </Link>
        {["Springfield", "Simpson"].map((item: string) => (
          <Link
            // `preventDefault` is for demo purposes
            // and is generally not needed in your app
            onClick={(event) => event.preventDefault()}
            key={item}
            underline="hover"
            color="success"
            fontSize="inherit"
            href="/"
          >
            {item}
          </Link>
        ))}
        <Typography fontSize="inherit">Homer</Typography>
      </Breadcrumbs>
    </Box>
  );
}
