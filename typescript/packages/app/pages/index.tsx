import {
  Autocomplete,
  Box,
  LinearProgress,
  Paper,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import * as React from "react";

import { useFetchDataForTicker } from "../src/hooks/use-fetch-data-for-ticker";
import { useFetchTickers } from "../src/hooks/use-fetch-tickers";

interface QuestionWithAnswer {
  question: string;
  answer: string;
}

const Home: React.FC = () => {
  const { data } = useFetchTickers();
  const [ticker, setTicker] = React.useState<string | undefined>(undefined);
  const { isLoading, data: resp } = useFetchDataForTicker(ticker);

  const [questionsWithAnswers, setQuestionsWithAnswers] =
    React.useState<QuestionWithAnswer>([]);

  const [content, setContent] = React.useState<string>("");

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
      <Box display="flex" width="900px" flexDirection="column" gap={3}>
        <TextField
          id="filled-multiline-static"
          label="Ask a question dude"
          multiline
          fullWidth
          rows={4}
          variant="filled"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button>Ask</Button>
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
      {resp && (
        <Box display="flex" flexDirection="column" gap={5}>
          <Paper>
            <Typography variant="caption">Summary:</Typography>
            <Box display="flex" flexDirection="column">
              {resp.summary.map((summary, idx) => (
                <Typography key={idx} variant="body1">
                  {summary}
                </Typography>
              ))}
            </Box>
          </Paper>
          <Paper>
            <Typography variant="caption">Questions to consider:</Typography>
            <Box display="flex" flexDirection="column">
              {resp.resp.map((question) => (
                <Typography key={question} variant="body1">
                  {question}
                </Typography>
              ))}
            </Box>
          </Paper>
          <Paper>
            <Typography variant="caption">Content</Typography>
            <Typography>{resp.content}</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default Home;
