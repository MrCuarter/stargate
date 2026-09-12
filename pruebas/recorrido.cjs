'use strict';
/**
 * BATERÍA 64 · EL RECORRIDO HUMANO.
 *
 * 🔴 POR QUÉ EXISTE, dicho sin adornos. El 12-sep Norberto se estrelló en el PRIMER clic: pulsó
 * «Soy docente», aterrizó en la guía, pulsó «Iniciar sesión con Google» y acabó en una página de
 * texto donde el botón de entrar estaba a 734 px de scroll. Las 63 baterías que había —3.017
 * comprobaciones— no vieron nada, y no por descuido: comprobaban DATOS y FUNCIONES. Que el álbum
 * cuente bien, que los créditos no bajen de cero, que el traductor devuelva los campos con su
 * nombre. Ninguna abría la web y trataba de usarla.
 *
 * Un sistema puede tener todas sus funciones correctas y ser imposible de usar. Esta batería
 * comprueba lo otro: que se pueda ENTRAR, que cada botón lleve a donde dice, que la acción
 * principal se vea sin buscarla y que no haya ningún callejón sin salida.
 *
 * CÓMO. Chrome de verdad por CDP —igual que `_capturar.cjs`, cero dependencias— contra un servidor
 * local. El motor se sustituye interceptando la petición de `motor.js`: así se puede recorrer la
 * web como estudiante, como docente raso, como referente o como alguien a quien el sistema no
 * conoce, sin tener ninguna contraseña. Que es justo lo que no se podía hacer hasta hoy.
 *
 *   node pruebas/recorrido.cjs            todos los recorridos
 *   node pruebas/recorrido.cjs --ver      con Chrome a la vista
 */
const fs = require("fs"), path = require("path"), os = require("os"), { spawn } = require("child_process");

const RAIZ = path.resolve(__dirname, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const P_CDP = 9444, P_WEB = 8765;
const VER = process.argv.includes("--ver");
const dormir = ms => new Promise(r => setTimeout(r, ms));

// ------------------------------------------------------------------ cuentas de mentira
// Cuatro personas, que son las cuatro que existen. El referente lleva grupos Y tiene `soyReferente`
// puesto; el docente raso lleva grupos y NO lo tiene; el estudiante no lleva ninguno pero sí ficha;
// y el desconocido no es nada — es quien tiene que acabar tecleando el código de clase.
const GRUPO = { id: "prueba-humana", nombre: "PRUEBA HUMANA", estado: "en marcha", semana: 10,
                total: 15, factions: [], stargate: { version: 3, inicio: "2026-07-11" } };
const QUIENES = {
  referente: { yo: { uid: "u-ref", correo: "n.cuartero.10@gmail.com", nombre: "Norberto" },
               pers: [Object.assign({}, GRUPO, { soyReferente: true })], fichas: [] },
  docente:   { yo: { uid: "u-doc", correo: "norberto@genially.com", nombre: "Docente" },
               pers: [Object.assign({}, GRUPO, { soyReferente: false })], fichas: [] },
  estudiante:{ yo: { uid: "u-alu", correo: "mrcuarter@gmail.com", nombre: "Alumno" },
               pers: [], fichas: [{ ficha: "f1", per: "prueba-humana" }] },
  desconocido:{ yo: { uid: "u-x", correo: "nadie@ejemplo.com", nombre: "Nadie" },
               pers: [], fichas: [] },
  anonimo:   { yo: null, pers: [], fichas: [] },
};

/** El motor de mentira. Se sirve EN LUGAR de `assets/js/motor.js`, así que la página no distingue. */
function motorFalso(q) {
  return `
window.SG = window.SG || {};
var YO = ${JSON.stringify(q.yo)};
var PERS = ${JSON.stringify(q.pers)};
var FICHAS = ${JSON.stringify(q.fichas)};
window.__SG_LLAMADAS__ = [];
function reg(n, a) { window.__SG_LLAMADAS__.push({ fn: n, args: a }); }
var P = function (v) { return Promise.resolve(v); };
window.SG.MOTOR = {
  entrar: function () { reg("entrar"); YO = YO || ${JSON.stringify(QUIENES.desconocido.yo)};
                        document.dispatchEvent(new CustomEvent("sg:sesion", { detail: YO })); return P(YO); },
  salir: function () { reg("salir"); YO = null; return P(); },
  sesion: function () { return P(YO); },
  misPERs: function (c) { reg("misPERs", c); return P(PERS); },
  misGruposDeAlumno: function (u) { reg("misGruposDeAlumno", u); return P(FICHAS); },
  grupoPorCodigo: function (c) { reg("grupoPorCodigo", c);
    return P(String(c).toUpperCase() === "L4PL9A" ? { id: "prueba-humana", nombre: "PRUEBA HUMANA" } : null); },
  leerPER: function () { return P({ proyecto: {}, stargate: {} }); },
  tablero: function () { return P({ reclutas: [], retos: [], recompensas: [] }); },
  huevosDe: function () { return P([]); },
  llamadaAbierta: function () { return P(null); },
  fichajesDe: function () { return P([]); },
  vigilarLlamada: function () { return function () {}; },
  llamar: function (n, a) { reg("llamar:" + n, a); return P({ ok: true }); },
  /**
   * 🔴 LAS PIEZAS SUELTAS DE FIRESTORE que el motor exporta y que fuente.js usa directamente.
   * Sin ellas, M.doc(...) era undefined y la sala del docente se quedaba colgada para siempre
   * en «Abriendo tu sala…»: el fallo saltaba DENTRO de un .map, antes del .catch de la cadena,
   * así que la promesa nunca se resolvía ni se rechazaba. No era un fallo de la web —en producción
   * estas funciones existen— sino un agujero de este doble, y agujeros así hacen perder una tarde
   * buscando un fallo que no está.
   */
  db: {}, auth: {},
  doc: function () { return { __ref: [].slice.call(arguments).join("/") }; },
  collection: function () { return { __col: [].slice.call(arguments).join("/") }; },
  query: function (c) { return c; },
  where: function () { return {}; },
  getDoc: function () { return P({ exists: function () { return false; }, data: function () { return null; } }); },
  getDocs: function () { return P({ docs: [], empty: true, size: 0 }); },
  setDoc: function () { return P(); }, updateDoc: function () { return P(); },
  deleteDoc: function () { return P(); },
  writeBatch: function () { return { set: function () {}, update: function () {}, commit: function () { return P(); } }; },
};
document.dispatchEvent(new CustomEvent("sg:motor"));
document.dispatchEvent(new CustomEvent("sg:sesion", { detail: YO }));
`;
}

// ------------------------------------------------------------------ CDP mínimo
function conectar(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map(); const oyentes = [];
  ws.addEventListener("message", ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { ok, mal } = pend.get(m.id); pend.delete(m.id);
      return m.error ? mal(new Error(m.error.message)) : ok(m.result); }
    oyentes.forEach(f => f(m));
  });
  const listo = new Promise((ok, mal) => {
    ws.addEventListener("open", () => ok());
    ws.addEventListener("error", () => mal(new Error("websocket")));
  });
  return { listo, ws, al: f => oyentes.push(f),
    enviar(method, params) {
      return new Promise((ok, mal) => { const n = ++id; pend.set(n, { ok, mal });
        ws.send(JSON.stringify({ id: n, method, params: params || {} })); }); } };
}

