# MY GIFT 产品技术总纲 v0.1（可开工标准）

## 1. 产品总览
- 三入口：Job Explore / Fit Quick / Assessment
- 中台合流：任何入口确认/录入 → 写入用户档案（User Vault）

## 2. 关键产出
- Fit Report（免费）→ 结论 + 置信度 + CTA
- Personal Insight（会员）→ 解释“为什么”
- Resume / Plan / Career Suggestion（交付物）

## 3. 工程分层
1) Data：data/job_models_v0_1.*
2) Core Engine：core/logic_core.js（calculateReport / calculateFitReportV01）
3) Vault：core/storage/resume_db.js（后续演进 User Vault）
4) Actions：core/actions/v0_1_actions.js（writeFitDummy 等）
5) UI：apps/resume_product/pages/*
6) Router：apps/resume_product/router_runtime.js

## 4. v0.1 已完成（当前仓库事实）
- Fit Quick 页面三语切换 + 生成报告（JSON 输出）
- Job models v0.1（3 个示例岗位）
- Fit engine v0.1（demo scoring，可见变化）
- writer 写库：fit_results + active.fit_result_id
- router：/resume/fit 作为 hub，避免 guard 强制跳走

## 5. 下一阶段（v0.2）开发目标
- 用真实 KASH 对标替换 demo scoring
- reasons/warnings 加 rule_id 与 evidence
- confidence 可计算化
- Explore 入口页 + 免费示例演示
