/* STARGATE · LA ACADEMIA DE LA CERO (academia.html) · 29-sep-2026
 * El curso del profesorado, en asíncrono: nueve SESIONES cortas (unos 10-25 minutos cada una) de lo más grande a lo más
 * concreto (el contenido: _site_data.py → ACADEMIA, aquí window.SG_ACADEMIA). Cada sesión se ve como una clase de
 * diapositivas: una pantalla de entrada con su personaje, UNA idea por pantalla y, al final, «Ahora tú»: sus hitos
 * AUTOCORREGIBLES, uno por pantalla (los cuestionarios, pregunta a pregunta, con su porqué al momento).
 * 🔴 Norberto (29-sep): «quiero que la academia no agobie, que tengan sesiones para entender las cosas, que la información
 * se muestre poco a poco, no todo de golpe». Eligió en el borrador las sesiones con diapositivas (A) y que la siguiente se
 * abra al terminar la anterior, con un «¿Suficiente por hoy?». Por eso el mapa solo enseña lo hecho y la sesión en curso.
 * Los hitos: cuestionarios, clasificar elementos, misiones que la plataforma comprueba sola en el grupo de la Academia (el
 * alta, dos retos, la Ruta, el Simulador de vuelo) y el ENSAYO, que no escribe en ningún servidor: la consola de ensayo, la
 * clase del grupo DEMO, la Nave en simulacro y la sesión en diferido dejan su rastro en ESTE navegador (SG.rastroAcademia →
 * localStorage `sgAcademia`). Y el canal con Claude: dudas, «algo no funciona», ideas y la dificultad de cada juego; Claude
 * responde una vez al día y puede ADAPTAR el camino de cada cual (convalidar un hito, añadir uno): CCD/academia/.
 * Nació en DPG1 como «El Camino del Mentor» (web-camino/curso.js); la receta, en CCD/RECETA_CURSO_DOCENTES.md.
 * Lo de cada docente: stargate_formacion/{uid} (motor.js → academiaMia, academiaGuardar, academiaEscuchar). En la demo
 * (?demo=1), en este navegador. 🔴 Entrar aquí con Google ES registrarse: crear.html enseña esta lista para añadir con un clic.
 */
