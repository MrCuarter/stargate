'use strict';
/**
 * BATERÍA 137 · LA INVESTIGACIÓN DEL TICKET (7-oct-2026, texto aprobado por Norberto: «Me parece genial»)
 * GamificaPro guarda un seudónimo con el ticket de quien ACEPTA (docs/INVESTIGACION_TICKET.md). Aquí se vigila lo de la web:
 *   · los textos: el aprobado, palabra por palabra, y en ningún sitio del alumnado «anónimo» sin más (sin nombre, y con
 *     seudónimo solo si participa); la política, con su versión subida y su apartado;
 *   · que es voluntaria de verdad: la casilla sin marcar, «No, gracias» no llama al servidor, se ofrece UNA vez y no
 *     aparece si ya se respondió; nunca bloquea, nunca a un fantasma ni en la demo o la Nave incrustada;
 *   · que si el servidor no contesta (sin desplegar, sin la pieza), no se ve nada y todo sigue como antes.
 * Se EJECUTAN assets/js/investigacion.js y los trozos de recluta.js y ticket.js con un DOM de mentira mínimo.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };

const DATOS = L("_site_data.py"), INVJS = L("assets/js/investigacion.js"), REC = L("assets/js/recluta.js"), TK = L("assets/js/ticket.js");
const NAVE = L("recluta.html"), TKH = L("ticket.html"), PRIV = L("privacidad.html");
const sacar = (html) => JSON.parse(html.match(/window\.SG_INVESTIGACION=(\{.*?\});<\/script>/)[1]);
const sinEtiquetas = (t) => t.replace(/<[^>]+>/g, "");

console.log("\n  · El texto aprobado, un dato y un sitio");
const C = sacar(NAVE), C2 = sacar(TKH);
c(C.v === "inv-2026-10", "la versión del texto es inv-2026-10 (la que se guarda con el sí)", C.v);
c(JSON.stringify(C) === JSON.stringify(C2), "🔴 la Nave y el ticket llevan EL MISMO texto y la misma versión");
const todo = sinEtiquetas(C.texto.join(" "));
[
  "Norberto Cuartero, docente de este máster, investiga para su tesis doctoral y para publicaciones científicas",
  "Nada nuevo: tus respuestas al ticket se guardan como hasta ahora.",
  "no se puede deshacer sin una clave secreta que custodia el investigador",
  "Nunca con tu nombre ni con nada que te identifique.",
  "Solo las personas referentes de tu grupo y el investigador, con la clave.",
  "Cada vez que alguien la usa queda registrado: quién, cuándo y de qué grupo.",
  "No afecta a tu nota, ni a tu xp, ni a tus créditos, ni al premio del ticket: la cápsula te toca igual.",
  "Puedes retirarlo cuando quieras, en tu Nave o en la página del ticket.",
  "pulsa «Borrar mi código» en el mismo sitio: se quita de todos tus tickets de STARGATE.",
  "n.cuartero.10@gmail.com",
].forEach((f) => c(todo.indexOf(f) >= 0, "   dice: «" + f.slice(0, 70) + (f.length > 70 ? "…" : "") + "»"));
c(C.acepto === "Acepto que mis tickets de salida lleven un seudónimo para esta investigación, en estas condiciones.", "   y la casilla dice lo aprobado");
c(C.titulo === "Investigación sobre el ticket de salida · voluntaria", "   con su título");
c(/<script>window\.SG_INVESTIGACION=\{.*?\};<\/script><script src="assets\/js\/investigacion\.js(\?v=\w+)?" defer><\/script>\s*<script src="assets\/js\/recluta\.js/.test(NAVE),
  "la Nave carga investigacion.js antes que recluta.js");
c(TKH.indexOf("assets/js/investigacion.js") > 0 && TKH.indexOf("assets/js/investigacion.js") < TKH.indexOf("assets/js/ticket.js"), "   y el ticket, antes que ticket.js");

console.log("\n  · Donde decía «anónimo», la verdad");
const desc = (TKH.match(/<meta name="description" content="([^"]*)"/) || [])[1], og = (TKH.match(/<meta property="og:description" content="([^"]*)"/) || [])[1];
c(desc === "El ticket de salida de cada tema: sin tu nombre y en dos minutos." && og === desc, "🔴 la descripción del ticket (y la de og): «sin tu nombre y en dos minutos»", [desc, og]);
c(!/an[óo]nim/i.test(TKH.replace(/<script[\s\S]*?<\/script>/g, "")) && !/an[óo]nim/i.test(TK.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")),
  "🔴 ni ticket.html ni ticket.js dicen ya «anónimo» al alumnado");
c(/Tu nombre no se guarda con lo que contestes\. ' *\n?\s*\+ 'Si participas en la investigación \(voluntaria\), tu ticket lleva un seudónimo\./.test(TK), "   la puerta del ticket: «Tu nombre no se guarda… Si participas…, un seudónimo»");
c(/PRIVACIDAD_V = "2026-10-07"/.test(DATOS) && PRIV.indexOf("Versión 2026-10-07") > 0, "🔴 la política sube de versión (se vuelve a preguntar una vez el consentimiento general)");
c(JSON.parse(NAVE.match(/window\.SG_CONSENTIMIENTO=(\{.*?\});/)[1]).v === "2026-10-07", "   y la Nave pregunta por la nueva");
c(!/Son anónimos/.test(PRIV) && /No llevan tu nombre\.<\/b> Si aceptas la investigación \(voluntaria\), llevan un seudónimo/.test(PRIV), "   los tickets en la política: «No llevan tu nombre. Si aceptas…, un seudónimo»");
c(!/son anónimos y se guardan/.test(PRIV) && /no llevan tu nombre y se guardan en la propia plataforma/.test(PRIV), "   y en la lista de proveedores, lo mismo");
c(/<h2>8 · La investigación del ticket de salida \(voluntaria\)<\/h2>/.test(PRIV) && /6\.1\.a del RGPD/.test(PRIV) && /cinco años después de la última\s+publicación/.test(PRIV)
  && /«Borrar mi código»/.test(PRIV), "🔴 la política tiene su apartado: finalidad, base, quién, cuánto tiempo y cómo retirarlo");
c(/<h2>9 · Cuánto tiempo<\/h2>/.test(PRIV) && /<h2>10 · Tus derechos/.test(PRIV) && /<h2>11 · Si esto cambia/.test(PRIV) && /cuando quieras \(punto 10\)/.test(PRIV), "   y la numeración (y su «punto 10») sigue cuadrando");
c(/el <b>ticket de salida<\/b>: sin tu nombre, para decir qué te llevas/.test(L("guia-recluta.html")), "   la guía del recluta: «sin tu nombre»");
c(/ticket de salida<\/b>: sin tu nombre, para decir qué te llevas[^"]*seudónimo/.test(L("assets/js/nebula-faq.js")) && !/sigue siendo anónimo/.test(L("assets/js/nebula-faq.js")),
  "   NEBULA contesta «¿el ticket es anónimo?» con la verdad");
c(/"¿Es anónimo el ticket de salida\?", "o": \["Sí: sin nombre\. Con seudónimo solo si lo aceptan para la investigación"/.test(DATOS), "   la pregunta de la Academia: «Sí: sin nombre. Con seudónimo solo si…»");
c(/no "\s*\n\s*"lleva el nombre de nadie, y eso es innegociable/.test(DATOS), "   y la voz del paso R3: «no lleva el nombre de nadie, y eso es innegociable»");
c(!/Anónimo y en dos minutos/.test(REC) && /'Sin tu nombre'\+/.test(REC), "   la tarjeta del ticket en la Nave: «Sin tu nombre…»");

// ───────────────────────── investigacion.js, ejecutado
/** Un elemento de mentira: lee de su innerHTML los [data-inv] y los da como botones y casillas. */
function Caja() {
  const el = { _h: "", hijos: [] };
  Object.defineProperty(el, "innerHTML", { get() { return el._h; }, set(v) {
    el._h = v; el.hijos = [];
    const re = /<(button|input)\b([^>]*)>([^<]*)/g; let m;
    while ((m = re.exec(v))) {
      const a = m[2], d = (a.match(/data-inv="([^"]+)"/) || [])[1];
      if (!d) continue;
      el.hijos.push({ d, disabled: /\bdisabled\b/.test(a), checked: false, textContent: m[3], onclick: null, onchange: null,
        getAttribute: (k) => (k === "data-inv" ? d : null), focus() {} });
    }
  } });
  el.querySelector = (sel) => { const ds = (sel.match(/data-inv="([^"]+)"/g) || []).map((x) => x.slice(10, -1)); return el.hijos.find((h) => ds.indexOf(h.d) >= 0) || null; };
  el.querySelectorAll = () => el.hijos;
  el.pulsa = (d) => { const b = el.querySelector('[data-inv="' + d + '"]'); if (!b) throw new Error("no hay " + d); if (b.disabled) return "apagado"; b.onclick(); return "ok"; };
  el.texto = () => sinEtiquetas(el._h);
  return el;
}
function cargarINV(conTexto) {
  const almacen = {};
  const win = { SG_INVESTIGACION: conTexto === false ? undefined : C };
  const ctx = { window: win, localStorage: { getItem: (k) => (k in almacen ? almacen[k] : null), setItem: (k, v) => { almacen[k] = String(v); } },
    setTimeout, Promise, Date, Array, Object, String, Number, isNaN, document: {} };
  vm.runInNewContext(INVJS, ctx);
  return { I: win.SG.INV, almacen };
}
const espera = () => new Promise((r) => setTimeout(r, 15));
function motorQue(responde) {
  const llamadas = [];
  return { llamadas, llamar: (n, d) => { llamadas.push([n, d]); return responde(n, d); } };
}
const errorFirebase = (code, message) => Object.assign(new Error(message), { code });

(async () => {
  console.log("\n  · Si el servidor no contesta, no se enseña nada (el ticket y la Nave, como antes)");
  let { I } = cargarINV();
  let M = motorQue(() => Promise.reject(errorFirebase("functions/not-found", "not-found")));
  c((await I.consultar(M, "per-1", "F1")) === null, "🔴 función sin desplegar (not-found sin texto): null, sin romper nada");
  M = motorQue(() => Promise.reject(errorFirebase("functions/not-found", "Ese grupo no participa en la investigación.")));
  c((await I.consultar(M, "per-1", "F1")) === null, "   grupo sin la pieza: null");
  M = motorQue(() => Promise.reject(errorFirebase("functions/internal", "internal")));
  c((await I.consultar(M, "per-1", "F1")) === null, "   sin red o caída: null");
  M = motorQue(() => { throw new Error("revienta antes de la promesa"); });
  c((await I.consultar(M, "per-1", "F1")) === null, "   aunque `llamar` reviente al llamarla");
  M = motorQue(() => new Promise(() => {}));
  c((await I.consultar(M, "per-1", "F1", 20)) === null, "   y si no contesta nunca, se deja de esperar");
  M = motorQue(() => Promise.resolve({ ok: true, investigacion: null }));
  const e0 = await I.consultar(M, "per-1", "F1");
  c(JSON.stringify(e0) === '{"investigacion":null}' && JSON.stringify(M.llamadas[0]) === JSON.stringify(["modConsentimiento", { projectId: "per-1", studentProfileId: "F1" }]),
    "contesta: consulta SU ficha en SU grupo (sin «acepta»: solo mirar)", M.llamadas);
  const sinTexto = cargarINV(false).I;
  M = motorQue(() => Promise.resolve({ ok: true, investigacion: null }));
  c((await sinTexto.consultar(M, "per-1", "F1")) === null && M.llamadas.length === 0, "   sin el texto en la página, ni pregunta");

  console.log("\n  · Se ofrece una vez, y no aparece si ya se respondió");
  ({ I } = cargarINV());
  c(I.ofrecer({ investigacion: null }, "F1") === true, "🔴 no ha decidido nada: se le ofrece");
  c(I.ofrecer({ investigacion: { acepta: true, version: "inv-2026-10", fecha: 1 } }, "F1") === false, "🔴 ya aceptó: no se le vuelve a ofrecer");
  c(I.ofrecer({ investigacion: { acepta: false, fecha: 1 } }, "F1") === false, "🔴 ya se retiró: tampoco");
  c(I.ofrecer(null, "F1") === false, "   sin servidor: nada");
  I.marcarVisto("F1");
  c(I.ofrecer({ investigacion: null }, "F1") === false && I.ofrecer({ investigacion: null }, "F2") === true, "🔴 la cerró o dijo «No, gracias»: en este navegador no vuelve (otra ficha, sí)");

  console.log("\n  · El panel: voluntario de verdad");
  ({ I } = cargarINV());
  M = motorQue((n, d) => Promise.resolve(n === "modConsentimiento" ? { ok: true, investigacion: { acepta: d.acepta, version: d.version, fecha: 1759800000000 } } : {}));
  let caja = Caja(), cambios = [], cerrado = 0;
  I.panel(caja, { M, per: "per-1", ficha: "F1", estado: { investigacion: null }, alCambiar: (e) => cambios.push(e), alCerrar: () => cerrado++ });
  c(caja.texto().indexOf("Quién puede saber que un código es tuyo.") >= 0, "se lee el texto entero antes de decidir");
  const casilla = caja.querySelector('[data-inv="casilla"]');
  c(casilla && casilla.checked === false && !/checked/.test(caja.innerHTML), "🔴 la casilla viene SIN marcar");
  c(caja.querySelector('[data-inv="si"]').disabled === true && caja.pulsa("si") === "apagado" && M.llamadas.length === 0, "🔴 «Sí, participo», apagado hasta marcarla (y no llama a nada)");
  c(!caja.querySelector('[data-inv="borrar"]'), "   quien no ha decidido nunca no ve «Borrar mi código» (no hay nada que borrar)");
  caja.pulsa("no");
  c(M.llamadas.length === 0, "🔴 «No, gracias» NO llama al servidor: no hay nada que guardar");
  c(I.visto("F1") && cambios.length === 0 && /no participas y tus tickets van sin código, como siempre/.test(caja.texto()), "   solo no se vuelve a ofrecer, y se dice que todo sigue igual");
  caja.pulsa("cerrar"); c(cerrado === 1, "   y se cierra");

  caja = Caja(); cambios = [];
  I.panel(caja, { M, per: "per-1", ficha: "F1", estado: { investigacion: null }, alCambiar: (e) => cambios.push(e) });
  caja.querySelector('[data-inv="casilla"]').checked = true; caja.querySelector('[data-inv="casilla"]').onchange();
  c(caja.querySelector('[data-inv="si"]').disabled === false, "marcada, «Sí, participo» se enciende");
  caja.pulsa("si"); await espera();
  c(JSON.stringify(M.llamadas.pop()) === JSON.stringify(["modConsentimiento", { projectId: "per-1", studentProfileId: "F1", acepta: true, version: "inv-2026-10" }]),
    "🔴 al aceptar, manda SU ficha, acepta: true y la versión del texto que ha leído");
  c(cambios.length === 1 && I.participa(cambios[0]) && /tus tickets llevan tu seudónimo/.test(caja.texto()), "   y desde ahí, participa (y se le dice)");

  caja = Caja(); cambios = [];
  I.panel(caja, { M, per: "per-1", ficha: "F1", estado: cambios[0] || { investigacion: { acepta: true, fecha: 1759800000000 } }, alCambiar: (e) => cambios.push(e) });
  c(/Participas/.test(caja.texto()) && caja.querySelector('[data-inv="retirar"]') && caja.querySelector('[data-inv="borrar"]'), "participando: «Retirarme» y «Borrar mi código»");
  caja.pulsa("retirar"); await espera();
  c(JSON.stringify(M.llamadas.pop()) === JSON.stringify(["modConsentimiento", { projectId: "per-1", studentProfileId: "F1", acepta: false }]) && !I.participa(cambios[0]),
    "🔴 retirarse: acepta: false (sin versión), y deja de participar");
  c(!!caja.querySelector('[data-inv="borrar"]'), "   retirado, sigue teniendo «Borrar mi código» (para lo ya enviado)");

  for (const [sinSecreto, frase] of [[false, "Hecho: tu código ya no está en ningún ticket."], [true, "No había ningún código que borrar."]]) {
    M = motorQue(() => Promise.resolve({ ok: true, retirados: 1, borradas: sinSecreto ? 0 : 3, temas: 2, sinSecreto, ya: false }));
    caja = Caja(); cambios = [];
    I.panel(caja, { M, per: "per-1", ficha: "F1", estado: { investigacion: { acepta: true, fecha: 1 } }, cerrar: "Cerrar", alCambiar: (e) => cambios.push(e) });
    caja.pulsa("borrar");
    c(/No se puede deshacer\./.test(caja.texto()) && M.llamadas.length === 0, "🔴 «Borrar mi código» pide confirmación antes (no se puede deshacer)" + (sinSecreto ? " (sin secreto)" : ""));
    caja.pulsa("borrar-si"); await espera();
    c(JSON.stringify(M.llamadas[0]) === JSON.stringify(["modOlvidarSeudonimo", { projectId: "per-1", studentProfileId: "F1" }]) && caja.texto().indexOf(frase) >= 0 && !I.participa(cambios[0]),
      "   llama a modOlvidarSeudonimo con SU ficha y dice «" + frase + "»; ya no participa");
  }
  M = motorQue(() => Promise.reject(errorFirebase("functions/permission-denied", "Solo puedes decidirlo sobre tu propia ficha.")));
  caja = Caja(); cambios = [];
  I.panel(caja, { M, per: "per-1", ficha: "F9", estado: { investigacion: null }, alCambiar: (e) => cambios.push(e) });
  caja.querySelector('[data-inv="casilla"]').checked = true; caja.querySelector('[data-inv="casilla"]').onchange(); caja.pulsa("si"); await espera();
  c(cambios.length === 0 && /No se ha podido guardar: Solo puedes decidirlo sobre tu propia ficha\./.test(caja.texto()) && !I.visto("F9"),
    "si el servidor dice que no, se dice por qué y nada cambia (ni se da por ofrecida)");

  console.log("\n  · La Nave: a quién se le ofrece (se ejecuta)");
  const trozo = REC.match(/  function cargarInvestigacion\(\)\{[\s\S]*?\n(?=  \/\/ 5-oct · el ticket ya no es un Google Form)/)[0];
  async function nave(o) {
    const { I: INV } = cargarINV();
    if (o.visto) INV.marcarVisto("F1");
    const llamadas = [];
    const M2 = { llamar: (n, d) => { llamadas.push(n); return o.servidor ? o.servidor(n, d) : Promise.resolve({ ok: true, investigacion: o.inv === undefined ? null : o.inv }); } };
    const win = { SG: { INV, MOTOR: M2 } }; win.self = win; win.top = o.incrustada ? {} : win;
    const st = { yo: o.yo === undefined ? { ficha: "F1" } : o.yo };
    let pintadas = 0;
    const ctx = { window: win, st, per: "per-1", DEMO: !!o.demo, SIMULACRO: !!o.simulacro, q: new URLSearchParams(o.embed ? "embed=1" : ""),
      render: () => { pintadas++; }, esc: (t) => t, document: { addEventListener() {} } };
    const f = new Function(...Object.keys(ctx), trozo + "\nreturn { cargarInvestigacion, investigacionOferta, investigacionLinea };")(...Object.values(ctx));
    f.cargarInvestigacion(); await espera();
    return { oferta: f.investigacionOferta(), linea: f.investigacionLinea(), llamadas, pintadas };
  }
  let r = await nave({});
  c(/¿Nos ayudas a investigar\?/.test(r.oferta) && /Es voluntario y no cambia tu nota ni tu premio\./.test(r.oferta) && /data-inv-cerrar/.test(r.oferta),
    "🔴 recluta que no ha decidido: la tarjeta «¿Nos ayudas a investigar?», que se puede cerrar");
  c(!/sgp-capa|aria-modal/.test(r.oferta), "🔴 es una tarjeta en la Nave, NUNCA una ventana obligatoria al entrar");
  c(/no has decidido/.test(r.linea) && /Leer y decidir/.test(r.linea), "   y al pie, su línea: «no has decidido · Leer y decidir»");
  r = await nave({ inv: { acepta: true, version: "inv-2026-10", fecha: 1 } });
  c(r.oferta === "" && /<b>participas<\/b>/.test(r.linea) && /Cambiar/.test(r.linea), "🔴 ya aceptó: no hay tarjeta; la línea dice «participas · Cambiar»");
  r = await nave({ inv: { acepta: false, fecha: 1 } });
  c(r.oferta === "" && /<b>no participas<\/b>/.test(r.linea), "🔴 ya dijo que no (o se retiró): no hay tarjeta; «no participas · Cambiar»");
  r = await nave({ visto: true });
  c(r.oferta === "" && /no has decidido/.test(r.linea), "🔴 la cerró o dijo «No, gracias» en este navegador: no vuelve (la línea, sí)");
  r = await nave({ servidor: () => Promise.reject(errorFirebase("functions/not-found", "not-found")) });
  c(r.oferta === "" && r.linea === "" && r.pintadas === 0, "🔴 sin desplegar: ni tarjeta ni línea, y la Nave ni se repinta");
  for (const [o, txt] of [[{ yo: { ficha: "F1", fantasma: true } }, "un fantasma (docente que juega)"], [{ demo: true }, "la demo"], [{ simulacro: true }, "el simulacro"],
    [{ embed: true }, "la Nave proyectada (?embed=1)"], [{ incrustada: true }, "la Nave dentro de otra página"], [{ yo: null }, "sin ficha"]]) {
    r = await nave(o);
    c(r.oferta === "" && r.linea === "" && r.llamadas.length === 0, "   " + txt + ": nada, y ni se pregunta al servidor");
  }
  c(/pedirConsentimiento\(function\(\)\{\n\s*cargarInvestigacion\(\);/.test(REC), "🔴 solo después del consentimiento general (quien no lo acepta no ve la investigación)");
  c(/\+investigacionOferta\(\)\n\s*\+ticketDelTema\(\)/.test(REC) && /\+panelEmbebido\(\)\n\s*\+investigacionLinea\(\);/.test(REC), "   la tarjeta, junto al ticket del tema; la línea, al pie de la Nave");

  console.log("\n  · El ticket: la entradilla dice la verdad (se ejecuta)");
  const trozoTk = TK.match(/  var INV = null, invAbierta = false;[\s\S]*?\n(?=  function pintarInvestigacion\(\))/)[0];
  const ent = (estado) => new Function("window", trozoTk + "\nINV = arguments[1]; return entradilla();")({ SG: { INV: cargarINV().I } }, estado ? { per: "p", ficha: "F1", estado } : null);
  c(/^<b>Sin tu nombre<\/b> y en dos minutos: tu Comandante ve lo que dice la clase, nunca quién lo dijo\. Al enviarlo te llega una <b>cápsula de suministros<\/b> con un premio al azar\.$/.test(ent({ investigacion: null })),
    "🔴 no participa: «Sin tu nombre y en dos minutos: tu Comandante ve lo que dice la clase, nunca quién lo dijo…»");
  c(ent(null) === ent({ investigacion: null }) && ent({ investigacion: { acepta: false } }) === ent(null), "   igual sin servidor o retirado");
  const si = sinEtiquetas(ent({ investigacion: { acepta: true } }));
  c(si === "Sin tu nombre y en dos minutos. Participas en la investigación: tu ticket lleva tu seudónimo, y solo tus referentes y el investigador pueden saber que es tuyo. Cambiar Al enviarlo te llega una cápsula de suministros con un premio al azar.",
    "🔴 participa: «…tu ticket lleva tu seudónimo, y solo tus referentes y el investigador pueden saber que es tuyo. [Cambiar]…»", si);
  c(/var inv = investigacion\(YO\);[\s\S]{0,300}return inv\.then\(function \(x\) \{ INV = x; formulario\(\); \}\);/.test(TK), "   se pregunta a la vez que el estado del ticket, y sin respuesta, el formulario de siempre");
  c(/\(d\.data\(\) \|\| \{\}\)\.fantasma === true\) return null/.test(TK), "   a un fantasma, nada");
  c(/I\.marcarVisto\(INV\.ficha\); pintarInvestigacion\(\);/.test(TK) && /Leer y decidir/.test(TK), "   la tarjeta «¿Nos ayudas a investigar?» se cierra y no vuelve; el formulario se envía sin decidir nada");
  c(/MOTOR\(\)\.llamar\("modTicket", \{ accion: "enviar", projectId: PER, tema: TEMA, respuestas: envio \}\)/.test(TK), "🔴 y lo que se envía es lo mismo de siempre: el seudónimo lo pone el servidor");

  console.log("\n  · La consola de ensayo");
  const SIM = L("assets/js/sim/firebase_sim.js");
  c(/async modConsentimiento\(\) \{ return \{ ok: true, investigacion: null \}; \}/.test(SIM)
    && /async modOlvidarSeudonimo\(\) \{ return \{ ok: true, retirados: 0, borradas: 0, temas: 0, sinSecreto: true, ya: true \}; \}/.test(SIM),
    "el Firebase de mentira contesta las dos (nadie ha decidido, nada que borrar)");
  const huella = require("crypto").createHash("sha1").update(Buffer.concat([fs.readFileSync(path.join(R, "assets/js/sim/firebase_sim.js")),
    fs.readFileSync(path.join(R, "assets/sim/escuela.json"))])).digest("hex").slice(0, 10);
  c(L("assets/js/motor_sim.js").indexOf("./sim/firebase_sim.js?h=" + huella) > 0, "   y motor_sim.js lo carga con su huella nueva (build hecho)");

  console.log("\n  Batería 137 · la investigación del ticket");
  console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  process.exit(fallos.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
