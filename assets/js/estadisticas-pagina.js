/**
 * 13-oct · ESTADÍSTICAS (estadisticas.html). Norberto: «desde mi cuenta debo tener un botón de Estadísticas y desde allí poder ver la
 * info total de todo STARGATE, filtrar por grupos, escuadrones, rango de fechas, retos…». La página entera es del motor
 * (assets/js/estadisticas.js = GamificaPro sdk/estadisticas.js, no se edita aquí); esto solo es la puerta: entrar con Google y
 * preguntar al servidor si puedes verla (`modEstadisticas`, accion «puedo»; hoy, solo Norberto).
 */
(function () {
  "use strict";
  var app = document.getElementById("es-app");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function arrancar() {
    var MOTOR = window.SG.MOTOR;
    app.innerHTML = '<p class="muted">Comprobando quién eres…</p>';
    MOTOR.sesion().then(function (yo) {
      if (!yo) {
        app.innerHTML = '<div class="card"><h2>Esta página es del Mando</h2><p>Entra con tu cuenta.</p><p><button class="btn primary btn-google" id="es-entrar">'
          + ((window.SG && window.SG.LOGO_G) || "") + '<span>Iniciar sesión con Google</span></button></p></div>';
        document.getElementById("es-entrar").onclick = function () { MOTOR.entrar().then(arrancar); };
        return;
      }
      return window.GP.estadisticas.puedo(MOTOR.llamar, "stargate").then(function (si) {
        if (!si) {
          app.innerHTML = '<div class="card"><h2>Esta página es del Mando</h2><p>Con <b>' + esc(yo.correo) + '</b> no se puede ver. Lo tuyo está en <a href="consola.html">tu Nave</a>.</p></div>';
          return;
        }
        window.GP.estadisticas.crear({ raiz: app, llamar: MOTOR.llamar, mod: "stargate" }).cargar();
      });
    }).catch(function (e) { app.innerHTML = '<p class="malo">No he podido abrir las estadísticas: ' + esc((e && e.message) || e) + '</p>'; });
  }
  if (window.SG && window.SG.MOTOR) arrancar(); else document.addEventListener("sg:motor", arrancar);
})();
