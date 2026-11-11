'use strict';
/**
 * BATERÍA 154 · EL GLOBO DE LA LLAMADA A FILAS Y DE DÓNDE ERES (11-nov)
 * ------------------------------------------------------------------------------------------------
 * Norberto: «Me gustaría hacerlo ya… que cuando entren en directo ya aparezca el mapa y se les pregunte en esta edición su ciudad y
 * país… la pantalla de "espera" mientras se unen sea el mapa 3D y vayan apareciendo destellos desde las ciudades que se conectan. Los
 * estudiantes que no se han metido hasta Navidad, en Navidad les salta el aviso para completar datos. Los del directo, les salta la
 * próxima vez la edad y lugar.»
 *
 * Las piezas son de GamificaPro (sdk/origen.js, sdk/mapaMundo.js con `globo`, la función `modOrigen`; sus pruebas, en
 * tests/sdk/origenVentana.test.ts, tests/sdk/mapaMundoGlobo.test.ts, tests/functions/mod-origen.test.ts y tests/emulador/mod-origen.test.ts).
 * Aquí, la piel y el cuándo:
 *   1. el build copia las cuatro piezas del motor (sin editarlas) y las carga donde hacen falta: el globo y la pregunta en la sesión,
 *      la pregunta en la Nave;
 *   2. la Llamada a filas pinta el globo (con la piel del puente) con quien ficha, escuchando `mod_mapa/{grupo}` (una lectura para la
 *      sala); al recluta que sigue la sesión, su tripulación; y una prueba sin servidor (`&mapa=prueba`, solo en el grupo demo);
 *   3. al fichar (sesión y Nave) se pregunta SOLO la ciudad y el país; al entrar en la Nave, la edad (y desde Navidad, todo); nunca en
 *      la demo, el simulacro ni incrustada;
 *   4. la privacidad lo cuenta (punto 3) y sube de versión sin volver a pedir el sí.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
const BUILD = L("_build_site.py"), SES = L("assets/js/sesion.js"), NAVE_JS = L("assets/js/recluta.js"), OSG = L("assets/js/origen-sg.js"), MOT = L("assets/js/motor.js");
const FUE = L("assets/js/fuente.js"), CSS = L("assets/css/stargate.css"), SESH = L("sesion.html"), NAVE = L("recluta.html"), PRIV = L("privacidad.html");
const ORI = L("assets/js/origen.js"), MAPA = L("assets/js/mapaMundo.js");
let ok = 0; const fallos = [];
const c = (cond, txt) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt); };
const antes = (html, a, b) => html.indexOf(a) >= 0 && html.indexOf(b) > html.indexOf(a);

console.log("\n  · 1 · las piezas del motor, copiadas y cargadas");
c(/for _p in \("origen\.js", "ciudades\.json", "mapaMundo\.js", "mapaMundoTierra\.js"\):\s*\n\s*GB\.copiar_pieza\(HERE, _p/.test(BUILD), "🔴 el build copia origen.js, ciudades.json, mapaMundo.js y mapaMundoTierra.js de GamificaPro");
c(/queFalta/.test(ORI) && /sinEdad/.test(ORI) && /directo/.test(ORI), "   la copia de origen.js ya sabe pedir solo la ciudad (directo) y lo que falta (queFalta)");
c(/globo/.test(MAPA) && /getContext\("2d"\)/.test(MAPA) && !/getContext\("webgl|\bimport\s|require\(/.test(MAPA), "   y la de mapaMundo.js trae el globo (un lienzo 2D), sin librerías");
c(antes(SESH, "assets/js/origen.js", "assets/js/sesion.js") && antes(SESH, "assets/js/mapaMundo.js", "assets/js/sesion.js") && antes(SESH, "assets/js/origen-sg.js", "assets/js/sesion.js"),
  "   sesion.html carga la pregunta y el globo antes que sesion.js");
c(antes(NAVE, "assets/js/origen.js", "assets/js/recluta.js") && antes(NAVE, "assets/js/origen-sg.js", "assets/js/recluta.js") && NAVE.indexOf("mapaMundoTierra.js") < 0,
  "   la Nave, solo la pregunta (sin el peso del mapa)");

console.log("\n  · 2 · el globo de la Llamada a filas");
c(/<div class="ll-mapa" id="ses-ll-mapa" hidden><div class="ll-mapa-lienzo"><\/div>/.test(SES), "🔴 la diapositiva lleva su hueco para el globo");
c(/globo:\{ lon:-38, lat:22 \}, brillo:true/.test(SES) && /window\.GP\.mapaMundo\.crear\(/.test(SES), "   el globo de GamificaPro, con brillo (cada recluta, una baliza)");
c(/M\.mapaEscuchar\(st\.per, function\(P\)\{ puntos=P\|\|\{\}; pintar\(\); \}/.test(SES) && /const mapaEscuchar = \(perId, cb, alFallar\) => onSnapshot\(doc\(db, "mod_mapa", String\(perId\)\)/.test(MOT),
  "🔴 escucha mod_mapa/{grupo}: una lectura para toda la sala");
c(/if\(globo\) globo\.gente\(gente\);/.test(SES), "   se enciende con quien ficha (los mismos que el anillo)");
c(/if\(globo\) globo\.gente\(vivos\(\)\);/.test(SES), "   al recluta que sigue la sesión, su tripulación");
c(/return function\(\)\{ vivo=false; if\(reloj\) clearInterval\(reloj\); if\(globo\) globo\.fin\(\); \};/.test(SES), "   y al pasar de diapositiva se apaga (sin escuchas colgadas)");
c(/MAPA_PRUEBA && !st\.alumno && st\.per===\(window\.SG_PER_DEMO\|\|'demo-stargate'\)/.test(SES), "   la prueba sin servidor (&mapa=prueba), solo en el grupo demo");
c(/\.dia\.llamada \.ll-mapa-lienzo\{[^}]*--gpmm-globo-borde:#37e0ec[^}]*--gpmm-globo-brasa:#f5b043/.test(CSS), "   con la piel del puente: holograma turquesa y balizas ámbar");
c(/@media \(max-width:720px\)\{\s*\.dia\.llamada \.ll-mapa\{flex:none;width:100%\}/.test(CSS), "   y en el móvil, debajo del mando y a lo ancho");

console.log("\n  · 3 · de dónde eres: la ciudad al fichar, la edad después");
c(/var DESDE = "2026-12-21";/.test(OSG), "🔴 el aviso a quien no ha dicho nada, desde la pausa de Navidad (21-dic)");
c(/accion: "mio", projectId: String\(per\), directo: true/.test(OSG) && /r\.que !== "lugar"/.test(OSG) && /modo: "lugar"/.test(OSG), "🔴 al fichar, solo la ciudad y el país (si aún no los ha dicho)");
c(/estado: yo\.origen \|\| \{\}/.test(OSG) && /yo\.fantasma \|\| yo\.congelado/.test(OSG), "   al entrar, lo que falte (la edad); nunca a un fantasma ni a una cuenta congelada");
c((SES.match(/trasFichar\(\);/g) || []).length === 2 && /SG\.origen\.alFichar\(st\.per\)/.test(SES), "   en la sesión: al fichar solo y al pulsar «Presente»");
c(/if\(!SIMULACRO && window\.SG\.origen\) setTimeout\(function\(\)\{ SG\.origen\.alFichar\(per/.test(NAVE_JS), "   en la Nave: tras «Presente» (después del regalo, si lo hay)");
c(/setTimeout\(origenAlEntrar, 3200\);/.test(NAVE_JS) && /excluir: DEMO \|\| SIMULACRO \|\| q\.get\('embed'\)==='1'/.test(NAVE_JS), "   y al entrar, sin la demo, el simulacro ni la Nave incrustada");
c(/if \(yo_\) yo_\.origen = f\.modOrigen \|\| null;/.test(FUE), "   lo que ya ha dicho sale de SU ficha (sin ciudad ni edad: solo si falta algo)");
c(/--gpo-fondo:#0d1626/.test(CSS) && /\.gpo-ventana\.sg-origen/.test(CSS), "   la ventana, oscura, con la piel de la Nave");

console.log("\n  · 4 · la privacidad");
c(/Tu ciudad y tu país<\/b>/.test(PRIV) && /Tu edad no la ve nadie<\/b>/.test(PRIV) && /Mostrar solo mi país/.test(PRIV), "🔴 el punto 3 cuenta la ciudad, el país y la edad, y quién los ve");
c(/Versión 2026-11-11/.test(PRIV), "   y la política sube de versión (sin volver a pedir el sí)");

console.log("\n  Batería 154 · " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
if (fallos.length) process.exit(1);
