import { assertNever, FileType } from "@fgpt/precedent-iso";
import { Chip } from "@mui/joy";

export const ChipForFileType: React.FC<{ f: FileType }> = ({ f }) => {
  return (
    <Chip
      size="sm"
      color="danger"
      sx={(theme) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        background: (theme.palette.neutral as any)["75"],
        ".MuiTypography-root": {
          fontSize: 12,
          fontWeight: 700,
          color: theme.palette.neutral[600],
        },
        ".MuiChip-label": {
          color: theme.palette.neutral[600],
        },
      })}
    >
      {copyForFileType(f)}
    </Chip>
  );
};

function copyForFileType(f: FileType): "PDF" | "XLS" {
  switch (f) {
    case "excel":
      return "XLS";
    case "pdf":
      return "PDF";
    default:
      assertNever(f);
  }
}
