// core/ui/step_form_v0_2.js
// v0.2: 统一 Step 页表单 + payload 同步 + 自动保存（防抖）
//
// 用法（在各 step 页面 bootStepPage 之后调用）：
// import { mountStepForm } from "/core/ui/step_form_v0_2.js?v=2";
// mountStepForm({ ... });

function $(id) {
  return document.getElementById(id);
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

async function importActionsFresh() {
  // 每次都 cache-bust，避免旧代码
  return import(`/core/actions/v0_1_actions.js?v=${Date.now()}`);
}

function ensureApp(appId = "app") {
  const app = $(appId);
  if (!app) throw new Error(`[ui] app element not found: #${appId}`);
  return app;
}

function makeBox({ title, desc, autosaveId }) {
  const box = document.createElement("div");
  box.style.cssText =
    "margin-top:12px;padding:12px;border:1px solid #eee;border-radius:10px;background:#fff;";

  const h2 = title
    ? `<h2 style="margin:0 0 8px 0;font-size:16px;">${title}</h2>`
    : "";

  const d = desc
    ? `<div style="color:#666;font-size:12px;margin-bottom:8px;">${desc}</div>`
    : "";

  const hint = autosaveId
    ? `<div id="${autosaveId}" style="margin:6px 0 10px 0;color:#666;font-size:12px;">自动保存：未开始</div>`
    : "";

  box.innerHTML = `${h2}${d}${hint}`;
  return box;
}

function setHint(autosaveId, text) {
  if (!autosaveId) return;
  const el = $(autosaveId);
  if (el) el.textContent = text;
}

function getFieldValue(field) {
  const el = $(field.id);
  if (!el) return "";
  const v = el.value;
  return (v ?? "").toString();
}

function setFieldValue(field, value) {
  const el = $(field.id);
  if (!el) return;
  el.value = (value ?? "").toString();
}

function renderFields(container, fields) {
  // 默认：label + input/textarea 的两列布局
  const grid = document.createElement("div");
  grid.style.cssText =
    "display:grid;grid-template-columns:120px 1fr;gap:8px;align-items:center;";

  for (const f of fields) {
    const label = document.createElement("label");
    label.textContent = f.label || f.id;
    grid.appendChild(label);

    if (f.type === "textarea") {
      const ta = document.createElement("textarea");
      ta.id = f.id;
      ta.rows = f.rows || 6;
      ta.placeholder = f.placeholder || "";
      ta.style.cssText =
        f.style ||
        "width:100%;padding:8px;box-sizing:border-box;resize:vertical;border:1px solid #ddd;border-radius:10px;line-height:1.6;";
      grid.appendChild(ta);
    } else {
      const input = document.createElement("input");
      input.id = f.id;
      input.placeholder = f.placeholder || "";
      input.style.cssText =
        f.style ||
        "width:100%;padding:8px;box-sizing:border-box;border:1px solid #ddd;border-radius:10px;";
      grid.appendChild(input);
    }
  }

  container.appendChild(grid);
}

function defaultBuildPayload(fields) {
  const payload = {};
  for (const f of fields) {
    const key = f.key || f.id;
    payload[key] = (getFieldValue(f) || "").toString();
  }
  return payload;
}

/**
 * mountStepForm
 * - 负责：渲染表单、回填、同步 window.__STEP_PAYLOAD__、自动保存（可选）
 *
 * @param {Object} cfg
 * @param {string} [cfg.appId] - 默认 "app"
 * @param {string} cfg.title - 表单标题（h2）
 * @param {string} cfg.desc - 表单说明
 * @param {Array}  cfg.fields - 字段定义：{ id,label,type,input|textarea,rows,placeholder,key }
 * @param {Function} [cfg.fillFromDB] - (db) => payload，返回用于回填的对象
 * @param {Function} [cfg.buildPayload] - () => payload，默认取 fields
 * @param {boolean} [cfg.enableAutosave] - 默认 true
 * @param {number} [cfg.debounceMs] - 默认 500
 * @param {string} [cfg.writerName] - actions 内 writer 函数名，例如 "writeRoleDummy"
 * @param {Function} [cfg.loadDB] - 必填：从页面传入 loadDB
 * @param {Function} [cfg.setActive] - 可选：从页面传入 setActive
 * @param {Object} [cfg.setActiveMap] - writer 返回 id 后，写回 active 的键值，如 { role_id: "RET_ID" }
 * @param {string} [cfg.autosaveId] - 提示 DOM id，默认 `${writerName}_autosave`
 */
export function mountStepForm(cfg) {
  const {
    appId = "app",
    title = "",
    desc = "",
    fields = [],
    fillFromDB,
    buildPayload,
    enableAutosave = true,
    debounceMs = 500,
    writerName,
    loadDB,
    setActive,
    setActiveMap,
    autosaveId = writerName ? `${writerName}_autosave` : "autosave_hint",
  } = cfg || {};

  if (typeof loadDB !== "function") {
    throw new Error("[ui] mountStepForm requires loadDB(db) function");
  }

  const app = ensureApp(appId);

  const box = makeBox({ title, desc, autosaveId: enableAutosave ? autosaveId : null });
  renderFields(box, fields);

  // 放在最上方（不盖住 bootStepPage 的内容）
  app.prepend(box);

  const doFill = () => {
    try {
      const db = loadDB();
      const payload = (typeof fillFromDB === "function") ? (fillFromDB(db) || {}) : {};
      for (const f of fields) {
        const key = f.key || f.id;
        setFieldValue(f, payload?.[key] ?? "");
      }
    } catch (e) {
      console.warn("[ui] fillFromDB failed:", e);
    }
  };

  const syncPayload = () => {
    try {
      const p = (typeof buildPayload === "function")
        ? (buildPayload() || {})
        : defaultBuildPayload(fields);
      window.__STEP_PAYLOAD__ = p;
      return p;
    } catch (e) {
      console.warn("[ui] buildPayload failed:", e);
      window.__STEP_PAYLOAD__ = {};
      window.__FACT_PAYLOAD__ = p;
      window.__TARGET_PAYLOAD__ = p;
      return {};
    }
  };

  // init: 先回填，再同步 payload
  doFill();
  syncPayload();

    // 自动保存
  const autosaveCore = async () => {
    if (!enableAutosave) return;
    if (!writerName) return;

    try {
      // ✅ 关键：任何保存动作前，都先把输入同步到 window.__STEP_PAYLOAD__
      // 否则“保存并留在本页/写入按钮”可能拿到旧 payload 或空对象
      syncPayload();

      setHint(autosaveId, "自动保存：保存中…");

      const m = await importActionsFresh();
      const fn = m?.[writerName];
      if (typeof fn !== "function") {
        setHint(autosaveId, `自动保存：writer 缺失（${writerName}）`);
        return;
      }

      const payload = window.__STEP_PAYLOAD__ || {};
      const retId = fn(payload);

      // retId -> setActive（可选）
      if (retId && typeof setActive === "function" && setActiveMap) {
        const db2 = loadDB();
        const patch = {};
        for (const k of Object.keys(setActiveMap)) {
          patch[k] = (setActiveMap[k] === "RET_ID") ? retId : setActiveMap[k];
        }
        setActive(db2, patch);
      }

      setHint(autosaveId, "自动保存：已保存");
    } catch (e) {
      console.warn("[ui autosave] failed:", e);
      setHint(autosaveId, "自动保存：失败（看 Console）");
    }
  };
  const autosave = debounce(autosaveCore, debounceMs);

  box.addEventListener("input", () => {
    syncPayload();
    if (enableAutosave) {
      setHint(autosaveId, "自动保存：待保存…");
      autosave();
    }
  });

  return { box, syncPayload, doFill };
}

/**
 * 快捷：单 textarea（content）
 */
export function mountSingleTextArea(cfg) {
  const {
    title,
    desc,
    textareaId = "content",
    placeholder = "",
    rows = 18,
    key = "content",
    ...rest
  } = cfg || {};

  const fields = [
    {
      id: textareaId,
      label: "",
      key,
      type: "textarea",
      rows,
      placeholder,
      style:
        "width:100%;padding:10px;box-sizing:border-box;resize:vertical;border:1px solid #ddd;border-radius:10px;line-height:1.6;",
    },
  ];

  return mountStepForm({
    title,
    desc,
    fields,
    ...rest,
  });
}

/**
 * 快捷：单 textarea（note）
 */
export function mountSingleNote(cfg) {
  return mountSingleTextArea({
    textareaId: "note",
    key: "note",
    rows: 10,
    ...cfg,
  });
}