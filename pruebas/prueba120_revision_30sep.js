'use strict';
/**
 * BATERÍA 120 · LA REVISIÓN GENERAL DEL 30-SEP (lo de la web)
 *
 * Norberto: «Haz una revisión de stargate en general, si detectas áreas de mejora tanto de diseño como de seguridad o lo
 * que sea, HAZLO». Dos revisores de solo lectura (seguridad y fallos) y lo que salió, arreglado. Lo del servidor y las
 * reglas (el vale de subir nota, los avisos del Comandante, el avatar del directo) lo prueban las reglas de GamificaPro
 * (tests/rules/stargate-revision-30sep.test.ts). Aquí, la web; lo que se puede ejecutar, se ejecuta.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

// ── 1 · Seguridad: el avatar del directo ya no cuela código en el proyector (se EJECUTA el saneado)
const CANAL = L("juegos/directo/canal.js");
const AVsrc = (CANAL.match(/export const AV = (\(k\) => \{[\s\S]*?\};)/) || [])[1];
const AV = new Function("EN_WEB", "return " + AVsrc)(true);
c(AV('"><img src=x onerror=alert(1)>') === "../../assets/img/avatares/evo/p3f_r2.jpg" && AV("x' onmouseover='a") === "../../assets/img/avatares/evo/p3f_r2.jpg",
  "🔴 directo · un avatar con comillas o < > se descarta (se pintaba en el proyector del docente)");
c(AV("https://drive.google.com/thumbnail?id=abc&sz=w400") === "https://drive.google.com/thumbnail?id=abc&sz=w400" && AV("assets/img/heroes/h1.jpg") === "../../assets/img/heroes/h1.jpg",
  "   y los de verdad siguen igual");

// ── 2 · El enlace del chat: el alumnado entra (antes se topaba con «Material del profesorado»)
const PUERTA = L("assets/js/puerta.js");
c(/q\.get\('seguir'\) === '1'\) \{ abrir\(\); return; \}/.test(PUERTA) && /u\.searchParams\.set\('seguir','1'\)/.test(L("assets/js/sesion.js")),
  "🔴 sesion.html?seguir=1 (el enlace para el chat) pasa la puerta del profesorado");

// ── 3 · La Nave del recluta
const REC = L("assets/js/recluta.js");
c(/soloAviso = !bNo;/.test(REC) && /\(bNo \|\| bSi\)\.focus\(\)/.test(REC) && /if\(v && !soloAviso\)\{ resolve\(true\); return; \}/.test(REC) && /if\(bNo\) bNo\.onclick/.test(REC),
  "🔴 el aviso de NEBULA de un solo botón («Entendido») se cierra (en el móvil no había forma)");
c(/function olvidar\(\)\{[\s\S]{0,260}M\.salir\(\)\.then\(function\(\)\{ location\.replace\('entrar\.html'\); \}/.test(REC),
  "🔴 «No soy yo / salir» cierra la sesión de Google (en un ordenador compartido, el siguiente veía la Nave del anterior)");
c(REC.indexOf("var faltanRepes") < REC.indexOf("var afford=!r?'':faltanRepes") && REC.indexOf("var faltanRepes") > 0, "   los 3 repetidos: se miran antes de poner la etiqueta");
c(/email:\(function\(\)\{try\{return localStorage\.getItem\(KEY_MAIL\)/.test(REC), "   sin almacenamiento (Genially con cookies de terceros bloqueadas), la Nave arranca igual");
c(/SGSEMANAS\.iso\(d\)/.test(L("assets/js/fuente.js")) && /SGSEMANAS\.fecha\(f\[k\]\)/.test(REC), "   el día de cada reto, en hora local (lo del lunes a la 1:00 contaba como del domingo)");

// ── 4 · La consola de ensayo (se EJECUTA la cuenta de semanas)
const FSIM = L("assets/js/sim/firebase_sim.js");
// 7-oct · lunesDe vive ya en el simulador común de GamificaPro (el paquete que importa el envoltorio)
const PAQ = (FSIM.match(/^import "\.\/(mod-sim\.v1\.[0-9a-f]{10}\.js)";$/m) || [])[1];
const lunesDe = (() => { const c = {}; new Function("self", "module", L("assets/js/sim/" + PAQ))(c, undefined); return c.GP_SIM.lunesDe; })();
const corre = (hoy, gen) => Math.floor(Math.round((lunesDe(Date.parse(hoy)) - lunesDe(Date.parse(gen))) / 864e5) / 7);
const GEN = "2026-09-30T04:00:00+02:00";
c(corre("2026-10-04T23:30:00+02:00", GEN) === 0 && corre("2026-10-05T00:10:00+02:00", GEN) === 1 && corre("2026-10-06T12:00:00+02:00", GEN) === 1 && corre("2026-10-26T00:30:00+01:00", GEN) === 4,
  "🔴 ensayo · las semanas se cuentan de lunes a lunes (sembrado un miércoles, caía en «curso terminado» cada lunes y martes)");
const CJS = L("assets/js/consola.js");
c(/CLAVE_MODO = window\.SG_ENSAYO === 1 \? "sgEnsayo\.modo" : "sgModoNivel"/.test(CJS) && /CLAVE_ULTIMO = window\.SG_ENSAYO === 1 \? "sgEnsayo\.per" : "sgConsolaPer"/.test(CJS),
  "   el ensayo guarda su modo y su grupo aparte (pisaba los de la consola de verdad)");
c(/function modoLocal\(local\) \{ return local === "manual" \|\| \(window\.SG_ENSAYO === 1 && local !== "piloto"\)/.test(CJS),
  "   y empieza en Mando manual: las misiones de la Academia (validar, anular, mensajes, premios) están ahí");
c(/new URL\(haciaFuera\(ruta\), location\.href\)/.test(CJS) && /function absoluta\(url\) \{ url = haciaFuera\(url\);/.test(CJS) && /\["click", "auxclick", "contextmenu", "pointerdown"\]/.test(CJS),
  "   lo que sale de él (ventanas, enlaces copiados, clic central) va al grupo DEMO, no al grupo retirado");

// ── 5 · La consola de verdad
c(/async function recuperacion\(per, reabrir\)/.test(CJS) && !/async function recuperacion\(per, abrir\)/.test(CJS), "🔴 «Reabrir para la recuperación» ya no acaba en error (el parámetro tapaba la función abrir)");
c(/document\.querySelector\("\.c-modal\.abierto, \.sgp-capa/.test(CJS), "   al volver a la pestaña se refresca aunque antes se abriera una ficha");

// ── 6 · La sesión de clase y el aula
const SES = L("assets/js/sesion.js"), AULA = L("assets/js/aula.js");
c(/if\(st\.alumno && que==='textos' && caja\)/.test(SES), "🔴 quien sigue la clase desde el móvil no ve los comentarios del ticket (el docente oculta algunos)");
c(/if\(nuevo!==st\.per\)\{ apagarDirecto\(\);/.test(SES) && /function salir\(\)\{\n    apagarDirecto\(\);/.test(SES), "   cambiar de grupo o salir deja de emitir en directo");
c(/if \(VOT\.parar\) \{ try \{ VOT\.parar\(\); \} catch \(e\) \{\} \}\n      VOT = \{ lista: null/.test(AULA), "   el aula: al cambiar de grupo, fuera las votaciones del otro");

// ── 7 · La Academia
const AJS = L("assets/js/academia.js");
c(/function enPanel\(\) \{ return \(ORG && !VER\) \|\| EN_LISTA; \}/.test(AJS) && /!escribiendo\(\) && !enPanel\(\)\) pintar\(\)/.test(AJS) && /t === "INPUT"/.test(AJS),
  "🔴 el panel de quien organiza no se repinta con el curso encima (ni le crea un registro, ni borra lo que está escribiendo)");

c(/recargar\(\)\.then\(function \(\) \{ if \(!FICHA && !ORG\) return alistarAuto\(\)\.then\(recargar\); \}\)\.then\(pintar\)/.test(AJS)
  && /const activos = registros(\.docs)?\.filter/.test(L("../academia/academia_grupo.cjs")) && /--aunque-esten/.test(L("../academia/academia_grupo.cjs")),
  "🔴 si le quitan la ficha con la Academia abierta, al volver a la pestaña se alista otra vez; y --vaciar no borra a quien está en ello");

// ── 8 · Textos y enlaces
c(/pasos\.html\?camino=referente/.test(L("_build_site.py")) && !/pasos\.html#referente/.test(L("registro.html") + L("legacy.html")), "   «Montarlo paso a paso» abre el camino del referente (el ancla #referente no existía)");
c(/Abre la <a href='ensayo\.html'>consola de ensayo<\/a>/.test(L("_build_site.py")) && !/PRUEBA · SEMANA 16/.test(L("prueba-equipo.html")), "   la prueba del equipo manda a la consola de ensayo (los grupos de prueba ya no existen)");
c(/height:100dvh/.test(L("assets/css/stargate.css")), "   las ventanas a pantalla completa, sin cortarse bajo la barra de Safari en el iPhone");
c(/aria-label="El enlace de tu evidencia"/.test(REC) && /aria-label="Correo"/.test(L("assets/js/crear.js")) && /aria-label="Avatar \$\{i \+ 1\}"/.test(L("juegos/directo/alumno.js")),
  "   campos y botones con nombre para los lectores de pantalla");

console.log("\n  Batería 120 · la revisión general del 30-sep");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
