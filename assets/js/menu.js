/**
 * GAMIFICAPRO · EL MENÚ DESPLEGABLE (7-oct-2026) — pieza del motor para cualquier mod.
 *
 * Norberto: «Las secciones de ayuda están creciendo mucho. En el menú superior del docente aparece Academia, En claro más el
 * botón de soporte. ¿No es lioso? ¿Y si ponemos en el menú "Ayuda" y al pulsar o pasar el ratón se despliegan todas las
 * opciones? Así el usuario sabe que todas ellas son AYUDA». Así que un grupo de enlaces del menú de arriba se vuelve UNA
 * entrada que se despliega:
 *
 *   1. SE ABRE al pasar el ratón (escritorio) y al pulsar (móvil, táctil y ratón). Abierto por el ratón, se cierra al salir;
 *      abierto (o fijado) con un clic, se queda hasta que se pulsa otra vez, se pulsa fuera, se elige una opción o Esc.
 *   2. TECLADO: Enter o Espacio abren y van a la primera opción; ↓ y ↑ abren y recorren (dan la vuelta); Inicio y Fin; Esc
 *      cierra y devuelve el foco al botón; Tab cierra y sigue.
 *   3. ACCESIBLE: el botón lleva `aria-haspopup`, `aria-expanded` y `aria-controls`; la lista, `role="menu"`; cada opción,
 *      `role="menuitem"`. Solo un desplegable abierto a la vez.
 *   4. SABE DÓNDE ESTÁS: si la página actual es una de sus opciones (o de las páginas que una opción dice cubrir con
 *      `data-gpm-paginas`), esa opción lleva `aria-current="page"` y el grupo, la clase `gpm-activo`.
 *   5. UNA OPCIÓN PUEDE PULSAR OTRO BOTÓN de la página (`data-gpm-pulsa="<selector>"`; p. ej. un chat flotante): si ese botón
 *      no está o no se ve, la opción no sale.
 *   6. SE VE ENTERA: al abrir, si la lista se sale por un lado, se corre (transform) lo justo; y si un contenedor la recorta
 *      (la barra que en el móvil se desliza de lado lleva overflow), sale fija (position:fixed) justo debajo del botón, dentro
 *      de la pantalla y con su propio scroll si no cabe de alto. Al deslizar o cambiar el tamaño, se recoloca.
 *
 * Sin textos, imágenes ni colores de ningún mod: la piel va en variables CSS y en las clases propias de cada web. Cada web lo
 * copia en su build (STARGATE: _build_site.py → assets/js/menu.js) y NO se edita allí: aquí. Se carga con defer (necesita
 * el DOM) y se monta solo; si la web pinta un desplegable después, `GP.menu.montar()` otra vez (no repite los que ya están).
 *
 * Marcado (lo escribe la web; `GP.menu.marcado(o)` da el mismo desde JS):
 *   <div class="gpm [gpm-derecha]" data-gpm>                            (gpm-derecha: la lista se alinea a la derecha)
 *     <button type="button" class="gpm-boton">Ayuda <span class="gpm-flecha" aria-hidden="true">▾</span></button>
 *     <div class="gpm-lista" role="menu" hidden>
 *       <a role="menuitem" href="academia.html">Academia<span class="gpm-sub">una línea</span></a>
 *       <a role="menuitem" href="guias.html" data-gpm-paginas="guia.html en-claro.html">Guías</a>
 *       <button type="button" role="menuitem" data-gpm-pulsa="#chat-b">Pregunta…</button>
 *     </div>
 *   </div>
 *
 * Piel (en :root, en el menú o en el grupo):
 *   --gpm-fondo · --gpm-tinta · --gpm-borde · --gpm-radio (10px) · --gpm-sombra · --gpm-ancho (220px, mínimo de la lista) ·
 *   --gpm-separa (6px, entre botón y lista) · --gpm-relleno (6px) · --gpm-capa (70) · --gpm-resalte (fondo de la opción al
 *   pasar o con foco) · --gpm-foco (el contorno con teclado) · --gpm-actual (tinta de la opción de la página actual) ·
 *   --gpm-boton-relleno · --gpm-radio-boton · --gpm-opcion-relleno · --gpm-radio-opcion
 *
 *   GP.menu.montar(raiz?)   → prepara los [data-gpm] que falten (devuelve cuántos hay)
 *   GP.menu.abrir(el)       → abre ese grupo (como con un clic)
 *   GP.menu.cerrar(el?)     → cierra ese grupo, o todos
 *   GP.menu.marcado(o)      → el HTML de un grupo: { texto, id?, derecha?, opciones: [{ href | pulsa, texto, sub?, paginas? }] }
 *   GP.menu.pagina(href)    → «academia.html» de «/x/academia.html?y#z» («» → «index.html»)
 */
