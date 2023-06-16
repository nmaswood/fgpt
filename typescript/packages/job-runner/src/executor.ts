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
  PSqlTaskService,
  PsqlTextChunkStore,
  TikaHttpClient,
  TikaTextExtractor,
} from "@fgpt/precedent-node";
import { DatabasePool } from "slonik";

import { Settings } from "./settings";

export async function getExecutor(settings: Settings, pool: DatabasePool) {
  const fileReferenceStore = new PsqlFileReferenceStore(pool);
  const blobStorageService = new GoogleCloudStorageService();
  const tikaClient = new TikaHttpClient(settings.tikaClient);
  const textExtractor = new TikaTextExtractor(
    fileReferenceStore,
    settings.assetBucket,
    blobStorageService,
    tikaClient
  );
  const taskService = new PSqlTaskService(pool);

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
