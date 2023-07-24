import "@fortune-sheet/react/dist/index.css";

import { assertNever, FileType, SizeBallpark } from "@fgpt/precedent-iso";
import { Workbook } from "@fortune-sheet/react";
import { Alert,Box, LinearProgress } from "@mui/joy";
import React from "react";

import { useFetchSheets } from "../../hooks/use-fetch-sheets";

export const DisplayAsset: React.FC<{
  fileType: FileType;
  signedUrl: string;
  fileId: string;
  ballpark: SizeBallpark;
}> = ({ signedUrl, fileId, fileType, ballpark }) => {
  switch (fileType) {
    case "excel":
      if (ballpark === "over_ten") {
        return (
          <Box
            display="flex"
            height="100%"
            width="100%"
            justifyContent="center"
            alignItems="center"
          >
            <Alert>File is too large to render. Please download to view</Alert>
          </Box>
        );
      }
      return <DisplayExcelFile id={fileId} signedUrl={signedUrl} />;
    case "pdf":
      return (
        <object
          data={`${signedUrl}#toolbar=0&view=FitH&zoom=page-width`}
          type="application/pdf"
          style={{ width: "100%", height: "100%" }}
        />
      );
    default:
      assertNever(fileType);
  }
};

const DisplayExcelFile: React.FC<{
  id: string;
  signedUrl: string;
}> = ({ id, signedUrl }) => {
  const value = useFetchSheets(id, signedUrl);
  if (!value || value.type === "loading") {
    return <LinearProgress />;
  }

  return (
    <Workbook
      showToolbar={false}
      sheetTabContextMenu={[]}
      showFormulaBar={false}
      allowEdit={false}
      data={value.value}
    />
  );
};