(function () {
  "use strict";
  var app = document.getElementById("acd-app"), C = window.SG_ACADEMIA;
  if (!app || !C) return;
  var q = new URLSearchParams(location.search), DEMO = q.get("demo") === "1";
  var G = C.grupo, PER_DEMO = window.SG_PER_DEMO || "demo-stargate", N = C.estaciones.length;
  var M = null, YO = null, FICHA = null, PERFIL = null, DOC = { pasos: {} }, ACTUAL = null, PANT = 0, SIN_GUARDAR = false;
  var LS = "sgAcademia.";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ico(k) { return '<img class="ico" src="assets/img/iconos/p/' + k + '.png" alt="" width="20" height="20">'; }
  function lsLeer(k, d) { try { var v = localStorage.getItem(LS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsPoner(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {} }
  function obj(k, v) { var o = {}; o[k] = v; return o; }
  function $(s) { return app.querySelector(s); }

  // ── el ENSAYO: lo que se ha practicado en este navegador (SG.rastroAcademia, en stargate.js)
  function rastro() { try { return JSON.parse(localStorage.getItem("sgAcademia") || "{}") || {}; } catch (e) { return {}; } }
  function claseEntera(x) { return !!x && Number(x.total) > 3 && Number(x.max) >= Number(x.total) - 1; }
  function simOk(c) {
    var R = rastro(), m;
    if (c === "sim:consola") { var v = R.consola || {}; return !!(v.portada && v.alumnado && v.retos && v.rankings && v.ficha); }
    if (c === "sim:clase") return Object.keys(R.clase || {}).some(function (k) { return k.indexOf(PER_DEMO + ":") === 0 && claseEntera(R.clase[k]); });
    if (c === "sim:estudiante") return !!R.estudiante;
    if (c === "sim:rueda") return !!R.rueda;
    if (c === "sim:panel") return !!R.panel;
    if (c === "nave") return !!R.nave;
    if ((m = /^dif:(.+)$/.exec(c))) { var x = (R.clase || {})[G + ":" + m[1]]; return !!(x && x.dif) && claseEntera(x); }
    return false;
  }
  function local(c) { return /^(sim|dif):/.test(c) || c === "nave"; }
  // ── lo que la plataforma sabe de su ficha en el grupo de la Academia
  function autoOk(c) {
    if (local(c)) return simOk(c) || (DEMO && !!lsLeer("demo." + c, false));
    if (DEMO) return !!lsLeer("demo." + c, false);
    if (c === "alta") return !!FICHA;
    var p = PERFIL; if (!p) return false;
    var hechos = p.completedMissionIds || [], ruta = p.stargateRuta || {}, m;
    if (c === "reto") return hechos.some(function (x) { return String(x).indexOf(G + "__") === 0 && !/__H1$/.test(x); });
    if ((m = /^reto:(.+)$/.exec(c))) return hechos.indexOf(G + "__" + m[1]) >= 0;
    if ((m = /^ruta:(.+)$/.exec(c))) return !!(ruta[m[1]] && ruta[m[1]].medalla && ruta[m[1]].medalla !== "nada");
    if (c === "repaso") return Object.keys(ruta.repaso || {}).length > 0 || Number(((p.stargateSala || {}).marcas || {}).vuelo || 0) > 0;
    return false;
  }
  function ajuste(id) { return ((DOC.claude || {}).ajustes || {})[id] || null; }
  function estado(h) {
    var a = ajuste(h.id);
    if (a && a.saltar) return { ok: true, conv: a.motivo || "Convalidado por Claude." };
    var p = (DOC.pasos || {})[h.id];
    if (p && p.ok) return { ok: true, p: p };
    if (h.tipo === "auto" && autoOk(h.comprobar)) { guardarPaso(h.id, { ok: true, auto: true }); return { ok: true }; }
    return { ok: false, p: p || null };
  }
  function extras(i) { return (((DOC.claude || {}).extra) || []).filter(function (x) { return x && x.estacion === C.estaciones[i].id; }); }
  function hitosDe(i) { return C.estaciones[i].hitos.concat(extras(i).map(function (x) { return { id: x.id, tipo: "texto", titulo: x.titulo, como: x.texto, extra: true }; })); }
  function hecha(i) { return hitosDe(i).every(function (h) { return estado(h).ok; }); }
  function abierta(i) { for (var k = 0; k < i; k++) if (!hecha(k)) return false; return true; }
  function progreso() { var t = 0, n = 0; C.estaciones.forEach(function (e, i) { hitosDe(i).forEach(function (h) { t++; if (estado(h).ok) n++; }); }); return { n: n, t: t }; }
  function hechas() { return C.estaciones.filter(function (e, i) { return hecha(i); }).length; }

  // ── guardar (con cuenta, en su documento; en la demo, aquí)
  function guardar(campos) {
    Object.keys(campos).forEach(function (k) {
      if (campos[k] && typeof campos[k] === "object" && !Array.isArray(campos[k])) DOC[k] = Object.assign({}, DOC[k] || {}, campos[k]); else DOC[k] = campos[k];
    });
    if (DEMO || !M) { lsPoner("doc", DOC); return Promise.resolve(); }
    return M.academiaGuardar(campos);
  }
  var GUARDANDO = {};
  function guardarPaso(id, v) {
    if (GUARDANDO[id] || ((DOC.pasos || {})[id] || {}).ok) return;
    GUARDANDO[id] = true;
    guardar({ pasos: obj(id, Object.assign({ t: Date.now() }, v)) }).then(function () { GUARDANDO[id] = false; }, function () { GUARDANDO[id] = false; });
  }
  // cuánto lleva, en su documento: es lo que enseña crear.html junto a su nombre («Comandante de la Cero» o «4 de 8 sesiones»)
  function apuntarAvance() {
    if (DEMO || !M || !YO) return;
    var pr = progreso(), a = DOC.avance || {};
    var nuevo = { hitos: pr.n, de: pr.t, sesiones: hechas(), total: N, fin: pr.n >= pr.t };
    if (a.hitos === nuevo.hitos && a.de === nuevo.de && a.sesiones === nuevo.sesiones && a.total === nuevo.total && !!a.fin === nuevo.fin) return;
    guardar({ avance: nuevo }).catch(function () {});
  }

  // ── los enlaces de cada misión
  function enlace(b) {
    var per = "per=" + encodeURIComponent(G), m;
    if (b === "alistarse") return "alistarse.html?" + per + "&codigo=" + encodeURIComponent(C.codigo || "") + "&volver=academia";
    if (b === "nave") return "recluta.html?" + per;
    if ((m = /^diferido:(.+)$/.exec(b))) return "sesion.html?" + per + "&diferido=1&sem=" + encodeURIComponent(m[1]);
    if (b === "sim:consola") return "consola.html?demo=1";
    if (b === "sim:clase") return "sesion.html?per=" + encodeURIComponent(PER_DEMO);
    if (b === "sim:estudiante") return "recluta.html?simulacro=1&per=" + encodeURIComponent(PER_DEMO) + "&semana=10";
    return "recluta.html?" + per;
  }
  var ROTULO = { alistarse: "Alistarme", nave: "Abrir mi Nave", "sim:consola": "Abrir la consola de ensayo", "sim:clase": "Abrir la clase de ensayo",
                 "sim:estudiante": "Abrir la Nave en simulacro" };

  // ══════════════════════════════════════════ LAS PANTALLAS DE UNA SESIÓN
  // entrada (su personaje y su voz) → una idea por pantalla → «Ahora tú»: un hito por pantalla → sesión completada
  function pantallas(i) {
    var e = C.estaciones[i];
    return [{ t: "entrada" }].concat(e.bloques.map(function (b) { return { t: "idea", b: b }; }))
      .concat(hitosDe(i).map(function (h) { return { t: "hito", h: h }; })).concat([{ t: "fin" }]);
  }
  function primera() {
    var g = lsLeer("pos", null);
    if (g && g.s != null && g.s < N && abierta(g.s)) { PANT = Number(g.p) || 0; return g.s; }
    PANT = 0;
    for (var k = 0; k < N; k++) if (!hecha(k)) return k;
    return N - 1;
  }
  function recordar() { lsPoner("pos", { s: ACTUAL, p: PANT }); }

  function pintar() {
    if (ACTUAL == null) ACTUAL = primera();
    var P = pantallas(ACTUAL); if (PANT >= P.length) PANT = P.length - 1; if (PANT < 0) PANT = 0;
    // la de «completada» solo se alcanza con todo hecho
    if (P[PANT].t === "fin" && !hecha(ACTUAL)) PANT = P.length - 2;
    var pr = progreso(), fin = pr.n >= pr.t;
    app.innerHTML = '<main class="acd">' + cabecera(pr) + mapa(fin) + '<section class="acd-ses" id="acd-ses"></section>' +
      (fin ? finalHtml() : "") + '<details class="acd-claude" id="acd-claude"' + (lsLeer("claudeAbierto", false) ? " open" : "") + "></details></main>";
    pintarPantalla();
    pintarClaude(); apuntarAvance();
    Array.prototype.forEach.call(app.querySelectorAll("[data-ses]"), function (b) {
      b.onclick = function () { ACTUAL = Number(b.getAttribute("data-ses")); PANT = 0; recordar(); pintar(); irArriba(); };
    });
    var cl = $("#acd-claude"); if (cl) cl.addEventListener("toggle", function () { lsPoner("claudeAbierto", cl.open); });
  }
  function irArriba() { var s = $("#acd-ses"); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function cabecera(pr) {
    return '<header class="acd-cab"><div class="kicker">' + ico("estrella") + " STARGATE · formación del profesorado" + (C.organiza ? " · organiza " + esc(C.organiza.nombre) : "") + "</div><h1>" + esc(C.titulo) + "</h1>" +
      (pr ? '<div class="acd-prog"><div class="acd-barra"><i style="width:' + Math.round(100 * hechas() / N) + '%"></i></div><span><b>' + hechas() + "</b> de " + N + " sesiones" +
        (YO && YO.nombre ? " · " + esc(YO.nombre) : "") + (DEMO ? " · demostración: se guarda en este navegador" : "") + "</span></div>" : '<p class="acd-sub">' + esc(C.sub) + "</p>") +
      (SIN_GUARDAR ? '<p class="aviso malo">Ahora mismo tu avance no se puede guardar. Puedes leer las sesiones, pero los hitos no quedarán apuntados: cuéntaselo a Norberto (o prueba dentro de un rato).</p>' : "") + "</header>";
  }
  // el camino: lo hecho (para repasarlo) y la sesión en curso; lo demás, solo cuántas quedan
  function mapa(fin) {
    var cur = ACTUAL, html = "";
    C.estaciones.forEach(function (e, k) {
      if (!(hecha(k) || k === cur || (abierta(k) && k <= cur))) return;
      html += '<button type="button" class="acd-parada' + (k === cur ? " acd-on" : "") + (hecha(k) ? " acd-ok" : "") + '" data-ses="' + k + '"' + (k === cur ? ' aria-current="step"' : "") + ">" +
        '<span class="acd-n">' + (hecha(k) ? ico("hecho") : k + 1) + "</span><span><b>" + esc(e.titulo) + "</b><small>" + (hecha(k) ? "Hecha · repásala cuando quieras" : "Unos " + (e.min || 10) + " minutos") + "</small></span></button>";
    });
    var siguiente = null; for (var k = 0; k < N; k++) if (!hecha(k) && k !== cur && abierta(k)) { siguiente = k; break; }
    if (siguiente != null) html += '<button type="button" class="acd-parada" data-ses="' + siguiente + '"><span class="acd-n">' + (siguiente + 1) + "</span><span><b>" + esc(C.estaciones[siguiente].titulo) + "</b><small>Abierta: la siguiente</small></span></button>";
    var quedan = C.estaciones.filter(function (e, k) { return !abierta(k); }).length;
    if (quedan) html += '<p class="acd-quedan">' + ico("candado") + " Y " + (quedan === 1 ? "una sesión más, que se abre" : quedan + " sesiones más, que se abren") + " al terminar la anterior.</p>";
    if (fin) html += '<p class="acd-quedan acd-bien">' + ico("medalla") + " Academia completada.</p>";
    return '<nav class="acd-mapa" aria-label="Tus sesiones">' + html + "</nav>";
  }
  function finalHtml() {
    return '<section class="acd-final"><img src="assets/img/iconos/medalla.png" alt=""><div><div class="kicker">Academia completada</div><h2>' + esc(C.final.titulo) + "</h2><p>" + esc(C.final.texto) + "</p>" +
      '<div class="acd-botones"><a class="btn primary" href="consola.html">Ir a mi Nave de Comandante</a><a class="btn" href="guia.html">La guía del profesorado</a></div></div></section>';
  }
  function puntos(P) {
    return '<div class="acd-puntos" aria-hidden="true">' + P.map(function (x, k) {
      var hechoH = x.t === "hito" && estado(x.h).ok;
      return '<span class="' + (k === PANT ? "on" : k < PANT || hechoH ? "visto" : "") + (x.t === "hito" ? " h" : "") + '"></span>'; }).join("") + "</div>";
  }
  function pintarPantalla() {
    var i = ACTUAL, e = C.estaciones[i], P = pantallas(i), x = P[PANT], el = $("#acd-ses");
    var nHitos = hitosDe(i).length, primerHito = 1 + e.bloques.length;
    var cabS = '<div class="acd-ses-cab"><img class="acd-mini" src="' + esc(e.pj) + '" alt=""><div><div class="kicker">Sesión ' + (i + 1) + " de " + N + " · unos " + (e.min || 10) + " minutos</div><b>" + esc(e.titulo) + "</b></div>" + puntos(P) + "</div>";
    var cuerpo = "";
    if (x.t === "entrada") {
      cuerpo = '<div class="acd-heroe" style="background-image:linear-gradient(90deg,rgba(6,10,18,.95),rgba(6,10,18,.6) 58%,rgba(6,10,18,.2)),url(' + esc(e.bg) + ')">' +
        '<div class="acd-heroe-txt"><h2>' + esc(e.titulo) + '</h2><p class="acd-voz">«' + esc(e.voz) + "»<span>" + esc(e.quien) + "</span></p>" +
        '<p class="acd-que">' + esc(e.sub) + ". " + e.bloques.length + (e.bloques.length === 1 ? " píldora" : " píldoras") + " y " + (nHitos === 1 ? "un hito" : nHitos + " hitos") + ".</p></div>" +
        '<img class="acd-pj" src="' + esc(e.pj) + '" alt="' + esc(e.quien) + '"></div>';
    } else if (x.t === "idea") {
      var b = x.b;
      cuerpo = '<article class="acd-idea"><div class="kicker">Píldora ' + PANT + " de " + e.bloques.length + "</div><h2>" + esc(b.h) + "</h2><p>" + b.p + "</p>" +
        (b.botones ? '<div class="acd-botones">' + b.botones.map(function (y) { return '<a class="btn" href="' + esc(y[1]) + '" target="_blank" rel="noopener">' + esc(y[0]) + " ↗</a>"; }).join("") + "</div>" : "") + "</article>";
    } else if (x.t === "hito") {
      var nh = PANT - primerHito + 1;
      cuerpo = '<div class="acd-ahora"><div class="kicker">' + ico("diana") + " Ahora tú · " + nh + " de " + nHitos + '</div><div class="acd-hito" id="h-' + esc(x.h.id) + '"></div></div>';
    } else {
      var sig = i + 1 < N ? C.estaciones[i + 1] : null;
      cuerpo = '<div class="acd-hecha">' + '<img src="assets/img/iconos/hecho.png" alt="">' + "<div><h2>Sesión completada</h2>" +
        (sig ? "<p><b>¿Suficiente por hoy?</b> Puedes dejarlo aquí: cuando vuelvas, seguirás justo donde lo dejaste. La siguiente es <b>" + esc(sig.titulo) + "</b> (unos " + (sig.min || 10) + " minutos).</p>" +
               '<div class="acd-botones"><button class="btn primary" type="button" data-sig>Empezar la sesión ' + (i + 2) + " →</button></div>"
             : "<p>Era la última. Abajo tienes tu título.</p>") + "</div></div>";
    }
    var falta = x.t === "hito" && PANT + 1 === P.length - 1 && !hecha(i);
    var nav = x.t === "fin" ? '<div class="acd-nav"><button class="btn" type="button" data-ant>← Anterior</button><span></span></div>'
      : '<div class="acd-nav">' + (PANT > 0 ? '<button class="btn" type="button" data-ant>← Anterior</button>' : "<span></span>") +
        (falta ? '<span class="muted acd-falta">Te falta: ' + esc(hitosDe(i).filter(function (h) { return !estado(h).ok; }).map(function (h) { return h.titulo; }).join(" · ")) + "</span>"
               : '<button class="btn primary" type="button" data-sig-p>' + (x.t === "entrada" ? "Empezar →" : P[PANT + 1] && P[PANT + 1].t === "hito" && x.t === "idea" ? "Ahora tú →" : "Siguiente →") + "</button>") + "</div>";
    el.innerHTML = '<div class="acd-carta">' + cabS + '<div class="acd-pantalla">' + cuerpo + "</div>" + nav + "</div>";
    if (x.t === "hito") pintarHito(x.h);
    var ant = el.querySelector("[data-ant]"); if (ant) ant.onclick = function () { PANT--; recordar(); pintarPantalla(); };
    var sp = el.querySelector("[data-sig-p]"); if (sp) sp.onclick = function () { PANT++; recordar(); pintarPantalla(); };
    var sg = el.querySelector("[data-sig]"); if (sg) sg.onclick = function () { ACTUAL = i + 1; PANT = 0; recordar(); pintar(); irArriba(); };
  }
  /** Tras cumplir un hito: se repinta todo (el mapa y los puntos cambian) sin mover la pantalla en curso. */
  function trasHito() { pintar(); }

  // ── los hitos, uno por pantalla
  var RESP = {};   // cómo va cada cuestionario mientras se responde: { k: pregunta en curso, r: {k: elegida}, visto: bool }
  function pintarHito(h) {
    var el = document.getElementById("h-" + h.id); if (!el) return;
    var st = estado(h), cab = '<div class="acd-hito-cab"><span class="acd-marca' + (st.ok ? " acd-ok" : "") + '">' + (st.ok ? ico("hecho") : "") + "</span><h2>" + esc(h.titulo) + "</h2>" +
      (h.extra ? '<span class="chip">de Claude, para ti</span>' : "") + (st.conv ? '<span class="chip">convalidado</span>' : "") + "</div>";
    if (st.conv) { el.innerHTML = cab + '<p class="muted">' + esc(st.conv) + "</p>"; return; }
    if (h.tipo === "quiz") return pintarPreguntas(el, h, st, cab, h.preguntas.map(function (p) { return { p: p.p, o: p.o, ok: p.ok, porque: p.porque }; }));
    if (h.tipo === "clasificar") return pintarPreguntas(el, h, st, cab, h.items.map(function (it) {
      return { p: it[0], o: ["Componente", "Mecánica", "Dinámica"], ok: ["componente", "mecanica", "dinamica"].indexOf(it[1]), porque: it[2], fijo: true }; }));
    if (h.tipo === "diseno") return pintarDiseno(el, h, st, cab);
    if (h.tipo === "texto") return pintarTexto(el, h, st, cab);
    // auto: lo comprueba la plataforma (o el ensayo, en este navegador)
    var necesitaFicha = h.comprobar !== "alta" && !local(h.comprobar) && !FICHA && !DEMO;
    el.innerHTML = cab + "<p>" + h.como + "</p>" + (st.ok ? '<p class="acd-bien">Hecho. La plataforma lo ha comprobado.</p>' + (h.opinar ? opinarHtml(h) : "")
      : necesitaFicha ? '<p class="muted">Primero, alístate (sesión ' + (1 + C.estaciones.map(function (x) { return x.id; }).indexOf("alta")) + ').</p>'
      : '<div class="acd-botones">' + (h.boton ? '<a class="btn primary" href="' + esc(enlace(h.boton)) + '" target="' + (h.boton === "alistarse" ? "_self" : "_blank") + '" rel="noopener">' +
          esc(ROTULO[h.boton] || (/^diferido:/.test(h.boton) ? "Abrir la clase en diferido" : "Abrir")) + (h.boton === "alistarse" ? "" : " ↗") + "</a>" : "") +
        '<button class="btn" type="button" data-comprobar>Ya lo he hecho: comprobar</button>' + (DEMO ? '<button class="btn min" type="button" data-demo>Marcar (demo)</button>' : "") + '</div><p class="muted acd-aviso" hidden></p>');
    var bc = el.querySelector("[data-comprobar]");
    if (bc) bc.onclick = function () { comprobarDeNuevo(el, h); };
    var bd = el.querySelector("[data-demo]"); if (bd) bd.onclick = function () { lsPoner("demo." + h.comprobar, true); trasHito(); };
    enganchaOpinar(el, h);
  }
  function comprobarDeNuevo(el, h) {
    var av = el.querySelector(".acd-aviso"); if (av) { av.hidden = false; av.textContent = "Comprobando…"; }
    recargar().then(function () {
      if (estado(h).ok) trasHito();
      else if (av) av.textContent = local(h.comprobar) ? "Todavía no aparece. Hazlo en ESTE navegador (la misma ventana, otra pestaña) y vuelve a comprobar; si no llega, cuéntaselo a Claude, abajo."
        : "Todavía no aparece. Si acabas de hacerlo, espera unos segundos y vuelve a comprobar; si no llega, cuéntaselo a Claude, abajo.";
    });
  }
  /** El orden de las opciones: barajado, pero siempre el mismo para cada pregunta (en los datos, la buena va la primera). */
  function barajar(n, semilla) {
    var x = 2166136261; for (var i = 0; i < semilla.length; i++) { x ^= semilla.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; }
    var idx = []; for (var j = 0; j < n; j++) idx.push(j);
    for (var k = n - 1; k > 0; k--) { x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0; x = Math.imul(x ^ (x >>> 13), 3266489909) >>> 0; x = (x ^ (x >>> 16)) >>> 0; var m = x % (k + 1), t = idx[k]; idx[k] = idx[m]; idx[m] = t; }
    return idx;
  }
  /**
   * Los cuestionarios y el «¿componente, mecánica o dinámica?», PREGUNTA A PREGUNTA: se elige, se ve al momento si es la
   * buena y su porqué, y se pasa a la siguiente. Al final, la cuenta: con el mínimo, superado; si no, se lee y se repite.
   */
  function pintarPreguntas(el, h, st, cab, Q) {
    if (st.ok) { el.innerHTML = cab + '<p class="acd-bien">Superado' + (st.p && st.p.nota != null ? ": " + st.p.nota + " de " + Q.length : "") + ".</p>"; return; }
    var R = RESP[h.id] = RESP[h.id] || { k: 0, r: {}, visto: false };
    if (R.k >= Q.length) {   // la cuenta
      var bien = Q.filter(function (x, k) { return R.r[k] === x.ok; }).length, pasa = bien >= h.minimo;
      el.innerHTML = cab + '<p class="acd-cuenta"><b>' + bien + " de " + Q.length + "</b>" + (pasa ? ": ¡superado!" : ". Necesitas " + h.minimo + ".") + "</p>" +
        (pasa ? "" : '<div class="acd-botones"><button class="btn primary" type="button" data-otra>Volver a intentarlo</button></div>');
      if (pasa) { if (!R.guardado) { R.guardado = true; guardar({ pasos: obj(h.id, { ok: true, t: Date.now(), nota: bien }) }).then(function () { setTimeout(trasHito, 900); }); } }
      else {
        if (!R.guardado) { R.guardado = true; guardar({ pasos: obj(h.id, { ok: false, t: Date.now(), nota: bien, intentos: (((DOC.pasos || {})[h.id] || {}).intentos || 0) + 1 }) }); }
        el.querySelector("[data-otra]").onclick = function () { RESP[h.id] = { k: 0, r: {}, visto: false }; pintarHito(h); };
      }
      return;
    }
    var x = Q[R.k], orden = x.fijo ? x.o.map(function (_, n) { return n; }) : barajar(x.o.length, h.id + ":" + R.k), elegida = R.r[R.k];
    el.innerHTML = cab + '<p class="muted acd-qn">Pregunta ' + (R.k + 1) + " de " + Q.length + " · necesitas " + h.minimo + "</p>" +
      '<p class="acd-q">' + esc(x.p) + "</p>" +
      '<div class="acd-ops' + (x.fijo ? " acd-ops3" : "") + '">' + orden.map(function (n) {
        var cls = R.visto ? (n === x.ok ? " acd-bien-op" : n === elegida ? " acd-mal-op" : "") : "";
        return '<button type="button" class="acd-op' + cls + '" data-o="' + n + '"' + (R.visto ? " disabled" : "") + ">" + esc(x.o[n]) + "</button>"; }).join("") + "</div>" +
      (R.visto ? '<p class="acd-porque">' + (elegida === x.ok ? "Bien. " : "No. ") + esc(x.porque) + '</p><div class="acd-botones"><button class="btn primary" type="button" data-sigq>' + (R.k + 1 < Q.length ? "Siguiente pregunta →" : "Ver cómo me ha ido →") + "</button></div>" : "");
    Array.prototype.forEach.call(el.querySelectorAll(".acd-op"), function (b) { b.onclick = function () { R.r[R.k] = Number(b.getAttribute("data-o")); R.visto = true; pintarHito(h); }; });
    var s = el.querySelector("[data-sigq]"); if (s) { s.onclick = function () { R.k++; R.visto = false; pintarHito(h); }; s.focus(); }
  }
  function pintarDiseno(el, h, st, cab) {
    var d = DOC.diseno || {};
    el.innerHTML = cab + (st.ok ? '<p class="acd-bien">Enviado. Claude te lo comenta en su revisión diaria (abajo, «Claude, cada día»).</p>' : "<p>Una pieza pequeña para tu aula, pensada al revés de como se juega: del objetivo a la pieza.</p>") +
      '<div class="acd-form">' + h.campos.map(function (c) {
        return '<label><span><b>' + esc(c[1]) + "</b> " + esc(c[2]) + '</span><textarea rows="2" maxlength="600" data-c="' + c[0] + '">' + esc(d[c[0]] || "") + "</textarea></label>";
      }).join("") + '</div><div class="acd-botones"><button class="btn primary" type="button" data-env>' + (st.ok ? "Actualizar" : "Enviar mi diseño") + '</button><span class="muted" data-res></span></div>';
    el.querySelector("[data-env]").onclick = function () {
      var v = {}, falta = null;
      Array.prototype.forEach.call(el.querySelectorAll("[data-c]"), function (t) { v[t.getAttribute("data-c")] = t.value.trim(); if (t.value.trim().length < 12 && !falta) falta = t; });
      if (falta) { el.querySelector("[data-res]").textContent = "Completa cada campo con una frase, por lo menos."; falta.focus(); return; }
      v.t = Date.now();
      guardar({ diseno: v, pasos: obj(h.id, { ok: true, t: Date.now() }) }).then(trasHito, function () { el.querySelector("[data-res]").textContent = "No se ha podido guardar. Prueba otra vez."; });
    };
  }
  function pintarTexto(el, h, st, cab) {
    var p = st.p || {};
    el.innerHTML = cab + "<p>" + esc(h.como) + "</p>" + (st.ok ? '<p class="acd-bien">Hecho.</p>' : "") +
      '<textarea rows="3" maxlength="1200" class="acd-area" aria-label="Tu respuesta">' + esc(p.texto || "") + '</textarea><div class="acd-botones"><button class="btn primary" type="button" data-env>' + (st.ok ? "Actualizar" : "Enviar") + "</button></div>";
    el.querySelector("[data-env]").onclick = function () {
      var t = el.querySelector("textarea").value.trim(); if (t.length < 8) return;
      guardar({ pasos: obj(h.id, { ok: true, t: Date.now(), texto: t.slice(0, 1200) }) }).then(trasHito);
    };
  }
  // la dificultad de cada juego (Norberto: «si prueban los juegos darán su feedback al jugar, si es fácil, difícil…»)
  function opinarHtml(h) {
    var ya = Object.keys(DOC.feedback || {}).map(function (k) { return DOC.feedback[k]; }).filter(function (f) { return f && f.hito === h.id; })[0];
    return '<div class="acd-opinar" data-op="' + esc(h.id) + '"><b>¿Cómo te ha resultado?</b>' + (ya ? ' <span class="muted">Gracias: «' + esc(ya.nivel || "") + "»" + (ya.texto ? ", " + esc(ya.texto) : "") + ".</span>" :
      '<div class="acd-ops acd-ops3">' + ["Fácil", "Justo", "Difícil"].map(function (n) { return '<button type="button" class="acd-op" data-nivel="' + n + '">' + n + "</button>"; }).join("") + "</div>" +
      '<textarea rows="2" maxlength="600" placeholder="Lo que te ha gustado, lo que no y lo que cambiarías (opcional)" aria-label="Tu opinión"></textarea><div class="acd-botones"><button class="btn" type="button" data-env>Enviar mi opinión</button></div>') + "</div>";
  }
  function enganchaOpinar(el, h) {
    var c = el.querySelector("[data-op]"); if (!c || !c.querySelector("[data-env]")) return;
    var nivel = "";
    Array.prototype.forEach.call(c.querySelectorAll("[data-nivel]"), function (b) { b.onclick = function () { nivel = b.getAttribute("data-nivel"); Array.prototype.forEach.call(c.querySelectorAll("[data-nivel]"), function (x) { x.classList.toggle("acd-sel", x === b); }); }; });
    c.querySelector("[data-env]").onclick = function () {
      if (!nivel) return;
      guardar({ feedback: obj(String(Date.now()), { tipo: "juego", hito: h.id, nivel: nivel, texto: c.querySelector("textarea").value.trim().slice(0, 600), t: Date.now() }) }).then(function () { pintarHito(h); });
    };
  }

  // ── Claude: sus respuestas, tus preguntas, «algo no funciona» y tus ideas (plegado: se abre cuando hace falta)
  function pintarClaude() {
    var el = document.getElementById("acd-claude"); if (!el) return;
    var cl = (DOC.claude || {}).mensajes || {}, pr = DOC.preguntas || {}, fb = DOC.feedback || {}, L = [];
    Object.keys(cl).forEach(function (k) { L.push({ t: Number(cl[k].t) || Number(k) || 0, de: "claude", x: cl[k].texto }); });
    Object.keys(pr).forEach(function (k) { L.push({ t: Number(k) || 0, de: "tu", x: pr[k].texto }); });
    var NOMBRE_FB = { fallo: "Algo no funciona", idea: "Una idea", otra: "Otra cosa" };
    Object.keys(fb).forEach(function (k) { if (fb[k] && fb[k].tipo !== "juego") L.push({ t: Number(k) || 0, de: "tu", x: "[" + (NOMBRE_FB[fb[k].tipo] || "Nota") + "] " + fb[k].texto }); });
    L.sort(function (a, b) { return a.t - b.t; });
    var deClaude = Object.keys(cl).length, visto = Number(lsLeer("claudeVisto", 0)) || 0, nuevos = Object.keys(cl).filter(function (k) { return (Number(cl[k].t) || Number(k)) > visto; }).length;
    el.innerHTML = '<summary><h2>' + ico("mensaje") + " Claude, cada día" + (nuevos ? ' <span class="chip">' + nuevos + (nuevos === 1 ? " mensaje nuevo" : " mensajes nuevos") + "</span>" : deClaude ? ' <span class="muted acd-cuantos">' + deClaude + (deClaude === 1 ? " mensaje" : " mensajes") + "</span>" : "") + "</h2>" +
      '<span class="muted">Una duda, algo que no funciona o una idea: una vez al día, Claude lo lee y te contesta.</span></summary>' +
      '<p class="muted">Claude es la IA con la que Norberto ha construido STARGATE. Responde tus dudas, comenta tu diseño y tu imagen, apunta lo que no funcione y, si hace falta, adapta tu camino.</p>' +
      '<div class="acd-hilo">' + (L.length ? L.map(function (m) {
        return '<div class="acd-msj ' + (m.de === "claude" ? "acd-de-claude" : "acd-de-ti") + '"><b>' + (m.de === "claude" ? "Claude" : "Tú") + " <small>" + (m.t ? new Date(m.t).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "") + "</small></b><p>" + esc(m.x || "").replace(/\n/g, "<br>") + "</p></div>";
      }).join("") : '<p class="muted">Todavía no hay mensajes. Pregunta lo que quieras.</p>') + "</div>" +
      (YO || DEMO ? '<div class="acd-escribir"><div class="acd-ops acd-ops4" role="radiogroup" aria-label="Qué es">' + [["pregunta", "Una duda"], ["fallo", "Algo no funciona"], ["idea", "Una idea"], ["otra", "Otra cosa"]].map(function (o, k) {
        return '<button type="button" class="acd-op' + (k === 0 ? " acd-sel" : "") + '" data-tipo="' + o[0] + '" role="radio" aria-checked="' + (k === 0) + '">' + o[1] + "</button>"; }).join("") + "</div>" +
        '<textarea rows="3" maxlength="1200" placeholder="Escribe aquí. Si algo falla: qué pulsaste, qué esperabas y qué pasó." id="acd-txt" aria-label="Tu mensaje para Claude"></textarea><div class="acd-botones"><button class="btn primary" type="button" id="acd-env">Enviar a Claude</button><span class="muted" id="acd-env-st" aria-live="polite"></span></div></div>' : "");
    if (el.open && deClaude) lsPoner("claudeVisto", Date.now());
    el.addEventListener("toggle", function () { if (el.open) lsPoner("claudeVisto", Date.now()); });
    var tipo = "pregunta";
    Array.prototype.forEach.call(el.querySelectorAll("[data-tipo]"), function (b) { b.onclick = function () { tipo = b.getAttribute("data-tipo"); Array.prototype.forEach.call(el.querySelectorAll("[data-tipo]"), function (x) { x.classList.toggle("acd-sel", x === b); x.setAttribute("aria-checked", String(x === b)); }); }; });
    var env = document.getElementById("acd-env");
    if (env) env.onclick = function () {
      var t = document.getElementById("acd-txt").value.trim(), st = document.getElementById("acd-env-st"); if (!t) { st.textContent = "Escribe algo primero."; return; }
      var k = String(Date.now()), est = C.estaciones[ACTUAL] ? C.estaciones[ACTUAL].id : "";
      env.disabled = true; st.textContent = "Enviando…";
      (tipo === "pregunta" ? guardar({ preguntas: obj(k, { texto: t.slice(0, 1200), estacion: est }) }) : guardar({ feedback: obj(k, { tipo: tipo, texto: t.slice(0, 1200), estacion: est, t: Date.now() }) }))
        .then(function () { pintarClaude(); }, function () { env.disabled = false; st.textContent = "No se ha podido enviar. Prueba otra vez."; });
    };
  }

  // ══════════════════════════════════════════ ARRANCAR
  /**
   * 🔴 29-sep · AL ENTRAR, DOCENTE Y RECLUTA A LA VEZ. Norberto: «que cualquiera que lo abra e inicie sesión con Google se
   * registre como docente y a la vez como estudiante del curso». Docente: su documento en stargate_formacion (lo que crear.html
   * ofrece con un tic). Recluta: se le alista SOLO en el grupo de la Academia, con su nombre de pila de alias (si está cogido,
   * con la inicial del apellido o un número) y en el escuadrón de quien organiza: el mismo `alistar` que la puerta del alumnado.
   * Si algo falla, la sesión «Tu Nave de recluta» ofrece el alta a mano.
   */
  function alistarAuto() {
    if (DEMO || !M || !YO || FICHA || !M.alistar || !M.aliasOcupado) return Promise.resolve();
    var limpio = function (t) { return String(t || "").replace(/[^A-Za-zÀ-ÿ0-9 ]+/g, " ").replace(/\s+/g, " ").trim(); };
    var partes = limpio(YO.nombre || String(YO.correo || "").split("@")[0]).split(" ").filter(Boolean);
    var base = (partes[0] || "Docente").slice(0, 18), ini = partes[1] ? " " + partes[1].charAt(0).toUpperCase() : "";
    var candidatos = [base, base + ini, base + ini + " 2", base + " " + (100 + Math.floor(Math.random() * 900))];
    var probar = function (k) {
      if (k >= candidatos.length) return Promise.resolve();
      var alias = candidatos[k].slice(0, 24);
      return M.aliasOcupado(G, alias, { uid: YO.uid }).then(function (ocupado) {
        if (ocupado) return probar(k + 1);
        return M.alistar(G, { alias: alias, comandante: (C.organiza && C.organiza.nombre) || "", avatar: null, bio: "",
          nombre: partes[0] || "", apellidos: partes.slice(1).join(" "), correo: YO.correo, bitacora: "" });
      });
    };
    return probar(0).catch(function (e) { console.warn("[Academia] no se ha podido alistar solo:", e && e.message); });
  }
  /** Su ficha en el grupo de la Academia (si ya se ha alistado): lo que hace falta para comprobar las misiones. */
  function recargar() {
    if (DEMO || !M || !YO) return Promise.resolve();
    return M.misGruposDeAlumno(YO.uid).then(function (gs) {
      var g = (gs || []).filter(function (x) { return x.per === G; })[0];
      FICHA = g ? { id: g.ficha } : null;
      if (!FICHA) { PERFIL = null; return; }
      return M.getDoc(M.doc(M.db, "student_profiles", FICHA.id)).then(function (d) { PERFIL = d.exists() ? d.data() : null; });
    }).catch(function () {});
  }
  function portadaSinCuenta() {
    var total = C.estaciones.reduce(function (s, e) { return s + (e.min || 10); }, 0);
    app.innerHTML = '<main class="acd">' + cabecera(null) +
      '<section class="acd-ses"><div class="acd-carta"><div class="acd-pantalla"><div class="acd-heroe" style="background-image:linear-gradient(90deg,rgba(6,10,18,.95),rgba(6,10,18,.55)),url(assets/img/fondos/p1_forge_llegada.webp)"><div class="acd-heroe-txt">' +
      "<h2>" + N + " sesiones cortas, a tu ritmo</h2><p class=\"acd-voz\">«Primero la historia y su porqué; después te alistarás como tu alumnado, darás una clase de ensayo y la harás tuya. Una sesión cada vez.»<span>NEBULA</span></p>" +
      '<p class="acd-que">Unas ' + Math.round(total / 60) + " horas en total, repartidas como quieras: cada sesión se abre al terminar la anterior, y siempre sigues donde lo dejaste.</p>" +
      '<div class="acd-botones"><button type="button" class="btn primary grande btn-google" id="acd-entrar">' + ((window.SG && window.SG.LOGO_G) || "") + "<span>Entrar con mi cuenta de Google</span></button></div>" +
      '<p class="acd-nota">' + ico("candado") + " Al entrar quedas <b>registrado como docente</b> de STARGATE y <b>alistado como recluta</b> en el grupo de la Academia, para vivirla como tu alumnado. <b>Tus estudiantes nunca verán tu correo:</b> si lo prefieres, usa una cuenta personal.</p></div>" +
      '<img class="acd-pj" src="assets/img/personajes/nebula.png" alt="NEBULA"></div></div></div></section></main>';
    var b = document.getElementById("acd-entrar");
    if (b) b.onclick = function () { b.disabled = true; M.entrar().then(function () { location.reload(); }, function (e) { b.disabled = false; if (window.SG && window.SG.avisar) window.SG.avisar("No se ha podido entrar", String((e && e.message) || e)); }); };
  }
  function escribiendo() { return document.activeElement && document.activeElement.tagName === "TEXTAREA"; }
  // lo que se practica en otra pestaña de este navegador (la consola, la clase, la Nave) marca sus hitos al momento
  window.addEventListener("storage", function (e) { if (e.key === "sgAcademia" && !escribiendo()) pintar(); });
  // y al volver a esta pestaña, se mira otra vez la ficha (la Ruta, el Simulador y los retos los apunta el servidor)
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && !DEMO && YO && !escribiendo()) recargar().then(pintar);
  });

  function arrancar() {
    M = window.SG && window.SG.MOTOR;
    if (DEMO) { DOC = lsLeer("doc", { pasos: {} }); pintar(); return; }
    if (!M) { app.innerHTML = '<main class="acd"><p>No se ha podido abrir la Academia.</p></main>'; return; }
    M.sesion().then(function (yo) {
      YO = yo;
      if (!yo) return portadaSinCuenta();
      return recargar().then(function () { if (!FICHA) return alistarAuto().then(recargar); }).then(function () {
        var primeraVez = true;
        M.academiaEscuchar(function (d, err) {
          if (err) { SIN_GUARDAR = true; if (primeraVez) { primeraVez = false; pintar(); } return; }
          SIN_GUARDAR = false;
          DOC = d || { pasos: {} };
          // 🔴 entrar ES registrarse: su documento nace al entrar (con su nombre y su correo de Google), aunque no haga nada más
          if (primeraVez) { primeraVez = false; if (!d) guardar({ alias: (yo.nombre || "").split(" ")[0] || "" }).catch(function () {}); }
          if (!escribiendo()) pintar(); else pintarClaude();
        });
      });
    }).catch(function (e) { app.innerHTML = '<main class="acd"><p>No se ha podido abrir la Academia: ' + esc((e && e.message) || e) + "</p></main>"; });
  }
  if (DEMO || (window.SG && window.SG.MOTOR)) arrancar(); else document.addEventListener("sg:motor", arrancar);
})();
