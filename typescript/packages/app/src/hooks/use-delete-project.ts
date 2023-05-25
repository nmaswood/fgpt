import React from "react";
import useSWRMutation from "swr/mutation";

import { useFetchProjects } from "./use-fetch-projects";

export const useDeleteProject = () => {
  const { mutate } = useFetchProjects();

  const res = useSWRMutation<
    string,
    unknown,
    "/api/proxy/v1/projects",
    { id: string }
  >("/api/proxy/v1/projects", async (url: string, args) => {
    const res = await fetch(`${url}/${args.arg.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    return data.project;
  });

  React.useEffect(() => {
    mutate();
  }, [mutate, res.data]);

  return res;
};
