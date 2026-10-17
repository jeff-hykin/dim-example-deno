// Slots: every src/slots/*.tsx's default export, as its own card under the header, in file-name order. Adding, editing
// or deleting a slot file hot-loads (the glob's importer, this file, is Fast-Refreshed): the fastest way to add a chart
// or panel. docs/fast_edit.md#slots
import type { ComponentType } from "react";
import { Column } from "./ui.ts";

const modules = import.meta.glob<{ default: ComponentType }>("./slots/*.tsx", { eager: true });

export function Slots() {
  const slots = Object.entries(modules).sort(([a], [b]) => a.localeCompare(b));
  if (!slots.length) {
    return null;
  }
  return (
    <Column gap={14}>
      {slots.map(([path, module]) => <module.default key={path} />)}
    </Column>
  );
}
