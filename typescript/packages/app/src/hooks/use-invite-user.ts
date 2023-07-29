import useSWRMutation from "swr/mutation";

interface Args {
  email: string;
  organizationId?: string;
}

export const useInviteUser = () => {
  const res = useSWRMutation<
    string,
    unknown,
    "/api/proxy/v1/admin/invite",
    Args
  >("/api/proxy/v1/admin/invite", async (url: string, args) => {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    await res.json();
    return "ok";
  });

  return res;
};
