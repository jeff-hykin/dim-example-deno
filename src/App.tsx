import { useEffect, useState } from "react";
import type { DimApp } from "./dim.ts";
import { Drive, Odom } from "./sections/Topics.tsx";
import { Gateway, OtherApp, TalkToDesktop } from "./sections/Calls.tsx";
import { OwnServer } from "./sections/OwnServer.tsx";
import { ZeroCopy } from "./sections/ZeroCopy.tsx";
import { Slots } from "./Slots.tsx";
import { Column, Heading, Text } from "./ui.ts";

export function App({ dim }: { dim: DimApp }) {
  const [msgsError, setMsgsError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  useEffect(() => {
    dim.msgsReady.then((msgs) => setMsgsError(msgs ? null : "no /dimos-gateway/msgs.js"));
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
    <Column
      gap={14}
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "16px 16px calc(16px + var(--dim-inset-bottom, 0px))",
      }}
    >
      <header>
        {/* inside Desktop, its window bar already names the app */}
        {parent === self && <Heading level={1}>dimOS example app</Heading>}
        <Text muted small tone={error ? "danger" : undefined}>
          a Deno server + a React page{error && ` · ✗ ${error}`}
        </Text>
      </header>
      <Slots />
      <Odom dim={dim} />
      <Drive dim={dim} />
      <Gateway />
      <OtherApp />
      <TalkToDesktop />
      <OwnServer />
      <ZeroCopy />
    </Column>
  );
}
