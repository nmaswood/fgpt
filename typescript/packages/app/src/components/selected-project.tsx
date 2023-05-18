// Don't forget the CSS: core and the UI components + plugins you are using.
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import { Project } from "@fgpt/precedent-iso";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import XHRUpload from "@uppy/xhr-upload";
import React from "react";

import { useFetchFiles } from "../hooks/use-fetch-files";

const uppy = new Uppy({
  restrictions: {
    allowedFileTypes: [".pdf"],
    minFileSize: 1,
    maxFileSize: 50_000_000,
  },
}).use(XHRUpload, {
  endpoint: "api/upload",
});

export const SelectedProject: React.FC<{ project: Project }> = ({
  project,
}) => {
  const { data: files, mutate } = useFetchFiles(project.id);

  const [value, setValue] = React.useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  React.useEffect(() => {
    uppy.on("file-added", (file) => {
      uppy.setFileMeta(file.id, {
        projectId: project.id,
      });
    });
  }, [project.id]);

  React.useEffect(() => {
    uppy.on("complete", () => {
      mutate();
    });
  }, [mutate]);

  return (
    <Box
      display="flex"
      padding={3}
      flexDirection="column"
      height="100%"
      width="100%"
    >
      <Typography color="white" variant="h6">
        {project.name}
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Upload files" />
          <Tab label="Explore files" />
        </Tabs>
      </Box>

      <Box
        display="flex"
        height="100%"
        width="100%"
        justifyContent="center"
        alignItems="center"
      >
        {value === 0 && (
          <Box>
            {/* eslint-disable-next-line*/}
            {/* @ts-ignore */}
            <Dashboard
              uppy={uppy}
              proudlyDisplayPoweredByUppy={false}
              theme="dark"
            />
          </Box>
        )}

        {value === 1 && (
          <List>
            {files.map((file) => (
              <ListItem key={file.id}>
                <ListItemText primary={file.fileName} />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};
