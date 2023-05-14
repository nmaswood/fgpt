import { createTheme } from "@mui/material/styles";
import { IBM_Plex_Sans, Noto_Sans } from "next/font/google";

import { FGPT_PURPLE, SONG_BIRD_DISABLED_GREY, SONG_BIRD_GREY } from "./colors";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: "400",
});

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  preload: true,
});

const HEADER_FONT = notoSans.style.fontFamily;

export const NON_HEADER_FONT = ibmPlex.style.fontFamily;

export const THEME = createTheme({
  typography: {
    h1: { fontFamily: HEADER_FONT },
    h2: { fontFamily: HEADER_FONT },
    h3: { fontFamily: HEADER_FONT },
    h4: { fontFamily: HEADER_FONT },
    h5: { fontFamily: HEADER_FONT },
    h6: { fontFamily: HEADER_FONT },
    subtitle1: {
      fontFamily: NON_HEADER_FONT,
      color: SONG_BIRD_GREY,
    },
    body1: {
      fontFamily: NON_HEADER_FONT,

      color: SONG_BIRD_GREY,
    },
    body2: {
      fontFamily: NON_HEADER_FONT,

      color: SONG_BIRD_GREY,
    },
    button: { fontFamily: NON_HEADER_FONT, color: SONG_BIRD_GREY },
    caption: { fontFamily: NON_HEADER_FONT, color: SONG_BIRD_GREY },
    overline: { fontFamily: NON_HEADER_FONT, color: SONG_BIRD_GREY },
  },
  palette: {
    primary: {
      main: FGPT_PURPLE,
    },
    action: {
      disabledBackground: SONG_BIRD_DISABLED_GREY,
      disabled: "white",
    },
  },
});
