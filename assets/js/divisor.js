/**
 * GAMIFICAPRO · EL DIVISOR ARRASTRABLE (19-oct-2026) — pieza del motor para cualquier mod.
 *
 * Norberto, con Fernando, practicando el modo presentador para el estreno de DPG1: «La parte superior de la presentación es muy
 * pequeña y a veces es difícil acertar a los botones. ¿Podrías hacerla más grande? También podrías usar un separador para hacerla
 * más grande o pequeña.»
 *
 * Un asa entre dos partes que van una encima de otra (la diapositiva de ahora y el panel de notas del mando): se arrastra con el
 * ratón o el dedo y cambia el ALTO de la de arriba. La pieza no pinta nada de la web: solo pone una variable CSS (por defecto
 * `--gpdv-alto`, en px) y la web dice qué hace con ella (en una diapositiva 16:9, `width: min(100%, calc(var(--gpdv-alto) * 16 / 9))`).
 * Sin nada recordado, manda el tamaño de serie (el del CSS de la web, o `o.serie`): doble clic (o Intro en el asa) vuelve a él.
 *
 *   - Se nota que se arrastra: una barra con su agarradera, el cursor de cambiar el alto y el título «Arrastra…».
 *   - Zona de agarre de 40 px de alto como mínimo (táctil), y `touch-action: none` para que el dedo no desplace la página.
 *   - Teclado: es un `role="separator"` con foco; ↑ ↓ cambian el alto (Mayúsculas, más de golpe), Inicio y Fin van a los topes.
 *   - Topes: nunca menos de `min` ni más de `max` (por defecto, que debajo quede siempre `reserva` px de la pantalla y, con
 *     `proporcion`, que no pase del ancho que hay). Al cambiar el tamaño de la ventana se vuelve a ajustar.
 *   - Se recuerda en ese navegador (localStorage, con try/catch: en privado o sin permiso, simplemente no se recuerda).
 *
 *   GP.divisor.poner(caja, o) → { alto(), fijar(px), reiniciar(), asa, quitar() }
 *       caja         elemento o selector: la parte de arriba (la que cambia de alto). Con selector, se vuelve a buscar en cada medida
 *                    (una web que repinta la diapositiva la cambia por otra) y un segundo `poner` con él devuelve el mismo divisor;
 *                    con elemento, si ya tenía divisor, también.
 *       o.despues    elemento detrás del que va el asa (por defecto, la caja); o.antes, delante del que va (gana a o.despues)
 *       o.clave      lo recordado: localStorage «gp-divisor:<clave>» (sin clave, no se recuerda)
 *       o.variable   la variable CSS (por defecto «--gpdv-alto») y o.en, dónde se pone (por defecto, document.documentElement)
 *       o.min        px (o función → px); por defecto 180
 *       o.max        px (o función → px); por defecto, el alto de la pantalla menos o.reserva (bajando la página hasta la caja, la
 *                    otra parte sigue a la vista), y nunca menos que el de serie
 *       o.reserva    px que quedan siempre debajo para la otra parte (por defecto 140)
 *       o.proporcion ancho / alto de la caja (16/9): el alto no pasa de lo que da el ancho del padre (o de o.ancho())
 *       o.serie      el alto de serie, si no lo pone la web en su CSS: px, «tope» (lo más grande que cabe) o función(tope, arriba) → px
 *                    (`arriba`: lo que hay encima de la caja en la página, como mucho el 40 % de la pantalla: sin bajar, se ve todo);
 *                    se recalcula al cambiar la ventana y no se guarda
 *       o.paso       px por pulsación de flecha (por defecto 24)
 *       o.texto      el aria-label y el title del asa (neutro por defecto)
 *       o.alCambiar(alto | null) al soltar, con el teclado y al volver al de serie (null)
 *
 * Sin textos de ningún mod ni colores fijos: la piel va en `--gpdv-*` (`--gpdv-linea`, `--gpdv-agarre`, `--gpdv-activo`).
 * Cada web la copia en su build (assets/js/divisor.js) y NO se edita allí: aquí. Pruebas: tests/sdk/divisor.test.ts.
 */
