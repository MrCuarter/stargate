'use strict';
/**
 * BATERÍA 95 · LA PORTADA DEL DOCENTE (19-sep).
 *
 * Norberto, de un tirón: «el botón de cerrar aula no funciona»; «filas a todo el ancho»; «un botón de ajustes en su
 * landing»; «configurar la sesión en Mis enlaces no tiene sentido: una rueda dentada»; «el docente debe ver de un vistazo
 * el estado de su grupo: semana, vídeo, retos pendientes, retos pasados con cuántos y %, accesos rápidos, configurar la
 * sesión, una caja de texto»; «editar el enlace del panel para todos sus estudiantes»; «mandar un mensaje a los
 * estudiantes»; «no queremos emojis, tenemos iconos muy chulos»; «mensajes de ánimo de NEBULA con consejos, insights de
 * la última semana, activos y pasivos, efecto máquina de escribir»; «capturas de cada diapositiva al configurar».
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const K = leer("assets/js/consola.js"), S = leer("assets/js/sesion.js"), A = leer("assets/js/aula.js"), M = leer("assets/js/motor.js");
const CSS = leer("assets/css/stargate.css"), H = leer("consola.html");

// ── 1 · el aula de la presentación se cierra
c(/\.ses-aula\[hidden\]\{display:none\}/.test(CSS), "🔴 el aula de la presentación se cierra de verdad (display:flex ya no le gana a [hidden])");
c(/e\.key==='Escape'&&a&&!a\.hidden/.test(S), "   y con Escape");
c(/&embed=1&panel=1/.test(S) && /classList\.add\("au-panel"\)/.test(A) && /body\.au-panel \.au-quien>b/.test(CSS), "   dentro, el aula en modo panel (sin nombre, selector ni «¿Dudas?»)");

// ── 2 · la Nave del Comandante (20-sep: los grupos, en un desplegable dentro de tu ficha)
c(/function selectorDeGrupo\(\)/.test(K) && /id="cn-sel-g"/.test(K) && /if \(V\.length\) return abrir\(V\[0\]\.id\);/.test(K), "🔴 los grupos, en un desplegable en tu ficha, y se entra directo en el último");
c(/id="doc-ajustes-b"/.test(K) && /function pintarAjustes\(caja, vivos, avBtn\)/.test(K), "🔴 ⚙ Ajustes en el panel: tu comandante y tu sesión para todos tus grupos");

// ── 3 · la rueda de la sesión
c(/function botonCfgSesion\(per\)/.test(K) && (K.match(/botonCfgSesion\((p\.id|PER)\)/g) || []).length === 1, "🔴 la rueda al lado de «Empezar la clase», en el Puente del grupo");
c(/function abrirCfgSesion\(per\)/.test(K) && /data-cfg-todo/.test(K) && /guardarParteEn\(per, "sesiones", nombre, off\)/.test(K), "   su ventana guarda al tocar, en ese grupo, y tiene «Marcar todo»");
c(!/bloqueSesion\(t, yo\.nombre\)/.test(K) && !/\(yoN \? bloqueSesion/.test(K), "   y ya no está ni en Mis enlaces ni en la portada");
const caps = fs.readdirSync(path.join(RAIZ, "assets/img/sesion")).filter(f => f.endsWith(".jpg"));
c(caps.length >= 13 && /window\.SG_CAPTURAS_SESION=\[/.test(H) && /class="m-sec-img"/.test(K), "🔴 cada casilla con la captura de su diapositiva", caps.length + " capturas");
c(/var SIN_CAPTURA = \{ simulador:/.test(K), "   y las que dependen de que haya algo, con su icono y cuándo salen");
c(/data-sec="'\+esc\(secDe\(d\)\)\+'"/.test(S), "   (cada paso de la sesión dice su sección: así se sacan las capturas)");

// ── 4 · la portada del grupo
c(/var TABS = \[\["portada", "Portada"\]/.test(K) && /TAB = "portada";   \/\/ 19-sep/.test(K) && /\["puente", "Puente", "assets\/img\/nave\/iconos\/nave\.png", \["portada"\]\]/.test(K), "🔴 al entrar en un grupo, su Puente (la primera sección)");
c(!/TAB = "portada";\n\s*PER = perId/.test(K), "   y el aviso de la Cola de nota sigue llevando a la Cola (abrir() no la pisa)");
c(/function verPortada\(t\)/.test(K) && /El vídeo que toca/.test(K) && /Retos de esta semana/.test(K) && /Retos ya lanzados/.test(K), "   semana, el vídeo que toca, los retos de la semana y los ya lanzados");
c(/'<span class="pt-n"><b>' \+ n \+ '<\/b>\/' \+ N \+ ' · ' \+ pct \+ ' %<\/span>/.test(K), "   cada reto con cuántos lo han hecho y el porcentaje");
c(/window\.SG_SEMANAS=/.test(H) && /window\.SG_SEM_RETO=/.test(H), "   con los mismos datos que la sesión y la Nave (un dato, un sitio)");
c(/id="pt-panel-ed"/.test(K) && /guardarMiParte\("paneles", yoN, v\)/.test(K), "🔴 el enlace del panel, editable ahí mismo, para todo tu alumnado");
// 20-sep · «elimina "tus notas". No lo necesitamos» (Norberto)
c(!/id="pt-notas"/.test(K) && !/Tus notas/.test(K), "🔴 ya no hay caja de «Tus notas» en el Puente");
// y el panel del grupo se ve aquí mismo, embebido
c(/class="pt-panel-marco"/.test(K) && /<iframe src="' \+ esc\(panelMio\)/.test(K), "🔴 el panel de control del grupo, embebido en tu Nave");
c(/MOTOR\.avisarRecluta\(PER, r\.uid, \{ texto: txt, de: yoN, titulo: "Mensaje de tu Comandante" \}\)/.test(K), "🔴 el mensaje a tus reclutas: uno a cada uno, al buzón de su Nave");
c(/\["silencio", "En silencio"\]/.test(K) && /class="pt-seg"/.test(K), "   a todos, a los que están en silencio o a los que no se han estrenado (sin controles grises)");

// ── 5 · NEBULA, sus consejos y los insights
c(/function nebulaFlotante\(consejos\)/.test(K) && /nebulaFlotante\(consejos\);/.test(K), "🔴 NEBULA asoma como el globo del onboarding, y se cierra");
c(/p\.classList\.add\("escribe"\)/.test(K) && /prefers-reduced-motion: reduce/.test(K), "   con efecto máquina de escribir (y sin él, si se pide menos movimiento)");
c(/filaNombres\("En silencio esta semana"/.test(K) && /filaNombres\("Sin estrenarse"/.test(K), "🔴 los insights: quién está en silencio y quién sin estrenarse, con «Escribirles»");
const src = K.slice(K.indexOf("  function consejosNebula(o) {"), K.indexOf("  var NEB_CERRADA"));
let consejos = null; try { consejos = new Function(src + "; return consejosNebula;")(); } catch (e) {}
const r = (a, xp7, h) => ({ alias: a, xp7: xp7, hechos: h });
const base = { sem: 5, total: 15, s: { tema: "Tema 3 · Sendara", tema_n: 3 }, antes: [{ id: "B2", titulo: "x" }], semanaDe: () => 4, semNuevoTema: true, cola: 2 };
const L1 = consejos ? consejos(Object.assign({}, base, { gente: [r("Orión", 0, ["A0"]), r("Vega", 120, ["A0", "B2"]), r("Lyra", 0, []), r("Deneb", 0, [])] })) : [];
c(L1.length >= 5, "🔴 NEBULA · con datos de una semana, varios consejos", L1.length);
c(L1.some(x => /subidas de nota esperando/.test(x.t) && x.a && x.a[1] === "cola"), "   la Cola de nota, con su botón");
c(L1.some(x => /una semana en silencio \(Orión\)/.test(x.t) && x.a && x.a[1] === "silencio"), "   quien está en silencio, por su nombre, con «Escribirles»");
c(L1.some(x => /no han registrado aún su primer reto/.test(x.t)), "   quien no se ha estrenado");
c(L1.some(x => /El reto B2 de la semana pasada solo lo ha hecho el 25 %/.test(x.t)), "   el reto flojo de la semana pasada, con su porcentaje");
c(L1.some(x => /Semana tranquila: solo 1 de 4/.test(x.t)), "   cómo va la semana (activos de su gente)");
c(L1.some(x => /Esta semana abrís Tema 3 · Sendara/.test(x.t)), "   y el tema que se abre");
const L2 = consejos ? consejos(Object.assign({}, base, { cola: 0, semNuevoTema: false, gente: [] })) : [];
c(L2.length && /Todavía no se ha alistado nadie/.test(L2[0].t), "   sin nadie alistado, lo primero: la invitación");

// ── 6 · sin emojis, con nuestros iconos
const ic = fs.readdirSync(path.join(RAIZ, "assets/img/iconos")).filter(f => f.endsWith(".png")), icp = fs.readdirSync(path.join(RAIZ, "assets/img/iconos/p"));
c(ic.length >= 32 && icp.length >= 32 && ["ajustes", "mensaje", "notas", "enlace", "editar"].every(k => ic.indexOf(k + ".png") >= 0), "🔴 32 iconos propios (con aro y en pictograma)", ic.length + "/" + icp.length);
const quedan = execFileSync("python3", [path.join(RAIZ, "herramientas/sin_emojis.py"), path.join(RAIZ, "assets/js/consola.js")], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
c(!quedan.trim(), "🔴 la consola, sin un emoji (herramientas/sin_emojis.py no encuentra ninguno)", quedan.split("\n")[0]);
c((K.match(/<img class=ico src=assets\/img\/(nave\/)?iconos\/(p\/)?[a-z]+\.png alt>/g) || []).every(x => fs.existsSync(path.join(RAIZ, x.replace(/^<img class=ico src=/, "").replace(/ alt>$/, "")))),
  "   y cada icono que usa existe");
c(/esc\(\(\(window\.SG_EJEMPLOS\|\|\{\}\)\[id\]\|\|\{\}\)\.titulo\|\|''\)/.test(S), "🔴 sesión · «Ver un ejemplo» ya no dice «[object Object]»");

console.log("\n  Batería 95 · la portada del docente (19-sep)");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
