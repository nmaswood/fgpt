import { FileToRender } from "@fgpt/precedent-iso";
import { Box } from "@mui/joy";
import React from "react";

import { ForExcel } from "./report";

export const DisplayDerived: React.FC<{
  derived: FileToRender.DerivedTable;
}> = ({ derived: { output } }) => {
  return (
    <Box
      display="flex"
      width="100%"
      height="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      padding={2}
    >
      {output && (
        <Box
          display="flex"
          height="100"
          width="100%"
          maxHeight="100%"
          maxWidth="100%"
          overflow="auto"
        >
          <ForExcel output={output} />
        </Box>
      )}
    </Box>
  );
};
