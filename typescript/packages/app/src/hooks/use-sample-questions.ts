import useSWR from "swr";

export const useSampleForFile = (fileReferenceId: string) => {
  const { data, isLoading, mutate } = useSWR<
    string[],
    ["/api/proxy/v1/output/sample-file", string]
  >(
    ["/api/proxy/v1/output/sample-file", fileReferenceId],
    forFileSampleFetcher
  );

  return { data: data ?? [], isLoading, mutate };
};

async function forFileSampleFetcher([url, fileReferenceId]: [
  "/api/proxy/v1/output/sample-file",
  string
]): Promise<string[]> {
  const response = await fetch(`${url}/${fileReferenceId}`);
  const data = await response.json();

  return data.questions;
}

export const useSampleForProject = (projectId: string) => {
  const { data, isLoading, mutate } = useSWR<
    string[],
    ["/api/proxy/v1/output/sample-project", string]
  >(
    ["/api/proxy/v1/output/sample-project", projectId],
    forProjectSampleFetcher
  );

  return { data: data ?? [], isLoading, mutate };
};

async function forProjectSampleFetcher([url, projectId]: [
  "/api/proxy/v1/output/sample-project",
  string
]): Promise<string[]> {
  const response = await fetch(`${url}/${projectId}`);
  const data = await response.json();

  return data.questions;
}
