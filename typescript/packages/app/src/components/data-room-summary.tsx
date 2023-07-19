import { assertNever, RenderShowCaseFile } from "@fgpt/precedent-iso";
import { Term } from "@fgpt/precedent-iso/src/models/llm-outputs";
import { Box, Button, CircularProgress, Table,Typography } from "@mui/joy";
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
        <Button disabled={true}>View full report</Button>
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
      return null;
    case "set":
      if (!showCaseFile.url) {
        return null;
      }
      return (
        <Box
          display="flex"
          width="100%"
          height="100%"
          maxHeight="100%"
          maxWidth="100%"
          overflow="auto"
        >
          <Image
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            src={showCaseFile.url}
            width={500}
            height={500}
            alt="thumbnail of CIM"
          />
          <Box display="flex" width="100%" height="100%">
            <TermsTable terms={showCaseFile.terms} />
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
        borderRadius: 8,
        border: "1px solid #E5E5E5",
        background: "#FFF",
      }}
    >
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
  );
};
