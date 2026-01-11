/**
 * Resume Product - FACT Template Contract (Professional Resume)
 * v0.2.1
 *
 * 理念：FACT 是“数据采集/结构化”，Resume 是“专业呈现/版式信号”
 * - sections/blocks 描述“呈现结构”
 * - data_contract 描述“输入数据形状”（与 buildPayload() 一致）
 */

export const FACT_RESUME_SPEC_V0_2_1 = Object.freeze({
  meta: {
    product: "Resume Product",
    page: "FACT",
    spec_version: "0.2.1",
    style_intent: "professional_clean", // 专业/克制/信息密度适中
    locale: "zh-CN",
  },

  /**
   * 简历视觉结构（500强/外企审美常见骨架）：
   * Header → Summary → Skills → Experience → Projects → Education → Trace
   */
  sections: [
    {
      id: "resume_header",
      title: { zh: "抬头信息", ja: "ヘッダー" },
      blocks: [
        {
          id: "header_card",
          type: "header_card",
          props: {
            source: "basic",
            fields: ["name", "target", "city", "phone", "email"],
          },
        },
      ],
    },

    {
      id: "resume_summary",
      title: { zh: "个人简介", ja: "サマリー" },
      blocks: [
        {
          id: "summary_block",
          type: "summary_paragraph",
          props: { source: "summary", maxLines: 4 },
        },
        {
          id: "quality_hints",
          type: "hint_box",
          props: {
            tone: "neutral",
            text: {
              zh: "专业写法建议：1句话定位 + 1-2个强项 + 1个量化结果/规模（如有）。",
              ja: "書き方：1行の定位 + 強み1-2点 + 可能なら定量成果。",
            },
          },
        },
      ],
    },

    {
      id: "resume_skills",
      title: { zh: "技能", ja: "スキル" },
      blocks: [
        {
          id: "skills_chips",
          type: "chips",
          props: { source: "skills", max: 18, layout: "wrap" },
        },
      ],
    },

    {
      id: "resume_experience",
      title: { zh: "工作经历", ja: "職務経歴" },
      blocks: [
        {
          id: "experience_timeline",
          type: "timeline_experience",
          props: {
            source: "experience",
            fields: ["company", "title", "period"],
            bulletSource: "experience_bullets",
            maxBulletsPerItem: 4,
          },
        },
      ],
    },

    {
      id: "resume_projects",
      title: { zh: "项目经历", ja: "プロジェクト" },
      blocks: [
        {
          id: "projects_list",
          type: "project_cards",
          props: {
            source: "projects",
            fields: ["name", "desc"],
            maxItems: 4,
          },
        },
      ],
    },

    {
      id: "resume_education",
      title: { zh: "教育背景", ja: "学歴" },
      blocks: [
        {
          id: "education_list",
          type: "education_rows",
          props: { source: "education", fields: ["school", "major", "degree"], maxItems: 2 },
        },
      ],
    },

    {
      id: "resume_trace",
      title: { zh: "可追溯信息", ja: "トレーサビリティ" },
      blocks: [
        {
          id: "trace_refs",
          type: "trace_refs",
          props: { fields: ["basic", "summary", "skills", "education", "experience", "projects"] },
        },
      ],
    },
  ],

  /**
   * 与你 index.html buildPayload() 完全对齐
   */
  data_contract: {
    required: ["basic", "summary", "skills", "education", "experience", "projects"],
    optional: ["experience_bullets", "meta", "RULE_IDS"],
  },
});

/**
 * 开发期轻校验：不抛异常，返回 errors
 */
export function validateFactResumeData_v0_2_1(payloadLike) {
  const errors = [];
  const req = FACT_RESUME_SPEC_V0_2_1.data_contract.required;
  for (const k of req) {
    if (payloadLike == null || payloadLike[k] == null) errors.push(`Missing required field: ${k}`);
  }

  // 额外：basic 字段完整性（最小可投递信号）
  const b = payloadLike?.basic || {};
  if (!String(b.name || "").trim()) errors.push("basic.name is empty");
  if (!String(b.email || "").trim() && !String(b.phone || "").trim()) errors.push("basic.email/phone both empty");

  return { ok: errors.length === 0, errors };
}