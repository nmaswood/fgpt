import * as dotenv from "dotenv";

dotenv.config();

import { LOGGER } from "./logger";
import { run } from "./seeking-alpha/get-data";

LOGGER.info("Server starting ...");

async function start() {
  await run();
  //
}

start();
