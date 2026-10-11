// Vendors dimos-react (github.com/jeff-hykin/dimos-react) into src/dimos-react at a tag, so the build needs no network:
//   deno task vendor-dimos-react v0.1.7
// Copies mod.js, its types (mod.d.ts), src/ (minus the 3D view, src/three: this page has none) and the LICENSE.
import $ from "jsr:@david/dax@0.43.2";

const tag = Deno.args[0];
if (!tag) {
  throw new Error("usage: deno task vendor-dimos-react <tag, e.g. v0.1.7>");
}
const target = $.path(new URL("../src/dimos-react", import.meta.url));
const scratch = $.path(await Deno.makeTempDir());
await $`git clone --quiet --depth 1 --branch ${tag} https://github.com/jeff-hykin/dimos-react ${scratch}`;
const commit = (await $`git -C ${scratch} rev-parse HEAD`.text()).trim();
await target.remove({ recursive: true }).catch(() => {});
await target.mkdir({ recursive: true });
for (const file of ["mod.js", "mod.d.ts", "LICENSE"]) {
  await scratch.join(file).copyFile(target.join(file));
}
await $`cp -R ${scratch.join("src")} ${target.join("src")}`;
await target.join("src/three").remove({ recursive: true });
await target.join("VERSION").writeText(`jeff-hykin/dimos-react ${tag} ${commit}\n`);
await scratch.remove({ recursive: true });
console.log(`src/dimos-react = dimos-react ${tag} (${commit})`);
