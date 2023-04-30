import useSWR from "swr";

export const useFetchDataForTicker = (ticker: string | undefined) => {
  const { data, isLoading, mutate } = useSWR<string[]>(
    ticker ? `/api/proxy/transcript/data-for-ticker/${ticker}` : null,
    async (url) => {
      const response = await fetch(url, {
        method: "POST",
      });
      const data = await response.json();

      const text = data.data.resp;
      return text.split("\n");
    }
  );

  return { data: data ?? [], isLoading, mutate };
};
