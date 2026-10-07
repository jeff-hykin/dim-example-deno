// Look like the Desktop around this page, in every skin, and keep following it: copy this file as is.
// index.html links ../../theme.css: every skin's tokens AND fonts (--sans, --mono, …), so an app adds no font of its own.
// Desktop's docs: docs/apps.md "The page and the shell: insets, opening apps".
import { useEffect, useLayoutEffect, useState } from "react";

export type Corners = "sharp" | "rounded" | "theme";
export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}
export interface DesktopTheme {
  skin: string;
  corners: Corners;
  insets: Insets;
}

// Desktop keeps the skin and corners in localStorage (Desktop's origin, which this page shares)
const SKIN_KEY = "portal.theme";
const CORNERS_KEY = "portal.corners";
const SIDES = ["top", "bottom", "left", "right"] as const;
const NO_INSETS: Insets = { top: 0, bottom: 0, left: 0, right: 0 };

function stored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage unavailable (outside Desktop): theme.css's default skin stays
  }
}

export function readSkin(): string {
  return stored(SKIN_KEY) || "portal";
}

export function readCorners(): Corners {
  return toCorners(stored(CORNERS_KEY));
}

function toCorners(value: unknown): Corners {
  return value === "sharp" || value === "rounded" ? value : "theme";
}

/** Sets html[data-skin], html[data-corners] and --dim-corner-radius: theme.css's rules do the rest. */
export function applyTheme(skin: string, corners: Corners, root = document.documentElement) {
  root.dataset.skin = skin;
  if (corners === "theme") {
    delete root.dataset.corners;
    root.style.removeProperty("--dim-corner-radius");
  } else {
    root.dataset.corners = corners;
    root.style.setProperty("--dim-corner-radius", corners === "rounded" ? "10px" : "0px");
  }
}

/** Sets --dim-inset-top/bottom/left/right: how much of the page the shell covers (its bottom bar). */
export function applyInsets(insets: Insets, root = document.documentElement) {
  for (const side of SIDES) {
    root.style.setProperty(`--dim-inset-${side}`, `${insets[side]}px`);
  }
}

/** The shell's {type: "dimos-inset", top, bottom, left, right} as Insets (bad or missing sides are 0). */
export function insetsFrom(data: Record<string, unknown>): Insets {
  const side = (value: unknown) => Math.max(0, Number(value) || 0);
  return {
    top: side(data.top),
    bottom: side(data.bottom),
    left: side(data.left),
    right: side(data.right),
  };
}

/** Applies Desktop's skin, corners and insets, and follows every change; returns them for canvases and the like. */
export function useDesktopTheme(): DesktopTheme {
  const [theme, setTheme] = useState<DesktopTheme>(() => ({
    skin: readSkin(),
    corners: readCorners(),
    insets: NO_INSETS,
  }));

  // before paint, so the page never shows the default skin first
  useLayoutEffect(() => {
    applyTheme(theme.skin, theme.corners);
    applyInsets(theme.insets);
  }, [theme]);

  useEffect(() => {
    // Desktop saving a new skin or corners (in its page or another tab) is a storage event here
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === SKIN_KEY || event.key === CORNERS_KEY) {
        setTheme((current) => ({ ...current, skin: readSkin(), corners: readCorners() }));
      }
    };
    // the shell posts the insets (on load, on every change, and when asked) and the corners setting
    const onMessage = (event: MessageEvent) => {
      const data = event.data as Record<string, unknown> | null;
      if (event.origin !== location.origin || event.source !== parent || !data) {
        return;
      }
      if (data.type === "dimos-inset") {
        setTheme((current) => ({ ...current, insets: insetsFrom(data) }));
      } else if (data.type === "dimos-corners") {
        setTheme((current) => ({ ...current, corners: toCorners(data.corners) }));
      }
    };
    addEventListener("storage", onStorage);
    addEventListener("message", onMessage);
    let frame = 0;
    if (parent !== globalThis.window) {
      parent.postMessage({ type: "dimos-inset-request" }, location.origin);
      // painted in its theme: the shell fades the frame in now instead of waiting for its load event
      frame = requestAnimationFrame(() =>
        frame = requestAnimationFrame(() =>
          parent.postMessage({ type: "dimos-ready" }, location.origin)
        )
      );
    }
    return () => {
      removeEventListener("storage", onStorage);
      removeEventListener("message", onMessage);
      cancelAnimationFrame(frame);
    };
  }, []);

  return theme;
}
