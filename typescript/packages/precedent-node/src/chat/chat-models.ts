import { ChatHistory } from "@fgpt/precedent-iso";
export interface ChatContextResponse {
  question: string;
  shouldGenerateName: boolean;
  forFiles: ChatFileContext[];
  history: ChatHistory[];
}

export interface ChatFileContext {
  fileName: string;
  chunks: ChatChunkContext[];
}
export interface ChatChunkContext {
  order: number;
  content: string;
}
