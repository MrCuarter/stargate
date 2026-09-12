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

  /**
   * EL CÓDIGO DE ACCESO.
   *
   * 🔴 Lo que esto protege, dicho sin adornos: que alguien que se tropiece con el enlace —o a quien
   * se lo reenvíen— se aliste sin más. NO es seguridad: el código vive en el documento del grupo y
   * quien sepa buscarlo lo encuentra. Es una puerta con pestillo, no una caja fuerte, y para lo que
   * pasa de verdad en un máster es exactamente lo que hace falta.
   *
   * 🔴 Y si el grupo NO tiene código, se entra como siempre. Los grupos creados antes de esto no
   * pueden quedarse sin poder alistar a nadie por una función que no existía cuando se sembraron.
   */
  function codigoDelGrupo() { return String((PROY && PROY.joinCode) || "").trim().toUpperCase(); }
  function normaliza(c) { return String(c || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function codigoCorrecto() {
    var esperado = codigoDelGrupo();
    if (!esperado) return true;
    return normaliza(new URLSearchParams(location.search).get("codigo")) === esperado;
  }

  function pedirCodigo(aviso) {
    tarjeta('<h3>El código de tu clase</h3>'
      + '<p>Para alistarte en <b>' + esc(PROY.name || PER) + '</b> hace falta el código de seis '
      + 'caracteres que te ha dado tu profesorado. Suele estar en el enlace que te pasaron, o lo '
      + 'dicen en clase.</p>'
      + (aviso ? '<p class="aviso malo">' + esc(aviso) + "</p>" : "")
      + '<label>Código<input id="a-codigo" maxlength="8" autocomplete="off" spellcheck="false" '
      + 'placeholder="ABC123" style="text-transform:uppercase;letter-spacing:.18em;font-size:1.2rem"></label>'
      + '<p><button class="btn grande" id="a-codigo-ok">Entrar</button></p>');
    var inp = document.querySelector("#a-codigo");
    var mete = function () {
      if (normaliza(inp.value) !== codigoDelGrupo()) return pedirCodigo("Ese código no es el de este grupo.");
      // Se mete en la dirección para que un F5 no vuelva a preguntarlo.
      try {
        var u = new URL(location.href); u.searchParams.set("codigo", normaliza(inp.value));
        history.replaceState(null, "", u);
      } catch (e) {}
      formulario();
    };
    document.querySelector("#a-codigo-ok").onclick = mete;
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") mete(); });
    inp.focus();
  }

  function formulario() {
    var S = PROY.stargate || {};
    app.innerHTML =
      '<div class="card cuenta"><p>Entras como <b>' + esc(YO.nombre || YO.correo) + '</b> · ' +
      esc(YO.correo) + ' <button class="btn min" id="a-salir">No soy yo</button></p></div>' +
      '<div id="a-aviso" class="aviso" hidden></div>' +

      '<div class="card"><h3>1 · Quién eres</h3>' +
      // 🔴 Aquí se pide el nombre DE VERDAD, y se dice bien claro. Si alguien pone un apodo aquí, el
      // profesorado no puede ponerle la nota: la lista de clase lleva nombres reales y esta ficha es
      // lo único que las ata. Decir «solo lo ve tu profesorado» en la misma frase es lo que hace que
      // se escriba el real en vez del gracioso.
      '<p class="aclara"><b>Tu nombre real</b>, el de la lista de clase — no un apodo. ' +
      'Lo necesita tu profesorado para saber que ese avance es tuyo y ponerte la nota.<br>' +
      '<b>Solo lo ve tu profesorado.</b> Tu clase nunca ve tu nombre ni tu correo: te ve con tu alias.</p>' +
      // Nombre y apellidos POR SEPARADO. Partirlos a máquina en español es imposible («José Luis
      // García de la Torre»: ¿dónde acaba el nombre?), así que se pregunta dos veces.
      '<label>Nombre <i>(real)</i><input id="a-nombre" autocomplete="given-name" value="' +
        esc((YO.nombre || "").split(" ")[0]) + '"></label>' +
      '<label>Apellidos <i>(reales)</i><input id="a-apellidos" autocomplete="family-name" value="' +
        esc((YO.nombre || "").split(" ").slice(1).join(" ")) + '"></label>' +
      // 🔴 El botón de sugerir no es un adorno. El alias es lo primero que se pide y hay quien se
      // queda en blanco ahí mismo, con la página abierta, sin llegar a alistarse.
      '<label>Alias de recluta <i>(el que verá la clase)</i>' +
        '<span class="con-boton"><input id="a-alias" maxlength="24" autocomplete="off" ' +
          'placeholder="Vega, Orion, Nix…">' +
        '<button type="button" class="btn min" id="a-dado" title="Proponme un alias">🎲 Sugiéreme uno</button>' +
      '</span></label>' +
      '<p class="small muted">¿Sin ideas? Pulsa el dado las veces que quieras hasta que suene bien.</p></div>' +

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
      // 🔴 La rejilla sola no vale: las caras salen a 94 píxeles y no se distingue lo que se está
      // eligiendo. Al lado va el elegido EN GRANDE. Es una decisión que se toma una vez y para todo
      // el curso, así que hay que poder verla.
      '<div class="elegir-avatar">' +
        '<div class="avatares" id="a-avatares"></div>' +
        '<figure class="avatar-grande"><img id="a-avatar-grande" alt="El personaje que has elegido">' +
        '<figcaption id="a-avatar-pie">Personaje 1</figcaption></figure>' +
      '</div></div>' +

      '<div class="card"><h3>4 · Tu Bitácora</h3>' +
      '<p class="small">El enlace a tu cuaderno de bitácora (tu ePortfolio). Si todavía no lo tienes, ' +
      'déjalo en blanco y lo añades cuando quieras desde tu Nave.</p>' +
      '<label>Enlace de tu Bitácora<input id="a-bitacora" placeholder="https://…" autocomplete="off"></label>' +
      '<p class="aclara epica">Todo personaje tiene su historia. ¿Cuál es la tuya?<br>' +
      '<span>Dos líneas que leerá tu tripulación cuando pulse tu nombre en el tablero. ' +
      'Puedes dejarlo para más adelante: se cambia cuando quieras desde tu Nave.</span></p>' +
      '<label>Dos líneas sobre tu personaje <i>(opcional, las ve la clase)</i>' +
        '<textarea id="a-bio" maxlength="280" rows="3" ' +
        'placeholder="Antes de embarcar, yo…"></textarea></label></div>' +

      /**
       * 🔴 EL ÚLTIMO BOTÓN DEL ALISTAMIENTO. Era un botón gris pequeño perdido en una caja medio
       * vacía, y es el momento en que alguien entra en el juego para todo el curso. Si el sistema
       * pide épica en algún sitio, es aquí: se firma una vez y no se repite.
       */
      '<div class="card a-firmar"><p class="a-firmar-lema">Todo listo, recluta.</p>' +
      '<button class="btn epico" id="a-enviar"><span class="ep-luz"></span>' +
      '<span class="ep-txt">⚡ Embarcar</span></button>' +
      '<p class="a-firmar-pie">Se hace una sola vez. A partir de aquí, tu Nave.</p>' +
      '<div id="a-paso" class="small muted"></div></div>';

    document.querySelector("#a-salir").onclick = function () { MOTOR.salir(); };
    // El dado no repite el que ya está puesto: pulsarlo y que no cambie nada parece que está roto.
    var dado = document.querySelector("#a-dado"), campo = document.querySelector("#a-alias");
    if (dado) dado.onclick = function () {
      var banco = window.SG_ALIAS || [];
      if (!banco.length) return;
      var n = campo.value.trim(), intento = 0;
      do { n = banco[Math.floor(Math.random() * banco.length)]; } while (n === campo.value.trim() && ++intento < 8);
      campo.value = n;
      campo.focus();
    };
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
    // 🔴 El grande enseña el rango 1, el mismo que la miniatura. Enseñar el rango 4 sería más
    // vistoso y mentiría: nadie empieza pareciéndose a eso.
    var grande = document.querySelector("#a-avatar-grande"), pie = document.querySelector("#a-avatar-pie");
    function verEnGrande(n, v) {
      if (!grande) return;
      grande.src = "assets/img/avatares/evo/p" + n + v + "_r1.jpg";
      grande.alt = "Personaje " + n + (v === "f" ? " (ella)" : " (él)");
      if (pie) pie.textContent = "Personaje " + n + " · " + (v === "f" ? "ella" : "él");
    }
    Array.prototype.forEach.call(caja.children, function (b) {
      b.onclick = function () {
        sel = { n: Number(b.getAttribute("data-n")), v: b.getAttribute("data-v") };
        Array.prototype.forEach.call(caja.children, function (x) { x.classList.remove("elegido"); });
        b.classList.add("elegido");
        verEnGrande(sel.n, sel.v);
      };
    });
    caja.children[0].classList.add("elegido");
    verEnGrande(1, "f");
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

  /**
   * EL MOMENTO QUE JUSTIFICA TODO LO ANTERIOR: enterarte de a qué escuadrón perteneces.
   *
   * 🔴 Estaba resuelto como un aviso: título a la izquierda, el emblema flotando solo en medio de
   * un hueco enorme y el resto del texto debajo, desalineado con todo. Es la ÚNICA vez que alguien
   * ve esta pantalla en todo el curso, y es la que decide si esto parece un juego o un trámite.
   * Ahora: NEBULA fundida en el fondo, el Capitán dando la bienvenida en primer plano, el emblema
   * como protagonista, el texto apretado y confeti.
   */
  function bienvenida(alias, comandante, escuadron) {
    tarjeta('<div class="bv">' +
      '<img class="bv-nebula" src="assets/img/personajes/nebula.png" alt="" aria-hidden="true">' +
      '<div class="bv-fila">' +
        '<img class="bv-cap" src="assets/img/capitan/saluda.png" alt="" aria-hidden="true">' +
        '<div class="bv-txt">' +
          '<div class="eyebrow teal">Bienvenido a bordo</div>' +
          '<h3 class="bv-tit">Estás dentro, ' + esc(alias) + '</h3>' +
          (escuadron
            ? '<p class="bv-lead">Tu Comandante es <b>' + esc(comandante ? comandante.nombre : "") +
              '</b>, así que te unes a <b>' + esc(escuadron.name) + '</b>.</p>' +
              '<p class="bv-lema">«' + esc(escuadron.lema || "") + '»</p>' +
              '<p class="bv-origen">' + esc(escuadron.origen || "") + '</p>'
            : '<p class="bv-lead">Tu ficha está abierta.</p>') +
        '</div>' +
        (escuadron && escuadron.imageUrl
          ? '<img class="bv-emblema" src="' + esc(escuadron.imageUrl) + '" alt="Emblema de ' +
            esc(escuadron.name) + '">'
          : '') +
      '</div>' +
      '<div class="bv-premios"><span>🏅 Insignia de <b>Reclutamiento</b></span>' +
        '<span>+100 xp</span><span>+20 ◈</span></div>' +
      '<p class="bv-ir"><a class="btn epico" href="' + naveUrl() + '">' +
        '<span class="ep-luz"></span><span class="ep-txt">🚀 Entrar en mi Nave</span></a></p>' +
      '</div>');
    confeti();
  }

  /**
   * CONFETI. Propio y en un canvas, sin librería: esta página no carga `fiesta.js` y añadírselo
   * entero por catorce segundos de papelillos sería pagar peso en cada visita por el último paso.
   * Se quita solo al terminar, y no hace nada si el navegador pide menos movimiento.
   */
  function confeti() {
    try {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      var c = document.createElement("canvas");
      c.className = "bv-confeti";
      document.body.appendChild(c);
      var g = c.getContext("2d"), W = 0, H = 0;
      var medir = function () { W = c.width = innerWidth; H = c.height = innerHeight; };
      medir(); addEventListener("resize", medir);
      var COL = ["#37e0ec", "#ffd166", "#7ef0c8", "#ffffff", "#c79be6"];
      var P = [];
      for (var i = 0; i < 110; i++) {
        P.push({ x: Math.random() * W, y: -20 - Math.random() * H * .5,
                 vx: (Math.random() - .5) * 1.8, vy: 2 + Math.random() * 3.2,
                 w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
                 a: Math.random() * Math.PI, va: (Math.random() - .5) * .22,
                 col: COL[(Math.random() * COL.length) | 0] });
      }
      var t0 = performance.now();
      (function paso(t) {
        var vida = t - t0;
        g.clearRect(0, 0, W, H);
        var vivos = 0;
        P.forEach(function (p) {
          p.x += p.vx; p.y += p.vy; p.a += p.va; p.vy += .028;
          if (p.y < H + 40) vivos++;
          g.save(); g.translate(p.x, p.y); g.rotate(p.a);
          g.globalAlpha = Math.max(0, 1 - vida / 4200);
          g.fillStyle = p.col; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          g.restore();
        });
        if (vivos && vida < 4200) requestAnimationFrame(paso);
        else { removeEventListener("resize", medir); c.remove(); }
      })(t0);
    } catch (e) {}
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
      if (!codigoCorrecto()) return pedirCodigo();
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
      if (env) { env.disabled = true; env.innerHTML = "<span class=\"ep-txt\">Apagado en la demostración</span>"; }
      return;
    }
    MOTOR.sesion().then(mirar);
    document.addEventListener("sg:sesion", function (e) { mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
