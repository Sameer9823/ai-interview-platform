import { describe, expect, it } from "vitest";
import { matrix } from "../scripts/contrast.mjs";

describe("design token contrast (measured from app/globals.css)", () => {
  type Row = { theme: string; name: string; ratio: number; min: number; pass: boolean };
  const rows = matrix() as unknown as Row[];
  it("covers both themes", () => {
    expect(new Set(rows.map((r) => r.theme))).toEqual(new Set(["dark", "light"]));
  });
  for (const r of rows)
    it(`${r.theme}: ${r.name} is at least ${r.min}:1 (is ${r.ratio}:1)`, () => {
      expect(r.ratio).toBeGreaterThanOrEqual(r.min);
    });
});
