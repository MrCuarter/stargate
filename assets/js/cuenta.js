/**
 * GAMIFICAPRO · CAMBIAR LA CUENTA DE GOOGLE CON QUE SE ENTRA (9-oct-2026) — pieza del motor para todos (los mods y la app).
 *
 * Norberto, del caso de «Ave fenix» (se alistó con su Gmail personal y quería entrar con el del máster): «a TODOS, a la app; lo
 * hace solo el estudiante, sin pasar por mí; cualquier Gmail». El servidor (`modCuenta`, functions/modCuenta.js) desengancha el
 * Google de siempre de SU cuenta y le engancha el nuevo: la ficha, el progreso y todo lo suyo no se mueven.
 *
 * Esta pieza es la ventana y los pasos del navegador:
 *   1. «Elegir la cuenta nueva»: la ventana de Google en una SEGUNDA app de Firebase (la sesión de la web no se toca). De ahí sale
 *      el token de la cuenta nueva, que demuestra al servidor que también es suya. Esa segunda sesión se cierra enseguida.
 *   2. El servidor cuenta qué pasará (`mirar`): si la nueva no tiene nada, se cambia; si solo tiene fichas recién alistadas, se
 *      juntan; si tiene progreso, se para (o, si el progreso está solo allí, le dice que entre con ella).
 *   3. «Cambiar»: si no ha entrado hace poco, antes confirma su cuenta de siempre (reauthenticateWithPopup). Hecho, la web recarga:
 *      ya entra con el Google nuevo.
 * Cada ventana de Google se abre en el mismo clic que la pide (si no, el navegador la bloquea).
 *
 * Sin textos ni colores de ningún mod: los textos son neutros y cada web puede cambiarlos (`textos`); la piel, en variables
 * `--gpc-*` y en las clases de botón de la web (`clases`). Ventana como la de «Leer más…» (CLAUDE.md, norma del 6-oct): velo, ×
 * y Esc; pulsar dentro no la cierra; en el móvil ocupa la pantalla. Cada web la copia en su build (`guardas.copiar_pieza`, como
 * desliza.js) y NO se edita allí: aquí. La app la importa tal cual (src/lib/cambiarCuenta.ts).
 *
 *   var C = GP.cuenta.crear({
 *     firebase: { initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signOut, reauthenticateWithPopup,
 *                 connectAuthEmulator, signInWithCredential, deleteApp },   // las de la web (las dos últimas, opcionales)
 *     app, auth,                      // los de la web: de `app.options` sale la configuración de la segunda app
 *     llamar,                         // (nombre, datos) → data (GP_SDK.llamador, o el de la web)
 *     emu: "http://127.0.0.1:9099",   // solo en el laboratorio: el emulador de Auth (y entonces `comoEnElLaboratorio`)
 *     textos: { … }, clases: { boton: "btn", secundario: "btn ghost" }, alTerminar: function () { location.reload(); },
 *   });
 *   C.abrir()                         → abre la ventana (en el clic de un botón «Cambiar el correo con el que entro»)
 *   C.mirar(token) / C.cambiar(token) → lo del servidor, sin ventana
 *   C.otraCuenta()                    → { token, correo } de la cuenta que elija en Google (segunda app)
 *   C.comoEnElLaboratorio(correo)     → lo mismo sin ventana de Google (solo con `emu`)
 * Prueba: tests/sdk/cuenta.test.ts. Cómo se ve, en cada web (tanda de móviles).
 */
