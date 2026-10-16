'use strict';
/**
 * BATERÍA 149 · EN DIRECTO, EL RECLUTA VE EXACTAMENTE EL MAZO DEL DOCENTE (16-oct)
 * ------------------------------------------------------------------------------------------------
 * María Sierra, con 84 reclutas en clase: «en directo no ven la misma diapositiva» (recomendaba el diferido). Norberto: «Es VITAL
 * que el estudiante vea lo mismo que está viendo el docente aunque lo haya cambiado» y «en directo?? Debería ver exactamente lo
 * mismo que el docente».
 *
 * Por qué no lo veía: el recluta montaba su mazo con lo que su Comandante tenía guardado AL CARGAR (secciones apagadas, orden,
 * panel) y sin las diapositivas solo del docente («Únete» en las semanas 1 y 2, «¡Alistaos!», la Nave de ejemplo); el panel del
 * despegue no estaba en la Nave (embed); y si no encontraba la diapositiva, se quedaba quieto en silencio. La emisión, además,
 * se tragaba sus fallos.
 *
 * Qué se demuestra, con las funciones DE VERDAD de sesion.js (sacadas del fichero y corridas aquí):
 *   1. el recluta que sigue en directo usa el mazo que manda el docente (quién, apagadas, orden, panel) y las de solo docente;
 *   2. sin directo, en diferido, o con una página del docente de antes (sin `mazo`), todo exactamente como antes;
 *   3. el docente manda su mazo con cada diapositiva, y el plan B: adónde va el recluta si no tiene la diapositiva;
 *   4. la emisión ya no falla en silencio (el botón lo dice, se apunta y se reintenta).
 * (El directo de punta a punta, con dos navegadores, lo hace pruebas/vivo/directo_mismo_mazo.cjs.)
 *
 * 16-oct (noche) · la regla de adónde va y la emisión son ya la pieza del motor (GamificaPro sdk/directo.js, `GP.directo`, común con
 * DPG): 1-3 corren igual con la pieza de verdad (assets/js/directo.js) dentro; 4 mira que sesion.js la usa con lo mismo de antes
 * (respiro de 350 ms, firma con el mazo, «Sin señal», registro y reintento). La emisión entera, en tests/sdk/directo.test.ts.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const raiz = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(raiz, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato).slice(0, 400))); };

console.log("▶ 149 · En directo, el mazo del docente");
const SES = leer("assets/js/sesion.js"), MOTOR = leer("assets/js/motor.js"), CSS = leer("assets/css/stargate.css"), HTML = leer("sesion.html");
const PIEZA = require(path.join(raiz, "assets/js/directo.js"));

/** Una función de sesion.js tal cual (de «  function nombre(» a su llave de cierre). */
function funcion(nombre) {
  const i = SES.indexOf("\n  function " + nombre + "(");
  if (i < 0) throw new Error("no encuentro " + nombre);
  let j = SES.indexOf("{", i), prof = 0, k = j;
  for (; k < SES.length; k++) { const ch = SES[k]; if (ch === "{") prof++; else if (ch === "}" && --prof === 0) break; }
  return SES.slice(i, k + 1);
}
const NOMBRES = ["mazoDocente", "comoDocente", "panelPropio", "panelDelMazo", "apagadas", "ordenGuardado", "elComandante", "enDirecto",
  "indiceDe", "dondeVa", "firmaMazo", "mazoParaEmitir"];
const codigo = NOMBRES.map(funcion).join("\n") + "\nthis.F={" + NOMBRES.join(",") + "};";
function mundo({ alumno = false, diferido = false, sesion = null, slides = [], d = {} } = {}) {
  const ctx = { window: { SG_PANEL_MAESTRO: "https://maestro", GP: { directo: PIEZA } }, DIFERIDO: diferido, Date, JSON, String, Number, Array, Object,
    SEG: { d: sesion ? { sesion } : {} }, st: Object.assign({ alumno, per: "g1", miNombre: alumno ? "" : "Ana", profeMio: alumno ? "Ana" : "", slides, d }) };
  vm.createContext(ctx); vm.runInContext(codigo, ctx);
  return ctx;
}
const D = { sesiones: { Ana: ["ranking"], Luis: [] }, modOrdenSesion: { Ana: ["pregunta", "llamada"] }, paneles: { Ana: "https://panel-ana" } };
const ahora = Date.now();
const MAZO = { quien: "Luis", off: ["oferta", "votacion"], orden: ["llamada", "pregunta"], panel: "https://panel-luis", ks: ["portada", "unete", "llamada", "genially"] };

