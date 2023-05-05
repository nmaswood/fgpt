import useSWR, { Fetcher } from "swr";

interface Response {
  summaries: string[];
  answer: string;
}

export const useAskQuestion = (
  ticker: string | undefined,
  question: string
) => {
  const fetcher: Fetcher<
    Response,
    ["/api/proxy/transcript/ask-quetion", string | undefined, string]
  > = async ([url, t, q]) => {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        ticker: t,
        question: q,
      }),
    });
    const data = await response.json();
    console.log({ data });
    return data;
  };

  const { data, isLoading } = useSWR(
    ["/api/proxy/transcript/ask-quetion", ticker, question],
    fetcher
  );

  return { data, isLoading };
};
