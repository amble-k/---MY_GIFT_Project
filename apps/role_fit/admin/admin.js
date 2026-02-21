import { loadTaxonomy, loadJobModels } from "/apps/role_fit/core/data_loader.js";
import { buildRaw, getTagsWithEvidence } from "/apps/role_fit/core/tag_service.js";

const el = (id)=>document.getElementById(id);
const srcBox = el("srcBox");
const diagBox = el("diagBox");
const jmBox  = el("jmBox");
const stdBox = el("stdBox");
const matchBox = el("matchBox");
const rawBox = el("raw");

const KEY_STEP1 = "ROLE_FIT_STEP1_ROLE_V3";
const KEY_K     = "ROLE_FIT_STEP2_K_V1";
const KEY_S     = "ROLE_FIT_STEP3_S_V1";
const KEY_A_V1  = "ROLE_FIT_STEP4_A_V1";
const KEY_H_V1  = "ROLE_FIT_STEP5_H_V1";

const JOB_MODELS_URL = "/apps/role_fit/data/json/job_models_v0_2.json";
const POLICY_URL     = "/apps/role_fit/data/json/role_fit_policy_v0_1.json";

let TAX = null;
let K_TAGS = [];
let H_DIMS = [];
let S_TAGS = [];
let JOB_MODELS = null;
let POLICY = null;

function safeParse(s){ try{ return JSON.parse(s); }catch(e){ return null; } }
function loadOne(key){ return safeParse(localStorage.getItem(key) || "null"); }

function uniq(arr){
  return Array.from(new Set((arr||[]).map(x=>String(x||"").trim()).filter(Boolean)));
}

function normModels(jm){
  const data = jm && (jm.models || jm);
  const arr = Array.isArray(data) ? data : (data ? Object.values(data) : []);
  return arr.filter(Boolean);
}

function checkJobModels(models){
  const issuesOf = (m)=>{
    const iss=[];
    const key=String(m?.key||m?.id||"").trim();
    if(!key) iss.push("missing:key");
    const title=String(m?.title_zh||m?.title||m?.label||"").trim();
    if(!title) iss.push("missing:title");
    const fam=String(m?.family||"").trim();
    if(!fam) iss.push("missing:family");
    const jd=String(m?.jd_text||"").trim();
    if(!jd) iss.push("empty:jd_text");
    const rk=Array.isArray(m?.required_k_tags)?m.required_k_tags:[];
    const rs=Array.isArray(m?.required_s_tags)?m.required_s_tags:[];
    if(!rk.length) iss.push("empty:required_k_tags");
    if(!rs.length) iss.push("empty:required_s_tags");
    if(!Number.isFinite(Number(m?.a_target))) iss.push("missing:a_target");
    if(!Number.isFinite(Number(m?.a_alpha))) iss.push("missing:a_alpha");
    return { key, title, family:fam, issues:iss };
  };

  const rows=models.map(issuesOf);
  const bad=rows.filter(r=>r.issues.length);
  return { total: rows.length, incomplete_n: bad.length, sample: bad.slice(0,12) , rows };
}