// ── 1 · el recluta que sigue en directo, con el mazo del docente
let m = mundo({ alumno: true, d: D, sesion: { activa: true, t: ahora, k: "portada", n: 0, mazo: MAZO } });
c(m.F.mazoDocente() && m.F.comoDocente() === true, "🔴 en directo, el recluta monta el mazo como el docente (con «Únete», «¡Alistaos!» y la Nave de ejemplo)");
c(JSON.stringify(m.F.apagadas()) === '["oferta","votacion"]', "🔴 lo que el docente apaga AHORA (no lo que había al cargar la página)", m.F.apagadas());
c(JSON.stringify(m.F.ordenGuardado()) === '["llamada","pregunta"]', "   en su orden de ahora", m.F.ordenGuardado());
c(m.F.elComandante() === "Luis", "   y de quien presenta (otra persona del equipo docente, no solo su Comandante)", m.F.elComandante());
c(m.F.panelDelMazo(false) === "https://panel-luis", "🔴 el panel del despegue, aunque la Nave lo abra embebido (antes no estaba y el recluta se quedaba atrás)");
m = mundo({ alumno: true, d: D, sesion: { activa: true, t: ahora, k: "portada", n: 0, mazo: Object.assign({}, MAZO, { panel: "" }) } });
c(m.F.panelDelMazo(true) === "", "   y sin panel si el docente no lo lleva (dentro de su Genially)");

// ── 2 · todo lo demás, como antes
m = mundo({ alumno: true, d: D });
c(!m.F.mazoDocente() && m.F.comoDocente() === false && JSON.stringify(m.F.apagadas()) === '["ranking"]' && m.F.elComandante() === "Ana",
  "🔴 sin directo: el mazo de su Comandante, sin las de solo docente (como siempre)");
c(m.F.panelDelMazo(true) === "https://panel-ana" && m.F.panelDelMazo(false) === "", "   con el panel de siempre");
m = mundo({ alumno: true, diferido: true, d: D, sesion: { activa: true, t: ahora, k: "portada", n: 0, mazo: MAZO } });
c(!m.F.mazoDocente() && JSON.stringify(m.F.apagadas()) === '["ranking"]', "🔴 en diferido, nunca el mazo del directo (aunque el docente esté emitiendo)");
m = mundo({ alumno: true, d: D, sesion: { activa: true, t: ahora, k: "portada", n: 0 } });
c(!m.F.mazoDocente() && JSON.stringify(m.F.ordenGuardado()) === '["pregunta","llamada"]', "   con una página del docente de antes (sin `mazo`), como antes");
m = mundo({ alumno: true, d: D, sesion: { activa: false, t: ahora, mazo: MAZO } });
c(!m.F.mazoDocente(), "   y al acabar el directo, de vuelta a su propio mazo");
m = mundo({ alumno: true, d: D, sesion: { activa: true, t: ahora - 4 * 3600e3, mazo: MAZO } });
c(!m.F.mazoDocente(), "   (un directo olvidado de hace horas no cuenta)");
m = mundo({ alumno: false, d: D, sesion: { activa: true, t: ahora, mazo: MAZO } });
c(m.F.comoDocente() && JSON.stringify(m.F.apagadas()) === '["ranking"]' && m.F.elComandante() === "Ana", "   el docente, siempre con lo suyo");

// ── 3 · lo que manda el docente, y adónde va el recluta
const SL = ["portada", "unete", "llamada", "pregunta", "genially", "video", "video", "hasta"].map(k => ({ k, rot: k }));
m = mundo({ alumno: false, d: D, slides: SL });
const mz = m.F.mazoParaEmitir();
c(mz.quien === "Ana" && JSON.stringify(mz.off) === '["ranking"]' && JSON.stringify(mz.orden) === '["pregunta","llamada"]' && mz.panel === "https://panel-ana"
  && mz.ks.join() === SL.map(x => x.k).join(), "🔴 el docente manda su mazo: quién, apagadas, orden, panel y la lista de diapositivas", mz);
