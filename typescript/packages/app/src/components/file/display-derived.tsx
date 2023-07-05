import { ChunkStrategy } from "@fgpt/precedent-iso";
import { FileToRender } from "@fgpt/precedent-iso";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, Button, ButtonGroup, Option, Select, Typography } from "@mui/joy";
import { TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import React from "react";

import { useFetchPlayground } from "../../hooks/use-fetch-playground";
import { useFetchTextChunk } from "../../hooks/use-fetch-text-chunk";
import { useFetchTextChunkGroup } from "../../hooks/use-fetch-text-chunk-group";
import { useGenerateOutput } from "../../hooks/use-gen-output";
import { BASIC_SCHEMA } from "./default-prompt";
import { DisplayExcelFile } from "./display-asset";
import { ForExcel } from "./report";

export const DisplayDerived: React.FC<{
  derived: FileToRender.DerivedTable;
}> = ({ derived: { sheets, output } }) => {
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
      <DisplayExcelFile sheets={sheets} />
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
