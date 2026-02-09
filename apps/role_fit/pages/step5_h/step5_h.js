const KEY_H = "ROLE_FIT_STEP5_H_V1";

const hJson = document.getElementById("hJson");
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
  const t = (hJson.value || "").trim();
  if (!t){
    previewBox.style.display = "none";
    previewBox.innerHTML = "";
    return;
  }
  previewBox.style.display = "block";
  previewBox.innerHTML = "将保存的 H_SCORE：<br/><code>" + escapeHtml(t).slice(0, 700) + (t.length>700?"…":"") + "</code>";
}

function save(){
  const t = (hJson.value || "").trim();
  if (!t) return {ok:false, msg:"请粘贴/填写 H_SCORE JSON（可先用 stub）"};

  let obj = null;
  try{ obj = JSON.parse(t); }catch(e){ return {ok:false, msg:"H_SCORE 不是合法 JSON"}; }

  const payload = { h_score: obj, ts: Date.now() };
  localStorage.setItem(KEY_H, JSON.stringify(payload));
  return {ok:true, payload};
}

function load(){
  try{
    const j = JSON.parse(localStorage.getItem(KEY_H) || "null");
    if (!j) return;
    hJson.value = JSON.stringify(j.h_score || {}, null, 2);
  }catch(e){}
}

backBtn.addEventListener("click", ()=>history.back());
hJson.addEventListener("input", render);

stubBtn.addEventListener("click", ()=>{
  const stub = {
    work_style:{ planning:0.72, execution:0.58, stability:0.41 },
    habit_traits:{ punctuality:0.66, reflection:0.52, follow_through:0.61 },
    ts: Date.now()
  };
  hJson.value = JSON.stringify(stub, null, 2);
  render();
});

nextBtn.addEventListener("click", ()=>{
  const s = save();
  if (!s.ok){ alert(s.msg || "请完成必填项"); return; }
  // Step6 我们下一步实现（先建页也行，但你说按 7 步，我们下一条再做）
  location.href = "/apps/role_fit/pages/step6_eval/index.html";
});

load();
render();
