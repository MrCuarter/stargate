/**
 * STARGATE · LA CONSOLA DEL REFERENTE
 *
 * Todo lo que hacía el menú de la hoja de cálculo, en una página y sin hoja: crear grupos, cambiar
 * fechas y enlaces, mover el equipo docente, pasar el alumnado de un profesor a otro, otorgar o
 * anular retos y resolver la cola de nota.
 *
 * 🔴 No pide PIN: pide cuenta. Y eso no es solo más seguro —un PIN compartido de seis cifras se
 * adivina en unas horas y no hay forma de bloquear intentos—, es que además el PIN no distinguía a
 * nadie: quien lo tenía lo veía todo. Con la cuenta, cada docente ve sus grupos y el referente ve
 * los suyos, sin preguntarle a nadie quién es.
 */
(function () {
  "use strict";
  var app = document.querySelector("#consola-app");
  if (!app) return;
  var MOTOR = null, YO = null, PERS = [], PER = null, DATOS = null, TAB = "alumnado";
  var url = new URLSearchParams(location.search);

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(s) { return app.querySelector(s); }
  function cargando(t) { app.innerHTML = '<div class="card"><p class="muted">' + esc(t || "Cargando…") + "</p></div>"; }
  function fallo(t) { app.innerHTML = '<div class="card"><p class="malo">' + esc(t) + "</p></div>"; }

  function puerta() {
    app.innerHTML = '<div class="card"><h3>Entra con tu cuenta</h3>' +
      '<p>Verás los grupos en los que figuras como docente. Si aún no tienes ninguno, podrás crear el primero.</p>' +
      '<p><button class="btn grande" id="c-entrar">Entrar con Google</button></p></div>';
    $("#c-entrar").onclick = function () { MOTOR.entrar().catch(function (e) { fallo(e.message); }); };
  }

  // ---------------------------------------------------------------- elegir grupo
  async function elegirGrupo() {
    cargando("Buscando tus grupos…");
    PERS = await MOTOR.misPERs(YO.correo);
    if (!PERS.length) {
      app.innerHTML = '<div class="card"><h3>Todavía no tienes grupos</h3>' +
        '<p>No figuras como docente en ningún grupo de STARGATE con el correo <b>' + esc(YO.correo) + '</b>.</p>' +
        '<p><a class="btn grande" href="crear.html">Crear el primero</a></p>' +
        '<p class="small muted">Si deberías estar en uno, pídele a tu referente que te añada con este correo.</p></div>';
      return;
    }
    var guardado = url.get("per");
    if (guardado && PERS.filter(function (p) { return p.id === guardado; }).length) return abrir(guardado);
    if (PERS.length === 1) return abrir(PERS[0].id);
    app.innerHTML = '<div class="card"><h3>Tus grupos</h3>' +
      PERS.map(function (p) {
        return '<p><button class="btn" data-per="' + esc(p.id) + '">' + esc(p.nombre) +
               ' <i>· ' + esc(p.stargate.tipo || "") + '</i></button></p>';
      }).join("") + '<p><a class="btn min" href="crear.html">+ Crear otro grupo</a></p></div>';
    Array.prototype.forEach.call(app.querySelectorAll("[data-per]"), function (b) {
      b.onclick = function () { abrir(b.getAttribute("data-per")); };
    });
  }

  async function abrir(perId) {
    PER = perId;
    history.replaceState(null, "", "consola.html?per=" + encodeURIComponent(perId));
    cargando("Leyendo el grupo…");
    try { DATOS = await MOTOR.leerPER(perId, true); }
    catch (e) { return fallo("No he podido leer el grupo: " + e.message); }
    pintar();
  }

  var TABS = [["alumnado", "Alumnado"], ["canjes", "Cola de nota"], ["equipo", "Equipo docente"], ["ajustes", "Ajustes"]];

  function pintar() {
    var t = window.SG.TABLERO.tablero(DATOS, true);
    app.innerHTML =
      '<div class="card cuenta"><p><b>' + esc(t.nombre) + '</b> · ' + esc(t.tipo) +
        ' · semana ' + t.semana + " de " + t.semanas + ' · ' + t.reclutas.length + ' reclutas' +
        (PERS.length > 1 ? ' <button class="btn min" id="c-cambiar">Cambiar de grupo</button>' : '') +
        ' <button class="btn min" id="c-salir">Salir</button></p></div>' +
      '<div class="pestanas">' + TABS.map(function (x) {
        return '<button class="pest' + (TAB === x[0] ? " activa" : "") + '" data-tab="' + x[0] + '">' + x[1] + "</button>";
      }).join("") + "</div>" +
      '<div id="c-aviso" class="aviso" hidden></div>' +
      '<div id="c-cuerpo"></div>';
    Array.prototype.forEach.call(app.querySelectorAll("[data-tab]"), function (b) {
      b.onclick = function () { TAB = b.getAttribute("data-tab"); pintar(); };
    });
    if ($("#c-cambiar")) $("#c-cambiar").onclick = function () { url.delete("per"); elegirGrupo(); };
    $("#c-salir").onclick = function () { MOTOR.salir(); };
    ({ alumnado: verAlumnado, canjes: verCanjes, equipo: verEquipo, ajustes: verAjustes })[TAB](t);
  }

  function aviso(txt, bien) {
    var d = $("#c-aviso"); if (!d) return;
    d.innerHTML = esc(txt); d.className = "aviso " + (bien ? "" : "malo"); d.hidden = !txt;
  }
  async function refrescar() { DATOS = await MOTOR.leerPER(PER, true); pintar(); }

  // ---------------------------------------------------------------- alumnado
  function verAlumnado(t) {
    var retos = DATOS.misiones.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Alumnado</h3>' +
      '<p class="small muted">El nombre y el correo solo los ves tú y el resto del equipo docente. ' +
      'Pulsa una fila para otorgar o anular un reto.</p>' +
      '<table class="tabla"><thead><tr><th>#</th><th>Alias</th><th>Nombre</th><th>Comandante</th>' +
      '<th>xp</th><th>◈</th><th>Insignias</th></tr></thead><tbody>' +
      t.reclutas.map(function (r, i) {
        return '<tr data-r="' + i + '"><td>' + r.pos + '</td><td><b>' + esc(r.alias) + '</b>' +
          (r.corona ? " 👑" : "") + '</td><td>' + esc(r.nombre || "—") + '<br><span class="small muted">' +
          esc(r.email || "") + '</span></td><td>' + esc(r.profe || "—") + '</td><td>' + r.xp +
          '</td><td>' + r.creditos + '</td><td>' + r.n + "/24</td></tr>";
      }).join("") + "</tbody></table>" +
      (t.sin_docente ? '<p class="aviso">⚠️ ' + t.sin_docente + ' recluta(s) sin Comandante asignado.</p>' : "") +
      "</div><div id='c-ficha'></div>";
    Array.prototype.forEach.call(app.querySelectorAll("[data-r]"), function (fila) {
      fila.onclick = function () { verFicha(t.reclutas[Number(fila.getAttribute("data-r"))], retos); };
    });
  }

  function verFicha(r, retos) {
    var ficha = (DATOS.perfiles.filter(function (p) { return p.displayName === r.alias; })[0] || {}).id;
    $("#c-ficha").innerHTML = '<div class="card"><h3>' + esc(r.alias) + ' · ' + esc(r.nombre || "") + "</h3>" +
      '<p class="small">' + r.xp + ' xp · ' + r.creditos + ' ◈ · nivel ' + r.nivel + " " + esc(r.rango_nombre) +
      ' · racha ' + r.racha + " semanas</p>" +
      '<div class="retos-ficha">' + retos.map(function (m) {
        var tiene = !!(r.retos || {})[m.id];
        return '<button class="reto' + (tiene ? " hecho" : "") + '" data-reto="' + esc(m.id) + '" ' +
               'data-ficha="' + esc(ficha) + '" data-tiene="' + (tiene ? 1 : 0) + '" title="' +
               esc(m.title) + '">' + esc(m.id) + (tiene ? " ✓" : "") + "</button>";
      }).join("") + "</div>" +
      '<p class="small muted">Verde = registrado. Púlsalo para otorgar o anular. Todo queda anotado ' +
      'en el libro de experiencia, con quién y cuándo.</p></div>';
    Array.prototype.forEach.call(app.querySelectorAll("[data-reto]"), function (b) {
      b.onclick = async function () {
        var id = b.getAttribute("data-reto"), f = b.getAttribute("data-ficha"), tiene = b.getAttribute("data-tiene") === "1";
        if (tiene && !confirm("¿Anular el reto " + id + " a " + r.alias + "?\n\nSe le descontarán los xp y los créditos que dio.")) return;
        b.disabled = true;
        try {
          if (tiene) await MOTOR.anularReto(PER, f, id, "desde la consola");
          else await MOTOR.otorgarReto(PER, f, id);
          await refrescar();
          aviso((tiene ? "Anulado " : "Otorgado ") + id + " a " + r.alias, true);
        } catch (e) { b.disabled = false; aviso(e.message); }
      };
    });
  }

  // ---------------------------------------------------------------- la cola de nota
  function verCanjes() {
    var pendientes = (DATOS.vales || []).filter(function (v) { return (v.status || "pending") === "pending"; });
    var alias = {};
    DATOS.perfiles.forEach(function (p) { alias[p.userId] = p.displayName; });
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Cola de nota</h3>' +
      // 🔴 La razón de que esta cola exista: con las subidas de nota concediéndose solas, un curso
      // terminaba con setenta cambios de nota. Aprobando en bloque y con precios altos, con tres o
      // cuatro. La cola no es burocracia, es el freno.
      '<p class="small muted">Las subidas de nota no se conceden solas: se piden y tú decides. ' +
      'Los créditos ya están retenidos; si deniegas, se le devuelven.</p>' +
      (pendientes.length
        ? pendientes.map(function (v) {
            return '<div class="vale"><p><b>' + esc(alias[v.studentId] || v.studentId) + '</b> — ' +
              esc(v.rewardTitle || "") + ' <i>(' + (v.cost || 0) + ' ◈)</i>' +
              (v.stargateActividad ? '<br><span class="small">' + esc(v.stargateActividad) + "</span>" : "") + "</p>" +
              '<p><button class="btn min si" data-si="' + esc(v.id) + '">Conceder</button> ' +
              '<button class="btn min no" data-no="' + esc(v.id) + '">Denegar y devolver</button></p></div>';
          }).join("")
        : '<p class="muted">No hay nada pendiente.</p>') + "</div>";
    var resolver = function (id, si) {
      return async function () {
        try { await MOTOR.resolverVale(id, si, ""); await refrescar(); aviso(si ? "Concedido" : "Denegado y devuelto", true); }
        catch (e) { aviso(e.message); }
      };
    };
    Array.prototype.forEach.call(app.querySelectorAll("[data-si]"), function (b) { b.onclick = resolver(b.getAttribute("data-si"), true); });
    Array.prototype.forEach.call(app.querySelectorAll("[data-no]"), function (b) { b.onclick = resolver(b.getAttribute("data-no"), false); });
  }

  // ---------------------------------------------------------------- equipo docente
  function verEquipo(t) {
    var docs = t.docentes_full || [];
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Equipo docente</h3>' +
      '<table class="tabla"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Escuadrón</th><th>Reclutas</th></tr></thead><tbody>' +
      docs.map(function (d) {
        var esc_ = (DATOS.proyecto.factions || []).filter(function (f) { return f.teacherName === d.nombre; })[0];
        var n = t.reclutas.filter(function (r) { return r.profe === d.nombre; }).length;
        return "<tr><td><b>" + esc(d.nombre) + "</b></td><td>" + esc(d.correo || "—") + "</td><td>" +
          esc(d.rol || "docente") + "</td><td>" + esc(esc_ ? esc_.name : "—") + "</td><td>" + n + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      '<div class="card"><h3>Pasar el alumnado de un docente a otro</h3>' +
      // Pasa de verdad: alguien se va a mitad de curso y sus doscientos reclutas se quedan sin
      // Comandante. A mano son doscientas fichas.
      '<p class="small muted">Se cambia el Comandante y el escuadrón de todo su alumnado de una vez.</p>' +
      '<label>De<select id="t-de">' + docs.map(function (d) { return "<option>" + esc(d.nombre) + "</option>"; }).join("") + "</select></label>" +
      '<label>A<select id="t-a">' + docs.map(function (d) { return "<option>" + esc(d.nombre) + "</option>"; }).join("") + "</select></label>" +
      '<p><button class="btn" id="t-ir">Pasar el alumnado</button></p></div>';
    $("#t-ir").onclick = async function () {
      var de = $("#t-de").value, a = $("#t-a").value;
      if (de === a) return aviso("Son el mismo docente.");
      if (!confirm("¿Pasar todo el alumnado de " + de + " a " + a + "?")) return;
      try { var n = await MOTOR.traspasar(PER, de, a); await refrescar(); aviso(n + " reclutas pasados a " + a, true); }
      catch (e) { aviso(e.message); }
    };
  }

  // ---------------------------------------------------------------- ajustes
  function verAjustes(t) {
    var S = DATOS.proyecto.stargate || {}, P = DATOS.privadoPER || {};
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Ajustes del grupo</h3>' +
      '<label>Nombre<input id="s-nombre" value="' + esc(DATOS.proyecto.name) + '"></label>' +
      '<label>Primer día de la semana 1<input id="s-inicio" type="date" value="' + esc(S.inicio || "") + '"></label>' +
      '<p class="small muted">Calendario actual: apertura ' + esc(S.apertura || "—") + ' · cierre de misiones ' +
      esc(S.cierre || "—") + ' · cierre de canje ' + esc(S.cierreCanje || "—") + "</p>" +
      '<label>Padlet de la clase<input id="s-padlet" value="' + esc(S.padlet || "") + '"></label>' +
      '<label>Panel de control (ver)<input id="s-panel" value="' + esc(S.panelVer || "") + '"></label>' +
      '<label>Panel de control (editar)<input id="s-paneled" value="' + esc(P.panelEdit || "") + '"></label>' +
      '<p><button class="btn" id="s-guardar">Guardar</button></p></div>' +
      '<div class="card"><h3>Enlaces del grupo</h3>' +
      '<p class="small">Alistamiento (dáselo a tu alumnado):<br><code>' + location.origin + '/alistarse.html?per=' + esc(PER) + '</code></p>' +
      '<p class="small">La Nave:<br><code>' + location.origin + '/recluta.html?per=' + esc(PER) + '</code></p>' +
      '<p class="small">Validar un reto desde un Genially (sirve en TODOS los grupos):<br>' +
      '<code>' + location.origin + '/validar.html?reto=S7</code></p></div>';
    $("#s-guardar").onclick = async function () {
      try {
        // Cambiar la fecha de la semana 1 recalcula el calendario entero, igual que al crear: es la
        // única fecha que se toca, porque las demás se deducen y no deben poder contradecirla.
        var inicio = $("#s-inicio").value;
        var fechas = window.SG.PAQUETE.paquete({ id: PER, nombre: $("#s-nombre").value, tipo: S.tipo,
          inicio: inicio, docentes: [] }, window.SG_CATALOGO).proyecto.stargate;
        await MOTOR.guardarAjustes(PER,
          { name: $("#s-nombre").value.trim(),
            "stargate.inicio": inicio, "stargate.apertura": fechas.apertura,
            "stargate.cierre": fechas.cierre, "stargate.cierreCanje": fechas.cierreCanje,
            "stargate.padlet": $("#s-padlet").value.trim(),
            "stargate.panelVer": $("#s-panel").value.trim() },
          { panelEdit: $("#s-paneled").value.trim() });
        await refrescar(); aviso("Guardado", true);
      } catch (e) { aviso(e.message); }
    };
  }

  function arrancar() {
    MOTOR = window.SG.MOTOR;
    var mirar = function (u) { YO = u; YO ? elegirGrupo() : puerta(); };
    MOTOR.sesion().then(mirar);
    document.addEventListener("sg:sesion", function (e) { mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
