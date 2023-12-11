import useSWRMutation from "swr/mutation";

import { useFetchFileToRender } from "./use-fetch-file-to-render";

interface Args {
  projectId: string;
  fileReferenceId: string;
  slug: string;
}

export const useTriggerOutput = (fileReferenceId: string) => {
  const { mutate } = useFetchFileToRender(fileReferenceId);
  const res = useSWRMutation<"ok", Args, "/api/proxy/v1/files/trigger", Args>(
    "/api/proxy/v1/files/trigger",
    async (url: string, args) => {
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args.arg),
      });
      const data = await res.json();
      mutate();
      return data;
    },
  );

  return res;
};
