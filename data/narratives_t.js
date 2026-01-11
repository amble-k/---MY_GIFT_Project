/**
 * /data/narratives_t.js (Phase 3 FINAL - Full Depth Content)
 * 职责：提供 T (特质) 的 L1 深度拆解和 L2 综合分析
 * 包含字段：task_behavior, relation_behavior, stress_behavior, strengths, risks
 */

// ============================================================
// 1. T_L1 单维度深度解析 (5维度 x High/Mid/Low)
// ============================================================
export const T_L1 = {
    // --- 开放性 (Ope) ---
    "T_Ope_high": {
        zh: {
            core_style: "你具备强烈的好奇心、创造性思维与探索精神。",
            description: "你喜欢探索新事物，思维活跃，不拘泥于传统。你倾向于用非线性的方式思考问题。",
            task_behavior: "喜欢从零到一的创新任务，擅长头脑风暴和策略构思，厌恶重复机械的工作。",
            relation_behavior: "在沟通中喜欢讨论概念、未来和可能性，容易被有见识的人吸引。",
            stress_behavior: "在被过度管控或缺乏变化的环境中，会感到窒息并失去动力。",
            strengths: ["创新思维强", "适应变化快", "富有远见"],
            risks: ["容易三分钟热度", "忽视执行细节", "想法过于跳跃"]
        }
    },
    "T_Ope_mid": {
        zh: {
            core_style: "你喜欢适度的新鲜感，但也需要稳定结构。",
            description: "你能接受新想法，也能务实落地。在创新与传统之间保持着良好的平衡。",
            task_behavior: "能执行标准流程，也能在必要时进行微创新，适应性很强。",
            relation_behavior: "能与不同类型的人顺畅交流，既能谈落地也能谈理想。",
            stress_behavior: "在极度混乱或极度死板的环境中都会感到不适。",
            strengths: ["务实且灵活", "平衡感好", "沟通适应性强"],
            risks: ["可能在创新与保守间犹豫", "缺乏鲜明的个人标签"]
        }
    },
    "T_Ope_low": {
        zh: {
            core_style: "你偏好稳定、可预测、传统、经验值高的方式。",
            description: "你重视“做过、有效、安全”的路径，是典型的务实主义者。",
            task_behavior: "擅长执行标准化、流程化任务，注重细节和可操作性。",
            relation_behavior: "沟通直接、具体，不喜欢空谈理论，看重实际经验。",
            stress_behavior: "面对突发变化或模糊指令时会感到焦虑，需要明确指引。",
            strengths: ["执行稳健", "风险控制力强", "注重实际产出"],
            risks: ["抗拒变革", "对新事物接受度低", "显得刻板"]
        }
    },

    // --- 尽责性 (Con) ---
    "T_Con_high": {
        zh: {
            core_style: "你追求高标准、可控性、计划性与稳定执行。",
            description: "你做事有计划、有条理，非常重视承诺与执行，是团队的定海神针。",
            task_behavior: "极度自律，擅长制定计划并严格执行，对质量有极高要求。",
            relation_behavior: "表现专业、可靠，但也可能显得严肃，对他人的随意容忍度低。",
            stress_behavior: "在混乱或失控局面下，会试图通过加倍努力来控制局面，易过度劳累。",
            strengths: ["执行力极强", "高度负责", "细节完美"],
            risks: ["完美主义", "缺乏灵活性", "容易给自己过大压力"]
        }
    },
    "T_Con_mid": {
        zh: {
            core_style: "你能维持基本的纪律，但不会过度严格。",
            description: "你做事有条理但懂得变通，能在规则与效率之间找到平衡。",
            task_behavior: "能按时完成任务，但允许过程中有弹性调整，关注结果多于形式。",
            relation_behavior: "随和且可靠，好相处，不会给他人造成过大压迫感。",
            stress_behavior: "任务堆积时可能会感到焦虑，需要重新梳理优先级。",
            strengths: ["灵活可靠", "适应性好", "压力管理适中"],
            risks: ["在极高标准要求下可能不够细致"]
        }
    },
    "T_Con_low": {
        zh: {
            core_style: "你重视“自由感、灵活度”胜于“标准与流程”。",
            description: "你喜欢保持弹性，不拘小节，擅长应对突发变化和多线程任务。",
            task_behavior: "喜欢即兴发挥，擅长处理紧急情况，但讨厌死板的计划和截止日期。",
            relation_behavior: "轻松随意，不拘礼节，但也可能让人觉得不够靠谱。",
            stress_behavior: "面对严格监管或繁琐流程时，会选择逃避或拖延。",
            strengths: ["应变能力强", "思维灵活", "擅长多任务处理"],
            risks: ["组织性差", "容易拖延", "细节错误多"]
        }
    },

    // --- 外向性 (Ext) ---
    "T_Ext_high": {
        zh: {
            core_style: "你从外界刺激、人群互动、行动速度中获得能量。",
            description: "你热情洋溢，喜欢表达和社交，是团队的能量源和推动者。",
            task_behavior: "喜欢快节奏、多互动的任务，擅长公关、销售或团队协调。",
            relation_behavior: "主动、健谈，喜欢成为焦点，能快速建立人脉。",
            stress_behavior: "被孤立或限制表达时会感到沮丧，容易冲动决策。",
            strengths: ["社交影响力强", "充满活力", "行动迅速"],
            risks: ["听不进他人意见", "容易冲动", "忽视深度思考"]
        }
    },
    "T_Ext_mid": {
        zh: {
            core_style: "你在适度社交中感到愉快，但也享受独处。",
            description: "你能“开关自如”，在需要时活跃，在需要时安静。",
            task_behavior: "既能独立工作，也能胜任团队协作，适应性很强。",
            relation_behavior: "沟通得体，是很好的倾听者也是表达者。",
            stress_behavior: "在过度社交或过度封闭的环境中都会感到疲惫。",
            strengths: ["动静皆宜", "沟通平衡", "适应多场景"],
            risks: ["可能缺乏极其鲜明的个人风格"]
        }
    },
    "T_Ext_low": {
        zh: {
            core_style: "你的能量来自独处、安静、结构化的环境。",
            description: "你内敛深沉，喜欢深度思考，做事专注，不依赖外界评价。",
            task_behavior: "擅长需要深度分析、专注力和独立思考的任务。",
            relation_behavior: "话不多但有分量，偏好一对一的深度交流，回避无效社交。",
            stress_behavior: "在嘈杂、强迫社交的环境中会迅速耗尽能量并退缩。",
            strengths: ["专注力强", "思考深刻", "独立性高"],
            risks: ["沟通被动", "显得冷漠", "错失社交机会"]
        }
    },

    // --- 宜人性 (Agr) ---
    "T_Agr_high": {
        zh: {
            core_style: "你温和、共情、体贴，优先考虑“关系质量”。",
            description: "你非常在乎他人的感受，乐于助人，是团队的粘合剂。",
            task_behavior: "倾向于合作型任务，关注团队和谐，避免竞争和冲突。",
            relation_behavior: "温暖、包容、信任他人，是极好的倾听者和支持者。",
            stress_behavior: "面对人际冲突时会极度焦虑，倾向于妥协或牺牲自己。",
            strengths: ["极具亲和力", "团队协作佳", "富有同情心"],
            risks: ["难以拒绝", "缺乏主见", "容易受人影响"]
        }
    },
    "T_Agr_mid": {
        zh: {
            core_style: "你合作、体贴，但也懂得设界线。",
            description: "你是“讲道理的温柔”，既能顾及他人，也能坚持原则。",
            task_behavior: "能平衡人情与公事，是理想的合作伙伴。",
            relation_behavior: "友善但有底线，能理性处理人际分歧。",
            stress_behavior: "在原则被触碰时会表现出强硬的一面。",
            strengths: ["情商高", "处事圆融", "有原则的友善"],
            risks: ["偶尔在坚持与妥协间纠结"]
        }
    },
    "T_Agr_low": {
        zh: {
            core_style: "你讲原则、讲效率、讲事实，不喜欢绕弯子。",
            description: "你理性、直率，甚至带有批判性，只对事不对人。",
            task_behavior: "结果导向，敢于做出艰难决定，不惧怕冲突。",
            relation_behavior: "直接、犀利，可能显得咄咄逼人，不擅长情感抚慰。",
            stress_behavior: "在低效或情绪化的环境中会变得暴躁和挑剔。",
            strengths: ["理性客观", "敢于挑战", "决策果断"],
            risks: ["人际关系紧张", "被视为冷酷", "缺乏同理心"]
        }
    },

    // --- 情绪性 (Neu) ---
    // 注意：High = 敏感/焦虑, Low = 稳定/抗压
    "T_Neu_high": {
        zh: {
            core_style: "你情绪敏感，对压力、评价、风险高度敏锐。",
            description: "你拥有丰富的情感体验，能察觉细微的危机，但也容易焦虑。",
            task_behavior: "做事谨慎，反复检查，对风险极度关注，适合风控类工作。",
            relation_behavior: "敏感细腻，能感知他人情绪，但也容易过度解读。",
            stress_behavior: "压力下容易情绪失控、失眠或自我怀疑。",
            strengths: ["危机意识强", "情感细腻", "自我反省深刻"],
            risks: ["情绪波动大", "抗压能力弱", "容易内耗"]
        }
    },
    "T_Neu_mid": {
        zh: {
            core_style: "你情绪敏锐但可调节，压力会影响你但不会压垮你。",
            description: "你有正常的情绪起伏，能在大多数情况下自我消化负面情绪。",
            task_behavior: "在常态下表现稳定，遇到重大挫折需要时间恢复。",
            relation_behavior: "能理解他人的情绪，也能保持一定的界限。",
            stress_behavior: "压力大时会寻求倾诉或暂停工作。",
            strengths: ["情绪适中", "具备同理心", "自我调节尚可"],
            risks: ["偶尔受情绪干扰效率"]
        }
    },
    "T_Neu_low": {
        zh: {
            core_style: "你情绪稳定、不容易紧张、天生具有“心理缓冲力”。",
            description: "你冷静、从容，即便在危机中也能保持理智。",
            task_behavior: "极度抗压，临危不乱，能稳定输出，适合高压工作。",
            relation_behavior: "情绪平稳，给人安全感，但也可能被认为缺乏激情。",
            stress_behavior: "在极端压力下依然能保持功能运作，甚至显得冷漠。",
            strengths: ["极强抗压", "情绪稳定", "理性客观"],
            risks: ["可能忽视他人情绪", "显得过于冷淡", "缺乏危机感"]
        }
    }
};

