import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { Box, Button } from "@mui/material";
import * as React from "react";

import { useFetchUser } from "../src/hooks/use-fetch-user";

const Home: React.FC = () => {
  const { data: user } = useFetchUser();

  return (
    <Box padding={3} gap={3}>
      <Button href="/api/auth/logout">Logout</Button>
      {user && <pre>{JSON.stringify(user, null, 2)}</pre>}
    </Box>
  );
};

export default withPageAuthRequired(Home);
