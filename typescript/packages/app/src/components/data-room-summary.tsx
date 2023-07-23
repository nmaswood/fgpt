import { assertNever, RenderShowCaseFile } from "@fgpt/precedent-iso";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import {
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/joy";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { BLUR_DATA_URL } from "./make-blur-data-url";
import { TermsTable } from "./terms-table";
import { useHover } from "./use-hover";

export const DataRoomSummary: React.FC<{
  loading: boolean;
  showCaseFile: RenderShowCaseFile.File | undefined;
}> = ({ loading, showCaseFile }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      width="100%"
      padding={2}
      paddingBottom={4}
      maxHeight="100%"
      overflow="auto"
      bgcolor="neutral.0"
      borderRadius={8}
    >
      <Box display="flex" width="100%" justifyContent="space-between">
        <Typography
          level="h4"
          sx={{
            fontWeight: 700,
          }}
        >
          Data Room Summary
        </Typography>
        {showCaseFile && showCaseFile.type == "set" && (
          <Button
            component={Link}
            href={`/files/${showCaseFile.fileReferenceId}`}
          >
            View summary
          </Button>
        )}
      </Box>

      {loading && (
        <Box
          display="flex"
          width="100%"
          height="100%"
          alignItems="center"
          justifyContent="center"
        >
          <CircularProgress />
        </Box>
      )}
      {showCaseFile && (
        <Box
          display="flex"
          width="100%"
          height="100%"
          maxHeight="100%"
          maxWidth="100%"
          overflow="auto"
        >
          <Dispatch showCaseFile={showCaseFile} />
        </Box>
      )}
    </Box>
  );
};

const Dispatch: React.FC<{ showCaseFile: RenderShowCaseFile.File }> = ({
  showCaseFile,
}) => {
  const [ref, hovering] = useHover();
  switch (showCaseFile.type) {
    case "not_set":
      return (
        <Box
          display="flex"
          width="100%"
          height="100%"
          alignItems="center"
          justifyContent="center"
        >
          <Alert size="lg" variant={"outlined"} color="info">
            A CIM is currently not selected for this project.{" "}
          </Alert>
        </Box>
      );
    case "set":
      return (
        <Box
          display="flex"
          width="100%"
          height="100%"
          maxHeight="100%"
          maxWidth="100%"
          overflow="auto"
          gap={3}
          paddingTop={2}
        >
          <Badge
            ref={ref as any} // eslint-disable-line @typescript-eslint/no-explicit-any
            invisible={!hovering}
            component={Link}
            badgeContent={<OpenInNewOutlinedIcon />}
            href={`/files/${showCaseFile.fileReferenceId}`}
          >
            {!showCaseFile.url && (
              <Box
                display="flex"
                overflow="auto"
                gap={3}
                width="320px"
                height="100%"
                component={Box}
              >
                <Box
                  width="100%"
                  height="100%"
                  display="flex"
                  borderRadius={8}
                  border="1px solid #E5E5E5"
                  boxShadow="rgba(0, 0, 0, 0.06) 0px 2px 4px"
                  justifyContent="center"
                  alignItems="center"
                >
                  <PictureAsPdfOutlinedIcon
                    color="error"
                    sx={{
                      fontSize: 36,
                      color: "danger.solidColor",
                    }}
                  />
                </Box>
              </Box>
            )}
            {showCaseFile.url && (
              <Box
                display="flex"
                borderRadius={8}
                width="345px"
                border="1px solid #E5E5E5"
                boxShadow="rgba(0, 0, 0, 0.06) 0px 2px 4px"
                position="relative"
                minHeight="200px"
              >
                <Image
                  placeholder="blur"
                  fill
                  blurDataURL={BLUR_DATA_URL}
                  src={showCaseFile.url}
                  alt="thumbnail of CIM"
                  sizes="100vw"
                  style={{
                    borderRadius: "8px",
                  }}
                />
              </Box>
            )}
          </Badge>
          <Box
            display="flex"
            width="100%"
            height="100%"
            maxHeight="100%"
            maxWidth="100%"
            overflow="auto"
          >
            {showCaseFile.terms.length === 0 && (
              <Alert
                size="lg"
                variant={"outlined"}
                color="info"
                sx={{
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                No terms have been extracted from the document
              </Alert>
            )}
            {showCaseFile.terms.length > 0 && (
              <TermsTable terms={showCaseFile.terms} />
            )}
          </Box>
        </Box>
      );
    default:
      assertNever(showCaseFile);
  }
};
