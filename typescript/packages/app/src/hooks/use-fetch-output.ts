import { Outputs, Progress } from "@fgpt/precedent-iso";
import React from "react";
import useSWR from "swr";

export const useFetchReport = (fileReferenceId: string) => {
  const [shouldPoll, setShouldPoll] = React.useState(true);
  const { data, isLoading, mutate } = useSWR<
    { report: Outputs.Report; progress: Progress | undefined },
    ["/api/proxy/v1/output/report", string]
  >(["/api/proxy/v1/output/report", fileReferenceId], fileFetcher, {
    refreshInterval: shouldPoll ? 10_000 : 0,
  });

  const total = data?.progress?.total;
  const value = data?.progress?.value;
  const isComplete = total && value && total === value;

  React.useEffect(() => {
    if (isComplete) {
      setShouldPoll(false);
    }
  }, [isComplete]);

  return { data, isLoading, mutate };
};

async function fileFetcher([url, fileReferenceId]: [
  "/api/proxy/v1/output/report",
  string
]): Promise<{ report: Outputs.Report; progress: Progress | undefined }> {
  const response = await fetch(`${url}/${fileReferenceId}`);
  const data = await response.json();

  return data;
}
