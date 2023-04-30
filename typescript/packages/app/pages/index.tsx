import * as React from "react";

import { useFetchTickers } from "../src/hooks/use-fetch-tickers";

import { Box, TextField, Autocomplete } from "@mui/material";
import { useFetchDataForTicker } from "../src/hooks/use-fetch-data-for-ticker";

const Home: React.FC = () => {
  const { data } = useFetchTickers();
  const [ticker, setTicker] = React.useState<string | undefined>(undefined);
  const tickerResponse = useFetchDataForTicker(ticker);
  console.log(tickerResponse);
  console.log(ticker);

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
    </Box>
  );
};

export default Home;
