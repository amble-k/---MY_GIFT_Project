/**
 * Resume Product - Mapping Rules Contract
 * v0.2.2
 *
 * 目标：
 * - 把“少文字、多选项”的输入（InputPayload）稳定映射成 ResumeDoc（唯一真相）
 * - 所有生成文本必须可追溯：每条 bullet 带 rule_id + from
 *
 * 注意：本文件只定义“规则与生成逻辑”，不做任何 HTML/CSS 渲染。
 */

export const MAPPING_RULES_V0_2_2 = Object.freeze({
  meta: {
    product: "Resume Product",
    contract: "mapping_rules",
    version: "0.2.2",
  },

  // 句型库（最小可用集合，后续可扩展/替换，但必须保持 rule_id 可追溯）
  templates: {
    // Summary（定位/强项/成果方向）
    RULE_SUMMARY_001: "面向{targetRole}方向，具备{skillsTop}等核心能力，长期关注{impactTop}。",
    RULE_SUMMARY_002: "擅长{respTop}与跨团队协作，推动{impactTop}相关目标落地。",
    RULE_SUMMARY_003: "注重以数据驱动决策与迭代，在{impactTop}方面有方法论与实践积累。",

    // Experience（职责+成果方向 + 量化 hint）
    RULE_EXP_001: "负责{respTop}，围绕{impactTop}制定方案并推动落地。",
    RULE_EXP_002: "通过{respTop}优化关键链路，提升{impactTop}相关指标表现。",
    RULE_EXP_METRIC_001: "产出可量化结果：{metricsHint}（建议在面试/材料中补充口径）。",

    // Project（项目类型/技术栈/成果方向）
    RULE_PJ_001: "项目聚焦{pjType}场景，围绕{impactTop}目标完成从方案到交付。",
    RULE_PJ_002: "技术栈涵盖{stackTop}，在实现过程中保障质量与可维护性。",
    RULE_PJ_METRIC_001: "项目结果可量化：{metricsHint}（建议补充对比基线/周期）。",
  },
});

