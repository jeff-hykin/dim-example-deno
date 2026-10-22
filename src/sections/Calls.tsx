// 3, 4, 5: calls out of the app, each declared in dimos.yaml `uses:`
import { json, postJson } from "../api.ts";
import { Button, Row, useToast } from "../ui.ts";
import { Output, Section, useLoad } from "./Section.tsx";

/** GET /dimos-gateway/active: the running blueprint, and the gateway's last launch */
interface Active {
  running: boolean;
  blueprint: string | null;
  launch: { blueprint: string; phase: string } | null;
}

export function Gateway() {
  const runs = useLoad(() =>
    json<Active>("../../dimos-gateway/active").then(({ running, blueprint, launch }) =>
      running
        ? { blueprint, phase: launch?.phase ?? "running" }
        : launch
        ? { blueprint: launch.blueprint, phase: launch.phase }
        : "nothing launched yet"
    )
  );
  return (
    <Section title="3 · Call the dimos gateway" note="`GET /dimos-gateway/active`: what's running">
      <Output value={runs} />
    </Section>
  );
}

export function OtherApp() {
  const status = useLoad(() => json("../../apps/dim-controller/api/status"));
  return (
    <Section
      title="4 · Call another app"
      note="`GET /apps/dim-controller/api/status`: Controller's public (provides:) endpoint"
    >
      <Output value={status} />
    </Section>
  );
}

export function TalkToDesktop() {
  const toast = useToast();
  const notify = () =>
    postJson("../../api/notifications", {
      title: "Hello from the example app",
      body: "POST /api/notifications",
      kind: "ok",
    }).catch((error: Error) => toast.error(error.message));
  // opening another app (or a built-in: launcher, appstore, settings) is a message to the shell around this page
  const openLauncher = () =>
    parent.postMessage({ dimosShell: 1, type: "open_app", app: "launcher" }, location.origin);
  return (
    <Section title="5 · Talk to Desktop">
      <Row wrap>
        <Button icon="bell" onClick={notify}>Send a notification</Button>
        <Button icon="external" onClick={openLauncher}>Open the Launcher</Button>
      </Row>
    </Section>
  );
}
