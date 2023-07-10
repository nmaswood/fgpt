import { AxiosInstance } from "axios";
import { z } from "zod";

export const ZVectorResult = z.object({
  id: z.string(),
  metadata: z.record(z.any()),
  score: z.number(),
});

export type VectorResult = z.infer<typeof ZVectorResult>;

export const ZSimilarResponse = z.object({
  results: ZVectorResult.array(),
});

export interface UpsertVector {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
}

export interface SimiliarSearch {
  vector: number[];
  metadata: Record<string, string>;
}

export interface VectorService {
  upsertVectors: (args: UpsertVector[]) => Promise<void>;
  getKSimilar: (args: SimiliarSearch) => Promise<VectorResult[]>;
}

export class PineconeVectorService implements VectorService {
  constructor(private readonly client: AxiosInstance) {}

  async upsertVectors(vectors: UpsertVector[]): Promise<void> {
    await this.client.put<unknown>("/vector/upsert-vectors", {
      vectors,
    });
  }

  async getKSimilar({
    vector,
    metadata,
  }: SimiliarSearch): Promise<VectorResult[]> {
    const response = await this.client.post<unknown>(
      "/vector/similar-vectors",
      {
        vector,
        metadata,
      },
    );
    return ZSimilarResponse.parse(response.data).results;
  }
}
