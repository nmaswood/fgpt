import { extendTheme } from "@mui/joy/styles";
import { Lato } from "next/font/google";

// If loading a variable font, you don't need to specify the font weight
const LATO = Lato({
  weight: ["100", "300", "400", "700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const FONT = LATO.style.fontFamily;

import { experimental_extendTheme as materialExtendTheme } from "@mui/material/styles";

const NEUTRAL = {
  0: "#FFFFFF", // (card bgs, nav icons)
  25: "#F9F9F9",
  50: "#F2F2F2", // (page bg, hover state bg)
  75: "#ECECEC",
  100: "#E5E5E5", // (dividers/table borders)
  200: "#CCCCCC",
  300: "#B3B3B3",
  400: "#999999", // (card icons)
  500: "#808080",
  600: "#666666", // (lighter text)
  700: "#4D4D4D",
  800: "#333333",
  900: "#1A1A1A",
  1000: "#000000", // (darker text)
} as const;

const PURPLE = {
  25: "#F8F5FD",
  50: "#F0EBFB",
  75: "#E9E1F9",
  100: "#E1D7F7",
  200: "#C4AFF0",
  300: "#A687E8",
  400: "#895FE1",
  500: "#6B37D9", //(primary for buttons/links)
  600: "#562CAE",
  700: "#402182",
  800: "#2B1657", // (navigation)
  900: "#150B2B",
} as const;

const RED = {
  500: "#F44336", // error
} as const;

const GREEN = {
  500: "#4CAF50", // ready
} as const;

export const THEME = materialExtendTheme({
  components: {
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 35,
        },
      },
    },
  },

  typography: {
    h1: { fontFamily: FONT },
    h2: { fontFamily: FONT },
    h3: { fontFamily: FONT },
    h4: { fontFamily: FONT },
    h5: { fontFamily: FONT },
    h6: { fontFamily: FONT },
    subtitle1: {
      fontFamily: FONT,
    },
    body1: {
      fontFamily: FONT,
    },
    body2: {
      fontFamily: FONT,
    },
    button: {
      fontFamily: FONT,

      textTransform: "none",
    },
    caption: { fontFamily: FONT },
    overline: { fontFamily: FONT },
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

export const JOY_THEME = extendTheme({
  components: {
    JoyIconButton: {
      styleOverrides: {},
    },
  },
  fontFamily: {
    body: LATO.style.fontFamily,
    display: LATO.style.fontFamily,
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          ...PURPLE,
        },
        neutral: {
          ...NEUTRAL,
        },
        danger: {
          solidColor: RED[500],
        },
        success: {
          solidColor: GREEN[500],
        },
      },
    },
  },
});
