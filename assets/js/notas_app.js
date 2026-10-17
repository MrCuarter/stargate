/* STARGATE · LAS NOTAS DE LA SESIÓN, FUERA DE LO QUE SE PROYECTA — notas.html?per=<grupo>[&ventana=1] · 17-oct-2026
 *
 * Norberto: el docente comparte su pantalla en clase, así que la nota de cada diapositiva va en otra ventana (la que no comparte) o en
 * su móvil o su iPad. La vista es del motor (assets/js/notas.js = GamificaPro sdk/notas.js, la misma de DPG; no se edita aquí): esto
 * solo es la puerta.
 *   · &ventana=1 · la abre la sesión («Notas en otra ventana»): sigue la diapositiva por el mismo navegador, sin servidor.
 *   · sin ella · el QR de «Notas en el móvil»: entra con tu cuenta y escucha mod_notas/{grupo}, que solo deja leer al equipo docente del
 *     grupo (firestore.rules). El alumnado, nunca.
 */
(function () {
  "use strict";
  var app = document.getElementById("notas-app"), q = new URLSearchParams(location.search);
  var PER = q.get("per") || "", VENTANA = q.get("ventana") === "1", V = null;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var N = window.GP && window.GP.notas;
  if (!N) { app.innerHTML = '<p style="padding:16px">Falta la pieza de las notas: vuelve a cargar la página.</p>'; return; }
  function vista() {
    if (V) V.destruir();
    app.innerHTML = '<div id="nt-vista"></div>';
    V = N.vista(document.getElementById("nt-vista"), { per: PER, ventana: VENTANA });
    return V;
  }
  vista();
  if (!PER || PER === "demo") return;   // (la sesión de ensayo: solo la ventana del mismo navegador)
  function puerta(aviso) {
    if (V) { V.destruir(); V = null; }
    app.innerHTML = '<div class="card" style="max-width:460px;margin:24px auto"><div class="kicker">Solo el equipo docente</div><h2>Las notas de la sesión</h2>' +
      "<p>Entra con tu cuenta de <b>docente de este grupo</b>: verás la nota de cada diapositiva mientras das la clase.</p>" +
      (aviso ? '<p class="small" style="color:#ff9a8a">' + esc(aviso) + "</p>" : "") +
      '<p><button type="button" class="btn primary" id="nt-entrar">Iniciar sesión con Google</button></p></div>';
    document.getElementById("nt-entrar").onclick = function () {
      var b = this; b.disabled = true;
      window.SG.MOTOR.entrar().then(function () { vista(); arrancar(); }, function (e) {
        b.disabled = false; if (/popup-closed|cancelled-popup/.test(String((e && (e.code || e.message)) || ""))) return;
        puerta("No se ha podido entrar: " + String((e && e.message) || e));
      });
    };
  }
  function arrancar() {
    var M = window.SG && window.SG.MOTOR;
    if (!M) { document.addEventListener("sg:motor", arrancar, { once: true }); return; }
    M.sesion().then(function (yo) {
      if (yo) { (V || vista()).nube(); return; }
      if (!VENTANA) puerta();   // (la ventana sigue por el mismo navegador; con sesión, también por la nube)
    });
  }
  arrancar();
})();
