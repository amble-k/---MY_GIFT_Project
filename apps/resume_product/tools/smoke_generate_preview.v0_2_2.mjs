import { mapInputToResumeDoc_v0_2_2 } from "../contracts/mapping_rules.v0_2_2.js";
import { validateResumeDoc_v0_2_2 } from "../contracts/resume_model.v0_2_2.js";
import { THEME_PROFESSIONAL_CLEAN_V0_2_2 } from "../render/themes/theme_professional_clean.v0_2_2.js";
import { renderResumeHtml_v0_2_2 } from "../render/renderer_core.v0_2_2.js";
import fs from "node:fs";

const input = {
  basic: { name:"王小明", targetRole:"产品经理", city:"上海", phone:"13800000000", email:"xm@example.com" },
  role_level: "mid",
  resume_language: "zh-CN",
  target_role_family: "pm",
  summary_keywords: "增长、数据驱动",
  impact_tags: ["增长", "转化"],
  skill_tags: ["PRD", "SQL", "A/B测试", "用户研究", "数据分析", "埋点", "Axure"],
  experience_items: [{
    company: "某互联网公司",
    title: "产品经理",
    period: "2022.06-2025.12",
    responsibility_tags: ["需求分析", "项目管理", "数据分析"],
    impact_tags: ["增长", "转化"],
    metrics_hint: "DAU +20%",
  }],
  project_items: [{
    name: "增长实验平台",
    type_tag: "增长",
    stack_tags: ["MySQL", "Redis"],
    impact_tags: ["转化"],
    metrics_hint: "转化率 +3.2pp",
  }],
  education_items: [{
    school: "复旦大学",
    major: "信息管理",
    degree: "本科",
  }],
};

const doc = mapInputToResumeDoc_v0_2_2(input, { locale: "zh-CN", theme: "professional_clean" });
const v = validateResumeDoc_v0_2_2(doc);

console.log("[SMOKE] validate.ok =", v.ok);
if (v.errors?.length) console.log("[SMOKE] errors =", v.errors);
if (v.warnings?.length) console.log("[SMOKE] warnings =", v.warnings);

const htmlBody = renderResumeHtml_v0_2_2(doc, THEME_PROFESSIONAL_CLEAN_V0_2_2);

const full = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Resume Preview v0.2.2</title>
</head>
<body style="margin:0;padding:24px;background:#f6f6f6;">
  ${htmlBody}
</body>
</html>`;

fs.writeFileSync("tmp_resume_preview.v0_2_2.html", full, "utf-8");
console.log("[SMOKE] wrote => tmp_resume_preview.v0_2_2.html");
