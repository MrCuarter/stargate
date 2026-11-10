'use strict';
/**
 * BATERÍA 153 · EN VIVO CON LA HISTORIA (10-nov-2026): El Puente, Fragmento vivo y Ashan vuelve a hablar (juegos/vivo/)
 *
 * Tres experiencias de pantalla grande y móviles que el Comandante lanza desde «En directo». Viajan por el canal del juego del
 * final (`directoCanal`, motor.js), SIN nada nuevo en el servidor: la pantalla escribe su estado (con `modo`) y cada móvil sus
 * cifras ({ furia, ses, ronda, pu, ln, ma, vo }) en su documento de la sala. `nucleo.js` convierte esas cifras en sucesos.
 *
 * Qué se demuestra:
 *   1. el adaptador: solo cuenta quien responde a ESTA pantalla (ses); pulsos, páginas, manos y voces salen una sola vez;
 *      lo de una ronda anterior no se repite; el estado solo se escribe cuando cambia (costes por clase);
 *   2. el móvil del recluta salta solo a la experiencia cuando su Comandante la lanza, y vuelve al juego cuando la deja;
 *   3. el juego del final no se rompe con esas cifras; el acceso solo lo ven los grupos del estreno;
 *   4. nada de emojis, de «Claude» ni de direcciones a medias que el versionado de juegos/ no pueda sellar.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato).slice(0, 600))); };

const NUCLEO = L("juegos/vivo/nucleo.js");
/** nucleo.js tal cual, en un navegador de cartón: con ?per= y un motor que apunta lo que se le envía. */
function montar(conMotor) {
  const enviados = [], oyentes = {}; let alCanal = null, cerrado = 0, relojes = [];
  const motor = { auth: { currentUser: { uid: "u" } }, directoCanal: (per, doc, yo, f) => { alCanal = f; return { enviar: m => enviados.push(JSON.parse(JSON.stringify(m))), cerrar: () => { cerrado++; }, mio: async () => null }; } };
  const w = {
    location: { search: conMotor ? "?per=per-x&sesion=1&v=0123456789" : "", href: "https://s.test/juegos/vivo/puente.html" + (conMotor ? "?per=per-x&sesion=1&v=0123456789" : ""), reload() {}, replace() {} },
    document: { getElementById: () => null, body: { classList: { toggle() {} } }, documentElement: {}, addEventListener() {} },
    matchMedia: () => ({ matches: false }), performance: { now: () => Date.now() }, URL, URLSearchParams, Math, JSON, Date, Number, String, Object, Array, console,
    setInterval: f => { relojes.push(f); return relojes.length; }, clearInterval() {}, setTimeout, addEventListener: (t, f) => { (oyentes[t] = oyentes[t] || []).push(f); }
  };
  w.window = w; w.parent = conMotor ? { SG: { MOTOR: motor } } : w; if (conMotor) w.parent.parent = w.parent;
  vm.runInNewContext(NUCLEO, w);
  return { F: w.F, enviados, oyentes, dar: m => alCanal(m), tic: () => relojes.forEach(f => f()), cerrado: () => cerrado };
}

