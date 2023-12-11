import useSWR from "swr";

export const useFetchChatPrompt = (chatEntryId: string) => {
  const { data, isLoading, mutate } = useSWR<
    string,
    ["/api/proxy/v1/chat/prompt", string]
  >(["/api/proxy/v1/chat/prompt", chatEntryId], fetcher);

  return { data, isLoading, mutate };
};

async function fetcher([url, chatEntryId]: [
  "/api/proxy/v1/chat/prompt",
  string,
]): Promise<string> {
  const response = await fetch(`${url}/${chatEntryId}`);
  const data = await response.json();

  return data.prompt;
}
