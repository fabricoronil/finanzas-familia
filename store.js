// Capa de datos: guarda en Firebase (compartido) o en el dispositivo (modo prueba).
import { firebaseConfig, ownerEmail } from './config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';
const LOCAL_KEY = 'finanzas-familia:v1';
const INVITE_KEY = 'finanzas-familia:invitacion';
const DEFAULT_SETTINGS = { people: ['Juan', 'Myriam', 'Fabri', 'Nico'] };

const listeners = new Set();
let backend = null;

// Un link de invitación trae "#invitacion=CÓDIGO": se guarda hasta que la
// persona entra con Google y se limpia de la barra de direcciones.
const inviteMatch = location.hash.match(/invitacion=([\w-]+)/);
if (inviteMatch) {
  try { localStorage.setItem(INVITE_KEY, inviteMatch[1]); } catch {}
  history.replaceState(null, '', location.pathname + location.search);
}
function takeInvite() {
  try {
    const code = localStorage.getItem(INVITE_KEY);
    localStorage.removeItem(INVITE_KEY);
    return code;
  } catch {
    return null;
  }
}

export const store = {
  mode: firebaseConfig ? 'cloud' : 'local',
  status: 'loading', // loading | signed-out | denied | error | ready
  user: null,
  error: '',
  items: [],
  accesos: [],
  settings: { ...DEFAULT_SETTINGS },

  subscribe(fn) { listeners.add(fn); },
  async init() {
    try {
      backend = this.mode === 'cloud' ? await cloudBackend() : localBackend();
    } catch (e) {
      set({ status: 'error', error: e.message });
    }
  },

  add: (data) => backend.add({ created: Date.now(), ...data }),
  update: (id, data) => backend.update(id, data),
  remove: (id) => backend.remove(id),
  // Vuelve a guardar algo que se borró (para "Deshacer").
  restore: (item) => backend.restore(item),
  // Marca un gasto fijo como pagado (o no) en un mes.
  setPaid: (item, month, paid) => backend.setPaid(item, month, paid),
  // Pago de una deuda (entero o una parte): se descuenta del saldo y queda en
  // el historial. `pago` = { id, monto, fecha, mes }.
  payDebt: (item, pago) => backend.payDebt(item, pago),
  // Borra pagos de una deuda y devuelve esa plata al saldo.
  removePagos: (item, pagos) => backend.removePagos(item, pagos),
  // Monto real de un gasto fijo que cambia cada mes. Con `paid` también lo
  // marca como pagado; con `estimate` pasa a ser el aproximado de los meses
  // que todavía no tienen dato.
  setMonthAmount: (item, month, value, opts = {}) => backend.setMonthAmount(item, month, value, opts),
  saveSettings: (patch) => backend.saveSettings(patch),
  removeAccess: (email) => backend.removeAccess(email),
  newInvite: () => backend.newInvite(),
  inviteLink() {
    const code = this.settings.codigo;
    return code ? `${location.origin}${location.pathname}#invitacion=${code}` : '';
  },
  signIn: () => backend.signIn?.(),
  signOut: () => backend.signOut?.(),
  isOwner() {
    return this.mode === 'cloud' && (this.user?.email || '').toLowerCase() === ownerEmail.toLowerCase();
  },
};

function set(patch) {
  Object.assign(store, patch);
  listeners.forEach((fn) => fn());
}

const paidIn = (item, m) => Number(item.paid?.[m]) || 0;

function localBackend() {
  let db = null;
  try { db = JSON.parse(localStorage.getItem(LOCAL_KEY)); } catch {}
  db ||= { items: {}, settings: {} };

  const publish = () => set({
    status: 'ready',
    items: Object.entries(db.items).map(([id, v]) => ({ ...v, id })),
    settings: { ...DEFAULT_SETTINGS, ...db.settings },
  });
  const save = () => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(db)); } catch {}
    publish();
  };
  publish();

  return {
    async add(data) {
      const id = crypto.randomUUID();
      db.items[id] = data;
      save();
      return id;
    },
    async update(id, data) { Object.assign(db.items[id], data); save(); },
    async remove(id) { delete db.items[id]; save(); },
    async restore({ id, ...data }) { db.items[id] = data; save(); },
    async setPaid(item, m, paid) {
      const it = db.items[item.id];
      it.paid ||= {};
      if (paid) it.paid[m] = true;
      else delete it.paid[m];
      save();
    },
    async payDebt(item, pago) {
      const it = db.items[item.id];
      (it.paid ||= {})[pago.mes] = paidIn(it, pago.mes) + pago.monto;
      it.saldo = (it.saldo || 0) - pago.monto;
      (it.pagos ||= []).push(pago);
      save();
    },
    async removePagos(item, pagos) {
      const it = db.items[item.id];
      for (const p of pagos) {
        const left = paidIn(it, p.mes) - p.monto;
        if (left > 0.5) it.paid[p.mes] = left;
        else delete it.paid?.[p.mes];
        it.saldo = (it.saldo || 0) + p.monto;
      }
      it.pagos = (it.pagos || []).filter((p) => !pagos.some((x) => x.id === p.id));
      save();
    },
    async setMonthAmount(item, m, value, { paid, estimate }) {
      const it = db.items[item.id];
      (it.amounts ||= {})[m] = value;
      if (paid) (it.paid ||= {})[m] = true;
      if (estimate) it.amount = value;
      save();
    },
    async saveSettings(patch) { Object.assign(db.settings, patch); save(); },
  };
}

