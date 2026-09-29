/**
 * STARGATE · LA CONSOLA DE ENSAYO · un Firebase de mentira, en memoria (29-sep-2026)
 *
 * Norberto, para la Academia de la Cero: «conocer el panel del docente (habrá que construir un "simulador" con vista docente),
 * ver las posibilidades». La consola de ensayo (ensayo.html) es la consola DE VERDAD —motor.js entero— corriendo contra esto
 * en vez de contra Firebase: motor_sim.js lo genera _build_site.py desde motor.js cambiando solo sus imports. Así el ensayo
 * nunca se queda atrás: si mañana la consola cambia, el ensayo cambia con ella. (Es el simulador de DPG1, con piel de STARGATE.)
 *
 * 🔴 Nada sale del navegador y no da acceso a nada real: ni cuentas, ni red (salvo leer assets/sim/escuela.json), ni permisos.
 * Los datos son la Nave Escuela sembrada en papel (herramientas/simulador_datos.cjs), con un equipo docente de mentira. Lo que
 * se toca se guarda en ESTE navegador (localStorage `sgEnsayo.db`) para que siga al recargar; «Empezar de cero» lo borra.
 *
 * 🔴 LAS FECHAS VIAJAN CON EL CALENDARIO. Los datos se sembraron un día concreto, «hoy es la semana 15». Sin tocar nada, dentro
 * de un mes el grupo saldría terminado y, a los tres, en «Grupos finalizados». Al cargar se corren todas las fechas las semanas
 * enteras que hayan pasado: el ensayo siempre está en su semana 15, con el curso entero detrás (y el selector de semanas de la
 * Nave Escuela para mirar cualquier otra). Lo tocado se guarda con su corrimiento: cambia de semana, empieza de cero.
 *
 * Cubre justo lo que usa motor.js: app, auth (una persona: el docente de ensayo), Firestore (documento, colección, consultas,
 * escrituras con merge, lotes, onSnapshot, deleteField) y las funciones (httpsCallable): las del docente que más se ven se
 * simulan (premiar, validar y anular un reto, regalar en clase, el equipo, congelar o dar de baja); las demás dicen con
 * palabras que en el ensayo no hay servidor.
 */
const CLAVE = "sgEnsayo.db";
const HUELLA = new URL(import.meta.url).searchParams.get("h") || "1";
const semilla = await fetch(new URL("../../sim/escuela.json?h=" + encodeURIComponent(HUELLA), import.meta.url)).then((r) => {
  if (!r.ok) throw new Error("No se han podido cargar los datos del ensayo (" + r.status + ").");
  return r.json();
});
const SEMANA = 7 * 864e5;
const CORRE = Math.max(0, Math.floor((Date.now() - Number(semilla.generado || Date.now())) / SEMANA)) * SEMANA;
const VERSION = semilla.v + "+" + Math.round(CORRE / SEMANA);

// ── los valores: Timestamp y centinelas
export class Timestamp {
  constructor(seconds, nanoseconds) { this.seconds = seconds; this.nanoseconds = nanoseconds || 0; }
  static fromMillis(ms) { return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6); }
  static fromDate(d) { return Timestamp.fromMillis(d.getTime()); }
  static now() { return Timestamp.fromMillis(Date.now()); }
  toMillis() { return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6); }
  toDate() { return new Date(this.toMillis()); }
  valueOf() { return this.toMillis(); }
  isEqual(o) { return o instanceof Timestamp && o.toMillis() === this.toMillis(); }
}
const CENT = "__simCentinela";
export const arrayUnion = (...els) => ({ [CENT]: "union", els });
export const arrayRemove = (...els) => ({ [CENT]: "quitar", els });
export const deleteField = () => ({ [CENT]: "borrar" });
export const serverTimestamp = () => ({ [CENT]: "hora" });
export const increment = (n) => ({ [CENT]: "sumar", n });
export class FieldPath { constructor(...segs) { this.segs = segs.map(String); } }

