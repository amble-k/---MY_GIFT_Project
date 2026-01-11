/**
 * /core/logic_core.js
 * Version: v3.2.2
 * 职责：接收原始答案 → 计算 T/M/V/R/Delta → 生成 KASH_PROFILE
 */

// 旧版问卷（当前正式计算仍用这一套）
import M_QUESTIONS from '../data/questions_m.js';
import T_QUESTIONS from '../data/questions_t.js';
import V_QUESTIONS from '../data/questions_v.js';
import R_QUESTIONS from '../data/questions_r.js';
import { JOB_MODELS_V0_1 } from '/data/job_models_v0_1.js';

// v5 问卷（只用于记录 & 未来升级用）
import M_QUESTIONS_V5 from '../data/questions_m_v5.js';
import T_QUESTIONS_V5 from '../data/questions_t_v5.js';
import V_QUESTIONS_V5 from '../data/questions_v_v5.js';
import R_QUESTIONS_V5 from '../data/questions_r_v5.js';

import { M_T_patterns, Delta_rules } from '../data/rules.js';
import { W_TM, W_MV } from '../data/mapping_t2v.js';

// =======================
// 问卷版本元数据（仅结构用）
// =======================
export const QUESTIONNAIRE_VERSION = {
  m: '4.1.0',   // 动机 M 问卷当前版本
  t: '4.1.0',   // 特质 T 问卷当前版本
  v: '4.1.0',   // 价值 V 问卷当前版本
  r: '4.1.0'    // 现实 R 问卷当前版本
};

// =========================================
// T → M → V 映射辅助函数
// =========================================

// 由 Big Five 向量 T 推导 SDT 动机（A / R / C）
// 输入：tVector = [Ope, Con, Ext, Agr, Neu]，都为 0~1 之间
function inferMFromT(tVector = []) {
  const traitKeys = ['T_Ope', 'T_Con', 'T_Ext', 'T_Agr', 'T_Neu'];
  const motives = ['A', 'R', 'C'];
  const mRaw = { A: 0, R: 0, C: 0 };

  traitKeys.forEach((tKey, idx) => {
    const score = tVector[idx] || 0;
    const weights = W_TM[tKey] || {};
    motives.forEach((mKey) => {
      const w = weights[mKey] || 0;
      mRaw[mKey] += score * w;
    });
  });

  // 简单归一化到 0~1：除以最大值
  let maxVal = Math.max(mRaw.A, mRaw.R, mRaw.C);
  if (!isFinite(maxVal) || maxVal <= 0) {
    maxVal = 1;
  }

  return {
    A: mRaw.A / maxVal,
    R: mRaw.R / maxVal,
    C: mRaw.C / maxVal
  };
}

// 根据 推导出的 M → 计算 7 维 V 向量
function computeVFromTM(tVector = []) {
  const inferredM = inferMFromT(tVector);
  const valueKeys = ['Career', 'Wealth', 'Growth', 'Family', 'Health', 'Spiritual', 'Social'];

  // 初始化
  const vRaw = {};
  valueKeys.forEach((k) => { vRaw[k] = 0; });

  // M → V 累加
  Object.entries(inferredM).forEach(([mKey, mScore]) => {
    const row = W_MV[mKey] || {};
    valueKeys.forEach((vKey) => {
      const w = row[vKey] || 0;
      vRaw[vKey] += mScore * w;
    });
  });

  // 转成数组并归一化 0~1
  const arr = valueKeys.map((k) => vRaw[k]);
  let maxVal = Math.max(...arr);
  if (!isFinite(maxVal) || maxVal <= 0) {
    maxVal = 1;
  }
  const normalized = arr.map((v) => v / maxVal);

  // 同时返回按 key 的形式，方便调试
  const byKey = valueKeys.reduce((acc, k, idx) => {
    acc[k] = normalized[idx];
    return acc;
  }, {});

  return {
    vector: normalized,   // [Career, Wealth, Growth, Family, Health, Spiritual, Social]
    byKey,
    inferredM            // {A,R,C}
  };
}

// =========================
// 1. 工具函数
// =========================

