// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { applyInsets, applyTheme, insetsFrom, readCorners, readSkin } from "./theme.ts";

describe("theme", () => {
  afterEach(() => localStorage.clear());

  it("reads Desktop's skin and corners, with defaults", () => {
    expect(readSkin()).toBe("portal");
    expect(readCorners()).toBe("theme");
    localStorage.setItem("portal.theme", "research");
    localStorage.setItem("portal.corners", "rounded");
    expect(readSkin()).toBe("research");
    expect(readCorners()).toBe("rounded");
  });

  it("sets data-skin, data-corners and --dim-corner-radius", () => {
    const root = document.createElement("html");
    applyTheme("research", "sharp", root);
    expect(root.dataset.skin).toBe("research");
    expect(root.dataset.corners).toBe("sharp");
    expect(root.style.getPropertyValue("--dim-corner-radius")).toBe("0px");
    applyTheme("research", "theme", root);
    expect(root.dataset.corners).toBeUndefined();
    expect(root.style.getPropertyValue("--dim-corner-radius")).toBe("");
  });

  it("turns the shell's dimos-inset message into --dim-inset-*", () => {
    const root = document.createElement("html");
    applyInsets(insetsFrom({ type: "dimos-inset", bottom: 64, top: "x", left: -3 }), root);
    expect(root.style.getPropertyValue("--dim-inset-bottom")).toBe("64px");
    expect(root.style.getPropertyValue("--dim-inset-top")).toBe("0px");
    expect(root.style.getPropertyValue("--dim-inset-left")).toBe("0px");
  });
});
