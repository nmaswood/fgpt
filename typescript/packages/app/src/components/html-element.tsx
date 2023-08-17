import { Box } from "@mui/joy";

export const DangerousHTMLElementChat: React.FC<{ html: string }> = ({
  html,
}) => {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: html }}
      className="dangerous-html-element-chat"
      sx={(theme) => ({
        "&.dangerous-html-element-chat > *": {
          fontSize: "14px",
          fontFamily: theme.vars.fontFamily.body,
        },
        "&.dangerous-html-element-chat > table, th, td, tbody, tr, td, thead": {
          padding: "8px",
          border: "1px solid #E5E5E5",
          borderCollapse: "collapse",
        },

        "&.dangerous-html-element-chat > p": {
          whiteSpace: "pre-wrap",
        },
        "a.fgpt-citation": {
          color: theme.palette.primary[500],
          fontSize: "12px",
          verticalAlign: "super",
        },
        "span.fgpt-citation-footnote-marker": {
          color: theme.palette.primary[500],
        },
      })}
    />
  );
};
