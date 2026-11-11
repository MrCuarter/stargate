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
const fn = linea(/function presUna\(\)\{[^\n]*\}/);
const PRES_CLAVE = "sg-sesion";
const prueba = (recordado) => {
  const hechos = [], mem = { v: recordado };
  const GPP = { recordado: () => mem.v, recordar: (k, m) => { hechos.push("recordar:" + k + ":" + m); mem.v = m; } };
  new Function("GPP", "PRES_CLAVE", "presCerrar", fn + "\npresUna();")(GPP, PRES_CLAVE, () => hechos.push("cerrar"));
  return { hechos, mem: mem.v };
};
let r = prueba("presentador");
c(r.hechos[0] === "cerrar" && r.mem === "simple", "🔴 con «dos pantallas» recordado: cierra la presentación y queda recordado «una pantalla»", r);
r = prueba(null);
c(r.hechos.join() === "cerrar" && r.mem === null, "   sin nada recordado: solo cierra (no se pone a recordar por su cuenta)", r);
// 3 · la llamada en la ventana nueva
const llamada = (S.match(/function montarLlamada\(el\)\{[\s\S]*?var reloj=null, vivo=true, vistos=\{\};/) || [""])[0];
c(/document\.addEventListener\('sg:motor', alMotor, \{once:true\}\)/.test(llamada), "🔴 sin motor todavía, la Llamada espera a sg:motor y se monta otra vez (con su globo)");
c(/sigue=false; document\.removeEventListener\('sg:motor', alMotor\); if\(otra\)/.test(llamada), "   al irse de la diapositiva antes de que llegue, deja de esperar y apaga lo montado");
c(/if\(sigue&&el\.isConnected\) otra=montarLlamada\(el\)/.test(llamada), "   solo se monta si la diapositiva sigue en pantalla");

// 4 · al cargar, una presentación suelta no enciende el mando (salvo «dos pantallas» recordado)
c(/GPP\.mando\(\{ per:st\.per\|\|'demo', ignorar:GPP\.recordado\(PRES_CLAVE\)!=='presentador',/.test(S), "🔴 al cargar, el mando no se enciende por una presentación suelta (la que Chrome reabre al reiniciar), salvo con «dos pantallas» recordado");
const PJ = fs.readFileSync(path.join(__dirname, "..", "assets/js/presentador.js"), "utf8");
c(/m\.tipo === "sigues"\) post\(\{ tipo: "aqui" \}\)/.test(PJ) && /ESPERA = 75000/.test(PJ), "🔴 sin temblor: la presentación contesta al «sigues» del mando y sin señal se esperan 75 s (pieza de GamificaPro)");
c(/calla = true; mirar\(\); \}/.test(PJ), "   tras «una pantalla», el mando calla hasta que se piden dos otra vez");
console.log("\n  " + ok + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
