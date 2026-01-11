// core/template_engine/templates/resume_base_v2_zh.js
// Resume Product — Standard Resume Template (ZH) v0.2
// 目标：用户“少输入/多复用”，输出“可直接投递”的标准版（世界500强常见结构）

export const RESUME_BASE_V2_ZH = {
  template_id: "resume_base_v2_zh",
  locale: "zh",
  version: 2,

  // 固定顺序：保证生成/预览/导出一致
  // 说明：这些是“输出结构”，不是要求用户每页都重复填
  sections: [
    { section_key: "header", title: "基本信息", required: true },

    // 价值密度最高：能让简历“像大厂候选人”
    { section_key: "headline", title: "个人亮点", required: false, max_items: 4 },
    { section_key: "summary", title: "个人简介", required: true },

    // 核心履历
    { section_key: "experience", title: "工作经历", required: false, max_items: 4 },
    { section_key: "projects", title: "项目经历", required: false, max_items: 4 },

    // 资质与能力
    { section_key: "education", title: "教育背景", required: false, max_items: 3 },
    { section_key: "skills", title: "技能", required: false, max_items: 16 },
    { section_key: "certs", title: "证书 / 语言", required: false, max_items: 8 },

    // 可选补强
    { section_key: "awards", title: "奖项 / 作品 / 论文", required: false, max_items: 6 },
    { section_key: "volunteer", title: "志愿 / 社团", required: false, max_items: 4 },
  ],
};

export default RESUME_BASE_V2_ZH;