function renderJobModelsDiag(res){
  if(!jmBox) return;
  if(!res){
    jmBox.innerHTML = "未加载";
    return;
  }
  const sample = Array.isArray(res.sample) ? res.sample : [];
  const modelsN = Number(res.models_n||0);
  const incN = Number(res.incomplete_n||0);

  const row = (x)=>{
    const k = String(x?.key||"");
    const title = String(x?.title||"");
    const fam = String(x?.family||"");
    const issues = Array.isArray(x?.issues) ? x.issues : [];
    const url = `/apps/role_fit/pages/step1_role/index.html?job_model_key=${encodeURIComponent(k)}`;
    return `· <a href="${url}" target="_blank"><code>${k}</code></a> <b>${title}</b> <span style="color:rgba(14,18,32,.55)">[${fam}]</span><br>
    <span style="color:rgba(14,18,32,.6)">${issues.join(", ")}</span>`;
  };

  jmBox.innerHTML = `
    models: <code>${modelsN}</code> · incomplete: <code>${incN}</code><br/>
    <div class="hint" style="margin-top:8px;">
      样例（最多12条）：<br/>
      ${sample.slice(0,12).map(row).join("<br/><br/>")}
    </div>
    <div class="hint" style="margin-top:10px;">
      提示：点击 key 会在新标签页打开 Step1，并预置 job_model_key（用于自定义岗位的“基准模型”绑定）。
    </div>
  `;
}
function toKey(x){
  return String(x?.key || x?.id || x?.value || "").trim();
}
function fmtTags(arr){
  const a = uniq(arr);
  if (!a.length) return `<span class="warn">（空）</span>`;
  return a.map(t=>`<span class="tag">${t}</span>`).join("");
}
function coverage(hit, required){
  const req = uniq(required);
  const h = new Set(uniq(hit));
  const hitReq = req.filter(t=>h.has(t));
  const miss = req.filter(t=>!h.has(t));
  const score = req.length ? (hitReq.length / req.length) : 0;
  return { score, hitReq, miss, reqN:req.length, hitN:hitReq.length };
}
function pct(x){
  const n = Number(x);
  if (!isFinite(n)) return "0%";
  return `${Math.round(Math.max(0, Math.min(1, n)) * 100)}%`;
}

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

async function fetchJson(url){
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`fetch ${url} failed: ${r.status}`);
  return await r.json();
}

function jobModelsArray(jobModels){
  const data = jobModels && (jobModels.models || jobModels);
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return Object.values(data);
  return [];
}
function findJobModel(jobModels, key){
  const kk = String(key||"").trim();
  if (!kk) return null;
  return jobModelsArray(jobModels).find(m => toKey(m) === kk) || null;
}

function standardsCheck(){
  const errs = [];
  const ok = [];

  if (!Array.isArray(K_TAGS) || !K_TAGS.length) errs.push("K_TAGS 为空/未加载");
  else ok.push(`K_TAGS ok n=${K_TAGS.length}`);

  if (!Array.isArray(S_TAGS) || !S_TAGS.length) errs.push("S_TAGS 为空/未加载");
  else ok.push(`S_TAGS ok n=${S_TAGS.length}`);

  const jmArr = jobModelsArray(JOB_MODELS);
  if (!jmArr.length) errs.push("job_models 为空/未加载");
  else ok.push(`job_models ok n=${jmArr.length}`);

  // policy weights (optional but recommended)
  const w = POLICY?.policy?.weights || POLICY?.weights || null;
  if (w && typeof w === "object"){
    const sum = ["K","S","H"].map(k=>Number(w[k])).filter(n=>isFinite(n)).reduce((a,b)=>a+b,0);
    if (!isFinite(sum) || Math.abs(sum-1) > 1e-6) errs.push(`policy.weights(K/S/H) sum != 1 (got ${sum})`);
    else ok.push("policy.weights ok (sum=1)");
  }else{
    ok.push("policy.weights: (未提供/可选)");
  }

  return { ok, errs };
}

