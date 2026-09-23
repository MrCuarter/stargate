/**
 * STARGATE — EL DOSSIER DE LA PORTADA (23-sep-2026).
 *
 * 🔴 Norberto: «en la página principal, sin iniciar sesión, solo un dossier, sencillo, visual, sobre STARGATE… quizá
 * puedas mostrarlo en modo presentación». Las diapositivas son secciones normales del HTML (sin JavaScript se leen de
 * arriba abajo, y los buscadores ven todo); la hoja de estilos las pone a pantalla completa con scroll-snap, así que en
 * el móvil se pasan deslizando. Esto solo añade lo de una presentación:
 *   · las flechas del teclado (y Avance Página, espacio, Inicio y Fin) pasan de diapositiva;
 *   · los puntos de la derecha dicen dónde estás y saltan a cualquiera; y la cuenta «3 / 11»;
 *   · «Pantalla completa», sin la barra de arriba ni el pie;
 *   · y si ya has entrado alguna vez en este navegador, el botón de Google dice «Ir a mi Nave» (lleva al mismo sitio:
 *     `entrar.html` reconoce la cuenta y reparte).
 */
(function () {
  "use strict";
  var raiz = document.getElementById("dossier");
  if (!raiz) return;
  var dias = Array.prototype.slice.call(raiz.querySelectorAll(".dz"));
  var puntos = Array.prototype.slice.call(document.querySelectorAll(".dz-puntos a"));
  var cuenta = document.getElementById("dz-cuenta");
  var actual = 0;
  document.documentElement.classList.add("con-dossier");

  function marcar(i) {
    actual = i;
    puntos.forEach(function (p, k) { p.classList.toggle("on", k === i); if (k === i) p.setAttribute("aria-current", "true"); else p.removeAttribute("aria-current"); });
    if (cuenta) cuenta.textContent = (i + 1) + " / " + dias.length;
  }
  function ir(i) {
    i = Math.max(0, Math.min(dias.length - 1, i));
    var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    dias[i].scrollIntoView({ behavior: quieto ? "auto" : "smooth", block: "start" });
    marcar(i);
  }
  // cuál se ve: la que ocupa más pantalla
  if ("IntersectionObserver" in window) {
    var vis = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vis[dias.indexOf(e.target)] = e.intersectionRatio; });
      var mejor = 0, r = -1;
      Object.keys(vis).forEach(function (k) { if (vis[k] > r) { r = vis[k]; mejor = Number(k); } });
      if (mejor !== actual) marcar(mejor);
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    dias.forEach(function (d) { io.observe(d); });
  }
  puntos.forEach(function (p, k) { p.addEventListener("click", function (e) { e.preventDefault(); ir(k); }); });
  var baja = raiz.querySelector(".dz-baja");
  if (baja) baja.addEventListener("click", function (e) { e.preventDefault(); ir(1); });

  document.addEventListener("keydown", function (e) {
    var t = (e.target || {}).tagName || "";
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t) || e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key;
    if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === " ") { e.preventDefault(); ir(actual + 1); }
    else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp") { e.preventDefault(); ir(actual - 1); }
    else if (k === "Home") { e.preventDefault(); ir(0); }
    else if (k === "End") { e.preventDefault(); ir(dias.length - 1); }
  });

  var pc = document.getElementById("dz-pantalla");
  function enPantalla() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function rotular() { if (pc) pc.textContent = enPantalla() ? "Salir de pantalla completa" : "Pantalla completa"; }
  if (pc) {
    if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) pc.hidden = true;
    pc.addEventListener("click", function () {
      var h = document.documentElement;
      if (enPantalla()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      (h.requestFullscreen || h.webkitRequestFullscreen).call(h);
      setTimeout(function () { ir(actual); }, 300);
    });
    document.addEventListener("fullscreenchange", function () { rotular(); setTimeout(function () { ir(actual); }, 200); });
  }

  // quien ya ha entrado en este navegador: el mismo botón, con su nombre de verdad
  try {
    if (localStorage.getItem("sgEsDocente") === "1" || localStorage.getItem("sgEsRecluta") === "1") {
      Array.prototype.forEach.call(document.querySelectorAll("[data-dz-entrar] span"), function (s) { s.textContent = "Ir a mi Nave"; });
    }
  } catch (e) {}
  marcar(0);
})();
