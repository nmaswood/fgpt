import useSWR from "swr";

export const useFetchDataForTicker = (ticker: string | undefined) => {
  const { data, isLoading, mutate } = useSWR<Response>(
    ticker ? `/api/proxy/transcript/data-for-ticker/${ticker}` : null,
    async (url) => {
      const response = await fetch(url, {
        method: "POST",
      });
      const data = await response.json();

      return {
        resp: data.resp.split("\n"),
        content: data.content,
      };
    }
  );

  return { data, isLoading, mutate };
};

interface Response {
  resp: string[];
  content: string;
}
