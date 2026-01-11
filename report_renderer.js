/**
 * report_renderer.js (V4.5 - 兼容 v3.1 数据结构)
 * 职责：总指挥。协调数据、文字、图表、导航。
 */
import { getUrlParam, getEl } from './js/utils.js';
import * as Painter from './js/render_charts.js';
import * as Writer from './js/render_text.js';

/**
 * 把 v3.1 的 KASH_PROFILE 转成旧版 report 结构
 * 这样原来的 Writer / Painter 不用改，继续用：
 *   report.m_profile
 *   report.t_profile
 *   report.v_profile
 *   report.r_profile
 *   report.gap_profile
 *   report.synthesis
 */
function normalizeReport(data) {
  const original = data || {};

  // 1. 兼容原始结构（大写）与以后可能的小写
  const T = original.T_profile || original.t_profile || {};
  const M = original.M_profile || original.m_profile || {};
  const V = original.V_profile || original.v_profile || {};
  const R = original.R_profile || original.r_profile || {};
  const D = original.Delta_profile || original.delta_profile || {};
  const P = original.Patterns || original.patterns || {};

  // 2. 构建统一的小写结构，后面所有渲染都用这个
  const report = {
    raw: original,  // 保留原始结果，方便调试

    m_profile: {
      scores: M.scores || {},
      top_motive: M.top_motive || '-',
      m_pattern: M.m_pattern || null,
      m_autonomy: M.m_autonomy,
      m_relatedness: M.m_relatedness,
      m_competence: M.m_competence
    },

    t_profile: {
      t_vector: T.vector || T.t_vector || [],
      top_trait_key: T.top_trait_key || '',
      mt_trait_key: T.mt_trait_key || ''
    },

    v_profile: {
      v_vector: V.vector || V.v_vector || [],
      top_value: V.top_value || V.max_key || '',

      // 1) 原始推演数组版（例如 [0.8,0.6,...]）
      v_from_TM: V.v_from_TM || V.vFromTM || null,

      // 2) byKey 版本（{ Career:0.9, ... }）——综合页第 4 段用
      v_from_TM_byKey: V.v_from_TM_byKey || V.vFromTM_byKey || V.v_from_TM || null,

      // 3) 由 T 反推 M 的中间结果（预留）
      m_inferred_from_T: V.m_inferred_from_T || V.m_inferred || null
    },

    r_profile: {
      r_vector: R.vector || R.r_vector || []
    },

    delta_profile: {
      harmony: D.harmony ?? D.gap_index ?? 0,
      max_gap_key: D.max_gap_key || '',
      delta_vector: D.delta_vector || D.gap_vector || [],
      delta_details: D.delta_details || {}
    },

    patterns: {
      pattern_type: P.pattern_type || '',
      pattern_rule: P.pattern_rule || '',
      pattern_reason: P.pattern_reason || '',
      kash_start: P.kash_start || '',
      kash_rule: P.kash_rule || '',
      mt_key: P.mt_key || '',
      mt_pattern: P.mt_pattern || null
    }
  };

  // 3. 综合信息（给综合页 + 冰山图用）
    report.synthesis = {
    harmony:      report.delta_profile.harmony,
    max_gap_key:  report.delta_profile.max_gap_key,
    top_motive:   report.m_profile.top_motive,
    top_value:    report.v_profile.top_value,
    pattern_type: report.patterns.pattern_type,
    pattern_rule: report.patterns.pattern_rule,
    kash_start:   report.patterns.kash_start,
    kash_rule:    report.patterns.kash_rule,
    mt_pattern:   report.patterns.mt_pattern,
    // ★ 新增：给综合页 & 校验用
    mt_key:       report.patterns.mt_key,
    delta_details: report.delta_profile.delta_details
  };

  return report;
}
document.addEventListener('DOMContentLoaded', () => {
    const raw = localStorage.getItem('myGiftReport');
    if (!raw) {
        console.warn("No report data found.");
        return;
    }

    // 先解析，再做一次结构转换
    const original = JSON.parse(raw);
    const report = normalizeReport(original);

// === 全局 Schema 点检：核心字段是否存在 ===
try {
  if (Writer.assertSynthesisInvariants) {
    Writer.assertSynthesisInvariants(report);
  }
} catch (e) {
  console.warn('[MY GIFT] Global schema check failed:', e);
}
    // 1. 渲染文字 (这步会创建 Canvas 的容器 HTML)
    Writer.renderSummaryText(report);

// 这里做兼容：新结构用 M_profile/T_profile，旧结构是 m_profile/t_profile
Writer.renderMText(report.M_profile || report.m_profile);
Writer.renderTText(report.T_profile || report.t_profile);

Writer.renderVText(report);
Writer.renderRText(report);
Writer.renderGapText(report);
Writer.renderSynthesisText(report);

    // 2. 渲染图表 (必须在文字渲染之后，因为要等容器存在)
        setTimeout(() => {
    // 图表：T 雷达 + V vs R 柱状 + R 单独 + Gap 雷达
    Painter.drawRadarT(report.t_profile.t_vector);
    Painter.drawBarVR(report.v_profile.v_vector, report.r_profile.r_vector); // V 页：理想 vs 现实
    Painter.drawBarR(report.r_profile.r_vector);                              // R 页：现实单独图
    Painter.drawGapRadar(report.v_profile.v_vector, report.r_profile.r_vector);

    // 冰山图：用真实测试结果填三层 + KASH 起点
const syn      = report.synthesis    || {};
const mProfile = report.m_profile    || report.M_profile || {};
const tProfile = report.t_profile    || report.T_profile || {};
const vProfile = report.v_profile    || report.V_profile || {};
const patterns = report.patterns     || report.Patterns  || {};

// 1) 原始 key
const topMotive = syn.top_motive || mProfile.top_motive || '-';
const traitKey  = tProfile.top_trait_key || '';
const topValue  = syn.top_value  || vProfile.top_value  || '';

// 2) 标签映射：短标签
const motiveShortMap = {
  A: 'M：自主',
  C: 'M：能力',
  R: 'M：关系'
};

const traitShortMap = {
  T_Ope_high: 'T：开放 / 探索',
  T_Con_high: 'T：尽责 / 稳定',
  T_Ext_high: 'T：外向 / 推动',
  T_Agr_high: 'T：温和 / 合作',
  T_Neu_high: 'T：敏感 / 体验',
  T_Neu_low:  'T：冷静 / 抗压'
};

const valueShortMap = {
  Career:    'V：事业',
  Wealth:    'V：财富',
  Growth:    'V：成长',
  Family:    'V：家庭',
  Health:    'V：健康',
  Spiritual: 'V：心灵',
  Social:    'V：社交'
};

// 3) 组装展示文字
const mText = motiveShortMap[topMotive] || 'M：动力';
const tText = traitShortMap[traitKey]   || 'T：特质';
const vText = valueShortMap[topValue]   || 'V：方向';

// 4) KASH 起点
const kashStart = patterns.kash_start || '';
const kashTextMap = {
  S: 'Skill（技能）',
  H: 'Habit（习惯）',
  A: 'Attitude（态度）',
  K: 'Knowledge（知识）'
};
const kashText = kashTextMap[kashStart] || '';

// 5) 最终绘制冰山图（两个位置共用同一数据）
Painter.drawIceberg('icebergChart',     mText, tText, vText, kashText);
Painter.drawIceberg('synIcebergChart', mText, tText, vText, kashText);
}, 50);

    // 3. 渲染底部导航按钮
    renderNavButton();
});

