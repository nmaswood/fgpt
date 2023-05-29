import { LoadedFile } from "@fgpt/precedent-iso";
import { Box } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
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

const columns: GridColDef[] = [
  {
    field: "fileName",
    headerName: "File name",
    flex: 1,
    minWidth: 300,
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
  },
  {
    field: "createdAt",
    headerName: "Created at",
    type: "date",
    width: 110,
    valueFormatter: ({ value }) => new Date(value as string).toLocaleString(),
  },
  {
    field: "extractedTextLength",
    headerName: "Token length",
    width: 160,
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
