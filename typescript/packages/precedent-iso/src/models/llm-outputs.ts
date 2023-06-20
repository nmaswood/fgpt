import { Progress } from "./file";

export interface Summary {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkId: string;
  textChunkGroupId: string;
  summary: string;
}
export interface Question {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkId: string;
  textChunkGroupId: string;
  question: string;
}

export type MiscValue =
  | {
      type: "terms";
      value: Term[];
    }
  | {
      type: "financial_summary";
      value: FinancialSummary;
    }
  | {
      type: "summary";
      value: string[];
    };

export interface MiscValueRow {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkId: string;
  textChunkGroupId: string;
  value: MiscValue;
}

export interface Term {
  termValue: string;
  termName: string;
}

export interface FinancialSummary {
  investmentRisks: string[];
  investmentMerits: string[];
  financialSummaries: string[];
}

export interface Outputs {
  summaries: Summary[];
  questions: Question[];
  financialSummary: FinancialSummary;
  terms: Term[];
}

export interface Report {
  questions: string[];
  summaries: string[];
  financialSummary: FinancialSummary;
  terms: Term[];
}

export const EMPTY_REPORT = {
  questions: [],
  summaries: [],
  terms: [],
  financialSummary: {
    investmentRisks: [],
    investmentMerits: [],
    financialSummaries: [],
  },
};

export type ReportStatus =
  | {
      type: "not_started" | "already_exists" | "finished";
    }
  | {
      type: "in_progress";
      value: Progress;
    };
