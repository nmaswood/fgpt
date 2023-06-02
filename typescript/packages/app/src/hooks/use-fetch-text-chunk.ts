import { TextChunk } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchTextChunk = (fileId: string, order: number) => {
  const { data, isLoading, mutate } = useSWR<
    TextChunk,
    ["/api/proxy/v1/text/text-group-chunk", string, number]
  >(["/api/proxy/v1/text/text-group-chunk", fileId, order], fetcher);

  return { data, isLoading, mutate };
};

async function fetcher([url, textGroupId, order]: [
  "/api/proxy/v1/text/text-group-chunk",
  string,
  number
]): Promise<TextChunk> {
  const response = await fetch(url, {
    body: JSON.stringify({ textGroupId, order }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data.textGroup;
}
