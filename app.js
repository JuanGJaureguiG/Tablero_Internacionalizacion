/* ------------------------------------------------------------------
   Tablero de control — Internacionalización · UNIMINUTO Sede Tolima-Huila
   data.json (generado por build_data.py):
   { corte,
     convenios:{ vigentes:[...], en_proceso:[...], vencidos:[...], redes:[...] },
     patrocinios:{ registros:[{periodo,tipo,entidad,sector,modalidad,cu,est,valor}] },
     movilidad:{ periodos, por_cu:[{periodo,poblacion,cu,total,meses}], por_tipo:[...], excluidos:[...] } }
------------------------------------------------------------------- */

const COL = { accent: '#E2962B', teal: '#2F7A6D', ink: '#16324F', purple: '#8A5FBF', nat: '#8A9BAE', danger: '#C1432B', blue: '#3E6FA8', green: '#6E8B3D', pink: '#D1709B', grid: '#EDEFEC', muted: '#6B7280' };
const CU_COLORS = { 'Ibagué': '#E2962B', 'Neiva': '#2F7A6D', 'Garzón': '#C1432B', 'Pitalito': '#3E6FA8', 'Lérida': '#8A5FBF', 'La Dorada': '#D1709B', 'Planadas': '#6E8B3D' };
const CU_ORDER = ['Ibagué', 'Neiva', 'Garzón', 'Pitalito', 'Lérida', 'La Dorada', 'Planadas'];
const PALETTE = [COL.accent, COL.teal, COL.ink, COL.purple, COL.blue, COL.danger, COL.green, COL.pink, COL.nat, '#B06F14', '#5C8FB0', '#A9C27A'];
const REGION_COLORS = { 'América del Sur': COL.accent, 'Norte y Centroamérica': COL.teal, 'Europa': COL.blue, 'Caribe': COL.purple, 'Asia y Oceanía': COL.green, 'África': COL.danger, 'Otro': COL.nat };
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Sin fecha'];
const POB_COL = { 'Estudiantes': COL.accent, 'Profesores y administrativos': COL.teal };
const TIPO_COL = { 'Patrocinio': COL.accent, 'Donación': COL.teal };
const SECTOR_COL = { 'Público': COL.ink, 'Privado': COL.accent, 'Persona natural': COL.purple };
const MOD_COL = { 'Matrícula (pregrado)': COL.accent, 'Educación continua': COL.teal, 'Técnico laboral (TLB)': COL.purple };
const PER_EN_CURSO = ['2026-2'];
const TABS = [['convenios', 'Convenios y redes'], ['patrocinios', 'Patrocinios y donaciones'], ['movilidad', 'Movilidad']];

let DATA = null;
const charts = {};
const state = { tab: 'convenios', f: { convenios: {}, patrocinios: {}, movilidad: {} }, q: { conv: '', redes: '', pat: '' }, sort: {} };

/* ---------------- utilidades ---------------- */
const el = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (v, d = 0) => (v == null || !isFinite(v)) ? '—' : v.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtM = (v, d = 1) => (v == null || !isFinite(v)) ? '—' : '$' + fmt(v / 1e6, d) + ' M';
const fmtK = v => (v == null || !isFinite(v)) ? '—' : '$' + fmt(v / 1e3, 0) + ' mil';
const fmtP = (v, d = 1) => (v == null || !isFinite(v)) ? '—' : fmt(v * 100, d) + '%';
const fmtPS = (v, d = 1) => (v == null || !isFinite(v)) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v) * 100, d) + '%';
const sum = a => a.reduce((s, x) => s + (x || 0), 0);
const uniq = a => [...new Set(a)];
const groupSum = (rows, key, val) => { const m = new Map(); rows.forEach(r => { const k = typeof key === 'function' ? key(r) : r[key]; m.set(k, (m.get(k) || 0) + (typeof val === 'function' ? val(r) : r[val])); }); return m; };
const sortedEntries = m => [...m.entries()].sort((a, b) => b[1] - a[1]);
const parseD = s => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
const fmtD = s => s ? parseD(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const corte = () => parseD(DATA.corte);
const daysTo = s => Math.round((parseD(s) - corte()) / 864e5);
const perLab = p => PER_EN_CURSO.includes(p) ? `${p}*` : p;
const alpha = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0');
const perCol = (p, base) => PER_EN_CURSO.includes(p) ? alpha(base, 0.5) : base;
const kpi = (label, value, delta, color) => `<div class="kpi"${color ? ` style="border-left-color:${color}"` : ''}><div class="label">${label}</div><div class="num">${value}</div>${delta ? `<div class="delta">${delta}</div>` : ''}</div>`;
const gapSpan = v => v == null || !isFinite(v) ? '<span class="flat">—</span>' : `<span class="gap ${v >= 0 ? 'pos' : 'neg'}">${fmtPS(v)}</span>`;
const short = (s, n = 38) => s.length > n ? s.slice(0, n - 1) + '…' : s;

/* ---------------- Chart.js: etiquetas propias (sin plugin externo) ---------------- */
const InlineLabels = {
  id: 'inlineLabels',
  afterDatasetsDraw(chart, _a, o) {
    if (!o || !o.enabled) return;
    const ctx = chart.ctx; const horiz = chart.options.indexAxis === 'y';
    ctx.save(); ctx.textBaseline = 'middle';
    chart.data.datasets.forEach((ds, di) => {
      if (ds.labels === false || !chart.isDatasetVisible(di)) return;
      const meta = chart.getDatasetMeta(di);
      const type = ds.type || chart.config.type;
      meta.data.forEach((pt, i) => {
        const v = ds.data[i]; if (v == null || !isFinite(v) || (o.skipZero && !v)) return;
        const f = ds.labelFmt || o.fmt || (x => fmt(x));
        ctx.font = `600 ${o.size || 10.5}px 'IBM Plex Sans', sans-serif`;
        ctx.fillStyle = ds.labelColor || o.color || '#3B4B5C';
        if (type === 'doughnut') {
          const tot = sum(ds.data); if (!tot || v / tot < 0.045) return;
          const p = pt.tooltipPosition(); ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
          ctx.fillText(fmtP(v / tot, 0), p.x, p.y); return;
        }
        const txt = f(v, i);
        if (type === 'line') {
          ctx.textAlign = 'center';
          const pos = typeof ds.labelPos === 'function' ? ds.labelPos(i) : (ds.labelPos || 'top');
          const yy = pt.y + (pos === 'top' ? -12 : 12);
          ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineJoin = 'round';
          ctx.strokeText(txt, pt.x, yy); ctx.fillStyle = ds.labelColor || ds.borderColor; ctx.fillText(txt, pt.x, yy);
        } else if (o.inside) {
          const h = horiz ? pt.width : pt.height; if (Math.abs(h) < 16) return;
          ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(txt, horiz ? pt.x - pt.width / 2 : pt.x, horiz ? pt.y : pt.y + pt.height / 2);
        } else if (horiz) {
          ctx.textAlign = 'left'; ctx.fillText(txt, pt.x + 5, pt.y);
        } else {
          ctx.textAlign = 'center'; ctx.fillText(txt, pt.x, pt.y + (v < 0 ? 9 : -9));
        }
      });
    });
    ctx.restore();
  }
};
const StackTotals = {
  id: 'stackTotals',
  afterDatasetsDraw(chart, _a, o) {
    if (!o || !o.enabled) return;
    const ctx = chart.ctx; const n = chart.data.labels.length; const horiz = chart.options.indexAxis === 'y';
    const f = o.fmt || (x => fmt(x));
    ctx.save(); ctx.font = "700 11.5px 'Space Grotesk', sans-serif"; ctx.fillStyle = COL.ink; ctx.textAlign = horiz ? 'left' : 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      let tot = 0, edge = horiz ? -Infinity : Infinity, pos = null;
      chart.data.datasets.forEach((ds, di) => {
        if (!chart.isDatasetVisible(di)) return;
        const e = chart.getDatasetMeta(di).data[i]; tot += ds.data[i] || 0;
        if (e && (ds.data[i] || 0) > 0) { if (horiz) { edge = Math.max(edge, e.x); pos = e.y; } else { edge = Math.min(edge, e.y); pos = e.x; } }
      });
      if (pos != null && tot > 0) horiz ? ctx.fillText(f(tot), edge + 6, pos) : ctx.fillText(f(tot), pos, edge - 9);
    }
    ctx.restore();
  }
};
Chart.register(InlineLabels, StackTotals);
Chart.defaults.font.family = "'IBM Plex Sans', sans-serif";
Chart.defaults.color = COL.muted;
Chart.defaults.locale = 'es-CO';
const baseGrid = { color: COL.grid };
const tick = { font: { size: 11 }, color: COL.muted };
const xTick = { font: { size: 11.5 }, color: COL.ink };
const legendOpts = (pos = 'bottom') => ({ position: pos, labels: { boxWidth: 10, boxHeight: 10, font: { size: 11 }, color: COL.ink, padding: 14 } });

