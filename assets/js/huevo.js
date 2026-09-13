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
  // «👁 Ver cómo se ve» desde la consola: la misma página, sin reclamar nada
  var VISTA = url.get("vista") === "1", PER_VISTA = (url.get("per") || "").trim();
  var MOTOR = null, YO = null, PER = "", FICHA = "", EST = null, RELOJ = 0;

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

  /**
   * 🔴 13-sep · EL HÉROE, A LA VISTA. Con «un héroe que eliges tú» ya no hay misterio que guardar:
   * es la meta de un reto de clase, y lo que motiva es VERLO antes de pulsar. Grande, con su rareza,
   * y el texto de debajo dice en qué punto está (abierto, se abre a las 10:00, cerrado, ya es tuyo).
   */
  function heroeDe(clave) {
    var x = (((window.SG_CATALOGO || {}).heroes) || []).filter(function (h) { return h.clave === clave; })[0] || {};
    return { clave: clave, nombre: x.nombre || "Un héroe de la Rebelión", rareza: String(x.rareza || "").toLowerCase() };
  }
  function portadaHeroe(clave, eyebrow, sub, botón, clase, copias) {
    var h = heroeDe(clave);
    return '<div class="hv"><div class="hv-caja hv-heroe ' + (clase || '') + ' r-' + esc(h.rareza.replace(/[^a-záéíóú]/g, "")) + '">'
      + '<div class="eyebrow amber">' + eyebrow + '</div>'
      + '<figure class="hv-fig"><img src="assets/img/heroes/' + esc(clave) + '.jpg" alt="' + esc(h.nombre) + '" width="512" height="512">'
      + (h.rareza ? '<figcaption class="hv-rareza">' + esc(h.rareza.charAt(0).toUpperCase() + h.rareza.slice(1)) + '</figcaption>' : '')
      + (copias ? '<span class="hv-copias" title="Cuántos tienes">×' + copias + '</span>' : '')
      + '</figure>'
      + '<h2>' + esc(h.nombre) + '</h2>'
      + '<p class="hv-sub">' + sub + '</p>'
      + (botón || '') + '</div></div>';
  }
  function esHeroeFijo() { return EST && EST.H && EST.H.premio === "heroe_fijo" && EST.H.heroe; }
  /** La portada según cómo esté el premio AHORA. El servidor decide al reclamar; esto lo cuenta antes. */
  function pintarEstado() {
    clearTimeout(RELOJ);
    var e = EST || {}, fijo = esHeroeFijo(), cuando = MOTOR.cuandoEs;
    var caja = function (sub, botón, clase) {
      return fijo ? portadaHeroe(e.H.heroe, VISTA ? "Así lo verá tu alumnado" : (e.yaEra ? "Ya es tuyo" : "Tu recompensa"), sub, botón, clase)
                  : portada(sub, botón);
    };
    var parado = function (txt) { return '<button class="btn epico" disabled><span class="ep-txt">' + txt + '</span></button>'; };
    if (e.estado === "borrado") return fallo("Este premio no existe en tu grupo. Revisa el enlace con tu docente.");
    if (e.yaEra && !VISTA && e.sinAbrir) {
      // reclamado y sin abrir: se fue a mitad de elegir, o no se pudo abrir en su momento
      if (fijo && e.copias > 0) return oferta();
      pinta(caja('Lo reclamaste, pero quedó sin abrir. Ábrelo ahora.',
                 '<button class="btn epico" id="hv-abrir"><span class="ep-luz"></span><span class="ep-txt">Abrirlo ahora</span></button>'));
      document.getElementById("hv-abrir").onclick = function () {
        cargando("Abriéndolo…");
        MOTOR.abrirHuevo(PER, HUEVO, FICHA).then(premio).catch(function (x) { fallo(x.message || x); });
      };
      return;
    }
    if (e.yaEra && !VISTA) {
      if (fijo) return pinta(portadaHeroe(e.H.heroe, "Ya es tuyo", 'Ya está en tu colección: lo reclamaste en su momento.', botónNave(), 'gana', e.copias));
      return pinta('<div class="hv"><div class="hv-caja"><div class="hv-icono">✓</div>'
        + '<h2>Este ya lo tenías</h2>'
        + '<p class="hv-sub">Lo reclamaste en su momento y está en tu cuenta. Hay más escondidos por ahí.</p>'
        + botónNave() + '</div></div>');
    }
    if (e.estado === "pronto") {
      pinta(caja('Todavía no: <b>se abre ' + esc(cuando(e.desde)) + '</b>. Deja esta página abierta y el botón se encenderá solo.',
                 parado("⏳ Se abre " + esc(cuando(e.desde)))));
      // se enciende sola a la hora (con un segundo de margen para no llegar antes que el servidor)
      var falta = e.desde - Date.now() + 1000;
      if (falta > 0 && falta < 864e5) RELOJ = setTimeout(function () { EST.estado = MOTOR.estadoDePremio(EST.R); pintarEstado(); }, falta);
      return;
    }
    if (e.estado === "cerrado") return pinta(caja('Se cerró ' + esc(cuando(e.hasta)) + '. Este ya no se puede reclamar.', ''));
    if (e.estado === "pausado") {
      pinta(caja('Está en pausa. Tu docente lo activará cuando toque.',
                 VISTA ? parado("⏸ En pausa") : '<button class="btn" id="hv-otra">↻ Volver a mirar</button>'));
      var o = document.getElementById("hv-otra"); if (o) o.onclick = function () { mirar._v = undefined; mirar(YO); };
      return;
    }
    if (e.estado === "agotado") return pinta(caja('Llegaste tarde: ya lo han reclamado las ' + e.tope + ' personas que podían.', ''));
    // abierto
    if (VISTA) return pinta(caja(fijo ? 'Súmalo a tu colección. Solo se puede una vez.'
                                      : 'Hay algo aquí para ti. Púlsalo y es tuyo — <b>solo se puede una vez</b>.',
                                 parado(fijo ? "🛡️ Sumarlo a mi colección" : "🥚 Abrirlo") + '<p class="hv-nota-vista">Vista previa: desde aquí no se reclama.</p>'));
    var boton = '<button class="btn epico" id="hv-abrir"><span class="ep-luz"></span>'
               + '<span class="ep-txt">' + (fijo ? (e.copias ? "🛡️ Reclamarlo" : "🛡️ Sumarlo a mi colección") : "🥚 Abrirlo") + '</span></button>';
    if (fijo && e.copias) pinta(portadaHeroe(e.H.heroe, "Tu recompensa",
      'Este <b>ya lo tienes</b>. Reclámalo igualmente: NEBULA te dejará elegir entre quedártelo repetido, <b>40 ◈</b> o un <b>sobre de cromos</b>.',
      boton, '', e.copias));
    else pinta(caja(fijo ? 'Súmalo a tu colección. <b>Solo se puede una vez.</b>'
                         : 'Hay algo aquí para ti. Púlsalo y es tuyo — <b>solo se puede una vez</b>.', boton));
    document.getElementById("hv-abrir").onclick = reclamar;
  }

  /**
   * 🔴 13-sep · «VAYA, PARECE QUE YA LO TIENES». Norberto: «se le ofrece la posibilidad de mantener el
   * héroe aunque esté repetido (burbuja con el número de veces que lo tiene), cobrar 40 créditos o un
   * sobre. Ponlo visual. NEBULA diciendo… y un botón para elegir». Tres tarjetas que se ven de un
   * vistazo y UN botón que dice exactamente lo que va a pasar.
   */
  function oferta() {
    var h = heroeDe(EST.H.heroe), n = EST.copias || 1;
    pinta('<div class="hv"><div class="hv-caja ancha hv-oferta-caja">'
      + '<div class="hv-neb"><img src="assets/img/personajes/nebula.png" alt="NEBULA"></div>'
      + '<div class="eyebrow amber">NEBULA</div>'
      + '<h2>Vaya, parece que ya tienes a ' + esc(h.nombre) + '</h2>'
      + '<p class="hv-sub">No quiero que te quedes sin premio. Elige una de estas tres:</p>'
      + '<div class="hv-oferta" role="radiogroup" aria-label="Elige tu premio">'
      +   '<label class="hv-op"><input type="radio" name="hv-op" value="quedar">'
      +     '<span class="hv-op-img"><img src="assets/img/heroes/' + esc(EST.H.heroe) + '.jpg" alt=""><span class="hv-copias">×' + (n + 1) + '</span></span>'
      +     '<span class="hv-op-txt"><b>Quedármelo</b><em>Tendrás ' + (n + 1) + '. Junta 2 repetidos y cámbialos por un héroe al azar.</em></span></label>'
      +   '<label class="hv-op"><input type="radio" name="hv-op" value="creditos">'
      +     '<span class="hv-op-img hv-op-cr"><span>40</span><i>◈</i></span>'
      +     '<span class="hv-op-txt"><b>40 créditos</b><em>Para gastar en el Mercado.</em></span></label>'
      +   '<label class="hv-op"><input type="radio" name="hv-op" value="sobre">'
      +     '<span class="hv-op-img"><img src="assets/img/canje/sobre.jpg" alt=""></span>'
      +     '<span class="hv-op-txt"><b>Un sobre de cromos</b><em>Tres cartas al azar para tu álbum.</em></span></label>'
      + '</div>'
      + '<button class="btn epico" id="hv-elegir" disabled><span class="ep-luz"></span><span class="ep-txt">Elige una</span></button>'
      + '</div></div>');
    var btn = document.getElementById("hv-elegir"), elegido = "";
    var DICE = { quedar: "🛡️ Quedármelo", creditos: "💰 Cobrar 40 ◈", sobre: "🃏 Abrir el sobre" };
    Array.prototype.forEach.call(app.querySelectorAll('input[name="hv-op"]'), function (r) {
      r.onchange = function () {
        elegido = r.value; btn.disabled = false;
        btn.querySelector(".ep-txt").textContent = DICE[elegido];
        Array.prototype.forEach.call(app.querySelectorAll(".hv-op"), function (l) { l.classList.toggle("on", l.contains(r)); });
      };
    });
    btn.onclick = function () {
      if (!elegido) return;
      btn.disabled = true; btn.querySelector(".ep-txt").textContent = "Un momento…";
      MOTOR.resolverHeroeRepetido(PER, HUEVO, FICHA, elegido).then(function (r) {
        if (elegido === "quedar") r.copias = n + 1;
        premio(r);
      }).catch(function (x) { fallo(x.message || x); });
    };
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
  var NOMBRES = { sobre: "Un sobre de cromos", heroe: "Un héroe de la Rebelión", heroe_fijo: "Un héroe de la Rebelión", bolsa: "Una bolsa de créditos", xp: "Experiencia",
                  participaciones: "Participaciones del Gran Sorteo" };
  var ICONOS  = { sobre: "🃏", heroe: "🛡️", heroe_fijo: "🛡️", bolsa: "💰", xp: "⚡", participaciones: "🎟️" };

  function reclamar() {
    if (esHeroeFijo()) pinta(portadaHeroe(EST.H.heroe, "Tu recompensa", 'Sumándolo a tu colección…', '<div class="hv-cargando"><i></i></div>'));
    else cargando("Abriendo el escondite…");
    MOTOR.reclamarHuevo(PER, HUEVO, FICHA).then(function (r) {
      if (r.yaEra) { EST.yaEra = true; return pintarEstado(); }
      if (r.repetido) { EST.copias = r.copias; EST.yaEra = true; EST.sinAbrir = true; return oferta(); }
      premio(r);
    }).catch(function (e) { fallo(e.message || e); });
  }

  function botónNave() {
    return '<p class="hv-pie"><a class="btn" href="recluta.html?per=' + esc(PER)
      + '" target="_blank" rel="noopener">🚀 Ver mi Nave ↗</a></p>';
  }

  function premio(r) {
    var d = r.detalle || {}, t = r.premio === "heroe_fijo" ? "heroe" : r.premio, fijo = r.premio === "heroe_fijo";
    // 🔴 Las cartas se abren una a una, con el mismo sobre que el Mercado, y DESPUÉS la pantalla del
    // hallazgo con el confeti. Es el mismo momento en los tres sitios donde se ganan cartas.
    if (!r.__abierto && window.SG && SG.SOBRE && !d.sinAbrir &&
        ((t === "sobre" && d.cartas && d.cartas.length) || (t === "heroe" && d.clave))) {
      var cartas = t === "sobre" ? d.cartas : [{ clave: d.clave, nombre: d.nombre, tipo: "heroe", rareza: d.rareza || "épica", repetida: (r.copias || 0) > 1 }];
      return SG.SOBRE.revelar(cartas, { titulo: t === "sobre" ? "Lo que había en el escondite" : fijo ? "Tu recompensa" : "Un héroe escondido" })
        .then(function () { r.__abierto = true; premio(r); });
    }
    var que = t === "sobre" ? (d.cartas || []).map(function (c) { return c.nombre; }).join(" · ")
            : t === "heroe" ? (d.nombre || "")
            : t === "bolsa" ? "+" + (d.creditos || 0) + " ◈"
            : t === "xp" ? "+" + (d.xp || 0) + " xp"
            : t === "participaciones" ? "+" + (d.n || 1) + " participaci" + ((d.n || 1) === 1 ? "ón" : "ones") + (d.sorteo ? " · " + d.sorteo : "")
            : "";
    if (fijo && d.clave && !d.sinAbrir) {
      var rep = (r.copias || 0) > 1;
      pinta(portadaHeroe(d.clave, rep ? "Repetido en tu colección" : "Nuevo en tu colección",
        rep ? 'Ya tienes ' + r.copias + ' (' + (r.copias - 1) + ' repetido' + (r.copias > 2 ? 's' : '') + '). Junta <b>2 repetidos</b> y cámbialos por <b>un héroe nuevo al azar</b> en tu vestuario.'
            : 'Ya es tuyo: lo tienes en tu Nave, en el vestuario.', botónNave(), 'gana', rep ? r.copias : 0));
      confeti();
      try { if (window.SG && SG.FIESTA) SG.FIESTA.sonar("nivel"); } catch (e) {}
      return;
    }
    pinta('<div class="hv"><div class="hv-caja gana">'
      + '<div class="hv-icono grande">' + (ICONOS[t] || "🎁") + '</div>'
      + '<div class="eyebrow amber">Lo has encontrado</div>'
      + '<h2>' + esc(NOMBRES[t] || "Un premio") + '</h2>'
      + (que ? '<p class="hv-que">' + esc(que) + '</p>' : '')
      + '<p class="hv-sub">' + (t === "participaciones"
          ? 'Ya son tuyas: cada una es una papeleta más para el sorteo. Las ves en el Mercado de tu Nave.'
          : d.sinAbrir ? 'Lo tienes en tu inventario: ábrelo desde tu Nave, en Mi botín.'
          : 'Ya está en tu cuenta.') + (fijo ? '' : ' Hay más escondidos por ahí.') + '</p>'
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
    var q_ = u ? u.uid : null; if (q_ === mirar._v) return; mirar._v = q_;  // una vez por cuenta: sesion() y sg:sesion llegan los dos al cargar
    YO = u;
    if (!YO) return puerta();
    if (VISTA && PER_VISTA) {
      cargando("Preparando la vista previa…");
      PER = PER_VISTA;
      return MOTOR.estadoHuevo(PER, HUEVO, null).then(function (e) { EST = e; pintarEstado(); })
        .catch(function (e) { fallo(e.message || e); });
    }
    cargando("Buscando tu ficha…");
    /**
     * 🔴 Se busca en QUÉ grupo está esta persona, no se pide en el enlace. Un estudiante pertenece
     * a uno; si por lo que sea estuviera en dos, se coge el que tenga este escondite configurado.
     */
    MOTOR.misGruposDeAlumno(YO.uid).then(function (fichas) {
      if (!fichas.length) return fallo("No estás alistado en ningún grupo todavía. Entra en STARGATE con Google y escribe el código de clase que te dio tu docente.");
      /**
       * 🔴 12-sep · EL GRUPO QUE TIENE ESTE ESCONDITE, no el primero. El comentario de arriba ya lo
       * prometía y el código cogía `fichas[0]`: alguien alistado en dos grupos (un repetidor, un
       * docente que se alistó en uno de prácticas) podía acabar en el grupo equivocado y leer «este
       * escondite no existe» con el escondite delante. Se mira cuál de sus grupos lo tiene.
       */
      return Promise.all(fichas.map(function (f) {
        return MOTOR.getDoc(MOTOR.doc(MOTOR.db, "rewards", f.per + "__huevo_" + HUEVO))
          .then(function (d) { return d.exists() && !d.data().stargateBorrado; }).catch(function () { return false; });
      })).then(function (tiene) {
        var elegido = fichas.filter(function (f, i) { return tiene[i]; })[0] || fichas[0];
        return elegido;
      });
    }).then(function (elegido) {
      if (!elegido || !elegido.per) return;
      PER = elegido.per; FICHA = elegido.ficha;
      return MOTOR.estadoHuevo(PER, HUEVO, FICHA).then(function (e) { EST = e; pintarEstado(); });
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
