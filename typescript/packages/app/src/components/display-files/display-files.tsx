import { assertNever, FileStatus, LoadedFile } from "@fgpt/precedent-iso";
import { Box, Link, Typography } from "@mui/joy";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Uppy from "@uppy/core";
import NextLink from "next/link";
import React from "react";

import { useFetchShowCaseFile } from "../../hooks/use-fetch-show-case-file";
import { RenderActionMenu } from "../render-action-menu";
import { UploadFilesButton } from "../upload-files-button";
import { ChipForFileType } from "./chip-for-file-type";

export const DisplayFiles: React.FC<{
  files: LoadedFile[];
  projectId: string;
  openModal: () => void;
  uppy: Uppy;
}> = ({ files, projectId, openModal, uppy }) => {
  const { data: showCaseFile, mutate } = useFetchShowCaseFile(projectId);

  const columns: GridColDef<LoadedFile>[] = [
    {
      field: "fileType",
      headerName: "Type",
      renderCell: ({ row }) => {
        if (!row.fileType) {
          return null;
        }
        return <ChipForFileType f={row.fileType} />;
      },
    },
    {
      field: "fileName",
      headerName: "Name",
      minWidth: 300,
      renderCell: ({ row }) => {
        return (
          <Link component={NextLink} href={`/files/${row.id}`}>
            {row.fileName}
          </Link>
        );
      },
    },
    {
      field: "description",
      headerName: "Description",
      renderCell: () => {
        return "";
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: ({ row }) => {
        return <RenderStatus status={row.status} />;
      },
    },

    {
      field: "createdAt",
      headerName: "Created at",
      width: 150,
      valueGetter(params) {
        return new Date(params.row.createdAt).toLocaleDateString();
      },
    },
    {
      field: "actions",
      headerName: "",
      flex: 1,
      align: "right",
      renderCell: ({ row }) => {
        if (
          row.fileType == "excel" ||
          !showCaseFile ||
          (showCaseFile.type === "set" &&
            showCaseFile.fileReferenceId === row.id)
        ) {
          return null;
        }

        return <RenderActionMenu fileReferenceId={row.id} mutate={mutate} />;
      },
    },
  ];
  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      width="100%"
      padding={2}
      paddingBottom={4}
      maxHeight="100%"
      overflow="auto"
      gap={3}
      bgcolor="neutral.0"
      borderRadius={8}
    >
      <Box display="flex" width="100%" justifyContent="space-between">
        <Typography level="h4">Data room files</Typography>
        <UploadFilesButton
          uppy={uppy}
          openModal={openModal}
          projectId={projectId}
        />
      </Box>

      <DataGrid
        rows={files}
        columns={columns}
        disableRowSelectionOnClick
        disableColumnFilter
        disableColumnMenu
        hideFooter={true}
        hideFooterPagination
      />
    </Box>
  );
};

const RenderStatus: React.FC<{ status: FileStatus }> = ({ status }) => {
  switch (status) {
    case "ready":
      return (
        <Typography
          sx={{
            fontWeight: 700,
            color: "success.solidColor",
          }}
        >
          Ready
        </Typography>
      );
    case "error":
      return (
        <Typography
          sx={{
            fontWeight: 700,
            color: "danger.solidColor",
          }}
        >
          Error
        </Typography>
      );
    case "pending":
      return (
        <Typography
          sx={{
            fontWeight: 700,
            color: "neutral.600",
          }}
        >
          Analyzing...
        </Typography>
      );
    default:
      assertNever(status);
  }
};
