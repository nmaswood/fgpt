import {
  AnalyzeResponseChunk,
  assertNever,
  ExcelOutputToRender,
  FileToRender,
  Outputs,
} from "@fgpt/precedent-iso";
import {
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemContent,
  Option,
  Select,
  Typography,
} from "@mui/joy";
import React from "react";

import { TermsTable } from "../terms-table";
import { ReportType } from "./report-type";

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
      padding={2}
      gap={2}
      bgcolor="#F5F5F5"
    >
      <Baz />
      <Bar />
      <Dispatch file={file} />
    </Box>
  );
};

const Dispatch: React.FC<{ file: FileToRender.File }> = ({ file }) => {
  switch (file.type) {
    case "pdf":
      return <PdfReport report={file.report} />;
    case "excel":
      return <ForExcelOutput output={file.output} />;
    default:
      assertNever(file);
  }
};

export const ForExcelOutput: React.FC<{ output: ExcelOutputToRender }> = ({
  output: { claude, gpt },
}) => {
  const hasBoth = gpt.length > 0 && claude.length > 0;
  const [value, setValue] = React.useState<ReportType>("gpt4");
  const output = value == "gpt4" ? gpt : claude;
  return (
    <Box
      display="flex"
      height="100"
      width="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      flexDirection="column"
    >
      {hasBoth && (
        <Select
          value={value}
          sx={{
            width: "fit-content",
          }}
          onChange={(_, newValue) => {
            if (newValue) {
              setValue(newValue);
            }
          }}
        >
          <Option value="gpt4">GPT-4</Option>
          <Option value="claude">Claude</Option>
        </Select>
      )}
      <ForExcel chunks={output} />
    </Box>
  );
};

export const ForExcel: React.FC<{ chunks: AnalyzeResponseChunk[] }> = ({
  chunks,
}) => {
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
      padding={2}
      overflow="auto"
    >
      <Typography level="h6">{formatSheetNames(chunk.sheetNames)}</Typography>
      <Typography whiteSpace="pre-wrap">{chunk.content}</Typography>
    </Box>
  );
};

const PdfReport: React.FC<{ report: Outputs.Report | undefined }> = ({
  report,
}) => {
  const [value, setValue] = React.useState<ReportType>("gpt4");
  if (!report) {
    return null;
  }

  const hasClaude = report.longForm.length > 0;
  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={1}
      padding={2}
      maxHeight="100%"
      overflow="auto"
    >
      {hasClaude && (
        <Select
          value={value}
          sx={{
            width: "fit-content",
          }}
          onChange={(_, newValue) => {
            if (newValue) {
              setValue(newValue);
            }
          }}
        >
          <Option value="gpt4">GPT-4</Option>
          <Option value="claude">Claude</Option>
        </Select>
      )}
      {value === "claude" && <ClaudeReport longForm={report.longForm} />}
      {value === "gpt4" && <ChatGPTReport report={report} />}
    </Box>
  );
};

const Baz = () => {
  return (
    <Box
      display="flex"
      width="100%"
      maxHeight="100%"
      overflow="auto"
      minHeight="200px"
      sx={(theme) => ({
        border: `1px solid ${theme.vars.palette.neutral[100]}`,
      })}
      flexDirection="column"
      borderRadius={8}
      bgcolor="neutral.0"
    >
      <Box display="flex" gap={2} padding={2}>
        <Typography
          level="h4"
          sx={{
            fontWeight: 700,
          }}
        >
          Overview
        </Typography>
        <StatusBubble />
      </Box>
      <Divider />
      <Box display="flex" padding={2}>
        <Typography>I love cats</Typography>
      </Box>
    </Box>
  );
};

const Bar = () => {
  return (
    <Box
      display="flex"
      width="100%"
      maxHeight="100%"
      overflow="auto"
      minHeight="200px"
      sx={(theme) => ({
        border: `1px solid ${theme.vars.palette.neutral[100]}`,
      })}
      flexDirection="column"
      borderRadius={8}
      bgcolor="white"
    >
      <Box display="flex" gap={2} padding={2}>
        <Typography
          level="h4"
          sx={{
            fontWeight: 700,
          }}
        >
          Report
        </Typography>

        <Select
          value={"claude"}
          sx={{
            width: "fit-content",
          }}
        >
          <Option value="gpt4">GPT-4</Option>
          <Option value="claude">Claude</Option>
        </Select>
      </Box>
      <Divider />
      <Box display="flex" padding={2}>
        <Typography>I love cats</Typography>
      </Box>
    </Box>
  );
};

const StatusBubble = () => {
  return (
    <Box>
      <Chip>Ready</Chip>
    </Box>
  );
};

const ClaudeReport: React.FC<{
  longForm: string[];
}> = ({ longForm }) => {
  const allText = longForm.join("\n");
  return <Typography whiteSpace="pre-wrap"> {allText}</Typography>;
};

const ChatGPTReport: React.FC<{
  report: Outputs.Report;
}> = ({ report: { summaries, financialSummary, terms } }) => {
  return (
    <Box display="flex" flexDirection="column" maxHeight="100%" overflow="auto">
      {terms.length > 0 && (
        <Box
          display="flex"
          flexDirection="column"
          gap={1}
          maxHeight="100%"
          overflow="auto"
        >
          <TermsTable terms={terms} />
        </Box>
      )}

      {summaries.length > 0 && (
        <>
          <Typography level="h5">Summary</Typography>

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
