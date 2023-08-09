import { assertNever, Outputs } from "@fgpt/precedent-iso";

import { MiscOutputStore } from "./misc-output-store";

export interface ReportService {
  forFileReferenceId(fileReferenceId: string): Promise<Outputs.Report>;
}

export class ReportServiceImpl implements ReportService {
  constructor(private readonly miscValueStore: MiscOutputStore) {}

  async forFileReferenceId(fileReferenceId: string): Promise<Outputs.Report> {
    const miscValues = await this.miscValueStore.getForFile(fileReferenceId);

    return this.#processMiscValues(miscValues);
  }

  #processMiscValues(values: Outputs.MiscValue[]): Outputs.Report {
    const terms: Outputs.Term[] = [];
    const cim: Intermediate = { raw: [], html: [] };
    const kpi: Intermediate = { raw: [], html: [] };

    const alreadySeenTerms = new Set<string>();

    for (const value of values) {
      switch (value.type) {
        case "terms": {
          for (const term of value.value) {
            if (alreadySeenTerms.has(term.termName)) {
              continue;
            }

            terms.push(term);

            alreadySeenTerms.add(term.termName);
          }

          break;
        }

        case "long_form":
          cim.raw.push(value.raw);
          if (value.html) {
            cim.html.push(value.html);
          }

          break;
        case "output": {
          if (value.slug !== "kpi") {
            throw new Error("not supported");
          }
          kpi.raw.push(value.raw);
          if (value.html) {
            kpi.html.push(value.html);
          }

          break;
        }

        default:
          assertNever(value);
      }
    }

    return {
      terms,
      cim: toOutput(cim),
      kpi: toOutput(kpi),
    };
  }
}

interface Intermediate {
  raw: string[];
  html: string[];
}

function toOutput(value: Intermediate): Outputs.DisplayOutput {
  if (value.html.length > 0) {
    return { type: "html", value: value.html };
  }
  return { type: "raw", value: value.raw };
}
