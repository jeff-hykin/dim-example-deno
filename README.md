# dim-example-deno

A showcase [dimOS Desktop](https://github.com/jeff-hykin/dimos-desktop-mirror) app: React.js, Vite,
Deno Server. Pick it when the app needs to read files, zero-copy zenoh topics, run parallel
background jobs, etc. It shows how to:

- subscribe to a dimos topic and decode it (`/odom`, a `geometry_msgs.PoseStamped`, via
  zenoh-gateway + [@dimos/msgs](https://jsr.io/@dimos/msgs))
- publish one (`/cmd_vel`, a `geometry_msgs.Twist`, with a deadman)
- call the dimos gateway (`GET /dimos/runs`) and another app's public endpoint
  (`GET /apps/dim-controller/api/status`)
- post a Desktop notification and open another app
- offer endpoints for the agent (`provides: endpoints:`) and private ones for its own page
  (`provides: private:`)
- look like Desktop in every skin (`src/theme.ts`: `useDesktopTheme()`)
- talk zenoh from the Deno server itself ([zenoh-deno](https://github.com/jeff-hykin/zenoh-deno)):
  it hears `/odom` straight off dimos's network and pushes a distance/speed summary to the page,
  and its zero-copy demo sends 8 MiB frames to a second process copied vs through zenoh shared memory

Read
**[Making a dimOS app](https://github.com/jeff-hykin/dimos-desktop-mirror/blob/main/docs/create-apps/index.md)**
(in the dimOS Desktop repo) for how dimOS apps work. The other examples:
[plain HTML](https://github.com/jeff-hykin/dim-example-html) ·
[Deno](https://github.com/jeff-hykin/dim-example-deno) ·
[Rust](https://github.com/jeff-hykin/dim-example-rust).

## Install it

Desktop → App Store → **Install From URL** → `github.com/jeff-hykin/dim-example-deno`.

## Files

- `dimos.yaml`: the contract with Desktop (what it calls, what it offers)
- `icon.svg`: its icon
- `flake.nix`: `nix build .#dimosApp` is what Desktop runs (installs `deno.lock`'s packages, builds
  the page, vendors the server's packages, takes zenoh-deno and its native libraries from its release
  tarball, wraps the server: no network at run time)
- `index.html`, `src/`: the page, React + Vite + TypeScript (`src/theme.ts` makes it look like
  Desktop, `src/sections/` is one file per thing it shows)
- `backend/main.ts`: the server; it serves the built page from `dist/`. `backend/robot.ts`: its zenoh
  session (odom), `backend/zero_copy.ts`: the zero-copy demo

## Develop

```sh
deno install
deno task build && deno task serve   # http://localhost:8787 (or `deno task dev` for Vite's hot reload, next to it)
deno task check && deno task test && deno fmt && deno lint
```
