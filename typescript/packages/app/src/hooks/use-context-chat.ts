import { ChatContext } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchContext = (chatEntryId: string) => {
  const { data, isLoading, mutate } = useSWR<
    ChatContext[],
    ["api/proxy/v1/chat/context", string]
  >(["api/proxy/v1/chat/context", chatEntryId], fetcher);

  return { data: data ?? [], isLoading, mutate };
};

async function fetcher([url, chatEntryId]: [
  "api/proxy/v1/chat/context",
  string
]): Promise<ChatContext[]> {
  const response = await fetch(`${url}/${chatEntryId}`);
  const data = await response.json();

  return data.context;
}
