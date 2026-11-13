/**
 * GAMIFICAPRO · LA LUPA DE LA CLASE (13-nov-2026) — pieza del motor para cualquier mod.
 *
 * Norberto (13-nov, tras las clases en directo de STARGATE y DPG): «estudiantes que decían que se veía muy pequeño y no se podía
 * ampliar […] había pensado el poder poner una lupita […] para ampliar determinadas zonas. Y por supuesto estaría genial que ya de
 * serie si hiciera clic en ciertas partes donde hubiera texto, pues se pudiera ampliar». El alumnado ve la clase por la pantalla
 * compartida (Zoom, Teams, Meet): no puede ampliarla. Quien amplía es el docente, y lo ampliado es lo que sale en la pantalla
 * compartida (y, con el modo presentador, en la ventana de la presentación).
 *
 * Tres maneras de ver más grande, sobre la diapositiva (la «zona»), sin diálogos ni menús:
 *   1. AMPLIAR AL PULSAR (el lector): pulsar un bloque con texto (una tarjeta, un párrafo, una imagen…) lo abre grande encima de
 *      la diapositiva, con el mismo aspecto (se copia con la cadena de sus contenedores, para que su estilo sea el mismo). Se cierra
 *      pulsando en cualquier sitio, con la ×, con Esc o con 0. Lo que es de pulsar (botones, enlaces, vídeos…) sigue igual.
 *   2. LA LUPA: el botón de la lupa la enciende (un aro sigue al ratón: lo que va a ampliarse); un clic amplía la diapositiva
 *      entera ×2,5 sobre ese punto y otro clic vuelve a 1×. Con la lupa encendida no se abre el lector.
 *   3. PELLIZCO Y CTRL + RUEDA (el pellizco del trackpad del Mac llega así) sobre la zona amplían la diapositiva, no la página.
 *      Ampliada, se arrastra para moverse; Esc o 0 vuelven a 1×. En el táctil, el pellizco con dos dedos.
 *
 * La vista es { x, y, k }: el centro de lo que se ve (0-1 sobre la diapositiva, sin depender del tamaño de la ventana) y cuánto
 * se amplía (1 = sin ampliar, hasta `max`). Así la ventana del mando y la de la presentación, de tamaños distintos, ven lo mismo.
 * El lector va por su RUTA (los índices de hijo desde la zona hasta el bloque): el mismo bloque en las dos ventanas.
 * La pieza no manda nada por ningún canal: avisa (`alCambiar`, `alLector`) y el mod lo lleva (p. ej., por el canal del
 * presentador; 🔴 nunca por el directo de Firestore: cada zoom sería una escritura).
 *
 * Lo puro (lo prueba tests/sdk/lupa.test.ts):
 *   GP.lupa.limitar(v, max)              → { x, y, k } dentro de los topes: k en [1, max]; con k, el centro no deja ver fuera.
 *   GP.lupa.desplazamiento(v, ancho, alto) → { tx, ty, k }: la traslación en px (antes de escalar) que pone esa vista.
 *   GP.lupa.zoomEn(v, px, py, k, max)     → la vista con k, quieto el punto (px, py) de la pantalla (0-1 sobre la zona).
 *   GP.lupa.mover(v, dx, dy, max)         → la vista desplazada (dx, dy en fracción de la zona, como el arrastre).
 *   GP.lupa.ruta(desde, el) / GP.lupa.nodo(desde, ruta) → los índices de hijo y vuelta.
 *   GP.lupa.tamLector(bw, bh, ancho, alto, o) → { ancho, k }: el ancho del bloque abierto (se deja reflowar si es muy ancho) y su
 *       ampliación: la mayor que cabe, sin pasar de `o.tope` (3).
 *
 * En la página:
 *   GP.lupa.poner(zona, o) → { vista(v?), abrir(ruta | null), lector(), lupa(on?), reiniciar(), quitar(), boton }
 *       zona        elemento o selector (con selector se vuelve a buscar en cada gesto: la web puede repintarla)
 *       o.lienzo    lo que se transforma, dentro de la zona: selector o función (zona) → elemento (por defecto, su primer hijo)
 *       o.evitar    lo que no se toca (se pulsa como siempre). Por defecto: a, button, input, select, textarea, label, summary,
 *                   iframe, video, audio, canvas, [contenteditable], [role=button], [data-gpz-no]
 *       o.bloques   lo que se abre al pulsar. Por defecto: p, li, h1-h4, blockquote, figure, img, table, pre, [data-gpz]. Se
 *                   elige el de fuera del todo que no ocupe casi toda la diapositiva (una tarjeta entera, no su párrafo)
 *       o.pulsar    false: sin lector (por defecto, true)
 *       o.boton     elemento donde se pone el botón de la lupa (sin él, la web pone el suyo con el atributo data-gpz-lupa:
 *                   GP.lupa.botonHTML(o) da uno). o.icono: url del icono (sin él, una lupa de línea)
 *       o.max       la ampliación mayor (4) · o.paso: la del clic con la lupa (2.5)
 *       o.alCambiar(v) · o.alLector(ruta | null): lo que hizo la persona (no lo que llega con vista() o abrir())
 *       o.textos    { lupa, lupaOn, cerrar, pista }
 *   Al cambiar de diapositiva (otro lienzo dentro de la zona) todo vuelve a 1× solo, sin avisar.
 *
 * Táctil: el botón y la × miden 40 px; funciona a 320 px de ancho. Cada web la copia en su build y NO se edita allí: aquí.
 * La piel, con variables --gpz-* (valores por defecto abajo).
 */
