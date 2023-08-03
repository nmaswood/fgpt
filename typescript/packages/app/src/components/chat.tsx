import { useUser } from "@auth0/nextjs-auth0/client";
import { assertNever, Chat, ChatEntry } from "@fgpt/precedent-iso";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeftOutlined";
import ErrorIcon from "@mui/icons-material/ErrorOutlined";
import SendIcon from "@mui/icons-material/SendOutlined";
import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Input,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  Typography,
} from "@mui/joy";
import Image from "next/image";
import React from "react";

import { useAskQuestion } from "../hooks/use-ask-question";
import { useFetchChatEntries } from "../hooks/use-fetch-chat-entry";
import { useFetchMe } from "../hooks/use-fetch-me";
import { useFetchPrompt } from "../hooks/use-fetch-prompt";
import { DisplayChatList } from "./display-chats";
import { DangerousHTMLElementChat } from "./html-element";

interface EntryToRender {
  index: number;
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

type EntriesByChatId = Record<string, EntryToRender>;

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

  const { data: chatEntries, mutate: refreshChatEntry } =
    useFetchChatEntries(selectedChatId);

  const [input, setInput] = React.useState("");
  const [entriesByChatId, setEntriesByChatId] = React.useState<EntriesByChatId>(
    {},
  );

  React.useEffect(() => {
    if (!chatEntries.length || !selectedChatId) {
      return;
    }
    setEntriesByChatId((prev) => {
      const clone = structuredClone(prev);
      delete clone[selectedChatId];
      return clone;
    });
  }, [chatEntries, selectedChatId]);

  React.useEffect(() => {
    setSelectedChatId(undefined);
  }, [projectId, fileReferenceId]);

  const entryToRender = (() => {
    const forChatId = selectedChatId
      ? entriesByChatId[selectedChatId]
      : undefined;
    if (!forChatId) {
      return undefined;
    }

    const hasFromServer = chatEntries.some(
      (ce) => ce.index === forChatId.index,
    );
    return hasFromServer ? undefined : forChatId;
  })();

  const onDelete = React.useCallback(
    async (id: string) => {
      await deleteChat({ id });
      if (id === selectedChatId) {
        setSelectedChatId(undefined);
      }
    },
    [deleteChat, selectedChatId],
  );

  const {
    trigger: askQuestion,
    text,
    loading,
  } = useAskQuestion(token, ({ answer, shouldRefresh, chatId }) => {
    refreshChatEntry();
    setEntriesByChatId((prev) => {
      if (shouldRefresh) {
        refetchChats();
      }
      refreshChatEntry();

      const lastEntry = prev[chatId];
      if (!lastEntry) {
        return prev;
      }

      const copy = structuredClone(prev);
      copy[chatId] = {
        ...lastEntry,
        state: {
          type: "rendered",
          value: answer,
        },
      };
      return copy;
    });
  });

  const trimmed = input.trim();

