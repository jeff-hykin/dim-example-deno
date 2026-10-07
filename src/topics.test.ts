import { describe, expect, it } from "vitest";
import { Pose, PoseStamped, Quaternion, Twist } from "@dimos/msgs/geometry_msgs";
import { decodePose, encodeTwist, topicKey } from "./topics.ts";

describe("topics", () => {
  it("builds dimos's zenoh key from a topic name", () => {
    expect(topicKey("/odom", "geometry_msgs.PoseStamped")).toBe(
      "dimos/odom/geometry_msgs.PoseStamped",
    );
    expect(topicKey(" cmd_vel ", "geometry_msgs.Twist")).toBe("dimos/cmd_vel/geometry_msgs.Twist");
  });

  it("decodes a PoseStamped into x, y and yaw", () => {
    const half = Math.SQRT1_2; // a 90° turn about z
    const bytes = new PoseStamped({
      pose: new Pose({ orientation: new Quaternion({ x: 0, y: 0, z: half, w: half }) }),
    }).encode();
    const pose = decodePose(bytes);
    expect(pose.x).toBe(0);
    expect(pose.yawDegrees).toBeCloseTo(90);
  });

  it("encodes a Twist that decodes back", () => {
    const twist = Twist.decode(encodeTwist(0.3, -0.6));
    expect(twist.linear.x).toBeCloseTo(0.3);
    expect(twist.angular.z).toBeCloseTo(-0.6);
  });
});
