import { ISOSheet } from "@fgpt/precedent-iso";
import React, { useEffect, useRef } from "react";

type Resp<T> = { type: "data"; value: T } | { type: "loading" };

export const useFetchSheets = (id: string, signedUrl: string) => {
  const workerRef = useRef<Worker>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type T = Record<string, Resp<ISOSheet<any>[]>>;
  const [record, setRecord] = React.useState<T>({});

  useEffect(() => {
    if (!signedUrl || record[id]) {
      return;
    }

    setRecord((prev) => {
      return {
        ...prev,
        [id]: {
          type: "loading",
        },
      };
    });

    workerRef.current = new Worker(new URL("../../worker.ts", import.meta.url));
    workerRef.current.onerror = console.error;
    workerRef.current.onmessage = (
      event: MessageEvent<ISOSheet<unknown>[]>,
    ) => {
      setRecord((prev) => {
        return {
          ...prev,
          [id]: {
            type: "data",
            value: event.data,
          },
        };
      });
    };
    workerRef.current?.postMessage(signedUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, signedUrl]);
  return record[id];
};
