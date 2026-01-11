/**
 * /data/mapping_t2v.js
 * 职责：提供 T→M 和 M→V 的权重矩阵
 * 版本：v0.1（可调参版）
 *
 * 说明：
 *  - W_TM：Big Five 向量 T → SDT 三动力 M (A / R / C)
 *  - W_MV：三动力 M → 七大价值观 V
 *
 * 逻辑核心在 /core/logic_core.js 里的：
 *   inferMFromT(tVector)  使用 W_TM
 *   computeVFromTM(tVector) 使用 W_MV
 */

// ---------------------------------------------------
// 1. T → M 权重矩阵  (Big Five → SDT)
// 键名使用 T_Ope / T_Con / T_Ext / T_Agr / T_Neu
// 数值直觉：
//   - 开放 Ope 更偏向 自主 A
//   - 尽责 Con 更偏向 能力 C
//   - 外向 Ext 同时带一点 关系 R + 能力 C
//   - 宜人 Agr 更偏向 关系 R
//   - 情绪 Neu 高度波动时，更多从 成就 C 获取补偿；后面可以再精细化
// ---------------------------------------------------
const W_TM = {
  T_Ope: { A: 0.7, R: 0.2, C: 0.1 },
  T_Con: { A: 0.1, R: 0.1, C: 0.8 },
  T_Ext: { A: 0.2, R: 0.5, C: 0.3 },
  T_Agr: { A: 0.1, R: 0.8, C: 0.1 },
  T_Neu: { A: 0.1, R: 0.2, C: 0.7 }
};

// ---------------------------------------------------
// 2. M → V 权重矩阵  (SDT → 七大价值观)
// 键名：Career, Wealth, Growth, Family, Health, Spiritual, Social
//
// 直觉：
//   - A：自主 → 更看重 Growth / Career / Spiritual
//   - C：成就 → 更看重 Career / Wealth / Growth
//   - R：关系 → 更看重 Family / Social / Health / Spiritual
//
// 不需要每行刚好等于 1，logic_core 里会归一化。
// ---------------------------------------------------
const W_MV = {
  A: {
    Career:    0.20,
    Wealth:    0.05,
    Growth:    0.40,
    Family:    0.05,
    Health:    0.10,
    Spiritual: 0.15,
    Social:    0.05
  },
  C: {
    Career:    0.35,
    Wealth:    0.25,
    Growth:    0.20,
    Family:    0.05,
    Health:    0.10,
    Spiritual: 0.03,
    Social:    0.02
  },
  R: {
    Career:    0.05,
    Wealth:    0.05,
    Growth:    0.10,
    Family:    0.40,
    Health:    0.15,
    Spiritual: 0.10,
    Social:    0.15
  }
};

// 使用「命名导出」，方便在 logic_core.js 里用：import { W_TM, W_MV } ...
export { W_TM, W_MV };