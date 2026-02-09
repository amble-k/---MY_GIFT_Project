import { loadTaxonomy, loadJobModels } from "/apps/role_fit/core/data_loader.js";

console.log("[STEP6_DEBUG] origin=", location.origin);
console.log("[STEP6_DEBUG] ROLE_FIT keys=", Object.keys(localStorage).filter(k=>k.includes("ROLE_FIT")).sort());
["ROLE_FIT_STEP1_ROLE_V3","ROLE_FIT_STEP2_K_V1","ROLE_FIT_STEP3_S_V1","ROLE_FIT_STEP4_A_V1","ROLE_FIT_STEP4_A_V0_1","ROLE_FIT_STEP5_H_V1"].forEach(k=>{
  try{ console.log("[STEP6_DEBUG] getItem", k, "=>", localStorage.getItem(k)); }catch(e){ console.log("[STEP6_DEBUG] getItem", k, "=> ERR", e); }
});

// Phase2: load JSON data sources (taxonomy/job_models)
let DATA_SOURCES = null;
(async ()=>{
  try{
    DATA_SOURCES = await loadDataSources();
    window.__ROLE_FIT_DATA__ = DATA_SOURCES; // debug hook
    console.log("[STEP6_DEBUG] DATA_SOURCES loaded", {
      taxonomy_type: Array.isArray(DATA_SOURCES.taxonomy) ? "array" : typeof DATA_SOURCES.taxonomy,
      jobModels_keys: DATA_SOURCES.jobModels ? Object.keys(DATA_SOURCES.jobModels) : null,
    });
  }catch(e){
    console.error("[STEP6_DEBUG] DATA_SOURCES load failed", e);
  }
})();


/**
 * ROLE FIT Step6 Eval (pipeline runnable first)
 * - reads: Step0..5 localStorage
 * - computes: K/S/A/H + overall (A as multiplicative axis)
 * - shows: summary + raw payload preview
 */

const KEY_STEP1 = "ROLE_FIT_STEP1_ROLE_V3";
const KEY_K     = "ROLE_FIT_STEP2_K_V1";
const KEY_S     = "ROLE_FIT_STEP3_S_V1";
const KEY_A_V1  = "ROLE_FIT_STEP4_A_V1";
const KEY_A_V01 = "ROLE_FIT_STEP4_A_V0_1";
const KEY_H_V1  = "ROLE_FIT_STEP5_H_V1";
const KEY_H_V01 = "ROLE_FIT_STEP5_H_V0_1";

const el = (id)=>document.getElementById(id);

function safeJsonParse(s){
  try{ return JSON.parse(s); }catch(e){ return null; }
}
function loadOne(key){
  return safeJsonParse(localStorage.getItem(key) || "null");
}
function loadAny(keys){
  for (const k of keys){
    const v = loadOne(k);
    if (v) return {key:k, data:v};
  }
  return {key:"", data:null};
}

// Data sources (Phase2: JSON via fetch)
async function loadDataSources(){
  // Primary: JSON via fetch (Phase2)
  try{
    const [taxonomy, jobModels] = await Promise.all([
      loadTaxonomy(),
      loadJobModels(),
    ]);
    return { taxonomy, jobModels, source: "json" };
  }catch(e){
    console.error("[DATA_LOADER] JSON fetch failed (no JS fallback in Phase2)", e);
    throw e;
  }
}

function uniq(arr){
  return Array.from(new Set((arr||[]).map(x=>String(x||"").trim()).filter(Boolean)));
}
function toSet(arr){
  return new Set(uniq(arr));
}
function coverage(userTags, requiredTags){
  const req = uniq(requiredTags);
  if (!req.length) return { score: 0, detail:{ mode:"no_required", required:[], hit:[] } };
  const u = toSet(userTags);
  const hit = req.filter(t=>u.has(String(t)));
  const score = hit.length / req.length;
  return { score: clamp01(score), detail:{ mode:"coverage", required:req, hit } };
}
function findJobModel(jobModels, key){
  const models = (jobModels && typeof jobModels==="object") ? (jobModels.models || jobModels) : null;
  const k = String(key||"");
  if (Array.isArray(models)) return models.find(m=>String(m?.key||m?.id||"")===k) || null;
  return null;
}

function clamp01(x){
  const n = Number(x);
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
function avg(nums){
  const a = (nums||[]).map(Number).filter(n=>isFinite(n));
  if (!a.length) return 0;
  return a.reduce((s,n)=>s+n,0)/a.length;
}
function countNonEmpty(arr){
  if (!Array.isArray(arr)) return 0;
  return arr.map(x=>String(x||"").trim()).filter(Boolean).length;
}

/** --- scoring (v0.1, runnable) --- */
function scoreK(kPayload){
  // 必填：edu_level/major1 作为“基础门槛”；其余作为加分
  if (!kPayload) return {score:0, detail:{missing:true}};
  const p = kPayload.payload || kPayload; // 兼容不同包裹结构
  const edu = String(p.edu_level || p.eduLevel || "").trim();
  const major1 = String(p.major1 || "").trim();

  const certN  = countNonEmpty(p.certs || p.cert_list || []);
  const trainN = countNonEmpty(p.trains || p.train_list || []);
  const major2 = String(p.major2 || "").trim();
  const note   = String(p.note || "").trim();

  let base = 0;
  let okRequired = true;
  if (!edu) okRequired = false;
  if (!major1) okRequired = false;

  // 基础门槛：有必填 -> 0.55；否则 -> 0.2（仍可继续）
  base = okRequired ? 0.55 : 0.2;

  // 加分项（先简单可计算）
  let bonus = 0;
  bonus += Math.min(0.20, certN * 0.05);
  bonus += Math.min(0.15, trainN * 0.03);
  if (major2) bonus += 0.05;
  if (note) bonus += 0.05;

  const score = clamp01(base + bonus);
  return {score, detail:{okRequired, edu, major1, certN, trainN, hasMajor2:!!major2}};
}

function scoreS(sPayload){
  if (!sPayload) return {score:0, detail:{missing:true}};
  const p = sPayload.payload || sPayload;

  const titleN   = countNonEmpty(p.titles || p.title_list || []);
  const ipN      = countNonEmpty(p.ips || p.ip_list || []);
  const trainN   = countNonEmpty(p.skill_trains || p.skillTrainList || p.skill_train_list || []);
  const pracN    = countNonEmpty(p.practices || p.practice_list || []);
  const portfolio= String(p.portfolio || "").trim();
  const note     = String(p.note || "").trim();

  // 简单可计算：条目越多越好，但上限封顶
  let score = 0.25; // 只要进到 S 页就给一点基线
  score += Math.min(0.25, titleN * 0.05);
  score += Math.min(0.20, ipN * 0.05);
  score += Math.min(0.20, trainN * 0.04);
  score += Math.min(0.20, pracN * 0.04);
  if (portfolio) score += 0.05;
  if (note) score += 0.05;

  score = clamp01(score);
  return {score, detail:{titleN, ipN, trainN, pracN, hasPortfolio:!!portfolio}};
}

function scoreA(aPayload){
  if (!aPayload) return {score:0, detail:{missing:true}};
  const p = aPayload.payload || aPayload;
  const a = p.a_score || p;
  // 优先 fit_overall，否则用 A_vector 平均
  const fit = a.fit_overall;
  if (isFinite(Number(fit))) return {score:clamp01(fit), detail:{mode:"fit_overall"}};

  const v = a.A_vector || a.vector || null;
  if (v && typeof v === "object"){
    const vals = Object.values(v).map(Number).filter(n=>isFinite(n));
    const m = avg(vals);
    return {score:clamp01(m), detail:{mode:"avg_vector"}};
  }
  return {score:0, detail:{mode:"unknown"}};
}

function scoreH(hPayload){
  if (!hPayload) return {score:0, detail:{missing:true}};
  const p = hPayload.payload || hPayload;
  const h = p.h_profile || p.h || p;
  // 兼容：可能是 dims: [{id,score}] 或 object {id:score}
  let vals = [];
  if (Array.isArray(h.dims)){
    vals = h.dims.map(x=>Number(x.score)).filter(n=>isFinite(n));
  } else if (h && typeof h === "object"){
    vals = Object.values(h).map(Number).filter(n=>isFinite(n));
  }
  if (!vals.length) return {score:0, detail:{mode:"empty"}};
  const m = avg(vals) / 100;
  return {score:clamp01(m), detail:{mode:"avg_0_100"}};
}

function overall(A_fit, K_coverage, S_coverage, H_fit){
  // Fixed interface (Phase2 → Phase3 scoring): A is multiplicative axis
  // overall = (A_fit ^ alpha) * (wK*K_coverage + wS*S_coverage + wH*H_fit)
  const alpha = 1.0;
  const wK = 0.45, wS = 0.35, wH = 0.20;

  const base = (wK * K_coverage) + (wS * S_coverage) + (wH * H_fit);
  const axis = Math.pow(clamp01(A_fit), alpha);
  return clamp01(axis * clamp01(base));
}

function pct(x){ return Math.round(clamp01(x)*100); }

function main(){
  const box = el("summaryBox");
  const raw = el("rawBox");

  const step1 = loadOne(KEY_STEP1);
  const k = loadOne(KEY_K);
  const s = loadOne(KEY_S);
  const a = loadAny([KEY_A_V1, KEY_A_V01]).data;
  const h = loadAny([KEY_H_V1, KEY_H_V01]).data;

    // K/S as coverage: user tags cover job required tags
  const jobKey = step1?.job_key || step1?.payload?.job_key || "";
  const jm = findJobModel(DATA_SOURCES?.jobModels, jobKey);
  const K = coverage(k?.k_tags || k?.payload?.k_tags || [], jm?.required_k_tags || []);
  const S = coverage(s?.s_tags || s?.payload?.s_tags || [], jm?.required_s_tags || []);
  const A = scoreA(a);
  const H = scoreH(h);

  const O = overall(A.score, K.score, S.score, H.score);

  const roleLabel =
    step1?.job_custom_title ||
    step1?.job_label ||
    step1?.payload?.job_custom_title ||
    step1?.payload?.job_label ||
    "";

  const html = `
    <div style="font-weight:800;font-size:18px;margin-bottom:8px;">Step6 · 岗位胜任度评估（v0.1 可运行）</div>
    <div style="color:rgba(14,18,32,.65);line-height:1.6;margin-bottom:10px;">
      目标岗位：<b>${String(roleLabel||"").replaceAll("<","&lt;")}</b>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="cardmini">
        <div class="k">总胜任度</div>
        <div class="v">${pct(O)}%</div>
        <div class="h">公式：A^α × (wK·K + wS·S + wH·H)</div>
      </div>
      <div class="cardmini">
        <div class="k">A（天赋/性格）</div>
        <div class="v">${pct(A.score)}%</div>
        <div class="h">${A.detail?.mode || ""}</div>
      </div>
      <div class="cardmini">
        <div class="k">K（知识）</div>
        <div class="v">${pct(K.score)}%</div>
        <div class="h">覆盖:${(K.detail?.hit||[]).length}/${(K.detail?.required||[]).length}</div>
      </div>
      <div class="cardmini">
        <div class="k">S（技能）</div>
        <div class="v">${pct(S.score)}%</div>
        <div class="h">职称:${S.detail?.titleN||0} 实作:${S.detail?.pracN||0}</div>
      </div>
      <div class="cardmini">
        <div class="k">H（习惯）</div>
        <div class="v">${pct(H.score)}%</div>
        <div class="h">${H.detail?.mode || ""}</div>
      </div>
      <div class="cardmini">
        <div class="k">数据完整性</div>
        <div class="v">${[
          step1 ? "Role✓" : "Role×",
          k ? "K✓" : "K×",
          s ? "S✓" : "S×",
          a ? "A✓" : "A×",
          h ? "H✓" : "H×",
        ].join(" / ")}</div>
        <div class="h">缺项会拉低总分（A 为空则总分为 0）</div>
      </div>
    </div>
  `;

  box.innerHTML = html;

  const rawObj = {
    keys:{
      step1: KEY_STEP1,
      k: KEY_K,
      s: KEY_S,
      a_try:[KEY_A_V1, KEY_A_V01],
      h_try:[KEY_H_V1, KEY_H_V01],
    },
    scores:{
      overall: O,
      A: A.score, K: K.score, S: S.score, H: H.score,
      detail:{A:A.detail, K:K.detail, S:S.detail, H:H.detail}
    },
    data:{
      step1, k, s, a, h
    }
  };

  raw.textContent = JSON.stringify(rawObj, null, 2);
}

main();
