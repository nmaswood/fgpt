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
    const acc: Outputs.Report = {
      terms: [],
      longForm: [],
      outputs: [],
    };

    const alreadySeenTerms = new Set<string>();

    for (const value of values) {
      switch (value.type) {
        case "terms": {
          for (const term of value.value) {
            if (alreadySeenTerms.has(term.termName)) {
              continue;
            }

            acc.terms.push(term);

            alreadySeenTerms.add(term.termName);
          }

          break;
        }

        case "long_form":
          acc.longForm.push({
            raw: value.raw,
            html: value.html,
          });
          break;
        case "output":
          acc.outputs.push(value);
          break;

        default:
          assertNever(value);
      }
    }
    return acc;
  }
}
