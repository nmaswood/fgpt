import * as dotenv from "dotenv";

dotenv.config();

import { LOGGER } from "./logger";
import { SETTINGS, Settings } from "./settings";

LOGGER.info("Starting job runner...");

async function start(_: Settings) {
  console.log("hi");

  //
}

start(SETTINGS);
