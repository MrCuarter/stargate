/**
 * GAMIFICAPRO · ORDENAR ARRASTRANDO (10-oct-2026) — pieza del motor para cualquier mod.
 *
 * Norberto, de la rueda «Configurar las diapositivas» de STARGATE: «además de que el docente pueda marcar las diapositivas que
 * quiere ver, estaría genial que las pudiera reorganizar de forma sencilla arrastrando». Eligió (10-oct) mover SECCIONES, con un
 * orden que vale para todas las semanas; en DPG, «Preparar» ordena las diapositivas de cada sesión. Las dos cosas son lo mismo:
 * una lista que se arrastra y un orden guardado que se aplica a lo que se proyecta.
 *
 * Lo puro (lo prueba tests/sdk/ordena.test.ts):
 *   GP.ordena.fusionar(orden, base)  → las claves de `base` en el orden del docente. Las que `orden` no conoce (una sección nueva
 *                                       de la web) van detrás de la que tienen delante en `base`; las que `base` ya no tiene, fuera.
 *   GP.ordena.aplicar(lista, claveDe, orden, { base, fijo })
 *                                    → `lista` en el orden guardado, SIN tocar el original. Sin orden guardado, la misma lista tal
 *                                       cual (da exactamente lo de siempre). Lo de una misma clave va junto y en su orden de
 *                                       siempre. Lo que no tiene clave conocida va pegado a lo de delante. `fijo(x)`: lo que lo
 *                                       cumple al principio y al final se queda donde está (la portada, el ticket del final…).
 *
 * El arrastre (en el navegador; cómo se ve, en las webs que la usan):
 *   GP.ordena.lista(caja, { alCambiar(orden) })
 *       Los hijos de `caja` con `data-ordena="<clave>"` se mueven arrastrando su asa (`[data-ordena-asa]`, un <button>), con
 *       ratón o con el dedo (pointer events; el asa lleva touch-action:none y mide 40 px), y con el teclado: en el asa, ↑ ↓ (o
 *       ← →), Inicio y Fin. Vale para una lista y para una rejilla de varias columnas (se coloca en orden de lectura). Lo demás
 *       de la caja (un título, una casilla fija) no se mueve. Al soltar, si el orden ha cambiado, `alCambiar([claves])`.
 *       → { orden(), destruir() }
 *   GP.ordena.CSS: el estilo, sin piel (`--gpo-sombra`, `--gpo-asa`). Se pone solo la primera vez.
 *
 * Cada web la copia en su build (assets/js/ordena.js, con `guardas.copiar_pieza`) y NO se edita allí: aquí.
 */
