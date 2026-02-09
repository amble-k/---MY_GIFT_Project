/**
 * ROLE_FIT Taxonomy v0.1
 * 목적: 자유입력 텍스트를 "태그"로 정규화하여 JobModel(KASH)와 계산 가능하게 만든다.
 * 원칙: UI/문항은 바꾸기보다, taxonomy/job_models 를 누적 개선한다.
 */

export const TAXONOMY_VERSION = "v0_1";

/** Company categories (Step1) */
export const COMPANY_CATEGORIES = [
  { key:"internet",       label:"互联网/IT" },
  { key:"manufacturing",  label:"制造业" },
  { key:"finance",        label:"金融" },
  { key:"consulting",     label:"咨询/专业服务" },
  { key:"retail",         label:"零售/消费" },
  { key:"healthcare",     label:"医疗/健康" },
  { key:"education",      label:"教育" },
  { key:"public",         label:"公共部门/事业单位" },
  { key:"startup",        label:"创业公司" },
  { key:"other",          label:"其他" }
];

/** Job families (Step1) */
export const JOB_FAMILIES = [
  { key:"product",      label:"产品/企划" },
  { key:"pm",           label:"项目/交付" },
  { key:"design",       label:"设计/创意" },
  { key:"engineering",  label:"研发/数据/技术" },
  { key:"marketing",    label:"市场/增长/品牌" },
  { key:"sales",        label:"销售/BD" },
  { key:"ops",          label:"运营/客服" },
  { key:"hr",           label:"人事/组织" },
  { key:"finance",      label:"财务/法务/风控" },
  { key:"consulting",   label:"咨询/研究" },
  { key:"other",        label:"其他（自定义）" }
];

/**
 * K tags: knowledge domains (学历/专业/证书/课程)
 * - keywords: 最小可用关键词集合（后续可持续增量）
 */
export const K_TAGS = [
  { tag:"k_degree",      label:"学历/学位",            keywords:["学士","硕士","博士","MBA","学位","学历"] },
  { tag:"k_cs",          label:"计算机/软件基础",        keywords:["计算机","软件工程","算法","数据结构","操作系统","网络"] },
  { tag:"k_data",        label:"数据/统计/分析基础",      keywords:["统计","概率","回归","AB测试","因果","数据分析","BI"] },
  { tag:"k_finance",     label:"财务/会计/金融基础",      keywords:["会计","财务","金融","审计","CPA","CFA","FRM"] },
  { tag:"k_risk",        label:"风控/合规/法务基础",      keywords:["风控","合规","反洗钱","AML","内控","法务","合同"] },
  { tag:"k_marketing",   label:"市场/品牌/增长基础",      keywords:["市场","品牌","增长","投放","渠道","营销","用户研究"] },
  { tag:"k_product",     label:"产品/需求/策略基础",      keywords:["产品","PRD","需求","roadmap","商业分析","竞品","策略"] },
  { tag:"k_industry",    label:"行业知识",              keywords:["行业","ToB","ToC","SaaS","制造","医疗","教育","零售"] },
  { tag:"k_language",    label:"语言能力",              keywords:["日语","JLPT","N1","N2","英语","TOEIC","IELTS"] },
];

/**
 * S tags: skills / tools / practical capabilities
 */
export const S_TAGS = [
  { tag:"s_excel",       label:"Excel/表格建模",         keywords:["Excel","表格","VLOOKUP","透视表","PowerQuery"] },
  { tag:"s_sql",         label:"SQL/数据查询",           keywords:["SQL","MySQL","PostgreSQL","BigQuery"] },
  { tag:"s_python",      label:"Python/脚本分析",        keywords:["Python","pandas","numpy","notebook"] },
  { tag:"s_pm",          label:"项目管理",               keywords:["项目管理","WBS","甘特图","里程碑","交付"] },
  { tag:"s_prd",         label:"PRD/需求定义",           keywords:["PRD","需求文档","用户故事","原型","Axure","Figma"] },
  { tag:"s_research",    label:"调研/访谈/洞察",         keywords:["访谈","问卷","调研","可用性测试","洞察"] },
  { tag:"s_sales",       label:"销售/BD",                keywords:["销售","BD","拓客","谈判","合同","KA"] },
  { tag:"s_risk",        label:"风控建模/策略",          keywords:["风控","策略","规则引擎","评分卡","欺诈"] },
  { tag:"s_ops",         label:"运营/流程优化",          keywords:["运营","SOP","流程","客服","工单","复盘"] },
  { tag:"s_patent",      label:"专利/成果物",            keywords:["专利","发明","论文","著作权","作品集"] },
];

/**
 * H dims: habits / behavioral patterns (0-100 self score)
 * - weights: Step6 计算用（可调参）
 */
export const H_DIMS = [
  { id:"h_planning",     label:"计划性/结构化",    hint:"能否拆解目标、制定节奏并持续推进", weight:1.0 },
  { id:"h_execution",    label:"执行力/闭环",      hint:"能否按时交付、形成闭环与复盘",       weight:1.0 },
  { id:"h_learning",     label:"学习与迭代",        hint:"能否快速学习、迭代方法并迁移",       weight:0.9 },
  { id:"h_communication",label:"沟通协作",         hint:"跨团队协作、对齐预期、减少摩擦",       weight:1.0 },
  { id:"h_resilience",   label:"抗压与稳定",        hint:"高压下保持稳定与自我调节",           weight:0.9 },
  { id:"h_detail",       label:"细节与规范",        hint:"质量意识、规范、风险预判",           weight:0.8 },
  { id:"h_autonomy",     label:"自驱与主动性",      hint:"是否主动发现问题并推动改进",         weight:1.1 },
];

/** utils */
export function normalizeText(s){
  return String(s||"").trim().toLowerCase();
}

/**
 * Minimal tag suggestion: keyword contains => tag
 * @param {string} text
 * @param {{tag:string, keywords:string[]}[]} dict
 * @returns {string[]} tags
 */
export function suggestTags(text, dict){
  const t = normalizeText(text);
  if (!t) return [];
  const out = [];
  (dict||[]).forEach(it=>{
    const ks = it && it.keywords ? it.keywords : [];
    const hit = ks.some(k => normalizeText(k) && t.includes(normalizeText(k)));
    if (hit) out.push(it.tag);
  });
  return Array.from(new Set(out));
}
