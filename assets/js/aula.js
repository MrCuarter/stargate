// STARGATE — EL AULA · el puesto de mando del docente, dentro del Genially.  aula.html[?per=<id>]
//
// 🔴 QUÉ PROBLEMA RESUELVE. Dar clase con una gamificación tiene un enemigo concreto: SALIR de la
// presentación. Abrir otra pestaña, buscar el grupo, volver, perder el hilo. Al final no se toca
// nada y el juego se queda en los puntos que el sistema da solo, que es justo lo que no dinamiza.
//
// Esto es todo lo que hace falta para mover una clase, en un embed que vive DENTRO del Genially:
// tocar llamada a filas, ver quién ficha en directo, felicitar a quien ha terminado algo esta
// semana, dar la bienvenida a los que acaban de llegar, mirar el ranking y repartir premios a mano.
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
  var url = new URLSearchParams(location.search);
  var PER_FIJO = url.get("per") || "";
  var MOTOR = null, YO = null, GRUPOS = [], PER = "", D = null, TAB = "clase";
  var SESION = null, reloj = null, dejarDeVigilar = null, PRESENTES = [];
  // PREMIAR: a quién (se conserva al repintar), de dónde sale la lista y a quién ya se ha preguntado hoy
  var ELEGIDOS = {}, FUENTE_P = "", PRESENTES_HOY = null, PREGUNTADOS = {};

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pinta(h) { app.innerHTML = h; }

  // ---------------------------------------------------------------- puerta
  function puerta(msg) {
    pinta('<div class="au-caja"><div class="au-icono">🛰️</div><h2>El aula</h2>'
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
    pinta('<div class="au-caja"><div class="au-icono">🛡️</div><h2>Esto es de tu Comandante</h2>'
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
      return '<p class="au-nota">👑 Eres el <b>referente</b> de este grupo: aquí ves a <b>toda</b> la ' +
             "clase, no solo a un escuadrón.</p>";
    return '<p class="au-nota malo">⚠️ No encuentro alumnado asignado a <b>' + esc(yo || YO.correo) +
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
  function semanaActual() {
    var sem = window.SG_SEMANAS || [];
    if (!D || !D.semana) return null;
    return sem[Math.min(Math.max(D.semana, 1), sem.length) - 1] || null;
  }

  // ---------------------------------------------------------------- pestañas
  var TABS = [["clase", "🔔", "La clase"], ["gente", "👏", "Mi gente"], ["ranking", "🏆", "Ranking"],
              ["premios", "🎁", "Premiar"]];
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
          : '<span class="small muted">' + esc(g.nombre || PER) + esc(coletilla(g)) + "</span>") + "</div>"
      + '<div class="au-tabs">' + TABS.map(function (t) {
          return '<button type="button" class="au-t' + (TAB === t[0] ? " on" : "") + '" data-au="' + t[0] + '">'
            + '<span class="i">' + t[1] + "</span><b>" + t[2] + "</b></button>"; }).join("") + "</div></div>";
  }

  // ---------------------------------------------------------------- 1 · la clase
  function vistaClase() {
    var s = semanaActual();
    var llamada = SESION
      ? '<div class="au-llamada viva"><div class="au-cab"><b>📣 Llamada abierta</b>'
          + '<span id="au-cuenta" class="au-cuenta"></span></div>'
        // 🔴 Decir PARA QUIÉN está abierta no es un adorno: si das clase a dos escuadrones, saber
        // que solo vale para uno es la diferencia entre pasar lista bien y pasarla mal.
        + '<p class="small muted" style="margin:0 0 8px">'
          + (SESION.escuadron ? 'Solo para <b>' + esc(SESION.escuadron) + '</b>'
                              : 'Para todo el grupo') + '</p>'
        + '<div class="au-presentes"><b id="au-np">' + PRESENTES.length + "</b> "
          + (PRESENTES.length === 1 ? "presente" : "presentes") + "</div>"
        // los nombres sueltos solo si aún no está la tarjeta de «En clase hoy» con sus caras (serían los mismos dos veces)
        + (enClaseHoy().length ? '' : '<div class="au-nombres" id="au-nombres"></div>')
        + '<button class="ll-min" id="au-cerrar">Cerrar la llamada</button></div>'
      : '<div class="au-llamada"><div class="au-cab"><b>🔔 Llamada a filas</b></div>'
        + '<p class="small muted">Abre el fichaje para tu escuadrón. En la Nave de tu gente aparece solo.</p>'
        + '<div class="ll-minutos">' + [10, 30, 60, 120].map(function (m) {
            return '<button type="button" class="ll-m' + (m === 60 ? " on" : "") + '" data-min="' + m + '">'
              + m + " min</button>"; }).join("") + "</div>"
        + '<button class="ll-btn" id="au-tocar">🔔 Tocar llamada</button>'
        + '<p class="ll-pie" id="au-msg"></p></div>';

    var orden = s
      ? '<div class="au-tarjeta"><div class="eyebrow amber">La orden de esta semana</div>'
        + "<h3>Semana " + s.sem + " · " + esc(s.tema) + "</h3>"
        + '<p class="small muted">' + esc(s.sub || "") + "</p>"
        + (s.lanza && s.lanza.length ? "<ul class=\"au-lista\">" + s.lanza.map(function (x) {
            return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "")
        + (s.hito ? '<p class="small"><b>Hito:</b> ' + esc(s.hito) + "</p>" : "")
        + (s.consejo ? '<p class="au-consejo">💡 ' + esc(s.consejo) + "</p>" : "")
        + "</div>"
      : "";
    // 🔴 13-sep · quién está en clase HOY (ha respondido a una llamada), con lo que se hace con ellos
    var hoy = enClaseHoy();
    var enClase = hoy.length
      ? '<div class="au-tarjeta au-hoy"><h3>🟢 En clase hoy · ' + hoy.length + '</h3>'
        + '<div class="au-caras mini">' + hoy.slice(0, 30).map(function (x) {
            var c = caraDe(x);
            return '<span class="au-cara quieta">' + (c ? '<img src="' + esc(c) + '" alt="" loading="lazy">' : '')
              + '<b>' + esc(x.alias) + '</b></span>'; }).join("") + '</div>'
        + '<div class="au-acciones"><button type="button" class="au-azar-btn" id="au-ir-azar">🎲 ¿A quién pregunto?</button>'
        + '<button type="button" class="ll-min" id="au-ir-premiar">🎁 Premiar a los presentes</button></div></div>'
      : "";
    return llamada + enClase + orden;
  }

  // ---------------------------------------------------------------- 2 · mi gente
  /**
   * Halagos y bienvenidas.
   *
   * 🔴 Esto es lo que Norberto llamó «dinamizar»: la máquina ya reparte los puntos, pero nombrar en
   * voz alta a quien acaba de conseguir algo es lo único que la máquina NO puede hacer. Aquí sale
   * hecho: quién ha terminado algo esta semana y quién acaba de llegar, para leerlo en clase.
   */
  function vistaGente() {
    var g = mios();
    var semana = g.filter(function (x) { return (x.xp7 || 0) > 0; })
                  .sort(function (a, b) { return (b.xp7 || 0) - (a.xp7 || 0); });
    var nuevos = g.slice().sort(function (a, b) { return (b.n || 0) - (a.n || 0); })
                  .filter(function (x) { return (x.n || 0) <= 2; });
    var parados = g.filter(function (x) { return !(x.xp7 > 0); });

    return avisoDeQuienVeo()
      + '<div class="au-tarjeta"><div class="eyebrow verde">Para nombrar en voz alta</div>'
      + "<h3>👏 Esta semana han hecho algo</h3>"
      + (semana.length
          ? '<div class="au-gente">' + semana.map(function (x) {
              return '<div class="au-p"><b>' + esc(x.alias) + "</b><span>+" + (x.xp7 || 0) + " xp</span></div>";
            }).join("") + "</div>"
          : '<p class="small muted">Todavía nadie esta semana. Buen momento para recordarlo en clase.</p>')
      + "</div>"
      + '<div class="au-tarjeta"><h3>🆕 Recién llegados</h3>'
      + '<p class="small muted">Dales la bienvenida por su nombre: es lo que engancha el primer día.</p>'
      + (nuevos.length
          ? '<div class="au-gente">' + nuevos.map(function (x) {
              return '<div class="au-p nuevo"><b>' + esc(x.alias) + "</b><span>" + (x.n || 0) + " insignias</span></div>";
            }).join("") + "</div>"
          : '<p class="small muted">Nadie nuevo por ahora.</p>')
      + "</div>"
      + '<div class="au-tarjeta"><h3>🕗 Sin moverse esta semana</h3>'
      + '<p class="small muted">Ni regañina ni lista pública: es para que sepas a quién preguntar «¿todo bien?».</p>'
      + (parados.length
          ? '<div class="au-gente">' + parados.slice(0, 12).map(function (x) {
              return '<div class="au-p frio"><b>' + esc(x.alias) + "</b></div>"; }).join("") + "</div>"
          : '<p class="small muted">Ninguno. Semana redonda.</p>')
      + "</div>";
  }

  // ---------------------------------------------------------------- 3 · ranking
  function vistaRanking() {
    var g = mios().slice().sort(function (a, b) { return b.xp - a.xp; });
    var esc7 = (D.escuadrones || []).map(function (e) {
      var suyos = (D.reclutas || []).filter(function (x) { return x.profe === e.comandante; });
      if (!suyos.length) return null;
      return { n: e.nombre, emb: e.emblema, media: Math.round(suyos.reduce(function (a, x) { return a + x.xp; }, 0) / suyos.length) };
    }).filter(Boolean).sort(function (a, b) { return b.media - a.media; });

    return avisoDeQuienVeo() + '<div class="au-tarjeta"><h3>🏆 Tu escuadrón</h3>'
      + '<ol class="au-rank">' + g.slice(0, 10).map(function (x, i) {
          return "<li><span>" + (i + 1) + "</span><b>" + (x.corona ? "👑 " : "") + esc(x.alias) + "</b>"
            + "<em>" + x.xp + " xp</em></li>"; }).join("") + "</ol></div>"
      + (esc7.length > 1
          ? '<div class="au-tarjeta"><h3>⚔️ Entre escuadrones</h3>'
            + '<p class="small muted">Por media de xp por recluta: sumando ganaría siempre el más numeroso.</p>'
            + '<ol class="au-rank">' + esc7.map(function (e, i) {
                return "<li><span>" + (i + 1) + "</span>"
                  + (e.emb ? '<img class="au-emb" src="' + esc(e.emb) + '" alt="">' : "")
                  + "<b>" + esc(e.n) + "</b><em>" + e.media + " xp</em></li>"; }).join("") + "</ol></div>"
          : "");
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
    { g: "Puntos", k: "xp25", t: "+25 xp", xp: 25 }, { g: "Puntos", k: "xp50", t: "+50 xp", xp: 50 },
    { g: "Puntos", k: "cr20", t: "+20 ◈", cr: 20 }, { g: "Puntos", k: "cr50", t: "+50 ◈", cr: 50 },
    { g: "Colección", k: "carta", t: "🃏 Una carta", regalo: { tipo: "carta" }, clase: "carta" },
    { g: "Colección", k: "sobre", t: "🃏 Un sobre (3 cartas)", regalo: { tipo: "sobre" }, clase: "carta" },
    { g: "Colección", k: "heroe", t: "🛡️ Un héroe al azar", regalo: { tipo: "heroe" }, clase: "heroe" },
    { g: "Colección", k: "heroe_el", t: "🛡️ Un héroe que eliges…", elegir: true, clase: "heroe" },
    { g: "Adornos", k: "marco", t: "🖼️ Marco dorado", regalo: { tipo: "adorno", cual: "marco" }, clase: "adorno" },
    { g: "Adornos", k: "fondo", t: "🌌 Fondo de ficha", regalo: { tipo: "adorno", cual: "fondo" }, clase: "adorno" },
    { g: "Adornos", k: "titulo", t: "🏷️ Título de recluta", regalo: { tipo: "adorno", cual: "titulo" }, clase: "adorno" }
  ];
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
      return { g: "Sorteo", k: "part" + n, t: "🎟️ " + n + " participaci" + (n === 1 ? "ón" : "ones"), regalo: { tipo: "participacion", sorteo: s.doc, n: n }, clase: "sorteo" }; });
  }
  /**
   * 14-sep · LAS CÁPSULAS Y LOS SOBRES NUEVOS, de premio (Norberto: «un cofre legendario, donde siempre
   * toca un avatar legendario… quiero poder ocultarlos en Genially o darlos de recompensa»). Solo los
   * que tenga la tienda del grupo; los reparte el servidor con SU cofre.
   */
  var COFRES_REGALO = [["capsula_legendaria", "🟨 Cápsula legendaria", "heroe"], ["capsula_elite", "🟪 Cápsula de élite", "heroe"],
                       ["sobre_epico", "✨ Sobre épico", "carta"], ["sobre_raro", "💎 Sobre de raras", "carta"], ["sobre_grande", "🃏 Sobre grande (5)", "carta"]];
  function regalosCofres() {
    var hay = {}; ((D && D.recompensas) || []).forEach(function (x) { hay[x.tipo] = true; });
    return COFRES_REGALO.filter(function (c) { return hay[c[0]]; }).map(function (c) {
      return { g: "Cápsulas y sobres", k: c[0], t: c[1], regalo: { tipo: "cofre", cual: c[0] }, clase: c[2] }; });
  }
  function todosLosRegalos() { return REGALOS.concat(regalosCofres()).concat(regalosSorteo()); }
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
      +   '<div class="au-cab2"><h3>¿A quién?</h3><div class="au-seg" role="group" aria-label="De dónde">'
      +     '<button type="button" data-fuente="hoy" aria-pressed="' + (FUENTE_P === "hoy") + '">🟢 En clase hoy <b>' + hoy.length + '</b></button>'
      +     '<button type="button" data-fuente="todos" aria-pressed="' + (FUENTE_P === "todos") + '">Todo mi escuadrón <b>' + mios().filter(function (x) { return x.ficha; }).length + '</b></button>'
      +   '</div></div>'
      +   (g.length
          ? '<div class="au-caras" id="au-caras">' + g.map(function (x) {
              var c = caraDe(x);
              return '<button type="button" class="au-cara' + (ELEGIDOS[x.ficha] ? " on" : "") + '" data-ficha="' + esc(x.ficha) + '" aria-pressed="' + (!!ELEGIDOS[x.ficha]) + '">'
                + (c ? '<img src="' + esc(c) + '" alt="" loading="lazy">' : '<span class="au-sin">' + esc((x.alias || "?").charAt(0)) + '</span>')
                + '<b>' + esc(x.alias) + '</b></button>'; }).join("") + '</div>'
          : '<p class="small muted">' + (FUENTE_P === "hoy"
              ? 'Hoy todavía no ha respondido nadie a la llamada a filas. Tócala en «La clase», o elige de todo tu escuadrón.'
              : 'Todavía no hay nadie en tu escuadrón.') + '</p>')
      +   '<div class="au-acciones">'
      +     '<button type="button" class="ll-min" id="au-todos">Todos</button>'
      +     '<button type="button" class="ll-min" id="au-nadie">Ninguno</button>'
      +     '<button type="button" class="au-azar-btn" id="au-azar"' + (g.length ? '' : ' disabled') + '>🎲 Pregunta al azar</button>'
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
                  return '<button type="button" class="au-pr' + (r.clase ? " " + r.clase : "") + '" data-k="' + r.k + '"'
                    + (r.xp || r.cr ? ' data-xp="' + (r.xp || 0) + '" data-cr="' + (r.cr || 0) + '"' : '') + '>' + r.t + '</button>'; }).join("")
              + '</div></div>'; }).join("")
      +   '<div class="au-heroe-el" id="au-heroe-el" hidden>'
      +     '<img id="au-heroe-img" src="' + (heroes[0] ? 'assets/img/heroes/' + esc(heroes[0].clave) + '.jpg' : '') + '" alt="" width="64" height="64">'
      +     '<select id="au-heroe">' + heroes.map(function (h) {
              return '<option value="' + esc(h.clave) + '">' + esc(h.nombre) + ' · ' + esc(String(h.rareza || "").toLowerCase()) + '</option>'; }).join("") + '</select>'
      +     '<button type="button" class="btn primary" id="au-heroe-dar">Dárselo</button>'
      +   '</div>'
      +   '<div class="ll-pie au-res" id="au-pmsg" aria-live="polite"></div></div>';
  }

  // ---------------------------------------------------------------- pintar
  function render() {
    pinta(barra() + '<div class="au-cuerpo">'
      + (TAB === "clase" ? vistaClase() : TAB === "gente" ? vistaGente()
        : TAB === "ranking" ? vistaRanking() : vistaPremios()) + "</div>");
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
    if (SESION) pintaPresentes();
  }

  function cablearClase() {
    var min = 60;
    Array.prototype.forEach.call(app.querySelectorAll(".ll-m"), function (b) {
      b.onclick = function () { min = Number(b.getAttribute("data-min"));
        Array.prototype.forEach.call(app.querySelectorAll(".ll-m"), function (x) { x.classList.remove("on"); });
        b.classList.add("on"); };
    });
    var t = document.getElementById("au-tocar");
    if (t) t.onclick = function () {
      t.disabled = true; t.textContent = "Tocando…";
      MOTOR.abrirLlamada(PER, min).then(function () { vigilar(); })
        .catch(function (e) { t.disabled = false; t.textContent = "🔔 Tocar llamada";
          document.getElementById("au-msg").textContent = String(e && e.message || e); });
    };
    // «En clase hoy» → a Premiar, con la lista de hoy (y ya sorteando, o con todos elegidos)
    var ia = document.getElementById("au-ir-azar"), ip = document.getElementById("au-ir-premiar");
    if (ia) ia.onclick = function () { TAB = "premios"; FUENTE_P = "hoy"; render();
      var b = document.getElementById("au-azar"); if (b) b.click(); };
    if (ip) ip.onclick = function () { TAB = "premios"; FUENTE_P = "hoy"; ELEGIDOS = {};
      enClaseHoy().forEach(function (x) { ELEGIDOS[x.ficha] = true; }); render(); };
    var cc = document.getElementById("au-cerrar");
    if (cc) cc.onclick = function () { MOTOR.cerrarLlamada(SESION.id).then(function () { SESION = null; render(); }); };
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

    var dar = function (r, boton) {
      var e = elegidos();
      if (!e.length) { msg.textContent = "Elige antes a quién: toca su cara."; return; }
      var botones = app.querySelectorAll(".au-pr, #au-heroe-dar");
      Array.prototype.forEach.call(botones, function (b) { b.disabled = true; });
      msg.innerHTML = "Repartiendo…";
      var fin = function (html) { Array.prototype.forEach.call(botones, function (b) { b.disabled = false; }); msg.innerHTML = html; recargar(); };
      if (r.xp || r.cr) {
        // xp y créditos: su camino con asiento en el libro, uno detrás de otro (no a la vez: cada uno es una escritura del motor)
        var hechos = [], fallos = [];
        e.reduce(function (p, x) {
          return p.then(function () {
            return MOTOR.premiar(PER, x.ficha, { xp: r.xp || 0, creditos: r.cr || 0, motivo: "Premio en clase" })
              .then(function () { hechos.push(x.alias); }, function (er) { fallos.push(x.alias + " (" + (er && er.message || er) + ")"); });
          });
        }, Promise.resolve()).then(function () {
          fin((hechos.length ? "✅ <b>" + esc(hechos.join(", ")) + "</b>: " + (r.xp ? "+" + r.xp + " xp " : "") + (r.cr ? "+" + r.cr + " ◈" : "") : "")
            + (fallos.length ? '<br><span class="malo">No he podido con: ' + esc(fallos.join(", ")) + '</span>' : ""));
        });
        return;
      }
      MOTOR.regalarEnClase(PER, e.map(function (x) { return x.ficha; }), r.regalo).then(function (res) {
        var alias = {}; e.forEach(function (x) { alias[x.ficha] = x.alias; });
        fin(res.map(function (x) {
          var quien = "<b>" + esc(alias[x.ficha] || "?") + "</b>";
          if (x.error) return '<span class="malo">' + quien + ": " + esc(x.error) + "</span>";
          if (x.participaciones) return "🎟️ " + quien + " suma " + x.participaciones + " participaci" + (x.participaciones === 1 ? "ón" : "ones") + " al Gran Sorteo";
          if (x.ya) return "➖ " + quien + " ya lo tenía";
          return "🎁 " + quien + " se lleva " + x.piezas.map(function (p) {
            return "<b>" + esc(p.nombre) + "</b>" + (p.rareza ? " (" + esc(String(p.rareza).toLowerCase()) + ")" : ""); }).join(", ");
        }).join("<br>"));
      }).catch(function (er) { fin('<span class="malo">' + esc(er && er.message || er) + "</span>"); });
    };
    Array.prototype.forEach.call(app.querySelectorAll(".au-pr"), function (b) {
      var r = todosLosRegalos().filter(function (x) { return x.k === b.getAttribute("data-k"); })[0];
      b.onclick = function () {
        if (r.elegir) { var el = document.getElementById("au-heroe-el"); el.hidden = !el.hidden; return; }
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
        + '<button type="button" class="ll-min" id="au-otra-vez">🎲 Otra</button>';
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
      if (TAB === "gente" || TAB === "ranking") render();
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
    var per = url.get("per") || "demo-motor";
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
