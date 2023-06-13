export interface Chat {
  id: string;
  name: string | undefined;
  fileReferenceId: string | undefined;
}

export interface ChatEntry {
  id: string;
  question: string;
  answer: string | undefined;
}

export interface ChatResponse {
  text: string;
}

export interface ChatHistory {
  question: string;
}

export interface ChatContext {
  fileId: string;
  filename: string;
  score: number;
  text: string;
}