function ensureChart(id, config) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(el(id).getContext('2d'), config);
}
function hbar(id, labels, data, colors, opts = {}) {
  ensureChart(id, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 2, labelFmt: opts.lf }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false, layout: { padding: { right: opts.padR || 46 } },
      plugins: { legend: { display: false }, inlineLabels: { enabled: true }, tooltip: { callbacks: { title: c => opts.fullLabels ? opts.fullLabels[c[0].dataIndex] : c[0].label, label: c => ' ' + (opts.tt ? opts.tt(c.parsed.x) : fmt(c.parsed.x)) } } },
      scales: { x: { beginAtZero: true, grid: baseGrid, ticks: { ...tick, callback: opts.tf || (v => fmt(v)) } }, y: { grid: { display: false }, ticks: { ...xTick, font: { size: 11 } } } }
    }
  });
}
function donut(id, labels, data, colors, ttFmt = fmt) {
  ensureChart(id, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#fff', borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '52%',
      plugins: { legend: legendOpts('right'), inlineLabels: { enabled: true, size: 11 }, tooltip: { callbacks: { label: c => ` ${c.label}: ${ttFmt(c.parsed)} (${fmtP(c.parsed / sum(c.dataset.data))})` } } }
    }
  });
}
function stacked(id, labels, datasets, opts = {}) {
  ensureChart(id, {
    type: 'bar',
    data: { labels, datasets: datasets.map(d => ({ borderColor: '#fff', borderWidth: { top: 1 }, stack: 's', borderRadius: 1, ...d })) },
    options: {
      indexAxis: opts.horiz ? 'y' : 'x', responsive: true, maintainAspectRatio: false, layout: { padding: opts.horiz ? { right: 50 } : { top: 22 } },
      plugins: {
        legend: legendOpts(), stackTotals: { enabled: opts.totals !== false, fmt: opts.tf }, inlineLabels: { enabled: !!opts.inside, inside: true, size: 10, fmt: opts.lf },
        tooltip: { mode: 'index', intersect: false, filter: i => (opts.horiz ? i.parsed.x : i.parsed.y) > 0, callbacks: { label: c => ` ${c.dataset.label}: ${opts.tt ? opts.tt(opts.horiz ? c.parsed.x : c.parsed.y) : fmt(opts.horiz ? c.parsed.x : c.parsed.y)}` } }
      },
      scales: opts.horiz
        ? { x: { stacked: true, beginAtZero: true, grid: baseGrid, ticks: { ...tick, callback: opts.axf || (v => fmt(v)) }, max: opts.max }, y: { stacked: true, grid: { display: false }, ticks: { ...xTick, font: { size: 11 } } } }
        : { x: { stacked: true, grid: { display: false }, ticks: xTick }, y: { stacked: true, beginAtZero: true, grid: baseGrid, ticks: { ...tick, callback: opts.axf || (v => fmt(v)) }, max: opts.max } }
    }
  });
}

/* ---------------- filtros por pestaña ---------------- */
function filterDefs() {
  const C = DATA.convenios, P = DATA.patrocinios.registros, M = DATA.movilidad;
  const cnt = (rows, k) => { const m = new Map(); rows.forEach(r => m.set(r[k], (m.get(r[k]) || 0) + 1)); return m; };
  const byCount = (rows, k) => sortedEntries(cnt(rows, k)).map(([v, n]) => ({ v, n }));
  const ordered = (list, rows, k, val = () => 1) => list.filter(v => rows.some(r => r[k] === v)).map(v => ({ v, n: sum(rows.filter(r => r[k] === v).map(val)) }));
  const perPat = uniq(P.map(r => r.periodo)).sort();
  return {
    convenios: [
      { key: 'ambito', title: 'Ámbito', type: 'chips', opts: byCount(C.vigentes, 'ambito') },
      { key: 'aplica', title: 'Aplicabilidad', type: 'checks', note: '«Todas las rectorías» y «Sede Tolima-Huila» son los convenios que la sede puede usar directamente.', opts: ordered(['Todas las rectorías', 'Sede Tolima-Huila', 'Otra rectoría', 'Sin especificar'], C.vigentes, 'aplica') },
      { key: 'activo', title: 'Estado de actividad', type: 'chips', opts: ordered(['Activo', 'Inactivo', 'Sin dato'], C.vigentes, 'activo') },
      { key: 'region', title: 'Región del aliado', type: 'checks', color: v => REGION_COLORS[v], opts: byCount(C.vigentes, 'continente') },
      { key: 'tipo', title: 'Tipo de convenio', type: 'checks', open: false, opts: byCount(C.vigentes, 'tipo') },
      { key: 'redes', title: 'Redes: cobertura', type: 'checks', open: false, note: 'Solo afecta la sección «Redes y programas».', opts: byCount(C.redes, 'sede') },
    ],
    patrocinios: [
      { key: 'periodo', title: 'Periodo', type: 'chips', lab: perLab, opts: perPat.map(v => ({ v })), quick: true },
      { key: 'tipo', title: 'Tipo de aporte', type: 'chips', opts: ordered(['Patrocinio', 'Donación'], P, 'tipo', r => r.valor).map(o => ({ v: o.v })) },
      { key: 'cu', title: 'Centro Universitario', type: 'checks', color: v => CU_COLORS[v], opts: ordered(CU_ORDER, P, 'cu', r => r.valor), nfmt: v => '$' + fmt(v / 1e6, 0) + 'M' },
      { key: 'sector', title: 'Sector del aportante', type: 'checks', color: v => SECTOR_COL[v], opts: ordered(['Público', 'Privado', 'Persona natural'], P, 'sector', r => r.valor), nfmt: v => '$' + fmt(v / 1e6, 0) + 'M' },
      { key: 'modalidad', title: 'Modalidad de formación', type: 'checks', open: false, color: v => MOD_COL[v], opts: ordered(Object.keys(MOD_COL), P, 'modalidad', r => r.valor), nfmt: v => '$' + fmt(v / 1e6, 0) + 'M' },
    ],
    movilidad: [
      { key: 'periodo', title: 'Periodo', type: 'chips', opts: M.periodos.map(v => ({ v })), quick: true },
      { key: 'poblacion', title: 'Población', type: 'checks', color: v => POB_COL[v], opts: ordered(Object.keys(POB_COL), M.por_cu, 'poblacion', r => r.total) },
      { key: 'cu', title: 'Centro Universitario', type: 'checks', color: v => CU_COLORS[v], note: 'Los conteos por tipo de movilidad no vienen discriminados por centro; este filtro no los modifica.', opts: ordered(CU_ORDER, M.por_cu.filter(r => r.total > 0), 'cu', r => r.total) },
    ],
  };
}
const DEFS = {};
const F = (tab, key) => state.f[tab][key];
function resetFilters(tab) {
  DEFS[tab].forEach(d => { state.f[tab][d.key] = new Set(d.def || d.opts.map(o => o.v)); });
}

function group(title, key, inner, open = true) {
  const d = document.createElement('details'); d.className = 'filter-group'; d.open = open;
  d.innerHTML = `<summary><span>${title}<span class="count-badge" data-badge="${key}" style="display:none"></span></span><span class="chev">▸</span></summary>`;
  d.appendChild(inner); return d;
}
function buildSidebar() {
  const sb = el('sidebar'); sb.querySelectorAll('.filter-group').forEach(n => n.remove());
  const before = el('clear-all'); const tab = state.tab;
  DEFS[tab].forEach(d => {
    const set = F(tab, d.key);
    const w = document.createElement('div');
    if (d.type === 'chips') {
      const l = document.createElement('div'); l.className = 'chip-list';
      d.opts.forEach(o => {
        const b = document.createElement('button');
        b.className = 'chip' + (set.has(o.v) ? ' active' : ''); b.textContent = d.lab ? d.lab(o.v) : o.v;
        if (o.n != null) b.title = `${fmt(o.n)} registros`;
        b.onclick = () => { set.has(o.v) ? set.delete(o.v) : set.add(o.v); b.classList.toggle('active'); render(); };
        l.appendChild(b);
      });
      w.appendChild(l);
      if (d.quick) {
        const q = document.createElement('div'); q.className = 'quick';
        const all = d.opts.map(o => o.v);
        const years = uniq(all.map(p => p.slice(0, 4)));
        [['Todos', all], ...years.map(y => [y, all.filter(p => p.startsWith(y))])].forEach(([lab, list]) => {
          const b = document.createElement('button'); b.textContent = lab;
          b.onclick = () => { state.f[tab][d.key] = new Set(list); buildSidebar(); render(); }; q.appendChild(b);
        });
        w.appendChild(q);
      }
    } else {
      const l = document.createElement('div'); l.className = 'check-list';
      d.opts.forEach(o => {
        const r = document.createElement('label'); r.className = 'check-row';
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = set.has(o.v);
        cb.onchange = () => { cb.checked ? set.add(o.v) : set.delete(o.v); render(); };
        r.appendChild(cb);
        const sw = d.color ? `<span class="sw" style="background:${d.color(o.v) || COL.nat}"></span>` : '';
        r.insertAdjacentHTML('beforeend', `${sw}<span>${esc(o.v)}</span><span class="n">${o.n != null ? (d.nfmt ? d.nfmt(o.n) : fmt(o.n)) : ''}</span>`);
        l.appendChild(r);
      });
      const q = document.createElement('div'); q.className = 'quick';
      [['Todos', d.opts.map(o => o.v)], ['Ninguno', []]].forEach(([lab, list]) => {
        const b = document.createElement('button'); b.textContent = lab;
        b.onclick = () => { state.f[tab][d.key] = new Set(list); buildSidebar(); render(); }; q.appendChild(b);
      });
      w.append(l, q);
    }
    if (d.note) w.insertAdjacentHTML('beforeend', `<div class="side-note" style="margin-top:8px">${d.note}</div>`);
    sb.insertBefore(group(d.title, d.key, w, d.open !== false), before);
  });
  before.onclick = () => { resetFilters(tab); buildSidebar(); render(); };
  el('side-note').innerHTML = {
    convenios: 'Fuente: consolidado nacional de convenios y redes de UNIMINUTO (activos a noviembre de 2026). Los filtros aplican a los convenios vigentes; «Vencidos» responde al filtro de ámbito.',
    patrocinios: 'Valores en pesos aplicados a estudiantes de la sede. Un estudiante beneficiado en dos periodos se cuenta en cada uno. * periodo en curso.',
    movilidad: 'Consolidados semestrales de movilidad. Se excluyen los centros que ya no hacen parte de la sede (Florencia, Mocoa).',
  }[tab];
}
function syncBadges() {
  DEFS[state.tab].forEach(d => {
    const b = document.querySelector(`[data-badge="${d.key}"]`); if (!b) return;
    const n = F(state.tab, d.key).size, full = n === d.opts.length;
    b.style.display = full ? 'none' : 'inline-block'; b.textContent = n;
  });
}

