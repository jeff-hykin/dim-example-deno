// What the page does with the dimos messages DimApp decodes (and the plain objects it encodes).
import type { MsgInput, PoseStamped, Twist } from "./msgs.ts";

export interface Pose2d {
  x: number;
  y: number;
  yawDegrees: number;
}

export function toPose2d({ pose: { position, orientation: { x, y, z, w } } }: PoseStamped): Pose2d {
  const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));
  return { x: position.x, y: position.y, yawDegrees: (yaw * 180) / Math.PI };
}

/** fields left out are zero */
export function twist(forward: number, turn: number): MsgInput<Twist> {
  return { linear: { x: forward }, angular: { z: turn } };
}
