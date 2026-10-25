import { store } from './store.js';

// ---------- Datos fijos ----------

const CATS = [
  { id: 'vivienda', label: 'Vivienda', emoji: '🏠' },
  { id: 'servicios', label: 'Servicios', emoji: '💡' },
  { id: 'comida', label: 'Comida', emoji: '🛒' },
  { id: 'transporte', label: 'Transporte', emoji: '🚗' },
  { id: 'salud', label: 'Salud', emoji: '💊' },
  { id: 'educacion', label: 'Educación', emoji: '📚' },
  { id: 'impuestos', label: 'Impuestos', emoji: '🧾' },
  { id: 'ropa', label: 'Ropa', emoji: '👕' },
  { id: 'salidas', label: 'Salidas', emoji: '🎉' },
  { id: 'mascotas', label: 'Mascotas', emoji: '🐾' },
  { id: 'otros', label: 'Otros', emoji: '📦' },
];
const CAT = Object.fromEntries(CATS.map((c) => [c.id, c]));
const DEBT_CAT = { label: 'Cuotas de deudas', emoji: '💳' };

const ICONS = {
  resumen: '<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z"/><path d="M15 3.8a8.5 8.5 0 0 1 5.2 5.2H15z"/>',
  ingresos: '<path d="M12 4v10m-4-4 4 4 4-4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  fijos: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4m8-4v4"/>',
  gastos: '<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20.5 8H6"/><circle cx="10" cy="19.5" r="1.2"/><circle cx="17" cy="19.5" r="1.2"/>',
  deudas: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
  ajustes: '<path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 8v5m0 3.5v.01"/><path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
};
const icon = (name, size = 20) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const LOGO = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
  <defs><linearGradient id="lg${size}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3ddc6f"/><stop offset="1" stop-color="#0f9d58"/></linearGradient></defs>
  <rect width="64" height="64" rx="15" fill="url(#lg${size})"/>
  <path d="M13 31 32 15l19 16v16a3.5 3.5 0 0 1-3.5 3.5h-31A3.5 3.5 0 0 1 13 47z" fill="#fff"/>
  <text x="32" y="45.5" text-anchor="middle" font-family="-apple-system,Helvetica,Arial,sans-serif" font-weight="700" font-size="19" fill="#0f9d58">$</text></svg>`;

const VIEWS = [
  { id: 'resumen', title: 'Resumen', tab: 'Resumen' },
  { id: 'ingresos', title: 'Ingresos', tab: 'Ingresos' },
  { id: 'fijos', title: 'Gastos fijos', tab: 'Fijos' },
  { id: 'gastos', title: 'Gastos del mes', tab: 'Gastos' },
  { id: 'deudas', title: 'Deudas', tab: 'Deudas' },
  { id: 'ajustes', title: 'Ajustes' },
];

const KINDS = {
  expense: { name: 'gasto', title: 'Nuevo gasto', editTitle: 'Editar gasto', emoji: '🛒', hint: 'Algo que compraron o pagaron hoy' },
  income: { name: 'ingreso', title: 'Nuevo ingreso', editTitle: 'Editar ingreso', emoji: '💰', hint: 'Un sueldo, jubilación o changa' },
  fixed: { name: 'gasto fijo', title: 'Nuevo gasto fijo', editTitle: 'Editar gasto fijo', emoji: '📅', hint: 'Se paga todos los meses: alquiler, luz…' },
  debt: { name: 'deuda', title: 'Nueva deuda', editTitle: 'Editar deuda', emoji: '💳', hint: 'Tarjeta, préstamo, plan en cuotas' },
};
const VIEW_KIND = { ingresos: 'income', fijos: 'fixed', gastos: 'expense', deudas: 'debt' };

// ---------- Utilidades ----------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const fmt = (n) => moneyFmt.format(Math.round(n || 0));
const inputFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
const sum = (arr, f) => arr.reduce((t, x) => t + (Number(f(x)) || 0), 0);

function parseMoney(s) {
  const n = parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}
function formatMoneyInput(el) {
  const [int, ...dec] = el.value.replace(/[^\d,]/g, '').split(',');
  const grouped = int.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  el.value = grouped + (dec.length ? ',' + dec.join('').slice(0, 2) : '');
}

const pad = (n) => String(n).padStart(2, '0');
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const isoDate = (d) => `${monthKey(d)}-${pad(d.getDate())}`;
const fromKey = (m) => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo - 1, 1); };
const addMonths = (m, n) => { const d = fromKey(m); return monthKey(new Date(d.getFullYear(), d.getMonth() + n, 1)); };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const monthLabel = (m) => cap(new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(fromKey(m)));
const monthShort = (m) => cap(new Intl.DateTimeFormat('es-AR', { month: 'short', year: 'numeric' }).format(fromKey(m))).replace('.', '');
const thisMonth = () => monthKey(new Date());

function dayLabel(iso) {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (iso === isoDate(today)) return 'Hoy';
  if (iso === isoDate(yesterday)) return 'Ayer';
  const [y, m, d] = iso.split('-').map(Number);
  return cap(new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d)));
}

// ---------- Cálculos ----------

const isPaid = (item, m) => item.paid?.[m] != null;
const debtCuota = (d, m) => (isPaid(d, m) ? d.paid[m] : Math.min(d.cuota || 0, d.saldo || 0));

function calc(m) {
  const items = store.items;
  const byDay = (a, b) => (a.day || 99) - (b.day || 99) || (a.name || '').localeCompare(b.name || '');
  const incomes = items
    .filter((i) => i.kind === 'income' && (i.freq === 'unico' ? i.month === m : (i.desde || '') <= m))
    .sort(byDay);
  const fixed = items.filter((i) => i.kind === 'fixed' && (i.desde || '') <= m).sort(byDay);
  const debts = items
    .filter((i) => i.kind === 'debt' && (i.desde || '') <= m && ((i.saldo || 0) > 0.5 || isPaid(i, m)))
    .sort(byDay);
  const expenses = items
    .filter((i) => i.kind === 'expense' && (i.date || '').startsWith(m))
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created || 0) - (a.created || 0));

  const totIn = sum(incomes, (i) => i.amount);
  const totFixed = sum(fixed, (i) => i.amount);
  const totDebt = sum(debts, (d) => debtCuota(d, m));
  const totExp = sum(expenses, (i) => i.amount);
  const committed = totFixed + totDebt;

  const pending = [
    ...fixed.filter((f) => !isPaid(f, m)).map((item) => ({ item, amount: item.amount })),
    ...debts.filter((d) => !isPaid(d, m) && debtCuota(d, m) > 0).map((item) => ({ item, amount: debtCuota(item, m) })),
  ].sort((a, b) => (a.item.day || 99) - (b.item.day || 99));

  const cats = {};
  for (const i of [...fixed, ...expenses]) cats[i.cat || 'otros'] = (cats[i.cat || 'otros'] || 0) + (i.amount || 0);
  if (totDebt) cats.__deudas = totDebt;

  return {
    m, incomes, fixed, debts, expenses, totIn, totFixed, totDebt, totExp, committed, pending, cats,
    totPending: sum(pending, (p) => p.amount),
    free: totIn - committed - totExp,
  };
}

// Mes en que se termina de pagar una deuda si siguen pagando la cuota.
function payoff(d) {
  if (!((d.saldo || 0) > 0.5) || !(d.cuota > 0)) return null;
  const cur = thisMonth();
  const n = Math.ceil(d.saldo / d.cuota - 1e-9);
  return { n, end: addMonths(cur, isPaid(d, cur) ? n : n - 1) };
}

function debtSummary() {
  const active = store.items.filter((i) => i.kind === 'debt' && (i.saldo || 0) > 0.5);
  let last = null;
  let unknown = false;
  for (const d of active) {
    const p = payoff(d);
    if (!p) unknown = true;
    else if (!last || p.end > last) last = p.end;
  }
  return { active, total: sum(active, (d) => d.saldo), last, unknown };
}

function monthsBetween(a, b) {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

// ---------- Estado de la interfaz ----------

const state = {
  view: viewFromHash(),
  month: thisMonth(),
};
function viewFromHash() {
  const id = location.hash.slice(1);
  return VIEWS.some((v) => v.id === id) ? id : 'resumen';
}

const appEl = document.getElementById('app');
const sheetEl = document.getElementById('sheet-root');

function render() {
  const s = store.status;
  appEl.className = s === 'ready' ? 'app' : 'screen';
  if (s === 'loading') appEl.innerHTML = `<div class="splash">${LOGO(72)}</div>`;
  else if (s === 'signed-out') appEl.innerHTML = loginScreen();
  else if (s === 'denied') appEl.innerHTML = deniedScreen();
  else if (s === 'error') appEl.innerHTML = errorScreen();
  else appEl.innerHTML = shell();
}

// ---------- Instalar en la pantalla de inicio ----------

const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isPhone = () => matchMedia('(pointer: coarse)').matches;
let installPrompt = null;
let installDismissed = false;
try { installDismissed = localStorage.getItem('finanzas-familia:instalar-oculto') === '1'; } catch {}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  render();
});
window.addEventListener('appinstalled', () => { installPrompt = null; render(); });

function installBanner() {
  if (isStandalone() || installDismissed || !isPhone()) return '';
  const how = installPrompt
    ? '<button class="btn btn-primary btn-inline" data-action="install">Instalar</button>'
    : isIOS()
      ? `<span>Tocá <b>Compartir</b> <svg class="share-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg> abajo y después <b>Agregar a inicio</b>.</span>`
      : '<span>Tocá el menú <b>⋮</b> arriba a la derecha y después <b>Agregar a la pantalla principal</b>.</span>';
  return `<section class="card install">
    <img src="icon-180.png" alt="" width="48" height="48">
    <div class="install-text"><b>Tenela como una app</b>${how}</div>
    <button class="install-close" data-action="install-dismiss" aria-label="Ocultar">${icon('x', 16)}</button>
  </section>`;
}

