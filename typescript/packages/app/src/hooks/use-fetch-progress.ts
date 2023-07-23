import {
  ProgressForExcelTasks,
  ProgressForPdfTasks,
} from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchProgress = (fileReferenceId: string) => {
  const { data, isLoading, mutate, error } = useSWR<
    ProgressForPdfTasks | ProgressForExcelTasks,
    ["/api/proxy/v1/files/progress", string]
  >(["/api/proxy/v1/files/progress", fileReferenceId], fetcher);

  return { data, isLoading, mutate, error };
};

async function fetcher([url, projectId]: [
  "/api/proxy/v1/files/progress",
  string,
]): Promise<ProgressForPdfTasks | ProgressForExcelTasks> {
  const response = await fetch(`${url}/${projectId}`);
  const data = await response.json();
  return data.progress;
}
