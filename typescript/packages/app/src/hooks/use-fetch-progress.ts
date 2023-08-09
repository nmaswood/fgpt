import {
  ProgressForExcelTasks,
  ProgressForPdfTasks,
  ProgressTaskStatus,
} from "@fgpt/precedent-iso";
import useSWR from "swr";
import React from "react";

export const useFetchProgress = (fileReferenceId: string) => {
  const limit = React.useRef(10);
  const { data, isLoading, mutate, error } = useSWR<
    ProgressForPdfTasks | ProgressForExcelTasks,
    ["/api/proxy/v1/files/progress", string]
  >(["/api/proxy/v1/files/progress", fileReferenceId], fetcher, {
    refreshInterval: (data) => {
      if (limit.current <= 0) {
        return 0;
      }
      if (!data) {
        return 0;
      }

      const values = Object.values(data) as ProgressTaskStatus[];
      if (values.every((v) => v === "succeeded")) {
        return 0;
      }
      return 5_000;
    },
  });

  React.useEffect(() => {
    if (data) {
      limit.current = limit.current - 1;
    }
  }, [data]);

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
