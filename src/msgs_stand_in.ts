// For the tests only: the gateway's /dimos/msgs.js isn't there offline, so @dimos/msgs (the same LCM wire format, a
// devDependency) stands in for the part of it this page uses; tests hand it to DimApp's `msgs` option.
import { PoseStamped, Twist, Vector3 } from "@dimos/msgs/geometry_msgs";
import type { MsgsModule, MsgType } from "./dim.ts";
import type { MsgInput, Twist as TwistValue } from "./msgs.ts";

const vector = (value?: Partial<Vector3>) => new Vector3({ x: 0, y: 0, z: 0, ...value });

const types: Record<string, MsgType> = {
  "geometry_msgs.PoseStamped": {
    name: "geometry_msgs.PoseStamped",
    decode: (bytes) => PoseStamped.decode(bytes),
    encode: () => {
      throw new Error("not needed by the tests");
    },
    zenohKey: (topic) => `${topic}/geometry_msgs.PoseStamped`,
  },
  "geometry_msgs.Twist": {
    name: "geometry_msgs.Twist",
    decode: (bytes) => Twist.decode(bytes),
    encode: (value) => {
      const { linear, angular } = value as MsgInput<TwistValue>;
      return new Twist({ linear: vector(linear), angular: vector(angular) }).encode();
    },
    zenohKey: (topic) => `${topic}/geometry_msgs.Twist`,
  },
};

const lookup = (name: string): MsgType => {
  const type = types[name];
  if (!type) {
    throw new Error(`no stand-in for ${name}`);
  }
  return type;
};
const typeOfChannel = (key: string) => key.split("/").pop();

export const msgsStandIn: MsgsModule = {
  lookup,
  typeOfChannel,
  decodeChannel: (key, bytes) => lookup(typeOfChannel(key) ?? "").decode(bytes),
};
