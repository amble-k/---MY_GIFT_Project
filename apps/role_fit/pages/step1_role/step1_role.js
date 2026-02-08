    import { JOB_MODELS_V0_1 } from "/apps/role_fit/data/job_models_stub_v0_1.js";
// fallback: if /data is missing in some builds
      const __JOB_MODELS__ = (typeof JOB_MODELS_V0_1 !== "undefined" && JOB_MODELS_V0_1) ? JOB_MODELS_V0_1 : JOB_MODELS_V0_1_FALLBACK;
    
    function __ROLEFIT_labelOfJobModel__(k){
      try{
        const J = __JOB_MODELS__;
        let arr = [];
        if (Array.isArray(J)) arr = J;
        else if (J && typeof J === "object") {
          if (Array.isArray(J.models)) arr = J.models;
          else if (J.models && typeof J.models === "object") arr = Object.values(J.models);
          else arr = Object.values(J);
        }
        const m = arr.find(x => (x && (x.key===k || x.id===k || x.code===k)));
        const pick = (o)=> String(
          o?.title_zh || o?.name_zh ||
          o?.title_ja || o?.name_ja ||
          o?.title_en || o?.name_en ||
          o?.title || o?.name ||
          k || ""
        );
        return pick(m);
      }catch(e){
        return String(k||"");
      }
    }

const KEY = "ROLE_FIT_STEP1_ROLE_V3";
const KEY_SUG = "ROLE_FIT_SUGGESTIONS_V0_1";

// ---- suggestions pool (append-only, de-dup by fingerprint) ----
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


    // 仅用于“当前岗位库只有英文/只有3条”的兜底显示
    const FALLBACK_ZH = {  "office_admin": "行政/综合支持",

      "product_manager":"产品经理",
      "data_analyst":"数据分析师",
      "software_engineer":"软件工程师"
    };

    function normModels(){
      // IMPORTANT: JOB_MODELS_V0_1 is a wrapper { meta, enums, models }
      // We MUST use JOB_MODELS_V0_1.models as the real job list/map.
      if (!JOB_MODELS_V0_1) return [];

      // case A: direct array
      if (Array.isArray(JOB_MODELS_V0_1)) return JOB_MODELS_V0_1;

      // case B: wrapper object with .models
      if (JOB_MODELS_V0_1 && typeof JOB_MODELS_V0_1 === "object") {
        const mm = JOB_MODELS_V0_1.models;
        if (mm) {
          // mm can be array or map
          if (Array.isArray(mm)) return mm;
          if (typeof mm === "object") {
            return Object.entries(mm).map(([k,v])=>({ __key:k, ...(v||{}) }));
          }
        }

        // last fallback: treat object itself as map (rare)
        return Object.entries(JOB_MODELS_V0_1).map(([k,v])=>({ __key:k, ...(v||{}) }));
      }
      return [];
    }
    const models = normModels();

