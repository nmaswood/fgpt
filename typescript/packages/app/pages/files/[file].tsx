import { getFileType } from "@fgpt/precedent-iso";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BoltIcon from "@mui/icons-material/Bolt";
import ConstructionIcon from "@mui/icons-material/Construction";
import GridOnIcon from "@mui/icons-material/GridOn";
import MenuIcon from "@mui/icons-material/Menu";
import { Box, IconButton, Paper, Skeleton, Tab, Tabs } from "@mui/material";
import { useRouter } from "next/router";
import React from "react";
import { z } from "zod";

import { DisplayAsset } from "../../src/components/file/display-asset";
import { DisplayExcel } from "../../src/components/file/display-excel";
import { DisplayFileChat } from "../../src/components/file/display-file-chat";
import { DisplayFileReport } from "../../src/components/file/report";
import { ViewByChunk } from "../../src/components/file/view-by-chunk";
import { useExcelInfo } from "../../src/hooks/use-fetch-excel";
import { useFetchFile } from "../../src/hooks/use-fetch-file";
import { useFetchSignedUrl } from "../../src/hooks/use-fetch-signed-url";
import { useFetchToken } from "../../src/hooks/use-fetch-token";

export default function DisplayFile() {
  const router = useRouter();

  const { data: token } = useFetchToken();
  const fileId = (() => {
    const fileId = router.query.file;
    return typeof fileId === "string" ? fileId : undefined;
  })();

  return (
    <Box display="flex" width="100%" height="100%">
      {fileId && token && <ForFileId fileId={fileId} token={token} />}
    </Box>
  );
}

const ForFileId: React.FC<{ fileId: string; token: string }> = ({
  fileId,
  token,
}) => {
  const { data: file } = useFetchFile(fileId);
  const { data: url } = useFetchSignedUrl(fileId);

  // hack to get to load faster
  const { data: excelAsset, isLoading } = useExcelInfo(fileId);

  const fileType = getFileType(file?.contentType ?? "");

  const [showAsset, setShowAsset] = React.useState(true);

  const [tab, setTab] = useTabState();

  const router = useRouter();

  return (
    <Paper
      sx={{
        display: "flex",
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        maxWidth: "100%",
      }}
    >
      {showAsset && (
        <Box display="flex" width="100%" height="100%" flexDirection="column">
          <Box display="flex" width="100%" height="auto" padding={1}>
            <IconButton onClick={() => router.back()}>
              <ArrowBackIcon />
            </IconButton>
          </Box>

          {url && showAsset && fileType ? (
            <DisplayAsset signedUrl={url} assetType={fileType} />
          ) : (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              animation={false}
            />
          )}
        </Box>
      )}
      <Box
        height="100%"
        width="100%"
        maxHeight="100%"
        maxWidth="100%"
        display="flex"
        flexDirection="column"
      >
        <Box display="flex" gap={3} paddingLeft={1}>
          <IconButton onClick={() => setShowAsset((prev) => !prev)}>
            <MenuIcon />
          </IconButton>
          <Tabs
            value={tab}
            onChange={(_, newValue) => setTab(newValue)}
            textColor="secondary"
            indicatorColor="secondary"
          >
            <Tab
              value="report"
              icon={<AssessmentIcon />}
              iconPosition="start"
              label={"Report"}
            />
            <Tab
              value="chat"
              icon={<BoltIcon />}
              iconPosition="start"
              label={"Chat"}
            />

            <Tab
              value="debug"
              icon={<ConstructionIcon />}
              iconPosition="start"
              label={"Debug"}
            />

            {(isLoading || excelAsset?.excel?.signedUrl) && (
              <Tab
                value="tables"
                icon={<GridOnIcon />}
                iconPosition="start"
                label={"Tables"}
              />
            )}
          </Tabs>
        </Box>
        <Box
          display="flex"
          width="100%"
          height="100%"
          maxHeight="100%"
          maxWidth="100%"
          flexDirection="column"
        >
          {tab === "report" && <DisplayFileReport fileReferenceId={fileId} />}
          {tab === "chat" && file && (
            <DisplayFileChat
              fileReferenceId={file.id}
              projectId={file.projectId}
              token={token}
            />
          )}

          {tab === "debug" && <ViewByChunk fileId={fileId} />}
          {tab === "tables" && (
            <DisplayExcel isLoading={isLoading} excelInfo={excelAsset} />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

const ZFileTab = z.enum(["report", "chat", "debug", "tables"]);
type FileTab = z.infer<typeof ZFileTab>;

const useTabState = () => {
  const router = useRouter();
  const [tab, setTab] = React.useState<FileTab>(() => {
    const fileTab = ZFileTab.safeParse(router.query.fileTab);
    if (fileTab.success) {
      return fileTab.data;
    }
    return "report";
  });

  React.useEffect(() => {
    if (
      router.query.fileTab === tab ||
      (router.query.fileTab === undefined && tab === "report")
    ) {
      return;
    }
    router.query.fileTab = tab;
    router.replace(router);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return [tab, setTab] as const;
};
