import { ChatEntry } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchChatEntries = (chatId: string | undefined) => {
  const { data, isLoading, mutate } = useSWR<
    ChatEntry[],
    ["/api/proxy/v1/chat/chat-entry", string]
  >(["/api/proxy/v1/chat/chat-entry", chatId], fetcher);

  return { data: data ?? [], isLoading, mutate };
};

async function fetcher([url, chatId]: [
  "/api/proxy/v1/chat/chat-entry",
  string | undefined
]): Promise<ChatEntry[]> {
  if (!chatId) {
    return [];
  }
  const response = await fetch(`${url}/${chatId}`);
  const data = await response.json();

  return data.chatEntries;
}
