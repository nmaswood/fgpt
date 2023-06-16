import { Outputs } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchReport = (fileReferenceId: string) => {
  const { data, isLoading, mutate } = useSWR<
    Outputs.Report,
    ["/api/proxy/v1/output/report", string]
  >(["/api/proxy/v1/output/report", fileReferenceId], fileFetcher);

  return { data, isLoading, mutate };
};

async function fileFetcher([url, fileReferenceId]: [
  "/api/proxy/v1/output/report",
  string
]): Promise<Outputs.Report> {
  const response = await fetch(`${url}/${fileReferenceId}`);
  const data = await response.json();

  return data.report;
}
