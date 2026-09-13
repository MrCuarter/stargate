'use strict';
/**
 * BATERÍA 70 · LA VENTANA DE GOOGLE TERMINA DE VERDAD.
 *
 * 🔴🔴 13-sep · EL FALLO MÁS CARO DEL PROYECTO, Y NO LO VIO NINGUNA PRUEBA. El 12-sep se cambió el
 * `authDomain` a `gamificapro.mistercuarter.es` para que Google no escribiera un nombre feo. Se
 * «comprobó con curl: 200». Pero esa dirección está en Hostinger, y una web de una sola página
 * contesta 200 a CUALQUIER ruta: en /__/auth/handler servía la app de GamificaPro, no el ayudante de
 * Google. La ventana de «Iniciar sesión con Google» se abría y NUNCA terminaba. Nadie nuevo podía
 * entrar; solo quien ya tenía la sesión guardada. Y el laboratorio no lo podía ver: allí la sesión se
 * abre por detrás, con los emuladores.
 *
 * Así que esto mira el CONTENIDO, no el código de estado: el ayudante de Firebase carga `handler.js`.
 * Sin red, avisa y no da por buena ni por mala la comprobación.
 */
const fs = require("fs"), path = require("path"), https = require("https");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const cfg = JSON.parse(fs.readFileSync(path.join(RAIZ, "assets/js/firebase_config.json"), "utf8"));
const dom = cfg.authDomain;
c(!!dom, "firebase_config.json tiene authDomain");
// el HTML publicado lleva el MISMO authDomain que el fichero (el generador lo copia de ahí)
["entrar.html", "recluta.html", "consola.html", "alistarse.html"].forEach(f => {
  const h = fs.readFileSync(path.join(RAIZ, f), "utf8");
  c(h.indexOf('"authDomain": "' + dom + '"') >= 0, f + " publica el authDomain de firebase_config.json");
});
function traer(url) {
  return new Promise(res => {
    const r = https.get(url, { timeout: 12000 }, x => { let b = ""; x.on("data", d => b += d); x.on("end", () => res({ codigo: x.statusCode, cuerpo: b })); });
    r.on("error", e => res({ error: e.message })); r.on("timeout", () => { r.destroy(); res({ error: "tiempo" }); });
  });
}
(async () => {
  const r = await traer("https://" + dom + "/__/auth/handler");
  if (r.error) {
    console.log("   ⚠️ sin red: no he podido comprobar el ayudante de Google (" + r.error + ")");
  } else {
    c(/handler\.js/.test(r.cuerpo) && !/<div id="root">/.test(r.cuerpo),
      "🔴 https://" + dom + "/__/auth/handler es el ayudante de Google (carga handler.js), no otra web",
      "contesta " + r.codigo + " con: " + r.cuerpo.replace(/\s+/g, " ").slice(0, 120));
    const i = await traer("https://" + dom + "/__/auth/iframe");
    c(!i.error && /iframe\.js|gapi/.test(i.cuerpo), "   y /__/auth/iframe también es el suyo", i.error || i.cuerpo.replace(/\s+/g, " ").slice(0, 100));
  }
  console.log("\n  Batería 70 · la ventana de Google termina de verdad");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
})();
