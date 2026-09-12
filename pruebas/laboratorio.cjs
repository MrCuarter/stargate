'use strict';
/**
 * EL LABORATORIO · fontanería de la batería 67.
 *
 * La batería 64 recorre la web con un DOBLE del motor: contesta lo que le digo, y por eso no podía
 * encontrar un fallo en una compra, un reto o una llamada a filas. Esta recorre la web contra los
 * EMULADORES de Firebase: las reglas de Firestore de verdad, las Cloud Functions de verdad, el mismo
 * motor.js que corre en producción. Nada sale de esta máquina y no existe ninguna cuenta real.
 *
 * Tres piezas:
 *   · los emuladores (Auth 9099, Firestore 8080, Functions 5001) bajo el proyecto `demo-stargate`,
 *     que Firebase garantiza que no habla con nada real;
 *   · la web servida desde 127.0.0.1, con `window.SG_EMU = true` inyectado antes de cargar
 *     (motor.js solo se conecta a los emuladores si se cumplen las dos cosas);
 *   · Chrome con UN CONTEXTO AISLADO POR PERSONA. 🔴 Esto no es un detalle: la sesión de Firebase
 *     vive en el almacenamiento del origen, así que dos pestañas normales comparten sesión y entrar
 *     como alumna en una sacaría a la referente de la otra. Cada contexto es un incógnito aparte.
 */
const fs = require("fs"), path = require("path"), os = require("os"), { spawn, spawnSync } = require("child_process");

const RAIZ = path.resolve(__dirname, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const P_CDP = 9555, P_WEB = 8765, P_WEB2 = 8766;
const PROYECTO = "demo-stargate";
const EMU = { auth: 9099, firestore: 8080, functions: 5001 };
const PUBLICA = `http://127.0.0.1:${EMU.functions}/${PROYECTO}/us-central1/tableroStargate`;
const BASE = `http://127.0.0.1:${P_WEB}/`;
const dormir = ms => new Promise(r => setTimeout(r, ms));

// ------------------------------------------------------------------ emuladores
async function emuladoresVivos() {
  try {
    const [a, f, fn] = await Promise.all([
      fetch(`http://127.0.0.1:${EMU.auth}/`).then(r => r.ok || r.status < 500),
      fetch(`http://127.0.0.1:${EMU.firestore}/`).then(r => r.ok || r.status < 500),
      fetch(PUBLICA + "?per=nada").then(r => r.status < 600),
    ]);
    return a && f && fn;
  } catch (e) { return false; }
}

/** Borra TODO lo del emulador —datos y cuentas— y vuelve a sembrar. Cada pasada empieza igual. */
async function reiniciar() {
  await fetch(`http://127.0.0.1:${EMU.firestore}/emulator/v1/projects/${PROYECTO}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://127.0.0.1:${EMU.auth}/emulator/v1/projects/${PROYECTO}/accounts`, { method: "DELETE" });
  const r = spawnSync(process.execPath, [path.join(RAIZ, "motor", "sembrar_prueba.js"), "--lab"],
    { encoding: "utf8", env: Object.assign({}, process.env, { FIRESTORE_EMULATOR_HOST: `127.0.0.1:${EMU.firestore}` }) });
  const codigo = ((r.stdout || "").match(/código de acceso:\s*(\w+)/) || [])[1];
  if (!codigo) throw new Error("no se pudo sembrar el laboratorio: " + (r.stderr || r.stdout || "").slice(0, 300));
  return codigo;
}

/** Lee un documento del emulador saltándose las reglas (como haría la consola de Firebase). */
async function leerDoc(ruta) {
  const r = await fetch(`http://127.0.0.1:${EMU.firestore}/v1/projects/${PROYECTO}/databases/(default)/documents/${ruta}`,
                        { headers: { Authorization: "Bearer owner" } });
  if (!r.ok) return null;
  return desFirestore((await r.json()).fields || {});
}
async function consultar(coleccion, campo, valor) {
  const r = await fetch(`http://127.0.0.1:${EMU.firestore}/v1/projects/${PROYECTO}/databases/(default)/documents:runQuery`, {
    method: "POST", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: coleccion }],
      where: { fieldFilter: { field: { fieldPath: campo }, op: "EQUAL", value: { stringValue: valor } } } } }) });
  const j = await r.json();
  return (j || []).filter(x => x.document).map(x => Object.assign({ _id: x.document.name.split("/").pop() }, desFirestore(x.document.fields || {})));
}
function desFirestore(f) {
  const v = x => x.stringValue !== undefined ? x.stringValue : x.integerValue !== undefined ? Number(x.integerValue)
    : x.doubleValue !== undefined ? x.doubleValue : x.booleanValue !== undefined ? x.booleanValue
    : x.nullValue !== undefined ? null : x.timestampValue !== undefined ? x.timestampValue
    : x.arrayValue ? (x.arrayValue.values || []).map(v) : x.mapValue ? desFirestore(x.mapValue.fields || {}) : undefined;
  const o = {}; Object.keys(f).forEach(k => { o[k] = v(f[k]); }); return o;
}

