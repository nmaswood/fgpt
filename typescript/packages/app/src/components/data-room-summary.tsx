import { assertNever, RenderShowCaseFile } from "@fgpt/precedent-iso";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/joy";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { BLUR_DATA_URL } from "./make-blur-data-url";
import { DataGridTermsTable } from "./terms-table";

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
          <Box>
            <Button
              component={Link}
              href={`/files/${showCaseFile.fileReferenceId}`}
              sx={{
                textWrap: "nowrap",
              }}
            >
              View Summary
            </Button>
          </Box>
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
          <Alert size="lg" variant={"outlined"} color="primary">
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
          <Link href={`/files/${showCaseFile.fileReferenceId}`}>
            {!showCaseFile.url && (
              <Box
                width="320px"
                height="100%"
                display="flex"
                borderRadius={8}
                border="1px solid #E5E5E5"
                boxShadow="rgba(0, 0, 0, 0.06) 0px 2px 4px"
                justifyContent="center"
                alignItems="center"
                sx={{
                  transition: "all .1s ease-in-out",
                  "&:hover": {
                    border: "1.5px solid lightgray",
                    boxShadow: "rgba(0, 0, 0, 0.06) 0px 9px 9px",
                  },
                }}
              >
                <PictureAsPdfOutlinedIcon
                  color="error"
                  sx={{
                    fontSize: 36,
                    color: "danger.solidColor",
                  }}
                />
              </Box>
            )}
            {showCaseFile.url && (
              <Box
                display="flex"
                borderRadius={8}
                width="320px"
                border="1px solid #E5E5E5"
                boxShadow="rgba(0, 0, 0, 0.06) 0px 2px 4px"
                position="relative"
                height="100%"
                minHeight="200px"
                sx={{
                  transition: "all .1s ease-in-out",
                  "&:hover": {
                    border: "1.5px solid lightgray",
                    boxShadow: "rgba(0, 0, 0, 0.06) 0px 9px 9px",
                  },
                }}
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
          </Link>
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
                color="primary"
                sx={{
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                No terms have been extracted from the document
              </Alert>
            )}
            {showCaseFile.terms.length > 0 && (
              <DataGridTermsTable terms={showCaseFile.terms} />
            )}
          </Box>
        </Box>
      );
    default:
      assertNever(showCaseFile);
  }
};
