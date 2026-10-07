import { useEffect, useState } from "react";
import type { DimApp } from "./dim.ts";
import { useDesktopTheme } from "./theme.ts";
import { Drive, Odom } from "./sections/Topics.tsx";
import { Gateway, OtherApp, TalkToDesktop } from "./sections/Calls.tsx";
import { OwnServer } from "./sections/OwnServer.tsx";
import { ZeroCopy } from "./sections/ZeroCopy.tsx";
import styles from "./App.module.css";

export function App({ dim }: { dim: DimApp }) {
  useDesktopTheme();
  const [msgsError, setMsgsError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  useEffect(() => {
    dim.msgsReady.then((msgs) => setMsgsError(msgs ? null : "no /dimos/msgs.js"));
  }, [dim]);
  // DimApp reconnects by itself; say so while the link is down
  useEffect(
    () =>
      dim.zenoh.onState((state) =>
        setLinkError(state === "lost" ? "zenoh-gateway: link lost" : null)
      ),
    [dim],
  );
  const error = msgsError ?? linkError;

  return (
    <div className={styles.page}>
      <header>
        {/* inside Desktop, its window bar already names the app */}
        {parent === self && <h1 className={styles.heading}>dimOS example app</h1>}
        <p className={styles.subtitle}>
          a Deno server + a React page{error && ` · ✗ ${error}`}
        </p>
      </header>
      <main>
        <Odom dim={dim} />
        <Drive dim={dim} />
        <Gateway />
        <OtherApp />
        <TalkToDesktop />
        <OwnServer />
        <ZeroCopy />
      </main>
    </div>
  );
}
