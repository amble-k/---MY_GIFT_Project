/**
 * JOB_MODELS_V0_1 (stub)
 * - 真实产品：这里会被你的岗位知识库替换
 * - 现在用于保证 step1_role 页面永远有可选项，不会 404
 */
export const JOB_MODELS_V0_1 = {
  meta: {
    version: "0.1-stub",
    source: "role_fit_stub"
  },
  models: [
    {
      key: "product_manager",
      title_zh: "产品经理",
      family: "product",
      jd_text: "负责需求分析、路线规划、跨团队协作与指标达成。"
    },
    {
      key: "data_analyst",
      title_zh: "数据分析师",
      family: "engineering",
      jd_text: "指标体系、数据分析、洞察输出与业务决策支持。"
    },
    {
      key: "software_engineer",
      title_zh: "软件工程师",
      family: "engineering",
      jd_text: "系统设计、编码、测试、上线与性能优化。"
    },
    {
      key: "office_admin",
      title_zh: "行政/综合支持",
      family: "ops",
      jd_text: "行政支持、流程协同、文档与资源管理。"
    }
  ]
};