function safeNumber(v, fallback = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

// delta → high/mid/low 分档（目前主要给规则表用）
function classifyGapLevel(delta) {
  if (delta >= 0.6) return 'high';
  if (delta >= 0.3) return 'mid';
  return 'low';
}

// 从题目对象上读取维度名并规范化（T_Ope → Ope；OPE → Ope）
function normalizeDim(rawDim, fallback) {
  if (!rawDim) return fallback;
  let d = String(rawDim);
  d = d.replace(/^T_/, '');   // T_Ope → Ope
  d = d.replace(/^M_/, '');   // M_A → A（防御性）
  d = d.trim();
  // 首字母大写，其余小写
  return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
}

// =========================
// 2. 维度计算：M (SDT)
// =========================

function computeM(answers) {
  const raw = { A: 0, R: 0, C: 0 };
  const counts = { A: 0, R: 0, C: 0 };
  const maxScore = 5;
  const minScore = 1;

  (answers || []).forEach((val, idx) => {
    const q = M_QUESTIONS[idx];
    if (!q) return;

    const vRaw = safeNumber(val, 0);
    const v = q.reverse ? (maxScore + minScore - vRaw) : vRaw;

    const dim = normalizeDim(q.dimension, '').replace('M_', '');
    if (dim === 'A') {
      raw.A += v; counts.A++;
    } else if (dim === 'R') {
      raw.R += v; counts.R++;
    } else if (dim === 'C') {
      raw.C += v; counts.C++;
    }
  });

  const norm = {
    A: counts.A ? Math.min(1, raw.A / (counts.A * maxScore)) : 0,
    R: counts.R ? Math.min(1, raw.R / (counts.R * maxScore)) : 0,
    C: counts.C ? Math.min(1, raw.C / (counts.C * maxScore)) : 0
  };

  const priorities = { A: 3, C: 2, R: 1 };
  const mList = [
    { k: 'A', v: norm.A, p: priorities.A },
    { k: 'R', v: norm.R, p: priorities.R },
    { k: 'C', v: norm.C, p: priorities.C }
  ];
  mList.sort((a, b) => b.v !== a.v ? b.v - a.v : b.p - a.p);

  const patternKey = `${mList[0].k}>${mList[1].k}>${mList[2].k}`;

  return {
    scores: norm,
    top_motive: mList[0].k,
    m_pattern: patternKey,
    m_autonomy:    { normalized: norm.A },
    m_relatedness: { normalized: norm.R },
    m_competence:  { normalized: norm.C }
  };
}

// =========================
// 3. 维度计算：T (Big Five)
// =========================

function computeT(answers) {
  const traits = ['Ope', 'Con', 'Ext', 'Agr', 'Neu'];
  const raw = { Ope: 0, Con: 0, Ext: 0, Agr: 0, Neu: 0 };
  const counts = { Ope: 0, Con: 0, Ext: 0, Agr: 0, Neu: 0 };
  const maxScore = 5;
  const minScore = 1;

  (answers || []).forEach((val, idx) => {
    const q = T_QUESTIONS[idx];
    if (!q) return;

    const vRaw = safeNumber(val, 0);
    const v = q.reverse ? (maxScore + minScore - vRaw) : vRaw;

    const dim = normalizeDim(q.dimension, null); // 期望: Ope/Con/Ext/Agr/Neu 或 T_Ope ...
    if (!dim || !raw.hasOwnProperty(dim)) return;

    raw[dim] += v;
    counts[dim]++;
  });

  // 如果题库没配好维度，就 fallback 回旧逻辑
  const allZero = traits.every(k => counts[k] === 0);
  let vector;
  if (allZero) {
    // 旧逻辑：按题目顺序每5个一组
    const tmpRaw = [0, 0, 0, 0, 0];
    (answers || []).forEach((val, i) => {
      const dim = Math.floor(i / 5);
      if (dim < 5) tmpRaw[dim] += safeNumber(val, 0);
    });
    vector = tmpRaw.map(v => Math.min(1, v / 25));
  } else {
    vector = traits.map(k => {
      return counts[k] ? Math.min(1, raw[k] / (counts[k] * maxScore)) : 0;
    });
  }

  // 找最高维度
  let maxIdx = 0;
  vector.forEach((v, i) => { if (v > vector[maxIdx]) maxIdx = i; });
  const topCode = traits[maxIdx];         // Ope / Con / Ext / Agr / Neu
  const dimKeys = ['T_Ope', 'T_Con', 'T_Ext', 'T_Agr', 'T_Neu'];
  const top1Key = dimKeys[maxIdx];

  // 高低判断：Neu 低分是优势，其余先只用 high
  let suffix = 'high';
  if (topCode === 'Neu') {
    suffix = vector[maxIdx] < 0.5 ? 'low' : 'high';
  }

  const topTraitKey = `${top1Key}_${suffix}`;

  // M×T 行为模式映射用这个
  let mtSuffix = 'high';
  if (topCode === 'Neu') {
    mtSuffix = vector[maxIdx] < 0.5 ? 'low' : 'high';
  }
  const mtTraitKey = `${topCode}_${mtSuffix}`; // Ope_high / Neu_low 等

  return {
    vector,
    top_trait_key: topTraitKey,
    mt_trait_key: mtTraitKey
  };
}

// =========================
// 4. V / R / Gap 计算
// =========================

// 7 大领域的固定顺序（V/R 向量的顺序必须和前端一致）
const VALUE_KEYS = ['Career', 'Wealth', 'Growth', 'Family', 'Health', 'Spiritual', 'Social'];

// 分档函数：把 0~1 的分数切成 high / mid / low（目前仅备用）
function levelOf(x) {
  if (x >= 0.66) return 'high';
  if (x >= 0.33) return 'mid';
  return 'low';
}

function computeV(answers) {
  const raw = Object.fromEntries(VALUE_KEYS.map(k => [k, 0]));
  const counts = Object.fromEntries(VALUE_KEYS.map(k => [k, 0]));
  const maxScore = 5;
  const minScore = 1;

  (answers || []).forEach((val, idx) => {
    const q = V_QUESTIONS[idx];
    if (!q) return;
    const vRaw = safeNumber(val, 0);
    const v = q.reverse ? (maxScore + minScore - vRaw) : vRaw;

    const dim = normalizeDim(q.dimension, VALUE_KEYS[idx] || null); // 比如 Career / Wealth ...
    if (!dim || !raw.hasOwnProperty(dim)) return;

    raw[dim] += v;
    counts[dim]++;
  });

  const allZero = VALUE_KEYS.every(k => counts[k] === 0);
  let vec;
  if (allZero) {
    // fallback: 直接用答案顺序
    vec = VALUE_KEYS.map((_, i) => (safeNumber(answers?.[i], 0) / 5));
  } else {
    vec = VALUE_KEYS.map(k =>
      counts[k] ? Math.min(1, raw[k] / (counts[k] * maxScore)) : 0
    );
  }

  let maxIndex = 0;
  vec.forEach((val, i) => { if (val > vec[maxIndex]) maxIndex = i; });

  return { vector: vec, max_key: VALUE_KEYS[maxIndex] };
}

function computeR(answers) {
  const raw = Object.fromEntries(VALUE_KEYS.map(k => [k, 0]));
  const counts = Object.fromEntries(VALUE_KEYS.map(k => [k, 0]));
  const maxScore = 5;
  const minScore = 1;

  (answers || []).forEach((val, idx) => {
    const q = R_QUESTIONS[idx];
    if (!q) return;
    const vRaw = safeNumber(val, 0);
    const v = q.reverse ? (maxScore + minScore - vRaw) : vRaw;

    const dim = normalizeDim(q.dimension, VALUE_KEYS[idx] || null);
    if (!dim || !raw.hasOwnProperty(dim)) return;

    raw[dim] += v;
    counts[dim]++;
  });

  const allZero = VALUE_KEYS.every(k => counts[k] === 0);
  let vec;
  if (allZero) {
    vec = VALUE_KEYS.map((_, i) => (safeNumber(answers?.[i], 0) / 5));
  } else {
    vec = VALUE_KEYS.map(k =>
      counts[k] ? Math.min(1, raw[k] / (counts[k] * maxScore)) : 0
    );
  }

  return { vector: vec };
}

// Δ 计算：按 V 加权的匹配度 + 关注领域
function computeGap(vVec = [], rVec = []) {
  const deltaVector = [];
  const attentionScores = [];  // 用来选「最值得关注」的领域
  let weightSum = 0;
  let matchWeightedSum = 0;

  VALUE_KEYS.forEach((key, idx) => {
    const v = typeof vVec[idx] === 'number' ? vVec[idx] : 0;
    const r = typeof rVec[idx] === 'number' ? rVec[idx] : 0;
    const gap = Math.abs(v - r);          // 原始差距 0~1

    // 重要性权重：V 越高，这个领域对整体匹配度影响越大
    // v=0 → 0.3 ; v=1 → 1.0
    const weight = 0.3 + 0.7 * v;

    // 匹配度核心分：差距越小，match_core 越高
    const matchCore = 1 - gap;

    deltaVector.push(gap);
    attentionScores.push(weight * gap);   // 重要 × 差距，用来挑「主战场」

    weightSum += weight;
    matchWeightedSum += weight * matchCore;
  });

  // 整体和谐度：0~1
  const harmony = weightSum > 0 ? matchWeightedSum / weightSum : 0;

  // 找出「最值得关注」的领域（重要 × 差距 最大）
  let maxIdx = 0;
  let maxScore = -Infinity;
  for (let i = 0; i < attentionScores.length; i++) {
    if (attentionScores[i] > maxScore) {
      maxScore = attentionScores[i];
      maxIdx = i;
    }
  }

  return {
    index: harmony,                     // 用来填 Delta_profile.harmony
    max_gap_key: VALUE_KEYS[maxIdx],    // 用来填 Delta_profile.max_gap_key
    delta_vector: deltaVector           // 保持原来的结构（0~1 差距）
  };
}

// V 与 R 的详细差距拆解：为每个领域写入理想分、现实分、绝对差距 + 主观优先级
// vVec / rVec 是 0~1 的数组向量；vRank 是问卷里未来可能用到的排序(如 ["Growth","Career",...])
function buildDeltaDetails(vVec = [], rVec = [], vRank = []) {
  const details = {};

  VALUE_KEYS.forEach((key, idx) => {
    // 0~1 的原始分（来自向量）
    const ideal01   = Array.isArray(vVec) && typeof vVec[idx] === 'number' ? vVec[idx] : 0;
    const reality01 = Array.isArray(rVec) && typeof rVec[idx] === 'number' ? rVec[idx] : 0;

    // 换算成 0~10 分并保留 1 位小数，方便报告直接展示
    const ideal   = Number((ideal01   * 10).toFixed(1));
    const reality = Number((reality01 * 10).toFixed(1));
    const gap     = Number((Math.abs(ideal01 - reality01) * 10).toFixed(1));

    // 差距等级：low / mid / high（给 Delta_rules & 文案用）
    let level = 'mid';
    if (gap <= 1.0) {
      level = 'low';      // 差距小 → 匹配度较高
    } else if (gap >= 3.0) {
      level = 'high';     // 差距大 → 匹配度较低
    }

    // 主观优先级（根据 v_rank 顺序，1 = 最优先；没排到则为 null）
    let priority = null;
    if (Array.isArray(vRank)) {
      const pos = vRank.indexOf(key);
      if (pos !== -1) priority = pos + 1;
    }

    details[key] = {
      // ==== 给 renderGapText 用的三个主字段 ====
      ideal_avg:   ideal,    // 理想值（0~10）
      reality_avg: reality,  // 现实值（0~10）
      gap_value:   gap,      // 差距（0~10）

      // ==== 差距等级（兼容旧字段名）====
      level,
      gap_level: level,

      // ==== 额外：理想中的主观优先级（1=最高）====
      priority
    };
  });

  return details;
}

// =========================
// 5. Pattern & KASH 判定
// =========================

/**
 * 根据 M / V / Gap 等信息判定行为模式：
 * 参数是一个对象，包含 topM / gapIndex / topV / mScores
 * 返回 { pattern, rule_id, reason }
 */
const PATTERN_RULES = [
  // 1) 高张力优先：整体一致度低 → pattern_12（重构期）
  {
    id: 'P12_high_tension',
    pattern: 'pattern_12',
    when: ({ gapIndex }) =>
      typeof gapIndex === 'number' && gapIndex < 0.6,
    reason:
      '当前理想与现实之间存在显著张力（整体一致度低于 60%），更适合先做结构梳理与风险管控，再谈加速成长。'
  },

  // 2) 自主 × 成长 → pattern_4
  {
    id: 'P4_A_growth',
    pattern: 'pattern_4',
    when: ({ topM, topV }) =>
      topM === 'A' && topV === 'Growth',
    reason:
      '你的核心动机以自主（A）为主，同时最重视成长（Growth），典型表现为“自己做主去升级”的成长驱动模式。'
  },

  // 3) 能力/成就 × 事业 → pattern_6
  {
    id: 'P6_C_career',
    pattern: 'pattern_6',
    when: ({ topM, topV }) =>
      topM === 'C' && topV === 'Career',
    reason:
      '你的核心动机以能力与成效（C）为主，同时当前最关注事业发展（Career），更符合“成就推进型”工作模式。'
  },

  // 4) 能力/成就 × 财富 → pattern_7
  {
    id: 'P7_C_wealth',
    pattern: 'pattern_7',
    when: ({ topM, topV }) =>
      topM === 'C' && topV === 'Wealth',
    reason:
      '你以能力与成果感（C）驱动，同时高度关注财富（Wealth），常以“成果变现”来衡量自己是否走在对的路上。'
  },

  // 5) 关系 × 家庭 → pattern_8
  {
    id: 'P8_R_family',
    pattern: 'pattern_8',
    when: ({ topM, topV }) =>
      topM === 'R' && topV === 'Family',
    reason:
      '你的核心动机以内在关系与连接（R）为主，同时最在意家庭（Family），属于典型“家庭稳定/支持优先”的关系型模式。'
  },

  // 6) 关系 × 社交 → pattern_9
  {
    id: 'P9_R_social',
    pattern: 'pattern_9',
    when: ({ topM, topV }) =>
      topM === 'R' && topV === 'Social',
    reason:
      '你以内在关系与连接（R）驱动，又重视社交/圈层（Social），更偏向“通过关系网络发挥影响力”的模式。'
  },

  // 7) 自主默认：未命中特定价值，但以 A 为核心 → pattern_1
  {
    id: 'P1_A_default',
    pattern: 'pattern_1',
    when: ({ topM }) => topM === 'A',
    reason:
      '你的核心动机以自主（A）为主，但当前价值焦点比较分散，整体呈现为“以自我选择为主轴”的通用自主型模式。'
  },

  // 8) 能力/成就默认：以 C 为核心 → pattern_3
  {
    id: 'P3_C_default',
    pattern: 'pattern_3',
    when: ({ topM }) => topM === 'C',
    reason:
      '你的核心动机以能力与成效（C）为主，但价值焦点不只局限在事业/财富，整体呈现为“为更好成果持续优化”的成就型模式。'
  },

  // 9) 关系默认：以 R 为核心 → pattern_2
  {
    id: 'P2_R_default',
    pattern: 'pattern_2',
    when: ({ topM }) => topM === 'R',
    reason:
      '你的核心动机以内在关系与支持感（R）为主，但价值焦点不只在家庭/社交，整体呈现为“以关系质量作为重要参照”的关系型模式。'
  }
];

function determinePattern(ctx) {
  for (const rule of PATTERN_RULES) {
    try {
      if (rule.when(ctx)) {
        return {
          pattern: rule.pattern,
          rule_id: rule.id,
          reason: rule.reason
        };
      }
    } catch (e) {
      continue;
    }
  }

  // 兜底：根据 topM 给出默认模式
  const topM = ctx && ctx.topM;

  if (topM === 'A') {
    return {
      pattern: 'pattern_1',
      rule_id: 'P1_A_default_fallback',
      reason:
        '你的核心动机以自主（A）为主，虽未命中特定价值组合规则，但整体更接近“以自我选择为主轴”的通用自主型模式。'
    };
  }

  if (topM === 'C') {
    return {
      pattern: 'pattern_3',
      rule_id: 'P3_C_default_fallback',
      reason:
        '你的核心动机以能力与成效（C）为主，虽未命中特定价值组合规则，但整体呈现为“为更好成果持续优化”的成就型模式。'
    };
  }

  if (topM === 'R') {
    return {
      pattern: 'pattern_2',
      rule_id: 'P2_R_default_fallback',
      reason:
        '你的核心动机以内在关系与支持感（R）为主，虽未命中特定价值组合规则，但整体呈现为“以关系质量作为重要参照”的关系型模式。'
    };
  }

  // 如果连 topM 都缺失，才使用真正的通用兜底规则
  return {
    pattern: 'pattern_1',
    rule_id: 'P0_default',
    reason:
      '当前特征数据尚不完整，先以通用成长型模式作为临时叙事基线。'
  };
}

// =========================
// 6. KASH 判定
// =========================

const KASH_RULES = [
  // 1) 高一致度（harmony >= 0.8）：大方向对，优先做知识/技能精修
  {
    id: 'K1_high_harmony_achieve_K',
    start: 'K',
    when: ({ gapIndex, pattern }) => {
      const harmony = typeof gapIndex === 'number' ? gapIndex : 0;
      const achievePatterns = ['pattern_3', 'pattern_6', 'pattern_7'];

      return harmony >= 0.8 && achievePatterns.includes(pattern);
    }
  },
  {
    id: 'K2_high_harmony_skill_S',
    start: 'S',
    when: ({ gapIndex, pattern }) => {
      const harmony = typeof gapIndex === 'number' ? gapIndex : 0;
      const achievePatterns = ['pattern_3', 'pattern_6', 'pattern_7'];

      // 高一致度，但不是典型成就/结构型，就从“技能细节”入手
      return harmony >= 0.8 && !achievePatterns.includes(pattern);
    }
  },

  // 2) 中等一致度（0.5 <= harmony < 0.8）
  // 关系型模式 → 从 Attitude / 关系态度入手
  {
    id: 'K3_mid_harmony_relation_A',
    start: 'A',
    when: ({ gapIndex, pattern }) => {
      const harmony = typeof gapIndex === 'number' ? gapIndex : 0;
      const relationPatterns = ['pattern_2', 'pattern_8', 'pattern_9', 'pattern_10', 'pattern_11'];

      return harmony >= 0.5 && harmony < 0.8 && relationPatterns.includes(pattern);
    }
  },
  // 非关系型 → 从 Habit / 系统入手
  {
    id: 'K4_mid_harmony_habit_H',
    start: 'H',
    when: ({ gapIndex, pattern }) => {
      const harmony = typeof gapIndex === 'number' ? gapIndex : 0;
      const relationPatterns = ['pattern_2', 'pattern_8', 'pattern_9', 'pattern_10', 'pattern_11'];

      return harmony >= 0.5 && harmony < 0.8 && !relationPatterns.includes(pattern);
    }
  },

  // 3) 低一致度（harmony < 0.5）
  // 关系型高张力 → 优先从 Attitude 入手
  {
    id: 'K5_low_harmony_relation_A',
    start: 'A',
    when: ({ gapIndex, pattern }) => {
      const harmony = typeof gapIndex === 'number' ? gapIndex : 0;
      const relationPatterns = ['pattern_2', 'pattern_8', 'pattern_9', 'pattern_10', 'pattern_11'];

      return harmony < 0.5 && relationPatterns.includes(pattern);
    }
  },
  // 其他情况 → 从 Habit / 节奏系统入手
  {
    id: 'K6_low_harmony_habit_H',
    start: 'H',
    when: ({ gapIndex, pattern }) => {
      const harmony = typeof gapIndex === 'number' ? gapIndex : 0;
      const relationPatterns = ['pattern_2', 'pattern_8', 'pattern_9', 'pattern_10', 'pattern_11'];

      return harmony < 0.5 && !relationPatterns.includes(pattern);
    }
  }
];

function determineKASH(ctx) {
  for (const rule of KASH_RULES) {
    try {
      if (rule.when(ctx)) {
        return {
          kash_start: rule.start,
          rule_id: rule.id
        };
      }
    } catch (e) {
      continue;
    }
  }

  // 兜底（极少用到）：数据非常异常时，先从 Habit/系统 入手
  return {
    kash_start: 'H',
    rule_id: 'K0_default_habit'
  };
}

// =========================
// 7. 主入口：calculateReport → KASH_PROFILE
// =========================

// ================= V 平衡轮优先级模型（Core / Support / Flexible）=================

// 给「价值结构 / 平衡轮」用的优先级判定
function computePriorityLevelForWheel(vScore, rank) {
  const safeRank = (typeof rank === 'number' && !isNaN(rank)) ? rank : 99;

  // core（核心优先级）
  if (safeRank <= 2 || (vScore >= 0.8 && safeRank <= 3)) {
    return 'core';
  }

  // support（重要支撑）
  if ((safeRank >= 3 && safeRank <= 4) || vScore >= 0.6) {
    return 'support';
  }

  // flexible（灵活可调）
  return 'flexible';
}

// 构建 V_profile.priority：domains + groups + summary_text
function buildVPriorityModel(V_profile, raw_answers, domainOrder) {
  if (!V_profile || !Array.isArray(V_profile.vector)) return;

  const vVectorArray = V_profile.vector || [];
  const vRankRaw = raw_answers && raw_answers.v_rank ? raw_answers.v_rank : null;

  // 1) 把 v_rank 统一成 { Key: rankNumber }（Key 使用大写：Career / Wealth / ...）
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

  // 2) 领域 key 与标签（这里 keys 用小写，内部再映射到 VALUE_KEYS）
  const defaultKeys = (typeof VALUE_KEYS !== 'undefined')
    ? VALUE_KEYS.map(k => k.toLowerCase())
    : [];

  const keys = Array.isArray(domainOrder) && domainOrder.length
    ? domainOrder
    : defaultKeys;

  const labelMap = {
    career: '事业',
    wealth: '财富',
    growth: '成长',
    family: '家庭',
    health: '健康',
    spiritual: '心灵',
    social: '社交'
  };

  const domains = [];

  keys.forEach((lowerKey) => {
    if (!lowerKey) return;
    const capKey = lowerKey.charAt(0).toUpperCase() + lowerKey.slice(1); // career → Career

    const valueIndex = VALUE_KEYS.indexOf(capKey);
    if (valueIndex === -1) return;

    const vScoreRaw = vVectorArray[valueIndex];
    if (typeof vScoreRaw !== 'number') return;

    const vScore = (vScoreRaw > 1) ? (vScoreRaw / 100) : vScoreRaw;
    const rank = rankMap[capKey]; // 排名基于大写 Key

    const priority_level = computePriorityLevelForWheel(vScore, rank);

    domains.push({
      key: lowerKey,
      label: labelMap[lowerKey] || capKey,
      v_score: vScore,
      rank: (typeof rank === 'number' ? rank : null),
      priority_level
    });
  });

  // 3) 排序：先按 rank，再按 v_score
  domains.sort((a, b) => {
    const ra = (typeof a.rank === 'number') ? a.rank : 999;
    const rb = (typeof b.rank === 'number') ? b.rank : 999;
    if (ra !== rb) return ra - rb;
    return (b.v_score || 0) - (a.v_score || 0);
  });

  // 4) 分组
  const groups = {
    core: [],
    support: [],
    flexible: []
  };

  domains.forEach((d) => {
    if (!d.priority_level) return;
    groups[d.priority_level].push(d.key);
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

  const summary_text = {
    core: coreTextList
      ? `你最在意的核心领域是：${coreTextList}。`
      : '目前你没有特别突出的核心优先领域。',
    support: supportTextList
      ? `其次是：${supportTextList}。`
      : '目前你的支撑型领域还不算特别集中。',
    flexible: flexibleTextList
      ? `相对灵活可调的领域包括：${flexibleTextList}。`
      : '目前你几乎把所有领域都当作重要的目标在推进。'
  };

  V_profile.priority = {
    domains,
    groups,
    summary_text
  };
}

// 根据 V 分数 + v_rank 计算每个领域的优先级（core / support / flexible）
// 输出为：{ Career:'core', Wealth:'support', ... }
function buildPriorityByKey(vVector = [], vRankRaw = []) {
  const VALUE_KEYS_LOCAL = ['Career', 'Wealth', 'Growth', 'Family', 'Health', 'Spiritual', 'Social'];

  // 小工具：根据「排序优先级」计算 Core / Support / Flexible
  function computePriorityLevelInner(vScore, rank) {
    const hasRank = (typeof rank === 'number' && !isNaN(rank));

    // ✅ 主规则：优先看 v_rank
    if (hasRank) {
      if (rank <= 2) return 'core';      // 排名 1–2：核心优先级
      if (rank <= 4) return 'support';   // 排名 3–4：重要支撑
      return 'flexible';                 // 排名 5–7：灵活可调
    }

    // ⬇️ 兜底规则：万一没有排序数据，再用分数粗略区分
    if (vScore >= 0.8) return 'core';
    if (vScore >= 0.6) return 'support';
    return 'flexible';
  }

  // 统一把 v_rank 转成 {Key: 排名}
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

  const priorityByKey = {};

  VALUE_KEYS_LOCAL.forEach((key, idx) => {
    const score = (typeof vVector[idx] === 'number') ? vVector[idx] : 0;
    const rank = rankMap[key];
    priorityByKey[key] = computePriorityLevelInner(score, rank);
  });

  return priorityByKey;
}

// ========== v5 一致性计算通用工具 ==========

// 把 M 分数或推导 M 转成长度为 3 的向量 [A, R, C]，并做 0~1 归一
function normalizeMVector3(rawScores) {
  let vec;

  if (!rawScores) {
    vec = [0, 0, 0];
  } else if (Array.isArray(rawScores)) {
    vec = [
      Number(rawScores[0] || 0),
      Number(rawScores[1] || 0),
      Number(rawScores[2] || 0)
    ];
  } else {
    // 兼容 {A:.., R:.., C:..} 或小写写法
    vec = [
      Number(rawScores.A ?? rawScores.a ?? 0),
      Number(rawScores.R ?? rawScores.r ?? 0),
      Number(rawScores.C ?? rawScores.c ?? 0)
    ];
  }

  // 简单 0~1 归一：按最大值缩放
  const maxVal = Math.max(Math.abs(vec[0]), Math.abs(vec[1]), Math.abs(vec[2]), 0);
  if (maxVal > 0) {
    vec = vec.map(v => v / maxVal);
  }
  // 保证在 0~1 区间（假设所有分数非负）
  vec = vec.map(v => {
    if (!isFinite(v) || isNaN(v)) return 0;
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  });

  return vec;
}

// L1 相似度：返回 0~1，越大越相似
function computeL1Similarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;

  let dist = 0;
  for (let i = 0; i < len; i++) {
    const av = Number(a[i] || 0);
    const bv = Number(b[i] || 0);
    dist += Math.abs(av - bv);
  }
  dist = dist / len;

  let sim = 1 - dist / 2; // 理论上 dist 最大约为 2
  if (!isFinite(sim) || isNaN(sim)) sim = 0;
  if (sim < 0) sim = 0;
  if (sim > 1) sim = 1;
  return sim;
}
// 计算动机一致性指标（写入 Consistency_profile_v5.motive_alignment 用）
function computeMotiveAlignment(params) {
  const M_profile = params && params.M_profile;
  const V_profile = params && params.V_profile;
  const Delta_profile = params && params.Delta_profile;

  const result = {
    internal_TM: null,
    value_link: null,
    domain_link: null,
    overall: null,
    level: null
  };

  // 1) T→M 推导的一致性：m_real vs m_from_T
  const mRealVec = normalizeMVector3(M_profile && M_profile.scores);
  const mFromT = V_profile && V_profile.m_inferred_from_T;
  const mFromTVec = normalizeMVector3(mFromT);

  const internalTM = computeL1Similarity(mRealVec, mFromTVec);
  result.internal_TM = internalTM;

  // 2) M 与 V 的一致性（如果有 M2V 映射就用，没有就暂时置空）
  let valueLink = null;
  try {
    if (
      typeof MAPPING !== 'undefined' &&
      MAPPING &&
      MAPPING.M2V &&
      Array.isArray(V_profile && V_profile.vector)
    ) {
      const vVector = V_profile.vector;
      const mFromV = [0, 0, 0]; // [A, R, C]

      for (let i = 0; i < vVector.length; i++) {
        const score = Number(vVector[i] || 0);
        const key = Array.isArray(VALUE_KEYS) ? VALUE_KEYS[i] : null;
        if (!key) continue;
        const mapItem = MAPPING.M2V[key];
        if (!mapItem) continue;
        mFromV[0] += score * Number(mapItem.A || 0);
        mFromV[1] += score * Number(mapItem.R || 0);
        mFromV[2] += score * Number(mapItem.C || 0);
      }

      const mFromVNorm = normalizeMVector3(mFromV);
      valueLink = computeL1Similarity(mRealVec, mFromVNorm);
    }
  } catch (e) {
    // 映射表缺失时保持为 null
    valueLink = null;
  }
  result.value_link = valueLink;

  // 3) M 与领域优先级的一致性（domain_link）
  let domainLink = null;
  try {
    const priorityByKey =
      (Delta_profile && Delta_profile.priority_by_key) || {};
    const motiveMax = Math.max(mRealVec[0], mRealVec[1], mRealVec[2], 0);

    if (motiveMax > 0) {
      // 找出相对更突出的动机维度
      const highMotives = [];
      if (mRealVec[0] >= motiveMax - 0.1) highMotives.push('A');
      if (mRealVec[1] >= motiveMax - 0.1) highMotives.push('R');
      if (mRealVec[2] >= motiveMax - 0.1) highMotives.push('C');

      const A_domains = ['growth', 'career', 'spiritual'];
      const R_domains = ['family', 'social', 'health'];
      const C_domains = ['career', 'wealth', 'growth'];

      function priorityScore(domain) {
        const p = priorityByKey[domain];
        if (p === 'core') return 1;
        if (p === 'support') return 0.7;
        if (p === 'flexible') return 0.3;
        return 0.5; // 未知时给中间值
      }

      let scores = [];
      highMotives.forEach(mKey => {
        let domains;
        if (mKey === 'A') domains = A_domains;
        else if (mKey === 'R') domains = R_domains;
        else domains = C_domains;

        domains.forEach(d => {
          scores.push(priorityScore(d));
        });
      });

      if (scores.length > 0) {
        const avg =
          scores.reduce((sum, v) => sum + v, 0) / scores.length;
        domainLink = avg; // 已经在 0~1 左右区间
      }
    }
  } catch (e) {
    domainLink = null;
  }
  result.domain_link = domainLink;

  // 4) 综合 overall + level（按可用项动态加权）
  let sum = 0;
  let weightSum = 0;

  if (typeof internalTM === 'number') {
    sum += internalTM * 0.5;
    weightSum += 0.5;
  }
  if (typeof valueLink === 'number') {
    sum += valueLink * 0.3;
    weightSum += 0.3;
  }
  if (typeof domainLink === 'number') {
    sum += domainLink * 0.2;
    weightSum += 0.2;
  }

  if (weightSum > 0) {
    const overall = sum / weightSum;
    result.overall = overall;

    if (overall >= 0.7) result.level = 'high';
    else if (overall >= 0.4) result.level = 'medium';
    else result.level = 'low';
  } else {
    result.overall = null;
    result.level = null;
  }

  return result;
}

// 计算 Wheel_profile_v5 （资源一致性模型）
function computeWheelProfileV5(params) {
  const V_profile = params && params.V_profile;
  const R_profile = params && params.R_profile;
  const Delta_profile = params && params.Delta_profile;
  const priorityByKey = Delta_profile && Delta_profile.priority_by_key;

  // 最终返回结构（必须完整）
  const result = {
    ideal: {},
    real: {},
    gap: {},
    priority_level: {},
    status: {},
    priority_gaps: [],
    core_alignment: null,
    noncore_gaps: [],
    resource_misallocation: []
  };

  // 如果没有 priority_by_key，先返回空壳
  if (!priorityByKey) {
    return result;
  }

  

  // 1) priority_level 全拷贝
  result.priority_level = { ...priorityByKey };

  // 2) ideal / real / gap 的容器建立
  const ideal = {};
  const real = {};
  const gap = {};

  // ====== 获取领域列表（你已有 DEFAULT_DOMAIN_ORDER） ======
  const DOMAIN_ORDER = Array.isArray(VALUE_KEYS)
    ? VALUE_KEYS
    : ['career', 'wealth', 'growth', 'family', 'health', 'spiritual', 'social'];

  // ====== ideal：沿用 V_profile.vector，通过归一（安全版本） ======
  try {
    const vVec = V_profile && V_profile.vector;
    if (Array.isArray(vVec)) {
      const maxVal = vVec.reduce((m, v) => (v > m ? v : m), 0) || 1;
      DOMAIN_ORDER.forEach((key, idx) => {
        const val = Number(vVec[idx] || 0) / maxVal;
        ideal[key] = Math.max(0, Math.min(1, val));
      });
    }
  } catch (e) {}

  // ====== real：沿用 R_profile.vector，通过归一 ======
  try {
    const rVec = R_profile && R_profile.vector;
    if (Array.isArray(rVec)) {
      const maxVal = rVec.reduce((m, v) => (v > m ? v : m), 0) || 1;
      DOMAIN_ORDER.forEach((key, idx) => {
        const val = Number(rVec[idx] || 0) / maxVal;
        real[key] = Math.max(0, Math.min(1, val));
      });
    }
  } catch (e) {}

  // ====== gap：|ideal - real| ======
  DOMAIN_ORDER.forEach(key => {
    const g = Math.abs(Number(ideal[key] || 0) - Number(real[key] || 0));
    gap[key] = Math.max(0, Math.min(1, g));
  });

  result.ideal = ideal;
  result.real = real;
  result.gap = gap;

  // ====== status（aligned / over_invest / under_invest）=====
  const status = {};
  DOMAIN_ORDER.forEach(key => {
    const i = ideal[key] || 0;
    const r = real[key] || 0;
    const g = gap[key] || 0;

    if (g < 0.2) status[key] = 'aligned';
    else if (r > i) status[key] = 'over_invest';
    else status[key] = 'under_invest';
  });
  result.status = status;

  // ====== 分出 priority_gaps / noncore_gaps ======
  DOMAIN_ORDER.forEach(key => {
    const g = gap[key] || 0;
    const p = priorityByKey[key];

    if (g >= 0.4) {
      if (p === 'core') result.priority_gaps.push(key);
      else result.noncore_gaps.push(key);
    }
  });

  // ====== core_alignment ======
  try {
    const coreDomains = DOMAIN_ORDER.filter(k => priorityByKey[k] === 'core');
    if (coreDomains.length > 0) {
      const avgGap =
        coreDomains.reduce((sum, k) => sum + (gap[k] || 0), 0) /
        coreDomains.length;
      let align = 1 - avgGap;
      align = Math.max(0, Math.min(1, align));
      result.core_alignment = align;
    }
  } catch (e) {}

  // ====== resource_misallocation（安全简化版） ======
  // 逻辑：找到 over_invest 的，和 under_invest 的互相配对
  try {
    const overList = DOMAIN_ORDER.filter(k => status[k] === 'over_invest');
    const underList = DOMAIN_ORDER.filter(k => status[k] === 'under_invest');

    let pairs = [];
    const len = Math.min(overList.length, underList.length);

    for (let i = 0; i < len; i++) {
      const fromKey = overList[i];
      const toKey = underList[i];
      const sev = Math.max(gap[fromKey] || 0, gap[toKey] || 0);
      pairs.push({
        from: fromKey,
        to: toKey,
        severity: Math.max(0, Math.min(1, sev))
      });
    }

    result.resource_misallocation = pairs;
  } catch (e) {}

  return result;
}
// 计算 GAP_profile_v5 （基于 Wheel_profile_v5 和 Delta_profile）
function computeGapProfileV5(params) {
  const Delta_profile = params && params.Delta_profile;
  const Wheel_profile_v5 = params && params.Wheel_profile_v5;

  const priorityByKey =
    (Delta_profile && Delta_profile.priority_by_key) || {};

  const result = {
    gaps: {},
    gap_level: {},
    status: {},
    gap_reason: {},
    priority_gaps: [],
    core_alignment: [],
    noncore_gaps: [],
    structural_stress_index: null
  };

  // 如果没有 Wheel_profile_v5.gap，就直接返回空壳
  if (!Wheel_profile_v5 || !Wheel_profile_v5.gap) {
    return result;
  }

  const gap = Wheel_profile_v5.gap || {};
  const status = Wheel_profile_v5.status || {};
  const DOMAIN_ORDER = Object.keys(gap);

  // 1) gaps & status 直接沿用 Wheel_profile_v5
  DOMAIN_ORDER.forEach(key => {
    result.gaps[key] = Number(gap[key] || 0);
    result.status[key] = status[key] || 'aligned';
  });

  // 2) gap_level / priority_gaps / noncore_gaps
  DOMAIN_ORDER.forEach(key => {
    const g = result.gaps[key] || 0;
    const p = priorityByKey[key];

    let level = 'minor';
    if (g >= 0.4) {
      if (p === 'core') {
        level = 'priority';
        result.priority_gaps.push(key);
      } else if (p === 'support') {
        level = 'structural';
        result.core_alignment.push(key); // 这里先存 support 级别的结构差距域
      } else {
        level = 'noncore';
        result.noncore_gaps.push(key);
      }
    }
    result.gap_level[key] = level;
  });

  // 3) structural_stress_index：按优先级加权
  try {
    let weightedSum = 0;
    let weightTotal = 0;

    DOMAIN_ORDER.forEach(key => {
      const g = result.gaps[key] || 0;
      const p = priorityByKey[key];

      let w = 1;
      if (p === 'core') w = 3;
      else if (p === 'support') w = 2;
      else w = 1;

      weightedSum += g * w;
      weightTotal += w;
    });

    if (weightTotal > 0) {
      let idx = weightedSum / weightTotal;
      idx = Math.max(0, Math.min(1, idx));
      result.structural_stress_index = idx;
    }
  } catch (e) {
    result.structural_stress_index = null;
  }

  // gap_reason 留空，后面 narrative 阶段再填（用规则表映射）
  return result;
}

// 计算资源一致性指标（写入 Consistency_profile_v5.resource_alignment 用）
function computeResourceAlignment(params) {
  const Wheel_profile_v5 = params && params.Wheel_profile_v5;
  const GAP_profile_v5 = params && params.GAP_profile_v5;

  const result = {
    core_alignment: null,   // 核心领域的匹配度（0~1）
    noncore_pressure: null, // 非核心差距带来的压力（0~1）
    overall: null,
    level: null
  };

  if (!Wheel_profile_v5 || !GAP_profile_v5) {
    return result;
  }

  try {
    const priority = Wheel_profile_v5.priority_level || {};
    const gap = Wheel_profile_v5.gap || {};
    const gapsObj = GAP_profile_v5.gaps || {};

    // 1) 核心领域匹配度（和 Wheel_profile_v5.core_alignment 保持一致或做轻微调整）
    if (typeof Wheel_profile_v5.core_alignment === 'number') {
      let ca = Wheel_profile_v5.core_alignment;
      if (!isFinite(ca) || isNaN(ca)) ca = 0;
      if (ca < 0) ca = 0;
      if (ca > 1) ca = 1;
      result.core_alignment = ca;
    } else {
      // 没有 core_alignment 时，按 core 域 gap 反推
      const coreDomains = Object.keys(priority).filter(
        k => priority[k] === 'core'
      );
      if (coreDomains.length > 0) {
        const avgGap =
          coreDomains.reduce((sum, k) => sum + (gap[k] || 0), 0) /
          coreDomains.length;
        let ca = 1 - avgGap;
        if (!isFinite(ca) || isNaN(ca)) ca = 0;
        if (ca < 0) ca = 0;
        if (ca > 1) ca = 1;
        result.core_alignment = ca;
      }
    }

    // 2) 非核心差距压力：用 GAP_profile_v5.noncore_gaps 的平均 gap 来衡量
    const noncoreList = GAP_profile_v5.noncore_gaps || [];
    if (noncoreList.length > 0) {
      const avgNoncoreGap =
        noncoreList.reduce(
          (sum, k) => sum + (gapsObj[k] || 0),
          0
        ) / noncoreList.length;
      let pressure = avgNoncoreGap; // 0~1，越高压力越大
      if (!isFinite(pressure) || isNaN(pressure)) pressure = 0;
      if (pressure < 0) pressure = 0;
      if (pressure > 1) pressure = 1;
      result.noncore_pressure = pressure;
    }

    // 3) 综合 overall + level
    let sum = 0;
    let wSum = 0;

    if (typeof result.core_alignment === 'number') {
      // 核心匹配度越高越好
      sum += result.core_alignment * 0.7;
      wSum += 0.7;
    }
    if (typeof result.noncore_pressure === 'number') {
      // 非核心压力越低越好，因此用 (1 - pressure)
      sum += (1 - result.noncore_pressure) * 0.3;
      wSum += 0.3;
    }

    if (wSum > 0) {
      let overall = sum / wSum;
      if (!isFinite(overall) || isNaN(overall)) overall = 0;
      if (overall < 0) overall = 0;
      if (overall > 1) overall = 1;
      result.overall = overall;

      if (overall >= 0.7) result.level = 'high';
      else if (overall >= 0.4) result.level = 'medium';
      else result.level = 'low';
    }
  } catch (e) {
    // 出错就保留 null
  }

  return result;
}

// 结构冲突（structural_conflicts）：图层结构
// 用于后续“文不如表，表不如图”的可视化与叙事
function computeStructuralConflicts(params) {
  const motive_alignment = params && params.motive_alignment;
  const value_alignment = params && params.value_alignment;
  const resource_alignment = params && params.resource_alignment;
  const GAP_profile_v5 = params && params.GAP_profile_v5;
  const Wheel_profile_v5 = params && params.Wheel_profile_v5;

  const result = {
    layers: [],
    overall_index: null
  };

  // 小工具：把值安全压到 0~1 之间
  function norm01(x) {
    let v = Number(x);
    if (!isFinite(v) || isNaN(v)) return null;
    if (v < 0) v = 0;
    if (v > 1) v = 1;
    return v;
  }

  const layers = [];

  // ===== Layer 1：结构差距（priority_gap）=====
  try {
    const stress = norm01(GAP_profile_v5 && GAP_profile_v5.structural_stress_index);
    const gapsObj = (GAP_profile_v5 && GAP_profile_v5.gaps) || {};
    const priorityKeys = (GAP_profile_v5 && GAP_profile_v5.priority_gaps) || [];
    const noncoreKeys = (GAP_profile_v5 && GAP_profile_v5.noncore_gaps) || [];

    if (stress !== null) {
      const items = [];

      priorityKeys.forEach(k => {
        items.push({
          type: 'priority_gap',
          domain: k,
          gap: norm01(gapsObj[k] || 0)
        });
      });

      noncoreKeys.forEach(k => {
        items.push({
          type: 'noncore_gap',
          domain: k,
          gap: norm01(gapsObj[k] || 0)
        });
      });

      layers.push({
        id: 'priority_gap',
        label: '核心差距',
        score: stress,   // 0~1，越高表示结构张力越大
        items
      });
    }
  } catch (e) {
    // 忽略本层错误，继续其他层
  }

  // ===== Layer 2：资源错配（resource_mismatch）=====
  try {
    const mis = (Wheel_profile_v5 && Wheel_profile_v5.resource_misallocation) || [];
    if (Array.isArray(mis) && mis.length > 0) {
      // 用平均 severity 作为这一层的 score
      const avgSeverity =
        mis.reduce((sum, p) => sum + Number(p.severity || 0), 0) / mis.length;
      const score = norm01(avgSeverity);

      if (score !== null) {
        layers.push({
          id: 'resource_mismatch',
          label: '资源错配',
          score,
          items: mis.map(p => ({
            from: p.from,
            to: p.to,
            severity: norm01(p.severity || 0)
          }))
        });
      }
    }
  } catch (e) {
    // 忽略本层错误
  }

  // ===== Layer 3：动机 / 价值 / 资源一致性冲突（motive_value）=====
  try {
    const ma = motive_alignment && norm01(motive_alignment.overall);
    const va = value_alignment && norm01(value_alignment.overall);
    const ra = resource_alignment && norm01(resource_alignment.overall);

    const parts = [];
    if (ma !== null) {
      parts.push({ key: 'motive', align: ma, level: motive_alignment.level || null });
    }
    if (va !== null) {
      parts.push({ key: 'value', align: va, level: value_alignment.level || null });
    }
    if (ra !== null) {
      parts.push({ key: 'resource', align: ra, level: resource_alignment.level || null });
    }

    if (parts.length > 0) {
      // 冲突程度 = 1 - 一致性平均值
      const avgAlign = parts.reduce((s, p) => s + p.align, 0) / parts.length;
      const score = norm01(1 - avgAlign); // 越高表示冲突越大

      if (score !== null) {
        layers.push({
          id: 'motive_value',
          label: '动机与价值结构冲突',
          score,
          items: parts.map(p => ({
            aspect: p.key,
            alignment: p.align,
            level: p.level
          }))
        });
      }
    }
  } catch (e) {
    // 忽略本层错误
  }

  // ===== 汇总 overall_index =====
  try {
    const validScores = layers
      .map(l => norm01(l.score))
      .filter(v => v !== null);

    if (validScores.length > 0) {
      const avg =
        validScores.reduce((sum, v) => sum + v, 0) / validScores.length;
      result.overall_index = norm01(avg);
    } else {
      result.overall_index = null;
    }
  } catch (e) {
    result.overall_index = null;
  }

  result.layers = layers;
  return result;
}

// 计算特质一致性指标（写入 Consistency_profile_v5.trait_alignment 用）
function computeTraitAlignment(params) {
  const T_profile = params && params.T_profile;
  const M_profile = params && params.M_profile;
  const V_profile = params && params.V_profile;
  const Patterns = params && params.Patterns;

  const result = {
    with_motive: null,
    with_value: null,
    risk_balance: null,
    overall: null,
    level: null
  };

  // 当前阶段：先只搭好结构，不做“拍脑袋”的假计算
  // 后续会基于：
  // - M_T_patterns[mtKey] 中补充 ideal_trait_vector / risk_trait_vector
  // - V→T 映射表（MAPPING.V2T）
  // 再把 with_motive / with_value / risk_balance 细化为可计算值。

  // 这里仅做一些防御性检查，暂不修改数值：
  try {
    // 确保 T_profile.vector 至少是一个数组，这样以后扩展时不会报错
    if (!T_profile || !Array.isArray(T_profile.vector)) {
      // 保持 null，表示暂不可用
    }

    // Patterns.mt_pattern / M_profile.m_pattern / V_profile.vector
    // 也只是先验证存在性，不参与计算
    void M_profile;
    void V_profile;
    void Patterns;
  } catch (e) {
    // 出错时保持全部为 null
  }

  // 综合评分目前也保持 null，表示“算法暂未填入”
  result.overall = null;
  result.level = null;

  return result;
}

// 综合一致性指数（consistency_index）
// 汇总动机 / 特质 / 价值 / 资源 / 结构冲突，给一个总的一致性评分
function computeConsistencyIndex(params) {
  const motive_alignment = params && params.motive_alignment;
  const trait_alignment = params && params.trait_alignment;
  const value_alignment = params && params.value_alignment;
  const resource_alignment = params && params.resource_alignment;
  const structural_conflicts = params && params.structural_conflicts;

  // 基本结构
  const result = {
    overall: null,   // 0~1，一致性越高越接近 1
    level: null,     // 'high' / 'medium' / 'low'
    by_aspect: {}    // { motive:0.xx, value:0.xx, resource:0.xx, structure:0.xx, ... }
  };

  function norm01(x) {
    let v = Number(x);
    if (!isFinite(v) || isNaN(v)) return null;
    if (v < 0) v = 0;
    if (v > 1) v = 1;
    return v;
  }

  const aspects = [];

  // 1) 动机一致性
  if (motive_alignment && typeof motive_alignment.overall === 'number') {
    const v = norm01(motive_alignment.overall);
    if (v !== null) {
      aspects.push({ key: 'motive', value: v });
    }
  }

  // 2) 特质一致性（目前算法暂未实现，预留结构）
  if (trait_alignment && typeof trait_alignment.overall === 'number') {
    const v = norm01(trait_alignment.overall);
    if (v !== null) {
      aspects.push({ key: 'trait', value: v });
    }
  }

  // 3) 价值一致性
  if (value_alignment && typeof value_alignment.overall === 'number') {
    const v = norm01(value_alignment.overall);
    if (v !== null) {
      aspects.push({ key: 'value', value: v });
    }
  }

  // 4) 资源一致性
  if (resource_alignment && typeof resource_alignment.overall === 'number') {
    const v = norm01(resource_alignment.overall);
    if (v !== null) {
      aspects.push({ key: 'resource', value: v });
    }
  }

  // 5) 结构冲突整体（冲突越大，一致性越低 → 1 - conflict）
  if (structural_conflicts && typeof structural_conflicts.overall_index === 'number') {
    const conflict = norm01(structural_conflicts.overall_index);
    if (conflict !== null) {
      const v = norm01(1 - conflict); // 冲突 0→一致性1；冲突1→一致性0
      aspects.push({ key: 'structure', value: v });
    }
  }

  if (aspects.length === 0) {
    // 没有可用数据时，保持默认空结构
    return result;
  }

  // 填充 by_aspect
  aspects.forEach(a => {
    result.by_aspect[a.key] = a.value;
  });

  // 计算 overall（简单平均，后续可以改成加权）
  const sum = aspects.reduce((s, a) => s + a.value, 0);
  const overall = sum / aspects.length;
  result.overall = norm01(overall);

  // 划分 level
  if (result.overall !== null) {
    if (result.overall >= 0.7) result.level = 'high';
    else if (result.overall >= 0.4) result.level = 'medium';
    else result.level = 'low';
  }

  return result;
}

// 计算价值一致性指标（写入 Consistency_profile_v5.value_alignment 用）
function computeValueAlignment(params) {
  const V_profile = params && params.V_profile;
  const Delta_profile = params && params.Delta_profile;

  const result = {
    with_TM: null,         // V 与 T→M→V 推导结果的一致性
    with_reality: null,    // V 与现实 R 的一致性
    cluster_clarity: null, // 价值结构是否有清晰主线
    overall: null,
    level: null
  };

  // 1) V 与 v_from_TM 的一致性
  try {
    const vVec = V_profile && Array.isArray(V_profile.vector)
      ? V_profile.vector
      : null;
    const vFromTMVec = V_profile && Array.isArray(V_profile.v_from_TM)
      ? V_profile.v_from_TM
      : null;

    if (vVec && vFromTMVec) {
      result.with_TM = computeL1Similarity(vVec, vFromTMVec);
    }
  } catch (e) {
    result.with_TM = null;
  }

  // 2) V 与现实 R 的一致性（用 Delta_profile.delta_vector 反推）
  try {
    const deltaVec = Delta_profile && Array.isArray(Delta_profile.delta_vector)
      ? Delta_profile.delta_vector
      : null;

    if (deltaVec && deltaVec.length > 0) {
      const gaps = deltaVec.map(x => Math.abs(Number(x) || 0));
      const maxGap = gaps.reduce((m, v) => (v > m ? v : m), 0);

      if (maxGap > 0) {
        const normGaps = gaps.map(g => g / maxGap); // 0~1
        const avgGap =
          normGaps.reduce((sum, v) => sum + v, 0) / normGaps.length;
        let withReality = 1 - avgGap; // 差距越小，一致性越高
        if (!isFinite(withReality) || isNaN(withReality)) withReality = 0;
        if (withReality < 0) withReality = 0;
        if (withReality > 1) withReality = 1;
        result.with_reality = withReality;
      }
    }
  } catch (e) {
    result.with_reality = null;
  }

  // 3) 价值结构清晰度：Top3 的差异是否显著
  try {
    const vVec = V_profile && Array.isArray(V_profile.vector)
      ? V_profile.vector
      : null;
    if (vVec && vVec.length >= 2) {
      const sorted = vVec
        .map((score, idx) => ({
          score: Number(score) || 0,
          idx
        }))
        .sort((a, b) => b.score - a.score);

      const s1 = sorted[0].score;
      const s3 = (sorted[2] || sorted[sorted.length - 1]).score;

      if (s1 > 0) {
        let clarity = (s1 - s3) / s1; // 0~1，越大表示越有主线
        if (!isFinite(clarity) || isNaN(clarity)) clarity = 0;
        if (clarity < 0) clarity = 0;
        if (clarity > 1) clarity = 1;
        result.cluster_clarity = clarity;
      }
    }
  } catch (e) {
    result.cluster_clarity = null;
  }

  // 4) 综合 overall + level（动态加权，缺项不参与）
  let sum = 0;
  let weightSum = 0;

  if (typeof result.with_TM === 'number') {
    sum += result.with_TM * 0.4;
    weightSum += 0.4;
  }
  if (typeof result.with_reality === 'number') {
    sum += result.with_reality * 0.4;
    weightSum += 0.4;
  }
  if (typeof result.cluster_clarity === 'number') {
    sum += result.cluster_clarity * 0.2;
    weightSum += 0.2;
  }

  if (weightSum > 0) {
    const overall = sum / weightSum;
    result.overall = overall;

    if (overall >= 0.7) result.level = 'high';
    else if (overall >= 0.4) result.level = 'medium';
    else result.level = 'low';
  } else {
    result.overall = null;
    result.level = null;
  }

  return result;
}

// 构建 v5 动机结构 M_profile_v5
// 输入：旧版 M_profile（含 scores / top_motive / m_pattern）
// 输出：符合 v5 结构的动机画像
function buildMProfileV5(M_profile) {
  const scores = (M_profile && M_profile.scores) || {};

  // 原始分数（可能已经是 0~1，但我们先当作“原始值”存下来）
  const raw = {
    A: Number(scores.A ?? scores.a ?? 0),
    R: Number(scores.R ?? scores.r ?? 0),
    C: Number(scores.C ?? scores.c ?? 0)
  };

  // 0~1 归一：按最大值缩放，避免出现 >1
  const baseArr = [raw.A, raw.R, raw.C];
  const maxVal = Math.max(baseArr[0], baseArr[1], baseArr[2], 0) || 1;

  const normalized = {
    A: Math.max(0, Math.min(1, raw.A / maxVal)),
    R: Math.max(0, Math.min(1, raw.R / maxVal)),
    C: Math.max(0, Math.min(1, raw.C / maxVal))
  };

  // 按归一分排序，找出主/次动力
  const list = [
    { key: 'A', v: normalized.A },
    { key: 'R', v: normalized.R },
    { key: 'C', v: normalized.C }
  ].sort((a, b) => b.v - a.v);

  const primary   = list[0] || { key: null, v: 0 };
  const secondary = list[1] || { key: null, v: 0 };
  const tertiary  = list[2] || { key: null, v: 0 };

  // 以旧版 top_motive 为主，兜底再用排序结果
  const topKeyFromOld = M_profile && M_profile.top_motive;
  const topKey = topKeyFromOld || primary.key || null;

  const dominance = (primary.v || 0) - (secondary.v || 0);

  // 动力焦点类型：单核 / 双核 / 混合
  let focus_type = 'unknown';
  if (!isFinite(dominance) || isNaN(dominance)) {
    focus_type = 'unknown';
  } else if (dominance >= 0.25) {
    focus_type = 'single_core';  // 主动机明显高于第二位
  } else if (dominance >= 0.10) {
    focus_type = 'dual_core';    // 前两位比较接近，第三位明显低
  } else {
    focus_type = 'mixed';        // 三个维度都比较接近
  }

  const energy_source = {
    primary: topKey,
    secondary: secondary && secondary.v > 0 ? secondary.key : null,
    focus_type,
    // 方便后面画图用的向量结构
    vector: {
      A: normalized.A,
      R: normalized.R,
      C: normalized.C
    }
  };

  const core_motive = {
    key: topKey,
    pattern: (M_profile && M_profile.m_pattern) || null,
    dominance: isFinite(dominance) && !isNaN(dominance) ? dominance : null
  };

  // 简单的张力类型标签，后面 narrative 再解释含义
  let conflict_type = null;
  if (primary.v > 0 && tertiary.v > 0) {
    const spread = primary.v - tertiary.v;
    if (spread < 0.15) {
      conflict_type = 'tri_polar';   // 三个维度都比较高，方向分散
    } else if (dominance < 0.15) {
      conflict_type = 'bi_polar';    // 两个维度拉扯明显
    } else {
      conflict_type = 'focused';     // 焦点相对集中
    }
  }

  const conflict_pattern = {
    type: conflict_type,
    notes: null   // 预留给后续规则引擎 / 文案使用
  };

  const behavior_pattern = {
    m_pattern: (M_profile && M_profile.m_pattern) || null
  };

  return {
    raw_scores: raw,
    normalized,
    energy_source,
    core_motive,
    conflict_pattern,
    behavior_pattern
  };
}

// 构建 v5 特质结构 T_profile_v5
// 输入：旧版 T_profile（含 vector / top_trait_key / mt_trait_key）和 M_profile（可选）
// 输出：符合 v5 结构的特质画像
function buildTProfileV5(T_profile, M_profile) {
  const vec = (T_profile && Array.isArray(T_profile.vector))
    ? T_profile.vector
    : [0, 0, 0, 0, 0];

  const TRAIT_KEYS = ['Ope', 'Con', 'Ext', 'Agr', 'Neu'];

  // 原始向量 → 对应到命名对象
  const raw_vector = {
    Ope: Number(vec[0] || 0),
    Con: Number(vec[1] || 0),
    Ext: Number(vec[2] || 0),
    Agr: Number(vec[3] || 0),
    Neu: Number(vec[4] || 0)
  };

  // 0~1 归一（防御性处理）
  const baseArr = TRAIT_KEYS.map(k => raw_vector[k]);
  const maxVal = baseArr.reduce((m, v) => (v > m ? v : m), 0) || 1;

  const normalized_vector = {};
  TRAIT_KEYS.forEach(k => {
    const v = raw_vector[k] / maxVal;
    normalized_vector[k] = Math.max(0, Math.min(1, isFinite(v) && !isNaN(v) ? v : 0));
  });

  // 优势特质排序列表
  const dominant_traits = TRAIT_KEYS
    .map(k => ({
      key: k,
      score: normalized_vector[k]
    }))
    .sort((a, b) => b.score - a.score);

  // 行为风格：先记录已有关键字段，后面 narrative 再细化
  const behavior_style = {
    top_trait_key: T_profile && T_profile.top_trait_key || null,
    mt_trait_key: T_profile && T_profile.mt_trait_key || null
  };

  // M×T 联合模式：直接挂上 mt_key（如果有）
  let t_m_joint_pattern = {};
  try {
    const mtKey = (M_profile && M_profile.m_pattern)
      ? `${M_profile.m_pattern}__${T_profile && T_profile.mt_trait_key || ''}`
      : null;
    if (mtKey) {
      t_m_joint_pattern = {
        key: mtKey
      };
    }
  } catch (e) {
    t_m_joint_pattern = {};
  }

  // 风险模式：基于 Neu 简单给一个“情绪风险”标签（结构位子先占好）
  const neu = normalized_vector.Neu;
  let emotional_risk = 'unknown';
  if (isFinite(neu) && !isNaN(neu)) {
    if (neu >= 0.66) emotional_risk = 'high';    // 神经质得分高 → 情绪波动风险高
    else if (neu <= 0.33) emotional_risk = 'low'; // 神经质得分低 → 情绪稳定
    else emotional_risk = 'medium';
  }

  const risk_pattern = {
    emotional_risk
  };

  return {
    raw_vector,
    normalized_vector,
    dominant_traits,
    behavior_style,
    t_m_joint_pattern,
    risk_pattern
  };
}

// ============================================
// VALUE PROFILE V5  （使用现有 V_profile + v_rank）
// ============================================
function buildValueProfileV5(params) {
  const V_profile = params && params.V_profile;
  const raw_v_rank = (params && params.raw_v_rank) || [];

  const keys = Array.isArray(VALUE_KEYS)
    ? VALUE_KEYS
    : ['Career', 'Wealth', 'Growth', 'Family', 'Health', 'Spiritual', 'Social'];

  // 1) 实际 V 向量（问卷算出来的 0~1）
  const actualMap = {};
  const vec = (V_profile && Array.isArray(V_profile.vector))
    ? V_profile.vector
    : [];

  keys.forEach((k, idx) => {
    const v = typeof vec[idx] === 'number' ? vec[idx] : 0;
    actualMap[k] = v;
  });

  // 2) 推导 V 向量（T→M→V 的 v_from_TM）
  const predictedMap = {};
  const vFromTMVec = (V_profile && Array.isArray(V_profile.v_from_TM))
    ? V_profile.v_from_TM
    : null;
  const vFromTMByKey = V_profile && V_profile.v_from_TM_byKey;

  keys.forEach((k, idx) => {
    let v = 0;
    if (vFromTMByKey && typeof vFromTMByKey[k] === 'number') {
      v = vFromTMByKey[k];
    } else if (vFromTMVec && typeof vFromTMVec[idx] === 'number') {
      v = vFromTMVec[idx];
    }
    predictedMap[k] = v;
  });

  // 3) 用户主观排序（问卷拖拽结果）
  const userRank = Array.isArray(raw_v_rank) ? raw_v_rank.slice() : [];

  // 4) 实际排序 & 预测排序
  function sortByMap(mapObj) {
    return keys
      .map(k => ({ key: k, score: Number(mapObj[k] || 0) }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.key);
  }

  const actualRank = sortByMap(actualMap);
  const predictedRank = sortByMap(predictedMap);

  // 5) 一致性：向量一致性 (actual vs predicted)
  const actualVec = keys.map(k => actualMap[k] || 0);
  const predictedVec = keys.map(k => predictedMap[k] || 0);
  const vecSimilarity = computeL1Similarity(actualVec, predictedVec); // 0~1

  // 6) 排名一致性：用户排序 vs 预测排序
  let rankSimilarity = null;
  if (userRank.length === keys.length) {
    const posUser = {};
    const posPred = {};
    keys.forEach(k => {
      posUser[k] = userRank.indexOf(k);
      posPred[k] = predictedRank.indexOf(k);
    });

    let sumDiff = 0;
    let count = 0;
    keys.forEach(k => {
      const pu = posUser[k];
      const pp = posPred[k];
      if (pu >= 0 && pp >= 0) {
        sumDiff += Math.abs(pu - pp);
        count++;
      }
    });

    if (count > 0) {
      const avgDiff = sumDiff / count;              // 0 ~ 6
      const maxDiff = keys.length - 1 || 1;        // 6
      let sim = 1 - avgDiff / maxDiff;             // 0~1
      if (!isFinite(sim) || isNaN(sim)) sim = 0;
      if (sim < 0) sim = 0;
      if (sim > 1) sim = 1;
      rankSimilarity = sim;
    }
  }

  // 7) 综合 value_alignment
  let overall = null;
  let weightSum = 0;
  let sum = 0;

  if (typeof vecSimilarity === 'number') {
    sum += vecSimilarity * 0.6;
    weightSum += 0.6;
  }
  if (typeof rankSimilarity === 'number') {
    sum += rankSimilarity * 0.4;
    weightSum += 0.4;
  }

  if (weightSum > 0) {
    overall = sum / weightSum;
  }

  let level = null;
  if (overall !== null) {
    if (overall >= 0.7) level = 'high';
    else if (overall >= 0.4) level = 'medium';
    else level = 'low';
  }

  const motive_alignment = {
    with_TM_vector: vecSimilarity,
    with_TM_rank: rankSimilarity,
    overall,
    level
  };

  // 8) 结构冲突域：预测高但实际低 / 预测低但实际高
  const conflicts = [];
  keys.forEach(k => {
    const ideal = predictedMap[k] || 0;
    const real = actualMap[k] || 0;

    if (ideal >= 0.7 && real <= 0.4) {
      conflicts.push({
        key: k,
        type: 'under_expressed',
        reason: '天赋结构中该领域重要，但当前主观价值相对偏低'
      });
    } else if (ideal <= 0.3 && real >= 0.7) {
      conflicts.push({
        key: k,
        type: 'over_expressed',
        reason: '天赋结构中该领域影响一般，但当前主观价值投入很高'
      });
    }
  });

  // 9) 返回符合原 skeleton 的结构
  return {
    value_rank: {
      user: userRank,
      actual: actualRank,
      predicted: predictedRank
    },
    value_set: {
      actual: actualMap,
      predicted: predictedMap
    },
    value_cluster: {
      primary_cluster: '',
      secondary_cluster: '',
      cluster_distribution: {}
    },
    motive_alignment,
    domain_mapping: {
      conflicts
    }
  };
}

// =============== 报告主函数：calculateReport ==================

export function calculateReport(raw) {
  console.log('[REPORT DEBUG] raw.v_rank =', raw.v_rank);

  const M = computeM(raw.m_answers || []);
  const T = computeT(raw.t_answers || []);
  const V = computeV(raw.v_answers || []);
  const R = computeR(raw.r_answers || []);
  const Gap = computeGap(V.vector, R.vector);

  // 由 T → M → V 推导出的理想价值向量
  const vFromTM = computeVFromTM(T.vector || []);

  // 规则化的 Pattern & KASH 判定
  const patternResult = determinePattern({
    topM: M.top_motive,
    gapIndex: Gap.index,
    topV: V.max_key,
    mScores: M.scores
  });

  const kashResult = determineKASH({
    gapIndex: Gap.index,
    pattern: patternResult.pattern
  });

  const mtKey = `${M.m_pattern}__${T.mt_trait_key}`;
  const mtPattern = M_T_patterns[mtKey] || null;

  // Δ 详情：带 0~10 分数 & 差距等级 & v_rank（如果有的话）
  const deltaDetails = buildDeltaDetails(
    V.vector,
    R.vector,
    raw.v_rank || []
  );

  // 每个领域的优先级（core / support / flexible）
  const priorityByKey = buildPriorityByKey(V.vector || [], raw.v_rank || []);

  // 统一资料结构：先组装各个 profile
  const T_profile = {
    vector: T.vector,
    top_trait_key: T.top_trait_key,
    mt_trait_key: T.mt_trait_key
  };

  const M_profile = {
    scores: M.scores,
    top_motive: M.top_motive,
    m_pattern: M.m_pattern,
    m_autonomy: M.m_autonomy,
    m_relatedness: M.m_relatedness,
    m_competence: M.m_competence
  };

  const V_profile = {
    vector: V.vector,
    top_value: V.max_key,
    v_from_TM: vFromTM.vector,
    v_from_TM_byKey: vFromTM.byKey,
    m_inferred_from_T: vFromTM.inferredM
  };

  // V 平衡轮优先级（给前端文本用）
  const DEFAULT_DOMAIN_ORDER = ['career', 'wealth', 'growth', 'family', 'health', 'spiritual', 'social'];
  buildVPriorityModel(V_profile, raw, DEFAULT_DOMAIN_ORDER);

  const R_profile = {
    vector: R.vector
  };

  const Delta_profile = {
    harmony: Gap.index,
    max_gap_key: Gap.max_gap_key,
    delta_vector: Gap.delta_vector,
    delta_details: deltaDetails,
    // 新增：每个领域的优先级结构
    priority_by_key: priorityByKey
  };

  const Patterns = {
    pattern_type: patternResult.pattern,
    pattern_rule: patternResult.rule_id,
    pattern_reason: patternResult.reason,
    kash_start: kashResult.kash_start,
    kash_rule: kashResult.rule_id,
    mt_key: mtKey,
    mt_pattern: mtPattern
  };

  // V 的 Top3（理想价值 Top3）
  const v_top3 = (V.vector || [])
    .map((score, idx) => ({
      key: VALUE_KEYS[idx] || `D${idx}`,
      score
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Δ 的 Top3（差距最大 Top3）
  const delta_top3 = (Gap.delta_vector || [])
    .map((gap, idx) => ({
      key: VALUE_KEYS[idx] || `D${idx}`,
      gap
    }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);

  // 综合快照（Summary 用）
  const synthesis = {
    harmony: Gap.index,
    max_gap_key: Gap.max_gap_key,
    top_motive: M.top_motive,
    top_value: V.max_key,
    pattern_type: patternResult.pattern,
    kash_start: kashResult.kash_start,
    mt_key: mtKey,
    v_top3,
    delta_top3
  };

  
  // ============================================
  // v5 数据结构空壳（Dual Data Mode 开始）
  // ============================================
  const M_profile_v5 = {
    raw_scores: {},
    normalized: {},
    energy_source: {},
    core_motive: {},
    conflict_pattern: {},
    behavior_pattern: {}
  };
    // 基于旧版 M_profile 构建 v5 动机结构
  Object.assign(
    M_profile_v5,
    buildMProfileV5(M_profile)
  );

  const T_profile_v5 = {
    raw_vector: {},
    normalized_vector: {},
    dominant_traits: [],
    behavior_style: {},
    t_m_joint_pattern: {},
    risk_pattern: {}
  };
   // 基于旧版 T_profile / M_profile 构建 v5 特质结构
  Object.assign(
    T_profile_v5,
    buildTProfileV5(T_profile, M_profile)
  );

   const Value_profile_v5 = {
    value_rank: [],
    value_set: [],
    value_cluster: {
      primary_cluster: '',
      secondary_cluster: '',
      cluster_distribution: {}
    },
    motive_alignment: {},
    domain_mapping: {}
  };

  // 基于旧版 V_profile + v_rank 构建 v5 价值结构
  Object.assign(
    Value_profile_v5,
    buildValueProfileV5({
      V_profile,
      raw_v_rank: raw.v_rank || []
    })
  );

  const Wheel_profile_v5 = {
    ideal: {},
    real: {},
    gap: {},
    priority_level: {},
    status: {},
    priority_gaps: [],
    core_alignment: [],
    noncore_gaps: [],
    resource_misallocation: []
  };

  const GAP_profile_v5 = {
    gaps: {},
    gap_level: {},
    status: {},
    gap_reason: {},
    priority_gaps: [],
    core_alignment: [],
    noncore_gaps: [],
    structural_stress_index: {}
  };

    const Consistency_profile_v5 = {
    motive_alignment: {},
    trait_alignment: {},
    value_alignment: {},
    resource_alignment: {},
    consistency_index: {},
    // ⭐ 结构冲突：采用“图层结构”（layers），方便后续做图 / 表 / 文
    structural_conflicts: {
      layers: [],
      overall_index: null
    },
    projection: {}
  };

  // 利用已构建好的 M_profile / V_profile / Delta_profile 计算动机一致性（v5）
  Consistency_profile_v5.motive_alignment = computeMotiveAlignment({
    M_profile,
    V_profile,
    Delta_profile
  });

  // 利用 M_profile / T_profile / V_profile / Patterns 计算特质一致性（v5）
Consistency_profile_v5.trait_alignment = computeTraitAlignment({
  T_profile,
  M_profile,
  V_profile,
  Patterns
});

// 利用 V_profile / Delta_profile 计算价值一致性（v5）
Consistency_profile_v5.value_alignment = computeValueAlignment({
 V_profile,
 Delta_profile
});

// 构建 Wheel_profile_v5 (v5 资源一致性模型)
Object.assign(
  Wheel_profile_v5,
  computeWheelProfileV5({
    V_profile,
    R_profile,
    Delta_profile
  })
);

// ★ 基于 Wheel_profile_v5 / Delta_profile 构建 GAP_profile_v5
  Object.assign(
    GAP_profile_v5,
    computeGapProfileV5({
      Delta_profile,
      Wheel_profile_v5
    })
  );

// 利用 Wheel_profile_v5 / GAP_profile_v5 计算资源一致性（v5）
Consistency_profile_v5.resource_alignment = computeResourceAlignment({
  Wheel_profile_v5,
  GAP_profile_v5
});

// ⭐ 汇总：计算结构冲突（图层结构）
  Consistency_profile_v5.structural_conflicts = computeStructuralConflicts({
    motive_alignment: Consistency_profile_v5.motive_alignment,
    value_alignment: Consistency_profile_v5.value_alignment,
    resource_alignment: Consistency_profile_v5.resource_alignment,
    GAP_profile_v5,
    Wheel_profile_v5
  });

  // ⭐ 综合一致性指数（consistency_index）
  Consistency_profile_v5.consistency_index = computeConsistencyIndex({
    motive_alignment: Consistency_profile_v5.motive_alignment,
    trait_alignment: Consistency_profile_v5.trait_alignment,
    value_alignment: Consistency_profile_v5.value_alignment,
    resource_alignment: Consistency_profile_v5.resource_alignment,
    structural_conflicts: Consistency_profile_v5.structural_conflicts
  });

  const Synthesis_profile_v5 = {
    identity_line: {},
    core_structure: {},
    strengths: [],
    conflicts: [],
    focus_90days: [],
    kash_guidance: {},
    projection: {},
    structure_map: {}
  };

  // === v5 统一打包结构（给渲染层／图表用）===
  const V5_bundle = {
    M_profile_v5,
    T_profile_v5,
    Value_profile_v5,
    Wheel_profile_v5,
    GAP_profile_v5,
    Consistency_profile_v5,
    Synthesis_profile_v5
  };

// === v5 统一快照：用于快速总览一致性 / 结构指标 ===
const v5_snapshot = {
  // 动机一致性：M ↔ T→M→V
  motive:
    (Consistency_profile_v5.motive_alignment &&
      Consistency_profile_v5.motive_alignment.overall) ?? null,

  // 价值一致性：V ↔ T→M→V、V ↔ R
  value:
    (Consistency_profile_v5.value_alignment &&
      Consistency_profile_v5.value_alignment.overall) ?? null,

  // 特质一致性：T ↔ M / V（目前可能还是 null，后面算法补上）
  trait:
    (Consistency_profile_v5.trait_alignment &&
      Consistency_profile_v5.trait_alignment.overall) ?? null,

  // 资源配置一致性：R 资源投入 ↔ 价值优先级
  resource:
    (Consistency_profile_v5.resource_alignment &&
      Consistency_profile_v5.resource_alignment.overall) ?? null,

  // 总一致性指数（综合上面几项）
  index:
    (Consistency_profile_v5.consistency_index &&
      Consistency_profile_v5.consistency_index.overall) ?? null,

  // 关键结构指标：核心领域对齐程度 & 结构张力
  wheel_core_alignment: Wheel_profile_v5.core_alignment ?? null,
  structural_stress: GAP_profile_v5.structural_stress_index ?? null
};

 // v5 问卷元数据（只记录题库版本 & 题量，不参与当前计算）
const questionnaire_meta_v5 = {
  version: {
    m: '5.0.0',
    t: '5.0.0',
    v: '5.0.0',
    r: '5.0.0'
  },
  counts: {
    m: M_QUESTIONS_V5.length,
    t: T_QUESTIONS_V5.length,
    v: V_QUESTIONS_V5.length,
    r: R_QUESTIONS_V5.length
  }
};

    const report = {
    version: '3.2.2',

    // 问卷版本与题量信息：只做记录，不影响计算
    questionnaire_meta: {
      version: QUESTIONNAIRE_VERSION,
      counts: {
        m: (M_QUESTIONS || []).length,
        t: (T_QUESTIONS || []).length,
        v: (V_QUESTIONS || []).length,
        r: (R_QUESTIONS || []).length
      }
    },
    
   questionnaire_meta_v5,

    raw_answers: {
      t: raw.t_answers || [],
      m: raw.m_answers || [],
      v: raw.v_answers || [],
      r: raw.r_answers || [],
      // 记录 V 问卷的主观优先级排序
      v_rank: raw.v_rank || []
    },

    // 主结构
    T_profile,
    M_profile,
    V_profile,
    R_profile,
    Delta_profile,
    Patterns,

    // ⭐ 新增：V 的排序（从问卷传入，方便前端直接读取）
    v_rank: raw.v_rank || [],

    // 小写兼容字段（旧代码可能用到）
    t_profile: T_profile,
    m_profile: M_profile,
    v_profile: V_profile,
    r_profile: R_profile,
    delta_profile: Delta_profile,
    patterns: Patterns,

    // 综合快照
    synthesis,

    // 新系统（v5）并行数据结构（目前还是空壳）
    M_profile_v5,
    T_profile_v5,
    Value_profile_v5,
    Wheel_profile_v5,
    GAP_profile_v5,
    Consistency_profile_v5,
    Synthesis_profile_v5,

   // v5 统一入口（后续渲染层只要用这一个）
    v5: V5_bundle,
    v5_snapshot,

    timestamp: new Date().toISOString()
  };

  // ★ 调试用：把最近一次的完整报告对象挂到全局，方便在控制台查看
  if (typeof window !== 'undefined') {
    window.__MYGIFT_LAST_REPORT__ = report;
  }

  return report;
}



// =========================
// 6.x Fit 报告（岗位适配度）v0.1
// - 目标：免费阶段快速给出“岗位适合度结论 + 下一步引导”
// - 说明：此版本允许输入极少，confidence 会相应降低
// =========================
export function calculateFitReportV01(payload = {}) {
  const job_key = (payload && (payload.job_key || payload.jobKey)) || '';
  const raw = (payload && payload.raw) || null;

  // 取岗位模型（job_models_v0_1.js 已在文件顶部 import）
  const job = (JOB_MODELS_V0_1 && JOB_MODELS_V0_1.models && job_key)
    ? (JOB_MODELS_V0_1.models[job_key] || null)
    : null;

  const job_label = (job && (job.label || job.title)) || job_key || '';

  // 可选：如果传入 raw（测评原始答题），我们就复用你现有的 calculateReport 得到 kash_start 等信号
  let reportFromAssessment = null;
  let has_assessment = false;

  try {
    if (raw && typeof raw === 'object') {
      reportFromAssessment = calculateReport(raw);
      has_assessment = true;
    }
  } catch (e) {
    // ignore
  }

  // kash_start：优先取用户测评结果；没有的话给一个保守默认
  const kash_start =
    (reportFromAssessment && reportFromAssessment.synthesis && reportFromAssessment.synthesis.kash_start) ||
    (reportFromAssessment && reportFromAssessment.patterns && reportFromAssessment.patterns.kash_start) ||
    (job && (job.kash_start || job.kashStart)) ||
    'H';

  const kash_rule =
    (reportFromAssessment && reportFromAssessment.patterns && reportFromAssessment.patterns.kash_rule) ||
    'K0_default_habit';

  // 置信度：输入越少越低（先给一个可用的刻度）
  const confidence = has_assessment ? 0.65 : 0.45;

  // v0.1：先返回结构化报告（评分与理由目前是“占位 + 可迭代”）
  // 后续我们会把：岗位KASH vs 用户KASH、技能/经验、差距Top项，接入到 fit_engine_v0_2
  const out = {
    meta: {
      schema: "MY_GIFT_FIT_REPORT_V0_1",
      version: "0.1.0",
      locale: (JOB_MODELS_V0_1 && JOB_MODELS_V0_1.meta && JOB_MODELS_V0_1.meta.locale) || "ja-JP",
      created_at: "2026-01-11",
      source: {
        job_model_version: "JOB_MODELS_V0_1",
        engine: "fit_engine_v0_1"
      }
    },
    inputs: {
      job_key,
      job_label,
      user_profile_ref: {
        has_assessment,
        has_fact_profile: false,
        has_resume: false
      }
    },
    synthesis: {
      fit_grade: "B",
      fit_score: 0.72,
      confidence,
      kash_start,
      kash_rule,
      top_reasons: [
        { key: "strength_match", title: "強みが職務要件と重なる（暫定）", weight: 0.34 },
        { key: "habit_risk", title: "習慣・継続の設計がボトルネック（暫定）", weight: 0.22 }
      ],
      warnings: [
        { key: "low_input", title: "入力が少ないため精度は参考値", level: "info" }
      ]
    },
    fit: {
      job: {
        key: job_key,
        kash_profile: (job && (job.kash_profile || job.kash)) || { K: [], A: [], S: [], H: [] }
      },
      user: {
        kash_profile: { K: [], A: [], S: [], H: [] }
      },
      match: {
        kash_gap_summary: { K: 0.2, A: 0.35, S: 0.25, H: 0.45 },
        suggested_actions: {
          now_7d: [
            { title: "1日15分の習慣設計", why: "Hのギャップが大きい", metric: "7日連続の実行" }
          ],
          next_30d: [
            { title: "職務タスクの分解と週次レビュー", why: "H→Sへの接続", metric: "週1レビュー×4回" }
          ],
          next_90d: [
            { title: "成果事例（STAR）を3本作成", why: "Sの可視化", metric: "STAR 3本完成" }
          ]
        }
      }
    },
    upgrade: {
      cta: [
        { key: "do_assessment", label: "適性測評で精度を上げる", target: "assessment" },
        { key: "add_fact_profile", label: "経験入力で職務適合を深掘り", target: "fact" },
        { key: "target_role", label: "志望職種を設定して精密対標", target: "role_target" }
      ]
    }
  };

  return out;
}


// ========== 调试辅助：把 calculateReport 和 diagnostics 暴露到全局命名空间 ==========

if (typeof window !== 'undefined') {
  window.MY_GIFT = window.MY_GIFT || {};
window.MY_GIFT.JOB_MODELS_V0_1 = JOB_MODELS_V0_1;
window.MY_GIFT.getJobModelV01 = (key) => (JOB_MODELS_V0_1?.models?.[key] || null);

  // 让我们能在控制台调用：MY_GIFT.calculateReport(raw)
  window.MY_GIFT.calculateReport = calculateReport;
  window.MY_GIFT.calculateFitReportV01 = calculateFitReportV01;

  // 报告结构自检工具
  window.MY_GIFT.diagnostics = function (report) {
    if (!report) {
      console.warn('MY_GIFT.diagnostics: report 为空');
      return;
    }

    console.log('--- MY_GIFT.diagnostics 开始 ---');

    const topKeys = [
      'T_profile',
      'M_profile',
      'V_profile',
      'R_profile',
      'Delta_profile',
      'Patterns',
      'synthesis'
    ];
    for (let i = 0; i < topKeys.length; i++) {
      const key = topKeys[i];
      if (!(key in report)) {
        console.warn('缺少字段: report.' + key);
      }
    }

    const v5Keys = [
      'M_profile_v5',
      'T_profile_v5',
      'Value_profile_v5',
      'Wheel_profile_v5',
      'GAP_profile_v5',
      'Consistency_profile_v5',
      'Synthesis_profile_v5',
      'v5_snapshot'
    ];
    for (let j = 0; j < v5Keys.length; j++) {
      const k = v5Keys[j];
      if (!(k in report)) {
        console.warn('缺少 v5 字段: report.' + k);
      }
    }

    console.log('--- MY_GIFT.diagnostics 结束 ---');
  };

  // v5 快照查看工具：在控制台输入 MY_GIFT.getV5Snapshot()
  window.MY_GIFT.getV5Snapshot = function () {
    const r = window.__MYGIFT_LAST_REPORT__;
    if (!r || !r.v5_snapshot) {
      console.warn('MY_GIFT.getV5Snapshot: 当前报告中没有 v5_snapshot');
      return null;
    }
    console.log('[MY_GIFT v5 snapshot]', r.v5_snapshot);
    return r.v5_snapshot;
  };
}