// Types for the part of zenoh-web's browser client this page uses (the client is loaded by URL, see zenoh.ts).
declare module "https://esm.sh/gh/jeff-hykin/zenoh-web@63b72dd/client/zenoh_web.ts" {
  export type Delivery = "latest" | "reliable";
  export interface Message {
    key: string;
    bytes: Uint8Array;
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
  export interface ZenohWeb {
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
  ): Promise<ZenohWeb>;
}
