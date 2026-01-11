# Resume Product — 三层产品架构（V1）

## 目标（完成态）
L1 生成规范专业简历（可导出投递）
L2 目标岗位定向增强（AKSH/岗位画像驱动）
L3 测评→岗位匹配→潜质表达增强（KASH_PROFILE 驱动）

## 核心设计：统一输出 ResumeDoc
### ResumeDoc(Base)
- basic / summary / education / experience / projects / certifications / trainings
### ResumeDoc(Enhanced)
- enhance.role_targeting[]  (L2 输出)
- enhance.talent_potential[] (L3 输出)
- trace[]（来源字段/规则ID/画像ID/向量ID）

## L2：岗位画像驱动（AKSH）
### RoleProfile
- role_id, AKSH_vector
- keywords（岗位信号词）
- section_weights（各模块权重）
- evidence_prompts（缺证据时提示补录）
### 输出：RoleEnhancePack
- emphasis_blocks（强化哪些段）
- keyword_plan（哪些词、放哪里）
- gap_prompts（建议补录哪些事实）

## L3：测评驱动（KASH_PROFILE）
### 输入
- KASH_PROFILE{T,M,V,Δ,Harmony,Patterns,...}
### 计算
- fit(role) = w1*sim(K_user, AKSH_role) + w2*sim(V_user, V_role) + w3*(1-Δ_conflict)
### 输出
- RoleFitRank(topN) + FitExplain(trace)
- PotentialNarrativePack（可追溯五段式：特征→动机→情境→证据→适配）

## 交付流程
FACT → (L2可选) RoleTarget → (L3可选) TalentFit → Preview → Export

## DoD（验收）
1) L1：录入/保存/回填/下一步/导出一致
2) L2：可选目标岗位增强；增强内容可追溯且不编造事实
3) L3：可选测评匹配；输出岗位推荐+潜质表达；每段绑定来源与规则ID
