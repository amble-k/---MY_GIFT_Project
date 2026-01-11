/**
 * /data/narratives_core.js
 * 模块：核心整合 (Core Integration) 内容库 (V6.1)
 * 职责：
 *   1) 冰山 12 型模式说明（pattern_1 ~ pattern_12）
 *   2) KASH 入口文案（S / H / A / K）
 *   3) 综合总结模板（一句话 / M / T / V / Gap / KASH 六段）
 *   4) 基础 label 映射（M / T / V / Gap → 中文标签）
 */

// ============================================================
// 1. 冰山类型内容库 (12 型)
// ============================================================
const iceberg_patterns = {
  pattern_1: {
    key: 'pattern_1',
    title: '自主 × 创造型冰山',
    name: '自主型动力 (A-Driven)',
    layer_summary: '你的动力结构以强烈的自主需求为核心。',
    deep: '深层动机：自由选择权、自主性与方法创新。',
    middle: '中层行为：高度开放、想象力强、创造力旺盛。',
    surface: '表层价值：追求表达、自主创造、差异化。',
    description:
      '你是一种以「自由与掌控权」为核心驱动的人格动力结构。你在能主导、能选择的环境中最强。你的行为偏向独立、快速；价值偏向自由、成长。',
    tension_points:
      '当环境过度结构化、规则僵化时，你会立刻失去动力。',
    development_direction:
      '适合高自主度的角色：策略、创新、自由职业。'
  },
  pattern_2: {
    key: 'pattern_2',
    title: '关系 × 和谐型冰山',
    name: '关系型动力 (R-Driven)',
    layer_summary: '你的动力结构由强烈的关系需求驱动。',
    deep: '深层动机：渴望被理解、被看见、情绪安全。',
    middle: '中层行为：追求关系和谐、人际平衡。',
    surface: '表层价值：重视支持、温暖、和平的生活方式。',
    description:
      '你的生命动力核心是关系。你从连结中获得能量。你的行为温暖、体贴；价值观指向家庭、人际。',
    tension_points:
      '当关系紧张、角色冲突或情绪断联时，你会迅速失去能量。',
    development_direction:
      '适合高人际密度的职业：HR、教育、服务、管理。'
  },
  pattern_3: {
    key: 'pattern_3',
    title: '成就 × 尽责型冰山',
    name: '能力型动力 (C-Driven)',
    layer_summary: '你的动力结构以「掌握、胜任、变强」为核心。',
    deep: '深层动机：追求成效、掌握、自我提升。',
    middle: '中层行为：结构化、系统化、稳健执行。',
    surface: '表层价值：偏好事业成功、专业能力、长期稳定。',
    description:
      '你追求的是「变强」与「做得更好」。你行为中呈现严谨、努力；价值观中呈现成就、成长。',
    tension_points: '你容易在「怕失败」与「要表现」之间挣扎。',
    development_direction:
      '适合专业性、技术性、需要成长曲线的角色。'
  },
  pattern_4: {
    key: 'pattern_4',
    name: '自主×成长模式',
    title: '自主 × 成长型冰山',
    layer_summary: '你是以自主为底盘，以成长为核心方向的推进型人格。',
    deep: '深层动机：自主探索与方法创新。',
    middle: '中层行为：灵活学习、尝试新事物。',
    surface: '表层价值：持续突破、自我升级。',
    description:
      '你是一种「越自由越成长」的类型。你喜欢自行选择学习内容，通过不断尝新来扩展能力。',
    tension_points:
      '当环境束缚或成长空间被封锁时，你会反弹式逃离。',
    development_direction:
      '适合学习自由度高的职业：创意、设计、咨询。'
  },
  pattern_5: {
    key: 'pattern_5',
    name: '自主×自由模式',
    title: '自主 × 自由型冰山',
    layer_summary: '你的动力结构是典型的自由灵魂。',
    deep: '深层动机：极致的自由与不受控。',
    middle: '中层行为：随性、灵活、抗拒规则。',
    surface: '表层价值：选择权、生活弹性。',
    description:
      '你属于「我是我」的类型。最重要的是能自由选择、自由行动。限制、规则会让你迅速脱离。',
    tension_points: '容易在“自由”与“执行”之间冲突。',
    development_direction:
      '适合高度弹性的环境：自由职业、创新工作。'
  },
  pattern_6: {
    key: 'pattern_6',
    name: '能力×成就模式',
    title: '能力 × 成就型冰山',
    layer_summary: '能力底盘与成就价值双重强化，高绩效人格。',
    deep: '深层动机：掌握感与胜任力。',
    middle: '中层行为：高标准执行、目标导向。',
    surface: '表层价值：社会地位、显性成果。',
    description:
      '你的目标明确、执行力强。你的人生逻辑是：提升能力 → 创造成果 → 实现成就。',
    tension_points: '容易压力过大、自我要求过高。',
    development_direction:
      '适合快速成长行业：管理、科技、专业人士。'
  },
  pattern_7: {
    key: 'pattern_7',
    name: '能力×财富模式',
    title: '能力 × 财富型冰山',
    layer_summary: '能力动机与财富价值强烈连接。',
    deep: '深层动机：通过能力获取资源安全感。',
    middle: '中层行为：稳健、规划、风险控制。',
    surface: '表层价值：经济自由、资产积累。',
    description:
      '你的人生模式是典型的「专业换资源」。你用能力提升价值，用资源提升安全感。',
    tension_points: '可能因过度追求稳定而压抑情感。',
    development_direction:
      '适合财经、技术、长期累积型产业。'
  },
  pattern_8: {
    key: 'pattern_8',
    name: '关系×家庭模式',
    title: '关系 × 家庭型冰山',
    layer_summary: '关系为底盘、家庭为最高价值。',
    deep: '深层动机：归属感与情感连接。',
    middle: '中层行为：守护、支持、陪伴。',
    surface: '表层价值：家庭幸福、亲密关系。',
    description:
      '你比任何价值更看重陪伴、关怀、稳定关系。你的人际温度高，对家人非常投入。',
    tension_points: '你容易在人际照顾中牺牲自己。',
    development_direction:
      '适合教育、照护、协作型行业。'
  },
  pattern_9: {
    key: 'pattern_9',
    name: '关系×社会贡献模式',
    title: '关系 × 贡献型冰山',
    layer_summary: '关系动机延伸到更广的社会关怀。',
    deep: '深层动机：被需要感与利他心。',
    middle: '中层行为：热心、参与、连接。',
    surface: '表层价值：社会责任、助人。',
    description:
      '你是带有「使命感」的关系型人格。你认为人生不只是自己，而是你能为他人带来什么。',
    tension_points: '容易过度付出、疲乏、承担太多责任。',
    development_direction:
      '适合公益、心理、人力、管理等利他型职业。'
  },
  pattern_10: {
    key: 'pattern_10',
    name: '能力×自主冲突型',
    title: '能力 vs 自主冲突型',
    layer_summary: '强能力动机，但与自主性存在张力。',
    deep: '深层动机：渴望表现但拒绝被管。',
    middle: '中层行为：在投入与抗拒间摆荡。',
    surface: '表层价值：既要成就又要自由。',
    description:
      '你是「我想做得好，但我不要被逼」的人格结构。你希望提升，却又讨厌别人要求你提升。',
    tension_points:
      '任务压力大时，你逃避；自由太多时，你又缺乏动力。',
    development_direction:
      '建立个人节奏与目标系统，强化自我管理。'
  },
  pattern_11: {
    key: 'pattern_11',
    name: '关系×自主冲突型',
    title: '关系 vs 自主冲突型',
    layer_summary: '关系需求与自主需求之间存在天然张力。',
    deep: '深层动机：渴望亲密又恐惧束缚。',
    middle: '中层行为：若即若离，忽冷忽热。',
    surface: '表层价值：既要独立又要陪伴。',
    description:
      '你是「既想靠近，也想远离」的动力结构。你渴望亲密，但又害怕被吞没。',
    tension_points:
      '最主要张力是：“靠太近不舒服，离太远会孤单”。',
    development_direction:
      '建立「有界限的亲密」，保持人际节奏。'
  },
  pattern_12: {
    key: 'pattern_12',
    name: '理想 vs 行为张力型',
    title: '理想 vs 行为张力型',
    layer_summary: '价值与行为之间存在不一致性。',
    deep: '深层动机：动力方向分散或冲突。',
    middle: '中层行为：执行力无法支撑愿景。',
    surface: '表层价值：高期待与低行动的落差。',
    description:
      '你常感到内在冲突：知道自己想要什么，但行为习惯无法配合。这是一种高度敏锐却行动困难的类型。',
    tension_points:
      '你容易在“想做好”与“做不到”之间自我压力化。',
    development_direction:
      '建立微习惯（Tiny Habits）来减少落差。'
  }
};

