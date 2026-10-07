/* GamificaPro · mod-sim v1 — GENERADO por scripts/build-sdk.mjs (npm run build:sdk) desde sdk/sim/simulador.js.
 * El Firebase de mentira, en memoria, de las consolas de ensayo: SOLO para el simulador, nunca en producción.
 * No se edita a mano ni en las webs: se cambia la pieza en GamificaPro y se genera otro paquete (otra huella).
 * Sin claves, sin textos y sin datos de ningún mod. Deja window.GP_SIM (o module.exports en Node):
 *   GP_SIM.crearSimulador(o)   → el Firebase de mentira (los nombres del SDK de Firebase), reiniciar() e interno
 *   GP_SIM.correr, lunesDe, semanasEnteras, SEMANA, Timestamp, FieldPath, aJson, deJson
 */
(function (raiz) {
function pieza(cuerpo) { var module = { exports: {} }; cuerpo.call({}, module, module.exports); return module.exports; }
var simulador = pieza(function (module, exports) {
// ─── GP_SDK pieza «simulador» (sdk/sim/simulador.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · EL FIREBASE DE MENTIRA, EN MEMORIA — el simulador común (7-oct-2026), pieza APARTE del SDK v1 (fase 5 de
 * docs/PLAN_CENTRALIZAR.md, `sdk/sim/`).
 *
 * Las dos webs tenían el suyo, parecido en un 64 %: STARGATE (assets/js/sim/firebase_sim.js, la consola de ensayo) y DPG (el
 * mismo fichero, el simulador del docente). Las dos hacían lo mismo: la consola DE VERDAD (motor.js entero, con sus imports de
 * Firebase cambiados por estos) corriendo contra una escuela sembrada, sin red y sin cuentas. Aquí está el núcleo una vez, con
 * lo de las dos (el superconjunto) y sin piel ni datos: ni siembra, ni clave de localStorage, ni textos del mod, ni funciones
 * del servidor de ningún mod. Cada web conserva un ENVOLTORIO corto (su assets/js/sim/firebase_sim.js) que trae su siembra,
 * llama a `crearSimulador(o)` con lo suyo y reexporta lo que importa su motor.
 *
 * Cubre lo que usan los motores (y un poco más, como el Firebase de verdad):
 *   · app y Auth: una persona (el docente de ensayo), signInWithPopup/Credential/Anonymously, signOut (lo que haga la web);
 *   · Firestore: doc, collection, consultas con where/orderBy/limit, getDoc(s), getCountFromServer, setDoc con merge y
 *     mergeFields, updateDoc (objeto o pares campo-valor, FieldPath), deleteDoc, addDoc, lotes y TRANSACCIONES (todo o nada),
 *     onSnapshot con docChanges DE VERDAD (added, modified, removed), arrayUnion/arrayRemove, increment, deleteField,
 *     serverTimestamp, Timestamp (fromMillis, fromDate, now), terminate;
 *   · funciones (httpsCallable): las que la web simula (`funciones`); las demás, un error con palabras (`queHace`).
 *
 * Opciones de `crearSimulador(o)` (todas opcionales; por defecto, las del simulador de DPG):
 *   semilla      { docs: {ruta: datos}, yo: {uid, nombre, correo}, v }   (los Timestamp, como {__ts: ms})
 *   clave        la clave de localStorage donde se guarda lo tocado (sin ella, no se guarda)
 *   version      lo tocado se guarda con esta versión y solo se recupera con la misma (por defecto, semilla.v)
 *   corre        milisegundos que se corren las fechas de la semilla (ver `correr`, `semanasEnteras`)
 *   almacen      el localStorage (por defecto, el del navegador; null = ninguno)
 *   nombre       el nombre de la app, de Auth y de las funciones («simulador»)
 *   donde        para los errores: «No existe el documento x (en el simulador).»
 *   prefijoId    los ids nuevos empiezan así («sim»)
 *   token        lo que devuelve getIdToken («simulador»)
 *   noSeGuarda   [[RegExp, texto]]: rutas que no se escriben nunca (error permission-denied con ese texto)
 *   alEscribir   (ruta, datos|null) tras cada escritura que se queda (la de un lote, al confirmarse)
 *   alSalir      lo que hace signOut
 *   funciones    {nombre: async (datos) => respuesta} o (S) => {…}: las funciones del servidor que se simulan
 *   queHace      {nombre: «hacer tal cosa»} para el error de las que no; sinServidor(que, nombre) → el texto entero
 *   otrasPestanas  false para no escuchar los cambios de otras pestañas (evento storage)
 *   pausa        () => Promise: la espera antes de cada lectura o escritura (por defecto, un setTimeout 0, como la red)
 *
 * Devuelve el Firebase de mentira (los mismos nombres que el SDK de Firebase), `reiniciar()` (vuelve a la semilla) e `interno`
 * (el almacén y sus escrituras, para las funciones del servidor que simula cada web).
 *
 * Se usa igual en Node (pruebas: module.exports) y en el navegador suelta (window.GPSIM); el paquete aparte
 * dist-sdk/mod-sim.v1.<huella>.js (scripts/build-sdk.mjs) deja window.GP_SIM. 🔴 No va en el paquete del SDK: el simulador no
 * se carga nunca en producción.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPSIM = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  const DIA = 864e5, SEMANA = 7 * DIA;

  // ── los valores: Timestamp y centinelas
  class Timestamp {
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
  const arrayUnion = (...els) => ({ [CENT]: "union", els });
  const arrayRemove = (...els) => ({ [CENT]: "quitar", els });
  const deleteField = () => ({ [CENT]: "borrar" });
  const serverTimestamp = () => ({ [CENT]: "hora" });
  const increment = (n) => ({ [CENT]: "sumar", n });
  class FieldPath { constructor(...segs) { this.segs = segs.map(String); } }

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

  // ── las fechas que viajan con el calendario (STARGATE, 30-sep): la semilla se siembra un día y el ensayo debe seguir en su
  // semana. Semanas enteras contadas de LUNES a LUNES, en días redondeados: sembrado un miércoles, el lunes siguiente ya ha
  // pasado una semana, y el cambio de hora no descuadra la cuenta.
  const lunesDe = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  /** Las semanas enteras (lunes a lunes) de `desde` a `hasta` (por defecto, ahora); nunca menos de 0. */
  const semanasEnteras = (desde, hasta) => Math.max(0, Math.floor(Math.round((lunesDe(hasta == null ? Date.now() : hasta) - lunesDe(desde)) / DIA) / 7));
  /**
   * Corre `ms` milisegundos las fechas de `x`: milisegundos de estos años, días «AAAA-MM-DD», ISO en UTC y Timestamp (la copia
   * de STARGATE convertía un Timestamp en un objeto suelto sin correrlo; sus semillas no llevan ninguno, así que no cambia nada).
   */
  const ES_MS = (n) => typeof n === "number" && n > 1.5e12 && n < 2.5e12;
  const ES_DIA = /^\d{4}-\d{2}-\d{2}$/, ES_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/;
  function correr(x, ms) {
    if (!ms) return x;
    if (x instanceof Timestamp) return Timestamp.fromMillis(x.toMillis() + ms);
    if (ES_MS(x)) return x + ms;
    if (typeof x === "string" && ES_DIA.test(x)) return new Date(Date.parse(x + "T12:00:00Z") + ms).toISOString().slice(0, 10);
    if (typeof x === "string" && ES_ISO.test(x)) return new Date(Date.parse(x) + ms).toISOString();
    if (Array.isArray(x)) return x.map((y) => correr(y, ms));
    if (x && typeof x === "object") { const o = {}; for (const k of Object.keys(x)) o[k] = correr(x[k], ms); return o; }
    return x;
  }

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
  const where = (campo, op, valor) => ({ k: "where", campo, op, valor });
  const orderBy = (campo, dir) => ({ k: "orden", campo, dir: dir === "desc" ? -1 : 1 });
  const limit = (n) => ({ k: "limite", n });
  const query = (base, ...cs) => ({ type: "query", col: base.type === "query" ? base.col : base, _q: (base._q || []).concat(cs) });
  const conError = (txt, code) => { const e = new Error(txt); e.code = code; return e; };

  function crearSimulador(o) {
    o = o || {};
    const semilla = o.semilla || {};
    const CLAVE = o.clave || null, VERSION = o.version != null ? o.version : semilla.v, CORRE = Number(o.corre) || 0;
    const NOMBRE = o.nombre || "simulador", DONDE = o.donde || "en el simulador", PREFIJO = o.prefijoId || "sim";
    const NO_SE_GUARDA = o.noSeGuarda || [];
    const almacen = () => (o.almacen !== undefined ? o.almacen : (typeof localStorage !== "undefined" ? localStorage : null));
    const pausa = o.pausa || (() => new Promise((r) => setTimeout(r, 0)));

    // ── el almacén: la semilla y, encima, lo que se ha tocado en este navegador
    const DATOS = new Map();
    let CAMBIOS = {};
    function cargar() {
      DATOS.clear();
      const base = correr(deJson(JSON.stringify(semilla.docs || {})), CORRE);
      for (const k of Object.keys(base)) DATOS.set(k, base[k]);
      CAMBIOS = {};
      try { const L = CLAVE && almacen(), g = L && L.getItem(CLAVE); if (g) { const x = deJson(g); if (x && x.v === VERSION) CAMBIOS = x.c || {}; } } catch (e) { /* sin almacenamiento */ }
      for (const k of Object.keys(CAMBIOS)) { if (CAMBIOS[k] === null) DATOS.delete(k); else DATOS.set(k, CAMBIOS[k]); }
    }
    cargar();
    function guardarCambios() { try { const L = CLAVE && almacen(); if (L) L.setItem(CLAVE, aJson({ v: VERSION, c: CAMBIOS })); } catch (e) { /* sin almacenamiento */ } }
    // Lo que se escribe dentro de un lote o una transacción se avisa (alEscribir) solo si el lote se queda entero.
    let enLote = null;
    function escribir(ruta, d) {
      if (d === null) DATOS.delete(ruta); else DATOS.set(ruta, d);
      CAMBIOS[ruta] = d;
      if (o.alEscribir) { if (enLote) enLote.push([ruta, d]); else o.alEscribir(ruta, d); }
    }
    /** Las escrituras de un lote o una transacción: todas o ninguna (como Firestore). */
    function todoONada(ops) {
      const datos = new Map(DATOS), cambios = Object.assign({}, CAMBIOS), fuera = enLote;
      enLote = [];
      try { ops.forEach((f) => f()); } catch (e) {
        DATOS.clear(); datos.forEach((v, k) => DATOS.set(k, v)); CAMBIOS = cambios; enLote = fuera; throw e;
      }
      const hechos = enLote; enLote = fuera;
      if (o.alEscribir) hechos.forEach(([r, d]) => (enLote ? enLote.push([r, d]) : o.alEscribir(r, d)));
    }
    /** Vuelve a la semilla (y olvida lo tocado en este navegador). */
    function reiniciar() { try { const L = CLAVE && almacen(); if (L) L.removeItem(CLAVE); } catch (e) { /* sin almacenamiento */ } cargar(); avisar(); }
    if (o.otrasPestanas !== false && CLAVE && typeof window !== "undefined" && window && typeof window.addEventListener === "function")
      window.addEventListener("storage", (e) => { if (e.key === CLAVE) { cargar(); avisar(); } });
    function vigilarRuta(ruta) {
      for (const [re, txt] of NO_SE_GUARDA) if (re.test(ruta)) throw conError(txt, "permission-denied");
    }

    // ── referencias y consultas
    const DB = { __simDb: true };
    let cuenta = 0;
    const idNuevo = () => PREFIJO + Date.now().toString(36) + (cuenta++).toString(36) + Math.random().toString(36).slice(2, 6);
    function refDoc(ruta) { const p = ruta.split("/"); return { type: "document", path: ruta, id: p[p.length - 1], firestore: DB, get parent() { return refCol(p.slice(0, -1).join("/")); } }; }
    function refCol(ruta) { const p = ruta.split("/"); return { type: "collection", path: ruta, id: p[p.length - 1], firestore: DB, _q: [] }; }
    function unir(padre, segs) { return (padre && padre.path ? [padre.path] : []).concat(segs.map(String)).join("/"); }
    function doc(padre, ...segs) {
      if (padre && padre.type === "collection" && !segs.length) return refDoc(padre.path + "/" + idNuevo());
      return refDoc(unir(padre, segs));
    }
    function collection(padre, ...segs) { return refCol(unir(padre, segs)); }

    function resolverConsulta(q) {
      const col = q.type === "query" ? q.col : q, pre = col.path + "/", cs = q._q || [];
      let filas = [];
      for (const [ruta, d] of DATOS) if (ruta.startsWith(pre) && ruta.indexOf("/", pre.length) < 0) filas.push([ruta, d]);
      for (const c of cs) if (c.k === "where") filas = filas.filter(([, d]) => cumple(d, c));
      const ordenes = cs.filter((c) => c.k === "orden");
      if (ordenes.length) {
        filas = filas.filter(([, d]) => ordenes.every((x) => leerCampo(d, x.campo) !== undefined));
        filas.sort((x, y) => { for (const r of ordenes) { const a = val(leerCampo(x[1], r.campo)), b = val(leerCampo(y[1], r.campo)); if (a < b) return -r.dir; if (a > b) return r.dir; } return 0; });
      } else filas.sort((x, y) => (x[0] < y[0] ? -1 : 1));
      const lim = cs.filter((c) => c.k === "limite").pop();
      if (lim) filas = filas.slice(0, lim.n);
      return filas;
    }
    const META = () => ({ hasPendingWrites: false, fromCache: false });
    function fotoDoc(ruta) {
      const d = DATOS.get(ruta), ref = refDoc(ruta);
      return { id: ref.id, ref, exists: () => d !== undefined, data: () => (d === undefined ? undefined : copia(d)), get: (c) => copia(leerCampo(d || {}, c)), metadata: META() };
    }
    /**
     * La foto de una consulta y sus cambios frente a la foto anterior del mismo oyente (`antes`: {id: firma}): added, modified,
     * removed, como el Firebase de verdad (el directo del final de la clase de STARGATE mira «added» y «removed»). Sin `antes`
     * (getDocs, o la primera foto de un oyente), todo es «added». → { foto, firmas }
     */
    function fotoConsulta(q, antes) {
      const docs = resolverConsulta(q).map(([ruta]) => fotoDoc(ruta));
      const previo = antes || {}, ahora = {};
      docs.forEach((d) => { ahora[d.id] = aJson(d.data()); });
      const cambios = [];
      docs.forEach((d, i) => { if (!(d.id in previo)) cambios.push({ type: "added", doc: d, newIndex: i, oldIndex: -1 }); else if (previo[d.id] !== ahora[d.id]) cambios.push({ type: "modified", doc: d, newIndex: i, oldIndex: i }); });
      Object.keys(previo).forEach((id) => { if (!(id in ahora)) cambios.push({ type: "removed", doc: fotoDoc((q.type === "query" ? q.col : q).path + "/" + id), newIndex: -1, oldIndex: 0 }); });
      const foto = { docs, size: docs.length, empty: !docs.length, forEach: (fn) => docs.forEach(fn), docChanges: () => cambios, metadata: META() };
      return { foto, firmas: ahora, orden: docs.map((d) => d.id) };
    }
    async function getDoc(ref) { await pausa(); return fotoDoc(ref.path); }
    async function getDocs(q) { await pausa(); return fotoConsulta(q).foto; }
    async function getCountFromServer(q) { await pausa(); const n = resolverConsulta(q).length; return { data: () => ({ count: n }) }; }

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
      if (antes === undefined) throw conError("No existe el documento " + ref.path + " (" + DONDE + ").", "not-found");
      const nuevo = copia(antes);
      if (args[0] instanceof FieldPath || typeof args[0] === "string") { for (let i = 0; i < args.length; i += 2) ponerCampo(nuevo, args[i], args[i + 1]); }
      else for (const k of Object.keys(args[0])) ponerCampo(nuevo, k, args[0][k]);
      escribir(ref.path, nuevo);
    }
    function hacerDelete(ref) { vigilarRuta(ref.path); escribir(ref.path, null); }
    function trasEscribir() { guardarCambios(); avisar(); }
    async function setDoc(ref, datos, opc) { await pausa(); hacerSet(ref, datos, opc); trasEscribir(); }
    async function updateDoc(ref, ...args) { await pausa(); hacerUpdate(ref, args); trasEscribir(); }
    async function deleteDoc(ref) { await pausa(); hacerDelete(ref); trasEscribir(); }
    async function addDoc(col, datos) { const ref = doc(col); await setDoc(ref, datos); return ref; }
    function writeBatch() {
      const ops = [];
      const lote = {
        set(ref, d, op) { ops.push(() => hacerSet(ref, d, op)); return lote; },
        update(ref, ...a) { ops.push(() => hacerUpdate(ref, a)); return lote; },
        delete(ref) { ops.push(() => hacerDelete(ref)); return lote; },
        async commit() { await pausa(); todoONada(ops); trasEscribir(); },
      };
      return lote;
    }
    /**
     * Una transacción: lee lo de ahora y escribe al final, todo o nada. Como en Firebase, se lee antes de escribir; si la
     * función falla, no se escribe nada y el error sale tal cual. → lo que devuelva la función.
     */
    async function runTransaction(db, fn) {
      await pausa();
      const ops = [];
      const tx = {
        async get(ref) {
          if (ops.length) throw conError("En una transacción se lee antes de escribir.", "invalid-argument");
          return fotoDoc(ref.path);
        },
        set(ref, d, op) { ops.push(() => hacerSet(ref, d, op)); return tx; },
        update(ref, ...a) { ops.push(() => hacerUpdate(ref, a)); return tx; },
        delete(ref) { ops.push(() => hacerDelete(ref)); return tx; },
      };
      const r = await fn(tx);
      todoONada(ops); trasEscribir();
      return r;
    }

    // ── en vivo
    const OYENTES = new Set();
    function avisar() {
      for (const y of OYENTES) {
        if (y.ref.type === "document") {
          const foto = fotoDoc(y.ref.path), firma = aJson(foto.data() || null);
          if (firma !== y.firma) { y.firma = firma; try { y.sig(foto); } catch (e) { console.error(e); } }
        } else {
          const r = fotoConsulta(y.ref, y.antes), firma = aJson(r.orden.map((id) => [id, r.firmas[id]]));
          if (firma !== y.firma) { y.firma = firma; y.antes = r.firmas; try { y.sig(r.foto); } catch (e) { console.error(e); } }
        }
      }
    }
    function onSnapshot(ref, a, b, c) {
      if (a && typeof a === "object" && typeof a.next !== "function" && typeof a !== "function") { a = b; b = c; }   // (opciones)
      const sig = typeof a === "function" ? a : (a && a.next ? a.next.bind(a) : () => {});
      const y = { ref, sig, firma: null, antes: null };
      OYENTES.add(y);
      setTimeout(() => { if (OYENTES.has(y)) { y.firma = null; avisar(); } }, 0);
      return () => OYENTES.delete(y);
    }

    // ── app, Firestore y Auth
    const YO = semilla.yo || { uid: "sim-docente", nombre: "Docente de ensayo", correo: "docente@ensayo.invalid" };
    const TOKEN = o.token != null ? String(o.token) : "simulador";
    const USUARIO = { uid: YO.uid, email: YO.correo, displayName: YO.nombre, photoURL: "", emailVerified: true, isAnonymous: false,
      providerData: [{ providerId: "google.com" }], getIdToken: async () => TOKEN, getIdTokenResult: async () => ({ claims: {} }) };
    const AUTH = { currentUser: USUARIO, name: NOMBRE };
    class GoogleAuthProvider { setCustomParameters() {} addScope() {} static credential() { return {}; } }
    const nada = () => {};

    // ── las funciones del servidor (httpsCallable): las que simula la web; las demás, dichas con palabras
    const QUE_HACE = o.queHace || {};
    const sinServidor = o.sinServidor || ((que) => "En el simulador no se puede " + que + ": eso lo hace el servidor, y aquí no hay servidor. En tu grupo de verdad, sí.");
    let FUNCIONES = null;
    function httpsCallable(fns, nombre) {
      return async (datos) => {
        await pausa();
        if (!FUNCIONES) FUNCIONES = (typeof o.funciones === "function" ? o.funciones(S) : o.funciones) || {};
        if (FUNCIONES[nombre]) return { data: await FUNCIONES[nombre](datos || {}) };
        throw conError(sinServidor(QUE_HACE[nombre] || "hacer esto", nombre), "functions/failed-precondition");
      };
    }

    const S = {
      // app
      initializeApp: (cfg) => ({ name: NOMBRE, options: cfg || {} }),
      // Firestore
      getFirestore: () => DB, connectFirestoreEmulator: nada, terminate: async () => {},
      Timestamp, FieldPath, arrayUnion, arrayRemove, deleteField, serverTimestamp, increment,
      doc, collection, where, orderBy, limit, query,
      getDoc, getDocs, getCountFromServer, setDoc, updateDoc, deleteDoc, addDoc, writeBatch, runTransaction, onSnapshot,
      // Auth
      getAuth: () => AUTH, connectAuthEmulator: nada, GoogleAuthProvider,
      signInWithPopup: async () => ({ user: USUARIO }),
      signInWithCredential: async () => ({ user: USUARIO }),
      signInAnonymously: async () => ({ user: USUARIO }),
      signOut: async () => { if (o.alSalir) await o.alSalir(); },
      onAuthStateChanged: (auth, fn) => { const f = typeof fn === "function" ? fn : (fn && fn.next ? fn.next.bind(fn) : () => {}); setTimeout(() => f(USUARIO), 0); return () => {}; },
      // funciones
      getFunctions: () => ({ name: NOMBRE }), connectFunctionsEmulator: nada, httpsCallable,
      // del simulador
      reiniciar,
      /** Para las funciones del servidor que simula cada web: el almacén (Map ruta → datos) y cómo se escribe en él. */
      interno: { DATOS, escribir, hacerSet, hacerUpdate, resolverConsulta, trasEscribir, idNuevo, refDoc, fotoDoc, YO, USUARIO, DB },
    };
    return S;
  }

  return { version: "v1", crearSimulador, Timestamp, FieldPath, correr, lunesDe, semanasEnteras, SEMANA, aJson, deJson };
});
// ─── fin de la pieza «simulador» ───
});
if (typeof module === "object" && module && module.exports) module.exports = simulador;
if (raiz) raiz.GP_SIM = simulador;
})(typeof self !== "undefined" ? self : typeof globalThis !== "undefined" ? globalThis : this);
