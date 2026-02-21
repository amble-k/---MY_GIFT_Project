import { loadJobModels, loadJobCatalog } from "/apps/role_fit/core/data_loader.js";
import { loadOptions } from "/apps/role_fit/core/data_loader.js";

/**
 * Step1 Role
 * - built-in job: job_key maps 1:1 to job_model_key
 * - custom job: requires selecting a base model (job_model_key) to bind evaluation rules
 */

const KEY = "ROLE_FIT_STEP1_ROLE_V3";
const KEY_SUG = "ROLE_FIT_SUGGESTIONS_V0_1";





function __rf_fillSelect(sel, items, opt){
  try{
    if (!sel) return;
    const arr = Array.isArray(items) ? items : [];
    const valueKey = opt?.valueKey || "key";
    const labelKey = opt?.labelKey || "label";
    sel.innerHTML = "";
    sel.appendChild(new Option("请选择", ""));
    arr.forEach(it=>{
      const v = String(it?.[valueKey] ?? "").trim();
      if (!v) return;
      const lab = String(it?.[labelKey] ?? v).trim();
      sel.appendChild(new Option(lab, v));
    });
  }catch(e){
    console.warn("[STEP1_ROLE] __rf_fillSelect fallback failed", e);
  }
}



/** ---- options helper: filter job_titles by selected jobFamily ---- */
function __rf_jobTitlesByFamily(options, familyKey){
  const fam = String(familyKey||"").trim();
  const all = optArr(options,"job_titles");
  if (!fam) return all;
  return all.filter(x=> String(x?.family||"").trim()===fam);
}

function optArr(obj, key){
  try{
    const o = obj && typeof obj==="object" ? obj : null;
    if (!o) return [];
    const v = o[key];
    return Array.isArray(v) ? v : [];
  }catch(e){
    return [];
  }
}
let OPTIONS = null;
// ---- DOM ----
const companyCat   = document.getElementById("companyCat");
const jobFamily    = document.getElementById("jobFamily");
const jobKeyRow    = document.getElementById("jobKeyRow");
const jobKey       = document.getElementById("jobKey");
const otherNote    = document.getElementById("otherNote");
const previewBox   = document.getElementById("previewBox");
const backBtn      = document.getElementById("backBtn");
const nextBtn      = document.getElementById("nextBtn");
const exportSugBtn = document.getElementById("exportSugBtn");

const jobCustomTitle = document.getElementById("jobCustomTitle");

// ---- helpers ----
function _rf_hash(str){
  let h = 5381;
  const s = String(str || "");
  for (let i=0;i<s.length;i++){
    h = ((h << 5) + h) + s.charCodeAt(i);
    h = h >>> 0;
  }
  return "h" + h.toString(16);
}

function pushSuggestion(rec){
  try{
    const arr = JSON.parse(localStorage.getItem(KEY_SUG) || "[]");
    const fp = rec.fingerprint || "";
    if (fp && Array.isArray(arr) && arr.some(x => x && x.fingerprint === fp)) return;
    arr.push(rec);
    localStorage.setItem(KEY_SUG, JSON.stringify(arr));
  }catch(e){}
}

function normModels(J){
  if (!J) return [];
  if (Array.isArray(J)) return J;
  if (J && typeof J === "object"){
    const mm = J.models;
    if (Array.isArray(mm)) return mm;
    if (mm && typeof mm === "object"){
      return Object.entries(mm).map(([k,v])=>({ __key:k, ...(v||{}) }));
    }
  }
  return [];
}

let models = [];
let JOB_CATALOG = null;


