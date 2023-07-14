import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { Box } from "@mui/joy";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useFetchMe } from "../src/hooks/use-fetch-me";

const Admin: React.FC = () => {
  const { data: user } = useFetchMe();
  const router = useRouter();

  React.useEffect(() => {
    if (!user) {
      return;
    }
    if (user.role !== "superadmin") {
      router.push("/");
    }
  }, [user, router]);

  return (
    <Box
      display="flex"
      height="100%"
      width="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
    >
      {user && "Admin"}
    </Box>
  );
};

export default withPageAuthRequired(Admin);
