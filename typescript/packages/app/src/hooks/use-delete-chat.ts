import useSWRMutation from "swr/mutation";

import { useFetchChats } from "./use-list-chats";

export const useDeleteChat = (projectId: string) => {
  const { mutate } = useFetchChats(projectId);

  const res = useSWRMutation<
    string,
    unknown,
    "/api/proxy/v1/projects/delete",
    { id: string }
  >("/api/proxy/v1/projects/delete", async (url: string, args) => {
    const res = await fetch(`${url}/${args.arg.id}`, {
      method: "DELETE",
    });
    await res.json();
    mutate();
    return "ok";
  });

  return res;
};
