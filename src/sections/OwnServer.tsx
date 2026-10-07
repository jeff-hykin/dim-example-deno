// 6: this app's own server (backend/main.ts), at relative `api/...` URLs
//   GET api/hello     public: listed under dimos.yaml `provides:`, so the agent and other apps may call it too
//   api/internal/*    private: listed under `private:`, only this app's own pages may call it
import { useCallback, useEffect, useState } from "react";
import { json, postJson } from "../api.ts";
import { Output, Section, useLoad } from "./Section.tsx";
import styles from "./OwnServer.module.css";

interface Notes {
  notes: string[];
}

export function OwnServer() {
  const hello = useLoad(() => json("api/hello"));
  const [notes, setNotes] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(
    () =>
      json<Notes>("api/internal/notes").then(
        ({ notes }) => setNotes(notes),
        (error: Error) => setError(error.message),
      ),
    [],
  );
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const addNote = async () => {
    try {
      await postJson<Notes>("api/internal/notes", { text });
      setText("");
      setError(null);
      await loadNotes();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <Section
      title="6 · This app's own server"
      note="GET api/hello is public (dimos.yaml provides:): the agent and other apps may call it. api/internal/* is private: only this app's own pages may."
    >
      <Output value={hello} />
      <div className={styles.row}>
        <input
          placeholder="a note"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && addNote()}
        />
        <button type="button" onClick={addNote}>Add note (private endpoint)</button>
      </div>
      {error && <p className={styles.error}>✗ {error}</p>}
      <ul className={styles.notes}>
        {notes.map((note, index) => <li key={index}>{note}</li>)}
      </ul>
    </Section>
  );
}
