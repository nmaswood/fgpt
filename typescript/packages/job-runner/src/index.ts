import * as dotenv from "dotenv";

dotenv.config();

import { assertNever, GreedyTextChunker } from "@fgpt/precedent-iso";
import {
  dataBasePool,
  MLServiceClientImpl,
  PsqlChunkPostSummaryStore,
  PsqlRawChunkStore,
  PsqlSummaryStore,
  PsqlTranscriptForProcessing,
  PsqlTranscriptStore,
} from "@fgpt/precedent-node";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { LOGGER } from "./logger";
import { PuppeteerEarningsCallHrefFetcher } from "./seeking-alpha/earnings-call-href-fetcher";
import { FetchAndStoreEarningCallsDataImpl } from "./seeking-alpha/run";
import { PuppeteerTranscriptFetcher } from "./seeking-alpha/transcript";
import { SETTINGS, Settings } from "./settings";

puppeteer.use(StealthPlugin());

LOGGER.info("Starting job runner...");

async function start(settings: Settings) {
  const pool = await dataBasePool(settings.sql.uri);

  const transcriptStore = new PsqlTranscriptStore(pool);

  switch (settings.jobType) {
    case "get-earnings-call-href": {
      const browser = await puppeteer.launch({
        headless: true,
        ...(settings.chromiumExecutablePath
          ? { executablePath: settings.chromiumExecutablePath }
          : {}),
        args: ["--no-sandbox", "--disable-gpu"],
      });
      const transcriptFetcher = new PuppeteerTranscriptFetcher(browser);
      const earningsCallFetcher = new PuppeteerEarningsCallHrefFetcher(browser);

      const storeTrainingData = new FetchAndStoreEarningCallsDataImpl(
        transcriptStore,
        transcriptFetcher,
        earningsCallFetcher
      );
      await storeTrainingData.run({ skipHrefs: true });

      break;
    }
    case "process-earnings-call": {
      const rawChunkStore = new PsqlRawChunkStore(pool);
      const summaryStore = new PsqlSummaryStore(pool);
      const forProcessing = new PsqlTranscriptForProcessing(pool);
      const postSummaryStore = new PsqlChunkPostSummaryStore(pool);
      const chunker = new GreedyTextChunker();
      const mlService = new MLServiceClientImpl(SETTINGS.mlServiceUri);

      for await (const transcript of forProcessing.getTranscripts()) {
        const chunks = chunker.chunk({
          tokenChunkLimit: 3000,
          text: transcript.text,
        });

        LOGGER.info(
          `Breaking transcript ${transcript.transcriptContentId} for ${transcript.hrefId} into  ${chunks.length} chunks for processing`
        );

        const chunksFromDb = await rawChunkStore.insertMany(
          chunks.map((chunk) => ({
            transcriptContentId: transcript.transcriptContentId,
            content: chunk,
            numTokens: chunk.length,
          }))
        );

        for (const chunk of chunksFromDb) {
          const { response } = await mlService.summarize({
            text: chunk.content,
          });

          const summary = await summaryStore.insert({
            content: response,
            numTokens: response.length,
            diff: chunk.content.length - response.length,
            rawChunkId: chunk.id,
          });

          LOGGER.info(`Summarizing chunk ${chunk.id}`);

          const chunksForSummary = chunker.chunk({
            tokenChunkLimit: 3000,
            text: summary.content,
          });

          LOGGER.info(
            `Breaking summary chunk into ${chunksForSummary.length} pieces`
          );

          const embeddings = await mlService.getEmbeddings({
            documents: chunksForSummary,
          });

          await postSummaryStore.insertMany(
            chunksForSummary.map((chunkForSummary, idx) => ({
              summaryId: summary.id,
              content: chunkForSummary,
              embedding: embeddings.response[idx]!,
            }))
          );
        }
      }

      break;
    }

    case "load-into-vector-db": {
      const postSummaryStore = new PsqlChunkPostSummaryStore(pool);
      const mlService = new MLServiceClientImpl(SETTINGS.mlServiceUri);

      for await (const {
        ticker,
        hrefId,
        transcriptContentId,
        chunkId,
        postSummaryChunkId,
        summaryId,
        embedding,
      } of postSummaryStore.getLoaded()) {
        LOGGER.info(`Writing vector ${postSummaryChunkId} for ${ticker}`);
        console.log({ ticker });
        await mlService.upsertVectors([
          {
            id: postSummaryChunkId,
            vector: embedding,
            metadata: {
              ticker,
              hrefId,
              transcriptContentId,
              chunkId,

              summaryId,
            },
          },
        ]);
      }

      break;
    }
    default:
      assertNever(settings.jobType);
  }

  //
}

start(SETTINGS);
