/**
 * STARGATE — EL PRESTRENO: la presentación para el equipo docente (20-sep-2026).
 *
 * 🔴 QUÉ ES Y POR QUÉ NO ES LA GUÍA. La guía en PDF se lee a solas; esto se PROYECTA delante de gente que va a
 * dar la asignatura por primera vez y que, casi siempre, no ha oído hablar de STARGATE. Norberto: «monta la
 * presentación. Debe ser visual, usar los recursos de STARGATE, interactiva… como las sesiones semanales. La
 * diferencia clave: está orientada a docentes primerizos».
 *
 * Así que se parece a la sesión de clase a propósito —el mismo mazo, las mismas flechas, la misma barra de
 * abajo—, y por dos razones: se conoce el gesto, y **la presentación es ya una demostración del producto**. Quien
 * la ve proyectada está viendo exactamente lo que va a proyectar en su clase.
 *
 * 🔴 NADA DE DATOS A MANO. Los planetas, las semanas, los retos, los precios y los tripulantes salen de
 * `_site_data.py` por los `window.SG_*` de siempre. Si mañana cambia un tema o un precio, esta presentación lo
 * dice bien sin que nadie se acuerde de ella. Es la regla de la casa: un dato, un sitio.
 *
 * Quién la ve: el **referente**, desde «Gestionar grupos» (es lo que se hace una vez por curso, con el equipo), y TODO el
 * profesorado en la **Guía**, arriba, embebida como resumen para volver a verla (24-sep).
 *
 * 🔴 24-sep · QUE ENAMORE. Norberto: «más visual, con más imágenes… la portada empieza muy directa: dales la bienvenida,
 * diles que son los nuevos comandantes… usa al Capitán de la Nave como hilo conductor y a NEBULA para complementar… predica
 * con el ejemplo sin el tiempo de gestión… despliega todo lo que hemos hecho». Cada diapositiva es una ESCENA: un fondo
 * de la biblioteca de imágenes (assets/img/pres, los retratos de la Cero, las superficies de los planetas), el Capitán en
 * una pose con su frase y, a veces, NEBULA. Y cada pieza dice su porqué. Los datos, de `SG_PRESENTA` (del build).
 */
