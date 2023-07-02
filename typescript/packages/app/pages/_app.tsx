import "../styles/globals.css";

import { UserProvider } from "@auth0/nextjs-auth0/client";
import { Box } from "@mui/joy";
import { CssVarsProvider as JoyCssVarsProvider } from "@mui/joy/styles";
import {
  Experimental_CssVarsProvider as MaterialCssVarsProvider,
  THEME_ID as MATERIAL_THEME_ID,
} from "@mui/material/styles";
import type { AppProps } from "next/app";
import Head from "next/head";
import React from "react";

import { THEME } from "../src/style/theme";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <Head>
        <title>Paredo | AI Powered Finance</title>
        <meta
          name="description"
          content="AI-First Tools for Modern Financial Analysis"
        />
        <link rel="icon" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <MaterialCssVarsProvider theme={{ [MATERIAL_THEME_ID]: THEME }}>
        <JoyCssVarsProvider>
          <Box
            display="flex"
            flexDirection="column"
            width="100%"
            height="100%"
            maxHeight="100%"
            maxWidth="100%"
            overflow="auto"
            position="relative"
          >
            {/* eslint-disable-next-line*/}
            {/* @ts-ignore */}
            <Component as any {...pageProps} />
          </Box>
        </JoyCssVarsProvider>
      </MaterialCssVarsProvider>
    </UserProvider>
  );
}
