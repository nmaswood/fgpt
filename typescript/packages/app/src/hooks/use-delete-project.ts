import useSWRMutation from "swr/mutation";

import { useFetchProjects } from "./use-fetch-projects";

export const useDeleteProject = () => {
  const { mutate } = useFetchProjects();

  const res = useSWRMutation<
    string,
    unknown,
    "/api/proxy/v1/projects/delete",
    { id: string }
  >("/api/proxy/v1/projects/delete", async (url: string, args) => {
    const res = await fetch(`${url}/${args.arg.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    mutate();
    return data.project;
  });

  return res;
};
