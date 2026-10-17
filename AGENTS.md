# Notes for agents

If you're making edits, see [docs/fast_edit.md](docs/fast_edit.md): in edit mode an edit hot-loads into the open page in
about a second, so make it and stop (no build, test, reload or screenshot).

Where things are:

- `src/App.tsx`: the page. Its header, then `<Slots />`, then one card per section, in order.
- `src/sections/`: one card each.
  - `Topics.tsx`: Odom; Drive, with the forward / left / right buttons.
  - `Calls.tsx`: Gateway; OtherApp; TalkToDesktop, with the "Send a notification" and "Open the Launcher" buttons.
  - `OwnServer.tsx`: the note input and the "Add note" button.
  - `ZeroCopy.tsx`.
- `src/slots/NN_name.tsx`: a new card or chart goes here, as a default-exported component. `src/charts.tsx` has
  `BarChart` and `LineChart`, and `Section` (`src/sections/Section.tsx`) is the card around it.
- `src/ui.ts`: the component library, dimos-react.
  - `Button` takes `variant`: default, primary, ghost, danger (red), ok (green) or warn.
  - Also `Card`, `Row`, `Column`, `Text` and `Stat`.
  - Colors are Desktop's theme variables: `var(--accent)`, `var(--danger)`, `var(--ok)`, `var(--warn)`,
    `var(--cat-1..4)`, `var(--fg)`, `var(--dim)` and `var(--card)`.
- `backend/main.ts`: the app's own server (`api/...`). It isn't hot-loaded: a change needs the app restarted.
