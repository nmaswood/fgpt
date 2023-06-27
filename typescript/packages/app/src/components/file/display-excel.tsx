import "@fortune-sheet/react/dist/index.css";

import { Sheet } from "@fortune-sheet/core";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import {
  Box,
  LinearProgress,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import React from "react";

import { ExcelInfo } from "../../hooks/use-fetch-excel";
import { useFetchWorkbook } from "../../hooks/use-load-workbook";
import { processWorkBook } from "./process-work-book";

export const DisplayExcel: React.FC<{
  excelInfo: ExcelInfo | undefined;
  isLoading: boolean;
}> = ({ excelInfo }) => {
  const [sheetIndex, setSheetIndex] = React.useState(1);

  const signedUrl = excelInfo?.excel?.signedUrl;
  const numSheets = excelInfo?.excel?.numSheets;

  const { data: wb, isLoading } = useFetchWorkbook(signedUrl);

  const ref = React.useRef<WorkbookInstance>(null);

  const sheets = React.useMemo<Sheet[]>(
    () => processWorkBook(wb?.Sheets ?? {}),
    [wb]
  );

  const forSheet = excelInfo?.forSheets[sheetIndex - 1] ?? {};

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
      <Box display="flex" width="100%">
        <TextField
          type="number"
          value={sheetIndex}
          onChange={(event) => {
            const newValue = event.target.value;
            const parsed = parseInt(newValue);
            if (newValue === "" || (parsed >= 0 && parsed <= 100)) {
              setSheetIndex(parsed);
              if (ref.current) {
                ref.current.activateSheet({ index: parsed - 1 });
              }
            }
          }}
          disabled={!excelInfo}
          variant="outlined"
          label="Sheet index"
          sx={{
            width: "100px",
          }}
          InputProps={{ inputProps: { min: 1, max: numSheets ?? 1 } }}
        />
      </Box>
      {isLoading && <LinearProgress />}
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
      {forSheet && (
        <Box
          display="flex"
          gap={2}
          height="400px"
          width="100%"
          maxWidth={"100%"}
          maxHeight="100%"
          overflow="auto"
        >
          <pre
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(forSheet, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
};
