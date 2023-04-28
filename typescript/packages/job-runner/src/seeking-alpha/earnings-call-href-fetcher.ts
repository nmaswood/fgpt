import * as timers from "node:timers/promises";

import { EarningsCallHref } from "@fgpt/precedent-iso";
import { isNotNull } from "@fgpt/precedent-iso";
import { Browser, ElementHandle } from "puppeteer";
import z from "zod";

interface GetHrefsOptions {
  maxPages: number;
}

export interface EarningsCallHrefFetcher {
  getLinks(opts: GetHrefsOptions): AsyncIterable<EarningsCallHref>;
}

const TRANSCRIPT_SITE =
  "https://seekingalpha.com/earnings/earnings-call-transcripts";

export class PuppeteerEarningsCallHrefFetcher
  implements EarningsCallHrefFetcher
{
  constructor(private readonly browser: Browser) {}

  async *getLinks({ maxPages }: GetHrefsOptions) {
    const page = await this.browser.newPage();
    await page.goto(TRANSCRIPT_SITE, {
      waitUntil: "networkidle0",
    });

    for (let pageNumber = 1; pageNumber < maxPages; pageNumber++) {
      await timers.setTimeout(5_000);
      const articles = await page.$$("article > div > div");

      const data = await Promise.all(articles.map(parseArticleTags));

      const showMoreButton = await page.$(
        "#content > div > div.d-h.Q-b8.Q-cp.Q-cs > div > div > div > div > section > div > div > div > div:nth-child(3) > a"
      );

      yield* data.map((d) => toTranscriptLink(d)).filter(isNotNull);
      if (!showMoreButton) {
        throw new Error("could not find button");
      }
      await showMoreButton.scrollIntoView();
      await showMoreButton.click();
    }
  }
}

async function parseArticleTags(
  article: ElementHandle
): Promise<RawTranscript> {
  const aTag = await article.$eval("a", (a) => ({
    title: a.textContent,
    href: a.href,
  }));

  const tickers = await article.$$eval(
    'a[data-test-id="post-list-ticker"]',
    (anchors) => anchors.map((anchor) => anchor.textContent)
  );

  const date = await article.$eval(
    'span[data-test-id="post-list-date"]',
    (t) => t.textContent
  );

  return ZRawTranscript.parse({ tickers: tickers, date, ...aTag });
}

const ZRawTranscript = z.object({
  date: z.string(),
  title: z.string(),
  href: z.string(),
  tickers: z.string().array(),
});

type RawTranscript = z.infer<typeof ZRawTranscript>;

const transcriptRegex = /\s(Q1|Q2|Q3|Q4)\s*(20\d+)/g;
function toTranscriptLink({
  href,
  title,
  tickers,
}: RawTranscript): EarningsCallHref | undefined {
  const [match] = [...title.matchAll(transcriptRegex)];
  if (match === undefined) {
    return undefined;
  }
  const [, quarter, year] = match;
  if (quarter === undefined || year === undefined) {
    return undefined;
  }

  return {
    quarter,
    year,
    title,
    href,
    tickers,
  };
}