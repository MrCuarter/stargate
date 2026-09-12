// STARGATE — LLAMADA A FILAS · el botón que vive dentro del Genially.  llamada.html[?per=<id>]
//
// 🔴 POR QUÉ ESTE BOTÓN NO LLEVA EL GRUPO DENTRO.
//
// GamificaPro ya trae su propio embed de asistencia, pero su dirección incluye el identificador del
// proyecto (`/embed/attendance/<grupo>`). Eso obliga a un Genially por grupo: cada convocatoria,
// volver a montar el botón en ocho presentaciones. Aquí el grupo NO va en el enlace — se deduce de
// quién pulsa, igual que los enlaces de validar retos. Se monta UNA vez en todos los Geniallys y no
// se vuelve a tocar: ni al crear un grupo nuevo, ni el año que viene.
//
// 🔴 Y por qué solo lo pulsa el Comandante. El Genially se PROYECTA: el botón lo ve la clase entera.
// Quien no sea docente recibe un mensaje que lo dice y no pasa nada más. El alumnado no ficha aquí
// —no tienen el Genially, lo están mirando en la pared— sino desde su Nave, en su móvil.
(function () {
  var app = document.getElementById("llamada-app");
  if (!app) return;
  // 🔴 Sin esto, incrustar la página metía el MENÚ ENTERO de la web dentro del Genially —y con él
  // «Mi clase», «Registro», «Grupos»— justo encima de lo único que se quería enseñar. La hoja de
  // estilos ya sabe esconder cabecera, hero y pie (`body.embed .nav{display:none}`); lo que
  // faltaba era que alguien pusiera la clase. Otras siete páginas lo hacen; estas dos, que son las
  // que de verdad viven embebidas, se habían quedado sin ello.
  if (new URLSearchParams(location.search).get("embed") === "1") document.body.classList.add("embed");
  var url = new URLSearchParams(location.search);
  var PER_FIJO = url.get("per") || "";
  var MINUTOS = [10, 30, 60, 120];
  var TODOS = [];
  var MOTOR = null, YO = null, GRUPOS = [], PER = "", SESION = null, reloj = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pinta(h) { app.innerHTML = h; }
  function cargando(t) { pinta('<div class="ll-caja"><p class="ll-esperando">' + esc(t) + "</p></div>"); }

  // ---------------------------------------------------------------- la puerta
  function puerta(msg) {
    pinta('<div class="ll-caja"><div class="ll-icono">🔔</div>'
      + "<h2>Llamada a filas</h2>"
      + '<p class="ll-sub">' + esc(msg || "Esto solo puede tocarlo el Comandante de la clase.") + "</p>"
      + '<button class="ll-btn" id="ll-entrar">Entrar con mi cuenta</button></div>');
    document.getElementById("ll-entrar").onclick = function () {
      MOTOR.entrar().catch(function (e) { puerta("No he podido entrar: " + e.message); });
    };
  }

  /**
   * Quien pulsa no es docente de ningún grupo. No es un error: es un alumno mirando la pantalla
   * proyectada, y hay que decírselo sin asustarle.
   */
  function noEresComandante() {
    pinta('<div class="ll-caja ll-no"><div class="ll-icono">🛡️</div>'
      + "<h2>Esto lo toca tu Comandante</h2>"
      + '<p class="ll-sub">Cuando lo haga, el botón de <b>✋ Presente</b> aparecerá solo en '
      + '<b>tu Nave</b>. No hay que hacer nada aquí.</p>'
      + '<p class="ll-pie">' + (YO.correo ? 'Estás como ' + esc(YO.correo) + '. ' : '')
      + '<button class="ll-min" id="ll-otra">No soy yo</button></p></div>');
    document.getElementById("ll-otra").onclick = function () { MOTOR.salir(); };
  }

  function nombreDe(id) {
    var g = TODOS.filter(function (x) { return x.id === id; })[0];
    return (g && (g.nombre || g.id)) || id;
  }
  /** «· semana 3 de 15» o «· empieza en 2 semanas»: lo que distingue dos grupos con nombre parecido. */
  function coletilla(g) {
    if (!g) return "";
    if (g.estado === "por empezar") {
      var faltan = 1 - (g.semana || 0);
      return " · empieza en " + faltan + (faltan === 1 ? " semana" : " semanas");
    }
    if (g.estado === "en marcha") return " · semana " + g.semana + " de " + g.total;
    if (g.estado === "sin fecha") return " · sin fecha de inicio";
    // 🔴 Ante la duda, callarse. Si `estado` no llega —un motor.js viejo en caché, un camino nuevo
    // que se olvide de calcularlo— lo anterior etiquetaba TODO como «terminado»: un grupo en plena
    // semana 3 anunciado como acabado. Una coletilla vacía no estorba; una falsa engaña.
    if (g.estado !== "pasado") return "";
    return " · terminado";
  }
  /** Todos sus grupos han acabado: mejor decirlo que dejarle abrir una llamada que nadie puede usar. */
  function soloPasados() {
    pinta('<div class="ll-caja"><div class="ll-icono">🗓️</div>'
      + "<h2>No tienes ningún grupo en marcha</h2>"
      + '<p class="ll-sub">Tus grupos ya han terminado, así que no hay a quién pasar lista. '
      + "Si acabas de crear uno, comprueba su <b>fecha de la semana 1</b> en tu sala.</p>"
      + '<p class="ll-pie">' + TODOS.map(function (x) {
          return esc(x.nombre || x.id) + esc(coletilla(x)); }).join("<br>") + "</p></div>");
  }

  // ---------------------------------------------------------------- el botón del Comandante
  function tocar() {
    var g = GRUPOS.filter(function (x) { return x.id === PER; })[0] || {};
    pinta('<div class="ll-caja"><div class="ll-icono">🔔</div>'
      + "<h2>Llamada a filas</h2>"
      + '<p class="ll-sub">Abre el fichaje para <b>tu escuadrón</b> durante el tiempo que elijas. '
      + "En la Nave de tu gente aparecerá el botón solo.</p>"
      + (GRUPOS.length > 1
          // 🔴 Con dos grupos vivos a la vez —que es lo normal en enero, uno acabando y otro
          // empezando— la elección no puede ser un desplegable discreto que se pasa por alto
          // proyectando. Se avisa en ámbar y cada opción lleva su semana, que es lo que de verdad
          // distingue «el que acaba» de «el que empieza» cuando los dos se llaman parecido.
          ? '<p class="ll-ojo">⚠️ Tienes <b>' + GRUPOS.length + ' grupos abiertos</b>. Comprueba cuál es este.</p>'
            + '<label class="ll-campo">Grupo<select id="ll-per">' + GRUPOS.map(function (x) {
              return '<option value="' + esc(x.id) + '"' + (x.id === PER ? " selected" : "") + ">"
                + esc(x.nombre || x.id) + esc(coletilla(x)) + "</option>"; }).join("") + "</select></label>"
          : '<p class="ll-pie">' + esc(g.nombre || PER) + esc(coletilla(g)) + "</p>")
      + '<div class="ll-minutos">' + MINUTOS.map(function (m, i) {
          return '<button type="button" class="ll-m' + (m === 60 ? " on" : "") + '" data-min="' + m + '">'
            + m + " min</button>"; }).join("") + "</div>"
      /**
       * 🔴 UN REGALO OPCIONAL PARA QUIEN VENGA. Norberto: «¿te parece regalar un sobre de cromos
       * junto a la asistencia? O que el docente al lanzar asistencia pueda elegir un regalo».
       *
       * Y con un límite que puso él mismo y que es el acierto: «modificar los créditos o
       * experiencia no, porque podría enturbiar la puntuación». Exacto — los xp ordenan el ranking
       * y regalarlos por venir mezclaría lo aprendido con lo asistido. Un sobre de cromos no ordena
       * a nadie: es colección, no puntuación. Por eso solo se puede regalar eso.
       */
      + '<label class="ll-campo ll-regalo"><input type="checkbox" id="ll-sobre"> '
      + 'Regalar un <b>sobre de cromos</b> a quien fiche</label>'
      + '<p class="ll-nota">Tres cartas al azar. No toca ni los xp ni el ranking: es colección.</p>'
      + '<button class="ll-btn grande" id="ll-tocar">🔔 Tocar llamada</button>'
      + '<p class="ll-pie" id="ll-msg"></p></div>');

    var min = 60;
    Array.prototype.forEach.call(app.querySelectorAll(".ll-m"), function (b) {
      b.onclick = function () {
        min = Number(b.getAttribute("data-min"));
        Array.prototype.forEach.call(app.querySelectorAll(".ll-m"), function (x) { x.classList.remove("on"); });
        b.classList.add("on");
      };
    });
    var sel = document.getElementById("ll-per");
    if (sel) sel.onchange = function () { PER = sel.value; };
    document.getElementById("ll-tocar").onclick = function (e) {
      var b = e.currentTarget; b.disabled = true; b.textContent = "Tocando…";
      var regalo = document.getElementById("ll-sobre");
      MOTOR.abrirLlamada(PER, min, { regalo: regalo && regalo.checked ? "sobre" : "" })
        .then(function (r) { SESION = r; enMarcha(); })
        .catch(function (err) {
          b.disabled = false; b.textContent = "🔔 Tocar llamada";
          document.getElementById("ll-msg").textContent = String(err && err.message || err);
        });
    };
  }

  /**
   * La llamada, en marcha. Enseña la cuenta atrás y QUIÉN VA FICHANDO, en directo: es lo que
   * convierte el pase de lista en un momento de clase en vez de en un trámite.
   */
  function enMarcha() {
    pinta('<div class="ll-caja ll-viva"><div class="ll-icono">📣</div>'
      + "<h2>Llamada abierta</h2>"
      // 🔴 DE QUÉ GRUPO. Decía «Para todo el grupo» sin nombrarlo: proyectado delante de una clase,
      // con dos grupos vivos, no había forma de saber a cuál se la habías abierto.
      + '<p class="ll-grupo">' + esc(nombreDe(PER)) + "</p>"
      + '<p class="ll-sub">' + (SESION.escuadron ? "Para <b>" + esc(SESION.escuadron) + "</b>" : "Para todo el grupo")
      + ' · <span id="ll-cuenta">' + SESION.minutos + ":00</span></p>"
      + '<div class="ll-lista" id="ll-lista"><p class="ll-esperando">Nadie todavía…</p></div>'
      + '<button class="ll-min" id="ll-cerrar">Cerrar la llamada</button></div>');
    document.getElementById("ll-cerrar").onclick = function () {
      MOTOR.cerrarLlamada(SESION.id).then(function () { parar(); tocar(); });
    };
    var pintaLista = function () {
      MOTOR.fichajesDe(SESION.id).then(function (f) {
        var caja = document.getElementById("ll-lista"); if (!caja) return;
        caja.innerHTML = f.length
          ? '<p class="ll-cuantos"><b>' + f.length + "</b> " + (f.length === 1 ? "presente" : "presentes") + "</p>"
          : '<p class="ll-esperando">Nadie todavía…</p>';
      }).catch(function () {});
    };
    pintaLista();
    reloj = setInterval(function () {
      var seg = Math.round((SESION.hasta - Date.now()) / 1000);
      if (seg <= 0) { parar(); tocar(); return; }
      var el = document.getElementById("ll-cuenta");
      if (el) el.textContent = Math.floor(seg / 60) + ":" + (seg % 60 < 10 ? "0" : "") + (seg % 60);
      if (seg % 5 === 0) pintaLista();
    }, 1000);
  }
  function parar() { if (reloj) { clearInterval(reloj); reloj = null; } SESION = null; }

  // ---------------------------------------------------------------- arranque
  function arrancar() {
    MOTOR = window.SG.MOTOR;
    cargando("Comprobando quién eres…");
    var mirar = function (u) {
      YO = u;
      if (!YO) return puerta();
      cargando("Buscando tus grupos…");
      MOTOR.misPERs(YO.correo).then(function (ps) {
        TODOS = ps || [];
        if (!TODOS.length) return noEresComandante();
        /**
         * 🔴 LOS GRUPOS ACABADOS NO SE OFRECEN. Un docente acumula grupos: al tercer curso lleva
         * seis, y cinco están muertos. Abrir la llamada en uno terminado no da error —crea la
         * sesión igual— y nadie de los que están delante puede fichar, porque no son de ese
         * escuadrón. Se ofrecen solo los vivos; si no queda ninguno, se dice.
         */
        GRUPOS = TODOS.filter(function (x) { return x.estado !== "pasado" && !x.archivado; });
        if (!GRUPOS.length) return soloPasados();
        // 🔴 El que está EN MARCHA, no el primero de la lista. `misPERs` ya los ordena así, pero
        // esta pantalla se proyecta delante de una clase: no puede depender de que otro módulo
        // mantenga un orden. Si ninguno ha empezado todavía, entonces sí vale el primero.
        var enMarchaYa = GRUPOS.filter(function (x) { return x.estado === "en marcha"; });
        PER = PER_FIJO && GRUPOS.some(function (x) { return x.id === PER_FIJO; })
              ? PER_FIJO : (enMarchaYa[0] || GRUPOS[0]).id;
        /**
         * 🔴 Y se mira si hay llamada abierta en CUALQUIERA de ellos, no solo en el que tocaba por
         * defecto. El caso que rompía: abres la llamada del grupo A a las 10:00 para 60 minutos, a
         * las 10:40 entras a dar clase al grupo B y el embed te enseñaba… la de A, sin decir que era
         * de A y sin manera de cambiar. Ahora se retoma la que haya, con su nombre delante.
         */
        Promise.all(GRUPOS.map(function (g) {
          return MOTOR.llamadaAbierta(g.id).then(function (s) { return s ? { g: g, s: s } : null; })
                      .catch(function () { return null; });
        })).then(function (abiertas) {
          var viva = abiertas.filter(Boolean)[0];
          if (viva) {
            PER = viva.g.id;
            SESION = { id: viva.s.id, minutos: 0, escuadron: "",
              hasta: (viva.s.endTime && viva.s.endTime.toDate ? viva.s.endTime.toDate() : new Date(viva.s.endTime)).getTime() };
            enMarcha();
          } else tocar();
        }).catch(tocar);
      }).catch(function (e) { puerta("No he podido leer tus grupos: " + e.message); });
    };
    MOTOR.sesion().then(mirar);
    document.addEventListener("sg:sesion", function (e) { parar(); mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
