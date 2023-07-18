import { assertNever, FileType, LoadedFile } from "@fgpt/precedent-iso";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import { Box, Chip, IconButton, Link, Typography } from "@mui/joy";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Uppy from "@uppy/core";
import NextLink from "next/link";
import React from "react";

import { UploadFilesButton } from "./upload-files-button";

export const DisplayFiles: React.FC<{
  files: LoadedFile[];
  projectId: string;
  openModal: () => void;
  uppy: Uppy;
}> = ({ files, projectId, openModal, uppy }) => {
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
        hideFooterPagination
      />
    </Box>
  );
};

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
    renderCell: () => <RenderActionMenu />,
  },
];

const RenderActionMenu: React.FC = () => {
  return (
    <IconButton variant="plain">
      <MoreVertOutlinedIcon />
    </IconButton>
  );
};

const ChipForFileType: React.FC<{ f: FileType }> = ({ f }) => {
  switch (f) {
    case "excel":
      return (
        <Chip
          size="sm"
          color="success"
          sx={(theme) => ({
            backgroundColor: "transparent",
            color: theme.palette.success.solidColor,
            ".MuiTypography-root": {
              fontSize: 12,
              fontWeight: 700,
              color: theme.palette.success.solidColor,
            },
            ".MuiChip-label": {
              color: theme.palette.success.solidColor,
            },
            "&:before": {
              content: "''",
              position: "absolute",
              top: "0px",
              right: "0px",
              bottom: "0px",
              left: "0px",
              opacity: 0.15,
              background: theme.palette.success.solidColor,
              borderRadius: 16,
            },
          })}
        >
          <Typography>XLS</Typography>
        </Chip>
      );
    case "pdf":
      return (
        <Chip
          size="sm"
          color="danger"
          sx={(theme) => ({
            backgroundColor: "transparent",
            color: theme.palette.danger.solidColor,
            ".MuiTypography-root": {
              fontSize: 12,
              fontWeight: 700,
              color: theme.palette.danger.solidColor,
            },
            ".MuiChip-label": {
              color: theme.palette.danger.solidColor,
            },
            "&:before": {
              content: "''",
              position: "absolute",
              top: "0px",
              right: "0px",
              bottom: "0px",
              left: "0px",
              opacity: 0.15,
              background: theme.palette.danger.solidColor,
              borderRadius: 16,
            },
          })}
        >
          PDF
        </Chip>
      );

    default:
      assertNever(f);
  }
};
