// STARGATE — EL HUEVO DE PASCUA · el escondite dentro de una presentación.  huevo.html?h=<id>
//
// 🔴 QUÉ RESUELVE, Y POR QUÉ NO ES UNA RECOMPENSA MÁS.
//
// Norberto quería esconder algo en cada Genially: «si el estudiante lo encuentra gana un sobre de
// cromos, un avatar o incluso una bolsa de dinero». Y preguntó la parte difícil: ¿una recompensa
// por presentación? ¿o una semanal, con el riesgo de que alguien reclame la misma cada semana sin
// encontrar el resto?
//
// Ninguna de las dos: el límite no va en el PREMIO, va en el ESCONDITE. Cada huevo tiene su id, el
// id viaja en el enlace, y el perfil guarda cuáles ha abierto ya. Así ocho presentaciones son ocho
// huevos con un solo catálogo de premios, y reclamar dos veces el mismo es imposible aunque el
// enlace circule por WhatsApp.
//
// 🔴 Y el GRUPO no va en el enlace. Uno solo por presentación, para todos los grupos y todos los
// años: se deduce de quién pulsa, igual que la llamada a filas y validar retos.
(function () {
  var app = document.getElementById("huevo-app");
  if (!app) return;
  // La misma razón que en el aula y la llamada: incrustado, fuera cabecera y pie.
  if (new URLSearchParams(location.search).get("embed") === "1") document.body.classList.add("embed");

  var url = new URLSearchParams(location.search);
  var HUEVO = (url.get("h") || url.get("huevo") || "").trim();
  var MOTOR = null, YO = null, PER = "", FICHA = "";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pinta(h) { app.innerHTML = h; }

  /** El sobre del misterio: lo que se ve ANTES de saber qué hay dentro. */
  function portada(sub, botón) {
    return '<div class="hv"><div class="hv-caja">'
      + '<div class="hv-icono">🥚</div>'
      + '<div class="eyebrow amber">Has encontrado algo</div>'
      + '<h2>Un escondite de la Tripulación Cero</h2>'
      + '<p class="hv-sub">' + sub + '</p>'
      + (botón || '') + '</div></div>';
  }

  function cargando(t) {
    pinta(portada(esc(t), '<div class="hv-cargando"><i></i></div>'));
  }

  // ---------------------------------------------------------------- la puerta
  /**
   * 🔴 La sesión se pide AQUÍ, no se manda a otra página. Quien encuentra esto está dentro de un
   * Genially, probablemente proyectado o en el móvil: sacarle a otra pestaña a identificarse y que
   * vuelva —si vuelve— es perder a la mitad justo en el momento de más ilusión.
   */
  function puerta() {
    pinta(portada(
      'Para quedártelo tengo que saber quién eres. Entra con <b>la misma cuenta</b> con la que te alistaste.',
      /**
       * 🔴 EL BOTÓN ÉPICO, PERO CON LA «G». Aquí hay dos peticiones de Norberto que parecían
       * pelearse: «este botón debe ser más épico» —es el momento del hallazgo, no un formulario— y
       * «usa el logo de Google, da más confianza». No se pelean: la forma épica es la emoción y la
       * «G» es la garantía de que la contraseña se teclea en Google. Sin la marca, un botón dorado
       * que pide entrar en medio de una presentación se parece demasiado a lo que no hay que pulsar.
       */
      '<button class="btn epico" id="hv-entrar"><span class="ep-luz"></span>'
      + '<span class="ep-g">' + ((window.SG && window.SG.LOGO_G) || '') + '</span>'
      + '<span class="ep-txt">Entrar con Google</span></button>'));
    document.getElementById("hv-entrar").onclick = function () {
      cargando("Abriendo…");
      MOTOR.entrar().then(mirar).catch(function (e) { fallo(e.message); });
    };
  }

  function fallo(msg) {
    pinta('<div class="hv"><div class="hv-caja mal"><div class="hv-icono">🥚</div>'
      + '<h2>No he podido dártelo</h2><p class="hv-sub">' + esc(msg) + '</p></div></div>');
  }

  // ---------------------------------------------------------------- el premio
  var NOMBRES = { sobre: "Un sobre de cromos", heroe: "Un héroe de la Rebelión", bolsa: "Una bolsa de créditos" };
  var ICONOS  = { sobre: "🃏", heroe: "🛡️", bolsa: "💰" };

  function reclamar() {
    cargando("Abriendo el escondite…");
    MOTOR.reclamarHuevo(PER, HUEVO, FICHA).then(function (r) {
      if (r.yaEra) {
        pinta('<div class="hv"><div class="hv-caja"><div class="hv-icono">✓</div>'
          + '<h2>Este ya lo tenías</h2>'
          + '<p class="hv-sub">Lo encontraste en otra ocasión. Hay más escondidos por ahí — uno en cada presentación.</p>'
          + botónNave() + '</div></div>');
        return;
      }
      premio(r);
    }).catch(function (e) { fallo(e.message || e); });
  }

  function botónNave() {
    return '<p class="hv-pie"><a class="btn" href="recluta.html?per=' + esc(PER)
      + '" target="_blank" rel="noopener">🚀 Ver mi Nave ↗</a></p>';
  }

  function premio(r) {
    var d = r.detalle || {}, t = r.premio;
    var que = t === "sobre" ? (d.cartas || []).map(function (c) { return c.nombre; }).join(" · ")
            : t === "heroe" ? (d.nombre || "")
            : t === "bolsa" ? "+" + (d.creditos || 0) + " ◈"
            : "";
    pinta('<div class="hv"><div class="hv-caja gana">'
      + '<div class="hv-icono grande">' + (ICONOS[t] || "🎁") + '</div>'
      + '<div class="eyebrow amber">Lo has encontrado</div>'
      + '<h2>' + esc(NOMBRES[t] || "Un premio") + '</h2>'
      + (que ? '<p class="hv-que">' + esc(que) + '</p>' : '')
      + '<p class="hv-sub">Ya está en tu cuenta. Hay uno escondido en cada presentación.</p>'
      + botónNave() + '</div></div>');
    confeti();
    try { if (window.SG && SG.FIESTA) SG.FIESTA.sonar("nivel"); } catch (e) {}
  }

  /** Confeti propio: esta página no carga fiesta.js y añadirla entera por los papelillos es peso. */
  function confeti() {
    try {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      var c = document.createElement("canvas");
      c.className = "hv-confeti";
      document.body.appendChild(c);
      var g = c.getContext("2d"), W = 0, H = 0;
      var medir = function () { W = c.width = innerWidth; H = c.height = innerHeight; };
      medir(); addEventListener("resize", medir);
      var COL = ["#37e0ec", "#ffd166", "#7ef0c8", "#ffffff", "#c79be6"], P = [];
      for (var i = 0; i < 120; i++)
        P.push({ x: Math.random() * W, y: -20 - Math.random() * H * .6,
                 vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3.4,
                 w: 5 + Math.random() * 7, h: 8 + Math.random() * 9,
                 a: Math.random() * Math.PI, va: (Math.random() - .5) * .24,
                 col: COL[(Math.random() * COL.length) | 0] });
      var t0 = performance.now();
      (function paso(t) {
        var vida = t - t0; g.clearRect(0, 0, W, H); var vivas = 0;
        P.forEach(function (p) {
          p.x += p.vx; p.y += p.vy; p.a += p.va; p.vy += .03;
          if (p.y < H + 40) vivas++;
          g.save(); g.translate(p.x, p.y); g.rotate(p.a);
          g.globalAlpha = Math.max(0, 1 - vida / 4600);
          g.fillStyle = p.col; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
        });
        if (vivas && vida < 4600) requestAnimationFrame(paso);
        else { removeEventListener("resize", medir); c.remove(); }
      })(t0);
    } catch (e) {}
  }

  // ---------------------------------------------------------------- arranque
  function mirar(u) {
    YO = u;
    if (!YO) return puerta();
    cargando("Buscando tu ficha…");
    /**
     * 🔴 Se busca en QUÉ grupo está esta persona, no se pide en el enlace. Un estudiante pertenece
     * a uno; si por lo que sea estuviera en dos, se coge el que tenga este escondite configurado.
     */
    MOTOR.misGruposDeAlumno(YO.uid).then(function (fichas) {
      if (!fichas.length) return fallo("No estás alistado en ningún grupo todavía. Alístate primero con el enlace de tu clase.");
      var elegido = fichas[0];
      PER = elegido.per; FICHA = elegido.ficha;
      pinta(portada(
        'Hay algo aquí para ti. Púlsalo y es tuyo — <b>solo se puede una vez</b> por escondite.',
        '<button class="btn epico" id="hv-abrir"><span class="ep-luz"></span>'
        + '<span class="ep-txt">🥚 Abrirlo</span></button>'));
      document.getElementById("hv-abrir").onclick = reclamar;
    }).catch(function (e) { fallo(e.message || e); });
  }

  function arrancar() {
    MOTOR = window.SG.MOTOR;
    if (!HUEVO) return fallo("A este enlace le falta el escondite. Debería acabar en «?h=…».");
    cargando("Comprobando quién eres…");
    MOTOR.sesion().then(mirar).catch(function () { puerta(); });
    document.addEventListener("sg:sesion", function (e) { mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
