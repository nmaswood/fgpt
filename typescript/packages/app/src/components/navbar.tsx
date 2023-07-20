import { useUser } from "@auth0/nextjs-auth0/client";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import AdminIcon from "@mui/icons-material/SupervisorAccountOutlined";
import {
  Avatar,
  Box,
  Breadcrumbs,
  IconButton,
  Link,
  ListItemDecorator,
  Menu,
  MenuItem,
  Typography,
} from "@mui/joy";
import React from "react";

import { useFetchMe } from "../hooks/use-fetch-me";
import { ImpersonateService } from "../services/impersonate-service";

export const Navbar: React.FC<{
  project?:
    | {
        id: string;
        name: string;
      }
    | undefined;
  fileName?: string | undefined;
}> = ({ project, fileName }) => {
  return (
    <Box
      display="flex"
      height="62px"
      width="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      bgcolor="primary.800"
      paddingX={2}
      justifyContent="space-between"
    >
      <Breadcrumbs
        size="lg"
        aria-label="breadcrumbs"
        color="neutral.0"
        sx={{
          display: "flex",
          alignItems: "center",
          ".MuiBreadcrumbs-separator": {
            color: "white",
          },
        }}
      >
        <Typography
          component={Link}
          href="/"
          level="h5"
          sx={{
            color: "white",
          }}
        >
          Deals
        </Typography>
        {project && (
          <Typography
            level="h5"
            component={Link}
            href={`/projects/${project.id}`}
            sx={{
              color: "white",
            }}
          >
            {project.name}
          </Typography>
        )}
        {fileName && (
          <Typography
            level="h5"
            sx={{
              color: "white",
            }}
          >
            {fileName}
          </Typography>
        )}
      </Breadcrumbs>

      <DisplayUser />
    </Box>
  );
};

const DisplayUser = () => {
  const { user: auth0User } = useUser();
  const { data: user } = useFetchMe();
  const isSuperAdmin = user?.role === "superadmin";

  const [open, setOpen] = React.useState(false);

  const handleClose = () => setOpen(false);
  const buttonRef = React.useRef(null);

  return (
    <Box display="flex" alignItems="center">
      {auth0User && (
        <>
          <IconButton
            ref={buttonRef}
            variant="plain"
            size="sm"
            sx={{
              padding: 0,
              backgroundColor: "transparent",
              transition: "all .2s ease-in-out",
            }}
            onClick={() => setOpen(true)}
          >
            <Avatar
              src={auth0User.picture ?? ""}
              sx={{
                borderRadius: 6,
              }}
              size="sm"
            >
              {getInitials(auth0User.name ?? "")}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={buttonRef.current}
            open={open}
            onClose={handleClose}
            placement="bottom-end"
          >
            <MenuItem
              component={Link}
              href="/api/auth/logout"
              onClick={() => {
                ImpersonateService.clear();
                handleClose();
              }}
            >
              <ListItemDecorator>
                <LogoutIcon />
              </ListItemDecorator>
              Logout
            </MenuItem>
            {isSuperAdmin && (
              <MenuItem component={Link} href="/admin" onClick={handleClose}>
                <ListItemDecorator>
                  <AdminIcon />
                </ListItemDecorator>
                Admin
              </MenuItem>
            )}
          </Menu>
        </>
      )}
    </Box>
  );
};

const INITIALS_REGEX = new RegExp(/(\p{L}{1})\p{L}+/, "gu");

function getInitials(name: string): string {
  const initials = [...name.matchAll(INITIALS_REGEX)] || [];

  return (
    (initials.shift()?.[1] || "") + (initials.pop()?.[1] || "")
  ).toUpperCase();
}
