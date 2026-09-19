/**
 * STARGATE · LA INVITACIÓN DE PROFE REFERENTE — invitacion.html?t=<clave> · 15-sep-2026
 *
 * Norberto: «no sé con qué email iniciarán sesión, ¿podrías autodetectarlo y convertirlas en referentes?».
 * Por el nombre no (cualquiera se lo pone en Google): con este enlace de un solo uso. Quien lo abre entra con
 * la cuenta de Google que vaya a usar y ESA cuenta queda como referente (motor.js → canjearInvitacion; las
 * reglas lo atan en una sola escritura). Un vitalicio que lo abre para probarlo no lo gasta.
 */
(function () {
  "use strict";
  var app = document.getElementById("inv-app");
  if (!app) return;
  var T = new URLSearchParams(location.search).get("t") || "";
  var MOTOR = null;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function caja(h) {
    app.innerHTML = '<div class="inv-caja"><img class="inv-cap" src="assets/img/capitan/saluda.png" alt=""><div class="inv-txt">' + h + "</div></div>";
  }
  function puerta(err) {
    caja('<div class="kicker">STARGATE · Invitación</div><h2>Te esperamos en el puente</h2>'
      + '<p class="sub">Norberto te invita a STARGATE como <b>profe referente</b>: podrás crear grupos, llevar su equipo docente y todo lo del proyecto. '
      + 'Entra con la cuenta de Google que vayas a usar en STARGATE: <b>esa cuenta</b> quedará como referente.</p>'
      + '<p><button class="btn primary grande btn-google" id="inv-entrar">' + ((window.SG && window.SG.LOGO_G) || "") + "<span>Entrar con Google y aceptar</span></button></p>"
      + (err ? '<p class="malo">' + esc(err) + "</p>" : ""));
    document.getElementById("inv-entrar").onclick = function () {
      MOTOR.entrar().then(function () { arrancar(); }).catch(function (e) { puerta("No he podido entrar: " + ((e && e.message) || e)); });
    };
  }
  function listo(yo, r) {
    caja('<div class="kicker"><img class=ico src=assets/img/iconos/p/hecho.png alt> Invitación aceptada</div><h2>¡Bienvenida al puente, Comandante!</h2>'
      + '<p class="sub">La cuenta <b>' + esc(yo.correo) + "</b> ya es profe referente de STARGATE" + (r.ya ? " (ya la habías aceptado)" : "") + ".</p>"
      + '<div class="inv-botones"><a class="btn primary grande" href="consola.html"><img class=ico src=assets/img/iconos/p/ajustes.png alt> Ir a Mis grupos</a>'
      + '<a class="btn" href="crear.html"><img class=ico src=assets/img/iconos/p/estrella.png alt> Crear un grupo</a><a class="btn" href="prueba-equipo.html"><img class=ico src=assets/img/iconos/p/brujula.png alt> La guía de prueba</a></div>'
      + '<p class="small muted">Norberto puede añadirte a un grupo que ya existe; mientras, puedes crear el tuyo.</p>');
  }
  function malo(tipo, yo) {
    var titulo = tipo === "usada" ? "Esta invitación ya se ha usado con otra cuenta"
      : tipo === "caducada" ? "Esta invitación ha caducado" : "No encuentro esta invitación";
    caja('<div class="kicker">STARGATE · Invitación</div><h2>' + titulo + "</h2>"
      + '<p class="sub">Pide a Norberto un enlace nuevo. Si ya la aceptaste con otra cuenta, entra con esa' + (yo ? " (ahora estás con <b>" + esc(yo.correo) + "</b>)" : "") + ".</p>"
      + '<p class="inv-botones"><a class="btn" href="entrar.html">Entrar en STARGATE</a>'
      + (yo ? '<button class="btn min" id="inv-otra" type="button">Probar con otra cuenta</button>' : "") + "</p>");
    var o = document.getElementById("inv-otra");
    if (o) o.onclick = function () { MOTOR.salir().then(function () { puerta(); }); };
  }
  function arrancar() {
    MOTOR = window.SG.MOTOR;
    if (!T) return malo("no-existe");
    caja('<p class="muted">Abriendo tu invitación…</p>');
    MOTOR.sesion().then(function (yo) {
      if (!yo) return puerta();
      // un vitalicio (Norberto probando el enlace) no la gasta: es para otra persona
      if ((MOTOR.VITALICIOS || []).indexOf(String(yo.correo || "").toLowerCase()) >= 0) {
        return MOTOR.leerInvitacion(T).then(function (inv) {
          caja('<div class="kicker">STARGATE · Invitación</div><h2>Esta invitación es para otra persona</h2>'
            + '<p class="sub">Estás con <b>' + esc(yo.correo) + "</b>, que ya lo puede todo, así que no la gasto."
            + (inv ? " Es para <b>" + esc(inv.nombre || "—") + "</b> y está " + (inv.usadoPor ? "usada por <b>" + esc(inv.usadoCorreo || "") + "</b>" : "sin usar") + "." : " No la encuentro.") + "</p>"
            + '<p class="inv-botones"><a class="btn" href="profesores.html"><img class=ico src=assets/img/iconos/p/gente.png alt> Ir a Profesores</a></p>');
        });
      }
      return MOTOR.canjearInvitacion(T).then(function (r) { if (r && r.ok) listo(yo, r); else malo(r && r.error, yo); });
    }).catch(function (e) { caja('<p class="malo">No he podido abrir la invitación: ' + esc((e && e.message) || e) + "</p>"); });
  }
  if (window.SG && window.SG.MOTOR) arrancar(); else document.addEventListener("sg:motor", arrancar);
})();
