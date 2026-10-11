import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { connectDimApp } from "./dim.ts";
import { AppProvider } from "./ui.ts";

// AppProvider: Desktop's skin (followed live), toasts, dialogs, URL state
createRoot(document.getElementById("root")!).render(
  <AppProvider>
    <App dim={connectDimApp()} />
  </AppProvider>,
);
