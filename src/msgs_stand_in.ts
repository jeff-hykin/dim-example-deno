// For the tests only: the gateway's /dimos/msgs.js isn't there offline, so @dimos/msgs (the same LCM wire format, a
// devDependency) stands in for the part of it msgs.ts types.
import { PoseStamped, Twist, Vector3 } from "@dimos/msgs/geometry_msgs";
import type { DimosMsgs, MsgType, PoseStamped as Pose, Twist as TwistValue } from "./msgs.ts";

const zenohKey = (name: string) => (topic: string) => `${topic}/${name}`;
const vector = (value?: Partial<Vector3>) => new Vector3({ x: 0, y: 0, z: 0, ...value });

const poseStamped: MsgType<Pose> = {
  name: "geometry_msgs.PoseStamped",
  decode: (bytes) => PoseStamped.decode(bytes),
  encode: () => {
    throw new Error("not needed by the tests");
  },
  zenohKey: zenohKey("geometry_msgs.PoseStamped"),
};
const twist: MsgType<TwistValue> = {
  name: "geometry_msgs.Twist",
  decode: (bytes) => Twist.decode(bytes),
  encode: ({ linear, angular }) =>
    new Twist({ linear: vector(linear), angular: vector(angular) }).encode(),
  zenohKey: zenohKey("geometry_msgs.Twist"),
};

export const msgsStandIn: DimosMsgs = {
  decodeMessage: ({ key, bytes }) => {
    const type = [poseStamped, twist].find(({ name }) => key.endsWith(`/${name}`));
    if (!type) {
      throw new Error(`no stand-in for ${key}`);
    }
    return type.decode(bytes);
  },
  geometry_msgs: { PoseStamped: poseStamped, Twist: twist },
};
