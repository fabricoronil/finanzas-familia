// Capa de datos: guarda en Firebase (compartido) o en el dispositivo (modo prueba).
import { firebaseConfig, ownerEmail } from './config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';
const LOCAL_KEY = 'finanzas-familia:v1';
const DEFAULT_SETTINGS = { people: ['Papá', 'Mamá', 'Fabricio'] };

const listeners = new Set();
let backend = null;

export const store = {
  mode: firebaseConfig ? 'cloud' : 'local',
  status: 'loading', // loading | signed-out | denied | error | ready
  user: null,
  error: '',
  items: [],
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
  // Marca un gasto fijo o la cuota de una deuda como pagada (o no) en un mes.
  // En las deudas, pagar descuenta la cuota del saldo; desmarcar la devuelve.
  setPaid: (item, month, paid) => backend.setPaid(item, month, paid),
  saveSettings: (patch) => backend.saveSettings(patch),
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

const debtPayment = (item) => Math.min(item.cuota || 0, item.saldo || 0);

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
    async setPaid(item, m, paid) {
      const it = db.items[item.id];
      it.paid ||= {};
      if (item.kind === 'debt') {
        if (paid) {
          const amount = debtPayment(it);
          it.paid[m] = amount;
          it.saldo = (it.saldo || 0) - amount;
        } else if (m in it.paid) {
          it.saldo = (it.saldo || 0) + it.paid[m];
          delete it.paid[m];
        }
      } else if (paid) {
        it.paid[m] = true;
      } else {
        delete it.paid[m];
      }
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
  const auth = A.getAuth(app);
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

  A.onAuthStateChanged(auth, (user) => {
    unsubs.forEach((u) => u());
    unsubs = [];
    if (!user) return set({ status: 'signed-out', user: null, items: [] });
    set({ user, status: 'loading' });
    unsubs.push(F.onSnapshot(itemsCol, (snap) => set({
      status: 'ready',
      items: snap.docs.map((d) => ({ ...d.data(), id: d.id })),
    }), fail));
    unsubs.push(F.onSnapshot(home, (snap) => set({
      settings: { ...DEFAULT_SETTINGS, ...snap.data() },
    }), fail));
  });

  return {
    async add(data) {
      const r = F.doc(itemsCol);
      await F.setDoc(r, { ...data, by: auth.currentUser?.email || '' });
      return r.id;
    },
    update: (id, data) => F.updateDoc(ref(id), data),
    remove: (id) => F.deleteDoc(ref(id)),
    async setPaid(item, m, paid) {
      const path = new F.FieldPath('paid', m);
      if (item.kind === 'debt') {
        if (paid) {
          const amount = debtPayment(item);
          return F.updateDoc(ref(item.id), path, amount, 'saldo', F.increment(-amount));
        }
        const prev = item.paid?.[m];
        if (prev == null) return;
        return F.updateDoc(ref(item.id), path, F.deleteField(), 'saldo', F.increment(prev));
      }
      return F.updateDoc(ref(item.id), path, paid ? true : F.deleteField());
    },
    saveSettings: (patch) => F.setDoc(home, patch, { merge: true }),
    async signIn() {
      const provider = new A.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
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
