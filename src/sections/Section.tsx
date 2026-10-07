import { type ReactNode, useEffect, useState } from "react";
import styles from "./Section.module.css";

export function Section(
  { title, note, children }: { title: string; note?: ReactNode; children: ReactNode },
) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      {note && <p className={styles.note}>{note}</p>}
      {children}
    </section>
  );
}

/** A value as pretty JSON, or "✗ <message>" for an error. */
export function Output({ value }: { value: Result }) {
  const text = value === undefined
    ? "…"
    : value instanceof Error
    ? `✗ ${value.message}`
    : JSON.stringify(value, null, 2);
  return <pre className={styles.output}>{text}</pre>;
}

export type Result = unknown;

/** Runs `load` once and holds its value (undefined while loading, an Error if it failed). */
export function useLoad(load: () => Promise<unknown>): Result {
  const [value, setValue] = useState<Result>(undefined);
  useEffect(() => {
    let live = true;
    load().then(
      (result) => live && setValue(result),
      (error) => live && setValue(error instanceof Error ? error : new Error(String(error))),
    );
    return () => {
      live = false;
    };
  }, []); // once per mount: `load` is a fresh closure every render
  return value;
}
