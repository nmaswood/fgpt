import { assertNever, FileToRender } from "@fgpt/precedent-iso";
import useSWR from "swr";
import React from "react";

export const useFetchFileToRender = (fileReferenceId: string) => {
  const limit = React.useRef(10);
  const { data, isLoading, mutate } = useSWR<
    FileToRender.File | undefined,
    ["/api/proxy/v1/output/render-file", string]
  >(["/api/proxy/v1/output/render-file", fileReferenceId], fileFetcher, {
    refreshInterval: (data) => {
      if (limit.current <= 0) {
        return 0;
      }

      if (data?.status === "pending") {
        return 15_000;
      }

      return 0;
    },
  });

  React.useEffect(() => {
    if (data) {
      limit.current = limit.current - 1;
    }
  }, [data]);

  return { data, isLoading, mutate };
};

async function fileFetcher([url, fileReferenceId]: [
  "/api/proxy/v1/output/render-file",
  string,
]): Promise<FileToRender.File | undefined> {
  const response = await fetch(`${url}/${fileReferenceId}`);
  const data = await response.json();

  return data.file;
}
