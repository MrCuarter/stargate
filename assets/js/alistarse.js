/**
 * STARGATE · ALISTARSE
 *
 * Lo que hasta hoy hacía el formulario de Google, en una página. Se entra con la cuenta, se
 * rellenan los datos una vez y ya está: no hay tres formularios, ni enlaces distintos, ni un correo
 * escrito a mano que luego no coincide con el de la Nave.
 *
 * 🔴 Dos decisiones que no son estéticas:
 *
 * 1. El correo NO se escribe: lo dice Google. El fallo más repetido del sistema viejo era teclear
 *    un correo distinto al de la sesión y quedarse con dos fichas, o con ninguna.
 *
 * 2. Se elige COMANDANTE, no escuadrón. El primer día lo único que conoce el alumnado es el nombre
 *    de quien le da clase; preguntarle por un escuadrón del que no ha oído hablar sería pedirle que
 *    adivine. El escuadrón viene detrás, con su nombre y su lema, y enterarse es una recompensa.
 */
(function () {
  "use strict";
  var app = document.querySelector("#alistarse-app");
  if (!app) return;
  var PER = new URLSearchParams(location.search).get("per") || "";
  var MOTOR = null, YO = null, PROY = null, sel = { n: 1, v: "f" };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function tarjeta(h) { app.innerHTML = '<div class="card">' + h + "</div>"; }
  function fallo(t) { tarjeta("<h3>No ha podido ser</h3><p class='malo'>" + esc(t) + "</p>"); }

  function puerta() {
    // 🔴 Primero la cuenta, después el grupo. Firestore no deja leer NADA sin sesión —ni el nombre
    // del grupo—, así que preguntar por el grupo antes de entrar devolvía «permisos insuficientes»
    // y la página se moría con un error que no era culpa de nadie. Se entra y luego se mira.
    tarjeta('<h3>Alístate en tu grupo</h3>' +
      '<p>Entra con tu cuenta de Google. Puede ser cualquiera —no hace falta que sea la de la ' +
      'universidad—, pero <b>usa siempre la misma</b>: es la que te reconoce la Nave.</p>' +
      '<p><button class="btn grande" id="a-entrar">Entrar con Google</button></p>' +
      '<p class="small muted">Solo pedimos tu nombre y tu correo. Puedes leer la ' +
      '<a href="privacidad.html">política de privacidad</a>.</p>');
    document.querySelector("#a-entrar").onclick = function () {
      MOTOR.entrar().catch(function (e) { fallo(e.message); });
    };
  }

  function docentes() { return ((PROY.stargate || {}).docentes || []); }

  // 🔴 El interruptor de motor tiene que sobrevivir al salto a la Nave. Sin él, quien se alista con
  // ?motor=firestore aterriza en la Nave del motor VIEJO y se encuentra un «PER no encontrado»
  // después de haberlo hecho todo bien.
  function naveUrl() {
    var q = new URLSearchParams(location.search);
    var m = q.get("motor");
    return "recluta.html?per=" + encodeURIComponent(PER) + (m ? "&motor=" + encodeURIComponent(m) : "");
  }

  function formulario() {
    var S = PROY.stargate || {};
    app.innerHTML =
      '<div class="card cuenta"><p>Entras como <b>' + esc(YO.nombre || YO.correo) + '</b> · ' +
      esc(YO.correo) + ' <button class="btn min" id="a-salir">No soy yo</button></p></div>' +
      '<div id="a-aviso" class="aviso" hidden></div>' +

      '<div class="card"><h3>1 · Quién eres</h3>' +
      // 🔴 Nombre y apellidos POR SEPARADO. Partirlos a máquina en español es imposible («José Luis
      // García de la Torre»: ¿dónde acaba el nombre?), así que se pregunta dos veces. Y son datos
      // personales: no salen nunca del expediente privado.
      '<label>Nombre<input id="a-nombre" autocomplete="given-name" value="' +
        esc((YO.nombre || "").split(" ")[0]) + '"></label>' +
      '<label>Apellidos<input id="a-apellidos" autocomplete="family-name" value="' +
        esc((YO.nombre || "").split(" ").slice(1).join(" ")) + '"></label>' +
      '<p class="small muted">Tu nombre y tu correo solo los ve tu profesorado. En el tablero sales ' +
      'con tu alias.</p>' +
      '<label>Alias de recluta <i>(el que verá la clase)</i><input id="a-alias" maxlength="24" ' +
        'autocomplete="off" placeholder="Vega, Orion, Nix…"></label></div>' +

      '<div class="card"><h3>2 · Tu Comandante</h3>' +
      '<p class="small">Quien te da clase. Con esto sabrá seguirte, y además te llevará a tu escuadrón.</p>' +
      (docentes().length
        ? '<div class="comandantes">' + docentes().map(function (d, i) {
            return '<label class="comandante"><input type="radio" name="cmd" value="' + i + '">' +
                   '<b>' + esc(d.nombre) + '</b></label>'; }).join("") + "</div>"
        : '<p class="muted">Este grupo aún no tiene profesorado asignado. Puedes seguir y elegirlo después.</p>') +
      '</div>' +

      '<div class="card"><h3>3 · Tu personaje</h3>' +
      '<p class="small">Evoluciona contigo: cambia de aspecto al subir de rango. Se elige una vez.</p>' +
      '<div class="avatares" id="a-avatares"></div></div>' +

      '<div class="card"><h3>4 · Tu Bitácora</h3>' +
      '<p class="small">El enlace a tu cuaderno de bitácora (tu ePortfolio). Si todavía no lo tienes, ' +
      'déjalo en blanco y lo añades cuando quieras desde tu Nave.</p>' +
      '<label>Enlace de tu Bitácora<input id="a-bitacora" placeholder="https://…" autocomplete="off"></label>' +
      '<label>Dos líneas sobre tu personaje <i>(opcional, las ve la clase)</i>' +
        '<textarea id="a-bio" maxlength="280" rows="3"></textarea></label></div>' +

      '<div class="card"><p><button class="btn grande" id="a-enviar">Alistarme</button></p>' +
      '<div id="a-paso" class="small muted"></div></div>';

    document.querySelector("#a-salir").onclick = function () { MOTOR.salir(); };
    pintarAvatares();
    document.querySelector("#a-enviar").onclick = alistar;
    var r = app.querySelector('input[name="cmd"]'); if (r) r.checked = true;
  }

  function pintarAvatares() {
    var h = "";
    for (var n = 1; n <= 7; n++) {
      ["f", "m"].forEach(function (v) {
        h += '<button type="button" class="av" data-n="' + n + '" data-v="' + v + '">' +
             '<img loading="lazy" alt="Personaje ' + n + '" src="assets/img/avatares/evo/p' + n + v + '_r1.jpg"></button>';
      });
    }
    var caja = document.querySelector("#a-avatares");
    caja.innerHTML = h;
    Array.prototype.forEach.call(caja.children, function (b) {
      b.onclick = function () {
        sel = { n: Number(b.getAttribute("data-n")), v: b.getAttribute("data-v") };
        Array.prototype.forEach.call(caja.children, function (x) { x.classList.remove("elegido"); });
        b.classList.add("elegido");
      };
    });
    caja.children[0].classList.add("elegido");
  }

  function aviso(t) {
    var d = document.querySelector("#a-aviso");
    d.innerHTML = esc(t); d.className = "aviso malo"; d.hidden = !t;
    if (t) d.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function alistar() {
    var nombre = document.querySelector("#a-nombre").value.trim();
    var apellidos = document.querySelector("#a-apellidos").value.trim();
    var alias = document.querySelector("#a-alias").value.trim();
    if (!nombre || !apellidos) return aviso("Faltan tu nombre y tus apellidos.");
    if (!alias) return aviso("Te falta el alias: es con lo que sales en el tablero.");
    var elegido = app.querySelector('input[name="cmd"]:checked');
    var comandante = elegido ? docentes()[Number(elegido.value)] : null;
    aviso("");
    var boton = document.querySelector("#a-enviar"); boton.disabled = true;
    var paso = document.querySelector("#a-paso");
    try {
      paso.textContent = "Abriendo tu ficha…";
      var escuadron = await MOTOR.alistar(PER, {
        alias: alias, nombre: nombre, apellidos: apellidos, correo: YO.correo,
        comandante: comandante ? comandante.nombre : "",
        avatar: { tipo: "evo", n: sel.n, v: sel.v, url: "" },
        bitacora: document.querySelector("#a-bitacora").value.trim(),
        bio: document.querySelector("#a-bio").value.trim()
      }, function (t) { paso.textContent = t; });
      bienvenida(alias, comandante, escuadron);
    } catch (e) {
      boton.disabled = false; paso.textContent = "";
      aviso(e.message || "El servidor no ha aceptado el alta.");
    }
  }

  // El momento que justifica todo lo anterior: enterarte de a qué escuadrón perteneces.
  function bienvenida(alias, comandante, escuadron) {
    tarjeta('<h3>Estás dentro, ' + esc(alias) + '</h3>' +
      (escuadron
        ? (escuadron.imageUrl
            ? '<img class="emblema" src="' + esc(escuadron.imageUrl) + '" alt="Emblema de ' +
              esc(escuadron.name) + '" width="220" height="220">'
            : '') +
          '<p class="lead">Tu Comandante es <b>' + esc(comandante ? comandante.nombre : "") + '</b>, ' +
          'así que te unes a <b>' + esc(escuadron.name) + '</b>.</p>' +
          '<p class="lema">«' + esc(escuadron.lema || "") + '»</p>' +
          '<p class="small muted">' + esc(escuadron.origen || "") + '</p>'
        : '<p class="lead">Tu ficha está abierta.</p>') +
      '<p>Insignia de <b>Reclutamiento</b> · +100 xp · +20 créditos ◈</p>' +
      '<p><a class="btn grande" href="' + naveUrl() + '">Entrar en mi Nave</a></p>');
  }

  async function arrancar() {
    MOTOR = window.SG.MOTOR;
    if (!PER) return fallo("A este enlace le falta el grupo. Debería acabar en «?per=…».");

    var mirar = async function (u) {
      YO = u;
      if (!YO) return puerta();
      tarjeta("<h3>Un momento…</h3><p>Buscando tu grupo.</p>");
      try {
        var p = await MOTOR.getDoc(MOTOR.doc(MOTOR.db, "projects", PER));
        if (!p.exists()) return fallo("No existe el grupo «" + PER + "». Comprueba el enlace que te dieron.");
        PROY = Object.assign({ id: p.id }, p.data());
      } catch (e) { return fallo("No he podido leer tu grupo. Prueba a recargar la página."); }
      // Si ya se alistó, no se le vuelve a preguntar: derecho a su Nave. Alistarse dos veces era el
      // camino más corto a tener dos fichas con la misma persona dentro.
      var mias = await MOTOR.getDocs(MOTOR.query(MOTOR.collection(MOTOR.db, "student_profiles"),
        MOTOR.where("projectId", "==", PER), MOTOR.where("userId", "==", YO.uid)));
      if (!mias.empty) return location.replace(naveUrl());
      formulario();
    };
    /**
     * MODO DEMO (?demo=1). El mismo formulario, con un grupo de mentira y sin escribir nada.
     *
     * 🔴 Existe por las capturas de «Cómo se hace». Una captura que no se puede rehacer con un
     * comando acaba mintiendo el día que cambie la pantalla — ya pasó con las de la hoja de cálculo.
     * Y de paso sirve para enseñarle el alistamiento a una clase sin que nadie se aliste de verdad.
     */
    if (new URLSearchParams(location.search).get("demo") === "1") {
      YO = { correo: "recluta@ejemplo.es", nombre: "Recluta" };
      PROY = { id: PER, name: "CLASE DEMO", stargate: { docentes: [
        { nombre: "Mr Cuarter", rol: "referente" },
        { nombre: "Capitana Vega", rol: "docente" },
        { nombre: "Comandante Orion", rol: "docente" } ] } };
      formulario();
      var env = document.getElementById("a-enviar");
      if (env) { env.disabled = true; env.textContent = "Alistarme (apagado en la demostración)"; }
      return;
    }
    MOTOR.sesion().then(mirar);
    document.addEventListener("sg:sesion", function (e) { mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