(function () {
  "use strict";
  var PREFIJO = "gp-divisor:", PUESTOS = {};
  var CSS =
    ".gpdv{position:relative;display:flex;align-items:center;justify-content:center;width:100%;min-height:40px;margin:0;padding:0;border:0;background:transparent;" +
    "cursor:row-resize;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;outline:none;flex:0 0 auto}" +
    ".gpdv::before{content:\"\";position:absolute;left:0;right:0;top:50%;height:1px;background:var(--gpdv-linea,rgba(255,255,255,.14))}" +
    ".gpdv i{position:relative;display:block;width:64px;height:8px;border-radius:99px;background:var(--gpdv-agarre,rgba(255,255,255,.38));" +
    "box-shadow:0 0 0 4px var(--gpdv-fondo,rgba(0,0,0,.55));transition:background .15s,width .15s}" +
    ".gpdv:hover i,.gpdv:focus-visible i,.gpdv.gpdv-on i{width:96px;background:var(--gpdv-activo,#fff)}" +
    ".gpdv:focus-visible::before,.gpdv.gpdv-on::before{background:var(--gpdv-activo,#fff);opacity:.5}" +
    "body.gpdv-arrastrando,body.gpdv-arrastrando *{cursor:row-resize!important;user-select:none!important;-webkit-user-select:none!important}" +
    "body.gpdv-arrastrando iframe{pointer-events:none!important}";

  function ponerCss() {
    if (document.getElementById("gpdv-css")) return;
    var s = document.createElement("style"); s.id = "gpdv-css"; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  function leer(k) { if (!k) return null; try { var v = Number(window.localStorage.getItem(PREFIJO + k)); return v > 0 ? v : null; } catch (e) { return null; } }
  function guardar(k, v) { if (!k) return; try { if (v == null) window.localStorage.removeItem(PREFIJO + k); else window.localStorage.setItem(PREFIJO + k, String(Math.round(v))); } catch (e) { /* sin permiso: no se recuerda */ } }
  function valor(x, defecto) { var v = typeof x === "function" ? x() : x; return typeof v === "number" && isFinite(v) ? v : defecto; }
  function el(x) { return typeof x === "string" ? document.querySelector(x) : x; }

  function poner(cajaSel, o) {
    o = o || {};
    var primera = el(cajaSel); if (!primera) return null;
    var porSel = typeof cajaSel === "string";
    if (porSel && PUESTOS[cajaSel]) return PUESTOS[cajaSel];
    if (primera.gpdv) return primera.gpdv;
    function laCaja() { var c = porSel && document.querySelector(cajaSel); return c || primera; }
    ponerCss();
    var variable = o.variable || "--gpdv-alto", en = el(o.en) || document.documentElement;
    var reserva = valor(o.reserva, 140), paso = valor(o.paso, 24), actual = null, serie = 0;

    function min() { return Math.max(40, valor(o.min, 180)); }
    // lo que hay encima de la caja en la página (como mucho, el 40 % de la pantalla)
    function arriba() { var r = laCaja().getBoundingClientRect(); return Math.max(0, Math.min(r.top + (window.scrollY || 0), window.innerHeight * 0.4)); }
    function max() {
      var m = window.innerHeight - reserva;   // (bajando la página hasta la caja, debajo quedan siempre `reserva` px de la otra parte)
      if (o.proporcion) {
        var ancho = o.ancho ? valor(o.ancho, 0) : (laCaja().parentElement ? laCaja().parentElement.clientWidth : 0);
        if (ancho > 0) m = Math.min(m, ancho / o.proporcion);
      }
      if (o.serie == null) m = Math.max(m, serie);   // (nunca por debajo del de la web: arrastrar hacia abajo no la achica)
      if (o.max != null) m = Math.min(m, valor(o.max, m));
      return Math.max(min(), Math.floor(m));
    }
    function limitar(v) { return Math.max(min(), Math.min(max(), v)); }
    function deSerie() { var t = max(); return limitar(o.serie === "tope" ? t : typeof o.serie === "function" ? valor(o.serie(t, arriba()), t) : valor(o.serie, t)); }
    function aplicar(v) {
      actual = v == null ? null : limitar(v);
      var px = actual != null ? actual : o.serie != null ? deSerie() : null;
      if (px == null) en.style.removeProperty(variable); else en.style.setProperty(variable, Math.round(px) + "px");
      asa.setAttribute("aria-valuenow", String(Math.round(px == null ? laCaja().getBoundingClientRect().height : px)));
      asa.setAttribute("aria-valuemin", String(min())); asa.setAttribute("aria-valuemax", String(max()));
    }
    function avisar() { if (o.alCambiar) try { o.alCambiar(actual); } catch (e) { /* lo de la web no para el divisor */ } }
    function fijar(v) { aplicar(v); guardar(o.clave, actual); avisar(); return actual; }
    function reiniciar() { aplicar(null); medirSerie(); guardar(o.clave, null); avisar(); }

    var asa = document.createElement("div");
    var texto = o.texto || "Arrastra para cambiar el tamaño (doble clic: el de serie)";
    asa.className = "gpdv"; asa.setAttribute("role", "separator"); asa.setAttribute("aria-orientation", "horizontal");
    asa.setAttribute("tabindex", "0"); asa.setAttribute("aria-label", texto); asa.title = texto;
    asa.innerHTML = "<i aria-hidden=\"true\"></i>";
    var antes = el(o.antes), despues = el(o.despues) || primera;
    if (antes) antes.parentElement.insertBefore(asa, antes); else despues.parentElement.insertBefore(asa, despues.nextSibling);

    // arrastrar (ratón, dedo y lápiz: Pointer Events)
    var y0 = 0, alto0 = 0, id = null;
    function bajar(ev) {
      if (ev.button != null && ev.button > 0) return;
      ev.preventDefault();
      medirSerie(); id = ev.pointerId; y0 = ev.clientY; alto0 = laCaja().getBoundingClientRect().height;
      try { asa.setPointerCapture(id); } catch (e) { /* nada */ }
      asa.classList.add("gpdv-on"); document.body.classList.add("gpdv-arrastrando");
    }
    function mover(ev) { if (id == null || ev.pointerId !== id) return; ev.preventDefault(); aplicar(alto0 + (ev.clientY - y0)); }
    function soltar(ev) {
      if (id == null || (ev && ev.pointerId !== id)) return;
      try { asa.releasePointerCapture(id); } catch (e) { /* nada */ }
      id = null; asa.classList.remove("gpdv-on"); document.body.classList.remove("gpdv-arrastrando");
      guardar(o.clave, actual); avisar();
    }
    function teclado(ev) {
      medirSerie();
      var base = actual == null ? laCaja().getBoundingClientRect().height : actual, p = ev.shiftKey ? paso * 4 : paso;
      if (ev.key === "ArrowDown") fijar(base + p);
      else if (ev.key === "ArrowUp") fijar(base - p);
      else if (ev.key === "Home") fijar(min());
      else if (ev.key === "End") fijar(max());
      else if (ev.key === "Enter") reiniciar();
      else return;
      ev.preventDefault(); ev.stopPropagation();   // (las flechas no pasan de diapositiva)
    }
    function medirSerie() { if (actual == null) serie = laCaja().getBoundingClientRect().height; }
    function ventana() { if (actual != null || o.serie != null) aplicar(actual); else medirSerie(); }
    asa.addEventListener("pointerdown", bajar);
    asa.addEventListener("pointermove", mover);
    asa.addEventListener("pointerup", soltar);
    asa.addEventListener("pointercancel", soltar);
    asa.addEventListener("dblclick", function (ev) { ev.preventDefault(); reiniciar(); });
    asa.addEventListener("keydown", teclado);
    window.addEventListener("resize", ventana);

    var api = {
      asa: asa, fijar: fijar, reiniciar: reiniciar,
      alto: function () { return actual; },
      quitar: function () {
        window.removeEventListener("resize", ventana);
        en.style.removeProperty(variable);
        asa.remove();
        document.body.classList.remove("gpdv-arrastrando");
        delete primera.gpdv; if (porSel) delete PUESTOS[cajaSel];
      }
    };
    primera.gpdv = api; if (porSel) PUESTOS[cajaSel] = api;
    medirSerie(); aplicar(leer(o.clave));   // lo recordado, dentro de los topes de esta pantalla
    return api;
  }

  window.GP = window.GP || {};
  window.GP.divisor = { poner: poner, CSS: CSS, PREFIJO: PREFIJO };
})();
