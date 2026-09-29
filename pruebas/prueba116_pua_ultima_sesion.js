'use strict';
/**
 * BATERÍA 116 · EN PUA, LA BATALLA FINAL EN LA ÚLTIMA SESIÓN (29-sep)
 *
 * Un PUA no tiene examen (la evaluación continua es el 100 %) y su vista de 8 semanas agrupa las 15 por tema: la semana del
 * repaso (la 15, sin tema) se caía entera, con el reto de 90 minutos, su hito y su mensaje del foro. Norberto: «PUA, la
 * última sesión». Se EJECUTA la vista (calendario.js) con las semanas que monta el build, en PUA y en REGULAR.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const H = L("sesion.html"), i = H.indexOf("window.SG_SEMANAS="), j = H.indexOf(";window.", i);
const SEM = JSON.parse(H.slice(i + "window.SG_SEMANAS=".length, j));
const w = {}; new Function("window", L("assets/js/calendario.js"))(w);
const PUA = w.SGCAL.vista("PUA", SEM), REG = w.SGCAL.vista("REGULAR", SEM), u = PUA[PUA.length - 1];
const titulos = u.videos.map(v => v[0].titulo).join(" | "), ultimoForo = String(u.foro).split("— · —").pop();

c(PUA.length === 8, "   el PUA sigue teniendo 8 sesiones", PUA.length);
c(/La batalla final/.test(u.lanza.join(" ")), "🔴 la última sesión del PUA lanza «La batalla final»", u.lanza.join(" | "));
c(!/simulacro del examen/i.test(u.lanza.join(" ") + u.hito), "   y no habla de un simulacro del examen (en PUA no hay examen)");
c(!/Plan de Ataque/.test(titulos), "🔴 sin «El Plan de Ataque» (explica el examen)", titulos);
c(/desenlace/i.test(titulos) && /Fragmento 9/.test(titulos), "   con el desenlace y el Fragmento 9 (la sesión no los proyecta: se abren en la Nave al acabar)");
c(/La batalla final contra la Estática/.test(u.hito), "   su hito", u.hito);
c(/batalla final/.test(ultimoForo) && /no hay examen/.test(ultimoForo) && !/simulacro/i.test(ultimoForo), "🔴 y su mensaje del foro, sin simulacro");
c(/Liminar/.test(u.tema) && u.tema_n === 8, "   sigue siendo la sesión del tema 8 (Liminar)");
c(REG.length === 15 && /simulacro del examen/.test(REG[14].lanza.join(" ")) && /Plan de Ataque/.test(REG[14].videos.map(v => v[0].titulo).join(" ")),
  "🔴 el REGULAR, intacto: su semana 15 con el simulacro y el Plan de Ataque");
c(/\(RET\.PUA\|\|\[\]\)\.forEach/.test(L("assets/js/sesion.js")), "   la sesión reconoce el reto por su nombre del PUA («La batalla final» es el XS)");

console.log("\n  Batería 116 · en PUA, la batalla final en la última sesión");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
