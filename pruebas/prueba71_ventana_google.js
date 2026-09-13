'use strict';
/**
 * BATERÍA 71 · EL PRIMER CLIC, EN LA WEB DE VERDAD.
 *
 * 🔴🔴 13-sep · La 70 mira que el ayudante de Google sea el suyo. Esta hace lo que hace una persona:
 * abre la puerta PUBLICADA en un Chrome limpio (sin ninguna sesión), pulsa «Iniciar sesión con
 * Google» y comprueba que la ventana que se abre LLEGA a la pantalla de cuentas de Google. Es el
 * paso que estuvo roto desde el 12-sep sin que nada lo viera: el laboratorio abre la sesión por
 * detrás, con los emuladores, y nunca pasa por esta ventana.
 *
 * Aquí no se entra con ninguna cuenta (eso lo hace cada cual en Google): solo se comprueba que el
 * camino hasta allí existe. Sin red o sin Chrome, avisa y no cuenta.
 */
const { spawn } = require("child_process"); const fs = require("fs"), os = require("os"), path = require("path");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PUERTA = "https://stargate.mistercuarter.es/entrar.html";
const dormir = ms => new Promise(r => setTimeout(r, ms));
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
function fin() {
  console.log("\n  Batería 71 · el primer clic, en la web de verdad");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
}
(async () => {
  if (!fs.existsSync(CHROME)) { console.log("   ⚠️ sin Chrome: no se ha probado la ventana de Google"); return fin(); }
  try { await fetch(PUERTA, { method: "HEAD" }); } catch (e) { console.log("   ⚠️ sin red: no se ha probado la ventana de Google"); return fin(); }
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "sgpop-"));
  const ch = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=9337", `--user-data-dir=${perfil}`, "about:blank"], { stdio: "ignore" });
  try {
    let v; for (let i = 0; i < 60 && !v; i++) { try { v = await (await fetch("http://127.0.0.1:9337/json/version")).json(); } catch (e) {} if (!v) await dormir(300); }
    const ws = new WebSocket(v.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r));
    let id = 0; const pend = new Map(); const targets = {};
    ws.addEventListener("message", ev => { const m = JSON.parse(ev.data);
      if (m.id && pend.has(m.id)) { const f = pend.get(m.id); pend.delete(m.id); f(m.result || m); }
      if (m.method === "Target.targetCreated" || m.method === "Target.targetInfoChanged") { const t = m.params.targetInfo; targets[t.targetId] = t; } });
    const env = (method, params, sessionId) => new Promise(ok => { const n = ++id; pend.set(n, ok); const msg = { id: n, method, params: params || {} }; if (sessionId) msg.sessionId = sessionId; ws.send(JSON.stringify(msg)); });
    await env("Target.setDiscoverTargets", { discover: true });
    const { targetId } = await env("Target.createTarget", { url: PUERTA + "?b71=" + Date.now() });
    const { sessionId } = await env("Target.attachToTarget", { targetId, flatten: true });
    let boton = "";
    for (let k = 0; k < 20 && !boton; k++) { await dormir(600);
      const r = await env("Runtime.evaluate", { expression: "(function(){var b=[].slice.call(document.querySelectorAll('button')).filter(function(x){return /Iniciar sesión con Google/.test(x.textContent)&&x.offsetParent})[0]; return b?b.textContent.trim():'';})()", returnByValue: true }, sessionId);
      boton = r.result && r.result.value; }
    c(!!boton, "la puerta publicada enseña «Iniciar sesión con Google» a quien llega sin sesión");
    await env("Runtime.evaluate", { expression: "[].slice.call(document.querySelectorAll('button')).filter(function(x){return /Iniciar sesión con Google/.test(x.textContent)&&x.offsetParent})[0].click()", userGesture: true }, sessionId);
    const vistas = [];
    for (let k = 0; k < 25; k++) { await dormir(600);
      Object.values(targets).filter(t => t.type === "page" && t.targetId !== targetId).forEach(t => { if (vistas.indexOf(t.url) < 0) vistas.push(t.url); });
      if (vistas.some(u => /accounts\.google\.com/.test(u))) break; }
    c(vistas.some(u => /\/__\/auth\/handler\?/.test(u)), "al pulsar se abre la ventana del ayudante de Google", vistas.join(" · ").slice(0, 200));
    c(vistas.some(u => /accounts\.google\.com/.test(u)), "🔴 y esa ventana LLEGA a la pantalla de cuentas de Google", vistas.join(" · ").slice(0, 240));
  } catch (e) { c(false, "la batería no revienta", e.message); }
  finally { try { ch.kill(); } catch (e) {} }
  fin();
})();
