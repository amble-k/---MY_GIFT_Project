import fs from "node:fs";
import { adaptFactPayloadToInput_v0_2_2 } from "../contracts/legacy_adapter.fact_to_input.v0_2_2.js";
import { mapInputToResumeDoc_v0_2_2 } from "../contracts/mapping_rules.v0_2_2.js";
import { validateResumeDoc_v0_2_2 } from "../contracts/resume_model.v0_2_2.js";
import { THEME_PROFESSIONAL_CLEAN_V0_2_2 } from "../render/themes/theme_professional_clean.v0_2_2.js";
import { renderResumeHtml_v0_2_2 } from "../render/renderer_core.v0_2_2.js";
import { OUTPUT_SPEC_PRO_CLEAN_V0_2_2 } from "../contracts/output_spec.professional_clean.v0_2_2.js";

function readJsonIfExists(path) {
  try {
    if (fs.existsSync(path)) {
      const raw = fs.readFileSync(path, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("[FROM_FACT] JSON parse failed:", path, e);
  }
  return null;
}

// 约定：如果项目根目录存在 tmp_fact_payload.json，就用它作为“旧 FACT payload”输入
const fact = readJsonIfExists("tmp_fact_payload.json") || {
  basic: { name:"王小明", target:"产品经理", city:"上海", phone:"13800000000", email:"xm@example.com" },
  summary: "关注增长与提效，擅长数据分析与跨团队协作。",
  skills: ["PRD", "SQL", "A/B测试", "用户研究", "数据分析", "埋点"],
  education: [{ school:"复旦大学", major:"信息管理", degree:"本科" }],
  experience: [{ company:"某互联网公司", title:"产品经理", period:"2022.06-2025.12" }],
  projects: [{ name:"增长实验平台", desc:"搭建实验体系，提升转化效率。" }],
};

const input = adaptFactPayloadToInput_v0_2_2(fact);
const doc = mapInputToResumeDoc_v0_2_2(input, { locale: "zh-CN", theme: "professional_clean" });
const v = validateResumeDoc_v0_2_2(doc);

console.log("[FROM_FACT] validate.ok =", v.ok);
if (v.errors?.length) console.log("[FROM_FACT] errors =", v.errors);
if (v.warnings?.length) console.log("[FROM_FACT] warnings =", v.warnings);

const htmlBody = renderResumeHtml_v0_2_2(doc, THEME_PROFESSIONAL_CLEAN_V0_2_2, OUTPUT_SPEC_PRO_CLEAN_V0_2_2);

const full = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Resume Preview FROM FACT v0.2.2</title>
</head>
<body style="margin:0;padding:24px;background:#f6f6f6;">
  ${htmlBody}
</body>
</html>`;

fs.writeFileSync("tmp_resume_preview_from_fact.v0_2_2.html", full, "utf-8");
console.log("[FROM_FACT] wrote => tmp_resume_preview_from_fact.v0_2_2.html");
