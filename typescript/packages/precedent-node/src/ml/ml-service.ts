import { ChatHistory } from "@fgpt/precedent-iso";
import { AxiosInstance } from "axios";
import z from "zod";

interface GetEmbeddingsArgs {
  documents: string[];
}

const ZEmbeddingsResponse = z.object({
  response: z.array(z.array(z.number())),
});

type GetEmbeddingsResponse = z.infer<typeof ZEmbeddingsResponse>;

export interface AskQuestionStreamingArgs {
  context: string;
  question: string;
  history: ChatHistory[];
  onData: (resp: string) => void;
  onEnd: () => void;
}

export interface GenerateTitleStreamingArgs {
  question: string;
  answer: string;
  onData: (resp: string) => void;
  onEnd: () => void;
}

export interface AskQuestion {
  context: string;
  question: string;
}

export interface ScanArgs {
  fileName: string;
  text: string;
}
export interface ScanResponse {
  description: string;
}

export interface MLServiceClient {
  ping: () => Promise<"pong">;
  scan: (args: ScanArgs) => Promise<ScanResponse>;
  getEmbedding: (query: string) => Promise<number[]>;
  getEmbeddings: (args: GetEmbeddingsArgs) => Promise<GetEmbeddingsResponse>;
  askQuestion(args: AskQuestion): Promise<string>;
  askQuestionStreaming(args: AskQuestionStreamingArgs): Promise<void>;
  getTitleStreaming(args: GenerateTitleStreamingArgs): Promise<void>;
  tokenLength(text: string): Promise<TokenLength>;
}

export class MLServiceClientImpl implements MLServiceClient {
  constructor(private readonly client: AxiosInstance) {}

  async ping(): Promise<"pong"> {
    await this.client.get<unknown>("/ping");
    return "pong";
  }
  async scan({ fileName, text }: ScanArgs): Promise<ScanResponse> {
    const response = await this.client.post<unknown>("/report/scan", {
      file_name: fileName,
      text,
    });

    return ZScanResponse.parse(response.data);
  }

  async getEmbeddings(args: GetEmbeddingsArgs): Promise<GetEmbeddingsResponse> {
    if (args.documents.length === 0) {
      return { response: [] };
    }
    const response = await this.client.post<unknown>(
      "/embeddings/embedding-for-documents",
      { documents: args.documents },
    );
    return ZEmbeddingsResponse.parse(response.data);
  }

  async getEmbedding(query: string): Promise<number[]> {
    const { response } = await this.getEmbeddings({ documents: [query] });
    return response[0]!;
  }

  async askQuestion({ context, question }: AskQuestion): Promise<string> {
    const response = await this.client.post<unknown>("/chat/ask-question", {
      context,
      question,
    });

    return ZAskQuestionResponse.parse(response.data).data;
  }

  async askQuestionStreaming({
    context,
    question,
    onData,
    onEnd,
    history,
  }: AskQuestionStreamingArgs): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.client.post<any>(
      "/chat/ask-question-streaming",
      {
        context,
        question,
        history,
      },
      {
        responseType: "stream",
      },
    );
    const stream = response.data;

    stream.on("data", (data: Buffer) => {
      onData(data.toString());
    });

    stream.on("end", () => {
      onEnd();
    });
  }

  async getTitleStreaming({
    question,
    answer,
    onData,
    onEnd,
  }: GenerateTitleStreamingArgs): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.client.post<any>(
      "/chat/get-title-streaming",
      {
        question,
        answer,
      },
      {
        responseType: "stream",
      },
    );
    const stream = response.data;

    stream.on("data", (data: Buffer) => {
      onData(data.toString());
    });

    stream.on("end", () => {
      onEnd();
    });
  }

  async tokenLength(text: string): Promise<TokenLength> {
    const response = await this.client.post<unknown>("/text/token-length", {
      text,
    });
    return ZTokenLengthResponse.parse(response.data);
  }
}

const ZTokenLengthResponse = z.object({
  gpt4: z.number(),
  claude100k: z.number(),
});

const ZScanResponse = z.object({
  description: z.string(),
});

export type TokenLength = z.infer<typeof ZTokenLengthResponse>;

const ZAskQuestionResponse = z.object({
  data: z.string(),
});
