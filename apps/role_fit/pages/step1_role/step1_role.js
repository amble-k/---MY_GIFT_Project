import { JOB_MODELS_V0_1 } from "/apps/role_fit/data/job_models_stub_v0_1.js";

const KEY = "ROLE_FIT_STEP1_ROLE_V3";
const KEY_SUG = "ROLE_FIT_SUGGESTIONS_V0_1";

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

function normModels(){
  const J = JOB_MODELS_V0_1;
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
const models = normModels();

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

// ---- UI: select options ----
function populateJobsByFamily(fid){
  jobKey.innerHTML = "";
  jobKey.appendChild(new Option("请选择", ""));

  const items = [];
  const familyId = String(fid || "");

  models.forEach((m, idx)=>{
    const key = getKey(m, idx);
    const fam = familyToId(getFamily(m));
    if (!familyId) return;

    // 大类=other：不加入 items，但不要 return 掉（否则 "__custom__" 会不稳定）
    if (familyId !== "other"){
      if (fam && fam === familyId) items.push({ key, label: getLabel(m, key) });
    }
  });

  // 如果该大类找不到任何匹配（或岗位库没有 family），就兜底把全部岗位放进去（便于跑通流程）
  if (items.length === 0 && familyId && familyId !== "other"){
    models.forEach((m, idx)=>{
      const key = getKey(m, idx);
      items.push({ key, label: getLabel(m, key) });
    });
  }

  items.forEach(it=>{
    jobKey.appendChild(new Option(it.label || it.key, it.key));
  });

  // 永远追加一个可自定义的细分岗位
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
  const label = (jobKey.options && jobKey.selectedIndex >= 0) ? (jobKey.options[jobKey.selectedIndex]?.text || "") : "";

  const isCustom =
    (v === "__custom__") ||
    (v === "other") ||
    (label.includes("自定义"));

  row.classList.toggle("hide", !isCustom);
  if (!isCustom) inp.value = "";
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

  previewBox.style.display = (text ? "block" : "none");
  previewBox.innerHTML = text;
}

// ---- save/load ----
function save(){
  const company_category = String(companyCat.value || "");
  const job_family = String(jobFamily.value || "");
  const other_note = (otherNote?.value || "").trim();

  let job_key = "";
  let job_label = "";
  let job_custom_title = "";
  let job_family_text = "";
  let job_text = "";

  if (!company_category) return { ok:false, msg:"请先选择公司类别" };
  if (company_category === "other"){
    const cc = (document.getElementById("companyCustom")?.value || "").trim();
    if (!cc) return { ok:false, msg:"请填写公司类别（其他）补充" };
  }

  if (!job_family) return { ok:false, msg:"请先选择岗位大类" };
  
  if (job_family === "other"){
    // ✅ 目标岗位自定义：只要求目标岗位名称；细分岗位是可选
    job_custom_title = (document.getElementById("jobFamilyCustomTitle")?.value || "").trim();
    if (!job_custom_title) return {ok:false, msg:"请填写目标岗位名称"};

    // 细分岗位（可选）
    const jk2 = (jobKey && jobKey.value) ? String(jobKey.value) : "";
    if (jk2){
      job_key = jk2;

      if (jk2 === "__custom__"){
        job_text = (document.getElementById("jobCustomTitle")?.value || "").trim();
        if (!job_text) return {ok:false, msg:"请填写细分岗位名称"};
        job_label = job_text;
      } else {
        job_label = (jobKey.options && jobKey.selectedIndex >= 0)
          ? (jobKey.options[jobKey.selectedIndex]?.text || "")
          : "";
      }
    }

    // 目标岗位文本镜像（用于后台建议/增量）
    job_family_text = job_custom_title;

  } else {
    // ✅ 普通大类：细分岗位必填
    job_key = (jobKey && jobKey.value) ? String(jobKey.value) : "";
    if (!job_key) return {ok:false, msg:"请先选择细分岗位"};

    if (job_key === "__custom__"){
      job_text = (document.getElementById("jobCustomTitle")?.value || "").trim();
      if (!job_text) return {ok:false, msg:"请填写细分岗位名称"};
      job_label = job_text;
    } else {
      job_label = (jobKey.options && jobKey.selectedIndex >= 0)
        ? (jobKey.options[jobKey.selectedIndex]?.text || "")
        : "";
    }

    // 普通大类的文本镜像：用下拉显示文本
    job_family_text = (jobFamily.options && jobFamily.selectedIndex >= 0)
      ? (jobFamily.options[jobFamily.selectedIndex]?.text || "")
      : "";
  }


  job_family_text = (job_family === "other")
    ? (document.getElementById("jobFamilyCustomTitle")?.value || "").trim()
    : (jobFamily.options && jobFamily.selectedIndex >= 0 ? (jobFamily.options[jobFamily.selectedIndex]?.text || "") : "");

  const company_category_text = (company_category === "other")
    ? (document.getElementById("companyCustom")?.value || "").trim()
    : (companyCat.options && companyCat.selectedIndex >= 0 ? (companyCat.options[companyCat.selectedIndex]?.text || "") : "");

  const m = (job_key && job_key !== "__custom__") ? findJob(job_key) : null;

  const payload = {
    company_category,
    company_category_text,
    job_family,
    job_family_text,
    job_key,
    job_label,
    job_text,
    job_custom_title: job_family_text, // 兼容旧字段：目标岗位自定义文本
    other_note,
    job_model: m || null,
    ts: Date.now()
  };

  localStorage.setItem(KEY, JSON.stringify(payload));

  // ---- push suggestion (for backend incremental) ----
  const rec = {
    ts: Date.now(),
    source: "role_fit_step1",
    company_category_key: company_category,
    company_category_text: company_category_text,
    job_family_key: job_family,
    job_family_text: job_family_text,
    job_key: job_key,
    job_label: job_label,
    job_text: job_text,
    other_note: other_note
  };
  rec.fingerprint = _rf_hash([
    rec.company_category_key, rec.company_category_text,
    rec.job_family_key, rec.job_family_text,
    rec.job_key, rec.job_label, rec.job_text
  ].join("|"));
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
  toggleJobFamilyCustom();
  toggleCustom();
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
  // TODO: 下一步接 step2（K/S 填写或测评/不测评分流）
  location.href = "/apps/role_fit/pages/step2_k/index.html";
});

// ---- init ----
populateJobsByFamily(jobFamily.value);
toggleCompanyCustom();
toggleJobFamilyCustom();
toggleCustomJob();
load();
renderPreview();

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
