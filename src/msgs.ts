// Types for the dimos messages this page uses; DimApp decodes and encodes them with the dimos gateway's
// GET /dimos/msgs.js (/dimos/msgs.ts has every type).

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
export type MsgInput<T> = { [K in keyof T]?: T[K] extends object ? MsgInput<T[K]> : T[K] };
