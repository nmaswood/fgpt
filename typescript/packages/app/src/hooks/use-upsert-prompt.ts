import useSWRMutation from "swr/mutation";

import { useFetchPrompts } from "./use-fetch-prompts";

interface Args {
  slug: string;
  template: string;
}

export const useUpsertPrompt = () => {
  const { mutate } = useFetchPrompts();

  const res = useSWRMutation<
    string,
    unknown,
    "/api/proxy/v1/admin/upsert-prompt",
    Args
  >("/api/proxy/v1/admin/upsert-prompt", async (url: string, args) => {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args.arg),
    });
    await res.json();
    mutate();
    return "ok";
  });

  return res;
};
