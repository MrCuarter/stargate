/**
 * GAMIFICAPRO · LAS TARJETAS IGUALES (6-oct-2026) — pieza del motor para cualquier mod (norma de diseño de CLAUDE.md).
 *
 * Norberto: «me gustan las cosas simétricas, uniformes, que tengan la misma extensión, anchura, altura y con la posibilidad
 * de ampliar, leer más… tiene que quedarse a fuego para cualquier proyecto de GamificaPro». Así que, cuando varias tarjetas
 * van juntas (retos, premios, insignias, misiones, grupos…):
 *
 *   1. TODAS MIDEN LO MISMO: la rejilla iguala las filas (grid-auto-rows:1fr) y cada tarjeta llena su celda.
 *   2. CERRADA, LO JUSTO: lo marcado con .gpt-l1/.gpt-l2/.gpt-l3 se recorta a 1/2/3 líneas; lo marcado con .gpt-solo-ventana
 *      no se ve; el pie (.gpt-pie: el premio, «Leer más…») va abajo, a la misma altura en todas.
 *   3. «LEER MÁS…» ABRE UNA VENTANA: la tarjeta es un <details>; abierta, se vuelve una ventana fija encima de la página, con
 *      velo, × y Esc. Pulsar el texto de dentro no la cierra. La celda se queda en la rejilla, así que nada se mueve detrás.
 *      Abrir no necesita JS (es el <details>), y si la página se repinta y recuerda qué <details> estaban abiertos, la
 *      ventana vuelve sola. En el móvil, ocupa la pantalla.
 *
 * Sin textos, imágenes ni colores de ningún mod: la piel va en variables CSS y en las clases propias de cada web. Cada web lo
 * copia en su build (STARGATE: _build_site.py → assets/js/tarjetas.js) y NO se edita allí: aquí. Se carga en el <head> sin
 * defer (no necesita el DOM): así el estilo está antes de que se pinte la primera rejilla.
 *
 * Marcado:
 *   <div class="gpt-rejilla">                                   (columnas: --gpt-min; o las de la web, con más especificidad)
 *     <div class="gpt-celda">                                   ← GP.tarjetas.celda(htmlDeLaTarjeta) pone celda y velo
 *       <details class="gpt-tarjeta …">
 *         <summary> … <b class="gpt-l3">Título</b> … <div class="gpt-pie">premio</div> <span class="gpt-mas">Leer más…</span></summary>
 *         <button type="button" class="gpt-cerrar" data-gpt-cerrar aria-label="Cerrar">×</button>
 *         … todo lo demás (pasos, formularios, relacionados) …
 *       </details>
 *       <div class="gpt-velo" data-gpt-cerrar aria-hidden="true"></div>
 *     </div>
 *   Una tarjeta que no se abre (p. ej. «la próxima semana») es un <div class="gpt-tarjeta"> en su celda: mide lo mismo.
 *
 * Piel (en :root, en la rejilla o en la tarjeta):
 *   --gpt-min (280px) · --gpt-hueco (12px) · --gpt-ancho (760px, la ventana) · --gpt-arriba (24px) · --gpt-capa (60: por
 *   debajo de los avisos de la web, que deben poder salir encima) · --gpt-velo · --gpt-sombra · --gpt-cerrar-fondo ·
 *   --gpt-cerrar-borde · --gpt-cerrar-tinta · --gpt-acento (el borde de la × al pasar)
 *
 *   GP.tarjetas.celda(html)  → '<div class="gpt-celda">'+html+velo+'</div>'
 *   GP.tarjetas.cerrada(texto, o) → la CAJA CERRADA (16-oct, abajo)
 *
 * 16-oct · LO QUE AÚN NO SE HA ABIERTO, EN SU SITIO (Norberto: «haz una fotografía de la última semana, cuando el panel está completo, y lo
 * que no queremos que se vea, oscurécelo: que se quede en su sitio y mantenga la simetría, pero como una caja oscurecida, sin que se vea lo
 * de detrás»). Antes, cada web quitaba del HTML lo que aún no tocaba y la rejilla se recolocaba: huecos, una tarjeta sola en la última
 * fila, filas de distinto número de cajas según la semana. Ahora:
 *   · GP.tarjetas.cerrada(texto, { clase, etiqueta, icono }) → una caja con candado del mismo tamaño que las de su rejilla (la llena, como
 *     cualquier celda), oscurecida y SIN nada de lo que habrá dentro: solo `texto` («Se abre en la semana 5») o nada. `clase` le pone las
 *     clases de la caja de la web (p. ej. «cifra»), para que mida y se coloque igual. Piel: --gp-cerrada-fondo, --gp-cerrada-borde,
 *     --gp-cerrada-tinta, --gp-cerrada-icono (una imagen url(...); sin ella, el candado 🔒).
 *   · LA REJILLA EQUILIBRADA: <div class="gpt-rejilla" data-gpt-n="4"> (cuántas tarjetas lleva). Con 1 a 3, sin columnas fantasma (las que
 *     hay se reparten el ancho); con 4 u 8, dos por fila (2 × 2, 2 × 4); con 6 o 9, tres. Si no caben (el ancho de la rejilla, contra
 *     --gpt-min), una por fila: nunca una fila coja (3 → 2 + 1). Así no queda una sola en la última fila. Sin data-gpt-n, como siempre. GP.tarjetas.equilibrar() lo pone solo en todas las rejillas de la página y lo mantiene al día
 *     cuando la web repinta (una vez llamada, se queda escuchando); cada web decide si lo enciende.
 *   GP.tarjetas.abierta()    → la tarjeta abierta como ventana, o null
 *   GP.tarjetas.cerrar()     → la cierra (true si había una)
 */
