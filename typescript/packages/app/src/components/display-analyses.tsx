import { Analysis } from "@fgpt/precedent-iso";
import AddIcon from "@mui/icons-material/Add";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";

import { useCreateAnalysis } from "../hooks/use-create-analyses";
import { useListAnalyses } from "../hooks/use-list-analyses";

export const DisplayAnalyses: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const [modal, setModal] = React.useState(false);
  const closeModal = () => setModal(false);
  const { data, isLoading } = useListAnalyses(projectId);
  return (
    <>
      <Box
        display="flex"
        width="100%"
        height="100%"
        alignItems="center"
        justifyContent="center"
      >
        {!isLoading && !data.length && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => {
              setModal(true);
            }}
          >
            Generate analysis
          </Button>
        )}
        {data.length > 0 && (
          <Box
            display="flex"
            width="100%"
            height="100%"
            gap={2}
            flexDirection="column"
            padding={2}
          >
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => {
                setModal(true);
              }}
              sx={{
                height: "fit-content",
                width: "fit-content",
              }}
            >
              Generate analysis
            </Button>
            <ForAnalyses analyses={data} />
          </Box>
        )}
      </Box>
      {modal && (
        <CreateAnalysisModal
          projectId={projectId}
          closeModal={closeModal}
          analyses={data}
        />
      )}
    </>
  );
};

const CreateAnalysisModal: React.FC<{
  closeModal: () => void;
  projectId: string;
  analyses: Analysis[];
}> = ({ closeModal, projectId, analyses }) => {
  const [text, setText] = React.useState("");
  const { trigger, isMutating } = useCreateAnalysis(projectId);
  const trimmed = text.trim();

  const names = React.useMemo(
    () => new Set(analyses.map((r) => r.name)),
    [analyses]
  );
  return (
    <Dialog
      open
      onClose={closeModal}
      keepMounted
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: "350px !important",
        },
      }}
    >
      <DialogTitle>Create a new analysis</DialogTitle>
      <DialogActions>
        <Box
          display="flex"
          width="100%"
          height="100%"
          flexDirection="column"
          gap={3}
        >
          <TextField
            label="New name"
            variant="outlined"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            autoFocus
          />

          <Box display="flex" justifyContent="flex-end">
            <Button onClick={closeModal} color="primary">
              Cancel
            </Button>
            <LoadingButton
              variant="contained"
              color="secondary"
              disabled={trimmed.length <= 3 || isMutating || names.has(trimmed)}
              onClick={async () => {
                await trigger({
                  name: trimmed,
                  projectId,
                  additionalItems: [],
                });
                closeModal();
              }}
            >
              Create analysis
            </LoadingButton>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

const ForAnalyses: React.FC<{ analyses: Analysis[] }> = ({ analyses }) => {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {analyses.map((analysis) => (
        <ForAnalysis key={analysis.id} analysis={analysis} />
      ))}
    </Box>
  );
};

const ForAnalysis: React.FC<{ analysis: Analysis }> = ({ analysis }) => {
  //const [isOpen, setIsOpen] = React.useState(false);
  return (
    <Box display="flex">
      <Typography variant="body1" color="white">
        {analysis.name}
      </Typography>
    </Box>
  );
};
