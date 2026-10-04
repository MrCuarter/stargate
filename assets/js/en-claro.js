/**
 * STARGATE · EN CLARO (4-oct). La página la escribe _build_site.py con las preguntas y las cifras del motor; esto solo:
 *   · las DOS versiones (Norberto: «dos versiones»): «Para docentes» y «Para referentes». Arranca en la tuya (si eres referente
 *     de algún grupo, la de referentes), se recuerda en este navegador y se puede forzar con ?vista=doc|ref. Un #ancla de una
 *     pregunta de referentes abre su versión: el Mando puede enlazar cualquier respuesta sin pensar en quién la lee.
 *   · la barra «Tu grupo»: tu grupo, tu papel en él, desde cuándo cuentan los retos y «Copiar la invitación» (el mismo enlace
 *     que la consola: MOTOR.invitacion). Sin cuenta o sin grupos, no sale: la página se lee igual.
 *   · los botones a la consola y a la sesión llevan tu grupo (?per=) para abrir la pantalla exacta.
 */
(function () {
  "use strict";
  var raiz = document.getElementById("ec"); if (!raiz) return;
  var q = new URLSearchParams(location.search), GRUPOS = [], G = null, MOTOR = null;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var forzada = q.get("vista") === "ref" || q.get("vista") === "doc" ? q.get("vista") : null;

  // ── las dos versiones
  function vista(v, recordar) {
    raiz.setAttribute("data-vista", v);
    Array.prototype.forEach.call(raiz.querySelectorAll(".ec-vista button"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-vista") === v)); });
    if (recordar) guardar("sgClaroVista", v);
  }
  vista(forzada || leer("sgClaroVista") || (leer("sgEsReferente") === "1" ? "ref" : "doc"));
  Array.prototype.forEach.call(raiz.querySelectorAll(".ec-vista button"), function (b) {
    b.onclick = function () { vista(b.getAttribute("data-vista"), true); };
  });
  function alAncla() {
    var id = (location.hash || "").slice(1), el = id && document.getElementById(id);
    if (!el || !el.classList.contains("ec-qa")) return;
    if (el.getAttribute("data-solo") === "ref" && raiz.getAttribute("data-vista") !== "ref") { vista("ref"); el.scrollIntoView(); }
    Array.prototype.forEach.call(raiz.querySelectorAll(".ec-qa.foco"), function (x) { x.classList.remove("foco"); });
    el.classList.add("foco");
  }
  window.addEventListener("hashchange", alAncla); alAncla();

  // ── fechas: «lunes, 5 de octubre»
  function dia(iso) {
    if (!iso) return "";
    var d = new Date(String(iso).slice(0, 10) + "T12:00:00");
    return isNaN(d) ? "" : d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  }
  function fin(S, total) {
    var W = window.SGSEMANAS;
    return W && W.finDeSemana && S.inicio ? W.finDeSemana(S.inicio, total, S.pausas) : "";
  }
  function cuando(g) {
    var S = g.stargate || {};
    if (!S.inicio) return "Tu grupo aún no tiene fecha de inicio: la pone el referente en su calendario.";
    var f = fin(S, g.total);
    if (g.semana == null || g.semana < 1) return "Los retos cuentan desde el <b>" + esc(dia(S.inicio)) + "</b> (semana 1)" + (f ? "; el último día para registrarlos, el " + esc(dia(f)) : "") + ".";
    if (g.semana <= g.total) return "Semana <b>" + g.semana + " de " + g.total + "</b>: los retos cuentan" + (f ? " hasta el <b>" + esc(dia(f)) + "</b>" : "") + ".";
    return "El curso de tu grupo ha terminado: el registro de retos está cerrado.";
  }

  // ── la barra «Tu grupo»
  function pintar() {
    var caja = document.getElementById("ec-grupo"); if (!caja || !G) return;
    var otros = GRUPOS.length > 1 ? '<label class="ec-otro"><span>Otro grupo</span><select id="ec-sel">' + GRUPOS.map(function (g) {
      return '<option value="' + esc(g.id) + '"' + (g.id === G.id ? " selected" : "") + ">" + esc(g.nombre || g.id) + "</option>"; }).join("") + "</select></label>" : "";
    caja.innerHTML = '<img class="ec-grupo-i" src="assets/img/iconos/calendario.png" alt="">'
      + '<span>Tu grupo: <b>' + esc(G.nombre || G.id) + '</b></span>'
      + '<span class="ec-rol">' + (G.soyReferente ? "Eres referente" : "Eres docente") + '</span>'
      + '<span class="ec-cuando">' + cuando(G) + '</span>'
      + '<span class="ec-grupo-der">' + (G.codigo ? '<button type="button" class="btn primary ec-btn" data-ec-inv><img class=ico src=assets/img/iconos/p/enlace.png alt> Copiar la invitación</button>' : "") + otros + "</span>";
    caja.hidden = false;
    var sel = document.getElementById("ec-sel");
    if (sel) sel.onchange = function () { G = GRUPOS.filter(function (g) { return g.id === sel.value; })[0] || G; guardar("sgClaroGrupo", G.id); pintar(); };
    // lo de cada respuesta que depende de tu grupo
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-ec-tuyo="cuando"]'), function (p) { p.innerHTML = "En <b>" + esc(G.nombre || G.id) + "</b>: " + cuando(G); p.hidden = false; });
    // los botones a la consola y a la sesión, con tu grupo
    Array.prototype.forEach.call(raiz.querySelectorAll("a[data-ec-per]"), function (a) {
      var u = new URL(a.getAttribute("href"), location.href); u.searchParams.set("per", G.id); a.href = u.pathname.replace(/^\//, "") + u.search + u.hash;
    });
  }
  // «Copiar la invitación»: el mismo enlace que la consola. Sin grupo, lleva a tu Nave, donde está.
  raiz.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-ec-inv]"); if (!b) return;
    if (!G || !G.codigo || !MOTOR) { location.href = "consola.html"; return; }
    var txt = MOTOR.invitacion(G), antes = b.innerHTML;
    var hecho = function () { b.textContent = "✓ Copiada"; setTimeout(function () { b.innerHTML = antes; }, 2600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(hecho, function () { window.prompt("Copia la invitación:", txt); });
    else window.prompt("Copia la invitación:", txt);
  });

  function listo() {
    MOTOR = window.SG && window.SG.MOTOR; if (!MOTOR) return;
    MOTOR.sesion().then(function (yo) {
      if (!yo) return null;
      return MOTOR.misPERs(yo.correo).then(function (ps) {
        GRUPOS = (ps || []).filter(function (g) { return g.estado !== "pasado" && g.id !== window.SG_PER_ACADEMIA; });
        if (!GRUPOS.length) return;
        var g0 = leer("sgClaroGrupo");
        G = GRUPOS.filter(function (g) { return g.id === g0; })[0] || GRUPOS[0];
        if (!forzada && !leer("sgClaroVista")) vista(GRUPOS.some(function (g) { return g.soyReferente; }) ? "ref" : "doc");
        pintar(); alAncla();
      });
    }).catch(function () {});
  }
  if (window.SG && window.SG.MOTOR) listo(); else document.addEventListener("sg:motor", listo);
})();
