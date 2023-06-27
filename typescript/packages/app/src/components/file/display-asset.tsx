import { assertNever, FileType } from "@fgpt/precedent-iso";
import { Sheet } from "@fortune-sheet/core";
import { Workbook } from "@fortune-sheet/react";
import React from "react";

import { useFetchWorkbook } from "../../hooks/use-load-workbook";
import { processWorkBook } from "./process-work-book";

export const DisplayAsset: React.FC<{
  signedUrl: string;
  assetType: FileType;
}> = ({ signedUrl, assetType }) => {
  switch (assetType) {
    case "excel":
      return <DisplayExcelFile signedUrl={signedUrl} />;
    case "pdf":
      return (
        <object
          data={signedUrl}
          type="application/pdf"
          style={{ width: "100%", height: "100%", minWidth: "50%" }}
        />
      );
    default:
      assertNever(assetType);
  }
};

const DisplayExcelFile: React.FC<{ signedUrl: string }> = ({ signedUrl }) => {
  const { data: wb, isLoading } = useFetchWorkbook(signedUrl);
  const sheets = React.useMemo<Sheet[]>(
    () => processWorkBook(wb?.Sheets ?? {}),
    [wb]
  );
  if (sheets.length === 0 || isLoading) {
    return null;
  }

  return (
    <Workbook
      showToolbar={false}
      sheetTabContextMenu={[]}
      showFormulaBar={false}
      allowEdit={false}
      data={sheets}
    />
  );
};