// ---------- Pantallas de acceso ----------

function loginScreen() {
  return `<div class="gate card">
    ${LOGO(76)}
    <h1>Finanzas de la familia</h1>
    <p>Entrá con tu cuenta de Google para ver y cargar los gastos de la casa.</p>
    <button class="btn btn-primary" data-action="sign-in">
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#fff" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/></svg>
      Entrar con Google
    </button>
    <p class="muted small">Entrás una sola vez: la sesión queda guardada en este celular.</p>
  </div>`;
}

function deniedScreen() {
  return `<div class="gate card">
    ${LOGO(64)}
    <h1>Todavía no tenés acceso</h1>
    <p>La cuenta <b>${esc(store.user?.email)}</b> todavía no tiene acceso. Pedile a Fabricio el <b>link de invitación</b> y abrilo desde este celular.</p>
    <button class="btn btn-secondary" data-action="sign-out">Entrar con otra cuenta</button>
  </div>`;
}

function errorScreen() {
  return `<div class="gate card">
    ${LOGO(64)}
    <h1>No se pudo conectar</h1>
    <p>Revisá que haya internet y volvé a intentar.</p>
    <p class="muted small">${esc(store.error)}</p>
    <button class="btn btn-primary" data-action="reload">Reintentar</button>
  </div>`;
}

// ---------- Estructura principal ----------

