'use strict';
/**
 * BATERÍA 109 · LOS VEINTE RETOS Y LA PREGUNTA DE LA CLASE (23-sep-2026).
 *
 * Norberto: «antes esta asignatura tenía solo ocho retos y ahora tiene 27. Nos hemos pasado. Yo creo que dos retos por
 * tema y alguno extra es suficiente»; «los retos deben de ser prácticos (crear algo, diseñar, encontrar…)»; y de la
 * reflexión: «solo lanzamos la pregunta de reflexión y el docente la va respondiendo durante la clase» — «aparece el
 * comandante recortado con la pregunta en grande. No pongas nada más, sin explicaciones».
 *
 * Y de los comandantes: «una imagen de cada comandante de cuerpo completo con 3 poses… una con cara de duda cuando
 * lanzamos la pregunta, otra con cara de desafío con los retos y otra saludando con la mano».
 *
 * Lo que se vigila: el catálogo es exactamente el acordado (y sale del documento maestro, con sus nombres LITERALES),
 * PUA lleva lo mismo, los relámpago no cierran planeta, cada clase del calendario oficial trae su pregunta, y las tres
 * diapositivas del comandante se MONTAN de verdad (se ejecuta el trozo de `sesion.js` que las pinta).
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt + (dato === undefined ? "" : "  →  " + dato)); };

// ── 1 · el catálogo: dos retos por tema y alguno extra
const D = vm.createContext({});
vm.runInContext(L("apps-script/Datos.gs"), D, { filename: "Datos.gs" });
const REG = D.RETOS_REGULAR, PUA = D.RETOS_PUA;
const ids = REG.map(r => r[0]);
const ACORDADOS = ["A0", "L0", "L1", "B1", "X1", "L2", "B2", "L3", "B3", "X2", "L4", "B4", "L5", "B5", "L6", "B6", "L7", "B7", "S7", "L8", "B8", "XS"];
c(JSON.stringify(ids) === JSON.stringify(ACORDADOS), "🔴 el catálogo es el acordado: la presentación, la hoja de ruta, y un relámpago y un principal por tema (+ actividades, secreto y simulacro)", ids.join(","));
const practicos = ids.filter(id => /^[LB]\d$/.test(id));
c(practicos.length === 17, "   17 retos prácticos (L0 y L1–L8 en clase, B1–B8 en casa): con A0 y las dos actividades, veinte", practicos.length);
for (let t = 1; t <= 8; t++) {
  const delTema = REG.filter(r => r[4] === t && /^[LB][1-8]$/.test(r[0])).map(r => r[0]);
  c(delTema.join(",") === "L" + t + ",B" + t, "   tema " + t + ": su relámpago y su reto principal", delTema.join(","));
}
c(JSON.stringify(PUA.map(r => r.slice(0, 5))) === JSON.stringify(REG.map(r => r.slice(0, 5))),
  "🔴 PUA lleva los mismos retos, con el mismo valor (antes el principal valía más en PUA)");
c(REG.every(r => !/,/.test(r[1])), "   ningún título lleva coma (el lector del formato viejo parte por comas)");
c(REG.filter(r => /^B\d$/.test(r[0])).every(r => /^Reto principal «/.test(r[1])) && REG.filter(r => /^L\d$/.test(r[0])).every(r => /^Reto relámpago «/.test(r[1])),
  "   y cada uno dice lo que es: «Reto relámpago» (en clase) o «Reto principal» (en casa)");

// el documento maestro manda: los nombres salen de él, literales
const MAESTRO = fs.readFileSync(path.join(R, "..", "RETOS_INSIGNIAS_STARGATE.md"), "utf8");
const nombre = t => (String(t).match(/«([^»]+)»/) || [, ""])[1];
const sinNombre = REG.filter(r => /^[LB]\d$/.test(r[0])).filter(r => MAESTRO.indexOf("«" + nombre(r[1]) + "»") < 0).map(r => r[0]);
c(!sinNombre.length, "🔴 cada relámpago y cada principal está, con su nombre literal, en RETOS_INSIGNIAS_STARGATE.md (un dato, un sitio)", sinNombre.join(","));
c(/\*\*Relámpago\*\* \(en clase\)/.test(MAESTRO) && /\*\*Reto principal\*\* \(en casa\)/.test(MAESTRO) && /\*\*20 retos\*\*/.test(MAESTRO), "   y el documento explica la mecánica: relámpago en clase, principal en casa");

// ── 2 · el motor nuevo: los relámpago no cierran planeta
const PAQ = L("motor/paquete.js");
c(/isMandatory: r\.id\.charAt\(0\) !== "S" && r\.id\.charAt\(0\) !== "L" && r\.id !== "XS"/.test(PAQ),
  "🔴 obligatorios: el principal y las actividades; el relámpago, el secreto y el simulacro, no");
