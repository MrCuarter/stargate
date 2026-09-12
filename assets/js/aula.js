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
  var url = new URLSearchParams(location.search);
  var PER_FIJO = url.get("per") || "";
  var MOTOR = null, YO = null, GRUPOS = [], PER = "", D = null, TAB = "clase";
  var SESION = null, reloj = null, dejarDeVigilar = null, PRESENTES = [];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pinta(h) { app.innerHTML = h; }

  // ---------------------------------------------------------------- puerta
  function puerta(msg) {
    pinta('<div class="au-caja"><div class="au-icono">🛰️</div><h2>El aula</h2>'
      + '<p class="au-sub">' + esc(msg || "Entra con tu cuenta para mover tu clase desde aquí.") + "</p>"
      + '<button class="ll-btn" id="au-entrar">Entrar con mi cuenta</button></div>');
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
  function mios() {
    if (!D) return [];
    var yo = nombreDocente();
    var r = (D.reclutas || []).filter(function (x) { return String(x.profe || "") === yo; });
    return r.length ? r : (D.reclutas || []);
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
  function barra() {
    var g = GRUPOS.filter(function (x) { return x.id === PER; })[0] || {};
    return '<div class="au-barra"><div class="au-quien"><b>' + esc(nombreDocente() || YO.correo) + "</b>"
      + (GRUPOS.length > 1
          ? '<select class="au-grupo" id="au-grupo">' + GRUPOS.map(function (x) {
              return '<option value="' + esc(x.id) + '"' + (x.id === PER ? " selected" : "") + ">"
                + esc(x.nombre || x.id) + "</option>"; }).join("") + "</select>"
          : '<span class="small muted">' + esc(g.nombre || PER) + "</span>") + "</div>"
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
        + '<div class="au-nombres" id="au-nombres"></div>'
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
    return llamada + orden;
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

    return '<div class="au-tarjeta"><div class="eyebrow verde">Para nombrar en voz alta</div>'
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

    return '<div class="au-tarjeta"><h3>🏆 Tu escuadrón</h3>'
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

  // ---------------------------------------------------------------- 4 · premiar
  function vistaPremios() {
    var g = mios();
    return '<div class="au-tarjeta"><h3>🎁 Premiar a mano</h3>'
      + '<p class="small muted">Para lo que el sistema no ve: una buena intervención, ayudar a un compañero, '
      + "traer algo que no se pedía.</p>"
      + '<label class="ll-campo">A quién<select id="au-quien">'
        + '<option value="">— elige —</option>'
        + g.map(function (x) { return '<option value="' + esc(x.ficha || "") + '">' + esc(x.alias) + "</option>"; }).join("")
        + "</select></label>"
      + '<button class="ll-min" id="au-azar">🎲 Que elija la suerte</button>'
      + '<div class="au-premios">'
        + '<button class="au-pr" data-xp="25" data-cr="0">+25 xp</button>'
        + '<button class="au-pr" data-xp="50" data-cr="0">+50 xp</button>'
        + '<button class="au-pr" data-xp="0" data-cr="20">+20 ◈</button>'
        + '<button class="au-pr" data-xp="0" data-cr="50">+50 ◈</button>'
        + '<button class="au-pr doble" data-xp="50" data-cr="50">+50 xp y +50 ◈</button>'
        + '<button class="au-pr carta" data-carta="1">🃏 Regalar una carta</button>'
      + "</div>"
      + '<p class="ll-pie" id="au-pmsg"></p></div>';
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
      PER = selG.value; SESION = null;
      pinta('<div class="au-caja"><p class="ll-esperando">Cambiando de grupo…</p></div>');
      MOTOR.tablero(PER, true).then(function (t) { D = t; render(); vigilar(); })
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
    var cc = document.getElementById("au-cerrar");
    if (cc) cc.onclick = function () { MOTOR.cerrarLlamada(SESION.id).then(function () { SESION = null; render(); }); };
  }

  function cablearPremios() {
    var sel = document.getElementById("au-quien"), msg = document.getElementById("au-pmsg");
    document.getElementById("au-azar").onclick = function () {
      var g = mios().filter(function (x) { return x.ficha; });
      if (!g.length) return;
      var x = g[Math.floor(Math.random() * g.length)];
      sel.value = x.ficha;
      msg.innerHTML = "🎲 La suerte ha elegido a <b>" + esc(x.alias) + "</b>.";
    };
    Array.prototype.forEach.call(app.querySelectorAll(".au-pr"), function (b) {
      b.onclick = function () {
        var ficha = sel.value;
        if (!ficha) { msg.textContent = "Elige antes a quién."; return; }
        var quien = mios().filter(function (x) { return x.ficha === ficha; })[0] || {};
        b.disabled = true;
        var hecho = function (t) { b.disabled = false; msg.innerHTML = t; recargar(); };
        var mal = function (e) { b.disabled = false; msg.textContent = String(e && e.message || e); };
        if (b.getAttribute("data-carta")) {
          MOTOR.regalarCromo(PER, ficha).then(function (c) {
            hecho("🃏 <b>" + esc(quien.alias) + "</b> se lleva <b>" + esc(c.nombre) + "</b> (" + esc(c.rareza) + ").");
          }).catch(mal);
        } else {
          var xp = Number(b.getAttribute("data-xp")), cr = Number(b.getAttribute("data-cr"));
          MOTOR.premiar(PER, ficha, { xp: xp, creditos: cr, motivo: "Premio en clase" }).then(function () {
            hecho("✅ <b>" + esc(quien.alias) + "</b>: " + (xp ? "+" + xp + " xp " : "") + (cr ? "+" + cr + " ◈" : ""));
          }).catch(mal);
        }
      };
    });
  }

  function nombreEscuadron(id) {
    if (!id || !D) return "";
    var e = (D.escuadrones || []).filter(function (x) { return x.id === id; })[0];
    return e ? e.nombre : "";
  }
  function pintaPresentes() {
    if (!SESION) return;
    MOTOR.fichajesDe(SESION.id).then(function (f) {
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
    });
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
      YO = u;
      if (!YO) return puerta();
      MOTOR.misPERs(YO.correo).then(function (ps) {
        GRUPOS = ps || [];
        if (!GRUPOS.length) return noEresDocente();
        PER = PER_FIJO && GRUPOS.some(function (x) { return x.id === PER_FIJO; }) ? PER_FIJO : GRUPOS[0].id;
        MOTOR.tablero(PER, true).then(function (t) { D = t; render(); vigilar(); })
          .catch(function (e) { puerta("No he podido leer el grupo: " + e.message); });
      }).catch(function (e) { puerta("No he podido leer tus grupos: " + e.message); });
    };
    MOTOR.sesion().then(mirar);
    document.addEventListener("sg:sesion", function (e) { mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