function shell() {
  const c = calc(state.month);
  const view = VIEWS.find((v) => v.id === state.view);
  const showMonth = state.view !== 'ajustes';
  return `
  <aside class="sidebar">
    <div class="brand">${LOGO(30)}<div><div class="brand-name">Finanzas</div><div class="brand-sub">de la familia</div></div></div>
    <nav class="nav">
      ${VIEWS.map((v) => `<a href="#${v.id}" class="nav-item ${v.id === state.view ? 'active' : ''}">${icon(v.id, 18)}<span>${v.title}</span></a>`).join('')}
    </nav>
    ${store.mode === 'local' ? '<a href="#ajustes" class="side-note">Modo prueba · solo este dispositivo</a>' : ''}
  </aside>
  <div class="main">
    <header class="toolbar">
      <a class="tb-icon only-mobile" href="#ajustes" aria-label="Ajustes">${icon('ajustes', 22)}</a>
      ${showMonth ? monthSwitcher() : '<span class="tb-spacer"></span>'}
      <button class="tb-add" data-action="add" aria-label="Agregar">${icon('plus', 20)}<span>Agregar</span></button>
    </header>
    <main class="content">
      <h1 class="large-title">${view.title}</h1>
      ${RENDER[view.id](c)}
    </main>
  </div>
  <nav class="tabbar">
    ${VIEWS.filter((v) => v.tab).map((v) => `<a href="#${v.id}" class="tab ${v.id === state.view ? 'active' : ''}">${icon(v.id, 24)}<span>${v.tab}</span></a>`).join('')}
  </nav>`;
}

function monthSwitcher() {
  const isCurrent = state.month === thisMonth();
  return `<div class="month">
    <button class="month-arrow" data-action="month-prev" aria-label="Mes anterior">${icon('left', 18)}</button>
    <button class="month-label" data-action="month-today" title="Volver al mes actual">
      ${monthLabel(state.month)}${isCurrent ? '' : '<span class="month-today">Ir a hoy</span>'}
    </button>
    <button class="month-arrow" data-action="month-next" aria-label="Mes siguiente">${icon('right', 18)}</button>
  </div>`;
}

// ---------- Piezas reutilizables ----------

function row({ id, lead, title, sub = '', amount = '', amountClass = '', check = null, extra = '' }) {
  return `<div class="row" data-action="edit" data-id="${id}" role="button" tabindex="0">
    ${check ? checkBtn(check) : ''}
    ${lead ? `<div class="bubble">${lead}</div>` : ''}
    <div class="row-main">
      <div class="row-title">${esc(title)}</div>
      ${sub ? `<div class="row-sub">${sub}</div>` : ''}
      ${extra}
    </div>
    <div class="row-amount ${amountClass}">${amount}</div>
  </div>`;
}

function checkBtn({ id, on, label }) {
  return `<button class="check ${on ? 'on' : ''}" data-action="toggle" data-id="${id}" aria-pressed="${on}"
    aria-label="${on ? 'Desmarcar pago de' : 'Marcar como pagado'} ${esc(label)}" title="${on ? 'Pagado · tocá para desmarcar' : 'Tocá cuando lo paguen'}">${icon('check', 15)}</button>`;
}

function dueText(item, m) {
  if (isPaid(item, m)) return '<span class="tone-good">Pagado</span>';
  if (!item.day) return '';
  const cur = thisMonth();
  const today = new Date().getDate();
  if (m < cur || (m === cur && item.day < today)) return `<span class="tone-bad">Venció el día ${item.day}</span>`;
  if (m === cur && item.day === today) return '<span class="tone-warn">Vence hoy</span>';
  if (m === cur && item.day - today <= 5) return `<span class="tone-warn">Vence el día ${item.day}</span>`;
  return `Vence el día ${item.day}`;
}

const join = (...parts) => parts.filter(Boolean).join(' · ');

function sectionHead(title, right = '') {
  return `<div class="section-head"><h2>${title}</h2>${right ? `<span>${right}</span>` : ''}</div>`;
}

function empty(kind, text, withButton = true) {
  const k = KINDS[kind];
  return `<div class="card empty">
    <div class="empty-emoji">${k.emoji}</div>
    <p>${text}</p>
    ${withButton ? `<button class="btn btn-primary btn-inline" data-action="new" data-kind="${kind}">${icon('plus', 18)} Cargar ${k.name}</button>` : ''}
  </div>`;
}

function summaryTiles(tiles) {
  return `<div class="tiles">${tiles.map((t) => `<div class="tile ${t.go ? 'link' : ''}" ${t.go ? `data-action="go" data-view="${t.go}"` : ''}>
    <div class="tile-label">${t.label}</div>
    <div class="tile-value ${t.tone ? 'tone-' + t.tone : ''}">${t.value}</div>
    ${t.sub ? `<div class="tile-sub">${t.sub}</div>` : ''}
  </div>`).join('')}</div>`;
}

function meter(fraction, tone) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return `<div class="meter"><span class="fill-${tone}" style="width:${pct.toFixed(1)}%"></span></div>`;
}

// ---------- Vistas ----------

const RENDER = {
  resumen: viewResumen,
  ingresos: viewIngresos,
  fijos: viewFijos,
  gastos: viewGastos,
  deudas: viewDeudas,
  ajustes: viewAjustes,
};

