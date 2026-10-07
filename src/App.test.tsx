// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Point, Pose, PoseStamped } from "@dimos/msgs/geometry_msgs";
import type { Message, ZenohGateway } from "./zenoh.ts";
import { App } from "./App.tsx";
import { msgsStandIn } from "./msgs_stand_in.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function fakeZenoh() {
  const subscribers = new Map<string, (message: Message) => void>();
  const puts: Uint8Array[] = [];
  const zenoh: ZenohGateway = {
    subscribe: (key, _options, callback) => {
      subscribers.set(key, callback);
      return { close: () => subscribers.delete(key) };
    },
    publisher: () => ({
      put: (bytes) => puts.push(bytes),
      setDeadman: () => Promise.resolve(),
      close: () => {},
    }),
    close: () => {},
  };
  return { zenoh, subscribers, puts };
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
  });

  async function render(zenoh: ZenohGateway) {
    await act(async () => {
      root.render(<App zenoh={Promise.resolve(zenoh)} msgs={Promise.resolve(msgsStandIn)} />);
      // the fetches and the zenoh/msgs promises settle inside act
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  it("shows the gateway, the other app and its own server's answers", async () => {
    await render(fakeZenoh().zenoh);
    const text = container.textContent ?? "";
    expect(text).toContain('"blueprint": "unitree-go2"');
    expect(text).toContain('"ok": true');
    expect(text).toContain('"shape": "Deno"');
    expect(container.querySelector("li")?.textContent).toBe("first note");
    expect(document.documentElement.dataset.skin).toBe("portal");
  });

  it("subscribes to odom and shows the decoded pose", async () => {
    const { zenoh, subscribers } = fakeZenoh();
    await render(zenoh);
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
});
