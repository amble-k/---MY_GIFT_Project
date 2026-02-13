import { loadTaxonomy } from "/apps/role_fit/core/data_loader.js";
import { buildRaw, getTagsWithEvidence } from "/apps/role_fit/core/tag_service.js";

const el = (id)=>document.getElementById(id);
const srcBox = el("srcBox");
const diagBox = el("diagBox");
const matchBox = el("matchBox");
const rawBox = el("raw");

const KEY_STEP1 = "ROLE_FIT_STEP1_ROLE_V3";
const KEY_K     = "ROLE_FIT_STEP2_K_V1";
const KEY_S     = "ROLE_FIT_STEP3_S_V1";
const KEY_A_V1  = "ROLE_FIT_STEP4_A_V1";
const KEY_H_V1  = "ROLE_FIT_STEP5_H_V1";

let TAX = null;
let K_TAGS = [];
let S_TAGS = [];

function safeParse(s){ try{ return JSON.parse(s); }catch(e){ return null; } }
function loadOne(key){ return safeParse(localStorage.getItem(key) || "null"); }
function uniq(arr){ return Array.from(new Set((arr||[]).map(x=>String(x||"").trim()).filter(Boolean))); }

function buildKRawFromSaved(k){
  if (!k || typeof k!=="object") return "";
  const eText = String(k.edu_level_text||"").trim();
  const m1Text = String(k.major1_text||"").trim();
  const m2Text = String(k.major2_text||"").trim();
  const certs = Array.isArray(k.certs)?k.certs:[];
  const trainings = Array.isArray(k.trainings)?k.trainings:[];
  const n = String(k.note||"").trim();
  return buildRaw([eText,m1Text,m2Text,...certs,...trainings,n]);
}

function buildSRawFromSaved(s){
  if (!s || typeof s!=="object") return "";
  const titles = Array.isArray(s.titles)?s.titles:[];
  const ips = Array.isArray(s.ips)?s.ips:[];
  const trains = Array.isArray(s.skill_trainings)?s.skill_trainings:[];
  const practices = Array.isArray(s.practices)?s.practices:[];
  const p = String(s.portfolio||"").trim();
  const n = String(s.note||"").trim();
  return buildRaw([...titles,...ips,...trains,...practices,p,n]);
}

function tagsSummary(tags){
  const arr = Array.isArray(tags)?tags:[];
  if (!arr.length) return `<span class="warn">未命中任何标签</span>`;
  return arr.map(t=>`<span class="tag">${t}</span>`).join("");
}

function evidSummary(ev){
  const arr = Array.isArray(ev)?ev:[];
  if (!arr.length) return "";
  return `<div class="hint" style="margin-top:6px;">证据（前8条）：<br/>` + arr.slice(0,8).map(x=>{
    const tag = String(x?.tag||"");
    const by = String(x?.matchedBy||"");
    const mode = String(x?.mode||"");
    return `· <code>${by}</code> → <b>${tag}</b> <span style="color:rgba(14,18,32,.55)">(${mode})</span>`;
  }).join("<br/>") + `</div>`;
}

async function loadSources(){
  TAX = await loadTaxonomy();
  if (Array.isArray(TAX)){
    K_TAGS = TAX;
    S_TAGS = TAX;
  }else if (TAX && typeof TAX==="object"){
    K_TAGS = TAX.K_TAGS || TAX.k_tags || TAX.tags || [];
    S_TAGS = TAX.S_TAGS || TAX.s_tags || [];
  }else{
    K_TAGS = [];
    S_TAGS = [];
  }

  srcBox.innerHTML = `
    taxonomy: <code>${Array.isArray(TAX) ? "array" : typeof TAX}</code><br/>
    K_TAGS: <code>${Array.isArray(K_TAGS)?K_TAGS.length:0}</code> ·
    S_TAGS: <code>${Array.isArray(S_TAGS)?S_TAGS.length:0}</code><br/>
    提示：若这里是 0，说明 taxonomy 没加载到/路径不对。
  `;

  rawBox.value = JSON.stringify({ taxonomy_keys: TAX?Object.keys(TAX):null, K_n:K_TAGS.length, S_n:S_TAGS.length }, null, 2);
}

