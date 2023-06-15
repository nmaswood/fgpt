import useSWRMutation from "swr/mutation";

export const useGenerateOutput = () => {
  const res = useSWRMutation<
    { raw: string; validated: Record<string, unknown> },
    unknown,
    "/api/proxy/v1/output/gen-chunk-output",
    {
      textChunkId: string;
    }
  >("/api/proxy/v1/output/gen-chunk-output", async (url: string, args) => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args.arg),
    });
    const data = await res.json();
    return data.output;
  });

  return res;
};
