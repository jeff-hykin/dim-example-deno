// 7: zero-copy zenoh on the server (backend/zero_copy.ts, zenoh-deno): 8 MiB frames to a second process, copied vs
// through zenoh shared memory. The result is also pushed to every open page on <zenohPrefix>/frontend/zero-copy.
import { useState } from "react";
import { postJson } from "../api.ts";
import { Section } from "./Section.tsx";
import styles from "./OwnServer.module.css";

interface Run {
  mode: "shm" | "copy";
  frameBytes: number;
  frames: number;
  medianLatencyMs: number;
  throughputMiBps: number;
  arrivedAsShm: boolean;
}

export function ZeroCopy() {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setBusy(true);
    try {
      setRuns((await postJson<{ runs: Run[] }>("api/internal/zero-copy", {})).runs);
      setError(null);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section
      title="7 · Zero-copy zenoh on the server"
      note="The server (zenoh-deno) sends camera-sized frames to a second process: copied through a socket, then written once into zenoh shared memory and read in place."
    >
      <button type="button" onClick={run} disabled={busy}>
        {busy ? "Running…" : "Run 30 × 8 MiB frames"}
      </button>
      {error && <p className={styles.error}>✗ {error}</p>}
      {runs && (
        <table>
          <thead>
            <tr>
              <th>path</th>
              <th>median latency</th>
              <th>throughput</th>
              <th>arrived as shared memory</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.mode}>
                <td>{run.mode === "shm" ? "shared memory" : "copied"}</td>
                <td>{run.medianLatencyMs.toFixed(2)} ms</td>
                <td>{(run.throughputMiBps / 1024).toFixed(1)} GiB/s</td>
                <td>{run.arrivedAsShm ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}
