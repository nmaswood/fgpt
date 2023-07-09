import "@fortune-sheet/react/dist/index.css";

import { assertNever, FileToRender } from "@fgpt/precedent-iso";
import { Workbook } from "@fortune-sheet/react";
import { LinearProgress } from "@mui/joy";
import React from "react";

import { useFetchSheets } from "../../hooks/use-fetch-sheets";

export const DisplayAsset: React.FC<{
  fileToRender: FileToRender.File;
}> = ({ fileToRender }) => {
  switch (fileToRender.type) {
    case "excel":
      return (
        <DisplayExcelFile
          id={fileToRender.id}
          signedUrl={fileToRender.signedUrl}
        />
      );
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

export const DisplayExcelFile: React.FC<{
  id: string;
  signedUrl: string;
}> = ({ id, signedUrl }) => {
  const value = useFetchSheets(id, signedUrl);
  if (!value || value.type === "loading") {
    return <LinearProgress />;
  }
  console.log(value.value);

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