function viewResumen(c) {
  const has = (k) => store.items.some((i) => i.kind === k);
  const setupDone = has('income') && has('fixed');
  const parts = [];

  parts.push(installBanner());

  if (store.mode === 'local') {
    parts.push(`<a href="#ajustes" class="banner">${icon('alert', 18)}<span><b>Modo prueba:</b> los datos se guardan solo en este dispositivo.</span></a>`);
  }

  if (!setupDone) {
    const step = (n, kind, title, text, done) => `
      <button class="step ${done ? 'done' : ''}" data-action="new" data-kind="${kind}">
        <span class="step-n">${done ? icon('check', 16) : n}</span>
        <span class="step-text"><b>${title}</b><span>${text}</span></span>
        ${icon('right', 18)}
      </button>`;
    parts.push(`<section class="card welcome">
      <h2>¡Bienvenidos! 👋</h2>
      <p>Carguen esto una sola vez y la app hace todas las cuentas sola.</p>
      <div class="steps">
        ${step(1, 'income', 'Lo que entra', 'Sueldos, jubilaciones, changas', has('income'))}
        ${step(2, 'fixed', 'Los gastos fijos', 'Alquiler, luz, gas, internet, colegio…', has('fixed'))}
        ${step(3, 'debt', 'Las deudas', 'Tarjetas, préstamos, planes en cuotas', has('debt'))}
      </div>
      <p class="muted small">Después, cada vez que gasten algo, lo cargan con el botón <b>+</b>.</p>
    </section>`);
    if (!store.items.length) return parts.join('');
  }

  const out = c.committed + c.totExp;
  const pct = c.totIn > 0 ? out / c.totIn : out > 0 ? Infinity : 0;
  const status = pct <= 0.85
    ? { tone: 'good', text: 'Vienen bien', ic: 'check' }
    : pct <= 1
      ? { tone: 'warn', text: 'Muy justo', ic: 'alert' }
      : { tone: 'bad', text: 'No alcanza', ic: 'alert' };

  parts.push(`<section class="card hero">
    <div class="hero-label">${c.free >= 0 ? 'Les queda disponible' : 'Les falta'}</div>
    <div class="hero-amount ${c.free < 0 ? 'tone-bad' : ''}">${fmt(Math.abs(c.free))}</div>
    <div class="hero-sub">Entran <b>${fmt(c.totIn)}</b> y salen <b>${fmt(out)}</b> en ${monthLabel(c.m).toLowerCase()}</div>
    ${c.totIn > 0 ? meter(pct, status.tone) : ''}
    <div class="hero-foot">
      <span class="pill pill-${status.tone}">${icon(status.ic, 14)} ${status.text}</span>
      <span class="muted">${c.totIn > 0 ? `Usan el ${Math.round(pct * 100)}% de lo que entra` : 'Carguen los ingresos para calcular cuánto queda'}</span>
    </div>
  </section>`);

  if (c.free < 0 && c.totIn > 0) {
    parts.push(`<div class="callout callout-bad">${icon('alert', 20)}<div><b>Este mes faltan ${fmt(-c.free)}.</b> Lo que hay que pagar supera lo que entra. Miren abajo a dónde va la plata para ver qué se puede recortar.</div></div>`);
  }

  parts.push(summaryTiles([
    { label: 'Ingresos', value: fmt(c.totIn), go: 'ingresos' },
    { label: 'Gastos fijos', value: fmt(c.totFixed), go: 'fijos' },
    { label: 'Cuotas de deudas', value: fmt(c.totDebt), go: 'deudas' },
    { label: 'Gastos del mes', value: fmt(c.totExp), go: 'gastos' },
  ]));

  // Lo que falta pagar
  if (c.fixed.length || c.debts.length) {
    if (c.pending.length) {
      parts.push(sectionHead('Falta pagar', `<b>${fmt(c.totPending)}</b>`));
      parts.push(`<div class="list card">${c.pending.map(({ item, amount }) => row({
        id: item.id,
        check: { id: item.id, on: false, label: item.name },
        title: item.name,
        sub: join(item.kind === 'debt' ? 'Cuota de deuda' : CAT[item.cat]?.label, dueText(item, c.m)),
        amount: fmt(amount),
      })).join('')}</div>`);
      parts.push('<p class="hint">Tocá el círculo cuando algo ya esté pagado.</p>');
    } else {
      parts.push(`<div class="callout callout-good">${icon('check', 20)}<div><b>¡Todo pagado este mes!</b> Gastos fijos y cuotas al día.</div></div>`);
    }
  }

  // A dónde va la plata
  const entries = Object.entries(c.cats).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (entries.length) {
    const max = entries[0][1];
    const total = sum(entries, (e) => e[1]);
    parts.push(sectionHead('¿A dónde va la plata?', fmt(total)));
    parts.push(`<div class="card bars">${entries.map(([id, v]) => {
      const cat = id === '__deudas' ? DEBT_CAT : CAT[id] || CAT.otros;
      return `<div class="bar-row" title="${esc(cat.label)}: ${fmt(v)} (${Math.round((v / total) * 100)}%)">
        <div class="bar-label"><span>${cat.emoji}</span>${cat.label}</div>
        <div class="bar-track"><span style="width:${((v / max) * 100).toFixed(1)}%"></span></div>
        <div class="bar-value">${fmt(v)}<span>${Math.round((v / total) * 100)}%</span></div>
      </div>`;
    }).join('')}</div>`);
  }

  // Deudas
  const ds = debtSummary();
  if (ds.active.length) {
    const months = ds.last ? monthsBetween(thisMonth(), ds.last) + 1 : null;
    parts.push(sectionHead('Deudas'));
    parts.push(`<div class="card debt-card link" data-action="go" data-view="deudas">
      <div><div class="tile-label">Total que deben</div><div class="debt-total">${fmt(ds.total)}</div></div>
      <div class="debt-free">${ds.last && !ds.unknown
        ? `Pagando las cuotas, quedan <b>libres de deudas en ${monthLabel(ds.last).toLowerCase()}</b> (${months} ${months === 1 ? 'mes' : 'meses'}).`
        : ds.last
          ? `Las deudas con cuota terminan en <b>${monthLabel(ds.last).toLowerCase()}</b>. Hay deudas sin cuota fija.`
          : 'Carguen la cuota mensual de cada deuda para calcular cuándo terminan.'}</div>
    </div>`);
  }

  return parts.join('');
}

function viewIngresos(c) {
  if (!c.incomes.length) return empty('income', 'Carguen lo que entra a la casa: sueldos, jubilaciones, changas.');
  return summaryTiles([
    { label: 'Total del mes', value: fmt(c.totIn) },
    { label: 'Después de fijos y cuotas', value: fmt(c.totIn - c.committed), tone: c.totIn - c.committed < 0 ? 'bad' : '', sub: 'Para el día a día' },
  ]) + `<div class="list card">${c.incomes.map((i) => row({
    id: i.id,
    lead: '💰',
    title: i.name,
    sub: join(esc(i.person), i.freq === 'unico' ? 'Solo este mes' : 'Todos los meses', i.day ? `Cobra el día ${i.day}` : ''),
    amount: fmt(i.amount),
    amountClass: 'tone-good',
  })).join('')}</div>`;
}

