import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "Songbird API",
    setupFiles: [],
    useAtomics: true,
    env: {
      SQL_URI:
        "postgres://postgres:postgres@localhost:5432/dalia-test?sslmode=disable",
    },
  },
});
