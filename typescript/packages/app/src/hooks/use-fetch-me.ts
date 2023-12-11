import { User } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchMe = () => {
  const { data, isLoading, mutate } = useSWR<
    User,
    ["/api/proxy/v1/user-org/me"]
  >(["/api/proxy/v1/user-org/me"], fetcher);

  return { data, isLoading, mutate };
};

async function fetcher([url]: ["/api/proxy/v1/user-org/me"]): Promise<User> {
  const response = await fetch(url);
  const data = await response.json();

  return data.user;
}
