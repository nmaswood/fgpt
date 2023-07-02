import { expect, test } from "vitest";

import { HttpTabularDataService } from "../tabular-data-service/tabular-data-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const tableExtractor = new HttpTabularDataService(
    TEST_SETTINGS.springtimeUri,
    "test"
  );
  return { tableExtractor };
}

test.skip("extract", async () => {
  const { tableExtractor } = await setup();

  const result = await tableExtractor.extract({
    bucket: TEST_SETTINGS.bucket,
    objectPath:
      "user-uploads/d600c7a6-54bf-44a5-8bd1-484d9223e54a/173c517d-7037-4781-a59d-6de3561c7726/364025b42216f1ec184ce281db10830c.pdf",
    outputPrefix:
      "excel-uploads/d600c7a6-54bf-44a5-8bd1-484d9223e54a/173c517d-7037-4781-a59d-6de3561c7726",
    title: "hard-coded",
  });
  if (result.type === "empty") {
    throw new Error("illegal state");
  }
  expect(result.numberOfSheets).toEqual(20);
}, 20_000);
