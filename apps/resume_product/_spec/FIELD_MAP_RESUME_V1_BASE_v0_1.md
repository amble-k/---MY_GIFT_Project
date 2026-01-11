# Resume Product — FIELD MAP (V1 BASE) v0.1
> 目的：定义「FACT 输入」如何映射到「V1(BASE) 简历模板」，保证用户填了就一定能在 V1 出现。

## 0. 术语与SSOT
- SSOT(候选人事实数据)：db.fact_profiles[fpId].payload 作为唯一事实来源（简称 fact_profile）
- 目标/岗位数据：db.target_profiles / db.role_profiles（不进入 BASE；仅在 TARGET_KASH 模式附加）
- V2/V3：用户编辑稿（不反写 fact_profile；导出时优先用 V3 > V2 > V1）

## 1. V1(BASE) 必须覆盖的模板段落（最小合格简历）
1) 基本信息（必有）
2) 个人简介（可空但要占位）
3) 工作经历（可空但要占位）
4) 项目经历（可空但要占位）
5) 教育背景（可空但要占位）
6) 技能（可空但要占位）

## 2. 字段映射规则（Fact → V1 BASE）
### 2.1 基本信息 Basic
- name        := fact_profile.basic.name  || fact_profile.name
- city        := fact_profile.basic.city  || fact_profile.city
- phone       := fact_profile.basic.phone || fact_profile.phone
- email       := fact_profile.basic.email || fact_profile.email
- title       := fact_profile.basic.title || fact_profile.title  （可选：当前求职头衔）

### 2.2 个人简介 Summary
- summary := 优先 fact_profile.summary
- 若 summary 为空：
  - 可由 title + years + strengths 拼一句（后续v0.2再做），v0.1 先保留占位“（待补充）”

### 2.3 工作经历 Work
- work_experiences := fact_profile.work || fact_profile.experience || []
- 期望结构（数组）：
  - { company, role, start, end, city, highlights:[...], keywords:[...] }
- 渲染规则：
  - 每条至少输出 company + role + start/end
  - highlights 若为空则输出“（待补充）”

### 2.4 项目经历 Projects
- projects := fact_profile.projects || []
- 期望结构（数组）：
  - { name, role, start, end, highlights:[...], tech:[...] }
- 渲染规则：
  - 每条至少输出 name
  - highlights 若为空则输出“（待补充）”

### 2.5 教育背景 Education
- education := fact_profile.education || fact_profile.edu || []
- 期望结构（数组）：
  - { school, degree, major, start, end, gpa, highlights:[...] }
- 渲染规则：
  - 每条至少输出 school + degree/major（有啥写啥）
  - highlights 可选

### 2.6 技能 Skills
- skills := fact_profile.skills || []
- 期望结构：
  - 数组字符串：["Python","SQL","沟通"] 或
  - 对象：{ hard:[...], soft:[...], tools:[...] }
- 渲染规则：
  - 统一归一化为若干行 bullet
  - 为空则占位“（待补充）”

## 3. 去重与一致性（避免用户重复写三遍岗位）
- V1(BASE) 不包含 target/role/kash（保持“可投递基础简历”定位）
- TARGET_KASH 模式才追加：
  - 目标岗位标题：优先 target_profiles.payload.role_name/title/job_title/target_role
  - 岗位JD要点：target_profiles.payload.jd/note/desc/requirement
  - 若 target 没有标题，则允许 fallback 到 role_profile（后续实现）
- 任何“岗位名称”只应在 TARGET_KASH block 出现一次，不应散落在 BASE 段落里

## 4. 验收标准（必须满足）
- 在 FACT 填了 education/skills/work/projects 任一字段：
  - V1(BASE) 对应段落必须出现非占位内容（不是只剩“基本信息”）
- 没填则允许显示“（待补充）”，但段落标题必须存在

