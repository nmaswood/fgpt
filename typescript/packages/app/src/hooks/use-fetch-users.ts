import { User } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchUsers = () => {
  const { data, isLoading, mutate } = useSWR<
    User[],
    ["/api/proxy/v1/admin/users"]
  >(["/api/proxy/v1/admin/users"], fetcher);

  return { data: data ?? [], isLoading, mutate };
};

async function fetcher([url]: ["/api/proxy/v1/admin/users"]): Promise<User[]> {
  const response = await fetch(url);
  const data = await response.json();

  return data.users;
}
