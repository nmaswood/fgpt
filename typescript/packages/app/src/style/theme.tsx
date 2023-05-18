import { createTheme } from "@mui/material/styles";
import { IBM_Plex_Sans, Noto_Sans } from "next/font/google";

import { FGPT_PURPLE } from "./colors";

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
    },
    body1: {
      fontFamily: NON_HEADER_FONT,
    },
    body2: {
      fontFamily: NON_HEADER_FONT,
    },
    button: {
      fontFamily: NON_HEADER_FONT,

      textTransform: "none",
    },
    caption: { fontFamily: NON_HEADER_FONT },
    overline: { fontFamily: NON_HEADER_FONT },
  },
  palette: {
    mode: "dark",
    primary: {
      main: FGPT_PURPLE,
    },
  },
});

declare module "@mui/material/styles" {
  interface Theme {
    status: {
      danger: string;
    };
    palette: {
      primary: {
        main: string;
      };
    };
  }
}

declare module "@mui/material/styles" {
  interface Theme {
    status: {
      danger: string;
    };
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }
}
