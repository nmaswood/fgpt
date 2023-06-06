import { useUser } from "@auth0/nextjs-auth0/client";
import {
  assertNever,
  Chat,
  ChatEntry,
  ChatResponse,
} from "@fgpt/precedent-iso";
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
import { useCreateChat } from "../hooks/use-create-chat";
import { useFetchChatEntries } from "../hooks/use-fetch-chat-entry";
import { DisplayChatList } from "./display-chats";

interface EntryToRender {
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

export const DisplayChat: React.FC<{
  projectId: string;
  token: string;
  chats: Chat[];
  chatsLoading: boolean;
}> = ({ projectId, token, chats }) => {
  const [selectedChatId, setSelectedChatId] = React.useState<
    string | undefined
  >(undefined);

  const selectedChatIdx = chats.findIndex((c) => c.id === selectedChatId);

  const { data: chatEntries } = useFetchChatEntries(selectedChatId);

  const [input, setInput] = React.useState("");
  const [qs, setQs] = React.useState<EntryToRender[]>([]);

  const { trigger: createChat, isMutating: createChatIsLoading } =
    useCreateChat(projectId);

  React.useEffect(() => {
    setQs([]);
  }, [projectId, selectedChatId]);

  const {
    trigger: askQuestion,
    text,
    loading,
  } = useAskQuestion(token, (value: string) => {
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
    if (loading || createChatIsLoading) {
      return;
    }
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

    const getChatId = async () => {
      if (selectedChatId) {
        return selectedChatId;
      }
      const chat = await createChat({
        name: "New chat",
      });

      if (!chat) {
        throw new Error("chat could not be created");
      }
      return chat.id;
    };

    const chatId = await getChatId();

    setSelectedChatId(chatId);

    await askQuestion({
      projectId,
      question: trimmed,
      chatId,
    });
  };

  return (
    <Box display="flex" width="100%" height="100%">
      <DisplayChatList
        chats={chats}
        selectedChatId={selectedChatId}
        setSelectedChatId={setSelectedChatId}
        selectedChatIdx={selectedChatIdx}
        createChat={(name: string) => createChat({ name })}
        projectId={projectId}
      />
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
          {(qs.length > 0 || chatEntries.length > 0) && (
            <List sx={{ width: "100%" }}>
              {chatEntries.map((chatEntry) => (
                <RenderChatEntryFromServer
                  key={chatEntry.id}
                  chatEntry={chatEntry}
                />
              ))}
              {qs.map((q) => (
                <RenderChatEntryFromClient
                  key={q.id}
                  q={q}
                  text={text}
                  responses={[]}
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
                    disabled={
                      trimmed.length === 0 || loading || createChatIsLoading
                    }
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
        </Box>
      </Box>
    </Box>
  );
};

const RenderChatEntryFromServer: React.FC<{
  chatEntry: ChatEntry;
}> = ({ chatEntry }) => {
  const { user } = useUser();
  const picture = user?.picture;

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
          primary={chatEntry.question}
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
          <Box display="flex" width="56" height="40" marginRight={2}>
            <ResponseAvatar state={"data"} />
          </Box>
          <Typography color="white">{chatEntry.answer}</Typography>
        </Box>
      </ListItem>
    </>
  );
};

const RenderChatEntryFromClient: React.FC<{
  q: EntryToRender;
  text: string;
  responses: ChatResponse[];
}> = ({ q, text, responses }) => {
  const { user } = useUser();
  const picture = user?.picture;

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
