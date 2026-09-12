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
  var MOTOR = null;
  // `?embed=1` para meterlo dentro del propio Genially en vez de enlazar fuera: quita cabecera,
  // menú y pie, y deja solo el botón. Lo mismo que ya hacen tickets.html y embed.html.
  // 🔴 La clase va en el BODY, no en el html: así está escrita la hoja de estilos desde el principio
  // (`body.embed .nav{display:none}`). Ponerla en el otro sitio no da error, simplemente no hace nada.
  if (new URLSearchParams(location.search).get("embed") === "1")
    document.body.classList.add("embed");

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
   * cuando solo se recomienda), respeta los tres al día y guarda lo entregado donde lo lee el docente.
   */
  function enlaceValido(v) { return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(String(v || "").trim()); }
  function deHoy(ficha) {
    var hoy = new Date(), n = 0, S = ficha.missionTimestamps || {};
    hoy.setHours(0, 0, 0, 0);
    Object.keys(S).forEach(function (k) {
      if (!/^[ABXS]\d/.test(String(k).split("__").pop())) return;   // los hitos (H…) van solos
      var l = S[k], u = Array.isArray(l) ? l[l.length - 1] : l;
      if (u && new Date(u) >= hoy) n++;
    });
    return n;
  }
  function pedirEnlace(g, m, obligatorio, aviso) {
    tarjeta('<h3>' + esc(m.title) + '</h3>' +
      '<p>' + (obligatorio ? 'Este reto necesita <b>el enlace</b> de lo que has hecho —tu Bitácora, el vídeo, ' +
        'el juego…—. Así tu Comandante puede verlo, y enseñarlo en clase si es bueno.'
        : 'Si tienes <b>el enlace</b> de lo que has hecho, pégalo: tu Comandante lo verá.') + '</p>' +
      (aviso ? '<p class="malo">' + aviso + '</p>' : '') +
      '<p><input id="v-enlace" type="url" inputmode="url" autocomplete="off" class="v-enlace" placeholder="https://…"></p>' +
      '<p><button class="btn primary grande" id="v-ok">✅ Registrar el reto</button></p>');
    var i = document.querySelector("#v-enlace"), b = document.querySelector("#v-ok");
    b.onclick = function () {
      var v = i.value.trim();
      if (obligatorio && !enlaceValido(v)) { i.classList.add("falta"); i.focus(); return; }
      if (v && !enlaceValido(v)) return pedirEnlace(g, m, obligatorio, "Eso no parece un enlace: debería tener un dominio, como padlet.com/…");
      registrar(g, v || "", true);
    };
    i.focus();
  }

  async function registrar(g, enlace, yaPedido) {
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
    var TOPE = Number(window.SG_TOPE_DIA || 0), EV = (window.SG_EVIDENCIA || {})[RETO] || "";
    if (TOPE && deHoy(g.ficha) >= TOPE)
      return fallo("Hoy ya has registrado " + TOPE + " retos. Vuelve mañana: así cada reto cuenta de verdad.");
    if (!yaPedido && (EV === "obligatoria" || EV === "recomendada")) return pedirEnlace(g, m, EV === "obligatoria");
    try {
      await M.llamar("completeMission", { projectId: g.id, missionId: mision.id, studentProfileId: g.ficha.id });
      if (enlace) {
        // la evidencia, donde la lee el docente (la misma ruta que usa la Nave)
        try {
          await M.setDoc(M.doc(M.db, "mission_deliveries", mision.id + "__" + g.ficha.id), {
            projectId: g.id, missionId: mision.id, studentProfileId: g.ficha.id, userId: g.ficha.userId,
            stargateReto: RETO, enlace: enlace, createdAt: Date.now() });
        } catch (e) { /* el reto ya está: perder el enlace es molesto, perder el reto sería injusto */ }
      }
      tarjeta('<h3>✅ Registrado</h3><p><b>' + esc(m.title) + '</b></p>' +
        '<p>+' + (m.points || 0) + ' xp · +' + (m.coinsReward || 0) + ' créditos</p>' +
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
