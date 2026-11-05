// Measures real contrast ratios from the tokens in app/globals.css. Used by tests/contrast.test.ts and docs.
import fs from "node:fs";

const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const block = (sel) => {
  const i = css.indexOf(sel + "{");
  return css.slice(i + sel.length + 1, css.indexOf("}", i));
};
const tokens = (b) => Object.fromEntries([...b.matchAll(/--([a-z0-9-]+):([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const dark = tokens(block(":root"));
const light = { ...dark, ...tokens(block(':root[data-theme="light"]')) };

function parse(c) {
  c = c.trim();
  if (c.startsWith("#")) {
    const h = c.length === 4 ? [...c.slice(1)].map((x) => x + x).join("") : c.slice(1);
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  const p = m[1].split(",").map((x) => parseFloat(x));
  return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
}
const over = (fg, bg) => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
});
const lum = ({ r, g, b }) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
export const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

export function matrix() {
  const out = [];
  for (const [theme, t] of [
    ["dark", dark],
    ["light", light],
  ]) {
    const bg = parse(t.bg),
      card = over(parse(t.card), bg),
      fill = over(parse(t.fill), bg);
    const c = (n) => over(parse(t[n]), bg);
    const pairs = [
      ["Body text on page", c("fg"), bg, 4.5],
      ["Muted text on page", c("mut"), bg, 4.5],
      ["Muted text on card", over(parse(t.mut), card), card, 4.5],
      ["Muted text on filled surface", over(parse(t.mut), fill), fill, 4.5],
      ["Highlight phrase on page", c("hl"), bg, 4.5],
      ["Error text on page", c("err"), bg, 4.5],
      ["Link hover colour on page", c("hover"), bg, 4.5],
      ["Button label on button", parse(t["btn-fg"] ?? t.btnfg), parse(t.btn), 4.5],
      ["Input border on page (UI component)", c("field"), bg, 3],
      ["Focus ring on page (UI component)", c("fg"), bg, 3],
    ];
    for (const [name, fg, back, min] of pairs)
      out.push({ theme, name, ratio: Math.round(ratio(fg, back) * 100) / 100, min, pass: ratio(fg, back) >= min });
  }
  return out;
}
if (process.argv[1] && process.argv[1].endsWith("contrast.mjs")) {
  console.log("| Theme | Pair | Ratio | Needs | Result |\n|---|---|---|---|---|");
  for (const r of matrix()) console.log(`| ${r.theme} | ${r.name} | ${r.ratio}:1 | ${r.min}:1 | ${r.pass ? "Pass" : "FAIL"} |`);
}
