import { loadTaxonomy } from "/apps/role_fit/core/data_loader.js";
import { buildRaw, getTags } from "/apps/role_fit/core/tag_service.js";
const KEY = "ROLE_FIT_STEP3_S_V1";
const KEY_SUG = "ROLE_FIT_SUGGESTIONS_V0_1";

let TAXONOMY = null;
let S_TAGS = [];
const titleList = document.getElementById("titleList");
const ipList = document.getElementById("ipList");
const skillTrainList = document.getElementById("skillTrainList");
const practiceList = document.getElementById("practiceList");

const addTitleBtn = document.getElementById("addTitleBtn");
const addIpBtn = document.getElementById("addIpBtn");
const addSkillTrainBtn = document.getElementById("addSkillTrainBtn");
const addPracticeBtn = document.getElementById("addPracticeBtn");

const portfolio = document.getElementById("portfolio");
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

function buildSRawFromUI(){
  return buildRaw([
    ...readList(titleList),
    ...readList(ipList),
    ...readList(skillTrainList),
    ...readList(practiceList),
    String(portfolio.value||"").trim(),
    String(note.value||"").trim()
  ]);
}
function deriveSTagsFromUI(){
  const raw = buildSRawFromUI();
  return getTags(raw, S_TAGS);
}

// Derive tags from a saved payload object (no DOM dependency).
function deriveSTagsFromSavedPayload(j){
  const titles = Array.isArray(j?.titles) ? j.titles : [];
  const ips = Array.isArray(j?.ips) ? j.ips : [];
  const trains = Array.isArray(j?.skill_trainings) ? j.skill_trainings : [];
  const practices = Array.isArray(j?.practices) ? j.practices : [];
  const portfolio = String(j?.portfolio || "").trim();
  const note = String(j?.note || "").trim();
  const raw = buildRaw([ ...titles, ...ips, ...trains, ...practices, portfolio, note ]);
  return getTags(raw, S_TAGS);
}



function deriveSTagsFromData(j){
  try{
    const raw = buildRaw([
      ...(j?.titles||[]),
      ...(j?.ips||[]),
      ...(j?.skill_trainings||[]),
      ...(j?.practices||[]),
      String(j?.portfolio||""),
      String(j?.note||"")
    ]);
    return getTags(raw, S_TAGS);
  }catch(e){
    return [];
  }
}

function renderPreview(){
  const titles = readList(titleList);
  const ips = readList(ipList);
  const trains = readList(skillTrainList);
  const practices = readList(practiceList);
  const p = String(portfolio.value||"").trim();
  const n = String(note.value||"").trim();

  let t = "";
  if (titles.length) t += "职称/认证：<b>"+titles.join(" / ")+"</b><br>";
  if (ips.length) t += "专利/论文：<b>"+ips.join(" / ")+"</b><br>";
  if (trains.length) t += "技能训练：<b>"+trains.join(" / ")+"</b><br>";
  if (practices.length) t += "实作积累：<b>"+practices.join(" / ")+"</b><br>";
  if (p) t += "作品集：<b>"+p+"</b><br>";
  if (n) t += "<span style='color:rgba(14,18,32,.55)'>补充：</span>"+n.replaceAll("\n","<br>")+"<br>";

  previewBox.style.display = t ? "block" : "none";
  previewBox.innerHTML = t;
}

function save(){
  // ---- taxonomy: derive S tags from all free text ----
  const s_tags = deriveSTagsFromUI();

const payload = {
    s_tags,
    titles: readList(titleList),
    ips: readList(ipList),
    skill_trainings: readList(skillTrainList),
    practices: readList(practiceList),
    portfolio: String(portfolio.value||"").trim(),
    note: String(note.value||"").trim(),
    ts: Date.now()
  };
  localStorage.setItem(KEY, JSON.stringify(payload));

  const base = { ts: Date.now(), source:"role_fit_step3_s" };
  payload.titles.forEach(x=>{
    const rec = { ...base, type:"title_cert", text:x };
    rec.fingerprint = _rf_hash([rec.type, rec.text].join("|"));
    pushSuggestion(rec);
  });
  payload.ips.forEach(x=>{
    const rec = { ...base, type:"ip_paper", text:x };
    rec.fingerprint = _rf_hash([rec.type, rec.text].join("|"));
    pushSuggestion(rec);
  });
  payload.skill_trainings.forEach(x=>{
    const rec = { ...base, type:"skill_training", text:x };
    rec.fingerprint = _rf_hash([rec.type, rec.text].join("|"));
    pushSuggestion(rec);
  });
  payload.practices.forEach(x=>{
    const rec = { ...base, type:"practice", text:x };
    rec.fingerprint = _rf_hash([rec.type, rec.text].join("|"));
    pushSuggestion(rec);
  });

  return {ok:true, payload};
}

