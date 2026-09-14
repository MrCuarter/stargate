/**
 * STARGATE · EL BUZÓN DEL MANDO — «📡 Frecuencia de mando» (buzon.html) · 15-sep-2026
 *
 * Norberto: «que los docentes tengan una página sencilla donde poner recomendaciones o problemas,
 * que eso te llegue y puedas resolver casi todo sin que yo intervenga».
 *
 *   · El docente escribe un PROBLEMA, una DUDA o una IDEA. Mientras escribe, el Capitán busca entre
 *     las averías conocidas y las preguntas frecuentes (SG_AVERIAS, SG_FAQ) y le ofrece la solución
 *     al instante: lo más habitual se resuelve sin enviar nada.
 *   · Si lo envía, va con su contexto (desde qué página, qué grupo, qué semana, qué navegador) para
 *     encontrar el fallo sin preguntar. Y las respuestas llegan AQUÍ, en su hilo, no por correo.
 *   · El Mando (los vitalicios) ve todas las transmisiones, las contesta y les cambia el estado.
 *     Lo resuelve un asistente desde el servidor; esta página solo escribe y lee (motor.js · buzon*).
 */
(function () {
  "use strict";
  var app = document.getElementById("bz-app");
  var q = new URLSearchParams(location.search);
  var DESDE = String(q.get("desde") || "").slice(0, 30), PER0 = q.get("per") || "";
  var MOTOR = null, YO = null, GRUPOS = [], MANDO = false, MIOS = [], TODOS = [], FILTRO = "abiertas", SIN_LEER = false;
  var ST = { tipo: "problema", urgente: false, grupo: PER0, texto: "", sugeridas: [] };
  var VITALICIOS = ["n.cuartero.10@gmail.com", "mutecdgami@gmail.com"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function norm(t) { return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

  // ── lo que ya sabemos: las averías conocidas y las preguntas frecuentes de la guía
  var KB = (window.SG_AVERIAS || []).map(function (a) { return { id: a[0], t: a[1], claves: a[2] || [], x: a[3] }; })
    .concat((window.SG_FAQ || []).map(function (f, i) { return { id: "faq" + i, t: f[0], claves: [], x: f[1] }; }));
  var VACIAS = {};
  ("que los las del con para por una uno unos unas pero como mas este esta esto estos hay cuando porque sobre entre " +
   "tiene tengo hace hacer algo nada todo cosa pasa esta estan ser son fue muy sus mis tus les nos ahora ayer hoy solo " +
   "alguien alguno alguna donde cual quien qué cómo puedo puede quiero").split(" ").forEach(function (w) { VACIAS[w] = true; });
  function palabras(t) { return norm(t).split(/[^a-z0-9ñ]+/).filter(function (w) { return w.length > 2 && !VACIAS[w]; }); }
  function buscar(texto) {
    var n = norm(texto), tk = palabras(texto);
    if (!tk.length) return [];
    return KB.map(function (e) {
      var p = 0, tt = palabras(e.t);
      e.claves.forEach(function (c) { if (n.indexOf(c) >= 0) p += 3; });
      tk.forEach(function (w) { if (tt.indexOf(w) >= 0) p += 1; });
      return { e: e, p: p };
    }).filter(function (x) { return x.p >= 2; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 2).map(function (x) { return x.e; });
  }
  // (la batería 75 prueba el buscador sin página: por eso se expone antes de mirar si hay #bz-app)
  window.SG_BUZON = { buscar: buscar, kb: KB };
  if (!app) return;
  var CHIPS = [["lista", "🔔 No puedo pasar lista"], ["genially", "🖼️ El Genially no se actualiza"], ["entrar", "🚪 Un alumno no puede entrar"],
               ["retos", "🎯 No le suman los retos"], ["embed", "📽️ La sesión no se ve en Genially"]];
  var TIPOS = [["problema", "🛠️", "Un problema", "Qué ha pasado, dónde y con quién. Si puedes, qué esperabas que pasara."],
               ["duda", "❓", "Una duda", "Qué quieres hacer. Te respondemos con los pasos."],
               ["idea", "💡", "Una idea", "Qué mejorarías y para qué. Las ideas se reúnen y las decide el coordinador."]];
  var ESTADOS = { nuevo: ["📡", "Recibido"], en_marcha: ["🛠️", "En marcha"], resuelto: ["✅", "Resuelto"],
                  para_norberto: ["🧭", "Con el coordinador"], anotado: ["🗂️", "Anotado"] };

  function cuando(ms) {
    var s = Math.max(0, Math.round((Date.now() - Number(ms || 0)) / 1000));
    if (s < 60) return "ahora mismo";
    if (s < 3600) return "hace " + Math.round(s / 60) + " min";
    if (s < 86400) return "hace " + Math.round(s / 3600) + " h";
    return new Date(Number(ms)).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }
  function aviso(txt, bueno) {
    var a = document.getElementById("bz-aviso"); if (!a) return;
    a.className = "aviso" + (bueno ? " ok" : ""); a.innerHTML = txt; a.hidden = false;
  }

  // ── la puerta
  function puerta(err) {
    app.innerHTML = '<div class="card bz-puerta"><h2>Entra con tu cuenta de docente</h2>'
      + '<p>La frecuencia de mando es del profesorado de STARGATE: entra con la cuenta de Google de tu grupo.</p>'
      + '<p><button class="btn primary grande btn-google" id="bz-entrar">' + ((window.SG && window.SG.LOGO_G) || "") + '<span>Iniciar sesión con Google</span></button></p>'
      + (err ? '<p class="malo">' + esc(err) + '</p>' : '') + '</div>';
    document.getElementById("bz-entrar").onclick = function () {
      MOTOR.entrar().then(function () { arrancar(); }).catch(function (e) { puerta("No he podido entrar: " + ((e && e.message) || e)); });
    };
  }

  // ── la transmisión nueva y las sugerencias del Capitán
  function sugerencias() {
    var caja = document.getElementById("bz-sugiere"); if (!caja) return;
    var L = ST.sugeridas;
    caja.innerHTML = L.length
      ? '<div class="bz-cap"><img src="assets/img/capitan/senala.png" alt=""><p><b>El Capitán</b>Esto ya tiene solución conocida. Mira si te sirve antes de enviarlo:</p></div>'
        + L.map(function (e) { return '<article class="bz-sol"><h3>' + esc(e.t) + '</h3><div>' + e.x + '</div></article>'; }).join("")
        + '<p class="bz-sol-botones"><button class="btn" id="bz-resuelto" type="button">✅ Esto lo resuelve</button></p>'
      : '<div class="bz-cap"><img src="assets/img/capitan/pensativo.png" alt=""><p><b>El Capitán</b>Mientras escribes, busco si esto ya tiene solución. '
        + 'Si no la tiene, transmítelo: el Mando lo revisa cada día y te responde aquí mismo.</p></div>';
    var r = document.getElementById("bz-resuelto");
    if (r) r.onclick = function () {
      ST.texto = ""; ST.sugeridas = []; pintar();
      aviso("✅ ¡Perfecto, Comandante! Si vuelve a pasar, aquí estamos.", true);
    };
  }
  function nueva() {
    var tipo = TIPOS.filter(function (t) { return t[0] === ST.tipo; })[0];
    var grupos = GRUPOS.length > 1
      ? '<label class="bz-campo">¿De qué grupo?<select id="bz-grupo">' + GRUPOS.map(function (g) {
          return '<option value="' + esc(g.id) + '"' + (g.id === ST.grupo ? " selected" : "") + '>' + esc(g.nombre || g.id) + '</option>'; }).join("") + '</select></label>'
      : '';
    return '<div class="bz-grid"><section class="card bz-nueva"><h2>Nueva transmisión</h2>'
      + '<div class="bz-chips" role="group" aria-label="Lo más habitual">' + CHIPS.map(function (c) {
          return '<button type="button" class="bz-chip" data-chip="' + c[0] + '">' + c[1] + '</button>'; }).join("") + '</div>'
      + '<div class="bz-tipos" role="radiogroup" aria-label="Qué es">' + TIPOS.map(function (t) {
          return '<button type="button" role="radio" aria-checked="' + (t[0] === ST.tipo) + '" class="bz-tipo' + (t[0] === ST.tipo ? " on" : "") + '" data-tipo="' + t[0] + '">'
            + '<span>' + t[1] + '</span>' + t[2] + '</button>'; }).join("") + '</div>'
      + grupos
      + '<label class="bz-campo">Cuéntanoslo<textarea id="bz-texto" maxlength="2000" rows="6" placeholder="' + esc(tipo[3]) + '">' + esc(ST.texto) + '</textarea>'
      + '<span class="bz-cuenta" id="bz-cuenta">' + ST.texto.length + ' / 2000</span></label>'
      + (ST.tipo === "problema" ? '<label class="bz-urg"><input type="checkbox" id="bz-urgente"' + (ST.urgente ? " checked" : "") + '> 🚨 Me está bloqueando la clase ahora mismo</label>' : '')
      + '<p class="bz-acciones"><button class="btn primary grande" id="bz-enviar" type="button">📡 Transmitir al Mando</button></p>'
      + '<p class="small muted">Con tu mensaje viaja desde dónde escribes (la página, el grupo, la semana y tu navegador): así encontramos el fallo sin tener que preguntarte.</p>'
      + '</section><aside class="bz-sugiere" id="bz-sugiere" aria-live="polite"></aside></div>';
  }
  function cablearNueva() {
    var txt = document.getElementById("bz-texto"), cuenta = document.getElementById("bz-cuenta"), espera = null;
    txt.oninput = function () {
      ST.texto = txt.value; cuenta.textContent = txt.value.length + " / 2000";
      clearTimeout(espera); espera = setTimeout(function () { ST.sugeridas = ST.tipo === "idea" ? [] : buscar(ST.texto); sugerencias(); }, 250);
    };
    Array.prototype.forEach.call(app.querySelectorAll("[data-tipo]"), function (b) {
      b.onclick = function () { ST.tipo = b.getAttribute("data-tipo"); if (ST.tipo !== "problema") ST.urgente = false; pintar(); var t = document.getElementById("bz-texto"); if (t) t.focus(); };
    });
    Array.prototype.forEach.call(app.querySelectorAll("[data-chip]"), function (b) {
      b.onclick = function () {
        var e = KB.filter(function (x) { return x.id === b.getAttribute("data-chip"); })[0];
        ST.tipo = "problema"; ST.sugeridas = e ? [e] : []; if (!ST.texto) ST.texto = b.textContent.replace(/^\S+\s/, "") + ". ";
        pintar(); var t = document.getElementById("bz-texto"); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
      };
    });
    var g = document.getElementById("bz-grupo"); if (g) g.onchange = function () { ST.grupo = g.value; };
    var u = document.getElementById("bz-urgente"); if (u) u.onchange = function () { ST.urgente = u.checked; };
    document.getElementById("bz-enviar").onclick = enviar;
    sugerencias();
  }
  function enviar() {
    var b = document.getElementById("bz-enviar"), texto = String(ST.texto || "").trim();
    if (texto.length < 8) { aviso("Cuéntanos un poco más (qué ha pasado, dónde y con quién): así lo resolvemos a la primera."); document.getElementById("bz-texto").focus(); return; }
    var g = GRUPOS.filter(function (x) { return x.id === ST.grupo; })[0] || GRUPOS[0] || {};
    b.disabled = true; b.textContent = "Transmitiendo…";
    MOTOR.buzonEnviar({
      tipo: ST.tipo, urgente: ST.tipo === "problema" && ST.urgente, texto: texto, projectId: g.id || "", grupo: g.nombre || "",
      autoayuda: ST.sugeridas.map(function (e) { return e.id; }),
      contexto: { desde: DESDE || "buzon", semana: g.semana || null, estado: g.estado || "", referente: !!g.soyReferente,
                  navegador: String(navigator.userAgent || "").slice(0, 180), pantalla: window.innerWidth + "x" + window.innerHeight,
                  idioma: navigator.language || "", hora: new Date().toISOString() }
    }).then(function () {
      ST.texto = ""; ST.urgente = false; ST.sugeridas = [];
      return cargar().then(function () {
        pintar();
        aviso('<img class="bz-ok-cap" src="assets/img/capitan/pulgar.png" alt=""> <b>Transmisión recibida, Comandante.</b> El Mando la revisa cada día' +
          ' y te responde aquí mismo; lo urgente, lo primero.', true);
      });
    }).catch(function (e) {
      b.disabled = false; b.textContent = "📡 Transmitir al Mando";
      aviso(/permission|insufficient/i.test(String(e && (e.code || e.message)))
        ? "La frecuencia no me deja transmitir desde esta cuenta ahora mismo. Recarga la página y vuelve a probar en un rato; si sigue igual, avisa a tu referente."
        : "No ha salido: " + esc((e && e.message) || e));
    });
  }

  // ── un mensaje, con su hilo (el mío o, para el Mando, el de cualquiera)
  function mensaje(m, comoMando) {
    var tipo = TIPOS.filter(function (t) { return t[0] === m.tipo; })[0] || TIPOS[0], e = ESTADOS[m.estado] || ESTADOS.nuevo;
    var nuevoParaMi = !comoMando && m.visto === false;
    var cx = m.contexto || {};
    return '<article class="bz-msg ' + esc(m.estado || "nuevo") + (m.urgente ? " urgente" : "") + (nuevoParaMi ? " fresco" : "") + '" data-m="' + esc(m.id) + '">'
      + '<header><span class="bz-tipo-et">' + tipo[1] + ' ' + tipo[2] + '</span>'
      + (m.urgente ? '<span class="chip bz-urgente">🚨 Urgente</span>' : '')
      + '<span class="chip bz-estado">' + e[0] + ' ' + (comoMando && m.estado === "para_norberto" ? "Para ti" : e[1]) + '</span>'
      + (nuevoParaMi ? '<span class="chip bz-nueva-r">📡 Respuesta nueva</span>' : '')
      + '<time>' + cuando(m.creado) + '</time>'
      + (comoMando ? '<span class="bz-quien">' + esc(m.nombre || m.correo || "") + ' · ' + esc(m.grupo || m.projectId || "") + '</span>' : (m.grupo ? '<span class="bz-quien">' + esc(m.grupo) + '</span>' : ''))
      + '</header>'
      + '<p class="bz-texto">' + esc(m.texto) + '</p>'
      + (comoMando ? '<p class="bz-cx">' + ["desde " + (cx.desde || "—"), cx.semana ? "semana " + cx.semana : "", cx.pantalla || "", cx.referente ? "referente" : "",
           (cx.navegador || "").replace(/^.*?\) /, "").slice(0, 60)].filter(Boolean).map(esc).join(" · ") + '</p>' : '')
      + ((m.respuestas || []).length ? '<div class="bz-hilo">' + m.respuestas.map(function (r) {
          return '<div class="bz-r ' + (r.de === "mando" ? "mando" : "docente") + '"><b>' + (r.de === "mando" ? "📡 El Mando" : (comoMando ? esc(m.nombre || "Docente") : "Tú")) + '</b>'
            + '<p>' + esc(r.texto) + '</p><time>' + cuando(r.fecha) + '</time></div>'; }).join("") + '</div>' : '')
      + '<div class="bz-contesta"><textarea rows="2" maxlength="2000" placeholder="' + (comoMando ? "Responder como el Mando…" : "Contestar…") + '"></textarea>'
      + '<div class="bz-contesta-b">'
      + (comoMando
        ? '<select aria-label="Estado">' + Object.keys(ESTADOS).map(function (k) {
            return '<option value="' + k + '"' + (k === (m.estado === "nuevo" ? (m.tipo === "idea" ? "anotado" : "resuelto") : m.estado) ? " selected" : "") + '>' + ESTADOS[k][0] + ' ' + (k === "para_norberto" ? "Para ti" : ESTADOS[k][1]) + '</option>'; }).join("") + '</select>'
          + '<button class="btn primary" type="button" data-responder>Responder</button>'
        : '<button class="btn" type="button" data-responder>Contestar</button>'
          + (m.estado !== "resuelto" ? ' <button class="btn min" type="button" data-cerrar>✅ Ya está resuelto</button>' : ''))
      + '</div></div></article>';
  }
  function cablearMensajes(raiz, comoMando) {
    Array.prototype.forEach.call(raiz.querySelectorAll(".bz-msg"), function (art) {
      var id = art.getAttribute("data-m"), ta = art.querySelector("textarea"), sel = art.querySelector("select");
      var r = art.querySelector("[data-responder]"), c = art.querySelector("[data-cerrar]");
      r.onclick = function () {
        var t = ta.value.trim();
        if (!t && !comoMando) { ta.focus(); return; }
        r.disabled = true;
        MOTOR.buzonResponder(id, t, comoMando ? { comoMando: true, estado: sel.value } : {})
          .then(function () { return cargar(); }).then(function () { pintar(); aviso(comoMando ? "Respondido." : "📡 Enviado al Mando.", true); })
          .catch(function (e) { r.disabled = false; aviso("No ha salido: " + esc((e && e.message) || e)); });
      };
      if (c) c.onclick = function () {
        MOTOR.buzonResponder(id, "", { estado: "resuelto" }).then(function () { return cargar(); })
          .then(function () { pintar(); aviso("✅ Cerrado. ¡Gracias, Comandante!", true); });
      };
    });
  }

  // ── la vista del Mando: todo, con filtros
  var FILTROS = [["abiertas", "📡 Por resolver"], ["urgentes", "🚨 Urgentes"], ["para_norberto", "🧭 Para ti"], ["ideas", "💡 Ideas"], ["resueltas", "✅ Resueltas"], ["todas", "Todas"]];
  function filtra(L) {
    return L.filter(function (m) {
      if (FILTRO === "abiertas") return m.estado === "nuevo" || m.estado === "en_marcha";
      if (FILTRO === "urgentes") return m.urgente && m.estado !== "resuelto";
      if (FILTRO === "para_norberto") return m.estado === "para_norberto";
      if (FILTRO === "ideas") return m.tipo === "idea";
      if (FILTRO === "resueltas") return m.estado === "resuelto";
      return true;
    });
  }
  // lo que arde, arriba: urgente y sin cerrar; después, lo último que se ha movido
  function arde(m) { return m.urgente && m.estado !== "resuelto" && m.estado !== "anotado" ? 1 : 0; }
  function vistaMando() {
    var L = filtra(TODOS).slice().sort(function (a, b) { return (arde(b) - arde(a)) || ((b.actualizado || 0) - (a.actualizado || 0)); });
    return '<section class="bz-mando"><h2>📋 Todas las transmisiones <span class="small muted">(solo el Mando)</span></h2>'
      + '<div class="bz-filtros" role="group">' + FILTROS.map(function (f) {
          var n = FILTRO === f[0] ? L.length : filtraCon(f[0]).length;
          return '<button type="button" class="bz-chip' + (FILTRO === f[0] ? " on" : "") + '" data-filtro="' + f[0] + '">' + f[1] + ' <b>' + n + '</b></button>'; }).join("") + '</div>'
      + (L.length ? L.map(function (m) { return mensaje(m, true); }).join("") : '<p class="muted">Nada por aquí.</p>') + '</section>';
  }
  function filtraCon(f) { var antes = FILTRO; FILTRO = f; var r = filtra(TODOS); FILTRO = antes; return r; }

  // ── pintar y cargar
  function pintar() {
    app.innerHTML = '<div id="bz-aviso" class="aviso" hidden></div>' + nueva()
      + '<section class="bz-lista"><h2>Tus transmisiones</h2>'
      + (MIOS.length ? MIOS.map(function (m) { return mensaje(m, false); }).join("")
         : SIN_LEER ? '<p class="muted">Ahora mismo no puedo leer tus transmisiones. Recarga la página en un rato.</p>'
         : '<p class="muted">Aún no has escrito nada. Cuando lo hagas, las respuestas llegarán aquí.</p>')
      + '</section>' + (MANDO ? vistaMando() : '');
    cablearNueva();
    cablearMensajes(app.querySelector(".bz-lista"), false);
    var vm = app.querySelector(".bz-mando");
    if (vm) {
      cablearMensajes(vm, true);
      Array.prototype.forEach.call(vm.querySelectorAll("[data-filtro]"), function (b) { b.onclick = function () { FILTRO = b.getAttribute("data-filtro"); pintar(); }; });
    }
    // lo leído, leído: se apaga el aviso de respuesta nueva (en la consola y aquí la próxima vez)
    MIOS.filter(function (m) { return m.visto === false; }).forEach(function (m) { MOTOR.buzonVisto(m.id); m.visto = true; });
  }
  function cargar() {
    SIN_LEER = false;
    return Promise.all([MOTOR.buzonMios().catch(function () { SIN_LEER = true; return []; }),
                        MANDO ? MOTOR.buzonTodos().catch(function () { return []; }) : Promise.resolve([])])
      .then(function (r) { MIOS = r[0] || []; TODOS = r[1] || []; });
  }
  function arrancar() {
    app.innerHTML = '<p class="muted">Abriendo la frecuencia…</p>';
    MOTOR.sesion().then(function (yo) {
      if (!yo) return puerta();
      YO = yo; MANDO = VITALICIOS.indexOf(String(yo.correo || "").toLowerCase()) >= 0;
      return MOTOR.misPERs(yo.correo).then(function (ps) {
        GRUPOS = (ps || []).filter(function (g) { return g.estado !== "archivado"; });
        if (!GRUPOS.length && !MANDO) {
          app.innerHTML = '<div class="card bz-puerta"><h2>Esta frecuencia es del profesorado de STARGATE</h2>'
            + '<p>Has entrado como <b>' + esc(yo.correo) + '</b>, y esta cuenta no está en el equipo docente de ningún grupo. '
            + 'Si das clase en STARGATE, entra con la cuenta que te dio de alta tu referente.</p>'
            + '<p><button class="btn" id="bz-otra">Entrar con otra cuenta</button></p></div>';
          document.getElementById("bz-otra").onclick = function () { MOTOR.salir().then(function () { puerta(); }); };
          return;
        }
        if (!GRUPOS.some(function (g) { return g.id === ST.grupo; })) ST.grupo = (GRUPOS[0] || {}).id || "";
        return cargar().then(pintar);
      });
    }).catch(function (e) { app.innerHTML = '<p class="malo">No he podido abrir la frecuencia: ' + esc((e && e.message) || e) + '</p>'; });
  }
  function listo() { MOTOR = window.SG.MOTOR; arrancar(); }
  if (window.SG && window.SG.MOTOR) listo(); else document.addEventListener("sg:motor", listo);
})();