function viewFijos(c) {
  if (!c.fixed.length) return empty('fixed', 'Carguen lo que se paga todos los meses: alquiler, luz, gas, internet, colegio…');
  const paid = sum(c.fixed.filter((f) => isPaid(f, c.m)), (f) => f.amount);
  return summaryTiles([
    { label: 'Total por mes', value: fmt(c.totFixed) },
    { label: 'Ya pagado', value: fmt(paid), tone: 'good' },
    { label: 'Falta pagar', value: fmt(c.totFixed - paid), tone: c.totFixed - paid > 0 ? 'warn' : '' },
  ]) + `<div class="list card">${c.fixed.map((f) => row({
    id: f.id,
    check: { id: f.id, on: isPaid(f, c.m), label: f.name },
    lead: CAT[f.cat]?.emoji || '📦',
    title: f.name,
    sub: join(CAT[f.cat]?.label, dueText(f, c.m)),
    amount: fmt(f.amount),
  })).join('')}</div>
  <p class="hint">Tocá el círculo cuando lo paguen. Cada mes empieza sin marcar.</p>`;
}

function viewGastos(c) {
  const left = c.totIn - c.committed - c.totExp;
  const add = `<button class="btn btn-primary big-add" data-action="new" data-kind="expense">${icon('plus', 20)} Cargar un gasto</button>`;
  if (!c.expenses.length) return add + empty('expense', 'Acá van los gastos del día a día: súper, nafta, farmacia, salidas…', false);
  const groups = {};
  for (const e of c.expenses) (groups[e.date] ||= []).push(e);
  return add + summaryTiles([
    { label: 'Gastado este mes', value: fmt(c.totExp) },
    { label: left >= 0 ? 'Les queda para gastar' : 'Se pasaron por', value: fmt(Math.abs(left)), tone: left < 0 ? 'bad' : 'good' },
  ]) + Object.entries(groups).map(([date, list]) =>
    sectionHead(dayLabel(date), fmt(sum(list, (e) => e.amount))) +
    `<div class="list card">${list.map((e) => row({
      id: e.id,
      lead: CAT[e.cat]?.emoji || '📦',
      title: e.desc || CAT[e.cat]?.label || 'Gasto',
      sub: join(e.desc ? CAT[e.cat]?.label : '', esc(e.person)),
      amount: fmt(e.amount),
    })).join('')}</div>`).join('');
}

function viewDeudas(c) {
  const all = store.items.filter((i) => i.kind === 'debt');
  if (!all.length) return empty('debt', 'Carguen las deudas: tarjetas, préstamos, planes en cuotas. La app calcula cuándo terminan.');
  const active = all.filter((d) => (d.saldo || 0) > 0.5 || isPaid(d, c.m)).sort((a, b) => (b.saldo || 0) - (a.saldo || 0));
  const done = all.filter((d) => !active.includes(d));
  const ds = debtSummary();

  const debtRow = (d) => {
    const p = payoff(d);
    const progress = d.inicial > 0 ? 1 - (d.saldo || 0) / d.inicial : 0;
    const canPay = (d.cuota || 0) > 0 && ((d.saldo || 0) > 0.5 || isPaid(d, c.m));
    return row({
      id: d.id,
      check: canPay ? { id: d.id, on: isPaid(d, c.m), label: d.name } : null,
      lead: canPay ? '' : '💳',
      title: d.name,
      sub: join(esc(d.creditor), canPay ? dueText(d, c.m) : ''),
      amount: fmt(d.saldo),
      extra: `<div class="row-sub">${d.cuota > 0
        ? `Cuota de ${fmt(d.cuota)}${p ? ` · ${p.n === 1 ? 'última cuota' : `faltan ${p.n}`} · termina en ${monthShort(p.end).toLowerCase()}` : ''}`
        : 'Sin cuota fija'}</div>`
        + (d.inicial > 0 ? `<div class="row-progress">${meter(progress, 'good')}<span>Pagaron el ${Math.round(progress * 100)}%</span></div>` : ''),
    });
  };

  return summaryTiles([
    { label: 'Total que deben', value: fmt(ds.total), tone: ds.total > 0 ? 'bad' : 'good' },
    { label: `Cuotas de ${monthLabel(c.m).split(' ')[0].toLowerCase()}`, value: fmt(c.totDebt) },
    { label: 'Libres de deudas', value: ds.last ? monthShort(ds.last) : ds.total > 0 ? '—' : '¡Ya!', sub: ds.unknown ? 'Hay deudas sin cuota' : '' },
  ]) +
    (active.length ? `<div class="list card">${active.map(debtRow).join('')}</div>
      <p class="hint">Al marcar la cuota como pagada, se descuenta sola del saldo.</p>` : '') +
    (done.length ? sectionHead('Terminadas 🎉') + `<div class="list card">${done.map((d) => row({
      id: d.id, lead: '✅', title: d.name, sub: esc(d.creditor), amount: fmt(0), amountClass: 'muted',
    })).join('')}</div>` : '');
}

