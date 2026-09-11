/**
 * STARGATE · LA CONSOLA DEL REFERENTE
 *
 * Crear un grupo (PER) sin abrir una hoja de cálculo ni un formulario. Es lo que antes hacía el
 * menú de la hoja maestra, y lo que hace posible que el sistema siga vivo sin nadie delante: quien
 * lleva el máster entra con su cuenta, escribe cinco datos y el grupo queda sembrado entero —los
 * retos, los planetas, la tienda, el álbum y el vestuario.
 *
 * 🔴 La regla que gobierna esta pantalla: NO se pregunta nada que se pueda deducir. La fecha de la
 * semana 1 decide el calendario completo (apertura, cierre de misiones, cierre de canje y la semana
 * en que se abre el Arsenal). Preguntar cuatro fechas era pedirle al profesorado que hiciera
 * aritmética de calendario a las once de la noche, y de ahí salían los errores.
 */
(function () {
  "use strict";
  var $ = function (s, d) { return (d || document).querySelector(s); };
  var app = $("#crear-app");
  if (!app) return;

  var MOTOR = null, YO = null, docentes = [];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // El identificador del grupo sale del nombre, igual que siempre: «PER Septiembre 2026» → per-septiembre-2026.
  function slug(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  }

  function aviso(txt, clase) {
    var d = $("#crear-aviso");
    if (d) { d.className = "aviso " + (clase || ""); d.innerHTML = txt; d.hidden = !txt; }
  }

  // ---------------------------------------------------------------- la puerta
  function pintarPuerta() {
    app.innerHTML =
      '<div class="card"><h3>Entra con tu cuenta</h3>' +
      '<p>Para crear un grupo hay que identificarse. El grupo quedará a nombre de la cuenta con la ' +
      'que entres, así que <b>entra con la cuenta de la universidad</b>.</p>' +
      '<p><button class="btn" id="btn-entrar">Entrar con Google</button></p></div>';
    $("#btn-entrar").onclick = function () {
      MOTOR.entrar().catch(function (e) { aviso("No he podido entrar: " + esc(e.message), "malo"); });
    };
  }

  // ---------------------------------------------------------------- el formulario
  function pintar() {
    app.innerHTML =
      '<div class="card cuenta"><p>Estás como <b>' + esc(YO.nombre || YO.correo) + '</b> · ' +
      esc(YO.correo) + ' <button class="btn min" id="btn-salir">Cambiar de cuenta</button></p>' +
      // 🔴 El mismo aviso que da la hoja de cálculo, y por la misma razón: lo que se crea queda en
      // propiedad de quien lo crea, y recuperarlo después es un vía crucis de permisos.
      '<p class="small muted">Todo lo que crees quedará a nombre de esta cuenta. Si no es la de la ' +
      'universidad, cámbiala <b>antes</b> de seguir.</p></div>' +

      '<div id="crear-aviso" class="aviso" hidden></div>' +

      '<div class="card"><h3>1 · El grupo</h3>' +
      '<label>Nombre del grupo<input id="f-nombre" placeholder="PER Septiembre 2026" autocomplete="off"></label>' +
      '<p class="small muted" id="f-id">Se guardará como: —</p>' +
      '<label>Tipo<select id="f-tipo">' +
      '<option value="REGULAR">Regular · 15 semanas</option>' +
      '<option value="PUA">PUA · 8 semanas</option></select></label>' +
      '<label>Primer día de la semana 1<input id="f-inicio" type="date"></label>' +
      '<p class="small muted" id="f-calendario">De esta fecha salen solas la apertura, el cierre de ' +
      'misiones, el cierre de canje y la semana en que se abre el Arsenal.</p></div>' +

      '<div class="card"><h3>2 · Los enlaces de la clase</h3>' +
      '<p class="small">Opcionales: se pueden poner y cambiar después.</p>' +
      '<label>Padlet de la clase<input id="f-padlet" placeholder="https://padlet.com/…" autocomplete="off"></label>' +
      '<label>Panel de control (ver)<input id="f-panel" placeholder="https://view.genially.com/…" autocomplete="off"></label>' +
      '<label>Panel de control (editar)<input id="f-paneled" placeholder="https://app.genially.com/editor/…" autocomplete="off"></label>' +
      '<p class="small muted">Si no pones ninguno, el grupo usa el panel oficial. Cada docente puede ' +
      'tener además el suyo propio, abajo.</p></div>' +

      '<div class="card"><h3>3 · El equipo docente</h3>' +
      '<p class="small">Quien esté en esta lista verá el grupo al entrar con su correo. El <b>referente</b> ' +
      'es quien puede crear grupos y tocar los ajustes.</p>' +
      '<div id="f-docentes"></div>' +
      '<p><button class="btn min" id="btn-mas">+ Añadir docente</button></p></div>' +

      '<div class="card resumen"><h3>Lo que se va a crear</h3><div id="f-resumen">—</div>' +
      '<p><button class="btn grande" id="btn-crear">Crear el grupo</button></p>' +
      '<div id="f-progreso" class="small muted"></div></div>';

    $("#btn-salir").onclick = function () { MOTOR.salir(); };
    $("#btn-mas").onclick = function () { docentes.push(vacio()); pintarDocentes(); };
    $("#btn-crear").onclick = crear;
    ["f-nombre", "f-tipo", "f-inicio"].forEach(function (id) {
      $("#" + id).oninput = $("#" + id).onchange = repintar;
    });
    if (!docentes.length) docentes.push({ nombre: YO.nombre || "", correo: YO.correo, rol: "referente", panel: "" });
    pintarDocentes();
    repintar();
  }

  function vacio() { return { nombre: "", correo: "", rol: "docente", panel: "" }; }

  function pintarDocentes() {
    $("#f-docentes").innerHTML = docentes.map(function (d, i) {
      return '<div class="docente" data-i="' + i + '">' +
        '<input class="d-nombre" placeholder="Nombre y apellidos" value="' + esc(d.nombre) + '">' +
        '<input class="d-correo" placeholder="correo@unir.net" value="' + esc(d.correo) + '" inputmode="email">' +
        '<select class="d-rol"><option value="docente"' + (d.rol === "docente" ? " selected" : "") + '>Docente</option>' +
        '<option value="referente"' + (d.rol === "referente" ? " selected" : "") + '>Referente</option></select>' +
        '<input class="d-panel" placeholder="Su Genially propio (opcional)" value="' + esc(d.panel) + '">' +
        '<button class="btn min quitar" title="Quitar">✕</button></div>';
    }).join("");
    Array.prototype.forEach.call($("#f-docentes").children, function (fila) {
      var i = Number(fila.getAttribute("data-i"));
      ["nombre", "correo", "rol", "panel"].forEach(function (k) {
        var e = $(".d-" + k, fila);
        e.oninput = e.onchange = function () { docentes[i][k] = e.value.trim(); repintar(); };
      });
      $(".quitar", fila).onclick = function () { docentes.splice(i, 1); pintarDocentes(); repintar(); };
    });
  }

  function datos() {
    return {
      id: slug($("#f-nombre").value),
      nombre: $("#f-nombre").value.trim(),
      tipo: $("#f-tipo").value,
      inicio: $("#f-inicio").value,
      padlet: $("#f-padlet").value.trim(),
      panelVer: $("#f-panel").value.trim(),
      panelEdit: $("#f-paneled").value.trim(),
      referente: (docentes.filter(function (d) { return d.rol === "referente"; })[0] || {}).correo || YO.correo,
      docentes: docentes.filter(function (d) { return d.nombre || d.correo; })
    };
  }

  // El resumen no es decoración: es la última oportunidad de ver una fecha mal puesta antes de que
  // se siembre un grupo entero. Enseña el calendario COMPLETO que se deduce de la semana 1.
  function repintar() {
    var d = datos();
    $("#f-id").textContent = d.id ? "Se guardará como: " + d.id : "Se guardará como: —";
    if (!d.nombre || !d.inicio) { $("#f-resumen").innerHTML = "<p class='muted'>Escribe el nombre y la fecha de la semana 1.</p>"; return; }
    var paq;
    try { paq = window.SG.PAQUETE.paquete(d, window.SG_CATALOGO); }
    catch (e) { $("#f-resumen").innerHTML = "<p class='malo'>" + esc(e.message) + "</p>"; return; }
    var S = paq.proyecto.stargate;
    var arsenal = paq.recompensas.filter(function (r) { return r.stargateTipo === "nota"; })[0];
    $("#f-resumen").innerHTML =
      "<ul>" +
      "<li><b>" + esc(d.nombre) + "</b> · " + S.tipo + " · " + S.semanas + " semanas</li>" +
      "<li>Semana 1: <b>" + S.inicio + "</b> — última semana acaba el <b>" + S.cierre + "</b></li>" +
      "<li>El canje sigue abierto hasta el <b>" + S.cierreCanje + "</b></li>" +
      "<li>El Arsenal de Batalla se abre en la semana " + arsenal.stargateSemana + "</li>" +
      "<li>" + paq.misiones.length + " retos · " + paq.campanas.length + " campañas · " +
        paq.recompensas.filter(function (r) { return r.inStore !== false; }).length + " recompensas en la tienda</li>" +
      "<li>" + (d.docentes.length || "ningún") + " docente" + (d.docentes.length === 1 ? "" : "s") +
        (S.padlet ? " · con padlet" : "") + (S.panelVer ? " · con panel propio" : " · con el panel oficial") + "</li>" +
      "</ul>";
  }

  async function crear() {
    var d = datos();
    if (!d.nombre) return aviso("Falta el nombre del grupo.", "malo");
    if (!d.inicio) return aviso("Falta el primer día de la semana 1.", "malo");
    var sinCorreo = d.docentes.filter(function (x) { return !x.correo; });
    if (sinCorreo.length) return aviso("Hay docentes sin correo: sin correo no podrán entrar a su grupo.", "malo");
    aviso("");
    var boton = $("#btn-crear"); boton.disabled = true;
    var paso = $("#f-progreso");
    try {
      await MOTOR.sembrarPER(d, function (t) { paso.textContent = t; });
      app.innerHTML = '<div class="card bien"><h3>Grupo creado</h3>' +
        '<p><b>' + esc(d.nombre) + '</b> está sembrado y listo.</p>' +
        '<p>El enlace de alistamiento para tu alumnado:<br>' +
        '<code>' + location.origin + '/recluta.html?per=' + esc(d.id) + '</code></p>' +
        '<p><a class="btn" href="clase.html?per=' + esc(d.id) + '">Ir a la sala de clase</a> ' +
        '<a class="btn min" href="crear.html">Crear otro</a></p></div>';
    } catch (e) {
      boton.disabled = false; paso.textContent = "";
      aviso("No se ha podido crear: " + esc(e.message), "malo");
    }
  }

  // ---------------------------------------------------------------- arranque
  function arrancar() {
    MOTOR = window.SG.MOTOR;
    MOTOR.sesion().then(function (u) { YO = u; u ? pintar() : pintarPuerta(); });
    document.addEventListener("sg:sesion", function (e) { YO = e.detail; YO ? pintar() : pintarPuerta(); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
