import useSWRMutation from "swr/mutation";

interface Result {
  answer: string;
  context: string[];
}

export const useAskQuestion = () => {
  const res = useSWRMutation<
    Result,
    unknown,
    "/api/proxy/v1/chat/chat",
    { projectId: string; question: string }
  >("/api/proxy/v1/chat/chat", async (url: string, args) => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args.arg),
    });
    const data = await res.json();
    return data;
  });

  return res;
};
