import React from "react";

import { CLIENT_SETTINGS } from "../client-settings";

interface Arguments {
  projectId: string;
  question: string;
  chatId: string;
}

const decoder = new TextDecoder();

export const useAskQuestion = (
  token: string,
  onDone: (value: {
    answer: string;
    shouldRefresh: boolean;
    chatId: string;
  }) => void,
) => {
  const [answerBuffer, setAnswerBuffer] = React.useState<string[]>([]);
  const answerRefBuffer = React.useRef<string[]>([]);

  const [loading, setLoading] = React.useState(false);

  const text = React.useMemo(() => answerBuffer.join(""), [answerBuffer]);
  const trigger = React.useRef<(args: Arguments) => Promise<void>>(
    async function fetchData({ projectId, question, chatId }) {
      let shouldRefresh = false;
      try {
        setLoading(true);
        const res = await fetch(
          `${CLIENT_SETTINGS.publicApiEndpoint}/api/v1/chat/chat`,
          {
            method: "POST",
            body: JSON.stringify({
              projectId,
              question,
              chatId,
            }),
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
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
          let s = decoder.decode(value);
          if (s.includes("__REFRESH__")) {
            s = s.replace("__REFRESH__", "");
            shouldRefresh = true;
          }
          answerRefBuffer.current.push(s);
          setAnswerBuffer((prev) => [...prev, s]);
        }
      } finally {
        onDone({
          answer: answerRefBuffer.current.join(""),
          shouldRefresh,
          chatId,
        });
        setLoading(false);
        setAnswerBuffer([]);
        answerRefBuffer.current = [];
      }
    },
  );
  return {
    trigger: trigger.current,
    text,
    loading,
  };
};
