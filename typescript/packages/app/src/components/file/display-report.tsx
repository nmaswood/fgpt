import {
  AnalyzeResponseChunk,
  assertNever,
  FileStatus,
  FileToRender,
  isNotNull,
  Outputs,
  PROMPT_SLUGS,
  PromptSlug,
  SLUG_DISPLAY_NAME,
  StatusForPrompt,
  StatusForPrompts,
} from "@fgpt/precedent-iso";
import { Term } from "@fgpt/precedent-iso/src/models/llm-outputs";
import ArrowDropDown from "@mui/icons-material/ArrowDropDownOutlined";
import CheckIcon from "@mui/icons-material/CheckOutlined";
import CloseFullscreenOutlinedIcon from "@mui/icons-material/CloseFullscreenOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import HideSourceOutlinedIcon from "@mui/icons-material/HideSourceOutlined";
import OpenInFullOutlinedIcon from "@mui/icons-material/OpenInFullOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import {
  Box,
  CircularProgress,
  Divider,
  Dropdown,
  IconButton,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Option,
  Select,
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
  showAsset: boolean;
  toggleShowAsset: () => void;
}> = ({ file, showAsset, toggleShowAsset }) => {
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
          terms={file.report.terms}
          statusForPrompts={file.statusForPrompts}
          fileName={file.fileName}
          signedUrl={file.signedUrl}
          extractedTablesSignedUrl={
            file.type === "pdf" ? file.derivedSignedUrl : undefined
          }
          showAsset={showAsset}
          toggleShowAsset={toggleShowAsset}
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
    case "pdf": {
      const cim = file.report.cim;
      if (!cim) {
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
          <ClaudeReport longForm={cim} />
        </Box>
      );
    }
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
  fileName: string;
  signedUrl: string;
  extractedTablesSignedUrl: string | undefined;
  showAsset: boolean;
  toggleShowAsset: () => void;
}> = ({
  fileReferenceId,
  status,
  description,
  terms,
  projectId,
  statusForPrompts,
  fileName,
  signedUrl,
  extractedTablesSignedUrl,
  showAsset,
  toggleShowAsset,
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
      flexShrink={1.25}
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
        <Box display="flex" gap={1} alignItems="center">
          <CustomReportButton
            projectId={projectId}
            fileReferenceId={fileReferenceId}
            statusForPrompts={statusForPrompts}
          />

          <Box display="flex" gap={1} alignItems="center">
            <DownloadButton
              fileName={fileName}
              signedUrl={signedUrl}
              extractedTablesSignedUrl={extractedTablesSignedUrl}
            />
            <HidePDF showAsset={showAsset} toggleShowAsset={toggleShowAsset} />

            <CollapseButton
              toggle={() => setCollapsed((prev) => !prev)}
              collapsed={collapsed}
            />
          </Box>
        </Box>
      </Box>
      {!collapsed && (
        <>
          <Divider />
          {withDescription.length > 0 && (
            <Box
              display="flex"
              flexDirection="column"
              overflow="auto"
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

  const atleastOneLoading = (
    Object.values(file.statusForPrompts) as StatusForPrompt[]
  ).some((p) => p === "queued" || p === "in-progress");

  if (!atleastOneLoading && file.report.outputs.length === 0) {
    return null;
  }
  if (atleastOneLoading && file.report.outputs.length === 0) {
    return <LoadingHeader copy="Outputs" />;
  }

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
      overflow={collapsed ? undefined : "auto"}
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
        </Box>

        <CollapseButton
          toggle={() => setCollapsed((prev) => !prev)}
          collapsed={collapsed}
        />
      </Box>
      {!collapsed && file.report.outputs.length > 0 && (
        <>
          <Divider />
          <DisplayPrompts outputs={file.report.outputs} />
        </>
      )}
    </Box>
  );
};

const DisplayPrompts: React.FC<{
  outputs: Outputs.SlugWithOutput[];
}> = ({ outputs }) => {
  const [slug, setSlug] = React.useState<PromptSlug>(() => {
    const [output] = outputs;
    if (!output) {
      throw new Error("No outputs");
    }
    return output.slug;
  });

  const slugs = new Set(outputs.map((output) => output.slug));

  const output = outputs.find((output) => output.slug === slug);
  return (
    <Box
      display="flex"
      width="100%"
      maxHeight="100%"
      height="100%"
      padding={2}
      flexDirection="column"
      overflow="auto"
    >
      <Box display="flex" width="300px">
        {slugs.size > 1 && (
          <Select
            size="sm"
            value={slug}
            onChange={(_, value) => {
              if (!value) {
                return;
              }
              setSlug(value);
            }}
          >
            {PROMPT_SLUGS.filter((slug) => slugs.has(slug)).map((slug) => (
              <Option key={slug} value={slug}>
                {SLUG_DISPLAY_NAME[slug]}
              </Option>
            ))}
          </Select>
        )}
      </Box>

      {output && <DisplayPrompt output={output.output} />}
    </Box>
  );
};

const DisplayPrompt: React.FC<{
  output: Outputs.DisplayOutput;
}> = ({ output }) => {
  return (
    <Box
      display="flex"
      width="100%"
      maxHeight="100%"
      height="100%"
      flexDirection="column"
      overflow="auto"
    >
      <ClaudeReport longForm={output} />
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
  if (!extractedTablesSignedUrl) {
    return (
      <IconButton component="a" href={signedUrl} target="_blank" size="sm">
        <DownloadOutlinedIcon />
      </IconButton>
    );
  }

  return (
    <Dropdown>
      <MenuButton
        color="primary"
        size="sm"
        variant="solid"
        slots={{ root: IconButton }}
        slotProps={{
          root: { color: "neutral", size: "sm" },
        }}
      >
        <DownloadOutlinedIcon />
      </MenuButton>
      <Menu size="sm">
        <MenuItem component="a" href={signedUrl} target="_blank">
          Source Document
        </MenuItem>
        {extractedTablesSignedUrl && (
          <MenuItem
            component="a"
            href={extractedTablesSignedUrl}
            target="_blank"
          >
            Extracted Tables
          </MenuItem>
        )}
      </Menu>
    </Dropdown>
  );
};

const HidePDF: React.FC<{
  showAsset: boolean;
  toggleShowAsset: () => void;
}> = ({ showAsset, toggleShowAsset }) => (
  <IconButton size="sm" onClick={toggleShowAsset}>
    {showAsset ? (
      <HideSourceOutlinedIcon fontSize="small" />
    ) : (
      <PictureAsPdfOutlinedIcon fontSize="small" />
    )}
  </IconButton>
);

const CollapseButton: React.FC<{
  collapsed: boolean;
  toggle: () => void;
}> = ({ collapsed, toggle }) => (
  <IconButton size="sm" onClick={toggle}>
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

  return (
    <Dropdown>
      <MenuButton
        color="primary"
        size="sm"
        variant="solid"
        endDecorator={<ArrowDropDown />}
        loading={isMutating}
      >
        Generate Additional Reports
      </MenuButton>
      <Menu size="sm" variant="soft">
        {PROMPT_SLUGS.map((slug) => {
          const status = statusForPrompts[slug];
          return (
            <MenuItem
              key={slug}
              onClick={() => trigger({ projectId, slug, fileReferenceId })}
              disabled={status !== "not_created"}
            >
              <ListItemDecorator>
                {(status === "in-progress" || status === "queued") && (
                  <CircularProgress size="sm" />
                )}
                {status === "succeeded" && <CheckIcon color="success" />}
                {status === "failed" && <CloseOutlinedIcon color="error" />}
              </ListItemDecorator>
              {SLUG_DISPLAY_NAME[slug]}
            </MenuItem>
          );
        })}
      </Menu>
    </Dropdown>
  );
};
