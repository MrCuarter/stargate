'use strict';
/**
 * EL DIRECTO DE PUNTA A PUNTA, CON DOS NAVEGADORES (16-oct · la batería 149 lo prueba por piezas)
 * ------------------------------------------------------------------------------------------------
 * La docente (Ana) abre `sesion.html` en la web y emite en directo; el recluta la sigue desde su Nave (`?embed=1&seguir=1`).
 * El motor es un doble (sin Firebase): lo que publica la docente le llega al recluta como le llegaría por `mod_envivo`.
 * Lo que se mira, en la pantalla de los dos:
 *   1. con la configuración del recluta ANTIGUA (Ana apagó «Novedades» después de que él cargara): mismo mazo, misma diapositiva;
 *   2. «Únete» (solo de la docente en las semanas 1 y 2) y el panel del despegue (que la Nave embebida no llevaba): los tiene;
 *   3. la docente quita una sección a mitad de clase («Configurar la sesión»): el recluta se rehace sin recargar;
 *   4. plan B: una diapositiva que el recluta no tiene → va a la última común y lo dice;
 *   5. la emisión falla una vez: «Sin señal», al registro, y se reintenta sola;
 *   6. acaba el directo: el recluta vuelve a su propio mazo.
 *
 *   NODE_PATH=$(npm root -g) node pruebas/vivo/directo_mismo_mazo.cjs     (Playwright; SG_CHROME=<ruta> para otro Chrome)
 *   SG_MOVIL=1: el recluta en un teléfono (390×844) · SG_CAPTURAS=<carpeta>: guarda capturas del plan B y de «Sin señal»
 */
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const RAIZ = path.resolve(__dirname, "..", "..");
const BASE = "http://sg.lab/";
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato).slice(0, 500))); };
const dormir = ms => new Promise(r => setTimeout(r, ms));
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };

// el tablero que reciben los dos al cargar: Ana NO tenía nada apagado (el recluta se queda con esto)
const TABLERO = { tipo: "REGULAR", nombre: "Lab directo", inicio: "2026-10-05", pausas: [], reclutas: [{ fid: "f1", alias: "Recluta Uno", profe: "Ana" }],
  sesiones: { Ana: [] }, modOrdenSesion: {}, paneles: { Ana: "about:blank#panel-ana" } };
// lo que lee la docente al entrar (configFresca): ya ha apagado «Novedades» (el recluta cargó antes y aún la tiene)
let GRUPO = { stargate: { sesiones: { Ana: ["novedades"] }, modOrdenSesion: { Ana: [] } }, joinCode: "ABC123" };

function motorDoble(quien) {
  // se inyecta antes que nada: window.__nodo* son puentes a este proceso
  return `(() => {
    const QUIEN = ${JSON.stringify(quien)}, TABLERO = ${JSON.stringify(TABLERO)};
    const vigilantes = [];
    window.__envivo = (d) => { vigilantes.forEach(f => f(JSON.parse(JSON.stringify(d || {})))); };
    const M = {
      db: {}, doc: (db, col, id) => ({ col, id }),
      getDoc: (ref) => window.__nodoGrupo().then(g => ({ exists: () => true, data: () => g })),
      getDocs: () => Promise.resolve({ docs: [], forEach() {} }), collection() {}, query() {}, where() {},
      sesion: () => Promise.resolve(QUIEN === "docente" ? { uid: "u-ana", correo: "ana@lab.test" } : { uid: "u-rec", correo: "rec@lab.test" }),
      misPERs: () => Promise.resolve(QUIEN === "docente" ? [{ id: "g1", miNombre: "Ana", estado: "en marcha" }] : []),
      misGruposDeAlumno: () => Promise.resolve(QUIEN === "recluta" ? [{ per: "g1", ficha: "f1", profe: "Ana" }] : []),
      vigilarEnVivo: (per, f) => { vigilantes.push(f); window.__nodoLeer().then(d => f(d || {})); return () => {}; },
      publicarEnVivo: (per, cambios) => window.__nodoPublicar(cambios),
      apuntarFallo: (e, p) => { window.__apuntados = (window.__apuntados || []).concat([p + ":" + (e && e.code)]); return true; },
      vigilarVotaciones: (per, f) => { f([]); return () => {}; }, votaciones: () => Promise.resolve([]),
      miRespuesta: () => Promise.resolve(null), miPapeleta: () => Promise.resolve({}),
      reflexionesDe: () => Promise.resolve([]), marcasTicket: () => Promise.resolve({}),
      llamadaAbierta: () => Promise.resolve(null), fichajesDe: () => Promise.resolve([]),
      updateDoc: (ref, cambios) => window.__nodoGuardar(cambios), invitacion: () => "", codigoGenially: () => "", plantilla: () => "",
    };
    window.SG = window.SG || {};
    const poner = () => { window.SG.MOTOR = M; window.SG.FUENTE = { nombre: "firestore", tablero: () => Promise.resolve(JSON.parse(JSON.stringify(TABLERO))) }; };
    poner();
    let sg = window.SG; Object.defineProperty(window, "SG", { configurable: true, get: () => sg, set: (v) => { sg = v; poner(); } });
    addEventListener("DOMContentLoaded", () => setTimeout(() => { poner(); document.dispatchEvent(new Event("sg:motor")); }, 50));
  })();`;
}

