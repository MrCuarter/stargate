'use strict';
/**
 * BATERÍA 156 · VOLVER A UNA PANTALLA Y LA LLAMADA EN LA VENTANA DE LA PRESENTACIÓN (11-nov-2026, en clase)
 *
 * Norberto, en directo: «No me deja cambiar a una pantalla» y «la bola del mundo no se ve cuando comparto dos pantallas».
 *   1. En la sesión abierta en «ventana aparte» (embed=1&ventana=1) el icono de una/dos pantallas no se pintaba: presentando, la
 *      única salida era un botón debajo de la diapositiva. Ahora el icono sale también ahí (y, presentando, en cualquier embed).
 *   2. Ese botón cerraba sin olvidar «dos pantallas»: con «Recordar mi elección», «Emitir en directo» volvía a abrir la ventana.
 *      Ahora dice «Volver a una pantalla» y hace lo mismo que el icono (presUna: cierra y deja recordado «simple»).
 *   3. La ventana de la presentación arranca de cero: si el motor llega después de pintar la Llamada a filas, se monta otra vez
 *      (antes se quedaba sin la llamada y sin el globo hasta cambiar de diapositiva).
 */
const fs = require("fs"), path = require("path");
const S = fs.readFileSync(path.join(__dirname, "..", "assets/js/sesion.js"), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato).slice(0, 400))); };
const linea = (re) => (S.match(re) || [""])[0];

