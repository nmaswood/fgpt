import { useCreateChat } from "../../hooks/use-create-chat";
import { useDeleteChat } from "../../hooks/use-delete-chat";
import { useEditChat } from "../../hooks/use-edit-chat";
import { useFetchChats } from "../../hooks/use-list-chats";
import { useSampleForFile } from "../../hooks/use-sample-questions";
import { DisplayChat } from "../chat";

export const DisplayFileChat: React.FC<{
  projectId: string;
  token: string;
  fileReferenceId: string;
}> = ({ projectId, token, fileReferenceId }) => {
  const {
    data: chats,
    isLoading: chatsLoading,
    mutate: refetchChats,
  } = useFetchChats("file", fileReferenceId);

  const { data: questions } = useSampleForFile(fileReferenceId);

  const { trigger: createChat, isMutating: createChatIsMutating } =
    useCreateChat("file", fileReferenceId);

  const { trigger: deleteChat, isMutating: isDeleteChatMutating } =
    useDeleteChat("file", fileReferenceId);

  const { trigger: editChat, isMutating: isEditingChatMutating } = useEditChat(
    "file",
    fileReferenceId
  );

  return (
    <DisplayChat
      chats={chats}
      chatsLoading={chatsLoading}
      token={token}
      fileReferenceId={fileReferenceId}
      projectId={projectId}
      createChat={createChat}
      deleteChat={deleteChat}
      editChat={editChat}
      isMutating={
        createChatIsMutating || isDeleteChatMutating || isEditingChatMutating
      }
      questions={questions}
      refetchChats={refetchChats}
    />
  );
};
