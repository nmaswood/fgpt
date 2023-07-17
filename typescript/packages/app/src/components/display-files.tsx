import { humanReadableFileSize, LoadedFile } from "@fgpt/precedent-iso";
import { Box, Link, Typography, Table, IconButton } from "@mui/joy";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import NextLink from "next/link";
import React from "react";

import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";

export const DisplayFiles: React.FC<{ files: LoadedFile[] }> = ({ files }) => {
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
      gap={1}
    >
      <Typography level="h4">Data room files</Typography>

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
    field: "type",
    headerName: "Type",
    renderCell: ({ row }) => {
      return (
        <Link component={NextLink} href={`/files/${row.id}`}>
          {""}
        </Link>
      );
    },
  },
  {
    field: "fileName",
    headerName: "File name",
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
      return "placeholder";
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
    renderCell: () => {
      return "placeholder";
    },
  },
  {
    field: "actions",
    headerName: "",
    flex: 1,
    align: "right",
    renderCell: () => {
      return (
        <IconButton variant="plain">
          <MoreVertOutlinedIcon />
        </IconButton>
      );
    },
  },
];
