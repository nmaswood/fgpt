import { Organization } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchOrganizations = () => {
  const { data, isLoading, mutate } = useSWR<
    Organization[],
    ["/api/proxy/v1/admin/organizations"]
  >(["/api/proxy/v1/admin/organizations"], fetcher);

  return { data: data ?? [], isLoading, mutate };
};

async function fetcher([url]: ["/api/proxy/v1/admin/organizations"]): Promise<
  Organization[]
> {
  const response = await fetch(url);
  const data = await response.json();

  return data.organizations;
}
