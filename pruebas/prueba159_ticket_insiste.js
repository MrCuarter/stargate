/**
 * BATERÍA 159 · EL TICKET DE SALIDA, QUE LO HAGAN (14-nov)
 * ------------------------------------------------------------------------------------------------
 * Norberto: «nuestros estudiantes no están respondiendo los tickets de salida. Haz algo para que les salga un pop up cada vez que
 * se termine un tema para que hagan el ticket de salida, insiste hasta 2 veces… También pon un aviso constante en su panel o una
 * tarjeta que se mantiene hasta que lo rellenan».
 *
 *  · La ventana es la pieza del motor GP.anuncio con `veces: 3, cada: 20` (GamificaPro sdk/anuncio.js; su prueba,
 *    tests/sdk/anuncio.test.ts). Aquí: que la Nave la llama bien (recluta.js → insistirTicket) y la apaga al enviar (ticketHecho).
 *  · La tarjeta sube a lo primero de Mi nave; en las demás pestañas, la franja (avisoTicket).
 * Se ejecutan las funciones DE VERDAD de recluta.js, sacadas del fichero, con un mundo de mentira.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const raiz = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(raiz, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };

console.log("▶ 159 · El ticket de salida, que lo hagan (ventana ×3, tarjeta arriba y franja)");
const REC = leer("assets/js/recluta.js"), CSS = leer("assets/css/stargate.css"), HTML = leer("recluta.html");
const TEMAS = JSON.parse(HTML.match(/window\.SG_TICKET_TEMAS=(\{[^}]*\})/)[1]);

/** Una función de recluta.js, entera (de «  function nombre(» a su llave de cierre). */
function sacar(nombre) {
  const i = REC.indexOf("\n  function " + nombre + "(");
  if (i < 0) throw new Error("no está " + nombre);
  let j = REC.indexOf("{", i), n = 0;
  for (; j < REC.length; j++) { if (REC[j] === "{") n++; else if (REC[j] === "}" && --n === 0) break; }
  return REC.slice(i, j + 1);
}

// ── 1 · dónde está
console.log("\n  · 1 · la tarjeta, arriba; la franja, en las demás pestañas");
c(/\+'<\/section>'\n\s*\/\/ 🔴 14-nov[^\n]*\n[^\n]*\n\s*\+ticketDelTema\(\)\n[^\n]*\n\s*\+recordatorioActividad\(\)/.test(REC),
  "🔴 la tarjeta «Tu ticket de salida está abierto», lo primero bajo la ficha (antes de la entrega de la actividad)");
