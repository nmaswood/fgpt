import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { User } from "@fgpt/precedent-iso";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  Sheet,
  Typography,
} from "@mui/joy";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Navbar } from "../src/components/navbar";
import { useFetchMe } from "../src/hooks/use-fetch-me";
import { useFetchUsers } from "../src/hooks/use-fetch-users";
import { ImpersonateService } from "../src/services/impersonate-service";

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
      flexDirection="column"
    >
      <Navbar loading={false} />
      <Box
        display="flex"
        height="100%"
        width="100%"
        maxHeight="100%"
        maxWidth="100%"
        overflow="auto"
        flexDirection="column"
        padding={2}
        gap={2}
      >
        <Typography level="h3">Admin</Typography>

        {user && <AdminInner />}
      </Box>
    </Box>
  );
};

const AdminInner = () => {
  const { data: users } = useFetchUsers();

  return (
    <Sheet>
      <List>
        {users.map((user) => (
          <DisplayUser key={user.id} user={user} />
        ))}
      </List>
    </Sheet>
  );
};

const DisplayUser: React.FC<{ user: User }> = ({ user }) => {
  return (
    <ListItem>
      <ListItemButton
        onClick={() => {
          ImpersonateService.set(user.id);
          window.location.href = "/";
        }}
      >
        <Typography level="body1">Impersonate {user.email}</Typography>
      </ListItemButton>
    </ListItem>
  );
};

export default withPageAuthRequired(Admin);
