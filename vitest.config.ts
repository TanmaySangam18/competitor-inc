import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // precise so it never rewrites scoped packages like @supabase/*
      { find: /^@\//, replacement: root },
      // server-only throws when imported outside RSC; stub it for plain-node tests
      { find: "server-only", replacement: fileURLToPath(new URL("./test/server-only.stub.ts", import.meta.url)) },
    ],
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
  },
});
