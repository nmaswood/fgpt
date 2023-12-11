import { useUser } from "@auth0/nextjs-auth0/client";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import AdminIcon from "@mui/icons-material/SupervisorAccountOutlined";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Dropdown,
  IconButton,
  Link,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Typography,
} from "@mui/joy";
import Image from "next/image";
import React from "react";

import { useFetchMe } from "../hooks/use-fetch-me";
import { ImpersonateService } from "../services/impersonate-service";

const TOS_LINK =
  "https://docs.google.com/document/d/1t7CpKVBXKmJp4lRLdx7Zc3gGiudgdTxy3F2KTwW2Knw/view";

export const Navbar: React.FC<{
  loading: boolean;
  project?:
    | {
        id: string;
        name: string;
      }
    | undefined;
  fileName?: string | undefined;
}> = ({ project, fileName, loading }) => {
  return (
    <Box
      display="flex"
      height="48px"
      width="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      bgcolor="primary.800"
      paddingX={2}
      justifyContent="space-between"
    >
      <Box display="flex" alignItems="center">
        {!loading && (
          <Breadcrumbs
            size="lg"
            aria-label="breadcrumbs"
            color="neutral.0"
            sx={{
              paddingLeft: 1,
              paddingY: 0,
              display: "flex",
              alignItems: "center",
              ".MuiBreadcrumbs-separator": {
                color: "neutral.0",
              },
            }}
          >
            <Typography
              component={Link}
              href="/"
              level="body-lg"
              fontWeight="700"
              fontSize="14px"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                sx={{
                  transition: "transform 0.3s ease",
                  ":hover": {
                    transform: "rotate(3.142rad)",
                  },
                }}
              >
                <Image
                  priority
                  src="/paredo-icon.svg"
                  height={18}
                  width={18}
                  alt="Paredo icon"
                  color="white"
                />
              </Box>
              <span
                style={{
                  color: "white",

                  ...(project || fileName ? { opacity: 0.75 } : {}),
                }}
              >
                Deals
              </span>
            </Typography>
            {project && (
              <Typography
                level="body-lg"
                component={Link}
                href={`/projects/${project.id}`}
                fontWeight="700"
                fontSize="14px"
                sx={{
                  color: "neutral.0",
                  ...(fileName ? { opacity: 0.75 } : {}),
                }}
              >
                {project.name}
              </Typography>
            )}
            {fileName && (
              <Typography
                level="body-lg"
                fontWeight="700"
                fontSize="14px"
                sx={{
                  color: "neutral.0",
                }}
              >
                {fileName}
              </Typography>
            )}
          </Breadcrumbs>
        )}
      </Box>

      <DisplayUser />
    </Box>
  );
};

const DisplayUser = () => {
  const { user: auth0User } = useUser();
  const { data: user } = useFetchMe();
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <Box display="flex" alignItems="center">
      {auth0User && (
        <Dropdown>
          <MenuButton
            slots={{ root: IconButton }}
            slotProps={{
              root: {
                variant: "plain",
                color: "neutral",
                size: "sm",
                sx: {
                  padding: 0,
                  backgroundColor: "transparent",
                  transition: "all .2s ease-in-out",
                },
              },
            }}
          >
            <Avatar
              src={auth0User.picture ?? ""}
              sx={{
                borderRadius: 6,
                transition: "transform 0.3s ease",
                ":hover": {
                  transform: "scale(1.1)",
                },
              }}
              size="sm"
            >
              {getInitials(auth0User.name ?? "")}
            </Avatar>
          </MenuButton>

          <Menu>
            <MenuItem
              component={Link}
              href="/api/auth/logout"
              sx={{
                ":hover": {
                  textDecoration: "none",
                },
              }}
              onClick={() => {
                ImpersonateService.clear();
              }}
            >
              <ListItemDecorator>
                <LogoutIcon fontSize="small" />
              </ListItemDecorator>

              <Typography level="body-md">Logout</Typography>
            </MenuItem>
            <MenuItem
              component={Link}
              href={TOS_LINK}
              sx={{
                ":hover": {
                  textDecoration: "none",
                },
              }}
            >
              <ListItemDecorator>
                <ArticleOutlinedIcon fontSize="small" />
              </ListItemDecorator>

              <Typography level="body-md">Terms of service</Typography>
            </MenuItem>
            {isSuperAdmin && (
              <MenuItem
                component={Link}
                href="/admin"
                sx={{
                  ":hover": {
                    textDecoration: "none",
                  },
                }}
              >
                <ListItemDecorator>
                  <AdminIcon fontSize="small" />
                </ListItemDecorator>
                <Typography level="body-md">Admin</Typography>
              </MenuItem>
            )}
          </Menu>
        </Dropdown>
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