(function () {
  if (window.GP && window.GP.tarjetas) return;   // (copiada en dos sitios de la misma página: una sola vez)

  var C = ".gpt-celda>.gpt-tarjeta";
  var CSS = ""
    + ".gpt-rejilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,var(--gpt-min,280px)),1fr));"
    +   "grid-auto-rows:1fr;gap:var(--gpt-hueco,12px);align-items:stretch}"
    + ".gpt-celda{display:flex;min-width:0}"
    + C + "{flex:1;min-width:0;display:flex;flex-direction:column;margin:0;box-sizing:border-box}"
    + C + ":not([open])>summary{flex:1;display:flex;flex-direction:column;height:auto;box-sizing:border-box}"
    // cerrada: lo justo
    + C + ":not([open]) .gpt-l2," + C + ":not([open]) .gpt-l3{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden}"
    + C + ":not([open]) .gpt-l2{-webkit-line-clamp:2;line-clamp:2}"
    + C + ":not([open]) .gpt-l3{-webkit-line-clamp:3;line-clamp:3}"
    + C + ":not([open]) .gpt-l1{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
    + C + ":not([open]) .gpt-solo-ventana{display:none!important}"
    + C + "[open] .gpt-solo-tarjeta{display:none!important}"
    + C + ":not([open]) .gpt-pie{margin-top:auto}"
    + C + "[open] .gpt-mas{display:none}"
    + ".gpt-mas{align-self:flex-start}"
    + ".gpt-cerrar,.gpt-velo{display:none}"
    // 16-oct · la rejilla equilibrada (data-gpt-n) y la caja cerrada
    // 16-oct · la rejilla equilibrada (data-gpt-n): K columnas o una sola, nunca una fila coja (con 3: 3 o 1; con 4: 2 × 2 o 1…)
    + ".gpt-rejilla[data-gpt-n='2']{grid-template-columns:repeat(auto-fit,minmax(max(calc(100%/2 - var(--gpt-hueco,12px)),min(100%,max(0px,calc((2*var(--gpt-min,280px)*.8 - 100%)*999)))),1fr))}"
    + ".gpt-rejilla[data-gpt-n='3']{grid-template-columns:repeat(auto-fit,minmax(max(calc(100%/3 - var(--gpt-hueco,12px)),min(100%,max(0px,calc((3*var(--gpt-min,280px)*.8 - 100%)*999)))),1fr))}"
    + ".gpt-rejilla[data-gpt-n='4']{grid-template-columns:repeat(auto-fit,minmax(max(calc(100%/2 - var(--gpt-hueco,12px)),min(100%,max(0px,calc((2*var(--gpt-min,280px)*.8 - 100%)*999)))),1fr))}"
    + ".gpt-rejilla[data-gpt-n='6'],.gpt-rejilla[data-gpt-n='9']{grid-template-columns:repeat(auto-fit,minmax(max(calc(100%/3 - var(--gpt-hueco,12px)),min(100%,max(0px,calc((3*var(--gpt-min,280px)*.8 - 100%)*999)))),1fr))}"
    + ".gpt-rejilla[data-gpt-n='8']{grid-template-columns:repeat(auto-fit,minmax(max(calc(100%/2 - var(--gpt-hueco,12px)),min(100%,max(0px,calc((2*var(--gpt-min,280px)*.8 - 100%)*999)))),1fr))}"
    + ".gp-cerrada{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.3rem;text-align:center;"
    +   "box-sizing:border-box;min-width:0;min-height:100%;overflow:hidden;color:var(--gp-cerrada-tinta,rgba(255,255,255,.55));"
    +   "background:var(--gp-cerrada-fondo,repeating-linear-gradient(135deg,rgba(0,0,0,.55) 0 10px,rgba(0,0,0,.42) 10px 20px));"
    +   "border:1px dashed var(--gp-cerrada-borde,rgba(255,255,255,.18))!important;filter:none!important;user-select:none}"
    + ".gp-cerrada>*:not(.gp-cerrada-ico):not(.gp-cerrada-txt){display:none!important}"
    + ".gp-cerrada-ico{width:28px;height:28px;flex:none;background:var(--gp-cerrada-icono,none) center/contain no-repeat;font-size:1.2rem;line-height:28px;opacity:.85}"
    + ".gp-cerrada-txt{font-size:.85rem;line-height:1.25;max-width:100%;overflow-wrap:anywhere}"
    // abierta: la ventana
    + C + "[open]{position:fixed;z-index:var(--gpt-capa,60);top:var(--gpt-arriba,24px);left:0;right:0;margin:0 auto;"
    +   "width:min(var(--gpt-ancho,760px),calc(100vw - 32px));max-height:calc(100vh - 2*var(--gpt-arriba,24px));"
    +   "max-height:calc(100dvh - 2*var(--gpt-arriba,24px));overflow:auto;overscroll-behavior:contain;display:block;"
    +   "box-shadow:var(--gpt-sombra,0 24px 70px rgba(0,0,0,.6))}"
    + C + "[open]>summary{cursor:default}"
    + C + "[open]>.gpt-cerrar{display:flex;align-items:center;justify-content:center;position:fixed;"
    +   "z-index:calc(var(--gpt-capa,60) + 1);top:calc(var(--gpt-arriba,24px) + 10px);"
    +   "right:calc((100vw - min(var(--gpt-ancho,760px),calc(100vw - 32px))) / 2 + 10px);width:38px;height:38px;"
    +   "padding:0;border-radius:50%;border:1px solid var(--gpt-cerrar-borde,rgba(128,128,128,.5));"
    +   "background:var(--gpt-cerrar-fondo,#fff);color:var(--gpt-cerrar-tinta,#111);font-size:1.5rem;line-height:1;cursor:pointer}"
    + C + "[open]>.gpt-cerrar:hover," + C + "[open]>.gpt-cerrar:focus-visible{border-color:var(--gpt-acento,currentColor)}"
    + ".gpt-celda:has(>.gpt-tarjeta[open])>.gpt-velo{display:block;position:fixed;inset:0;z-index:calc(var(--gpt-capa,60) - 1);"
    +   "background:var(--gpt-velo,rgba(0,0,0,.72));cursor:pointer}"
    + "@media(max-width:640px){"
    +   C + "[open]{top:8px;width:calc(100vw - 16px);max-height:calc(100vh - 16px);max-height:calc(100dvh - 16px)}"
    +   C + "[open]>.gpt-cerrar{top:16px;right:16px}"
    + "}";

  function ponerEstilo() {
    if (document.getElementById("gpt-estilo")) return;
    var st = document.createElement("style"); st.id = "gpt-estilo"; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function abierta() { return document.querySelector(".gpt-celda > .gpt-tarjeta[open]"); }
  function cerrar() { var d = abierta(); if (!d) return false; d.open = false; return true; }
  function escHtml(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /** 16-oct · la caja cerrada: del tamaño de su rejilla, oscurecida y sin lo de dentro; `texto`, lo único que dice («Se abre en la semana 5»). */
  function cerrada(texto, o) {
    o = o || {};
    var t = String(texto == null ? "" : texto), etiqueta = o.etiqueta || (t ? "Cerrado: " + t : "Cerrado todavía");
    return '<div class="gp-cerrada' + (o.clase ? " " + escHtml(o.clase) : "") + '" role="note" aria-label="' + escHtml(etiqueta) + '">' +
      '<span class="gp-cerrada-ico" aria-hidden="true">' + (o.icono === false ? "" : escHtml(o.icono || "🔒")) + "</span>" +
      (t ? '<span class="gp-cerrada-txt">' + escHtml(t) + "</span>" : "") + "</div>";
  }
  /** 16-oct · la rejilla equilibrada en toda la página: data-gpt-n = cuántas celdas visibles lleva cada .gpt-rejilla, al día al repintar. */
  var OBS = null, PEND = false;
  function contar(raiz) {
    var L = (raiz || document).querySelectorAll ? (raiz || document).querySelectorAll(".gpt-rejilla") : [];
    for (var i = 0; i < L.length; i++) {
      var r = L[i], n = 0;
      for (var c = r.firstElementChild; c; c = c.nextElementSibling) if (!c.hidden) n++;
      if (r.getAttribute("data-gpt-n") !== String(n)) r.setAttribute("data-gpt-n", String(n));
    }
  }
  function equilibrar() {
    contar(document);
    if (OBS || typeof MutationObserver === "undefined" || !document.body) return;
    OBS = new MutationObserver(function () {
      if (PEND) return; PEND = true;
      (window.requestAnimationFrame || setTimeout)(function () { PEND = false; contar(document); });
    });
    OBS.observe(document.body, { childList: true, subtree: true });
  }
  function celda(html) {
    return '<div class="gpt-celda">' + html + '<div class="gpt-velo" data-gpt-cerrar aria-hidden="true"></div></div>';
  }

  ponerEstilo();
  // la ×, el velo, y que pulsar el texto de la ventana no la cierre (los enlaces, botones y campos, sí funcionan)
  document.addEventListener("click", function (ev) {
    var t = ev.target; if (!t || !t.closest) return;
    if (t.closest("[data-gpt-cerrar]")) { if (abierta()) { ev.preventDefault(); cerrar(); } return; }
    if (t.closest(".gpt-celda > .gpt-tarjeta[open] > summary") && !t.closest("a,button,input,textarea,select,label")) ev.preventDefault();
  });
  // Esc: solo si no hay otra ventana encima con el foco (esa se cierra antes)
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    var d = abierta(), a = document.activeElement; if (!d) return;
    if (a && a !== document.body && !d.contains(a)) return;
    d.open = false;
  });

  window.GP = window.GP || {};
  window.GP.tarjetas = { celda: celda, cerrada: cerrada, equilibrar: equilibrar, contar: contar, abierta: abierta, cerrar: cerrar, CSS: CSS };
})();
