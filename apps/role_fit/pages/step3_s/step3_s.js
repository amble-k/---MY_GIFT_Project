const KEY = "ROLE_FIT_STEP3_S_V1";
const KEY_SUG = "ROLE_FIT_SUGGESTIONS_V0_1";

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
  const payload = {
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

if (!titleList.querySelector(".item")) addListItem(titleList, "");
if (!ipList.querySelector(".item")) addListItem(ipList, "");
if (!skillTrainList.querySelector(".item")) addListItem(skillTrainList, "");
if (!practiceList.querySelector(".item")) addListItem(practiceList, "");
load();
renderPreview();

window.__ROLE_FIT_STEP3_S__ = { save, load };