function diagnoseUser(){
  const step1 = loadOne(KEY_STEP1);
  const k = loadOne(KEY_K);
  const s = loadOne(KEY_S);
  const a = loadOne(KEY_A_V1);
  const h = loadOne(KEY_H_V1);

  const K_raw = buildKRawFromSaved(k);
  const S_raw = buildSRawFromSaved(s);

  const K_res = getTagsWithEvidence(K_raw, K_TAGS);
  const S_res = getTagsWithEvidence(S_raw, S_TAGS);

  const out = {
    has: {
      step1: !!step1, k: !!k, s: !!s, a: !!a, h: !!h,
    },
    raw: { K_raw, S_raw },
    derived: {
      K: K_res?.tags || [],
      S: S_res?.tags || [],
    },
    saved: {
      k_tags: k?.k_tags || [],
      s_tags: s?.s_tags || [],
    }
  };

  diagBox.innerHTML = `
    localStorage：Role ${out.has.step1?"✓":"×"} / K ${out.has.k?"✓":"×"} / S ${out.has.s?"✓":"×"} / A ${out.has.a?"✓":"×"} / H ${out.has.h?"✓":"×"}<br/><br/>
    <b>K 命中：</b> ${tagsSummary(out.derived.K)}<br/>
    <b>S 命中：</b> ${tagsSummary(out.derived.S)}<br/>
    <div class="hint" style="margin-top:8px;">
      若“保存的 k_tags/s_tags 为空”，但“derived 有命中”，说明：页面保存逻辑没写入 tags；Step6 应该使用 derived 兜底。
    </div>
  `;

  rawBox.value = JSON.stringify({
    step1, k, s, a, h,
    K_raw, S_raw,
    K_res, S_res,
  }, null, 2);
}

function runMatch(){
  const ns = String(el("ns")?.value||"K").toUpperCase();
  const text = String(el("txt")?.value||"").trim();
  const dict = (ns==="K") ? K_TAGS : S_TAGS;

  const res = getTagsWithEvidence(text, dict);
  matchBox.innerHTML = `
    命中：${tagsSummary(res?.tags || [])}
    ${evidSummary(res?.evidence || [])}
  `;

  rawBox.value = JSON.stringify({ ns, text, res }, null, 2);
}

function clearRoleFit(){
  const keys = Object.keys(localStorage).filter(k=>k.includes("ROLE_FIT"));
  keys.forEach(k=>localStorage.removeItem(k));
  diagBox.innerHTML = `<span class="warn">已清空 ${keys.length} 项 ROLE_FIT 本地数据</span>`;
  rawBox.value = JSON.stringify({ cleared: keys }, null, 2);
}

el("btnLoad")?.addEventListener("click", async ()=>{
  try{ await loadSources(); }catch(e){
    srcBox.innerHTML = `<span class="warn">加载失败：${String(e?.message||e)}</span>`;
  }
});

el("btnDiag")?.addEventListener("click", ()=>{
  try{ diagnoseUser(); }catch(e){
    diagBox.innerHTML = `<span class="warn">诊断失败：${String(e?.message||e)}</span>`;
  }
});

el("btnMatch")?.addEventListener("click", ()=>{
  try{ runMatch(); }catch(e){
    matchBox.innerHTML = `<span class="warn">匹配失败：${String(e?.message||e)}</span>`;
  }
});

el("btnClear")?.addEventListener("click", ()=>{
  if (!confirm("确定清空本地 ROLE_FIT 数据？")) return;
  clearRoleFit();
});

// auto-load once (best-effort)
(async()=>{
  try{ await loadSources(); }catch(e){}
})();
