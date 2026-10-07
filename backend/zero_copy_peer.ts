// The other side of zero_copy.ts: a second zenoh participant in its own process (a stand-in for another dimos
// module on this machine). It subscribes to <key>, and prints one JSON line per frame: did it arrive as shared
// memory, and how long after the server's put.
//   deno run -A zero_copy_peer.ts <endpoint> <key> <count>
import { Config, open } from "@robotics/zenoh-deno";

const [endpoint, key, countText] = Deno.args;
const count = Number(countText);
const session = await open(
  Config.fromObject({
    mode: "peer",
    connect: { endpoints: [endpoint] },
    listen: { endpoints: [] },
    scouting: { multicast: { enabled: false } },
  }),
  { zenohVersion: "1.6.2" },
);
let received = 0;
const finished = Promise.withResolvers<void>();
await session.declareSubscriber(key, {
  handler: (sample) => {
    const payload = sample.payload();
    const bytes = payload.toBytes(); // a view on the shared memory itself when isShm()
    const sentAt = new DataView(bytes.buffer, bytes.byteOffset, 8).getFloat64(0, true);
    const latencyMs = performance.timeOrigin + performance.now() - sentAt;
    console.log(
      JSON.stringify({ shm: payload.isShm(), zeroCopy: payload.isZeroCopy(), latencyMs }),
    );
    payload.release(); // hand the memory back now, not at the next garbage collection
    if (++received >= count) finished.resolve();
  },
});
console.log(JSON.stringify({ ready: true }));
await finished.promise;
await session.close();
