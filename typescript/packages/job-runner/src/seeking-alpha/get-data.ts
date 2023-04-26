import { TranscriptLink } from "@fgpt/precedent-iso";
import z from "zod";
import { isNotNull } from "@fgpt/precedent-iso";

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

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
  LOGGER.info(generator, "Starting generator");

  await launch();
}

const TRANSCRIPT_SITE =
  "https://seekingalpha.com/earnings/earnings-call-transcripts";

async function launch() {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();

  await page.setViewport({ width: 2400, height: 720 });

  await page.goto(TRANSCRIPT_SITE, {
    waitUntil: "networkidle0",
  });

  const articles = await page.$$("article > div > div");

  const data = await Promise.all(
    articles.map(async (article) => {
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
    })
  );

  const parsed = data.map((d) => toTranscriptLink(d)).filter(isNotNull);
  console.log(parsed);
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
}: RawTranscript): TranscriptLink | undefined {
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
