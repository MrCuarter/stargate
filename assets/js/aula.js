// STARGATE — HERRAMIENTAS DE CLASE · lo que se necesita EN DIRECTO, dentro del Genially.  aula.html[?per=<id>]
//
// 🔴 QUÉ PROBLEMA RESUELVE. Dar clase con una gamificación tiene un enemigo concreto: SALIR de la
// presentación. Abrir otra pestaña, buscar el grupo, volver, perder el hilo. Al final no se toca
// nada y el juego se queda en los puntos que el sistema da solo, que es justo lo que no dinamiza.
//
// 🔴 20-sep · Y SOLO LO DE DIRECTO. Norberto: «son cosas distintas. En la sesión son herramientas de gestión de
// aula, rápidas. Dentro del grupo necesito todas las opciones posibles para gestionar y visualizar. ¿Para qué
// quiero un temporizador [en mi grupo]? ¿O seleccionar un estudiante al azar? Son cosas que puedo necesitar en
// una sesión en directo, pero no cuando estoy tranquilamente viendo el progreso de mi clase». Así que aquí:
// quién ha fichado, a quién le toca, una pregunta, una votación, un premio y el tiempo. Lo demás —felicitar,
// rankings, quién se ha movido— está en la Nave del Comandante y en las diapositivas de la sesión, que ya lo
// cuentan: repetirlo aquí era llenar de ruido el momento en el que menos se puede leer.
//
// 🔴 Y el grupo NO va en el enlace: se deduce de quién pulsa. Uno solo para todos los Geniallys, de
// todos los grupos, de todos los años.
(function () {
  var app = document.getElementById("aula-app");
  if (!app) return;
  // 🔴 Sin esto, incrustar la página metía el MENÚ ENTERO de la web dentro del Genially —y con él
  // «Mi clase», «Registro», «Grupos»— justo encima de lo único que se quería enseñar. La hoja de
  // estilos ya sabe esconder cabecera, hero y pie (`body.embed .nav{display:none}`); lo que
  // faltaba era que alguien pusiera la clase. Otras siete páginas lo hacen; estas dos, que son las
  // que de verdad viven embebidas, se habían quedado sin ello.
  if (new URLSearchParams(location.search).get("embed") === "1") document.body.classList.add("embed");
  // 19-sep · dentro del panel de la presentación: el grupo ya está fijado; fuera nombre, selector y «¿Dudas?», y las
  // pestañas en una fila que cabe
  if (new URLSearchParams(location.search).get("panel") === "1") document.body.classList.add("au-panel");
  var url = new URLSearchParams(location.search);
  var PER_FIJO = url.get("per") || "";
  var MOTOR = null, YO = null, GRUPOS = [], PER = "", D = null, TAB = "clase";
  // 19-sep · PILOTO AUTOMÁTICO / MANDO MANUAL (el mismo modo de la consola, de su ficha): en piloto, sin «Premiar»
  var MODO = "piloto";
  try { MODO = localStorage.getItem("sgModoNivel") === "manual" ? "manual" : "piloto"; } catch (e) {}
  // 20-sep · «Premiar» sale SIEMPRE, también en piloto automático: dar un premio en clase es de lo más de directo
  // que hay («poder dar un premio concreto a un estudiante o a toda la clase»), no una opción avanzada.
  function aplicarModoAula() { document.body.classList.toggle("modo-piloto", MODO !== "manual"); }
  var SESION = null, reloj = null, dejarDeVigilar = null, PRESENTES = [];
  // PREMIAR: a quién (se conserva al repintar), de dónde sale la lista y a quién ya se ha preguntado hoy
  var ELEGIDOS = {}, FUENTE_P = "", PRESENTES_HOY = null, PREGUNTADOS = {};

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pinta(h) { app.innerHTML = h; }

  // ---------------------------------------------------------------- puerta
  function puerta(msg) {
    pinta('<div class="au-caja"><div class="au-icono"><img class=ico src=assets/img/iconos/p/envivo.png alt></div><h2>Herramientas de clase</h2>'
      + '<p class="au-sub">' + esc(msg || "Entra con tu cuenta para mover tu clase desde aquí.") + "</p>"
      // 13-sep · con la «G» de Google, como las demás puertas: «entrar con mi cuenta» a secas no dice
      // que la contraseña se escribe en Google y no aquí
      + '<button class="btn primary btn-google" id="au-entrar">' + ((window.SG && window.SG.LOGO_G) || '') +
        '<span>Iniciar sesión con Google</span></button></div>');
    document.getElementById("au-entrar").onclick = function () {
      MOTOR.entrar().catch(function (e) { puerta("No he podido entrar: " + e.message); });
    };
  }
  function noEresDocente() {
    pinta('<div class="au-caja"><div class="au-icono">' + icono("gente") + '</div><h2>Esto es de tu Comandante</h2>'
      + '<p class="au-sub">Este panel lo usa quien da la clase. Lo tuyo está en <b>tu Nave</b>.</p>'
      // 🔴 Una cuenta puede no traer correo (las de prueba, o un proveedor que no lo dé). Sin esta
      // guarda salía «Estás como · No soy yo», que parece la página rota justo cuando estás
      // explicándole a alguien que no pasa nada.
      + '<p class="ll-pie">' + (YO.correo ? 'Estás como ' + esc(YO.correo) + ' · ' : '')
      + '<button class="ll-min" id="au-otra">No soy yo</button></p></div>');
    document.getElementById("au-otra").onclick = function () { MOTOR.salir(); };
  }

  // ---------------------------------------------------------------- los míos
  /** Mi escuadrón: el alumnado de quien está mirando. Con 200 en el grupo, lo demás es ruido. */
  /**
   * MI ESCUADRÓN: el alumnado de quien está mirando. Con 200 en el grupo, lo demás es ruido.
   *
   * 🔴 12-sep · Aquí había un atajo peligroso: si el nombre no cuadraba con ninguno, devolvía TODO
   * el grupo. Silenciosamente. Un docente cuyo nombre estuviera escrito distinto en el equipo veía
   * al alumnado de sus compañeros —con sus nombres— y podía premiar a alguien de otra clase creyendo
   * que era suyo, sin enterarse jamás.
   *
   * Ahora se distingue: si eres el REFERENTE, ver el grupo entero es tu trabajo y se dice. Si eres
   * docente y no cuadras con nadie, es un problema que hay que enseñar, no tapar.
   */
  function soyReferente() {
    var d = (D && D.docentes_full) || [];
    var mio = d.filter(function (x) { return String(x.correo || "").toLowerCase() === YO.correo; })[0];
    if (mio && mio.rol === "referente") return true;
    return String((D && D.referente) || "").toLowerCase() === YO.correo;
  }
  function mios() {
    if (!D) return [];
    var yo = nombreDocente();
    var r = (D.reclutas || []).filter(function (x) { return String(x.profe || "") === yo; });
    if (r.length) return r;
    return soyReferente() ? (D.reclutas || []) : [];
  }
  /** El aviso que explica por qué esta pantalla está vacía, o por qué sale gente de más. */
  function avisoDeQuienVeo() {
    if (!D) return "";
    var yo = nombreDocente();
    var suyos = (D.reclutas || []).filter(function (x) { return String(x.profe || "") === yo; });
    if (suyos.length) return "";
    if (soyReferente())
      return '<p class="au-nota"><img class=ico src=assets/img/iconos/p/corona.png alt> Eres el <b>referente</b> de este grupo: aquí ves a <b>toda</b> la ' +
             "clase, no solo a un escuadrón.</p>";
    return '<p class="au-nota malo"><img class=ico src=assets/img/iconos/p/aviso.png alt> No encuentro alumnado asignado a <b>' + esc(yo || YO.correo) +
      "</b> en este grupo. Puede que tu nombre esté escrito distinto en el equipo docente, o que " +
      "todavía no se haya alistado nadie contigo como Comandante. <b>No te enseño el alumnado de " +
      "otros escuadrones</b>: sería premiar a gente que no es tuya.</p>";
  }
  /**
   * Cómo te llamas en ESTE grupo.
   *
   * 🔴 No sale de tu cuenta de Google sino del equipo docente del grupo, porque es ese nombre el que
   * llevan las fichas del alumnado en «profe». Si se cogiera el de Google, «Vega (prueba)» no
   * cuadraría con «Capitana Vega» y este panel no encontraría a nadie.
   *
   * Los correos del equipo viven en la parte privada del grupo, que es la que trae el tablero con
   * privados — no el listado de proyectos.
   */
  function nombreDocente() {
    var lista = (D && D.docentes_full) || [];
    var mio = lista.filter(function (x) { return String(x.correo || "").toLowerCase() === YO.correo; })[0];
    return (mio && mio.nombre) || YO.nombre || "";
  }

  // ---------------------------------------------------------------- pestañas
  /**
   * 18-sep · Norberto: «la página del aula tiene muchos emojis: usa nuestros iconos personalizados o crea nuevos».
   * El segundo campo es el icono de `assets/img/nave/iconos/` (Magnific, de una sola lámina, como los de la Nave).
   */
  var TABS = [["clase", "envivo", "En clase"], ["premios", "premios", "Premiar"],
              ["pregunta", "pregunta", "Pregunta"], ["voto", "voto", "Votación"], ["tiempo", "tiempo", "Tiempo"]];
  function icono(k) { return '<img class="au-ico" src="assets/img/nave/iconos/' + k + '.png" alt="" width="26" height="26">'; }
  /**
   * 🔴 Con más de un grupo hace falta poder cambiar. Un docente del máster puede llevar hasta seis,
   * y sin selector el aula enseñaba siempre el primero que devolviera el servidor — sin decirlo,
   * que es lo peor: pasarías lista al grupo equivocado sin enterarte.
   */
  /**
   * En qué semana va cada grupo. Con un grupo acabando y otro empezando —que en enero es la
   * norma— el nombre solo no basta para distinguirlos en un desplegable.
   */
  function coletilla(g) {
    if (!g) return "";
    if (g.estado === "por empezar") {
      var faltan = 1 - (g.semana || 0);
      return " · empieza en " + faltan + (faltan === 1 ? " semana" : " semanas");
    }
    if (g.estado === "en marcha") return " · semana " + g.semana + " de " + g.total;
    if (g.estado === "sin fecha") return " · sin fecha";
    // 🔴 Ante la duda, callarse. Si `estado` no llega —un motor.js viejo en caché, un camino nuevo
    // que se olvide de calcularlo— lo anterior etiquetaba TODO como «terminado»: un grupo en plena
    // semana 3 anunciado como acabado. Una coletilla vacía no estorba; una falsa engaña.
    if (g.estado !== "pasado") return "";
    return " · terminado";
  }

  function barra() {
    var g = GRUPOS.filter(function (x) { return x.id === PER; })[0] || {};
    return '<div class="au-barra"><div class="au-quien"><b>' + esc(nombreDocente() || YO.correo) + "</b>"
      + (GRUPOS.length > 1
          ? '<select class="au-grupo" id="au-grupo">' + GRUPOS.map(function (x) {
              return '<option value="' + esc(x.id) + '"' + (x.id === PER ? " selected" : "") + ">"
                + esc(x.nombre || x.id) + esc(coletilla(x)) + "</option>"; }).join("") + "</select>"
          : '<span class="small muted">' + esc(g.nombre || PER) + esc(coletilla(g)) + "</span>")
      + ' <a class="btn min bz-acceso" href="buzon.html?desde=aula&per=' + encodeURIComponent(PER || "") + '" target="_blank" rel="noopener">¿Dudas? ¿Algo falla?</a>'
      + (TAB !== "tiempo" && (TMP.corre || (TMP.quedan > 0 && TMP.quedan < TMP.total))
          ? ' <button type="button" class="au-mini-reloj' + (TMP.corre ? " corre" : "") + '" data-au="tiempo" title="El temporizador">' + icono("tiempo") + ' <span id="au-reloj-mini">' + mmss(quedanTmp()) + '</span></button>' : '')
      + "</div>"
      + '<div class="au-tabs">' + TABS.map(function (t) {
          return '<button type="button" class="au-t' + (TAB === t[0] ? " on" : "") + '" data-au="' + t[0] + '" title="' + t[2] + '">'
            + '<span class="i">' + icono(t[1]) + "</span><b>" + t[2] + "</b></button>"; }).join("") + "</div></div>";
  }

  // ---------------------------------------------------------------- 1 · en clase
  /**
   * 🔴 20-sep · EL ENLACE PARA EL CHAT. Norberto: «añade un enlace rápido para compartir por el chat de Teams
   * [para que] se puedan unir a la sesión (fichaje + se abre presentación)». Entran con su cuenta, fichan solos
   * en cuanto la llamada está abierta y ven la presentación al ritmo de la clase.
   */
  function enlaceSesion() {
    var u = new URL("sesion.html", location.href); u.search = "";
    u.searchParams.set("per", PER); u.searchParams.set("seguir", "1"); u.searchParams.set("fichar", "1");
    return u.href;
  }
  /**
   * Quién está en clase AHORA: los que han respondido a una llamada a filas hoy.
   * 🔴 23-sep · Y AQUÍ TAMBIÉN SE PASA LISTA. Norberto: «necesito un embed exclusivo de herramientas. Solo las herramientas
   * (dar regalos, fichar, estudiante aleatorio, lanzar pregunta…)». Fichar solo se podía tocar desde la presentación, y
   * quien usa este embed suelto no la tiene delante: «Pasar lista» abre la misma llamada (la del motor, la de siempre) y
   * «Cerrar» la cierra. El vigilante de la llamada repinta esta vista solo.
   */
  function vistaClase() {
    var hoy = enClaseHoy(), u = enlaceSesion();
    return '<div class="au-tarjeta au-chat"><div class="au-cab2"><h3>' + icono("gente") + ' Para el chat de la clase</h3>'
      +   '<button type="button" class="btn min" id="au-chat-c">Copiar el enlace</button></div>'
      +   '<p class="small muted">Se unen con su cuenta, fichan solos y siguen la presentación desde su pantalla.</p>'
      +   '<code class="au-chat-u">' + esc(u) + '</code></div>'
      + '<div class="au-tarjeta au-hoy"><div class="au-cab2"><h3>' + icono("envivo") + ' En clase hoy · ' + hoy.length + '</h3>'
      +   (SESION ? '<span class="au-ll"><span class="au-viva">Llamada abierta'
            + (SESION.escuadron ? ' · ' + esc(SESION.escuadron) : '')
            + ' · <b id="au-np">' + PRESENTES.length + '</b> fichando</span>'
            + '<button type="button" class="btn min" id="au-ll-cerrar">Cerrar la llamada</button></span>'
          : '<span class="au-ll"><select id="au-ll-min" aria-label="Cuánto tiempo está abierta">'
            + [10, 30, 60, 120].map(function (m) { return '<option value="' + m + '"' + (m === 30 ? ' selected' : '') + '>' + m + ' min</option>'; }).join("")
            + '</select><button type="button" class="btn min primary" id="au-ll-tocar">' + icono("clase") + ' Pasar lista</button></span>')
      +   '</div>'
      +   (hoy.length
          ? '<div class="au-caras mini">' + hoy.slice(0, 40).map(function (x) {
              var c = caraDe(x);
              return '<span class="au-cara quieta">' + (c ? '<img src="' + esc(c) + '" alt="" loading="lazy">' : '')
                + '<b>' + esc(x.alias) + '</b></span>'; }).join("") + '</div>'
          : '<p class="small muted">Todavía no ha fichado nadie. Pulsa <b>Pasar lista</b>: en cuanto fichen, van apareciendo aquí.</p>')
      +   '<p class="ses-err" id="au-ll-err" aria-live="polite"></p>'
      +   '<div class="au-acciones"><button type="button" class="au-azar-btn" id="au-ir-azar">¿A quién pregunto?</button>'
      +     '<button type="button" class="ll-min" id="au-ir-premiar" data-av>Premiar a los presentes</button></div>'
      +   '<p class="au-elegido" id="au-elegido" aria-live="polite" hidden></p></div>';
  }

  // ---------------------------------------------------------------- 4 · premiar (y preguntar al azar)
  /**
   * 🔴 13-sep · PREMIAR A UNO O A VARIOS, Y PREGUNTAR AL AZAR. Norberto: «un sitio en el que se vean
   * los estudiantes que han respondido a la llamada, los que tengo en clase en directo, para
   * seleccionar uno o varios y darles premios, o un selector aleatorio para hacer una pregunta». Y
   * «regalar también un avatar u otra de las recompensas que podemos ofrecer en clase».
   *
   * Antes era un desplegable con 200 alias y seis botones. Ahora: sus CARAS, que se tocan para
   * elegir (una o varias), la lista de «en clase hoy» —quien ha respondido a una llamada a filas
   * desde las 00:00, aunque ya se haya cerrado— y todo lo regalable: xp, créditos, carta, sobre,
   * héroe (al azar o elegido) y los tres adornos. Lo que no es xp ni créditos lo reparte el
   * servidor, una transacción por estudiante (`stargateRegalar`).
   */
  var REGALOS = [
    { g: "Puntos", k: "xp25", t: "+25 xp", xp: 25, clase: "puntos" }, { g: "Puntos", k: "xp50", t: "+50 xp", xp: 50, clase: "puntos" },
    { g: "Puntos", k: "cr20", t: "+20 ◈", cr: 20, clase: "puntos" }, { g: "Puntos", k: "cr50", t: "+50 ◈", cr: 50, clase: "puntos" },
    { g: "Colección", k: "carta", t: "Una carta", regalo: { tipo: "carta" }, clase: "carta" },
    { g: "Colección", k: "sobre", t: "Un sobre (3 cartas)", regalo: { tipo: "sobre" }, clase: "carta" },
    { g: "Colección", k: "heroe", t: "Un héroe al azar", regalo: { tipo: "heroe" }, clase: "heroe" },
    { g: "Colección", k: "heroe_el", t: "Un héroe que eliges…", elegir: true, clase: "heroe" },
    { g: "Adornos", k: "marco", t: "Marco dorado", regalo: { tipo: "adorno", cual: "marco" }, clase: "adorno" },
    { g: "Adornos", k: "fondo", t: "Fondo de ficha", regalo: { tipo: "adorno", cual: "fondo" }, clase: "adorno" },
    { g: "Adornos", k: "titulo", t: "Título de recluta", regalo: { tipo: "adorno", cual: "titulo" }, clase: "adorno" }
  ];
  /**
   * 🔴 20-sep · CADA PREMIO, CON SU DIBUJO. Norberto: «la sección de a quién cambia el nombre y usa dibujos e
   * iconos para las recompensas, es muy poco visual». Son las MISMAS imágenes que ve el alumnado cuando le llega
   * (`assets/img/canje/`): así lo que proyectas y lo que le sale en su Nave es la misma cosa.
   */
  var IMG_PREMIO = { xp25: "assets/img/iconos/p/rayo.png", xp50: "assets/img/iconos/p/rayo.png",
    cr20: "assets/img/iconos/p/monedas.png", cr50: "assets/img/iconos/p/monedas.png",
    carta: "assets/img/tarjetas/N1_recluta_carta.png", sobre: "assets/img/canje/sobre.jpg",
    heroe: "assets/img/canje/heroe.jpg", heroe_el: "assets/img/canje/heroe.jpg",
    marco: "assets/img/canje/marco.jpg", fondo: "assets/img/canje/planeta.jpg", titulo: "assets/img/canje/titulo.jpg",
    capsula_legendaria: "assets/img/canje/capsula_legendaria.jpg", capsula_elite: "assets/img/canje/capsula_elite.jpg",
    sobre_epico: "assets/img/canje/sobre_epico.jpg", sobre_raro: "assets/img/canje/sobre_raro.jpg",
    sobre_grande: "assets/img/canje/sobre_grande.jpg" };
  function imgPremio(k) {
    if (IMG_PREMIO[k]) return IMG_PREMIO[k];
    if (/^part\d$/.test(k)) { var s = sorteoAbierto(); return "assets/img/canje/" + ((s && s.imagen) || "sorteo_generico.jpg"); }
    return "assets/img/iconos/p/premios.png";
  }
  /**
   * 14-sep · EL GRAN SORTEO: participaciones de regalo (Norberto: «…y el profe regalarlas»). Solo si
   * el grupo tiene un sorteo abierto; si tiene varios, del primero que se sortea.
   */
  function sorteoAbierto() {
    return ((D && D.recompensas) || []).filter(function (x) { return x.tipo === "sorteo" && x.sorteo && !x.sorteo.hecho; })
      .sort(function (a, b) { return (a.sorteo.fecha || 0) - (b.sorteo.fecha || 0); })[0] || null;
  }
  function regalosSorteo() {
    var s = sorteoAbierto(); if (!s) return [];
    return [1, 2, 3].map(function (n) {
      return { g: "Sorteo", k: "part" + n, t: n + " participaci" + (n === 1 ? "ón" : "ones"), regalo: { tipo: "participacion", sorteo: s.doc, n: n }, clase: "sorteo" }; });
  }
  /**
   * 14-sep · LAS CÁPSULAS Y LOS SOBRES NUEVOS, de premio (Norberto: «un cofre legendario, donde siempre
   * toca un avatar legendario… quiero poder ocultarlos en Genially o darlos de recompensa»). Solo los
   * que tenga la tienda del grupo; los reparte el servidor con SU cofre.
   */
  var COFRES_REGALO = [["capsula_legendaria", "Cápsula legendaria", "heroe"], ["capsula_elite", "Cápsula de élite", "heroe"],
                       ["sobre_epico", "Sobre épico", "carta"], ["sobre_raro", "Sobre de raras", "carta"], ["sobre_grande", "Sobre grande (5)", "carta"]];
  function regalosCofres() {
    var hay = {}; ((D && D.recompensas) || []).forEach(function (x) { hay[x.tipo] = true; });
    return COFRES_REGALO.filter(function (c) { return hay[c[0]]; }).map(function (c) {
      return { g: "Cápsulas y sobres", k: c[0], t: c[1], regalo: { tipo: "cofre", cual: c[0] }, clase: c[2] }; });
  }
  function todosLosRegalos() { return REGALOS.concat(regalosCofres()).concat(regalosSorteo()); }
  /**
   * 🔴 17-sep · LO QUE AÚN NO SE HA ABIERTO NO SE REGALA. Norberto: «debes bloquear las recompensas en función de la semana.
   * Si aún no hemos mostrado el sorteo o hay elementos que debido a la semana aún no se han desbloqueado o explicado, bloquea
   * también la opción de darlos. Ensombrécelas y escribe la semana en que se desbloquean. Así no confundimos ni al docente
   * ni al estudiante». Cada regalo mira el capítulo que abre esa pieza en el Mercado (SG_CAPITULOS → `mercado`), la semana
   * del grupo y lo que el referente haya adelantado (capitulosAbiertos), igual que la Nave.
   */
  var PIEZA_DE = { carta: "cromo", sobre: "cromo", heroe: "heroe", heroe_el: "heroe", marco: "marco", fondo: "fondo", titulo: "titulo",
                   sobre_grande: "sobre_grande", sobre_raro: "sobre_raro", sobre_epico: "sobre_epico", capsula_elite: "capsula_elite",
                   capsula_legendaria: "capsula_legendaria", part1: "sorteo", part2: "sorteo", part3: "sorteo" };
  function semanaDeRegalo(k) {
    var pieza = PIEZA_DE[k]; if (!pieza) return 0;
    var tipo = (D && D.tipo) === "PUA" ? "PUA" : "REGULAR", ab = (D && D.capitulosAbiertos) || {};
    var c = (window.SG_CAPITULOS || []).filter(function (x) { return (x.mercado || []).indexOf(pieza) >= 0; })[0];
    if (!c) return 0;
    var suya = (c.semanas || {})[tipo]; if (suya == null) return 99;   // en PUA no existe
    var antes = ab[c.clave] === true ? 1 : Number(ab[c.clave]) || 0;
    return antes && antes < suya ? antes : suya;
  }
  /** 0 si se puede dar; si no, la semana en que se abre (99 = no existe en este tipo de grupo). */
  function regaloCerrado(k) { var s = semanaDeRegalo(k); return s && Number((D && D.semana) || 0) < s ? s : 0; }
  function caraDe(x) {
    try { return (window.SG && SG.avatarSrc) ? SG.avatarSrc(x.avatar, x.alias, x.xp, D && D.tipo).src : ""; }
    catch (e) { return ""; }
  }
  function enClaseHoy() {
    var set = {}; (PRESENTES_HOY || []).forEach(function (u) { set[u] = 1; });
    return mios().filter(function (x) { return x.ficha && set[x.uid]; });
  }
  function listaPremiar() {
    return FUENTE_P === "hoy" ? enClaseHoy() : mios().filter(function (x) { return x.ficha; });
  }
  function elegidos() { return listaPremiar().filter(function (x) { return ELEGIDOS[x.ficha]; }); }
  function textoElegidos() {
    var e = elegidos();
    if (!e.length) return "Toca una o varias caras";
    return "Para " + (e.length === 1 ? "" : e.length + ": ") + e.slice(0, 4).map(function (x) { return x.alias; }).join(", ")
      + (e.length > 4 ? " y " + (e.length - 4) + " más" : "");
  }
  function vistaPremios() {
    var hoy = enClaseHoy();
    if (!FUENTE_P) FUENTE_P = hoy.length ? "hoy" : "todos";
    var g = listaPremiar();
    var heroes = ((window.SG_CATALOGO || {}).heroes) || [];
    return avisoDeQuienVeo()
      + '<div class="au-tarjeta au-quienes">'
      +   '<div class="au-cab2"><h3>¿Quién se lo lleva?</h3><div class="au-seg" role="group" aria-label="De dónde">'
      +     '<button type="button" data-fuente="hoy" aria-pressed="' + (FUENTE_P === "hoy") + '">En clase hoy <b>' + hoy.length + '</b></button>'
      +     '<button type="button" data-fuente="todos" aria-pressed="' + (FUENTE_P === "todos") + '">Todo mi escuadrón <b>' + mios().filter(function (x) { return x.ficha; }).length + '</b></button>'
      +   '</div></div>'
      +   (g.length
          ? '<div class="au-caras" id="au-caras">' + g.map(function (x) {
              var c = caraDe(x);
              return '<button type="button" class="au-cara' + (ELEGIDOS[x.ficha] ? " on" : "") + '" data-ficha="' + esc(x.ficha) + '" aria-pressed="' + (!!ELEGIDOS[x.ficha]) + '">'
                + (c ? '<img src="' + esc(c) + '" alt="" loading="lazy">' : '<span class="au-sin">' + esc((x.alias || "?").charAt(0)) + '</span>')
                + '<b>' + esc(x.alias) + '</b></button>'; }).join("") + '</div>'
          : '<p class="small muted">' + (FUENTE_P === "hoy"
              ? 'Hoy todavía no ha fichado nadie. Abre la llamada a filas en la presentación, o elige de todo tu escuadrón.'
              : 'Todavía no hay nadie en tu escuadrón.') + '</p>')
      +   '<div class="au-acciones">'
      +     '<button type="button" class="ll-min" id="au-todos">' + (FUENTE_P === "hoy" ? "Todos los presentes" : "Toda la clase") + '</button>'
      +     '<button type="button" class="ll-min" id="au-nadie">Ninguno</button>'
      +     '<button type="button" class="au-azar-btn" id="au-azar"' + (g.length ? '' : ' disabled') + '>Uno al azar</button>'
      +     '<label class="au-sinrep" title="Quien ya ha salido hoy no vuelve a salir hasta que hayan salido todos"><input type="checkbox" id="au-sinrep" checked> Sin repetir</label>'
      +   '</div>'
      +   '<div id="au-sorteo" class="au-sorteo" hidden></div>'
      + '</div>'
      + '<div class="au-tarjeta"><div class="au-cab2"><h3>¿Qué le das?</h3><span class="au-para" id="au-para">' + esc(textoElegidos()) + '</span></div>'
      // tres filas con su nombre —puntos, colección, adornos— en una rejilla que no deja filas cojas
      +   ["Puntos", "Colección", "Cápsulas y sobres", "Adornos", "Sorteo"].filter(function (grupo) {
            return (grupo !== "Sorteo" || regalosSorteo().length) && (grupo !== "Cápsulas y sobres" || regalosCofres().length); }).map(function (grupo) {
            var suyos = todosLosRegalos().filter(function (r) { return r.g === grupo; });
            return '<div class="au-grupo-pr' + (suyos.length === 3 ? ' tres' : '') + '" style="--n:' + suyos.length + '"><span class="au-gt">' + grupo + '</span><div class="au-premios">'
              + suyos.map(function (r) {
                  var cerr = regaloCerrado(r.k);
                  return '<button type="button" class="au-pr' + (r.clase ? " " + r.clase : "") + (cerr ? " cerrado" : "") + '" data-k="' + r.k + '"'
                    + (cerr ? ' disabled title="' + (cerr === 99 ? "No existe en un grupo PUA" : "Se desbloquea en la semana " + cerr) + '"' : '')
                    + (r.xp || r.cr ? ' data-xp="' + (r.xp || 0) + '" data-cr="' + (r.cr || 0) + '"' : '') + '>'
                    + '<img class="au-pr-i" src="' + esc(imgPremio(r.k)) + '" alt="" loading="lazy"><span class="au-pr-t">' + r.t + '</span>'
                    + (cerr ? '<span class="au-sem">' + (cerr === 99 ? "No en PUA" : "Semana " + cerr) + '</span>' : '') + '</button>'; }).join("")
              + '</div></div>'; }).join("")
      +   '<div class="au-heroe-el" id="au-heroe-el" hidden>'
      +     '<img id="au-heroe-img" src="' + (heroes[0] ? 'assets/img/heroes/' + esc(heroes[0].clave) + '.jpg' : '') + '" alt="" width="64" height="64">'
      +     '<select id="au-heroe">' + heroes.map(function (h) {
              return '<option value="' + esc(h.clave) + '">' + esc(h.nombre) + ' · ' + esc(String(h.rareza || "").toLowerCase()) + '</option>'; }).join("") + '</select>'
      +     '<button type="button" class="btn primary" id="au-heroe-dar">Dárselo</button>'
      +   '</div>'
      +   '<div class="ll-pie au-res" id="au-pmsg" aria-live="polite"></div></div>';
  }

  // ---------------------------------------------------------------- 5 · el tiempo
  /**
   * 15-sep · EL TEMPORIZADOR. Norberto: «incluso la opción de poner algún timer para gestionar los tiempos».
   * En grande para proyectarlo (y a pantalla completa), con aviso al terminar. Sigue contando aunque se
   * cambie de pestaña o de grupo: el reloj va por la hora de fin, no por los ticks, y lleva un mini
   * contador en la barra para no perderlo de vista.
   */
  var TMP = { total: 300, quedan: 300, fin: 0, corre: false, iv: null, fin_ok: false };
  function mmss(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function quedanTmp() { return TMP.corre ? Math.max(0, (TMP.fin - Date.now()) / 1000) : TMP.quedan; }
  function vistaTiempo() {
    var q = quedanTmp(), pct = TMP.total ? Math.round(q * 100 / TMP.total) : 0;
    return '<div class="au-tiempo' + (TMP.fin_ok && q <= 0 ? " fin" : q <= 10 && TMP.corre ? " ultimos" : "") + '" id="au-tiempo">'
      + '<div class="au-reloj" id="au-reloj">' + mmss(q) + '</div>'
      + '<div class="au-t-barra"><i id="au-t-barra" style="width:' + pct + '%"></i></div>'
      + '<div class="au-t-pre">' + [1, 3, 5, 10, 15].map(function (m) {
          return '<button type="button" class="btn' + (TMP.total === m * 60 ? " on" : "") + '" data-min="' + m + '">' + m + ' min</button>'; }).join("")
      + '<label class="au-t-otro">Otro <input type="number" id="au-t-min" min="1" max="180" inputmode="numeric" placeholder="min"></label></div>'
      + '<div class="au-t-ctl"><button type="button" class="btn primary grande" id="au-t-go">'
      + (TMP.corre ? "<img class=ico src=assets/img/iconos/p/pausa.png alt> Pausa" : (TMP.quedan > 0 && TMP.quedan < TMP.total ? "▶ Seguir" : "▶ Empezar")) + '</button>'
      + '<button type="button" class="btn" id="au-t-reset">↺ Reiniciar</button>'
      + '<button type="button" class="btn" id="au-t-grande">⛶ Pantalla completa</button></div>'
      + '<p class="small muted">Suena un aviso al terminar. Sigue contando aunque cambies de pestaña.</p></div>';
  }
  /**
   * 18-sep · Norberto: «si el docente lanza temporizador, votación o pregunta, que se pinte sobre la diapositiva actual
   * para que los estudiantes en directo contesten». El temporizador viaja en la ficha «en vivo» del grupo (`sesion.crono`,
   * dentro del mapa que ya podía escribir el docente: no hacen falta reglas nuevas) y la sesión de cada recluta lo pinta.
   */
  function emitirCrono() {
    if (!PER || !window.SG || !SG.MOTOR || !SG.MOTOR.publicarEnVivo) return;
    var c = TMP.corre ? { hasta: TMP.fin, total: TMP.total } : null;
    SG.MOTOR.publicarEnVivo(PER, { sesion: { crono: c } }).catch(function () {});
  }
  function poner(seg) { TMP.total = seg; TMP.quedan = seg; TMP.corre = false; TMP.fin_ok = false; clearInterval(TMP.iv); TMP.iv = null; emitirCrono(); render(); }
  function cablearTiempo() {
    Array.prototype.forEach.call(app.querySelectorAll("[data-min]"), function (b) { b.onclick = function () { poner(Number(b.getAttribute("data-min")) * 60); }; });
    var otro = document.getElementById("au-t-min");
    if (otro) otro.onchange = function () { var m = Math.round(Number(otro.value)); if (m >= 1 && m <= 180) poner(m * 60); };
    document.getElementById("au-t-go").onclick = function () {
      if (TMP.corre) { TMP.quedan = quedanTmp(); TMP.corre = false; clearInterval(TMP.iv); TMP.iv = null; }
      else { if (TMP.quedan <= 0) TMP.quedan = TMP.total; TMP.fin = Date.now() + TMP.quedan * 1000; TMP.corre = true; TMP.fin_ok = false;
             clearInterval(TMP.iv); TMP.iv = setInterval(tic, 250); }
      emitirCrono();
      render();
    };
    document.getElementById("au-t-reset").onclick = function () { poner(TMP.total); };
    document.getElementById("au-t-grande").onclick = function () {
      var t = document.getElementById("au-tiempo"); if (t && t.requestFullscreen) t.requestFullscreen().catch(function () {});
    };
  }
  function tic() {
    var q = quedanTmp(), r = document.getElementById("au-reloj"), m = document.getElementById("au-reloj-mini"), b = document.getElementById("au-t-barra");
    if (r) r.textContent = mmss(q);
    if (m) m.textContent = mmss(q);
    if (b) b.style.width = (TMP.total ? Math.round(q * 100 / TMP.total) : 0) + "%";
    var caja = document.getElementById("au-tiempo"); if (caja) caja.classList.toggle("ultimos", TMP.corre && q <= 10 && q > 0);
    if (TMP.corre && q <= 0) {
      TMP.corre = false; TMP.quedan = 0; TMP.fin_ok = true; clearInterval(TMP.iv); TMP.iv = null; campana(); emitirCrono();
      if (TAB === "tiempo") render(); else { var mm = document.querySelector(".au-mini-reloj"); if (mm) { mm.classList.remove("corre"); mm.classList.add("fin"); } }
    }
  }
  function campana() {
    try {
      var C = new (window.AudioContext || window.webkitAudioContext)();
      [0, .35, .7].forEach(function (t) {
        var o = C.createOscillator(), g = C.createGain(); o.type = "sine"; o.frequency.value = t === .7 ? 1175 : 880;
        g.gain.setValueAtTime(.0001, C.currentTime + t); g.gain.exponentialRampToValueAtTime(.45, C.currentTime + t + .02);
        g.gain.exponentialRampToValueAtTime(.0001, C.currentTime + t + .32); o.connect(g); g.connect(C.destination);
        o.start(C.currentTime + t); o.stop(C.currentTime + t + .34);
      });
    } catch (e) {}
  }

  // ---------------------------------------------------------------- 6 · la votación (16-sep)
  /**
   * Norberto: «las votaciones en vivo deberían vivir también en el mismo sitio que los cronómetros, es gestión de aula.
   * También cada docente puede publicar una votación para que respondan, la próxima semana se resuelve. Ejemplo: ¿qué
   * herramienta prefieres que aprendamos la próxima semana? GamificaPro tiene algo divertido, compra voto extra».
   *
   * La pone quien da la clase, para SU escuadrón o para todo el grupo; el alumnado vota desde su Nave (o aquí mismo, si
   * se proyecta); y se resuelve la semana siguiente. Lo cuenta el servidor (`castVote`), también el VOTO EXTRA de pago:
   * el precio va en la votación, no en el navegador.
   */
  var VOT = { lista: null, cargando: false, error: "" };
  var CFGV = window.SG_VOTACION || { min_opciones: 2, max_opciones: 5, voto_extra: 15, max_extra: 2, ejemplos: [] };
  function cargarVotaciones(forzar) {
    if (VOT.cargando || (VOT.lista && !forzar)) return;
    VOT.cargando = true;
    MOTOR.votaciones(PER).then(function (l) { VOT.lista = l; VOT.cargando = false; if (TAB === "voto") render(); })
      .catch(function (e) { VOT.cargando = false; VOT.error = e.message || String(e); if (TAB === "voto") render(); });
  }
  function miEscuadron() {
    var yo = nombreDocente();
    return ((D && D.escuadrones) || []).filter(function (e) { return String(e.comandante || "") === yo; })[0] || null;
  }
  function votosDe(v) {
    return (v.options || []).reduce(function (n, o) { return n + Number(o.totalFreeVotes || 0) + (Number(v.costPerVote || 0) ? Math.round(Number(o.totalCoinsInvested || 0) / Number(v.costPerVote)) : 0); }, 0);
  }
  function conteo(v, o) {
    var pagados = Number(v.costPerVote || 0) ? Math.round(Number(o.totalCoinsInvested || 0) / Number(v.costPerVote)) : 0;
    return { total: Number(o.totalFreeVotes || 0) + pagados, pagados: pagados };
  }
  function barraVoto(v, o, total) {
    var c = conteo(v, o), pct = total ? Math.round(c.total * 100 / total) : 0;
    return '<li class="au-vt-op"><div class="au-vt-t"><b>' + esc(o.title) + '</b><span>' + c.total
      + (c.pagados ? ' <em title="votos extra pagados">(+' + c.pagados + ' ◈)</em>' : '') + '</span></div>'
      + '<div class="au-vt-barra"><i style="width:' + pct + '%"></i></div></li>';
  }
  // 17-sep · los votos llegan en directo (antes había que recargar para ver cuántos iban)
  function vigilarVotosAula() {
    if (!MOTOR.vigilarVotaciones || VOT.vigila === PER) return;
    if (VOT.parar) VOT.parar();
    VOT.vigila = PER;
    VOT.parar = MOTOR.vigilarVotaciones(PER, function (activas) {
      if (VOT.lista === null) return;
      var ids = activas.map(function (v) { return v.id; });
      VOT.lista = activas.concat(VOT.lista.filter(function (v) { return !v.isActive && ids.indexOf(v.id) < 0; }));
      var hayViva = activas.length > 0;
      if (TAB === "voto" && (hayViva || VOT.habiaViva)) render();
      VOT.habiaViva = hayViva;
    });
  }
  function vistaVoto() {
    vigilarVotosAula();
    if (VOT.lista === null) { cargarVotaciones(); return '<div class="au-caja"><p class="ll-esperando">Cargando las votaciones…</p></div>'; }
    var mias = VOT.lista, viva = mias.filter(function (v) { return v.isActive; })[0] || null;
    var cerradas = mias.filter(function (v) { return !v.isActive; }).slice(0, 3);
    var esc7 = miEscuadron();
    var sem = (D && D.semana) || 0;
    var html = '<div class="au-caja">';
    if (VOT.error) html += '<p class="au-nota malo">No he podido leer las votaciones: ' + esc(VOT.error) + '</p>';
    if (viva) {
      var total = votosDe(viva);
      html += '<div class="au-tarjeta au-vt-viva"><div class="eyebrow amber">' + (viva.stargateModo === "diferido"
          ? 'Votación en diferido' + (viva.stargateCierra ? ' · se cierra el ' + esc(new Date(Number(viva.stargateCierra)).toLocaleDateString("es-ES", { day: "numeric", month: "short" })) : '')
          : 'Votación en directo')
        + (viva.eligibleFactionId ? ' · solo ' + esc(nombreEscuadron(viva.eligibleFactionId)) : ' · todo el grupo') + '</div>'
        + '<h3>' + esc(viva.title) + '</h3>'
        + '<ul class="au-vt-lista">' + (viva.options || []).map(function (o) { return barraVoto(viva, o, total); }).join("") + '</ul>'
        + '<p class="small muted">' + total + (total === 1 ? ' voto' : ' votos')
        + (Number(viva.costPerVote || 0) ? ' · voto extra a ' + viva.costPerVote + ' ◈ (hasta ' + (viva.maxPaidVotesPerPerson || 0) + ' por persona)' : ' · sin voto extra')
        + (viva.stargateResuelve ? ' · se resuelve en la semana ' + viva.stargateResuelve : '') + '</p>'
        + '<p class="small muted">Le aparece al momento en su Nave (arriba, en cualquier pestaña) y en la sesión. Los votos llegan aquí en directo. Se cierra cuando tú quieras.</p>'
        + '<div class="au-vt-botones"><button class="btn primary" id="au-vt-cerrar">Cerrar y resolver</button>'
        + '<button class="btn min" id="au-vt-borrar">Borrar</button></div></div>';
    } else {
      html += '<div class="au-tarjeta"><div class="eyebrow verde">Nueva votación</div>'
        + '<h3>Pregunta a tu clase</h3>'
        + '<p class="small muted">La responden desde su Nave durante la semana y la resuelves en la siguiente clase. '
        + 'Ejemplo: «' + esc((CFGV.ejemplos || [])[0] || "¿Qué herramienta prefieres que veamos la semana que viene?") + '»</p>'
        + '<label class="au-et">La pregunta</label>'
        + '<input id="au-vt-preg" class="au-inp" maxlength="' + (CFGV.pregunta_max || 120) + '" placeholder="' + esc((CFGV.ejemplos || [])[0] || "") + '">'
        + '<label class="au-et">Las opciones</label><div id="au-vt-ops">'
        + [0, 1].map(function (i) { return '<input class="au-inp au-vt-op-inp" maxlength="' + (CFGV.opcion_max || 60) + '" placeholder="Opción ' + (i + 1) + '">'; }).join("")
        + '</div><button class="btn min" id="au-vt-mas">+ Añadir opción</button>'
        + '<div class="au-vt-ajustes">'
        + '<label class="au-check"><input type="checkbox" id="au-vt-extra" checked> Dejar <b>comprar voto extra</b> por ' + (CFGV.voto_extra || 15) + ' ◈ (hasta ' + (CFGV.max_extra || 2) + ')</label>'
        + (esc7 ? '<label class="au-check"><input type="checkbox" id="au-vt-mio" checked> Solo para <b>' + esc(esc7.nombre) + '</b> (tu escuadrón)</label>' : '')
        // 17-sep · Norberto: «deberíamos distinguir entre votaciones en diferido o directo»
        + '<div class="au-vt-modo" role="radiogroup" aria-label="Cuándo se vota">'
        +   '<label class="au-check"><input type="radio" name="au-vt-modo" value="directo" checked> <b>En directo</b>: se vota ahora, en clase (les salta en su Nave y en la sesión)</label>'
        +   '<label class="au-check"><input type="radio" name="au-vt-modo" value="diferido"> <b>En diferido</b>: abierta <input type="number" id="au-vt-dias" class="au-inp au-vt-dias" min="1" max="14" value="3"> días; cada cual vota cuando entra</label>'
        + '</div>'
        + '</div>'
        + '<p class="small muted">Se resolverá en la <b>semana ' + (sem + 1) + '</b>.</p>'
        + '<button class="btn primary" id="au-vt-crear">Publicar la votación</button>'
        + '<p class="ll-pie" id="au-vt-msg"></p></div>';
    }
    if (cerradas.length) {
      html += '<div class="au-tarjeta"><h3>Resueltas</h3>' + cerradas.map(function (v) {
        var total = votosDe(v);
        var gana = (v.options || []).slice().sort(function (a, b) { return conteo(v, b).total - conteo(v, a).total; })[0];
        return '<p class="au-vt-vieja"><b>' + esc(v.title) + '</b><br><span class="small muted">Ganó «' + esc((gana || {}).title || "—")
          + '» con ' + (gana ? conteo(v, gana).total : 0) + ' de ' + total + ' votos</span></p>';
      }).join("") + '</div>';
    }
    return html + '</div>';
  }
  function cablearVoto() {
    var cerrar = document.getElementById("au-vt-cerrar");
    if (cerrar) cerrar.onclick = function () {
      var viva = (VOT.lista || []).filter(function (v) { return v.isActive; })[0]; if (!viva) return;
      cerrar.disabled = true; cerrar.textContent = "Cerrando…";
      MOTOR.cerrarVotacion(PER, viva.id).then(function () { cargarVotaciones(true); })
        .catch(function (e) { cerrar.disabled = false; cerrar.textContent = "Cerrar y resolver"; window.SG.avisar("No he podido cerrar la votación", e.message, true); });
    };
    var borrar = document.getElementById("au-vt-borrar");
    if (borrar) borrar.onclick = async function () {
      var viva = (VOT.lista || []).filter(function (v) { return v.isActive; })[0]; if (!viva) return;
      if (!(await window.SG.preguntar({ titulo: "¿Borrar la votación?", texto: "Se pierde lo votado.", si: "Borrar la votación", peligro: true }))) return;
      MOTOR.borrarVotacion(PER, viva.id).then(function () { cargarVotaciones(true); })
        .catch(function (e) { window.SG.avisar("No he podido borrar la votación", e.message, true); });
    };
    var mas = document.getElementById("au-vt-mas");
    if (mas) mas.onclick = function () {
      var caja = document.getElementById("au-vt-ops");
      if (caja.querySelectorAll("input").length >= (CFGV.max_opciones || 5)) { mas.disabled = true; return; }
      var i = document.createElement("input");
      i.className = "au-inp au-vt-op-inp"; i.maxLength = CFGV.opcion_max || 60;
      i.placeholder = "Opción " + (caja.querySelectorAll("input").length + 1);
      caja.appendChild(i); i.focus();
      if (caja.querySelectorAll("input").length >= (CFGV.max_opciones || 5)) mas.disabled = true;
    };
    var crear = document.getElementById("au-vt-crear");
    if (crear) crear.onclick = function () {
      var preg = (document.getElementById("au-vt-preg").value || "").trim();
      var ops = [].slice.call(app.querySelectorAll(".au-vt-op-inp")).map(function (x) { return x.value.trim(); }).filter(Boolean);
      var msg = document.getElementById("au-vt-msg");
      if (preg.length < 5 || ops.length < (CFGV.min_opciones || 2)) {
        msg.textContent = "Escribe la pregunta y al menos dos opciones."; msg.className = "ll-pie malo"; return;
      }
      var extra = document.getElementById("au-vt-extra").checked;
      var mio = document.getElementById("au-vt-mio");
      var esc7 = miEscuadron();
      crear.disabled = true; msg.className = "ll-pie"; msg.textContent = "Publicando…";
      MOTOR.crearVotacion(PER, {
        pregunta: preg, opciones: ops,
        extra: extra ? (CFGV.voto_extra || 15) : 0, maxExtra: extra ? (CFGV.max_extra || 2) : 0,
        escuadron: (mio && mio.checked && esc7) ? esc7.id : "",
        semana: (D && D.semana) || null, resuelve: ((D && D.semana) || 0) + 1, profe: nombreDocente(),
        modo: ((app.querySelector('input[name="au-vt-modo"]:checked') || {}).value) || "directo",
        dias: Number((document.getElementById("au-vt-dias") || {}).value) || 3,
      }).then(function () { cargarVotaciones(true); })
        .catch(function (e) { crear.disabled = false; msg.textContent = "No he podido publicarla: " + e.message; msg.className = "ll-pie malo"; });
    };
  }

  // ---------------------------------------------------------------- pintar
  // ---------------------------------------------------------------- 7 · la pregunta en directo
  /**
   * 🔴 17-sep · Norberto: «además de votación me gustaría lanzar pregunta en directo. Los estudiantes pueden responder
   * escribiendo directamente. Las respuestas van apareciendo en tiempo real mientras cada estudiante contesta. Aparece su
   * alias y avatar junto con la respuesta». Se lanza aquí; a cada recluta le salta en su Nave (y en la sesión); su respuesta
   * cae en este muro al momento. «Proyectar» lo pone a pantalla completa. Se puede quitar una respuesta que no deba verse.
   */
  var PQ = { d: {}, resp: [], de: "", parar: null, pararEnv: null };
  function preguntaDelGrupo() { return (PQ.d || {}).pregunta || null; }
  function vigilarPregunta() {
    if (!MOTOR.vigilarEnVivo || PQ.pararEnv === PER) return;
    if (PQ.pararFn) PQ.pararFn();
    PQ.pararEnv = PER;
    PQ.pararFn = MOTOR.vigilarEnVivo(PER, function (d) {
      PQ.d = d || {};
      var p = preguntaDelGrupo();
      if (p && p.id !== PQ.de) {
        PQ.de = p.id; PQ.resp = [];
        if (PQ.parar) PQ.parar();
        PQ.parar = MOTOR.vigilarRespuestas(PER, p.id, function (l) { PQ.resp = l; pintarMuro(); });
      }
      var firma = p ? p.id + (p.abierta ? "+" : "-") : "";
      if (TAB === "pregunta" && firma !== PQ.firma) render();   // (la sesión que proyecta también mueve esta ficha: eso no repinta)
      PQ.firma = firma;
    });
  }
  function muroHtml() {
    var p = preguntaDelGrupo(); if (!p) return "";
    var porFicha = {}; (D && D.reclutas || []).forEach(function (x) { if (x.ficha) porFicha[x.ficha] = x; });
    return PQ.resp.length ? PQ.resp.map(function (r) {
      var x = porFicha[r.fichaId] || { alias: r.alias }, c = caraDe(x);
      return '<div class="au-pq-r"><span class="au-pq-cara">' + (c ? '<img src="' + esc(c) + '" alt="" loading="lazy">' : esc((r.alias || "?").charAt(0))) + '</span>'
        + '<div><b>' + esc(r.alias || x.alias || "") + '</b><p>' + esc(r.texto) + '</p></div>'
        + '<button type="button" class="au-pq-quitar" data-pq-quitar="' + esc(r.id) + '" title="Quitar esta respuesta">✕</button></div>';
    }).join("") : '<p class="ll-esperando">Esperando respuestas…</p>';
  }
  function pintarMuro() {
    var m = document.getElementById("au-pq-muro"), n = document.getElementById("au-pq-n");
    if (m) m.innerHTML = muroHtml();
    if (n) n.textContent = PQ.resp.length + (PQ.resp.length === 1 ? " respuesta" : " respuestas");
  }
  function vistaPregunta() {
    vigilarPregunta();
    var p = preguntaDelGrupo(), abierta = p && p.abierta;
    var html = '<div class="au-caja">';
    if (abierta) {
      html += '<div class="au-tarjeta au-pq-viva" id="au-pq-viva"><div class="eyebrow amber">Pregunta en directo' + (p.por ? ' · ' + esc(p.por) : '') + '</div>'
        + '<h3 class="au-pq-texto">' + esc(p.texto) + '</h3>'
        + '<p class="small muted"><b id="au-pq-n">' + PQ.resp.length + (PQ.resp.length === 1 ? " respuesta" : " respuestas") + '</b> · les salta en su Nave y en la sesión; aquí aparecen al momento, con su alias y su cara.</p>'
        + '<div class="au-pq-muro" id="au-pq-muro">' + muroHtml() + '</div>'
        + '<div class="au-vt-botones"><button class="btn primary" id="au-pq-cerrar">Cerrar la pregunta</button>'
        + '<button class="btn min" id="au-pq-proyectar">⛶ Proyectar</button></div></div>';
    } else {
      html += '<div class="au-tarjeta"><div class="eyebrow verde">Pregunta en directo</div>'
        + '<h3>Lanza una pregunta a tu clase</h3>'
        + '<p class="small muted">Contestan escribiendo, desde su Nave o desde la sesión, y ves sus respuestas aparecer aquí en tiempo real. Ejemplo: «¿Qué es lo que más os ha costado de la actividad?»</p>'
        + '<textarea id="au-pq-inp" class="au-inp au-pq-inp" maxlength="300" rows="3" placeholder="Escribe la pregunta"></textarea>'
        + '<button class="btn primary" id="au-pq-lanzar">Lanzar la pregunta</button><p class="ll-pie" id="au-pq-msg"></p></div>';
      if (p && PQ.resp.length) html += '<div class="au-tarjeta"><div class="eyebrow">La última (cerrada)</div><h3>' + esc(p.texto) + '</h3>'
        + '<div class="au-pq-muro" id="au-pq-muro">' + muroHtml() + '</div></div>';
    }
    return html + '</div>';
  }
  function cablearPregunta() {
    var lanzar = document.getElementById("au-pq-lanzar");
    if (lanzar) lanzar.onclick = function () {
      var txt = (document.getElementById("au-pq-inp").value || "").trim(), msg = document.getElementById("au-pq-msg");
      if (txt.length < 3) { msg.textContent = "Escribe la pregunta."; msg.className = "ll-pie malo"; return; }
      lanzar.disabled = true; msg.className = "ll-pie"; msg.textContent = "Lanzando…";
      MOTOR.lanzarPregunta(PER, txt, nombreDocente()).catch(function (e) {
        lanzar.disabled = false; msg.textContent = "No he podido lanzarla: " + e.message; msg.className = "ll-pie malo"; });
    };
    var cerrar = document.getElementById("au-pq-cerrar");
    if (cerrar) cerrar.onclick = function () {
      cerrar.disabled = true;
      MOTOR.cerrarPregunta(PER).catch(function (e) { cerrar.disabled = false; window.SG.avisar("No he podido cerrarla", e.message, true); });
    };
    var proy = document.getElementById("au-pq-proyectar");
    if (proy) proy.onclick = function () { var el = document.getElementById("au-pq-viva"); if (el && el.requestFullscreen) el.requestFullscreen().catch(function () {}); };
  }
  // (delegado: el muro se repinta solo con cada respuesta y los botones se renuevan)
  document.addEventListener("click", async function (ev) {
    var b = ev.target && ev.target.closest && ev.target.closest("[data-pq-quitar]"); if (!b) return;
    if (!(await window.SG.preguntar({ titulo: "¿Quitar esta respuesta?", texto: "Deja de verse aquí y en la proyección.", si: "Quitarla", peligro: true }))) return;
    MOTOR.quitarRespuesta(b.getAttribute("data-pq-quitar")).catch(function (e) { window.SG.avisar("No he podido quitarla", e.message, true); });
  });

  function render() {
    aplicarModoAula();
    pinta(barra() + '<div class="au-cuerpo">'
      + (TAB === "clase" ? vistaClase() : TAB === "tiempo" ? vistaTiempo()
        : TAB === "voto" ? vistaVoto() : TAB === "pregunta" ? vistaPregunta() : vistaPremios()) + "</div>");
    Array.prototype.forEach.call(app.querySelectorAll("[data-au]"), function (b) {
      b.onclick = function () { TAB = b.getAttribute("data-au"); render(); };
    });
    var selG = document.getElementById("au-grupo");
    if (selG) selG.onchange = function () {
      // 🔴 Y la lista de presentes TAMBIÉN. Se limpiaba `SESION` pero no `PRESENTES`: al saltar del
      // grupo que acaba al que empieza, el aula seguía anunciando «12 presentes» —los de la otra
      // clase— hasta que la siguiente consulta lo pisara. Ver a gente que no está delante es peor
      // que no ver a nadie.
      PER = selG.value; SESION = null; PRESENTES = []; PRESENTES_HOY = null; ELEGIDOS = {}; FUENTE_P = "";
      pinta('<div class="au-caja"><p class="ll-esperando">Cambiando de grupo…</p></div>');
      MOTOR.tablero(PER, true).then(function (t) { D = t; render(); vigilar(); cargarPresentesHoy(); })
        .catch(function (e) { puerta("No he podido leer ese grupo: " + e.message); });
    };
    if (TAB === "clase") cablearClase();
    if (TAB === "premios") cablearPremios();
    if (TAB === "tiempo") cablearTiempo();
    if (TAB === "voto") cablearVoto();
    if (TAB === "pregunta") cablearPregunta();
    if (SESION) pintaPresentes();
  }

  function cablearClase() {
    var cop = document.getElementById("au-chat-c");
    if (cop) cop.onclick = function () {
      var txt = "Clase de hoy: entra aquí, fichas solo y ves la presentación al mismo ritmo que en clase.\n" + enlaceSesion();
      (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(txt) : Promise.reject())
        .then(function () { cop.textContent = "✓ Copiado"; }, function () { cop.textContent = "Selecciónalo y cópialo"; });
    };
    // 23-sep · pasar lista desde aquí (la misma llamada que la de la presentación)
    var tocar = document.getElementById("au-ll-tocar"), cerrarLl = document.getElementById("au-ll-cerrar"), errLl = document.getElementById("au-ll-err");
    if (tocar) tocar.onclick = function () {
      tocar.disabled = true; tocar.textContent = "Abriendo…"; if (errLl) errLl.textContent = "";
      var min = Number((document.getElementById("au-ll-min") || {}).value) || 30;
      MOTOR.abrirLlamada(PER, min, {}).catch(function (e) {
        tocar.disabled = false; tocar.textContent = "Pasar lista"; if (errLl) errLl.textContent = String((e && e.message) || e); });
    };
    if (cerrarLl) cerrarLl.onclick = function () {
      if (!SESION) return; cerrarLl.disabled = true;
      MOTOR.cerrarLlamada(SESION.id).catch(function (e) { cerrarLl.disabled = false; if (errLl) errLl.textContent = String((e && e.message) || e); });
    };
    // «En clase hoy» → a Premiar, con la lista de hoy (y ya sorteando, o con todos elegidos)
    var ia = document.getElementById("au-ir-azar"), ip = document.getElementById("au-ir-premiar");
    if (ia) ia.onclick = function () {
      TAB = "premios"; FUENTE_P = "hoy"; render();
      var b = document.getElementById("au-azar"); if (b) b.click(); };
    if (ip) ip.onclick = function () { TAB = "premios"; FUENTE_P = "hoy"; ELEGIDOS = {};
      enClaseHoy().forEach(function (x) { ELEGIDOS[x.ficha] = true; }); render(); };
  }

  function cablearPremios() {
    var msg = document.getElementById("au-pmsg"), para = document.getElementById("au-para");
    var marcar = function () {
      Array.prototype.forEach.call(app.querySelectorAll(".au-cara"), function (b) {
        var on = !!ELEGIDOS[b.getAttribute("data-ficha")];
        b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on));
      });
      if (para) para.textContent = textoElegidos();
    };
    Array.prototype.forEach.call(app.querySelectorAll("[data-fuente]"), function (b) {
      b.onclick = function () { FUENTE_P = b.getAttribute("data-fuente"); render(); };
    });
    Array.prototype.forEach.call(app.querySelectorAll(".au-cara"), function (b) {
      b.onclick = function () { var f = b.getAttribute("data-ficha"); if (ELEGIDOS[f]) delete ELEGIDOS[f]; else ELEGIDOS[f] = true; marcar(); };
    });
    document.getElementById("au-todos").onclick = function () { listaPremiar().forEach(function (x) { ELEGIDOS[x.ficha] = true; }); marcar(); };
    document.getElementById("au-nadie").onclick = function () { ELEGIDOS = {}; marcar(); };
    document.getElementById("au-azar").onclick = function () { sortear(marcar); };

    // 17-sep · y a cada uno le salta en su Nave lo que le has dado (al momento, o al entrar si no estaba)
    var avisar = function (ficha, regalo) {
      var x = mios().filter(function (y) { return y.ficha === ficha; })[0];
      if (!x || !x.uid || !MOTOR.avisarRecluta) return;
      MOTOR.avisarRecluta(PER, x.uid, { accion: "regalo", de: nombreDocente(), regalo: regalo }).catch(function () {});
    };
    var dar = function (r, boton) {
      var e = elegidos();
      if (!e.length) { msg.textContent = "Elige antes a quién: toca su cara."; return; }
      var botones = app.querySelectorAll(".au-pr:not(.cerrado), #au-heroe-dar");
      Array.prototype.forEach.call(botones, function (b) { b.disabled = true; });
      msg.innerHTML = "Repartiendo…";
      var fin = function (html) { Array.prototype.forEach.call(botones, function (b) { b.disabled = false; }); msg.innerHTML = html; recargar(); };
      if (r.xp || r.cr) {
        // xp y créditos: su camino con asiento en el libro, uno detrás de otro (no a la vez: cada uno es una escritura del motor)
        var hechos = [], fallos = [];
        e.reduce(function (p, x) {
          return p.then(function () {
            return MOTOR.premiar(PER, x.ficha, { xp: r.xp || 0, creditos: r.cr || 0, motivo: "Premio en clase" })
              .then(function () { hechos.push(x.alias); avisar(x.ficha, { tipo: "puntos", xp: r.xp || 0, creditos: r.cr || 0 }); },
                    function (er) { fallos.push(x.alias + " (" + (er && er.message || er) + ")"); });
          });
        }, Promise.resolve()).then(function () {
          fin((hechos.length ? "<img class=ico src=assets/img/iconos/p/hecho.png alt> <b>" + esc(hechos.join(", ")) + "</b>: " + (r.xp ? "+" + r.xp + " xp " : "") + (r.cr ? "+" + r.cr + " ◈" : "") : "")
            + (fallos.length ? '<br><span class="malo">No he podido con: ' + esc(fallos.join(", ")) + '</span>' : ""));
        });
        return;
      }
      MOTOR.regalarEnClase(PER, e.map(function (x) { return x.ficha; }), r.regalo).then(function (res) {
        var alias = {}; e.forEach(function (x) { alias[x.ficha] = x.alias; });
        res.forEach(function (x) {
          if (x.error || x.ya) return;
          if (x.participaciones) return avisar(x.ficha, { tipo: "participacion", participaciones: x.participaciones });
          if (x.piezas && x.piezas.length) avisar(x.ficha, { tipo: (r.regalo && r.regalo.tipo) || "", piezas: x.piezas });
        });
        fin(res.map(function (x) {
          var quien = "<b>" + esc(alias[x.ficha] || "?") + "</b>";
          if (x.error) return '<span class="malo">' + quien + ": " + esc(x.error) + "</span>";
          if (x.participaciones) return quien + " suma " + x.participaciones + " participaci" + (x.participaciones === 1 ? "ón" : "ones") + " al Gran Sorteo";
          if (x.ya) return quien + " ya lo tenía";
          return quien + " se lleva " + x.piezas.map(function (p) {
            return "<b>" + esc(p.nombre) + "</b>" + (p.rareza ? " (" + esc(String(p.rareza).toLowerCase()) + ")" : ""); }).join(", ");
        }).join("<br>"));
      }).catch(function (er) { fin('<span class="malo">' + esc(er && er.message || er) + "</span>"); });
    };
    Array.prototype.forEach.call(app.querySelectorAll(".au-pr"), function (b) {
      var r = todosLosRegalos().filter(function (x) { return x.k === b.getAttribute("data-k"); })[0];
      b.onclick = function () {
        if (r.elegir) { var el = document.getElementById("au-heroe-el"); el.hidden = !el.hidden; return; }
        if (b.classList.contains("cerrado")) return;
        dar(r, b);
      };
    });
    var sel = document.getElementById("au-heroe"), img = document.getElementById("au-heroe-img");
    if (sel) sel.onchange = function () { img.src = "assets/img/heroes/" + sel.value + ".jpg"; };
    var darH = document.getElementById("au-heroe-dar");
    if (darH) darH.onclick = function () { dar({ regalo: { tipo: "heroe", clave: sel.value } }, darH); };
  }

  /**
   * 🎲 PREGUNTA AL AZAR. Las caras se iluminan una detrás de otra, cada vez más despacio, y se para
   * en una: esa queda elegida (lista para premiarla si acierta). «Sin repetir»: quien ya salió hoy
   * no vuelve a salir hasta que hayan salido todos. Sin animación si el sistema pide poco movimiento.
   */
  function sortear(marcar) {
    var g = listaPremiar(); if (!g.length) return;
    var sinRep = (document.getElementById("au-sinrep") || {}).checked;
    var clave = "sgAulaPreguntados_" + PER + "_" + new Date().toDateString();
    try { PREGUNTADOS = JSON.parse(sessionStorage.getItem(clave) || "{}"); } catch (e) { PREGUNTADOS = {}; }
    var quedan = sinRep ? g.filter(function (x) { return !PREGUNTADOS[x.ficha]; }) : g;
    var reinicio = false;
    if (!quedan.length) { PREGUNTADOS = {}; quedan = g; reinicio = true; }
    var gana = quedan[Math.floor(Math.random() * quedan.length)];
    var caras = Array.prototype.slice.call(app.querySelectorAll(".au-cara"));
    var btn = document.getElementById("au-azar"); if (btn) btn.disabled = true;
    var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pasos = quieto ? 0 : Math.max(14, Math.min(26, caras.length * 2)), i = 0, t = 55;
    var candidatas = caras.filter(function (b) { return quedan.some(function (x) { return x.ficha === b.getAttribute("data-ficha"); }); });
    var fin = function () {
      caras.forEach(function (b) { b.classList.remove("luz", "gana"); });
      ELEGIDOS = {}; ELEGIDOS[gana.ficha] = true; marcar();
      PREGUNTADOS[gana.ficha] = true;
      try { sessionStorage.setItem(clave, JSON.stringify(PREGUNTADOS)); } catch (e) {}
      var caja = document.getElementById("au-sorteo"), c = caraDe(gana);
      caja.hidden = false;
      caja.innerHTML = (c ? '<img src="' + esc(c) + '" alt="">' : '')
        + '<div><span class="eyebrow amber">Le toca a</span><b>' + esc(gana.alias) + '</b>'
        + '<em>' + (reinicio ? "Ya habían salido todos: empiezo otra ronda. " : "") + 'Si acierta, dale su premio abajo.</em></div>'
        + '<button type="button" class="ll-min" id="au-otra-vez">Otra</button>';
      document.getElementById("au-otra-vez").onclick = function () { sortear(marcar); };
      var cara = app.querySelector('.au-cara[data-ficha="' + gana.ficha + '"]');
      if (cara) cara.classList.add("gana");
      if (btn) btn.disabled = false;
    };
    if (!pasos || candidatas.length < 2) return fin();
    (function paso() {
      caras.forEach(function (b) { b.classList.remove("luz", "gana"); });
      var b = i < pasos - 1 ? candidatas[Math.floor(Math.random() * candidatas.length)]
                            : app.querySelector('.au-cara[data-ficha="' + gana.ficha + '"]');
      if (b) b.classList.add("luz");
      i++; t = t * 1.12;
      if (i < pasos) setTimeout(paso, t); else setTimeout(fin, 380);
    })();
  }

  function nombreEscuadron(id) {
    if (!id || !D) return "";
    var e = (D.escuadrones || []).filter(function (x) { return x.id === id; })[0];
    return e ? e.nombre : "";
  }
  function pintaPresentes() {
    if (!SESION) return;
    MOTOR.fichajesDe(SESION.id).then(function (f) {
      if (f.length !== PRESENTES.length) cargarPresentesHoy();
      PRESENTES = f;
      var np = document.getElementById("au-np"); if (np) np.textContent = f.length;
      var caja = document.getElementById("au-nombres"); if (!caja) return;
      var porUid = {}; (D.reclutas || []).forEach(function (x) { if (x.uid) porUid[x.uid] = x.alias; });
      caja.innerHTML = f.map(function (x) {
        return '<span class="au-chip">' + esc(porUid[x.userId] || "…") + "</span>"; }).join("");
    }).catch(function () {});
  }

  function vigilar() {
    if (dejarDeVigilar) dejarDeVigilar();
    dejarDeVigilar = MOTOR.vigilarLlamada(PER, function (s) {
      SESION = s ? { id: s.id,
        hasta: (s.endTime && s.endTime.toDate ? s.endTime.toDate() : new Date(s.endTime)).getTime(),
        escuadron: nombreEscuadron(s.restrictedFactionId) } : null;
      render();
    }, function (x) { return !YO || !YO.uid || x.teacherId === YO.uid; });   // 15-sep · la SUYA, no la de otro Comandante
    if (!reloj) reloj = setInterval(function () {
      if (!SESION) return;
      var seg = Math.round((SESION.hasta - Date.now()) / 1000);
      var el = document.getElementById("au-cuenta");
      if (seg <= 0) { SESION = null; render(); return; }
      if (el) el.textContent = Math.floor(seg / 60) + ":" + (seg % 60 < 10 ? "0" : "") + (seg % 60);
      if (seg % 5 === 0) pintaPresentes();
    }, 1000);
  }

  /**
   * Recargar los datos SIN repintar la pantalla de premiar.
   *
   * 🔴 Repintar ahí borraba a quien acababas de elegir y el mensaje de lo que le habías dado. En
   * clase eso es fatal: das +25 xp a alguien, quieres darle también una carta, y el panel se ha
   * olvidado de quién era. Los números se actualizan por dentro; la pantalla, solo si no estás
   * usándola.
   */
  function recargar() {
    return MOTOR.tablero(PER, true).then(function (t) {
      D = t;
      if (TAB === "clase") render();   // (20-sep · la única que solo mira datos; «Premiar» no se repinta a media faena)
    });
  }
  /** Quién ha respondido hoy a una llamada; si cambia y estás en «Premiar», se repinta (sin perder a quién elegiste). */
  function cargarPresentesHoy() {
    if (!MOTOR.presentesDeHoy || !PER) return;
    MOTOR.presentesDeHoy(PER).then(function (u) {
      var antes = (PRESENTES_HOY || []).join(",");
      PRESENTES_HOY = u;
      if ((TAB === "premios" || TAB === "clase") && antes !== u.join(",")) render();
    }).catch(function () { PRESENTES_HOY = PRESENTES_HOY || []; });
  }

  // ---------------------------------------------------------------- arranque
  /**
   * MODO DEMOSTRACIÓN (?demo=1). El aula entera, con un grupo de verdad y sin poder tocar nada.
   *
   * 🔴 Igual que en la consola y en la Nave, y por el mismo motivo que ya costó una lección: una
   * captura que no se puede rehacer con un comando acaba mintiendo el día que cambie la pantalla.
   * Esta pantalla exige sesión de docente, así que sin modo demostración su foto habría que sacarla
   * a mano — y entonces envejece sola.
   */
  function demostracion() {
    var PUB = window.SG_API_PUBLICA ||
      "https://us-central1-gamificapro-99e0a.cloudfunctions.net/tableroStargate";
    var per = url.get("per") || window.SG_PER_DEMO || "demo-stargate";
    YO = { correo: "docente@ejemplo.es", nombre: "Capitana Vega" };
    GRUPOS = [{ id: per, nombre: "CLASE DEMO" }];
    PER = per;
    pinta('<div class="au-caja"><p class="ll-esperando">Preparando la demostración…</p></div>');
    fetch(PUB + "?per=" + encodeURIComponent(per)).then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.error) throw new Error(d.error);
        var NOM = [["Vega", "vega"], ["Lyra", "lyra"], ["Orion", "orion"], ["Nix", "nix"], ["Talia", "talia"]];
        var privados = {};
        (d.perfiles || []).forEach(function (p, i) {
          var n = NOM[i % NOM.length];
          privados[p.id] = { firstName: n[0], lastName: "Ejemplo", email: n[1] + "@ejemplo.es" };
        });
        D = window.SG.TABLERO.tablero(Object.assign({}, d, { privados: privados, vales: [],
          catalogo: window.SG_CATALOGO,
          privadoPER: { referente: "docente@ejemplo.es", panelEdit: "",
                        docentes: [{ nombre: "Capitana Vega", correo: "docente@ejemplo.es", rol: "docente" }] } }), true);
        render();
        Array.prototype.forEach.call(app.querySelectorAll("button"), function (b) {
          if (!b.getAttribute("data-au")) b.disabled = true;
        });
      })
      .catch(function (e) { puerta("La demostración no está disponible: " + e.message); });
  }

  function arrancar() {
    MOTOR = window.SG.MOTOR;
    if (url.get("demo") === "1") return demostracion();
    pinta('<div class="au-caja"><p class="ll-esperando">Comprobando quién eres…</p></div>');
    var mirar = function (u) {
      var q_ = u ? u.uid : null; if (q_ === mirar._v) return; mirar._v = q_;  // una vez por cuenta: sesion() y sg:sesion llegan los dos al cargar
      YO = u;
      if (!YO) return puerta();
      if (MOTOR.miFichaDocente) MOTOR.miFichaDocente().then(function (f) {
        var m = f && (f.modo === "manual" || f.modo === "piloto") ? f.modo : null;
        if (m && m !== MODO) { MODO = m; try { localStorage.setItem("sgModoNivel", MODO); } catch (e) {} if (D) render(); }
      }).catch(function () {});
      MOTOR.misPERs(YO.correo).then(function (ps) {
        GRUPOS = ps || [];
        if (!GRUPOS.length) return noEresDocente();
        /**
         * 🔴 El aula SÍ enseña los grupos acabados —aquí se viene también a mirar atrás, a repasar
         * cómo fue un curso— pero NUNCA empieza en uno. `misPERs` los devuelve ya ordenados (en
         * marcha primero), así que el primero es el bueno; esto es el cinturón por si algún día
         * llega en otro orden: el que se abre por defecto es uno vivo o ninguno.
         */
        var vivos = GRUPOS.filter(function (x) { return x.estado !== "pasado" && !x.archivado; });
        PER = PER_FIJO && GRUPOS.some(function (x) { return x.id === PER_FIJO; })
              ? PER_FIJO : (vivos[0] || GRUPOS[0]).id;
        MOTOR.tablero(PER, true).then(function (t) { D = t; render(); vigilar(); cargarPresentesHoy(); })
          .catch(function (e) { puerta("No he podido leer el grupo: " + e.message); });
      }).catch(function (e) { puerta("No he podido leer tus grupos: " + e.message); });
    };
    MOTOR.sesion().then(mirar);
    document.addEventListener("sg:sesion", function (e) { mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
