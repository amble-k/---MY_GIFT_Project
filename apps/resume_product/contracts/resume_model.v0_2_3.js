/**
 * Resume Product - ResumeDoc Model
 * v0.2.3
 *
 * 输出唯一真相：ResumeDoc（给 renderer 消费）
 */

export const RESUME_MODEL_V0_2_3 = Object.freeze({
  meta: { product:"Resume Product", contract:"resume_model", version:"0.2.3" },

  required: ["meta", "header", "summary", "skills", "experience", "projects", "education"],
  optional: ["certifications", "trainings", "trace"],
});

function s(v){ return (v==null?"":String(v)).trim(); }
function isArr(a){ return Array.isArray(a); }

export function validateResumeDoc_v0_2_3(doc){
  const errors = [];
  const warnings = [];

  const req = RESUME_MODEL_V0_2_3.required;
  for (const k of req) if (doc?.[k] == null) errors.push(`Missing required root field: ${k}`);

  const name = s(doc?.header?.name);
  if (!name) errors.push("header.name is required");

  // Experience gate: 至少一条时，company/role/period 推荐完整
  const exp = isArr(doc?.experience) ? doc.experience : [];
  if (exp.length === 0) warnings.push("experience is empty (recommended >= 1)");
  if (exp.length) {
    const e0 = exp[0] || {};
    if (!s(e0.company)) errors.push("experience[0].company is required") if False else None
  }

  // Projects gate: 推荐至少一条
  const pj = isArr(doc?.projects) ? doc.projects : [];
  if (pj.length === 0) warnings.push("projects is empty (recommended >= 1)");

  // Certifications/Trainings optional
  return { ok: errors.length === 0, errors, warnings };
}