async function loadStandards(){
  if (!stdBox) return;
  stdBox.innerHTML = `<span class="hint">加载中…</span>`;
  try{
    const [opt, tax, jm, pol] = await Promise.all([
      fetch("/apps/role_fit/data/json/role_fit_options_v0_2.json", { cache:"no-store" }).then(r=>r.json()),
      fetch("/apps/role_fit/data/json/role_fit_taxonomy_v0_2.json", { cache:"no-store" }).then(r=>r.json()),
      fetch("/apps/role_fit/data/json/job_models_v0_2.json", { cache:"no-store" }).then(r=>r.json()),
      fetch("/apps/role_fit/data/json/role_fit_policy_v0_1.json", { cache:"no-store" }).then(r=>r.json()),
    ]);

    const reqOpt = ["company_categories","job_families","job_titles","edu_levels","majors","certs","trainings"];
    const warns = [];

    for (const k of reqOpt){
      if (!opt || typeof opt!=="object" || !(k in opt)) warns.push("MISSING:"+k);
      else if (Array.isArray(opt[k]) && opt[k].length===0) warns.push("EMPTY:"+k);
      else if (!Array.isArray(opt[k])) warns.push("NOT_ARRAY:"+k);
    }

    const taxK = (tax && (tax.K_TAGS || tax.k_tags || tax.tags)) || [];
    const taxS = (tax && (tax.S_TAGS || tax.s_tags)) || [];
    const taxH = (tax && (tax.H_DIMS || tax.h_dims)) || [];
    if (!Array.isArray(taxK) || taxK.length===0) warns.push("BAD_TAX:K_TAGS");
    if (!Array.isArray(taxS) || taxS.length===0) warns.push("BAD_TAX:S_TAGS");

    const jmModels = (jm && (jm.models || jm)) || null;
    const jmN = Array.isArray(jmModels) ? jmModels.length : (jmModels && typeof jmModels==="object" ? Object.keys(jmModels).length : 0);
    if (!jmN) warns.push("BAD_JM:models");

    const polObj = (pol && (pol.policy || pol.POLICY)) || {};
    const polKeys = Object.keys(polObj||{});
    if (!polKeys.length) warns.push("BAD_POLICY:policy");

    const getN = (o,k)=> (o && Array.isArray(o[k])) ? o[k].length : 0;

    stdBox.innerHTML = `
      <div style="line-height:1.7">
        <b>Options</b>：
        company_categories <code>${getN(opt,"company_categories")}</code> ·
        job_families <code>${getN(opt,"job_families")}</code> ·
        job_titles <code>${getN(opt,"job_titles")}</code> ·
        edu_levels <code>${getN(opt,"edu_levels")}</code> ·
        majors <code>${getN(opt,"majors")}</code> ·
        certs <code>${getN(opt,"certs")}</code> ·
        trainings <code>${getN(opt,"trainings")}</code>
        <br/>
        <b>Taxonomy</b>：K <code>${Array.isArray(taxK)?taxK.length:0}</code> · S <code>${Array.isArray(taxS)?taxS.length:0}</code> · H <code>${Array.isArray(taxH)?taxH.length:0}</code>
        <br/>
        <b>Job Models</b>：models <code>${jmN}</code>
        <br/>
        <b>Policy</b>：keys <code>${polKeys.length}</code>${polKeys.length ? `（${polKeys.join(", ")}）` : ""}
        <br/>
        ${warns.length ? `<span class="warn">WARN：</span><code>${warns.join(" · ")}</code>` : `<span style="font-weight:900">PASS</span>`}
      </div>
    `;
  }catch(e){
    stdBox.innerHTML = `<span class="warn">标准总览加载失败：${String(e?.message||e)}</span>`;
  }
}

