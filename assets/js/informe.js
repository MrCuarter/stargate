// STARGATE — EL INFORME DE LA MISIÓN 1 (CCD, Actividad 1), PARA PROYECTAR. informe-mision1.html[#d3]
//
// 🔴 8-nov-2026 · Norberto: la clase de corrección de la Actividad 1, montada «con el estilo de sesion.html»: portada,
// cifras, la tripulación destacada (nombre de pila + inicial y su actividad, que se ve incrustada), las cinco averías con su dato, un ejemplo real
// anónimo, cómo se repara y el vídeo tutorial incrustado, y el cierre con el QR a la página de clase. Los datos, en
// _informe_mision1.py (window.SG_INFORME).
//
// Mismo mazo que la sesión (.mazo, .lienzo, .nav, .barra-pasos, .ses-ctl, .yt), pero cada diapositiva es una HOJA 16:9 de
// 64 × 36 «em» (la letra sale del ancho de la hoja): se ve igual a 1366 que a 1920 o en una ventana, y nada se corta. En el
// móvil (≤ 900 px) la hoja deja de ser 16:9 y el contenido fluye.
//
// Teclado: → / ← / Av Pág / Re Pág / espacio, Inicio y Fin, F (pantalla completa). La diapositiva va en la dirección (#d5).
(function () {
  var D = window.SG_INFORME, root = document.getElementById('informe-app');
  if (!D || !root) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var PAG = D.pagina, AV = D.averias || [], TR = D.tripulacion || [];
  var IC_PANTALLA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
  var IC_SALIR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></svg>';

  // ---------------------------------------------------------------- las diapositivas
  var S = [];
  var P = D.portada;
  S.push({ rot: 'Portada', html:
    '<div class="inf-d inf-portada"><img class="inf-planeta" src="assets/img/planetas/p1_forge.png" alt="">' +
      '<div class="inf-txt"><div class="kicker">' + esc(P.kicker) + '</div>' +
      '<h1>' + esc(P.titulo) + '</h1><p class="inf-sub">' + esc(P.sub) + '</p>' +
      '<p class="inf-sello"><span>✦</span> ' + esc(P.sello) + '</p></div></div>' });

  S.push({ rot: 'Cifras', html:
    '<div class="inf-d inf-cifras"><div class="kicker">Informe de la Bitácora</div><h2>La misión en cifras</h2>' +
      '<div class="inf-tiles">' + D.cifras.map(function (c, i) {
        var pct = /%$/.test(c[0]) ? parseInt(c[0], 10) : 0;
        return '<div class="inf-tile' + (pct ? ' pct' : '') + '" style="--i:' + i + '">' +
          '<b class="inf-n" data-n="' + esc(parseInt(c[0], 10)) + '" data-suf="' + (pct ? '%' : '') + '">' + esc(c[0]) + '</b>' +
          (pct ? '<span class="inf-barra"><i style="--p:' + pct + '%"></i></span>' : '<span class="inf-barra vacia"></span>') +
          '<span class="inf-et">' + esc(c[1]) + '</span></div>';
      }).join('') + '</div></div>', montar: contar });

  // la tripulación, en dos: 6 y 5
  var mitad = Math.ceil(TR.length / 2);
  [TR.slice(0, mitad), TR.slice(mitad)].forEach(function (grupo, g) {
    if (!grupo.length) return;
    S.push({ rot: 'Tripulación ' + (g + 1), html:
      '<div class="inf-d inf-trip"><div class="inf-cab"><div><div class="kicker">Señal destacada · ' + (g + 1) + ' de 2</div>' +
        '<h2>Tripulación destacada</h2></div><p class="inf-cab-p">' + TR.length + ' trabajos en la galería de lo mejor. Pulsa «Ver su actividad»: se abre aquí mismo.</p></div>' +
        '<div class="inf-cartas">' + grupo.map(function (p, i) {
          return '<article class="inf-carta" style="--i:' + i + '"><h3>' + esc(p[0]) + '</h3>' +
            '<p class="inf-act">' + esc(p[1]) + '</p><p class="inf-por">' + esc(p[2]) + '</p>' +
            (p[4] ? '<button type="button" class="inf-ep" data-visor="' + TR.indexOf(p) + '">Ver su actividad</button>'
                  : '<a class="inf-ep" href="' + esc(p[3]) + '" target="_blank" rel="noopener">Ver su actividad <span aria-hidden="true">↗</span></a>') + '</article>';
        }).join('') + '</div></div>' });
  });

  function ejemplo(e, n, de) {
    return '<div class="inf-ej-caso"><p class="inf-antes"><small>Así lo vimos' + (de > 1 ? ' · caso ' + (n + 1) + ' de ' + de : '') + '</small>«' + esc(e[0]) + '»</p>' +
      '<p class="inf-mejor"><small>Mejor</small>' + e[1] + '</p></div>';
  }
  AV.forEach(function (a, i) {
    var url = PAG + '#' + a.k;
    var izq = '<div class="inf-izq"><div class="kicker inf-k-av">Avería ' + (i + 1) + ' de ' + AV.length + '</div>' +
      '<h2>' + esc(a.titulo) + '</h2>' +
      '<div class="inf-dato">' + (a.pre ? '<small>' + esc(a.pre) + '</small> ' : '') + '<b>' + esc(a.cifra) + '</b> <span>' + esc(a.dato) + '</span></div>' +
      '<p class="inf-pasa">' + esc(a.pasa) + '</p>' +
      '<h4>Así se repara</h4><ul class="inf-rep">' + a.repara.map(function (r) {
        return '<li' + (r[0] ? '' : ' class="sin"') + '>' + (r[0] ? '<i>' + esc(r[0]) + '</i>' : '') + '<span>' + r[1] + '</span></li>';
      }).join('') + '</ul></div>';
    var boton = '<a class="btn primary inf-ir" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(a.boton) + ' <span aria-hidden="true">↗</span></a>';
    var der = a.video
      ? '<div class="inf-der"><div class="yt inf-yt" data-id="' + esc(a.video[0]) + '" role="button" tabindex="0" aria-label="Reproducir el vídeo: ' + esc(a.video[1]) + '">' +
          '<img src="assets/img/informe/' + esc(a.k) + '.jpg" alt="" loading="lazy"><span class="play" aria-hidden="true">▶</span>' +
          '<span class="cap"><em>Vídeo tutorial · 1 min</em><b>' + esc(a.video[1]) + '</b></span></div>' +
          '<div class="inf-ej" data-n="0">' + ejemplo(a.ejemplos[0], 0, a.ejemplos.length) +
            (a.ejemplos.length > 1 ? '<button type="button" class="inf-otro" aria-label="Ver otro caso">Otro caso ›</button>' : '') + '</div>' + boton + '</div>'
      : '<div class="inf-der sin-video"><div class="inf-ej todos">' + a.ejemplos.map(function (e, n) { return ejemplo(e, n, a.ejemplos.length); }).join('') + '</div>' + boton + '</div>';
    S.push({ rot: a.rot, k: a.k, ejemplos: a.ejemplos, html: '<div class="inf-d inf-av' + (a.video ? '' : ' sin-video') + '">' + izq + der + '</div>' });
  });

  var C = D.cierre;
  S.push({ rot: 'Rumbo a la M2', html:
    '<div class="inf-d inf-cierre"><div class="inf-txt"><div class="kicker">Fin del informe</div><h1>' + esc(C.titulo) + '</h1>' +
      '<p class="inf-sub">' + esc(C.texto) + '</p><p class="inf-url">' + esc(C.url.replace(/^https?:\/\//, '')) + '</p>' +
      '<ul class="inf-resumen">' + AV.map(function (a, i) { return '<li><i>' + (i + 1) + '</i>' + esc(a.titulo) + '</li>'; }).join('') + '</ul>' +
      '<a class="btn primary inf-ir" href="' + esc(C.url) + '" target="_blank" rel="noopener">Abrir la página de clase <span aria-hidden="true">↗</span></a></div>' +
      '<figure class="inf-qr"><div class="inf-qr-c" id="inf-qr" aria-label="Código QR a ' + esc(C.url) + '"></div><figcaption>Escanéalo con el móvil</figcaption></figure></div>',
    montar: qr });

  // ---------------------------------------------------------------- lo que se monta al llegar
  function contar(h) {
    var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    Array.prototype.forEach.call(h.querySelectorAll('.inf-n'), function (b) {
      var n = +b.getAttribute('data-n'), suf = b.getAttribute('data-suf') || '';
      if (quieto || !n) return;
      var t0 = null, dur = 1100;
      function paso(t) {
        if (!b.isConnected) return;
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur), v = Math.round(n * (1 - Math.pow(1 - k, 3)));
        b.textContent = v + suf;
        if (k < 1) requestAnimationFrame(paso);
      }
      b.textContent = '0' + suf; requestAnimationFrame(paso);
    });
  }
  function qr(h) {
    var c = h.querySelector('#inf-qr'); if (!c) return;
    var intentos = 0;
    (function poner() {
      if (!c.isConnected) return;
      if (window.QRCode) {
        c.innerHTML = '';
        new QRCode(c, { text: C.url, width: 512, height: 512, colorDark: '#05222a', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
        return;
      }
      // (qrcodejs llega con «defer» desde cdnjs; si no llega, al menos la dirección se lee)
      if (++intentos < 40) setTimeout(poner, 150); else c.innerHTML = '<p class="inf-qr-no">' + esc(C.url) + '</p>';
    })();
  }

  // ---------------------------------------------------------------- el mazo
  var st = { i: 0 };
  var m = /^#d(\d+)$/.exec(location.hash); if (m) st.i = Math.max(0, Math.min(S.length - 1, +m[1] - 1));
  root.innerHTML =
    '<div class="mazo inf" id="mazo" tabindex="0" aria-roledescription="presentación" aria-label="Informe de la Misión 1">' +
      '<div class="lienzo"><div class="inf-hoja" aria-live="polite"></div></div>' +
      '<button type="button" class="nav ant" id="ant" aria-label="Anterior">‹</button>' +
      '<button type="button" class="nav sig" id="sig" aria-label="Siguiente">›</button>' +
      '<div class="barra-pasos">' + S.map(function (d, i) { return '<button type="button" class="p" data-i="' + i + '" title="' + esc(d.rot) + '"><span>' + esc(d.rot) + '</span></button>'; }).join('') + '</div>' +
      '<div class="ses-ctl"><button type="button" class="ses-ic" id="inf-pantalla"></button><div class="cuenta" id="inf-cuenta"></div></div>' +
    '</div>';
  var mazo = root.querySelector('#mazo'), hoja = root.querySelector('.inf-hoja');

  // ---------------------------------------------------------------- el visor: la actividad, incrustada en la diapositiva
  // (9-nov · Norberto: «que al hacer clic se abra el artefacto del estudiante en esa ventana»). Va dentro de #mazo para que
  // también se vea en pantalla completa. Google Sites no deja incrustarse (X-Frame-Options DENY): esos se abren aparte.
  var visor = null, foco = null;
  function abrirVisor(k) {
    var p = TR[k]; if (!p || !p[4]) return;
    cerrarVisor();
    foco = document.activeElement;
    visor = document.createElement('div');
    visor.className = 'inf-visor';
    visor.setAttribute('role', 'dialog'); visor.setAttribute('aria-modal', 'true'); visor.setAttribute('aria-label', 'Actividad de ' + p[0]);
    visor.innerHTML =
      '<div class="inf-visor-cab"><div class="inf-visor-t"><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></div>' +
        '<a class="inf-visor-b" href="' + esc(p[3]) + '" target="_blank" rel="noopener">Abrir aparte <span aria-hidden="true">↗</span></a>' +
        '<button type="button" class="inf-visor-b cerrar" aria-label="Cerrar (Esc)">✕ Cerrar</button></div>' +
      '<div class="inf-visor-marco"><p class="inf-visor-carga">Cargando la actividad…<br><small>Si no aparece, pulsa «Abrir aparte».</small></p>' +
        '<iframe src="' + esc(p[4]) + '" title="Actividad de ' + esc(p[0]) + '" allow="fullscreen; autoplay; clipboard-write" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe></div>';
    mazo.appendChild(visor);
    visor.querySelector('.cerrar').onclick = cerrarVisor;
    visor.onclick = function (e) { if (e.target === visor) cerrarVisor(); };
    requestAnimationFrame(function () { if (visor) visor.classList.add('abierto'); });
    visor.querySelector('.cerrar').focus({ preventScroll: true });
  }
  function cerrarVisor() {
    if (!visor) return;
    visor.remove(); visor = null;
    try { (foco && foco.isConnected ? foco : mazo).focus({ preventScroll: true }); } catch (e) {}
  }
  hoja.addEventListener('click', function (e) { var b = e.target.closest('[data-visor]'); if (b) abrirVisor(+b.getAttribute('data-visor')); });

  function ir(i) {
    i = Math.max(0, Math.min(S.length - 1, i));
    cerrarVisor();
    st.i = i;
    var s = S[i];
    hoja.innerHTML = s.html;
    var d = hoja.firstElementChild; if (d) requestAnimationFrame(function () { d.classList.add('entra'); });
    hoja.querySelectorAll('.yt').forEach(function (y) {
      function play() {
        if (y.classList.contains('on')) return;
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + y.getAttribute('data-id') + '?autoplay=1&rel=0&modestbranding=1';
        f.title = y.getAttribute('aria-label') || 'Vídeo';
        f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
        y.insertBefore(f, y.firstChild); y.classList.add('on'); y.removeAttribute('role'); y.removeAttribute('tabindex');
      }
      y.onclick = play;
      y.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); play(); } };
    });
    var otro = hoja.querySelector('.inf-otro');
    if (otro) otro.onclick = function () {
      var caja = hoja.querySelector('.inf-ej'), n = (+caja.getAttribute('data-n') + 1) % s.ejemplos.length;
      caja.setAttribute('data-n', n);
      caja.querySelector('.inf-ej-caso').outerHTML = ejemplo(s.ejemplos[n], n, s.ejemplos.length);
    };
    if (s.montar) s.montar(hoja);
    Array.prototype.forEach.call(root.querySelectorAll('.barra-pasos .p'), function (b, k) {
      b.classList.toggle('on', k === i); b.classList.toggle('past', k < i);
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    root.querySelector('#inf-cuenta').textContent = (i + 1) + ' / ' + S.length;
    root.querySelector('#ant').disabled = i === 0; root.querySelector('#sig').disabled = i === S.length - 1;
    try { history.replaceState(null, '', '#d' + (i + 1)); } catch (e) {}
  }
  root.querySelector('#ant').onclick = function () { ir(st.i - 1); };
  root.querySelector('#sig').onclick = function () { ir(st.i + 1); };
  root.querySelector('.barra-pasos').onclick = function (e) { var b = e.target.closest('.p'); if (b) ir(+b.getAttribute('data-i')); };

  // ---------------------------------------------------------------- pantalla completa (la de la sesión)
  function enPantalla() { return !!(document.fullscreenElement || document.webkitFullscreenElement) || document.body.classList.contains('proyectando'); }
  function marcar() {
    var b = root.querySelector('#inf-pantalla'), fs = enPantalla();
    b.innerHTML = fs ? IC_SALIR : IC_PANTALLA;
    b.title = fs ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)';
    b.setAttribute('aria-label', fs ? 'Salir de pantalla completa' : 'Pantalla completa');
  }
  function pantalla() {
    if (document.body.classList.contains('proyectando')) { document.body.classList.remove('proyectando'); marcar(); return; }
    if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    var falla = function () { document.body.classList.add('proyectando'); marcar(); };
    var pide = mazo.requestFullscreen || mazo.webkitRequestFullscreen;
    if (!pide) falla(); else { try { var r = pide.call(mazo); if (r && r.catch) r.catch(falla); } catch (e) { falla(); } }
    try { mazo.focus({ preventScroll: true }); } catch (e) {}
  }
  root.querySelector('#inf-pantalla').onclick = pantalla;
  Array.prototype.forEach.call(document.querySelectorAll('[data-inf-proyectar]'), function (b) { b.onclick = pantalla; });
  document.addEventListener('fullscreenchange', marcar);
  document.addEventListener('webkitfullscreenchange', marcar);

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (visor) { if (e.key === 'Escape') { e.preventDefault(); cerrarVisor(); } return; }
    if (e.key === 'Escape' && document.body.classList.contains('proyectando')) { document.body.classList.remove('proyectando'); marcar(); return; }
    // (en un botón o enlace, el espacio y el Intro son suyos)
    if ((e.key === ' ' || e.key === 'Enter') && t && t.closest && t.closest('a,button,[role=button]')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); ir(st.i + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); ir(st.i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); ir(0); }
    else if (e.key === 'End') { e.preventDefault(); ir(S.length - 1); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); pantalla(); }
  });
  // (un enlace a #d6 desde la misma página también mueve el mazo)
  window.addEventListener('hashchange', function () { var h = /^#d(\d+)$/.exec(location.hash); if (h && +h[1] - 1 !== st.i) ir(+h[1] - 1); });
  marcar();
  ir(st.i);
})();
