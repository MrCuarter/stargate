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

  // 🔴 Mientras el motor por defecto siga siendo el viejo, un enlace a un grupo nuevo SIN el
  // interruptor lleva a «PER no encontrado». Y ese enlace es el que el profesorado copia y pega a
  // su clase: no puede estar mal ni un día. El día que se cambie el valor por defecto, esto sobra
  // y se quita de un sitio.
  var MOTOR_EN_ENLACES = "&motor=firestore";

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
      '<p><button class="btn primary grande btn-google" id="btn-entrar">' +
      ((window.SG && window.SG.LOGO_G) || "") +
      '<span>Iniciar sesión con Google</span></button></p>' +
      '<p class="small muted">Te llevará a la pantalla de Google. Tu contraseña se escribe allí, ' +
      'nunca aquí.</p></div>';
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
      /**
       * 🔴 EL TICKET YA NO SE PREGUNTA. Norberto: «si el ticket de salida es el mismo para todos
       * los grupos, ¿por qué aparece aquí? No hace falta poner info que no cambia». Exacto: es un
       * único formulario para todos los grupos y todos los años, y se pone solo.
       *
       * Y lo que de verdad había que explicar —que era lo que faltaba— es CÓMO distingue un grupo
       * de otro sin que nadie toque nada: el enlace va PRECARGADO. Lleva dentro el grupo y el
       * Comandante, así que cada respuesta llega ya etiquetada. Crear un grupo no obliga a tocar el
       * formulario, ni a añadirle una opción, ni a mirarlo siquiera.
       */
      '<label>Panel de control (ver)<input id="f-panel" placeholder="https://view.genially.com/…" autocomplete="off"></label>' +
      '<label>Panel de control (editar)<input id="f-paneled" placeholder="https://app.genially.com/editor/…" autocomplete="off"></label>' +
      '<p class="small muted">Si no pones ninguno, el grupo usa el panel oficial. Cada docente puede ' +
      'tener además el suyo propio, abajo.<br>El <b>ticket de salida</b> se pone solo: es el mismo ' +
      'formulario para todos los grupos y todos los años, y el enlace de este grupo ya lleva dentro ' +
      'su nombre y el del Comandante, así que cada respuesta te llega etiquetada. <b>No hay que ' +
      'tocar nada al crear un grupo.</b> Sigue siendo un formulario de Google porque tiene que ser ' +
      '<b>anónimo</b>.</p></div>' +

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

  function vacio() { return { nombre: "", correo: "", rol: "docente", imparte: true, panel: "" }; }
  function esRef(d) { return d.rol === "referente"; }
  // Quien no lleva la marca es que viene de antes de que existiera: entonces «docente» ya quería
  // decir que imparte, así que se asume para no cambiarle el grupo a nadie por la espalda.
  function imparte(d) { return d.imparte == null ? d.rol !== "referente" || !!d.imparteViejo : !!d.imparte; }

  function pintarDocentes() {
    $("#f-docentes").innerHTML = docentes.map(function (d, i) {
      return '<div class="docente" data-i="' + i + '">' +
        '<input class="d-nombre" placeholder="Nombre y apellidos" value="' + esc(d.nombre) + '">' +
        '<input class="d-correo" placeholder="correo@unir.net" value="' + esc(d.correo) + '" inputmode="email">' +
        /**
         * 🔴 LOS DOS PAPELES NO SON EXCLUYENTES, y el desplegable obligaba a elegir. Norberto:
         * «un docente puede ser referente, docente o los dos a la vez. En ocasiones el referente NO
         * IMPARTE». Son dos cosas distintas: REFERENTE es quien gobierna el grupo (crea, ajusta,
         * resuelve) e IMPARTE es quien tiene clase y, por tanto, escuadrón y alumnado. El
         * coordinador del máster suele ser lo primero sin ser lo segundo.
         * 🔴 Y tiene consecuencia real: solo quien imparte se lleva escuadrón. Marcar «referente»
         * a quien no da clase y que aun así le tocara un escuadrón significaba un escuadrón vacío
         * ensuciando el ranking desde el primer día.
         */
        '<div class="d-roles">' +
          '<label><input type="checkbox" class="d-ref"' + (esRef(d) ? " checked" : "") + '> Referente</label>' +
          '<label><input type="checkbox" class="d-imp"' + (imparte(d) ? " checked" : "") + '> Imparte</label>' +
        '</div>' +
        '<input class="d-panel" placeholder="Su Genially propio (opcional)" value="' + esc(d.panel) + '">' +
        '<button class="btn min quitar" title="Quitar">✕</button></div>';
    }).join("");
    Array.prototype.forEach.call($("#f-docentes").children, function (fila) {
      var i = Number(fila.getAttribute("data-i"));
      ["nombre", "correo", "panel"].forEach(function (k) {
        var e = $(".d-" + k, fila);
        e.oninput = e.onchange = function () { docentes[i][k] = e.value.trim(); repintar(); };
      });
      var cRef = $(".d-ref", fila), cImp = $(".d-imp", fila);
      var guarda = function () {
        // Se sigue guardando UN `rol` porque es lo que lee todo lo demás; «imparte» va aparte.
        docentes[i].rol = cRef.checked ? "referente" : "docente";
        docentes[i].imparte = cImp.checked;
        // Alguien tiene que dar clase: si no es ni una cosa ni la otra, al menos imparte.
        if (!cRef.checked && !cImp.checked) { cImp.checked = true; docentes[i].imparte = true; }
        repintar();
      };
      cRef.onchange = guarda; cImp.onchange = guarda;
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
      ticket: window.SG_TICKET_URL || "",
      panelVer: $("#f-panel").value.trim(),
      panelEdit: $("#f-paneled").value.trim(),
      referente: (docentes.filter(function (d) { return d.rol === "referente"; })[0] || {}).correo || YO.correo,
      docentes: docentes.filter(function (d) { return d.nombre || d.correo; })
                        .map(function (d) { return Object.assign({}, d, { imparte: imparte(d) }); })
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
      var creado = await MOTOR.sembrarPER(d, function (t) { paso.textContent = t; });
      var codigo = (creado && creado.codigo) || "";
      // El enlace que se le da al alumnado es el de ALISTARSE, no el de la Nave: a la Nave no se
      // puede entrar sin ficha, y la ficha se abre alistándose. Dar el otro era mandarles a una
      // puerta cerrada el primer día.
      //
      // 🔴 Y LLEVA EL CÓDIGO DENTRO. Sin él, el enlace es otra puerta cerrada: el grupo pide código
      // desde que se siembra, así que repartir el enlace pelado sería repartir un «no puedes entrar».
      var alta = location.origin + '/alistarse.html?per=' + esc(d.id) + MOTOR_EN_ENLACES +
                 (codigo ? '&codigo=' + esc(codigo) : '');
      /**
       * 🔴 EL ENLACE NO SE ENSEÑA: SE COPIA. Era una URL larguísima a la vista, en monoespaciada,
       * que nadie va a teclear ni leer — solo copiar. Enseñarla ocupaba media tarjeta y encima
       * invitaba a seleccionarla a mano y dejarse un trozo. El código SÍ se enseña, y grande,
       * porque ese sí se dicta en voz alta en clase.
       *
       * Y el Capitán felicitando, que no es adorno: crear un grupo es el momento en que el sistema
       * pasa a existir, y hasta ahora se despachaba con un «Grupo creado» de recibo de compra.
       */
      app.innerHTML = '<div class="card bien exito"><div class="exito-cap">' +
          '<img src="assets/img/capitan/pulgar.png" alt="" loading="lazy">' +
          '<div><div class="eyebrow teal">Comandante</div>' +
          '<h3>¡Grupo listo, Capitán!</h3>' +
          '<p><b>' + esc(d.nombre) + '</b> está sembrado entero: los retos con sus insignias, los ocho ' +
          'planetas, la tienda y el álbum. No queda nada por configurar.</p></div></div>' +
        (codigo
          ? '<p class="small muted" style="margin-bottom:2px">Código de acceso de la clase:</p>' +
            '<p class="codigo-grande">' + esc(codigo) + '</p>' +
            '<p class="small muted">Se dicta en voz alta el primer día, para quien llegue sin el enlace.</p>'
          : '') +
        '<div class="exito-acciones">' +
        '<button class="btn primary grande" id="c-copiar" data-url="' + esc(alta) + '">' +
          '🔗 Copiar el enlace de invitación</button>' +
        '<p class="small muted">Es lo único que tienes que repartir. Ya lleva el código dentro.</p>' +
        '</div>' +
        '<p><a class="btn" href="consola.html?per=' + esc(d.id) + '">Ir a la consola</a> ' +
        '<a class="btn min" href="crear.html">Crear otro</a></p></div>';

      var bc = document.getElementById("c-copiar");
      bc.onclick = function () {
        var url = bc.getAttribute("data-url");
        var ok = function () {
          bc.textContent = "✓ Copiado";
          setTimeout(function () { bc.textContent = "🔗 Copiar el enlace de invitación"; }, 1800);
        };
        // 🔴 Con respaldo: `navigator.clipboard` no existe fuera de https ni en navegadores viejos,
        // y quedarse sin copiar el único enlace que hay que repartir sería el peor final posible.
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(ok).catch(function () { aMano(url, ok); });
        } else aMano(url, ok);
      };
    } catch (e) {
      boton.disabled = false; paso.textContent = "";
      aviso("No se ha podido crear: " + esc(e.message), "malo");
    }
  }

  function aMano(txt, ok) {
    try {
      var a = document.createElement("textarea");
      a.value = txt; a.style.position = "fixed"; a.style.opacity = "0";
      document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove(); ok();
    } catch (e) { prompt("Copia este enlace:", txt); }
  }

  // ---------------------------------------------------------------- arranque
  /**
   * MODO DEMO (?demo=1). Igual que el de la sala del docente y el de los tickets, y por los mismos
   * dos motivos: enseñar esta pantalla a alguien sin darle acceso a crear nada de verdad, y que las
   * capturas de «Cómo se hace» se puedan REGENERAR con un comando.
   *
   * 🔴 Lo segundo no es comodidad. Una captura es una foto: si la pantalla cambia y la foto no, el
   * tutorial miente en silencio. Las capturas de la hoja de cálculo se sacaron a mano conduciendo un
   * navegador con sesión, y por eso envejecieron sin que nadie se enterara. Esta no puede heredar
   * ese problema.
   *
   * Pinta el formulario de verdad —el mismo código, sin una rama aparte que pudiera divergir— y solo
   * desarma el botón de crear.
   */
  var DEMO = new URLSearchParams(location.search).get("demo") === "1";

  /** No eres referente: se dice con claridad y se le manda a donde SÍ tiene cosas que hacer. */
  function pintarSinPermiso(ps) {
    app.innerHTML = '<div class="card"><h3>Esto lo hace tu profe referente</h3>' +
      '<p class="lead">Crear un grupo —con su calendario, sus retos y su código— es cosa de quien ' +
      'coordina la asignatura. Tú ya tienes ' + (ps.length === 1 ? 'tu grupo' : 'tus ' + ps.length + ' grupos') +
      ' en el puesto de mando.</p>' +
      '<p class="small muted">Si necesitas un grupo nuevo, pídeselo: lo crea en un minuto y te añade ' +
      'al equipo con este mismo correo.</p>' +
      '<p><a class="btn primary" href="consola.html">🎛️ Ir a mis grupos</a></p></div>';
  }

  function arrancar() {
    MOTOR = window.SG.MOTOR;
    if (DEMO) {
      YO = { correo: "referente@ejemplo.es", nombre: "Profe Referente" };
      pintar();
      var b = $("#btn-crear");
      if (b) { b.disabled = true; b.textContent = "Crear el grupo (apagado en la demostración)"; }
      return;
    }
    /**
     * 🔴 CREAR UN GRUPO ES COSA DEL REFERENTE. Y hasta hoy no lo comprobaba NADIE: Norberto entró
     * como profe normal y pudo llegar hasta el botón. «Me permite crear GRUPO, NO puede ser.»
     *
     * Esto es la puerta de la pantalla, no la seguridad: la de verdad la ponen las reglas de
     * Firestore. Pero un botón que no deberías poder pulsar es una invitación a romper algo sin
     * querer — y sembrar un grupo entero de más, con su código y sus enlaces, no se deshace solo.
     *
     * Quien aún no lleva ningún grupo SÍ pasa: es el caso del referente que estrena el sistema y
     * todavía no tiene nada que le acredite. Ahí no hay nada que proteger.
     */
    var mirar = function (u) {
      YO = u;
      if (!YO) return pintarPuerta();
      MOTOR.misPERs(YO.correo).then(function (ps) {
        if (!ps.length || ps.some(function (p) { return p.soyReferente; })) return pintar();
        pintarSinPermiso(ps);
      }).catch(function () { pintar(); });   // si no se puede comprobar, que no se quede bloqueado
    };
    MOTOR.sesion().then(mirar);
    document.addEventListener("sg:sesion", function (e) { mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
