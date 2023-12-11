import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "FGPT API",
    setupFiles: [],
    useAtomics: true,
    env: {
      SQL_URI:
        "postgres://postgres:postgres@localhost:5432/fgpt-test?sslmode=disable",
      TIKA_CLIENT: "http://localhost:9998/tika",
    },
  },
});