function viewAjustes() {
  const people = store.settings.people || [];
  return `
  ${sectionHead('Personas de la familia')}
  <div class="card pad">
    <p class="muted small">Aparecen al cargar un ingreso o un gasto, para saber de quién es.</p>
    <div class="people">${people.map((p, i) => `<span class="person">${esc(p)}<button data-action="remove-person" data-index="${i}" aria-label="Quitar a ${esc(p)}">${icon('x', 14)}</button></span>`).join('')}</div>
    <form class="inline-form" data-form="add-person">
      <input name="person" placeholder="Agregar a alguien…" autocomplete="off" maxlength="30">
      <button class="btn btn-secondary" type="submit">Agregar</button>
    </form>
  </div>

  ${store.mode === 'cloud' ? membersSection() : ''}

  ${sectionHead('Cuenta')}
  <div class="card pad">
    ${store.mode === 'cloud'
      ? `<p>Entraste como <b>${esc(store.user?.email)}</b>. Los datos se comparten con toda la familia.</p>
         <button class="btn btn-secondary" data-action="sign-out">Cerrar sesión</button>`
      : `<p><b>Modo prueba.</b> Todo lo que cargues queda guardado solo en este dispositivo y navegador.</p>
         <p class="muted small">Para que toda la familia vea los mismos números desde su celular, hay que conectar Firebase (los pasos están en el archivo README.md del proyecto).</p>`}
  </div>

  ${sectionHead('Copia de seguridad')}
  <div class="card pad">
    <p class="muted small">Descargá un archivo con todos los datos para guardarlo por las dudas.</p>
    <div class="btn-row">
      <button class="btn btn-secondary" data-action="export">Descargar copia</button>
      <button class="btn btn-secondary" data-action="import">Restaurar copia</button>
    </div>
    <input type="file" id="import-file" accept="application/json,.json" hidden>
  </div>

  ${sectionHead('Usarla como app')}
  <div class="card pad">
    <p class="small"><b>iPhone:</b> abrila en Safari, tocá Compartir <span aria-hidden="true">⬆︎</span> y elegí <b>Agregar a inicio</b>.</p>
    <p class="small"><b>Android:</b> abrila en Chrome, tocá el menú ⋮ y elegí <b>Agregar a la pantalla principal</b>.</p>
  </div>`;
}

function membersSection() {
  if (!store.isOwner()) return '';
  const link = store.inviteLink();
  const accesos = store.accesos || [];
  return `${sectionHead('Invitar a la familia')}
  <div class="card pad">
    <p class="small">Mandales este link por WhatsApp. Lo abren, tocan <b>Entrar con Google</b> y ya quedan adentro.</p>
    <div class="invite-link">${link ? esc(link) : 'Generando link…'}</div>
    <div class="btn-row">
      <button class="btn btn-primary btn-inline" data-action="share-invite" ${link ? '' : 'disabled'}>Compartir link</button>
      <button class="btn btn-secondary" data-action="copy-invite" ${link ? '' : 'disabled'}>Copiar</button>
    </div>
    <p class="muted small">Solo entra quien tenga este link. No lo publiques en ningún lado.</p>
  </div>

  ${sectionHead('Quiénes pueden entrar')}
  <div class="card pad">
    <div class="people"><span class="person">${esc(store.user?.email)} <span class="muted small">(vos)</span></span>
      ${accesos.map((a) => `<span class="person">${esc(a.nombre || a.email)}<button data-action="remove-access" data-email="${esc(a.email)}" aria-label="Quitarle el acceso a ${esc(a.email)}">${icon('x', 14)}</button></span>`).join('')}</div>
    ${accesos.length ? '' : '<p class="muted small">Cuando alguien entre con tu link, aparece acá.</p>'}
    <button class="btn btn-secondary" data-action="new-invite">Cambiar link</button>
    <p class="muted small">Cambiar el link hace que el anterior deje de servir. Los que ya entraron siguen adentro.</p>
  </div>`;
}

// ---------- Formularios (hojas) ----------

function field(label, control, hint = '') {
  return `<label class="field"><span class="field-label">${label}</span>${control}${hint ? `<span class="field-hint">${hint}</span>` : ''}</label>`;
}
const textInput = (name, value, placeholder, extra = '') =>
  `<input class="input" name="${name}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off" maxlength="60" ${extra}>`;
const moneyInput = (name, value, big = false) =>
  `<div class="money ${big ? 'big' : ''}"><span>$</span><input name="${name}" inputmode="decimal" autocomplete="off" placeholder="0" value="${value ? inputFmt.format(value) : ''}" data-money></div>`;
const dayInput = (name, value) =>
  `<input class="input day" name="${name}" type="number" inputmode="numeric" min="1" max="31" placeholder="Ej: 10" value="${value || ''}">`;

function chips(name, options, selected) {
  return `<div class="chips" role="radiogroup">${options.map((o) => `<label class="chip"><input type="radio" name="${name}" value="${esc(o.value)}" ${o.value === selected ? 'checked' : ''}><span>${o.label}</span></label>`).join('')}</div>`;
}
const catChips = (selected) => chips('cat', CATS.map((c) => ({ value: c.id, label: `${c.emoji} ${c.label}` })), selected);
const personChips = (selected) => {
  const people = store.settings.people || [];
  if (!people.length) return '';
  return field('¿De quién?', chips('person', people.map((p) => ({ value: p, label: esc(p) })), selected));
};
function segmented(name, options, selected) {
  return `<div class="seg">${options.map((o) => `<label><input type="radio" name="${name}" value="${o.value}" ${o.value === selected ? 'checked' : ''}><span>${o.label}</span></label>`).join('')}</div>`;
}

function defaultExpenseDate() {
  return state.month === thisMonth() ? isoDate(new Date()) : `${state.month}-01`;
}

