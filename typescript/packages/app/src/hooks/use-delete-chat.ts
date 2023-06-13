import useSWRMutation from "swr/mutation";

import { ChatLocation, useFetchChats } from "./use-list-chats";

export const useDeleteChat = (location: ChatLocation, projectId: string) => {
  const { mutate } = useFetchChats(location, projectId);

  const res = useSWRMutation<
    string,
    unknown,
    "/api/proxy/v1/chat/delete-chat",
    { id: string }
  >("/api/proxy/v1/chat/delete-chat", async (url: string, args) => {
    const res = await fetch(`${url}/${args.arg.id}`, {
      method: "DELETE",
    });
    await res.json();
    mutate();
    return "ok";
  });

  return res;
};
