/**
 * Tag Matcher (v1)
 * Goals:
 * - Produce stable tag hits from free text with evidence for debugging/UI explainability
 * - Keep core logic deterministic and side-effect free
 *
 * API:
 *   matchTags(text, tags, opts) -> { tags: string[], evidence: Evidence[] }
 *
 * Evidence:
 *   {
 *     tag: string,            // tag key
 *     matchedBy: string,      // keyword/alias/label that matched
 *     mode: "phrase"|"substr",
 *     score: number           // simple confidence heuristic (0..1)
 *   }
 */

const DEFAULTS = Object.freeze({
  phraseGapMax: 6,
  blocklist: [
    // generic short verbs that often cause false positives (tunable)
    "推进",
    "推动",
  ],
  allowCjkLen2: true,
});

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

function normalizeAliases(t){
  let aliases = t?.aliases || t?.keywords || t?.synonyms || [];
  if (typeof aliases === "string") aliases = [aliases];
  if (!Array.isArray(aliases)) aliases = [];
  return aliases;
}

function isBlockedWord(w, blocklist){
  const ww = normText(w);
  if (!ww) return true;
  return Array.isArray(blocklist) && blocklist.some(x => normText(x) === ww);
}

/**
 * Guard against false positives for too-short words.
 * - length <= 1: reject
 * - length == 2: allow 2-letter latin abbreviations; optionally allow CJK len2
 * - length >= 3: allow
 */
function isWordEligible(word, opts){
  const w = normText(word);
  if (!w) return false;
  if (w.length <= 1) return false;

  if (w.length === 2){
    if (/^[a-z]{2}$/i.test(w)) return true;
    if (opts.allowCjkLen2 && /[\u4e00-\u9fff]/.test(w)) return true;
    return false;
  }
  return true;
}

/**
 * Convert multi-part phrase into regex allowing small gaps.
 * Example: "项目 推进" -> /项目[\s\S]{0,6}推进/i
 */
function phraseToRegExp(phrase, gapMax){
  const p = normText(phrase);
  if (!p) return null;
  const parts = p.split(" ").filter(Boolean);
  if (parts.length <= 1) return null;

  const gap = Math.max(0, Number(gapMax) || 0);
  const body = parts.map(escapeRegExp).join(`[\\s\\S]{0,${gap}}`);
  return new RegExp(body, "i");
}

function uniq(arr){
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function toKey(t){
  return String(t?.key || t?.id || t?.value || "").trim();
}

function toLabel(t){
  return String(t?.label || t?.name || "").trim();
}

function scoreHeuristic(mode, matchedBy){
  // crude but stable: phrase > substr, longer keyword slightly higher
  const base = (mode === "phrase") ? 0.8 : 0.6;
  const bonus = Math.min(0.2, (normText(matchedBy).length || 0) / 20);
  return Number(Math.max(0, Math.min(1, base + bonus)).toFixed(2));
}

export function _matchTagsCore(text, tags, opts = {}){
  const cfg = { ...DEFAULTS, ...(opts || {}) };

  const raw = normText(text);
  if (!raw) return { tags: [], evidence: [] };

  const out = [];
  const evidence = [];

  (tags || []).forEach((t) => {
    if (!t) return;

    const key = toKey(t);
    const label = toLabel(t);
    const aliases = normalizeAliases(t);

    const candidates = [key, label, ...aliases].filter(Boolean);

    for (const w of candidates){
      if (!isWordEligible(w, cfg)) continue;
      if (isBlockedWord(w, cfg.blocklist)) continue;

      const ww = normText(w);
      if (!ww) continue;

      // phrase match
      const re = phraseToRegExp(w, cfg.phraseGapMax);
      if (re && re.test(raw)){
        const tagKey = key; if (!tagKey) return;
        out.push(tagKey);
        evidence.push({
          tag: tagKey,
          matchedBy: w,
          mode: "phrase",
          score: scoreHeuristic("phrase", w),
        });
        break;
      }

      // substring match
      if (raw.includes(ww)){
        const tagKey = key; if (!tagKey) return;
        out.push(tagKey);
        evidence.push({
          tag: tagKey,
          matchedBy: w,
          mode: "substr",
          score: scoreHeuristic("substr", w),
        });
        break;
      }
    }
  });

  return { tags: uniq(out), evidence };
}

/**
 * Convenience: join multiple fields into a single text blob.
 */
export function joinFields(fields){
  const arr = Array.isArray(fields) ? fields : [];
  return arr
    .map(x => String(x ?? "").trim())
    .filter(Boolean)
    .join("\n");
}


// ---- API wrappers (v1) ----
export function matchTagsWithEvidence(text, tags, opts={}){
  return _matchTagsCore(text, tags, { ...opts, withEvidence:true });
}
export function matchTags(text, tags, opts={}){
  const r = _matchTagsCore(text, tags, opts);
  return (opts && opts.withEvidence) ? r : (r && Array.isArray(r.tags) ? r.tags : []);
}
