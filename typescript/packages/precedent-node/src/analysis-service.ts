import {
  AnalysisOutput,
  AnalysisOutputItem,
  AnalysisOutputResponse,
} from "@fgpt/precedent-iso";

import { AnalysisStore } from "./analysis-store";
import { LOGGER } from "./logger";
import { MLServiceClient } from "./ml/ml-service";
import { TextChunkStore } from "./text-chunk-store";

export interface AnalysisService {
  analyze(analysisId: string): Promise<AnalysisOutput>;
}

export class AnalyisServiceImpl implements AnalysisService {
  constructor(
    private readonly analysisStore: AnalysisStore,
    private readonly mlService: MLServiceClient,
    private readonly textChunkStore: TextChunkStore
  ) {}

  async analyze(analysisId: string): Promise<AnalysisOutput> {
    const analysis = await this.analysisStore.get(analysisId);
    const definition = analysis.definition;
    const items: AnalysisOutputItem[] = [];

    for (const [index, { name, prompts }] of definition.items.entries()) {
      LOGGER.info(
        { name, index: index + 1, total: definition.items.length + 1 },
        "Analyzing item"
      );

      const responses = await Promise.all(
        prompts.map((prompt) =>
          this.analyzeForPrompt({
            prompt,
            projectId: analysis.projectId,
          })
        )
      );

      items.push({
        name,
        responses,
      });
    }

    return {
      version: "1",
      items,
    };
  }

  async analyzeForPrompt({
    prompt,
    projectId,
  }: {
    projectId: string;
    prompt: string;
  }): Promise<AnalysisOutputResponse> {
    const vector = await this.mlService.getEmbedding(prompt);
    const similar = await this.mlService.getKSimilar({
      vector,
      metadata: {
        projectId,
      },
    });
    const chunks = await this.textChunkStore.getTextChunks(
      similar.map((doc) => doc.id)
    );

    const context = chunks.map((chunk) => chunk.chunkText).join(" ");

    const answer = await this.mlService.askQuestion({
      context,
      question: prompt,
    });

    return {
      prompt,
      answer,
      chunkIds: similar.map((doc) => doc.id),
      text: context,
    };
  }
}
