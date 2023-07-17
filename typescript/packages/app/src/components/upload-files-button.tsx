import CloudUploadIcon from "@mui/icons-material/CloudUploadOutlined";
import { Button } from "@mui/joy";
import Uppy from "@uppy/core";
import React from "react";

import { useFetchFiles } from "../hooks/use-fetch-files";

export const UploadFilesButton: React.FC<{
  uppy: Uppy;
  projectId: string;
  openModal: () => void;
}> = ({ uppy, projectId, openModal }) => {
  const { mutate } = useFetchFiles(projectId);

  React.useEffect(() => {
    uppy.on("complete", () => {
      mutate();
    });
  }, [uppy, mutate]);

  return (
    <Button
      startDecorator={<CloudUploadIcon />}
      onClick={openModal}
      variant="outlined"
      sx={{ height: "40px", whiteSpace: "nowrap" }}
    >
      Upload
    </Button>
  );
};
