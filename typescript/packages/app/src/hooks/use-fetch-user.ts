import { User } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchUser = () => {
  const { data, isLoading, mutate } = useSWR<User>(
    "/api/proxy/v1/user-org/me",
    async (url) => {
      const response = await fetch(url);
      const data = await response.json();
      return data.user;
    }
  );

  return { data, isLoading, mutate };
};
