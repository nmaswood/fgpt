import type { Chat } from "@fgpt/precedent-iso";
import useSWRMutation from "swr/mutation";

import { ChatLocation, useFetchChats } from "./use-list-chats";

export const useCreateChat = (location: ChatLocation, id: string) => {
  const { mutate } = useFetchChats(location, id);

  const res = useSWRMutation<
    Chat,
    { name: string },
    "/api/proxy/v1/chat/create-chat",
    { name: string }
  >("/api/proxy/v1/chat/create-chat", async (url: string, args) => {
    const body = {
      id,
      location,
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