(async () => {
  const navegador = await chromium.launch({ executablePath: process.env.SG_CHROME || undefined, args: ["--no-sandbox"] });
  let envivo = {}, fallarProxima = 0, publicaciones = 0;
  const alRecluta = [];
  async function abrir(quien, url) {
    const movil = quien === "recluta" && process.env.SG_MOVIL;
    const ctx = await navegador.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } });
    await ctx.route("**/*", (ruta) => {
      const u = new URL(ruta.request().url());
      if (u.host !== "sg.lab") return ruta.abort();
      let f = path.join(RAIZ, decodeURIComponent(u.pathname));
      if (/\/(assets\/js\/motor\.js|motor\/(paquete|tablero)\.js|assets\/js\/fuente\.js)$/.test(u.pathname)) return ruta.fulfill({ status: 200, contentType: "text/javascript", body: "" });
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return ruta.fulfill({ status: 404, body: "" });
      ruta.fulfill({ status: 200, contentType: TIPOS[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f) });
    });
    await ctx.exposeFunction("__nodoGrupo", () => GRUPO);
    await ctx.exposeFunction("__nodoLeer", () => envivo);
    await ctx.exposeFunction("__nodoGuardar", (cambios) => { if (cambios["stargate.sesiones"]) GRUPO = Object.assign({}, GRUPO, { stargate: Object.assign({}, GRUPO.stargate, { sesiones: cambios["stargate.sesiones"] }) }); });
    await ctx.exposeFunction("__nodoPublicar", async (cambios) => {
      if (fallarProxima > 0) { fallarProxima--; const e = new Error("unavailable"); throw e; }
      publicaciones++;
      for (const k of Object.keys(cambios)) envivo[k] = Object.assign({}, envivo[k] || {}, cambios[k]);   // como `merge`
      alRecluta.forEach(p => p.evaluate(d => window.__envivo && window.__envivo(d), envivo).catch(() => {}));
    });
    await ctx.addInitScript(motorDoble(quien));
    const p = await ctx.newPage();
    p.on("pageerror", e => console.log("      [" + quien + " · error] " + e.message.slice(0, 200)));
    await p.goto(BASE + url);
    return p;
  }
  const mazo = p => p.evaluate(() => Array.from(document.querySelectorAll(".barra-pasos .p")).map(b => b.getAttribute("title")));
  const enCual = p => p.evaluate(() => { const b = document.querySelector(".barra-pasos .p.on"); return b ? b.getAttribute("title") : null; });
  const hasta = async (p, fn, arg, s = 10) => { for (let i = 0; i < s * 5; i++) { try { if (await p.evaluate(fn, arg)) return true; } catch (e) {} await dormir(200); } return false; };
  const iguales = async (doc, rec) => { for (let i = 0; i < 40; i++) { const a = await mazo(doc), b = await mazo(rec), x = await enCual(doc), y = await enCual(rec);
    if (a.length && JSON.stringify(a) === JSON.stringify(b) && x === y) return { ok: true, a, x }; await dormir(250); }
    return { ok: false, docente: await mazo(doc), recluta: await mazo(rec), x: await enCual(doc), y: await enCual(rec) }; };

  console.log("▶ El directo de punta a punta (docente en la web, recluta en su Nave)");
  const doc = await abrir("docente", "sesion.html?per=g1&sem=2");
  c(await hasta(doc, () => document.querySelectorAll(".barra-pasos .p").length > 3 && !!document.querySelector("#ses-directo"), null, 20), "la sesión de la docente arranca con su botón de emitir");
  const rec = await abrir("recluta", "sesion.html?per=g1&embed=1&seguir=1");
  alRecluta.push(rec);
  c(await hasta(rec, () => document.querySelectorAll(".barra-pasos .p").length > 3, null, 20), "la del recluta, también");
  const antes = await mazo(rec), delDoc = await mazo(doc);
  console.log("      docente: " + delDoc.join(" | ") + "\n      recluta: " + antes.join(" | "));
  c(JSON.stringify(antes) !== JSON.stringify(delDoc), "   (sin directo, sus mazos NO son iguales: es el fallo de María)", { docente: delDoc, recluta: antes });

  await doc.click("#ses-directo");
  let r = await iguales(doc, rec);
  c(r.ok, "🔴 al emitir: el recluta tiene EXACTAMENTE el mazo de la docente y está en su diapositiva", r);
  const tieneUnete = (await mazo(rec)).some(t => /Únete/.test(t)), tienePanel = (await mazo(rec)).some(t => /despegue/i.test(t));
  c(tieneUnete && tienePanel, "   con «Únete» (semana 2) y con el panel del despegue", await mazo(rec));
  c(antes.some(t => /Novedades/.test(t)) && !(await mazo(rec)).some(t => /Novedades/.test(t)), "   y sin lo que ella apagó después de que él cargara («Novedades»)");

  // se mueve a «Únete» y al despegue
  for (const objetivo of ["Únete", "despegue"]) {
    await doc.evaluate((t) => { const b = Array.from(document.querySelectorAll(".barra-pasos .p")).find(x => new RegExp(t, "i").test(x.getAttribute("title"))); b && b.click(); }, objetivo);
    r = await iguales(doc, rec);
    c(r.ok && new RegExp(objetivo, "i").test(r.x || ""), "🔴 la docente en «" + objetivo + "»: el recluta, también", r);
    if (objetivo === "Únete") c(await hasta(rec, () => { const k = document.querySelector("#ses-un-cod"); return k && k.textContent === "✓" && /ya estás a bordo/.test(document.querySelector("#ses-un-msg").textContent); }),
      "   (y su «Únete» le dice que ya está a bordo: el código de clase no lo lee)");
  }

  // la docente quita «La Ruta» a mitad de clase, desde «Configurar la sesión» (la rueda de verdad: guarda y repinta)
  c((await mazo(rec)).some(t => /La Ruta/.test(t)), "   (el recluta tiene «La Ruta»)");
  await doc.click("#prep-cfg");
  c(await hasta(doc, () => !!document.querySelector('.m-sec input[data-sec="ruta"]')), "   la docente abre «Configurar la sesión»");
  await doc.evaluate(() => { const x = document.querySelector('.m-sec input[data-sec="ruta"]'); x.checked = !x.checked; x.onchange(); });
  c(await hasta(doc, () => !Array.from(document.querySelectorAll(".barra-pasos .p")).some(b => /La Ruta/.test(b.getAttribute("title")))), "   y quita «La Ruta» de su mazo");
  r = await iguales(doc, rec);
  c(r.ok && !(await mazo(rec)).some(t => /La Ruta/.test(t)), "🔴 cambio a mitad de clase: el recluta se rehace igual, sin recargar", r);
  await doc.evaluate(() => { const x = document.querySelector("[data-cfg-x]"); x && x.click(); });

  // plan B
  const ks = envivo.sesion.mazo.ks;
  envivo.sesion = Object.assign({}, envivo.sesion, { k: "nada-de-esto", n: 0, i: Math.min(5, ks.length - 1), rot: "Una que no tienes", t: Date.now() });
  await rec.evaluate(d => window.__envivo(d), envivo);
  c(await hasta(rec, () => { const p = document.querySelector(".ses-al-perdido"); return p && /Una que no tienes/.test(p.textContent) && !!document.getElementById("ses-al-aldia"); }),
    "🔴 plan B: el recluta ve «Tu Comandante está en «…»» con «Ponerme al día»");
  const CAP = process.env.SG_CAPTURAS; if (CAP) await rec.screenshot({ path: path.join(CAP, "recluta-plan-b.png") });
  if (process.env.SG_MOVIL) c(await rec.evaluate(() => { const p = document.querySelector(".ses-al-perdido").getBoundingClientRect(); return p.left >= 0 && p.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth; }),
    "   (en el teléfono, el aviso cabe entero y la página no se desborda)");
  c((await enCual(rec)) === (await mazo(rec))[Math.min(5, ks.length - 1) - 1], "   y se pone en la última diapositiva común (no se queda donde estaba)", await enCual(rec));

  // la emisión falla una vez
  fallarProxima = 1;
  await doc.evaluate(() => { const b = Array.from(document.querySelectorAll(".barra-pasos .p")); b[1].click(); });
  c(await hasta(doc, () => /Sin señal/.test((document.getElementById("ses-directo") || {}).textContent || "")), "🔴 si la emisión falla, el botón dice «Sin señal»");
  if (CAP) await doc.screenshot({ path: path.join(CAP, "docente-sin-senal.png") });
  c(await hasta(doc, () => /^En directo$/.test((document.getElementById("ses-directo") || {}).textContent || ""), null, 15), "   y se reintenta sola hasta que llega");
  c(((await doc.evaluate(() => window.__apuntados)) || []).length === 1, "   (y queda apuntado en el registro de fallos)", await doc.evaluate(() => window.__apuntados));
  r = await iguales(doc, rec);
  c(r.ok && !(await rec.evaluate(() => !!document.querySelector(".ses-al-perdido"))), "   el recluta vuelve a estar en su diapositiva (y el aviso del plan B se va)", r);

  // fin del directo
  await doc.click("#ses-directo");
  c(await hasta(rec, () => !Array.from(document.querySelectorAll(".barra-pasos .p")).some(b => /Únete/.test(b.getAttribute("title")))),
    "🔴 al acabar el directo, el recluta vuelve a su propio mazo (sin «Únete»)", await mazo(rec));
  c(publicaciones > 3, "   (" + publicaciones + " publicaciones)");

  await navegador.close();
  console.log("\n  Directo de punta a punta · " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  if (fallos.length) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
