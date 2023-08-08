import {
  AnalyzeResponseChunk,
  assertNever,
  ExcelOutputToRender,
  FileStatus,
  FileToRender,
  isNotNull,
  Outputs,
  StatusForPrompts,
} from "@fgpt/precedent-iso";
import { Term } from "@fgpt/precedent-iso/src/models/llm-outputs";
import ArrowDropDown from "@mui/icons-material/ArrowDropDownOutlined";
import CloseFullscreenOutlinedIcon from "@mui/icons-material/CloseFullscreenOutlined";
import OpenInFullOutlinedIcon from "@mui/icons-material/OpenInFullOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/joy";
import Image from "next/image";
import React from "react";

import { useTriggerOutput } from "../../hooks/use-trigger-output";
import { DangerousHTMLElementChat } from "../html-element";
import { TermsTable } from "../terms-table";
import styles from "./display-report.module.css";

export const DisplayFileReport: React.FC<{
  file: FileToRender.File;
}> = ({ file }) => {
  const terms = file.type === "pdf" ? file.report?.terms ?? [] : [];
  file.type === "pdf" ? file.statusForPrompts.kpi : undefined;
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
      {file.status === "pending" && (
        <Box
          display="flex"
          bgcolor="#2B1657"
          flexDirection="column"
          padding={2}
          borderRadius={8}
          gap={1}
        >
          <Typography
            level="h4"
            className={styles.analyzing}
            sx={{ fontWeight: 700, color: "white", fontSize: "16px" }}
          >
            Analyzing
          </Typography>

          <Typography
            sx={{ fontWeight: 400, color: "white", fontSize: "14px" }}
          >
            Paredo is hard at work analyzing this document for you!
            <br /> This can take a few minutes. You do not have to stay on this
            screen.
          </Typography>
        </Box>
      )}
      {file.type === "pdf" && (
        <ForOverview
          projectId={file.projectId}
          fileReferenceId={file.id}
          status={file.status}
          description={file.description}
          terms={terms}
          statusForPrompts={file.statusForPrompts}
        />
      )}
      <ForReport file={file} />
      {file.type === "pdf" && <ForPrompt file={file} />}
    </Box>
  );
};

const Dispatch: React.FC<{
  file: FileToRender.File;
}> = ({ file }) => {
  switch (file.type) {
    case "pdf":
      if (!file.report) {
        return null;
      }
      return <PdfReport report={file.report} />;
    case "excel":
      return <ForExcelOutput output={file.output} />;
    default:
      assertNever(file);
  }
};

const ForExcelOutput: React.FC<{
  output: ExcelOutputToRender;
}> = ({ output: { claude } }) => {
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
      <ForExcel chunks={claude} />
    </Box>
  );
};

const ForExcel: React.FC<{ chunks: AnalyzeResponseChunk[] }> = ({ chunks }) => {
  const allHTML = chunks
    .map((chunk) =>
      chunk.html
        ? {
            html: chunk.html,
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
              level="title-md"
              sx={{
                fontWeight: 700,
              }}
            >
              {formatSheetNames(sheetNames)}
            </Typography>
            <Divider />
            <DangerousHTMLElementChat html={html} />
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
      <Typography level="title-sm">
        {formatSheetNames(chunk.sheetNames)}
      </Typography>
      <Typography whiteSpace="pre-wrap">{chunk.content}</Typography>
    </Box>
  );
};

const PdfReport: React.FC<{
  report: Outputs.Report;
}> = ({ report }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={1}
      maxHeight="100%"
      overflow="auto"
      width="100%"
    >
      <ClaudeReport longForm={report.longForm} />
    </Box>
  );
};

