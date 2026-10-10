/**
 * BATERÍA 145 · EL PARTE DEL TICKET, ESCUADRÓN POR ESCUADRÓN (10-oct)
 * ------------------------------------------------------------------------------------------------
 * Norberto, del PER 16450: «la raya para la meta del 25 %… la idea es ir incrementando la raya»; «lanzar un aviso en la nave
 * del estudiante recordando hacer el ticket de salida de la sesión presentación a todos los que no lo han hecho»; y «cuando
 * empiece la semana del tema dos, se puede recordar hacer el del tema 1».
 *
 * Lo común vive en tkcomun.js (SG.TK): qué tickets están en juego, el parte del servidor (`modTicket` parte), si el recluta ya
 * lo envió (`modTicket` estado) y la línea con su barra y su raya. Lo usan la sala del docente (clase.js), la caja de tickets
 * de su Nave (consola.js), la Nave del recluta (recluta.js) y la diapositiva del escuadrón (sesion.js).
 */
const fs = require("fs"), path = require("path");
const raiz = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(raiz, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };
const igual = (a, b, txt) => c(JSON.stringify(a) === JSON.stringify(b), txt, { esperaba: b, fue: a });

console.log("▶ 145 · El parte del ticket, escuadrón por escuadrón");
const HTML = leer("recluta.html");
const SEM = JSON.parse(HTML.match(/window\.SG_SEMANAS=(\[.*?\]);window\./)[1]);
const TEMAS = JSON.parse(HTML.match(/window\.SG_TICKET_TEMAS=(\{[^}]*\})/)[1]);

// el lector común, en un navegador de mentira
const almacen = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, _m: m }; };
const W = { SG_TICKET_TEMAS: TEMAS };
global.window = W; global.localStorage = almacen(); global.sessionStorage = almacen();
require(path.join(raiz, "assets/js/tkcomun.js"));
const TK = W.SG.TK;

// ── 1 · qué tickets están en juego
igual(TK.ticketsAbiertos(SEM, 0), ["p"], "🔴 semana 1: solo el del embarque");
igual(TK.ticketsAbiertos(SEM, 1), ["1", "p"], "   semana 2 (cierra el tema 1): el del tema 1 y el del embarque");
igual(TK.ticketsAbiertos(SEM, 2), ["1", "p"], "🔴 semana 3 (empieza el tema 2): se sigue recordando el del tema 1 («cuando empiece la semana del tema dos…»)");
igual(TK.ticketsAbiertos(SEM, 3), ["2", "1", "p"], "   semana 4: del más reciente al más antiguo");
igual(TK.ticketsAbiertos(SEM, 14), ["0", "8", "7", "6", "5", "4", "3", "2", "1", "p"], "   semana 15: el del repaso final y todos los anteriores (en STARGATE no hay ventana)");
igual(TK.ticketsAbiertos(SEM, -1), [], "   antes del curso, ninguno");
igual(TK.ticketsDelDocente(SEM, 0), ["1", "p"], "🔴 el docente, en la semana 1: el del tema 1 y el del embarque (los de hoy en el PER 16450)");
igual(TK.ticketsDelDocente(SEM, 2), ["2", "1"], "   en la 3: el del tema 2 y el del 1");
igual(TK.ticketsDelDocente(SEM, 14), ["0", "8"], "   en la 15: el del repaso y el del tema 8");
igual([TK.nombreTicket("p"), TK.nombreTicket("1"), TK.nombreTicket("0"), TK.delTicket("p"), TK.delTicket("5")],
  ["El embarque", "Tema 1 · Fôrge", "El repaso final", "del embarque", "de Tema 5 · Umbral"], "   y sus nombres cortos («Ticket del embarque», «Ticket de Tema 5 · Umbral»)");

// ── 2 · la raya y las cifras: Faro Umbral (L. Carlota), 34 de 86, meta 30 %, umbral 26
const faro = { firma: "L. Carlota", respuestas: 34, fichas: 86, meta: 0.3, umbral: 26, llega: true, cobrado: true };
igual(TK.cifrasDe(faro), { firma: "L. Carlota", n: 34, total: 86, pct: 40, meta: 30, raya: 30.2, llega: true },
  "🔴 34 de 86 (40 %): la raya donde está su umbral (26 de 86 = 30,2 %) y se dice su meta (30 %)");
igual(TK.cifrasDe({ firma: "X", respuestas: 9, fichas: 6, meta: 0.25, umbral: 3 }).n, 6, "   nunca más respuestas que fichas");
c(TK.rayaDe({ fichas: 4, umbral: 3 }) === 75, "   un escuadrón pequeño: el mínimo de 3 manda (la raya, en el 75 %)");
const html = TK.lineasParte([
  { firma: "Ana", respuestas: 15, fichas: 76, meta: 0.25, umbral: 19, llega: false },
  faro,
  { firma: "", respuestas: 2, fichas: 3, meta: 0.25, umbral: 3 },
  { firma: "Nadie", respuestas: 0, fichas: 0, meta: 0.25, umbral: 3 }], { mio: "L. Carlota", nombres: { "L. Carlota": "Faro Umbral" } });
