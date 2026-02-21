import fs from "node:fs";
import { buildRaw, getTagsWithEvidence } from "../core/tag_service.js";

function readJson(p){
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}
function uniq(arr){
  return Array.from(new Set((arr||[]).map(x=>String(x||"").trim()).filter(Boolean)));
}
function toSet(arr){ return new Set(uniq(arr)); }

function findModel(models, key){
  const arr = Array.isArray(models) ? models : (models?.models ? models.models : []);
  return arr.find(m => String(m?.key||"") === String(key||"")) || null;
}

function coverage(userTags, requiredTags){
  const u = toSet(userTags);
  const r = uniq(requiredTags);
  const hit = r.filter(x=>u.has(x));
  const miss = r.filter(x=>!u.has(x));
  const score = r.length ? (hit.length / r.length) : 0;
  return { score, required:r, hit, miss };
}

function pickTopEvidence(evidence, requiredSet){
  const arr = Array.isArray(evidence) ? evidence : [];
  // 只保留命中 required 的证据，按 score 降序
  return arr
    .filter(x=>requiredSet.has(String(x?.tag||"")))
    .sort((a,b)=>(Number(b?.score||0)-Number(a?.score||0)))
    .slice(0, 12)
    .map(x=>({ tag:x.tag, matchedBy:x.matchedBy, mode:x.mode, score:x.score }));
}

// ---------- load ----------
const tax = readJson("apps/role_fit/data/json/role_fit_taxonomy_v0_1.json");
const jmAll = readJson("apps/role_fit/data/json/job_models_v0_1.json");
const models = Array.isArray(jmAll) ? jmAll : (jmAll.models || jmAll);

const K_TAGS = tax.K_TAGS || [];
const S_TAGS = tax.S_TAGS || [];

// ---------- case ----------
const jobKey = "product_manager";

// 你现在的例子：S 里有 SPIN + 总经理等
const kText = buildRaw(["本科","应用心理学","人力资源管理"]);
const sText = buildRaw(["SPIN 战略管理 市场营销 管理学","公司总经理经验十五年之久","客户谈判 大客户 KA"]);

const jm = findModel(models, jobKey);
if(!jm) throw new Error("job model not found: " + jobKey);

const kRes = getTagsWithEvidence(kText, K_TAGS);
const sRes = getTagsWithEvidence(sText, S_TAGS);

const kCov = coverage(kRes.tags, jm.required_k_tags || []);
const sCov = coverage(sRes.tags, jm.required_s_tags || []);

const kReqSet = new Set(kCov.required);
const sReqSet = new Set(sCov.required);

const out = {
  jobKey,
  input: { kText, sText },
  derived: { k_tags: kRes.tags, s_tags: sRes.tags },
  coverage: {
    K: { score: Number(kCov.score.toFixed(3)), hit: kCov.hit, miss: kCov.miss, required: kCov.required },
    S: { score: Number(sCov.score.toFixed(3)), hit: sCov.hit, miss: sCov.miss, required: sCov.required },
  },
  evidence: {
    K: pickTopEvidence(kRes.evidence, kReqSet),
    S: pickTopEvidence(sRes.evidence, sReqSet),
  }
};

console.log(JSON.stringify(out, null, 2));
