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
 * Quién la ve: el **referente**, desde «Gestionar grupos» (es lo que se hace una vez por curso, con el equipo).
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

  // ───────────────────────────────────────────────────────────── las diapositivas
  function portada() {
    return { rot: "Portada", html:
      '<div class="dia pr-portada">' +
        '<div class="pr-logo"><span class="fc-marca">◈ STARGATE</span><span class="fc-lema">La Bitácora Estelar</span></div>' +
        '<h1>Vais a dar esta asignatura<br>dentro de una historia</h1>' +
        '<p class="pr-sub">Cuarenta minutos y sabréis exactamente qué tenéis que hacer. Que es menos de lo que parece.</p>' +
        '<p class="pr-pie">Pasa con <b>→</b> · la barra de abajo salta a cualquier parte</p>' +
      '</div>' };
  }
  function problema() {
    return { rot: "El problema", html:
      '<div class="dia pr-centro">' +
        '<div class="kicker">Antes de enseñar nada</div>' +
        '<h1>Lo que se cae no es el contenido.<br>Es la constancia.</h1>' +
        '<div class="pr-tres">' +
          '<div class="pr-t"><b>Entran</b><span>miran la clase, o la grabación</span></div>' +
          '<div class="pr-t"><b>No dejan rastro</b><span>y sin rastro no hay evaluación continua de verdad</span></div>' +
          '<div class="pr-t"><b>Llega el examen</b><span>y es lo único que se ha medido</span></div>' +
        '</div>' +
        '<p class="pr-cita">«Vuestro alumnado no va a recordar la clase del tema 4. Va a recordar el día que enseñasteis en pantalla lo que había hecho.»</p>' +
      '</div>' };
  }
  function historia() {
    var v = (((SEMS[0] || {}).videos || [])[0] || [])[0] || {};
    return { rot: "La historia", html:
      '<div class="dia pr-video">' +
        '<div class="kicker">Dos minutos · esto es lo que ve vuestro alumnado el primer día</div>' +
        '<h2>La señal de auxilio</h2>' +
        (v.id ? '<div class="pr-marco"><button type="button" class="pr-play" data-video="' + esc(v.id) + '" data-video-t="' + esc(v.titulo || "") + '">' +
            '<img src="https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg" alt="" loading="lazy">' +
            '<span class="pr-play-b">▶</span></button></div>'
          : '<p class="muted">El vídeo de bienvenida está en la Cronología.</p>') +
      '</div>' };
  }
  function nombres() {
    return { rot: "Cuatro nombres", html:
      '<div class="dia">' +
        '<div class="kicker">Los cuatro nombres que hay que saberse</div>' +
        '<h2>Y no hay que estudiárselos: salen solos</h2>' +
        '<div class="pr-cartas pr-cuatro">' +
          '<figure class="pr-c"><img src="assets/img/personajes/nebula.png" alt="">' +
            '<figcaption><b>NEBULA</b><span>La inteligencia de la nave. Guía el viaje y va recomponiéndose con el curso. Es quien presenta cada cosa nueva en la Nave del alumnado.</span></figcaption></figure>' +
          '<figure class="pr-c"><img src="assets/img/personajes/vaeon.png" alt="">' +
            '<figcaption><b>La Estática · General Vaeon</b><span>La amenaza. Donde entra, la gente deja de crear, registrar y compartir. No se combate disparando: se combate <b>dejando constancia</b>.</span></figcaption></figure>' +
          // 🔴 23-sep · Norberto: «Capitán de la Nave (es nuestro personaje), Comandante STARGATE (el docente de cada
          // grupo)». El Capitán es el de los vídeos y el de la visita guiada; el Comandante eres tú, con tu avatar y tu
          // nombre: así te ve tu alumnado en el mensaje de cada semana y en su Nave.
          '<figure class="pr-c"><img src="assets/img/capitan/saluda.png" alt="">' +
            '<figcaption><b>Capitán de la Nave</b><span>El veterano al mando de La Constancia. Da las órdenes de cada misión en los vídeos y te guía en la visita de tu Nave.</span></figcaption></figure>' +
          '<figure class="pr-c pr-cmd"><img src="assets/img/avatares/comandantes/recorte_hd/c1.webp" alt="">' +
            '<figcaption><b>Comandante STARGATE · eres tú</b><span>Cada docente es el Comandante de su grupo: <b>eliges tu avatar</b> y tu nombre, firmas la orden de cada semana y entras por tu <b>Nave del Comandante</b>.</span></figcaption></figure>' +
        '</div>' +
      '</div>' };
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
      '<div class="dia pr-mapa">' +
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
      '</div>' };
  }
  function fichaPlaneta(n) {
    var p = PLAN[n - 1] || [], T = tripulacion()[n - 1] || {}, r = retosDe(n);
    var s = SEMS.filter(function (x) { return Number(x.tema_n) === n; })[0] || {};
    return '<div class="pr-ficha-c">' +
      '<img class="pr-ficha-pl" src="assets/img/planetas/' + esc(p[0]) + '.png' + esc(IMGV) + '" alt="">' +
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
          // 🔴 la última semana no tiene tema (es el repaso): sin planeta, o salía con el de Fôrge
          var t = Number(s.tema_n) || 0, pl = t ? (PLAN[t - 1] || []) : [];
          return '<div class="pr-sem' + (s.tema_n ? '' : ' fin') + '" title="' + esc(s.sub || "") + '">' +
            '<span class="pr-sem-n">' + s.sem + '</span>' +
            (pl[0] ? '<img src="assets/img/planetas/' + esc(pl[0]) + '.png' + esc(IMGV) + '" alt="">' : '<span class="pr-sem-fin">◈</span>') +
            '<em>' + esc(pl[1] || "La liberación") + '</em></div>';
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
  function cierre() {
    return { rot: "Cierre", html:
      '<div class="dia pr-portada">' +
        '<div class="pr-logo"><span class="fc-marca">◈ STARGATE</span><span class="fc-lema">La Bitácora Estelar</span></div>' +
        '<h1>Una obra que no se documenta,<br>no existe</h1>' +
        '<p class="pr-sub">Eso es lo único que hay que contarles. Lo demás lo hace el sistema.</p>' +
        '<p class="pr-pie">Corto y cierro.</p>' +
      '</div>' };
  }

  function mazo() {
    return [portada(), problema(), historia(), nombres(), bitacora(), mapa(), semanas(), capitulos(),
            comoSeGana(), rankings(), queHaceElDocente(), loQueNo(), preguntas(), siguiente(), enlaces(), cierre()];
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
