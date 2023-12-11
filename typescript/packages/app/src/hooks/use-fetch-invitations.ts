import { InvitedUser } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchInvitations = () => {
  const { data, isLoading, mutate } = useSWR<
    InvitedUser[],
    ["/api/proxy/v1/admin/invitations"]
  >(["/api/proxy/v1/admin/invitations"], fetcher);

  return { data: data ?? [], isLoading, mutate };
};

async function fetcher([url]: ["/api/proxy/v1/admin/invitations"]): Promise<
  InvitedUser[]
> {
  const response = await fetch(url);
  const data = await response.json();

  return data.users;
}
