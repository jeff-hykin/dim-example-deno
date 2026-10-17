# Fast edits: hot-loading

In edit mode, Desktop serves this app's page from a Vite dev server instead of its build. A saved edit appears in the
open page in about a second. There is no build, no reload, and the page keeps its state: typed text, open panels, a
live connection. Turn it on with `run/dev app <name>` in Desktop's repo. It works through Desktop's own port, so a phone
or another computer watching the robot's Desktop sees the edit as well.

**For agents.** Make the smallest edit that does it: the edit tool, not a rewrite of the whole file. Then stop. Don't
build, run tests, restart anything, reload the page or take a screenshot to check: the user is watching the change
happen.

## What hot-loads, keeping state

| Change | How | Example |
|---|---|---|
| A component's look or markup | Edit the `.tsx`. React Fast Refresh swaps it in and keeps its state. | "make Send a notification red": `variant="danger"` on that `<Button>` |
| Styles | A `style={{...}}` prop, or a `.css` file imported from code (its `<style>` is swapped in place) | `style={{ background: "var(--danger)" }}` |
| Theme colors | Use Desktop's CSS variables (`var(--accent)`, `var(--danger)`, `var(--cat-1)`) rather than hex values, so a skin change follows | |
| A new card or chart | A new file `src/slots/NN_name.tsx` that default-exports a component. It is mounted under the header with no other change. | see below |
| Text, labels, layout, adding or removing sections | Edit `App.tsx` or a section file | "move the Drive card to the top" |
| Data or config the page imports (`.json`, or a `.ts` of constants that only components use) | Edit it. Its importers re-run. | |

### Slots: a chart in seconds

```tsx
// src/slots/10_battery.tsx
import { BarChart } from "../charts.tsx";
import { Section } from "../sections/Section.tsx";

export default function Battery() {
  return (
    <Section title="Battery by robot">
      <BarChart unit="%" data={[{ label: "go2", value: 82 }, { label: "g1", value: 64 }]} />
    </Section>
  );
}
```

- The charts in `src/charts.tsx` are `BarChart` and `LineChart`. They take data as `{label, value}[]`.
- To show live data instead, `useLoad(() => json("api/..."))` from `sections/Section.tsx` works in a slot too.

## What still reloads the page, and why

| Change | Why | Instead |
|---|---|---|
| `index.html`, `vite.config.ts`, `package.json` | Outside the module graph, or the dev server restarts | Rarely needed for a UI change |
| A new npm dependency | Vite re-bundles its dependencies, then reloads once | Use what's loaded: dimos-react (`src/ui.ts`), `src/charts.tsx` |
| `src/main.tsx`, `src/dim.ts` (the connection), or a module that only they import | Nothing above them accepts the update | Put UI in components |
| A `.tsx` that exports something other than components (a constant, a hook object, a function) | Fast Refresh can only swap a file of components. With anything else it re-runs the importers or reloads, and state is lost. | Keep helpers in a `.ts` file |
| `backend/main.ts` | It's the server, not the page | Restart the app (Desktop → the app's menu → Restart) |

A syntax or type error in a save shows Vite's error overlay over the page. It clears itself with the next good save, so
fix the file; there's nothing to reload.