(function () {
  if (window.GP && window.GP.menu) return;   // (copiada en dos sitios de la misma página: una sola vez)

  var O = ".gpm-lista>[role=menuitem]";
  var CSS = ""
    + ".gpm{position:relative;display:inline-flex;align-items:center}"
    + ".gpm-boton{font:inherit;color:inherit;background:none;border:0;margin:0;cursor:pointer;display:inline-flex;"
    +   "align-items:center;gap:.35em;padding:var(--gpm-boton-relleno,.4em .7em);border-radius:var(--gpm-radio-boton,8px)}"
    + ".gpm-flecha{display:inline-block;font-size:.75em;line-height:1;transition:transform .15s}"
    + ".gpm.gpm-abierto .gpm-flecha{transform:rotate(180deg)}"
    + ".gpm-lista{position:absolute;top:100%;left:0;z-index:var(--gpm-capa,70);margin-top:var(--gpm-separa,6px);"
    +   "min-width:var(--gpm-ancho,220px);max-width:calc(100vw - 16px);box-sizing:border-box;display:flex;"
    +   "flex-direction:column;gap:2px;padding:var(--gpm-relleno,6px);background:var(--gpm-fondo,#fff);"
    +   "color:var(--gpm-tinta,#111);border:1px solid var(--gpm-borde,rgba(0,0,0,.15));border-radius:var(--gpm-radio,10px);"
    +   "box-shadow:var(--gpm-sombra,0 12px 32px rgba(0,0,0,.25))}"
    + ".gpm-derecha>.gpm-lista{left:auto;right:0}"
    + ".gpm-lista[hidden]{display:none}"
    // el puente: el hueco entre el botón y la lista también es «dentro», para que el ratón no la cierre al bajar
    + ".gpm-lista::before{content:\"\";position:absolute;left:0;right:0;bottom:100%;height:var(--gpm-separa,6px)}"
    + O + "{display:block;box-sizing:border-box;width:100%;text-align:left;font:inherit;color:inherit;background:none;"
    +   "border:0;margin:0;cursor:pointer;text-decoration:none;padding:var(--gpm-opcion-relleno,8px 12px);"
    +   "border-radius:var(--gpm-radio-opcion,8px)}"
    + O + "[hidden]{display:none}"
    + O + ":hover," + O + ":focus{background:var(--gpm-resalte,rgba(0,0,0,.06));outline:none}"
    + O + ":focus-visible{outline:2px solid var(--gpm-foco,currentColor);outline-offset:-2px}"
    + O + "[aria-current=page]{font-weight:700;color:var(--gpm-actual,inherit)}"
    + ".gpm-sub{display:block;font-size:.85em;font-weight:400;opacity:.75}"
    + "@media (prefers-reduced-motion:reduce){.gpm-flecha{transition:none}}";

  function ponerEstilo() {
    if (document.getElementById("gpm-estilo")) return;
    var st = document.createElement("style"); st.id = "gpm-estilo"; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pagina(href) {
    var s = String(href == null ? "" : href).split("#")[0].split("?")[0];
    s = s.slice(s.lastIndexOf("/") + 1);
    return s || "index.html";
  }

  var GRUPOS = [];
  function opciones(g) { return [].slice.call(g.lista.querySelectorAll("[role=menuitem]")); }
  function visibles(g) { return opciones(g).filter(function (o) { return !o.hidden; }); }
  function abierto(g) { return !g.lista.hidden; }

  // la opción que pulsa otro botón solo sale si ese botón está y se ve
  function seVe(el) { return !!el && !el.hidden && !!(el.getClientRects && el.getClientRects().length); }
  function refrescar(g) {
    opciones(g).forEach(function (o) {
      var sel = o.getAttribute("data-gpm-pulsa"); if (!sel) return;
      var t = null; try { t = document.querySelector(sel); } catch (e) { t = null; }
      o.hidden = !seVe(t);
    });
  }
  // ¿la recorta algún contenedor? (una barra que en el móvil se desliza de lado lleva overflow: la lista, dentro, no se vería)
  function estilo(el) { return (window.getComputedStyle && window.getComputedStyle(el)) || {}; }
  function recortada(g) {
    for (var p = g.el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      var cs = estilo(p);
      if (/(auto|scroll|hidden|clip)/.test(String(cs.overflowX || "") + " " + String(cs.overflowY || ""))) return true;
    }
    return false;
  }
  // que se vea entera: si se sale por un lado, se corre lo justo (8 px de margen); si la recorta su contenedor, sale fija
  // (position:fixed) justo debajo del botón, alineada con él y corregida por si el contenedor fija otra referencia
  function encajar(g) {
    var l = g.lista, s = l.style;
    s.transform = ""; s.position = ""; s.top = ""; s.left = ""; s.right = ""; s.marginTop = ""; s.maxHeight = ""; s.overflowY = "";
    g.fija = false;
    if (!l.getBoundingClientRect) return;
    var de = document.documentElement;
    var ancho = (de && de.clientWidth) || window.innerWidth || 0, alto = (de && de.clientHeight) || window.innerHeight || 0;
    if (!ancho) return;
    if (recortada(g) && g.boton.getBoundingClientRect) {
      var b = g.boton.getBoundingClientRect(), separa = parseFloat(estilo(l).marginTop) || 6;
      var w = l.getBoundingClientRect().width || 0;
      var x = g.el.classList.contains("gpm-derecha") ? b.right - w : b.left;
      x = Math.max(8, Math.min(x, ancho - 8 - w));
      var y = b.bottom + separa;
      g.fija = true;
      s.position = "fixed"; s.right = "auto"; s.marginTop = "0px"; s.left = Math.round(x) + "px"; s.top = Math.round(y) + "px";
      var r0 = l.getBoundingClientRect();   // (un antepasado con transform o filtro mueve la referencia de «fixed»: se corrige)
      if (Math.round(r0.left) !== Math.round(x)) s.left = Math.round(x + x - r0.left) + "px";
      if (Math.round(r0.top) !== Math.round(y)) s.top = Math.round(y + y - r0.top) + "px";
      if (alto) { s.maxHeight = Math.max(120, Math.round(alto - y - 8)) + "px"; s.overflowY = "auto"; }
      return;
    }
    var r = l.getBoundingClientRect(), dx = 0;
    if (r.right > ancho - 8) dx = ancho - 8 - r.right;
    if (r.left + dx < 8) dx = 8 - r.left;
    if (dx) s.transform = "translateX(" + Math.round(dx) + "px)";
  }

  function cerrar(g, devolverFoco) {
    if (!g) { GRUPOS.forEach(function (x) { cerrar(x); }); return; }
    clearTimeout(g.reloj);
    if (!abierto(g)) return;
    g.lista.hidden = true; g.modo = null;
    g.boton.setAttribute("aria-expanded", "false");
    g.el.classList.remove("gpm-abierto");
    if (devolverFoco) g.boton.focus();
  }
  function abrir(g, modo) {
    clearTimeout(g.reloj);
    GRUPOS.forEach(function (x) { if (x !== g) cerrar(x); });
    g.modo = modo || "clic";
    if (abierto(g)) return;
    refrescar(g);
    g.lista.hidden = false;
    g.boton.setAttribute("aria-expanded", "true");
    g.el.classList.add("gpm-abierto");
    encajar(g);
  }
  function enfocar(g, i) {
    var L = visibles(g); if (!L.length) return;
    L[(i + L.length) % L.length].focus();
  }

  function marcarActual(g) {
    var aqui = pagina(window.location && window.location.pathname), alguna = false;
    opciones(g).forEach(function (o) {
      var ps = [];
      if (o.getAttribute("href")) ps.push(pagina(o.getAttribute("href")));
      (o.getAttribute("data-gpm-paginas") || "").split(/\s+/).forEach(function (p) { if (p) ps.push(pagina(p)); });
      if (ps.indexOf(aqui) >= 0) { o.setAttribute("aria-current", "page"); alguna = true; }
      else if (o.getAttribute("aria-current") === "page") alguna = true;   // (la marcó la web al construir)
    });
    if (alguna) g.el.classList.add("gpm-activo");
  }

  function preparar(el) {
    var boton = el.querySelector(".gpm-boton"), lista = el.querySelector(".gpm-lista");
    if (!boton || !lista) return;
    var g = { el: el, boton: boton, lista: lista, modo: null, reloj: 0 };
    el.gpm = g; GRUPOS.push(g);
    if (!lista.id) lista.id = "gpm-lista-" + GRUPOS.length;
    if (boton.tagName === "BUTTON" && !boton.getAttribute("type")) boton.setAttribute("type", "button");
    boton.setAttribute("aria-haspopup", "true");
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-controls", lista.id);
    lista.setAttribute("role", "menu");
    lista.hidden = true;
    [].forEach.call(lista.children, function (o) {
      if (/^(A|BUTTON)$/.test(o.tagName) && !o.getAttribute("role")) o.setAttribute("role", "menuitem");
    });
    opciones(g).forEach(function (o) { o.setAttribute("tabindex", "-1"); });
    marcarActual(g);

    // el ratón: entrar abre, salir cierra (si lo abrió el ratón); el dedo no pasa por aquí
    el.addEventListener("pointerenter", function (ev) {
      if (ev.pointerType !== "mouse") return;
      clearTimeout(g.reloj);
      if (!abierto(g)) abrir(g, "raton");
    });
    el.addEventListener("pointerleave", function (ev) {
      if (ev.pointerType !== "mouse" || g.modo !== "raton") return;
      clearTimeout(g.reloj);
      g.reloj = setTimeout(function () { if (g.modo === "raton") cerrar(g); }, 200);
    });
    // el clic (y Enter/Espacio, que en un <button> son un clic con detail 0)
    boton.addEventListener("click", function (ev) {
      var teclado = ev.detail === 0;
      if (abierto(g) && g.modo === "raton" && !teclado) { g.modo = "clic"; return; }   // lo abrió el ratón: se queda fijo
      if (abierto(g) && !teclado) { cerrar(g); return; }
      abrir(g, "clic");
      if (teclado) enfocar(g, 0);
    });
    boton.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.preventDefault(); abrir(g, "clic"); enfocar(g, ev.key === "ArrowDown" ? 0 : -1);
      } else if (ev.key === "Escape" && abierto(g)) { ev.preventDefault(); cerrar(g, true); }
    });
    lista.addEventListener("keydown", function (ev) {
      var L = visibles(g), i = L.indexOf(document.activeElement);
      if (ev.key === "ArrowDown") { ev.preventDefault(); enfocar(g, i + 1); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); enfocar(g, i < 0 ? -1 : i - 1); }
      else if (ev.key === "Home") { ev.preventDefault(); enfocar(g, 0); }
      else if (ev.key === "End") { ev.preventDefault(); enfocar(g, -1); }
      else if (ev.key === "Escape") { ev.preventDefault(); cerrar(g, true); }
      else if (ev.key === "Tab") cerrar(g);
    });
    lista.addEventListener("click", function (ev) {
      var o = ev.target && ev.target.closest && ev.target.closest("[role=menuitem]"); if (!o) return;
      var sel = o.getAttribute("data-gpm-pulsa");
      cerrar(g);
      if (sel) {
        ev.preventDefault();
        var t = null; try { t = document.querySelector(sel); } catch (e) { t = null; }
        if (t && t.click) t.click();
      }
    });
    // el foco se va a otra parte (Tab, o un clic en otro control): se cierra
    el.addEventListener("focusout", function (ev) {
      if (ev.relatedTarget && !el.contains(ev.relatedTarget)) cerrar(g);
    });
  }

  function montar(raiz) {
    ponerEstilo();
    [].forEach.call((raiz || document).querySelectorAll("[data-gpm]"), function (el) { if (!el.gpm) preparar(el); });
    return GRUPOS.length;
  }

  function marcado(o) {
    o = o || {};
    return '<div class="gpm' + (o.derecha ? " gpm-derecha" : "") + (o.clase ? " " + esc(o.clase) : "") + '" data-gpm'
      + (o.id ? ' id="' + esc(o.id) + '"' : "") + ">"
      + '<button type="button" class="gpm-boton" aria-haspopup="true" aria-expanded="false">' + esc(o.texto || "")
      + ' <span class="gpm-flecha" aria-hidden="true">▾</span></button>'
      + '<div class="gpm-lista" role="menu" hidden>'
      + (o.opciones || []).map(function (x) {
          var dentro = esc(x.texto || "") + (x.sub ? '<span class="gpm-sub">' + esc(x.sub) + "</span>" : "");
          var pags = x.paginas && x.paginas.length ? ' data-gpm-paginas="' + esc(x.paginas.join(" ")) + '"' : "";
          return x.pulsa
            ? '<button type="button" role="menuitem" tabindex="-1" data-gpm-pulsa="' + esc(x.pulsa) + '">' + dentro + "</button>"
            : '<a role="menuitem" tabindex="-1" href="' + esc(x.href || "#") + '"' + pags + ">" + dentro + "</a>";
        }).join("")
      + "</div></div>";
  }

  // fuera: pulsar fuera cierra; Esc cierra lo que abrió el ratón aunque el foco esté en otra parte
  document.addEventListener("pointerdown", function (ev) {
    GRUPOS.forEach(function (g) { if (abierto(g) && !g.el.contains(ev.target)) cerrar(g); });
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    GRUPOS.forEach(function (g) { if (abierto(g) && !g.el.contains(document.activeElement)) cerrar(g); });
  });

  // si se mueve lo de debajo (la barra que se desliza de lado, la página, la ventana), la lista abierta se vuelve a encajar
  function reencajar() { GRUPOS.forEach(function (g) { if (abierto(g)) encajar(g); }); }
  document.addEventListener("scroll", reencajar, true);
  if (window.addEventListener) window.addEventListener("resize", reencajar);

  window.GP = window.GP || {};
  window.GP.menu = {
    montar: montar, marcado: marcado, pagina: pagina, CSS: CSS,
    abrir: function (el) { if (el && el.gpm) abrir(el.gpm, "clic"); },
    cerrar: function (el) { cerrar(el && el.gpm ? el.gpm : null); }
  };

  ponerEstilo();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { montar(); });
  else montar();
})();
