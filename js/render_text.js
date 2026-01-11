/**
 * /js/render_text.js (Phase 3 FINAL MASTER - THE 500+ LINES VERSION)
 * 职责：全量渲染 M, T, V, Gap, Synthesis 报告
 * 状态：包含所有深度逻辑，无任何省略。
 */
// 综合总结页：模式类型名称映射（UI 显示用）
// 先工程化跑通，用占位名字，之后可以按你文案改成正式称谓

import { getEl } from './utils.js';

// 从 rules.js 直接拿 Delta_rules 和 M_T_patterns
import { Delta_rules, M_T_patterns } from '../data/rules.js';
// 顶部其它 import 下方加这一行
import {
  SYNTHESIS_LABELS,
  buildHarmonySummary,
  buildIdentitySummary,
  buildKashStarter
} from '../data/narratives_synthesis.js';

// 顶部需要有：
import coreNarratives from '../data/narratives_core.js';
import narrativesVR from '../data/narratives_vr.js';
import narrativesR from '../data/narratives_r.js';
import narrativesM from '../data/narratives_m.js';
import narrativesT from '../data/narratives_t.js';
import advancedPatterns from '../data/patterns_advanced.js';
import careerMapping from '../data/career_mapping.js';
import { PATTERN_DISPLAY_NAME } from '../data/pattern_labels.js';
import { t } from '../data/dictionary.js';
import { GAP_TEMPLATES } from '../data/gap_templates.js';
const { iceberg_patterns, kash_entry_narratives } = coreNarratives;

  // ===========================
// 报告完整性校验（防止关键字段缺失）
// ===========================
export function assertSynthesisInvariants(report) {
  const errors = [];

  if (!report.v_profile?.v_from_TM_byKey) {
    errors.push("缺少：v_from_TM_byKey（T→M→V 推演值）");
  }

  if (!report.synthesis?.pattern_type) {
    errors.push("缺少：pattern_type（综合模式类型）");
  }

  if (!report.synthesis?.kash_start) {
    errors.push("缺少：kash_start（KASH 起点）");
  }

  if (!report.synthesis?.mt_key) {
    errors.push("缺少：mt_key（M×T 行为模式键值）");
  }

  if (!report.delta_profile?.delta_details) {
    errors.push("缺少：delta_details（七维差距详情）");
  }

  if (errors.length > 0) {
    console.error("[MY GIFT 报告完整性错误]", errors, report);
  }
}


// =================================================================
// 0. 基础字典与工具
// =================================================================


// 列表渲染辅助函数 (只定义这一次)
function renderList(arr, color) {
    if (!Array.isArray(arr) || arr.length === 0) return "";
    return `<ul style="margin:5px 0 5px 20px; padding:0; color:${color};">` + 
           arr.map(item => `<li style="margin-bottom:3px;">${item}</li>`).join('') + 
           `</ul>`;
}
// =================================================================
// 1. M 动机报告 (全量版：L2深度卡片 + L1详细拆解)
// =================================================================
export function renderMText(profile) {
  const container = getEl('m-content');
  if (!container || !profile) return;

  // 1. 数据准备
  const scores = [
    { k: 'M_A', v: profile.m_autonomy.normalized,    l: '自主性 (Autonomy)',   code: 'A' },
    { k: 'M_R', v: profile.m_relatedness.normalized, l: '关系性 (Relatedness)', code: 'R' },
    { k: 'M_C', v: profile.m_competence.normalized,  l: '胜任感 (Competence)', code: 'C' }
  ];
  scores.sort((a, b) => b.v - a.v);

  const patternKey = profile.m_pattern;
  const l2Info =
    narrativesM.M_L2_patterns?.[patternKey]?.zh ||
    narrativesM.M_L2_patterns?.[patternKey] ||
    {};

  let html = '';

  // --- A. L2 核心模式深度解析（加强版） ---
  if (l2Info.label) {
    html += `
      <div style="background:#f8f9fa; border-left:6px solid #2c3e50; padding:30px; margin-bottom:40px; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
        <h2 style="color:#2c3e50; margin-top:0;">🚀 核心动力模式：${l2Info.label}</h2>
        <p style="font-size:1.1em; font-weight:bold; color:#34495e; margin-bottom:20px;">
          ${l2Info.core || l2Info.summary || ''}
        </p>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:18px;">
          <div style="background:white; padding:15px; border-radius:6px; border:1px solid #eee;">
            <strong style="color:#27ae60;">✅ 最佳情境 (Ideal Environment)</strong>
            <p style="margin:5px 0 0; color:#555;">${l2Info.ideal || l2Info.ideal_env || '—'}</p>
          </div>
          <div style="background:white; padding:15px; border-radius:6px; border:1px solid #eee;">
            <strong style="color:#c0392b;">⚠️ 压力反应 (Stress Response)</strong>
            <p style="margin:5px 0 0; color:#555;">${l2Info.stress || '—'}</p>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
          <div style="background:white; padding:15px; border-radius:6px; border:1px solid #eee;">
            <strong style="color:#2980b9;">🧠 决策/判断风格</strong>
            <p style="margin:5px 0 0; color:#555;">${l2Info.decision_style || l2Info.decision || '—'}</p>
          </div>
          <div style="background:white; padding:15px; border-radius:6px; border:1px solid #eee;">
            <strong style="color:#8e44ad;">🏃 行动特征 (Behavior Signature)</strong>
            <p style="margin:5px 0 0; color:#555;">${l2Info.behavior_signature || l2Info.behavior || '—'}</p>
          </div>
        </div>

        ${
          l2Info.strengths
            ? `<div style="margin-top:20px; padding:15px; background:#f0fdf4; border-radius:6px;">
                 <strong style="color:#27ae60;">🌟 核心优势：</strong>
                 <div style="color:#555;">${l2Info.strengths}</div>
               </div>`
            : ''
        }

        ${
          l2Info.risks
            ? `<div style="margin-top:10px; padding:15px; background:#fff5f5; border-radius:6px;">
                 <strong style="color:#c0392b;">🛑 潜在风险：</strong>
                 <div style="color:#555;">${l2Info.risks}</div>
               </div>`
            : ''
        }
      </div>
    `;
  }

  // --- B. L1 三大动力源全量拆解 ---
  html += `
    <h3 style="border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:25px;">
      📊 三大动力源深度拆解
    </h3>
  `;

  scores.forEach((s) => {
    const level = s.v >= 0.66 ? 'high' : (s.v >= 0.33 ? 'mid' : 'low');
    let info = narrativesM.M_L1?.[s.code]?.[level]?.zh;
    if (!info) info = narrativesM.M_L1?.[s.code]?.[level];
    info = info || {};

    html += `
      <div style="margin-bottom:30px; padding:20px; background:#fff; border:1px solid #e0e0e0; border-radius:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h4 style="margin:0 0 10px; color:#2c3e50;">
            ${s.l}
            <span style="font-size:0.8em; color:#888;">
              (${level.toUpperCase()} - ${(s.v * 10).toFixed(1)})
            </span>
          </h4>
        </div>

        <p style="font-size:0.95em; color:#555; margin:0 0 12px;">
          ${info.description || info.summary || '…'}
        </p>

        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px; font-size:0.9em;">
          <div>
            <strong style="color:#e67e22;">🎯 动力来源：</strong>
            <div style="color:#555; margin-top:4px;">${info.motivation || '—'}</div>
          </div>
          <div>
            <strong style="color:#3498db;">👔 行为表现：</strong>
            <div style="color:#555; margin-top:4px;">${info.behavior || '—'}</div>
          </div>
          <div>
            <strong style="color:#e74c3c;">⚡ 风险提示：</strong>
            <div style="color:#555; margin-top:4px;">${info.risk || '—'}</div>
          </div>
        </div>

        ${
          info.decision
            ? `<p style="margin-top:10px; font-size:0.9em; color:#555;">
                 <strong style="color:#9b59b6;">⚖️ 决策倾向：</strong>${info.decision}
               </p>`
            : ''
        }
        ${
          info.ideal_env
            ? `<p style="margin-top:4px; font-size:0.9em; color:#555;">
                 <strong style="color:#27ae60;">🌱 适合环境：</strong>${info.ideal_env}
               </p>`
            : ''
        }
      </div>
    `;
  });

  

  container.innerHTML = html;
}
  
