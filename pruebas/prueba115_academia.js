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

// ── 1 · Los objetivos, en su orden (de lo más grande a lo más concreto)
// 30-sep · planeta a planeta (Norberto eligió la B del borrador: un prólogo en la Cero y una sesión por planeta)
c(JSON.stringify(E.map(e => e.id)) === JSON.stringify(["cero", "forge", "ecos", "sendara", "reliae", "umbral", "ludo", "vinculo", "liminar"]),
  "🔴 la Cero y los ocho planetas, en el orden del viaje", E.map(e => e.id).join(","));
c(JSON.stringify(E.slice(1).map(e => e.planeta)) === JSON.stringify(["Fôrge", "Ecos", "Sendara", "Reliae", "Umbral", "Ludo", "Vínculo", "Liminar"]) &&
  E.slice(1).every((e, k) => new RegExp("^Tema " + (k + 1) + " · ").test(e.tema)), "   cada planeta, con su tema (Fôrge el 1… Liminar el 8)");
c(C.titulo === "La Academia de la Cero" && C.final.titulo === "Comandante de la Cero", "   «La Academia de la Cero» y, al terminar, «Comandante de la Cero»");
c(C.organiza && C.organiza.correo === "n.cuartero.10@gmail.com", "   organiza Norberto (n.cuartero.10)");
c(A.per === "academia-cero" && C.grupo === A.per, "   su grupo propio: academia-cero");
c(/^[A-HJ-NP-Z2-9]{6}$/.test(C.codigo), "🔴 el grupo existe: su código de clase está en los datos (lo escribió academia_grupo.cjs --crear)", C.codigo);

// ── 2 · Poco a poco y con la cara de las clases en directo
c(E.every(e => Number(e.min) > 0 && Number(e.min) <= 25), "🔴 cada sesión dice cuánto dura (y ninguna pasa de 25 minutos)");
c(E.every(e => e.piezas.length >= 2 && e.piezas.length <= 3), "   dos o tres piezas de la herramienta por sesión");
c(E.every(e => e.piezas.every(b => b.p.replace(/<[^>]+>/g, "").length <= 700)), "   ninguna pieza es un muro de texto (≤ 700 caracteres)",
  E.map(e => e.piezas.map(b => b.p.replace(/<[^>]+>/g, "").length)).join(" | "));
const PLAN = E.slice(1);
c(PLAN.every(e => e.carta && e.retrato && e.cita && e.quien && e.historia), "🔴 cada planeta, con su tripulante: su carta, su retrato, su lema y su historia");
c(E.every(e => (e.historia.match(/[.!?](\s|$)/g) || []).length <= 2), "   la historia, en dos frases como mucho", E.map(e => (e.historia.match(/[.!?](\s|$)/g) || []).length).join(","));
c(/function pantallas\(i\)/.test(JS) && /\{ t: "llegada" \}/.test(JS) && /t: "historia"/.test(JS) && /t: "pieza"/.test(JS) && /t: "hito"/.test(JS) && /\{ t: "fin" \}/.test(JS),
  "🔴 cada sesión, pantalla a pantalla: la llegada → la historia → las piezas → un hito por pantalla → completada");
c(/class="acd-dia ' \+ cls/.test(JS) && /acd-dia-barra/.test(JS) && /acd-flecha ant/.test(JS) && /\.acd-dia\{position:relative;isolation:isolate;overflow:hidden;border-radius:20px;border:1px solid var\(--line\);background:#060a12;aspect-ratio:16\/9/.test(CSS),
  "🔴 con la cara de las clases en directo: diapositiva 16:9, fondo del planeta, flechas y barra de pasos");
