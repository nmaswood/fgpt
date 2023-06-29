import { WorkSheet } from "xlsx";

import { ExcelTools } from "./excel-tools";

export type ISORowCol<V> = {
  r: number;
  c: number;
  v: V;
};

export type ISOSheet<V> = {
  name: string;
  celldata: ISORowCol<V>[];
};

export const processWorkBook = (
  sheets: Record<string, WorkSheet>
): ISOSheet<any>[] =>
  Object.entries(sheets).map(([name, sheet]) => {
    return {
      name,
      celldata: Object.entries(sheet)
        .filter(([key]) => !key.startsWith("!"))
        .map(([key, v]): ISORowCol<any> => {
          const { row: r, column: c } = ExcelTools.cellIdToPosition(key);
          return {
            r,
            c: c - 1,
            v,
          };
        }),
    };
  });
