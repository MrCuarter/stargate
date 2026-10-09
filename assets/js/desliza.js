/**
 * GAMIFICAPRO · LO QUE SE DESLIZA, QUE SE NOTE (9-oct-2026) — pieza del motor para cualquier mod.
 *
 * Norberto: «Nuestra app se corta en cualquier Android. En iPhone se ve perfecto.» La norma (CLAUDE.md global, 9-oct): «si algo
 * se desliza a propósito (mapas, carruseles), que se note: bordes difuminados». Una tabla ancha, un carril de tarjetas o una
 * fila de botones que se desliza de lado, con la barra oculta, parece cortada.
 *
 * Esta pieza mira TODO lo que se desliza de lado de verdad (overflow-x auto/scroll y contenido más ancho que la caja) y le pone
 * `data-desliza="der" | "izq" | "ambos"`: por dónde queda más. El estilo difumina ese borde (mask-image) y, al llegar al final,
 * el borde vuelve a ser nítido. Lo que cabe no se toca. La navegación NO debe ser una tira deslizable (en el móvil, rejilla de
 * columnas iguales o menú): esto es para lo que se desliza a propósito.
 *
 * Sin piel: `--gpd-borde` (28px) es lo que mide el difuminado. Cada web la copia en su build (assets/js/desliza.js, con
 * `guardas.copiar_pieza`) y NO se edita allí: aquí. Se carga con defer y se monta sola; vuelve a mirar al cambiar el tamaño, al
 * deslizar y cuando la página repinta (MutationObserver, agrupado en un fotograma).
 *   GP.desliza.mirar()      → vuelve a mirar ya (si la web pinta algo y no quiere esperar)
 *   GP.desliza.lado(e)      → "der" | "izq" | "ambos" | "" para un elemento (lo que se usa por dentro)
 * Prueba: tests/sdk/desliza.test.ts. La tanda de móviles (scripts/tanda-moviles.cjs) da por buena una tira con `data-desliza`.
 */
(function () {
  if (window.GP && window.GP.desliza) return;   // (copiada en dos sitios de la misma página: una sola vez)

  var CSS = "[data-desliza]{--gpd-i:#000;--gpd-d:#000;" +
    "-webkit-mask-image:linear-gradient(90deg,var(--gpd-i) 0,#000 var(--gpd-borde,28px),#000 calc(100% - var(--gpd-borde,28px)),var(--gpd-d) 100%);" +
    "mask-image:linear-gradient(90deg,var(--gpd-i) 0,#000 var(--gpd-borde,28px),#000 calc(100% - var(--gpd-borde,28px)),var(--gpd-d) 100%)}" +
    "[data-desliza=der],[data-desliza=ambos]{--gpd-d:transparent}[data-desliza=izq],[data-desliza=ambos]{--gpd-i:transparent}";

  /** Por dónde queda contenido: lo que falta a la izquierda y a la derecha (con 2 px de margen por el redondeo). */
  function lado(e) {
    var falta = e.scrollWidth - e.clientWidth;
    if (falta <= 2) return "";
    var x = Math.abs(e.scrollLeft);   // (en rtl, scrollLeft es negativo)
    var izq = x > 2, der = x < falta - 2;
    return izq && der ? "ambos" : izq ? "izq" : der ? "der" : "";
  }
  function poner(e) {
    var l = lado(e);
    if (l) { if (e.getAttribute("data-desliza") !== l) e.setAttribute("data-desliza", l); }
    else if (e.hasAttribute("data-desliza")) e.removeAttribute("data-desliza");
  }
  function desliza(e) { var o = getComputedStyle(e).overflowX; return o === "auto" || o === "scroll"; }
  function mirar() {
    var todos = document.body ? document.body.getElementsByTagName("*") : [];
    for (var i = 0; i < todos.length; i++) {
      var e = todos[i];
      if (e.hasAttribute("data-desliza") || (e.scrollWidth > e.clientWidth + 2 && desliza(e))) poner(e);
    }
  }
  var pendiente = false;
  function luego() { if (pendiente) return; pendiente = true; requestAnimationFrame(function () { pendiente = false; mirar(); }); }
  function montar() {
    if (!document.getElementById("gp-desliza-estilo")) {
      var st = document.createElement("style"); st.id = "gp-desliza-estilo"; st.textContent = CSS; document.head.appendChild(st);
    }
    mirar();
    window.addEventListener("resize", luego);
    window.addEventListener("load", luego);
    // al deslizar una tira, solo esa (el evento scroll no sube: se escucha en captura)
    document.addEventListener("scroll", function (ev) { var t = ev.target; if (t && t.nodeType === 1 && t.hasAttribute("data-desliza")) poner(t); }, true);
    if (window.MutationObserver) new MutationObserver(luego).observe(document.body, { childList: true, subtree: true });
  }

  window.GP = window.GP || {};
  window.GP.desliza = { mirar: mirar, lado: lado, CSS: CSS };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
})();
