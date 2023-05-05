import useSWRMutation from "swr/mutation";

interface Request {
  ticker: string | undefined;
  question: string;
}

interface Response {
  summaries: string[];
  answer: string;
}

export const useAskQuestion = () => {
  const { data, trigger, isMutating } = useSWRMutation<
    Response,
    unknown,
    "/api/proxy/transcript/ask-question",
    Request
  >("/api/proxy/transcript/ask-question", async (url: string, { arg }) => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(arg),
    });
    const data = await res.json();
    return data;
  });

  return { data, trigger, isMutating };
};
