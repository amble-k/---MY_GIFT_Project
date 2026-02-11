import fs from "node:fs";
import { suggestTags } from "./tag_suggest.js";

const tax = JSON.parse(fs.readFileSync("./apps/role_fit/data/json/role_fit_taxonomy_v0_1.json", "utf-8"));
const K = tax.K_TAGS || [];
const S = tax.S_TAGS || [];

const cases = [
  // generic verbs should NOT trigger
  ["S", "推进", []],
  ["S", "推动", []],

  // project mgmt should win when phrase exists
  ["S", "项目推进", ["project_mgmt"]],

  // execution phrases should still work
  ["S", "推进落地", ["execution"]],
  ["S", "推动落地", ["execution"]],

  // K examples
  ["K", "数据库查询", ["sql"]],
  ["K", "SQL 数据分析", ["sql", "data_analysis"]],
];

function pickTags(kind){ return kind === "K" ? K : S; }

let ok = 0, bad = 0;
for (const [kind, text, expect] of cases){
  const tags = pickTags(kind);
  const got = suggestTags(text, tags);
  const pass = JSON.stringify(got) === JSON.stringify(expect);
  if (pass) ok++; else bad++;
  console.log(`[${pass ? "OK" : "BAD"}] ${kind} "${text}" =>`, got, "expect", expect);
}

if (bad){
  console.error(`\nSMOKE FAILED: ${bad} failed, ${ok} passed`);
  process.exit(1);
}
console.log(`\nSMOKE OK: ${ok} passed`);