const ForOverview: React.FC<{
  fileReferenceId: string;
  projectId: string;
  status: FileStatus;
  description: string | undefined;
  terms: Term[];
  statusForPrompts: StatusForPrompts;
}> = ({
  fileReferenceId,
  status,
  description,
  terms,
  projectId,
  statusForPrompts,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const withDescription = description
    ? [{ termName: "Description", termValue: description }, ...terms]
    : terms;
  const { trigger, isMutating } = useTriggerOutput(fileReferenceId);
  if (status === "pending") {
    return (
      <Box
        display="flex"
        width="100%"
        height="auto"
        maxHeight="100%"
        overflow="auto"
        sx={(theme) => ({
          border: `1px solid ${theme.vars.palette.neutral[100]}`,
        })}
        borderRadius={8}
        bgcolor="neutral.0"
        alignItems="center"
        justifyContent="space-between"
        padding={2}
      >
        <Typography
          level="h4"
          sx={{
            fontWeight: 700,
            color: "#666",
          }}
        >
          Overview
        </Typography>

        <Image
          priority
          src="/paredo-second.svg"
          height={64}
          width={64}
          className={styles.rotating}
          alt="Paredo icon"
        />
      </Box>
    );
  }
  return (
    <Box
      display="flex"
      width="100%"
      height="auto"
      maxHeight="100%"
      overflow={collapsed ? undefined : "auto"}
      sx={(theme) => ({
        border: `1px solid ${theme.vars.palette.neutral[100]}`,
      })}
      flexDirection="column"
      borderRadius={8}
      bgcolor="neutral.0"
    >
      <Box
        display="flex"
        justifyContent="space-between"
        padding={2}
        alignItems="center"
      >
        <Box display="flex" gap={2} alignItems="center">
          <Typography
            level="h4"
            sx={{
              fontWeight: 700,
              color: "black",
            }}
          >
            Overview
          </Typography>
          <StatusBubble status={status} />
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <Button
            onClick={() =>
              trigger({
                fileReferenceId,
                slug: "kpi",
                projectId,
              })
            }
            loading={isMutating}
            disabled={statusForPrompts["kpi"] !== "not_created"}
            size="sm"
          >
            Generate KPI Report
          </Button>

          <IconButton
            size="sm"
            onClick={() => setCollapsed((prev) => !prev)}
            sx={{
              "&:hover": {
                bgcolor: "transparent",
              },
            }}
          >
            {collapsed ? (
              <OpenInFullOutlinedIcon fontSize="small" />
            ) : (
              <CloseFullscreenOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Box>
      {!collapsed && (
        <>
          <Divider />
          {withDescription.length > 0 && (
            <Box
              display="flex"
              flexDirection="column"
              gap={1}
              overflow="auto"
              padding={2}
              height="100%"
            >
              <TermsTable terms={withDescription} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

const ForReport: React.FC<{
  file: FileToRender.File;
}> = ({ file }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  if (file.status === "pending") {
    return (
      <Box
        display="flex"
        width="100%"
        height="auto"
        maxHeight="100%"
        sx={(theme) => ({
          border: `1px solid ${theme.vars.palette.neutral[100]}`,
        })}
        borderRadius={8}
        bgcolor="neutral.0"
        alignItems="center"
        justifyContent="space-between"
        padding={2}
      >
        <Typography
          level="h4"
          sx={{
            fontWeight: 700,
            color: "#666",
          }}
        >
          Report
        </Typography>

        <Image
          priority
          src="/paredo-second.svg"
          height={64}
          width={64}
          className={styles.rotating}
          alt="Paredo icon"
        />
      </Box>
    );
  }
  return (
    <Box
      display="flex"
      width="100%"
      height={collapsed ? undefined : "100%"}
      maxHeight="100%"
      overflow={collapsed ? undefined : "auto"}
      sx={(theme) => ({
        border: `1px solid ${theme.vars.palette.neutral[100]}`,
      })}
      flexDirection="column"
      borderRadius={8}
      bgcolor="white"
    >
      <Box
        display="flex"
        gap={2}
        padding={2}
        justifyContent="space-between"
        alignItems="center"
        height="auto"
      >
        <Typography
          level="h4"
          sx={{
            fontWeight: 700,
            color: "black",
          }}
        >
          Report
        </Typography>

        <Box display="flex" alignItems="center" gap={2}>
          <DownloadButton
            fileName={file.fileName}
            signedUrl={file.signedUrl}
            extractedTablesSignedUrl={
              file.type === "pdf" ? file.derivedSignedUrl : undefined
            }
          />
          <IconButton
            size="sm"
            onClick={() => setCollapsed((prev) => !prev)}
            sx={{
              "&:hover": {
                bgcolor: "transparent",
              },
            }}
          >
            {collapsed ? (
              <OpenInFullOutlinedIcon fontSize="small" />
            ) : (
              <CloseFullscreenOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Box>
      {!collapsed && (
        <>
          <Divider />
          <Box display="flex" padding={2} maxHeight="100%" overflow="auto">
            <Dispatch file={file} />
          </Box>
        </>
      )}
    </Box>
  );
};

const ForPrompt: React.FC<{ file: FileToRender.PDFFile }> = ({ file }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const statusForKpi = file.statusForPrompts["kpi"];
  if (statusForKpi === "not_created" || !file.report) {
    return null;
  }
  const outputForSlug = file.report.outputs.find(
    (output) => output.slug === "kpi",
  );

  const isLoading = statusForKpi === "queued" || statusForKpi === "in-progress";
  return (
    <Box
      display="flex"
      width="100%"
      height="auto"
      maxHeight="100%"
      sx={(theme) => ({
        border: `1px solid ${theme.vars.palette.neutral[100]}`,
      })}
      borderRadius={8}
      bgcolor="neutral.0"
      alignItems="center"
      justifyContent="space-between"
      flexDirection="column"
      overflow={
        isLoading || collapsed || statusForKpi === "failed" ? undefined : "auto"
      }
    >
      <Box
        display="flex"
        width="100%"
        justifyContent="space-between"
        alignItems="center"
        height="auto"
        padding={2}
      >
        <Typography
          level="h4"
          sx={{
            fontWeight: 700,
            color: "#666",
          }}
        >
          Outputs
        </Typography>

        {isLoading && (
          <Image
            priority
            src="/paredo-second.svg"
            height={64}
            width={64}
            className={styles.rotating}
            alt="Paredo icon"
          />
        )}
        {!isLoading && (
          <IconButton
            size="sm"
            onClick={() => setCollapsed((prev) => !prev)}
            sx={{
              "&:hover": {
                bgcolor: "transparent",
              },
            }}
          >
            {collapsed ? (
              <OpenInFullOutlinedIcon fontSize="small" />
            ) : (
              <CloseFullscreenOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        )}
      </Box>
      {!isLoading && !collapsed && (
        <>
          <Divider />
          <DispatchForKpi status={statusForKpi} output={outputForSlug} />
        </>
      )}
    </Box>
  );
};

const DispatchForKpi: React.FC<{
  status: "succeeded" | "failed";
  output: Outputs.PromptOutput | undefined;
}> = ({ status, output }) => {
  return (
    <Box
      display="flex"
      width="100%"
      maxHeight="100%"
      overflow="auto"
      padding={2}
    >
      {status === "failed" && (
        <Alert variant="outlined" size="sm" color="danger">
          This operation errored
        </Alert>
      )}
      {status === "succeeded" && output === undefined && (
        <Alert variant="outlined" size="sm" color="danger">
          This operation succeeded, but no output was generated
        </Alert>
      )}
      {status === "succeeded" && output && (
        <Box
          display="flex"
          flexDirection="column"
          gap={1}
          maxHeight="100%"
          overflow="auto"
          width="100%"
        >
          <ClaudeReport longForm={[output]} />
        </Box>
      )}
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
              fontSize: "14px",
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
              fontSize: "14px",
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
              fontSize: "14px",
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
        <DangerousHTMLElementChat key={idx} html={html} />
      ))}
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
      <Button component="a" href={signedUrl} target="_blank" size="sm">
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
        size="sm"
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
