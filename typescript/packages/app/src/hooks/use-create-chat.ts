import type { Project } from "@fgpt/precedent-iso";
import useSWRMutation from "swr/mutation";

import { useFetchChats } from "./use-list-chats";

export const useCreateChat = (projectId: string) => {
  const { mutate } = useFetchChats(projectId);

  const res = useSWRMutation<
    Project,
    unknown,
    "/api/proxy/v1/chat/create-chat",
    unknown
  >("/api/proxy/v1/chat/create-chat", async (url: string, args) => {
    console.log(args);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      //body: JSON.stringify(args.arg),
    });
    const data = await res.json();
    mutate();
    return data.chat;
  });

  return res;
};
