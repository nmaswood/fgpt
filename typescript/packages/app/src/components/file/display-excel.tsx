import NextLink from "next/link";
import { Box, Link, Typography, TextField } from "@mui/material";
import { read, utils } from "xlsx";
import React from "react";

export const DisplayExcel: React.FC<{ urls: string[] }> = ({ urls }) => {
  const [url] = urls;
  const [__html, setHtml] = React.useState("");

  const [sheetIndex, setSheetIndex] = React.useState(0);

  if (url === undefined) {
    throw new Error("illegal state");
  }

  const wb = useLoadWorkbook(url);

  React.useEffect(() => {
    (async () => {
      if (!wb) {
        return;
      }
      const sheetName = wb.SheetNames[sheetIndex];
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
        <Link key={url} component={NextLink} href={url}>
          <Typography>Tables</Typography>
        </Link>
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

const useLoadWorkbook = (url: string) => {
  const [wb, setWb] = React.useState<ReturnType<typeof read> | null>(null);

  React.useEffect(() => {
    (async () => {
      const f = await (await fetch(url)).arrayBuffer();
      const wb = read(f); // parse the array buffer
      setWb(wb);
    })();
  }, [url]);
  return wb;
};
