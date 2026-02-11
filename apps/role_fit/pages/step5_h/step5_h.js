const KEY_H = "ROLE_FIT_STEP5_H_V1";
const KEY_H_OLD = "ROLE_FIT_STEP5_H_V0_1";

const grid = document.getElementById("grid");
const hJson = document.getElementById("hJson");
const previewBox = document.getElementById("previewBox");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const stubBtn = document.getElementById("stubBtn");

const ITEMS = [
  { id:"punctuality",  label:"守时与可靠性",        left:"经常拖延", right:"高度守时" },
  { id:"followthrough",label:"坚持与闭环",          left:"容易中断", right:"强闭环" },
  { id:"planning",     label:"计划性",              left:"随性推进", right:"强规划" },
  { id:"execution",    label:"执行推进",            left:"推进慢",   right:"推进快" },
  { id:"reflection",   label:"复盘习惯",            left:"很少复盘", right:"经常复盘" },
  { id:"stability",    label:"稳定性/抗波动",       left:"易波动",   right:"很稳定" },
];

function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function clamp01(x){
  const n = Number(x);
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function scoreToPct(score1to5){
  // map 1..5 -> 20..100
  const x = Number(score1to5);
  if (!isFinite(x)) return 0;
  const v = Math.round((Math.max(1, Math.min(5, x)) / 5) * 100);
  return v;
}
function pctToScore(pct0to100){
  const p = Number(pct0to100);
  if (!isFinite(p)) return 3;
  // 20->1, 40->2, 60->3, 80->4, 100->5
  const s = Math.round(Math.max(20, Math.min(100, p)) / 20);
  return Math.max(1, Math.min(5, s));
}

function buildUI(){
  if (!grid) return;
  grid.innerHTML = "";
  ITEMS.forEach(it=>{
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="top">
        <div class="name">${escapeHtml(it.label)}</div>
        <div class="val"><span id="v_${it.id}">3</span>/5</div>
      </div>
      <input type="range" min="1" max="5" step="1" value="3" id="r_${it.id}" />
      <div class="scale"><span>${escapeHtml(it.left)}</span><span>${escapeHtml(it.right)}</span></div>
    `;
    grid.appendChild(div);
  });

  ITEMS.forEach(it=>{
    const r = document.getElementById(`r_${it.id}`);
    const v = document.getElementById(`v_${it.id}`);
    r?.addEventListener("input", ()=>{
      if (v) v.textContent = String(r.value || "3");
      syncJsonFromSliders();
      render();
    });
  });
}

function readDimsFromSliders(){
  const dims = [];
  ITEMS.forEach(it=>{
    const r = document.getElementById(`r_${it.id}`);
    const s = r ? Number(r.value) : 3;
    dims.push({ id: it.id, score: scoreToPct(s) }); // 0..100
  });
  return dims;
}

function calcOverall(dims){
  const vals = (dims||[]).map(x=>Number(x.score)).filter(n=>isFinite(n));
  if (!vals.length) return 0;
  const avg = vals.reduce((a,b)=>a+b,0) / vals.length; // 0..100
  return clamp01(avg / 100); // 0..1
}

function syncJsonFromSliders(){
  const dims = readDimsFromSliders();
  const payload = {
    h_profile: { dims },
    fit_overall: Number(calcOverall(dims).toFixed(2)),
    ts: Date.now()
  };
  hJson.value = JSON.stringify(payload, null, 2);
}

function render(){
  const t = (hJson.value || "").trim();
  if (!t){
    previewBox.style.display = "none";
    previewBox.innerHTML = "";
    return;
  }
  previewBox.style.display = "block";
  previewBox.innerHTML = "将保存的 H_SCORE：<br/><code>" + escapeHtml(t).slice(0, 900) + (t.length>900?"…":"") + "</code>";
}

function save(){
  const t = (hJson.value || "").trim();
  if (!t) return {ok:false, msg:"请填写/生成 H_SCORE JSON"};

  let obj = null;
  try{ obj = JSON.parse(t); }catch(e){ return {ok:false, msg:"H_SCORE 不是合法 JSON"}; }

  const payload = { h_score: obj, ts: Date.now() };
  localStorage.setItem(KEY_H, JSON.stringify(payload));
  return {ok:true, payload};
}

function load(){
  try{
    let j = JSON.parse(localStorage.getItem(KEY_H) || "null");
    if (!j) j = JSON.parse(localStorage.getItem(KEY_H_OLD) || "null");
    if (!j) return;

    const h = j.h_score || {};
    hJson.value = JSON.stringify(h, null, 2);

    // if has dims -> sync back to sliders
    const dims = h?.h_profile?.dims || null;
    if (Array.isArray(dims)){
      dims.forEach(d=>{
        const id = String(d?.id||"");
        const pct = Number(d?.score);
        const r = document.getElementById(`r_${id}`);
        const v = document.getElementById(`v_${id}`);
        if (r && isFinite(pct)){
          const s = pctToScore(pct);
          r.value = String(s);
          if (v) v.textContent = String(s);
        }
      });
    }
  }catch(e){}
}

backBtn?.addEventListener("click", ()=>{ location.href = "/apps/role_fit/pages/step4_a/index.html"; });
hJson?.addEventListener("input", render);

stubBtn?.addEventListener("click", ()=>{
  const stub = {
    h_profile:{
      dims:[
        {id:"punctuality",score:80},
        {id:"followthrough",score:60},
        {id:"planning",score:60},
        {id:"execution",score:80},
        {id:"reflection",score:60},
        {id:"stability",score:40},
      ]
    },
    fit_overall: 0.63,
    ts: Date.now()
  };
  hJson.value = JSON.stringify(stub, null, 2);

  // sync sliders
  (stub.h_profile.dims||[]).forEach(d=>{
    const r = document.getElementById(`r_${d.id}`);
    const v = document.getElementById(`v_${d.id}`);
    if (r){
      const s = pctToScore(d.score);
      r.value = String(s);
      if (v) v.textContent = String(s);
    }
  });

  render();
});

nextBtn?.addEventListener("click", ()=>{
  const s = save();
  if (!s.ok){ alert(s.msg || "请完成必填项"); return; }
  location.href = "/apps/role_fit/pages/step6_eval/index.html";
});

// ---- init ----
buildUI();
syncJsonFromSliders();   // default values
load();                 // overwrite if saved
render();
