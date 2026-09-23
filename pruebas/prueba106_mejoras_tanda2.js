'use strict';
/**
 * BATERÍA 106 · LAS MEJORAS DEL 22-SEP (tanda 2: lo que se dibujó antes de programarlo)
 *
 * Norberto eligió en el borrador: el rótulo de televisión con el comandante RECORTADO (A), la ficha del recluta ARRIBA y
 * a todo el ancho (B), los fragmentos solo para quien los recupera y el nombre de cada docente, el suyo. Aquí se
 * EJECUTA lo que se puede (el rótulo, la sesión de la semana 1 tal como la monta `_site_data.py`, el plan del servidor
 * para cambiar de nombre) y se vigila en su sitio lo demás. El laboratorio (secciones 19, 21 y 32) lo prueba con clics.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const REC = L("assets/js/recluta.js"), SES = L("assets/js/sesion.js"), CONS = L("assets/js/consola.js");
const CSS = L("assets/css/stargate.css"), STG = L("assets/js/stargate.js"), MOT = L("assets/js/motor.js");
const global = (html, nombre) => { const i = html.indexOf("window." + nombre + "="); if (i < 0) return undefined;
  const j = html.indexOf(";window.", i); return JSON.parse(html.slice(i + nombre.length + 8, j < 0 ? html.indexOf("</script>", i) : j)); };

// ── 12 · «El mensaje»: un rótulo de televisión, el comandante recortado, UN emblema, y la letra medida con su caja
const a = STG.indexOf("window.SG.avatarComandante = function"), b = STG.indexOf("window.SG.CFGSESION");
const win = { SG: {} }; new Function("window", STG.slice(a, b))(win);
const rt = win.SG.rotulo({ nombre: "Norberto Cuartero", avatar: "c3", escuadron: "Los Yunques", emblema: "assets/img/e.png", grupo: "DEMO", clase: "grande" });
c(/class="rotulo rotulo-grande"/.test(rt) && /recorte\/c3\.png/.test(rt), "🔴 rótulo: el comandante que eligió, RECORTADO (sin fondo), como en un informativo");
c((rt.match(/rt-emb/g) || []).length === 1, "🔴 el emblema del escuadrón, UNA vez (antes salía a los dos lados)", (rt.match(/rt-emb/g) || []).length);
c(/>Comandante Norberto Cuartero</.test(rt) && /Escuadrón Los Yunques · DEMO/.test(rt), "   su nombre con su rango, y debajo el escuadrón y el grupo");
c(!/Comandante Comandante/.test(win.SG.rotulo({ nombre: "Comandante Ana" })) && win.SG.rotulo({ nombre: " " }) === "", "   sin «Comandante Comandante», y sin nombre no hay rótulo");
c(/capitan\/saluda\.png/.test(win.SG.rotulo({ nombre: "Ana" })), "   sin comandante elegido, el Capitán de la serie");
c(win.SG.rotulo({ nombre: "<b>x</b>" }).indexOf("<b>x") < 0, "   y el nombre se escapa (lo escribe cada docente)");
const recortes = fs.readdirSync(path.join(R, "assets/img/avatares/comandantes/recorte")).filter(f => /^c\d+\.png$/.test(f));
const retratos = fs.readdirSync(path.join(R, "assets/img/avatares/comandantes")).filter(f => /^c\d+\.jpg$/.test(f));
c(recortes.length === retratos.length && retratos.every(f => recortes.indexOf(f.replace(".jpg", ".png")) >= 0),
  "🔴 los " + retratos.length + " comandantes tienen su recorte (ninguno cae en un hueco)", recortes.length + "/" + retratos.length);
c(/function firmaForo\(\)\{[\s\S]{0,300}window\.SG\.rotulo\(\{[\s\S]{0,300}clase:'grande' \}\)/.test(SES), "🔴 la diapositiva «El mensaje» firma con el rótulo grande");
c(/\.foro-crawl\.fc-v2 \.fc-texto\{[^}]*font-size:clamp\([^)]*cqh/.test(CSS) && !/\.fc-v2 \.fc-texto\{[^}]*\dvw/.test(CSS) && /\.dia\.foro-crawl\.fc-v2\{container-type:size\}/.test(CSS),
  "🔴 la letra del mensaje se mide con la caja de la diapositiva (cqh), no con la ventana (vw)");
c(/window\.SG\.rotulo\(/.test(CONS) && /fc-firma-r/.test(CONS), "   la carta del foro de la Nave del Comandante, con el mismo rótulo");
c(/avatares:\s*S\.avatares \|\| \{\}/.test(L("motor/tablero.js")), "   el alumnado ve el comandante de su docente (viaja en el tablero del grupo)");

// ── 13 · «La orden de la semana» = la misma carta
c(/class="card orden-sem orden-carta"/.test(REC) && /window\.SG\.rotulo\(/.test(REC), "🔴 la orden de la semana del recluta: la misma carta épica, con su rótulo");
c(/window\.SG\.foroParrafos\(/.test(REC), "   y el mismo lector del mensaje (nada de un parser propio)");

// ── 14 · la ficha del recluta arriba, a todo el ancho, con NEBULA a medida y la carrera inmediata
c(/<section class="card nave-ficha"/.test(REC), "🔴 la ficha del recluta: una sección propia, a todo el ancho, arriba");
c(/function nebulaDice\(r, ni\)/.test(REC) && /function carrera\(\)/.test(REC), "   con lo que NEBULA le dice a él y quién va justo encima y justo detrás");
c(!/function duelo\(/.test(REC), "   (el «duelo» de antes queda dentro de la carrera, no repetido)");
c(/foco:'\.nave-ficha'/.test(REC), "   y la visita guiada la señala a ella");

// ── 15 · la semana 1, desde cero: el embarque
const SESH = L("sesion.html"), EMB = global(SESH, "SG_EMBARQUE") || [];
const piezas = EMB.map(x => x[0] + (x[1] ? ":" + x[1] : ""));
c(EMB.length >= 15 && piezas[0] === "video:trailer", "🔴 embarque: empieza a oscuras, con el tráiler y sin decir nada", piezas.slice(0, 2).join(" · "));
const orden = ["portada", "mensaje", "video:sinopsis", "nombres", "viaje", "semana", "nota", "bitacora", "nave", "alistaos", "llamada", "ticket:p", "forge", "video:t1i", "despegue", "misiones"];
const pos = orden.map(k => piezas.indexOf(k));
c(pos.every(p => p >= 0) && pos.every((p, i) => !i || p > pos[i - 1]), "🔴 en su orden: historia → mapa → cada semana → lo que puntúa → Bitácora → alistarse → fichar → ticket → Fôrge",
  JSON.stringify(orden.filter((k, i) => pos[i] < 0)));
c(EMB.filter(x => x[0] === "ticket").every(x => x[1] === "p"), "   el ticket es el de la presentación, con ella ya elegida");
c(EMB.filter(x => x[0] === "despegue").every(x => x[2] === "pr") && EMB.filter(x => x[0] === "misiones").every(x => x[2] === "ci"),
  "   el despegue en la práctica y las misiones al cierre");
["nombres", "viaje", "semana", "nota", "bitacora", "nave", "alistaos", "llamada", "ticket", "forge", "despegue", "misiones", "portada", "mensaje", "video"]
  .forEach(k => { if (!new RegExp("pieza==='" + k + "'").test(SES)) c(false, "   la pieza «" + k + "» se construye en sesion.js"); });
c(["nombres", "viaje", "semana", "nota", "bitacora"].every(k => new RegExp("pieza==='" + k + "'").test(SES)), "   cada pieza tiene quien la construya");
c(/function esEmbarque\(s\)\{ return Number\(s&&s\.sem\)===1/.test(SES), "   y solo en la semana 1");
c(/else if\(pieza==='alistaos'\)\{ if\(st\.per && !st\.alumno\)/.test(SES), "   «¡Alistaos!» con la cuenta subiendo, solo en la pantalla del docente");
const VID = global(SESH, "SG_VIDEOS") || {};
c(EMB.filter(x => x[0] === "video").every(x => VID[x[1]]), "   todos sus vídeos existen", JSON.stringify(EMB.filter(x => x[0] === "video" && !VID[x[1]])));
const SECS = global(SESH, "SG_SECCIONES_SESION") || [];
c(SECS.some(x => x[0] === "embarque"), "   y se puede quitar desde «Configurar diapositivas» como cualquier otra sección");

// ── 11 · el nombre del docente, el suyo (el servidor lo cambia en todos sus grupos)
c(/cambiarMiNombre/.test(MOT) && /llamar\("stargateMiNombre"/.test(MOT), "🔴 nombre: el motor lo pide al servidor (stargateMiNombre)");
c(/id="doc-nom"/.test(CONS) && /id="doc-nom-g"/.test(CONS) && /function cablearNombre\(/.test(CONS), "   se cambia en el lápiz del avatar, junto al retrato");
const FN = path.join(R, "../../../gamificapro/functions/stargateEquipo.js");
if (fs.existsSync(FN)) {
  const src = fs.readFileSync(FN, "utf8"), i = src.indexOf("export function planMiNombre"), j = src.indexOf("export const stargateMiNombre");
  const plan = new Function(src.slice(i, j).replace("export function", "function") + "; return planMiNombre;")();
  const proyecto = { factions: [{ teacherName: "Ana" }, { teacherName: "Luis" }],
    stargate: { paneles: { Ana: "p-ana", Luis: "p-luis" }, sesiones: { Ana: ["zoco"] }, avatares: { Ana: "c7" } } };
  const docentes = [{ nombre: "Ana", correo: "ana@x.es" }, { nombre: "Luis", correo: "luis@x.es" }];
  const r = plan({ proyecto, docentes, correo: "ana@x.es", nuevo: "Ana Capitana" });
  c(r.viejo === "Ana" && r.docentes[0].nombre === "Ana Capitana" && r.docentes[1].nombre === "Luis", "🔴 el plan: cambia SU nombre en la lista, y el de nadie más");
  c(r.cambios["stargate.paneles"]["Ana Capitana"] === "p-ana" && !("Ana" in r.cambios["stargate.paneles"]) && r.cambios["stargate.paneles"].Luis === "p-luis",
    "   su panel, sus diapositivas y su comandante se mudan a su nombre nuevo", JSON.stringify(r.cambios));
  c(r.cambios["stargate.sesiones"]["Ana Capitana"] && r.cambios["stargate.avatares"]["Ana Capitana"] === "c7", "   (las tres cosas que cuelgan de su nombre)");
  c(r.cambios.factions[0].teacherName === "Ana Capitana" && r.cambios.factions[1].teacherName === "Luis", "   y su escuadrón");
  c(/ya hay otro docente/i.test(plan({ proyecto, docentes, correo: "ana@x.es", nuevo: "luis" }).error || ""),
    "🔴 no puede quedarse con el nombre de un compañero (el nombre ata a cada recluta con su Comandante)");
  c(/no estás/i.test(plan({ proyecto, docentes, correo: "otro@x.es", nuevo: "Pepe" }).error || ""), "   ni cambiarlo en un grupo en el que no está");
  c(plan({ proyecto, docentes, correo: "ana@x.es", nuevo: "Ana" }).igual === true, "   y si no cambia nada, no toca nada");
  c(/student_profiles/.test(src.slice(j)) && /stargateProfe/.test(src.slice(j)), "   sus reclutas le siguen (stargateProfe de cada ficha)");
  c(/stargateMiNombre/.test(fs.readFileSync(path.join(R, "../../../gamificapro/functions/index.js"), "utf8")), "   la función está exportada");
} else console.log("   (sin la carpeta de gamificapro al lado: el plan del servidor no se prueba aquí)");
c(/stargateMiNombre/.test(fs.readFileSync(path.join(R, "../desplegar_stargate.sh"), "utf8")), "   y está en la lista de despliegue");

console.log("\n  Batería 106 · la nota del 22-sep, tanda 2");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
