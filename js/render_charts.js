/**
 * /js/render_charts.js (v4.6)
 * 职责：绘制所有图表 (Chart.js)
 * 升级：
 *  - 修正 V / R 图表的 ID 对应关系
 *  - V 页显示「理想 vs 现实」对比条形图
 *  - R 页单独显示「现实 (R)」条形图
 */

// 1. 定义品牌色系 (与 style.css 保持一致)
const BRAND = {
    primary: '#2c3e50',       // 深蓝 (用于标题、核心数据)
    primaryLight: 'rgba(44, 62, 80, 0.7)', 
    secondary: '#3498db',     // 亮蓝 (用于辅助数据)
    secondaryFill: 'rgba(52, 152, 219, 0.2)', // 亮蓝填充
    accent: '#d35400',        // 焦糖金 (用于强调、Reality现实)
    accentFill: 'rgba(211, 84, 0, 0.6)',
    text: '#333333',
    grid: '#eeeeee'
};

// 通用图表配置
const commonOptions = {
    plugins: {
        legend: { labels: { font: { size: 12, family: "'Helvetica Neue', sans-serif" } } }
    },
    scales: {
        r: { // 雷达图通用
            pointLabels: { font: { size: 13, weight: 'bold' }, color: BRAND.primary },
            grid: { color: BRAND.grid },
            angleLines: { color: BRAND.grid }
        }
    }
};

// ============================================================
// 1. 绘制 T 特质雷达图 (性格特质)
// ============================================================
export function drawRadarT(dataVec) {
    const ctx = document.getElementById('bigFiveRadarChart');
    if (!ctx) return;

    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['开放性', '尽责性', '外向性', '宜人性', '情绪性'],
            datasets: [{
                label: '特质得分',
                data: dataVec.map(v => v * 10), // 转为 0–10
                backgroundColor: BRAND.secondaryFill,
                borderColor: BRAND.secondary,
                borderWidth: 2,
                pointBackgroundColor: BRAND.secondary,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: BRAND.secondary
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                r: {
                    ...commonOptions.scales.r,
                    suggestedMin: 0,
                    suggestedMax: 10
                }
            }
        }
    });
}

// ============================================================
// 2. V 页：理想 V vs 现实 R 柱状对比图
//    使用 <canvas id="vBarChart">
// ============================================================
export function drawBarVR(vVec, rVec) {
    const ctx = document.getElementById('vBarChart');
    if (!ctx) return;

    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }

    const labels = ["事业", "财富", "成长", "家庭", "健康", "心灵", "社交"];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: '理想 (V)',
                    data: vVec.map(v => v * 10),
                    backgroundColor: BRAND.primaryLight,
                    borderColor: BRAND.primary,
                    borderWidth: 1
                },
                {
                    label: '现实 (R)',
                    data: rVec.map(v => v * 10),
                    backgroundColor: BRAND.accentFill,
                    borderColor: BRAND.accent,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    grid: { color: BRAND.grid }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// ============================================================
// 3. R 页：现实 R 单独柱状图
//    使用 <canvas id="rBarChart">
// ============================================================
export function drawBarR(rVec) {
    const ctx = document.getElementById('rBarChart');
    if (!ctx) return;

    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }

    const labels = ["事业", "财富", "成长", "家庭", "健康", "心灵", "社交"];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: '现实 (R)',
                    data: rVec.map(v => v * 10),
                    backgroundColor: BRAND.accentFill,
                    borderColor: BRAND.accent,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    grid: { color: BRAND.grid }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// ============================================================
// 4. Gap 差距雷达图 (张力分析)
//    使用 <canvas id="gapRadarChart">
// ============================================================
// ============================================================
// 4. Gap 差距雷达图：显示「理想 V」和「现实 R」两层多边形
// ============================================================
export function drawGapRadar(vVec, rVec) {
    const ctx = document.getElementById('gapRadarChart');
    if (!ctx) return;

    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }

    const labels = ["事业", "财富", "成长", "家庭", "健康", "心灵", "社交"];

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels,
            datasets: [
                {
                    label: '理想 (V)',
                    data: vVec.map(v => v * 10),
                    backgroundColor: 'rgba(52, 152, 219, 0.15)', // 亮蓝半透明
                    borderColor: BRAND.secondary,
                    borderWidth: 2,
                    pointBackgroundColor: BRAND.secondary
                },
                {
                    label: '现实 (R)',
                    data: rVec.map(v => v * 10),
                    backgroundColor: 'rgba(211, 84, 0, 0.15)',   // 焦糖金半透明
                    borderColor: BRAND.accent,
                    borderWidth: 2,
                    pointBackgroundColor: BRAND.accent
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                r: {
                    ...commonOptions.scales.r,
                    suggestedMin: 0,
                    suggestedMax: 10
                }
            }
        }
    });
}

// ============================================================
// 5. 冰山图 (Tab 7)
// ============================================================
// 冰山图：M 底层 / T 中层 / V 顶层 + 可选 KASH
// 冰山图：底层 M / 中层 T / 顶层 V + 可选 KASH 起点
export function drawIceberg(canvasId, mText, tText, vText, kashText = '') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // ===== 1. 画水面 =====
  const waterY = h * 0.35;
  ctx.beginPath();
  ctx.moveTo(0, waterY);
  ctx.lineTo(w, waterY);
  ctx.strokeStyle = '#9ca3af';   // 稍微深一点
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ===== 2. 画冰山三角形（稍微粗一点＋淡填充）=====
  const centerX = w / 2;
  const apexY   = h * 0.18;
  const baseY   = h * 0.78;
  const halfW   = w * 0.22;

  const leftX  = centerX - halfW;
  const rightX = centerX + halfW;

  ctx.beginPath();
  ctx.moveTo(centerX, apexY);
  ctx.lineTo(rightX, baseY);
  ctx.lineTo(leftX, baseY);
  ctx.closePath();

  // 冰山填充
  const grd = ctx.createLinearGradient(0, apexY, 0, baseY);
  grd.addColorStop(0, '#e5f2ff');
  grd.addColorStop(1, '#bfdbfe');
  ctx.fillStyle = grd;
  ctx.fill();

  // 边线
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ===== 3. 文案（不再写 V/T/M 字母，只写中文含义）=====
  ctx.textAlign = 'center';
  ctx.font = '12px "Noto Sans JP", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#111827';

  // 顶层：人生重点（价值方向）
  if (vText) {
    ctx.fillText(`人生重点：${vText}`, centerX, apexY - 10);
  }

  // 中层：外在风格（特质）
  const midY = (apexY + baseY) / 2;
  if (tText) {
    ctx.fillText(`外在风格：${tText}`, centerX, midY);
  }

  // 底层：内在动力（动机）
  if (mText) {
    ctx.fillText(`内在动力：${mText}`, centerX, baseY + 16);
  }

  // ===== 4. KASH 起点（可选）=====
  if (kashText) {
    ctx.font = '11px "Noto Sans JP"';
    ctx.fillStyle = '#4b5563';
    ctx.fillText(`当前练习起点：${kashText}`, centerX, baseY + 32);
  }
}