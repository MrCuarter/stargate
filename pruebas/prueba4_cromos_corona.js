'use strict';
// 4 · Álbum de cromos (rarezas, series, repetidos) y corona semanal
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 4 · Cromos, álbum y corona semanal");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco";

// --- el catálogo de cartas es coherente ---------------------------------------------------------
const pesos = G.CROMOS.reduce((a, x) => a + x[2], 0);
igual(pesos, 100, "los pesos de las 20 cartas suman 100");
igual(G.CROMOS.length, 20, "el álbum tiene 20 cartas");
const series = {};
G.CROMOS.forEach(x => { series[x[4]] = (series[x[4]] || 0) + 1; });
igual(Object.keys(series).length, 4, "repartidas en 4 series");
igual(series["Serie I · La Tripulación Cero"], 8, "Serie I: 8 cartas");
igual(series["Serie II · Los Ecos"], 6, "Serie II: 6 cartas");
igual(series["Serie III · La Nave"], 3, "Serie III: 3 cartas");
igual(series["Serie IV · La Sombra"], 3, "Serie IV: 3 cartas");
const ander = G.CROMOS.filter(x => x[0] === "S1_ander")[0];
igual(ander[2], 1, "Ander Vaeon es la más difícil: peso 1");
igual(ander[3], "LEGENDARIA", "y es LEGENDARIA");
c(!G.CROMOS.some((x, i) => G.CROMOS.findIndex(y => y[0] === x[0]) !== i), "no hay claves de carta repetidas");

// --- abrir sobres ------------------------------------------------------------------------------
E.enviarBitacora(G, PER, { email: "col@alumno.es", alias: "Col", nombre: "C C", profe: "Mr Cuarter" });
G.hoja_("EVENTOS").appendRow([new Date(), PER, "col@alumno.es", "Col", "XF", "regalo", 9, 500, "formulario"]);
// créditos suficientes para varios sobres
for (let i = 0; i < 6; i++) G.hoja_("AJUSTES").appendRow([new Date(), PER, "col@alumno.es", "X" + i, "otorgar", "", "banco"]);

M.Correo.limpiar();
const sacadas = [];
for (let i = 0; i < 4; i++) {
  const r = E.enviarCanje(G, PER, { email: "col@alumno.es", recompensa: E.etiqueta(G, "Sobre de cromos") });
  if (r.estado === "Concedido") sacadas.push(r);
}
c(sacadas.length >= 3, "se pueden abrir varios sobres (máx. 99)");
const alb = G.tablero_(PER, true).reclutas[0].cromos;
const total = Object.keys(alb).reduce((a, k) => a + alb[k], 0);
igual(total, sacadas.length, "el álbum suma exactamente las cartas obtenidas (repetidas incluidas)");
Object.keys(alb).forEach(k => c(G.CROMOS.some(x => x[0] === k), "la carta «" + k + "» existe en el catálogo"));
// v3.20 · abrir un sobre ya NO manda correo: la Nave lo celebra con la carta en grande. Lo que se
// comprueba es que el relato sigue existiendo (queda en la hoja de canjes, que es el registro).
igual(M.Correo.enviados.filter(x => String(x.para).indexOf("col@") >= 0).length, 0,
  "🔴 abrir un sobre no manda correo: se celebra en la Nave");
const filas = G._maestra.getSheetByName(G.perObj_(G.perFila_(PER).v).tabC).getDataRange().getValues();
const cab = filas[0].map(String), cEst = cab.indexOf("Estado");
const relatos = filas.slice(1).map(f => String(f[cEst] || "")).filter(x => x);
c(relatos.every(x => x.indexOf("Concedido") === 0), "y cada apertura queda registrada como concedida");

// --- corona semanal ------------------------------------------------------------------------------
const G2 = E.nuevoMundo();
E.crearPERDemo(G2, { nombre: "CORONA BANCO" });
const P2 = "corona-banco";
["uno", "dos", "tres"].forEach((n, i) => E.enviarBitacora(G2, P2, { email: n + "@alumno.es", alias: n, nombre: n, profe: "Mr Cuarter" }));
const viejo = new Date(); viejo.setDate(viejo.getDate() - 30);
// «dos» ganó mucho hace un mes (xp alto, pero no cuenta para la corona)
G2.hoja_("EVENTOS").appendRow([viejo, P2, "dos@alumno.es", "dos", "XF", "viejo", 9, 500, "formulario"]);
G2.hoja_("EVENTOS").appendRow([viejo, P2, "dos@alumno.es", "dos", "X1", "viejo", 1, 500, "formulario"]);
G2.hoja_("EVENTOS").appendRow([viejo, P2, "dos@alumno.es", "dos", "X2", "viejo", 3, 500, "formulario"]);
// «tres» ganó menos, pero esta semana
G2.hoja_("EVENTOS").appendRow([new Date(), P2, "tres@alumno.es", "tres", "X1", "reciente", 1, 500, "formulario"]);
let t2 = G2.tablero_(P2, true);
const porAlias = {}; t2.reclutas.forEach(x => { porAlias[x.alias] = x; });
c(porAlias.dos.xp > porAlias.tres.xp, "«dos» tiene más xp totales");
igual(porAlias.tres.corona, true, "pero la corona es de quien más ganó en 7 días");
igual(porAlias.dos.corona, false, "no de quien más tiene acumulado");
igual(porAlias.uno.corona, false, "quien no ganó nada esta semana no la lleva");

// empate: la llevan todos
G2.hoja_("EVENTOS").appendRow([new Date(), P2, "uno@alumno.es", "uno", "XF", "empate", 9, 500, "formulario"]);
t2 = G2.tablero_(P2, true);
igual(t2.reclutas.filter(x => x.corona).length, 2, "si hay empate, la corona la llevan los dos");

// nadie ha ganado nada esta semana -> no hay corona
const G3 = E.nuevoMundo();
E.crearPERDemo(G3, { nombre: "SIN CORONA" });
E.enviarBitacora(G3, "sin-corona", { email: "z@alumno.es", alias: "Z", nombre: "Z", profe: "Mr Cuarter" });
const shEv = G3.hoja_("EVENTOS");
shEv.getRange(2, 1).setValue(viejo);   // su reclutamiento, hace un mes
igual(G3.tablero_("sin-corona", true).reclutas[0].corona, false, "sin actividad reciente no hay corona");

E.resumen("Cromos, álbum y corona semanal");
