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

  // 🔴 Mientras el motor por defecto siga siendo el viejo, un enlace a un grupo nuevo SIN el
  // interruptor lleva a «PER no encontrado». Y ese enlace es el que el profesorado copia y pega a
  // su clase: no puede estar mal ni un día. El día que se cambie el valor por defecto, esto sobra
  // y se quita de un sitio.
  var MOTOR_EN_ENLACES = "&motor=firestore";

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

  var TABS = [["alumnado", "Alumnado"], ["canjes", "Cola de nota"], ["equipo", "Equipo docente"],
              ["escuadrones", "Escuadrones"], ["ajustes", "Ajustes"]];

  function pintar() {
    var t = window.SG.TABLERO.tablero(DATOS, true);
    app.innerHTML =
      '<div class="card cuenta"><p><b>' + esc(t.nombre) + '</b> · ' + esc(t.tipo) +
        ' · ' + semanaTexto(t) + ' · ' + t.reclutas.length + ' reclutas' +
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
    ({ alumnado: verAlumnado, canjes: verCanjes, equipo: verEquipo,
       escuadrones: verEscuadrones, ajustes: verAjustes })[TAB](t);
  }

  // Un grupo que empieza dentro de dos semanas está en la «semana -1», que es verdad y no dice
  // nada. Lo que el docente necesita saber es cuándo arranca.
  function semanaTexto(t) {
    if (t.semana === null || t.semana === undefined) return "sin fecha de inicio";
    if (t.semana < 1) return "empieza el " + t.inicio;
    if (t.semana > t.semanas) return "terminado";
    return "semana " + t.semana + " de " + t.semanas;
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
    var ficha = r.ficha;
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
      'en el libro de experiencia, con quién y cuándo.</p>' +
      // 🔴 DAR DE BAJA. Hace falta y no es capricho: alguien se alista en el grupo equivocado,
      // alguien entra con la cuenta que no era y deja una ficha huérfana, o se cuela quien no debía.
      // Sin esto, la única salida era dejarlo ahí para siempre ensuciando el ranking.
      '<p style="margin-top:16px;border-top:1px solid #182238;padding-top:14px">' +
      '<button class="btn min peligro" id="c-baja">Dar de baja a ' + esc(r.alias) + '</button> ' +
      '<span class="small muted">borra su ficha del grupo. Podrá alistarse otra vez, aquí o en otro, ' +
      'empezando de cero.</span></p></div>';
    var baja = $("#c-baja");
    if (baja) baja.onclick = async function () {
      // Dos confirmaciones a propósito: esto borra de verdad y no hay deshacer. La segunda pide
      // escribir el alias, que es lo único que impide un clic distraído sobre la persona equivocada.
      if (!confirm("Vas a dar de baja a «" + r.alias + "» de este grupo.\n\n" +
                   "Se borra su ficha: alias, personaje, retos, insignias y cartas. El rastro de lo " +
                   "que se le dio y se le quitó SÍ se conserva en el libro de experiencia.\n\n" +
                   "No hay deshacer. ¿Seguimos?")) return;
      var escrito = prompt("Para confirmar, escribe su alias exactamente:\n\n" + r.alias);
      if (String(escrito || "").trim() !== r.alias) { aviso("No coincide: no se ha dado de baja a nadie."); return; }
      baja.disabled = true;
      try { await MOTOR.darDeBaja(PER, ficha); await refrescar(); $("#c-ficha").innerHTML = "";
            aviso(r.alias + " ya no está en el grupo.", true); }
      catch (e) { baja.disabled = false; aviso(e.message); }
    };
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
        var emb = esc_ && esc_.imageUrl
          ? '<img class="emb-mini" src="' + esc(esc_.imageUrl) + '" alt="" width="28" height="28"> ' : "";
        return "<tr><td><b>" + esc(d.nombre) + "</b></td><td>" + esc(d.correo || "—") + "</td><td>" +
          esc(d.rol || "docente") + '</td><td class="celda-esc">' + emb + esc(esc_ ? esc_.name : "—") +
          "</td><td>" + n + "</td></tr>";
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
  /**
   * LOS ESCUADRONES.
   *
   * 🔴 Cada docente tiene el suyo y el alumnado lo hereda al elegir Comandante. Aquí se ve quién
   * está en cada uno y cómo van — que es lo que convierte diez nombres bonitos en equipos de verdad.
   *
   * El nombre y el emblema salen del catálogo y se reparten al sembrar: no se tocan desde aquí a
   * propósito. Cambiar el nombre de un escuadrón a mitad de curso le quita a su gente la cosa a la
   * que pertenecen, que es justo lo contrario de lo que hace un escuadrón.
   */
  function verEscuadrones(t) {
    var esc7 = (t.escuadrones || []);
    if (!esc7.length) {
      $("#c-cuerpo").innerHTML = '<div class="card"><h3>Escuadrones</h3>' +
        '<p class="small muted">Este grupo se sembró sin escuadrones. Se crean al crear el grupo, ' +
        'uno por docente del equipo.</p></div>';
      return;
    }
    var conGente = esc7.map(function (e) {
      var suyos = (t.reclutas || []).filter(function (r) { return r.profe === e.comandante; });
      var media = suyos.length ? Math.round(suyos.reduce(function (a, r) { return a + r.xp; }, 0) / suyos.length) : 0;
      return { e: e, suyos: suyos, media: media };
    }).sort(function (a, b) { return b.media - a.media; });
    var huerfanos = (t.reclutas || []).filter(function (r) {
      return !esc7.some(function (e) { return e.comandante === r.profe; });
    });
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Escuadrones</h3>' +
      '<p class="small muted">Uno por docente. El alumnado entra en el de su Comandante al alistarse. ' +
      'Se comparan por <b>media de xp</b>: sumando ganaría siempre el más numeroso.</p>' +
      conGente.map(function (x, i) {
        return '<div class="esc-card' + (i === 0 && x.suyos.length ? " lider" : "") + '">' +
          '<div class="esc-pos">' + (i + 1) + "</div>" +
          (x.e.emblema ? '<img class="esc-emb" loading="lazy" src="' + esc(x.e.emblema) + '" alt="">' : "") +
          '<div class="esc-txt"><b>' + esc(x.e.nombre) + "</b>" +
          (x.e.lema ? "<em>«" + esc(x.e.lema) + "»</em>" : "") +
          '<span class="small muted">' + esc(x.e.comandante) + " · " + x.suyos.length +
          " recluta" + (x.suyos.length === 1 ? "" : "s") +
          (x.e.origen ? " · " + esc(x.e.origen) : "") + "</span></div>" +
          '<div class="esc-val">' + x.media + " xp</div></div>";
      }).join("") +
      (huerfanos.length
        ? '<p class="small" style="margin-top:14px;color:var(--amber)">⚠️ <b>' + huerfanos.length +
          "</b> recluta" + (huerfanos.length === 1 ? "" : "s") + " sin escuadrón: su Comandante ya no " +
          "está en el equipo. Pásalos a otro docente desde la pestaña <b>Equipo docente</b>.</p>"
        : "") +
      "</div>";
  }

  function verAjustes(t) {
    var S = DATOS.proyecto.stargate || {}, P = DATOS.privadoPER || {};
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Ajustes del grupo</h3>' +
      '<label>Nombre<input id="s-nombre" value="' + esc(DATOS.proyecto.name) + '"></label>' +
      '<label>Primer día de la semana 1<input id="s-inicio" type="date" value="' + esc(S.inicio || "") + '"></label>' +
      '<p class="small muted">Calendario actual: apertura ' + esc(S.apertura || "—") + ' · cierre de misiones ' +
      esc(S.cierre || "—") + ' · cierre de canje ' + esc(S.cierreCanje || "—") + "</p>" +
      '<label>Padlet de la clase<input id="s-padlet" value="' + esc(S.padlet || "") + '"></label>' +
      '<label>Ticket de salida <i>(formulario de Google, anónimo)</i><input id="s-ticket" value="' + esc(S.ticket || "") + '"></label>' +
      '<label>Panel de control (ver)<input id="s-panel" value="' + esc(S.panelVer || "") + '"></label>' +
      '<label>Panel de control (editar)<input id="s-paneled" value="' + esc(P.panelEdit || "") + '"></label>' +
      '<p><button class="btn" id="s-guardar">Guardar</button></p></div>' +
      // 🔴 Dos listas separadas, y a propósito. Los de arriba llevan el grupo dentro: uno por
      // grupo y por convocatoria. Los de abajo NO llevan grupo — se deduce de quién pulsa — así que
      // se montan una vez en los Geniallys y no se vuelven a tocar nunca. Mezclarlos haría que se
      // rehicieran los universales cada curso sin necesidad.
      // 🔴 EL CÓDIGO DE ACCESO. Sin él, cualquiera con el enlace se alista. Con él, hay que saber
      // seis caracteres. No es seguridad —el código está en el documento del grupo— pero quita a
      // quien se tropiece con el enlace o a quien se lo reenvíen, que es lo que pasa de verdad.
      '<div class="card"><h3>Código de acceso</h3>' +
      (DATOS.proyecto.joinCode
        ? '<p class="codigo-grande">' + esc(DATOS.proyecto.joinCode) + '</p>' +
          '<p class="small muted">Hace falta para alistarse. El enlace de abajo ya lo lleva dentro, ' +
          'así que quien lo siga no tiene que escribirlo; dícelo en clase para quien llegue sin él.</p>' +
          '<p><button class="btn min" id="s-codigo">Cambiar el código</button> ' +
          '<span class="small muted">si se ha corrido más de la cuenta</span></p>'
        : '<p class="small muted">Este grupo se sembró sin código, así que de momento puede alistarse ' +
          'cualquiera que tenga el enlace.</p>' +
          '<p><button class="btn" id="s-codigo">Poner un código</button></p>') +
      '</div>' +
      '<div class="card"><h3>Enlaces de este grupo</h3>' +
      '<p class="small">Alistamiento (dáselo a tu alumnado):<br><code>' + location.origin + '/alistarse.html?per=' + esc(PER) + MOTOR_EN_ENLACES + (DATOS.proyecto.joinCode ? '&codigo=' + esc(DATOS.proyecto.joinCode) : '') + '</code></p>' +
      '<p class="small">La Nave:<br><code>' + location.origin + '/recluta.html?per=' + esc(PER) + MOTOR_EN_ENLACES + '</code></p>' +
      '<p class="small">La sesión para proyectar:<br><code>' + location.origin + '/sesion.html?per=' + esc(PER) + MOTOR_EN_ENLACES + '</code></p></div>' +
      '<div class="card"><h3>Para los Geniallys · se montan UNA vez</h3>' +
      '<p class="small muted">Ninguno lleva el grupo dentro: se deduce de la cuenta de quien pulsa. ' +
      'Valen en todos los grupos y todas las convocatorias. Añade <code>?embed=1</code> para incrustarlos.</p>' +
      '<p class="small">🎯 Validar un reto:<br><code>' + location.origin + '/validar.html?reto=S7</code></p>' +
      '<p class="small">🔔 Llamada a filas (solo la toca el Comandante):<br><code>' + location.origin + '/llamada.html</code></p>' +
      '<p class="small">🛰️ El aula (el puesto de mando del docente):<br><code>' + location.origin + '/aula.html</code></p></div>';
    if ($("#s-codigo")) $("#s-codigo").onclick = async function () {
      if (DATOS.proyecto.joinCode &&
          !confirm("Se cambiará el código. Quien tenga el enlace viejo ya no podrá alistarse " +
                   "hasta que le pases el nuevo.\n\n¿Seguimos?")) return;
      try { var c = await MOTOR.nuevoCodigo(PER); await refrescar(); aviso("Código nuevo: " + c, true); }
      catch (e) { aviso(e.message); }
    };
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
            "stargate.ticket": $("#s-ticket").value.trim(),
            "stargate.panelVer": $("#s-panel").value.trim() },
          { panelEdit: $("#s-paneled").value.trim() });
        await refrescar(); aviso("Guardado", true);
      } catch (e) { aviso(e.message); }
    };
  }

  /**
   * MODO DEMO (?demo=1). El puesto de mando entero, con un grupo de verdad y personas inventadas.
   *
   * 🔴 Lee por la puerta PÚBLICA —la misma que usan los Geniallys proyectados— porque esa no pide
   * sesión, y luego se inventa lo privado: nombres y correos que no son de nadie. Así la captura del
   * tutorial se regenera con un comando y sin credenciales, y enseña la pantalla REAL: si mañana
   * cambia la consola, cambia la captura. Las de la hoja de cálculo envejecían en silencio porque
   * había que sacarlas a mano con una sesión abierta.
   */
  async function demostracion() {
    cargando("Preparando la demostración…");
    var PUB = window.SG_API_PUBLICA ||
      "https://us-central1-gamificapro-99e0a.cloudfunctions.net/tableroStargate";
    var per = url.get("per") || "demo-motor";
    var d = await fetch(PUB + "?per=" + encodeURIComponent(per)).then(function (r) { return r.json(); });
    if (d.error) { app.innerHTML = '<div class="card"><h3>La demostración no está disponible</h3><p>' +
      esc(d.error) + "</p></div>"; return; }
    var NOM = [["Vega", "Estrella Ruiz"], ["Orion", "Cazador Paz"], ["Lyra", "Cuerda Sol"],
               ["Nix", "Noche Vera"], ["Talia", "Vuelo Mar"]];
    var privados = {};
    (d.perfiles || []).forEach(function (p, i) {
      var n = NOM[i % NOM.length];
      privados[p.id] = { firstName: n[0], lastName: n[1],
                         email: n[0].toLowerCase() + "@ejemplo.es", bitacora: "", bio: "" };
    });
    PER = per; PERS = [{ id: per, nombre: (d.proyecto || {}).name || per }];
    // 🔴 Las mismas claves que arma `leerPER`, con los mismos nombres. El catálogo y `privadoPER`
    // no son opcionales: sin ellos el traductor revienta al calcular el primer nivel.
    DATOS = Object.assign({}, d, { privados: privados, vales: d.vales || [],
                                   catalogo: window.SG_CATALOGO,
                                   privadoPER: { referente: "referente@ejemplo.es", panelEdit: "", docentes: [] } });
    pintar();
    Array.prototype.forEach.call(app.querySelectorAll("button"), function (b) {
      if (/Guardar|Conceder|Denegar|Pasar el alumnado/.test(b.textContent)) b.disabled = true;
    });
  }

  function arrancar() {
    MOTOR = window.SG.MOTOR;
    if (url.get("demo") === "1") return demostracion();
    var mirar = function (u) { YO = u; YO ? elegirGrupo() : puerta(); };
    MOTOR.sesion().then(mirar);
    document.addEventListener("sg:sesion", function (e) { mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
