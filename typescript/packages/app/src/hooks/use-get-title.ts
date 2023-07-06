import React from "react";

import { CLIENT_SETTINGS } from "../client-settings";

interface Arguments {
  projectId: string;
  chatId: string;
}

const decoder = new TextDecoder();

export const useGetTitle = (token: string) => {
  const [buffer, setBuffer] = React.useState<Record<string, string[]>>({});
  const [loading, setLoading] = React.useState(false);

  const trigger = React.useRef<(args: Arguments) => Promise<void>>(
    async function fetchData({ projectId, chatId }) {
      try {
        setLoading(true);
        const res = await fetch(
          `${CLIENT_SETTINGS.publicApiEndpoint}/api/v1/chat/get-title`,
          {
            method: "POST",
            body: JSON.stringify({
              projectId,
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

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            return;
          }
          const s = decoder.decode(value);
          console.log({ s });
          setBuffer((prev) => {
            const copy = { ...copy };
            if (copy[chatId] === undefined) {
              copy[chatId] = [];
            }
            copy[chatId]!.push(s);

            console.log(copy[chatId].join(""));

            return copy;
          });
        }
      } finally {
        setLoading(false);
      }
    }
  );
  return {
    trigger: trigger.current,
    loading,
    buffer,
  };
};
