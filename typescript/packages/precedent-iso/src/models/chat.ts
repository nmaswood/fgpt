export interface Chat {
  id: string;
  name: string | undefined;
}

export interface ChatEntry {
  id: string;
  question: string;
  answer: string | undefined;
}

export interface ChatResponse {
  filename: string;
  score: number;
  text: string;
}
