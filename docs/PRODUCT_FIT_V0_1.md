# MY GIFT（日本求职）岗位适配度产品技术策划 v0.1

## 0. 产品定位
- 产品：岗位适配度评估 + 第二资料（个性化表达文档）生成工具
- 切入点（免费/低门槛）：Fit Quick（岗位适配度报告）
- 核心护城河：岗位模型（KASH）× 用户画像（KASH）对标 + 可追溯输出
- 付费延伸：展开“为什么”，给定制拆解与行动方案（咨询型结构化输出）

## 1. 多入口总流程（外到内）
- 入口A：岗位浏览（Job Explore）——看示例/试算，判断值不值得录入
- 入口B：岗位适配评估（Fit Quick）——少量输入即出免费适配度报告
- 入口C：测评入口（Assessment）——测评后提升置信度，进入更深输出

中台合流原则：任何入口只要发生确认/录入，即写入用户专属档案；后续入口互取信息提升置信度，不要求一次走完全链路。

## 2. 输入 → 节点 → 输出（里程碑）
### Inputs
- I0 匿名浏览
- I1 选择岗位 job_key
- I2 轻量用户输入（3~8项）
- I3 事实档案（Fact Profile）
- I4 测评报告（MY_GIFT Report：T/M/V/Δ/Pattern/KASH_start）
- I5 目标岗位（Target role / role_target）

### Milestones（关键产出）
- M1 Fit Report（免费）：fit_grade/fit_score/confidence + top reasons + warnings + kash_start
- M2 User Profile（可追溯档案）：聚合 I2/I3/I4 → user_kash_profile + evidence
- M3 Job Model（岗位知识库）：job_kash_profile + subskills + evidence template
- M4 Gap Plan（行动规划）：30/90天（沿用 plan_90d writer）

### Outputs
- O1 岗位适配度报告（免费/可分享）
- O2 第二资料（个性化表达：动机/强项/贡献方式/适配理由）
- O3 简历文本（可选，非主战场）
- O4 深度职业建议/规划（会员/咨询）

## 3. 免费版 Fit Report 的结构（v0.1）
用户可见（免费）：
- 等级：S/A/B/C/D
- 分数：fit_score（0~1 或 0~100）
- 置信度：confidence（输入少则明确提示）
- 2~3条核心理由：top_reasons
- 1~2条风险提示：warnings
- 行动起点：kash_start（H/A/S/K）

免费版不展开（留付费/会员）：
- 岗位模型细节全量拆解
- 用户画像细颗粒解释（映射依据与证据链）
- 完整行动方案（仅给起点不出全套）

## 4. 中台内核（产品口径）
- 岗位模型：Job KASH Model
  - K 知识域；A 态度/偏好；S 技能；H 习惯/节奏系统
- 用户画像：User KASH Profile
  - 轻量输入形成粗画像（低置信度）
  - Fact/Assessment 形成可追溯画像（高置信度）
- 对标输出：fit_grade/fit_score + K/A/S/H gap summary + kash_start

## 5. 技术实施框架（复用/新增/改造）
### 5.1 复用（已有）
- core/logic_core.js：calculateReport + KASH_RULES（可复用到 fit）
- core/storage/resume_db.js：DB/active/session
- core/actions/v0_1_actions.js：step writers（fact/role/target/kash/plan/resume/export）
- apps/resume_product/router_runtime.js：路由壳
- data/narratives_*：叙事模板体系

### 5.2 已新增（本次已完成）
- data/job_models_v0_1.json/js：岗位模型知识库
- data/fit_report_schema_v0_1.json：Fit Report schema
- core/logic_core.js：calculateFitReportV01（fit_engine_v0_1）

### 5.3 待新增（最小闭环必须）
- 页面：Fit Quick 输入页（选择岗位 + 轻量输入 → 生成 fit_report）
- 页面：Fit Report 展示页（读 fit_report → 渲染）
- writer：writeFitReportV01（产物落库 + active/session 关联）
- 状态机（如有）：增加 HAS_FIT_REPORT

## 6. 总控原则（质量/体验）
- 可追溯：输出必须带模型版本/引擎版本/输入摘要
- 低输入可用但要诚实：confidence + warnings.low_input
- UI 极简：入口不超过一屏；报告先结论后理由再起点
- 质量闸门（最小版）：
  - fit_report 必含 meta/inputs/synthesis/fit/match
  - score 缺失则强制降级 fit_grade="C" 且 confidence<=0.4

## 7. 分步实施路线
- Step 1：Fit Quick → Fit Report 两页闭环（免费试用可传播）
- Step 2：接入 Assessment/Fact 提升置信度（confidence 体系）
- Step 3：从 gap 出发生成第二资料（会员/付费延伸）
