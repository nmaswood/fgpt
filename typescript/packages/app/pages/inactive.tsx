import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { Box, CircularProgress, Typography } from "@mui/joy";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";

import { Navbar } from "../src/components/navbar";
import { useFetchMe } from "../src/hooks/use-fetch-me";
import styles from "./inactive.module.css";

const Inactive: React.FC = () => {
  const router = useRouter();
  const { data: user, isLoading } = useFetchMe();

  const status = user?.status;
  React.useEffect(() => {
    if (status === "active") {
      router.push("/");
    }
  }, [router, status]);
  return (
    <Box
      display="flex"
      height="100%"
      width="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      flexDirection="column"
      bgcolor="background.body"
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
        alignItems="center"
        justifyContent="center"
        padding={3}
      >
        {isLoading && <CircularProgress />}
        {!isLoading && (
          <Box
            display="flex"
            width="auto"
            height="auto"
            border="1px solid black"
            borderRadius={8}
            alignItems="center"
            padding={3}
            bgcolor="neutral.0"
            className={styles["message-display"]}
          >
            <Image
              priority
              src="/paredo-second.svg"
              height={96}
              width={96}
              className={styles.icon}
              alt="Paredo icon"
            />
            <Box
              display="flex"
              gap={1 / 2}
              flexDirection="column"
              className={styles["message-text"]}
            >
              <Typography level="h5">
                Paredo is currently in private alpha
              </Typography>
              <Typography
                level="h5"
                component={Link}
                href="https://jf5d2k3ur6o.typeform.com/to/sbYgEcSy?typeform-source=www.getparedo.com"
              >
                <Box
                  component="span"
                  sx={{
                    textDecoration: "underline",
                    color: "primary",
                  }}
                >
                  Reach out{" "}
                </Box>
                to join the waitlist
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default withPageAuthRequired(Inactive);
