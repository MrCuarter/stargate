'use strict';
/**
 * BATERÍA 134 · EL CONSENTIMIENTO (5-oct-2026, con el sí de Norberto)
 * Alistarse pide marcar una casilla (obligatoria, sin marcar de serie) y la guarda con la ficha, en privado/datos.consentimiento
 * = { v, t }; quien ya estaba alistado lo confirma UNA vez en su Nave («Acepto» / «No quiero participar»), nunca en la Nave
 * proyectada, incrustada, el simulacro o la demo, ni a quien es del equipo docente. La política de privacidad lleva la misma
 * versión. Se EJECUTA pedirConsentimiento (sacada de recluta.js) con una ficha de mentira en cada caso.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };

const DATOS = L("_site_data.py"), ALI = L("assets/js/alistarse.js"), MOT = L("assets/js/motor.js"), REC = L("assets/js/recluta.js");
const V = DATOS.match(/^PRIVACIDAD_V = "([^"]+)"/m)[1];
// 10-oct (Norberto): la casilla dice también que los datos se usan, sin nombre, para investigación educativa.
const TEXTO = "He leído la política de privacidad y acepto participar en STARGATE y que mis datos se usen, sin mi nombre, para investigación educativa. Es voluntario: puedo dejarlo y pedir que se borren mis datos cuando quiera.";
const sacar = (html) => JSON.parse(html.match(/window\.SG_CONSENTIMIENTO=(\{.*?\});/)[1]);

console.log("\n  · Un dato, un sitio");
const enAli = sacar(L("alistarse.html")), enNave = sacar(L("recluta.html"));
c(/^\d{4}-\d{2}-\d{2}$/.test(V), "la versión de la política es una fecha (" + V + ")");
c(enAli.v === V && enNave.v === V, "🔴 alistarse y la Nave llevan la MISMA versión que _site_data.py", [enAli.v, enNave.v]);
c(enAli.texto === TEXTO && enNave.texto === TEXTO, "🔴 y el mismo texto, palabra por palabra el aprobado");
c(enAli.contacto === "n.cuartero.10@gmail.com", "el contacto para dejarlo es el de la política");

console.log("\n  · Alistarse");
c(/id="a-acepto"/.test(ALI) && !/id="a-acepto"[^>]*checked/.test(ALI), "🔴 la casilla existe y NO viene marcada");
c(/enviar\.disabled = DEMO \|\| !acepto\.checked/.test(ALI) && /acepto\.onchange = repasa; repasa\(\);/.test(ALI), "🔴 «Embarcar» apagado hasta marcarla (y en la demo, siempre)");
c(/if \(!acepto \|\| !acepto\.checked\)\s*return aviso\(/.test(ALI), "   y al pulsar se comprueba otra vez (quien quite el disabled a mano no pasa)");
c(/consentimiento: \{ v: CONS\.v \|\| "", t: Date\.now\(\) \}/.test(ALI), "   se manda con la versión y el momento");
c(/target="_blank" rel="noopener">política de privacidad<\/a>/.test(ALI), "   el enlace a la política abre en otra pestaña (no se pierde lo escrito)");
c(!/Solo pedimos tu nombre y tu correo/.test(ALI), "   fuera el «Solo pedimos tu nombre y tu correo» (ya no es verdad)");
const alta = MOT.match(/async function alistar\([\s\S]*?\n\}/)[0];
c(/("privado", "datos"\), \{|privado: \(y\) => \(\{)[\s\S]*?consentimiento: \{ v: String\(datos\.consentimiento\.v\)/.test(alta), "🔴 motor.js lo guarda en privado/datos (lo privado del recluta: las reglas de hoy ya lo dejan escribir)");
c(!/const datosFicha = \{[^}]*consentimiento/.test(alta), "   y NO en la ficha pública (la lee cualquiera con sesión)");
c(/consentimiento/.test(L("assets/js/motor_sim.js")), "   la consola de ensayo (motor_sim.js) va igual");
c(/esDelEquipoDe/.test(ALI), "   convive con el modo fantasma (el aviso del equipo docente sigue ahí)");

console.log("\n  · La Nave: a quién se le pregunta (se ejecuta, con la pieza del motor)");
// 10-oct · la ventana y el registro son de GamificaPro (sdk/consentimiento.js → assets/js/consentimiento.js, `GP.consentimiento`);
// en recluta.js queda el pegamento: a quién NO se le pregunta y dónde se guarda. Se ejecutan los dos juntos, como en la Nave.
const PIEZA = L("assets/js/consentimiento.js");
const enPieza = JSON.parse(L("recluta.html").match(/window\.GP_CONSENTIMIENTO=(\{.*?\});<\/script>/)[1]);
c(enPieza.v === V && enPieza.texto === TEXTO && enPieza.contacto === enAli.contacto, "🔴 la pieza de la Nave lleva la MISMA versión, el mismo texto y el mismo contacto");
{ const R = L("recluta.html"), i = R.indexOf("assets/js/consentimiento.js"); c(i > 0 && i < R.indexOf("assets/js/recluta.js"), "   y se carga antes que recluta.js"); }
const trozo = REC.match(/  function pedirConsentimiento\(seguir\)\{\n[\s\S]*?\n  \}\n(?=  \/\/ Con sesión iniciada)/)[0];
c(/G\.pedir\(/.test(trozo) && !/function ventanaConsentimiento/.test(REC), "recluta.js llama a la pieza común (sin su copia de la ventana)");
async function prueba(o) {
  const ventanas = [], ss = Object.assign({}, o.ss || {}), guardado = [];
  const M = { db: {}, doc: (...a) => a.slice(1).join("/"),
    getDoc: (ref) => { ventanas.lee = ref; return Promise.resolve({ exists: () => !!o.datos, data: () => o.datos }); },
    setDoc: (ref, d, op) => { guardado.push([ref, d, op]); return Promise.resolve(); } };
  const win = { GP_CONSENTIMIENTO: enPieza, SG: { MOTOR: M } };
  win.self = win; win.top = o.incrustada ? {} : win;
  const cuerpo = { appendChild: (n) => { ventanas.push(n); n.parentNode = cuerpo; }, removeChild: (n) => { n.parentNode = null; } };
  const nodo = () => { const n = { className: "", classList: { add() {} }, addEventListener() {}, botones: {} };
    Object.defineProperty(n, "innerHTML", { get: () => n._h, set: (v) => { n._h = v; n.botones = {};
      if (/^<div /.test(v)) { n.firstChild = nodo(); return; }
      (v.match(/data-cons-[\w-]+/g) || []).forEach((d) => { n.botones[d] = { focus() {}, disabled: false }; }); } });
    n.querySelector = (s) => n.botones[s.slice(1, -1)] || null; n.querySelectorAll = () => [];
    return n; };
  const documento = { body: cuerpo, createElement: nodo, activeElement: null };
  const sesion = { getItem: (k) => (k in ss ? ss[k] : null), setItem: (k, v) => { ss[k] = v; } };
  require("vm").runInNewContext(PIEZA, { window: win, document: documento, sessionStorage: sesion, setTimeout, Date });
  const ctx = {
    window: win, localStorage: { getItem: (k) => (k === "sgEsDocente" && o.docente ? "1" : null) },
    q: new URLSearchParams(o.embed ? "embed=1" : ""), per: "PERX", DEMO: !!o.demo, SIMULACRO: !!o.simulacro,
    st: { yo: o.yo === undefined ? { ficha: "F1" } : o.yo }, motorNuevo: () => o.motor !== false,
    pintarBitacora: () => {}, aviso: () => {}
  };
  const pedir = new Function(...Object.keys(ctx), trozo + "\nreturn pedirConsentimiento;")(...Object.values(ctx));
  let siguio = 0;
  pedir(() => { siguio++; });
  await new Promise((r) => setTimeout(r, 5));
  return { ventanas, get siguio() { return siguio; }, ss, guardado, lee: ventanas.lee };   // (siguio, al momento: «Acepto» sigue después)
}

(async () => {
  let r = await prueba({ datos: { firstName: "Ana", email: "a@x.es" } });
  c(r.ventanas.length === 1 && r.lee === "student_profiles/F1/privado/datos" && r.siguio === 0,
    "🔴 recluta sin consentimiento: se le pregunta (en SU privado/datos) y lo de siempre espera", r);
  const caja = r.ventanas[0] && r.ventanas[0].firstChild;
  caja.querySelector("[data-cons-si]").onclick.call({});
  await new Promise((res) => setTimeout(res, 5));
  c(r.guardado.length === 1 && r.guardado[0][0] === "student_profiles/F1/privado/datos" && r.guardado[0][1].consentimiento.v === V
    && typeof r.guardado[0][1].consentimiento.t === "number" && r.guardado[0][2].merge === true && r.siguio === 1,
    "🔴 «Acepto» guarda { v, t } en SU privado/datos con merge (no pisa nombre, correo ni Bitácora) y sigue", r.guardado);
  r = await prueba({ datos: { consentimiento: { v: V, t: 1 } } });
  c(r.ventanas.length === 0 && r.siguio === 1, "🔴 ya aceptó esta versión: ni pregunta, y sus bienvenidas salen como siempre", r);
  r = await prueba({ datos: { consentimiento: { v: "2026-01-01", t: 1 } } });
  c(r.ventanas.length === 1, "   aceptó una versión VIEJA: se le pregunta otra vez", r);
  r = await prueba({ datos: null });
  c(r.ventanas.length === 1, "   sin documento privado (ficha muy vieja): se le pregunta", r);
  for (const [o, txt] of [
    [{ embed: true }, "la Nave proyectada dentro de la sesión (?embed=1)"],
    [{ incrustada: true }, "la Nave dentro de otra página (iframe)"],
    [{ simulacro: true }, "el simulacro del Comandante"],
    [{ demo: true }, "la demo"],
    [{ docente: true }, "alguien del equipo docente"],
    [{ yo: { ficha: "F1", fantasma: true } }, "un fantasma (equipo docente jugando)"],
    [{ yo: { ficha: "F1", congelado: true } }, "una cuenta congelada (no puede escribir en su ficha)"],
    [{ yo: null }, "quien no tiene ficha"],
    [{ motor: false }, "el motor viejo"],
  ]) {
    r = await prueba(Object.assign({ datos: {} }, o));
    c(r.ventanas.length === 0 && r.siguio === 1, "   sin pregunta en " + txt + " (y nada bloqueado)", r);
  }
  r = await prueba({ datos: {}, ss: { sgConsNo_PERX: V } });
  c(r.ventanas.length === 0 && r.siguio === 0, "   dijo «No quiero participar» en esta visita: no se le insiste (ni bienvenidas encima)", r);

  console.log("\n  · La ventana (la pieza del motor con la piel de STARGATE)");
  const PIEL = enPieza.piel, TX = PIEL.textos;
  const salida = PIEZA.slice(PIEZA.indexOf("function salida"), PIEZA.indexOf("function cerrar"));
  c(TX.si === "Acepto" && TX.no === "No quiero participar" && /boton\("no", T\.no\) \+ boton\("si", T\.si, true\)/.test(PIEZA), "🔴 «Acepto» y «No quiero participar»");
  c(/o\.guardar\(firma\(\)\)/.test(PIEZA) && /guardar:function\(f\)\{ return M\.setDoc\(ref\(\),\{consentimiento:f\},\{merge:true\}\); \}/.test(trozo), "   «Acepto» guarda { v, t } con merge (no pisa nombre, correo ni Bitácora)");
  c(/díselo a tu Comandante/.test(TX.salida) && /\{contacto\}/.test(TX.salida) && /no se borra nada por sí solo/.test(TX.salida) && /mailto:/.test(salida), "   «No quiero participar» explica cómo dejarlo (su Comandante o el contacto) y que no se borra nada solo");
  c(salida.length > 0 && !/guardar|setDoc|deleteDoc|borrar/.test(salida), "   y decir que no NO escribe ni borra nada");
  c(/ev\.key === "Escape"\) \{ ev\.preventDefault\(\)/.test(PIEZA) && !/mousedown|"click"/.test(PIEZA), "   no se cierra con Escape ni pulsando fuera (cerrarla sin querer no es un «no»)");
  c(PIEL.no === "sgConsNo_" && /NEBULA/.test(TX.quien) && !/Claude/.test(JSON.stringify(PIEL) + trozo), "   habla NEBULA, y ni una vez «Claude» (y la clave de «dijo que no», la de siempre)");

  console.log("\n  · La política de privacidad");
  const P = L("privacidad.html");
  c(P.includes("Versión " + V) && P.includes("5 de octubre de 2026"), "🔴 fecha nueva y la versión que se firma (" + V + ")");
  c(P.includes(TEXTO), "   el texto de la casilla, tal cual");
  c(/consentimiento<\/b> \(artículo 6\.1\.a/.test(P), "   base legal: el consentimiento");
  c(/Google Apps Script/.test(P) && /cuenta\s+de Google del equipo docente/.test(P) && /un único correo/.test(P), "   el correo de bienvenida (una cuenta de Google del equipo docente, por Apps Script)");
  c(/no se envía a ningún sitio/.test(P) && /herramientas de inteligencia artificial,\s+siempre bajo supervisión humana/.test(P) && /tu alias, tu grupo y el correo de tu cuenta/.test(P), "   el canal de ayuda: NEBULA en el navegador; lo que no sabe, al equipo, con IA bajo supervisión humana");
  c(/cláusulas contractuales tipo/.test(P) && /Firebase y Google Cloud/.test(P), "   Google como infraestructura y las transferencias (cláusulas contractuales tipo)");
  c(/Delegación de Protección de Datos de la UNIR/.test(P) && !/acuerdo de|encargad[oa] del tratamiento/i.test(P), "   la Delegación de Protección de Datos de la UNIR, sin dar por hecho ningún acuerdo");
  c(/Para dejar STARGATE y retirar tu consentimiento/.test(P) && /aepd\.es/.test(P), "   cómo retirar el consentimiento y pedir el borrado (y la AEPD)");
  c(!/Solo lo necesario para que el juego funcione\. Nada más\./.test(P), "   fuera el «Nada más» que ya no era verdad");
  c(!/Claude|Anthropic/.test(P), "🔴 ni «Claude» ni «Anthropic» en la página");
  c(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(P.replace(/<script[\s\S]*?<\/script>/g, "")), "   sin emojis");

  console.log("\n  Batería 134 · el consentimiento");
  console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  process.exit(fallos.length ? 1 : 0);
})();
