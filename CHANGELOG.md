# MY GIFT / 升级版MY_GIFT_Project CHANGELOG

## 2025-12-30 Resume Product v0.1 — Point Check 收口
- QA: apps/resume_product/_qa/point_check_v0_1.sh => ALL_PASS（PASS=12 FAIL=0）
- Report: apps/resume_product/_qa/POINTCHECK_REPORT_v0_1.md
- Scope: step_form_v0_2 已覆盖所有 step 页（排除 entry/_health/resume_v1/export 作为特殊页）


> 约定：
> - Resume Product 相关变更统一记录在对应日期的 “Resume Product” 小节。
> - 每条尽量包含：改动点 → 文件/脚本 → 验证结果。
> - Debug/排错入口允许存在，但用户态默认不露 JSON（debug=1 才显示）。

---

## 2025-12-30 — Resume Product：UI v0.2 统一表单 + 点检收敛（ALL_PASS）

### UI（v0.2 layer）
- 新增：统一 Step 表单模块 `core/ui/step_form_v0_2.js`
  - 统一渲染：label + input/textarea 网格布局
  - 统一 payload 同步：`window.__STEP_PAYLOAD__`
  - 自动保存：防抖 + 动态 import actions cache-bust  
    - `/core/actions/v0_1_actions.js?v=Date.now()`
  - autosave 提示文案：保存中 / 已保存 / 失败 等
- 改造：以下 step 页切换为使用 `step_form_v0_2`（统一 UI/交互/自动保存口径）
  - `apps/resume_product/pages/scenario/index.html`
  - `apps/resume_product/pages/fact/index.html`
  - `apps/resume_product/pages/target/index.html`
  - `apps/resume_product/pages/role/index.html`
  - `apps/resume_product/pages/kash/index.html`
  - `apps/resume_product/pages/resume/v2/index.html`
  - `apps/resume_product/pages/assessment/index.html`
  - `apps/resume_product/pages/fit/index.html`
  - `apps/resume_product/pages/plan/index.html`
- 保留不改（按 v0.1/v0.2 设计仍为特殊页）
  - Entry Hub：`apps/resume_product/pages/entry/index.html`
  - Health：`apps/resume_product/pages/_health/index.html`
  - Resume V1：`apps/resume_product/pages/resume/v1/index.html`
  - Export：`apps/resume_product/pages/export/index.html`

### QA / 点检
- 点检脚本：`apps/resume_product/_qa/point_check_v0_1.sh`
  - 修复：第 5 节 `missing_forms` 子命令替换未闭合导致 `unexpected EOF while looking for matching ')'`
  - 壳页检测规则升级：识别 `step_form_v0_2.js / mountStepForm`，避免误报
  - 修复：milestones 计数输出异常导致的整数比较报错
  - 产物：`apps/resume_product/_qa/POINTCHECK_REPORT_v0_1.md`
  - 结果：`point_check_v0_1.sh` → **ALL_PASS（PASS=12 FAIL=0）**

---

## 2025-12-28 — Resume Product：状态机与分页口径统一（回归稳定）

- 修复：Step 页分页口径统一为  
  `PROGRESS_ORDER = STEP_ORDER.filter(x !== StepId.entry)`（entry 不计入分页）
- 避免：`12/13`、`14/12`、首页与分页总数不一致等问题
- 校验：全流程可从 Entry → Export 跑通；关键 writer 导出无重复；自动保存可用

---

## 2025-12-27 — Resume Product v0.1 收口（Release）

- Release Note：`apps/resume_product/RELEASE_v0_1.md`
- QA：`apps/resume_product/_qa/smoke_check.sh` → PASS（8/8）
- 状态：`deriveStatus => state=export, required_step=export, export_ready=true`
- 入口（SSOT）：
  - 正常入口：`/apps/resume_product/index.html#/resume`
  - Debug：`/apps/resume_product/index.html?debug=1#/resume`
  - Health：`/apps/resume_product/pages/_health/index.html?debug=1#/health`

---

## 2025-12-24 — Resume Product v0.1 收尾基线（入口 SSOT + Debug）

- 规则：Resume Product 只允许 localStorage 读写 `RESUME_*`；禁止读写 `MYGIFT_*`
- 入口：`index.html + router_runtime.js` 为唯一入口（SSOT）；`resume.html` 降级为跳转壳
- Debug：`/apps/resume_product/index.html?debug=1#/resume` 可进入 Health Check（`_health/index.html#/health`）
- Hub：
  - 增加：debug=1 显示 Health Check 链接
  - 修复：“清空重来”统一跳转到 `index.html#/resume`（入口 SSOT）
- Health：验证 router 可纠正错误物理页到正确 Health 页

---

## 2025-12-23 — Resume Product：双入口/白屏修复（Safari）

- 修复：解决 Safari 报错 `Return statements are only valid inside functions`
- 原因：双入口/重复 boot 导致白屏
- 影响文件：`apps/resume_product/resume.html`（及备份文件如 `resume_legacy.html`）
- 验证：入口 → 全流程 → Export/报告页均可正常进入与操作

---

## 2025-12-12 — Resume Product v0.1（Iteration 0）：路由拆分落地

- 新增 core 模块：
  - `core/guardrails/errors.js`
  - `core/session/step_ids.js`
  - `core/session/deriveStatus.js`
  - `core/storage/resume_db.js`
- 新增启动壳：
  - `apps/resume_product/app_boot.js`
  - `apps/resume_product/index.html`（hash router + PAGE_FILE 映射）
- 拆分并跑通 pages 页面（1–7 + v2）：
  - `pages/entry, scenario, fact, resume/v1, target, role, kash, resume/v2`
- 修复：python `http.server 5173` 运行时的 404（路径/映射缺失导致），加入未实现 route 的回退策略
- 新增：`README_DEV.md`（routes → files 对照表，便于移交/复现）

---

## [3.2.2] — 2025-12-04（MY GIFT 主系统）

- 建立项目备份目录（`*_backup_20251204`）
- 从浏览器 localStorage 导出完整报告 JSON：`output/baseline_report_01.json`
- 确认核心计算引擎 `/core/logic_core.js` 已实现：
  - M/T/V/R 维度计算（含 reverse 处理）
  - T→M→V 映射（`inferMFromT`, `computeVFromTM` 使用 `W_TM` 与 `W_MV`）
  - Pattern 判定（`determinePattern` + `PATTERN_RULES`，含 `rule_id` 与 `reason`）
  - KASH 起点判定（`determineKASH` + `KASH_RULES`）
  - 统一输出 `KASH_PROFILE` 结构（T/M/V/R/Delta/Patterns + synthesis）

- PointCheck（2025-12-30）结果：PASS=12 FAIL=0（ALL_PASS）
  - SSOT：index.html / resume.html / _step_page import OK
  - localStorage：MYGIFT_* NOT_FOUND；RESUME_DB_V1 / RESUME_WRITE_LOG_V1 OK
  - writers：导出无重复
  - 状态机口径：STEP_ORDER.length=13；milestones.keyCount=14
  - 壳页检测：missing forms NONE
  - Debug 门控：entry / _step_page OK
  - 语法：node --check _step_page.js OK
