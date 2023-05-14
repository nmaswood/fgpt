import "../styles/globals.css";

import { UserProvider } from "@auth0/nextjs-auth0/client";
import Box from "@mui/material/Box";
import { ThemeProvider } from "@mui/material/styles";
import type { AppProps } from "next/app";
import Head from "next/head";
import React from "react";

import { THEME } from "../src/style/theme";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <Head>
        <title>FGPT</title>
        <meta name="description" content="Innovative care" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <ThemeProvider theme={THEME}>
        <Box
          display="flex"
          flexDirection="column"
          width="100%"
          height="100%"
          position="relative"
        >
          {/* eslint-disable-next-line*/}
          {/* @ts-ignore */}
          <Component as any {...pageProps} />
        </Box>
      </ThemeProvider>
    </UserProvider>
  );
}
