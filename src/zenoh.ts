// Topics through Desktop's zenoh-web bridge (dimos.yaml `zenoh-web:`). zenoh-web isn't on npm, so the browser
// loads its client by URL at a pinned commit; Vite leaves https:// imports alone. For a robot with no internet,
// host that file yourself.
import {
  connect,
  type ZenohWeb,
} from "https://esm.sh/gh/jeff-hykin/zenoh-web@63b72dd/client/zenoh_web.ts";

export type {
  Message,
  Publisher,
  Subscription,
  ZenohWeb,
} from "https://esm.sh/gh/jeff-hykin/zenoh-web@63b72dd/client/zenoh_web.ts";

export function connectZenoh(): Promise<ZenohWeb> {
  return connect(new URL("../../zenoh-web", location.href).href, {
    // a heartbeat lets the bridge publish our deadman (a zero Twist) if this page dies mid-drive
    heartbeatHz: 5,
    heartbeatMisses: 3,
  });
}
