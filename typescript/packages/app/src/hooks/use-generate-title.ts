import React from "react";

import { CLIENT_SETTINGS } from "../client-settings";

interface Arguments {
  chatId: string;
  chatEntryId: string;
}

const decoder = new TextDecoder();

export const useGenerateTitle = (token: string) => {
  const [loading, setLoading] = React.useState(false);

  const refBuffer = React.useRef<Record<string, string[]>>({});
  const [acc, setAcc] = React.useState<Record<string, string[]>>({});

  const trigger = React.useRef<(args: Arguments) => Promise<void>>(
    async function fetchData({ chatId, chatEntryId }) {
      try {
        setLoading(true);
        const res = await fetch(
          `${CLIENT_SETTINGS.publicApiEndpoint}/api/v1/chat/generate-title`,
          {
            method: "POST",
            body: JSON.stringify({
              chatEntryId,
              chatId,
            }),
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const body = res.body;
        if (!body) {
          throw new Error("no body");
        }
        const reader = body.getReader();

        refBuffer.current[chatEntryId] = [];

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            return;
          }
          const s = decoder.decode(value);
          refBuffer.current[chatEntryId]!.push(s);
          setAcc((prev) => {
            prev[chatEntryId] = prev[chatEntryId] ?? [];
            prev[chatEntryId]!.push(s);
            return prev;
          });
        }
      } finally {
        //onDone(refBuffer.current.join(""));
        setLoading(false);
      }
    }
  );
  return {
    trigger: trigger.current,
    loading,
    titles: acc,
  };
};
