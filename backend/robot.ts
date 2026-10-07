// The server's own zenoh session (zenoh-deno: zenoh in this process, no bridge): it hears the robot's odometry
// straight off dimos's zenoh network, keeps a running summary, and pushes it to this app's pages on
// `<zenohPrefix>/frontend/odom` (the pages hear it through Desktop's zenoh-gateway, docs/events.md).
import { Config, open, type Session } from "@robotics/zenoh-deno";
import { PoseStamped } from "@dimos/msgs/geometry_msgs";

export interface OdomSummary {
  type: "odom";
  messages: number;
  meters: number; // distance driven since the server started
  speed: number; // m/s, over the last two poses
  x: number;
  y: number;
}

/** zenohConnect: "" = a peer on the local network (multicast scouting), else a client of that endpoint. */
export async function startRobot(
  { zenohConnect, zenohPrefix, odomKey = "dimos/odom/geometry_msgs.PoseStamped" }: {
    zenohConnect: string;
    zenohPrefix: string;
    odomKey?: string;
  },
): Promise<{
  summary: () => OdomSummary;
  toPage: (topic: string, value: unknown) => Promise<void>;
  close: () => Promise<void>;
}> {
  // 1.6.2: what Desktop's zenoh-gateway runs (1.7.0-1.10.1 can deadlock answering admin-space queries)
  const session: Session = await open(new Config(zenohConnect), { zenohVersion: "1.6.2" });
  const summary: OdomSummary = { type: "odom", messages: 0, meters: 0, speed: 0, x: 0, y: 0 };
  let last: { x: number; y: number; t: number } | null = null;
  await session.declareSubscriber(odomKey, {
    handler: (sample) => {
      // payloads >= 4 KiB arrive as views on zenoh's memory (no copy); a PoseStamped is ~100 bytes
      const { header, pose: { position } } = PoseStamped.decode(sample.payload().toBytes());
      const t = header.stamp.sec + header.stamp.nsec / 1e9;
      if (last) {
        const step = Math.hypot(position.x - last.x, position.y - last.y);
        summary.meters += step;
        summary.speed = t > last.t ? step / (t - last.t) : summary.speed;
      }
      last = { x: position.x, y: position.y, t };
      Object.assign(summary, { messages: summary.messages + 1, x: position.x, y: position.y });
    },
  });
  const publisher = await session.declarePublisher(`${zenohPrefix}/frontend/odom`);
  const timer = setInterval(() => publisher.put(JSON.stringify(summary)).catch(() => {}), 500);
  return {
    summary: () => ({ ...summary }),
    toPage: (topic, value) =>
      session.put(`${zenohPrefix}/frontend/${topic}`, JSON.stringify(value)),
    close: async () => {
      clearInterval(timer);
      await session.close();
    },
  };
}
