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
  var VIDEO = function (n) { var v = (window.SG_TUTORIALES || {})[n]; return "assets/video/tutoriales/" + n + ".mp4" + (v ? "?v=" + v : ""); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ico(k) { return '<img class="ico" src="assets/img/iconos/p/' + k + '.png" alt="" width="20" height="20">'; }
  function lsLeer(k, d) { try { var v = localStorage.getItem(LS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsPoner(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {} }
  function obj(k, v) { var o = {}; o[k] = v; return o; }
  function $(s) { return app.querySelector(s); }

  // ── el ENSAYO: lo que se ha practicado en este navegador (SG.rastroAcademia, en stargate.js)
  function rastro() { try { return JSON.parse(localStorage.getItem("sgAcademia") || "{}") || {}; } catch (e) { return {}; } }
  function claseEntera(x) { return !!x && Number(x.total) > 3 && Number(x.max) >= Number(x.total) - 1; }
  // 30-sep · lo que se ha HECHO en la consola de ensayo (validar, anular, un mensaje, la Cola de nota, un premio): lo apunta su
  // Firebase de mentira (assets/js/sim/firebase_sim.js) en ESTE navegador, y no se borra con «Empezar de cero»
  function hechosEnsayo() { try { return JSON.parse(localStorage.getItem("sgEnsayo.hechos") || "{}") || {}; } catch (e) { return {}; } }
  function simOk(c) {
    var R = rastro(), m;
    if (c === "ens:puente") return !!(R.consola || {}).portada;
    if (c === "ens:ficha") return !!(R.consola || {}).ficha;
    if (c === "ens:simulador") return !!(R.consola || {}).simulador;
    if ((m = /^tab:(.+)$/.exec(c))) return !!(R.consola || {})[m[1]];   // 5-oct · has abierto esa pestaña en la consola de ensayo
    if ((m = /^ens:(.+)$/.exec(c))) return !!hechosEnsayo()[m[1]];
    if (c === "sim:consola") { var v = R.consola || {}; return !!(v.portada && v.alumnado && v.retos && v.rankings && v.ficha); }
    if (c === "sim:clase") return Object.keys(R.clase || {}).some(function (k) { return k.indexOf(PER_DEMO + ":") === 0 && claseEntera(R.clase[k]); });
    if (c === "sim:estudiante") return !!R.estudiante;
    if (c === "sim:rueda") return !!R.rueda;
    if (c === "sim:panel") return !!R.panel;
    if (c === "nave") return !!R.nave;
    if ((m = /^dif:(.+)$/.exec(c))) { var x = (R.clase || {})[G + ":" + m[1]]; return !!(x && x.dif) && claseEntera(x); }
    return false;
  }
  function local(c) { return String(c).split("+").every(function (x) { return /^(sim|dif|ens|tab):/.test(x) || x === "nave"; }); }
  // ── lo que la plataforma sabe de su ficha en el grupo de la Academia
  function autoOk(c) {
    if (String(c).indexOf("+") > 0 && !(DEMO && lsLeer("demo." + c, false))) return String(c).split("+").every(autoOk);   // (todas sus partes)
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
    if (a && a.saltar) return { ok: true, conv: a.motivo || "Convalidado por NEBULA." };
    var p = (DOC.pasos || {})[h.id];
    if (p && p.ok) return { ok: true, p: p };
    if (h.tipo === "auto" && autoOk(h.comprobar)) { guardarPaso(h.id, { ok: true, auto: true }); return { ok: true }; }
    return { ok: false, p: p || null };
  }
  function extras(i) { return (((DOC.claude || {}).extra) || []).filter(function (x) { return x && x.estacion === C.estaciones[i].id; }); }
  function hitoJuego(e) { return { id: e.id + "-juego", tipo: "juego", opcional: true, titulo: "Repaso jugando (opcional)", maquina: e.juego.maquina, n: e.juego.n }; }
  function hitosDe(i) {
    var e = C.estaciones[i];
    return e.hitos.concat(e.juego ? [hitoJuego(e)] : []).concat(extras(i).map(function (x) { return { id: x.id, tipo: "texto", titulo: x.titulo, como: x.texto, extra: true }; }));
  }
  function hecha(i) { return hitosDe(i).every(function (h) { return h.opcional || estado(h).ok; }); }
  function abierta(i) { return true; }   // 5-oct · todas abiertas: cada parada sirve sola
  function progreso() { var t = 0, n = 0; C.estaciones.forEach(function (e, i) { hitosDe(i).forEach(function (h) { if (h.opcional) return; t++; if (estado(h).ok) n++; }); }); return { n: n, t: t }; }
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
  // cuánto lleva, en su documento: es lo que enseña crear.html junto a su nombre («Comandante de La Constancia» o «4 de 9 sesiones»)
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
    if (b === "sim:consola") return "ensayo.html";
    if ((m = /^ensayo:(.+)$/.exec(b))) return "ensayo.html?tab=" + encodeURIComponent(m[1]);
    if (b === "sim:clase") return "sesion.html?per=" + encodeURIComponent(PER_DEMO);
    if (b === "sim:estudiante") return "recluta.html?simulacro=1&per=" + encodeURIComponent(PER_DEMO) + "&semana=10";
    return "recluta.html?" + per;
  }
  var ROTULO = { alistarse: "Alistarme", nave: "Abrir mi Nave", "sim:consola": "Abrir la consola de ensayo", "sim:clase": "Abrir la sesión de ensayo",
                 "sim:estudiante": "Abrir el simulador del estudiante" };

  // ══════════════════════════════════════════ LAS PANTALLAS DE UNA SESIÓN
  // 30-sep · COMO LAS CLASES EN DIRECTO (Norberto: las diapositivas de la Academia eran «una CACA comparadas con las sesiones en
  // vivo, tan visuales»). Cada planeta: la llegada (su fondo, su tema y su tripulante) → su historia en dos frases → las piezas
  // de la herramienta (NEBULA o el Capitán las cuentan) → «Ahora tú»: un hito por pantalla (la misión en la consola de ensayo y
  // lo real) → sus preguntas DENTRO de un minijuego → planeta completado. El prólogo (a bordo de La Constancia) no tiene tripulante ni juego.
  function pantallas(i) {
    var e = C.estaciones[i], P = [{ t: "llegada" }];
    if (e.retrato) P.push({ t: "historia" });
    e.piezas.forEach(function (b, k) { P.push({ t: "pieza", b: b, k: k }); });
    hitosDe(i).forEach(function (h) { P.push({ t: "hito", h: h }); });
    return P.concat([{ t: "fin" }]);
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
    EN_LISTA = false;
    app.innerHTML = '<main class="acd">' + (ORG ? pestanasOrg("curso") : VIGIA ? pestanasVigia("curso") : "") + cabecera(pr) + mapa(fin) + '<section class="acd-ses" id="acd-ses"></section>' +
      (fin ? finalHtml() : "") + "</main>";
    document.body.classList.remove("acd-jugando");
    montarFlota();
    if (ORG) engancharPestanas();
    if (VIGIA) engancharVigia();
    pintarPantalla();
    pintarClaude(); apuntarAvance();
    Array.prototype.forEach.call(app.querySelectorAll("[data-ses]"), function (b) {
      b.onclick = function () { ACTUAL = Number(b.getAttribute("data-ses")); PANT = 0; VOLT[ACTUAL] = false; recordar(); pintar(); irArriba(); };
    });
  }
  function irArriba() { var s = $("#acd-ses"); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function cabecera(pr) {
    return '<header class="acd-cab"><div class="kicker">' + ico("estrella") + " STARGATE · formación del profesorado" + (C.organiza ? " · organiza " + esc(C.organiza.nombre) : "") + "</div><h1>" + esc(C.titulo) + "</h1>" +
      (pr ? '<div class="acd-prog"><div class="acd-barra"><i style="width:' + Math.round(100 * hechas() / N) + '%"></i></div><span><b>' + hechas() + "</b> de " + N + " paradas" +
        (YO && YO.nombre ? " · " + esc(YO.nombre) : "") + (VER ? " · vista de quien organiza: lo que hagas se guarda en este navegador" : DEMO ? " · demostración: se guarda en este navegador" : "") + "</span></div>" : '<p class="acd-sub">' + esc(C.sub) + "</p>") +
      (SIN_GUARDAR ? '<p class="aviso malo">Ahora mismo tu avance no se puede guardar. Puedes leer las paradas, pero las prácticas no quedarán apuntados: cuéntaselo a Norberto (o prueba dentro de un rato).</p>' : "") + "</header>";
  }
  // el camino: lo hecho (para repasarlo) y la sesión en curso; lo demás, solo cuántas quedan
  function mapa(fin) {
    var cur = ACTUAL, html = "";
    C.estaciones.forEach(function (e, k) {
      // 5-oct · las ocho, siempre a la vista: cada parada sirve sola
      html += '<button type="button" class="acd-parada' + (k === cur ? " acd-on" : "") + (hecha(k) ? " acd-ok" : "") + '" data-ses="' + k + '"' + (k === cur ? ' aria-current="step"' : "") + ">" +
        '<span class="acd-n">' + (hecha(k) ? ico("hecho") : k + 1) + "</span><span><b>" + esc(e.titulo) + "</b><small>" + (hecha(k) ? "Hecha · repásala cuando quieras" : "Unos " + (e.min || 10) + " minutos") + "</small></span></button>";
    });
    if (fin) html += '<p class="acd-quedan acd-bien">' + ico("medalla") + " Academia completada.</p>";
    return '<nav class="acd-mapa" aria-label="Tus paradas">' + html + "</nav>";
  }
  function finalHtml() {
    return '<section class="acd-final"><img src="assets/img/iconos/medalla.png" alt=""><div><div class="kicker">Academia completada</div><h2>' + esc(C.final.titulo) + "</h2><p>" + esc(C.final.texto) + "</p>" +
      '<div class="acd-botones"><a class="btn primary" href="consola.html">Ir a mi Nave de Comandante</a><a class="btn" href="guia.html">La guía del profesorado</a></div></div></section>';
  }
  var POSE = { nebula: "assets/img/personajes/nebula.png", "capitan:senala": "assets/img/capitan/senala.png", "capitan:tablet": "assets/img/capitan/tablet.png",
               "capitan:saluda": "assets/img/capitan/saluda.png", "capitan:brazos": "assets/img/capitan/brazos.png", "capitan:pulgar": "assets/img/capitan/pulgar.png",
               "capitan:pensativo": "assets/img/capitan/pensativo.png" };
  var MAQ = { conquista: "maq_conquista", evacuacion: "maq_evacuacion", laberinto: "maq_laberinto", "ruta-azul": "maq_rutaazul", descenso: "maq_descenso" };
  function fondo(url, clase) { return '<div class="acd-dia-fondo' + (clase ? " " + clase : "") + '" style="background-image:url(' + esc(url) + ')"></div>'; }
  function botonesDe(b) { return b.botones ? '<div class="acd-botones">' + b.botones.map(function (y) { return '<a class="btn" href="' + esc(y[1]) + '" target="_blank" rel="noopener">' + esc(y[0]) + " ↗</a>"; }).join("") + "</div>" : ""; }
  function esReal(h) { return h.tipo === "auto" && !local(h.comprobar); }
  function barraPasos(P) {
    return '<div class="acd-dia-barra" aria-hidden="true">' + P.map(function (x, k) {
      var hechoH = x.t === "hito" && estado(x.h).ok;
      return '<i class="' + (k === PANT ? "on" : k < PANT || hechoH ? "past" : "") + (x.t === "hito" ? " h" : "") + '"></i>'; }).join("") + "<b>" + (PANT + 1) + " / " + P.length + "</b></div>";
  }
  /**
   * 1-oct · LA FLECHA APAGADA SE EXPLICA (Caridad Sierra: «al superar el juego no puedo acceder a la última diapositiva»).
   * La última de cada sesión se abre al completar sus hitos; el aviso iba DEBAJO de la diapositiva, en gris, y en un portátil
   * no se veía. Ahora va encima, a la vista, con un botón que lleva a cada misión que falta.
   */
  function faltaHtml(i, P) {
    var botones = P.map(function (x, k) { return x.t === "hito" && !x.h.opcional && !estado(x.h).ok ? '<button type="button" class="btn primary" data-ir="' + k + '">' + esc(x.h.titulo) + " →</button>" : ""; }).join("");
    return '<div class="acd-falta-caja">' + ico("candado") + " <b>Para cerrar «" + esc(C.estaciones[i].titulo) + "» te falta:</b>" + '<div class="acd-botones">' + botones + "</div></div>";
  }
  function primeraQueFalta(i) { var P = pantallas(i); for (var k = 0; k < P.length; k++) if (P[k].t === "hito" && !P[k].h.opcional && !estado(P[k].h).ok) return k; return P.length - 1; }
  var JUGANDO = false;
  /**
   * 3-oct · EL MOVIMIENTO, COMO EN LA SESIÓN DE CLASE (Norberto: «las sesiones de la Academia no tienen animaciones como el resto
   * de sesiones; ¿les das un lavado de cara?»). El mismo kit (las cartas y la pista de stargate.css, los sonidos de fiesta.js):
   *   · cada pantalla NUEVA entra: el fondo se asienta, el texto sube escalonado, NEBULA o el Capitán llegan por su lado y el
   *     bocadillo salta (`acd-entra`). Solo al cambiar de pantalla: responder, cumplir un hito o abrir la ayuda la repintan y
   *     no debe volver a moverse todo;
   *   · la carta del tripulante llega BOCA ABAJO («¿Quién es?»), como la verá su alumnado en clase: se voltea pulsándola, con →
   *     o con R. Al volver atrás, ya volteada;
   *   · al cerrar un planeta, chispas y la fanfarria de misión (una vez);
   *   · sonido: la página al pasar, el volteo y la misión. M o el altavoz lo quitan (la misma preferencia de toda la web).
   * Con «reducir movimiento» no se mueve nada y la carta se voltea igual.
   */
  var VISTA = "", VOLT = {}, FESTEJO = {};
  function sonar(n, ms) { var F = window.SG && window.SG.FIESTA; if (!F || !F.sonar) return; if (ms) setTimeout(function () { F.sonar(n); }, ms); else F.sonar(n); }
  function suena() { var F = window.SG && window.SG.FIESTA; return !F || !F.suena || F.suena(); }
  var IC_SON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IC_MUDO = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function botonSon() { var t = suena() ? "Quitar el sonido" : "Poner el sonido"; return '<button type="button" class="acd-son-b' + (suena() ? "" : " mudo") + '" data-son title="' + t + ' (M)" aria-label="' + t + '">' + (suena() ? IC_SON : IC_MUDO) + "</button>"; }
  function alternarSon() {
    try { localStorage.setItem("sgSonido", suena() ? "no" : "si"); } catch (e) {}
    var b = app.querySelector("[data-son]"); if (b) { b.outerHTML = botonSon(); b = app.querySelector("[data-son]"); if (b) b.onclick = alternarSon; }
    if (suena()) sonar("pop");
  }
  /** La carta del tripulante: boca abajo hasta que se voltea (se queda volteada mientras no se salga del planeta). */
  function cartaTrip(e, i) {
    var on = !!VOLT[i];
    return '<div class="acd-carta-trip carta' + (on ? " on" : "") + '" data-f="1" data-revelable role="button" tabindex="0" aria-label="Voltear la carta">' +
      '<div class="carta-giro"><div class="carta-a" aria-hidden="' + on + '"><div class="carta-dorso"><span class="cd-sello"><img src="assets/img/iconos/p/pregunta.png" alt=""></span>' +
      '<b class="cd-txt">¿Quién es?</b><span class="rev-pista"><img class="ico" src="assets/img/iconos/p/ojo.png" alt=""> Pulsa para descubrirlo</span></div></div>' +
      '<div class="carta-b" aria-hidden="' + !on + '"><img src="' + esc(e.carta) + '" alt="' + esc(e.quien) + '"></div></div></div>';
  }
  /** Voltea la carta si está boca abajo (true si lo ha hecho: entonces → no pasa de pantalla). Con `esconder` (R), también la vuelve a tapar. */
  function voltear(esconder) {
    var c = app.querySelector(".acd-carta-trip.carta"); if (!c) return false;
    var on = c.classList.contains("on"); if (on && !esconder) return false;
    c.classList.toggle("on", !on); VOLT[ACTUAL] = !on;
    c.querySelector(".carta-a").setAttribute("aria-hidden", String(!on)); c.querySelector(".carta-b").setAttribute("aria-hidden", String(on));
    if (!on) sonar("volteo");
    return true;
  }
  /** Pasar de pantalla (con el sonido de la página): las flechas y los botones de la sesión van por aquí. */
  function irPantalla(k) { PANT = k; recordar(); sonar("pagina"); pintarPantalla(); }
  function pintarPantalla() {
    var i = ACTUAL, e = C.estaciones[i], P = pantallas(i), x = P[PANT], el = $("#acd-ses");
    var suelo = e.suelo || e.bg, cuerpo = "", cls = "";
    JUGANDO = false;
    if (x.t === "llegada") {
      cls = "acd-llegada";
      cuerpo = fondo(e.bg) + '<div class="acd-velo izq"></div>' +
        (e.carta ? cartaTrip(e, i) : '<img class="acd-corte der" src="' + esc(e.pj || POSE.nebula) + '" alt="' + esc(e.quien) + '">') +
        '<div class="acd-dia-txt"><div class="acd-dia-k">Academia de la Cero · parada ' + (i + 1) + " de " + N + " · unos " + (e.min || 10) + " minutos</div>" +
        '<h2 class="acd-dia-h1">' + esc(e.titulo) + '</h2><p class="acd-dia-sub">' + esc(e.tema) + '</p><p class="acd-dia-sub acd-mut">Hoy: ' + esc(e.hoy.charAt(0).toLowerCase() + e.hoy.slice(1)) + ' <span class="acd-planeta">(planeta ' + esc(e.planeta) + ")</span></p>" +
        (e.retrato || !e.cita ? "" : '<p class="acd-cita">«' + esc(e.cita) + "» <span>" + esc(e.quien) + "</span></p>") +
        (e.retrato || !e.historia ? "" : '<p class="acd-dia-sub">' + esc(e.historia) + "</p>") + "</div>";
    } else if (x.t === "historia") {
      cls = "acd-historia";
      cuerpo = fondo(e.retrato, "der") + '<div class="acd-velo izq"></div>' +
        '<div class="acd-dia-txt"><div class="acd-dia-k">La historia · ' + esc(e.quien) + '</div><p class="acd-cita grande">«' + esc(e.cita) + "»</p>" +
        '<p class="acd-dia-sub">' + esc(e.historia) + "</p>" +
        '<p class="acd-dia-sub acd-mut">' + esc(e.tema) + ". Tu alumnado recupera a " + esc(e.quien.split(",")[0]) + " con el relámpago de este tema.</p></div>";
    } else if (x.t === "pieza") {
      var b = x.b;
      cls = "acd-pieza" + (b.video ? " con-video" : "");
      cuerpo = fondo(suelo) + '<div class="acd-velo"></div>' +
        (b.video ? "" : '<img class="acd-corte izq" src="' + esc(POSE[b.pj] || POSE.nebula) + '" alt="">') +
        '<div class="acd-bocadillo"><div class="acd-dia-k">' + esc(e.titulo) + " · " + (x.k + 1) + " de " + e.piezas.length + "</div><h3>" + esc(b.h) + "</h3><p>" + b.p + "</p>" +
        (b.pasos ? '<ol class="acd-pasos">' + b.pasos.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ol>" : "") + botonesDe(b) + "</div>" +
        // 5-oct · la explicación con su VÍDEO TUTORIAL (tutoriales/grabar.cjs): grande, en bucle, sin sonido y con sus controles
        (b.video ? '<video class="acd-video" src="' + esc(VIDEO(b.video)) + '" autoplay muted loop playsinline controls preload="auto" aria-label="Vídeo tutorial: ' + esc(b.h) + '"></video>'
          : b.img ? '<img class="acd-pantallazo" src="' + esc(b.img) + '" alt="">' : "");
    } else if (x.t === "hito" && x.h.tipo === "juego") {
      cls = "acd-juego";
      var hj = x.h, okJ = estado(hj).ok, ruta = /^ruta:/.test(hj.maquina), img = "juegos/joran/img/" + (ruta ? "maq_vuelo" : (MAQ[hj.maquina] || "maq_conquista")) + ".jpg";
      cuerpo = fondo(img, "juego") + '<div class="acd-velo"></div>' +
        '<div class="acd-juego-caja" id="acd-juego-marco"><div class="acd-dia-k">Repaso jugando · opcional</div><h3>' + esc(hj.n) + "</h3>" +
        (okJ ? "" : "<p><b>Es opcional:</b> la parada ya está hecha. Si te apetece, sus " + (e.preguntas || []).length + " preguntas salen <b>dentro del juego</b>; la que falles vuelve a salir. Si no, pulsa → y sigue.</p>") +
        // 3-oct · Norberto: «vidas ilimitadas (avisa de que en este modo no les dejamos perder, pero los estudiantes tendrán vidas
        // limitadas). No quiero que un docente pase del curso por atascarse en un juego» (SIN_MORIR en juegos/joran/desafio.js)
        (okJ ? "" : '<p class="acd-sin-morir"><b>Aquí no puedes perder:</b> en la Academia tienes vidas ilimitadas, para que nadie se quede atascado. Tu alumnado, en la sala de Joran, sí las tendrá limitadas.</p>') +
        '<p class="acd-juego-st" id="acd-juego-st">' + (okJ ? ico("hecho") + " <b>Todas acertadas.</b> Puedes volver a jugar cuando quieras." : "") + "</p>" +
        '<div class="acd-botones"><button type="button" class="btn primary grande" data-jugar>' + (okJ ? "Jugar otra vez" : "Jugar") + "</button>" +
        (DEMO && !okJ ? '<button class="btn min" type="button" data-demo-j>Marcar (demo)</button>' : "") + "</div>" +
        (okJ ? opinarHtml(hj) : "") + "</div>";
    } else if (x.t === "hito") {
      var h = x.h, real = esReal(h);
      cls = "acd-mision";
      cuerpo = fondo(real ? suelo : "assets/img/pres/puente.webp") + '<div class="acd-velo izq"></div>' +
        '<img class="acd-corte der" src="' + (real ? POSE["capitan:saluda"] : POSE["capitan:tablet"]) + '" alt="">' +
        '<div class="acd-dia-txt ancho"><div class="acd-dia-k">' + (h.tipo === "diseno" ? "Ahora tú · tu primera pieza" : real ? "Ahora tú · como tu alumnado, en el grupo de la Academia" : "Tu misión · en la consola de ensayo") + "</div>" +
        '<div class="acd-hito" id="h-' + esc(h.id) + '"></div></div>';
    } else {
      var sig = i + 1 < N ? C.estaciones[i + 1] : null, pl = sig && sig.bg ? sig.bg : null, hjf = e.juego ? hitoJuego(e) : null;
      var opinaFin = hjf && estado(hjf).ok && !opinado(hjf) ? opinarHtml(hjf, "¿Qué tal «" + hjf.n + "»?") : "";
      cls = "acd-fin";
      cuerpo = fondo(pl || e.bg) + '<div class="acd-velo"></div>' +
        '<div class="acd-dia-txt centro"><div class="acd-dia-k">' + esc(e.titulo) + " · hecha</div>" +
        '<h2 class="acd-dia-h2">' + (sig ? "Siguiente: " + esc(sig.titulo) : "Has hecho las " + N + " paradas") + "</h2>" +
        (sig ? '<p class="acd-dia-sub"><b>¿Suficiente por hoy?</b> Puedes dejarlo aquí: cuando vuelvas, seguirás justo donde lo dejaste. La siguiente es <b>' + esc(sig.titulo) + "</b> (unos " + (sig.min || 10) + ' minutos).</p><div class="acd-botones"><button class="btn primary grande" type="button" data-sig>Empezar ' + esc(sig.planeta) + " →</button></div>"
             : '<p class="acd-dia-sub">Abajo tienes tu título.</p>') + opinaFin + "</div>";
    }
    var falta = PANT + 1 === P.length - 1 && !hecha(i);
    var clave = i + ":" + PANT, nueva = clave !== VISTA; VISTA = clave;
    el.innerHTML = (falta ? faltaHtml(i, P) : "") + '<div class="acd-dia ' + cls + (nueva ? " acd-entra" : "") + '">' + cuerpo +
      (PANT > 0 ? '<button type="button" class="acd-flecha ant" data-ant aria-label="Anterior">‹</button>' : "") +
      (x.t !== "fin" ? '<button type="button" class="acd-flecha sig" data-sig-p aria-label="Siguiente"' + (falta ? " disabled" : "") + ">›</button>" : "") +
      botonSon() + botonCompleta() + barraPasos(P) + "</div>";
    if (x.t === "hito" && x.h.tipo !== "juego") pintarHito(x.h);
    if (x.t === "hito" && x.h.tipo === "juego") engancharJuego(e, x.h);
    // 30-sep · «¿Cómo te ha resultado?» después de cada minijuego (en su diapositiva y, si aún no lo ha dicho, al final)
    var op = el.querySelector("[data-op]"); if (op) enganchaOpinar(op.parentNode, { id: op.getAttribute("data-op") }, pintarPantalla);
    [].forEach.call(el.querySelectorAll("[data-ir]"), function (b) { b.onclick = function () { irPantalla(Number(b.getAttribute("data-ir"))); }; });
    // (al volver atrás a la llegada, la carta ya está volteada: no hay que descubrirla otra vez)
    var ant = el.querySelector("[data-ant]"); if (ant) ant.onclick = function () { if (P[PANT - 1] && P[PANT - 1].t === "llegada") VOLT[i] = true; irPantalla(PANT - 1); };
    // → con la carta boca abajo: primero la voltea; a la siguiente, pasa
    var sp = el.querySelector("[data-sig-p]"); if (sp) sp.onclick = function () { if (sp.disabled || voltear()) return; irPantalla(PANT + 1); };
    var sg = el.querySelector("[data-sig]"); if (sg) sg.onclick = function () { ACTUAL = i + 1; PANT = 0; VOLT[ACTUAL] = false; recordar(); sonar("pagina"); pintar(); irArriba(); };
    var ct = el.querySelector(".acd-carta-trip.carta"); if (ct) ct.onclick = function () { voltear(); };
    var bs = el.querySelector("[data-son]"); if (bs) bs.onclick = alternarSon;
    // al cerrar el planeta: chispas y la fanfarria (una vez por planeta y visita)
    if (x.t === "fin" && hecha(i) && nueva && !FESTEJO[i]) {
      FESTEJO[i] = true;
      var F = window.SG && window.SG.FIESTA, h2 = el.querySelector(".acd-dia-h2");
      sonar("mision", 250);
      if (F && F.chispas && h2) setTimeout(function () { var r = h2.getBoundingClientRect(); F.chispas(r.left + r.width / 2, r.top + r.height / 2); }, 350);
    }
    var bc = el.querySelector("[data-completa]"); if (bc) bc.onclick = pantallaCompleta;
  }
  /**
   * 3-oct · PANTALLA COMPLETA (Norberto, haciendo la Academia: «¿podríamos permitir que el docente ponga la presentación en
   * pantalla completa?»). Como en la sesión de clase: el botón de las cuatro esquinas o la F. Se pone en pantalla completa la
   * página entera y la diapositiva ocupa todo (body.acd-completa): así no se sale al pasar de diapositiva, al cumplir una misión
   * ni al llegar una respuesta, que repintan la Academia entera. Si el navegador no deja (el iPhone), la diapositiva ocupa la
   * ventana, y se sale con el mismo botón o con Esc.
   */
  var IC_PANTALLA = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IC_SALIR = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function completa() { return document.body.classList.contains("acd-completa"); }
  function pantallaDelNavegador() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function botonCompleta() {
    var fs = completa(), t = fs ? "Salir de pantalla completa" : "Pantalla completa";
    return '<button type="button" class="acd-completa-b" data-completa title="' + t + ' (F)" aria-label="' + t + '">' + (fs ? IC_SALIR : IC_PANTALLA) + "</button>";
  }
  function marcarCompleta() { var b = document.querySelector("[data-completa]"); if (b) { b.outerHTML = botonCompleta(); b = document.querySelector("[data-completa]"); b.onclick = pantallaCompleta; } }
  function pantallaCompleta() {
    if (completa()) {
      document.body.classList.remove("acd-completa");
      if (pantallaDelNavegador()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      marcarCompleta(); return;
    }
    document.body.classList.add("acd-completa"); marcarCompleta();
    var h = document.documentElement, pide = h.requestFullscreen || h.webkitRequestFullscreen;
    if (pide) { try { var r = pide.call(h); if (r && r.catch) r.catch(function () { /* la diapositiva ocupa la ventana */ }); } catch (x) { /* igual */ } }
  }
  ["fullscreenchange", "webkitfullscreenchange"].forEach(function (n) {
    document.addEventListener(n, function () { if (!pantallaDelNavegador() && completa()) { document.body.classList.remove("acd-completa"); marcarCompleta(); } });
  });
  /**
   * EL MINIJUEGO DE CADA PLANETA, dentro de la sesión (Norberto: «¡usa los minijuegos para preguntar!»). Una máquina de la sala
   * de Joran o la Ruta de la Estática, en modo Academia (?banco=academia): las preguntas se le pasan por window.SG_BANCO_JUEGO y
   * el juego avisa con postMessage (sgAcademia): «todas» (el hito, hecho) y «siguiente» (al final de la sesión). Mientras se
   * juega, la página no se repinta: se perdería la partida.
   */
  function urlJuego(e, h) {
    var m = /^ruta:(.+)$/.exec(h.maquina);
    return (m ? "juegos/ruta/index.html?mision=" + encodeURIComponent(m[1]) : "juegos/joran/" + encodeURIComponent(h.maquina) + ".html?x=1") +
      "&banco=academia&embed=1&tanda=" + encodeURIComponent(e.id);
  }
  function engancharJuego(e, h) {
    var caja = document.getElementById("acd-juego-marco"); if (!caja) return;
    var bj = caja.querySelector("[data-jugar]");
    if (bj) bj.onclick = function () {
      window.SG_BANCO_JUEGO = e.preguntas || [];
      try { sessionStorage.setItem("sgBancoJuego", JSON.stringify(window.SG_BANCO_JUEGO)); } catch (x) { /* sin almacenamiento */ }
      JUGANDO = true; document.body.classList.add("acd-jugando");
      caja.classList.add("jugando");
      caja.innerHTML = '<iframe src="' + esc(urlJuego(e, h)) + '" title="' + esc(h.n) + '" allow="fullscreen; autoplay" allowfullscreen></iframe>' +
        '<div class="acd-juego-pie"><span id="acd-juego-st">' + (estado(h).ok ? ico("hecho") + " Todas acertadas: juega lo que quieras." : (e.preguntas || []).length + " preguntas · la que falles vuelve a salir") + "</span>" +
        '<button type="button" class="btn min" data-pantalla>Pantalla completa</button><button type="button" class="btn min" data-salir>Salir del juego</button></div>';
      var fr = caja.querySelector("iframe");
      caja.querySelector("[data-pantalla]").onclick = function () { try { (fr.requestFullscreen || fr.webkitRequestFullscreen).call(fr); } catch (x) { /* sin pantalla completa */ } };
      caja.querySelector("[data-salir]").onclick = function () { JUGANDO = false; pintar(); };
      setTimeout(function () { try { fr.focus(); } catch (x) { /* nada */ } }, 300);
    };
    var bd = caja.querySelector("[data-demo-j]"); if (bd) bd.onclick = function () { guardarPaso(h.id, { ok: true, demo: true }); trasHito(); };
  }
  window.addEventListener("message", function (ev) {
    if (ev.origin !== location.origin || !ev.data || !ev.data.sgAcademia || ACTUAL == null) return;
    var m = ev.data.sgAcademia, e = C.estaciones[ACTUAL]; if (!e || !e.juego || m.tanda !== e.id) return;
    var h = hitoJuego(e);
    if (m.todas) {
      guardarPaso(h.id, { ok: true, auto: true, aciertos: Number(m.aciertos) || 0, fallos: Number(m.fallos) || 0 });
      var st = document.getElementById("acd-juego-st"); if (st) st.innerHTML = ico("hecho") + " <b>Todas acertadas.</b> Sesión superada: sigue jugando o pasa al siguiente módulo.";
    }
    if (m.siguiente) { JUGANDO = false; PANT = hecha(ACTUAL) ? pantallas(ACTUAL).length - 1 : primeraQueFalta(ACTUAL); recordar(); pintar(); irArriba(); }
  });
  // las flechas del teclado, como en la sesión (salvo escribiendo o jugando)
  document.addEventListener("keydown", function (ev) {
    if (JUGANDO || ACTUAL == null || !$("#acd-ses")) return;
    var t = document.activeElement && document.activeElement.tagName;
    if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || t === "IFRAME") return;
    if (ev.key === "ArrowRight") { var s2 = app.querySelector("[data-sig-p]"); if (s2 && !s2.disabled) { ev.preventDefault(); s2.click(); } else if (voltear()) ev.preventDefault(); }
    else if ((ev.key === "Enter" || ev.key === " ") && document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("acd-carta-trip")) { ev.preventDefault(); voltear(); }
    else if ((ev.key === "r" || ev.key === "R") && !ev.metaKey && !ev.ctrlKey && !ev.altKey) { if (voltear(true)) ev.preventDefault(); }
    else if ((ev.key === "m" || ev.key === "M") && !ev.metaKey && !ev.ctrlKey && !ev.altKey) { ev.preventDefault(); alternarSon(); }
    else if (ev.key === "ArrowLeft") { var a2 = app.querySelector("[data-ant]"); if (a2) { ev.preventDefault(); a2.click(); } }
    else if ((ev.key === "f" || ev.key === "F") && !ev.metaKey && !ev.ctrlKey && !ev.altKey) { ev.preventDefault(); pantallaCompleta(); }
  });
  document.addEventListener("keydown", function (ev) {
    var fl = document.getElementById("acd-claude");
    if (ev.key === "Escape" && completa() && !pantallaDelNavegador() && !(fl && !fl.hidden)) pantallaCompleta();
  });
  /** Tras cumplir un hito: se repinta todo (el mapa y los puntos cambian) sin mover la pantalla en curso. */
  function trasHito() { pintar(); }

  // ── los hitos, uno por pantalla
  var RESP = {};   // cómo va cada cuestionario mientras se responde: { k: pregunta en curso, r: {k: elegida}, visto: bool }
  function pintarHito(h) {
    var el = document.getElementById("h-" + h.id); if (!el) return;
    var st = estado(h), cab = '<div class="acd-hito-cab"><span class="acd-marca' + (st.ok ? " acd-ok" : "") + '">' + (st.ok ? ico("hecho") : "") + "</span><h2>" + esc(h.titulo) + "</h2>" +
      (h.extra ? '<span class="chip">de NEBULA, para ti</span>' : "") + (st.conv ? '<span class="chip">convalidado</span>' : "") + "</div>";
    if (st.conv) { el.innerHTML = cab + '<p class="muted">' + esc(st.conv) + "</p>"; return; }
    if (h.tipo === "quiz") return pintarPreguntas(el, h, st, cab, h.preguntas.map(function (p) { return { p: p.p, o: p.o, ok: p.ok, porque: p.porque }; }));
    if (h.tipo === "clasificar") return pintarPreguntas(el, h, st, cab, h.items.map(function (it) {
      return { p: it[0], o: ["Componente", "Mecánica", "Dinámica"], ok: ["componente", "mecanica", "dinamica"].indexOf(it[1]), porque: it[2], fijo: true }; }));
    if (h.tipo === "diseno") return pintarDiseno(el, h, st, cab);
    if (h.tipo === "texto") return pintarTexto(el, h, st, cab);
    // auto: lo comprueba la plataforma (o el ensayo, en este navegador)
    var necesitaFicha = h.comprobar !== "alta" && !local(h.comprobar) && !FICHA && !DEMO;
    el.innerHTML = cab + "<p>" + h.como + "</p>" + (st.ok ? '<p class="acd-bien">Hecho. La plataforma lo ha comprobado.</p>' + (h.opinar ? opinarHtml(h) : "")
      : necesitaFicha ? '<p class="muted">Primero, alístate: es la misión de Fôrge (tu ficha de recluta).</p>'
      : '<div class="acd-botones">' + (h.boton ? '<a class="btn primary" href="' + esc(enlace(h.boton)) + '" target="' + (h.boton === "alistarse" ? "_self" : "_blank") + '" rel="noopener">' +
          esc(ROTULO[h.boton] || (/^ensayo:/.test(h.boton) ? "Abrir la consola de ensayo" : /^diferido:/.test(h.boton) ? "Abrir la clase en diferido" : "Abrir")) + (h.boton === "alistarse" ? "" : " ↗") + "</a>" : "") +
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
      else if (av) av.textContent = local(h.comprobar) ? "Todavía no aparece. Hazlo en ESTE navegador (la misma ventana, otra pestaña) y vuelve a comprobar; si no llega, cuéntaselo a NEBULA (abajo a la derecha)."
        : "Todavía no aparece. Si acabas de hacerlo, espera unos segundos y vuelve a comprobar; si no llega, cuéntaselo a NEBULA (abajo a la derecha).";
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
    el.innerHTML = cab + (st.ok ? '<p class="acd-bien">Enviado. NEBULA te lo comenta en tu hilo: «Pregunta a NEBULA», abajo a la derecha.</p>' : "<p>Una pieza pequeña para tu aula, pensada al revés de como se juega: del objetivo a la pieza.</p>") +
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
  function opinado(h) { return Object.keys(DOC.feedback || {}).map(function (k) { return DOC.feedback[k]; }).filter(function (f) { return f && f.hito === h.id; })[0]; }
  function opinarHtml(h, rotulo) {
    var ya = opinado(h);
    return '<div class="acd-opinar" data-op="' + esc(h.id) + '"><b>' + esc(rotulo || "¿Cómo te ha resultado?") + "</b>" + (ya ? ' <span class="muted">Gracias: «' + esc(ya.nivel || "") + "»" + (ya.texto ? ", " + esc(ya.texto) : "") + ".</span>" :
      '<div class="acd-ops acd-ops3">' + ["Fácil", "Justo", "Difícil"].map(function (n) { return '<button type="button" class="acd-op" data-nivel="' + n + '">' + n + "</button>"; }).join("") + "</div>" +
      '<textarea rows="2" maxlength="600" placeholder="Lo que te ha gustado, lo que no y lo que cambiarías (opcional)" aria-label="Tu opinión"></textarea><div class="acd-botones"><button class="btn" type="button" data-env>Enviar mi opinión</button></div>') + "</div>";
  }
  function enganchaOpinar(el, h, luego) {
    var c = el.querySelector("[data-op]"); if (!c || !c.querySelector("[data-env]")) return;
    var nivel = "";
    Array.prototype.forEach.call(c.querySelectorAll("[data-nivel]"), function (b) { b.onclick = function () { nivel = b.getAttribute("data-nivel"); Array.prototype.forEach.call(c.querySelectorAll("[data-nivel]"), function (x) { x.classList.toggle("acd-sel", x === b); }); }; });
    c.querySelector("[data-env]").onclick = function () {
      if (!nivel) return;
      guardar({ feedback: obj(String(Date.now()), { tipo: "juego", hito: h.id, nivel: nivel, texto: c.querySelector("textarea").value.trim().slice(0, 600), t: Date.now() }) }).then(function () { (luego || pintarHito)(h); });
    };
  }

  /**
   * 🔴 30-sep · «¿DUDAS?», UNA PÍLDORA FLOTANTE. Norberto: «haz más visible el botón para preguntar, enviar dudas, sugerencias,
   * problemas… ¿puede ser una píldora flotante en la parte inferior derecha? Al pulsar se despliega». Antes era una caja plegada
   * al final de la página, debajo de la sesión: quien tenía una duda a mitad de un planeta no la veía. Ahora está siempre a
   * mano (como «Pregunta a NEBULA» en la Nave del alumnado), con el número de respuestas nuevas. Vive fuera de la página que
   * se repinta: abrirla, escribir y seguir navegando no pierde lo escrito.
   */
  function montarFlota() {
    var quiere = !VER && !ORG && (YO || DEMO);
    var b = document.getElementById("acd-flota-b"), el = document.getElementById("acd-claude");
    if (!quiere) { if (b) b.hidden = true; if (el) el.hidden = true; return; }
    if (!b) {
      b = document.createElement("button"); b.type = "button"; b.id = "acd-flota-b"; b.className = "acd-flota-b";
      b.setAttribute("aria-controls", "acd-claude"); b.setAttribute("aria-expanded", "false");
      el = document.createElement("section"); el.id = "acd-claude"; el.className = "acd-flota"; el.hidden = true;
      el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Pregunta a NEBULA");
      document.body.appendChild(el); document.body.appendChild(b);
      b.onclick = function () { abrirFlota(el.hidden); };
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !el.hidden) { abrirFlota(false); b.focus(); } });
    }
    b.hidden = false;
    pintarClaude();
    if (!DEMO) { contarBuzon(); if (!montarFlota.reloj) montarFlota.reloj = setInterval(contarBuzon, 120000); }
    if (lsLeer("claudeAbierto", false) && el.hidden) abrirFlota(true, true);
  }
  /**
   * 🔴 1-oct · UN SOLO BOTÓN DE AYUDA. Norberto: «el botón de ayuda debe ser el mismo siempre… para Anita y Caridad es la misma
   * vía». La píldora sigue aquí («Pregunta a NEBULA»), pero lo que abre es el buzón del Mando (buzon.html, incrustado y con «La
   * Academia» marcada): el mismo que el de la consola, con todos sus mensajes juntos y una sola guardia que contesta. En la
   * demostración (sin cuenta) se queda el hilo de antes, en este navegador.
   */
  var BZ_NUEVOS = 0;
  function contarBuzon() {
    if (DEMO || !M || !M.buzonMios) return;
    M.buzonMios().then(function (L) { BZ_NUEVOS = (L || []).filter(function (m) { return m.visto === false; }).length; pintarClaude(); }, function () {});
  }
  function abrirFlota(abrir, sinFoco) {
    var b = document.getElementById("acd-flota-b"), el = document.getElementById("acd-claude"); if (!b || !el) return;
    el.hidden = !abrir; b.setAttribute("aria-expanded", String(!!abrir)); b.classList.toggle("abierta", !!abrir);
    lsPoner("claudeAbierto", !!abrir);
    if (!DEMO) {
      if (abrir) {
        pintarClaude();
        var fr = el.querySelector("iframe"), est = C.estaciones[ACTUAL] ? C.estaciones[ACTUAL].id : "";
        var src = "buzon.html?desde=academia&embed=1" + (est ? "&estacion=" + encodeURIComponent(est) : "");
        if (fr && fr.getAttribute("data-src") !== src) { fr.setAttribute("data-src", src); fr.src = src; }
        BZ_NUEVOS = 0; lsPoner("claudeVisto", Date.now()); pintarClaude();
      } else contarBuzon();
      return;
    }
    if (abrir) {
      lsPoner("claudeVisto", Date.now()); pintarClaude();
      var h = el.querySelector(".acd-hilo"); if (h) h.scrollTop = h.scrollHeight;
      if (!sinFoco) { var t = document.getElementById("acd-txt"); if (t) t.focus(); }
    }
  }
  // ── 30-sep · LAS CAPTURAS (Norberto: «añade la posibilidad de añadir adjuntos (arrastrar una imagen): eso te ayudará a
  // detectar errores»). Hasta tres por mensaje; se comprimen aquí (≤ 1600 px, JPEG) antes de subirlas.
  var ADJ = [], MAX_ADJ = 3;
  function anadirAdj(files) {
    var fs = Array.prototype.filter.call(files || [], function (f) { return /^image\//.test(f.type); });
    var st = document.getElementById("acd-env-st");
    if (!fs.length) { if (st && files && files.length) st.textContent = "Solo imágenes (una captura, una foto)."; return; }
    if (ADJ.length + fs.length > MAX_ADJ && st) st.textContent = "Como mucho " + MAX_ADJ + " capturas por mensaje.";
    fs.slice(0, Math.max(0, MAX_ADJ - ADJ.length)).forEach(function (f) {
      comprimir(f).then(function (blob) { if (ADJ.length < MAX_ADJ) ADJ.push({ blob: blob, ver: URL.createObjectURL(blob) }); pintarAdj(); },
        function () { if (st) st.textContent = "Esa imagen no se ha podido leer."; });
    });
  }
  function comprimir(f) {
    return new Promise(function (ok, mal) {
      var im = new Image(), u = URL.createObjectURL(f);
      im.onload = function () {
        var k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(im.naturalWidth * k)); cv.height = Math.max(1, Math.round(im.naturalHeight * k));
        var cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(u);
        cv.toBlob(function (b) { if (b) ok(b); else mal(new Error("imagen")); }, "image/jpeg", 0.85);
      };
      im.onerror = function () { URL.revokeObjectURL(u); mal(new Error("imagen")); };
      im.src = u;
    });
  }
  function pintarAdj() {
    var c = document.getElementById("acd-adj"); if (!c) return;
    c.innerHTML = ADJ.map(function (a, i) { return '<span class="acd-adj-m"><img src="' + a.ver + '" alt="Captura ' + (i + 1) + '"><button type="button" data-quita="' + i + '" aria-label="Quitar la captura ' + (i + 1) + '">&times;</button></span>'; }).join("");
    Array.prototype.forEach.call(c.querySelectorAll("[data-quita]"), function (b) { b.onclick = function () { ADJ.splice(Number(b.getAttribute("data-quita")), 1); pintarAdj(); }; });
  }
  /** Sube las capturas (en la demostración, se quedan en este navegador) y devuelve sus direcciones. */
  function subirAdj(st) {
    var urls = [];
    return ADJ.reduce(function (p, a, i) {
      return p.then(function () {
        if (st && ADJ.length > 1) st.textContent = "Subiendo la captura " + (i + 1) + " de " + ADJ.length + "…";
        if (DEMO || !M || !M.buzonAdjuntar) return new Promise(function (ok) { var r = new FileReader(); r.onload = function () { urls.push(r.result); ok(); }; r.readAsDataURL(a.blob); });
        return M.buzonAdjuntar(a.blob).then(function (u) { urls.push(u); }, function () { throw new Error("no se ha podido subir la captura"); });
      });
    }, Promise.resolve()).then(function () { return urls; });
  }
  /** Las capturas de un mensaje: solo las de nuestro almacén (o, en la demostración, las de este navegador). */
  function adjuntosHtml(adj) {
    var ok = (adj || []).filter(function (u) { return /^https:\/\/firebasestorage\.googleapis\.com\//.test(String(u)) || (DEMO && /^data:image\/jpeg;base64,/.test(String(u))); });
    return ok.length ? '<div class="acd-msj-adj">' + ok.map(function (u, i) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '" alt="Captura ' + (i + 1) + '" loading="lazy"></a>'; }).join("") + "</div>" : "";
  }
  // ── Claude (y Norberto): sus respuestas, tus preguntas, «algo no funciona» y tus ideas
  function pintarClaude() {
    var el = document.getElementById("acd-claude"), boton = document.getElementById("acd-flota-b"); if (!el) return;
    var cl = (DOC.claude || {}).mensajes || {}, pr = DOC.preguntas || {}, fb = DOC.feedback || {}, L = [];
    Object.keys(cl).forEach(function (k) { L.push({ t: Number(cl[k].t) || Number(k) || 0, de: "claude", x: cl[k].texto }); });
    var md = (DOC.mando || {}).mensajes || {};   // 30-sep · lo que le responde quien organiza la Academia
    Object.keys(md).forEach(function (k) { L.push({ t: Number(md[k].t) || Number(k) || 0, de: "mando", quien: md[k].de, x: md[k].texto }); });
    Object.keys(pr).forEach(function (k) { L.push({ t: Number(k) || 0, de: "tu", x: pr[k].texto, adj: pr[k].adjuntos }); });
    var NOMBRE_FB = { fallo: "Algo no funciona", idea: "Una idea", otra: "Otra cosa" };
    Object.keys(fb).forEach(function (k) { if (fb[k] && fb[k].tipo !== "juego") L.push({ t: Number(k) || 0, de: "tu", x: "[" + (NOMBRE_FB[fb[k].tipo] || "Nota") + "] " + fb[k].texto, adj: fb[k].adjuntos }); });
    L.sort(function (a, b) { return a.t - b.t; });
    var abierta = !el.hidden;
    if (abierta) lsPoner("claudeVisto", Date.now());
    var visto = Number(lsLeer("claudeVisto", 0)) || 0,
        nuevos = L.filter(function (m) { return (m.de === "claude" || m.de === "mando") && m.t > visto; }).length + (DEMO ? 0 : BZ_NUEVOS);
    // (30-sep · Norberto: «no rompas la magia de la gamificación: que pregunten a NEBULA; si no lo sabe, llamará al Alto Mando»)
    if (boton) boton.innerHTML = '<img class="acd-flota-neb" src="assets/img/personajes/nebula.png" alt=""><span class="acd-flota-t"><span class="acd-flota-mas">Pregunta a </span>NEBULA</span>' +
      (nuevos ? '<span class="neb-aviso" aria-label="' + nuevos + (nuevos === 1 ? " respuesta nueva" : " respuestas nuevas") + '">' + nuevos + "</span>" : "");
    if (!DEMO) {   // 1-oct · con cuenta, el panel es el buzón del Mando (ver abrirFlota): se monta una vez y no se repinta
      if (!el.querySelector("iframe")) {
        el.classList.add("con-buzon");
        el.innerHTML = '<div class="acd-flota-cab"><h2><img class="acd-flota-neb" src="assets/img/personajes/nebula.png" alt=""> Pregunta a NEBULA</h2><button type="button" class="acd-flota-x" aria-label="Cerrar">&times;</button></div>' +
          '<iframe class="acd-flota-if" title="Pregunta a NEBULA: tus mensajes y sus respuestas"></iframe>';
        el.querySelector(".acd-flota-x").onclick = function () { abrirFlota(false); if (boton) boton.focus(); };
      }
      return;
    }
    // lo que se estaba escribiendo sobrevive al repintado (llega una respuesta, se guarda un paso…)
    var txt0 = document.getElementById("acd-txt"), borrador = txt0 ? txt0.value : "", conFoco = !!txt0 && document.activeElement === txt0;
    var sel0 = el.querySelector("[data-tipo].acd-sel"), tipo = sel0 ? sel0.getAttribute("data-tipo") : "pregunta";
    el.innerHTML = '<div class="acd-flota-cab"><h2><img class="acd-flota-neb" src="assets/img/personajes/nebula.png" alt=""> Pregunta a NEBULA</h2><button type="button" class="acd-flota-x" aria-label="Cerrar">&times;</button></div>' +
      '<p class="muted small">Una duda, algo que no funciona o una idea: cuéntamelo. Lo que yo no sepa se lo paso al Alto Mando, y te respondemos cuanto antes, aquí mismo.</p>' +
      '<div class="acd-hilo">' + (L.length ? L.map(function (m) {
        return '<div class="acd-msj ' + (m.de === "claude" ? "acd-de-claude" : m.de === "mando" ? "acd-de-mando" : "acd-de-ti") + '"><b>' +
          (m.de === "claude" ? "NEBULA" : m.de === "mando" ? "El Alto Mando" : "Tú") + " <small>" + (m.t ? new Date(m.t).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "") + "</small></b><p>" + esc(m.x || "").replace(/\n/g, "<br>") + "</p>" + adjuntosHtml(m.adj) + "</div>";
      }).join("") : '<p class="muted">Todavía no hay mensajes. Pregunta lo que quieras.</p>') + "</div>" +
      '<div class="acd-escribir"><div class="acd-ops acd-ops4" role="radiogroup" aria-label="Qué es">' + [["pregunta", "Una duda"], ["fallo", "Algo no funciona"], ["idea", "Una idea"], ["otra", "Otra cosa"]].map(function (o) {
        return '<button type="button" class="acd-op' + (o[0] === tipo ? " acd-sel" : "") + '" data-tipo="' + o[0] + '" role="radio" aria-checked="' + (o[0] === tipo) + '">' + o[1] + "</button>"; }).join("") + "</div>" +
        '<textarea rows="3" maxlength="1200" placeholder="Escribe aquí. Si algo falla: qué pulsaste, qué esperabas y qué pasó." id="acd-txt" aria-label="Tu mensaje para NEBULA"></textarea>' +
        '<div class="acd-adj" id="acd-adj"></div>' +
        '<label class="acd-adj-b"><input type="file" accept="image/*" multiple id="acd-file" hidden>' + ico("anadir") + ' Añadir una captura</label>' +
        '<span class="muted small acd-adj-pista">(o arrástrala aquí, o pégala con Ctrl+V: ayuda mucho a ver qué ha fallado)</span>' +
        '<div class="acd-botones"><button class="btn primary" type="button" id="acd-env">Enviar a NEBULA</button><span class="muted small" id="acd-env-st" aria-live="polite"></span></div></div>';
    var txt = document.getElementById("acd-txt"); txt.value = borrador; if (conFoco) txt.focus();
    pintarAdj();
    var fi = document.getElementById("acd-file"); fi.onchange = function () { anadirAdj(fi.files); fi.value = ""; };
    txt.addEventListener("paste", function (e) {
      var fs = Array.prototype.filter.call((e.clipboardData && e.clipboardData.files) || [], function (f) { return /^image\//.test(f.type); });
      if (fs.length) { e.preventDefault(); anadirAdj(fs); }
    });
    if (!el.dataset.arrastre) {   // (una vez: el panel sobrevive a los repintados)
      el.dataset.arrastre = "1";
      el.addEventListener("dragover", function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") >= 0) { e.preventDefault(); el.classList.add("arrastrando"); } });
      el.addEventListener("dragleave", function (e) { if (e.target === el) el.classList.remove("arrastrando"); });
      el.addEventListener("drop", function (e) { e.preventDefault(); el.classList.remove("arrastrando"); if (e.dataTransfer) anadirAdj(e.dataTransfer.files); });
    }
    el.querySelector(".acd-flota-x").onclick = function () { abrirFlota(false); if (boton) boton.focus(); };
    var h = el.querySelector(".acd-hilo"); if (h && abierta) h.scrollTop = h.scrollHeight;
    Array.prototype.forEach.call(el.querySelectorAll("[data-tipo]"), function (b) { b.onclick = function () { tipo = b.getAttribute("data-tipo"); Array.prototype.forEach.call(el.querySelectorAll("[data-tipo]"), function (x) { x.classList.toggle("acd-sel", x === b); x.setAttribute("aria-checked", String(x === b)); }); }; });
    var env = document.getElementById("acd-env");
    env.onclick = function () {
      var t = txt.value.trim(), st = document.getElementById("acd-env-st"); if (!t) { st.textContent = "Escribe algo primero."; txt.focus(); return; }
      var k = String(Date.now()), est = C.estaciones[ACTUAL] ? C.estaciones[ACTUAL].id : "";
      env.disabled = true; st.textContent = ADJ.length ? "Subiendo la captura…" : "Enviando…";
      subirAdj(st).then(function (urls) {
        var extra = urls.length ? { adjuntos: urls } : {};
        st.textContent = "Enviando…";
        return tipo === "pregunta" ? guardar({ preguntas: obj(k, Object.assign({ texto: t.slice(0, 1200), estacion: est }, extra)) })
          : guardar({ feedback: obj(k, Object.assign({ tipo: tipo, texto: t.slice(0, 1200), estacion: est, t: Date.now() }, extra)) });
      }).then(function () { txt.value = ""; ADJ = []; pintarClaude(); var s2 = document.getElementById("acd-env-st"); if (s2) s2.textContent = "Enviado. Te contestamos aquí mismo."; },
        function (e) { env.disabled = false; st.textContent = "No se ha podido enviar" + (e && /captura/.test(e.message || "") ? ": " + e.message + "." : ". Prueba otra vez."); });
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
  /**
   * 🔴 9-oct · SOLO EL PROFESORADO INVITADO. Un estudiante del PER 16450 abrió esta página, entró con Google y quedó registrado
   * como docente y alistado en el grupo de la Academia (con Norberto de comandante). Norberto: «La Academia es SOLO para
   * docentes: los que yo añado manualmente o a través de un enlace. NO debe haber ninguna otra forma». Antes de alistar, su
   * ficha de formación: si ya la tiene, adelante; si no, la pide al servidor con su invitación (el `?inv=` de su enlace), que
   * solo la hace con el visto bueno de Norberto (GamificaPro: `modFormacion`, `alta: 'invitacion'`). Sin ella, ni registro ni
   * alistamiento (las reglas tampoco dejan nacer la ficha de recluta de este grupo sin la de formación).
   */
  var INV = (function () { try { return new URLSearchParams(location.search).get("inv") || ""; } catch (e) { return ""; } })();
  /**
   * 🔴 9-oct (segunda capa) · LA BENDICIÓN DEL COMANDANTE. Norberto: «si algún usuario consigue acceder a la academia y su nombre
   * no es ninguno de [mi lista], debe aparecerle que gracias por matricularte en la academia, pero debe esperar la "bendición" del
   * comandante para poder entrar». Su ficha de formación nace bendecida solo si le abre la puerta Norberto en persona (su correo
   * autorizado, o es del Mando o vitalicio); con un enlace, espera. La guardia se lo dice a Norberto y él la da (su panel, abajo).
   * Sin ella: esta pantalla, sin curso ni alistamiento (el servidor y las reglas tampoco lo dejan).
   */
  function conPermiso() {
    return M.academiaMia().then(function (d) {
      if (d) return d;
      return M.academiaGuardar({ alias: ((YO && YO.nombre) || "").split(" ")[0] || "" }, { invitacion: INV }).then(function () {
        if (INV) try { history.replaceState(null, "", location.pathname); } catch (e) { /* (sin historia, da igual) */ }
        return M.academiaMia();
      }, function (e) {
        if (/permission/i.test(String((e && e.code) || ""))) { var x = new Error((e && e.message) || ""); x.sinInvitacion = true; throw x; }
        throw e;
      });
    }).then(function (d) {
      if (!d || !d.bendicion) { var x = new Error("sin bendición"); x.sinBendicion = true; throw x; }
      return d;
    });
  }
  /**
   * 🔴 9-oct · LA PREGUNTA. Norberto: «Una pregunta clara: ¿Eres DOCENTE o ESTUDIANTE del Máster en Tecnología Educativa de la
   * UNIR? Si es estudiante se cierra la puerta; si es docente, apruebo yo». Sale a quien entra sin invitación (ni su correo
   * autorizado ni un enlace). Estudiante: la puerta cerrada y el camino a su clase. Docente: pide entrar (el servidor le hace la
   * ficha SIN bendición: `solicitud`) y espera; la guardia se lo cuenta a Norberto y él la da o no.
   */
  function portadaPregunta() {
    app.innerHTML = '<main class="acd">' + cabecera(null) +
      '<section class="acd-ses"><div class="card acd-carta"><h2>Antes de entrar, una pregunta</h2>' +
      "<p><b>¿Eres DOCENTE o ESTUDIANTE del Máster en Tecnología Educativa de la UNIR?</b></p>" +
      '<div class="acd-botones"><button type="button" class="btn primary grande" id="acd-soy-docente">Soy DOCENTE</button>' +
      '<button type="button" class="btn grande" id="acd-soy-estudiante">Soy ESTUDIANTE</button></div>' +
      '<p class="small muted" id="acd-soy-st" aria-live="polite"></p></div></section></main>';
    document.getElementById("acd-soy-estudiante").onclick = portadaEstudiante;
    var bd = document.getElementById("acd-soy-docente"), st = document.getElementById("acd-soy-st");
    bd.onclick = function () {
      bd.disabled = true; st.textContent = "Enviando tu solicitud…";
      M.academiaGuardar({ alias: ((YO && YO.nombre) || "").split(" ")[0] || "" }, { solicitud: "docente" })
        .then(function () { location.reload(); }, function (e) { bd.disabled = false; st.textContent = "No se ha podido: " + ((e && e.message) || e); });
    };
  }
  function portadaEstudiante() {
    app.innerHTML = '<main class="acd">' + cabecera(null) +
      '<section class="acd-ses"><div class="card acd-carta"><h2>La Academia es solo para el profesorado</h2>' +
      "<p>Aquí se forma el equipo docente, así que la puerta está cerrada para el alumnado.</p>" + claseAlumnado() +
      "</div></section></main>";
  }
  function portadaEsperaBendicion() {
    app.innerHTML = '<main class="acd">' + cabecera(null) +
      '<section class="acd-ses"><div class="card acd-carta"><h2>¡Gracias por matricularte en la Academia de la Cero!</h2>' +
      "<p>Para poder entrar, tienes que esperar la <b>bendición del Comandante</b>. Cuando te la dé, esta página se abrirá sola con tu curso.</p>" +
      claseAlumnado() +
      "</div></section></main>";
  }
  /**
   * 9-oct · EL CAMINO A SU CLASE. Quien llega aquí sin ser docente suele ser un estudiante que se ha equivocado de puerta (seis el
   * 6-oct). Norberto: «un mensaje sencillo que les lleve a alistarse a ese per y escojan ellos su comandante». El grupo y su enlace,
   * en la configuración de la Academia (`clase_alumnado`, _site_data.py); en cuanto se alistan, la guardia les saca de aquí sola.
   */
  function claseAlumnado() {
    var k = C.clase_alumnado;
    return "<p><b>¿Eres estudiante?</b> Entonces esta no es tu sitio: la Academia es la formación del profesorado. " +
      (k ? "Alístate en tu clase, el <b>" + esc(k.nombre) + "</b>, y elige allí a tu comandante. Es un minuto.</p>" +
        '<div class="acd-botones"><a class="btn primary" href="' + esc(k.enlace) + '">' + ico("estrella") + " Alistarme en el " + esc(k.nombre) + "</a>" +
        '<a class="btn" href="consola.html">Ya estoy alistado: ir a Mi nave</a></div>'
      : "Tu clase está en <b>Mi nave</b>; si aún no te has alistado, hazlo con el código que te ha dado tu docente.</p>" +
        '<div class="acd-botones"><a class="btn primary" href="consola.html">' + ico("estrella") + " Ir a Mi nave</a></div>");
  }
  function portadaSoloDocentes(motivo) {
    app.innerHTML = '<main class="acd">' + cabecera(null) +
      '<section class="acd-ses"><div class="card acd-carta"><h2>La Academia es solo para el profesorado invitado</h2>' +
      "<p>" + esc(motivo || "Esta formación es solo para el profesorado invitado.") + "</p>" +
      claseAlumnado() +
      '<p class="acd-nota small">¿Eres docente y te han invitado? Entra con la cuenta de Google con la que te invitaron o pide un enlace nuevo a quien organiza la formación.</p>' +
      "</div></section></main>";
  }
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
      "<h2>" + N + " sesiones cortas, a tu ritmo</h2><p class=\"acd-voz\">«El viaje de La Constancia: en cada planeta, un poco de su historia, una pieza de la herramienta, una misión en tu consola de ensayo y sus preguntas dentro de un minijuego. Una sesión cada vez.»<span>NEBULA</span></p>" +
      '<p class="acd-que">Unas ' + Math.round(total / 60) + " horas en total, repartidas como quieras: cada sesión se abre al terminar la anterior, y siempre sigues donde lo dejaste.</p>" +
      '<div class="acd-botones"><button type="button" class="btn primary grande btn-google" id="acd-entrar">' + ((window.SG && window.SG.LOGO_G) || "") + "<span>Entrar con mi cuenta de Google</span></button></div>" +
      '<p class="acd-nota">' + ico("candado") + " <b>Solo para el profesorado invitado.</b> Al entrar con tu invitación quedas <b>registrado como docente</b> de STARGATE y <b>alistado como recluta</b> en el grupo de la Academia, para vivirla como tu alumnado. <b>Tus estudiantes nunca verán tu correo:</b> si lo prefieres, usa una cuenta personal.</p></div>" +
      '<img class="acd-pj" src="assets/img/personajes/nebula.png" alt="NEBULA"></div></div></div></section></main>';
    var b = document.getElementById("acd-entrar");
    if (b) b.onclick = function () { b.disabled = true; M.entrar().then(function () { location.reload(); }, function (e) { b.disabled = false; if (window.SG && window.SG.avisar) window.SG.avisar("No se ha podido entrar", String((e && e.message) || e)); }); };
  }
  /**
   * 🔴 29-sep (noche) · QUIEN LA ORGANIZA NO LA HACE: LA LLEVA. Norberto: «si yo accedo a esa página, puedo ver quién se ha
   * inscrito, gestionar todo; el resto de docentes, TODOS sin excepción, accederán como estudiantes, incluyendo Caridad y Anita».
   * Con la cuenta del organizador (C.organiza) no hay registro ni alistamiento: sale su panel. Todos los demás —también los
   * vitalicios— la hacen como alumnado. Lo que haga falta tocar en la ficha de alguien (validar o anular un reto), en el grupo
   * de la Academia, que solo se abre desde aquí (motor.js → misPERs no lo enseña en «Mi nave»).
   */
  function esOrganiza(yo) { return !!(yo && C.organiza && String(yo.correo || "").toLowerCase() === String(C.organiza.correo || "").toLowerCase()); }
  function haceCuanto(t) {
    if (!t) return "sin actividad";
    var d = Math.floor((Date.now() - t) / 864e5);
    return d <= 0 ? "hoy" : d === 1 ? "ayer" : "hace " + d + " días";
  }
  function hiloDe(x) {
    var L = [], cl = ((x.claude || {}).mensajes) || {}, pr = x.preguntas || {}, fb = x.feedback || {};
    var NOMBRE_FB = { fallo: "Algo no funciona", idea: "Una idea", otra: "Otra cosa", juego: "Un juego" };
    Object.keys(cl).forEach(function (k) { L.push({ t: Number(cl[k].t) || Number(k) || 0, de: "claude", x: cl[k].texto }); });
    var md = ((x.mando || {}).mensajes) || {};
    Object.keys(md).forEach(function (k) { L.push({ t: Number(md[k].t) || Number(k) || 0, de: "mando", x: md[k].texto }); });
    Object.keys(pr).forEach(function (k) { L.push({ t: Number(k) || 0, de: "el", x: pr[k].texto, adj: pr[k].adjuntos }); });
    Object.keys(fb).forEach(function (k) { var f = fb[k] || {}, jg = f.tipo === "juego";
      L.push({ t: Number(k) || 0, de: "el", adj: f.adjuntos, x: "[" + (NOMBRE_FB[f.tipo] || "Nota") + (jg && f.hito ? " · " + f.hito.replace(/-juego$/, "") : "") + (jg && f.nivel ? " · " + f.nivel : "") + "] " + (f.texto || f.dificultad || (jg ? "" : f.nivel) || "") }); });
    return L.sort(function (a, b) { return a.t - b.t; });
  }
  function sinRespuesta(x) {
    var cl = ((x.claude || {}).mensajes) || {}, md = ((x.mando || {}).mensajes) || {}, ult = 0;
    Object.keys(cl).forEach(function (k) { ult = Math.max(ult, Number(cl[k].t) || Number(k) || 0); });
    Object.keys(md).forEach(function (k) { ult = Math.max(ult, Number(md[k].t) || Number(k) || 0); });   // (si ya le has respondido tú, está respondido)
    return Object.keys(x.preguntas || {}).filter(function (k) { return Number(k) > ult; }).length +
           Object.keys(x.feedback || {}).filter(function (k) { return Number(k) > ult && (x.feedback[k] || {}).tipo !== "juego"; }).length;
  }
  /**
   * 30-sep · DOS PESTAÑAS PARA QUIEN LA ORGANIZA. Norberto: «que no fuera una clase como tal, sino que en secciones estuviera
   * Academia y ahí pudieran entrar siempre que quisieran. Si yo entro con mi correo, únicamente yo, además de ver la Academia
   * como tal, tengo acceso a lo que ha hecho cada profesor, quién está inscrito, los emails, modificarlos, echar a un profesor
   * antiguo». «Tu profesorado» es su panel; «La Academia» es el curso tal cual, con todas las sesiones abiertas para mirarlas
   * (lo que haga ahí se guarda en su navegador, como la demostración: no se registra ni se alista).
   */
  var ORG = false, VER = false;
  /**
   * 🔴 30-sep · LAS COORDINADORAS. Norberto: «es importante que Anita y Caridad puedan ver las personas que estén haciendo el
   * curso en la academia, pero también que ellas lo puedan hacer como estudiantes… son las primeras que van a hacer esta
   * formación». Quien puede leer la lista (las reglas: el Mando, los vitalicios y los referentes activos) y no la organiza, la
   * hace como todos y además tiene una segunda pestaña, «Tu profesorado»: quién la está haciendo y cuánto lleva, sin tocar nada.
   */
  var VIGIA = false, EN_LISTA = false;
  function pestanasVigia(cual) {
    return '<nav class="acd-org-tabs" aria-label="La Academia y tu profesorado">' +
      '<button type="button" class="acd-org-tab' + (cual === "curso" ? " on" : "") + '" data-vig="curso"' + (cual === "curso" ? ' aria-current="page"' : "") + ">" + ico("libro") + " Tu Academia</button>" +
      '<button type="button" class="acd-org-tab' + (cual === "profes" ? " on" : "") + '" data-vig="profes"' + (cual === "profes" ? ' aria-current="page"' : "") + ">" + ico("gente") + " Tu profesorado</button></nav>";
  }
  function engancharVigia() {
    Array.prototype.forEach.call(app.querySelectorAll("[data-vig]"), function (b) {
      b.onclick = function () { if (b.getAttribute("data-vig") === "profes") pintarVigia(); else pintar(); };
    });
  }
  function pctDe(x) { var a = x.avance || {}; return a.fin ? 100 : a.de ? Math.min(99, Math.round(100 * (Number(a.hitos) || 0) / Number(a.de))) : 0; }
  function pintarVigia() {
    EN_LISTA = true;
    app.innerHTML = '<main class="acd acd-org">' + pestanasVigia("profes") + '<p class="muted">Leyendo quién la está haciendo…</p></main>';
    engancharVigia();
    M.academiaTodos().then(function (todos) {
      if (!EN_LISTA) return;
      var org = String((C.organiza || {}).correo || "").toLowerCase();
      var P = todos.filter(function (x) { return String(x.correo).toLowerCase() !== org; })
        .sort(function (a, b) { return pctDe(b) - pctDe(a) || (Number(b.t) || 0) - (Number(a.t) || 0); });
      var fin = P.filter(function (x) { return x.avance && x.avance.fin; }).length;
      var cifra = function (n, t) { return '<div class="acd-org-c"><b>' + n + "</b><span>" + t + "</span></div>"; };
      app.innerHTML = '<main class="acd acd-org">' + pestanasVigia("profes") +
        '<section class="card acd-org-cab"><p class="kicker">La Academia de la Cero · tu profesorado</p><h1>Quién la está haciendo</h1>' +
        "<p>Cada docente, cuánto lleva y cuándo entró por última vez. Para animar a quien va parado y felicitar a quien la termina. Lo de gestionar (correos, bajas, respuestas) lo lleva " + esc((C.organiza || {}).nombre || "quien la organiza") + ".</p>" +
        '<div class="acd-org-cifras">' + cifra(P.length, P.length === 1 ? "inscrito" : "inscritos") + cifra(P.length - fin, "en marcha") + cifra(fin, "terminada") +
          cifra(P.length ? Math.round(P.reduce(function (s2, x) { return s2 + pctDe(x); }, 0) / P.length) + " %" : "—", "de media") + "</div>" +
        '<div class="acd-botones"><button type="button" class="btn" id="acd-vig-copiar">' + ico("enlace") + " Copiar el enlace para el profesorado</button></div>" +
        '<p class="acd-nota small" id="acd-vig-msg" aria-live="polite"></p></section>' +
        (P.length ? P.map(function (x) {
          var a = x.avance || {}, p = pctDe(x), ses = Number(a.sesiones) || 0, tot = Number(a.total) || N;
          return '<div class="card acd-org-p acd-vig-p"><div class="acd-org-q"><b>' + esc(x.nombre || x.alias || x.correo) + (YO && x.uid === YO.uid ? " (tú)" : "") + "</b><small>" + esc(x.correo) + " · " + haceCuanto(Number(x.t)) + "</small></div>" +
            '<div class="acd-org-a"><div class="acd-barra" aria-hidden="true"><i style="width:' + Math.max(p, 2) + '%"></i></div>' +
            "<span>" + (a.fin ? "<b>" + esc(C.final.titulo) + "</b>" : p + " % · " + ses + " de " + tot + " sesiones") + "</span></div></div>";
        }).join("") : '<section class="card"><p class="muted">Todavía no se ha inscrito nadie.</p></section>') + "</main>";
      engancharVigia();
      var cp = document.getElementById("acd-vig-copiar");
      if (cp) cp.onclick = function () {
        var u = location.origin + "/academia.html", m = document.getElementById("acd-vig-msg");
        var ok = function () { m.textContent = "Copiado: " + u; }, mal = function () { m.textContent = "El enlace: " + u; };
        try { navigator.clipboard.writeText(u).then(ok, mal); } catch (e) { mal(); }
      };
    }, function () {
      if (EN_LISTA) app.querySelector("main").insertAdjacentHTML("beforeend", '<p class="aviso malo">No se ha podido leer la lista. Prueba dentro de un rato.</p>');
    });
  }
  function pestanasOrg(cual) {
    return '<nav class="acd-org-tabs" aria-label="La Academia, para quien la organiza">' +
      '<button type="button" class="acd-org-tab' + (cual === "profes" ? " on" : "") + '" data-org="profes"' + (cual === "profes" ? ' aria-current="page"' : "") + ">" + ico("gente") + " Tu profesorado</button>" +
      '<button type="button" class="acd-org-tab' + (cual === "curso" ? " on" : "") + '" data-org="curso"' + (cual === "curso" ? ' aria-current="page"' : "") + ">" + ico("libro") + " La Academia</button></nav>";
  }
  function engancharPestanas() {
    Array.prototype.forEach.call(app.querySelectorAll("[data-org]"), function (b) {
      b.onclick = function () { var k = b.getAttribute("data-org"); lsPoner("org.tab", k); if (k === "curso") verCurso(); else pintarOrganiza(); };
    });
  }
  function verCurso() { DEMO = true; VER = true; DOC = lsLeer("doc", { pasos: {} }); ACTUAL = null; PANT = 0; pintar(); }
  function pintarOrganiza() {
    DEMO = false; VER = false;
    app.innerHTML = '<main class="acd">' + pestanasOrg("profes") + '<p class="muted">Leyendo quién se ha inscrito…</p></main>';
    engancharPestanas();
    Promise.all([M.academiaTodos(), M.academiaFichas ? M.academiaFichas(G).catch(function () { return []; }) : Promise.resolve([])]).then(function (r) {
      var todos = r[0], fichas = r[1], yo = String(C.organiza.correo || "").toLowerCase(), uidYo = YO && YO.uid;
      var P = todos.filter(function (x) { return String(x.correo).toLowerCase() !== yo && x.uid !== uidYo; })
        .sort(function (a, b) { return (Number(b.t) || 0) - (Number(a.t) || 0); });
      var fichaDe = {}; fichas.forEach(function (f) { if (f.userId) fichaDe[f.userId] = f; });
      var registrados = {}; todos.forEach(function (x) { registrados[x.uid] = true; });
      var sueltas = fichas.filter(function (f) { return !registrados[f.userId] && f.userId !== uidYo; });
      var fin = P.filter(function (x) { return x.avance && x.avance.fin; }).length;
      var dudas = P.reduce(function (s, x) { return s + sinRespuesta(x); }, 0);
      var cifra = function (n, t) { return '<div class="acd-org-c"><b>' + n + "</b><span>" + t + "</span></div>"; };
      var CAMPOS = [["objetivo", "El objetivo"], ["dinamica", "La dinámica"], ["mecanica", "La mecánica"], ["componente", "El componente"], ["comprobar", "Cómo lo sabrá"]];
      var fila = function (x) {
        var a = x.avance || {}, ses = Number(a.sesiones) || 0, tot = Number(a.total) || N, sr = sinRespuesta(x), H = hiloDe(x), d = x.diseno || {}, f = fichaDe[x.uid];
        var conDiseno = CAMPOS.some(function (c) { return String(d[c[0]] || "").trim(); });
        return '<details class="card acd-org-p" data-uid="' + esc(x.uid) + '"><summary>' +
          '<div class="acd-org-q"><b>' + esc(x.nombre || x.alias || x.correo) + "</b><small>" + esc(x.correo) + " · " + haceCuanto(Number(x.t)) + "</small></div>" +
          '<div class="acd-org-a"><div class="acd-barra" aria-hidden="true"><i style="width:' + Math.round(100 * Math.min(ses, tot) / Math.max(1, tot)) + '%"></i></div>' +
          "<span>" + (a.fin ? "<b>" + esc(C.final.titulo) + "</b>" : ses + " de " + tot + " sesiones") + "</span></div>" +
          (sr ? '<span class="chip acd-org-dudas">' + sr + " sin respuesta</span>" : "") +
          (x.bendicion ? "" : '<span class="chip acd-org-dudas">Espera tu bendición</span>') +
          "</summary>" +
          // 9-oct · la bendición del Comandante: sin ella no entra (ni se alista en el grupo de la Academia)
          (x.bendicion ? "" : '<div class="acd-botones"><button type="button" class="btn primary" data-bendecir>' + ico("estrella") + " Dar la bendición</button>" +
            '<span class="small muted">Sin ella no puede entrar en la Academia. Si no es docente, échale abajo.</span></div>') +
          '<p class="small muted">Hitos: ' + (Number(a.hitos) || 0) + " de " + (Number(a.de) || "—") + (x.alias ? " · alias en la Academia «" + esc(x.alias) + "»" : "") +
            " · " + (f ? "alistado en el grupo de la Academia como «" + esc(f.alias) + "» (" + f.retos + (f.retos === 1 ? " reto" : " retos") + ")" : "sin ficha de recluta todavía") + "</p>" +
          (conDiseno ? '<h3>Su primera pieza</h3><dl class="acd-org-dis">' + CAMPOS.map(function (c) { return "<dt>" + c[1] + "</dt><dd>" + (esc(d[c[0]] || "") || "—") + "</dd>"; }).join("") + "</dl>" : "") +
          "<h3>Mensajes</h3>" + '<div class="acd-org-hilo">' + hiloOrg(x, H) + "</div>" +
          // 30-sep · RESPONDERLE TÚ (Norberto: «un botón Responder en el hilo de cada docente»): le llega a su hilo, con tu nombre
          '<div class="acd-org-resp"><textarea rows="2" maxlength="2000" data-resp aria-label="Tu respuesta a ' + esc(x.nombre || x.correo) + '" placeholder="Responder a ' +
            esc((x.nombre || "").split(" ")[0] || "este docente") + ': le llega a su hilo de la Academia, con tu nombre."></textarea>' +
            '<div class="acd-botones"><button type="button" class="btn primary" data-responder>Responder</button><span class="small muted" data-resp-st aria-live="polite"></span></div></div>' +
          '<h3>Gestionar</h3><div class="acd-org-ed">' +
            '<label><span>Nombre</span><input type="text" maxlength="80" data-ed="nombre" value="' + esc(x.nombre || "") + '"></label>' +
            '<label><span>Correo</span><input type="email" maxlength="120" data-ed="correo" value="' + esc(x.correo || "") + '"></label></div>' +
          '<p class="small muted">El correo es el que se usa al añadirle a un grupo desde «Crear un grupo». Si lo cambias, tendrá que entrar con esa cuenta de Google.</p>' +
          '<div class="acd-botones"><button type="button" class="btn" data-guardar>Guardar los cambios</button>' +
            '<button type="button" class="btn peligro" data-echar>Echar de la Academia</button></div><p class="small acd-org-res" aria-live="polite"></p>' +
          "</details>";
      };
      function hiloOrg(x, H) {
        return H.length ? '<div class="acd-hilo">' + H.map(function (m) {
          // (aquí «tú» eres quien organiza: lo tuyo a la derecha, como en cualquier chat; lo del docente, a la izquierda)
          return '<div class="acd-msj ' + (m.de === "claude" ? "acd-de-claude" : m.de === "mando" ? "acd-de-mando acd-mio" : "acd-de-el") + '"><b>' +
            (m.de === "claude" ? "NEBULA" : m.de === "mando" ? "Tú" : esc(x.alias || (x.nombre || "").split(" ")[0] || "Docente")) +
            " <small>" + (m.t ? new Date(m.t).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "") + "</small></b><p>" + esc(m.x) + "</p>" + adjuntosHtml(m.adj) + "</div>"; }).join("") + "</div>"
          : '<p class="muted">Todavía no ha escrito nada.</p>';
      }
      var suelta = function (f) {
        return '<div class="card acd-org-p acd-org-suelta" data-ficha="' + esc(f.id) + '"><div class="acd-org-q"><b>' + esc(f.alias || "Sin alias") + "</b><small>" +
          esc([f.nombre, f.correo].filter(Boolean).join(" · ") || "sin datos") + " · alistado " + haceCuanto(f.creado) + "</small></div>" +
          '<button type="button" class="btn peligro min" data-echar-ficha>Echar del grupo</button><p class="small acd-org-res" aria-live="polite"></p></div>';
      };
      app.innerHTML = '<main class="acd acd-org">' + pestanasOrg("profes") +
        '<section class="card acd-org-cab"><p class="kicker">La Academia de la Cero · la organizas tú</p><h1>Tu profesorado en la Academia</h1>' +
        "<p>Quién se ha inscrito, lo que ha hecho cada uno y sus mensajes. Aquí corriges su nombre o su correo y echas a quien ya no la va a hacer. Todos los demás docentes, sin excepción, la hacen como alumnado.</p>" +
        '<div class="acd-org-cifras">' + cifra(P.length, P.length === 1 ? "inscrito" : "inscritos") + cifra(P.length - fin, "en marcha") + cifra(fin, "terminada") + cifra(dudas, "sin respuesta") + "</div>" +
        // 🔴 9-oct · solo con invitación: un correo autorizado o un enlace de un solo uso (el enlace pelado ya no registra a nadie)
        '<div class="acd-org-ed"><label><span>Autorizar a un docente por su correo de Google</span><input type="email" maxlength="120" id="acd-org-correo" placeholder="nombre@gmail.com"></label></div>' +
        '<div class="acd-botones"><button type="button" class="btn primary" id="acd-org-autorizar">' + ico("candado") + " Autorizar ese correo</button>" +
        '<button type="button" class="btn" id="acd-org-copiar">' + ico("enlace") + " Crear un enlace de invitación (un solo uso)</button></div>" +
        '<div class="acd-botones">' +
        '<a class="btn" href="crear.html">' + ico("estrella") + " Crear un grupo con ellos</a>" +
        '<a class="btn" href="buzon.html?desde=academia">' + ico("mensaje") + " Sus dudas, en el buzón del Mando</a></div>" +
        // 1-oct · un solo botón de ayuda: desde hoy sus dudas van al buzón (las contesta la guardia, firmadas por NEBULA)
        '<p class="acd-nota small">Desde el 1-oct sus dudas y lo que no funciona llegan al <b>buzón del Mando</b>, como las de las clases (marcadas «La Academia de la Cero»), y las contesta la guardia como NEBULA. Aquí quedan sus mensajes anteriores y los comentarios de NEBULA a lo que entregan.</p>' +
        '<p class="acd-nota small" id="acd-org-msg" aria-live="polite"></p></section>' +
        (P.length ? P.map(fila).join("") : '<section class="card"><p class="muted">Todavía no se ha inscrito nadie. Autoriza su correo o mándale un enlace de invitación: al entrar con Google quedan registrados y alistados.</p></section>') +
        (sueltas.length ? '<h2 class="acd-org-h2">En el grupo de la Academia, sin inscribirse</h2><p class="small muted">Cuentas alistadas como recluta que no han entrado en la Academia (por ejemplo, una de pruebas).</p>' + sueltas.map(suelta).join("") : "") +
        "</main>";
      engancharPestanas();
      var cp = document.getElementById("acd-org-copiar");
      if (cp) cp.onclick = function () {
        var m = document.getElementById("acd-org-msg"); cp.disabled = true; m.textContent = "Creando el enlace…";
        M.academiaInvitar().then(function (r) {
          cp.disabled = false;
          var u = location.origin + "/academia.html?inv=" + encodeURIComponent(r.token);
          var hasta = " Sirve para UNA persona y caduca el " + new Date(r.caduca).toLocaleDateString("es-ES") + ".";
          var ok = function () { m.textContent = "Copiado: " + u + "." + hasta; }, mal = function () { m.textContent = "El enlace: " + u + "." + hasta; };
          try { navigator.clipboard.writeText(u).then(ok, mal); } catch (e) { mal(); }
        }, function (e) { cp.disabled = false; m.textContent = "No se ha podido crear el enlace: " + ((e && e.message) || e); });
      };
      var au = document.getElementById("acd-org-autorizar");
      if (au) au.onclick = function () {
        var m = document.getElementById("acd-org-msg"), c = document.getElementById("acd-org-correo"), v = String(c.value || "").trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(v)) { m.textContent = "Escribe un correo de Google válido."; c.focus(); return; }
        au.disabled = true; m.textContent = "Autorizando…";
        M.academiaInvitar(v).then(function () { au.disabled = false; c.value = ""; m.textContent = "Autorizado: " + v + ". Ya puede entrar en la Academia con esa cuenta de Google (" + location.origin + "/academia.html)."; },
          function (e) { au.disabled = false; m.textContent = "No se ha podido autorizar: " + ((e && e.message) || e); });
      };
      var sinReglas = function (e) { return /permission|insufficient|denegad/i.test(String((e && (e.code || e.message)) || "")) ? " Falta desplegar las reglas nuevas de la Academia (desplegar_stargate.sh reglas)." : ""; };
      Array.prototype.forEach.call(app.querySelectorAll("[data-uid]"), function (el) {
        var uid = el.getAttribute("data-uid"), x = P.filter(function (y) { return y.uid === uid; })[0], res = el.querySelector(".acd-org-res");
        var bb = el.querySelector("[data-bendecir]");
        if (bb) bb.onclick = function () {
          bb.disabled = true; res.textContent = "Dando la bendición…";
          M.academiaBendecir(uid).then(function () { res.textContent = "Bendecido: ya puede entrar en la Academia."; bb.remove(); },
            function (e) { bb.disabled = false; res.textContent = "No se ha podido: " + ((e && e.message) || e); });
        };
        var br = el.querySelector("[data-responder]");
        br.onclick = function () {
          var ta = el.querySelector("[data-resp]"), rst = el.querySelector("[data-resp-st]"), t = ta.value.trim();
          if (t.length < 2) { rst.textContent = "Escribe la respuesta primero."; ta.focus(); return; }
          br.disabled = true; rst.textContent = "Enviando…";
          M.academiaResponder(uid, t, C.organiza.nombre).then(function (k) {
            x.mando = x.mando || {}; x.mando.mensajes = x.mando.mensajes || {}; x.mando.mensajes[k] = { texto: t, t: k };
            el.querySelector(".acd-org-hilo").innerHTML = hiloOrg(x, hiloDe(x));
            var ch = el.querySelector(".acd-org-dudas"); if (ch && !sinRespuesta(x)) ch.remove();
            var cd = app.querySelectorAll(".acd-org-c b")[3]; if (cd) cd.textContent = P.reduce(function (s2, y) { return s2 + sinRespuesta(y); }, 0);
            ta.value = ""; br.disabled = false; rst.textContent = "Enviado: lo verá en su hilo de la Academia.";
          }, function (e) { br.disabled = false; rst.textContent = "No se ha podido enviar: " + ((e && e.message) || e) + sinReglas(e); });
        };
        el.querySelector("[data-guardar]").onclick = function () {
          var nombre = el.querySelector('[data-ed="nombre"]').value.trim(), correo = el.querySelector('[data-ed="correo"]').value.trim();
          res.textContent = "Guardando…";
          M.academiaEditar(uid, { nombre: nombre, correo: correo }).then(function () { res.textContent = "Guardado."; x.nombre = nombre; x.correo = correo.toLowerCase(); },
            function (e) { res.textContent = "No se ha podido guardar: " + ((e && e.message) || e) + sinReglas(e); });
        };
        el.querySelector("[data-echar]").onclick = function () {
          var b = this, f = fichaDe[uid], nom = x.nombre || x.correo;
          window.SG.preguntar({ aqui: b.closest(".acd-botones") || b, marca: b, titulo: "¿Echar a «" + nom + "» de la Academia?",
            texto: "Se borra su registro (su camino, su diseño y sus mensajes)" + (f ? " y su ficha de recluta del grupo de la Academia" : "") + ". Si vuelve a entrar con el enlace, empezará de cero.",
            si: "Echar", peligro: true }).then(function (si) {
            if (!si) return;
            b.disabled = true; res.textContent = "Echando…";
            (f ? M.darDeBaja(G, f.id) : Promise.resolve()).then(function () { return M.academiaQuitar(uid); }).then(pintarOrganiza,
              function (e) { b.disabled = false; res.textContent = "No se ha podido: " + ((e && e.message) || e) + sinReglas(e); });
          });
        };
      });
      Array.prototype.forEach.call(app.querySelectorAll("[data-ficha]"), function (el) {
        var id = el.getAttribute("data-ficha"), f = sueltas.filter(function (y) { return y.id === id; })[0], res = el.querySelector(".acd-org-res"), b = el.querySelector("[data-echar-ficha]");
        b.onclick = function () {
          window.SG.preguntar({ aqui: el, marca: b, titulo: "¿Echar a «" + (f.alias || "esta cuenta") + "» del grupo de la Academia?",
            texto: "Se borra su ficha de recluta en el grupo de la Academia.", si: "Echar", peligro: true }).then(function (si) {
            if (!si) return;
            b.disabled = true; res.textContent = "Echando…";
            M.darDeBaja(G, id).then(pintarOrganiza, function (e) { b.disabled = false; res.textContent = "No se ha podido: " + ((e && e.message) || e); });
          });
        };
      });
    }).catch(function (e) {
      app.innerHTML = '<main class="acd">' + pestanasOrg("profes") + '<section class="card"><h2>No se ha podido leer la Academia</h2><p>' + esc((e && e.message) || e) + "</p></section></main>";
      engancharPestanas();
    });
  }
  function escribiendo() { var t = document.activeElement && document.activeElement.tagName; return JUGANDO || t === "TEXTAREA" || t === "INPUT"; }
  // 30-sep · en el panel de quien organiza no se repinta el curso por encima (y así tampoco se le crea un registro)
  function enPanel() { return (ORG && !VER) || EN_LISTA; }
  // lo que se practica en otra pestaña de este navegador (la consola, la clase, la Nave) marca sus hitos al momento
  window.addEventListener("storage", function (e) { if (e.key === "sgAcademia" && !escribiendo() && !enPanel()) pintar(); });
  // y al volver a esta pestaña, se mira otra vez la ficha (la Ruta, el Simulador y los retos los apunta el servidor)
  document.addEventListener("visibilitychange", function () {
    // (30-sep · y si su ficha de recluta ya no está —la quitó quien organiza—, se vuelve a alistar sola, como al entrar)
    if (document.visibilityState === "visible" && !DEMO && YO && !escribiendo() && !enPanel())
      recargar().then(function () { if (!FICHA && !ORG) return conPermiso().then(function () { return alistarAuto(); }).then(recargar); }).then(pintar, function (e) { if (e && e.sinBendicion) portadaEsperaBendicion(); });
  });

  function arrancar() {
    M = window.SG && window.SG.MOTOR;
    if (DEMO) { DOC = lsLeer("doc", { pasos: {} }); pintar(); return; }
    if (!M) { app.innerHTML = '<main class="acd"><p>No se ha podido abrir la Academia.</p></main>'; return; }
    M.sesion().then(function (yo) {
      YO = yo;
      if (!yo) return portadaSinCuenta();
      if (esOrganiza(yo)) { ORG = true; return lsLeer("org.tab", "profes") === "curso" ? verCurso() : pintarOrganiza(); }   // (quien la organiza no se registra ni se alista: la lleva)
      return recargar().then(function () { return conPermiso(); }).then(function () { if (!FICHA) return alistarAuto().then(recargar); }).then(function () {
        var primeraVez = true;
        M.academiaEscuchar(function (d, err) {
          if (err) { SIN_GUARDAR = true; if (primeraVez) { primeraVez = false; pintar(); } return; }
          SIN_GUARDAR = false;
          DOC = d || { pasos: {} };
          // 🔴 entrar ES registrarse: su documento nace al entrar (con su nombre y su correo de Google), aunque no haga nada más
          if (primeraVez) { primeraVez = false; if (!d) guardar({ alias: (yo.nombre || "").split(" ")[0] || "" }).catch(function () {});
            // ¿puede leer la lista del profesorado? (las coordinadoras y los referentes): entonces, su segunda pestaña
            if (M.academiaTodos) M.academiaTodos().then(function () { VIGIA = true; if (!EN_LISTA && !escribiendo()) pintar(); }, function () {}); }
          if (EN_LISTA) return;   // (mirando «Tu profesorado»: su propio avance no repinta el curso por encima)
          if (!escribiendo()) pintar(); else pintarClaude();
        });
      });
    }).catch(function (e) {
      // 9-oct · sin invitación, la pregunta (con un enlace que no vale, lo que le pasa a ese enlace)
      if (e && e.sinInvitacion) return INV ? portadaSoloDocentes(e.message) : portadaPregunta();
      if (e && e.sinBendicion) return portadaEsperaBendicion();
      app.innerHTML = '<main class="acd"><p>No se ha podido abrir la Academia: ' + esc((e && e.message) || e) + "</p></main>";
    });
  }
  if (DEMO || (window.SG && window.SG.MOTOR)) arrancar(); else document.addEventListener("sg:motor", arrancar);
})();
