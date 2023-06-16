import useSWRMutation from "swr/mutation";

export const useFetchPlayground = () => {
  const res = useSWRMutation<
    { raw: string; validated: Record<string, unknown> },
    unknown,
    "/api/proxy/v1/output/playground",
    {
      textChunkId: string;
      functionName: string;
      prompt: string;
      jsonSchema: string;
    }
  >("/api/proxy/v1/output/playground", async (url: string, args) => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args.arg),
    });
    const data = await res.json();
    return data.response.raw;
  });

  return res;
};