(async () => {
  console.log("\n  Batería 153 · en vivo con la historia (juegos/vivo)\n");
  // ── 1 · el adaptador del canal
  const A = montar(true); await A.F.arranque();
  c(A.F.M && A.F.PER === "per-x", "   con ?per= y el motor en la página que lo contiene, usa el canal del motor");
  const sucesos = []; let n = 0;
  const S = A.F.sala("fragmento", () => ({ fase: "linea", n }), (m, p, nuevo) => sucesos.push(m.t + ":" + p.id + (m.n != null ? ":" + m.n : "") + (m.on != null ? ":" + m.on : "") + (m.texto ? ":" + m.texto : "") + (nuevo ? ":nuevo" : "")));
  A.tic(); const e0 = A.enviados[0] || {};
  c(e0.t === "estado" && e0.modo === "fragmento" && typeof e0.ses === "string" && e0.ronda === 0 && typeof e0.ts === "number", "   la pantalla escribe su estado con modo, ses, ronda y hora", e0);
  A.tic(); A.tic();
  c(A.enviados.length === 1, "🔴 un estado igual al último no se vuelve a escribir (cada escritura la leen todos los móviles)", A.enviados.length);
  n = 1; A.tic(); c(A.enviados.length === 2 && A.enviados[1].n === 1, "   y uno distinto, sí");
  const cifras = (id, s) => { A.dar({ t: "hola", id, alias: "Ana " + id }); A.dar({ t: "pts", id, puntos: 0, stats: s }); };
  cifras("resto", { derribos: 3 }); cifras("otra", { furia: 1, ses: "vieja", ronda: 0, pu: 4 });
  c(S.gente.size === 0 && !sucesos.length, "🔴 los restos del juego y quien responde a otra pantalla no cuentan como presentes", [...S.gente.keys()]);
  cifras("a", { furia: 1, ses: e0.ses, ronda: 0, pu: 0, ln: -1, ma: 0, vo: [] });
  c(S.gente.size === 1 && S.gente.get("a").alias === "Ana a" && sucesos.join() === "hola:a:nuevo", "   quien responde a esta pantalla entra, con su nombre de recluta", sucesos);
  sucesos.length = 0;
  cifras("a", { furia: 1, ses: e0.ses, ronda: 0, pu: 2, ln: 0, ma: 1, vo: ["Porque queda"] });
  c(sucesos.join() === "pulso:a,pulso:a,linea:a:0,mano:a:true,voz:a:Porque queda", "   sus cifras se convierten en pulsos, página, mano y voz", sucesos);
  sucesos.length = 0; cifras("a", { furia: 1, ses: e0.ses, ronda: 0, pu: 2, ln: 0, ma: 1, vo: ["Porque queda"] });
  c(!sucesos.length, "🔴 la misma escritura dos veces no repite nada", sucesos);
  cifras("a", { furia: 1, ses: e0.ses, ronda: 0, pu: 60, ln: 0, ma: 0, vo: ["Porque queda", "b", "c", "d", "e"] });
  c(sucesos.filter(x => x === "pulso:a").length === 3 && sucesos.filter(x => x.indexOf("voz:") === 0).length === 2 && sucesos.indexOf("mano:a:false") >= 0, "   topes: 3 pulsos por escritura y 3 voces por recluta", sucesos);
  S.nuevaRonda(); A.tic(); sucesos.length = 0;
  cifras("a", { furia: 1, ses: e0.ses, ronda: 0, pu: 60, ln: 2, ma: 1, vo: ["x", "y", "z"] });
  c(!sucesos.some(x => /linea|voz|mano:a:true/.test(x)), "🔴 lo de la ronda anterior no entra en la nueva", sucesos);
  sucesos.length = 0; cifras("a", { furia: 1, ses: e0.ses, ronda: 1, pu: 60, ln: 0, ma: 0, vo: ["nueva"] });
  c(sucesos.join() === "linea:a:0,voz:a:nueva", "   y en la ronda nueva se empieza de cero", sucesos);
  (A.oyentes.pagehide || []).forEach(f => f({ persisted: false }));
  c(A.cerrado() === 1, "🔴 al salir del marco se cierran las escuchas del motor");
  const u = A.F.url("../directo/proyector.html", { f: 3 });
  c(/per=per-x/.test(u) && /sesion=1/.test(u) && /f=3/.test(u) && !/v=0123456789/.test(u), "   las direcciones conservan el grupo y la sesión, sin arrastrar la huella vieja", u);
  const B = montar(false); await B.F.arranque();
  c(!B.F.M, "   sin ?per= (el borrador), no busca el motor");

  // ── 2 · el móvil del recluta va y vuelve solo
  const AL = L("juegos/directo/alumno.js"), MV = L("juegos/vivo/movil.html");
  c(/\['puente', 'fragmento', 'ashan'\]\.includes\(m\.modo\)/.test(AL) && /vivo\/movil\.html/.test(AL) && /location\.replace/.test(AL), "🔴 el móvil del juego salta a la experiencia cuando el estado de la sala trae su modo");
  c(/m\.ts/.test(AL.slice(AL.indexOf("vivo/movil.html") - 400, AL.indexOf("vivo/movil.html"))), "   pero no por un estado viejo (más de tres horas)");
  c(/location\.replace\(F\.url\("\.\.\/directo\/alumno\.html[^"]*"\)\)/.test(MV), "🔴 y vuelve al juego cuando el Comandante deja la experiencia");
  c(/directoYo\(F\.PER\)/.test(MV) && /C\.mio\(\)/.test(MV) && /listo: !!\(antes && antes\.listo === true\)/.test(MV), "   entra con su ficha de recluta y conserva su «listo» y sus puntos del juego");
  c(/maxLength = 90/.test(MV) && /st\.vo\.length < 3/.test(MV), "   Ashan: frases de 90 letras y tres por recluta");

  // ── 3 · el juego del final y el acceso
  const PJ = L("juegos/directo/proyector.js"), PH = L("juegos/directo/proyector.html");
  c(/for \(const k of Object\.keys\(j\.stats\)\)/.test(PJ), "   el juego solo lee SUS cifras del documento del jugador (las de la historia no le afectan)");
  c(/id="vivo"/.test(PH) && /class="[^"]*oculto[^"]*"[^>]*id="vivo"|id="vivo"[^>]*class="[^"]*oculto/.test(PH), "🔴 el acceso nace oculto en la pantalla de preparar");
  c(/VIVO_GRUPOS = \['per-16450', 'demo-stargate'\]/.test(PJ) && /VIVO_GRUPOS\.includes\(PER\)/.test(PJ), "🔴 y solo se enseña en los grupos del estreno (PER 16450 y la demo)");
  for (const p of ["puente", "fragmento", "ashan"]) c(new RegExp("vivo/" + p + "\\.html").test(PJ) && fs.existsSync(path.join(R, "juegos/vivo/" + p + ".html")), "   " + p + ": enlazado y publicado");

  // ── 4 · higiene
  const TODO = ["nucleo.js", "estilo.css", "puente.html", "fragmento.html", "ashan.html", "movil.html"].map(f => L("juegos/vivo/" + f)).join("\n");
  c(!/claude|fable|anthropic/i.test(TODO), "🔴 nada visible ni en el código dice «Claude»");
  c(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(TODO), "   sin emojis");
  c(!/\.html\?[a-z]+=["'`]\s*\+/.test(TODO) && !/\.html\?[a-z]+=\$\{/.test(TODO), "   sin direcciones a medias: todas pasan por F.url (el versionado de juegos/ las sella)");
  c(!fs.existsSync(path.join(R, "juegos/vivo/_prueba_canal.html")), "   el banco de pruebas del borrador no se publica");
  c(/100dvh/.test(TODO) && /safe-area-inset-bottom/.test(TODO) && /prefers-reduced-motion/.test(TODO), "   móvil: altos con dvh, zona segura y movimiento reducido");

  console.log("\n" + (fallos.length ? "✗ " + fallos.length + " fallos" : "✓ todo bien") + " · " + ok + " comprobaciones");
  process.exit(fallos.length ? 1 : 0);
})();
