import { assertNever, RenderShowCaseFile } from "@fgpt/precedent-iso";
import { Term } from "@fgpt/precedent-iso/src/models/llm-outputs";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Table,
  Typography,
} from "@mui/joy";
import Image from "next/image";
import React from "react";

import { BLUR_DATA_URL } from "./make-blur-data-url";

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
      gap={3}
      bgcolor="neutral.0"
      borderRadius={8}
    >
      <Box display="flex" width="100%" justifyContent="space-between">
        <Typography level="h4">Data room summary</Typography>
        {showCaseFile && showCaseFile.type == "set" && (
          <Button disabled={true}>View full report</Button>
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
        >
          {!showCaseFile.url && (
            <Box
              display="flex"
              overflow="auto"
              gap={3}
              width="320px"
              height="100%"
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
              border="1px solid #E5E5E5"
              boxShadow="rgba(0, 0, 0, 0.06) 0px 2px 4px"
            >
              <Image
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                src={showCaseFile.url}
                width={320}
                height={407}
                alt="thumbnail of CIM"
              />
            </Box>
          )}
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

const TermsTable: React.FC<{
  terms: Term[];
}> = ({ terms }) => {
  return (
    <Table
      variant="outlined"
      sx={{
        display: "inline-block",
        borderRadius: 8,
        border: "1px solid #E5E5E5",
        background: "#FFF",
      }}
    >
      <colgroup>
        <col
          style={{
            width: "35%",
          }}
        />
        <col
          style={{
            width: "65%",
          }}
        />
      </colgroup>

      <tbody>
        {terms.map((term, index) => (
          <tr
            key={index}
            style={{
              padding: "8px",
              height: "40px",
            }}
          >
            <td
              scope="row"
              style={{
                padding: "8px",
              }}
            >
              <Typography
                fontWeight={700}
                sx={{
                  padding: 1,
                  color: "#666",
                }}
              >
                {term.termName}
              </Typography>
            </td>
            <td
              style={{
                padding: "8px",
              }}
            >
              <Typography fontWeight={400}>{term.termValue}</Typography>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
