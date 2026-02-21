/**
 * ROLE_FIT Tag Matcher (stable v0.2)
 * Exports:
 *  - joinFields(fields): string
 *  - matchTags(text, dict): string[]
 *  - matchTagsWithEvidence(text, dict, opts?): {tags:string[], evidence:Array<{tag,matchedBy,mode,score}>}
 *
 * Dict item shape (tolerant):
 *  - key | id | value: string
 *  - aliases | keywords | synonyms: string[]
 */

export function joinFields(fields){
  const arr = Array.isArray(fields) ? fields : [];
  return arr
    .map(x=>String(x ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

function __keyOf(t){
  return String(t?.key || t?.id || t?.value || "").trim();
}

function __aliasesOf(t){
  const a = t?.aliases || t?.keywords || t?.synonyms || [];
  if (!Array.isArray(a)) return [];
  return a.map(x=>String(x ?? "").trim()).filter(Boolean);
}

function __scoreOf(word){
  const w = String(word||"").trim();
  if (!w) return 0;
  // a simple heuristic: longer phrase -> higher confidence
  if (w.length >= 4) return 0.8;
  if (w.length === 3) return 0.75;
  return 0.7;
}

/**
 * Post-filter rules:
 * 1) block short generic verbs: "推进"/"推动" should not trigger anything.
 * 2) if text contains 落地 phrases, suppress project_mgmt (keep execution).
 * 3) if data_analysis is hit, suppress data_literacy for "数据分析" text.
 */
function __postFilter(tags, rawText){
  const out = Array.isArray(tags) ? [...tags] : [];
  const text = String(rawText||"");

  // (1) nothing to do here because we block during matching too

  // (2) suppress project_mgmt on 落地 phrases
  const hasLanding = (text.includes("推进落地") || text.includes("推动落地") || text.includes("执行落地"));
  if (hasLanding){
    const i = out.indexOf("project_mgmt");
    if (i >= 0) out.splice(i, 1);
  }

  // (3) suppress data_literacy when data_analysis present (avoid double count on "数据分析")
  if (out.includes("data_analysis") && out.includes("data_literacy")){
    const i = out.indexOf("data_literacy");
    if (i >= 0) out.splice(i, 1);
  }

  // uniq keep order
  const seen = new Set();
  const uniq = [];
  for (const t of out){
    const k = String(t||"").trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(k);
  }
  return uniq;
}

function _matchCore(text, dict, withEvidence){
  const raw = String(text||"");
  const t = raw.toLowerCase();

  const tags = [];
  const evidence = [];
  const seen = new Set();

  const items = Array.isArray(dict) ? dict : [];

  for (const it of items){
    const key = __keyOf(it);
    if (!key) continue;

    const aliases = __aliasesOf(it);
    if (!aliases.length) continue;

    // try each alias in order
    for (const w0 of aliases){
      const w = String(w0||"").trim();
      if (!w) continue;

      // hard block generic verbs
      if (w === "推进" || w === "推动") continue;

      const wl = w.toLowerCase();
      if (!wl) continue;

      if (t.includes(wl)){
        if (!seen.has(key)){
          tags.push(key);
          seen.add(key);
        }
        if (withEvidence){
          evidence.push({
            tag: key,
            matchedBy: w,
            mode: "substr",
            score: __scoreOf(w)
          });
        }
        break;
      }
    }
  }

  const filtered = __postFilter(tags, raw);
  if (!withEvidence) return filtered;

  const keep = new Set(filtered);
  const ev2 = evidence.filter(x=>keep.has(String(x?.tag||"")));
  return { tags: filtered, evidence: ev2 };
}

export function matchTags(text, dict){
  return _matchCore(text, dict, false);
}

export function matchTagsWithEvidence(text, dict, opts = {}){
  // opts reserved for future (thresholds etc.)
  return _matchCore(text, dict, true);
}
