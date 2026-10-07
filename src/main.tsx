// Stylesheets first so the module styles imported by App win ties with the page-wide defaults.
import "./index.css";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { connectZenoh } from "./zenoh.ts";

createRoot(document.getElementById("root")!).render(<App zenoh={connectZenoh()} />);
