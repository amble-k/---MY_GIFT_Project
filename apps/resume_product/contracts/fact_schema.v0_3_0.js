// apps/resume_product/contracts/fact_schema.v0_3_0.js
// FACT 字段字典表（工程版）v0.3.0
// 目标：L1/L2/L3 与模板层只读写这份 contract，禁止页面各自发明字段。

export const FACT_SCHEMA_V0_3_0 = Object.freeze({
  schema: "FACT_SCHEMA",
  version: "0.3.1",
  fields: [
    // ---- 0) meta ----
    { path: "schema_version", type: "string", l1: "R", example: "0.3.1", tags: ["meta"], notes: "迁移判断依据" },
    { path: "created_at", type: "isoDate", l1: "R", example: "2026-01-08T00:00:00.000Z", tags: ["meta"], notes: "系统写入" },
    { path: "updated_at", type: "isoDate", l1: "R", example: "2026-01-08T00:00:00.000Z", tags: ["meta"], notes: "系统写入" },
    { path: "locale", type: "enum", l1: "S", example: "zh-CN", tags: ["meta"], notes: "i18n 口吻" },
    { path: "privacy.mode", type: "enum", l1: "O", example: "normal", tags: ["privacy"], notes: "normal|masked|strict" },
    { path: "meta.source", type: "enum", l1: "O", example: "manual", tags: ["meta"], notes: "manual|import_pdf|import_linkedin" },
    { path: "meta.confidence", type: "number", l1: "O", example: 0.92, tags: ["meta"], notes: "导入/解析置信度" },
    { path: "meta.gaps[]", type: "array<string>", l1: "O", example: ["experience[0].achievements.metric"], tags: ["meta"], notes: "缺口提示输入" },

    // ---- 1) person ----
    { path: "person.name", type: "string", l1: "R", example: "王小强", tags: ["person"], notes: "必填" },

      // ---- JP résumé essentials (履歴書) ----
      { path: "person.name_kana", type: "string", l1: "S", example: "やまだ たろう", tags: ["person","jp"], notes: "JP: ふりがな（姓名读音）。日本市场建议必填，但暂不强制。" },

      { path: "person.birth.date", type: "isoDate", l1: "S", example: "1995-04-12", tags: ["person","jp","privacy"], notes: "JP: 生年月日。日本履歴書常见字段；隐私模式可不输出。" },
      { path: "person.birth.age", type: "number", l1: "S", example: 28, tags: ["person","jp"], notes: "可由 birth.date 推导；不建议用户手填。" },

      { path: "person.location.prefecture", type: "string", l1: "S", example: "東京都", tags: ["person","jp","location"], notes: "JP: 都道府県（日本地址拆分）。" },
      { path: "person.location.city_ward", type: "string", l1: "S", example: "渋谷区", tags: ["person","jp","location"], notes: "JP: 市区町村（含区/町/村）。" },
      { path: "person.location.address_line", type: "string", l1: "O", example: "神南1-19-11 パークウェースクエア2", tags: ["person","jp","location"], notes: "JP: 番地・建物名。可选，但履歴書更完整。" },

      { path: "person.contact.phone_mobile", type: "string", l1: "O", example: "090-1234-5678", tags: ["person","contact","jp"], notes: "JP: 携帯電話。可与 person.contact.phone 共存，模板层择优输出。" },

      // ---- preferences (本人希望記入欄) ----
      { path: "preferences.job_type", type: "string", l1: "S", example: "バックエンドエンジニア", tags: ["preferences","jp"], notes: "JP: 希望職種。也可用于 EN: Desired Role" },
      { path: "preferences.work_location", type: "string", l1: "S", example: "東京 / リモート可", tags: ["preferences","jp"], notes: "JP: 希望勤務地" },
      { path: "preferences.start_date", type: "string", l1: "O", example: "2026-02 入社可", tags: ["preferences","jp"], notes: "JP: 入社可能時期（可用自由文本）" },
      { path: "preferences.salary_note", type: "string", l1: "O", example: "貴社規定に従います", tags: ["preferences","jp","privacy"], notes: "JP: 希望年収。敏感字段，默认不强制输出。" },

      // ---- commute / photo (JP common) ----
      { path: "person.photo.url", type: "string", l1: "O", example: "asset://photo_001", tags: ["person","photo","jp","privacy"], notes: "JP: 写真。可选；隐私模式默认不输出。" },
      { path: "person.commute.nearest_station", type: "string", l1: "O", example: "渋谷駅", tags: ["person","jp","commute"], notes: "JP: 最寄駅" },
      { path: "person.commute.time_minutes", type: "number", l1: "O", example: 35, tags: ["person","jp","commute"], notes: "JP: 通勤時間（分钟）" },

      // ---- visa (for non-JP nationals; L3) ----
      { path: "person.visa.status", type: "string", l1: "O", example: "技術・人文知識・国際業務", tags: ["person","visa","jp","privacy"], notes: "JP: 在留資格/签证状态（L3）。默认不强制输出。" },
      { path: "person.visa.expiry", type: "isoDate", l1: "O", example: "2027-03-31", tags: ["person","visa","jp","privacy"], notes: "JP: 在留期限（L3）。" },

      // ---- output control (L3 template/runtime uses) ----
      { path: "privacy.output_overrides", type: "object", l1: "O", example: { "person.birth.date": false, "person.photo.url": false }, tags: ["privacy"], notes: "字段级输出开关：false=不输出（模板层读取）" },

    { path: "person.location.city", type: "string", l1: "S", example: "东京", tags: ["person"], notes: "可只填 city" },
    { path: "person.location.country", type: "string", l1: "O", example: "日本", tags: ["person"], notes: "" },
    { path: "person.contact.email", type: "string", l1: "R*", example: "a@b.com", tags: ["person","contact"], notes: "email/phone 至少其一必填（见 rules）" },
    { path: "person.contact.phone", type: "string", l1: "O*", example: "090-xxxx", tags: ["person","contact"], notes: "email/phone 至少其一必填（见 rules）" },
    { path: "person.contact.wechat", type: "string", l1: "O", example: "wxid_xxx", tags: ["person","contact"], notes: "CN 常用" },
    { path: "person.contact.line", type: "string", l1: "O", example: "line_xxx", tags: ["person","contact"], notes: "JP 常用" },
    { path: "person.work_authorization", type: "enum", l1: "O", example: "visa", tags: ["person"], notes: "citizen|visa|unknown" },

    // links[]
    { path: "links[]", type: "array<object>", l1: "S", example: [{ type: "github", url: "https://github.com/xxx", label: "GitHub" }], tags: ["links"], notes: "建议至少 1 个" },
    { path: "links[].type", type: "enum", l1: "S", example: "github", tags: ["links"], notes: "linkedin|github|portfolio|blog|other" },
    { path: "links[].url", type: "string", l1: "S", example: "https://...", tags: ["links"], notes: "URL 校验" },
    { path: "links[].label", type: "string", l1: "O", example: "作品集", tags: ["links"], notes: "" },

    // ---- 2) 定位与摘要 ----
    { path: "headline", type: "string", l1: "O", example: "B端增长产品 / 数据驱动", tags: ["summary"], notes: "可由 L2/L3 改写建议稿" },
    { path: "summary", type: "string", l1: "O", example: "3年产品经验，擅长...", tags: ["summary"], notes: "同上" },

    // ---- 3) skills ----
    { path: "skills.items[]", type: "array<object>", l1: "S", example: [{ name: "SQL", category: "tool" }], tags: ["skills"], notes: "L1 建议≥5" },
    { path: "skills.taxonomy_version", type: "string", l1: "O", example: "tax_v1", tags: ["skills"], notes: "系统分类用" },
    { path: "skills.items[].name", type: "string", l1: "S", example: "SQL", tags: ["skills"], notes: "事实名词" },
    { path: "skills.items[].category", type: "enum", l1: "O", example: "tool", tags: ["skills"], notes: "language|framework|tool|domain|method|soft" },
    { path: "skills.items[].context_refs[]", type: "array<ref>", l1: "O", example: ["exp_x1","proj_1"], tags: ["skills"], notes: "指向经历/项目" },
    { path: "skills.items[].evidence_refs[]", type: "array<ref>", l1: "O", example: ["ev_1"], tags: ["skills"], notes: "证据挂钩" },

    // ---- 4) experience[] ----
    { path: "experience[]", type: "array<object>", l1: "R", example: [{ id:"exp_x1", company:{name:"XX"}, role:{title:"产品经理"}, start_date:"2023-04" }], tags: ["experience"], notes: "L1 至少 1 条" },
    { path: "experience[].id", type: "string", l1: "R", example: "exp_x1", tags: ["experience"], notes: "稳定引用" },
    { path: "experience[].company.name", type: "string", l1: "R", example: "XX科技", tags: ["experience"], notes: "" },
    { path: "experience[].company.industry", type: "string", l1: "O", example: "SaaS", tags: ["experience"], notes: "" },
    { path: "experience[].company.size", type: "enum", l1: "O", example: "51-200", tags: ["experience"], notes: "规模枚举" },
    { path: "experience[].company.location", type: "string", l1: "O", example: "上海", tags: ["experience"], notes: "" },
    { path: "experience[].role.title", type: "string", l1: "R", example: "产品经理", tags: ["experience"], notes: "" },
    { path: "experience[].role.level", type: "enum", l1: "O", example: "senior", tags: ["experience"], notes: "" },
    { path: "experience[].employment_type", type: "enum", l1: "O", example: "full-time", tags: ["experience"], notes: "full-time|intern|contract|part-time" },
    { path: "experience[].start_date", type: "isoDate", l1: "R", example: "2023-04", tags: ["experience"], notes: "允许 YYYY-MM" },
    { path: "experience[].end_date", type: "isoDate|null", l1: "S", example: null, tags: ["experience"], notes: "null=至今" },
    { path: "experience[].scope", type: "string", l1: "O", example: "增长/转化/留存", tags: ["experience"], notes: "用于 selector" },
    { path: "experience[].team.team_name", type: "string", l1: "O", example: "增长组", tags: ["experience"], notes: "" },
    { path: "experience[].team.team_size", type: "number", l1: "O", example: 8, tags: ["experience"], notes: "" },
    { path: "experience[].responsibilities[]", type: "array<string>", l1: "S", example: ["负责A..."], tags: ["experience"], notes: "可先填原话" },
    { path: "experience[].achievements[]", type: "array<object>", l1: "S", example: [{ what:"优化漏斗", metric:{name:"转化率", delta:12.5, unit:"pp"} }], tags: ["experience","achievement"], notes: "结构化成果（差异壁垒）" },
    { path: "experience[].tech_stack[]", type: "array<string>", l1: "O", example: ["SQL","GA4"], tags: ["experience","skills"], notes: "" },
    { path: "experience[].keywords[]", type: "array<string>", l1: "O", example: ["A/B测试"], tags: ["experience"], notes: "系统抽取" },
    { path: "experience[].notes", type: "string", l1: "O", example: "原始描述...", tags: ["experience"], notes: "仅用于解析保留" },

    // achievements item
    { path: "experience[].achievements[].what", type: "string", l1: "S", example: "优化注册漏斗", tags: ["achievement"], notes: "" },
    { path: "experience[].achievements[].how", type: "string", l1: "O", example: "A/B测试+表单简化", tags: ["achievement"], notes: "" },
    { path: "experience[].achievements[].impact", type: "string", l1: "O", example: "转化率提升", tags: ["achievement"], notes: "" },
    { path: "experience[].achievements[].metric.name", type: "string", l1: "O", example: "注册转化率", tags: ["achievement","metric"], notes: "" },
    { path: "experience[].achievements[].metric.delta", type: "number", l1: "O", example: 12.5, tags: ["achievement","metric"], notes: "" },
    { path: "experience[].achievements[].metric.unit", type: "enum", l1: "O", example: "pp", tags: ["achievement","metric"], notes: "pp|%|x|abs" },
    { path: "experience[].achievements[].metric.baseline", type: "number", l1: "O", example: 18.0, tags: ["achievement","metric"], notes: "" },
    { path: "experience[].achievements[].period", type: "string", l1: "O", example: "2个月", tags: ["achievement"], notes: "" },
    { path: "experience[].achievements[].attribution", type: "string", l1: "O", example: "主导", tags: ["achievement"], notes: "" },
    { path: "experience[].achievements[].evidence_refs[]", type: "array<ref>", l1: "O", example: ["ev_12"], tags: ["achievement","evidence"], notes: "" },

    // ---- 5) projects[] ----
    { path: "projects[]", type: "array<object>", l1: "O", example: [{ id:"proj_1", name:"推荐系统Demo" }], tags: ["projects"], notes: "" },
    { path: "projects[].id", type: "string", l1: "R", example: "proj_1", tags: ["projects"], notes: "" },
    { path: "projects[].name", type: "string", l1: "S", example: "推荐系统Demo", tags: ["projects"], notes: "" },
    { path: "projects[].role", type: "string", l1: "O", example: "负责人", tags: ["projects"], notes: "" },
    { path: "projects[].start_date", type: "isoDate", l1: "O", example: "2024-01", tags: ["projects"], notes: "" },
    { path: "projects[].end_date", type: "isoDate|null", l1: "O", example: null, tags: ["projects"], notes: "" },
    { path: "projects[].description", type: "string", l1: "O", example: "....", tags: ["projects"], notes: "" },
    { path: "projects[].highlights[]", type: "array<object>", l1: "S", example: [{ what:"实现X", impact:"性能提升", metric:{delta:2,unit:"x"} }], tags: ["projects","achievement"], notes: "复用 achievements 结构" },
    { path: "projects[].stack[]", type: "array<string>", l1: "O", example: ["Python"], tags: ["projects","skills"], notes: "" },
    { path: "projects[].links[]", type: "array<object>", l1: "O", example: [{ type:"github", url:"https://..." }], tags: ["projects","links"], notes: "" },
    { path: "projects[].evidence_refs[]", type: "array<ref>", l1: "O", example: ["ev_3"], tags: ["projects","evidence"], notes: "" },

    // ---- 6) education[] ----
    { path: "education[]", type: "array<object>", l1: "S", example: [{ school:"XX大学", degree:"bachelor" }], tags: ["education"], notes: "应届建议必填" },
    { path: "education[].school", type: "string", l1: "S", example: "XX大学", tags: ["education"], notes: "" },
    { path: "education[].degree", type: "enum", l1: "O", example: "master", tags: ["education"], notes: "bachelor|master|phd|bootcamp" },
    { path: "education[].major", type: "string", l1: "O", example: "计算机", tags: ["education"], notes: "" },
    { path: "education[].start_date", type: "isoDate", l1: "O", example: "2019-09", tags: ["education"], notes: "" },
    { path: "education[].end_date", type: "isoDate|null", l1: "O", example: "2023-06", tags: ["education"], notes: "" },
    { path: "education[].gpa", type: "number", l1: "O", example: 3.6, tags: ["education"], notes: "" },
    { path: "education[].courses[]", type: "array<string>", l1: "O", example: ["数据结构"], tags: ["education"], notes: "" },
    { path: "education[].honors[]", type: "array<string>", l1: "O", example: ["一等奖学金"], tags: ["education"], notes: "" },
    { path: "education[].thesis", type: "string", l1: "O", example: "....", tags: ["education"], notes: "" },
    { path: "education[].activities[]", type: "array<string>", l1: "O", example: ["ACM"], tags: ["education"], notes: "" },

    // ---- 7) optional groups (统一模式，先铺最关键字段) ----
    { path: "certifications[]", type: "array<object>", l1: "O", example: [{ name:"AWS SAA", org:"AWS", date:"2025-06", credential_url:"https://..." }], tags: ["cert"], notes: "" },
    { path: "awards[]", type: "array<object>", l1: "O", example: [{ name:"一等奖学金", org:"XX大学", date:"2021-11" }], tags: ["award"], notes: "" },
    { path: "publications[]", type: "array<object>", l1: "O", example: [{ title:"论文A", venue:"ICML", date:"2024-07", url:"https://..." }], tags: ["pub"], notes: "" },
    { path: "patents[]", type: "array<object>", l1: "O", example: [{ title:"专利A", org:"XX", date:"2023-03" }], tags: ["patent"], notes: "" },
    { path: "open_source[]", type: "array<object>", l1: "O", example: [{ title:"repo", url:"https://github.com/..." }], tags: ["oss"], notes: "" },
    { path: "volunteering[]", type: "array<object>", l1: "O", example: [{ title:"志愿者", org:"NGO", date:"2022-08" }], tags: ["volunteer"], notes: "" },
    { path: "activities[]", type: "array<object>", l1: "O", example: [{ title:"社团干部", org:"XX", date:"2020-09" }], tags: ["activity"], notes: "" },
    { path: "languages[]", type: "array<object>", l1: "O", example: [{ name:"English", level:"C1" }], tags: ["lang"], notes: "" },

    // ---- 8) evidence[] ----
    { path: "evidence[]", type: "array<object>", l1: "O", example: [{ id:"ev_1", type:"link", title:"作品集", url_or_blob_ref:"https://..." }], tags: ["evidence"], notes: "证据库（差异点）" },
    { path: "evidence[].id", type: "string", l1: "R", example: "ev_1", tags: ["evidence"], notes: "" },
    { path: "evidence[].type", type: "enum", l1: "S", example: "link", tags: ["evidence"], notes: "link|file|image|metric|quote|cert|other" },
    { path: "evidence[].title", type: "string", l1: "O", example: "增长看板截图", tags: ["evidence"], notes: "" },
    { path: "evidence[].url_or_blob_ref", type: "string", l1: "O", example: "https://...", tags: ["evidence"], notes: "本地/远程统一引用" },
    { path: "evidence[].relates_to_ids[]", type: "array<ref>", l1: "O", example: ["exp_x1","proj_1"], tags: ["evidence"], notes: "关联经历/项目" },
    { path: "evidence[].confidentiality", type: "enum", l1: "O", example: "masked", tags: ["evidence","privacy"], notes: "public|private|masked" },
    { path: "evidence[].note", type: "string", l1: "O", example: "....", tags: ["evidence"], notes: "" },
  ],
});

