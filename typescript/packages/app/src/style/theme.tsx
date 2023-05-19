import { createTheme } from "@mui/material/styles";

import { FGPT_BLUE, FGPT_RED } from "./colors";

const HEADER_FONT = `Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif;`;

export const NON_HEADER_FONT = `Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Nimbus Sans Narrow', sans-serif-condensed, sans-serif;`;

export const THEME = createTheme({
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
      main: FGPT_BLUE,
    },
    secondary: {
      main: FGPT_RED,
    },

    background: {
      default: "#121212",
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
