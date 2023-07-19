import { assertNever, FileType } from "@fgpt/precedent-iso";
import { Chip, Typography } from "@mui/joy";

export const ChipForFileType: React.FC<{ f: FileType }> = ({ f }) => {
  switch (f) {
    case "excel":
      return (
        <Chip
          size="sm"
          color="success"
          sx={(theme) => ({
            backgroundColor: "transparent",
            color: theme.palette.success.solidColor,
            ".MuiTypography-root": {
              fontSize: 12,
              fontWeight: 700,
              color: theme.palette.success.solidColor,
            },
            ".MuiChip-label": {
              color: theme.palette.success.solidColor,
            },
            "&:before": {
              content: "''",
              position: "absolute",
              top: "0px",
              right: "0px",
              bottom: "0px",
              left: "0px",
              opacity: 0.15,
              background: theme.palette.success.solidColor,
              borderRadius: 16,
            },
          })}
        >
          <Typography>XLS</Typography>
        </Chip>
      );
    case "pdf":
      return (
        <Chip
          size="sm"
          color="danger"
          sx={(theme) => ({
            backgroundColor: "transparent",
            color: theme.palette.danger.solidColor,
            ".MuiTypography-root": {
              fontSize: 12,
              fontWeight: 700,
              color: theme.palette.danger.solidColor,
            },
            ".MuiChip-label": {
              color: theme.palette.danger.solidColor,
            },
            "&:before": {
              content: "''",
              position: "absolute",
              top: "0px",
              right: "0px",
              bottom: "0px",
              left: "0px",
              opacity: 0.15,
              background: theme.palette.danger.solidColor,
              borderRadius: 16,
            },
          })}
        >
          PDF
        </Chip>
      );
    default:
      assertNever(f);
  }
};
