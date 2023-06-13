import { Outputs } from "@fgpt/precedent-iso";
import useSWR from "swr";

const EMPTY_OUTPUTS: Outputs.Outputs = {
  summaries: [],
  questions: [],
  metrics: [],
};

export const useFetchOutputForFile = (fileReferenceId: string) => {
  const { data, isLoading, mutate } = useSWR<
    Outputs.Outputs,
    ["/api/proxy/v1/output/file-output", string]
  >(["/api/proxy/v1/output/file-output", fileReferenceId], fileFetcher);

  return { data: data ?? EMPTY_OUTPUTS, isLoading, mutate };
};

async function fileFetcher([url, fileReferenceId]: [
  "/api/proxy/v1/output/file-output",
  string
]): Promise<Outputs.Outputs> {
  const response = await fetch(`${url}/${fileReferenceId}`);
  const data = await response.json();

  return data;
}

export const useFetchOutputForChunk = (chunkId: string | undefined) => {
  const { data, isLoading, mutate } = useSWR<
    Outputs.Outputs,
    ["/api/proxy/v1/output/chunk-output", string | undefined]
  >(["/api/proxy/v1/output/chunk-output", chunkId], chunkFetcher);

  return { data: data ?? EMPTY_OUTPUTS, isLoading, mutate };
};

async function chunkFetcher([url, chunkId]: [
  "/api/proxy/v1/output/chunk-output",
  string | undefined
]): Promise<Outputs.Outputs> {
  if (!chunkId) {
    return EMPTY_OUTPUTS;
  }
  const response = await fetch(`${url}/${chunkId}`);
  const data = await response.json();

  return data;
}
