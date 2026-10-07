'use strict';
/**
 * BATERÍA 118 · LA ACADEMIA, UNA PÁGINA DEL MENÚ Y NO UN GRUPO DE CLASE (29-sep, noche)
 *
 * Norberto, al ver «STARGATE · ACADEMIA DE LA CERO · Semana 10 de 15» en «Gestionar grupos», con Anita y Caridad de referentes:
 * «debería ser una página en el menú de arriba. Academia (para todos los docentes), así separamos docencia de aprendizaje. Si yo
 * accedo a esa página, puedo ver quién se ha inscrito, gestionar todo; el resto de docentes, TODOS sin excepción, accederán como
 * estudiantes, incluyendo Caridad y Anita». Aquí: la entrada del menú, el grupo fuera de las listas de clase, el panel de quien
 * la organiza (sin registrarse ni alistarse) y el script que deja el equipo del grupo solo con él.
 * La prueba de pantalla del panel se hizo en el navegador el 29-sep, con datos de mentira y sin sesión.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const B = L("_build_site.py"), MOT = L("assets/js/motor.js"), CJS = L("assets/js/consola.js"), AJS = L("assets/js/academia.js");
const CON = L("consola.html"), ACA = L("academia.html"), GUIA = L("guia.html"), GRUPO = fs.readFileSync(path.join(R, "..", "academia", "academia_grupo.cjs"), "utf8");

// ── 1 · En el menú de arriba, para todo el profesorado (7-oct: dentro de «Ayuda ▾», la primera; el desplegable es
//        GamificaPro sdk/menu.js, y la batería 136 comprueba el menú entero)
const OPC = h => (h.match(/<div class="gpm-lista"[^>]*>([\s\S]*?)<\/div><\/div>/) || ["", ""])[1];
c(/AYUDA_DOCENTE = \[\s*dict\(href="academia\.html", texto="Academia", clave="acad"/.test(B) && /NAV = \[\("consola\.html","Mi nave","cons"\),\("gestion\.html","Gestionar grupos","gest","referente"\)\]/.test(B),
  "🔴 «Academia» en el menú del profesorado: después de «Gestionar grupos», la primera de «Ayuda ▾»");
c(/<a role="menuitem" tabindex="-1" href="academia\.html">Academia</.test(OPC(CON)) && /<a role="menuitem" tabindex="-1" href="academia\.html">Academia</.test(OPC(GUIA)), "   visible en las páginas del profesorado (sin «solo»: para todos)");
c(/<a role="menuitem" tabindex="-1" href="academia\.html" aria-current="page">Academia</.test(OPC(ACA)) && /class="gpm gpm-derecha gpm-activo"/.test(ACA), "   y encendida en la propia Academia");

// ── 2 · Su grupo, fuera de las listas de clase
c(/async function misPERs\(correo, opc\)/.test(MOT) && /\.filter\(x => !x\.stargate\.academia \|\| !!\(opc && opc\.academia\)\)/.test(MOT),
  "🔴 motor.js: misPERs no devuelve el grupo de la Academia (ni en «Mi nave», ni en el aula, la sesión o la llamada)");
c(/var CON_ACADEMIA = \{ academia: !!window\.SG_PER_ACADEMIA && url\.get\("per"\) === window\.SG_PER_ACADEMIA \};/.test(CJS) &&
  (CJS.match(/MOTOR\.misPERs\(YO\.correo, CON_ACADEMIA\)/g) || []).length === 4 && !/MOTOR\.misPERs\(YO\.correo\)/.test(CJS),
  "   la consola solo lo abre si se pide por su nombre (el enlace del panel del organizador)");
c((B.match(/window\.SG_ACADEMIA_ORGANIZA=' \+ _json\.dumps\(ACADEMIA\["organiza"\]\["correo"\]\)/g) || []).length === 2 && /SG_ACADEMIA_ORGANIZA="n\.cuartero\.10@gmail\.com"/.test(CON),
  "   las páginas del motor saben quién la organiza (un dato, un sitio: ACADEMIA.organiza)");
c(/if \(!a \|\| ENSAYO \|\| ORGANIZO_ACADEMIA\(\)\) return "";/.test(CJS), "   a quien la organiza no le sale la puerta de alumno en su Nave");

// ── 3 · Quien la organiza la lleva; todos los demás la hacen
c(/function esOrganiza\(yo\) \{ return !!\(yo && C\.organiza && String\(yo\.correo \|\| ""\)\.toLowerCase\(\) === String\(C\.organiza\.correo \|\| ""\)\.toLowerCase\(\)\); \}/.test(AJS),
  "   academia.js reconoce al organizador por su correo (y a nadie más: ni vitalicios ni referentes)");
const iSes = AJS.indexOf("if (!yo) return portadaSinCuenta();"), iOrg = AJS.indexOf("if (esOrganiza(yo)) { ORG = true; return"), iAli = AJS.indexOf("alistarAuto().then(recargar)", iOrg);   // (30-sep · la de arrancar; la de volver a la pestaña ya excluye al organizador: !ORG)
c(iSes > 0 && iOrg > iSes && iAli > iOrg, "🔴 el organizador ve su panel ANTES de registrarse o alistarse: no se apunta como alumno");
c(/M\.academiaTodos\(\)/.test(AJS) && /async function academiaTodos\(\)/.test(MOT) && /academiaProfes, academiaTodos,/.test(MOT), "   el panel lee a todo el profesorado inscrito (motor.js → academiaTodos)");
c(/String\(x\.correo\)\.toLowerCase\(\) !== yo/.test(AJS), "   y se deja fuera a sí mismo");
["inscritos", "en marcha", "terminada", "sin respuesta"].forEach(t => c(AJS.indexOf('"' + t + '"') >= 0 || AJS.indexOf(t) >= 0, "   la cifra «" + t + "»"));
c(/Copiar el enlace para el profesorado/.test(AJS) && /href="crear\.html"/.test(AJS) && !/gestion\.html\?per=/.test(AJS),
  "   copiar el enlace y crear un grupo con ellos (y nada de mandarle a Gestionar grupos: ahí solo van los grupos de alumnado real)");
// 30-sep · «además de ver la Academia como tal… ver los emails, modificarlos, echar a un profesor antiguo»
c(/function pestanasOrg\(cual\)/.test(AJS) && /data-org="profes"/.test(AJS) && /data-org="curso"/.test(AJS) && /function verCurso\(\) \{ DEMO = true; VER = true;/.test(AJS),
  "🔴 dos pestañas: «Tu profesorado» y «La Academia» (el curso tal cual, sin registrarse ni alistarse)");
c(/function abierta\(i\) \{ return true; \}/.test(AJS), "   en «La Academia» ve todas las paradas abiertas (5-oct: abiertas para todos)");
c(/M\.academiaEditar\(uid, \{ nombre: nombre, correo: correo \}\)/.test(AJS) && /async function academiaEditar\(uid, campos\)/.test(MOT), "🔴 corrige el nombre y el correo de cada docente");
c(/\(f \? M\.darDeBaja\(G, f\.id\) : Promise\.resolve\(\)\)\.then\(function \(\) \{ return M\.academiaQuitar\(uid\); \}\)/.test(AJS) && /async function academiaQuitar\(uid\)/.test(MOT),
  "🔴 echa a quien ya no la va a hacer: su ficha de recluta (la baja de siempre) y su registro");
c(/function academiaFichas\(perId\)/.test(MOT) && /data-echar-ficha/.test(AJS) && /sin inscribirse/.test(AJS), "   y las cuentas alistadas sin inscribirse (una de pruebas), con su botón para echarlas");
c(/window\.SG\.preguntar\(\{ aqui: b\.closest/.test(AJS), "   siempre con una pregunta antes de echar a nadie");
c(/Su primera pieza/.test(AJS) && /function hiloDe\(x\)/.test(AJS) && /function sinRespuesta\(x\)/.test(AJS), "   de cada uno: sesiones, hitos, su diseño y sus mensajes con Claude (y los que esperan respuesta)");
c(/\.acd-org-cifras\{display:grid;grid-template-columns:repeat\(4/.test(L("assets/css/stargate.css")) && /@media \(max-width:600px\)\{\s*\.acd-org-cifras\{grid-template-columns:repeat\(2/.test(L("assets/css/stargate.css")),
  "   las cifras, de cuatro en cuatro (de dos en dos en el móvil)");

// ── 4 · El equipo del grupo, solo el organizador
c(/process\.argv\.includes\("--solo-organiza"\)/.test(GRUPO) && /lote\.update\(ref, \{ coTeacherEmails: \[ORGANIZA\.correo\] \}\);/.test(GRUPO) && /lote\.set\(pref, \{ docentes: solo\(/.test(GRUPO),
  "🔴 academia_grupo.cjs --solo-organiza: coTeacherEmails y el equipo privado, solo con quien la organiza");

// ── 5 · 30-sep · Responderle tú (el botón «Responder» en el hilo de cada docente) y «¿Cómo te ha resultado?» tras cada juego
const MOT5 = L("assets/js/motor.js"), DIA = L("../academia/academia_diaria.cjs");
c(/async function academiaResponder\(uid, texto, de\)/.test(MOT5) && /llamar\("modFormacion", \{ mod: "stargate", accion: "responder", uid, texto: t, de \}\)\)\.t;/.test(MOT5) && /academiaResponder, academiaAdjuntar, academiaFichas/.test(MOT5),
  "🔴 el motor: academiaResponder, por el servidor (modFormacion), que escribe solo mando.mensajes.<ahora>");
c(/data-responder>Responder<\/button>/.test(AJS) && /M\.academiaResponder\(uid, t, C\.organiza\.nombre\)/.test(AJS), "🔴 el panel: un «Responder» en el hilo de cada docente, firmado con el nombre de quien organiza");
c(/Object\.keys\(md\)\.forEach\(function \(k\) \{ ult = Math\.max/.test(AJS), "   lo que respondes tú cuenta como respondido (se va el «sin respuesta»)");
c(/de: "mando", quien: md\[k\]\.de/.test(AJS) && /m\.de === "mando" \? "El Alto Mando"/.test(AJS) && /\.acd-de-mando\{/.test(L("assets/css/stargate.css")),
  "   y el docente lo ve en su hilo, firmado «El Alto Mando» y con su propio color (NEBULA contesta lo demás)");
c(/YA LE HA RESPONDIDO NORBERTO/.test(DIA), "   la revisión diaria de Claude lo ve (y no te repite)");
c(/\(okJ \? opinarHtml\(hj\) : ""\)/.test(AJS) && /estado\(hjf\)\.ok && !opinado\(hjf\) \? opinarHtml\(hjf, "¿Qué tal «" \+ hjf\.n \+ "»\?"\)/.test(AJS) && /enganchaOpinar\(op\.parentNode/.test(AJS),
  "🔴 «¿Cómo te ha resultado?» tras cada minijuego: en su diapositiva y, si aún no lo ha dicho, en la del final");

// ── 6 · 30-sep · las coordinadoras (Anita, Caridad): la hacen como alumnado Y ven quién la está haciendo
c(/if \(M\.academiaTodos\) M\.academiaTodos\(\)\.then\(function \(\) \{ VIGIA = true;/.test(AJS) && /function pintarVigia\(\)/.test(AJS) && /" Tu profesorado<\/button><\/nav>"/.test(AJS),
  "🔴 quien puede leer la lista (vitalicios, referentes) y no la organiza: su curso y una pestaña «Tu profesorado»");
c(/if \(EN_LISTA\) return;   \/\/ \(mirando «Tu profesorado»/.test(AJS) && /function enPanel\(\) \{ return \(ORG && !VER\) \|\| EN_LISTA; \}/.test(AJS),
  "   mirando la lista, su propio avance no le repinta el curso por encima");
c(!/academiaEditar|academiaQuitar|academiaResponder|darDeBaja/.test(AJS.slice(AJS.indexOf("function pintarVigia()"), AJS.indexOf("function pintarVigia()") + 4000)),
  "   y es de solo lectura: corregir, echar y responder siguen siendo de quien la organiza");

// ── 7 · 30-sep · «¿Dudas?», una píldora flotante (Norberto: «haz más visible el botón para preguntar… una píldora flotante
// en la parte inferior derecha; al pulsar se despliega»)
const CSS7 = L("assets/css/stargate.css");
c(/function montarFlota\(\)/.test(AJS) && /b\.className = "acd-flota-b"/.test(AJS) && /document\.body\.appendChild\(el\); document\.body\.appendChild\(b\);/.test(AJS)
  && /\.acd-flota-b\{position:fixed;right:16px;bottom:calc\(16px/.test(CSS7), "🔴 «¿Dudas?»: una píldora fija abajo a la derecha, fuera de la página que se repinta");
c(/class="neb-aviso" aria-label="' \+ nuevos/.test(AJS) && /var txt0 = document\.getElementById\("acd-txt"\), borrador = txt0 \? txt0\.value : ""/.test(AJS),
  "   con el número de respuestas nuevas, y lo que se escribe no se pierde cuando la página se actualiza");
c(/body\.acd-jugando \.acd-flota-b/.test(CSS7) && /JUGANDO = true; document\.body\.classList\.add\("acd-jugando"\)/.test(AJS) && !/<details class="acd-claude"/.test(AJS),
  "   se aparta mientras se juega; y la caja plegada del final ya no existe");

// ── 8 · 30-sep · Sin romper la ficción. Norberto: «que pregunten a NEBULA; si NEBULA no lo sabe llamará al Alto Mando…
// No digas nada de Claude». Y la nave es La Constancia: «la Cero» es la Tripulación Cero, no la nave.
const textosAJS = AJS.split("\n").filter(l => !/^\s*(\/\/|\*)/.test(l)).join("\n").replace(/pintarClaude|claudeVisto|claudeAbierto|m\.de === "claude"|de: "claude"|"claude"/g, "");
c(!/Claude/.test(textosAJS) && /Pregunta a NEBULA/.test(AJS) && /Enviar a NEBULA/.test(AJS) && /se lo paso al Alto Mando/.test(AJS),
  "🔴 en la Academia no sale Claude: se pregunta a NEBULA, y lo que no sabe lo pasa al Alto Mando");
const SD8 = L("_site_data.py");
c(!/nave Cero|pasillos de la Cero|Laberinto de la Cero|Comandante de la Cero/.test(SD8) && /la nave <b>La Constancia<\/b>/.test(SD8) && /"titulo": "Comandante de La Constancia"/.test(SD8),
  "🔴 la nave es La Constancia (el prólogo, el título final, los juegos); «la Cero» es la Tripulación Cero");
c(/\.pest\.cn-t \.pest-n\{position:absolute/.test(L("assets/css/stargate.css")), "   en el móvil, el aviso de la Cola de nota va en la esquina de la pestaña (empujaba el icono)");

// ── 9 · 30-sep · las capturas (Norberto: «añade la posibilidad de añadir adjuntos (arrastrar una imagen): eso te ayudará a
// detectar errores»): botón, arrastrar o pegar; comprimidas; a la carpeta del grupo de la Academia, sin reglas nuevas
const MOT9 = L("assets/js/motor.js");
c(/async function academiaAdjuntar\(perId, blob\)/.test(MOT9) && /"projects\/" \+ perId \+ "\/mission_submissions\/academia_" \+ yo\.uid \+ "_" \+ Date\.now\(\) \+ "\.jpg"/.test(MOT9)
  && /import\("https:\/\/www\.gstatic\.com\/firebasejs\/12\.1\.0\/firebase-storage\.js"\)/.test(MOT9),
  "🔴 la captura se sube a projects/<grupo>/mission_submissions/academia_<uid>_<t>.jpg (la regla de Storage ya lo permite)");
c(/id="acd-file"/.test(AJS) && /txt\.addEventListener\("paste"/.test(AJS) && /el\.addEventListener\("drop"/.test(AJS) && /1600 \/ Math\.max\(im\.naturalWidth, im\.naturalHeight\)/.test(AJS) && /MAX_ADJ = 3/.test(AJS),
  "   con el botón (en el móvil, la galería), arrastrándola o pegándola; comprimida y como mucho tres");
c(/adjuntos: urls/.test(AJS) && /function adjuntosHtml\(adj\)/.test(AJS) && /\^https:\\\/\\\/firebasestorage\\\.googleapis\\\.com\\\//.test(AJS),
  "   se ven en el hilo (del docente y de quien organiza), solo si son de nuestro almacén");
c(/captura\(s\): bájalas con/.test(L("../academia/academia_diaria.cjs")), "   y la revisión diaria las lista para mirarlas antes de responder (1-oct: con su comando para bajarlas)");

console.log("\n  Batería 118 · la Academia, una página del menú");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