(function (raiz, fabrica) {
  var Z = fabrica(raiz);
  if (typeof module === "object" && module.exports) module.exports = Z;
  if (raiz) { raiz.GP = raiz.GP || {}; if (!raiz.GP.lupa) raiz.GP.lupa = Z; }
})(typeof window !== "undefined" ? window : null, function (W) {
  "use strict";
  var MAX = 4, PASO = 2.5;
  var EVITAR = "a,button,input,select,textarea,label,summary,iframe,video,audio,canvas,[contenteditable],[role=button],[data-gpz-no],.gpz-lector,.gpz-aro";
  var BLOQUES = "p,li,h1,h2,h3,h4,blockquote,figure,img,table,pre,[data-gpz]";
  var TEXTOS = { lupa: "Lupa: pulsa donde quieras ampliar", lupaOn: "Quitar la lupa", cerrar: "Cerrar", pista: "Pulsa para ampliar" };

  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
  function entre(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function limitar(v, max) {
    v = v || {}; max = num(max, MAX) > 1 ? num(max, MAX) : MAX;
    var k = entre(num(v.k, 1), 1, max);
    if (k <= 1.0001) return { x: 0.5, y: 0.5, k: 1 };
    var m = 1 / (2 * k);
    return { x: entre(num(v.x, 0.5), m, 1 - m), y: entre(num(v.y, 0.5), m, 1 - m), k: Math.round(k * 1000) / 1000 };
  }
  function desplazamiento(v, ancho, alto) {
    v = limitar(v);
    return { tx: ancho / 2 - v.x * ancho * v.k, ty: alto / 2 - v.y * alto * v.k, k: v.k };
  }
  function zoomEn(v, px, py, k, max) {
    v = limitar(v, max);
    var izq = v.x - 1 / (2 * v.k), arr = v.y - 1 / (2 * v.k);
    var cx = izq + entre(num(px, 0.5), 0, 1) / v.k, cy = arr + entre(num(py, 0.5), 0, 1) / v.k;   // el punto, en la diapositiva
    var k2 = limitar({ k: k }, max).k;
    return limitar({ x: cx - entre(num(px, 0.5), 0, 1) / k2 + 1 / (2 * k2), y: cy - entre(num(py, 0.5), 0, 1) / k2 + 1 / (2 * k2), k: k2 }, max);
  }
  function mover(v, dx, dy, max) {
    v = limitar(v, max);
    return limitar({ x: v.x - num(dx, 0) / v.k, y: v.y - num(dy, 0) / v.k, k: v.k }, max);
  }
  function ruta(desde, el) {
    var r = [];
    while (el && el !== desde) {
      var p = el.parentNode; if (!p || !p.children) return null;
      r.unshift(Array.prototype.indexOf.call(p.children, el)); el = p;
    }
    return el === desde ? r : null;
  }
  function nodo(desde, r) {
    var el = desde;
    for (var i = 0; el && r && i < r.length; i++) el = el.children ? el.children[r[i]] : null;
    return r && r.length ? el || null : null;
  }
  function tamLector(bw, bh, ancho, alto, o) {
    o = o || {}; var tope = num(o.tope, 3), meta = num(o.meta, 2);
    bw = Math.max(1, num(bw, 1)); bh = Math.max(1, num(bh, 1));
    var w = Math.min(bw, (ancho * 0.9) / meta);          // muy ancho (un párrafo a lo ancho): se estrecha para poder crecer
    var h = num(o.altoA ? o.altoA(w) : bh * (bw / w), bh);   // y, más estrecho, más alto (lo mide la página)
    var k = Math.min((ancho * 0.92) / w, (alto * 0.86) / Math.max(1, h), tope);
    return { ancho: Math.round(w), k: Math.max(1, Math.round(k * 100) / 100) };
  }
  function botonHTML(o) {
    o = o || {}; var t = Object.assign({}, TEXTOS, o.textos || {});
    var ico = o.icono ? '<img src="' + String(o.icono).replace(/"/g, "&quot;") + '" alt="" width="22" height="22">' : ICO;
    return '<button type="button" class="gpz-b' + (o.clase ? " " + o.clase : "") + '" data-gpz-lupa aria-pressed="false" title="' + t.lupa + '" aria-label="' + t.lupa + '">' + ico + "</button>";
  }
  var ICO = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15 15l5.5 5.5M10 7.2v5.6M7.2 10h5.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

  var CSS =
    ".gpz-zona-on{position:relative}" +
    ".gpz-ampliada{overflow:hidden!important;touch-action:none}" +
    ".gpz-capa{transform-origin:0 0}" +
    ".gpz-lupa-on .gpz-zona-on{cursor:zoom-in}.gpz-lupa-on .gpz-ampliada{cursor:zoom-out}" +
    ".gpz-arrastra{cursor:grabbing!important}" +
    ".gpz-aro{position:absolute;z-index:40;pointer-events:none;border-radius:50%;border:3px solid var(--gpz-acento,#37e0ec);box-shadow:0 0 0 2000px rgba(0,0,0,.18),0 0 18px var(--gpz-acento,#37e0ec);transform:translate(-50%,-50%)}" +
    ".gpz-lector{position:absolute;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:var(--gpz-velo,rgba(4,8,14,.78));cursor:zoom-out;animation:gpz-in .18s ease-out}" +
    ".gpz-lector-caja{position:relative;max-width:100%;max-height:100%;overflow:hidden;border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,.55),0 0 0 2px var(--gpz-acento,#37e0ec)}" +
    ".gpz-lector-x{position:absolute;top:8px;right:8px;z-index:2;min-width:40px;min-height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.55);color:#fff;font:600 22px/1 system-ui,sans-serif;cursor:pointer}" +
    ".gpz-cadena{display:block!important;position:static!important;margin:0!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;transform:none!important;overflow:visible!important;columns:auto!important;animation:none!important}" +
    ".gpz-solo{margin:0!important;max-width:none!important;max-height:none!important;animation:none!important;opacity:1!important;transform:none!important;-webkit-line-clamp:unset!important;line-clamp:unset!important;overflow:visible!important}" +
    ".gpz-solo *{-webkit-line-clamp:unset!important;line-clamp:unset!important;animation:none!important}" +
    ".gpz-puede{outline:2px dashed var(--gpz-acento,#37e0ec);outline-offset:3px;cursor:zoom-in}" +
    ".gpz-b{display:inline-flex;align-items:center;justify-content:center;min-width:40px;min-height:40px;padding:0 8px;border-radius:10px;cursor:pointer}" +
    ".gpz-b img{display:block;width:24px;height:24px;object-fit:contain}" +
    ".gpz-b[aria-pressed=true]{outline:2px solid var(--gpz-acento,#37e0ec);outline-offset:1px}" +
    "@keyframes gpz-in{from{opacity:0}to{opacity:1}}" +
    "@media (prefers-reduced-motion:reduce){.gpz-lector{animation:none}}";
  function estilo(doc) {
    if (!doc || doc.getElementById("gpz-css")) return;
    var s = doc.createElement("style"); s.id = "gpz-css"; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s);
  }

  function poner(zonaSel, o) {
    o = o || {};
    var doc = W.document, html = doc.documentElement, t = Object.assign({}, TEXTOS, o.textos || {});
    var max = num(o.max, MAX), paso = num(o.paso, PASO), evitar = o.evitar || EVITAR, bloques = o.bloques || BLOQUES;
    estilo(doc);
    var st = { v: { x: 0.5, y: 0.5, k: 1 }, capa: null, lupa: false, lector: null, rutaL: null, aro: null, pp: {}, arr: null, comer: false };
    function zona() { return typeof zonaSel === "string" ? doc.querySelector(zonaSel) : zonaSel; }
    function capaDe(z) {
      if (!z) return null;
      if (typeof o.lienzo === "function") return o.lienzo(z);
      if (typeof o.lienzo === "string") return z.querySelector(o.lienzo);
      return z.firstElementChild;
    }
    function dentro(ev) { var z = zona(); return z && ev.target && ev.target.closest && z.contains(ev.target) ? z : null; }
    // otra diapositiva (otra capa): todo a 1× sin avisar
    function alDia() {
      var z = zona(), c = capaDe(z);
      if (c !== st.capa) {
        if (st.capa) quitarTransform(st.capa); st.capa = c; st.v = { x: 0.5, y: 0.5, k: 1 }; cerrarLector(true);
        if (z) z.classList.remove("gpz-ampliada"); if (st.aro) st.aro.hidden = true;
      }
      if (z) z.classList.add("gpz-zona-on");
      vigilar(z);
      return z;
    }
    // (al cambiar de diapositiva dentro de la misma zona, al momento: no espera al siguiente gesto)
    var mo = null, zonaVista = null;
    function vigilar(z) {
      if (z === zonaVista || !W.MutationObserver) return;
      if (mo) mo.disconnect(); zonaVista = z; mo = null;
      if (z) { mo = new W.MutationObserver(function () { if (capaDe(zona()) !== st.capa) alDia(); }); mo.observe(z, { childList: true }); }
    }
    function quitarTransform(c) { try { c.style.transform = ""; c.style.transition = ""; c.classList.remove("gpz-capa"); } catch (e) { /* nada */ } }
    function zoomCapa(c) { var zc = parseFloat(W.getComputedStyle(c).zoom); return zc > 0 ? zc : 1; }
    function pintar(suave) {
      var z = alDia(), c = st.capa; if (!z || !c) return;
      var amp = st.v.k > 1;
      z.classList.toggle("gpz-ampliada", amp);
      if (!amp) { quitarTransform(c); return; }
      var d = desplazamiento(st.v, z.clientWidth, z.clientHeight), zc = zoomCapa(c);
      c.classList.add("gpz-capa");
      c.style.transition = suave ? "transform .28s ease-out" : "none";
      // (con zoom CSS en la capa, la traslación va en sus px: se divide)
      c.style.transform = "translate(" + (d.tx / zc).toFixed(2) + "px," + (d.ty / zc).toFixed(2) + "px) scale(" + d.k + ")";
    }
    function poner_(v, suave, avisar) {
      var nv = limitar(v, max), cambia = nv.k !== st.v.k || nv.x !== st.v.x || nv.y !== st.v.y;
      st.v = nv; pintar(suave); aro();
      if (cambia && avisar && typeof o.alCambiar === "function") o.alCambiar({ x: nv.x, y: nv.y, k: nv.k });
    }
    function relativo(z, ev) { var r = z.getBoundingClientRect(); return { px: (ev.clientX - r.left) / (r.width || 1), py: (ev.clientY - r.top) / (r.height || 1), r: r }; }

    // ── el lector
    function bloqueDe(objetivo, z, c) {
      var area = (z.clientWidth || 1) * (z.clientHeight || 1), elegido = null, el = objetivo;
      while (el && el !== c && el !== z) {
        if (el.matches && el.matches(bloques)) {
          var r = el.getBoundingClientRect();
          if (r.width * r.height < area * 0.7) elegido = el;   // el de fuera del todo que no ocupe casi toda la diapositiva
        }
        el = el.parentElement;
      }
      return elegido;
    }
    function cerrarLector(callado) {
      if (!st.lector) return;
      try { st.lector.remove(); } catch (e) { /* nada */ }
      st.lector = null; st.rutaL = null;
      if (!callado && typeof o.alLector === "function") o.alLector(null);
    }
    function abrirLector(b, avisar) {
      var z = alDia(), c = st.capa; if (!z || !c || !b) return;
      cerrarLector(true);
      var r = b.getBoundingClientRect(), zc = zoomCapa(c), s = st.v.k > 1 ? st.v.k : 1;
      var bw = r.width / zc / s, bh = r.height / zc / s;   // su tamaño en los px de la capa
      // la cadena: copias vacías de sus contenedores (sus clases, para que el estilo sea el mismo) y el bloque entero
      var copia = b.cloneNode(true); copia.classList.add("gpz-solo"); copia.classList.remove("gpz-puede");
      Array.prototype.forEach.call(copia.querySelectorAll ? copia.querySelectorAll("[id]") : [], function (x) { x.removeAttribute("id"); });
      copia.removeAttribute && copia.removeAttribute("id");
      var cima = copia, p = b.parentElement;
      while (p && p !== z) { var e = p.cloneNode(false); e.removeAttribute("id"); e.classList.add("gpz-cadena"); e.appendChild(cima); cima = e; if (p === c) break; p = p.parentElement; }
      var velo = doc.createElement("div"); velo.className = "gpz-lector"; velo.setAttribute("role", "dialog"); velo.setAttribute("aria-label", t.pista);
      var caja = doc.createElement("div"); caja.className = "gpz-lector-caja";
      var x = doc.createElement("button"); x.type = "button"; x.className = "gpz-lector-x"; x.setAttribute("aria-label", t.cerrar); x.textContent = "×";
      var cs = W.getComputedStyle(b);
      var fondo = cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) ? cs.backgroundColor : W.getComputedStyle(c).backgroundColor;
      caja.style.background = fondo && !/rgba\(0, 0, 0, 0\)|transparent/.test(fondo) ? fondo : "var(--gpz-fondo,#0b1220)";
      caja.appendChild(cima); velo.appendChild(caja); velo.appendChild(x);
      z.appendChild(velo);
      // el tamaño: si es muy ancho, más estrecho para poder crecer; y la mayor ampliación que cabe
      copia.style.boxSizing = "border-box";
      var tam = tamLector(bw, bh, z.clientWidth / zc, z.clientHeight / zc, {
        altoA: function (w) { copia.style.width = w + "px"; return copia.getBoundingClientRect().height || bh; },
      });
      copia.style.width = tam.ancho + "px";
      if (/^IMG$/i.test(b.tagName)) { copia.style.height = "auto"; }
      caja.style.zoom = String(tam.k * zc);
      if (!/^IMG$/i.test(b.tagName)) copia.style.padding = cs.padding === "0px" ? "0.6em 0.9em" : cs.padding;
      st.lector = velo; st.rutaL = ruta(z, b);
      velo.addEventListener("click", function (ev) { ev.stopPropagation(); ev.preventDefault(); cerrarLector(false); });
      if (avisar && typeof o.alLector === "function") o.alLector(st.rutaL);
    }

    // ── el aro de la lupa
    function aro(ev) {
      var z = zona();
      var ver = st.lupa && st.v.k <= 1 && z && ev !== null;
      if (!ver) { if (st.aro) st.aro.hidden = true; return; }
      if (!st.aro || !z.contains(st.aro)) { st.aro = doc.createElement("div"); st.aro.className = "gpz-aro"; st.aro.hidden = true; z.appendChild(st.aro); }
      if (!ev) return;
      var p = relativo(z, ev), d = Math.round(Math.min(p.r.width, p.r.height) / paso);
      st.aro.style.width = st.aro.style.height = d + "px";
      st.aro.style.left = (ev.clientX - p.r.left) + "px"; st.aro.style.top = (ev.clientY - p.r.top) + "px";
      st.aro.hidden = false;
    }
    function lupa(on) {
      st.lupa = on == null ? !st.lupa : !!on;
      html.classList.toggle("gpz-lupa-on", st.lupa);
      Array.prototype.forEach.call(doc.querySelectorAll("[data-gpz-lupa]"), function (b) {
        b.setAttribute("aria-pressed", String(st.lupa)); b.classList.toggle("on", st.lupa);
        b.title = st.lupa ? t.lupaOn : t.lupa; b.setAttribute("aria-label", b.title);
      });
      if (!st.lupa) { if (st.aro) st.aro.hidden = true; if (st.v.k > 1) poner_({ k: 1 }, true, true); }
      else cerrarLector(false);
      return st.lupa;
    }

    // ── los gestos (en el documento: la zona puede repintarse)
    function enClic(ev) {
      if (ev.target && ev.target.closest && ev.target.closest("[data-gpz-lupa]")) { ev.preventDefault(); lupa(); return; }
      var z = dentro(ev); if (!z) return;
      if (st.comer) { st.comer = false; ev.preventDefault(); ev.stopPropagation(); return; }   // (era un arrastre)
      alDia(); var c = st.capa; if (!c) return;
      if (st.lupa) {
        if (ev.target.closest(".gpz-lector")) return;
        ev.preventDefault(); ev.stopPropagation();
        if (st.v.k > 1) poner_({ k: 1 }, true, true);
        else { var p = relativo(z, ev); poner_(zoomEn(st.v, p.px, p.py, paso, max), true, true); }
        return;
      }
      if (o.pulsar === false || !c.contains(ev.target) || ev.target.closest(evitar)) return;
      try { var sel = W.getSelection && W.getSelection(); if (sel && String(sel) && !sel.isCollapsed) return; } catch (e) { /* nada */ }
      var b = bloqueDe(ev.target, z, c); if (!b) return;
      ev.preventDefault(); ev.stopPropagation();
      abrirLector(b, true);
    }
    function enRueda(ev) {
      if (!ev.ctrlKey) return; var z = dentro(ev); if (!z) return;
      ev.preventDefault(); alDia(); cerrarLector(false);
      var p = relativo(z, ev), f = Math.exp(-num(ev.deltaY, 0) * 0.012);
      poner_(zoomEn(st.v, p.px, p.py, st.v.k * f, max), false, true);
    }
    function enBajar(ev) {
      var z = dentro(ev); if (!z) return;
      st.pp[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      var ids = Object.keys(st.pp);
      if (ids.length === 2) {   // el pellizco
        var a = st.pp[ids[0]], b = st.pp[ids[1]];
        st.arr = { pellizco: true, d: Math.hypot(a.x - b.x, a.y - b.y) || 1, k: st.v.k };
        z.classList.add("gpz-ampliada");   // (que el navegador no desplace mientras)
        return;
      }
      if (st.v.k > 1 && (ev.pointerType !== "mouse" || ev.button === 0) && !(ev.target.closest && ev.target.closest(".gpz-lector"))) {
        st.arr = { x: ev.clientX, y: ev.clientY, v: st.v, movido: false };
      }
    }
    function enMover(ev) {
      if (st.lupa) aro(ev);
      if (!st.arr) return;
      var z = zona(); if (!z) return;
      if (st.pp[ev.pointerId]) st.pp[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      if (st.arr.pellizco) {
        var ids = Object.keys(st.pp); if (ids.length < 2) return;
        var a = st.pp[ids[0]], b = st.pp[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        var p = relativo(z, { clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
        ev.preventDefault(); poner_(zoomEn(st.v, p.px, p.py, st.arr.k * d / st.arr.d, max), false, true);
        return;
      }
      var dx = ev.clientX - st.arr.x, dy = ev.clientY - st.arr.y;
      if (!st.arr.movido && Math.abs(dx) + Math.abs(dy) < 6) return;
      st.arr.movido = true; z.classList.add("gpz-arrastra"); ev.preventDefault();
      poner_(mover(st.arr.v, dx / (z.clientWidth || 1), dy / (z.clientHeight || 1), max), false, true);
    }
    function enSoltar(ev) {
      delete st.pp[ev.pointerId];
      if (!st.arr) return;
      var z = zona(); if (z) z.classList.remove("gpz-arrastra");
      if (st.arr.pellizco) { if (Object.keys(st.pp).length < 2) { st.arr = null; pintar(false); } return; }
      if (st.arr.movido) st.comer = true;   // el clic que llega detrás no cuenta
      st.arr = null;
    }
    function enTecla(ev) {
      if (ev.defaultPrevented || ev.altKey || ev.metaKey || ev.ctrlKey) return;
      var a = doc.activeElement; if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
      if (ev.key !== "Escape" && ev.key !== "0") return;
      if (st.lector) { ev.preventDefault(); ev.stopPropagation(); cerrarLector(false); return; }
      if (st.v.k > 1) { ev.preventDefault(); ev.stopPropagation(); poner_({ k: 1 }, true, true); return; }
      if (st.lupa && ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); lupa(false); }
    }
    function enEncima(ev) {   // la pista: el bloque que se abriría, marcado
      if (st.lupa || o.pulsar === false || ev.pointerType === "touch") return;
      var prev = doc.querySelector(".gpz-puede"); if (prev) prev.classList.remove("gpz-puede");
      var z = dentro(ev); if (!z || st.lector) return;
      alDia(); var c = st.capa; if (!c || !c.contains(ev.target) || ev.target.closest(evitar)) return;
      var b = bloqueDe(ev.target, z, c); if (b) b.classList.add("gpz-puede");
    }
    function enSalir(ev) { if (st.aro && !dentro(ev)) st.aro.hidden = true; }
    var reaj = function () { if (st.v.k > 1) pintar(false); };
    doc.addEventListener("click", enClic);
    doc.addEventListener("wheel", enRueda, { passive: false });
    doc.addEventListener("pointerdown", enBajar);
    doc.addEventListener("pointermove", enMover, { passive: false });
    doc.addEventListener("pointerup", enSoltar); doc.addEventListener("pointercancel", enSoltar);
    doc.addEventListener("keydown", enTecla, true);
    doc.addEventListener("pointerover", enEncima); doc.addEventListener("pointerout", enSalir);
    W.addEventListener("resize", reaj);
    // el pellizco del navegador, fuera de la zona no (dentro, lo hace la pieza)
    if (typeof zonaSel === "string") { var s2 = doc.createElement("style"); s2.textContent = zonaSel + "{touch-action:pan-x pan-y}"; (doc.head || html).appendChild(s2); var reglaTactil = s2; }
    else if (zonaSel && zonaSel.style) zonaSel.style.touchAction = "pan-x pan-y";

    var boton = null;
    if (o.boton) { var tmp = doc.createElement("div"); tmp.innerHTML = botonHTML(o); boton = tmp.firstChild; o.boton.appendChild(boton); }
    alDia();
    return {
      vista: function (v) { if (v === undefined) return { x: st.v.x, y: st.v.y, k: st.v.k }; alDia(); if (st.lector && v && v.k > 1) cerrarLector(true); poner_(v || { k: 1 }, true, false); return st.v; },
      abrir: function (r) { var z = alDia(); if (!r || !r.length) { cerrarLector(true); return null; } var b = z && nodo(z, r); if (b) abrirLector(b, false); return st.rutaL; },
      lector: function () { return st.rutaL; },
      lupa: lupa,
      reiniciar: function () { cerrarLector(true); poner_({ k: 1 }, false, false); },
      boton: boton,
      quitar: function () {
        cerrarLector(true); if (st.capa) quitarTransform(st.capa); lupa(false); if (mo) mo.disconnect();
        doc.removeEventListener("click", enClic); doc.removeEventListener("wheel", enRueda); doc.removeEventListener("pointerdown", enBajar);
        doc.removeEventListener("pointermove", enMover); doc.removeEventListener("pointerup", enSoltar); doc.removeEventListener("pointercancel", enSoltar);
        doc.removeEventListener("keydown", enTecla, true); doc.removeEventListener("pointerover", enEncima); doc.removeEventListener("pointerout", enSalir);
        W.removeEventListener("resize", reaj);
        if (reglaTactil) reglaTactil.remove(); if (boton) boton.remove(); if (st.aro) st.aro.remove();
      },
    };
  }

  return { limitar: limitar, desplazamiento: desplazamiento, zoomEn: zoomEn, mover: mover, ruta: ruta, nodo: nodo, tamLector: tamLector,
    botonHTML: botonHTML, poner: poner, TEXTOS: TEXTOS, EVITAR: EVITAR, BLOQUES: BLOQUES, CSS: CSS, MAX: MAX, PASO: PASO };
});
