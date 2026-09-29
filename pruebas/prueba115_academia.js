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
c(JSON.stringify(E.map(e => e.id)) === JSON.stringify(["historia", "temario", "elementos", "organizacion", "alta", "retos", "vivirlo", "comandante", "tuya"]),
  "🔴 nueve sesiones en el orden de Norberto: historia, temario, elementos, organización, alta, la parte del recluta, el panel y la personalización", E.map(e => e.id).join(","));
c(C.titulo === "La Academia de la Cero" && C.final.titulo === "Comandante de la Cero", "   «La Academia de la Cero» y, al terminar, «Comandante de la Cero»");
c(C.organiza && C.organiza.correo === "n.cuartero.10@gmail.com", "   organiza Norberto (n.cuartero.10)");
c(A.per === "academia-cero" && C.grupo === A.per, "   su grupo propio: academia-cero");
c(/^[A-HJ-NP-Z2-9]{6}$/.test(C.codigo), "🔴 el grupo existe: su código de clase está en los datos (lo escribió academia_grupo.cjs --crear)", C.codigo);

// ── 2 · Poco a poco: píldoras cortas, pocas por sesión, con su tiempo
c(E.every(e => Number(e.min) > 0 && Number(e.min) <= 25), "🔴 cada sesión dice cuánto dura (y ninguna pasa de 25 minutos)");
c(E.every(e => e.bloques.length >= 2 && e.bloques.length <= 5), "   entre 2 y 5 píldoras por sesión");
c(E.every(e => e.bloques.every(b => b.p.replace(/<[^>]+>/g, "").length <= 700)), "   ninguna píldora es un muro de texto (≤ 700 caracteres)",
  E.map(e => e.bloques.map(b => b.p.replace(/<[^>]+>/g, "").length)).join(" | "));
c(E.every(e => e.hitos.length >= 1 && e.hitos.length <= 4), "   entre 1 y 4 hitos por sesión");
c(/function pantallas\(i\)/.test(JS) && /\{ t: "entrada" \}/.test(JS) && /t: "idea"/.test(JS) && /t: "hito"/.test(JS) && /\{ t: "fin" \}/.test(JS),
  "🔴 cada sesión, pantalla a pantalla: entrada → una idea → un hito → completada");
c(/function pintarPreguntas/.test(JS) && /Pregunta ' \+ \(R\.k \+ 1\)/.test(JS) && /R\.visto = true/.test(JS), "🔴 los cuestionarios, pregunta a pregunta, con su porqué al momento");
c(/¿Suficiente por hoy\?/.test(JS) && /seguirás justo donde lo dejaste/.test(JS) && /lsPoner\("pos"/.test(JS), "   al acabar cada sesión, «¿Suficiente por hoy?», y se sigue donde se dejó");
c(/sesiones más, que se abren/.test(JS) && /function abierta\(i\)/.test(JS), "   el mapa no enseña todo el camino: lo hecho, la de ahora y cuántas quedan");

// ── 3 · Los hitos, autocorregibles
const TIPOS = ["quiz", "clasificar", "auto", "diseno"], AUTO = /^(alta|reto|reto:[A-Z]\d|ruta:m\d|repaso|sim:(consola|clase|estudiante|rueda|panel)|dif:\d+)$/;
const hitos = [].concat(...E.map(e => e.hitos));
c(hitos.every(h => TIPOS.indexOf(h.tipo) >= 0), "   todos los hitos son de un tipo que se corrige solo");
c(hitos.filter(h => h.tipo === "quiz").every(h => h.preguntas.every(q => q.ok >= 0 && q.ok < q.o.length && q.porque) && h.minimo <= h.preguntas.length && h.minimo >= Math.ceil(h.preguntas.length * .6)),
  "🔴 cada pregunta tiene su buena y su porqué, y el mínimo es exigente (≥ 60 %)");
c(hitos.filter(h => h.tipo === "clasificar").every(h => h.items.every(i => ["componente", "mecanica", "dinamica"].indexOf(i[1]) >= 0 && i[2])), "   clasificar: componente, mecánica o dinámica, con su porqué");
c(hitos.filter(h => h.tipo === "auto").every(h => AUTO.test(h.comprobar)), "   cada misión dice qué comprueba la plataforma", hitos.filter(h => h.tipo === "auto").map(h => h.comprobar).join(","));
c(hitos.some(h => h.comprobar === "reto:L1") && /imagen con IA/.test(JSON.stringify(E)), "🔴 la actividad del alumnado: el relámpago L1, la imagen con IA (la comenta Claude)");
c(new Set(hitos.map(h => h.id)).size === hitos.length, "   ids de hito únicos");
c(/completedMissionIds/.test(JS) && /G \+ "__" \+ m\[1\]/.test(JS) && /stargateRuta/.test(JS) && /\.medalla !== "nada"/.test(JS), "   los retos y la Ruta se leen de SU ficha en el grupo de la Academia");

// ── 4 · Nada de destripes (el repo es público)
const TODO = JSON.stringify(C);
c(!/Ashan|Archivista|Oren|Fragmento Prohibido|se convirtieron en NEBULA|antena/i.test(TODO), "🔴 sin destripes: ni qué fue de la Cero, ni quién es NEBULA, ni el pasado de Vaeon");
// (en lo que se VE: los datos y el código sin sus comentarios, que llevan el 🔴 de la casa)
const JS_SIN_COMENT = JS.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
c(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(TODO + JS_SIN_COMENT), "   sin emojis en lo que se ve");

// ── 5 · Las imágenes existen
const imgs = [].concat(...E.map(e => [e.pj, e.bg]));
c(imgs.every(f => fs.existsSync(path.join(R, f))), "   los personajes y los fondos de cada sesión existen", imgs.filter(f => !fs.existsSync(path.join(R, f))).join(","));

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

console.log("\n  Batería 115 · la Academia de la Cero");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
