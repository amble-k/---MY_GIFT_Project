const KEY_A = "ROLE_FIT_STEP4_A_V1";

const aJson = document.getElementById("aJson");
const previewBox = document.getElementById("previewBox");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const stubBtn = document.getElementById("stubBtn");

function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function render(){
  const t = (aJson.value || "").trim();
  if (!t){
    previewBox.style.display = "none";
    previewBox.innerHTML = "";
    return;
  }
  previewBox.style.display = "block";
  previewBox.innerHTML = "将保存的 A_SCORE：<br/><code>" + escapeHtml(t).slice(0, 700) + (t.length>700?"…":"") + "</code>";
}

function save(){
  const t = (aJson.value || "").trim();
  if (!t) return {ok:false, msg:"请粘贴/填写 A_SCORE JSON（可先用 stub）"};

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
      j = JSON.parse(localStorage.getItem("ROLE_FIT_STEP4_A_V0_1") || "null");
      if (j) localStorage.setItem(KEY_A, JSON.stringify(j));
    }
    if (!j) return;
    aJson.value = JSON.stringify(j.a_score || {}, null, 2);
  }catch(e){}
}

backBtn.addEventListener("click", ()=>history.back());
aJson.addEventListener("input", render);

stubBtn.addEventListener("click", ()=>{
  const stub = {
    A_vector:{ D:0.62, I:0.48, S:0.55, C:0.44 },
    fit_overall:0.61,
    ts: Date.now()
  };
  aJson.value = JSON.stringify(stub, null, 2);
  render();
});

nextBtn.addEventListener("click", ()=>{
  const s = save();
  if (!s.ok){ alert(s.msg || "请完成必填项"); return; }
  location.href = "/apps/role_fit/pages/step5_h/index.html";
});

load();
render();
