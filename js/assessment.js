/**
 * /js/assessment.js (Phase 4 Final - With Prev Button)
 * 职责：问卷渲染引擎。
 * 修复：增加“上一页”按钮逻辑。
 */

import questionsM from '/data/questions_m.js';
import questionsT from '/data/questions_t.js';
import questionsV, { V_SORT_KEYS } from '/data/questions_v.js';
import questionsR from '/data/questions_r.js';
import { calculateReport } from '/core/logic_core.js';
// ============================
// 每一份问卷的专属说明配置
// ============================
const SECTION_INTROS = {
  m: {
    title: '关于这一部分：你的内在动力（M 动机）',
    html: `
      <p>这一部分想了解的是：<strong>是什么在驱动你做选择、投入精力</strong>。</p>
      <p>请根据你 <strong>过去一段时间「大多数时候」</strong> 的真实感受来作答，而不是某一天的心情。</p>
      <ul>
        <li>没有「好」或「坏」的动机，只是不同类型的能量来源。</li>
        <li>请按直觉选择那个<strong>最符合你常态</strong>的选项，而不是「理想中的自己」。</li>
      </ul>
      <p>这些答案将用于推导你的核心动力结构（A / C / R），并和后面的特质、价值观一起整合分析。</p>
    `
  },

  t: {
    title: '关于这一部分：你的性格特质（T 特质）',
    html: `
      <p>这一部分想了解的是：<strong>你在做事和与人相处时的常见风格</strong>。</p>
      <p>请尽量按 <strong>平常的你</strong> 来回答，而不是别人眼中的你，或你期望成为的样子。</p>
      <ul>
        <li>特质没有「对」或「错」，只是不同的习惯模式。</li>
        <li>如果两个选项都像你，请选那个<strong>更常见、更自然</strong>的。</li>
      </ul>
      <p>这些答案将用于形成你的 Big Five 画像，并和动机（M）一起组成后面报告里的 M×T 行为模式。</p>
    `
  },

  v: {
    title: '关于这一部分：你理想中的人生优先级（V 价值观）',
    html: `
      <p>这一部分想了解的是：<strong>在你理想的人生里，希望各个领域「到什么程度」</strong>。</p>
      <p>请把这里当作「如果可以长期按自己意愿安排」，你<strong>更想把能量投向哪里</strong>。</p>
      <ul>
        <li>这里问的是「理想状态」，<strong>不是现在现实的情况</strong>。</li>
        <li>可以多个领域都打高分，但请根据你内心的<strong>轻重缓急</strong>做区分。</li>
        <li>没有标准答案，也不要求「政治正确」，只要诚实地写出你真正在意的。</li>
      </ul>
      <p>这些答案会和现实满意度（R）一起，用来分析你目前的人生结构是否顺着本性、哪里存在拉扯。</p>
    `
  },

  r: {
    title: '关于这一部分：你现在的真实感受（R 现实满意度）',
    html: `
      <p>这一部分想了解的是：<strong>就「现在」来说，你对各个领域的满意程度</strong>。</p>
      <p>请根据最近一段时间（例如过去 3〜6 个月）的整体体验来打分。</p>
      <ul>
        <li>这里问的是 <strong>「现在过得怎么样」</strong>，不是你觉得「应该」怎么样。</li>
        <li>请优先按照<strong>主观感受</strong>来判断，而不是客观收入、头衔等指标。</li>
        <li>没有对错，也不会用来评价你的人生，只是帮你看清现实和理想的差距。</li>
      </ul>
      <p>这些答案会与前一部分的理想价值观（V）做对比，用来识别：哪些领域已经对齐，哪些地方值得优先调整。</p>
    `
  }
};
function renderSectionIntro(kind) {
  const cfg = SECTION_INTROS[kind];
  if (!cfg) return '';

  return `
    <section style="
      max-width: 820px;
      margin: 0 auto 16px;
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      background: #f3f4f6;
      font-size: 13px;
      color: #374151;
      line-height: 1.7;
    ">
      <h3 style="margin: 0 0 6px; font-size: 15px; color: #111827;">
        ${cfg.title}
      </h3>
      ${cfg.html}
    </section>
  `;
}

