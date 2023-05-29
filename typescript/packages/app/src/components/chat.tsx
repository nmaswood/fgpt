import { useUser } from "@auth0/nextjs-auth0/client";
import { assertNever, ChatResponse } from "@fgpt/precedent-iso";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ErrorIcon from "@mui/icons-material/Error";
import InsertCommentIcon from "@mui/icons-material/InsertComment";
import SendIcon from "@mui/icons-material/Send";
import {
  Avatar,
  Box,
  CircularProgress,
  Collapse,
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
import { useDebugChat } from "../hooks/use-debug-chat";

interface QuestionWithAnswer {
  id: string;
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

export const Chat: React.FC<{ projectId: string; token: string }> = ({
  projectId,
  token,
}) => {
  const [input, setInput] = React.useState("");
  const [qs, setQs] = React.useState<QuestionWithAnswer[]>([]);
  const { trigger: triggerDebug, responses } = useDebugChat();

  React.useEffect(() => {
    setQs([]);
  }, [projectId]);

  const { trigger, text, loading } = useAskQuestion(token, (value: string) => {
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

    const id = crypto.randomUUID();

    setQs((prev) => [
      ...prev,
      {
        id,
        question: trimmed,
        state: { type: "rendering" },
      },
    ]);

    setInput("");
    await trigger({
      projectId,
      question: trimmed,
    });

    await triggerDebug({
      id,
      projectId,
      question: trimmed,
    });
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
            {qs.map((q) => (
              <RenderQ
                key={q.id}
                q={q}
                text={text}
                responses={responses[q.id] ?? []}
              />
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
                <IconButton
                  disabled={trimmed.length === 0 || loading}
                  onClick={submit}
                >
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

const RenderQ: React.FC<{
  q: QuestionWithAnswer;
  text: string;
  responses: ChatResponse[];
}> = ({ q, text, responses }) => {
  const { user } = useUser();
  const picture = user?.picture;
  console.log({ responses });

  const ref = React.useRef<HTMLDivElement>(null);
  const current = ref.current;

  const [open, setOpen] = React.useState(false);

  const rotate = open ? "rotate(-90deg)" : "rotate(0)";

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
          position: "relative",
          flexDirection: "column",
        }}
      >
        <Box display="flex" width="100%" alignItems="center">
          <Box ref={ref} display="flex" width="56" height="40" marginRight={2}>
            <ResponseAvatar state={"data"} />
          </Box>
          {q.state.type === "rendered" && (
            <Typography color="white">{q.state.value}</Typography>
          )}
          {q.state.type === "rendering" && (
            <Typography color="white">{text}</Typography>
          )}
          {q.state.type === "rendering" && text.length === 0 && (
            <CircularProgress />
          )}
        </Box>

        {responses.length > 0 && (
          <IconButton
            onClick={() => setOpen((prev) => !prev)}
            sx={{
              position: "absolute",
              right: "35px",
            }}
          >
            <ChevronLeftIcon
              sx={{
                transform: rotate,
                transition: "all 0.2s linear",
              }}
            />
          </IconButton>
        )}

        {responses.length > 0 && (
          <Collapse
            in={open}
            timeout="auto"
            unmountOnExit
            sx={{ width: "100%", paddingLeft: 7 }}
          >
            <List disablePadding>
              {responses.map((response, index) => (
                <ListItem key={index} disableGutters>
                  <ListItemText
                    primary={`
                      Filename: ${response.filename} | Similarity score: ${response.score}`}
                    secondary={response.text}
                    primaryTypographyProps={{ color: "white" }}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
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
