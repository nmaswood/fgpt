import { Chat } from "@fgpt/precedent-iso";
import AddIcon from "@mui/icons-material/AddOutlined";
import CheckIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/CloseOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import ModeEditIcon from "@mui/icons-material/ModeEditOutlined";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Input,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
} from "@mui/joy";
import React from "react";

export const DisplayChatList: React.FC<{
  chats: Chat[];
  selectedChatId: string | undefined;
  setSelectedChatId: (s: string) => void;
  selectedChatIdx: number;
  createChat: (name: string | undefined) => Promise<Chat | undefined>;
  deleteChat: (name: string) => Promise<unknown>;
  isMutating: boolean;
  loading: boolean;
  editChat: (args: { id: string; name: string }) => Promise<unknown>;
}> = ({
  chats,
  selectedChatId,
  setSelectedChatId,
  selectedChatIdx,
  createChat,
  deleteChat,
  isMutating,
  loading,
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
      sx={(theme) => ({
        border: `1px solid ${theme.vars.palette.neutral[100]}`,
        borderRadius: 8,
      })}
    >
      <Button
        sx={{
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderRadius: 0,
        }}
        loading={isMutating}
        startDecorator={<AddIcon />}
        onClick={async () => {
          if (!selectedChatId) {
            return;
          }
          const chat = await createChat(undefined);
          if (chat) {
            setSelectedChatId(chat.id);
          }
        }}
      >
        New chat
      </Button>
      <Divider />

      <List
        sx={{ height: "100%", maxHeight: "100%", overflow: "auto" }}
        size="sm"
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
            loading={loading}
          />
        ))}
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
  loading: boolean;
}> = ({
  chat,
  selectedChatId,
  setSelectedChatId,
  isLoading: propsIsLoading,
  onDelete,
  editChat,
  isMutating,
  loading,
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

  const waitingForTitle = loading && !chat.name && isSelected;

  return (
    <ListItem
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      {waitingForTitle && (
        <Box display="flex" width="100%" justifyContent="center">
          <CircularProgress />
        </Box>
      )}
      {!waitingForTitle && (
        <ListItemButton
          key={chat.id}
          selected={isSelected}
          onClick={() => setSelectedChatId(chat.id)}
          sx={{
            gap: 1 / 2,
          }}
        >
          {isEditing && (
            <Input
              size="sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              autoFocus
            />
          )}
          {!isEditing && <ListItemContent>{chat.name}</ListItemContent>}
          {isSelected && !isEditing && (
            <IconButton
              size="sm"
              variant="plain"
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
              size="sm"
              variant="plain"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(chat.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          {isEditing && (
            <IconButton
              size="sm"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                onSubmit();
              }}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          )}

          {isEditing && (
            <IconButton
              size="sm"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
                setName(chat.name ?? "");
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </ListItemButton>
      )}
    </ListItem>
  );
};
