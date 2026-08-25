'use strict';
// 17 · EL BLOQUE DE PRODUCTO (§12.4 a §12.7)
//   a) 3 cromos repetidos = 1 sobre gratis (y la puerta del saldo hay que saltarla: cuesta 0 ◈)
//   b) insignias por SERIE completa, en un campo aparte: el «/24» de la misión no se toca
//   c) racha de semanas del PER (no la semana ISO: la racha habla el idioma del curso)
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 17 · Repetidos, series completas y racha");

const REPES = "Cambiar 3 repetidos por un sobre";
function ficha(G, email) { return G.tablero_("prueba-banco", true).reclutas.filter(x => x.email === email)[0]; }
function darCromo(G, email, clave) { G.extra_(G.perObj_(G.perFila_("prueba-banco").v), email, "cromo", clave); }
function cuantos(f) { return Object.keys(f.cromos).reduce((a, k) => a + f.cromos[k], 0); }

// ---------------------------------------------------------------- a) el canje de repetidos
let G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "repe@alumno.es", { profe: "Mr Cuarter" });

// la recompensa existe, es gratis y se desbloquea con el sobre normal
const cat = G.recompensasCat_().filter(x => x.nombre === REPES)[0];
c(!!cat, "🔴 «" + REPES + "» está en el catálogo");
igual(cat.coste, 0, "no cuesta créditos: se paga con cartas");
igual(cat.tipo, "cromo_repes", "y tiene su propio tipo");
igual(cat.desde, G.recompensasCat_().filter(x => x.nombre === "Sobre de cromos")[0].desde,
  "se desbloquea a la vez que el sobre normal");

// con 2 repetidos todavía no
darCromo(G, "repe@alumno.es", "P1_bran");
darCromo(G, "repe@alumno.es", "P1_bran");
darCromo(G, "repe@alumno.es", "P2_tomas");
darCromo(G, "repe@alumno.es", "P2_tomas");
let f = ficha(G, "repe@alumno.es");
igual(f.repes_disponibles, 2, "cuatro cartas de dos tipos = 2 repetidos");
let r = E.enviarCanje(G, "prueba-banco", { email: "repe@alumno.es", recompensa: E.etiqueta(G, REPES) });
contiene(r.estado, "Denegado", "🔴 con 2 repetidos se deniega");
contiene(r.estado, "2", "y dice cuántos tiene");
igual(cuantos(ficha(G, "repe@alumno.es")), 4, "no entrega carta");

// con 3, sí
darCromo(G, "repe@alumno.es", "P3_sylla");
darCromo(G, "repe@alumno.es", "P3_sylla");
igual(ficha(G, "repe@alumno.es").repes_disponibles, 3, "ahora hay 3 repetidos");
const creditosAntes = ficha(G, "repe@alumno.es").creditos;
r = E.enviarCanje(G, "prueba-banco", { email: "repe@alumno.es", recompensa: E.etiqueta(G, REPES) });
igual(r.estado, "Concedido", "🔴 con 3 repetidos se concede (aunque cueste 0 ◈: la puerta del saldo se salta)");
f = ficha(G, "repe@alumno.es");
igual(f.creditos, creditosAntes, "🔴 y NO cuesta créditos");
igual(cuantos(f), 7, "entrega una carta (6 que tenía + 1)");
igual(f.repes_gastados, 3, "y se apuntan los 3 repetidos gastados");
igual(f.repes_disponibles, ((7 - Object.keys(f.cromos).length) - 3), "los disponibles descuentan lo gastado");

// con 6 repetidos caben dos canjes, no tres
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "seis@alumno.es", { profe: "Mr Cuarter" });
["P1_bran", "P1_bran", "P1_bran", "P1_bran", "P2_tomas", "P2_tomas", "P2_tomas", "P2_tomas"]
  .forEach(k => darCromo(G, "seis@alumno.es", k));
igual(ficha(G, "seis@alumno.es").repes_disponibles, 6, "ocho cartas de dos tipos = 6 repetidos");
const et = E.etiqueta(G, REPES);
igual(E.enviarCanje(G, "prueba-banco", { email: "seis@alumno.es", recompensa: et }).estado, "Concedido", "primer canje: sí");
const r2 = E.enviarCanje(G, "prueba-banco", { email: "seis@alumno.es", recompensa: et });
igual(r2.estado, "Concedido", "segundo canje: sí");
const r3 = E.enviarCanje(G, "prueba-banco", { email: "seis@alumno.es", recompensa: et });
contiene(r3.estado, "Denegado", "🔴 tercero no: los repetidos se gastan de verdad");

