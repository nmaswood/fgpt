import { Input, Typography } from "@mui/joy";
import React from "react";
import { useFetchInvitations } from "../../hooks/use-fetch-invitations";

export const DisplayUserInvitiations = () => {
  const [email, setEmail] = React.useState("");
  useFetchInvitations();

  return (
    <>
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
      />
    </>
  );
};
