/**
 * Resume Product - Input Spec
 * v0.2.3
 *
 * 目标：把“该怎么填”工程化（字段含义、必填、建议）
 */

export const INPUT_SPEC_V0_2_3 = Object.freeze({
  meta: { product:"Resume Product", contract:"input_spec", version:"0.2.3" },

  // 基础信息
  basic: {
    required: ["name", "targetRole"],
    fields: ["name", "targetRole", "city", "phone", "email", "links"],
  },

  // 工作经历（时间轴）
  experience_items: {
    required: ["company", "title"],
    recommended: ["period.start", "period.end", "responsibility_bullets", "achievement_bullets"],
    shape: {
      period: { start: "YYYY-MM", end: "YYYY-MM" },
      period_text: "2022.06-2025.12",
      company: "string",
      title: "string",
      responsibility_bullets: ["string"],
      achievement_bullets: ["string"],
    },
  },

  // 项目经历
  project_items: {
    required: ["name", "role_in_project"],
    recommended: ["period.start", "period.end", "work_bullets", "achievement_bullets"],
    shape: {
      role_in_project: "lead|participant",
      period: { start: "YYYY-MM", end: "YYYY-MM" },
      period_text: "string",
      name: "string",
      summary: "string",              // 1句简述
      work_bullets: ["string"],       // 做了什么
      achievement_bullets: ["string"],// 成果
      stack_tags: ["string"],
      link: "string|null",
    },
  },

  // 证书
  certifications: {
    shape: [{ name:"string", issuer:"string", date:"YYYY-MM|YYYY", credential_url:"string|null" }],
  },

  // 培训经历
  trainings: {
    shape: [{ name:"string", org:"string", date_or_period:"string", content:"string", outcome:"string|null" }],
  },
});
