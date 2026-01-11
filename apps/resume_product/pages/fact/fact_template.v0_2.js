/**
 * MY GIFT - FACT Page Template Contract
 * v0.2.0
 *
 * 设计意图（可追溯）：
 * - 把“页面结构”从“渲染实现”中剥离：先定模板（WHAT），再改渲染（HOW）
 * - 后续渲染器只消费 spec + data，不再手写 DOM 拼接
 *
 * 可验证点：
 * - spec.sections[*].blocks[*] 结构稳定
 * - 每个 block 都有 id/type/props，便于规则引擎与埋点追踪
 */

export const FACT_SPEC_V0_2 = Object.freeze({
  meta: {
    product: "MY GIFT",
    page: "FACT",
    spec_version: "0.2.0",
    locale: "ja-JP", // 先对齐你既定的日式UI规范；后续可动态
  },

  /**
   * sections 是页面的“骨架”
   * blocks 是每个区块（卡片/图/表/提示）
   * 渲染器只需要做：sections -> blocks 的映射
   */
  sections: [
    {
      id: "fact_summary",
      title: { zh: "事实概览", ja: "サマリー" },
      blocks: [
        {
          id: "fact_kpis",
          type: "kpi_row",
          props: {
            items: [
              { key: "Harmony", label: { zh: "一致度", ja: "一致度" }, format: "percent_0_100" },
              { key: "TopPatterns", label: { zh: "Top模式", ja: "上位パターン" }, format: "list_top3" },
              { key: "RiskFlags", label: { zh: "风险提示", ja: "注意点" }, format: "tags" },
            ],
          },
        },
      ],
    },

    {
      id: "fact_vectors",
      title: { zh: "向量事实", ja: "ベクトル" },
      blocks: [
        { id: "fact_T", type: "radar_T_big5", props: { source: "T_vector" } },
        { id: "fact_M", type: "bar_M_sdt", props: { source: "M_vector" } },
        { id: "fact_V", type: "bar_V_values", props: { source: "V_vector", topN: 8 } },
      ],
    },

    {
      id: "fact_gaps",
      title: { zh: "差距与冲突", ja: "ギャップ" },
      blocks: [
        {
          id: "fact_gap_table",
          type: "table_gap_v7",
          props: { source: "Gap_vector", sort: "desc" },
        },
        {
          id: "fact_gap_hint",
          type: "hint_box",
          props: {
            tone: "neutral",
            text: {
              zh: "这里先展示客观差距，叙事解释留到 Report 层。",
              ja: "ここでは客観的なギャップのみを表示し、解釈はレポート層に分離します。",
            },
          },
        },
      ],
    },

    {
      id: "fact_trace",
      title: { zh: "可追溯信息", ja: "トレーサビリティ" },
      blocks: [
        {
          id: "fact_rule_refs",
          type: "trace_refs",
          props: {
            fields: [
              "T_vector",
              "M_vector",
              "V_vector",
              "Gap_vector",
              "Patterns",
              "RULE_IDS",
            ],
          },
        },
      ],
    },
  ],

  /**
   * data_contract 定义渲染器期望的数据形状（和你既定 KASH_PROFILE 对齐）
   * 后续会用于质量闸门：完整性校验 & schema 校验
   */
  data_contract: {
    required: [
      "T_vector",
      "M_vector",
      "V_vector",
      "Gap_vector",
      "Harmony",
      "Patterns",
    ],
    optional: ["RULE_IDS", "RiskFlags"],
  },
});

/**
 * 轻量校验：仅用于开发期提示（不抛异常，返回 errors）
 * 后续 v0.3+ 可升级为严格 schema 校验
 */
export function validateFactData_v0_2(profileLike) {
  const errors = [];
  const req = FACT_SPEC_V0_2.data_contract.required;
  for (const k of req) {
    if (profileLike == null || profileLike[k] == null) errors.push(`Missing required field: ${k}`);
  }
  return { ok: errors.length === 0, errors };
}