export type Cursor<T extends string | number> =
  | {
      type: "first";
    }
  | {
      type: "after";
      cursor: T;
    };