  const submit = async (question: string) => {
    if (loading || isMutating) {
      return;
    }
    const trimmed = question.trim();
    if (!trimmed.length) {
      return;
    }

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
    // server indexes at 1 ... FOOT GUN!

    const index =
      chatEntries.length === 0
        ? 1
        : Math.max(...chatEntries.map((e) => e.index)) + 1;

    setEntriesByChatId((prev) => {
      const copy = structuredClone(prev);
      copy[chatId] = {
        index,
        question: trimmed,
        state: { type: "rendering" },
      };
      return copy;
    });

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
        width="300px"
        height="100%"
        overflow="auto"
        maxHeight="100%"
        padding={2}
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
        paddingY={2}
        paddingRight={2}
      >
        {questions.length > 0 && (
          <DisplayQuestions
            questions={questions}
            disabled={isMutating || loading}
            askQuestion={submit}
          />
        )}
        <Box
          display="flex"
          width="100%"
          height="100%"
          maxHeight="100%"
          overflow="auto"
          bgcolor="neutral.0"
          borderRadius={8}
        >
          {(entryToRender || chatEntries.length > 0) && (
            <List sx={{ width: "100%" }}>
              {chatEntries.map((chatEntry) => (
                <React.Fragment key={chatEntry.id}>
                  <RenderChatEntryFromServer
                    key={chatEntry.id}
                    chatEntry={chatEntry}
                  />

                  <Divider />
                </React.Fragment>
              ))}
              {entryToRender && (
                <RenderChatEntryFromClient q={entryToRender} text={text} />
              )}
            </List>
          )}
        </Box>
        <Box display="flex" width="100%" position="sticky" bottom={0}>
          <Input
            size="sm"
            placeholder="Send a message..."
            fullWidth
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            onKeyPress={(ev) => {
              if (ev.key === "Enter") {
                submit(input);
                ev.preventDefault();
              }
            }}
            endDecorator={
              <IconButton
                size="sm"
                variant="plain"
                sx={{
                  ":hover": {
                    bgcolor: "transparent",
                  },
                }}
                disabled={trimmed.length === 0 || loading || isMutating}
                onClick={() => submit(input)}
              >
                <SendIcon fontSize="small" />
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
  const { data: me } = useFetchMe();
  const picture = user?.picture;

  const [open, setOpen] = React.useState(false);

  return (
    <>
      <UserAvatarWithResponse
        text={chatEntry.question}
        picture={picture ?? undefined}
      />
      <Divider />

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

            {chatEntry.html ? (
              <DangerousHTMLElementChat html={chatEntry.html} />
            ) : (
              <Typography level="body-sm" sx={{ whiteSpace: "pre-line" }}>
                {chatEntry.answer}
              </Typography>
            )}

            {me && me.role === "superadmin" && (
              <IconButton
                onClick={() => setOpen((prev) => !prev)}
                sx={{
                  position: "absolute",
                  right: "35px",
                }}
              >
                <ChevronLeftIcon
                  sx={{
                    transform: open ? "rotate(-90deg)" : "rotate(0)",
                    transition: "all 0.2s linear",
                  }}
                />
              </IconButton>
            )}
          </Box>

          {open && <DisplayPrompt id={chatEntry.id} />}
        </Box>
      </ListItem>
    </>
  );
};

const DisplayPrompt: React.FC<{ id: string }> = ({ id }) => {
  const { data } = useFetchPrompt(id);
  return <Typography whiteSpace="pre-wrap">{data}</Typography>;
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

      <Divider />

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
            <Typography level="body-sm" sx={{ whiteSpace: "pre-line" }}>
              {q.state.value}
            </Typography>
          )}
          {q.state.type === "rendering" && (
            <Typography level="body-sm" sx={{ whiteSpace: "pre-line" }}>
              {text}
            </Typography>
          )}

          {q.state.type === "rendering" && text.length === 0 && (
            <CircularProgress size="sm" />
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
        <Avatar
          sx={{
            bgcolor: "primary.500",
          }}
        >
          <Image
            priority
            src="/paredo-icon.svg"
            height={18}
            width={18}
            alt="Paredo icon"
          />
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
    <Box
      display="flex"
      width="100%"
      maxHeight="120px"
      overflow="auto"
      borderRadius={8}
      bgcolor="neutral.0"
      sx={(theme) => ({
        border: `1px solid ${theme.vars.palette.neutral[100]}`,
      })}
    >
      <List size="sm">
        {questions.map((question, idx) => {
          return (
            <ListItemButton
              key={idx}
              disabled={disabled}
              onClick={() => askQuestion(question)}
            >
              <ListItemDecorator>
                <SendIcon fontSize="small" color="primary" />
              </ListItemDecorator>
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
      <ListItemContent>
        <Typography level="body-sm">{text}</Typography>
      </ListItemContent>
    </ListItem>
  );
};