// ============================================================
// 2. T_L2 特质组合 (10种双高组合) - 补全深度分析字段
// ============================================================
export const T_L2_patterns = {
    "pattern_T_Agr_high_T_Con_high": {
        zh: {
            title: "和谐执行者 (A x C)",
            desc: "你既负责又合作，是团队中最稳定且温和的执行力量。",
            relation: "以温和的方式坚持原则，是团队中值得信赖的伙伴。",
            decision: "决策时会同时考虑“是否合规”和“是否伤人”。",
            stress: "当任务标准与人际和谐冲突时，会感到极大的内心撕裂。"
        }
    },
    "pattern_T_Agr_high_T_Ext_high": {
        zh: {
            title: "氛围型协作者 (A x E)",
            desc: "你兼具社交能量与高合作性，是团队的社交协调者。",
            relation: "热情友善，主动联络，是团队的开心果和润滑剂。",
            decision: "倾向于群体决策，大家开心最重要。",
            stress: "被孤立或发生冲突时，能量会迅速枯竭。"
        }
    },
    "pattern_T_Agr_high_T_Neu_high": {
        zh: {
            title: "情绪型支持者 (A x N)",
            desc: "你结合了高共情与高敏感，是团队中的“情感支持者”。",
            relation: "极度敏感他人需求，总是优先照顾别人。",
            decision: "基于情感和他人评价做决定，优柔寡断。",
            stress: "容易承担他人的情绪垃圾，导致自我崩溃。"
        }
    },
    "pattern_T_Agr_high_T_Ope_high": {
        zh: {
            title: "和谐创新者 (A x O)",
            desc: "你具备开放与和谐两种特质，倾向以包容方式推动创新。",
            relation: "乐于分享观点，也善于倾听不同意见。",
            decision: "寻找双赢的创新方案，不激进。",
            stress: "当创新想法被无情打压时，会选择沉默。"
        }
    },
    "pattern_T_Con_high_T_Ext_high": {
        zh: {
            title: "推动型执行者 (C x E)",
            desc: "你把高执行力与外向影响力结合，是团队的驱动引擎。",
            relation: "强势直接，目标导向，对事不对人。",
            decision: "果断迅速，看重效率和结果。",
            stress: "当进度缓慢或他人拖延时，会变得暴躁易怒。"
        }
    },
    "pattern_T_Con_high_T_Neu_high": {
        zh: {
            title: "高压力执行者 (C x N)",
            desc: "你有高标准与高敏感两种特质，容易在压力下提升执行。",
            relation: "谨慎小心，害怕犯错，给人距离感。",
            decision: "反复确认细节，规避所有风险。",
            stress: "容易陷入细节纠结和自我怀疑的死循环。"
        }
    },
    "pattern_T_Con_high_T_Ope_high": {
        zh: {
            title: "创新执行者 (C x O)",
            desc: "你结合了高度开放性与高度尽责性，是“创新 × 落地”复合型人才。",
            relation: "专业、理智，喜欢与聪明人共事。",
            decision: "既有远见又有计划，也是最理想的决策者。",
            stress: "当创新被繁琐流程束缚时，会感到极度挫败。"
        }
    },
    "pattern_T_Ext_high_T_Neu_high": {
        zh: {
            title: "情绪型沟通者 (E x N)",
            desc: "你具备外向表达力与高情绪敏感，是“情绪型影响者”。",
            relation: "情绪外露，喜怒形于色，感染力强。",
            decision: "冲动、直觉导向，容易后悔。",
            stress: "压力下容易情绪爆发或大起大落。"
        }
    },
    "pattern_T_Ext_high_T_Ope_high": {
        zh: {
            title: "创意推动者 (E x O)",
            desc: "你将开放性思维与外向能量结合，是团队的创意引擎。",
            relation: "充满激情，喜欢头脑风暴和分享点子。",
            decision: "快速、冒险，喜欢尝试新鲜事物。",
            stress: "在枯燥、重复的环境中会迅速失去兴趣。"
        }
    },
    "pattern_T_Neu_high_T_Ope_high": {
        zh: {
            title: "情绪型创造者 (N x O)",
            desc: "你具备强感受力与高创新力，是“敏感型洞察者”。",
            relation: "深沉、独特，有时显得若即若离。",
            decision: "基于深刻的直觉和情感共鸣。",
            stress: "容易陷入消极幻想或过度解读环境信号。"
        }
    }
};

// 默认导出
export default {
    T_L1,
    T_L2_patterns
};