// /data/career_mapping.js
// 职业方向建议（简版骨架）
// 维度：topMotive (A/C/R) × topValue (7 大价值)

// 结构说明：
// category: 职业大类
// roles: 典型角色（列表）
// environment: 推荐组织环境
// avoid: 需要避免的风险角色 / 环境

export const CAREER_MAP = {
  A: {
    Growth: {
      category: "创新与探索型职业",
      roles: ["产品策划 / 增长产品经理", "创新项目负责人", "战略研究 / 新业务探索"],
      environment: "节奏较快、允许试错、鼓励自主决策的团队；对结果有要求，但过程有弹性。",
      avoid: "高度流程化、几乎没有调整空间，只强调执行不鼓励思考的岗位。"
    },
    Career: {
      category: "自主成长型专业人士",
      roles: ["自由职业顾问", "专业教练 / 培训师", "内容创作者 / 自媒体运营"],
      environment: "对成果负责但工作方式高度自主，可以自己规划节奏与路径。",
      avoid: "层级非常森严、需要完全服从指令、不鼓励个人表达的组织文化。"
    },
    Wealth: {
      category: "机会捕捉与资源整合型岗位",
      roles: ["创业合伙人", "商务拓展 BD", "投资 / 创投相关岗位（早期项目）"],
      environment: "信息流密集、决策速度快、可以快速试错并从中学习的环境。",
      avoid: "过度稳定、薪资增长极慢且缺乏上升通道的岗位。"
    }
  },
  C: {
    Career: {
      category: "专业深耕与管理晋升型职业",
      roles: ["项目经理 / PM", "职能部门骨干（财务、人力、运营）", "技术或业务线负责人"],
      environment: "目标清晰、评价标准明确，有清晰晋升路径与培训支持的组织。",
      avoid: "长期缺乏反馈、缺少标准、只凭关系和情绪做决策的职场环境。"
    },
    Wealth: {
      category: "稳健成长型职业 + 专业型副业",
      roles: ["金融 / 财务相关岗位", "数据分析 / 风控", "精细化运营"],
      environment: "对细节要求高、流程规范、对风险有敏感度的组织。",
      avoid: "极度混乱、经常“今天一个说法明天一个说法”的环境。"
    },
    Growth: {
      category: "学习曲线陡峭的技能型职位",
      roles: ["技术研发 / 工程师", "咨询顾问 / 行业分析", "高强度学习型岗位"],
      environment: "有系统培训、项目难度逐步升级，同时有导师或前辈带领。",
      avoid: "重复性极高、几年下来技能基本不升级的工作内容。"
    }
  },
  R: {
    Family: {
      category: "高质量陪伴与稳定兼顾型职业",
      roles: ["稳定型专业服务（心理、教育、护理）", "行政 / 内勤支持类岗位", "远程 / 弹性办公岗位"],
      environment: "可以兼顾家庭时间、人际氛围温和的公司或机构。",
      avoid: "长期高强度出差、作息极度不规律、影响家庭稳定感的职业路径。"
    },
    Social: {
      category: "关系经营与链接资源型职业",
      roles: ["客户成功 / 客户经理", "社区运营 / 活动策划", "公关 / 品牌合作"],
      environment: "重视长期关系、节奏适中、强调信任建设的团队。",
      avoid: "完全以短期业绩为唯一标准、忽略关系质量的高压销售环境。"
    },
    Health: {
      category: "助人型与照护型职业",
      roles: ["心理 / 教练 / 咨询", "健康管理 / 营养 / 运动相关", "教育陪伴类角色"],
      environment: "同事之间互相支持、有明确界限、不鼓励情绪消耗型付出的环境。",
      avoid: "需要长期压抑自我感受、只强调“付出”而缺乏支持机制的角色。"
    }
  }
};

// 简单的工具函数：根据 topMotive & topValue 取一条建议
export function getCareerAdvice(topMotive, topValue) {
  const byM = CAREER_MAP[topMotive] || {};
  const res = byM[topValue] || {};

  return {
    category: res.category || "多元发展型职业组合（暂未精确匹配）",
    roles: Array.isArray(res.roles) ? res.roles : (res.roles ? [res.roles] : []),
    environment: res.environment || "建议优先选择能够给予你一定自主空间、评价标准相对清晰的团队。",
    avoid: res.avoid || "暂时没有需要刻意回避的职能类型，但尽量避免严重消耗精力且缺乏成长性的岗位。"
  };
}

export default { CAREER_MAP, getCareerAdvice };