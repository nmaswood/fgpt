import { TaskExecutorImpl } from "@fgpt/precedent-node";
import {
  AnalyisServiceImpl,
  GoogleCloudStorageService,
  MLServiceClientImpl,
  PsqlAnalysisStore,
  PsqlFileReferenceStore,
  PsqlMiscOutputStore,
  PsqlProcessedFileStore,
  PsqlQuestionStore,
  PSqlTaskStore,
  PsqlTextChunkStore,
  TikaHttpClient,
  TikaTextExtractor,
} from "@fgpt/precedent-node";
import { DatabasePool } from "slonik";

import { CommonSettings } from "./settings";

export async function getExecutor(
  settings: CommonSettings,
  pool: DatabasePool
) {
  const fileReferenceStore = new PsqlFileReferenceStore(pool);
  const blobStorageService = new GoogleCloudStorageService();
  const tikaClient = new TikaHttpClient(settings.tikaClient);
  const textExtractor = new TikaTextExtractor(
    fileReferenceStore,
    settings.assetBucket,
    blobStorageService,
    tikaClient
  );
  const taskService = new PSqlTaskStore(pool);

  const processedFileStore = new PsqlProcessedFileStore(pool);

  const textChunkStore = new PsqlTextChunkStore(pool);

  const mlServiceClient = new MLServiceClientImpl(settings.mlServiceUri);

  const analysisStore = new PsqlAnalysisStore(pool);
  const analysisService = new AnalyisServiceImpl(
    analysisStore,
    mlServiceClient,
    textChunkStore
  );

  const questionStore = new PsqlQuestionStore(pool);
  const metricsStore = new PsqlMiscOutputStore(pool);

  return new TaskExecutorImpl(
    textExtractor,
    taskService,
    processedFileStore,
    textChunkStore,
    mlServiceClient,
    analysisService,
    analysisStore,
    questionStore,
    metricsStore
  );
}
