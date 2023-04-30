import useSWR from "swr";

export const useFetchDataForTicker = (ticker: string | undefined) => {
  const { data, isLoading, mutate } = useSWR<string>(
    ticker ? `/api/proxy/transcript/data-for-ticker/${ticker}` : null,
    async (url) => {
      const response = await fetch(url, {
        method: "POST",
      });
      const data = await response.json();
      return data.ticker;
    }
  );

  return { data, isLoading, mutate };
};
