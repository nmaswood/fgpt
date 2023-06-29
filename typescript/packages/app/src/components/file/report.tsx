import {
  AnalyzeOutput,
  AnalyzeResponseChunk,
  assertNever,
  FileToRender,
  Outputs,
} from "@fgpt/precedent-iso";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export const DisplayFileReport: React.FC<{
  file: FileToRender.File;
}> = ({ file }) => {
  return (
    <Box
      display="flex"
      width="100%"
      height="100%"
      maxWidth="100%"
      maxHeight="100%"
      overflow="auto"
      flexDirection="column"
    >
      <Dispatch file={file} />;
    </Box>
  );
};

const Dispatch: React.FC<{ file: FileToRender.File }> = ({ file }) => {
  switch (file.type) {
    case "pdf":
      return <ForPDF report={file.report} />;
    case "excel":
      return <ForExcel output={file.output} />;
    default:
      assertNever(file);
  }
};

const ForExcel: React.FC<{ output: AnalyzeOutput | undefined }> = ({
  output,
}) => {
  const chunks = output?.value ?? [];

  return (
    <>
      {chunks.map((chunk, i) => (
        <ForExcelValue key={i} chunk={chunk} />
      ))}
    </>
  );
};

const ForExcelValue: React.FC<{ chunk: AnalyzeResponseChunk }> = ({
  chunk,
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={3}
      maxWidth="100%"
      maxHeight="100%"
      overflow="auto"
      padding={2}
    >
      <Typography variant="h6" sx={{ textDecoration: "underline" }}>
        {formatSheetNames(chunk.sheetNames)}
      </Typography>
      <Typography>{chunk.content}</Typography>
    </Box>
  );
};
const ForPDF: React.FC<{ report: Outputs.Report | undefined }> = ({
  report,
}) => {
  if (!report) {
    return null;
  }
  const { summaries, financialSummary, terms } = report;
  return (
    <Box display="flex" flexDirection="column" gap={1} padding={2}>
      {terms.length > 0 && (
        <Box display="flex" flexDirection="column">
          <Typography variant="h5">Terms</Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      minWidth: "250px",
                    }}
                  ></TableCell>
                  <TableCell
                    sx={{
                      maxWidth: "400px",
                    }}
                  ></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {terms.map((term, index) => (
                  <TableRow
                    key={index}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {term.termName}
                    </TableCell>
                    <TableCell>{term.termValue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {summaries.length > 0 && (
        <>
          <Typography variant="h5">Summary</Typography>

          <List sx={{ listStyleType: "disc" }}>
            {summaries.map((summary, idx) => (
              <ListItem key={idx}>
                <ListItemText>{summary}</ListItemText>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {financialSummary.financialSummaries.length > 0 && (
        <>
          <Typography variant="h5">Financial Summary</Typography>
          <List sx={{ listStyleType: "disc" }}>
            {financialSummary.financialSummaries.map((summary, idx) => (
              <ListItem key={idx}>
                <ListItemText>{summary}</ListItemText>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {financialSummary.investmentRisks.length > 0 && (
        <>
          <Typography variant="h5">Investment risks</Typography>
          <List sx={{ listStyleType: "disc" }}>
            {financialSummary.investmentRisks.map((risk, idx) => (
              <ListItem key={idx}>
                <ListItemText>{risk}</ListItemText>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {financialSummary.investmentMerits.length > 0 && (
        <>
          <Typography variant="h5">Investment merits</Typography>
          <List sx={{ listStyleType: "disc" }}>
            {financialSummary.investmentMerits.map((merit, idx) => (
              <ListItem key={idx}>
                <ListItemText>{merit}</ListItemText>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

function formatSheetNames(sheetNames: string[]): string {
  if (sheetNames.length === 0) {
    return "";
  } else if (sheetNames.length === 1) {
    return sheetNames[0]!;
  }

  const [first] = sheetNames;
  const last = sheetNames.at(-1);

  return `${first} to ${last}`;
}
