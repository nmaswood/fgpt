// write a component that displays the progress of a pdf download

import {
  assertNever,
  FileToRender,
  ProcessedFileProgress,
} from "@fgpt/precedent-iso";

export const DisplayProgress: React.FC<{
  file: FileToRender.File;
}> = ({ file }) => {
  return <Dispatch file={file} />;
};

const Dispatch: React.FC<{
  file: FileToRender.File;
}> = ({ file }) => {
  switch (file.type) {
    case "excel":
      return <DisplayExcelProgress />;
    case "pdf":
      return <DisplayPdfProgress progress={file.progress} />;
    default:
      assertNever(file);
  }
};

const DisplayExcelProgress: React.FC = () => {
  return null;
};

const DisplayPdfProgress: React.FC<{
  progress: ProcessedFileProgress;
}> = ({ progress }) => {
  return <pre>{JSON.stringify(progress, null, 2)}</pre>;
};
