import { assertNever, RenderShowCaseFile } from "@fgpt/precedent-iso";
import { Box, Button, CircularProgress, Typography } from "@mui/joy";
import Image from "next/image";

export const DataRoomSummary: React.FC<{
  loading: boolean;
  showCaseFile: RenderShowCaseFile.File | undefined;
}> = ({ loading, showCaseFile }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      width="100%"
      padding={2}
      paddingBottom={4}
      maxHeight="100%"
      overflow="auto"
      gap={3}
      bgcolor="neutral.0"
      borderRadius={8}
    >
      <Box display="flex" width="100%" justifyContent="space-between">
        <Typography level="h4">Data room summary</Typography>
        <Button disabled={true}>View full report</Button>
      </Box>

      {loading && (
        <Box
          display="flex"
          width="100%"
          height="100%"
          alignItems="center"
          justifyContent="center"
        >
          <CircularProgress />
        </Box>
      )}
      {showCaseFile && (
        <Box
          display="flex"
          width="100%"
          height="100%"
          maxHeight="100%"
          maxWidth="100%"
          overflow="auto"
        >
          <Dispatch showCaseFile={showCaseFile} />
        </Box>
      )}
    </Box>
  );
};

const Dispatch: React.FC<{ showCaseFile: RenderShowCaseFile.File }> = ({
  showCaseFile,
}) => {
  switch (showCaseFile.type) {
    case "not_set":
      return null;
    case "set":
      if (!showCaseFile.url) {
        return null;
      }
      return (
        <Box
          display="flex"
          width="100%"
          height="100%"
          maxHeight="100%"
          maxWidth="100%"
          overflow="auto"
        >
          <Image
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            src={showCaseFile.url}
            width={500}
            height={500}
            alt="thumbnail of CIM"
          />
          <Box
            display="flex"
            width="100%"
            height="100%"
            maxHeight="100%"
            maxWidth="100%"
            overflow="auto"
          >
            Terms Table
          </Box>
        </Box>
      );
    default:
      assertNever(showCaseFile);
  }
};

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" opacity="0.5">
  <defs>
    <linearGradient id="g-image-shimmer">
      <stop stop-color="#ccc" offset="20%" />
      <stop stop-color="#eee" offset="50%" />
      <stop stop-color="#ccc" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g-image-shimmer)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;
const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

export function makeBlurDataURL(width: number, height: number) {
  return `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`;
}

const BLUR_DATA_URL = makeBlurDataURL(500, 500);
