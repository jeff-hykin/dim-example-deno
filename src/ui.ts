// The whole UI is dimos-react (github.com/jeff-hykin/dimos-react): Desktop's theme followed live, cards, buttons,
// inputs, tables, toasts. Vendored into ./vendor/dimos-react as its library build (`deno task vendor-dimos-react <tag>`; the
// tag is in its VERSION file), so the build needs no network, like ./dim-app.
// @ts-types="./vendor/dimos-react/index.d.ts"
export * from "./vendor/dimos-react/index.js";
