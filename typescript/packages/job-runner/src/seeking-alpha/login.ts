import * as T from "node:timers/promises";

import { Browser } from "puppeteer";

const EMAIL_SELECTOR = 'input[type="email"]';
const PASSWORD_SELECTOR = 'input[type="password"]';
const SUBMIT_BUTTON_SELECTOR = 'button[data-test-id="sign-in-button"]';

export async function login(browser: Browser, email: string, password: string) {
  const page = await browser.newPage();
  await page.goto("https://seekingalpha.com/account/login");

  await page.waitForSelector(EMAIL_SELECTOR);

  await page.type(EMAIL_SELECTOR, email);
  await page.type(PASSWORD_SELECTOR, password);

  await T.setTimeout(3_000);

  await page.$eval(SUBMIT_BUTTON_SELECTOR, (el) => el.click());
}
