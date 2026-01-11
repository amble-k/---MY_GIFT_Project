// core/resume_composer/compose_base.js

/**
 * v0.2 BASE composer
 * input: fact_profile (object), template, options
 * output: { content: string, meta: { template_id, section_map, word_count } }
 */
export function composeBase({ fact_profile = {}, template, options = {} }) {
  if (!template || !Array.isArray(template.sections)) {
    throw new Error("[composeBase] invalid template");
  }

  const section_map = {};
  const parts = [];

  const pushSection = (key, title, bodyLines) => {
    const start = parts.join("").length;
    const header = `## ${title}\n`;
    const body = (bodyLines && bodyLines.length ? bodyLines : ["（待补充）"])
      .map((s) => `- ${s}`)
      .join("\n");
    const block = `${header}${body}\n\n`;
    parts.push(block);
    const end = parts.join("").length;
    section_map[key] = { title, start, end };
  };

  // ---- helpers ----
  const get = (obj, path, fallback = "") => {
    try {
      return path
        .split(".")
        .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const normLines = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof v === "string") {
      // 支持：换行 / 逗号 / 顿号
      return v
        .split(/\n|,|，|、/g)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (typeof v === "object") {
      // {items:[...]} 或 {list:[...]} 或 {text:"..."}
      const a = v.items || v.list;
      if (Array.isArray(a)) return a.map(String).map((s) => s.trim()).filter(Boolean);
      if (typeof v.text === "string") return normLines(v.text);
      return [];
    }
    return [];
  };

  // ---- build sections ----
  for (const sec of template.sections) {
    const key = sec.section_key;

    if (key === "header") {
      const name = get(fact_profile, "basic.name", "") || get(fact_profile, "name", "");
      const title = get(fact_profile, "basic.title", "") || get(fact_profile, "title", "");
      const phone = get(fact_profile, "basic.phone", "") || get(fact_profile, "phone", "");
      const email = get(fact_profile, "basic.email", "") || get(fact_profile, "email", "");
      const city = get(fact_profile, "basic.city", "") || get(fact_profile, "city", "");

      const lines = [];
      if (name) lines.push(`姓名：${name}`);
      if (title) lines.push(`目标岗位：${title}`);
      if (city) lines.push(`城市：${city}`);
      if (phone) lines.push(`电话：${phone}`);
      if (email) lines.push(`邮箱：${email}`);

      pushSection(key, sec.title, lines.length ? lines : []);
      continue;
    }

    if (key === "headline") {
      const lines =
        normLines(get(fact_profile, "headline", null)) ||
        normLines(get(fact_profile, "highlights", null)) ||
        normLines(get(fact_profile, "basic.headline", null));

      pushSection(key, sec.title, lines.slice(0, sec.max_items ?? 4));
      continue;
    }

    if (key === "summary") {
      const summary =
        get(fact_profile, "summary", "") ||
        get(fact_profile, "basic.summary", "") ||
        get(fact_profile, "profile.summary", "");

      const lines = [];
      if (summary) lines.push(String(summary).trim());
      pushSection(key, sec.title, lines);
      continue;
    }

    if (key === "experience") {
      const items =
        get(fact_profile, "experience", null) ||
        get(fact_profile, "experiences", null) ||
        get(fact_profile, "work", null);

      const lines = [];
      if (Array.isArray(items)) {
        for (const it of items.slice(0, sec.max_items ?? 4)) {
          const company = it.company || it.org || "";
          const role = it.role || it.title || "";
          const range = it.range || it.period || "";
          const one = [company, role, range].filter(Boolean).join(" / ");
          if (one) lines.push(one);
        }
      } else {
        // 兼容：用户可能存成一段文本
        lines.push(...normLines(items));
      }

      pushSection(key, sec.title, lines);
      continue;
    }

    if (key === "projects") {
      const items = get(fact_profile, "projects", null) || get(fact_profile, "project", null);

      const lines = [];
      if (Array.isArray(items)) {
        for (const it of items.slice(0, sec.max_items ?? 4)) {
          const name = it.name || it.title || "";
          const desc = it.desc || it.summary || "";
          const one = [name, desc].filter(Boolean).join("：");
          if (one) lines.push(one);
        }
      } else {
        lines.push(...normLines(items));
      }

      pushSection(key, sec.title, lines);
      continue;
    }

    if (key === "education") {
      const items =
        get(fact_profile, "education", null) ||
        get(fact_profile, "educations", null) ||
        get(fact_profile, "edu", null);

      const lines = [];
      if (Array.isArray(items)) {
        for (const it of items.slice(0, sec.max_items ?? 3)) {
          const school = it.school || it.university || "";
          const major = it.major || "";
          const degree = it.degree || "";
          const one = [school, major, degree].filter(Boolean).join(" / ");
          if (one) lines.push(one);
        }
      } else {
        lines.push(...normLines(items));
      }

      pushSection(key, sec.title, lines);
      continue;
    }

    if (key === "skills") {
      const items = get(fact_profile, "skills", null) || get(fact_profile, "skill", null);
      const lines = normLines(items).slice(0, sec.max_items ?? 16);
      pushSection(key, sec.title, lines);
      continue;
    }

    if (key === "certs") {
      const items =
        get(fact_profile, "certs", null) ||
        get(fact_profile, "certifications", null) ||
        get(fact_profile, "languages", null);
      const lines = normLines(items).slice(0, sec.max_items ?? 8);
      pushSection(key, sec.title, lines);
      continue;
    }

    if (key === "awards") {
      const items =
        get(fact_profile, "awards", null) ||
        get(fact_profile, "papers", null) ||
        get(fact_profile, "portfolio", null);
      const lines = normLines(items).slice(0, sec.max_items ?? 6);
      pushSection(key, sec.title, lines);
      continue;
    }

    if (key === "volunteer") {
      const items =
        get(fact_profile, "volunteer", null) ||
        get(fact_profile, "community", null) ||
        get(fact_profile, "clubs", null);
      const lines = normLines(items).slice(0, sec.max_items ?? 4);
      pushSection(key, sec.title, lines);
      continue;
    }

    // unknown section: still render placeholder for stability
    pushSection(key, sec.title || key, []);
  }

  const content = parts.join("");
  const word_count = content
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  return {
    content,
    meta: {
      template_id: template.template_id,
      locale: template.locale,
      version: template.version,
      section_map,
      word_count,
      options,
    },
  };
}

export default composeBase;
