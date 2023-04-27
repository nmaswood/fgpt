import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "FGPT Precedent Node",
    useAtomics: true,
    env: {
      SQL_URI:
        "postgres://postgres:postgres@localhost:5432/fgpt-test?sslmode=disable",
    },
  },
});
