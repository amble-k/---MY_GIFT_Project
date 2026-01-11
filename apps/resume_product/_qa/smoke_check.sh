#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

PASS=0
FAIL=0

ok()   { echo "✅ $*"; PASS=$((PASS+1)); }
bad()  { echo "❌ $*"; FAIL=$((FAIL+1)); }
need() { grep -R --line-number -E "$1" "$2" >/dev/null 2>&1; }

echo "== Resume Product v0.1 SMOKE CHECK =="
echo "ROOT=$ROOT"
echo

# -------------------------
# SSOT / 入口一致性
# -------------------------
if need '/apps/resume_product/index.html' apps/resume_product  ; then ok "Index 入口存在（index.html）"; else bad "缺少 index.html 或未被引用"; fi

# resume.html 应该是跳转壳（你们已降级过），不应再承担 boot/dispatch 主逻辑
if [ -f apps/resume_product/resume.html ]; then
  if need 'location\.replace\("/apps/resume_product/index\.html' apps/resume_product/resume.html; then
    ok "resume.html 为跳转壳（location.replace -> index.html）"
  else
    bad "resume.html 不是跳转壳（可能又混入了入口逻辑）"
  fi
else
  ok "未发现 resume.html（可接受）"
fi

# localStorage 命名空间：RESUME_*
# 只禁止“localStorage 读写 MYGIFT_*”，允许 core 内部出现 MYGIFT 作为主产品变量/字符串
if need 'localStorage\.(getItem|setItem|removeItem)\("MYGIFT_' core apps/resume_product; then
  bad "发现 localStorage 读写 MYGIFT_*（应保持 RESUME_* 隔离）"
else
  ok "未发现 localStorage 读写 MYGIFT_*"
fi

if need 'RESUME_DB_V1' core; then ok "RESUME_DB_V1 存在"; else bad "找不到 RESUME_DB_V1"; fi
if need 'RESUME_WRITE_LOG_V1' core; then ok "RESUME_WRITE_LOG_V1 存在"; else bad "找不到 RESUME_WRITE_LOG_V1"; fi

# -------------------------
# Router 映射必须包含 /health（debug用）
# -------------------------
if need '"/health"' apps/resume_product/router_runtime.js; then ok "router_runtime.js 含 /health 映射"; else bad "router_runtime.js 缺少 /health"; fi

# -------------------------
# Step 页必须统一使用 _step_page.js（结构收敛）
# -------------------------
if need 'import \{ bootStepPage \} from "/apps/resume_product/pages/_step_page\.js";' apps/resume_product/pages; then
  ok "step 页已统一引用 _step_page.js（至少存在一次）"
else
  bad "step 页未引用 _step_page.js（可能分叉）"
fi

# -------------------------
# Actions 动态 import 必须带 cache-bust（避免旧模块）
# -------------------------
if need 'import\(`/core/actions/v0_1_actions\.js\?v=\$\{Date\.now\(\)\}`\)' apps/resume_product/pages/_step_page.js; then
  ok "_step_page.js 动态 import actions 带 ?v=Date.now()"
else
  bad "_step_page.js 动态 import actions 未带 cache-bust（容易加载旧代码）"
fi

# === guard: 禁止重复导出同名 writer（会导致白屏/语法错） ===
dups=$(
  grep -n '^export function write' core/actions/v0_1_actions.js \
  | awk '{gsub(/\(.*/,"",$3); print $3}' \
  | sort | uniq -d
)

if [ -n "$dups" ]; then
  bad "actions: 发现重复导出 writer（会导致 SyntaxError）"
  echo "$dups" | sed 's/^/  - /'
else
  ok "actions: writer 导出无重复"
fi

echo
echo "== RESULT =="
echo "PASS=$PASS  FAIL=$FAIL"
echo

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi