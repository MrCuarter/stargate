'use strict';
/**
 * BATERÍA 73 · LAS SEMANAS DEL CURSO, CON PAUSAS (13-sep-2026).
 *
 * Norberto: «en Navidad se retrasa una semana, o Semana Santa… una página dedicada que se vea el
 * calendario con posibilidad de mover o congelar una semana». La cuenta de «en qué semana estamos»
 * vivía COPIADA en seis ficheros; ahora vive en `motor/semanas.js` y esta batería vigila:
 *   · que la receta hace lo que dice (pausas, cambio de hora, rejilla);
 *   · que no queda ninguna copia de la cuenta vieja por ahí (un día diría otra semana);
 *   · que toda página que calcula semanas carga la receta ANTES que nada;
 *   · que el paquete (crear el grupo / guardar el calendario) mueve lo que tiene que mover.
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const S = require("../motor/semanas.js");
const P = require("../motor/paquete.js");
const T = require("../motor/tablero.js");
const cat = JSON.parse(leer("motor/catalogo.json"));

// 1 · la receta
const INI = "2026-09-07";   // lunes
c(S.semanaDelCurso(INI, [], "2026-09-07") === 1, "el primer día es la semana 1");
c(S.semanaDelCurso(INI, [], "2026-09-13") === 1, "el domingo sigue siendo la 1");
c(S.semanaDelCurso(INI, [], "2026-09-14") === 2, "el lunes siguiente, la 2");
c(S.semanaDelCurso(INI, [], "2026-09-06") === 0, "el día antes de empezar, la 0 (antes)");
c(S.semanaDelCurso("", [], "2026-09-06") === null, "sin fecha de inicio, null");
c(S.semanaDelCurso(INI, ["2026-09-14"], "2026-09-15") === 1, "🔴 dentro de una semana congelada, el curso sigue en la de antes");
c(S.semanaDelCurso(INI, ["2026-09-14"], "2026-09-21") === 2, "🔴 y después, todo va una semana por detrás");
c(S.semanaDelCurso(INI, ["2026-12-21"], "2026-11-16") === 11, "una pausa FUTURA no cambia la semana de hoy");
c(S.pausaDe(INI, ["2026-09-14"], "2026-09-16") === "2026-09-14" && S.pausaDe(INI, ["2026-09-14"], "2026-09-22") === "",
  "sabe si hoy es una semana congelada");
c(S.inicioDeSemana(INI, 3, ["2026-09-14"]) === "2026-09-28", "la semana 3 empieza una semana más tarde si hay una pausa antes");
c(S.inicioDeSemana(INI, 3, ["2026-09-14", "2026-09-21"]) === "2026-10-05", "y dos más tarde con dos pausas seguidas");
c(S.finDeSemana(INI, 15, []) === "2026-12-20", "la semana 15 acaba el domingo 20 de diciembre");
c(S.limpias(INI, ["2026-09-16", "2026-09-14", "2026-09-14", "2026-08-31", "basura"]).join() === "2026-09-14",
  "🔴 solo valen pausas sobre la rejilla del curso, desde la semana 1, sin repetir", JSON.stringify(S.limpias(INI, ["2026-09-16", "2026-09-14", "2026-09-14", "2026-08-31", "basura"])));
const cal = S.calendario(INI, ["2026-12-21", "2026-12-28"], 15, 1);
c(cal.length === 18 && cal.filter(x => x.congelada).length === 2 && cal[cal.length - 1].canje && cal[cal.length - 1].inicio === "2027-01-04",
  "el calendario: 15 semanas, 2 congeladas y la de canje detrás", JSON.stringify(cal.slice(-3)));
// 🔴 el cambio de hora de marzo: la cuenta vieja daba la semana ANTERIOR todo el lunes
const vieja = (ini, dia) => Math.floor((new Date(dia + "T00:00:00") - new Date(ini + "T00:00:00")) / 6048e5) + 1;
c(S.semanaDelCurso("2027-02-01", [], "2027-03-29") === 9, "🔴 el lunes después del cambio de hora de marzo es la semana 9 (no la 8)",
  "nueva " + S.semanaDelCurso("2027-02-01", [], "2027-03-29") + " · vieja " + vieja("2027-02-01", "2027-03-29"));
// y en todos los días de un curso entero, la receta nueva y la vieja coinciden salvo ese error
let dist = 0;
for (let i = 0; i < 400; i++) {
  const d = S.masDias("2026-09-07", i), a = S.semanaDelCurso("2026-09-07", [], d), b = vieja("2026-09-07", d);
  if (a !== b && !(new Date(d + "T00:00:00").getDay() === 1 && a === b + 1)) dist++;
}
c(dist === 0, "sin pausas, la receta nueva dice lo mismo que la vieja (salvo el lunes del cambio de hora)", dist + " días distintos");

// 2 · ninguna copia de la cuenta vieja
const JS = ["assets/js/calendario.js", "assets/js/fuente.js", "assets/js/motor.js", "assets/js/foro.js", "assets/js/grupos.js",
            "assets/js/panel.js", "assets/js/sesion.js", "assets/js/recluta.js", "assets/js/consola.js", "assets/js/aula.js",
            "motor/tablero.js", "motor/paquete.js"];
JS.forEach(f => {
  const t = leer(f).replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  c(!/\/\s*\(\s*7\s*\*\s*864e5\s*\)|\/\s*SEMANA_MS_?\b|\/\s*6048e5/.test(t), "🔴 " + f + " no cuenta semanas por su cuenta (usa motor/semanas.js)");
});

// 3 · toda página que calcula semanas carga la receta, y ANTES que nada
fs.readdirSync(RAIZ).filter(f => /\.html$/.test(f)).forEach(f => {
  const h = leer(f);
  const usa = ["assets/js/calendario.js", "assets/js/fuente.js", "motor/paquete.js", "motor/tablero.js", "assets/js/motor.js"].some(u => h.indexOf(u) >= 0);
  if (!usa) return;
  const i = h.indexOf('<script src="motor/semanas.js'), primero = h.indexOf("<script");
  c(i >= 0 && i === primero, "🔴 " + f + " carga motor/semanas.js el primero", "en " + i + " · primer script en " + primero);
  c(h.indexOf('motor/semanas.js?v=') >= 0 && !/motor\/semanas\.js[^"]*"\s+defer/.test(h), "   y con su huella, sin «defer»");
});

// 4 · el paquete: lo que se mueve al congelar
const per = { id: "g", nombre: "g", tipo: "REGULAR", inicio: INI, docentes: [] };
const sin = P.paquete(per, cat), con = P.paquete(Object.assign({}, per, { pausas: ["2026-10-12"] }), cat);
const ms = d => new Date(d + "T00:00:00").getTime();
c(con.proyecto.stargate.cierre === S.masDias(sin.proyecto.stargate.cierre, 7), "🔴 una pausa a mitad de curso retrasa una semana el cierre de retos",
  sin.proyecto.stargate.cierre + " → " + con.proyecto.stargate.cierre);
c(con.proyecto.stargate.cierreCanje === S.masDias(sin.proyecto.stargate.cierreCanje, 7), "   y el del canje");
c(JSON.stringify(con.proyecto.stargate.pausas) === '["2026-10-12"]', "   y el grupo guarda sus pausas");
const recS = r => sin.recompensas.filter(x => x.id === r)[0], recC = r => con.recompensas.filter(x => x.id === r)[0];
const antes = sin.recompensas.filter(r => r.inStore !== false && r.availableFrom < ms("2026-10-12"));
const despues = sin.recompensas.filter(r => r.inStore !== false && r.availableFrom >= ms("2026-10-12"));
c(antes.length > 0 && antes.every(r => recC(r.id).availableFrom === r.availableFrom), "lo del Mercado de antes de la pausa no se mueve");
c(despues.length > 0 && despues.every(r => recC(r.id).availableFrom === ms(S.masDias(S.iso(r.availableFrom), 7))),
  "🔴 lo de después de la pausa se abre una semana más tarde", despues.map(r => r.id).join(","));
c(con.campanas.filter(x => x.visibleFromTimestamp).every(x => {
  const v = sin.campanas.filter(y => y.id === x.id)[0].visibleFromTimestamp;
  return v < ms("2026-10-12") ? x.visibleFromTimestamp === v : x.visibleFromTimestamp === ms(S.masDias(S.iso(v), 7));
}), "y los planetas igual");
const tras = P.paquete(Object.assign({}, per, { pausas: ["2026-12-21"] }), cat);
c(tras.proyecto.stargate.cierre === sin.proyecto.stargate.cierre && tras.proyecto.stargate.cierreCanje === S.masDias(sin.proyecto.stargate.cierreCanje, 7),
  "una pausa en la semana de canje solo alarga el canje");

// 5 · el tablero lleva las pausas y los capítulos abiertos a todas las pantallas
const datos = { proyecto: { id: "g", name: "g", stargate: { version: 1, tipo: "REGULAR", inicio: INI, pausas: ["2026-09-14"], capitulosAbiertos: { c5: true } } },
                misiones: [], campanas: [], recompensas: [], perfiles: [], catalogo: cat };
const tb = T.tablero(datos, false, new Date("2026-09-16T10:00:00").getTime());
c(tb.semana === 1 && tb.pausa === "2026-09-14", "🔴 el tablero dice semana 1 y «pausa» dentro de la semana congelada", tb.semana + " · " + tb.pausa);
c(JSON.stringify(tb.pausas) === '["2026-09-14"]' && tb.capitulosAbiertos.c5 === true, "y lleva las pausas y los capítulos abiertos a la Nave");

// 6 · la consola: el calendario, solo para quien lleva el grupo; y Ajustes ya no mueve la fecha a medias
const K = leer("assets/js/consola.js");
c(/\["calendario", "Calendario", 1\]/.test(K), "la consola tiene la pestaña «Calendario» (solo referente)");
c(/function verCalendario\(t\)/.test(K) && /MOTOR\.guardarCalendario\(/.test(K), "   que guarda con guardarCalendario (todo en una escritura)");
const aj = K.slice(K.indexOf("function verAjustes"), K.indexOf("function verAjustes") + 6000);
c(!/"stargate\.inicio"/.test(aj), "🔴 «Ajustes» ya no cambia la semana 1 sin mover el Mercado ni los planetas");
const M = leer("assets/js/motor.js");
c(/async function guardarCalendario\(perId, publico, escribir\)[\s\S]{0,400}writeBatch\(db\)[\s\S]{0,400}lote\.commit\(\)/.test(M), "guardarCalendario escribe en un solo lote");

module.exports = { nombre: "Las semanas del curso, con pausas", ok, fallos };
if (require.main === module) {
  console.log("\n  Batería 73 · las semanas del curso, con pausas");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
}
