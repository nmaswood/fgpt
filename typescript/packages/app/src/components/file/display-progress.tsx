// write a component that displays the progress of a pdf download

import {
  assertNever,
  FileProgress,
  FileToRender,
  ProgressForExcelTasks,
  ProgressForPdfTasks,
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
      return <DisplayExcelProgress progress={file.progress} />;
    case "pdf":
      return <DisplayPdfProgress progress={file.progress} />;
    default:
      assertNever(file);
  }
};

const DisplayExcelProgress: React.FC<{
  progress: FileProgress<ProgressForExcelTasks>;
}> = ({ progress }) => {
  return <pre>{JSON.stringify(progress, null, 2)}</pre>;
};

const DisplayPdfProgress: React.FC<{
  progress: FileProgress<ProgressForPdfTasks>;
}> = ({ progress }) => {
  return <pre>{JSON.stringify(progress, null, 2)}</pre>;
};
