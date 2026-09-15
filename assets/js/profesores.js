/**
 * STARGATE · PROFESORES — profesores.html · 15-sep-2026 · solo el Mando (los dos vitalicios)
 *
 * Norberto: «una página de profesores: veo todos los profes que son o han sido y debo poder convertir (o quitar)
 * de profe referente. Administro sus grupos, veo sus conexiones, sus stats…».
 *   · Quién: todo el que está o estuvo en el equipo de un grupo de STARGATE, en el registro de referentes o se
 *     ha conectado alguna vez como docente (stargate_profes).
 *   · Qué se ve: sus grupos (con su papel y cuántos alistados), su última conexión y cuántas lleva.
 *   · Qué se hace: invitar a un referente (enlace de un solo uso), hacer o quitar referente (quitar = ya no
 *     crea grupos; su papel en cada grupo se cambia en el Equipo docente de ese grupo) y añadirle a un grupo.
 * Las reglas solo dejan leer y escribir esto al Mando: esta página no esconde nada, lo pide.
 */
(function () {
  "use strict";
  var app = document.getElementById("pr-app");
  if (!app) return;
  var MOTOR = null, YO = null, D = null, FILTRO = "todos", ULTIMA = null;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function cuando(ms) {
    if (!ms) return "nunca";
    var s = Math.max(0, Math.round((Date.now() - Number(ms)) / 1000));
    if (s < 3600) return "hace " + Math.max(1, Math.round(s / 60)) + " min";
    if (s < 86400) return "hace " + Math.round(s / 3600) + " h";
    if (s < 7 * 86400) return "hace " + Math.round(s / 86400) + " días";
    return new Date(Number(ms)).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" });
  }
  function aviso(t, bueno) { var a = document.getElementById("pr-aviso"); if (!a) return; a.className = "aviso" + (bueno ? " ok" : ""); a.innerHTML = t; a.hidden = false; }

  // ── juntar a cada docente de donde esté: equipos de los grupos, registro de referentes y conexiones
  function juntar(grupos, refs, cons, invs) {
    var P = {}, vit = MOTOR.VITALICIOS || [];
    var de = function (correo) {
      correo = String(correo || "").trim().toLowerCase(); if (!correo) return null;
      return P[correo] = P[correo] || { correo: correo, nombre: "", grupos: [], referente: false, vitalicio: vit.indexOf(correo) >= 0, n: 0, ultima: 0 };
    };
    grupos.forEach(function (g) {
      var eq = g.equipo || [], vistos = {};
      eq.forEach(function (d) { var t = de(d.correo); if (!t) return; vistos[t.correo] = 1; if (!t.nombre && d.nombre) t.nombre = d.nombre;
        t.grupos.push({ id: g.id, nombre: g.nombre, rol: d.rol || "docente", estado: g.estado, semana: g.semana, total: g.total, reclutas: g.reclutas }); });
      (g.coTeacherEmails || []).forEach(function (c) { var t = de(c); if (!t || vistos[t.correo]) return;
        t.grupos.push({ id: g.id, nombre: g.nombre, rol: "docente", estado: g.estado, semana: g.semana, total: g.total, reclutas: g.reclutas }); });
    });
    refs.forEach(function (r) { var t = de(r.correo || r.id); if (!t) return; t.referente = r.activo === true; t.refPor = r.por; t.refDesde = r.desde; if (!t.nombre && r.nombre) t.nombre = r.nombre; });
    cons.forEach(function (c) { var t = de(c.correo); if (!t) return; t.n = c.n || 0; t.ultima = c.ultima || 0; t.primera = c.primera || 0; t.foto = c.foto || ""; if (!t.nombre && c.nombre) t.nombre = c.nombre; });
    return Object.keys(P).map(function (k) { var t = P[k];
      t.esRef = t.vitalicio || t.referente || t.grupos.some(function (g) { return g.rol === "referente"; });
      t.alistados = t.grupos.reduce(function (a, g) { return a + (Number(g.reclutas) || 0); }, 0);
      return t; }).sort(function (a, b) { return (b.esRef - a.esRef) || ((b.ultima || 0) - (a.ultima || 0)) || a.correo.localeCompare(b.correo); });
  }

  function pintar() {
    var todos = D.profes, sietes = Date.now() - 7 * 864e5;
    var L = todos.filter(function (t) {
      return FILTRO === "referentes" ? t.esRef : FILTRO === "con" ? t.grupos.length : FILTRO === "sin" ? !t.grupos.length : true; });
    var gruposMios = D.grupos.filter(function (g) { return g.estado !== "pasado"; });
    var pend = D.invs.filter(function (i) { return !i.usadoPor && Number(i.caduca) > Date.now(); });
    app.innerHTML = '<div id="pr-aviso" class="aviso" hidden></div>'
      + '<div class="pr-cifras"><div><b>' + todos.length + '</b><span>profes</span></div><div><b>' + todos.filter(function (t) { return t.esRef; }).length + '</b><span>referentes</span></div>'
      + '<div><b>' + todos.filter(function (t) { return t.ultima > sietes; }).length + '</b><span>conectados esta semana</span></div><div><b>' + D.grupos.length + '</b><span>grupos</span></div></div>'
      // invitar
      + '<section class="card pr-invitar"><h2>✉️ Invitar a un profe referente</h2>'
      + '<p class="small muted">Un enlace de un solo uso (vale 14 días): quien lo abre entra con su cuenta de Google y esa cuenta queda como referente. No hace falta saber su correo.</p>'
      + '<div class="pr-fila"><input id="pr-inv-nombre" placeholder="Nombre (para reconocer la invitación)" maxlength="80"><button class="btn primary" id="pr-inv-crear" type="button">Crear invitación</button></div>'
      + (ULTIMA ? '<div class="pr-enlace"><p>Invitación para <b>' + esc(ULTIMA.nombre) + '</b> (caduca el ' + new Date(ULTIMA.caduca).toLocaleDateString("es-ES") + '):</p>'
          + '<code>' + esc(ULTIMA.enlace) + '</code> <button class="btn min" data-copiar="' + esc(ULTIMA.enlace) + '" data-copiado="✓ Enlace copiado">📋 Copiar el enlace</button></div>' : '')
      + '<p class="small muted" style="margin-top:12px">¿Sabes ya su correo? Hazlo referente directamente:</p>'
      + '<div class="pr-fila"><input id="pr-ref-correo" placeholder="correo@…" type="email"><input id="pr-ref-nombre" placeholder="Nombre" maxlength="80"><button class="btn" id="pr-ref-poner" type="button">★ Hacer referente</button></div>'
      + (pend.length || D.invs.length ? '<details class="pr-invs"' + (pend.length ? " open" : "") + '><summary>Invitaciones (' + pend.length + ' sin usar de ' + D.invs.length + ')</summary><ul>'
          + D.invs.slice(0, 20).map(function (i) {
              var e = i.usadoPor ? "✅ aceptada por <b>" + esc(i.usadoCorreo || "") + "</b> " + cuando(i.usadoEn) : Number(i.caduca) < Date.now() ? "⌛ caducada" : "⏳ sin usar · caduca el " + new Date(i.caduca).toLocaleDateString("es-ES");
              return '<li><b>' + esc(i.nombre || "—") + '</b> · ' + e + (!i.usadoPor && Number(i.caduca) > Date.now()
                ? ' <button class="btn min" data-copiar="' + esc(location.origin + "/invitacion.html?t=" + i.id) + '" data-copiado="✓ Copiado">📋 Enlace</button>' : '') + '</li>'; }).join("")
          + '</ul></details>' : '')
      + '</section>'
      // la lista
      + '<section class="pr-lista"><div class="pr-lista-cab"><h2>👥 El profesorado</h2><div class="pr-filtros">'
      + [["todos", "Todos"], ["referentes", "★ Referentes"], ["con", "Con grupo"], ["sin", "Sin grupo"]].map(function (f) {
          return '<button type="button" class="bz-chip' + (FILTRO === f[0] ? " on" : "") + '" data-filtro="' + f[0] + '">' + f[1] + '</button>'; }).join("") + '</div></div>'
      + (L.length ? L.map(function (t) {
          return '<article class="pr-profe' + (t.esRef ? " ref" : "") + '" data-correo="' + esc(t.correo) + '">'
            + '<div class="pr-quien">' + (t.foto ? '<img src="' + esc(t.foto) + '" alt="" referrerpolicy="no-referrer">' : '<span class="pr-ini">' + esc((t.nombre || t.correo).charAt(0).toUpperCase()) + '</span>')
            + '<div><b>' + esc(t.nombre || t.correo.split("@")[0]) + '</b><span>' + esc(t.correo) + '</span>'
            + '<em>' + (t.vitalicio ? "★ Vitalicio" : t.referente ? "★ Referente" : t.esRef ? "★ Referente de un grupo" : "Docente") + '</em></div></div>'
            + '<div class="pr-datos"><div><b>' + t.grupos.length + '</b><span>grupo' + (t.grupos.length === 1 ? "" : "s") + '</span></div><div><b>' + t.alistados + '</b><span>alistados</span></div>'
            + '<div><b>' + (t.n || 0) + '</b><span>conexiones</span></div><div><b class="pr-cuando">' + cuando(t.ultima) + '</b><span>última</span></div></div>'
            + '<div class="pr-grupos">' + (t.grupos.length ? t.grupos.map(function (g) {
                return '<a class="pr-grupo" href="consola.html?per=' + encodeURIComponent(g.id) + '">' + (g.rol === "referente" ? "★ " : "") + esc(g.nombre || g.id)
                  + '<small>' + (g.estado === "en marcha" ? "sem. " + g.semana + "/" + g.total : esc(g.estado || "")) + '</small></a>'; }).join("")
                : '<span class="small muted">En ningún grupo ahora mismo</span>') + '</div>'
            + '<div class="pr-acciones">'
            + (t.vitalicio ? '' : (t.referente
                ? '<button class="btn min" type="button" data-quitar>Quitar de referente</button>'
                : '<button class="btn min" type="button" data-hacer>★ Hacer referente</button>'))
            + '<select aria-label="Añadir a un grupo"><option value="">Añadir a un grupo…</option>' + gruposMios.filter(function (g) {
                return !t.grupos.some(function (x) { return x.id === g.id; }); }).map(function (g) {
                return '<option value="' + esc(g.id) + '">' + esc(g.nombre || g.id) + '</option>'; }).join("") + '</select>'
            + '<select aria-label="Con qué papel" class="pr-rol"><option value="docente">como docente</option><option value="referente">como referente</option></select>'
            + '<button class="btn min" type="button" data-anadir>Añadir</button></div></article>';
        }).join("") : '<p class="muted">Nadie en este filtro.</p>')
      + '</section>';
    cablear();
  }

  function recargar(msg) {
    return cargar().then(function () { pintar(); if (msg) aviso(msg, true); });
  }
  function cablear() {
    Array.prototype.forEach.call(app.querySelectorAll("[data-filtro]"), function (b) { b.onclick = function () { FILTRO = b.getAttribute("data-filtro"); pintar(); }; });
    Array.prototype.forEach.call(app.querySelectorAll("[data-copiar]"), function (b) {
      b.onclick = function () { var t = b.getAttribute("data-copiar"), antes = b.textContent;
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = b.getAttribute("data-copiado") || "✓"; setTimeout(function () { b.textContent = antes; }, 1600); },
          function () { window.prompt("Copia el enlace:", t); }); };
    });
    document.getElementById("pr-inv-crear").onclick = function () {
      var n = document.getElementById("pr-inv-nombre").value.trim();
      if (!n) { aviso("Pon un nombre: así sabrás de quién es la invitación."); return; }
      this.disabled = true;
      MOTOR.crearInvitacion(n).then(function (r) { ULTIMA = { nombre: n, enlace: r.enlace, caduca: r.caduca }; return recargar("✉️ Invitación creada para <b>" + esc(n) + "</b>: copia el enlace y mándaselo."); })
        .catch(function (e) { aviso("No ha salido: " + esc((e && e.message) || e)); });
    };
    document.getElementById("pr-ref-poner").onclick = function () {
      var c = document.getElementById("pr-ref-correo").value.trim(), n = document.getElementById("pr-ref-nombre").value.trim();
      this.disabled = true;
      MOTOR.ponerReferente(c, true, n).then(function () { return recargar("★ <b>" + esc(c) + "</b> ya es referente: al entrar con esa cuenta podrá crear grupos."); })
        .catch(function (e) { aviso("No ha salido: " + esc((e && e.message) || e)); document.getElementById("pr-ref-poner").disabled = false; });
    };
    Array.prototype.forEach.call(app.querySelectorAll(".pr-profe"), function (art) {
      var correo = art.getAttribute("data-correo"), t = D.profes.filter(function (x) { return x.correo === correo; })[0];
      var h = art.querySelector("[data-hacer]"), q = art.querySelector("[data-quitar]"), a = art.querySelector("[data-anadir]");
      if (h) h.onclick = function () { h.disabled = true; MOTOR.ponerReferente(correo, true, t.nombre).then(function () { return recargar("★ <b>" + esc(t.nombre || correo) + "</b> ya es referente."); }).catch(function (e) { aviso("No ha salido: " + esc(e.message || e)); }); };
      if (q) q.onclick = function () {
        if (!q.classList.contains("seguro")) { q.classList.add("seguro"); q.textContent = "¿Seguro? Pulsa otra vez"; return; }
        q.disabled = true;
        MOTOR.ponerReferente(correo, false, t.nombre).then(function () { return recargar("<b>" + esc(t.nombre || correo) + "</b> ya no es referente: no podrá crear grupos. Su papel en cada grupo se cambia en el Equipo docente de ese grupo."); })
          .catch(function (e) { aviso("No ha salido: " + esc(e.message || e)); });
      };
      if (a) a.onclick = function () {
        var sel = art.querySelector("select"), per = sel.value, rol = art.querySelector(".pr-rol").value;
        if (!per) { sel.focus(); return; }
        a.disabled = true;
        MOTOR.anadirDocente(per, { nombre: t.nombre || correo.split("@")[0], correo: correo, rol: rol })
          .then(function () { return recargar("👥 <b>" + esc(t.nombre || correo) + "</b> ya está en ese grupo (" + rol + "). Entra con su cuenta y lo verá en Mis grupos."); })
          .catch(function (e) { a.disabled = false; aviso("No ha salido: " + esc((e && e.message) || e)); });
      };
    });
  }

  function cargar() {
    return Promise.all([MOTOR.todosLosGrupos(), MOTOR.referentes(), MOTOR.profes(), MOTOR.invitaciones()]).then(function (r) {
      D = { grupos: r[0] || [], invs: r[3] || [] };
      D.profes = juntar(D.grupos, r[1] || [], r[2] || [], D.invs);
    });
  }
  function arrancar() {
    MOTOR = window.SG.MOTOR;
    app.innerHTML = '<p class="muted">Pasando lista al profesorado…</p>';
    MOTOR.sesion().then(function (yo) {
      YO = yo;
      if (!yo) {
        app.innerHTML = '<div class="card"><h2>Esta página es del Mando</h2><p>Entra con tu cuenta.</p><p><button class="btn primary btn-google" id="pr-entrar">'
          + ((window.SG && window.SG.LOGO_G) || "") + '<span>Iniciar sesión con Google</span></button></p></div>';
        document.getElementById("pr-entrar").onclick = function () { MOTOR.entrar().then(arrancar); };
        return;
      }
      if ((MOTOR.VITALICIOS || []).indexOf(String(yo.correo || "").toLowerCase()) < 0) {
        app.innerHTML = '<div class="card"><h2>Esta página es del Mando</h2><p>Con <b>' + esc(yo.correo) + '</b> no se puede ver. Lo tuyo está en <a href="consola.html">Mis grupos</a>.</p></div>';
        return;
      }
      return cargar().then(pintar);
    }).catch(function (e) { app.innerHTML = '<p class="malo">No he podido cargar el profesorado: ' + esc((e && e.message) || e) + '</p>'; });
  }
  if (window.SG && window.SG.MOTOR) arrancar(); else document.addEventListener("sg:motor", arrancar);
})();
