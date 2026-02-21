import fs from "node:fs";

function die(msg){
  console.error("[FAIL]", msg);
  process.exit(1);
}
function ok(msg){ console.log("[OK]", msg); }

const taxPath = "apps/role_fit/data/json/role_fit_taxonomy_v0_1.json";
const jmPath  = "apps/role_fit/data/json/job_models_v0_1.json";
const polPath = "apps/role_fit/data/json/policy_v0_1.json";

const TAX = JSON.parse(fs.readFileSync(taxPath, "utf-8"));
const JM  = JSON.parse(fs.readFileSync(jmPath, "utf-8"));
const POL = JSON.parse(fs.readFileSync(polPath, "utf-8"));

if (!TAX || typeof TAX !== "object") die("taxonomy json not object");
if (!Array.isArray(TAX.K_TAGS)) die("taxonomy missing K_TAGS array");
if (!Array.isArray(TAX.S_TAGS)) die("taxonomy missing S_TAGS array");
if (!POL || typeof POL !== "object") die("policy json not object");
if (!POL.policy || typeof POL.policy !== "object") die("policy missing policy object");

const K_KEYS = new Set();
const S_KEYS = new Set();

function checkTagArr(arr, name){
  arr.forEach((t, i)=>{
    if (!t || typeof t !== "object") die(`${name}[${i}] not object`);
    const key = String(t.key || t.id || "").trim();
    const label = String(t.label || "").trim();
    if (!key) die(`${name}[${i}] missing key`);
    if (!label) die(`${name}[${i}] missing label`);
    const aliases = t.aliases ?? t.keywords ?? t.synonyms ?? [];
    if (!Array.isArray(aliases)) die(`${name}[${i}] aliases not array`);
    const a2 = aliases.map(x=>String(x||"").trim()).filter(Boolean);
    if (a2.length !== aliases.length) {
      // normalize check is not hard-fail, just warn
      console.warn("[WARN]", `${name}[${i}] aliases contain empty/space items; consider normalizing`);
    }
  });
  ok(`${name} shape ok: n=${arr.length}`);
}

checkTagArr(TAX.K_TAGS, "K_TAGS");
checkTagArr(TAX.S_TAGS, "S_TAGS");

TAX.K_TAGS.forEach(t=>K_KEYS.add(String(t.key||t.id||"").trim()));
TAX.S_TAGS.forEach(t=>S_KEYS.add(String(t.key||t.id||"").trim()));

function getModels(jm){
  const data = jm && (jm.models || jm);
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return Object.values(data);
  return [];
}

const models = getModels(JM);
if (!models.length) die("job_models has no models");

models.forEach((m, i)=>{
  const key = String(m.key||m.id||"").trim();
  if (!key) die(`job_models[${i}] missing key`);
  const rk = Array.isArray(m.required_k_tags) ? m.required_k_tags : [];
  const rs = Array.isArray(m.required_s_tags) ? m.required_s_tags : [];
  const missK = rk.filter(x=>!K_KEYS.has(String(x||"").trim()));
  const missS = rs.filter(x=>!S_KEYS.has(String(x||"").trim()));
  if (missK.length) die(`job_model(${key}) required_k_tags missing in taxonomy: ${missK.join(",")}`);
  if (missS.length) die(`job_model(${key}) required_s_tags missing in taxonomy: ${missS.join(",")}`);
});

ok(`job_models mapping ok: n=${models.length}`);

const w = POL.policy.weights || {};
if (![w.K,w.S,w.H].every(x=>Number.isFinite(Number(x)))) die("policy.weights K/S/H must be numbers");
const sum = Number(w.K)+Number(w.S)+Number(w.H);
if (Math.abs(sum-1) > 1e-9) console.warn("[WARN] policy.weights sum != 1 (got "+sum+")");
ok("policy weights ok");

console.log("\nSTANDARDS CHECK OK");