c(/@media \(max-width:980px\)\{\s*\.acd-dia\{aspect-ratio:auto/.test(CSS), "   en el móvil (y en ventanas estrechas), la diapositiva crece con su contenido");
c(/ev\.key === "ArrowRight"/.test(JS) && /ev\.key === "ArrowLeft"/.test(JS), "   y se pasa con las flechas del teclado, como la clase");
c(/¿Suficiente por hoy\?/.test(JS) && /seguirás justo donde lo dejaste/.test(JS) && /lsPoner\("pos"/.test(JS), "   al acabar cada sesión, «¿Suficiente por hoy?», y se sigue donde se dejó");
c(/sesiones más, que se abren/.test(JS) && /function abierta\(i\)/.test(JS), "   el mapa no enseña todo el camino: lo hecho, la de ahora y cuántas quedan");

// ── 3 · Las preguntas, DENTRO de un minijuego distinto por planeta (Norberto: «¡usa los minijuegos para preguntar!»)
c(E[0].juego == null && PLAN.every(e => e.juego && e.juego.maquina && e.juego.n), "🔴 cada planeta tiene su minijuego (la Cero, el prólogo, no)");
const maq = PLAN.map(e => e.juego.maquina), arcade = maq.filter(m => !/^ruta:/.test(m));
c(JSON.stringify(arcade.slice().sort()) === JSON.stringify(["conquista", "descenso", "evacuacion", "laberinto", "ruta-azul"]) && new Set(maq).size === maq.length,
  "🔴 un minijuego distinto en cada planeta: las cinco máquinas de Joran y la Ruta (a Ludo, Vínculo y Liminar)", maq.join(","));
c(maq.filter(m => /^ruta:m\d$/.test(m)).length === 3, "   la Ruta, en tres tramos distintos");
c(PLAN.every(e => e.preguntas.length === 5), "🔴 cinco preguntas por planeta", PLAN.map(e => e.preguntas.length).join(","));
c(PLAN.every(e => e.preguntas.every(q => q.p && q.o.length >= 3 && q.o.length <= 4 && q.ok === 0 && q.porque && new Set(q.o).size === q.o.length)),
  "   cada una con 3 o 4 opciones distintas (la Ruta no admite más), su buena y su porqué");
c(/function hitoJuego\(e\)/.test(JS) && /tipo: "juego"/.test(JS) && /e\.hitos\.concat\(e\.juego \? \[hitoJuego\(e\)\] : \[\]\)/.test(JS), "   el juego es un hito más de su sesión (se da por hecho al acertarlas todas)");
c(/"&banco=academia&embed=1&tanda=" \+ encodeURIComponent\(e\.id\)/.test(JS) && /window\.SG_BANCO_JUEGO = e\.preguntas/.test(JS), "   se abre en modo Academia, con sus preguntas");
c(/ev\.origin !== location\.origin/.test(JS) && /m\.tanda !== e\.id/.test(JS) && /if \(m\.todas\)/.test(JS) && /if \(m\.siguiente\)/.test(JS), "🔴 y la Academia escucha al juego: «todas» (hito hecho) y «siguiente» (sin fiarse de otros orígenes)");
c(/function escribiendo\(\) \{ var t = document\.activeElement && document\.activeElement\.tagName; return JUGANDO \|\|/.test(JS), "   mientras se juega, la página no se repinta sola (se perdería la partida)");

// ── 4 · Una misión en la consola de ensayo por sesión, y lo real en el grupo de la Academia
const hitos = [].concat(...E.map(e => e.hitos)), AUTO = /^((alta|nave|reto:[A-Z]\d|ruta:m\d|repaso|dif:\d+|sim:(clase|rueda|panel)|ens:[a-z]+)(\+|$))+$/;
const ensayo = (h) => h.tipo === "auto" && String(h.comprobar).split("+").every(x => /^(sim|ens):/.test(x));
c(E.every(e => e.hitos.filter(ensayo).length === 1), "🔴 UNA misión en la consola de ensayo por sesión", E.map(e => e.hitos.filter(ensayo).length).join(","));
c(hitos.every(h => ["auto", "diseno"].indexOf(h.tipo) >= 0), "   todos los hitos se corrigen solos (o los comenta Claude: el diseño)");
c(hitos.filter(h => h.tipo === "auto").every(h => AUTO.test(h.comprobar)), "   cada misión dice qué se comprueba", hitos.filter(h => h.tipo === "auto").map(h => h.comprobar).join(","));
c(hitos.some(h => h.comprobar === "reto:L1") && /imagen con IA/.test(JSON.stringify(E)), "🔴 la actividad del alumnado: el relámpago L1, la imagen con IA (la comenta Claude)");
c(hitos.some(h => h.comprobar === "alta") && hitos.some(h => h.comprobar === "ruta:m0") && hitos.some(h => h.tipo === "diseno"), "   lo real: su ficha de recluta, su primer vuelo y su primera pieza");
c(new Set(hitos.map(h => h.id).concat(PLAN.map(e => e.id + "-juego"))).size === hitos.length + PLAN.length, "   ids de hito únicos");
c(/completedMissionIds/.test(JS) && /G \+ "__" \+ m\[1\]/.test(JS) && /stargateRuta/.test(JS) && /\.medalla !== "nada"/.test(JS), "   los retos y la Ruta se leen de SU ficha en el grupo de la Academia");
c(/function hechosEnsayo\(\)/.test(JS) && /sgEnsayo\.hechos/.test(JS) && /String\(c\)\.split\("\+"\)\.every\(autoOk\)/.test(JS), "   lo hecho en el ensayo se lee de este navegador, y una misión compuesta pide todas sus partes");

// ── 5 · Nada de destripes (el repo es público)
const TODO = JSON.stringify(C);
c(!/Ashan|Archivista|Oren|Fragmento Prohibido|se convirtieron en NEBULA|antena/i.test(TODO), "🔴 sin destripes: ni qué fue de la Cero, ni quién es NEBULA, ni el pasado de Vaeon");
// (en lo que se VE: los datos y el código sin sus comentarios, que llevan el 🔴 de la casa)
const JS_SIN_COMENT = JS.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
c(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(TODO + JS_SIN_COMENT), "   sin emojis en lo que se ve");
const imgs = [].concat(...E.map(e => [e.pj, e.bg, e.suelo, e.carta, e.retrato].concat(e.piezas.map(b => b.img)))).filter(Boolean);
c(imgs.every(f => fs.existsSync(path.join(R, f))), "   los fondos, los tripulantes y los pantallazos existen", imgs.filter(f => !fs.existsSync(path.join(R, f))).join(","));
c(["maq_conquista", "maq_evacuacion", "maq_laberinto", "maq_rutaazul", "maq_descenso", "maq_vuelo"].every(k => fs.existsSync(path.join(R, "juegos/joran/img", k + ".jpg"))), "   y la imagen de cada máquina");

// ── 6 · La página, el motor y el registro del profesorado
c(/window\.SG_ACADEMIA=/.test(HTML) && /window\.SG_PER_ACADEMIA=/.test(HTML) && /assets\/js\/academia\.js\?v=/.test(HTML) && /noindex/.test(HTML), "   academia.html: sus datos, su script con huella y fuera de los buscadores");
c(/async function academiaGuardar/.test(MOT) && /"stargate_formacion"/.test(MOT) && /academiaMia, academiaGuardar, academiaEscuchar, academiaProfes/.test(MOT), "🔴 motor: su documento en stargate_formacion/{uid} (y la lista para crear grupos)");
c(/correo: String\(yo\.correo/.test(MOT.slice(MOT.indexOf("async function academiaGuardar"))), "   con su correo de Google (el de verdad)");
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
c(/Que no se note el cambio/.test(TODO) && /fondos/.test(TODO), "   y los fondos de la clase para su Genially («que no se note»)");

// ── 9 · Al entrar, docente Y recluta; y la Academia siempre a mano en su Nave (Norberto, 29-sep)
const REC = L("assets/js/recluta.js");
c(/function alistarAuto\(\)/.test(JS) && /M\.alistar\(G, \{ alias: alias, comandante:/.test(JS) && /M\.aliasOcupado\(G, alias/.test(JS) && /if \(!FICHA\) return alistarAuto\(\)\.then\(recargar\)/.test(JS),
  "🔴 al entrar se le alista SOLO como recluta en el grupo de la Academia (alias libre, escuadrón de quien organiza)");
c(/registrado como docente/.test(JS) && /alistado como recluta/.test(JS), "   y la portada lo dice antes de entrar");
c(/function avisoAcademia\(\)/.test(REC) && /per!==window\.SG_PER_ACADEMIA/.test(REC) && /pestanas\(\)\+avisoAcademia\(\)/.test(REC) && /rastroAcademia\(\{nave:true\}\)/.test(REC),
  "🔴 en su Nave de recluta (grupo de la Academia), la puerta al curso arriba del todo (y apunta «Abre tu Nave»)");
c(/function puertaAcademia\(\)/.test(CONS) && /heroComandante\(\) \+ puertaAcademia\(\)/.test(CONS) && /MOTOR\.academiaMia\(\)\.then/.test(CONS),
  "🔴 y en su Nave de Comandante, si se registró: la puerta, con lo que lleva");
c(/\.acd-puerta\{/.test(CSS), "   con su estilo");

console.log("\n  Batería 115 · la Academia de la Cero");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
