import { expect, test } from "vitest";

import { GreedyTextChunker } from "../text-chunker/text-chunker";

const chunker = new GreedyTextChunker();
test("GreedyTextChunker", () => {
  expect(
    chunker.chunk({
      text: "I love cats. They are really so fantastic. They are the best",

      tokenChunkLimit: 10,
    })
  ).toEqual([
    "I love cats.",
    "They are",
    "really so",
    "fantastic.",
    "They are the",
    "best",
  ]);
});