/* ---------------- arranque ---------------- */
async function boot() {
  DATA = window.__EMBEDDED_DATA__ || await (await fetch('data.json')).json();
  Object.assign(DEFS, filterDefs());
  Object.keys(DEFS).forEach(resetFilters);
  el('as-of').innerHTML = `Corte de datos: <b>${corte().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</b>`;
  el('tabs').innerHTML = TABS.map(([k, l]) => `<button class="tab" data-tab="${k}">${l}</button>`).join('');
  el('tabs').addEventListener('click', e => {
    const b = e.target.closest('.tab'); if (!b) return;
    state.tab = b.dataset.tab; buildSidebar(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  [['q-conv', 'conv', renderConvTable], ['q-redes', 'redes', renderRedesTable], ['q-pat', 'pat', renderPatTable]].forEach(([id, k, fn]) => {
    el(id).addEventListener('input', e => { state.q[k] = e.target.value; fn(); });
  });
  el('credit').innerHTML = 'Fuentes: Consolidado de convenios y redes internacionales (activos a 11-2026), Consolidado de patrocinios y donaciones (2025-1 a 2026-2) y Consolidados de movilidad 2024-1 a 2026-1. Datos agregados e institucionales, sin información personal: los donantes que son personas naturales se muestran de forma anónima. Elaborado para UNIMINUTO Sede Tolima-Huila.';
  buildSidebar(); render();
}

function render() {
  syncBadges();
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === state.tab));
  const ok = ({ convenios: renderConvenios, patrocinios: renderPatrocinios, movilidad: renderMovilidad })[state.tab]();
  el('empty-state').style.display = ok === false ? 'block' : 'none';
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', ok !== false && v.id === 'view-' + state.tab));
}
const summaryOf = (tab, keys) => keys.map(([k, lab]) => {
  const d = DEFS[tab].find(x => x.key === k), s = F(tab, k);
  const txt = s.size === d.opts.length ? 'todos' : s.size ? [...s].map(v => d.lab ? d.lab(v) : v).join(', ') : 'ninguno';
  return `${lab}: <b>${esc(txt)}</b>`;
}).join(' · ');

/* ================================================================
   CONVENIOS Y REDES
================================================================ */
const convRows = () => DATA.convenios.vigentes.filter(r =>
  F('convenios', 'ambito').has(r.ambito) && F('convenios', 'aplica').has(r.aplica) && F('convenios', 'activo').has(r.activo) &&
  F('convenios', 'region').has(r.continente) && F('convenios', 'tipo').has(r.tipo));
const usableSTH = r => r.aplica === 'Todas las rectorías' || r.aplica === 'Sede Tolima-Huila';

function renderConvenios() {
  el('filter-summary').innerHTML = summaryOf('convenios', [['Ámbito', 'ambito'], ['Aplicabilidad', 'aplica'], ['Actividad', 'activo'], ['Región', 'region']].map(([a, b]) => [b, a]));
  const R = convRows();
  if (!R.length) return false;
  const C = DATA.convenios;
  const intl = R.filter(r => r.ambito === 'Internacional').length;
  const paises = groupSum(R.filter(r => r.ambito === 'Internacional'), 'pais', () => 1);
  const topP = sortedEntries(paises)[0];
  const usable = R.filter(usableSTH);
  const in12 = R.filter(r => r.vencimiento && daysTo(r.vencimiento) >= 0 && daysTo(r.vencimiento) <= 365);
  const in6 = in12.filter(r => daysTo(r.vencimiento) <= 182);
  const activos = R.filter(r => r.activo === 'Activo').length;

  el('kpi-conv').innerHTML = [
    kpi('Convenios vigentes', fmt(R.length), `${fmt(intl)} internacionales · ${fmt(R.length - intl)} nacionales`),
    kpi('Disponibles para la sede', fmt(usable.length), `${fmtP(usable.length / R.length, 0)} de la selección · aplican a todas las rectorías o a Tolima-Huila`, COL.teal),
    kpi('Países aliados', fmt(paises.size), topP ? `Mayor presencia: ${esc(topP[0])} (${topP[1]} convenios)` : 'Sin convenios internacionales', COL.ink),
    kpi('Vencen en los próximos 12 meses', fmt(in12.length), `${fmt(in6.length)} en los próximos 6 meses · revisar renovación`, COL.danger),
  ].join('');
  const ambSet = F('convenios', 'ambito');
  const venc = C.vencidos.filter(r => ambSet.has(r.ambito));
  el('kpi-conv2').innerHTML = [
    kpi('Con actividad registrada', `${fmt(activos)}<small> de ${fmt(R.length)}</small>`, `${fmtP(activos / R.length, 0)} marcados como activos`, COL.teal),
    kpi('En proceso de firma', fmt(C.en_proceso.length), `${uniq(C.en_proceso.map(r => r.institucion)).length} instituciones · ${uniq(C.en_proceso.map(r => r.pais)).join(', ')}`, COL.accent),
    kpi('Convenios vencidos (histórico)', fmt(venc.length), 'Registrados en la hoja «Vencidos» · según el filtro de ámbito', COL.nat),
    kpi('Convenios con aliados acreditados', (n => fmt(n))(R.filter(r => r.acreditada === 'Sí').length), 'Solo aplica a convenios nacionales (IES con acreditación de alta calidad)', COL.purple),
  ].join('');

  // País (top 15)
  const P15 = sortedEntries(groupSum(R, 'pais', () => 1)).slice(0, 15);
  hbar('c-conv-pais', P15.map(p => p[0]), P15.map(p => p[1]), P15.map(p => p[0] === 'Colombia' ? COL.ink : REGION_COLORS[(R.find(r => r.pais === p[0]) || {}).continente] || COL.nat));
  // Región
  const reg = sortedEntries(groupSum(R, 'continente', () => 1));
  donut('c-conv-region', reg.map(r => r[0]), reg.map(r => r[1]), reg.map(r => REGION_COLORS[r[0]] || COL.nat));
  // Alcance
  const alc = new Map(); R.forEach(r => r.alcance.forEach(a => alc.set(a, (alc.get(a) || 0) + 1)));
  const alcE = sortedEntries(alc); const conAlc = R.filter(r => r.alcance.length).length;
  hbar('c-conv-alcance', alcE.map(a => a[0]), alcE.map(a => a[1]), alcE.map((_, i) => PALETTE[i % PALETTE.length]));
  el('c-conv-alcance').closest('.panel').querySelector('.panel-sub').textContent = `Un convenio puede cubrir varias actividades · ${fmt(conAlc)} de ${fmt(R.length)} convenios registran alcance`;
  // Vencimientos por año
  const y0 = corte().getFullYear();
  const vy = new Map(); R.forEach(r => { const k = r.vencimiento ? (+r.vencimiento.slice(0, 4) >= y0 + 5 ? `${y0 + 5}+` : r.vencimiento.slice(0, 4)) : 'Indeterminada'; vy.set(k, (vy.get(k) || 0) + 1); });
  const vLabs = [...vy.keys()].sort((a, b) => a === 'Indeterminada' ? 1 : b === 'Indeterminada' ? -1 : a.localeCompare(b));
  ensureChart('c-conv-venc', {
    type: 'bar',
    data: { labels: vLabs, datasets: [{ data: vLabs.map(k => vy.get(k)), backgroundColor: vLabs.map(k => k === String(y0) || k === String(y0 + 1) ? COL.danger : k === 'Indeterminada' ? COL.nat : COL.teal), borderRadius: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, layout: { padding: { top: 18 } }, plugins: { legend: { display: false }, inlineLabels: { enabled: true }, tooltip: { callbacks: { label: c => ` ${fmt(c.parsed.y)} convenios` } } }, scales: { x: { grid: { display: false }, ticks: xTick }, y: { beginAtZero: true, grid: baseGrid, ticks: tick } } }
  });
  // Tipo x carácter
  const tipos = sortedEntries(groupSum(R, 'tipo', () => 1)).map(t => t[0]);
  stacked('c-conv-tipo', tipos, ['Privada', 'Pública'].map((c, i) => ({ label: c, data: tipos.map(t => R.filter(r => r.tipo === t && r.caracter === c).length), backgroundColor: [COL.accent, COL.ink][i] })), { horiz: true, inside: true });
  // Larga estancia
  const lg = ['Sí', 'Validar con el aliado', 'No', 'Sin dato'].map(k => [k, R.filter(r => r.larga_estancia === k).length]).filter(x => x[1]);
  donut('c-conv-larga', lg.map(x => x[0]), lg.map(x => x[1]), lg.map(x => ({ 'Sí': COL.teal, 'Validar con el aliado': COL.accent, 'No': COL.danger, 'Sin dato': COL.nat }[x[0]])));

  // Lectura rápida
  const ins = [];
  const top3 = sortedEntries(paises).slice(0, 3);
  if (top3.length) ins.push(`Los convenios internacionales se concentran en <b>${top3.map(p => `${esc(p[0])} (${p[1]})`).join(', ')}</b>: estos tres países suman el <b>${fmtP(sum(top3.map(p => p[1])) / (intl || 1), 0)}</b> de los convenios internacionales de la selección.`);
  ins.push(`<b>${fmt(usable.length)}</b> convenios (${fmtP(usable.length / R.length, 0)}) están abiertos a todas las rectorías o fueron gestionados por Tolima-Huila, de modo que la sede puede usarlos sin trámites adicionales de adhesión.`);
  const sth = R.filter(r => r.aplica === 'Sede Tolima-Huila');
  if (sth.length) ins.push(`La sede gestionó directamente <b>${sth.length}</b> convenio${sth.length > 1 ? 's' : ''} vigente${sth.length > 1 ? 's' : ''}: ${sth.map(r => `${esc(r.institucion)} (${esc(r.pais)})`).join('; ')}.`);
  const mk = alcE.find(a => a[0] === 'Intercambio estudiantil');
  if (mk) ins.push(`<b>${fmt(mk[1])}</b> convenios contemplan intercambio estudiantil y <b>${fmt((alc.get('Investigación') || 0))}</b> investigación conjunta: es la base disponible para planear movilidad saliente y proyectos con aliados.`);
  if (in12.length) ins.push(`<b>${fmt(in12.length)}</b> convenios vencen antes de ${fmtD(new Date(corte().getTime() + 365 * 864e5).toISOString().slice(0, 10))}; los de uso frecuente por la sede deberían priorizarse para renovación (ver tabla de próximos vencimientos).`);
  const inact = R.filter(r => r.activo === 'Inactivo').length;
  if (inact) ins.push(`<b>${fmt(inact)}</b> convenios vigentes están marcados como inactivos: tienen respaldo jurídico pero no registran actividad, una oportunidad para activarlos con movilidad o proyectos.`);
  el('ins-conv').innerHTML = ins.map(t => `<li>${t}</li>`).join('');

  // Próximos vencimientos
  const prox = [...in12].sort((a, b) => a.vencimiento.localeCompare(b.vencimiento));
  el('t-prox-sub').textContent = prox.length ? `${prox.length} convenios vigentes que vencen en los próximos 12 meses desde el corte` : 'Ningún convenio de la selección vence en los próximos 12 meses';
  el('t-prox').innerHTML = prox.length ? `<thead><tr><th>Vence</th><th class="r">Días</th><th>Institución</th><th>País</th><th>Tipo</th><th>Aplica a</th><th>Estado</th></tr></thead><tbody>` +
    prox.map(r => { const d = daysTo(r.vencimiento); return `<tr><td class="name">${fmtD(r.vencimiento)}</td><td class="r"><span class="tag ${d <= 90 ? 'bad' : d <= 182 ? 'mid' : 'neu'}">${d}</span></td><td class="wrap">${esc(r.institucion)}</td><td>${esc(r.pais)}</td><td>${esc(r.tipo)}</td><td>${aplTag(r)}</td><td>${actTag(r.activo)}</td></tr>`; }).join('') + '</tbody>' : '';

  renderConvTable();
  // En proceso
  el('t-proc').innerHTML = `<thead><tr><th>Institución</th><th>País</th><th>Tipo</th><th>Carácter</th></tr></thead><tbody>` +
    C.en_proceso.map(r => `<tr><td class="wrap">${esc(r.institucion)}</td><td>${esc(r.pais)}</td><td>${esc(r.tipo)}</td><td>${esc(r.caracter || '—')}</td></tr>`).join('') + '</tbody>';
  // Motivos vencidos
  const mot = sortedEntries(groupSum(venc, 'motivo', () => 1));
  el('c-venc-sub').textContent = `Histórico de la hoja «Vencidos» · ${fmt(venc.length)} convenios`;
  hbar('c-conv-motivo', mot.map(m => m[0]), mot.map(m => m[1]), mot.map(m => m[0] === 'Sin registro' ? COL.nat : m[0].startsWith('Sin respuesta') || m[0].startsWith('Decisión') ? COL.danger : COL.accent));

  // Redes
  const RD = C.redes.filter(r => F('convenios', 'redes').has(r.sede));
  const gr = RD.filter(r => r.costo === 'Gratuita').length, pg = RD.filter(r => r.costo === 'Con costo').length;
  el('kpi-redes').innerHTML = [
    kpi('Redes y programas en la selección', fmt(RD.length), `${fmt(C.redes.length)} en el consolidado nacional`, COL.ink),
    kpi('Aplican a todas las rectorías', fmt(C.redes.filter(r => r.sede === 'Todas las rectorías').length), 'Disponibles para la Sede Tolima-Huila', COL.teal),
    kpi('Gratuitas', fmt(gr), `${fmtP(gr / (RD.length || 1), 0)} de la selección`, COL.accent),
    kpi('Con cuota o membresía', fmt(pg), `${fmt(RD.length - gr - pg)} sin información de costo`, COL.danger),
  ].join('');
  const ar = sortedEntries(groupSum(RD, r => short(r.area, 34), () => 1)).slice(0, 12);
  hbar('c-redes-area', ar.map(a => a[0]), ar.map(a => a[1]), ar.map((a, i) => a[0].startsWith('Institucional') ? COL.ink : PALETTE[(i + 1) % PALETTE.length]));
  const cs = ['Gratuita', 'Con costo', 'Sin dato'].map(k => [k, RD.filter(r => r.costo === k).length]).filter(x => x[1]);
  donut('c-redes-costo', cs.map(x => x[0]), cs.map(x => x[1]), cs.map(x => ({ 'Gratuita': COL.teal, 'Con costo': COL.accent, 'Sin dato': COL.nat }[x[0]])));
  renderRedesTable();

  el('notes-conv').innerHTML = [
    'El archivo es el consolidado <b>nacional</b> de UNIMINUTO. La columna «Rectorías en las que aplica» indica qué convenios puede usar la Sede Tolima-Huila: los marcados como «Todas las rectorías» y los gestionados por Tolima-Huila.',
    '«Vigente» significa que el documento no ha vencido; «Activo / Inactivo» indica si el convenio registra actividad. Un convenio puede estar vigente e inactivo.',
    `Los próximos vencimientos se calculan desde la fecha de corte (${fmtD(DATA.corte)}). Los convenios con vencimiento «Indeterminado», «N/A» o sin fecha se agrupan como «Indeterminada».`,
    'Los motivos de no renovación se agruparon en categorías a partir del texto libre de la columna «¿Por qué no se renovó?».',
    'No se publican los enlaces internos de SharePoint del consolidado; solo la página web pública de cada aliado cuando existe.',
  ].map(t => `<li>${t}</li>`).join('');
}
const actTag = a => `<span class="tag ${a === 'Activo' ? 'ok' : a === 'Inactivo' ? 'bad' : 'neu'}">${esc(a)}</span>`;
const aplTag = r => r.aplica === 'Sede Tolima-Huila' ? '<span class="tag sth">Tolima-Huila</span>' : r.aplica === 'Todas las rectorías' ? '<span class="tag ok">Todas</span>' : `<span class="tag neu" title="${esc(r.rectorias)}">${esc(r.aplica)}</span>`;

function sortable(id, cols, rows, defKey, defDir = -1) {
  const s = state.sort[id] || (state.sort[id] = { key: defKey, dir: defDir });
  const c = cols.find(x => x.k === s.key);
  const val = r => c && c.sv ? c.sv(r) : r[s.key];
  rows = [...rows].sort((a, b) => { const x = val(a), y = val(b); return (x == null) - (y == null) || s.dir * (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'es')); });
  const head = `<thead><tr>${cols.map(c => `<th class="${c.r ? 'r ' : ''}${c.s !== false ? 'sort' : ''}${s.key === c.k ? ' on' : ''}" data-k="${c.k}">${c.t}${s.key === c.k ? (s.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead>`;
  return { rows, head, bind: () => el(id).querySelectorAll('th.sort').forEach(th => th.onclick = () => { const k = th.dataset.k; state.sort[id] = { key: k, dir: s.key === k ? -s.dir : (cols.find(x => x.k === k).r ? -1 : 1) }; ({ 't-conv': renderConvTable, 't-redes': renderRedesTable, 't-pat': renderPatTable })[id](); }) };
}
function renderConvTable() {
  const q = state.q.conv.trim().toLowerCase();
  let R = convRows();
  if (q) R = R.filter(r => [r.institucion, r.pais, r.ciudad].join(' ').toLowerCase().includes(q));
  const cols = [
    { k: 'institucion', t: 'Institución' }, { k: 'pais', t: 'País / ciudad' }, { k: 'tipo', t: 'Tipo' }, { k: 'alcance', t: 'Alcance', s: false }, { k: 'vencimiento', t: 'Vence', sv: r => r.vencimiento || '9999' },
    { k: 'aplica', t: 'Aplica a' }, { k: 'activo', t: 'Estado' },
  ];
  const t = sortable('t-conv', cols, R, 'pais', 1);
  el('t-conv').innerHTML = t.head + '<tbody>' + t.rows.map(r => `<tr><td class="wrap">${r.web ? `<a class="ext" href="${/^https?:/.test(r.web) ? esc(r.web) : 'https://' + esc(r.web)}" target="_blank" rel="noopener">${esc(r.institucion)}</a>` : esc(r.institucion)}</td><td>${esc(r.pais)}${r.ciudad ? `<br><span class="small" style="color:var(--muted)">${esc(r.ciudad)}</span>` : ''}</td><td>${esc(r.tipo)}<br><span class="small" style="color:var(--muted)">${esc(r.caracter)}</span></td><td class="small wrap">${r.alcance.length ? esc(r.alcance.join(', ')) : '—'}</td><td>${r.vencimiento ? fmtD(r.vencimiento) : esc(r.vencimiento_txt)}</td><td>${aplTag(r)}</td><td>${actTag(r.activo)}</td></tr>`).join('') + '</tbody>';
  t.bind();
  el('t-conv-count').textContent = `${fmt(R.length)} convenios${q ? ` coinciden con «${state.q.conv}»` : ''}`;
}
function renderRedesTable() {
  const q = state.q.redes.trim().toLowerCase();
  let R = DATA.convenios.redes.filter(r => F('convenios', 'redes').has(r.sede));
  if (q) R = R.filter(r => [r.red, r.area, r.info].join(' ').toLowerCase().includes(q));
  const cols = [{ k: 'red', t: 'Red o programa' }, { k: 'area', t: 'Área de conocimiento' }, { k: 'sede', t: 'Cobertura' }, { k: 'costo', t: 'Costo' }, { k: 'info', t: 'Descripción', s: false }];
  const t = sortable('t-redes', cols, R, 'red', 1);
  el('t-redes').innerHTML = t.head + '<tbody>' + t.rows.map(r => `<tr><td class="name">${esc(r.red)}</td><td class="small wrap">${esc(r.area)}</td><td>${r.sede === 'Todas las rectorías' ? '<span class="tag ok">Todas las rectorías</span>' : `<span class="tag neu">${esc(r.sede)}</span>`}</td><td><span class="tag ${r.costo === 'Gratuita' ? 'ok' : r.costo === 'Con costo' ? 'mid' : 'neu'}">${r.costo}</span></td><td class="small" style="white-space:normal;min-width:260px">${esc(r.info ? short(r.info, 150) : '—')}</td></tr>`).join('') + '</tbody>';
  t.bind();
}

/* ================================================================
   PATROCINIOS Y DONACIONES
================================================================ */
const patRows = () => DATA.patrocinios.registros.filter(r =>
  F('patrocinios', 'periodo').has(r.periodo) && F('patrocinios', 'tipo').has(r.tipo) && F('patrocinios', 'cu').has(r.cu) &&
  F('patrocinios', 'sector').has(r.sector) && F('patrocinios', 'modalidad').has(r.modalidad));
const patPers = () => DEFS.patrocinios.find(d => d.key === 'periodo').opts.map(o => o.v).filter(p => F('patrocinios', 'periodo').has(p));

function renderPatrocinios() {
  el('filter-summary').innerHTML = summaryOf('patrocinios', [['periodo', 'Periodos'], ['tipo', 'Tipo'], ['cu', 'Centros'], ['sector', 'Sector']]) +
    (patPers().some(p => PER_EN_CURSO.includes(p)) ? ' · <span class="ptag">*</span> periodo en curso' : '');
  const R = patRows(); const PER = patPers();
  if (!R.length || !PER.length) return false;
  const val = sum(R.map(r => r.valor)), est = sum(R.map(r => r.est));
  const ents = groupSum(R, 'entidad', 'valor'); const topE = sortedEntries(ents);
  const pub = sum(R.filter(r => r.sector === 'Público').map(r => r.valor));
  const byPer = groupSum(R, 'periodo', 'valor');
  const comp = PER.filter(p => !PER_EN_CURSO.includes(p));
  const last2 = comp.slice(-2);
  const yoy = PER.length >= 3 && PER.includes('2025-2') && PER.includes('2026-2') ? (byPer.get('2026-2') || 0) / (byPer.get('2025-2') || 1) - 1 : null;

  el('kpi-pat').innerHTML = [
    kpi('Valor aplicado', fmtM(val), `${PER.length} periodo${PER.length > 1 ? 's' : ''} · promedio ${fmtM(val / PER.length)} por periodo`),
    kpi('Beneficios a estudiantes', fmt(est), `Valor promedio por beneficio: ${fmtK(val / (est || 1))}`, COL.teal),
    kpi('Entidades aportantes', fmt(ents.size), `${fmt(uniq(R.filter(r => r.tipo === 'Patrocinio').map(r => r.entidad)).length)} patrocinadores · ${fmt(uniq(R.filter(r => r.tipo === 'Donación').map(r => r.entidad)).length)} donantes`, COL.ink),
    kpi('Principal aportante', topE.length ? `<span style="font-size:19px">${esc(short(topE[0][0], 30))}</span>` : '—', topE.length ? `${fmtP(topE[0][1] / val, 0)} del valor · sector público: ${fmtP(pub / val, 0)}` : '', COL.purple),
  ].join('');

  const labels = PER.map(perLab);
  const tipos = ['Patrocinio', 'Donación'].filter(t => F('patrocinios', 'tipo').has(t));
  stacked('c-pat-valor', labels, tipos.map(t => ({ label: t, data: PER.map(p => sum(R.filter(r => r.periodo === p && r.tipo === t).map(r => r.valor)) / 1e6), backgroundColor: PER.map(p => perCol(p, TIPO_COL[t])) })), { tf: v => '$' + fmt(v, 0) + 'M', axf: v => '$' + fmt(v), tt: v => fmtM(v * 1e6) });
  stacked('c-pat-est', labels, tipos.map(t => ({ label: t, data: PER.map(p => sum(R.filter(r => r.periodo === p && r.tipo === t).map(r => r.est))), backgroundColor: PER.map(p => perCol(p, TIPO_COL[t])) })));

  const cuE = CU_ORDER.map(c => [c, sum(R.filter(r => r.cu === c).map(r => r.valor))]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  hbar('c-pat-cu', cuE.map(c => c[0]), cuE.map(c => c[1] / 1e6), cuE.map(c => CU_COLORS[c[0]]), { lf: v => '$' + fmt(v, 0) + 'M', tf: v => '$' + fmt(v), tt: v => fmtM(v * 1e6), padR: 60 });
  const sec = ['Público', 'Privado', 'Persona natural'].map(s => [s, sum(R.filter(r => r.sector === s).map(r => r.valor))]).filter(x => x[1] > 0);
  donut('c-pat-sector', sec.map(s => s[0]), sec.map(s => s[1]), sec.map(s => SECTOR_COL[s[0]]), v => fmtM(v));

  const t12 = topE.slice(0, 12);
  hbar('c-pat-top', t12.map(e => short(e[0], 42)), t12.map(e => e[1] / 1e6), t12.map(e => SECTOR_COL[(R.find(r => r.entidad === e[0]) || {}).sector] || COL.nat), { lf: v => '$' + fmt(v, v < 10 ? 1 : 0) + 'M', tf: v => '$' + fmt(v), tt: v => fmtM(v * 1e6), fullLabels: t12.map(e => e[0]), padR: 64 });

  const mod = Object.keys(MOD_COL).map(m => [m, sum(R.filter(r => r.modalidad === m).map(r => r.valor))]).filter(x => x[1] > 0);
  donut('c-pat-mod', mod.map(m => m[0]), mod.map(m => m[1]), mod.map(m => MOD_COL[m[0]]), v => fmtM(v));

  const promS = tipos.map(t => PER.map(p => { const rr = R.filter(r => r.periodo === p && r.tipo === t); const e = sum(rr.map(r => r.est)); return e ? sum(rr.map(r => r.valor)) / e / 1e3 : null; }));
  const promDs = tipos.map((t, k) => ({ label: t, data: promS[k], borderColor: TIPO_COL[t], backgroundColor: TIPO_COL[t], borderWidth: 2.5, pointRadius: 4, tension: .25,
    labelPos: i => { const o = promS[1 - k]; return !o || o[i] == null || promS[k][i] >= o[i] ? 'top' : 'bottom'; } }));
  ensureChart('c-pat-prom', {
    type: 'line',
    data: { labels, datasets: promDs },
    options: { responsive: true, maintainAspectRatio: false, layout: { padding: { top: 18 } }, plugins: { legend: legendOpts(), inlineLabels: { enabled: true, fmt: v => '$' + fmt(v) + 'k' }, tooltip: { mode: 'index', intersect: false, callbacks: { label: c => ` ${c.dataset.label}: ${fmtK(c.parsed.y * 1e3)}` } } }, scales: { x: { offset: true, grid: { display: false }, ticks: xTick }, y: { grace: '15%', grid: baseGrid, ticks: { ...tick, callback: v => '$' + fmt(v) + 'k' } } } }
  });

  // Lectura rápida
  const ins = [];
  ins.push(`En ${PER.map(perLab).join(', ')} se aplicaron <b>${fmtM(val)}</b> en <b>${fmt(est)}</b> beneficios a estudiantes de la sede, aportados por <b>${fmt(ents.size)}</b> entidades.`);
  if (topE.length >= 2) ins.push(`Alta concentración: <b>${esc(topE[0][0])}</b> aporta el <b>${fmtP(topE[0][1] / val, 0)}</b> del valor y, junto con <b>${esc(topE[1][0])}</b>, el <b>${fmtP((topE[0][1] + topE[1][1]) / val, 0)}</b>. La continuidad de estos convenios es crítica para la matrícula patrocinada.`);
  if (cuE.length) ins.push(`<b>${esc(cuE[0][0])}</b> concentra el <b>${fmtP(cuE[0][1] / val, 0)}</b> del valor aplicado${cuE.length > 1 ? `; le sigue ${esc(cuE[1][0])} con ${fmtP(cuE[1][1] / val, 0)}` : ''}. ${cuE.length < 7 ? `Centros sin aportes en la selección: ${CU_ORDER.filter(c => !cuE.some(x => x[0] === c) && F('patrocinios', 'cu').has(c)).join(', ') || 'ninguno'}.` : ''}`);
  if (yoy != null) ins.push(`Comparando segundos semestres, el valor aplicado pasó de <b>${fmtM(byPer.get('2025-2') || 0)}</b> en 2025-2 a <b>${fmtM(byPer.get('2026-2') || 0)}</b> en 2026-2* (${gapSpan(yoy)}), aunque 2026-2 aún está en curso.`);
  else if (last2.length === 2) ins.push(`Entre ${last2[0]} y ${last2[1]} el valor aplicado varió ${gapSpan((byPer.get(last2[1]) || 0) / (byPer.get(last2[0]) || 1) - 1)}.`);
  const ec = sum(R.filter(r => r.modalidad === 'Educación continua').map(r => r.est));
  if (ec) ins.push(`Los aportes para <b>educación continua</b> benefician a <b>${fmt(ec)}</b> estudiantes con un valor promedio de ${fmtK(sum(R.filter(r => r.modalidad === 'Educación continua').map(r => r.valor)) / ec)}, muy inferior al de la matrícula de pregrado (${fmtK(sum(R.filter(r => r.modalidad === 'Matrícula (pregrado)').map(r => r.valor)) / (sum(R.filter(r => r.modalidad === 'Matrícula (pregrado)').map(r => r.est)) || 1))}).`);
  const don = R.filter(r => r.tipo === 'Donación');
  if (don.length && F('patrocinios', 'tipo').size === 2) ins.push(`Las donaciones representan el <b>${fmtP(sum(don.map(r => r.valor)) / val, 1)}</b> del valor: son pocas entidades recurrentes, con espacio para ampliar la base de donantes privados.`);
  el('ins-pat').innerHTML = ins.map(t => `<li>${t}</li>`).join('');

  // Mapa de calor CU x periodo
  const cus = CU_ORDER.filter(c => F('patrocinios', 'cu').has(c));
  const cell = (c, p) => sum(R.filter(r => r.cu === c && r.periodo === p).map(r => r.valor));
  const max = Math.max(1, ...cus.flatMap(c => PER.map(p => cell(c, p))));
  const heat = v => { if (!v) return 'color:#B8BEC6'; const a = 0.1 + 0.75 * Math.sqrt(v / max); return `background:rgba(226,150,43,${a.toFixed(2)});color:${a > 0.55 ? '#fff' : '#16324F'}`; };
  let h = `<thead><tr><th>Centro Universitario</th>${PER.map(p => `<th class="r">${perLab(p)}</th>`).join('')}<th class="r">Total</th><th class="r">Beneficios</th><th class="r">Participación</th></tr></thead><tbody>`;
  cus.map(c => [c, sum(PER.map(p => cell(c, p)))]).sort((a, b) => b[1] - a[1]).forEach(([c, t]) => {
    h += `<tr><td class="name">${c}</td>${PER.map(p => { const v = cell(c, p); return `<td class="heat" style="${heat(v)}">${v ? fmt(v / 1e6, 1) : '–'}</td>`; }).join('')}<td class="r cell-sc">${fmt(t / 1e6, 1)}</td><td class="r">${fmt(sum(R.filter(r => r.cu === c).map(r => r.est)))}</td><td class="r"><div class="barcell"><span>${fmtP(t / val)}</span><span class="bt"><span class="bf" style="width:${(t / val * 100).toFixed(1)}%;display:block;background:${CU_COLORS[c]}"></span></span></div></td></tr>`;
  });
  h += `<tr class="total"><td>Total</td>${PER.map(p => `<td class="r">${fmt((byPer.get(p) || 0) / 1e6, 1)}</td>`).join('')}<td class="r">${fmt(val / 1e6, 1)}</td><td class="r">${fmt(est)}</td><td class="r">100%</td></tr>`;
  el('t-pat-cu').innerHTML = h + '</tbody>';

  renderPatTable();
  el('notes-pat').innerHTML = [
    'Fuente: hojas por periodo del consolidado (PATR y DONA 2025-1, 2025-2, 2026-1 y 2026-2). Los totales del tablero coinciden con la fila «TOTALES» de cada hoja.',
    '<b>Beneficios</b> = número de estudiantes con aporte aplicado en el periodo. Un mismo estudiante beneficiado en dos semestres se cuenta dos veces, por eso la suma anual puede superar los estudiantes únicos que reporta la hoja «Consolidado».',
    '<b>Modalidad:</b> los aportantes marcados «(EDUCON)» en el archivo corresponden a educación continua; «Gobernación del Tolima - TLB», a técnicos laborales. El resto se aplica a matrícula de pregrado.',
    '<b>Sector:</b> público = gobernaciones, alcaldías, municipios, ICBF y SENA; privado = empresas, cooperativas, fundaciones y gremios. Los donantes que son personas naturales se publican de forma anónima.',
    `2026-2 es el periodo en curso (*): sus cifras pueden aumentar. Las hojas ocultas de becas internas y los totales anuales no se usan, para no duplicar valores.`,
  ].map(t => `<li>${t}</li>`).join('');
}
function renderPatTable() {
  const R = patRows(); const PER = patPers(); if (!R.length) return;
  const q = state.q.pat.trim().toLowerCase();
  const m = new Map();
  R.forEach(r => {
    if (!m.has(r.entidad)) m.set(r.entidad, { entidad: r.entidad, sector: r.sector, tipos: new Set(), mods: new Set(), cus: new Set(), est: 0, total: 0, per: {} });
    const o = m.get(r.entidad); o.tipos.add(r.tipo); o.mods.add(r.modalidad); o.cus.add(r.cu); o.est += r.est; o.total += r.valor; o.per[r.periodo] = (o.per[r.periodo] || 0) + r.valor;
  });
  let rows = [...m.values()];
  if (q) rows = rows.filter(o => o.entidad.toLowerCase().includes(q));
  const cols = [{ k: 'entidad', t: 'Entidad' }, { k: 'sector', t: 'Sector' }, { k: 'tipo', t: 'Tipo', s: false }, ...PER.map(p => ({ k: 'p' + p, t: perLab(p), r: true, sv: o => o.per[p] || 0 })), { k: 'total', t: 'Total', r: true }, { k: 'est', t: 'Beneficios', r: true }, { k: 'cus', t: 'Centros', s: false }];
  const t = sortable('t-pat', cols, rows, 'total', -1);
  el('t-pat').innerHTML = t.head + '<tbody>' + t.rows.map(o => `<tr><td class="wrap name" style="white-space:normal">${esc(o.entidad)}${o.mods.has('Educación continua') ? '<span class="htag">Ed. continua</span>' : ''}${o.mods.has('Técnico laboral (TLB)') ? '<span class="htag">TLB</span>' : ''}</td><td><span class="tag ${o.sector === 'Público' ? 'sth' : o.sector === 'Privado' ? 'mid' : 'neu'}">${o.sector}</span></td><td class="small">${[...o.tipos].join(', ')}</td>${PER.map(p => `<td class="r">${o.per[p] ? fmt(o.per[p] / 1e6, 1) : '<span class="flat">–</span>'}</td>`).join('')}<td class="r cell-sc">${fmt(o.total / 1e6, 1)}</td><td class="r">${fmt(o.est)}</td><td class="small">${CU_ORDER.filter(c => o.cus.has(c)).join(', ')}</td></tr>`).join('') +
    `<tr class="total"><td>Total (${rows.length} entidades)</td><td></td><td></td>${PER.map(p => `<td class="r">${fmt(sum(rows.map(o => o.per[p] || 0)) / 1e6, 1)}</td>`).join('')}<td class="r">${fmt(sum(rows.map(o => o.total)) / 1e6, 1)}</td><td class="r">${fmt(sum(rows.map(o => o.est)))}</td><td></td></tr></tbody>`;
  t.bind();
}

/* ================================================================
   MOVILIDAD
================================================================ */
function renderMovilidad() {
  const M = DATA.movilidad;
  const PER = M.periodos.filter(p => F('movilidad', 'periodo').has(p));
  const POB = Object.keys(POB_COL).filter(p => F('movilidad', 'poblacion').has(p));
  const CUS = CU_ORDER.filter(c => F('movilidad', 'cu').has(c));
  el('filter-summary').innerHTML = summaryOf('movilidad', [['periodo', 'Periodos'], ['poblacion', 'Población'], ['cu', 'Centros']]);
  if (!PER.length || !POB.length || !CUS.length) return false;
  const RC = M.por_cu.filter(r => PER.includes(r.periodo) && POB.includes(r.poblacion) && CUS.includes(r.cu));
  const RT = M.por_tipo.filter(r => PER.includes(r.periodo) && POB.includes(r.poblacion));
  const cuFiltered = DEFS.movilidad.find(d => d.key === 'cu').opts.some(o => !CUS.includes(o.v));
  const excl = M.excluidos.filter(x => PER.includes(x.periodo) && POB.includes(x.poblacion));
  const call = [];
  if (cuFiltered) call.push('Hay un filtro de <b>Centro Universitario</b> activo: los gráficos y tablas por <b>tipo de movilidad</b>, nacional/internacional y entrante/saliente muestran el total de la sede, porque el consolidado no los discrimina por centro.');
  if (excl.length) call.push(`Las cifras por tipo de movilidad de ${uniq(excl.map(x => x.periodo)).join(', ')} incluyen <b>${fmt(sum(excl.map(x => x.total)))}</b> movilidades del centro de Florencia, que ya no hace parte de la sede; los totales por centro sí las excluyen.`);
  el('mov-callout').style.display = call.length ? 'block' : 'none';
  el('mov-callout').innerHTML = call.join('<br>');

  const tot = sum(RC.map(r => r.total));
  const totP = p => sum(RC.filter(r => r.periodo === p).map(r => r.total));
  const estN = sum(RC.filter(r => r.poblacion === 'Estudiantes').map(r => r.total));
  const intl = sum(RT.map(r => r.internacional)), tT = sum(RT.map(r => r.total)), ent = sum(RT.map(r => r.entrante));
  const pFirst = PER[0], pLast = PER[PER.length - 1];
  const sameSem = PER.length >= 3 ? PER.filter(p => p.endsWith(pLast.slice(-1))) : [];
  const yoy = sameSem.length >= 2 ? totP(pLast) / (totP(sameSem[sameSem.length - 2]) || 1) - 1 : null;

  el('kpi-mov').innerHTML = [
    kpi('Movilidades registradas', fmt(tot), yoy != null ? `${perLab(pLast)}: ${fmt(totP(pLast))} · ${gapSpan(yoy)} frente a ${sameSem[sameSem.length - 2]}` : `${PER.length} periodo${PER.length > 1 ? 's' : ''}`),
    kpi('Estudiantes', fmt(estN), `${fmtP(estN / (tot || 1), 0)} de las movilidades · profesores y administrativos: ${fmt(tot - estN)}`, COL.teal),
    kpi('Movilidad internacional', fmtP(intl / (tT || 1), 0), `${fmt(intl)} movilidades internacionales · ${fmt(tT - intl)} nacionales`, COL.purple),
    kpi('Movilidad entrante', fmtP(ent / (tT || 1), 0), `${fmt(ent)} entrantes · ${fmt(tT - ent)} salientes`, COL.ink),
  ].join('');

  const labels = PER;
  stacked('c-mov-per', labels, POB.map(p => ({ label: p, data: PER.map(x => sum(RC.filter(r => r.periodo === x && r.poblacion === p).map(r => r.total))), backgroundColor: POB_COL[p] })));
  const cuAct = CUS.filter(c => RC.some(r => r.cu === c && r.total > 0));
  stacked('c-mov-cu', labels, cuAct.map(c => ({ label: c, data: PER.map(x => sum(RC.filter(r => r.periodo === x && r.cu === c).map(r => r.total))), backgroundColor: CU_COLORS[c] })));
  const shareDs = (a, b, la, lb, ca, cb) => [[a, la, ca], [b, lb, cb]].map(([k, l, c]) => ({ label: l, data: PER.map(x => { const rr = RT.filter(r => r.periodo === x); const t = sum(rr.map(r => r.total)); return t ? sum(rr.map(r => r[k])) / t * 100 : 0; }), backgroundColor: c, n: PER.map(x => sum(RT.filter(r => r.periodo === x).map(r => r[k]))) }));
  const pctOpts = { max: 100, totals: false, inside: true, lf: v => fmt(v, 0) + '%', axf: v => v + '%', tt: v => fmt(v, 1) + '%' };
  stacked('c-mov-nal', labels, shareDs('internacional', 'nacional', 'Internacional', 'Nacional', COL.purple, COL.ink), pctOpts);
  stacked('c-mov-dir', labels, shareDs('entrante', 'saliente', 'Entrante', 'Saliente', COL.teal, COL.accent), pctOpts);

  // Tipos estudiantes
  const tipoAgg = (rows, a, b) => { const m = new Map(); rows.forEach(r => { const o = m.get(r.tipo) || { [a]: 0, [b]: 0, total: 0 }; o[a] += r[a]; o[b] += r[b]; o.total += r.total; m.set(r.tipo, o); }); return [...m.entries()].sort((x, y) => y[1].total - x[1].total); };
  const te = tipoAgg(RT.filter(r => r.poblacion === 'Estudiantes'), 'internacional', 'nacional').slice(0, 12);
  el('c-mov-tipo-est').closest('.panel').style.display = POB.includes('Estudiantes') ? '' : 'none';
  if (te.length) stacked('c-mov-tipo-est', te.map(t => short(t[0], 34)), [['internacional', 'Internacional', COL.purple], ['nacional', 'Nacional', COL.ink]].map(([k, l, c]) => ({ label: l, data: te.map(t => t[1][k]), backgroundColor: c })), { horiz: true });
  // Tipos profesores: agrupa actividad (IN/OUT)
  const pr = RT.filter(r => r.poblacion !== 'Estudiantes');
  const tp = tipoAgg(pr, 'entrante', 'saliente').slice(0, 12);
  el('c-mov-tipo-prof').closest('.panel').style.display = POB.includes('Profesores y administrativos') ? '' : 'none';
  if (tp.length) stacked('c-mov-tipo-prof', tp.map(t => short(t[0], 34)), [['entrante', 'Entrante', COL.teal], ['saliente', 'Saliente', COL.accent]].map(([k, l, c]) => ({ label: l, data: tp.map(t => t[1][k]), backgroundColor: c })), { horiz: true });

  // Meses
  const mes = MESES.map(m => sum(RC.map(r => r.meses[m] || 0)));
  const mIdx = MESES.map((_, i) => i).filter(i => mes[i] > 0 || i < 12);
  ensureChart('c-mov-mes', {
    type: 'bar',
    data: { labels: mIdx.map(i => MESES[i].slice(0, 3) + (i === 12 ? ' fecha' : '')), datasets: POB.map(p => ({ label: p, data: mIdx.map(i => sum(RC.filter(r => r.poblacion === p).map(r => r.meses[MESES[i]] || 0))), backgroundColor: POB_COL[p], stack: 's', borderRadius: 1 })) },
    options: { responsive: true, maintainAspectRatio: false, layout: { padding: { top: 22 } }, plugins: { legend: legendOpts(), stackTotals: { enabled: true }, tooltip: { mode: 'index', intersect: false, callbacks: { title: c => MESES[mIdx[c[0].dataIndex]], label: c => ` ${c.dataset.label}: ${fmt(c.parsed.y)}` } } }, scales: { x: { stacked: true, grid: { display: false }, ticks: xTick }, y: { stacked: true, beginAtZero: true, grid: baseGrid, ticks: tick } } }
  });

  // Lectura rápida
  const ins = [];
  ins.push(`Entre ${pFirst} y ${pLast} se registraron <b>${fmt(tot)}</b> movilidades en la sede: <b>${fmt(estN)}</b> de estudiantes y <b>${fmt(tot - estN)}</b> de profesores y administrativos.`);
  if (PER.length >= 2) ins.push(`La movilidad pasó de <b>${fmt(totP(pFirst))}</b> en ${pFirst} a <b>${fmt(totP(pLast))}</b> en ${pLast} (${gapSpan(totP(pLast) / (totP(pFirst) || 1) - 1)}), con el máximo en <b>${PER.reduce((a, b) => totP(b) > totP(a) ? b : a)}</b> (${fmt(Math.max(...PER.map(totP)))}).`);
  const cuT = cuAct.map(c => [c, sum(RC.filter(r => r.cu === c).map(r => r.total))]).sort((a, b) => b[1] - a[1]);
  if (cuT.length) ins.push(`<b>${cuT[0][0]}</b> concentra el <b>${fmtP(cuT[0][1] / (tot || 1), 0)}</b> de las movilidades${cuT.length > 1 ? `; ${cuT.slice(1).map(c => `${c[0]} ${fmtP(c[1] / tot, c[1] / tot < 0.01 ? 1 : 0)}`).join(', ')}` : ''}. ${CUS.filter(c => !cuAct.includes(c)).length ? `Sin movilidades registradas: ${CUS.filter(c => !cuAct.includes(c)).join(', ')}.` : ''}`);
  const tAll = tipoAgg(RT.filter(r => r.poblacion === 'Estudiantes'), 'internacional', 'nacional');
  const virt = tAll.filter(t => /espejo|COIL|Coursera/i.test(t[0]));
  if (virt.length && POB.includes('Estudiantes')) { const v = sum(virt.map(t => t[1].total)), e = sum(tAll.map(t => t[1].total)); ins.push(`Las modalidades de <b>internacionalización en casa</b> (clase espejo, COIL y Coursera) suman <b>${fmt(v)}</b> movilidades estudiantiles, el <b>${fmtP(v / (e || 1), 0)}</b>: son el principal motor del crecimiento de la movilidad desde 2024-2.`); }
  const phys = tAll.filter(t => /Intercambio|Corta Duración|Co-terminal|Prácticas|Voluntariado|Estancia/i.test(t[0]));
  if (phys.length) ins.push(`La movilidad estudiantil con desplazamiento (intercambio, programas de corta duración, co-terminal, prácticas, estancias, voluntariado) suma <b>${fmt(sum(phys.map(t => t[1].total)))}</b> casos, una proporción pequeña frente a la movilidad virtual.`);
  const mMax = mIdx.filter(i => i < 12).reduce((a, b) => mes[b] > mes[a] ? b : a, 0);
  if (mes[mMax]) ins.push(`El mes con más movilidades iniciadas es <b>${MESES[mMax].toLowerCase()}</b> (${fmt(mes[mMax])}); diciembre y enero prácticamente no registran actividad.`);
  el('ins-mov').innerHTML = ins.map(t => `<li>${t}</li>`).join('');

  // Mapa de calor CU x periodo
  const cell = (c, p) => sum(RC.filter(r => r.cu === c && r.periodo === p).map(r => r.total));
  const max = Math.max(1, ...CUS.flatMap(c => PER.map(p => cell(c, p))));
  const heat = v => { if (!v) return 'color:#B8BEC6'; const a = 0.1 + 0.75 * Math.sqrt(v / max); return `background:rgba(47,122,109,${a.toFixed(2)});color:${a > 0.55 ? '#fff' : '#16324F'}`; };
  let h = `<thead><tr><th>Centro Universitario</th>${PER.map(p => `<th class="r">${p}</th>`).join('')}<th class="r">Total</th><th class="r">Participación</th></tr></thead><tbody>`;
  CUS.map(c => [c, sum(PER.map(p => cell(c, p)))]).sort((a, b) => b[1] - a[1]).forEach(([c, t]) => {
    h += `<tr><td class="name">${c}</td>${PER.map(p => { const v = cell(c, p); return `<td class="heat" style="${heat(v)}">${v ? fmt(v) : '–'}</td>`; }).join('')}<td class="r cell-sc">${fmt(t)}</td><td class="r"><div class="barcell"><span>${fmtP(t / (tot || 1))}</span><span class="bt"><span class="bf" style="width:${(t / (tot || 1) * 100).toFixed(1)}%;display:block;background:${CU_COLORS[c]}"></span></span></div></td></tr>`;
  });
  h += `<tr class="total"><td>Total</td>${PER.map(p => `<td class="r">${fmt(totP(p))}</td>`).join('')}<td class="r">${fmt(tot)}</td><td class="r">100%</td></tr>`;
  el('t-mov-cu').innerHTML = h + '</tbody>';

  // Detalle por tipo
  const keyOf = r => (r.poblacion === 'Estudiantes' ? 'Estudiantes' : (r.rol || 'Profesores y administrativos')) + '||' + r.tipo;
  const keys = uniq(RT.map(keyOf));
  const rowsT = keys.map(k => { const rr = RT.filter(r => keyOf(r) === k); const [g, t] = k.split('||'); return { g, t, per: Object.fromEntries(PER.map(p => [p, sum(rr.filter(r => r.periodo === p).map(r => r.total))])), total: sum(rr.map(r => r.total)), intl: sum(rr.map(r => r.internacional)) }; })
    .sort((a, b) => a.g.localeCompare(b.g) || b.total - a.total);
  let ht = `<thead><tr><th>Población</th><th>Tipo de movilidad</th>${PER.map(p => `<th class="r">${p}</th>`).join('')}<th class="r">Total</th><th class="r">% I</th></tr></thead><tbody>`;
  rowsT.forEach(o => { ht += `<tr><td class="small">${esc(o.g)}</td><td class="name" style="white-space:normal">${esc(o.t)}</td>${PER.map(p => `<td class="r">${o.per[p] ? fmt(o.per[p]) : '<span class="flat">–</span>'}</td>`).join('')}<td class="r cell-sc">${fmt(o.total)}</td><td class="r">${fmtP(o.intl / (o.total || 1), 0)}</td></tr>`; });
  ht += `<tr class="total"><td></td><td>Total</td>${PER.map(p => `<td class="r">${fmt(sum(rowsT.map(o => o.per[p])))}</td>`).join('')}<td class="r">${fmt(sum(rowsT.map(o => o.total)))}</td><td class="r">${fmtP(intl / (tT || 1), 0)}</td></tr>`;
  el('t-mov-tipo').innerHTML = ht + '</tbody>';

  el('notes-mov').innerHTML = [
    'Fuente: cinco consolidados semestrales (2024-1 a 2026-1), hoja «Resumen». Cada movilidad se asigna al mes de su fecha inicial.',
    'Los totales por Centro Universitario excluyen Florencia y Mocoa, que ya no hacen parte de la Sede Tolima-Huila. Los cuadros por tipo de movilidad no vienen por centro, por eso incluyen las 37 movilidades de Florencia registradas en 2024-1.',
    'Lérida aparece en los consolidados desde 2025-1; La Dorada y Planadas no registran movilidades en ningún periodo.',
    '<b>Entrante:</b> personas de otras instituciones que llegan a la sede; <b>saliente:</b> estudiantes o colaboradores de la sede que participan en otra institución. Incluye modalidades virtuales (clase espejo, COIL, Coursera).',
    'En profesores y administrativos, el tipo combina la actividad registrada (p. ej. «PROF - IN Profesor visitante» → Profesor visitante, entrante). Las filas «Sin tipo (pendiente)» son registros que el consolidado aún no clasifica.',
  ].map(t => `<li>${t}</li>`).join('');
}

document.addEventListener('DOMContentLoaded', boot);
