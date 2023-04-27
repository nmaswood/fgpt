import { EarningsCallHref } from "@fgpt/precedent-iso";
import { DatabasePool } from "slonik";

export class PsqlTranscriptStore implements TranscriptStore {
  constructor(private readonly pool: DatabasePool) {}

  upsertHref(_: EarningsCallHref): Promise<void> {
    false && this.pool;
    throw new Error("Method not implemented.");
  }
  hasTranscriptForHref(_: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  storeTranscript(_: EarningsCallHref): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
export interface TranscriptStore {
  upsertHref(body: EarningsCallHref): Promise<void>;
  hasTranscriptForHref(href: string): Promise<boolean>;
  storeTranscript(body: EarningsCallHref): Promise<void>;
}