function populateCustomModelPicker(){
  const row = document.getElementById("jobModelKeyRow");
  const sel = document.getElementById("jobModelKey");
  if(!row || !sel) return;

  // Always show row when job is custom; toggleCustomJob() will decide hide/show.
  sel.innerHTML = "";
  sel.appendChild(new Option("请选择基准模型", ""));

  const fam = String(jobFamily?.value || "").trim();

  // Source of truth: job_models (loaded into `models`)
  const src = Array.isArray(models) ? models : [];
  const items = src.map(m=>{
    const key = String(m?.key || m?.id || m?.value || "").trim();
    if(!key) return None
    return {
      "key": key,
      "title": String(m?.title_zh || m?.title || key || "").trim(),
      "family": String(m?.family || "").trim()
    }
  }).filter(Boolean);

  const filtered = fam ? items.filter(x=>x.family===fam) : items;

  filtered.forEach(it=>{
    sel.appendChild(new Option(it.title || it.key, it.key));
  });

  console.log("[STEP1_ROLE] base_model picker populated", {
    fam,
    total_models: items.length,
    shown: filtered.length,
    sample: filtered.slice(0,8).map(x=>x.key)
  });
}

function getJobModelKeyFromSelection(){
  const jk = String(jobKey?.value || "");
  // 内置岗位：job_key 本身就是 job_model_key
  if (jk && jk !== "__custom__") return jk;

  // 自定义岗位：取下拉框选择
  const sel = document.getElementById("jobModelKey");
  const v = String(sel?.value || "").trim();
  return v || "";
}

function getKey(m, idx){
  return m?.key || m?.preset_key || m?.id || m?.__key || String(idx);
}
function getFamily(m){
  return (m?.family || m?.job_family || m?.category || "").toString().trim();
}
function familyToId(s){
  const t = String(s||"").toLowerCase();
  if (!t) return "";
  if (t.includes("product")) return "product";
  if (t.includes("pm") || t.includes("project") || t.includes("delivery")) return "pm";
  if (t.includes("design") || t.includes("ux") || t.includes("ui")) return "design";
  if (t.includes("engineer") || t.includes("dev") || t.includes("data") || t.includes("tech")) return "engineering";
  if (t.includes("market") || t.includes("growth") || t.includes("brand")) return "marketing";
  if (t.includes("sales") || t.includes("bd")) return "sales";
  if (t.includes("ops") || t.includes("support") || t.includes("cs")) return "ops";
  if (t.includes("hr") || t.includes("people")) return "hr";
  if (t.includes("finance") || t.includes("legal") || t.includes("risk")) return "finance";
  if (t.includes("consult") || t.includes("research")) return "consulting";
  return "";
}
function findJob(key){
  const k = String(key||"");
  return models.find((m, idx)=> String(getKey(m, idx)) === k) || null;
}
function getLabel(m, key){
  const k = String(key||"");
  const zh = (m?.title_zh || m?.name_zh || m?.title_ja || m?.name_ja || m?.title || m?.name || "");
  const zhs = String(zh||"").trim();
  if (zhs && zhs !== k) return zhs;
  return k;
}

function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}
// ---- UI: select options ----
function populateJobsByFamily(famKey){
  const fam = String(famKey||jobFamily?.value||"").trim();
  const list = (OPTIONS && Array.isArray(OPTIONS.job_titles)) ? OPTIONS.job_titles : [];
  const items = list.filter(it=>String(it?.family||"")===fam);

  jobKey.innerHTML = "";
  jobKey.appendChild(new Option("请选择", ""));
  items.forEach(it=> jobKey.appendChild(new Option(it.label||it.key, it.key)));
  jobKey.appendChild(new Option("其他（自定义）", "__custom__"));
}


// ---- UI toggles ----
function toggleCompanyCustom(){
  const row = document.getElementById("companyCustomRow");
  const inp = document.getElementById("companyCustom");
  if (!row || !inp) return;

  const isOther = (String(companyCat.value || "") === "other");
  row.classList.toggle("hide", !isOther);
  if (!isOther) inp.value = "";
}

function toggleJobFamilyCustom(){
  const fam = String(jobFamily.value || "");
  const isOtherFam = (fam === "other");

  const famRow = document.getElementById("jobFamilyCustomRow");
  const famInp = document.getElementById("jobFamilyCustomTitle");
  const keyRow = document.getElementById("jobKeyRow");

  if (famRow) famRow.classList.toggle("hide", !isOtherFam);
  if (keyRow) keyRow.classList.toggle("hide", false); // 细分岗位层永远存在（产品策略：所有要素都允许“其他输入”）

  if (!isOtherFam && famInp) famInp.value = "";
}

