import useSWR from "swr";
import { WorkBook, read } from "xlsx";

export const useFetchWorkbook = (url: string | undefined) => {
  const { data, isLoading, mutate } = useSWR<WorkBook | undefined, [string]>(
    url,
    fetcher
  );

  return { data, isLoading, mutate };
};

async function fetcher(url: string): Promise<WorkBook | undefined> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return read(arrayBuffer);
}
