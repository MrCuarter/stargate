'use strict';
/**
 * ¿GOOGLE ACEPTA EL AYUDANTE DE stargate.mistercuarter.es?
 *   node motor/comprobar_ayudante_google.cjs [dominio]
 *
 * Abre el ayudante de Google alojado en ese dominio en un Chrome limpio, como lo abriría la
 * ventana de «Iniciar sesión con Google», y mira adónde llega:
 *   · a la pantalla de cuentas de Google        → ✓ se puede cambiar el authDomain a ese dominio
 *   · a «Error 400: redirect_uri_mismatch»      → ✗ falta añadir https://<dominio>/__/auth/handler
 *                                                 en el cliente OAuth de Google Cloud
 * No cambia nada: solo mira. Sin dependencias.
 */
const { spawn } = require("child_process"); const fs = require("fs"), os = require("os"), path = require("path");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DOM = process.argv[2] || "stargate.mistercuarter.es";
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets/js/firebase_config.json"), "utf8"));
const URLH = "https://" + DOM + "/__/auth/handler?apiKey=" + cfg.apiKey + "&appName=%5BDEFAULT%5D&authType=signInViaRedirect"
  + "&redirectUrl=" + encodeURIComponent("https://" + DOM + "/entrar.html") + "&v=12.1.0&providerId=google.com&scopes=profile";
const dormir = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "ayudante-"));
  const ch = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=9391", `--user-data-dir=${perfil}`, "about:blank"], { stdio: "ignore" });
  let salida = 2;
  try {
    let v; for (let i = 0; i < 60 && !v; i++) { try { v = await (await fetch("http://127.0.0.1:9391/json/version")).json(); } catch (e) {} if (!v) await dormir(300); }
    const ws = new WebSocket(v.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r));
    let id = 0; const pend = new Map();
    ws.addEventListener("message", ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const f = pend.get(m.id); pend.delete(m.id); f(m.result || m); } });
    const env = (method, params, sid) => new Promise(r => { const n = ++id; pend.set(n, r); const msg = { id: n, method, params: params || {} }; if (sid) msg.sessionId = sid; ws.send(JSON.stringify(msg)); });
    const { targetId } = await env("Target.createTarget", { url: URLH });
    const { sessionId } = await env("Target.attachToTarget", { targetId, flatten: true });
    let donde = "", texto = "";
    for (let k = 0; k < 30; k++) { await dormir(700);
      const r = await env("Runtime.evaluate", { expression: "JSON.stringify({u:location.href,t:(document.body&&document.body.innerText||'').slice(0,400)})", returnByValue: true }, sessionId);
      try { const o = JSON.parse(r.result.value); donde = o.u; texto = o.t; } catch (e) {}
      if (/accounts\.google\.com/.test(donde) && texto.length > 20) break; }
    // 🔴 La página de error de Google TAMBIÉN está en accounts.google.com: la primera versión de
    // esta comprobación dio un «✓» falso por mirar solo el dominio. El motivo va en `authError`,
    // en base64, y hay que leerlo.
    let motivo = "";
    try { const m = donde.match(/[?&]authError=([^&]+)/); if (m) motivo = Buffer.from(decodeURIComponent(m[1]).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("latin1"); } catch (e) {}
    const esError = /\/signin\/oauth\/error|redirect_uri_mismatch/i.test(donde + texto + motivo);
    if (esError && /redirect_uri_mismatch/i.test(motivo + texto + donde)) {
      console.log("✗ Google NO acepta todavía https://" + DOM + "/__/auth/handler (redirect_uri_mismatch).");
      console.log("  Falta añadirla en Google Cloud → APIs y servicios → Credenciales → cliente OAuth web → URIs de redireccionamiento autorizados.");
      salida = 1;
    } else if (esError) {
      console.log("✗ Google devuelve un error: " + (motivo.replace(/[^\x20-\x7e]+/g, " ").trim() || texto.replace(/\s+/g, " ").slice(0, 160)));
      salida = 1;
    } else if (/accounts\.google\.com/.test(donde)) {
      console.log("✓ Google acepta el ayudante de " + DOM + ": ya se puede cambiar el authDomain.");
      console.log("  (llega a: " + donde.slice(0, 90) + "…)");
      salida = 0;
    } else {
      console.log("? No he llegado a Google. Última página: " + donde.slice(0, 120) + "\n  " + texto.replace(/\s+/g, " ").slice(0, 200));
    }
  } catch (e) { console.log("la comprobación ha fallado:", e.message); }
  finally { try { ch.kill(); } catch (e) {} }
  process.exit(salida);
})();
