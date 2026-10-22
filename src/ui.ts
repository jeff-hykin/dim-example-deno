// The whole UI is dimos-react (github.com/jeff-hykin/dimos-react): Desktop's theme followed live, cards, buttons,
// inputs, tables, toasts. Vendored into ./vendor/dimos-react as its TypeScript source (`deno task vendor-dimos-react
// <tag>`; the tag is in its VERSION file), so the build needs no network, like ./dim-app.
export * from "./vendor/dimos-react/index.ts";