// 理想人生七个领域的中文标签（供排序 UI 使用）
const VALUE_LABELS = {
  Career: '事业',
  Wealth: '财富',
  Growth: '成长',
  Family: '家庭',
  Health: '健康',
  Spiritual: '心灵',
  Social: '社交'
};

const allQuestions = [
  { id: 'm', title: '第一部分：核心动机 (M)', data: questionsM },
  { id: 't', title: '第二部分：性格特质 (T)', data: questionsT },
  { id: 'v', title: '第三部分：人生价值观 (V)', data: questionsV },
  { id: 'r', title: '第四部分：现实状态 (R)', data: questionsR }
];

let currentPartIndex = 0;
let answers = { m: [], t: [], v: [], r: [] };
let vRank = [];   // 用来保存用户对七个人生领域的理想优先级排序，比如 ["Growth","Career",...]
// 首页「开始测评」按钮调用的入口
window.startAssessment = function () {
  const intro = document.getElementById('assessment-start');
  const app   = document.getElementById('assessment-app');

  // 隐藏首页介绍卡片，显示问卷容器
  if (intro) intro.style.display = 'none';
  if (app)   app.style.display = 'block';

  // 从第一部分重新开始
  currentPartIndex = 0;
  renderPart(currentPartIndex);
};

// 兼容：如果直接打开的是 assessment.html 或没有首页介绍块，则自动显示问卷
document.addEventListener('DOMContentLoaded', () => {
  const intro = document.getElementById('assessment-start');
  const app   = document.getElementById('assessment-app');

  if (!intro && app) {
    app.style.display = 'block';
    currentPartIndex = 0;
    renderPart(currentPartIndex);
  }
});

// 供 index.html 按钮调用
window.startAssessment = function () {
  const start = document.getElementById('assessment-start');
  const app   = document.getElementById('assessment-app');

  if (start) start.style.display = 'none';
  if (app) {
    app.style.display = 'block';
    renderPart(0);   // 这里才真正开始第一部分 M
  }
};

