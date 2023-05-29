import { useUser } from "@auth0/nextjs-auth0/client";
import { assertNever } from "@fgpt/precedent-iso";
import ErrorIcon from "@mui/icons-material/Error";
import InsertCommentIcon from "@mui/icons-material/InsertComment";
import SendIcon from "@mui/icons-material/Send";
import {
  Avatar,
  Box,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";

import { useAskQuestion } from "../hooks/use-ask-question";

interface QuestionWithAnswer {
  question: string;
  state:
    | {
        type: "error";
        error: string;
      }
    | {
        type: "rendering";
      }
    | {
        type: "rendered";
        value: string;
      };
}

export const Chat: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [input, setInput] = React.useState("");
  const [qs, setQs] = React.useState<QuestionWithAnswer[]>([]);

  React.useEffect(() => {
    setQs([]);
  }, [projectId]);

  const { trigger, text } = useAskQuestion((value: string) => {
    setQs((qs) => {
      const last = qs[qs.length - 1];
      if (!last || last.state.type !== "rendering") {
        return qs;
      }

      return qs.slice(0, -1).concat([
        {
          ...last,
          state: {
            type: "rendered",
            value,
          },
        },
      ]);
    });
  });

  const trimmed = input.trim();

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed.length) {
      return;
    }

    setQs((prev) => [
      ...prev,
      { question: trimmed, state: { type: "rendering" } },
    ]);

    await trigger({
      projectId,
      question: trimmed,
    });

    setInput("");
  };

  return (
    <Box
      display="flex"
      width="100%"
      height="100%"
      flexDirection="column"
      gap={15}
    >
      <Box
        display="flex"
        width="100%"
        height="100%"
        maxHeight="100%"
        overflow="auto"
      >
        {qs.length > 0 && (
          <List sx={{ width: "100%" }}>
            {qs.map((q, index) => (
              <RenderQ key={index} q={q} text={text} />
            ))}
          </List>
        )}
      </Box>
      <Box
        display="flex"
        width="100%"
        height="160px"
        paddingX={20}
        position="sticky"
        bottom={0}
      >
        <TextField
          placeholder="Send a message..."
          fullWidth
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          onKeyPress={(ev) => {
            if (ev.key === "Enter") {
              submit();
              ev.preventDefault();
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton disabled={trimmed.length === 0} onClick={submit}>
                  <SendIcon
                    sx={{
                      transform: "rotate(-45deg) scale(0.8)",
                      paddingBottom: 1,
                    }}
                  />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        ;
      </Box>
    </Box>
  );
};

const RenderQ: React.FC<{ q: QuestionWithAnswer; text: string }> = ({
  q,
  text,
}) => {
  const { user } = useUser();
  const picture = user?.picture;

  const ref = React.useRef<HTMLDivElement>(null);
  const current = ref.current;

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!current || !mounted) {
      return;
    }

    current.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "end",
    });
  }, [current, mounted]);
  return (
    <>
      <ListItem
        sx={{
          paddingY: 3,
          paddingX: 20,
        }}
      >
        {picture && (
          <ListItemAvatar>
            <Avatar src={picture} variant="rounded" />
          </ListItemAvatar>
        )}
        <ListItemText
          primary={q.question}
          primaryTypographyProps={{ color: "white" }}
        />
      </ListItem>
      <ListItem
        sx={{
          paddingY: 3,
          paddingX: 20,
          background: "#343541",
          display: "flex",
        }}
      >
        <Box ref={ref} display="flex" width="56" height="40" marginRight={2}>
          <ResponseAvatar state={"data"} />
        </Box>
        {q.state.type === "rendered" && (
          <Typography color="white">{q.state.value}</Typography>
        )}
        {q.state.type === "rendering" && (
          <Typography color="white">{text}</Typography>
        )}
      </ListItem>
    </>
  );
};

const ResponseAvatar: React.FC<{ state: "error" | "data" }> = ({ state }) => {
  switch (state) {
    case "error":
      return (
        <Box display="flex" justifyContent="center" padding={1}>
          <ErrorIcon
            color="error"
            sx={{
              transform: "scale(1.3)",
            }}
          />
        </Box>
      );
    case "data":
      return (
        <Avatar variant="rounded" color="primary">
          <InsertCommentIcon color="primary" />
        </Avatar>
      );
    default:
      assertNever(state);
  }
};
