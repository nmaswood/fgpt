import {
  AnalyzeResponseChunk,
  assertNever,
  FileStatus,
  FileToRender,
  isNotNull,
  Outputs,
  PromptSlug,
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
  Divider,
  Dropdown,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  Typography,
} from "@mui/joy";
import Image from "next/image";
import React from "react";

import { useTriggerOutput } from "../../hooks/use-trigger-output";
import { DangerousHTMLElementChat } from "../html-element";
import { TermsTable } from "../terms-table";
import styles from "./display-report.module.css";
import { formatSheetNames } from "./format-sheet-names";
import { StatusBubble } from "./status-bubble";

export const DisplayFileReport: React.FC<{
  file: FileToRender.File;
}> = ({ file }) => {
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
      {file.status === "pending" && <HardAtWork />}
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
      return (
        <Box
          display="flex"
          flexDirection="column"
          maxHeight="100%"
          overflow="auto"
          width="100%"
        >
          <ClaudeReport longForm={file.report.cim} />
        </Box>
      );
    case "excel":
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
          <ForExcel chunks={file.output} />
        </Box>
      );
    default:
      assertNever(file);
  }
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
            <Typography fontWeight={700} level="title-md">
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

  if (status === "pending") {
    return <LoadingHeader copy="Overview" />;
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
            fontWeight={700}
            sx={{
              color: "black",
            }}
          >
            Overview
          </Typography>
          <StatusBubble status={status} />
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <CustomReportButton
            projectId={projectId}
            fileReferenceId={fileReferenceId}
            statusForPrompts={statusForPrompts}
          />

          <CollapseButton
            toggle={() => setCollapsed((prev) => !prev)}
            collapsed={collapsed}
          />
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
    return <LoadingHeader copy="Report" />;
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
          fontWeight={700}
          sx={{
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
          <CollapseButton
            toggle={() => setCollapsed((prev) => !prev)}
            collapsed={collapsed}
          />
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
  const [collapsed, setCollapsed] = React.useState(true);
  const statusForKpi = file.statusForPrompts["kpi"];
  if (statusForKpi === "not_created" || !file.report) {
    return null;
  }
  const isLoading = statusForKpi === "queued" || statusForKpi === "in-progress";
  if (isLoading) {
    return <LoadingHeader copy="Outputs" />;
  }
  const isError = statusForKpi === "failed";
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
      overflow={collapsed || isError ? undefined : "auto"}
    >
      <Box
        display="flex"
        width="100%"
        justifyContent="space-between"
        alignItems="center"
        height="auto"
        padding={2}
      >
        <Box display="flex" gap={2} alignItems="center">
          <Typography
            level="h4"
            fontWeight={700}
            sx={{
              color: "black",
            }}
          >
            Outputs
          </Typography>

          {isError && <StatusBubble status={"error"} />}
        </Box>
        {!isError && (
          <CollapseButton
            toggle={() => setCollapsed((prev) => !prev)}
            collapsed={collapsed}
          />
        )}
      </Box>
      {!isLoading && !collapsed && !isError && (
        <>
          <Divider />
          <DispatchForKpi status={statusForKpi} output={file.report.kpi} />
        </>
      )}
    </Box>
  );
};

const DispatchForKpi: React.FC<{
  status: "succeeded" | "failed";
  output: Outputs.DisplayOutput | undefined;
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
          <ClaudeReport longForm={output} />
        </Box>
      )}
    </Box>
  );
};

const ClaudeReport: React.FC<{
  longForm: Outputs.DisplayOutput;
}> = ({ longForm }) => {
  switch (longForm.type) {
    case "raw": {
      const text = longForm.value.join("\n");
      return <Typography whiteSpace="pre-wrap"> {text}</Typography>;
    }
    case "html":
      return (
        <Box>
          {longForm.value.map((html, idx) => (
            <DangerousHTMLElementChat key={idx} html={html} />
          ))}
        </Box>
      );
    default:
      assertNever(longForm.type);
  }
};

const DownloadButton: React.FC<{
  fileName: string;
  signedUrl: string;
  extractedTablesSignedUrl: string | undefined;
}> = ({ signedUrl, extractedTablesSignedUrl }) => {
  const buttonRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);

  const handleClose = () => setOpen(false);
  if (!extractedTablesSignedUrl) {
    return (
      <Button component="a" href={signedUrl} target="_blank" size="sm">
        Download Source Document
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
          onClick={handleClose}
        >
          Download Source Document
        </MenuItem>
        {extractedTablesSignedUrl && (
          <MenuItem
            component="a"
            href={extractedTablesSignedUrl}
            target="_blank"
            onClick={handleClose}
          >
            Download Extracted Tables
          </MenuItem>
        )}
      </Menu>
    </div>
  );
};

const CollapseButton: React.FC<{
  collapsed: boolean;
  toggle: () => void;
}> = ({ collapsed, toggle }) => (
  <IconButton
    size="sm"
    onClick={toggle}
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
);

const LoadingHeader: React.FC<{
  copy: string;
}> = ({ copy }) => {
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
        fontWeight={700}
        sx={{
          color: "neutral.600",
        }}
      >
        {copy}
      </Typography>

      <ParedoIcon />
    </Box>
  );
};

const ParedoIcon = () => (
  <Image
    priority
    src="/paredo-second.svg"
    height={64}
    width={64}
    className={styles.rotating}
    alt="Paredo icon"
  />
);

const HardAtWork: React.FC = () => (
  <Box
    display="flex"
    bgcolor="primary.800"
    flexDirection="column"
    padding={2}
    borderRadius={8}
    gap={1}
  >
    <Typography
      level="h4"
      className={styles.analyzing}
      fontWeight={700}
      fontSize="16px"
      sx={{ color: "white" }}
    >
      Analyzing
    </Typography>

    <Typography fontWeight={400} fontSize="14px" sx={{ color: "white" }}>
      Paredo is hard at work analyzing this document for you!
      <br /> This can take a few minutes. You do not have to stay on this
      screen.
    </Typography>
  </Box>
);

const CustomReportButton: React.FC<{
  projectId: string;
  fileReferenceId: string;
  statusForPrompts: StatusForPrompts;
}> = ({ projectId, fileReferenceId, statusForPrompts }) => {
  const { trigger, isMutating } = useTriggerOutput(fileReferenceId);

  const forSlug = (slug: PromptSlug) => () =>
    trigger({ projectId, slug, fileReferenceId });

  return (
    <Dropdown size="sm" color="primary">
      <MenuButton
        color="primary"
        size="sm"
        variant="solid"
        endDecorator={<ArrowDropDown />}
        loading={isMutating}
      >
        Additional Reports
      </MenuButton>
      <Menu size="sm" variant="soft">
        <MenuItem
          onClick={forSlug("kpi")}
          disabled={statusForPrompts.kpi !== "not_created"}
        >
          KPI Report
        </MenuItem>
        <MenuItem onClick={forSlug("business_model")}>Business Model</MenuItem>
        <MenuItem disabled onClick={forSlug("expense_drivers")}>
          Expense Drivers
        </MenuItem>
        <MenuItem disabled onClick={forSlug("ebitda_adjustments")}>
          EBITDA Adjustments
        </MenuItem>
      </Menu>
    </Dropdown>
  );
};
