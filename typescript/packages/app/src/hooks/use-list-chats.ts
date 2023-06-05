import { Chat } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchChats = (projectId: string) => {
  const { data, isLoading, mutate } = useSWR<
    Chat[],
    ["api/proxy/v1/chat/list-chats", string]
  >(["api/proxy/v1/chat/list-chats", projectId], fetcher);

  return { data: data ?? [], isLoading, mutate };
};

async function fetcher([url, projectId]: [
  "api/proxy/v1/chat/list-chats",
  string
]): Promise<Chat[]> {
  const response = await fetch(`${url}/${projectId}`);
  const data = await response.json();
  return data.chats;
}
