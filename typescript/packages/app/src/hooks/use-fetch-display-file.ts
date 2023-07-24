import { DisplayFile } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchDisplayFile = (fileId: string) => {
  const { data, isLoading, mutate } = useSWR<
    DisplayFile,
    ["/api/proxy/v1/files/display-file", string]
  >(["/api/proxy/v1/files/display-file", fileId], fetcher, {
    revalidateOnFocus: false,
  });

  return { data, isLoading, mutate };
};

async function fetcher([url, fileId]: [
  "/api/proxy/v1/files/display-file",
  string,
]): Promise<DisplayFile> {
  const response = await fetch(`${url}/${fileId}`);
  return await response.json();
}
