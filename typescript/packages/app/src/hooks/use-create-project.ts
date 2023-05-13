import type { Project } from "@fgpt/precedent-iso";
import React from "react";
import useSWRMutation from "swr/mutation";

import { useFetchProjects } from "./use-fetch-projects";

export const useCreateProject = () => {
  const { mutate } = useFetchProjects();

  const res = useSWRMutation<
    Project,
    unknown,
    "/api/proxy/v1/projects/create",
    { name: string }
  >("/api/proxy/v1/projects/create", async (url: string, args) => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args.arg),
    });
    const data = await res.json();
    return data.project;
  });

  React.useEffect(() => {
    mutate();
  }, [mutate, res.data]);

  return res;
};
