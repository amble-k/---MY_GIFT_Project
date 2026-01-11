/**
 * /data/narratives.js
 * 状态：LEGACY（v2.x 旧版 narrative 大合集）
 *
 * 说明：
 * - 当前仅用于兼容：/js/render_text.js 里的少量字段读取；
 * - 新代码一律不要再引用本文件；
 * - 完整、可维护的 narrative 已拆分到：
 *     · /data/narratives_core.js      （冰山 & 综合模式）
 *     · /data/narratives_m.js         （M 动机 L1/L2）
 *     · /data/narratives_t.js         （T 特质 L1/L2）
 *     · /data/narratives_vr.js        （V & R 价值/现实）
 *     · /data/narratives_r.js         （R 现实拆分——如果有）
 *     · /data/narratives_gap.js       （Gap / Delta 文案）
 *     · /data/narratives_synthesis.js （综合总结页）
 *
 * 后续升级方向：
 * - 逐步把 render_text.js 里对 G_NARRATIVES 的引用，迁移到上述拆分文件；
 * - 迁完之后，可以把本文件彻底下线。
 */
// 1. 使用 "import *" 把文件里所有的东西都抓取进来
import * as M_SOURCE from './narratives_m.js';
import * as T_SOURCE from './narratives_t.js';
import * as VR_SOURCE from './narratives_vr.js';
import * as CORE_SOURCE from './narratives_core.js';
import * as RULES_SOURCE from './rules.js';
import * as KASH_SOURCE from './kash_advice.js';

// 2. 定义一个聪明的读取函数
// 它会先找直接导出 (Named Export)，找不到再找默认导出 (Default Export)
// 这样就不用担心你的 M/T/VR 文件到底是用哪种写法了
function load(source, key) {
    // 情况A: export const M_L1 = ... (直接在源里)
    if (source[key]) return source[key];
    // 情况B: export default { M_L1, ... } (在 default 里)
    if (source.default && source.default[key]) return source.default[key];
    // 情况C: 如果是 KASH 这种直接导出默认对象的
    if (key === 'default' && source.default) return source.default;
    
    return {}; // 找不到就返回空，防止报错
}

// 3. 组装导出
const narratives = {
    // M 模块
    M_L1: load(M_SOURCE, 'M_L1'),
    M_L2_patterns: load(M_SOURCE, 'M_L2_patterns'),
    
    // T 模块
    T_L1: load(T_SOURCE, 'T_L1'),
    T_L2_patterns: load(T_SOURCE, 'T_L2_patterns'),

    // V/R 模块
    V_L1: load(VR_SOURCE, 'V_L1'),
    gap_narratives: load(VR_SOURCE, 'gap_narratives'),

    // 规则与建议
    M_T_patterns: load(RULES_SOURCE, 'M_T_patterns'),
    Delta_rules: load(RULES_SOURCE, 'Delta_rules'),
    KASH_advice: load(KASH_SOURCE, 'default'), // KASH 通常是整个默认导出

    // 核心整合模块
    iceberg_patterns: load(CORE_SOURCE, 'iceberg_patterns'),
    kash_entry_narratives: load(CORE_SOURCE, 'kash_entry_narratives'),
    synthesis_templates: load(CORE_SOURCE, 'synthesis_templates'),
    cross_layer_templates: load(CORE_SOURCE, 'cross_layer_templates'),

    // 兼容旧代码映射 (保留)
    L1: {
        ...load(M_SOURCE, 'M_L1'),
        ...load(T_SOURCE, 'T_L1'),
        ...load(VR_SOURCE, 'V_L1')
    }
};

export default narratives;