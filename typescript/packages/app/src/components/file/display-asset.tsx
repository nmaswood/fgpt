import { assertNever, FileType } from "@fgpt/precedent-iso";
import { Sheet } from "@fortune-sheet/core";
import { Workbook } from "@fortune-sheet/react";
import React from "react";

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

const DisplayExcelFile: React.FC<{ signedUrl: string }> = ({}) => {
  const sheets: Sheet[] = [];
  if (sheets.length === 0) {
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
