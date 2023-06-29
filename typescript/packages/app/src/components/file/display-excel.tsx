import "@fortune-sheet/react/dist/index.css";

import { Sheet } from "@fortune-sheet/core";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { Box, Link, Typography } from "@mui/material";
import NextLink from "next/link";
import React from "react";

export const DisplayExcel: React.FC<{
  signedUrl: string;
  isLoading: boolean;
}> = ({ signedUrl }) => {
  const ref = React.useRef<WorkbookInstance>(null);

  const sheets: Sheet[] = [];

  return (
    <Box
      display="flex"
      width="100%"
      maxWidth={"100%"}
      height="100%"
      maxHeight="100%"
      overflow="auto"
      padding={2}
      gap={2}
      flexDirection="column"
    >
      <Box display="flex">
        {signedUrl && (
          <Link component={NextLink} href={signedUrl}>
            <Typography>Download XLSX</Typography>
          </Link>
        )}
      </Box>

      <Box
        display="flex"
        width="100%"
        height="500px"
        maxHeight="500px"
        overflow="auto"
      >
        {sheets.length > 0 && (
          <Workbook
            ref={ref as any}
            showToolbar={false}
            sheetTabContextMenu={[]}
            showFormulaBar={false}
            allowEdit={false}
            data={sheets}
          />
        )}
      </Box>
    </Box>
  );
};
