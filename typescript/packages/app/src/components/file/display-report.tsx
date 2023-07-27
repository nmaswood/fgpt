import {
  AnalyzeResponseChunk,
  assertNever,
  ExcelOutputToRender,
  FileStatus,
  FileToRender,
  isNotNull,
  Outputs,
} from "@fgpt/precedent-iso";
import { Term } from "@fgpt/precedent-iso/src/models/llm-outputs";
import ArrowDropDown from "@mui/icons-material/ArrowDropDownOutlined";
import {
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemContent,
  Menu,
  MenuItem,
  Option,
  Select,
  Typography,
} from "@mui/joy";
import React from "react";

import { TermsTable } from "../terms-table";
import { ReportType } from "./report-type";

export const DisplayFileReport: React.FC<{
  file: FileToRender.File;
  showAdminOnly: boolean;
}> = ({ file, showAdminOnly }) => {
  const terms = file.type === "pdf" ? file.report?.terms ?? [] : [];
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
      {file.type === "pdf" && (
        <ForOverview
          status={file.status}
          description={file.description}
          terms={terms}
        />
      )}
      <ForReport file={file} showAdminOnly={showAdminOnly} />
    </Box>
  );
};

const Dispatch: React.FC<{
  file: FileToRender.File;
  reportType: ReportType;
  setReportType: (reportType: ReportType) => void;
}> = ({ file, reportType, setReportType }) => {
  switch (file.type) {
    case "pdf":
      if (!file.report) {
        return null;
      }
      return (
        <PdfReport
          report={file.report}
          reportType={reportType}
          setReportType={setReportType}
        />
      );
    case "excel":
      return <ForExcelOutput output={file.output} reportType={reportType} />;
    default:
      assertNever(file);
  }
};

const ForExcelOutput: React.FC<{
  output: ExcelOutputToRender;
  reportType: ReportType;
}> = ({ output: { claude, gpt }, reportType }) => {
  const output = reportType == "gpt4" ? gpt : claude;
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
      <ForExcel chunks={output} />
    </Box>
  );
};

const ForExcel: React.FC<{ chunks: AnalyzeResponseChunk[] }> = ({ chunks }) => {
  const allHTML = chunks
    .map((chunk) =>
      chunk.sanitizedHtml
        ? {
            html: chunk.sanitizedHtml,
            sheetNames: chunk.sheetNames,
          }
        : null,
    )
    .filter(isNotNull);
  if (allHTML.length) {
    return (
      <Box>
        {allHTML.map(({ html, sheetNames }, idx) => (
          <Box key={idx}>
            <Typography
              level="h5"
              sx={{
                fontWeight: 700,
              }}
            >
              {formatSheetNames(sheetNames)}
            </Typography>
            <Divider />
            <Box
              key={idx}
              dangerouslySetInnerHTML={{ __html: html }}
              sx={(theme) => ({
                "& *": {
                  fontSize: "14px",
                  fontFamily: theme.vars.fontFamily.body,
                },
              })}
            />
          </Box>
        ))}
      </Box>
    );
  }

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

const PdfReport: React.FC<{
  report: Outputs.Report;
  reportType: ReportType;
  setReportType: (reportType: ReportType) => void;
}> = ({ report, reportType }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={1}
      maxHeight="100%"
      overflow="auto"
    >
      {reportType === "claude" && <ClaudeReport longForm={report.longForm} />}
      {reportType === "gpt4" && <ChatGPTReport report={report} />}
    </Box>
  );
};

