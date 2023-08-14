import {
  assertNever,
  isNotNull,
  Outputs,
  PROMPT_SLUGS,
} from "@fgpt/precedent-iso";

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

    const acc: Acc = {
      cim: { raw: [], html: [] },
      kpi: { raw: [], html: [] },
      business_model: { raw: [], html: [] },
      expense_drivers: { raw: [], html: [] },
      ebitda_adjustments: { raw: [], html: [] },
    };

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
          acc.cim.raw.push(value.raw);
          if (value.html) {
            acc.cim.html.push(value.html);
          }

          break;
        case "output": {
          acc[value.slug].raw.push(value.raw);
          if (value.html) {
            acc[value.slug].html.push(value.html);
          }

          break;
        }

        default:
          assertNever(value);
      }
    }

    return {
      terms,
      outputs: PROMPT_SLUGS.map((slug) => {
        const output = toOutput(acc[slug]);
        return output ? { slug, output } : undefined;
      }).filter(isNotNull),
    };
  }
}

interface Acc {
  cim: Intermediate;
  kpi: Intermediate;
  business_model: Intermediate;
  expense_drivers: Intermediate;
  ebitda_adjustments: Intermediate;
}

interface Intermediate {
  raw: string[];
  html: string[];
}

function toOutput(value: Intermediate): Outputs.DisplayOutput | undefined {
  if (value.html.length > 0) {
    return { type: "html", value: value.html };
  } else if (value.raw.length > 0) {
    return { type: "raw", value: value.raw };
  }
  return undefined;
}
