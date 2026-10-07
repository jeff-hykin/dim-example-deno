// Types for the part of zenoh-gateway's browser client this page uses (the client is loaded by URL, see zenoh.ts).
declare module "https://esm.sh/gh/jeff-hykin/zenoh-gateway@28c17f0/client/zenoh_gateway.ts" {
  export type Delivery = "latest" | "reliable";
  export interface Message {
    key: string;
    kind: "put" | "delete";
    bytes: Uint8Array;
    encoding?: string;
    attachment?: Uint8Array;
    timestamp: number;
    seq: number;
  }
  export interface Subscription {
    close(): void;
  }
  export interface Publisher {
    put(value: Uint8Array): void;
    setDeadman(value: Uint8Array): Promise<void>;
    close(): void;
  }
  export interface ZenohGateway {
    subscribe(
      key: string,
      options: { delivery?: Delivery; maxHz?: number },
      callback: (message: Message) => void,
    ): Subscription;
    publisher(key: string, options?: { delivery?: Delivery }): Publisher;
    close(): void;
  }
  export function connect(
    url: string,
    options?: { heartbeatHz?: number; heartbeatMisses?: number },
  ): Promise<ZenohGateway>;
}
