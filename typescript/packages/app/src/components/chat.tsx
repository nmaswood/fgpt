import { useUser } from "@auth0/nextjs-auth0/client";

import InsertCommentIcon from "@mui/icons-material/InsertComment";

import SendIcon from "@mui/icons-material/Send";
import ErrorIcon from "@mui/icons-material/Error";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Tab,
  Tabs,
  TextField,
  CircularProgress,
  Typography,
  Collapse,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

import React from "react";
import { useAskQuestion } from "../hooks/use-ask-question";
import { assertNever } from "@fgpt/precedent-iso";

interface QuestionWithAnswer {
  question: string;
  state:
    | {
        type: "loading";
      }
    | {
        type: "error";
        error: string;
      }
    | {
        type: "data";
        answer: string;
        context: string[];
      };
}

export const Chat: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [input, setInput] = React.useState("");
  const [qs, setQs] = React.useState<QuestionWithAnswer[]>([]);

  const { isMutating, data, trigger } = useAskQuestion();

  const trimmed = input.trim();

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed.length) {
      return;
    }

    const withNewItem = Array.from(qs);
    withNewItem.push({ question: trimmed, state: { type: "loading" } });

    setQs(withNewItem);

    const copy = Array.from(withNewItem);

    try {
      const res = await trigger({
        projectId,
        question: trimmed,
      });

      if (!res) {
        throw new Error("illegal state");
      }

      copy[withNewItem.length - 1] = {
        question: trimmed,
        state: {
          type: "data",
          answer: res.answer,
          context: res.context,
        },
      };
    } catch (e) {
      copy[withNewItem.length - 1] = {
        question: trimmed,
        state: {
          type: "error",
          error: "Something went wrong. Please try again.",
        },
      };
    }

    setQs(copy);
    setInput("");
  };
  console.log({ qs });

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
              <RenderQ key={index} q={q} />
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
                  disabled={trimmed.length === 0 || isMutating}
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

const RenderQ: React.FC<{ q: QuestionWithAnswer }> = ({ q }) => {
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
        <Box display="flex" width="56" height="40" marginRight={2}>
          <ResponseAvatar state={q.state.type} />
        </Box>

        <ResponseContent val={q.state} />
      </ListItem>
    </>
  );
};

const ResponseAvatar: React.FC<{ state: "loading" | "error" | "data" }> = ({
  state,
}) => {
  switch (state) {
    case "loading":
      return (
        <Box display="flex" justifyContent="center" padding={1}>
          <CircularProgress size="2rem" />
        </Box>
      );
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
        <Avatar variant="rounded" color="secondary">
          <InsertCommentIcon color="secondary" />
        </Avatar>
      );
    default:
      assertNever(state);
  }
};

const ResponseContent: React.FC<{ val: QuestionWithAnswer["state"] }> = ({
  val,
}) => {
  const [open, setOpen] = React.useState(false);

  const rotate = open ? "rotate(-90deg)" : "rotate(0)";

  switch (val.type) {
    case "loading":
      return null;
    case "error":
      return <Typography color="error">An error has occured</Typography>;

    case "data":
      return (
        <Box
          display="flex"
          position="relative"
          width="100%"
          height="100%"
          flexDirection="column"
        >
          <Box
            display="flex"
            position="relative"
            width="100%"
            height="100%"
            alignItems="center"
          >
            <Typography color="secondary">{val.answer}</Typography>
            {val.context.length > 0 && (
              <IconButton
                onClick={() => setOpen((prev) => !prev)}
                sx={{
                  position: "absolute",
                  right: 0,
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
          </Box>

          {val.context.length > 0 && (
            <Collapse in={open} timeout="auto" unmountOnExit>
              <List disablePadding>
                {val.context.map((c, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemText
                      primary={c}
                      primaryTypographyProps={{ color: "white" }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          )}
        </Box>
      );
    default:
      assertNever(val);
  }
};
