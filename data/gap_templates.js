// /data/gap_templates.js
// GAP 专业模板库（高 / 中 / 低）

export const GAP_TEMPLATES = {
  high: ({ harmonyPct, highList, midList }) => `
    <p style="font-size:15px; line-height:1.8;">
      <strong>整体匹配度：${harmonyPct}%</strong><br>
      你目前展现出高度一致的生活结构，代表理想（Value）与现实（Reality）之间的策略一致性极强。
      这是一种成熟的自我管理能力，说明你长期保持稳定节奏、清晰目标，并成功让不同领域形成正向联动。
    </p>

    <p style="font-size:15px; line-height:1.8;">
      <strong>匹配度较高的领域包括：</strong><br>
      ${highList}<br>
      这些领域表现出稳定协调性，反映你在价值判断、行动策略与资源配置上已经形成良好循环。
    </p>

    <p style="font-size:15px; line-height:1.8;">
      <strong>匹配度中等的领域包括：</strong><br>
      ${midList || '（无）'}<br>
      这些不是弱项，而是“尚未完全发挥潜力的空间”，适合作为下一阶段的轻量优化方向。
    </p>

    <p style="font-size:15px; line-height:1.8;">
      值得强调的是：<strong>没有出现明显的低匹配度领域</strong>。
      这代表你的整体系统没有冲突，也没有需要紧急修补的问题。
    </p>

    <p style="font-size:15px; line-height:1.8;">
      <strong>未来建议：</strong><br>
      在维持现有平衡的基础上，可以加入更长线、更有挑战性的目标，
      例如提升影响力、拓展事业版图或探索新的成长曲线。
    </p>
  `,

  mid: ({ harmonyPct, highList, midList, lowList }) => `
    <p style="font-size:15px; line-height:1.8;">
      <strong>整体匹配度：${harmonyPct}%</strong><br>
      你当前处于一种“部分一致、部分分散”的状态，是典型的调整期结构。
      说明你的一些领域稳定良好，但也有几个方向需要适度优化。
    </p>

    <p style="font-size:15px; line-height:1.8;">
      <strong>保持稳定的领域包括：</strong><br>
      ${highList}<br>
      这些维度说明你在多个关键生活领域已经建立了相对稳固的节奏。
    </p>

    <p style="font-size:15px; line-height:1.8;">
      <strong>匹配度中等的领域包括：</strong><br>
      ${midList}<br>
      这些领域提示价值感受与现实策略之间存在一定偏差，
      若不调整可能逐渐影响整体节奏。
    </p>

    <p style="font-size:15px; line-height:1.8;">
      <strong>匹配度较低的领域：</strong><br>
      ${lowList || '（无）'}<br>
      这些方向需要被优先关注，但属于“可修复型”差距，不必感到焦虑。
    </p>

    <p style="font-size:15px; line-height:1.8;">
      <strong>未来建议：</strong><br>
      建议从匹配度中等或较低的领域开始，逐项调整优先级、资源投入与期望值，
      能显著提升整体协调性。
    </p>
  `,

  low: ({ harmonyPct, lowList }) => `
    <p style="font-size:15px; line-height:1.8;">
      <strong>整体匹配度：${harmonyPct}%</strong><br>
      目前你的理想（想要）与现实（正在经历）之间存在结构性冲突，
      这是许多人在人生关键节点会遇到的正常现象。
    </p>

    <p style="font-size:15px; line-height:1.8;">
      <strong>匹配度较低的关键领域包括：</strong><br>
      ${lowList}<br>
      这些领域显示你的需求未被满足、环境不一致或行动策略出现偏移。
    </p>

    <p style="font-size:15px; line-height:1.8;">
      请注意，这并不代表失败或问题，而是你的系统需要重新设计。
      许多人的重大突破都发生在类似的结构断层期。
    </p>

    <p style="font-size:15px; line-height:1.8;">
      <strong>未来建议：</strong><br>
      下一步的重点是辨认冲突源头、重新校准需求、调整环境或策略，
      并设计可分阶段执行的恢复方案。
    </p>
  `
};