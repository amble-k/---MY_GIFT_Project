// apps/resume_product/contracts/fact_runtime.v0_3_0.js
// Fact v0.3.0 runtime helpers: init / adapt / validate (minimal)

import { FACT_SCHEMA_V0_3_0 } from "./fact_schema.v0_3_0.js";

function iso(d = new Date()) { return d.toISOString(); }
function isNonEmptyStr(x) { return typeof x === "string" && x.trim().length > 0; }
function asArray(x) { return Array.isArray(x) ? x : (x == null ? [] : [x]); }

// ---- 1) Create empty Fact v0.3 ----
export function makeEmptyFactV03({ locale = "zh-CN" } = {}) {
  return {
    schema_version: FACT_SCHEMA_V0_3_0.version,
    created_at: iso(),
    updated_at: iso(),
    locale,

    // privacy/meta
    privacy: { mode: "normal", output_overrides: {} },
    meta: { source: "manual", confidence: 1, gaps: [] },

    // ---- person (JP essentials included) ----
    person: {
      name: "",
      name_kana: "",
      birth: { date: "", age: null },

      location: {
        country: "",
        city: "",
        prefecture: "",
        city_ward: "",
        address_line: "",
      },

      contact: {
        email: "",
        phone: "",
        phone_mobile: "",
        wechat: "",
        line: "",
        github: "",
        website: "",
        linkedin: "",
      },

      photo: { url: "" },
      commute: { nearest_station: "", time_minutes: null },
      visa: { status: "", expiry: "" },

      // misc
      work_authorization: "unknown",
      tags: [],
    },

    // ---- root summary (schema uses root headline/summary) ----
    headline: "",
    summary: "",

    // ---- links[] ----
    links: [],

    // ---- preferences (本人希望記入欄) ----
    preferences: {
      job_type: "",
      work_location: "",
      start_date: "",
      salary_note: "",
    },

    // ---- skills (schema uses skills.items[]) ----
    skills: {
      taxonomy_version: "",
      items: [],
    },

    // ---- core arrays ----
    education: [],
    experience: [],
    projects: [],

    // ---- optional groups (schema naming) ----
    certifications: [],
    awards: [],
    publications: [],
    volunteering: [],
    interests: [],
  };
}


// ---- 2) Normalize (fill meta, updated_at) ----
export function normalizeFactV03(input = {}, { locale = "zh-CN" } = {}) {
  const base = makeEmptyFactV03({ locale });
  const out = { ...base, ...(input || {}) };

  // deep-ish merges for nested groups
  out.privacy = { ...(base.privacy || {}), ...(out.privacy || {}) };
  out.privacy.output_overrides = { ...(base.privacy.output_overrides || {}), ...(out.privacy.output_overrides || {}) };

  out.meta = { ...(base.meta || {}), ...(out.meta || {}) };

  out.person = { ...(base.person || {}), ...(out.person || {}) };
  out.person.birth = { ...(base.person.birth || {}), ...(out.person.birth || {}) };
  out.person.location = { ...(base.person.location || {}), ...(out.person.location || {}) };
  out.person.contact = { ...(base.person.contact || {}), ...(out.person.contact || {}) };
  out.person.photo = { ...(base.person.photo || {}), ...(out.person.photo || {}) };
  out.person.commute = { ...(base.person.commute || {}), ...(out.person.commute || {}) };
  out.person.visa = { ...(base.person.visa || {}), ...(out.person.visa || {}) };

  out.preferences = { ...(base.preferences || {}), ...(out.preferences || {}) };

  out.skills = { ...(base.skills || {}), ...(out.skills || {}) };
  out.skills.items = asArray(out.skills.items);

  // schema version + timestamps
  out.schema_version = FACT_SCHEMA_V0_3_0.version;
  out.updated_at = iso();
  if (!out.created_at) out.created_at = iso();

  // force arrays
  out.links = asArray(out.links);
  out.education = asArray(out.education);
  out.experience = asArray(out.experience);
  out.projects = asArray(out.projects);

  out.certifications = asArray(out.certifications);
  out.awards = asArray(out.awards);
  out.publications = asArray(out.publications);
  out.volunteering = asArray(out.volunteering);
  out.interests = asArray(out.interests);

  // sanitize tags
  out.person.tags = asArray(out.person.tags).filter(isNonEmptyStr);

  // sanitize links / skills items lightly
    out.links = out.links.filter((x) => x != null);
  out.skills.items = out.skills.items.filter((x) => x != null);

  return out;
}


