/**
 * Resume Product - Input Spec Contract
 * v0.2.2
 *
 * 目标：定义“少文字、多选项”的录入字段、枚举、约束。
 * 该合同只描述输入，不描述输出排版。
 */

export const INPUT_SPEC_V0_2_2 = Object.freeze({
  meta: {
    product: "Resume Product",
    contract: "input_spec",
    version: "0.2.2",
    locale_default: "zh-CN",
  },

  /**
   * 枚举与标签（可扩展）
   * - 所有多选项必须来自这里，避免页面里散落字符串
   */
  enums: {
    role_level: ["intern", "junior", "mid", "senior", "lead"],
    resume_language: ["zh-CN", "en-US", "ja-JP"],
    target_role_family: ["pm", "dev", "data", "design", "ops", "sales", "marketing", "other"],

    // 影响/成果方向（用于生成 bullet 句型）
    impact_tags: ["增长", "转化", "留存", "降本", "提效", "稳定性", "体验", "营收", "风控", "合规"],

    // 通用职责（首批通用，后续可按岗位族扩展专属库）
    responsibility_tags: [
      "需求分析", "方案设计", "项目管理", "跨部门协作", "数据分析", "实验A/B", "用户研究",
      "流程优化", "系统设计", "性能优化", "质量保障", "监控告警", "上线发布"
    ],

    // 技能标签（建议后续做岗位族分组；此处先给最小可用集合）
    skill_tags: [
      "PRD", "Axure", "Figma", "SQL", "Python", "JavaScript", "React", "Node.js",
      "Java", "Go", "Linux", "Docker", "Kubernetes", "Tableau", "PowerBI",
      "用户研究", "数据分析", "A/B测试", "埋点", "增长", "推荐系统"
    ],

    // 项目类型标签
    project_type_tags: ["B2B", "B2C", "平台", "增长", "数据", "AI", "基础设施", "工具链", "商业化"],

    // 技术栈（项目/经验补充）
    stack_tags: ["MySQL", "Redis", "Kafka", "ElasticSearch", "AWS", "GCP", "Azure", "Nginx", "Spring", "Next.js"],
  },

  /**
   * 字段定义（InputPayload）
   * - type: input/textarea/select/multiselect
   * - required: 是否必填（输入层必填≠输出层必达；输出层由 Gate 决定）
   * - max: 最大选择/字数限制（用于 UI 与保存校验）
   */
  fields: [
    // ---- 基础信息 ----
    { id: "basic.name", label: "姓名", type: "input", required: true, maxChars: 30 },
    { id: "basic.targetRole", label: "目标岗位", type: "input", required: true, maxChars: 40 },
    { id: "basic.city", label: "城市", type: "input", required: false, maxChars: 30 },
    { id: "basic.phone", label: "电话", type: "input", required: false, maxChars: 30 },
    { id: "basic.email", label: "邮箱", type: "input", required: false, maxChars: 60 },

    // ---- 选择项：定位与语言 ----
    { id: "role_level", label: "职级", type: "select", required: true, enum: "role_level" },
    { id: "resume_language", label: "简历语言", type: "select", required: true, enum: "resume_language" },
    { id: "target_role_family", label: "岗位族", type: "select", required: true, enum: "target_role_family" },

    // ---- Summary 输入：少文字（关键词/亮点标签）----
    { id: "summary_keywords", label: "个人亮点关键词（可选）", type: "input", required: false, maxChars: 60 },
    { id: "impact_tags", label: "成果方向（多选）", type: "multiselect", required: true, enum: "impact_tags", max: 3 },

    // ---- Skills：多选为主 ----
    { id: "skill_tags", label: "技能标签（多选）", type: "multiselect", required: true, enum: "skill_tags", max: 18 },

    // ---- 经历（首版：1-2 段即可；后续可做增删条目 UI）----
    { id: "experience_items[0].company", label: "公司", type: "input", required: false, maxChars: 40 },
    { id: "experience_items[0].title", label: "职位", type: "input", required: false, maxChars: 40 },
    { id: "experience_items[0].period", label: "时间", type: "input", required: false, maxChars: 30 },
    { id: "experience_items[0].responsibility_tags", label: "职责（多选）", type: "multiselect", required: false, enum: "responsibility_tags", max: 5 },
    { id: "experience_items[0].impact_tags", label: "成果方向（多选）", type: "multiselect", required: false, enum: "impact_tags", max: 3 },
    { id: "experience_items[0].metrics_hint", label: "量化信息（可选）", type: "input", required: false, maxChars: 30 },

    // ---- 项目（首版：1 个即可）----
    { id: "project_items[0].name", label: "项目名称", type: "input", required: false, maxChars: 40 },
    { id: "project_items[0].type_tag", label: "项目类型", type: "select", required: false, enum: "project_type_tags" },
    { id: "project_items[0].stack_tags", label: "技术栈（多选）", type: "multiselect", required: false, enum: "stack_tags", max: 8 },
    { id: "project_items[0].impact_tags", label: "成果方向（多选）", type: "multiselect", required: false, enum: "impact_tags", max: 3 },
    { id: "project_items[0].metrics_hint", label: "量化信息（可选）", type: "input", required: false, maxChars: 30 },

    // ---- 教育（首版：1 条）----
    { id: "education_items[0].school", label: "学校", type: "input", required: false, maxChars: 40 },
    { id: "education_items[0].major", label: "专业", type: "input", required: false, maxChars: 40 },
    { id: "education_items[0].degree", label: "学历", type: "input", required: false, maxChars: 20 },
  ],
});

/**
 * validateInputPayload_v0_2_2
 * - 基于 InputSpec 的轻校验（枚举合法性、必填、max）
 * - 不抛异常
 */
function s(v) { return (v == null ? "" : String(v)).trim(); }
function get(obj, path) {
  // 支持 basic.name / arr[0].x
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
function isArr(a) { return Array.isArray(a); }

export function validateInputPayload_v0_2_2(payload) {
  const errors = [];
  const warnings = [];
  const enums = INPUT_SPEC_V0_2_2.enums;

  for (const f of INPUT_SPEC_V0_2_2.fields) {
    const v = get(payload, f.id);

    if (f.required) {
      const ok = f.type === "multiselect" ? (isArr(v) && v.length > 0) : !!s(v);
      if (!ok) errors.push(`Missing required: ${f.id}`);
    }

    if (f.enum) {
      const allowed = enums[f.enum] || [];
      if (f.type === "select") {
        if (s(v) && !allowed.includes(s(v))) errors.push(`Invalid enum value: ${f.id}=${s(v)}`);
      } else if (f.type === "multiselect") {
        if (isArr(v)) {
          for (const it of v) if (s(it) && !allowed.includes(s(it))) errors.push(`Invalid enum item: ${f.id} includes ${s(it)}`);
        }
      }
    }

    if (typeof f.max === "number" && isArr(v) && v.length > f.max) warnings.push(`Too many selected: ${f.id} (>${f.max})`);
    if (typeof f.maxChars === "number" && s(v) && s(v).length > f.maxChars) warnings.push(`Too long: ${f.id} (>${f.maxChars} chars)`);
  }

  return { ok: errors.length === 0, errors, warnings };
}
