import { FileToRender } from "@fgpt/precedent-iso";
import { Workbook } from "@fortune-sheet/react";
import { Box, CircularProgress } from "@mui/joy";
import React from "react";

import { useFetchSheets } from "../../hooks/use-fetch-sheets";
import { ForExcelOutput } from "./report";

export const DisplayDerived: React.FC<{
  derived: FileToRender.DerivedTable;
}> = ({ derived: { output, id, signedUrl } }) => {
  const data = useFetchSheets(id, signedUrl);

  return (
    <Box
      display="flex"
      width="100%"
      height="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      padding={2}
      flexDirection="column"
    >
      {!data || data.type == "loading" ? (
        <CircularProgress />
      ) : (
        <Workbook
          showToolbar={false}
          sheetTabContextMenu={[]}
          showFormulaBar={false}
          allowEdit={false}
          data={data.value}
        />
      )}
      <ForExcelOutput output={output} />
    </Box>
  );
};