// ============================================================
// 2. KASH 入口文案（基础版 – 先打通结构）
// ============================================================
const kash_entry_narratives = {
  S: {
    key: 'S',
    title: 'S – 技能 / 方法 (Skill)',
    why: '你目前的整体结构已经比较一致，接下来更适合通过具体技能与方法升级，把优势放大成稳定能力。',
    risk: '如果只停留在“想法”和“意识”层面，而不把它们落实成方法，你的成长曲线会变得很慢。'
  },
  H: {
    key: 'H',
    title: 'H – 习惯 (Habit)',
    why: '你的动力不缺，但节奏容易被打断，需要稳定可持续的习惯来托住行动。',
    risk: '如果每次只靠情绪冲劲，很容易出现“高开低走”的循环，久而久之会怀疑自己的稳定性。'
  },
  A: {
    key: 'A',
    title: 'A – 态度 / 心态 (Attitude)',
    why: '你在能力与资源上并不薄弱，更多卡在“怎么看自己、怎么看风险”的态度上。',
    risk: '如果持续保持过度自我批评或完美主义，很容易把本来可以尝试的机会，先在心里否决掉。'
  },
  K: {
    key: 'K',
    title: 'K – 知识 / 视野 (Knowledge)',
    why: '你的执行力与习惯都还不错，但在关键判断上需要更系统的知识与视野做支撑。',
    risk: '如果知识结构不升级，容易在瓶颈处反复撞墙，感觉“很努力但天花板没突破”。'
  }
};