console.log("Batería 156 · Volver a una pantalla");
// 1 · el icono
const ctl = linea(/\n[^\n]*presBoton\(\):''\)/);
c(/\(!EMBED\|\|VENTANA\|\|PZ\.on\)/.test(ctl), "🔴 el icono de una/dos pantallas sale también en la ventana aparte y, presentando, en cualquier embed", ctl.trim());
c(/function presOn\(on\)\{[\s\S]{0,700}ctl\.insertAdjacentHTML\('beforeend', presBoton\(\)\)/.test(S), "   al empezar a presentar, si la barra no lo tenía, se le pone");
// 2 · el botón del mando = el icono
c(/data-ses-mando-cerrar>Volver a una pantalla</.test(S), "   el botón del mando dice «Volver a una pantalla»");
c(/\[data-ses-mando-cerrar\]'\)\.onclick=presUna;/.test(S), "🔴 el botón del mando hace lo mismo que el icono (presUna)");
c(/if\(PZ\.on\) presUna\(\); else presElegir\('presentador'\);/.test(S), "   el icono, presentando, vuelve a una pantalla con presUna");
const fn = (S.match(/function presUna\(\)\{[\s\S]*?\n  \}/) || [""])[0];
const PRES_CLAVE = "sg-sesion";
// (16-nov · con «al revés»: MANDO_APARTE es la ventana del panel; en la pestaña de siempre, false)
const prueba = (recordado, aparte, emite) => {
  const hechos = [], mem = { v: recordado };
  const GPP = { recordado: () => mem.v, recordar: (k, m) => { hechos.push("recordar:" + k + ":" + m); mem.v = m; } };
  const PZ = { m: { acc: (a) => hechos.push("acc:" + a) }, salta: false };
  const win = { close: () => hechos.push("cerrar-ventana") };
  new Function("GPP", "PRES_CLAVE", "presCerrar", "MANDO_APARTE", "PZ", "DIRECTO", "presOn", "setTimeout", "window", fn + "\npresUna();")(
    GPP, PRES_CLAVE, () => hechos.push("cerrar"), !!aparte, PZ, { on: !!emite }, (on) => hechos.push("presOn:" + on), (f) => f(), win);
  return { hechos, mem: mem.v, salta: PZ.salta };
};
let r = prueba("presentador");
c(r.hechos.includes("cerrar") && r.mem === "simple", "🔴 con «dos pantallas» recordado: cierra la presentación y queda recordado «una pantalla»", r);
r = prueba(null);
c(r.hechos.join() === "cerrar" && r.mem === null, "   sin nada recordado: solo cierra (no se pone a recordar por su cuenta)", r);
// 16-nov · AL REVÉS: desde el panel aparte, la pestaña vuelve a ser la sesión (emitiendo si emitía) y el panel se cierra; nunca «cierra»
r = prueba("presentador", true, true);
c(r.hechos.includes("acc:volver:1") && !r.hechos.includes("cerrar") && r.hechos.includes("cerrar-ventana") && r.salta === true && r.mem === "simple",
  "🔴 al revés, desde el panel emitiendo: la pestaña vuelve con el directo (volver:1), el panel se cierra y no se apaga la emisión al irse", r);
r = prueba(null, true, false);
c(r.hechos.includes("acc:volver") && !r.hechos.includes("acc:volver:1") && !r.hechos.includes("cerrar") && r.salta === false, "   sin emitir: «volver» a secas", r);
// 3 · la llamada en la ventana nueva
const llamada = (S.match(/function montarLlamada\(el\)\{[\s\S]*?var reloj=null, vivo=true, vistos=\{\};/) || [""])[0];
c(/document\.addEventListener\('sg:motor', alMotor, \{once:true\}\)/.test(llamada), "🔴 sin motor todavía, la Llamada espera a sg:motor y se monta otra vez (con su globo)");
c(/sigue=false; document\.removeEventListener\('sg:motor', alMotor\); if\(otra\)/.test(llamada), "   al irse de la diapositiva antes de que llegue, deja de esperar y apaga lo montado");
c(/if\(sigue&&el\.isConnected\) otra=montarLlamada\(el\)/.test(llamada), "   solo se monta si la diapositiva sigue en pantalla");

// 4 · al cargar, una presentación suelta no enciende el mando (salvo «dos pantallas» recordado)
c(/GPP\.mando\(\{ per:st\.per\|\|'demo', ignorar:!MANDO_APARTE&&GPP\.recordado\(PRES_CLAVE\)!=='presentador',/.test(S), "🔴 al cargar, el mando no se enciende por una presentación suelta (la que Chrome reabre al reiniciar), salvo con «dos pantallas» recordado");
const PJ = fs.readFileSync(path.join(__dirname, "..", "assets/js/presentador.js"), "utf8");
c(/m\.tipo === "sigues"\) post\(\{ tipo: "aqui" \}\)/.test(PJ) && /ESPERA = 75000/.test(PJ), "🔴 sin temblor: la presentación contesta al «sigues» del mando y sin señal se esperan 75 s (pieza de GamificaPro)");
c(/calla = true; mirar\(\); \}/.test(PJ), "   tras «una pantalla», el mando calla hasta que se piden dos otra vez");
// 5 · 11-nov (tras la clase) · «la de compartir con el estudiante no se movía ni se veía nada en la bola del mundo» ni la llegada del Puente
const MM = fs.readFileSync(path.join(__dirname, "..", "assets/js/mapaMundo.js"), "utf8");
const PU = fs.readFileSync(path.join(__dirname, "..", "juegos/vivo/puente.html"), "utf8");
c(/var rafG = pulso\.puede\(\) \? pulso\.pedir : null;/.test(MM) && /new W\.Worker\(url\)/.test(MM), "🔴 el globo late con el pulso de GamificaPro: con la ventana escondida (compartida desde detrás), el reloj de un worker");
c(/else esperarTam\(\);/.test(MM), "🔴 creado sin tamaño (la página aún cerrada), se vuelve a mirar cada poco: no depende solo del ResizeObserver");
c(/const latir = \(window\.GP && window\.GP\.mapaMundo && window\.GP\.mapaMundo\.pulso\)/.test(PU) && /pintar\(true\); latir\(bucle\);/.test(PU) && !/requestAnimationFrame\(bucle\)/.test(PU), "🔴 El Puente (la Tierra al planeta) late con el mismo pulso");
// 6 · 13-nov · Fragmento y Ashan, con el mismo pulso; y la huella de juegos/ cuenta lo que pide de fuera
for (const j of ["fragmento", "ashan"]) {
  const T = fs.readFileSync(path.join(__dirname, "..", "juegos/vivo/" + j + ".html"), "utf8");
  c(/<script src="\.\.\/\.\.\/assets\/js\/mapaMundo\.js\?v=[0-9a-f]{10}"><\/script>/.test(T) && /latir\(bucle\);/.test(T) && !/requestAnimationFrame\(bucle\)/.test(T), "🔴 " + j + " late con el pulso de GamificaPro (escondida o sin fotogramas, sigue)");
}
c(/un latido cada vez/.test(MM) && /mudo = true;/.test(MM), "   el pulso: un latido cada vez (no se amontonan) y, a la vista sin fotogramas, también el reloj");
const B = fs.readFileSync(path.join(__dirname, "..", "_build_site.py"), "utf8");
c(/_J_FUERA = sorted/.test(B) && /for _r in _J_FUERA:/.test(B), "🔴 la huella de juegos/ incluye lo que pide de assets/ (mapaMundo): cambiar solo el globo cambia la huella");
// 7 · 16-nov · DOS PANTALLAS AL REVÉS (Norberto: «la ventana que se abre sea el panel del docente y la que se queda, lo que ve el estudiante»)
c(/var APARTE=q\.get\('aparte'\)==='1', MANDO_APARTE=APARTE&&!PRES;/.test(S), "🔴 &aparte=1: en la emergente, el panel; en la pestaña (con presentar=1), la vista de la clase");
c(/GPP\.abrir\(urlCon\(\{ presentar:null, aparte:'1', i:st\.i, directo:DIRECTO\.on\?'1':null \}\), \(st\.per\|\|'demo'\)\+'_mando'\)/.test(S)
  && /location\.replace\(urlCon\(\{ presentar:'1', aparte:'1' \}\)\);/.test(S), "🔴 abrir: el panel en la emergente (misma diapositiva, emitiendo si emitía) y esta pestaña pasa a presentación");
c(/if\(MANDO_APARTE\) return true;/.test(S), "   el panel aparte no vuelve a abrir nada");
c(/encenderDirecto\(\); presAlEmitir\(\); \} \};/.test(S) && /if\(\(EMBED\|\|DIR_URL\) && !st\.alumno/.test(S), "🔴 «Emitir en directo»: primero se enciende y el panel lo hereda (&directo=1) y sigue emitiendo");
c(/if\(DIRECTO\.on&&!PZ\.salta\)\{/.test(S), "   la pestaña que pasa a presentación no apaga el directo al irse");
c(/if\(I_URL!=null\)\{ st\.i=I_URL; I_URL=null; \}/.test(S) && /uL\.searchParams\.delete\('i'\); uL\.searchParams\.delete\('directo'\)/.test(S), "   el panel empieza en la misma diapositiva; i y directo se quitan de la URL al leerlos");
c(/if\(\/\^volver\(:1\)\?\$\/\.test\(a\)\)\{ if\(APARTE\) presVolver\(a==='volver:1'\); return; \}/.test(S), "🔴 en la pestaña, «volver» del panel la devuelve a la sesión del docente");
c(/data-pa="panel">Abrir mi panel<\/button><button type="button" class="btn min" data-pa="una">Volver a una pantalla/.test(S), "   y en ella, al mover el ratón, «Abrir mi panel» y «Volver a una pantalla»");
c(/PZ\.m\.acc\('lcver:'\+/.test(S) && /if\(a==='lcx'\)/.test(S), "🔴 «Verlo aquí» y «Cerrar» del visor de ejemplos, abiertos en el panel, salen también en la vista de la clase");
const CSS = fs.readFileSync(path.join(__dirname, "..", "assets/css/stargate.css"), "utf8");
c(/body\.ses-presenta \.mazo \.lienzo a\[href\],body\.ses-presenta \.mazo \.lienzo \[data-lc-ver\],body\.ses-presenta \.mazo \.lienzo \.lc-visor\{pointer-events:auto\}/.test(CSS),
  "🔴 en la vista de la clase se pulsan los enlaces y los ejemplos (los botones que escriben, no)");
c(/Tu panel, en una ventana aparte; esta pestaña queda como la ve tu clase/.test(PJ) && /Abrir mi panel/.test(PJ), "   la pregunta y la ayuda del motor ya lo cuentan al revés (GamificaPro sdk/presentador.js)");

console.log("\n  " + ok + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
