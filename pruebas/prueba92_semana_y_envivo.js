'use strict';
/**
 * BATERÍA 92 · TRES RETOS POR SEMANA Y LO «EN VIVO» (17-sep-2026, noche).
 *
 * Norberto, en la prueba humana: «“Como mucho, 3 retos al día”. ¡Debería ser 3 retos a la semana!»; «cuando inicio una
 * votación, al estudiante no le aparece nada… una sección en vivo en la Nave»; «lanzar pregunta en directo, las respuestas
 * en tiempo real con su alias y avatar»; «si el docente pasa de diapo, al estudiante le pasa también». Aquí se fija que
 * la web lo hace; el servidor (gamificapro/functions/stargateTope.js) y las reglas tienen sus propias pruebas.
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const DATOS = leer("_site_data.py"), BUILD = leer("_build_site.py"), NAVE = leer("assets/js/recluta.js"), FUENTE = leer("assets/js/fuente.js");
const VALIDAR = leer("assets/js/validar.js"), MOTOR = leer("assets/js/motor.js"), AULA = leer("assets/js/aula.js"), SES = leer("assets/js/sesion.js");

// ── 1 · tres por semana
// 25-sep · SIN TOPE (Norberto: «vamos a quitar el límite de 3 retos a la semana… no quiero frenarles»): 0, y un aviso al docente
c(/^TOPE_RETOS_SEMANA = 0$/m.test(DATOS) && /^AVISO_RETOS_DIA = 6$/m.test(DATOS) && !/TOPE_RETOS_DIA/.test(DATOS + BUILD), "🔴 sin tope de retos por semana (0), y el aviso al docente a partir de 6 en un día");
c(/window\.SG_TOPE_SEMANA=/.test(leer("recluta.html")) && !/SG_TOPE_DIA/.test(NAVE + FUENTE + VALIDAR), "   la web lo recibe como SG_TOPE_SEMANA, y nadie usa el viejo");
c(/function lunes\(\)/.test(NAVE) && /function registrosDeLaSemana\(\)/.test(NAVE) && /otorgados\.indexOf\(k\)<0/.test(NAVE), "🔴 Nave · cuenta desde el lunes y sin los validados por su docente");
c(/hoy0\.setDate\(hoy0\.getDate\(\) - \(\(hoy0\.getDay\(\) \+ 6\) % 7\)\)/.test(FUENTE) && /if \(otorg\.indexOf\(k\) >= 0\) return;/.test(FUENTE), "   el cerrojo de fuente.js, igual");
c(/function deLaSemana\(ficha\)/.test(VALIDAR) && /Esta semana ya has registrado/.test(VALIDAR), "   y el «Validar» de los Geniallys");
c(/stargateOtorgados: otorgados/.test(MOTOR), "🔴 lo que valida el docente a mano queda apuntado (no le quita hueco al recluta)");
c(/Number\(window\.SG_TOPE_SEMANA\)\?'Como mucho, <b>'/.test(NAVE) && /Sin tope: a tu ritmo\./.test(NAVE), "   la bienvenida lo dice: sin tope, a su ritmo (y si vuelve un tope, lo dice)");

// ── 2 · la votación, en directo en la Nave
c(/function vigilarVotaciones\(perId, alCambiar\)/.test(MOTOR) && /where\("isActive", "==", true\)/.test(MOTOR), "🔴 motor · las votaciones activas se ESCUCHAN (antes se miraban una vez)");
c(/function vigilarVotacion\(\)/.test(NAVE) && /vigilarVotacion\(\); vigilarEnVivo\(\);/.test(NAVE), "   la Nave las escucha desde que entra");
c(/stargateModo: v\.modo === "diferido" \? "diferido" : "directo"/.test(MOTOR) && /name="au-vt-modo" value="diferido"/.test(AULA), "🔴 aula · votación en directo o en diferido (con sus días)");
c(/stargateCierra && ahora>Number\(v\.stargateCierra\)/.test(NAVE), "   la de diferido se cierra sola a su hora");

// ── 3 · En vivo: aviso arriba en cualquier pestaña y su pestaña
c(/\['envivo','envivo','En vivo'\]/.test(NAVE) && /k==='envivo'\?hayEnVivo\(\)/.test(NAVE), "🔴 Nave · la pestaña «En vivo» solo existe mientras hay algo en directo");
c(/avisoMensajes\(\)\+avisoEnVivo\(\)/.test(NAVE) && /function avisoEnVivo\(\)/.test(NAVE), "   y arriba, en cualquier pestaña, el aviso de lo que hay");
c(/var firma=\[p&&p\.id, s\?1:0, s&&s\.sem\]\.join\('\|'\)/.test(NAVE), "🔴 el docente pasando diapositivas NO repinta la Nave (ni recarga la sesión incrustada, ni borra lo escrito)");
c(/if\(!v\)\{ VOTO\.mia=\{\}; if\(antes\) render\(\); return; \}/.test(NAVE), "   ni cada voto de otro");

// ── 4 · la pregunta en directo
["lanzarPregunta", "cerrarPregunta", "responderPregunta", "vigilarRespuestas", "quitarRespuesta", "miRespuesta", "vigilarEnVivo", "publicarEnVivo"].forEach(f =>
  c(new RegExp("function " + f + "\\(").test(MOTOR) && new RegExp("\\b" + f + ",").test(MOTOR.slice(MOTOR.indexOf("window.SG.MOTOR = {"))), "   motor · " + f));
c(/\["pregunta", "pregunta", "Pregunta"\]/.test(AULA) && /function vistaPregunta\(\)/.test(AULA) && /MOTOR\.vigilarRespuestas\(PER, p\.id/.test(AULA), "🔴 aula · pestaña «Pregunta» con el muro de respuestas en tiempo real");
c(/caraDe\(x\)/.test(AULA.slice(AULA.indexOf("function muroHtml"))) && /data-pq-quitar/.test(AULA), "   con la cara y el alias de cada uno, y se puede quitar una");
c(/id="ev-resp" maxlength="280"/.test(NAVE) && /M\.responderPregunta\(per, p\.id, st\.yo\.ficha/.test(NAVE), "🔴 Nave · se responde escribiendo, desde «En vivo»");

// ── 5 · la sesión sincronizada
c(/function emitir\(\)/.test(SES) && /publicarEnVivo\(st\.per, \{sesion:\{activa:true, sem:st\.sem, k:o\.k, n:o\.n/.test(SES), "🔴 sesión · el docente emite semana y diapositiva (clave y cuál de ellas)");
c(/if\(EMBED && !st\.alumno && st\.per && st\.yo\) encenderDirecto\(\)/.test(SES) && /encenderDirecto\(\);   \/\/ 17-sep · quien proyecta, emite/.test(SES) && /id="ses-directo"/.test(SES),
  "   al proyectar (en su Genially o a pantalla completa) emite solo, y un botón lo apaga");
c(/function seguirDocente\(\)/.test(SES) && /ir\(i, false, true\)/.test(SES) && /Siguiendo a tu Comandante/.test(SES), "🔴 sesión · el recluta va a la diapositiva del docente, sola");
// 18-sep · Norberto: «el estudiante tiene bloqueado cambiar de diapositiva; la suya cambia sola cuando el docente cambia»
c(/if\(st\.alumno && !desdeDirecto && i!==st\.i && enDirecto\(\)\)\{ avisoBloqueo\(\); return; \}/.test(SES) && /function enDirecto\(\)/.test(SES),
  "🔴 sesión · y mientras el docente emite, el recluta NO puede moverse (sí interactuar)");
c(/mazo\.classList\.toggle\('ses-bloqueado', !!vivo\)/.test(SES) && /\.mazo\.ses-bloqueado \.nav,\.mazo\.ses-bloqueado \.barra-pasos \.p\{opacity:\.3;pointer-events:none\}/.test(leer("assets/css/stargate.css")),
  "   las flechas y los pasos se apagan mientras va con él");
c(/if\(EMBED\|\|SEGUIR\|\|DIFERIDO\)\{/.test(SES) && /st\.alumno=true; st\.ficha=g\.ficha/.test(SES), "   el mismo embed, abierto por un recluta, le enseña la sesión (ya no le echa a su Nave)");
// 🔴 25-sep · EN DIFERIDO. Norberto: «que los estudiantes puedan ver las sesiones que vemos en clase (para los de diferido)…
// un estudiante en la semana 6 podrá ver todas las sesiones hasta la 6»
const NAVE92 = leer("assets/js/recluta.js");
c(/var DIFERIDO = q\.get\('diferido'\) === '1'/.test(SES) && /if\(st\.alumno && st\.sem>st\.semHoy\) st\.sem=st\.semHoy;/.test(SES),
  "🔴 diferido · el recluta ve la sesión de una semana, nunca más allá de la semana en curso");
c(/if\(st\.alumno && !DIFERIDO\)\{ seguirDocente\(\)/.test(SES) && /st\.alumno && !DIFERIDO && d && d\.activa/.test(SES),
  "   a su ritmo: no sigue al docente ni se bloquea");
c(/var SOLO_EN_DIRECTO = \['llamada', 'unete', 'alistaos'\]/.test(SES) && (SES.match(/if\(DIFERIDO\) todo=todo\.filter/g) || []).length === 2,
  "   sin lo que solo vale en directo (la llamada a filas, el únete, el alistamiento)");
c((SES.match(/\(st\.alumno&&st\.profeMio&&P\[st\.profeMio\]\)/g) || []).length === 2, "   y con el panel de Genially de SU Comandante");
c(/function urlSesion\(sem\)\{ return 'sesion\.html\?embed=1&diferido=1&per='\+encodeURIComponent\(per\|\|''\)\+'&sem='/.test(NAVE92)
  && /href="'\+esc\(urlSesion\(s\.sem\)\)\+'"/.test(NAVE92) && /\(llegada&&per\?sesionDe\(s\):''\)/.test(NAVE92),
  "🔴 diferido · en El Archivo, cada semana ya llegada tiene su sesión (y las que no han llegado, no)");
c(/function llamadaAlumno\(M, mando\)/.test(SES) && /M\.ficharLlamada\(st\.per, st\.ficha\)/.test(SES), "🔴 el recluta ficha sobre la presentación");
c(/data-ses-voto=/.test(SES) && /M\.votar\(st\.per, b\.getAttribute\('data-ses-vev'\)/.test(SES), "   vota en la diapositiva de la votación");
c(/id="ses-al-resp"/.test(SES) && /M\.responderPregunta\(st\.per, p\.id, st\.ficha, aliasMio\(\), txt\)/.test(SES), "   y responde la pregunta en directo ahí mismo");
c(/sesion\.html\?embed=1&seguir=1&per=/.test(NAVE), "   y desde «En vivo» de su Nave, la sesión en directo incrustada");

console.log("\n  Batería 92 · tres retos por semana y lo «en vivo»");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
