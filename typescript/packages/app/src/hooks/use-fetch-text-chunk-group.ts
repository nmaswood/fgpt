import { ChunkStrategy,TextChunkGroup } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchTextChunkGroup = (
  chunkStrategy: ChunkStrategy,
  fileId: string
) => {
  const { data, isLoading, mutate } = useSWR<
    TextChunkGroup,
    ["/api/proxy/v1/text/text-group", string, string]
  >(["/api/proxy/v1/text/text-group", chunkStrategy, fileId], fetcher);

  return { data, isLoading, mutate };
};

async function fetcher([url, chunkStrategy, fileId]: [
  "/api/proxy/v1/text/text-group",
  string,
  string
]): Promise<TextChunkGroup> {
  const response = await fetch(`${url}/${chunkStrategy}/${fileId}`);
  const data = await response.json();
  return data.textGroup;
}
