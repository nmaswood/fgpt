import "../styles/globals.css";

import Box from "@mui/material/Box";
import { ThemeProvider } from "@mui/material/styles";
import type { AppProps } from "next/app";
import Head from "next/head";
import React from "react";

import { THEME } from "../src/style/theme";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Nuwas | Change this later</title>
        <meta name="description" content="Innovative care" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <ThemeProvider theme={THEME}>
        <Box
          display="flex"
          flexDirection="column"
          height="100%"
          position="relative"
        >
          <Component {...pageProps} />
        </Box>
      </ThemeProvider>
    </>
  );
}
