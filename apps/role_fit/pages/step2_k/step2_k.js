import { suggestTags, K_TAGS } from "/apps/role_fit/data/role_fit_taxonomy_v0_1.js";
const KEY = "ROLE_FIT_STEP2_K_V1";
const KEY_SUG = "ROLE_FIT_SUGGESTIONS_V0_1";

const eduLevel = document.getElementById("eduLevel");
const eduLevelOtherRow = document.getElementById("eduLevelOtherRow");
const eduLevelOther = document.getElementById("eduLevelOther");

const major1 = document.getElementById("major1");
const major1OtherRow = document.getElementById("major1OtherRow");
const major1Other = document.getElementById("major1Other");

const major2 = document.getElementById("major2");
const certList = document.getElementById("certList");
const trainList = document.getElementById("trainList");
const addCertBtn = document.getElementById("addCertBtn");
const addTrainBtn = document.getElementById("addTrainBtn");

const note = document.getElementById("note");
const previewBox = document.getElementById("previewBox");

const exportSugBtn = document.getElementById("exportSugBtn");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");

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

function addListItem(container, value=""){
  const div = document.createElement("div");
  div.className = "item";
  const inp = document.createElement("input");
  inp.value = value;
  inp.placeholder = "请输入…";
  const btn = document.createElement("button");
  btn.className = "x";
  btn.type = "button";
  btn.textContent = "删除";
  btn.addEventListener("click", ()=>{ div.remove(); renderPreview(); });
  inp.addEventListener("input", renderPreview);
  div.appendChild(inp);
  div.appendChild(btn);
  container.appendChild(div);
}

function readList(container){
  const arr = [];
  container.querySelectorAll("input").forEach(i=>{
    const v = String(i.value||"").trim();
    if (v) arr.push(v);
  });
  return arr;
}

function toggleOther(){
  const e = String(eduLevel.value||"");
  eduLevelOtherRow.classList.toggle("hide", e !== "other");
  if (e !== "other") eduLevelOther.value = "";

  const m1 = String(major1.value||"");
  major1OtherRow.classList.toggle("hide", m1 !== "other");
  if (m1 !== "other") major1Other.value = "";
}

function renderPreview(){
  const e = String(eduLevel.value||"");
  const eText = (e==="other") ? String(eduLevelOther.value||"").trim() : (eduLevel.options[eduLevel.selectedIndex]?.text||"");
  const m1 = String(major1.value||"");
  const m1Text = (m1==="other") ? String(major1Other.value||"").trim() : (major1.options[major1.selectedIndex]?.text||"");
  const m2Text = String(major2.value||"").trim();

  const certs = readList(certList);
  const trains = readList(trainList);
  const n = String(note.value||"").trim();

  let t = "";
  if (eText) t += "最高学历：<b>"+eText+"</b><br>";
  if (m1Text) t += "第一专业：<b>"+m1Text+"</b><br>";
  if (m2Text) t += "第二专业：<b>"+m2Text+"</b><br>";
  if (certs.length) t += "资格证书：<b>"+certs.join(" / ")+"</b><br>";
  if (trains.length) t += "培训课程：<b>"+trains.join(" / ")+"</b><br>";
  if (n) t += "<span style='color:rgba(14,18,32,.55)'>补充：</span>"+n.replaceAll("\n","<br>")+"<br>";

  previewBox.style.display = t ? "block" : "none";
  previewBox.innerHTML = t;
}

