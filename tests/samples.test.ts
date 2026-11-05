import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { stageImport } from "@/lib/content/import/pipeline";
import { admin, fresh, makeSource } from "./content-helpers";

const dir = path.join(process.cwd(), "docs/samples");
const run = (file: string, kind: "questions" | "companies") => {
  const s = makeSource({ permission: "APPROVED", type: "OPEN_DATASET", url: `https://example.org/${file}` });
  return stageImport({
    actor: admin,
    kind,
    sourceId: s.id,
    filename: file,
    mime: file.endsWith(".json") ? "application/json" : "text/csv",
    bytes: new Uint8Array(fs.readFileSync(path.join(dir, file))),
  });
};

describe("documented sample import files", () => {
  beforeEach(() => fresh(true));
  it.each([
    ["questions.csv", "questions", { total: 3, valid: 3, invalid: 0, duplicate: 0 }],
    ["questions-with-errors.csv", "questions", { total: 4, valid: 1, invalid: 2, duplicate: 1 }],
    ["questions.json", "questions", { total: 2, valid: 2, invalid: 0, duplicate: 0 }],
    ["companies.csv", "companies", { total: 2, valid: 2, invalid: 0, duplicate: 0 }],
    ["companies.json", "companies", { total: 1, valid: 1, invalid: 0, duplicate: 0 }],
  ] as const)("%s previews as documented", (file, kind, expected) => {
    const job = run(file, kind);
    expect(job.status).toBe("PREVIEWED");
    expect(job.counts).toMatchObject(expected);
  });
  it("reports the documented rows for the error sample", () => {
    const rows = Object.fromEntries(run("questions-with-errors.csv", "questions").staged.map((r) => [r.row, r.status]));
    expect(rows).toEqual({ 2: "VALID", 3: "INVALID", 4: "INVALID", 5: "DUPLICATE" });
  });
  it("every sample record is clearly labeled as an example", () => {
    for (const f of fs.readdirSync(dir).filter((x) => /\.(csv|json)$/.test(x)))
      expect(fs.readFileSync(path.join(dir, f), "utf8")).toContain("[Example]");
  });
});
