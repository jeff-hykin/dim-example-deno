// 3, 4, 5: calls out of the app, each declared in dimos.yaml `uses:`
import { json, postJson } from "../api.ts";
import { Output, Section, useLoad } from "./Section.tsx";
import styles from "./Calls.module.css";

interface Runs {
  launch: { blueprint: string; phase: string } | null;
}

export function Gateway() {
  const runs = useLoad(() =>
    json<Runs>("../../dimos/runs").then(({ launch }) =>
      launch ? { blueprint: launch.blueprint, phase: launch.phase } : "nothing launched yet"
    )
  );
  return (
    <Section
      title="3 · Call the dimos gateway"
      note={
        <>
          <code>GET /dimos/runs</code> — what's running
        </>
      }
    >
      <Output value={runs} />
    </Section>
  );
}

export function OtherApp() {
  const status = useLoad(() => json("../../apps/dim-controller/api/status"));
  return (
    <Section
      title="4 · Call another app"
      note={
        <>
          <code>GET /apps/dim-controller/api/status</code>{" "}
          — Controller's public (provides:) endpoint
        </>
      }
    >
      <Output value={status} />
    </Section>
  );
}

export function TalkToDesktop() {
  const notify = () =>
    postJson("../../api/notifications", {
      title: "Hello from the example app",
      body: "POST /api/notifications",
      kind: "ok",
    }).catch((error) => console.error(error));
  // opening another app (or a built-in: launcher, appstore, settings) is a message to the shell around this page
  const openLauncher = () =>
    parent.postMessage({ dimosShell: 1, type: "open_app", app: "launcher" }, location.origin);
  return (
    <Section title="5 · Talk to Desktop">
      <div className={styles.row}>
        <button type="button" onClick={notify}>Send a notification</button>
        <button type="button" onClick={openLauncher}>Open the Launcher</button>
      </div>
    </Section>
  );
}