function save(){
  // ---- taxonomy: derive K tags from free text (robust: first textarea) ----
  const __k_raw = (document.querySelector("textarea")?.value || "").trim();
  const k_tags = (typeof suggestTags === "function") ? suggestTags(__k_raw, K_TAGS) : [];

  const e = String(eduLevel.value||"");
  if (!e) return {ok:false, msg:"请选择最高学历"};
  const eText = (e==="other") ? String(eduLevelOther.value||"").trim() : (eduLevel.options[eduLevel.selectedIndex]?.text||"");
  if (e==="other" && !eText) return {ok:false, msg:"请补充学历（其他）"};

  const m1 = String(major1.value||"");
  if (!m1) return {ok:false, msg:"请选择第一专业"};
  const m1Text = (m1==="other") ? String(major1Other.value||"").trim() : (major1.options[major1.selectedIndex]?.text||"");
  if (m1==="other" && !m1Text) return {ok:false, msg:"请补充第一专业（其他）"};

  const payload = {
    edu_level_key: e,
    edu_level_text: eText,
    major1_key: m1,
    major1_text: m1Text,
    major2_text: String(major2.value||"").trim(),
    certs: readList(certList),
    trainings: readList(trainList),
    note: String(note.value||"").trim(),
    ts: Date.now()
  };
  localStorage.setItem(KEY, JSON.stringify(payload));

  const sugBase = { ts: Date.now(), source:"role_fit_step2_k" };

  if (e==="other"){
    const rec = { ...sugBase, type:"edu_level_other", text:eText };
    rec.fingerprint = _rf_hash([rec.type, rec.text].join("|"));
    pushSuggestion(rec);
  }
  if (m1==="other"){
    const rec = { ...sugBase, type:"major1_other", text:m1Text };
    rec.fingerprint = _rf_hash([rec.type, rec.text].join("|"));
    pushSuggestion(rec);
  }
  payload.certs.forEach(x=>{
    const rec = { ...sugBase, type:"cert", text:x };
    rec.fingerprint = _rf_hash([rec.type, rec.text].join("|"));
    pushSuggestion(rec);
  });
  payload.trainings.forEach(x=>{
    const rec = { ...sugBase, type:"training", text:x };
    rec.fingerprint = _rf_hash([rec.type, rec.text].join("|"));
    pushSuggestion(rec);
  });

  return {ok:true, payload};
}

function load(){
  try{
    const j = JSON.parse(localStorage.getItem(KEY) || "null");
    if(!j) return;

    eduLevel.value = j.edu_level_key || "";
    toggleOther();
    if (String(eduLevel.value)==="other") eduLevelOther.value = j.edu_level_text || "";

    major1.value = j.major1_key || "";
    toggleOther();
    if (String(major1.value)==="other") major1Other.value = j.major1_text || "";

    major2.value = j.major2_text || "";

    certList.innerHTML = "";
    (j.certs||[]).forEach(x=>addListItem(certList, x));

    trainList.innerHTML = "";
    (j.trainings||[]).forEach(x=>addListItem(trainList, x));

    note.value = j.note || "";
    renderPreview();
  }catch(e){}
}

function exportSuggestions(){
  try{
    const arr = JSON.parse(localStorage.getItem(KEY_SUG) || "[]");
    const blob = new Blob([JSON.stringify(arr, null, 2)], { type:"application/json" });
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

eduLevel.addEventListener("change", ()=>{ toggleOther(); renderPreview(); });
eduLevelOther.addEventListener("input", renderPreview);

major1.addEventListener("change", ()=>{ toggleOther(); renderPreview(); });
major1Other.addEventListener("input", renderPreview);

major2.addEventListener("input", renderPreview);
note.addEventListener("input", renderPreview);

addCertBtn.addEventListener("click", ()=>{ addListItem(certList, ""); renderPreview(); });
addTrainBtn.addEventListener("click", ()=>{ addListItem(trainList, ""); renderPreview(); });

exportSugBtn.addEventListener("click", ()=>{
  const s = save();
  if(!s.ok){ alert(s.msg||"请完成必填项"); return; }
  exportSuggestions();
});

backBtn.addEventListener("click", ()=>{ location.href = "/apps/role_fit/pages/step1_role/index.html"; });

nextBtn.addEventListener("click", ()=>{
  const s = save();
  if(!s.ok){ alert(s.msg||"请完成必填项"); return; }
  location.href = "/apps/role_fit/pages/step3_s/index.html";
});

if (!certList.querySelector(".item")) addListItem(certList, "");
if (!trainList.querySelector(".item")) addListItem(trainList, "");
toggleOther();
load();
renderPreview();

window.__ROLE_FIT_STEP2_K__ = { save, load };
