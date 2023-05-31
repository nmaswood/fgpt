import { Report } from "@fgpt/precedent-iso";
import AddIcon from "@mui/icons-material/Add";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";

import { useCreateReport } from "../hooks/use-create-report";
import { useListReports } from "../hooks/use-list-reports";

export const DisplayReports: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const [modal, setModal] = React.useState(false);
  const closeModal = () => setModal(false);
  const { data, isLoading } = useListReports(projectId);
  console.log(data);
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
            Generate report
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
              Generate report
            </Button>
            <ForReports reports={data} />
          </Box>
        )}
      </Box>
      {modal && (
        <CreateReportModal
          projectId={projectId}
          closeModal={closeModal}
          reports={data}
        />
      )}
    </>
  );
};

const CreateReportModal: React.FC<{
  closeModal: () => void;
  projectId: string;
  reports: Report[];
}> = ({ closeModal, projectId, reports }) => {
  const [text, setText] = React.useState("");
  const { trigger, isMutating } = useCreateReport(projectId);
  const trimmed = text.trim();

  const reportNames = React.useMemo(
    () => new Set(reports.map((r) => r.name)),
    [reports]
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
      <DialogTitle>Create a new report</DialogTitle>
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
              disabled={
                trimmed.length <= 3 || isMutating || reportNames.has(trimmed)
              }
              onClick={async () => {
                await trigger({
                  name: trimmed,
                  projectId,
                  additionalItems: [],
                });
                closeModal();
              }}
            >
              Create report
            </LoadingButton>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

const ForReports: React.FC<{ reports: Report[] }> = ({ reports }) => {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {reports.map((report) => (
        <ForReport key={report.id} report={report} />
      ))}
    </Box>
  );
};

const ForReport: React.FC<{ report: Report }> = ({ report }) => {
  return (
    <Box display="flex">
      <Typography variant="body1" color="white">
        {report.name}
      </Typography>
    </Box>
  );
};
