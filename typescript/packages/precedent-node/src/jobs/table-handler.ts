import { assertNever, ExcelSource } from "@fgpt/precedent-iso";
import path from "path";

import { ExcelAssetStore } from "../excel-asset-store";
import { ExcelOutputStore } from "../excel-output-store";
import { FileReferenceStore } from "../file-reference-store";
import { LOGGER } from "../logger";
import { TabularDataService } from "../tabular-data-service/tabular-data-service";

const EXCEL_PATH_SUFFIX = "excel-uploads";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TableHandler {
  export interface ExtractArguments {
    fileReferenceId: string;
  }
  export interface AnalyzeArguments {
    organizationId: string;
    projectId: string;
    fileReferenceId: string;
    source: ExcelSource;
  }

  export type ExtractResponse =
    | {
        fileReferenceId: string;
        excelAssetId: string;
      }
    | undefined;
}

export interface TableHandler {
  extractTable: (
    args: TableHandler.ExtractArguments,
  ) => Promise<TableHandler.ExtractResponse>;

  analyzeTable: (config: TableHandler.AnalyzeArguments) => Promise<void>;
}

export class TableHandlerImpl implements TableHandler {
  constructor(
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly tableExtractor: TabularDataService,
    private readonly excelAssetStore: ExcelAssetStore,
    private readonly excelOutputStore: ExcelOutputStore,
  ) {}

  async extractTable({
    fileReferenceId,
  }: TableHandler.ExtractArguments): Promise<TableHandler.ExtractResponse> {
    const file = await this.fileReferenceStore.get(fileReferenceId);

    const extracted = await this.tableExtractor.extract({
      bucket: file.bucketName,
      objectPath: file.path,
      title: file.fileName,
      outputPrefix: path.join(
        EXCEL_PATH_SUFFIX,
        file.organizationId,
        file.projectId,
        file.id,
      ),
    });

    if (extracted.type === "empty") {
      return undefined;
    }

    const excelAssetStore = await this.excelAssetStore.insert({
      organizationId: file.organizationId,
      projectId: file.projectId,
      fileReferenceId: file.id,
      numSheets: extracted.numberOfSheets,
      bucketName: file.bucketName,
      path: extracted.path,
    });

    return {
      fileReferenceId: file.id,
      excelAssetId: excelAssetStore.id,
    };
  }

  async analyzeTable(config: TableHandler.AnalyzeArguments): Promise<void> {
    const { bucketName, path } = await this.#pathForExcel(config);
    LOGGER.info({ bucketName, path }, "Analyzing excel file");
    const { responses } = await this.tableExtractor.analyzeGPT({
      bucket: bucketName,
      objectPath: path,
    });

    if (responses.length === 0) {
      return;
    }

    await this.excelOutputStore.insert({
      organizationId: config.organizationId,
      projectId: config.projectId,
      fileReferenceId: config.fileReferenceId,
      excelAssetId:
        config.source.type === "derived"
          ? config.source.excelAssetId
          : undefined,
      output: {
        type: "v0_chunks",
        value: responses,
      },
    });
  }

  async #pathForExcel(config: TableHandler.AnalyzeArguments) {
    switch (config.source.type) {
      case "derived": {
        const asset = await this.excelAssetStore.get(
          config.source.excelAssetId,
        );
        return {
          bucketName: asset.bucketName,
          path: asset.path,
        };
      }
      case "direct-upload": {
        const file = await this.fileReferenceStore.get(config.fileReferenceId);
        return {
          bucketName: file.bucketName,
          path: file.path,
        };
      }
      default:
        assertNever(config.source);
    }
  }
}
