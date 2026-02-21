import { loadTaxonomy, loadContextMap } from "/apps/role_fit/core/data_loader.js";console.log("[STEP6_DEBUG] origin=", location.origin);
import { buildRaw, getTagsWithEvidence } from "/apps/role_fit/core/tag_service.js";

// ---- globals for taxonomy tags (Step6) ----
let TAXONOMY = null;
let K_TAGS = [];
let S_TAGS = [];

// ---- tag-service helpers (Step6 centralized matching + evidence) ----
function __rf_buildKRawFromSaved(k){
  if (!k || typeof k !== "object") return "";
  const eText = String(k.edu_level_text || "").trim();
  const m1Text = String(k.major1_text || "").trim();
  const m2Text = String(k.major2_text || "").trim();
  const certs = Array.isArray(k.certs) ? k.certs : [];
  const trainings = Array.isArray(k.trainings) ? k.trainings : [];
  const n = String(k.note || "").trim();
  return buildRaw([eText, m1Text, m2Text, ...certs, ...trainings, n]);
}

function __rf_buildSRawFromSaved(sv){
  if (!sv || typeof sv !== "object") return "";
  const titles = Array.isArray(sv.titles) ? sv.titles : [];
  const ips = Array.isArray(sv.ips) ? sv.ips : [];
  const trains = Array.isArray(sv.skill_trainings) ? sv.skill_trainings : [];
  const practices = Array.isArray(sv.practices) ? sv.practices : [];
  const p = String(sv.portfolio || "").trim();
  const n = String(sv.note || "").trim();
  return buildRaw([ ...titles, ...ips, ...trains, ...practices, p, n ]);
}

function __rf_evidenceToHtml(ev, map){
  const arr = Array.isArray(ev) ? ev : [];
  if (!arr.length) return "";
  // show top 8 evidence lines
  return arr.slice(0, 8).map(x=>{
    const tag = String(x?.tag||"");
    const label = map && tag in map ? map[tag] : tag;
    const by = String(x?.matchedBy||"");
    const mode = String(x?.mode||"");
    return `<div style="margin-top:4px;">· <b>${label}</b> ← <code>${by}</code> <span style="color:rgba(14,18,32,.55)">(${mode})</span></div>`;
  }).join("");
}

console.log("[STEP6_DEBUG] ROLE_FIT keys=", Object.keys(localStorage).filter(k=>k.includes("ROLE_FIT")).sort());
["ROLE_FIT_STEP1_ROLE_V3","ROLE_FIT_STEP2_K_V1","ROLE_FIT_STEP3_S_V1","ROLE_FIT_STEP4_A_V1","ROLE_FIT_STEP4_A_V0_1","ROLE_FIT_STEP5_H_V1"].forEach(k=>{
  try{ console.log("[STEP6_DEBUG] getItem", k, "=>", localStorage.getItem(k)); }catch(e){ console.log("[STEP6_DEBUG] getItem", k, "=> ERR", e); }
});

