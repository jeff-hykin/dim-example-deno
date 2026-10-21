// Topics through Desktop's zenoh-gateway (dimos.yaml: its zenoh-gateway range) with dim-app's DimApp, vendored into
// ./dim-app (dim-app's tools/vendor.js), so nothing loads from the network. DimApp holds the page's one zenoh-gateway
// connection and the dimos gateway's codec GET /dimos-gateway/msgs.js (dimos.yaml `@dimos-gateway`), generated from the dimos
// that's running, so it always matches it: subscribe() hands over decoded messages, publish()/publisher() encode.
// @ts-types="./dim-app/source/dim_app.d.ts"
import { DimApp } from "./dim-app/source/dim_app.js";

export { DimApp };
// @ts-types="./dim-app/source/dim_app.d.ts"
export type { DimPublisher, MsgsModule, MsgType } from "./dim-app/source/dim_app.js";

export function connectDimApp(): DimApp {
  return new DimApp({
    msgDecodeEndpoint: "../../dimos-gateway/msgs.js",
    // a heartbeat lets the gateway publish our deadman (a zero Twist) if this page dies mid-drive
    connectOptions: { heartbeatHz: 5, heartbeatMisses: 3 },
  });
}
