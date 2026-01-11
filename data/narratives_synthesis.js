// /data/narratives_synthesis.js
// 综合总结页：标签与一句话总评 / KASH 起点文案构建器

import { t } from './dictionary.js';

/**
 * 内部小工具：从 topM 之类的 key 拿到统一的中文标签
 * （动机 / 特质 / 价值 / KASH）
 */

// 动机标签（A / C / R）
function motiveLabelFromKey(key) {
  if (!key) return '多元动力结构';
  // 优先走字典
  const label = t(key);
  if (label && label !== key) return label;

  // 若字典里没配置，对应一个明确兜底
  const fallback = {
    A: '自主导向',
    C: '胜任导向',
    R: '关系导向'
  };
  return fallback[key] || '多元动力结构';
}

// 特质标签（T_Ope_high 等）
function traitLabelFromKey(key) {
  if (!key) return '复合型特质组合';
  // 兼容 "T_Ope_high" → "Ope_high"
  const clean = key.replace(/^T_/, '');
  const label = t(clean);
  if (label && label !== clean) return label;
  return '复合型特质组合';
}

// 价值标签（Career / Wealth / ...）
function valueLabelFromKey(key) {
  if (!key) return '多领域综合发展';
  const label = t(key);
  if (label && label !== key) return label;
  return '多领域综合发展';
}

// KASH 起点标签（S / A_attitude / K / H）
// 注意：这里的 A 是态度，key 是 "A_attitude"
function kashLabelFromKey(key) {
  if (!key) return '起点未指定';
  const mapping = {
    S: 'S · Skill / 技能与方法',
    H: 'H · Habit / 习惯与节奏',
    A_attitude: 'A · Attitude / 态度与情绪',
    K: 'K · Knowledge / 知识与认知框架'
  };
  return mapping[key] || '起点未指定';
}

/**
 * 统一导出的标签表：
 * - motive / value 现在备用
 * - kash 是综合页当前实际使用的部分
 */
export const SYNTHESIS_LABELS = {
  motive: {
    A: motiveLabelFromKey('A'),
    C: motiveLabelFromKey('C'),
    R: motiveLabelFromKey('R')
  },
  value: {
    Career: valueLabelFromKey('Career'),
    Wealth: valueLabelFromKey('Wealth'),
    Growth: valueLabelFromKey('Growth'),
    Family: valueLabelFromKey('Family'),
    Health: valueLabelFromKey('Health'),
    Spiritual: valueLabelFromKey('Spiritual'),
    Social: valueLabelFromKey('Social')
  },
  // 目前综合页使用的是 SYNTHESIS_LABELS.kash[kashStart]
  kash: {
    S: kashLabelFromKey('S'),
    H: kashLabelFromKey('H'),
    A_attitude: kashLabelFromKey('A_attitude'),
    K: kashLabelFromKey('K')
  }
};

/**
 * buildHarmonySummary
 * 输入：{ harmonyPct, levelLabel, mainDomainLabel }
 * 输出：一段 HTML 字符串，用于综合页顶部“整体匹配度卡片”
 */
export function buildHarmonySummary({ harmonyPct, levelLabel, mainDomainLabel }) {
  // 没有 harmonyPct 的时候给一个明确的说明，避免空白
  if (typeof harmonyPct !== 'number') {
    return `
      <p style="font-size:14px;line-height:1.8;margin:0;">
        系统暂未计算出整体匹配度，因此这里暂时只展示结构化明细。
      </p>
    `;
  }

  const pctText = `${harmonyPct}%`;
  const domainText = mainDomainLabel || '关键生活领域';

  let intro = '';
  let detail = '';

  if (harmonyPct >= 85) {
    intro = `你的整体匹配度为 <strong>${pctText}</strong>，属于<strong>高度一致</strong>的结构。`;
    detail =
      `理想与现实之间的节奏相对统一，说明你已经在用较稳定的方式，处理各个生活领域的选择。` +
      `当前可以把更多注意力放在“提升质量”和“拉长时间轴”上，而不是大幅度地重排人生结构。`;
  } else if (harmonyPct >= 70) {
    intro = `你的整体匹配度为 <strong>${pctText}</strong>，处在<strong>部分一致、部分分散</strong>的状态。`;
    detail =
      `这通常代表：一些领域已经运行顺畅，另一些领域则需要重新调整节奏。` +
      `目前最值得关注的切入点是：<strong>${domainText}</strong>，这里的结构一旦理顺，整体体验会有明显提升。`;
  } else {
    intro = `你的整体匹配度为 <strong>${pctText}</strong>，目前存在<strong>比较明显的结构性差距</strong>。`;
    detail =
      `这并不是失败，而是一个需要重新设计人生系统的阶段。` +
      `建议以<strong>${domainText}</strong>为优先调整方向，一步步把“理想的想要”与“现实的安排”重新对齐。`;
  }

  return `
    <p style="font-size:14px;line-height:1.8;margin:0 0 4px;">
      ${intro}
    </p>
    <p style="font-size:13px;line-height:1.8;margin:0;">
      ${detail}
    </p>
  `;
}

/**
 * buildIdentitySummary
 * 输入：normalizeSynthesisContext(report) 的返回值
 * 结构：
 *   { harmonyPct, levelLabel, mainDomainLabel, topM, mt_trait_key, topValue, pattern_type, kash_start }
 * 输出：一段纯文本（不含 HTML 标签），用于“一句话整体画像”
 */
export function buildIdentitySummary(ctx) {
  const {
    harmonyPct,
    levelLabel,
    mainDomainLabel,
    topM,
    mt_trait_key,
    topValue
  } = ctx || {};

  const motiveLabel = motiveLabelFromKey(topM);
  const traitLabel = traitLabelFromKey(mt_trait_key);
  const valueLabel = valueLabelFromKey(topValue);

  const harmonyText =
    typeof harmonyPct === 'number'
      ? `整体匹配度约为 ${harmonyPct}%，属于「${levelLabel}」。`
      : `整体匹配度尚未完全计算完成，但关键特征已经可以看得比较清楚。`;

  const mainDomainText = mainDomainLabel || '当前最关键的生活领域';

  // 一句话：动力底盘 + 行为特质 + 价值方向 + 当前焦点领域
  return (
    harmonyText +
    ` 从底层动力来看，你更接近「${motiveLabel}」；在日常行为风格上，` +
    `表现为「${traitLabel}」；长期价值排序更偏向「${valueLabel}」。` +
    ` 目前对你影响最大、值得优先梳理的，是「${mainDomainText}」这一块。`
  );
}

/**
 * buildKashStarter
 * 输入：{ kash_start_label, horizon }
 *   - kash_start_label：已经在外部根据 SYNTHESIS_LABELS.kash 或 narrative title 算好
 *   - horizon：时间范围文本，例如 "3〜6 个月"
 * 输出：一段 HTML 字符串，作为 KASH 起点卡片顶部的引导说明
 */
export function buildKashStarter({ kash_start_label, horizon }) {
  const label = kash_start_label || 'KASH 结构中的某一块';
  const timeText = horizon || '接下来的一个阶段';

  return `
    <p style="margin:0 0 4px;line-height:1.8;">
      对于你现在的人生状态，系统给出的起点是：<strong>${label}</strong>。
    </p>
    <p style="margin:0;line-height:1.8;font-size:13px;">
      这代表，在保持整体结构基本稳定的前提下，先从这一块做出清晰、可执行的小调整，
      是在 ${timeText} 内最容易看到变化、同时又不会给自己增加过多负担的路径。
    </p>
  `;
}