function el(tag, text) {
  const d = document.createElement(tag);
  if (text != null) d.textContent = String(text);
  return d;
}

function render() {
  const raw = localStorage.getItem('myGiftFitReportV01');
  const $sum = document.getElementById('summary');
  const $reasons = document.getElementById('reasons');
  const $warnings = document.getElementById('warnings');
  const $json = document.getElementById('json');

  if (!raw) {
    $sum.appendChild(el('div', 'レポートが見つかりません。fit.html から生成してください。'));
    return;
  }

  let r = null;
  try { r = JSON.parse(raw); } catch (e) {}

  if (!r || !r.synthesis) {
    $sum.appendChild(el('div', 'レポート形式が不正です（JSON parse / schema）。'));
    $json.textContent = raw;
    return;
  }

  const jobLabel = (r.inputs && (r.inputs.job_label || r.inputs.job_key)) || '';
  const grade = r.synthesis.fit_grade || '';
  const score = (typeof r.synthesis.fit_score === 'number') ? r.synthesis.fit_score : null;
  const conf = (typeof r.synthesis.confidence === 'number') ? r.synthesis.confidence : null;
  const kash = r.synthesis.kash_start || '';

  $sum.innerHTML = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <span class="pill">職種：${jobLabel}</span>
      <span class="pill">Grade：${grade}</span>
      <span class="pill">Score：${score != null ? score.toFixed(2) : ''}</span>
      <span class="pill">Confidence：${conf != null ? conf.toFixed(2) : ''}</span>
      <span class="pill">KASH起点：${kash}</span>
    </div>
  `;

  // reasons
  ($reasons.innerHTML = '');
  const reasons = Array.isArray(r.synthesis.top_reasons) ? r.synthesis.top_reasons : [];
  if (!reasons.length) {
    $reasons.appendChild(el('div', '（なし）'));
  } else {
    reasons.forEach((x) => {
      const line = el('div');
      const t = (x && x.title) ? x.title : (x && x.key) ? x.key : '';
      const w = (x && typeof x.weight === 'number') ? x.weight : null;
      line.textContent = `・${t}${w != null ? `（w=${w.toFixed(2)}）` : ''}`;
      $reasons.appendChild(line);
    });
  }

  // warnings
  ($warnings.innerHTML = '');
  const warns = Array.isArray(r.synthesis.warnings) ? r.synthesis.warnings : [];
  if (!warns.length) {
    $warnings.appendChild(el('div', '（なし）'));
  } else {
    warns.forEach((x) => {
      const line = el('div');
      const t = (x && x.title) ? x.title : (x && x.key) ? x.key : '';
      const lv = (x && x.level) ? x.level : '';
      line.textContent = `・[${lv}] ${t}`;
      $warnings.appendChild(line);
    });
  }

  $json.textContent = JSON.stringify(r, null, 2);
}

render();
