// Zero-copy across processes: this server writes camera-sized frames into zenoh shared memory and a second process
// (zero_copy_peer.ts) reads them in place. The same frames are also sent the ordinary way (copied through the
// socket) to compare. dimos doesn't publish over zenoh shared memory yet, so this demo has both ends.
import { Config, CongestionControl, open, Reliability, ShmProvider } from "@robotics/zenoh-deno";

export interface ZeroCopyRun {
  mode: "shm" | "copy";
  frameBytes: number;
  frames: number;
  medianLatencyMs: number;
  throughputMiBps: number;
  arrivedAsShm: boolean;
}

function freePort(): number {
  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  const { port } = listener.addr as Deno.NetAddr;
  listener.close();
  return port;
}

async function run(mode: "shm" | "copy", frameBytes: number, frames: number): Promise<ZeroCopyRun> {
  const endpoint = `tcp/127.0.0.1:${freePort()}`;
  // its own loopback session: shared memory is per-machine, and this keeps the demo off the robot's network
  const session = await open(
    Config.fromObject({
      mode: "peer",
      listen: { endpoints: [endpoint] },
      scouting: { multicast: { enabled: false } },
    }),
    { zenohVersion: "1.6.2" },
  );
  const key = `zero-copy-demo/${mode}`;
  const peer = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      "--no-lock",
      "--config",
      new URL("./deno.json", import.meta.url).pathname,
      new URL("./zero_copy_peer.ts", import.meta.url).pathname,
      endpoint,
      key,
      String(frames),
    ],
    stdout: "piped",
    stderr: "inherit",
  }).spawn();
  const lines = peer.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(splitLines())
    .getReader();
  try {
    if (!JSON.parse((await lines.read()).value ?? "{}").ready) {
      throw new Error("the peer process didn't start");
    }
    const publisher = await session.declarePublisher(key, {
      congestionControl: CongestionControl.BLOCK,
      reliability: Reliability.RELIABLE,
    });
    for (let i = 0; i < 100 && !(await publisher.matchingStatus()).matching(); i++) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    const provider = mode === "shm"
      ? await ShmProvider.create(frameBytes * 4, { zenohVersion: "1.6.2" })
      : null;
    const plain = new Uint8Array(frameBytes);
    const latencies: number[] = [];
    let allShm = true;
    const started = performance.now();
    for (let n = 0; n < frames; n++) {
      // a real producer renders the frame straight into buffer.bytes(); here only the timestamp is written
      const frame = provider ? await provider.allocAsync(frameBytes) : null;
      const bytes = frame ? frame.bytes() : plain;
      new DataView(bytes.buffer, bytes.byteOffset, 8).setFloat64(
        0,
        performance.timeOrigin + performance.now(),
        true,
      );
      await publisher.put(frame ?? plain);
      const { value } = await lines.read(); // one frame in flight: wait for the peer
      const reply = JSON.parse(value ?? "{}");
      latencies.push(reply.latencyMs);
      allShm &&= reply.shm === true;
    }
    const seconds = (performance.now() - started) / 1000;
    await publisher.undeclare();
    provider?.close();
    latencies.sort((a, b) => a - b);
    return {
      mode,
      frameBytes,
      frames,
      medianLatencyMs: latencies[Math.floor(latencies.length / 2)],
      throughputMiBps: (frameBytes * frames) / (1 << 20) / seconds,
      arrivedAsShm: allShm,
    };
  } finally {
    await peer.status;
    await session.close();
  }
}

function splitLines(): TransformStream<string, string> {
  let rest = "";
  return new TransformStream({
    transform(chunk, controller) {
      const parts = (rest + chunk).split("\n");
      rest = parts.pop() ?? "";
      parts.filter(Boolean).forEach((line) => controller.enqueue(line));
    },
  });
}

/** The same frames copied, then through shared memory (default: 30 frames of 8 MiB, about a 4K RGB image). */
export async function zeroCopyDemo(frameMiB = 8, frames = 30): Promise<ZeroCopyRun[]> {
  return [await run("copy", frameMiB << 20, frames), await run("shm", frameMiB << 20, frames)];
}

if (import.meta.main) {
  console.table(await zeroCopyDemo(Number(Deno.args[0] ?? 8), Number(Deno.args[1] ?? 30)));
}
