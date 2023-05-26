export interface ChatResponse {
  answer: string;
  context: ContextUnit[];
}

export interface ContextUnit {
  score: number;
  text: string;
}
