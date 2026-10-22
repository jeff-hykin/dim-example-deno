// Vendors dimos-react (github.com/jeff-hykin/dimos-react) into src/vendor/dimos-react at a tag, so the build needs no network:
//   deno task vendor-dimos-react v0.3.1
// Copies its TypeScript source (dimos-react has no library build since v0.2.3: Deno and Vite compile the .ts/.tsx
// as-is), only the files src/index.ts reaches, so the 3D view (three.ts and the three/ it imports) stays out, plus the
// LICENSE and a VERSION file naming the tag and commit.
import $ from "jsr:@david/dax@0.43.2";

const tag = Deno.args[0];
if (!tag) {
  throw new Error("usage: deno task vendor-dimos-react <tag, e.g. v0.3.1>");
}
const target = $.path(new URL("../src/vendor/dimos-react", import.meta.url));
const scratch = $.path(await Deno.makeTempDir());
await $`git clone --quiet --depth 1 --branch ${tag} https://github.com/jeff-hykin/dimos-react ${scratch}`;
const commit = (await $`git -C ${scratch} rev-parse HEAD`.text()).trim();
const source = scratch.join("src");
const graph = await $`${Deno.execPath()} info --json ${source.join("index.ts")}`.cwd(scratch)
  .json();
const sourceUrl = source.toFileUrl().href + "/";
const reached = (graph.modules as { specifier: string }[])
  .map((module) => module.specifier)
  .filter((specifier) => specifier.startsWith(sourceUrl))
  .map((specifier) => decodeURIComponent(specifier.slice(sourceUrl.length)));
await target.remove({ recursive: true }).catch(() => {});
for (const file of reached) {
  await target.join(file).parentOrThrow().mkdir({ recursive: true });
  await source.join(file).copyFile(target.join(file));
}
await scratch.join("LICENSE").copyFile(target.join("LICENSE"));
await target.join("VERSION").writeText(`jeff-hykin/dimos-react ${tag} ${commit}\n`);
await scratch.remove({ recursive: true });
console.log(`src/vendor/dimos-react = dimos-react ${tag} (${commit}), ${reached.length} files`);
