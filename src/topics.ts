// dimos's zenoh keys are `dimos/<topic>/<message type>`; the payload is that message's LCM encoding (msgs.ts).
import type { DimosMsgs, PoseStamped } from "./msgs.ts";

/** "/odom" -> "dimos/odom", for MsgType.zenohKey */
export function topicPath(topic: string): string {
  return `dimos/${topic.trim().replace(/^\/+/, "")}`;
}

export interface Pose2d {
  x: number;
  y: number;
  yawDegrees: number;
}

export function toPose2d({ pose: { position, orientation: { x, y, z, w } } }: PoseStamped): Pose2d {
  const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));
  return { x: position.x, y: position.y, yawDegrees: (yaw * 180) / Math.PI };
}

export function encodeTwist(msgs: DimosMsgs, forward: number, turn: number): Uint8Array {
  // fields left out are zero
  return msgs.geometry_msgs.Twist.encode({ linear: { x: forward }, angular: { z: turn } });
}
