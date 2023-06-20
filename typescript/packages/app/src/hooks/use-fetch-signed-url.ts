import useSWR from "swr";

export const useFetchSignedUrl = (fileId: string) => {
  const { data, isLoading, mutate } = useSWR<
    string,
    ["/api/proxy/v1/files/signed-url", string]
  >(["/api/proxy/v1/files/signed-url", fileId], fetcher, {
    revalidateOnFocus: false,
  });

  return { data, isLoading, mutate };
};

async function fetcher([url, fileId]: [
  "/api/proxy/v1/files/signed-url",
  string
]): Promise<string> {
  const response = await fetch(`${url}/${fileId}`);
  const data = await response.json();
  return data.signedUrl;
}
