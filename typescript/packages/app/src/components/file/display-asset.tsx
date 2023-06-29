import "@fortune-sheet/react/dist/index.css";

import { assertNever, FileToRender } from "@fgpt/precedent-iso";
import { Sheet } from "@fortune-sheet/core";
import { Workbook } from "@fortune-sheet/react";
import React from "react";

export const DisplayAsset: React.FC<{
  fileToRender: FileToRender.File;
}> = ({ fileToRender }) => {
  switch (fileToRender.type) {
    case "excel":
      return <DisplayExcelFile sheets={fileToRender.sheets} />;
    case "pdf":
      return (
        <object
          data={fileToRender.signedUrl}
          type="application/pdf"
          style={{ width: "100%", height: "100%", minWidth: "50%" }}
        />
      );
    case undefined:
      throw new Error("illegal state");
    default:
      assertNever(fileToRender);
  }
};

const DisplayExcelFile: React.FC<{
  sheets: Sheet[];
}> = ({ sheets }) => {
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
