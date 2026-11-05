export class CsvError extends Error {
  constructor(
    message: string,
    public line: number,
  ) {
    super(message);
  }
}
export const LIMITS = { maxRows: 1000, maxCols: 40, maxCell: 20_000 };

/** Strict RFC 4180 style parser. Handles quotes, escaped quotes, embedded newlines, CRLF and a BOM. Never evaluates anything. */
export function parseCsv(input: string): { header: string[]; rows: Record<string, string>[] } {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const records: string[][] = [];
  let field = "",
    row: string[] = [],
    inQuotes = false,
    line = 1,
    quoteLine = 1,
    i = 0,
    justClosed = false;
  const endField = () => {
    if (field.length > LIMITS.maxCell) throw new CsvError(`A cell is longer than ${LIMITS.maxCell} characters`, line);
    row.push(field);
    field = "";
    justClosed = false;
    if (row.length > LIMITS.maxCols) throw new CsvError(`More than ${LIMITS.maxCols} columns`, line);
  };
  const endRow = () => {
    endField();
    if (!(row.length === 1 && row[0] === "")) records.push(row);
    row = [];
    if (records.length > LIMITS.maxRows + 1) throw new CsvError(`More than ${LIMITS.maxRows} data rows`, line);
  };
  while (i < text.length) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        justClosed = true;
        i++;
        continue;
      }
      if (ch === "\n") line++;
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      if (field.length || justClosed) throw new CsvError("A quote appears in the middle of a value", line);
      inQuotes = true;
      quoteLine = line;
      i++;
      continue;
    }
    if (ch === ",") {
      endField();
      i++;
      continue;
    }
    if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
      line++;
      i++;
      continue;
    }
    if (justClosed) throw new CsvError("Unexpected text after a closing quote", line);
    field += ch;
    i++;
  }
  if (inQuotes) throw new CsvError("A quoted value is never closed", quoteLine);
  if (field.length || row.length) endRow();
  if (records.length < 2) throw new CsvError("The file needs a header row and at least one data row", 1);
  const header = records[0]!.map((h) => h.trim());
  if (header.some((h) => !/^[A-Za-z][A-Za-z0-9_]*$/.test(h)))
    throw new CsvError("Column names must be letters, numbers and underscores", 1);
  if (new Set(header).size !== header.length) throw new CsvError("Duplicate column names", 1);
  const rows = records.slice(1).map((r, idx) => {
    if (r.length > header.length) throw new CsvError(`Row has ${r.length} values but the header has ${header.length}`, idx + 2);
    const o: Record<string, string> = {};
    header.forEach((h, k) => {
      o[h] = r[k] ?? "";
    });
    return o;
  });
  return { header, rows };
}
