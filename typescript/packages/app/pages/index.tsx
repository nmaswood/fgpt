import { withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { assertNever } from "@fgpt/precedent-iso";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Input,
  Modal,
  ModalDialog,
  Typography,
} from "@mui/joy";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";

import { DisplayProjects } from "../src/components/display-projects";
import { Navbar } from "../src/components/navbar";
import { useCreateProject } from "../src/hooks/use-create-project";
import { useDeleteProject } from "../src/hooks/use-delete-project";
import { useEditProject } from "../src/hooks/use-edit-project";
import { useFetchMe } from "../src/hooks/use-fetch-me";
import { useFetchProjects } from "../src/hooks/use-fetch-projects";

const Index: React.FC = () => {
  const router = useRouter();
  const { data: projects, isLoading: projectsLoading } = useFetchProjects();
  const { data: user, isLoading: userIsLoading } = useFetchMe();
  const status = user?.status;

  React.useEffect(() => {
    if (status === "inactive") {
      router.push("/inactive");
    }
  }, [router, status]);

  const [modal, setModal] = React.useState<
    | { type: "create" | "closed" }
    | {
        type: "delete" | "edit";
        projectId: string;
        projectName: string;
      }
  >({ type: "closed" });
  const closeModal = () => setModal({ type: "closed" });
  const { trigger, isMutating } = useCreateProject();

  const projectNames = React.useMemo(
    () => new Set(projects.map((p) => p.name)),
    [projects],
  );

  return (
    <Box
      display="flex"
      height="100%"
      width="100%"
      maxHeight="100%"
      maxWidth="100%"
      overflow="auto"
      flexDirection="column"
      bgcolor="background.body"
    >
      <Navbar loading={false} />
      {userIsLoading && (
        <Box
          display="flex"
          width="100%"
          height="100%"
          justifyContent="center"
          alignItems="center"
        >
          <CircularProgress />
        </Box>
      )}

      {user && user.status === "active" && (
        <DisplayProjects
          openCreateProjects={() => setModal({ type: "create" })}
          projectsLoading={projectsLoading}
          setEditingProject={(projectId: string, projectName: string) =>
            setModal({
              type: "edit",
              projectId,
              projectName,
            })
          }
          setDeletingProject={(projectId: string, projectName: string) =>
            setModal({
              type: "delete",
              projectId,
              projectName,
            })
          }
          projects={projects}
        />
      )}
      {modal.type === "create" && (
        <CreateProjectModal
          onClose={closeModal}
          projectNames={projectNames}
          onCreate={async (name: string) => {
            const newlyCreatedProject = await trigger({ name });
            if (newlyCreatedProject) {
              router.push(`/projects/${newlyCreatedProject.id}`);
            }
            closeModal();
          }}
          loading={isMutating}
        />
      )}
      {modal.type === "delete" && (
        <DeleteProjectModal
          projectId={modal.projectId}
          closeModal={closeModal}
        />
      )}
      {modal.type === "edit" && (
        <EditProjectModal
          projectId={modal.projectId}
          projectName={modal.projectName}
          closeModal={closeModal}
          projectNames={projectNames}
        />
      )}
    </Box>
  );
};

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 255;

const validate =
  (projectNames: Set<string>) =>
  (name: string): InputError | undefined => {
    if (name.length < NAME_MIN_LENGTH) {
      return "too_short";
    } else if (name.length > NAME_MAX_LENGTH) {
      return "too_long";
    } else if (projectNames.has(name)) {
      return "already_exists";
    }
    return undefined;
  };

function errorDisplayName(error: InputError) {
  switch (error) {
    case "too_short":
      return "Name is too short";
    case "too_long":
      return "Name is too long";
    case "already_exists":
      return "Name already exists";
    default:
      assertNever(error);
  }
}

type InputError = "too_long" | "too_short" | "already_exists";