// ---- 3) Adapt legacy Fact (current v0.2-ish structures) -> v0.3 ----
// Supports shapes like:
// - { basic, summary, skills, education, experience, projects } (your fact_profiles payload)
// - { person, education, experience, projects } (already new-ish)
export function adaptLegacyFactToV03(legacy = {}, { locale = "zh-CN" } = {}) {
  // already v0.3-ish
  if (legacy?.schema_version === FACT_SCHEMA_V0_3_0.version) return normalizeFactV03(legacy, { locale });

  const out = makeEmptyFactV03({ locale });

  // v0.2: basic
  const basic = legacy?.basic || {};
  out.person.name = String(basic?.name || legacy?.person?.name || "");
  out.person.location.city = String(basic?.city || legacy?.person?.location?.city || "");
  out.person.location.country = String(basic?.country || legacy?.person?.location?.country || "");

  // contacts (兼容旧字段)
  out.person.contact.email = String(basic?.email || legacy?.person?.contact?.email || "");
  out.person.contact.phone = String(basic?.phone || legacy?.person?.contact?.phone || "");
  out.person.contact.wechat = String(basic?.wechat || legacy?.person?.contact?.wechat || "");
  out.person.contact.github = String(basic?.github || legacy?.person?.contact?.github || "");
  out.person.contact.website = String(basic?.website || legacy?.person?.contact?.website || "");
  out.person.contact.linkedin = String(basic?.linkedin || legacy?.person?.contact?.linkedin || "");
  out.person.contact.line = String(basic?.line || legacy?.person?.contact?.line || "");
  out.person.contact.phone_mobile = String(basic?.phone_mobile || legacy?.person?.contact?.phone_mobile || "");

  // headline/summary (schema root)
  out.headline = String(basic?.title || legacy?.headline || legacy?.person?.headline || "");
  out.summary = String(legacy?.summary || legacy?.person?.summary || "");

  // arrays
  out.education = asArray(legacy?.education);
  out.experience = asArray(legacy?.experience);
  out.projects = asArray(legacy?.projects);

  // skills: best-effort -> skills.items[]
  const pushSkill = (name, category = "tool") => {
    const n = (name == null) ? "" : String(name).trim();
    if (!n) return;
    out.skills.items.push({ name: n, category });
  };

  const skills = legacy?.skills;
  if (Array.isArray(skills)) {
    skills.forEach((s) => pushSkill(s, "tool"));
  } else if (skills && typeof skills === "object") {
    // old buckets -> items
    const hard = Array.isArray(skills.hard) ? skills.hard : [];
    const soft = Array.isArray(skills.soft) ? skills.soft : [];
    const tools = Array.isArray(skills.tools) ? skills.tools : [];
    const langs = Array.isArray(skills.languages) ? skills.languages : [];

    hard.forEach((s) => pushSkill(s, "domain"));
    tools.forEach((s) => pushSkill(s, "tool"));
    langs.forEach((s) => pushSkill(s, "language"));
    soft.forEach((s) => pushSkill(s, "soft"));

    // if already items style
    if (Array.isArray(skills.items)) {
      skills.items.forEach((it) => {
        if (it && typeof it === "object" && it.name) {
          pushSkill(it.name, it.category || "tool");
        }
      });
    }
    if (typeof skills.taxonomy_version === "string") {
      out.skills.taxonomy_version = skills.taxonomy_version;
    }
  }

  // links (if legacy had)
  if (Array.isArray(legacy?.links)) out.links = legacy.links;

  // preferences (if legacy had)
  if (legacy?.preferences && typeof legacy.preferences === "object") {
    out.preferences = { ...out.preferences, ...legacy.preferences };
  }

  return normalizeFactV03(out, { locale });
}


