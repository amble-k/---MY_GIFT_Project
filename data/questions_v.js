// /data/questions_v.js
// 价值观（V）题库 - Career / Wealth / Growth / Family / Health / Spiritual / Social
// 配合 computeV 使用（需含 dimension + reverse + text_zh）

const V_QUESTIONS = [
  {
    id: 1,
    code: "Career",
    dimension: "Career",
    reverse: false,
    text_zh: "在工作中取得显性成就、获得行业认可和社会地位。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 2,
    code: "Wealth",
    dimension: "Wealth",
    reverse: false,
    text_zh: "获得经济自由，拥有充足的资产积累和金钱安全感。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 3,
    code: "Growth",
    dimension: "Growth",
    reverse: false,
    text_zh: "不断学习新知，突破能力边界，实现自我迭代与升级。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 4,
    code: "Family",
    dimension: "Family",
    reverse: false,
    text_zh: "维护家庭和睦，有高质量的时间陪伴家人，建立亲密连接。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 5,
    code: "Health",
    dimension: "Health",
    reverse: false,
    text_zh: "保持充沛的身体活力、规律的作息和内心平和的状态。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 6,
    code: "Spiritual",
    dimension: "Spiritual",
    reverse: false,
    text_zh: "寻找并践行人生意义，追求精神世界的富足与一致性。",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 7,
    code: "Social",
    dimension: "Social",
    reverse: false,
    text_zh: "建立广泛的人脉网络，服务社区，产生积极的社会影响。",
    options: [1, 2, 3, 4, 5]
  }
];
// ===============
// V 价值观排序题（系统识别用）
// ===============
// 用户将在 UI 的第二步对这 7 个维度排序
export const V_SORT_KEYS = [
  "Career",
  "Wealth",
  "Growth",
  "Family",
  "Health",
  "Spiritual",
  "Social"
];
export default V_QUESTIONS;