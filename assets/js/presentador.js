/**
 * GAMIFICAPRO · EL MODO PRESENTADOR (17-oct-2026) — pieza del motor para cualquier mod.
 *
 * Norberto (17-oct): «un botón “Presentar en otra ventana” abre la PRESENTACIÓN LIMPIA en una ventana emergente, que es la que se
 * comparte o se proyecta; la ventana principal se convierte en su CENTRO DE MANDO». Y al empezar la clase en directo, una pregunta
 * corta y visual, con dos tarjetas iguales: «Una pantalla · simple» (todo como hoy) y «Dos pantallas · presentador». Con «Recordar
 * mi elección» se recuerda en ese navegador; la primera vez, «simple» marcada. Debajo, en pequeño, para quien tiene una sola
 * pantalla y quiere el mando aparte: compartir solo la ventana de la presentación (tres pasos por plataforma) o el mando al móvil (QR).
 * Opcional y solo del docente: lo que ve el alumnado no cambia.
 *
 * La pieza no sabe nada de diapositivas: la web pone qué es «el estado» (el mismo que manda a su directo) y cómo se aplica.
 *
 *   GP.presentador.recordado(clave)         → "simple" | "presentador" | null (lo que eligió con «Recordar mi elección»).
 *   GP.presentador.recordar(clave, modo)    → lo guarda (null lo olvida).
 *   GP.presentador.canal(per)               → el nombre del BroadcastChannel del grupo.
 *   GP.presentador.elegir({ clave, marcado, pie, alElegir(modo), alAyuda() }) → la pregunta (encima, con velo; × y Esc = simple, sin
 *       recordar). `marcado`: la tarjeta que sale marcada (de serie, la recordada o "simple"). `alElegir` va dentro del clic: la web
 *       puede abrir ahí la emergente sin que el navegador la bloquee. `pie`: el texto del enlace a la ayuda (sin mando en el móvil,
 *       solo «Comparte solo la ventana de la presentación»).
 *   GP.presentador.ayuda({ nombre, url, QR, nota, alAbrir(), alEsta() }) → la ayuda corta: «Abrir la presentación», los tres pasos
 *       de Zoom, Meet y Teams (`nombre`: el título de la ventana que se elige) y, con `url`, el QR del mando para el móvil y «Esta
 *       pantalla, como presentación». Sin `url`, `nota` (por qué aquí no hay mando en el móvil).
 *   GP.presentador.abrir(url, nombre)       → la emergente (o null si el navegador la bloquea).
 *   GP.presentador.mando({ per, alCambiar(vivo), alTecla(key, shift), alPide() }) → { mandar(estado), acc(a), abierta(win), cerrar(),
 *       vivo(), destruir() }: en la ventana del docente. `vivo()`, si hay una presentación abierta (late cada 3 s; a los 9 s sin latido,
 *       o al momento si se despide, deja de contar). `alPide()`: la presentación acaba de abrir y pide el estado.
 *   GP.presentador.presentacion({ per, alEstado(e), alAcc(a) }) → { tecla(key, shift), destruir() }: en la emergente. Late, se despide
 *       al cerrarse y cierra la ventana si el mando lo pide.
 *
 * Cada web la copia en su build (assets/js/presentador.js) y NO se edita allí: aquí. La piel, con --gpp-* (valores por defecto abajo).
 * Lo prueba tests/sdk/presentador.test.ts.
 */