m = mundo({ alumno: false, d: D, slides: SL.filter(x => x.k !== "genially") });
c(m.F.mazoParaEmitir().panel === "", "   (sin panel en su mazo, panel '')");
const tam = JSON.stringify({ mazo: m.F.mazoParaEmitir() }).length;
c(tam < 2000, "   y pesa poco (" + tam + " bytes; el servidor admite 200.000)");
const alumnoCon = (slides) => mundo({ alumno: true, slides, sesion: { activa: true, t: ahora } });
m = alumnoCon(SL);
c(JSON.stringify(m.F.dondeVa({ k: "video", n: 1 })) === '{"i":6,"exacto":true}', "   lo normal: la misma diapositiva (y la misma vez, si se repite)");
m = alumnoCon(SL.filter(x => x.k !== "unete" && x.k !== "genially"));
const ks = SL.map(x => x.k);
c(JSON.stringify(m.F.dondeVa({ k: "genially", n: 0, i: 4, ks })) === '{"i":2,"exacto":false}', "🔴 plan B: si no la tiene, a la última que tienen los dos (y lo dice)", m.F.dondeVa({ k: "genially", n: 0, i: 4, ks }));
c(JSON.stringify(m.F.dondeVa({ k: "unete", n: 0, i: 1, mazo: { ks } })) === '{"i":0,"exacto":false}', "   (la lista también vale dentro de `mazo`)");
c(m.F.dondeVa({ k: "zzz", n: 0 }).i === -1 && m.F.dondeVa({ k: "zzz", n: 0 }).exacto === false, "   sin lista (un docente con la página de antes), no se mueve, pero lo dice");
c(m.F.firmaMazo({ mazo: MAZO }) === m.F.firmaMazo({ mazo: Object.assign({ panel: MAZO.panel }, MAZO) }) && m.F.firmaMazo({}) === "",
  "   la firma del mazo no depende del orden de los campos (no repinta de más)");
c(m.F.firmaMazo({ mazo: MAZO }) === m.F.firmaMazo({ mazo: Object.assign({}, MAZO, { ks: ["portada"] }) }) && m.F.firmaMazo({ mazo: MAZO }) !== m.F.firmaMazo({ mazo: Object.assign({}, MAZO, { off: [] }) }),
  "   ni de la lista `ks` (la docente en los dos tramos del Genially no le hace repintar), pero sí de lo que apaga");

// ── 4 · el código: donde se usa cada cosa
c(/if\(st\.per && comoDocente\(\) && \(Number\(s\.sem\)\|\|1\)<=2\) d\.push\(diaUnete\(\)\);/.test(SES), "🔴 «Únete» (semanas 1 y 2) también para quien sigue en directo");
c(/else if\(pieza==='alistaos'\)\{ if\(st\.per && comoDocente\(\)\) add\(diaAlistaos\(\)\); \}/.test(SES), "   y «¡Alistaos!» en la presentación");
c((SES.match(/if\(!comoDocente\(\)\) todo=todo\.filter\(function\(x\)\{ return x\.k!=='simulacro'; \}\);/g) || []).length === 2 && !/if\(st\.alumno\) todo=todo\.filter/.test(SES),
  "   y la Nave de ejemplo (en la semana y en la presentación)");
