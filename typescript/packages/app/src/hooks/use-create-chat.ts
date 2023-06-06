import type { Chat } from "@fgpt/precedent-iso";
import useSWRMutation from "swr/mutation";

import { useFetchChats } from "./use-list-chats";

export const useCreateChat = (projectId: string) => {
  const { mutate } = useFetchChats(projectId);

  const res = useSWRMutation<
    Chat,
    { name: string },
    "/api/proxy/v1/chat/create-chat",
    { name: string }
  >("/api/proxy/v1/chat/create-chat", async (url: string, args) => {
    const body = {
      projectId,
      ...args.arg,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    mutate();
    return data.chat;
  });

  return res;
};
