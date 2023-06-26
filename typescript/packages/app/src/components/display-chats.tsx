import { Chat } from "@fgpt/precedent-iso";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
} from "@mui/material";
import React from "react";
import { TransitionGroup } from "react-transition-group";

export const DisplayChatList: React.FC<{
  chats: Chat[];
  selectedChatId: string | undefined;
  setSelectedChatId: (s: string) => void;
  selectedChatIdx: number;
  createChat: (name: string) => Promise<Chat | undefined>;
  deleteChat: (name: string) => Promise<unknown>;
  isMutating: boolean;
  editChat: (args: { id: string; name: string }) => Promise<unknown>;
}> = ({
  chats,
  selectedChatId,
  setSelectedChatId,
  selectedChatIdx,
  createChat,
  deleteChat,
  isMutating,
  editChat,
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      maxHeight="100%"
      overflow="auto"
      width="100%"
      padding={2}
    >
      <Button
        startIcon={<AddIcon />}
        variant="contained"
        onClick={async () => {
          if (!selectedChatId) {
            return;
          }
          const chat = await createChat("New chat");
          if (chat) {
            setSelectedChatId(chat.id);
          }
        }}
      >
        New chat
      </Button>

      <List
        disablePadding
        sx={{ height: "100%" }}
        onKeyDown={(e) => {
          switch (e.key) {
            case "ArrowDown":
              {
                const nextChat = chats[selectedChatIdx + 1];
                if (nextChat) {
                  setSelectedChatId(nextChat.id);
                }
              }
              break;
            case "ArrowUp":
              {
                const previousChat = chats[selectedChatIdx - 1];
                if (previousChat) {
                  setSelectedChatId(previousChat.id);
                }
              }
              break;
            default:
              break;
          }
        }}
      >
        <TransitionGroup>
          {chats.map((chat) => (
            <ListItemEntry
              key={chat.id}
              chat={chat}
              selectedChatId={selectedChatId}
              setSelectedChatId={setSelectedChatId}
              isLoading={isMutating}
              onDelete={deleteChat}
              editChat={editChat}
              isMutating={isMutating}
            />
          ))}
        </TransitionGroup>
      </List>
    </Box>
  );
};

const ListItemEntry: React.FC<{
  chat: Chat;
  selectedChatId: string | undefined;
  setSelectedChatId: (s: string) => void;
  isLoading: boolean;
  onDelete: (chatId: string) => void;
  editChat: (args: { id: string; name: string }) => Promise<unknown>;
  isMutating: boolean;
}> = ({
  chat,
  selectedChatId,
  setSelectedChatId,
  isLoading: propsIsLoading,
  onDelete,
  editChat,
  isMutating,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);

  const [name, setName] = React.useState(chat.name ?? "");

  const isSelected = chat.id === selectedChatId;

  const onSubmit = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed === chat.name) {
      setIsEditing(false);
      return;
    }

    await editChat({ id: chat.id, name: trimmed });
    setIsEditing(false);
  };

  React.useEffect(() => {
    if (!isSelected) {
      setIsEditing(false);
    }
  }, [isSelected]);

  const isLoading = propsIsLoading || isMutating;

  return (
    <ListItemButton
      key={chat.id}
      selected={isSelected}
      onClick={() => setSelectedChatId(chat.id)}
    >
      <ListItem disablePadding>
        {isEditing && (
          <TextField
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
            }}
            autoFocus
            InputProps={{ sx: { padding: 0 } }}
          />
        )}
        {!isEditing && (
          <ListItemText
            primary={chat.name ?? "no name"}
            primaryTypographyProps={{ color: "white" }}
          />
        )}
        <>
          {isSelected && !isEditing && (
            <IconButton
              size="small"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <ModeEditIcon />
            </IconButton>
          )}

          {isSelected && !isEditing && (
            <IconButton
              size="small"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(chat.id);
              }}
            >
              <DeleteIcon />
            </IconButton>
          )}
          {isEditing && (
            <IconButton
              size="small"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                onSubmit();
              }}
            >
              <CheckIcon />
            </IconButton>
          )}

          {isEditing && (
            <IconButton
              size="small"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
                setName(chat.name ?? "");
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </>
      </ListItem>
    </ListItemButton>
  );
};
