import NextLink from "next/link";
import {
  Box,
  Link,
  Typography,
  TextField,
  LinearProgress,
} from "@mui/material";
import { read, utils } from "xlsx";
import React from "react";
import { useFetchWorkbook } from "../../hooks/use-load-workbook";

export const DisplayExcel: React.FC<{
  url: string | undefined;
  isLoading: boolean;
}> = ({ url }) => {
  const [__html, setHtml] = React.useState("");

  const [sheetIndex, setSheetIndex] = React.useState(1);

  const { data: wb, isLoading } = useFetchWorkbook(url);

  React.useEffect(() => {
    (async () => {
      if (!wb) {
        return;
      }
      const sheetName = wb.SheetNames[sheetIndex - 1];
      if (!sheetName) {
        return;
      }
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        return;
      }

      setHtml(utils.sheet_to_html(ws));
    })();
  }, [wb, sheetIndex]);

  return (
    <Box
      width="100%"
      height="100%"
      maxHeight="100%"
      overflow="auto"
      padding={2}
      gap={2}
    >
      <Box display="flex" marginY={3}>
        {url && (
          <Link key={url} component={NextLink} href={url}>
            <Typography>Download XLSX</Typography>
          </Link>
        )}
      </Box>

      <TextField
        type="number"
        value={sheetIndex}
        onChange={(event) => {
          const newValue = event.target.value;
          const parsed = parseInt(newValue);
          if (newValue === "" || (parsed >= 0 && parsed <= 100)) {
            setSheetIndex(parsed);
          }
        }}
        variant="outlined"
        label="Sheet index"
        sx={{
          width: "100px",
        }}
        InputProps={{ inputProps: { min: 0, max: 20 } }}
      />
      {isLoading && <LinearProgress />}
      <Box
        display="flex"
        width="100%"
        maxWidth="100%"
        height="100%"
        maxHeight="100%"
        overflow="auto"
        dangerouslySetInnerHTML={{ __html }}
        marginTop={1}
      />
    </Box>
  );
};
