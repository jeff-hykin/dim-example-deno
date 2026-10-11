// 7: zero-copy zenoh on the server (backend/zero_copy.ts, zenoh-deno): 8 MiB frames to a second process, copied vs
// through zenoh shared memory. The result is also pushed to every open page on <zenohPrefix>/frontend/zero-copy.
import { useState } from "react";
import { postJson } from "../api.ts";
import { Button, Row, Table, type TableColumn, useToast } from "../ui.ts";
import { Section } from "./Section.tsx";

interface Run {
  mode: "shm" | "copy";
  frameBytes: number;
  frames: number;
  medianLatencyMs: number;
  throughputMiBps: number;
  arrivedAsShm: boolean;
}

const columns: TableColumn<Run>[] = [
  {
    key: "mode",
    label: "path",
    render: (run: Run) => run.mode === "shm" ? "shared memory" : "copied",
  },
  {
    key: "medianLatencyMs",
    label: "median latency",
    align: "right",
    render: (run: Run) => `${run.medianLatencyMs.toFixed(2)} ms`,
  },
  {
    key: "throughputMiBps",
    label: "throughput",
    align: "right",
    render: (run: Run) => `${(run.throughputMiBps / 1024).toFixed(1)} GiB/s`,
  },
  {
    key: "arrivedAsShm",
    label: "arrived as shared memory",
    render: (run: Run) => run.arrivedAsShm ? "yes" : "no",
  },
];

export function ZeroCopy() {
  const toast = useToast();
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      setRuns((await postJson<{ runs: Run[] }>("api/internal/zero-copy", {})).runs);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section
      title="7 · Zero-copy zenoh on the server"
      note="The server (zenoh-deno) sends camera-sized frames to a second process: copied through a socket, then written once into zenoh shared memory and read in place."
    >
      <Row>
        <Button icon="zap" variant="primary" onClick={run} loading={busy} disabled={busy}>
          {busy ? "Running…" : "Run 30 × 8 MiB frames"}
        </Button>
      </Row>
      {runs && <Table columns={columns} rows={runs} rowKey="mode" compact />}
    </Section>
  );
}
