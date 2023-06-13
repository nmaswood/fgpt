import { TextChunk } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchTextChunk = (
  fileId: string | undefined,
  order: number
) => {
  const { data, isLoading, mutate } = useSWR<
    TextChunk | undefined,
    ["/api/proxy/v1/text/text-group-chunk", string | undefined, number]
  >(["/api/proxy/v1/text/text-group-chunk", fileId, order], fetcher);

  return { data, isLoading, mutate };
};

async function fetcher([url, textGroupId, order]: [
  "/api/proxy/v1/text/text-group-chunk",
  string | undefined,
  number
]): Promise<TextChunk | undefined> {
  if (!textGroupId) {
    return undefined;
  }
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
