import {
  assertNever,
  FileStatus,
  ProgressTaskStatus,
} from "@fgpt/precedent-iso";

export function statusForFile(statuses: ProgressTaskStatus[]): FileStatus {
  for (const status of statuses) {
    switch (status) {
      case "task_does_not_exist":
      case "queued":
      case "in-progress":
        return "pending";
      case "failed":
        return "error";
      case "succeeded":
        break;
      default:
        assertNever(status);
    }
  }
  return "ready";
}
