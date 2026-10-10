/**
 * BATERÍA 146 · LA SESIÓN, EN EL ORDEN DE CADA DOCENTE, ARRASTRANDO (10-oct)
 * ------------------------------------------------------------------------------------------------
 * Norberto: «además de que el docente pueda marcar las diapositivas que quiere ver, estaría genial que las pudiera reorganizar
 * de forma sencilla arrastrando». Eligió mover SECCIONES, con un orden para todas las semanas y por docente.
 *
 * La pieza es del motor (GamificaPro sdk/ordena.js, `GP.ordena`; su prueba, tests/sdk/ordena.test.ts) y aquí se copia en el
 * build. La rueda (SG.CFGSESION, en la plantilla de stargate.js) va en el orden de la clase con un asa ⠿ por sección y guarda
 * `stargate.modOrdenSesion` (por nombre, como `sesiones`); la sesión (sesion.js, enSuOrden) lo aplica; el alumnado lo recibe
 * por el tablero (motor/tablero.js). En el laboratorio, de verdad: prueba 67, sección 46.
 */
const fs = require("fs"), path = require("path");
const raiz = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(raiz, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };

console.log("▶ 146 · La sesión, en el orden de cada docente");
const SES = leer("assets/js/sesion.js"), SG = leer("assets/js/stargate.js"), CONS = leer("assets/js/consola.js"), TAB = leer("motor/tablero.js");
const BUILD = leer("_build_site.py"), ORD = leer("assets/js/ordena.js");

