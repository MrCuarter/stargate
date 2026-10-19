'use strict';
/**
 * BATERÍA 150 · «EN DIRECTO» SIN ESCRITURAS DE MÁS (19-oct-2026, P10 de GamificaPro docs/COSTES_POR_CLASE.md §9.3)
 *
 * El proyector (juegos/directo/proyector.js) manda su estado dos veces por segundo; `directoCanal` (motor.js) lo subía una vez por
 * segundo aunque no hubiera cambiado nada, y cada subida la leen todos los móviles de la sala. Y las escuchas de la sala vivían en el
 * motor de la página que contiene el marco del juego: al salir del juego seguían abiertas hasta recargar.
 *
 * Qué se demuestra (mismo resultado para quien juega):
 *   1. en la sala de espera y en el final, un estado igual al último no se sube; uno distinto, sí (y sale el último, como siempre);
 *   2. en la partida se sigue subiendo cada segundo aunque no cambie: es el latido del móvil (sin él, «Reconectando…» a los 3 s);
 *   3. si una subida falla, la siguiente igual vuelve a intentarlo (como antes, que se subía cada segundo);
 *   4. canal.js cierra las escuchas del motor al salir del marco (pagehide) y, si el navegador lo guarda para volver, recarga al volver.
 */
const fs = require("fs"), path = require("path"), assert = require("assert");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato).slice(0, 600))); };
const espera = ms => new Promise(r => setTimeout(r, ms));

const MOTOR = L("assets/js/motor.js");
const funcion = (T, n) => { const i = T.indexOf("\nfunction " + n + "("); assert.ok(i >= 0, n); const j = T.indexOf("\n}\n", i); return T.slice(i, j + 3); };
const CANAL = funcion(MOTOR, "directoCanal");
const SITIOS = (MOTOR.match(/\nconst ENVIVO = [^\n]*\nconst comoAntes = [^\n]*\n/) || [""])[0];

/** directoCanal de motor.js tal cual, contra un mostrador: `llamar` apunta cada llamada; las escuchas se apuntan y se pueden cerrar. */
function montar(llamar) {
  const escuchas = [];
  const fn = new Function("auth", "db", "doc", "collection", "query", "where", "onSnapshot", "getDoc", "setDoc", "addDoc", "updateDoc", "deleteDoc", "llamar",
    SITIOS + "\n" + CANAL + "\nreturn directoCanal;")(
    { currentUser: { uid: "yo" } }, {},
    (...a) => ({ doc: a.slice(1).join("/") }), (...a) => ({ col: a.slice(1).join("/") }), (...a) => ({ q: a }), (...a) => ({ w: a }),
    () => { const e = { abierta: true }; escuchas.push(e); return () => { e.abierta = false; }; },
    async () => ({ exists: () => false }), null, null, null, null, llamar);
  return { directoCanal: fn, escuchas };
}