const companyCat   = document.getElementById("companyCat");
const jobFamily    = document.getElementById("jobFamily");
const jobKeyRow    = document.getElementById("jobKeyRow");
const jobKey       = document.getElementById("jobKey");
const otherNote    = document.getElementById("otherNote");
const previewBox   = document.getElementById("previewBox");
const backBtn      = document.getElementById("backBtn");
const nextBtn      = document.getElementById("nextBtn");
const jobCustomTitle = document.getElementById("jobCustomTitle");


    function getKey(m, idx){
      return m?.key || m?.preset_key || m?.id || String(idx);
    }

    function getLabel(m, key){
        // 1) 优先读岗位库中文字段（你未来完善岗位库后会自动生效）
        const k = String(key||"");
        const zh = (m?.title_zh || m?.name_zh || m?.title_ja || m?.name_ja || m?.title || m?.name || "");
        const zhs = String(zh||"").trim();

        // 2) 如果岗位库已经有可用中文/日文标题，直接用
        if (zhs && zhs !== k) return zhs;

        // 3) 启发式：当只有英文 key 时，把常见 key 翻成中文显示（仅用于 UI 展示，不改变 key）
        const s = k.toLowerCase();
        const has = (w)=>s.includes(w);

        // 产品/企划
        if ((has("product") && (has("manager") || has("pm"))) || has("prodpm")) return "产品经理";
        if (has("planner") || has("planning") || has("strategy") || has("bizdev")) return "企划/策略";

        // 项目/交付
        if (has("project") && has("manager")) return "项目经理";
        if (has("delivery") || has("implementation")) return "交付/实施";

        // 研发/数据
        if (has("engineer") || has("developer") || has("software")) return "软件工程师";
        if (has("data") && (has("analyst") || has("analysis") || has("bi"))) return "数据分析";
        if (has("data") && (has("scientist") || has("ml") || has("ai"))) return "数据科学/机器学习";
        if (has("backend")) return "后端工程师";
        if (has("frontend") || has("front-end")) return "前端工程师";

        // 设计
        if (has("design") || has("designer") || has("ux") || has("ui")) return "设计师";

        // 市场/增长
        if (has("marketing") || has("growth") || has("brand")) return "市场/增长";

        // 销售/BD
        if (has("sales") || has("account") || has("bd")) return "销售/BD";

        // 运营/客服
        if (has("ops") || has("operation") || has("support") || has("cs")) return "运营/客服";

        // 人事/组织
        if (has("hr") || has("people") || has("recruit")) return "人事/组织";

        // 财务/法务/风控
        if (has("finance") || has("legal") || has("risk") || has("compliance")) return "财务/法务/风控";

        // 咨询/研究
        if (has("consult") || has("research") || has("analyst")) return "咨询/研究";

        // 4) 最终兜底：优先 FALLBACK_ZH，再回退 key
        return (FALLBACK_ZH && FALLBACK_ZH[k]) ? FALLBACK_ZH[k] : (k || "未命名岗位");
      }

    function getFamily(m){
      // 尽量从模型里读：family/category/group（你未来岗位库完善后会自动生效）
      return m?.family || m?.category || m?.group || m?.job_family || "";
    }

    function familyToId(f){
      const s = String(f||"").toLowerCase();
      if (!s) return "";
      if (s.includes("product")||s.includes("企划")||s.includes("产品")) return "product";
      if (s.includes("project")||s.includes("pm")||s.includes("交付")||s.includes("项目")) return "pm";
      if (s.includes("design")||s.includes("设计")) return "design";
      if (s.includes("engineer")||s.includes("dev")||s.includes("data")||s.includes("研发")||s.includes("技术")||s.includes("数据")) return "engineering";
      if (s.includes("marketing")||s.includes("growth")||s.includes("市场")||s.includes("增长")||s.includes("品牌")) return "marketing";
      if (s.includes("sales")||s.includes("bd")||s.includes("销售")) return "sales";
      if (s.includes("ops")||s.includes("运营")||s.includes("客服")) return "ops";
      if (s.includes("hr")||s.includes("people")||s.includes("人事")||s.includes("组织")) return "hr";
      if (s.includes("finance")||s.includes("legal")||s.includes("risk")||s.includes("财务")||s.includes("法务")||s.includes("风控")) return "finance";
      if (s.includes("consult")||s.includes("research")||s.includes("咨询")||s.includes("研究")) return "consulting";
      return "";
    }

    function findJob(key){
      return models.find((m, idx) => String(getKey(m, idx)) === String(key)) || null;
    }

    function populateJobsByFamily(fid){
      jobKey.innerHTML = "";
      jobKey.appendChild(new Option("请选择", ""));

      // 先筛一遍：如果岗位库里带 family，就按 family 匹配；如果没有 family（你当前情况），则全部放在“其他/未分类”
      const items = [];
      models.forEach((m, idx)=>{
        const key = getKey(m, idx);
        const fam = familyToId(getFamily(m));
        if (!fid) return; // 未选大类不展示
        if (fid === "other"){
  // 大类=其他：不展示细分 items，但仍要让下面的 "__custom__" 选项追加生效
  //（不要 return）
}

        // 没有 family 的岗位：暂时都挂到“engineering”会更乱，所以我们不自动塞进任何大类
        // 只有 family 能对应上时才展示
        if (fam && fam === fid){
          items.push({key, label:getLabel(m, key)});
        }
      });

      // 兼容你现在岗位库很小、没有 family：提供“通用(临时)”兜底（仍然在你选了大类后出现，但不误导）
      if (items.length === 0 && fid !== "other"){
        // 把全部岗位作为“通用（临时）”供你测试流程（不代表最终逻辑）
        models.forEach((m, idx)=>{
          const key = getKey(m, idx);
          items.push({key, label:getLabel(m, key)});
        });
      }

      items.forEach(it=>{
        jobKey.appendChild(new Option(it.label || (typeof FALLBACK_ZH==="object" ? (FALLBACK_ZH[String(it.key)]||"") : "") || __ROLEFIT_labelOfJobModel__(it.key) || it.key, it.key));
      });

        // allow custom role name (jobKey-level custom)
        jobKey.appendChild(new Option("其他（自定义）", "__custom__"));
}

    function toggleCustom(){
  // IMPORTANT: family decides option set; do not inject stray else
  const fam = String(jobFamily.value || "");
  populateJobsByFamily(fam);
  toggleCustomJob();
  renderPreview();
}

