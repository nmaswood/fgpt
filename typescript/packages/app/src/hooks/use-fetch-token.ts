import useSWR from "swr";

export const useFetchToken = () => {
  const { data, isLoading, mutate } = useSWR<string>(
    "/api/token",
    async (url) => {
      const response = await fetch(url);
      const data = await response.json();
      return data.accessToken;
    }
  );

  return { data, isLoading, mutate };
};
