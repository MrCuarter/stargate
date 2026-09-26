'use strict';
/**
 * BATERÍA 112 · LA RUTA DE LA ESTÁTICA Y LA SALA DE JORAN (27-sep · borrador, rama sin publicar)
 *
 * Norberto: «vamos a dejar estos simuladores como parte de las misiones. Al terminar cada tema los estudiantes juegan en
 * directo o diferido para llegar al otro planeta… Mete el simulador al final de las sesiones en directo y diferido
 * (docente y alumno): la primera después de la presentación, después de cada tema y al final de la última sesión». Y el
 * Simulador de Joran, «una serie de minijuegos… arcade puro y duro».
 *
 * Se leen los datos, el código y los ficheros de los juegos. 🔴 La comprobación que más importa: el banco de preguntas
 * NO está en la web (el repositorio es público).
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };
const SES = L("assets/js/sesion.js"), NAVE = L("assets/js/recluta.js"), SH = L("sesion.html"), RH = L("recluta.html"), SD = L("_site_data.py");
const global = (html, k) => { const i = html.indexOf("window." + k + "="); if (i < 0) return null;
  let j = i + k.length + 8, d = 0, s = false, q = ""; for (; j < html.length; j++) { const ch = html[j];
    if (s) { if (ch === "\\") { j++; continue; } if (ch === q) s = false; continue; }
    if (ch === '"' || ch === "'") { s = true; q = ch; continue; } if (ch === "{" || ch === "[") d++; if (ch === "}" || ch === "]") { d--; if (!d) break; } }
  return JSON.parse(html.slice(i + k.length + 8, j + 1)); };

console.log("\n  1 · los datos (un dato, un sitio)");
const RU = global(SH, "SG_RUTA") || {};
c((RU.misiones || []).length === 10, "🔴 diez misiones: la salida, una por tema y Vaeon", (RU.misiones || []).length);
c(RU.misiones && RU.misiones.map((m) => m.id).join() === "m0,m1,m2,m3,m4,m5,m6,m7,m8,m9", "   m0…m9, en orden");
c(RU.misiones && RU.misiones.slice(1, 9).every((m, i) => m.tema === i + 1), "   la misión N es la del tema N (m1…m8)");
c(RU.misiones && RU.misiones[9].final === true && RU.misiones[0].tema === 0, "   la 0 es de la asignatura y la 9 es la final");
c(RU.premios && ["bronce", "plata", "oro"].every((k) => Array.isArray(RU.premios[k]) && RU.premios[k].length === 2), "   premios por escalón [xp, créditos]");
c(JSON.stringify(global(RH, "SG_RUTA")) === JSON.stringify(RU), "   la Nave recibe la misma Ruta que la sesión");
const datos = L("juegos/ruta/datos.js");
c(/GENERADO por _build_site\.py/.test(datos) && datos.includes('"titulo": "La tormenta de chatarra"'), "🔴 el juego lee lo que se cuenta de datos.js, que escribe el build desde _site_data.py");
c(/import\('\.\/datos\.js'\)/.test(L("juegos/ruta/juego.js")), "   y el juego lo importa (con plan B para el borrador)");
const SJ = global(SH, "SG_SALA_JORAN") || {};
c((SJ.maquinas || []).length === 3 && SJ.maquinas[0][3] === null && SJ.maquinas[1][3][0] === "evacuacion", "   la sala: tres máquinas; la primera, abierta; la segunda, con una marca de la primera");

console.log("\n  2 · 🔴 el banco NO está en la web");
const PQ = L("juegos/ruta/preguntas.js");
c(!/"id":\s*"t[1-8]-/.test(PQ), "🔴 ni una pregunta de los temas en juegos/ruta/preguntas.js (el repositorio es público)");
c(/"id":\s*"t0-/.test(PQ), "   solo las de la asignatura (misión 0), que son información pública");
const todo = [];
(function recorrer(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) recorrer(p); else if (/\.(js|json|html)$/.test(f)) todo.push(p); } })(path.join(R, "juegos"));
const bancoEnLaWeb = todo.filter((p) => /"correctas"/.test(fs.readFileSync(p, "utf8")) && /"id":\s*"t[1-8]-/.test(fs.readFileSync(p, "utf8")));
c(!bancoEnLaWeb.length, "🔴 y en ningún otro fichero de juegos/", bancoEnLaWeb.join(", "));

console.log("\n  3 · en la sesión (directo y diferido, docente y recluta)");
c(/function diaRuta\(id\)/.test(SES) && /iframe class="ru-juego"/.test(SES), "🔴 la diapositiva de la Ruta lleva la misión embebida (se juega ahí)");
c(/if\(ultimaDelTema\(L, iS\) && temaDe\(s\)>=1 && temaDe\(s\)<=8\)\{ var ru=diaRuta\('m'\+temaDe\(s\)\)/.test(SES), "🔴 al cerrar el tema N, la misión N");
c(/if\(iS===L\.length-1\)\{ var rv=diaRuta\('m9'\)/.test(SES), "🔴 y en la última clase, Vaeon");
const iRu = SES.indexOf("var ru=diaRuta("), iTf = SES.indexOf("if(tf) ci.push(tf);");
c(iRu > 0 && iTf > iRu, "   antes del ticket: el ticket sigue siendo lo último de la clase que cierra tema");
const EMB = global(SH, "SG_EMBARQUE") || [];
const iR = EMB.findIndex((x) => x[0] === "ruta"), iH = EMB.findIndex((x) => x[0] === "hasta");
c(iR >= 0 && EMB[iR][1] === "m0" && iR < iH, "🔴 en la presentación, el primer vuelo (m0), antes de «Nos vemos en Fôrge»");
c(/else if\(pieza==='ruta'\) add\(diaRuta\(arg\)\)/.test(SES), "   y la presentación sabe montarla");
c(!/'ruta'/.test((SES.match(/SOLO_EN_DIRECTO = \[[^\]]*\]/) || [""])[0]) && !/'ruta'/.test((SES.match(/FUERA_DIFERIDO=\[[^\]]*\]/) || [""])[0]), "   no se quita ni en diferido ni al recluta: es de todos");
const SECS = global(SH, "SG_SECCIONES_SESION") || [];
c(SECS.some((x) => x[0] === "ruta") && /ruta:'ruta'/.test(SES), "   es una sección de la sesión (se puede quitar en «Configurar la sesión»)");
c(fs.existsSync(path.join(R, "assets/img/sesion/ruta.jpg")), "   con su miniatura");

console.log("\n  4 · en la Nave");
c(/function rutaCaja\(\)/.test(NAVE) && /\+rutaCaja\(\)/.test(NAVE), "🔴 la Nave enseña las diez misiones");
c(/function semanaDeMision\(m, L\)/.test(NAVE) && /if\(m\.id==='m0'\) return 1;/.test(NAVE) && /if\(m\.final\) return L\.length;/.test(NAVE), "   cada una se abre cuando se cierra su tema (la 0, en la semana 1; Vaeon, en la última)");
c(/Semana '\+sem\+'/.test(NAVE), "   las que faltan dicen en qué semana llegan");
c(/La sala de Joran/.test(NAVE) && /SJ\.juego \+ '\?per='/.test(NAVE), "🔴 el Simulador de Joran es su sala de juegos, con su capítulo");

console.log("\n  5 · los juegos");
for (const f of ["juegos/ruta/index.html", "juegos/ruta/juego.js", "juegos/ruta/servidor-local.js", "juegos/joran/index.html", "juegos/joran/evacuacion.js", "juegos/joran/laberinto.js", "juegos/joran/ruta-azul.js", "juegos/joran/comun.js"])
  c(fs.existsSync(path.join(R, f)), "   " + f);
const MOD = ["nave", "nebula", "vaeon", "forge"].map((m) => "juegos/ruta/modelos/" + m + ".glb");
c(MOD.every((f) => fs.existsSync(path.join(R, f))), "   los cuatro modelos de Magnific (nave, NEBULA, Vaeon, Fôrge)");
c(fs.existsSync(path.join(R, "juegos/joran/modelos/LICENCIAS.txt")), "   las licencias de lo que no es nuestro (CC0 de Quaternius, dominio público de la NASA)");
const J = L("juegos/ruta/juego.js");
c(/TOPE_MS = 4 \* 60 \* 1000/.test(J) && /S\.t > 210/.test(L("juegos/joran/ruta-azul.js")) && /DURACION = 180/.test(L("juegos/joran/evacuacion.js")), "🔴 ninguna partida pasa de 3-4 minutos (Norberto: «breve, pero intenso»)");
c(/SABER/.test(J) && /PERICIA/.test(J), "   la Ruta puntúa por separado saber y pericia");
const sinComentarios = (t) => t.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).map((l) => l.replace(/\s\/\/ .*$/, "")).join("\n");
c(!/[\u{1F300}-\u{1FAFF}]/u.test(sinComentarios(J + L("juegos/joran/comun.js") + L("juegos/joran/index.html") + L("juegos/joran/evacuacion.js") + L("juegos/joran/laberinto.js") + L("juegos/joran/ruta-azul.js"))), "   sin emojis en lo que se ve (los 🔴 de los comentarios son la marca de la casa)");

console.log("\n  Batería 112 · la Ruta de la Estática y la sala de Joran (borrador)\n  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