function renderPreview(){
  const c = companyCat.value;
  const fam = jobFamily.value;

  let text = "";

  if (c){
    let cLabel = (companyCat.options[companyCat.selectedIndex]?.text || "");
    if (String(c) === "other"){
      const cc = (document.getElementById("companyCustom")?.value || "").trim();
      if (cc) cLabel = cc;
    }
    text += "公司类别：<b>" + cLabel + "</b><br>";
  }

  if (fam){
    text += "目标岗位大类：<b>" + (jobFamily.options[jobFamily.selectedIndex]?.text || "") + "</b><br>";
  }

  if (String(fam) === "other"){
    const t = (document.getElementById("jobFamilyCustomTitle")?.value || "").trim();
    if (t) text += "目标岗位：<b>" + t + "</b><br>";
  }

  const jk = (jobKey && jobKey.value) ? String(jobKey.value) : "";
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

  const note = otherNote.value.trim();
  if (note){
    text += "<span style='color:rgba(14,18,32,.55)'>岗位/公司描述补充（可选）</span>" + note.replaceAll("\n","<br>");
  }

  previewBox.style.display = (text ? "block" : "none");
  previewBox.innerHTML = text;
}

function save(){
      const company_category = companyCat.value;
      const job_family = jobFamily.value;
      const other_note = otherNote.value.trim();

      if (!company_category) return {ok:false, msg:"请先选择公司类别"};
      if (!job_family) return {ok:false, msg:"请先选择岗位大类"};

      let job_key = "";
      let job_label = "";
      let job_custom_title = "";     // 目标岗位自定义文本（当 job_family=other 时必填）
      let job_family_text = "";      // 目标岗位文本镜像（用于后台增量/建议）
      let job_text = "";             // 细分岗位自定义文本（当 job_key=__custom__ 时）

      if (job_family === "other"){
        job_custom_title = (document.getElementById("jobFamilyCustomTitle")?.value || "").trim();
        if (!job_custom_title) return {ok:false, msg:"请填写目标岗位名称"};
        job_family_text = job_custom_title;

        // 细分岗位在 fam=other 下允许选择（可选）
        const jk2 = (jobKey && jobKey.value) ? String(jobKey.value) : "";
        if (jk2){
          job_key = jk2;
          if (jk2 === "__custom__"){
            job_text = (document.getElementById("jobCustomTitle")?.value || "").trim();
            job_label = job_text || "其他（自定义）";
          } else {
            job_label = (jobKey.options && jobKey.selectedIndex >= 0) ? (jobKey.options[jobKey.selectedIndex]?.text || "") : "";
          }
        }
      } else {
        job_key = jobKey.value;
        if (!job_key) return {ok:false, msg:"请先选择细分岗位"};

        if (String(job_key) === "__custom__"){
          job_text = (document.getElementById("jobCustomTitle")?.value || "").trim();
          if (!job_text) return {ok:false, msg:"请填写细分岗位名称"};
          job_label = job_text;
        } else {
          job_label = (jobKey.options && jobKey.selectedIndex >= 0) ? (jobKey.options[jobKey.selectedIndex]?.text || "") : "";
        }
      }

      const m = (job_key && job_key !== "__custom__") ? findJob(job_key) : null;

const payload = {
        company_category,
        job_family,
          job_family_text,
job_key,
        job_label,
          job_text,
        job_custom_title,
other_note,
        job_model: m || null,
        ts: Date.now()
      };
      
        // ---- suggestions pool (only when user typed something) ----
        try{
          const company_text = (document.getElementById("companyCustom")?.value || "").trim();
          const job_family_text = (document.getElementById("jobFamilyCustomTitle")?.value || "").trim();
          const job_custom_text = (document.getElementById("jobCustomTitle")?.value || "").trim();

          const hasAny = !!(company_text || job_family_text || job_custom_text);
          if (hasAny){
            const fingerprint = _rf_hash([
              company_category, company_text,
              job_family, job_family_text,
              job_key, job_custom_text,
              other_note
            ].join("|"));

            pushSuggestion({
              ts: Date.now(),
              source: "role_fit_step1",
              company_category_key: company_category,
              company_category_text: company_text,
              job_family_key: job_family,
              job_family_text: job_family_text,
              job_key: job_key,
              job_key_text: (job_key==="__custom__" ? job_custom_text : job_label),
              context_note: other_note,
              fingerprint: fingerprint
            });
          }
        }catch(e){}

        localStorage.setItem(KEY, JSON.stringify(payload));
      return {ok:true, payload};
    }

    function load(){
      try{
        const j = JSON.parse(localStorage.getItem(KEY)||"null");
        if(!j) return;
        companyCat.value = j.company_category || "";
        jobFamily.value = j.job_family || "";
        otherNote.value = j.other_note || "";
        toggleCustom();
        if (j.job_family && j.job_family !== "other"){
          populateJobsByFamily(j.job_family);
          setTimeout(()=>{ jobKey.value = j.job_key || ""; renderPreview(); }, 0);
        } else {
  const inp = document.getElementById("jobFamilyCustomTitle");
  if (inp) inp.value = j.job_custom_title || "";
  renderPreview();
}
      }catch(e){}
    }

    backBtn.addEventListener("click", ()=>history.back());

