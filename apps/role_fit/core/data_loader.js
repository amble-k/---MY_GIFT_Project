const DEFAULT_TAXONOMY_URL = "/apps/role_fit/data/json/role_fit_taxonomy_v0_2.json";
const DEFAULT_JOB_MODELS_URL = "/apps/role_fit/data/json/job_models_v0_2.json";

const DEFAULT_CONTEXT_MAP_URL = "/apps/role_fit/data/json/company_job_context_map_v0_1.json";
const DEFAULT_JOB_CATALOG_URL = "/apps/role_fit/data/json/job_catalog_v0_2.json";

const IS_NODE = (typeof window === "undefined") && (typeof process !== "undefined") && !!(process?.versions?.node);
async function fetchJson(url) {
  // Node.js: support reading "/apps/..." via filesystem (for local tests / smoke)
  if (IS_NODE && typeof url === "string" && url.startsWith("/apps/")) {
    const [{ readFile }, pathMod, urlMod] = await Promise.all([
      import("node:fs/promises"),
      import("node:path"),
      import("node:url"),
    ]);

    const __dirname = pathMod.dirname(urlMod.fileURLToPath(import.meta.url));
    // __dirname: ".../apps/role_fit/core" -> appsRoot: ".../apps"
    const appsRoot = pathMod.resolve(__dirname, "../..");
    const rel = url.replace(/^\/apps\//, "");
    const absPath = pathMod.join(appsRoot, rel);

    const txt = await readFile(absPath, "utf-8");
    return JSON.parse(txt);
  }

  // Browser (or absolute URL in environments that support fetch)
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function loadTaxonomy(opts = {}) {
  const url = opts.url || DEFAULT_TAXONOMY_URL;
  try {
    const data = await fetchJson(url);
    if (!data) throw new Error("empty taxonomy json");
    return data;
  } catch (e) {
    console.error("[DATA_LOADER] loadTaxonomy failed:", e);
    throw e;
  }
}



// ---- normalize job_models shape (v0.2) ----
// target: { meta, models: { [key]: model } }
function __rf_normJobModelsShape(j){
  try{
    if(!j || typeof j!=="object") return j;

    // allow raw array as models
    if(Array.isArray(j)){
      const map = {};
      for(const m of j){
        const k = String(m?.key||m?.id||m?.value||"").trim();
        if(!k) continue;
        map[k]=m;
      }
      return { meta:{version:"v0.2", source:"array"}, models: map };
    }

    // common shapes
    let models = j.models ?? j.items ?? j.data ?? null;

    // {meta, models:[...]}
    if(Array.isArray(models)){
      const map = {};
      for(const m of models){
        const k = String(m?.key||m?.id||m?.value||"").trim();
        if(!k) continue;
        map[k]=m;
      }
      j.models = map;
      return j;
    }

    // {meta, models:{models:[...]}}
    if(models && typeof models==="object" && Array.isArray(models.models)){
      const map = {};
      for(const m of models.models){
        const k = String(m?.key||m?.id||m?.value||"").trim();
        if(!k) continue;
        map[k]=m;
      }
      j.models = map;
      return j;
    }

    // already map
    if(models && typeof models==="object" && !Array.isArray(models)){
      j.models = models;
      return j;
    }

    // fallback: try j itself as map
    const keys = Object.keys(j||{});
    if(keys.length && !j.models){
      const map = {};
      for(const k of keys){
        const m = j[k];
        if(m && typeof m==="object"){
          const kk = String(m.key||k).trim();
          map[kk]=m;
        }
      }
      return { meta:{version:"v0.2", source:"object-map"}, models: map };
    }

    return j;
  }catch(e){
    return j;
  }
}

export async function loadJobModels(arg){
  // allow passing url or {url}
  let url = (typeof DEFAULT_JOB_MODELS_URL !== "undefined")
    ? DEFAULT_JOB_MODELS_URL
    : "/apps/role_fit/data/json/job_models_v0_2.json";

  try{
    if (typeof arg === "string" && arg.trim()) url = arg.trim();
    else if (arg && typeof arg === "object"){
      const u = String(arg.url || arg.src || arg.path || "").trim();
      if (u) url = u;
    }
  }catch(e){}

  const data = await fetchJson(url);
  if (!data) throw new Error("empty job_models json");
  return __rf_normJobModelsShape(data);
}


export async function loadJobCatalog(url = DEFAULT_JOB_CATALOG_URL){
  return await fetchJson(url);
}


/**
 * ROLE_FIT options loader (v0.2)
 * - primary: /apps/role_fit/data/json/role_fit_options_v0_2.json
 * - fallback: /apps/role_fit/data/json/role_fit_options_v0_1.json
 */
export async function loadOptions(){
  const urls = [
    "/apps/role_fit/data/json/role_fit_options_v0_2.json",
    "/apps/role_fit/data/json/role_fit_options_v0_1.json",
  ];
  let lastErr = null;
  for (const url of urls){
    try{
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
      return await r.json();
    }catch(e){
      lastErr = e;
    }
  }
  throw lastErr || new Error("loadOptions failed");
}


// ---- company x job_family context map ----
export async function loadContextMap(url = DEFAULT_CONTEXT_MAP_URL){
  try{
    const data = await fetchJson(url);
    return data;
  }catch(e){
    console.error("[DATA_LOADER] loadContextMap failed:", e);
    throw e;
  }
}
