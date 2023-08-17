import { TrafficLightAnswer, ZTrafficLightAnswer } from "@fgpt/precedent-iso";
import { AxiosInstance } from "axios";
import z from "zod";

import { ChatContextResponse } from "../chat/chat-models";

interface GetEmbeddingsArgs {
  documents: string[];
}

const ZEmbeddingsResponse = z.object({
  response: z.array(z.array(z.number())),
});

type GetEmbeddingsResponse = z.infer<typeof ZEmbeddingsResponse>;

export interface AskQuestionStreamingArgs {
  context: ChatContextResponse;
  onData: (resp: string) => void;
  onEnd: () => void;
}

export interface GenerateTitleArgs {
  question: string;
  answer: string;
}

export interface ScanArgs {
  fileName: string;
  text: string;
}
export interface ScanResponse {
  description: string;
  tags: string[];
  isFinancialDocument: TrafficLightAnswer;
  isCim: TrafficLightAnswer;
}

export interface HtmlFromTextRequest {
  text: string;
  id: string;
}

export interface MLServiceClient {
  ping: () => Promise<"pong">;
  scan: (args: ScanArgs) => Promise<ScanResponse>;
  getEmbedding: (query: string) => Promise<number[]>;
  getEmbeddings: (args: GetEmbeddingsArgs) => Promise<GetEmbeddingsResponse>;
  askQuestionStreaming(args: AskQuestionStreamingArgs): Promise<void>;
  prompt(context: ChatContextResponse): Promise<string>;
  getTitle(args: GenerateTitleArgs): Promise<string>;
  tokenLength(text: string): Promise<TokenLength>;
  htmlFromText(args: HtmlFromTextRequest): Promise<string | undefined>;
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

  async askQuestionStreaming({
    context: { question, history, forFiles },
    onData,
    onEnd,
  }: AskQuestionStreamingArgs): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.client.post<any>(
      "/chat/ask-question-streaming",
      {
        question,
        history,
        for_files: forFiles.map((file) => ({
          file_name: file.fileName,
          chunks: file.chunks,
        })),
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

  async prompt({
    question,
    history,
    forFiles,
  }: ChatContextResponse): Promise<string> {
    const response = await this.client.post<unknown>("/chat/prompt", {
      question,
      history,
      for_files: forFiles.map((file) => ({
        file_name: file.fileName,
        chunks: file.chunks,
      })),
    });
    return ZGetPromptResponse.parse(response.data).prompt;
  }

  async getTitle({ question, answer }: GenerateTitleArgs): Promise<string> {
    const response = await this.client.post<unknown>("/chat/get-title", {
      question,
      answer,
    });

    return ZGetTitleResponse.parse(response.data).title;
  }

  async tokenLength(text: string): Promise<TokenLength> {
    const response = await this.client.post<unknown>("/text/token-length", {
      text,
    });
    return ZTokenLengthResponse.parse(response.data);
  }

  async htmlFromText({
    text,
    id,
  }: HtmlFromTextRequest): Promise<string | undefined> {
    const response = await this.client.post<unknown>("/chat/sanitize", {
      text,
      citations: true,
      id,
    });
    const html = ZHtmlFromText.parse(response.data).html;
    return html ?? undefined;
  }
}

const ZTokenLengthResponse = z.object({
  gpt4: z.number(),
  claude100k: z.number(),
});

const ZScanResponse = z
  .object({
    description: z.string(),
    tags: z.array(z.string()),
    is_financial_document: ZTrafficLightAnswer,
    is_cim: ZTrafficLightAnswer,
  })
  .transform((row) => ({
    description: row.description,
    tags: row.tags,
    isFinancialDocument: row.is_financial_document,
    isCim: row.is_cim,
  }));

const ZHtmlFromText = z.object({
  html: z.string().nullable(),
});

export type TokenLength = z.infer<typeof ZTokenLengthResponse>;

const ZGetTitleResponse = z.object({
  title: z.string(),
});

const ZGetPromptResponse = z.object({
  prompt: z.string(),
});
