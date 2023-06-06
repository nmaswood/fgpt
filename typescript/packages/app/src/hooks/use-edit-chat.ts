import useSWRMutation from "swr/mutation";

import { useFetchChats } from "./use-list-chats";

export const useEditChat = (projectId: string) => {
  const { mutate } = useFetchChats(projectId);

  const res = useSWRMutation<
    string,
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
    return data.project;
  });

  return res;
};
