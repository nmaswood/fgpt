import { humanReadableFileSize, LoadedFile } from "@fgpt/precedent-iso";
import { Box, Link } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import NextLink from "next/link";
import React from "react";

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
    >
      <DataGrid rows={files} columns={columns} disableRowSelectionOnClick />
    </Box>
  );
};

const columns: GridColDef<LoadedFile>[] = [
  {
    field: "fileName",
    headerName: "File name",
    flex: 1,
    minWidth: 300,
    renderCell: ({ row }) => {
      return (
        <Link component={NextLink} href={`files/${row.id}`}>
          {row.fileName}
        </Link>
      );
    },
  },
  {
    field: "contentType",
    headerName: "Content type",
    width: 150,
  },
  {
    field: "fileSize",
    headerName: "File size",
    type: "number",
    width: 110,
    valueFormatter: ({ value }) => humanReadableFileSize(value, true),
  },
  {
    field: "createdAt",
    headerName: "Created at",
    type: "date",
    width: 150,
    valueFormatter: ({ value }) => new Date(value as string).toLocaleString(),
  },
  {
    field: "extractedTextLength",
    headerName: "Token length",
    width: 160,
    align: "right",
    headerAlign: "right",
  },
  {
    field: "gpt4TokenLength",
    headerName: "GPT-4 Token length",
    width: 160,
    align: "right",
    headerAlign: "right",
  },
  {
    field: "fullyChunked",
    headerName: "Is fully chunked?",
    type: "boolean",
    width: 160,
  },
  {
    field: "fullyEmbedded",
    headerName: "Is fully embedded?",
    type: "boolean",
    width: 160,
  },
];
