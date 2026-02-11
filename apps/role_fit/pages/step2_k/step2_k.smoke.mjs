import fs from "node:fs";

// Minimal assert helpers
function sameSet(a,b){
  const A=[...(a||[])].sort().join(",");
  const B=[...(b||[])].sort().join(",");
  return A===B;
}
function ok(name, cond, detail=""){
  if (!cond){
    console.error("[BAD]", name, detail);
    process.exitCode = 1;
  } else {
    console.log("[OK] ", name);
  }
}

// ---- load taxonomy + suggest engine ----
const tax = JSON.parse(fs.readFileSync("apps/role_fit/data/json/role_fit_taxonomy_v0_1.json","utf-8"));
const { suggestTags, joinFields } = await import("../../../core/tag_suggest.js");
const K_TAGS = tax.K_TAGS || [];

// ---- copy the deterministic derive logic (must match step2_k.js) ----
function deriveKTagsFromSavedPayload(j){
  const eText = String(j?.edu_level_text || "").trim();
  const m1Text = String(j?.major1_text || "").trim();
  const m2Text = String(j?.major2_text || "").trim();
  const certs = Array.isArray(j?.certs) ? j.certs : [];
  const trainings = Array.isArray(j?.trainings) ? j.trainings : [];
  const n = String(j?.note || "").trim();

  const raw = joinFields([eText, m1Text, m2Text, ...certs, ...trainings, n]);
  return suggestTags(raw, K_TAGS);
}

// ---- test: legacy payload missing k_tags ----
const legacy = {
  edu_level_text: "本科",
  major1_text: "应用心理学",
  major2_text: "人力资源管理",
  trainings: ["SQL 数据分析 统计 行业领域"],
  certs: [],
  note: ""
};

const got = deriveKTagsFromSavedPayload(legacy);
console.log("[SMOKE] derive legacy =>", got);

// We expect at least these (ordering not important)
const expect = ["sql","data_analysis","statistics","industry_domain"];
ok("contains expected core tags", expect.every(t=>got.includes(t)), { got, expect });

// If you want strict set equality, uncomment:
// ok("exact match", sameSet(got, expect), { got, expect });

if (process.exitCode) {
  console.error("\nSTEP2_K SMOKE FAILED");
  process.exit(process.exitCode);
}
console.log("\nSTEP2_K SMOKE OK");
