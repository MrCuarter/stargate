'use strict';
// Capturador de pantallas por CDP. Lo usa _capturas_pasos.py; no se llama a mano.
//
// 🔴 POR QUE NO BASTA `chrome --headless --screenshot`: la Nave del recluta identifica al alumno
// por localStorage (el correo NO viaja en la URL, y eso es una decision de privacidad que no se
// toca). Chrome headless arranca siempre sin identificar, y con la bandera --screenshot no hay
// forma de ejecutar JS antes de disparar. Por CDP si: se navega, se siembra el localStorage, se
// recarga y se dispara. Cero dependencias: Node trae WebSocket desde la 22.
//
// Uso:  node _capturar.cjs trabajos.json
// Cada trabajo: { nombre, url, ancho, alto, espera, antes?, scroll? }
//   antes  = JS que se ejecuta ANTES de recargar (sembrar localStorage, por ejemplo)
//   scroll = JS que devuelve el elemento al que subir la vista antes de disparar
const fs = require("fs"), path = require("path"), { spawn } = require("child_process");

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PUERTO = 9333;
const trabajos = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const DESTINO = process.argv[3];

const dormir = ms => new Promise(r => setTimeout(r, ms));

async function esperarChrome() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PUERTO}/json/version`); if (r.ok) return await r.json(); }
    catch (e) {}
    await dormir(500);
  }
  throw new Error("Chrome no ha levantado el puerto de depuracion");
}

// un cliente CDP minimo sobre el WebSocket que ya trae Node
function conectar(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map();
  ws.addEventListener("message", ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { ok, mal } = pend.get(m.id); pend.delete(m.id);
      m.error ? mal(new Error(m.error.message)) : ok(m.result); }
  });
  const listo = new Promise((ok, mal) => {
    ws.addEventListener("open", () => ok());
    ws.addEventListener("error", () => mal(new Error("no se pudo abrir el websocket")));
  });
  return { listo, ws,
    enviar(method, params) {
      return new Promise((ok, mal) => { const n = ++id; pend.set(n, { ok, mal });
        ws.send(JSON.stringify({ id: n, method, params: params || {} })); }); } };
}

(async () => {
  const perfil = fs.mkdtempSync(path.join(require("os").tmpdir(), "sgcap-"));
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${PUERTO}`,
    `--user-data-dir=${perfil}`, "about:blank"], { stdio: "ignore" });
  const salida = [];
  try {
    await esperarChrome();
    for (const t of trabajos) {
      const r = await fetch(`http://127.0.0.1:${PUERTO}/json/new?about:blank`, { method: "PUT" });
      const target = await r.json();
      const c = conectar(target.webSocketDebuggerUrl);
      await c.listo;
      await c.enviar("Page.enable");
      await c.enviar("Emulation.setDeviceMetricsOverride",
        { width: t.ancho, height: t.alto, deviceScaleFactor: 2, mobile: false });
      await c.enviar("Page.navigate", { url: t.url });
      await dormir((t.espera || 8) * 1000);
      if (t.antes) {
        await c.enviar("Runtime.evaluate", { expression: t.antes, awaitPromise: true });
        await c.enviar("Page.reload", {});
        await dormir((t.espera || 8) * 1000);
      }
      // 🔴 Esperar por CONDICION, no por reloj. La Nave y el tablero piden sus datos a Apps Script,
      // que tarda entre 2 y 15 segundos segun el dia: con una espera fija la captura salia a veces
      // con el «Contactando con NEBULA...» puesto. `listo` es una expresion que debe volverse cierta.
      if (t.listo) {
        let ok = false;
        for (let i = 0; i < 60; i++) {
          const r = await c.enviar("Runtime.evaluate", { expression: t.listo, returnByValue: true });
          if (r && r.result && r.result.value) { ok = true; break; }
          await dormir(1000);
        }
        if (!ok) throw new Error("«" + t.nombre + "»: la pagina no llego a estar lista (" + t.listo + ")");
      }
      if (t.scroll) await c.enviar("Runtime.evaluate", { expression: t.scroll, awaitPromise: true });
      // 🔴 Y OTRA VEZ DESPUES DEL CLIC. Cambiar de pestaña vuelve a pedir datos: sin esta segunda
      // espera la captura salia con la pestaña nueva a medio pintar (visto el 9-sep en «Recompensas»).
      if (t.listo2) {
        let ok2 = false;
        for (let i = 0; i < 60; i++) {
          const r = await c.enviar("Runtime.evaluate", { expression: t.listo2, returnByValue: true });
          if (r && r.result && r.result.value) { ok2 = true; break; }
          await dormir(1000);
        }
        if (!ok2) throw new Error("«" + t.nombre + "»: la pestaña no llego a pintarse (" + t.listo2 + ")");
      }
      if (t.scroll2) await c.enviar("Runtime.evaluate", { expression: t.scroll2, awaitPromise: true });
      await dormir(1500);
      const s = await c.enviar("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      const f = path.join(DESTINO, t.nombre);
      fs.writeFileSync(f, Buffer.from(s.data, "base64"));
      salida.push({ nombre: t.nombre, bytes: fs.statSync(f).size });
      c.ws.close();
      await fetch(`http://127.0.0.1:${PUERTO}/json/close/${target.id}`);
    }
  } finally {
    chrome.kill();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }
  console.log(JSON.stringify(salida));
})().catch(e => { console.error("ERROR " + e.message); process.exit(1); });
