// Topics through Desktop's zenoh-gateway (dimos.yaml: its zenoh-gateway range). zenoh-gateway isn't on
// npm (and isn't open source yet), so the browser loads its client by URL at a pinned commit; Vite
// leaves https:// imports alone. For a robot with no internet, host that file yourself.
import {
  connect,
  type ZenohGateway,
} from "https://esm.sh/gh/jeff-hykin/zenoh-gateway@28c17f0/client/zenoh_gateway.ts";

export type {
  Message,
  Publisher,
  Subscription,
  ZenohGateway,
} from "https://esm.sh/gh/jeff-hykin/zenoh-gateway@28c17f0/client/zenoh_gateway.ts";

export function connectZenoh(): Promise<ZenohGateway> {
  return connect(new URL("../../zenoh-gateway", location.href).href, {
    // a heartbeat lets the gateway publish our deadman (a zero Twist) if this page dies mid-drive
    heartbeatHz: 5,
    heartbeatMisses: 3,
  });
}