// ── 1 · la pieza, copiada del motor y cargada donde hace falta
c(/GB\.copiar_pieza\(HERE, "ordena\.js"/.test(BUILD) && /window\.GP\.ordena = \{ fusionar: fusionar, aplicar: aplicar, lista: lista/.test(ORD), "🔴 la pieza del motor (sdk/ordena.js), copiada por el build");
const GP_AL_LADO = path.join(raiz, "..", "..", "gamificapro", "sdk", "ordena.js");
if (fs.existsSync(GP_AL_LADO) && fs.readFileSync(GP_AL_LADO, "utf8").indexOf("window.GP.ordena") >= 0)
  c(fs.readFileSync(GP_AL_LADO, "utf8") === ORD || !!process.env.GAMIFICAPRO_DIR, "   y es la misma que la de GamificaPro (no se edita aquí)");
const v = (h) => (leer(h).match(/<script src="assets\/js\/ordena\.js\?v=([0-9a-f]+)" defer><\/script>/) || [])[1];
c(["consola.html", "sesion.html", "ensayo.html"].every(v), "   con su huella, en la consola, la sesión y la consola de ensayo", ["consola.html", "sesion.html", "ensayo.html"].map(v));
c(!v("recluta.html") && !v("index.html"), "   y no donde no hay rueda (la Nave del recluta, la portada)");

// ── 2 · la rueda, en el orden de la clase
const SECC = JSON.parse(leer("sesion.html").match(/window\.SG_SECCIONES_SESION=(\[.*?\]);/s)[1]).map(x => x[0]);
c(SECC[0] === "portada" && SECC[SECC.length - 1] === "directo" && SECC.length === 25, "🔴 las secciones, de la portada a «En directo» (las 25)", SECC);
const iS = k => SECC.indexOf(k);
c(iS("llamada") < iS("pregunta") && iS("pregunta") < iS("ticket") && iS("ticket") < iS("mensaje") && iS("mensaje") < iS("videos")
  && iS("asedio") < iS("despegue") && iS("despegue") < iS("misiones") && iS("cierre") < iS("ruta"), "   en el orden en que salen en la clase (sesion.js, construir)");
c(/var FIJAS = \{ portada: [^}]*directo: /.test(SG) && /data-ordena-asa/.test(SG) && /aria-label="Mover «/.test(SG), "🔴 cada sección con su asa ⠿ (con nombre para el lector de pantalla); la portada y «En directo», con candado");
c(/stargate\.modOrdenSesion/.test(SG) && /function guardarOrden\(per, nombre, orden\)/.test(SG) && /if \(orden && orden\.length\) m\[nombre\] = orden; else delete m\[nombre\];/.test(SG),
  "   se guarda en el grupo, por nombre (y el orden de serie no se guarda: se quita lo suyo)");
c(/data-cfg-orden>Orden de serie/.test(SG) && /Guardado el orden/.test(SG), "   con «Orden de serie» y el aviso de guardado");
c(/var ASAS = !!\(window\.GP && window\.GP\.ordena && o\.nombre\)/.test(SG), "   sin la pieza (una página vieja en caché), la rueda sigue como antes: sin asas");

// ── 3 · la sesión lo aplica, y el alumnado también
c(/return enSuOrden\(todo\);/.test(SES) && /return todo\.length\?enSuOrden\(todo\):\[diaEmbarque\(s\)\];/.test(SES), "🔴 la sesión (y la del embarque) sale en su orden");
c(/var FIJAS_SESION=\['portada','embarque_portada','ticket_form','directo','hasta'\];/.test(SES), "   la portada delante; el ticket de salida, «En directo» y «Hasta pronto», al final");
c(/st\.ordenDelGrupo\|\|\(st\.d&&st\.d\.modOrdenSesion\)/.test(SES) && /st\.profeMio/.test((SES.match(/function ordenGuardado\(\)\{[\s\S]*?\n  \}/) || [""])[0]),
  "   el docente lee el suyo del grupo; el recluta, el de SU Comandante (por el tablero)");
c(/modOrdenSesion: S\.modOrdenSesion \|\| \{\}/.test(TAB), "   el tablero lo pasa (motor/tablero.js)");
c(/configFresca\(per, hecho && !!st\.miNombre\)/.test(SES) && /st\.i===0 && \(tarde \|\|/.test(SES),
  "🔴 si su nombre llega tarde (la sesión ya salió de serie), se repinta con su rueda y su orden, si sigue en la portada");
c(/orden: ord\[nombre\] \|\| \[\]/.test(CONS) && /alOrdenar:/.test(CONS) && /orden:ordenGuardado\(\)/.test(SES) && /alOrdenar:function\(o\)/.test(SES),
  "   la rueda se abre con su orden desde la consola y desde la sesión, y al reordenar se pone al día sin recargar");

// ── 4 · con la pieza de verdad: lo de siempre, si no hay orden; y lo suyo, si lo hay
global.window = {};
require(path.join(raiz, "assets/js/ordena.js"));
const O = global.window.GP.ordena;
const SEC_DE_K = Function("return " + (SES.match(/var SEC_DE_K=(\{[\s\S]*?\});/) || [])[1])();
const secDe = x => x.sec || SEC_DE_K[x.k] || "misiones";
const fijo = x => ["portada", "embarque_portada", "ticket_form", "directo", "hasta"].indexOf(x.k) >= 0;
// una clase que cierra tema, como la arma construir()
const CLASE = [{ k: "portada" }, { k: "llamada" }, { k: "pregunta", sec: "pregunta" }, { k: "ticket", sec: "ticket" }, { k: "ticket_escuadron", sec: "ticket" },
  { k: "ticket_dudas", sec: "ticket" }, { k: "foro" }, { k: "video", sec: "videos" }, { k: "movido" }, { k: "top" }, { k: "votacion" }, { k: "escuadrones" },
  { k: "genially" }, { k: "video", sec: "misiones" }, { k: "act" }, { k: "reto" }, { k: "insignias" }, { k: "video", sec: "cierre" }, { k: "ruta" },
  { k: "ticket_form", sec: "ticket" }, { k: "directo", sec: "directo" }, { k: "hasta", sec: "cierre" }];
const ks = L => L.map(x => x.k + (x.sec ? ":" + x.sec : ""));
const op = { base: SECC, fijo };
c(JSON.stringify(O.aplicar(CLASE, secDe, [], op)) === JSON.stringify(CLASE), "🔴 sin orden guardado, la clase EXACTAMENTE como siempre");
const L = O.aplicar(CLASE, secDe, ["pregunta", "llamada", "despegue"].concat(SECC.filter(k => ["pregunta", "llamada", "despegue", "portada", "directo"].indexOf(k) < 0)), op);
c(L.length === CLASE.length && L[0].k === "portada" && ks(L).slice(-3).join(",") === "ticket_form:ticket,directo:directo,hasta:cierre", "🔴 con su orden: la portada delante y el cierre al final, sin perder ninguna", ks(L));
c(L[1].k === "pregunta" && L[2].k === "llamada" && L[3].k === "genially", "   y lo demás, en el suyo (la pregunta, la llamada, el despegue…)", ks(L).slice(0, 5));
c(ks(L).filter(x => /ticket/.test(x) && x !== "ticket_form:ticket").join(",") === "ticket:ticket,ticket_escuadron:ticket,ticket_dudas:ticket", "   lo de una sección va junto y en su orden («Cómo os fue», el escuadrón, «Lo que escribisteis»)");

console.log("\n  Batería 146 · " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
if (fallos.length) process.exit(1);
