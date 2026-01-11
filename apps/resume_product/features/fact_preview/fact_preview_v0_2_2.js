/**
 * FACT Preview - enable live preview (DOM -> adapter -> mapping -> render)
 * v0.2.2
 *
 * 只做预览：不接管保存，不修改 step_form，只从 DOM 读值并渲染到页面下方。
 */

import { adaptFactPayloadToInput_v0_2_2 } from "/apps/resume_product/contracts/legacy_adapter.fact_to_input.v0_2_2.js";
import { mapInputToResumeDoc_v0_2_2 } from "/apps/resume_product/contracts/mapping_rules.v0_2_2.js";
import { validateResumeDoc_v0_2_2 } from "/apps/resume_product/contracts/resume_model.v0_2_2.js";
import { THEME_PROFESSIONAL_CLEAN_V0_2_2 } from "/apps/resume_product/render/themes/theme_professional_clean.v0_2_2.js";
import { renderResumeHtml_v0_2_2 } from "/apps/resume_product/render/renderer_core.v0_2_2.js";
import { OUTPUT_SPEC_PRO_CLEAN_V0_2_2 } from "/apps/resume_product/contracts/output_spec.professional_clean.v0_2_2.js";
import { loadDB } from "/core/storage/resume_db.js";


function s(v){ return (v==null?"":String(v)).trim(); }

function factDOMPayload() {
  const v = (id) => s(document.getElementById(id)?.value);
  const skillsStr = v("fp_skills");
  const skills = skillsStr ? skillsStr.split(/[,，\n]/).map(x=>x.trim()).filter(Boolean) : [];
  return {
    basic: { name:v("fp_name"), target:v("fp_target"), city:v("fp_city"), phone:v("fp_phone"), email:v("fp_email") },
    summary: v("fp_summary"),
    skills,
    education: [{ school:v("ed_school"), major:v("ed_major"), degree:v("ed_degree") }],
    experience: [{ company:v("ex_company"), title:v("ex_title"), period:v("ex_period") }],
    projects: [{ name:v("pj_name"), desc:v("pj_desc") }],
  };
}

// v0.2.2-17: prefer DB payload
async function getFactPayloadPreferDB() {
  try {
    const db = await loadDB();
    const fpId = db?.active?.fact_profile_id || null;
    const row = fpId ? db?.fact_profiles?.[fpId] : null;
    const p = row?.payload || row || null;
    if (p) return p;
  } catch (e) {
    // ignore
  }
  return null;
}

function ensureHost(appId) {
  let host = document.getElementById("resume_preview_v0_2_2_host");
  if (host) return host;

  const app = document.getElementById(appId || "app");
  host = document.createElement("div");
  host.id = "resume_preview_v0_2_2_host";
  host.style.margin = "18px auto 0";
  host.style.maxWidth = "920px";
  host.style.padding = "0 12px 24px";

  if (app && app.parentNode) app.parentNode.insertBefore(host, app.nextSibling);
  else document.body.appendChild(host);

  return host;
}

let timer = null;
function schedule(fn, ms=80){
  if (timer) clearTimeout(timer);
  timer = setTimeout(fn, ms);
}

export function enableFactPreview_v0_2_2({ appId="app", locale="zh-CN", theme="professional_clean" } = {}) {
  const host = ensureHost(appId);

  async function render() {
    const fromDB = await getFactPayloadPreferDB();
    const fact = fromDB || factDOMPayload();
    window.__FACT_PAYLOAD__ = fact;

    const input = adaptFactPayloadToInput_v0_2_2(fact);
    const doc = mapInputToResumeDoc_v0_2_2(input, { locale, theme });
    const v = validateResumeDoc_v0_2_2(doc);

    const html = renderResumeHtml_v0_2_2(doc, THEME_PROFESSIONAL_CLEAN_V0_2_2, OUTPUT_SPEC_PRO_CLEAN_V0_2_2);
    const gate = v.ok ? "" : `
      <div style="margin:12px auto 0;max-width:820px;padding:10px 12px;border:1px solid #f3d6d6;background:#fff7f7;border-radius:12px;font-size:12px;line-height:1.5;">
        <b>完整性提示（Gate）</b><br/>
        ${(v.errors||[]).map(e=>`• ${e}`).join("<br/>")}
      </div>
    `;

    host.innerHTML = `
      <div style="margin:0 auto;max-width:920px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 10px 0;padding:10px 12px;border:1px solid #e9e9e9;border-radius:14px;background:#fff;">
          <div style="font-weight:800;font-size:13px;">预览（Professional Clean v0.2.2）</div>
          <div style="font-size:12px;color:rgba(0,0,0,0.55);">输入更新将自动刷新</div>
        </div>
        ${html}
        ${gate}
      </div>
    `;
  }

  console.log("[FACT][PREVIEW_MODULE_V0_2_2] enabled");
  render();

  const appEl = document.getElementById(appId);
  if (appEl) {
    appEl.addEventListener("input", () => schedule(()=>render()), true);
    appEl.addEventListener("change", () => schedule(()=>render()), true);
  }
}