async function esperarChrome() {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`http://127.0.0.1:${P_CDP}/json/version`); if (r.ok) return; } catch (e) {}
    await dormir(300);
  }
  throw new Error("Chrome no levantó el puerto de depuración");
}

/** Abre una pestaña con el motor de mentira puesto y devuelve el cliente + los errores de consola. */
async function pestana(quien) {
  const r = await fetch(`http://127.0.0.1:${P_CDP}/json/new?about:blank`, { method: "PUT" });
  const t = await r.json();
  const c = conectar(t.webSocketDebuggerUrl);
  await c.listo;
  const errores = [];
  c.al(m => {
    if (m.method === "Runtime.exceptionThrown") {
      const d = m.params.exceptionDetails || {};
      errores.push(String((d.exception && d.exception.description) || d.text || "error"));
    }
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") {
      errores.push(String(m.params.entry.text || ""));
    }
  });
  await c.enviar("Page.enable"); await c.enviar("Runtime.enable"); await c.enviar("Log.enable");
  await c.enviar("Emulation.setDeviceMetricsOverride",
    { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

  // 🔴 LA PIEZA CLAVE: cambiar el motor por el de mentira. Se intercepta la petición de red, así
  // que la página carga exactamente igual que en producción — mismo HTML, mismo CSS, mismo JS de
  // pantalla— y solo cambia quién contesta a «¿quién soy?». Si en vez de esto se pegara el falso
  // por `addScriptToEvaluateOnNewDocument`, el motor de verdad se cargaría después y lo pisaría.
  await c.enviar("Fetch.enable", { patterns: [{ urlPattern: "*motor.js*" }] });
  c.al(async m => {
    if (m.method !== "Fetch.requestPaused") return;
    await c.enviar("Fetch.fulfillRequest", { requestId: m.params.requestId, responseCode: 200,
      responseHeaders: [{ name: "Content-Type", value: "application/javascript" },
                        { name: "Access-Control-Allow-Origin", value: "*" }],
      body: Buffer.from(motorFalso(quien), "utf8").toString("base64") });
  });
  c.destruir = () => fetch(`http://127.0.0.1:${P_CDP}/json/close/${t.id}`).catch(() => {});
  c.errores = errores;
  return c;
}

/** Cualquier promesa con fecha de caducidad. */
function conTope(promesa, ms, queEra) {
  let t;
  return Promise.race([
    promesa.finally(() => clearTimeout(t)),
    new Promise((_, mal) => { t = setTimeout(() => mal(new Error("se agotó el tiempo: " + queEra)), ms); }),
  ]);
}

async function evaluar(c, expr) {
  // 🔴 `awaitPromise` espera A QUE LA PROMESA TERMINE, y si la página tiene una que no termina
  // nunca —una petición que nadie resuelve— esta llamada se queda colgada para siempre y con ella
  // la batería entera. Con tope: lo que no conteste en 8 segundos, no va a contestar.
  const r = await conTope(
    c.enviar("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }),
    8000, expr.slice(0, 50));
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " — " + expr.slice(0, 60));
  return r.result.value;
}

/** Espera a que una expresión sea cierta. Nada de esperas por reloj. */
async function hasta(c, expr, seg) {
  for (let i = 0; i < (seg || 8) * 5; i++) {
    try { if (await evaluar(c, expr)) return true; } catch (e) {}
    await dormir(200);
  }
  return false;
}

// ------------------------------------------------------------------ el marcador
let ok = 0; const fallos = [];
function comprobar(nombre, cierto, detalle) {
  if (cierto) { ok++; process.stderr.write("   ✓ " + nombre + "\n"); return true; }
  fallos.push(nombre + (detalle ? " — " + detalle : ""));
  process.stderr.write("   ✗ " + nombre + (detalle ? " — " + detalle : "") + "\n");
  return false;
}

module.exports = { pestana, evaluar, hasta, comprobar, conTope, QUIENES, P_WEB, P_CDP, CHROME, VER,
                   esperarChrome, dormir, RAIZ, marcador: () => ({ ok, fallos }) };
