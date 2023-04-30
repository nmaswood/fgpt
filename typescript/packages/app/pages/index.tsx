import {
  Autocomplete,
  Box,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import * as React from "react";

import { useFetchDataForTicker } from "../src/hooks/use-fetch-data-for-ticker";
import { useFetchTickers } from "../src/hooks/use-fetch-tickers";

const Home: React.FC = () => {
  const { data } = useFetchTickers();
  const [ticker, setTicker] = React.useState<string | undefined>(undefined);
  const { isLoading, data: questions } = useFetchDataForTicker(ticker);
  console.log({ questions });

  return (
    <Box padding={3} gap={3}>
      <Typography align="center" variant="h3">
        💰 Finance GPT
      </Typography>

      <Box display="flex" paddingY={1}>
        <Autocomplete
          value={ticker ?? null}
          onChange={(_, newValue) => {
            setTicker(newValue ?? undefined);
          }}
          options={data ?? []}
          sx={{ width: 300 }}
          renderInput={({ size, ...rest }) => (
            // eslint-disable-next-line
            // @ts-ignore
            <TextField
              variant="outlined"
              label="Select Ticker"
              size={size}
              {...rest}
            />
          )}
        />
      </Box>
      <Box display="flex" width="100%">
        {isLoading && (
          <LinearProgress
            sx={{
              width: "100%",
            }}
          />
        )}
      </Box>
      {questions.length > 0 && (
        <Box display="flex" flexDirection="column">
          <Typography>Questions to consider:</Typography>
          <Box display="flex" flexDirection="column">
            {questions.map((question) => (
              <Typography key={question} variant="body1">
                {question}
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Home;
