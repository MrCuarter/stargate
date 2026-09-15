// STARGATE — EL SIMULADOR DE JORAN · la batalla de preguntas.  batalla.html?per=<grupo>[&modo=t3][&embed=1]
//
// 🔴 QUÉ ES Y POR QUÉ ESTÁ APARTE DE LA NAVE.
//
// Norberto: «Reto A6: vamos a hacer algo más épico. ¡Se van a enfrentar a un juego de preguntas contra Joran! Así
// predicamos con el ejemplo… tenemos que entrenar para la batalla final… si lo superamos obtendremos su insignia…
// debe existir la posibilidad de embeber el juego/batalla: el usuario inicia sesión y comienza la batalla».
//
// Por eso esto es una PÁGINA PROPIA y pública, como el escondite (huevo.js) y la llamada a filas: vive dentro del
// Genially del tema 6, pide la cuenta de Google ahí mismo y no necesita saber el grupo — se deduce de quién pulsa.
//
// 🔴 Y AQUÍ NO HAY NI UNA RESPUESTA. Todo lo decide `stargateBatalla` (GamificaPro): esta página pinta lo que le
// devuelven —la pregunta, las barras, el reloj— y manda lo que toca el estudiante. Ni el mazo, ni la opción buena, ni
// el tiempo que queda salen de este fichero: si estuvieran aquí, ganar al simulador sería mirar el código.
(function () {
  var app = document.getElementById('bt-app');
  if (!app) return;
  var U = new URLSearchParams(location.search);
  var PER = (U.get('per') || '').trim(), MODO_URL = (U.get('modo') || '').trim();
  if (U.get('embed') === '1') document.body.classList.add('embed');

  var CFG = window.SG_BATALLA || {};
  var M = null, YO = null, EST = null, B = null, MIO = null, TIPO = 'REGULAR', pidiendo = false;
  var reloj = 0, sel = [], huecos = [], qPintada = '', revelando = 0, QUIERE = '';
  // el nivel de dificultad del ENTRENAMIENTO (el reto A6 va siempre en media, lo impone el servidor)
  var NIVEL = 'media';
  try { var g = localStorage.getItem('sgBtNivel'); if (g) NIVEL = g; } catch (e) {}

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pinta(h) { app.innerHTML = h; }
  var $ = function (s) { return app.querySelector(s); };
  function nombreModo(m) {
    if (m === 'reto') return 'El reto de Joran';
    if (m === 'todas') return 'Todas las preguntas';
    var n = Number(String(m).slice(1)), P = (window.SG_PLANETAS || [])[n - 1];
    return 'Tema ' + n + (P ? ' · ' + P[1] : '');
  }
  function fechaCorta(ms) { try { return new Date(ms).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }); } catch (e) { return ''; } }

  // ──────────────────────────────────────────────────────────── la puerta
  function cargando(t) {
    pinta('<div class="bt-caja bt-centro"><div class="bt-cargando"><i></i></div><p class="bt-sub">' + esc(t) + '</p></div>');
  }
  function fallo(msg, reintenta) {
    pinta('<div class="bt-caja bt-centro mal"><div class="bt-icono">🎮</div><h2>No he podido abrir el simulador</h2>'
      + '<p class="bt-sub">' + esc(msg) + '</p>'
      + (reintenta ? '<p><button class="btn" id="bt-otra">Volver a intentarlo</button></p>' : '') + '</div>');
    if (reintenta) $('#bt-otra').onclick = function () { cargarEstado(); };
  }
  function puerta() {
    pinta('<div class="bt-caja bt-centro bt-puerta">'
      + '<img class="bt-emblema" src="assets/img/batalla/emblema.webp" alt="" width="180" height="180">'
      + '<div class="eyebrow amber">Simulador de entrenamiento</div><h2>RUTA AZUL</h2>'
      + '<p class="bt-sub">Joran Pike lo dejó encendido para la tripulación. Entra con tu cuenta y te espera dentro.</p>'
      + '<button class="btn epico" id="bt-entrar"><span class="ep-luz"></span><span class="ep-g">'
      + ((window.SG && window.SG.LOGO_G) || '') + '</span><span class="ep-txt">Entrar con Google</span></button></div>');
    $('#bt-entrar').onclick = function () {
      cargando('Abriendo…');
      M.entrar().then(mirar).catch(function (e) {
        if (/popup-closed|cancelled-popup/.test(String(e && e.code))) return puerta();
        fallo(e.message || e);
      });
    };
  }
  function otraCuenta(correo) {
    pinta('<div class="bt-caja bt-centro mal"><div class="bt-icono">🎮</div><h2>Esta cuenta no está en ningún grupo</h2>'
      + '<p class="bt-sub">Estás con <b>' + esc(correo) + '</b>, y no la encuentro alistada. Entra con <b>la cuenta con la que te alistaste</b>.</p>'
      + '<button class="btn epico" id="bt-otra2"><span class="ep-luz"></span><span class="ep-g">'
      + ((window.SG && window.SG.LOGO_G) || '') + '</span><span class="ep-txt">Entrar con otra cuenta</span></button></div>');
    $('#bt-otra2').onclick = function () { cargando('Abriendo…'); M.entrar().then(mirar).catch(function () { puerta(); }); };
  }
  function elegirGrupo(grupos) {
    pinta('<div class="bt-caja bt-centro"><h2>¿En qué grupo estamos?</h2><p class="bt-sub">Estás alistado en más de uno.</p>'
      + '<div class="bt-grupos">' + grupos.map(function (g, i) {
        return '<button class="btn" data-g="' + i + '">' + esc(g.nombreGrupo || g.per) + '</button>'; }).join('') + '</div></div>');
    Array.prototype.forEach.call(app.querySelectorAll('[data-g]'), function (b) {
      b.onclick = function () { PER = grupos[Number(b.getAttribute('data-g'))].per; cargarEstado(); };
    });
  }

  // ──────────────────────────────────────────────────────────── el menú
  function caraMia() {
    var av = {}, alias = (MIO && MIO.displayName) || 'Tú', xp = (MIO && MIO.totalPoints) || 0;
    try {
      av = Object.assign({}, (MIO && MIO.stargateAvatar) || {});
      var v = String((MIO && MIO.stargateViste) || '');
      if (v.indexOf('heroe:') === 0) av.heroe = v.slice(6);
      if (v.indexOf('skin:') === 0) av.skin = Number(v.slice(5));
    } catch (e) {}
    var r = (window.SG && SG.avatarSrc) ? SG.avatarSrc(av, alias, xp, TIPO) : { src: '' };
    return { src: r.src, alias: alias };
  }
  function reglas() {
    var o = CFG.objetos || [];
    return '<ul class="bt-reglas">'
      + '<li><b>Aciertas</b> y eliges: <b>golpear</b> (' + (CFG.golpe || 20) + ') o <b>cubrirte</b> (su próximo golpe duele la mitad).</li>'
      + '<li><b>Fallas</b> y no pierdes escudo: pierdes <b>tiempo</b>… y esa pregunta volverá.</li>'
      + '<li>RUTA AZUL ataca <b>cada ' + (CFG.cadencia || 25) + ' segundos</b>, quites o no quites. Te avisa el reloj.</li>'
      + '<li>Tu kit, un uso de cada: ' + o.map(function (x) { return x[1] + ' <b>' + esc(x[2]) + '</b>'; }).join(' · ') + '.</li>'
      + '<li>Al <b>20 %</b> llega el <b>Remate</b>: sin fallos cae de un golpe; con fallos, vuelven en cadena.</li></ul>';
  }
  function tarjetaReto() {
    var c = EST.cansancio || 0;
    return '<div class="bt-reto">'
      + '<figure class="bt-rival-foto"><img src="assets/img/batalla/rival.jpg" alt="RUTA AZUL, el rival del simulador"></figure>'
      + '<div class="bt-reto-txt"><div class="eyebrow amber">Reto A6 · Tema 6 · Ludo</div>'
      + '<h2>Gánale a RUTA AZUL</h2>'
      + '<p class="bt-sub">«A mis críos del refugio les hice jugar cien veces antes de la noche de verdad. Contigo voy a hacer lo mismo: '
      + 'preguntas de todo lo que llevas recorrido, temas 1 al 5. Si me ganas, el simulador es tuyo.» — <b>Joran Pike</b></p>'
      + reglas()
      + (c ? '<p class="bt-cansa">🔧 Lo has intentado ' + c + (c === 1 ? ' vez' : ' veces') + ': esta vez atacará más despacio.</p>' : '')
      + '<p><button class="btn epico grande" data-empezar="reto"><span class="ep-luz"></span><span class="ep-txt">⚔️ Empezar la batalla</span></button></p>'
      + '<p class="small muted">No hay nada que entregar: el reto A6 se registra solo al ganar.</p></div></div>';
  }
  function tarjetaModo(m) {
    var marca = (EST.marcas || {})[m], n = m === 'todas' ? 0 : Number(m.slice(1));
    return '<button class="bt-modo" data-empezar="' + esc(m) + '">'
      + (n ? '<img class="bt-modo-img" src="assets/img/planetas/' + esc(((window.SG_PLANETAS || [])[n - 1] || [])[0] || '') + '.png' + esc(window.SG_IMGV || '') + '" alt="" onerror="this.remove()">'
           : '<span class="bt-modo-todo">★</span>')
      + '<span class="bt-modo-t">' + esc(nombreModo(m)) + '</span>'
      + '<span class="bt-modo-m">' + (marca ? '<b>' + marca.p + '</b> puntos' : 'sin marca todavía') + '</span></button>';
  }
  function menu() {
    var gan = EST.joran, modos = (EST.modos || []).filter(function (m) { return m !== 'reto'; });
    var cab = '<header class="bt-cab"><img class="bt-emblema" src="assets/img/batalla/emblema.webp" alt="" width="120" height="120">'
      + '<div><div class="eyebrow amber">Simulador de entrenamiento · Joran Pike</div><h1>RUTA AZUL</h1>'
      + '<p class="bt-sub">' + (EST.docente ? 'Modo ensayo: juegas como docente, no se guarda nada ni cuenta para el ranking.'
          : gan ? 'Le ganaste el ' + esc(fechaCorta(gan.f)) + '. El simulador es tuyo: entrena cuando quieras.'
                : 'El reto A6 de la tripulación.') + '</p></div></header>';
    var cuerpo = '';
    if ((EST.modos || []).indexOf('reto') >= 0 && !gan) cuerpo += tarjetaReto();
    else if (gan && !EST.docente) cuerpo += '<p class="bt-ganado">🏅 <b>Insignia de Joran conseguida.</b> '
      + '<button class="btn min" data-empezar="reto">Volver a pelear con él</button></p>';
    if (modos.length) {
      var N = CFG.niveles || [];
      cuerpo += '<h2 class="bt-h2">Entrenamiento</h2><p class="bt-sub">Repasa tema a tema, o con todo el viaje a la vez. Cada modo tiene su ranking.</p>'
        + (N.length ? '<div class="bt-niveles">' + N.map(function (x) {
            return '<button class="bt-nivel' + (x[0] === NIVEL ? ' on' : '') + '" data-nivel="' + esc(x[0]) + '" title="' + esc(x[2]) + '">'
              + '<b>' + esc(x[1]) + '</b><span>' + esc(x[3]) + ' a la marca</span></button>'; }).join('')
          + '<p class="small muted bt-nivel-txt">' + esc((N.filter(function (x) { return x[0] === NIVEL; })[0] || N[1] || [])[2] || '') + '</p></div>' : '')
        + '<div class="bt-modos">' + modos.map(tarjetaModo).join('') + '</div>'
        + (EST.total ? '<p class="bt-historial">Tu historial: <b>' + (EST.total.batallas || 0) + '</b> batallas · <b>'
            + (EST.total.aciertos || 0) + '</b> aciertos de ' + (EST.total.respondidas || 0)
            + (EST.total.aciertos ? ' · <b>' + (Math.round((EST.total.ms / 1000) / EST.total.aciertos * 10) / 10) + ' s</b> por acierto' : '') + '</p>' : '')
        + '<div class="bt-ranking" id="bt-ranking"></div>';
    } else if (!gan) {
      cuerpo += '<p class="bt-bloqueado">🔒 El entrenamiento por temas se abre cuando le ganas.</p>';
    }
    pinta('<div class="bt-menu">' + cab + cuerpo + '</div>');
    Array.prototype.forEach.call(app.querySelectorAll('[data-empezar]'), function (b) {
      b.onclick = function () { empezar(b.getAttribute('data-empezar')); };
    });
    Array.prototype.forEach.call(app.querySelectorAll('[data-nivel]'), function (b) {
      b.onclick = function () { NIVEL = b.getAttribute('data-nivel');
        try { localStorage.setItem('sgBtNivel', NIVEL); } catch (e) {}
        menu(); };
    });
    if (modos.length) ranking(modos.indexOf('todas') >= 0 ? 'todas' : modos[0]);
  }

  /** El ranking de un modo: los diez primeros del grupo y dónde estás tú. */
  function ranking(modo) {
    var caja = $('#bt-ranking'); if (!caja) return;
    var modos = (EST.modos || []).filter(function (m) { return m !== 'reto'; });
    var pestañas = '<div class="bt-rk-pest">' + modos.map(function (m) {
      return '<button class="' + (m === modo ? 'on' : '') + '" data-rk="' + esc(m) + '">' + esc(m === 'todas' ? 'Todas' : 'T' + m.slice(1)) + '</button>';
    }).join('') + '</div>';
    caja.innerHTML = pestañas + '<p class="small muted">Cargando el ranking…</p>';
    Array.prototype.forEach.call(caja.querySelectorAll('[data-rk]'), function (b) {
      b.onclick = function () { ranking(b.getAttribute('data-rk')); };
    });
    M.batalla('ranking', { projectId: PER, modo: modo }).then(function (r) {
      var filas = r.filas || [];
      caja.innerHTML = pestañas
        + '<h3 class="bt-rk-t">' + esc(nombreModo(modo)) + '</h3>'
        + (filas.length ? '<ol class="bt-rk">' + filas.map(function (f) {
            var av = Object.assign({}, f.stargateAvatar || {});
            var v = String(f.stargateViste || '');
            if (v.indexOf('heroe:') === 0) av.heroe = v.slice(6);
            if (v.indexOf('skin:') === 0) av.skin = Number(v.slice(5));
            var src = ''; try { src = SG.avatarSrc(av, f.alias, f.totalPoints, TIPO).src; } catch (e) {}
            return '<li class="' + (f.yo ? 'yo' : '') + '"><span class="bt-rk-n">' + f.puesto + '</span>'
              + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : '<span class="bt-rk-av"></span>')
              + '<span class="bt-rk-a">' + esc(f.alias) + '</span><b>' + f.p + '</b></li>';
          }).join('') + '</ol>'
          : '<p class="small muted">Todavía no hay marcas en este modo. La primera puede ser la tuya.</p>')
        + (r.mio && r.mio.puesto > 10 ? '<p class="bt-rk-mio">Tu puesto: <b>' + r.mio.puesto + '</b> de ' + r.total + ' · ' + r.mio.p + ' puntos</p>' : '')
        + medallas(r.medallas)
        + '<p class="small muted">La marca: ganar vale 1.000; el escudo que te queda y tu puntería suman hasta 1.000 más.</p>';
      Array.prototype.forEach.call(caja.querySelectorAll('[data-rk]'), function (b) {
        b.onclick = function () { ranking(b.getAttribute('data-rk')); };
      });
    }).catch(function () { caja.innerHTML = pestañas + '<p class="small muted">El ranking no ha cargado. Prueba a recargar la página.</p>'; });
  }

  /** Los tres reconocimientos del grupo: se calculan con el historial de todos (no con una sola batalla). */
  function medallas(m) {
    if (!m) return '';
    var D = CFG.medallas || [], hay = D.some(function (x) { return m[x[0]]; });
    if (!hay) return '';
    return '<div class="bt-medallas"><h3 class="bt-rk-t">Reconocimientos de tu grupo</h3><div class="bt-med-lista">'
      + D.map(function (x) {
          var g = m[x[0]];
          var v = !g ? 'todavía nadie' : x[0] === 'rapido' ? g.valor + ' s por acierto'
                : x[0] === 'certero' ? g.valor + ' % de aciertos' : g.valor + ' aciertos';
          return '<div class="bt-med' + (g && g.yo ? ' yo' : '') + '"><span class="bt-med-i">' + x[1] + '</span>'
            + '<b>' + esc(x[2]) + '</b><span class="bt-med-q">' + (g ? esc(g.alias) : '—') + '</span>'
            + '<span class="bt-med-v">' + esc(v) + '</span></div>';
        }).join('') + '</div></div>';
  }

  // ──────────────────────────────────────────────────────────── la arena
  function barra(cls, v, max) { return '<div class="bt-barra ' + cls + '"><i style="width:' + Math.max(0, Math.min(100, Math.round(v * 100 / max))) + '%"></i></div>'; }
  function pintarArena() {
    var yo = caraMia();
    pinta('<div class="bt-juego">'
      + '<div class="bt-hud">'
        + '<div class="bt-lado bt-yo"><img class="bt-cara" src="' + esc(yo.src) + '" alt=""><div class="bt-datos">'
          + '<b>' + esc(yo.alias) + '</b><span class="bt-vida" id="bt-vida-n"></span>' + barra('yo', 1, 1) + '</div></div>'
        + '<div class="bt-reloj" id="bt-reloj"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="bt-reloj-f" cx="32" cy="32" r="27"/>'
          + '<circle class="bt-reloj-a" cx="32" cy="32" r="27" id="bt-aguja"/></svg><span id="bt-seg">–</span><em>ataque</em></div>'
        + '<div class="bt-lado bt-riv"><div class="bt-datos"><b>RUTA AZUL</b><span class="bt-vida" id="bt-riv-n"></span>'
          + barra('riv', 1, 1) + '</div><img class="bt-cara" src="assets/img/batalla/rival.jpg" alt=""></div>'
      + '</div>'
      + '<div class="bt-arena" id="bt-arena">'
        + '<img class="bt-rival" id="bt-rival" src="assets/img/batalla/rival.jpg" alt="RUTA AZUL">'
        + '<img class="bt-heroe" id="bt-heroe" src="' + esc(yo.src) + '" alt="">'
        + '<div class="bt-rayo" id="bt-rayo"></div><div class="bt-cifras" id="bt-cifras"></div>'
        + '<div class="bt-aviso" id="bt-aviso" hidden></div>'
      + '</div>'
      + '<div class="bt-joran" id="bt-joran" hidden><img src="assets/img/batalla/joran.jpg" alt="Joran Pike"><p></p></div>'
      + '<div class="bt-panel" id="bt-panel"></div>'
      + '<div class="bt-acciones" id="bt-acciones" hidden></div>'
      + '<div class="bt-pie"><span id="bt-marcador"></span><button class="bt-rendir" id="bt-rendir" type="button">Rendirse</button></div>'
      + '</div>');
    $('#bt-rendir').onclick = function () {
      if (!confirm('¿Seguro que te rindes? Contará como derrota (y la próxima vez atacará más despacio).')) return;
      enviar('rendirse', {});
    };
    qPintada = '';
  }
  function refrescarHud() {
    var v = $('#bt-vida-n'), r = $('#bt-riv-n');
    if (v) v.textContent = B.vida + ' / ' + B.vidaMax;
    if (r) r.textContent = B.rival + ' / ' + B.rivalMax;
    var by = app.querySelector('.bt-barra.yo i'), br = app.querySelector('.bt-barra.riv i');
    if (by) { by.style.width = Math.max(0, B.vida * 100 / B.vidaMax) + '%'; by.parentNode.classList.toggle('poca', B.vida <= B.vidaMax * 0.3); }
    if (br) br.style.width = Math.max(0, B.rival * 100 / B.rivalMax) + '%';
    var m = $('#bt-marcador');
    if (m) m.innerHTML = 'Aciertos <b>' + B.aciertos + '</b> · fallos <b>' + (B.respondidas - B.aciertos) + '</b>'
      + (B.guardia ? ' · 🛡️ en guardia' : '') + (B.furia ? ' · ⚡ sobrecargado' : '');
    var im = $('#bt-rival');
    if (im) im.src = 'assets/img/batalla/rival' + (B.rival <= B.rivalMax * 0.35 ? '_danado' : '') + '.jpg';
  }
  function pintarAcciones() {
    var caja = $('#bt-acciones'); if (!caja) return;
    if (B.fase !== 'accion') { caja.hidden = true; caja.innerHTML = ''; return; }
    var o = CFG.objetos || [];
    caja.hidden = false;
    caja.innerHTML = '<button class="bt-acc golpe" data-acc="golpe">⚔️ Golpear<span>−' + ((CFG.golpe || 20) * (B.furia ? 2 : 1)) + '</span></button>'
      + '<button class="bt-acc guardia" data-acc="guardia">🛡️ Cubrirte<span>su golpe, a la mitad</span></button>'
      + o.map(function (x) {
          var n = (B.objetos || {})[x[0]] || 0;
          return '<button class="bt-acc obj" data-acc="' + esc(x[0]) + '"' + (n ? '' : ' disabled') + '>' + x[1] + ' ' + esc(x[2]) + '<span>' + esc(x[3]) + '</span></button>';
        }).join('');
    Array.prototype.forEach.call(caja.querySelectorAll('[data-acc]'), function (b) {
      b.onclick = function () { enviar('actuar', { cual: b.getAttribute('data-acc') }); };
    });
  }

  /** La pregunta: una sola correcta, varias, o rellenar huecos. */
  function pintarPregunta() {
    var caja = $('#bt-panel'); if (!caja) return;
    var q = B.pregunta;
    if (!q) { caja.innerHTML = ''; qPintada = ''; return; }
    var clave = q.id + '|' + B.fase;
    if (clave === qPintada) return;
    qPintada = clave; sel = []; huecos = [];
    var vis = '';
    if (q.visual) {
      if (q.visual.tipo === 'imagen') vis = '<figure class="bt-vis foto"><img src="' + esc(q.visual.src) + '" alt="' + esc(q.visual.alt || '') + '" loading="lazy"></figure>';
      else if (q.visual.svg) vis = '<figure class="bt-vis ' + esc(q.visual.tipo) + '">' + q.visual.svg + '</figure>';
    }
    var enun = esc(q.enunciado);
    if (q.tipo === 'hueco') {
      var i = 0;
      enun = enun.split('___').join(' ').split(' ').map(function (t, k, a) {
        return t + (k < a.length - 1 ? '<span class="bt-hueco" data-h="' + (i++) + '">?</span>' : '');
      }).join('');
    }
    // (`data-q` es el id de la pregunta, no su respuesta: el laboratorio lo usa para jugar como jugaría quien se sabe el tema)
    caja.innerHTML = '<div class="bt-q" data-q="' + esc(q.id) + '" data-tipo="' + esc(q.tipo) + '">'
      + '<div class="bt-q-cab"><span class="chip">Tema ' + q.tema + '</span>'
        + '<span class="chip ' + esc(q.nivel) + '">' + (q.nivel === 'facil' ? 'Fácil' : 'Media') + '</span>'
        + (B.fase === 'remate' ? '<span class="chip remate">Remate · quedan ' + ((B.remate || {}).quedan || 1) + '</span>' : '')
        + (q.tipo === 'varias' ? '<span class="chip tipo">Marca varias</span>' : q.tipo === 'hueco' ? '<span class="chip tipo">Rellena los huecos</span>' : '')
      + '</div>'
      + vis
      + '<p class="bt-enun">' + enun + '</p>'
      + '<div class="bt-ops' + (q.tipo === 'hueco' ? ' chips' : '') + '">'
        + q.opciones.map(function (o, k) { return '<button class="bt-op" data-op="' + k + '">' + esc(o) + '</button>'; }).join('')
      + '</div>'
      + (q.tipo !== 'una' ? '<p class="bt-responder"><button class="btn primary" id="bt-ok" disabled>Responder</button></p>' : '')
      + (q.pista ? '<p class="bt-pista">💡 ' + esc(q.pista) + '</p>' : '')
      + '</div>';
    Array.prototype.forEach.call(caja.querySelectorAll('[data-op]'), function (b) {
      b.onclick = function () { tocarOpcion(Number(b.getAttribute('data-op')), b); };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('[data-h]'), function (h) {
      h.onclick = function () {
        var k = Number(h.getAttribute('data-h'));
        if (huecos[k] == null) return;
        var b = caja.querySelector('[data-op="' + huecos[k] + '"]'); if (b) b.classList.remove('usada');
        huecos[k] = null; h.textContent = '?'; h.classList.remove('lleno');
        $('#bt-ok').disabled = true;
      };
    });
  }
  function tocarOpcion(k, b) {
    if (b.disabled || revelando) return;
    var q = B.pregunta;
    if (q.tipo === 'una') return responder([k]);
    if (q.tipo === 'varias') {
      var i = sel.indexOf(k);
      if (i >= 0) { sel.splice(i, 1); b.classList.remove('sel'); } else { sel.push(k); b.classList.add('sel'); }
      $('#bt-ok').disabled = sel.length < 2;
      $('#bt-ok').onclick = function () { responder(sel.slice()); };
      return;
    }
    // huecos: cada opción cae en el primer hueco libre
    if (b.classList.contains('usada')) return;
    var libres = app.querySelectorAll('.bt-hueco'), n = -1;
    for (var j = 0; j < libres.length; j += 1) if (huecos[j] == null) { n = j; break; }
    if (n < 0) return;
    huecos[n] = k; b.classList.add('usada');
    libres[n].textContent = B.pregunta.opciones[k]; libres[n].classList.add('lleno');
    var listo = true;
    for (var z = 0; z < libres.length; z += 1) if (huecos[z] == null) listo = false;
    $('#bt-ok').disabled = !listo;
    $('#bt-ok').onclick = function () { responder(huecos.slice()); };
  }

  // ──────────────────────────────────────────────────────────── el reloj y los golpes
  function pintarReloj(ms) {
    var s = $('#bt-seg'), a = $('#bt-aguja');
    if (!s) return;
    var seg = Math.ceil(ms / 1000);
    s.textContent = seg;
    s.parentNode.classList.toggle('pronto', ms <= 5000);
    if (a) { var L = 2 * Math.PI * 27, p = Math.max(0, Math.min(1, ms / (B.cadencia || 25000)));
      a.style.strokeDasharray = L; a.style.strokeDashoffset = (L * (1 - p)).toFixed(1); }
  }
  function programarReloj() {
    clearTimeout(reloj);
    if (!B || B.fase === 'victoria' || B.fase === 'derrota' || B.ataqueEn == null) return;
    var fin = Date.now() + B.ataqueEn;
    (function tic() {
      var q = Math.max(0, fin - Date.now());
      pintarReloj(q);
      if (q <= 0) { if (!pidiendo) enviar('actuar', { cual: 'reloj' }); return; }
      reloj = setTimeout(tic, q > 1500 ? 250 : 100);
    })();
  }
  function cifra(txt, lado, cls) {
    var c = $('#bt-cifras'); if (!c) return;
    var n = document.createElement('span');
    n.className = 'bt-cifra ' + (cls || '') + ' ' + lado;
    n.textContent = txt;
    c.appendChild(n);
    setTimeout(function () { n.remove(); }, 1200);
  }
  function dice(t) {
    var j = $('#bt-joran'); if (!j) return;
    j.hidden = false; j.querySelector('p').innerHTML = t;
    j.classList.remove('entra'); void j.offsetWidth; j.classList.add('entra');
  }
  var FRASES = {
    guardia: 'En guardia. Su próximo golpe dolerá la mitad.',
    cura: 'Escudo reparado. Como en el refugio: primero se respira, luego se corre.',
    furia: 'Sobrecarga lista: el próximo golpe hace el doble.',
    lentitud: 'Interferencia. Se ha quedado pensando… aprovecha.',
  };
  function animar(sucesos) {
    var ar = $('#bt-arena');
    (sucesos || []).forEach(function (s, i) {
      setTimeout(function () {
        if (!ar) return;
        if (s.t === 'golpe') { ar.classList.remove('ataca-yo'); void ar.offsetWidth; ar.classList.add('ataca-yo'); cifra('−' + s.d, 'der'); }
        if (s.t === 'golpe-rival') { ar.classList.remove('ataca-riv'); void ar.offsetWidth; ar.classList.add('ataca-riv');
          cifra('−' + s.d, 'izq', s.guardia ? 'flojo' : ''); if (s.guardia) dice('Tu guardia se ha comido la mitad.'); }
        if (s.t === 'objeto') dice(FRASES[s.o] || '');
        if (s.t === 'guardia') dice(FRASES.guardia);
        if (s.t === 'remate') aviso('⚡ RUTA AZUL se tambalea: redime tus ' + s.n + ' falladas y remátalo.');
        if (s.t === 'remate-final') aviso(s.impecable ? '🌟 Sin un solo fallo. El Remate cae entero.' : '🌟 Cadena redimida. ¡Remate!');
      }, i * 260);
    });
  }
  function aviso(t) {
    var a = $('#bt-aviso'); if (!a) return;
    a.hidden = false; a.textContent = t;
    setTimeout(function () { if (a) a.hidden = true; }, 4000);
  }

  // ──────────────────────────────────────────────────────────── hablar con el servidor
  function enviar(accion, datos) {
    if (pidiendo || !B) return;
    pidiendo = true;
    clearTimeout(reloj);
    M.batalla(accion, Object.assign({ batallaId: B.id, seq: B.seq }, datos || {})).then(function (r) {
      pidiendo = false; aplicar(r);
    }).catch(function (e) {
      pidiendo = false;
      aviso('Se ha cortado: ' + (e && e.message ? e.message : e));
      programarReloj();
    });
  }
  function responder(resp) {
    if (pidiendo || revelando) return;
    Array.prototype.forEach.call(app.querySelectorAll('.bt-op'), function (b) { b.disabled = true; });
    var ok = $('#bt-ok'); if (ok) ok.disabled = true;
    enviar('responder', { respuesta: resp });
  }
  /** Lo que devuelve el servidor: animaciones, la corrección de Joran y, después, la pregunta siguiente. */
  function aplicar(r) {
    var antes = B;
    B = r.batalla || B;
    refrescarHud(); animar(r.sucesos);
    if (r.final) return final(r.final);
    if (r.revela) {
      revelando = 1;
      var buenas = r.revela.correctas || [];
      Array.prototype.forEach.call(app.querySelectorAll('.bt-op'), function (b) {
        var k = Number(b.getAttribute('data-op'));
        if (buenas.indexOf(k) >= 0) b.classList.add('ok');
        else if (b.classList.contains('sel') || (antes && antes.pregunta && antes.pregunta.tipo === 'una' && b.classList.contains('tocada'))) b.classList.add('mal');
      });
      dice(r.revela.acierto ? '<b>Bien.</b> ' + esc(frasePremio()) : esc(r.revela.correccion));
      setTimeout(function () {
        revelando = 0; qPintada = '';
        pintarPregunta(); pintarAcciones(); programarReloj();
      }, r.revela.acierto ? 450 : 2600);
      pintarAcciones();
      programarReloj();
      return;
    }
    pintarPregunta(); pintarAcciones(); programarReloj();
  }
  function frasePremio() {
    var F = ['Ahora elige: ¿pegas o te cubres?', 'El reloj no espera: decide.', 'Eso es. ¿Golpe o guardia?'];
    return F[Math.floor(Math.random() * F.length)];
  }

  function empezar(modo) {
    cargando(modo === 'reto' ? 'Encendiendo el simulador…' : 'Cargando el entrenamiento…');
    M.batalla('empezar', { projectId: PER, modo: modo, nivel: NIVEL }).then(function (r) {
      B = r.batalla; pintarArena(); refrescarHud(); pintarPregunta(); pintarAcciones(); programarReloj();
      dice('Ahí está. Responde rápido: cada ' + Math.round((B.cadencia || 25000) / 1000) + ' segundos te pega.');
    }).catch(function (e) { fallo(e && e.message ? e.message : e, true); });
  }

  // ──────────────────────────────────────────────────────────── el final
  function final(f) {
    clearTimeout(reloj);
    var gano = f.resultado === 'victoria';
    var cuerpo = '<div class="bt-final ' + (gano ? 'gana' : 'pierde') + '">'
      + '<img class="bt-final-img" src="assets/img/batalla/' + (gano ? 'joran_celebra.jpg' : 'rival_ataque.jpg') + '" alt="">'
      + '<div class="eyebrow amber">' + (gano ? 'RUTA AZUL desconectado' : 'Escudo a cero') + '</div>'
      + '<h2>' + (gano ? '¡Le has ganado!' : 'Te ha ganado… esta vez') + '</h2>'
      + '<p class="bt-marca"><b>' + f.marca + '</b> puntos'
        + (f.nueva ? ' · <span class="bt-nueva">nueva mejor marca</span>' : f.mejor ? ' · tu mejor: ' + f.mejor : '') + '</p>'
      + (gano
          ? (f.reto ? '<p class="bt-sub" id="bt-reg">Registrando tu reto A6…</p>' : '<p class="bt-sub">Buen entrenamiento. Tu marca ya está en el ranking.</p>')
          : '<p class="bt-sub">Cada derrota lo cansa: la próxima vez atacará más despacio. '
            + '«A la ruta azul se juega cien veces, no una.»</p>')
      + '<p class="bt-final-btns"><button class="btn primary" id="bt-otravez">' + (gano ? 'Otra batalla' : 'Volver a intentarlo') + '</button>'
      + '<a class="btn" href="recluta.html?per=' + esc(PER) + '">🚀 Volver a mi Nave</a></p></div>';
    pinta(cuerpo);
    $('#bt-otravez').onclick = function () { cargarEstado(); };
    if (gano) fiesta();
    // el reto A6: lo registra la Nave con la misma puerta de siempre (`completeMission`), ahora que el servidor
    // ya sabe que le ganó. Si hoy ya llevaba su tope de retos, se queda para mañana y lo registra la Nave al entrar.
    if (gano && f.reto && f.joran !== false) registrarA6();
  }
  function registrarA6() {
    var t = $('#bt-reg'); if (!t) return;
    M.getDocs(M.query(M.collection(M.db, 'missions'), M.where('projectId', '==', PER), M.where('stargateId', '==', (CFG.reto || 'A6'))))
      .then(function (r) {
        if (r.empty) throw new Error('sin misión');
        return M.llamar('completeMission', { projectId: PER, missionId: r.docs[0].id, studentProfileId: EST.ficha });
      })
      .then(function () { t.innerHTML = '🏅 <b>Reto A6 registrado</b> y la insignia de Joran es tuya. El simulador ya está en tu Nave.'; })
      .catch(function (e) {
        var ya = /ya/i.test(String(e && e.message));
        t.innerHTML = ya ? '🏅 <b>Ya lo tenías registrado.</b> El simulador está en tu Nave.'
          : '🏅 <b>Victoria guardada.</b> El reto A6 se registrará solo la próxima vez que entres en tu Nave.';
      });
  }
  function fiesta() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var c = document.createElement('canvas'); c.className = 'bt-confeti'; document.body.appendChild(c);
      var g = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight, P = [];
      var COL = ['#37e0ec', '#ffd166', '#7ef0c8', '#ffffff', '#6ea8ff'];
      for (var i = 0; i < 110; i++) P.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3.4, w: 5 + Math.random() * 7, h: 8 + Math.random() * 9, a: Math.random() * Math.PI,
        va: (Math.random() - 0.5) * 0.24, col: COL[(Math.random() * COL.length) | 0] });
      var t0 = performance.now();
      (function paso(t) {
        var vida = t - t0; g.clearRect(0, 0, W, H); var vivas = 0;
        P.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.a += p.va; p.vy += 0.03; if (p.y < H + 40) vivas++;
          g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.globalAlpha = Math.max(0, 1 - vida / 4200);
          g.fillStyle = p.col; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore(); });
        if (vivas && vida < 4200) requestAnimationFrame(paso); else c.remove();
      })(t0);
    } catch (e) {}
  }

  // ──────────────────────────────────────────────────────────── arranque
  function cargarEstado() {
    cargando('Buscando tu ficha…');
    M.batalla('estado', { projectId: PER }).then(function (r) {
      EST = r;
      var luego = function () {
        if (EST.viva) { B = EST.viva; pintarArena(); refrescarHud(); pintarPregunta(); pintarAcciones(); programarReloj();
          dice('Seguimos donde lo dejamos. El reloj no se ha parado.'); return; }
        if (QUIERE && (EST.modos || []).indexOf(QUIERE) >= 0) { var m = QUIERE; QUIERE = ''; return empezar(m); }
        menu();
      };
      if (!EST.ficha) { MIO = null; return leerTipo().then(luego); }
      return M.getDoc(M.doc(M.db, 'student_profiles', EST.ficha)).then(function (d) { MIO = d.exists() ? d.data() : null; })
        .catch(function () {}).then(leerTipo).then(luego);
    }).catch(function (e) { fallo(e && e.message ? e.message : e, true); });
  }
  function leerTipo() {
    return M.getDoc(M.doc(M.db, 'projects', PER)).then(function (p) {
      if (p.exists()) TIPO = ((p.data().stargate || {}).tipo === 'PUA') ? 'PUA' : 'REGULAR';
    }).catch(function () {});
  }
  function mirar(u) {
    var q = u ? u.uid : null; if (q === mirar._v) return; mirar._v = q;
    YO = u;
    if (!YO) return puerta();
    if (PER) return cargarEstado();
    cargando('Buscando tu grupo…');
    M.misGruposDeAlumno(YO.uid).then(function (g) {
      if (!g.length) return otraCuenta((YO.correo || YO.email || ''));
      if (g.length === 1) { PER = g[0].per; return cargarEstado(); }
      elegirGrupo(g);
    }).catch(function (e) { fallo(e && e.message ? e.message : e, true); });
  }
  function arrancar() {
    M = window.SG.MOTOR;
    if (MODO_URL) QUIERE = MODO_URL;
    cargando('Comprobando quién eres…');
    M.sesion().then(mirar).catch(function () { puerta(); });
    document.addEventListener('sg:sesion', function (e) { mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener('sg:motor', arrancar);
})();
