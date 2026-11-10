import { describe, expect, it } from "vitest";

import { homePathFor, safeNextPath } from "@/lib/paths";

describe("safeNextPath (post-login redirect guard)", () => {
  it.each(["/dashboard", "/check-in/0b6f1c2e-1111-4a4a-9999-000000000000", "/workshops?tab=past"])(
    "allows same-site path %s",
    (path) => {
      expect(safeNextPath(path)).toBe(path);
    },
  );

  it.each([
    ["absolute URL", "https://evil.example/phish"],
    ["protocol-relative URL", "//evil.example"],
    ["backslash trick", "/\\evil.example"],
    ["relative path without slash", "dashboard"],
    ["javascript: URL", "javascript:alert(1)"],
    ["tab injection", "/\t/evil.example"],
    ["newline injection", "/\n/evil.example"],
    ["empty string", ""],
  ])("rejects %s", (_label, path) => {
    expect(safeNextPath(path)).toBeNull();
  });

  it("rejects non-string input", () => {
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath(["/a", "/b"])).toBeNull();
  });
});

describe("homePathFor", () => {
  it("sends each role to its own area", () => {
    expect(homePathFor("student")).toBe("/dashboard");
    expect(homePathFor("organiser")).toBe("/organiser");
  });
});
