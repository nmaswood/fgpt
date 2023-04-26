import { TranscriptLink } from "@fgpt/precedent-iso";
import { LOGGER } from "../logger";

interface TranscriptLinkGenerator {
  getLinks(): AsyncIterator<TranscriptLink>;
}

class SeekingAlphaGenerator implements TranscriptLinkGenerator {
  async *getLinks() {
    yield undefined!;
    throw new Error("Method not implemented.");
  }
}

export async function run() {
  const generator = new SeekingAlphaGenerator();
  LOGGER.info("Starting generator");

  for await (const link of generator.getLinks()) {
    LOGGER.info(link);
    break;
  }
}
