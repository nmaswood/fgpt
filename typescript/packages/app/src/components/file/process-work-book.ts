import { ExcelTools } from "@fgpt/precedent-iso";
import { CellWithRowAndCol, Sheet } from "@fortune-sheet/core";
import { WorkSheet } from "xlsx";

export const processWorkBook = (sheets: Record<string, WorkSheet>): Sheet[] =>
  Object.entries(sheets).map(([name, sheet]) => {
    return {
      name,
      config: {
        merge: {},
        borderInfo: [],
        rowlen: {},
        columnlen: {},
        rowhidden: {},
        customHeight: {},
        customWidth: {},
      },
      luckysheet_select_save: [],
      calcChain: [],

      celldata: Object.entries(sheet)
        .filter(([key]) => !key.startsWith("!"))
        .map(([key, v]): CellWithRowAndCol => {
          const { row: r, column: c } = ExcelTools.cellIdToPosition(key);
          return {
            r,
            c: c - 1,
            v,
          };
        }),
    };
  });
