import { expect, test } from "vitest";

import { GreedyTextChunker } from "../text-chunker/text-chunker";

const chunker = new GreedyTextChunker();

test("empty with text", () => {
  const result = chunker.chunk(10, {
    type: "text_only",
    text: "",
  });
  expect(result.chunks).toEqual([]);
});

test("empty with pages", () => {
  const result = chunker.chunk(10, {
    type: "has_pages",
    pages: [],
  });
  expect(result.chunks).toEqual([]);
});

test("basic example", () => {
  const result = chunker.chunk(10, {
    type: "text_only",
    text: "I love cats. They are really so fantastic. They are the best",
  });
  expect(result.chunks).toEqual([
    "I love cats.",
    "They are",
    "really so",
    "fantastic.",
    "They are the",
    "best",
  ]);
});

test("with pages simple", () => {
  const result = chunker.chunk(10, {
    type: "has_pages",
    pages: [
      {
        page: 0,
        text: "I love cats. They are really so fantastic. They are the best",
      },
    ],
  });
  expect(result).toEqual({
    type: "with_location",
    chunks: [
      {
        chunk: "I love cats.",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "They are",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "really so",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "fantastic.",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "They are the",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "best",
        location: {
          type: "single",
          page: 0,
        },
      },
    ],
  });
});

test("with pages harder", () => {
  const result = chunker.chunk(10, {
    type: "has_pages",
    pages: [
      {
        page: 0,
        text: "I love cats. They are really so fantastic. They are the best",
      },
      {
        page: 1,
        text: "A B C",
      },
    ],
  });
  console.log(JSON.stringify(result, null, 2));
  expect(result).toEqual({
    type: "with_location",
    chunks: [
      {
        chunk: "I love cats.",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "They are",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "really so",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "fantastic.",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "They are the",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "best A B C",
        location: {
          type: "range",
          start: 0,
          end: 1,
        },
      },
    ],
  });
});

test("with two boundaries", () => {
  const result = chunker.chunk(10, {
    type: "has_pages",
    pages: [
      {
        page: 0,
        text: "I love cats. They are really so fantastic. They are the best",
      },
      {
        page: 1,
        text: "AAA BBB CCC",
      },
      {
        page: 2,
        text: "B",
      },
      {
        page: 3,
        text: "C",
      },
      {
        page: 4,
        text: "DD DD DD",
      },
    ],
  });
  console.log(JSON.stringify(result, null, 2));
  expect(result).toEqual({
    type: "with_location",
    chunks: [
      {
        chunk: "I love cats.",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "They are",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "really so",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "fantastic.",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "They are the",
        location: {
          type: "single",
          page: 0,
        },
      },
      {
        chunk: "best AAA BBB",
        location: {
          type: "range",
          start: 0,
          end: 1,
        },
      },
      {
        chunk: "CCC B C DD DD",
        location: {
          type: "range",
          start: 1,
          end: 4,
        },
      },
      {
        chunk: "DD",
        location: {
          type: "single",
          page: 4,
        },
      },
    ],
  });
});
