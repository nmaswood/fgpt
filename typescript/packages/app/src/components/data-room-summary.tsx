import { Box, Typography } from "@mui/joy";

export const DataRoomSummary: React.FC = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      height="50%"
      width="100%"
      padding={2}
      paddingBottom={4}
      maxHeight="100%"
      overflow="auto"
      gap={3}
      bgcolor="neutral.0"
      borderRadius={8}
    >
      <Typography level="h4">Data room summary</Typography>
    </Box>
  );
};
