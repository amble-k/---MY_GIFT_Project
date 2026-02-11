const KEY_PROFILE = "ROLE_FIT_PROFILE_V0_1";

const age = document.getElementById("age");
const gender = document.getElementById("gender");
const genderOtherRow = document.getElementById("genderOtherRow");
const genderOther = document.getElementById("genderOther");

const region = document.getElementById("region");
const regionOtherRow = document.getElementById("regionOtherRow");
const regionOther = document.getElementById("regionOther");

const stage = document.getElementById("stage");
const stageOtherRow = document.getElementById("stageOtherRow");
const stageOther = document.getElementById("stageOther");

const email = document.getElementById("email");

const previewBox = document.getElementById("previewBox");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");

function toggleOther(selectEl, rowEl, inputEl){
  const isOther = String(selectEl.value || "") === "other";
  rowEl.classList.toggle("hide", !isOther);
  if (!isOther) inputEl.value = "";
}

function renderPreview(){
  const a = String(age.value || "");
  const g = String(gender.value || "");
  const r = String(region.value || "");
  const s = String(stage.value || "");
  const em = String(email.value || "").trim();

  let text = "";
  if (a) text += "年龄：<b>" + a + "</b><br>";

  if (g){
    let gv = (gender.options[gender.selectedIndex]?.text || "");
    if (g === "other"){
      const t = String(genderOther.value || "").trim();
      if (t) gv = t;
    }
    text += "性别：<b>" + gv + "</b><br>";
  }

  if (r){
    let rv = (region.options[region.selectedIndex]?.text || "");
    if (r === "other"){
      const t = String(regionOther.value || "").trim();
      if (t) rv = t;
    }
    text += "地区：<b>" + rv + "</b><br>";
  }

  if (s){
    let sv = (stage.options[stage.selectedIndex]?.text || "");
    if (s === "other"){
      const t = String(stageOther.value || "").trim();
      if (t) sv = t;
    }
    text += "阶段：<b>" + sv + "</b><br>";
  }

  if (em) text += "邮箱：<b>" + em + "</b><br>";

  previewBox.style.display = text ? "block" : "none";
  previewBox.innerHTML = text;
}

function save(){
  const regionKey = String(region.value || "");
  const stageKey = String(stage.value || "");

  if (!regionKey) return {ok:false, msg:"请先选择地区"};
  if (!stageKey) return {ok:false, msg:"请先选择阶段"};

  const payload = {
    age: String(age.value || ""),
    gender: String(gender.value || ""),
    gender_text: (String(gender.value || "") === "other") ? String(genderOther.value || "").trim() : "",
    region: regionKey,
    region_text: (regionKey === "other") ? String(regionOther.value || "").trim() : "",
    stage: stageKey,
    stage_text: (stageKey === "other") ? String(stageOther.value || "").trim() : "",
    email: String(email.value || "").trim(),
    ts: Date.now()
  };

  if (payload.gender === "other" && !payload.gender_text) return {ok:false, msg:"性别选择“其他”时请填写"};
  if (payload.region === "other" && !payload.region_text) return {ok:false, msg:"地区选择“其他”时请填写"};
  if (payload.stage === "other" && !payload.stage_text) return {ok:false, msg:"阶段选择“其他”时请填写"};

  localStorage.setItem(KEY_PROFILE, JSON.stringify(payload));
  return {ok:true, payload};
}

function load(){
  try{
    const j = JSON.parse(localStorage.getItem(KEY_PROFILE) || "null");
    if (!j) return;

    age.value = j.age || "";
    gender.value = j.gender || "";
    genderOther.value = j.gender_text || "";

    region.value = j.region || "";
    regionOther.value = j.region_text || "";

    stage.value = j.stage || "";
    stageOther.value = j.stage_text || "";

    email.value = j.email || "";
  }catch(e){}
}

backBtn.addEventListener("click", ()=>history.back());

gender.addEventListener("change", ()=>{
  toggleOther(gender, genderOtherRow, genderOther);
  renderPreview();
});
genderOther.addEventListener("input", renderPreview);

region.addEventListener("change", ()=>{
  toggleOther(region, regionOtherRow, regionOther);
  renderPreview();
});
regionOther.addEventListener("input", renderPreview);

stage.addEventListener("change", ()=>{
  toggleOther(stage, stageOtherRow, stageOther);
  renderPreview();
});
stageOther.addEventListener("input", renderPreview);

age.addEventListener("change", renderPreview);
email.addEventListener("input", renderPreview);

nextBtn.addEventListener("click", ()=>{
  const s = save();
  if (!s.ok){ alert(s.msg || "请完成必填项"); return; }
  location.href = "/apps/role_fit/pages/step1_role/index.html";
});

// init
load();
toggleOther(gender, genderOtherRow, genderOther);
toggleOther(region, regionOtherRow, regionOther);
toggleOther(stage, stageOtherRow, stageOther);
renderPreview();