(function () {
  var root = document.getElementById("prestreno-app");
  if (!root) return;
  /**
   * 🔴 21-sep · ?embed=1 · LA VENTANA LIMPIA. Norberto: «el icono de la derecha "Abrir la presentación" debe abrir
   * la presentación en una ventana sin nada más, exclusivamente la presentación. Simplifica al máximo la ventana
   * que se abre para evitar distractores». El botón ⧉ de «Gestionar grupos» abre una ventana emergente con este
   * parámetro; con la clase puesta, la hoja de estilos se lleva menú, cabecera y pie, y el mazo ocupa la ventana.
   * Es el mismo gesto que ya tenían la sesión de clase y el aula: un solo sitio que decide qué es «sin nada más».
   */
  if (new URLSearchParams(location.search).get("embed") === "1") document.body.classList.add("embed");
  var esc = function (x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var $ = function (s, d) { return (d || document).querySelector(s); };

  var SEMS = window.SG_SEMANAS || [], PLAN = window.SG_PLANETAS || [], CAT = window.SG_CATALOGO || {};
  var CROMOS = window.SG_CROMOS || [], IMGV = window.SG_IMGV || "";
  var RETOS = (window.SG_RETOS || {}).REGULAR || [];
  var CAPS = window.SG_CAPITULOS || [];
  var st = { i: 0 };
  var QUIETO = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /** Los ocho de la Tripulación Cero, por su cromo (P1…P8): la serie I del álbum, en orden de planeta. */
  function tripulacion() {
    return CROMOS.filter(function (c) { return /^P[1-8]_/.test(c[0]); })
      .sort(function (a, b) { return Number(a[0][1]) - Number(b[0][1]); })
      .map(function (c) { return { n: Number(c[0][1]), clave: c[0], nombre: c[1] }; });
  }
  /** Los dos retos de un tema: el relámpago (L, recupera al tripulante) y el principal (B, la experiencia del portfolio). */
  function retosDe(tema) {
    var r = {};
    RETOS.forEach(function (x) {
      var id = x[0] || x.id, tit = x[1] || x.titulo || "";
      if (!id) return;
      var m = String(id).match(/^([ABLX])(\d)$/); if (!m || Number(m[2]) !== tema) return;
      // el título ya viene entrecomillado y con el nombre del tripulante entre paréntesis: fuera los dos,
      // que el tripulante ya se dice arriba y las comillas las pone la frase
      r[m[1]] = { id: id, titulo: String(tit).replace(/^Reto (relámpago |principal |[AB] )?/, "").replace(/\s*\([^)]*\)\s*$/, "").trim() };
    });
    return r;
  }
  function semanasDe(tema) {
    var w = SEMS.filter(function (s) { return Number(s.tema_n) === tema; }).map(function (s) { return s.sem; });
    return w.length ? (w.length === 1 ? "semana " + w[0] : "semanas " + w[0] + "–" + w[w.length - 1]) : "";
  }
  function capDe(clave) { return CAPS.filter(function (c) { return c.clave === clave; })[0] || null; }
  function semanaCap(clave) { var c = capDe(clave); return c ? c.semana : "?"; }

  // ───────────────────────────────────────────────────────────── la escena (24-sep)
  var PRE = window.SG_PRESENTA || {};
  /** Una diapositiva como escena: fondo a sangre, el Capitán con su frase (el hilo), el cuerpo y, si toca, NEBULA. */
  function escena(o) {
    var fondo = o.bg ? (o.bg.indexOf("/") >= 0 ? o.bg : "assets/img/pres/" + o.bg) : "";
    return '<div class="dia pr-esc' + (o.cap ? ' con-capi' : '') + (o.cls ? ' ' + o.cls : '') + '">' +
      (fondo ? '<div class="pr-fondo" style="background-image:url(\'' + esc(fondo) + '\')"></div>' : '') +
      (o.cap ? '<figure class="pr-capi"><img src="assets/img/capitan/' + esc(o.cap[0]) + '.png" alt="El Capitán de la Nave">' +
        (o.cap[1] ? '<figcaption><b>El Capitán</b>' + o.cap[1] + '</figcaption>' : '') + '</figure>' : '') +
      '<div class="pr-cuerpo">' + o.cuerpo + '</div>' +
      (o.neb ? '<div class="pr-neb"><div class="pr-globo"><b>NEBULA</b>' + o.neb + '</div>' +
        '<img src="assets/img/personajes/nebula.png" alt="NEBULA"></div>' : '') +
    '</div>';
  }
  function porque(t) { return '<p class="pr-porque"><b>Por qué</b>' + t + '</p>'; }
  function mil(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  function portada() {
    return { rot: "Portada", html: escena({ cls: "pr-portada2", bg: "puente.webp", cap: ["saluda"],
      neb: "Yo llevo las cuentas. Vosotros, el viaje.",
      cuerpo: '<div class="pr-logo"><span class="fc-marca">◈ STARGATE</span><span class="fc-lema">La Bitácora Estelar</span></div>' +
        '<h1>Bienvenidos a bordo, <em>Comandantes</em></h1>' +
        '<p class="pr-sub">Desde hoy dirigís <b>La Constancia</b>, la nave de STARGATE. Vuestro alumnado embarca con vosotros, y el viaje dura quince semanas.</p>' +
        '<p class="pr-pie">Pasa con <b>→</b> · la barra de abajo salta a cualquier parte</p>' }) };
  }
  function encargo() {
    return { rot: "El encargo", html: escena({ bg: "aula_encendida.webp", cap: ["senala", "Enseñáis gamificación. Esta vez la vais a vivir."],
      cuerpo: '<div class="kicker">El encargo</div>' +
        '<h2>Predicar con el ejemplo… sin que os cueste una tarde</h2>' +
        '<div class="pr-vs">' +
          '<div class="pr-vs-c mal"><b>Gamificar a mano</b><ul><li>Inventar la historia y el mundo</li><li>Diseñar insignias y recompensas</li><li>Apuntar puntos semana a semana</li><li>Corregir y validar entregas</li><li>Preparar cada clase</li></ul></div>' +
          '<div class="pr-vs-c bien"><b>A bordo de La Constancia</b><ul><li>La historia, los vídeos y los retos ya están</li><li>Cada recluta registra lo que hace</li><li>El sistema calcula y reparte</li><li>La sesión de cada semana viene montada</li><li>Vosotros, a disfrutar la clase</li></ul></div>' +
        '</div>' +
        '<div class="pr-cifra"><b>≈ 0</b><span>minutos extra a la semana. Ese es el reto de este proyecto: que gamificar no sea una carga, sino un viaje que se disfruta.</span></div>' }) };
  }
  function historia() {
    var v = (((SEMS[0] || {}).videos || [])[0] || [])[0] || {};
    return { rot: "La historia", html: escena({ cls: "pr-video", bg: "mundo_silencio.webp", cap: ["brazos", "Esto es lo que ve vuestro alumnado el primer día."],
      cuerpo: '<div class="kicker">La señal de auxilio</div>' +
        '<h2>La Estática está apagando la galaxia</h2>' +
        (v.id ? '<div class="pr-marco"><button type="button" class="pr-play" data-video="' + esc(v.id) + '" data-video-t="' + esc(v.titulo || "") + '">' +
            '<img src="https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg" alt="" loading="lazy">' +
            '<span class="pr-play-b">▶</span></button></div>'
          : '<p class="muted">El vídeo de bienvenida está en la Cronología.</p>') }) };
  }
  function nombres() {
    return { rot: "Cuatro nombres", html: escena({ bg: "flotas.webp",
      cuerpo: '<div class="kicker">Los cuatro nombres que hay que saberse</div>' +
        '<h2>Y no hay que estudiárselos: salen solos</h2>' +
        '<div class="pr-cartas pr-cuatro">' +
          '<figure class="pr-c"><img src="assets/img/personajes/nebula.png" alt="">' +
            '<figcaption><b>NEBULA</b><span>La inteligencia de la nave. Guía el viaje y presenta cada cosa nueva en la Nave del alumnado.</span></figcaption></figure>' +
          '<figure class="pr-c"><img src="assets/img/personajes/vaeon.png" alt="">' +
            '<figcaption><b>La Estática · General Vaeon</b><span>La amenaza. Donde entra, la gente deja de crear, registrar y compartir. Se combate <b>dejando constancia</b>.</span></figcaption></figure>' +
          '<figure class="pr-c"><img src="assets/img/capitan/saluda.png" alt="">' +
            '<figcaption><b>Capitán de la Nave</b><span>El veterano al mando de La Constancia. Da las órdenes de cada misión en los vídeos y os guía en la visita de vuestra Nave.</span></figcaption></figure>' +
          '<figure class="pr-c pr-cmd"><img src="assets/img/avatares/comandantes/recorte_hd/c1.webp" alt="">' +
            '<figcaption><b>Comandante STARGATE · sois vosotros</b><span>Cada docente es el Comandante de su grupo: <b>elegís avatar</b> y nombre, firmáis la orden de cada semana y entráis por vuestra <b>Nave del Comandante</b>.</span></figcaption></figure>' +
        '</div>' }) };
  }
  function comandantes() {
    var C = PRE.comandantes || [];
    return { rot: "Vuestro comandante", html: escena({ cls: "pr-cmds", bg: "capitan_ventana.webp",
      neb: "Os lo cambio en cualquier momento: el lápiz de vuestra ficha.",
      cuerpo: '<div class="kicker">Solo para el profesorado</div>' +
        '<h2>' + C.length + ' comandantes. Uno es vuestra cara</h2>' +
        '<div class="pr-cmd-dos"><div class="pr-cmd-rej">' + C.map(function (k) {
          return '<img loading="lazy" src="assets/img/avatares/comandantes/retrato/' + esc(k) + '.jpg" alt="">'; }).join("") + '</div>' +
        '<div class="pr-cmd-poses">' + [["duda", "La pregunta"], ["reto", "Los retos"], ["saludo", "La despedida"]].map(function (p) {
          return '<figure><img loading="lazy" src="assets/img/avatares/comandantes/cuerpo/c7_' + p[0] + '.webp" alt=""><figcaption>' + p[1] + '</figcaption></figure>'; }).join("") + '</div></div>' +
        porque('Vuestro alumnado os ve <b>dentro de la historia</b> cada semana —en el mensaje, en la pregunta de la clase, en los retos— sin tener que poner una foto. Y cada comandante tiene tres poses de cuerpo entero.') }) };
  }
  function material() {
    var n = PRE.cifras || {};
    var X = [[n.videos, "vídeos", "la serie entera, con subtítulos"], [n.fondos, "fondos", "para vuestros Geniallys"],
             [9, "planetas", "los ocho temas y la Estática"], [n.heroes, "héroes", "de la Rebelión, en tres rangos"],
             [n.cartas, "cartas", "del álbum, en cinco series"], [n.insignias, "insignias", "diseñadas una a una"],
             [n.comandantes, "comandantes", "para el profesorado"], [n.ejemplos, "ejemplos", "uno por reto"]];
    return { rot: "Ya está hecho", html: escena({ cls: "pr-material", bg: "material_fondos.webp", cap: ["pulgar", "Todo esto viaja con vosotros. No hay que crear nada."],
      cuerpo: '<div class="kicker">El material</div>' +
        '<h2>Todo esto ya está hecho</h2>' +
        '<div class="pr-cifras">' + X.map(function (x) { return x[0] ? '<div><b>' + esc(String(x[0])) + '</b><span>' + esc(x[1]) + '</span><em>' + esc(x[2]) + '</em></div>' : ''; }).join("") + '</div>' +
        porque('Gamificar de verdad pide un mundo entero, y un mundo entero lleva meses. Aquí ya existe: los vídeos, los fondos y las insignias están en el <b>Drive del equipo</b> para vuestros Geniallys.') }) };
  }
  function semanaABordo() {
    return { rot: "Una clase a bordo", html: escena({ bg: "pasillo.webp", cap: ["tablet", "Pulsáis «Empezar la clase». Lo demás viene montado."],
      cuerpo: '<div class="kicker">Cada semana</div>' +
        '<h2>Una clase a bordo, en tres tiempos</h2>' +
        '<div class="pr-tiempos">' +
          '<figure><img loading="lazy" src="assets/img/sesion/portada.jpg" alt=""><figcaption><b>1 · Apertura</b>La portada, la llamada a filas, la pregunta de la clase, el mensaje y quién ha movido ficha.</figcaption></figure>' +
          '<figure><img loading="lazy" src="assets/img/sesion/despegue.jpg" alt=""><figcaption><b>2 · Despegue</b>Vuestro Genially de siempre: la teoría y la práctica guiada.</figcaption></figure>' +
          '<figure><img loading="lazy" src="assets/img/sesion/tripulante.jpg" alt=""><figcaption><b>3 · Cierre</b>Los retos, el tripulante de la semana, las misiones y el cierre del planeta.</figcaption></figure>' +
        '</div>' +
        porque('La clase ya no empieza con «abrid el PDF»: empieza en una nave. Y la parte gamificada no os quita tiempo de temario: va antes y después.') }) };
  }
  function unReto() {
    var R = PRE.reto || {};
    return { rot: "Un reto, entero", html: escena({ cls: "pr-reto", bg: "assets/img/tripulacion/P1_bran.webp",
      neb: "Y el fragmento de Bran solo lo verá quien lo haga.",
      cuerpo: '<div class="kicker">Un reto, de principio a fin</div>' +
        '<h2>«' + esc(R.nombre || "") + '»</h2>' +
        '<p class="pr-reto-tipo">Relámpago · Tema 1 · en clase, quince minutos</p>' +
        '<div class="pr-reto-dos"><div class="pr-reto-ficha"><p>' + esc(R.ayuda || "") + '</p>' +
          '<ul class="pr-reto-premio"><li><b>' + esc(String(R.xp || "")) + ' xp</b> y <b>' + esc(String(R.creditos || "")) + ' ◈</b></li>' +
          '<li>' + (R.insignias || []).map(function (b) { return '<img src="assets/img/insignias/' + esc(b) + '.webp" alt="">'; }).join("") + '<span>dos insignias</span></li>' +
          '<li><img src="assets/img/tarjetas/P1_bran_carta.webp" alt="" class="pr-reto-carta"><span>y recupera a <b>Bran Okafor</b>, con su fragmento de vídeo</span></li></ul></div>' +
        (R.ejemplo ? '<figure class="pr-reto-ej"><img loading="lazy" src="assets/img/ejemplos/' + esc(R.ejemplo) + '" alt=""><figcaption>Cada reto trae un ejemplo resuelto</figcaption></figure>' : '') + '</div>' +
        porque('Es <b>práctico</b> (crear, diseñar, encontrar), se hace <b>en clase</b> y deja hecho un trozo de la Actividad 1. El juego empuja; el aprendizaje es el de siempre.') }) };
  }
  function comoSeGana2() {
    var x = comoSeGana(); x.html = x.html.replace('<div class="dia">', '<div class="dia pr-esc"><div class="pr-fondo" style="background-image:url(\'assets/img/pres/cero_ensenando.webp\')"></div><div class="pr-cuerpo">') + '</div>';
    return x;
  }
  function bitacora2() {
    var x = bitacora(); x.html = x.html.replace('<div class="dia">', '<div class="dia pr-esc"><div class="pr-fondo" style="background-image:url(\'assets/img/pres/sala_bitacora.webp\')"></div><div class="pr-cuerpo">') + '</div>';
    return x;
  }
  function heroes() {
    var H = PRE.heroes || [];
    var rango = function (r) { return /legend/i.test(r) ? "Mito" : /[ée]pica/i.test(r) ? "Vanguardia" : "Resistencia"; };
    return { rot: "Héroes", html: escena({ cls: "pr-heroes", bg: "hangar.webp", cap: ["brazos", "La Rebelión no lucha sola. Cada recluta elige a su héroe."],
      cuerpo: '<div class="kicker">Héroes de la Rebelión</div>' +
        '<h2>' + H.length + ' héroes, y se ponen como su cara</h2>' +
        '<div class="pr-her">' + H.slice(0, 14).map(function (h) {
          return '<figure class="r-' + rango(h[2]).toLowerCase() + '"><img loading="lazy" src="assets/img/heroes/' + esc(h[0]) + '.jpg" alt=""><figcaption>' + esc(rango(h[2])) + '</figcaption></figure>'; }).join("") + '</div>' +
        porque('Llegan en <b>cápsulas</b> (desde ' + esc(String(PRE.precios && PRE.precios.capsula || "")) + ' ◈) y en tres rangos: la Resistencia, la Vanguardia y los <b>Mitos</b>, que ni se dejan ver. Dan identidad y ganas de volver, <b>sin tocar la nota</b>.') }) };
  }
  function cromos() {
    var CR = CROMOS.slice(0, 6);   // una fila: con dos, el porqué se salía por abajo
    return { rot: "Sobres y Zoco", html: escena({ cls: "pr-cromos", bg: "galaxia_saber.webp", neb: "Las repetidas no se tiran: tres por un sobre nuevo.",
      cuerpo: '<div class="kicker">El álbum de la tripulación</div>' +
        '<h2>Sobres de cromos, y un Zoco para cambiarlos</h2>' +
        '<div class="pr-cr-dos"><div class="pr-cr">' + CR.map(function (c, i) {
          return '<img loading="lazy" style="--i:' + i + '" src="assets/img/tarjetas/' + esc(c[0]) + '_carta.webp' + esc(window.SG_CARDV || "") + '" alt="">'; }).join("") + '</div>' +
          '<div class="pr-cr-lado"><img loading="lazy" src="assets/img/canje/sobre.jpg" alt=""><img loading="lazy" src="assets/img/capturas/zoco.webp" alt=""></div></div>' +
        porque('Un sobre cuesta ' + esc(String(PRE.precios && PRE.precios.sobre || "")) + ' ◈ y trae tres cartas con la historia de la Cero. <b>Coleccionar crea el hábito de volver</b> cada semana, y el <b>Zoco</b> les obliga a hablar entre ellos: cooperar para completar el álbum.') }) };
  }
  function sorteo() {
    var S = PRE.sorteo || {};
    return { rot: "El Gran Sorteo", html: escena({ cls: "pr-sorteo", bg: "perfil_en_vuelo.webp", cap: ["pulgar", "Un premio de verdad, para docentes de verdad."],
      cuerpo: '<div class="kicker">El Gran Sorteo</div>' +
        '<h2>' + esc(S.premio || "Licencias de Genially") + '</h2>' +
        '<div class="pr-sor"><img loading="lazy" src="assets/img/canje/sorteo.jpg" alt=""><ul>' +
          '<li>Cada <b>participación</b> es una papeleta: se compra con créditos en el Mercado.</li>' +
          '<li>Se sortea <b>solo</b>, en la semana ' + esc(String(S.semana || 16)) + ': al entrar en su Nave, ven el resultado.</li>' +
          '<li>Vosotros no tenéis que hacer nada.</li></ul></div>' +
        porque('Es el único premio que sale del juego a la vida real, y es una herramienta que van a usar en su aula. Mantiene vivos los créditos hasta el final… <b>sin que nada de esto sea nota</b>.') }) };
  }
  function rankings2() {
    var x = rankings(); x.html = x.html.replace('<div class="dia">', '<div class="dia pr-esc pr-rank-esc"><div class="pr-fondo" style="background-image:url(\'assets/img/pres/flotas.webp\')"></div><div class="pr-cuerpo">') + '</div>';
    return x;
  }
  function nota() {
    var N = (PRE.precios && PRE.precios.nota) || [];
    return { rot: "Subir la nota", html: escena({ cls: "pr-nota", bg: "mesa_plan.webp", cap: ["senala", "Casi al final, se abre el Arsenal."],
      neb: "Y si alguien ya tiene la nota máxima, se lo aviso antes de que gaste nada.",
      cuerpo: '<div class="kicker">El Arsenal de batalla · semana ' + esc(String(PRE.arsenal || "")) + '</div>' +
        '<h2>Subir la nota se descubre al final</h2>' +
        '<div class="pr-arsenal">' + N.map(function (x) { return '<div><b>' + esc(x[0]) + '</b><span>' + mil(x[1]) + ' ◈</span></div>'; }).join("") + '</div>' +
        porque('Es lo único que <b>pide algo de trabajo</b>: cada subida espera en la <b>Cola de nota</b> hasta que la aprobáis (dos clics). Cuesta tanto que esperamos <b>pocas por escuadrón</b>: quien la elige renuncia a casi todo lo demás.') }) };
  }
  function queHace2() {
    var x = queHaceElDocente(); x.html = x.html.replace('<div class="dia">', '<div class="dia pr-esc con-capi"><div class="pr-fondo" style="background-image:url(\'assets/img/pres/hangar.webp\')"></div>' +
      '<figure class="pr-capi"><img src="assets/img/capitan/pulgar.png" alt="El Capitán de la Nave"><figcaption><b>El Capitán</b>Vosotros al mando. Las cuentas, para NEBULA.</figcaption></figure><div class="pr-cuerpo">') + '</div>';
    return x;
  }
  function loQueNo2() {
    var x = loQueNo(); x.html = x.html.replace('<div class="dia">', '<div class="dia pr-esc"><div class="pr-fondo" style="background-image:url(\'assets/img/pres/pasillo.webp\')"></div><div class="pr-cuerpo">') + '</div>';
    return x;
  }
  function preguntas2() {
    var x = preguntas(); x.html = x.html.replace('<div class="dia">', '<div class="dia pr-esc con-capi"><figure class="pr-capi"><img src="assets/img/capitan/pensativo.png" alt="El Capitán de la Nave"><figcaption><b>El Capitán</b>Preguntad sin miedo. Yo también pregunté.</figcaption></figure><div class="pr-cuerpo">') + '</div>';
    return x;
  }
  function siguiente2() {
    var x = siguiente(); x.html = x.html.replace('<div class="dia">', '<div class="dia pr-esc"><div class="pr-fondo" style="background-image:url(\'assets/img/pres/perfil_en_vuelo.webp\')"></div><div class="pr-cuerpo">') + '</div>';
    return x;
  }
  /** 24-sep · Norberto: «dedica una diapo al simulador de Joran, es caviar». */
  function simulador() {
    return { rot: "El Simulador", html: escena({ cls: "pr-sim", bg: "assets/img/batalla/sala.jpg", neb: "Y el día del examen, llegan entrenados.",
      cuerpo: '<div class="kicker">El Simulador de Joran · se abre con Ludo</div>' +
        '<h2>Repasar para el examen… ganando una batalla</h2>' +
        '<div class="pr-sim-dos"><div class="pr-sim-rival"><img src="assets/img/batalla/rival.jpg" alt="RUTA AZUL"><img class="pr-sim-joran" src="assets/img/batalla/joran.jpg" alt="Joran Pike"></div>' +
          '<ul class="pr-sim-l"><li><b>RUTA AZUL</b>, un rival hecho de luz, pregunta por todo lo recorrido: imágenes, logotipos, esquemas, huecos que rellenar.</li>' +
          '<li>Cada acierto es un golpe; cada fallo, <b>Joran lo corrige</b> ahí mismo. Es una batalla, pero sobre todo es repaso.</li>' +
          '<li>Quien le gana se queda el simulador: <b>entrenar tema a tema</b>, tres niveles, su ranking y tres reconocimientos (el más rápido, el más certero y quien más sabe).</li>' +
          '<li>Vosotros lo abrís en <b>modo ensayo</b> para jugarlo en clase, sin que cuente.</li></ul></div>' +
        porque('Joran convertía los simulacros en juegos, y los niños del refugio escaparon riendo por una ruta que se sabían de memoria. Eso es esto: <b>el ensayo general del examen</b>, sin que parezca estudiar.') }) };
  }
  /** 24-sep · Norberto: «sé que son muchas cosas, pero no os preocupéis… se desbloquea algo nuevo poco a poco». */
  function tranquilos() {
    var x = capitulos();
    x.rot = "Poco a poco";
    // la frase es la diapositiva: la dice el Capitán, en grande, y los capítulos son la prueba de que es verdad
    x.html = x.html.replace('<div class="dia">', '<div class="dia pr-esc con-capi pr-tranq"><div class="pr-fondo" style="background-image:url(\'assets/img/pres/puente.webp\')"></div>' +
      '<figure class="pr-capi"><img src="assets/img/capitan/pulgar.png" alt="El Capitán de la Nave"></figure><div class="pr-cuerpo">' +
      '<blockquote class="pr-tranq-q"><b>El Capitán</b>«Sé que son muchas cosas. No os preocupéis: cada sesión está programada para que se desbloquee algo nuevo, poco a poco. Aprenderéis al ritmo de vuestros reclutas».</blockquote>')
      .replace(/<div class="kicker">[^<]*<\/div>\s*<h2>[^<]*<\/h2>/, '') + '</div>';
    return x;
  }
  function cierre() {
    return { rot: "Cierre", html: escena({ cls: "pr-portada2 pr-cierre", bg: "cero_puerta.webp", neb: "Lo que se comparte no se apaga.",
      cuerpo: '<div class="pr-logo"><span class="fc-marca">◈ STARGATE</span><span class="fc-lema">La Bitácora Estelar</span></div>' +
        '<h1>Buen viaje, <em>Comandantes</em></h1>' +
        '<p class="pr-sub">Una obra que no se documenta, no existe. Eso es lo único que hay que contarles: lo demás lo hace la nave.</p>' }) };
  }

  /**
   * 🔴 21-sep · Norberto: «la Bitácora merece una diapositiva completa. Enlaza con la plantilla de Genially».
   * Es la pieza que más cuesta que se entienda en una reunión: parece decorado y **es el ePortfolio evaluable**. Así
   * que va sola, con el patrón de cada página, lo que acaba dentro (las dos Actividades salen del dato) y el enlace
   * a la plantilla, para que nadie tenga que montarla de cero.
   */
  function bitacora() {
    var pl = window.SG_PLANTILLA_EP || "", A = window.SG_ACTIVIDADES || [];
    return { rot: "La Bitácora", html:
      '<div class="dia">' +
        '<div class="kicker"><img class=ico src=assets/img/iconos/p/libro.png alt> El arma de esta guerra</div>' +
        '<h2>La Bitácora Estelar <u>es</u> el ePortfolio</h2>' +
        '<p class="sub">No es decorado sobre el temario: <b>es el temario</b>. La Estática no teme sus notas, teme su '
        + 'archivo — y ese archivo es lo que se evalúa. Se abre en la <b>semana 2</b>, con el reto principal de Fôrge, y '
        + 'se publica al final del viaje.</p>' +
        '<div class="pr-bit2">' +
          '<div class="pr-b-c"><b>Cada página, igual</b>' +
            '<ol class="pr-b-p"><li>La <b>evidencia</b>: lo que ha creado</li><li>El <b>contexto</b>: para quién y para qué</li>' +
            '<li>La <b>reflexión</b>: qué aprendió al crearlo</li><li>La <b>autoevaluación</b>: qué mejoraría</li></ol></div>' +
          '<div class="pr-b-c"><b>Qué acaba dentro</b>' +
            '<ul class="pr-b-l">' + A.map(function (a) {
              return '<li><b>Actividad ' + esc(String(a.n)) + '</b> · ' + esc(a.titulo) + ' <em>(' + esc(a.puntos) + ' pts · el 20 % es esta página)</em></li>';
            }).join("") +
            '<li><b>Tres hazañas más</b>, de sus retos semanales: el videotutorial, la microgamificación y una a su elección</li></ul></div>' +
        '</div>' +
        (pl ? '<p class="pr-b-cta"><a class="btn primary" href="' + esc(pl) + '" target="_blank" rel="noopener">'
              + '<img class=ico src=assets/img/iconos/p/varios.png alt> Abrir la plantilla en Genially &#8599;</a>'
              + '<span>Montada y lista: el alumnado la reutiliza y empieza con la casa hecha.</span></p>' : '') +
      '</div>' };
  }
  function mapa() {
    var T = tripulacion();
    return { rot: "Ocho planetas", html:
      '<div class="dia pr-mapa pr-esc"><div class="pr-fondo" style="background-image:url(\'assets/img/pres/ocho_mundos.webp\')"></div><div class="pr-cuerpo">' +
        '<div class="kicker">Ocho planetas · ocho temas</div>' +
        '<h2>Pulsa un planeta <span class="small muted">— cada mundo es un tema, y en cada uno se quedó alguien</span></h2>' +
        '<div class="pr-planetas">' + PLAN.slice(0, 8).map(function (p, i) {
          var t = T[i] || {};
          return '<button type="button" class="pr-pl" data-pl="' + (i + 1) + '">' +
            // 🔴 sin `loading="lazy"`: proyectado, un planeta que aparece medio segundo tarde se nota
            '<img src="assets/img/planetas/' + esc(p[0]) + '.png' + esc(IMGV) + '" alt="">' +
            '<b>' + esc(p[1]) + '</b><em>' + esc(String(p[2] || "").replace(/^T\d+ · /, "")) + '</em></button>';
        }).join("") + '</div>' +
        '<div class="pr-ficha" id="pr-ficha" hidden></div>' +
      '</div></div>' };
  }
  function fichaPlaneta(n) {
    var p = PLAN[n - 1] || [], T = tripulacion()[n - 1] || {}, r = retosDe(n);
    var s = SEMS.filter(function (x) { return Number(x.tema_n) === n; })[0] || {};
    return '<div class="pr-ficha-c">' +
      // 24-sep · la nave posándose en ese planeta (el clip de KIT_STARGATE, 5 s): se ve una vez y se queda en tierra
      '<video class="pr-ficha-v" src="assets/video/' + esc(p[0]) + '_llegada.mp4" poster="assets/img/fondos/' + esc(p[0]) + '_llegada.webp" muted playsinline' + (QUIETO ? '' : ' autoplay') + ' aria-hidden="true"></video>' +
      '<div class="pr-ficha-t"><div class="eyebrow teal">Tema ' + n + ' · ' + esc(semanasDe(n)) + '</div>' +
        '<h3>' + esc(p[1]) + '</h3>' +
        '<p>' + esc(s.sub || String(p[2] || "").replace(/^T\d+ · /, "")) + '</p>' +
        (T.nombre ? '<p class="pr-tripu"><img src="assets/img/tarjetas/' + esc(T.clave) + '_carta.png' + esc(window.SG_CARDV || "") + '" alt="" loading="lazy">' +
          '<span>Aquí se quedó <b>' + esc(T.nombre) + '</b>. Quien hace el <b>relámpago</b> del tema, en clase, lo recupera y desbloquea su fragmento de vídeo.</span></p>' : '') +
        '<ul class="fc-ordenes">' +
          (r.L ? '<li><b>Relámpago</b> ' + esc(r.L.titulo) + ' — en clase, recupera al tripulante</li>' : '') +
          (r.B ? '<li><b>Reto principal</b> ' + esc(r.B.titulo) + ' — en casa, la experiencia del portfolio</li>' : '') +
        '</ul></div></div>';
  }
  function semanas() {
    return { rot: "15 semanas", html:
      '<div class="dia pr-semanas">' +
        '<div class="kicker">El curso entero</div>' +
        '<h2>' + SEMS.length + ' semanas, y el sistema sabe en cuál va cada grupo</h2>' +
        '<p class="small muted">Se pone la fecha del primer día y ya está: cada semana se abre lo que toca, sin tocar nada.</p>' +
        '<div class="pr-linea">' + SEMS.map(function (s) {
          // 🔴 la última semana no tiene tema (es el repaso): sin planeta de tema, o salía con el de Fôrge. 24-sep · lleva
          // el de la Estática (Norberto: «tenemos un planeta de la Estática, mete esa imagen en la semana 15»)
          var t = Number(s.tema_n) || 0, pl = t ? (PLAN[t - 1] || []) : (s.planeta || []);
          return '<div class="pr-sem' + (s.tema_n ? '' : ' fin') + '" title="' + esc(s.sub || "") + '">' +
            '<span class="pr-sem-n">' + s.sem + '</span>' +
            (pl[0] ? '<img src="assets/img/planetas/' + esc(pl[0]) + '.png' + esc(IMGV) + '" alt="">' : '<span class="pr-sem-fin">◈</span>') +
            '<em>' + esc(t ? (pl[1] || "") : "La liberación") + '</em></div>';
        }).join("") + '</div>' +
      '</div>' };
  }
  /**
   * 🔴 21-sep · «Aparece semana UNDEFINED. Debe aparecer qué semana se desbloquea y qué es cada cosa (brevemente)».
   * Cada capítulo guarda su semana por tipo de grupo (`semanas.REGULAR` / `.PUA`) — `c.semana`, a secas, nunca
   * existió— y su `cabecera`, que es justo esa línea de «qué es» que faltaba. Y en orden de apertura, que es como se
   * cuenta: la Nave crece, no aparece entera.
   */
  function capitulos() {
    var abiertos = CAPS.filter(function (c) { return c.listo !== false; })
      .map(function (c) { return { c: c, s: Number((c.semanas || {}).REGULAR) || 0 }; })
      .sort(function (a, b) { return a.s - b.s; });
    return { rot: "Por capítulos", html:
      '<div class="dia">' +
        '<div class="kicker">Nadie se agobia el primer día</div>' +
        '<h2>La Nave se abre por capítulos</h2>' +
        '<p class="small muted">Lo que todavía no toca <b>ni se ve</b>. Cada vez que se abre algo, NEBULA lo presenta.</p>' +
        '<div class="pr-caps">' + abiertos.map(function (x, i) {
          return '<div class="pr-cap" style="--i:' + i + '"><b>Semana ' + x.s + '</b>' +
            '<span>' + (x.c.icono || "") + ' ' + esc(x.c.titulo || x.c.clave) + '</span>' +
            '<em>' + esc(x.c.cabecera || "") + '</em></div>';
        }).join("") + '</div>' +
      '</div>' };
  }
  function comoSeGana() {
    return { rot: "Cómo se gana", html:
      '<div class="dia">' +
        '<div class="kicker">Las mecánicas, en una diapositiva</div>' +
        '<h2>Dos monedas, dos retos por tema y un tope</h2>' +
        '<div class="pr-dos">' +
          '<div class="pr-m pr-m-xp"><b>xp</b><span>Suben de nivel y <b>no se gastan nunca</b>. Marcan el rango y hacen evolucionar al personaje.</span></div>' +
          '<div class="pr-m pr-m-cred"><b>créditos ◈</b><span>Es lo que se canjea: cartas, héroes, adornos y —al final— subidas de nota.</span></div>' +
        '</div>' +
        '<div class="pr-tres">' +
          '<div class="pr-t"><b>Relámpago</b><span>15 minutos, en clase · recupera al tripulante</span></div>' +
          '<div class="pr-t"><b>Reto principal</b><span>en casa · la experiencia del portfolio · <b>pide el enlace</b></span></div>' +
          '<div class="pr-t"><b>20 retos</b><span>dos por tema (tres en Fôrge) y tres extras · nunca más de uno en casa por semana</span></div>' +
        '</div>' +
        '<p class="pr-cita">Nadie registra más de <b>' + (window.SG_TOPE_SEMANA || 3) + ' retos por semana</b>. No se puede hacer el curso en una tarde.</p>' +
      '</div>' };
  }
  function rankings() {
    var R = ["más xp", "esta semana", "colección", "constancia", "insignias", "explorador", "relámpago",
             "logros de a bordo", "quien más sabe", "el más certero", "el más rápido", "escuadrones", "el duelo"];
    return { rot: "Rankings", html:
      '<div class="dia">' +
        '<div class="kicker">Trece maneras de destacar</div>' +
        '<h2>Si no destacas en una, destacas en otra</h2>' +
        '<div class="pr-rank">' + R.map(function (x) { return '<span class="pr-r">' + esc(x) + '</span>'; }).join("") + '</div>' +
        '<p class="pr-cita">Están para <b>ensalzar en clase</b>, no para señalar. Proyectad uno y decid el alias en voz alta: treinta segundos.</p>' +
      '</div>' };
  }
  function queHaceElDocente() {
    return { rot: "Qué hacéis vosotros", html:
      '<div class="dia">' +
        '<div class="kicker">Lo que de verdad os toca</div>' +
        '<h2>Tres momentos, y dos de ellos son «nada»</h2>' +
        '<div class="pr-tres pr-tres-g">' +
          '<div class="pr-t"><b>Antes de clase</b><span>Nada. Como mucho, mirar el Puente treinta segundos: NEBULA dice a quién hay que dar un empujón.</span></div>' +
          '<div class="pr-t on"><b>En clase</b><span><b>Empezar la clase</b> y pasar diapositivas. Dentro está todo lo de directo: premiar, una pregunta, una votación, el tiempo.</span></div>' +
          '<div class="pr-t"><b>Después</b><span>Nada. Salvo que alguien pida subir nota: se aprueba en dos clics.</span></div>' +
        '</div>' +
        '<p class="pr-cita">Vosotros no apuntáis nada. Ellos registran, el sistema calcula y vuestra clase tiene algo que celebrar.</p>' +
      '</div>' };
  }
  function loQueNo() {
    return { rot: "Lo que NO", html:
      '<div class="dia">' +
        '<div class="kicker">Para quedarse tranquilo</div>' +
        '<h2>Lo que <u>no</u> hay que hacer</h2>' +
        '<div class="pr-no">' +
          '<div class="pr-n"><b>No hay que apuntar puntos</b><span>ni llevar una hoja, ni contar insignias</span></div>' +
          '<div class="pr-n"><b>No hay que crear nada</b><span>los retos, los planetas, la tienda y el calendario vienen sembrados</span></div>' +
          // 🔴 21-sep · Norberto: «esto es mentira, no es necesario validar. Si el docente tiene dudas de la
          // veracidad, puede consultar el enlace y anular su entrega». El reto lo registra el propio recluta y
          // cuenta al instante: aquí no hay bandeja de correcciones, solo la posibilidad de deshacer.
          '<div class="pr-n"><b>No hay que validar nada</b><span>el reto lo registra el recluta y cuenta solo; si dudas, abres su enlace y lo anulas con un motivo</span></div>' +
          '<div class="pr-n"><b>No pasa nada si un día falla</b><span>el curso no depende de la web: la clase sigue</span></div>' +
        '</div>' +
      '</div>' };
  }
  var PREGUNTAS = [
    ["¿Esto me da más trabajo?", "Menos. No se apunta nada a mano y la sesión viene montada. Lo que sí pide son treinta segundos de ceremonia en clase: decir el alias en voz alta."],
    ["¿Y si alguien hace trampas?", "Todos los retos piden el enlace, hay tope semanal y cada reto se puede anular con un motivo que le llega a su Nave. Y ninguna nota sube sin vuestro visto bueno."],
    ["¿Los puntos son la nota?", "No. Los xp y los créditos son del juego. La nota sale de las actividades y del examen, como siempre."],
    ["¿Tengo que saberme la historia?", "No. Cada semana tenéis el mensaje del foro ya escrito y la sesión proyectada la cuenta sola."],
    ["¿Y si no me gusta la gamificación?", "Usad solo la parte operativa: la sesión montada, los enlaces y el seguimiento. Su Nave la tendrán igual."]
  ];
  function preguntas() {
    return { rot: "Preguntas", html:
      '<div class="dia">' +
        '<div class="kicker">Las que siempre salen</div>' +
        '<h2>Pulsa una <span class="small muted">— y contesta tú antes de abrirla</span></h2>' +
        '<div class="pr-preg">' + PREGUNTAS.map(function (p, i) {
          return '<button type="button" class="pr-q" data-q="' + i + '" aria-expanded="false">' +
            '<b>' + esc(p[0]) + '</b><span class="pr-a">' + esc(p[1]) + '</span></button>';
        }).join("") + '</div>' +
      '</div>' };
  }
  function siguiente() {
    var per = window.SG_PER_ESCUELA || "nave-escuela";
    return { rot: "El paso siguiente", html:
      '<div class="dia">' +
        '<div class="kicker">Antes de la primera clase</div>' +
        '<h2>Cuatro cosas, y ninguna lleva más de diez minutos</h2>' +
        '<ol class="pr-pasos">' +
          '<li><b>Entrad</b> en <b>stargate.mistercuarter.es</b> con la cuenta de la universidad y comprobad que veis vuestro grupo. Si no, avisad: es el correo.</li>' +
          '<li><b>Haced la visita guiada</b> del Capitán, arriba a la derecha. Dos minutos.</li>' +
          '<li><b>Trastead la Nave Escuela</b>: un grupo entero con 30 estudiantes de mentira donde no se rompe nada. ' +
            '<a class="btn min" href="consola.html?per=' + esc(per) + '" target="_blank" rel="noopener">Abrirla ↗</a></li>' +
          '<li><b>Leed la Parte B</b> de la guía del profesorado. Veinticinco minutos.</li>' +
        '</ol>' +
      '</div>' };
  }
  /**
   * 🔴 21-sep · LOS ENLACES DE INTERÉS. Norberto: «añade una diapo con enlaces de interés (Drive compartido, carpeta
   * de geniallys actualizados y plataforma STARGATE). ¿Me dejo alguno?». Sí: el panel que se proyecta, los enunciados
   * y rúbricas, la plantilla de la Bitácora, los vídeos y la Nave Escuela. Es la diapositiva que la gente fotografía,
   * así que cada tarjeta enseña la dirección entera —legible desde el fondo del aula— y se puede pulsar.
   *
   * Las direcciones salen de `SG_ENLACES` (de `_site_data.py`): aquí no hay ni una escrita a mano.
   */
  function enlaces() {
    var L = window.SG_ENLACES || [];
    return { rot: "Enlaces", html:
      '<div class="dia">' +
        '<div class="kicker"><img class=ico src=assets/img/iconos/p/enlace.png alt> Guardaos esto</div>' +
        '<h2>Dónde está cada cosa</h2>' +
        '<div class="pr-enl">' + L.map(function (e, i) {
          // la dirección, sin el «https://» que no aporta nada; lo que no quepa lo recorta la hoja de estilos,
          // que sabe el ancho de la columna mejor que yo (y el título ya lleva la flecha de «se abre fuera»)
          var corto = String(e[3]).replace(/^https?:\/\//, "").replace(/\/$/, "");
          return '<a class="pr-e" style="--i:' + i + '" href="' + esc(e[3]) + '" target="_blank" rel="noopener">' +
            '<img class=ico src="assets/img/iconos/p/' + esc(e[0]) + '.png" alt>' +
            '<b>' + esc(e[1]) + ' &#8599;</b><span>' + esc(e[2]) + '</span>' +
            '<em title="' + esc(e[3]) + '">' + esc(corto) + '</em></a>';
        }).join("") + '</div>' +
        '<p class="sub">Todo esto vive también en <b>tu Nave</b>, en la sección <b>Enlaces</b>. Y si algo no se abre, ' +
        'escribid al Mando desde <b>Contacto</b>: es el mismo sitio donde se piden cosas.</p>' +
      '</div>' };
  }

  // ───────────────────────────────────────────────────────────── 24-sep · REFERENTES O DOCENTES
  /**
   * 🔴 24-sep · DOS PRESENTACIONES EN UNA. Norberto: «la semana que viene empezaré una reunión con los profes referentes…
   * al empezar, dos botones: presentación para referentes o para docentes. Si es para docentes, enseñamos lo que tenemos;
   * si es para referentes, añade al principio cuál es el proceso para crear grupos y añadir profes» · «para referentes
   * deben estar todos los retos explicados uno a uno por tema» · «en el de profes normales, capturas de iniciar sesión y
   * cómo cambiar el Genially del grupo o los mensajes del foro: es algo que muchos harán».
   * La elección vive en la dirección (?para=referentes|docentes): se puede enlazar directa y sobrevive a recargar.
   */
  var MODO = (function () { var m = new URLSearchParams(location.search).get("para"); return m === "referentes" || m === "docentes" ? m : ""; })();
  function elegir(m) {
    MODO = m; SLIDES = []; st.i = 0;
    try { var u = new URL(location.href); u.searchParams.set("para", m); history.replaceState(null, "", u.toString()); } catch (e) {}
    pintar();
  }
  function selector() {
    return '<div class="mazo pr-mazo" id="mazo" tabindex="0"><div class="lienzo">' +
      '<div class="dia pr-esc pr-elige"><div class="pr-fondo" style="background-image:url(\'assets/img/pres/puente.webp\')"></div><div class="pr-cuerpo">' +
        '<div class="pr-logo"><span class="fc-marca">◈ STARGATE</span><span class="fc-lema">La Bitácora Estelar</span></div>' +
        '<h1>¿A quién se la presentamos?</h1>' +
        '<div class="pr-elige-b">' +
          '<button type="button" class="pr-elige-o" data-para="docentes"><img src="assets/img/capitan/saluda.png" alt="">' +
            '<b>Para docentes</b><span>Lo esencial y lo que enamora: la historia, el material, un reto entero y las recompensas; cómo se entra, se cambia el Genially y el mensaje del foro. Lo demás se descubre semana a semana.</span></button>' +
          '<button type="button" class="pr-elige-o ref" data-para="referentes"><img src="assets/img/capitan/tablet.png" alt="">' +
            '<b>Para referentes</b><span>La radiografía completa: crear y gestionar grupos, cada pantalla de la web con su captura, lo que ve el alumnado y todos los retos explicados uno a uno, tema a tema.</span></button>' +
        '</div></div></div>' +
      '</div></div>';
  }
  /** Una diapositiva de «cómo se hace»: la captura (de la guía, anotada con sus números) y los pasos al lado. */
  function comoSeHace(o) {
    return { rot: o.rot, html: escena({ cls: "pr-como", bg: o.bg || "", cap: o.cap || null,
      cuerpo: '<div class="kicker">' + o.kicker + '</div><h2>' + o.titulo + '</h2>' +
        '<div class="pr-como-dos"><figure class="pr-como-cap"><img src="assets/img/pres/guia/' + o.img + '.webp" alt="" loading="lazy"></figure>' +
        '<div class="pr-como-t"><ol class="pr-como-pasos">' + o.pasos.map(function (x) { return '<li>' + x + '</li>'; }).join("") + '</ol>' +
        (o.nota ? '<p class="pr-como-nota">' + o.nota + '</p>' : '') + '</div></div>' }) };
  }
  // ── para referentes, al principio: vuestro papel y el grupo de principio a fin
  function refPapel() {
    return { rot: "Vuestro papel", html: escena({ bg: "mesa_plan.webp", cap: ["tablet", "Una vez por curso, y en diez minutos."],
      cuerpo: '<div class="kicker">Solo referentes</div><h2>El referente monta el grupo. Lo demás, la nave</h2>' +
        '<ul class="pr-ref-l">' +
          '<li><b>Crea los grupos</b>: menú → <b>Crear grupo</b>. En segundos queda sembrado entero.</li>' +
          '<li><b>Gestionar grupos</b>, en la barra de arriba: el <b>equipo docente</b>, los <b>escuadrones</b>, los <b>ajustes</b>, el <b>calendario</b>, mover reclutas, graduar y borrar. Lo que se hace una o dos veces por curso.</li>' +
          '<li>En su Nave, además: <b>Premios</b>, <b>Sorteos</b> y <b>Ofertas</b>; y en la ficha de cada recluta, <b>congelar</b> o <b>dar de baja</b>.</li>' +
          '<li>Un grupo puede tener <b>varios referentes</b>, y un referente puede no impartir: coordina sin escuadrón.</li>' +
        '</ul>' +
        porque('Para ser referente hace falta una <b>invitación de un solo uso</b> de la coordinación del máster: nunca se concede por el nombre, que cualquiera se lo pone en Google.') }) };
  }
  function refCrear() {
    return comoSeHace({ rot: "1 · Crear el grupo", kicker: "Crear un grupo · 1 de 3", titulo: "El grupo: nombre, tipo y primer día", img: "crear",
      pasos: ['<b>El nombre</b> del grupo (se guarda también como identificador).',
              '<b>El tipo</b>: Regular (' + (SEMS.length || 15) + ' semanas) o PUA (8).',
              '<b>El primer día de la semana 1</b>: de ahí salen solas la apertura, los cierres, el canje y el Arsenal.'],
      nota: 'Arriba del formulario dice «Estás como…». Si no es la cuenta de la universidad, <b>cámbiala antes</b>: el grupo queda a su nombre.' });
  }
  function refEquipo() {
    return comoSeHace({ rot: "2 · El equipo", kicker: "Crear un grupo · 2 de 3", titulo: "El equipo docente, y el resumen antes de crear", img: "crear-resumen",
      pasos: ['<b>Cada docente</b>: nombre, <b>correo</b> (es su llave de entrada), si es referente, si imparte y su Genially propio (opcional). Quien esté aquí verá el grupo al entrar con ese correo.',
              '<b>«Lo que se va a crear»</b>: el resumen, con las <b>semanas festivas de la UNIR ya saltadas</b>.',
              '<b>Crear el grupo</b>.'] });
  }
  function refListo() {
    return comoSeHace({ rot: "3 · Grupo listo", kicker: "Crear un grupo · 3 de 3", titulo: "Listo, sembrado entero y con su código", img: "grupo-listo",
      pasos: ['Los <b>retos</b> con sus insignias, los <b>ocho planetas</b>, la <b>tienda</b> con precios y fechas, el <b>álbum</b>, los <b>héroes</b> y el <b>Gran Sorteo</b>: todo ya dentro.',
              'El <b>código de clase</b>, para dictarlo el primer día.',
              '<b>Copiar el enlace de invitación</b>: lo único que hay que repartir. Al foro de UNIR o al chat.'] });
  }
  function refProfes() {
    return comoSeHace({ rot: "Añadir profes", kicker: "Gestionar grupos → Equipo docente", titulo: "Añadir profes (y quitarlos) cuando haga falta", img: "equipo",
      pasos: ['<b>Hacer referente</b> o pasar a docente.',
              '<b>Pasar su alumnado a…</b> otro docente, antes de quitar a quien lleva escuadrón.',
              '<b>Quitar del equipo</b>: pierde la entrada al grupo.'],
      nota: 'Para <b>añadir</b>, abajo del todo: nombre, correo y rol. Lo hace el servidor con sus reglas: nadie se hace referente desde su navegador y un grupo nunca se queda sin referente.' });
  }
  // ── para todos: lo que muchos harán la primera semana
  function doEntrar() {
    return comoSeHace({ rot: "Entrar", kicker: "Manos a la obra · 1", titulo: "Entrar: un botón, y a vuestra Nave", img: "puerta",
      pasos: ['En <b>stargate.mistercuarter.es</b> → <b>Entrar</b> → <b>Iniciar sesión con Google</b>, con la cuenta que os puso el referente.',
              'El sistema sabe que sois docentes y os deja en <b>vuestra Nave del Comandante</b>, dentro de vuestro grupo.',
              'En el <b>lápiz</b> de vuestra ficha: vuestro comandante (el avatar) y el nombre que ven vuestros reclutas.'],
      nota: '¿«Esa cuenta no lleva ningún grupo»? Pedid al referente que os añada con <b>ese mismo correo</b>.' });
  }
  function doPanel() {
    return comoSeHace({ rot: "Tu Genially", kicker: "Manos a la obra · 2", titulo: "El Genially de vuestro grupo, cambiado en un minuto", img: "panel",
      pasos: ['En el <b>Puente</b>, lo primero: <b>Tu panel de control</b>, el Genially que abre vuestro alumnado desde su Nave.',
              'Viene el <b>oficial</b> del grupo. Para usar el vuestro: <b>Cambiar el enlace</b> y pegad su dirección de ver (<i>view.genially.com/…</i>).',
              '<b>Guardar para mis reclutas</b>. Y si queréis deshacerlo, <b>Volver al oficial</b>.'] });
  }
  function doForo() {
    return comoSeHace({ rot: "El mensaje del foro", kicker: "Manos a la obra · 3", titulo: "El mensaje del foro: ya escrito, y vuestro si queréis", img: "foro",
      pasos: ['En <b>Hoy toca</b>, el mensaje de la semana ya escrito y firmado con vuestro comandante: <b>Copiar</b> y al foro de la plataforma de UNIR.',
              '<b>Editar</b> para escribir vuestra versión: se guarda en <b>vuestra ficha</b> y vale para todos vuestros grupos. Si la borráis, vuelve la oficial.',
              '<b>Ver todos</b>: los ' + (SEMS.length || 15) + ' mensajes del curso, de un vistazo.'] });
  }
  // ── para referentes: todos los retos, uno a uno, tema a tema (de SG_PRESENTA.retos, que sale del catálogo y del documento maestro)
  var CLASES_RETO = { relampago: "Relámpago · en clase", principal: "Reto principal · en casa", actividad: "Actividad oficial",
    extra: "Reto extra", secreto: "Reto secreto", simulacro: "Simulacro · en clase" };
  function tarjetaReto(x) {
    var A = (window.SG_ACTIVIDADES || []).filter(function (a) { return a.reto === x.id; })[0];
    var cuando = A ? 'se lanza en la semana ' + A.sem + ' y se entrega en la ' + A.resuelve
      : x.clase === "secreto" ? 'escondido en el tema ' + x.tema : x.semana ? 'semana ' + x.semana : '';
    return '<article class="pr-rt pr-rt-' + esc(x.clase) + '">' +
      '<header><div class="pr-rt-ins">' + (x.insignias || []).map(function (b) { return '<img src="assets/img/insignias/' + esc(b) + '.webp" alt="" loading="lazy">'; }).join("") + '</div>' +
        '<div><span class="pr-rt-chip">' + esc(CLASES_RETO[x.clase] || "Reto") + (cuando ? ' · ' + esc(cuando) : '') + '</span>' +
        '<h3>«' + esc(x.nombre) + '»' + (x.sub ? ' <em>' + esc(x.sub) + '</em>' : '') + '</h3></div></header>' +
      '<p class="pr-rt-ayuda">' + esc(x.ayuda || "") + '</p>' +
      '<p class="pr-rt-premio"><b>' + esc(String(x.xp)) + ' xp</b> · <b>' + esc(String(x.creditos)) + ' ◈</b>' +
        (x.tripulante ? ' · recupera a <b>' + esc(x.tripulante) + '</b> y su fragmento' : '') + '</p></article>';
  }
  function retosPorTema() {
    var R = PRE.retos || [], out = [];
    for (var t = 1; t <= 8; t++) {
      var del = R.filter(function (x) { return Number(x.tema) === t; })
        .sort(function (a, b) { return (a.semana || 99) - (b.semana || 99); });
      if (!del.length) continue;
      // de tres en tres como mucho (el tema 1, con el arranque, va en dos diapositivas)
      var trozos = del.length <= 3 ? [del] : [del.slice(0, del.length - 3), del.slice(del.length - 3)];
      var pl = PLAN[t - 1] || [];
      trozos.forEach(function (tr, k) {
        out.push({ rot: "Retos · " + (pl[1] || ("Tema " + t)) + (trozos.length > 1 ? " " + (k + 1) : ""), html:
          '<div class="dia pr-esc pr-retos-t"><div class="pr-fondo" style="background-image:url(\'assets/img/fondos/' + esc(pl[0] || "") + '.webp\')"></div><div class="pr-cuerpo">' +
            '<div class="pr-rt-cab"><img src="assets/img/planetas/' + esc(pl[0] || "") + '.png' + esc(IMGV) + '" alt="">' +
              '<div><div class="kicker">Los retos, uno a uno · Tema ' + t + ' · ' + esc(semanasDe(t)) + (trozos.length > 1 ? ' · ' + (k + 1) + ' de ' + trozos.length : '') + '</div>' +
              '<h2>' + esc(pl[1] || "") + ' <span class="small muted">— ' + esc(String(pl[2] || "").replace(/^T\d+ · /, "")) + '</span></h2></div></div>' +
            '<div class="pr-rt-rej n' + tr.length + '">' + tr.map(tarjetaReto).join("") + '</div>' +
          '</div></div>' });
      });
    }
    return out;
  }

  // ── 🔴 24-sep · LA RADIOGRAFÍA, PARA REFERENTES. Norberto: «los referentes, aunque sea agobiante, deben tener la radiografía
  // completa de todo el proyecto. Los profes normales, una visión reducida y motivadora: ya irán descubriendo cada semana».
  // Una diapositiva por pantalla de la web, con la captura de la guía (anotada con sus números) y lo que marca cada número.
  // Los textos resumen la guía del profesorado (GUIA_PROFES_PDF.md, Partes A-C): si cambia una pantalla, se cambian allí y aquí.
  function rx(img, rot, kicker, titulo, pasos, nota) { return comoSeHace({ rot: rot, kicker: kicker, titulo: titulo, img: img, pasos: pasos, nota: nota }); }
  function radioGestion() {
    return [
      rx("escuadrones", "Escuadrones", "Gestionar grupos → Escuadrones", "Un escuadrón por docente que imparte",
        ['<b>Pulsa uno</b> y se despliega.', 'Su <b>Comandante</b> con su correo, cuántos reclutas, la <b>media de xp</b> y de insignias, y su gente: cada fila abre la ficha.'],
        'Se comparan <b>por media</b>, no por suma: así no gana siempre el más numeroso.'),
      rx("calendario-cambio", "Calendario", "Gestionar grupos → Calendario", "Una semana sin clase, y todo se corre solo",
        ['<b>Pulsa una semana que aún no haya llegado</b>: pasa a no lectiva (otra vez, y vuelve).', '<b>«Al guardar»</b> dice a qué día se mueve cada cosa y hasta cuándo se registran retos y se canjea.', '<b>Guardar el calendario</b> (o deshacer). Lo pasado no se toca.'],
        'Aquí también: <b>Abrir ya</b> un capítulo de la Nave antes de tiempo, y el primer día de la semana 1. Las festivas de la UNIR se saltan solas.'),
      rx("ajustes", "Ajustes", "Gestionar grupos → Ajustes", "Los ajustes del grupo",
        ['El nombre y el <b>padlet de la clase</b> (el reto de presentación lo abre), el <b>ticket de salida</b> (formulario anónimo) y el <b>panel de control</b> para ver y para editar.', 'Las fechas se cambian en el <b>Calendario</b>.'],
        'Más abajo: <b>copiar la puerta escondida</b> del Escape UNI (para el Genially de Vínculo) y <b>borrar el grupo</b> (solo para grupos de prueba; pide escribir su nombre).'),
      rx("ficha-referente", "Congelar o dar de baja", "En la ficha de un recluta · solo el referente", "Cambiar de Comandante, congelar o dar de baja",
        ['<b>Cambiar de Comandante</b>: pasa al recluta a otro escuadrón con todo lo suyo (retos, créditos, colección).', '<b>Congelar</b>: puede mirar, pero no registrar, comprar, fichar ni usar el Zoco. <b>Descongelar</b> lo devuelve todo.', '<b>Dar de baja</b>: borra su ficha y libera su alias; podrá alistarse de cero.']),
      rx("premios", "Premios por enlace", "Tu Nave → Premios", "Premios por enlace: una recompensa que se reclama una vez",
        ['<b>La imagen del premio</b>: púlsala y elige (sobre, héroe, créditos, xp, cápsula o participaciones).', '<b>Recompensa o huevo de Pascua</b>, y el interruptor <b>Activo</b>.', '<b>Copiar enlace</b> o <b>copiar para insertar</b> en tu Genially: lleva un código secreto, no se adivina.', '<b>Grupos, fechas y topes</b> (total y por escuadrón). Se guarda solo, con «✓ Guardado».'],
        'Se configuran <b>una vez para todos tus grupos</b> (🌐 Para todos tus grupos). Con tu cuenta, el enlace se abre en simulación.'),
      rx("ofertas", "Ofertas", "Tu Nave → Ofertas", "La oferta de la semana, sola o la tuya",
        ['<b>Crear una oferta</b> tuya: qué, cuánta rebaja, cuántos días y cuántas unidades.', 'En cada oferta: <b>+1 día</b>, <b>+1 semana</b>, <b>unidades</b> o <b>cancelar</b> (quien la compró la conserva).'],
        'La <b>oferta automática</b> sale sola cada semana desde que se abre el Mercado: rebajada, una por persona y con unidades según inscritos y rareza.'),
      rx("sorteos", "El Gran Sorteo", "Tu Nave → Sorteos", "El Gran Sorteo, con su bombo",
        ['<b>Sortear en directo</b>: la ruleta se para en cada ganador; lo elige el servidor (una papeleta por participación, nadie gana dos). Si nadie lo sortea, se resuelve solo al final.', '<b>Cambiar</b> el premio, el precio, los ganadores, las fechas o un tope por persona.'],
        'Después, <b>Copiar ganadores</b> da alias, nombre y correo para entregar el premio.')
    ];
  }
  function radioClase() {
    return [
      rx("banner", "El banner", "Tu Nave del Comandante", "El grupo, en una franja",
        ['<b>El banner</b>: la semana y el tema, el grupo, tu escuadrón y tus reclutas, con el planeta de fondo.', '<b>Empezar la clase</b>: la sesión de hoy, montada. La rueda elige las diapositivas; el otro botón la abre en su ventana.', '<b>Las secciones</b>: Puente, Reclutas, Rankings, Calendario y, en mando manual, Zoco, Premios y Enlaces. Al final, <b>Contacto</b>.'],
        'Si alguien pide subir nota, <b>Reclutas</b> brilla con su número.'),
      rx("puente", "El Puente", "Tu Nave → Puente", "El Puente: lo de esta semana",
        ['<b>Tu panel de control</b> (el Genially de tu alumnado), dentro.', '<b>Las cifras del grupo</b> en aros: pasa el ratón y te dan la cuenta.', '<b>NEBULA</b>: lo que conviene hacer esta semana, con su botón para ir.', '<b>Esta semana destacan</b>: tres caras para nombrar en voz alta.'],
        'Debajo: <b>Hoy toca</b> (el vídeo, los retos, el calendario y el mensaje del foro) y el ticket de salida.'),
      rx("llamada", "Llamada a filas", "La clase → Llamada a filas", "Llamada a filas: fichan desde su Nave",
        ['Ves en directo cuántos han fichado. <b>Cerrar la llamada</b> la termina.'],
        'Eliges los minutos y, si quieres, <b>regalas un sobre</b> a quien fiche. No es un control de asistencia fiable ni lo pretende: ábrela con la clase empezada y poco rato.'),
      rx("aula", "Herramientas", "La clase → Herramientas", "Las herramientas de clase: lo del directo, y nada más",
        ['<b>En clase</b>: quién ha fichado y sacar a alguien <b>al azar</b> sin repetir.', '<b>Premiar</b>: a una cara o a toda la clase; xp, créditos, una carta, un sobre, un héroe, una cápsula o participaciones.', '<b>Pregunta</b> al aire, en directo.', '<b>Votación</b> de la semana.', '<b>Tiempo</b>: un temporizador a pantalla completa.']),
      rx("votacion", "Votación", "Herramientas → Votación", "Una votación que mueve el curso",
        ['<b>Para quién</b>: tu escuadrón o todo el grupo.', '<b>El voto extra</b>: votar otra vez pagando créditos (hasta dos veces).', '<b>Cerrar y resolver</b>: la sesión de esa semana trae la ganadora.'],
        'Se responde desde su Nave durante la semana; tú ves el recuento, ellos no. Y lo votado se cumple: si gana Canva, se ve Canva.'),
      rx("geniallys", "Para tus Geniallys", "Tu Nave → Enlaces → Para tus Geniallys", "Todo, dentro de vuestro Genially",
        ['Copia el <b>código</b> de lo que quieras: la sesión (apertura y cierre), las herramientas, la llamada, el tablero o el Simulador.', 'En Genially: <b>Insertar → Otros → Código</b>, pega y estira la caja.', 'El <b>⧉</b> de al lado lo abre en su propia ventana, para proyectar sin Genially.'],
        'Son los mismos para todos los grupos y cursos: piden la cuenta de quien los abre. Genially no incrusta direcciones sueltas: siempre el código.')
    ];
  }
  function radioNave() {
    return [
      rx("migente", "Reclutas", "Tu Nave → Reclutas", "Tus reclutas, de un vistazo",
        ['<b>Código de clase</b> (tapado: púlsalo para enseñarlo) y <b>Copiar invitación</b> para el foro.', 'Por <b>escuadrones</b> o todo el grupo (el docente ve el suyo).', '<b>Pulsa una fila</b> y se abre su ficha.', 'La <b>Cola de nota</b>, cuando hay algo.'],
        'El nombre y el correo solo los ve el equipo docente; la clase ve el alias.'),
      rx("ficha", "La ficha", "Reclutas → la ficha de un recluta", "Todo lo suyo, en una ficha",
        ['<b>Quién es</b>: escuadrón, Comandante, alias, nombre y correo, y sus cifras.', '<b>Sus retos e insignias por temas</b>: encendido lo ganado, en verde lo registrado.', '<b>Pulsa un reto</b> y se despliega lo suyo: su enlace y validar o anular.']),
      rx("ficha-reto", "Validar o anular", "La ficha → un reto", "Validar o anular, siempre con su porqué",
        ['<b>El reto</b>, resaltado: uno gris se valida; uno verde se anula (podrá registrarlo otra vez).', '<b>Su enlace</b>, para comprobarlo.', '<b>Un mensaje</b> para el recluta (motivos rápidos o el tuyo): le sale arriba en su Nave.', '<b>Anular</b> o <b>Validar</b>. Queda anotado quién, qué y cuándo.']),
      rx("cola", "Cola de nota", "Reclutas → Cola de nota", "Las subidas de nota no se conceden solas",
        ['<b>Conceder</b>.', '<b>Denegar y devolver</b>: los créditos vuelven.'],
        'Conceder no cambia ninguna nota: te dice que se la ha ganado, y la aplicas tú donde calificas, como siempre.'),
      rx("tickets", "Tickets de salida", "Tu Nave → Puente → Ticket de salida", "Lo que dijeron al cerrar cada tema",
        ['<b>Fijar</b> un comentario: sale seguro en la sesión.', 'Las notas, repartidas, y los comentarios del <b>último tema cerrado</b> (el desplegable abre los anteriores).'],
        'Se rellena al acabar un <b>tema</b>, en la última diapositiva de su última sesión. Al abrir el siguiente, «Cómo os fue» y «Vuestras dudas».'),
      rx("rankings", "Rankings", "Tu Nave → Rankings", "Trece rankings: casi todos brillan en alguno",
        ['<b>De quién</b>: todo el grupo o un escuadrón.', '<b>Qué se mide</b>: xp, esta semana, colección, constancia, insignias, explorador, relámpago, logros, los tres del Simulador y escuadrones.', '<b>El podio</b> y la tabla, con el emblema de cada escuadrón.'],
        'Para ensalzar, no para señalar: proyecta uno y nombra a quien destaca.'),
      rx("zoco", "El Zoco", "Tu Nave → El Zoco", "El Zoco: el trueque, vigilado",
        ['El día en que se abre y cada trato, con su mensaje.'],
        'Siempre trueque, de tres pasos como mucho; lo ofrecido queda apartado. Si ves algo raro, <b>Deshacer</b>: cada cosa vuelve a su dueño. En PUA no hay Zoco.'),
      rx("buzon", "Contacto", "Tu Nave → Contacto", "Contacto: la Frecuencia de mando",
        ['<b>Dudas rápidas y averías conocidas</b>: el Capitán contesta al momento, con tus datos.', 'Mientras escribes, <b>busca si ya tiene solución</b>.', 'Si no, cuéntalo: <b>un problema, una duda o una idea</b>.', '<b>Transmitir al Mando</b>: llega con su contexto y la respuesta vuelve aquí (y por correo).'])
    ];
  }
  function radioAlumnado() {
    return [
      rx("alistarse", "Alistarse", "El alumnado · el primer día", "Se alistan una vez, y ya está",
        ['Entran con Google, escriben el <b>código de clase</b> (o abren la invitación) y rellenan: <b>nombre real</b> (solo lo ve el profesorado), <b>alias</b> (lo que ve la clase) y <b>su Comandante</b>, que les lleva a su escuadrón.'],
        'Al terminar: la insignia de Reclutamiento, sus primeros xp y créditos, y su Nave.'),
      rx("nave", "La Nave del recluta", "El alumnado · su Nave", "La Nave del recluta",
        ['<b>Las pestañas</b>: Mi nave, Mis retos, Mi botín, El Archivo, Mercado, Zoco y Rankings (se abren por capítulos).', '<b>Su ficha</b>, con NEBULA hablándole y su carrera: quién va delante y quién le pisa los talones.', '<b>La orden de la semana</b>, la misma carta que proyectas.']),
      rx("retos", "Mis retos", "El alumnado · Mis retos", "Lo que puede conseguir esta semana",
        ['El <b>relámpago</b> de la semana, con el tripulante que se recupera.', 'El <b>reto principal</b>, con su insignia.']),
      rx("reto-relampago", "Registrar un reto", "El alumnado · un reto", "Cómo se registra un reto",
        ['<b>Lo que pide</b>, paso a paso, y <b>Ver un ejemplo</b> hecho.', '<b>El enlace</b> de lo que ha hecho: obligatorio. Sin él no se registra.', 'El <b>«+»</b> añade un segundo enlace.', '<b>«Lo he hecho»</b>: se registra y suben sus xp y créditos.'],
        'Como mucho <b>' + (window.SG_TOPE_SEMANA || 3) + ' retos por semana</b>. Lo registrado lo ves en su ficha con su enlace, y si algo no está hecho, lo anulas.'),
      rx("mercado", "El Mercado", "El alumnado · Mercado Estelar", "El Mercado Estelar",
        ['<b>La oferta de la semana</b>: sale sola, rebajada y con unidades contadas.', '<b>Cada tarjeta</b> dice qué trae, cuánto cuesta y si le llega: sobres con cartas del álbum, cápsulas con héroes.']),
      rx("logros", "Logros de a bordo", "El alumnado · Mi botín → Logros", "Los logros de a bordo y el Contramaestre",
        ['<b>Sus días a bordo</b>: los seguidos y los de todo el curso.', '<b>Lo hecho</b>, con su fecha.', '<b>Lo que falta</b>, con «Ir».', '<b>El premio de cada cubierta</b>: llega solo al completarla.'],
        '16 logros en 5 cubiertas; con las cinco, <b>Contramaestre de la Nave</b>: un héroe legendario y una carta con su alias. No dan xp, no se compran ni se regalan.'),
      rx("batalla", "La batalla", "El alumnado · el Simulador de Joran", "La batalla contra RUTA AZUL",
        ['<b>Los dos escudos y el reloj</b>: el rival ataca cada 25 segundos.', '<b>La arena</b>: cada acierto, un golpe; fallar quita tiempo y la pregunta vuelve.', '<b>Joran corrige</b> cada fallo ahí mismo.', '<b>La pregunta</b>, con su tema y su dificultad.'],
        'No es un reto ni da nota: es repaso. Quien gana se queda el Simulador para entrenar tema a tema, con su ranking.')
    ];
  }
  /**
   * 🔴 24-sep · DOS MAZOS. Para DOCENTES, reducido y motivador (lo que enamora, «poco a poco» y los tres «cómo se hace»:
   * el resto lo irán descubriendo cada semana). Para REFERENTES, la radiografía completa, por secciones: crear grupos,
   * gestionarlos, la historia, la clase, la Nave del docente, lo que ve el alumnado, los retos uno a uno y las recompensas.
   */
  function mazo() {
    if (MODO !== "referentes")
      return [portada(), encargo(), historia(), nombres(), comandantes(), mapa(), material(), semanaABordo(), unReto(),
              heroes(), cromos(), simulador(), sorteo(), nota(), tranquilos(), queHace2(),
              doEntrar(), doPanel(), doForo(), loQueNo2(), preguntas2(), siguiente2(), cierre()];
    var secs = [
      ["Bienvenida", [portada(), refPapel()]],
      ["Crear grupos", [refCrear(), refEquipo(), refListo(), refProfes()]],
      ["Gestionar grupos", radioGestion()],
      ["La historia", [encargo(), historia(), nombres(), comandantes(), mapa(), semanas(), material()]],
      ["La clase", [semanaABordo()].concat(radioClase())],
      ["Vuestra Nave", [doEntrar(), doPanel(), doForo()].concat(radioNave())],
      ["El alumnado", radioAlumnado()],
      ["Los retos", [unReto(), comoSeGana2()].concat(retosPorTema())],
      ["Recompensas", [bitacora2(), heroes(), cromos(), simulador(), sorteo(), rankings2(), nota()]],
      ["Cierre", [tranquilos(), queHace2(), loQueNo2(), preguntas2(), siguiente2(), enlaces(), cierre()]]
    ];
    var out = [];
    secs.forEach(function (x) { x[1].forEach(function (d) { d.sec = x[0]; out.push(d); }); });
    return out;
  }
  /** La barra de abajo: por diapositivas (docentes) o, en la radiografía, por secciones y, debajo, las de la sección. */
  function barra() {
    var boton = function (d, i) {
      return '<button type="button" class="p' + (i === st.i ? " on" : "") + (i < st.i ? " past" : "") + '" data-i="' + i + '" title="' + esc(d.rot) + '"><span>' + esc(d.rot) + '</span></button>'; };
    if (MODO !== "referentes") return '<div class="barra-pasos">' + SLIDES.map(boton).join("") + '</div>';
    var actual = (SLIDES[st.i] || {}).sec, vistas = {}, secs = [];
    SLIDES.forEach(function (d, i) { if (!(d.sec in vistas)) { vistas[d.sec] = i; secs.push(d.sec); } });
    return '<div class="barra-pasos pr-secs">' + secs.map(function (sc) {
        var n = SLIDES.filter(function (d) { return d.sec === sc; }).length;
        return '<button type="button" class="p' + (sc === actual ? " on" : "") + '" data-i="' + vistas[sc] + '" title="' + esc(sc) + '"><span>' + esc(sc) + ' <em>' + n + '</em></span></button>';
      }).join("") + '</div>' +
      '<div class="barra-pasos pr-subs">' + SLIDES.map(function (d, i) { return d.sec === actual ? boton(d, i) : ""; }).join("") + '</div>';
  }

  // ───────────────────────────────────────────────────────────── el mazo, como el de clase
  var SLIDES = [];
  function pintar() {
    if (!MODO) { root.innerHTML = selector(); cablearSelector(); return; }
    SLIDES = SLIDES.length ? SLIDES : mazo();
    if (st.i < 0) st.i = 0;
    if (st.i >= SLIDES.length) st.i = SLIDES.length - 1;
    root.innerHTML = '<div class="mazo pr-mazo" id="mazo" tabindex="0" aria-live="polite">' +
      '<div class="lienzo">' + SLIDES[st.i].html + '</div>' +
      '<button type="button" class="nav ant" id="pr-ant" aria-label="Anterior">‹</button>' +
      '<button type="button" class="nav sig" id="pr-sig" aria-label="Siguiente">›</button>' +
      barra() +
      '<div class="pr-mandos"><button type="button" class="btn min" id="pr-otra" title="Volver a elegir">' + (MODO === "referentes" ? "Referentes" : "Docentes") + ' ⇄</button>' +
        '<span class="pr-cuenta">' + (st.i + 1) + ' / ' + SLIDES.length + '</span>' +
        '<button type="button" class="btn min" id="pr-pantalla">Pantalla completa</button></div>' +
    '</div>';
    cablear();
  }
  function ir(n) { st.i = n; pintar(); var m = $("#mazo"); if (m) m.focus(); }
  function cablearSelector() {
    Array.prototype.forEach.call(root.querySelectorAll("[data-para]"), function (b) { b.onclick = function () { elegir(b.getAttribute("data-para")); }; });
  }
  function cablear() {
    var a = $("#pr-ant"), s = $("#pr-sig");
    if (a) a.onclick = function () { ir(st.i - 1); };
    if (s) s.onclick = function () { ir(st.i + 1); };
    Array.prototype.forEach.call(root.querySelectorAll(".barra-pasos .p"), function (b) {
      b.onclick = function () { ir(Number(b.getAttribute("data-i")) || 0); };
    });
    var po = $("#pr-otra");
    if (po) po.onclick = function () { MODO = ""; SLIDES = []; st.i = 0; pintar(); };
    var pc = $("#pr-pantalla");
    if (pc) pc.onclick = function () {
      var m = $("#mazo"); if (!m) return;
      if (document.fullscreenElement) document.exitFullscreen();
      else if (m.requestFullscreen) m.requestFullscreen();
    };
    // el planeta que se pulsa abre su ficha debajo, sin cambiar de diapositiva
    Array.prototype.forEach.call(root.querySelectorAll(".pr-pl"), function (b) {
      b.onclick = function () {
        var n = Number(b.getAttribute("data-pl")) || 1, caja = $("#pr-ficha");
        var ya = b.classList.contains("on");
        Array.prototype.forEach.call(root.querySelectorAll(".pr-pl"), function (x) { x.classList.remove("on"); });
        if (ya || !caja) { if (caja) caja.hidden = true; return; }
        b.classList.add("on");
        caja.innerHTML = fichaPlaneta(n); caja.hidden = false;
      };
    });
    // las preguntas se abren de una en una: que dé tiempo a contestar antes de leer la respuesta
    Array.prototype.forEach.call(root.querySelectorAll(".pr-q"), function (b) {
      b.onclick = function () {
        var ya = b.getAttribute("aria-expanded") === "true";
        Array.prototype.forEach.call(root.querySelectorAll(".pr-q"), function (x) { x.setAttribute("aria-expanded", "false"); });
        b.setAttribute("aria-expanded", ya ? "false" : "true");
      };
    });
  }
  document.addEventListener("keydown", function (e) {
    if (!SLIDES.length || !MODO) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || "")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); ir(st.i + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); ir(st.i - 1); }
  });
  pintar();
})();