const ForOverview: React.FC<{
  status: FileStatus;
  description: string | undefined;
  terms: Term[];
}> = ({ status, description, terms }) => {
  return (
    <Box
      display="flex"
      width="100%"
      height="100%"
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
      <Box display="flex" gap={2} padding={2} alignItems="center">
        <Typography
          level="h4"
          sx={{
            fontWeight: 700,
          }}
        >
          Overview
        </Typography>
        <StatusBubble status={status} />
      </Box>
      <Divider />
      {terms.length > 0 && (
        <Box
          display="flex"
          flexDirection="column"
          gap={1}
          maxHeight="50%"
          overflow="auto"
          padding={2}
        >
          <TermsTable terms={terms} />
        </Box>
      )}

      {description && (
        <Box
          display="flex"
          padding={2}
          flexDirection="column"
          gap={1}
          flexShrink={0}
        >
          <Typography
            level="h6"
            sx={{
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            Description
          </Typography>
          <Typography whiteSpace="pre-wrap">{description}</Typography>
        </Box>
      )}
    </Box>
  );
};

const ForReport: React.FC<{
  file: FileToRender.File;
  showAdminOnly: boolean;
}> = ({ file, showAdminOnly }) => {
  const [reportType, setReportType] = React.useState<ReportType>("claude");
  return (
    <Box
      display="flex"
      width="100%"
      height="100%"
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
      <Box display="flex" gap={2} padding={2} justifyContent="space-between">
        <Box display="flex" gap={2}>
          <Typography
            level="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Report
          </Typography>
          {showAdminOnly && (
            <Select
              size="sm"
              value={reportType}
              sx={{
                width: "fit-content",
              }}
              onChange={(_, newValue) => {
                if (newValue) {
                  setReportType(newValue);
                }
              }}
            >
              <Option value="gpt4">GPT-4</Option>
              <Option value="claude">Claude</Option>
            </Select>
          )}
        </Box>

        <DownloadButton
          fileName={file.fileName}
          signedUrl={file.signedUrl}
          extractedTablesSignedUrl={
            file.type === "pdf" ? file.derivedSignedUrl : undefined
          }
        />
      </Box>
      <Divider />
      <Box display="flex" padding={2}>
        <Dispatch
          file={file}
          reportType={reportType}
          setReportType={setReportType}
        />
      </Box>
    </Box>
  );
};

const StatusBubble: React.FC<{ status: FileStatus }> = ({ status }) => {
  const Inner = () => {
    switch (status) {
      case "pending":
        return (
          <Chip
            size="sm"
            sx={{
              background: "#fff",
              color: "neutral.600",
              border: "1px solid #E5E5E5",
              fontWeight: 700,
            }}
          >
            Analyzing
          </Chip>
        );
      case "ready":
        return (
          <Chip
            size="sm"
            sx={{
              background: "#fff",
              color: "success.solidColor",
              border: "1px solid #E5E5E5",
              fontWeight: 700,
            }}
          >
            Ready
          </Chip>
        );
      case "error":
        return (
          <Chip
            size="sm"
            sx={{
              background: "#fff",
              color: "danger.solidColor",
              border: "1px solid #E5E5E5",
              fontWeight: 700,
            }}
          >
            Error
          </Chip>
        );

      default:
        assertNever(status);
    }
  };

  return (
    <Box>
      <Inner />
    </Box>
  );
};

const ClaudeReport: React.FC<{
  longForm: Outputs.LongForm[];
}> = ({ longForm }) => {
  const hasHtml = longForm.some((lf) => lf.html);
  if (!hasHtml) {
    const allText = longForm.map((lf) => lf.raw).join("\n");
    return <Typography whiteSpace="pre-wrap"> {allText}</Typography>;
  }

  const allHtml = longForm.map((lf) => lf.html).filter(isNotNull);
  return (
    <Box>
      {allHtml.map((html, idx) => (
        <Box
          key={idx}
          dangerouslySetInnerHTML={{ __html: html }}
          sx={(theme) => ({
            "& *": {
              fontSize: "14px",
              fontFamily: theme.vars.fontFamily.body,
            },
          })}
        />
      ))}
    </Box>
  );
};

const ChatGPTReport: React.FC<{
  report: Outputs.Report;
}> = ({ report: { summaries, financialSummary } }) => {
  return (
    <Box display="flex" flexDirection="column" maxHeight="100%" overflow="auto">
      {summaries.length > 0 && (
        <>
          <Typography
            level="h5"
            sx={{
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            Summary
          </Typography>

          <List sx={{ listStyleType: "disc", pl: 4 }}>
            {summaries.map((summary, idx) => (
              <ListItem
                key={idx}
                sx={{
                  paddingX: 0,
                  display: "list-item",
                }}
              >
                <ListItemContent>{summary}</ListItemContent>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {financialSummary.financialSummaries.length > 0 && (
        <>
          <Typography
            level="h5"
            sx={{
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            Financial Summary
          </Typography>
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
          <Typography
            level="h5"
            sx={{
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            Investment Risks
          </Typography>
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
          <Typography
            level="h5"
            sx={{
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            Investment Merits
          </Typography>
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

const DownloadButton: React.FC<{
  fileName: string;
  signedUrl: string;
  extractedTablesSignedUrl: string | undefined;
}> = ({ signedUrl, extractedTablesSignedUrl }) => {
  const buttonRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  if (!extractedTablesSignedUrl) {
    return (
      <Button component="a" href={signedUrl} target="_blank">
        Download Asset
      </Button>
    );
  }

  return (
    <div>
      <Button
        ref={buttonRef}
        variant="outlined"
        onClick={() => {
          setOpen(!open);
        }}
        endDecorator={<ArrowDropDown />}
      >
        Download
      </Button>
      <Menu anchorEl={buttonRef.current} open={open} onClose={handleClose}>
        <MenuItem
          component="a"
          href={signedUrl}
          target="_blank"
          onClick={() => handleClose()}
        >
          Download asset
        </MenuItem>
        {extractedTablesSignedUrl && (
          <MenuItem
            component="a"
            href={extractedTablesSignedUrl}
            target="_blank"
            onClick={() => handleClose()}
          >
            Download extracted tables
          </MenuItem>
        )}
      </Menu>
    </div>
  );
};
