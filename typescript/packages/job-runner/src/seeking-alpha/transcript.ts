import { TextBlock } from "@fgpt/precedent-iso";
import { Browser, Page } from "puppeteer";

export interface TranscriptFetcher {
  getTranscript(url: string): Promise<TextBlock[]>;
}

const CONTENT_SELECTOR = 'div[data-test-id="content-container"] > p';
export class PuppeteerTranscriptFetcher implements TranscriptFetcher {
  #page: Page | undefined;
  constructor(private readonly browser: Browser) {}

  async getTranscript(url: string): Promise<TextBlock[]> {
    const page = await this.#getPage();
    await page.goto(url);

    return page.$$eval(CONTENT_SELECTOR, (pTags) =>
      pTags.map((p) => {
        return {
          isStrong: Boolean(p.querySelector("strong")),
          text: p.textContent,
        };
      })
    );
  }

  async #getPage(): Promise<Page> {
    this.#page = this.#page || (await this.browser.newPage());
    return this.#page;
  }
}