async function loadSources(){
    // load taxonomy + job_models + policy (best-effort)
  TAX = await loadTaxonomy();

  // --- taxonomy normalize (v0.1/v0.2 compatible) ---
  // v0.1: { K_TAGS:[], S_TAGS:[], H_DIMS:[] }
  // v0.2: { K:[], S:[], H_DIMS:[] } or { k_tags:[], s_tags:[] }
  const pickArr = (obj, keys)=>{
    for (const k of keys){
      const v = obj && obj[k];
      if (Array.isArray(v)) return v;
    }
    return [];
  };

  if (Array.isArray(TAX)){
    // legacy: taxonomy itself is an array (treat as shared dict, not ideal but keep backward compat)
    K_TAGS = TAX;
    S_TAGS = TAX;
    H_DIMS = [];
  }else if (TAX && typeof TAX==="object"){
    K_TAGS = pickArr(TAX, ["K_TAGS","K","k_tags","kTags","tags","KTags"]);
    S_TAGS = pickArr(TAX, ["S_TAGS","S","s_tags","sTags","tags","STags"]);
    H_DIMS = pickArr(TAX, ["H_DIMS","H","h_dims","hDims"]);
  }else{
    K_TAGS = [];
    S_TAGS = [];
    H_DIMS = [];
  }

// job_models/policy: do not block taxonomy if they fail
  try{ JOB_MODELS = await fetchJson(JOB_MODELS_URL); }catch(e){ JOB_MODELS = null; }
  try{ POLICY = await fetchJson(POLICY_URL); }catch(e){ POLICY = null; }

  const jmArr = jobModelsArray(JOB_MODELS);

  // pick default job model from saved step1
  const step1 = loadOne(KEY_STEP1);
  const preferKey =
    step1?.job_model_key ||
    step1?.payload?.job_model_key ||
    (step1?.job_key && step1.job_key !== "__custom__" ? step1.job_key : "");

  const sel = `
    <div style="margin-top:10px;">
      <span class="hint">岗位模型：</span>
      <select id="jobSel">
        <option value="">（不选：只看命中，不算覆盖率）</option>
        ${jmArr.map(m=>{
          const k = toKey(m);
          const t = String(m?.title_zh||m?.title||k||"");
          const picked = (k && preferKey && k===preferKey) ? "selected" : "";
          return `<option value="${k}" ${picked}>${t} (${k})</option>`;
        }).join("")}
      </select>
      <button class="btn2" id="btnDiag2" type="button">用该模型重算诊断</button>
    </div>
  `;

  const chk = standardsCheck();
  const chkHtml = `
    <div style="margin-top:10px;">
      <div class="k" style="margin:0 0 6px 0;">标准校验</div>
      ${chk.errs.length
        ? `<div class="warn">FAIL：</div><div class="hint">${chk.errs.map(x=>`- ${x}`).join("<br/>")}</div>`
        : `<div class="hint">PASS：${chk.ok.join(" · ")}</div>`
      }
    </div>
  `;

  srcBox.innerHTML = `
    taxonomy: <code>${Array.isArray(TAX) ? "array" : typeof TAX}</code><br/>
    K_TAGS: <code>${Array.isArray(K_TAGS)?K_TAGS.length:0}</code> ·
    S_TAGS: <code>${Array.isArray(S_TAGS)?S_TAGS.length:0}</code><br/>
    job_models: <code>${jmArr.length}</code> · policy: <code>${POLICY ? "ok" : "missing"}</code><br/>
    提示：若 K/S 为 0，说明 taxonomy 没加载到/路径不对。
    ${sel}
    ${chkHtml}
  `;

  // bind the extra button (re-diagnose)
  el("btnDiag2")?.addEventListener("click", ()=>{
    try{ diagnoseUser(); }catch(e){
      diagBox.innerHTML = `<span class="warn">诊断失败：${String(e?.message||e)}</span>`;
    }
  });

    // ---- job models ----
  let JM = null;
  let JM_MODELS = [];
  try{
    JM = await loadJobModels();
    JM_MODELS = normModels(JM);
  }catch(e){
    JM = null;
    JM_MODELS = [];
  }
  const JM_RES = checkJobModels(JM_MODELS);
  renderJobModelsDiag(JM_RES);

  rawBox.value = JSON.stringify({
      taxonomy_keys: TAX ? Object.keys(TAX) : null,
      K_n: Array.isArray(K_TAGS)?K_TAGS.length:0,
      S_n: Array.isArray(S_TAGS)?S_TAGS.length:0,
      job_models_n: jmArr.length,
      policy_keys: POLICY ? Object.keys(POLICY) : null
    }, null, 2);

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

  const derivedK = Array.isArray(K_res?.tags) ? K_res.tags : [];
  const derivedS = Array.isArray(S_res?.tags) ? S_res.tags : [];

  const savedK = Array.isArray(k?.k_tags) ? k.k_tags : [];
  const savedS = Array.isArray(s?.s_tags) ? s.s_tags : [];

  // optional: coverage vs selected job model
  const jobKey = String(el("jobSel")?.value || "").trim();
  const jm = jobKey ? findJobModel(JOB_MODELS, jobKey) : null;

  const K_cov = jm ? coverage(derivedK, jm.required_k_tags || []) : null;
  const S_cov = jm ? coverage(derivedS, jm.required_s_tags || []) : null;

  diagBox.innerHTML = `
    localStorage：Role ${step1?"✓":"×"} / K ${k?"✓":"×"} / S ${s?"✓":"×"} / A ${a?"✓":"×"} / H ${h?"✓":"×"}<br/><br/>

    <b>K 命中（derived）：</b> ${tagsSummary(derivedK)}
    ${evidSummary(K_res?.evidence || [])}
    <div class="hint">保存的 k_tags：${fmtTags(savedK)}</div>

    <div style="height:10px;"></div>

    <b>S 命中（derived）：</b> ${tagsSummary(derivedS)}
    ${evidSummary(S_res?.evidence || [])}
    <div class="hint">保存的 s_tags：${fmtTags(savedS)}</div>

    ${jm ? `
      <div style="height:12px;"></div>
      <div class="k">覆盖率（对比岗位模型：${String(jm.title_zh||jm.title||jm.key||"")})</div>
      <div class="hint">
        K 覆盖：<b>${pct(K_cov.score)}</b>（${K_cov.hitN}/${K_cov.reqN}）<br/>
        缺口：${fmtTags(K_cov.miss)}<br/><br/>
        S 覆盖：<b>${pct(S_cov.score)}</b>（${S_cov.hitN}/${S_cov.reqN}）<br/>
        缺口：${fmtTags(S_cov.miss)}
      </div>
    ` : `
      <div class="hint" style="margin-top:10px;">
        说明：未选择岗位模型，所以不计算“覆盖率”；只展示命中（derived）与保存值（saved）。
      </div>
    `}

    <div class="hint" style="margin-top:10px;">
      判断规则：<br/>
      1) saved 为空但 derived 有命中 → “页面保存逻辑”没写入 tags（Step6 应用 derived 兜底）<br/>
      2) derived 也为空 → “知识库 aliases 不覆盖 / matcher 算法 / 输入字段拼接(raw)”三者之一有问题
    </div>
  `;

  rawBox.value = JSON.stringify({
    step1, k, s, a, h,
    jobSel: jobKey,
    jm,
    K_raw, S_raw,
    K_res, S_res,
    derivedK, derivedS,
    savedK, savedS,
    K_cov, S_cov
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
  console.log("[ADMIN] btnLoad handler: START");
  try{
    if (srcBox) srcBox.innerHTML = '<span class="hint">加载中…</span>';
    await loadSources();
    console.log("[ADMIN] loadSources: OK");
    await loadStandards();
    console.log("[ADMIN] loadStandards: OK");
  }catch(e){
    console.error("[ADMIN] btnLoad handler: FAIL", e);
    if (srcBox) srcBox.innerHTML = '<span class="warn">加载失败：' + String(e && e.message ? e.message : e) + '</span>';
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



  // ---- nav: go to Step1 (role page) ----
  el("btnGoStep1")?.addEventListener("click", ()=>{
    try{
      // prefer the selector in admin panel (jobSel). fallback to saved step1 job_model_key.
      const step1 = loadOne(KEY_STEP1);
      const sel = document.getElementById("jobSel");
      const jobModelKey = String(sel?.value || step1?.job_model_key || step1?.payload?.job_model_key || "").trim();

      const url = new URL("/apps/role_fit/pages/step1_role/index.html", location.origin);
      if (jobModelKey) url.searchParams.set("job_model_key", jobModelKey);

      // open in same tab
      location.href = url.toString();
    }catch(e){
      alert("跳转失败：" + String(e?.message||e));
    }
  });
// auto-load once (best-effort)
(async()=>{
  try{ await loadSources(); await loadStandards(); }
  catch(e){}
})();
