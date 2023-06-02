import { TextChunkGroup } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchTextChunkGroup = (fileId: string) => {
  const { data, isLoading, mutate } = useSWR<
    TextChunkGroup,
    ["/api/proxy/v1/text/text-group", string]
  >(["/api/proxy/v1/text/text-group", fileId], fetcher);

  return { data, isLoading, mutate };
};

async function fetcher([url, fileId]: [
  "/api/proxy/v1/text/text-group",
  string
]): Promise<TextChunkGroup> {
  const response = await fetch(`${url}/${fileId}`);
  const data = await response.json();
  return data.textGroup;
}
