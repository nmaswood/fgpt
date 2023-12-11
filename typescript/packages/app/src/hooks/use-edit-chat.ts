import useSWRMutation from "swr/mutation";

import { ChatLocation,useFetchChats } from "./use-list-chats";

export const useEditChat = (location: ChatLocation, projectId: string) => {
  const { mutate } = useFetchChats(location, projectId);

  const res = useSWRMutation<
    undefined,
    unknown,
    "/api/proxy/v1/chat/chat",
    { id: string; name: string }
  >("/api/proxy/v1/chat/chat", async (url: string, args) => {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },

      body: JSON.stringify(args.arg),
    });
    const data = await res.json();
    mutate();
    return data.chat;
  });

  return res;
};
