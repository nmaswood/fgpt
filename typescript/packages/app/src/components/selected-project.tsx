// Don't forget the CSS: core and the UI components + plugins you are using.
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import { Project } from "@fgpt/precedent-iso";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CollectionsIcon from "@mui/icons-material/Collections";
import DeleteIcon from "@mui/icons-material/Delete";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Tab,
  Tabs,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import XHRUpload from "@uppy/xhr-upload";
import React from "react";

import { useFetchFiles } from "../hooks/use-fetch-files";

export const SelectedProject: React.FC<{ project: Project }> = ({
  project,
}) => {
  const uppy = React.useMemo(
    () =>
      new Uppy({
        restrictions: {
          allowedFileTypes: [".pdf"],
          minFileSize: 1,
          maxFileSize: 50_000_000,
        },
      }).use(XHRUpload, {
        endpoint: "/api/upload",
      }),
    []
  );

  React.useEffect(() => {
    return () => uppy.resetProgress();
  }, [uppy]);

  const {
    data: files,
    mutate,
    isLoading: filesLoading,
  } = useFetchFiles(project.id);

  const [value, setValue] = React.useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  React.useEffect(() => {
    uppy.cancelAll();

    uppy.on("file-added", (file) => {
      uppy.setFileMeta(file.id, {
        projectId: project.id,
      });
    });
  }, [uppy, project.id]);

  React.useEffect(() => {
    uppy.on("complete", () => {
      mutate();
    });
  }, [uppy, mutate]);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const isLargeScreen = useMediaQuery("(min-width:600px)");

  return (
    <Box display="flex" flexDirection="column" height="100%" width="100%">
      <Box
        display="flex"
        paddingX={2}
        paddingTop={1}
        marginBottom={1 / 2}
        justifyContent="space-between"
      >
        <Tabs
          value={value}
          onChange={handleChange}
          textColor="secondary"
          indicatorColor="secondary"
        >
          <Tab
            icon={<CloudUploadIcon />}
            label={isLargeScreen ? "Upload project files" : undefined}
            iconPosition="start"
          />
          <Tab
            icon={<CollectionsIcon />}
            iconPosition="start"
            label={isLargeScreen ? "Explore project files" : undefined}
          />
        </Tabs>
        <Box display="flex" alignItems="center">
          {isLargeScreen ? (
            <Button
              startIcon={<SettingsIcon />}
              onClick={handleClick}
              variant="outlined"
              sx={{ height: "40px" }}
            >
              Project settings
            </Button>
          ) : (
            <IconButton onClick={handleClick} color="primary">
              <SettingsIcon />
            </IconButton>
          )}

          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
          >
            <MenuList dense disablePadding>
              <MenuItem>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Delete project</ListItemText>
              </MenuItem>
              <MenuItem>
                <ListItemIcon>
                  <ModeEditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Edit project name</ListItemText>
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Box>

      {value === 0 && (
        <Box
          display="flex"
          height="100%"
          width="100%"
          justifyContent="center"
          alignItems="center"
        >
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
        <>
          {!filesLoading && files.length === 0 && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="100%"
              height="100%"
            >
              <Button
                variant="outlined"
                onClick={() => {
                  setValue(0);
                }}
                color="secondary"
                size="large"
                startIcon={<CloudUploadIcon />}
                sx={{ width: "fit-content" }}
              >
                Upload files to begin
              </Button>
            </Box>
          )}
          {files.length > 0 && (
            <List
              sx={{
                height: "100%",
              }}
            >
              {files.map((file) => (
                <ListItem key={file.id}>
                  <ListItemIcon>
                    <PictureAsPdfIcon color="secondary" />
                  </ListItemIcon>

                  <ListItemText
                    primaryTypographyProps={{ color: "white" }}
                    primary={file.fileName}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </>
      )}
    </Box>
  );
};
