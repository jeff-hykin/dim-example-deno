// A Vite plugin for deno.json's jsr imports (the tests' @dimos/msgs), which Vite can't resolve: each comes from esm.sh's
// build of the version deno.lock pins, fetched once into node_modules/.esm-cache. They're virtual modules ("\0esm:<url>"),
// so Vitest runs them through Vite instead of handing an https URL to the runtime. Deno itself (deno check) reads JSR.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import type { Plugin } from "vite";

const prefix = "\0esm:";

export function jsrFromEsmSh(root: URL): Plugin {
  const readJson = (file: string) => JSON.parse(readFileSync(new URL(file, root), "utf8"));
  const locked: Record<string, string> = readJson("./deno.lock").specifiers;
  // "@dimos/msgs/": "jsr:/@dimos/msgs@^0.1.4/" -> ["@dimos/msgs/", "https://esm.sh/jsr/@dimos/msgs@0.1.4/"]
  const prefixes = Object.entries(readJson("./deno.json").imports as Record<string, string>)
    .filter(([name, target]) => name.endsWith("/") && target.startsWith("jsr:/"))
    .map(([name, target]) => {
      const [, pkg, range] = target.match(/^jsr:\/(@[^/]+\/[^@]+)@([^/]+)\/$/)!;
      const version = Object.entries(locked).find(([spec]) =>
        spec.startsWith(`jsr:${pkg}@`)
      )?.[1] ?? range;
      return [name, `https://esm.sh/jsr/${pkg}@${version}/`];
    });
  const cacheDir = join(process.cwd(), "node_modules", ".esm-cache");
  return {
    name: "jsr-from-esm-sh",
    enforce: "pre",
    resolveId(id, importer) {
      const match = prefixes.find(([name]) => id.startsWith(name));
      if (match) {
        return prefix + match[1] + id.slice(match[0].length);
      }
      // inside a fetched module: its absolute and relative imports are on esm.sh
      if (importer?.startsWith(prefix) && (id.startsWith("/") || id.startsWith("."))) {
        return prefix + new URL(id, importer.slice(prefix.length)).href;
      }
      return null;
    },
    async load(id) {
      if (!id.startsWith(prefix)) {
        return null;
      }
      const url = id.slice(prefix.length);
      const file = join(cacheDir, createHash("sha256").update(url).digest("hex") + ".js");
      if (existsSync(file)) {
        return readFileSync(file, "utf8");
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${url}: ${response.status} ${response.statusText}`);
      }
      const code = await response.text();
      mkdirSync(cacheDir, { recursive: true });
      writeFileSync(file, code);
      return code;
    },
  };
}
