import { type ReactNode, useEffect, useState } from "react";
import { Card, CodeBlock, Column, Field, Markdown, Text, TextInput } from "../ui.ts";

/** A card with a numbered title and a one-line note (markdown: `code` shows as code). */
export function Section(
  { title, note, children }: { title: string; note?: string; children: ReactNode },
) {
  return (
    <Card title={title}>
      <Column gap={10}>
        {note && (
          <Text muted small>
            <Markdown inline text={note} />
          </Text>
        )}
        {children}
      </Column>
    </Card>
  );
}

/** A value as pretty JSON, or "✗ <message>" for an error. */
export function Output({ value }: { value: Result }) {
  const code = value === undefined
    ? "…"
    : value instanceof Error
    ? `✗ ${value.message}`
    : JSON.stringify(value, null, 2);
  return <CodeBlock code={code} language="json" maxHeight={160} />;
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

/** A topic name, applied on Enter or blur (re-subscribing on every keystroke would churn the bridge). */
export function TopicInput(
  { value, onChange }: { value: string; onChange: (topic: string) => void },
) {
  const [draft, setDraft] = useState(value);
  return (
    <Field label="topic" inline>
      <TextInput
        value={draft}
        mono
        onChange={setDraft}
        onEnter={(text: string) => onChange(text.trim())}
        onBlur={() => onChange(draft.trim())}
      />
    </Field>
  );
}
