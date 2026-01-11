/**
 * Resume Product - Canonical Resume Model Contract
 * v0.2.2
 *
 * 目标：定义系统内部唯一真相 ResumeDoc，并提供可验证的质量闸门（Gate）。
 * 任何页面/渲染/导出只允许读取 ResumeDoc，不允许绕过本合同临时拼字段。
 */

export const RESUME_MODEL_V0_2_2 = Object.freeze({
  meta: {
    product: "Resume Product",
    contract: "resume_model",
    version: "0.2.2",
    locale_default: "zh-CN",
    theme_default: "professional_clean",
  },

  /**
   * ResumeDoc 结构（唯一真相）
   * - 输入层 InputPayload 必须先映射成 ResumeDoc
   * - 输出层渲染/导出只读 ResumeDoc
   */
  schema: {
    meta: {
      doc_version: "0.2.2",
      locale: "zh-CN",
      theme: "professional_clean",
      updated_at: "ISO8601(optional)",
    },

    header: {
      name: "string(required)",
      titleLine: "string(optional)",      // 目标岗位/一句定位
      contactLine: "string(optional)",    // phone/email/城市等拼接后的一行（输出用）
      links: "array(optional)",           // [{label,url}]
    },

    summary: {
      bullets: "array(required)",         // 2-4 条要点（输出不建议大段）
    },

    skills: {
      groups: "array(required)",          // [{label, items:[...]}]
    },

    experience: "array(optional)",        // [{company, role, period, bullets:[...], highlights:[...]}]
    projects: "array(optional)",          // [{name, tagline, bullets:[...], stack:[...], link}]
    education: "array(optional)",         // [{school, major, degree, extra}]
    trace: {
      source_ids: "array(optional)",
      rule_ids: "array(optional)",
    },
  },

  /**
   * 质量闸门（Gate）标准：后续测试、导出、上线的统一验收依据
   */
  gates: {
    header: {
      require_name: true,
      require_any_contact: true, // phone/email 至少一个（由 mapping 写入 contactLine 或 links）
    },
    summary: {
      min_bullets: 2,
      max_bullets: 4,
      min_chars: 8,   // 每条过短像“词条”
      max_chars: 40,  // 每条过长像“散文”
    },
    skills: {
      min_groups: 1,
      min_items_total: 6,   // 少于 6 通常显得空
      max_items_total: 24,  // 太多显得不聚焦（可后续按岗位调整）
    },
    experience: {
      max_items: 6,
      max_bullets_per_item: 4,
    },
    projects: {
      max_items: 4,
      max_bullets_per_item: 3,
    },
    education: {
      max_items: 2,
    },
  },
});

/**
 * 工具：把任意值转为非空字符串（trim 后）
 */
function s(v) {
  return (v == null ? "" : String(v)).trim();
}

function isArr(a) {
  return Array.isArray(a);
}

function countChars(str) {
  // 简化：按 JS length 计，中文/英文都可用作 gate 的粗校验
  return s(str).length;
}

/**
 * validateResumeDoc_v0_2_2
 * - 不抛异常
 * - 返回 { ok, errors, warnings }
 * - errors：必须修复才能导出/投递
 * - warnings：建议优化但不阻断（当前先留空，后续启用）
 */
export function validateResumeDoc_v0_2_2(doc) {
  const errors = [];
  const warnings = [];

  const g = RESUME_MODEL_V0_2_2.gates;

  // -------- header gate --------
  const name = s(doc?.header?.name);
  if (g.header.require_name && !name) {
    errors.push("header.name is empty");
  }

  const contactLine = s(doc?.header?.contactLine);
  const links = doc?.header?.links;
  const hasLink = isArr(links) && links.some(x => s(x?.url));
  if (g.header.require_any_contact && !contactLine && !hasLink) {
    errors.push("header.contactLine is empty and header.links has no url");
  }

  // -------- summary gate --------
  const bullets = doc?.summary?.bullets;
  if (!isArr(bullets)) {
    errors.push("summary.bullets must be an array");
  } else {
    const n = bullets.length;
    if (n < g.summary.min_bullets) errors.push(`summary.bullets too few (<${g.summary.min_bullets})`);
    if (n > g.summary.max_bullets) errors.push(`summary.bullets too many (>${g.summary.max_bullets})`);

    bullets.forEach((b, i) => {
      const t = s(b?.text ?? b); // 允许 ["..."] 或 [{text,...}]
      const c = countChars(t);
      if (!t) errors.push(`summary.bullets[${i}] is empty`);
      if (t && c < g.summary.min_chars) errors.push(`summary.bullets[${i}] too short (<${g.summary.min_chars} chars)`);
      if (t && c > g.summary.max_chars) warnings.push(`summary.bullets[${i}] too long (>${g.summary.max_chars} chars)`);
    });
  }

  // -------- skills gate --------
  const groups = doc?.skills?.groups;
  if (!isArr(groups) || groups.length < g.skills.min_groups) {
    errors.push("skills.groups missing or empty");
  } else {
    let total = 0;
    groups.forEach((grp, gi) => {
      const items = grp?.items;
      if (!isArr(items) || items.length === 0) {
        warnings.push(`skills.groups[${gi}].items empty`);
      } else {
        total += items.map(s).filter(Boolean).length;
      }
    });
    if (total < g.skills.min_items_total) warnings.push(`skills items too few (<${g.skills.min_items_total})`);
    if (total > g.skills.max_items_total) warnings.push(`skills items too many (>${g.skills.max_items_total})`);
  }

  // -------- experience gate --------
  const exp = doc?.experience;
  if (isArr(exp)) {
    if (exp.length > g.experience.max_items) warnings.push(`experience too many (>${g.experience.max_items})`);
    exp.forEach((it, idx) => {
      const bullets2 = it?.bullets;
      if (isArr(bullets2) && bullets2.length > g.experience.max_bullets_per_item) {
        warnings.push(`experience[${idx}].bullets too many (>${g.experience.max_bullets_per_item})`);
      }
    });
  }

  // -------- projects gate --------
  const pj = doc?.projects;
  if (isArr(pj)) {
    if (pj.length > g.projects.max_items) warnings.push(`projects too many (>${g.projects.max_items})`);
    pj.forEach((it, idx) => {
      const bullets2 = it?.bullets;
      if (isArr(bullets2) && bullets2.length > g.projects.max_bullets_per_item) {
        warnings.push(`projects[${idx}].bullets too many (>${g.projects.max_bullets_per_item})`);
      }
    });
  }

  // -------- education gate --------
  const edu = doc?.education;
  if (isArr(edu) && edu.length > g.education.max_items) {
    warnings.push(`education too many (>${g.education.max_items})`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * createEmptyResumeDoc_v0_2_2
 * - 方便页面初始化/测试基线
 */
export function createEmptyResumeDoc_v0_2_2({ locale, theme } = {}) {
  return {
    meta: {
      doc_version: "0.2.2",
      locale: locale || RESUME_MODEL_V0_2_2.meta.locale_default,
      theme: theme || RESUME_MODEL_V0_2_2.meta.theme_default,
      updated_at: new Date().toISOString(),
    },
    header: { name: "", titleLine: "", contactLine: "", links: [] },
    summary: { bullets: [] },
    skills: { groups: [] },
    experience: [],
    projects: [],
    education: [],
    trace: { source_ids: [], rule_ids: [] },
  };
}
