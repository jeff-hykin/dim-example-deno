import { describe, expect, it } from "vitest";
import { Pose, PoseStamped, Quaternion, Twist } from "@dimos/msgs/geometry_msgs";
import { toPose2d, twist } from "./topics.ts";
import { msgsStandIn } from "./msgs_stand_in.ts";

describe("topics", () => {
  it("turns a PoseStamped into x, y and yaw", () => {
    const half = Math.SQRT1_2; // a 90° turn about z
    const bytes = new PoseStamped({
      pose: new Pose({ orientation: new Quaternion({ x: 0, y: 0, z: half, w: half }) }),
    }).encode();
    const pose = toPose2d(PoseStamped.decode(bytes));
    expect(pose.x).toBe(0);
    expect(pose.yawDegrees).toBeCloseTo(90);
  });

  it("makes a Twist that encodes and decodes back", () => {
    const bytes = msgsStandIn.lookup("geometry_msgs.Twist").encode(twist(0.3, -0.6));
    const decoded = Twist.decode(bytes);
    expect(decoded.linear.x).toBeCloseTo(0.3);
    expect(decoded.angular.z).toBeCloseTo(-0.6);
  });
});
