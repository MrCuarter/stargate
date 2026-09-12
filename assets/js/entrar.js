/**
 * STARGATE — LA PUERTA ÚNICA.
 *
 * 🔴 12-sep · Lo zanjó Norberto después de estrellarse en el primer clic: «dejar stargate con la
 * demo, rollo presentación del proyecto, lo que quiero que vea el público. Después botón de iniciar
 * sesión con Google y ya detecta si es docente, estudiante o referente».
 *
 * Tenía razón por una razón que va más allá de la comodidad. Antes la portada bifurcaba —«Soy
 * estudiante» / «Soy docente»— y eso obliga a la persona a acertar ANTES de que el sistema sepa
 * quién es. Quien elegía mal acababa en la mitad equivocada de la web, y el propio Norberto acabó
 * en la guía buscando un botón de sesión que estaba en otra página y bajo el pliegue. Una puerta que
 * pregunta «¿quién eres?» a quien viene a decírselo es una puerta mal puesta.
 *
 * Ahora se entra primero y se pregunta después: Google dice quién eres y el SERVIDOR dice qué eres.
 *
 *   1 · ¿Llevas algún grupo?            → docente (o referente) → tu puesto de mando
 *   2 · ¿Tienes ficha en algún grupo?   → estudiante            → tu Nave
 *   3 · Ni una cosa ni otra             → el código de clase, y con él te alistas
 *
 * El orden importa y no es alfabético: un referente que además da clase es las dos cosas, y un
 * docente puede tener ficha de alumno en un grupo de prácticas. Se mira primero lo que manda.
 *
 * 🔴 EL CÓDIGO DE CLASE ES LA PUERTA DE SEGURIDAD, y por eso está en el paso 3 y no en el 1: solo lo
 * teclea quien el sistema no conoce. A un docente y a un estudiante ya alistado no se les pide nada
 * —sería pedirle la llave a quien ya está dentro—.
 */
