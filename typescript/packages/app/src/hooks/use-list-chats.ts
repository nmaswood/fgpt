import { Chat } from "@fgpt/precedent-iso";
import useSWR from "swr";

export type ChatLocation = "project" | "file";
export const useFetchChats = (location: ChatLocation, id: string) => {
  const { data, isLoading, mutate } = useSWR<
    Chat[],
    ["/api/proxy/v1/chat", string, string]
  >(["/api/proxy/v1/chat", location, id], fetcher);

  return { data: data ?? [], isLoading, mutate };
};

async function fetcher([url, location, id]: [
  "/api/proxy/v1/chat",
  string,
  string
]): Promise<Chat[]> {
  const finalUrl = `${url}/list-${location}-chats/${id}`;
  const response = await fetch(finalUrl);
  const data = await response.json();

  return data.chats;
}
