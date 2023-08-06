import { Prompt } from "@fgpt/precedent-iso";
import useSWR from "swr";

export const useFetchPrompts = () => {
  const { data, isLoading, mutate } = useSWR<
    Prompt[],
    ["/api/proxy/v1/admin/prompts"]
  >(["/api/proxy/v1/admin/prompts"], fetcher);

  return { data: data ?? [], isLoading, mutate };
};

async function fetcher([url]: ["/api/proxy/v1/admin/prompts"]): Promise<
  Prompt[]
> {
  const response = await fetch(url);
  const data = await response.json();
  return data.prompts;
}