c((SES.match(/var panel=panelDelMazo\(!EMBED \|\| VENTANA \|\| DIFERIDO\);/g) || []).length === 2, "   el panel, por panelDelMazo en la semana y en la presentación");
c(/if\(st\.alumno\)\{ cod\.textContent='✓';/.test(funcion("montarUnete")), "   «Únete», para el recluta: ya está a bordo (no intenta leer el código de clase, que es del equipo docente)");
const em = funcion("emitir"), emi = funcion("emisor");
c(/mazo:mz/.test(em) && /i:st\.i, de:st\.slides\.length/.test(em) && /rot:String\(sl\.rot/.test(em), "🔴 cada diapositiva emitida lleva el mazo, su posición y su nombre");
c(/JSON\.stringify\(mz\)/.test(em) && /em\.emitir\(firma, function\(\)\{/.test(em), "   y si el docente cambia el mazo sin moverse de diapositiva, se vuelve a emitir (la firma lleva el mazo)");
c(!/\.catch\(function\(\)\{\}\)/.test(em + emi) && /D\.emisor\(\{/.test(emi) && /respiro:350,/.test(emi) && /alCambiar:function\(x\)\{ DIRECTO\.fallos=x\.fallos; pintarDirecto\(\); \}/.test(emi)
  && /M\.apuntarFallo\(e, 'sesion-directo'\)/.test(emi), "🔴 la emisión ya no falla en silencio: «Sin señal», al registro de fallos y se reintenta (la pieza del motor, GP.directo.emisor)");
c(/DIRECTO\.em\.olvidar\(\)/.test(funcion("encenderDirecto")) && /DIRECTO\.em\.parar\(\)/.test(funcion("apagarDirecto")), "   encender vuelve a mandar aunque sea la misma; apagar lo para todo (respiro y reintento)");
c(/<script src="assets\/js\/directo\.js\?v=[0-9a-f]{10}" defer><\/script>\n<script src="assets\/js\/sesion\.js\?v=/.test(HTML), "   sesion.html carga la pieza antes que sesion.js");
// la pieza de verdad, con lo de antes: el respiro, la firma, el reintento que crece hasta 10 s
{
  const enviados = []; let ahora = 0; const T = [];
  const R = { poner: (f, ms) => { T.push({ t: ahora + ms, f }); return T.length; }, quitar: (i) => { if (i && T[i - 1]) T[i - 1].f = null; } };
  let fallar = 1; const avisos = [];
  const E = PIEZA.emisor({ reloj: R, respiro: 350, mandar: (d) => { enviados.push(d); return fallar-- > 0 ? Promise.reject(new Error("x")) : Promise.resolve(); }, alCambiar: (x) => avisos.push(x.fallos) });
  const correr = async (ms) => { const fin = ahora + ms; for (;;) { const x = T.filter((y) => y.f && y.t <= fin).sort((a, b) => a.t - b.t)[0]; if (!x) break; ahora = x.t; const f = x.f; x.f = null; f(); await new Promise((r) => setImmediate(r)); } ahora = fin; };
  (async () => {
    E.emitir("a", () => "a"); E.emitir("b", () => "b"); await correr(350);
    c(JSON.stringify(enviados) === '["b"]' && JSON.stringify(avisos) === "[1]", "   (la pieza) dos seguidas son una escritura; si falla, «Sin señal»", [enviados, avisos]);
    await correr(2350);
    c(JSON.stringify(enviados) === '["b","b"]' && JSON.stringify(avisos) === "[1,0]", "   (la pieza) a los 2 s lo vuelve a mandar y, al llegar, se quita el aviso", [enviados, avisos]);
    fin149();
  })();
}
c(/b\.innerHTML=sinSenal\?'Sin señal/.test(funcion("pintarDirecto")) && /\.ses-directo\.on\.sin-senal/.test(CSS), "   el botón del docente lo dice");
c(/function apuntarFallo\(e, pantalla\)/.test(MOTOR) && /publicarEnVivo, apuntarFallo,/.test(MOTOR), "   (motor.js: apuntarFallo, al registro de la pieza del motor)");
const sd = funcion("seguirDocente");
c(/var fm=enDirecto\(\)\?firmaMazo\(s\):'', otroMazo=fm!==SEG\.mazoDe;/.test(sd) && /else if\(otroMazo\) pintar\(\);/.test(sd) && /else \{ SEG\.perdido=null; if\(otroMazo\) pintar\(\); \}/.test(sd),
  "🔴 el recluta rehace su mazo cuando cambia el del docente, y vuelve al suyo al acabar el directo");
c(/var va=dondeVa\(s\), i=va\.i;/.test(sd) && /SEG\.perdido=va\.exacto\?null:/.test(sd), "   y va adonde diga dondeVa (el plan B)");
const ps = funcion("pintarSeguir");
c(/ses-al-perdido/.test(ps) && /Tu Comandante está en «/.test(ps) && /id="ses-al-aldia">Ponerme al día/.test(ps) && /location\.reload\(\)/.test(ps) && /\.ses-al-perdido\{/.test(CSS),
  "🔴 si no tiene la diapositiva, el rótulo dice dónde está su Comandante y ofrece ponerse al día");

function fin149() {
  console.log("\n  Batería 149 · " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  if (fallos.length) process.exit(1);
}
