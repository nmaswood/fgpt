import { Box, Button } from "@mui/material";

export const DisplayReports: React.FC = () => {
  return (
    <Box
      display="flex"
      width="100%"
      height="100%"
      alignItems="center"
      justifyContent="center"
    >
      <Button variant="outlined">Generate Report</Button>
    </Box>
  );
};