(function (raiz, fabrica) {
  var hecho = fabrica();
  if (typeof module === "object" && module.exports) module.exports = hecho;
  if (raiz) { raiz.GP = raiz.GP || {}; if (!raiz.GP.cuenta) raiz.GP.cuenta = hecho; }
})(typeof window !== "undefined" ? window : null, function () {
  var TEXTOS = {
    boton: "Cambiar el correo con el que entro",
    titulo: "Cambiar la cuenta con la que entras",
    ahora: "Ahora entras con {correo}.",
    explica: "Elige la cuenta de Google con la que quieres entrar a partir de ahora. Tu progreso no se toca: sigue siendo tuyo.",
    elegir: "Elegir la cuenta nueva",
    mirando: "Comprobando la cuenta nueva…",
    listo: "A partir de ahora entrarás con {nuevo}. Con {correo} ya no verás tu progreso.",
    juntar: "Esa cuenta ya tenía algo, sin progreso. Se junta con la tuya:",
    mover: "{alias} en {grupo}: pasa a tu cuenta.",
    quitar: "{alias} en {grupo}: estaba repetida y se quita.",
    cambiar: "Cambiar",
    confirmarYCambiar: "Confirmar mi cuenta y cambiar",
    confirmaExplica: "Por seguridad, Google te pedirá antes tu cuenta de siempre ({correo}).",
    cambiando: "Cambiando…",
    hecho: "¡Hecho! Desde ahora entras con {nuevo}.",
    entendido: "Entendido",
    otraTieneProgreso: "Tu progreso está en {nuevo} ({grupos}). No hace falta cambiar nada: cierra la sesión y entra con esa cuenta.",
    cerrar: "Cerrar",
    otra: "Elegir otra",
    error: "No se ha podido hacer. Vuelve a intentarlo dentro de un momento.",
  };
  var CANCELADO = /popup-closed-by-user|cancelled-popup-request|user-cancelled/;
  var CSS = ""
    + ".gpc-velo{position:fixed;inset:0;z-index:var(--gpc-capa,70);background:var(--gpc-velo,rgba(0,0,0,.6));display:flex;"
    +   "align-items:flex-start;justify-content:center;padding:var(--gpc-arriba,24px) 16px;overflow-y:auto;box-sizing:border-box}"
    + ".gpc-ventana{position:relative;width:100%;max-width:var(--gpc-ancho,520px);box-sizing:border-box;padding:22px 20px 20px;"
    +   "background:var(--gpc-fondo,#fff);color:var(--gpc-tinta,#1b1b1b);border:1px solid var(--gpc-borde,rgba(0,0,0,.15));"
    +   "border-radius:var(--gpc-radio,14px);box-shadow:var(--gpc-sombra,0 20px 60px rgba(0,0,0,.4));font:inherit;line-height:1.45}"
    + ".gpc-ventana h2{margin:0 36px 10px 0;font-size:1.2em;line-height:1.25;overflow-wrap:anywhere}"
    + ".gpc-ventana p,.gpc-ventana li{margin:0 0 10px;overflow-wrap:anywhere}"
    + ".gpc-ventana ul{margin:0 0 12px;padding-left:20px}"
    + ".gpc-cerrar{position:absolute;top:10px;right:10px;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:22px;line-height:1;"
    +   "background:var(--gpc-cerrar-fondo,transparent);color:inherit;border:1px solid var(--gpc-borde,rgba(0,0,0,.2))}"
    + ".gpc-botones{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}"
    + ".gpc-b{min-height:44px;min-width:0;max-width:100%;white-space:normal;cursor:pointer}"
    + ".gpc-boton{padding:10px 16px;border-radius:10px;border:0;font:inherit;font-weight:600;background:var(--gpc-acento,#1d4ed8);color:var(--gpc-acento-tinta,#fff)}"
    + ".gpc-secundario{padding:10px 16px;border-radius:10px;font:inherit;background:transparent;color:inherit;border:1px solid var(--gpc-borde,rgba(0,0,0,.25))}"
    + ".gpc-aviso{padding:10px 12px;border-radius:10px;background:var(--gpc-aviso-fondo,rgba(220,38,38,.1));color:var(--gpc-aviso-tinta,inherit)}"
    + ".gpc-boton[disabled],.gpc-secundario[disabled]{opacity:.6;cursor:default}"
    + "@media (max-width:600px){.gpc-velo{padding:0}.gpc-ventana{max-width:none;min-height:100%;min-height:100dvh;border-radius:0;border:0;"
    +   "padding:20px 16px calc(20px + env(safe-area-inset-bottom))}}";

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  };
  /** «{correo}» → el valor, escapado. */
  function poner(t, v) { return String(t).replace(/\{(\w+)\}/g, function (m, k) { return v && k in v ? "<b>" + esc(v[k]) + "</b>" : m; }); }

  /**
   * Lo que se enseña para un plan del servidor (puro): → { texto: [html…], lista: [html…], pie: [html…], principal: { texto, confirmar } | null }
   * (la lista de lo que se junta va justo detrás de «se junta con la tuya»; el aviso de confirmar, después).
   * `reciente`: ha entrado hace poco (no hará falta confirmar).
   */
  function pantallaDelPlan(plan, T, reciente) {
    var v = { correo: plan.correoAhora, nuevo: plan.correoNuevo, grupos: (plan.grupos || []).join(", ") };
    if (plan.estado === "entra-con-la-otra") return { texto: [poner(T.otraTieneProgreso, v)], lista: [], pie: [], principal: null };
    if (plan.estado !== "listo") return { texto: [esc(plan.texto || T.error)], lista: [], pie: [], principal: null, aviso: true };
    var lista = (plan.mover || []).map(function (f) { return poner(T.mover, f); })
      .concat((plan.quitar || []).map(function (f) { return poner(T.quitar, f); }));
    var texto = [poner(T.listo, v)];
    if (lista.length) texto.push(esc(T.juntar));
    return { texto: texto, lista: lista, pie: reciente ? [] : [poner(T.confirmaExplica, v)], principal: { texto: reciente ? T.cambiar : T.confirmarYCambiar, confirmar: !reciente } };
  }

  function crear(o) {
    o = o || {};
    var fb = o.firebase || {};
    ["initializeApp", "getAuth", "GoogleAuthProvider", "signInWithPopup", "signOut", "reauthenticateWithPopup"].forEach(function (n) {
      if (!fb[n]) throw new Error("GP.cuenta: falta firebase." + n);
    });
    if (!o.auth || !o.app || typeof o.llamar !== "function") throw new Error("GP.cuenta: faltan app, auth o llamar");
    var T = Object.assign({}, TEXTOS, o.textos || {});
    var clases = Object.assign({ boton: "", secundario: "" }, o.clases || {});
    var minutos = Number(o.minutos) || 10;
    var google = function () { var g = new fb.GoogleAuthProvider(); g.setCustomParameters({ prompt: "select_account" }); return g; };
    var n = 0;

    /** Una segunda app de Firebase, con su Auth (y el emulador, si toca): la sesión de la web no se entera. */
    function segunda() {
      var app2 = fb.initializeApp(o.app.options, "gp-otra-cuenta-" + Date.now() + "-" + (n++));
      var auth2 = fb.getAuth(app2);
      if (o.emu) fb.connectAuthEmulator(auth2, String(o.emu), { disableWarnings: true });
      return { app2: app2, auth2: auth2 };
    }
    async function conLaSegunda(entrar) {
      var s = segunda();
      try {
        var u = await entrar(s.auth2);
        return { token: await u.getIdToken(), correo: String(u.email || "").toLowerCase() };
      } finally {
        try { await fb.signOut(s.auth2); } catch (e) { /* ya cerrada */ }
        if (fb.deleteApp) { try { await fb.deleteApp(s.app2); } catch (e) { /* ya borrada */ } }
      }
    }
    function otraCuenta() { return conLaSegunda(function (a) { return fb.signInWithPopup(a, google()).then(function (r) { return r.user; }); }); }
    function comoEnElLaboratorio(correo) {
      if (!o.emu || !fb.signInWithCredential) throw new Error("GP.cuenta: solo en el laboratorio");
      var sub = "emu-" + String(correo).toLowerCase().replace(/[^a-z0-9]/g, "");
      return conLaSegunda(function (a) {
        return fb.signInWithCredential(a, fb.GoogleAuthProvider.credential(JSON.stringify({ sub: sub, email: correo, email_verified: true, name: correo })))
          .then(function (r) { return r.user; });
      });
    }
    /** ¿Ha entrado (o confirmado) hace poco? (lo mismo que mira el servidor, con un minuto de margen) */
    async function reciente() {
      var u = o.auth.currentUser; if (!u) return false;
      try { var r = await u.getIdTokenResult(); return Date.now() - new Date(r.authTime).getTime() < (minutos - 1) * 60 * 1000; }
      catch (e) { return false; }
    }
    async function confirmar() { await fb.reauthenticateWithPopup(o.auth.currentUser, google()); await o.auth.currentUser.getIdToken(true); }
    var mirar = function (token) { return o.llamar("modCuenta", { accion: "mirar", token: token }).then(function (r) { return r.plan; }); };
    var cambiar = function (token) { return o.llamar("modCuenta", { accion: "cambiar", token: token }); };

    // ─── la ventana ───
    var velo = null, alSoltar = null;
    function estilo() {
      if (typeof document === "undefined" || document.getElementById("gpc-estilo")) return;
      var s = document.createElement("style"); s.id = "gpc-estilo"; s.textContent = CSS; document.head.appendChild(s);
    }
    function cerrarVentana() {
      if (!velo) return;
      velo.remove();
      velo = null;
      if (alSoltar) { document.removeEventListener("keydown", alSoltar); alSoltar = null; }
    }
    function boton(texto, clase, extra) { return '<button type="button" class="gpc-b ' + clase + " " + esc(extra) + '">' + esc(texto) + "</button>"; }
    /** Pinta una pantalla: { texto: [html], lista: [html], aviso, botones: [{ texto, principal, hacer }] }. */
    function pintar(p) {
      var v = velo.querySelector(".gpc-cuerpo");
      v.innerHTML = (p.texto || []).map(function (t) { return "<p" + (p.aviso ? ' class="gpc-aviso"' : "") + ">" + t + "</p>"; }).join("")
        + ((p.lista || []).length ? "<ul>" + p.lista.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ul>" : "")
        + (p.pie || []).map(function (t) { return "<p>" + t + "</p>"; }).join("")
        + '<div class="gpc-botones">' + (p.botones || []).map(function (b) {
          return boton(b.texto, b.principal ? "gpc-boton" : "gpc-secundario", b.principal ? clases.boton : clases.secundario);
        }).join("") + "</div>";
      var bs = v.querySelectorAll(".gpc-b");
      (p.botones || []).forEach(function (b, i) {
        bs[i].addEventListener("click", function () { b.hacer(bs[i]); });
      });
    }
    function ocupado(texto) { pintar({ texto: [esc(texto)], botones: [] }); }
    function fallo(e, volver) {
      if (CANCELADO.test(String((e && e.code) || ""))) { volver(); return; }
      var m = e && e.delServidor !== false && e.message && !/^(internal|INTERNAL)$/.test(e.message) && !/^Firebase:/.test(e.message) ? e.message : T.error;
      pintar({ texto: [esc(m)], aviso: true, botones: [{ texto: T.otra, principal: true, hacer: function () { elegir(); } }, { texto: T.cerrar, hacer: cerrarVentana }] });
    }
    function inicio() {
      var u = o.auth.currentUser;
      pintar({ texto: [poner(T.ahora, { correo: (u && u.email) || "" }), esc(T.explica)],
        botones: [{ texto: T.elegir, principal: true, hacer: function () { elegir(); } }, { texto: T.cerrar, hacer: cerrarVentana }] });
    }
    // 🔴 La ventana de Google se abre dentro del clic: nada de esperas antes de signInWithPopup
    function elegir(como) {
      var p = como ? comoEnElLaboratorio(como) : otraCuenta();
      ocupado(T.mirando);
      p.then(function (nueva) {
        return Promise.all([mirar(nueva.token), reciente()]).then(function (r) { verPlan(nueva, r[0], r[1]); });
      }).catch(function (e) { fallo(e, inicio); });
    }
    function verPlan(nueva, plan, esReciente) {
      var P = pantallaDelPlan(plan, T, esReciente);
      var botones = [];
      if (P.principal) {
        botones.push({ texto: P.principal.texto, principal: true, hacer: function () {
          var antes = P.principal.confirmar ? confirmar() : Promise.resolve();   // (la de Google, en este mismo clic)
          antes.then(function () { ocupado(T.cambiando); return cambiar(nueva.token); })
            .then(function () { return o.auth.currentUser ? o.auth.currentUser.getIdToken(true) : null; })
            .then(function () { terminado(plan); })
            .catch(function (e) { fallo(e, function () { verPlan(nueva, plan, esReciente); }); });
        } });
      }
      botones.push({ texto: P.principal ? T.otra : T.cerrar, hacer: P.principal ? function () { elegir(); } : cerrarVentana });
      if (P.principal) botones.push({ texto: T.cerrar, hacer: cerrarVentana });
      pintar({ texto: P.texto, lista: P.lista, pie: P.pie, aviso: P.aviso, botones: botones });
    }
    function terminado(plan) {
      pintar({ texto: [poner(T.hecho, { nuevo: plan.correoNuevo })], botones: [{ texto: T.entendido, principal: true, hacer: function () {
        cerrarVentana(); if (typeof o.alTerminar === "function") o.alTerminar(); else if (typeof location !== "undefined") location.reload();
      } }] });
    }
    function abrir() {
      estilo(); cerrarVentana();
      velo = document.createElement("div");
      velo.className = "gpc-velo";
      velo.innerHTML = '<div class="gpc-ventana" role="dialog" aria-modal="true" aria-labelledby="gpc-titulo">'
        + '<button type="button" class="gpc-cerrar" aria-label="' + esc(T.cerrar) + '">×</button>'
        + '<h2 id="gpc-titulo">' + esc(T.titulo) + '</h2><div class="gpc-cuerpo"></div></div>';
      // pulsar el velo cierra; pulsar dentro, no
      velo.addEventListener("click", function (ev) { if (ev.target === velo) cerrarVentana(); });
      velo.querySelector(".gpc-cerrar").addEventListener("click", cerrarVentana);
      alSoltar = function (ev) { if (ev.key === "Escape") cerrarVentana(); };
      document.addEventListener("keydown", alSoltar);
      document.body.appendChild(velo);
      inicio();
      return { elegir: elegir, cerrar: cerrarVentana };
    }

    return { abrir: abrir, cerrar: cerrarVentana, mirar: mirar, cambiar: cambiar, otraCuenta: otraCuenta,
             comoEnElLaboratorio: comoEnElLaboratorio, confirmar: confirmar, reciente: reciente, textos: T };
  }

  return { crear: crear, pantallaDelPlan: pantallaDelPlan, TEXTOS: TEXTOS, CSS: CSS };
});
