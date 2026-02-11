import { suggestTags, joinFields } from "../../core/tag_suggest.js";

// Minimal S_TAGS fixture (keep aligned with taxonomy semantics)
const S_TAGS = [
  { key:"project_mgmt", label:"项目管理", aliases:["项目推进","排期","进度管理"] },
  { key:"execution", label:"执行力", aliases:["推进落地","推动落地","执行落地"] },
  { key:"writing", label:"文档写作", aliases:["写文档","报告"] },
];

function deriveSTagsFromSavedPayload(j){
  const titles = Array.isArray(j?.titles) ? j.titles : [];
  const ips = Array.isArray(j?.ips) ? j.ips : [];
  const trains = Array.isArray(j?.skill_trainings) ? j.skill_trainings : [];
  const practices = Array.isArray(j?.practices) ? j.practices : [];
  const portfolio = String(j?.portfolio || "").trim();
  const note = String(j?.note || "").trim();
  const raw = joinFields([ ...titles, ...ips, ...trains, ...practices, portfolio, note ]);
  return suggestTags(raw, S_TAGS);
}

function assertEq(name, got, expect){
  const g = JSON.stringify(got);
  const e = JSON.stringify(expect);
  if (g !== e){
    console.error(`[BAD] ${name} =>`, got, "expect", expect);
    process.exitCode = 1;
  }else{
    console.log(`[OK]  ${name} =>`, got);
  }
}

// Case: legacy missing s_tags
const legacy = {
  titles: ["管理师"],
  practices: ["项目推进"],
  note: "我负责推进落地并写文档汇报",
  s_tags: []
};

const derived = deriveSTagsFromSavedPayload(legacy);
// expected ordering follows S_TAGS order; suggestTags preserves tag order
assertEq('derive legacy', derived, ["project_mgmt","execution","writing"]);

if (process.exitCode) {
  console.error("\nSTEP3_S SMOKE FAILED");
  process.exit(1);
} else {
  console.log("\nSTEP3_S SMOKE OK");
}