function toggleCustomJob(){
  const row = document.getElementById("jobCustomRow");
  const inp = document.getElementById("jobCustomTitle");
  if (!row || !inp) return;

  const v = String(jobKey.value || "");
  const label = (jobKey.options && jobKey.selectedIndex >= 0)
    ? (jobKey.options[jobKey.selectedIndex]?.text || "")
    : "";

  const isCustom =
    (v === "__custom__") ||
    (v === "other") ||
    (label.includes("自定义"));

  row.classList.toggle("hide", !isCustom);
  if (!isCustom) inp.value = "";

  // show/hide model picker accordingly
  const pickerRow = document.getElementById("jobModelKeyRow");
  if (pickerRow) pickerRow.classList.toggle("hide", !isCustom);

  const sel = document.getElementById("jobModelKey");
  if (!sel) return;

  if (isCustom){
    // ensure options are ready
    populateCustomModelPicker();

    // if user didn't pick, auto-select first available base model to avoid undefined/""
    if (!String(sel.value || "").trim()){
      for (const opt of Array.from(sel.options || [])){
        const val = String(opt?.value || "").trim();
        if (val){
          sel.value = val;
          break;
        }
      }
    }
  }else{
    // leaving custom mode: clear selection
    sel.value = "";
  }
}

function toggleCustom(){
  const fam = String(jobFamily.value || "");
  populateJobsByFamily(fam);
  toggleCustomJob();
  renderPreview();
}

// ---- preview ----
function renderPreview(){
  const c = String(companyCat.value || "");
  const fam = String(jobFamily.value || "");

  let text = "";

  // 公司类别：other 时用输入框内容替代“其他”
  if (c){
    let cLabel = (companyCat.options[companyCat.selectedIndex]?.text || "");
    if (c === "other"){
      const cc = (document.getElementById("companyCustom")?.value || "").trim();
      if (cc) cLabel = cc;
    }
    text += "公司类别：<b>" + cLabel + "</b><br>";
  }

  if (fam){
    text += "目标岗位大类：<b>" + (jobFamily.options[jobFamily.selectedIndex]?.text || "") + "</b><br>";
  }

  // 目标岗位自定义（当大类=other）
  if (fam === "other"){
    const t = (document.getElementById("jobFamilyCustomTitle")?.value || "").trim();
    if (t) text += "目标岗位：<b>" + t + "</b><br>";
  }

  // 细分岗位（永远可以选；若 __custom__ 则展示自定义文本）
  const jk = String(jobKey.value || "");
  if (jk){
    const label = (jk === "__custom__")
      ? ((document.getElementById("jobCustomTitle")?.value || "").trim() || "其他（自定义）")
      : (jobKey.options[jobKey.selectedIndex]?.text || "");

    text += "细分岗位：<b>" + label + "</b><br>";

    if (jk !== "__custom__"){
      const m = findJob(jk);
      const jd = (m?.jd_text || m?.jd || m?.description || "").toString().trim();
      if (jd){
        text += "<span style='color:rgba(14,18,32,.55)'>内置要点：</span>" + jd.slice(0, 80) + (jd.length > 80 ? "…" : "") + "<br>";
      }
    }
  }

  const note = (otherNote?.value || "").trim();
  if (note){
    text += "<span style='color:rgba(14,18,32,.55)'>岗位/公司描述补充（可选）</span>" + note.replaceAll("\n","<br>");
  }

  // model binding hint
  const mk = getJobModelKeyFromSelection();
  if (jk === "__custom__"){
    text += "<br><span style='color:rgba(14,18,32,.55)'>评估参考模型：</span><b>" + (mk || "未选择") + "</b>";
  }

  previewBox.innerHTML = text || "";
  previewBox.style.display = text ? "block" : "none";
}

