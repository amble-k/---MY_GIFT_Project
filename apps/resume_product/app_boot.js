// /apps/resume_product/app_boot.js
import { loadDB } from "/core/storage/resume_db.js";
import { deriveStatus } from "/core/session/deriveStatus.js?v=20260106_172219";
import { dispatch, getRoute } from "/apps/resume_product/router_runtime.js";

export function bootPage({ render }) {
  function tick() {
    const db = loadDB();
    const st = deriveStatus(db);

    // 先统一 router/guard（如果发生 replace，就不再 render）
    const r = dispatch({ db, st });
    if (r?.redirected) return;

    render({ db, st, route: getRoute() });
  }

  window.addEventListener("hashchange", tick);
  window.addEventListener("pageshow", tick);
  tick();
}