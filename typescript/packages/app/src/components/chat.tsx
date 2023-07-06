import { useUser } from "@auth0/nextjs-auth0/client";
import { assertNever, Chat, ChatEntry } from "@fgpt/precedent-iso";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ErrorIcon from "@mui/icons-material/Error";
import InsertCommentIcon from "@mui/icons-material/InsertComment";
import SendIcon from "@mui/icons-material/Send";
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  Input,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  Table,
  Typography,
} from "@mui/joy";
import { Collapse } from "@mui/material";
import NextLink from "next/link";
import React from "react";

import { useAskQuestion } from "../hooks/use-ask-question";
import { useFetchContext } from "../hooks/use-context-chat";
import { useFetchChatEntries } from "../hooks/use-fetch-chat-entry";
import { DisplayChatList } from "./display-chats";

interface EntryToRender {
  id: string;
  question: string;
  chatId: string;
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
  fileReferenceId?: string;
  createChat: (args: { name: string | undefined }) => Promise<Chat | undefined>;
  deleteChat: (args: { id: string }) => Promise<string | undefined>;
  editChat: (args: { id: string; name: string }) => Promise<unknown>;
  isMutating: boolean;
  questions: string[];
  refetchChats: () => Promise<unknown>;
}> = ({
  projectId,
  token,
  chats,
  fileReferenceId,
  isMutating,
  createChat,
  deleteChat,
  editChat,
  questions,
  refetchChats,
}) => {
  const [selectedChatId, setSelectedChatId] = React.useState<
    string | undefined
  >(undefined);

  const selectedChatIdx = chats.findIndex((c) => c.id === selectedChatId);

  const { data: chatEntries } = useFetchChatEntries(selectedChatId);

  const [input, setInput] = React.useState("");
  const [entriesToRender, setEntriesToRender] = React.useState<EntryToRender[]>(
    []
  );

  React.useEffect(() => {
    setSelectedChatId(undefined);
  }, [projectId, fileReferenceId]);

  const filtered = (() => {
    if (!selectedChatId) {
      return [];
    }
    const filteredEntries = entriesToRender.filter(
      (e) => e.chatId === selectedChatId
    );

    const final = filteredEntries.filter(
      (e, idx) => chatEntries[idx]?.question !== e.question
    );
    return final;
  })();

  const onDelete = async (id: string) => {
    await deleteChat({ id });
    if (id === selectedChatId) {
      setSelectedChatId(undefined);
    }
  };

  const {
    trigger: askQuestion,
    text,
    loading,
  } = useAskQuestion(token, ({ answer, shouldRefresh }) => {
    setEntriesToRender((qs) => {
      if (shouldRefresh) {
        refetchChats();
      }

      const last = qs[qs.length - 1];
      if (!last || last.state.type !== "rendering") {
        return qs;
      }

      return qs.slice(0, -1).concat([
        {
          ...last,
          state: {
            type: "rendered",
            value: answer,
          },
        },
      ]);
    });
  });

  const trimmed = input.trim();

  const submit = async (question?: string) => {
    if (loading || isMutating) {
      return;
    }
    const trimmed = question ?? input.trim();
    if (!trimmed.length) {
      return;
    }

    const id = crypto.randomUUID();

    const getChatId = async () => {
      if (selectedChatId) {
        return selectedChatId;
      }
      const chat = await createChat({
        name: undefined,
      });

      if (!chat) {
        throw new Error("chat could not be created");
      }
      return chat.id;
    };

    const chatId = await getChatId();

    setSelectedChatId(chatId);

    setEntriesToRender((prev) => [
      ...prev,
      {
        id,
        chatId,
        question: trimmed,
        state: { type: "rendering" },
      },
    ]);

    setInput("");

    await askQuestion({
      projectId,
      question: trimmed,
      chatId,
    });
  };

  return (
    <Box
      display="flex"
      width="100%"
      height="100%"
      maxHeight="100%"
      overflow="auto"
    >
      <Box
        display="grid"
        width="400px"
        height="100%"
        overflow="auto"
        maxHeight="100%"
      >
        <DisplayChatList
          chats={chats}
          selectedChatId={selectedChatId}
          setSelectedChatId={setSelectedChatId}
          selectedChatIdx={selectedChatIdx}
          createChat={(name?: string) => createChat({ name })}
          isMutating={isMutating}
          loading={loading}
          deleteChat={onDelete}
          editChat={editChat}
        />
      </Box>
      <Box
        display="flex"
        width="100%"
        height="100%"
        flexDirection="column"
        gap={2}
      >
        {questions.length > 0 && (
          <DisplayQuestions
            questions={questions}
            disabled={isMutating || loading}
            askQuestion={(question: string) => submit(question)}
          />
        )}
        <Box
          display="flex"
          width="100%"
          height="100%"
          maxHeight="100%"
          overflow="auto"
        >
          {(filtered.length > 0 || chatEntries.length > 0) && (
            <List sx={{ width: "100%" }}>
              {chatEntries.map((chatEntry) => (
                <RenderChatEntryFromServer
                  key={chatEntry.id}
                  chatEntry={chatEntry}
                />
              ))}
              {filtered.map((q) => (
                <RenderChatEntryFromClient key={q.id} q={q} text={text} />
              ))}
            </List>
          )}
        </Box>
        <Box
          display="flex"
          width="100%"
          paddingBottom={10}
          position="sticky"
          bottom={0}
        >
          <Input
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
            endDecorator={
              <IconButton
                disabled={trimmed.length === 0 || loading || isMutating}
                onClick={() => submit()}
              >
                <SendIcon
                  sx={{
                    transform: "rotate(-45deg) scale(0.8)",
                    paddingBottom: 1,
                  }}
                />
              </IconButton>
            }
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

  const [open, setOpen] = React.useState(false);
  const rotate = open ? "rotate(-90deg)" : "rotate(0)";

  return (
    <>
      <UserAvatarWithResponse
        text={chatEntry.question}
        picture={picture ?? undefined}
      />

      <ListItem
        sx={{
          display: "flex",
          position: "relative",
          flexDirection: "column",
        }}
      >
        <Box display="flex" width="100%" flexDirection="column">
          <Box display="flex" width="100%" alignItems="center">
            <Box display="flex" width="56" height="40" marginRight={2}>
              <ResponseAvatar state={"data"} />
            </Box>
            <Typography sx={{ whiteSpace: "pre-line" }}>
              {chatEntry.answer}
            </Typography>
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
          </Box>
          <Collapse
            in={open}
            timeout="auto"
            unmountOnExit
            sx={{ width: "100%", paddingLeft: 7 }}
          >
            <DisplayContextForId id={chatEntry.id} />
          </Collapse>
        </Box>
      </ListItem>
    </>
  );
};

const DisplayContextForId: React.FC<{ id: string }> = ({ id }) => {
  const { data } = useFetchContext(id);
  return (
    <>
      {data.length > 0 && (
        <Table aria-label="simple table">
          <thead>
            <tr>
              <th align="left">Filename</th>
              <th align="right">Score</th>
              <th align="left">Content</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td align="left">
                  <Link component={NextLink} href={`files/${row.fileId}`}>
                    <Typography>{row.filename}</Typography>
                  </Link>
                </td>
                <td align="right">{row.score}</td>
                <td align="left">{row.text}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

const RenderChatEntryFromClient: React.FC<{
  q: EntryToRender;
  text: string;
}> = ({ q, text }) => {
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
      <UserAvatarWithResponse
        text={q.question}
        picture={picture ?? undefined}
      />

      <ListItem
        sx={{
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
            <Typography sx={{ whiteSpace: "pre-line" }}>
              {q.state.value}
            </Typography>
          )}
          {q.state.type === "rendering" && (
            <Typography sx={{ whiteSpace: "pre-line" }}>{text}</Typography>
          )}

          {q.state.type === "rendering" && text.length === 0 && (
            <CircularProgress />
          )}
        </Box>
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
        <Avatar color="primary">
          <InsertCommentIcon color="primary" />
        </Avatar>
      );
    default:
      assertNever(state);
  }
};

const DisplayQuestions: React.FC<{
  questions: string[];
  askQuestion: (question: string) => void;
  disabled: boolean;
}> = ({ questions, askQuestion, disabled }) => {
  return (
    <Box display="flex" width="100%" maxHeight="120px" overflow="auto">
      <List>
        {questions.map((question, idx) => {
          return (
            <ListItemButton
              key={idx}
              disabled={disabled}
              onClick={() => askQuestion(question)}
            >
              <ListItem>
                <ListItemContent>{question}</ListItemContent>
              </ListItem>
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
};

const UserAvatarWithResponse: React.FC<{
  picture: string | undefined;
  text: string;
}> = ({ picture, text }) => {
  return (
    <ListItem
      sx={{
        display: "flex",
        gap: 2,
      }}
    >
      {picture && (
        <ListItemDecorator>
          <Avatar src={picture} />
        </ListItemDecorator>
      )}
      <ListItemContent>{text}</ListItemContent>
    </ListItem>
  );
};
