'use strict';
/**
 * BATERÍA 155 · LA LECCIÓN: EL BLOQUE CENTRAL SIN GENIALLY (11-nov)
 *
 * Norberto: «Quiero hacer COMPLETAS las presentaciones… La parte central es Genially. Me gustaría poder prescindir de Genially
 * y hacerlo todo dentro de nuestra plataforma» y «de momento SOLO a mis grupos, así lo pruebo tranquilamente». Primera lección:
 * el Tema 3 entero, en dos partes (semanas 5 y 6). Aquí: el dato (SG_LECCIONES), quién la ve (SG_LECCION_AULAS, por PER y
 * Comandante: en PER 16450 está también Caridad), que sustituye al Genially del despegue solo donde toca y que la matriz de
 * ejemplo es la MISMA de la sesión de la Actividad 2 (un dato, un sitio).
 * 11-nov, tarde · la pieza ya es del motor (GamificaPro sdk/leccion.js, `GP.leccion`, copiada en assets/js/leccion.js): sesion.js solo
 * pone quién la ve, la piel, lo que STARGATE le añade (la práctica en vivo) y la llamada. Esta batería la EJECUTA (leccionDe y
 * diasLeccion de sesion.js sobre la pieza) y comprueba que da lo mismo: las mismas diapositivas, con sus claves, su sección, sus
 * notas, su HTML y sus colores.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };
const global = (html, nombre) => { const m = html.match(new RegExp("window\\." + nombre + "=([\\s\\S]*?);(?:window\\.|<\\/script>)")); return m ? vm.runInNewContext("(" + m[1] + ")") : null; };

const SESH = L("sesion.html"), SES = L("assets/js/sesion.js"), CSS = L("assets/css/stargate.css"), LECJS = L("assets/js/leccion.js");
const LEC = global(SESH, "SG_LECCIONES") || {}, AULAS = global(SESH, "SG_LECCION_AULAS") || [], ACT = global(SESH, "SG_SES_ACT") || {};
const MZ = global(SESH, "SG_MATRIZ") || {};
const TIPOS = ["tarjetas", "piezas", "matriz", "ejemplos", "manos", "galeria", "ia", "lista"];

console.log("  El dato");
c(LEC["5"] && LEC["6"], "hay lección en las semanas 5 y 6 (el Tema 3, en dos partes)", Object.keys(LEC));
c(LEC["5"] && LEC["5"].tema === 3 && LEC["6"].tema === 3, "   las dos, del Tema 3");
Object.keys(LEC).forEach(k => {
  const D = LEC[k].dias || [];
  c(D.length >= 4 && D.every(d => TIPOS.indexOf(d.tipo) >= 0 && d.titulo && d.rot), "semana " + k + ": " + D.length + " diapositivas, todas con tipo conocido, título y nombre", D.map(d => d.tipo));
  const rots = D.map(d => d.rot); c(new Set(rots).size === rots.length, "   semana " + k + ": nombres distintos en la barra", rots);
  D.filter(d => d.tipo === "ejemplos").forEach(d => c(d.ejemplos.every(e => e[3] === "MATRIZ" || /^https:\/\/(view\.genially\.com|deck\.toys)\//.test(e[3])),
    "   semana " + k + ": los ejemplos, enlaces https a Genially (o Deck.toys, aparte)", d.ejemplos.map(e => e[3])));
});
const S6 = (LEC["6"] || {}).dias || [];
const man = S6.filter(d => d.tipo === "manos")[0] || {};
c(man.minutos > 0 && (man.pasos || []).length >= 5 && /imagen interactiva/i.test(JSON.stringify(man.pasos)), "semana 6: manos a la obra con cronómetro y la imagen interactiva desde cero", man.minutos);
const lista = (S6.filter(d => d.tipo === "lista")[0] || {}).items || [];
c(["imagen interactiva", "6 actividades", "público", "Bitácora"].every(w => JSON.stringify(lista).indexOf(w) >= 0), "   la lista de «¿está listo?» pide lo del enunciado de la Actividad 2");

console.log("  La matriz es la de la Actividad 2 (un dato, un sitio)");
const mz = S6.filter(d => d.tipo === "matriz")[0] || {};
const EJ = ((ACT[mz.ejemplo] || {}).ejemplo) || {};
c(mz.ejemplo === "a2" && !mz.actividades, "la lección no trae su propia matriz: apunta a la de la sesión de la Actividad 2");
c((EJ.cruces || []).length >= 6, "   el ejemplo tiene al menos 6 cruces", (EJ.cruces || []).length);
c((EJ.cruces || []).every(x => (MZ.inteligencias || []).indexOf(x[2]) >= 0 && (MZ.bloom || []).indexOf(x[1]) >= 0 && /^(obligatoria|optativa|voluntaria)$/.test(x[3])),
  "   cada cruce cae en una casilla de verdad (inteligencia × Bloom) y tiene su tipo");

console.log("  Quién la ve (de estreno, solo el aula de Norberto)");
c(JSON.stringify(AULAS) === JSON.stringify([["per-16450", "Norberto Cuartero"], ["demo-stargate", null]]), "solo PER 16450 con su Comandante «Norberto Cuartero», y la demo", JSON.stringify(AULAS));
// se ejecuta leccionDe tal cual, con un `st` y una URL de mentira
const fn = (SES.match(/function leccionDe\(s\)\{[\s\S]*?\n  \}/) || [""])[0];
c(!!fn, "sesion.js tiene leccionDe");
const ve = (st, q, sem) => { const ctx = vm.createContext({ window: { SG_LECCIONES: LEC, SG_LECCION_AULAS: AULAS }, location: { search: q || "" }, st: st }); vm.runInContext(LECJS, ctx); vm.runInContext(fn + ";r=leccionDe({sem:" + (sem || 6) + "})", ctx); return !!ctx.r; };
c(ve({ per: "per-16450", miNombre: "Norberto Cuartero" }), "   Norberto, proyectando en su grupo: sí");
c(!ve({ per: "per-16450", miNombre: "Caridad" }), "   Caridad, en el mismo PER: no (sigue con su Genially)");
c(ve({ per: "per-16450", alumno: true, profeMio: "Norberto Cuartero" }), "   un recluta de Norberto (en directo o en diferido): sí");
c(!ve({ per: "per-16450", alumno: true, profeMio: "Caridad" }), "   un recluta de Caridad: no");
c(!ve({ per: "per-99999", miNombre: "Norberto Cuartero" }), "   Norberto en otro grupo: no");
c(ve({ per: "demo-stargate", miNombre: "" }), "   la demo: sí");
c(!ve({ per: "per-16450", miNombre: "Norberto Cuartero", tipo: "PUA" }), "   un grupo PUA: no (la lección va por semanas del regular)");
c(ve({ per: "per-99999", miNombre: "X" }, "?leccion=1"), "   ?leccion=1 la enseña en cualquier grupo");
c(!ve({ per: "per-16450", miNombre: "Norberto Cuartero" }, "?leccion=0"), "   ?leccion=0 la quita");
c(!ve({ per: "per-16450", miNombre: "Norberto Cuartero" }, "", 7), "   una semana sin lección (la 7): su Genially, como siempre");

console.log("  La pieza es del motor (GamificaPro sdk/leccion.js); STARGATE pone el dato, la piel y la llamada");
const GP_DIR = process.env.GAMIFICAPRO_DIR || path.join(R, "..", "..", "gamificapro");
const ORIG = path.join(GP_DIR, "sdk", "leccion.js");
if (fs.existsSync(ORIG)) c(fs.readFileSync(ORIG, "utf8") === LECJS, "assets/js/leccion.js es la de GamificaPro, tal cual (no se edita aquí)");
const iL = SESH.indexOf('src="assets/js/leccion.js'), iS = SESH.indexOf('src="assets/js/sesion.js');
c(iL > 0 && iS > iL && /assets\/js\/leccion\.js\?v=[0-9a-f]{10}" defer/.test(SESH), "   sesion.html la carga, con su huella, antes que la sesión");
c(!/function (diaLeccion|montarVisor|montarCopiar|montarLista|lcCabeza)\b|function montarMatriz\(A\)/.test(SES), "   sesion.js ya no pinta la lección: ni diaLeccion ni sus montar* (la montarMatriz que queda es la de la sesión de la Actividad)");
c(!/\n\.lc-(tarjetas|tarjeta|mz|mz-c|visor|pasos|lado|manos|ia|lista|chips|escalera|piezas)\{/.test(CSS) && /\.dia\.leccion\{[^}]*--gpl-linea:var\(--line\)/.test(CSS),
  "   stargate.css, solo la piel: las variables --gpl-* en .dia.leccion (las reglas .lc-* de la lección, de la pieza)");

// diasLeccion de sesion.js, ejecutada sobre la pieza, con lo de la sesión que usa (el fondo, de mentira; el reloj y la práctica, los de verdad)
const trozo = (re) => (SES.match(re) || [""])[0];
const codigo = [
  trozo(/function esc\(s\)\{[^\n]*\n/), trozo(/function fuerte\(t\)\{[^\n]*\n/), trozo(/function cronoRelampago\(min\)\{[\s\S]*?\n  \}/),
  trozo(/var LC_ICONO=[^\n]*\n/), trozo(/var LC_CORTO=\{[\s\S]*?\};/), trozo(/function diasLeccion\(s, L\)\{[\s\S]*?\n  \}/),
  trozo(/  var LC_PRAC=[\s\S]*?\n  function montarPractica\(modo\)\{[\s\S]*?\n  \}\n/),
].join("\n");
c(["function diasLeccion", "function cronoRelampago", "function montarPractica"].every(x => codigo.indexOf(x) >= 0), "sesion.js tiene diasLeccion (la llamada), el cronómetro del relámpago y la práctica en vivo");
const diasDe = (st) => {
  const ctx = vm.createContext({ window: { SG_MATRIZ: MZ, SG_SES_ACT: ACT, SG_PRACTICA: global(SESH, "SG_PRACTICA") || {}, SG: { MOTOR: { vigilarEnVivo() {} } }, L5: LEC["5"], L6: LEC["6"] },
    st, DIFERIDO: false, URL, montarCrono: function montarCrono() {}, capaFondo: () => '<div class="dia-fondo" aria-hidden="true"></div>' });
  vm.runInContext(LECJS, ctx);
  try { vm.runInContext(codigo + ";r6=diasLeccion({sem:6}, window.L6);r5=diasLeccion({sem:5}, window.L5)", ctx); } catch (e) { c(false, "diasLeccion se ejecuta", e.message); }
  return { D5: ctx.r5 || [], D6: ctx.r6 || [], ctx };
};
const { D5, D6, ctx: ctxS } = diasDe({ per: "per-16450", miNombre: "Norberto Cuartero" });
console.log("  En la sesión");
c(/var lec=leccionDe\(s\);\n    if\(lec\) medio=diasLeccion\(s, lec\);\n    else \{\n      var panel=panelDelMazo/.test(SES), "la lección va en el despegue en lugar del Genially; sin lección, el panel de siempre");
c(D6.length === S6.length && D5.length === (LEC["5"].dias || []).length, "   todas las diapositivas salen (semana 5: " + D5.length + ", semana 6: " + D6.length + ")");
c(D6.every((x, i) => x.k === "lc-" + (i + 1) && x.sec === "despegue" && x.t === "pr" && x.rot === S6[i].rot),
  "   cada diapositiva con su clave (notas propias) y en la sección «despegue» (la rueda la apaga y la mueve)", JSON.stringify(D6.map(x => [x.k, x.sec, x.t])));
c(/G\[sl\.k\]\|\|sl\.guion\)/.test(SES) && D6.every((x, i) => (S6[i].notas || []).length && JSON.stringify(x.guion) === JSON.stringify(S6[i].notas)), "   las notas del presentador de la semana 6, por defecto en cada diapositiva");
c(D6.concat(D5).every(x => x.html.indexOf('<div class="dia leccion lct-' + x.tipo + ' con-fondo"><div class="dia-fondo"') === 0),
  "   la clase del tipo lleva prefijo propio (lct-): «lc-tarjetas» en la diapositiva la volvía rejilla; el fondo de la semana detrás");
c(D6.concat(D5).every(x => /^<div class="dia leccion[^>]*>[\s\S]*?<div class="kicker"><img class=ico src=assets\/img\/iconos\/p\/libro\.png alt> Tema 3 · /.test(x.html)), "   la cabecera de STARGATE: el icono del libro y «Tema 3 · …»");
const dM = D6.filter(x => x.tipo === "matriz")[0] || { html: "" };
c((dM.html.match(/<button type="button" class="lc-mz-c con t-/g) || []).length === (EJ.cruces || []).length, "   la matriz: una casilla pulsable por cruce de la Actividad 2", (dM.html.match(/lc-mz-c con/g) || []).length);
c(dM.html.indexOf('aria-label="Matriz de programación: 8 inteligencias por 6 niveles de Bloom"') > 0 && dM.html.indexOf('<span class="lc-corto">Ling.</span>') > 0, "   con su nombre y las inteligencias abreviadas");
c(dM.html.indexOf("<b>" + (EJ.area || "") + " · " + (EJ.nivel || "") + "</b> · el huerto de " + String(EJ.quien || "").split(",")[0] + ": cada planta, una actividad") > 0, "   y la unidad del huerto encima");
c(/\.lc-mz-c\.t-obligatoria[^{]*\{background:var\(--gpl-obligatoria,rgba\(95,207,122/.test(LECJS) && /\.ac-mc\.obligatoria[^{]*\{background:#5fcf7a/.test(CSS), "   y con los mismos colores que la sesión de la Actividad 2 (verde, azul, amarillo)");
const dE = D6.filter(x => x.tipo === "ejemplos")[0] || { html: "" };
c(MZ.plantilla && dE.html.indexOf('data-lc-ver="' + MZ.plantilla + '"') > 0 && /class="lc-btn btn primary min" data-lc-ver=/.test(dE.html), "   los ejemplos: «Verlo aquí» con los botones de STARGATE, y la plantilla de la matriz resuelta");
c(typeof dE.montar === "function" && /function montarVisor[\s\S]*removeEventListener\("keydown", tecla, true\)/.test(LECJS), "   el visor de ejemplos se cierra con Esc y suelta el teclado al salir");
const dH = D6.filter(x => x.tipo === "manos")[0] || { html: "" };
c(/<div class="lc-lado"><div class="rel-crono" data-min="25"><div class="rc-eyebrow"><img class=ico src=assets\/img\/iconos\/p\/tiempo\.png alt> El reloj de la práctica<\/div>/.test(dH.html),
  "   manos a la obra usa el cronómetro del relámpago (25 min), con su rótulo");
c(/<li class="lc-consejo" style="--i:7"><img class=ico src=assets\/img\/iconos\/p\/diana\.png alt> <div>/.test(dH.html), "   el consejo, con su diana, en el hueco de los siete pasos");
c(/<\/div><\/div><div class="lc-practica lc-pr-manos" aria-live="polite">/.test(dH.html) && typeof dH.montar === "function", "   y el tablero de la práctica al lado del reloj (el docente, en directo)");
const dG = D6.filter(x => x.tipo === "galeria")[0] || { html: "" };
c(/<h2>[^<]*<\/h2><div class="lc-practica lc-pr-galeria"[\s\S]*<div class="lc-visor" hidden>[\s\S]*<iframe title="Lo que ha creado"/.test(dG.html), "   la galería: lo que han creado, con el visor de la pieza");
const al = diasDe({ per: "per-16450", alumno: true, profeMio: "Norberto Cuartero" }).D6;
c(/<p class="lc-pr-al">Cuando tu Comandante abra el tablero/.test((al.filter(x => x.tipo === "manos")[0] || {}).html) && /<p class="lc-pr-al">La galería se llena en clase/.test((al.filter(x => x.tipo === "galeria")[0] || {}).html),
  "   al recluta, en su lugar, cómo responder y qué es la galería");
const dP = D6.filter(x => x.tipo === "piezas")[0] || { html: "" };
c((dP.html.match(/<li>/g) || []).length >= (MZ.inteligencias || []).length && dP.html.indexOf('<p class="lc-pie">Cada actividad del paisaje es <b>un cruce</b>: un talento × un nivel.</p>') > 0, "   las dos piezas: las inteligencias, Bloom y «un cruce»");
const dI = D6.filter(x => x.tipo === "ia")[0] || { html: "" };
c(/<button type="button" class="lc-btn btn min" data-lc-copiar>Copiar<\/button>/.test(dI.html), "   el prompt, con «Copiar»");

console.log("  Que se vea en cualquier pantalla");
c(/\.lc-tarjetas\{display:grid;grid-template-columns:repeat\(var\(--n,3\),minmax\(0,1fr\)\)/.test(LECJS), "tarjetas iguales en rejilla (minmax(0,1fr))");
c(/@media \(max-width:900px\),\(max-height:560px\)\{ \.dia\.leccion\{overflow-y:auto/.test(CSS), "   en pantallas pequeñas o bajas, se desliza dentro de su diapositiva (no se corta)");
c(/@media \(max-width:620px\)\{ body \.mazo \.dia\.leccion\{padding:54px/.test(CSS), "   en el móvil, por debajo de la barra de arriba");
c(/\.lc-lista input\{width:22px;height:22px/.test(LECJS) && /\.lc-bots \.lc-btn\{min-height:40px\}/.test(LECJS) && /\.lc-bots \.btn\{min-height:40px\}/.test(CSS), "   zonas de pulsar de 40 px (también los botones de la galería)");

console.log("  La práctica en vivo: «me he atascado» y la galería (11-nov, 2)");
const PR = global(SESH, "SG_PRACTICA") || {};
const REC = L("recluta.html"), RJ = L("assets/js/recluta.js");
c(PR.prefijo && PR.atascado && PR.voy, "el dato SG_PRACTICA, en la sesión", JSON.stringify(PR));
c(JSON.stringify(global(REC, "SG_PRACTICA") || {}) === JSON.stringify(PR), "   y el mismo en la Nave del recluta");
c(S6.map(d => d.tipo).join(",").indexOf("manos,galeria") >= 0, "   la galería va justo detrás de «Manos a la obra»");
// se ejecuta el bloque tal cual, con un motor y un DOM de mentira
const bloque = (SES.match(/  var LC_PRAC=[\s\S]*?\n  function montarPractica\(modo\)\{[\s\S]*?\n  \}\n/) || [""])[0];
c(!!bloque, "sesion.js tiene el bloque de la práctica");
const llamadas = [];
let alEnVivo = null, alResp = null;
const M = {
  vigilarEnVivo: (per, f) => { alEnVivo = f; return () => llamadas.push("paraE"); },
  vigilarRespuestas: (per, id, f) => { alResp = f; llamadas.push("vigila:" + id); return () => llamadas.push("paraR"); },
  lanzarPregunta: (per, txt, por) => { llamadas.push("lanza:" + txt + "|" + por); return Promise.resolve("q1"); },
  cerrarPregunta: () => { llamadas.push("cierra"); return Promise.resolve(); },
};
const caja = () => { const o = { innerHTML: "", at: {}, getAttribute: k => o.at[k], setAttribute: (k, v) => { o.at[k] = v; }, addEventListener: (t, f) => { o.click = f; }, querySelector: () => o }; return o; };
const mk = (st, dif) => {
  const ctx = { window: { SG_PRACTICA: PR, SG: { MOTOR: M } }, st, DIFERIDO: !!dif, URL, esc: s => String(s == null ? "" : s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])) };
  vm.runInNewContext(bloque + ";this.F={montarPractica,lcPracticaHtml,estadoPractica,esPractica,practicaPosible};", ctx);
  return ctx.F;
};
const F = mk({ per: "per-16450", miNombre: "Norberto Cuartero" });
c(F.practicaPosible() && /lc-practica lc-pr-manos/.test(F.lcPracticaHtml("manos")), "   el docente con grupo, en directo: sale el tablero");
c(!mk({ per: "per-16450", alumno: true }).practicaPosible() && !mk({ per: "per-16450" }, true).practicaPosible(), "   el recluta y el diferido: no (al recluta, cómo responder)");
c(F.estadoPractica("Me he atascado").k === "atascado" && F.estadoPractica("Voy bien").k === "voy" && F.estadoPractica("mira https://view.genially.com/abc).").url === "https://view.genially.com/abc",
  "   cada respuesta se lee como «voy», «atascado» o «enlace» (y el enlace, limpio)");
const cj = caja(), el = { querySelector: () => cj };
const parar = F.montarPractica("manos")(el);
const enVivoManos = alEnVivo;
alEnVivo({ pregunta: null });
c(/Abrir el tablero en sus móviles/.test(cj.innerHTML), "   sin tablero abierto: «Abrir el tablero en sus móviles»");
cj.click({ target: { closest: () => ({ getAttribute: () => "abrir" }) }, stopPropagation() {} });
c(llamadas.some(x => x === "lanza:" + PR.prefijo + PR.texto + "|Norberto Cuartero"), "   y lo abre como pregunta en directo, con el prefijo y su nombre", llamadas.join(" · "));
alEnVivo({ pregunta: { id: "q1", abierta: true, texto: PR.prefijo + PR.texto } });
alResp([{ alias: "Ana", texto: "Voy bien" }, { alias: "Luis", texto: "Me he atascado" }, { alias: "Eva", texto: "https://view.genially.com/xyz" }, { alias: "Leo <b>", texto: "me he atascado" }]);
c(/<b>1<\/b> con enlace/.test(cj.innerHTML) && /<b>1<\/b> voy bien/.test(cj.innerHTML) && /<b>2<\/b> atascados/.test(cj.innerHTML), "   cuenta: 1 con enlace, 1 va bien, 2 atascados", cj.innerHTML.slice(0, 300));
c(/A ayudar:.*Luis.*Leo &lt;b&gt;/.test(cj.innerHTML) && !/Ana<\/span>/.test(cj.innerHTML), "   y nombra solo a quien se ha atascado (escapado)");
const cg = caja(); F.montarPractica("galeria")({ querySelector: () => cg });
alEnVivo({ pregunta: { id: "q1", abierta: true, texto: PR.prefijo + PR.texto } });
alResp([{ alias: "Eva", texto: "https://view.genially.com/xyz" }, { alias: "Pablo", texto: "https://sites.google.com/view/pablo" }, { alias: "Luis", texto: "Me he atascado" }]);
c(/<b>2<\/b> enlaces/.test(cg.innerHTML) && (cg.innerHTML.match(/lc-gal-t/g) || []).length === 2 && !/Luis/.test(cg.innerHTML), "la galería: solo los enlaces (2), con su alias");
c((cg.innerHTML.match(/data-lc-ver=/g) || []).length === 1 && (cg.innerHTML.match(/Abrir aparte/g) || []).length === 2, "   «Verlo aquí» solo para Genially (los demás no se dejan incrustar); «Abrir aparte», todos");
enVivoManos({ pregunta: { id: "q2", abierta: true, texto: "¿Otra pregunta?" } });
c(/Cierra la pregunta en directo que tienes abierta/.test(cj.innerHTML), "   si hay otra pregunta abierta, lo dice en vez de pisarla");
if (parar) parar();
c(llamadas.indexOf("paraE") >= 0 && llamadas.indexOf("paraR") >= 0, "   al salir de la diapositiva deja de escuchar");
console.log("  El recluta responde con dos botones");
c(/data-ses-prac="'\+esc\(LC_PRAC\.voy\)/.test(SES) && /data-ses-prac="'\+esc\(LC_PRAC\.atascado\)/.test(SES), "en la sesión que sigue: «Voy bien» y «Me he atascado»");
c(/esPractica\(p\) && !\/https\?:/.test(SES), "   el enlace, completo (https://)");
c(/data-ev-prac="'\+esc\(PRAC\.voy\)/.test(RJ) && /data-ev-prac="'\+esc\(PRAC\.atascado\)/.test(RJ), "   y en su Nave, los mismos botones");
c(/ENV\.mia&&!\(esPracticaEV\(p\)&&!\/https\?:/.test(RJ), "   la caja del enlace no se rellena con «Voy bien»");
c(/@media \(prefers-reduced-motion:reduce\)\{ \.lc-gal-t\{animation:none\} \}/.test(CSS) && /\.lc-practica \.btn\{min-height:40px\}/.test(CSS), "   botones de 40 px y sin animación para quien la quita");

console.log("\n  Batería 155 · La lección");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
