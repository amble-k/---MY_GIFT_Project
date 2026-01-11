// /data/questions_r.js
// 现实状态（R）题库 - Career / Wealth / Growth / Family / Health / Spiritual / Social
// 配合 computeR 使用（需要 dimension + reverse + text_zh）

const R_QUESTIONS = [
  {
    id: 1,
    code: "Career",
    dimension: "Career",
    reverse: false,
    text_zh: "我对目前的工作成就、地位和认可度感到满意。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 2,
    code: "Wealth",
    dimension: "Wealth",
    reverse: false,
    text_zh: "我对目前的经济状况、收入水平和资产积累感到满意。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 3,
    code: "Growth",
    dimension: "Growth",
    reverse: false,
    text_zh: "我对目前的学习状态和能力提升速度感到满意。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 4,
    code: "Family",
    dimension: "Family",
    reverse: false,
    text_zh: "我对目前的家庭关系、亲密程度和陪伴质量感到满意。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 5,
    code: "Health",
    dimension: "Health",
    reverse: false,
    text_zh: "我对目前的身体状况、精力水平和心理状态感到满意。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 6,
    code: "Spiritual",
    dimension: "Spiritual",
    reverse: false,
    text_zh: "我觉得目前的生活是有意义的，符合我内心的价值观。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 7,
    code: "Social",
    dimension: "Social",
    reverse: false,
    text_zh: "我对目前的社交圈子、人脉质量和社会贡献感感到满意。",
    options: [1, 2, 3, 4, 5]
  }
];

export default R_QUESTIONS;