function formBody(kind, it) {
  switch (kind) {
    case 'expense':
      return field('¿Cuánto gastaron?', moneyInput('amount', it.amount, true))
        + field('¿En qué?', catChips(it.cat || 'comida'))
        + field('Detalle <span class="opt">(opcional)</span>', textInput('desc', it.desc, 'Ej: Súper del fin de semana'))
        + field('Fecha', `<input class="input" type="date" name="date" value="${esc(it.date || defaultExpenseDate())}">`)
        + personChips(it.person);
    case 'income':
      return field('¿Qué es?', textInput('name', it.name, 'Ej: Sueldo de papá'))
        + field('¿Cuánto entra?', moneyInput('amount', it.amount, true))
        + personChips(it.person)
        + field('¿Cada cuánto?', segmented('freq', [{ value: 'mensual', label: 'Todos los meses' }, { value: 'unico', label: 'Solo este mes' }], it.freq || 'mensual'))
        + field('Día de cobro <span class="opt">(opcional)</span>', dayInput('day', it.day));
    case 'fixed':
      return field('¿Qué es?', textInput('name', it.name, 'Ej: Alquiler, Luz, Internet'))
        + field('¿Cuánto se paga por mes?', moneyInput('amount', it.amount, true), 'Si cambia todos los meses (como la luz), poné un promedio y después lo ajustás.')
        + field('Categoría', catChips(it.cat || 'servicios'))
        + field('Día de vencimiento <span class="opt">(opcional)</span>', dayInput('day', it.day), 'Te avisa cuando está por vencer.');
    case 'debt':
      return field('¿Qué deuda es?', textInput('name', it.name, 'Ej: Tarjeta Visa, Préstamo del banco'))
        + field('¿A quién se le debe? <span class="opt">(opcional)</span>', textInput('creditor', it.creditor, 'Ej: Banco Nación'))
        + field('¿Cuánto falta pagar en total?', moneyInput('saldo', it.saldo, true))
        + field('¿Cuánto es la cuota por mes?', moneyInput('cuota', it.cuota), 'Si no tiene cuota fija, dejalo vacío.')
        + field('Día de vencimiento <span class="opt">(opcional)</span>', dayInput('day', it.day))
        + '<div class="preview" data-preview></div>';
  }
}

function readForm(kind, form) {
  const g = (n) => (form.elements[n]?.value ?? '').trim();
  const money = (n) => parseMoney(g(n));
  const day = (n) => { const d = parseInt(g(n), 10); return d >= 1 && d <= 31 ? d : null; };
  switch (kind) {
    case 'expense': return { amount: money('amount'), cat: g('cat') || 'otros', desc: g('desc'), date: g('date') || defaultExpenseDate(), person: g('person') };
    case 'income': return { name: g('name'), amount: money('amount'), person: g('person'), freq: g('freq') || 'mensual', day: day('day') };
    case 'fixed': return { name: g('name'), amount: money('amount'), cat: g('cat') || 'otros', day: day('day') };
    case 'debt': return { name: g('name'), creditor: g('creditor'), saldo: money('saldo'), cuota: money('cuota'), day: day('day') };
  }
}

function validate(kind, d) {
  if (kind !== 'expense' && !d.name) return ['name', 'Escribí un nombre para reconocerlo.'];
  if (kind === 'debt' ? !(d.saldo > 0) : !(d.amount > 0)) return [kind === 'debt' ? 'saldo' : 'amount', 'Poné un monto mayor a cero.'];
  return null;
}

function debtPreview(form) {
  const saldo = parseMoney(form.elements.saldo.value);
  const cuota = parseMoney(form.elements.cuota.value);
  const box = form.querySelector('[data-preview]');
  if (!(saldo > 0 && cuota > 0)) { box.hidden = true; return; }
  const n = Math.ceil(saldo / cuota - 1e-9);
  box.hidden = false;
  box.innerHTML = `${icon('check', 16)}<span>${n === 1 ? 'Se termina de pagar con <b>una cuota</b>' : `Son <b>${n} cuotas</b>: terminan en <b>${monthLabel(addMonths(thisMonth(), n - 1)).toLowerCase()}</b>`}.</span>`;
}