// ------------------------------------------------------------------ CDP
function conectar(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map(); const oyentes = [];
  ws.addEventListener("message", ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { ok, mal } = pend.get(m.id); pend.delete(m.id);
      return m.error ? mal(new Error(m.error.message)) : ok(m.result); }
    oyentes.forEach(f => f(m));
  });
  const listo = new Promise((ok, mal) => { ws.addEventListener("open", () => ok()); ws.addEventListener("error", () => mal(new Error("ws"))); });
  return { listo, ws, al: f => oyentes.push(f),
    enviar(method, params, sessionId) {
      return new Promise((ok, mal) => { const n = ++id; pend.set(n, { ok, mal });
        const msg = { id: n, method, params: params || {} }; if (sessionId) msg.sessionId = sessionId;
        ws.send(JSON.stringify(msg)); }); } };
}
function conTope(p, ms, que) {
  let t; return Promise.race([p.finally(() => clearTimeout(t)),
    new Promise((_, mal) => { t = setTimeout(() => mal(new Error("tiempo agotado: " + que)), ms); })]);
}

let NAV = null, CHROME_PROC = null, WEB = null, WEB2 = null, PERFIL = null;
async function arrancar(ver) {
  WEB = spawn("python3", ["-m", "http.server", String(P_WEB), "--bind", "127.0.0.1"], { cwd: RAIZ, stdio: "ignore" });
  PERFIL = fs.mkdtempSync(path.join(os.tmpdir(), "sglab-"));
  const args = ["--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${P_CDP}`,
                `--user-data-dir=${PERFIL}`, "about:blank"];
  if (!ver) args.unshift("--headless=new");
  CHROME_PROC = spawn(CHROME, args, { stdio: "ignore" });
  let v = null;
  for (let i = 0; i < 80 && !v; i++) { try { v = await (await fetch(`http://127.0.0.1:${P_CDP}/json/version`)).json(); } catch (e) {} if (!v) await dormir(300); }
  if (!v) throw new Error("Chrome no arrancó");
  NAV = conectar(v.webSocketDebuggerUrl); await NAV.listo;
  // para el escondite «dentro de otra web»: un segundo origen que hace de Genially
  WEB2 = spawn("python3", ["-m", "http.server", String(P_WEB2), "--bind", "127.0.0.1"], { cwd: path.join(RAIZ, "pruebas", "anfitrion"), stdio: "ignore" });
  await dormir(500);
}
async function parar() {
  try { CHROME_PROC && CHROME_PROC.kill(); } catch (e) {}
  try { WEB && WEB.kill(); } catch (e) {}
  try { WEB2 && WEB2.kill(); } catch (e) {}
}

/**
 * Una persona = un contexto aislado + una pestaña. Devuelve un objeto con el que manejarla.
 */
