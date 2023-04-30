import { Autocomplete, Box, TextField, LinearProgress } from "@mui/material";
import * as React from "react";

import { useFetchDataForTicker } from "../src/hooks/use-fetch-data-for-ticker";
import { useFetchTickers } from "../src/hooks/use-fetch-tickers";

const Home: React.FC = () => {
  const { data } = useFetchTickers();
  const [ticker, setTicker] = React.useState<string | undefined>(undefined);
  const { isLoading, data: questions } = useFetchDataForTicker(ticker);
  console.log({ questions });

  return (
    <Box padding={3}>
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
      <Box display="flex" width="100%">
        {isLoading && <LinearProgress />}
      </Box>
    </Box>
  );
};

export default Home;