// export suggestions (for curation)
document.getElementById("exportSugBtn")?.addEventListener("click", ()=>{
  try{
    const raw = localStorage.getItem(KEY_SUG) || "[]";
    const ymd = new Date().toISOString().slice(0,10).replaceAll("-","");
    const blob = new Blob([raw], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `role_fit_suggestions_${ymd}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 500);
  }catch(e){
    alert("导出失败：请查看控制台");
    console.error(e);
  }
});
    companyCat.addEventListener("change", ()=>{ toggleCompanyCustom(); renderPreview(); });
    jobFamily.addEventListener("change", ()=>{
  // 目标岗位大类=other 时：显示目标岗位输入框，并隐藏细分岗位
  try{ toggleJobFamilyCustom(); }catch(e){}
  // 原有：根据大类刷新细分岗位 + 预览
  toggleCustom();
});

  // ---- job family: "other" -> show target role custom input; hide jobKeyRow ----
  function toggleJobFamilyCustom(){
  const fam = String(jobFamily && jobFamily.value || "");
  const isOtherFam = (fam === "other");

  const famRow = document.getElementById("jobFamilyCustomRow");
  const famInp = document.getElementById("jobFamilyCustomTitle");
  // 关键：细分岗位永远保留，不再隐藏 jobKeyRow
  // const keyRow = document.getElementById("jobKeyRow");

  // show/hide only the target-role custom row
  if (famRow) famRow.classList.toggle("hide", !isOtherFam);

  // switching away: clear target-role custom input
  if (!isOtherFam && famInp) famInp.value = "";

  // 注意：不再清空 jobKey，不再影响细分岗位选择
  // if (isOtherFam){ try{ if (jobKey) jobKey.value = ""; }catch(e){} }

  try{ toggleCustomJob(); }catch(e){}
}

// ---- company category: "other" -> show custom input ----
  function toggleCompanyCustom(){
    const row = document.getElementById("companyCustomRow");
    const inp = document.getElementById("companyCustom");
    if (!row || !inp) return;

    const isOther = (String(companyCat && companyCat.value || "") === "other");
    row.classList.toggle("hide", !isOther);
    if (!isOther) inp.value = "";
  }

function toggleCustomJob(){
      const row = document.getElementById("jobCustomRow");
      const inp = document.getElementById("jobCustomTitle");
      if (!row || !inp) return;

      const v = String(jobKey && jobKey.value || "");
      
        const fam = String(jobFamily && jobFamily.value || "");
const label = String(jobKey && jobKey.options && jobKey.selectedIndex >= 0 ? (jobKey.options[jobKey.selectedIndex]?.text || "") : "");

      // show input when user chooses any "custom/other" option (value or label)
      const isCustom =
          (v === "__custom__") ||
          (v === "other") ||
          (label.includes("自定义"));

      row.classList.toggle("hide", !isCustom);
      if (!isCustom) inp.value = "";
    }
    jobKey.addEventListener("change", function(){ toggleCustomJob(); renderPreview(); });

    jobCustomTitle.addEventListener("input", renderPreview);
otherNote.addEventListener("input", renderPreview);
document.getElementById("jobFamilyCustomTitle")?.addEventListener("input", renderPreview);
      document.getElementById("companyCustom")?.addEventListener("input", renderPreview);

    nextBtn.addEventListener("click", ()=>{
      const s = save();
      if(!s.ok){ alert(s.msg || "请完成必填项"); return; }
      // TODO: 下一步将接 step2（测评/不测评分流）
      location.href = "/apps/role_fit/pages/step0_profile/index.html";
    });

    // init (hard, observable)
    jobKey.innerHTML = ""; jobKey.appendChild(new Option("请选择", ""));

    // expose for debugging (module scope -> window)
    window.__ROLE_FIT_STEP1__ = {
      toggleCompanyCustom,
      toggleCustom,
      toggleCustomJob,
      renderPreview,
      populateJobsByFamily,
      save,
      load
    };

    // run once even when localStorage is empty
    toggleCompanyCustom();
    populateJobsByFamily(jobFamily.value);
    toggleCustom();
    toggleCustomJob();
    renderPreview();

    // hydrate saved state (if any), then re-apply UI toggles
    load();
    toggleCompanyCustom();
    toggleCustomJob();
    renderPreview();
  