// ---------------------------------------------------------------- b) insignias por serie completa
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "serie@alumno.es", { profe: "Mr Cuarter" });
const nMision = ficha(G, "serie@alumno.es").n;

// la Serie III son tres cartas: con dos no basta
["E1_nebula", "E2_capitan"].forEach(k => darCromo(G, "serie@alumno.es", k));
f = ficha(G, "serie@alumno.es");
igual(f.insignias_album, [], "con 5 de 6… perdón, con 2 de 3 no hay sello");
igual(f.n_album, 0, "ni cuenta");
darCromo(G, "serie@alumno.es", "N1_recluta");
f = ficha(G, "serie@alumno.es");
igual(f.insignias_album, ["A3_nave"], "🔴 completa la Serie III y aparece «La Nave al completo»");
igual(f.n_album, 1, "y se cuenta aparte");
igual(f.n, nMision, "🔴 el «/24» de la misión NO cambia: son las insignias del viaje, no del álbum");
c(f.insignias.indexOf("A3_nave") < 0, "🔴 y la del álbum no se cuela entre las 24");

// la Serie IV también son tres
["S2_estatica", "E3_vaeon", "S1_ander"].forEach(k => darCromo(G, "serie@alumno.es", k));
f = ficha(G, "serie@alumno.es");
igual(f.insignias_album.sort(), ["A3_nave", "A4_sombra"], "dos series completas, dos sellos");
igual(f.n, nMision, "y el «/24» sigue intacto");

// las cuatro series existen y son las del catálogo
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "todo@alumno.es", { profe: "Mr Cuarter" });
G.CROMOS.forEach(cr => darCromo(G, "todo@alumno.es", cr[0]));
f = ficha(G, "todo@alumno.es");
igual(f.insignias_album.sort(), ["A1_tripulacion", "A2_ecos", "A3_nave", "A4_sombra"],
  "🔴 el álbum entero da las cuatro insignias de serie");
igual(f.n_album, 4, "cuatro");
igual(f.repes_disponibles, 0, "y sin repetidos, no hay nada que cambiar");

// ---------------------------------------------------------------- c) racha de semanas del PER
// Los eventos se escriben a mano con su fecha: así la prueba es determinista.
G = E.nuevoMundo();
E.crearPERDemo(G);                                   // semana 1 = hace 15 semanas -> hoy es la 16
const o = G.perObj_(G.perFila_("prueba-banco").v);
igual(G.semanaDe_(o), 16, "el PER va por la semana 16");
const retos = G.retosDe_("REGULAR");
function evento(email, semana, i) {
  const d = new Date(o.inicio + "T00:00:00");
  d.setDate(d.getDate() + (semana - 1) * 7 + 1);      // martes de esa semana
  const x = retos[i % retos.length];
  G.hoja_(G.H.EV).appendRow([d, "prueba-banco", email, email.split("@")[0], x[0], x[1], x[4], x[3], "formulario"]);
}
[16, 15, 14].forEach((s, i) => evento("seguido@alumno.es", s, i));
[16, 14, 13].forEach((s, i) => evento("hueco@alumno.es", s, i));
[15, 14].forEach((s, i) => evento("lunes@alumno.es", s, i));
evento("nuevo@alumno.es", 16, 0);

const t = G.tablero_("prueba-banco", true);
const de = m => t.reclutas.filter(x => x.email === m)[0];
igual(de("seguido@alumno.es").racha, 3, "🔴 tres semanas seguidas = racha 3");
igual(de("hueco@alumno.es").racha, 1, "🔴 con un hueco en medio, la racha empieza de nuevo");
igual(de("lunes@alumno.es").racha, 2,
  "🔴 sin actividad ESTA semana pero sí la pasada, la racha se conserva (no se rompe un lunes)");
igual(de("nuevo@alumno.es").racha, 1, "quien empieza hoy tiene racha 1");

// una racha larga de verdad
[16, 15, 14, 13, 12, 11].forEach((s, i) => evento("fiel@alumno.es", s, i));
igual(G.tablero_("prueba-banco", true).reclutas.filter(x => x.email === "fiel@alumno.es")[0].racha, 6,
  "seis semanas seguidas se cuentan enteras");

// y la racha viaja también en el tablero PÚBLICO (es lo que pinta el chip 🔥)
const pub = G.tablero_("prueba-banco", false).reclutas.filter(x => x.alias === "seguido")[0];
igual(pub.racha, 3, "la racha es pública");
igual(pub.repes_disponibles != null, true, "y los repetidos disponibles también (la Nave los pinta)");
igual(pub.email, undefined, "sin destapar el correo, claro");

E.resumen("Repetidos, series completas y racha");
