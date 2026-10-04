/**
 * STARGATE · EN CLARO (4-oct). La página la escribe _build_site.py con los textos y las cifras del motor; esto solo:
 *   · 🔴 lo de REFERENTES, solo para referentes. Norberto: «si un docente inicia sesión y NO está marcado como referente, no quiero
 *     ni que vea la opción». El interruptor «Docentes / Referentes» nace oculto y solo se enciende si esta cuenta es referente
 *     (`sgEsReferente`, que pone el motor, o `soyReferente` de alguno de sus grupos). Para un docente, ?vista=ref o un enlace
 *     a una duda de referentes no hacen nada. Al referente se le abre su vista (la de docentes + lo suyo) y se recuerda.
 *   · las dudas están plegadas: un enlace #ancla (los del buzón y la biblia) la abre y la marca.
 *   · la barra «Tu grupo»: su grupo, desde cuándo cuentan los retos y «Copiar la invitación» (el mismo enlace que la consola:
 *     MOTOR.invitacion). Sin cuenta o sin grupos, no sale. Los botones a la consola y a la sesión llevan su grupo (?per=).
 */
(function () {
  "use strict";
  var raiz = document.getElementById("ec"); if (!raiz) return;
  var q = new URLSearchParams(location.search), GRUPOS = [], G = null, MOTOR = null, REF = false;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var botones = raiz.querySelector(".ec-vista");

  // ── docentes / referentes
  function vista(v, recordar) {
    if (!REF) v = "doc";
    raiz.setAttribute("data-vista", v);
    Array.prototype.forEach.call(raiz.querySelectorAll(".ec-vista button"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-vista") === v)); });
    if (recordar) guardar("sgClaroVista", v);
  }
  function soyReferente() {
    REF = true; if (botones) botones.hidden = false;
    var f = q.get("vista");
    vista(f === "ref" || f === "doc" ? f : (leer("sgClaroVista") || "ref"));
  }
  Array.prototype.forEach.call(raiz.querySelectorAll(".ec-vista button"), function (b) {
    b.onclick = function () { vista(b.getAttribute("data-vista"), true); };
  });
  if (leer("sgEsReferente") === "1") soyReferente(); else vista("doc");

  // ── un enlace a una duda la abre
  function alAncla() {
    var id = (location.hash || "").slice(1), el = id && document.getElementById(id);
    if (!el || !el.classList.contains("ec-duda")) return;
    if (el.getAttribute("data-solo") === "ref") { if (!REF) return; if (raiz.getAttribute("data-vista") !== "ref") vista("ref"); }
    Array.prototype.forEach.call(raiz.querySelectorAll(".ec-duda.foco"), function (x) { x.classList.remove("foco"); });
    el.open = true; el.classList.add("foco");
    setTimeout(function () { el.scrollIntoView({ block: "start" }); }, 0);
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
    if (!S.inicio) return "Tu grupo aún no tiene fecha de inicio.";
    var f = fin(S, g.total);
    if (g.semana == null || g.semana < 1) return "Empieza el <b>" + esc(dia(S.inicio)) + "</b>: desde ese día cuentan los retos" + (f ? ", hasta el " + esc(dia(f)) : "") + ".";
    if (g.semana <= g.total) return "Semana <b>" + g.semana + " de " + g.total + "</b>" + (f ? " · los retos cuentan hasta el <b>" + esc(dia(f)) + "</b>" : "") + ".";
    return "El curso de tu grupo ha terminado.";
  }

  // ── la barra «Tu grupo»
  function pintar() {
    var caja = document.getElementById("ec-grupo"); if (!caja || !G) return;
    var otros = GRUPOS.length > 1 ? '<label class="ec-otro"><span>Otro grupo</span><select id="ec-sel">' + GRUPOS.map(function (g) {
      return '<option value="' + esc(g.id) + '"' + (g.id === G.id ? " selected" : "") + ">" + esc(g.nombre || g.id) + "</option>"; }).join("") + "</select></label>" : "";
    caja.innerHTML = '<img class="ec-grupo-i" src="assets/img/iconos/calendario.png" alt="">'
      + '<span>Tu grupo: <b>' + esc(G.nombre || G.id) + '</b></span>'
      + '<span class="ec-cuando">' + cuando(G) + '</span>'
      + '<span class="ec-grupo-der">' + (G.codigo ? '<button type="button" class="btn primary ec-btn" data-ec-inv><img class=ico src=assets/img/iconos/p/enlace.png alt> Copiar la invitación</button>' : "") + otros + "</span>";
    caja.hidden = false;
    var sel = document.getElementById("ec-sel");
    if (sel) sel.onchange = function () { G = GRUPOS.filter(function (g) { return g.id === sel.value; })[0] || G; guardar("sgClaroGrupo", G.id); pintar(); };
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-ec-tuyo="cuando"]'), function (p) { p.innerHTML = "En <b>" + esc(G.nombre || G.id) + "</b>: " + cuando(G); p.hidden = false; });
    Array.prototype.forEach.call(raiz.querySelectorAll("a[data-ec-per]"), function (a) {
      var u = new URL(a.getAttribute("href"), location.href); u.searchParams.set("per", G.id); a.href = u.pathname.replace(/^\//, "") + u.search + u.hash;
    });
  }
  // «Copiar la invitación»: el mismo enlace que la consola. Sin grupo, lleva a tu panel, donde está.
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
        // el motor ya ha escrito sgEsReferente (también el referente sin grupos todavía)
        var ref = leer("sgEsReferente") === "1" || (ps || []).some(function (g) { return g.soyReferente; });
        if (ref && !REF) { soyReferente(); alAncla(); }
        else if (!ref && REF) { REF = false; if (botones) botones.hidden = true; vista("doc"); }   // la marca era de otra cuenta
        GRUPOS = (ps || []).filter(function (g) { return g.estado !== "pasado" && g.id !== window.SG_PER_ACADEMIA; });
        if (!GRUPOS.length) return;
        var g0 = leer("sgClaroGrupo");
        G = GRUPOS.filter(function (g) { return g.id === g0; })[0] || GRUPOS[0];
        pintar();
      });
    }).catch(function () {});
  }
  if (window.SG && window.SG.MOTOR) listo(); else document.addEventListener("sg:motor", listo);
})();
