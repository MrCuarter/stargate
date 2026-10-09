'use strict';
/**
 * BATERÍA 115 · LA ACADEMIA DE LA CERO (29-sep): el curso del profesorado
 *
 * Norberto: «un grupo solo para docentes, que se alistan como estudiantes… de lo más grande a lo más concreto, con
 * actividades o hitos autocorregibles… debe ser automático… conexión directa contigo una vez al día». Y: «que la academia no
 * agobie, que tengan sesiones para entender las cosas, que la información se muestre poco a poco». Y: «ponme a mí como
 * docente organizador». Nueve sesiones cortas (una idea por pantalla, un hito por pantalla, pregunta a pregunta), el ensayo
 * que deja su rastro en este navegador, el registro del profesorado que crear.html enseña con un tic y la revisión diaria.
 * El laboratorio no la recorre: la prueba de clics se hizo en la demostración (academia.html?demo=1), también en el móvil.
 */
const fs = require("fs"), path = require("path"), cp = require("child_process");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const A = JSON.parse(cp.execFileSync("python3", ["-c", "import json,_site_data as D;print(json.dumps({'a':D.ACADEMIA,'per':D.PER_ACADEMIA}, ensure_ascii=False))"], { cwd: R, encoding: "utf8" }));
const C = A.a, E = C.estaciones;
const HTML = L("academia.html"), JS = L("assets/js/academia.js"), CSS = L("assets/css/stargate.css"), MOT = L("assets/js/motor.js");
const STG = L("assets/js/stargate.js"), SES = L("assets/js/sesion.js"), CONS = L("assets/js/consola.js"), FUE = L("assets/js/fuente.js");
const CREAR = L("assets/js/crear.js"), ALI = L("assets/js/alistarse.js");

// ── 1 · 5-oct · OCHO PARADAS, EN EL ORDEN EN QUE SE NECESITAN (Norberto: «ni los profes referentes han hecho el curso… necesito
// que la academia sea un lugar ÚTIL»; las propuso él: narrativa, antes del primer día, primer día, primera semana, progreso,
// estudiantes, cerrando el curso y canjes). Una por planeta, con los fondos de siempre.
c(JSON.stringify(E.map(e => e.titulo)) === JSON.stringify(["La historia y tu panel", "Antes del primer día", "El primer día", "La primera semana",
  "El progreso", "Tus estudiantes", "Cerrando el curso", "Los canjes: subir nota"]), "🔴 las ocho paradas, en el orden en que un docente las necesita", E.map(e => e.titulo).join(" · "));
c(JSON.stringify(E.map(e => e.planeta)) === JSON.stringify(["Fôrge", "Ecos", "Sendara", "Reliae", "Umbral", "Ludo", "Vínculo", "Liminar"]) &&
  JSON.stringify(E.map(e => e.id)) === JSON.stringify(["forge", "ecos", "sendara", "reliae", "umbral", "ludo", "vinculo", "liminar"]), "   una por planeta, con sus fondos (sin el prólogo aparte: la historia es la primera parada)");
c(C.titulo === "La Academia de la Cero" && C.final.titulo === "Comandante de La Constancia", "   «La Academia de la Cero» y, al terminar, «Comandante de La Constancia» (la nave es La Constancia; la Cero, la tripulación)");
c(C.organiza && C.organiza.correo === "n.cuartero.10@gmail.com", "   organiza Norberto (n.cuartero.10)");
c(A.per === "academia-cero" && C.grupo === A.per, "   su grupo propio: academia-cero");
c(/^[A-HJ-NP-Z2-9]{6}$/.test(C.codigo), "🔴 el grupo existe: su código de clase está en los datos (lo escribió academia_grupo.cjs --crear)", C.codigo);

// ── 2 · Corta, con vídeos y sin cifras a mano
const total = E.reduce((a, e) => a + Number(e.min), 0);
c(E.every(e => Number(e.min) > 0 && Number(e.min) <= 6) && total <= 35, "🔴 cada parada, de pocos minutos (toda la Academia, " + total + " min)");
c(E.every(e => e.piezas.length >= 2 && e.piezas.length <= 3), "   dos o tres explicaciones por parada");
c(E.every(e => e.piezas.every(b => b.p.replace(/<[^>]+>/g, "").length <= 260)), "   ninguna explicación es un muro de texto (≤ 260 caracteres; el detalle, en sus pasos)",
  E.map(e => e.piezas.map(b => b.p.replace(/<[^>]+>/g, "").length)).join(" | "));
