/**
 * STARGATE · LA CONSOLA DEL REFERENTE
 *
 * Todo lo que hacía el menú de la hoja de cálculo, en una página y sin hoja: crear grupos, cambiar
 * fechas y enlaces, mover el equipo docente, pasar el alumnado de un profesor a otro, otorgar o
 * anular retos y resolver la cola de nota.
 *
 * 🔴 No pide PIN: pide cuenta. Y eso no es solo más seguro —un PIN compartido de seis cifras se
 * adivina en unas horas y no hay forma de bloquear intentos—, es que además el PIN no distinguía a
 * nadie: quien lo tenía lo veía todo. Con la cuenta, cada docente ve sus grupos y el referente ve
 * los suyos, sin preguntarle a nadie quién es.
 */
(function () {
  "use strict";
  var app = document.querySelector("#consola-app");
  if (!app) return;
  var MOTOR = null, YO = null, PERS = [], PER = null, DATOS = null, TAB = "portada";   // 19-sep · se entra por la portada
  // 19-sep · «Gestionar grupos» (gestion.html) es esta misma consola en su otro modo: solo referentes, lo que se hace una
  // o dos veces por curso (Norberto: «solo desde esa página se pueden crear, borrar o gestionar… no hace falta meter ruido»)
  var GESTION = !!window.SG_GESTION;
  /**
   * 19-sep · PILOTO AUTOMÁTICO / MANDO MANUAL. Norberto: «el modo simple se limita a seguir lo que el referente ha creado,
   * sin complicaciones… proyecta su clase, sigue el guion. El avanzado permite crear alguna recompensa… Quiero evitar
   * que docentes nuevos se agobien y permitir a los experimentados DISFRUTAR». Por defecto, todos en piloto automático.
   * El piloto solo OCULTA (lo marcado con data-av y las pestañas de AV_TABS): no hay dos consolas que mantener.
   */
  var FICHA = null, MODO = "piloto", CLAVE_MODO = "sgModoNivel";
  var AV_TABS = ["zoco", "mios", "huevos", "sorteos", "ofertas"];
  function manual() { return MODO === "manual"; }
  function aplicarModo() {
    document.body.classList.toggle("modo-piloto", !manual());
    try { localStorage.setItem(CLAVE_MODO, MODO); } catch (e) {}
  }
  function cargarFicha() {
    var local = ""; try { local = localStorage.getItem(CLAVE_MODO) || ""; } catch (e) {}
    return (MOTOR.miFichaDocente ? MOTOR.miFichaDocente() : Promise.resolve(null)).then(function (f) {
      FICHA = f || {};
      MODO = (FICHA.modo === "manual" || FICHA.modo === "piloto") ? FICHA.modo : (local === "manual" ? "manual" : "piloto");
    }, function () { MODO = local === "manual" ? "manual" : "piloto"; }).then(aplicarModo);
  }
  function ponerModo(m) {
    MODO = m === "manual" ? "manual" : "piloto"; aplicarModo();
    // (se guarda en su ficha; si el servidor aún no lo admite, se queda en este navegador)
    if (MOTOR.ponerModoDocente) MOTOR.ponerModoDocente(MODO).then(function () { if (FICHA) FICHA.modo = MODO; }).catch(function () {});
    if (PER && DATOS) { if (!misTabs().some(function (x) { return x[0] === TAB; })) TAB = "portada"; pintar(); } else elegirGrupo();
  }
  function selectorModo() {
    return '<div class="modo-sel" role="group" aria-label="Cómo quieres tu consola">' +
      '<button type="button" data-modo="piloto" aria-pressed="' + !manual() + '"' + (manual() ? '' : ' class="on"') + ' title="Lo justo para dar tu clase: sigue el rumbo que ha marcado tu referente">' + ico("cohete") + ' Piloto automático</button>' +
      '<button type="button" data-modo="manual" aria-pressed="' + manual() + '"' + (manual() ? ' class="on"' : '') + ' title="Todo a mano: premios, tu sesión a medida, tu panel, mensajes y más">' + ico("ajustes") + ' Mando manual</button></div>';
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-modo]");
    if (!b || !YO) return;
    var m = b.getAttribute("data-modo"); if (m !== MODO) ponerModo(m);
  });
  var url = new URLSearchParams(location.search);
  if (/^[a-z_]+$/.test(url.get("tab") || "")) TAB = url.get("tab");   // 15-sep · el Capitán enlaza a una pestaña (p. ej. «Mis enlaces»)

  // 🔴 Mientras el motor por defecto siga siendo el viejo, un enlace a un grupo nuevo SIN el
  // interruptor lleva a «PER no encontrado». Y ese enlace es el que el profesorado copia y pega a
  // su clase: no puede estar mal ni un día. El día que se cambie el valor por defecto, esto sobra
  // y se quita de un sitio.
  var MOTOR_EN_ENLACES = "&motor=firestore";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /**
   * 🔴 12-sep · CON CONTEXTO, COMO EN `crear.js`. Aquí `$` solo aceptaba el selector y buscaba en toda
   * la consola, pero el editor de escondites lo llamaba como `$(".h-lim", fila)` creyendo que buscaba
   * DENTRO de cada fila. Siempre devolvía la primera fila de la página: editar cualquier escondite
   * que no fuera el primero no hacía nada, editar el primero escribía en el último (cada fila pisaba
   * los manejadores de la anterior) y la ✕ de «quitar» borraba siempre el último. Mismo nombre, dos
   * comportamientos según el fichero — por eso nadie lo vio. Lo destapó el laboratorio al configurar
   * «tope total 1» en el segundo escondite: se guardaba sin tope.
   */
  function $(s, d) { return (d || app).querySelector(s); }
  function cargando(t) { app.innerHTML = '<div class="card"><p class="muted">' + esc(t || "Cargando…") + "</p></div>"; }
  function fallo(t) { app.innerHTML = '<div class="card"><p class="malo">' + esc(t) + "</p></div>"; }

  // la «G» de Google vive en stargate.js (window.SG.LOGO_G), no copiada aquí
  var LOGO_G = (window.SG && window.SG.LOGO_G) || "";

  /**
   * 🔴 UN SOLO CABLEADO PARA TODOS LOS «COPIAR». Antes cada vista se cableaba los suyos, y la LISTA
   * DE GRUPOS no lo hacía: el «📋 Embed para Genially» de cada tarjeta —en la primera pantalla que ve
   * cualquier docente— no hacía NADA al pulsarlo. Sin error, sin aviso: un botón muerto a la vista
   * de todo el mundo. Lo encontró el laboratorio; la batería 64 no, porque daba por hecho que un botón
   * con `data-*` tenía a alguien escuchando.
   */
  // 🔴 Y NO SE CABLEA BOTÓN A BOTÓN, SINO UNA VEZ EN EL CONTENEDOR. La primera versión de este
  // arreglo cableaba los botones que había al pintar… y el contenido de cada pestaña se dibuja
  // DESPUÉS (algunas, además, tras pedir datos): los «Copiar» de «Mis enlaces» —donde el docente raso
  // tiene el enlace de alistamiento— se quedaban igual de mudos. Un oyente delegado en `app` sirve
  // para lo que hay y para lo que se dibuje luego, y nadie tiene que acordarse de nada.
  var copiarCableado = false;
  function cablearCopiar() {
    if (copiarCableado) return;
    copiarCableado = true;
    // 18-sep · la llave del Escape UNI: al escribirla, los dos botones de S7 se quedan con el enlace montado
    app.addEventListener("input", function (ev) {
      var i = ev.target; if (!i || i.id !== "s7-llave") return;
      var llave = String(i.value || "").trim();
      var ruta = "validar.html?reto=S7" + (llave ? "&llave=" + encodeURIComponent(llave) : "");
      var enl = document.getElementById("s7-enl"), cod = document.getElementById("s7-cod");
      if (enl) enl.setAttribute("data-copiar", llave ? location.origin + "/" + ruta : "");
      if (cod) cod.setAttribute("data-copiar", llave ? codigoGenially(ruta + "&embed=1", "STARGATE · Validar el reto secreto") : "");
    });
    app.addEventListener("click", function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest("[data-copiar]") : null;
      if (!b || !app.contains(b)) return;
      ev.preventDefault();
      var txt = b.getAttribute("data-copiar");
      // si el navegador no deja copiar solo, se ofrece el texto seleccionado para copiarlo con el teclado
      var copiarAMano = function (x) {
        window.SG.preguntar({ titulo: "Cópialo a mano", texto: "El navegador no me deja copiarlo solo. Ya está seleccionado: pulsa Ctrl+C (⌘+C en Mac).",
          campo: { valor: x, soloLectura: true, filas: x.length > 80 ? 4 : 1 }, si: "Hecho", no: "" });
      };
      var v = b.getAttribute("data-copiado") || "✓ Copiado";
      var ok = function () {
        if (b.__copiando) return; b.__copiando = true;
        var antes = b.innerHTML; b.textContent = v; b.classList.add("ok");
        setTimeout(function () { b.innerHTML = antes; b.classList.remove("ok"); b.__copiando = false; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(txt).then(ok).catch(function () { copiarAMano(txt); });
      else copiarAMano(txt);
    });
  }

  function puerta() {
    app.innerHTML = '<div class="card"><h3>Entra con tu cuenta</h3>' +
      '<p>Verás los grupos en los que figuras como docente. Si aún no tienes ninguno, podrás crear el primero.</p>' +
      '<p><button class="btn primary grande btn-google" id="c-entrar">' + LOGO_G +
      '<span>Iniciar sesión con Google</span></button></p>' +
      '<p class="small muted">Te llevará a la pantalla de Google. Tu contraseña se escribe allí, ' +
      'nunca aquí.</p></div>';
    $("#c-entrar").onclick = function () { MOTOR.entrar().catch(function (e) { fallo(e.message); }); };
  }

  // ---------------------------------------------------------------- elegir grupo
  /**
   * LA CASA DEL DOCENTE. Es lo primero que ve al entrar y, casi siempre, lo único que necesita.
   *
   * 🔴 Antes era una lista de botones grises con el id del grupo al lado, y para lanzar la clase
   * había que entrar al grupo, buscar la pestaña y salir a otra página. Norberto: «un docente debe
   * poder entrar y tener a mano sus grupos; a golpe de clic seleccionar el grupo actual y poder
   * lanzar la presentación para clase».
   *
   * Así que las acciones de directo —proyectar, el aula, la llamada— están EN la tarjeta, sin
   * entrar. Entrar al grupo es para lo demás: la gente, la cola de nota, los enlaces.
   */
  /** El mensaje que pega el docente en el foro o en el chat de clase. */
  // (15-sep · el texto vive en el motor: el Capitán del buzón da la misma invitación)
  function invitacion(p) { return MOTOR.invitacion(p); }

  /** 19-sep · Norberto: «no queremos emojis, tenemos iconos muy chulos». Los iconos propios (Magnific), en un sitio. */
  function ico(k, cls) {   // el pictograma suelto para texto y botones; con aro solo en grande
    var aro = /\bgrande\b/.test(cls || "");
    return '<img class="ico' + (cls ? " " + cls : "") + '" src="assets/img/iconos/' + (aro ? "" : "p/") + k + '.png" alt="" width="20" height="20">';
  }
  /** La rueda de «Configurar la sesión», al lado de «Empezar la clase» (en la fila del grupo y dentro de él). */
  function botonCfgSesion(per) {
    return '<button type="button" class="gp-cfg" data-av data-cfg-sesion="' + esc(per) + '" title="Configurar la sesión: qué diapositivas salen" aria-label="Configurar la sesión">' + ico("ajustes") + '</button>';
  }

  /**
   * 19-sep · «HOY TOCA», VISUAL. Norberto: «desarrolla más "Hoy toca", debe ser más visual, que se vean las fichas de retos
   * completas. Incorpora la info del calendario (entrega de tarea, presentación, etc.)». Todo sale de los datos de siempre:
   * la semana (SG_SEMANAS: hito, clases, lo que se lanza, vídeos), sus fechas (el calendario del grupo, con sus pausas),
   * los capítulos de NEBULA que se abren, y cada reto del catálogo con su gancho, su insignia y su ejemplo.
   */
  function semanaDe(S, sem) {
    var SEMS = window.SG_SEMANAS || [];
    return S.tipo === "PUA" ? SEMS.filter(function (x) { return x.tema_n === Math.min(sem, 8); })[0] : SEMS[Math.min(sem, SEMS.length) - 1];
  }
  var MESES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function diaC(iso) { var d = window.SGSEMANAS.fecha(iso); return d.getDate() + " " + MESES_C[d.getMonth()]; }
  function creditosDeRetoC(id, tipo) {
    var c = ((window.SG_CATALOGO || {}).creditos) || {}, k = id.charAt(0);
    var v = k === "A" ? c.retoA : k === "B" ? (tipo === "PUA" ? c.retoB_pua || c.retoB : c.retoB) : k === "L" ? c.relampago : k === "X" ? c.actividad : 0;
    return Number(v) || 0;
  }
  function icoCal(t) {
    return /^Test/i.test(t) ? "libro" : /present/i.test(t) ? "envivo" : /Bit[áa]cora/i.test(t) ? "notas" : /resoluci|entreg/i.test(t) ? "hecho" : "estrella";
  }
  /** La ficha de un reto, completa (como la ve el alumnado): insignia, qué es, su gancho, lo que da y su ejemplo. */
  function fichaReto(r, tipo, prog, luegoEn) {
    var rel = r.id.charAt(0) === "L", ins = (r.insignias || [])[0] || "", g = (window.SG_GANCHO_RETOS || {})[r.id] || "";
    var ej = (window.SG_EJEMPLOS || {})[r.id], m = /^(Reto (?:A|B|relámpago)|Actividad \d)\s*(.*)$/i.exec(r.titulo || "") || [null, "", r.titulo || ""];
    // 🔴 20-sep · Norberto: «deben aparecer todos los retos de esa semana; si no se han desbloqueado, se oscurecen o
    // aparece "se desbloquea la semana…"». Así se ve el tema entero desde su primera clase, sin prometer lo que aún
    // no pueden hacer.
    return '<article class="ht-reto' + (rel ? " rel" : "") + (luegoEn ? " por-lanzar" : "") + '">' +
      '<div class="ht-reto-cab"><span class="pt-id">' + esc(r.id) + '</span><span class="ht-tipo">' + esc(m[1] || "Reto") + '</span>' +
        (luegoEn ? '<span class="chip luego">' + ico("candado") + ' Se desbloquea la semana ' + luegoEn + '</span>' : '') +
        (rel && !luegoEn ? '<span class="chip rel">' + ico("rayo") + ' En clase · 10-15 min</span>' : '') + '</div>' +
      '<div class="ht-reto-cuerpo">' + (ins ? '<img class="ht-ins" src="assets/img/insignias/' + esc(ins) + '.png" alt="" loading="lazy" onerror="this.remove()">' : '') +
        '<div><b>' + esc(m[2] || r.titulo || "") + '</b>' + (g ? '<p>' + esc(g) + '</p>' : '') + '</div></div>' +
      '<div class="ht-reto-pie"><span class="p xp">+' + Number(r.xp || 0) + ' xp</span>' +
        (creditosDeRetoC(r.id, tipo) ? '<span class="p cr">+' + creditosDeRetoC(r.id, tipo) + ' ◈</span>' : '') +
        (prog ? '<span class="pt-n"><b>' + prog.n + '</b>/' + prog.N + ' · ' + prog.pct + ' %</span>' : '') +
        (ej && r.id !== "S7" ? '<a class="ht-ej" href="ejemplo.html?reto=' + esc(r.id) + '" target="_blank" rel="noopener">Ver un ejemplo ↗</a>' : '') + '</div>' +
    '</article>';
  }
  /**
   * 🔴 20-sep · EL MENSAJE DEL FORO, AQUÍ. Norberto: «añade justo encima de "el vídeo que toca" el mensaje del foro de
   * esa semana para tus estudiantes. Añade botón para ver todos los mensajes del foro y un icono de un lápiz para
   * editarlo (los docentes pueden personalizar sus propios mensajes si quieren y guardarlos para todos sus grupos)».
   * El suyo manda sobre el oficial; se guarda en su ficha (`MOTOR.guardarForo`), no en el grupo, porque vale para todos.
   */
  /**
   * 🔴 20-sep · EL MENSAJE DEL FORO, COMO UNA CARTA OFICIAL. Norberto: «¿no puedes mejorar el formato? Añadir un sello
   * del comandante, logo STARGATE… que sea un mensaje más profesional, como un mail / carta oficial, que termine con
   * el avatar del comandante y su nombre (detecta el docente y dibuja su avatar y nombre en cada grupo)». Pues eso: la
   * cabecera con la marca y la semana, el cuerpo en párrafos de verdad (el texto traía los saltos puestos a mano y se
   * veía «cortado») y la firma con SU comandante, SU nombre y el emblema de su escuadrón de sello.
   * Lo que se copia sigue siendo el texto plano: el foro de UNIR no entiende de sellos.
   */
  /**
   * 🔴 20-sep (tarde) · UN COMUNICADO, NO UN CORREO. Norberto: «que parezca un comunicado oficial de la nave
   * STARGATE». El mensaje del foro ya viene en bloques (`SG.foroParrafos`): lo que pasa, las ÓRDENES DE LA SEMANA
   * con sus retos y la firma. Aquí cada bloque se pinta como lo que es —encabezado, lista, párrafo— en vez de
   * aplastarlo todo a párrafos seguidos, que es lo que lo hacía parecer un aviso cualquiera.
   */
  function cartaForo(sem, texto, esc7) {
    var B = (window.SG && SG.foroParrafos) ? SG.foroParrafos(texto)
          : String(texto || "").split(/\n\s*\n/).map(function (x) { return { t: "p", x: x }; });
    var fb = B.filter(function (x) { return x.t === "firma"; })[0];
    var firma = fb ? fb.x : "";
    var P = B.filter(function (x) { return x.t !== "firma"; });
    var yoN = miNombreAqui() || (YO && (YO.nombre || YO.correo)) || "Tu Comandante";
    var av = (FICHA && FICHA.avatar) || "c1";
    var pAqui = PERS.filter(function (x) { return x.id === PER; })[0] || {}, emb = emblemaDe(pAqui);
    // el sello: el emblema de SU escuadrón en este grupo (el del tablero, que es el que siempre está)
    if (!emb.img && esc7) emb = { img: esc7.emblema || "", nombre: esc7.nombre || "" };
    var clases = (firma.match(/\(Clases?\s*[^)]+\)/i) || [])[0] || "";
    return '<article class="foro-carta" id="ht-foro-txt">' +
      '<header class="fc-cab"><span class="fc-marca">◈ STARGATE</span>' +
        '<span class="fc-meta">Bitácora de mando · Semana ' + sem + (clases ? ' · ' + esc(clases.replace(/[()]/g, "")) : "") + '</span></header>' +
      '<div class="fc-cuerpo">' + P.map(function (b) {
        if (b.t === "h") return '<h4 class="fc-h">' + esc(b.x) + '</h4>';
        if (b.t === "ul") return '<ul class="fc-ordenes">' + b.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join("") + '</ul>';
        return '<p>' + esc(b.x) + '</p>';
      }).join("") + '</div>' +
      '<footer class="fc-firma">' +
        '<img class="fc-av" src="assets/img/avatares/comandantes/' + esc(av) + '.jpg" alt="" loading="lazy">' +
        '<span class="fc-quien"><b>' + esc(/^comandante/i.test(yoN) ? yoN : "Comandante " + yoN) + '</b>' +
          '<em>' + (emb.nombre ? esc(emb.nombre) + ' · ' : "") + esc(pAqui.nombre || "") + '</em></span>' +
        (emb.img ? '<img class="fc-sello" src="' + esc(emb.img) + '" alt="" loading="lazy">' : "") +
      '</footer></article>';
  }
  function bloqueForo(sem, texto, propio, esc7) {
    if (!texto && !propio) return "";
    return '<div class="ht-foro" id="ht-foro"><div class="ht-foro-cab"><b class="ht-sub">' + ico("mensaje") + ' El mensaje del foro' +
        (propio ? ' <span class="ht-mio">tuyo</span>' : '') + '</b>' +
      '<span class="ht-foro-b"><button type="button" class="btn min" id="ht-foro-ed" title="Escribir tu versión de este mensaje" aria-expanded="false">' + ico("editar") + ' Editar</button>' +
        '<button type="button" class="btn min" id="ht-foro-todos">Ver todos</button>' +
        '<button type="button" class="btn min" data-copiado="✓ Mensaje copiado" data-copiar="' + esc(texto) + '">Copiar</button></span></div>' +
      '<p class="small muted">Para pegar esta semana en el foro de la plataforma de UNIR, ya firmado por ti.</p>' +
      cartaForo(sem, texto, esc7) +
      '<div class="ht-foro-caja" id="ht-foro-caja" hidden><label>Tu mensaje para la semana ' + sem + '<textarea id="ht-foro-in" rows="8" maxlength="4000">' + esc(texto) + '</textarea></label>' +
        '<p class="small muted">Se guarda en <b>tu ficha</b>, no en este grupo: lo verás en todos tus grupos y en los que crees más adelante. Si lo borras, vuelve el oficial.</p>' +
        '<p class="pt-fila"><button type="button" class="btn primary" id="ht-foro-ok">Guardar para todos mis grupos</button>' +
        (propio ? ' <button type="button" class="btn min" id="ht-foro-of">Volver al oficial</button>' : '') +
        '<span class="small m-sec-msg" id="ht-foro-msg" aria-live="polite"></span></p></div>' +
    '</div>';
  }
  /** El bloque «Hoy toca» de un grupo en una semana. `gente` (opcional): con ella, cada ficha dice cuántos lo han hecho. */
  function bloqueHoyToca(S, sem, total, gente, foro) {
    var s = semanaDe(S, sem); if (!s) return "";
    var tipo = S.tipo === "PUA" ? "PUA" : "REGULAR", mapa = ((window.SG_SEM_RETO || {})[tipo]) || {};
    var cat = ((((window.SG_CATALOGO || {}).retos) || {})[tipo]) || [];
    // los de esta semana y los del MISMO tema que se abren más adelante (esos salen en sombra, con su semana)
    var delTema = cat.filter(function (r) {
      var w = semanaDeReto(r, tipo, mapa);
      if (!w || w < sem) return false;
      return w === sem || Number(r.tema || 0) === Number(s.tema_n || 0);
    }).sort(function (a, b) { return semanaDeReto(a, tipo, mapa) - semanaDeReto(b, tipo, mapa); });
    var estos = delTema.filter(function (r) { return semanaDeReto(r, tipo, mapa) === sem; });
    // «la semana que viene» solo cuenta lo que NO se ve ya aquí (si no, se repetiría)
    var luego = cat.filter(function (r) { return semanaDeReto(r, tipo, mapa) === sem + 1 && delTema.indexOf(r) < 0; });
    var pl = (((window.SG_CATALOGO || {}).temas) || []).filter(function (t) { return t.n === s.tema_n; })[0];
    var fechas = "";
    try { if (S.inicio && window.SGSEMANAS) fechas = diaC(window.SGSEMANAS.inicioDeSemana(S.inicio, sem, S.pausas)) + " – " + diaC(window.SGSEMANAS.finDeSemana(S.inicio, sem, S.pausas)); } catch (e) {}
    // el calendario de la semana: el hito (tests, presentaciones, entregas), las Actividades que se lanzan, NEBULA y los cierres
    var cal = String(s.hito || "").split(" · ").filter(Boolean).map(function (t) { return [icoCal(t), t]; });
    (s.lanza || []).forEach(function (t) { if (/^Actividad/i.test(t)) cal.unshift(["anadir", "Se lanza la " + String(t).split(" — ")[0]]); });
    (window.SG_CAPITULOS || []).forEach(function (c) { if (c.listo !== false && ((c.semanas || {})[tipo]) === sem) cal.push(["envivo", "NEBULA abre el capítulo «" + c.titulo + "»"]); });
    if (sem === total) cal.push(["aviso", "Último día para registrar retos: " + (fechas ? fechas.split(" – ")[1] : "el domingo")]);
    var vids = (s.videos || []);
    var N = gente ? gente.length : 0;
    var prog = function (r) { if (!gente) return null; var n = gente.filter(function (x) { return (x.hechos || []).indexOf(r.id) >= 0; }).length;
      return { n: n, N: N, pct: N ? Math.round(n * 100 / N) : 0 }; };
    return '<section class="ht">' +
      '<div class="ht-cab">' + (pl ? '<img class="ht-planeta" src="assets/img/planetas/' + esc(pl.clave) + '.png" alt="" loading="lazy">' : '') +
        '<div><div class="eyebrow teal">Hoy toca · semana ' + sem + (fechas ? ' · ' + esc(fechas) : '') + (s.clases ? ' · ' + esc(s.clases) : '') + '</div>' +
        '<h3>' + esc(s.tema) + '</h3><p class="small muted">' + esc(s.sub || "") + (s.capitulo ? ' · capítulo «' + esc(s.capitulo) + '»' : '') + '</p></div></div>' +
      (cal.length ? '<ul class="ht-cal">' + cal.map(function (x) { return '<li>' + ico(x[0]) + ' ' + esc(x[1]) + '</li>'; }).join("") + '</ul>' : '') +
      (foro || "") +
      (vids.length ? '<div class="ht-vids pt-video"><b class="ht-sub">El vídeo que toca</b><ul class="pt-vids">' + vids.map(function (v) {
          var y = v[0] || {};
          // 20-sep · se ve AQUÍ, en el visor: ya no se sale a YouTube
          return '<li><button type="button" class="pt-vid-b" data-video="' + esc(y.id) + '" data-video-t="' + esc(y.titulo || "") + '" aria-label="Ver «' + esc(y.titulo || "") + '»">' +
            '<img src="https://i.ytimg.com/vi/' + esc(y.id) + '/mqdefault.jpg" alt="" loading="lazy" width="160" height="90"><span class="pt-vid-play" aria-hidden="true">▶</span></button>' +
            '<div><b>' + esc(y.titulo || "") + '</b><span>' + esc(v[1] || "") + '</span></div></li>'; }).join("") + '</ul></div>' : '') +
      '<div class="ht-bloque"><b class="ht-sub">Los retos de ' + esc(String(s.tema || "este tema").replace(/\s*\(cont\.\)/, "")) + '</b>' +
        (delTema.length ? '<div class="ht-retos">' + delTema.map(function (r) {
            var w = semanaDeReto(r, tipo, mapa);
            return fichaReto(r, tipo, w === sem ? prog(r) : null, w > sem ? w : 0); }).join("") + '</div>'
                      : '<p class="small muted">Esta semana no se lanza ningún reto nuevo: tiempo para terminar los que hay.</p>') +
        (estos.length && delTema.length > estos.length ? '<p class="small muted">En sombra, los del mismo tema que se abren más adelante.</p>' : '') +
        (luego.length ? '<p class="small muted pt-luego"><b>La semana que viene:</b> ' + esc(luego.map(function (r) { return r.id + " · " + r.titulo; }).join(" · ")) + '</p>' : '') +
        (s.consejo ? '<p class="au-consejo">' + ico("estrella") + ' ' + esc(s.consejo) + '</p>' : '') +
      '</div>' +
    '</section>';
  }
  /** El código para insertar en Genially (Insertar → Otros → Código): llena la caja que le des. */
  function codigoGenially(ruta, titulo) { return MOTOR.codigoGenially(ruta, titulo); }

  /**
   * 🔴 16-sep · CADA EMBED, EN SU PROPIA VENTANA. Norberto: «haz que esos embeds puedan abrirse en una ventana emergente
   * dedicada, que solo aparezca ese contenido». Es la misma dirección que va dentro del Genially —con `embed=1`, que ya
   * esconde la cabecera, el menú y el pie—, abierta en una ventana sin barras del navegador, centrada y grande. Cada
   * embed usa SIEMPRE la misma ventana (su nombre): pulsar otra vez no abre una segunda, trae delante la que ya está.
   */
  function botonVentana(ruta, clave, que) {
    return '<button type="button" class="gp-vent" data-ventana="' + esc(ruta) + '" data-vclave="' + esc(clave) + '" ' +
      'title="Abrir ' + esc(que || "") + ' en una ventana aparte, solo con su contenido" aria-label="Abrir ' + esc(que || "") + ' en una ventana aparte">⧉</button>';
  }
  function abrirVentana(ruta, clave) {
    var W = (window.screen && screen.availWidth) || 1440, H = (window.screen && screen.availHeight) || 900;
    var w = Math.min(1440, W - 40), h = Math.min(920, H - 60);
    var x = Math.max(0, Math.round((W - w) / 2)), y = Math.max(0, Math.round((H - h) / 2));
    var u = new URL(ruta, location.href);
    if (!u.searchParams.has("embed")) u.searchParams.set("embed", "1");
    var v = window.open(u.href, "sg_" + String(clave || "embed").replace(/[^\w-]/g, "_"),
      "popup=yes,width=" + w + ",height=" + h + ",left=" + x + ",top=" + y);
    if (v) { try { v.focus(); } catch (e) {} }
    else aviso("Tu navegador ha bloqueado la ventana. Permite las ventanas emergentes de esta web (el icono de la barra de direcciones) y vuelve a pulsar ⧉.", false);
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-ventana]");
    if (!b) return;
    e.preventDefault();
    abrirVentana(b.getAttribute("data-ventana"), b.getAttribute("data-vclave"));
  });

  // tras «Borrar este grupo»: que se vea que se ha hecho
  function avisoBorrado() {
    var b = url.get("borrado");
    var g = AVISO_GESTION; AVISO_GESTION = "";   // (19-sep · y tras archivar o reabrir desde «⋯»)
    return g || (b ? '<div class="card borrado-ok"><p><img class=ico src=assets/img/iconos/p/papelera.png alt> <b>«' + esc(b) + '»</b> borrado, con todo lo suyo.</p></div>' : "");
  }
  /**
   * 15-sep · EL «MODO DOCENTE» (Norberto): el referente oculta lo suyo con el botón de arriba (stargate.js) y ve lo
   * mismo que un profe. Y «referente» ya no es solo serlo de un grupo: también quien está en el registro (por
   * invitación o hecho por el Mando en Profesores), aunque aún no lleve ninguno.
   */
  function modoDoc() { return !!(window.SG_MODO_DOCENTE && window.SG_MODO_DOCENTE()); }
  function refGlobal() { try { return localStorage.getItem("sgEsReferente") === "1"; } catch (e) { return false; } }
  function refDe(p) { return !!(p && p.soyReferente) && !modoDoc(); }
  document.addEventListener("sg:modo", function () { if (!YO) return; if (PER && DATOS) pintar(); else elegirGrupo(); });
  /**
   * 🔴 19-sep · LA NAVE DEL COMANDANTE. Norberto: «la página inicial del docente debería ser visualmente similar a la nave
   * del estudiante… en vez de insignias conseguidas, grupos activos, estudiantes en total… tantas pestañas como grupos
   * activos y al clicarlas mostrase toda la info de cada grupo». Y luego: «simplicidad máxima en la página principal…
   * no queremos info que se usará una o dos veces en todo el curso (borrar, crear grupo, compartir enlace…)».
   * Decidido con un borrador dibujado (lienzo «Nave del Comandante · borrador») y cuatro preguntas:
   *   · no hay página de «Mis grupos»: se entra directo en el grupo (el último que abriste, o el primero en marcha);
   *   · en el Puente, tu ficha de comandante y NEBULA arriba, como «Mi nave» del recluta;
   *   · una pestaña por grupo en marcha (también con uno solo) y las secciones del grupo con iconos propios;
   *   · crear, graduar, borrar, el equipo, los escuadrones, los ajustes del grupo y editar el calendario viven en
   *     «Gestionar grupos» (gestion.html), solo para referentes.
   */
  var CLAVE_ULTIMO = "sgConsolaPer";
  function vivos() { return PERS.filter(function (p) { return p.estado !== "pasado"; }); }
  function soyRefAlguno() { return (PERS.some(function (p) { return p.soyReferente; }) || refGlobal()) && !modoDoc(); }
  async function elegirGrupo() {
    cargando("Buscando tus grupos…");
    PERS = await MOTOR.misPERs(YO.correo);
    contarBuzon();   // (15-sep · el contador del buzón: si llega antes de pintar, sale ya en el botón; si no, se añade)
    if (GESTION) return verGestion();
    if (!PERS.length) {
      // 15-sep · un referente nuevo (por invitación) aún no tiene grupos: se le da la bienvenida, no un «no figuras»
      if (refGlobal() && !modoDoc()) {
        app.innerHTML = avisoBorrado() + '<div class="card"><h3>¡Bienvenida al puente, Comandante!</h3>' +
          '<p>Eres <b>profe referente</b> con <b>' + esc(YO.correo) + '</b>, pero aún no llevas ningún grupo. Crea el primero (en un minuto, con su calendario y su código) ' +
          'o pide a Norberto que te añada a uno que ya exista.</p>' +
          '<p><a class="btn primary grande" href="crear.html"><img class=ico src=assets/img/iconos/p/estrella.png alt> Crear mi primer grupo</a> <a class="btn" href="prueba-equipo.html"><img class=ico src=assets/img/iconos/p/brujula.png alt> La guía de prueba</a> ' + botonBuzon("consola") + '</p></div>';
        document.body.classList.add("consola-dentro");
        return;
      }
      app.innerHTML = avisoBorrado() + '<div class="card"><h3>Todavía no tienes grupos</h3>' +
        '<p>No figuras como docente en ningún grupo de STARGATE con el correo <b>' + esc(YO.correo) + '</b>.</p>' +
        '<p class="small muted">Si deberías estar en uno, pídele a tu referente que te añada con ' +
        '<b>este mismo correo</b>. Y comprueba con qué cuenta de Google has entrado: es el despiste más común.</p>' +
        (refGlobal() ? '<p><a class="btn grande" href="crear.html">Crear el primero</a></p>' : '') + '</div>';
      return;
    }
    // el mismo filtro que en `entrar.js`: nada de barras ni de dos puntos, o sería un trampolín
    var volver = url.get("volver");
    if (volver && /^[a-z0-9_-]+\.html(\?[a-z0-9_=&%.\-]*)?$/i.test(volver)) { location.replace(volver); return; }

    var guardado = url.get("per");
    if (guardado && PERS.filter(function (p) { return p.id === guardado; }).length) return abrir(guardado);
    if (url.get("comun") && gestionados().length) return verComunes(url.get("comun"));
    var V = vivos(), ultimo = "";
    try { ultimo = localStorage.getItem(CLAVE_ULTIMO) || ""; } catch (e) {}
    if (ultimo && V.some(function (p) { return p.id === ultimo; })) return abrir(ultimo);
    if (V.length) return abrir(V[0].id);
    // ninguno en marcha: tu ficha y tus cursos terminados (se abren igual, para consultarlos)
    var pasados = PERS.filter(function (p) { return p.estado === "pasado"; });
    app.innerHTML = avisoBorrado() + heroComandante() +
      '<div class="card cn-vacio"><h3>Ninguno de tus grupos está en marcha</h3>' +
        (pasados.length ? '<p class="small muted">Tus cursos terminados, para consultarlos:</p><p class="cn-pasados">' + pasados.map(function (p) {
          return '<button type="button" class="btn min" data-per="' + esc(p.id) + '">' + esc(p.nombre) + ' →</button>'; }).join(" ") + '</p>' : '') +
        (soyRefAlguno() ? '<p><a class="btn" href="gestion.html">' + ico("ajustes") + ' Gestionar grupos</a></p>' : '') + '</div>';
    Array.prototype.forEach.call(app.querySelectorAll("[data-per]"), function (b) { b.onclick = function () { TAB = "portada"; abrir(b.getAttribute("data-per")); }; });
    cablearHero();
    document.body.classList.add("consola-dentro");
  }

  /**
   * 🔴 20-sep · TU FICHA, A TODO EL ANCHO. Norberto: «la caja de la ficha del comandante quizá pueda ocupar todo el ancho
   * (aumenta avatar, pon más info del docente…)». Y el cambio de grupo, que era una rejilla de tarjetas que «queda fatal»,
   * ahora es un desplegable DENTRO de esta caja. Lo de NEBULA y las cifras del grupo se fue de aquí: TODO lo del grupo va
   * debajo de su banner (ver `bannerGrupo`), que es lo que él pedía para no mezclar lo tuyo con lo suyo.
   */
  function heroComandante() {
    var V = vivos(), nombre = (YO && (YO.nombre || YO.displayName)) || "Comandante";
    var total = V.reduce(function (a, p) { return a + (Number(p.reclutas) || 0); }, 0), mio = miNombreAqui();
    var pAqui = PERS.filter(function (x) { return x.id === PER; })[0], emb = pAqui ? emblemaDe(pAqui) : { img: "", nombre: "" };
    return '<div class="card cn-ficha ancha">' +
      '<div class="cn-ficha-c">' +
        '<button type="button" class="av-lupa" id="doc-ava" title="Elige tu comandante" aria-label="Elegir tu comandante">' +
          '<img class="av" id="doc-ava-img" src="assets/img/avatares/comandantes/' + esc((FICHA && FICHA.avatar) || "c1") + '.jpg" alt="">' +
          '<span class="av-cambiar">' + ico("editar") + '</span></button>' +
        '<div class="cn-ficha-t"><div class="eyebrow teal">La Nave del Comandante</div><h3>' + esc(nombre) + '</h3>' +
          '<p class="small"><b>Comandante' + (soyRefAlguno() ? ' referente' : '') + '</b>' + (mio ? ' · en este grupo, «' + esc(mio) + '»' : '') +
            (emb.nombre ? ' · escuadrón <b>' + esc(emb.nombre) + '</b>' : '') + (YO && YO.correo ? ' · <span class="muted">' + esc(YO.correo) + '</span>' : '') + '</p>' +
          '<p class="monedas"><span class="m xp" title="Los grupos de STARGATE en los que das clase ahora mismo. Los terminados no cuentan."><b>' + V.length + '</b> ' + (V.length === 1 ? "grupo en marcha" : "grupos en marcha") + '</span>' +
            '<span class="m cred" title="Todo el alumnado de esos grupos, sumado."><b>' + total + '</b> ' + (total === 1 ? "recluta a tu cargo" : "reclutas a tu cargo") + '</span>' +
            (emb.img ? '<span class="m emb" title="' + esc(emb.nombre ? "Tu escuadrón en este grupo: " + emb.nombre : "Tu escuadrón en este grupo") + '"><img src="' + esc(emb.img) + '" alt="" loading="lazy"></span>' : '') + '</p>' +
        '</div>' +
        '<div class="cn-ficha-b">' + selectorDeGrupo() + selectorModo() +
          '<button type="button" class="btn min" id="doc-ajustes-b" data-av aria-expanded="false">' + ico("ajustes") + ' Ajustes</button></div>' +
      '</div>' +
    '</div>' +
    // (la galería se monta al abrirla: escondida, sus imágenes se descargarían igual en cada visita)
    '<div class="doc-avas" id="doc-avas" hidden></div>' +
    // 19-sep · «un botón de ajustes para ajustar su nombre, alias, foto…» y tu sesión en directo para todos tus grupos
    '<div class="doc-ajustes" id="doc-ajustes" hidden></div>';
  }
  function cablearHero() {
    var avImg = $("#doc-ava-img"), avBtn = $("#doc-ava"), avs = $("#doc-avas");
    if (MOTOR.miFichaDocente) MOTOR.miFichaDocente().then(function (f) {
      if (f && f.avatar && avImg) avImg.src = "assets/img/avatares/comandantes/" + f.avatar + ".jpg";
    }).catch(function () {});
    var galeria = function () {
      if (avs.getAttribute("data-lista")) return;
      avs.setAttribute("data-lista", "1");
      // 18-sep · todo el reparto de comandantes, sin nombres (Norberto: «forman parte del reparto de comandantes»)
      avs.innerHTML = '<p class="small muted">Elige el comandante que te representa.</p>' +
        '<div class="doc-avas-g">' + (window.SG_COMANDANTES_GEN || []).map(function (k) {
          return '<button type="button" class="doc-av-op" data-av="' + esc(k) + '"><img src="assets/img/avatares/comandantes/' + esc(k) + '.jpg" alt="Comandante"></button>';
        }).join("") + '</div>';
      var actual = (avImg && (avImg.getAttribute("src").match(/\/([a-z0-9_-]+)\.jpg/) || [])[1]) || "";
      Array.prototype.forEach.call(avs.querySelectorAll(".doc-av-op"), function (o) {
        o.classList.toggle("on", o.getAttribute("data-av") === actual);
        o.onclick = function () {
          var k = o.getAttribute("data-av");
          MOTOR.ponerAvatarDocente(k).then(function () {
            if (avImg) avImg.src = "assets/img/avatares/comandantes/" + k + ".jpg";
            if (FICHA) FICHA.avatar = k;
            Array.prototype.forEach.call(avs.querySelectorAll(".doc-av-op"), function (x) { x.classList.toggle("on", x === o); });
            avs.hidden = true;
          }, function (e) { aviso("No se ha podido guardar tu avatar: " + esc(e.message || e)); });
        };
      });
    };
    if (avBtn && avs) avBtn.onclick = function () { galeria(); avs.hidden = !avs.hidden; };
    var selG = $("#cn-sel-g");
    if (selG) selG.onchange = function () { if (selG.value && selG.value !== PER) { TAB = "portada"; abrir(selG.value); } };
    var ajB = $("#doc-ajustes-b"), ajP = $("#doc-ajustes");
    if (ajB && ajP) ajB.onclick = function () {
      if (ajP.hidden) pintarAjustes(ajP, vivos(), avBtn);
      ajP.hidden = !ajP.hidden; ajB.setAttribute("aria-expanded", String(!ajP.hidden));
      if (!ajP.hidden) ajP.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
  }
  /** 🔴 EL EMBLEMA DE TU ESCUADRÓN en ese grupo (Norberto: «a golpe de vista… su emblema de escuadrón»), no el del grupo. */
  function emblemaDe(p) {
    var S = (p && p.stargate) || {};
    var nombreMio = ((S.docentes || []).filter(function (d) {
      return String(d.correo || "").toLowerCase() === String(YO.correo || "").toLowerCase(); })[0] || {}).nombre;
    var mio = (p.factions || []).filter(function (f) { return f.teacherName === nombreMio; })[0] || (p.factions || [])[0] || null;
    return { img: mio && mio.imageUrl ? mio.imageUrl : "", nombre: mio ? mio.name : "" };
  }
  /** Los grupos que llevas: el que tengas abierto y los demás en marcha. */
  function gruposParaElegir() {
    var L = vivos(), actual = PERS.filter(function (p) { return p.id === PER; })[0];
    if (actual && L.indexOf(actual) < 0) L = L.concat([actual]);
    return L;
  }
  /**
   * 🔴 20-sep · CAMBIAR DE GRUPO, UN DESPLEGABLE. Norberto: «el espacio donde están todos los grupos para elegirlos queda
   * fatal. ¿No sería mejor un desplegable? Prueba a incorporarlo en la caja donde está el avatar del docente». Con un solo
   * grupo no hay nada que elegir: no sale (el nombre ya está en su banner, aquí abajo).
   */
  function selectorDeGrupo() {
    var L = gruposParaElegir();
    if (L.length < 2) return "";
    return '<label class="cn-sel"><span class="cn-sel-t">Grupo</span><select id="cn-sel-g" aria-label="Cambiar de grupo">' + L.map(function (p) {
      var linea = p.estado === "en marcha" ? "semana " + p.semana + " de " + p.total : p.estado === "por empezar" ? "empieza el " + ((p.stargate || {}).inicio || "—")
                : p.estado === "pasado" ? "terminado" : "sin fecha";
      return '<option value="' + esc(p.id) + '"' + (p.id === PER ? " selected" : "") + '>' + esc(p.nombre) + ' · ' + esc(linea) +
        (p.reclutas != null ? ' · ' + p.reclutas + ' reclutas' : '') + (p.cola ? ' · ' + p.cola + ' pendiente' + (p.cola === 1 ? '' : 's') : '') + '</option>';
    }).join("") + '</select></label>';
  }

  /** 17-sep · «🌐 Para todos tus grupos»: lo que se configura una vez para varios grupos, fuera de ninguno. */
  function verComunes(que) {
    PER = null; DATOS = null;
    history.replaceState(null, "", "consola.html?comun=" + encodeURIComponent(que));
    var g = gestionados();
    app.innerHTML = '<div class="card cuenta c-cab"><div class="c-cab-t"><b><img class=ico src=assets/img/iconos/p/varios.png alt> Para todos tus grupos</b><span>' + g.length + (g.length === 1 ? " grupo" : " grupos") +
        ' que llevas · lo que configures aquí vale en los que elijas</span></div>' +
      '<div class="c-cab-b"><button class="btn min" id="c-volver">← Tu Nave</button> ' + botonBuzon("consola") + '</div></div>' +
      '<div class="pestanas">' + [["premios", "huevos", "Premios por enlace"], ["sorteos", "sorteos", "Sorteos"], ["ofertas", "ofertas", "Ofertas"]].map(function (x) {
        return '<button class="pest' + (que === x[0] ? " activa" : "") + '" data-tab="' + x[1] + '" data-comun="' + x[0] + '">' + x[2] + "</button>"; }).join("") + '</div>' +
      '<div id="c-aviso" class="aviso" hidden></div><div id="c-cuerpo"></div>';
    $("#c-volver").onclick = function () { url.delete("comun"); history.replaceState(null, "", "consola.html"); elegirGrupo(); };
    Array.prototype.forEach.call(app.querySelectorAll("[data-comun]"), function (b) { b.onclick = function () { verComunes(b.getAttribute("data-comun")); }; });
    cablearCopiar(app);
    document.body.classList.add("consola-dentro");
    if (que === "sorteos") verSorteosComunes($("#c-cuerpo"));
    else if (que === "ofertas") verOfertasComunes($("#c-cuerpo"));
    else verPremios(null, $("#c-cuerpo"));
  }

  async function abrir(perId) {
    PER = perId;
    history.replaceState(null, "", "consola.html?per=" + encodeURIComponent(perId));
    try { localStorage.setItem(CLAVE_ULTIMO, perId); } catch (e) {}   // 19-sep · la próxima vez, se entra en este
    cargando("Leyendo el grupo…");
    try { DATOS = await MOTOR.leerPER(perId, true); }
    catch (e) { return fallo("No he podido leer el grupo: " + e.message); }
    pintar();
  }

  /**
   * 🔴 LO DEL REFERENTE NO LO VE UN DOCENTE. Norberto: «no debe ver NADA del profe referente».
   *
   * Y no es solo orden: «Equipo docente» enseña los CORREOS de los compañeros, «Escuadrones»
   * reparte el alumnado del grupo entero y «Ajustes» toca el calendario y los enlaces de todos.
   * Nada de eso es de quien solo imparte — y enseñárselo apagado sería peor: le dice que existe y
   * que a él no le dejan.
   *
   * La cuarta columna marca las que solo salen si llevas el grupo.
   */
  /**
   * 15-sep · Norberto: «Cola de nota debería aparecer solo si hay algo que hacer; si no, ocúltalo. Como es al final,
   * muévelo a la última opción, y que brille cuando hay algo pendiente». Y el calendario, a la vista de todo el
   * equipo («la versión vista, sin edición, la debería poder ver el docente raso»): editar sigue siendo del referente.
   */
  // 19-sep · «Portada», la primera: el grupo de un vistazo (semana, vídeo, retos, foro, panel, sesión y tus notas)
  // 19-sep · el equipo, los escuadrones y los ajustes del grupo se fueron a «Gestionar grupos» (GTABS)
  var TABS = [["portada", "Portada"], ["alumnado", "Reclutas"], ["rankings", "Rankings"], ["zoco", "El Zoco"], ["mios", "Mis enlaces"], ["calendario", "Calendario"],
              // 17-sep · las que pueden afectar a VARIOS grupos, juntas y tras su raya 🌐 (Norberto: «separar las opciones
              // exclusivas de un grupo de las que afectan a todos o pueden afectar»)
              ["huevos", "Premios por enlace", 1, "varios"], ["sorteos", "Sorteos", 1, "varios"], ["ofertas", "Ofertas", 1, "varios"],
              ["canjes", "Cola de nota"]];
  function pendientesCola() {
    return ((DATOS && DATOS.vales) || []).filter(function (v) { return (v.status || "pending") === "pending"; }).length;
  }
  function misTabs() {
    var ref = refDe(PERS.filter(function (p) { return p.id === PER; })[0]), cola = pendientesCola();
    return TABS.filter(function (x) {
      if (!manual() && AV_TABS.indexOf(x[0]) >= 0) return false;
      var permitida = !x[2] || ref || (manual() && x[0] === "huevos");   // (19-sep · en mando manual, premios para su grupo)
      return permitida && (x[0] !== "canjes" || cola > 0);
    });
  }
  function soyRefAqui() { return refDe(PERS.filter(function (p) { return p.id === PER; })[0]); }
  function miNombreAqui() { var p = PERS.filter(function (x) { return x.id === PER; })[0]; return (p && p.miNombre) || ""; }

  /**
   * 15-sep · «📡 ¿Algo falla?»: la puerta al buzón del Mando (buzon.html). Lleva desde dónde se
   * escribe y el grupo, y un contador si el Mando ha respondido algo que aún no has leído.
   */
  var BZ_N = null;
  function botonBuzon(desde, per) {
    return '<a class="btn min bz-acceso" data-bz href="buzon.html?desde=' + desde + (per ? '&per=' + encodeURIComponent(per) : '') + '"><img class=ico src=assets/img/iconos/p/envivo.png alt> ¿Dudas? ¿Algo falla?'
      + (BZ_N ? '<span class="bz-n" title="Respuestas del Mando sin leer">' + BZ_N + '</span>' : '') + '</a>';
  }
  function contarBuzon() {
    if (BZ_N !== null || !MOTOR || !MOTOR.buzonMios) return;
    BZ_N = 0;
    MOTOR.buzonMios().then(function (L) {
      BZ_N = (L || []).filter(function (m) { return m.visto === false; }).length;
      if (BZ_N) Array.prototype.forEach.call(document.querySelectorAll("[data-bz]"), function (a) {
        if (!a.querySelector(".bz-n")) a.insertAdjacentHTML("beforeend", '<span class="bz-n" title="Respuestas del Mando sin leer">' + BZ_N + '</span>'); });
    }).catch(function () {});
  }

  /**
   * 🔴 19-sep · LAS SECCIONES DEL GRUPO, CON ICONOS PROPIOS (el mismo menú que la Nave del recluta). Eran doce pestañas;
   * Norberto eligió juntarlas: Mi gente lleva la Cola de nota; Premios, los premios por enlace, los sorteos y las
   * ofertas. El equipo, los escuadrones y los ajustes del grupo se fueron a «Gestionar grupos». Cada sección muestra
   * solo lo que esa cuenta puede usar (en piloto automático, El Zoco, Premios y Enlaces no salen).
   */
  /**
   * 🔴 20-sep · EL BANNER DEL GRUPO. Norberto: «el banner con el nombre del grupo grande y el botón de empezar la clase
   * debe ir justo debajo de la caja del comandante. TODA la información relativa a ese grupo debe ir debajo del banner:
   * ahora aparece información encima y queda confuso». Así que esto abre el grupo en TODAS sus secciones, y lo de arriba
   * es solo tuyo. Los pasos 2 y 3 (llamada y herramientas) se fueron: «un docente empezará la clase, en ese enlace ya
   * están incluidos los pasos 2 y 3».
   */
  function bannerGrupo(t) {
    if (!t) return "";
    var pAqui = PERS.filter(function (x) { return x.id === PER; })[0] || {}, emb = emblemaDe(pAqui);
    var sem = Number(t.semana) || 0, total = Number(t.semanas) || 15;
    var SEMS = window.SG_SEMANAS || [], tipo = t.tipo === "PUA" ? "PUA" : "REGULAR";
    var s = sem >= 1 ? (tipo === "PUA" ? SEMS.filter(function (x) { return x.tema_n === Math.min(sem, 8); })[0] : SEMS[Math.min(sem, SEMS.length) - 1]) : null;
    var estado = sem < 1 ? "Aún no ha empezado" : sem > total ? "Curso terminado" : "Semana " + sem + " de " + total;
    var yoN = miNombreAqui(), mia = yoN ? t.reclutas.filter(function (r) { return r.profe === yoN; }) : [];
    var N = (mia.length ? mia : t.reclutas).length;
    var ini = ((DATOS.proyecto || {}).stargate || {}).inicio;
    var otros = gruposParaElegir().length > 1 && TAB !== "portada";
    // 🔴 20-sep · «usa imágenes para descansar, para no atosigar al cerebro con tanta información»: el planeta del tema
    // que tocáis, grande y desvanecido, hace de portada del grupo. Cambia con la semana, así que el banner nunca es
    // el mismo cartel gris dos temas seguidos.
    var pl = (((window.SG_CATALOGO || {}).temas) || []).filter(function (x) { return s && x.n === s.tema_n; })[0];
    return '<div class="card gr-banner">' + (pl ? '<img class="gr-plan" src="assets/img/planetas/' + esc(pl.clave) + '.png" alt="" loading="lazy">' : '') +
      (emb.img ? '<img class="gr-emb" src="' + esc(emb.img) + '" alt="">' : '') +
      '<div class="gr-t"><div class="eyebrow teal">' + esc(estado) + (s ? ' · ' + esc(s.tema) : '') + '</div>' +
        '<h2>' + esc(t.nombre) + (otros ? ' <button type="button" class="gr-cambiar" data-tab="portada" title="Cambiar de grupo">⇄</button>' : '') + '</h2>' +
        '<p class="small muted">' + (emb.nombre ? 'Tu escuadrón <b>' + esc(emb.nombre) + '</b> · ' : '') +
          (mia.length ? 'de tus ' + N + ' reclutas' : 'del grupo · ' + N + (N === 1 ? ' recluta' : ' reclutas')) +
          (ini ? ' · ' + (sem < 1 ? 'empieza el ' : 'empezó el ') + esc(diaC(ini)) : '') + '</p></div>' +
      '<div class="gr-acc"><a class="gp-b principal" href="sesion.html?per=' + esc(PER) + '" target="_blank" rel="noopener">' +
        '<img class="pt-acc-i" src="assets/img/iconos/cohete.png" alt=""><span class="pt-acc-t"><b>Empezar la clase</b><em>proyecta la sesión de hoy</em></span></a>' +
        botonCfgSesion(PER) + botonVentana("sesion.html?per=" + PER, "sesion_" + PER, "la sesión") + '</div>' +
      barraEscuela(t, sem, total) +
    '</div>';
  }
  /**
   * 🔴 20-sep · LA NAVE ESCUELA, POR DENTRO Y EN LA SEMANA QUE QUIERAS. Norberto: «crea un grupo EJEMPLO… sirve para
   * que los docentes puedan explorar, interactuar… añade un selector de semanas, lo más fiel posible a un grupo
   * normal». El grupo lleva el curso entero sembrado con sus fechas, así que moverse de semana no es un adorno: en
   * la 3 el álbum está a medias, el Mercado a medio abrir y la corona es la de entonces.
   *
   * La semana elegida vive en el navegador (`SG_SEMANA_ESCUELA`, ver la plantilla de stargate.js): explorar no
   * escribe NADA en el servidor, y dos docentes pueden estar en semanas distintas sin pisarse.
   */
  function barraEscuela(t, sem, total) {
    if (!t || !t.escuela) return "";
    var n = Number(window.SG_SEMANA_ESCUELA || 0) || sem, T = Math.max(1, Number(total) || 15);
    var ops = ""; for (var i = 1; i <= T; i++) ops += '<option value="' + i + '"' + (i === n ? " selected" : "") + '>Semana ' + i + '</option>';
    return '<div class="gr-escuela">' +
      '<b class="ht-sub">' + ico("nave") + ' Nave Escuela</b>' +
      '<p class="small">Un grupo entero para trastear: entra, valida retos, premia, abre una votación. <b>No es una clase de verdad</b> y nada de lo que hagas aquí sale de aquí.</p>' +
      '<label class="tk-sel">Verlo en <select id="esc-sem" aria-label="En qué semana se mira la Nave Escuela">' + ops + '</select></label>' +
      '<a class="btn min" href="recluta.html?per=' + esc(PER) + '&demo=1&semana=' + n + '" target="_blank" rel="noopener">' + ico("cohete") + ' Verla como recluta ↗</a>' +
      '<button type="button" class="btn min tour-start">' + ico("brujula") + ' Visita guiada</button>' +
    '</div>';
  }
  /** El selector de semana: se guarda en el navegador y se repinta todo desde cero, como si hoy fuera esa semana. */
  function cablearEscuela() {
    var sel = document.getElementById("esc-sem"); if (!sel) return;
    sel.onchange = function () {
      var n = Number(sel.value) || 1;
      try { localStorage.setItem("sgSemanaEscuela", String(n)); } catch (e) {}
      window.SG_SEMANA_ESCUELA = n;
      if (window.SG && SG.TK && SG.TK.limpiar) SG.TK.limpiar();
      pintar();
    };
  }

  var SECCIONES = [["puente", "Puente", "assets/img/nave/iconos/nave.png", ["portada"]],
                   ["gente", "Reclutas", "assets/img/nave/iconos/gente.png", ["alumnado", "canjes"]],
                   ["rankings", "Rankings", "assets/img/nave/iconos/rankings.png", ["rankings"]],
                   ["calendario", "Calendario", "assets/img/iconos/calendario.png", ["calendario"]],
                   ["zoco", "El Zoco", "assets/img/nave/iconos/zoco.png", ["zoco"]],
                   ["premios", "Premios", "assets/img/nave/iconos/premios.png", ["huevos", "sorteos", "ofertas"]],
                   ["enlaces", "Enlaces", "assets/img/iconos/enlace.png", ["mios"]]];
  var SUB_NOMBRE = { alumnado: "Reclutas", canjes: "Cola de nota", huevos: "Premios por enlace", sorteos: "Sorteos", ofertas: "Ofertas" };
  function seccionDe(tab) { return SECCIONES.filter(function (x) { return x[3].indexOf(tab) >= 0; })[0] || SECCIONES[0]; }
  function barraSecciones() {
    var mias = misTabs().map(function (x) { return x[0]; }), cola = pendientesCola(), actual = seccionDe(TAB)[0];
    return '<div class="cn-secs" role="tablist" aria-label="Secciones del grupo">' + SECCIONES.map(function (x) {
      var dentro = x[3].filter(function (k) { return mias.indexOf(k) >= 0; });
      if (!dentro.length) return "";
      var n = x[0] === "gente" ? cola : 0, on = x[0] === actual;
      return '<button type="button" class="pest cn-t' + (on ? " activa" : "") + (n ? " pest-aviso" : "") + '" role="tab" aria-selected="' + on + '" data-tab="' + dentro[0] + '" data-sec="' + x[0] + '"' +
        (n ? ' title="' + n + (n === 1 ? " subida de nota espera" : " subidas de nota esperan") + ' tu visto bueno"' : "") + '>' +
        '<img class="i" src="' + x[2] + '" alt="" width="30" height="30" aria-hidden="true"><b>' + x[1] + '</b>' +
        (n ? '<span class="pest-n" aria-label="' + n + ' pendientes">' + n + '</span>' : "") + '</button>';
    }).join("") +
      // 20-sep · «¿Dudas? ¿Algo falla?» era un botón perdido en tu ficha: ahora es la última sección, «Contacto»
      '<a class="pest cn-t cn-t-fin bz-acceso" data-bz href="buzon.html?desde=consola' + (PER ? '&per=' + encodeURIComponent(PER) : '') + '">' +
        '<img class="i" src="assets/img/nave/iconos/envivo.png" alt="" width="30" height="30" aria-hidden="true"><b>Contacto</b>' +
        (BZ_N ? '<span class="bz-n" title="Respuestas del Mando sin leer">' + BZ_N + '</span>' : '') + '</a>' +
    '</div>';
  }
  function subPestanas() {
    var mias = misTabs().map(function (x) { return x[0]; }), sec = seccionDe(TAB);
    var dentro = sec[3].filter(function (k) { return mias.indexOf(k) >= 0; });
    if (dentro.length < 2) return "";
    // (17-sep · premios, sorteos y ofertas que valen para VARIOS de tus grupos: su página, desde aquí si llevas más de uno)
    var comun = sec[0] === "premios" && gestionados().length > 1
      ? '<a class="pest cn-s cn-comun" href="consola.html?comun=' + (TAB === "sorteos" ? "sorteos" : TAB === "ofertas" ? "ofertas" : "premios") + '">' + ico("varios") + ' Para todos tus grupos</a>' : "";
    return '<div class="cn-sub" role="tablist" aria-label="' + esc(sec[1]) + '">' + dentro.map(function (k) {
      var n = k === "canjes" ? pendientesCola() : 0;
      return '<button type="button" class="pest cn-s' + (TAB === k ? " activa" : "") + (n ? " pest-aviso" : "") + '" data-tab="' + k + '">' + SUB_NOMBRE[k] +
        (n ? '<span class="pest-n">' + n + '</span>' : "") + '</button>';
    }).join("") + comun + '</div>';
  }

  /**
   * 🔴 20-sep · LA ATMÓSFERA DEL PLANETA QUE TOCA. Norberto: «mucha información compacta… agobia», «usa imágenes para
   * descansar», «puedes poner el fondo del planeta que toca esa semana, algo que haga que sea una experiencia visual y
   * atractiva». El planeta del tema en curso se queda de fondo de TODA la Nave —fijo, grande y desvanecido—, así que la
   * pantalla cambia sola cada vez que avanzáis de tema y la vista tiene dónde descansar entre bloque y bloque.
   */
  function atmosfera(t) {
    var sem = Number(t && t.semana) || 0, SEMS = window.SG_SEMANAS || [];
    var tipo = (t && t.tipo) === "PUA" ? "PUA" : "REGULAR";
    var s = sem >= 1 ? (tipo === "PUA" ? SEMS.filter(function (x) { return x.tema_n === Math.min(sem, 8); })[0] : SEMS[Math.min(sem, SEMS.length) - 1]) : null;
    var pl = (((window.SG_CATALOGO || {}).temas) || []).filter(function (x) { return s && x.n === s.tema_n; })[0];
    document.body.classList.toggle("con-planeta", !!pl);
    // 🔴 la variable la usa la hoja de estilos: una ruta relativa se resolvería contra assets/css/ (404). Absoluta.
    if (pl) document.body.style.setProperty("--planeta", 'url("' + new URL("assets/img/planetas/" + pl.clave + ".png", document.baseURI).href + '")');
    else document.body.style.removeProperty("--planeta");
  }
  function pintar() {
    if (GESTION) return pintarGestion();
    var t = window.SG.TABLERO.tablero(DATOS, true);
    atmosfera(t);
    // 🔴 Y si el TAB recordado ya no le corresponde —dejó de ser referente, llega por un enlace con #ajustes o
    // (15-sep) acaba de resolver la última subida de nota y la Cola se esconde— se cae al primero, ANTES de pintar
    // las pestañas para que la encendida sea la que se ve.
    if (!misTabs().some(function (x) { return x[0] === TAB; })) TAB = misTabs()[0][0];
    // 19-sep · tu ficha y NEBULA, solo en el Puente (como «Mi nave» del recluta); en las demás secciones, al grano
    app.innerHTML = avisoBorrado() + (TAB === "portada" ? heroComandante() : "") +
      bannerGrupo(t) + barraSecciones() + subPestanas() +
      '<div id="c-aviso" class="aviso" hidden></div>' +
      '<div id="c-cuerpo"></div>';
    Array.prototype.forEach.call(app.querySelectorAll("[data-tab]"), function (b) {
      b.onclick = function () { TAB = b.getAttribute("data-tab"); pintar(); };
    });
    Array.prototype.forEach.call(app.querySelectorAll("[data-grupo]"), function (b) {
      b.onclick = function () { var id = b.getAttribute("data-grupo"); if (id !== PER) abrir(id); };
    });
    if (TAB === "portada") cablearHero();
    cablearEscuela();   // el selector de semana de la Nave Escuela va en el banner: está en todas las secciones
    // Copiar un enlace, con confirmación visible: sin ella no sabes si ha ido.
    cablearCopiar(app);
    ({ portada: verPortada, alumnado: verAlumnado, rankings: verRankings, canjes: verCanjes, zoco: verZoco, mios: verMios,
       huevos: verHuevos, sorteos: verSorteos, ofertas: verOfertas, calendario: verCalendario })[TAB](t);
    contarBuzon();
    document.body.classList.add("consola-dentro");   // el titular grande de la página sobra: la Nave empieza arriba
  }

  // Un grupo que empieza dentro de dos semanas está en la «semana -1», que es verdad y no dice
  // nada. Lo que el docente necesita saber es cuándo arranca.
  function semanaTexto(t) {
    if (t.semana === null || t.semana === undefined) return "sin fecha de inicio";
    if (t.semana < 1) return "empieza el " + t.inicio;
    if (t.semana > t.semanas) return "terminado";
    return "semana " + t.semana + " de " + t.semanas;
  }

  function aviso(txt, bien) {
    var d = $("#c-aviso"); if (!d) return;
    d.innerHTML = esc(txt); d.className = "aviso " + (bien ? "" : "malo"); d.hidden = !txt;
  }
  async function refrescar() { DATOS = await MOTOR.leerPER(PER, true); pintar(); }

  // ---------------------------------------------------------------- alumnado
  /**
   * 🔴 13-sep · QUIÉN HA VISTO LOS CAPÍTULOS DE NEBULA. Lo pidió Norberto («debería registrar si un
   * estudiante ha hecho el onboarding») y es también un dato de investigación. Se cuentan los
   * capítulos YA abiertos en la semana de este grupo: «3/3 ✓», «2/3», o «1 saltado».
   */
  function capsDelGrupo(t) {
    var tipo = (t && t.tipo) === "PUA" ? "PUA" : "REGULAR", sem = Number(t && t.semana) || 1;
    return (window.SG_CAPITULOS || []).filter(function (c, i) {
      return c.listo !== false && (i === 0 || ((c.semanas || {})[tipo] || 99) <= sem); });
  }
  function celdaBienvenida(r, caps) {
    var v = r.capitulos || {}, hechos = 0, saltados = 0;
    caps.forEach(function (c) { var x = v[c.clave]; if (x && x.estado === "saltado") saltados++; else if (x) hechos++; });
    var n = caps.length, todo = hechos + saltados === n && n > 0;
    return '<td class="bienv' + (todo && !saltados ? " ok" : "") + '" title="' + esc(caps.map(function (c) {
        var x = v[c.clave]; return c.n + " · " + c.titulo + ": " + (x ? (x.estado === "saltado" ? "saltado" : "visto") : "pendiente"); }).join("\n")) + '">'
      + hechos + "/" + n + (todo && !saltados ? " ✓" : "") + (saltados ? '<span class="small muted"> · ' + saltados + " saltado" + (saltados > 1 ? "s" : "") + "</span>" : "") + "</td>";
  }
  /**
   * 15-sep · MI GENTE, POR ESCUADRONES. Norberto: el referente que además imparte, «además de ver su escuadrón,
   * necesita ver el resto para resolver problemas». Arriba, un filtro: su escuadrón (si imparte aquí, que es lo
   * que dice «Mi gente») o todos, y cualquiera de los demás. Y la ficha se abre EN UNA VENTANA encima: «hago clic en
   * el estudiante y no se abre nada» — se pintaba debajo de la tabla, a veinte filas de distancia, fuera de la vista.
   */
  var FILTRO = {};   // por grupo: "" = todos, o el nombre del Comandante
  function filtroDe(t) {
    var escs = t.escuadrones || [], f = FILTRO[PER], mio = miNombreAqui();
    var tengoEsc = escs.some(function (e) { return e.comandante === mio; });
    /**
     * 🔴 16-sep · EN MODO DOCENTE, SOLO LO TUYO. Norberto: «si activo el modo docente no debo ver nada del referente;
     * ahora mismo en modo docente puedo ver la info de otros escuadrones, no quiero, solo en modo referente». Ver a toda
     * la gente del grupo es para revisar y resolver problemas: eso es del referente. El docente ve su escuadrón y punto.
     */
    if (!soyRefAqui()) return tengoEsc ? mio : "";
    if (f == null) f = tengoEsc ? mio : "";
    return f && escs.some(function (e) { return e.comandante === f; }) ? f : "";
  }
  /** El docente sin escuadrón en este grupo (y sin ser referente) no tiene alumnado que ver. */
  function sinGenteQueVer(t) {
    var mio = miNombreAqui();
    return !soyRefAqui() && !(t.escuadrones || []).some(function (e) { return e.comandante === mio; });
  }
  function NBADGES() { return (window.SG_BADGES && window.SG_BADGES.length) || 27; }
  function retosOrdenados() { return DATOS.misiones.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); }); }
  /**
   * 16-sep · EXPORTAR A CSV. Norberto lo eligió de lo que trae el motor: para evaluar con datos y para justificar una
   * nota hace falta sacar el curso de la pantalla. Se genera aquí mismo (nada sale del navegador) con lo que ya está
   * cargado, respetando el filtro de escuadrón que tenga puesto. Punto y coma y BOM: así Excel en español lo abre bien
   * a la primera, que es lo único que importa a las 23:00 de un domingo.
   */
  function descargarCSV(t, lista, filtro) {
    var AB = (window.SG_A_BORDO || { hitos: [] }), BT = window.SG_BATALLA || {};
    var cab = ["Alias", "Nombre", "Apellidos", "Correo", "Escuadrón", "Comandante", "Nivel", "XP", "Créditos",
               "Retos hechos", "Retos (ids)", "Insignias", "Cartas", "Héroes", "Logros de a bordo", "Días a bordo",
               "Simulador (ganó)", "Mejor marca", "Enlaces entregados", "Último movimiento"];
    var filas = lista.map(function (x) {
      var r = x[0], ev = (EVID && EVID[r.ficha]) || {}, sim = r.simulador || {};
      // (el nivel se deduce de la xp, como en toda la web)
      var niv = (window.SG && SG.nivel) ? SG.nivel(r.xp, (DATOS.proyecto.stargate || {}).tipo) : (r.nivel || "");
      var marcas = Object.keys((sim.marcas) || {}).map(function (k) { return Number(sim.marcas[k].p) || 0; });
      var hitos = AB.hitos.filter(function (h) { return (r.hitos || {})[h.clave]; }).length;
      var esc7 = ((t.escuadrones || []).filter(function (e) { return e.comandante === r.profe; })[0] || {}).nombre || "";
      return [r.alias || "", r.nombre_pila || "", r.apellidos || "", r.email || "",
              esc7, r.profe || "",
              niv, r.xp || 0, r.creditos != null ? r.creditos : "",
              (r.hechos || []).length, (r.hechos || []).join(" "),
              (r.insignias || []).length, ((r.coleccion || {}).cromos || {}).tengo || 0,
              ((r.coleccion || {}).heroes || {}).tengo || 0,
              hitos + "/" + AB.hitos.length, ((r.dias || {}).total) || 0,
              sim[BT.clave || "joran"] ? "sí" : "no", marcas.length ? Math.max.apply(null, marcas) : "",
              Object.keys(ev).map(function (k) { return k + ": " + ev[k]; }).join(" | "),
              r.ultima ? String(r.ultima).slice(0, 10) : ""];
    });
    var celda = function (v) {
      var s = String(v == null ? "" : v);
      return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    var csv = "\uFEFF" + [cab].concat(filas).map(function (f) { return f.map(celda).join(";"); }).join("\r\n");
    var nombre = "STARGATE_" + (PER || "grupo") + (filtro ? "_" + filtro.replace(/\s+/g, "-") : "") + "_" + new Date().toISOString().slice(0, 10) + ".csv";
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = nombre; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /** Las filas del alumnado (Mi gente y el detalle de un escuadrón): `lista` = [[recluta, índice en t.reclutas]…]. */
  function tablaGente(lista, caps, conComandante) {
    return '<div class="tabla-envoltura"><table class="tabla gente-tabla"><thead><tr><th>#</th><th>Alias</th><th>Nombre</th>' +
      (conComandante ? '<th>Comandante</th>' : '') +
      '<th>xp</th><th>◈</th><th>Insignias</th><th title="Capítulos de NEBULA vistos (de los ya abiertos)">Bienvenida</th></tr></thead><tbody>' +
      lista.map(function (x) {
        var r = x[0], i = x[1];
        // 16-sep · con su avatar (Norberto: «en Mi gente quiero ver el avatar de los estudiantes»): el que lleva puesto
        var tipoG = ((DATOS.proyecto || {}).stargate || {}).tipo || "REGULAR";
        var cara = window.SG && SG.avatarImg ? SG.avatarImg(r.avatar, r.alias, "gente-av" + (r.marco === "oro" ? " marco-oro" : ""), r.xp, tipoG) : "";
        return '<tr data-r="' + i + '" tabindex="0"' + (r.congelado ? ' class="congelado"' : '') + '><td>' + r.pos + '</td><td class="gente-quien"><div class="gq">' + cara + '<span><b>' + esc(r.alias) + '</b>' +
          (r.corona ? " <img class=ico src=assets/img/iconos/p/corona.png alt>" : "") + (r.congelado ? ' <span class="chip" title="Cuenta congelada por el referente"><img class=ico src=assets/img/iconos/p/hielo.png alt> congelado</span>' : '') + '</span></div></td><td>' + esc(r.nombre || "—") + '<br><span class="small muted">' +
          esc(r.email || "") + '</span></td>' + (conComandante ? '<td>' + esc(r.profe || "—") + '</td>' : '') + '<td>' + r.xp +
          '</td><td>' + r.creditos + '</td><td>' + r.n + "/" + NBADGES() + "</td>" + celdaBienvenida(r, caps) + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  /** Una fila pulsada (o con Intro) abre su ficha. */
  function cablearFilas(donde, t) {
    Array.prototype.forEach.call(donde.querySelectorAll("[data-r]"), function (fila) {
      var abre = function () { verFicha(t.reclutas[Number(fila.getAttribute("data-r"))]); };
      fila.onclick = abre;
      fila.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abre(); } };
    });
  }
  /**
   * 🔴 16-sep · LOS RANKINGS, EN LA CONSOLA Y PARA TODOS. Son exactamente los de la Nave del alumnado (assets/js/tablero.js):
   * se montan aquí con los datos que la consola ya tiene, sin pedir nada más. El docente abre con su escuadrón y el
   * referente con el grupo entero; los dos pueden cambiar, porque un ranking no es información del referente: lo ve
   * toda la clase.
   */
  function verRankings(t) {
    var mio = miNombreAqui(), tengoEsc = (t.escuadrones || []).some(function (e) { return e.comandante === mio; });
    $("#c-cuerpo").innerHTML = '<div class="card c-rankings"><h3><img class=ico src=assets/img/iconos/p/rankings.png alt> Rankings</h3>' +
      '<p class="small muted">Los mismos que ve tu alumnado en su Nave, del <b>grupo entero o de un escuadrón</b>. Cada uno mide una cosa distinta, ' +
      'para que brille más gente: proyéctalos en clase y ensalza a quien destaca. Pulsa a alguien para ver su ficha pública.</p>' +
      '<div id="c-rank" class="c-rank"></div></div>';
    if (!window.SG_RANKING_MONTAR) { $("#c-rank").innerHTML = '<p class="muted">No se ha podido cargar el ranking. Recarga la página.</p>'; return; }
    window.SG_RANKING_MONTAR($("#c-rank"), PER, { datos: t, ambito: !soyRefAqui() && tengoEsc ? mio : "" });
  }
  function verAlumnado(t) {
    var caps = capsDelGrupo(t), escs = t.escuadrones || [], filtro = filtroDe(t), mio = miNombreAqui(), ref = soyRefAqui();
    // los chips de escuadrón (y «Todos») son del referente: el docente ve su escuadrón sin elegir
    var chips = ref && escs.length > 1 ? '<div class="gente-filtro" role="group" aria-label="De qué escuadrón">' +
      '<button type="button" class="gf' + (!filtro ? " on" : "") + '" data-gf="" aria-pressed="' + !filtro + '">Todos <span>' + t.reclutas.length + '</span></button>' +
      escs.map(function (e) {
        var n = t.reclutas.filter(function (r) { return r.profe === e.comandante; }).length, on = filtro === e.comandante;
        return '<button type="button" class="gf' + (on ? " on" : "") + '" data-gf="' + esc(e.comandante) + '" aria-pressed="' + on + '">' +
          (e.emblema ? '<img src="' + esc(e.emblema) + '" alt="" width="22" height="22" loading="lazy">' : '') + esc(e.nombre) +
          '<em>' + (e.comandante === mio ? "el tuyo" : esc(e.comandante)) + '</em><span>' + n + '</span></button>';
      }).join("") + '</div>' : '';
    var lista = sinGenteQueVer(t) ? [] : t.reclutas.map(function (r, i) { return [r, i]; }).filter(function (x) { return !filtro || x[0].profe === filtro; });
    // 20-sep · el código de clase y la invitación viven AQUÍ y solo aquí (Norberto): en el Puente ocupaban sitio
    // todo el curso para algo que se usa los dos primeros días.
    var cod = (DATOS.proyecto || {}).joinCode;
    $("#c-cuerpo").innerHTML = '<div class="card"><div class="cn-gente-cab"><h3>Reclutas</h3>' + (cod ? '<span class="cn-falta">¿Falta alguien?</span>' + codigoClase(PER, cod) : '') + '</div>' +
      '<p class="small muted">El nombre y el correo solo los ves tú y el resto del equipo docente. ' +
      '<b>Pulsa una fila</b> y se abre su ficha: sus retos, los enlaces de lo que ha entregado y lo que puedes hacer.</p>' + chips +
      (lista.length ? tablaGente(lista, caps, !filtro) : '<p class="muted">' + (sinGenteQueVer(t) ? 'No tienes escuadrón en este grupo, así que aquí no hay alumnado a tu nombre.' : 'Todavía no hay nadie en este escuadrón.') + '</p>') +
      (ref && t.sin_docente ? '<p class="aviso"><img class=ico src=assets/img/iconos/p/aviso.png alt> ' + t.sin_docente + ' recluta(s) sin Comandante asignado.</p>' : "") +
      // 16-sep · la hoja de cálculo para evaluar: lo que hay en pantalla, tal cual, en un CSV
      (lista.length ? '<p class="gp-csv"><button type="button" class="btn min" id="c-csv"><img class=ico src=assets/img/iconos/p/rankings.png alt> Descargar CSV</button>' +
        '<span class="small muted">Lo de esta vista (' + lista.length + ' reclutas) para tu hoja de cálculo: xp, créditos, retos, insignias, ' +
        'cartas, héroes, logros, el Simulador y los enlaces que ha entregado cada cual.</span></p>' : "") +
      "</div>";
    Array.prototype.forEach.call(app.querySelectorAll("[data-gf]"), function (b) {
      b.onclick = function () { FILTRO[PER] = b.getAttribute("data-gf"); verAlumnado(t); };
    });
    var bcsv = document.getElementById("c-csv");
    if (bcsv) bcsv.onclick = function () { descargarCSV(t, lista, filtro); };
    cablearFilas(app, t);
    /**
     * 🔴 13-sep · LOS ENLACES DE EVIDENCIA, POR FIN A LA VISTA. El alumnado los guardaba en
     * `mission_deliveries` y NADA de la consola los leía: se pedían enlaces que caían en un pozo. Y
     * la razón de pedirlos —Norberto— es que el docente pueda verlos, comprobarlos y «mostrar o
     * alabar el trabajo de un estudiante en clase». Una consulta por grupo; se ven en su ficha.
     *
     * 🔴 17-sep · SIN EL «⚠️ N sin enlace» EN LA LISTA. Norberto: «no sería necesario: hemos puesto obligatorio adjuntar un
     * enlace, esto no nos va a pasar». Lo único que lo encendía eran los retos otorgados a mano (que no traen enlace) y
     * los de prueba. Si un enlace está mal, se ve en la ficha y se anula el reto con su porqué.
     */
    cargarEvid(t);
  }
  function cargarEvid(t) {
    var turno = ++TURNO_EVID; ULTIMO_T = t;
    EVID = null; EVID_PER = PER;
    // 15-sep (noche) · y las reflexiones (los retos que se responden en el propio reto) con sus comentarios
    var soloVacio = function () { return []; };
    EVID_LISTO = Promise.all([
      MOTOR.getDocs(MOTOR.query(MOTOR.collection(MOTOR.db, "mission_deliveries"), MOTOR.where("projectId", "==", PER))),
      MOTOR.reflexionesDe ? MOTOR.reflexionesDe(PER).catch(soloVacio) : Promise.resolve([]),
      MOTOR.comentariosDe ? MOTOR.comentariosDe(PER).catch(soloVacio) : Promise.resolve([])
    ]).then(function (x) {
        if (turno !== TURNO_EVID) return;
        EVID = {}; EVRF = {}; COMS = {};
        x[0].docs.forEach(function (d) { var e = d.data(); (EVID[e.studentProfileId] = EVID[e.studentProfileId] || {})[e.stargateReto || String(e.missionId).split("__").pop()] = e.enlace || ""; });
        (x[1] || []).forEach(function (f) { (EVRF[f.fichaId] = EVRF[f.fichaId] || {})[f.reto] = f; });
        (x[2] || []).forEach(function (c) { (COMS[c.reflexion] = COMS[c.reflexion] || []).push(c); });
      }).catch(function () { EVID = {}; EVRF = {}; COMS = {}; });
  }
  var EVID = null, EVID_LISTO = null, TURNO_EVID = 0, EVID_PER = null, EVRF = {}, COMS = {}, FICHA_RF = null, ULTIMO_T = null;
  /** Las reflexiones existen desde el 16-sep-2026: lo registrado antes no se marca como «sin reflexión». */
  var REFLEXION_DESDE = Date.parse("2026-09-16T00:00:00");
  function pideReflexion(reg) { var f = reg && reg.fecha ? Date.parse(reg.fecha) : NaN; return !isNaN(f) && f >= REFLEXION_DESDE; }
  /**
   * 15-sep (noche) · MODERAR LAS REFLEXIONES desde la ficha: quitar un comentario o la reflexión entera (con sus
   * comentarios). El reto sigue registrado; lo que se quita deja de verse en la Nave y en la sesión.
   */
  document.addEventListener("click", async function (ev) {
    var b = ev.target && ev.target.closest && ev.target.closest("#c-modal [data-rfquitar], #c-modal [data-rfquitarcom]");
    if (!b || !FICHA_RF) return;
    var r = FICHA_RF;
    /**
     * 17-sep · Vive dentro del desplegable del reto (Norberto quitó «Lo que ha entregado»: «esto ya se ve al pulsar el
     * propio reto; bórralo, vamos a simplificar»). Ahí no cabe otra pregunta desplegada —cerraría la del reto—, así
     * que se confirma pulsando dos veces: la primera lo pregunta en el propio botón.
     */
    if (!b.classList.contains("seguro")) {
      var antes = b.textContent;
      b.classList.add("seguro"); b.textContent = "¿Seguro? Pulsa otra vez";
      setTimeout(function () { if (b.isConnected && !b.disabled) { b.classList.remove("seguro"); b.textContent = antes; } }, 3500);
      return;
    }
    var caja = b.closest(".sgp-caja");
    b.disabled = true;
    if (b.hasAttribute("data-rfquitarcom")) {
      try { await MOTOR.borrarComentario(b.getAttribute("data-rfquitarcom")); } catch (e) { b.disabled = false; return avisoFicha(e.message); }
      var lista = b.closest(".sgp-rf-coms"), linea = b.closest("p");
      if (linea) linea.remove();
      if (lista) { var n = lista.querySelectorAll("p").length, s = lista.querySelector("summary");
        if (!n) lista.remove(); else if (s) s.textContent = "" + n + (n === 1 ? " comentario" : " comentarios") + " de su tripulación"; }
    } else {
      try { await MOTOR.borrarReflexion(PER, b.getAttribute("data-rfquitar"), r.ficha); } catch (e) { b.disabled = false; return avisoFicha(e.message); }
      if (caja && caja.__cerrar) caja.__cerrar(null);
    }
    if (ULTIMO_T) cargarEvid(ULTIMO_T);
    avisoFicha(b.hasAttribute("data-rfquitarcom") ? "Comentario quitado." : "Reflexión quitada: ya no se ve en la Nave ni en la sesión.", true);
  });

  /**
   * 15-sep (noche) · LOS LOGROS DE A BORDO en su ficha: cuántos lleva, qué cubiertas tiene completas y sus días a
   * bordo. Los apunta el servidor; aquí solo se enseñan (sirve para animar: «te falta el Zoco para el Contramaestre»).
   */
  var AB_TODO = window.SG_A_BORDO || { hitos: [], cubiertas: [], heroes: [] };
  var SINPUA = window.SG_SIN_PUA || { hitos: [], cubiertas: [] };
  // 16-sep · en un PUA no hay Zoco ni sorteo: sus logros son 12 en 4 cubiertas (lo mismo que ve la Nave)
  function esPUA() { try { return (DATOS.proyecto.stargate || {}).tipo === "PUA"; } catch (e) { return false; } }
  var AB = { heroes: AB_TODO.heroes,
    get hitos() { return esPUA() ? AB_TODO.hitos.filter(function (x) { return (SINPUA.hitos || []).indexOf(x.clave) < 0; }) : AB_TODO.hitos; },
    get cubiertas() { return esPUA() ? AB_TODO.cubiertas.filter(function (c) { return (SINPUA.cubiertas || []).indexOf(c.clave) < 0; }) : AB_TODO.cubiertas; } };
  function nHitos(r) { var h = (r && r.hitos) || {}; return AB.hitos.filter(function (x) { return h[x.clave]; }).length; }
  function lineaABordo(r) {
    if (!AB.hitos.length) return "";
    var h = r.hitos || {}, cub = r.cubiertas || {}, d = r.dias || {};
    var partes = AB.cubiertas.map(function (c) {
      var suyos = AB.hitos.filter(function (x) { return x.cubierta === c.clave; }), n = suyos.filter(function (x) { return h[x.clave]; }).length;
      return '<span class="fi-ab' + (cub[c.clave] ? " ok" : "") + '" title="' + esc(suyos.filter(function (x) { return !h[x.clave]; }).map(function (x) { return "Le falta: " + x.titulo; }).join(" · ") || "Completa") + '">' +
        (cub[c.clave] ? "✓ " : "") + esc(c.nombre) + " " + n + "/" + suyos.length + "</span>";
    }).join(" ");
    return '<p class="fi-abordo"><b><img class=ico src=assets/img/iconos/p/medalla.png alt> ' + nHitos(r) + '/' + AB.hitos.length + ' logros de a bordo</b>' + (cub.todo ? " · <b><img class=ico src=assets/img/iconos/p/estrella.png alt> Contramaestre de la Nave</b>" : "") + " · " + partes +
      (d.total ? ' <span class="small muted">· <img class=ico src=assets/img/iconos/p/fuego.png alt> ' + (d.racha || 0) + " días seguidos, " + d.total + " en total</span>" : "") + "</p>" +
      lineaSimulador(r);
  }
  /**
   * 16-sep · EL SIMULADOR DE JORAN en su ficha: si le ganó (el reto A6), sus mejores marcas y lo que lleva entrenado.
   * Sirve para lo mismo que los logros: saber a quién animar («te falta ganarle una vez») sin preguntar en clase.
   */
  var BT = window.SG_BATALLA || {};
  function lineaSimulador(r) {
    var S = (r && r.simulador) || {};
    if (!S[BT.clave || "joran"] && !S.total) return "";
    var m = S.marcas || {}, mejores = Object.keys(m).sort(function (a, b) { return (m[b].p || 0) - (m[a].p || 0); }).slice(0, 3);
    var T = S.total || {};
    return '<p class="fi-abordo"><b><img class=ico src=assets/img/iconos/p/diana.png alt> ' + (S[BT.clave || "joran"] ? "Venció a " + esc(BT.rival || "RUTA AZUL") : "Todavía no ha ganado al simulador") + "</b>" +
      (mejores.length ? " · " + mejores.map(function (k) {
        return '<span class="fi-ab ok">' + esc(k === "todas" ? "Todas" : "T" + k.slice(1)) + " " + (m[k].p || 0) + "</span>"; }).join(" ") : "") +
      (T.batallas ? ' <span class="small muted">· ' + T.batallas + " batallas, " + (T.aciertos || 0) + " aciertos" +
        (T.aciertos ? " (" + (Math.round((T.ms / 1000) / T.aciertos * 10) / 10) + " s cada uno)" : "") + "</span>" : "") + "</p>";
  }

  /**
   * 15-sep · LA FICHA, EN UNA VENTANA ENCIMA (se cierra con ✕, Escape o pulsando fuera). Sirve igual desde Mi gente
   * que desde el detalle de un escuadrón. Tras otorgar, anular o congelar se vuelve a abrir con los datos nuevos: antes
   * se repintaba la lista y la ficha desaparecía, y había que buscarla otra vez.
   */
  function modalFicha(html) {
    var m = document.getElementById("c-modal");
    if (!m) {
      m = document.createElement("div"); m.id = "c-modal"; m.className = "c-modal";
      m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "Ficha del recluta");
      document.body.appendChild(m);
      m.addEventListener("click", function (e) { if (e.target === m || (e.target.closest && e.target.closest("[data-cerrar-ficha]"))) cerrarFicha(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && m.classList.contains("abierto")) cerrarFicha(); });
    }
    m.innerHTML = '<div class="c-modal-caja" tabindex="-1">' + html + "</div>";
    m.classList.add("abierto"); document.body.classList.add("con-modal");
    var caja = m.querySelector(".c-modal-caja"); if (caja) caja.focus({ preventScroll: true });
    return m;
  }
  function cerrarFicha() {
    var m = document.getElementById("c-modal");
    if (m) { m.classList.remove("abierto"); m.innerHTML = ""; }
    document.body.classList.remove("con-modal");
  }
  function avisoFicha(txt, bien) {
    var a = document.querySelector("#c-modal .c-modal-aviso"); if (!a) return aviso(txt, bien);
    a.textContent = txt; a.className = "c-modal-aviso aviso " + (bien ? "" : "malo"); a.hidden = !txt;
  }
  /** Tras cambiar algo: el grupo releído y la misma ficha, abierta otra vez, con el aviso de lo hecho. */
  function reabrirFicha(fichaId, txt, bien) {
    var t = window.SG.TABLERO.tablero(DATOS, true);
    var r = t.reclutas.filter(function (x) { return x.ficha === fichaId; })[0];
    if (!r) { cerrarFicha(); aviso(txt, bien); return; }
    verFicha(r); avisoFicha(txt, bien);
  }
  /**
   * 🔴 16-sep · LA FICHA, CON SUS INSIGNIAS Y POR TEMAS. Norberto: «me gusta la idea, está bien clasificado, pero querría
   * ver las insignias (iluminadas las que tienen), manteniendo la clasificación por temas». Cada tema en una fila: sus
   * insignias (encendidas las ganadas) y sus retos (en verde los registrados, que se pulsan para otorgar o anular). Las
   * insignias que no son de ningún reto —los hitos que se ganan solos— van al final, en «Hitos del viaje».
   */
  function temasDeLaFicha(r, retos) {
    var suyas = r.insignias || [], N = window.SG_BADGE_NAMES || {}, cat = window.SG_CATALOGO || {}, vistas = {};
    var chip = function (mi) {
      var tiene = !!(r.retos || {})[mi.id];
      return '<button type="button" class="reto' + (tiene ? " hecho" : "") + (/^L\d/.test(mi.id) ? " rel" : "") + '" data-reto="' + esc(mi.id) + '" data-tiene="' + (tiene ? 1 : 0) +
        '" title="' + esc(mi.title) + '">' + esc(mi.id) + (tiene ? " ✓" : "") + "</button>";
    };
    var ins = function (k) {
      vistas[k] = 1; var on = suyas.indexOf(k) >= 0;
      return '<img class="fi-in' + (on ? "" : " no") + '" src="assets/img/insignias/' + esc(k) + '.png" alt="' + esc(N[k] || k) + '" title="' + esc(N[k] || k) + (on ? "" : " · pendiente") + '" loading="lazy" width="44" height="44">';
    };
    var fila = function (tit, sub, ks, mis) {
      var hechos = mis.filter(function (mi) { return (r.retos || {})[mi.id]; }).length;
      return '<div class="fi-tema' + (mis.length && hechos === mis.length ? " completo" : "") + '"><div class="fi-tema-cab"><b>' + esc(tit) + "</b>" +
        (sub ? "<span>" + esc(sub) + "</span>" : "") + (mis.length ? "<em>" + hechos + "/" + mis.length + "</em>" : "") + "</div>" +
        '<div class="fi-tema-ins">' + ks.map(ins).join("") + "</div>" +
        (mis.length ? '<div class="retos-ficha">' + mis.map(chip).join("") + "</div>" : "") + "</div>";
    };
    var html = "";
    for (var tt = 1; tt <= 8; tt++) {
      var mis = retos.filter(function (mi) { return Number(mi.stargateTema) === tt; });
      var ks = []; mis.forEach(function (mi) { (mi.stargateBadges || []).forEach(function (k) { if (ks.indexOf(k) < 0) ks.push(k); }); });
      var pl = (cat.temas || []).filter(function (x) { return x && Number(x.n) === tt; })[0];
      html += fila("Tema " + tt, pl ? pl.planeta : "", ks, mis);
    }
    var resto = (window.SG_BADGES || []).filter(function (k) { return !vistas[k]; });
    // (el alistamiento, H1, no se otorga ni se anula: llega al alistarse. Sin su botón, la fila no dice «0/1»)
    var sueltos = retos.filter(function (mi) { return mi.id !== "H1" && !(Number(mi.stargateTema) >= 1 && Number(mi.stargateTema) <= 8); });
    if (resto.length || sueltos.length) html += fila("Hitos del viaje", "llegan solos", resto, sueltos);
    return '<div class="fi-temas">' + html + "</div>";
  }
  /**
   * 🔴 16-sep · CAMBIAR DE COMANDANTE DESDE LA FICHA. Norberto: «añade la opción de cambiar de comandante desde aquí,
   * ayudará mucho». Pasa: alguien elige al docente equivocado al alistarse, o un grupo se reparte. Es del referente,
   * como mover a toda la gente de un docente a otro, y hace lo mismo que aquello pero con una sola persona.
   */
  function cambioDeComandante(r) {
    var fs = ((DATOS.proyecto && DATOS.proyecto.factions) || []).filter(function (f) { return f.teacherName && f.teacherName !== r.profe; });
    if (!fs.length) return "";
    return '<p class="fi-cmd"><label><img class=ico src=assets/img/iconos/p/zoco.png alt> Pasar a ' + esc(r.alias) + ' al escuadrón de <select id="c-cmd">' +
      fs.map(function (f) { return '<option value="' + esc(f.teacherName) + '">' + esc(f.name || f.teacherName) + " · " + esc(f.teacherName) + "</option>"; }).join("") +
      '</select></label> <button type="button" class="btn min" id="c-cmd-b">Cambiar</button> ' +
      '<span class="small muted">se lleva todo lo suyo: retos, créditos y colección.</span></p>';
  }
  /**
   * 🔴 20-sep · «LO SUYO», EN SU FICHA. Norberto, preparando la Nave Escuela: «si miro la ficha de un estudiante,
   * ¿veo las participaciones que tiene, lo que ha puesto en el Zoco y sus cartas/avatares?». No: la ficha contaba
   * xp, créditos, insignias y retos, y ahí se acababa. Y es justo lo que se mira antes de hablar con alguien en
   * clase —«llevas tres papeletas», «tienes a Xena puesta en el Zoco desde hace una semana»—, y lo que hace falta
   * para entender una reclamación («me falta un cromo»).
   *
   * Lo que sale de los datos que ya están (el tablero) se pinta al momento; lo del Zoco vive en otra colección, así
   * que se pide una vez por grupo y se rellena cuando llega, sin hacer esperar a la ficha.
   */
  function bloqueSuyo(r) {
    var C = r.coleccion || {}, cr = C.cromos || {}, he = C.heroes || {}, sk = C.skins || {};
    var cat = window.SG_CATALOGO || {};
    var nombreHeroe = function (clave) {
      var h = (cat.heroes || []).filter(function (x) { return x.clave === clave; })[0];
      return (h && h.nombre) || clave;
    };
    var viste = String(r.viste || "");
    var lleva = viste.indexOf("heroe:") === 0 ? "el héroe <b>" + esc(nombreHeroe(viste.slice(6))) + "</b>"
              : "su personaje" + (r.avatar && r.avatar.skin ? " de rango " + r.avatar.skin : "");
    var adornos = [];
    if (r.titulo) adornos.push("título «" + esc(r.titulo) + "»");
    if (r.marco === "oro") adornos.push("marco dorado");
    if (r.fondo) adornos.push("fondo de planeta");
    var pap = r.papeletas || [];
    return '<h4>Lo suyo</h4>' +
      '<div class="fi-suyo">' +
        '<div class="fi-s-u"><b>' + ico("estrella") + ' Cartas y héroes</b>' +
          '<p>' + (cr.tengo || 0) + '/' + (cr.total || 0) + ' cromos · ' + (he.tengo || 0) + '/' + (he.total || 0) + ' héroes · ' +
            (sk.tengo || 0) + '/' + (sk.total || 0) + ' rangos' +
            (r.n_album ? ' · <b>' + r.n_album + '</b> ' + (r.n_album === 1 ? 'serie completa' : 'series completas') : '') +
            (r.repes_disponibles ? ' · ' + r.repes_disponibles + ' repetidas sin cambiar' : '') + '</p>' +
          (r.leyendas && r.leyendas.length ? '<p class="small">' + ico("corona") + ' Legendarios: <b>' + r.leyendas.map(esc).join(", ") + '</b></p>' : '') + '</div>' +
        '<div class="fi-s-u"><b>' + ico("botin") + ' Cómo se viste</b>' +
          '<p>Lleva puesto ' + lleva + '.' + (adornos.length ? ' Ha comprado: ' + adornos.join(", ") + '.' : ' Sin adornos comprados.') + '</p></div>' +
        '<div class="fi-s-u"><b>' + ico("dados") + ' El Gran Sorteo</b>' +
          '<p>' + (pap.length
            ? pap.map(function (x) { return '<b>' + x.n + '</b> ' + (x.n === 1 ? 'participación' : 'participaciones') + ' · ' + esc(x.premio) + (x.hecho ? ' <span class="muted">(ya sorteado)</span>' : ''); }).join("<br>")
            : 'Sin participaciones.') +
            (r.premios && r.premios.length ? '<br>' + ico("corona") + ' Ha ganado: <b>' + r.premios.map(esc).join(", ") + '</b>' : '') + '</p></div>' +
        '<div class="fi-s-u" id="fi-zoco"><b>' + ico("mercado") + ' En el Zoco</b><p class="muted">Mirando el Zoco…</p></div>' +
      '</div>';
  }
  /** Lo del Zoco, cuando llega: lo que tiene puesto y los tratos en los que anda metido. */
  var ZOCO_CACHE = null, ZOCO_CACHE_PER = "";
  function zocoDeFicha(r) {
    var caja = document.getElementById("fi-zoco"); if (!caja || !MOTOR.zocoAnunciosGrupo) return;
    var perAqui = PER;
    var datos = (ZOCO_CACHE && ZOCO_CACHE_PER === PER) ? ZOCO_CACHE
      : Promise.all([MOTOR.zocoAnunciosGrupo(PER), MOTOR.zocoTratosGrupo(PER)]);
    ZOCO_CACHE = datos; ZOCO_CACHE_PER = PER;
    datos.then(function (d) {
      if (PER !== perAqui) return;
      var caja2 = document.getElementById("fi-zoco"); if (!caja2) return;
      var mios = (d[0] || []).filter(function (a) { return a.vende && a.vende.ficha === r.ficha; });
      var puesto = mios.filter(function (a) { return a.estado === "abierto"; });
      var tratos = (d[1] || []).filter(function (t) { return (t.vende && t.vende.ficha === r.ficha) || (t.compra && t.compra.ficha === r.ficha); });
      var abiertos = tratos.filter(function (t) { return t.estado === "abierto"; });
      var cerrados = tratos.filter(function (t) { return t.estado === "aceptado"; }).length;
      // el nombre de la pieza, no su clave: «Xena» dice algo, «H04_xena» no
      var nombre = function (p) {
        var k = String((p && p.clave) || ""), C = window.SG_CATALOGO || {};
        if ((p && p.tipo) === "participacion") return "una participación del sorteo";
        var x = ((p && p.tipo) === "heroe" ? (C.heroes || []) : (C.cromos || [])).filter(function (y) { return y.clave === k; })[0];
        return esc((x && x.nombre) || k || "—");
      };
      caja2.innerHTML = '<b>' + ico("mercado") + ' En el Zoco</b><p>' +
        (puesto.length ? 'Tiene puesto: <b>' + puesto.map(function (a) { return nombre(a.pieza); }).join(", ") + '</b>.' : 'No tiene nada puesto.') +
        (abiertos.length ? ' ' + abiertos.length + (abiertos.length === 1 ? ' trato abierto' : ' tratos abiertos') + '.' : '') +
        (cerrados ? ' <span class="muted">' + cerrados + (cerrados === 1 ? ' trueque cerrado' : ' trueques cerrados') + '.</span>' : '') +
        '</p>';
    }, function () {
      var caja2 = document.getElementById("fi-zoco"); if (caja2) caja2.innerHTML = '<b>' + ico("mercado") + ' En el Zoco</b><p class="muted">No he podido mirar el Zoco ahora mismo.</p>';
    });
  }
  function verFicha(r) {
    var retos = retosOrdenados(), ficha = r.ficha, esRef = soyRefAqui();
    FICHA_RF = r;   // (para quitar una reflexión o un comentario desde su ficha)
    var f = ((DATOS.proyecto && DATOS.proyecto.factions) || []).filter(function (x) { return x.teacherName === r.profe; })[0];
    var m = modalFicha(
      '<button type="button" class="c-modal-x" data-cerrar-ficha aria-label="Cerrar la ficha">✕</button>' +
      '<div class="fi-cab">' + (f && f.imageUrl ? '<img class="fi-emb" src="' + esc(f.imageUrl) + '" alt="" width="56" height="56">' : '') +
        '<div><div class="fi-esc">' + (f ? esc(f.name) + " · " : "") + "Comandante " + esc(r.profe || "—") + "</div>" +
        "<h3>" + esc(r.alias) + (r.corona ? " <img class=ico src=assets/img/iconos/p/corona.png alt>" : "") + (r.nombre ? ' <span>· ' + esc(r.nombre) + "</span>" : "") + "</h3>" +
        (r.email ? '<p class="small muted">' + esc(r.email) + "</p>" : "") + "</div></div>" +
      '<div class="fi-cifras"><div><b>' + r.xp + '</b><span>xp</span></div><div><b>' + r.creditos + '</b><span>◈ créditos</span></div>' +
        '<div><b>' + r.nivel + '</b><span>nivel · ' + esc(r.rango_nombre || "") + '</span></div><div><b>' + r.n + '/' + NBADGES() + '</b><span>insignias</span></div>' +
        '<div><b>' + (r.racha || 0) + '</b><span>semanas de racha</span></div></div>' +
      lineaABordo(r) +
      (r.congelado ? '<p class="aviso"><img class=ico src=assets/img/iconos/p/hielo.png alt> <b>Cuenta congelada</b>' + (r.congelado.fecha ? " desde el " + diaDe(r.congelado.fecha) : "") + ": entra y mira su Nave, pero no puede hacer nada.</p>" : "") +
      '<div class="c-modal-aviso aviso" hidden></div>' +
      bloqueSuyo(r) +
      "<h4>Sus retos y sus insignias, por temas</h4>" + temasDeLaFicha(r, retos) +
      '<p class="small muted">Insignia encendida = ganada. Reto en verde = registrado. Pulsa un reto: ves su enlace y su reflexión, y lo validas o lo anulas con un mensaje que le llega a su Nave. Todo queda anotado en el libro de experiencia, con quién y cuándo.</p>' +
      // 🔴 DAR DE BAJA y CONGELAR (14-sep): solo el referente (Norberto: «el referente tiene poder de eliminar o
      // congelar: puede acceder, pero no puede hacer nada, bloqueado»). La baja hace falta de verdad: alguien que se
      // alista en el grupo equivocado o con la cuenta que no era deja una ficha huérfana en el ranking.
      // 19-sep · y ya no en tu Nave: es gestión, va en «Gestionar grupos» (Norberto: «solo desde esa página se pueden… gestionar
      // (añadir estudiantes, profes, graduar, cambiar a un estudiante de grupo…)»). En la Nave, la ficha es para dar clase.
      (esRef && GESTION ? '<div class="ficha-ref"><h4>Solo el referente</h4>' + cambioDeComandante(r) + moverDeGrupo(r) +
        '<p><button type="button" class="btn min" id="c-congelar">' + (r.congelado ? "▶ Descongelar a " : "<img class=ico src=assets/img/iconos/p/hielo.png alt> Congelar a ") + esc(r.alias) + "</button> " +
        '<span class="small muted">' + (r.congelado ? "vuelve a poder hacer de todo." : "podrá entrar y mirar, pero no registrar retos, comprar, fichar ni usar el Zoco.") + "</span></p>" +
        '<p><button type="button" class="btn min peligro" id="c-baja">Dar de baja a ' + esc(r.alias) + "</button> " +
        '<span class="small muted">borra su ficha del grupo. Podrá alistarse otra vez, aquí o en otro, empezando de cero.</span></p></div>' : ""));
    zocoDeFicha(r);
    var cmdB = m.querySelector("#c-cmd-b");
    if (cmdB) cmdB.onclick = async function () {
      var a = (m.querySelector("#c-cmd") || {}).value; if (!a) return;
      if (!(await window.SG.preguntar({ aqui: cmdB.closest("p") || cmdB, marca: cmdB, titulo: "¿Pasar a «" + r.alias + "» al escuadrón de " + a + "?",
        texto: "Cambia de Comandante y de escuadrón. Se lleva todo lo suyo: retos, créditos y colección.", si: "Cambiar de Comandante" }))) return;
      cmdB.disabled = true;
      try {
        await MOTOR.cambiarComandante(PER, ficha, a); await refrescar();
        reabrirFicha(ficha, "" + r.alias + " ya está en el escuadrón de " + a + ".", true);
      } catch (e) { cmdB.disabled = false; avisoFicha("No se ha podido cambiar: " + (e.message || e), false); }
    };
    var cong = m.querySelector("#c-congelar");
    if (cong) cong.onclick = async function () {
      var ya = !!r.congelado;
      if (!ya && !(await window.SG.preguntar({ aqui: cong.closest("p") || cong, marca: cong, titulo: "¿Congelar la cuenta de «" + r.alias + "»?",
        texto: "Podrá entrar y mirar su Nave, pero no hacer nada: ni registrar retos, ni comprar, ni fichar, ni el Zoco. " +
               "Lo que tenga en el Zoco se retira (y cada oferta devuelve lo suyo).\n\nSe descongela con un clic, cuando quieras.",
        si: "Congelar", peligro: true }))) return;
      cong.disabled = true;
      try {
        await MOTOR.alumno(PER, ficha, ya ? "descongelar" : "congelar"); await refrescar();
        reabrirFicha(ficha, ya ? "▶ " + r.alias + " ya puede volver a hacer de todo." : "" + r.alias + " está congelado: mira, pero no toca.", true);
      } catch (e) {
        cong.disabled = false;
        avisoFicha(/not-found|internal/.test(String(e && e.code)) && !/[áéíóú]/.test(String(e && e.message))
          ? "Falta desplegar en el servidor la función «stargateAlumno» (el comando está en el traspaso)." : e.message);
      }
    };
    var mov = m.querySelector("#c-mover-b");
    if (mov) mov.onclick = async function () {
      var dest = (m.querySelector("#c-mover") || {}).value, pd = PERS.filter(function (p) { return p.id === dest; })[0];
      if (!dest || !pd) return;
      if (!(await window.SG.preguntar({ aqui: mov.closest("p") || mov, marca: mov, titulo: "¿Pasar a «" + r.alias + "» al grupo «" + pd.nombre + "»?",
        texto: "Se lleva todo lo suyo: xp, créditos, insignias, cromos y héroes. En este grupo deja de estar.", si: "Cambiar de grupo" }))) return;
      mov.disabled = true;
      try { await MOTOR.moverRecluta(PER, ficha, dest); await refrescar(); cerrarFicha(); aviso(r.alias + " ya está en «" + pd.nombre + "».", true); }
      catch (e) { mov.disabled = false; avisoFicha(e.message); }
    };
    var baja = m.querySelector("#c-baja");
    if (baja) baja.onclick = async function () {
      // Esto borra de verdad y no hay deshacer: el botón no se enciende hasta escribir su alias, que es lo único que
      // impide un clic distraído sobre la persona equivocada.
      if (!(await window.SG.preguntar({ aqui: baja.closest("p") || baja, marca: baja, titulo: "¿Dar de baja a «" + r.alias + "» de este grupo?",
        texto: "Se borra su ficha: alias, personaje, retos, insignias y cartas. El rastro de lo que se le dio y se le quitó SÍ se conserva " +
               "en el libro de experiencia.\n\nNo hay deshacer.",
        campo: { etiqueta: "Para confirmar, escribe su alias:", ayuda: r.alias, igualA: r.alias }, si: "Dar de baja", peligro: true }))) return;
      baja.disabled = true;
      try { await MOTOR.darDeBaja(PER, ficha); await refrescar(); cerrarFicha(); aviso(r.alias + " ya no está en el grupo.", true); }
      catch (e) { baja.disabled = false; avisoFicha(e.message); }
    };
    /**
     * 🔴 17-sep · VALIDAR O ANULAR UN RETO, CON SU PORQUÉ. Norberto: «como la ficha ya es una ventana, que aparezca un
     * desplegable debajo de la misión preguntando si se quiere validar o desvalidar, junto con la posibilidad de enviar un
     * mensaje al estudiante. Imagina que ha puesto un enlace incorrecto: se desmarca la misión y se da una razón». Antes
     * era el `confirm()` del navegador y el recluta veía desaparecer su reto sin saber por qué.
     */
    Array.prototype.forEach.call(m.querySelectorAll("[data-reto]"), function (b) {
      b.onclick = async function () {
        var id = b.getAttribute("data-reto"), tiene = b.getAttribute("data-tiene") === "1";
        if (!EVID && EVID_LISTO) { try { await EVID_LISTO; } catch (x) {} }   // (sus enlaces y reflexiones, antes de preguntar)
        var mi = retos.filter(function (x) { return x.id === id; })[0] || {};
        var xp = Number(mi.points || 0), cr = Number(mi.coinsReward || 0);
        // 17-sep · y su reflexión, en los retos que se responden en el propio reto. Norberto: «cuando una tarea tiene
        // reflexión en vez de enlace, si hago clic, ¿puedo leer la reflexión? Debería». Se lee entera, aquí mismo.
        var RFX1 = (window.SG_REFLEXION || {})[id], rfx = ((EVRF && EVRF[ficha]) || {})[id];
        var entregado = String(((EVID && EVID[ficha]) || {})[id] || (rfx && rfx.enlace) || "").trim();
        var enlaces = entregado ? entregado.split(/\s+/).map(function (u) {
          var url = /^https?:\/\//i.test(u) ? u : "https://" + u;
          return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"><img class=ico src=assets/img/iconos/p/enlace.png alt> ' + esc(u.replace(/^https?:\/\//i, "").slice(0, 70)) + "</a>"; }).join(" ") : "";
        // 19-sep · en PILOTO AUTOMÁTICO se ve lo entregado (enlace y reflexión), pero validar o anular lo hace el referente
        if (!manual()) {
          await window.SG.preguntar({ aqui: b.closest(".retos-ficha") || b, marca: b,
            titulo: id + " · " + r.alias,
            html: '<p class="sgp-reto"><b>' + esc(id) + " · " + esc(mi.title || "") + "</b>" +
                    (tiene ? (enlaces ? "<span>" + enlaces + "</span>" : '<span class="small muted">sin enlace</span>') : '<span class="small muted">todavía no lo ha registrado</span>') + "</p>" +
                  (tiene && rfx ? '<div class="sgp-rf"><p class="sgp-rf-cab"><b>Su reflexión</b> · «' + esc((RFX1 && RFX1.titulo) || "") + "»</p>" +
                    '<p class="sgp-rf-txt">' + esc(rfx.texto || "") + "</p></div>" : "") +
                  '<p class="small muted">Validar o anular retos lo hace tu referente. Si quieres hacerlo tú, pasa a <b>Mando manual</b> (en tu ficha, en el Puente).</p>',
            si: "Cerrar", no: "" });
          return;
        }
        var resp = await window.SG.preguntar({
          aqui: b.closest(".retos-ficha") || b, marca: b, peligro: tiene,
          titulo: (tiene ? "¿Anular " : "¿Validar ") + id + " a " + r.alias + "?",
          html: '<p class="sgp-reto"><b>' + esc(id) + " · " + esc(mi.title || "") + "</b>" +
                  (tiene ? (enlaces ? "<span>" + enlaces + "</span>"
                                    : (RFX1 && RFX1.modo === "texto" ? "" : '<span class="small muted">sin enlace</span>')) : "") + "</p>" +
                (tiene && RFX1 ? (rfx
                  ? '<div class="sgp-rf"><p class="sgp-rf-cab"><img class=ico src=assets/img/iconos/p/editar.png alt> <b>Su reflexión</b> · «' + esc(RFX1.titulo || "") + "»</p>" +
                    '<p class="sgp-rf-txt">' + esc(rfx.texto || "") + "</p>" +
                    ((COMS[rfx.id] || []).length ? '<details class="sgp-rf-coms"><summary><img class=ico src=assets/img/iconos/p/mensaje.png alt> ' + (COMS[rfx.id] || []).length +
                      ((COMS[rfx.id] || []).length === 1 ? " comentario" : " comentarios") + " de su tripulación</summary>" +
                      (COMS[rfx.id] || []).map(function (c) { var q = (DATOS.perfiles || []).filter(function (p) { return p.id === c.fichaId; })[0];
                        return '<p class="evid-com"><b>' + esc((q && q.displayName) || "Un recluta") + "</b> " + esc(c.texto || "") +
                          ' <button type="button" class="btn min" data-rfquitarcom="' + esc(c.id) + '">Quitar</button></p>'; }).join("") + "</details>" : "") +
                    '<p class="sgp-rf-mod"><button type="button" class="btn min" data-rfquitar="' + esc(id) + '">Quitar la reflexión</button> ' +
                      '<span class="small muted">deja de verse en la Nave y en la sesión; el reto sigue registrado</span></p></div>'
                  : (pideReflexion((r.retos || {})[id]) ? '<p class="small muted"><img class=ico src=assets/img/iconos/p/editar.png alt> Este reto lleva reflexión y no la tiene.</p>' : "")) : "") +
                '<p class="sgp-cifras">' + (tiene ? "Se le quitan " : "Se le suman ") + "<b>" + xp + " xp</b>" + (mi.badge ? ", " : " y ") + "<b>" + cr + " ◈</b>" +
                  (mi.badge ? " y su insignia" : "") + (tiene ? ". Podrá registrarlo otra vez." : ".") + "</p>",
          campo: { etiqueta: "Mensaje para " + r.alias, ayuda: tiene ? "· lo verá en su Nave" : "· opcional · lo verá en su Nave", filas: 2, max: 400,
                   marcador: tiene ? "Por qué lo anulas y qué tiene que hacer para registrarlo bien…" : "Un comentario sobre su trabajo…",
                   rapidos: tiene
                     ? [["El enlace no abre", "El enlace no abre: revisa que esté bien copiado y vuelve a registrar el reto."],
                        ["No es público", "El enlace no es público: cambia los permisos para que cualquiera con el enlace pueda verlo y vuelve a registrarlo."],
                        ["No es lo que pide", "Lo que has entregado no es lo que pide el reto: vuelve a leerlo y regístralo cuando lo tengas."],
                        ["Falta la reflexión", "Falta la reflexión que pide el reto: añádela al registrarlo otra vez."]]
                     : [["¡Buen trabajo!", "¡Buen trabajo! Te lo valido."], ["Lo vi en clase", "Lo hiciste en clase: te lo valido yo."]] },
          si: tiene ? "Anular reto" : "Validar reto", no: "Cancelar"
        });
        if (!resp) return;
        b.disabled = true;
        try {
          var res = tiene ? await MOTOR.anularReto(PER, ficha, id, (resp.texto || "desde la consola").slice(0, 200))
                          : await MOTOR.otorgarReto(PER, ficha, id);
          // el mensaje, después de hacerlo (si fallara lo otro, no le llega un «te lo he anulado» falso)
          var avisado = false, perfil = (DATOS.perfiles || []).filter(function (p) { return p.id === ficha; })[0];
          if (resp.texto && perfil && perfil.userId) {
            try { await MOTOR.avisarRecluta(PER, perfil.userId, { reto: id, accion: tiene ? "anulado" : "validado", texto: resp.texto, de: miNombreAqui() }); avisado = true; }
            catch (x) { avisado = false; }
          }
          await refrescar();
          /**
           * 🔴 Si ya se había gastado lo que le dio el reto, se le dice al docente, con la cifra. El
           * saldo no baja de cero, así que un recluta que marca retos sin hacerlos y se lo gasta
           * todo conserva lo comprado aunque le anules: sin este aviso, el docente creería que lo ha
           * deshecho del todo. La xp sí se retira entera —el ranking y el nivel quedan limpios— y la
           * nota nunca estuvo en juego: las subidas de nota esperan tu visto bueno en la cola.
           */
          var falta = res && Number(res.noRetirados || 0);
          reabrirFicha(ficha, (tiene ? "Anulado " : "Validado ") + id + " a " + r.alias +
                (resp.texto ? (avisado ? " · le ha llegado tu mensaje a su Nave." : " · pero el mensaje no se ha podido enviar.") : "") +
                (falta ? " · ya se había gastado " + falta + " ◈ de este reto: no se le han podido retirar." : ""), !falta && (!resp.texto || avisado));
        } catch (e) { b.disabled = false; avisoFicha(e.message); }
      };
    });
  }

  // ---------------------------------------------------------------- la cola de nota
  function verCanjes() {
    var pendientes = (DATOS.vales || []).filter(function (v) { return (v.status || "pending") === "pending"; });
    var alias = {};
    DATOS.perfiles.forEach(function (p) { alias[p.userId] = p.displayName; });
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Cola de nota</h3>' +
      // 🔴 La razón de que esta cola exista: con las subidas de nota concediéndose solas, un curso
      // terminaba con setenta cambios de nota. Aprobando en bloque y con precios altos, con tres o
      // cuatro. La cola no es burocracia, es el freno.
      '<p class="small muted">Las subidas de nota no se conceden solas: se piden y tú decides. ' +
      'Los créditos ya están retenidos; si deniegas, se le devuelven.</p>' +
      (pendientes.length
        ? pendientes.map(function (v) {
            return '<div class="vale"><p><b>' + esc(alias[v.studentId] || v.studentId) + '</b> — ' +
              esc(v.rewardTitle || "") + ' <i>(' + (v.cost || 0) + ' ◈)</i>' +
              (v.stargateActividad ? '<br><span class="small">' + esc(v.stargateActividad) + "</span>" : "") + "</p>" +
              '<p><button class="btn min si" data-si="' + esc(v.id) + '">Conceder</button> ' +
              '<button class="btn min no" data-no="' + esc(v.id) + '">Denegar y devolver</button></p></div>';
          }).join("")
        : '<p class="muted">No hay nada pendiente.</p>') + "</div>";
    var resolver = function (id, si) {
      return async function () {
        try { await MOTOR.resolverVale(id, si, ""); await refrescar(); aviso(si ? "Concedido" : "Denegado y devuelto", true); }
        catch (e) { aviso(e.message); }
      };
    };
    Array.prototype.forEach.call(app.querySelectorAll("[data-si]"), function (b) { b.onclick = resolver(b.getAttribute("data-si"), true); });
    Array.prototype.forEach.call(app.querySelectorAll("[data-no]"), function (b) { b.onclick = resolver(b.getAttribute("data-no"), false); });
  }

  // ---------------------------------------------------------------- mis enlaces
  /**
   * LOS ENLACES DE ESTE DOCENTE, para ESTE grupo.
   *
   * 🔴 Faltaba, y Norberto lo pidió dos veces: «dentro de sus clases debe poder modificar los
   * enlaces por defecto» y «facilidad para poner sus propios enlaces». Hasta hoy lo único editable
   * vivía en «Ajustes del grupo», que es del referente — así que un docente que quisiera su propio
   * Genially tenía que pedírselo a otra persona.
   *
   * 🔴 Y la distinción importa: aquí se toca SU panel, no el del grupo. El del grupo lo comparten
   * todos y cambiarlo afecta al alumnado de sus compañeros; el suyo solo lo ven los suyos. Por eso
   * esta pestaña la ve todo el mundo y la de Ajustes no.
   */
  /**
   * Las casillas de la sesión, una por sección y con su captura (Norberto, 19-sep: «añade capturas de cada diapositiva…
   * si no, no sabe lo que es cada cosa»). Las que dependen de que haya algo (una batalla, una votación, una oferta) no
   * tienen captura fija: van con su icono y cuándo salen.
   */
  var SIN_CAPTURA = { simulador: ["diana", "Sale cuando alguien ha jugado al Simulador"], votacion: ["rayo", "Sale si hay una votación esta semana"],
                      oferta: ["monedas", "Sale si hay oferta en el Mercado"], unete: ["gente", "Sale en las semanas 1 y 2: el código y la invitación"] };
  function casillasSesion(off) {
    var hay = window.SG_CAPTURAS_SESION || [];
    return '<div class="m-secciones">' + (window.SG_SECCIONES_SESION || []).map(function (x) {
      var k = x[0], sc = SIN_CAPTURA[k] || ["video", "Sale cuando esa semana tiene algo que enseñar"];
      return '<label class="m-sec"><input type="checkbox" data-sec="' + esc(k) + '"' + (off.indexOf(k) < 0 ? " checked" : "") + '>' +
        (hay.indexOf(k) >= 0 ? '<img class="m-sec-img" src="assets/img/sesion/' + esc(k) + '.jpg" alt="" loading="lazy" width="480" height="270">'
                             : '<span class="m-sec-img sin">' + ico(sc[0]) + '<small>' + esc(sc[1]) + '</small></span>') +
        '<span><b>' + esc(x[1]) + '</b><em>' + esc(x[2]) + '</em></span></label>'; }).join("") + '</div>';
  }
  /** «Tu sesión en directo»: una casilla por sección, todas marcadas por defecto (la ventana de la rueda). */
  function bloqueSesion(t, nombre) {
    var offMio = ((t.sesiones || {})[nombre]) || [];
    return '<div class="card m-sesion"><h3>Tu sesión en directo</h3>' +
      '<p class="small muted">Marca lo que quieres en tu presentación. Por defecto sale todo; lo que quites tampoco lo ve tu alumnado cuando te sigue. ' +
      'Cada semana solo aparece lo que ese día tiene algo que enseñar.</p>' +
      casillasSesion(offMio) +
      '<p class="small m-sec-msg" id="m-sec-msg" aria-live="polite"></p></div>';
  }
  /**
   * 19-sep · LA RUEDA DE «CONFIGURAR LA SESIÓN». Norberto: «pon un botón de configurar sesión en vivo, algo intuitivo, icono
   * de rueda dentada… Simpleza, pero potencia de personalización». Una ventana encima, con una casilla por sección
   * (todas marcadas por defecto) y un «Todo» para volver a empezar. Se guarda al tocarla, en ESE grupo.
   */
  function abrirCfgSesion(per) {
    var p = PERS.filter(function (x) { return x.id === per; })[0] || {};
    var nombre = p.miNombre || miNombreEn(p);
    var dentro = per === PER && DATOS;
    var ses = (dentro ? ((window.SG.TABLERO.tablero(DATOS, true) || {}).sesiones) : ((p.stargate || {}).sesiones)) || {};
    var t = { sesiones: ses };
    var capa = document.createElement("div");
    capa.className = "cfg-capa"; capa.setAttribute("role", "dialog"); capa.setAttribute("aria-modal", "true");
    capa.innerHTML = '<div class="cfg-caja">' +
      '<div class="cfg-cab">' + ico("ajustes", "grande") + '<div><b>Configurar la sesión</b><span>' + esc(p.nombre || per) + '</span></div>' +
        '<button type="button" class="btn min" data-cfg-x>Cerrar</button></div>' +
      (nombre ? bloqueSesion(t, nombre) + '<p class="cfg-pie"><button type="button" class="btn min" data-cfg-todo>Marcar todo</button> ' +
                  '<a class="btn min" href="sesion.html?per=' + encodeURIComponent(per) + '" target="_blank" rel="noopener">Ver la sesión ↗</a></p>'
             : '<p class="muted">No te encuentro en el equipo docente de este grupo con <b>' + esc((YO && YO.correo) || "") + '</b>.</p>') +
      '</div>';
    document.body.appendChild(capa);
    var cerrar = function () { capa.remove(); document.removeEventListener("keydown", tecla); };
    var tecla = function (e) { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", tecla);
    capa.addEventListener("click", function (e) { if (e.target === capa || e.target.closest("[data-cfg-x]")) cerrar(); });
    var cajas = function () { return Array.prototype.slice.call(capa.querySelectorAll(".m-sec input")); };
    var guardar = async function (revertir) {
      var off = cajas().filter(function (x) { return !x.checked; }).map(function (x) { return x.getAttribute("data-sec"); });
      var msg = capa.querySelector("#m-sec-msg"); msg.textContent = "Guardando…";
      try {
        await guardarParteEn(per, "sesiones", nombre, off);
        p.stargate = p.stargate || {}; p.stargate.sesiones = p.stargate.sesiones || {};
        if (off.length) p.stargate.sesiones[nombre] = off; else delete p.stargate.sesiones[nombre];
        if (dentro && DATOS.proyecto) { var S = DATOS.proyecto.stargate = DATOS.proyecto.stargate || {}; S.sesiones = Object.assign({}, p.stargate.sesiones); }
        msg.textContent = "✓ Guardado" + (off.length ? " · quitas " + off.length + (off.length === 1 ? " sección" : " secciones") : " · sale todo");
      } catch (e) { if (revertir) revertir(); msg.textContent = "No se ha podido guardar: " + (e.message || e); }
    };
    cajas().forEach(function (c) { c.onchange = function () { guardar(function () { c.checked = !c.checked; }); }; });
    var todo = capa.querySelector("[data-cfg-todo]");
    if (todo) todo.onclick = function () { cajas().forEach(function (c) { c.checked = true; }); guardar(); };
    var primera = capa.querySelector(".m-sec input"); if (primera) primera.focus();
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-cfg-sesion]");
    if (!b) return;
    e.preventDefault(); abrirCfgSesion(b.getAttribute("data-cfg-sesion"));
  });

  /**
   * 🔴 19-sep · GESTIONAR GRUPOS (gestion.html), SOLO REFERENTES. Norberto: «para gestionar grupos enteros (solo el
   * referente) debería haber una página dedicada. Solo desde esa página se pueden crear, borrar o gestionar (añadir
   * estudiantes, profes, graduar, cambiar a un estudiante de grupo…). No hace falta meter ruido en las fichas». Con el
   * borrador dibujado eligió qué se muda aquí: el equipo docente, los escuadrones, los ajustes del grupo y editar el
   * calendario (verlo sigue en la Nave, para todos). Es la misma consola en su otro modo (`GESTION`): las pantallas de
   * siempre (verEquipo, verEscuadrones, verAjustes, verCalendario, la ficha de cada recluta) se pintan dentro del grupo
   * que abres en la tabla.
   *   · Graduar y archivar: la marca `stargate.archivado`, que ya entendía toda la web (estadoDelPER → «pasado»). No se
   *     borra nada, el alumnado sigue entrando a su Nave y se reabre con otro clic.
   *   · Borrar para siempre: la función de siempre (deleteProject), escribiendo el nombre. De quien lo creó o un vitalicio.
   *   · Cambiar a un recluta de grupo: en su ficha (stargateAlumno, acción «mover»); se lleva todo lo suyo.
   */
  var AVISO_GESTION = "";
  function puedeBorrarP(p) {
    var u = YO || {};
    if (!p || Number(((p.stargate || {}).demoSemana) || 0) > 0) return false;
    return !!u.uid && (p.ownerId === u.uid || p.teacherId === u.uid || esVitalicio());   // (quien lo creó, o un vitalicio)
  }
  var GTABS = [["alumnado", "Alumnado", "assets/img/nave/iconos/gente.png"], ["equipo", "Equipo docente", "assets/img/iconos/estrella.png"],
               ["escuadrones", "Escuadrones", "assets/img/iconos/escudo.png"], ["ajustes", "Ajustes del grupo", "assets/img/iconos/ajustes.png"],
               ["calendario", "Calendario", "assets/img/iconos/calendario.png"], ["cerrar", "Cerrar el curso", "assets/img/iconos/medalla.png"]];
  var FILTRO_G = "todos";
  function gruposGestion() { return PERS.filter(function (p) { return refDe(p) || puedeBorrarP(p); }); }
  function estadoG(p) { return (p.stargate || {}).archivado ? "archivado" : p.estado === "pasado" ? "terminado" : p.estado; }
  function verGestion() {
    document.body.classList.add("consola-dentro");
    if (!soyRefAlguno()) {
      app.innerHTML = '<div class="card"><h3>Gestionar grupos es del referente</h3><p>Crear, graduar o borrar grupos, el equipo docente y mover reclutas lo hace tu profe referente. ' +
        'Lo tuyo está en <a href="consola.html">tu Nave</a>.</p></div>';
      return;
    }
    if (GTABS.every(function (x) { return x[0] !== TAB; })) TAB = "alumnado";
    var per = url.get("per");
    if (per && gruposGestion().some(function (p) { return p.id === per; })) return abrirG(per);
    PER = null; DATOS = null; pintarGestion();
  }
  async function abrirG(per) {
    if (PER === per && DATOS) { PER = null; DATOS = null; history.replaceState(null, "", "gestion.html"); return pintarGestion(); }
    PER = per; DATOS = null; history.replaceState(null, "", "gestion.html?per=" + encodeURIComponent(per));
    pintarGestion();
    try { DATOS = await MOTOR.leerPER(per, true); } catch (e) { return fallo("No he podido leer el grupo: " + e.message); }
    if (PER === per) pintarGestion();
  }
  function pintarGestion() {
    var G = gruposGestion(), cuenta = { todos: G.length };
    G.forEach(function (p) { var e = estadoG(p); cuenta[e] = (cuenta[e] || 0) + 1; });
    var FIL = [["todos", "Todos"], ["en marcha", "En marcha"], ["por empezar", "Por empezar"], ["terminado", "Terminados"], ["archivado", "Archivados"]];
    var fila = function (p) {
      var e = emblemaDe(p), est = estadoG(p), abierto = p.id === PER;
      var estTxt = est === "en marcha" ? "Semana " + p.semana + " de " + p.total : est === "por empezar" ? "Empieza el " + ((p.stargate || {}).inicio ? diaC(p.stargate.inicio) : "—")
                 : est === "terminado" ? "Terminado" : est === "archivado" ? "Archivado" : "Sin fecha";
      var eq = (p.equipo || []).map(function (d) { return esc(d.nombre || d.correo) + (d.rol === "referente" ? " (ref.)" : ""); }).join(" · ");
      return '<div class="gs-fila' + (abierto ? " on" : "") + '">' +
          '<div class="gs-g">' + (e.img ? '<img src="' + esc(e.img) + '" alt="" loading="lazy">' : '<span class="cn-g-sin">◈</span>') +
            '<span><b>' + esc(p.nombre) + '</b><em>' + esc(((p.stargate || {}).tipo || "REGULAR") === "PUA" ? "PUA" : "Regular") + '</em></span></div>' +
          '<span class="gs-est ' + est.replace(/\s/g, "-") + '">' + esc(estTxt) + '</span>' +
          '<span class="gs-n">' + (p.reclutas == null ? "—" : p.reclutas) + '<em> reclutas</em></span>' +
          '<span class="gs-eq">' + (eq || "—") + '</span>' +
          '<span class="gs-b"><a class="btn min" href="consola.html?per=' + esc(p.id) + '" title="Abrirlo en tu Nave">Abrir ↗</a>' +
            '<button type="button" class="btn min' + (abierto ? " primary" : "") + '" data-gabrir="' + esc(p.id) + '" aria-expanded="' + abierto + '">Gestionar ' + (abierto ? "▴" : "▾") + '</button></span>' +
        '</div>' +
        (abierto ? '<div class="gs-panel">' + (DATOS
          ? '<div class="cn-secs gs-tabs" role="tablist">' + GTABS.map(function (x) {
              return '<button type="button" class="pest cn-t' + (TAB === x[0] ? " activa" : "") + '" data-tab="' + x[0] + '"><img class="i" src="' + x[2] + '" alt="" width="30" height="30" aria-hidden="true"><b>' + x[1] + '</b></button>'; }).join("") + '</div>' +
            '<div id="c-aviso" class="aviso" hidden></div><div id="c-cuerpo"></div>'
          : '<p class="muted">Leyendo el grupo…</p>') + '</div>' : '');
    };
    var vis = G.filter(function (p) { return FILTRO_G === "todos" || estadoG(p) === FILTRO_G; });
    app.innerHTML = avisoBorrado() +
      '<div class="card gs-cab">' + ico("ajustes", "grande") + '<div class="gs-cab-t"><div class="eyebrow amber">Solo referentes</div><h2>Gestionar grupos</h2>' +
        '<p class="small muted">Lo que se hace una o dos veces por curso: crear, el equipo docente, los escuadrones, los ajustes y el calendario de cada grupo, mover reclutas, graduar y borrar. Nada de esto sale en tu Nave.</p></div>' +
        '<a class="btn primary" href="crear.html">+ Crear un grupo</a></div>' +
      /**
       * 🔴 20-sep · LA PRESENTACIÓN PARA EL EQUIPO, AQUÍ. Norberto: «esta presentación está disponible si eres
       * profe referente. Piensa dónde colocarla en su Nave del Comandante». Va en «Gestionar grupos» y no en la
       * Nave por una razón: la Nave es POR GRUPO y esto no es de ningún grupo — es del equipo, y se hace una vez
       * por curso, que es exactamente lo que esta página reúne. Además, solo la ve el referente, que es quien
       * convoca la reunión.
       */
      '<div class="card gs-prestreno">' + ico("brujula", "grande") +
        '<div class="gs-pr-t"><div class="eyebrow amber">Antes de empezar el curso</div><h3>Presentar STARGATE al equipo</h3>' +
        '<p>La reunión de arranque, montada para proyectar: la historia, el temario planeta a planeta, las semanas, ' +
        'cómo se gana y qué tiene que hacer el docente. Para quien va a dar la asignatura por primera vez.</p></div>' +
        '<div class="gs-pr-b"><a class="btn primary" href="prestreno.html" target="_blank" rel="noopener">' + ico("cohete") + ' Abrir la presentación ↗</a>' +
        botonVentana("prestreno.html", "prestreno", "la presentación") + '</div></div>' +
      '<div class="gs-filtros" role="group" aria-label="Qué grupos">' + FIL.filter(function (x) { return x[0] === "todos" || cuenta[x[0]]; }).map(function (x) {
        return '<button type="button" class="chip' + (FILTRO_G === x[0] ? " on" : "") + '" data-gfiltro="' + x[0] + '" aria-pressed="' + (FILTRO_G === x[0]) + '">' + x[1] + ' · ' + (cuenta[x[0]] || 0) + '</button>'; }).join("") + '</div>' +
      '<div class="gs-tabla">' + (vis.length ? vis.map(fila).join("") : '<p class="muted">Ningún grupo aquí.</p>') + '</div>';
    Array.prototype.forEach.call(app.querySelectorAll("[data-gfiltro]"), function (b) { b.onclick = function () { FILTRO_G = b.getAttribute("data-gfiltro"); pintarGestion(); }; });
    Array.prototype.forEach.call(app.querySelectorAll("[data-gabrir]"), function (b) { b.onclick = function () { abrirG(b.getAttribute("data-gabrir")); }; });
    Array.prototype.forEach.call(app.querySelectorAll(".gs-panel [data-tab]"), function (b) { b.onclick = function () { TAB = b.getAttribute("data-tab"); pintarGestion(); }; });
    cablearCopiar(app);
    if (PER && DATOS && $("#c-cuerpo")) {
      var t = window.SG.TABLERO.tablero(DATOS, true);
      if (GTABS.every(function (x) { return x[0] !== TAB; })) TAB = "alumnado";
      ({ alumnado: verAlumnado, equipo: verEquipo, escuadrones: verEscuadrones, ajustes: verAjustes, calendario: verCalendario, cerrar: verCerrar })[TAB](t);
    }
  }
  /** «Cerrar el curso»: graduar y archivar (o reabrir) y, para los de prueba, borrar. */
  function verCerrar(t) {
    var p = PERS.filter(function (x) { return x.id === PER; })[0] || {}, arch = !!((DATOS.proyecto || {}).stargate || {}).archivado, porFechas = p.estado === "pasado" && !arch;
    $("#c-cuerpo").innerHTML =
      (porFechas ? '<div class="card"><h3>' + ico("medalla") + ' Curso terminado</h3><p class="small muted">Terminó por fechas: ya está entre los terminados y no hace falta archivarlo.</p></div>'
        : '<div class="card gs-op"><h3>' + ico(arch ? "envivo" : "medalla") + ' ' + (arch ? "Reabrir el curso" : "Graduar y archivar") + '</h3>' +
            '<p class="small">' + (arch ? 'Vuelve a las Naves de su equipo docente, en marcha o terminado según sus fechas. Todo sigue como estaba.'
              : 'Al acabar el curso. Sale de las Naves de su equipo docente, del aula y de la llamada a filas. El alumnado sigue entrando a su Nave con todo lo que ganó. <b>No se borra nada</b> y se puede reabrir.') + '</p>' +
            '<p><button type="button" class="btn" id="gs-arch">' + (arch ? "Reabrir" : "Graduar y archivar") + '</button></p></div>') +
      tarjetaBorrar();
    cablearBorrar();
    var ba = $("#gs-arch");
    if (ba) ba.onclick = async function () {
      ba.disabled = true;
      try {
        await MOTOR.guardarAjustes(PER, { "stargate.archivado": arch ? false : Date.now() });
        AVISO_GESTION = '<div class="card borrado-ok"><p>' + ico(arch ? "envivo" : "medalla") + ' <b>«' + esc(p.nombre || PER) + '»</b> ' +
          (arch ? "reabierto." : "graduado y archivado. Lo encuentras en «Archivados».") + '</p></div>';
        PERS = await MOTOR.misPERs(YO.correo); DATOS = await MOTOR.leerPER(PER, true); pintarGestion();
      } catch (e) { ba.disabled = false; aviso("No se ha podido: " + (e.message || e)); }
    };
  }
  /** En la ficha de un recluta, dentro de «Gestionar grupos»: pasarlo a otro de tus grupos con todo lo suyo. */
  function moverDeGrupo(r) {
    var otros = PERS.filter(function (p) { return p.id !== PER && refDe(p) && p.estado !== "pasado"; });
    if (!otros.length || !r.ficha) return "";
    return '<p class="fi-mover"><label>' + ico("cohete") + ' Pasar a ' + esc(r.alias) + ' al grupo <select id="c-mover">' +
      otros.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.nombre) + '</option>'; }).join("") +
      '</select></label> <button type="button" class="btn min" id="c-mover-b">Cambiar de grupo</button> ' +
      '<span class="small muted">se lleva todo: xp, créditos, insignias, cromos y héroes.</span></p>';
  }
  /**
   * 19-sep · EL CÓDIGO DE CLASE, DENTRO DEL GRUPO. Norberto: «es algo que se usará solo el primer y segundo día, no merece
   * tener tantísimo espacio. Sería mejor que apareciera dentro del grupo, no en la previsualización». Una tira pequeña en la
   * cabecera de la portada: tapado hasta pulsar (esta pantalla se proyecta) y «Copiar invitación» con el enlace dentro.
   */
  function codigoClase(per, codigo) {
    if (!codigo) return "";
    return '<div class="pt-cod"><span>Código de clase</span><button type="button" class="gp-cod" data-cod="' + esc(codigo) + '" ' +
        'title="Pulsa para verlo (y otra vez para taparlo)" aria-label="Mostrar el código de clase">•••••• <em>Mostrar</em></button>' +
      '<button type="button" class="btn min" data-copiado="✓ Invitación copiada" data-copiar="' + esc(invitacion({ id: per, codigo: codigo })) + '" ' +
        'title="Copia un mensaje listo para pegar en el foro de la plataforma de UNIR o en un chat">' + ico("enlace") + ' Copiar invitación</button></div>';
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest(".gp-cod");
    if (!b) return;
    var ver = !b.classList.contains("visto");
    b.classList.toggle("visto", ver);
    b.innerHTML = ver ? esc(b.getAttribute("data-cod")) + ' <em>Tapar</em>' : '•••••• <em>Mostrar</em>';
    b.setAttribute("aria-label", ver ? "Tapar el código de clase" : "Mostrar el código de clase");
  });

  /**
   * 19-sep · LA PORTADA DEL GRUPO. Norberto: «el docente, cuando entra en su grupo, debería tener una página
   * prácticamente similar a la del estudiante, salvo que aparece su avatar… vídeo, mensaje del foro, panel de control,
   * con los botones para hacer cambios» y «debe ver de un vistazo el estado de su grupo: en qué semana estamos, qué vídeo
   * toca, qué retos están pendientes de esa semana, retos pasados con número de estudiantes que los han hecho y
   * porcentaje; accesos rápidos para proyectar la clase, llamar a filas y el aula (arriba, en todas las pestañas);
   * configurar la sesión (por defecto, todas las diapositivas); una caja de texto por si tiene algo pendiente».
   * Todo sale de lo que la consola ya tiene (el tablero del grupo y los datos de la semana): ni una lectura más, salvo
   * tu comandante y tus notas.
   */
  /**
   * 19-sep · NEBULA, EN LA PORTADA. Norberto: «mensajes de ánimo para el docente, con consejos para promover la
   * participación… insights de la última semana, activos, pasivos… un pequeño banner con la cara de NEBULA y el mensaje
   * con efecto máquina de escribir, justo encima de los insights». Se eligen por lo que ha pasado en SU gente; cada uno
   * con un consejo concreto y, si lo hay, un botón que lo hace.
   */
  function consejosNebula(o) {
    var L = [], N = o.gente.length, act = o.gente.filter(function (r) { return Number(r.xp7) > 0; }).length;
    var sil = o.gente.filter(function (r) { return !Number(r.xp7) && (r.hechos || []).length; });
    var sin = o.gente.filter(function (r) { return !(r.hechos || []).length; });
    var pct = N ? Math.round(act * 100 / N) : 0;
    var nom = function (A) { return A.slice(0, 3).map(function (r) { return r.alias; }).join(", ") + (A.length > 3 ? "…" : ""); };
    if (!N) L.push({ t: "Todavía no se ha alistado nadie. Copia la invitación (junto al nombre del grupo, aquí abajo) y pégala hoy en el foro: el primer día es cuando más gente se apunta." });
    if (o.cola) L.push({ t: "Tienes " + o.cola + (o.cola === 1 ? " subida de nota esperando" : " subidas de nota esperando") + " tu visto bueno. Resuélvelas pronto: quien pide nota está pendiente.", a: ["Ver la Cola de nota", "cola"] });
    if (sil.length) L.push({ t: (sil.length === 1 ? "Una persona lleva" : sil.length + " reclutas llevan") + " una semana en silencio (" + nom(sil) + "). Un mensaje personal funciona mejor que un aviso general: una línea basta.", a: ["Escribirles", "silencio"] });
    if (sin.length && N) L.push({ t: (sin.length === 1 ? "Una persona no ha" : sin.length + " no han") + " registrado aún su primer reto. El «Preséntate» (A0) es el más fácil: deja cinco minutos al final de la clase para hacerlo juntos.", a: ["Escribirles", "sin"] });
    var flojo = o.antes.filter(function (r) { return o.semanaDe(r) === o.sem - 1; }).map(function (r) {
      var h = o.gente.filter(function (x) { return (x.hechos || []).indexOf(r.id) >= 0; }).length; return { r: r, p: N ? Math.round(h * 100 / N) : 0 }; })
      .filter(function (x) { return x.p < 30; })[0];
    if (flojo && N) L.push({ t: "El reto " + flojo.r.id + " de la semana pasada solo lo ha hecho el " + flojo.p + " %. Enséñalo con su ejemplo en la sesión («Ver un ejemplo»): lo que se ve hecho, se hace." });
    if (N && pct >= 70) L.push({ t: "¡Menuda tripulación! El " + pct + " % se ha movido esta semana. Nómbralos en clase: el reconocimiento en público es el mejor combustible." });
    else if (N && pct >= 40) L.push({ t: "Media tripulación en marcha (" + act + " de " + N + "). Proyecta «Han movido ficha» al empezar la clase: ver a los compañeros tira de los demás." });
    else if (N) L.push({ t: "Semana tranquila: solo " + act + " de " + N + " se han movido. Propón un reto relámpago en clase, diez minutos en directo: romper el hielo juntos cuesta menos." });
    if (o.s && o.s.tema_n && o.semNuevoTema) L.push({ t: "Esta semana abrís " + o.s.tema + ". Pon su vídeo al principio y presenta la misión con calma: el primer reto del planeta marca el ritmo." });
    if (o.sem === o.total) L.push({ t: "Última semana del viaje. Recuérdales que el Mercado sigue abierto una semana más para canjear y que el diploma les espera en su Nave." });
    var gen = ["Abre la llamada a filas al empezar: fichar da créditos y un sobre de cromos, y es la costumbre que más engancha.",
               "Lanza una votación desde el aula: dos minutos, y participa hasta quien no quiere hablar en voz alta.",
               "Proyecta el ranking de la semana, no el general: cualquiera puede ganarlo, y eso anima a los que van por detrás.",
               "Usa el mensaje a tus reclutas para recordar lo que se cierra esta semana: una línea basta."];
    L.push({ t: gen[(o.sem || 0) % gen.length] });
    return L;
  }
  /**
   * 🔴 20-sep · NEBULA, COMO EL GLOBO DEL ONBOARDING. Norberto: «el consejo de NEBULA podría ser una ventana emergente o
   * algo como el mensaje del onboarding que aparece». Ocupaba media portada al lado de la ficha; ahora asoma abajo a la
   * derecha, se lee, se pide otro consejo y se cierra. Cerrarlo dura lo que dure la sesión del navegador: al día
   * siguiente vuelve a saludar, que es cuando el consejo sirve de algo.
   */
  /**
   * 🔴 20-sep · EL BOTÓN DE NEBULA, EN LA CAJA DE CIFRAS. Norberto: «¿cómo verías meter en esa misma caja un botón
   * relativamente grande con los consejos de NEBULA? Al hacer clic se amplía la caja por debajo y aparecen los
   * consejos, uno detrás de otro, con un botón de llamada a la acción si es necesario y otro de siguiente consejo.
   * Esto implica eliminar a NEBULA del desplegable de la parte inferior izquierda». Abierta o cerrada, se recuerda
   * mientras dure la sesión del navegador: quien la quiere abierta no la abre en cada pantalla.
   */
  function nebAbierta() { try { return sessionStorage.getItem("sgNebAbierta") === "1"; } catch (e) { return false; } }
  function cablearBotonNebula() {
    var b = document.getElementById("c-neb-b"), p = document.getElementById("c-neb-p");
    if (!b || !p) return;
    var pon = function (abrir) {
      p.hidden = !abrir; b.setAttribute("aria-expanded", String(abrir)); b.classList.toggle("on", abrir);
      try { sessionStorage.setItem("sgNebAbierta", abrir ? "1" : "0"); } catch (e) {}
    };
    b.onclick = function () { pon(p.hidden); };
    pon(nebAbierta());
  }
  function cablearNebula(consejos, alHacer) {
    var p = document.getElementById("pt-neb-p"), n = document.getElementById("pt-neb-n"), acc = document.getElementById("pt-neb-acc"), i = 0, tic = null;
    if (!p || !consejos.length) return;
    var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pon = function () {
      var c = consejos[i], txt = c.t, k = 0; clearInterval(tic);
      if (n) n.textContent = (i + 1) + "/" + consejos.length;
      var hace = c.a && (manual() || c.a[1] === "cola");
      acc.innerHTML = hace ? '<button type="button" class="btn min primary" data-neb="' + c.a[1] + '">' + esc(c.a[0]) + '</button>' : "";
      if (quieto) { p.textContent = txt; return; }
      p.textContent = ""; p.classList.add("escribe");
      tic = setInterval(function () {
        if (!document.body.contains(p)) return clearInterval(tic);
        k += 2; p.textContent = txt.slice(0, k);
        if (k >= txt.length) { clearInterval(tic); p.classList.remove("escribe"); }
      }, 22);
    };
    var otro = document.getElementById("pt-neb-otro"); if (otro) otro.onclick = function () { i = (i + 1) % consejos.length; pon(); };
    acc.onclick = function (e) { var b = e.target.closest("[data-neb]"); if (b) alHacer(b.getAttribute("data-neb")); };
    pon();
  }
  /**
   * El mensaje del foro: editarlo (y que valga para todos tus grupos), verlos todos y volver al oficial.
   * El oficial va firmado con tu nombre; el tuyo se guarda tal cual lo escribes.
   */
  function cablearForo(sem, texto, mio) {
    var ed = document.getElementById("ht-foro-ed"), caja = document.getElementById("ht-foro-caja");
    if (ed && caja) ed.onclick = function () {
      caja.hidden = !caja.hidden; ed.setAttribute("aria-expanded", String(!caja.hidden));
      if (!caja.hidden) document.getElementById("ht-foro-in").focus();
    };
    var msg = document.getElementById("ht-foro-msg");
    var guarda = function (v) {
      if (!MOTOR.guardarForo) return;
      msg.textContent = "Guardando…";
      MOTOR.guardarForo(sem, v).then(function (foros) {
        if (FICHA) FICHA.foros = foros;
        aviso(v ? "Guardado: este mensaje es el tuyo en todos tus grupos." : "Quitado: vuelve el mensaje oficial.", true);
        pintar();
      }, function (e) { msg.textContent = "No se ha podido guardar: " + (e.message || e); });
    };
    var ok = document.getElementById("ht-foro-ok"); if (ok) ok.onclick = function () { guarda(document.getElementById("ht-foro-in").value.trim()); };
    var of = document.getElementById("ht-foro-of"); if (of) of.onclick = function () { guarda(""); };
    // «Ver todos»: los de todas las semanas del curso, con el tuyo marcado, en una ventana
    var todos = document.getElementById("ht-foro-todos");
    if (todos) todos.onclick = function () {
      var SEMS = window.SG_SEMANAS || [], mios = (FICHA && FICHA.foros) || {}, yoN = miNombreAqui();
      var firma = function (txt) {
        if (!yoN) return String(txt || "");
        return String(txt || "").replace(/—\s*Capit[áa]n\b/g, "— " + (/^comandante\b/i.test(yoN) ? yoN : "Comandante " + yoN));
      };
      modalFicha('<div class="fi-cab"><h3>' + ico("mensaje") + ' Los mensajes del foro</h3>' +
          '<p class="small muted">Uno por semana, ya firmados por ti. Los que hayas escrito tú salen marcados y valen en todos tus grupos.</p>' +
          '<button type="button" class="c-modal-x" data-cerrar-ficha aria-label="Cerrar">✕</button></div>' +
        '<div class="foro-todos">' + SEMS.map(function (x) {
          var t = mios[String(x.sem)] || firma(x.foro || "");
          if (!t) return "";
          return '<details class="foro-una"' + (Number(x.sem) === Number(sem) ? " open" : "") + '><summary><b>Semana ' + x.sem + '</b> · ' + esc(x.tema) +
            (mios[String(x.sem)] ? ' <span class="ht-mio">tuyo</span>' : '') + '</summary>' +
            '<div class="foro-msg abierto">' + esc(t).replace(/\n/g, "<br>") + '</div>' +
            '<p><button type="button" class="btn min" data-copiado="✓ Copiado" data-copiar="' + esc(t) + '">Copiar</button></p></details>';
        }).join("") + '</div>');
    };
  }
  function semanaDeReto(r, tipo, mapa) {
    if (tipo === "PUA") return Number(r.tema || 0);          // en PUA, cada tema es su semana
    return Number(mapa[r.id] || ((window.SG_CATALOGO || {}).semanaDelTema || {})[String(r.tema)] || 0);
  }
  /* ── 🔴 20-sep · LA CAJA DE TICKETS DE SALIDA, EN LA NAVE ────────────────────────────────────────────────────────
   * Norberto: «añade una caja en la Nave de Comandante con Tickets de salida. Se puede elegir tickets anteriores para
   * ver respuestas, pero por defecto aparece el último lanzado: si estamos en el tema 5, saldrán resultados del tema 4.
   * Utiliza un botón de ocultar (no saldrá en la sesión en vivo) o fijar (saldrá seguro). Los no marcados saldrán los
   * que quepan en la diapositiva».
   *
   * Aquí se repasa con calma lo que escribió el alumnado y se decide qué se lee en clase; la sesión obedece esas
   * marcas (`sesion.js`, diapositiva «Vuestras dudas»). Las respuestas se piden con el lector común (`SG.TK`).
   */
  var TK_TEMA = null;          // qué tema se está mirando (null = el último cerrado)
  var TK_MARCAS = null;
  /** Los temas del curso con la semana en la que acaban: para el desplegable y para saber cuál fue el último. */
  function temasDelCurso(SEMS) {
    var out = [];
    SEMS.forEach(function (x, i) {
      var n = Number(x.tema_n) || 0, ya = out.filter(function (o) { return o.n === n; })[0];
      var nombre = String(x.tema || "").replace(/\s*\(cont\.\)/, "");
      if (ya) { ya.fin = i; ya.nombre = ya.nombre || nombre; } else out.push({ n: n, nombre: nombre, ini: i, fin: i });
    });
    return out;
  }
  function temaPorDefecto(temas, iAhora) {
    var previos = temas.filter(function (x) { return x.fin < iAhora; });
    return (previos.length ? previos[previos.length - 1] : temas[0]) || null;
  }
  function cajaTickets(SEMS, iAhora) {
    if (!window.SG_TICKETS_API || !PER) return "";
    var temas = temasDelCurso(SEMS), suyo = TK_TEMA != null ? temas.filter(function (x) { return x.n === TK_TEMA; })[0] : null;
    var elegido = suyo || temaPorDefecto(temas, iAhora); if (!elegido) return "";
    return '<details class="card pt-tk pt-plega"' + (TK_TEMA != null ? " open" : "") + '><summary>' +
        '<span class="pt-plega-t">' + ico("ticket") + ' Tickets de salida</span>' +
        '<span class="small muted" id="tk-resumen">' + esc(elegido.nombre) + ' · el último que cerrasteis</span></summary>' +
      '<p class="small muted">Lo que escribieron al acabar el tema. Elige qué se lee en clase: lo que <b>fijes</b> sale seguro en la sesión, lo que <b>ocultes</b> no sale, y del resto salen los que quepan.</p>' +
      '<label class="tk-sel">De qué tema <select id="tk-tema">' + temas.map(function (x) {
        return '<option value="' + x.n + '"' + (x.n === elegido.n ? " selected" : "") + '>' + esc(x.nombre) + '</option>'; }).join("") + '</select></label>' +
      '<div id="tk-caja"><p class="small muted">Leyendo las respuestas…</p></div></details>';
  }
  function pintarCajaTickets(SEMS, iAhora) {
    var caja = document.getElementById("tk-caja"); if (!caja || !window.SG || !SG.TK) return;
    var temas = temasDelCurso(SEMS), suyo = TK_TEMA != null ? temas.filter(function (x) { return x.n === TK_TEMA; })[0] : null;
    var elegido = suyo || temaPorDefecto(temas, iAhora); if (!elegido) return;
    var sel = document.getElementById("tk-tema");
    if (sel) sel.onchange = function () { TK_TEMA = Number(sel.value); pintar(); };
    var yoN = miNombreAqui(), perAqui = PER;
    Promise.all([SG.TK.pedir(PER), (MOTOR.marcasTicket ? MOTOR.marcasTicket(PER) : Promise.resolve(null))])
      .then(function (r) {
        if (PER !== perAqui) return;
        var d = r[0]; TK_MARCAS = r[1] || { fijadas: [], ocultas: [] };
        if (d.error) { caja.innerHTML = '<p class="small muted">No he podido leer las respuestas ahora mismo' + (d.motivo ? ' (' + esc(d.motivo) + ')' : "") + '. Vuelve a entrar en un rato.</p>'; return; }
        var filas = SG.TK.deTema(d.lista, SEMS, elegido.fin, yoN);
        var res = document.getElementById("tk-resumen");
        if (res) res.textContent = elegido.nombre + " · " + (filas.length ? filas.length + (filas.length === 1 ? " respuesta" : " respuestas") : "sin respuestas");
        if (!filas.length) { caja.innerHTML = '<p class="small muted">Nadie de tu escuadrón rellenó el ticket de <b>' + esc(elegido.nombre) + '</b>.</p>'; return; }
        var A = SG.TK.analizar(filas), seg = A.seguido, sig = seg.directo + seg.diferido;
        var m = TK_MARCAS;
        caja.innerHTML = '<div class="tk-cifras chicas"><div class="tk-c"><b>' + filas.length + '</b><span>' + (filas.length === 1 ? "respuesta" : "respuestas") + '</span></div>' +
            (sig ? '<div class="tk-c"><b>' + Math.round(seg.directo * 100 / sig) + '%</b><span>en directo</span></div>' : "") +
            (A.notas.length ? '<div class="tk-c"><b>' + (A.notas.reduce(function (a, x) { return a + x.media; }, 0) / A.notas.length).toFixed(1) + '</b><span>de media, en todo</span></div>' : "") + '</div>' +
          (A.notas.length ? '<div class="tk-notas">' + A.notas.map(function (x) {
            return '<div class="tk-nota"><span class="tk-n-t">' + esc(x.corto) + '</span><span class="tk-n-b">' + x.pct.map(function (p, i) {
                return p ? '<i class="v' + (i + 1) + '" style="width:' + p + '%" title="' + (i + 1) + ' de 5 · ' + p + '%">' + (p >= 12 ? '<em>' + p + '%</em>' : "") + '</i>' : ""; }).join("") +
              '</span><b class="tk-n-m">' + x.media.toFixed(1) + '</b></div>'; }).join("") + '</div>' : "") +
          (A.textos.length ? '<div class="tk-lista">' + A.textos.map(function (x) {
            var fija = m.fijadas.indexOf(x.id) >= 0, oculta = m.ocultas.indexOf(x.id) >= 0;
            return '<div class="tk-uno' + (fija ? " fija" : "") + (oculta ? " oculta" : "") + '" data-tk="' + esc(x.id) + '">' +
              '<span class="tk-de">' + esc(SG.TK.corto(x.c)) + '</span><p>' + esc(x.v) + '</p>' +
              '<span class="tk-b"><button type="button" class="btn min" data-tkm="fija" aria-pressed="' + fija + '">' + ico("estrella") + ' ' + (fija ? "Fijada" : "Fijar") + '</button>' +
                '<button type="button" class="btn min" data-tkm="oculta" aria-pressed="' + oculta + '">' + ico("ojo") + ' ' + (oculta ? "Oculta" : "Ocultar") + '</button></span></div>'; }).join("") + '</div>'
            : '<p class="small muted">Puntuaron, pero no escribió nadie.</p>');
        caja.onclick = function (ev) {
          var b = ev.target && ev.target.closest && ev.target.closest("[data-tkm]"); if (!b) return;
          var fila = b.closest("[data-tk]"), id = fila.getAttribute("data-tk"), que = b.getAttribute("data-tkm");
          var tenia = b.getAttribute("aria-pressed") === "true";
          Array.prototype.forEach.call(fila.querySelectorAll("[data-tkm]"), function (x) { x.disabled = true; });
          MOTOR.marcarTicket(PER, id, tenia ? "" : que).then(function (nuevas) {
            TK_MARCAS = nuevas; pintarCajaTickets(SEMS, iAhora);
          }, function (e) { aviso("No se ha podido guardar: " + (e.message || e)); pintarCajaTickets(SEMS, iAhora); });
        };
      }, function () { caja.innerHTML = '<p class="small muted">No he podido leer las respuestas ahora mismo.</p>'; });
  }

  function verPortada(t) {
    var sem = Number(t.semana) || 0, total = Number(t.semanas) || 15, tipo = t.tipo === "PUA" ? "PUA" : "REGULAR";
    var SEMS = window.SG_SEMANAS || [];
    var s = sem >= 1 ? (tipo === "PUA" ? SEMS.filter(function (x) { return x.tema_n === Math.min(sem, 8); })[0]
                                        : SEMS[Math.min(sem, SEMS.length) - 1]) : null;
    var mapa = ((window.SG_SEM_RETO || {})[tipo]) || {};
    var cat = ((((window.SG_CATALOGO || {}).retos) || {})[tipo]) || [];
    var yoN = miNombreAqui();
    var mia = yoN ? t.reclutas.filter(function (r) { return r.profe === yoN; }) : [];
    var gente = mia.length ? mia : t.reclutas, N = gente.length;
    var deQuien = mia.length ? "de tus " + N + " reclutas" : "del grupo · " + N + (N === 1 ? " recluta" : " reclutas");
    var hechoPor = function (id) { return gente.filter(function (r) { return (r.hechos || []).indexOf(id) >= 0; }).length; };
    var fila = function (r) {
      var n = hechoPor(r.id), pct = N ? Math.round(n * 100 / N) : 0, w = semanaDeReto(r, tipo, mapa);
      return '<li class="pt-reto' + (pct >= 75 ? " alto" : pct < 25 ? " bajo" : "") + '"><span class="pt-id">' + esc(r.id) + '</span>' +
        '<span class="pt-tit">' + esc(r.titulo) + '<em>semana ' + w + '</em></span>' +
        '<span class="pt-barra" aria-hidden="true"><i style="width:' + pct + '%"></i></span>' +
        '<span class="pt-n"><b>' + n + '</b>/' + N + ' · ' + pct + ' %</span></li>';
    };
    var lanzados = cat.filter(function (r) { var w = semanaDeReto(r, tipo, mapa); return w && sem && w <= sem; });
    var estos = lanzados.filter(function (r) { return semanaDeReto(r, tipo, mapa) === sem; });
    var antes = lanzados.filter(function (r) { return semanaDeReto(r, tipo, mapa) < sem; })
                        .sort(function (a, b) { return semanaDeReto(b, tipo, mapa) - semanaDeReto(a, tipo, mapa); });
    var luego = cat.filter(function (r) { return semanaDeReto(r, tipo, mapa) === sem + 1; });
    var firma = function (txt) {
      if (!yoN) return String(txt || "");
      return String(txt || "").replace(/—\s*Capit[áa]n\b/g, "— " + (/^comandante\b/i.test(yoN) ? yoN : "Comandante " + yoN));
    };
    var foro = s && s.foro ? firma(s.foro) : "";
    var propio = ((t.paneles || {})[yoN]) || "", panelMio = propio || t.panel || window.SG_PANEL_MAESTRO || "";
    var conUid = gente.filter(function (r) { return !!r.uid; });
    var DEST = { todos: conUid, silencio: conUid.filter(function (r) { return !Number(r.xp7) && (r.hechos || []).length; }),
                 sin: conUid.filter(function (r) { return !(r.hechos || []).length; }) };
    var destino = "todos";
    var vids = (s && s.videos) || [];
    var estado = sem < 1 ? "Aún no ha empezado" : sem > total ? "Curso terminado" : "Semana " + sem + " de " + total;
    var sAnt = sem >= 2 ? (tipo === "PUA" ? null : SEMS[Math.min(sem - 1, SEMS.length) - 1]) : null;
    var consejos = consejosNebula({ gente: gente, sem: sem, total: total, s: s, antes: antes, cola: (function () { try { return pendientesCola(); } catch (e) { return 0; } })(),
      semNuevoTema: !!(s && (!sAnt || sAnt.tema_n !== s.tema_n)), semanaDe: function (r) { return semanaDeReto(r, tipo, mapa); } });

    // 20-sep · la cabecera del grupo se fue al banner (`bannerGrupo`), y el código de clase a «Reclutas»: Norberto,
    // «código de clase y copiar invitación muévelo a Mi gente; el espacio que libera, para el botón de empezar clase».
    // 🔴 20-sep · el mensaje del foro: el TUYO si lo has escrito (vale para todos tus grupos), si no el oficial firmado
    var mioForo = ((FICHA && FICHA.foros) || {})[String(sem)] || "";
    var foroTxt = mioForo || foro;
    // 🔴 20-sep (tarde) · Norberto: «pon el panel de control embebido justo debajo» del banner. Es lo primero que se
    // abre al empezar la clase —el Genially que su alumnado tiene delante—, así que abre el Puente; las cifras, «Hoy
    // toca» y lo demás van después.
    $("#c-cuerpo").innerHTML = '<div class="pt">' +
      // 🔴 20-sep · «embebe el panel de control del grupo actual en "Mi nave" del comandante. Añade un botón para cambiar
      // enlace»: el Genially que abre su alumnado, aquí mismo, sin salir a otra pestaña.
      '<div class="card pt-panel"><div class="pt-panel-cab"><h3>' + ico("enlace") + ' Tu panel de control</h3>' +
          '<span class="pt-fila">' + (panelMio ? '<a class="btn min" href="' + esc(panelMio) + '" target="_blank" rel="noopener">Abrir ↗</a> ' : '') +
            '<button type="button" class="btn min" id="pt-panel-ed" data-av aria-expanded="false">' + ico("editar") + ' Cambiar el enlace</button></span></div>' +
          '<p class="small muted">El Genially que abre <b>tu</b> alumnado desde su Nave. Ahora usan ' + (propio ? '<b>el tuyo</b>.' : 'el <b>oficial</b> del grupo.') + '</p>' +
          (panelMio ? '<div class="pt-panel-marco"><iframe src="' + esc(panelMio) + '" title="Tu panel de control" loading="lazy" allowfullscreen allow="fullscreen"></iframe></div>'
                    : '<p class="small muted">Todavía no hay ningún panel puesto.</p>') +
          '<div id="pt-panel-caja" hidden><label>Tu Genially<input id="pt-panel-in" value="' + esc(propio) + '" placeholder="https://view.genially.com/…" autocomplete="off"></label>' +
            '<p class="pt-fila"><button type="button" class="btn primary" id="pt-panel-ok">Guardar para mis reclutas</button>' +
            (propio ? ' <button type="button" class="btn min" id="pt-panel-of">Volver al oficial</button>' : '') + '</p>' +
            '<p class="small m-sec-msg" id="pt-panel-msg" aria-live="polite"></p></div></div>' +
      resumenGrupo(t, gente, { lanzados: lanzados.length, retosSem: estos, consejos: consejos }) +
      (!s ? '<div class="card"><p class="muted">' + (sem < 1 ? 'El curso empieza el <b>' + esc(t.inicio || "—") + '</b>: aquí verás cada semana lo que toca.' : 'Sin semana que enseñar.') + '</p></div>' :
        '<div class="card pt-hoy">' + bloqueHoyToca((DATOS.proyecto || {}).stargate || {}, sem, total, gente, bloqueForo(sem, foroTxt, !!mioForo, (t.escuadrones || []).filter(function (e) { return e.comandante === yoN; })[0])) + '</div>') +
      cajaTickets(SEMS, Math.max(0, Math.min(sem, SEMS.length) - 1)) +
      (antes.length ? '<details class="card pt-ant pt-plega"><summary><span class="pt-plega-t">' + ico("retos") + ' Retos ya lanzados</span>' +
        '<span class="small muted">' + antes.length + ' en marcha · cuántos los han registrado</span></summary>' +
        '<p class="small muted">Cuántos los han registrado, ' + esc(deQuien) + '. En ámbar, los que van por debajo del 25 %.</p>' +
        '<ul class="pt-retos">' + antes.map(fila).join("") + '</ul></details>' : '') +
      '<div class="pt-uno">' +
        // 19-sep · «opción de mandar un mensaje a los estudiantes: les aparecerá en su tablón la próxima vez que se conecten»
        '<details class="card pt-msg pt-plega" data-av><summary><span class="pt-plega-t">' + ico("mensaje") + ' Mensaje a tus reclutas</span>' +
          '<span class="small muted">les sale en su Nave, al momento</span></summary>' +
          '<p class="small muted">Les sale arriba en su Nave —al momento si están dentro, o la próxima vez que entren— hasta que lo marcan como leído. Va ' + esc(deQuien) + '.</p>' +
          '<div class="pt-seg" role="group" aria-label="A quién">' +
            [["todos", "Todos"], ["silencio", "En silencio"], ["sin", "Sin estrenarse"]].filter(function (x) { return x[0] === "todos" || DEST[x[0]].length; }).map(function (x) {
              return '<button type="button" data-dest="' + x[0] + '" aria-pressed="' + (x[0] === "todos") + '"' + (x[0] === "todos" ? ' class="on"' : '') + '>' + x[1] + ' · ' + DEST[x[0]].length + '</button>'; }).join("") + '</div>' +
          '<textarea id="pt-msg-txt" rows="3" maxlength="400" placeholder="Por ejemplo: el jueves repasamos el reto B2; traed la Bitácora al día."></textarea>' +
          '<p class="pt-fila pt-msg-pie"><span class="small muted" id="pt-msg-n">0/400</span>' +
            '<button type="button" class="btn primary" id="pt-msg-ok" disabled>Enviar a ' + conUid.length + (conUid.length === 1 ? " recluta" : " reclutas") + '</button></p>' +
          '<p class="small m-sec-msg" id="pt-msg-res" aria-live="polite"></p></details>' +
      '</div>' +
    '</div>';

    // 🔴 20-sep · NEBULA vive DENTRO de la caja de cifras: su botón abre los consejos ahí mismo
    cablearBotonNebula();
    cablearForo(sem, foroTxt, mioForo);
    pintarCajaTickets(SEMS, Math.max(0, Math.min(sem, SEMS.length) - 1));
    Array.prototype.forEach.call(document.querySelectorAll("#consola-app [data-tab-ir]"), function (b) {
      b.onclick = function () { TAB = b.getAttribute("data-tab-ir"); pintar(); };
    });
    if (MOTOR.miFichaDocente) MOTOR.miFichaDocente().then(function (f) {
      var im = $("#pt-ava"); if (im && f && f.avatar) im.src = "assets/img/avatares/comandantes/" + f.avatar + ".jpg";
    }).catch(function () {});
    // el enlace del panel, aquí mismo
    var pEd = $("#pt-panel-ed"), pCaja = $("#pt-panel-caja"), pMsg = $("#pt-panel-msg");
    if (pEd && pCaja) pEd.onclick = function () { pCaja.hidden = !pCaja.hidden; pEd.setAttribute("aria-expanded", String(!pCaja.hidden)); if (!pCaja.hidden) $("#pt-panel-in").focus(); };
    var guardaPanel = async function (v) {
      if (v && !/^https:\/\/\S+\.\S+/i.test(v)) { pMsg.textContent = "Tiene que ser una dirección que empiece por https://"; return; }
      pMsg.textContent = "Guardando…";
      try { await guardarMiParte("paneles", yoN, v); await refrescar();
            aviso(v ? "Guardado: tu alumnado abrirá tu panel." : "Quitado: tu alumnado vuelve al panel oficial.", true); }
      catch (e) { pMsg.textContent = "No se ha podido guardar: " + (e.message || e); }
    };
    if ($("#pt-panel-ok")) $("#pt-panel-ok").onclick = function () { guardaPanel($("#pt-panel-in").value.trim()); };
    if ($("#pt-panel-of")) $("#pt-panel-of").onclick = function () { guardaPanel(""); };
    // el mensaje a tus reclutas: uno a cada uno, con el mismo buzón que «validar/anular un reto»
    var mTxt = $("#pt-msg-txt"), mOk = $("#pt-msg-ok"), mN = $("#pt-msg-n"), mRes = $("#pt-msg-res");
    var ponDestino = function (a) {
      if (!DEST[a]) return; destino = a;
      Array.prototype.forEach.call(document.querySelectorAll("#c-cuerpo [data-dest]"), function (b) {
        var on = b.getAttribute("data-dest") === a; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
      if (mOk) { mOk.textContent = "Enviar a " + DEST[a].length + (DEST[a].length === 1 ? " recluta" : " reclutas"); mOk.disabled = !mTxt.value.trim() || !DEST[a].length; }
    };
    Array.prototype.forEach.call(document.querySelectorAll("#c-cuerpo [data-dest]"), function (b) { b.onclick = function () { ponDestino(b.getAttribute("data-dest")); }; });
    // «Escribirles» (en las cifras o en un consejo de NEBULA): elige a quién y lleva a la caja del mensaje
    var escribirA = function (a) { ponDestino(a); if (mTxt) { mTxt.scrollIntoView({ behavior: "smooth", block: "center" }); mTxt.focus(); } };
    Array.prototype.forEach.call(document.querySelectorAll("#consola-app [data-escribir]"), function (b) { b.onclick = function () { escribirA(b.getAttribute("data-escribir")); }; });
    cablearNebula(consejos, function (que) { if (que === "cola") { TAB = "canjes"; pintar(); } else escribirA(que); });
    if (mTxt && mOk) {
      mTxt.oninput = function () { mN.textContent = mTxt.value.length + "/400"; mOk.disabled = !mTxt.value.trim() || !DEST[destino].length; };
      mOk.onclick = async function () {
        var txt = mTxt.value.trim(), para = DEST[destino]; if (!txt || !para.length) return;
        if (!(await window.SG.preguntar({ titulo: "¿Enviar el mensaje a " + (para.length === 1 ? "1 recluta" : para.length + " reclutas") + "?", texto: txt, si: "Enviar" }))) return;
        mOk.disabled = true; var ok = 0, mal = 0, i = 0;
        var uno = async function () {
          while (i < para.length) { var r = para[i++];
            try { await MOTOR.avisarRecluta(PER, r.uid, { texto: txt, de: yoN, titulo: "Mensaje de tu Comandante" }); ok++; }
            catch (e) { mal++; }
            mRes.textContent = "Enviando… " + (ok + mal) + " de " + para.length; }
        };
        await Promise.all([uno(), uno(), uno(), uno()]);
        mRes.textContent = mal ? "Enviado a " + ok + " de " + para.length + " (" + mal + " no se han podido enviar: prueba otra vez)" : "✓ Enviado a " + ok + (ok === 1 ? " recluta" : " reclutas");
        if (!mal) { mTxt.value = ""; mN.textContent = "0/400"; } else mOk.disabled = false;
      };
    }
  }

  /**
   * 🔴 15-sep · LOS EMBEDS, UNA SOLA VEZ. Norberto: «en todas las fichas de cada grupo aparece Embed para Genially, pero
   * entiendo que es el mismo para todos: déjalo en algún lugar especificando que es el mismo para todos los grupos». Lo
   * es: ninguno lleva el grupo dentro (piden la cuenta y preguntan). Vivían en «Mis grupos»; desde el 19-sep, en «Enlaces».
   */
  function paraTusGeniallys() {
    return '<section class="card gp-gen"><div class="gp-gen-txt"><h3>Para tus Geniallys</h3>' +
      '<details class="gp-ayuda"><summary>¿Cómo se usan?</summary><p class="small muted">Los <b>mismos para todos tus grupos</b> y para los cursos que vengan: piden tu cuenta y, si llevas varios grupos, ' +
      'preguntan en cuál estáis. Se copia el código y, en Genially, <b>Insertar → Otros → Código</b>. ' +
      'O pulsa <b>⧉</b> y se abre <b>en su propia ventana</b>, sin nada más alrededor: para proyectarla o tenerla a mano durante la clase.</p></details></div>' +
      '<div class="gp-gen-b">' +
      // 16-sep · la sesión se pega DOS VECES en el Genially: la apertura antes de la teoría y el cierre después
      [["sesion-ap", ico("video") + " La sesión · 1 · apertura", "sesion.html?embed=1&tramo=apertura"],
       ["sesion-ci", ico("video") + " La sesión · 3 · cierre", "sesion.html?embed=1&tramo=cierre"],
       ["sesion", ico("video") + " La sesión entera (sin partir)", "sesion.html?embed=1"], ["aula", ico("envivo") + " Herramientas de clase (en directo)", "aula.html?embed=1"],
       ["llamada", ico("clase") + " La llamada a filas", "llamada.html?embed=1"], ["batalla", ico("diana") + " El Simulador de Joran", "batalla.html?embed=1"]].map(function (x) {
        var tit = x[1].replace(/^<img[^>]*>\s*/, "");
        return '<span class="gp-gen-par"><button class="btn min" data-embed="' + x[0] + '" data-copiado="✓ Código copiado" data-copiar="' + esc(codigoGenially(x[2], "STARGATE · " + tit)) + '">' + x[1] + '</button>' +
          botonVentana(x[2], x[0], tit) + '</span>';
      }).join("") + '</div></section>';
  }
  function verMios(t) {
    var yo = (t.docentes_full || []).filter(function (d) {
      return String(d.correo || "").toLowerCase() === String(YO.correo || "").toLowerCase(); })[0];
    if (!yo) {
      $("#c-cuerpo").innerHTML = '<div class="card"><h3>Enlaces</h3>' +
        '<p>No te encuentro en el equipo docente de este grupo con <b>' + esc(YO.correo) + '</b>, ' +
        'así que no sé cuál es tu sitio aquí.</p></div>';
      return;
    }
    var mio = (t.paneles || {})[yo.nombre] || "";
    var oficial = t.panel || "";
    // (19-sep · «Tu sesión en directo» ya no vive aquí: Norberto, «no tiene ningún sentido en Mis enlaces». Es la rueda
    // de al lado de «Empezar la clase»)
    $("#c-cuerpo").innerHTML = paraTusGeniallys() +
      '<div class="card"><h3>Tu panel de Genially</h3>' +
      '<p class="small muted">Es el que abre <b>tu</b> alumnado desde su Nave. Si lo dejas vacío, ' +
      'usan el panel oficial del grupo — que es lo normal: solo necesitas el tuyo si has duplicado ' +
      'el Genially para personalizarlo.</p>' +
      '<label>Tu Genially<input id="m-panel" value="' + esc(mio) + '" ' +
        'placeholder="https://view.genially.com/…" autocomplete="off"></label>' +
      '<p><button class="btn primary" id="m-guardar">Guardar</button> ' +
      (mio ? '<button class="btn min" id="m-quitar">Quitarlo y usar el oficial</button>' : '') + '</p>' +
      '<p class="small muted">Panel oficial del grupo: ' +
        (oficial ? '<a href="' + esc(oficial) + '" target="_blank" rel="noopener">abrirlo ↗</a>'
                 : (window.SG_PANEL_MAESTRO ? 'el <a href="' + esc(window.SG_PANEL_MAESTRO) + '" target="_blank" rel="noopener">Panel de control maestro</a> de STARGATE (el de todos los grupos)' : '—')) +
      '</p></div>' +

      // 🔴 Los enlaces del grupo, en solo lectura. Un docente los necesita A MANO —los reparte en
      // clase— pero cambiarlos es del referente: verlos sin poder tocarlos es exactamente lo que
      // hace falta, y evita el «¿dónde estaba el padlet?» de cada semana.
      '<div class="card"><h3>Los enlaces de este grupo</h3>' +
      '<p class="small muted">Para repartir en clase. Cambiarlos es cosa del profe referente.</p>' +
      '<div class="m-enlaces">' +
        // 16-sep · el alistamiento sale del código del grupo (el mismo enlace que «Copiar invitación»): salía «sin configurar»
        enlaceFila("<img class=ico src=assets/img/iconos/p/brujula.png alt>", "Alistarse (con el código)", t.alta || (DATOS.proyecto && DATOS.proyecto.joinCode
          ? "alistarse.html?per=" + encodeURIComponent(PER) + "&codigo=" + encodeURIComponent(DATOS.proyecto.joinCode) : "")) +
        enlaceFila("<img class=ico src=assets/img/iconos/p/cohete.png alt>", "La Nave del alumnado", "recluta.html?per=" + encodeURIComponent(PER), "", true) +
        enlaceFila("<img class=ico src=assets/img/iconos/p/medalla.png alt>", "El tablero, para proyectar", "registro.html?per=" + encodeURIComponent(PER) + "&solo=1", "tablero_" + PER, true) +
        enlaceFila("<img class=ico src=assets/img/iconos/p/video.png alt>", "La sesión de esta semana", "sesion.html?per=" + encodeURIComponent(PER), "sesion_" + PER, true) +
        // 13-sep · la Nave con tu Comandante de recluta, para ensayar (o enseñarla fuera de la sesión): no guarda nada
        enlaceFila("<img class=ico src=assets/img/iconos/p/envivo.png alt>", "Tu Nave de ejemplo (simulacro)", "recluta.html?simulacro=1&per=" + encodeURIComponent(PER), "", true) +
        enlaceFila("<img class=ico src=assets/img/iconos/p/notas.png alt>", "Padlet de la clase", t.padlet || "") +
      '</div></div>';

    $("#m-guardar").onclick = async function () {
      var v = $("#m-panel").value.trim();
      $("#m-guardar").disabled = true;
      try { await guardarMiParte("paneles", yo.nombre, v);
            await refrescar(); aviso(v ? "Guardado. Tu alumnado abrirá el tuyo." : "Quitado.", true); }
      catch (e) { $("#m-guardar").disabled = false; aviso(e.message); }
    };
    if ($("#m-quitar")) $("#m-quitar").onclick = async function () {
      try { await guardarMiParte("paneles", yo.nombre, "");
            await refrescar(); aviso("Quitado. Vuelven al panel oficial.", true); }
      catch (e) { aviso(e.message); }
    };
  }
  /**
   * 🔴 16-sep · DOS FORMAS DE COPIAR. Norberto: «necesito dos botones, copiar enlace o copiar </>. Ahora copia esto:
   * sesion.html?per=prueba-semana-8. Con eso no puedo meterlo al Genially». Copiaba la dirección RELATIVA, que fuera de
   * la web no lleva a ninguna parte. Ahora: «🔗 Enlace» copia la dirección completa (para el foro, un botón, un QR) y
   * «</> Código» copia el embed listo para Genially (Insertar → Otros → Código), con embed=1 para que salga sin la
   * cabecera ni el menú. El código solo en lo que tiene sentido incrustar; un enlace externo como el padlet, no.
   */
  function absoluta(url) { return /^https?:\/\//i.test(url) ? url : location.origin + "/" + String(url).replace(/^\/+/, ""); }
  function conEmbed(url) { return url + (url.indexOf("?") >= 0 ? "&" : "?") + "embed=1"; }
  function enlaceFila(ico, tit, url, ventana, incrustable) {
    if (!url) return '<div class="m-fila vacia"><span>' + ico + '</span><b>' + esc(tit) + '</b>' +
                     '<em>sin configurar</em></div>';
    return '<div class="m-fila"><span>' + ico + '</span><b>' + esc(tit) + '</b>' +
      '<a href="' + esc(url) + '" target="_blank" rel="noopener">Abrir ↗</a>' +
      (ventana ? botonVentana(url, ventana, tit) : "") +
      '<button class="btn min" data-copiar="' + esc(absoluta(url)) + '" data-copiado="✓ Enlace copiado" title="Copia la dirección completa"><img class=ico src=assets/img/iconos/p/enlace.png alt> Enlace</button>' +
      (incrustable ? '<button class="btn min" data-copiar="' + esc(codigoGenially(conEmbed(url), "STARGATE · " + tit)) + '" data-copiado="✓ Código copiado" ' +
        'title="Copia el código para Genially: Insertar → Otros → Código">&lt;/&gt; Código</button>' : "") +
      '</div>';
  }

  // ---------------------------------------------------------------- escondites
  /**
   * 🔴 17-sep · LOS PREMIOS POR ENLACE, REHECHOS. Lo que dijo Norberto al probarlos, una cosa detrás de otra:
   *   · «¿Valen para cualquier grupo? Sería maravilloso poder reciclarlos… marcar a qué grupos afecta (con opción TODOS)».
   *   · «He creado un premio, lo he reclamado, y al volver a entrar ha desaparecido: no le di a Guardar. Debería estar
   *     dentro de cada recompensa; si no, pasará muchísimo». → cada premio se GUARDA SOLO al tocarlo.
   *   · «No hace falta ver la dirección» y «¿qué significa enlace? ¿no lo puedes generar tú en segundo plano?».
   *   · «Es importante usar direcciones más difíciles: un usuario avispado cambia el 1 por el 2». → id y código al azar.
   *   · «Se pueden ir añadiendo a medida que los vaya necesitando» (los grupos empezaban con ocho de muestra).
   *   · «El desplegable rompe la magia: una ventana con las opciones explicadas de forma visual» y «pon una imagen del
   *     premio que se escoja, visualmente es feo».
   *   · «Debería poder marcarse si es huevo de Pascua o recompensa (la mayoría)».
   * El catálogo y cómo se guarda, en motor.js (`guardarPremioEnlace`). Aquí, la pantalla: la misma dentro de un grupo
   * (los que le afectan) y en «🌐 Para todos tus grupos» (todos).
   */
  var PREMIO_INFO = {
    sobre: ["🃏", "Un sobre de cromos", "Tres cartas al azar del álbum, como un sobre del Mercado.", "canje/sobre.jpg"],
    heroe_fijo: ["<img class=ico src=assets/img/iconos/p/escudo.png alt>", "Un héroe que eliges tú", "El héroe exacto que elijas: el premio perfecto para un reto de clase.", "canje/heroe.jpg"],
    heroe: ["<img class=ico src=assets/img/iconos/p/dados.png alt>", "Un héroe al azar", "Uno de los 30 héroes, con las mismas probabilidades que en el Mercado.", "canje/heroe.jpg"],
    bolsa: ["<img class=ico src=assets/img/iconos/p/monedas.png alt>", "Créditos", "Una bolsa de ◈ para gastar en el Mercado. Tú eliges cuántos.", ""],
    xp: ["<img class=ico src=assets/img/iconos/p/rayo.png alt>", "Experiencia", "Puntos de xp: suben su nivel y su puesto en el ranking. Tú eliges cuántos.", ""],
    participaciones: ["<img class=ico src=assets/img/iconos/p/ticket.png alt>", "Participaciones del sorteo", "Papeletas extra para un sorteo abierto de este grupo (de 1 a 10).", "canje/sorteo.jpg"],
    sobre_grande: ["🃏", "Un sobre grande", "Cinco cartas en vez de tres, con las probabilidades de siempre.", "canje/sobre_grande.jpg"],
    sobre_raro: ["<img class=ico src=assets/img/iconos/p/estrella.png alt>", "Un sobre de raras", "Tres cartas donde las comunes casi desaparecen.", "canje/sobre_raro.jpg"],
    sobre_epico: ["<img class=ico src=assets/img/iconos/p/estrella.png alt>", "Un sobre épico", "Tres cartas y ninguna común: legendaria, cuatro veces más que en el de siempre.", "canje/sobre_epico.jpg"],
    capsula_elite: ["<img class=ico src=assets/img/iconos/p/escudo.png alt>", "Una cápsula de élite", "Un héroe de la Vanguardia o, casi una de cada tres, un Mito.", "canje/capsula_elite.jpg"],
    capsula_legendaria: ["<img class=ico src=assets/img/iconos/p/corona.png alt>", "Una cápsula legendaria", "Un Mito seguro: para el hallazgo más difícil.", "canje/capsula_legendaria.jpg"]
  };
  var ORDEN_PREMIOS = ["sobre", "heroe_fijo", "heroe", "bolsa", "xp", "participaciones", "sobre_grande", "sobre_raro", "sobre_epico", "capsula_elite", "capsula_legendaria"];
  function heroesDelCatalogo() { return ((window.SG_CATALOGO || {}).heroes) || []; }
  function rarezaBonita(r) { r = String(r || "").toLowerCase(); return r ? r.charAt(0).toUpperCase() + r.slice(1) : ""; }
  // «datetime-local» habla en la hora de quien lo rellena; se guarda como instante (ms)
  function aLocal(ms) { if (!ms) return ""; var d = new Date(Number(ms)); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); }
  function deLocal(v) { if (!v) return 0; var t = new Date(v).getTime(); return isNaN(t) ? 0 : t; }
  function sorteosDe(datos) {
    return ((datos && datos.recompensas) || []).filter(function (r) { return r.systemEffect === "lottery_ticket" && !r.isRaffleCompleted; });
  }
  /** La imagen del premio (el héroe elegido, si es uno concreto); si no tiene, un azulejo con su icono. */
  function imgPremio(it, clase) {
    var I = PREMIO_INFO[it.premio] || PREMIO_INFO.sobre;
    if (it.premio === "heroe_fijo" && it.heroe) return '<img class="' + clase + '" src="assets/img/heroes/' + esc(it.heroe) + '.jpg" alt="" loading="lazy">';
    return I[3] ? '<img class="' + clase + '" src="assets/img/' + I[3] + '" alt="" loading="lazy">'
                : '<span class="' + clase + ' pe-azulejo pe-az-' + esc(it.premio) + '" aria-hidden="true">' + I[0] + "</span>";
  }
  function nombrePremio(it) {
    var I = PREMIO_INFO[it.premio] || PREMIO_INFO.sobre, n = Number(it.cantidad) || 0;
    if (it.premio === "heroe_fijo" && it.heroe) { var h = heroesDelCatalogo().filter(function (x) { return x.clave === it.heroe; })[0]; return "" + (h ? h.nombre + " · " + rarezaBonita(h.rareza) : "Un héroe"); }
    if (it.premio === "bolsa") return "" + (n || 50) + " ◈";
    if (it.premio === "xp") return "" + (n || 100) + " xp";
    if (it.premio === "participaciones") return "" + (n || 1) + (n === 1 || !n ? " participación" : " participaciones") + " del sorteo";
    return I[1];
  }
  // quién lleva qué: los grupos que gobierna quien mira (y sus nombres)
  function gestionados() { return PERS.filter(function (p) { return refDe(p); }).map(function (p) { return p.id; }); }
  /** 19-sep · para los premios por enlace: los grupos que llevas y, en mando manual, también aquellos en los que das clase. */
  function premiables() {
    var g = gestionados();
    if (manual()) PERS.forEach(function (p) { if (p.miNombre && p.estado !== "pasado" && g.indexOf(p.id) < 0) g.push(p.id); });
    return g;
  }
  function nombreDeGrupo(id) { var p = PERS.filter(function (x) { return x.id === id; })[0]; return (p && p.nombre) || id; }
  function textoAmbito(it) {
    var g = premiables();
    if (it.grupos === "todos") return "Todos tus grupos" + (g.length > 1 ? " (" + g.length + ")" : "");
    var l = it.grupos || [];
    return l.length === 1 ? "Solo «" + nombreDeGrupo(l[0]) + "»" : "" + l.length + " grupos";
  }

  var PE = { lista: [], contexto: null, datos: {}, timers: {}, destino: null };
  function verHuevos() { verPremios(PER, $("#c-cuerpo")); }
  /**
   * La pantalla de premios. `contexto`: el grupo en el que se está (enseña los que le afectan y los nuevos nacen para él)
   * o null (🌐 todos tus grupos).
   */
  async function verPremios(contexto, destino) {
    PE.contexto = contexto; PE.destino = destino;
    destino.innerHTML = '<div class="card pe-card"><div class="pe-cab"><div><h3><img class=ico src=assets/img/iconos/p/premios.png alt> Premios por enlace</h3>' +
      '<p class="small muted">Un enlace que da un premio a quien lo pulse, <b>una vez por persona</b>. Una <b>recompensa</b> para quien supera un reto de clase, o un <b>huevo de Pascua</b> escondido en tu Genially. ' +
      'El mismo enlace vale en todos los grupos a los que lo apliques. Todo se guarda solo.</p></div>' +
      '<button type="button" class="btn primary" id="pe-nuevo"><img class=ico src=assets/img/iconos/p/anadir.png alt> Nuevo premio</button></div>' +
      (contexto ? '<p class="pe-filtro small muted">Los que afectan a este grupo · <a href="consola.html?comun=premios"><img class=ico src=assets/img/iconos/p/varios.png alt> Ver los de todos tus grupos</a></p>' : "") +
      '<div id="pe-lista" class="pe-lista"><p class="muted">Buscando tus premios…</p></div></div>';
    $("#pe-nuevo").onclick = crearPremio;
    try { PE.lista = await MOTOR.premiosEnlaceDe(premiables()); }
    catch (e) { $("#pe-lista").innerHTML = '<p class="malo">No he podido leer los premios: ' + esc(e.message) + "</p>"; return; }
    /**
     * 17-sep · «🌐 Todos tus grupos» se resuelve al GUARDAR: un grupo creado después (el curso de enero) no lo tenía
     * hasta que alguien tocara el premio, y dentro de ese grupo ni aparecía. Al abrir esta pantalla, los de «todos»
     * se llevan solos a los grupos tuyos que les falten (buscándolos en todos tus grupos, no solo en el que miras).
     */
    var mios = premiables();
    await Promise.all(PE.lista.filter(function (it) {
      return it.grupos === "todos" && !validarPremio(it) && mios.some(function (g) { return (it.en || []).indexOf(g) < 0; });
    }).map(async function (it) {
      try { var r = await MOTOR.guardarPremioEnlace(it, mios); it.en = r.en; it.actualizado = Date.now(); } catch (e) {}
    }));
    if (contexto && DATOS) PE.datos[contexto] = DATOS;
    pintarPremios();
  }
  function premiosVisibles() {
    return PE.lista.filter(function (it) { return !PE.contexto || (it.en || []).indexOf(PE.contexto) >= 0; });
  }
  function pintarPremios() {
    var l = premiosVisibles(), caja = $("#pe-lista"); if (!caja) return;
    caja.innerHTML = l.length ? l.map(tarjetaPremio).join("")
      : '<div class="pe-vacio"><p><b>Todavía no hay ninguno' + (PE.contexto ? " en este grupo" : "") + '.</b> Crea el primero cuando lo necesites: ' +
        'una recompensa para el reto de hoy o un huevo escondido en la presentación.</p></div>';
    l.forEach(function (it) { cablearPremio(it); estadoServidor(it); });
  }
  function tarjetaPremio(it) {
    var g = premiables(), rec = it.tipo !== "huevo", ver = (it.en || [])[0] || PE.contexto || g[0] || "";
    var insertar = '<iframe src="' + MOTOR.enlacePremio(it, true) + '" width="100%" height="620" style="border:0;border-radius:16px" allow="clipboard-write" title="Premio de STARGATE"></iframe>';
    var mas = it.premio === "bolsa" || it.premio === "xp" || it.premio === "participaciones";
    return '<div class="hv-f pe-f" data-pe="' + esc(it.id) + '">' +
      '<button type="button" class="pe-img" data-pe-elegir title="Cambiar el premio">' + imgPremio(it, "pe-img-i") + '<span class="pe-img-c">Cambiar</span></button>' +
      '<div class="pe-cuerpo">' +
        '<div class="pe-l1">' +
          '<input class="h-nom pe-nom" value="' + esc(it.nombre || "") + '" placeholder="' + (rec ? "Ponle nombre: «Reto del lunes»" : "Ponle nombre: «Escondido en el Tema 3»") + '" aria-label="Nombre del premio" maxlength="80">' +
          '<span class="pe-tipo" role="group" aria-label="Qué es">' +
            '<button type="button" class="' + (rec ? "on" : "") + '" data-pe-tipo="recompensa" aria-pressed="' + rec + '"><img class=ico src=assets/img/iconos/p/premios.png alt> Recompensa</button>' +
            '<button type="button" class="' + (rec ? "" : "on") + '" data-pe-tipo="huevo" aria-pressed="' + !rec + '"><img class=ico src=assets/img/iconos/p/botin.png alt> Huevo de Pascua</button></span>' +
          '<label class="h-sw" title="Encendido: se puede reclamar (dentro de sus fechas).">' +
            '<input type="checkbox" class="h-on"' + (it.activo === false ? "" : " checked") + '><i></i>' +
            '<span class="h-sw-si">Activo</span><span class="h-sw-no">En pausa</span></label>' +
        '</div>' +
        '<div class="pe-l2"><b class="pe-premio">' + esc(nombrePremio(it)) + '</b>' +
          '<span class="pe-ambito">' + esc(textoAmbito(it)) + '</span>' +
          '<span class="h-estado">Comprobando…</span>' +
          '<span class="pe-guardado" aria-live="polite"></span></div>' +
        '<div class="pe-acc">' +
          '<button type="button" class="btn min" data-copiar="' + esc(MOTOR.enlacePremio(it, false)) + '" data-copiado="✓ Enlace copiado" title="La página de STARGATE, para compartir o poner en un botón"><img class=ico src=assets/img/iconos/p/enlace.png alt> Copiar enlace</button>' +
          '<button type="button" class="btn min" data-copiado="✓ Código copiado" data-copiar="' + esc(insertar) + '" title="Para Genially: Insertar → Otros → Código. Sin fondo: se funde con tu diapositiva">&lt;/&gt; Copiar para insertar</button>' +
          (ver ? '<a class="btn min" target="_blank" rel="noopener" href="huevo.html?h=' + esc(it.id) + '&c=' + esc(it.codigo || "") + '&t=' + (rec ? "r" : "h") + '&per=' + esc(ver) + '&vista=1"><img class=ico src=assets/img/iconos/p/ojo.png alt> Ver cómo se ve</a>' : "") +
          '<button type="button" class="btn min" data-pe-mas aria-expanded="false"><img class=ico src=assets/img/iconos/p/ajustes.png alt> Grupos, fechas y topes</button>' +
          '<button type="button" class="btn min peligro" data-pe-quitar title="Quitar este premio de todos sus grupos"><img class=ico src=assets/img/iconos/p/papelera.png alt></button>' +
        '</div>' +
        '<div class="pe-mas" hidden>' +
          '<fieldset class="pe-grupos"><legend>¿Para qué grupos?</legend>' +
            '<label class="pe-radio"><input type="radio" name="pe-g-' + esc(it.id) + '" value="todos"' + (it.grupos === "todos" ? " checked" : "") + '> <img class=ico src=assets/img/iconos/p/varios.png alt> Todos tus grupos, también los que crees después</label>' +
            '<label class="pe-radio"><input type="radio" name="pe-g-' + esc(it.id) + '" value="elegir"' + (it.grupos === "todos" ? "" : " checked") + '> Solo estos:</label>' +
            '<span class="pe-chips">' + g.map(function (id) {
              var on = it.grupos === "todos" || (it.grupos || []).indexOf(id) >= 0;
              return '<label class="pe-chip"><input type="checkbox" value="' + esc(id) + '"' + (on ? " checked" : "") + (it.grupos === "todos" ? " disabled" : "") + '> ' + esc(nombreDeGrupo(id)) + "</label>";
            }).join("") + '</span></fieldset>' +
          '<div class="pe-campos">' +
            (mas ? '<label class="h-campo h-cant">' + (it.premio === "participaciones" ? "Participaciones" : it.premio === "xp" ? "Cuánta xp" : "Cuántos ◈") +
              '<input class="h-cantidad" type="number" min="1" max="' + (it.premio === "participaciones" ? 10 : 100000) + '" value="' + (Number(it.cantidad) || (it.premio === "xp" ? 100 : it.premio === "participaciones" ? 1 : 50)) + '"></label>' : "") +
            (it.premio === "participaciones" ? '<label class="h-campo h-c-sorteo">Del sorteo<select class="h-sorteo">' + opcionesSorteo(it) + "</select></label>" : "") +
            '<label class="h-campo h-fecha">Abierto desde<input class="h-desde" type="datetime-local" value="' + aLocal(it.desde) + '" title="Vacío = ya"></label>' +
            '<label class="h-campo h-fecha">Hasta<input class="h-hasta" type="datetime-local" value="' + aLocal(it.hasta) + '" title="Vacío = sin fecha de cierre"></label>' +
            '<label class="h-campo h-num">Tope total<input class="h-lim" type="number" min="0" value="' + (Number(it.limite) || "") + '" placeholder="sin tope" title="En cada grupo: 5 = solo los cinco primeros"></label>' +
            '<label class="h-campo h-num">Por escuadrón<input class="h-esc" type="number" min="0" value="' + (Number(it.porEscuadron) || "") + '" placeholder="sin tope" title="2 = los dos primeros de CADA escuadrón"></label>' +
          '</div></div>' +
      '</div></div>';
  }
  function opcionesSorteo(it) {
    var d = PE.datos[(it.grupos || [])[0]] || (PE.contexto ? DATOS : null), s = sorteosDe(d);
    return s.length ? s.map(function (r) { return '<option value="' + esc(r.docId) + '"' + (it.sorteo === r.docId ? " selected" : "") + ">" + esc(((r.stargateSorteo || {}).premio) || r.title) + "</option>"; }).join("")
                    : '<option value="">— no hay ningún sorteo abierto en este grupo —</option>';
  }
  /**
   * 🔴 CÓMO ESTÁ, CONTADO POR EL SERVIDOR Y NUNCA POR LO QUE HAY ESCRITO EN PANTALLA. Norberto, 17-sep: «parece que no
   * funciona el temporizador: me ha dejado reclamarlo, y encima es una bolsa de créditos». El editor de antes enseñaba
   * «⏳ Se abre hoy a las 11:20» calculado con lo escrito, y no se había guardado: en el servidor seguía siendo una bolsa
   * de 50 ◈ sin fecha. Esto lee la recompensa de verdad de cada grupo (lo mismo que decide el servidor al reclamar).
   */
  function estadoServidor(it) {
    var grupos = PE.contexto ? [PE.contexto] : (it.en || []);
    var f = document.querySelector('.pe-f[data-pe="' + it.id + '"] .h-estado'); if (!f) return;
    if (!grupos.length) { f.textContent = "No está en ningún grupo: marca alguno en «Grupos, fechas y topes»"; return; }
    Promise.all(grupos.map(function (per) { return MOTOR.estadoHuevo(per, it.id).catch(function () { return null; }); })).then(function (es) {
      var f2 = document.querySelector('.pe-f[data-pe="' + it.id + '"] .h-estado'); if (!f2) return;
      var e = es.filter(Boolean)[0];
      if (!e || !e.R) { f2.textContent = "No está guardado en el servidor"; return; }
      var n = es.reduce(function (a, x) { return a + (x ? Number(x.reclamados) || 0 : 0); }, 0);
      it.__reclamados = n;
      var cuantos = n ? " · <img class=ico src=assets/img/iconos/p/gente.png alt> " + n + (n === 1 ? " lo ha reclamado" : " lo han reclamado") : " · nadie lo ha reclamado aún";
      var cuando = MOTOR.cuandoEs;
      f2.innerHTML = (e.estado === "pausado" ? "<img class=ico src=assets/img/iconos/p/pausa.png alt> En pausa"
        : e.estado === "pronto" ? "<img class=ico src=assets/img/iconos/p/tiempo.png alt> Se abre " + cuando(e.desde)
        : e.estado === "cerrado" ? "<img class=ico src=assets/img/iconos/p/candado.png alt> Se cerró " + cuando(e.hasta)
        : e.estado === "agotado" ? "<img class=ico src=assets/img/iconos/p/hecho.png alt> Agotado"
        : e.estado === "borrado" ? "<img class=ico src=assets/img/iconos/p/aviso.png alt> Quitado"
        : "<img class=ico src=assets/img/iconos/p/hecho.png alt> Abierto" + (e.hasta ? " hasta " + cuando(e.hasta) : "")) + cuantos;
    });
  }
  function validarPremio(it) {
    if (it.premio === "heroe_fijo" && !it.heroe) return "Elige qué héroe se lleva.";
    if (it.premio === "participaciones") {
      if (it.grupos === "todos" || (it.grupos || []).length !== 1) return "Las participaciones son de un sorteo de UN grupo: marca solo ese grupo.";
      if (!it.sorteo) return "Elige de qué sorteo son las participaciones (o crea uno en «Sorteos»).";
      if (Number(it.cantidad) < 1 || Number(it.cantidad) > 10) return "De 1 a 10 participaciones por enlace.";
    }
    if (it.grupos !== "todos" && !(it.grupos || []).length) return "Marca al menos un grupo.";
    if (Number(it.desde) && Number(it.hasta) && Number(it.hasta) <= Number(it.desde)) return "«Hasta» tiene que ser después de «Abierto desde».";
    return "";
  }
  /** Se guarda solo: al medio segundo de dejar de escribir, o al momento si es un botón. */
  function guardarLuego(it, ya) {
    var marca = document.querySelector('.pe-f[data-pe="' + it.id + '"] .pe-guardado');
    var malo = validarPremio(it);
    if (malo) { if (marca) { marca.textContent = "" + malo; marca.className = "pe-guardado malo"; } return; }
    if (marca) { marca.textContent = "Guardando…"; marca.className = "pe-guardado"; }
    var est = document.querySelector('.pe-f[data-pe="' + it.id + '"] .h-estado'); if (est) est.textContent = "Comprobando…";
    clearTimeout(PE.timers[it.id]);
    PE.timers[it.id] = setTimeout(async function () {
      try {
        var r = await MOTOR.guardarPremioEnlace(it, premiables());
        it.en = r.en; it.actualizado = Date.now();
        var m = document.querySelector('.pe-f[data-pe="' + it.id + '"] .pe-guardado');
        if (m) {
          m.textContent = r.saltados.length ? "Guardado, pero no en " + r.saltados.map(function (s) { return "«" + nombreDeGrupo(s.per) + "» (" + s.motivo + ")"; }).join(", ")
                                            : "✓ Guardado" + (r.en.length > 1 ? " en " + r.en.length + " grupos" : "");
          m.className = "pe-guardado " + (r.saltados.length ? "malo" : "bien");
        }
        var f = document.querySelector('.pe-f[data-pe="' + it.id + '"]');
        if (f) { $(".pe-ambito", f).textContent = textoAmbito(it); estadoServidor(it); }
        // dentro de un grupo, si ya no le afecta, sale de la lista
        if (PE.contexto && r.en.indexOf(PE.contexto) < 0) pintarPremios();
      } catch (e) {
        var m2 = document.querySelector('.pe-f[data-pe="' + it.id + '"] .pe-guardado');
        if (m2) { m2.textContent = "No se ha guardado: " + e.message; m2.className = "pe-guardado malo"; }
      }
    }, ya ? 0 : 600);
  }
  function cablearPremio(it) {
    var f = document.querySelector('.pe-f[data-pe="' + it.id + '"]'); if (!f) return;
    var num = function (sel) { var e = $(sel, f); return e ? Number(e.value) || 0 : 0; };
    $(".pe-nom", f).oninput = function () { it.nombre = this.value.trim(); guardarLuego(it); };
    Array.prototype.forEach.call(f.querySelectorAll("[data-pe-tipo]"), function (b) {
      b.onclick = function () {
        it.tipo = b.getAttribute("data-pe-tipo");
        Array.prototype.forEach.call(f.querySelectorAll("[data-pe-tipo]"), function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
        guardarLuego(it, true);
        // el enlace lleva el tipo (la página lo dice antes de saber el grupo): se rehacen sus botones
        var nuevo = tarjetaPremio(it), tmp = document.createElement("div"); tmp.innerHTML = nuevo;
        $(".pe-acc", f).innerHTML = $(".pe-acc", tmp).innerHTML; cablearAcciones(it, f);
      };
    });
    $(".h-on", f).onchange = function () { it.activo = this.checked; guardarLuego(it, true); };
    $("[data-pe-elegir]", f).onclick = async function () {
      var r = await elegirPremio(it); if (!r) return;
      /**
       * 🔴 17-sep · «me dice que YA lo tenía, y es mentira». No lo era: esa cuenta había reclamado ese mismo enlace por la
       * mañana, cuando daba otra cosa. Un enlace se reclama una vez por persona, dé lo que dé. Si ya lo ha reclamado
       * alguien, cambiarle el premio no se lo da a esa persona: se dice, y se ofrece crear uno nuevo.
       */
      if (Number(it.__reclamados) > 0 && (r.premio !== it.premio || r.heroe !== it.heroe)) {
        var n = Number(it.__reclamados);
        var q = await window.SG.preguntar({ titulo: "Este premio ya lo " + (n === 1 ? "ha reclamado 1 persona" : "han reclamado " + n + " personas"),
          texto: "Un enlace se reclama una vez por persona. Si le cambias el premio, quien ya lo reclamó NO podrá conseguir el nuevo (le dirá que ya lo tiene).\n\n" +
                 "Crea uno nuevo con su propio enlace (este sigue como está).", si: "Crear uno nuevo con este premio", no: "Cancelar" });
        if (!q) return;
        {
          var nuevo = MOTOR.premioNuevo({ tipo: it.tipo, nombre: it.nombre ? it.nombre + " (2)" : "", grupos: it.grupos, premio: r.premio, heroe: r.heroe, cantidad: r.cantidad, sorteo: r.sorteo });
          try { var g2 = await MOTOR.guardarPremioEnlace(nuevo, premiables()); nuevo.en = g2.en; } catch (e) { aviso("No se ha podido crear: " + e.message); return; }
          PE.lista.unshift(nuevo); pintarPremios(); aviso("Premio nuevo creado, con su propio enlace.", true); return;
        }
      }
      Object.assign(it, r);
      var tmp = document.createElement("div"); tmp.innerHTML = tarjetaPremio(it);
      var abierto = !$(".pe-mas", f).hidden;
      f.replaceWith(tmp.firstChild);
      cablearPremio(it);
      if (abierto) { var nf = document.querySelector('.pe-f[data-pe="' + it.id + '"]'); $(".pe-mas", nf).hidden = false; $("[data-pe-mas]", nf).setAttribute("aria-expanded", "true"); }
      guardarLuego(it, true);
    };
    cablearAcciones(it, f);
    var mas = $(".pe-mas", f);
    Array.prototype.forEach.call(mas.querySelectorAll('input[type=radio]'), function (r) {
      r.onchange = function () {
        var todos = r.value === "todos" && r.checked;
        Array.prototype.forEach.call(mas.querySelectorAll(".pe-chips input"), function (c) { c.disabled = todos; if (todos) c.checked = true; });
        it.grupos = todos ? "todos" : [].slice.call(mas.querySelectorAll(".pe-chips input:checked")).map(function (c) { return c.value; });
        guardarLuego(it, true);
      };
    });
    Array.prototype.forEach.call(mas.querySelectorAll(".pe-chips input"), function (c) {
      c.onchange = function () { it.grupos = [].slice.call(mas.querySelectorAll(".pe-chips input:checked")).map(function (x) { return x.value; }); guardarLuego(it, true); };
    });
    ["h-cantidad", "h-lim", "h-esc", "h-desde", "h-hasta", "h-sorteo"].forEach(function (k) {
      var e = $("." + k, mas); if (!e) return;
      e.oninput = e.onchange = function () {
        it.cantidad = num(".h-cantidad") || it.cantidad; it.limite = num(".h-lim"); it.porEscuadron = num(".h-esc");
        it.desde = deLocal(($(".h-desde", mas) || {}).value); it.hasta = deLocal(($(".h-hasta", mas) || {}).value);
        if ($(".h-sorteo", mas)) it.sorteo = $(".h-sorteo", mas).value;
        $(".pe-premio", f).textContent = nombrePremio(it);
        guardarLuego(it);
      };
    });
  }
  function cablearAcciones(it, f) {
    var bm = $("[data-pe-mas]", f), mas = $(".pe-mas", f);
    bm.onclick = function () { mas.hidden = !mas.hidden; bm.setAttribute("aria-expanded", String(!mas.hidden)); };
    $("[data-pe-quitar]", f).onclick = async function () {
      var n = (it.en || []).length;
      if (!(await window.SG.preguntar({ titulo: "¿Quitar «" + (it.nombre || nombrePremio(it)) + "»?",
        texto: "Deja de funcionar su enlace" + (n > 1 ? " en sus " + n + " grupos" : "") + ". Quien ya lo reclamó conserva lo que ganó.", si: "Quitar el premio", peligro: true }))) return;
      try { await MOTOR.borrarPremioEnlace(it, premiables()); PE.lista = PE.lista.filter(function (x) { return x.id !== it.id; }); pintarPremios(); aviso("Premio quitado.", true); }
      catch (e) { aviso(e.message); }
    };
  }
  /** «➕ Nuevo premio»: primero qué es y qué da (en la ventana visual), y nace guardado y listo para copiar su enlace. */
  async function crearPremio() {
    var tipo = await elegirTipo(); if (!tipo) return;
    var base = MOTOR.premioNuevo({ tipo: tipo, grupos: PE.contexto ? [PE.contexto] : "todos" });
    var r = await elegirPremio(base); if (!r) return;
    var it = Object.assign(base, r);
    var malo = validarPremio(it); if (malo) { aviso(malo); return; }
    try { var g = await MOTOR.guardarPremioEnlace(it, premiables()); it.en = g.en; }
    catch (e) { aviso("No se ha podido crear: " + e.message); return; }
    PE.lista.unshift(it); pintarPremios();
    var f = document.querySelector('.pe-f[data-pe="' + it.id + '"]');
    if (f) { f.classList.add("pe-recien"); f.scrollIntoView({ block: "center", behavior: "smooth" }); var n = $(".pe-nom", f); if (n) n.focus({ preventScroll: true });
      $(".pe-guardado", f).textContent = "✓ Creado y guardado: ponle nombre y copia su enlace"; $(".pe-guardado", f).className = "pe-guardado bien"; }
  }

  // ---------------------------------------------------------------- la ventana visual para elegir
  /** Una ventana propia (no la pregunta de la casa: aquí hay tarjetas con imagen). Devuelve lo elegido o null. */
  function ventanaVisual(titulo, cuerpo, montar) {
    return new Promise(function (resolve) {
      var capa = document.createElement("div"); capa.className = "sgp-capa pe-capa";
      capa.innerHTML = '<div class="sgp-caja pe-ventana" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '">' +
        '<div class="pe-v-cab"><h3>' + esc(titulo) + '</h3><button type="button" class="pe-v-x" aria-label="Cerrar">✕</button></div>' +
        '<div class="pe-v-cuerpo">' + cuerpo + "</div></div>";
      document.body.appendChild(capa);
      var hecho = false;
      var cerrar = function (v) { if (hecho) return; hecho = true; document.removeEventListener("keydown", tecla, true); capa.remove(); resolve(v); };
      var tecla = function (e) { if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); cerrar(null); } };
      document.addEventListener("keydown", tecla, true);
      capa.addEventListener("mousedown", function (e) { if (e.target === capa) cerrar(null); });
      $(".pe-v-x", capa).onclick = function () { cerrar(null); };
      montar(capa, cerrar);
      var primero = capa.querySelector(".pe-op, button, input"); if (primero) try { primero.focus(); } catch (e) {}
    });
  }
  function elegirTipo() {
    return ventanaVisual("¿Qué quieres crear?",
      '<div class="pe-ops dos">' +
        '<button type="button" class="pe-op" data-v="recompensa"><span class="pe-op-ico"><img class=ico src=assets/img/iconos/p/premios.png alt></span><b>Una recompensa</b><em>Para quien supera un reto o una actividad de clase. Al pulsar el enlace: «¡Enhorabuena! Has ganado una recompensa».</em></button>' +
        '<button type="button" class="pe-op" data-v="huevo"><span class="pe-op-ico"><img class=ico src=assets/img/iconos/p/botin.png alt></span><b>Un huevo de Pascua</b><em>Escondido en un rincón de tu Genially. Quien lo encuentra: «Has encontrado un huevo de Pascua».</em></button>' +
      "</div>",
      function (capa, cerrar) { Array.prototype.forEach.call(capa.querySelectorAll("[data-v]"), function (b) { b.onclick = function () { cerrar(b.getAttribute("data-v")); }; }); });
  }
  /** Paso 1: qué premio (tarjetas con su imagen y qué da). Paso 2, si hace falta: el héroe, cuánto o de qué sorteo. */
  function elegirPremio(it) {
    // los sobres y cápsulas nuevos, solo si el grupo los tiene en su tienda (fuera de un grupo, todos: donde no esté, se avisa)
    var hay = {}; if (PE.contexto && DATOS) (DATOS.recompensas || []).forEach(function (r) { hay[r.stargateTipo] = true; });
    var ops = ORDEN_PREMIOS.filter(function (k) {
      if (k === "participaciones" && !PE.contexto) return false;   // (son de un sorteo de un grupo)
      return !PE.contexto || !/^(capsula_|sobre_)/.test(k) || hay[k] || it.premio === k;
    });
    return ventanaVisual("Elige el premio",
      '<div class="pe-ops">' + ops.map(function (k) {
        var I = PREMIO_INFO[k];
        return '<button type="button" class="pe-op' + (it.premio === k ? " on" : "") + '" data-v="' + k + '">' + imgPremio({ premio: k }, "pe-op-img") +
          "<b>" + esc(I[1]) + "</b><em>" + esc(I[2]) + "</em></button>";
      }).join("") + "</div>",
      function (capa, cerrar) {
        var cuerpo = $(".pe-v-cuerpo", capa), titulo = $(".pe-v-cab h3", capa);
        Array.prototype.forEach.call(capa.querySelectorAll(".pe-op[data-v]"), function (b) {
          b.onclick = function () {
            var k = b.getAttribute("data-v");
            if (k === "heroe_fijo") return pasoHeroe(cuerpo, titulo, it, cerrar);
            if (k === "bolsa" || k === "xp" || k === "participaciones") return pasoCantidad(cuerpo, titulo, it, k, cerrar);
            cerrar({ premio: k, heroe: "", cantidad: 0, sorteo: "" });
          };
        });
      });
  }
  function pasoHeroe(cuerpo, titulo, it, cerrar) {
    titulo.textContent = "¿Qué héroe se lleva?";
    var hs = heroesDelCatalogo(), rarezas = [];
    hs.forEach(function (h) { var r = rarezaBonita(h.rareza); if (rarezas.indexOf(r) < 0) rarezas.push(r); });
    cuerpo.innerHTML = '<p class="pe-filtros"><button type="button" class="on" data-r="">Todos</button>' + rarezas.map(function (r) { return '<button type="button" data-r="' + esc(r) + '">' + esc(r) + "</button>"; }).join("") + "</p>" +
      '<div class="pe-ops heroes">' + hs.map(function (h) {
        return '<button type="button" class="pe-op pe-heroe' + (it.heroe === h.clave ? " on" : "") + '" data-h="' + esc(h.clave) + '" data-rar="' + esc(rarezaBonita(h.rareza)) + '">' +
          '<img class="pe-op-img" src="assets/img/heroes/' + esc(h.clave) + '.jpg" alt="" loading="lazy"><b>' + esc(h.nombre) + "</b><em>" + esc(rarezaBonita(h.rareza)) + "</em></button>";
      }).join("") + "</div>";
    Array.prototype.forEach.call(cuerpo.querySelectorAll("[data-r]"), function (b) {
      b.onclick = function () {
        Array.prototype.forEach.call(cuerpo.querySelectorAll("[data-r]"), function (x) { x.classList.toggle("on", x === b); });
        var r = b.getAttribute("data-r");
        Array.prototype.forEach.call(cuerpo.querySelectorAll(".pe-heroe"), function (x) { x.hidden = !!r && x.getAttribute("data-rar") !== r; });
      };
    });
    Array.prototype.forEach.call(cuerpo.querySelectorAll("[data-h]"), function (b) {
      b.onclick = function () { cerrar({ premio: "heroe_fijo", heroe: b.getAttribute("data-h"), cantidad: 0, sorteo: "" }); };
    });
  }
  function pasoCantidad(cuerpo, titulo, it, k, cerrar) {
    var part = k === "participaciones", xp = k === "xp";
    titulo.textContent = part ? "¿Cuántas participaciones, y de qué sorteo?" : xp ? "¿Cuánta experiencia?" : "¿Cuántos créditos?";
    var rapidas = part ? [1, 2, 3, 5] : xp ? [50, 100, 200, 500] : [25, 50, 100, 200];
    var actual = Number(it.premio === k && it.cantidad) || rapidas[1];
    var sorteos = part ? sorteosDe(DATOS) : [];
    cuerpo.innerHTML = '<div class="pe-cant">' + imgPremio({ premio: k }, "pe-op-img grande") +
      '<div><p class="pe-rapidas">' + rapidas.map(function (n) { return '<button type="button" data-n="' + n + '"' + (n === actual ? ' class="on"' : "") + ">" + n + (part ? "" : xp ? " xp" : " ◈") + "</button>"; }).join("") + "</p>" +
      '<label class="h-campo">O escribe cuánto<input type="number" class="pe-n" min="1" max="' + (part ? 10 : 100000) + '" value="' + actual + '"></label>' +
      (part ? '<label class="h-campo">Del sorteo<select class="pe-s">' + (sorteos.length ? sorteos.map(function (r) { return '<option value="' + esc(r.docId) + '">' + esc(((r.stargateSorteo || {}).premio) || r.title) + "</option>"; }).join("")
                                                                  : '<option value="">— no hay ningún sorteo abierto: créalo en «Sorteos» —</option>') + "</select></label>" : "") +
      '<p class="pe-cant-b"><button type="button" class="btn primary" data-ok>Elegir</button></p></div></div>';
    var inp = $(".pe-n", cuerpo);
    Array.prototype.forEach.call(cuerpo.querySelectorAll("[data-n]"), function (b) {
      b.onclick = function () { inp.value = b.getAttribute("data-n"); Array.prototype.forEach.call(cuerpo.querySelectorAll("[data-n]"), function (x) { x.classList.toggle("on", x === b); }); };
    });
    $("[data-ok]", cuerpo).onclick = function () {
      var n = Math.floor(Number(inp.value) || 0), s = part ? ($(".pe-s", cuerpo) || {}).value || "" : "";
      if (n < 1 || (part && n > 10)) { inp.focus(); return; }
      if (part && !s) return;
      cerrar({ premio: k, heroe: "", cantidad: n, sorteo: s });
    };
  }

  // ---------------------------------------------------------------- el zoco
  /**
   * 🔴 13-sep · EL REGISTRO DEL ZOCO. Cada trueque entre reclutas, con lo que se dio, lo que se pidió y
   * sus mensajes (Norberto: «un mensaje corto… que ve también el docente»). Un docente puede
   * deshacer un trueque cerrado: lo hace el servidor, y si algo ya no se puede devolver, lo dice.
   */
  var NOM_ESTADO = { abierto: "<img class=ico src=assets/img/iconos/p/tiempo.png alt> En marcha", aceptado: "<img class=ico src=assets/img/iconos/p/hecho.png alt> Cambiado", rechazado: "✕ Rechazado", retirado: "↩ Retirado",
    caducado: "<img class=ico src=assets/img/iconos/p/tiempo.png alt> Caducado", anulado: "<img class=ico src=assets/img/iconos/p/aviso.png alt> Anulado", vendido: "<img class=ico src=assets/img/iconos/p/monedas.png alt> Se lo quedó otro", deshecho: "↺ Deshecho" };
  /**
   * 15-sep · CUÁNDO SE ABRE EL ZOCO, CON SU FECHA (Norberto: «indica en el Zoco la fecha exacta que se abre»). Es el
   * capítulo 5 (c5): su semana del curso, con las no lectivas saltadas, y si el referente lo abrió antes, se dice.
   */
  var MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var DIAS_L = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  function diaLargo(iso) { var d = window.SGSEMANAS.fecha(iso); return DIAS_L[d.getDay()] + " " + d.getDate() + " de " + MESES_L[d.getMonth()]; }
  function zocoCuando() {
    var S = DATOS.proyecto.stargate || {}, SS = window.SGSEMANAS, tipo = S.tipo === "PUA" ? "PUA" : "REGULAR";
    var c5 = (window.SG_CAPITULOS || []).filter(function (c) { return c.clave === "c5"; })[0];
    var sem = (c5 && (c5.semanas || {})[tipo]) || 5;
    if (!S.inicio || !SS) return "<img class=ico src=assets/img/iconos/p/calendario.png alt> Se abre en la <b>semana " + sem + "</b>.";
    var dia = SS.inicioDeSemana(S.inicio, sem, S.pausas), hoy = SS.iso(new Date());
    if ((S.capitulosAbiertos || {}).c5 && dia > hoy) return "<img class=ico src=assets/img/iconos/p/abierto.png alt> <b>Abierto antes de tiempo</b>: su fecha era el " + diaLargo(dia) + " (semana " + sem + ").";
    return dia <= hoy ? "<img class=ico src=assets/img/iconos/p/hecho.png alt> Abierto desde el <b>" + diaLargo(dia) + "</b> (semana " + sem + ")."
                      : "<img class=ico src=assets/img/iconos/p/calendario.png alt> Se abre el <b>" + diaLargo(dia) + "</b> (semana " + sem + ").";
  }
  function verZoco(t) {
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>El Zoco Estelar</h3><p class="muted">Cargando los trueques…</p></div>';
    MOTOR.zocoTratosGrupo(PER).then(function (lista) {
      var pieza = function (id) {
        // 14-sep · las participaciones del sorteo también se revenden en el Zoco
        if (/__sorteo[a-z0-9]*$/i.test(String(id))) {
          var t = ((DATOS && DATOS.recompensas) || []).filter(function (r) { return r.docId === id; })[0];
          return "<img class=ico src=assets/img/iconos/p/ticket.png alt> Participación · " + esc(((t && t.stargateSorteo) || {}).premio || "sorteo");
        }
        var k = String(id).split("__").pop(), h = /^heroe_/.test(k), c = k.replace(/^(heroe|cromo)_/, "");
        var x = h ? (window.SG_CATALOGO && SG_CATALOGO.heroes || []).filter(function (y) { return y.clave === c; })[0]
                  : (window.SG_CATALOGO && SG_CATALOGO.cromos || []).filter(function (y) { return y.clave === c; })[0];
        return (h ? "<img class=ico src=assets/img/iconos/p/escudo.png alt> " : "<img class=ico src=assets/img/iconos/p/estrella.png alt> ") + esc((x && x.nombre) || c);
      };
      // una participación de un sorteo ya hecho no se puede devolver: su trueque ya no se deshace
      var sorteada = function (id) { return ((DATOS && DATOS.recompensas) || []).some(function (r) { return r.docId === id && r.isRaffleCompleted; }); };
      var pq = function (q) { if (!q) return "—"; var o = []; if (q.creditos) o.push(q.creditos + " ◈"); (q.piezas || []).forEach(function (id) { o.push(pieza(id)); }); return o.join(" + ") || "nada"; };
      var cerrados = lista.filter(function (x) { return x.estado === "aceptado"; }).length;
      $("#c-cuerpo").innerHTML = '<div class="card"><h3>El Zoco Estelar</h3>' +
        '<p class="zoco-abre">' + zocoCuando() + '</p>' +
        '<p class="small muted">Los trueques entre tu alumnado: ' + lista.length + ' tratos, ' + cerrados + ' cerrados. ' +
        'Lo que se ofrece queda apartado hasta que responden; cada trato, 3 pasos como mucho.</p>' +
        (lista.length ? '<div class="tabla-envoltura"><table class="tabla zoco-tabla"><thead><tr><th>Estado</th><th>Vende</th><th>Qué</th><th>Compra</th><th>Ofrece / paga</th><th>Mensajes</th><th></th></tr></thead><tbody>' +
          lista.map(function (x) {
            var pago = x.estado === "aceptado" ? (x.pagado || x.ofrece) : (x.pide || x.ofrece);
            var estado = x.estado === "anulado" && x.motivo === "sorteo" ? "<img class=ico src=assets/img/iconos/p/ticket.png alt> Anulado: ya se sorteó" : (NOM_ESTADO[x.estado] || esc(x.estado));
            return '<tr><td>' + estado + '</td><td>' + esc(x.vende.alias) + '</td><td>' + pieza(x.pieza.id) +
              '</td><td>' + esc(x.compra.alias) + '</td><td>' + pq(pago) + '</td><td class="small">' +
              (x.mensajes || []).map(function (m) { return "<b>" + esc(m.de === "vendedor" ? x.vende.alias : x.compra.alias) + ":</b> «" + esc(m.texto) + "»"; }).join("<br>") +
              '</td><td>' + (x.estado === "aceptado" && !sorteada(x.pieza.id) ? '<button class="btn min" data-deshacer-z="' + esc(x.id) + '">Deshacer</button>' : "") + '</td></tr>';
          }).join("") + '</tbody></table></div>' : '<p class="small muted">Todavía no ha habido ningún trueque.</p>') + '</div>';
      Array.prototype.forEach.call(app.querySelectorAll("[data-deshacer-z]"), function (b) {
        b.onclick = async function () {
          // todo o nada: solo se deshace si cada uno conserva lo que recibió (si no, se crearía algo de la nada)
          if (!(await window.SG.preguntar({ titulo: "¿Deshacer este trueque?", texto: "Cada cosa vuelve a su dueño. Solo se puede si los dos conservan lo que recibieron.",
            si: "Deshacer el trueque", peligro: true }))) return;
          b.disabled = true;
          MOTOR.zocoDeshacer(b.getAttribute("data-deshacer-z")).then(function () {
            aviso("Deshecho: cada cosa ha vuelto a su dueño.", true);
            verZoco(t);
          }).catch(function (e) {
            b.disabled = false;
            // el servidor nombra las piezas por su clave (H05_eco): aquí, por su nombre
            aviso(String(e.message || e).replace(/\b([A-Z]\d{1,2}_[a-z0-9_]+)\b/g, function (m) {
              var x = ((window.SG_CATALOGO && SG_CATALOGO.heroes) || []).concat((window.SG_CATALOGO && SG_CATALOGO.cromos) || [])
                .filter(function (y) { return y.clave === m; })[0];
              return x ? "«" + x.nombre + "»" : m;
            }));
          });
        };
      });
    }).catch(function (e) { $("#c-cuerpo").innerHTML = '<div class="card"><p class="malo">' + esc(e.message) + "</p></div>"; });
  }

  // ---------------------------------------------------------------- equipo docente
  /**
   * 15-sep · EL EQUIPO, PERSONA A PERSONA. Norberto: «no sé o no es intuitivo cómo cambiar el equipo docente, cómo
   * ver sus grupos…». Era una tabla de solo lectura con dos formularios debajo. Ahora cada persona es una tarjeta con
   * lo que se le puede hacer AHÍ: hacerla referente o docente, pasar su alumnado a otro, quitarla del equipo (en el
   * servidor: `stargateEquipo` con `quitar`), ir a su escuadrón, y en qué otros de tus grupos está.
   */
  var ABRIR_ESC = "", IR_ESC = false;   // el escuadrón abierto (y si hay que llevar la vista hasta él: «Ver su escuadrón»)
  function verEquipo(t) {
    var docs = t.docentes_full || [], yo = String((YO && (YO.correo || YO.email)) || "").toLowerCase();
    var facc = DATOS.proyecto.factions || [];
    var refs = docs.filter(function (d) { return d.rol === "referente"; }).length;
    var conEsc = function (nombre) { return facc.filter(function (x) { return x.teacherName === nombre; })[0]; };
    var enOtros = function (correo) {
      if (!correo) return [];
      return (PERS || []).filter(function (p) { return p.id !== PER && (p.equipo || []).some(function (d) { return d.correo === correo; }); })
        .map(function (p) { var d = p.equipo.filter(function (x) { return x.correo === correo; })[0]; return { id: p.id, nombre: p.nombre, rol: d.rol }; });
    };
    var tarjeta = function (d, i) {
      var correo = String(d.correo || "").toLowerCase(), f = conEsc(d.nombre);
      var n = t.reclutas.filter(function (r) { return r.profe === d.nombre; }).length, soyYo = !!correo && correo === yo;
      var vital = VITALICIOS_WEB.indexOf(correo) >= 0, esRef = d.rol === "referente", otros = enOtros(correo);
      var destinos = docs.filter(function (x) { return x.nombre !== d.nombre && conEsc(x.nombre); });
      return '<article class="eq-p' + (esRef ? " ref" : "") + '">' +
        '<div class="eq-cab">' + (f && f.imageUrl ? '<img src="' + esc(f.imageUrl) + '" alt="" width="52" height="52" loading="lazy">' : '<span class="eq-sin" aria-hidden="true"><img class=ico src=assets/img/iconos/p/gente.png alt></span>') +
          '<div class="eq-quien"><h4>' + esc(d.nombre || correo) + (soyYo ? ' <span class="chip">tú</span>' : "") + "</h4>" +
          '<p class="small muted">' + esc(correo || "sin correo") + "</p></div>" +
          '<span class="eq-rol' + (esRef ? " ref" : "") + '"' + (vital ? ' title="Referente vitalicio: manda en todos los grupos"' : "") + '>' + (vital ? "<img class=ico src=assets/img/iconos/p/estrella.png alt> Vitalicio" : esRef ? "<img class=ico src=assets/img/iconos/p/estrella.png alt> Referente" : "Docente") + "</span></div>" +
        '<p class="eq-esc">' + (f ? "<img class=ico src=assets/img/iconos/p/escudo.png alt> <b>" + esc(f.name) + "</b> · " + n + " recluta" + (n === 1 ? "" : "s") +
            ' <button type="button" class="eq-lnk" data-ver-esc="' + esc(d.nombre) + '">Ver su escuadrón →</button>'
          : '<span class="muted">Sin escuadrón (coordina, o se incorporó después)</span>' + (n ? " · " + n + " reclutas a su nombre" : "")) + "</p>" +
        (otros.length ? '<p class="small eq-otros">También en ' + otros.map(function (g) {
            return '<a href="consola.html?per=' + encodeURIComponent(g.id) + '&tab=equipo">' + esc(g.nombre) + "</a>" + (g.rol === "referente" ? " <img class=ico src=assets/img/iconos/p/estrella.png alt>" : ""); }).join(" · ") + "</p>" : "") +
        (n && destinos.length ? '<div class="eq-pasar"><span>Pasar su alumnado a</span><select data-dest="' + i + '" aria-label="A quién pasa su alumnado">' +
            destinos.map(function (x) { return "<option>" + esc(x.nombre) + "</option>"; }).join("") + "</select>" +
            '<button type="button" class="btn min" data-pasar="' + i + '">Pasar</button></div>' : "") +
        '<div class="eq-acc">' +
          (vital ? "" : '<button type="button" class="btn min" data-rol="' + i + '">' + (esRef ? "Pasar a docente" : "<img class=ico src=assets/img/iconos/p/estrella.png alt> Hacer referente") + "</button>") +
          (vital || soyYo ? "" : '<button type="button" class="btn min peligro" data-quitar="' + i + '">Quitar del equipo</button>') +
        "</div></article>";
    };
    // los reclutas de alguien que ya no está en el equipo (su nombre no casa con nadie)
    var huerfanos = {}; t.reclutas.forEach(function (r) {
      if (r.profe && !docs.some(function (d) { return d.nombre === r.profe; })) huerfanos[r.profe] = (huerfanos[r.profe] || 0) + 1; });
    var nomsH = Object.keys(huerfanos), conDestino = docs.filter(function (x) { return conEsc(x.nombre); });
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Equipo docente</h3>' +
      '<p class="small muted">Cada persona, con lo que se le puede hacer. Entran con <b>su cuenta de Google</b>: añadirla es darle entrada al grupo; quitarla, quitársela.' +
      (VITALICIOS_WEB.indexOf(yo) >= 0 ? ' Todo el profesorado de todos los grupos está en <a href="profesores.html"><img class=ico src=assets/img/iconos/p/gente.png alt> Profesores</a>.' : "") + "</p>" +
      '<div class="eq-lista">' + docs.map(tarjeta).join("") + "</div></div>" +
      (nomsH.length && conDestino.length ? '<div class="card"><h3><img class=ico src=assets/img/iconos/p/aviso.png alt> Alumnado sin Comandante</h3>' +
        '<p class="small muted">Su Comandante ya no está en el equipo. Pásalo a alguien que sí esté (y entra en su escuadrón).</p>' +
        '<p class="eq-pasar"><label>De<select id="t-de">' + nomsH.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("") + "</select></label>" +
        '<label>A<select id="t-a">' + conDestino.map(function (d) { return "<option>" + esc(d.nombre) + "</option>"; }).join("") + "</select></label>" +
        '<button type="button" class="btn" id="t-ir">Pasar el alumnado</button></p></div>' : "") +
      /**
       * 🔴 AÑADIR A ALGUIEN, que hasta el 13-sep no se podía. El equipo se fijaba al CREAR el grupo y después era de
       * solo lectura: un docente que se incorpora a mitad de curso o un co-referente obligaban a sembrar otra vez.
       */
      '<div class="card"><h3><img class=ico src=assets/img/iconos/p/anadir.png alt> Añadir a alguien al equipo</h3>' +
      '<p class="small muted">El correo tiene que ser <b>el de su cuenta de Google</b>: es con el que entrará, y es lo que el servidor mira para dejarle pasar.</p>' +
      '<div class="eq-form"><label>Nombre<input id="e-nom" placeholder="Cómo aparece ante su clase" autocomplete="off"></label>' +
      '<label>Correo<input id="e-mail" type="email" placeholder="nombre@ejemplo.com" autocomplete="off"></label>' +
      '<label>Rol<select id="e-rol"><option value="docente">Docente (imparte)</option><option value="referente">Referente (lleva el grupo)</option></select></label></div>' +
      '<p><button type="button" class="btn primary" id="e-add">Añadir a este grupo</button> ' +
      '<button type="button" class="btn min" id="e-todos">Hacerle referente de TODOS mis grupos</button></p>' +
      '<p class="small muted">Añadirle no le da escuadrón ni alumnado: si va a impartir, pásale después el alumnado de alguien desde su tarjeta.</p></div>';

    var hecho = async function (b, fn, txt) {
      b.disabled = true;
      try { await fn(); await refrescar(); TAB = "equipo"; pintar(); aviso(txt, true); }
      catch (e) { b.disabled = false; aviso(e.message); }
    };
    Array.prototype.forEach.call(app.querySelectorAll("[data-rol]"), function (b) {
      b.onclick = async function () {
        var d = docs[Number(b.getAttribute("data-rol"))], esRef = d.rol === "referente", soyYo = String(d.correo || "").toLowerCase() === yo;
        if (esRef && refs <= 1) return aviso("Es la única persona referente de este grupo: nombra antes a otra.");
        if (esRef && soyYo && !(await window.SG.preguntar({ titulo: "¿Dejar de ser referente de este grupo?", texto: "Ya no verás sus ajustes ni su equipo.",
          si: "Dejar de ser referente", peligro: true }))) return;
        if (!esRef && !(await window.SG.preguntar({ titulo: "¿Hacer a " + (d.nombre || d.correo) + " referente de este grupo?",
          texto: "Verá el alumnado, los correos del equipo y los ajustes.", si: "Hacer referente" }))) return;
        hecho(b, function () { return MOTOR.anadirDocente(PER, { nombre: d.nombre, correo: d.correo, rol: esRef ? "docente" : "referente" }); },
              (d.nombre || d.correo) + (esRef ? " ya es docente (sin lo de referente)." : " ya es referente de este grupo."));
      };
    });
    Array.prototype.forEach.call(app.querySelectorAll("[data-pasar]"), function (b) {
      b.onclick = async function () {
        var i = Number(b.getAttribute("data-pasar")), d = docs[i], a = app.querySelector('[data-dest="' + i + '"]').value;
        if (!(await window.SG.preguntar({ titulo: "¿Pasar todo el alumnado de " + d.nombre + " a " + a + "?",
          texto: "Cambian de Comandante y de escuadrón de una vez.", si: "Pasar el alumnado" }))) return;
        b.disabled = true;
        MOTOR.traspasar(PER, d.nombre, a).then(function (n) { return refrescar().then(function () { TAB = "equipo"; pintar(); aviso(n + " reclutas pasados a " + a + ".", true); }); })
          .catch(function (e) { b.disabled = false; aviso(e.message); });
      };
    });
    Array.prototype.forEach.call(app.querySelectorAll("[data-quitar]"), function (b) {
      b.onclick = async function () {
        var i = Number(b.getAttribute("data-quitar")), d = docs[i], n = t.reclutas.filter(function (r) { return r.profe === d.nombre; }).length;
        if (d.rol === "referente" && refs <= 1) return aviso("Es la única persona referente de este grupo: nombra antes a otra.");
        var sel = app.querySelector('[data-dest="' + i + '"]');
        if (n && !sel) return aviso(d.nombre + " tiene " + n + " reclutas y no hay otro docente con escuadrón a quien pasarlos.");
        if (!(await window.SG.preguntar({ titulo: "¿Quitar a " + (d.nombre || d.correo) + " del equipo de este grupo?",
          texto: (n ? "Antes, sus " + n + " reclutas pasan a " + sel.value + ".\n\n" : "") + "Dejará de ver el grupo. Se le puede volver a añadir cuando quieras.",
          si: "Quitar del equipo", peligro: true }))) return;
        b.disabled = true;
        try {
          if (n) await MOTOR.traspasar(PER, d.nombre, sel.value);
          await MOTOR.quitarDocente(PER, d.correo);
          await refrescar(); TAB = "equipo"; pintar();
          aviso((d.nombre || d.correo) + " ya no está en el equipo" + (n ? "; su alumnado es ahora de " + sel.value : "") + ".", true);
        } catch (e) {
          b.disabled = false;
          aviso(/not-found|internal/.test(String(e && e.code)) && !/[áéíóú]/.test(String(e && e.message))
            ? "Falta desplegar en el servidor «stargateEquipo» con la opción de quitar." : e.message);
        }
      };
    });
    Array.prototype.forEach.call(app.querySelectorAll("[data-ver-esc]"), function (b) {
      b.onclick = function () { ABRIR_ESC = b.getAttribute("data-ver-esc"); IR_ESC = true; TAB = "escuadrones"; pintar(); };
    });
    // --- añadir a este grupo
    $("#e-add").onclick = async function () {
      var persona = { nombre: $("#e-nom").value, correo: $("#e-mail").value, rol: $("#e-rol").value };
      if (!persona.correo.trim()) return aviso("Escribe su correo.");
      $("#e-add").disabled = true;
      try { var r = await MOTOR.anadirDocente(PER, persona); await refrescar(); TAB = "equipo"; pintar();
            aviso(r.nombre + " ya está en el equipo como " + r.rol + ".", true); }
      catch (e) { $("#e-add").disabled = false; aviso(e.message); }
    };
    // --- referente de todos
    // 🔴 «De todos» se escribe grupo a grupo, no es una marca global: `misPERs` pregunta a Firestore
    // por los grupos donde tu correo está en `coTeacherEmails`, y esa pregunta la responde el
    // servidor. Una marca guardada en otro sitio no le haría ver ni un grupo.
    $("#e-todos").onclick = async function () {
      var persona = { nombre: $("#e-nom").value, correo: $("#e-mail").value, rol: "referente" };
      if (!persona.correo.trim()) return aviso("Escribe su correo.");
      var ids = (PERS || []).map(function (p) { return p.id; });
      if (!(await window.SG.preguntar({ titulo: "¿Hacer a «" + (persona.nombre || persona.correo) + "» referente de tus " + ids.length + " grupo(s)?",
        texto: "Verá el alumnado, los correos y los ajustes de todos.", si: "Hacer referente" }))) return;
      $("#e-todos").disabled = true;
      try {
        var r = await MOTOR.referenteEnTodos(persona, ids);
        await refrescar(); TAB = "equipo"; pintar();
        // Se dice en cuántos ha entrado Y en cuántos no: creer que alguien tiene acceso a ocho
        // grupos cuando lo tiene a seis es peor que el fallo original.
        aviso(r.fallos.length
          ? "Añadido en " + r.hechos.length + " grupo(s). NO se ha podido en " + r.fallos.length +
            ": " + r.fallos.map(function (f) { return f.per; }).join(", ")
          : "Ya es referente de tus " + r.hechos.length + " grupo(s).", !r.fallos.length);
      } catch (e) { aviso(e.message); $("#e-todos").disabled = false; }
    };
    if ($("#t-ir")) $("#t-ir").onclick = async function () {
      var de = $("#t-de").value, a = $("#t-a").value;
      if (!(await window.SG.preguntar({ titulo: "¿Pasar todo el alumnado de " + de + " a " + a + "?", texto: "Cambian de Comandante y de escuadrón de una vez.",
        si: "Pasar el alumnado" }))) return;
      try { var n = await MOTOR.traspasar(PER, de, a); await refrescar(); TAB = "equipo"; pintar(); aviso(n + " reclutas pasados a " + a, true); }
      catch (e) { aviso(e.message); }
    };
  }

  // ---------------------------------------------------------------- ajustes
  /**
   * LOS ESCUADRONES.
   *
   * 🔴 Cada docente tiene el suyo y el alumnado lo hereda al elegir Comandante. Aquí se ve quién
   * está en cada uno y cómo van — que es lo que convierte diez nombres bonitos en equipos de verdad.
   *
   * El nombre y el emblema salen del catálogo y se reparten al sembrar: no se tocan desde aquí a
   * propósito. Cambiar el nombre de un escuadrón a mitad de curso le quita a su gente la cosa a la
   * que pertenecen, que es justo lo contrario de lo que hace un escuadrón.
   *
   * 15-sep · Y SE ABREN. Norberto: «el referente debe poder clicar en el escuadrón y ver toda la info: docente,
   * estudiantes, fichas de estudiante… además de ver su escuadrón, necesita ver el resto para resolver problemas».
   * Cada escuadrón se despliega con su Comandante, sus cifras y su gente; cada fila abre la ficha, como en Mi gente.
   */
  function verEscuadrones(t) {
    var esc7 = (t.escuadrones || []);
    if (!esc7.length) {
      $("#c-cuerpo").innerHTML = '<div class="card"><h3>Escuadrones</h3>' +
        '<p class="small muted">Este grupo se sembró sin escuadrones. Se crean al crear el grupo, ' +
        'uno por docente del equipo.</p></div>';
      return;
    }
    var caps = capsDelGrupo(t), mio = miNombreAqui();
    var conGente = esc7.map(function (e) {
      var suyos = (t.reclutas || []).filter(function (r) { return r.profe === e.comandante; });
      var media = suyos.length ? Math.round(suyos.reduce(function (a, r) { return a + r.xp; }, 0) / suyos.length) : 0;
      var ins = suyos.length ? Math.round(10 * suyos.reduce(function (a, r) { return a + r.n; }, 0) / suyos.length) / 10 : 0;
      return { e: e, suyos: suyos, media: media, ins: ins };
    }).sort(function (a, b) { return b.media - a.media; });
    var huerfanos = (t.reclutas || []).filter(function (r) {
      return !esc7.some(function (e) { return e.comandante === r.profe; });
    });
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Escuadrones</h3>' +
      '<p class="small muted">Uno por docente. El alumnado entra en el de su Comandante al alistarse. ' +
      'Se comparan por <b>media de xp</b>: sumando ganaría siempre el más numeroso. <b>Pulsa un escuadrón</b> para ver su gente, y a alguien para abrir su ficha.</p>' +
      conGente.map(function (x, i) {
        var d = (t.docentes_full || []).filter(function (y) { return y.nombre === x.e.comandante; })[0] || {};
        return '<details class="esc-det"' + (ABRIR_ESC === x.e.comandante ? " open" : "") + ' data-esc="' + esc(x.e.comandante) + '">' +
          '<summary class="esc-card' + (i === 0 && x.suyos.length ? " lider" : "") + '">' +
          '<div class="esc-pos">' + (i + 1) + "</div>" +
          (x.e.emblema ? '<img class="esc-emb" loading="lazy" src="' + esc(x.e.emblema) + '" alt="">' : "") +
          '<div class="esc-txt"><b>' + esc(x.e.nombre) + (x.e.comandante === mio ? ' <span class="chip">el tuyo</span>' : "") + "</b>" +
          (x.e.lema ? "<em>«" + esc(x.e.lema) + "»</em>" : "") +
          '<span class="small muted">' + esc(x.e.comandante) + " · " + x.suyos.length +
          " recluta" + (x.suyos.length === 1 ? "" : "s") +
          (x.e.origen ? " · " + esc(x.e.origen) : "") + "</span></div>" +
          '<div class="esc-val">' + x.media + ' xp<span class="esc-ver">Ver su gente</span></div></summary>' +
          '<div class="esc-cuerpo"><div class="esc-datos">' +
            '<div><span>Comandante</span><b>' + esc(x.e.comandante) + "</b>" + (d.correo ? "<em>" + esc(d.correo) + "</em>" : "") +
              (d.rol === "referente" ? "<em><img class=ico src=assets/img/iconos/p/estrella.png alt> referente</em>" : "") + "</div>" +
            "<div><span>Reclutas</span><b>" + x.suyos.length + "</b></div>" +
            "<div><span>Media de xp</span><b>" + x.media + "</b></div>" +
            "<div><span>Insignias de media</span><b>" + String(x.ins).replace(".", ",") + "</b></div></div>" +
            (x.suyos.length ? tablaGente(x.suyos.map(function (r) { return [r, t.reclutas.indexOf(r)]; }), caps, false)
                            : '<p class="small muted">Todavía no se ha alistado nadie en este escuadrón.</p>') +
          "</div></details>";
      }).join("") +
      (huerfanos.length
        ? '<p class="small" style="margin-top:14px;color:var(--amber)"><img class=ico src=assets/img/iconos/p/aviso.png alt> <b>' + huerfanos.length +
          "</b> recluta" + (huerfanos.length === 1 ? "" : "s") + " sin escuadrón: su Comandante ya no " +
          "está en el equipo. Pásalos a otro docente desde la pestaña <b>Equipo docente</b>.</p>"
        : "") +
      "</div>";
    Array.prototype.forEach.call(app.querySelectorAll(".esc-det"), function (dt) {
      dt.addEventListener("toggle", function () { if (dt.open) ABRIR_ESC = dt.getAttribute("data-esc"); else if (ABRIR_ESC === dt.getAttribute("data-esc")) ABRIR_ESC = ""; });
    });
    cablearFilas(app, t);
    if (!(EVID && EVID_PER === PER)) cargarEvid(t);
    var abierto = app.querySelector(".esc-det[open]");
    if (abierto && IR_ESC) { IR_ESC = false; try { abierto.scrollIntoView({ block: "start", behavior: "instant" }); } catch (e) {} }
  }

  // ---------------------------------------------------------------- 🎟️ los sorteos
  /**
   * LOS SORTEOS DEL GRUPO (14-sep). Norberto: «quiero dar más poderes y opciones al profe referente
   * para dinamizar las clases… el sorteo de dos licencias de Genially de año completo, a partir de la
   * semana 6: que los estudiantes puedan comprar participaciones y el profe regalarlas, o que el
   * referente embeba participaciones».
   *
   * Aquí se ven (quién lleva cuántas papeletas), se cambian, se crean y se SORTEAN. El sorteo lo hace
   * el SERVIDOR (GamificaPro, `stargateSortear`: una papeleta por participación, nadie gana dos, una
   * sola vez); esta pantalla solo lo proyecta, con su ruleta, para que la clase lo vea en directo.
   */
  function sorteosDelGrupo() {
    return ((DATOS && DATOS.recompensas) || []).filter(function (r) { return r.systemEffect === "lottery_ticket"; })
      .sort(function (a, b) { return Number(a.ticketDeadline || 0) - Number(b.ticketDeadline || 0); });
  }
  function premioDelSorteo(t) { return ((DATOS && DATOS.recompensas) || []).filter(function (r) { return r.docId === t.linkedItemId; })[0] || {}; }
  function bomboDe(t) {
    return ((DATOS && DATOS.perfiles) || []).filter(function (p) {
      // (15-sep · como en el servidor: la cuenta congelada no entra en el bombo; si se descongela, vuelve)
      return Number((p.lotteryEntries || {})[t.docId] || 0) > 0 && !p.graduatedAt && p.isTeacherPreview !== true && !p.stargateCongelado; })
      .map(function (p) {
        var pr = (DATOS.privados || {})[p.id] || {};
        return { ficha: p.id, alias: p.displayName || "", n: Math.floor(Number(p.lotteryEntries[t.docId])),
                 nombre: ((pr.firstName || "") + " " + (pr.lastName || "")).trim(), correo: pr.email || "" }; })
      .sort(function (a, b) { return b.n - a.n; });
  }
  function diaDe(ms) { return ms ? new Date(Number(ms)).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }) : "—"; }
  function aFecha(ms) { if (!ms) return ""; var d = new Date(Number(ms)); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function deFecha(v) { return v ? new Date(v + "T00:00:00").getTime() : 0; }
  function estadoSorteo(t) {
    var ahora = Date.now();
    if (t.stargateRetirado) return ["retirado", "<img class=ico src=assets/img/iconos/p/aviso.png alt> Quitado de este grupo"];
    if (t.isRaffleCompleted) return ["hecho", "<img class=ico src=assets/img/iconos/p/rankings.png alt> Sorteado el " + diaDe(t.raffleResolvedAt)];
    if (Number(t.availableFrom) > ahora) return ["pronto", "<img class=ico src=assets/img/iconos/p/tiempo.png alt> A la venta desde el " + diaDe(t.availableFrom)];
    if (Number(t.ticketDeadline) && Number(t.ticketDeadline) <= ahora) return ["listo", "<img class=ico src=assets/img/iconos/p/dados.png alt> Venta cerrada: listo para sortear"];
    return ["venta", "<img class=ico src=assets/img/iconos/p/hecho.png alt> A la venta · se sortea el " + diaDe(t.ticketDeadline)];
  }
  function formSorteo(t, P) {
    var S = (t && t.stargateSorteo) || {}, hoy = Date.now();
    var v = t ? { premio: S.premio || P.title || "", descripcion: t.description || "", ganadores: Number(P.globalStockInitial || S.ganadores || 1),
                  coste: t.cost, maximo: t.maxPerUser || "", desde: t.availableFrom, fecha: t.ticketDeadline }
              : { premio: "", descripcion: "", ganadores: 1, coste: 20, maximo: "", desde: hoy, fecha: hoy + 14 * 864e5 };
    return '<div class="sr-form" data-doc="' + esc(t ? t.docId : "") + '">' +
      '<label class="h-campo sr-f-premio">Qué se sortea<input class="sr-premio" value="' + esc(v.premio) + '" placeholder="Una licencia de…" maxlength="80"></label>' +
      '<label class="h-campo sr-f-desc">Cómo lo verá el alumnado<input class="sr-desc" value="' + esc(v.descripcion) + '" placeholder="Una frase: qué es y por qué merece la pena" maxlength="300"></label>' +
      '<label class="h-campo h-num">Ganadores<input class="sr-gan" type="number" min="1" max="20" value="' + esc(v.ganadores) + '"></label>' +
      '<label class="h-campo h-num">◈ la participación<input class="sr-coste" type="number" min="0" value="' + esc(v.coste) + '"></label>' +
      '<label class="h-campo h-num">Máx. por persona<input class="sr-max" type="number" min="0" value="' + esc(v.maximo) + '" placeholder="sin tope"></label>' +
      '<label class="h-campo h-fecha">A la venta desde<input class="sr-desde" type="date" value="' + aFecha(v.desde) + '"></label>' +
      '<label class="h-campo h-fecha">Se sortea el<input class="sr-fecha" type="date" value="' + aFecha(v.fecha) + '"></label>' +
      // 🌐 17-sep · al crearlo, a qué grupos va; al cambiarlo, se cambia en todos los suyos
      (t ? (gestionados().length > 1 ? '<p class="small muted sr-f-nota"><img class=ico src=assets/img/iconos/p/varios.png alt> Se cambia en todos los grupos donde está este sorteo (menos donde ya se haya hecho).</p>' : "")
         : (gestionados().length > 1 ? selectorGrupos("sr-g-nuevo", PER ? [PER] : "todos") : "")) +
      '<p class="sr-f-pie"><button class="btn primary sr-guardar">' + (t ? "Guardar los cambios" : "Crear el sorteo") + '</button> ' +
      '<button class="btn sr-cancelar">Cancelar</button></p></div>';
  }
  // ---------------------------------------------------------------- 🌐 «¿para qué grupos?» (sorteos y ofertas)
  /**
   * 🌐 17-sep · Norberto: «lo mismo con ofertas y sorteos: comparten la misma página de configuración, pero puedo ajustar
   * individualmente a qué grupos afecta (todos o unos pocos)». Los premios por enlace lo llevan en su tarjeta; sorteos y
   * ofertas, en su formulario y en cada uno ya creado.
   */
  function selectorGrupos(nombre, sel) {
    var g = gestionados(), todos = sel === "todos";
    return '<fieldset class="pe-grupos sg-grupos" data-grupos="' + esc(nombre) + '"><legend>¿Para qué grupos?</legend>' +
      '<label class="pe-radio"><input type="radio" name="' + esc(nombre) + '" value="todos"' + (todos ? " checked" : "") + "> <img class=ico src=assets/img/iconos/p/varios.png alt> Todos tus grupos (" + g.length + ")</label>" +
      '<label class="pe-radio"><input type="radio" name="' + esc(nombre) + '" value="elegir"' + (todos ? "" : " checked") + "> Solo estos:</label>" +
      '<span class="pe-chips">' + g.map(function (id) {
        var on = todos || (sel || []).indexOf(id) >= 0;
        return '<label class="pe-chip"><input type="checkbox" value="' + esc(id) + '"' + (on ? " checked" : "") + (todos ? " disabled" : "") + "> " + esc(nombreDeGrupo(id)) + "</label>";
      }).join("") + "</span></fieldset>";
  }
  function cablearSelectorGrupos(caja) {
    var fs = caja && caja.querySelector("[data-grupos]"); if (!fs) return;
    Array.prototype.forEach.call(fs.querySelectorAll("input[type=radio]"), function (r) {
      r.onchange = function () {
        var todos = r.value === "todos" && r.checked;
        Array.prototype.forEach.call(fs.querySelectorAll(".pe-chips input"), function (c) { c.disabled = todos; if (todos) c.checked = true; });
      };
    });
  }
  function gruposElegidos(caja) {
    var fs = caja && caja.querySelector("[data-grupos]"); if (!fs) return PER ? [PER] : gestionados();
    if (fs.querySelector("input[type=radio][value=todos]").checked) return gestionados();
    return [].slice.call(fs.querySelectorAll(".pe-chips input:checked")).map(function (c) { return c.value; });
  }
  function nombresDe(pers) { return pers.map(function (p) { return "«" + nombreDeGrupo(p) + "»"; }).join(", "); }

  // ---------------------------------------------------------------- las ofertas (14-sep)
  /**
   * 🔴 14-sep · LAS OFERTAS DE LA SEMANA. Norberto: «un ítem que aparece aleatoriamente de forma
   * temporal en el mercado, rebajado, con stock limitado en tiempo y en unidades (proporcional a los
   * inscritos y a la rareza)… el referente tiene el poder siempre de extender el tiempo, cancelar,
   * editar unidades o incluso elegir y configurar lo que se va a vender». Todo lo hace el servidor
   * (`stargateOferta`); aquí se enseña y se pide. 🌐 17-sep · y una oferta puede salir en varios grupos a la vez: la crea
   * el servidor en cada uno (con las unidades de SUS inscritos) y lo que se haga con ella se hace en todos.
   */
  var RZ_OF = { common: "común", rare: "rara", epic: "épica", legendary: "legendaria" };
  function estadoOferta(r) {
    var so = r.stargateOferta || {}, fo = r.flashOffer || {}, ahora = Date.now();
    if (so.cancelada) return ["cancelada", "✕ Cancelada"];
    if (ahora < Number(so.desde || 0)) return ["pronto", "<img class=ico src=assets/img/iconos/p/tiempo.png alt> Empieza el " + diaDe(so.desde)];
    if (ahora >= Number(fo.endsAt || 0)) return ["fin", "<img class=ico src=assets/img/iconos/p/tiempo.png alt> Terminó el " + diaDe(fo.endsAt)];
    // (15-sep · agotada NO es terminada: le faltan unidades, no tiempo; antes solo ofrecía «Reabrir»)
    if (r.isLimitedStock === true && Number(r.globalStock || 0) <= 0) return ["agotada", "<img class=ico src=assets/img/iconos/p/fuego.png alt> Agotada"];
    return ["viva", "<img class=ico src=assets/img/iconos/p/rayo.png alt> A la venta hasta el " + diaDe(fo.endsAt)];
  }
  function botonesOferta(e) {
    return e[0] === "viva" || e[0] === "pronto" ? '<p class="of-botones"><button class="btn min" data-of-mas="1">+1 día</button> <button class="btn min" data-of-mas="7">+1 semana</button> ' +
        '<button class="btn min" data-of-uds>Unidades…</button> <button class="btn min peligro" data-of-cancelar>Cancelar</button></p>'
      : e[0] === "agotada" ? '<p class="of-botones"><button class="btn min" data-of-uds>Más unidades…</button> <button class="btn min peligro" data-of-cancelar>Cancelar</button></p>'
      : '<p class="of-botones"><button class="btn min" data-of-mas="7">Reabrir una semana</button></p>';
  }
  function filaOferta(r, ambito) {
    var so = r.stargateOferta || {}, fo = r.flashOffer || {}, e = estadoOferta(r), pct = Number(fo.discountPercent || 0);
    var precio = Math.max(0, Math.floor(Number(r.cost || 0) * (100 - pct) / 100)), vend = Number(fo.unitsSold || 0);
    return '<div class="card of-fila ' + e[0] + '" data-of="' + esc(r.docId) + '" data-comun="' + esc(r.stargateComun || "") + '">' +
      '<div><b>' + esc(so.nombre || r.title) + '</b> <span class="chip">' + esc(so.rareza || "") + '</span> <span class="chip' + (e[0] === "viva" ? " ok" : "") + '">' + e[1] + '</span>' +
      (r.stargateComun ? ' <span class="chip of-comun"><img class=ico src=assets/img/iconos/p/varios.png alt> varios grupos</span>' : "") +
      '<p class="small">' + (so.auto ? "Automática · semana " + (so.semana || "—") : "Creada por " + esc(so.por || "el referente")) + ' · <s>' + r.cost + ' ◈</s> <b>' + precio + ' ◈</b> (−' + pct + ' %) · ' +
      (so.unidades == null ? "sin límite de unidades" : vend + " de " + so.unidades + " vendidas") + ' · una por persona</p>' + (ambito || "") + '</div>' +
      botonesOferta(e) + '</div>';
  }
  function formOferta(R, sel) {
    var cofres = R.filter(function (r) { return r.inStore !== false && /^(cromo|heroe|sobre_[a-z]+|capsula_[a-z]+)$/.test(r.stargateTipo || "") && r.consumeEffects && r.consumeEffects.lootBox; });
    var heroes = R.filter(function (r) { return r.inStore === false && r.stargateTipo === "heroe" && /__heroe_/.test(r.docId || ""); });
    var cartas = R.filter(function (r) { return r.inStore === false && r.stargateTipo === "cromo" && /__cromo_/.test(r.docId || ""); });
    var op = function (v, t) { return '<option value="' + esc(v) + '">' + esc(t) + '</option>'; };
    return '<div class="of-form">' +
      '<label class="h-campo">Qué se vende<select id="of-que">' +
        '<optgroup label="Sobres y cápsulas">' + cofres.map(function (r) { return op("cofre:" + r.stargateTipo, r.title + " (" + r.cost + " ◈)"); }).join("") + '</optgroup>' +
        '<optgroup label="Un héroe concreto">' + heroes.map(function (r) { return op("heroe:" + r.docId.split("__heroe_").pop(), r.title + " · " + (RZ_OF[r.rarity] || r.rarity || "")); }).join("") + '</optgroup>' +
        '<optgroup label="Una carta concreta">' + cartas.map(function (r) { return op("carta:" + r.docId.split("__cromo_").pop(), r.title + " · " + (RZ_OF[r.rarity] || r.rarity || "")); }).join("") + '</optgroup>' +
      '</select></label>' +
      '<label class="h-campo h-num">Descuento %<input id="of-pct" type="number" min="1" max="90" value="30"></label>' +
      '<label class="h-campo h-num">Unidades<input id="of-uds" type="number" min="1" placeholder="según inscritos y rareza"></label>' +
      '<label class="of-auto"><input type="checkbox" id="of-sin"> Sin límite de unidades</label>' +
      '<label class="h-campo h-num">Días<input id="of-dias" type="number" min="1" max="28" value="7"></label>' +
      (gestionados().length > 1 ? selectorGrupos("of-g-nuevo", sel) : "") +
      '<p><button class="btn primary" id="of-crear">Crear la oferta (empieza ya)</button> <button class="btn" id="of-cancelar-f">Cancelar</button></p></div>';
  }
  function datosDeFormOferta() {
    var q = $("#of-que").value.split(":"), que = q[0] === "cofre" ? { tipo: "cofre", cual: q[1] } : { tipo: q[0], clave: q[1] };
    var uds = $("#of-sin").checked ? "ilimitado" : (Number($("#of-uds").value) > 0 ? Number($("#of-uds").value) : undefined);
    return { que: que, pct: Number($("#of-pct").value) || 30, unidades: uds, dias: Number($("#of-dias").value) || 7 };
  }
  /** Lo que se hace con una oferta se hace en TODOS sus grupos si es de varios (se buscan en el momento). */
  function hermanasDe(docId, comun, per) {
    if (!comun) return Promise.resolve([{ per: per, docId: docId }]);
    return MOTOR.ofertasDeGrupos(gestionados()).then(function (l) {
      var o = l.filter(function (x) { return x.id === comun; })[0];
      return o ? o.grupos.map(function (g) { return { per: g.per, docId: g.oferta.docId }; }) : [{ per: per, docId: docId }];
    });
  }
  function cablearAccionesOferta(raiz, perDe, pide) {
    Array.prototype.forEach.call(raiz.querySelectorAll("[data-of]"), function (c) {
      var id = c.getAttribute("data-of"), comun = c.getAttribute("data-comun"), per = perDe(c);
      var hazlo = function (accion, datos, texto, alFallar) {
        if (!comun && per === PER) return pide(accion, Object.assign({ ofertaId: id }, datos), texto, alFallar);
        return hermanasDe(id, comun, per).then(function (docs) { return MOTOR.ofertaEnGrupos(docs, accion, datos).then(function (r) {
          return pide(null, null, texto + (docs.length > 1 ? " (en " + (docs.length - r.fallos.length) + " grupos)" : "") + (r.fallos.length ? " · no se pudo en " + nombresDe(r.fallos.map(function (f) { return f.per; })) : ""));
        }); }).catch(function (e) { if (alFallar) try { alFallar(); } catch (x) {} aviso(e.message); });
      };
      Array.prototype.forEach.call(c.querySelectorAll("[data-of-mas]"), function (b) {
        b.onclick = function () { b.disabled = true; hazlo("extender", { dias: Number(b.getAttribute("data-of-mas")) }, "Oferta alargada.", function () { b.disabled = false; }); }; });
      var u = c.querySelector("[data-of-uds]");
      if (u) u.onclick = async function () {
        var resp = await window.SG.preguntar({ titulo: "¿Cuántas unidades en total?", texto: "Escribe «ilimitado» para quitar el tope." + (comun ? " Se aplica en cada uno de sus grupos." : ""),
          campo: { etiqueta: "Unidades", marcador: "5 o ilimitado", obligatorio: true,
                   validar: function (x) { return /ilimit/i.test(x) || /^\d+$/.test(x) ? "" : "Un número (por ejemplo, 5) o «ilimitado»."; } },
          si: "Cambiar unidades" });
        if (!resp) return;
        var v = resp.texto;
        hazlo("unidades", { unidades: /ilimit/i.test(v) ? "ilimitado" : Number(v) }, "Unidades cambiadas.");
      };
      var x = c.querySelector("[data-of-cancelar]");
      if (x) x.onclick = async function () {
        if (!(await window.SG.preguntar({ titulo: "¿Cancelar esta oferta?", texto: "Sale del Mercado ya" + (comun ? ", en todos sus grupos" : "") + ". Quien la compró la conserva.", si: "Cancelar la oferta", no: "Mantenerla", peligro: true }))) return;
        hazlo("cancelar", {}, "✕ Oferta cancelada."); };
    });
  }
  function verOfertas(t) {
    var R = (DATOS && DATOS.recompensas) || [];
    var L = R.filter(function (r) { return r.stargateTipo === "oferta"; })
      .sort(function (a, b) { return Number((b.stargateOferta || {}).desde || 0) - Number((a.stargateOferta || {}).desde || 0); });
    var auto = (DATOS.proyecto.stargate || {}).ofertasAuto !== false;
    $("#c-cuerpo").innerHTML =
      '<div class="card"><h3><img class=ico src=assets/img/iconos/p/rayo.png alt> Ofertas</h3>' +
      '<p class="small">Cada semana, desde la 5 (con su capítulo de NEBULA), sale <b>sola</b> una oferta en el Mercado: un sobre, una cápsula, un héroe o una carta concretos, ' +
      'rebajados un 20-40 %, durante esa semana y con <b>unidades según los inscritos y la rareza</b> (común: sin límite; rara: la mitad; épica: una cuarta parte; legendaria: el 10 %). Una por persona.' +
      (gestionados().length > 1 ? ' Las que crees tú pueden salir <b>en varios de tus grupos</b> a la vez (<a href="consola.html?comun=ofertas"><img class=ico src=assets/img/iconos/p/varios.png alt> ver las de todos</a>).' : "") + '</p>' +
      '<label class="of-auto"><input type="checkbox" id="of-auto"' + (auto ? " checked" : "") + '> Oferta automática cada semana <span class="small muted">(solo en este grupo)</span></label>' +
      '<p><button class="btn primary" id="of-nueva">+ Crear una oferta</button></p><div id="of-nueva-f"></div></div>' +
      (L.length ? L.map(function (r) { return filaOferta(r); }).join("") : '<div class="card"><p class="small muted">Todavía no ha salido ninguna oferta. La primera sale sola en la semana 3, cuando alguien abre su Nave.</p></div>');
    var tras = function (texto) { return refrescar().then(function () { TAB = "ofertas"; pintar(); aviso(texto, true); }); };
    // (15-sep · si falla, el botón pulsado vuelve a estar vivo y la casilla vuelve a como estaba)
    var pide = function (accion, datos, texto, alFallar) {
      if (!accion) return tras(texto);
      return MOTOR.oferta(PER, accion, datos).then(function () { return tras(texto); }).catch(function (e) {
        if (alFallar) try { alFallar(); } catch (x) {}
        aviso(/not-found|internal/.test(String(e && e.code)) && !/[áéíóú]/.test(String(e && e.message))
          ? "Falta desplegar en el servidor la función «stargateOferta» (el comando está en el traspaso)." : e.message);
      });
    };
    $("#of-auto").onchange = function () { var cb = $("#of-auto"), antes = !cb.checked;
      pide("auto", { on: cb.checked }, cb.checked ? "Una oferta automática cada semana." : "Ofertas automáticas apagadas: solo las que crees tú.",
        function () { cb.checked = antes; }); };
    cablearAccionesOferta(app, function () { return PER; }, pide);
    $("#of-nueva").onclick = function () {
      $("#of-nueva-f").innerHTML = formOferta(R, [PER]);
      cablearSelectorGrupos($("#of-nueva-f"));
      $("#of-cancelar-f").onclick = function () { $("#of-nueva-f").innerHTML = ""; };
      $("#of-crear").onclick = function () {
        var datos = datosDeFormOferta(), destinos = gruposElegidos($("#of-nueva-f"));
        if (!destinos.length) return aviso("Marca al menos un grupo.");
        $("#of-crear").disabled = true;
        var vuelve = function () { var c = $("#of-crear"); if (c) c.disabled = false; };
        if (destinos.length === 1 && destinos[0] === PER) return pide("crear", datos, "Oferta creada: ya está en el Mercado de tu alumnado.", vuelve);
        MOTOR.crearOfertaEnGrupos(datos, destinos).then(function (r) {
          return tras("Oferta creada en " + (destinos.length - r.fallos.length) + " grupos." + (r.fallos.length ? " No se pudo en " + nombresDe(r.fallos.map(function (f) { return f.per; })) + ": " + r.fallos[0].motivo : ""));
        }).catch(function (e) { vuelve(); aviso(e.message); });
      };
    };
  }
  /** 🌐 Las ofertas de todos tus grupos: las de varios, juntas; se crean eligiendo grupos. */
  async function verOfertasComunes(destino) {
    var g = gestionados();
    destino.innerHTML = '<div class="card"><p class="muted">Buscando tus ofertas…</p></div>';
    var datos0 = null, lista = [];
    try { datos0 = g.length ? await MOTOR.leerPER(g[0], false) : null; } catch (e) {}
    try { lista = await MOTOR.ofertasDeGrupos(g); } catch (e) {}
    var R = (datos0 && datos0.recompensas) || [];
    var fin = function (o) { return Math.max.apply(null, o.grupos.map(function (x) { return Number((x.oferta.flashOffer || {}).endsAt || 0); })); };
    lista.sort(function (a, b) { return fin(b) - fin(a); });
    destino.innerHTML = '<div class="card"><h3><img class=ico src=assets/img/iconos/p/rayo.png alt> Ofertas</h3><p class="small">Una oferta que crees aquí sale en el Mercado de los grupos que elijas, a la vez. En cada grupo ' +
      'las unidades salen de <b>sus</b> inscritos. Lo que hagas con ella (alargar, unidades, cancelar) se hace en todos. La oferta automática de cada semana se enciende o apaga dentro de cada grupo.</p>' +
      '<p><button class="btn primary" id="of-nueva">+ Crear una oferta</button></p><div id="of-nueva-f"></div></div>' +
      (lista.length ? lista.map(function (o) {
        var r = o.grupos[0].oferta;
        var amb = '<p class="small of-grupos">' + (o.grupos.length > 1 || o.comun ? "<img class=ico src=assets/img/iconos/p/varios.png alt> " : "") + o.grupos.map(function (x) {
          return '<a class="chip" href="consola.html?per=' + esc(x.per) + '">' + esc(nombreDeGrupo(x.per)) + " · " + estadoOferta(x.oferta)[1] + "</a>"; }).join(" ") + "</p>";
        return filaOferta(r, amb).replace('data-of="', 'data-per="' + esc(o.grupos[0].per) + '" data-of="');
      }).join("") : '<div class="card"><p class="small muted">Ninguno de tus grupos tiene ofertas todavía.</p></div>');
    var repinta = function (texto) { return verOfertasComunes(destino).then(function () { if (texto) aviso(texto, true); }); };
    var pide = function (accion, datos, texto) { return repinta(texto); };
    cablearAccionesOferta(destino, function (c) { return c.getAttribute("data-per"); }, pide);
    $("#of-nueva").onclick = function () {
      if (!R.length) return aviso("No he podido leer la tienda de tus grupos.");
      $("#of-nueva-f").innerHTML = formOferta(R, "todos");
      cablearSelectorGrupos($("#of-nueva-f"));
      $("#of-cancelar-f").onclick = function () { $("#of-nueva-f").innerHTML = ""; };
      $("#of-crear").onclick = function () {
        var datos = datosDeFormOferta(), destinos = gruposElegidos($("#of-nueva-f"));
        if (!destinos.length) return aviso("Marca al menos un grupo.");
        $("#of-crear").disabled = true;
        MOTOR.crearOfertaEnGrupos(datos, destinos).then(function (r) {
          return repinta("Oferta creada en " + (destinos.length - r.fallos.length) + (destinos.length === 1 ? " grupo." : " grupos.") + (r.fallos.length ? " No se pudo en " + nombresDe(r.fallos.map(function (f) { return f.per; })) + ": " + r.fallos[0].motivo : ""));
        }).catch(function (e) { var c = $("#of-crear"); if (c) c.disabled = false; aviso(e.message); });
      };
    };
  }

  var SORTEOS_PEDIDOS = {};   // (15-sep · por grupo: al pasar de un grupo a otro sin recargar, el segundo también se pide)
  function verSorteos(t) {
    var L = sorteosDelGrupo(), cat = window.SG_CATALOGO || {}, porDefecto = (cat.sorteos || [])[0];
    var falta = porDefecto && !L.some(function (x) { return x.stargateId === porDefecto.id; });
    $("#c-cuerpo").innerHTML =
      '<div class="card"><h3><img class=ico src=assets/img/iconos/p/ticket.png alt> Sorteos</h3>' +
      '<p class="small">Para dinamizar la clase. Tu alumnado compra <b>participaciones</b> en el Mercado; tú las <b>regalas</b> en el aula ' +
      '(Premiar → <img class=ico src=assets/img/iconos/p/ticket.png alt>) o las <b>escondes en un enlace</b> (Premios por enlace → <img class=ico src=assets/img/iconos/p/ticket.png alt> Participaciones). El día del sorteo, <b>proyéctalo</b>: ' +
      'lo hace el servidor, una papeleta por participación, y nadie gana dos. Entre ellos, las <b>revenden en el Zoco</b>; lo que siga a la venta ' +
      'al sortear se retira solo y cada oferta devuelve sus créditos.</p>' +
      (falta ? '<p><button class="btn primary" id="sr-defecto"><img class=ico src=assets/img/iconos/p/anadir.png alt> Añadir el Gran Sorteo: ' + esc(porDefecto.ganadores + " × " + porDefecto.premio) + '</button></p>' : "") +
      '<p><button class="btn" id="sr-nuevo">+ Crear otro sorteo</button></p><div id="sr-nuevo-f"></div></div>' +
      (L.length ? L.map(function (x) {
        var P = premioDelSorteo(x), S = x.stargateSorteo || {}, e = estadoSorteo(x), B = bomboDe(x);
        var total = B.reduce(function (a, b) { return a + b.n; }, 0), gan = Number(P.globalStockInitial || S.ganadores || 1);
        var ganadores = (x.raffleWinnerIds || []).map(function (f, i) {
          var pr = (DATOS.privados || {})[f] || {};
          return '<li><b>' + esc((x.raffleWinnerNames || [])[i] || "") + '</b> · ' + esc(((pr.firstName || "") + " " + (pr.lastName || "")).trim() || "—") +
            (pr.email ? ' · <a href="mailto:' + esc(pr.email) + '">' + esc(pr.email) + '</a>' : "") + '</li>'; }).join("");
        return '<div class="card sr-caja ' + e[0] + '" data-doc="' + esc(x.docId) + '">' +
          '<div class="sr-cab"><img src="assets/img/canje/' + esc(S.imagen || "sorteo_generico.jpg") + '" alt="">' +
          '<div><h3>' + esc(S.premio || P.title || x.title) + '</h3><span class="chip' + (e[0] === "hecho" ? " ok" : e[0] === "venta" ? " wip" : "") + '">' + e[1] + '</span>' +
          '<p class="small">' + gan + ' ganador' + (gan === 1 ? '' : 'es') + ' · ' + x.cost + ' ◈ la participación' + (x.maxPerUser ? ' · máx. ' + x.maxPerUser + ' por persona' : '') +
          ' · a la venta del ' + diaDe(x.availableFrom) + ' al ' + diaDe(x.ticketDeadline) + '</p></div></div>' +
          (e[0] === "retirado" ? '<p class="small muted">Se quitó de este grupo antes de vender ninguna participación. Puedes volver a añadirlo desde sus grupos.</p>'
          : e[0] === "hecho"
            ? '<div class="sr-ganadores"><p><img class=ico src=assets/img/iconos/p/rankings.png alt> <b>Ganadores</b> (entrégales el premio)' + (x.raffleResolvedBy === "auto" ? ' · <span class="small muted">se resolvió solo el ' + diaDe(x.raffleResolvedAt) + '</span>' : '') + ':</p>' +
              ((x.raffleWinnerIds || []).length ? '<ul>' + ganadores + '</ul>' +
                // 14-sep · Norberto: «importante guardar estos datos para poder dar las licencias de forma manual»
                '<p><button class="btn" data-copiar-gan="' + esc(x.docId) + '"><img class=ico src=assets/img/iconos/p/notas.png alt> Copiar ganadores (alias, nombre y correo)</button></p>'
                : '<p class="small muted">Nadie tenía participaciones: se cerró sin ganadores.</p>') + '</div>'
            : '<p class="sr-cuenta"><b>' + total + '</b> participaci' + (total === 1 ? 'ón' : 'ones') + ' de <b>' + B.length + '</b> recluta' + (B.length === 1 ? '' : 's') + '</p>' +
              (B.length ? '<details class="cajon"><summary><b>El bombo</b> <span class="cnt">' + B.length + '</span></summary><div class="tabla-envoltura"><table class="tabla sr-tabla"><thead><tr><th>Alias</th><th>Nombre</th><th>Participaciones</th><th>Posibilidades</th></tr></thead><tbody>' +
                B.map(function (b) { return '<tr><td>' + esc(b.alias) + '</td><td>' + esc(b.nombre || "—") + '</td><td>' + b.n + '</td><td>' + Math.round(100 * b.n / Math.max(1, total)) + ' %</td></tr>'; }).join("") +
                '</tbody></table></div></details>' : '') +
              '<p class="sr-botones"><button class="btn primary sr-directo" data-doc="' + esc(x.docId) + '"' + (B.length ? '' : ' disabled title="Nadie tiene participaciones todavía"') + '><img class=ico src=assets/img/iconos/p/dados.png alt> Sortear en directo</button> ' +
              '<button class="btn sr-editar" data-doc="' + esc(x.docId) + '"><img class=ico src=assets/img/iconos/p/editar.png alt> Cambiar</button></p><div class="sr-editar-f"></div>') +
          (gestionados().length > 1 ? '<div class="sr-ambito" data-sid="' + esc(x.stargateId || "") + '"></div>' : "") +
          '</div>';
      }).join("") : '<div class="card"><p class="small muted">Este grupo todavía no tiene ningún sorteo.</p></div>');
    var tras = function (texto) { return refrescar().then(function () { TAB = "sorteos"; pintar(); aviso(texto, true); }); };
    if (gestionados().length > 1 && L.length) MOTOR.sorteosDeGrupos(gestionados()).then(function (todos) {
      Array.prototype.forEach.call(app.querySelectorAll(".sr-ambito[data-sid]"), function (el) {
        var s = todos.filter(function (y) { return y.id === el.getAttribute("data-sid"); })[0];
        if (s) pintarAmbitoSorteo(el, s, tras);
      });
    }).catch(function () {});
    // 14-sep · el sorteo que ya ha pasado su fecha se resuelve solo (aquí también, al abrir la pestaña)
    var vencidos = L.filter(function (x) { return !x.isRaffleCompleted && Number(x.ticketDeadline || 0) > 0 && Number(x.ticketDeadline) <= Date.now(); });
    if (vencidos.length && !SORTEOS_PEDIDOS[PER] && MOTOR.sorteosPendientes) {
      SORTEOS_PEDIDOS[PER] = true;
      MOTOR.sorteosPendientes(PER).then(function (r) { if (r && (r.resueltos || []).length) tras("El sorteo se ha resuelto solo: ya tienes los ganadores."); }).catch(function () {});
    }
    // «Copiar ganadores»: del ARCHIVO del sorteo (guarda su contacto aunque luego se den de baja)
    Array.prototype.forEach.call(app.querySelectorAll("[data-copiar-gan]"), function (b) {
      b.onclick = function () {
        var d = b.getAttribute("data-copiar-gan"), x = L.filter(function (y) { return y.docId === d; })[0] || {};
        var desdeDatos = function () {
          return (x.raffleWinnerIds || []).map(function (f, i) { var pr = (DATOS.privados || {})[f] || {};
            return { alias: (x.raffleWinnerNames || [])[i] || "", nombre: ((pr.firstName || "") + " " + (pr.lastName || "")).trim(), correo: pr.email || "" }; });
        };
        MOTOR.getDoc(MOTOR.doc(MOTOR.db, "projects", PER, "lottery_archives", d)).then(function (a) {
          return (a.exists() && (a.data().ganadoresContacto || []).length) ? a.data().ganadoresContacto : desdeDatos();
        }).catch(desdeDatos).then(function (gente) {
          var S = x.stargateSorteo || {};
          var texto = "Gran Sorteo · " + (S.premio || x.title || "") + " · " + (DATOS.proyecto.name || PER) + "\n" +
            gente.map(function (g, i) { return (i + 1) + ". " + g.alias + " — " + (g.nombre || "(sin nombre)") + " — " + (g.correo || "(sin correo)"); }).join("\n");
          b.setAttribute("data-copiado-texto", texto);
          // 🔴 15-sep · el portapapeles se escribe DESPUÉS de leer el archivo (una espera de red) y Safari lo
          // rechaza; antes no se esperaba la promesa y decía «Copiados» sin haber copiado nada. Si no deja,
          // la lista sale en un cuadro, ya seleccionada, para copiarla a mano.
          var hecho = function () { aviso("Copiados: " + gente.length + " ganador" + (gente.length === 1 ? "" : "es") + ". Pégalos donde vayas a gestionar las licencias.", true); };
          var aMano = function () {
            var t = b.parentNode.querySelector("textarea.gan-copia");
            if (!t) { t = document.createElement("textarea"); t.className = "gan-copia"; t.readOnly = true; b.parentNode.insertBefore(t, b.nextSibling); }
            t.value = texto; t.rows = Math.min(8, gente.length + 2); t.focus(); t.select();
            aviso("Tu navegador no me deja copiar solo: la lista está en el cuadro, ya seleccionada. Cópiala con Ctrl+C (⌘+C en Mac).", true);
          };
          try { var pr = navigator.clipboard && navigator.clipboard.writeText(texto); if (pr && pr.then) pr.then(hecho, aMano); else aMano(); }
          catch (e) { aMano(); }
        });
      };
    });
    var cablearForm = function (caja, doc_) {
      var x = doc_ ? sorteosDelGrupo().filter(function (y) { return y.docId === doc_; })[0] : null;
      cablearFormSorteo(caja, x ? x.stargateId : "", tras);
    };
    if ($("#sr-defecto")) $("#sr-defecto").onclick = async function () {
      this.disabled = true;
      try { await MOTOR.crearSorteo(PER, porDefecto); await tras("El Gran Sorteo ya está en el grupo: sale en el Mercado desde la semana " + porDefecto.desdeSemana + "."); }
      catch (e) { this.disabled = false; aviso(e.message); }
    };
    $("#sr-nuevo").onclick = function () { var c = $("#sr-nuevo-f"); c.innerHTML = formSorteo(null, {}); cablearForm(c, ""); };
    Array.prototype.forEach.call(app.querySelectorAll(".sr-editar"), function (b) {
      b.onclick = function () {
        var x = sorteosDelGrupo().filter(function (y) { return y.docId === b.getAttribute("data-doc"); })[0]; if (!x) return;
        var c = b.closest(".sr-caja").querySelector(".sr-editar-f"); c.innerHTML = formSorteo(x, premioDelSorteo(x)); cablearForm(c, x.docId);
      };
    });
    Array.prototype.forEach.call(app.querySelectorAll(".sr-directo"), function (b) {
      b.onclick = function () {
        var x = sorteosDelGrupo().filter(function (y) { return y.docId === b.getAttribute("data-doc"); })[0]; if (x) sorteoEnDirecto(x);
      };
    });
  }
  function leerFormSorteo(f) {
    return { premio: $(".sr-premio", f).value.trim(), descripcion: $(".sr-desc", f).value.trim(), ganadores: Number($(".sr-gan", f).value) || 1,
             coste: Number($(".sr-coste", f).value) || 0, maximo: Number($(".sr-max", f).value) || 0,
             desde: deFecha($(".sr-desde", f).value), fecha: deFecha($(".sr-fecha", f).value) };
  }
  function validarSorteo(v) {
    if (!v.premio) return "Di qué se sortea.";
    if (!v.desde || !v.fecha) return "Pon las dos fechas: desde cuándo se vende y cuándo se sortea.";
    if (v.fecha <= v.desde) return "El sorteo tiene que ser después de que empiece la venta.";
    return "";
  }
  /** Los grupos donde está este sorteo (sin los que se quitó), y el del grupo en el que se está, siempre. */
  async function gruposConSorteo(id) {
    var l = await MOTOR.sorteosDeGrupos(gestionados().length ? gestionados() : [PER]);
    var s = l.filter(function (x) { return x.id === id; })[0];
    var gs = s ? s.grupos.filter(function (g) { return !g.ticket.stargateRetirado; }).map(function (g) { return g.per; }) : [];
    if (PER && gs.indexOf(PER) < 0) gs.push(PER);
    return gs;
  }
  /** Crear (a los grupos elegidos) o cambiar (en todos los suyos) un sorteo. `id` vacío = crear. */
  function cablearFormSorteo(caja, id, despues) {
    var f = $(".sr-form", caja);
    cablearSelectorGrupos(f);
    $(".sr-cancelar", f).onclick = function () { caja.innerHTML = ""; };
    $(".sr-guardar", f).onclick = async function () {
      var v = leerFormSorteo(f), malo = validarSorteo(v); if (malo) return aviso(malo);
      var boton = this; boton.disabled = true;
      try {
        var nuevo = !id, sid = id || "sorteo" + Date.now().toString(36);
        var destinos = nuevo ? gruposElegidos(f) : await gruposConSorteo(sid);
        if (!destinos.length) { boton.disabled = false; return aviso("Marca al menos un grupo."); }
        var r = await MOTOR.sorteoEnGrupos(Object.assign({ id: sid }, v), destinos);
        var varios = destinos.length > 1 ? " en " + destinos.length + " grupos" : "";
        await despues((nuevo ? "Sorteo creado" + varios + ": ya sale en el Mercado de tu alumnado (desde su fecha)." : "Sorteo cambiado" + varios + ".") +
          (r.hechos.length ? " (En " + nombresDe(r.hechos) + " ya se había hecho: ahí no se toca.)" : ""));
      } catch (e) { boton.disabled = false; aviso(e.message); }
    };
  }
  function configDeTicket(t) {
    var S = t.stargateSorteo || {};
    return { id: t.stargateId, premio: S.premio || String(t.title || "").replace(/^Participación · /, ""), descripcion: t.description || "",
             ganadores: Number(S.ganadores) || 1, coste: Number(t.cost) || 0, maximo: Number(t.maxPerUser) || 0,
             desde: Number(t.availableFrom) || 0, fecha: Number(t.ticketDeadline) || 0 };
  }
  /** «🌐 En sus grupos»: una casilla por grupo. Marcar lo lleva a ese grupo; desmarcar lo quita (si ahí nadie compró). */
  function pintarAmbitoSorteo(el, s, despues) {
    var g = gestionados(), de = {};
    s.grupos.forEach(function (x) { de[x.per] = x.ticket; });
    var vivo = s.grupos.filter(function (x) { return !x.ticket.stargateRetirado; })[0] || s.grupos[0];
    el.innerHTML = '<p class="small sr-ambito-t"><img class=ico src=assets/img/iconos/p/varios.png alt> <b>En sus grupos:</b> ' + g.map(function (per) {
      var t = de[per], on = !!t && !t.stargateRetirado, hecho = !!t && t.isRaffleCompleted && !t.stargateRetirado;
      return '<label class="pe-chip' + (hecho ? " hecho" : "") + '" title="' + (hecho ? "Ya se hizo aquí" : on ? "Desmárcalo para quitarlo de este grupo" : "Márcalo para llevarlo a este grupo") + '">' +
        '<input type="checkbox" value="' + esc(per) + '"' + (on ? " checked" : "") + (hecho ? " disabled" : "") + "> " + esc(nombreDeGrupo(per)) + (hecho ? " · <img class=ico src=assets/img/iconos/p/rankings.png alt>" : "") + "</label>";
    }).join(" ") + "</p>";
    Array.prototype.forEach.call(el.querySelectorAll("input[type=checkbox]"), function (c) {
      c.onchange = async function () {
        var per = c.value, t = de[per];
        c.disabled = true;
        try {
          if (c.checked) { await MOTOR.sorteoEnGrupos(configDeTicket(vivo.ticket), [per]); await despues("Sorteo añadido a «" + nombreDeGrupo(per) + "»."); }
          else {
            if (!t || t.stargateRetirado) { c.disabled = false; return; }   // (ahí no estaba: nada que quitar)
            if (!(await window.SG.preguntar({ titulo: "¿Quitar este sorteo de «" + nombreDeGrupo(per) + "»?", texto: "Solo se puede si allí nadie tiene participaciones. Deja de venderse en ese grupo.", si: "Quitarlo de ese grupo", peligro: true }))) { c.checked = true; c.disabled = false; return; }
            await MOTOR.retirarSorteo(per, t.docId); await despues("Sorteo quitado de «" + nombreDeGrupo(per) + "».");
          }
        } catch (e) { c.checked = !c.checked; c.disabled = false; aviso(e.message); }
      };
    });
  }
  /** 🌐 Los sorteos de todos tus grupos: uno por sorteo, con su estado en cada grupo. El bombo y el directo, dentro del grupo. */
  async function verSorteosComunes(destino) {
    destino.innerHTML = '<div class="card"><p class="muted">Buscando tus sorteos…</p></div>';
    var l = [];
    try { l = await MOTOR.sorteosDeGrupos(gestionados()); } catch (e) {}
    var fechaDe = function (s) { return Math.max.apply(null, s.grupos.map(function (x) { return Number(x.ticket.ticketDeadline || 0); })); };
    l.sort(function (a, b) { return fechaDe(a) - fechaDe(b); });
    destino.innerHTML = '<div class="card"><h3><img class=ico src=assets/img/iconos/p/ticket.png alt> Sorteos</h3><p class="small">Un sorteo se configura una vez y va a los grupos que elijas. ' +
      'Cada grupo tiene <b>su bombo</b> y su <b>sorteo en directo</b> (entra en el grupo → Sorteos). Cambiarlo aquí lo cambia en todos sus grupos.</p>' +
      '<p><button class="btn primary" id="sr-nuevo">+ Crear un sorteo</button></p><div id="sr-nuevo-f"></div></div>' +
      (l.length ? l.map(function (s) {
        var vivo = s.grupos.filter(function (x) { return !x.ticket.stargateRetirado; })[0] || s.grupos[0], t = vivo.ticket, S = t.stargateSorteo || {}, cfg = configDeTicket(t);
        return '<div class="card sr-caja" data-sid="' + esc(s.id) + '">' +
          '<div class="sr-cab"><img src="assets/img/canje/' + esc(S.imagen || "sorteo_generico.jpg") + '" alt=""><div><h3>' + esc(cfg.premio) + '</h3>' +
          '<p class="small">' + cfg.ganadores + " ganador" + (cfg.ganadores === 1 ? "" : "es") + " por grupo · " + cfg.coste + " ◈ la participación" + (cfg.maximo ? " · máx. " + cfg.maximo + " por persona" : "") +
          " · a la venta del " + diaDe(cfg.desde) + " al " + diaDe(cfg.fecha) + "</p>" +
          '<p class="small sr-estados">' + s.grupos.map(function (x) {
            return '<a class="chip" href="consola.html?per=' + esc(x.per) + '" title="Abrir ese grupo: su bombo y el sorteo en directo">' + esc(nombreDeGrupo(x.per)) + " · " + estadoSorteo(x.ticket)[1] + "</a>"; }).join(" ") + "</p></div></div>" +
          '<div class="sr-ambito"></div>' +
          (s.grupos.some(function (x) { return !x.ticket.isRaffleCompleted; }) ? '<p class="sr-botones"><button class="btn sr-editar"><img class=ico src=assets/img/iconos/p/editar.png alt> Cambiar (en todos sus grupos)</button></p><div class="sr-editar-f"></div>' : "") +
          "</div>";
      }).join("") : '<div class="card"><p class="small muted">Ninguno de tus grupos tiene sorteos todavía.</p></div>');
    var repinta = function (texto) { return verSorteosComunes(destino).then(function () { if (texto) aviso(texto, true); }); };
    $("#sr-nuevo").onclick = function () { var c = $("#sr-nuevo-f"); c.innerHTML = formSorteo(null, {}); cablearFormSorteo(c, "", repinta); };
    Array.prototype.forEach.call(destino.querySelectorAll(".sr-caja[data-sid]"), function (caja) {
      var s = l.filter(function (x) { return x.id === caja.getAttribute("data-sid"); })[0]; if (!s) return;
      pintarAmbitoSorteo($(".sr-ambito", caja), s, repinta);
      var b = $(".sr-editar", caja);
      if (b) b.onclick = function () {
        var vivo = s.grupos.filter(function (x) { return !x.ticket.stargateRetirado && !x.ticket.isRaffleCompleted; })[0] || s.grupos[0];
        var c = $(".sr-editar-f", caja); c.innerHTML = formSorteo(vivo.ticket, { title: configDeTicket(vivo.ticket).premio, globalStockInitial: configDeTicket(vivo.ticket).ganadores });
        cablearFormSorteo(c, s.id, repinta);
      };
    });
  }
  /**
   * 🎲 EL SORTEO EN DIRECTO, para proyectar. Primero el bombo (cada recluta con sus papeletas); al
   * pulsar, el SERVIDOR elige y aquí se cuenta con una ruleta que se va frenando hasta caer en cada
   * ganador. Sin correos ni nombres reales: esto lo ve la clase entera.
   */
  function sorteoEnDirecto(x) {
    var P = premioDelSorteo(x), S = x.stargateSorteo || {}, B = bomboDe(x), gan = Number(P.globalStockInitial || S.ganadores || 1);
    var capa = document.createElement("div"); capa.className = "sr-proy"; capa.setAttribute("role", "dialog");
    // 14-sep · la imagen del sorteo arriba (la del Gran Sorteo lleva el logo de Genially en los boletos)
    capa.innerHTML = '<div class="sr-proy-caja"><img class="sr-proy-img" src="assets/img/canje/' + esc(S.imagen || "sorteo_generico.jpg") + '" alt="">' +
      '<p class="eyebrow amber">STARGATE · El Gran Sorteo</p>' +
      '<h2>' + esc(S.premio || P.title || "") + '</h2><p class="sr-proy-sub">' + gan + ' ganador' + (gan === 1 ? '' : 'es') + ' · ' +
      B.reduce(function (a, b) { return a + b.n; }, 0) + ' papeletas de ' + B.length + ' recluta' + (B.length === 1 ? '' : 's') + ' · nadie gana dos</p>' +
      '<div class="sr-bombo">' + B.map(function (b) { return '<span class="sr-chip" data-f="' + esc(b.ficha) + '">' + esc(b.alias) + ' <i>×' + b.n + '</i></span>'; }).join("") + '</div>' +
      '<div class="sr-res" id="sr-res" aria-live="polite"></div>' +
      '<p class="sr-proy-bot"><button class="btn epico" id="sr-go"><span class="ep-luz"></span><span class="ep-txt"><img class=ico src=assets/img/iconos/p/dados.png alt> ¡Sortear!</span></button> ' +
      '<button class="btn" id="sr-pantalla">⛶ Pantalla completa</button> <button class="btn" id="sr-salir">Cerrar</button></p></div>';
    document.body.appendChild(capa);
    var cerrar = function () { if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); capa.remove(); refrescar().then(function () { TAB = "sorteos"; pintar(); }); };
    capa.querySelector("#sr-salir").onclick = cerrar;
    capa.querySelector("#sr-pantalla").onclick = function () { if (capa.requestFullscreen) capa.requestFullscreen().catch(function () {}); };
    capa.querySelector("#sr-go").onclick = async function () {
      var go = this;
      if (Number(x.ticketDeadline) > Date.now() &&
          !(await window.SG.preguntar({ titulo: "¿Sortear ahora?", texto: "Todavía no es el día del sorteo (" + diaDe(x.ticketDeadline) + "). Si sorteas ya, se cierra la venta de participaciones.",
            si: "Sortear ahora" }))) return;
      go.disabled = true; go.querySelector(".ep-txt").textContent = "Sorteando…";
      var res;
      try { res = await MOTOR.sortear(PER, x.docId); }
      catch (e) { go.disabled = false; go.querySelector(".ep-txt").innerHTML = "<img class=ico src=assets/img/iconos/p/dados.png alt> ¡Sortear!"; $("#sr-res", capa).innerHTML = '<p class="malo">' + esc(e.message) + '</p>'; return; }
      var chips = [].slice.call(capa.querySelectorAll(".sr-chip")), quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      var caer = function (g) {
        return new Promise(function (ok) {
          var libres = chips.filter(function (c) { return !c.classList.contains("gana"); }), pasos = quieto ? 0 : 26, i = 0, t = 60;
          var paso = function () {
            chips.forEach(function (c) { c.classList.remove("luz"); });
            if (i >= pasos) { var c = capa.querySelector('.sr-chip[data-f="' + g.ficha + '"]'); if (c) c.classList.add("gana"); return ok(); }
            var c2 = libres[Math.floor(Math.random() * libres.length)]; if (c2) c2.classList.add("luz");
            i++; t = Math.round(t * 1.11); setTimeout(paso, t);
          };
          paso();
        });
      };
      var dichos = [];
      for (var k = 0; k < res.ganadores.length; k++) {
        await caer(res.ganadores[k]);
        dichos.push('<b>' + esc(res.ganadores[k].alias) + '</b>');
        $("#sr-res", capa).innerHTML = '<p class="sr-gana"><img class=ico src=assets/img/iconos/p/rankings.png alt> ' + dichos.join(" · ") + '</p>';
        await new Promise(function (ok) { setTimeout(ok, quieto ? 0 : 900); });
      }
      $("#sr-res", capa).innerHTML = '<p class="sr-gana"><img class=ico src=assets/img/iconos/p/rankings.png alt> ' + dichos.join(" · ") + '</p><p class="sr-proy-sub">¡Enhorabuena! ' +
        (res.ganadores.length > 1 ? 'Os' : 'Te') + ' llevá' + (res.ganadores.length > 1 ? 'is' : 's') + ' ' + esc(res.premio) + '.</p>';
      go.remove();   // (`hidden` no basta: .btn lleva su propio display)
    };
  }

  // ---------------------------------------------------------------- el calendario del grupo
  /**
   * EL CALENDARIO DEL GRUPO (13-sep). Norberto: «algo fácil para ajustar fechas: a veces hay cambios,
   * en Navidad se retrasa una semana, o Semana Santa… una página dedicada que se vea el calendario
   * con posibilidad de mover o congelar una semana». Y del Zoco: «¿botón Abrir ya? Sí».
   *
   * Se toca un BORRADOR —nada se guarda hasta «Guardar»— y abajo se ve qué cambia. Al guardar se
   * recalculan TODAS las fechas que cuelgan de la semana (cierre de retos y de canje, cuándo se ve
   * cada planeta, cuándo se abre cada cosa del Mercado) con la MISMA receta que al crear el grupo
   * (motor/paquete.js + motor/semanas.js): un grupo movido y uno recién creado no pueden discrepar.
   *
   * 🔴 Lo pasado no se toca: solo se congelan semanas que aún no han empezado. Congelar la de hoy
   * haría retroceder el curso una semana a mitad de clase (y volvería a cerrar lo que ya se abrió).
   */
  var CAL = null;   // el borrador: { per, inicio, pausas: [], abiertos: {} }
  var MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var DSEM = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  function diaCorto(iso) { var d = window.SGSEMANAS.fecha(iso); return DSEM[d.getDay()] + " " + d.getDate() + " " + MES[d.getMonth()]; }
  function calDelGrupo() {
    var S = DATOS.proyecto.stargate || {}, SS = window.SGSEMANAS;
    return { per: PER, inicio: S.inicio || "", pausas: SS.limpias(S.inicio, S.pausas || []),
             abiertos: Object.assign({}, S.capitulosAbiertos || {}) };
  }
  /** Las fechas que salen de un calendario (inicio + pausas), con la receta de crear el grupo. */
  function fechasDe(c) {
    var S = DATOS.proyecto.stargate || {};
    return window.SG.PAQUETE.paquete({ id: PER, nombre: DATOS.proyecto.name || PER, tipo: S.tipo, inicio: c.inicio,
                                        pausas: c.pausas, docentes: [] }, window.SG_CATALOGO);
  }
  function capsDelCalendario() { return (window.SG_CAPITULOS || []).filter(function (c) { return c.listo !== false && c.clave !== "c1"; }); }
  /**
   * 15-sep · EL CALENDARIO, COMO UN CALENDARIO. Norberto: «congelar es confuso, porque tampoco cambia la fecha de la
   * siguiente. ¿No sería más fácil verlo como un calendario? Sería mucho más visual… tan sencillo como poner el número
   * total de semanas y marcar las que NO son lectivas. La versión vista, sin edición, la debería poder ver el docente raso».
   *
   * Una fila por semana, con sus siete días: a la izquierda su número (S5), o 🎄 si es festiva de la UNIR, ⏸ si es no
   * lectiva y 🛒 la de canje; a la derecha, lo que se abre. El referente pulsa una semana futura para marcarla como no
   * lectiva (o devolverla): las de detrás se renumeran en el acto y «Al guardar» dice qué semanas se mueven y a qué día.
   * Nada se escribe hasta «Guardar». El número de semanas lectivas lo fija el tipo de curso (15 el regular, 8 el PUA):
   * sobre ellas están repartidos los planetas, los retos y el Mercado.
   */
  var INICIALES = ["D", "L", "M", "X", "J", "V", "S"];
  function verCalendario(t) {
    var S = DATOS.proyecto.stargate || {}, SS = window.SGSEMANAS, cat = window.SG_CATALOGO || {};
    // 19-sep · verlo, en la Nave (para todo el equipo); editarlo, solo en «Gestionar grupos» (lo eligió Norberto)
    var edita = soyRefAqui() && GESTION;
    if (!edita || !CAL || CAL.per !== PER) CAL = calDelGrupo();
    var tipo = S.tipo === "PUA" ? "PUA" : "REGULAR", total = (cat.semanas || {})[tipo] || 15, extra = cat.semanasCanjeExtra || 1;
    var re = function () { verCalendario(t); };
    if (!CAL.inicio) {
      $("#c-cuerpo").innerHTML = '<div class="card cal-caja"><h3><img class=ico src=assets/img/iconos/p/calendario.png alt> El calendario del grupo</h3>' + (edita
        ? '<p>Este grupo aún no tiene fecha de semana 1. Ponla y verás el curso entero (con las semanas festivas de la UNIR ya marcadas).</p>' +
          '<div class="cal-cab"><label>Primer día de la semana 1 <input type="date" id="cal-inicio"></label></div>'
        : '<p class="muted">Tu referente aún no ha puesto la fecha de la semana 1.</p>') + "</div>";
      if ($("#cal-inicio")) $("#cal-inicio").onchange = function () {
        if (!/^\d{4}-\d\d-\d\d$/.test(this.value)) return;
        CAL.inicio = this.value; CAL.pausas = SS.festivosUNIR ? SS.festivosUNIR(this.value, total, extra) : []; re();
      };
      return;
    }
    var hoy = SS.iso(new Date()), semHoy = SS.semanaDelCurso(CAL.inicio, CAL.pausas);
    var filas = SS.calendario(CAL.inicio, CAL.pausas, total, extra);
    var caps = capsDelCalendario(), semCap = function (c) { return (c.semanas || {})[tipo] || 99; };
    var planetas = (cat.temas || []).map(function (x) {
      return { n: x.n, nombre: x.planeta, sem: window.SG.PAQUETE.semanaEnTipo((cat.semanaDelTema || {})[String(x.n)] || x.n, tipo, cat) };
    });
    // las semanas festivas de la UNIR (Navidad y Semana Santa): con su nombre, para que nadie las tome por un error
    var festivas = SS.festivosUNIR ? SS.festivosUNIR(CAL.inicio, total, extra) : [];
    var fiesta = function (ini) { var m = ini.slice(5, 7); return m === "12" || m === "01" ? "Navidad" : "Semana Santa"; };
    var nuevo = fechasDe(CAL).proyecto.stargate;
    var dia0 = SS.fecha(CAL.inicio).getDay(), cabDias = "";
    for (var k = 0; k < 7; k++) cabDias += "<span>" + INICIALES[(dia0 + k) % 7] + "</span>";
    var noLect = filas.filter(function (f) { return f.congelada; }).length;
    // las festivas de la UNIR que aún cuentan como lectivas (y no han pasado): un grupo creado antes de la regla
    var sinSaltar = festivas.filter(function (x) { return CAL.pausas.indexOf(x) < 0 && x > SS.iso(new Date()); });

    var fila = function (f, idx) {
      var pasada = f.fin < hoy, actual = f.inicio <= hoy && hoy <= f.fin, futura = f.inicio > hoy;
      var festiva = f.congelada && festivas.indexOf(f.inicio) >= 0;
      var clase = f.congelada ? (festiva ? "festivo" : "nolectiva") : f.canje ? "canje" : "lectiva";
      var et = f.congelada ? (festiva ? "<img class=ico src=assets/img/iconos/p/calendario.png alt>" : "<img class=ico src=assets/img/iconos/p/pausa.png alt>") : f.canje ? "<img class=ico src=assets/img/iconos/p/mercado.png alt>" : "S" + f.semana;
      var que = [];
      // 15-sep · Norberto: «hay que saltarse SIEMPRE la semana del 24 de diciembre, la siguiente y la de Jueves Santo». Los grupos
      // nuevos nacen así; en uno de antes, una festiva que aún cuenta como lectiva se señala (y abajo se saltan todas de un clic).
      if (!f.congelada && festivas.indexOf(f.inicio) >= 0) que.push('<span class="cal-aviso"><img class=ico src=assets/img/iconos/p/calendario.png alt> ' + fiesta(f.inicio) + ' en la UNIR: debería ser no lectiva</span>');
      if (f.congelada) que.push(festiva ? "<b>" + fiesta(f.inicio) + "</b> en la UNIR: no hay clase" : "<b>No lectiva</b>: el curso no avanza esta semana");
      else {
        planetas.filter(function (p) { return p.sem === f.semana; }).forEach(function (p) { que.push("<img class=ico src=assets/img/iconos/p/varios.png alt> Planeta " + p.n + " · " + esc(p.nombre)); });
        caps.filter(function (c) { return semCap(c) === f.semana; }).forEach(function (c) {
          que.push(c.icono + " " + esc(c.titulo) + (CAL.abiertos[c.clave] ? ' <span class="chip ok">ya abierto</span>' : "")); });
        if (f.semana === total) que.push("<img class=ico src=assets/img/iconos/p/hecho.png alt> Último día para registrar retos: <b>" + diaCorto(f.fin) + "</b>");
        if (f.semana === total + extra) que.push("<img class=ico src=assets/img/iconos/p/mercado.png alt> Último día para canjear: <b>" + diaCorto(f.fin) + "</b>");
        if (f.canje && !que.length) que.push('<span class="muted">Semana de canje: sin retos nuevos</span>');
      }
      var dias = "";
      for (var d = 0; d < 7; d++) {
        var iso = SS.masDias(f.inicio, d), dt = SS.fecha(iso), mes = dt.getDate() === 1 || (idx === 0 && d === 0);
        dias += '<span class="cal-d' + (iso === hoy ? " hoy" : "") + (mes ? " mes" : "") + '">' + dt.getDate() + (mes ? "<small>" + MES[dt.getMonth()] + "</small>" : "") + "</span>";
      }
      var toca = edita && futura;
      return '<div class="cal-fila ' + clase + (actual ? " actual" : "") + (pasada ? " pasada" : "") + (toca ? " toca" : "") + '"' +
        (toca ? ' data-cal-tg="' + f.inicio + '" role="button" tabindex="0" aria-pressed="' + !!f.congelada + '" title="' +
          (f.congelada ? "Pulsa para que vuelva a ser lectiva" : "Pulsa para marcarla como no lectiva") + '"' : "") + ">" +
        '<span class="cal-et">' + et + "</span><span class=\"cal-7\">" + dias + "</span>" +
        '<span class="cal-que">' + (que.join("<br>") || "") + (actual ? ' <span class="chip wip">hoy</span>' : "") + "</span>" +
        (toca ? '<span class="cal-tg">' + (f.congelada ? "↩︎ Que sea lectiva" : "Marcar no lectiva") + "</span>" : "") + "</div>";
    };

    var hoyTxt = semHoy < 1 ? "aún no ha empezado" : semHoy > total + extra ? "curso terminado" : SS.pausaDe(CAL.inicio, CAL.pausas) ? "semana no lectiva"
               : semHoy > total ? "semana de canje" : "semana " + semHoy + " de " + total;
    // lo que cambia al guardar (solo el referente tiene borrador)
    var cambios = [], S0 = calDelGrupo();
    if (edita) {
      var mas = CAL.pausas.filter(function (p) { return S0.pausas.indexOf(p) < 0; }), menos = S0.pausas.filter(function (p) { return CAL.pausas.indexOf(p) < 0; });
      if (CAL.inicio !== S0.inicio) cambios.push("La semana 1 empieza el <b>" + diaCorto(CAL.inicio) + "</b>" + (S0.inicio ? " (antes, el " + diaCorto(S0.inicio) + ")" : "") + ".");
      mas.forEach(function (p) { cambios.push("La semana del <b>" + diaCorto(p) + "</b> pasa a ser <b>no lectiva</b>."); });
      menos.forEach(function (p) { cambios.push("La semana del <b>" + diaCorto(p) + "</b> vuelve a ser <b>lectiva</b>."); });
      // 🔴 lo que Norberto echaba en falta: que se vea que las de detrás CAMBIAN DE FECHA
      if (S0.inicio) {
        var tramos = [], prev = null;
        for (var n = 1; n <= total + extra; n++) {
          var a0 = SS.inicioDeSemana(S0.inicio, n, S0.pausas), a1 = SS.inicioDeSemana(CAL.inicio, n, CAL.pausas), dd = Math.round(SS.dias(a0, a1) / 7);
          if (dd && prev && prev.dd === dd && prev.hasta === n - 1) prev.hasta = n;
          else if (dd) { prev = { desde: n, hasta: n, dd: dd, dia: a1 }; tramos.push(prev); }
          else prev = null;
        }
        tramos.forEach(function (x) {
          var cuanto = Math.abs(x.dd) + (Math.abs(x.dd) === 1 ? " semana" : " semanas") + (x.dd > 0 ? " más tarde" : " antes");
          cambios.push((x.desde === x.hasta ? "La semana " + x.desde + " va " : "Las semanas " + x.desde + " a " + (x.hasta > total ? total + " y la de canje" : x.hasta) + " van ") +
                       "<b>" + cuanto + "</b>: la " + x.desde + " empieza el <b>" + diaCorto(x.dia) + "</b>.");
        });
      }
      caps.forEach(function (c) {
        if (!!CAL.abiertos[c.clave] !== !!S0.abiertos[c.clave])
          cambios.push(CAL.abiertos[c.clave] ? "Se abre YA " + c.icono + " <b>" + esc(c.titulo) + "</b> (su semana era la " + semCap(c) + ")."
                                              : c.icono + " <b>" + esc(c.titulo) + "</b> vuelve a abrirse en su semana (" + semCap(c) + ").");
      });
      if (S0.inicio) {
        var viejo = fechasDe(S0).proyecto.stargate;
        if (nuevo.cierre !== viejo.cierre) cambios.push("Registrar retos: hasta el <b>" + diaCorto(nuevo.cierre) + "</b> (antes, " + diaCorto(viejo.cierre) + ").");
        if (nuevo.cierreCanje !== viejo.cierreCanje) cambios.push("Canjear: hasta el <b>" + diaCorto(nuevo.cierreCanje) + "</b> (antes, " + diaCorto(viejo.cierreCanje) + ").");
        var semAntes = SS.semanaDelCurso(S0.inicio, S0.pausas);
        if (semAntes !== semHoy) cambios.push("<img class=ico src=assets/img/iconos/p/aviso.png alt> <b>Hoy el grupo pasa de la semana " + semAntes + " a la " + semHoy + ".</b>");
      }
    }

    $("#c-cuerpo").innerHTML =
      '<div class="card cal-caja"><h3><img class=ico src=assets/img/iconos/p/calendario.png alt> El calendario del grupo</h3>' +
      '<div class="cal-resumen">' +
        "<span><b>" + total + "</b> semanas lectivas <em>(" + (tipo === "PUA" ? "PUA" : "curso regular") + ")</em></span>" +
        "<span><b>" + noLect + "</b> no lectiva" + (noLect === 1 ? "" : "s") + "</span>" +
        "<span><b>" + extra + "</b> de canje</span>" +
        "<span>Retos hasta el <b>" + diaCorto(nuevo.cierre) + "</b></span>" +
        "<span>Canje hasta el <b>" + diaCorto(nuevo.cierreCanje) + "</b></span>" +
        '<span class="cal-hoy-txt">Hoy: <b>' + hoyTxt + "</b></span></div>" +
      (sinSaltar.length ? '<p class="cal-aviso-caja"><img class=ico src=assets/img/iconos/p/calendario.png alt> <b>' + sinSaltar.length + (sinSaltar.length === 1 ? " semana festiva" : " semanas festivas") +
        " de la UNIR</b> (Navidad o Semana Santa) " + (sinSaltar.length === 1 ? "cuenta" : "cuentan") + " aún como lectiva" + (sinSaltar.length === 1 ? "" : "s") + " en este grupo." +
        (edita ? ' <button type="button" class="btn min" id="cal-festivos">Saltarlas</button>' : " Díselo a tu referente.") + "</p>" : "") +
      (edita
        ? '<div class="cal-cab"><label>Primer día de la semana 1 <input type="date" id="cal-inicio" value="' + esc(CAL.inicio) + '"></label>' +
          '<p class="small"><b>Pulsa una semana</b> que aún no haya llegado para marcarla como <b>no lectiva</b> (o para que vuelva a serlo). ' +
          "Las de detrás se renumeran solas y abajo verás a qué día se mueve cada una. Nada cambia hasta <b>Guardar</b>.</p></div>"
        : '<p class="small muted">Lo lleva tu referente. Aquí ves cada semana del curso, las que no son lectivas y lo que se abre en cada una.</p>') +
      '<div class="cal-ley"><span class="l lectiva">S1 · lectiva</span><span class="l nolectiva"><img class=ico src=assets/img/iconos/p/pausa.png alt> no lectiva</span>' +
        '<span class="l festivo"><img class=ico src=assets/img/iconos/p/calendario.png alt> festiva UNIR</span><span class="l canje"><img class=ico src=assets/img/iconos/p/mercado.png alt> canje</span><span class="l hoy">hoy</span></div>' +
      '<div class="cal-vis" role="list"><div class="cal-fila cal-cabeza" aria-hidden="true"><span class="cal-et"></span><span class="cal-7">' + cabDias +
        '</span><span class="cal-que">Qué pasa</span></div>' + filas.map(fila).join("") + "</div></div>" +
      (edita
        ? '<div class="card cal-guardar"><h3>Al guardar</h3>' +
          (cambios.length ? "<ul>" + cambios.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" +
            '<p class="small muted">Se recalculan solas las fechas de los planetas y del Mercado. El alumnado lo ve la próxima vez que abra su Nave.</p>' +
            '<p><button type="button" class="btn primary" id="cal-guardar">Guardar el calendario</button> <button type="button" class="btn" id="cal-deshacer">Deshacer los cambios</button></p>'
            : '<p class="small muted">Sin cambios. Marca una semana como no lectiva o abre un capítulo y aquí verás lo que se moverá.</p>') + "</div>" +
          '<div class="card"><h3>Capítulos de la Nave</h3><p class="small muted">Cada capítulo abre algo nuevo en la Nave del alumnado (y NEBULA lo cuenta). ' +
          'Si tu clase va adelantada, ábrelo ya; lo del Mercado que traiga se puede comprar desde hoy.</p><div class="cal-caps">' +
          caps.map(function (c) {
            var porFecha = semHoy >= semCap(c), antes = !!CAL.abiertos[c.clave];
            var cuando = SS.inicioDeSemana(CAL.inicio, semCap(c), CAL.pausas);
            return '<div class="cal-cap' + (porFecha || antes ? " on" : "") + '"><b>' + c.icono + " " + esc(c.titulo) + "</b>" +
              '<span class="small">' + (porFecha ? "Abierto (semana " + semCap(c) + ")" : antes ? "Abierto antes de tiempo · su semana era la " + semCap(c)
                                        : "Se abre la semana " + semCap(c) + " · " + diaCorto(cuando)) + "</span>" +
              (porFecha ? "" : antes ? '<button type="button" class="btn min" data-cal-cierra="' + c.clave + '">↩ Volver a su semana</button>'
                                     : '<button type="button" class="btn min" data-cal-abre="' + c.clave + '"><img class=ico src=assets/img/iconos/p/abierto.png alt> Abrir ya</button>') + "</div>";
          }).join("") + "</div></div>"
        : "");
    if (!edita) return;
    $("#cal-inicio").onchange = function () {
      var nuevoIni = this.value; if (!/^\d{4}-\d\d-\d\d$/.test(nuevoIni)) return;
      // las no lectivas se quedan en las mismas semanas del calendario (recolocadas sobre la rejilla nueva)
      CAL.pausas = SS.limpias(nuevoIni, CAL.pausas.map(function (p) {
        var d = SS.dias(nuevoIni, p); return d < 0 ? "" : SS.masDias(nuevoIni, Math.floor(d / 7) * 7); }));
      CAL.inicio = nuevoIni; re();
    };
    if ($("#cal-festivos")) $("#cal-festivos").onclick = function () { CAL.pausas = SS.limpias(CAL.inicio, CAL.pausas.concat(sinSaltar)); re(); };
    Array.prototype.forEach.call(app.querySelectorAll("[data-cal-tg]"), function (b) {
      var cambia = function () {
        var p = b.getAttribute("data-cal-tg");
        CAL.pausas = CAL.pausas.indexOf(p) >= 0 ? CAL.pausas.filter(function (x) { return x !== p; }) : SS.limpias(CAL.inicio, CAL.pausas.concat([p]));
        re();
      };
      b.onclick = cambia;
      b.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cambia(); } };
    });
    Array.prototype.forEach.call(app.querySelectorAll("[data-cal-abre]"), function (b) {
      // se guarda la SEMANA en que se abre (no un «sí»): la sesión proyectada lo presenta esa semana
      b.onclick = function () { CAL.abiertos[b.getAttribute("data-cal-abre")] = Math.max(1, semHoy || 1); re(); }; });
    Array.prototype.forEach.call(app.querySelectorAll("[data-cal-cierra]"), function (b) {
      b.onclick = function () { delete CAL.abiertos[b.getAttribute("data-cal-cierra")]; re(); }; });
    if ($("#cal-deshacer")) $("#cal-deshacer").onclick = function () { CAL = calDelGrupo(); re(); };
    if ($("#cal-guardar")) $("#cal-guardar").onclick = async function () {
      var b = this; b.disabled = true; b.textContent = "Guardando…";
      try {
        var paq = fechasDe(CAL), st = paq.proyecto.stargate, hoyMs = SS.fecha(new Date()).getTime();
        // lo del Mercado de un capítulo abierto antes de tiempo, a la venta desde hoy
        var tiposYa = {};
        caps.forEach(function (c) { if (CAL.abiertos[c.clave]) (c.mercado || []).forEach(function (x) { tiposYa[x] = true; }); });
        var porId = function (lista) { var m = {}; (lista || []).forEach(function (x) { m[x.id] = x.docId; }); return m; };
        var docC = porId(DATOS.campanas), docR = porId(DATOS.recompensas), escribir = [];
        var suyo = {}; (DATOS.recompensas || []).forEach(function (x) { suyo[x.docId] = x; });
        paq.campanas.forEach(function (c) {
          if (c.visibleFromTimestamp != null && docC[c.id]) escribir.push(["campaigns", docC[c.id], { visibleFromTimestamp: c.visibleFromTimestamp }]); });
        paq.recompensas.forEach(function (r) {
          if (r.inStore === false || r.availableFrom == null || !docR[r.id]) return;
          var ya = suyo[docR[r.id]] || {};
          // 14-sep · un sorteo ya hecho, o con fechas que puso el referente a mano, no se mueve
          if (ya.isRaffleCompleted || (ya.stargateSorteo && ya.stargateSorteo.fijo)) return;
          var desde = tiposYa[r.stargateTipo] ? Math.min(r.availableFrom, hoyMs) : r.availableFrom;
          var campos = { availableFrom: desde, availableUntil: r.availableUntil };
          if (r.systemEffect === "lottery_ticket") {
            campos.ticketDeadline = r.ticketDeadline;
            campos["stargateSorteo.fecha"] = r.ticketDeadline; campos["stargateSorteo.desde"] = desde;
          }
          escribir.push(["rewards", docR[r.id], campos]); });
        await MOTOR.guardarCalendario(PER, {
          "stargate.inicio": CAL.inicio, "stargate.pausas": CAL.pausas, "stargate.capitulosAbiertos": CAL.abiertos,
          "stargate.apertura": st.apertura, "stargate.cierre": st.cierre, "stargate.cierreCanje": st.cierreCanje }, escribir);
        await refrescar(); CAL = calDelGrupo();
        aviso("Calendario guardado: " + escribir.length + " fechas recalculadas.", true);
      } catch (e) { b.disabled = false; b.textContent = "Guardar el calendario"; aviso(e.message); }
    };
  }

  /**
   * 🗑️ EMPEZAR DE CERO (13-sep). Norberto: «elimina todo lo viejo, empezamos de cero». Borrar datos
   * de producción lo hace él, con este botón: escribe el nombre del grupo y confirma. Lo borra el
   * servidor (`deleteProject` de GamificaPro: el grupo, su alumnado, retos, Mercado, llamadas, Zoco y
   * alias). Solo quien lo creó o un referente vitalicio; el grupo de la demostración pública, nunca.
   */
  /**
   * 18-sep · EL GRUPO DE UN VISTAZO. Norberto: «dentro de cada grupo, un landing con insights sobre ese grupo». Todo sale
   * de lo que la consola ya tiene (el tablero del grupo): ni una lectura más a Firestore.
   */
  function filaNombres(tit, L, a) {
    if (!L.length) return "";
    return '<p class="c-res-top c-res-ojo"><span>' + esc(tit) + ' · ' + L.length + '</span> ' +
      L.slice(0, 10).map(function (r) { return '<b>' + esc(r.alias) + '</b>'; }).join(" · ") + (L.length > 10 ? ' <em>y ' + (L.length - 10) + ' más</em>' : '') +
      ' <button type="button" class="btn min" data-av data-escribir="' + a + '">' + ico("mensaje") + ' Escribirles</button></p>';
  }
  /**
   * 🔴 20-sep · LAS CIFRAS DEL GRUPO, DE UN VISTAZO. Norberto: «no me gustan los círculos… ¿hay algo que simule un
   * círculo que se llena en función del porcentaje completado? ¿podría aparecer un porcentaje con efecto de llenado y
   * al poner el ratón encima que aparezca la fracción "5/17"?». Eso es: un aro que se llena al entrar, el PORCENTAJE
   * dentro y la fracción al pasar por encima. Y en la misma caja, NEBULA (su botón abre los consejos aquí mismo) y
   * los destacados de la semana con su cara, su alias y qué han hecho.
   */
  var DON_C = 213.6;   // la vuelta entera del aro (2·π·34)
  function donut(hechos, total, cls, etiqueta) {
    var pct = total ? Math.max(0, Math.min(100, Math.round(hechos * 100 / total))) : 0;
    var falta = (DON_C * (100 - pct) / 100).toFixed(1);
    return '<div class="c-don ' + cls + '" title="' + hechos + '/' + total + '" role="img" aria-label="' + esc(etiqueta) + ': ' + hechos + ' de ' + total + ', el ' + pct + ' %">' +
      '<svg viewBox="0 0 80 80" aria-hidden="true"><circle class="pista" cx="40" cy="40" r="34"/>' +
        '<circle class="val" cx="40" cy="40" r="34" style="stroke-dasharray:' + DON_C + ';stroke-dashoffset:' + falta + '"/></svg>' +
      '<b class="c-don-n">' + pct + '<i>%</i></b>' +
      '<span class="c-don-f">' + hechos + '/' + total + '</span></div>';
  }
  function cifra(hechos, total, cls, tit, pie) {
    return '<div class="c-cifra">' + donut(hechos, total, cls, tit) +
      '<span class="c-cifra-t"><b>' + hechos + ' ' + esc(tit) + '</b><em>' + esc(pie) + '</em></span></div>';
  }
  /** Qué ha hecho esta semana quien destaca: lo justo para nombrarlo en voz alta. */
  function hitoDe(r, retosSem) {
    var suyos = (retosSem || []).filter(function (x) { return (r.hechos || []).indexOf(x.id) >= 0; });
    if (suyos.length) return suyos.length === 1 ? "ha hecho " + suyos[0].id : "ha hecho " + suyos.map(function (x) { return x.id; }).join(" y ");
    if (r.corona) return "lleva la corona del grupo";
    if (Number(r.n)) return "ya lleva " + r.n + (Number(r.n) === 1 ? " insignia" : " insignias");
    return "se ha movido esta semana";
  }
  function resumenGrupo(t, gente, extra) {
    var R = gente || (t && t.reclutas) || [], n = R.length, X = extra || {};
    if (!n) return '<div class="card c-resumen vacio"><b>Todavía no se ha alistado nadie.</b> <span class="small muted">Comparte la invitación: el código de clase está en <b>Reclutas</b>.</span> <button type="button" class="btn min" data-tab-ir="alumnado">Ir a Reclutas</button></div>';
    var activos = R.filter(function (r) { return Number(r.xp7) > 0; }).length;
    var sinNada = R.filter(function (r) { return !(r.hechos || []).length; }).length;
    var retos = R.reduce(function (a, r) { return a + (r.hechos || []).length; }, 0);
    // el techo de los retos: lo que se podría haber registrado de lo ya lanzado (así el aro significa algo)
    var posibles = Math.max(retos, n * Math.max(1, Number(X.lanzados) || 1));
    var top = R.filter(function (r) { return Number(r.xp7) > 0; }).sort(function (a, b) { return Number(b.xp7) - Number(a.xp7); }).slice(0, 3);
    var cola = 0; try { cola = pendientesCola(); } catch (e) {}
    var tipoG = ((DATOS.proyecto || {}).stargate || {}).tipo || "REGULAR";
    var consejos = X.consejos || [];
    return '<div class="card c-resumen">' +
      '<div class="c-res-arriba">' +
        '<div class="c-res-cifras">' +
          cifra(n, n, "todo", n === 1 ? "alistado" : "alistados", "en tu escuadrón") +
          cifra(activos, n, "bien", "activos", "esta semana") +
          cifra(retos, posibles, "retos", "retos", "registrados de los lanzados") +
          cifra(sinNada, n, sinNada ? "aviso" : "bien", "sin estrenarse", sinNada ? "aún no han registrado nada" : "todo el mundo ha empezado") +
          (cola ? cifra(cola, n, "aviso", cola === 1 ? "subida de nota" : "subidas de nota", "esperan tu visto bueno") : "") +
        '</div>' +
        // 🔴 NEBULA, aquí dentro: «un botón relativamente grande que se adapte al espacio que le queda… al hacer clic
        // se amplía la caja por debajo y aparecen los consejos, uno detrás de otro»
        (consejos.length ? '<button type="button" class="c-neb-b" id="c-neb-b" aria-expanded="false" aria-controls="c-neb-p">' +
          '<img src="assets/img/personajes/nebula.png" alt="">' +
          '<span class="c-neb-t"><b>NEBULA</b><em>' + consejos.length + (consejos.length === 1 ? ' consejo para esta semana' : ' consejos para esta semana') + '</em>' +
            '<em class="c-neb-prev">«' + esc(String(consejos[0].t || "").slice(0, 118)) + (String(consejos[0].t || "").length > 118 ? '…' : '') + '»</em></span>' +
          '<span class="c-neb-mas" aria-hidden="true">▾</span></button>' : '') +
      '</div>' +
      (consejos.length ? '<div class="c-neb-p" id="c-neb-p" hidden><p id="pt-neb-p" aria-live="polite"></p>' +
        '<p class="pt-neb-pie"><span id="pt-neb-acc"></span>' + (consejos.length > 1 ? '<button type="button" class="btn min" id="pt-neb-otro">Siguiente consejo</button>' +
          '<span class="small muted" id="pt-neb-n"></span>' : '') + '</p></div>' : '') +
      (top.length ? '<div class="c-top"><b class="ht-sub">Esta semana destacan</b><div class="c-top-g">' + top.map(function (r) {
          var cara = window.SG && SG.avatarImg ? SG.avatarImg(r.avatar, r.alias, "c-top-av" + (r.marco === "oro" ? " marco-oro" : ""), r.xp, tipoG) : "";
          return '<div class="c-top-u">' + cara + '<span><b>' + esc(r.alias) + (r.corona ? ' <img class=ico src=assets/img/iconos/p/corona.png alt>' : '') + '</b>' +
            '<em>' + esc(hitoDe(r, X.retosSem)) + '</em></span><span class="c-top-xp">+' + Number(r.xp7) + ' xp</span></div>';
        }).join("") + '</div></div>' : '') +
      // 19-sep · «estudiantes activos, estudiantes pasivos… algo para que pueda ver lo que hace falta»
      filaNombres("En silencio esta semana", R.filter(function (r) { return !Number(r.xp7) && (r.hechos || []).length; }), "silencio") +
      filaNombres("Sin estrenarse", R.filter(function (r) { return !(r.hechos || []).length; }), "sin") +
    '</div>';
  }
  /**
   * 🔴 18-sep · LO DE CADA DOCENTE EN SU GRUPO (su Genially propio y su sesión a medida). La consola llamaba a
   * `SG.FUENTE.accion(...)`, pero la consola NO carga fuente.js: el botón «Guardar» de «Tu panel de Genially» nunca
   * funcionó aquí (lo destapó la prueba de la sesión a medida). Se escribe directamente con el motor, que sí está.
   * Las reglas dejan a cualquier docente del grupo tocar `stargate` (menos el equipo y el mando).
   */
  async function guardarMiParte(campo, nombre, valor) {
    nombre = String(nombre || "").trim();
    if (!nombre) throw new Error("No sé quién eres en este grupo.");
    var ref = MOTOR.doc(MOTOR.db, "projects", PER), pd = await MOTOR.getDoc(ref);
    var m = Object.assign({}, (((pd.exists() ? pd.data() : {}) || {}).stargate || {})[campo] || {});
    var vacio = valor == null || valor === "" || (Array.isArray(valor) && !valor.length);
    if (vacio) delete m[nombre]; else m[nombre] = valor;
    var cambio = {}; cambio["stargate." + campo] = m;
    await MOTOR.updateDoc(ref, cambio);
  }
  /** Lo mismo que `guardarMiParte`, pero en un grupo cualquiera (los ajustes del panel tocan todos los tuyos). */
  async function guardarParteEn(per, campo, nombre, valor) {
    nombre = String(nombre || "").trim();
    if (!per || !nombre) return false;
    var ref = MOTOR.doc(MOTOR.db, "projects", per), pd = await MOTOR.getDoc(ref);
    var m = Object.assign({}, (((pd.exists() ? pd.data() : {}) || {}).stargate || {})[campo] || {});
    var vacio = valor == null || valor === "" || (Array.isArray(valor) && !valor.length);
    if (vacio) delete m[nombre]; else m[nombre] = valor;
    var cambio = {}; cambio["stargate." + campo] = m;
    await MOTOR.updateDoc(ref, cambio);
    return true;
  }
  /** Tu nombre en el equipo docente de un grupo (con él se guarda lo tuyo: tu Genially, tu sesión). */
  function miNombreEn(p) {
    // `miNombre` lo pone el motor desde la lista privada del equipo (los correos no están en el grupo público)
    if (p && p.miNombre) return p.miNombre;
    return ((((p && p.stargate) || {}).docentes || []).filter(function (d) {
      return String(d.correo || "").toLowerCase() === String((YO && YO.correo) || "").toLowerCase(); })[0] || {}).nombre || "";
  }
  /**
   * 19-sep · ⚙ AJUSTES DEL PANEL: tu comandante y tu sesión en directo para TODOS tus grupos en marcha de una vez.
   * Dentro de cada grupo (Mis enlaces) se puede afinar para uno solo; aquí se escribe lo mismo en cada uno.
   */
  function pintarAjustes(caja, vivos, avBtn) {
    var mios = vivos.filter(function (p) { return !!miNombreEn(p); });
    var base = mios[0] ? ((((mios[0].stargate || {}).sesiones) || {})[miNombreEn(mios[0])] || []) : [];
    var distintos = mios.some(function (p) {
      var o = (((p.stargate || {}).sesiones) || {})[miNombreEn(p)] || [];
      return o.slice().sort().join() !== base.slice().sort().join();
    });
    caja.innerHTML = '<div class="doc-aj-grid">' +
      '<div class="card"><h3>Tu comandante</h3><p class="small muted">El retrato con el que apareces en tu panel. Elige entre los 26 del reparto.</p>' +
        '<p><button type="button" class="btn" id="doc-aj-ava">Elegir comandante</button></p></div>' +
      '<div class="card m-sesion"><h3>Tu sesión en directo · en todos tus grupos</h3>' +
        (mios.length
          ? '<p class="small muted">Marca lo que quieres en tu presentación; se aplica a tus <b>' + mios.length + '</b> ' + (mios.length === 1 ? "grupo en marcha" : "grupos en marcha") +
            ' (' + esc(mios.map(function (p) { return p.nombre; }).join(" · ")) + '). Por defecto sale todo; lo que quites tampoco lo ve tu alumnado cuando te sigue. ' +
            'Para un solo grupo: dentro del grupo, en <b>Mis enlaces</b>.</p>' +
            (distintos ? '<p class="small aviso-suave">Ahora mismo tus grupos no tienen la misma selección: te enseño la de «' + esc(mios[0].nombre) + '». Al tocar una casilla, todos quedan igual.</p>' : '') +
            casillasSesion(base) +
            '<p class="small m-sec-msg" id="doc-aj-msg" aria-live="polite"></p>'
          : '<p class="small muted">No te encuentro en el equipo docente de ningún grupo en marcha con <b>' + esc((YO && YO.correo) || "") + '</b>.</p>') +
      '</div></div>';
    var bAva = caja.querySelector("#doc-aj-ava");
    if (bAva && avBtn) bAva.onclick = function () { avBtn.click(); avBtn.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
    Array.prototype.forEach.call(caja.querySelectorAll(".m-sec input"), function (c) {
      c.onchange = async function () {
        var off = Array.prototype.filter.call(caja.querySelectorAll(".m-sec input"), function (x) { return !x.checked; })
          .map(function (x) { return x.getAttribute("data-sec"); });
        var msg = caja.querySelector("#doc-aj-msg"); msg.textContent = "Guardando en tus " + mios.length + " grupos…";
        try {
          await Promise.all(mios.map(function (p) {
            return guardarParteEn(p.id, "sesiones", miNombreEn(p), off).then(function () {
              p.stargate = p.stargate || {}; p.stargate.sesiones = p.stargate.sesiones || {};
              if (off.length) p.stargate.sesiones[miNombreEn(p)] = off; else delete p.stargate.sesiones[miNombreEn(p)];
            });
          }));
          msg.textContent = "✓ Guardado en " + mios.length + (mios.length === 1 ? " grupo" : " grupos") + (off.length ? " · quitas " + off.length + (off.length === 1 ? " sección" : " secciones") : " · sale todo");
        } catch (e) { c.checked = !c.checked; msg.textContent = "No se ha podido guardar: " + (e.message || e); }
      };
    });
  }
  var VITALICIOS_WEB = ["n.cuartero.10@gmail.com", "mutecdgami@gmail.com"];
  /**
   * 🔴 20-sep · Un referente VITALICIO puede borrar cualquier grupo de STARGATE (el servidor ya lo hacía), pero aquí no
   * le salía el botón: se miraba `YO.email` y la sesión guarda el correo en `YO.correo`. Como el fallo era silencioso
   * —ni error ni aviso, simplemente no aparecía— se leen los dos nombres y se acabó.
   */
  function correoYo() { var u = YO || {}; return String(u.correo || u.email || "").toLowerCase(); }
  function esVitalicio() { return VITALICIOS_WEB.indexOf(correoYo()) >= 0; }
  function puedoBorrar() {
    var P = DATOS.proyecto || {}, u = YO || {};
    return !!u.uid && (P.ownerId === u.uid || P.teacherId === u.uid || esVitalicio());
  }
  function tarjetaBorrar() {
    var P = DATOS.proyecto || {}, S = P.stargate || {};
    if (Number(S.demoSemana || 0) > 0) return '<div class="card"><h3><img class=ico src=assets/img/iconos/p/papelera.png alt> Borrar este grupo</h3><p class="small muted">Es el grupo de la demostración pública: no se borra desde aquí.</p></div>';
    if (!puedoBorrar()) return '<div class="card"><h3><img class=ico src=assets/img/iconos/p/papelera.png alt> Borrar este grupo</h3><p class="small muted">Solo puede borrarlo quien lo creó' +
      (P.ownerEmail ? " (" + esc(P.ownerEmail) + ")" : "") + " o un referente vitalicio.</p></div>";
    return '<div class="card zona-peligro"><h3><img class=ico src=assets/img/iconos/p/papelera.png alt> Borrar este grupo</h3>' +
      '<p class="small">Se borra <b>todo</b>: el grupo, las fichas de su alumnado, sus retos, el Mercado, las llamadas, el Zoco y los alias. ' +
      '<b>No se puede deshacer.</b> Pensado para los grupos de prueba.</p>' +
      '<label>Para confirmarlo, escribe su nombre: <b>' + esc(P.name || PER) + '</b> <span class="small muted">(sin preocuparte de mayúsculas, acentos ni signos)</span><input id="s-borrar-nombre" autocomplete="off" spellcheck="false"></label>' +
      '<p><button class="btn peligro" id="s-borrar" type="button" disabled>Borrar el grupo para siempre</button></p></div>';
  }
  function cablearBorrar() {
    var inp = $("#s-borrar-nombre"), b = $("#s-borrar"), nombre = String((DATOS.proyecto || {}).name || PER).trim();
    if (!inp || !b) return;
    // 🔴 19-sep · «PRUEBA · SEMANA 16 (fin del viaje)» no se podía borrar: el «·» no está en el teclado y el botón no se
    // encendía nunca. Se compara sin mayúsculas, acentos, signos ni espacios: «prueba semana 16 fin del viaje» vale
    var plano = function (x) { return String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ""); };
    var coincide = function () { return !!plano(nombre) && plano(inp.value) === plano(nombre); };
    inp.oninput = function () { b.disabled = !coincide(); };
    b.onclick = async function () {
      if (!coincide()) return;
      if (!(await window.SG.preguntar({ titulo: "Última pregunta: ¿borrar «" + nombre + "» y todo lo que tiene?", texto: "No se puede deshacer.",
        si: "Borrar el grupo", peligro: true }))) return;
      b.disabled = true; b.textContent = "Borrando…";
      try {
        await MOTOR.llamar("deleteProject", { projectId: PER });
        location.href = (GESTION ? "gestion.html" : "consola.html") + "?borrado=" + encodeURIComponent(nombre);
      } catch (e) { b.disabled = false; b.textContent = "Borrar el grupo para siempre"; aviso(e.message); }
    };
  }
  function verAjustes(t) {
    var S = DATOS.proyecto.stargate || {}, P = DATOS.privadoPER || {};
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Ajustes del grupo</h3>' +
      '<label>Nombre<input id="s-nombre" value="' + esc(DATOS.proyecto.name) + '"></label>' +
      // 🔴 13-sep · la fecha de la semana 1 vive en «Calendario». Aquí solo cambiaba el documento del
      // grupo: el Mercado y los planetas se quedaban con sus fechas viejas (se abrían en la semana mala).
      '<p class="small">Semana 1: <b>' + esc(S.inicio || "—") + '</b> · retos hasta ' + esc(S.cierre || "—") + ' · canje hasta ' +
      esc(S.cierreCanje || "—") + ' <button class="btn min" data-tab="calendario" type="button"><img class=ico src=assets/img/iconos/p/calendario.png alt> Cambiar en Calendario</button></p>' +
      '<label>Padlet de la clase<input id="s-padlet" value="' + esc(S.padlet || "") + '"></label>' +
      '<label>Ticket de salida <i>(formulario de Google, anónimo)</i><input id="s-ticket" value="' + esc(S.ticket || "") + '"></label>' +
      '<label>Panel de control (ver)<input id="s-panel" value="' + esc(S.panelVer || window.SG_PANEL_MAESTRO || "") + '"></label>' +
      '<label>Panel de control (editar)<input id="s-paneled" value="' + esc(P.panelEdit || window.SG_PANEL_MAESTRO_EDICION || "") + '"></label>' +
      '<p><button class="btn" id="s-guardar">Guardar</button></p></div>' +
      // 🔴 Dos listas separadas, y a propósito. Los de arriba llevan el grupo dentro: uno por
      // grupo y por convocatoria. Los de abajo NO llevan grupo — se deduce de quién pulsa — así que
      // se montan una vez en los Geniallys y no se vuelven a tocar nunca. Mezclarlos haría que se
      // rehicieran los universales cada curso sin necesidad.
      // 🔴 EL CÓDIGO DE ACCESO. Sin él, cualquiera con el enlace se alista. Con él, hay que saber
      // seis caracteres. No es seguridad —el código está en el documento del grupo— pero quita a
      // quien se tropiece con el enlace o a quien se lo reenvíen, que es lo que pasa de verdad.
      '<div class="card"><h3>Código de acceso</h3>' +
      (DATOS.proyecto.joinCode
        ? '<p class="codigo-grande">' + esc(DATOS.proyecto.joinCode) + '</p>' +
          '<p class="small muted">Hace falta para alistarse. El enlace de abajo ya lo lleva dentro, ' +
          'así que quien lo siga no tiene que escribirlo; dícelo en clase para quien llegue sin él.</p>' +
          '<p><button class="btn min" id="s-codigo">Cambiar el código</button> ' +
          '<span class="small muted">si se ha corrido más de la cuenta</span></p>'
        : '<p class="small muted">Este grupo se sembró sin código, así que de momento puede alistarse ' +
          'cualquiera que tenga el enlace.</p>' +
          '<p><button class="btn" id="s-codigo">Poner un código</button></p>') +
      '</div>' +
      '<div class="card"><h3>Enlaces de este grupo</h3>' +
      '<p class="small">Alistamiento (dáselo a tu alumnado):<br><code>' + location.origin + '/alistarse.html?per=' + esc(PER) + MOTOR_EN_ENLACES + (DATOS.proyecto.joinCode ? '&codigo=' + esc(DATOS.proyecto.joinCode) : '') + '</code></p>' +
      '<p class="small">La Nave:<br><code>' + location.origin + '/recluta.html?per=' + esc(PER) + MOTOR_EN_ENLACES + '</code></p>' +
      '<p class="small">La sesión para proyectar:<br><code>' + location.origin + '/sesion.html?per=' + esc(PER) + MOTOR_EN_ENLACES + '</code></p></div>' +
      '<div class="card"><h3>Para los Geniallys · se montan UNA vez</h3>' +
      '<p class="small muted">Ninguno lleva el grupo dentro: piden la cuenta de quien los abre y, si lleva varios grupos, le preguntan cuál. ' +
      'Valen en todos los grupos y todas las convocatorias. En Genially: <b>Insertar → Otros → Código</b> y pegar.</p>' +
      [["<img class=ico src=assets/img/iconos/p/video.png alt> La sesión de la semana", "sesion.html?embed=1"], ["<img class=ico src=assets/img/iconos/p/clase.png alt> Llamada a filas (solo la toca el Comandante)", "llamada.html?embed=1"],
       ["<img class=ico src=assets/img/iconos/p/envivo.png alt> Herramientas de clase (quién ha fichado, premios, al azar)", "aula.html?embed=1"], ["<img class=ico src=assets/img/iconos/p/diana.png alt> Validar un reto", "validar.html?reto=S7&embed=1"],
       // 16-sep · la batalla del reto A6: se pone en el Genially del tema 6 y se juega en clase, cada cual en su dispositivo
       ["<img class=ico src=assets/img/iconos/p/diana.png alt> El Simulador de Joran (el reto A6)", "batalla.html?embed=1"]].map(function (x) {
        return '<p class="small">' + x[0] + ' <button class="btn min" data-copiado="✓ Código copiado" data-copiar="' + esc(codigoGenially(x[1], "STARGATE · " + x[0].replace(/^<img[^>]*>\s*/, ""))) + '">&lt;/&gt; Copiar para insertar</button></p>';
      }).join("") +
      // 15-sep (tarde) · el reto secreto (S7) es el Escape UNI; el enlace escondido de Vínculo lleva a su puerta
      /**
       * 18-sep · EL FINAL DEL ESCAPE, CON SU LLAVE DENTRO. Norberto: «no se valida con palabra mágica, se valida con
       * enlace mágico; al final del escape embeberemos la misión para validarla». El enlace y el código de inserción
       * llevan la llave, así que el alumnado no escribe nada: entra con su cuenta y el reto queda registrado.
       * 🔴 La llave no se guarda en ninguna parte (ni aquí, ni en el grupo, ni en el repositorio, que es público):
       * se pega en este campo y se usa en el momento para montar el enlace.
       */
      '<p class="small"><img class=ico src=assets/img/iconos/p/llave.png alt> <b>El reto secreto (S7) es el Escape UNI</b>. Se registra con el final del escape, y ese enlace ' +
      '<b>lleva la llave dentro</b>: quien lo abre solo entra con su cuenta. Pega aquí tu llave y te lo doy montado.</p>' +
      '<p class="small"><input id="s7-llave" type="text" autocomplete="off" spellcheck="false" placeholder="La llave del Escape UNI" ' +
      'style="max-width:15rem"> <button class="btn min" id="s7-enl" data-copiado="✓ Enlace copiado" data-copiar=""><img class=ico src=assets/img/iconos/p/enlace.png alt> Copiar el enlace del final</button> ' +
      '<button class="btn min" id="s7-cod" data-copiado="✓ Código copiado" data-copiar="">&lt;/&gt; Copiar el código para incrustarlo</button></p>' +
      '<p class="small muted">La llave no se guarda en ningún sitio: se usa aquí mismo. Y si quieres esconder la <b>puerta</b> del escape ' +
      'en la presentación de <b>Vínculo</b>, ponla en algo que no parezca un botón (una estrella, un rincón de la imagen). ' +
      '<button class="btn min" data-copiado="✓ Enlace copiado" data-copiar="' + esc(location.origin + "/fragmento.html") + '"><img class=ico src=assets/img/iconos/p/enlace.png alt> Copiar la puerta escondida</button></p>' +
      '</div>' +
      '';

    var aCal = app.querySelector('#c-cuerpo [data-tab="calendario"]');
    if (aCal) aCal.onclick = function () { TAB = "calendario"; pintar(); };
    if ($("#s-codigo")) $("#s-codigo").onclick = async function () {
      if (DATOS.proyecto.joinCode &&
          !(await window.SG.preguntar({ titulo: "¿Cambiar el código de clase?", texto: "Quien tenga el enlace viejo ya no podrá alistarse hasta que le pases el nuevo.",
            si: "Cambiar el código" }))) return;
      try { var c = await MOTOR.nuevoCodigo(PER); await refrescar(); aviso("Código nuevo: " + c, true); }
      catch (e) { aviso(e.message); }
    };
    $("#s-guardar").onclick = async function () {
      try {
        await MOTOR.guardarAjustes(PER,
          { name: $("#s-nombre").value.trim(),
            "stargate.padlet": $("#s-padlet").value.trim(),
            "stargate.ticket": $("#s-ticket").value.trim(),
            "stargate.panelVer": $("#s-panel").value.trim() },
          { panelEdit: $("#s-paneled").value.trim() });
        await refrescar(); aviso("Guardado", true);
      } catch (e) { aviso(e.message); }
    };
  }

  /**
   * MODO DEMO (?demo=1). El puesto de mando entero, con un grupo de verdad y personas inventadas.
   *
   * 🔴 Lee por la puerta PÚBLICA —la misma que usan los Geniallys proyectados— porque esa no pide
   * sesión, y luego se inventa lo privado: nombres y correos que no son de nadie. Así la captura del
   * tutorial se regenera con un comando y sin credenciales, y enseña la pantalla REAL: si mañana
   * cambia la consola, cambia la captura. Las de la hoja de cálculo envejecían en silencio porque
   * había que sacarlas a mano con una sesión abierta.
   */
  async function demostracion() {
    cargando("Preparando la demostración…");
    var PUB = window.SG_API_PUBLICA ||
      "https://us-central1-gamificapro-99e0a.cloudfunctions.net/tableroStargate";
    var per = url.get("per") || window.SG_PER_DEMO || "demo-stargate";
    var d = await fetch(PUB + "?per=" + encodeURIComponent(per)).then(function (r) { return r.json(); });
    if (d.error) { app.innerHTML = '<div class="card"><h3>La demostración no está disponible</h3><p>' +
      esc(d.error) + "</p></div>"; return; }
    var NOM = [["Vega", "Estrella Ruiz"], ["Orion", "Cazador Paz"], ["Lyra", "Cuerda Sol"],
               ["Nix", "Noche Vera"], ["Talia", "Vuelo Mar"]];
    var privados = {};
    (d.perfiles || []).forEach(function (p, i) {
      var n = NOM[i % NOM.length];
      privados[p.id] = { firstName: n[0], lastName: n[1],
                         email: n[0].toLowerCase() + "@ejemplo.es", bitacora: "", bio: "" };
    });
    /**
     * 🔴 20-sep · En la demostración hay que SER alguien: la Nave enseña «tu gente», y sin nombre ni papel
     * («¿soy referente aquí?», «¿cómo me llamo en este grupo?») la pantalla salía vacía —«no tienes escuadrón
     * en este grupo»— y las capturas de «Cómo se hace» retrataban una consola sin nadie. Se toma prestado el
     * primer docente del grupo de ejemplo, que también es de mentira.
     */
    var cfgDemo = ((d.proyecto || {}).stargate || {}), docs = cfgDemo.docentes || [];
    var yoDemo = docs.filter(function (x) { return x.rol === "referente"; })[0] || docs[0] || { nombre: "Capitana Vega" };
    YO = YO || { uid: "demo", correo: "referente@ejemplo.es", nombre: yoDemo.nombre };
    PER = per; PERS = [{ id: per, nombre: (d.proyecto || {}).name || per, soyReferente: true, miNombre: yoDemo.nombre,
                         estado: "en marcha", semana: cfgDemo.demoSemana || 1, total: cfgDemo.semanas || 15,
                         reclutas: (d.perfiles || []).length }];
    // 🔴 Las mismas claves que arma `leerPER`, con los mismos nombres. El catálogo y `privadoPER`
    // no son opcionales: sin ellos el traductor revienta al calcular el primer nivel.
    DATOS = Object.assign({}, d, { privados: privados, vales: d.vales || [],
                                   catalogo: window.SG_CATALOGO,
                                   privadoPER: { referente: "referente@ejemplo.es", panelEdit: "",
                                                 docentes: docs.map(function (x) { return { nombre: x.nombre, correo: (x.nombre || "").toLowerCase().replace(/[^a-z]+/g, ".") + "@ejemplo.es", rol: x.rol || "docente", imparte: x.imparte !== false }; }) } });
    pintar();
    Array.prototype.forEach.call(app.querySelectorAll("button"), function (b) {
      if (/Guardar|Conceder|Denegar|Pasar el alumnado/.test(b.textContent)) b.disabled = true;
    });
  }

  function arrancar() {
    MOTOR = window.SG.MOTOR;
    if (url.get("demo") === "1") { MODO = "manual"; aplicarModo(); return demostracion(); }
    var mirar = function (u) {
      var q_ = u ? u.uid : null; if (q_ === mirar._v) return; mirar._v = q_;  // una vez por cuenta: sesion() y sg:sesion llegan los dos al cargar
      YO = u; if (!YO) return puerta();
      cargarFicha().then(elegirGrupo);
    };
    MOTOR.sesion().then(mirar);
    document.addEventListener("sg:sesion", function (e) { mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
