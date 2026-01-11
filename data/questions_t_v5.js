// data/questions_t_v5.js
// Version: v5.0.0 (WIP)
// 说明：MY GIFT 特质卷 v5 题库（过渡版）
// - 目前题目完全沿用 questions_t.js
// - 后续会在本文件中逐步调整：Big Five / DISC 维度、反向题、结构标签等
// - 逻辑计算仍然以 core/logic_core.js 中的 T_QUESTIONS 为准

// /data/questions_t.js
// Big Five 题目：Ope / Con / Ext / Agr / Neu
// 结构需配合 core/logic_core.js 中的 computeT 使用

const T_QUESTIONS = [
  // Openness 开放性（Ope）
  {
    id: 1,
    code: "T_Ope_1",
    dimension: "T_Ope",
    reverse: false,
    text_zh: "我充满想象力，喜欢尝试新的做事方式。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 2,
    code: "T_Ope_2",
    dimension: "T_Ope",
    reverse: false,
    text_zh: "我对抽象的概念和理论很感兴趣。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 3,
    code: "T_Ope_3",
    dimension: "T_Ope",
    reverse: true, // 反向：偏传统、熟悉的方法
    text_zh: "我习惯用传统、熟悉的方法解决问题。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 4,
    code: "T_Ope_4",
    dimension: "T_Ope",
    reverse: false,
    text_zh: "我有丰富的创意，经常能想出好点子。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 5,
    code: "T_Ope_5",
    dimension: "T_Ope",
    reverse: true, // 反向：难以理解抽象/艺术
    text_zh: "我很难理解那些过于抽象或艺术性的事物。",
    options: [1, 2, 3, 4, 5]
  },

  // Conscientiousness 尽责性（Con）
  {
    id: 6,
    code: "T_Con_1",
    dimension: "T_Con",
    reverse: false,
    text_zh: "我做事非常有条理，喜欢制定计划。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 7,
    code: "T_Con_2",
    dimension: "T_Con",
    reverse: false,
    text_zh: "我总是会把东西放回原处，保持整洁。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 8,
    code: "T_Con_3",
    dimension: "T_Con",
    reverse: true, // 反向：拖延 / 易中断
    text_zh: "我有时候会忘记把事情做完，或者是拖延。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 9,
    code: "T_Con_4",
    dimension: "T_Con",
    reverse: false,
    text_zh: "我非常注重细节，力求完美。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 10,
    code: "T_Con_5",
    dimension: "T_Con",
    reverse: true, // 反向：随性、不守规则
    text_zh: "我做事情比较随性，不喜欢受规则束缚。",
    options: [1, 2, 3, 4, 5]
  },

  // Extraversion 外向性（Ext）
  {
    id: 11,
    code: "T_Ext_1",
    dimension: "T_Ext",
    reverse: false,
    text_zh: "我在聚会中通常是那个活跃气氛的人。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 12,
    code: "T_Ext_2",
    dimension: "T_Ext",
    reverse: false,
    text_zh: "我不介意成为众人关注的焦点。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 13,
    code: "T_Ext_3",
    dimension: "T_Ext",
    reverse: true, // 反向：安静、不爱和陌生人说话
    text_zh: "我比较安静，不太喜欢和陌生人说话。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 14,
    code: "T_Ext_4",
    dimension: "T_Ext",
    reverse: false,
    text_zh: "我喜欢充满刺激和快节奏的生活。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 15,
    code: "T_Ext_5",
    dimension: "T_Ext",
    reverse: true, // 反向：偏独处 / 小圈子
    text_zh: "我更喜欢独处，或者只和少数朋友在一起。",
    options: [1, 2, 3, 4, 5]
  },

  // Agreeableness 宜人性（Agr）
  {
    id: 16,
    code: "T_Agr_1",
    dimension: "T_Agr",
    reverse: false,
    text_zh: "我能够体谅他人的感受，富有同情心。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 17,
    code: "T_Agr_2",
    dimension: "T_Agr",
    reverse: false,
    text_zh: "我乐于助人，即便牺牲一点自己的利益。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 18,
    code: "T_Agr_3",
    dimension: "T_Agr",
    reverse: true, // 反向：强批评性
    text_zh: "如果有必要，我会毫不犹豫地批评别人。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 19,
    code: "T_Agr_4",
    dimension: "T_Agr",
    reverse: false,
    text_zh: "我相信大多数人都是善良和诚实的。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 20,
    code: "T_Agr_5",
    dimension: "T_Agr",
    reverse: true, // 反向：对他人冷漠
    text_zh: "我对别人的问题不感兴趣，那是他们自己的事。",
    options: [1, 2, 3, 4, 5]
  },

  // Neuroticism 神经质（Neu）
  {
    id: 21,
    code: "T_Neu_1",
    dimension: "T_Neu",
    reverse: false,
    text_zh: "我很容易感到焦虑或紧张。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 22,
    code: "T_Neu_2",
    dimension: "T_Neu",
    reverse: false,
    text_zh: "我的情绪波动比较大，容易受环境影响。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 23,
    code: "T_Neu_3",
    dimension: "T_Neu",
    reverse: true, // 反向：压力下能保持冷静（情绪稳定）
    text_zh: "我在压力下通常能保持冷静。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 24,
    code: "T_Neu_4",
    dimension: "T_Neu",
    reverse: false,
    text_zh: "我经常担心事情会变糟。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 25,
    code: "T_Neu_5",
    dimension: "T_Neu",
    reverse: true, // 反向：很少沮丧（情绪稳定）
    text_zh: "我很少感到沮丧或忧郁。",
    options: [1, 2, 3, 4, 5]
  }
];

export default T_QUESTIONS;