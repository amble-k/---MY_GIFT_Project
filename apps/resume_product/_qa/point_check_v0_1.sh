#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
OUT="apps/resume_product/_qa/POINTCHECK_REPORT_v0_1.md"
ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ok(){ echo "✅ $*"; PASS=$((PASS+1)); }
bad(){ echo "❌ $*"; FAIL=$((FAIL+1)); }
sec(){ echo -e "\n## $*\n" >> "$OUT"; }
kv(){ echo "- $1: $2" >> "$OUT"; }

FAIL=0
PASS=0

echo "# Resume Product v0.1 点检报告" > "$OUT"
echo "" >> "$OUT"
kv "GeneratedAt(UTC)" "$ts"
kv "ROOT" "$ROOT"
echo "" >> "$OUT"

sec "1) 入口与路由（SSOT）"
if [ -f "apps/resume_product/index.html" ]; then ok "Index 入口存在"; kv "index.html" "OK"; else bad "缺少 apps/resume_product/index.html"; kv "index.html" "MISSING"; fi
if [ -f "apps/resume_product/resume.html" ]; then ok "resume.html 存在（跳转壳）"; kv "resume.html" "OK"; else ok "resume.html 不存在（可接受）"; kv "resume.html" "ABSENT_OK"; fi

# cache-bust：接受单/双引号，接受空格
if grep -R --line-number -E 'from[[:space:]]+["'\'']/apps/resume_product/pages/_step_page\.js\?v=' apps/resume_product/pages --exclude="*.bak" >/dev/null 2>&1; then
  ok "step 页引用 _step_page.js 带 cache-bust"
  kv "_step_page import" "OK"
else
  bad "step 页未发现 _step_page.js?v=… 引用（可能写法不一致或漏改）"
  kv "_step_page import" "FAIL"
fi

sec "2) localStorage 命名空间隔离（只查 localStorage 读写）"
# 只判定 localStorage 的 get/set/remove 是否触碰 MYGIFT_
if grep -R --line-number -E 'localStorage\.(getItem|setItem|removeItem)\([[:space:]]*["'\'']MYGIFT_' core apps/resume_product --exclude="*.bak" >/dev/null 2>&1; then
  bad "发现 localStorage 读写 MYGIFT_*（应保持 RESUME_* 隔离）"
  kv "MYGIFT_* localStorage" "FOUND"
else
  ok "未发现 localStorage 读写 MYGIFT_*"
  kv "MYGIFT_* localStorage" "NOT_FOUND"
fi

if grep -R --line-number 'RESUME_DB_V1' core apps/resume_product --exclude="*.bak" >/dev/null 2>&1; then
  ok "RESUME_DB_V1 存在"; kv "RESUME_DB_V1" "OK"
else
  bad "找不到 RESUME_DB_V1"; kv "RESUME_DB_V1" "MISSING"
fi
if grep -R --line-number 'RESUME_WRITE_LOG_V1' core apps/resume_product --exclude="*.bak" >/dev/null 2>&1; then
  ok "RESUME_WRITE_LOG_V1 存在"; kv "RESUME_WRITE_LOG_V1" "OK"
else
  bad "找不到 RESUME_WRITE_LOG_V1"; kv "RESUME_WRITE_LOG_V1" "MISSING"
fi

sec "3) actions：writer 导出重复检查"
dups="$(grep -nE 'export function write[A-Za-z0-9_]+Dummy' core/actions/v0_1_actions.js \
  | sed -E 's/.*export function (write[A-Za-z0-9_]+Dummy).*/\1/' \
  | sort | uniq -c | awk '$1>1{print}')"

if [ -z "${dups}" ]; then
  ok "actions: writer 导出无重复"
  kv "writer duplicates" "NONE"
else
  bad "actions: 存在重复导出（会白屏：Cannot declare ... twice）"
  kv "writer duplicates" "$(echo "${dups}" | tr '\n' '; ')"
fi

sec "4) 状态机：STEP_ORDER vs milestones 口径一致性（计数脚本修复）"