// Phase2: load JSON data sources (taxonomy/job_models)
let DATA_SOURCES = null;
let POLICY = null;
(async ()=>{
  try{
    DATA_SOURCES = await loadDataSources();
    window.__ROLE_FIT_DATA__ = DATA_SOURCES; // debug hook
      try{ POLICY = DATA_SOURCES?.policy || null; }catch(e){ POLICY = null; }
    
// ---- bind taxonomy tags (K/S) for Step6 ----
try{
  TAXONOMY = (DATA_SOURCES && (DATA_SOURCES.taxonomy || DATA_SOURCES.TAXONOMY)) || null;
  if (Array.isArray(TAXONOMY)){
    // tolerate legacy shape (array)
    K_TAGS = TAXONOMY;
    S_TAGS = TAXONOMY;
  }else if (TAXONOMY && typeof TAXONOMY === "object"){
    K_TAGS = TAXONOMY.K_TAGS || TAXONOMY.k_tags || TAXONOMY.tags || [];
    S_TAGS = TAXONOMY.S_TAGS || TAXONOMY.s_tags || [];
  }
  console.log("[STEP6_DEBUG] STEP6 taxonomy bound", { k_n: Array.isArray(K_TAGS)?K_TAGS.length:0, s_n: Array.isArray(S_TAGS)?S_TAGS.length:0 });
}catch(e){
  console.warn("[STEP6_DEBUG] STEP6 taxonomy bind failed", e);
}

console.log("[STEP6_DEBUG] DATA_SOURCES loaded", {
      taxonomy_type: Array.isArray(DATA_SOURCES.taxonomy) ? "array" : typeof DATA_SOURCES.taxonomy,
      jobModels_keys: DATA_SOURCES.jobModels ? Object.keys(DATA_SOURCES.jobModels) : null,
    });
  }catch(e){
    console.error("[STEP6_DEBUG] DATA_SOURCES load failed", e);
  }finally{
    try{ main(); }catch(e){ console.error("[STEP6_DEBUG] main\(\) failed", e); }
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
    const [taxonomy, jobModels, policy] = await Promise.all([
loadTaxonomy(),
      fetch("/apps/role_fit/data/json/job_models_v0_2.json", { cache: "no-store" }).then(r=>r.json()),
  fetch("/apps/role_fit/data/json/role_fit_policy_v0_1.json", { cache: "no-store" }).then(r=>r.json()),
]);
return { taxonomy, jobModels, policy, source: "json" };
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

// ---- tag label helpers ----
function buildTagMap(tags){
  const m = {};
  (tags||[]).forEach(t=>{
    if (!t) return;
    const key = String(t.key||t.id||t.value||"").trim();
    const label = String(t.label||t.name||t.title||key).trim();
    if (key) m[key] = label || key;
  });
  return m;
}
function fmtTags(arr, map){
  const a = (arr||[]).map(x=>String(x||"").trim()).filter(Boolean);
  if (!a.length) return "-";
  return a.map(k=> (map && map[k]) ? map[k] : k).join(" / ");
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
  const data = jobModels && (jobModels.models || jobModels);
  const arr = Array.isArray(data) ? data : (data ? Object.values(data) : []);
  const kk = String(key||"").trim();
  if (!kk) return null;
  return arr.find(m => String(m?.key||m?.id||m?.value||"").trim()===kk) || null;
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

function scoreA(aPayload, jm){
  // A is multiplicative axis; use policy for defaults when available
  const DEFAULT_A = Number(POLICY?.policy?.A_axis?.missing_default ?? 0.65);
  const FLOOR_A   = Number(POLICY?.policy?.A_axis?.floor ?? 0.35);

  if (!aPayload) return {score:clamp01(Math.max(FLOOR_A, DEFAULT_A)), detail:{missing:true, mode:"default_neutral"}};

  const p = aPayload.payload || aPayload;
  const a = p.a_score || p;

  // Prefer fit_overall if present (still useful)
  const fit = a.fit_overall;
  if (isFinite(Number(fit))) return {score:clamp01(Math.max(FLOOR_A, Number(fit))), detail:{missing:false, mode:"fit_overall"}};

  // Fallback: average A_vector
  const v = a.A_vector || a.vector || null;
  if (v && typeof v === "object"){
    // If job model has a_target, use distance-to-target (professional axis)
    const t = jm?.a_target || jm?.A_target || null;
    if (t && typeof t === "object"){
      const dims = ["D","I","S","C"];
      const diffs = dims.map(k => {
        const vv = Number(v?.[k]); const tt = Number(t?.[k]);
        if (!isFinite(vv) || !isFinite(tt)) return null;
        return Math.abs(vv - tt);
      }).filter(x=>x!==null);
      if (diffs.length){
        const dist = diffs.reduce((a,b)=>a+b,0) / diffs.length; // 0..1
        const closeness = 1 - clamp01(dist);
        return {score:clamp01(Math.max(FLOOR_A, closeness)), detail:{missing:false, mode:"distance_to_target", dist:Number(dist.toFixed(3))}};
      }
    }

    const vals = Object.values(v).map(Number).filter(n=>isFinite(n));
    if (vals.length){
      const m = avg(vals);
      return {score:clamp01(Math.max(FLOOR_A, m)), detail:{missing:false, mode:"avg_vector"}};
    }
  }

  return {score:clamp01(Math.max(FLOOR_A, DEFAULT_A)), detail:{missing:true, mode:"default_neutral"}};
}

function scoreH(hPayload){
  if (!hPayload) return {score:0, detail:{missing:true}};
  const p = hPayload.payload || hPayload;

  // 兼容多种结构：
  // 1) {h_score:{h_profile:{dims:[{id,score}]}, fit_overall}}
  // 2) {h_profile:{dims:[...]}} 或 {dims:[...]} 或 {id:score}
  const hs = p.h_score || null;

  // 优先 fit_overall（0~1）
  const fit = hs?.fit_overall ?? p.fit_overall;
  if (isFinite(Number(fit))) return {score:clamp01(fit), detail:{mode:"fit_overall"}};

  const hprof = hs?.h_profile || p.h_profile || p.h || p;
  let vals = [];

  if (hprof && Array.isArray(hprof.dims)){
    vals = hprof.dims.map(x=>Number(x.score)).filter(n=>isFinite(n));
  } else if (hprof && typeof hprof === "object"){
    vals = Object.values(hprof).map(Number).filter(n=>isFinite(n));
  }

  if (!vals.length) return {score:0, detail:{mode:"empty"}};
  const m = avg(vals) / 100; // dims 通常是 0~100
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

async function main(){
  let __rf_K_EVID = [];
  let __rf_S_EVID = [];
  const __DBG = (name, v)=>{ try{ console.log("[STEP6_DBG]", name, v); }catch(e){} };
  const box = el("summaryBox");
  const raw = el("rawBox");

  const step1 = loadOne(KEY_STEP1);

        // GUARD_DATA_READY_v0_1: avoid early run before sources loaded
    const _hasTax = (typeof K_TAGS!=="undefined") && Array.isArray(K_TAGS) && K_TAGS.length>0
                && (typeof S_TAGS!=="undefined") && Array.isArray(S_TAGS) && S_TAGS.length>0;
    const _hasJM  = (DATA_SOURCES && DATA_SOURCES.jobModels);
    if (!_hasTax || !_hasJM){
      try{ console.warn("[STEP6_GUARD] sources not ready, skip main()", { hasTax:_hasTax, hasJM:!!_hasJM }); }catch(e){}
      return;
    }
  const k = loadOne(KEY_K);
  const s = loadOne(KEY_S);
  const a = loadAny([KEY_A_V1, KEY_A_V01]).data;
  
const h = loadAny([KEY_H_V1, KEY_H_V01]).data;

    // ---- CTXMAP_LOADER_V0_1 (company_category x job_family) ----
    try{
      if (!CONTEXT_MAP){
        CONTEXT_MAP = await fetch("/apps/role_fit/data/json/company_job_context_map_v0_1.json", { cache:"no-store" }).then(r=>r.json());
        const n = (CONTEXT_MAP && Array.isArray(CONTEXT_MAP.pairs)) ? CONTEXT_MAP.pairs.length : 0;
        console.log("[CTXMAP] loaded", { pairs_n:n });
      }
    }catch(e){
      console.warn("[CTXMAP] load failed", String(e?.message||e));
      CONTEXT_MAP = null;
    }

    let jm_eff = null;

    // K/S as coverage: user tags cover job required tags
  const jobKeyUI = step1?.job_key || step1?.payload?.job_key || "";
  // Phase2+: always bind to a job model key (custom job MUST pick a base model)
  const jobModelKey =
    step1?.job_model_key ||
    step1?.payload?.job_model_key ||
    (jobKeyUI === "__custom__" ? "" : jobKeyUI);

  const jm = findJobModel(DATA_SOURCES?.jobModels, jobModelKey);

  // ---- apply company x job_family context overrides ----
  const __STEP1 = step1 || null;
  const __CTX_PAIR = __rf_findContextPair(__STEP1);
  const __CTX_EFF = __rf_applyContextOverrides(jm, __CTX_PAIR);

  // effective job model (after overrides)
  jm_eff = jm ? Object.assign({}, jm) : null;
  if (jm_eff){
    jm_eff.required_k_tags = __CTX_EFF.required_k_tags;
    jm_eff.required_s_tags = __CTX_EFF.required_s_tags;
    jm_eff.required_h_dims = __CTX_EFF.required_h_dims;
    if (__CTX_EFF.a_target_patch!=null) jm_eff.a_target = __CTX_EFF.a_target_patch;
  }

  // expose for debug
  window.__ROLE_FIT_STEP6_CTX__ = { key: __CTX_PAIR?.key || null, overrides: __CTX_PAIR?.overrides || null };


    // ---- debug: context + effective model ----
    __DBG("CTX_PAIR", window.__ROLE_FIT_STEP6_CTX__);
    __DBG("JM_EFF", jm_eff ? {
      key: String(jm_eff.key||jm_eff.id||jobModelKey||""),
      family: String(jm_eff.family||""),
      a_target: (jm_eff.a_target ?? null),
      a_alpha: (jm_eff.a_alpha ?? null),
      reqK: Array.isArray(jm_eff.required_k_tags)?jm_eff.required_k_tags:[],
      reqS: Array.isArray(jm_eff.required_s_tags)?jm_eff.required_s_tags:[],
      reqH: Array.isArray(jm_eff.required_h_dims)?jm_eff.required_h_dims:[]
    } : null);
  // K/S as coverage: user tags cover job required tags
  const __rf_K_RAW = __rf_buildKRawFromSaved(k || null);
  const __rf_S_RAW = __rf_buildSRawFromSaved(s || null);

  const __rf_K_RES = getTagsWithEvidence(__rf_K_RAW, K_TAGS || []);
    __DBG("K_TAGS_n", Array.isArray(K_TAGS)?K_TAGS.length:0);
    __DBG("K_RAW", __rf_K_RAW);
    __DBG("K_DERIVED", (__rf_K_RES&&__rf_K_RES.tags)||[]);
  const __rf_S_RES = getTagsWithEvidence(__rf_S_RAW, S_TAGS || []);
    __rf_S_EVID = Array.isArray(__rf_S_RES?.evidence) ? __rf_S_RES.evidence : [];
    __DBG("S_TAGS_n", Array.isArray(S_TAGS)?S_TAGS.length:0);
    __DBG("S_RAW", __rf_S_RAW);
    __DBG("S_DERIVED", (__rf_S_RES&&__rf_S_RES.tags)||[]);

  const __rf_K_TAGS_DERIVED = Array.isArray(__rf_K_RES?.tags) ? __rf_K_RES.tags : [];
  const __rf_S_TAGS_DERIVED = Array.isArray(__rf_S_RES?.tags) ? __rf_S_RES.tags : [];

  const K = coverage(__rf_K_TAGS_DERIVED, jm?.required_k_tags || []);
  const S = coverage(__rf_S_TAGS_DERIVED, jm?.required_s_tags || []);
  const K_ability = scoreK(k);
  const S_ability = scoreS(s);
  const A = scoreA(a, jm);
  // attach A_vector for reporting (support both {a_score:{A_vector}} and {A_vector})
  const A_vec = (a && typeof a==='object') ? (a.a_score?.A_vector || a.A_vector || null) : null;
  if (A && typeof A==='object'){
    if (!A.detail || typeof A.detail!=='object') A.detail = {};
    A.detail.A_vector = A_vec;
    A.detail.missing = (!a || !A_vec);
  }
  const H = scoreH(h);


  // ---- K/S tag labels + hit/miss ----
    const tx = (DATA_SOURCES && DATA_SOURCES.taxonomy) ? DATA_SOURCES.taxonomy : null;
    const kMap = buildTagMap(tx?.K_TAGS || tx?.k_tags || []);
    const sMap = buildTagMap(tx?.S_TAGS || tx?.s_tags || []);
    const K_req  = Array.isArray(jm?.required_k_tags) ? jm_eff?.required_k_tags : (K.detail?.required || []);
    const S_req  = Array.isArray(jm?.required_s_tags) ? jm_eff?.required_s_tags : (S.detail?.required || []);

    const K_hit = __rf_K_TAGS_DERIVED.length ? __rf_K_TAGS_DERIVED : (K.detail?.hit || []);
    const S_hit = __rf_S_TAGS_DERIVED.length ? __rf_S_TAGS_DERIVED : (S.detail?.hit || []);

    const K_miss = K_req.filter(t=> !K_hit.includes(t));
    const S_miss = S_req.filter(t=> !S_hit.includes(t));

    const O_match = overall(A.score, K.score, S.score, H.score);
  // ability bonus: 让“填了信息”也能体现（但权重很小，不掩盖匹配差距）
  const bonus_w = 0.10;
  const O = clamp01(O_match + bonus_w * avg([K_ability.score, S_ability.score]) * clamp01(A.score));

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

    
    <div style="color:rgba(14,18,32,.65);line-height:1.6;margin:-6px 0 10px 0;">
      岗位模型：<b>${String(jobModelKey||"(未绑定)").replaceAll("<","&lt;")}</b>
      <span style="color:rgba(14,18,32,.55);">（找到模型：${jm? "是":"否"}）</span>
      <br/>
      要求：K ${((jm?.required_k_tags||[]).length)} 项 · S ${((jm?.required_s_tags||[]).length)} 项
    </div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="cardmini">
        <div class="k">总胜任度</div>
        <div class="v">${pct(O)}%</div>
        <div class="h">匹配分：${pct(O_match)}% · 能力加成：+${Math.round((pct(O)-pct(O_match)))}%</div>
        <div class="h">公式：A^α × (wK·K + wS·S + wH·H)</div>
      </div>
      <div class="cardmini">
        <div class="k">A（天赋/性格）</div>
        <div class="v">${pct(A.score)}%</div>
        <div class="h">
          ${A.detail?.mode || ""}
          ${A.detail?.A_vector ? (`<br/>D:${A.detail.A_vector.D ?? "-"} I:${A.detail.A_vector.I ?? "-"} S:${A.detail.A_vector.S ?? "-"} C:${A.detail.A_vector.C ?? "-"}`) : ""}
          ${A.detail?.missing ? `<br/><span style="color:#b00020;font-weight:800;">未完成 Step4_A（性格/天赋），当前为默认/缺失模式</span>` : ""}
        </div>
      </div>
      <div class="cardmini">
        <div class="k">K（知识）</div>
        <div class="v">${pct(K.score)}%</div>
        <div class="h">能力分：${pct(K_ability.score)}%</div>
        <div class="h">
            覆盖:${(K.detail?.hit||[]).length}/${(K.detail?.required||[]).length}<br/>
            命中：${fmtTags(K_hit, kMap)}<br/>
                          <div style="margin-top:6px;padding-top:6px;border-top:1px dashed rgba(14,18,32,.18);font-size:12px;line-height:1.5;"><div style="color:rgba(14,18,32,.6);font-weight:700;">命中依据（前8条）</div>${__rf_evidenceToHtml(__rf_K_EVID, kMap)}</div>缺口：${fmtTags(K_miss, kMap)}
          </div>
      </div>
      <div class="cardmini">
        <div class="k">S（技能）</div>
        <div class="v">${pct(S.score)}%</div>
        <div class="h">能力分：${pct(S.score)}%</div>
        <div class="h">
            覆盖:${(S.detail?.hit||[]).length}/${(S.detail?.required||[]).length}<br/>
            命中：${fmtTags(S_hit, sMap)}<br/>
                          <div style="margin-top:6px;padding-top:6px;border-top:1px dashed rgba(14,18,32,.18);font-size:12px;line-height:1.5;"><div style="color:rgba(14,18,32,.6);font-weight:700;">命中依据（前8条）</div>${__rf_evidenceToHtml(__rf_S_EVID, sMap)}</div>缺口：${fmtTags(S_miss, sMap)}
          </div>
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
        <div class="h">缺项会影响总分：匹配分以 A 作为乘法轴；能力加成仅小幅体现“填写度”，不掩盖与岗位模型的差距。</div>
      </div>
    </div>

      <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn2" id="gotoStep4A" type="button">去 Step4_A 完成性格/天赋量表</button>
      </div>

  `;

  box.innerHTML = html;

  

  
  // ---- explain panel (UI) ----
  try{
    if (__rf_explain_v0_1 && box){
      const d = document.createElement("details");
      d.style.marginTop = "12px";
      d.open = false;

      const s = document.createElement("summary");
      s.textContent = "评分解释（explain_v0_1）";
      s.style.cursor = "pointer";
      s.style.fontWeight = "900";
      d.appendChild(s);

      const pre = document.createElement("pre");
      pre.style.whiteSpace = "pre-wrap";
      pre.style.fontSize = "12px";
      pre.style.lineHeight = "1.45";
      pre.style.marginTop = "8px";
      pre.textContent = JSON.stringify(__rf_explain_v0_1, null, 2);
      d.appendChild(pre);

      box.appendChild(d);
    }
  }catch(e){}

document.getElementById("gotoStep4A")?.addEventListener("click", ()=>{
    location.href = "/apps/role_fit/pages/step4_a/index.html";
  });
const rawObj = {
      // ---- admin: show effective job model + context ----
      ctx: (window.__ROLE_FIT_STEP6_CTX__ || null),
      jm_effective: (jm_eff ? {
        key: String(jm_eff.key||jm_eff.id||jobModelKey||""),
        title: String(jm_eff.title_zh||jm_eff.title||""),
        family: String(jm_eff.family||""),
        a_target: (jm_eff.a_target ?? null),
        a_alpha: (jm_eff.a_alpha ?? null),
        required_k_tags: Array.isArray(jm_eff.required_k_tags)?jm_eff.required_k_tags:[],
        required_s_tags: Array.isArray(jm_eff.required_s_tags)?jm_eff.required_s_tags:[],
        required_h_dims: Array.isArray(jm_eff.required_h_dims)?jm_eff.required_h_dims:[]
      } : null),
    keys:{
      step1: KEY_STEP1,
      k: KEY_K,
      s: KEY_S,
      a_try:[KEY_A_V1, KEY_A_V01],
      h_try:[KEY_H_V1, KEY_H_V01],
    },
    scores:{
      overall: O,
      overall_match: O_match,
      A: A.score, K: K.score, S: S.score, H: H.score,
      K_ability: K_ability.score,
      S_ability: S_ability.score,
      detail:{A:A.detail, K:K.detail, S:S.detail, H:H.detail}
    },
    debug:{
      jobKeyUI,
      jobModelKey,
      jm_found: !!jm,
      required_k_n: (jm?.required_k_tags||[]).length,
      required_s_n: (jm?.required_s_tags||[]).length,
      required_h_n: (jm?.required_h_dims||[]).length,
    },

    data:{
      step1, k, s, a, h
    }
  };

  
  // ---- explain_v0_1 (wire) ----
  // build explanation payload for transparency + debugging
  let __rf_explain_v0_1 = null;
  try{
    const __rf_Kcov = (typeof K_cov!=="undefined" && K_cov) ? K_cov : null;
    const __rf_Scov = (typeof S_cov!=="undefined" && S_cov) ? S_cov : null;

    const __rf_KcovScore = (__rf_Kcov && typeof __rf_Kcov.score!=="undefined") ? __rf_Kcov.score : (K && typeof K.score!=="undefined" ? K.score : 0);
    const __rf_ScovScore = (__rf_Scov && typeof __rf_Scov.score!=="undefined") ? __rf_Scov.score : (S && typeof S.score!=="undefined" ? S.score : 0);
    const __rf_Cov = (typeof avg==="function") ? avg([__rf_KcovScore, __rf_ScovScore]) : ((__rf_KcovScore + __rf_ScovScore)/2);

    __rf_explain_v0_1 = buildExplainV01({
      job_model_key: (typeof jobModelKey!=="undefined" ? jobModelKey : (typeof job_model_key!=="undefined" ? job_model_key : "")),
      jm: (typeof jm!=="undefined" ? jm : null),
      policy: (typeof POLICY!=="undefined" ? POLICY : (typeof policy!=="undefined" ? policy : null)),
      Afit: (A && typeof A.score!=="undefined") ? A.score : 0,
      Hfit: (H && typeof H.score!=="undefined") ? H.score : 0,
      Kcov: __rf_KcovScore,
      Scov: __rf_ScovScore,
      Cov: __rf_Cov,
      Bonus: (typeof Bonus!=="undefined") ? Bonus : 0,
      Fit: (typeof O!=="undefined") ? O : 0,
      required: {
        K: (__rf_Kcov && (__rf_Kcov.required || (__rf_Kcov.detail && __rf_Kcov.detail.required))) || [],
        S: (__rf_Scov && (__rf_Scov.required || (__rf_Scov.detail && __rf_Scov.detail.required))) || [],
        H: (jm && jm_eff?.required_h_dims) ? jm_eff?.required_h_dims : []
      },
      hit: {
        K: (__rf_Kcov && (__rf_Kcov.hit || (__rf_Kcov.detail && __rf_Kcov.detail.hit))) || [],
        S: (__rf_Scov && (__rf_Scov.hit || (__rf_Scov.detail && __rf_Scov.detail.hit))) || []
      },
      miss: {
        K: (__rf_Kcov && (__rf_Kcov.miss)) || [],
        S: (__rf_Scov && (__rf_Scov.miss)) || []
      },
      evidence: {
        K: (typeof K_evidence!=="undefined") ? K_evidence : {},
        S: (typeof S_evidence!=="undefined") ? S_evidence : {}
      },
      missingFlags: {
        missing_step4A: !!(A && A.detail && A.detail.missing),
        missing_step5H: !!(H && H.detail && H.detail.missing),
        missing_step2K: !!(K && K.detail && K.detail.missing),
        missing_step3S: !!(S && S.detail && S.detail.missing)
      }
    });

    try{
      localStorage.setItem("ROLE_FIT_STEP6_EXPLAIN_V0_1", JSON.stringify(__rf_explain_v0_1));
    }catch(e){}
    try{
      if (rawObj && typeof rawObj==="object") rawObj.explain_v0_1 = __rf_explain_v0_1;
    }catch(e){}
  }catch(e){
    console.warn("[STEP6] buildExplainV01 failed", e);
  }

  raw.textContent = JSON.stringify(rawObj, null, 2);
}

main();

// ===============================
// EXPLAIN v0.1 (locked output)
// ===============================
function __rf_round3(x){
  const n = Number(x);
  if (!isFinite(n)) return 0;
  return Math.round(n*1000)/1000;
}
function __rf_clamp01(x){
  const n = Number(x);
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
function __rf_pct(x){ return Math.round(__rf_clamp01(x)*100); }

// ---- context map (company_category x job_family) ----
let CONTEXT_MAP = null;
function __rf_findContextPair(step1){
  try{
    // normalize: merge payload + root, tolerate legacy field names
    const src = (step1 && typeof step1==="object" && step1.payload && typeof step1.payload==="object")
      ? Object.assign({}, step1.payload, step1)
      : (step1 && typeof step1==="object" ? step1 : {});

    const cc = String(src.company_category || src.companyCat || "").trim();
    const jf = String(src.job_family || src.jobFamily || "").trim();

    // debug: what cc/jf did we read?
    try{
      console.log("[STEP6_DBG] CTX_CC_JF", {
        cc, jf,
        step1_keys: (step1 && typeof step1==="object") ? Object.keys(step1) : null,
        payload_keys: (step1 && step1.payload && typeof step1.payload==="object") ? Object.keys(step1.payload) : null
      });
    }catch(e){}

    if(!cc || !jf) return null;
    const key = cc + "::" + jf;
    const pairs = CONTEXT_MAP && Array.isArray(CONTEXT_MAP.pairs) ? CONTEXT_MAP.pairs : [];
    return pairs.find(x=>String(x?.key||"")===key) || null;
  }catch(e){ return null; }
}

function __rf_applyContextOverrides(jm, pair){
  // returns effective { required_k_tags, required_s_tags, required_h_dims, weights_patch, a_target_patch }
  const o = pair && pair.overrides ? pair.overrides : null;
  const baseK = Array.isArray(jm?.required_k_tags) ? jm.required_k_tags.slice() : [];
  const baseS = Array.isArray(jm?.required_s_tags) ? jm.required_s_tags.slice() : [];
  const baseH = Array.isArray(jm?.required_h_dims) ? jm.required_h_dims.slice() : [];

  function uniq(arr){
    const out=[]; const seen=new Set();
    for(const x of arr){ const k=String(x||"").trim(); if(!k) continue; if(seen.has(k)) continue; seen.add(k); out.push(k); }
    return out;
  }
  function add(base, extra){
    const ex = Array.isArray(extra)?extra:[];
    return uniq(base.concat(ex));
  }
  function remove(base, rm){
    const r = new Set((Array.isArray(rm)?rm:[]).map(x=>String(x||"").trim()).filter(Boolean));
    return base.filter(x=>!r.has(String(x||"").trim()));
  }

  const K1 = o ? add(baseK, o.add_required_k_tags) : baseK;
  const S1 = o ? add(baseS, o.add_required_s_tags) : baseS;
  const H1 = o ? add(baseH, o.add_required_h_dims) : baseH;

  const K2 = o ? remove(K1, o.remove_required_k_tags) : K1;
  const S2 = o ? remove(S1, o.remove_required_s_tags) : S1;
  const H2 = o ? remove(H1, o.remove_required_h_dims) : H1;

  return {
    required_k_tags: K2,
    required_s_tags: S2,
    required_h_dims: H2,
    weights_patch: o ? (o.weights_patch || null) : null,
    a_target_patch: o && Number.isFinite(Number(o.a_target_patch)) ? Number(o.a_target_patch) : null,
    notes: o ? String(o.notes||"") : ""
  };
}

// Build explain payload from current eval context.
// Call this right before rendering final score / saving final payload.
function buildExplainV01(ctx){
  // ctx expects:
  // { job_model_key, jm, policy, Afit, Hfit, Kcov, Scov, Cov, Bonus, Fit,
  //   required:{K,S,H}, hit:{K,S}, miss:{K,S}, evidence:{K,S}, missingFlags:{} }
  const pol = (ctx && ctx.policy) ? ctx.policy : {};
  const pol2 = pol.policy ? pol.policy : pol;
  const w = (pol2 && pol2.overall) ? pol2.overall : {};

  const wA   = Number((w.wA ?? w.A ?? 0.45));
  const wH   = Number((w.wH ?? w.H ?? 0.20));
  const wCov = Number((w.wCov ?? w.coverage ?? 0.35));

  const Kpart = Number((w.wK ?? 0.5));
  const Spart = Number((w.wS ?? 0.5));

  const Afit = __rf_clamp01(ctx && ctx.Afit);
  const Hfit = __rf_clamp01(ctx && ctx.Hfit);
  const Cov  = __rf_clamp01(ctx && ctx.Cov);
  const Bonus = __rf_clamp01(ctx && ctx.Bonus);

  const A_contrib   = __rf_round3(wA   * Afit);
  const H_contrib   = __rf_round3(wH   * Hfit);
  const Cov_contrib = __rf_round3(wCov * Cov);
  const Bonus_contrib = __rf_round3(Bonus);

  const Fit = __rf_clamp01((ctx && ctx.Fit!=null) ? ctx.Fit : (A_contrib + H_contrib + Cov_contrib + Bonus_contrib));

  return {
    version: "explain_v0_1",
    ts: Date.now(),
    job_model_key: String((ctx && ctx.job_model_key) || ""),
    job_title: String((ctx && ctx.jm && (ctx.jm.title_zh || ctx.jm.title)) || ""),
    weights: {
      overall: { wA: __rf_round3(wA), wH: __rf_round3(wH), wCov: __rf_round3(wCov) },
      coverage: { wK: __rf_round3(Kpart), wS: __rf_round3(Spart) }
    },
    components: {
      A: { fit: __rf_round3(Afit), pct: __rf_pct(Afit), target: (ctx && ctx.jm) ? (ctx.jm_eff?.a_target ?? null) : null, alpha: (ctx && ctx.jm) ? (ctx.jm_eff?.a_alpha ?? null) : null },
      H: { fit: __rf_round3(Hfit), pct: __rf_pct(Hfit), required_h_dims: (ctx && ctx.required && ctx.required.H) ? ctx.required.H : [] },
      coverage: {
        Kcov: __rf_round3(ctx && ctx.Kcov), Scov: __rf_round3(ctx && ctx.Scov), Cov: __rf_round3(Cov),
        K: { required: (ctx && ctx.required && ctx.required.K) ? ctx.required.K : [], hit: (ctx && ctx.hit && ctx.hit.K) ? ctx.hit.K : [], miss: (ctx && ctx.miss && ctx.miss.K) ? ctx.miss.K : [] },
        S: { required: (ctx && ctx.required && ctx.required.S) ? ctx.required.S : [], hit: (ctx && ctx.hit && ctx.hit.S) ? ctx.hit.S : [], miss: (ctx && ctx.miss && ctx.miss.S) ? ctx.miss.S : [] }
      },
      bonus: { score: __rf_round3(Bonus) }
    },
    contributions: { A: A_contrib, H: H_contrib, coverage: Cov_contrib, bonus: Bonus_contrib },
    fit: { score: __rf_round3(Fit), pct: __rf_pct(Fit) },
    evidence: (ctx && ctx.evidence) ? ctx.evidence : {},
    missing: (ctx && ctx.missingFlags) ? ctx.missingFlags : {}
  };
}



// (fallback) context map load
(async()=>{
  try{ CONTEXT_MAP = await loadContextMap(); }
  catch(e){ CONTEXT_MAP=null; }
})();
