import { Outputs } from "@fgpt/precedent-iso";
import { Box, Typography } from "@mui/joy";
import Table from "@mui/joy/Table";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

export const TermsTable: React.FC<{
  terms: Outputs.Term[];
}> = ({ terms }) => {
  return (
    <Box marginTop={"-40px"}>
      <Table
        sx={{
          minWidth: "400px",
        }}
      >
        <thead>
          <tr
            style={{
              visibility: "hidden",
            }}
          >
            <th
              style={{
                width: "30%",
              }}
            />
            <th />
          </tr>
        </thead>
        <tbody>
          {terms.map((term) => (
            <tr key={term.termName}>
              <td>
                <Typography
                  fontWeight={700}
                  fontSize={12}
                  sx={{
                    padding: 1,
                    color: "neutral.600",
                  }}
                >
                  {term.termName}
                </Typography>
              </td>
              <td>
                <Typography
                  fontWeight={400}
                  fontSize={14}
                  sx={{
                    padding: 1,
                    color: "neutral.1000",
                  }}
                >
                  {term.termValue}
                </Typography>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  );
};

export const DataGridTermsTable: React.FC<{
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
