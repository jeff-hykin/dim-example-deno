// Vendors dimos-react (github.com/jeff-hykin/dimos-react) into src/vendor/dimos-react at a tag, so the build needs no network:
//   deno task vendor-dimos-react v0.2.0-beta5
// Builds the tag with deno (its Vite library build: JS plus .d.ts types) and copies dist/, minus the 3D view (three.*:
// this page has none, but the three/ types the rest imports stay) and source maps, and the LICENSE. The .d.ts files'
// relative imports name their .d.ts siblings, so `deno check` reads the types (vite-plugin-dts writes the source's
// .ts/.tsx paths, which only tsc maps to .d.ts).
import $ from "jsr:@david/dax@0.43.2";
import { walkSync } from "jsr:@std/fs@1/walk";

// dimos-react's own build is Vite 8, which needs node:util's parseEnv: deno 2.9 has it, nixos-25.11's 2.6.10 doesn't
const [major, minor] = Deno.version.deno.split(".").map(Number);
if (major < 2 || (major === 2 && minor < 9)) {
  throw new Error(
    `deno ${Deno.version.deno} can't run dimos-react's Vite 8 build; use deno 2.9+, e.g. ` +
      "nix shell github:NixOS/nixpkgs/nixos-unstable#deno -c deno task vendor-dimos-react <tag>",
  );
}
const tag = Deno.args[0];
if (!tag) {
  throw new Error("usage: deno task vendor-dimos-react <tag, e.g. v0.2.0-beta5>");
}
const target = $.path(new URL("../src/vendor/dimos-react", import.meta.url));
const scratch = $.path(await Deno.makeTempDir());
await $`git clone --quiet --depth 1 --branch ${tag} https://github.com/jeff-hykin/dimos-react ${scratch}`;
const commit = (await $`git -C ${scratch} rev-parse HEAD`.text()).trim();
await $`${Deno.execPath()} install`.cwd(scratch).quiet();
await $`${Deno.execPath()} run -A npm:vite build`.cwd(scratch).quiet();
await target.remove({ recursive: true }).catch(() => {});
await target.parentOrThrow().mkdir({ recursive: true });
await $`cp -R ${scratch.join("dist")} ${target}`;
await scratch.join("LICENSE").copyFile(target.join("LICENSE"));
await target.join("three.js").remove();
await target.join("three.d.ts").remove();
for (const entry of walkSync(target.toString())) {
  if (entry.name.endsWith(".map")) {
    Deno.removeSync(entry.path);
  } else if (entry.name.endsWith(".d.ts")) {
    const types = Deno.readTextFileSync(entry.path);
    Deno.writeTextFileSync(
      entry.path,
      types.replace(/(['"])(\.{1,2}\/[^'"]+?)\.(tsx?|js)\1/g, (whole, quote, path) => {
        const sibling = $.path(entry.path).parentOrThrow().join(`${path}.d.ts`);
        return sibling.existsSync() ? `${quote}${path}.d.ts${quote}` : whole;
      }),
    );
  } else if (entry.name.endsWith(".js")) {
    const code = Deno.readTextFileSync(entry.path);
    Deno.writeTextFileSync(entry.path, code.replace(/\n\/\/# sourceMappingURL=\S+\s*$/, "\n"));
  }
}
// three/ goes too, except the .d.ts files the other types import (camera's store, map2d's tf and pose) and theirs
const threeDir = target.join("three").resolve();
const typesNeeded = new Set<string>();
const toRead = [...walkSync(target.toString(), { exts: [".d.ts"] })]
  .map((entry) => entry.path)
  .filter((path) => !$.path(path).resolve().startsWith(threeDir));
while (toRead.length > 0) {
  const file = $.path(toRead.pop()!);
  for (
    const [, , path] of Deno.readTextFileSync(file.toString()).matchAll(
      /(['"])(\.{1,2}\/[^'"]+?\.d\.ts)\1/g,
    )
  ) {
    const imported = file.parentOrThrow().join(path).resolve().toString();
    if (!typesNeeded.has(imported)) {
      typesNeeded.add(imported);
      toRead.push(imported);
    }
  }
}
for (const entry of [...walkSync(threeDir.toString(), { includeDirs: false })]) {
  if (!typesNeeded.has($.path(entry.path).resolve().toString())) {
    Deno.removeSync(entry.path);
  }
}
for (const entry of [...walkSync(threeDir.toString(), { includeFiles: false })].reverse()) {
  if ([...Deno.readDirSync(entry.path)].length === 0) {
    Deno.removeSync(entry.path);
  }
}
await target.join("VERSION").writeText(`jeff-hykin/dimos-react ${tag} ${commit}\n`);
await scratch.remove({ recursive: true });
console.log(`src/vendor/dimos-react = dimos-react ${tag} (${commit}), built`);