// =================================================================
// 2. 渲染 T 特质报告 (全量版：L2 + M*T + 5xL1深度拆解)
// =================================================================
export function renderTText(profile) {
  const container = getEl('t-content');
  if (!container || !profile) return;

  // 1. 数据准备
  const dims = ['T_Ope', 'T_Con', 'T_Ext', 'T_Agr', 'T_Neu'];
  const labels = [
    '开放性 (Openness)',
    '尽责性 (Conscientiousness)',
    '外向性 (Extraversion)',
    '宜人性 (Agreeableness)',
    '情绪性 (Neuroticism)'
  ];

  let traits = (profile.t_vector || []).map((v, i) => ({
    v,
    k: dims[i],
    l: labels[i],
    code: dims[i]
  })).sort((a, b) => b.v - a.v);

  const top1 = traits[0];
  const top2 = traits[1];

  // L2 组合查找
  const sortedKeys = [top1.k, top2.k].sort();
  const comboKey = `pattern_${sortedKeys[0]}_high_${sortedKeys[1]}_high`;

  const l2Info =
    narrativesT.T_L2_patterns?.[comboKey]?.zh ||
    narrativesT.T_L2_patterns?.[comboKey] ||
    {};

  let html = '';

  // ----------------------------------------------------------
  // A 区：特质 L2 深度风格（行为风格总览）
  // ----------------------------------------------------------
  html += `
    <div style="margin-bottom:40px; padding:30px;
         background:linear-gradient(to bottom,#ffffff,#f4faff);
         border-radius:12px; border-top:6px solid #3498db;
         box-shadow:0 5px 20px rgba(0,0,0,0.1);">

      <div style="text-align:center; margin-bottom:20px;">
        <div style="font-size:0.9em; color:#3498db; letter-spacing:1px; font-weight:bold;">
          CORE PERSONALITY STYLE
        </div>

        <h2 style="margin:10px 0; color:#2c3e50; font-size:2em;">
          🔮 ${l2Info.title || `${top1.l.split(' ')[0]} × ${top2.l.split(' ')[0]}`}
        </h2>

        <p style="font-size:1.1em; line-height:1.6; color:#555; max-width:800px; margin:0 auto;">
          ${l2Info.desc || l2Info.description || '你的特质组合形成了独特的行为模式。'}
        </p>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px;">
        <div style="background:white;padding:20px;border-radius:8px;border:1px solid #e1e8ed;">
          <h4 style="margin:0 0 10px;color:#2c3e50;">💬 沟通与社交风格</h4>
          <p style="font-size:0.95em;color:#555;">${l2Info.relation || '—'}</p>
        </div>

        <div style="background:white;padding:20px;border-radius:8px;border:1px solid #e1e8ed;">
          <h4 style="margin:0 0 10px;color:#2c3e50;">🧠 决策与做事偏好</h4>
          <p style="font-size:0.95em;color:#555;">${l2Info.decision || '—'}</p>
        </div>

        <div style="background:white;padding:20px;border-radius:8px;border:1px solid #e1e8ed;">
          <h4 style="margin:0 0 10px;color:#2c3e50;">⚠️ 压力反应与雷区</h4>
          <p style="font-size:0.95em;color:#555;">${l2Info.stress || '—'}</p>
        </div>
      </div>
    </div>
  `;

   // ----------------------------------------------------------
  // B 区：M×T 深度驱动力（先用 Patterns.mt_pattern，再兜底 legacy）
  // ----------------------------------------------------------
  let mtData = null;
  try {
   const report = JSON.parse(localStorage.getItem('myGiftReport') || 'null');

// ★ 调试：在报告页挂一次，方便控制台查看真实结构
if (typeof window !== 'undefined') {
  window.MYGIFT_REPORT = report;
  console.log('[MYGIFT DEBUG] report (render_text) =', report);
}
    const patterns = report.Patterns || report.patterns || {};
    
    // 1) 拿到 mt_key（例如：R>C>A__Neu_high）
    const mtKey =
      patterns.mt_key ||
      report.synthesis?.mt_key ||
      report.synthesis?.mtKey ||
      '';
    console.log('[T] patterns =', patterns);
    console.log('[T] mtKey =', mtKey);
    console.log('[T] has M_T_patterns key =', !!M_T_patterns?.[mtKey]);
    console.log('[T] sample M_T_patterns =', M_T_patterns);
    console.log(
  '[V5] motive_alignment =',
    report.Value_profile_v5 && report.Value_profile_v5.motive_alignment
);
    console.log('[V5] T_profile_v5 =',
    MYGIFT_REPORT.T_profile_v5
);
    console.log('[V5] Value_profile_v5 =', MYGIFT_REPORT.Value_profile_v5);
// 在 render_text.js 里，report 解析之后
    const v5snapshot = report.v5_snapshot || null;
    console.log('[V5 snapshot in render_text]', v5snapshot);
    
    // 2) 优先用 logic_core 里算好的 Patterns.mt_pattern
    if (patterns.mt_pattern) {
      mtData = patterns.mt_pattern;
    }
        // 3) 如果还没有，就直接用 rules.js 里的 M_T_patterns 查表
    else if (mtKey && M_T_patterns) {
      mtData = M_T_patterns[mtKey] || null;
    }
  } catch (e) {
    console.warn('[renderTText] M×T 读取失败', e);
  }

  // （下面这段 if (mtData) { ... } 原来就有的，保持不动）
  if (mtData) {
    html += `
      <div style="margin-bottom:40px; padding:25px; background:#fffbe6;
        border-radius:12px; border:2px solid #f9e79f;">
        <h3 style="margin-top:0; color:#d35400; border-bottom:2px dashed #f39c12; padding-bottom:15px;">
          🔥 深度洞察：行为背后的驱动力 (M × T)
        </h3>

        <div style="font-size:1.1em;font-weight:bold;color:#a04000;margin:15px 0;">
          “${mtData.behavior_signature || '—'}”
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div style="background:#fff;padding:15px;border-radius:8px;">
            <strong style="color:#d35400;">💼 工作风格：</strong>
            <p style="margin:6px 0;color:#555;">${mtData.task_behavior || '—'}</p>
          </div>

          <div style="background:#fff;padding:15px;border-radius:8px;">
            <strong style="color:#d35400;">🤝 协作模式：</strong>
            <p style="margin:6px 0;color:#555;">${mtData.relation_behavior || '—'}</p>
          </div>
        </div>
      </div>
    `;
  }

  // ----------------------------------------------------------
  // C 区：Big Five 五大特质 L1 深度拆解
  // ----------------------------------------------------------
  html += `
    <h3 style="border-left:5px solid #2c3e50; padding-left:14px;
       margin:40px 0 25px; color:#2c3e50;">
      📊 五大特质深度拆解
    </h3>
  `;

  traits.forEach((t, index) => {
    const level = t.v >= 0.66 ? 'high' : (t.v >= 0.33 ? 'mid' : 'low');

    let info =
      narrativesT.T_L1?.[`${t.code}_${level}`]?.zh ||
      narrativesT.T_L1?.[`${t.code}_${level}`] ||
      narrativesT.T_L1?.[t.code]?.[level]?.zh ||
      {};

    const highlight = index < 2;
    const borderColor = highlight ? '#3498db' : '#e0e0e0';
    const bgColor = highlight ? '#f8fbfe' : '#fff';

    html += `
      <div style="margin-bottom:28px;padding:20px;background:${bgColor};
        border:1px solid ${borderColor};border-radius:8px;">

        <div style="display:flex;justify-content:space-between;align-items:center;
          margin-bottom:12px;border-bottom:1px dashed #ccc;padding-bottom:6px;">
          <div>
            <h4 style="margin:0;color:#2c3e50;">${t.l}</h4>
            <span style="font-size:0.85em;color:#7f8c8d;">
              强度：${level.toUpperCase()}
            </span>
          </div>

          <div style="font-size:1.3em;font-weight:bold;color:#2c3e50;">
            ${(t.v * 10).toFixed(1)}
          </div>
        </div>

        <p style="color:#34495e;margin-bottom:15px;">
          ${info.description || info.core_style || '—'}
        </p>

        <div style="background:#f6faff;padding:12px;border-radius:6px;margin-bottom:12px;">
          <div style="font-size:0.95em;margin-bottom:6px;">
            <strong>📝 任务场景：</strong>${info.task_behavior || '—'}
          </div>
          <div style="font-size:0.95em;">
            <strong>💬 社交场景：</strong>${info.relation_behavior || '—'}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:0.9em;">
          ${
            info.strengths
              ? `<div>
                  <strong style="color:#27ae60;">🌟 优势：</strong>
                  ${renderList(info.strengths, '#2c3e50')}
                </div>`
              : ''
          }

          ${
            info.risks
              ? `<div>
                  <strong style="color:#c0392b;">⚠️ 风险：</strong>
                  ${renderList(info.risks, '#2c3e50')}
                </div>`
              : ''
          }
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
// =================================================================
// 3. 渲染 V 页（价值观）——简单版：先显示每个维度的描述
// =================================================================
export function renderVText(report) {
  const container = getEl('v-content');
  if (!container || !report || !report.v_profile) return;

  // 1. 基础数据
  const vVec = report.v_profile.v_vector || [];
  const vInfer = report.v_profile.v_from_TM_byKey || null;
  const valueKeys = ["Career","Wealth","Growth","Family","Health","Spiritual","Social"];

  const { V_L1 } = narrativesVR || {};

  const labelMap = {
    Career: '事业',
    Wealth: '财富',
    Growth: '成长',
    Family: '家庭',
    Health: '健康',
    Spiritual: '心灵',
    Social: '社交'
  };

  let html = '';

  // -------------------------------------------------------------
  // ① 从结构层读取优先级（core / support / flexible）
  // -------------------------------------------------------------
  const delta = report.delta_profile || report.Delta_profile || {};
  const priorityFromDelta = delta.priority_by_key || {};

  // 兜底：如果结构层没有，就用 v_rank + 分数再算一遍（防止旧数据崩溃）
  const vRankRaw = report.v_rank || report.raw_answers?.v_rank || null;
  const rankMap = {};

  if (Array.isArray(vRankRaw)) {
    vRankRaw.forEach((item, index) => {
      if (!item) return;
      if (typeof item === 'string') {
        rankMap[item] = index + 1;
      } else if (item.key) {
        const k = String(item.key);
        const r = (typeof item.rank === 'number') ? item.rank : (index + 1);
        rankMap[k] = r;
      }
    });
  } else if (vRankRaw && typeof vRankRaw === 'object') {
    Object.keys(vRankRaw).forEach((k) => {
      const val = vRankRaw[k];
      if (typeof val === 'number') {
        rankMap[k] = val;
      }
    });
  }

  function computePriorityLevel(vScore, rank) {
    const hasRank = (typeof rank === 'number' && !isNaN(rank));
    if (hasRank) {
      if (rank <= 2) return 'core';
      if (rank <= 4) return 'support';
      return 'flexible';
    }
    if (vScore >= 0.8) return 'core';
    if (vScore >= 0.6) return 'support';
    return 'flexible';
  }

  const priorityByKey = {};

  valueKeys.forEach((key, idx) => {
    const score = (typeof vVec[idx] === 'number') ? vVec[idx] : 0;
    let priority = priorityFromDelta[key];
    if (!priority) {
      const rank = rankMap[key];
      priority = computePriorityLevel(score, rank);
    }
    priorityByKey[key] = priority;
  });

  // 按优先级分组
  const groups = {
    core: [],
    support: [],
    flexible: []
  };

  valueKeys.forEach((key) => {
    const p = priorityByKey[key];
    if (groups[p]) groups[p].push(key);
  });

  function formatDomainList(keysArr) {
    if (!keysArr || !keysArr.length) return '';
    return keysArr
      .map((k) => labelMap[k] || k)
      .join('、');
  }

  const coreTextList = formatDomainList(groups.core);
  const supportTextList = formatDomainList(groups.support);
  const flexibleTextList = formatDomainList(groups.flexible);

  const coreLine = coreTextList
    ? `你最在意的核心领域是：${coreTextList}。`
    : '目前你没有特别突出的核心优先领域。';

  const supportLine = supportTextList
    ? `其次是：${supportTextList}。`
    : '目前你的重要支撑领域还不算特别集中。';

  const flexibleLine = flexibleTextList
    ? `相对灵活可调的领域包括：${flexibleTextList}。`
    : '目前你几乎把所有领域都当作重要的目标在推进。';

  // 天赋推演排序
  let inferSummaryHtml = '';
  if (vInfer) {
    const inferSorted = Object.entries(vInfer)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${labelMap[k] || k}（${(v * 10).toFixed(1)}）`)
      .join('、');

    inferSummaryHtml = `
      <p style="font-size:13px;color:#666;margin:6px 0 0;">
        天赋底盘预测的价值排序：<strong>${inferSorted}</strong>
      </p>
    `;
  }

  html += `
    <section style="margin-bottom:24px;padding:18px;background:#f9fafb;
      border:1px solid #e5e7eb;border-radius:10px;">
      <h3 style="margin:0 0 6px;font-size:15px;color:#111827;">
        你的价值结构总览
      </h3>
      <p style="font-size:14px;color:#111827;margin:2px 0;">${coreLine}</p>
      <p style="font-size:14px;color:#111827;margin:2px 0;">${supportLine}</p>
      <p style="font-size:14px;color:#111827;margin:2px 0;">${flexibleLine}</p>
      ${inferSummaryHtml}
    </section>
  `;

  // -------------------------------------------------------------
  // ② M→V 的结构解释（结构必备，不以文案为主）
  // -------------------------------------------------------------
  if (report.v_profile.m_inferred_from_T) {
    html += `
      <section style="margin-bottom:24px;padding:16px;background:#fff7ed;
        border:1px solid #ffdfa8;border-radius:10px;">
        <h3 style="margin:0 0 6px;font-size:15px;color:#a56200;">
          M → V 的天赋影响机制（结构说明）
        </h3>
        <p style="font-size:13px;color:#8a5200;line-height:1.7;margin:0;">
          系统根据你的性格特质（T）推导出核心动机（M = A/R/C），并进一步映射出潜在价值排序。
          <br>此结构说明用来判断你当前 V 的选择是长期偏好，还是受到阶段压力影响。
        </p>
      </section>
    `;
  }

  // -------------------------------------------------------------
  // ③ 每个维度的 L1 深度文案 + 优先级标签
  // -------------------------------------------------------------
  if (!V_L1) {
    container.innerHTML = `<p style="color:#888;">（未找到 V_L1 数据）</p>`;
    return;
  }

  function priorityLabel(p) {
    if (p === 'core') return '核心优先级';
    if (p === 'support') return '重要支撑';
    return '灵活可调';
  }

  valueKeys.forEach((key, i) => {
    const score = vVec[i] || 0;
    const level = score >= 0.66 ? 'high' : score >= 0.33 ? 'mid' : 'low';
    const info = V_L1[key]?.[level] || {};

    const levelText =
      level === 'high' ? '高关注' :
      level === 'mid' ? '中度关注' : '较低关注';

    const pLevel = priorityByKey[key] || 'flexible';
    const pLabel = priorityLabel(pLevel);

    html += `
      <div style="margin-bottom:25px;padding:20px;background:#fff;border-radius:8px;
        border:1px solid #e0e0e0;">
        <h4 style="margin:0 0 10px;color:#2c3e50;">
          ${labelMap[key]}｜${pLabel}｜${levelText}
        </h4>

        <p style="color:#555;line-height:1.7;margin:0 0 6px;">
          ${info.description || ''}
        </p>

        ${info.motivation ? `
          <p style="color:#555;line-height:1.7;margin:0 0 6px;">
            <strong>内在原因：</strong>${info.motivation}
          </p>` : ''}

        ${info.behavior ? `
          <p style="color:#555;line-height:1.7;margin:0 0 6px;">
            <strong>行为表现：</strong>${info.behavior}
          </p>` : ''}

        ${info.decision ? `
          <p style="color:#555;line-height:1.7;margin:0 0 6px;">
            <strong>决策风格：</strong>${info.decision}
          </p>` : ''}

        ${info.ideal ? `
          <p style="color:#555;line-height:1.7;margin:0;">
            <strong>适合环境：</strong>${info.ideal}
          </p>` : ''}
      </div>
    `;
  });

  container.innerHTML = html;
}

