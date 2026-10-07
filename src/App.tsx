import { useEffect, useState } from "react";
import type { ZenohGateway } from "./zenoh.ts";
import type { DimosMsgs } from "./msgs.ts";
import { useDesktopTheme } from "./theme.ts";
import { Drive, Odom } from "./sections/Topics.tsx";
import { Gateway, OtherApp, TalkToDesktop } from "./sections/Calls.tsx";
import { OwnServer } from "./sections/OwnServer.tsx";
import { ZeroCopy } from "./sections/ZeroCopy.tsx";
import styles from "./App.module.css";

export function App(
  { zenoh, msgs }: { zenoh: Promise<ZenohGateway>; msgs: Promise<DimosMsgs> },
) {
  useDesktopTheme();
  const [session, setSession] = useState<ZenohGateway | null>(null);
  const [codecs, setCodecs] = useState<DimosMsgs | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    zenoh.then(setSession, (error: Error) => setError(`zenoh-gateway: ${error.message}`));
  }, [zenoh]);
  useEffect(() => {
    msgs.then(setCodecs, (error: Error) => setError(`no /dimos/msgs.js (${error.message})`));
  }, [msgs]);

  return (
    <div className={styles.page}>
      <header>
        {/* inside Desktop, its window bar already names the app */}
        {window.parent === window && <h1 className={styles.heading}>dimOS example app</h1>}
        <p className={styles.subtitle}>
          a Deno server + a React page{error && ` · ✗ ${error}`}
        </p>
      </header>
      <main>
        <Odom zenoh={session} msgs={codecs} />
        <Drive zenoh={session} msgs={codecs} />
        <Gateway />
        <OtherApp />
        <TalkToDesktop />
        <OwnServer />
        <ZeroCopy />
      </main>
    </div>
  );
}