// ============================================================
// 3. 综合总结模板 (Synthesis Templates)
//   这里不写死具体文案，而是用 placeholder，
//   真正的中文段落放在 render_text.js 里按这些信息组装。
// ============================================================
const synthesis_templates = {
  // 一句话核心定义
  one_liner: {
    template:
      '你是一位由「{{M_label}}」驱动、以「{{T_label}}」方式行事、' +
      '并正朝向「{{V_label}}」前进的人。当前你的人生结构整体匹配度约为 {{Harmony_pct}}。'
  },
  // ① 整体匹配度区块用的提示 label
  block_overall: {
    title: '整体匹配度综述'
  },
  // ② 整合画像区块
  block_identity: {
    title: '你的日常行为与天赋画像'
  },
  // ③ KASH 区块
  block_kash: {
    title: '从哪里开始升级更省力？'
  }
};

// ============================================================
// 4. 基础标签映射（M / T / V / Gap）
// ============================================================
const label_maps = {
  MOTIVE_LABELS: {
    A: '自主动机（Autonomy）',
    R: '关系动机（Relatedness）',
    C: '能力动机（Competence）'
  },
  TRAIT_LABELS: {
    T_Ope_high: '高开放 × 探索型（高 O）',
    T_Con_high: '高尽责 × 稳健型（高 C）',
    T_Ext_high: '高外向 × 表达型（高 E）',
    T_Agr_high: '高宜人 × 协调型（高 A）',
    T_Neu_high: '情绪敏感型（高 N）',
    T_Neu_low: '情绪稳定型（低 N）'
  },
  VALUE_LABELS: {
    Career: '事业发展',
    Wealth: '财富与资源',
    Growth: '成长与学习',
    Family: '家庭与亲密关系',
    Health: '身心健康',
    Spiritual: '心灵 / 意义',
    Social: '社交与人脉'
  },
  GAP_LABELS: {
    Career: '事业方向与发展节奏',
    Wealth: '财富与资源配置',
    Growth: '成长与学习强度',
    Family: '家庭角色与投入度',
    Health: '身心能量与恢复',
    Spiritual: '心灵满足与意义感',
    Social: '社交密度与圈层结构'
  }
};

// ============================================================
// 5. 跨层级整合模板（占位 – 先保留结构）
// ============================================================
const cross_layer_templates = {
  MT: {
    default: {
      label: 'MxT 综合画像',
      sentence: '你的动机与性格特质正在一起，塑造出一套独特的日常行为风格。'
    }
  },
  TV: {
    default:
      '你的性格特质正在潜移默化地影响你对事业 / 关系 / 生活结构的选择。'
  },
  MTV: {
    template:
      '你的核心驱动力来自「{{M}}」，决定你“为什么而行动”；' +
      '你的行为风格由「{{T}}」呈现，决定你“如何行动”；' +
      '而你当前最重要的价值「{{V}}」则指向你“要把力气放在哪里”。'
  }
};

export {
  iceberg_patterns,
  kash_entry_narratives,
  synthesis_templates,
  label_maps,
  cross_layer_templates
};

export default {
  iceberg_patterns,
  kash_entry_narratives,
  synthesis_templates,
  label_maps,
  cross_layer_templates
};