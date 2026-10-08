/**
 * STARGATE · EL BUZÓN DEL MANDO — «📡 Frecuencia de mando» (buzon.html) · 15-sep-2026
 *
 * Norberto: «que los docentes tengan una página sencilla donde poner recomendaciones o problemas,
 * que eso te llegue y puedas resolver casi todo sin que yo intervenga».
 *
 *   · El docente escribe un PROBLEMA, una DUDA o una IDEA. Mientras escribe, el Capitán busca entre
 *     las averías conocidas y las preguntas frecuentes (SG_AVERIAS, SG_FAQ) y le ofrece la solución
 *     al instante: lo más habitual se resuelve sin enviar nada.
 *   · Si lo envía, va con su contexto (desde qué página, qué grupo, qué semana, qué navegador) para
 *     encontrar el fallo sin preguntar. Y las respuestas llegan AQUÍ, en su hilo, no por correo.
 *   · El Mando (los vitalicios) ve todas las transmisiones, las contesta y les cambia el estado.
 *     Lo resuelve un asistente desde el servidor; esta página solo escribe y lee (motor.js · buzon*).
 */
(function () {
  "use strict";
  var app = document.getElementById("bz-app");
  var q = new URLSearchParams(location.search);
  var DESDE = String(q.get("desde") || "").slice(0, 30), PER0 = q.get("per") || "";
  var MOTOR = null, YO = null, GRUPOS = [], MANDO = false, MIOS = [], TODOS = [], FILTRO = "abiertas", SIN_LEER = false;
  /**
   * 🔴 1-oct · UN SOLO BOTÓN DE AYUDA. Norberto: «el botón de ayuda debe ser el mismo siempre, debe dar prioridad desde donde se
   * activa, pero si hay discrepancias o puede haber dudas, se pregunta… Para Anita y Caridad es la misma vía». Hasta hoy la
   * Academia tenía su propio «Pregunta a NEBULA» (otro buzón, otra tarea que contestaba) y dos respuestas distintas llegaron a
   * la misma persona. Ahora la Academia abre ESTA página (incrustada, ?embed=1&desde=academia) y todo va a `stargate_buzon`.
   * El paso intermedio, «¿Sobre qué es?»: la Academia (su formación), una de sus clases con estudiantes o «No lo sé / de todo»,
   * ya marcado según desde dónde se abre. Lo de la Academia lo contesta NEBULA; lo de las clases, el Mando.
   */
  var PER_ACADEMIA = "academia-cero", ESTACION = String(q.get("estacion") || "").slice(0, 20), ACA = null, ADJ = [], MAX_ADJ = 3;
  if (q.get("embed") === "1") document.body.classList.add("embed");
  var ST = { tipo: "problema", urgente: false, grupo: PER0, ambito: "", texto: "", sugeridas: [] };
  var VITALICIOS = ["n.cuartero.10@gmail.com", "mutecdgami@gmail.com"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function norm(t) { return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

  // ── lo que ya sabemos: las averías conocidas y las preguntas frecuentes de la guía
  var KB = (window.SG_AVERIAS || []).map(function (a) { return { id: a[0], t: a[1], claves: a[2] || [], x: a[3] }; })
    .concat((window.SG_FAQ || []).map(function (f, i) { return { id: "faq" + i, t: f[0], claves: [], x: f[1] }; }));
  var VACIAS = {};
  ("que los las del con para por una uno unos unas pero como mas este esta esto estos hay cuando porque sobre entre " +
   "tiene tengo hace hacer algo nada todo cosa pasa esta estan ser son fue muy sus mis tus les nos ahora ayer hoy solo " +
   "alguien alguno alguna donde cual quien qué cómo puedo puede quiero").split(" ").forEach(function (w) { VACIAS[w] = true; });
  function palabras(t) { return norm(t).split(/[^a-z0-9ñ]+/).filter(function (w) { return w.length > 2 && !VACIAS[w]; }); }

  /**
   * ── 15-sep · LAS DUDAS DE SIEMPRE, CONTESTADAS AL MOMENTO Y CON TUS DATOS. Norberto: «¿hay alguna forma
   * de automatizar las dudas más habituales? ¿que les conteste el Comandante en la misma ventana? ¿cuál es
   * el código o enlace de invitación?, ¿cómo cambio los enlaces de Genially?, ¿cuál es la carpeta de
   * Genially?, ¿dónde están los recursos?…». Estas no son texto fijo: se escriben con los grupos de quien
   * pregunta (su código, su semana, sus enlaces) y traen el botón de copiar. Van por delante de las averías
   * y de la FAQ. Si una duda llega dos veces al Mando, se añade aquí (o a AVERIAS): que la tercera no llegue.
   */
  var GRUPOS_V = function () { return (typeof GRUPOS !== "undefined" && GRUPOS) || []; };
  var MOT = function () { return (window.SG && window.SG.MOTOR) || {}; };
  function copiar(txt, etiqueta, hecho) {
    return '<button type="button" class="btn min" data-copiar="' + esc(txt) + '" data-copiado="' + esc(hecho || "✓ Copiado") + '">' + etiqueta + '</button>';
  }
  function porGrupo(fila, vacio) {
    var gs = GRUPOS_V().filter(function (g) { return g.estado !== "pasado"; });
    return gs.length ? gs.map(fila).join("") : vacio;
  }
  function iframe(ruta, tit) {
    return MOT().codigoGenially ? MOT().codigoGenially(ruta, tit)
      : '<iframe src="' + (location.origin || "https://stargate.mistercuarter.es") + '/' + ruta + '" width="1200" height="675" style="border:0;width:100%;height:100%" allow="fullscreen; clipboard-write; autoplay; encrypted-media" allowfullscreen title="' + tit + '"></iframe>';
  }
  var VIVAS = [
    { id: "invitacion", t: "El código y la invitación de tu clase",
      claves: ["codigo", "invitacion", "invitar", "enlace de invitacion", "se unan", "unirse", "unan", "apuntarse", "inscrib", "codigo de clase", "enlace para los alumnos", "enlace para el alumnado", "enlace para mis alumnos", "enlace para los estudiantes"],
      x: function () {
        return porGrupo(function (g) {
          return '<div class="bz-dato"><div><b>' + esc(g.nombre || g.id) + '</b><span class="bz-codigo">' + esc(g.codigo || "—") + '</span></div>'
            + (g.codigo && MOT().invitacion ? copiar(MOT().invitacion(g), "<img class=ico src=assets/img/iconos/p/notas.png alt> Copiar invitación", "✓ Invitación copiada") : '') + '</div>';
        }, '<p>Entra con la cuenta de tu grupo y te lo doy aquí mismo.</p>')
          + '<p class="small">La invitación es un mensaje listo para el foro de la plataforma de UNIR, con el enlace directo: tu alumnado entra con Google, '
          + 'escribe el código y se alista solo. También está en <a href="consola.html">tu Nave</a>: en el Puente las tres primeras semanas y, después, en Mi gente (el código sale tapado: pulsa «<img class=ico src=assets/img/iconos/p/ojo.png alt> Mostrar»). Y en las semanas 1 y 2, en la diapositiva «Únete a la clase» de la sesión.</p>';
      } },
    { id: "mi-genially", t: "Cambiar los enlaces de tu Genially",
      claves: ["cambiar el genially", "cambio el genially", "cambiar mi genially", "cambio los enlaces", "cambiar los enlaces", "cambiar el enlace", "cambio el enlace", "enlaces de genially", "enlace del genially", "mi genially", "mi propio genially", "otro genially", "poner mi genially", "duplicar", "mi panel", "mis enlaces"],
      x: function () {
        return '<p>Tu Genially es el que abre <b>tu</b> alumnado desde su Nave. Se pone en tu Nave, con <b>Mando manual</b>: <b>Enlaces</b> → «Tu Genially» (o en el Puente, «Tu panel de control»). Si lo dejas vacío, usan el oficial del grupo:</p>'
          + porGrupo(function (g) {
            return '<div class="bz-dato"><b>' + esc(g.nombre || g.id) + '</b><a class="btn min" href="consola.html?per=' + encodeURIComponent(g.id) + '&tab=mios"><img class=ico src=assets/img/iconos/p/enlace.png alt> Abrir sus enlaces</a></div>'
              + (g.soyReferente ? '<p class="small">Como llevas este grupo, el panel <b>oficial</b> (el de todos) está en <b>Gestionar grupos</b> → <b>Ajustes del grupo</b> → «Panel de control (ver)».</p>' : '');
          }, '')
          + '<p class="small">¿Ya lo has cambiado y sigue saliendo el viejo? Recarga con <b>Ctrl + Mayús + R</b> (<b>⌘ + Mayús + R</b> en Mac).</p>';
      } },
    { id: "carpeta", t: "La carpeta de Geniallys",
      claves: ["carpeta de genially", "carpeta de los genially", "carpeta genially", "geniallys", "plantilla", "plantillas", "donde estan los genially", "genially de los planetas", "genially de cada planeta"],
      x: function () {
        var u = window.SG_GENIALLY_CARPETA || "";
        return (u ? '<p><a class="btn" href="' + esc(u) + '" target="_blank" rel="noopener"><img class=ico src=assets/img/iconos/p/varios.png alt> Abrir la carpeta de Geniallys ↗</a></p>' : '')
          + '<p>Los Geniallys de los ocho planetas y el panel de control. Usa los estándar tal cual; si quieres el tuyo, duplica uno y pégalo en tu Nave → <b>Tu panel de control</b> (con Mando manual). '
          + 'Si te pide permiso, pídeselo a tu referente: es una carpeta del equipo docente.</p>';
      } },
    { id: "material", t: "El material audiovisual: vídeos, insignias, cromos y láminas",
      claves: ["material audiovisual", "audiovisual", "recursos", "material", "videos de la serie", "insignias", "cromos", "laminas", "fondos", "imagenes", "personajes", "kit", "paquete", "drive"],
      x: function () {
        return '<p><a class="btn" href="recursos.html"><img class=ico src=assets/img/iconos/p/botin.png alt> Recursos audiovisuales</a> <a class="btn min" href="cronologia.html"><img class=ico src=assets/img/iconos/p/calendario.png alt> Qué vídeo toca cada semana</a></p>'
          + '<p>En Recursos están los vídeos de la serie, las insignias, los cromos y las láminas: para proyectar, para el aula virtual o para tus materiales. '
          + 'Para montar Geniallys (fondos por planeta, clips, personajes recortados, HUD, iconos, insignias y cartas) está el paquete del equipo en Drive, '
          + '<b>DRIVE_EQUIPO_STARGATE</b>' + (window.SG_DRIVE_EQUIPO ? ': <a href="' + esc(window.SG_DRIVE_EQUIPO) + '" target="_blank" rel="noopener">ábrelo ↗</a>' : '')
          + '. Se comparte en solo lectura con cada docente del equipo (en un día, como mucho); si te pide acceso, pídeselo a tu referente.</p>';
      } },
    { id: "insertar", t: "Poner la sesión, el aula o la llamada dentro de tu Genially",
      claves: ["insertar", "incrustar", "embed", "iframe", "poner la sesion", "pongo la sesion", "meter la sesion", "sesion en genially", "sesion dentro", "dentro de mi genially", "dentro del genially", "en mi genially", "codigo para genially", "codigo de genially", "poner el aula", "pongo el aula", "poner la llamada", "pongo la llamada"],
      x: function () {
        return '<p>El <b>mismo código para todos tus grupos</b>: al abrirlo pide tu cuenta y, si llevas varios, pregunta en cuál estáis. '
          + 'En Genially: <b>Insertar → Otros → Código</b>, y pegar.</p><div class="bz-botones">'
          + copiar(iframe("sesion.html?embed=1", "STARGATE · La sesión de la semana"), "<img class=ico src=assets/img/iconos/p/video.png alt> La sesión de la semana", "✓ Código copiado")
          + copiar(iframe("aula.html?embed=1", "STARGATE · El aula"), "<img class=ico src=assets/img/iconos/p/envivo.png alt> El aula · la clase en directo", "✓ Código copiado")
          + copiar(iframe("llamada.html?embed=1", "STARGATE · La llamada a filas"), "<img class=ico src=assets/img/iconos/p/clase.png alt> La llamada a filas", "✓ Código copiado") + '</div>';
      } },
    { id: "enlaces", t: "Los enlaces de tu grupo: la Nave, el tablero y la sesión",
      claves: ["enlace de la nave", "nave del alumnado", "nave de los alumnos", "enlace del tablero", "tablero", "ranking", "padlet", "enlaces del grupo", "enlace de la sesion", "donde esta la nave"],
      x: function () {
        return porGrupo(function (g) {
          var S = g.stargate || {}, o = location.origin + "/";
          return '<div class="bz-dato bz-enl"><b>' + esc(g.nombre || g.id) + '</b><div class="bz-botones">'
            + copiar(o + "recluta.html?per=" + encodeURIComponent(g.id), "<img class=ico src=assets/img/iconos/p/cohete.png alt> La Nave")
            + copiar(o + "registro.html?per=" + encodeURIComponent(g.id) + "&solo=1", "<img class=ico src=assets/img/iconos/p/medalla.png alt> El tablero")
            + copiar(o + "sesion.html?per=" + encodeURIComponent(g.id), "<img class=ico src=assets/img/iconos/p/video.png alt> La sesión")
            + (S.padlet ? copiar(S.padlet, "<img class=ico src=assets/img/iconos/p/notas.png alt> El padlet") : '') + '</div></div>';
        }, '<p>Entra con la cuenta de tu grupo y te los doy aquí mismo.</p>') + '<p class="small">Cada botón copia el enlace, listo para pegar.</p>';
      } },
    { id: "semana", t: "En qué semana va tu grupo y qué toca",
      claves: ["que semana", "en que semana", "semana estamos", "semana vamos", "que toca", "toca hoy", "toca esta semana", "cronologia", "planificacion"],
      x: function () {
        return porGrupo(function (g) {
          return '<div class="bz-dato"><div><b>' + esc(g.nombre || g.id) + '</b><span>' + (g.estado === "en marcha" ? "Semana " + g.semana + " de " + g.total : esc(g.estado || "")) + '</span></div>'
            + '<a class="btn min" href="sesion.html?per=' + encodeURIComponent(g.id) + '" target="_blank" rel="noopener"><img class=ico src=assets/img/iconos/p/video.png alt> La sesión de hoy</a></div>';
        }, '') + '<p class="small">La sesión trae la semana montada: el mensaje, los vídeos, quién ha hecho qué y las misiones. Semana a semana, en la <a href="cronologia.html">cronología</a>.</p>';
      } },
    { id: "foro", t: "El mensaje de esta semana para el foro",
      claves: ["mensaje del foro", "mensaje para el foro", "foro", "mensaje de la semana", "publicar en el foro", "anuncio"],
      x: function () {
        return '<p>Está escrito, semana a semana: en <b>la sesión</b> (arriba, «Antes de empezar» → «El mensaje de esta semana para el foro», con su botón de copiar) '
          + 'y en la <a href="cronologia.html">cronología</a>. Y en la sesión proyectada sale como la apertura de una saga, antes del vídeo.</p>';
      } },
    { id: "tiempo", t: "Un temporizador para la clase",
      claves: ["temporizador", "cronometro", "timer", "cuenta atras", "controlar el tiempo", "tiempos"],
      x: function () {
        return '<p>En <b>El aula</b> → pestaña <b><img class=ico src=assets/img/iconos/p/tiempo.png alt> Tiempo</b>: 1, 3, 5, 10 o 15 minutos (o los que pongas), en grande para proyectar, con aviso al terminar. '
          + 'El aula va dentro de tu Genially con el código de «<img class=ico src=assets/img/iconos/p/envivo.png alt> El aula» (pregúntame «¿cómo pongo el aula en Genially?»).</p>';
      } }
  ];
  function buscar(texto) {
    var n = norm(texto), tk = palabras(texto);
    if (!tk.length) return [];
    return VIVAS.map(function (e, i) { return { e: e, viva: 1, i: i }; }).concat(KB.map(function (e, i) { return { e: e, viva: 0, i: i }; })).map(function (x) {
      var p = 0, tt = palabras(x.e.t);
      x.e.claves.forEach(function (c) { if (n.indexOf(c) >= 0) p += 3; });
      tk.forEach(function (w) { if (tt.indexOf(w) >= 0) p += 1; });
      x.p = p; return x;
    }).filter(function (x) { return x.p >= 2; })
      .sort(function (a, b) { return (b.p - a.p) || (b.viva - a.viva) || (a.i - b.i); }).slice(0, 2).map(function (x) { return x.e; });
  }
  // (la batería 75 prueba el buscador sin página: por eso se expone antes de mirar si hay #bz-app)
  window.SG_BUZON = { buscar: buscar, kb: KB, vivas: VIVAS };
  if (!app) return;
  var CHIPS = [["lista", "<img class=ico src=assets/img/iconos/p/clase.png alt> No puedo pasar lista"], ["genially", "<img class=ico src=assets/img/iconos/p/zoco.png alt> El Genially no se actualiza"], ["entrar", "<img class=ico src=assets/img/iconos/p/abierto.png alt> Un alumno no puede entrar"],
               ["retos", "<img class=ico src=assets/img/iconos/p/diana.png alt> No le suman los retos"], ["embed", "<img class=ico src=assets/img/iconos/p/video.png alt> La sesión no se ve en Genially"]];
  // 15-sep · y las dudas de siempre, que el Capitán contesta con tus datos
  var DUDAS = [["invitacion", "<img class=ico src=assets/img/iconos/p/llave.png alt> ¿Cuál es el código de invitación?"], ["mi-genially", "<img class=ico src=assets/img/iconos/p/enlace.png alt> ¿Cómo cambio los enlaces de Genially?"],
               ["carpeta", "<img class=ico src=assets/img/iconos/p/varios.png alt> ¿Dónde está la carpeta de Geniallys?"], ["material", "<img class=ico src=assets/img/iconos/p/botin.png alt> ¿Dónde está el material audiovisual?"],
               ["insertar", "<img class=ico src=assets/img/iconos/p/video.png alt> ¿Cómo pongo la sesión en Genially?"], ["semana", "<img class=ico src=assets/img/iconos/p/calendario.png alt> ¿En qué semana vamos?"]];
  var TIPOS = [["problema", "<img class=ico src=assets/img/iconos/p/ajustes.png alt>", "Un problema", "Qué ha pasado, dónde y con quién. Si puedes, qué esperabas que pasara."],
               ["duda", "<img class=ico src=assets/img/iconos/p/pregunta.png alt>", "Una duda", "Qué quieres hacer. Te respondemos con los pasos."],
               ["idea", "<img class=ico src=assets/img/iconos/p/estrella.png alt>", "Una idea", "Qué mejorarías y para qué. Las ideas se reúnen y las decide el coordinador."]];
  var ESTADOS = { nuevo: ["<img class=ico src=assets/img/iconos/p/envivo.png alt>", "Recibido"], en_marcha: ["<img class=ico src=assets/img/iconos/p/ajustes.png alt>", "En marcha"], resuelto: ["<img class=ico src=assets/img/iconos/p/hecho.png alt>", "Resuelto"],
                  para_norberto: ["<img class=ico src=assets/img/iconos/p/brujula.png alt>", "Con el coordinador"], anotado: ["<img class=ico src=assets/img/iconos/p/notas.png alt>", "Anotado"] };

  function cuando(ms) {
    var s = Math.max(0, Math.round((Date.now() - Number(ms || 0)) / 1000));
    if (s < 60) return "ahora mismo";
    if (s < 3600) return "hace " + Math.round(s / 60) + " min";
    if (s < 86400) return "hace " + Math.round(s / 3600) + " h";
    return new Date(Number(ms)).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }
  function aviso(txt, bueno) {
    var a = document.getElementById("bz-aviso"); if (!a) return;
    a.className = "aviso" + (bueno ? " ok" : ""); a.innerHTML = txt; a.hidden = false;
  }

  // ── la puerta
  function puerta(err) {
    app.innerHTML = '<div class="card bz-puerta"><h2>Entra con tu cuenta de docente</h2>'
      + '<p>La frecuencia de mando es del profesorado de STARGATE: entra con la cuenta de Google de tu grupo.</p>'
      + '<p><button class="btn primary grande btn-google" id="bz-entrar">' + ((window.SG && window.SG.LOGO_G) || "") + '<span>Iniciar sesión con Google</span></button></p>'
      + (err ? '<p class="malo">' + esc(err) + '</p>' : '') + '</div>';
    document.getElementById("bz-entrar").onclick = function () {
      MOTOR.entrar().then(function () { arrancar(); }).catch(function (e) { puerta("No he podido entrar: " + ((e && e.message) || e)); });
    };
  }

  // ── la transmisión nueva y las sugerencias del Capitán
  function sugerencias() {
    var caja = document.getElementById("bz-sugiere"); if (!caja) return;
    if (ST.ambito === "academia") {   // 1-oct · en la Academia habla NEBULA (las averías de las clases no son de aquí)
      caja.innerHTML = '<div class="bz-cap"><img src="assets/img/personajes/nebula.png" alt=""><p><b>NEBULA</b>Cuéntamelo: una duda de la Academia, algo que falla en un planeta o una idea. '
        + 'Lo que yo no sepa se lo paso al Alto Mando, y te respondemos aquí mismo.</p></div>';
      return;
    }
    var L = ST.sugeridas;
    caja.innerHTML = L.length
      ? '<div class="bz-cap"><img src="assets/img/capitan/senala.png" alt=""><p><b>El Capitán</b>' + (L[0] && typeof L[0].x === "function"
          ? 'Te lo digo ahora mismo, Comandante:' : 'Esto ya tiene solución conocida. Mira si te sirve antes de enviarlo:') + '</p></div>'
        + L.map(function (e) { return '<article class="bz-sol"><h3>' + esc(e.t) + '</h3><div>' + (typeof e.x === "function" ? e.x() : e.x) + '</div></article>'; }).join("")
        + '<p class="bz-sol-botones"><button class="btn" id="bz-resuelto" type="button"><img class=ico src=assets/img/iconos/p/hecho.png alt> Esto lo resuelve</button></p>'
      : '<div class="bz-cap"><img src="assets/img/capitan/pensativo.png" alt=""><p><b>El Capitán</b>Mientras escribes, busco si esto ya tiene solución. '
        + 'Si no la tiene, transmítelo: el Mando lo revisa cada día y te responde aquí mismo.</p></div>' + enClaro();
    cablearCopiar(caja);
    var r = document.getElementById("bz-resuelto");
    if (r) r.onclick = function () {
      ST.texto = ""; ST.sugeridas = []; pintar();
      aviso("<img class=ico src=assets/img/iconos/p/hecho.png alt> ¡Perfecto, Comandante! Si vuelve a pasar, aquí estamos.", true);
    };
  }
  /**
   * 4-oct · STARGATE EN CLARO, antes de escribir. Las preguntas que más llegan, sin la historia, cada una con su respuesta y su
   * botón en en-claro.html (se abre aparte: lo escrito aquí no se pierde). La lista la escribe _build_site.py (SG_CLARO: las
   * marcadas para el buzón), así que es la misma que la página. Las de referentes, solo a quien lo es.
   */
  function enClaro() {
    var ref = false; try { ref = localStorage.getItem("sgEsReferente") === "1"; } catch (e) {}
    var L = (window.SG_CLARO || []).filter(function (x) { return !x[3] || ref; }); if (!L.length) return "";
    var secs = [];
    L.forEach(function (x) { if (secs.indexOf(x[2]) < 0) secs.push(x[2]); });
    return '<div class="bz-claro"><p class="bz-claro-t"><img class=ico src=assets/img/iconos/p/libro.png alt> <b>Antes de escribir, en claro</b> lo que más se pregunta, sin la historia</p>'
      + secs.map(function (s) {
          return '<p class="bz-claro-s">' + esc(s) + '</p><ul>' + L.filter(function (x) { return x[2] === s; }).map(function (x) {
            return '<li><a href="en-claro.html#' + esc(x[0]) + '" target="_blank" rel="noopener">' + esc(x[1]) + '</a></li>'; }).join("") + '</ul>';
        }).join("")
      + '<p><a href="en-claro.html" target="_blank" rel="noopener">Todas las respuestas, en STARGATE en claro →</a></p></div>';
  }
  /** Copiar al portapapeles (con plan B para navegadores que no dejan: un textarea y copiar). */
  function cablearCopiar(raiz) {
    Array.prototype.forEach.call((raiz || document).querySelectorAll("[data-copiar]"), function (b) {
      b.onclick = function () {
        var t = b.getAttribute("data-copiar"), ok = function () { var antes = b.innerHTML; b.textContent = b.getAttribute("data-copiado") || "✓ Copiado"; setTimeout(function () { b.innerHTML = antes; }, 1800); };
        var planB = function () { var ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); ok(); } catch (e) {} ta.remove(); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, planB); else planB();
      };
    });
  }
  // ── 1-oct · ¿sobre qué es? La Academia, una de sus clases o «no lo sé»
  function puedeAcademia() { return !!ACA; }
  function ambitos() {
    var L = [];
    if (puedeAcademia()) L.push({ v: "academia", t: "<img class=ico src=assets/img/iconos/p/cohete.png alt> La Academia (tu formación)" });
    GRUPOS.forEach(function (g) { L.push({ v: "grupo:" + g.id, t: "<img class=ico src=assets/img/iconos/p/clase.png alt> Mi clase · " + esc(g.nombre || g.id) }); });
    L.push({ v: "nolose", t: "<img class=ico src=assets/img/iconos/p/pregunta.png alt> No lo sé / de todo" });
    return L;
  }
  function ambitoActual() { return ST.ambito === "grupo" ? "grupo:" + ST.grupo : ST.ambito; }
  /** Lo que se marca solo: desde la Academia, la Academia; desde un grupo, ese grupo; si solo hay una opción, esa. */
  function ambitoInicial() {
    if (DESDE === "academia" && puedeAcademia()) { ST.ambito = "academia"; return; }
    if (PER0 && GRUPOS.some(function (g) { return g.id === PER0; })) { ST.ambito = "grupo"; ST.grupo = PER0; return; }
    if (puedeAcademia() && !GRUPOS.length) { ST.ambito = "academia"; return; }
    if (!puedeAcademia() && GRUPOS.length === 1) { ST.ambito = "grupo"; ST.grupo = GRUPOS[0].id; return; }
    ST.ambito = "";   // hay varias y no sabemos desde dónde: que lo elija
  }
  function nueva() {
    var tipo = TIPOS.filter(function (t) { return t[0] === ST.tipo; })[0], aca = ST.ambito === "academia", act = ambitoActual();
    return '<div class="bz-grid"><section class="card bz-nueva"><h2>' + (aca ? "Pregunta a NEBULA" : "Nueva transmisión") + '</h2>'
      + '<p class="bz-chips-t">¿Sobre qué es?</p>'
      + '<div class="bz-chips bz-ambito" role="radiogroup" aria-label="Sobre qué es">' + ambitos().map(function (o) {
          return '<button type="button" role="radio" aria-checked="' + (o.v === act) + '" class="bz-chip' + (o.v === act ? " on" : "") + '" data-ambito="' + esc(o.v) + '">' + o.t + '</button>'; }).join("") + '</div>'
      + (!ST.ambito ? '<p class="small bz-ambito-nota">Elige una: así te contesta quien toca y con lo de ese sitio.</p>'
         : ST.ambito === "nolose" ? '<p class="small bz-ambito-nota">Sin problema: te responderemos para los dos casos (la Academia y tu clase con estudiantes) o te preguntaremos lo justo.</p>'
         : aca ? '<p class="small bz-ambito-nota">La Academia es tu formación: el grupo de práctica y la consola de ensayo, sin nada real. Te contesto yo, NEBULA.</p>' : '')
      + (aca ? '' : '<p class="bz-chips-t">Dudas rápidas · te contesto al momento</p>'
      + '<div class="bz-chips" role="group" aria-label="Dudas rápidas">' + DUDAS.map(function (c) {
          return '<button type="button" class="bz-chip duda" data-duda="' + c[0] + '">' + c[1] + '</button>'; }).join("") + '</div>'
      + '<p class="bz-chips-t">Averías conocidas</p>'
      + '<div class="bz-chips" role="group" aria-label="Averías conocidas">' + CHIPS.map(function (c) {
          return '<button type="button" class="bz-chip" data-chip="' + c[0] + '">' + c[1] + '</button>'; }).join("") + '</div>')
      + '<div class="bz-tipos" role="radiogroup" aria-label="Qué es">' + TIPOS.map(function (t) {
          return '<button type="button" role="radio" aria-checked="' + (t[0] === ST.tipo) + '" class="bz-tipo' + (t[0] === ST.tipo ? " on" : "") + '" data-tipo="' + t[0] + '">'
            + '<span>' + t[1] + '</span>' + t[2] + '</button>'; }).join("") + '</div>'
      + '<label class="bz-campo">Cuéntanoslo<textarea id="bz-texto" maxlength="2000" rows="6" placeholder="' + esc(tipo[3]) + '">' + esc(ST.texto) + '</textarea>'
      + '<span class="bz-cuenta" id="bz-cuenta">' + ST.texto.length + ' / 2000</span></label>'
      // 8-oct · la captura, para todos (antes, solo sobre la Academia). Norberto: «cuando se contacta con el mando o ayuda, debes
      // incluir la opción de adjuntar captura de pantalla»
      + '<div class="bz-adj" id="bz-adj"></div><p class="bz-adj-fila"><label class="btn min"><input type="file" accept="image/*" multiple id="bz-file" hidden><img class=ico src=assets/img/iconos/p/anadir.png alt> Añadir una captura</label>'
          + ' <span class="small muted">o pégala con Ctrl+V en el texto: ayuda mucho a ver qué ha fallado.</span></p>'
      + (ST.tipo === "problema" && ST.ambito !== "academia" ? '<label class="bz-urg"><input type="checkbox" id="bz-urgente"' + (ST.urgente ? " checked" : "") + '> <img class=ico src=assets/img/iconos/p/aviso.png alt> Me está bloqueando la clase ahora mismo</label>' : '')
      + '<p class="bz-acciones"><button class="btn primary grande" id="bz-enviar" type="button"><img class=ico src=assets/img/iconos/p/envivo.png alt> ' + (aca ? "Enviar a NEBULA" : "Transmitir al Mando") + '</button></p>'
      + '<p class="small muted">Con tu mensaje viaja desde dónde escribes (la página, el grupo, la semana y tu navegador): así encontramos el fallo sin tener que preguntarte.</p>'
      + '</section><aside class="bz-sugiere" id="bz-sugiere" aria-live="polite"></aside></div>';
  }
  // ── las capturas: ≤ 1600 px, JPEG, tres por mensaje (GP_SDK.buzon, por el motor); se suben al enviar, a la de la app (teacher_profiles/<uid>/buzon/)
  function anadirAdj(files) {
    var fs = Array.prototype.filter.call(files || [], function (f) { return /^image\//.test(f.type); });
    if (!fs.length) { if (files && files.length) aviso("Solo imágenes (una captura, una foto)."); return; }
    if (ADJ.length + fs.length > MAX_ADJ) aviso("Como mucho " + MAX_ADJ + " capturas por mensaje.");
    fs.slice(0, Math.max(0, MAX_ADJ - ADJ.length)).forEach(function (f) {
      MOTOR.buzonComprimir(f).then(function (blob) { if (ADJ.length < MAX_ADJ) ADJ.push({ blob: blob, ver: URL.createObjectURL(blob) }); pintarAdj(); },
        function () { aviso("Esa imagen no se ha podido leer."); });
    });
  }
  function pintarAdj() {
    var c = document.getElementById("bz-adj"); if (!c) return;
    c.innerHTML = ADJ.map(function (a, i) { return '<span class="bz-adj-m"><img src="' + a.ver + '" alt="Captura ' + (i + 1) + '"><button type="button" data-quita="' + i + '" aria-label="Quitar la captura ' + (i + 1) + '">&times;</button></span>'; }).join("");
    Array.prototype.forEach.call(c.querySelectorAll("[data-quita]"), function (b) { b.onclick = function () { ADJ.splice(Number(b.getAttribute("data-quita")), 1); pintarAdj(); }; });
  }
  function subirAdj() {
    var urls = [];
    return ADJ.reduce(function (p, a) {
      return p.then(function () { return MOTOR.buzonAdjuntar(a.blob).then(function (u) { urls.push(u); }, function () { throw new Error("no se ha podido subir la captura"); }); });
    }, Promise.resolve()).then(function () { return urls; });
  }
  function adjuntosHtml(adj) {
    var ok = (adj || []).filter(function (u) { return /^https:\/\/firebasestorage\.googleapis\.com\//.test(String(u)); });
    return ok.length ? '<div class="bz-adj">' + ok.map(function (u, i) { return '<a class="bz-adj-m" href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '" alt="Captura ' + (i + 1) + '" loading="lazy"></a>'; }).join("") + "</div>" : "";
  }
  function cablearNueva() {
    var txt = document.getElementById("bz-texto"), cuenta = document.getElementById("bz-cuenta"), espera = null;
    txt.oninput = function () {
      ST.texto = txt.value; cuenta.textContent = txt.value.length + " / 2000";
      clearTimeout(espera); espera = setTimeout(function () { ST.sugeridas = ST.tipo === "idea" || ST.ambito === "academia" ? [] : buscar(ST.texto); sugerencias(); }, 250);
    };
    Array.prototype.forEach.call(app.querySelectorAll("[data-tipo]"), function (b) {
      b.onclick = function () { ST.tipo = b.getAttribute("data-tipo"); if (ST.tipo !== "problema") ST.urgente = false; pintar(); var t = document.getElementById("bz-texto"); if (t) t.focus(); };
    });
    Array.prototype.forEach.call(app.querySelectorAll("[data-duda]"), function (b) {
      b.onclick = function () {
        var e = VIVAS.filter(function (x) { return x.id === b.getAttribute("data-duda"); })[0];
        ST.tipo = "duda"; ST.urgente = false; ST.sugeridas = e ? [e] : []; ST.texto = b.textContent.trim();
        pintar(); var s = document.getElementById("bz-sugiere"); if (s && s.scrollIntoView && window.innerWidth < 900) s.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });
    Array.prototype.forEach.call(app.querySelectorAll("[data-chip]"), function (b) {
      b.onclick = function () {
        var e = KB.filter(function (x) { return x.id === b.getAttribute("data-chip"); })[0];
        ST.tipo = "problema"; ST.sugeridas = e ? [e] : []; if (!ST.texto) ST.texto = b.textContent.trim() + ". ";
        pintar(); var t = document.getElementById("bz-texto"); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
      };
    });
    Array.prototype.forEach.call(app.querySelectorAll("[data-ambito]"), function (b) {
      b.onclick = function () {
        var v = b.getAttribute("data-ambito");
        if (v.indexOf("grupo:") === 0) { ST.ambito = "grupo"; ST.grupo = v.slice(6); } else ST.ambito = v;
        if (ST.ambito === "academia") { ST.urgente = false; ST.sugeridas = []; }
        pintar(); var t = document.getElementById("bz-texto"); if (t) t.focus();
      };
    });
    var fi = document.getElementById("bz-file"); if (fi) fi.onchange = function () { anadirAdj(fi.files); fi.value = ""; };
    txt.addEventListener("paste", function (e) {
      var fs = Array.prototype.filter.call((e.clipboardData && e.clipboardData.files) || [], function (f) { return /^image\//.test(f.type); });
      if (fs.length) { e.preventDefault(); anadirAdj(fs); }
    });
    pintarAdj();
    var u = document.getElementById("bz-urgente"); if (u) u.onchange = function () { ST.urgente = u.checked; };
    document.getElementById("bz-enviar").onclick = enviar;
    sugerencias();
  }
  function enviar() {
    var b = document.getElementById("bz-enviar"), texto = String(ST.texto || "").trim();
    if (!ST.ambito) { aviso("Dinos arriba sobre qué es: la Academia, una de tus clases o «No lo sé / de todo»."); var a0 = app.querySelector("[data-ambito]"); if (a0) a0.focus(); return; }
    if (texto.length < 8) { aviso("Cuéntanos un poco más (qué ha pasado, dónde y con quién): así lo resolvemos a la primera."); document.getElementById("bz-texto").focus(); return; }
    // 1-oct · adónde va: la Academia (projectId «academia-cero»), una clase, o «no lo sé» (va con su primer grupo, o con la
    // Academia si no lleva ninguno, y marcado «dudoso»: la guardia contesta para los dos casos o pregunta)
    var aca = ST.ambito === "academia", g = ST.ambito === "grupo" ? (GRUPOS.filter(function (x) { return x.id === ST.grupo; })[0] || {}) : {};
    var pid = aca ? PER_ACADEMIA : ST.ambito === "grupo" ? g.id : ((GRUPOS[0] || {}).id || (puedeAcademia() ? PER_ACADEMIA : ""));
    var nombreGrupo = aca ? "La Academia de la Cero" : ST.ambito === "grupo" ? (g.nombre || "") : "Sin concretar (no lo sé / de todo)";
    b.disabled = true; b.textContent = ADJ.length ? "Subiendo la captura…" : "Transmitiendo…";
    (ADJ.length ? subirAdj() : Promise.resolve([])).then(function (urls) {
      return MOTOR.buzonEnviar({
        tipo: ST.tipo, urgente: !aca && ST.tipo === "problema" && ST.urgente, texto: texto, projectId: pid || "", grupo: nombreGrupo, adjuntos: urls,
        autoayuda: ST.sugeridas.map(function (e) { return e.id; }),
        contexto: { desde: DESDE || "buzon", ambito: aca ? "academia" : ST.ambito === "grupo" ? "clase" : "dudoso", estacion: aca ? ESTACION : "",
                    semana: g.semana || null, estado: g.estado || "", referente: !!g.soyReferente,
                    navegador: String(navigator.userAgent || "").slice(0, 180), pantalla: window.innerWidth + "x" + window.innerHeight,
                    idioma: navigator.language || "", hora: new Date().toISOString() }
      });
    }).then(function () {
      ST.texto = ""; ST.urgente = false; ST.sugeridas = []; ADJ = [];
      return cargar().then(function () {
        pintar();
        aviso('<img class="bz-ok-cap" src="assets/img/' + (aca ? 'personajes/nebula.png' : 'capitan/pulgar.png') + '" alt=""> <b>' + (aca ? "Recibido, Comandante." : "Transmisión recibida, Comandante.") + '</b> ' +
          'Te respondemos aquí mismo en menos de una hora, de 8 a 22 h (y te avisamos por correo)' + (aca ? "" : "; lo urgente, lo primero") + '.', true);
      });
    }).catch(function (e) {
      b.disabled = false; b.innerHTML = "<img class=ico src=assets/img/iconos/p/envivo.png alt> " + (aca ? "Enviar a NEBULA" : "Transmitir al Mando");
      aviso(/permission|insufficient/i.test(String(e && (e.code || e.message)))
        ? "La frecuencia no me deja transmitir desde esta cuenta ahora mismo. Recarga la página y vuelve a probar en un rato; si sigue igual, avisa a tu referente."
        : "No ha salido: " + esc((e && e.message) || e));
    });
  }

  // ── un mensaje, con su hilo (el mío o, para el Mando, el de cualquiera)
  function mensaje(m, comoMando) {
    // 28-sep · lo del alumnado llega como tipo 'recluta' y su clase (problema, duda o idea) va en el contexto: antes salía
    // siempre como «Un problema» (el primero de la lista)
    var cx = m.contexto || {}, clase = m.tipo === "recluta" ? (cx.clase || "duda") : m.tipo;
    var tipo = TIPOS.filter(function (t) { return t[0] === clase; })[0] || TIPOS[0], e = ESTADOS[m.estado] || ESTADOS.nuevo;
    var nuevoParaMi = !comoMando && m.visto === false;
    // 1-oct · «¿Te ha resuelto la duda?» (Norberto: «así analizamos la utilidad del buzón»): tras una respuesta del Mando que
    // lo dejó resuelto. «Sí» y «Necesito algo más» viajan como una respuesta suya, con las frases de motor.js (BUZON_VALORA)
    var rsM = m.respuestas || [], ultM = rsM[rsM.length - 1];
    var valorar = !comoMando && m.tipo !== "recluta" && m.estado === "resuelto" && ultM && ultM.de === "mando";
    // 1-oct · lo de la Academia lo firma NEBULA (en su ficción, el Mando no aparece); lo de las clases, el Mando
    var firma = m.projectId === PER_ACADEMIA ? "<img class=ico src=assets/img/iconos/p/cohete.png alt> NEBULA" : "<img class=ico src=assets/img/iconos/p/envivo.png alt> El Mando";
    return '<article class="bz-msg ' + esc(m.estado || "nuevo") + (m.urgente ? " urgente" : "") + (nuevoParaMi ? " fresco" : "") + '" data-m="' + esc(m.id) + '">'
      + '<header><span class="bz-tipo-et">' + tipo[1] + ' ' + (m.tipo === "recluta" ? "Recluta · " : "") + tipo[2] + '</span>'
      + (m.urgente ? '<span class="chip bz-urgente"><img class=ico src=assets/img/iconos/p/aviso.png alt> Urgente</span>' : '')
      + '<span class="chip bz-estado">' + e[0] + ' ' + (comoMando && m.estado === "para_norberto" ? "Para ti" : e[1]) + '</span>'
      + (nuevoParaMi ? '<span class="chip bz-nueva-r"><img class=ico src=assets/img/iconos/p/envivo.png alt> Respuesta nueva</span>' : '')
      + '<time>' + cuando(m.creado) + '</time>'
      + (comoMando ? '<span class="bz-quien">' + esc(m.nombre || m.correo || "") + ' · ' + esc(m.grupo || m.projectId || "") + '</span>' : (m.grupo ? '<span class="bz-quien">' + esc(m.grupo) + '</span>' : ''))
      + '</header>'
      + '<p class="bz-texto">' + esc(m.texto) + '</p>' + adjuntosHtml(m.adjuntos)
      + (comoMando ? '<p class="bz-cx">' + ["desde " + (cx.desde || "—"), cx.semana ? "semana " + cx.semana : "", cx.pantalla || "", cx.referente ? "referente" : "",
           (cx.navegador || "").replace(/^.*?\) /, "").slice(0, 60)].filter(Boolean).map(esc).join(" · ") + '</p>' : '')
      + ((m.respuestas || []).length ? '<div class="bz-hilo">' + m.respuestas.map(function (r) {
          return '<div class="bz-r ' + (r.de === "mando" ? "mando" : "docente") + '"><b>' + (r.de === "mando" ? firma : (comoMando ? esc(m.nombre || "Docente") : "Tú")) + '</b>'
            + '<p>' + esc(r.texto) + '</p><time>' + cuando(r.fecha) + '</time></div>'; }).join("") + '</div>' : '')
      + (valorar ? '<div class="bz-valora"><b>¿Te ha resuelto la duda?</b> <button class="btn min primary" type="button" data-val-si>Sí, resuelta</button>'
          + ' <button class="btn min" type="button" data-val-mas>Necesito algo más</button></div>' : '')
      + '<div class="bz-contesta"><textarea rows="2" maxlength="2000" placeholder="' + (comoMando ? "Responder como el Mando…" : "Contestar…") + '"></textarea>'
      + '<div class="bz-contesta-b">'
      + (comoMando
        ? '<select aria-label="Estado">' + Object.keys(ESTADOS).map(function (k) {
            return '<option value="' + k + '"' + (k === (m.estado === "nuevo" ? (m.tipo === "idea" ? "anotado" : "resuelto") : m.estado) ? " selected" : "") + '>' + (k === "para_norberto" ? "Para ti" : ESTADOS[k][1]) + '</option>'; }).join("") + '</select>'
          + '<button class="btn primary" type="button" data-responder>Responder</button>'
        : '<button class="btn" type="button" data-responder>Contestar</button>'
          + (m.estado !== "resuelto" ? ' <button class="btn min" type="button" data-cerrar><img class=ico src=assets/img/iconos/p/hecho.png alt> Ya está resuelto</button>' : ''))
      + '</div></div></article>';
  }
  function cablearMensajes(raiz, comoMando) {
    Array.prototype.forEach.call(raiz.querySelectorAll(".bz-msg"), function (art) {
      var id = art.getAttribute("data-m"), ta = art.querySelector("textarea"), sel = art.querySelector("select");
      var r = art.querySelector("[data-responder]"), c = art.querySelector("[data-cerrar]");
      if (!r) return;   // (el hilo de la Academia solo se lee: no tiene «Contestar»)
      var V = MOTOR.BUZON_VALORA || {}, vSi = art.querySelector("[data-val-si]"), vMas = art.querySelector("[data-val-mas]");
      if (vSi) vSi.onclick = function () {
        vSi.disabled = true;
        MOTOR.buzonResponder(id, V.si || "✓ Me ha resuelto la duda.", { estado: "resuelto" }).then(function () { return MOTOR.buzonVisto(id); })
          .then(function () { return cargar(); }).then(function () { pintar(); aviso("<img class=ico src=assets/img/iconos/p/hecho.png alt> ¡Gracias, Comandante! Nos ayuda a saber que el buzón sirve.", true); })
          .catch(function (e) { vSi.disabled = false; aviso("No ha salido: " + esc((e && e.message) || e)); });
      };
      // «Necesito algo más»: escribe qué le falta y sale con la frase delante (el mensaje vuelve a la guardia, que lo cuenta)
      if (vMas) vMas.onclick = function () { art.setAttribute("data-mas", "1"); ta.placeholder = "Cuéntanos qué te falta o qué no ha funcionado…"; ta.focus(); };
      r.onclick = function () {
        var t = ta.value.trim();
        if (!t && !comoMando) { ta.focus(); return; }
        if (!comoMando && t && art.getAttribute("data-mas")) t = (V.mas || "Necesito algo más: ") + t;
        r.disabled = true;
        MOTOR.buzonResponder(id, t, comoMando ? { comoMando: true, estado: sel.value } : {})
          .then(function () { return cargar(); }).then(function () { pintar(); aviso(comoMando ? "Respondido." : "<img class=ico src=assets/img/iconos/p/envivo.png alt> Enviado al Mando.", true); })
          .catch(function (e) { r.disabled = false; aviso("No ha salido: " + esc((e && e.message) || e)); });
      };
      if (c) c.onclick = function () {
        MOTOR.buzonResponder(id, "", { estado: "resuelto" }).then(function () { return cargar(); })
          .then(function () { pintar(); aviso("<img class=ico src=assets/img/iconos/p/hecho.png alt> Cerrado. ¡Gracias, Comandante!", true); });
      };
    });
  }

  // ── la vista del Mando: todo, con filtros
  var FILTROS = [["abiertas", "<img class=ico src=assets/img/iconos/p/envivo.png alt> Por resolver"], ["urgentes", "<img class=ico src=assets/img/iconos/p/aviso.png alt> Urgentes"], ["para_norberto", "<img class=ico src=assets/img/iconos/p/brujula.png alt> Para ti"], ["ideas", "<img class=ico src=assets/img/iconos/p/estrella.png alt> Ideas"], ["resueltas", "<img class=ico src=assets/img/iconos/p/hecho.png alt> Resueltas"], ["todas", "Todas"]];
  function filtra(L) {
    return L.filter(function (m) {
      if (FILTRO === "abiertas") return m.estado === "nuevo" || m.estado === "en_marcha";
      if (FILTRO === "urgentes") return m.urgente && m.estado !== "resuelto";
      if (FILTRO === "para_norberto") return m.estado === "para_norberto";
      if (FILTRO === "ideas") return m.tipo === "idea";
      if (FILTRO === "resueltas") return m.estado === "resuelto";
      return true;
    });
  }
  // lo que arde, arriba: urgente y sin cerrar; después, lo último que se ha movido
  function arde(m) { return m.urgente && m.estado !== "resuelto" && m.estado !== "anotado" ? 1 : 0; }
  function vistaMando() {
    var L = filtra(TODOS).slice().sort(function (a, b) { return (arde(b) - arde(a)) || ((b.actualizado || 0) - (a.actualizado || 0)); });
    return '<section class="bz-mando"><h2><img class=ico src=assets/img/iconos/p/notas.png alt> Todas las transmisiones <span class="small muted">(solo el Mando)</span></h2>'
      + '<div class="bz-filtros" role="group">' + FILTROS.map(function (f) {
          var n = FILTRO === f[0] ? L.length : filtraCon(f[0]).length;
          return '<button type="button" class="bz-chip' + (FILTRO === f[0] ? " on" : "") + '" data-filtro="' + f[0] + '">' + f[1] + ' <b>' + n + '</b></button>'; }).join("") + '</div>'
      + (L.length ? L.map(function (m) { return mensaje(m, true); }).join("") : '<p class="muted">Nada por aquí.</p>') + '</section>';
  }
  function filtraCon(f) { var antes = FILTRO; FILTRO = f; var r = filtra(TODOS); FILTRO = antes; return r; }

  // ── pintar y cargar
  /**
   * 1-oct · LO DE LA ACADEMIA QUE NO ES UNA PREGUNTA SUYA: los comentarios de NEBULA (su imagen del relámpago, su diseño, el
   * ánimo si se para, lo convalidado), lo del Alto Mando y lo que preguntó antes del 1-oct en el «Pregunta a NEBULA» viejo.
   * Vive en su ficha de formación (`stargate_formacion`, lo escribe la revisión diaria); aquí sale como un hilo más, para que
   * todo lo que se le ha dicho esté en un solo sitio. Solo se lee: para contestar, se escribe arriba con «La Academia».
   */
  function hiloAcademia() {
    if (!ACA) return null;
    var L = [], cl = (ACA.claude || {}).mensajes || {}, md = (ACA.mando || {}).mensajes || {}, pr = ACA.preguntas || {}, fb = ACA.feedback || {};
    var NOMBRE_FB = { fallo: "Algo no funciona", idea: "Una idea", otra: "Otra cosa" };
    Object.keys(cl).forEach(function (k) { L.push({ t: Number(cl[k].t) || Number(k) || 0, de: "NEBULA", x: cl[k].texto }); });
    Object.keys(md).forEach(function (k) { L.push({ t: Number(md[k].t) || Number(k) || 0, de: "El Alto Mando", x: md[k].texto }); });
    Object.keys(pr).forEach(function (k) { L.push({ t: Number(k) || 0, de: "Tú", x: pr[k].texto, adj: pr[k].adjuntos }); });
    Object.keys(fb).forEach(function (k) { if (fb[k] && fb[k].tipo !== "juego" && fb[k].texto) L.push({ t: Number(k) || 0, de: "Tú", x: "[" + (NOMBRE_FB[fb[k].tipo] || "Nota") + "] " + fb[k].texto, adj: fb[k].adjuntos }); });
    if (!L.length) return null;
    L.sort(function (a, b) { return a.t - b.t; });
    var ult = L[L.length - 1].t, visto = 0; try { visto = Number(JSON.parse(localStorage.getItem("sgAcademia.claudeVisto") || "0")) || 0; } catch (e) {}
    var fresco = L.some(function (m) { return m.de !== "Tú" && m.t > visto; });
    return { t: ult, html: '<article class="bz-msg resuelto' + (fresco ? " fresco" : "") + '"><header><span class="bz-tipo-et"><img class=ico src=assets/img/iconos/p/cohete.png alt> La Academia · tu formación</span>'
      + (fresco ? '<span class="chip bz-nueva-r"><img class=ico src=assets/img/iconos/p/envivo.png alt> Mensaje nuevo</span>' : '') + '<time>' + cuando(ult) + '</time></header>'
      + '<div class="bz-hilo">' + L.map(function (m) {
          return '<div class="bz-r ' + (m.de === "Tú" ? "docente" : "mando") + '"><b>' + esc(m.de) + '</b><p>' + esc(m.x || "") + '</p>' + adjuntosHtml(m.adj) + '<time>' + cuando(m.t) + '</time></div>'; }).join("") + '</div>'
      + '<p class="small muted">Para contestar o preguntar algo nuevo, escribe arriba con «La Academia» marcada.</p></article>' };
  }
  function pintar() {
    var L = MIOS.map(function (m) { return { t: m.actualizado || m.creado || 0, html: mensaje(m, false) }; }), ha = hiloAcademia();
    if (ha) L.push(ha);
    L.sort(function (a, b) { return b.t - a.t; });
    app.innerHTML = '<div id="bz-aviso" class="aviso" hidden></div>' + nueva()
      + '<section class="bz-lista"><h2>Tus mensajes y sus respuestas</h2>'
      + (L.length ? L.map(function (x) { return x.html; }).join("")
         : SIN_LEER ? '<p class="muted">Ahora mismo no puedo leer tus transmisiones. Recarga la página en un rato.</p>'
         : '<p class="muted">Aún no has escrito nada. Cuando lo hagas, las respuestas llegarán aquí.</p>')
      + '</section>' + (MANDO ? vistaMando() : '');
    if (ha) try { localStorage.setItem("sgAcademia.claudeVisto", JSON.stringify(Date.now())); } catch (e) {}
    cablearNueva();
    cablearMensajes(app.querySelector(".bz-lista"), false);
    var vm = app.querySelector(".bz-mando");
    if (vm) {
      cablearMensajes(vm, true);
      Array.prototype.forEach.call(vm.querySelectorAll("[data-filtro]"), function (b) { b.onclick = function () { FILTRO = b.getAttribute("data-filtro"); pintar(); }; });
    }
    // lo leído, leído: se apaga el aviso de respuesta nueva (en la consola y aquí la próxima vez)
    // 25-sep · y apuntado en este navegador (con cuántas respuestas lo leyó): si el servidor rechaza el «visto», la burbuja de
    // Contacto se apaga igual tras la primera visita, y vuelve a encenderse solo con una respuesta nueva
    var vistos = {}; try { vistos = JSON.parse(localStorage.getItem("sgBzVistos") || "{}") || {}; } catch (e) {}
    MIOS.forEach(function (m) { vistos[m.id] = (m.respuestas || []).length; });
    try { localStorage.setItem("sgBzVistos", JSON.stringify(vistos)); } catch (e) {}
    MIOS.filter(function (m) { return m.visto === false; }).forEach(function (m) { MOTOR.buzonVisto(m.id); m.visto = true; });
  }
  function cargar() {
    SIN_LEER = false;
    return Promise.all([MOTOR.buzonMios().catch(function () { SIN_LEER = true; return []; }),
                        MANDO ? MOTOR.buzonTodos().catch(function () { return []; }) : Promise.resolve([])])
      .then(function (r) { MIOS = r[0] || []; TODOS = r[1] || []; });
  }
  function arrancar() {
    app.innerHTML = '<p class="muted">Abriendo la frecuencia…</p>';
    MOTOR.sesion().then(function (yo) {
      if (!yo) return puerta();
      YO = yo; MANDO = VITALICIOS.indexOf(String(yo.correo || "").toLowerCase()) >= 0;
      return Promise.all([MOTOR.misPERs(yo.correo), MOTOR.academiaMia ? MOTOR.academiaMia().catch(function () { return null; }) : null]).then(function (r) {
        var ps = r[0];
        // (el grupo de práctica de la Academia no es «una clase»: sale como «La Academia», no en la lista de grupos)
        GRUPOS = (ps || []).filter(function (g) { return g.estado !== "archivado" && g.id !== PER_ACADEMIA; });
        ACA = r[1] || null;
        if (!GRUPOS.length && !MANDO && !ACA) {
          app.innerHTML = '<div class="card bz-puerta"><h2>Esta frecuencia es del profesorado de STARGATE</h2>'
            + '<p>Has entrado como <b>' + esc(yo.correo) + '</b>, y esta cuenta no está en el equipo docente de ningún grupo. '
            + 'Si das clase en STARGATE, entra con la cuenta que te dio de alta tu referente.</p>'
            + '<p><button class="btn" id="bz-otra">Entrar con otra cuenta</button></p></div>';
          document.getElementById("bz-otra").onclick = function () { MOTOR.salir().then(function () { puerta(); }); };
          return;
        }
        if (!GRUPOS.some(function (g) { return g.id === ST.grupo; })) ST.grupo = (GRUPOS[0] || {}).id || "";
        ambitoInicial();
        return cargar().then(pintar);
      });
    }).catch(function (e) { app.innerHTML = '<p class="malo">No he podido abrir la frecuencia: ' + esc((e && e.message) || e) + '</p>'; });
  }
  function listo() { MOTOR = window.SG.MOTOR; arrancar(); }
  if (window.SG && window.SG.MOTOR) listo(); else document.addEventListener("sg:motor", listo);
})();