const esPlano = (x) => x && typeof x === "object" && !Array.isArray(x) && !(x instanceof Timestamp) && !(x instanceof Date) && !x[CENT];
function copia(x) {
  if (x instanceof Timestamp) return new Timestamp(x.seconds, x.nanoseconds);
  if (Array.isArray(x)) return x.map(copia);
  if (x && typeof x === "object") { const o = {}; for (const k of Object.keys(x)) o[k] = copia(x[k]); return o; }
  return x;
}
// JSON ⇄ memoria (los Timestamp viajan como {__ts: ms})
const aJson = (x) => JSON.stringify(x, function (k, v) { const o = this[k]; return o instanceof Timestamp ? { __ts: o.toMillis() } : v; });
const deJson = (t) => JSON.parse(t, (k, v) => (v && typeof v === "object" && typeof v.__ts === "number" && Object.keys(v).length === 1 ? Timestamp.fromMillis(v.__ts) : v));
function resolver(v, antes) {
  if (v instanceof Date) return Timestamp.fromMillis(v.getTime());
  if (v && v[CENT]) {
    if (v[CENT] === "hora") return Timestamp.now();
    if (v[CENT] === "union") { const a = Array.isArray(antes) ? antes.slice() : []; v.els.forEach((e) => { if (!a.some((x) => aJson(x) === aJson(e))) a.push(copia(e)); }); return a; }
    if (v[CENT] === "quitar") return (Array.isArray(antes) ? antes : []).filter((x) => !v.els.some((e) => aJson(e) === aJson(x)));
    if (v[CENT] === "sumar") return (Number(antes) || 0) + Number(v.n || 0);
    return undefined;   // borrar
  }
  if (Array.isArray(v)) return v.map((x) => resolver(x));
  if (esPlano(v)) { const o = {}; for (const k of Object.keys(v)) { const r = resolver(v[k]); if (r !== undefined) o[k] = r; } return o; }
  return v;
}
function mezclar(base, datos) {
  const o = esPlano(base) ? copia(base) : {};
  for (const k of Object.keys(datos)) {
    const v = datos[k];
    if (esPlano(v)) o[k] = mezclar(o[k], v);
    else { const r = resolver(v, o[k]); if (r === undefined) delete o[k]; else o[k] = r; }
  }
  return o;
}
const segsDe = (campo) => (campo instanceof FieldPath ? campo.segs : String(campo).split("."));
function leerCampo(d, campo) { let x = d; for (const s of segsDe(campo)) { if (x == null || typeof x !== "object") return undefined; x = x[s]; } return x; }
function ponerCampo(d, campo, v) {
  const segs = segsDe(campo); let x = d;
  for (let i = 0; i < segs.length - 1; i++) { if (!esPlano(x[segs[i]])) x[segs[i]] = {}; x = x[segs[i]]; }
  const ult = segs[segs.length - 1], r = resolver(v, x[ult]);
  if (r === undefined) delete x[ult]; else x[ult] = r;
}

/** Corre las fechas de la semilla (milisegundos de estos años y fechas ISO) las semanas enteras que han pasado. */
const ES_MS = (n) => typeof n === "number" && n > 1.5e12 && n < 2.5e12;
const ES_DIA = /^\d{4}-\d{2}-\d{2}$/, ES_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/;
function correr(x) {
  if (!CORRE) return x;
  if (ES_MS(x)) return x + CORRE;
  if (typeof x === "string" && ES_DIA.test(x)) return new Date(Date.parse(x + "T12:00:00Z") + CORRE).toISOString().slice(0, 10);
  if (typeof x === "string" && ES_ISO.test(x)) return new Date(Date.parse(x) + CORRE).toISOString();
  if (Array.isArray(x)) return x.map(correr);
  if (x && typeof x === "object") { const o = {}; for (const k of Object.keys(x)) o[k] = correr(x[k]); return o; }
  return x;
}

// ── el almacén: la semilla y, encima, lo que se ha tocado en este navegador
const DATOS = new Map();
let CAMBIOS = {};
function cargar() {
  DATOS.clear();
  const base = correr(deJson(JSON.stringify(semilla.docs)));
  for (const k of Object.keys(base)) DATOS.set(k, base[k]);
  CAMBIOS = {};
  try { const g = localStorage.getItem(CLAVE); if (g) { const x = deJson(g); if (x && x.v === VERSION) CAMBIOS = x.c || {}; } } catch (e) {}
  for (const k of Object.keys(CAMBIOS)) { if (CAMBIOS[k] === null) DATOS.delete(k); else DATOS.set(k, CAMBIOS[k]); }
}
cargar();
function guardarCambios() { try { localStorage.setItem(CLAVE, aJson({ v: VERSION, c: CAMBIOS })); } catch (e) {} }
function escribir(ruta, d) { if (d === null) DATOS.delete(ruta); else DATOS.set(ruta, d); CAMBIOS[ruta] = d; }
window.addEventListener("storage", (e) => { if (e.key === CLAVE) { cargar(); avisar(); } });

