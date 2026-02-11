import { JOB_MODELS_V0_1 } from '/data/job_models_v0_1.js';
import { calculateFitReportV01 } from '/core/logic_core.js';

const $sel = document.getElementById('jobSelect');
const $btn = document.getElementById('btnGo');

function safeModels() {
  return (JOB_MODELS_V0_1 && JOB_MODELS_V0_1.models) ? JOB_MODELS_V0_1.models : {};
}

function mountJobOptions() {
  const models = safeModels();
  const keys = Object.keys(models);
  if (!keys.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '（職種モデルが見つかりません）';
    $sel.appendChild(opt);
    $sel.disabled = true;
    $btn.disabled = true;
    return;
  }

  keys.forEach((k) => {
    const m = models[k] || {};
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = (m.label || m.title || k);
    $sel.appendChild(opt);
  });

  // default：第一个
  $sel.value = keys[0];
}

function onGo() {
  const job_key = ($sel && $sel.value) ? $sel.value : '';
  const fit = calculateFitReportV01({ job_key });

  localStorage.setItem('myGiftFitReportV01', JSON.stringify(fit));
  window.location.href = 'fit_report.html';
}

mountJobOptions();
$btn.addEventListener('click', onGo);