c((REC.match(/\+ticketDelTema\(\)/g) || []).length === 1, "   una sola vez (ya no al final, tras los retos)");
c(/pestanas\(\)\+avisoAcademia\(\)\+avisoTicket\(\)/.test(REC), "🔴 la franja, bajo las pestañas, en cualquier pestaña");
c(/\.tk-franja\{/.test(CSS) && /\.tk-abierto\{border:1px solid var\(--amber\)/.test(CSS) && /\.gpa-capa\.sg-tk-insiste\{/.test(CSS),
  "   con su piel: tarjeta y franja en ámbar, y la ventana del motor vestida de Nave");
c(/@media \(max-width:520px\)\{ \.tk-franja\{flex-wrap:wrap\} \.tk-franja \.btn\{flex:1 1 100%\} \}/.test(CSS), "   en el móvil, el botón a todo el ancho");

// ── 2 · la pieza del motor, en la Nave
console.log("\n  · 2 · la pieza del motor (GP.anuncio), cargada en la Nave");
c(/<script src="assets\/js\/anuncio\.js\?v=[0-9a-f]+" defer><\/script>/.test(HTML), "🔴 recluta.html carga anuncio.js con su huella");
c(/<script src="assets\/js\/anuncio\.js\?v=[0-9a-f]+" defer><\/script>/.test(leer("consola.html")), "   y la consola, como antes");
const GPDIR = process.env.GAMIFICAPRO_DIR || path.join(raiz, "..", "..", "gamificapro");
const sdk = path.join(GPDIR, "sdk", "anuncio.js");
if (fs.existsSync(sdk)) c(fs.readFileSync(sdk, "utf8") === leer("assets/js/anuncio.js"), "🔴 la copia es exacta (GamificaPro sdk/anuncio.js): no se edita aquí");
c(/veces/.test(leer("assets/js/anuncio.js")) && /function hecho\(clave, quien, almacen\)/.test(leer("assets/js/anuncio.js")), "   la versión que sabe insistir (veces, cada, hecho)");

// ── 3 · ejecutándolo
console.log("\n  · 3 · la ventana: el ticket más reciente que pueda salir, tres veces como mucho, y se apaga al enviarlo");
function mundo(o) {
  o = o || {};
  const llamadas = [], hechos = [], ventanas = [], esperas = [];
  const W = { SG_TICKET_URL: "ticket.html?per={GRUPO}&profe={COMANDANTE}&tema={TEMA}", SG_TICKET_TEMAS: TEMAS };
  W.GP = { anuncio: {
    mostrar: x => { llamadas.push(x); return o.puede ? o.puede(x) : true; },
    hecho: (k, q) => { hechos.push(k + "|" + q); } } };
  const ctx = vm.createContext({
    window: W, console, encodeURIComponent, String, Number, Math, Array, Object, JSON, Promise,
    localStorage: { getItem: () => null, setItem: () => {} }, sessionStorage: { getItem: () => null, setItem: () => {} },
    document: { querySelector: () => (o.abierta ? {} : null) },
    setTimeout: (f, ms) => { esperas.push(ms); if (o.cerrarTras && esperas.length >= o.cerrarTras) o.abierta = false; f(); }
  });
  vm.runInContext(leer("assets/js/parte.js"), ctx);
  vm.runInContext(leer("assets/js/tkcomun.js"), ctx);
  const st = { tab: o.tab || "nave", yo: { ficha: "F7", profe: "L. Carlota" },
    tk: { ficha: "F7", lista: o.lista || [{ clave: "3", hecho: false }, { clave: "2", hecho: false }, { clave: "1", hecho: true }, { clave: "p", hecho: false }] } };
  ctx.st = st; ctx.per = "PER 16450"; ctx.esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  ctx.tkVisible = () => o.visible !== false;
  ctx.ventana = (t, u) => ventanas.push([t, u]);
  vm.runInContext(["claveInsistir", "urlTicket", "abrirTicket", "insistirTicket", "avisoTicket", "ticketHecho"].map(sacar).join("\n"), ctx);
  return { ctx, st, llamadas, hechos, ventanas, esperas, W };
}

let m = mundo();
m.ctx.insistirTicket("F7", 0);
let x = m.llamadas[0];
c(m.llamadas.length === 1 && x.clave === "sgTk:PER 16450:3" && x.quien === "F7", "🔴 una sola ventana por carga: la del ticket más reciente (Tema 3), por recluta", m.llamadas.map(l => l.clave));
c(x.veces === 3 && x.cada === 20, "🔴 la primera y dos insistencias, como mucho una por día (veces: 3, cada: 20 h)");
c(/^Se ha cerrado Tema 3 · [^:]+: tu ticket de salida$/.test(x.titulo[0]) && /^Tu ticket de Tema 3 · .+ sigue sin enviar$/.test(x.titulo[1]) && /^Último aviso: tu ticket de Tema 3/.test(x.titulo[2]),
  "   el tono sube: «Se ha cerrado…», «…sigue sin enviar», «Último aviso…»", x.titulo);
c(/no te lo volveré a pedir con esta ventana\. La tarjeta seguirá en tu Nave hasta que lo envíes/.test(x.html[2]), "   y la última dice que la tarjeta se queda");
c(x.html.every(h => /una tirada de la rueda<\/b> para ti/.test(h) && /Y 2 tickets más sin enviar/.test(h)), "   todas dicen el premio y cuántos más le faltan (2: el del Tema 2 y el del embarque)");
c(x.html.every(h => /NEBULA:/.test(h)) && !/Claude/.test(x.html.join("")), "   habla NEBULA (nunca «Claude»)");
c(x.boton.texto === "Rellenarlo ahora" && JSON.stringify(x.entendido) === '["Luego","Luego","Entendido"]' && x.clase === "sg-tk-insiste", "   «Rellenarlo ahora» o «Luego»; con la piel de la Nave");
x.boton.alPulsar();
c(m.ventanas.length === 1 && /^Ticket de salida · Tema 3/.test(m.ventanas[0][0]) && m.ventanas[0][1] === "ticket.html?per=PER%2016450&profe=L.%20Carlota&tema=3",
  "🔴 «Rellenarlo ahora» abre el ticket en la ventana de la Nave, con grupo, Comandante y tema", m.ventanas);

m = mundo({ puede: l => l.clave !== "sgTk:PER 16450:3" });   // (el del Tema 3 ya agotó sus tres o salió hoy)
m.ctx.insistirTicket("F7", 0);
c(m.llamadas.map(l => l.clave).join() === "sgTk:PER 16450:3,sgTk:PER 16450:2", "🔴 si el más reciente ya no puede salir, el siguiente que le falte (nunca uno enviado)");
c(/^Se ha cerrado Tema 2/.test(m.llamadas[1].titulo[0]), "   con su nombre");

m = mundo({ lista: [{ clave: "p", hecho: false }] });
m.ctx.insistirTicket("F7", 0);
c(m.llamadas[0].titulo[0] === "Tu primera clase ha terminado: tu ticket de salida" && !/más sin enviar/.test(m.llamadas[0].html[0]), "   el del embarque: «Tu primera clase ha terminado», sin «más»");

m = mundo({ abierta: true, cerrarTras: 3 });
m.ctx.insistirTicket("F7", 0);
c(m.esperas.length === 3 && m.esperas.every(ms => ms === 3000) && m.llamadas.length === 1, "🔴 con otra ventana abierta (el consentimiento, un capítulo…), espera y sale al cerrarse", m.esperas);
m = mundo({ abierta: true });
m.ctx.insistirTicket("F7", 0);
c(m.esperas.length === 20 && m.llamadas.length === 0, "   si no se cierra en un minuto, para la próxima visita");
c(/document\.querySelector\('#gpm-capa,\.gpa-capa,\.gpo-capa,\.vent\.open,\.modal-backdrop\.open,\[role="dialog"\]\[aria-modal="true"\]'\)/.test(sacar("insistirTicket")),
  "   (cuenta como ventana abierta también el aviso de «Actualizando servidores»)");

for (const [o, txt] of [[{ visible: false }, "ni en la demo, el simulacro, la Nave proyectada o incrustada, ni a un fantasma (tkVisible)"],
  [{ lista: [{ clave: "3", hecho: true }] }, "nada si ya lo envió todo"]]) {
  m = mundo(o); m.ctx.insistirTicket("F7", 0);
  c(m.llamadas.length === 0, "   " + txt);
}
m = mundo(); m.ctx.insistirTicket("OTRA", 0);
c(m.llamadas.length === 0, "   ni si entretanto ha entrado otra cuenta");

m = mundo();
m.ctx.ticketHecho("3");
c(m.hechos.join() === "sgTk:PER 16450:3|F7" && m.st.tk.lista[0].hecho === true, "🔴 enviado, la ventana de ese ticket se apaga para siempre (GP.anuncio.hecho)");

// ── 4 · la franja
console.log("\n  · 4 · la franja, en las demás pestañas");
m = mundo({ tab: "nave" });
c(m.ctx.avisoTicket() === "", "🔴 en Mi nave, no (ya está la tarjeta entera)");
m = mundo({ tab: "mercado" });
let f = m.ctx.avisoTicket();
c(/class="card tk-franja"/.test(f) && /Tienes 3 tickets de salida sin enviar/.test(f) && /Ticket de Tema 3/.test(f), "🔴 en el Mercado (y las demás): la franja, con cuántos le faltan y el más reciente", f.slice(0, 200));
c(/<a class="btn primary" href="ticket\.html\?per=PER%2016450&amp;profe=L\.%20Carlota&amp;tema=3" data-vent="Ticket de salida · Tema 3/.test(f), "   y su botón abre el ticket en la ventana de la Nave", f);
m = mundo({ tab: "archivo", lista: [{ clave: "p", hecho: false }] });
c(/Tu ticket de salida está abierto/.test(m.ctx.avisoTicket()), "   con uno solo, «Tu ticket de salida está abierto»");
m = mundo({ tab: "archivo", lista: [{ clave: "3", hecho: true }] });
c(m.ctx.avisoTicket() === "", "   enviado todo, se va sola");
m = mundo({ tab: "archivo", visible: false });
c(m.ctx.avisoTicket() === "", "   y nunca donde no toca (tkVisible)");
c(!/data-tk-cerrar|tk-franja-x/.test(REC), "   no se puede cerrar: se va al enviarlo");

console.log("\n  Batería 159 · " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
if (fallos.length) { console.log("  FALLOS:\n   - " + fallos.join("\n   - ")); process.exit(1); }
