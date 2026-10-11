// 6: this app's own server (backend/main.ts), at relative `api/...` URLs
//   GET api/hello     public: listed under dimos.yaml `provides:`, so the agent and other apps may call it too
//   api/internal/*    private: listed under `private:`, only this app's own pages may call it
import { useCallback, useEffect, useState } from "react";
import { json, postJson } from "../api.ts";
import { Button, EmptyState, List, ListRow, Row, TextInput, useToast } from "../ui.ts";
import { Output, Section, useLoad } from "./Section.tsx";

interface Notes {
  notes: string[];
}

export function OwnServer() {
  const toast = useToast();
  const hello = useLoad(() => json("api/hello"));
  const [notes, setNotes] = useState<string[]>([]);
  const [text, setText] = useState("");

  const loadNotes = useCallback(
    () =>
      json<Notes>("api/internal/notes").then(
        ({ notes }) => setNotes(notes),
        (error: Error) => toast.error(error.message),
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
      await loadNotes();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Section
      title="6 · This app's own server"
      note="`GET api/hello` is public (dimos.yaml `provides:`): the agent and other apps may call it. `api/internal/*` is private: only this app's own pages may."
    >
      <Output value={hello} />
      <Row wrap>
        <TextInput placeholder="a note" value={text} onChange={setText} onEnter={addNote} />
        <Button icon="plus" onClick={addNote}>Add note (private endpoint)</Button>
      </Row>
      {notes.length
        ? (
          <List>
            {notes.map((note, index) => <ListRow key={index} title={note} />)}
          </List>
        )
        : <EmptyState title="No notes yet" />}
    </Section>
  );
}
