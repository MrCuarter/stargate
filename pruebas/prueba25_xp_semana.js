'use strict';
// 25 · EL XP DE LA SEMANA (el segundo ranking, y la corona)
// Se sumaba recorriendo los EVENTOS. Pero los retos que otorga el profesorado a mano viven en
// AJUSTES, no en EVENTOS: quien tenía todo validado por su profe salía con 0 esta semana, y la
// corona semanal se la llevaba otro. Ahora sale de los MISMOS retos que producen el xp total, cada
// uno con su fecha, así que las dos cifras no pueden divergir.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
console.log("\n▶ 25 · El xp de la semana");

const G = E.nuevoMundo();
const PER = E.crearPERDemo(G).id;
const hace = d => { const f = new Date(); f.setDate(f.getDate() - d); return f; };
const f = mail => G.tablero_(PER, true).reclutas.filter(x => x.email === mail)[0];

E.enviarBitacora(G, PER, { email: "nova@alumno.es", alias: "Nova", nombre: "N N", profe: "Mr Cuarter" });
E.enviarBitacora(G, PER, { email: "orion@alumno.es", alias: "Orion", nombre: "O O", profe: "Mr Cuarter" });

// ---------------------------------------------------------------- a) el reto que otorga el profe cuenta
// Alistarse YA son xp de esta semana (el reclutamiento), así que esa es la base de la que partimos.
const base = f("nova@alumno.es").xp7;
c(base > 0, "alistarse ya cuenta como xp de esta semana (" + base + ")");
igual(f("nova@alumno.es").xp, base, "y de momento es todo lo que tiene");
G.hoja_(G.H.AJ).appendRow([new Date(), PER, "nova@alumno.es", "A1", "otorgar", "", "profe"]);
const nova = f("nova@alumno.es");
c(nova.xp > base, "el reto otorgado suma al xp total (" + nova.xp + ")");
c(nova.xp7 > base, "🔴 y TAMBIÉN al de esta semana: lo validó el profe, pero lo hizo el alumno");
igual(nova.xp7, nova.xp, "si todo es de esta semana, las dos cifras coinciden");

// ---------------------------------------------------------------- b) lo viejo no cuenta
G.hoja_(G.H.AJ).appendRow([hace(30), PER, "orion@alumno.es", "A1", "otorgar", "", "profe"]);
const orion = f("orion@alumno.es");
c(orion.xp > base, "un reto de hace un mes sigue sumando al total (" + orion.xp + ")");
igual(orion.xp7, base, "🔴 pero NO a esta semana: si no, «esta semana» no significaría nada");

// ---------------------------------------------------------------- c) la corona va con lo semanal
const t = G.tablero_(PER, true);
const coronados = t.reclutas.filter(x => x.corona).map(x => x.alias);
igual(coronados, ["Nova"], "🔴 la corona semanal es de quien apretó ESTA semana, no de quien más lleva");

// ---------------------------------------------------------------- d) anular quita las dos cifras
G.hoja_(G.H.AJ).appendRow([new Date(), PER, "nova@alumno.es", "A1", "anular", "", "profe"]);
igual(f("nova@alumno.es").xp7, base, "al anular el reto desaparece de la semana");
igual(f("nova@alumno.es").xp, base, "y del total: es el mismo dato, no dos parecidos");

// ---------------------------------------------------------------- e) las dos vías suman igual
G.hoja_(G.H.AJ).appendRow([new Date(), PER, "nova@alumno.es", "A1", "otorgar", "", "profe"]);
const porProfe = f("nova@alumno.es").xp7;
E.enviarBitacora(G, PER, { email: "vega@alumno.es", alias: "Vega", nombre: "V V", profe: "Mr Cuarter" });
G.hoja_(G.H.EV).appendRow([new Date(), PER, "vega@alumno.es", "Vega", "A1", "Reto A1", 1, 0, "bitacora"]);
const vega = f("vega@alumno.es");
igual(vega.xp7, porProfe, "🔴 registrado por el alumno o validado por el profe: el MISMO reto vale lo mismo");
igual(vega.xp, vega.xp7, "y todo lo suyo es de esta semana");

E.resumen("El xp de la semana");
