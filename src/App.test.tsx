// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Point, Pose, PoseStamped, Twist } from "@dimos/msgs/geometry_msgs";
import { App } from "./App.tsx";
import { DimApp } from "./dim.ts";
import { msgsStandIn } from "./msgs_stand_in.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Message = { key: string; kind: string; bytes: Uint8Array; timestamp: number; seq: number };

/** A real DimApp over a fake zenoh-gateway client, with @dimos/msgs standing in for /dimos/msgs.js */
function fakeDim() {
  const subscribers = new Map<string, (message: Message) => void>();
  const puts: Uint8Array[] = [];
  const deadmen = new Map<string, Uint8Array>();
  const client = {
    state: "connected",
    options: { heartbeatHz: 5 },
    onState: () => () => {},
    subscribe: (key: string, _options: unknown, callback: (message: Message) => void) => {
      subscribers.set(key, callback);
      return { close: () => subscribers.delete(key) };
    },
    publisher: (key: string) => ({
      key,
      put: (bytes: Uint8Array) => puts.push(bytes),
      setDeadman: (bytes: Uint8Array) => Promise.resolve(void deadmen.set(key, bytes)),
      clearDeadman: () => Promise.resolve(void deadmen.delete(key)),
      close: () => {},
    }),
    close: () => {},
  };
  const discovery = { namespace: "ns", zenohGatewayUrl: "/zenoh-gateway" };
  const dim = new DimApp({
    msgDecodeEndpoint: "../../dimos/msgs.js",
    msgs: msgsStandIn,
    href: "http://localhost/apps/dim-example-deno/",
    fetch: () => Promise.resolve(new Response(JSON.stringify(discovery))),
    connect: () => Promise.resolve(client),
  });
  return { dim, subscribers, puts, deadmen };
}

const answers: Record<string, unknown> = {
  "../../dimos/runs": { launch: { blueprint: "unitree-go2", phase: "running" } },
  "../../apps/dim-controller/api/status": { ok: true },
  "api/hello": { shape: "Deno", notes: 1 },
  "api/internal/notes": { notes: ["first note"] },
};

describe("App", () => {
  let container: HTMLElement;
  let root: Root;
  let dim: DimApp | null = null;

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(new Response(JSON.stringify(answers[url] ?? {}), { status: 200 }))
      ),
    );
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    dim?.zenoh.close(); // the page's one connection is a singleton: the next test gets its own
    dim = null;
  });

  async function render(fake: ReturnType<typeof fakeDim>) {
    dim = fake.dim;
    await act(async () => {
      root.render(<App dim={fake.dim} />);
      // the fetches, discovery and the connection settle inside act
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  it("shows the gateway, the other app and its own server's answers", async () => {
    await render(fakeDim());
    const text = container.textContent ?? "";
    expect(text).toContain('"blueprint": "unitree-go2"');
    expect(text).toContain('"ok": true');
    expect(text).toContain('"shape": "Deno"');
    expect(container.querySelector("li")?.textContent).toBe("first note");
    expect(document.documentElement.dataset.skin).toBe("portal");
  });

  it("subscribes to odom and shows the decoded pose", async () => {
    const fake = fakeDim();
    await render(fake);
    const { subscribers } = fake;
    const key = "dimos/odom/geometry_msgs.PoseStamped";
    const deliver = subscribers.get(key);
    expect(deliver).toBeDefined();
    const bytes = new PoseStamped({
      pose: new Pose({ position: new Point({ x: 1.5, y: -2, z: 0 }) }),
    }).encode();
    await act(() => deliver!({ key, kind: "put", bytes, timestamp: 0, seq: 0 }));
    expect(container.textContent).toContain("1.50");
    expect(container.textContent).toContain("-2.00");
  });

  it("sends nothing on cmd_vel until a button is pressed; a release stops and disarms", async () => {
    const fake = fakeDim();
    await render(fake);
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
    expect([fake.puts.length, fake.deadmen.size]).toEqual([0, 0]);
    const forward = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("forward")
    )!;
    await act(() => {
      forward.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    });
    expect(fake.puts.length).toBe(0); // a hover that leaves sends no stop
    await act(() => {
      forward.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 250)));
    const drive = Twist.decode(fake.puts[0]);
    expect(drive.linear.x).toBeCloseTo(0.3);
    const deadman = Twist.decode(fake.deadmen.get("dimos/cmd_vel/geometry_msgs.Twist")!);
    expect([deadman.linear.x, deadman.angular.z]).toEqual([0, 0]);
    await act(() => {
      forward.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 250)));
    const stopped = Twist.decode(fake.puts.at(-1)!);
    expect([stopped.linear.x, stopped.angular.z]).toEqual([0, 0]);
    expect(fake.deadmen.size).toBe(0);
    const count = fake.puts.length;
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
    expect(fake.puts.length).toBe(count);
  });
});