// --- 导航按钮逻辑 ---
// /report_renderer.js

function renderNavButton() {
    // 如果没有 tab 参数，默认从 M 页开始
    let tab = getUrlParam('tab') || 'm';
    if (tab === 'synthesis') return; // 最后一页不显示按钮
    let nextTab = "";
    let label = "";
    
    // 纯报告内部流转逻辑
    if (tab === 'm') {
        nextTab = "t";
        label = "继续第二部分：性格特质 (T) →";
    } else if (tab === 't') {
        nextTab = "v";
        label = "继续第三部分：理想价值 (V) →";
    } else if (tab === 'v') {
        nextTab = "r";
        label = "继续第四部分：现实评估 (R) →";
    } else if (tab === 'r') {
        nextTab = "gap";
        label = "查看 差距分析 (Gap) →";
    } else if (tab === 'gap') {
        nextTab = "synthesis";
        label = "查看 综合总结 (Synthesis) →";
    }

    if (nextTab) {
        const btn = document.createElement('a');
        // 🚨 关键：只跳转 tab，不回 index.html
        btn.href = `report.html?tab=${nextTab}`; 
        btn.innerText = label;
        btn.className = "nav-btn"; // 使用 style.css 里的样式
        btn.style.cssText = `
            position: fixed; bottom: 30px; right: 30px;
            z-index: 999; cursor: pointer;
        `;
        document.body.appendChild(btn);
    }
}