const CreateProjectModal: React.FC<{
  onClose: () => void;
  projectNames: Set<string>;
  onCreate: (name: string) => Promise<void>;
  loading: boolean;
}> = ({ onClose, projectNames, onCreate, loading }) => {
  const [error, setError] = React.useState<InputError | undefined>(undefined);
  const [name, setName] = React.useState("");

  const onSubmit = async () => {
    const trimmed = name.trim();
    const inputError = validate(projectNames)(trimmed);
    if (inputError) {
      setError(inputError);
      return;
    }

    await onCreate(trimmed);
  };

  return (
    <Modal open onClose={onClose} keepMounted>
      <ModalDialog>
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography level="body-md">Add a deal</Typography>
          <Input
            autoFocus
            id="name"
            type="text"
            color="primary"
            value={name}
            onChange={(e) => {
              if (error) {
                setError(undefined);
              }
              setName(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
            }}
            fullWidth
          />
          <ButtonGroup spacing={1}>
            <Button disabled={loading} onClick={onClose}>
              Cancel
            </Button>
            <Button
              loading={loading}
              onClick={onSubmit}
              variant="solid"
              color="primary"
              disabled={name.length === 0}
            >
              Create deal
            </Button>
          </ButtonGroup>
          {error && (
            <Alert variant="soft" size="sm" color="warning">
              {errorDisplayName(error)}
            </Alert>
          )}
        </Box>
      </ModalDialog>
    </Modal>
  );
};

const EditProjectModal: React.FC<{
  closeModal: () => void;
  projectId: string;
  projectName: string;
  projectNames: Set<string>;
}> = ({ closeModal, projectName, projectId, projectNames }) => {
  const [text, setText] = React.useState(projectName);
  const [error, setError] = React.useState<InputError | undefined>(undefined);
  const { trigger, isMutating } = useEditProject();
  const trimmed = text.trim();

  const onSubmit = async () => {
    const error = validate(projectNames)(trimmed);
    if (error) {
      setError(error);
      return;
    }

    await trigger({
      id: projectId,
      name: trimmed,
    });
    closeModal();
  };

  return (
    <Modal open onClose={closeModal} keepMounted>
      <ModalDialog
        sx={{
          display: "flex",
          gap: 1,
        }}
      >
        <Typography level="body-md">Edit deal name</Typography>
        <Box
          display="flex"
          width="100%"
          height="100%"
          flexDirection="column"
          gap={1}
          position="relative"
        >
          <Input
            value={text}
            onChange={(e) => {
              if (error) {
                setError(undefined);
              }
              setText(e.target.value);
            }}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                await onSubmit();
              }
            }}
            autoFocus
          />

          <ButtonGroup spacing={1}>
            <Button onClick={closeModal} color="primary">
              Cancel
            </Button>
            <Button
              disabled={trimmed === projectName || trimmed.length === 0}
              color="primary"
              variant="solid"
              onClick={async () => {
                await onSubmit();
              }}
              loading={isMutating}
            >
              Change name
            </Button>
          </ButtonGroup>
          {error && (
            <Alert variant="soft" size="sm" color="warning">
              {errorDisplayName(error)}
            </Alert>
          )}
        </Box>
      </ModalDialog>
    </Modal>
  );
};

const DeleteProjectModal: React.FC<{
  projectId: string;
  closeModal: () => void;
}> = ({ closeModal, projectId }) => {
  const { trigger, isMutating } = useDeleteProject();
  const [text, setText] = React.useState("");

  return (
    <Modal open onClose={closeModal}>
      <ModalDialog
        sx={{
          display: "flex",
          gap: 1,
        }}
      >
        <Typography level="body-md">Delete deal</Typography>
        <Box
          display="flex"
          width="100%"
          height="100%"
          flexDirection="column"
          gap={1}
        >
          <Input
            placeholder="Type DELETE to confirm"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            autoFocus
          />
          <ButtonGroup spacing={1}>
            <Button onClick={closeModal} color="primary">
              Cancel
            </Button>
            <Button
              loading={isMutating}
              disabled={text !== "DELETE"}
              onClick={async () => {
                await trigger({ id: projectId });
                closeModal();
              }}
              color="danger"
            >
              Delete deal
            </Button>
          </ButtonGroup>
        </Box>
      </ModalDialog>
    </Modal>
  );
};

export default withPageAuthRequired(Index);
