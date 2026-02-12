import fs from "node:fs";
import { buildRaw, getTags, getTagsWithEvidence } from "./tag_service.js";

const tax = JSON.parse(fs.readFileSync("./apps/role_fit/data/json/role_fit_taxonomy_v0_1.json","utf-8"));
const K_TAGS = tax.K_TAGS || [];
const S_TAGS = tax.S_TAGS || [];


function assert(cond, msg){
  if (!cond) throw new Error(msg || "assert failed");
}
const svc = {
  buildRaw,
  match(ns, text){
    const dict = (String(ns||"").toUpperCase()==="K") ? K_TAGS : S_TAGS;
    return getTags(text, dict);
  },
  matchWithEvidence(ns, text){
    const dict = (String(ns||"").toUpperCase()==="K") ? K_TAGS : S_TAGS;
    return getTagsWithEvidence(text, dict);
  },
};
const cases = [
  { ns:"S", text:"推进", expect: [] },
  { ns:"S", text:"项目推进", expect: ["project_mgmt"] },
  { ns:"S", text:"我负责推进落地", expect: ["execution"] },
  { ns:"K", text:"数据库查询", expect: ["sql"] },
  { ns:"K", text:"SQL 数据分析", expect: ["sql","data_analysis"] },
];

let failed = 0;
for (const c of cases){
  const got = svc.match(c.ns, c.text);
  const ok = JSON.stringify(got) === JSON.stringify(c.expect);
  if (ok){
    console.log(`[OK] ${c.ns} "${c.text}" =>`, got);
  }else{
    console.log(`[BAD] ${c.ns} "${c.text}" =>`, got, "expect", c.expect);
    failed++;
  }
}

if (failed){
  console.error(`\nTAG_SERVICE SMOKE FAILED: ${failed}`);
  process.exit(1);
}
console.log("\nTAG_SERVICE SMOKE OK");
