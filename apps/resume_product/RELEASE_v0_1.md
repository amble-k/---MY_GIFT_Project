# Resume Product v0.1 Release Note

## 版本信息
- Product：Resume Product
- Version：v0.1.0
- Date：2025-12-27
- Entry（SSOT）：/apps/resume_product/index.html#/resume

## 入口
- 正常入口（Hub）：/apps/resume_product/index.html#/resume
- Debug 入口（带 Health 按钮）：/apps/resume_product/index.html?debug=1#/resume
- Health 直达：/apps/resume_product/pages/_health/index.html?debug=1#/health

## Quick Start（本地验证）
- 正常入口：http://localhost:5173/apps/resume_product/index.html#/resume
- Debug 入口：http://localhost:5173/apps/resume_product/index.html?debug=1#/resume
- Health 页：http://localhost:5173/apps/resume_product/pages/_health/index.html?debug=1#/health

## 本版本目标
- 提供从 Scenario → Fact → Resume V1 → ... → Export 的最小可交付闭环
- 支持导出 TXT（BASE）
- 保证路由/状态机/数据写入可追溯（RESUME_DB_V1 + RESUME_WRITE_LOG_V1）

## 已实现范围
- 入口：index.html 为唯一入口；resume.html 为跳转壳
- Router：router_runtime.js（含 /health 映射）
- Step Page：统一引用 _step_page.js（带 cache-bust）
- Fact：表单 + 回填 + 自动保存/保存留本页 + 写入进入下一步
- Resume V1：生成 BASE content + 预览 + 写入 active.resume_version_id
- Resume V2：最小可编辑文本框 + 写入 resume_v2_id（并满足状态机里程碑）
- Export：下载 TXT（BASE）并写入 export_ready 快照（可追溯）
- Debug：Health Check 页面可访问，可打印关键状态

## 数据与命名空间
- localStorage keys：
  - RESUME_DB_V1
  - RESUME_WRITE_LOG_V1

## 验收（QA）
- 脚本：apps/resume_product/_qa/smoke_check.sh
- 结果：PASS（8/8）

## 已知问题 / 下一步
- Scenario/Role/KASH/Assessment/Fit/V3/Plan 等页仍为“壳+按钮”，需按产品手册补齐可编辑表单与回填/写入逻辑
- 将入口 Hub 从“工程态摘要”逐步替换为“用户态 UI”（更少调试信息、更明确 CTA）

## 关联变更
- CHANGELOG.md：已追加本次变更记录（含关键修复与验证项）

## 验收清单（已通过）
- [x] 全流程：Entry → Scenario → Fact → V1 → Target → Role → Kash → V2 → Assessment → Fit → V3 → Plan → Export
- [x] Export：可生成并下载 TXT（BASE），并写入 export_ready / export_snapshot
- [x] Router：index.html 为唯一入口（SSOT），resume.html 为跳转壳
- [x] Health：debug=1 可进入绿色 Health 页，并可被 router 纠正到正确物理页
- [x] 命名空间隔离：localStorage 仅使用 RESUME_*（不读写 MYGIFT_*）
- [x] QA：smoke_check.sh PASS=8 FAIL=0
- [x] Cache：所有 step 页引用 _step_page.js 均带 cache-bust（?v=...）
## 2025-12-28 Patch
- Step 页页码口径已统一（使用 PROGRESS_ORDER，不含 entry），修复总数不一致问题