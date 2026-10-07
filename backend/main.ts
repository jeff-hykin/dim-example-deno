// dimos-app-server for the Deno example: serves the built page (`deno task build` -> ../dist) and this app's API on the
// unix socket Desktop gives, and talks zenoh itself (robot.ts, zenoh-deno). Its dependencies are vendored
// (backend/deno.json `vendor: true`), so the nix build runs offline.
//
// What Desktop passes: one env var, DIMOS_APP, a JSON object (Desktop's docs/apps.md, "dimos-app-server"):
//   { version, name, socket, url, path, dataDir, desktopUrl, zenohGatewayUrl, zenohConnect, zenohNamespace, zenohPrefix,
//     dimosDir, dimosPython, recordingsDir }
// Requests arrive with the app's path (/apps/<name>) already removed: "/api/hello", "/", "/assets/index-….js".
//
// The API, as dimos.yaml declares it:
//   GET  /api/hello           public (provides:): who we are, what dimos is running (a call to the gateway from here),
//                             and the robot's odometry summary (robot.ts; also pushed on <zenohPrefix>/frontend/odom)
//   POST /api/notes           public (provides:): the agent adds a note; Desktop shows a notification
//   GET  /api/internal/notes  private: the page lists notes
//   POST /api/internal/notes  private: the page adds one
//   POST /api/internal/zero-copy  private: run the zero-copy demo (zero_copy.ts); also pushed on <zenohPrefix>/frontend/zero-copy

import { startRobot } from "./robot.ts";
import { zeroCopyDemo } from "./zero_copy.ts";

const app = JSON.parse(Deno.env.get("DIMOS_APP") ?? "{}") as {
  name?: string;
  socket?: string;
  dataDir?: string;
  desktopUrl?: string;
  zenohConnect?: string;
  zenohPrefix?: string;
};
const flag = (name: string) => {
  const index = Deno.args.indexOf(`--${name}`);
  return index === -1 ? undefined : Deno.args[index + 1];
};
const frontend = flag("frontend") ?? new URL("../dist", import.meta.url).pathname;
const desktopUrl = app.desktopUrl ?? "http://127.0.0.1:5555";
const dataDir = app.dataDir ?? new URL("../.data", import.meta.url).pathname;
const notesFile = `${dataDir}/notes.json`;

// zenoh failing (no network to fetch its native library on a first run, say) leaves the rest of the app up
const robot = startRobot({
  zenohConnect: app.zenohConnect ?? "",
  zenohPrefix: app.zenohPrefix ?? `dim-example-deno/apps/${app.name ?? "local"}`,
}).catch((error) => {
  console.error(`zenoh: ${error}`);
  return null;
});
// Desktop stops an app with SIGTERM to its process group (SIGKILL 5 s later): close the session so peers drop us at
// once, but give up after 2 s (zenoh's close can wait ~10 s on a peer it found by multicast and can't reach)
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  Deno.addSignalListener(signal, async () => {
    const closed = robot.then((session) => session?.close()).catch(() => {});
    await Promise.race([closed, new Promise((resolve) => setTimeout(resolve, 2000))]);
    Deno.exit(0);
  });
}

// ── state: a JSON file in the app's own data folder (its checkout is replaced on update; dataDir isn't) ──
async function readNotes(): Promise<string[]> {
  try {
    return JSON.parse(await Deno.readTextFile(notesFile));
  } catch {
    return [];
  }
}
async function addNote(text: string): Promise<string[]> {
  const notes = [...await readNotes(), text];
  await Deno.mkdir(dataDir, { recursive: true });
  await Deno.writeTextFile(notesFile, JSON.stringify(notes, null, 2));
  return notes;
}

// ── calls out of the app: Desktop and the dimos gateway (declared in dimos.yaml uses: too) ──
async function desktop(method: string, path: string, body?: unknown) {
  const response = await fetch(`${desktopUrl}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return await response.json();
}

let zeroCopyRun: ReturnType<typeof zeroCopyDemo> | null = null;

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

async function api(request: Request, path: string): Promise<Response | null> {
  const route = `${request.method} ${path}`;
  if (route === "GET /api/hello") {
    const { launch } = await desktop("GET", "/dimos/runs").catch(() => ({ launch: null }));
    return json({
      shape: "Deno",
      app: app.name ?? "dim-example-deno (outside Desktop)",
      time: new Date().toISOString(),
      running: launch ? `${launch.blueprint} (${launch.phase})` : null,
      notes: (await readNotes()).length,
      odom: (await robot)?.summary() ?? null,
    });
  }
  if (route === "POST /api/notes" || route === "POST /api/internal/notes") {
    const { text } = await request.json().catch(() => ({ text: "" }));
    if (typeof text !== "string" || !text.trim()) {
      return json({ error: "a note needs `text`" }, 400);
    }
    const notes = await addNote(text.trim());
    if (route === "POST /api/notes") {
      // the agent added it: tell the person (a server's calls carry no Referer, so they're never refused, but
      // they're declared in dimos.yaml all the same: the contract is the whole app)
      await desktop("POST", "/api/notifications", {
        title: "A note from the agent",
        body: text,
        app: app.name,
      });
    }
    return json({ notes });
  }
  if (route === "POST /api/internal/zero-copy") {
    // camera-sized frames to a second process, copied vs through zenoh shared memory; one run at a time
    zeroCopyRun ??= zeroCopyDemo().finally(() => (zeroCopyRun = null));
    const runs = await zeroCopyRun;
    await (await robot)?.toPage("zero-copy", { type: "zero-copy", runs }).catch(() => {});
    return json({ runs });
  }
  if (route === "GET /api/internal/notes") {
    return json({ notes: await readNotes() });
  }
  return path.startsWith("/api/") ? json({ error: `no ${route}` }, 404) : null;
}

// ── the page: static files from ../dist (vite's build) ──
const types: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript",
  css: "text/css",
  svg: "image/svg+xml",
  json: "application/json",
};
async function file(path: string): Promise<Response> {
  const clean = path.split("/").filter((part) => part && part !== "..").join("/") || "index.html";
  try {
    const bytes = await Deno.readFile(`${frontend}/${clean}`);
    return new Response(bytes, {
      headers: {
        "content-type": types[clean.split(".").pop() ?? ""] ?? "application/octet-stream",
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}

async function serve(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname;
  try {
    return (await api(request, path)) ?? (await file(path));
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
}

if (app.socket) {
  try {
    Deno.removeSync(app.socket);
  } catch {
    // not there
  }
  Deno.serve({
    path: app.socket,
    transport: "unix",
    onListen: () => console.error(`listening on ${app.socket}`),
  }, serve);
} else {
  // outside Desktop: `deno task serve` serves on a port (open http://localhost:8787/)
  Deno.serve({ port: Number(flag("port") ?? 8787) }, serve);
}