function renderPart(index) {
  const app = document.getElementById('assessment-app');
  if (!app) return;

  const part = allQuestions[index];

  let html = `
    <div class="question-container">
      <div style="text-align:center; margin-bottom:30px;">
        <h2 style="color:#2c3e50; margin-bottom:5px;">${part.title}</h2>
        <p style="color:#7f8c8d; font-size:0.9em;">进度：${index + 1} / 4</p>
        <div style="height:4px; background:#eee; border-radius:2px; margin-top:15px; overflow:hidden;">
          <div style="width:${(index + 1) * 25}%; height:100%; background:#2c3e50;"></div>
        </div>
      </div>

      ${renderSectionIntro(part.id) || ''}

      <form id="quiz-form">
  `;

  // ====== 你的原始题目循环 ======
  part.data.forEach((q, i) => {
    html += `
      <div class="question-card" style="margin-bottom:25px; padding-bottom:25px; border-bottom:1px dashed #eee;">
        <label class="question-text" style="display:block; font-size:1.1em; font-weight:bold; margin-bottom:15px; color:#333;">
          ${i + 1}. ${q.text_zh || q.text || ''}
        </label>
        <div class="options-group">
          ${renderOptions(i, q.options || [1,2,3,4,5])}
        </div>
      </div>
    `;
  });

  // ====== 第 3 步：只在 V 卷下面加“理想人生优先级排序”区块 ======
  if (part.id === 'v') {
    html += renderVRankBlock();
  }

  // ====== 底部按钮区（带 上一页 / 下一步）======
  html += `
        <div class="btn-container" style="margin-top:40px; text-align:center; display:flex; justify-content:center; gap:20px;">
          ${index > 0 ? `<button type="button" class="secondary-btn" onclick="prevPart()" style="padding:12px 30px;">← 上一页</button>` : ''}
          <button type="button" class="primary-btn" onclick="nextPart()" style="padding:12px 50px; font-size:1.1em;">
            ${index === 3 ? '✨ 生成完整报告' : '下一步 →'}
          </button>
        </div>
      </form>
    </div>
  `;

  app.innerHTML = html;
  window.scrollTo(0, 0);
}
function renderOptions(qIndex, options) {
    return options.map(val => `
        <label>
            <input type="radio" name="q_${qIndex}" value="${val}" required>
            <span>${val}</span>
        </label>
    `).join('');
}
// 只在 V 卷下方显示的「理想人生优先级」排序区块（1〜7 排名版）
function renderVRankBlock() {
  // 七个固定领域 + 显示用中文
  const VALUE_KEYS = ['Career', 'Wealth', 'Growth', 'Family', 'Health', 'Spiritual', 'Social'];
  const LABELS = {
    Career:    '事业 / 职业发展',
    Wealth:    '财富 / 收入与资产',
    Growth:    '成长 / 学习与升级',
    Family:    '家庭 / 亲密关系',
    Health:    '健康 / 身体与精力',
    Spiritual: '心灵 / 意义感与精神世界',
    Social:    '社交 / 圈层与影响力'
  };

  // 把当前已经保存的排序（answers.v_rank）转成 {key: 排名}，用于回显
  const currentMap = {};
  (answers.v_rank || []).forEach((k, idx) => {
    currentMap[k] = idx + 1; // 1 = 最优先
  });

  let rowsHtml = VALUE_KEYS.map((key) => {
    let optionsHtml = `<option value="">- 请选择 -</option>`;
    for (let i = 1; i <= 7; i++) {
      const selected = currentMap[key] === i ? ' selected' : '';
      optionsHtml += `<option value="${i}"${selected}>${i}</option>`;
    }

    return `
      <tr>
        <td style="padding:4px 8px; font-size:13px; color:#374151;">
          ${LABELS[key]}
        </td>
        <td style="padding:4px 8px;">
          <select name="v_rank_${key}"
                  style="padding:4px 8px; font-size:13px; border-radius:4px; border:1px solid #d1d5db;">
            ${optionsHtml}
          </select>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <section style="margin-top:24px; padding:16px 14px; border-radius:10px;
                    border:1px solid #e5e7eb; background:#f9fafb;">
      <h3 style="margin:0 0 8px; font-size:14px; color:#111827;">
        补充一步：请为你「理想中的人生优先级」排个顺序
      </h3>
      <p style="margin:0 0 8px; font-size:13px; color:#4b5563; line-height:1.7;">
        上面的问题是在问：如果可以长期按你的心意来安排，你希望各个领域<strong>大致到什么程度</strong>。
        <br>在这一小步里，请你再根据直觉，为下面七个领域排一个<strong>重要程度的顺序</strong>：
        <strong>1 = 当前你最在意 / 最优先考虑</strong>，7 = 相对可以放在后面。
      </p>
      <p style="margin:0 0 10px; font-size:12px; color:#6b7280;">
        · 每个数字 1〜7 只能出现一次。<br>
        · 没有标准答案，只需要照你现在的真实感受来排即可。
      </p>
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </section>
  `;
}
// 【修复点】增加上一页函数
window.prevPart = function() {
    if (currentPartIndex > 0) {
        currentPartIndex--;
        renderPart(currentPartIndex);
    }
};

window.nextPart = function() {
  const form = document.getElementById('quiz-form');
  const formData = new FormData(form);
  const part    = allQuestions[currentPartIndex];
  const partKey = part.id;

  const currentAnswers = [];
  const totalQ = part.data.length;

  // 先收集本部分所有题目的答案
  for (let i = 0; i < totalQ; i++) {
    const val = formData.get(`q_${i}`);
    if (!val) {
      alert(`请完成第 ${i + 1} 题再继续！`);
      return;
    }
    currentAnswers.push(parseInt(val, 10));
  }

  // 保存 M / T / V / R 的作答
  answers[partKey] = currentAnswers;

   // ⭐ 只在 V 卷时，读取表格里 7 个领域的 1〜7 排名
  if (partKey === 'v') {
    const VALUE_KEYS = ['Career', 'Wealth', 'Growth', 'Family', 'Health', 'Spiritual', 'Social'];

    const pairs = [];
    const usedRanks = new Set();

    VALUE_KEYS.forEach((k) => {
      const raw = formData.get(`v_rank_${k}`) || '';
      const num = parseInt(raw, 10);

      if (!isNaN(num) && num >= 1 && num <= 7) {
        // 检查是否有重复数字
        if (usedRanks.has(num)) {
          alert('每个数字 1〜7 只能使用一次，请检查是否有重复的排序数字。');
          pairs.length = 0; // 清空，防止后面继续
          return;
        }
        usedRanks.add(num);
        pairs.push({ key: k, rank: num });
      }
    });

    // 如果没有任何 1，说明没有选出“最优先”的领域
    const hasRank1 = pairs.some(p => p.rank === 1);
    if (!hasRank1) {
      alert('请至少为理想中的人生，选出一个最优先的领域（排在 1 的那一项）。');
      return;
    }

    // 按数字从小到大排序，得到 ['Growth','Career', ...]
    pairs.sort((a, b) => a.rank - b.rank);
    answers.v_rank = pairs.map(p => p.key);
  }

  // 跳转到下一部分或生成报告
  if (currentPartIndex < 3) {
    currentPartIndex++;
    renderPart(currentPartIndex);
  } else {
    finishAssessment();
  }
};

function finishAssessment() {
  console.log("正在计算报告...", answers);
  console.log('[CHECK] answers.v_rank =', answers.v_rank);

  const rawData = {
    m_answers: answers.m,
    t_answers: answers.t,
    v_answers: answers.v,
    r_answers: answers.r,

    // ⭐ 把 V 的排序一起传给逻辑层
    v_rank: answers.v_rank || []
  };

  console.log('[CHECK] rawData.v_rank =', rawData.v_rank);

   try {
    const reportData = calculateReport(rawData);

    // ★ 调试用：在问卷页把这次生成的报告挂到全局
    if (typeof window !== 'undefined') {
      window.MYGIFT_REPORT = reportData;
      console.log('[MYGIFT DEBUG] reportData (assessment) =', reportData);
    }

    localStorage.setItem('myGiftReport', JSON.stringify(reportData));
    window.location.href = 'report.html?tab=m';
  } catch (e) {
    alert("计算出错，请检查控制台");
    console.error(e);
  }
}
// 监听 v_rank 下拉变化，实时更新 answers.v_rank
document.addEventListener('change', function (e) {
  const target = e.target;
  if (!target || target.tagName !== 'SELECT') return;

  const name = target.name || '';
  if (!name.startsWith('v_rank_')) return;

  // 收集所有 v_rank_xxx 下拉的选择结果
  const selects = document.querySelectorAll('select[name^="v_rank_"]');
  const rankPairs = []; // [key, rank]

  selects.forEach(sel => {
    const val = sel.value;
    if (!val) return;
    const key = sel.name.replace('v_rank_', ''); // 还原成 Career / Wealth ...
    const rank = parseInt(val, 10);
    if (!isNaN(rank)) {
      rankPairs.push([key, rank]);
    }
  });

  // 按 rank 从小到大排序，生成有序 key 列表
  rankPairs.sort((a, b) => a[1] - b[1]);
  const orderedKeys = rankPairs.map(pair => pair[0]);

  if (!window.answers) window.answers = {};
  answers.v_rank = orderedKeys;
 console.log('[V DEBUG] FULL v_rank =', JSON.stringify(answers.v_rank));
});