import { ISOSheet } from "@fgpt/precedent-iso";
import React, { useEffect, useRef } from "react";

type Resp<T> = { type: "data"; value: T } | { type: "loading" };

export const useFetchSheets = (id: string, signedUrl: string) => {
  const workerRef = useRef<Worker>();
  const [record, setRecord] = React.useState<
    Record<string, Resp<ISOSheet<any>[]>>
  >({});

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
    workerRef.current.onmessage = (event: MessageEvent<ISOSheet<any>[]>) => {
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
  }, [id, signedUrl]);
  return record[id];
};
