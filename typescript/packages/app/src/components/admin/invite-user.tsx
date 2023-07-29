import { InvitedUser } from "@fgpt/precedent-iso";
import { Button } from "@mui/joy";
import { Box, Input, Typography } from "@mui/joy";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React from "react";

import { useFetchInvitations } from "../../hooks/use-fetch-invitations";
import { useInviteUser } from "../../hooks/use-invite-user";

export const DisplayUserInvitiations = () => {
  const [email, setEmail] = React.useState("");
  const { data: invitations, mutate: mutateInvitations } =
    useFetchInvitations();
  const { trigger, isMutating } = useInviteUser();

  const onSubmit = async () => {
    await trigger({ email });
    setEmail("");
    mutateInvitations();
  };

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Typography level="h3">Invite User</Typography>
      <Input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
        }}
        sx={{
          width: "300px",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSubmit();
          }
        }}
      />
      <Button
        disabled={!email}
        sx={{ width: "300px" }}
        loading={isMutating}
        onClick={onSubmit}
      >
        Submit
      </Button>

      <ListInvites invites={invitations ?? []} />
    </Box>
  );
};

const ListInvites: React.FC<{ invites: InvitedUser[] }> = ({ invites }) => {
  const columns: GridColDef<InvitedUser>[] = [
    {
      field: "email",
      headerName: "Email",
      minWidth: 300,
    },
    {
      minWidth: 500,
      field: "organizationId",
      headerName: "Organization id",
    },
  ];
  return (
    <DataGrid
      rows={invites}
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
