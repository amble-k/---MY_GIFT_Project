const KEY_A = "ROLE_FIT_STEP4_A_V1";
const KEY_A_OLD = "ROLE_FIT_STEP4_A_V0_1";

const aJson = document.getElementById("aJson");
const previewBox = document.getElementById("previewBox");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const stubBtn = document.getElementById("stubBtn");
const aGrid = document.getElementById("grid");

const ITEMS = [
  { id:"D", label:"驱动力/主导（D）", left:"温和谨慎", right:"强势推进" },
  { id:"I", label:"影响力/外向（I）", left:"内敛克制", right:"善沟通感染" },
  { id:"S", label:"稳定性/耐心（S）", left:"变化快",   right:"稳定耐心" },
  { id:"C", label:"严谨性/规则（C）", left:"灵活随性", right:"严谨规范" },
  // 加两题用于“拟合/一致性”的稳定性（仍然回到 A_vector）
  { id:"drive", label:"目标导向", left:"随遇而安", right:"目标极强" },
  { id:"social",label:"社交表达", left:"偏独立",   right:"偏外向" },
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

function scoreTo01(score1to5){
  const x = Number(score1to5);
  if (!isFinite(x)) return 0.6;
  const v = Math.max(1, Math.min(5, x));
  return Number(((v-1)/4).toFixed(2)); // 0..1
}

function buildUI(){
  if (!aGrid) return;
  aGrid.innerHTML = "";
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
    aGrid.appendChild(div);
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

function readSliders(){
  const out = {};
  ITEMS.forEach(it=>{
    const r = document.getElementById(`r_${it.id}`);
    out[it.id] = r ? Number(r.value) : 3;
  });
  return out;
}

function calcA(sl){
  // 基础：D I S C 直接来自四题
  const A_vector = {
    D: scoreTo01(sl.D),
    I: scoreTo01(sl.I),
    S: scoreTo01(sl.S),
    C: scoreTo01(sl.C),
  };
  // 把 drive/social 作为校正（轻微融入 D/I）
  const drive = scoreTo01(sl.drive);
  const social = scoreTo01(sl.social);
  A_vector.D = clamp01(Number(((A_vector.D*0.85 + drive*0.15)).toFixed(2)));
  A_vector.I = clamp01(Number(((A_vector.I*0.85 + social*0.15)).toFixed(2)));

  // fit_overall：先简单用均值（可稳定运行），后续可替换成“与岗位模型 A_target 的距离”
  const fit_overall = clamp01((A_vector.D + A_vector.I + A_vector.S + A_vector.C) / 4);

  return { A_vector, fit_overall: Number(fit_overall.toFixed(2)), ts: Date.now() };
}

function syncJsonFromSliders(){
  const sl = readSliders();
  const payload = calcA(sl);
  aJson.value = JSON.stringify(payload, null, 2);
}

function render(){
  const t = (aJson.value || "").trim();
  if (!t){
    previewBox.style.display = "none";
    previewBox.innerHTML = "";
    return;
  }
  previewBox.style.display = "block";
  previewBox.innerHTML = "将保存的 A_SCORE：<br/><code>" + escapeHtml(t).slice(0, 900) + (t.length>900?"…":"") + "</code>";
}

function save(){
  const t = (aJson.value || "").trim();
  if (!t) return {ok:false, msg:"请填写/生成 A_SCORE JSON"};

  let obj = null;
  try{ obj = JSON.parse(t); }catch(e){ return {ok:false, msg:"A_SCORE 不是合法 JSON"}; }

  const payload = { a_score: obj, ts: Date.now() };
  localStorage.setItem(KEY_A, JSON.stringify(payload));
  return {ok:true, payload};
}

function load(){
  try{
    let j = JSON.parse(localStorage.getItem(KEY_A) || "null");
    if (!j){
      j = JSON.parse(localStorage.getItem(KEY_A_OLD) || "null");
      if (j){
        try{ localStorage.setItem(KEY_A, JSON.stringify(j)); }catch(e){}
      }
    }
    if (!j) return;

    const a = j.a_score || {};
    aJson.value = JSON.stringify(a, null, 2);

    // sync back to sliders if possible
    const vec = a.A_vector || null;
    if (vec && typeof vec === "object"){
      const setOne = (id, v01)=>{
        const r = document.getElementById(`r_${id}`);
        const v = document.getElementById(`v_${id}`);
        if (!r || !v) return;
        // 0..1 -> 1..5
        const s = Math.round((Math.max(0, Math.min(1, Number(v01))) * 4) + 1);
        r.value = String(Math.max(1, Math.min(5, s)));
        v.textContent = r.value;
      };
      setOne("D", vec.D);
      setOne("I", vec.I);
      setOne("S", vec.S);
      setOne("C", vec.C);
    }
  }catch(e){}
}

backBtn?.addEventListener("click", ()=>{ location.href = "/apps/role_fit/pages/step3_s/index.html"; });

aJson?.addEventListener("input", render);

stubBtn?.addEventListener("click", ()=>{
  // set a reasonable stub by sliders
  const preset = { D:4, I:3, S:4, C:3, drive:4, social:3 };
  Object.entries(preset).forEach(([id, val])=>{
    const r = document.getElementById(`r_${id}`);
    const v = document.getElementById(`v_${id}`);
    if (r){ r.value = String(val); }
    if (v){ v.textContent = String(val); }
  });
  syncJsonFromSliders();
  render();
});

nextBtn?.addEventListener("click", ()=>{
  const s = save();
  if (!s.ok){ alert(s.msg || "请完成必填项"); return; }
  location.href = "/apps/role_fit/pages/step5_h/index.html";
});

// init
buildUI();
load();
  // NOTE: do NOT auto-generate A_SCORE on page load.
  // User must interact (sliders/stub/paste) and then click Next to save.
render();
