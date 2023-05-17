// Don't forget the CSS: core and the UI components + plugins you are using.
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import { Project } from "@fgpt/precedent-iso";
import { Box, Typography } from "@mui/material";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import XHRUpload from "@uppy/xhr-upload";

import { useFetchFiles } from "../hooks/use-fetch-files";

const uppy = new Uppy().use(XHRUpload, {
  endpoint: "/api/proxy/v1/files/upload",
});

export const SelectedProject: React.FC<{ project: Project }> = ({
  project,
}) => {
  const { data: files } = useFetchFiles(project.id);

  return (
    <Box display="flex" padding={3} flexDirection="column">
      <Typography variant="h6">{project.name}</Typography>
      <Box>
        <pre>{JSON.stringify({ files }, null, 2)}</pre>
      </Box>
      <Box>
        {/* eslint-disable-next-line*/}
        {/* @ts-ignore */}
        <Dashboard uppy={uppy} proudlyDisplayPoweredByUppy={false} />
      </Box>
    </Box>
  );
};
