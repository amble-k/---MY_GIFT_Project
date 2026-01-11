// core/template_engine/templates/resume_base_v1_zh.js

export const RESUME_BASE_V1_ZH = {
  template_id: "resume_base_v1_zh",
  locale: "zh",
  version: 1,

  // v0.1：固定顺序，保证“生成→预览→导出”稳定
  sections: [
    { section_key: "header", title: "基本信息", required: true },
    { section_key: "summary", title: "个人简介", required: true },

    { section_key: "experience", title: "工作经历", required: false, max_items: 3 },
    { section_key: "projects", title: "项目经历", required: false, max_items: 3 },

    { section_key: "education", title: "教育背景", required: false, max_items: 2 },
    { section_key: "skills", title: "技能", required: false, max_items: 12 },
  ],
};

export default RESUME_BASE_V1_ZH;