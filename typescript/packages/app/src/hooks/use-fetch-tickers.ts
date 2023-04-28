import useSWR from "swr";

export const useFetchTickers = () => {
  const { data, isLoading, mutate } = useSWR<string[]>(
    "/api/proxy/transcript/tickers",
    async (url) => {
      const response = await fetch(url);
      const data = await response.json();
      return data.tickers.sort();
    }
  );

  return { data, isLoading, mutate };
};
