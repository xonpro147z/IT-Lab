// Tiện ích dùng chung: lưu tiến độ, thông báo nhanh
const Progress = {
  _get() { try { return JSON.parse(localStorage.getItem('thl.progress') || '{}'); } catch { return {}; } },
  _set(v) { try { localStorage.setItem('thl.progress', JSON.stringify(v)); } catch {} },
  student() { try { return localStorage.getItem('thl.student') || ''; } catch { return ''; } },
  setStudent(n) { try { localStorage.setItem('thl.student', n); } catch {} },
  record(app, exId, score, max) {
    const p = this._get(); p[app] = p[app] || {};
    const prev = p[app][exId];
    if (!prev || score >= prev.score) p[app][exId] = { score, max, at: new Date().toISOString() };
    this._set(p);
  },
  get(app, exId) { const p = this._get(); return p[app] && p[app][exId]; },
  doneCount(app) { const p = this._get()[app] || {}; return Object.values(p).filter(r => r.score === r.max).length; },
  reset() { try { localStorage.removeItem('thl.progress'); } catch {} },
};

function toast(msg, type = 'info', ms = 2600) {
  let box = document.getElementById('toastBox');
  if (!box) { box = document.createElement('div'); box.id = 'toastBox'; document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + type; t.textContent = msg; box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
