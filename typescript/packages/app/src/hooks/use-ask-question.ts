import React from "react";

import { CLIENT_SETTINGS } from "../client-settings";

interface Arguments {
  projectId: string;
  question: string;
}

const decoder = new TextDecoder();

export const useAskQuestion = (
  token: string,
  onDone: (value: string) => void
) => {
  const [buffer, setBuffer] = React.useState<string[]>([]);
  const refBuffer = React.useRef<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const text = React.useMemo(() => buffer.join(""), [buffer]);
  const trigger = React.useRef<(args: Arguments) => Promise<void>>(
    async function fetchData({ projectId, question }) {
      try {
        setLoading(true);
        const res = await fetch(
          `${CLIENT_SETTINGS.publicApiEndpoint}/api/v1/chat/chat`,
          {
            method: "POST",
            body: JSON.stringify({
              projectId,
              question,
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
          refBuffer.current.push(s);
          setBuffer((prev) => [...prev, s]);
        }
      } finally {
        onDone(refBuffer.current.join(""));
        setLoading(false);
        setBuffer([]);
        refBuffer.current = [];
      }
    }
  );
  return {
    trigger: trigger.current,
    text,
    loading,
  };
};
