// dimos's message codecs: the dimos gateway's GET /dimos/msgs.js (dimos.yaml `@dimos-gateway`), generated from the
// dimos that's running, so it always matches it. The browser loads it from Desktop at run time (Vite leaves a
// computed import() alone); below are the types for the part this page uses (/dimos/msgs.ts has them all).

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}
export interface Quaternion extends Vector3 {
  w: number;
}
export interface PoseStamped {
  pose: { position: Vector3; orientation: Quaternion };
}
export interface Twist {
  linear: Vector3;
  angular: Vector3;
}

/** Any field left out is zero. */
type MsgInput<T> = { [K in keyof T]?: T[K] extends object ? MsgInput<T[K]> : T[K] };

export interface MsgType<T> {
  readonly name: string;
  decode(bytes: Uint8Array): T;
  encode(value: MsgInput<T>): Uint8Array;
  /** "dimos/cmd_vel" -> "dimos/cmd_vel/geometry_msgs.Twist" */
  zenohKey(topic: string): string;
}

export interface DimosMsgs {
  /** a zenoh-gateway message, decoded by the type its key names (undefined for a delete) */
  decodeMessage(message: { key: string; bytes: Uint8Array; kind?: string }): unknown;
  geometry_msgs: { PoseStamped: MsgType<PoseStamped>; Twist: MsgType<Twist> };
}

export function loadMsgs(): Promise<DimosMsgs> {
  return import(/* @vite-ignore */ new URL("../../dimos/msgs.js", location.href).href);
}