/* ----------------- helpers ----------------- */
function s(v) { return (v == null ? "" : String(v)).trim(); }
function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr || []) {
    const t = s(x);
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
function pickTop(arr, n) { return uniq(arr).slice(0, n); }
function joinCN(arr) { return (arr || []).filter(Boolean).join("、"); }
function fmtContactLine(basic) {
  const city = s(basic?.city);
  const phone = s(basic?.phone);
  const email = s(basic?.email);
  const parts = [];
  if (city) parts.push(city);
  if (phone) parts.push(phone);
  if (email) parts.push(email);
  return parts.join(" · ");
}
function bullet(text, rule_id, from) {
  return { text: s(text), rule_id, from: Array.isArray(from) ? from : [] };
}
function applyTpl(tpl, vars) {
  let out = tpl;
  for (const [k, v] of Object.entries(vars || {})) out = out.replaceAll(`{${k}}`, s(v));
  return out;
}

/**
 * mapInputToResumeDoc_v0_2_2
 * - 输入：InputPayload（按 input_spec.v0_2_2）
 * - 输出：ResumeDoc（按 resume_model.v0_2_2）
 */
export function mapInputToResumeDoc_v0_2_2(input, { locale="zh-CN", theme="professional_clean" } = {}) {
  const basic = input?.basic || {};
  const targetRole = s(basic?.targetRole);
  const name = s(basic?.name);

  const impactTop = pickTop(input?.impact_tags || [], 2);
  const skillsTop = pickTop(input?.skill_tags || [], 3);
  const respTop = pickTop(input?.experience_items?.[0]?.responsibility_tags || [], 2);

  // Header
  const header = {
    name,
    titleLine: targetRole,
    contactLine: fmtContactLine(basic),
    links: [],
  };

  // Summary bullets（2-4条，按合同 gate）
  const summary = {
    bullets: [
      bullet(
        applyTpl(MAPPING_RULES_V0_2_2.templates.RULE_SUMMARY_001, {
          targetRole: targetRole || "目标岗位",
          skillsTop: joinCN(skillsTop) || "核心技能",
          impactTop: joinCN(impactTop) || "关键业务目标",
        }),
        "RULE_SUMMARY_001",
        ["basic.targetRole", "skill_tags", "impact_tags"]
      ),
      bullet(
        applyTpl(MAPPING_RULES_V0_2_2.templates.RULE_SUMMARY_002, {
          respTop: joinCN(respTop) || "关键职责",
          impactTop: joinCN(impactTop) || "关键业务目标",
        }),
        "RULE_SUMMARY_002",
        ["experience_items[0].responsibility_tags", "impact_tags"]
      ),
    ],
  };

  // Skills groups（输出统一分组，避免“堆词”）
  const skills = {
    groups: [
      { label: "核心技能", items: pickTop(input?.skill_tags || [], 12) },
    ],
  };

  // Experience（首版：最多1条，后续可扩展）
  const ex0 = input?.experience_items?.[0] || {};
  const exBullets = [];
  const freeExp = Array.isArray(ex0?.free_bullets) ? ex0.free_bullets.map(s).filter(Boolean) : [];
  if (freeExp.length) {
    freeExp.slice(0, 4).forEach((t) => exBullets.push(bullet(t, "RULE_FREE_BULLET_EXP", ["experience_items[0].free_bullets"])));
  }
  const exRespTop = pickTop(ex0?.responsibility_tags || [], 2);
  const exImpactTop = pickTop(ex0?.impact_tags || input?.impact_tags || [], 2);
  if (!freeExp.length && (exRespTop.length || exImpactTop.length)) {
    exBullets.push(
      bullet(
        applyTpl(MAPPING_RULES_V0_2_2.templates.RULE_EXP_001, {
          respTop: joinCN(exRespTop) || "核心职责",
          impactTop: joinCN(exImpactTop) || "关键目标",
        }),
        "RULE_EXP_001",
        ["experience_items[0].responsibility_tags", "experience_items[0].impact_tags"]
      )
    );
  }
  const metricsHint = s(ex0?.metrics_hint);
  if (metricsHint) {
    exBullets.push(
      bullet(
        applyTpl(MAPPING_RULES_V0_2_2.templates.RULE_EXP_METRIC_001, { metricsHint }),
        "RULE_EXP_METRIC_001",
        ["experience_items[0].metrics_hint"]
      )
    );
  }

  const experience = [];
  if (s(ex0.company) || s(ex0.title) || s(ex0.period) || exBullets.length) {
    experience.push({
      company: s(ex0.company),
      role: s(ex0.title),
      period: s(ex0.period),
      bullets: exBullets,
      highlights: [],
    });
  }

  // Projects（首版：最多1条）
  const pj0 = input?.project_items?.[0] || {};
  const pjBullets = [];
  const freePj = Array.isArray(pj0?.free_bullets) ? pj0.free_bullets.map(s).filter(Boolean) : [];
  if (freePj.length) {
    freePj.slice(0, 3).forEach((t) => pjBullets.push(bullet(t, "RULE_FREE_BULLET_PJ", ["project_items[0].free_bullets"])));
  }
  const pjType = s(pj0?.type_tag);
  const pjImpactTop = pickTop(pj0?.impact_tags || input?.impact_tags || [], 2);
  const stackTop = pickTop(pj0?.stack_tags || [], 4);
  if (!freePj.length && (pjType || pjImpactTop.length)) {
    pjBullets.push(
      bullet(
        applyTpl(MAPPING_RULES_V0_2_2.templates.RULE_PJ_001, {
          pjType: pjType || "业务",
          impactTop: joinCN(pjImpactTop) || "关键目标",
        }),
        "RULE_PJ_001",
        ["project_items[0].type_tag", "project_items[0].impact_tags"]
      )
    );
  }
  if (!freePj.length && stackTop.length) {
    pjBullets.push(
      bullet(
        applyTpl(MAPPING_RULES_V0_2_2.templates.RULE_PJ_002, { stackTop: joinCN(stackTop) }),
        "RULE_PJ_002",
        ["project_items[0].stack_tags"]
      )
    );
  }
  const pjMetric = s(pj0?.metrics_hint);
  if (!freePj.length && pjMetric) {
    pjBullets.push(
      bullet(
        applyTpl(MAPPING_RULES_V0_2_2.templates.RULE_PJ_METRIC_001, { metricsHint: pjMetric }),
        "RULE_PJ_METRIC_001",
        ["project_items[0].metrics_hint"]
      )
    );
  }

  const projects = [];
  if (s(pj0.name) || pjBullets.length) {
    projects.push({
      name: s(pj0.name),
      tagline: pjType ? `${pjType} 项目` : "",
      bullets: pjBullets,
      stack: stackTop,
      link: null,
    });
  }

  // Education（首版：最多1条）
  const edu0 = input?.education_items?.[0] || {};
  const education = [];
  if (s(edu0.school) || s(edu0.major) || s(edu0.degree)) {
    education.push({
      school: s(edu0.school),
      major: s(edu0.major),
      degree: s(edu0.degree),
      extra: null,
    });
  }

  // Trace：聚合 rule_ids（便于埋点/可追溯）
  const rule_ids = uniq([
    ...summary.bullets.map(b => b.rule_id),
    ...exBullets.map(b => b.rule_id),
    ...pjBullets.map(b => b.rule_id),
  ]);

  return {
    meta: { doc_version: "0.2.2", locale, theme, updated_at: new Date().toISOString() },
    header,
    summary,
    skills,
    experience,
    projects,
    education,
    trace: { source_ids: [], rule_ids },
  };
}
