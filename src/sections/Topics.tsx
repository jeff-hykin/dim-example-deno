// 1 + 2: subscribe to a topic and decode it, publish one (dimos.yaml `zenoh-web:`)
import { useEffect, useRef, useState } from "react";
import type { Publisher, ZenohWeb } from "../zenoh.ts";
import { decodePose, encodeTwist, type Pose2d, topicKey } from "../topics.ts";
import { Section } from "./Section.tsx";
import styles from "./Topics.module.css";

export function Odom({ zenoh }: { zenoh: ZenohWeb | null }) {
  const [topic, setTopic] = useState("odom");
  const [pose, setPose] = useState<Pose2d | null>(null);
  const [hz, setHz] = useState<number | null>(null);

  useEffect(() => {
    if (!zenoh) {
      return;
    }
    let count = 0;
    let since = performance.now();
    const key = topicKey(topic, "geometry_msgs.PoseStamped");
    const subscription = zenoh.subscribe(key, { delivery: "latest", maxHz: 20 }, (message) => {
      setPose(decodePose(message.bytes));
      count++;
      const now = performance.now();
      if (now - since > 1000) {
        setHz((count * 1000) / (now - since));
        count = 0;
        since = now;
      }
    });
    return () => subscription.close();
  }, [zenoh, topic]);

  return (
    <Section
      title="1 · Subscribe to a topic and decode it"
      note={
        <>
          zenoh-web → <code>dimos/{topic}/geometry_msgs.PoseStamped</code> → @dimos/msgs
        </>
      }
    >
      <div className={styles.grid}>
        <Stat label="x" value={pose?.x.toFixed(2)} />
        <Stat label="y" value={pose?.y.toFixed(2)} />
        <Stat label="yaw" value={pose && `${pose.yawDegrees.toFixed(0)}°`} />
        <Stat label="rate" value={hz !== null ? `${hz.toFixed(1)} Hz` : undefined} />
      </div>
      <TopicInput value={topic} onChange={setTopic} />
    </Section>
  );
}

export function Drive({ zenoh }: { zenoh: ZenohWeb | null }) {
  const [topic, setTopic] = useState("cmd_vel");
  const [sent, setSent] = useState(0);
  const publisher = useRef<Publisher | null>(null);
  const driving = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!zenoh) {
      return;
    }
    const opened = zenoh.publisher(topicKey(topic, "geometry_msgs.Twist"), { delivery: "latest" });
    // armed on the bridge: published for us if this page stops heartbeating
    opened.setDeadman(encodeTwist(0, 0)).catch((error) => console.error(error));
    publisher.current = opened;
    return () => {
      clearInterval(driving.current);
      opened.close();
      publisher.current = null;
    };
  }, [zenoh, topic]);

  const hold = (forward: number, turn: number) => ({
    onPointerDown: () => {
      clearInterval(driving.current);
      driving.current = setInterval(() => {
        publisher.current?.put(encodeTwist(forward, turn));
        setSent((count) => count + 1);
      }, 100);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
  });
  function stop() {
    if (driving.current !== undefined) {
      clearInterval(driving.current);
      driving.current = undefined;
      publisher.current?.put(encodeTwist(0, 0));
    }
  }

  return (
    <Section
      title="2 · Publish a topic"
      note={
        <>
          hold a button: a <code>geometry_msgs.Twist</code> at 10 Hz on{" "}
          <code>dimos/{topic}/geometry_msgs.Twist</code>; a zero Twist is armed as the deadman
        </>
      }
    >
      <div className={styles.row}>
        <button type="button" className={styles.drive} {...hold(0.3, 0)}>▲ forward</button>
        <button type="button" className={styles.drive} {...hold(0, 0.6)}>⟲ left</button>
        <button type="button" className={styles.drive} {...hold(0, -0.6)}>⟳ right</button>
      </div>
      <TopicInput value={topic} onChange={setTopic} />
      {sent > 0 && <p className={styles.sent}>sent {sent} Twists</p>}
    </Section>
  );
}

function Stat({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className={styles.stat}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value ?? "—"}</span>
    </div>
  );
}

/** A topic name, applied on Enter or blur (re-subscribing on every keystroke would churn the bridge). */
function TopicInput({ value, onChange }: { value: string; onChange: (topic: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <label className={styles.topic}>
      topic{" "}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => onChange(draft)}
        onKeyDown={(event) => event.key === "Enter" && onChange(draft)}
      />
    </label>
  );
}
