'use strict';
/**
 * BATERÍA 96 · PILOTO AUTOMÁTICO / MANDO MANUAL Y «HOY TOCA» (19-sep).
 *
 * Norberto: «el docente raso, modo simple o avanzado… el simple se limita a seguir lo que el referente ha creado, sin
 * complicaciones… quiero evitar que docentes nuevos se agobien y permitir a los experimentados DISFRUTAR» (por defecto,
 * todos en simple; «para tus Geniallys, para todos los grupos, sería modo avanzado») y «desarrolla más "Hoy toca",
 * más visual, con las fichas de retos completas y la info del calendario (entrega de tarea, presentación…)».
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const K = leer("assets/js/consola.js"), A = leer("assets/js/aula.js"), M = leer("assets/js/motor.js"), CSS = leer("assets/css/stargate.css"), H = leer("consola.html");

// ── 1 · el modo
c(/async function ponerModoDocente\(modo\)/.test(M) && /modo !== "piloto" && modo !== "manual"/.test(M) && /ponerModoDocente, misNotas/.test(M), "🔴 motor · el modo se guarda en la ficha del docente (solo «piloto» o «manual»)");
c(/var FICHA = null, MODO = "piloto"/.test(K) && /cargarFicha\(\)\.then\(elegirGrupo\)/.test(K), "🔴 por defecto, PILOTO AUTOMÁTICO; y el modo se lee antes de pintar nada");
c(/function selectorModo\(\)/.test(K) && /Piloto automático/.test(K) && /Mando manual/.test(K) && (K.match(/selectorModo\(\)/g) || []).length >= 2 && /'<div class="cn-ficha-b">' \+ selectorDeGrupo\(\) \+ selectorModo\(\)/.test(K), "   con su selector en tu ficha de comandante (el Puente), al lado del de grupos");
c(/body\.modo-piloto \[data-av\]\{display:none!important\}/.test(CSS), "🔴 el piloto solo OCULTA (data-av): no hay dos consolas que mantener");
const GP = "/Users/nor/Claude/vibewebs/gamificapro/firestore.rules";
if (fs.existsSync(GP)) c(/request\.resource\.data\.modo in \['piloto', 'manual'\]/.test(fs.readFileSync(GP, "utf8")), "   y las reglas del servidor admiten el modo (solo esas dos palabras)");

// ── 2 · qué oculta el piloto
// 19-sep · «Para tus Geniallys» vive en «Enlaces» y «Para todos tus grupos» en «Premios»: dos secciones que el piloto no enseña
c(/\$\("#c-cuerpo"\)\.innerHTML = paraTusGeniallys\(\) \+/.test(K) && /var comun = sec\[0\] === "premios"/.test(K) && /\["enlaces", "Enlaces", "assets\/img\/iconos\/enlace\.png", \["mios"\]\]/.test(K),
  "🔴 «Para todos tus grupos» (en Premios) y «Para tus Geniallys» (en Enlaces), solo en mando manual");
c(/class="gp-cfg" data-av/.test(K) && /id="doc-ajustes-b" data-av/.test(K), "   la rueda de la sesión y ⚙ Ajustes, también");
c(/var AV_TABS = \["zoco", "mios", "huevos", "sorteos", "ofertas"\]/.test(K) && /if \(!manual\(\) && AV_TABS\.indexOf\(x\[0\]\) >= 0\) return false;/.test(K), "🔴 en piloto, fuera las pestañas de gestión (Zoco, Mis enlaces, Premios, Sorteos, Ofertas)");
c(/manual\(\) && x\[0\] === "huevos"/.test(K) && /function premiables\(\)/.test(K), "🔴 en mando manual, el docente raso crea premios por enlace para SUS grupos (sorteos y ofertas siguen siendo del referente)");
c(/class="card pt-msg pt-plega" data-av/.test(K) && /id="pt-panel-ed" data-av/.test(K) && /data-av data-escribir=/.test(K), "   en la portada: el mensaje a tus reclutas, cambiar el panel y «Escribirles», en mando manual");
c(/var hace = c\.a && \(manual\(\) \|\| c\.a\[1\] === "cola"\)/.test(K), "   NEBULA en piloto no ofrece «Escribirles» (sí «Ver la Cola de nota»)");
c(/if \(!manual\(\)\) \{\s*await window\.SG\.preguntar\(\{ aqui: b\.closest\("\.retos-ficha"\) \|\| b, marca: b,/.test(K) && /si: "Cerrar", no: "" \}\);/.test(K),
  "🔴 en piloto la ficha enseña lo entregado, pero validar o anular lo hace el referente");
// 🔴 20-sep · «Premiar» sale también en piloto: dar un premio en clase es de directo, no una opción avanzada
// («poder dar un premio concreto a un estudiante o a toda la clase»).
c(!/t\[0\] !== "premios"/.test(A) && /\["premios", "premios", "Premiar"\]/.test(A) && /id="au-ir-premiar" data-av/.test(A),
  "🔴 las herramientas de clase tienen «Premiar» en los dos modos");

// ── 3 · «Hoy toca»
c(/function bloqueHoyToca\(S, sem, total, gente, foro\)/.test(K) && /function fichaReto\(r, tipo, prog\)/.test(K), "🔴 «Hoy toca»: un bloque con las fichas de reto completas");
c(/window\.SG_GANCHO_RETOS=/.test(H) && /window\.SG_EJEMPLOS=/.test(H), "   con el gancho y el ejemplo de cada reto (los mismos datos que la Nave)");
c(/String\(s\.hito \|\| ""\)\.split\(" · "\)/.test(K) && /"Se lanza la "/.test(K) && /NEBULA abre el capítulo/.test(K) && /Último día para registrar retos/.test(K),
  "🔴 y el calendario de la semana: tests, presentaciones, entregas, las Actividades que se lanzan, NEBULA y los cierres");
c(/window\.SGSEMANAS\.inicioDeSemana\(S\.inicio, sem, S\.pausas\)/.test(K), "   con las fechas de verdad de esa semana (el calendario del grupo, con sus pausas)");
c((K.match(/bloqueHoyToca\(/g) || []).length === 2 && !/gp-hoy-d/.test(K), "🔴 en el Puente de cada grupo (ya no hay «Mis grupos» con su resumen)");
c(/'<div class="card pt-hoy">' \+ bloqueHoyToca\(\(DATOS\.proyecto \|\| \{\}\)\.stargate \|\| \{\}, sem, total, gente, bloqueForo\(sem, foroTxt, !!mioForo\)\)/.test(K), "   y en la portada, con cuántos lo han hecho y el mensaje del foro dentro");
const src = K.slice(K.indexOf("  function icoCal(t) {"), K.indexOf("  /** La ficha de un reto"));
let icoCal = null; try { icoCal = new Function(src + "; return icoCal;")(); } catch (e) {}
c(!!icoCal && icoCal("Test del Tema 6") === "libro" && icoCal("Presenta la Act. 1") === "envivo" && icoCal("Resolución de la Act. 1") === "hecho" && icoCal("Bitácora: un juego digital") === "notas",
  "   cada cosa del calendario con su icono (test, presentación, entrega, Bitácora)");

console.log("\n  Batería 96 · piloto automático / mando manual y «Hoy toca» (19-sep)");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
