import axios from "axios";
import { expect, test } from "vitest";

import { ThumbnailServiceImpl } from "../ml/thumbnail-service";
import { TEST_SETTINGS } from "./test-settings";

async function setup() {
  const client = axios.create({
    baseURL: TEST_SETTINGS.springtimeUri,
  });
  const thumbnailService = new ThumbnailServiceImpl(client);

  return { thumbnailService };
}

test("forPdf", async () => {
  const { thumbnailService } = await setup();
  const outputPrefix =
    "user-uploads/d600c7a6-54bf-44a5-8bd1-484d9223e54a/b586ae1b-2e9f-4449-9830-24ba421d6e4f/thumbnail";

  const result = await thumbnailService.forPdf({
    bucket: TEST_SETTINGS.bucket,
    objectPath:
      "user-uploads/d600c7a6-54bf-44a5-8bd1-484d9223e54a/b586ae1b-2e9f-4449-9830-24ba421d6e4f/3661ad55229393b9987d525bf47d7b46.pdf",
    outputPrefix,
  });

  expect(result.objectPath.startsWith(outputPrefix)).toBe(true);
}, 20_000);
