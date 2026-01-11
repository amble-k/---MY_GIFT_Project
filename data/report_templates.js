// LEGACY: 旧版报告引擎（V4.1），当前项目未引用，仅保留备份。
/**
 * 报告渲染引擎 (Report Engine) - V4.1 Formal
 * * 修复：完全适配新的 narratives.js 数据结构
 * * 功能：动态渲染 12 模式、7 差距、KASH 入口
 */

import narrativesData from './data/narratives.js';
import rulesData from './data/rules.js';

// 全局数据
const G_NARRATIVES = narrativesData || {};
const G_RULES = rulesData || {};

// 启动
function startEngine() {
    console.log("--- 渲染引擎启动 (V4.1) ---");
    if (typeof Chart === 'undefined') {
        document.body.innerHTML = "<h3 style='color:red;text-align:center'>Error: Chart.js 未加载</h3>";
        return;
    }
    renderReport();
}

function renderReport() {
    const reportJSON = localStorage.getItem('myGiftReport');
    if (!reportJSON) {
        document.body.innerHTML = `<div style="text-align:center;padding:50px;"><h2>暂无数据</h2><a href="index.html">返回首页</a></div>`;
        return;
    }

    let report;
    try { report = JSON.parse(reportJSON); } catch (e) { console.error(e); return; }

    console.log("Loaded Report:", report);

    // 按模块渲染
    renderModuleM(report.m_profile);
    renderModuleT(report.t_profile);
    renderModuleV(report.v_profile);
    renderModuleR(report.r_profile);
    renderModuleGap(report);
    renderModuleSynthesis(report);
    renderModuleIceberg(report); // 冰山图
    
    // 添加底部导航
    renderNextStageButton();
}

// 工具：安全获取DOM
function getEl(id) { return document.getElementById(id); }

