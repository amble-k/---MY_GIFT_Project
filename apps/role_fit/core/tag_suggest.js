/**
 * Tag suggestion engine (v1)
 * - normalize: lower + punctuation to space + collapse spaces
 * - supports aliases/keywords/synonyms
 * - supports phrase matching (multi-part) with small gaps
 * - avoids short-word false positives
 *
 * Usage:
 *   import { suggestTags } from "/apps/role_fit/core/tag_suggest.js";
 *   const tags = suggestTags(rawText, TAXONOMY.K_TAGS);
 */

function normText(input){
  return String(input || "")
    .toLowerCase()
    .replace(/\u3000/g, " ")
    .replace(/[\s\r\n\t]+/g, " ")
    .replace(/[，。,．、;；:：/\\|（）()【】\[\]{}「」“”"'!?！?~`@#$%^&*+=<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(s){
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Max gap (in characters) allowed between phrase parts.
// Example: \"项目 推进\" matches \"项目(最多间隔PHRASE_GAP_MAX个字符)推进\".
const PHRASE_GAP_MAX = 6;

/**
 * Convert a multi-part phrase into a regex that allows small gaps.
 * Example: "项目 推进" -> /项目[\s\S]{0,6}推进/i
 * Returns null if not a multi-part phrase.
 */
function phraseToRegExp(phrase){
  const p = normText(phrase);
  if (!p) return null;
  const parts = p.split(" ").filter(Boolean);
  if (parts.length <= 1) return null;

  const gap = Math.max(0, Number(PHRASE_GAP_MAX) || 0);
  const body = parts.map(escapeRegExp).join(`[\\s\\S]{0,${gap}}`);
  return new RegExp(body, "i");
}


/**
 * Guard against false positives for too-short words.
 * - length <= 1: reject
 * - length == 2: allow only 2-letter latin abbreviations (sql/pm/ui/ux)
 * - length >= 3: allow
 */
function isWordEligible(word){
  const w = normText(word);
  if (!w) return false;

  // reject too-short tokens
  if (w.length <= 1) return false;

  // If it's pure latin letters, apply stricter rules for short abbreviations
  if (/^[a-z]+$/i.test(w)){
    const wl = w.length;

    // allow only whitelisted 2-letter abbreviations (avoid false positives like "to", "in")
    if (wl === 2){
      const allow2 = new Set(["pm","ui","ux","hr","bd","cs","bi","qa"]);
      return allow2.has(w);
    }

    // allow only whitelisted 3-letter abbreviations (extend if needed)
    if (wl === 3){
      const allow3 = new Set(["sql","api","kpi","okr","crm"]);
      return allow3.has(w);
    }

    return true;
  }

  // For non-latin tokens (e.g. Chinese), keep it permissive once length>=2
  return true;
}


function normalizeAliases(t){
  let aliases = t?.aliases || t?.keywords || t?.synonyms || [];
  if (typeof aliases === "string") aliases = [aliases];
  if (!Array.isArray(aliases)) aliases = [];
  return aliases;
}

/**
 * Suggest tag keys from text.
 * Returns: string[] unique tag keys (preferred) or labels if key missing.
 */

export function joinFields(fields){
  const arr = Array.isArray(fields) ? fields : [];
  return arr
    .map(x => String(x ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

export function suggestTags(text, tags){
  const raw = normText(text);
  if (!raw) return [];

  const out = [];

  (tags || []).forEach((t) => {
    if (!t) return;

    const key = String(t.key || t.id || t.value || "").trim();
    const label = String(t.label || t.name || "").trim();
    const aliases = normalizeAliases(t);

    const words = [key, label, ...aliases].filter(Boolean);

    for (const w of words){
      if (!isWordEligible(w)) continue;

      const ww = normText(w);

      // phrase match (multi-part)
      const re = phraseToRegExp(w);
      if (re && re.test(raw)){
        out.push(key || ww);
        break;
      }

      // simple contains
      if (ww && raw.includes(ww)){
        out.push(key || ww);
        break;
      }
    }
  });

  return Array.from(new Set(out)).filter(Boolean);
}

// Export internals for unit/debug if needed (optional)
export const __tagSuggestInternals = {
  normText,
  phraseToRegExp,
  isWordEligible,
};

// ---- tiny sanity check (node only) ----
// Run: ROLE_FIT_TAG_SUGGEST_TEST=1 node apps/role_fit/core/tag_suggest.js
if (typeof process !== "undefined" && process?.env?.ROLE_FIT_TAG_SUGGEST_TEST === "1"){
  const tags = [
    { key:"sql", label:"SQL", aliases:["Structured Query Language","数据库查询"] },
    { key:"writing", label:"文档写作", aliases:["写文档","报告"] },
  ];
  const text = "我做过数据库查询，也写过报告";
  const got = suggestTags(text, tags);
  console.log("[tag_suggest:test]", got);
}