(async () => {
  console.log("  El estado del proyector, solo si cambia (fuera de la partida)");
  const llamadas = [];
  const { directoCanal } = montar(async (n, d) => { llamadas.push(JSON.parse(JSON.stringify(d))); return { ok: true }; });
  const D = directoCanal("g1", true, null, () => {});
  const sacar = () => llamadas.splice(0).filter(x => x.accion === "poner").map(x => x.valor);
  const sala = { t: "estado", fase: "preparar", cfg: { modo: "defensa" }, n: 3, listos: 1 };

  // la sala de espera: el proyector manda el mismo estado durante 3 s (6 veces): se sube una vez
  for (let i = 0; i < 6; i++) { D.enviar(Object.assign({}, sala)); await espera(500); }
  await espera(1100);
  let v = sacar();
  c(v.length === 1 && v[0].fase === "preparar" && v[0].n === 3, "🔴 sala de espera sin cambios: 1 escritura en 3 s (antes, 3)", v);
  // entra alguien: cambia, se sube; y vuelve a quedarse quieto
  D.enviar(Object.assign({}, sala, { n: 4 })); await espera(1100);
  for (let i = 0; i < 4; i++) { D.enviar(Object.assign({}, sala, { n: 4 })); await espera(500); }
  await espera(1100);
  v = sacar();
  c(v.length === 1 && v[0].n === 4, "   entra un recluta: se sube el estado nuevo, y nada más mientras no cambie", v);
  // varios cambios seguidos: la tanda de un segundo sigue igual (sale el último)
  for (const n of [5, 6, 7]) D.enviar(Object.assign({}, sala, { n }));
  await espera(1200);
  v = sacar();
  c(v.length === 1 && v[0].n === 7, "   la tanda de un segundo se queda: de tres cambios seguidos sale el último", v);

  console.log("\n  En la partida, el latido se queda");
  const juego = { t: "estado", fase: "juego", cfg: { modo: "defensa" }, escudo: 100, n: 7, listos: 7 };
  for (let i = 0; i < 8; i++) { D.enviar(Object.assign({}, juego)); await espera(500); }
  await espera(1100);
  v = sacar();
  c(v.length >= 4 && v.every(x => x.fase === "juego"), "🔴 en la partida, el mismo estado se sigue subiendo cada segundo (el latido del móvil)", v.length);
  const acabando = Object.assign({}, juego, { fase: "acabando" });
  for (let i = 0; i < 6; i++) { D.enviar(Object.assign({}, acabando)); await espera(500); }
  await espera(1100);
  c(sacar().length >= 3, "   y mientras acaba («acabando»), también");

  console.log("\n  El final: quieto, sin escribir");
  const fin = Object.assign({}, juego, { fase: "fin" });
  for (let i = 0; i < 6; i++) { D.enviar(Object.assign({}, fin)); await espera(500); }
  await espera(1100);
  v = sacar();
  c(v.length === 1 && v[0].fase === "fin", "🔴 el podio proyectado sin cambios: 1 escritura", v);
  D.enviar(Object.assign({}, sala)); await espera(1100);
  c(sacar().length === 1, "   volver a la sala de espera es un cambio: se sube");

  console.log("\n  Si una subida falla, se reintenta");
  let falla = true; const hechas = [];
  const { directoCanal: dc2 } = montar(async (n, d) => { if (falla) { falla = false; throw new Error("sin red"); } hechas.push(d.valor); return { ok: true }; });
  const D2 = dc2("g1", true, null, () => {});
  D2.enviar(Object.assign({}, sala)); await espera(1100);
  c(hechas.length === 0, "   la primera falla (sin red)");
  D2.enviar(Object.assign({}, sala)); await espera(1100);
  c(hechas.length === 1 && hechas[0].fase === "preparar", "🔴 el mismo estado, tras un fallo, vuelve a subirse (antes se subía cada segundo)", hechas);

  console.log("\n  Al salir del juego se cierran las escuchas (canal.js)");
  const CANALJS = L("juegos/directo/canal.js");
  const oyentes = {}, recargas = [];
  const { directoCanal: dc3, escuchas } = montar(async () => ({ ok: true }));
  const M = { directoCanal: dc3, auth: { currentUser: { uid: "yo" } } };
  const ventana = { SG: { MOTOR: M } };
  // de canal.js, tal cual, lo de buscar el motor y conectar (de `PER` al final de `conectar`)
  const ini = CANALJS.indexOf("export const PER"), hasta = CANALJS.indexOf("\n}\n", CANALJS.indexOf("export function conectar(")) + 3;
  const cuerpo = CANALJS.slice(ini, hasta).replace(/^export /gm, "") + "\nreturn { conectar };";
  const mod = new Function("location", "window", "addEventListener", "BroadcastChannel", cuerpo)(
    { search: "?per=g1", reload: () => recargas.push(1) }, { parent: ventana },
    (tipo, f) => { (oyentes[tipo] = oyentes[tipo] || []).push(f); }, function () {});
  const canal = mod.conectar("ABCD", () => {}, { docente: true });
  c(escuchas.length === 3 && escuchas.every(e => e.abierta), "   el proyector escucha la sala, los sucesos y los jugadores", escuchas.length);
  (oyentes.pagehide || []).forEach(f => f({ persisted: false }));
  c(escuchas.every(e => !e.abierta), "🔴 al salir del marco (pagehide), las tres escuchas del motor se cierran", escuchas.map(e => e.abierta));
  c(typeof canal.enviar === "function" && typeof canal.mio === "function", "   el canal es el de siempre (enviar, mio, cerrar)");
  (oyentes.pagehide || []).forEach(f => f({ persisted: true }));
  (oyentes.pageshow || []).forEach(f => f({ persisted: true }));
  c(recargas.length === 1, "   si el navegador guarda el marco para volver, al volver se recarga (con las escuchas cerradas no vería nada)");
  c(funcion(L("assets/js/motor_sim.js"), "directoCanal").replace(/\s+/g, "") === CANAL.replace(/\s+/g, ""), "   la consola de ensayo (motor_sim.js, del build) lleva la misma función");

  console.log("\n" + (fallos.length ? "✗ " + fallos.length + " fallos" : "✓ todo bien") + " · " + ok + " comprobaciones");
  process.exit(fallos.length ? 1 : 0);
})();