// --- 1. 动机 M ---
function renderModuleM(profile) {
    const container = getEl('m-content');
    if(!container || !profile) return;

    const scores = [
        { k: 'M_A', v: profile.m_autonomy.normalized, label: G_RULES.dimensions.M_A.zh_label },
        { k: 'M_C', v: profile.m_competence.normalized, label: G_RULES.dimensions.M_C.zh_label },
        { k: 'M_R', v: profile.m_relatedness.normalized, label: G_RULES.dimensions.M_R.zh_label }
    ];
    scores.sort((a,b) => b.v - a.v);

    let html = `<div style="margin-bottom:20px;"><strong>您的首要驱动力：${scores[0].label}</strong></div>`;
    
    scores.forEach(s => {
        const level = s.v > 0.66 ? "high" : (s.v > 0.33 ? "mid" : "low");
        const key = `${s.k}_${level}`; // e.g. M_A_high
        const text = G_NARRATIVES.L1[key]?.zh || { summary: "暂无描述" };
        
        html += `
        <div style="margin-bottom:15px; padding:15px; background:#fff; border-left:4px solid #2E4A62; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between;">
                <h3 style="margin:0;">${s.label}</h3>
                <span>${(s.v*10).toFixed(1)}</span>
            </div>
            <p style="color:#666; margin:5px 0;">${text.summary}</p>
            <div style="font-size:0.9em; background:#f4f6f8; padding:8px; margin-top:5px;">
                💡 建议：${text.suggestion || "-"}
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// --- 2. 特质 T (雷达图) ---
function renderModuleT(profile) {
    if(!profile || !getEl('bigFiveRadarChart')) return;
    
    // 绘制图表
    const ctx = getEl('bigFiveRadarChart').getContext('2d');
    if(window.myT) window.myT.destroy();
    
    const labels = [
        G_RULES.dimensions.T_Ope.zh_label, 
        G_RULES.dimensions.T_Con.zh_label, 
        G_RULES.dimensions.T_Ext.zh_label, 
        G_RULES.dimensions.T_Agr.zh_label, 
        G_RULES.dimensions.T_Neu.zh_label
    ];

    window.myT = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '性格特质',
                data: profile.t_vector,
                backgroundColor: 'rgba(78, 165, 166, 0.2)',
                borderColor: '#4EA5A6',
                borderWidth: 2
            }]
        },
        options: { scales: { r: { suggestedMin: 0, suggestedMax: 1 } } }
    });
}

// --- 3. 价值 V & 4. 现实 R (条形图) ---
function renderModuleV(profile) {
    if(!profile || !getEl('vBarChart')) return;
    const ctx = getEl('vBarChart').getContext('2d');
    if(window.myV) window.myV.destroy();
    
    const labels = ["事业", "财富", "成长", "家庭", "健康", "心灵", "社交"];
    window.myV = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: [{ label: '理想重要度', data: profile.v_vector, backgroundColor: '#4EA5A6' }] },
        options: { indexAxis: 'y', scales: { x: { max: 1 } } }
    });
}

function renderModuleR(profile) {
    if(!profile || !getEl('rBarChart')) return;
    const ctx = getEl('rBarChart').getContext('2d');
    if(window.myR) window.myR.destroy();
    
    const labels = ["事业", "财富", "成长", "家庭", "健康", "心灵", "社交"];
    window.myR = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: [{ label: '现实满意度', data: profile.r_vector, backgroundColor: '#2E4A62' }] },
        options: { indexAxis: 'y', scales: { x: { max: 1 } } }
    });
}

[cite_start]// --- 5. 差距 Gap (核心文案) [cite: 2649-2717] ---
function renderModuleGap(fullReport) {
    if(!fullReport.gap_profile || !getEl('gap-content')) return;

    // 渲染图表
    const ctx = getEl('gapRadarChart').getContext('2d');
    if(window.myGap) window.myGap.destroy();
    const labels = ["事业", "财富", "成长", "家庭", "健康", "心灵", "社交"];
    
    window.myGap = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                { label: '理想 V', data: fullReport.v_profile.v_vector, borderColor: '#4EA5A6' },
                { label: '现实 R', data: fullReport.r_profile.r_vector, borderColor: '#e74c3c' }
            ]
        }
    });

    // 渲染文案
    const gapKey = fullReport.gap_profile.max_gap_key; // e.g. "Career"
    const textDiv = getEl('gap-text-analysis');
    const gapData = G_NARRATIVES.gap_narratives[gapKey];

    if(textDiv && gapData) {
        textDiv.innerHTML = `
            <div style="margin-top:20px; padding:20px; background:#fff5f5; border-left:5px solid #e74c3c; border-radius:8px;">
                <h3 style="color:#c0392b; margin-top:0;">⚠️ 核心落差：${gapKey}</h3>
                <p><strong>现象：</strong>${gapData.core_gap}</p>
                <p><strong>风险：</strong>${gapData.risk}</p>
                <hr style="border:0; border-top:1px solid #fadbd8; margin:15px 0;">
                <p><strong>💡 破局建议：</strong>${gapData.suggestion}</p>
            </div>
        `;
    }
}

[cite_start]// --- 6. 综合总结 (Synthesis + KASH) [cite: 2436-2606] ---
function renderModuleSynthesis(fullReport) {
    const container = getEl('synthesis-content');
    if(!container || !fullReport.synthesis) return;

    const syn = fullReport.synthesis;
    const pKey = syn.pattern_type; // e.g. "pattern_1"
    let pInfo = G_NARRATIVES.iceberg_patterns[pKey];
    
    // 兜底
    if(!pInfo) pInfo = G_NARRATIVES.iceberg_patterns["pattern_1"];

    // 1. 冰山模式卡片
    container.innerHTML = `
        <div style="background:#f0f4f8; padding:25px; border-radius:12px; border-left:6px solid #2E4A62;">
            <h2 style="color:#2E4A62; margin-top:0;">🎯 你的动力模式：${pInfo.name}</h2>
            <p style="font-size:1.1em; font-weight:bold; color:#555;">${pInfo.layer_summary || ""}</p>
            <p style="line-height:1.6; color:#666;">${pInfo.description}</p>
            
            <div style="margin-top:20px; background:#fff; padding:15px; border-radius:8px;">
                <strong>⚠️ 张力点：</strong> ${pInfo.tension_points || "无显著冲突"}
            </div>
            <div style="margin-top:10px; background:#fff; padding:15px; border-radius:8px;">
                <strong>🚀 发展方向：</strong> ${pInfo.development_direction}
            </div>
        </div>
    `;

    [cite_start]// 2. KASH 入口卡片 [cite: 2871-2929]
    const kKey = syn.kash_start; // e.g. "S"
    const kInfo = G_NARRATIVES.kash_entry_narratives[kKey];
    const kContainer = getEl('kash-entry-area');

    if(kContainer && kInfo) {
        kContainer.innerHTML = `
            <div style="margin-top:30px; padding:30px; background:linear-gradient(135deg, #1B2A41 0%, #34495e 100%); color:white; border-radius:12px; box-shadow:0 10px 20px rgba(46, 74, 98, 0.3);">
                <div style="display:flex; align-items:center; gap:20px; margin-bottom:20px;">
                    <div style="font-size:3em;">🚩</div>
                    <div>
                        <h2 style="margin:0; color:#4EA5A6;">下一步：从 ${kInfo.title} 开始</h2>
                        <span style="opacity:0.8;">MY GIFT 建议你的专属切入点</span>
                    </div>
                </div>
                <p style="font-size:1.1em;"><strong>💡 为什么？</strong> ${kInfo.why}</p>
                <p style="font-size:1em; opacity:0.9;"><strong>⚠️ 风险：</strong> ${kInfo.risk}</p>
                
                <div style="margin-top:25px; text-align:center;">
                    <button onclick="alert('KASH 详细计划正在生成中...')" style="padding:12px 30px; background:#4EA5A6; color:white; border:none; border-radius:30px; font-weight:bold; font-size:16px; cursor:pointer; transition:all 0.3s;">
                        查看我的行动计划 (Action Plan) →
                    </button>
                </div>
            </div>
        `;
    }
}

// --- 7. 冰山图 (Canvas) ---
function renderModuleIceberg(fullReport) {
    // (保留你原有的冰山绘制逻辑，或在此扩展)
    // 这里主要负责视觉绘制，文字已在 Synthesis 中呈现
}

// --- 导航按钮 ---
function renderNextStageButton() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if(!tab || tab === 'synthesis') return;

    let nextUrl = "", label = "";
    if(tab === 'm') { nextUrl = "index.html?start=T"; label = "继续第二部分：特质 (T) →"; }
    else if(tab === 't') { nextUrl = "index.html?start=V"; label = "继续第三部分：价值 (V) →"; }
    // ...
    
    if(nextUrl) {
        const btn = document.createElement('a');
        btn.href = nextUrl;
        btn.innerHTML = label;
        btn.style.cssText = "position:fixed; bottom:30px; right:30px; background:#e74c3c; color:white; padding:15px 30px; border-radius:50px; text-decoration:none; font-weight:bold; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999;";
        document.body.appendChild(btn);
    }
}

// 启动监听
document.addEventListener('DOMContentLoaded', () => {
    startEngine();
});