// ---- save/load ----
function save(){
  const c = String(companyCat.value || "");
  if (!c) return {ok:false, msg:"请选择公司类别"};
  const cText = (c==="other") ? String(document.getElementById("companyCustom")?.value||"").trim() : (companyCat.options[companyCat.selectedIndex]?.text||"");
  if (c==="other" && !cText) return {ok:false, msg:"请补充公司类别（其他）"};

  const fam = String(jobFamily.value || "");
  if (!fam) return {ok:false, msg:"请选择目标岗位大类"};

  const jk = String(jobKey.value || "");
  if (!jk) return {ok:false, msg:"请选择细分岗位"};

  const label = (jk === "__custom__")
    ? (String(document.getElementById("jobCustomTitle")?.value || "").trim() || "其他（自定义）")
    : (jobKey.options[jobKey.selectedIndex]?.text || jk);

  const job_model_key = getJobModelKeyFromSelection();
  if (jk === "__custom__" && !job_model_key){
    return { ok:false, msg:"自定义岗位需要选择一个“参考模型”（用于评估规则）" };
  }

  const payload = {
  /* ADMIN: persist job_model_key */
  // priority: explicit query(from admin) > existing in-memory jobModelKey (if any) > job_key (when not custom)
  job_model_key: (()=>{
    try{
      const q = String(window.__RF_JOB_MODEL_KEY_FROM_ADMIN__||"").trim();
      if (q) return q;
    }catch(e){}
    try{
      if (typeof jobModelKey !== "undefined"){
        const v = String(jobModelKey||"").trim();
        if (v) return v;
      }
    }catch(e){}
    try{
      const jk = String(jobKey?.value||"").trim();
      if (jk && jk !== "__custom__") return jk;
    }catch(e){}
    return "";
  })(),
    company_category: c,
    company_category_text: cText,
    job_family: fam,
    job_family_text: (fam==="other") ? String(document.getElementById("jobFamilyCustomTitle")?.value||"").trim() : "",
    job_key: jk,
    job_label: label,
    job_text: (jk==="__custom__") ? String(document.getElementById("jobCustomTitle")?.value||"").trim() : "",
    job_custom_title: (fam==="other") ? String(document.getElementById("jobFamilyCustomTitle")?.value||"").trim() : "",
    job_model_key: (jk==="__custom__") ? job_model_key : jk,
    other_note: String(otherNote?.value||"").trim(),
    ts: Date.now()
  };

  localStorage.setItem(KEY, JSON.stringify(payload));

  // suggestion
  const rec = { ts: Date.now(), source:"role_fit_step1_role", type:"role", text: label };
  rec.fingerprint = _rf_hash([rec.type, rec.text, payload.company_category, payload.job_family, payload.job_model_key].join("|"));
  pushSuggestion(rec);

  return { ok:true, payload };
}

function load(){
  try{
    const j = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!j) return;

    companyCat.value = j.company_category || "";
    toggleCompanyCustom();
    if (String(companyCat.value || "") === "other"){
      const cc = document.getElementById("companyCustom");
      if (cc) cc.value = j.company_category_text || "";
    }

    jobFamily.value = j.job_family || "";
    toggleJobFamilyCustom();

    const famInp = document.getElementById("jobFamilyCustomTitle");
    if (famInp && String(jobFamily.value || "") === "other"){
      famInp.value = j.job_custom_title || j.job_family_text || "";
    }

    populateJobsByFamily(jobFamily.value);
    jobKey.value = j.job_key || "";

    toggleCustomJob();
    if (String(jobKey.value || "") === "__custom__"){
      const jt = document.getElementById("jobCustomTitle");
      if (jt) jt.value = j.job_text || j.job_label || "";
    }

    // restore custom model picker
    populateCustomModelPicker();
    if (String(jobKey.value || "") === "__custom__"){
      const sel = document.getElementById("jobModelKey");
      if (sel) sel.value = j.job_model_key || "";
    }

    if (otherNote) otherNote.value = j.other_note || "";

    renderPreview();
  }catch(e){}
}

