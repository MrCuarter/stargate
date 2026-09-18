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
  var MOTOR = null, YO = null, PERS = [], PER = null, DATOS = null, TAB = "alumnado";
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

  function tarjetaGrupo(p) {
    var S = p.stargate || {};
    var vivo = p.estado === "en marcha";
    var cuando = p.estado === "en marcha" ? "Semana " + p.semana + " de " + p.total
               : p.estado === "por empezar" ? "Empieza el " + (S.inicio || "—")
               : p.estado === "sin fecha" ? "Sin fecha de inicio" : "Terminado";

    /**
     * 🔴 EL EMBLEMA DE TU ESCUADRÓN, no el del grupo. Petición de Norberto: «a golpe de vista se
     * debe ver el nombre, su emblema de escuadrón, número de estudiantes inscritos, semana».
     * Y «su» es la palabra: cada docente comanda un escuadrón dentro del grupo, con su propio
     * emblema. Enseñar el del grupo daría el mismo icono en las seis tarjetas y no diría nada.
     */
    var nombreMio = ((S.docentes || []).filter(function (d) {
      return String(d.correo || "").toLowerCase() === String(YO.correo || "").toLowerCase(); })[0] || {}).nombre;
    var mio = (p.factions || []).filter(function (f) { return f.teacherName === nombreMio; })[0]
              || (p.factions || [])[0] || null;

    return '<article class="gp' + (vivo ? " vivo" : " off") + '">' +
      '<header>' +
        (mio && mio.imageUrl
          ? '<img class="gp-emb" src="' + esc(mio.imageUrl) + '" alt="" loading="lazy">'
          : '<div class="gp-emb sin">◈</div>') +
        '<div class="gp-tit"><div class="gp-est">' + (vivo ? "EN MARCHA" : p.estado.toUpperCase()) + '</div>' +
          '<h3>' + esc(p.nombre) + '</h3>' +
          (mio ? '<p class="gp-esc">' + esc(mio.name) + '</p>' : '') + '</div>' +
        (p.soyReferente ? '<span class="gp-ref" title="Llevas este grupo">★</span>' : '') +
      '</header>' +
      // 15-sep · Norberto: «la Cola de nota debería aparecer solo si hay algo que hacer… que brille o un globo con aviso»
      (p.cola ? '<button type="button" class="gp-cola" data-per="' + esc(p.id) + '" data-ir="canjes">🔔 <b>' + p.cola + '</b> ' +
        (p.cola === 1 ? "subida de nota espera" : "subidas de nota esperan") + ' tu visto bueno <span>Revisar →</span></button>' : '') +
      // Las dos cifras que se miran de un vistazo: cuánta gente hay y por dónde vamos.
      '<div class="gp-cifras">' +
        '<div><b>' + (p.reclutas == null ? "—" : p.reclutas) + '</b><span>alistados</span></div>' +
        '<div><b>' + (p.estado === "en marcha" ? p.semana : "—") + '</b><span>' +
          (p.estado === "en marcha" ? "de " + p.total + " semanas" : esc(cuando)) + '</span></div>' +
      '</div>' +
      // 🔴 Lo de clase, en la tarjeta. Se busca con los alumnos ya sentados: cada clic de más ahí
      // es medio minuto de aula mirando una pantalla de carga.
      '<div class="gp-hacer">' +
        '<div class="gp-celda principal"><a class="gp-b principal" href="sesion.html?per=' + esc(p.id) + '" target="_blank" rel="noopener">' +
          '<span>📽️</span><b>Proyectar la clase</b></a>' + botonVentana("sesion.html?per=" + p.id, "sesion_" + p.id, "la sesión") + '</div>' +
        '<div class="gp-celda"><a class="gp-b" href="aula.html?per=' + esc(p.id) + '" target="_blank" rel="noopener">' +
          '<span>🎛️</span><b>El aula</b></a>' + botonVentana("aula.html?per=" + p.id, "aula_" + p.id, "el aula") + '</div>' +
        '<div class="gp-celda"><a class="gp-b" href="llamada.html?per=' + esc(p.id) + '" target="_blank" rel="noopener">' +
          '<span>🔔</span><b>Llamada a filas</b></a>' + botonVentana("llamada.html?per=" + p.id, "llamada_" + p.id, "la llamada a filas") + '</div>' +
      '</div>' +
      /**
       * 🔴 EL CÓDIGO DE CLASE, A LA VISTA DE TODO EL EQUIPO. Con la puerta única el alumnado entra
       * con «el código que reparte tu docente el primer día» —lo dice la portada—, y el docente raso
       * NO LO VEÍA en ningún sitio: vivía en «Ajustes», que es del referente, y en «Mis enlaces» solo
       * iba escondido dentro de una URL. Invitar a la clase es lo PRIMERO que hace un docente nuevo.
       *
       * El código se enseña grande —se escribe en la pizarra o se dicta— y el botón copia un mensaje
       * listo para pegar en el foro o en un chat, con el enlace directo que ya lleva el código dentro.
       * Norberto: «un botón para copiar el enlace de invitación, no hace falta que aparezca el enlace».
       * En un curso terminado no sale: ya no se alista nadie.
       */
      // 15-sep · tapado hasta que se pulsa (Norberto: «el código de clase mantenlo oculto, obliga a clicar
      // para mostrar»): esta pantalla se proyecta y se comparte; la invitación se copia sin destaparlo.
      (p.codigo && p.estado !== "pasado"
        ? '<div class="gp-invita"><div><span>Código de clase</span><button type="button" class="gp-cod" data-cod="' + esc(p.codigo) + '" ' +
            'title="Pulsa para verlo (y otra vez para taparlo)" aria-label="Mostrar el código de clase">•••••• <em>Mostrar</em></button></div>' +
          '<button class="btn min" data-copiado="✓ Invitación copiada" data-copiar="' + esc(invitacion(p)) + '" ' +
            'title="Copia un mensaje listo para pegar en el foro de la plataforma de UNIR o en un chat">' +
            'Copiar invitación</button></div>'
        : '') +
      // 15-sep · Norberto: «un botón llamativo para entrar en ese grupo», como el de «Entrar en mi Nave» al alistarse.
      // Era un enlace gris («Ver mi gente y los ajustes →») y no se veía. Debajo, las pestañas que hay dentro.
      '<div class="gp-pie">' +
        (p.estado === "pasado"
          ? '<button class="btn gp-abrir" data-per="' + esc(p.id) + '">Entrar en el grupo →</button>'
          : '<button class="btn epico gp-abrir" data-per="' + esc(p.id) + '">' +
              '<span class="ep-luz"></span><span class="ep-txt">Entrar en el grupo</span></button>') +
        '<p class="gp-dentro">' + (refDe(p) ? "Mi gente · Escuadrones · Calendario · Ajustes" : "Mi gente · El Zoco · Mis enlaces · Calendario") + '</p>' +
      '</div></article>';
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
    return b ? '<div class="card borrado-ok"><p>🗑️ <b>«' + esc(b) + '»</b> borrado, con todo lo suyo.</p></div>' : "";
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
  async function elegirGrupo() {
    cargando("Buscando tus grupos…");
    PERS = await MOTOR.misPERs(YO.correo);
    contarBuzon();   // (15-sep · el contador del buzón: si llega antes de pintar, sale ya en el botón; si no, se añade)
    if (!PERS.length) {
      // 15-sep · un referente nuevo (por invitación) aún no tiene grupos: se le da la bienvenida, no un «no figuras»
      if (refGlobal() && !modoDoc()) {
        app.innerHTML = avisoBorrado() + '<div class="card"><h3>¡Bienvenida al puente, Comandante!</h3>' +
          '<p>Eres <b>profe referente</b> con <b>' + esc(YO.correo) + '</b>, pero aún no llevas ningún grupo. Crea el primero (en un minuto, con su calendario y su código) ' +
          'o pide a Norberto que te añada a uno que ya exista.</p>' +
          '<p><a class="btn primary grande" href="crear.html">✨ Crear mi primer grupo</a> <a class="btn" href="prueba-equipo.html">🧭 La guía de prueba</a> ' + botonBuzon("consola") + '</p></div>';
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

    // 🔴 Ya NO se salta la lista cuando solo hay un grupo. Antes se entraba directo «por comodidad»,
    // y así el docente no veía nunca los botones de directo —que es para lo que viene— ni sabía que
    // esta pantalla existía. Con un grupo, la tarjeta ocupa la pantalla entera y se entiende sola.
    var vivos = PERS.filter(function (p) { return p.estado !== "pasado"; });
    var pasados = PERS.filter(function (p) { return p.estado === "pasado"; });
    var soyRef = (PERS.some(function (p) { return p.soyReferente; }) || refGlobal()) && !modoDoc();

    app.innerHTML = avisoBorrado() +
      '<div class="gp-cab"><div><h2>Tus grupos</h2>' +
        '<p class="small muted">Todo lo de clase está aquí mismo. Entra en un grupo para su gente y sus enlaces.</p></div>' +
        '<div class="gp-cab-b">' + botonBuzon("consola") + (soyRef ? ' <a class="btn min" href="crear.html">+ Crear un grupo</a>' : '') + '</div></div>' +
      // 🔴 13-sep · con UN solo grupo, la tarjeta se tumba en horizontal y ocupa la fila: estrecha y
      // sola dejaba media pantalla vacía a su derecha. Con varios, rejilla de siempre.
      // y con 2 o 4, en dos columnas: con tres por fila, cuatro grupos dejaban uno solo abajo
      (vivos.length ? '<div class="gp-grid' + (vivos.length === 1 ? ' uno' : (vivos.length === 2 || vivos.length === 4) ? ' par' : '') + '">' + vivos.map(tarjetaGrupo).join("") + '</div>'
                    : '<div class="card"><p>Ninguno de tus grupos está en marcha ahora mismo.</p></div>') +
      // 17-sep · lo que se configura UNA vez para varios grupos (Norberto: «¿valen para cualquier grupo? Sería maravilloso
      // poder reciclarlos… que compartan la misma página de configuración y ajustar a qué grupos afecta»)
      (gestionados().length ? '<section class="gp-comun"><div class="gp-comun-t"><h3>🌐 Para todos tus grupos</h3>' +
        '<p class="small muted">Se configuran <b>una vez</b> y eliges a qué grupos afectan: todos o solo algunos. Dentro de cada grupo ves los que le tocan.</p></div>' +
        '<div class="gp-comun-b"><a class="btn" href="consola.html?comun=premios">🎁 Premios por enlace</a> <a class="btn" href="consola.html?comun=sorteos">🎟️ Sorteos</a> ' +
        '<a class="btn" href="consola.html?comun=ofertas">⚡ Ofertas</a></div></section>' : '') +
      /**
       * 🔴 15-sep · LOS EMBEDS, UNA SOLA VEZ. Norberto: «en todas las fichas de cada grupo aparece Embed para
       * Genially, pero entiendo que es el mismo para todos: déjalo en algún lugar especificando que es el
       * mismo para todos los grupos». Lo es: ninguno lleva el grupo dentro (piden la cuenta y preguntan).
       */
      '<section class="gp-gen"><div class="gp-gen-txt"><h3>🧩 Para tus Geniallys</h3>' +
        '<p class="small muted">Los <b>mismos para todos tus grupos</b> y para los cursos que vengan: piden tu cuenta y, si llevas varios grupos, ' +
        'preguntan en cuál estáis. Se copia el código y, en Genially, <b>Insertar → Otros → Código</b>. ' +
        'O pulsa <b>⧉</b> y se abre <b>en su propia ventana</b>, sin nada más alrededor: para proyectarla o tenerla a mano durante la clase.</p></div>' +
        '<div class="gp-gen-b">' +
        // 16-sep · la sesión se pega DOS VECES en el Genially: la apertura antes de la teoría y el
        // cierre después. Así no hay que navegar por dentro del panel delante de la clase.
        [["sesion-ap", "📽️ La sesión · 1 · apertura", "sesion.html?embed=1&tramo=apertura"],
         ["sesion-ci", "📽️ La sesión · 3 · cierre", "sesion.html?embed=1&tramo=cierre"],
         ["sesion", "📽️ La sesión entera (sin partir)", "sesion.html?embed=1"], ["aula", "🛰️ El aula · la clase en directo", "aula.html?embed=1"],
         ["llamada", "🔔 La llamada a filas", "llamada.html?embed=1"], ["batalla", "⚔️ El Simulador de Joran", "batalla.html?embed=1"]].map(function (x) {
          return '<span class="gp-gen-par"><button class="btn min" data-embed="' + x[0] + '" data-copiado="✓ Código copiado" data-copiar="' + esc(codigoGenially(x[2], "STARGATE · " + x[1].replace(/^\S+\s/, ""))) + '">' + x[1] + '</button>' +
            botonVentana(x[2], x[0], x[1].replace(/^\S+\s/, "")) + '</span>';
        }).join("") + '</div></section>' +
      /**
       * 🔴 LO DEL REFERENTE, EN UNA FRANJA APARTE. Norberto: «el referente básicamente debe tener
       * un menú extra». Y «extra» es la palabra: su día a día es EXACTAMENTE el del docente —sus
       * grupos, su gente, proyectar— y solo se le añade lo de gobernar. Hacerle otra pantalla
       * distinta habría sido mantener dos cosas y que una se quedara atrás.
       *
       * Va DEBAJO de sus grupos, no encima: incluso el referente entra aquí a dar clase mucho más a
       * menudo que a crear un grupo. Y por encima de los cursos terminados, que se abren todavía menos.
       * 🔴 12-sep · El comentario ya decía «debajo» y el código lo pintaba ENCIMA: se leía una cosa
       * y se veía la contraria. Lo cazó el laboratorio con la primera captura de datos de verdad.
       */
      (soyRef
        ? '<details class="cajon ref-zona"><summary><b>★ Como profe referente</b> ' +
          '<span class="cnt">gobernar los grupos</span></summary>' +
          '<div class="ref-grid">' +
            '<a class="ref-b" href="crear.html"><span>✨</span><b>Crear un grupo</b>' +
              '<em>Calendario, retos, tienda y código, en un minuto.</em></a>' +
            '<a class="ref-b" href="tickets.html"><span>🎟️</span><b>Los tickets de salida</b>' +
              '<em>Las dudas de todas tus clases, por tema y fecha.</em></a>' +
            '<a class="ref-b" href="registro.html"><span>🏅</span><b>El tablero y las insignias</b>' +
              '<em>La ceremonia, el ranking y los dos marcadores.</em></a>' +
            '<a class="ref-b" href="pasos.html"><span>🧭</span><b>Montarlo paso a paso</b>' +
              '<em>El recorrido completo, con capturas.</em></a>' +
            // 15-sep · la página de Profesores, solo para el Mando (los vitalicios)
            (VITALICIOS_WEB.indexOf(String(YO.correo || "").toLowerCase()) >= 0
              ? '<a class="ref-b" href="profesores.html"><span>👥</span><b>Profesores</b><em>Referentes, invitaciones, sus grupos y sus conexiones.</em></a>' : '') +
          '</div>' +
          '<p class="small muted" style="margin-top:12px">Dentro de cada grupo tienes además ' +
          '<b>Equipo docente</b>, <b>Escuadrones</b> y <b>Ajustes</b>: esas tres solo las ve quien ' +
          'lleva el grupo.</p></details>'
        : '') +

      (pasados.length
        ? '<details class="cajon gp-viejos"><summary><b>🗓️ Cursos terminados</b> ' +
          '<span class="cnt">' + pasados.length + '</span></summary>' +
          '<div class="gp-grid">' + pasados.map(tarjetaGrupo).join("") + '</div></details>'
        : '');

    Array.prototype.forEach.call(app.querySelectorAll("[data-per]"), function (b) {
      b.onclick = function () { if (b.getAttribute("data-ir")) TAB = b.getAttribute("data-ir"); abrir(b.getAttribute("data-per")); };
    });
    Array.prototype.forEach.call(app.querySelectorAll(".gp-cod"), function (b) {
      b.onclick = function () {
        var ver = !b.classList.contains("visto");
        b.classList.toggle("visto", ver);
        b.innerHTML = ver ? esc(b.getAttribute("data-cod")) + ' <em>Tapar</em>' : '•••••• <em>Mostrar</em>';
        b.setAttribute("aria-label", ver ? "Tapar el código de clase" : "Mostrar el código de clase");
      };
    });
    cablearCopiar(app);
    // el titular «Mi puesto de mando» sobra encima de «Tus grupos»: dos titulares enormes seguidos
    document.body.classList.add("consola-dentro");
  }

  /** 17-sep · «🌐 Para todos tus grupos»: lo que se configura una vez para varios grupos, fuera de ninguno. */
  function verComunes(que) {
    PER = null; DATOS = null;
    history.replaceState(null, "", "consola.html?comun=" + encodeURIComponent(que));
    var g = gestionados();
    app.innerHTML = '<div class="card cuenta c-cab"><div class="c-cab-t"><b>🌐 Para todos tus grupos</b><span>' + g.length + (g.length === 1 ? " grupo" : " grupos") +
        ' que llevas · lo que configures aquí vale en los que elijas</span></div>' +
      '<div class="c-cab-b"><button class="btn min" id="c-volver">← Tus grupos</button> ' + botonBuzon("consola") + '</div></div>' +
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
  var TABS = [["alumnado", "Mi gente"], ["rankings", "Rankings"], ["zoco", "El Zoco"], ["mios", "Mis enlaces"], ["calendario", "Calendario"],
              ["equipo", "Equipo docente", 1], ["escuadrones", "Escuadrones", 1], ["ajustes", "Ajustes del grupo", 1],
              // 17-sep · las que pueden afectar a VARIOS grupos, juntas y tras su raya 🌐 (Norberto: «separar las opciones
              // exclusivas de un grupo de las que afectan a todos o pueden afectar»)
              ["huevos", "Premios por enlace", 1, "varios"], ["sorteos", "Sorteos", 1, "varios"], ["ofertas", "Ofertas", 1, "varios"],
              ["canjes", "Cola de nota"]];
  function pendientesCola() {
    return ((DATOS && DATOS.vales) || []).filter(function (v) { return (v.status || "pending") === "pending"; }).length;
  }
  function misTabs() {
    var ref = refDe(PERS.filter(function (p) { return p.id === PER; })[0]), cola = pendientesCola();
    return TABS.filter(function (x) { return (!x[2] || ref) && (x[0] !== "canjes" || cola > 0); });
  }
  function soyRefAqui() { return refDe(PERS.filter(function (p) { return p.id === PER; })[0]); }
  function miNombreAqui() { var p = PERS.filter(function (x) { return x.id === PER; })[0]; return (p && p.miNombre) || ""; }

  /**
   * 15-sep · «📡 ¿Algo falla?»: la puerta al buzón del Mando (buzon.html). Lleva desde dónde se
   * escribe y el grupo, y un contador si el Mando ha respondido algo que aún no has leído.
   */
  var BZ_N = null;
  function botonBuzon(desde, per) {
    return '<a class="btn min bz-acceso" data-bz href="buzon.html?desde=' + desde + (per ? '&per=' + encodeURIComponent(per) : '') + '">📡 ¿Dudas? ¿Algo falla?'
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

  function pintar() {
    var t = window.SG.TABLERO.tablero(DATOS, true);
    // 🔴 Y si el TAB recordado ya no le corresponde —dejó de ser referente, llega por un enlace con #ajustes o
    // (15-sep) acaba de resolver la última subida de nota y la Cola se esconde— se cae al primero, ANTES de pintar
    // las pestañas para que la encendida sea la que se ve.
    if (!misTabs().some(function (x) { return x[0] === TAB; })) TAB = misTabs()[0][0];
    app.innerHTML =
      // 15-sep · el nombre a un lado y los botones al otro (antes iban en la misma línea y «Salir» caía solo a otra fila)
      '<div class="card cuenta c-cab"><div class="c-cab-t"><b>' + esc(t.nombre) + '</b><span>' + esc(t.tipo) +
        ' · ' + semanaTexto(t) + ' · ' + t.reclutas.length + ' reclutas</span></div>' +
        '<div class="c-cab-b"><button class="btn min" id="c-cambiar">← Mis grupos</button> ' + botonBuzon("consola", PER) +
        ' <button class="btn min" id="c-salir">Salir</button></div></div>' +
      '<div class="pestanas">' + misTabs().map(function (x, i, todas) {
        var cola = x[0] === "canjes" ? pendientesCola() : 0;
        // (una raya antes de las del referente; el icono de cada una va en la hoja de estilos)
        var raya = x[2] && !(todas[i - 1] || [])[2] ? '<span class="pest-sep" aria-hidden="true"></span>'
                 : x[3] && !(todas[i - 1] || [])[3] ? '<span class="pest-sep pest-sep-g" title="Estas pueden afectar a varios de tus grupos">🌐</span>' : "";
        return raya + '<button class="pest' + (TAB === x[0] ? " activa" : "") + (cola ? " pest-aviso" : "") + '" data-tab="' + x[0] + '"' +
          (cola ? ' title="' + cola + (cola === 1 ? " subida de nota espera" : " subidas de nota esperan") + ' tu visto bueno"' : "") + '>' + x[1] +
          (cola ? '<span class="pest-n" aria-label="' + cola + ' pendientes">' + cola + "</span>" : "") + "</button>";
      }).join("") + "</div>" +
      '<div id="c-aviso" class="aviso" hidden></div>' +
      '<div id="c-cuerpo"></div>';
    Array.prototype.forEach.call(app.querySelectorAll("[data-tab]"), function (b) {
      b.onclick = function () { TAB = b.getAttribute("data-tab"); pintar(); };
    });
    // Copiar un enlace, con confirmación visible: sin ella no sabes si ha ido.
    cablearCopiar(app);
    if ($("#c-cambiar")) $("#c-cambiar").onclick = function () { url.delete("per"); elegirGrupo(); };
    $("#c-salir").onclick = function () { MOTOR.salir(); };
    ({ alumnado: verAlumnado, rankings: verRankings, canjes: verCanjes, zoco: verZoco, mios: verMios, equipo: verEquipo,
       escuadrones: verEscuadrones, huevos: verHuevos, sorteos: verSorteos, ofertas: verOfertas, calendario: verCalendario, ajustes: verAjustes })[TAB](t);
    ofrecerVisitaDelGrupo();
    contarBuzon();
    document.body.classList.add("consola-dentro");   // dentro de un grupo, el titular grande sobra
  }

  /**
   * 🔴 13-sep · LA VISITA DE DENTRO DEL GRUPO. La de Mis grupos enseña las tarjetas; aquí dentro hay
   * siete pestañas (tres si no llevas el grupo) y ninguna explicación. Se ofrece una vez; después la
   * repite «▶ Visita guiada». Solo con las pestañas que esta cuenta VE: al docente que imparte no se
   * le habla de Ajustes que no tiene.
   */
  var PASOS_GRUPO = {
    alumnado: ["Mi gente", "Tu alumnado con sus xp, créditos e insignias. <b>Pulsa una fila</b>: ves su ficha, los <b>enlaces de sus evidencias</b> y puedes validar o anular un reto con un mensaje que le llega a su Nave."],
    rankings: ["Rankings", "Todos los rankings del grupo —xp, esta semana, colección, constancia, relámpago, logros, el Simulador de Joran y los escuadrones—, del <b>grupo entero o de un escuadrón</b>. Son los mismos que ve tu alumnado en su Nave: para <b>ensalzar</b> en clase a quien destaca en cada cosa."],
    canjes: ["Cola de nota", "Solo aparece cuando alguien pide una subida de <b>nota</b>, y brilla hasta que la resuelves: ninguna se aplica sola. Los créditos no se mueven hasta entonces."],
    zoco: ["El Zoco", "Los trueques entre tu alumnado (se abren en la semana 8; en PUA, la 7): quién cambia qué con quién y los mensajes que se dejan. Si uno no te cuadra, <b>Deshacer</b> devuelve cada cosa a su dueño."],
    mios: ["Mis enlaces", "Tu panel de Genially, si has hecho una copia propia, y los enlaces del grupo para repartir en clase: la Nave, el tablero para proyectar, la sesión y el padlet."],
    equipo: ["Equipo docente", "Quién imparte y quién lleva el grupo, <b>por su correo de Google</b>. Añadir a alguien aquí es darle entrada; quitarlo, quitársela. No hay PIN."],
    escuadrones: ["Escuadrones", "Cada escuadrón con su Comandante. La llamada a filas y el aula de cada docente van por aquí: cada cual ve y llama a los suyos."],
    huevos: ["Premios por enlace", "Crea un premio —xp, créditos, un sobre de cromos, un héroe— con sus topes (en total, por escuadrón o por persona) y pega su enlace donde quieras. Por ejemplo: «los 5 primeros de cada escuadrón, un sobre»."],
    sorteos: ["Sorteos", "El <b>Gran Sorteo</b> y los que crees tú: tu alumnado compra participaciones, tú las regalas o las escondes en un enlace, y el día señalado lo <b>proyectas</b>. Lo sortea el servidor: una papeleta por participación y nadie gana dos."],
    ofertas: ["Ofertas", "La <b>oferta de la semana</b> sale sola en el Mercado desde la semana 3: un sobre, una cápsula, un héroe o una carta concretos, rebajados y con unidades según los inscritos y la rareza. Aquí la <b>alargas, la cancelas, cambias sus unidades</b> o creas una tú."],
    calendario: ["Calendario", "El curso entero en un calendario: cada semana con su número, las <b>no lectivas</b> (Navidad, Semana Santa) y lo que se abre cada una. Si llevas el grupo, pulsa una semana para marcarla como no lectiva y todo lo de detrás se corre solo."],
    ajustes: ["Ajustes del grupo", "El nombre, el código de clase, el padlet, el panel oficial y los enlaces para montar una vez en los Geniallys."]
  };
  function ofrecerVisitaDelGrupo() {
    var pasos = [{ sel: ".pestanas", pose: "saluda", t: "Tu grupo por dentro",
      x: "Arriba, las pestañas de este grupo. Te cuento en un minuto para qué sirve cada una." }];
    misTabs().forEach(function (x, i) {
      var q = PASOS_GRUPO[x[0]]; if (!q) return;
      pasos.push({ sel: '.pest[data-tab="' + x[0] + '"]', pose: ["tablet", "senala", "brazos", "pensativo"][i % 4], t: q[0], x: q[1] });
    });
    pasos.push({ sel: "#c-cambiar", pose: "pulgar", t: "¿Otro grupo?",
      x: "<b>«← Mis grupos»</b> te devuelve a todos tus grupos. Y esta visita la repites cuando quieras con <b>▶ Visita guiada</b>, arriba." });
    window.SG_TOUR_LOCAL = { clave: "grupo", invita: "¿Te enseño tu grupo por dentro?",
      invita2: "Las pestañas, en un minuto.", pasos: pasos };
    if (window.sgTour && window.sgTour.ofrecerLocal) window.sgTour.ofrecerLocal();
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
          (r.corona ? " 👑" : "") + (r.congelado ? ' <span class="chip" title="Cuenta congelada por el referente">🧊 congelado</span>' : '') + '</span></div></td><td>' + esc(r.nombre || "—") + '<br><span class="small muted">' +
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
    $("#c-cuerpo").innerHTML = '<div class="card c-rankings"><h3>🏆 Rankings</h3>' +
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
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Alumnado</h3>' +
      '<p class="small muted">El nombre y el correo solo los ves tú y el resto del equipo docente. ' +
      '<b>Pulsa una fila</b> y se abre su ficha: sus retos, los enlaces de lo que ha entregado y lo que puedes hacer.</p>' + chips +
      (lista.length ? tablaGente(lista, caps, !filtro) : '<p class="muted">' + (sinGenteQueVer(t) ? 'No tienes escuadrón en este grupo, así que aquí no hay alumnado a tu nombre.' : 'Todavía no hay nadie en este escuadrón.') + '</p>') +
      (ref && t.sin_docente ? '<p class="aviso">⚠️ ' + t.sin_docente + ' recluta(s) sin Comandante asignado.</p>' : "") +
      // 16-sep · la hoja de cálculo para evaluar: lo que hay en pantalla, tal cual, en un CSV
      (lista.length ? '<p class="gp-csv"><button type="button" class="btn min" id="c-csv">📊 Descargar CSV</button>' +
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
        if (!n) lista.remove(); else if (s) s.textContent = "💬 " + n + (n === 1 ? " comentario" : " comentarios") + " de su tripulación"; }
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
    return '<p class="fi-abordo"><b>🎖️ ' + nHitos(r) + '/' + AB.hitos.length + ' logros de a bordo</b>' + (cub.todo ? " · <b>🌟 Contramaestre de la Nave</b>" : "") + " · " + partes +
      (d.total ? ' <span class="small muted">· 🔥 ' + (d.racha || 0) + " días seguidos, " + d.total + " en total</span>" : "") + "</p>" +
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
    return '<p class="fi-abordo"><b>🎮 ' + (S[BT.clave || "joran"] ? "Venció a " + esc(BT.rival || "RUTA AZUL") : "Todavía no ha ganado al simulador") + "</b>" +
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
    return '<p class="fi-cmd"><label>🔀 Pasar a ' + esc(r.alias) + ' al escuadrón de <select id="c-cmd">' +
      fs.map(function (f) { return '<option value="' + esc(f.teacherName) + '">' + esc(f.name || f.teacherName) + " · " + esc(f.teacherName) + "</option>"; }).join("") +
      '</select></label> <button type="button" class="btn min" id="c-cmd-b">Cambiar</button> ' +
      '<span class="small muted">se lleva todo lo suyo: retos, créditos y colección.</span></p>';
  }
  function verFicha(r) {
    var retos = retosOrdenados(), ficha = r.ficha, esRef = soyRefAqui();
    FICHA_RF = r;   // (para quitar una reflexión o un comentario desde su ficha)
    var f = ((DATOS.proyecto && DATOS.proyecto.factions) || []).filter(function (x) { return x.teacherName === r.profe; })[0];
    var m = modalFicha(
      '<button type="button" class="c-modal-x" data-cerrar-ficha aria-label="Cerrar la ficha">✕</button>' +
      '<div class="fi-cab">' + (f && f.imageUrl ? '<img class="fi-emb" src="' + esc(f.imageUrl) + '" alt="" width="56" height="56">' : '') +
        '<div><div class="fi-esc">' + (f ? esc(f.name) + " · " : "") + "Comandante " + esc(r.profe || "—") + "</div>" +
        "<h3>" + esc(r.alias) + (r.corona ? " 👑" : "") + (r.nombre ? ' <span>· ' + esc(r.nombre) + "</span>" : "") + "</h3>" +
        (r.email ? '<p class="small muted">' + esc(r.email) + "</p>" : "") + "</div></div>" +
      '<div class="fi-cifras"><div><b>' + r.xp + '</b><span>xp</span></div><div><b>' + r.creditos + '</b><span>◈ créditos</span></div>' +
        '<div><b>' + r.nivel + '</b><span>nivel · ' + esc(r.rango_nombre || "") + '</span></div><div><b>' + r.n + '/' + NBADGES() + '</b><span>insignias</span></div>' +
        '<div><b>' + (r.racha || 0) + '</b><span>semanas de racha</span></div></div>' +
      lineaABordo(r) +
      (r.congelado ? '<p class="aviso">🧊 <b>Cuenta congelada</b>' + (r.congelado.fecha ? " desde el " + diaDe(r.congelado.fecha) : "") + ": entra y mira su Nave, pero no puede hacer nada.</p>" : "") +
      '<div class="c-modal-aviso aviso" hidden></div>' +
      "<h4>Sus retos y sus insignias, por temas</h4>" + temasDeLaFicha(r, retos) +
      '<p class="small muted">Insignia encendida = ganada. Reto en verde = registrado. Pulsa un reto: ves su enlace y su reflexión, y lo validas o lo anulas con un mensaje que le llega a su Nave. Todo queda anotado en el libro de experiencia, con quién y cuándo.</p>' +
      // 🔴 DAR DE BAJA y CONGELAR (14-sep): solo el referente (Norberto: «el referente tiene poder de eliminar o
      // congelar: puede acceder, pero no puede hacer nada, bloqueado»). La baja hace falta de verdad: alguien que se
      // alista en el grupo equivocado o con la cuenta que no era deja una ficha huérfana en el ranking.
      (esRef ? '<div class="ficha-ref"><h4>Solo el referente</h4>' + cambioDeComandante(r) +
        '<p><button type="button" class="btn min" id="c-congelar">' + (r.congelado ? "▶️ Descongelar a " : "🧊 Congelar a ") + esc(r.alias) + "</button> " +
        '<span class="small muted">' + (r.congelado ? "vuelve a poder hacer de todo." : "podrá entrar y mirar, pero no registrar retos, comprar, fichar ni usar el Zoco.") + "</span></p>" +
        '<p><button type="button" class="btn min peligro" id="c-baja">Dar de baja a ' + esc(r.alias) + "</button> " +
        '<span class="small muted">borra su ficha del grupo. Podrá alistarse otra vez, aquí o en otro, empezando de cero.</span></p></div>' : ""));
    var cmdB = m.querySelector("#c-cmd-b");
    if (cmdB) cmdB.onclick = async function () {
      var a = (m.querySelector("#c-cmd") || {}).value; if (!a) return;
      if (!(await window.SG.preguntar({ aqui: cmdB.closest("p") || cmdB, marca: cmdB, titulo: "¿Pasar a «" + r.alias + "» al escuadrón de " + a + "?",
        texto: "Cambia de Comandante y de escuadrón. Se lleva todo lo suyo: retos, créditos y colección.", si: "🔀 Cambiar de Comandante" }))) return;
      cmdB.disabled = true;
      try {
        await MOTOR.cambiarComandante(PER, ficha, a); await refrescar();
        reabrirFicha(ficha, "🔀 " + r.alias + " ya está en el escuadrón de " + a + ".", true);
      } catch (e) { cmdB.disabled = false; avisoFicha("No se ha podido cambiar: " + (e.message || e), false); }
    };
    var cong = m.querySelector("#c-congelar");
    if (cong) cong.onclick = async function () {
      var ya = !!r.congelado;
      if (!ya && !(await window.SG.preguntar({ aqui: cong.closest("p") || cong, marca: cong, titulo: "¿Congelar la cuenta de «" + r.alias + "»?",
        texto: "Podrá entrar y mirar su Nave, pero no hacer nada: ni registrar retos, ni comprar, ni fichar, ni el Zoco. " +
               "Lo que tenga en el Zoco se retira (y cada oferta devuelve lo suyo).\n\nSe descongela con un clic, cuando quieras.",
        si: "🧊 Congelar", peligro: true }))) return;
      cong.disabled = true;
      try {
        await MOTOR.alumno(PER, ficha, ya ? "descongelar" : "congelar"); await refrescar();
        reabrirFicha(ficha, ya ? "▶️ " + r.alias + " ya puede volver a hacer de todo." : "🧊 " + r.alias + " está congelado: mira, pero no toca.", true);
      } catch (e) {
        cong.disabled = false;
        avisoFicha(/not-found|internal/.test(String(e && e.code)) && !/[áéíóú]/.test(String(e && e.message))
          ? "Falta desplegar en el servidor la función «stargateAlumno» (el comando está en el traspaso)." : e.message);
      }
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
          return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">🔗 ' + esc(u.replace(/^https?:\/\//i, "").slice(0, 70)) + "</a>"; }).join(" ") : "";
        var resp = await window.SG.preguntar({
          aqui: b.closest(".retos-ficha") || b, marca: b, peligro: tiene,
          titulo: (tiene ? "¿Anular " : "¿Validar ") + id + " a " + r.alias + "?",
          html: '<p class="sgp-reto"><b>' + esc(id) + " · " + esc(mi.title || "") + "</b>" +
                  (tiene ? (enlaces ? "<span>" + enlaces + "</span>"
                                    : (RFX1 && RFX1.modo === "texto" ? "" : '<span class="small muted">sin enlace</span>')) : "") + "</p>" +
                (tiene && RFX1 ? (rfx
                  ? '<div class="sgp-rf"><p class="sgp-rf-cab">✍️ <b>Su reflexión</b> · «' + esc(RFX1.titulo || "") + "»</p>" +
                    '<p class="sgp-rf-txt">' + esc(rfx.texto || "") + "</p>" +
                    ((COMS[rfx.id] || []).length ? '<details class="sgp-rf-coms"><summary>💬 ' + (COMS[rfx.id] || []).length +
                      ((COMS[rfx.id] || []).length === 1 ? " comentario" : " comentarios") + " de su tripulación</summary>" +
                      (COMS[rfx.id] || []).map(function (c) { var q = (DATOS.perfiles || []).filter(function (p) { return p.id === c.fichaId; })[0];
                        return '<p class="evid-com"><b>' + esc((q && q.displayName) || "Un recluta") + "</b> " + esc(c.texto || "") +
                          ' <button type="button" class="btn min" data-rfquitarcom="' + esc(c.id) + '">Quitar</button></p>'; }).join("") + "</details>" : "") +
                    '<p class="sgp-rf-mod"><button type="button" class="btn min" data-rfquitar="' + esc(id) + '">Quitar la reflexión</button> ' +
                      '<span class="small muted">deja de verse en la Nave y en la sesión; el reto sigue registrado</span></p></div>'
                  : (pideReflexion((r.retos || {})[id]) ? '<p class="small muted">✍️ Este reto lleva reflexión y no la tiene.</p>' : "")) : "") +
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
  function verMios(t) {
    var yo = (t.docentes_full || []).filter(function (d) {
      return String(d.correo || "").toLowerCase() === String(YO.correo || "").toLowerCase(); })[0];
    if (!yo) {
      $("#c-cuerpo").innerHTML = '<div class="card"><h3>Mis enlaces</h3>' +
        '<p>No te encuentro en el equipo docente de este grupo con <b>' + esc(YO.correo) + '</b>, ' +
        'así que no sé cuál es tu sitio aquí.</p></div>';
      return;
    }
    var mio = (t.paneles || {})[yo.nombre] || "";
    var oficial = t.panel || "";
    $("#c-cuerpo").innerHTML =
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
        enlaceFila("🧭", "Alistarse (con el código)", t.alta || (DATOS.proyecto && DATOS.proyecto.joinCode
          ? "alistarse.html?per=" + encodeURIComponent(PER) + "&codigo=" + encodeURIComponent(DATOS.proyecto.joinCode) : "")) +
        enlaceFila("🚀", "La Nave del alumnado", "recluta.html?per=" + encodeURIComponent(PER), "", true) +
        enlaceFila("🏅", "El tablero, para proyectar", "registro.html?per=" + encodeURIComponent(PER) + "&solo=1", "tablero_" + PER, true) +
        enlaceFila("📽️", "La sesión de esta semana", "sesion.html?per=" + encodeURIComponent(PER), "sesion_" + PER, true) +
        // 13-sep · la Nave con tu Comandante de recluta, para ensayar (o enseñarla fuera de la sesión): no guarda nada
        enlaceFila("🛰️", "Tu Nave de Comandante (simulacro)", "recluta.html?simulacro=1&per=" + encodeURIComponent(PER), "", true) +
        enlaceFila("🧱", "Padlet de la clase", t.padlet || "") +
      '</div></div>';

    $("#m-guardar").onclick = async function () {
      var v = $("#m-panel").value.trim();
      $("#m-guardar").disabled = true;
      try { await SG.FUENTE.accion({ accion: "mi_panel", per: PER, profe: yo.nombre, url: v });
            await refrescar(); aviso(v ? "Guardado. Tu alumnado abrirá el tuyo." : "Quitado.", true); }
      catch (e) { $("#m-guardar").disabled = false; aviso(e.message); }
    };
    if ($("#m-quitar")) $("#m-quitar").onclick = async function () {
      try { await SG.FUENTE.accion({ accion: "mi_panel", per: PER, profe: yo.nombre, url: "" });
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
      '<button class="btn min" data-copiar="' + esc(absoluta(url)) + '" data-copiado="✓ Enlace copiado" title="Copia la dirección completa">🔗 Enlace</button>' +
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
    heroe_fijo: ["🛡️", "Un héroe que eliges tú", "El héroe exacto que elijas: el premio perfecto para un reto de clase.", "canje/heroe.jpg"],
    heroe: ["🎲", "Un héroe al azar", "Uno de los 30 héroes, con las mismas probabilidades que en el Mercado.", "canje/heroe.jpg"],
    bolsa: ["💰", "Créditos", "Una bolsa de ◈ para gastar en el Mercado. Tú eliges cuántos.", ""],
    xp: ["⚡", "Experiencia", "Puntos de xp: suben su nivel y su puesto en el ranking. Tú eliges cuántos.", ""],
    participaciones: ["🎟️", "Participaciones del sorteo", "Papeletas extra para un sorteo abierto de este grupo (de 1 a 10).", "canje/sorteo.jpg"],
    sobre_grande: ["🃏", "Un sobre grande", "Cinco cartas en vez de tres, con las probabilidades de siempre.", "canje/sobre_grande.jpg"],
    sobre_raro: ["💎", "Un sobre de raras", "Tres cartas donde las comunes casi desaparecen.", "canje/sobre_raro.jpg"],
    sobre_epico: ["✨", "Un sobre épico", "Tres cartas y ninguna común: legendaria, cuatro veces más que en el de siempre.", "canje/sobre_epico.jpg"],
    capsula_elite: ["🟪", "Una cápsula de élite", "Un héroe de la Vanguardia o, casi una de cada tres, un Mito.", "canje/capsula_elite.jpg"],
    capsula_legendaria: ["🟨", "Una cápsula legendaria", "Un Mito seguro: para el hallazgo más difícil.", "canje/capsula_legendaria.jpg"]
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
    if (it.premio === "heroe_fijo" && it.heroe) { var h = heroesDelCatalogo().filter(function (x) { return x.clave === it.heroe; })[0]; return "🛡️ " + (h ? h.nombre + " · " + rarezaBonita(h.rareza) : "Un héroe"); }
    if (it.premio === "bolsa") return "💰 " + (n || 50) + " ◈";
    if (it.premio === "xp") return "⚡ " + (n || 100) + " xp";
    if (it.premio === "participaciones") return "🎟️ " + (n || 1) + (n === 1 || !n ? " participación" : " participaciones") + " del sorteo";
    return I[0] + " " + I[1];
  }
  // quién lleva qué: los grupos que gobierna quien mira (y sus nombres)
  function gestionados() { return PERS.filter(function (p) { return refDe(p); }).map(function (p) { return p.id; }); }
  function nombreDeGrupo(id) { var p = PERS.filter(function (x) { return x.id === id; })[0]; return (p && p.nombre) || id; }
  function textoAmbito(it) {
    var g = gestionados();
    if (it.grupos === "todos") return "🌐 Todos tus grupos" + (g.length > 1 ? " (" + g.length + ")" : "");
    var l = it.grupos || [];
    return l.length === 1 ? "Solo «" + nombreDeGrupo(l[0]) + "»" : "🌐 " + l.length + " grupos";
  }

  var PE = { lista: [], contexto: null, datos: {}, timers: {}, destino: null };
  function verHuevos() { verPremios(PER, $("#c-cuerpo")); }
  /**
   * La pantalla de premios. `contexto`: el grupo en el que se está (enseña los que le afectan y los nuevos nacen para él)
   * o null (🌐 todos tus grupos).
   */
  async function verPremios(contexto, destino) {
    PE.contexto = contexto; PE.destino = destino;
    destino.innerHTML = '<div class="card pe-card"><div class="pe-cab"><div><h3>🎁 Premios por enlace</h3>' +
      '<p class="small muted">Un enlace que da un premio a quien lo pulse, <b>una vez por persona</b>. Una <b>recompensa</b> para quien supera un reto de clase, o un <b>huevo de Pascua</b> escondido en tu Genially. ' +
      'El mismo enlace vale en todos los grupos a los que lo apliques. Todo se guarda solo.</p></div>' +
      '<button type="button" class="btn primary" id="pe-nuevo">➕ Nuevo premio</button></div>' +
      (contexto ? '<p class="pe-filtro small muted">Los que afectan a este grupo · <a href="consola.html?comun=premios">🌐 Ver los de todos tus grupos</a></p>' : "") +
      '<div id="pe-lista" class="pe-lista"><p class="muted">Buscando tus premios…</p></div></div>';
    $("#pe-nuevo").onclick = crearPremio;
    try { PE.lista = await MOTOR.premiosEnlaceDe(gestionados()); }
    catch (e) { $("#pe-lista").innerHTML = '<p class="malo">No he podido leer los premios: ' + esc(e.message) + "</p>"; return; }
    /**
     * 17-sep · «🌐 Todos tus grupos» se resuelve al GUARDAR: un grupo creado después (el curso de enero) no lo tenía
     * hasta que alguien tocara el premio, y dentro de ese grupo ni aparecía. Al abrir esta pantalla, los de «todos»
     * se llevan solos a los grupos tuyos que les falten (buscándolos en todos tus grupos, no solo en el que miras).
     */
    var mios = gestionados();
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
    var g = gestionados(), rec = it.tipo !== "huevo", ver = (it.en || [])[0] || PE.contexto || g[0] || "";
    var insertar = '<iframe src="' + MOTOR.enlacePremio(it, true) + '" width="100%" height="620" style="border:0;border-radius:16px" allow="clipboard-write" title="Premio de STARGATE"></iframe>';
    var mas = it.premio === "bolsa" || it.premio === "xp" || it.premio === "participaciones";
    return '<div class="hv-f pe-f" data-pe="' + esc(it.id) + '">' +
      '<button type="button" class="pe-img" data-pe-elegir title="Cambiar el premio">' + imgPremio(it, "pe-img-i") + '<span class="pe-img-c">Cambiar</span></button>' +
      '<div class="pe-cuerpo">' +
        '<div class="pe-l1">' +
          '<input class="h-nom pe-nom" value="' + esc(it.nombre || "") + '" placeholder="' + (rec ? "Ponle nombre: «Reto del lunes»" : "Ponle nombre: «Escondido en el Tema 3»") + '" aria-label="Nombre del premio" maxlength="80">' +
          '<span class="pe-tipo" role="group" aria-label="Qué es">' +
            '<button type="button" class="' + (rec ? "on" : "") + '" data-pe-tipo="recompensa" aria-pressed="' + rec + '">🎁 Recompensa</button>' +
            '<button type="button" class="' + (rec ? "" : "on") + '" data-pe-tipo="huevo" aria-pressed="' + !rec + '">🥚 Huevo de Pascua</button></span>' +
          '<label class="h-sw" title="Encendido: se puede reclamar (dentro de sus fechas).">' +
            '<input type="checkbox" class="h-on"' + (it.activo === false ? "" : " checked") + '><i></i>' +
            '<span class="h-sw-si">Activo</span><span class="h-sw-no">En pausa</span></label>' +
        '</div>' +
        '<div class="pe-l2"><b class="pe-premio">' + esc(nombrePremio(it)) + '</b>' +
          '<span class="pe-ambito">' + esc(textoAmbito(it)) + '</span>' +
          '<span class="h-estado">Comprobando…</span>' +
          '<span class="pe-guardado" aria-live="polite"></span></div>' +
        '<div class="pe-acc">' +
          '<button type="button" class="btn min" data-copiar="' + esc(MOTOR.enlacePremio(it, false)) + '" data-copiado="✓ Enlace copiado" title="La página de STARGATE, para compartir o poner en un botón">🔗 Copiar enlace</button>' +
          '<button type="button" class="btn min" data-copiado="✓ Código copiado" data-copiar="' + esc(insertar) + '" title="Para Genially: Insertar → Otros → Código. Sin fondo: se funde con tu diapositiva">&lt;/&gt; Copiar para insertar</button>' +
          (ver ? '<a class="btn min" target="_blank" rel="noopener" href="huevo.html?h=' + esc(it.id) + '&c=' + esc(it.codigo || "") + '&t=' + (rec ? "r" : "h") + '&per=' + esc(ver) + '&vista=1">👁 Ver cómo se ve</a>' : "") +
          '<button type="button" class="btn min" data-pe-mas aria-expanded="false">⚙️ Grupos, fechas y topes</button>' +
          '<button type="button" class="btn min peligro" data-pe-quitar title="Quitar este premio de todos sus grupos">🗑</button>' +
        '</div>' +
        '<div class="pe-mas" hidden>' +
          '<fieldset class="pe-grupos"><legend>¿Para qué grupos?</legend>' +
            '<label class="pe-radio"><input type="radio" name="pe-g-' + esc(it.id) + '" value="todos"' + (it.grupos === "todos" ? " checked" : "") + '> 🌐 Todos tus grupos, también los que crees después</label>' +
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
    if (!grupos.length) { f.textContent = "⚠️ No está en ningún grupo: marca alguno en «Grupos, fechas y topes»"; return; }
    Promise.all(grupos.map(function (per) { return MOTOR.estadoHuevo(per, it.id).catch(function () { return null; }); })).then(function (es) {
      var f2 = document.querySelector('.pe-f[data-pe="' + it.id + '"] .h-estado'); if (!f2) return;
      var e = es.filter(Boolean)[0];
      if (!e || !e.R) { f2.textContent = "⚠️ No está guardado en el servidor"; return; }
      var n = es.reduce(function (a, x) { return a + (x ? Number(x.reclamados) || 0 : 0); }, 0);
      it.__reclamados = n;
      var cuantos = n ? " · 🙋 " + n + (n === 1 ? " lo ha reclamado" : " lo han reclamado") : " · nadie lo ha reclamado aún";
      var cuando = MOTOR.cuandoEs;
      f2.textContent = (e.estado === "pausado" ? "⏸ En pausa"
        : e.estado === "pronto" ? "⏳ Se abre " + cuando(e.desde)
        : e.estado === "cerrado" ? "🔒 Se cerró " + cuando(e.hasta)
        : e.estado === "agotado" ? "🏁 Agotado"
        : e.estado === "borrado" ? "⚠️ Quitado"
        : "🟢 Abierto" + (e.hasta ? " hasta " + cuando(e.hasta) : "")) + cuantos;
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
    if (malo) { if (marca) { marca.textContent = "⚠️ " + malo; marca.className = "pe-guardado malo"; } return; }
    if (marca) { marca.textContent = "Guardando…"; marca.className = "pe-guardado"; }
    var est = document.querySelector('.pe-f[data-pe="' + it.id + '"] .h-estado'); if (est) est.textContent = "Comprobando…";
    clearTimeout(PE.timers[it.id]);
    PE.timers[it.id] = setTimeout(async function () {
      try {
        var r = await MOTOR.guardarPremioEnlace(it, gestionados());
        it.en = r.en; it.actualizado = Date.now();
        var m = document.querySelector('.pe-f[data-pe="' + it.id + '"] .pe-guardado');
        if (m) {
          m.textContent = r.saltados.length ? "⚠️ Guardado, pero no en " + r.saltados.map(function (s) { return "«" + nombreDeGrupo(s.per) + "» (" + s.motivo + ")"; }).join(", ")
                                            : "✓ Guardado" + (r.en.length > 1 ? " en " + r.en.length + " grupos" : "");
          m.className = "pe-guardado " + (r.saltados.length ? "malo" : "bien");
        }
        var f = document.querySelector('.pe-f[data-pe="' + it.id + '"]');
        if (f) { $(".pe-ambito", f).textContent = textoAmbito(it); estadoServidor(it); }
        // dentro de un grupo, si ya no le afecta, sale de la lista
        if (PE.contexto && r.en.indexOf(PE.contexto) < 0) pintarPremios();
      } catch (e) {
        var m2 = document.querySelector('.pe-f[data-pe="' + it.id + '"] .pe-guardado');
        if (m2) { m2.textContent = "⚠️ No se ha guardado: " + e.message; m2.className = "pe-guardado malo"; }
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
                 "Crea uno nuevo con su propio enlace (este sigue como está).", si: "✨ Crear uno nuevo con este premio", no: "Cancelar" });
        if (!q) return;
        {
          var nuevo = MOTOR.premioNuevo({ tipo: it.tipo, nombre: it.nombre ? it.nombre + " (2)" : "", grupos: it.grupos, premio: r.premio, heroe: r.heroe, cantidad: r.cantidad, sorteo: r.sorteo });
          try { var g2 = await MOTOR.guardarPremioEnlace(nuevo, gestionados()); nuevo.en = g2.en; } catch (e) { aviso("No se ha podido crear: " + e.message); return; }
          PE.lista.unshift(nuevo); pintarPremios(); aviso("✨ Premio nuevo creado, con su propio enlace.", true); return;
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
      try { await MOTOR.borrarPremioEnlace(it, gestionados()); PE.lista = PE.lista.filter(function (x) { return x.id !== it.id; }); pintarPremios(); aviso("Premio quitado.", true); }
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
    try { var g = await MOTOR.guardarPremioEnlace(it, gestionados()); it.en = g.en; }
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
        '<button type="button" class="pe-op" data-v="recompensa"><span class="pe-op-ico">🎁</span><b>Una recompensa</b><em>Para quien supera un reto o una actividad de clase. Al pulsar el enlace: «¡Enhorabuena! Has ganado una recompensa».</em></button>' +
        '<button type="button" class="pe-op" data-v="huevo"><span class="pe-op-ico">🥚</span><b>Un huevo de Pascua</b><em>Escondido en un rincón de tu Genially. Quien lo encuentra: «Has encontrado un huevo de Pascua».</em></button>' +
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
  var NOM_ESTADO = { abierto: "⏳ En marcha", aceptado: "✅ Cambiado", rechazado: "✖️ Rechazado", retirado: "↩️ Retirado",
    caducado: "⌛ Caducado", anulado: "🚫 Anulado", vendido: "💰 Se lo quedó otro", deshecho: "↺ Deshecho" };
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
    if (!S.inicio || !SS) return "🗓️ Se abre en la <b>semana " + sem + "</b>.";
    var dia = SS.inicioDeSemana(S.inicio, sem, S.pausas), hoy = SS.iso(new Date());
    if ((S.capitulosAbiertos || {}).c5 && dia > hoy) return "🔓 <b>Abierto antes de tiempo</b>: su fecha era el " + diaLargo(dia) + " (semana " + sem + ").";
    return dia <= hoy ? "✅ Abierto desde el <b>" + diaLargo(dia) + "</b> (semana " + sem + ")."
                      : "🗓️ Se abre el <b>" + diaLargo(dia) + "</b> (semana " + sem + ").";
  }
  function verZoco(t) {
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>El Zoco Estelar</h3><p class="muted">Cargando los trueques…</p></div>';
    MOTOR.zocoTratosGrupo(PER).then(function (lista) {
      var pieza = function (id) {
        // 14-sep · las participaciones del sorteo también se revenden en el Zoco
        if (/__sorteo[a-z0-9]*$/i.test(String(id))) {
          var t = ((DATOS && DATOS.recompensas) || []).filter(function (r) { return r.docId === id; })[0];
          return "🎟️ Participación · " + esc(((t && t.stargateSorteo) || {}).premio || "sorteo");
        }
        var k = String(id).split("__").pop(), h = /^heroe_/.test(k), c = k.replace(/^(heroe|cromo)_/, "");
        var x = h ? (window.SG_CATALOGO && SG_CATALOGO.heroes || []).filter(function (y) { return y.clave === c; })[0]
                  : (window.SG_CATALOGO && SG_CATALOGO.cromos || []).filter(function (y) { return y.clave === c; })[0];
        return (h ? "🛡️ " : "🃏 ") + esc((x && x.nombre) || c);
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
            var estado = x.estado === "anulado" && x.motivo === "sorteo" ? "🎟️ Anulado: ya se sorteó" : (NOM_ESTADO[x.estado] || esc(x.estado));
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
        '<div class="eq-cab">' + (f && f.imageUrl ? '<img src="' + esc(f.imageUrl) + '" alt="" width="52" height="52" loading="lazy">' : '<span class="eq-sin" aria-hidden="true">👤</span>') +
          '<div class="eq-quien"><h4>' + esc(d.nombre || correo) + (soyYo ? ' <span class="chip">tú</span>' : "") + "</h4>" +
          '<p class="small muted">' + esc(correo || "sin correo") + "</p></div>" +
          '<span class="eq-rol' + (esRef ? " ref" : "") + '"' + (vital ? ' title="Referente vitalicio: manda en todos los grupos"' : "") + '>' + (vital ? "⭐ Vitalicio" : esRef ? "⭐ Referente" : "Docente") + "</span></div>" +
        '<p class="eq-esc">' + (f ? "🛡️ <b>" + esc(f.name) + "</b> · " + n + " recluta" + (n === 1 ? "" : "s") +
            ' <button type="button" class="eq-lnk" data-ver-esc="' + esc(d.nombre) + '">Ver su escuadrón →</button>'
          : '<span class="muted">Sin escuadrón (coordina, o se incorporó después)</span>' + (n ? " · " + n + " reclutas a su nombre" : "")) + "</p>" +
        (otros.length ? '<p class="small eq-otros">También en ' + otros.map(function (g) {
            return '<a href="consola.html?per=' + encodeURIComponent(g.id) + '&tab=equipo">' + esc(g.nombre) + "</a>" + (g.rol === "referente" ? " ⭐" : ""); }).join(" · ") + "</p>" : "") +
        (n && destinos.length ? '<div class="eq-pasar"><span>Pasar su alumnado a</span><select data-dest="' + i + '" aria-label="A quién pasa su alumnado">' +
            destinos.map(function (x) { return "<option>" + esc(x.nombre) + "</option>"; }).join("") + "</select>" +
            '<button type="button" class="btn min" data-pasar="' + i + '">Pasar</button></div>' : "") +
        '<div class="eq-acc">' +
          (vital ? "" : '<button type="button" class="btn min" data-rol="' + i + '">' + (esRef ? "Pasar a docente" : "⭐ Hacer referente") + "</button>") +
          (vital || soyYo ? "" : '<button type="button" class="btn min peligro" data-quitar="' + i + '">Quitar del equipo</button>') +
        "</div></article>";
    };
    // los reclutas de alguien que ya no está en el equipo (su nombre no casa con nadie)
    var huerfanos = {}; t.reclutas.forEach(function (r) {
      if (r.profe && !docs.some(function (d) { return d.nombre === r.profe; })) huerfanos[r.profe] = (huerfanos[r.profe] || 0) + 1; });
    var nomsH = Object.keys(huerfanos), conDestino = docs.filter(function (x) { return conEsc(x.nombre); });
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Equipo docente</h3>' +
      '<p class="small muted">Cada persona, con lo que se le puede hacer. Entran con <b>su cuenta de Google</b>: añadirla es darle entrada al grupo; quitarla, quitársela.' +
      (VITALICIOS_WEB.indexOf(yo) >= 0 ? ' Todo el profesorado de todos los grupos está en <a href="profesores.html">👥 Profesores</a>.' : "") + "</p>" +
      '<div class="eq-lista">' + docs.map(tarjeta).join("") + "</div></div>" +
      (nomsH.length && conDestino.length ? '<div class="card"><h3>⚠️ Alumnado sin Comandante</h3>' +
        '<p class="small muted">Su Comandante ya no está en el equipo. Pásalo a alguien que sí esté (y entra en su escuadrón).</p>' +
        '<p class="eq-pasar"><label>De<select id="t-de">' + nomsH.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("") + "</select></label>" +
        '<label>A<select id="t-a">' + conDestino.map(function (d) { return "<option>" + esc(d.nombre) + "</option>"; }).join("") + "</select></label>" +
        '<button type="button" class="btn" id="t-ir">Pasar el alumnado</button></p></div>' : "") +
      /**
       * 🔴 AÑADIR A ALGUIEN, que hasta el 13-sep no se podía. El equipo se fijaba al CREAR el grupo y después era de
       * solo lectura: un docente que se incorpora a mitad de curso o un co-referente obligaban a sembrar otra vez.
       */
      '<div class="card"><h3>➕ Añadir a alguien al equipo</h3>' +
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
              (d.rol === "referente" ? "<em>⭐ referente</em>" : "") + "</div>" +
            "<div><span>Reclutas</span><b>" + x.suyos.length + "</b></div>" +
            "<div><span>Media de xp</span><b>" + x.media + "</b></div>" +
            "<div><span>Insignias de media</span><b>" + String(x.ins).replace(".", ",") + "</b></div></div>" +
            (x.suyos.length ? tablaGente(x.suyos.map(function (r) { return [r, t.reclutas.indexOf(r)]; }), caps, false)
                            : '<p class="small muted">Todavía no se ha alistado nadie en este escuadrón.</p>') +
          "</div></details>";
      }).join("") +
      (huerfanos.length
        ? '<p class="small" style="margin-top:14px;color:var(--amber)">⚠️ <b>' + huerfanos.length +
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
    if (t.stargateRetirado) return ["retirado", "🚫 Quitado de este grupo"];
    if (t.isRaffleCompleted) return ["hecho", "🏆 Sorteado el " + diaDe(t.raffleResolvedAt)];
    if (Number(t.availableFrom) > ahora) return ["pronto", "⏳ A la venta desde el " + diaDe(t.availableFrom)];
    if (Number(t.ticketDeadline) && Number(t.ticketDeadline) <= ahora) return ["listo", "🎲 Venta cerrada: listo para sortear"];
    return ["venta", "🟢 A la venta · se sortea el " + diaDe(t.ticketDeadline)];
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
      (t ? (gestionados().length > 1 ? '<p class="small muted sr-f-nota">🌐 Se cambia en todos los grupos donde está este sorteo (menos donde ya se haya hecho).</p>' : "")
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
      '<label class="pe-radio"><input type="radio" name="' + esc(nombre) + '" value="todos"' + (todos ? " checked" : "") + "> 🌐 Todos tus grupos (" + g.length + ")</label>" +
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
    if (so.cancelada) return ["cancelada", "✖️ Cancelada"];
    if (ahora < Number(so.desde || 0)) return ["pronto", "⏳ Empieza el " + diaDe(so.desde)];
    if (ahora >= Number(fo.endsAt || 0)) return ["fin", "⌛ Terminó el " + diaDe(fo.endsAt)];
    // (15-sep · agotada NO es terminada: le faltan unidades, no tiempo; antes solo ofrecía «Reabrir»)
    if (r.isLimitedStock === true && Number(r.globalStock || 0) <= 0) return ["agotada", "🔥 Agotada"];
    return ["viva", "⚡ A la venta hasta el " + diaDe(fo.endsAt)];
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
      (r.stargateComun ? ' <span class="chip of-comun">🌐 varios grupos</span>' : "") +
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
        b.onclick = function () { b.disabled = true; hazlo("extender", { dias: Number(b.getAttribute("data-of-mas")) }, "⏳ Oferta alargada.", function () { b.disabled = false; }); }; });
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
        hazlo("cancelar", {}, "✖️ Oferta cancelada."); };
    });
  }
  function verOfertas(t) {
    var R = (DATOS && DATOS.recompensas) || [];
    var L = R.filter(function (r) { return r.stargateTipo === "oferta"; })
      .sort(function (a, b) { return Number((b.stargateOferta || {}).desde || 0) - Number((a.stargateOferta || {}).desde || 0); });
    var auto = (DATOS.proyecto.stargate || {}).ofertasAuto !== false;
    $("#c-cuerpo").innerHTML =
      '<div class="card"><h3>⚡ Ofertas</h3>' +
      '<p class="small">Cada semana, desde la 5 (con su capítulo de NEBULA), sale <b>sola</b> una oferta en el Mercado: un sobre, una cápsula, un héroe o una carta concretos, ' +
      'rebajados un 20-40 %, durante esa semana y con <b>unidades según los inscritos y la rareza</b> (común: sin límite; rara: la mitad; épica: una cuarta parte; legendaria: el 10 %). Una por persona.' +
      (gestionados().length > 1 ? ' Las que crees tú pueden salir <b>en varios de tus grupos</b> a la vez (<a href="consola.html?comun=ofertas">🌐 ver las de todos</a>).' : "") + '</p>' +
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
      pide("auto", { on: cb.checked }, cb.checked ? "⚡ Una oferta automática cada semana." : "Ofertas automáticas apagadas: solo las que crees tú.",
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
        if (destinos.length === 1 && destinos[0] === PER) return pide("crear", datos, "⚡ Oferta creada: ya está en el Mercado de tu alumnado.", vuelve);
        MOTOR.crearOfertaEnGrupos(datos, destinos).then(function (r) {
          return tras("⚡ Oferta creada en " + (destinos.length - r.fallos.length) + " grupos." + (r.fallos.length ? " No se pudo en " + nombresDe(r.fallos.map(function (f) { return f.per; })) + ": " + r.fallos[0].motivo : ""));
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
    destino.innerHTML = '<div class="card"><h3>⚡ Ofertas</h3><p class="small">Una oferta que crees aquí sale en el Mercado de los grupos que elijas, a la vez. En cada grupo ' +
      'las unidades salen de <b>sus</b> inscritos. Lo que hagas con ella (alargar, unidades, cancelar) se hace en todos. La oferta automática de cada semana se enciende o apaga dentro de cada grupo.</p>' +
      '<p><button class="btn primary" id="of-nueva">+ Crear una oferta</button></p><div id="of-nueva-f"></div></div>' +
      (lista.length ? lista.map(function (o) {
        var r = o.grupos[0].oferta;
        var amb = '<p class="small of-grupos">' + (o.grupos.length > 1 || o.comun ? "🌐 " : "") + o.grupos.map(function (x) {
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
          return repinta("⚡ Oferta creada en " + (destinos.length - r.fallos.length) + (destinos.length === 1 ? " grupo." : " grupos.") + (r.fallos.length ? " No se pudo en " + nombresDe(r.fallos.map(function (f) { return f.per; })) + ": " + r.fallos[0].motivo : ""));
        }).catch(function (e) { var c = $("#of-crear"); if (c) c.disabled = false; aviso(e.message); });
      };
    };
  }

  var SORTEOS_PEDIDOS = {};   // (15-sep · por grupo: al pasar de un grupo a otro sin recargar, el segundo también se pide)
  function verSorteos(t) {
    var L = sorteosDelGrupo(), cat = window.SG_CATALOGO || {}, porDefecto = (cat.sorteos || [])[0];
    var falta = porDefecto && !L.some(function (x) { return x.stargateId === porDefecto.id; });
    $("#c-cuerpo").innerHTML =
      '<div class="card"><h3>🎟️ Sorteos</h3>' +
      '<p class="small">Para dinamizar la clase. Tu alumnado compra <b>participaciones</b> en el Mercado; tú las <b>regalas</b> en el aula ' +
      '(Premiar → 🎟️) o las <b>escondes en un enlace</b> (Premios por enlace → 🎟️ Participaciones). El día del sorteo, <b>proyéctalo</b>: ' +
      'lo hace el servidor, una papeleta por participación, y nadie gana dos. Entre ellos, las <b>revenden en el Zoco</b>; lo que siga a la venta ' +
      'al sortear se retira solo y cada oferta devuelve sus créditos.</p>' +
      (falta ? '<p><button class="btn primary" id="sr-defecto">➕ Añadir el Gran Sorteo: ' + esc(porDefecto.ganadores + " × " + porDefecto.premio) + '</button></p>' : "") +
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
            ? '<div class="sr-ganadores"><p>🏆 <b>Ganadores</b> (entrégales el premio)' + (x.raffleResolvedBy === "auto" ? ' · <span class="small muted">se resolvió solo el ' + diaDe(x.raffleResolvedAt) + '</span>' : '') + ':</p>' +
              ((x.raffleWinnerIds || []).length ? '<ul>' + ganadores + '</ul>' +
                // 14-sep · Norberto: «importante guardar estos datos para poder dar las licencias de forma manual»
                '<p><button class="btn" data-copiar-gan="' + esc(x.docId) + '">📋 Copiar ganadores (alias, nombre y correo)</button></p>'
                : '<p class="small muted">Nadie tenía participaciones: se cerró sin ganadores.</p>') + '</div>'
            : '<p class="sr-cuenta"><b>' + total + '</b> participaci' + (total === 1 ? 'ón' : 'ones') + ' de <b>' + B.length + '</b> recluta' + (B.length === 1 ? '' : 's') + '</p>' +
              (B.length ? '<details class="cajon"><summary><b>El bombo</b> <span class="cnt">' + B.length + '</span></summary><div class="tabla-envoltura"><table class="tabla sr-tabla"><thead><tr><th>Alias</th><th>Nombre</th><th>Participaciones</th><th>Posibilidades</th></tr></thead><tbody>' +
                B.map(function (b) { return '<tr><td>' + esc(b.alias) + '</td><td>' + esc(b.nombre || "—") + '</td><td>' + b.n + '</td><td>' + Math.round(100 * b.n / Math.max(1, total)) + ' %</td></tr>'; }).join("") +
                '</tbody></table></div></details>' : '') +
              '<p class="sr-botones"><button class="btn primary sr-directo" data-doc="' + esc(x.docId) + '"' + (B.length ? '' : ' disabled title="Nadie tiene participaciones todavía"') + '>🎲 Sortear en directo</button> ' +
              '<button class="btn sr-editar" data-doc="' + esc(x.docId) + '">✏️ Cambiar</button></p><div class="sr-editar-f"></div>') +
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
      MOTOR.sorteosPendientes(PER).then(function (r) { if (r && (r.resueltos || []).length) tras("🎟️ El sorteo se ha resuelto solo: ya tienes los ganadores."); }).catch(function () {});
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
          var hecho = function () { aviso("📋 Copiados: " + gente.length + " ganador" + (gente.length === 1 ? "" : "es") + ". Pégalos donde vayas a gestionar las licencias.", true); };
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
    el.innerHTML = '<p class="small sr-ambito-t">🌐 <b>En sus grupos:</b> ' + g.map(function (per) {
      var t = de[per], on = !!t && !t.stargateRetirado, hecho = !!t && t.isRaffleCompleted && !t.stargateRetirado;
      return '<label class="pe-chip' + (hecho ? " hecho" : "") + '" title="' + (hecho ? "Ya se hizo aquí" : on ? "Desmárcalo para quitarlo de este grupo" : "Márcalo para llevarlo a este grupo") + '">' +
        '<input type="checkbox" value="' + esc(per) + '"' + (on ? " checked" : "") + (hecho ? " disabled" : "") + "> " + esc(nombreDeGrupo(per)) + (hecho ? " · 🏆" : "") + "</label>";
    }).join(" ") + "</p>";
    Array.prototype.forEach.call(el.querySelectorAll("input[type=checkbox]"), function (c) {
      c.onchange = async function () {
        var per = c.value, t = de[per];
        c.disabled = true;
        try {
          if (c.checked) { await MOTOR.sorteoEnGrupos(configDeTicket(vivo.ticket), [per]); await despues("🎟️ Sorteo añadido a «" + nombreDeGrupo(per) + "»."); }
          else {
            if (!t || t.stargateRetirado) { c.disabled = false; return; }   // (ahí no estaba: nada que quitar)
            if (!(await window.SG.preguntar({ titulo: "¿Quitar este sorteo de «" + nombreDeGrupo(per) + "»?", texto: "Solo se puede si allí nadie tiene participaciones. Deja de venderse en ese grupo.", si: "Quitarlo de ese grupo", peligro: true }))) { c.checked = true; c.disabled = false; return; }
            await MOTOR.retirarSorteo(per, t.docId); await despues("🎟️ Sorteo quitado de «" + nombreDeGrupo(per) + "».");
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
    destino.innerHTML = '<div class="card"><h3>🎟️ Sorteos</h3><p class="small">Un sorteo se configura una vez y va a los grupos que elijas. ' +
      'Cada grupo tiene <b>su bombo</b> y su <b>sorteo en directo</b> (entra en el grupo → Sorteos). Cambiarlo aquí lo cambia en todos sus grupos.</p>' +
      '<p><button class="btn primary" id="sr-nuevo">+ Crear un sorteo</button></p><div id="sr-nuevo-f"></div></div>' +
      (l.length ? l.map(function (s) {
        var vivo = s.grupos.filter(function (x) { return !x.ticket.stargateRetirado; })[0] || s.grupos[0], t = vivo.ticket, S = t.stargateSorteo || {}, cfg = configDeTicket(t);
        return '<div class="card sr-caja" data-sid="' + esc(s.id) + '">' +
          '<div class="sr-cab"><img src="assets/img/canje/' + esc(S.imagen || "sorteo_generico.jpg") + '" alt=""><div><h3>' + esc(cfg.premio) + '</h3>' +
          '<p class="small">' + cfg.ganadores + " ganador" + (cfg.ganadores === 1 ? "" : "es") + " por grupo · " + cfg.coste + " ◈ la participación" + (cfg.maximo ? " · máx. " + cfg.maximo + " por persona" : "") +
          " · a la venta del " + diaDe(cfg.desde) + " al " + diaDe(cfg.fecha) + "</p>" +
          '<p class="small sr-estados">' + s.grupos.map(function (x) {
            return '<a class="chip" href="consola.html?per=' + esc(x.per) + '" title="Entrar en el grupo: su bombo y el sorteo en directo">' + esc(nombreDeGrupo(x.per)) + " · " + estadoSorteo(x.ticket)[1] + "</a>"; }).join(" ") + "</p></div></div>" +
          '<div class="sr-ambito"></div>' +
          (s.grupos.some(function (x) { return !x.ticket.isRaffleCompleted; }) ? '<p class="sr-botones"><button class="btn sr-editar">✏️ Cambiar (en todos sus grupos)</button></p><div class="sr-editar-f"></div>' : "") +
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
      '<p class="sr-proy-bot"><button class="btn epico" id="sr-go"><span class="ep-luz"></span><span class="ep-txt">🎲 ¡Sortear!</span></button> ' +
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
      catch (e) { go.disabled = false; go.querySelector(".ep-txt").textContent = "🎲 ¡Sortear!"; $("#sr-res", capa).innerHTML = '<p class="malo">' + esc(e.message) + '</p>'; return; }
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
        $("#sr-res", capa).innerHTML = '<p class="sr-gana">🏆 ' + dichos.join(" · ") + '</p>';
        await new Promise(function (ok) { setTimeout(ok, quieto ? 0 : 900); });
      }
      $("#sr-res", capa).innerHTML = '<p class="sr-gana">🏆 ' + dichos.join(" · ") + '</p><p class="sr-proy-sub">¡Enhorabuena! ' +
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
    var edita = soyRefAqui();
    if (!edita || !CAL || CAL.per !== PER) CAL = calDelGrupo();
    var tipo = S.tipo === "PUA" ? "PUA" : "REGULAR", total = (cat.semanas || {})[tipo] || 15, extra = cat.semanasCanjeExtra || 1;
    var re = function () { verCalendario(t); };
    if (!CAL.inicio) {
      $("#c-cuerpo").innerHTML = '<div class="card cal-caja"><h3>📅 El calendario del grupo</h3>' + (edita
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
      var et = f.congelada ? (festiva ? "🎄" : "⏸") : f.canje ? "🛒" : "S" + f.semana;
      var que = [];
      // 15-sep · Norberto: «hay que saltarse SIEMPRE la semana del 24 de diciembre, la siguiente y la de Jueves Santo». Los grupos
      // nuevos nacen así; en uno de antes, una festiva que aún cuenta como lectiva se señala (y abajo se saltan todas de un clic).
      if (!f.congelada && festivas.indexOf(f.inicio) >= 0) que.push('<span class="cal-aviso">🎄 ' + fiesta(f.inicio) + ' en la UNIR: debería ser no lectiva</span>');
      if (f.congelada) que.push(festiva ? "<b>" + fiesta(f.inicio) + "</b> en la UNIR: no hay clase" : "<b>No lectiva</b>: el curso no avanza esta semana");
      else {
        planetas.filter(function (p) { return p.sem === f.semana; }).forEach(function (p) { que.push("🪐 Planeta " + p.n + " · " + esc(p.nombre)); });
        caps.filter(function (c) { return semCap(c) === f.semana; }).forEach(function (c) {
          que.push(c.icono + " " + esc(c.titulo) + (CAL.abiertos[c.clave] ? ' <span class="chip ok">ya abierto</span>' : "")); });
        if (f.semana === total) que.push("🏁 Último día para registrar retos: <b>" + diaCorto(f.fin) + "</b>");
        if (f.semana === total + extra) que.push("🛒 Último día para canjear: <b>" + diaCorto(f.fin) + "</b>");
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
        if (semAntes !== semHoy) cambios.push("⚠️ <b>Hoy el grupo pasa de la semana " + semAntes + " a la " + semHoy + ".</b>");
      }
    }

    $("#c-cuerpo").innerHTML =
      '<div class="card cal-caja"><h3>📅 El calendario del grupo</h3>' +
      '<div class="cal-resumen">' +
        "<span><b>" + total + "</b> semanas lectivas <em>(" + (tipo === "PUA" ? "PUA" : "curso regular") + ")</em></span>" +
        "<span><b>" + noLect + "</b> no lectiva" + (noLect === 1 ? "" : "s") + "</span>" +
        "<span><b>" + extra + "</b> de canje</span>" +
        "<span>Retos hasta el <b>" + diaCorto(nuevo.cierre) + "</b></span>" +
        "<span>Canje hasta el <b>" + diaCorto(nuevo.cierreCanje) + "</b></span>" +
        '<span class="cal-hoy-txt">Hoy: <b>' + hoyTxt + "</b></span></div>" +
      (sinSaltar.length ? '<p class="cal-aviso-caja">🎄 <b>' + sinSaltar.length + (sinSaltar.length === 1 ? " semana festiva" : " semanas festivas") +
        " de la UNIR</b> (Navidad o Semana Santa) " + (sinSaltar.length === 1 ? "cuenta" : "cuentan") + " aún como lectiva" + (sinSaltar.length === 1 ? "" : "s") + " en este grupo." +
        (edita ? ' <button type="button" class="btn min" id="cal-festivos">Saltarlas</button>' : " Díselo a tu referente.") + "</p>" : "") +
      (edita
        ? '<div class="cal-cab"><label>Primer día de la semana 1 <input type="date" id="cal-inicio" value="' + esc(CAL.inicio) + '"></label>' +
          '<p class="small">👆 <b>Pulsa una semana</b> que aún no haya llegado para marcarla como <b>no lectiva</b> (o para que vuelva a serlo). ' +
          "Las de detrás se renumeran solas y abajo verás a qué día se mueve cada una. Nada cambia hasta <b>Guardar</b>.</p></div>"
        : '<p class="small muted">Lo lleva tu referente. Aquí ves cada semana del curso, las que no son lectivas y lo que se abre en cada una.</p>') +
      '<div class="cal-ley"><span class="l lectiva">S1 · lectiva</span><span class="l nolectiva">⏸ no lectiva</span>' +
        '<span class="l festivo">🎄 festiva UNIR</span><span class="l canje">🛒 canje</span><span class="l hoy">hoy</span></div>' +
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
              (porFecha ? "" : antes ? '<button type="button" class="btn min" data-cal-cierra="' + c.clave + '">↩️ Volver a su semana</button>'
                                     : '<button type="button" class="btn min" data-cal-abre="' + c.clave + '">🔓 Abrir ya</button>') + "</div>";
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
  var VITALICIOS_WEB = ["n.cuartero.10@gmail.com", "mutecdgami@gmail.com"];
  function puedoBorrar() {
    var P = DATOS.proyecto || {}, u = YO || {};
    return !!u.uid && (P.ownerId === u.uid || P.teacherId === u.uid || VITALICIOS_WEB.indexOf(String(u.email || "").toLowerCase()) >= 0);
  }
  function tarjetaBorrar() {
    var P = DATOS.proyecto || {}, S = P.stargate || {};
    if (Number(S.demoSemana || 0) > 0) return '<div class="card"><h3>🗑️ Borrar este grupo</h3><p class="small muted">Es el grupo de la demostración pública: no se borra desde aquí.</p></div>';
    if (!puedoBorrar()) return '<div class="card"><h3>🗑️ Borrar este grupo</h3><p class="small muted">Solo puede borrarlo quien lo creó' +
      (P.ownerEmail ? " (" + esc(P.ownerEmail) + ")" : "") + " o un referente vitalicio.</p></div>";
    return '<div class="card zona-peligro"><h3>🗑️ Borrar este grupo</h3>' +
      '<p class="small">Se borra <b>todo</b>: el grupo, las fichas de su alumnado, sus retos, el Mercado, las llamadas, el Zoco y los alias. ' +
      '<b>No se puede deshacer.</b> Pensado para los grupos de prueba.</p>' +
      '<label>Para confirmarlo, escribe su nombre: <b>' + esc(P.name || PER) + '</b><input id="s-borrar-nombre" autocomplete="off" spellcheck="false"></label>' +
      '<p><button class="btn peligro" id="s-borrar" type="button" disabled>Borrar el grupo para siempre</button></p></div>';
  }
  function cablearBorrar() {
    var inp = $("#s-borrar-nombre"), b = $("#s-borrar"), nombre = String((DATOS.proyecto || {}).name || PER).trim();
    if (!inp || !b) return;
    inp.oninput = function () { b.disabled = inp.value.trim() !== nombre; };
    b.onclick = async function () {
      if (inp.value.trim() !== nombre) return;
      if (!(await window.SG.preguntar({ titulo: "Última pregunta: ¿borrar «" + nombre + "» y todo lo que tiene?", texto: "No se puede deshacer.",
        si: "Borrar el grupo", peligro: true }))) return;
      b.disabled = true; b.textContent = "Borrando…";
      try {
        await MOTOR.llamar("deleteProject", { projectId: PER });
        location.href = "consola.html?borrado=" + encodeURIComponent(nombre);
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
      esc(S.cierreCanje || "—") + ' <button class="btn min" data-tab="calendario" type="button">📅 Cambiar en Calendario</button></p>' +
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
      [["📽️ La sesión de la semana", "sesion.html?embed=1"], ["🔔 Llamada a filas (solo la toca el Comandante)", "llamada.html?embed=1"],
       ["🛰️ El aula (el puesto de mando del docente)", "aula.html?embed=1"], ["🎯 Validar un reto", "validar.html?reto=S7&embed=1"],
       // 16-sep · la batalla del reto A6: se pone en el Genially del tema 6 y se juega en clase, cada cual en su dispositivo
       ["⚔️ El Simulador de Joran (el reto A6)", "batalla.html?embed=1"]].map(function (x) {
        return '<p class="small">' + x[0] + ' <button class="btn min" data-copiado="✓ Código copiado" data-copiar="' + esc(codigoGenially(x[1], "STARGATE · " + x[0].replace(/^\S+\s/, ""))) + '">&lt;/&gt; Copiar para insertar</button></p>';
      }).join("") +
      // 15-sep (tarde) · el reto secreto (S7) es el Escape UNI; el enlace escondido de Vínculo lleva a su puerta
      /**
       * 18-sep · EL FINAL DEL ESCAPE, CON SU LLAVE DENTRO. Norberto: «no se valida con palabra mágica, se valida con
       * enlace mágico; al final del escape embeberemos la misión para validarla». El enlace y el código de inserción
       * llevan la llave, así que el alumnado no escribe nada: entra con su cuenta y el reto queda registrado.
       * 🔴 La llave no se guarda en ninguna parte (ni aquí, ni en el grupo, ni en el repositorio, que es público):
       * se pega en este campo y se usa en el momento para montar el enlace.
       */
      '<p class="small">🗝️ <b>El reto secreto (S7) es el Escape UNI</b>. Se registra con el final del escape, y ese enlace ' +
      '<b>lleva la llave dentro</b>: quien lo abre solo entra con su cuenta. Pega aquí tu llave y te lo doy montado.</p>' +
      '<p class="small"><input id="s7-llave" type="text" autocomplete="off" spellcheck="false" placeholder="La llave del Escape UNI" ' +
      'style="max-width:15rem"> <button class="btn min" id="s7-enl" data-copiado="✓ Enlace copiado" data-copiar="">🔗 Copiar el enlace del final</button> ' +
      '<button class="btn min" id="s7-cod" data-copiado="✓ Código copiado" data-copiar="">&lt;/&gt; Copiar el código para incrustarlo</button></p>' +
      '<p class="small muted">La llave no se guarda en ningún sitio: se usa aquí mismo. Y si quieres esconder la <b>puerta</b> del escape ' +
      'en la presentación de <b>Vínculo</b>, ponla en algo que no parezca un botón (una estrella, un rincón de la imagen). ' +
      '<button class="btn min" data-copiado="✓ Enlace copiado" data-copiar="' + esc(location.origin + "/fragmento.html") + '">🔗 Copiar la puerta escondida</button></p>' +
      '</div>' +
      tarjetaBorrar();
    cablearBorrar();
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
    var per = url.get("per") || "demo-motor";
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
    PER = per; PERS = [{ id: per, nombre: (d.proyecto || {}).name || per }];
    // 🔴 Las mismas claves que arma `leerPER`, con los mismos nombres. El catálogo y `privadoPER`
    // no son opcionales: sin ellos el traductor revienta al calcular el primer nivel.
    DATOS = Object.assign({}, d, { privados: privados, vales: d.vales || [],
                                   catalogo: window.SG_CATALOGO,
                                   privadoPER: { referente: "referente@ejemplo.es", panelEdit: "", docentes: [] } });
    pintar();
    Array.prototype.forEach.call(app.querySelectorAll("button"), function (b) {
      if (/Guardar|Conceder|Denegar|Pasar el alumnado/.test(b.textContent)) b.disabled = true;
    });
  }

  function arrancar() {
    MOTOR = window.SG.MOTOR;
    if (url.get("demo") === "1") return demostracion();
    var mirar = function (u) {
      var q_ = u ? u.uid : null; if (q_ === mirar._v) return; mirar._v = q_;  // una vez por cuenta: sesion() y sg:sesion llegan los dos al cargar
      YO = u; YO ? elegirGrupo() : puerta();
    };
    MOTOR.sesion().then(mirar);
    document.addEventListener("sg:sesion", function (e) { mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
