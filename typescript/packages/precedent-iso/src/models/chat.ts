export interface Chat {
  id: string;
  name: string | undefined;
  fileReferenceId: string | undefined;
  entryCount: number;
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