// ---- export suggestions ----
function exportSuggestions(){
  try{
    const arr = JSON.parse(localStorage.getItem(KEY_SUG) || "[]");
    const blob = new Blob([JSON.stringify(arr, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ROLE_FIT_SUGGESTIONS_V0_1.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }catch(e){
    alert("导出失败：localStorage 读取异常");
  }
}

// ---- events ----
backBtn?.addEventListener("click", ()=>history.back());

companyCat?.addEventListener("change", ()=>{
  toggleCompanyCustom();
  renderPreview();
});

document.getElementById("companyCustom")?.addEventListener("input", renderPreview);

  jobFamily?.addEventListener("change", ()=>{
    try{ populateJobsByFamily(jobFamily.value); }catch(e){}
    try{ toggleJobFamilyCustom(); }catch(e){}
    try{ toggleCustomJob(); }catch(e){}
    try{ renderPreview(); }catch(e){}
  });

document.getElementById("jobFamilyCustomTitle")?.addEventListener("input", renderPreview);

jobKey?.addEventListener("change", ()=>{
  toggleCustomJob();
  renderPreview();
});
jobCustomTitle?.addEventListener("input", renderPreview);
otherNote?.addEventListener("input", renderPreview);

exportSugBtn?.addEventListener("click", ()=>{
  // 先强制保存一次，确保 suggestions 最新
  const s = save();
  if (!s.ok){
    alert(s.msg || "请完成必填项");
    return;
  }
  exportSuggestions();
});

nextBtn?.addEventListener("click", ()=>{
  const s = save();
  if (!s.ok){
    alert(s.msg || "请完成必填项");
    return;
  }
  location.href = "/apps/role_fit/pages/step2_k/index.html";
});

// ---- init ----
(async ()=>{
  
    
  /* ADMIN: accept job_model_key from query */
  try{
    const q = new URLSearchParams(location.search||"");
    const qModel = String(q.get("job_model_key")||"").trim();
    if (qModel){
      // expose for preview/save pipeline
      window.__RF_JOB_MODEL_KEY_FROM_ADMIN__ = qModel;

      // best-effort: if there is a global/state variable used by save(), set it
      try{
        if (typeof jobModelKey !== "undefined") { jobModelKey = qModel; }
      }catch(e){}

      console.log("[STEP1_ROLE] job_model_key from query =", qModel);
    }
  }catch(e){}
// ---- options (v0.2) ----
    try{
      OPTIONS = await loadOptions();
      // page may have selects with these ids (best-effort)
      const cc = document.getElementById("companyCat");
      const jf = document.getElementById("jobFamily");
      const jt = document.getElementById("jobKey");
      __rf_fillSelect(cc, optArr(OPTIONS,"company_categories"), {valueKey:"key", labelKey:"label"});
      __rf_fillSelect(jf, optArr(OPTIONS,"job_families"), {valueKey:"key", labelKey:"label"});
      __rf_fillSelect(jt, optArr(OPTIONS,"job_titles"), {valueKey:"key", labelKey:"label"});
      console.log("[STEP1_ROLE] options loaded", {
        company_categories_n: optArr(OPTIONS,"company_categories").length,
        job_families_n: optArr(OPTIONS,"job_families").length,
        job_titles_n: optArr(OPTIONS,"job_titles").length
      });
    }catch(e){
      console.warn("[STEP1_ROLE] loadOptions failed (fallback to built-in UI options)", e);
      OPTIONS = null;
    }

try{
    const J = await loadJobModels();
    models = normModels(J);
    console.log("[STEP1_ROLE] job_models loaded", { n: models.length, meta: J?.meta || null });
  
    try{ window.models = models; }catch(e){}
}catch(e){
    console.error("[STEP1_ROLE] loadJobModels failed", e);
    models = [];
  }

  try{
    JOB_CATALOG = await loadJobCatalog();
    console.log("[STEP1_ROLE] job_catalog loaded", { items_n: JOB_CATALOG?.items?.length || 0 });
    populateCustomModelPicker();
  }catch(e){
    console.error("[STEP1_ROLE] loadJobCatalog failed", e);
    JOB_CATALOG = null;
  }

  // keep original init order
  populateJobsByFamily(jobFamily.value);
  toggleCompanyCustom();
  toggleJobFamilyCustom();
  toggleCustomJob();
  load();
  renderPreview();
})();

// ---- expose for debugging ----
window.__ROLE_FIT_STEP1__ = {
  renderPreview,
  populateJobsByFamily,
  toggleCompanyCustom,
  toggleJobFamilyCustom,
  toggleCustomJob,
  toggleCustom,
  save,
  load
};
