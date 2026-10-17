# Notes for agents

If you're making edits, see [docs/fast_edit.md](docs/fast_edit.md): in edit mode an edit hot-loads
into the open page in about a second, so make it and stop (no build, test, reload or screenshot).

## Quick recipes: one edit each, no reading around

- **A button's color** ("make Send a notification red"): give that `<Button>` a `variant`: `danger`
  (red), `ok` (green), `warn` or `primary`. The buttons are listed under "Where things are" below.
- **A new chart or card** ("add a bar chart of ..."): write one new file, `src/slots/NN_name.tsx`,
  and nothing else (don't read the other files first). It appears under the header.

  ```tsx
  import { BarChart } from "../charts.tsx"; // or LineChart, with the same props
  import { Section } from "../sections/Section.tsx";

  export default function Battery() {
    return (
      <Section title="Battery by robot">
        <BarChart unit="%" data={[{ label: "go2", value: 82 }, { label: "g1", value: 64 }]} />
      </Section>
    );
  }
  ```

  `BarChart` and `LineChart` take `data` (`{label, value}[]`), and optionally `unit`, `height` and
  `color`.

## Where things are

- `src/App.tsx`: the page. Its header, then `<Slots />`, then one card per section, in order.
- `src/sections/`: one card each.
  - `Topics.tsx`: Odom; Drive, with the forward / left / right buttons.
  - `Calls.tsx`: Gateway; OtherApp; TalkToDesktop, with the "Send a notification" and "Open the
    Launcher" buttons.
  - `OwnServer.tsx`: the note input and the "Add note" button.
  - `ZeroCopy.tsx`.
- `src/slots/NN_name.tsx`: a new card or chart goes here, as a default-exported component.
  `src/charts.tsx` has `BarChart` and `LineChart`, and `Section` (`src/sections/Section.tsx`) is the
  card around it.
- `src/ui.ts`: the component library, dimos-react.
  - `Button` takes `variant`: default, primary, ghost, danger (red), ok (green) or warn.
  - Also `Card`, `Row`, `Column`, `Text` and `Stat`.
  - Colors are Desktop's theme variables: `var(--accent)`, `var(--danger)`, `var(--ok)`,
    `var(--warn)`, `var(--cat-1..4)`, `var(--fg)`, `var(--dim)` and `var(--card)`.
- `backend/main.ts`: the app's own server (`api/...`). It isn't hot-loaded: a change needs the app
  restarted.
