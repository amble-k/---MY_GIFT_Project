// /data/questions_m.js
// SDT 动机题目：Autonomy / Relatedness / Competence
// 结构需配合 core/logic_core.js 中的 computeM 使用

const M_QUESTIONS = [
  // Autonomy 自主性（A）
  {
    id: 1,
    code: "M_A_1",
    dimension: "M_A",
    reverse: false,
    text_zh: "在重要事情上，我常常觉得自己是在做主动的选择与决定。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 2,
    code: "M_A_2",
    dimension: "M_A",
    reverse: false,
    text_zh: "当我能用自己的方式推进事情时，我会更有动力。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 3,
    code: "M_A_3",
    dimension: "M_A",
    reverse: true, // 反向题：配合别人、缺少选择感
    text_zh: "我经常只是配合周围的人行动，很少有自己在选择的感觉。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 4,
    code: "M_A_4",
    dimension: "M_A",
    reverse: false,
    text_zh: "在可以按照自己节奏工作的环境中，我更容易发挥。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 5,
    code: "M_A_5",
    dimension: "M_A",
    reverse: true, // 反向题：习惯按别人指示行动
    text_zh: "我更习惯按别人指示行动，并不太喜欢自己做决定。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 6,
    code: "M_A_6",
    dimension: "M_A",
    reverse: false,
    text_zh: "当我觉得“这是我自己选择的道路”时，我会更积极。",
    options: [1, 2, 3, 4, 5]
  },

  // Relatedness 关系性（R）
  {
    id: 7,
    code: "M_R_1",
    dimension: "M_R",
    reverse: false,
    text_zh: "我觉得自己在团队中是被接纳和被关心的。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 8,
    code: "M_R_2",
    dimension: "M_R",
    reverse: false,
    text_zh: "我身边有真正了解我、支持我的人。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 9,
    code: "M_R_3",
    dimension: "M_R",
    reverse: true, // 反向题：孤单、隔绝感
    text_zh: "在工作中，我经常感到孤单或与人隔绝。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 10,
    code: "M_R_4",
    dimension: "M_R",
    reverse: false,
    text_zh: "我非常看重与同事或伙伴之间的信任关系。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 11,
    code: "M_R_5",
    dimension: "M_R",
    reverse: true, // 反向题：觉得没人关心
    text_zh: "我觉得在这个环境中，没有人真正在乎我的感受。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 12,
    code: "M_R_6",
    dimension: "M_R",
    reverse: false,
    text_zh: "与他人建立深厚的连接对我来说很重要。",
    options: [1, 2, 3, 4, 5]
  },

  // Competence 能力感（C）
  {
    id: 13,
    code: "M_C_1",
    dimension: "M_C",
    reverse: false,
    text_zh: "我有能力处理好目前面临的大部分挑战。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 14,
    code: "M_C_2",
    dimension: "M_C",
    reverse: false,
    text_zh: "我在不断学习新技能，并感到自己在变强。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 15,
    code: "M_C_3",
    dimension: "M_C",
    reverse: true, // 反向题：担心能力不足
    text_zh: "我经常担心自己能力不足，无法胜任工作。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 16,
    code: "M_C_4",
    dimension: "M_C",
    reverse: false,
    text_zh: "当我克服困难完成任务时，我会感到巨大的满足。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 17,
    code: "M_C_5",
    dimension: "M_C",
    reverse: true, // 反向题：无从下手
    text_zh: "对于交给我的任务，我经常感到无从下手。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 18,
    code: "M_C_6",
    dimension: "M_C",
    reverse: false,
    text_zh: "我相信只要努力，我就能掌握大部分需要的技能。",
    options: [1, 2, 3, 4, 5]
  }
];

export default M_QUESTIONS;