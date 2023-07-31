import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { User } from "@fgpt/precedent-iso";
import { Box, Button, Typography } from "@mui/joy";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DisplayUserInvitiations } from "../src/components/admin/invite-user";
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

        {user && <DisplayUsers userId={user.id} />}
        <DisplayUserInvitiations />
      </Box>
    </Box>
  );
};

const DisplayUsers: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: users } = useFetchUsers();
  const columns: GridColDef<User>[] = [
    {
      field: "email",
      headerName: "Email",
      minWidth: 300,
    },
    {
      field: "role",
      headerName: "Role",
      minWidth: 300,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 300,
    },
    {
      minWidth: 300,
      field: "organizationId",
      headerName: "Organization id",
    },
    {
      minWidth: 300,
      field: "impersonate",
      headerName: "Impersonate",
      renderCell: (params) => {
        if (userId === params.row.id) {
          return null;
        }
        return (
          <Button
            onClick={() => {
              ImpersonateService.set(params.row.id);
              window.location.href = "/";
            }}
          >
            Impersonate {params.row.email}
          </Button>
        );
      },
    },
  ];
  return (
    <DataGrid
      rows={users}
      columns={columns}
      disableRowSelectionOnClick
      disableColumnFilter
      disableColumnMenu
      hideFooter={true}
      hideFooterPagination
      getRowHeight={() => "auto"}
    />
  );
};

export default withPageAuthRequired(Admin);