// ---- 4) Minimal validation (only rules we already wrote in schema.rules) ----
export function validateFactV03(factInput) {
  const fact = normalizeFactV03(factInput || {});
  const errors = [];

  // locale gate: jp_only 只在日语环境启用
  const locale = (fact && fact.locale) ? String(fact.locale) : "zh-CN";
  const isJP = /^ja\b/i.test(locale) || /^ja-/i.test(locale) || /jp/i.test(locale);

  const rules = Array.isArray(FACT_SCHEMA_V0_3_0.rules) ? FACT_SCHEMA_V0_3_0.rules : [];

  const isNonEmpty = (v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.filter(isNonEmptyStr).length > 0;
    if (typeof v === "number") return !Number.isNaN(v);
    if (typeof v === "boolean") return true;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return false;
  };

  const stripArr = (path) => String(path || "").replace(/\[\]$/g, "");

  const getByPath = (obj, path) => {
    try {
      if (!path) return undefined;
      const parts = String(path).split(".").filter(Boolean);
      let cur = obj;
      for (const k of parts) {
        if (cur == null) return undefined;
        cur = cur[k];
      }
      return cur;
    } catch {
      return undefined;
    }
  };

  const pushErr = (id, message, extra = {}) => {
    errors.push({ id: id || "RULE", message: message || "Validation failed", ...extra });
  };

  // ---- apply rules ----
  if (rules.length) {
    for (const r of rules) {
      if (!r || typeof r !== "object") continue;
      if (r.jp_only && !isJP) continue;

      const rid = r.id || "RULE";
      const msg = r.message || "Validation failed";

      if (r.type === "atLeastOne") {
        const paths = Array.isArray(r.paths) ? r.paths : [];
        const ok = paths.some((pp) => isNonEmpty(getByPath(fact, stripArr(pp))));
        if (!ok) pushErr(rid, msg, { paths });
        continue;
      }

      if (r.type === "minItems") {
        const min = (typeof r.min === "number") ? r.min : (parseInt(String(r.min || "0"), 10) || 0);
        const arr = getByPath(fact, stripArr(r.path));
        const n = Array.isArray(arr) ? arr.length : 0;
        if (n < min) pushErr(rid, msg, { path: r.path, min, got: n });
        continue;
      }

      if (r.type === "forEachRequired") {
        const list = getByPath(fact, stripArr(r.path));
        const required = Array.isArray(r.required) ? r.required : [];
        if (Array.isArray(list)) {
          list.forEach((item, idx) => {
            const missing = required.filter((pp) => !isNonEmpty(getByPath(item, stripArr(pp))));
            if (missing.length) pushErr(rid, msg, { index: idx, missing });
          });
        }
        continue;
      }

      if (r.type === "forEachMinSum") {
        const list = getByPath(fact, stripArr(r.path));
        const sums = Array.isArray(r.sums) ? r.sums : [];
        if (Array.isArray(list)) {
          list.forEach((item, idx) => {
            sums.forEach((s) => {
              const min = (typeof s.min === "number") ? s.min : (parseInt(String(s.min || "0"), 10) || 0);

              const aList = asArray(getByPath(item, stripArr(s.a)));
              const bList = asArray(getByPath(item, stripArr(s.b)));

              const aN = aList.filter(isNonEmptyStr).length;
              const bN = bList.filter((x) => {
                if (typeof x === "string") return isNonEmptyStr(x);
                if (x && typeof x === "object") return isNonEmptyStr(x.text);
                return false;
              }).length;

              if ((aN + bN) < min) pushErr(rid, msg, { index: idx, sum: aN + bN, min, a: s.a, b: s.b });
            });
          });
        }
        continue;
      }

      // unknown rule type: ignore
    }
  } else {
    // fallback: keep minimal behaviour if schema has no rules
    const email = fact?.person?.contact?.email || "";
    const phone = fact?.person?.contact?.phone || "";
    if (!isNonEmptyStr(email) && !isNonEmptyStr(phone)) {
      pushErr("L1_CONTACT_ONE_REQUIRED", "邮箱/电话至少填写一个");
    }
  }

  return { ok: errors.length === 0, errors, fact };
}