/**
 * 🔴 LO QUE EN EL ENSAYO NO PUEDE «FUNCIONAR» SIN ENGAÑAR. El buzón es la línea con el equipo de STARGATE: si aquí se
 * guardara en la memoria del navegador, quien escribe una duda de verdad creería haberla mandado y no le leería nadie.
 */
const NO_SE_GUARDA = [[/^stargate_buzon\//, "En la consola de ensayo el buzón no llega a nadie. Escríbenos desde tu Nave de Comandante de verdad."]];
function vigilarRuta(ruta) {
  for (const [re, txt] of NO_SE_GUARDA) if (re.test(ruta)) { const e = new Error(txt); e.code = "permission-denied"; throw e; }
}

// ── referencias y consultas
const DB = { __simDb: true };
let cuenta = 0;
const idNuevo = () => "ens" + Date.now().toString(36) + (cuenta++).toString(36) + Math.random().toString(36).slice(2, 6);
function refDoc(ruta) { const p = ruta.split("/"); return { type: "document", path: ruta, id: p[p.length - 1], firestore: DB, get parent() { return refCol(p.slice(0, -1).join("/")); } }; }
function refCol(ruta) { const p = ruta.split("/"); return { type: "collection", path: ruta, id: p[p.length - 1], firestore: DB, _q: [] }; }
function unir(padre, segs) { return (padre && padre.path ? [padre.path] : []).concat(segs.map(String)).join("/"); }
export function doc(padre, ...segs) {
  if (padre && padre.type === "collection" && !segs.length) return refDoc(padre.path + "/" + idNuevo());
  return refDoc(unir(padre, segs));
}
export function collection(padre, ...segs) { return refCol(unir(padre, segs)); }
export function where(campo, op, valor) { return { k: "where", campo, op, valor }; }
export function orderBy(campo, dir) { return { k: "orden", campo, dir: dir === "desc" ? -1 : 1 }; }
export function limit(n) { return { k: "limite", n }; }
export function query(base, ...cs) { return { type: "query", col: base.type === "query" ? base.col : base, _q: (base._q || []).concat(cs) }; }

const val = (x) => (x instanceof Timestamp ? x.toMillis() : x);
function cumple(d, f) {
  const a = val(leerCampo(d, f.campo)), b = f.valor;
  switch (f.op) {
    case "==": return aJson(a) === aJson(val(b));
    case "!=": return a !== undefined && aJson(a) !== aJson(val(b));
    case "<": return a != null && a < val(b);
    case "<=": return a != null && a <= val(b);
    case ">": return a != null && a > val(b);
    case ">=": return a != null && a >= val(b);
    case "array-contains": return Array.isArray(a) && a.some((x) => aJson(x) === aJson(b));
    case "array-contains-any": return Array.isArray(a) && a.some((x) => (b || []).some((y) => aJson(x) === aJson(y)));
    case "in": return (b || []).some((y) => aJson(a) === aJson(y));
    case "not-in": return a !== undefined && !(b || []).some((y) => aJson(a) === aJson(y));
    default: return false;
  }
}
function resolverConsulta(q) {
  const col = q.type === "query" ? q.col : q, pre = col.path + "/", cs = q._q || [];
  let filas = [];
  for (const [ruta, d] of DATOS) if (ruta.startsWith(pre) && ruta.indexOf("/", pre.length) < 0) filas.push([ruta, d]);
  for (const c of cs) if (c.k === "where") filas = filas.filter(([, d]) => cumple(d, c));
  const ordenes = cs.filter((c) => c.k === "orden");
  if (ordenes.length) {
    filas = filas.filter(([, d]) => ordenes.every((o) => leerCampo(d, o.campo) !== undefined));
    filas.sort((x, y) => { for (const o of ordenes) { const a = val(leerCampo(x[1], o.campo)), b = val(leerCampo(y[1], o.campo)); if (a < b) return -o.dir; if (a > b) return o.dir; } return 0; });
  } else filas.sort((x, y) => (x[0] < y[0] ? -1 : 1));
  const lim = cs.filter((c) => c.k === "limite").pop();
  if (lim) filas = filas.slice(0, lim.n);
  return filas;
}
function fotoDoc(ruta) {
  const d = DATOS.get(ruta), ref = refDoc(ruta);
  return { id: ref.id, ref, exists: () => d !== undefined, data: () => (d === undefined ? undefined : copia(d)), get: (c) => copia(leerCampo(d || {}, c)), metadata: { hasPendingWrites: false, fromCache: false } };
}
function fotoConsulta(q, antes) {
  const docs = resolverConsulta(q).map(([ruta]) => fotoDoc(ruta));
  // los cambios de verdad frente a la foto anterior (el directo del final de la clase mira «added» y «removed»)
  const previo = antes || {}, ahora = {};
  docs.forEach((d) => { ahora[d.id] = aJson(d.data()); });
  const cambios = [];
  docs.forEach((d, i) => { if (!(d.id in previo)) cambios.push({ type: "added", doc: d, newIndex: i, oldIndex: -1 }); else if (previo[d.id] !== ahora[d.id]) cambios.push({ type: "modified", doc: d, newIndex: i, oldIndex: i }); });
  Object.keys(previo).forEach((id) => { if (!(id in ahora)) cambios.push({ type: "removed", doc: fotoDoc((q.type === "query" ? q.col : q).path + "/" + id), newIndex: -1, oldIndex: 0 }); });
  return { docs, size: docs.length, empty: !docs.length, forEach: (fn) => docs.forEach(fn), docChanges: () => cambios, metadata: { hasPendingWrites: false, fromCache: false }, _firmas: ahora };
}
const pausa = () => new Promise((r) => setTimeout(r, 0));
export async function getDoc(ref) { await pausa(); return fotoDoc(ref.path); }
export async function getDocs(q) { await pausa(); return fotoConsulta(q); }
export async function getCountFromServer(q) { await pausa(); const n = resolverConsulta(q).length; return { data: () => ({ count: n }) }; }

// ── escrituras
function hacerSet(ref, datos, opc) {
  vigilarRuta(ref.path);
  const antes = DATOS.get(ref.path);
  let nuevo;
  if (opc && opc.mergeFields) {
    nuevo = esPlano(antes) ? copia(antes) : {};
    for (const c of opc.mergeFields) ponerCampo(nuevo, c, leerCampo(datos, c) === undefined ? deleteField() : leerCampo(datos, c));
  } else if (opc && opc.merge) nuevo = mezclar(antes, datos);
  else nuevo = resolver(datos) || {};
  escribir(ref.path, nuevo);
}
function hacerUpdate(ref, args) {
  vigilarRuta(ref.path);
  const antes = DATOS.get(ref.path);
  if (antes === undefined) { const e = new Error("No existe el documento " + ref.path + " (en el ensayo)."); e.code = "not-found"; throw e; }
  const nuevo = copia(antes);
  if (args[0] instanceof FieldPath || typeof args[0] === "string") { for (let i = 0; i < args.length; i += 2) ponerCampo(nuevo, args[i], args[i + 1]); }
  else for (const k of Object.keys(args[0])) ponerCampo(nuevo, k, args[0][k]);
  escribir(ref.path, nuevo);
}
function trasEscribir() { guardarCambios(); avisar(); }
export async function setDoc(ref, datos, opc) { await pausa(); hacerSet(ref, datos, opc); trasEscribir(); }
export async function updateDoc(ref, ...args) { await pausa(); hacerUpdate(ref, args); trasEscribir(); }
export async function deleteDoc(ref) { await pausa(); vigilarRuta(ref.path); escribir(ref.path, null); trasEscribir(); }
export async function addDoc(col, datos) { const ref = doc(col); await setDoc(ref, datos); return ref; }
export function writeBatch() {
  const ops = [];
  return {
    set(ref, d, o) { ops.push(() => hacerSet(ref, d, o)); return this; },
    update(ref, ...a) { ops.push(() => hacerUpdate(ref, a)); return this; },
    delete(ref) { ops.push(() => { vigilarRuta(ref.path); escribir(ref.path, null); }); return this; },
    async commit() { await pausa(); ops.forEach((f) => f()); trasEscribir(); },
  };
}

// ── en vivo
const OYENTES = new Set();
function avisar() {
  for (const o of OYENTES) {
    if (o.ref.type === "document") {
      const foto = fotoDoc(o.ref.path), firma = aJson(foto.data() || null);
      if (firma !== o.firma) { o.firma = firma; try { o.sig(foto); } catch (e) { console.error(e); } }
    } else {
      const foto = fotoConsulta(o.ref, o.antes), firma = aJson(foto._firmas);
      if (firma !== o.firma) { o.firma = firma; o.antes = foto._firmas; try { o.sig(foto); } catch (e) { console.error(e); } }
    }
  }
}
export function onSnapshot(ref, a, b, c) {
  if (a && typeof a === "object" && typeof a.next !== "function" && typeof a !== "function") { a = b; b = c; }   // (opciones)
  const sig = typeof a === "function" ? a : (a && a.next ? a.next.bind(a) : () => {});
  const o = { ref, sig, firma: null, antes: null };
  OYENTES.add(o);
  setTimeout(() => { if (OYENTES.has(o)) { o.firma = null; avisar(); } }, 0);
  return () => OYENTES.delete(o);
}

// ── app, Firestore y Auth
export function initializeApp(cfg) { return { name: "ensayo", options: cfg || {} }; }
export function getFirestore() { return DB; }
export function connectFirestoreEmulator() {}
const YO = semilla.yo || { uid: "sim-docente", nombre: "Docente de ensayo", correo: "docente@ensayo.invalid" };
const USUARIO = { uid: YO.uid, email: YO.correo, displayName: YO.nombre, photoURL: "", emailVerified: true, isAnonymous: false,
  providerData: [{ providerId: "google.com" }], getIdToken: async () => "", getIdTokenResult: async () => ({ claims: {} }) };
const AUTH = { currentUser: USUARIO, name: "ensayo" };
export function getAuth() { return AUTH; }
export class GoogleAuthProvider { setCustomParameters() {} addScope() {} static credential() { return {}; } }
export async function signInWithPopup() { return { user: USUARIO }; }
export async function signInWithCredential() { return { user: USUARIO }; }
/** «Salir» en el ensayo es salir del ensayo: de vuelta a la Academia (la sesión de verdad ni se ha tocado). */
export async function signOut() { setTimeout(() => { location.href = "academia.html"; }, 0); }
export function onAuthStateChanged(auth, fn) { const f = typeof fn === "function" ? fn : (fn && fn.next ? fn.next.bind(fn) : () => {}); setTimeout(() => f(USUARIO), 0); return () => {}; }
export function connectAuthEmulator() {}

// ── las funciones del servidor (httpsCallable): las del docente que más se ven, simuladas; las demás, dichas con palabras
const ficha = (id) => { const f = DATOS.get("student_profiles/" + id); if (!f) throw new Error("No encuentro esa ficha."); return f; };
function misionDe(per, retoId) {
  const r = resolverConsulta(query(collection(DB, "missions"), where("projectId", "==", per), where("stargateId", "==", retoId)));
  return r.length ? { id: r[0][0].split("/")[1], d: r[0][1] } : null;
}
const premiosDe = (per) => resolverConsulta(query(collection(DB, "rewards"), where("projectId", "==", per))).map(([ruta, d]) => Object.assign({ id: ruta.split("/")[1] }, d));
/** Sacar del cofre con sus probabilidades, como el Mercado (y como el servidor: lootPicker.js). */
function sortea(cofre) {
  const items = (((cofre || {}).consumeEffects || {}).lootBox || {}).items || [];
  const total = items.reduce((a, i) => a + Math.max(0, Number(i.probability) || 0), 0);
  let n = Math.random() * (total || items.length);
  for (const i of items) { n -= total ? Math.max(0, Number(i.probability) || 0) : 1; if (n <= 0) return i.rewardId; }
  return items.length ? items[items.length - 1].rewardId : null;
}
const FUNCIONES = {
  async applyXpDelta(x) {
    const ruta = "student_profiles/" + x.studentProfileId, f = ficha(x.studentProfileId);
    hacerUpdate(refDoc(ruta), [{ totalPoints: Math.max(0, (Number(f.totalPoints) || 0) + (Number(x.deltaXp) || 0)), coins: Math.max(0, (Number(f.coins) || 0) + (Number(x.deltaCoins) || 0)) }]);
    trasEscribir(); return { ok: true };
  },
  async stargateAnularReto(x) {
    const m = misionDe(x.projectId, x.retoId), f = ficha(x.studentProfileId), ruta = "student_profiles/" + x.studentProfileId;
    if (!m) throw new Error("Ese reto no existe en este grupo.");
    if ((f.completedMissionIds || []).indexOf(m.id) < 0) throw new Error("Ese reto no está registrado.");
    const xp = Number(m.d.points) || 0, oro = Number(m.d.coinsReward) || 0, tenia = Number(f.coins) || 0;
    const sellos = Object.assign({}, f.missionTimestamps || {}); delete sellos[m.id];
    hacerUpdate(refDoc(ruta), [{ completedMissionIds: (f.completedMissionIds || []).filter((id) => id !== m.id), missionTimestamps: sellos,
      totalPoints: Math.max(0, (Number(f.totalPoints) || 0) - xp), coins: Math.max(0, tenia - oro),
      earnedBadges: (f.earnedBadges || []).filter((b) => b !== m.d.badge) }]);
    trasEscribir(); return { ok: true, xp, creditos: oro, noRetirados: Math.max(0, oro - tenia), saldo: Math.max(0, tenia - oro) };
  },
  async stargateEquipo(x) {
    const persona = { correo: String((x.persona || {}).correo || "").toLowerCase(), nombre: String((x.persona || {}).nombre || "").slice(0, 80), rol: (x.persona || {}).rol === "referente" ? "referente" : "docente" };
    if (!persona.correo) throw new Error("Falta el correo.");
    const pers = x.projectIds || [x.projectId], hechos = [], fallos = [];
    pers.forEach((per) => {
      const p = DATOS.get("projects/" + per), pv = DATOS.get("projects/" + per + "/privado/stargate") || {};
      if (!p) { fallos.push(per); return; }
      let lista = (pv.docentes || []).slice();
      if (x.quitar) lista = lista.filter((d) => String(d.correo).toLowerCase() !== persona.correo);
      else { const i = lista.findIndex((d) => String(d.correo).toLowerCase() === persona.correo);
        if (i >= 0) lista[i] = Object.assign({}, lista[i], persona, { nombre: persona.nombre || lista[i].nombre });
        else lista.push(Object.assign({ panel: "", imparte: true }, persona, { nombre: persona.nombre || persona.correo.split("@")[0] })); }
      hacerSet(refDoc("projects/" + per + "/privado/stargate"), { docentes: lista }, { merge: true });
      hacerUpdate(refDoc("projects/" + per), [{ coTeacherEmails: x.quitar ? arrayRemove(persona.correo) : arrayUnion(persona.correo) }]);
      hechos.push(per);
    });
    trasEscribir(); return { ok: true, hechos, fallos, persona };
  },
  async stargateAlumno(x) {
    const ruta = "student_profiles/" + x.fichaId, f = ficha(x.fichaId);
    if (x.accion === "congelar" || x.accion === "descongelar") {
      hacerUpdate(refDoc(ruta), [{ stargateCongelado: x.accion === "congelar" ? { por: YO.correo, fecha: Date.now() } : deleteField() }]);
      trasEscribir(); return { ok: true, estado: x.accion === "congelar" ? "congelado" : "activo" };
    }
    if (x.accion === "baja") {
      escribir(ruta + "/privado/datos", null); escribir(ruta, null);
      resolverConsulta(query(collection(DB, "stargate_alias"), where("projectId", "==", x.projectId), where("uid", "==", f.userId))).forEach(([r]) => escribir(r, null));
      trasEscribir(); return { ok: true };
    }
    const e = new Error("En el ensayo no se puede mover a nadie de grupo: solo hay un grupo. En los tuyos de verdad, sí."); e.code = "functions/failed-precondition"; throw e;
  },
  async stargateRegalar(x) {
    const per = x.projectId, regalo = x.regalo || {}, docs = premiosDe(per), tipo = String(regalo.tipo || "");
    const cofreDe = (t) => docs.find((r) => r.stargateTipo === t && r.consumeEffects && r.consumeEffects.lootBox);
    if (tipo === "participacion") {
      const t = docs.find((r) => r.id === regalo.sorteo && r.systemEffect === "lottery_ticket");
      if (!t) throw new Error("Ese sorteo no existe en este grupo.");
      const n = Math.max(1, Math.min(10, Math.floor(Number(regalo.n) || 1)));
      const resultados = (x.fichas || []).map((id) => { const f = ficha(id), ya = Number((f.lotteryEntries || {})[t.id] || 0);
        hacerUpdate(refDoc("student_profiles/" + id), ["lotteryEntries." + t.id, ya + n]); return { ficha: id, participaciones: n }; });
      trasEscribir(); return { ok: true, tipo, sorteo: t.id, resultados };
    }
    let piezas, unico = false;
    if (tipo === "carta" || tipo === "sobre") {
      const sobre = cofreDe("cromo"); if (!sobre) throw new Error("Este grupo no tiene sobres de cromos.");
      piezas = regalo.clave ? () => [per + "__cromo_" + regalo.clave] : () => Array.from({ length: tipo === "sobre" ? Math.max(1, Number(sobre.maxUses || 3)) : 1 }, () => sortea(sobre)).filter(Boolean);
    } else if (tipo === "heroe") {
      piezas = regalo.clave ? () => [per + "__heroe_" + regalo.clave] : () => [sortea(cofreDe("heroe"))].filter(Boolean);
    } else if (tipo === "cofre") {
      const cofre = cofreDe(String(regalo.cual || "")); if (!cofre) throw new Error("Este grupo no tiene ese cofre en su tienda.");
      piezas = () => Array.from({ length: Math.max(1, Number(cofre.maxUses || 1)) }, () => sortea(cofre)).filter(Boolean);
    } else if (tipo === "adorno") {
      const r = docs.find((y) => y.inStore !== false && y.stargateTipo === regalo.cual); if (!r) throw new Error("Este grupo no tiene ese adorno en su tienda.");
      piezas = () => [r.id]; unico = true;
    } else throw new Error("Ese regalo no existe.");
    const resultados = (x.fichas || []).map((id) => {
      try {
        const f = ficha(id), inv = (f.inventory || []).slice(), nuevas = piezas();
        if (unico && inv.indexOf(nuevas[0]) >= 0) return { ficha: id, ya: true, piezas: [] };
        hacerUpdate(refDoc("student_profiles/" + id), [{ inventory: inv.concat(nuevas) }]);
        return { ficha: id, piezas: nuevas };
      } catch (e) { return { ficha: id, error: String(e.message || e) }; }
    });
    trasEscribir(); return { ok: true, tipo, resultados };
  },
};
const QUE_HACE = { completeMission: "registrar un reto como recluta", castVote: "votar como recluta", claimLinkedReward: "abrir un premio por enlace",
  consumeItem: "usar una carta", stargateAsistencia: "fichar en la llamada a filas", stargateBatalla: "jugar la batalla contra Joran",
  stargateSortear: "hacer el Gran Sorteo", stargateSorteosPendientes: "mirar los sorteos pendientes", stargateOferta: "lanzar una oferta del Mercado",
  stargateSecreto: "comprobar una palabra secreta", stargateHitos: "comprobar los logros de a bordo", stargateMiNombre: "cambiar tu nombre en todos tus grupos",
  stargateHeroeRepetido: "cambiar un héroe repetido", deleteProject: "borrar el grupo",
  stargateZocoPoner: "poner algo en el Zoco", stargateZocoRetirar: "retirar algo del Zoco", stargateZocoOfertar: "ofertar en el Zoco",
  stargateZocoResponder: "responder en el Zoco", stargateZocoDeshacer: "deshacer un trato del Zoco" };
export function getFunctions() { return { name: "ensayo" }; }
export function connectFunctionsEmulator() {}
export function httpsCallable(fns, nombre) {
  return async (datos) => {
    await pausa();
    if (FUNCIONES[nombre]) return { data: await FUNCIONES[nombre](datos || {}) };
    const e = new Error("En la consola de ensayo no se puede " + (QUE_HACE[nombre] || "hacer esto") + ": eso lo hace el servidor, y aquí no hay servidor. En tu grupo de verdad, sí.");
    e.code = "functions/failed-precondition"; throw e;
  };
}
