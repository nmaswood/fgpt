// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ExcelTools {
  export type CellPosition = {
    row: number;
    column: number;
  };

  export function cellIdToPosition(cellId: string): CellPosition {
    let column = 0;
    let i = 0;

    // While we encounter characters (for the column)
    while (i < cellId.length && isNaN(Number(cellId[i]))) {
      column = column * 26 + (cellId.charCodeAt(i) - "A".charCodeAt(0)) + 1;
      i++;
    }

    // Now, column is 1-indexed. Make it 0-indexed.
    column--;

    // After the column letters, what remains should be the row (also 1-indexed).
    const row = parseInt(cellId.slice(i), 10);

    // Convert to 0-indexing
    return {
      row: row - 1,
      column: column,
    };
  }
}
