import useSWRMutation from "swr/mutation";

export const useSetCIM = () => {
  const res = useSWRMutation<
    string,
    unknown,
    "/api/proxy/v1/projects/delete",
    { fileReferenceId: string }
  >("/api/proxy/v1/projects/delete", async (url: string, args) => {
    const res = await fetch(`${url}/${args.arg.fileReferenceId}`, {
      method: "PUT",
    });
    await res.json();
    return "ok";
  });

  return res;
};
