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
  var url = new URLSearchParams(location.search);
  var PER_FIJO = url.get("per") || "";
  var MINUTOS = [10, 30, 60, 120];
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

  // ---------------------------------------------------------------- el botón del Comandante
  function tocar() {
    var g = GRUPOS.filter(function (x) { return x.id === PER; })[0] || {};
    pinta('<div class="ll-caja"><div class="ll-icono">🔔</div>'
      + "<h2>Llamada a filas</h2>"
      + '<p class="ll-sub">Abre el fichaje para <b>tu escuadrón</b> durante el tiempo que elijas. '
      + "En la Nave de tu gente aparecerá el botón solo.</p>"
      + (GRUPOS.length > 1
          ? '<label class="ll-campo">Grupo<select id="ll-per">' + GRUPOS.map(function (x) {
              return '<option value="' + esc(x.id) + '"' + (x.id === PER ? " selected" : "") + ">"
                + esc(x.nombre || x.id) + "</option>"; }).join("") + "</select></label>"
          : '<p class="ll-pie">' + esc(g.nombre || PER) + "</p>")
      + '<div class="ll-minutos">' + MINUTOS.map(function (m, i) {
          return '<button type="button" class="ll-m' + (m === 60 ? " on" : "") + '" data-min="' + m + '">'
            + m + " min</button>"; }).join("") + "</div>"
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
      MOTOR.abrirLlamada(PER, min).then(function (r) { SESION = r; enMarcha(); })
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
        GRUPOS = ps || [];
        if (!GRUPOS.length) return noEresComandante();
        PER = PER_FIJO && GRUPOS.some(function (x) { return x.id === PER_FIJO; }) ? PER_FIJO : GRUPOS[0].id;
        // Si ya había una llamada abierta suya, se retoma en vez de abrir otra encima.
        MOTOR.llamadaAbierta(PER).then(function (s) {
          if (s) {
            SESION = { id: s.id, minutos: 0, escuadron: "",
              hasta: (s.endTime && s.endTime.toDate ? s.endTime.toDate() : new Date(s.endTime)).getTime() };
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