function load(){
  try{
    const j = JSON.parse(localStorage.getItem(KEY) || "null");
    if(!j) return;

    titleList.innerHTML = "";
    (j.titles||[]).forEach(x=>addListItem(titleList, x));

    ipList.innerHTML = "";
    (j.ips||[]).forEach(x=>addListItem(ipList, x));

    skillTrainList.innerHTML = "";
    (j.skill_trainings||[]).forEach(x=>addListItem(skillTrainList, x));

    practiceList.innerHTML = "";
    (j.practices||[]).forEach(x=>addListItem(practiceList, x));

    portfolio.value = j.portfolio || "";
    note.value = j.note || "";
    // ---- compat: derive/upgrade s_tags from saved payload (add-only) ----
    try{
      const old = Array.isArray(j.s_tags) ? j.s_tags : [];
      const derived = deriveSTagsFromSavedPayload(j);
      const merged = Array.from(new Set([ ...old, ...(Array.isArray(derived)?derived:[]) ]));
      if (merged.length !== old.length){
        j.s_tags = merged;
        try{ localStorage.setItem(KEY, JSON.stringify(j)); }catch(e){}
        console.log("[STEP3_S] compat: s_tags upgraded", { before: old, after: merged });
      }
    }catch(e){
      console.warn("[STEP3_S] compat: s_tags derive/upgrade failed", e);
    }

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

addTitleBtn.addEventListener("click", ()=>{ addListItem(titleList, ""); renderPreview(); });
addIpBtn.addEventListener("click", ()=>{ addListItem(ipList, ""); renderPreview(); });
addSkillTrainBtn.addEventListener("click", ()=>{ addListItem(skillTrainList, ""); renderPreview(); });
addPracticeBtn.addEventListener("click", ()=>{ addListItem(practiceList, ""); renderPreview(); });

portfolio.addEventListener("input", renderPreview);
note.addEventListener("input", renderPreview);

exportSugBtn.addEventListener("click", ()=>{
  save();
  exportSuggestions();
});

backBtn.addEventListener("click", ()=>{ location.href = "/apps/role_fit/pages/step2_k/index.html"; });

nextBtn.addEventListener("click", ()=>{
  save();
  location.href = "/apps/role_fit/pages/step4_a/index.html";
});

// ---- init ----
(async ()=>{
  try{
    TAXONOMY = await loadTaxonomy();
    if (Array.isArray(TAXONOMY)){
      S_TAGS = TAXONOMY;
    }else if (TAXONOMY && typeof TAXONOMY === "object"){
      S_TAGS = TAXONOMY.S_TAGS || TAXONOMY.s_tags || TAXONOMY.tags || [];
    }
    console.log("[STEP3_S] taxonomy loaded", { s_tags_n: Array.isArray(S_TAGS)?S_TAGS.length:0 });
  }catch(e){
    console.error("[STEP3_S] loadTaxonomy failed", e);
    TAXONOMY = null;
    S_TAGS = [];
  }

  // original init

  // ensure at least one input row per list
  if (!titleList.querySelector(".item")) addListItem(titleList, "");
  if (!ipList.querySelector(".item")) addListItem(ipList, "");
  if (!skillTrainList.querySelector(".item")) addListItem(skillTrainList, "");
  if (!practiceList.querySelector(".item")) addListItem(practiceList, "");

  load();
  renderPreview();
})();

window.__ROLE_FIT_STEP3_S__ = { save, load };
