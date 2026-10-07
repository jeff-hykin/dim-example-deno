// dimos's zenoh keys are `dimos/<topic>/<message type>`; the payload is that message's LCM encoding (@dimos/msgs).
import { PoseStamped, Twist, Vector3 } from "@dimos/msgs/geometry_msgs";

export function topicKey(topic: string, type: string): string {
  return `dimos/${topic.trim().replace(/^\/+/, "")}/${type}`;
}

export interface Pose2d {
  x: number;
  y: number;
  yawDegrees: number;
}

export function decodePose(bytes: Uint8Array): Pose2d {
  const { position, orientation: { x, y, z, w } } = PoseStamped.decode(bytes).pose;
  const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));
  return { x: position.x, y: position.y, yawDegrees: (yaw * 180) / Math.PI };
}

export function encodeTwist(forward: number, turn: number): Uint8Array {
  return new Twist({
    linear: new Vector3({ x: forward, y: 0, z: 0 }),
    angular: new Vector3({ x: 0, y: 0, z: turn }),
  }).encode();
}