async function persona(nombre) {
  const { browserContextId } = await NAV.enviar("Target.createBrowserContext", { disposeOnDetach: true });
  const { targetId } = await NAV.enviar("Target.createTarget", { url: "about:blank", browserContextId });
  const { sessionId } = await NAV.enviar("Target.attachToTarget", { targetId, flatten: true });
  const errores = [];
  NAV.al(m => {
    if (m.sessionId !== sessionId) return;
    if (m.method === "Runtime.exceptionThrown") {
      const d = m.params.exceptionDetails || {};
      errores.push(String((d.exception && d.exception.description) || d.text || "error").split("\n")[0]);
    }
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errores.push(String(m.params.entry.text || ""));
  });
  const env = (m, p) => NAV.enviar(m, p, sessionId);
  await env("Page.enable"); await env("Runtime.enable"); await env("Log.enable");
  await env("Emulation.setDeviceMetricsOverride", { width: 1280, height: 860, deviceScaleFactor: 1, mobile: false });
  // 🔴 El interruptor del laboratorio, puesto ANTES de que cargue nada en cada documento nuevo.
  await env("Page.addScriptToEvaluateOnNewDocument", { source:
    `window.SG_EMU = true; window.SG_API_PUBLICA = ${JSON.stringify(PUBLICA)};` +
    // los diálogos del navegador (alert/confirm) congelarían la prueba: se aceptan y se anotan
    `window.__dialogos = []; window.alert = function(m){ window.__dialogos.push(String(m)); };` });
  const p = {
    nombre, errores, env,
    async ir(pagina) { await env("Page.navigate", { url: pagina.indexOf("http") === 0 ? pagina : BASE + pagina });
                       await p.hasta("document.readyState==='complete'", 15); await dormir(250); },
    async js(expr, ms) {
      const r = await conTope(env("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }), ms || 20000, expr.slice(0, 60));
      if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text || "").split("\n")[0] + " ← " + expr.slice(0, 70));
      return r.result.value;
    },
    async hasta(expr, seg) {
      for (let i = 0; i < (seg || 10) * 5; i++) { try { if (await p.js(expr, 4000)) return true; } catch (e) {} await dormir(200); }
      return false;
    },
    async entrarComo(correo, nombre) {
      await p.hasta("!!(window.SG && window.SG.EMU && window.SG.MOTOR)", 20);
      return p.js(`window.SG.EMU.entrarComo(${JSON.stringify(correo)}, ${JSON.stringify(nombre || correo)}).then(function(u){ return u.email; })`);
    },
    async pulsar(texto, dentro) {
      return p.js(`(function(){
        var raiz = ${dentro ? `document.querySelector(${JSON.stringify(dentro)})` : "document"}; if(!raiz) return "sin contenedor";
        var b = [].slice.call(raiz.querySelectorAll('button, a.btn, [role=button]')).filter(function(x){
          return x.offsetParent !== null && !x.disabled && ${texto instanceof RegExp ? texto.toString() : JSON.stringify(texto)}
            ${texto instanceof RegExp ? ".test(x.textContent)" : " === x.textContent.trim()"}; })[0];
        if(!b) return "no encontrado"; b.click(); return "ok";
      })()`);
    },
    texto() { return p.js("(document.body.innerText||'').replace(/\\s+/g,' ')"); },
    async foto(fichero) {
      const r = await env("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(fichero, Buffer.from(r.data, "base64")); return fichero;
    },
    cerrar() { return NAV.enviar("Target.disposeBrowserContext", { browserContextId }).catch(() => {}); },
  };
  return p;
}

// ------------------------------------------------------------------ marcador
let ok = 0; const fallos = [];
function comprobar(nombre, cierto, detalle) {
  if (cierto) { ok++; process.stderr.write("   ✓ " + nombre + "\n"); return true; }
  const t = nombre + (detalle ? " — " + detalle : "");
  fallos.push(t); process.stderr.write("   ✗ " + t + "\n"); return false;
}

module.exports = { emuladoresVivos, reiniciar, leerDoc, consultar, arrancar, parar, persona, comprobar, dormir,
                   marcador: () => ({ ok, fallos }), BASE, P_WEB2, PUBLICA, RAIZ };