(function (raiz, fabrica) {
  var P = fabrica(raiz);
  if (typeof module === "object" && module.exports) module.exports = P;
  if (raiz) { raiz.GP = raiz.GP || {}; if (!raiz.GP.presentador) raiz.GP.presentador = P; }
})(typeof window !== "undefined" ? window : null, function (W) {
  "use strict";
  var MODOS = { simple: 1, presentador: 1 };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function guardado(k, v) {
    try { if (v === undefined) return W.localStorage.getItem(k); if (v === null) W.localStorage.removeItem(k); else W.localStorage.setItem(k, v); } catch (e) { /* sin almacén */ }
    return null;
  }
  function llave(clave) { return "gpPresentador:" + String(clave || ""); }
  function recordado(clave) { var v = guardado(llave(clave)); return MODOS[v] ? v : null; }
  function recordar(clave, modo) { guardado(llave(clave), MODOS[modo] ? modo : null); }
  function canal(per) { return "gp-pres:" + String(per || "demo"); }
  function nuevoCanal(per) { try { return W && W.BroadcastChannel ? new W.BroadcastChannel(canal(per)) : null; } catch (e) { return null; } }
  function abrir(url, nombre) {
    var w = null;
    try { w = W.open(url, "gppres_" + String(nombre || "").replace(/\W/g, "_"), "popup=yes,width=1280,height=760"); } catch (e) { w = null; }
    if (w) try { w.focus(); } catch (e) { /* nada */ }
    return w || null;
  }

  // ── en la ventana del docente: manda el estado y sabe si la presentación sigue abierta
  function mando(o) {
    o = o || {};
    var bc = nuevoCanal(o.per), win = null, latido = 0, on = false, vigia = null;
    function vivoAhora() { return (!!win && !win.closed) || Date.now() - latido < 9000; }
    function mirar() { var v = vivoAhora(); if (v !== on) { on = v; if (!on) win = null; if (typeof o.alCambiar === "function") o.alCambiar(on); } }
    if (bc) bc.onmessage = function (ev) {
      var m = ev && ev.data; if (!m) return;
      if (m.tipo === "hola") { latido = Date.now(); mirar(); if (typeof o.alPide === "function") o.alPide(); }
      else if (m.tipo === "adios") { latido = 0; setTimeout(mirar, 60); }
      else if (m.tipo === "tecla" && on && typeof o.alTecla === "function") o.alTecla(String(m.key || ""), !!m.shift);
    };
    vigia = setInterval(mirar, 2000);
    function post(m) { if (bc) try { bc.postMessage(m); } catch (e) { /* nada */ } }
    return {
      mandar: function (estado) { if (on && estado) post({ tipo: "estado", e: estado }); },
      acc: function (a) { post({ tipo: "acc", a: String(a || "") }); },
      abierta: function (w) { win = w || null; mirar(); },
      cerrar: function () { post({ tipo: "cierra" }); try { if (win) win.close(); } catch (e) { /* nada */ } win = null; latido = 0; mirar(); },
      vivo: function () { return on; },
      destruir: function () { clearInterval(vigia); if (bc) try { bc.close(); } catch (e) { /* nada */ } },
    };
  }

  // ── en la emergente: sigue al mando
  function presentacion(o) {
    o = o || {};
    var bc = nuevoCanal(o.per), latir = null;
    function post(m) { if (bc) try { bc.postMessage(m); } catch (e) { /* nada */ } }
    if (bc) bc.onmessage = function (ev) {
      var m = ev && ev.data; if (!m) return;
      if (m.tipo === "estado" && m.e && typeof o.alEstado === "function") o.alEstado(m.e);
      else if (m.tipo === "acc" && typeof o.alAcc === "function") o.alAcc(String(m.a || ""));
      else if (m.tipo === "cierra") try { W.close(); } catch (e) { /* nada */ }
    };
    var hola = function () { post({ tipo: "hola" }); };
    hola(); latir = setInterval(hola, 3000);
    var adios = function () { post({ tipo: "adios" }); };
    if (W && W.addEventListener) W.addEventListener("pagehide", adios);
    return {
      tecla: function (key, shift) { post({ tipo: "tecla", key: String(key || ""), shift: !!shift }); },
      destruir: function () { clearInterval(latir); adios(); if (W && W.removeEventListener) W.removeEventListener("pagehide", adios); if (bc) try { bc.close(); } catch (e) { /* nada */ } },
    };
  }

  // ── lo que se ve: la pregunta y la ayuda (encima de la página, con velo, × y Esc)
  var ICO_UNA = '<svg viewBox="0 0 64 40" aria-hidden="true"><rect x="10" y="4" width="44" height="28" rx="3"/><path d="M26 36h12M32 32v4"/></svg>';
  var ICO_DOS = '<svg viewBox="0 0 64 40" aria-hidden="true"><rect x="2" y="6" width="28" height="20" rx="2"/><rect x="34" y="6" width="28" height="20" rx="2"/><path d="M12 32h8M16 26v6M44 32h8M48 26v6"/></svg>';
  function ventana(html, etiqueta) {
    var doc = W.document; estilo(doc);
    var velo = doc.createElement("div"); velo.className = "gpp-velo";
    velo.innerHTML = '<div class="gpp" role="dialog" aria-modal="true" aria-label="' + esc(etiqueta) + '"><button type="button" class="gpp-x" aria-label="Cerrar">×</button>' + html + "</div>";
    var caja = velo.firstChild, alCerrar = null;
    function cerrar() { doc.removeEventListener("keydown", tecla, true); velo.remove(); if (alCerrar) alCerrar(); }
    function tecla(ev) { if (ev.key === "Escape") { ev.stopPropagation(); cerrar(); } }
    caja.querySelector(".gpp-x").onclick = cerrar;
    velo.addEventListener("click", function (ev) { if (ev.target === velo) cerrar(); });
    caja.addEventListener("keydown", function (ev) { if (ev.key !== "Escape") ev.stopPropagation(); });   // (las flechas no pasan de diapositiva detrás)
    doc.addEventListener("keydown", tecla, true);
    doc.body.appendChild(velo);
    return { caja: caja, cerrar: cerrar, alCerrar: function (f) { alCerrar = f; }, quitar: function () { alCerrar = null; cerrar(); } };
  }
  function elegir(o) {
    o = o || {};
    var marcado = MODOS[o.marcado] ? o.marcado : (recordado(o.clave) || "simple");
    var tarjeta = function (m, ico, t, sub, txt) {
      return '<button type="button" class="gpp-t" role="radio" data-m="' + m + '" aria-checked="' + (m === marcado) + '">' + ico +
        "<b>" + t + "</b><small>" + sub + "</small><span>" + txt + "</span></button>";
    };
    var v = ventana("<h2>¿Cómo das la clase?</h2>" +
      '<div class="gpp-op" role="radiogroup" aria-label="Una o dos pantallas">' +
      tarjeta("simple", ICO_UNA, "Una pantalla", "simple", "Todo como siempre, en esta ventana.") +
      tarjeta("presentador", ICO_DOS, "Dos pantallas", "presentador", "La presentación, en una ventana aparte para compartir o proyectar; tu centro de mando, en esta.") + "</div>" +
      '<label class="gpp-rec"><input type="checkbox"' + (recordado(o.clave) ? " checked" : "") + "> Recordar mi elección en este navegador</label>" +
      '<button type="button" class="gpp-b gpp-pri" data-ok>Empezar</button>' +
      '<p class="gpp-peq">¿Una pantalla y quieres el mando aparte? <button type="button" class="gpp-enlace" data-ayuda>' + esc(o.pie || "Comparte solo la ventana de la presentación o lleva el mando al móvil") + "</button></p>",
      "Una o dos pantallas");
    var caja = v.caja, elegido = false;
    v.alCerrar(function () { if (!elegido && typeof o.alElegir === "function") o.alElegir("simple", false); });
    caja.addEventListener("click", function (ev) {
      var t = ev.target.closest(".gpp-t");
      if (t) { marcado = t.getAttribute("data-m"); Array.prototype.forEach.call(caja.querySelectorAll(".gpp-t"), function (x) { x.setAttribute("aria-checked", String(x === t)); }); return; }
      if (ev.target.closest("[data-ok]")) {
        var rec = caja.querySelector(".gpp-rec input").checked;
        recordar(o.clave, rec ? marcado : null);
        elegido = true; v.quitar();
        if (typeof o.alElegir === "function") o.alElegir(marcado, rec);
        return;
      }
      if (ev.target.closest("[data-ayuda]")) { elegido = true; v.quitar(); if (typeof o.alAyuda === "function") o.alAyuda(); }
    });
    // (las flechas mueven entre las dos tarjetas, como un grupo de opciones)
    caja.addEventListener("keydown", function (ev) {
      if (!/^Arrow(Left|Right|Up|Down)$/.test(ev.key) || !ev.target.closest(".gpp-t")) return;
      ev.preventDefault(); var otra = caja.querySelector('.gpp-t[data-m="' + (marcado === "simple" ? "presentador" : "simple") + '"]'); otra.click(); otra.focus();
    });
    try { caja.querySelector('.gpp-t[aria-checked="true"]').focus(); } catch (e) { /* nada */ }
    return { cerrar: v.cerrar };
  }
  function ayuda(o) {
    o = o || {};
    var nombre = esc(o.nombre || "la presentación");
    var paso = function (t, l) { return "<div><b>" + t + "</b><ol>" + l.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ol></div>"; };
    var v = ventana("<h2>Presentar en otra ventana</h2><p>La diapositiva sola, en una ventana aparte: <b>esa es la que compartes o proyectas</b>. Esta se queda como tu mando, con la siguiente, tus notas y todas las herramientas; lo que hagas aquí sale al momento en la presentación y en los móviles.</p>" +
      '<button type="button" class="gpp-b gpp-pri" data-p="abrir">Abrir la presentación</button>' +
      '<h3>Con una sola pantalla: comparte solo esa ventana</h3><div class="gpp-pasos">' +
      paso("Zoom", ["Pulsa «Compartir pantalla».", "Elige la ventana «" + nombre + "», no la pantalla entera.", "Pulsa «Compartir»."]) +
      paso("Meet", ["Pulsa «Compartir pantalla».", "Elige «Una ventana» y, en la lista, «" + nombre + "».", "Pulsa «Compartir»."]) +
      paso("Teams", ["Pulsa «Compartir» (arriba).", "En «Ventana», elige «" + nombre + "».", "Para acabar, «Dejar de compartir»."]) + "</div>" +
      (o.url ? "<h3>O el mando en el móvil o el iPad</h3><p>Escanéalo y entra con tu cuenta de docente: el móvil será tu mando (la siguiente, tus notas y las flechas). Después, convierte esta pantalla en la presentación.</p>" +
        '<div class="gpp-qr"></div><div class="gpp-url"><input type="text" readonly aria-label="Enlace al mando"><button type="button" class="gpp-b" data-p="copiar">Copiar</button></div>' +
        '<button type="button" class="gpp-b" data-p="esta">Esta pantalla, como presentación</button>'
        : (o.nota ? '<p class="gpp-peq">' + esc(o.nota) + "</p>" : "")), "Presentar en otra ventana");
    var caja = v.caja;
    if (o.url) {
      caja.querySelector("input").value = String(o.url);
      if (typeof o.QR === "function") { try { new o.QR(caja.querySelector(".gpp-qr"), { text: String(o.url), width: 200, height: 200, correctLevel: o.QR.CorrectLevel ? o.QR.CorrectLevel.M : undefined }); } catch (e) { caja.querySelector(".gpp-qr").hidden = true; } }
      else caja.querySelector(".gpp-qr").hidden = true;
    }
    caja.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-p]"); if (!b) return; var a = b.getAttribute("data-p");
      if (a === "abrir") { if (typeof o.alAbrir !== "function" || o.alAbrir() !== false) v.cerrar(); }
      else if (a === "copiar") { var i = caja.querySelector("input"); i.select(); try { W.navigator.clipboard.writeText(i.value).then(function () { b.textContent = "Copiado"; }, function () {}); } catch (e) { /* nada */ } }
      else if (a === "esta" && typeof o.alEsta === "function") o.alEsta();
    });
    try { caja.querySelector('[data-p="abrir"]').focus(); } catch (e) { /* nada */ }
    return { cerrar: v.cerrar };
  }

  var CSS =
    ".gpp-velo{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".gpp{--gpp-fondo:#1b1712;--gpp-tinta:#f3ead8;--gpp-suave:#b9ab90;--gpp-acento:#e2b65c;--gpp-linea:rgba(255,255,255,.16);position:relative;width:min(640px,100%);max-height:calc(100dvh - 32px);overflow:auto;" +
    "background:var(--gpp-fondo);color:var(--gpp-tinta);border-radius:16px;padding:22px 20px;box-shadow:0 20px 60px rgba(0,0,0,.5);font-size:16px;line-height:1.45}" +
    ".gpp h2{margin:0 40px 12px 0;font-size:21px}.gpp h3{margin:16px 0 6px;font-size:15px}.gpp p{margin:0 0 10px;color:var(--gpp-suave)}.gpp p b{color:var(--gpp-tinta)}" +
    ".gpp-x{position:absolute;top:8px;right:8px;width:40px;height:40px;border:0;border-radius:50%;background:transparent;color:var(--gpp-tinta);font-size:26px;cursor:pointer}" +
    ".gpp-op{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:1fr;gap:12px}" +
    ".gpp-t{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;height:100%;padding:16px 12px;border-radius:14px;border:2px solid var(--gpp-linea);background:rgba(255,255,255,.03);color:var(--gpp-tinta);font:inherit;text-align:center;cursor:pointer}" +
    ".gpp-t svg{width:64px;height:40px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;color:var(--gpp-suave)}" +
    ".gpp-t b{font-size:17px}.gpp-t small{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--gpp-suave)}.gpp-t span{font-size:14px;color:var(--gpp-suave);overflow-wrap:anywhere}" +
    ".gpp-t[aria-checked=true]{border-color:var(--gpp-acento);background:rgba(226,182,92,.1)}.gpp-t[aria-checked=true] svg{color:var(--gpp-acento)}" +
    ".gpp-t:focus-visible,.gpp-b:focus-visible,.gpp-enlace:focus-visible{outline:3px solid var(--gpp-acento);outline-offset:2px}" +
    ".gpp-rec{display:flex;align-items:center;gap:10px;min-height:40px;margin:12px 0 4px;cursor:pointer;color:var(--gpp-suave)}.gpp-rec input{width:22px;height:22px;accent-color:var(--gpp-acento)}" +
    ".gpp button.gpp-b{min-height:40px;border-radius:10px;border:1px solid var(--gpp-acento);background:transparent;color:var(--gpp-tinta);padding:0 14px;font:inherit;font-size:15px;cursor:pointer}" +
    ".gpp button.gpp-b.gpp-pri{display:block;width:100%;min-height:48px;margin-top:8px;background:var(--gpp-acento);color:var(--gpp-fondo);font-weight:800;font-size:16px}" +
    ".gpp-peq{margin-top:12px!important;font-size:13px}.gpp-enlace{border:0;background:none;padding:0;min-height:40px;color:var(--gpp-tinta);font:inherit;text-decoration:underline;text-align:left;cursor:pointer}" +
    ".gpp-pasos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.gpp-pasos>div{min-width:0;border:1px solid var(--gpp-linea);border-radius:10px;padding:8px 10px}" +
    ".gpp-pasos ol{margin:4px 0 0;padding-left:18px;font-size:13px;line-height:1.4;color:var(--gpp-suave)}" +
    ".gpp-qr{background:#fff;border-radius:12px;padding:12px;width:224px;max-width:100%;margin:6px auto 12px;display:flex;justify-content:center}.gpp-qr img,.gpp-qr canvas{max-width:100%;height:auto}" +
    ".gpp-url{display:flex;gap:8px;margin-bottom:10px}.gpp-url input{flex:1;min-width:0;min-height:40px;border-radius:10px;border:1px solid var(--gpp-linea);background:rgba(0,0,0,.25);color:inherit;padding:0 10px;font:inherit;font-size:14px}" +
    "@media (max-width:640px){.gpp-pasos{grid-template-columns:1fr}}@media (max-width:379px){.gpp-op{grid-template-columns:1fr}.gpp{padding:18px 14px}}";
  function estilo(doc) {
    doc = doc || (W && W.document); if (!doc || doc.getElementById("gpp-css")) return;
    var s = doc.createElement("style"); s.id = "gpp-css"; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s);
  }

  return { recordado: recordado, recordar: recordar, canal: canal, abrir: abrir, mando: mando, presentacion: presentacion,
    elegir: elegir, ayuda: ayuda, estilo: estilo };
});