// =================================================================
// 4. 渲染 R 页（现实满意度）——通过调用传入的 report / r_profile
// =================================================================
export function renderRText(reportOrProfile) {
  const container = getEl('r-content');
  if (!container || !reportOrProfile) return;

  // 0）统一处理：可能传的是整份 report，也可能只传 r_profile
  const isProfileOnly = !!reportOrProfile.vector && !reportOrProfile.r_profile && !reportOrProfile.R_profile;
  const report = isProfileOnly
    ? { r_profile: reportOrProfile }   // 只传了 r_profile
    : reportOrProfile;                 // 传的是整份 report

  // 1. 数据：R 向量 + Delta 详情（都来自“调用传入”的 report）
  const rVec =
    report.r_profile?.vector ||
    report.R_profile?.vector ||
    [];

  const vVec =
    report.v_profile?.vector ||
    report.V_profile?.vector ||
    [];

  const deltaProfile =
    report.delta_profile ||
    report.Delta_profile ||
    {};

  const deltaDetails = deltaProfile.delta_details || {};

  const { R_L1 } = narrativesR || {};
  if (!R_L1) {
    container.innerHTML = `<p style="color:#888;">（未找到 R_L1 数据）</p>`;
    return;
  }

  const keys = ["Career","Wealth","Growth","Family","Health","Spiritual","Social"];

  const labelMap = {
    Career: '事业',
    Wealth: '财富',
    Growth: '成长',
    Family: '家庭',
    Health: '健康',
    Spiritual: '心灵',
    Social: '社交'
  };

  let html = '';

  // 一个小工具：优先从 delta_details 里拿 reality_avg（0~10），没有就从 rVec 折算
  function getReality01(key, index) {
    const info = deltaDetails[key] || {};
    if (typeof info.reality_avg === 'number') {
      // reality_avg 是 0~10，换成 0~1
      return info.reality_avg / 10;
    }
    if (typeof info.reality === 'number') {
      return info.reality / 10;
    }
    const raw = rVec[index];
    return (typeof raw === 'number' ? raw : 0);
  }

  // ======================================================
  // ① 顶部 summary：现实状态概览（结构必须项）
  // ======================================================
  const sorted = keys
    .map((k, i) => ({
      key: k,
      score: getReality01(k, i)      // 统一用上面的小工具
    }))
    .sort((a, b) => b.score - a.score);

  const top3 = sorted.slice(0, 3)
    .map(it => `${labelMap[it.key]}（${(it.score * 10).toFixed(1)}）`)
    .join('、');

  html += `
    <section style="margin-bottom:24px;padding:18px;background:#f9fafb;
      border:1px solid #e5e7eb;border-radius:10px;">
      <h3 style="margin:0 0 6px;font-size:15px;color:#111827;">
        你的现实状态概览
      </h3>
      <p style="font-size:14px;color:#333;margin:0;">
        当前你“感觉最顺畅”的领域：<strong>${top3}</strong>
      </p>
    </section>
  `;

  // ======================================================
  // ② R 页特有：现实偏差机制结构说明（算法链的说明）
  // ======================================================
  html += `
    <section style="margin-bottom:24px;padding:16px;background:#fff7ed;
      border:1px solid #ffdfa8;border-radius:10px;">
      <h3 style="margin:0 0 6px;font-size:15px;color:#a56200;">
        为什么现实会与理想不同？（结构说明）
      </h3>
      <p style="font-size:13px;color:#8a5200;line-height:1.7;margin:0;">
        现实状态（R）受外在资源、阶段性压力、环境限制、人际结构等因素影响，
        不一定能与理想价值（V）保持一致。
        <br>这一页展示的是你当下的“体验质量”和“结构稳定度”，用于后续 Δ 页差距分析。
      </p>
    </section>
  `;

  // ======================================================
  // ③ 每个维度的深度版 L1 内容
  // ======================================================
  keys.forEach((key, i) => {
    const score = getReality01(key, i);   // 同样统一用 reality01
    const level = score >= 0.66 ? 'high' : score >= 0.33 ? 'mid' : 'low';
    const info = R_L1[key]?.[level] || {};

    const levelLabel =
      level === 'high' ? '高满意度'
      : level === 'mid' ? '中等满意度'
      : '低满意度';

    html += `
      <div style="margin-bottom:25px;padding:20px;background:#fff;
        border-radius:8px;border:1px solid #e0e0e0;">
        <h4 style="margin:0 0 10px;color:#2c3e50;">
          ${labelMap[key]}｜${levelLabel}（约 ${(score * 10).toFixed(1)} 分）
        </h4>

        <p style="color:#555;line-height:1.7;margin:0 0 8px;">
          ${info.description || ''}
        </p>

        ${info.cause ? `
          <p style="color:#555;line-height:1.7;margin:0 0 6px;">
            <strong>可能原因：</strong>${info.cause}
          </p>` : ''}

        ${info.risk ? `
          <p style="color:#555;line-height:1.7;margin:0 0 6px;">
            <strong>潜在影响：</strong>${info.risk}
          </p>` : ''}

        ${info.action ? `
          <p style="color:#555;line-height:1.7;margin:0;">
            <strong>建议：</strong>${info.action}
          </p>` : ''}
      </div>
    `;
  });

  container.innerHTML = html;
}
// 从 Delta_profile.delta_details 里安全取出某个领域的 0~10 分数
function getGapNumbersFromDetails(profile, domainKey) {
  const deltaProfile = profile.Delta_profile || profile.delta_profile || {};
  const details = deltaProfile.delta_details || {};
  const info = details[domainKey] || {};

  // 理想分
  let ideal = 0;
  if (typeof info.ideal_avg === 'number') {
    ideal = info.ideal_avg;
  } else if (typeof info.ideal === 'number') {
    ideal = info.ideal;
  } else if (typeof info.ideal_value === 'number') {
    ideal = info.ideal_value;
  }

  // 现实分
  let reality = 0;
  if (typeof info.reality_avg === 'number') {
    reality = info.reality_avg;
  } else if (typeof info.reality === 'number') {
    reality = info.reality;
  } else if (typeof info.reality_value === 'number') {
    reality = info.reality_value;
  }

  // 差距
  let gapVal = 0;
  if (typeof info.gap_value === 'number') {
    gapVal = info.gap_value;
  } else if (typeof info.gap === 'number') {
    gapVal = info.gap;
  } else if (typeof info.gap_score === 'number') {
    gapVal = info.gap_score;
  } else {
    gapVal = Math.abs(ideal - reality);
  }

  return {
    ideal:   ideal.toFixed(1),
    reality: reality.toFixed(1),
    gap:     gapVal.toFixed(1)
  };
}
// 理想 V vs 现实 R 差距文本（7 大领域）
// 理想 V vs 现实 R 差距文本（7 大领域）
// 理想 V vs 现实 R 差距文本（7 大领域）
// 理想 V vs 现实 R 差距文本（7 大领域，支持 v_rank 排序）
export function renderGapText(report) {
  const container = getEl('gap-content');
  if (!container || !report) return;

  // 兼容大小写
  const delta =
    report.delta_profile ||
    report.Delta_profile ||
    {};

  const deltaDetails = delta.delta_details || {};
  const mainGapKey =
    delta.max_gap_key ||
    (report.synthesis && report.synthesis.max_gap_key) ||
    '';

  const vVec =
    report.v_profile?.v_vector ||
    report.V_profile?.v_vector ||
    report.v_profile?.vector ||
    report.V_profile?.vector ||
    [];

  const rVec =
    report.r_profile?.r_vector ||
    report.R_profile?.r_vector ||
    report.r_profile?.vector ||
    report.R_profile?.vector ||
    [];

  // ========= 领域基础信息 =========
  const DEFAULT_DOMAIN_ORDER = ['Career', 'Wealth', 'Growth', 'Family', 'Health', 'Spiritual', 'Social'];

  const DOMAIN_CN = {
    Career: '事业',
    Wealth: '财富',
    Growth: '成长',
    Family: '家庭',
    Health: '健康',
    Spiritual: '心灵',
    Social: '社交'
  };

  const KEY_INDEX = {
    Career: 0,
    Wealth: 1,
    Growth: 2,
    Family: 3,
    Health: 4,
    Spiritual: 5,
    Social: 6
  };

  // ========= 从报告中读取 v_rank 排序 =========
  let vRankSource = null;

  if (Array.isArray(report.raw?.v_rank) && report.raw.v_rank.length) {
    vRankSource = report.raw.v_rank;
  } else if (Array.isArray(report.raw?.raw_answers?.v_rank) && report.raw.raw_answers.v_rank.length) {
    vRankSource = report.raw.raw_answers.v_rank;
  } else if (Array.isArray(report.v_rank) && report.v_rank.length) {
    vRankSource = report.v_rank;
  } else if (Array.isArray(report.raw_answers?.v_rank) && report.raw_answers.v_rank.length) {
    vRankSource = report.raw_answers.v_rank;
  } else if (Array.isArray(report.V_profile?.v_rank) && report.V_profile.v_rank.length) {
    vRankSource = report.V_profile.v_rank;
  }

  const vRankClean = Array.isArray(vRankSource)
    ? vRankSource.filter(k => DEFAULT_DOMAIN_ORDER.includes(k))
    : [];

  const DOMAIN_ORDER = vRankClean.length
    ? [...vRankClean, ...DEFAULT_DOMAIN_ORDER.filter(k => !vRankClean.includes(k))]
    : DEFAULT_DOMAIN_ORDER;

  // rankMap: key -> 排名（1 = 最优先）
  const rankMap = {};
  vRankClean.forEach((k, idx) => {
    rankMap[k] = idx + 1;
  });

  console.log('[GAP] vRank used in Gap page =', vRankClean);
  console.log('[GAP] DOMAIN_ORDER =', DOMAIN_ORDER);

  // ========= 各种文字标签 =========
  const MATCH_LABEL = {
    low: '较高',
    mid: '中等',
    high: '较低'
  };

  const IMPORTANCE_LABEL = {
    high: '高度重视',
    mid: '中度重视',
    low: '相对不那么在意'
  };

  const SATISFACTION_LABEL = {
    high: '当前状态整体较好',
    mid: '目前还算可以，但有提升空间',
    low: '目前体验偏低或不太满意'
  };

  const STATUS_LABEL = {
    core_align:        '核心优势区',
    growth_gap:        '优先成长区',
    structural_gap:    '结构性缺口',
    over_invest_high:  '可能投入过多的区块',
    neutral_align:     '中性匹配区',
    potential_concern: '潜在隐忧区',
    misallocated_high: '资源错配区',
    low_maintain:      '随缘维持区',
    low_ignore:        '低关注边缘区'
  };

  const STATUS_DESC = {
    core_align:        '这是你又在意、现实状态也不错的领域，可以继续巩固成你的长期优势。',
    growth_gap:        '你很在意，但现实还没完全跟上，是适合作为接下来 3〜6 个月重点发力的区域。',
    structural_gap:    '你非常在意，但现实差距明显，如果长时间不调整，容易形成结构性的消耗与纠结。',
    over_invest_high:  '现实表现已经不错，但你对它的重视程度相对一般，可能在这里投入了超出必要的精力。',
    neutral_align:     '重要性和现实状态都处在中间水平，可以按目前节奏自然推进即可。',
    potential_concern: '短期不一定是痛点，但长期放任不管，可能演变成隐性的拉扯或风险。',
    misallocated_high: '现实看起来很好，但对你来说并不是最重要的领域，建议评估是否存在资源错配。',
    low_maintain:      '这块对你来说不是核心战场，现在的投入和状态可以维持在“够用就好”的水平。',
    low_ignore:        '你本身就不太在意，这块可以放心放在优先级的后面，不必花太多心力。'
  };

  // 小工具：如果 detail 里没有 level，就从分数推一个
  function inferLevel(x) {
    if (x >= 0.66) return 'high';
    if (x >= 0.33) return 'mid';
    return 'low';
  }

  // 小工具：根据排序 + 分数算优先级层级
  function computePriorityLevel(vScore, rank) {
    const hasRank = (typeof rank === 'number' && !isNaN(rank));
    if (hasRank) {
      if (rank <= 2) return 'core';
      if (rank <= 4) return 'support';
      return 'flexible';
    }
    if (vScore >= 0.8) return 'core';
    if (vScore >= 0.6) return 'support';
    return 'flexible';
  }

  // 阈值（0~10 差距）
  const GAP_MAIN_THRESHOLD = 2.5;   // 主要矛盾
  const GAP_SMALL_THRESHOLD = 1.5;  // 认为“已对齐”的上限
  const GAP_NONCORE_THRESHOLD = 2.0;// 非核心差距的提醒

  // 收集结构数据
  const items = [];

  DOMAIN_ORDER.forEach((key) => {
    const detailFromReport = deltaDetails[key] || {};
    const dataNode = delta[key] || {};
    const idx = KEY_INDEX[key];

    const isMain = mainGapKey && key === mainGapKey;

    // 分数：优先用 delta_details 的 v / r
    const vScore =
      typeof detailFromReport.v === 'number'
        ? detailFromReport.v
        : (typeof vVec[idx] === 'number' ? vVec[idx] : 0);

    const rScore =
      typeof detailFromReport.r === 'number'
        ? detailFromReport.r
        : (typeof rVec[idx] === 'number' ? rVec[idx] : 0);

    const gapScore =
      typeof detailFromReport.gap === 'number'
        ? detailFromReport.gap
        : Math.abs(vScore - rScore);

    const v_level =
      detailFromReport.v_level ||
      dataNode.v_level ||
      inferLevel(vScore);

    const r_level =
      detailFromReport.r_level ||
      dataNode.r_level ||
      inferLevel(rScore);

    const status =
      detailFromReport.status ||
      dataNode.status ||
      'neutral_align';

    let level =
      detailFromReport.level ||
      dataNode.level ||
      dataNode.match_level ||
      dataNode.level_key ||
      'mid';

    if (!['low', 'mid', 'high'].includes(level)) level = 'mid';

    const rulePack =
      Delta_rules?.[key]?.[level] ||
      Delta_rules?.[key]?.mid ||
      {};

    const label = rulePack.label || DOMAIN_CN[key] || key;
    const matchLabel = MATCH_LABEL[level] || '中等';

    const summary = rulePack.summary || detailFromReport.summary || '';
    const description = rulePack.description || detailFromReport.description || '';
    const cause = rulePack.cause || detailFromReport.cause || '';

    const opportunityJoined =
      rulePack.opportunity_joined ||
      detailFromReport.opportunity_joined ||
      (Array.isArray(rulePack.opportunity) ? rulePack.opportunity.join('；') : '') ||
      '';

    const adviceJoined =
      rulePack.advice_joined ||
      detailFromReport.advice_joined ||
      (Array.isArray(rulePack.advice) ? rulePack.advice.join('；') : '') ||
      '';

    const vLevelText = IMPORTANCE_LABEL[v_level] || '';
    const rLevelText = SATISFACTION_LABEL[r_level] || '当前状态：中等';

       const { ideal, reality, gap } = getGapNumbersFromDetails(report, key);

    // 确保 gap 一定是数字，避免 toFixed 报错
    const gapSafe = (typeof gap === 'number' && !isNaN(gap))
      ? gap
      : (typeof gapScore === 'number' && !isNaN(gapScore) ? gapScore : 0);

    const rank = rankMap[key] || null;
    const priority_level = computePriorityLevel(vScore, rank);

    items.push({
      key,
      label,
      isMain,
      matchLabel,
      status,
      statusLabel: STATUS_LABEL[status] || '结构位置未识别',
      statusDesc: STATUS_DESC[status] || '',
      vLevelText,
      rLevelText,
      ideal,
      reality,
      gap: gapSafe,
      gapScore,
      vScore,
      rScore,
      level,
      summary,
      description,
      cause,
      opportunityJoined,
      adviceJoined,
      priority_level
    });
  });

  // ========= 三大结构区块的分组 =========
  const priorityGaps = items.filter(it =>
    (it.priority_level === 'core' || it.priority_level === 'support') &&
    (it.status === 'growth_gap' || it.status === 'structural_gap') &&
    it.gap >= GAP_MAIN_THRESHOLD
  );

  const coreAlign = items.filter(it =>
    it.priority_level === 'core' &&
    it.gap <= GAP_SMALL_THRESHOLD
  );

  const nonCoreGaps = items.filter(it =>
    it.priority_level === 'flexible' &&
    it.gap >= GAP_NONCORE_THRESHOLD
  );

  let html = '';

  // ① 优先矛盾区
  html += `
    <section style="margin-bottom:18px;padding:16px;background:#fff7ed;
      border:1px solid #fed7aa;border-radius:10px;">
      <h3 style="margin:0 0 6px;font-size:15px;color:#9a3412;">
        🔥 优先矛盾（Priority Gaps）
      </h3>
      ${
        priorityGaps.length
          ? `<p style="margin:2px 0 6px;font-size:13px;color:#7c2d12;">
               这些是你<strong>既在意、差距又明显</strong>的领域，建议作为接下来 3〜6 个月的重点调整方向。
             </p>
             <ul style="margin:0;padding-left:18px;font-size:13px;color:#7c2d12;line-height:1.6;">
               ${priorityGaps.slice(0, 2).map(it => `
                 <li>
                   <strong>${DOMAIN_CN[it.key] || it.label}</strong>：${it.statusLabel}，差距约 ${it.gap.toFixed(1)} 分。
                 </li>
               `).join('')}
             </ul>`
          : `<p style="margin:2px 0 0;font-size:13px;color:#7c2d12;">
               目前没有特别突出的结构矛盾区，你可以按照自己的节奏稳步推进。
             </p>`
      }
    </section>
  `;

  // ② 已对齐的核心区
  html += `
    <section style="margin-bottom:18px;padding:16px;background:#ecfdf3;
      border:1px solid #bbf7d0;border-radius:10px;">
      <h3 style="margin:0 0 6px;font-size:15px;color:#166534;">
        🌿 已对齐的核心区（Core Alignment）
      </h3>
      ${
        coreAlign.length
          ? `<p style="margin:2px 0 6px;font-size:13px;color:#166534;">
               这些是你<strong>很在意且做得不错</strong>的领域，是你当前的稳定支撑，不必过度加码，只要持续守住即可。
             </p>
             <p style="margin:0;font-size:13px;color:#166534;">
               包括：${coreAlign.map(it => DOMAIN_CN[it.key] || it.label).join('、')}。
             </p>`
          : `<p style="margin:2px 0 0;font-size:13px;color:#166534;">
               目前你的核心领域里，还没有完全“理想与现实高度一致”的区域，可以视为正在建设期。
             </p>`
      }
    </section>
  `;

  // ③ 非核心差距区
  html += `
    <section style="margin-bottom:20px;padding:16px;background:#eff6ff;
      border:1px solid #bfdbfe;border-radius:10px;">
      <h3 style="margin:0 0 6px;font-size:15px;color:#1d4ed8;">
        🪁 非核心差距（Non-core Gaps）
      </h3>
      ${
        nonCoreGaps.length
          ? `<p style="margin:2px 0 6px;font-size:13px;color:#1d4ed8;">
               这些领域<strong>差距不小，但在你的优先级中属于可灵活调整的区域</strong>，适合作为“有余力时再改善”的选项，而不是当下的刚性任务。
             </p>
             <p style="margin:0;font-size:13px;color:#1d4ed8;">
               包括：${nonCoreGaps.map(it => DOMAIN_CN[it.key] || it.label).join('、')}。
             </p>`
          : `<p style="margin:2px 0 0;font-size:13px;color:#1d4ed8;">
               目前你的非核心领域中，没有特别需要担心的巨大差距，可以放心把资源优先集中在核心矛盾上。
             </p>`
      }
    </section>
  `;

  // ========= ④ 逐领域详细卡片（保留原有结构） =========
  items.forEach((it) => {
    const mainTag = it.isMain
      ? '<span style="margin-left:6px;font-size:11px;color:#b91c1c;background:#fee2e2;border-radius:999px;padding:2px 6px;">★ 当前最优先关注</span>'
      : '';

    html += `
      <div style="margin-bottom:20px;padding:18px;background:#fff;border-radius:10px;border:1px solid #eee;">
        <h4 style="margin:0 0 8px;color:#2c3e50;">
          ${it.label}
          ${mainTag}
          <span style="font-size:12px;color:#6b7280;margin-left:8px;">
            匹配度：${MATCH_LABEL[it.level] || '中等'} ｜ 结构位置：${it.statusLabel}
          </span>
        </h4>

               <p style="font-size:12px;color:#6b7280;line-height:1.6;margin:0 0 6px;">
          理想重视程度：<strong>${it.vLevelText}</strong>；
          当前现实状态：<strong>${it.rLevelText}</strong>。
          <br>
          （理想得分约为 ${it.ideal}，现实得分约为 ${it.reality}，差距约 ${
            (typeof it.gap === 'number' && !isNaN(it.gap)) ? it.gap.toFixed(1) : '—'
          }）
        </p>

        ${it.statusDesc
          ? `<p style="font-size:12px;color:#4b5563;line-height:1.6;margin:4px 0 6px;">
               <strong>结构解读：</strong>${it.statusDesc}
             </p>`
          : ''}

        ${it.summary
          ? `<p style="font-size:13px;color:#333;line-height:1.6;margin:4px 0 6px;">
               <strong>核心差距：</strong>${it.summary}
             </p>`
          : ''}

        ${it.description
          ? `<p style="font-size:13px;color:#555;line-height:1.6;margin:4px 0 6px;">${it.description}</p>`
          : ''}

        ${it.cause
          ? `<p style="font-size:13px;color:#555;line-height:1.6;margin:4px 0 6px;">
               <strong>可能的成因：</strong>${it.cause}
             </p>`
          : ''}

        ${it.opportunityJoined
          ? `<p style="font-size:13px;color:#555;line-height:1.6;margin:4px 0 6px;">
               <strong>潜在机会：</strong>${it.opportunityJoined}
             </p>`
          : ''}

        ${it.adviceJoined
          ? `<p style="font-size:13px;color:#555;line-height:1.6;margin:4px 0 0;">
               <strong>建议：</strong>${it.adviceJoined}
             </p>`
          : ''}
      </div>
    `;
  });

  container.innerHTML = html;
}
// 把 report 里的关键信息收集成一个简洁的 ctx，给综合页 / Summary 用
function normalizeSynthesisContext(report) {
  // 兼容新结构（大写）和旧结构（小写）
  const m = report.m_profile || report.M_profile || {};
  const t = report.t_profile || report.T_profile || {};
  const v = report.v_profile || report.V_profile || {};
  const d = report.delta_profile || report.Delta_profile || {};
  const p = report.patterns || report.Patterns || report.synthesis || {};

  // Harmony 百分比：优先用 Delta_profile.harmony
  const harmonyRaw =
    typeof d.harmony === 'number'
      ? d.harmony
      : (typeof report.synthesis?.harmony === 'number' ? report.synthesis.harmony : null);

  const harmonyPct = harmonyRaw != null ? Math.round(harmonyRaw * 100) : null;

  // 匹配度档位标签
  let levelLabel = '中等匹配度';
  if (harmonyPct != null) {
    if (harmonyPct >= 85) {
      levelLabel = '较高匹配度';
    } else if (harmonyPct < 70) {
      levelLabel = '需要重新规划的匹配度';
    }
  }

  // 领域 key → 中文
  const valueLabelMap = {
    Career: '事业',
    Wealth: '财富',
    Growth: '成长',
    Family: '家庭',
    Health: '健康',
    Spiritual: '心灵',
    Social: '社交'
  };

  // 关键关注领域：优先用 Delta_profile.max_gap_key
  const mainDomainKey =
    d.max_gap_key ||
    (report.synthesis && report.synthesis.max_gap_key) ||
    '';

  const mainDomainLabel =
    valueLabelMap[mainDomainKey] ||
    mainDomainKey ||
    '当前暂未识别出特别突出的领域';

  // M / T / V / Pattern / KASH 起点
  const topM =
    m.top_motive ||
    (report.synthesis && report.synthesis.top_motive) ||
    '';

  const mt_trait_key =
    t.mt_trait_key ||
    (report.synthesis && report.synthesis.mt_pattern && report.synthesis.mt_pattern.trait_key) ||
    '';

  const topValue =
    v.top_value ||
    (report.synthesis && report.synthesis.top_value) ||
    '';

  const pattern_type =
    p.pattern_type ||
    (report.synthesis && report.synthesis.pattern_type) ||
    '';

  const kash_start =
    p.kash_start ||
    (report.synthesis && report.synthesis.kash_start) ||
    '';

  return {
    harmonyPct,
    levelLabel,
    mainDomainLabel,
    topM,
    mt_trait_key,
    topValue,
    pattern_type,
    kash_start
  };
}

