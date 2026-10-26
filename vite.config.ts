/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";
import { jsrFromEsmSh } from "./tools/jsr_from_esm_sh.ts";

// Desktop serves the page at /apps/<name>/, so every URL in the build is relative ("./").
const desktop = "http://127.0.0.1:5555";

export default defineConfig({
  base: "./",
  // the tests' @dimos/msgs (jsr) from esm.sh: tools/jsr_from_esm_sh.ts
  // deno.lock holds two @types/node, so plugin-react may see a second copy of vite's types (deno 2.9's check does)
  plugins: [jsrFromEsmSh(new URL(".", import.meta.url)), react() as unknown as PluginOption],
  server: {
    // `deno task dev` (:5173) next to `deno task serve` (:8787) and a running Desktop (:5555)
    proxy: {
      "/api": "http://127.0.0.1:8787",
      "/gateways": desktop,
      "/theme.css": desktop,
      "/shell": desktop,
      "/apps": desktop,
      "/zenoh-gateway": { target: desktop, ws: true },
    },
  },
  build: {
    target: "es2022",
  },
  test: {
    // UI tests (.test.tsx) opt into happy-dom per file via @vitest-environment; the rest stay on node.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Vitest's default forks pool needs Node child-process IPC, which Deno does not emulate reliably.
    pool: "threads",
  },
});