async function cloudBackend() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(SDK + 'firebase-app.js'),
    import(SDK + 'firebase-auth.js'),
    import(SDK + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(firebaseConfig);
  // La sesión queda guardada en el dispositivo y no vence sola: solo se cierra
  // si la persona toca "Cerrar sesión".
  const auth = A.initializeAuth(app, {
    persistence: [A.indexedDBLocalPersistence, A.browserLocalPersistence],
    popupRedirectResolver: A.browserPopupRedirectResolver,
  });
  A.getRedirectResult(auth).catch((e) => console.warn('Inicio de sesión', e));
  let db;
  try {
    // Caché local: la app abre al instante y funciona sin señal.
    db = F.initializeFirestore(app, {
      localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
    });
  } catch {
    db = F.getFirestore(app);
  }
  const home = F.doc(db, 'hogar', 'principal');
  const itemsCol = F.collection(home, 'items');
  const ref = (id) => F.doc(itemsCol, id);
  const fail = (e) => set({ status: e.code === 'permission-denied' ? 'denied' : 'error', error: e.message });
  let unsubs = [];

  const accesosCol = F.collection(home, 'accesos');
  const newCode = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(12))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  A.onAuthStateChanged(auth, async (user) => {
    unsubs.forEach((u) => u());
    unsubs = [];
    if (!user) return set({ status: 'signed-out', user: null, items: [], accesos: [] });
    set({ user, status: 'loading' });
    const code = takeInvite();
    if (code) {
      const email = (user.email || '').toLowerCase();
      try {
        await F.setDoc(F.doc(accesosCol, email), { codigo: code, email, nombre: user.displayName || '', desde: Date.now() });
      } catch (e) {
        console.warn('Invitación no válida', e);
      }
    }
    unsubs.push(F.onSnapshot(itemsCol, (snap) => set({
      status: 'ready',
      items: snap.docs.map((d) => ({ ...d.data(), id: d.id })),
    }), fail));
    unsubs.push(F.onSnapshot(home, (snap) => {
      set({ settings: { ...DEFAULT_SETTINGS, ...snap.data() } });
      if (store.isOwner() && !snap.data()?.codigo) F.setDoc(home, { codigo: newCode() }, { merge: true });
    }, fail));
    if (store.isOwner()) {
      unsubs.push(F.onSnapshot(accesosCol, (snap) => set({
        accesos: snap.docs.map((d) => d.data()).sort((a, b) => (a.desde || 0) - (b.desde || 0)),
      }), () => {}));
    }
  });

  return {
    async add(data) {
      const r = F.doc(itemsCol);
      await F.setDoc(r, { ...data, by: auth.currentUser?.email || '' });
      return r.id;
    },
    update: (id, data) => F.updateDoc(ref(id), data),
    remove: (id) => F.deleteDoc(ref(id)),
    restore: ({ id, ...data }) => F.setDoc(ref(id), data),
    setPaid: (item, m, paid) => F.updateDoc(ref(item.id), new F.FieldPath('paid', m), paid ? true : F.deleteField()),
    payDebt: (item, pago) => F.updateDoc(ref(item.id),
      new F.FieldPath('paid', pago.mes), F.increment(pago.monto),
      'saldo', F.increment(-pago.monto),
      'pagos', F.arrayUnion(pago)),
    removePagos(item, pagos) {
      const args = [];
      const byMonth = {};
      for (const p of pagos) byMonth[p.mes] = (byMonth[p.mes] || 0) + p.monto;
      for (const [m, monto] of Object.entries(byMonth)) {
        const left = paidIn(item, m) - monto;
        args.push(new F.FieldPath('paid', m), left > 0.5 ? left : F.deleteField());
      }
      const total = pagos.reduce((t, p) => t + p.monto, 0);
      args.push('saldo', F.increment(total), 'pagos', F.arrayRemove(...pagos));
      return F.updateDoc(ref(item.id), ...args);
    },
    setMonthAmount(item, m, value, { paid, estimate }) {
      const extra = [];
      if (paid) extra.push(new F.FieldPath('paid', m), true);
      if (estimate) extra.push('amount', value);
      return F.updateDoc(ref(item.id), new F.FieldPath('amounts', m), value, ...extra);
    },
    saveSettings: (patch) => F.setDoc(home, patch, { merge: true }),
    removeAccess: (email) => F.deleteDoc(F.doc(accesosCol, email)),
    newInvite: () => F.setDoc(home, { codigo: newCode() }, { merge: true }),
    async signIn() {
      const provider = new A.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      // En el celular (y sobre todo en la app instalada) se entra por
      // redirección: la página va a Google y vuelve. Funciona porque la app se
      // sirve desde el mismo dominio que el inicio de sesión (authDomain).
      const sameDomain = location.hostname === firebaseConfig.authDomain;
      if (sameDomain && matchMedia('(pointer: coarse)').matches) {
        return A.signInWithRedirect(auth, provider);
      }
      try {
        await A.signInWithPopup(auth, provider);
      } catch (e) {
        if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(e.code)) {
          return A.signInWithRedirect(auth, provider);
        }
        if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) throw e;
      }
    },
    signOut: () => A.signOut(auth),
  };
}
