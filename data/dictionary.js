// /data/dictionary.js
// 基础字典与工具（M/T/V/KASH 等标签）
// 规范：
//   - 动机：A / R / C
//   - 价值观：Career / Wealth / Growth / Family / Health / Spiritual / Social / Freedom
//   - KASH：S / H / A_attitude / K

export const DICTIONARY = {
  // ===== Motives（动机：SDT）=====
  A: '自主导向',
  R: '关系导向',
  C: '胜任导向',

  // ===== Values（价值观）=====
  Career: '事业成就',
  Wealth: '财富积累',
  Growth: '个人成长',
  Family: '家庭幸福',
  Health: '身心健康',
  Spiritual: '精神满足',
  Social: '社会连接',
  Freedom: '极致自由',

  // ===== Traits（特质）=====
  Ope_high: '开放探索者',
  Con_high: '尽责执行者',
  Ext_high: '外向社交者',
  Agr_high: '友善协作者',
  Neu_low: '情绪稳定者',
  Neu_high: '情绪敏感者',

  // ===== KASH =====
  S: '结构 (Structure)',
  H: '习惯 (Habit)',
  A_attitude: '态度 (Attitude)', // KASH 的 A：态度
  K: '知识 (Knowledge)',

  // Fallback
  default: '复合型'
};

export function t(key) {
  return DICTIONARY[key] || key;
}