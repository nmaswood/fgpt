import * as dotenv from "dotenv";

dotenv.config();

import { assertNever } from "@fgpt/precedent-iso";

import { LOGGER } from "./logger";
import { run } from "./seeking-alpha/get-data";
import { SETTINGS, Settings } from "./settings";

LOGGER.info("Server starting ...");

async function start(settings: Settings) {
  switch (settings.jobType) {
    case "get-earnings-call-href": {
      await run(SETTINGS);

      break;
    }
    default:
      assertNever(settings.jobType);
  }

  //
}

start(SETTINGS);