step_len="$(
  awk '
    BEGIN{c=0; in_list=0}
    /export[[:space:]]+const[[:space:]]+STEP_ORDER[[:space:]]*=[[:space:]]*\[/{in_list=1; next}
    in_list && /StepId\./{c++}
    in_list && /\];/{in_list=0}
    END{print c}
  ' core/session/step_ids.js 2>/dev/null | tail -n 1 | awk '{print $1}'
)"

ms_len="$(
node - <<'NODE'
const fs = require("fs");
const s = fs.readFileSync("core/session/deriveStatus.js", "utf8");

// 精准抓：const milestones = { ... };
const m = s.match(/const\s+milestones\s*=\s*\{([\s\S]*?)^\s*\};/m);
if (!m) { console.log(0); process.exit(0); }

const block = m[1];
const keys = [...block.matchAll(/^\s*([A-Z0-9_]+)\s*:/gm)].map(x => x[1]);
console.log(keys.length);
NODE
)"

step_len="${step_len:-0}"
ms_len="${ms_len:-0}"

kv "STEP_ORDER.length" "$step_len"
kv "milestones.keyCount" "$ms_len"

if [ "$step_len" -gt 0 ] && [ "$ms_len" -ge "$step_len" ]; then
  ok "milestones 数量 >= STEP_ORDER（可接受）"
else
  bad "milestones 数量异常（可能导致首页进度与分页不一致）"
fi

sec "5) Step 页：是否具备可编辑表单（非壳页）"
# 排除 entry/export/v1/health（entry 是 Hub，不计入 step 表单要求）
missing_forms="$(
  find apps/resume_product/pages -name "*.html" \
    ! -path "*/entry/*" \
    ! -path "*/resume/v1/*" \
    ! -path "*/export/*" \
    ! -path "*/_health/*" \
    ! -name "*.bak*" -print0 \
  | xargs -0 -I{} sh -c 'grep -qE "<textarea|<input|__STEP_PAYLOAD__|__FACT_PAYLOAD__|__TARGET_PAYLOAD__|/core/ui/step_form_v0_2\.js|mountStepForm" "$1" || echo "$1"' _ {}
)"
if [ -z "${missing_forms}" ]; then
  ok "除 entry/v1/export/health 外，step 页均检测到表单或 payload 机制"
  kv "missing forms" "NONE"
else
  bad "存在疑似壳页（缺少表单/payload）"
  kv "missing forms" "$(echo "${missing_forms}" | tr '\n' '; ')"
fi

sec "6) Debug 信息门控（用户态不露 JSON）"
if grep -n 'if (isDebug)' apps/resume_product/pages/entry/index.html >/dev/null 2>&1; then
  ok "Entry 存在 debug 门控"; kv "entry debug gate" "OK"
else
  bad "Entry 缺少 debug 门控"; kv "entry debug gate" "MISSING"
fi
if grep -n 'qs("debug")' apps/resume_product/pages/_step_page.js >/dev/null 2>&1; then
  ok "_step_page.js 支持 debug 门控"; kv "_step_page debug gate" "OK"
else
  bad "_step_page.js 缺少 debug 门控"; kv "_step_page debug gate" "MISSING"
fi

sec "7) 语法快速检查（Node 可用则执行）"
if command -v node >/dev/null 2>&1; then
  if node --check apps/resume_product/pages/_step_page.js >/dev/null 2>&1; then
    ok "node --check _step_page.js OK"; kv "node check _step_page.js" "OK"
  else
    bad "node --check _step_page.js FAIL"; kv "node check _step_page.js" "FAIL"
  fi
else
  ok "未检测到 node（跳过语法检查）"; kv "node" "ABSENT_SKIP"
fi

echo "" >> "$OUT"
echo "## RESULT" >> "$OUT"
echo "- PASS=$PASS" >> "$OUT"
echo "- FAIL=$FAIL" >> "$OUT"

echo "== Resume Product v0.1 POINT CHECK =="
echo "OUT=$OUT"
echo "PASS=$PASS  FAIL=$FAIL"
[ "$FAIL" -eq 0 ] && echo "ALL_PASS" || echo "HAS_FAIL"
