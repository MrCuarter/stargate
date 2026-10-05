'use strict';
/**
 * Batería 123 · LO QUE SE DESCUBRE PULSANDO, LAS CARTAS Y EL SONIDO DE LA SESIÓN (2-oct)
 *
 * Norberto: «quiero en la sesión semanal de STARGATE las cartas que se voltean, lo que se descubre pulsando y las
 * animaciones, como en las sesiones de Mythos. El sonido, solo si da tiempo». La receta es la de Mythos
 * (mythosclaude/docs/RECETA_MOVIMIENTO_Y_SONIDO.md) sobre los fragmentos que ya tenía el podio.
 *
 * La regla de qué se esconde: COMO MUCHO UNA COSA POR DIAPOSITIVA (salvo el podio, que sube de uno en uno), y lo que no
 * tiene datos sale como siempre, sin nada escondido.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const S = L("assets/js/sesion.js"), CSS = L("assets/css/stargate.css"), FI = L("assets/js/fiesta.js"), H = L("sesion.html");
const global = n => JSON.parse((H.match(new RegExp("window\\." + n + "=(\\[[\\s\\S]*?\\]|\\{[\\s\\S]*?\\});window\\.")) || [])[1] || "null");
const entre = (a, b) => { const i = S.indexOf(a), j = S.indexOf(b, i); return i < 0 || j < 0 ? "" : S.slice(i, j); };

// ── 1 · las piezas, montadas de verdad (lo mismo que hace la 109 con las diapositivas del comandante)
const SEMS = global("SG_SEMANAS"), TRIP = JSON.parse((H.match(/window\.SG_TRIPULANTES=(\{[\s\S]*?\});window\./) || [])[1] || "{}");
const win = { SG: {}, SG_TRIPULANTES: TRIP, SG_IMGV: "" };
const STG = L("assets/js/stargate.js");
const ayudante = n => { const i = STG.indexOf("window.SG." + n + " = function"); return STG.slice(i, STG.indexOf("\n};", i) + 3); };
new Function("window", ayudante("claveComandante") + ayudante("comandanteCuerpo") + ayudante("comandanteHd") + ayudante("avatarRetrato") + ayudante("fondoSemana"))(win);
const api = new Function("window", `
  var st = { d: {}, miNombre: "Ana" }, RET = ${JSON.stringify(global("SG_RETOS"))}, root = { querySelector: function(){ return null; } };
  function elComandante(){ return "Ana"; } function retratoAlVuelo(){} function conRetrato(f){ return f; }
  function planeta(n){ return Number(n) ? ["p" + n, "Planeta " + n, "x"] : null; } function semanas(){ return []; }
  function iDe(){ return -1; } function primeraDelTema(){ return false; }
  ${entre("function esc(s)", "function cargando(")}
  ${entre("function nucleo(txt){", "function badge(k)")}
  ${entre("function tituloReto(txt)", "\n")}
  ${entre("function cmdCuerpo(pose, cls){", "  function diaPortada(s, n){")}
  return { diaRetosSemana: diaRetosSemana, diaHastaPronto: diaHastaPronto, diaTripulante: diaTripulante };
`)(win);
const sem = n => SEMS.filter(s => s.sem === n)[0];

/** Los hijos directos de `.dia` (lo que anima la entrada con `both`). */
function hijosDeDia(html) {
  const out = []; let prof = 0;
  const re = /<(\/?)([a-z0-9]+)([^>]*?)(\/?)>/gi; let m;
  const vacias = /^(img|br|input|hr|source|meta|link)$/i;
  while ((m = re.exec(html))) {
    if (m[1]) { prof--; continue; }
    if (prof === 1) out.push(m[0]);
    if (!vacias.test(m[2]) && !m[4]) prof++;
  }
  return out;
}
const unaCosa = (d) => {
  const fs = (d.html.match(/data-f="(\d+)"/g) || []).map(x => x.match(/\d+/)[0]);
  return d.frag === 1 && fs.length > 0 && fs.every(x => x === "1") && (d.html.match(/data-revelable/g) || []).length === 1;
};
const nadaEnLaEntrada = (d) => hijosDeDia(d.html).every(t => !/data-revelable|rev-antes|rev-despues|carta-giro/.test(t) || /tp-retrato/.test(t) || /class="carta /.test(t));

const rs = api.diaRetosSemana(sem(2));
c(rs && unaCosa(rs) && /class="rev-sellado"/.test(rs.html) && /«Del boceto a la forja»/.test(rs.html), "🔴 los retos de la semana llegan sellados (una sola cosa que descubrir)");
c(/Pulsa para romper el sello/.test(rs.html) && /2 retos sellados/.test(rs.html), "   con la pista que late y cuántos hay");

const tp = api.diaTripulante(sem(2));
c(tp && unaCosa(tp) && /class="carta tp-carta" data-revelable/.test(tp.html), "🔴 el tripulante llega boca abajo: «¿Quién es?»");
c(tp && tp.rot === "¿Quién es?" && !/Bran/.test(tp.rot), "   y la barra de abajo ya no dice su nombre (lo destripaba)");
const antes = tp ? (tp.html.match(/<div class="tp-antes[\s\S]*?<div class="tp-despues/) || [""])[0] : "";
c(antes && !/Bran/.test(antes) && /El Forjador/.test(antes), "   antes de voltearla: su papel y su frase, nunca su nombre");
c(tp && /tp-retrato rev-despues" data-f="1"/.test(tp.html), "   y su retrato, empañado hasta voltearla");

const hp = api.diaHastaPronto(false, null, sem(4));
c(hp && unaCosa(hp) && /¿Qué pasará la semana que viene\?/.test(hp.html) && /La semana 4/.test(hp.html) && hp.html.indexOf(sem(4).tema.split(" · ")[0]) > 0,
  "🔴 la despedida: «¿Qué pasará la semana que viene?» en una carta, y detrás el tema de la semana siguiente (del calendario)");
const hp0 = api.diaHastaPronto(false, null, null), hpFin = api.diaHastaPronto(true);
c(!hp0.frag && !/data-revelable/.test(hp0.html) && !hpFin.frag && !/data-revelable/.test(hpFin.html), "   sin semana siguiente (o en la última del viaje), sin carta: sale como siempre");
c([rs, tp, hp].every(nadaEnLaEntrada), "🔴 nada que cambie al descubrir es hijo directo de .dia (la entrada con `both` le ganaría)");
c(/\.dia\.entra > \*\{animation:ses-sube \.5s cubic-bezier\(\.2,\.8,\.2,1\) both\}/.test(CSS), "   (la entrada sigue con `both`: cambiarla oscurecería los fondos de todas las diapositivas)");

// ── 2 · las demás, en el código (dependen del tablero)
const fn = n => entre("function " + n + "(", "\n  }\n");
c(/frag:1, html:/.test(fn("diaAnteriores")) && /empanadoRev\('<div class="ant-lista">'/.test(fn("diaAnteriores")) && /¿Os acordáis de /.test(fn("diaAnteriores")),
  "🔴 «¿Os acordáis?»: las misiones de la semana anterior llegan empañadas");
c(/if\(!filas\.length \|\| !filas\.some/.test(fn("diaAnteriores")), "   (y solo si hay de qué acordarse: si nadie las hizo, no hay diapositiva)");
c(/var sella=rel&&!!pide/.test(S) && /frag:sella\?1:0/.test(S) && /sella\?selladoRev\(pideH, 'El reto, sellado'\)/.test(S),
  "🔴 el relámpago: lo que hay que hacer, sellado (solo si hay enunciado)");
c(/if\(a==='go'&&!tic&&queda>0\)\{ var slC=st\.slides\[st\.i\]; if\(slC&&slC\.frag&&st\.f<slC\.frag\) fijarF\(slC\.frag\);/.test(S),
  "   y «Empezar» en el cronómetro rompe el sello: no se cuenta el tiempo de algo que no se ve");
c(/k:'insignias', rot:'Insignias', frag:1/.test(S) && /cartaRev\(dorsoRev\('', false\), '<img src="assets\/img\/insignias\//.test(S) && /class="rev-zona" data-revelable data-f="1"/.test(S),
  "🔴 las insignias de la semana, boca abajo: una pulsación las voltea todas (una detrás de otra)");
c(/<div class="podio" data-revelable data-f="'\+n\+'"/.test(S) && /Pulsa para ver quién sube/.test(S), "   el podio se pulsa (sube uno cada vez) y lleva su pista");
const conFrag = (S.match(/\bfrag:[^,}\s]+, (?:html|montar):/g) || []).length;   // (las diapositivas que declaran algo escondido)
// 5-oct · y la rueda de la nota de la presentación (Norberto: «que se llene con cada nota»): otra excepción, como el podio
c(conFrag === 8 && /k:'embarque_nota_ej', sec:'embarque', rot:'Tu nota, un ejemplo', frag:N\+1/.test(S), "   y nada más esconde nada: retos, relámpago, tripulante, despedida, «¿Os acordáis?», podio, insignias y la rueda de la nota", conFrag);

// ── 3 · el motor: pulsar, →, R, al volver atrás entera, y lo descubierto llega a quien sigue al docente
c(/function fijarF\(f\)\{/.test(S) && /var antes=st\.f; st\.f=f; frags\(\); emitir\(\);/.test(S), "🔴 descubrir pasa por un solo sitio: pinta, emite y suena");
c(/root\.addEventListener\('click', function\(e\)\{\s*var r=e\.target\.closest&&e\.target\.closest\('\.lienzo \[data-revelable\]'\); if\(!r\|\|r\.classList\.contains\('on'\)\) return;/.test(S)
  && /e\.preventDefault\(\); e\.stopPropagation\(\); fijarF\(st\.f\+1\);/.test(S), "   pulsar lo escondido lo descubre sin pasar; ya descubierto, el clic no hace nada especial");
c(/if\(sl&&sl\.frag&&st\.f<sl\.frag\)\{ fijarF\(st\.f\+1\); return; \}\s*ir\(st\.i\+1\);/.test(S), "   → / espacio / el mando: primero descubre, a la siguiente pasa");
c(/st\.f=hacia_atras&&st\.slides\[i\]\.frag\?st\.slides\[i\]\.frag:0;/.test(S), "   al volver atrás, la diapositiva se ve entera");
c(/\(e\.key==='r'\|\|e\.key==='R'\)&&!e\.metaKey&&!e\.ctrlKey&&!e\.altKey\)\{ e\.preventDefault\(\); alternarRev\(\);/.test(S)
  && /fijarF\(st\.f<sl\.frag\?sl\.frag:0\)/.test(S), "   R descubre o vuelve a esconder");
c(/rv&&\(e\.key==='Enter'\|\|e\.key===' '\)&&!rv\.classList\.contains\('on'\)/.test(S), "   con el teclado: Intro o espacio sobre lo escondido");
c(/var firma=st\.sem\+'\|'\+o\.k\+'\|'\+o\.n\+'\|'\+st\.f;/.test(S) && /k:o\.k, n:o\.n, f:st\.f\|\|0,/.test(S), "🔴 el docente emite también lo descubierto (f)");
c(/if\(i>=0&&i===st\.i&&s\.f!=null\)\{[^\n]*st\.f=fS; frags\(\);/.test(S), "   y quien le sigue lo ve (sin `f`, como antes)");
c(/if\(st\.alumno&&enDirecto\(\)\)\{ avisoBloqueo\(\); return false; \}/.test(fn("fijarF")), "   quien sigue en directo no descubre por su cuenta");
c(/\.podio-p\.fr:not\(\.on\)\{pointer-events:none\}/.test(CSS) && /if\(e\.target\.closest\('\.cara\[data-quien\],a,button'\)\) return;/.test(S),
  "   en el podio, la cara de quien aún no ha subido no abre su ficha");
c(/r\.querySelectorAll\('\.carta-b,\.rev-dentro,\.rev-texto'\)[\s\S]{0,120}aria-hidden', on\?'false':'true'/.test(S), "   lo escondido no lo lee un lector de pantalla");

// ── 4 · el kit de CSS (receta §3)
c(/\.carta\{perspective:1800px/.test(CSS) && /\.carta-giro\{display:grid;height:100%;transform-style:preserve-3d\}/.test(CSS)
  && /\.carta-a,\.carta-b\{grid-area:1\/1;[^}]*backface-visibility:hidden/.test(CSS), "🔴 la carta: dos caras en la misma celda de rejilla (mide lo que la más alta)");
c(/\.carta-b\{transform:rotateY\(180deg\);visibility:hidden\}/.test(CSS) && /\[data-f\]\.on \.carta-b\{visibility:visible\}/.test(CSS), "   la cara de abajo no está en lo visible hasta voltearla");
c(/\.rev-sellado:not\(\.on\) \.rev-dentro\{opacity:0;transform:translateY\(36px\);visibility:hidden\}/.test(CSS) && /\.rev-sellado\.on \.rev-sello\{opacity:0;transform:scale\(1\.4\)/.test(CSS),
  "   el sello: lo de dentro, invisible en su sitio; al romperlo crece y se desvanece");
c(/\.rev-empanado:not\(\.on\) \.rev-texto\{filter:blur\(16px\);opacity:\.5/.test(CSS), "   el recuerdo empañado");
const pista = (CSS.match(/\.rev-pista\{[^}]*font-size:clamp\(([\d.]+)rem/) || [])[1];
c(Number(pista) * 16 >= 16 && /\.rev-pista\{[^}]*\}/.test(CSS) && /clamp\(1\.05rem,1\.6vw,1\.3rem\)/.test(CSS), "   la pista: nunca por debajo de 16 px, y 20 px en el lienzo de 1280", pista);
const mov = (CSS.match(/@media \(prefers-reduced-motion:no-preference\)\{\n  \.carta-giro\{transition[\s\S]*?\n\}/) || [""])[0];
c(/\.carta-giro\{transition:transform/.test(mov) && /rev-late 2\.2s/.test(mov) && /\.rev-sellado\.on \.rev-dentro\{transition/.test(mov), "🔴 todo el movimiento, solo con «sin reducir movimiento»");
c(/@media \(prefers-reduced-motion:reduce\)\{\n  \.carta-giro,\.carta-a,\.carta-b,\.rev-antes,\.rev-despues,\.rev-dentro,\.rev-sello,\.rev-texto,\.rev-velo,\.rs-cera,\.tp-retrato\{transition:none !important\}\n  \.rev-pista\{animation:none !important\}/.test(CSS),
  "   y con «reducir movimiento», nada se mueve (y todo se descubre igual)");
c(!/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(entre("function pistaRev(", "function arrancaClip(")), "   sin emojis: iconos propios (ojo, candado, interrogación, medalla)");

// ── 5 · el sonido (SG.FIESTA), solo en la pantalla que proyecta
["volteo", "sello", "chispa", "pagina", "pop", "reloj"].forEach(n => c(new RegExp("\\n    " + n + ": function \\(\\) \\{").test(FI), "   fiesta.js sabe hacer «" + n + "» (sintetizado, sin ficheros)"));
c(/if \(!suena\(\) \|\| !SONIDOS\[cual\]\) return;\s*if \(window\.__sgSonidos\) window\.__sgSonidos\.push\(cual\);/.test(FI), "   (las pruebas apuntan lo que suena de verdad: con el sonido quitado, nada)");
c(/function sonar\(n, ms\)\{\s*if\(st\.alumno\) return;/.test(S), "🔴 nunca suena en la pantalla de quien sigue al docente");
c(/callarPendientes\(\); if\(!desdeDirecto\) sonar\('pagina'\);/.test(S), "   pasar suena a página (y lo que quedaba por sonar se calla)");
c(/if\(sl\.k==='retos-semana'\|\|sl\.k==='reto'\) return sonar\('sello'\);/.test(S) && /sonar\('volteo'\); if\(sl\.k==='hasta'\) sonar\('chispa', 380\);/.test(S)
  && /if\(sl\.k==='anteriores'\) return sonar\('chispa'\);/.test(S), "   el sello suena a sello, la carta a volteo (la de la semana que viene, con chispa) y el recuerdo a chispa");
c(/if\(f<=antes\) return;/.test(S), "   volver a esconder, en silencio");
c(/\(e\.key==='m'\|\|e\.key==='M'\)&&!e\.metaKey&&!e\.ctrlKey&&!e\.altKey&&!st\.alumno\)\{ e\.preventDefault\(\); alternarSon\(\);/.test(S)
  && /localStorage\.setItem\('sgSonido', suenaSesion\(\)\?'no':'si'\)/.test(S) && /id="ses-son"/.test(S), "   M o el altavoz lo quitan, con la misma preferencia de toda la web");
c(/window\.addEventListener\('storage', function\(e\)\{ if\(e\.key==='sgSonido'\) pintarSon\(\); \}\);/.test(S), "   y si se quita en otra ventana, esta se entera");
c(/sonar\('reloj'\); tic=setInterval/.test(S) && /if\(queda>0&&queda<=5\) sonar\('reloj'\);/.test(S), "   el cronómetro: tictac al empezar y en los cinco últimos segundos");

// ── 6 · 3-oct · la Academia, con el mismo movimiento (Norberto: «no tienen animaciones como el resto de sesiones»)
const A = L("assets/js/academia.js"), AH = L("academia.html");
c(/fiesta\.js\?v=[0-9a-f]+" defer><\/script><script src="assets\/js\/academia\.js/.test(AH), "🔴 la Academia carga fiesta.js (el sonido) antes que academia.js");
c(/var clave = i \+ ":" \+ PANT, nueva = clave !== VISTA; VISTA = clave;/.test(A) && /\(nueva \? " acd-entra" : ""\)/.test(A),
  "🔴 cada pantalla NUEVA entra con movimiento; repintarla (responder, cumplir un hito) no lo repite");
c(/\(e\.carta \? cartaTrip\(e, i\) :/.test(A) && /class="acd-carta-trip carta' \+ \(on \? " on" : ""\) \+ '" data-f="1" data-revelable/.test(A) && /¿Quién es\?/.test(A),
  "🔴 la carta del tripulante llega boca abajo («¿Quién es?»), como la verá su alumnado");
c(/if \(sp\.disabled \|\| voltear\(\)\) return; irPantalla\(PANT \+ 1\);/.test(A) && /else if \(voltear\(\)\) ev\.preventDefault\(\);/.test(A),
  "   → primero la voltea y a la siguiente pasa (el botón y la tecla)");
c(/if \(P\[PANT - 1\] && P\[PANT - 1\]\.t === "llegada"\) VOLT\[i\] = true;/.test(A), "   al volver atrás, ya volteada");
c(/\(ev\.key === "r" \|\| ev\.key === "R"\)[^\n]*voltear\(true\)/.test(A) && /\(ev\.key === "m" \|\| ev\.key === "M"\)[^\n]*alternarSon\(\)/.test(A), "   R la voltea o la tapa; M quita el sonido (y el altavoz, junto a la pantalla completa)");
c(/function irPantalla\(k\) \{ PANT = k; recordar\(\); sonar\("pagina"\); pintarPantalla\(\); \}/.test(A) && /if \(!on\) sonar\("volteo"\);/.test(A)
  && /if \(x\.t === "fin" && hecha\(i\) && nueva && !FESTEJO\[i\]\)[\s\S]{0,200}sonar\("mision", 250\);[\s\S]{0,200}F\.chispas/.test(A),
  "   suena la página, el volteo y, al cerrar un planeta, la fanfarria con chispas (una vez)");
const acdMov = (CSS.match(/@media \(prefers-reduced-motion:no-preference\)\{\n  \.acd-dia\.acd-entra[\s\S]*?\n\}/) || [""])[0];
c(/acd-asienta/.test(acdMov) && /\.acd-bocadillo\{animation:acd-salta/.test(acdMov) && /\.acd-corte\.izq\{animation:acd-desde-izq/.test(acdMov) && /\.acd-pasos li\{animation/.test(acdMov),
  "🔴 las entradas (fondo, texto, personajes, bocadillo, pasos), solo con «sin reducir movimiento»");
c(!/forwards|both/.test(acdMov) && /@keyframes acd-sube\{from\{opacity:0;translate:0 22px\}\}/.test(CSS),
  "   solo `from` y `backwards`, con translate/scale sueltos (no pisan el transform de cada pieza)");
c(/\.acd-carta-trip\.carta\{position:absolute;right:5%;top:8%;aspect-ratio:720\/1210/.test(CSS), "   la carta, en su sitio (la regla general de .carta no la mueve)");

console.log("\n  Batería 123 · lo que se descubre pulsando, las cartas y el sonido");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exitCode = fallos.length ? 1 : 0;