(function () {
  var app = document.getElementById("entrar-app");
  if (!app) return;
  var url = new URLSearchParams(location.search);
  var MOTOR = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /**
   * 🔴 A DÓNDE SE PUEDE VOLVER. `volver` llega por la URL, así que es texto de fuera: sin este
   * filtro, `entrar.html?volver=https://otrositio` convertiría nuestra propia puerta en un trampolín
   * para mandar a alguien a cualquier parte justo después de que teclee su contraseña en Google —que
   * es el peor momento posible para no saber dónde estás—. Solo un nombre de página de aquí.
   */
  function destinoSeguro(v) {
    return (v && /^[a-z0-9_-]+\.html$/i.test(v)) ? v : "";
  }

  function ir(donde) { location.replace(donde); }

  function tarjeta(html) { app.innerHTML = '<div class="card puerta-unica">' + html + "</div>"; }

  function cargando(t, sub) {
    tarjeta('<h3>' + esc(t) + "</h3>" + (sub ? '<p class="small muted">' + esc(sub) + "</p>" : "") +
            '<div class="barra-indef" aria-hidden="true"><i></i></div>');
  }

  // ---------------------------------------------------------------- 1 · el botón
  function puerta(aviso) {
    var LOGO_G = (window.SG && window.SG.LOGO_G) || "";
    tarjeta(
      '<div class="eyebrow teal">Acceso</div>' +
      "<h3>Entra en STARGATE</h3>" +
      '<p class="small muted">Un solo botón para todo el mundo. Al entrar, el sistema reconoce solo ' +
      "si eres <b>estudiante</b> o <b>docente</b> y te lleva a tu sitio. No hay ningún PIN.</p>" +
      (aviso ? '<p class="puerta-mal">' + aviso + "</p>" : "") +
      '<p><button class="btn primary grande btn-google" id="e-google">' + LOGO_G +
      "<span>Iniciar sesión con Google</span></button></p>" +
      '<p class="small muted puerta-tranquilo">Te llevará a la pantalla de Google. Tu contraseña se ' +
      "escribe allí, nunca aquí.</p>"
    );
    var b = document.getElementById("e-google");
    b.onclick = function () {
      b.disabled = true;
      MOTOR.entrar().then(repartir).catch(function (e) {
        // 🔴 Cerrar la ventana de Google NO es un error que haya que gritar: es lo más normal del
        // mundo (te has equivocado de cuenta, te lo has pensado). Se vuelve a la puerta y ya está.
        if (/popup-closed|cancelled-popup|popup-blocked/i.test(e.code || e.message || "")) return puerta("");
        puerta("No se ha podido entrar: " + esc(e.message || e.code || "inténtalo otra vez"));
      });
    };
    b.focus();
  }

  // ---------------------------------------------------------------- 2 · quién eres
  function repartir() {
    cargando("Comprobando quién eres…", "Un momento");
    MOTOR.sesion().then(function (yo) {
      if (!yo) return puerta("");
      var vuelta = destinoSeguro(url.get("volver"));

      return MOTOR.misPERs(yo.correo).then(function (ps) {
        if (ps && ps.length) {
          // 🔴 La marca que abre el material del profesorado. La pone el motor al confirmar que esa
          // cuenta lleva grupos, y aquí se pone también: si no, quien entra por esta puerta y va a
          // la guía se topa OTRA VEZ con la puerta del material, después de haber entrado. Entrar
          // dos veces en la misma casa es exactamente el callejón sin salida que estamos matando.
          try { localStorage.setItem("sgEsDocente", "1"); } catch (e) {}
          return ir(vuelta || "consola.html");
        }
        return MOTOR.misGruposDeAlumno(yo.uid).then(function (gs) {
          if (gs && gs.length) return ir(vuelta || "recluta.html");
          return pedirCodigo(yo, "");
        });
      });
    }).catch(function (e) {
      puerta("No se ha podido comprobar: " + esc(e.message || "inténtalo otra vez"));
    });
  }

  // ---------------------------------------------------------------- 3 · el código de clase
  function pedirCodigo(yo, aviso) {
    tarjeta(
      '<div class="eyebrow amber">Última puerta</div>' +
      "<h3>¿Cuál es tu clase?</h3>" +
      '<p class="small muted">Has entrado como <b>' + esc(yo.correo) + "</b>, pero todavía no estás " +
      "en ningún grupo. Escribe el <b>código de clase</b> que te ha dado tu docente.</p>" +
      (aviso ? '<p class="puerta-mal">' + aviso + "</p>" : "") +
      '<p><input id="e-cod" class="cod-grande" maxlength="10" autocomplete="off" spellcheck="false" ' +
      'placeholder="A1B2C3" aria-label="Código de clase"></p>' +
      '<p><button class="btn primary grande" id="e-cod-ok">Continuar</button></p>' +
      '<p class="small muted">¿No tienes código? Tu docente lo reparte en clase — también sirve el ' +
      "enlace de alistamiento que os haya pasado.</p>" +
      '<p class="small muted"><a href="#" id="e-otra">Entrar con otra cuenta</a></p>'
    );
    var i = document.getElementById("e-cod"), b = document.getElementById("e-cod-ok");

    // que se escriba en mayúsculas aunque se teclee en minúsculas: el código vive en mayúsculas y
    // ver «a1b2c3» en la caja mientras el sistema busca «A1B2C3» hace dudar a cualquiera
    i.addEventListener("input", function () {
      var p = i.selectionStart; i.value = i.value.toUpperCase(); i.setSelectionRange(p, p);
    });
    i.addEventListener("keydown", function (e) { if (e.key === "Enter") b.click(); });

    b.onclick = function () {
      var c = (i.value || "").trim().toUpperCase();
      if (!c) { i.focus(); return; }
      b.disabled = true; b.textContent = "Buscando…";
      MOTOR.grupoPorCodigo(c).then(function (g) {
        if (!g) return pedirCodigo(yo, "No hay ninguna clase con ese código. Míralo otra vez: se confunden el <b>0</b> y la <b>O</b>.");
        ir("alistarse.html?per=" + encodeURIComponent(g.id) + "&codigo=" + encodeURIComponent(c));
      }).catch(function (e) {
        pedirCodigo(yo, "No se ha podido comprobar: " + esc(e.message || "inténtalo otra vez"));
      });
    };
    document.getElementById("e-otra").onclick = function (ev) {
      ev.preventDefault();
      MOTOR.salir().then(function () { puerta(""); }).catch(function () { puerta(""); });
    };
    i.focus();
  }

  // ---------------------------------------------------------------- arranque
  function arrancar() {
    MOTOR = window.SG && window.SG.MOTOR;
    if (!MOTOR) { document.addEventListener("sg:motor", arrancar, { once: true }); return; }
    cargando("Abriendo…", "Comprobando si ya has entrado");
    MOTOR.sesion().then(function (yo) { yo ? repartir() : puerta(""); })
                  .catch(function () { puerta(""); });
  }
  arrancar();
})();
