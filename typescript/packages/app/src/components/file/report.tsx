import { Outputs, Progess } from "@fgpt/precedent-iso";
import {
  Box,
  CircularProgress,
  LinearProgress,
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

import { useFetchReport } from "../../hooks/use-fetch-output";

export const DisplayFileReport: React.FC<{ fileReferenceId: string }> = ({
  fileReferenceId,
}) => {
  const { data, isLoading } = useFetchReport(fileReferenceId);
  const progress = data?.progress;

  const formattedProgress = formatProgress(progress);

  return (
    <Box
      display="flex"
      width="100%"
      height="100%"
      maxWidth="100%"
      maxHeight="100%"
      overflow="auto"
    >
      {isLoading && (
        <Box width="100%" paddingTop={1}>
          <LinearProgress />
        </Box>
      )}
      {data && progress && progress.total === progress.value ? (
        <DisplayReport report={data.report} />
      ) : (
        <Box display="flex" gap={2} padding={2}>
          <CircularProgress size="1.5rem" />
          <Typography>
            Report is still generating.{" "}
            {formattedProgress ? `${formattedProgress} complete` : ""}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

function formatProgress(progress: Progess | undefined): string | undefined {
  if (!progress) {
    return undefined;
  }
  if (progress.total === 0) {
    return undefined;
  }
  return (progress.value / progress.total) * 100 + "%";
}

const DisplayReport: React.FC<{ report: Outputs.Report }> = ({
  report: { summaries, financialSummary, terms },
}) => {
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