(function () {
  if (window.GP && window.GP.ordena) return;   // (copiada en dos sitios de la misma página: una sola vez)

  var CSS = "[data-ordena-asa]{touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;" +
    "min-width:40px;min-height:40px;display:inline-grid;place-items:center;flex:none;padding:0;border:0;border-radius:8px;" +
    "background:transparent;color:var(--gpo-asa,currentColor);font:inherit;font-size:1.2rem;line-height:1}" +
    "[data-ordena-asa]:focus-visible{outline:2px solid currentColor;outline-offset:1px}" +
    "[data-ordena].gpo-arrastra{position:relative;z-index:5;box-shadow:var(--gpo-sombra,0 8px 24px rgba(0,0,0,.45));" +
    "opacity:.96;transition:none}[data-ordena].gpo-arrastra [data-ordena-asa]{cursor:grabbing}" +
    "html.gpo-arrastrando,html.gpo-arrastrando *{cursor:grabbing!important;user-select:none!important}";

  // ───────────────────────────────────────────────────────────────────────────────── lo puro
  function unicas(a) {
    var out = [];
    (Array.isArray(a) ? a : []).forEach(function (k) { k = String(k); if (out.indexOf(k) < 0) out.push(k); });
    return out;
  }
  function fusionar(orden, base) {
    base = unicas(base);
    var out = unicas(orden).filter(function (k) { return base.indexOf(k) >= 0; });
    base.forEach(function (k, i) {
      if (out.indexOf(k) >= 0) return;
      // detrás de la que tiene delante en `base` (la primera que ya esté); si no hay ninguna, al principio
      for (var j = i - 1; j >= 0; j--) { var p = out.indexOf(base[j]); if (p >= 0) { out.splice(p + 1, 0, k); return; } }
      out.unshift(k);
    });
    return out;
  }
  function aplicar(lista, claveDe, orden, op) {
    lista = Array.isArray(lista) ? lista.slice() : [];
    orden = unicas(orden);
    if (!orden.length || lista.length < 2) return lista;
    op = op || {};
    var fijo = typeof op.fijo === "function" ? op.fijo : function () { return false; };
    var a = 0, b = lista.length;
    while (a < b && fijo(lista[a])) a++;
    while (b > a && fijo(lista[b - 1])) b--;
    var medio = lista.slice(a, b);
    var claves = medio.map(function (x) { var k = claveDe(x); return k == null ? null : String(k); });
    var base = op.base ? unicas(op.base) : unicas(claves.filter(function (k) { return k != null; }));
    var rango = {};
    fusionar(orden, base).forEach(function (k, i) { rango[k] = i; });
    var antes = -1;
    var puesto = medio.map(function (x, i) {
      var k = claves[i], r = k != null && Object.prototype.hasOwnProperty.call(rango, k) ? rango[k] : antes;
      antes = r;
      return { x: x, r: r, i: i };
    });
    puesto.sort(function (p, q) { return p.r - q.r || p.i - q.i; });
    return lista.slice(0, a).concat(puesto.map(function (p) { return p.x; }), lista.slice(b));
  }

  // ───────────────────────────────────────────────────────────────────────────────── el arrastre
  function montarEstilo() {
    if (typeof document === "undefined" || document.getElementById("gp-ordena-estilo")) return;
    var st = document.createElement("style"); st.id = "gp-ordena-estilo"; st.textContent = CSS; document.head.appendChild(st);
  }
  function lista(caja, op) {
    op = op || {};
    montarEstilo();
    var hijos = function () { return [].slice.call(caja.children).filter(function (e) { return e.hasAttribute("data-ordena"); }); };
    var orden = function () { return hijos().map(function (e) { return e.getAttribute("data-ordena"); }); };
    var avisar = function (antes) { var o = orden(); if (o.join("\n") !== antes.join("\n") && typeof op.alCambiar === "function") op.alCambiar(o); };
    // lo que se desliza por dentro (la ventana de la rueda): al llevar algo cerca del borde, se desliza sola
    var deslizable = function (e) {
      for (var p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        var o = getComputedStyle(p).overflowY; if ((o === "auto" || o === "scroll") && p.scrollHeight > p.clientHeight) return p;
      }
      return document.scrollingElement || document.documentElement;
    };
    var A = null;   // el arrastre en marcha: { item, asa, id, dx, dy, antes, sc }
    // ¿El dedo queda ANTES de esta casilla, en orden de lectura? Antes si está en una fila de más arriba; en su misma fila, a
    // la izquierda de su centro si la fila tiene más de una (una rejilla) o por encima de su centro si va sola (una lista).
    function delante(x, y, r, rs) {
      if (y < r.top) return true;
      if (y > r.bottom) return false;
      var enFila = rs.some(function (o) { return o !== r && o.top < r.bottom && o.bottom > r.top; });
      return enFila ? x < r.left + r.width / 2 : y < r.top + r.height / 2;
    }
    function colocar(x, y) {
      var item = A.item, otros = hijos().filter(function (e) { return e !== item; });
      var rs = otros.map(function (e) { return e.getBoundingClientRect(); });
      var tras = null;   // la primera casilla que queda detrás del dedo: el item va delante de ella
      for (var i = 0; i < otros.length; i++) if (delante(x, y, rs[i], rs)) { tras = otros[i]; break; }
      if (tras) { if (item.nextElementSibling !== tras) caja.insertBefore(item, tras); }
      else if (otros.length) { var ult = otros[otros.length - 1]; if (ult.nextElementSibling !== item) caja.insertBefore(item, ult.nextSibling); }
    }
    function mover(ev) {
      if (!A || ev.pointerId !== A.id) return;
      ev.preventDefault();
      var x = ev.clientX || 0, y = ev.clientY;
      var sr = A.sc === document.scrollingElement || A.sc === document.documentElement ? { top: 0, bottom: window.innerHeight } : A.sc.getBoundingClientRect();
      if (y < sr.top + 40) A.sc.scrollTop -= 14; else if (y > sr.bottom - 40) A.sc.scrollTop += 14;
      colocar(x, y);
      A.item.style.transform = "";
      var n = A.item.getBoundingClientRect();
      A.item.style.transform = "translate(" + Math.round(x - A.dx - n.left) + "px," + Math.round(y - A.dy - n.top) + "px)";
    }
    function soltar(ev) {
      if (!A || (ev && ev.pointerId !== A.id)) return;
      var a = A; A = null;
      a.item.style.transform = ""; a.item.classList.remove("gpo-arrastra");
      document.documentElement.classList.remove("gpo-arrastrando");
      try { a.asa.releasePointerCapture(a.id); } catch (e) {}
      avisar(a.antes);
    }
    function bajar(ev) {
      var asa = ev.target && ev.target.closest && ev.target.closest("[data-ordena-asa]");
      if (!asa || A || (ev.button != null && ev.button !== 0)) return;
      var item = asa.closest("[data-ordena]");
      if (!item || item.parentElement !== caja) return;
      ev.preventDefault();
      var r = item.getBoundingClientRect();
      A = { item: item, asa: asa, id: ev.pointerId, dx: (ev.clientX || 0) - r.left, dy: ev.clientY - r.top, antes: orden(), sc: deslizable(caja) };
      try { asa.setPointerCapture(ev.pointerId); } catch (e) {}
      item.classList.add("gpo-arrastra");
      document.documentElement.classList.add("gpo-arrastrando");
    }
    function tecla(ev) {
      var asa = ev.target && ev.target.closest && ev.target.closest("[data-ordena-asa]");
      if (!asa || A) return;
      var item = asa.closest("[data-ordena]"); if (!item || item.parentElement !== caja) return;
      var hs = hijos(), i = hs.indexOf(item), j = { ArrowUp: i - 1, ArrowLeft: i - 1, ArrowDown: i + 1, ArrowRight: i + 1, Home: 0, End: hs.length - 1 }[ev.key];
      if (j == null) return;
      ev.preventDefault();
      if (j < 0 || j >= hs.length || j === i) return;
      var antes = orden();
      if (j < i) caja.insertBefore(item, hs[j]); else caja.insertBefore(item, hs[j].nextSibling);
      asa.focus();
      avisar(antes);
    }
    // (el asa va dentro de una etiqueta a veces: que pulsarla no marque ni desmarque la casilla)
    function clic(ev) { var asa = ev.target && ev.target.closest && ev.target.closest("[data-ordena-asa]"); if (asa) ev.preventDefault(); }
    caja.addEventListener("pointerdown", bajar);
    caja.addEventListener("pointermove", mover);
    caja.addEventListener("pointerup", soltar);
    caja.addEventListener("pointercancel", soltar);
    caja.addEventListener("keydown", tecla);
    caja.addEventListener("click", clic);
    return {
      orden: orden,
      destruir: function () {
        soltar(A ? { pointerId: A.id } : null);
        caja.removeEventListener("pointerdown", bajar); caja.removeEventListener("pointermove", mover);
        caja.removeEventListener("pointerup", soltar); caja.removeEventListener("pointercancel", soltar);
        caja.removeEventListener("keydown", tecla); caja.removeEventListener("click", clic);
      },
    };
  }

  window.GP = window.GP || {};
  window.GP.ordena = { fusionar: fusionar, aplicar: aplicar, lista: lista, CSS: CSS };
})();
