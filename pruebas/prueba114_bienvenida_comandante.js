'use strict';
/**
 * BATERÍA 114 · LA BIENVENIDA DEL COMANDANTE Y SU CITA (28-sep)
 *
 * Norberto: «la primera vez que entra un docente sería genial que revisara su ficha (nombre que le ha puesto el referente),
 * que pudiera cambiar el avatar, que le dijera que el genially es el común a todos, pero que puede cambiarlo… dile que
 * RECUERDE hacer copia, que no modifique la plantilla! Haz que escoja su cita favorita o que genere una automáticamente».
 * Cuatro pasos en una capa sobre el `body` (fuera de la consola), y la cita viaja con el rótulo del Comandante.
 * Dos tropiezos del primer ensayo que no deben volver: `$()` de la consola busca DENTRO de la app (la capa cuelga del
 * `body`: los botones salían nulos) y el prefijo `bv-` ya era de la bienvenida del recluta (`.bv-fila` es otra rejilla).
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const CONS = L("assets/js/consola.js"), CSS = L("assets/css/stargate.css"), STG = L("assets/js/stargate.js");
const MOT = L("assets/js/motor.js"), SES = L("assets/js/sesion.js"), REC = L("assets/js/recluta.js"), TAB = L("motor/tablero.js");
const HTML = L("consola.html");
const global = (html, nombre) => { const i = html.indexOf("window." + nombre + "="); if (i < 0) return undefined;
  const j = html.indexOf(";window.", i); return JSON.parse(html.slice(i + nombre.length + 8, j < 0 ? html.indexOf("</script>", i) : j)); };

// ── 1 · El banco de citas: llega a la consola, sin repetidos, cada una con su autor
const CITAS = global(HTML, "SG_CITAS") || [];
c(CITAS.length >= 30, "🔴 el banco de citas épicas llega a la consola (SG_CITAS)", CITAS.length);
c(CITAS.every(x => Array.isArray(x) && x[0] && x[1] && (x[0] + x[1]).length < 150), "   cada cita con su autor, y cabe en el rótulo");
c(new Set(CITAS.map(x => x[0])).size === CITAS.length, "   sin citas repetidas");
c(CITAS.some(x => /gran responsabilidad/.test(x[0])) && CITAS.some(x => /infinito y más allá/.test(x[0])), "   las dos que pidió Norberto están");

// ── 2 · Cuándo sale: la primera vez (su ficha o este ordenador), nunca en Gestión, y en la demo solo con ?bienvenida=1
const q = CONS.slice(CONS.indexOf("function quizaBienvenida"), CONS.indexOf("function bienvenida(paso)"));
c(/GESTION/.test(q) && /guia\.bienvenida/.test(q) && /sgBienvenida:/.test(q), "🔴 sale una vez: se apunta en su ficha (guia.bienvenida) y en este ordenador");
c(/url\.get\("demo"\) === "1" && !url\.get\("bienvenida"\)/.test(q), "   en la demostración, solo si se pide (?bienvenida=1)");
c(/pintar\(\);\s*quizaBienvenida\(\);/.test(CONS), "   al abrir un grupo");
const demo = CONS.slice(CONS.indexOf("async function demostracion"), CONS.indexOf("function arrancar()"));
c(/quizaBienvenida\(\)/.test(demo), "   y en la demostración");

// ── 3 · Los cuatro pasos
const B = CONS.slice(CONS.indexOf("function bienvenida(paso)"), CONS.indexOf("function releerYPintar"));
c(/MOTOR\.cambiarMiNombre/.test(B) && /te han dado de alta como/.test(B), "🔴 paso 1: revisa el nombre que le puso el referente (y lo cambia en todos sus grupos)");
c(/data-bc-av/.test(B) && /MOTOR\.ponerAvatarDocente/.test(B) && /SG_COMANDANTES_GEN/.test(B), "🔴 paso 2: elige su retrato");
c(/RECUERDA: haz una copia/.test(B) && /No modifiques la plantilla/.test(B) && /SG_PANEL_MAESTRO_EDICION/.test(B), "🔴 paso 3: el Genially común, cómo cambiarlo, y RECUERDA hacer copia");
c(/Sorpréndeme/.test(B) && /SG_CITAS/.test(B) && /MOTOR\.citaEnGrupo/.test(B), "🔴 paso 4: su cita, escrita o al azar del banco, en todos sus grupos");
c(/sgBienvenidaPaso/.test(B) && /location\.reload/.test(B), "   al cambiar de nombre recarga y sigue donde iba");
c(/guia: \{ bienvenida: 1 \}/.test(B), "   al terminar (o «Ahora no») se apunta en su ficha");
c(/DEMO = url\.get\("demo"\) === "1"/.test(B) && /\(DEMO \? Promise\.resolve\(\)/.test(B) && /c !== miCita\(\) && !DEMO/.test(B), "   en la demostración no escribe nada");

// ── 4 · Los dos tropiezos del 28-sep
c(!/\$\("#bc-/.test(B) && /capa\.querySelector\("#bc-sig"\)/.test(B), "🔴 la capa se busca en sí misma, no con $() (que solo mira dentro de la app)");
c(!/\bbv-/.test(B) && /\.bc-capa\{/.test(CSS) && /\.bc-fila input,\.bc-fila textarea\{/.test(CSS), "🔴 prefijo propio (bc-): .bv-fila es la rejilla de la bienvenida del recluta");
c(/\.bc-avas\{[^}]*grid-auto-rows:max-content/.test(CSS), "   los retratos, cuadrados también en el móvil");
c(/<textarea id="bc-cita"/.test(B), "   la cita larga se lee entera (dos líneas)");

// ── 5 · La cita viaja: se guarda en el grupo, el tablero la sirve y el rótulo la pinta
c(/async function citaEnGrupo\(perId, nombre, cita\)/.test(MOT) && /"stargate\.citas": C/.test(MOT) && /citaEnGrupo[,\s]/.test(MOT.slice(MOT.indexOf("window.SG.MOTOR"))), "🔴 motor: citaEnGrupo guarda en stargate.citas[nombre] (y se exporta)");
c(/\.slice\(0, 160\)/.test(MOT.slice(MOT.indexOf("async function citaEnGrupo"))), "   con tope de 160 caracteres");
c(/citas: S\.citas \|\| \{\}/.test(TAB), "   el tablero público la sirve");
const a = STG.indexOf("window.SG.avatarComandante = function"), b = STG.indexOf("window.SG.CFGSESION");
const win = { SG: {} }; new Function("window", STG.slice(a, b))(win);
const rt = win.SG.rotulo({ nombre: "Norberto Cuartero", avatar: "c3", escuadron: "Los Yunques", grupo: "DEMO", clase: "grande", cita: "Hasta el <b>infinito</b>" });
c(/class="rt-cita">Hasta el &lt;b&gt;infinito&lt;\/b&gt;<\/em>/.test(rt), "🔴 el rótulo pinta la cita (escapada)", rt.slice(0, 300));
c(!/rt-cita/.test(win.SG.rotulo({ nombre: "N", avatar: "c3", clase: "grande" })), "   sin cita, nada");
c(/citas\)\|\|\{\}\)\[quien\]/.test(SES) && /citas\) \|\| \{\}\)\[jefe\]/.test(REC) && /cita: miCita\(\)/.test(CONS), "   en la sesión, en la Nave del recluta y en la firma del foro");
c(/cn-cita/.test(CONS) && /\.cn-ficha-t \.cn-cita\{/.test(CSS), "   y bajo su nombre, en su Nave");

console.log("\n  Batería 114 · la bienvenida del Comandante y su cita");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