const vids = [].concat(...E.map(e => e.piezas.filter(b => b.video).map(b => b.video)));
c(vids.length >= 12 && new Set(vids).size === vids.length, "🔴 casi cada explicación, con su vídeo tutorial (" + vids.length + ", ninguno repetido)");
c(vids.every(v => fs.existsSync(path.join(R, "assets/video/tutoriales", v + ".mp4"))), "   y todos los vídeos existen", vids.filter(v => !fs.existsSync(path.join(R, "assets/video/tutoriales", v + ".mp4"))).join(","));
c(/<video class="acd-video" src="' \+ esc\(VIDEO\(b\.video\)\) \+ '" autoplay muted loop playsinline controls/.test(JS) && /window\.SG_TUTORIALES=/.test(HTML), "   se ven grandes, en bucle, sin sonido y con su huella (el CDN guarda 7 días)");
c(/\.acd-video\{position:absolute;right:2\.5%/.test(CSS) && /@media \(max-width:980px\)\{\.acd-video\{position:relative/.test(CSS), "   a la derecha de la explicación; en el móvil, debajo");
c(!/\{\{/.test(JSON.stringify(C)) && /<b>Semana 15<\/b>: las subidas de nota/.test(JSON.stringify(C)) && /Subir 0,5 en un entregable<\/b>: 550/.test(JSON.stringify(C)),
  "🔴 ninguna cifra a mano: las semanas y los precios los pone _site_data.py desde el motor");
c(/function pantallas\(i\)/.test(JS) && /\{ t: "llegada" \}/.test(JS) && /t: "pieza"/.test(JS) && /t: "hito"/.test(JS) && /\{ t: "fin" \}/.test(JS),
  "🔴 cada parada, pantalla a pantalla: la llegada → las explicaciones → la práctica → hecha");
c(/class="acd-dia ' \+ cls/.test(JS) && /acd-dia-barra/.test(JS) && /acd-flecha ant/.test(JS) && /\.acd-dia\{position:relative;isolation:isolate;overflow:hidden;border-radius:20px;border:1px solid var\(--line\);background:#060a12;aspect-ratio:16\/9/.test(CSS),
  "🔴 con la cara de las clases en directo: diapositiva 16:9, fondo del planeta, flechas y barra de pasos");
c(/@media \(max-width:980px\)\{\s*\.acd-dia\{aspect-ratio:auto/.test(CSS), "   en el móvil (y en ventanas estrechas), la diapositiva crece con su contenido");
c(/ev\.key === "ArrowRight"/.test(JS) && /ev\.key === "ArrowLeft"/.test(JS), "   y se pasa con las flechas del teclado, como la clase");
c(/¿Suficiente por hoy\?/.test(JS) && /seguirás justo donde lo dejaste/.test(JS) && /lsPoner\("pos"/.test(JS), "   al acabar cada parada, «¿Suficiente por hoy?», y se sigue donde se dejó");
c(/function abierta\(i\) \{ return true; \}/.test(JS) && !/sesiones más, que se abren/.test(JS), "🔴 todas las paradas abiertas: quien solo quiere «el primer día», va directo");

// ── 3 · El minijuego con sus preguntas, como repaso OPCIONAL (no cierra la parada)
c(E.every(e => e.juego && e.juego.maquina && e.juego.n), "   cada parada tiene su minijuego");
const maq = E.map(e => e.juego.maquina), arcade = maq.filter(m => !/^ruta:/.test(m));
c(JSON.stringify(arcade.slice().sort()) === JSON.stringify(["conquista", "descenso", "evacuacion", "laberinto", "ruta-azul"]) && new Set(maq).size === maq.length,
  "   un minijuego distinto en cada una: las cinco máquinas de Joran y la Ruta", maq.join(","));
c(E.every(e => e.preguntas.length === 5), "   cinco preguntas por parada", E.map(e => e.preguntas.length).join(","));
c(E.every(e => e.preguntas.every(q => q.p && q.o.length >= 3 && q.o.length <= 4 && q.ok === 0 && q.porque && new Set(q.o).size === q.o.length)),
  "   cada una con 3 o 4 opciones distintas (la Ruta no admite más), su buena y su porqué");
c(/tipo: "juego", opcional: true/.test(JS) && /return h\.opcional \|\| estado\(h\)\.ok/.test(JS) && /if \(h\.opcional\) return; t\+\+/.test(JS), "🔴 el juego es OPCIONAL: no cierra la parada ni cuenta para el título");
c(/"&banco=academia&embed=1&tanda=" \+ encodeURIComponent\(e\.id\)/.test(JS) && /window\.SG_BANCO_JUEGO = e\.preguntas/.test(JS), "   se abre en modo Academia, con sus preguntas");
c(/ev\.origin !== location\.origin/.test(JS) && /m\.tanda !== e\.id/.test(JS) && /if \(m\.todas\)/.test(JS) && /if \(m\.siguiente\)/.test(JS), "   y la Academia escucha al juego (sin fiarse de otros orígenes)");
c(/function escribiendo\(\) \{ var t = document\.activeElement && document\.activeElement\.tagName; return JUGANDO \|\|/.test(JS), "   mientras se juega, la página no se repinta sola (se perdería la partida)");

// ── 4 · Una práctica por parada, en la consola de ensayo, que se corrige sola
const hitos = [].concat(...E.map(e => e.hitos)), AUTO = /^((alta|nave|reto:[A-Z]\d|ruta:m\d|repaso|dif:\d+|sim:(clase|rueda|panel|estudiante)|ens:[a-z]+|tab:[a-z]+)(\+|$))+$/;
const ensayo = (h) => h.tipo === "auto" && String(h.comprobar).split("+").every(x => /^(sim|ens|tab):/.test(x));
c(E.every(e => e.hitos.length === 1 && e.hitos.filter(ensayo).length === 1), "🔴 UNA práctica por parada, en la consola de ensayo o el simulador", E.map(e => e.hitos.filter(ensayo).length).join(","));
c(hitos.every(h => AUTO.test(h.comprobar)), "   cada práctica dice qué se comprueba", hitos.map(h => h.comprobar).join(","));
c(/if \(\(m = \/\^tab:\(\.\+\)\$\/\.exec\(c\)\)\) return !!\(R\.consola \|\| \{\}\)\[m\[1\]\]/.test(JS) && /\/\^\(sim\|dif\|ens\|tab\):\//.test(JS), "   «tab:<pestaña>»: la ha abierto en la consola de ensayo");
c(/if \(\(m = \/\^ensayo:\(\.\+\)\$\/\.exec\(b\)\)\) return "ensayo\.html\?tab=" \+ encodeURIComponent\(m\[1\]\)/.test(JS), "   y su botón la abre directamente en esa pestaña");
c(new Set(hitos.map(h => h.id).concat(E.map(e => e.id + "-juego"))).size === hitos.length + E.length, "   ids de práctica únicos");
c(/completedMissionIds/.test(JS) && /G \+ "__" \+ m\[1\]/.test(JS) && /stargateRuta/.test(JS) && /\.medalla !== "nada"/.test(JS), "   los retos y la Ruta se siguen leyendo de SU ficha en el grupo de la Academia");
c(/function hechosEnsayo\(\)/.test(JS) && /sgEnsayo\.hechos/.test(JS) && /String\(c\)\.split\("\+"\)\.every\(autoOk\)/.test(JS), "   lo hecho en el ensayo se lee de este navegador, y una práctica compuesta pide todas sus partes");

// ── 5 · Las palabras del máster, sin destripes ni emojis
const TODO = JSON.stringify(C);
c(!/Ashan|Archivista|Oren|Fragmento Prohibido|se convirtieron en NEBULA|antena/i.test(TODO), "🔴 sin destripes: ni qué fue de la Cero, ni quién es NEBULA, ni el pasado de Vaeon");
c(/Estudiantes<\/b> \(Reclutas\)/.test(TODO) && /\(relámpago\)/.test(TODO) && /\(en STARGATE, la <b>Bitácora<\/b>\)/.test(TODO), "   las palabras del máster; las de STARGATE, entre paréntesis");
c(!/referente/i.test(TODO), "   y ni rastro de «referente» (la Academia es para cualquier docente)");
const JS_SIN_COMENT = JS.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
c(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(TODO + JS_SIN_COMENT), "   sin emojis en lo que se ve");
const imgs = [].concat(...E.map(e => [e.pj, e.bg, e.suelo, e.carta].concat(e.piezas.map(b => b.img)))).filter(Boolean);
c(imgs.every(f => fs.existsSync(path.join(R, f))), "   los fondos, las cartas y las imágenes existen", imgs.filter(f => !fs.existsSync(path.join(R, f))).join(","));
c(["maq_conquista", "maq_evacuacion", "maq_laberinto", "maq_rutaazul", "maq_descenso", "maq_vuelo"].every(k => fs.existsSync(path.join(R, "juegos/joran/img", k + ".jpg"))), "   y la imagen de cada máquina");

// ── 6 · La página, el motor y el registro del profesorado
c(/window\.SG_ACADEMIA=/.test(HTML) && /window\.SG_PER_ACADEMIA=/.test(HTML) && /assets\/js\/academia\.js\?v=/.test(HTML) && /noindex/.test(HTML), "   academia.html: sus datos, su script con huella y fuera de los buscadores");
c(/async function academiaGuardar/.test(MOT) && /"stargate_formacion"/.test(MOT) && /academiaMia, academiaGuardar, academiaInvitar, academiaEscuchar, academiaProfes/.test(MOT), "🔴 motor: su documento en stargate_formacion/{uid} (y la lista para crear grupos)");
// 8-oct · lo guarda el servidor (GamificaPro: modFormacion, mod «stargate»): el correo sale de su sesión de Google, verificado, no de la web
const GP_ST = ["/Users/nor/Claude/vibewebs/gamificapro/functions/mods/stargate.js"].find(f => require("fs").existsSync(f));
c(/llamar\("modFormacion", Object\.assign\(\{ mod: "stargate", accion: "guardar", campos: limpio, nombre: String\(yo\.nombre \|\| ""\) \}, inv\)\)/.test(MOT.slice(MOT.indexOf("async function academiaGuardar"))) &&
  (!GP_ST || /identidad: \{ nombre: 80, correo: 120 \}/.test(require("fs").readFileSync(GP_ST, "utf8"))), "   con su correo de Google (el de verdad: lo pone el servidor, del token verificado)");
c(/entrar ES registrarse/.test(JS) && /Tus estudiantes nunca verán tu correo/.test(JS), "🔴 entrar es registrarse, y avisa: «Tus estudiantes nunca verán tu correo»");
c(/\(e\) => fn\(null, e\)/.test(MOT) && /SIN_GUARDAR/.test(JS), "   si no se puede leer su documento, la Academia se pinta y lo dice (no se queda colgada)");
c(/function cargarAcademia/.test(CREAR) && /data-acd=/.test(CREAR) && /MOTOR\.academiaProfes/.test(CREAR) && /\.cr-acd\{/.test(CSS), "🔴 crear.html: el profesorado de la Academia, para añadirlo con un tic");
c(/q\.get\("volver"\) === "academia"\) return "academia\.html"/.test(ALI), "   quien se alista desde la Academia vuelve a ella");

// ── 7 · El ensayo deja su rastro en este navegador (y no escribe en ningún servidor)
c(/window\.SG\.rastroAcademia = function/.test(STG) && /localStorage\.setItem\('sgAcademia'/.test(STG), "🔴 SG.rastroAcademia (stargate.js, generado desde el build)");
c(/function rastroAcademia\(\)/.test(SES) && /DIFERIDO&&st\.per&&st\.per===window\.SG_PER_ACADEMIA/.test(SES) && /!st\.miNombre&&!st\.alumno/.test(SES), "   la clase: la de ensayo (DEMO, sin ser su docente) y el diferido de la Academia");
c(/rastroAcademia\(\{ consola: vis \}\)/.test(CONS) && /rastroAcademia\(\{ consola: \{ ficha: true \} \}\)/.test(CONS), "   la consola de ensayo: las secciones y la ficha que abre");
c(/if \(o\.demo\) \{ if \(off\.length && window\.SG\.rastroAcademia\)/.test(STG) && /demo: url\.get\("demo"\) === "1"/.test(CONS), "   la rueda, en ensayo: se apunta y NO se guarda");
c(/rastroAcademia\(\{ panel: true \}\)/.test(CONS) && /rastroAcademia\(\{ estudiante: true \}\)/.test(FUE), "   el Genially en ensayo y la Nave en simulacro");

// ── 8 · El Genially por su código «Insertar»: solo la dirección, y solo de sitios conocidos
const a = CONS.indexOf("var EMBEBIBLES"), b = CONS.indexOf("function miCita()");
const f = new Function(CONS.slice(a, b) + "; return enlaceEmbebible;")();
const ins = '<div style="width: 100%;"><div style="position: relative;"><iframe title="X" frameborder="0" src="https://view.genially.com/66f0c0ffee1234567890abcd" type="text/html" allowfullscreen="true"></iframe></div></div>';
c(f(ins).url === "https://view.genially.com/66f0c0ffee1234567890abcd", "🔴 del código «Insertar» de Genially sale solo su dirección", JSON.stringify(f(ins)));
c(!!f('<iframe src="https://malo.example.com/x"></iframe>').error, "   un iframe de otro sitio, no");
c(!!f('<iframe title="sin src"></iframe>').error && !!f("http://view.genially.com/x").error, "   ni sin dirección, ni sin https");
c(f("https://view.genially.com/abc").url === "https://view.genially.com/abc" && f("").url === "", "   el enlace a secas sigue valiendo (y vacío, vuelve al oficial)");
c(/Los fondos de cada planeta \(Drive del equipo\)/.test(TODO), "   y los fondos de cada planeta para su Genially (el Drive del equipo)");

// ── 9 · Al entrar, docente Y recluta; y la Academia siempre a mano en su Nave (Norberto, 29-sep)
const REC = L("assets/js/recluta.js");
c(/function alistarAuto\(\)/.test(JS) && /M\.alistar\(G, \{ alias: alias, comandante:/.test(JS) && /M\.aliasOcupado\(G, alias/.test(JS) && /return recargar\(\)\.then\(function \(\) \{ return conPermiso\(\); \}\)\.then\(function \(\) \{ if \(!FICHA\) return alistarAuto\(\)\.then\(recargar\); \}\)/.test(JS),
  "🔴 al entrar se le alista SOLO como recluta en el grupo de la Academia (alias libre, escuadrón de quien organiza), y solo con su ficha de formación");
// 🔴 9-oct · SOLO EL PROFESORADO INVITADO (Norberto: «La Academia es SOLO para docentes: los que yo añado manualmente o a través de un enlace»)
c(/function conPermiso\(\)/.test(JS) && /M\.academiaMia\(\)/.test(JS) && /M\.academiaGuardar\(\{ alias: [^}]*\}, \{ invitacion: INV \}\)/.test(JS) && /get\("inv"\)/.test(JS)
  && /e\.sinInvitacion\) return portadaSoloDocentes/.test(JS) && /async function academiaInvitar\(correo\)/.test(MOT) && /invitacion: String\(opciones\.invitacion\)/.test(MOT),
  "🔴 9-oct · sin invitación (su correo autorizado o el enlace ?inv=), ni registro ni alistamiento: sale «solo para el profesorado invitado»");
c(/if \(!d \|\| !d\.bendicion\) \{ var x = new Error\("sin bendición"\); x\.sinBendicion = true; throw x; \}/.test(JS) && /e\.sinBendicion\) return portadaEsperaBendicion\(\)/.test(JS)
  && /Gracias por matricularte en la Academia de la Cero/.test(JS) && /bendición del Comandante/.test(JS),
  "🔴 9-oct · y sin la BENDICIÓN del Comandante, «gracias por matricularte… espera la bendición»: ni curso ni alistamiento");
c(/function claseAlumnado\(\)/.test(JS) && (JS.match(/claseAlumnado\(\) \+/g) || []).length === 2 && /"clase_alumnado": \{"nombre": "PER 16450", "enlace": "alistarse\.html\?per=per-16450&codigo=SYA87B"\}/.test(L("_site_data.py"))
  && /"clase_alumnado"/.test(HTML), "🔴 9-oct · y a quien no es docente, el camino a su clase: «Alistarme en el PER 16450» (y elige allí su comandante)");
c(/data-bendecir/.test(JS) && /M\.academiaBendecir\(uid\)/.test(JS) && /async function academiaBendecir\(uid\)/.test(MOT) && /Espera tu bendición/.test(JS),
  "   y en el panel de quien organiza, «Dar la bendición» a quien espera");
c(/x && x\.bendicion\) bendecidos\[x\.uid\] = true/.test(L("assets/js/crear.js")), "   al crear un grupo, solo se ofrece el profesorado bendecido");
c(/id="acd-org-autorizar"/.test(JS) && /M\.academiaInvitar\(v\)/.test(JS) && /M\.academiaInvitar\(\)\.then/.test(JS) && /academia\.html\?inv=/.test(JS),
  "   el panel de quien organiza: autorizar un correo o crear un enlace de un solo uso");
c(/registrado como docente/.test(JS) && /alistado como recluta/.test(JS), "   y la portada lo dice antes de entrar");
c(/function avisoAcademia\(\)/.test(REC) && /per!==window\.SG_PER_ACADEMIA/.test(REC) && /pestanas\(\)\+avisoAcademia\(\)/.test(REC) && /rastroAcademia\(\{nave:true\}\)/.test(REC),
  "🔴 en su Nave de recluta (grupo de la Academia), la puerta al curso arriba del todo (y apunta «Abre tu Nave»)");
c(/function puertaAcademia\(\)/.test(CONS) && /heroComandante\(\) \+ puertaAcademia\(\)/.test(CONS) && /MOTOR\.academiaMia\(\)\.then/.test(CONS),
  "🔴 y en su Nave de Comandante, si se registró: la puerta, con lo que lleva");
c(/\.acd-puerta\{/.test(CSS), "   con su estilo");

console.log("\n  Batería 115 · la Academia de la Cero");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
