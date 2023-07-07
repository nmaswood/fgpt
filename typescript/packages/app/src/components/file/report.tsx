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
  ListItemContent,
  Table,
  Typography,
} from "@mui/joy";

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
      <Dispatch file={file} />
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

export const ForExcel: React.FC<{ output: AnalyzeOutput | undefined }> = ({
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

export const ForExcelValue: React.FC<{ chunk: AnalyzeResponseChunk }> = ({
  chunk,
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={1}
      maxWidth="100%"
      maxHeight="100%"
      overflow="auto"
      padding={2}
    >
      <Typography level="h6">{formatSheetNames(chunk.sheetNames)}</Typography>
      <Typography whiteSpace="pre-wrap">{chunk.content}</Typography>
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
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography level="h4">Terms</Typography>

          <Table variant="outlined">
            <thead>
              <tr>
                <th>
                  <Typography>Term</Typography>
                </th>
                <th>
                  <Typography>Value</Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {terms.map((term, index) => (
                <tr key={index}>
                  <td scope="row">
                    <Typography>{term.termName}</Typography>
                  </td>
                  <td>
                    <Typography>{term.termValue}</Typography>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Box>
      )}

      {summaries.length > 0 && (
        <>
          <Typography level="h4">Summary</Typography>

          <List sx={{ listStyleType: "disc" }}>
            {summaries.map((summary, idx) => (
              <ListItem key={idx}>
                <ListItemContent>{summary}</ListItemContent>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {financialSummary.financialSummaries.length > 0 && (
        <>
          <Typography>Financial Summary</Typography>
          <List sx={{ listStyleType: "disc" }}>
            {financialSummary.financialSummaries.map((summary, idx) => (
              <ListItem key={idx}>
                <ListItemContent>{summary}</ListItemContent>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {financialSummary.investmentRisks.length > 0 && (
        <>
          <Typography>Investment risks</Typography>
          <List sx={{ listStyleType: "disc" }}>
            {financialSummary.investmentRisks.map((risk, idx) => (
              <ListItem key={idx}>
                <ListItemContent>{risk}</ListItemContent>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {financialSummary.investmentMerits.length > 0 && (
        <>
          <Typography>Investment merits</Typography>
          <List sx={{ listStyleType: "disc" }}>
            {financialSummary.investmentMerits.map((merit, idx) => (
              <ListItem key={idx}>
                <ListItemContent>{merit}</ListItemContent>
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
