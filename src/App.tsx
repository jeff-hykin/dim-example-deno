import { useEffect, useState } from "react";
import type { ZenohGateway } from "./zenoh.ts";
import { useDesktopTheme } from "./theme.ts";
import { Drive, Odom } from "./sections/Topics.tsx";
import { Gateway, OtherApp, TalkToDesktop } from "./sections/Calls.tsx";
import { OwnServer } from "./sections/OwnServer.tsx";
import styles from "./App.module.css";

export function App({ zenoh }: { zenoh: Promise<ZenohGateway> }) {
  useDesktopTheme();
  const [session, setSession] = useState<ZenohGateway | null>(null);
  const [zenohError, setZenohError] = useState<string | null>(null);
  useEffect(() => {
    zenoh.then(setSession, (error: Error) => setZenohError(error.message));
  }, [zenoh]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>dimOS example app</h1>
        <p className={styles.subtitle}>
          a Deno server + a React page{zenohError && ` · ✗ zenoh-gateway: ${zenohError}`}
        </p>
      </header>
      <main>
        <Odom zenoh={session} />
        <Drive zenoh={session} />
        <Gateway />
        <OtherApp />
        <TalkToDesktop />
        <OwnServer />
      </main>
    </div>
  );
}
