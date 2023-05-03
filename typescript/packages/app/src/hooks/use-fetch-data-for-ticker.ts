import useSWR from "swr";

export const useFetchDataForTicker = (ticker: string | undefined) => {
  const { data, isLoading, mutate } = useSWR<Response>(
    ticker ? `/api/proxy/transcript/data-for-ticker/${ticker}` : null,
    async (url) => {
      const response = await fetch(url, {
        method: "POST",
      });
      const data = await response.json();
      console.log(data);

      const summary: string[] = data.summary;

      return {
        resp: data.resp.split("\n"),
        content: data.content,
        summary: summary.flatMap((s) => s.split("\n")),
      };
    }
  );

  return { data, isLoading, mutate };
};

interface Response {
  resp: string[];
  summary: string[];
  content: string;
}
