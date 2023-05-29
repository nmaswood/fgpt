import { ChatResponse } from "@fgpt/precedent-iso";
import React from "react";
import useSWRMutation from "swr/mutation";

interface Args {
  id: string;
  question: string;
  projectId: string;
}

export const useDebugChat = () => {
  const [responses, setResponses] = React.useState<
    Record<string, ChatResponse[]>
  >({});

  const { trigger } = useSWRMutation<
    ChatResponse,
    unknown,
    "/api/proxy/v1/chat/debug",
    Args
  >("/api/proxy/v1/chat/debug", async (url: string, args) => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args.arg),
    });
    const data = await res.json();

    setResponses((prev) => ({
      ...prev,
      [args.arg.id]: data,
    }));

    return data.project;
  });

  return {
    responses,
    trigger,
  };
};
