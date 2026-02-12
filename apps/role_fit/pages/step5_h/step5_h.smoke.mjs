import fs from "node:fs";

const tax = JSON.parse(fs.readFileSync("apps/role_fit/data/json/role_fit_taxonomy_v0_1.json","utf-8"));
const H_DIMS = tax.H_DIMS || tax.h_dims || [];

function clamp01(x){
  const n = Number(x);
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
function scoreToPct(score1to5){
  const x = Number(score1to5);
  if (!isFinite(x)) return 0;
  const v = Math.round((Math.max(1, Math.min(5, x)) / 5) * 100);
  return v;
}
function calcOverall(dims){
  const vals = (dims||[]).map(x=>Number(x.score)).filter(n=>isFinite(n));
  if (!vals.length) return 0;
  const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
  return clamp01(avg / 100);
}

function buildItemsFromTaxonomy(){
  const fallback = [
    { id:"punctuality",  label:"守时与可靠性",        left:"经常拖延", right:"高度守时" },
    { id:"followthrough",label:"坚持与闭环",          left:"容易中断", right:"强闭环" },
    { id:"planning",     label:"计划性",              left:"随性推进", right:"强规划" },
    { id:"execution",    label:"执行推进",            left:"推进慢",   right:"推进快" },
    { id:"reflection",   label:"复盘习惯",            left:"很少复盘", right:"经常复盘" },
    { id:"stability",    label:"稳定性/抗波动",       left:"易波动",   right:"很稳定" },
  ];
  const src = (Array.isArray(H_DIMS) && H_DIMS.length) ? H_DIMS : fallback;
  const items = [];
  src.forEach(it=>{
    if (!it) return;
    const id = String(it.id || it.key || "").trim();
    if (!id) return;
    items.push({
      id,
      label: String(it.label || it.name || "").trim() || id,
      left: String(it.left || it.min_label || "").trim(),
      right: String(it.right || it.max_label || "").trim(),
    });
  });
  return items;
}

function assert(cond, msg){
  if (!cond) throw new Error(msg);
}

try{
  const ITEMS = buildItemsFromTaxonomy();
  assert(Array.isArray(ITEMS) && ITEMS.length >= 6, `ITEMS invalid length=${ITEMS?.length}`);

  // build dims with all 3/5 -> 60
  const dims = ITEMS.map(it => ({ id: it.id, score: scoreToPct(3) }));
  const fit = calcOverall(dims);

  assert(dims.length === ITEMS.length, "dims length mismatch");
  assert(fit > 0.5 && fit < 0.7, `fit_overall unexpected=${fit}`);

  console.log("[OK] H_DIMS_n =", H_DIMS.length, "ITEMS_n =", ITEMS.length);
  console.log("[OK] fit_overall =", Number(fit.toFixed(2)), "expect around 0.6");
  console.log("\nSTEP5_H SMOKE OK");
}catch(e){
  console.error("\nSTEP5_H SMOKE FAILED:", e?.message || e);
  process.exit(1);
}
