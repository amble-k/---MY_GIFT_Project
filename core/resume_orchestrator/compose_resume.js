// core/resume_orchestrator/compose_resume.js
// v0.2: Orchestrator SSOT（BASE + TARGET_KASH）
// - BASE：用 composeBase 生成可投递的基础简历
// - TARGET_KASH：在 BASE 之上附加“目标岗位/KASH 匹配要点”（最小实现）

import RESUME_BASE_V2_ZH from "/core/template_engine/templates/resume_base_v2_zh.js";
import { composeBase } from "/core/resume_composer/compose_base.js";

function nowISO() {
  return new Date().toISOString();
}

function pick(obj, keys, defVal = "") {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return defVal;
}

function readFact(db) {
  const fpId = db?.active?.fact_profile_id || null;
  const row = fpId ? db?.fact_profiles?.[fpId] : null;
  const fp = row?.payload || row || {};
  const basic = fp?.basic ? fp.basic : fp;
  return { fpId, fp, basic };
}

function readTarget(db) {
  const tid = db?.active?.target_profile_id || null;
  const row =
    (tid && db?.target_profiles?.[tid]) ? db.target_profiles[tid] :
    (tid && db?.targets?.[tid]) ? db.targets[tid] :
    null;
  const p = row?.payload || row || {};
  return { tid, p };
}


function readRole(db) {
  const sid = db?.active?.session_id || null;
  const s = (sid && db?.sessions?.[sid]) ? db.sessions[sid] : {};
  const rid = s?.role_id || null;

  const row =
    (rid && db?.role_profiles?.[rid]) ? db.role_profiles[rid] :
    (rid && db?.roles?.[rid]) ? db.roles[rid] :
    (rid && db?.role_profile?.[rid]) ? db.role_profile[rid] :
    null;

  const p = row?.payload || row || {};
  return { rid, p };
}

function readKash(db) {
  const kid = db?.active?.claimed_kash_id || null;
  const row =
    (kid && db?.claimed_kash?.[kid]) ? db.claimed_kash[kid] :
    (kid && db?.kash?.[kid]) ? db.kash[kid] :
    null;
  const p = row?.payload || row || {};
  return { kid, p };
}

function normalizeText(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join("\n");
  if (typeof v === "object" && v) return JSON.stringify(v, null, 2);
  return (v ?? "").toString();
}

export function composeResume({ mode = "BASE", db }) {
  if (!db) throw new Error("[composeResume] db required");

  if (mode !== "BASE" && mode !== "TARGET_KASH") {
    return {
      meta: { mode, version: "v0.2", created_at: nowISO() },
      basic: {},
      sections: {},
      render: { base_txt: "" },
      error: { code: "MODE_NOT_IMPLEMENTED", message: `mode not implemented: ${mode}` },
    };
  }

  // 1) Fact -> composeBase
  const { fp } = readFact(db);
  const fact_profile = fp || {};

  const { content, meta } = composeBase({
    fact_profile,
    template: RESUME_BASE_V2_ZH,
    options: { tone: "formal" },
  });

  let base_txt = (content || "").toString();

  // 2) TARGET_KASH：最小增强（先把“有关系”打通）
  if (mode === "TARGET_KASH") {
    const { p: tp } = readTarget(db);
    const { p: kp } = readKash(db);

    const targetTitleRaw = pick(tp, ["role_name","title","job_title","target_role","role_title","role","position","job","jobName"], "");
      const { p: rp } = readRole(db);
      const roleTitle = pick(rp, ["role_name","title","job_title","target_role","role_title","role","position","job","jobName"], "");
      const targetTitle = targetTitleRaw || roleTitle;
    const targetJD = pick(tp, ["jd", "note", "desc", "requirement"], "");

    const kashK = pick(kp, ["k", "knowledge", "K"], "");
    const kashA = pick(kp, ["a", "ability", "A"], "");
    const kashS = pick(kp, ["s", "skill", "skills", "S"], "");
    const kashH = pick(kp, ["h", "habit", "H"], "");

    const block = [
      "## 目标岗位（针对性）",
      targetTitle ? `- 岗位：${targetTitle}` : "- 岗位：（待补充）",
      targetJD ? `- JD要点：${normalizeText(targetJD)}` : "- JD要点：（待补充）",
      "",
      "## KASH 匹配要点（最小版）",
      `- K（Knowledge）：${normalizeText(kashK) || "（待补充）"}`,
      `- A（Ability）：${normalizeText(kashA) || "（待补充）"}`,
      `- S（Skill）：${normalizeText(kashS) || "（待补充）"}`,
      `- H（Habit）：${normalizeText(kashH) || "（待补充）"}`,
      "",
    ].join("\n");

    base_txt = block + base_txt;
  }

  // 3) 统一输出协议（actions 会取 out.render.base_txt）
  return {
    meta: { mode, version: "v0.2", created_at: nowISO(), ...(meta || {}), section_map: (meta?.section_map || {}) },
    basic: {
      name: pick(fact_profile, ["name"], ""),
      phone: pick(fact_profile, ["phone"], ""),
      email: pick(fact_profile, ["email"], ""),
      city: pick(fact_profile, ["city"], ""),
      title: pick(fact_profile, ["title"], ""),
    },
    sections: {},
    render: { base_txt },
  };
}
