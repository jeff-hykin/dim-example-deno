import { describe, expect, it } from "vitest";
import { Pose, PoseStamped, Quaternion, Twist } from "@dimos/msgs/geometry_msgs";
import { encodeTwist, topicPath, toPose2d } from "./topics.ts";
import { msgsStandIn } from "./msgs_stand_in.ts";

describe("topics", () => {
  it("builds dimos's zenoh topic path from a topic name", () => {
    expect(topicPath("/odom")).toBe("dimos/odom");
    expect(msgsStandIn.geometry_msgs.Twist.zenohKey(topicPath(" cmd_vel "))).toBe(
      "dimos/cmd_vel/geometry_msgs.Twist",
    );
  });

  it("turns a PoseStamped into x, y and yaw", () => {
    const half = Math.SQRT1_2; // a 90° turn about z
    const bytes = new PoseStamped({
      pose: new Pose({ orientation: new Quaternion({ x: 0, y: 0, z: half, w: half }) }),
    }).encode();
    const pose = toPose2d(msgsStandIn.geometry_msgs.PoseStamped.decode(bytes));
    expect(pose.x).toBe(0);
    expect(pose.yawDegrees).toBeCloseTo(90);
  });

  it("encodes a Twist that decodes back", () => {
    const twist = Twist.decode(encodeTwist(msgsStandIn, 0.3, -0.6));
    expect(twist.linear.x).toBeCloseTo(0.3);
    expect(twist.angular.z).toBeCloseTo(-0.6);
  });
});
