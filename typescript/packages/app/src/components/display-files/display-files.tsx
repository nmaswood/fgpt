import { assertNever, FileStatus, LoadedFile } from "@fgpt/precedent-iso";
import { Box, Typography } from "@mui/joy";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Uppy from "@uppy/core";
import { format } from "fecha";
import { useRouter } from "next/router";
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
  const router = useRouter();
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
          <Typography
            sx={{
              color: "black",
              textWrap: "wrap",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            {row.fileName}
          </Typography>
        );
      },
    },
    {
      minWidth: 500,
      field: "description",
      headerName: "Description",
      renderCell: ({ row }) => {
        return <RenderDescription description={row.description ?? ""} />;
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
      headerName: "Created on",
      width: 150,
      valueGetter(params) {
        return format(new Date(params.row.createdAt), "MMMM Do, YYYY");
      },
    },
    {
      field: "actions",
      headerName: "",
      flex: 1,
      align: "right",
      renderCell: ({ row }) => {
        return (
          <RenderActionMenu
            fileReferenceId={row.id}
            mutate={mutate}
            hidden={
              row.fileType == "excel" ||
              !showCaseFile ||
              (showCaseFile.type === "set" &&
                showCaseFile.fileReferenceId === row.id)
            }
          />
        );
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
      maxHeight="100%"
      overflow="auto"
      gap={2}
      bgcolor="neutral.0"
      borderRadius={8}
    >
      <Box display="flex" width="100%" justifyContent="space-between">
        <Typography
          level="h4"
          sx={{
            fontWeight: 700,
          }}
        >
          Data Room Files
        </Typography>
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
        onRowClick={(row) => {
          router.push(`/files/${row.id}`);
        }}
        disableColumnFilter
        disableColumnMenu
        hideFooter={true}
        hideFooterPagination
        getRowHeight={() => "auto"}
        sx={{
          borderColor: "#E5E5E5",
          "& .MuiDataGrid-row--dynamicHeight:hover": {
            cursor: "pointer",
            boxShadow: "0px 0px 8px 0px rgba(0, 0, 0, 0.15)",
            transform: "translate3d(0px, -1px, 0px)",
            backgroundColor: "white",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            color: "#666",
            fontWeight: 700,
          },
        }}
      />
    </Box>
  );
};
const RenderDescription: React.FC<{ description: string }> = ({
  description,
}) => {
  return (
    <Typography
      sx={{
        textWrap: "wrap",
        fontSize: "14px",
      }}
    >
      {description}
    </Typography>
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
