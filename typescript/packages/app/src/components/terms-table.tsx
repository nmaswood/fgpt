import { Outputs } from "@fgpt/precedent-iso";
import { Typography } from "@mui/joy";
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
              color: "#666666",
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
      renderCell: ({ row }) => {
        return (
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: "14px",
            }}
          >
            {row.termValue}
          </Typography>
        );
      },
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
    />
  );
};
