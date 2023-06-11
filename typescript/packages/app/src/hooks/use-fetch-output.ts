import { Outputs } from "@fgpt/precedent-iso";
import useSWR from "swr";

const EMPTY_OUTPUTS: Outputs.Outputs = {
  summaries: [],
  questions: [],
};

export const useFetchOutput = (fileReferenceId: string) => {
  const { data, isLoading, mutate } = useSWR<
    Outputs.Outputs,
    ["/api/proxy/v1/output/output", string]
  >(["/api/proxy/v1/output/output", fileReferenceId], fetcher);

  return { data: data ?? EMPTY_OUTPUTS, isLoading, mutate };
};

async function fetcher([url, fileReferenceId]: [
  "/api/proxy/v1/output/output",
  string
]): Promise<Outputs.Outputs> {
  const response = await fetch(`${url}/${fileReferenceId}`);
  const data = await response.json();

  return data;
}
