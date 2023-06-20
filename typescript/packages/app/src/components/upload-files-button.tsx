import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Button,IconButton, useMediaQuery } from "@mui/material";
import React from "react";

import { useFetchFiles } from "../hooks/use-fetch-files";
import { useUppy } from "./use-uppy";

export const UploadFilesButton: React.FC<{
  token: string;
  projectId: string;
}> = ({ token, projectId }) => {
  const isLargeScreen = useMediaQuery("(min-width:750px)");
  const { mutate } = useFetchFiles(projectId);
  const { uppy, openUppyModal } = useUppy(token, projectId);

  React.useEffect(() => {
    uppy.on("complete", () => {
      mutate();
    });
  }, [uppy, mutate]);

  return isLargeScreen ? (
    <Button
      startIcon={<CloudUploadIcon />}
      onClick={openUppyModal}
      variant="outlined"
      sx={{ height: "40px", whiteSpace: "nowrap" }}
    >
      Upload files
    </Button>
  ) : (
    <IconButton onClick={openUppyModal} color="primary">
      <CloudUploadIcon />
    </IconButton>
  );
};
