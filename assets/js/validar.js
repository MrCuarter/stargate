/**
 * STARGATE · VALIDAR UN RETO DESDE FUERA
 *
 * Un botón al final de un Genially, de un escape room o de un juego. Quien lo pulsa entra con su
 * cuenta y el reto queda registrado. Nada más.
 *
 * 🔴 Lo que hace especial a esta página, y la razón de que exista en vez de usar el enlace que ya
 * trae GamificaPro: el enlace NO lleva el grupo. Lleva el reto —`validar.html?reto=S7`— y el grupo
 * lo pone la persona que pulsa, porque la buscamos por su cuenta. Pepito del grupo de enero y
 * Mariana del de septiembre pulsan EL MISMO BOTÓN y cada uno valida en el suyo.
 *
 * Esto es lo que permite montar los Geniallys una vez y no volver a tocarlos, aunque STARGATE se
 * repita tres veces al año. El enlace de GamificaPro apunta a un documento concreto, y ese
 * documento pertenece a un grupo: cada convocatoria habría que rehacer los enlaces uno a uno.
 */
(function () {
  "use strict";
  var app = document.querySelector("#validar-app");
  if (!app) return;
  var RETO = new URLSearchParams(location.search).get("reto") || "";
  /**
   * 15-sep · LA LLAVE DEL ESCAPE UNI (S7). El botón del final del escape trae `&llave=…`: se deja en el navegador como si
   * se hubiera escrito (secreto.js compara solo su huella) y se quita de la barra de direcciones, que no se comparta.
   */
  var LLAVE = new URLSearchParams(location.search).get("llave") || "";
  if (LLAVE) {
    try { localStorage.setItem("sgSecreto:" + RETO, JSON.stringify({ t: LLAVE, f: Date.now() })); } catch (e) {}
    try { history.replaceState(null, "", location.pathname + "?reto=" + encodeURIComponent(RETO) +
                               (new URLSearchParams(location.search).get("embed") === "1" ? "&embed=1" : "")); } catch (e) {}
  }
  var MOTOR = null;
  // `?embed=1` para meterlo dentro del propio Genially en vez de enlazar fuera: quita cabecera,
  // menú y pie, y deja solo el botón. Lo mismo que ya hacen tickets.html y embed.html.
  // 🔴 La clase va en el BODY, no en el html: así está escrita la hoja de estilos desde el principio
  // (`body.embed .nav{display:none}`). Ponerla en el otro sitio no da error, simplemente no hace nada.
  if (new URLSearchParams(location.search).get("embed") === "1")
    document.body.classList.add("embed", "embed-caja");   // 15-sep · caja suelta en el Genially: sin fondo

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function tarjeta(h) { app.innerHTML = '<div class="card validar">' + h + "</div>"; }

  function nombreDelReto(cat) {
    var todos = (cat.retos.REGULAR || []).concat(cat.retos.PUA || []);
    var r = todos.filter(function (x) { return x.id === RETO; })[0];
    return r ? r.titulo : RETO;
  }

  function puerta() {
    tarjeta('<h3>' + esc(nombreDelReto(window.SG_CATALOGO)) + '</h3>' +
      '<p>Entra con la cuenta con la que te alistaste y tu reto quedará registrado.</p>' +
      '<p><button class="btn primary grande btn-google" id="v-entrar">' +
      ((window.SG && window.SG.LOGO_G) || "") +
      '<span>Iniciar sesión con Google</span></button></p>' +
      '<p class="small muted">Solo se comprueba quién eres. No se publica nada.</p>');
    document.querySelector("#v-entrar").onclick = function () {
      MOTOR.entrar().catch(function (e) { fallo("No he podido entrar: " + e.message); });
    };
  }

  function fallo(txt, extra) {
    tarjeta('<h3>No ha podido ser</h3><p class="malo">' + esc(txt) + '</p>' +
      (extra || '<p class="small">Si crees que es un error, díselo a tu profesor o profesora.</p>'));
  }

  async function validar(yo) {
    tarjeta("<h3>Un momento…</h3><p>Buscando tu ficha.</p>");
    var M = MOTOR;
    // Mi ficha (o mis fichas: alguien puede repetir el máster o estar en dos convocatorias).
    var mias = await M.getDocs(M.query(M.collection(M.db, "student_profiles"),
                                       M.where("userId", "==", yo.uid)));
    var fichas = mias.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    if (!fichas.length) {
      fallo("No encuentro tu ficha con esta cuenta.",
        '<p>¿Te alistaste con otro correo? <button class="btn min" id="v-otra">Probar con otra cuenta</button></p>' +
        '<p class="small">Si aún no te has alistado, hazlo primero desde el enlace que te dio tu profe.</p>');
      return conectarOtra();
    }

    // Solo los grupos de STARGATE: alguien puede tener también ficha en otro proyecto de la
    // plataforma, y ese no tiene nada que ver con este botón.
    var grupos = [];
    for (var i = 0; i < fichas.length; i++) {
      var p = await M.getDoc(M.doc(M.db, "projects", fichas[i].projectId));
      if (p.exists() && (p.data().stargate || {}).version)
        grupos.push({ ficha: fichas[i], id: p.id, nombre: p.data().name });
    }
    if (!grupos.length) return fallo("Tu cuenta no está en ningún grupo de STARGATE.");
    if (grupos.length > 1) return elegir(grupos);
    return registrar(grupos[0]);
  }

  function conectarOtra() {
    var b = document.querySelector("#v-otra");
    if (b) b.onclick = function () { MOTOR.salir().then(function () { puerta(); }); };
  }

  // Estar en dos grupos a la vez es raro, pero pasa (quien repite el máster). Preguntar es mejor
  // que acertar por sorteo: si se valida en el grupo equivocado, el reto queda mal puesto y hay que
  // deshacerlo a mano.
  function elegir(grupos) {
    tarjeta("<h3>¿En qué grupo?</h3><p>Estás en más de uno. Elige dónde registrar este reto.</p>" +
      grupos.map(function (g, i) {
        return '<p><button class="btn" data-g="' + i + '">' + esc(g.nombre) + "</button></p>";
      }).join(""));
    Array.prototype.forEach.call(app.querySelectorAll("[data-g]"), function (b) {
      b.onclick = function () { registrar(grupos[Number(b.getAttribute("data-g"))]); };
    });
  }

  /**
   * 🔴 13-sep · EL TOPE DIARIO Y EL ENLACE OBLIGATORIO, TAMBIÉN AQUÍ. Este enlace se pega en los
   * Geniallys y llamaba a `completeMission` directamente: se saltaba las dos reglas que la Nave ya
   * aplica y ni siquiera guardaba la evidencia. Un botón «Validar B1» registraba el reto sin enlace.
   * Ahora pide el enlace AHÍ MISMO, dentro de la presentación, cuando el reto lo exige (y lo ofrece
   * cuando solo se recomienda), respeta el tope de la semana y guarda lo entregado donde lo lee el docente.
   */
  function enlaceValido(v) { return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(String(v || "").trim()); }
  // 17-sep · por SEMANA (de lunes a domingo), sin los que validó su docente a mano
  function deLaSemana(ficha) {
    var hoy = new Date(), n = 0, S = ficha.missionTimestamps || {}, otorg = ficha.stargateOtorgados || [];
    hoy.setHours(0, 0, 0, 0); hoy.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    Object.keys(S).forEach(function (k) {
      if (otorg.indexOf(k) >= 0) return;
      if (!/^[ABXS]\d/.test(String(k).split("__").pop())) return;   // los hitos (H…) van solos
      var l = S[k], u = Array.isArray(l) ? l[l.length - 1] : l;
      if (u && new Date(u) >= hoy) n++;
    });
    return n;
  }
  function pedirEnlace(g, m, obligatorio, aviso) {
    // 15-sep (noche) · los retos que se responden en el propio reto: su reflexión, aquí también (con su mínimo)
    var RF = (window.SG_REFLEXION || {})[RETO] || null, antesRF = (document.querySelector("#v-rf") || {}).value || "";
    tarjeta('<h3>' + esc(m.title) + '</h3>' +
      (RF ? '<p class="rf-caja"><label class="rf-et" for="v-rf">✍️ ' + esc(RF.pide) + '</label>' +
        '<textarea id="v-rf" class="rf-txt" rows="5" maxlength="2000" placeholder="Escríbelo aquí mismo: al menos ' + RF.min + ' letras.">' + esc(antesRF) + '</textarea>' +
        '<span class="rf-pie"><span class="rf-n" data-rfn-min="' + RF.min + '">' + antesRF.trim().length + ' / ' + RF.min + '</span>' +
        '<span class="rf-aviso">👀 La leerá tu tripulación en este reto y puede salir en clase con tu alias, nunca con tu nombre.</span></span></p>' : '') +
      '<p>' + (obligatorio ? 'Este reto necesita <b>el enlace</b> de lo que has hecho —tu Bitácora, el vídeo, ' +
        'el juego…—. Así tu Comandante puede verlo, y enseñarlo en clase si es bueno.'
        : 'Si tienes <b>el enlace</b> de lo que has hecho, pégalo: tu Comandante lo verá.') + '</p>' +
      (aviso ? '<p class="malo">' + aviso + '</p>' : '') +
      '<p class="ev-par"><input id="v-enlace" type="url" inputmode="url" autocomplete="off" class="v-enlace" placeholder="https://…">' +
      // 15-sep · el «+» para un segundo enlace, como en la Nave
      '<button type="button" class="ev-mas" id="v-mas" title="Añadir un segundo enlace" aria-label="Añadir un segundo enlace">+</button>' +
      '<input id="v-enlace2" type="url" inputmode="url" autocomplete="off" class="v-enlace ev2" placeholder="Otro enlace (opcional)" hidden></p>' +
      '<p><button class="btn primary grande" id="v-ok">✅ Registrar el reto</button></p>');
    var i = document.querySelector("#v-enlace"), i2 = document.querySelector("#v-enlace2"), b = document.querySelector("#v-ok"), tr = document.querySelector("#v-rf");
    document.querySelector("#v-mas").onclick = function () { i2.hidden = false; this.hidden = true; i2.focus(); };
    if (tr) tr.oninput = function () { var n = tr.parentNode.querySelector(".rf-n"), l = tr.value.trim().length;
      tr.classList.remove("falta"); if (n) { n.textContent = l + " / " + RF.min; n.classList.toggle("ok", l >= RF.min); } };
    b.onclick = function () {
      var v = i.value.trim(), v2 = i2.value.trim();
      if (RF && tr.value.trim().length < RF.min) { tr.classList.add("falta"); tr.focus(); return; }
      if (obligatorio && !enlaceValido(v)) { i.classList.add("falta"); i.focus(); return; }
      if (v && !enlaceValido(v)) return pedirEnlace(g, m, obligatorio, "Eso no parece un enlace: debería tener un dominio, como padlet.com/…");
      if (v2 && !enlaceValido(v2)) { i2.classList.add("falta"); i2.focus(); return; }
      registrar(g, [v, v2].filter(Boolean).join(" "), true, tr ? tr.value.trim() : "");
    };
    (tr || i).focus();
  }

  /**
   * 🔴 15-sep · UN RETO SECRETO (S7) PIDE SU PALABRA, también aquí: sin ella, este enlace lo regalaba
   * a quien lo copiara. Si viene del enigma (fragmento.html la deja en el navegador), se comprueba sola.
   */
  function pedirPalabra(g, m, aviso) {
    var traida = !aviso && window.SG_SECRETO.traida(RETO);
    if (traida) {
      tarjeta("<h3>Un momento…</h3><p>Comprobando la palabra.</p>");
      return window.SG_SECRETO.comprobar(RETO, traida).then(function (ok) {
        if (ok) return alServidor(g, traida, "Esa llave no abre este reto.");
        pedirPalabra(g, m, "Esa llave no abre este reto.");
      });
    }
    tarjeta('<h3>' + esc(m.title) + '</h3>' +
      '<p>Este reto se registra al terminar el <b>Escape UNI</b>, con el botón del final. Si te han dado una llave, escríbela aquí.</p>' +
      (aviso ? '<p class="malo">' + esc(aviso) + '</p>' : '') +
      '<p><input id="v-palabra" type="text" autocomplete="off" spellcheck="false" class="v-enlace" placeholder="La llave"></p>' +
      '<p><button class="btn primary grande" id="v-ok">✅ Registrar el reto</button></p>');
    var i = document.querySelector("#v-palabra"), b = document.querySelector("#v-ok");
    i.onkeydown = function (e) { if (e.key === "Enter") b.click(); };
    b.onclick = function () {
      var v = i.value.trim(); if (!v) { i.classList.add("falta"); i.focus(); return; }
      b.disabled = true;
      window.SG_SECRETO.comprobar(RETO, v).then(function (ok) {
        if (ok) return alServidor(g, v, "Esa llave no abre este reto. Termina el Escape UNI: el botón del final lo registra solo.");
        pedirPalabra(g, m, "Esa llave no abre este reto. Termina el Escape UNI: el botón del final lo registra solo.");
      });
    };
    i.focus();

    /**
     * 🔴 18-sep · y la comprueba el SERVIDOR, que deja la marca en la ficha: sin ella, completeMission no
     * registra S7 (antes bastaba con llamarlo a mano y el escape sobraba).
     */
    function alServidor(g, texto, malo) {
      tarjeta("<h3>Un momento…</h3><p>Comprobando la palabra.</p>");
      return MOTOR.traerPalabra(g.id, RETO, texto).then(function () {
        g.palabraOk = true; return registrar(g);
      }, function (e) { pedirPalabra(g, m, String((e && e.message) || malo)); });
    }
  }

  async function registrar(g, enlace, yaPedido, reflexion) {
    tarjeta("<h3>Registrando…</h3><p>" + esc(g.nombre) + "</p>");
    var M = MOTOR;
    // 🔴 Aquí está el truco entero: la misión se busca por su identificador de STARGATE dentro del
    // grupo de quien pulsa. Por eso las misiones se siembran con `stargateId` («A1», «S7»), igual
    // en todos los grupos y en todas las convocatorias.
    var r = await M.getDocs(M.query(M.collection(M.db, "missions"),
      M.where("projectId", "==", g.id), M.where("stargateId", "==", RETO)));
    if (r.empty) return fallo("Este reto no existe en tu grupo (" + esc(RETO) + ").");
    var mision = r.docs[0], m = mision.data();
    if ((g.ficha.completedMissionIds || []).indexOf(mision.id) >= 0)
      return tarjeta('<h3>Ya lo tenías</h3><p>Este reto ya estaba registrado. No pasa nada: no se ' +
        'duplica ni se cobra dos veces.</p><p><a class="btn" href="recluta.html?per=' + esc(g.id) + '">Ver mi Nave</a></p>');
    var TOPE = Number(window.SG_TOPE_SEMANA || 0), EV = (window.SG_EVIDENCIA || {})[RETO] || "";
    if (TOPE && deLaSemana(g.ficha) >= TOPE)
      return fallo("Esta semana ya has registrado " + TOPE + " retos. El lunes tienes tres huecos más.");
    if (window.SG_SECRETO && window.SG_SECRETO.esSecreto(RETO) && !g.palabraOk) return pedirPalabra(g, m);
    var RF = (window.SG_REFLEXION || {})[RETO];
    if (!yaPedido && (EV === "obligatoria" || EV === "recomendada" || RF)) return pedirEnlace(g, m, EV === "obligatoria");
    try {
      await M.llamar("completeMission", { projectId: g.id, missionId: mision.id, studentProfileId: g.ficha.id });
      if (window.SG_SECRETO) window.SG_SECRETO.olvidar(RETO);   // la palabra traída, fuera (el ordenador puede ser compartido)
      if (enlace) {
        // la evidencia, donde la lee el docente (la misma ruta que usa la Nave)
        try {
          await M.setDoc(M.doc(M.db, "mission_deliveries", mision.id + "__" + g.ficha.id), {
            projectId: g.id, missionId: mision.id, studentProfileId: g.ficha.id, userId: g.ficha.userId,
            stargateReto: RETO, enlace: enlace, createdAt: Date.now() });
        } catch (e) { /* el reto ya está: perder el enlace es molesto, perder el reto sería injusto */ }
      }
      // 15-sep (noche) · y su reflexión, donde la ve su tripulación (si falla, se retoma desde la Nave)
      var sinRF = false;
      if (RF && reflexion && M.guardarReflexion) {
        try { await M.guardarReflexion(g.id, RETO, g.ficha.id, reflexion, enlace || ""); } catch (e) { sinRF = true; }
      }
      tarjeta('<h3>✅ Registrado</h3><p><b>' + esc(m.title) + '</b></p>' +
        '<p>+' + (m.points || 0) + ' xp · +' + (m.coinsReward || 0) + ' créditos</p>' +
        (sinRF ? '<p class="malo">Tu reflexión no se ha guardado: ábrela en tu Nave (en el propio reto) y pulsa «Guardar mi reflexión».</p>' : '') +
        '<p><a class="btn grande" href="recluta.html?per=' + esc(g.id) + '">Ver mi Nave</a></p>');
    } catch (e) {
      fallo(e.message || "El servidor no ha aceptado el registro.");
    }
  }

  function arrancar() {
    MOTOR = window.SG.MOTOR;
    if (!RETO) return fallo("A este enlace le falta el reto. Debería acabar en «?reto=A1».");
    // 🔴 Una sola validación por carga: la sesión guardada llega por la promesa Y por el aviso, y dos
    // validaciones a la vez registraban dos veces (el servidor no cobraba doble, pero la pantalla
    // parpadeaba entre «Registrando…» y «Ya lo tenías»).
    var enMarcha = false;
    var una = function (yo) { if (!yo || enMarcha) return; enMarcha = true; validar(yo).catch(function (e) { fallo(e.message); }); };
    MOTOR.sesion().then(function (yo) { yo ? una(yo) : puerta(); });
    document.addEventListener("sg:sesion", function (e) { una(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
