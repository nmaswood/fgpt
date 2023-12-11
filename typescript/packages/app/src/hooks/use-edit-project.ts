import useSWRMutation from "swr/mutation";

import { useFetchProjects } from "./use-fetch-projects";

export const useEditProject = () => {
  const { mutate } = useFetchProjects();

  const res = useSWRMutation<
    string,
    unknown,
    "/api/proxy/v1/projects/update",
    { id: string; name: string }
  >("/api/proxy/v1/projects/update", async (url: string, args) => {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args.arg),
    });
    const data = await res.json();
    mutate();
    return data.project;
  });

  return res;
};
