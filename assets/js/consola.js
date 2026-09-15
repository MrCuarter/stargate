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
    app.addEventListener("click", function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest("[data-copiar]") : null;
      if (!b || !app.contains(b)) return;
      ev.preventDefault();
      var txt = b.getAttribute("data-copiar");
      var v = b.getAttribute("data-copiado") || "✓ Copiado";
      var ok = function () {
        if (b.__copiando) return; b.__copiando = true;
        var antes = b.innerHTML; b.textContent = v; b.classList.add("ok");
        setTimeout(function () { b.innerHTML = antes; b.classList.remove("ok"); b.__copiando = false; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(txt).then(ok).catch(function () { prompt("Copia:", txt); });
      else prompt("Copia:", txt);
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
      // Las dos cifras que se miran de un vistazo: cuánta gente hay y por dónde vamos.
      '<div class="gp-cifras">' +
        '<div><b>' + (p.reclutas == null ? "—" : p.reclutas) + '</b><span>alistados</span></div>' +
        '<div><b>' + (p.estado === "en marcha" ? p.semana : "—") + '</b><span>' +
          (p.estado === "en marcha" ? "de " + p.total + " semanas" : esc(cuando)) + '</span></div>' +
      '</div>' +
      // 🔴 Lo de clase, en la tarjeta. Se busca con los alumnos ya sentados: cada clic de más ahí
      // es medio minuto de aula mirando una pantalla de carga.
      '<div class="gp-hacer">' +
        '<a class="gp-b principal" href="sesion.html?per=' + esc(p.id) + '" target="_blank" rel="noopener">' +
          '<span>📽️</span><b>Proyectar la clase</b></a>' +
        '<a class="gp-b" href="aula.html?per=' + esc(p.id) + '" target="_blank" rel="noopener">' +
          '<span>🎛️</span><b>El aula</b></a>' +
        '<a class="gp-b" href="llamada.html?per=' + esc(p.id) + '" target="_blank" rel="noopener">' +
          '<span>🔔</span><b>Llamada a filas</b></a>' +
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
            'title="Pulsa para verlo (y otra vez para taparlo)" aria-label="Mostrar el código de clase">•••••• <em>👁 Mostrar</em></button></div>' +
          '<button class="btn min" data-copiado="✓ Invitación copiada" data-copiar="' + esc(invitacion(p)) + '" ' +
            'title="Copia un mensaje listo para pegar en el foro de la plataforma de UNIR o en un chat">' +
            '📋 Copiar invitación</button></div>'
        : '') +
      '<div class="gp-pie">' +
        '<button class="gp-abrir" data-per="' + esc(p.id) + '">Ver mi gente y los ajustes →</button>' +
      '</div></article>';
  }


  /** El código para insertar en Genially (Insertar → Otros → Código): llena la caja que le des. */
  function codigoGenially(ruta, titulo) { return MOTOR.codigoGenially(ruta, titulo); }

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
      /**
       * 🔴 15-sep · LOS EMBEDS, UNA SOLA VEZ. Norberto: «en todas las fichas de cada grupo aparece Embed para
       * Genially, pero entiendo que es el mismo para todos: déjalo en algún lugar especificando que es el
       * mismo para todos los grupos». Lo es: ninguno lleva el grupo dentro (piden la cuenta y preguntan).
       */
      '<section class="gp-gen"><div class="gp-gen-txt"><h3>🧩 Para tus Geniallys</h3>' +
        '<p class="small muted">Los <b>mismos para todos tus grupos</b> y para los cursos que vengan: piden tu cuenta y, si llevas varios grupos, ' +
        'preguntan en cuál estáis. Se copia el código y, en Genially, <b>Insertar → Otros → Código</b>.</p></div>' +
        '<div class="gp-gen-b">' +
        [["sesion", "📽️ La sesión de la semana", "sesion.html?embed=1"], ["aula", "🛰️ El aula · la clase en directo", "aula.html?embed=1"],
         ["llamada", "🔔 La llamada a filas", "llamada.html?embed=1"]].map(function (x) {
          return '<button class="btn min" data-embed="' + x[0] + '" data-copiado="✓ Código copiado" data-copiar="' + esc(codigoGenially(x[2], "STARGATE · " + x[1].replace(/^\S+\s/, ""))) + '">' + x[1] + '</button>';
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
      b.onclick = function () { abrir(b.getAttribute("data-per")); };
    });
    Array.prototype.forEach.call(app.querySelectorAll(".gp-cod"), function (b) {
      b.onclick = function () {
        var ver = !b.classList.contains("visto");
        b.classList.toggle("visto", ver);
        b.innerHTML = ver ? esc(b.getAttribute("data-cod")) + ' <em>Tapar</em>' : '•••••• <em>👁 Mostrar</em>';
        b.setAttribute("aria-label", ver ? "Tapar el código de clase" : "Mostrar el código de clase");
      };
    });
    cablearCopiar(app);
    // el titular «Mi puesto de mando» sobra encima de «Tus grupos»: dos titulares enormes seguidos
    document.body.classList.add("consola-dentro");
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
  var TABS = [["alumnado", "Mi gente"], ["canjes", "Cola de nota"], ["zoco", "El Zoco"], ["mios", "Mis enlaces"],
              ["equipo", "Equipo docente", 1], ["escuadrones", "Escuadrones", 1],
              ["huevos", "Premios por enlace", 1], ["sorteos", "Sorteos", 1], ["ofertas", "Ofertas", 1], ["calendario", "Calendario", 1], ["ajustes", "Ajustes del grupo", 1]];
  function misTabs() {
    var ref = refDe(PERS.filter(function (p) { return p.id === PER; })[0]);
    return TABS.filter(function (x) { return !x[2] || ref; });
  }

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
    app.innerHTML =
      '<div class="card cuenta"><p><b>' + esc(t.nombre) + '</b> · ' + esc(t.tipo) +
        ' · ' + semanaTexto(t) + ' · ' + t.reclutas.length + ' reclutas' +
        ' <button class="btn min" id="c-cambiar">← Mis grupos</button> ' + botonBuzon("consola", PER) +
        ' <button class="btn min" id="c-salir">Salir</button></p></div>' +
      '<div class="pestanas">' + misTabs().map(function (x) {
        return '<button class="pest' + (TAB === x[0] ? " activa" : "") + '" data-tab="' + x[0] + '">' + x[1] + "</button>";
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
    // 🔴 Y si el TAB recordado ya no le corresponde —dejó de ser referente, o llega por un enlace
    // con #ajustes— se cae al primero en vez de pintar una pantalla que no debería ver.
    if (!misTabs().some(function (x) { return x[0] === TAB; })) TAB = misTabs()[0][0];
    ({ alumnado: verAlumnado, canjes: verCanjes, zoco: verZoco, mios: verMios, equipo: verEquipo,
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
    alumnado: ["Mi gente", "Tu alumnado con sus xp, créditos e insignias. <b>Pulsa una fila</b>: ves su ficha, los <b>enlaces de sus evidencias</b> y puedes otorgar o anular un reto. El aviso <b>«⚠️ sin enlace»</b> marca los retos registrados sin evidencia."],
    canjes: ["Cola de nota", "Las recompensas que tocan la <b>nota</b> no se aplican solas: esperan aquí a que las apruebes. Los créditos no se mueven hasta entonces."],
    zoco: ["El Zoco", "Los trueques entre tu alumnado (se abren en la semana 5): quién cambia qué con quién y los mensajes que se dejan. Si uno no te cuadra, <b>Deshacer</b> devuelve cada cosa a su dueño."],
    mios: ["Mis enlaces", "Tu panel de Genially, si has hecho una copia propia, y los enlaces del grupo para repartir en clase: la Nave, el tablero para proyectar, la sesión y el padlet."],
    equipo: ["Equipo docente", "Quién imparte y quién lleva el grupo, <b>por su correo de Google</b>. Añadir a alguien aquí es darle entrada; quitarlo, quitársela. No hay PIN."],
    escuadrones: ["Escuadrones", "Cada escuadrón con su Comandante. La llamada a filas y el aula de cada docente van por aquí: cada cual ve y llama a los suyos."],
    huevos: ["Premios por enlace", "Crea un premio —xp, créditos, un sobre de cromos, un héroe— con sus topes (en total, por escuadrón o por persona) y pega su enlace donde quieras. Por ejemplo: «los 5 primeros de cada escuadrón, un sobre»."],
    sorteos: ["Sorteos", "El <b>Gran Sorteo</b> y los que crees tú: tu alumnado compra participaciones, tú las regalas o las escondes en un enlace, y el día señalado lo <b>proyectas</b>. Lo sortea el servidor: una papeleta por participación y nadie gana dos."],
    ofertas: ["Ofertas", "La <b>oferta de la semana</b> sale sola en el Mercado desde la semana 3: un sobre, una cápsula, un héroe o una carta concretos, rebajados y con unidades según los inscritos y la rareza. Aquí la <b>alargas, la cancelas, cambias sus unidades</b> o creas una tú."],
    calendario: ["Calendario", "Las semanas del curso y lo que abre cada una. <b>Congela</b> una semana (Navidad, Semana Santa) y todo lo de detrás se corre; o <b>abre un capítulo antes</b> de su semana. La fecha de la semana 1 también está aquí."],
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
  function verAlumnado(t) {
    var retos = DATOS.misiones.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var caps = capsDelGrupo(t);
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Alumnado</h3>' +
      '<p class="small muted">El nombre y el correo solo los ves tú y el resto del equipo docente. ' +
      'Pulsa una fila para otorgar o anular un reto.</p>' +
      '<table class="tabla"><thead><tr><th>#</th><th>Alias</th><th>Nombre</th><th>Comandante</th>' +
      '<th>xp</th><th>◈</th><th>Insignias</th><th title="Capítulos de NEBULA vistos (de los ya abiertos)">Bienvenida</th></tr></thead><tbody>' +
      t.reclutas.map(function (r, i) {
        return '<tr data-r="' + i + '"' + (r.congelado ? ' class="congelado"' : '') + '><td>' + r.pos + '</td><td><b>' + esc(r.alias) + '</b>' +
          (r.corona ? " 👑" : "") + (r.congelado ? ' <span class="chip" title="Cuenta congelada por el referente">🧊 congelado</span>' : '') + '</td><td>' + esc(r.nombre || "—") + '<br><span class="small muted">' +
          esc(r.email || "") + '</span></td><td>' + esc(r.profe || "—") + '</td><td>' + r.xp +
          '</td><td>' + r.creditos + '</td><td>' + r.n + "/24</td>" + celdaBienvenida(r, caps) + "</tr>";
      }).join("") + "</tbody></table>" +
      (t.sin_docente ? '<p class="aviso">⚠️ ' + t.sin_docente + ' recluta(s) sin Comandante asignado.</p>' : "") +
      "</div><div id='c-ficha'></div>";
    Array.prototype.forEach.call(app.querySelectorAll("[data-r]"), function (fila) {
      fila.onclick = function () { verFicha(t.reclutas[Number(fila.getAttribute("data-r"))], retos); };
    });
    /**
     * 🔴 13-sep · LOS ENLACES DE EVIDENCIA, POR FIN A LA VISTA. El alumnado los guardaba en
     * `mission_deliveries` y NADA de la consola los leía: se pedían enlaces que caían en un pozo. Y
     * la razón de pedirlos —Norberto— es que el docente pueda verlos, comprobarlos y «mostrar o
     * alabar el trabajo de un estudiante en clase». Una consulta por grupo; al lado de quien tenga
     * retos de evidencia obligatoria SIN enlace, un aviso: así se ve de un vistazo a quien marca
     * retos sin hacerlos.
     */
    // 🔴 Un turno por pintada: la lista se repinta (al refrescar, al volver de una ficha) y cada
    // consulta en vuelo añadía SU aviso a las filas nuevas — salían «⚠️ 8 sin enlace» dos veces.
    var turno = ++TURNO_EVID;
    EVID = null;
    EVID_LISTO = MOTOR.getDocs(MOTOR.query(MOTOR.collection(MOTOR.db, "mission_deliveries"), MOTOR.where("projectId", "==", PER)))
      .then(function (r) {
        if (turno !== TURNO_EVID) return;
        EVID = {};
        r.docs.forEach(function (d) { var x = d.data(); (EVID[x.studentProfileId] = EVID[x.studentProfileId] || {})[x.stargateReto || String(x.missionId).split("__").pop()] = x.enlace || ""; });
        var EVR = window.SG_EVIDENCIA || {};
        t.reclutas.forEach(function (rc, i) {
          var mias = EVID[rc.ficha] || {};
          var faltan = Object.keys(rc.retos || {}).filter(function (id) { return EVR[id] === "obligatoria" && !mias[id]; });
          if (!faltan.length) return;
          var celda = app.querySelector('[data-r="' + i + '"] td:nth-child(2)');
          if (celda && !celda.querySelector(".sin-evid")) celda.insertAdjacentHTML("beforeend", ' <span class="sin-evid" title="Retos que piden enlace y no lo tienen: ' +
            esc(faltan.join(", ")) + '">⚠️ ' + faltan.length + ' sin enlace</span>');
        });
      }).catch(function () { EVID = {}; });
  }
  var EVID = null, EVID_LISTO = null, TURNO_EVID = 0;

  /** Sus retos registrados, cada uno con su enlace (o el aviso si le falta uno obligatorio). */
  function evidenciasDe(r) {
    var mias = (EVID && EVID[r.ficha]) || {}, EVR = window.SG_EVIDENCIA || {};
    // solo lo que entrega el recluta (A, B, X, S): los hitos (H…) se completan solos y no son entregas
    var ids = Object.keys(r.retos || {}).filter(function (id) { return /^[ABXS]\d/.test(id); }).sort();
    if (!ids.length) return '<p class="small muted">Todavía no ha registrado ningún reto.</p>';
    if (!EVID) return '<p class="small muted">Buscando sus enlaces…</p>';
    return '<ul class="evid-lista">' + ids.map(function (id) {
      var e = mias[id], ob = EVR[id] === "obligatoria";
      // (15-sep · pueden ser dos, separados por un espacio: el segundo es el del «+»)
      return '<li><b>' + esc(id) + '</b> ' + (e
        ? String(e).trim().split(/\s+/).map(function (u) {
            var url = /^https?:\/\//i.test(u) ? u : "https://" + u;
            return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">🔗 ' + esc(u.replace(/^https?:\/\//i, "").slice(0, 60)) + '</a>'; }).join(" ")
        : (ob ? '<span class="sin-evid">⚠️ sin enlace, y este reto lo pide</span>' : '<span class="small muted">sin enlace</span>')) + '</li>';
    }).join("") + '</ul>';
  }

  function verFicha(r, retos) {
    var ficha = r.ficha;
    var esRef = refDe(PERS.filter(function (p) { return p.id === PER; })[0]);
    $("#c-ficha").innerHTML = '<div class="card"><h3>' + esc(r.alias) + ' · ' + esc(r.nombre || "") + "</h3>" +
      '<p class="small">' + r.xp + ' xp · ' + r.creditos + ' ◈ · nivel ' + r.nivel + " " + esc(r.rango_nombre) +
      ' · racha ' + r.racha + " semanas</p>" +
      '<div class="retos-ficha">' + retos.map(function (m) {
        var tiene = !!(r.retos || {})[m.id];
        return '<button class="reto' + (tiene ? " hecho" : "") + '" data-reto="' + esc(m.id) + '" ' +
               'data-ficha="' + esc(ficha) + '" data-tiene="' + (tiene ? 1 : 0) + '" title="' +
               esc(m.title) + '">' + esc(m.id) + (tiene ? " ✓" : "") + "</button>";
      }).join("") + "</div>" +
      '<p class="small muted">Verde = registrado. Púlsalo para otorgar o anular. Todo queda anotado ' +
      'en el libro de experiencia, con quién y cuándo.</p>' +
      '<div class="evid-ficha"><h4>Lo que ha entregado</h4><div id="c-evid">' + evidenciasDe(r) + '</div></div>' +
      // 🔴 DAR DE BAJA. Hace falta y no es capricho: alguien se alista en el grupo equivocado,
      // alguien entra con la cuenta que no era y deja una ficha huérfana, o se cuela quien no debía.
      // Sin esto, la única salida era dejarlo ahí para siempre ensuciando el ranking.
      // 14-sep · Y CONGELAR. Las dos, solo el referente (Norberto: «el referente tiene poder de
      // eliminar o congelar: puede acceder, pero no puede hacer nada, bloqueado»).
      (esRef ? '<div class="ficha-ref"><h4>Solo el referente</h4>' +
        (r.congelado ? '<p class="small"><b>🧊 Cuenta congelada</b>' + (r.congelado.fecha ? ' desde el ' + diaDe(r.congelado.fecha) : '') +
          ': entra y mira su Nave, pero no puede hacer nada.</p>' : '') +
        '<p><button class="btn min" id="c-congelar">' + (r.congelado ? '▶️ Descongelar a ' : '🧊 Congelar a ') + esc(r.alias) + '</button> ' +
        '<span class="small muted">' + (r.congelado ? 'vuelve a poder hacer de todo.' : 'podrá entrar y mirar, pero no registrar retos, comprar, fichar ni usar el Zoco.') + '</span></p>' +
        '<p><button class="btn min peligro" id="c-baja">Dar de baja a ' + esc(r.alias) + '</button> ' +
        '<span class="small muted">borra su ficha del grupo. Podrá alistarse otra vez, aquí o en otro, ' +
        'empezando de cero.</span></p></div>' : '') + '</div>';
    // si la ficha se abrió antes de que llegaran los enlaces, se rellena en cuanto lleguen
    if (!EVID && EVID_LISTO) EVID_LISTO.then(function () { var h = $("#c-evid"); if (h) h.innerHTML = evidenciasDe(r); });
    var cong = $("#c-congelar");
    if (cong) cong.onclick = async function () {
      var ya = !!r.congelado;
      if (!ya && !confirm("¿Congelar la cuenta de «" + r.alias + "»?\n\nPodrá entrar y mirar su Nave, pero no hacer nada: ni registrar " +
                          "retos, ni comprar, ni fichar, ni el Zoco. Lo que tenga en el Zoco se retira (y cada oferta devuelve lo suyo).\n\n" +
                          "Se descongela con un clic, cuando quieras.")) return;
      cong.disabled = true;
      try {
        await MOTOR.alumno(PER, ficha, ya ? "descongelar" : "congelar"); await refrescar(); $("#c-ficha").innerHTML = "";
        aviso(ya ? "▶️ " + r.alias + " ya puede volver a hacer de todo." : "🧊 " + r.alias + " está congelado: mira, pero no toca.", true);
      } catch (e) {
        cong.disabled = false;
        aviso(/not-found|internal/.test(String(e && e.code)) && !/[áéíóú]/.test(String(e && e.message))
          ? "Falta desplegar en el servidor la función «stargateAlumno» (el comando está en el traspaso)." : e.message);
      }
    };
    var baja = $("#c-baja");
    if (baja) baja.onclick = async function () {
      // Dos confirmaciones a propósito: esto borra de verdad y no hay deshacer. La segunda pide
      // escribir el alias, que es lo único que impide un clic distraído sobre la persona equivocada.
      if (!confirm("Vas a dar de baja a «" + r.alias + "» de este grupo.\n\n" +
                   "Se borra su ficha: alias, personaje, retos, insignias y cartas. El rastro de lo " +
                   "que se le dio y se le quitó SÍ se conserva en el libro de experiencia.\n\n" +
                   "No hay deshacer. ¿Seguimos?")) return;
      var escrito = prompt("Para confirmar, escribe su alias exactamente:\n\n" + r.alias);
      if (String(escrito || "").trim() !== r.alias) { aviso("No coincide: no se ha dado de baja a nadie."); return; }
      baja.disabled = true;
      try { await MOTOR.darDeBaja(PER, ficha); await refrescar(); $("#c-ficha").innerHTML = "";
            aviso(r.alias + " ya no está en el grupo.", true); }
      catch (e) { baja.disabled = false; aviso(e.message); }
    };
    Array.prototype.forEach.call(app.querySelectorAll("[data-reto]"), function (b) {
      b.onclick = async function () {
        var id = b.getAttribute("data-reto"), f = b.getAttribute("data-ficha"), tiene = b.getAttribute("data-tiene") === "1";
        if (tiene && !confirm("¿Anular el reto " + id + " a " + r.alias + "?\n\nSe le descontarán los xp y los créditos que dio.")) return;
        b.disabled = true;
        try {
          var res = tiene ? await MOTOR.anularReto(PER, f, id, "desde la consola")
                          : await MOTOR.otorgarReto(PER, f, id);
          await refrescar();
          /**
           * 🔴 Si ya se había gastado lo que le dio el reto, se le dice al docente, con la cifra. El
           * saldo no baja de cero, así que un recluta que marca retos sin hacerlos y se lo gasta
           * todo conserva lo comprado aunque le anules: sin este aviso, el docente creería que lo ha
           * deshecho del todo. La xp sí se retira entera —el ranking y el nivel quedan limpios— y la
           * nota nunca estuvo en juego: las subidas de nota esperan tu visto bueno en la cola.
           */
          var falta = res && Number(res.noRetirados || 0);
          aviso((tiene ? "Anulado " : "Otorgado ") + id + " a " + r.alias +
                (falta ? " · ya se había gastado " + falta + " ◈ de este reto: no se le han podido retirar." : ""), !falta);
        } catch (e) { b.disabled = false; aviso(e.message); }
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
        enlaceFila("🧭", "Alistarse (con el código)", t.alta || "") +
        enlaceFila("🚀", "La Nave del alumnado", "recluta.html?per=" + encodeURIComponent(PER)) +
        enlaceFila("🏅", "El tablero, para proyectar", "registro.html?per=" + encodeURIComponent(PER) + "&solo=1") +
        enlaceFila("📽️", "La sesión de esta semana", "sesion.html?per=" + encodeURIComponent(PER)) +
        // 13-sep · la Nave con tu Comandante de recluta, para ensayar (o enseñarla fuera de la sesión): no guarda nada
        enlaceFila("🛰️", "Tu Nave de Comandante (simulacro)", "recluta.html?simulacro=1&per=" + encodeURIComponent(PER)) +
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
  function enlaceFila(ico, tit, url) {
    if (!url) return '<div class="m-fila vacia"><span>' + ico + '</span><b>' + esc(tit) + '</b>' +
                     '<em>sin configurar</em></div>';
    return '<div class="m-fila"><span>' + ico + '</span><b>' + esc(tit) + '</b>' +
      '<a href="' + esc(url) + '" target="_blank" rel="noopener">Abrir ↗</a>' +
      '<button class="btn min" data-copiar="' + esc(url) + '">Copiar</button></div>';
  }

  // ---------------------------------------------------------------- escondites
  var PREMIOS = [["sobre","🃏 Un sobre de cromos (3 cartas)"],
                 ["heroe_fijo","🛡️ Un héroe que eliges tú"],
                 ["heroe","🎲 Un héroe al azar"],
                 ["bolsa","💰 Créditos"],
                 ["xp","⚡ Experiencia (xp)"],
                 ["participaciones","🎟️ Participaciones del sorteo"],
                 // 14-sep · los sobres y las cápsulas nuevos: la legendaria, escondida en una presentación
                 ["capsula_legendaria","🟨 Una cápsula legendaria (un Mito seguro)"],
                 ["capsula_elite","🟪 Una cápsula de élite"],
                 ["sobre_epico","✨ Un sobre épico (3 cartas, sin comunes)"],
                 ["sobre_raro","💎 Un sobre de raras"],
                 ["sobre_grande","🃏 Un sobre grande (5 cartas)"]];
  // 15-sep · las cápsulas y los sobres nuevos, solo si el grupo los tiene en su tienda (los grupos de
  // antes del 14-sep no): si no, el enlace daba en silencio un sobre normal de tres cartas. El que ya
  // estuviera elegido se queda en la lista, para no cambiar un premio guardado sin decirlo.
  function premiosDelGrupo(elegido) {
    var hay = {}; ((DATOS && DATOS.recompensas) || []).forEach(function (r) { hay[r.stargateTipo] = true; });
    return PREMIOS.filter(function (p) { return !/^(capsula_|sobre_)/.test(p[0]) || hay[p[0]] || p[0] === elegido; });
  }
  // 14-sep · los sorteos del grupo que aún no se han hecho (para regalar participaciones por enlace)
  function sorteosAbiertos() {
    return ((DATOS && DATOS.recompensas) || []).filter(function (r) { return r.systemEffect === "lottery_ticket" && !r.isRaffleCompleted; });
  }
  function heroesDelCatalogo() { return ((window.SG_CATALOGO || {}).heroes) || []; }
  function rarezaBonita(r) { r = String(r || "").toLowerCase(); return r ? r.charAt(0).toUpperCase() + r.slice(1) : ""; }
  // «datetime-local» habla en la hora de quien lo rellena; se guarda como instante (ms)
  function aLocal(ms) { if (!ms) return ""; var d = new Date(Number(ms)); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); }
  function deLocal(v) { if (!v) return 0; var t = new Date(v).getTime(); return isNaN(t) ? 0 : t; }
  /**
   * LOS PREMIOS POR ENLACE, uno por presentación… o por reto de clase.
   *
   * 🔴 El límite va en el ESCONDITE, no en el premio. Norberto preguntó si hacía falta «una
   * recompensa por presentación limitada a 1 por persona», o una semanal —con el riesgo de que
   * alguien reclame la misma cada semana sin encontrar el resto—. Las dos atan el límite al premio,
   * y lo que hay que contar no es cuántos premios se lleva alguien: es cuántos escondites DISTINTOS
   * ha encontrado. Con el id en el enlace y una marca en su ficha, repetir es imposible y el mismo
   * premio se puede usar en los ocho.
   *
   * 🔴 13-sep · Y AHORA TAMBIÉN «UN HÉROE QUE ELIGES TÚ», CON FECHAS. Norberto: «lanzo un reto en clase
   * y al superarlo les lleva a una página donde está el héroe conseguido, que se suma a su colección;
   * con un botón de activo/desactivado, el tiempo que está abierto y cuántos pueden reclamarlo». El
   * interruptor guarda al momento —es lo que se pulsa en clase, con prisa—; las fechas las hace
   * cumplir el servidor.
   */
  function verHuevos(t) {
    var H = ((DATOS.proyecto || {}).stargate || {}).huevos || [];
    $("#c-cuerpo").innerHTML =
      '<div class="card"><h3>Premios por enlace</h3>' +
      '<p class="small muted">Un enlace que da un premio a quien lo pulse. Escóndelo en un rincón del ' +
      'Genially como <b>huevo de Pascua</b>, o úsalo de <b>meta de un reto de clase</b>: quien lo supera, ' +
      'llega a la página y se lleva el héroe que hayas elegido. Quien lo pulse sin haber entrado verá la ' +
      'puerta de Google ahí mismo. <b>Cada persona solo puede reclamarlo una vez</b>, aunque el enlace ' +
      'circule. Puedes ponerle <b>fechas</b> (abierto solo durante la clase), un <b>tope</b> («los tres ' +
      'primeros») y pausarlo con su interruptor.</p>' +
      '<div id="hv-lista" class="hv-lista">' + (H.length ? H.map(filaHuevo).join("") :
        '<p class="small muted">Todavía no hay ninguno.</p>') + '</div>' +
      '<p class="hv-botones"><button class="btn" id="hv-add">+ Añadir un premio</button> ' +
      '<button class="btn primary" id="hv-save">Guardar</button></p></div>';
    cablearHuevos(H);
  }
  /**
   * 🔴 13-sep · UN PREMIO, TRES LÍNEAS QUE SE LEEN: qué es (enlace, nombre, premio y su detalle),
   * cuándo y cuántos (interruptor, fechas, topes y cómo está ahora mismo) y el enlace con sus botones.
   * El hueco del detalle cambia con el premio —cantidad, el héroe con su cara, o qué trae un sobre—
   * para que no quede ninguna caja vacía.
   */
  function filaHuevo(h, i) {
    var lim = Number(h.limite) || 0, esc_ = Number(h.porEscuadron) || 0, pr = h.premio || "sobre";
    var hs = heroesDelCatalogo(), heroe = h.heroe || (hs[0] && hs[0].clave) || "";
    var url = location.origin + "/huevo.html?h=" + (h.id || "") + "&embed=1";
    var insertar = '<iframe src="' + url + '" width="100%" height="620" style="border:0;border-radius:16px" allow="clipboard-write" title="Premio de STARGATE"></iframe>';
    return '<div class="hv-f" data-i="' + i + '"><div class="hv-l1">' +
      '<label class="h-campo h-c-id">Enlace<input class="h-id" value="' + esc(h.id || "") + '" placeholder="p1" maxlength="12" title="Identificador: va en el enlace"></label>' +
      '<label class="h-campo h-c-nom">Nombre<input class="h-nom" value="' + esc(h.nombre || "") + '" placeholder="Presentación del Tema 1 · Reto del lunes"></label>' +
      '<label class="h-campo h-c-premio">Premio<select class="h-premio">' + premiosDelGrupo(pr).map(function (p) {
        return '<option value="' + p[0] + '"' + (pr === p[0] ? " selected" : "") + ">" + p[1] + "</option>"; }).join("") + '</select></label>' +
      '<div class="h-extra">' +
        // la cantidad solo cuenta para créditos, xp y participaciones: un sobre son siempre tres cartas y un héroe, uno
        '<label class="h-campo h-cant"' + (pr === "bolsa" || pr === "xp" || pr === "participaciones" ? "" : " hidden") + '>Cantidad' +
          '<input class="h-cantidad" type="number" min="1" value="' + (Number(h.cantidad || h.creditos) || (pr === "xp" ? 100 : pr === "participaciones" ? 1 : 50)) + '"></label>' +
        '<label class="h-campo h-c-sorteo"' + (pr === "participaciones" ? "" : " hidden") + '>Del sorteo<select class="h-sorteo">' +
          (sorteosAbiertos().length ? sorteosAbiertos().map(function (r) {
            return '<option value="' + esc(r.docId) + '"' + (h.sorteo === r.docId ? " selected" : "") + ">" + esc(((r.stargateSorteo || {}).premio) || r.title) + "</option>"; }).join("")
            : '<option value="">— no hay ningún sorteo abierto —</option>') + '</select></label>' +
        // la cara, a la izquierda y a la altura de «etiqueta + campo»: así las etiquetas de la fila no se descuadran
        '<div class="h-c-heroe"' + (pr === "heroe_fijo" ? "" : " hidden") + '>' +
          '<img class="h-heroe-img" src="assets/img/heroes/' + esc(heroe) + '.jpg" alt="" width="58" height="58">' +
          '<label class="h-campo">Héroe<select class="h-heroe">' + hs.map(function (x) {
            return '<option value="' + esc(x.clave) + '"' + (x.clave === heroe ? " selected" : "") + ">" + esc(x.nombre) + " · " + esc(rarezaBonita(x.rareza)) + "</option>"; }).join("") +
          '</select></label></div>' +
        '<p class="h-nota"' + (pr === "sobre" || pr === "heroe" ? "" : " hidden") + '>' +
          (pr === "heroe" ? "Uno de los " + (hs.length || 30) + " héroes, con las mismas probabilidades que en el Mercado" : "Tres cartas al azar del álbum, como un sobre del Mercado") + '</p>' +
      '</div>' +
      '<button class="btn min h-del" title="Quitar este premio" aria-label="Quitar este premio">✕</button>' +
      '</div><div class="hv-l3">' +
      '<label class="h-sw" title="Encendido: se puede reclamar (dentro de sus fechas). Se guarda al momento.">' +
        '<input type="checkbox" class="h-on"' + (h.activo === false ? "" : " checked") + '><i></i>' +
        '<span class="h-sw-si">Activo</span><span class="h-sw-no">En pausa</span></label>' +
      '<label class="h-campo h-fecha">Abierto desde<input class="h-desde" type="datetime-local" value="' + aLocal(h.desde) + '" title="Vacío = ya"></label>' +
      '<label class="h-campo h-fecha">Hasta<input class="h-hasta" type="datetime-local" value="' + aLocal(h.hasta) + '" title="Vacío = sin fecha de cierre"></label>' +
      /**
       * 🔴 LOS TRES LÍMITES QUE PIDIÓ NORBERTO —«global, por grupo, ilimitado, máximo uno por
       * persona»—, y con NOMBRE. Uno por persona va siempre (es un escondite: se encuentra una vez).
       * Los lleva el servidor (`claimLinkedReward`), dentro de una transacción. Vacío = sin tope.
       */
      '<label class="h-campo h-num">Tope total<input class="h-lim" type="number" min="0" value="' + (lim || "") + '" placeholder="sin tope" title="Vacío = sin tope; 5 = solo los cinco primeros de todo el grupo"></label>' +
      '<label class="h-campo h-num">Por escuadrón<input class="h-esc" type="number" min="0" value="' + (esc_ || "") + '" placeholder="sin tope" title="Vacío = sin tope; 2 = los dos primeros de CADA escuadrón"></label>' +
      '<p class="h-estado" aria-live="polite">' + esc(textoEstado(h, null)) + '</p>' +
      '</div><div class="hv-l2">' +
      '<code class="h-url">' + esc(url) + '</code>' +
      '<button class="btn min" data-copiar="' + esc(url) + '">📋 Copiar enlace</button>' +
      '<button class="btn min" data-copiado="✓ Código copiado" data-copiar="' + esc(insertar) + '" title="Para Genially: Insertar → Otros → Código">&lt;/&gt; Copiar para insertar</button>' +
      '<a class="btn min" target="_blank" rel="noopener" href="huevo.html?h=' + esc(h.id || "") + '&per=' + esc(PER) + '&vista=1" title="Así lo verá tu alumnado (sin reclamarlo)">👁 Ver cómo se ve</a>' +
      '</div></div>';
  }
  /** Cómo está AHORA: con lo que hay en pantalla (aunque no esté guardado) y lo que dice el servidor. */
  function textoEstado(h, R) {
    var ahora = Date.now(), cuando = MOTOR && MOTOR.cuandoEs ? MOTOR.cuandoEs : function (ms) { return new Date(ms).toLocaleString("es-ES"); };
    var n = R ? Number(R.claimLinkTotalClaimed) || 0 : null, tope = Number(h.limite) || 0;
    var cuantos = n == null ? "" : n ? " · 🙋 " + n + (n === 1 ? " lo ha reclamado" : " lo han reclamado") : " · nadie lo ha reclamado aún";
    if (h.activo === false) return "⏸ En pausa: nadie puede reclamarlo" + cuantos;
    if (Number(h.desde) && ahora < Number(h.desde)) return "⏳ Se abre " + cuando(Number(h.desde)) + cuantos;
    if (Number(h.hasta) && ahora > Number(h.hasta)) return "🔒 Se cerró " + cuando(Number(h.hasta)) + cuantos;
    if (tope && n != null && n >= tope) return "🏁 Agotado: " + n + " de " + tope;
    return "🟢 Abierto" + (Number(h.hasta) ? " hasta " + cuando(Number(h.hasta)) : " ahora") + cuantos;
  }
  function cablearHuevos(H) {
    var lista = H.slice(), servidor = {};
    var repintar = function () {
      $("#hv-lista").innerHTML = lista.length ? lista.map(filaHuevo).join("")
        : '<p class="small muted">Todavía no hay ninguno.</p>';
      cablearFilas();
    };
    var pendiente = function (si) { var b = $("#hv-save"); if (b) { b.classList.toggle("pendiente", !!si); b.textContent = si ? "Guardar cambios" : "Guardar"; } };
    // lo que dice el servidor de cada uno: cuántos lo han reclamado ya
    lista.forEach(function (h) {
      if (!h.id || !MOTOR.estadoHuevo) return;
      MOTOR.estadoHuevo(PER, h.id).then(function (e) {
        servidor[h.id] = e.R;
        var i = lista.indexOf(h), f = i < 0 ? null : $('#hv-lista .hv-f[data-i="' + i + '"]');
        if (f) $(".h-estado", f).textContent = textoEstado(lista[i], e.R);
      }).catch(function () {});
    });
    var validar = function () {
      if (lista.some(function (h) { return !h.id; })) return "Cada premio necesita un identificador (va en el enlace).";
      var ids = lista.map(function (h) { return h.id; });
      if (new Set(ids).size !== ids.length) return "Hay dos premios con el mismo identificador.";
      if (lista.some(function (h) { return h.premio === "heroe_fijo" && !h.heroe; })) return "Elige qué héroe se lleva.";
      if (lista.some(function (h) { return h.premio === "participaciones" && !h.sorteo; })) return "Elige de qué sorteo son las participaciones (o crea uno en «Sorteos»).";
      if (lista.some(function (h) { return h.premio === "participaciones" && (Number(h.cantidad) < 1 || Number(h.cantidad) > 10); })) return "De 1 a 10 participaciones por enlace.";
      if (lista.some(function (h) { return Number(h.desde) && Number(h.hasta) && Number(h.hasta) <= Number(h.desde); }))
        return "La fecha de «Hasta» tiene que ser después de «Abierto desde».";
      return "";
    };
    var guardar = async function (texto) {
      var malo = validar(); if (malo) { aviso(malo); return false; }
      $("#hv-save").disabled = true;
      try { await MOTOR.guardarHuevos(PER, lista); await refrescar(); aviso(texto || "Guardado.", true); return true; }
      catch (e) { $("#hv-save").disabled = false; aviso(e.message); return false; }
    };
    var cablearFilas = function () {
      Array.prototype.forEach.call($("#hv-lista").querySelectorAll(".hv-f"), function (f) {
        var i = Number(f.getAttribute("data-i"));
        var leer = function () {
          var premio = $(".h-premio", f).value, cant = Number($(".h-cantidad", f).value) || 0;
          lista[i] = { id: $(".h-id", f).value.trim(), nombre: $(".h-nom", f).value.trim(),
                       premio: premio, heroe: premio === "heroe_fijo" ? $(".h-heroe", f).value : "",
                       sorteo: premio === "participaciones" ? $(".h-sorteo", f).value : "",
                       limite: Number($(".h-lim", f).value) || 0,
                       porEscuadron: Number($(".h-esc", f).value) || 0,
                       cantidad: cant || (premio === "xp" ? 100 : premio === "participaciones" ? 1 : 50), creditos: cant || 50,
                       desde: deLocal($(".h-desde", f).value), hasta: deLocal($(".h-hasta", f).value),
                       activo: $(".h-on", f).checked };
          // el hueco del detalle cambia con el premio
          $(".h-cant", f).hidden = !(premio === "bolsa" || premio === "xp" || premio === "participaciones");
          $(".h-c-sorteo", f).hidden = premio !== "participaciones";
          $(".h-c-heroe", f).hidden = premio !== "heroe_fijo";
          var nota = $(".h-nota", f); nota.hidden = !(premio === "sobre" || premio === "heroe");
          nota.textContent = premio === "heroe" ? "Uno de los " + (heroesDelCatalogo().length || 30) + " héroes, con las mismas probabilidades que en el Mercado"
                                                : "Tres cartas al azar del álbum, como un sobre del Mercado";
          $(".h-heroe-img", f).src = "assets/img/heroes/" + $(".h-heroe", f).value + ".jpg";
          $(".h-estado", f).textContent = textoEstado(lista[i], servidor[lista[i].id] || null);
        };
        ["h-id","h-nom","h-premio","h-heroe","h-sorteo","h-cantidad","h-lim","h-esc","h-desde","h-hasta"].forEach(function (k) {
          var e = $("." + k, f); e.oninput = e.onchange = function () { leer(); pendiente(true); };
        });
        // 🔴 el interruptor GUARDA AL MOMENTO: es lo que se pulsa en clase, con el reto recién superado
        $(".h-on", f).onchange = async function () {
          leer();
          var ok = await guardar(lista[i].activo ? "Activo: ya se puede reclamar" + (Number(lista[i].desde) > Date.now() ? " (cuando llegue la fecha)" : "") + "."
                                                 : "En pausa: nadie puede reclamarlo hasta que lo actives.");
          if (!ok) { this.checked = !this.checked; leer(); }
        };
        $(".h-del", f).onclick = function () { lista.splice(i, 1); repintar(); pendiente(true); };
      });
      // los «Copiar» de cada premio los atiende el oyente delegado de `app` (cablearCopiar)
    };
    cablearFilas();
    $("#hv-add").onclick = function () {
      // 🔴 Un identificador que no se adivina. Con «p1, p2…», quien encuentra el primero solo tiene
      // que cambiar el número del enlace para llevarse todos sin buscar ninguno.
      var azar = Math.random().toString(36).slice(2, 7);
      lista.push({ id: "e" + (lista.length + 1) + "-" + azar, nombre: "", premio: "sobre", limite: 0, porEscuadron: 0, activo: true, creditos: 50 });
      repintar(); pendiente(true);
      var ult = $("#hv-lista").lastElementChild; if (ult && ult.scrollIntoView) ult.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    $("#hv-save").onclick = function () { guardar(); };
  }

  // ---------------------------------------------------------------- el zoco
  /**
   * 🔴 13-sep · EL REGISTRO DEL ZOCO. Cada trueque entre reclutas, con lo que se dio, lo que se pidió y
   * sus mensajes (Norberto: «un mensaje corto… que ve también el docente»). Un docente puede
   * deshacer un trueque cerrado: lo hace el servidor, y si algo ya no se puede devolver, lo dice.
   */
  var NOM_ESTADO = { abierto: "⏳ En marcha", aceptado: "✅ Cambiado", rechazado: "✖️ Rechazado", retirado: "↩️ Retirado",
    caducado: "⌛ Caducado", anulado: "🚫 Anulado", vendido: "💰 Se lo quedó otro", deshecho: "↺ Deshecho" };
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
        '<p class="small muted">Los trueques entre tu alumnado: ' + lista.length + ' tratos, ' + cerrados + ' cerrados. ' +
        'Se abre en la <b>semana 5</b>. Lo que se ofrece queda apartado hasta que responden; cada trato, 3 pasos como mucho.</p>' +
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
        b.onclick = function () {
          // todo o nada: solo se deshace si cada uno conserva lo que recibió (si no, se crearía algo de la nada)
          if (!confirm("¿Deshacer este trueque? Cada cosa vuelve a su dueño. Solo se puede si los dos conservan lo que recibieron.")) return;
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
  function verEquipo(t) {
    var docs = t.docentes_full || [];
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Equipo docente</h3>' +
      '<table class="tabla"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Escuadrón</th><th>Reclutas</th></tr></thead><tbody>' +
      docs.map(function (d) {
        var esc_ = (DATOS.proyecto.factions || []).filter(function (f) { return f.teacherName === d.nombre; })[0];
        var n = t.reclutas.filter(function (r) { return r.profe === d.nombre; }).length;
        var emb = esc_ && esc_.imageUrl
          ? '<img class="emb-mini" src="' + esc(esc_.imageUrl) + '" alt="" width="28" height="28"> ' : "";
        return "<tr><td><b>" + esc(d.nombre) + "</b></td><td>" + esc(d.correo || "—") + "</td><td>" +
          esc(d.rol || "docente") + '</td><td class="celda-esc">' + emb + esc(esc_ ? esc_.name : "—") +
          "</td><td>" + n + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      '<div class="card"><h3>Pasar el alumnado de un docente a otro</h3>' +
      // Pasa de verdad: alguien se va a mitad de curso y sus doscientos reclutas se quedan sin
      // Comandante. A mano son doscientas fichas.
      '<p class="small muted">Se cambia el Comandante y el escuadrón de todo su alumnado de una vez.</p>' +
      '<label>De<select id="t-de">' + docs.map(function (d) { return "<option>" + esc(d.nombre) + "</option>"; }).join("") + "</select></label>" +
      '<label>A<select id="t-a">' + docs.map(function (d) { return "<option>" + esc(d.nombre) + "</option>"; }).join("") + "</select></label>" +
      '<p><button class="btn" id="t-ir">Pasar el alumnado</button></p></div>' +
      /**
       * 🔴 AÑADIR A ALGUIEN, que hasta hoy no se podía. El equipo se fijaba al CREAR el grupo y
       * después era de solo lectura: un docente que se incorpora a mitad de curso o un co-referente
       * obligaban a volver a sembrar el grupo entero.
       */
      '<div class="card"><h3>Añadir a alguien al equipo</h3>' +
      '<p class="small muted">El correo tiene que ser <b>el de su cuenta de Google</b>: es con el que ' +
      'entrará, y es lo que el servidor mira para dejarle pasar.</p>' +
      '<label>Nombre<input id="e-nom" placeholder="Cómo aparece ante su clase" autocomplete="off"></label>' +
      '<label>Correo<input id="e-mail" type="email" placeholder="nombre@ejemplo.com" autocomplete="off"></label>' +
      '<label>Rol<select id="e-rol"><option value="docente">Docente (imparte)</option>' +
        '<option value="referente">Referente (lleva el grupo)</option></select></label>' +
      '<p><button class="btn" id="e-add">Añadir a este grupo</button> ' +
      '<button class="btn min" id="e-todos">Hacerle referente de TODOS mis grupos</button></p>' +
      '<p class="small muted">Añadirle aquí no le da escuadrón ni alumnado: eso se reparte arriba, ' +
      'con «pasar el alumnado».</p></div>';

    // --- añadir a este grupo
    $("#e-add").onclick = async function () {
      var persona = { nombre: $("#e-nom").value, correo: $("#e-mail").value, rol: $("#e-rol").value };
      if (!persona.correo.trim()) return aviso("Escribe su correo.");
      $("#e-add").disabled = true;
      try { var r = await MOTOR.anadirDocente(PER, persona); await refrescar();
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
      if (!confirm("Vas a hacer a «" + (persona.nombre || persona.correo) + "» referente de tus " +
                   ids.length + " grupo(s).\n\nVerá el alumnado, los correos y los ajustes de todos.")) return;
      $("#e-todos").disabled = true;
      try {
        var r = await MOTOR.referenteEnTodos(persona, ids);
        await refrescar();
        // Se dice en cuántos ha entrado Y en cuántos no: creer que alguien tiene acceso a ocho
        // grupos cuando lo tiene a seis es peor que el fallo original.
        aviso(r.fallos.length
          ? "Añadido en " + r.hechos.length + " grupo(s). NO se ha podido en " + r.fallos.length +
            ": " + r.fallos.map(function (f) { return f.per; }).join(", ")
          : "Ya es referente de tus " + r.hechos.length + " grupo(s).", !r.fallos.length);
      } catch (e) { aviso(e.message); }
      $("#e-todos").disabled = false;
    };

    $("#t-ir").onclick = async function () {
      var de = $("#t-de").value, a = $("#t-a").value;
      if (de === a) return aviso("Son el mismo docente.");
      if (!confirm("¿Pasar todo el alumnado de " + de + " a " + a + "?")) return;
      try { var n = await MOTOR.traspasar(PER, de, a); await refrescar(); aviso(n + " reclutas pasados a " + a, true); }
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
   */
  function verEscuadrones(t) {
    var esc7 = (t.escuadrones || []);
    if (!esc7.length) {
      $("#c-cuerpo").innerHTML = '<div class="card"><h3>Escuadrones</h3>' +
        '<p class="small muted">Este grupo se sembró sin escuadrones. Se crean al crear el grupo, ' +
        'uno por docente del equipo.</p></div>';
      return;
    }
    var conGente = esc7.map(function (e) {
      var suyos = (t.reclutas || []).filter(function (r) { return r.profe === e.comandante; });
      var media = suyos.length ? Math.round(suyos.reduce(function (a, r) { return a + r.xp; }, 0) / suyos.length) : 0;
      return { e: e, suyos: suyos, media: media };
    }).sort(function (a, b) { return b.media - a.media; });
    var huerfanos = (t.reclutas || []).filter(function (r) {
      return !esc7.some(function (e) { return e.comandante === r.profe; });
    });
    $("#c-cuerpo").innerHTML = '<div class="card"><h3>Escuadrones</h3>' +
      '<p class="small muted">Uno por docente. El alumnado entra en el de su Comandante al alistarse. ' +
      'Se comparan por <b>media de xp</b>: sumando ganaría siempre el más numeroso.</p>' +
      conGente.map(function (x, i) {
        return '<div class="esc-card' + (i === 0 && x.suyos.length ? " lider" : "") + '">' +
          '<div class="esc-pos">' + (i + 1) + "</div>" +
          (x.e.emblema ? '<img class="esc-emb" loading="lazy" src="' + esc(x.e.emblema) + '" alt="">' : "") +
          '<div class="esc-txt"><b>' + esc(x.e.nombre) + "</b>" +
          (x.e.lema ? "<em>«" + esc(x.e.lema) + "»</em>" : "") +
          '<span class="small muted">' + esc(x.e.comandante) + " · " + x.suyos.length +
          " recluta" + (x.suyos.length === 1 ? "" : "s") +
          (x.e.origen ? " · " + esc(x.e.origen) : "") + "</span></div>" +
          '<div class="esc-val">' + x.media + " xp</div></div>";
      }).join("") +
      (huerfanos.length
        ? '<p class="small" style="margin-top:14px;color:var(--amber)">⚠️ <b>' + huerfanos.length +
          "</b> recluta" + (huerfanos.length === 1 ? "" : "s") + " sin escuadrón: su Comandante ya no " +
          "está en el equipo. Pásalos a otro docente desde la pestaña <b>Equipo docente</b>.</p>"
        : "") +
      "</div>";
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
      '<p class="sr-f-pie"><button class="btn primary sr-guardar">' + (t ? "Guardar los cambios" : "Crear el sorteo") + '</button> ' +
      '<button class="btn sr-cancelar">Cancelar</button></p></div>';
  }
  // ---------------------------------------------------------------- las ofertas (14-sep)
  /**
   * 🔴 14-sep · LAS OFERTAS DE LA SEMANA. Norberto: «un ítem que aparece aleatoriamente de forma
   * temporal en el mercado, rebajado, con stock limitado en tiempo y en unidades (proporcional a los
   * inscritos y a la rareza)… el referente tiene el poder siempre de extender el tiempo, cancelar,
   * editar unidades o incluso elegir y configurar lo que se va a vender». Todo lo hace el servidor
   * (`stargateOferta`); aquí se enseña y se pide.
   */
  function verOfertas(t) {
    var R = (DATOS && DATOS.recompensas) || [], ahora = Date.now();
    var L = R.filter(function (r) { return r.stargateTipo === "oferta"; })
      .sort(function (a, b) { return Number((b.stargateOferta || {}).desde || 0) - Number((a.stargateOferta || {}).desde || 0); });
    var auto = (DATOS.proyecto.stargate || {}).ofertasAuto !== false;
    var cofres = R.filter(function (r) { return r.inStore !== false && /^(cromo|heroe|sobre_[a-z]+|capsula_[a-z]+)$/.test(r.stargateTipo || "") && r.consumeEffects && r.consumeEffects.lootBox; });
    var heroes = R.filter(function (r) { return r.inStore === false && r.stargateTipo === "heroe" && /__heroe_/.test(r.docId || ""); });
    var cartas = R.filter(function (r) { return r.inStore === false && r.stargateTipo === "cromo" && /__cromo_/.test(r.docId || ""); });
    var RZ = { common: "común", rare: "rara", epic: "épica", legendary: "legendaria" };
    var estado = function (r) {
      var so = r.stargateOferta || {}, fo = r.flashOffer || {};
      if (so.cancelada) return ["cancelada", "✖️ Cancelada"];
      if (ahora < Number(so.desde || 0)) return ["pronto", "⏳ Empieza el " + diaDe(so.desde)];
      if (ahora >= Number(fo.endsAt || 0)) return ["fin", "⌛ Terminó el " + diaDe(fo.endsAt)];
      // (15-sep · agotada NO es terminada: le faltan unidades, no tiempo; antes solo ofrecía «Reabrir»)
      if (r.isLimitedStock === true && Number(r.globalStock || 0) <= 0) return ["agotada", "🔥 Agotada"];
      return ["viva", "⚡ A la venta hasta el " + diaDe(fo.endsAt)];
    };
    var fila = function (r) {
      var so = r.stargateOferta || {}, fo = r.flashOffer || {}, e = estado(r), pct = Number(fo.discountPercent || 0);
      var precio = Math.max(0, Math.floor(Number(r.cost || 0) * (100 - pct) / 100)), vend = Number(fo.unitsSold || 0);
      return '<div class="card of-fila ' + e[0] + '" data-of="' + esc(r.docId) + '">' +
        '<div><b>' + esc(so.nombre || r.title) + '</b> <span class="chip">' + esc(so.rareza || "") + '</span> <span class="chip' + (e[0] === "viva" ? " ok" : "") + '">' + e[1] + '</span>' +
        '<p class="small">' + (so.auto ? "Automática · semana " + (so.semana || "—") : "Creada por " + esc(so.por || "el referente")) + ' · <s>' + r.cost + ' ◈</s> <b>' + precio + ' ◈</b> (−' + pct + ' %) · ' +
        (so.unidades == null ? "sin límite de unidades" : vend + " de " + so.unidades + " vendidas") + ' · una por persona</p></div>' +
        (e[0] === "viva" || e[0] === "pronto" ? '<p class="of-botones"><button class="btn min" data-of-mas="1">+1 día</button> <button class="btn min" data-of-mas="7">+1 semana</button> ' +
          '<button class="btn min" data-of-uds>Unidades…</button> <button class="btn min peligro" data-of-cancelar>Cancelar</button></p>'
          : e[0] === "agotada" ? '<p class="of-botones"><button class="btn min" data-of-uds>Más unidades…</button> <button class="btn min peligro" data-of-cancelar>Cancelar</button></p>'
          : '<p class="of-botones"><button class="btn min" data-of-mas="7">Reabrir una semana</button></p>') + '</div>';
    };
    $("#c-cuerpo").innerHTML =
      '<div class="card"><h3>⚡ Ofertas</h3>' +
      '<p class="small">Cada semana, desde la 3, sale <b>sola</b> una oferta en el Mercado: un sobre, una cápsula, un héroe o una carta concretos, ' +
      'rebajados un 20-40 %, durante esa semana y con <b>unidades según los inscritos y la rareza</b> (común: sin límite; rara: la mitad; épica: una cuarta parte; legendaria: el 10 %). Una por persona.</p>' +
      '<label class="of-auto"><input type="checkbox" id="of-auto"' + (auto ? " checked" : "") + '> Oferta automática cada semana</label>' +
      '<p><button class="btn primary" id="of-nueva">+ Crear una oferta</button></p><div id="of-nueva-f"></div></div>' +
      (L.length ? L.map(fila).join("") : '<div class="card"><p class="small muted">Todavía no ha salido ninguna oferta. La primera sale sola en la semana 3, cuando alguien abre su Nave.</p></div>');
    var tras = function (texto) { return refrescar().then(function () { TAB = "ofertas"; pintar(); aviso(texto, true); }); };
    // (15-sep · si falla, el botón pulsado vuelve a estar vivo y la casilla vuelve a como estaba)
    var pide = function (accion, datos, texto, alFallar) {
      return MOTOR.oferta(PER, accion, datos).then(function () { return tras(texto); }).catch(function (e) {
        if (alFallar) try { alFallar(); } catch (x) {}
        aviso(/not-found|internal/.test(String(e && e.code)) && !/[áéíóú]/.test(String(e && e.message))
          ? "Falta desplegar en el servidor la función «stargateOferta» (el comando está en el traspaso)." : e.message);
      });
    };
    $("#of-auto").onchange = function () { var cb = $("#of-auto"), antes = !cb.checked;
      pide("auto", { on: cb.checked }, cb.checked ? "⚡ Una oferta automática cada semana." : "Ofertas automáticas apagadas: solo las que crees tú.",
        function () { cb.checked = antes; }); };
    Array.prototype.forEach.call(app.querySelectorAll("[data-of]"), function (c) {
      var id = c.getAttribute("data-of");
      Array.prototype.forEach.call(c.querySelectorAll("[data-of-mas]"), function (b) {
        b.onclick = function () { b.disabled = true; pide("extender", { ofertaId: id, dias: Number(b.getAttribute("data-of-mas")) }, "⏳ Oferta alargada.", function () { b.disabled = false; }); }; });
      var u = c.querySelector("[data-of-uds]");
      if (u) u.onclick = function () {
        var v = prompt("¿Cuántas unidades en total? (escribe «ilimitado» para quitar el tope)", "");
        if (v == null || String(v).trim() === "") return;
        if (!/ilimit/i.test(v) && !/^\s*\d+\s*$/.test(v)) { aviso("Escribe un número de unidades (por ejemplo, 5) o «ilimitado»."); return; }
        pide("unidades", { ofertaId: id, unidades: /ilimit/i.test(v) ? "ilimitado" : Number(v) }, "Unidades cambiadas.");
      };
      var x = c.querySelector("[data-of-cancelar]");
      if (x) x.onclick = function () { if (!confirm("¿Cancelar esta oferta? Sale del Mercado ya. Quien la compró la conserva.")) return; pide("cancelar", { ofertaId: id }, "✖️ Oferta cancelada."); };
    });
    $("#of-nueva").onclick = function () {
      var op = function (v, t) { return '<option value="' + esc(v) + '">' + esc(t) + '</option>'; };
      $("#of-nueva-f").innerHTML = '<div class="of-form">' +
        '<label class="h-campo">Qué se vende<select id="of-que">' +
          '<optgroup label="Sobres y cápsulas">' + cofres.map(function (r) { return op("cofre:" + r.stargateTipo, r.title + " (" + r.cost + " ◈)"); }).join("") + '</optgroup>' +
          '<optgroup label="Un héroe concreto">' + heroes.map(function (r) { return op("heroe:" + r.docId.split("__heroe_").pop(), r.title + " · " + (RZ[r.rarity] || r.rarity || "")); }).join("") + '</optgroup>' +
          '<optgroup label="Una carta concreta">' + cartas.map(function (r) { return op("carta:" + r.docId.split("__cromo_").pop(), r.title + " · " + (RZ[r.rarity] || r.rarity || "")); }).join("") + '</optgroup>' +
        '</select></label>' +
        '<label class="h-campo h-num">Descuento %<input id="of-pct" type="number" min="1" max="90" value="30"></label>' +
        '<label class="h-campo h-num">Unidades<input id="of-uds" type="number" min="1" placeholder="según inscritos y rareza"></label>' +
        '<label class="of-auto"><input type="checkbox" id="of-sin"> Sin límite de unidades</label>' +
        '<label class="h-campo h-num">Días<input id="of-dias" type="number" min="1" max="28" value="7"></label>' +
        '<p><button class="btn primary" id="of-crear">Crear la oferta (empieza ya)</button> <button class="btn" id="of-cancelar-f">Cancelar</button></p></div>';
      $("#of-cancelar-f").onclick = function () { $("#of-nueva-f").innerHTML = ""; };
      $("#of-crear").onclick = function () {
        var q = $("#of-que").value.split(":"), que = q[0] === "cofre" ? { tipo: "cofre", cual: q[1] } : { tipo: q[0], clave: q[1] };
        var uds = $("#of-sin").checked ? "ilimitado" : (Number($("#of-uds").value) > 0 ? Number($("#of-uds").value) : undefined);
        $("#of-crear").disabled = true;
        pide("crear", { que: que, pct: Number($("#of-pct").value) || 30, unidades: uds, dias: Number($("#of-dias").value) || 7 }, "⚡ Oferta creada: ya está en el Mercado de tu alumnado.",
          function () { var c = $("#of-crear"); if (c) c.disabled = false; });
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
          (e[0] === "hecho"
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
          '</div>';
      }).join("") : '<div class="card"><p class="small muted">Este grupo todavía no tiene ningún sorteo.</p></div>');
    var tras = function (texto) { return refrescar().then(function () { TAB = "sorteos"; pintar(); aviso(texto, true); }); };
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
    var leerForm = function (f) {
      return { premio: $(".sr-premio", f).value.trim(), descripcion: $(".sr-desc", f).value.trim(), ganadores: Number($(".sr-gan", f).value) || 1,
               coste: Number($(".sr-coste", f).value) || 0, maximo: Number($(".sr-max", f).value) || 0,
               desde: deFecha($(".sr-desde", f).value), fecha: deFecha($(".sr-fecha", f).value) };
    };
    var validar = function (v) {
      if (!v.premio) return "Di qué se sortea.";
      if (!v.desde || !v.fecha) return "Pon las dos fechas: desde cuándo se vende y cuándo se sortea.";
      if (v.fecha <= v.desde) return "El sorteo tiene que ser después de que empiece la venta.";
      return "";
    };
    var cablearForm = function (caja, doc_) {
      var f = $(".sr-form", caja);
      $(".sr-cancelar", f).onclick = function () { caja.innerHTML = ""; };
      $(".sr-guardar", f).onclick = async function () {
        var v = leerForm(f), malo = validar(v); if (malo) return aviso(malo);
        this.disabled = true;
        try {
          if (doc_) await MOTOR.guardarSorteo(PER, doc_, v);
          else await MOTOR.crearSorteo(PER, { id: "sorteo" + Date.now().toString(36), premio: v.premio, descripcion: v.descripcion,
            ganadores: v.ganadores, coste: v.coste, maximo: v.maximo, desde: v.desde, fecha: v.fecha });
          await tras(doc_ ? "Sorteo cambiado." : "Sorteo creado: ya sale en el Mercado de tu alumnado (desde su fecha).");
        } catch (e) { this.disabled = false; aviso(e.message); }
      };
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
          !confirm("Todavía no es el día del sorteo (" + diaDe(x.ticketDeadline) + "). Si sorteas ya, se cierra la venta de participaciones. ¿Sortear ahora?")) return;
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
  function verCalendario(t) {
    var S = DATOS.proyecto.stargate || {}, SS = window.SGSEMANAS, cat = window.SG_CATALOGO || {};
    if (!CAL || CAL.per !== PER) CAL = calDelGrupo();
    if (!CAL.inicio) { $("#c-cuerpo").innerHTML = '<div class="card"><h3>Calendario</h3><p>Este grupo no tiene fecha de semana 1. Ponla en «Ajustes del grupo».</p></div>'; return; }
    var tipo = S.tipo === "PUA" ? "PUA" : "REGULAR", total = (cat.semanas || {})[tipo] || 15, extra = cat.semanasCanjeExtra || 1;
    var hoy = SS.iso(new Date()), semHoy = SS.semanaDelCurso(CAL.inicio, CAL.pausas);
    var filas = SS.calendario(CAL.inicio, CAL.pausas, total, extra);
    var caps = capsDelCalendario(), semCap = function (c) { return (c.semanas || {})[tipo] || 99; };
    var planetas = (cat.temas || []).map(function (x) {
      return { n: x.n, nombre: x.planeta, sem: window.SG.PAQUETE.semanaEnTipo((cat.semanaDelTema || {})[String(x.n)] || x.n, tipo, cat) };
    });
    var nuevo = fechasDe(CAL).proyecto.stargate, viejo = fechasDe(calDelGrupo()).proyecto.stargate;
    // 15-sep · las semanas festivas de la UNIR (Navidad y Semana Santa): con su nombre, para que nadie las tome por un error
    var festivas = SS.festivosUNIR ? SS.festivosUNIR(CAL.inicio, total, extra) : [];
    var fila = function (f) {
      var pasada = f.fin < hoy, actual = f.inicio <= hoy && hoy <= f.fin, futura = f.inicio > hoy;
      var festiva = festivas.indexOf(f.inicio) >= 0;
      var abre = [];
      if (f.semana) {
        planetas.filter(function (p) { return p.sem === f.semana; }).forEach(function (p) { abre.push("🪐 Planeta " + p.n + " · " + esc(p.nombre)); });
        caps.filter(function (c) { return semCap(c) === f.semana; }).forEach(function (c) {
          abre.push(c.icono + " " + esc(c.titulo) + (CAL.abiertos[c.clave] ? ' <span class="chip ok">ya abierto</span>' : "")); });
        if (f.semana === total) abre.push("🏁 Último día para registrar retos: <b>" + diaCorto(f.fin) + "</b>");
        if (f.semana === total + extra) abre.push("🛒 Último día para canjear: <b>" + diaCorto(f.fin) + "</b>");
      }
      var nom = f.congelada ? (festiva ? "🎄 Festivo UNIR" : "⏸️ Congelada") : f.canje ? "Canje" : "Semana " + f.semana;
      var boton = !futura ? "" : f.congelada
        ? '<button class="btn min" data-cal-sigue="' + f.inicio + '">▶️ Descongelar</button>'
        : (f.semana ? '<button class="btn min" data-cal-pausa="' + f.inicio + '">⏸️ Congelar</button>' : "");
      return '<tr class="' + (f.congelada ? "cal-pausa" : "") + (actual ? " cal-hoy" : "") + (pasada ? " cal-pasada" : "") + '">' +
        '<td class="cal-fechas">' + diaCorto(f.inicio) + " – " + diaCorto(f.fin) + "</td>" +
        '<td class="cal-sem"><b>' + nom + "</b>" + (actual ? ' <span class="chip wip">hoy</span>' : "") + "</td>" +
        '<td class="cal-abre">' + (f.congelada ? '<span class="muted">' + (festiva ? (f.inicio.slice(5, 7) === "12" || f.inicio.slice(5, 7) === "01" ? "Navidad" : "Semana Santa") + ' en la UNIR: no hay clase. ' : '')
                                                  + 'No corre: el curso sigue en la semana de antes y lo de detrás se mueve una semana.</span>'
                                                : f.canje && !abre.length ? '<span class="muted">Sin retos nuevos: se canjea lo ganado.</span>' : abre.join("<br>")) + "</td>" +
        "<td>" + boton + "</td></tr>";
    };
    // lo que cambia al guardar
    var cambios = [];
    var S0 = calDelGrupo();
    var mas = CAL.pausas.filter(function (p) { return S0.pausas.indexOf(p) < 0; }), menos = S0.pausas.filter(function (p) { return CAL.pausas.indexOf(p) < 0; });
    if (CAL.inicio !== S0.inicio) cambios.push("La semana 1 empieza el <b>" + diaCorto(CAL.inicio) + "</b> (antes, el " + diaCorto(S0.inicio) + ").");
    mas.forEach(function (p) { cambios.push("Se congela la semana del <b>" + diaCorto(p) + "</b>."); });
    menos.forEach(function (p) { cambios.push("Vuelve a correr la semana del <b>" + diaCorto(p) + "</b>."); });
    caps.forEach(function (c) {
      if (!!CAL.abiertos[c.clave] !== !!S0.abiertos[c.clave])
        cambios.push(CAL.abiertos[c.clave] ? "Se abre YA " + c.icono + " <b>" + esc(c.titulo) + "</b> (su semana era la " + semCap(c) + ")."
                                            : c.icono + " <b>" + esc(c.titulo) + "</b> vuelve a abrirse en su semana (" + semCap(c) + ").");
    });
    if (nuevo.cierre !== viejo.cierre) cambios.push("Registrar retos: hasta el <b>" + diaCorto(nuevo.cierre) + "</b> (antes, " + diaCorto(viejo.cierre) + ").");
    if (nuevo.cierreCanje !== viejo.cierreCanje) cambios.push("Canjear: hasta el <b>" + diaCorto(nuevo.cierreCanje) + "</b> (antes, " + diaCorto(viejo.cierreCanje) + ").");
    var semAntes = SS.semanaDelCurso(S0.inicio, S0.pausas);
    if (semAntes !== semHoy) cambios.push("⚠️ <b>Hoy el grupo pasa de la semana " + semAntes + " a la " + semHoy + ".</b>");
    $("#c-cuerpo").innerHTML =
      '<div class="card cal-caja"><h3>📅 El calendario del grupo</h3>' +
      '<p class="small">Cada fila es una semana: lo que se abre y cuándo acaba todo. <b>Congela</b> una semana (Navidad, Semana Santa) ' +
      'y todo lo de detrás se corre una; o <b>abre un capítulo antes</b> de su semana. Nada cambia hasta que pulses <b>Guardar</b>.</p>' +
      '<div class="cal-cab"><label>Primer día de la semana 1 <input type="date" id="cal-inicio" value="' + esc(CAL.inicio) + '"></label>' +
      '<span class="small">Hoy: <b>' + (semHoy < 1 ? "aún no ha empezado" : semHoy > total + extra ? "curso terminado" : "semana " + Math.min(semHoy, total) + " de " + total) + "</b>" +
      (SS.pausaDe(CAL.inicio, CAL.pausas) ? " · ⏸️ semana congelada" : "") + "</span></div>" +
      '<div class="tabla-envoltura"><table class="tabla cal-tabla"><thead><tr><th>Fechas</th><th>Semana</th><th>Qué pasa</th><th></th></tr></thead><tbody>' +
      filas.map(fila).join("") + "</tbody></table></div></div>" +
      '<div class="card"><h3>Capítulos de la Nave</h3><p class="small muted">Cada capítulo abre algo nuevo en la Nave del alumnado (y NEBULA lo cuenta). ' +
      'Si tu clase va adelantada, ábrelo ya; lo del Mercado que traiga se puede comprar desde hoy.</p><div class="cal-caps">' +
      caps.map(function (c) {
        var porFecha = semHoy >= semCap(c), antes = !!CAL.abiertos[c.clave];
        var cuando = SS.inicioDeSemana(CAL.inicio, semCap(c), CAL.pausas);
        return '<div class="cal-cap' + (porFecha || antes ? " on" : "") + '"><b>' + c.icono + " " + esc(c.titulo) + "</b>" +
          '<span class="small">' + (porFecha ? "Abierto (semana " + semCap(c) + ")" : antes ? "Abierto antes de tiempo · su semana era la " + semCap(c)
                                    : "Se abre la semana " + semCap(c) + " · " + diaCorto(cuando)) + "</span>" +
          (porFecha ? "" : antes ? '<button class="btn min" data-cal-cierra="' + c.clave + '">↩️ Volver a su semana</button>'
                                 : '<button class="btn min" data-cal-abre="' + c.clave + '">🔓 Abrir ya</button>') + "</div>";
      }).join("") + "</div></div>" +
      '<div class="card cal-guardar"><h3>Al guardar</h3>' +
      (cambios.length ? "<ul>" + cambios.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" +
        '<p class="small muted">Se recalculan solas las fechas de los planetas y del Mercado. El alumnado lo ve la próxima vez que abra su Nave.</p>' +
        '<p><button class="btn primary" id="cal-guardar">Guardar el calendario</button> <button class="btn" id="cal-deshacer">Deshacer los cambios</button></p>'
        : '<p class="small muted">Sin cambios. Congela una semana o abre un capítulo y aquí verás lo que se moverá.</p>') + "</div>";
    var re = function () { verCalendario(t); };
    $("#cal-inicio").onchange = function () {
      var nuevoIni = this.value; if (!/^\d{4}-\d\d-\d\d$/.test(nuevoIni)) return;
      // las pausas se quedan en las mismas semanas del calendario (recolocadas sobre la rejilla nueva)
      CAL.pausas = SS.limpias(nuevoIni, CAL.pausas.map(function (p) {
        var d = SS.dias(nuevoIni, p); return d < 0 ? "" : SS.masDias(nuevoIni, Math.floor(d / 7) * 7); }));
      CAL.inicio = nuevoIni; re();
    };
    Array.prototype.forEach.call(app.querySelectorAll("[data-cal-pausa]"), function (b) {
      b.onclick = function () { CAL.pausas = SS.limpias(CAL.inicio, CAL.pausas.concat([b.getAttribute("data-cal-pausa")])); re(); }; });
    Array.prototype.forEach.call(app.querySelectorAll("[data-cal-sigue]"), function (b) {
      b.onclick = function () { var p = b.getAttribute("data-cal-sigue"); CAL.pausas = CAL.pausas.filter(function (x) { return x !== p; }); re(); }; });
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
      if (!confirm("Última pregunta: ¿borrar «" + nombre + "» y todo lo que tiene? No se puede deshacer.")) return;
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
      '<label>Panel de control (ver)<input id="s-panel" value="' + esc(S.panelVer || "") + '"></label>' +
      '<label>Panel de control (editar)<input id="s-paneled" value="' + esc(P.panelEdit || "") + '"></label>' +
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
       ["🛰️ El aula (el puesto de mando del docente)", "aula.html?embed=1"], ["🎯 Validar un reto", "validar.html?reto=S7&embed=1"]].map(function (x) {
        return '<p class="small">' + x[0] + ' <button class="btn min" data-copiado="✓ Código copiado" data-copiar="' + esc(codigoGenially(x[1], "STARGATE · " + x[0].replace(/^\S+\s/, ""))) + '">&lt;/&gt; Copiar para insertar</button></p>';
      }).join("") +
      // 15-sep · el reto secreto (S7): el enlace que «no debería estar» en la presentación de Vínculo
      '<p class="small">🕳️ <b>El enlace escondido del reto secreto (S7)</b>: en la presentación del planeta <b>Vínculo</b>, ponlo en algo ' +
      'que no parezca un botón (una estrella, un rincón de la imagen). Lleva al enigma «El Fragmento Prohibido», y el enigma a la palabra ' +
      'que borró Vaeon y al registro del reto. <button class="btn min" data-copiado="✓ Enlace copiado" data-copiar="' + esc(location.origin + "/fragmento.html") + '">🔗 Copiar el enlace</button></p>' +
      '</div>' +
      tarjetaBorrar();
    cablearBorrar();
    var aCal = app.querySelector('#c-cuerpo [data-tab="calendario"]');
    if (aCal) aCal.onclick = function () { TAB = "calendario"; pintar(); };
    if ($("#s-codigo")) $("#s-codigo").onclick = async function () {
      if (DATOS.proyecto.joinCode &&
          !confirm("Se cambiará el código. Quien tenga el enlace viejo ya no podrá alistarse " +
                   "hasta que le pases el nuevo.\n\n¿Seguimos?")) return;
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
