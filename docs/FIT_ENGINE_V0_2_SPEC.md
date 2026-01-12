# Fit Engine v0.2 计算规范（可追溯）v0.1

## 0. 目标
把 v0.1 的 demo scoring 替换为“真实对标”：
- 以岗位 KASH（job_kash）与用户 KASH（user_kash）为主轴
- 引入 evidence（测评/事实/简历）作为加权依据
- 输出 reasons/warnings 必须带 rule_id + evidence_ref，可追溯、可验证

---

## 1. 输入（Input Contract）
### 1.1 必填
- job_key: string

### 1.2 可选（决定置信度与 evidence）
- assessment_report: object | null
  - 至少需要：patterns.kash_start / patterns.kash_rule（若存在）
- fact_profile: object | null
  - 结构化：skills / projects / experience / habits（可为空）
- resume_profile: object | null
  - 结构化：highlights / keywords / achievements（可为空）
- locale: "zh-CN"|"en-US"|"ja-JP"（默认 zh-CN）

---

## 2. 中台数据结构（Core Structures）
### 2.1 岗位模型（Job Model）
- job.kash_profile: {K:[], A:[], S:[], H:[]}
- job.requirements (optional): skills[], keywords[], must_have[]

### 2.2 用户画像（User KASH Profile）
v0.2 要求输出一个“聚合后的 user_kash_profile”，来源如下：
- from assessment: A 信号（天赋/特质映射到 A）
- from fact/resume: K/S 信号（技能/知识证据）
- from habits: H 信号（习惯/持续性）

统一结构：
user_kash_profile = {
  K: [{key, weight, evidence_ref[]}],
  A: [{key, weight, evidence_ref[]}],
  S: [{key, weight, evidence_ref[]}],
  H: [{key, weight, evidence_ref[]}],
}

---

## 3. 计算：Gap / Match / Score
### 3.1 KASH Gap（0~1，越大越缺）
对每一维 d ∈ {K,A,S,H}：
- job_vec(d): 岗位该维的需求权重向量（由 job.kash_profile 生成，缺省均匀）
- user_vec(d): 用户该维的能力/倾向权重向量（由 evidence 聚合）
- match_d = cosine(job_vec, user_vec)  （或 weighted Jaccard，v0.2 先用 Jaccard 更易解释）
- gap_d = 1 - match_d

v0.2 推荐：weighted Jaccard（更可控）
- match_d = Σ min(job_wi, user_wi) / Σ max(job_wi, user_wi)
- 若两边都为空：match_d = 0.5（未知），并产生 warning: low_signal_{d}

### 3.2 Overall Fit Score（0~1）
给四维权重（可在 job_model 里配置，默认）：
- wK=0.25, wA=0.30, wS=0.30, wH=0.15
fit_score = 1 - (wK*gap_K + wA*gap_A + wS*gap_S + wH*gap_H)

### 3.3 Grade
- A: fit_score >= 0.80
- B: 0.65~0.79
- C: 0.50~0.64
- D: < 0.50

---

## 4. 置信度 confidence（0~1）
confidence = clamp( base + coverage_bonus - penalty, 0.2, 0.95 )

### 4.1 base
- base = 0.35

### 4.2 coverage_bonus（输入覆盖）
- has_assessment ? +0.25 : +0
- has_fact_profile ? +0.20 : +0
- has_resume_profile ? +0.10 : +0
- has_habit_signal ? +0.10 : +0

### 4.3 penalty（信号冲突/稀疏）
- low_signal_dims = count(d where job_vec(d) not empty and user_vec(d) empty)
- penalty = 0.05 * low_signal_dims

---

## 5. reasons / warnings（必须可追溯）
### 5.1 reasons（Top 3）
每条 reason：
- { rule_id, key, title_i18n, weight, evidence_ref[] }

规则候选（v0.2 最小集）：
- R1_strength_overlap_S: S 匹配高（match_S >= 0.7）
- R2_strength_overlap_K: K 匹配高（match_K >= 0.7）
- R3_trait_fit_A: A 匹配高（match_A >= 0.7）
- R4_habit_risk_H: H gap 高（gap_H >= 0.5）
- R5_skill_gap_S: S gap 高（gap_S >= 0.5）

### 5.2 warnings
- W1_low_input: inputs 少 → 仅供参考
- W2_low_signal_{K/A/S/H}: 对应维度缺少 evidence
- W3_conflict_signal: 证据之间冲突（后续 v0.3）

evidence_ref 规范（示例）：
- ["assessment:aid_xxx:pattern:kash_start"]
- ["fact:fp_xxx:skill:excel"]
- ["resume:rv_xxx:keyword:crm"]

---

## 6. 输出（Fit Report v0.2）
在 v0.1 schema 基础上增加：
- synthesis.metrics: { match_K,match_A,match_S,match_H, gap_K,gap_A,gap_S,gap_H }
- reasons[].rule_id + evidence_ref
- warnings[].rule_id + evidence_ref (可为空)

---

## 7. 与现有代码对接点（不改大结构）
- 入口：core/logic_core.js -> calculateFitReportV02(payload)
- 写入：core/actions/v0_1_actions.js -> writeFitDummy 改为调用 V02（保留 V01 兼容）
- 岗位模型：data/job_models_v0_1.* 可先扩字段（weights/requirements）但保持兼容
