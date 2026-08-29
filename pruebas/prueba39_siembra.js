'use strict';
// 39 · LA SIEMBRA DE ALUMNADO DE PRUEBA  (v3.37)
// Reemplaza al pruebaSembrar del difunto Pruebas.gs. Lo que aquel no tenía y esta sí: una puerta
// (solo grupos DEMO/PRUEBA), idempotencia (re-sembrar no duplica) y fechas que respetan el
// calendario — un reto del tema 5 fechado en la semana 2 volvería mentira el ranking semanal.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 39 · La siembra de alumnado de prueba");

// Un grupo DEMO que va por la semana 9 (como el que se va a crear en producción).
const G = E.nuevoMundo();
E.crearPERDemo(G, { nombre: "CLASE DEMO", inicio: E.iso(E.haceSemanas(8)) });
const PER = "clase-demo";
const o = G.perObj_(G.perFila_(PER).v);
igual(G.semanaDe_(o), 9, "el mundo de la prueba está en la semana 9, como el de verdad");

// ---------------------------------------------------------------- a) la puerta
const G2 = E.nuevoMundo();
E.crearPERDemo(G2, { nombre: "MASTER 2026" });
M.UI.limpiar(); M.UI.responder("YES");
G2._maestra.setActiveSheet(G2._maestra.getSheetByName("PERs"));
G2._maestra._rango = G2._maestra.getSheetByName("PERs").getRange(2, 1);
G2.sembrarDemo();
contiene(M.UI.avisos.join(" | "), "no parece de prueba",
  "🔴 en un grupo sin DEMO/PRUEBA en el nombre, se niega — la lección del viejo Pruebas.gs");
igual(G2.hoja_(G2.H.EV).getLastRow(), 1, "y no escribe ni una fila");

// ---------------------------------------------------------------- b) la siembra
const r = G.sembrarDemo_(PER);
igual(r.nuevos, 10, "siembra 10 reclutas");
igual(r.yaEstaban, 0, "");
c(r.eventos > 30, "con un buen puñado de registros (" + r.eventos + ")");

const t = G.tablero_(PER, true);
igual((t.reclutas || []).length, 10, "el tablero los ve a los diez");
const xps = t.reclutas.map(x => x.xp).sort((a, b) => a - b);
c(xps[0] < xps[9], "con progresos DISTINTOS: hay escalones en el ranking, no un empate a todo");
c(xps[0] === G.XP_RECLUTAMIENTO, "el más nuevo solo se ha alistado");
c(t.reclutas.every(x => /@reclutas\.demo$/.test(x.email)), "todos con correo @reclutas.demo: se ven venir");
c(t.reclutas.every(x => x.profe), "todos con docente asignado (el fallo que hubo que arreglar a mano el 28-ago)");
c(t.reclutas.every(x => x.avatar && x.avatar.n >= 1), "y todos con personaje elegido");

// las fechas respetan el calendario: nada registrado antes de que su tema abriera
const malFechados = [];
t.reclutas.forEach(x => (x.eventos || []).forEach(e => {
  const reto = G.retosDe_("REGULAR").filter(rr => rr[0] === e.reto_id)[0];
  if (!reto || reto[4] > 8) return;
  const abre = G.SEMANA_DEL_TEMA[String(reto[4])] || 99;
  const sem = Math.floor((new Date(e.fecha) - new Date(o.inicio + "T00:00:00")) / (7 * 864e5)) + 1;
  if (sem < abre) malFechados.push(e.reto_id + " en semana " + sem + " (abre en " + abre + ")");
}));
igual(malFechados, [], "🔴 ningún reto fechado antes de que su tema abriera");
c(t.reclutas.some(x => x.xp7 > 0), "alguien ha trabajado esta semana: el ranking semanal tiene a quién coronar");

// ---------------------------------------------------------------- c) idempotente
const r2 = G.sembrarDemo_(PER);
igual(r2.nuevos, 0, "🔴 re-sembrar no duplica a nadie");
igual(r2.yaEstaban, 10, "los reconoce a los diez");
igual(G.tablero_(PER, true).reclutas.length, 10, "y el tablero sigue con diez");

// ---------------------------------------------------------------- d) convive con el resto del sistema
G.alumnado_();
igual(G.hoja_(G.H.ALU).getLastRow() - 1, 10, "la pestaña ALUMNADO los lista");
const salud = G.salud_();
c(!salud.puntos.some(x => x.clave === "sindocente" && x.nivel === "mal"),
  "y el parte de salud no protesta por reclutas sin docente");

E.resumen("La siembra de alumnado de prueba");