// =================================================================
// Summary 顶部总览（整体匹配度 / 模式类型 / 标签）
// =================================================================

export function renderSummaryText(report) {
  const container = getEl('summary-content');
  if (!container || !report) return;

  const ctx = normalizeSynthesisContext(report);
  const {
    harmonyPct,
    levelLabel,
    mainDomainLabel,
    topM,
    mt_trait_key,
    topValue,
    pattern_type,
    kash_start
  } = ctx;

  // 模式名称（优先 UI 名称）
  let patternLabel = '（尚未识别模式）';
  if (pattern_type && PATTERN_DISPLAY_NAME[pattern_type]) {
    patternLabel = PATTERN_DISPLAY_NAME[pattern_type];
  }

     // 兼容 mt_trait_key = "Ope_high" / "T_Ope_high" 两种写法
  const traitKeyForLabel = mt_trait_key && !mt_trait_key.startsWith('T_')
    ? `T_${mt_trait_key}`
    : mt_trait_key || '';

  const motiveLabel = SYNTHESIS_LABELS.motive?.[topM] || '';

  // 先尝试从字典里拿特质标签
  let traitLabel = SYNTHESIS_LABELS.trait?.[traitKeyForLabel] || '';

  // 如果字典里还是没有，就根据 mt_trait_key 直接兜底生成一条中文标签
  if (!traitLabel && mt_trait_key) {
    if (mt_trait_key.includes('Ope')) {
      traitLabel = '开放 / 探索';
    } else if (mt_trait_key.includes('Con')) {
      traitLabel = '高标准 / 执行';
    } else if (mt_trait_key.includes('Ext')) {
      traitLabel = '外向 / 推动';
    } else if (mt_trait_key.includes('Agr')) {
      traitLabel = '合作 / 支持';
    } else if (mt_trait_key.includes('Neu_high')) {
      traitLabel = '敏感 / 情绪体验';
    } else if (mt_trait_key.includes('Neu_low')) {
      traitLabel = '稳定 / 抗压';
    }
  }

  const valueLabel  = SYNTHESIS_LABELS.value?.[topValue] || '';
  const kashLabel   = SYNTHESIS_LABELS.kash?.[kash_start] || '';
  const tags = [motiveLabel, traitLabel, valueLabel, kashLabel].filter(Boolean);
  const comboLine = [motiveLabel, traitLabel, valueLabel].filter(Boolean).join(' × ');
  // ⭐ 一句话组合（M × T × V），这次无论如何都会渲染出来
  const briefLine = [motiveLabel, traitLabel, valueLabel]
    .filter(Boolean)
    .join(' × ');

  // ⭐ 调试输出，看浏览器里到底拿到什么
  console.log('[Summary briefLine]', {
    briefLine,
    topM,
    mt_trait_key,
    topValue,
    motiveLabel,
    traitLabel,
    valueLabel
  });

  const harmonyText = typeof harmonyPct === 'number' ? `${harmonyPct}%` : '—%';

  container.innerHTML = `
    <section style="padding:20px 22px; background:#f9fafb; border-radius:12px; border:1px solid #e5e7eb;">
      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="font-size:13px; color:#6b7280;">综合模式类型</div>
          <div style="font-size:18px; font-weight:600; color:#111827;">${patternLabel}</div>
          <div style="font-size:13px; color:#6b7280; margin-top:6px;">
            当前整体匹配度 <strong>${harmonyText}</strong>，属于「${levelLabel}」。
          </div>

          <div style="margin-top:6px; font-size:12px; color:#4b5563;">
            核心驱动力组合（M×T×V）：<strong>${briefLine || '（暂无识别）'}</strong>
          </div>
        </div>

        <div style="text-align:right;">
          <div style="font-size:12px; color:#6b7280;">关键关注领域</div>
          <div style="font-size:13px; font-weight:500; color:#111827;">${mainDomainLabel}</div>
        </div>
      </div>

      ${tags.length ? `
      <div style="margin-top:14px; display:flex; flex-wrap:wrap; gap:8px;">
        ${tags.map(txt => `
          <span style="padding:4px 8px; border-radius:999px; background:#ffffff; border:1px solid #e5e7eb; font-size:12px; color:#374151;">
            ${txt}
          </span>
        `).join('')}
      </div>` : ''}
       
            ${comboLine ? `
      <div style="margin-top:12px; font-size:13px; color:#4b5563;">
        核心驱动力组合 (M×T×V)：<strong>${comboLine}</strong>
      </div>` : ''}

      <div style="margin-top:16px; font-size:12px; color:#9ca3af; line-height:1.8;">
      <div style="margin-top:16px; font-size:12px; color:#9ca3af; line-height:1.8;">
        · 以上为系统综合 M / T / V / Δ 推演出的总览摘要<br>
        · 关键关注领域为当下最需要关注或调整的方向<br>
        · 详细内容请查看下方报告各页签
      </div>
    </section>
  `;
}
// =========================
// 综合总结页：我是谁 + 冰山 + KASH 起点
// =========================
export function renderSynthesisText(report) {
  
  // 先做一次结构完整性检查（只在控制台报错，不影响用户看到的报告）
  try {
    assertSynthesisInvariants(report);
  } catch (e) {
    console.warn('[MY GIFT] assertSynthesisInvariants 执行异常：', e);
  }

  // ==== 0. 取元素 ====
  const harmonyEl = document.getElementById('harmony-text');
  const contentEl = document.getElementById('synthesis-content');
  const kashEl    = document.getElementById('kash-entry-area');
  if (!contentEl) return;

  // ==== 1. 解构数据（兼容大小写） ====
  // ==== 1. 解构数据（统一使用新结构字段） ====
const mProfile = report.M_profile     || {};
const tProfile = report.T_profile     || {};
const vProfile = report.V_profile     || {};
const delta    = report.Delta_profile || {};
const patterns = report.Patterns      || {};
const syn      = report.synthesis     || {};
    // ==== 1.b 生成综合页上下文（给一句话总画像等模块用）====
  const synthCtx = normalizeSynthesisContext(report);
  const harmony = typeof syn.harmony === 'number'
    ? syn.harmony
    : (typeof delta.harmony === 'number' ? delta.harmony : null);

  const maxGapKey   = syn.max_gap_key   || delta.max_gap_key   || '';
  const topMotive   = syn.top_motive    || mProfile.top_motive || '-';
  const topValue    = syn.top_value     || vProfile.top_value  || '';
  const patternType = syn.pattern_type  || patterns.pattern_type || '';
  const kashStart   = syn.kash_start    || patterns.kash_start   || '';
  // ==== 1.a 更新「模式类型」标题行 ====
const modeLineEl = document.getElementById('synthesis-mode-line');
if (modeLineEl) {
  let modeLabel = '（尚未识别模式）';
  const icebergForMode = iceberg_patterns && iceberg_patterns[patternType];

  // ① 优先用 pattern_labels.js 的 UI 名称
  if (PATTERN_DISPLAY_NAME && PATTERN_DISPLAY_NAME[patternType]) {
    modeLabel = PATTERN_DISPLAY_NAME[patternType];
  }
  // ② 否则退回冰山模型里的标题
  else if (icebergForMode) {
    const title = icebergForMode.title || icebergForMode.name || '';
    if (title) {
      modeLabel = title;
    }
  }

  modeLineEl.innerHTML = `模式类型：<strong>${modeLabel}</strong>`;
}
   
  // ==== 2. 标签映射 ====
  const motiveLabelMap = {
  A: `${t('A')}（Autonomy）`,      // 自主导向
  C: `${t('C')}（Competence）`,    // 胜任导向
  R: `${t('R')}（Relatedness）`    // 关系导向
};

  const traitLabelMap = {
    T_Ope_high: '开放而好奇的探索者',
    T_Con_high: '尽责而稳健的执行者',
    T_Ext_high: '外向而有能量的推动者',
    T_Agr_high: '温和而重视合作的支持者',
    T_Neu_high: '情绪波动较敏感的体验者',
    T_Neu_low:  '情绪稳定、抗压较强的调节者'
  };

  const valueLabelMap = {
    Career:    '事业发展 / 职业成长',
    Wealth:    '财富与资源',
    Growth:    '个人成长与学习',
    Family:    '家庭与亲密关系',
    Health:    '身心健康与精力',
    Spiritual: '内在意义感与精神世界',
    Social:    '社交圈层与影响力'
  };

  const gapLabelMap = {
    Career:    '事业路径与角色定位',
    Wealth:    '财富结构与资源安排',
    Growth:    '学习节奏与升级路径',
    Family:    '家庭关系与支持系统',
    Health:    '健康节奏与恢复能力',
    Spiritual: '意义感与价值一致性',
    Social:    '人际连接与社交结构'
  };

  const M_label   = motiveLabelMap[topMotive] || '多元动力结构';
  const T_label   = traitLabelMap[tProfile.top_trait_key] || '复合型行为风格';
  const V_label   = valueLabelMap[topValue] || '多领域综合发展';
  const Gap_label = gapLabelMap[maxGapKey] || (valueLabelMap[maxGapKey] || '关键生活领域');
  const comboLine = `${M_label} × ${T_label} × ${V_label}`;
   // ==== 3. 和谐度总评 + 一句话整合画像 (M/T/V/Pattern) ====

  // 3.a Harmony 总结文案（builder）
  let harmonyCoreHtml = '';
  let harmonyCardHtml = '';

  try {
    if (synthCtx && typeof synthCtx.harmonyPct === 'number') {
      harmonyCoreHtml = buildHarmonySummary({
        harmonyPct: synthCtx.harmonyPct,
        levelLabel: synthCtx.levelLabel,
        mainDomainLabel: synthCtx.mainDomainLabel
      });
    }
  } catch (e) {
    console.warn('[MY GIFT] buildHarmonySummary 生成失败：', e, synthCtx);
  }

  // 3.b 一句话整合画像 (M/T/V/Pattern)
  let identitySectionHtml = '';

  try {
    const identityHtml = buildIdentitySummary(synthCtx);
    identitySectionHtml = `
      <section style="margin-top:16px;margin-bottom:12px;">
        <h3 style="font-size:16px;color:#1f2933;margin:0 0 6px;">
          你在系统里的整体画像：
        </h3>
        <p style="font-size:14px;color:#555;line-height:1.9;margin:0;">
          ${identityHtml}
        </p>
      </section>
    `;
  } catch (e) {
    console.warn('[MY GIFT] buildIdentitySummary 生成失败：', e, synthCtx);
  }
  // 3.c 综合页顶部的「核心驱动力组合」小节
  let synthBriefHtml = '';

  if (comboLine) {
    synthBriefHtml = `
      <section style="margin-top:12px;margin-bottom:8px;">
        <p style="font-size:13px;color:#4b5563;line-height:1.8;margin:0;">
          核心驱动力组合 (M×T×V)：<strong>${comboLine}</strong>
        </p>
      </section>
    `;
  }
  // 3.c Harmony 放到专门的卡片区域（有容器就放容器，没有就放到正文顶部）
  if (harmonyCoreHtml) {
    if (harmonyEl) {
      harmonyEl.innerHTML = `
        <div style="padding:16px 18px;background:#f8fafc;border-radius:8px;border:1px solid #e0e7ff;">
          ${harmonyCoreHtml}
        </div>
      `;
    } else {
      harmonyCardHtml = `
        <section style="margin-top:0;margin-bottom:16px;">
          <div style="padding:16px 18px;background:#f8fafc;border-radius:8px;border:1px solid #e0e7ff;">
            ${harmonyCoreHtml}
          </div>
        </section>
      `;
    }
  }
  // ==== 4. 你是谁：冰山 + 行为 + 人生方向 ====

  // ==== 4. 你是谁：冰山 + 行为 + 人生方向 ====
  

  // 4.1 冰山模式文案
  let icebergHtml = '';
  const iceberg = iceberg_patterns && iceberg_patterns[patternType];
  if (iceberg) {
    icebergHtml = `
      <section style="margin-top:20px;">
        <h3 style="font-size:16px;color:#1f2933;margin:0 0 8px;">一、你是谁：整合后的「冰山画像」</h3>
        <p style="font-size:14px;color:#555;line-height:1.9;margin:0 0 8px;">
          综合你的动机（M）、特质（T）与价值方向（V），你更接近：
          <strong>${iceberg.title || iceberg.name}</strong>。
        </p>
        <p style="font-size:14px;color:#555;line-height:1.9;margin:0;">
          在深层，你主要由「${iceberg.deep}」驱动；在日常行为层面，你常常呈现出「${iceberg.middle}」的风格；
          而在你对外宣称的价值与选择标准里，「${iceberg.surface}」会频繁出现。
        </p>
      </section>
    `;
  }

      // 4.2 行为风格 + 人格底盘（来自 M×T 行为模式）
  let mtHtml = '';

  // 先优先用逻辑层里算好的 Patterns.mt_pattern
  let mt = patterns.mt_pattern || null;

  // 如果当前报告还是老版本，没有 mt_pattern，就用 mt_key + M_T_patterns 查一次
  if (!mt) {
    const mtKeyFromPatterns =
      patterns.mt_key ||
      syn.mt_key ||
      syn.mtKey ||
      '';

    if (mtKeyFromPatterns && M_T_patterns) {
      mt = M_T_patterns[mtKeyFromPatterns] || null;
    }
  }

  // 只有在拿到了行为模式内容时，才渲染「二、你的行为风格与人格底盘」
  if (mt && (mt.behavior_signature || mt.task_behavior || mt.relation_behavior)) {
    mtHtml = `
      <section style="margin-top:20px;">
        <h3 style="font-size:16px;color:#1f2933;margin:0 0 8px;">二、你的行为风格与人格底盘</h3>
        <p style="font-size:14px;color:#555;line-height:1.9;margin:0 0 6px;">
          从「<strong>${M_label}</strong>」出发，你在现实中的整体表现，更接近这样一种组合：
          <strong>${mt.behavior_signature || ''}</strong>
        </p>
        ${mt.task_behavior ? `
          <p style="font-size:14px;color:#555;line-height:1.9;margin:0 0 4px;">
            在「做事方式」上，你倾向于：${mt.task_behavior}
          </p>` : ''
        }
        ${mt.relation_behavior ? `
          <p style="font-size:14px;color:#555;line-height:1.9;margin:0 0 4px;">
            在「人际与合作」上，你更常呈现：${mt.relation_behavior}
          </p>` : ''
        }
        ${mt.summary ? `
          <p style="font-size:14px;color:#555;line-height:1.9;margin:0;">
            用一句话来说：<strong>${mt.summary}</strong>
          </p>` : ''
        }
      </section>
    `;
  }

    // 4.3 人生方向：你在走向哪里？
  const vVec =
  report.v_profile?.vector ||
  report.V_profile?.vector ||
  [];
  const valueKeys = ['Career','Wealth','Growth','Family','Health','Spiritual','Social'];

  const currentSorted = valueKeys
    .map((k, idx) => ({ key: k, score: vVec[idx] || 0 }))
    .sort((a, b) => (b.score - a.score));

  const currentTopLabels = currentSorted
    .slice(0, 3)
    .filter(it => it.score > 0)
    .map(it => valueLabelMap[it.key] || it.key);

  let suggestedOrder = [];
  if (topMotive === 'A') {
    suggestedOrder = ['Growth','Career','Social','Family','Health','Wealth','Spiritual'];
  } else if (topMotive === 'C') {
    suggestedOrder = ['Career','Growth','Wealth','Health','Family','Social','Spiritual'];
  } else if (topMotive === 'R') {
    suggestedOrder = ['Family','Social','Health','Career','Growth','Spiritual','Wealth'];
  } else {
    suggestedOrder = ['Growth','Career','Family','Health','Social','Wealth','Spiritual'];
  }

  const suggestedLabels = suggestedOrder.map(k => valueLabelMap[k] || k);

  let focusGapLabel = Gap_label;
  if (!maxGapKey && currentSorted.length > 0) {
    focusGapLabel = valueLabelMap[currentSorted[0].key] || currentSorted[0].key;
  }

  const directionHtml = `
    <section style="margin-top:20px;">
      <h3 style="font-size:16px;color:#1f2933;margin:0 0 8px;">三、你的人生方向与优先顺序</h3>
           <p style="font-size:14px;color:#555;line-height:1.9;margin:0 0 6px;">
        如果只看你的天赋底盘（${comboLine}），一条对你来说相对舒服的人生排序大致会是：
        <strong>${suggestedLabels.join(' → ')}</strong>。
      </p>
      ${currentTopLabels.length > 0 ? `
        <p style="font-size:14px;color:#555;line-height:1.9;margin:0 0 6px;">
          而从你的回答来看，你目前最在意的重点主要集中在：
          <strong>${currentTopLabels.join('、')}</strong>。
          这说明你已经在很大程度上，<strong>顺着自己的本性在做选择</strong>，而不是完全被外部标准牵着走。
        </p>` : ''
      }
      <p style="font-size:14px;color:#555;line-height:1.9;margin:0;">
        接下来，如果你希望让人生更加轻松而有力量，可以特别留意：
        <strong>${focusGapLabel}</strong> 这个领域——只要在这里做出一些小调整，你的整体体验和未来选择空间都会明显变得不一样。
      </p>
    </section>
  `;
// ========== 4. 天赋推演价值排序（由 T→M→V 推出） ==========
let inferredVHtml = '';

try {
  // ★ 正确地从 report 里拿到 v_from_TM_byKey
  const vInfer =
    report.v_profile?.v_from_TM_byKey ||
    report.V_profile?.v_from_TM_byKey ||
    report.v_from_TM_byKey ||
    null;

  console.log('[SYN] v_from_TM_byKey =', vInfer);

  if (vInfer) {
    // 将 {Career:0.93,Wealth:0.57,...} 转成排序列表
    const ordered = Object.entries(vInfer)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${valueLabelMap[k] || k}（${(v * 10).toFixed(1)}）`)
      .join(' → ');

    inferredVHtml = `
      <section style="margin-top:20px;">
        <h3 style="font-size:16px;color:#1f2933;margin:0 0 8px;">四、你的天赋价值排序（由人格底盘推演）</h3>
        <p style="font-size:14px;color:#555;line-height:1.9;margin:0 0 6px;">
          根据你的性格（T）与核心动机（M），系统推演出的「更符合天赋、长期稳定」的价值排序为：
        </p>
        <p style="font-size:14px;color:#222;line-height:1.9;margin:0 0 6px;font-weight:bold;">
          ${ordered}
        </p>
        <p style="font-size:13px;color:#666;line-height:1.8;margin:0;">
          这个排序常用来判断：  
          <br>• 你的长期“舒适前进方向”  
          <br>• 当前真实选择（问卷 V）是否受到阶段性压力影响  
          <br>• 你是否正在为了现实而暂时压住内在节奏  
        </p>
      </section>
    `;
  }
} catch (e) {
  console.warn('推演价值排序渲染失败', e);
}
 // 4.4 高级行为画像：根据 pattern_type 查 ADVANCED_PATTERNS
let advancedHtml = '';
try {
  // 现在 patterns_advanced.js 默认导出的就是 { pattern_1: {...}, ... }
  const adv = advancedPatterns && advancedPatterns[patternType];

  if (adv && adv.title) {
    advancedHtml = `
      <section style="margin-top:24px;">
        <h3 style="font-size:16px;color:#1f2933;margin:0 0 8px;">五、你的行为画像（高级版）</h3>
        <p style="font-size:14px;color:#555;line-height:1.9;margin:0 0 6px;">
          <strong>${adv.title}</strong>
        </p>
        <p style="font-size:13px;color:#555;line-height:1.8;margin:4px 0;">
          <strong>心理机制：</strong>${adv.mechanism || ''}
        </p>
        <p style="font-size:13px;color:#555;line-height:1.8;margin:4px 0;">
          <strong>典型触发场景：</strong>${adv.trigger || ''}
        </p>
        <p style="font-size:13px;color:#555;line-height:1.8;margin:4px 0;">
          <strong>外在行为模式：</strong>${adv.behavior || ''}
        </p>
        <p style="font-size:13px;color:#555;line-height:1.8;margin:4px 0;">
          <strong>情绪链条：</strong>${adv.emotion_chain || ''}
        </p>
        <p style="font-size:13px;color:#555;line-height:1.8;margin:4px 0;">
          <strong>潜在风险：</strong>${adv.risks || ''}
        </p>
        <p style="font-size:13px;color:#555;line-height:1.8;margin:4px 0;">
          <strong>成长策略：</strong>${adv.growth_strategy || ''}
        </p>
        ${adv.summary ? `
        <p style="font-size:13px;color:#555;line-height:1.8;margin:4px 0;">
          <strong>一句话总结：</strong>${adv.summary}
        </p>` : ''}
      </section>
    `;
  }
} catch (e) {
  console.warn('高级行为画像渲染出错', e);
}
      // 4.5 职业方向建议：基于 topMotive × topValue
  let careerHtml = '';
  try {
    const getCareerAdvice =
      careerMapping.getCareerAdvice || ((m, v) => (careerMapping.CALENDAR_MAP?.[m]?.[v] || {}));
    const advice = getCareerAdvice(topMotive, topValue) || {};

    if (advice && advice.category) {
      const rolesText = Array.isArray(advice.roles)
        ? advice.roles.join('、')
        : (advice.roles || '');

      careerHtml = `
        <section style="margin-top:20px;">
          <h3 style="font-size:16px;color:#1f2933;margin:0 0 8px;">六、职业方向与角色建议</h3>
          <p style="font-size:14px;color:#555;line-height:1.9;margin:0 0 6px;">
            <strong>推荐职业大类：</strong>${advice.category}
          </p>
          ${rolesText ? `
          <p style="font-size:13px;color:#555;line-height:1.8;margin:4px 0;">
            <strong>典型适合的角色：</strong>${rolesText}
          </p>` : '' }
          ${advice.environment ? `
          <p style="font-size:13px;color:#555;line-height:1.8;margin:4px 0;">
            <strong>更适合的组织环境：</strong>${advice.environment}
          </p>` : '' }
          ${advice.avoid ? `
          <p style="font-size:13px;color:#555;line-height:1.8;margin:4px 0;">
            <strong>建议谨慎避免：</strong>${advice.avoid}
          </p>` : '' }
        </section>
      `;
    }
  } catch (e) {
    console.warn('职业方向建议渲染出错', e);
  }
    // ==== 5. 汇总写入综合内容区 ====
  contentEl.innerHTML = `
    ${harmonyCardHtml || ''}
    ${synthBriefHtml || ''}
    ${identitySectionHtml || ''}
    ${icebergHtml}
    ${mtHtml}
    ${directionHtml}
    ${inferredVHtml}
    ${advancedHtml}
    ${careerHtml}
  `;

  // ==== 6. 底部：KASH 起点卡片 ====
  const kashInfo = (kash_entry_narratives && kash_entry_narratives[kashStart]) || null;
    const kashStartLabel =
    (SYNTHESIS_LABELS.kash && SYNTHESIS_LABELS.kash[kashStart]) ||
    (kashInfo ? kashInfo.title : '') ||
    '';

  const kashStarterHtml = buildKashStarter({
    kash_start_label: kashStartLabel,
    horizon: '3〜6 个月'
  });
    if (kashInfo && kashEl) {
    kashEl.innerHTML = `
      <section style="margin-top:24px;">
       <h3 style="font-size:16px;color:#1f2933;margin:0 0 8px;">七、从哪里开始升级最省力？（KASH 起点）</h3>
        <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.8;">
          ${kashStarterHtml}
        </div>
        <div style="padding:16px 18px;border-radius:10px;background:#fff7ec;border:1px solid #ffe0b8;">
          <div style="font-size:14px;color:#8a4b08;font-weight:600;margin-bottom:6px;">
            建议起点：${kashInfo.title}
          </div>
          <p style="font-size:13px;color:#8a4b08;line-height:1.8;margin:0 0 4px;">
            为什么从这里开始：${kashInfo.why}
          </p>
          <p style="font-size:13px;color:#b26b1a;line-height:1.8;margin:0;">
            如果长期忽略这一块，最常见的风险是：${kashInfo.risk}
          </p>
        </div>
      </section>
    `;
  } else if (kashEl) {
    kashEl.innerHTML = '';
  }
}