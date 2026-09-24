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
  function mazo() {
    return [portada(), encargo(), historia(), nombres(), comandantes(), mapa(), semanas(), material(), semanaABordo(), unReto(),
            comoSeGana2(), bitacora2(), heroes(), cromos(), simulador(), sorteo(), rankings2(), nota(), tranquilos(), queHace2(),
            loQueNo2(), preguntas2(), siguiente2(), enlaces(), cierre()];
  }

  // ───────────────────────────────────────────────────────────── el mazo, como el de clase
  var SLIDES = [];
  function pintar() {
    SLIDES = SLIDES.length ? SLIDES : mazo();
    if (st.i < 0) st.i = 0;
    if (st.i >= SLIDES.length) st.i = SLIDES.length - 1;
    root.innerHTML = '<div class="mazo pr-mazo" id="mazo" tabindex="0" aria-live="polite">' +
      '<div class="lienzo">' + SLIDES[st.i].html + '</div>' +
      '<button type="button" class="nav ant" id="pr-ant" aria-label="Anterior">‹</button>' +
      '<button type="button" class="nav sig" id="pr-sig" aria-label="Siguiente">›</button>' +
      '<div class="barra-pasos">' + SLIDES.map(function (d, i) {
        return '<button type="button" class="p' + (i === st.i ? " on" : "") + (i < st.i ? " past" : "") + '" data-i="' + i + '" title="' + esc(d.rot) + '"><span>' + esc(d.rot) + '</span></button>';
      }).join("") + '</div>' +
      '<div class="pr-mandos"><span class="pr-cuenta">' + (st.i + 1) + ' / ' + SLIDES.length + '</span>' +
        '<button type="button" class="btn min" id="pr-pantalla">Pantalla completa</button></div>' +
    '</div>';
    cablear();
  }
  function ir(n) { st.i = n; pintar(); var m = $("#mazo"); if (m) m.focus(); }
  function cablear() {
    var a = $("#pr-ant"), s = $("#pr-sig");
    if (a) a.onclick = function () { ir(st.i - 1); };
    if (s) s.onclick = function () { ir(st.i + 1); };
    Array.prototype.forEach.call(root.querySelectorAll(".barra-pasos .p"), function (b) {
      b.onclick = function () { ir(Number(b.getAttribute("data-i")) || 0); };
    });
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
    if (!SLIDES.length) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || "")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); ir(st.i + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); ir(st.i - 1); }
  });
  pintar();
})();
