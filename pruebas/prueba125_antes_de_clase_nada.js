'use strict';
/**
 * BATERÍA 125 · ANTES DE CLASE, EN PRINCIPIO NADA (3-oct)
 *
 * Norberto, con la pregunta «¿Qué te toca antes de clase?» de la Academia en pantalla (la buena era «Copiar al foro el
 * mensaje de la semana»): «la respuesta correcta debería ser "En principio, nada…". Antes de clase los docentes no tienen
 * que hacer NADA, está todo montado. Aunque estaría genial que echasen un vistazo a la sesión de la semana, enlazasen su
 * Genially si quieren y escojan las diapositivas que quieren mostrar». El mensaje del foro le sale solo al alumnado en su
 * Nave: copiarlo a la UNIR es opcional. Lo mismo en todos los sitios que lo contaban.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const D = L("_site_data.py"), B = L("_build_site.py"), P = L("assets/js/prestreno.js"), G = L("../GUIA_PROFES_PDF.md");

const q = (D.match(/\{"p": "¿Qué te toca antes de clase\?", "o": \[([^\]]*)\], "ok": (\d)/) || []);
const ops = q[1] ? JSON.parse("[" + q[1] + "]") : [];
c(ops[Number(q[2])] === "En principio, nada: está todo montado", "🔴 Academia · «¿Qué te toca antes de clase?»: la buena es «En principio, nada: está todo montado»", ops[Number(q[2])]);
c(!ops.some(o => /foro/i.test(o)), "   y copiar el mensaje al foro ya no sale como respuesta (ni buena ni falsa: es opcional)");
c(/"porque": "La sesión, su vídeo y el mensaje del foro ya están\. Lo que viene genial: echar un vistazo a la sesión de la semana, enlazar tu Genially si quieres y escoger qué diapositivas mostrar\."/.test(D),
  "   el porqué cuenta lo que viene genial: la sesión, tu Genially y qué diapositivas");
c(/"titulo": "Antes del primer día", "tema": "Lo que puedes dejar preparado \(todo es opcional\)"/.test(D) && /La sesión de cada semana <b>ya viene montada<\/b>/.test(D)
  && !/lo copias a la plataforma de la UNIR/.test(D), "🔴 Academia · la parada «Antes del primer día» (5-oct) dice lo mismo: ya viene montada, todo es opcional");
c(/cod="D2", t="Uno: un vistazo a la sesión de la semana", pose="senala", img="r7_consola\.png"/.test(D) && !/sigues con tu vida/.test(D),
  "   guía · «Si das las clases», paso 1: un vistazo a la sesión (no «copias el mensaje del foro»)");
c(/"Antes de clase, en principio nada: la sesión trae la diapositiva <b>«Únete a la clase»<\/b>/.test(B), "   guía · la primera sesión: antes, nada (el código sale en grande en la sesión)");
c(/A tu alumnado ya le sale solo en su Nave; si quieres dejarlo también en el foro de la plataforma de UNIR, <b>Copiar<\/b>/.test(B), "   visita guiada · el mensaje del foro, opcional");
c(/<b>Antes de clase<\/b><span>En principio, nada: está todo montado\. Viene genial echar un vistazo a la sesión de la semana, enlazar vuestro Genially si queréis y escoger las diapositivas que vais a mostrar\.<\/span>/.test(P)
  && /A vuestro alumnado le sale solo en su Nave; si queréis dejarlo también en el foro/.test(P), "🔴 presentación al profesorado · «Antes de clase» y el mensaje del foro, igual");
c(/- \*\*Antes de clase\*\*: en principio, nada: está todo montado\./.test(G) && /\| \*\*Cada semana\*\* \| En principio, nada\./.test(G) && !/\*\*Copiar\*\* y lo pegas en el foro/.test(G),
  "   guía en PDF · lo mismo (lo que se dice, la primera sesión, el mensaje del foro y la chuleta)");

console.log("\n  Batería 125 · antes de clase, en principio nada");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