c(/optionalMissionIds: mias\.filter\(function \(m\) \{ return !m\.isMandatory; \}\)/.test(PAQ), "   y la campaña del planeta lista como opcional justo lo que no es obligatorio (web y servidor, lo mismo)");
const hechos = {}; REG.filter(r => r[4] === 1 && /^[AB]\d$|^X\d$/.test(r[0])).forEach(r => (hechos[r[0]] = 1));
c(JSON.stringify(D.planetasCompletos_(hechos, "REGULAR")) === "[1]", "🔴 el planeta 1 se cierra sin los relámpago: faltar a una clase no cierra la puerta");

// ── 3 · la pregunta de cada clase, del calendario oficial
const HTML = L("sesion.html");
function global(n) {
  const i = HTML.indexOf("window." + n + "=");
  const j = HTML.indexOf(";window.", i), k = HTML.indexOf(";</script>", i);
  const fin = j < 0 || (k >= 0 && k < j) ? k : j;
  return JSON.parse(HTML.slice(i + ("window." + n + "=").length, fin));
}
const SEMS = global("SG_SEMANAS"), RETOS = global("SG_RETOS");
const conPregunta = SEMS.filter(s => (s.preguntas || []).length).map(s => s.sem);
c(JSON.stringify(conPregunta) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
  "🔴 las catorce semanas de clase traen su pregunta (la 15, la del repaso, no)", conPregunta.join(","));
