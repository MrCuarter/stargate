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
  // La misma razón que en el aula y la llamada: incrustado, fuera cabecera y pie. Y (15-sep) sin fondo: es una caja
  // suelta dentro del Genially, que se vea la diapositiva detrás (Norberto: «solo el fondo, no la caja»).
  if (new URLSearchParams(location.search).get("embed") === "1") document.body.classList.add("embed", "embed-caja");

  var url = new URLSearchParams(location.search);
  var HUEVO = (url.get("h") || url.get("huevo") || "").trim();
  /**
   * 🔴 17-sep · EL CÓDIGO, EL TIPO Y LA PÁGINA PROPIA. Norberto: «es importante usar direcciones más difíciles»; «debería
   * poder marcarse si es huevo de Pascua o recompensa: a veces haremos actividades y al superarlas tendrán su recompensa
   * (la mayoría): ¡Enhorabuena! Has ganado una recompensa. Pulsa para conseguirla»; y «el enlace directo sí tiene que
   * tener el fondo de STARGATE, una página dedicada donde aparezca el Capitán sorprendido. Sin fondo, solo el embed».
   * `c` es el código que comprueba el servidor; `t` dice qué es antes de saber el grupo (r = recompensa, h = huevo).
   */
  var CODIGO = (url.get("c") || "").trim();
  var TIPO_URL = url.get("t") === "h" ? "huevo" : url.get("t") === "r" ? "recompensa" : "";
  var DIRECTO = url.get("embed") !== "1";
  function tipo() { return (EST && EST.H && EST.H.tipo) || TIPO_URL || "huevo"; }
  function esRec() { return tipo() === "recompensa"; }
  function marcarPagina() {
    document.body.classList.toggle("huevo-directo", DIRECTO);
    document.body.classList.toggle("huevo-rec", esRec());
    document.title = "STARGATE · " + (esRec() ? "Tu recompensa" : "Un huevo de Pascua");
  }
  /** En la página propia, el Capitán a un lado: señalando el hallazgo o con el pulgar arriba por el reto superado. */
  function escena(dice) {
    if (!DIRECTO) return "";
    return '<div class="hv-escena"><img class="hv-cap" src="assets/img/capitan/' + (esRec() ? "pulgar" : "senala") + '.png" alt="El Capitán" width="360" height="480">'
      + '<p class="hv-bocadillo">' + (dice || (esRec() ? "¡Reto superado, recluta! Esto te lo has ganado." : "¡Vaya! ¿Cómo has dado con este escondite?")) + '</p></div>';
  }
  // «👁 Ver cómo se ve» desde la consola: la misma página, sin reclamar nada
  var VISTA = url.get("vista") === "1", PER_VISTA = (url.get("per") || "").trim();
  var MOTOR = null, YO = null, PER = "", FICHA = "", EST = null, RELOJ = 0;
  // 17-sep · con cuenta de docente: la misma página, y se «reclama» de mentira (ver `simular`)
  var SIMULA = false;
  // 15-sep · pulsó «Abrirlo» sin sesión: en cuanto entre con Google, se reclama solo (Norberto: «una vez iniciada, el
  // mensaje de lo que ha ganado»)
  var QUIERE = false;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pinta(h) { app.innerHTML = h; }

  /** El sobre del misterio: lo que se ve ANTES de saber qué hay dentro. */
  function portada(sub, botón) {
    var rec = esRec();
    return '<div class="hv">' + escena() + '<div class="hv-caja">' + avisoSimula()
      + '<div class="hv-icono">' + (rec ? "🎁" : "🥚") + '</div>'
      + '<div class="eyebrow amber">' + (rec ? "Reto superado" : "Has encontrado un huevo de Pascua") + '</div>'
      + '<h2>' + (rec ? "¡Enhorabuena! Has ganado una recompensa" : "Un escondite de la Tripulación Cero") + '</h2>'
      + '<p class="hv-sub">' + sub + '</p>'
      + (botón || '') + '</div></div>';
  }
  function invita() { return esRec() ? 'Pulsa para conseguirla. <b>Solo se puede una vez.</b>' : 'Hay algo aquí para ti. Púlsalo y es tuyo — <b>solo se puede una vez</b>.'; }
  function botonAbrir(id) {
    return '<button class="btn epico" id="' + id + '"><span class="ep-luz"></span><span class="ep-txt">' + (esRec() ? "🎁 Conseguir mi recompensa" : "🥚 Abrirlo") + '</span></button>';
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
    return '<div class="hv">' + escena() + '<div class="hv-caja hv-heroe ' + (clase || '') + ' r-' + esc(h.rareza.replace(/[^a-záéíóú]/g, "")) + '">'
      + avisoSimula() + '<div class="eyebrow amber">' + eyebrow + '</div>'
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
    marcarPagina();
    if (SIMULA) return pintarSimulacion();
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
      return pinta('<div class="hv">' + escena(esRec() ? "Esta ya es tuya, recluta." : "Este ya lo encontraste tú.") + '<div class="hv-caja"><div class="hv-icono">✓</div>'
        + '<h2>' + (esRec() ? "Esta recompensa ya es tuya" : "Este ya lo tenías") + '</h2>'
        + '<p class="hv-sub">' + (esRec() ? "La conseguiste en su momento y está en tu cuenta." : "Lo reclamaste en su momento y está en tu cuenta. Hay más escondidos por ahí.") + '</p>'
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
    if (VISTA) return pinta(caja(fijo ? 'Súmalo a tu colección. Solo se puede una vez.' : invita(),
                                 parado(fijo ? "🛡️ Sumarlo a mi colección" : esRec() ? "🎁 Conseguir mi recompensa" : "🥚 Abrirlo") + '<p class="hv-nota-vista">Vista previa: desde aquí no se reclama.</p>'));
    var boton = fijo ? '<button class="btn epico" id="hv-abrir"><span class="ep-luz"></span>'
               + '<span class="ep-txt">' + (e.copias ? "🛡️ Reclamarlo" : "🛡️ Sumarlo a mi colección") + '</span></button>' : botonAbrir("hv-abrir");
    if (fijo && e.copias) pinta(portadaHeroe(e.H.heroe, "Tu recompensa",
      'Este <b>ya lo tienes</b>. Reclámalo igualmente: NEBULA te dejará elegir entre quedártelo repetido, <b>40 ◈</b> o un <b>sobre de cromos</b>.',
      boton, '', e.copias));
    else pinta(caja(fijo ? 'Súmalo a tu colección. <b>Solo se puede una vez.</b>' : invita(), boton));
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

  /**
   * 🔴 17-sep · EL DOCENTE PUEDE PROBARLO DELANTE DE SU CLASE. Norberto: «aunque detecte la cuenta del profesorado,
   * que me permita ver la recompensa (avisa de que es cuenta de docente y de que es una simulación, que no se descuenta),
   * pero que se vea y pueda "reclamarla" para enseñar a los estudiantes cómo se hace». Se busca el premio en SUS grupos,
   * se enseña igual que al alumnado y el botón abre un premio de mentira (el sobre con cartas al azar, el héroe, los
   * créditos…): no llama al servidor, no cuenta como reclamado y no gasta el tope.
   */
  function avisoSimula() {
    return SIMULA ? '<p class="hv-sim">🧑‍🏫 <b>Cuenta de docente · simulación.</b> Así lo vive tu alumnado: no se reclama nada y el premio sigue intacto.</p>' : '';
  }
  function correoYo() { return String((YO && (YO.correo || YO.email)) || "").toLowerCase(); }
  function pareceDocente() {
    try { return localStorage.getItem("sgEsDocente") === "1" || (MOTOR.VITALICIOS || []).indexOf(correoYo()) >= 0; } catch (e) { return false; }
  }
  function simular() {
    cargando("Buscando este premio en tus grupos…");
    return (MOTOR.misPERs ? MOTOR.misPERs(correoYo()) : Promise.resolve([])).catch(function () { return []; }).then(function (gs) {
      if (!gs.length) return otraCuenta();
      return Promise.all(gs.map(function (g) {
        return MOTOR.getDoc(MOTOR.doc(MOTOR.db, "rewards", g.id + "__huevo_" + HUEVO))
          .then(function (d) { return d.exists() && !d.data().stargateBorrado; }).catch(function () { return false; });
      })).then(function (tiene) {
        var g = gs.filter(function (x, i) { return tiene[i]; })[0];
        if (!g) return otraCuenta();   // (no es de sus grupos: con qué cuenta está, y entrar con otra)
        PER = g.id; SIMULA = true;
        return MOTOR.estadoHuevo(PER, HUEVO, null).then(function (e) { EST = e; pintarEstado(); });
      });
    });
  }
  function pintarSimulacion() {
    var e = EST || {}, fijo = esHeroeFijo(), cuando = MOTOR.cuandoEs;
    var ahora = e.estado === "pausado" ? " (Ahora mismo está <b>en pausa</b> para tu alumnado.)"
              : e.estado === "pronto" ? " (Tu alumnado podrá desde " + esc(cuando(e.desde)) + ".)"
              : e.estado === "cerrado" ? " (Para tu alumnado ya se cerró.)"
              : e.estado === "agotado" ? " (Para tu alumnado ya está agotado.)" : "";
    var boton = '<button class="btn epico" id="hv-simular"><span class="ep-luz"></span><span class="ep-txt">'
      + (fijo ? "🛡️ Sumarlo a mi colección" : esRec() ? "🎁 Conseguir mi recompensa" : "🥚 Abrirlo") + '</span></button>';
    if (fijo) pinta(portadaHeroe(e.H.heroe, "Tu recompensa", 'Súmalo a tu colección. <b>Solo se puede una vez.</b>' + ahora, boton));
    else pinta(portada(invita() + ahora, boton));
    document.getElementById("hv-simular").onclick = function () {
      var H = e.H || {}, cat = window.SG_CATALOGO || {}, al = function (l) { return l[Math.floor(Math.random() * l.length)]; };
      var cromos = cat.cromos || [], heroes = cat.heroes || [], n = Number(H.cantidad || H.creditos) || 0, t = H.premio || "sobre", d = {};
      var carta = function (x, tipoC) { return { clave: x.clave, nombre: x.nombre, rareza: x.rareza, tipo: tipoC }; };
      if (/^sobre/.test(t) && cromos.length) {
        var cuantas = t === "sobre_grande" ? 5 : 3, pool = t === "sobre_epico" ? cromos.filter(function (c) { return !/com/i.test(c.rareza); })
                    : t === "sobre_raro" ? cromos.filter(function (c) { return !/com/i.test(c.rareza); }) : cromos;
        d.cartas = []; for (var i = 0; i < cuantas; i++) d.cartas.push(carta(al(pool.length ? pool : cromos), "cromo"));
      } else if (t === "heroe_fijo") { var h = heroeDe(H.heroe); d = { clave: H.heroe, nombre: h.nombre, rareza: h.rareza }; }
      else if ((t === "heroe" || /^capsula_/.test(t)) && heroes.length) {
        var pool2 = t === "capsula_legendaria" ? heroes.filter(function (x) { return /legend|mito/i.test(x.rareza); }) : t === "capsula_elite" ? heroes.filter(function (x) { return /épica|legend|mito/i.test(x.rareza); }) : heroes;
        var x = al(pool2.length ? pool2 : heroes); d = { clave: x.clave, nombre: x.nombre, rareza: x.rareza };
      } else if (t === "bolsa") d.creditos = n || 50;
      else if (t === "xp") d.xp = n || 100;
      else if (t === "participaciones") d.n = n || 1;
      premio({ premio: t, detalle: d, simulado: true });
    };
  }

  // ---------------------------------------------------------------- la puerta
  /**
   * 🔴 La sesión se pide AQUÍ, no se manda a otra página. Quien encuentra esto está dentro de un
   * Genially, probablemente proyectado o en el móvil: sacarle a otra pestaña a identificarse y que
   * vuelva —si vuelve— es perder a la mitad justo en el momento de más ilusión.
   */
  /**
   * 15-sep · SIEMPRE LA MISMA PORTADA. Norberto: «lo ideal sería que se viera SIEMPRE igual que en la previsualización.
   * Al pulsar Abrirlo, si ha iniciado sesión, se reclama solo; si no, aparece lo del botón de Google, y una vez iniciada,
   * el mensaje de lo que ha ganado». Sin sesión no se sabe su grupo (ni, por tanto, qué premio es): se enseña el
   * escondite con su botón, y el botón pide la cuenta.
   */
  function puerta() {
    marcarPagina();
    pinta(portada(invita(), botonAbrir("hv-abrir0")));
    document.getElementById("hv-abrir0").onclick = puertaGoogle;
  }
  function puertaGoogle() {
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
      QUIERE = true; mirar._v = undefined;
      cargando("Abriendo…");
      MOTOR.entrar().then(mirar).catch(function (e) {
        QUIERE = false;
        // cerró la ventana de Google sin elegir cuenta: vuelve a la puerta, sin drama
        if (/popup-closed|cancelled-popup/.test(String(e && e.code))) return puertaGoogle();
        fallo(e.message);
      });
    };
  }
  /**
   * 15-sep · CON UNA CUENTA QUE NO ESTÁ EN NINGÚN GRUPO (la del trabajo, la de un docente…): se dice con qué cuenta
   * está y se ofrece entrar con otra ahí mismo. Antes solo decía «no he podido dártelo» y no había por dónde seguir.
   */
  function otraCuenta() {
    var correo = String((YO && (YO.correo || YO.email)) || ""), docente = false;
    try { docente = localStorage.getItem("sgEsDocente") === "1" || (MOTOR.VITALICIOS || []).indexOf(correo.toLowerCase()) >= 0; } catch (e) {}
    pinta('<div class="hv">' + escena("Hmm… con esa cuenta no te encuentro.") + '<div class="hv-caja mal"><div class="hv-icono">' + (esRec() ? "🎁" : "🥚") + '</div>'
      + '<h2>' + (docente ? "Esta cuenta es de docente" : "Esta cuenta no está en ningún grupo") + '</h2>'
      + '<p class="hv-sub">' + (docente
          ? 'Estás con <b>' + esc(correo) + '</b> y este premio no está en ninguno de tus grupos. Si es de tu alumnado, ábrelo desde «Premios por enlace» de su grupo (con tu cuenta puedes probarlo como simulación).'
          : 'Estás con <b>' + esc(correo) + '</b>, y no la encuentro alistada. Entra con <b>la cuenta con la que te alistaste</b> en STARGATE.') + '</p>'
      + '<button class="btn epico" id="hv-otra-cuenta"><span class="ep-luz"></span>'
      + '<span class="ep-g">' + ((window.SG && window.SG.LOGO_G) || '') + '</span>'
      + '<span class="ep-txt">Entrar con otra cuenta</span></button>'
      + '<p class="hv-nota-vista">¿Aún no te has alistado? Entra en STARGATE con Google y escribe el código de clase que te dio tu docente.</p></div></div>');
    document.getElementById("hv-otra-cuenta").onclick = function () {
      QUIERE = true; mirar._v = undefined;
      cargando("Abriendo…");
      // la ventana de Google pregunta qué cuenta (select_account): la nueva sustituye a la de ahora
      MOTOR.entrar().then(mirar).catch(function (e) { QUIERE = false; if (/popup-closed|cancelled-popup/.test(String(e && e.code))) return otraCuenta(); fallo(e.message); });
    };
  }

  function fallo(msg) {
    pinta('<div class="hv">' + escena("Algo no ha ido bien…") + '<div class="hv-caja mal"><div class="hv-icono">' + (esRec() ? "🎁" : "🥚") + '</div>'
      + '<h2>No he podido dártelo</h2><p class="hv-sub">' + esc(msg) + '</p></div></div>');
  }

  // ---------------------------------------------------------------- el premio
  var NOMBRES = { sobre: "Un sobre de cromos", heroe: "Un héroe de la Rebelión", heroe_fijo: "Un héroe de la Rebelión", bolsa: "Una bolsa de créditos", xp: "Experiencia",
                  participaciones: "Participaciones del Gran Sorteo",
                  // 14-sep · los sobres y las cápsulas nuevos
                  sobre_grande: "Un sobre grande", sobre_raro: "Un sobre de raras", sobre_epico: "Un sobre épico",
                  capsula_elite: "Una cápsula de élite", capsula_legendaria: "Una cápsula legendaria" };
  var ICONOS  = { sobre: "🃏", heroe: "🛡️", heroe_fijo: "🛡️", bolsa: "💰", xp: "⚡", participaciones: "🎟️",
                  sobre_grande: "🃏", sobre_raro: "💎", sobre_epico: "✨", capsula_elite: "🟪", capsula_legendaria: "🟨" };

  function reclamar() {
    if (esHeroeFijo()) pinta(portadaHeroe(EST.H.heroe, "Tu recompensa", 'Sumándolo a tu colección…', '<div class="hv-cargando"><i></i></div>'));
    else cargando(esRec() ? "Consiguiendo tu recompensa…" : "Abriendo el escondite…");
    MOTOR.reclamarHuevo(PER, HUEVO, FICHA, CODIGO).then(function (r) {
      if (r.yaEra) { EST.yaEra = true; return pintarEstado(); }
      if (r.repetido) { EST.copias = r.copias; EST.yaEra = true; EST.sinAbrir = true; return oferta(); }
      premio(r);
    }).catch(function (e) { fallo(e.message || e); });
  }

  function botónNave() {
    if (SIMULA) return '<p class="hv-sim">🧑‍🏫 Era una simulación: no se ha guardado nada y el premio sigue intacto para tu alumnado.</p>'
      + '<p class="hv-pie"><button class="btn" id="hv-otra-vez" type="button">↻ Repetir la simulación</button></p>';
    return '<p class="hv-pie"><a class="btn" href="recluta.html?per=' + esc(PER)
      + '" target="_blank" rel="noopener">🚀 Ver mi Nave ↗</a></p>';
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest && ev.target.closest("#hv-otra-vez"); if (b && SIMULA) pintarEstado();
  });

  function premio(r) {
    // (los sobres nuevos se abren como un sobre y las cápsulas como un héroe)
    var d = r.detalle || {}, t = r.premio === "heroe_fijo" || /^capsula_/.test(r.premio || "") ? "heroe" : /^sobre_/.test(r.premio || "") ? "sobre" : r.premio, fijo = r.premio === "heroe_fijo";
    // 🔴 Las cartas se abren una a una, con el mismo sobre que el Mercado, y DESPUÉS la pantalla del
    // hallazgo con el confeti. Es el mismo momento en los tres sitios donde se ganan cartas.
    if (!r.__abierto && window.SG && SG.SOBRE && !d.sinAbrir &&
        ((t === "sobre" && d.cartas && d.cartas.length) || (t === "heroe" && d.clave))) {
      var cartas = t === "sobre" ? d.cartas : [{ clave: d.clave, nombre: d.nombre, tipo: "heroe", rareza: d.rareza || "épica", repetida: (r.copias || 0) > 1 }];
      return SG.SOBRE.revelar(cartas, { titulo: esRec() ? "Tu recompensa" : t === "sobre" ? "Lo que había en el escondite" : fijo ? "Tu recompensa" : "Un héroe escondido" })
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
    pinta('<div class="hv">' + escena(esRec() ? "¡Bien hecho! Ya está en tu cuenta." : "¡Menudo hallazgo!") + '<div class="hv-caja gana">'
      + '<div class="hv-icono grande">' + (ICONOS[t] || "🎁") + '</div>'
      + '<div class="eyebrow amber">' + (esRec() ? "Tu recompensa" : "Lo has encontrado") + '</div>'
      + '<h2>' + esc(NOMBRES[t] || "Un premio") + '</h2>'
      + (que ? '<p class="hv-que">' + esc(que) + '</p>' : '')
      + '<p class="hv-sub">' + (t === "participaciones"
          ? 'Ya son tuyas: cada una es una papeleta más para el sorteo. Las ves en el Mercado de tu Nave.'
          : d.sinAbrir ? 'Lo tienes en tu inventario: ábrelo desde tu Nave, en Mi botín.'
          : 'Ya está en tu cuenta.') + (fijo || esRec() ? '' : ' Hay más escondidos por ahí.') + '</p>'
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
      if (!fichas.length) return pareceDocente() || (MOTOR.misPERs && !VISTA) ? simular() : otraCuenta();
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
      return MOTOR.estadoHuevo(PER, HUEVO, FICHA).then(function (e) {
        EST = e;
        // ya había pulsado «Abrirlo»: si está abierto y no lo tenía, se reclama sin volver a pedirle nada
        var auto = QUIERE; QUIERE = false;
        if (auto && e.estado === "abierto" && !e.yaEra) return reclamar();
        pintarEstado();
      });
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