// L1 校验规则（contract 固定，页面不许私自改）
// 注意：person.contact.email/phone 的 R* / O* 由规则表达“至少其一”。
export const L1_REQUIRED_RULES_V0_3_0 = Object.freeze({
  version: "0.3.1",
  rules: [
    { id: "L1_PERSON_NAME_REQUIRED", type: "required", path: "person.name", message: "请填写姓名" },
    {
      id: "L1_CONTACT_ONE_REQUIRED",
      type: "atLeastOne",
      paths: ["person.contact.email","person.contact.phone","person.contact.phone_mobile"],
      message: "邮箱/电话至少填写一个",
    },
    { id: "L1_EXPERIENCE_MIN1", type: "minItems", path: "experience[]", min: 1, message: "请至少填写一条工作经历" },
    {
      id: "L1_EXPERIENCE_CORE_FIELDS",
      type: "forEachRequired",
      path: "experience[]",
      required: ["company.name", "role.title", "start_date"],
      message: "每条经历至少需要：公司、岗位、开始时间",
    },
    {
      id: "L1_EXPERIENCE_DESC_MIN2",
      type: "forEachMinSum",
      path: "experience[]",
      sums: [
        { a: "responsibilities[]", b: "achievements[]", min: 2 },
      ],
      message: "每条经历请至少填写 2 条要点（职责+成果合计）",
    },

      // ---- JP-only required rules (enabled only when locale=ja-JP) ----
      {
        id: "JP_L1_NAME_KANA_REQUIRED",
        type: "required",
        path: "person.name_kana",
        message: "（日本履歴書）请填写姓名假名（ふりがな）",
        jp_only: true,
      },
      {
        id: "JP_L1_BIRTH_DATE_REQUIRED",
        type: "required",
        path: "person.birth.date",
        message: "（日本履歴書）请填写出生年月日（生年月日）",
        jp_only: true,
      },
      {
        id: "JP_L1_PREF_CITY_REQUIRED",
        type: "required",
        path: "person.location.prefecture",
        message: "（日本履歴書）请填写都道府县（都道府県）",
        jp_only: true,
      },
      {
        id: "JP_L1_CITY_WARD_REQUIRED",
        type: "required",
        path: "person.location.city_ward",
        message: "（日本履歴書）请填写市区町村（市区町村）",
        jp_only: true,
      },

  ],
});

