'use strict';
/**
 * BATERÍA 129 · LA NOTA, CON UN EJEMPLO, EN UNA RUEDA (5-oct)
 *
 * Norberto: «al explicar cómo será la nota del estudiante, que hubiera una gráfica circular que se llene con cada nota hasta
 * llegar al 100 %… acompáñalo de un ejemplo real: si sacas un 4 en esta actividad, un 3 en esta, haces x tests y en el examen
 * tienes un 9, tu nota sería…». En la presentación de la asignatura, justo después de «Lo que cuenta para tu nota».
 * Ninguna cifra a mano: los pesos salen de ACTIVIDADES, EVALUACION y NOTA_FINAL; aquí se rehace la cuenta por otro camino.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };
const global = (html, nombre) => { const m = html.match(new RegExp("window\\." + nombre + "=([\\s\\S]*?);window\\.")); return m ? vm.runInNewContext("(" + m[1] + ")") : null; };

const SESH = L("sesion.html"), SES = L("assets/js/sesion.js"), DS = L("_site_data.py"), CSS = L("assets/css/stargate.css"), EC = L("en-claro.html");
const EMB = global(SESH, "SG_EMBARQUE") || [], NX = global(SESH, "SG_NOTA_EJEMPLO") || {}, NF = global(SESH, "SG_NOTA_FINAL"), ACT = global(SESH, "SG_ACTIVIDADES") || [];
const num = x => Number(String(x).replace(",", "."));

console.log("  Dónde sale");
const piezas = EMB.map(x => x[0]);
c(piezas.indexOf("nota_ejemplo") === piezas.indexOf("nota") + 1, "en la presentación, justo después de «Lo que cuenta para tu nota»", piezas.join(","));
c(/pieza==='nota_ejemplo'\) add\(diaNotaEjemplo\(\)\)/.test(SES) && /k:'embarque_nota_ej'/.test(SES), "sesion.js la construye");
c(/frag:N\+1, montar:montarNotaEjemplo/.test(SES), "se llena con → (una parte por pulsación) y el número del centro cuenta solo");
c(/MutationObserver\(calc\)/.test(SES) && /return function\(\)\{ ob\.disconnect\(\)/.test(SES), "   el contador se apaga al salir de la diapositiva");

console.log("  🔴 La cuenta, rehecha aquí");
const E = { actividades: [4, 3], tests: 6, asistencias: 2, examen: 9 };
c(/NOTA_EJEMPLO = \{"actividades": \[4, 3\], "tests": 6, "asistencias": 2, "examen": 9\}/.test(DS), "el ejemplo de Norberto: un 4 y un 3, 6 tests, 2 clases y un 9 en el examen");
const contR = E.actividades[0] + E.actividades[1] + E.tests * 0.1 + E.asistencias * 0.2;
const finR = contR * NF.continua / 100 + E.examen * NF.examen / 100;
const G = NX.REGULAR || {}, P = NX.PUA || {};
c(Math.abs(G.continua - contR) < 0.005 && Math.abs(G.total - finR) < 0.005, "REGULAR: continua " + contR.toFixed(2) + " y final " + finR.toFixed(2), G.continua + " / " + G.total);
c(Math.abs((G.filas || []).reduce((a, f) => a + f.max, 0) - 10) < 1e-6, "   las partes de la rueda suman 10 (el 100 %)");
c((G.filas || []).length === ACT.length + 3 && G.filas[G.filas.length - 1].c === "exa" && Math.abs(G.filas[G.filas.length - 1].max - 10 * NF.examen / 100) < 1e-6, "   el examen ocupa su " + NF.examen + " %");
c(Math.abs(P.total - contR) < 0.005 && !(P.filas || []).some(f => f.c === "exa"), "PUA: sin examen, la continua es toda la nota", P.total);
const ep = ACT.reduce((a, x) => a + num(x.puntos) * 0.2, 0);
c(Math.abs(G.perdidoEP - ep * NF.continua / 100) < 0.005 && Math.abs(G.sinEP - (G.total - G.perdidoEP)) < 0.005, "«¿Y sin portfolio?»: el 20 % de cada actividad (" + (ep * NF.continua / 100).toFixed(2) + " de la final)");
c(EC.indexOf(String(G.perdidoEP).replace(".", ",")) >= 0, "   la misma cifra que «En claro» le dio a Adriana");

console.log("  Que se lea en un proyector");
c(/\.nx-tot\{[^}]*font-size:clamp\(2\.4rem/.test(CSS) && /\.nx-f\.on\{stroke-dasharray:var\(--l\) 600\}/.test(CSS), "número grande en el centro y cada parte se dibuja al llegar");
c(/prefers-reduced-motion:reduce\)\{\.nx-f/.test(CSS) && /@media \(max-width:760px\)\{\.nx\{/.test(CSS), "   sin animación para quien la quita; en una columna en el móvil");

console.log("\n  Batería 129 · La nota, con un ejemplo");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