function openSheet(html) {
  sheetEl.innerHTML = `<div class="backdrop" data-action="backdrop"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  document.body.classList.add('sheet-open');
  requestAnimationFrame(() => sheetEl.querySelector('.backdrop')?.classList.add('in'));
}
function closeSheet() {
  sheetEl.innerHTML = '';
  document.body.classList.remove('sheet-open');
}

function openChooser() {
  openSheet(`<div class="sheet-head"><span></span><h2>¿Qué querés cargar?</h2><button class="sheet-close" data-action="close" aria-label="Cerrar">${icon('x', 18)}</button></div>
    <div class="sheet-body chooser">
      ${Object.entries(KINDS).map(([k, v]) => `<button class="choice" data-action="new" data-kind="${k}">
        <span class="choice-emoji">${v.emoji}</span><span><b>${cap(v.name)}</b><span>${v.hint}</span></span>${icon('right', 18)}</button>`).join('')}
    </div>`);
}

function openForm(kind, item = null) {
  const k = KINDS[kind];
  openSheet(`<form class="sheet-form" data-form="item" data-kind="${kind}" data-id="${item?.id || ''}" novalidate>
    <div class="sheet-head">
      <button type="button" class="link-btn" data-action="close">Cancelar</button>
      <h2>${item ? k.editTitle : k.title}</h2>
      <button type="submit" class="link-btn strong">Guardar</button>
    </div>
    <div class="sheet-body">
      ${formBody(kind, item || {})}
      <div class="form-error" role="alert" hidden></div>
      <button type="submit" class="btn btn-primary">${item ? 'Guardar cambios' : `Guardar ${k.name}`}</button>
      ${item ? '<button type="button" class="btn btn-danger" data-action="delete">Borrar</button>' : ''}
    </div>
  </form>`);
  const form = sheetEl.querySelector('form');
  if (kind === 'debt') debtPreview(form);
  if (!matchMedia('(pointer: coarse)').matches) form.querySelector('input:not([type=radio])')?.focus();
}

function saveItem(form) {
  const kind = form.dataset.kind;
  const id = form.dataset.id;
  const item = id ? store.items.find((i) => i.id === id) : null;
  const data = readForm(kind, form);
  const err = validate(kind, data);
  const box = form.querySelector('.form-error');
  if (err) {
    box.hidden = false;
    box.textContent = err[1];
    form.elements[err[0]]?.focus();
    return;
  }
  if (kind === 'income' && data.freq === 'unico') data.month = item?.month || state.month;
  if (kind === 'debt') data.inicial = Math.max(item?.inicial || 0, data.saldo);

  let op;
  if (item) {
    op = store.update(item.id, data);
  } else {
    data.kind = kind;
    if (kind !== 'expense') data.desde = state.month;
    op = store.add(data);
  }
  op.catch(fail);
  closeSheet();
  toast(item ? 'Cambios guardados' : `${cap(KINDS[kind].name)} guardado`);
}

function fail(e) {
  console.error(e);
  toast('No se pudo guardar. Revisá la conexión.', 'bad');
}

// ---------- Eventos ----------

const ACTIONS = {
  add() {
    const kind = VIEW_KIND[state.view];
    kind ? openForm(kind) : openChooser();
  },
  new(el) { openForm(el.dataset.kind); },
  edit(el) {
    const item = store.items.find((i) => i.id === el.dataset.id);
    if (item) openForm(item.kind, item);
  },
  toggle(el) {
    const item = store.items.find((i) => i.id === el.dataset.id);
    if (!item) return;
    const on = !isPaid(item, state.month);
    store.setPaid(item, state.month, on).catch(fail);
    if (on) toast(item.kind === 'debt' ? 'Cuota pagada · se descontó del saldo' : 'Marcado como pagado');
  },
  go(el) { location.hash = el.dataset.view; },
  'month-prev'() { state.month = addMonths(state.month, -1); render(); },
  'month-next'() { state.month = addMonths(state.month, 1); render(); },
  'month-today'() { state.month = thisMonth(); render(); },
  close: closeSheet,
  async install() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => {});
    installPrompt = null;
    render();
  },
  'install-dismiss'() {
    installDismissed = true;
    try { localStorage.setItem('finanzas-familia:instalar-oculto', '1'); } catch {}
    render();
  },
  backdrop(el, e) { if (e.target === el) closeSheet(); },
  delete(el) {
    if (!el.classList.contains('confirm')) {
      el.classList.add('confirm');
      el.textContent = '¿Seguro? Tocá de nuevo para borrar';
      return;
    }
    const id = el.closest('form').dataset.id;
    store.remove(id).catch(fail);
    closeSheet();
    toast('Borrado');
  },
  'sign-in'() { store.signIn().catch((e) => toast(e.message, 'bad')); },
  'sign-out'() { store.signOut(); },
  reload() { location.reload(); },
  'remove-person'(el) {
    const people = [...(store.settings.people || [])];
    people.splice(Number(el.dataset.index), 1);
    store.saveSettings({ people }).catch(fail);
  },
  async 'share-invite'() {
    const url = store.inviteLink();
    if (navigator.share) {
      try { await navigator.share({ title: 'Finanzas de la familia', text: 'Entrá a la app de gastos de la casa:', url }); } catch {}
    } else {
      ACTIONS['copy-invite']();
    }
  },
  async 'copy-invite'() {
    try {
      await navigator.clipboard.writeText(store.inviteLink());
      toast('Link copiado');
    } catch {
      toast('No se pudo copiar. Mantené apretado el link para copiarlo.', 'bad');
    }
  },
  'remove-access'(el) {
    if (!el.classList.contains('confirm')) {
      el.classList.add('confirm');
      toast('Tocá la ✕ de nuevo para quitarle el acceso');
      return;
    }
    store.removeAccess(el.dataset.email).catch(fail);
  },
  'new-invite'(el) {
    if (!el.classList.contains('confirm')) {
      el.classList.add('confirm');
      el.textContent = '¿Seguro? El link anterior deja de servir';
      return;
    }
    store.newInvite().catch(fail);
    toast('Link nuevo listo');
  },
  export() {
    const data = { app: 'finanzas-familia', version: 1, exported: new Date().toISOString(), settings: store.settings, items: store.items };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `finanzas-familia-${isoDate(new Date())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  import() { document.getElementById('import-file').click(); },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  ACTIONS[el.dataset.action]?.(el, e);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheetEl.firstChild) closeSheet();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.row[data-action]')) {
    e.preventDefault();
    ACTIONS.edit(e.target);
  }
});

document.addEventListener('input', (e) => {
  if (e.target.matches('[data-money]')) formatMoneyInput(e.target);
  const form = e.target.closest('form[data-kind="debt"]');
  if (form) debtPreview(form);
});

document.addEventListener('submit', (e) => {
  const form = e.target;
  e.preventDefault();
  if (form.dataset.form === 'item') saveItem(form);
  if (form.dataset.form === 'add-person') {
    const name = form.elements.person.value.trim();
    if (!name) return;
    const people = store.settings.people || [];
    if (!people.includes(name)) store.saveSettings({ people: [...people, name] }).catch(fail);
    form.reset();
  }
});

document.addEventListener('change', async (e) => {
  if (e.target.id !== 'import-file') return;
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'finanzas-familia' || !Array.isArray(data.items)) throw new Error('formato');
    const key = (i) => `${i.kind}|${i.created}`;
    const existing = new Set(store.items.map(key));
    const fresh = data.items.filter((i) => !existing.has(key(i)));
    await Promise.all(fresh.map(({ id, ...rest }) => store.add(rest)));
    if (data.settings?.people) await store.saveSettings({ people: data.settings.people });
    toast(`Se restauraron ${fresh.length} registros`);
  } catch {
    toast('Ese archivo no es una copia válida.', 'bad');
  }
});

window.addEventListener('hashchange', () => {
  state.view = viewFromHash();
  closeSheet();
  render();
  window.scrollTo(0, 0);
});

function toast(msg, tone = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${tone}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.className = 'toast'; }, 2400);
}

// ---------- Arranque ----------

store.subscribe(render);
render();
store.init();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
// Le pide al teléfono que no borre los datos ni la sesión para liberar espacio.
navigator.storage?.persist?.().catch(() => {});
