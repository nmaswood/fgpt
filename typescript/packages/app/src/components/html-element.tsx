import { Box } from "@mui/joy";

export const DangerousHTMLElementChat: React.FC<{ html: string }> = ({
  html,
}) => {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: html }}
      sx={(theme) => ({
        "& *": {
          fontSize: "14px",
          fontFamily: theme.vars.fontFamily.body,
          whiteSpace: "pre-wrap",
        },
        "& table, th, td": {
          padding: "8px",
          border: "1px solid #E5E5E5",
          borderCollapse: "collapse",
        },

        "& ul > li": {
          "line-height": "1px",
        },
        "& ol > li": {
          "line-height": "1px",
        },
        "& p": {
          marginY: "0px",
        },
      })}
    />
  );
};

export const DangerousHTMLElementReport: React.FC<{ html: string }> = ({
  html,
}) => {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: html }}
      sx={(theme) => ({
        "& *": {
          fontSize: "14px",
          fontFamily: theme.vars.fontFamily.body,
          whiteSpace: "pre-wrap",
        },
        "& table, th, td": {
          padding: "8px",
          border: "1px solid #E5E5E5",
          borderCollapse: "collapse",
        },
        "& p": {
          marginY: "0px",
        },
      })}
    />
  );
};
