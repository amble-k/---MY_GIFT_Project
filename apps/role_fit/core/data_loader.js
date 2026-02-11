const DEFAULT_TAXONOMY_URL = "/apps/role_fit/data/json/role_fit_taxonomy_v0_1.json";
const DEFAULT_JOB_MODELS_URL = "/apps/role_fit/data/json/job_models_v0_1.json";

const DEFAULT_JOB_CATALOG_URL = "/apps/role_fit/data/json/job_catalog_v0_1.json";

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

export async function loadJobModels(opts = {}) {
  const url = opts.url || DEFAULT_JOB_MODELS_URL;
  try {
    const data = await fetchJson(url);
    if (!data) throw new Error("empty job_models json");
    return data;
  } catch (e) {
    console.error("[DATA_LOADER] loadJobModels failed:", e);
    throw e;
  }
}

export async function loadJobCatalog(url = DEFAULT_JOB_CATALOG_URL){
  return await fetchJson(url);
}