c(html.indexOf("Faro Umbral") < html.indexOf("Escuadrón de Ana"), "🔴 el escuadrón de quien mira, primero", html.slice(0, 80));
c(/tkp-f mio/.test(html) && /El tuyo · Comandante L\. Carlota/.test(html), "   y destacado («El tuyo»)");
c(/<b>34<\/b> de 86<em>¡pasó la raya!<\/em>/.test(html) && /<b>15<\/b> de 76<em>la raya, 25 %<\/em>/.test(html), "   «34 de 86 · ¡pasó la raya!» y «15 de 76 · la raya, 25 %»");
c(/<s style="left:30\.2%"><\/s>/.test(html) && /<i style="width:40%"><\/i>/.test(html), "   la barra (40 %) y su raya (30,2 %)");
c((html.match(/class="tkp-f/g) || []).length === 2, "   sin los que no tienen Comandante ni los que no tienen fichas");
c(/tkp-n"><b>La clase<\/b>/.test(TK.lineasParte([{ firma: null, respuestas: 5, fichas: 20, meta: 0.25, umbral: 5 }], { columna: true, titulo: "La clase" })),
  "   con una sola columna (DPG), «La clase»");

// ── 3 · el servidor: estado y parte (con un motor de mentira)
(async function () {
  const llamadas = [];
  const M = { llamar: (n, d) => { llamadas.push(d.accion + ":" + d.tema); return Promise.resolve(d.accion === "estado" ? { ok: true, hecho: d.tema === "1" } : { ok: true, escuadrones: [faro] }); } };
  c((await TK.estado("PER", "p", "f1", M)) === false && (await TK.estado("PER", "1", "f1", M)) === true, "🔴 si ya lo envió, lo dice el servidor (estado)");
  c((await TK.estado("PER", "1", "f1", M)) === true && llamadas.filter(x => x === "estado:1").length === 1, "   y lo que ya dijo que sí no se vuelve a preguntar (sgTkHecho, con la ficha)");
  c(localStorage.getItem("sgTkHecho:PER:1:f1") === "1" && localStorage.getItem("sgTkHecho:PER:p:f1") === null, "   (solo lo enviado se apunta)");
  localStorage.setItem("sgTicket:PER:Presentación de la asignatura", "1");
  c((await TK.estado("PER", "p", "f1", M)) === false, "🔴 la marca vieja de este navegador (sgTicket:…) ya no manda");
  c((await TK.estado("PER", "2", "f1", { llamar: () => Promise.reject(new Error("not-found")) })) === null, "   sin respuesta: null (y no se pide nada)");
  c((await TK.estado("PER", "3", "f1", { llamar: () => Promise.resolve({ ok: true, hecho: false, abierto: false }) })) === null, "   con ventana (DPG) y fuera de ella: tampoco");
  const E = await TK.parte("PER", "p", M); await TK.parte("PER", "p", M);
  c(E && E[0].firma === "L. Carlota" && llamadas.filter(x => x === "parte:p").length === 1, "🔴 el parte, una vez por página y tema (lee 300 fichas)");
  c(!!sessionStorage.getItem("sgParte:PER|p"), "   y guardado 10 minutos en la pestaña");
  c((await TK.parte("PER", "9", { llamar: () => Promise.reject(new Error("x")) })) === null, "   si el servidor no contesta (sin desplegar), null");

  // ── 4 · dónde se usa
  const REC = leer("assets/js/recluta.js"), SES = leer("assets/js/sesion.js"), CLA = leer("assets/js/clase.js"), CON = leer("assets/js/consola.js"), CSS = leer("assets/css/stargate.css");
  c(/function tkVisible\(\)\{[\s\S]*?!DEMO && !SIMULACRO && q\.get\('embed'\)!=='1' && window\.top===window\.self[\s\S]*?!st\.yo\.fantasma/.test(REC),
    "🔴 la Nave: nada en la demo, el simulacro, la Nave proyectada o incrustada ni para un fantasma");
  c(/if\(st\.tkPara===ficha\) return;/.test(REC) && /cargarTickets\(\);\s+\/\/ 10-oct/.test(REC), "   las lecturas, una vez por carga (no al repintar)");
  c(/TK\.ticketsAbiertos\(L, i\)/.test(REC) && /pend\.slice\(0,3\)/.test(REC), "   los que no ha enviado; el parte, de los tres más recientes");
  c(/'Tu ticket de salida está abierto':'Tus tickets de salida están abiertos'/.test(REC) && /pend\.map\(function\(x\)\{/.test(REC), "🔴 una sola tarjeta, una línea por ticket");
  c(/>Tu escuadrón: <b>'\+c\.n\+' de '\+c\.total\+'<\/b> · '/.test(REC) && /'la raya, '\+c\.meta\+' %'/.test(REC), "   «Tu escuadrón: 15 de 76 · la raya, 25 %»");
  c(/una tirada de la rueda<\/b> para ti; y si tu escuadrón pasa su raya, <b>otra para cada recluta<\/b>/.test(REC), "   y la recompensa: una tirada al enviarlo y otra para todos si pasan la raya");
  c(/data-vent="Ticket de salida · '/.test(REC) && /split\('\{TEMA\}'\)\.join\(encodeURIComponent\(x\.clave\)\)/.test(REC), "   el botón abre ticket.html?per=…&tema=… en la ventana de la Nave");
  c(/ticketHecho\(m\.tema\); refrescar\(\);/.test(REC) && /window\.addEventListener\('storage'/.test(REC), "   enviado (aquí o en otra pestaña), su línea se va");
  c(!/tk-nave/.test(REC + CSS) && !/function ticketUrl\(d\)/.test(REC), "   sin rastro de la tarjeta de antes (tk-nave) ni de ticketUrl");
  c(/<script src="assets\/js\/tkcomun\.js(\?v=\w+)?" defer><\/script>/.test(HTML) && /<script src="assets\/js\/tkcomun\.js(\?v=\w+)?" defer><\/script>/.test(leer("clase.html")),
    "   la Nave y la sala cargan tkcomun.js");

  c(/TK\.parte\(st\.per, clave\)\.then\(function\(E\)\{ var F=E&&escuadronesDelParte\(E\);/.test(SES) && /else aMano\(\);/.test(SES),
    "🔴 la diapositiva del escuadrón, con el parte del servidor; si no contesta, la cuenta de antes");
  c(/diaTicketEscuadron\(function\(v\)\{ return esDelTema\(v, lista, ant\); \}, String\(Number\(lista\[ant\]&&lista\[ant\]\.tema_n\)\|\|0\),/.test(SES) && /diaTicketEscuadron\(op\.filtro, 'p', 'el ticket del embarque'\)/.test(SES) && /function diaTicketEscuadron\(filtro, clave, tema\)/.test(SES),
    "   con la clave de su ticket (el del tema anterior o «p»)");
  c(/raya:Math\.min\(100, umbral\*100\/fichas\[c\]\)/.test(SES) && /Math\.min\(100, Math\.round\(f\.raya\*100\/max\)\)/.test(SES), "   la raya, en su umbral (la juzgada, si ya se cobró)");
  c(/'¿Os falta '\+\(clave==='p'\?'el del embarque':'el ticket de '\+esc\(window\.SG\.TK\.nombreTicket\(clave\)\)\)\+'\? Sigue abierto en vuestra Nave: cuenta para la raya de vuestro escuadrón\.<\/p>'/.test(SES),
    "🔴 al pie: «¿Os falta el ticket de <tema>? Sigue abierto en vuestra Nave: cuenta para la raya…» («el del embarque»)");

  c(/\+bloqueParte\(\)/.test(CLA) && /TK\.ticketsDelDocente\(L, Math\.min\(sem, L\.length\)-1\)/.test(CLA) && /mio:st\.profe/.test(CLA) && /pintarParte\(\);/.test(CLA),
    "🔴 la sala del docente: el de este tema y el anterior, su escuadrón primero");
  c(/function pintarParteConsola\(t, sem\)/.test(CON) && /mio: miComandanteAqui\(\)/.test(CON) && /'<div id="tk-parte" hidden><\/div>'/.test(CON) && /pintarParteConsola\(t, sem\);/.test(CON),
    "   y la caja de tickets de su Nave (consola)");
  c(/\.tkp-f\{display:grid;grid-template-columns:minmax\(0,1fr\) auto/.test(CSS) && /\.tk-uno-l \.btn\{grid-column:2;grid-row:1\/span 2;min-height:40px/.test(CSS) && /@media \(max-width:520px\)\{ \.tk-uno-l\{grid-template-columns:minmax\(0,1fr\)\} \.tk-uno-l \.btn\{grid-column:1;grid-row:auto;width:100%\}/.test(CSS),
    "   las líneas caben en cualquier móvil (rejilla con minmax(0,1fr), botón de 40 px, a una columna por debajo de 520)");

  console.log("\n  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  if (fallos.length) { console.log("\n   ✗ El parte por escuadrón: " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos"); fallos.forEach(f => console.log("        " + f)); process.exit(1); }
})();
