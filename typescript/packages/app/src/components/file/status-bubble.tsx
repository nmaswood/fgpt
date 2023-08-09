import { assertNever, FileStatus } from "@fgpt/precedent-iso";
import { Chip } from "@mui/joy";

export const StatusBubble: React.FC<{ status: FileStatus }> = ({ status }) => {
  switch (status) {
    case "pending":
      return (
        <Chip
          size="sm"
          sx={(theme) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            background: (theme.palette.neutral as any)[0],
            fontSize: "14px",
            color: "neutral.600",
            border: `1px solid ${theme.palette.neutral[100]}`,
            fontWeight: 700,
          })}
        >
          Analyzing
        </Chip>
      );
    case "ready":
      return (
        <Chip
          size="sm"
          sx={(theme) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            background: (theme.palette.neutral as any)[0],
            fontSize: "14px",
            color: "success.solidColor",
            border: `1px solid ${theme.palette.neutral[100]}`,
            fontWeight: 700,
          })}
        >
          Ready
        </Chip>
      );
    case "error":
      return (
        <Chip
          size="sm"
          sx={(theme) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            background: (theme.palette.neutral as any)[0],
            fontSize: "14px",
            color: "danger.solidColor",
            border: `1px solid ${theme.palette.neutral[100]}`,
            fontWeight: 700,
          })}
        >
          Error
        </Chip>
      );

    default:
      assertNever(status);
  }
};
