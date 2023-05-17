// Don't forget the CSS: core and the UI components + plugins you are using.
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import { Project } from "@fgpt/precedent-iso";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import XHRUpload from "@uppy/xhr-upload";
import React from "react";

import { useFetchFiles } from "../hooks/use-fetch-files";

const uppy = new Uppy().use(XHRUpload, {
  endpoint: "api/upload",
});

export const SelectedProject: React.FC<{ project: Project }> = ({
  project,
}) => {
  const { data: files } = useFetchFiles(project.id);

  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  React.useEffect(() => {
    uppy.on("file-added", (file) => {
      uppy.setFileMeta(file.id, {
        projectId: project.id,
      });
    });
  }, [project.id]);

  return (
    <Box display="flex" padding={3} flexDirection="column">
      <Typography variant="h6">{project.name}</Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Explore files" />
          <Tab label="Upload files" />
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
          <List>
            {files.map((file) => (
              <ListItem key={file.id}>
                <ListItemText primary={file.fileName} />
              </ListItem>
            ))}
          </List>
        )}
        {value === 1 && (
          <Box>
            {/* eslint-disable-next-line*/}
            {/* @ts-ignore */}
            <Dashboard uppy={uppy} proudlyDisplayPoweredByUppy={false} />
          </Box>
        )}
      </Box>
    </Box>
  );
};
