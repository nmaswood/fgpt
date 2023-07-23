import { Outputs } from "@fgpt/precedent-iso";
import { Box, Typography } from "@mui/joy";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

export const TermsTable: React.FC<{
  terms: Outputs.Term[];
}> = ({ terms }) => {
  const columns: GridColDef<Outputs.Term>[] = [
    {
      field: "termName",
      headerName: "Term name",
      minWidth: 250,
      renderCell: ({ row }) => {
        return (
          <Typography
            sx={{
              color: "neutral.600",
              fontWeight: 700,
              fontSize: "12px",
            }}
          >
            {row.termName}
          </Typography>
        );
      },
    },
    {
      flex: 1,
      field: "termValue",
      headerName: "Term value",
      minWidth: 250,
      renderCell: ({ row }) => <RenderTermValue termValue={row.termValue} />,
    },
  ];

  return (
    <DataGrid
      getRowId={(row) => row.termName}
      rows={terms}
      columns={columns}
      disableRowSelectionOnClick
      disableColumnFilter
      disableColumnMenu
      hideFooterSelectedRowCount
      hideFooter={true}
      hideFooterPagination
      disableColumnSelector
      rowSelection={false}
      slots={{
        columnHeaders: () => null,
      }}
      getRowHeight={() => "auto"}
    />
  );
};

const RenderTermValue: React.FC<{ termValue: string }> = ({ termValue }) => {
  return (
    <Box
      display="flex"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      padding={2}
    >
      <Typography
        whiteSpace="pre-wrap"
        sx={{
          fontWeight: 400,
          fontSize: "14px",
          color: "neutral.1000",
        }}
      >
        {termValue}
      </Typography>
    </Box>
  );
};