const todas = [].concat(...SEMS.map(s => s.preguntas || []));
c(todas.every(q => /^\d+$/.test(q[0]) && /^¿/.test(q[1]) && /\?$/.test(q[1])), "   cada una con su número de clase y escrita como pregunta (¿…?)");
c(SEMS.filter(s => s.sem === 10)[0].preguntas.length === 2, "   y la semana de dos clases con pregunta (la 10) lleva las dos");
c(/\("pregunta", "La pregunta de la clase"/.test(L("_site_data.py")), "   es una sección con nombre: el docente puede quitarla de su sesión");

// ── 4 · las tres diapositivas del comandante, montadas de verdad
const S = L("assets/js/sesion.js");
const entre = (a, b) => { const i = S.indexOf(a), j = S.indexOf(b, i); return i < 0 || j < 0 ? "" : S.slice(i, j); };
const trozo = entre("function cmdCuerpo(pose, cls){", "  function diaPortada(s, n){");
const win = { SG: {} };
const STG = L("assets/js/stargate.js");
const ayudante = n => { const i = STG.indexOf("window.SG." + n + " = function"); return STG.slice(i, STG.indexOf("\n};", i) + 3); };
new Function("window", ayudante("comandanteCuerpo") + ayudante("comandanteHd") + ayudante("avatarRetrato"))(win);
const api = new Function("window", `
  var st = { d: { avatares: { "Ana Ruiz": "c7" } }, miNombre: "Ana Ruiz" }, RET = ${JSON.stringify(RETOS)};
  function elComandante(){ return "Ana Ruiz"; }
  function retratoAlVuelo(){}
  ${entre("function esc(s)", "function cargando(")}
  ${entre("function nucleo(txt){", "function badge(k)")}
  ${entre("function tituloReto(txt)", "\n")}
  ${trozo}
  return { diasPregunta: diasPregunta, diaRetosSemana: diaRetosSemana, diaHastaPronto: diaHastaPronto };
`)(win);
const s1 = SEMS.filter(s => s.sem === 1)[0], s2 = SEMS.filter(s => s.sem === 2)[0], s10 = SEMS.filter(s => s.sem === 10)[0];
const p1 = api.diasPregunta(s1);
c(p1.length === 1 && p1[0].k === "pregunta" && p1[0].sec === "pregunta", "🔴 la pregunta es una diapositiva propia, de su sección");
const h = p1[0].html;
c(/<img class="cmd-cuerpo cmd-duda"[^>]*src="assets\/img\/avatares\/comandantes\/cuerpo\/c7_duda\.webp"/.test(h),
  "🔴 con el comandante que eligió el docente, de cuerpo entero y con cara de duda", h.slice(0, 200));
c(h.indexOf(s1.preguntas[0][1].replace(/"/g, "&quot;")) > 0 || h.indexOf(s1.preguntas[0][1]) > 0, "   y la pregunta, entera");
const sinImg = h.replace(/<img[^>]*>/g, "");
c(sinImg === '<div class="dia pregunta-clase"><p class="pc-q">' + sinImg.replace(/^.*<p class="pc-q">/, "").replace(/<\/p><\/div>$/, "") + "</p></div>" && !/kicker|<h2|<ul|<button/.test(sinImg),
  "🔴 y NADA más: sin rótulo, sin título, sin explicación («Comandante + pregunta de forma visual»)");
c(/onerror="if\(this\.dataset\.hd/.test(h) && /data-hd="assets\/img\/avatares\/comandantes\/recorte_hd\/c7\.webp"/.test(h),
  "   si faltara la pose, cae sola al recorte en alta del mismo comandante");
c(api.diasPregunta(s10).length === 2, "   la semana de dos preguntas, dos diapositivas");
c(/var d=\[diaPortada\(s, n\)\][\s\S]{0,260}if\(st\.per\) d\.push\(diaLlamada\(\)\);\s*\n\s*d=d\.concat\(diasPregunta\(s\)\);/.test(S),
  "🔴 el arranque, en su orden (24-sep): la portada, la llamada a filas y la pregunta");

const rs = api.diaRetosSemana(s2);
c(rs && /cmd-reto/.test(rs.html) && /c7_reto\.webp/.test(rs.html), "🔴 los retos de la semana, con el comandante en pose de desafío");
c(rs && /En clase<\/span><b>«Del boceto a la forja»/.test(rs.html) && /En casa<\/span><b>«La Bitácora en marcha»/.test(rs.html),
  "   y cada reto dice dónde se hace: el relámpago en clase, el principal en casa", rs && rs.html.replace(/<img[^>]*>/g, "").slice(0, 400));
c(rs && !/Actividad/.test(rs.html.replace(/<img[^>]*>/g, "")), "   (las actividades tienen sus propias diapositivas: aquí no se repiten)");
c(api.diaRetosSemana({ lanza: [] }) === null, "   y si la semana no lanza retos, no hay diapositiva vacía");
c(/var rs=diaRetosSemana\(s\); if\(rs\) ci\.push\(rs\);\s*\n\s*var tp=diaTripulante\(s\); if\(tp\) ci\.push\(tp\);[^\n]*\n\s*ci=ci\.concat\(diasMisiones\(s\)\)/.test(S), "   va antes de las misiones, con el tripulante de la semana detrás (24-sep)");
const hp = api.diaHastaPronto();
c(/cmd-saludo/.test(hp.html) && /c7_saludo\.webp/.test(hp.html) && hp.sec === "cierre", "🔴 y la despedida: el comandante saluda (sección de cierre)");
c(/if\(tf\) ci\.push\(tf\);\s*\n\s*if\(finViaje\) ci\.push\(diaHastaPronto\(true\)\); else if\(!tf\) ci\.push\(diaHastaPronto\(\)\);\s*\n\s*ci\.forEach\(function\(x\)\{ x\.t='ci'; \}\);/.test(S),
  "   es lo último de la clase… salvo si cierra el tema (lo último es el ticket); y la última del viaje acaba con «Vuelve después de la batalla»");
c(/cmdCuerpo\('saludo', 'pt-cmd'\)/.test(S), "   y en la portada también saluda");
c(![h, rs && rs.html, hp.html].some(x => /\p{Extended_Pictographic}/u.test(String(x))), "   sin un emoji en las diapositivas nuevas (iconos de la casa)");

// ── 5 · los avatares en alta, en un sitio
c(win.SG.comandanteCuerpo("c3", "duda") === "assets/img/avatares/comandantes/cuerpo/c3_duda.webp"
  && win.SG.comandanteCuerpo("", "reto") === "assets/img/avatares/comandantes/cuerpo/c1_reto.webp",
  "🔴 SG.comandanteCuerpo: la pose de cada comandante (y el c1 si no eligió)");
c(win.SG.comandanteCuerpo("../x", "<b>") === "assets/img/avatares/comandantes/cuerpo/x_b.webp", "   limpia lo que le llega (la clave la escribe cada docente)");
c(win.SG.avatarRetrato("c5") === "assets/img/avatares/comandantes/retrato/c5.jpg" && win.SG.comandanteHd("") === "assets/img/avatares/comandantes/recorte_hd/c1.webp",
  "   retrato (con fondo) y recorte en alta, cada uno en su carpeta");
const CMD = path.join(R, "assets/img/avatares/comandantes/cuerpo");
const pesos = fs.readdirSync(CMD).filter(f => f.endsWith(".webp")).map(f => fs.statSync(path.join(CMD, f)).size);
c(pesos.length === 78 && Math.max(...pesos) < 200 * 1024, "   las 78 poses pesan poco (ninguna pasa de 200 KB)", pesos.length + " · máx " + Math.round(Math.max(...pesos) / 1024) + " KB");
const CSS = L("assets/css/stargate.css");
c(/\.dia\.pregunta-clase \.pc-q\{[^}]*font-family:'Unbounded'/.test(CSS) && /@keyframes cmdEntra/.test(CSS)
  && /prefers-reduced-motion:reduce\)\{ \.dia\.retos-semana \.rs-lista li\{animation:none\}/.test(CSS),
  "   con su estilo: la pregunta en grande (Unbounded), la lista entra y respeta a quien no quiere movimiento");

// ── 6 · el servidor ya no espera ningún A6
const GP = "/Users/nor/Claude/vibewebs/gamificapro/functions/stargateBatalla.js";
if (fs.existsSync(GP)) c(/^\s*RETO: null,/m.test(fs.readFileSync(GP, "utf8")), "🔴 GamificaPro: el Simulador de Joran ya no es un reto (RETO: null)");

if (require.main === module) {
  console.log("\n  Batería 109 · los veinte retos y la pregunta de la clase");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
}
