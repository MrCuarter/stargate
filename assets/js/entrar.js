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
    /**
     * Un nombre de página de AQUÍ, con su consulta si la traía. Lo que el filtro deja fuera importa
     * más que lo que deja pasar: nada de barras (que abrirían `//otrositio.com`, una URL absoluta
     * disfrazada), nada de dos puntos (que abrirían `javascript:` o `https:`) y nada de almohadilla.
     * Si no encaja entero, se ignora y se va al sitio por defecto — nunca se intenta arreglar una
     * dirección sospechosa, que es como se cuelan.
     */
    return (v && /^[a-z0-9_-]+\.html(\?[a-z0-9_=&%.\-]*)?$/i.test(v)) ? v : "";
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
  // 🔴 Una sola vez. Se puede llegar aquí por dos caminos a la vez —el botón y el aviso de sesión— y
  // repartir dos veces es mandar a la persona a un sitio y, medio segundo después, a otro.
  var repartiendo = false;
  function repartir() {
    if (repartiendo) return;
    repartiendo = true;
    cargando("Comprobando quién eres…", "Un momento");
    MOTOR.sesion().then(function (yo) {
      if (!yo) { repartiendo = false; return puerta(""); }
      /**
       * 🔴 `volver` ES COSA DEL PROFESORADO, Y SOLO SUYA. Lo pone `puerta.js`, que vive únicamente
       * en el material docente. Si se le hiciera caso también al alumnado se montaría un BUCLE
       * CERRADO: un estudiante que abre `guia.html` —porque alguien le pasó el enlace— ve la puerta,
       * pulsa, llega aquí con `?volver=guia.html`, se le devuelve a la guía… que vuelve a enseñarle
       * la puerta, porque sigue sin ser docente. Y así para siempre, sin un solo error en consola.
       * Es exactamente el callejón sin salida que esta reforma vino a matar, y casi lo reintroduzco
       * yo al escribirla.
       */
      var vuelta = destinoSeguro(url.get("volver"));

      /**
       * 🔴 LAS DOS PREGUNTAS A LA VEZ, Y NO UNA DETRÁS DE OTRA. Antes se miraba primero si llevabas
       * grupos y, solo si no, si tenías ficha de alumno: quien era las dos cosas nunca podía entrar
       * como alumno. Y el alumnado iba a `recluta.html` A SECAS, sin su grupo — y la Nave sin grupo
       * dice «te falta el enlace de tu clase». Norberto lo vivió con la cuenta más poderosa del
       * sistema: «¡soy el referente con todos los poderes y no puedo ni entrar!».
       *
       * Ahora se pregunta todo de una vez y se reparte así:
       *   · solo docente               → su puesto de mando (o a donde iba, si venía de una puerta);
       *   · solo alumno, de UN grupo   → la Nave DE ESE GRUPO, con `?per=` puesto;
       *   · cualquier otra combinación → se le pregunta cómo quiere entrar hoy. Es lo que él pidió:
       *     «has sido detectado como estudiante de X y docente. ¿Cómo quieres entrar?».
       *   · nada                       → el código de clase.
       */
      return Promise.all([MOTOR.misPERs(yo.correo), MOTOR.misGruposDeAlumno(yo.uid)]).then(function (res) {
        var ps = res[0] || [], gs = res[1] || [];
        if (ps.length) {
          // 🔴 La marca que abre el material del profesorado. La pone el motor al confirmar que esa
          // cuenta lleva grupos, y aquí se pone también: si no, quien entra por esta puerta y va a
          // la guía se topa OTRA VEZ con la puerta del material, después de haber entrado.
          try { localStorage.setItem("sgEsDocente", "1"); } catch (e) {}
        }
        if (ps.length && !gs.length) return ir(vuelta || "consola.html");
        if (!ps.length && gs.length === 1) return ir("recluta.html?per=" + encodeURIComponent(gs[0].per));
        if (ps.length || gs.length) return elegir(yo, ps, gs, vuelta);
        return pedirCodigo(yo, "");
      });
    }).catch(function (e) {
      repartiendo = false;
      puerta("No se ha podido comprobar: " + esc(e.message || "inténtalo otra vez"));
    });
  }

  // ---------------------------------------------------------------- 2bis · ¿cómo entras hoy?
  /**
   * Para quien el sistema reconoce de más de una forma: docente y alumno, o alumno de varios grupos.
   * No se adivina: se pregunta, con los nombres de sus grupos a la vista. Un botón por camino.
   */
  function elegir(yo, ps, gs, vuelta) {
    var nombreDe = function (id) {
      var p = ps.filter(function (x) { return x.id === id; })[0];
      return (p && p.nombre) || id;
    };
    tarjeta(
      '<div class="eyebrow teal">Te conozco de más de un sitio</div>' +
      "<h3>¿Cómo entras hoy?</h3>" +
      '<p class="small muted">Has entrado como <b>' + esc(yo.correo) + "</b>.</p>" +
      '<div class="elegir-camino">' +
      (ps.length
        ? '<a class="camino docente" href="' + esc(vuelta || "consola.html") + '"><span>🎓</span><b>Como docente</b>' +
          "<em>" + ps.length + (ps.length === 1 ? " grupo: " : " grupos: ") +
          esc(ps.slice(0, 3).map(function (p) { return p.nombre; }).join(" · ")) + (ps.length > 3 ? "…" : "") + "</em></a>"
        : "") +
      gs.map(function (g) {
        return '<a class="camino recluta" href="recluta.html?per=' + encodeURIComponent(g.per) + '"><span>🚀</span>' +
               "<b>Como recluta</b><em>" + esc(g.nombreGrupo || nombreDe(g.per)) + "</em></a>";
      }).join("") +
      "</div>" +
      '<p class="small muted"><a href="#" id="e-otra">Entrar con otra cuenta</a></p>'
    );
    document.getElementById("e-otra").onclick = function (ev) {
      ev.preventDefault();
      repartiendo = false;
      MOTOR.salir().then(function () { puerta(""); }).catch(function () { puerta(""); });
    };
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
    /**
     * 🔴 Y SI LA SESIÓN LLEGA POR OTRO CAMINO, TAMBIÉN. Antes solo se repartía al volver del botón
     * propio. Pero la sesión puede aparecer de otras formas: la persona entra en otra pestaña con
     * la puerta abierta en esta, la ventana de Google tarda más que la promesa, o el navegador
     * restaura una sesión guardada un instante tarde. En todos esos casos la puerta se quedaba
     * enseñando «Iniciar sesión» a alguien que YA había entrado. Lo encontró el laboratorio.
     */
    document.addEventListener("sg:sesion", function (e) { if (e.detail) repartir(); });
  }
  arrancar();
})();
