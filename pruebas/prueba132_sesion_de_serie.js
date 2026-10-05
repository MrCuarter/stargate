'use strict';
/**
 * BATERÍA 132 · LO QUE SALE DE SERIE EN LA SESIÓN (5-oct)
 * Norberto: «elimina por defecto la diapositiva de la cuenta de estudiante fantasma… quizá no es necesario mostrar el ranking
 * todas las sesiones, o quién ha hecho los retos… mostrar por defecto esa información cuando empecemos un tema nuevo. No quiero
 * borrarlas, solo desactivar algunas por defecto». Se EJECUTA SG.seccionesApagadas con las secciones de verdad.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };

const H = L("sesion.html"), SG = L("assets/js/stargate.js"), SES = L("assets/js/sesion.js");
const SECC = JSON.parse(H.match(/window\.SG_SECCIONES_SESION=(\[.*?\]);/s)[1]);
const fn = SG.match(/window\.SG\.seccionesApagadas = (function \(guardadas, empiezaTema\) \{[\s\S]*?\n\};)/)[1];
const window = { SG_SECCIONES_SESION: SECC };
const apag = new Function("window", "return " + fn.replace(/;$/, ""))(window);
const modo = (k) => (SECC.find((x) => x[0] === k) || [])[3];

c(modo("naveejemplo") === "off" && /simulacro:'naveejemplo'/.test(SES), "🔴 la Nave de ejemplo (el recluta de mentira) es su propia sección y va apagada de serie");
c(["repaso", "clasificacion", "coleccion", "simulador"].every((k) => modo(k) === "tema"), "🔴 el ranking, quién hizo los retos, coleccionistas y la sala de Joran: solo en la primera clase de cada tema");
c(modo("mensaje") === "off" && modo("oferta") === "tema", "🔴 y, con su sí: el mensaje de la semana apagado y la oferta solo al empezar tema");
c(SECC.filter((x) => x[3]).length === 7, "   y nada más va de serie (lo demás sale como siempre)", SECC.filter((x) => x[3]).map((x) => x[0]));

const sin = apag([], false), sinTema = apag([], true);
c(sin.includes("naveejemplo") && sin.includes("clasificacion") && sin.includes("repaso") && !sin.includes("portada"), "   sin tocar nada, en una clase a mitad de tema: fuera la Nave de ejemplo, el ranking y el repaso", sin);
c(!sinTema.includes("clasificacion") && sinTema.includes("naveejemplo"), "   y en la primera clase de un tema, el ranking sí (la Nave de ejemplo, no)", sinTema);
c(apag(["+naveejemplo"], false).indexOf("naveejemplo") < 0, "   quien enciende la Nave de ejemplo («+naveejemplo») la tiene");
c(apag(["+clasificacion"], false).indexOf("clasificacion") < 0, "   quien quiere el ranking en todas las clases («+clasificacion») lo tiene siempre");
c(apag(["clasificacion"], true).includes("clasificacion"), "   lo que quita el docente no sale nunca, ni al empezar tema");
c(apag(["oferta"], false).includes("oferta") && apag(["oferta"], false).includes("naveejemplo"), "   las listas guardadas antes (sin «+») siguen valiendo, con lo de serie encima");

c(/function empiezaTema\(s\)\{[\s\S]{0,200}Number\(prev\.tema_n\)!==Number\(s\.tema_n\)/.test(SES) && (SES.match(/var off=apagadasEn\(s\);/g) || []).length === 2,
  "   la sesión mira si la clase abre tema (cambia el número de tema respecto a la semana anterior), en sus dos montajes");
const sem = JSON.parse(H.match(/window\.SG_SEMANAS=(\[.*?\]);/s)[1]);
const abre = sem.filter((s, i) => !i || sem[i - 1].tema_n !== s.tema_n).length;
c(abre >= 8 && abre <= 10, "   con el calendario de verdad, el ranking sale en " + abre + " de " + sem.length + " clases (antes, en todas)");
c(/if \(modo === "off"\) \{ if \(x\.checked\) off\.push\("\+" \+ k\); return; \}/.test(SG) && /data-todas=/.test(SG), "   la rueda: marcar una apagada la enciende; «en todas» pone una de tema en todas las clases");

console.log("\n  Batería 132 · lo que sale de serie en la sesión");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
