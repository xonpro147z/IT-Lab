// Shared helpers for the extended Office features (ribbon injection, side panes, contextual tabs)
const PRO = {
  // Add a ribbon tab + panel. html = panel inner HTML
  addTab(key, label, html, { before, ctx = false, hidden = false } = {}) {
    let btn = $(`#tabs button[data-tab="${key}"]`);
    if (!btn) {
      btn = document.createElement('button'); btn.dataset.tab = key; btn.textContent = label;
      if (ctx) { btn.className = 'ctx'; btn.hidden = true; }
      if (hidden) btn.hidden = true;
      const ref = before ? $(`#tabs button[data-tab="${before}"]`) : $$('#tabs button.ctx')[0];
      ref ? ref.before(btn) : $('#tabs').appendChild(btn);
      btn.addEventListener('click', () => {
        $$('#tabs button').forEach((x) => x.classList.remove('on')); btn.classList.add('on');
        $$('.rpanel').forEach((p) => p.classList.toggle('on', p.id === 'rp-' + key));
      });
    }
    let panel = $('#rp-' + key);
    if (!panel) { panel = document.createElement('div'); panel.className = 'rpanel'; panel.id = 'rp-' + key; $('#ribbon').appendChild(panel); }
    panel.innerHTML = html; applyIcons(panel); PRO.launchers(panel);
    return panel;
  },
  // Append groups to an existing panel
  addGroups(key, html, { prepend = false, after } = {}) {
    const panel = $('#rp-' + key); const t = document.createElement('template'); t.innerHTML = html.trim();
    const nodes = [...t.content.children];
    if (after) { let ref = after; nodes.forEach((n) => { ref.after(n); ref = n; }); }
    else if (prepend) panel.prepend(...nodes); else panel.append(...nodes);
    nodes.forEach((n) => { applyIcons(n); PRO.launchers(n); });
    return nodes;
  },
  launchers(root) { $$('.grp .glabel', root).forEach((g) => { if (!g.querySelector('.launch') && !g.dataset.nolaunch) g.insertAdjacentHTML('beforeend', '<svg class="launch" viewBox="0 0 12 12"><path d="M2 2h3M2 2v3M2 2l7 7M9 5v4H5" fill="none" stroke="#616161" stroke-width="1"/></svg>'); }); },
  grp: (label, body, cls = '') => `<div class="grp ${cls}"><div class="gbody">${body}</div><div class="glabel">${label}</div></div>`,
  big: (id, icon, label, title, caret) => `<button class="rb big" id="${id}" title="${title || label.replace(/<br>/g, ' ')}">${PRO.ic(icon)}${label}${caret ? '<span class="caret">▾</span>' : ''}</button>`,
  small: (id, icon, label, title) => `<button class="rb sm2" id="${id}" title="${title || label}">${PRO.ic(icon, 16)}<span>${label}</span></button>`,
  ic(icon, size = 32) { return ICONS[icon] ? `<span data-i="${icon}"${size !== 32 ? ` data-sz="${size}"` : ''}></span>` : `<span class="gi" style="font-size:${size === 32 ? 22 : 13}px;height:${size}px">${icon}</span>`; },
  showCtx(key, on, activate) {
    const b = $(`#tabs button[data-tab="${key}"]`); if (!b) return;
    b.hidden = !on;
    if (on && activate) b.click();
    if (!on && b.classList.contains('on')) $('#tabs button[data-tab=home]').click();
  },
  // Side pane (Styles, Restrict Editing, Animation Pane …)
  pane(id, title, html, { width = 300, onClose } = {}) {
    let p = $('#' + id);
    if (!p) {
      p = document.createElement('div'); p.id = id; p.className = 'sidepane';
      document.body.appendChild(p);
    }
    p.style.width = width + 'px';
    const fit = () => { const tp = document.querySelector('#taskpane:not([hidden])'); const st = document.querySelector('#status'); p.style.bottom = ((tp ? tp.offsetHeight : 0) + (st ? st.offsetHeight : 24)) + 'px'; const rb = document.querySelector('#robar,#macroBar') || document.querySelector('#ribbon'); if (rb) p.style.top = rb.getBoundingClientRect().bottom + 'px'; };
    fit(); if (!PRO._ro) { PRO._ro = new ResizeObserver(() => document.querySelectorAll('.sidepane').forEach((x) => x._fit && x._fit())); const tp = document.querySelector('#taskpane'); if (tp) PRO._ro.observe(tp); PRO._ro.observe(document.body); } p._fit = fit;
    p.innerHTML = `<div class="sph"><b>${title}</b><span class="spx" title="Close">✕</span></div><div class="spb">${html}</div>`;
    p.querySelector('.spx').onclick = () => { p.remove(); document.body.classList.remove('haspane'); onClose && onClose(); };
    document.body.classList.add('haspane');
    applyIcons(p);
    return p;
  },
  closePane(id) { const p = $('#' + id); if (p) { p.remove(); if (!$('.sidepane')) document.body.classList.remove('haspane'); } },
  rebind(sel, fn) { const el = typeof sel === 'string' ? $(sel) : sel; if (!el) return null; const n = el.cloneNode(true); el.replaceWith(n); n.addEventListener('click', fn); return n; },
  async askPassword(title, { confirm = true, label = 'Enter new password (optional):' } = {}) {
    const r = await modal(`<h3>${title}</h3><p>${label}</p><input type="password" class="rs" style="width:100%;height:28px">${confirm ? '<p>Reenter new password to confirm:</p><input type="password" class="rs" style="width:100%;height:28px">' : ''}`, [['Cancel'], ['OK', 'primary']]);
    if (r.i !== 1) return null;
    if (confirm && r.v[0] !== r.v[1]) { await modal('<h3>Confirm Password</h3><p>The passwords don\'t match.</p>', [['OK', 'primary']]); return null; }
    return r.v[0];
  },
  ctxMenu(x, y, items, onPick) {
    closeDropdown();
    const d = document.createElement('div'); d.className = 'dropdown ctxm';
    d.innerHTML = items.map((it) => it === '-' ? '<div class="sep"></div>' : `<div class="it${it.dis ? ' dis' : ''}" data-v="${it.v}">${it.ic ? `<span class="mi">${it.ic}</span>` : '<span class="mi"></span>'}${it.t}${it.sub ? '<span class="sub">▸</span>' : ''}</div>`).join('');
    document.body.appendChild(d);
    d.style.left = Math.min(x, innerWidth - d.offsetWidth - 6) + 'px'; d.style.top = Math.min(y, innerHeight - d.offsetHeight - 6) + 'px';
    d.addEventListener('mousedown', (e) => e.preventDefault());
    d.addEventListener('click', (e) => { const it = e.target.closest('[data-v]'); if (!it || it.classList.contains('dis')) return; closeDropdown(); onPick(it.dataset.v, it); });
    openDD = d;
    setTimeout(() => document.addEventListener('mousedown', function h(ev) { if (!d.contains(ev.target)) { closeDropdown(); document.removeEventListener('mousedown', h); } }), 0);
    return d;
  },
};
// Waffle (app launcher) goes to the Office home
document.addEventListener('click', (e) => { if (e.target.closest('#titlebar .waffle')) location.href = 'index.html'; });
