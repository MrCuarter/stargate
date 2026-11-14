/**
 * UN ANUNCIO BREVE, UNA SOLA VEZ (23-oct-2026). Norberto, tras el ticket sin cuenta de STARGATE: «¿Puedes hacer que se abra un pop up
 * a los profesores muy breve con esta info?».
 *
 * Pieza del motor, sin piel: una ventana pequeña encima de la página con un título, dos o tres líneas y, si se quiere, un botón que
 * lleva a lo nuevo. Sale UNA vez por anuncio (`clave`) y persona (`quien`, su correo): al cerrarla de cualquier forma (el botón,
 * «Entendido», la ×, el velo o Esc) queda vista en ese navegador y no vuelve. Con `hasta` (AAAA-MM-DD), después de ese día ya no
 * sale: lo nuevo deja de serlo y quien llegue más tarde no ve noticias viejas. La norma de las ventanas del 6-oct: pulsar dentro no
 * la cierra; en el móvil ocupa el ancho.
 *
 *   GP.anuncio.mostrar(o) → true si la ha abierto. o = { clave, quien?, titulo, html (de la web: va tal cual), boton?: { texto,
 *       href?, alPulsar? }, entendido? ("Entendido"), hasta?, hoy? (AAAA-MM-DD; si no, hoy), almacen? (localStorage) }
 *   GP.anuncio.visto(clave, quien, almacen?) → true si ya lo vio
 *   GP.anuncio.cerrar() → true si había uno abierto (y lo da por visto)
 *
 * 🔴 14-nov · INSISTIR, CON MEDIDA. Norberto: «nuestros estudiantes no están respondiendo los tickets de salida. Haz algo para que les
 * salga un pop up cada vez que se termine un tema… insiste hasta 2 veces». Con `veces` (> 1) el mismo anuncio sale hasta ese número
 * de veces —la primera y `veces - 1` insistencias—, con al menos `cada` horas entre una y otra (20 por defecto: una por día, sin
 * agobiar en la misma visita). Cada vez que SALE cuenta (se apunta al abrirla: recargar sin cerrarla no la repite). `titulo`, `html`
 * y `entendido` pueden ser una lista (uno por vez; la última se repite) o una función de la vez (0, 1, 2…), para subir el tono.
 * Cuando lo que pide ya está hecho, `hecho()` la apaga para siempre. Sin `veces`, todo como antes: una vez, y cuenta al cerrarla.
 *   o += { veces?: 1, cada?: 20 (horas), ahora?: ms (si no, el reloj), clase? (una clase más en la capa, para la piel de la web) }
 *   GP.anuncio.vez(clave, quien, almacen?) → cuántas veces ha salido (con `visto`, ya no saldrá más)
 *   GP.anuncio.hecho(clave, quien, almacen?) → lo da por terminado: no vuelve a salir
 *
 * Variables de la piel (con valor por defecto): --gpa-fondo (#121722), --gpa-borde (rgba(255,255,255,.18)), --gpa-texto (#eee),
 * --gpa-acento (#37e0ec), --gpa-capa (1900). Se copia en el build de cada web (como videoVentana.js) y NO se edita allí: aquí.
 */
(function () {
  if (typeof window === "undefined") return;
  window.GP = window.GP || {};
  if (window.GP.anuncio) return;   // (copiada en dos sitios de la misma página: una sola vez)

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function almacenDe(a) { if (a) return a; try { return window.localStorage || null; } catch (e) { return null; } }
  function llave(clave, quien) { return "gpAnuncio:" + clave + ":" + String(quien || "").toLowerCase(); }
  function hoyIso() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }

  function visto(clave, quien, almacen) {
    var A = almacenDe(almacen);
    try { return !!(A && A.getItem(llave(clave, quien)) === "1"); } catch (e) { return false; }
  }
  function marcar(clave, quien, almacen) {
    var A = almacenDe(almacen);
    try { if (A) A.setItem(llave(clave, quien), "1"); } catch (e) { /* sin almacenamiento: se verá otra vez */ }
  }
  // (insistir: «n|t» = ha salido n veces, la última en t; «1» = terminado)
  function leerVeces(clave, quien, almacen) {
    var A = almacenDe(almacen), v = null;
    try { v = A ? A.getItem(llave(clave, quien)) : null; } catch (e) { v = null; }
    var m = /^(\d+)\|(\d+)$/.exec(String(v || ""));
    return m ? { n: Number(m[1]), t: Number(m[2]) } : { n: v === "1" ? 1 : 0, t: 0 };
  }
  function apuntarVez(o, n, ahora) {
    var A = almacenDe(o.almacen);
    try { if (A) A.setItem(llave(o.clave, o.quien), n >= o.veces ? "1" : n + "|" + ahora); } catch (e) { /* se verá otra vez */ }
  }
  function vez(clave, quien, almacen) { return leerVeces(clave, quien, almacen).n; }
  function deLaVez(v, n) {
    if (typeof v === "function") return v(n);
    if (Object.prototype.toString.call(v) === "[object Array]") return v.length ? v[Math.min(n, v.length - 1)] : "";
    return v;
  }

  var CSS = ""
    + ".gpa-capa{position:fixed;inset:0;z-index:var(--gpa-capa,1900);background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}"
    + ".gpa-ventana{position:relative;width:min(460px,100%);max-height:100%;overflow:auto;background:var(--gpa-fondo,#121722);color:var(--gpa-texto,#eee);"
    + "border:1px solid var(--gpa-borde,rgba(255,255,255,.18));border-radius:14px;padding:18px 18px 16px;box-shadow:0 20px 60px rgba(0,0,0,.55)}"
    + ".gpa-titulo{margin:0 44px 10px 0;font-size:1.1rem;font-weight:800;line-height:1.3;overflow-wrap:anywhere}"
    + ".gpa-texto{font-size:.95rem;line-height:1.5}.gpa-texto p{margin:0 0 8px}.gpa-texto a{color:var(--gpa-acento,#37e0ec)}"
    + ".gpa-x{position:absolute;top:10px;right:10px;width:40px;height:40px;border-radius:50%;border:1px solid var(--gpa-borde,rgba(255,255,255,.18));"
    + "background:transparent;color:inherit;font-size:1.1rem;cursor:pointer}"
    + ".gpa-botones{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}"
    + ".gpa-b{min-height:44px;padding:0 16px;border-radius:10px;border:1px solid var(--gpa-borde,rgba(255,255,255,.18));background:transparent;color:inherit;"
    + "font:inherit;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;text-decoration:none}"
    + ".gpa-b.gpa-si{background:var(--gpa-acento,#37e0ec);border-color:var(--gpa-acento,#37e0ec);color:#061018}"
    + ".gpa-x:focus-visible,.gpa-b:focus-visible{outline:2px solid var(--gpa-acento,#37e0ec);outline-offset:2px}"
    + "body.gpa-abierto{overflow:hidden}"
    + "@media (max-width:480px){.gpa-capa{padding:10px}.gpa-botones .gpa-b{flex:1 1 100%;justify-content:center}}";

  var capa = null, actual = null, volverA = null;
  function estilo() {
    if (document.getElementById("gpa-estilo")) return;
    var s = document.createElement("style"); s.id = "gpa-estilo"; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function mostrar(o) {
    o = o || {};
    if (!o.clave || !o.titulo || capa) return false;
    if (o.hasta && (o.hoy || hoyIso()) > o.hasta) return false;
    if (visto(o.clave, o.quien, o.almacen)) return false;
    var veces = Math.max(1, Math.floor(Number(o.veces) || 1)), n = 0;
    if (veces > 1) {
      var ahora = Number(o.ahora) || Date.now(), ya = leerVeces(o.clave, o.quien, o.almacen);
      var cada = (o.cada == null ? 20 : Math.max(0, Number(o.cada) || 0)) * 3600000;
      if (ya.n >= veces || (ya.n > 0 && ahora - ya.t < cada)) return false;
      n = ya.n;
      o = copia(o); o.veces = veces; o.vez = n;
      o.titulo = deLaVez(o.titulo, n); o.html = deLaVez(o.html, n); o.entendido = deLaVez(o.entendido, n);
      if (!o.titulo) return false;
      apuntarVez(o, n + 1, ahora);
    }
    estilo();
    actual = o; volverA = document.activeElement;
    var b = o.boton || null;
    capa = document.createElement("div");
    capa.className = "gpa-capa" + (o.clase ? " " + o.clase : "");
    capa.innerHTML = '<div class="gpa-ventana" role="dialog" aria-modal="true" aria-labelledby="gpa-titulo">'
      + '<button type="button" class="gpa-x" data-gpa="x" aria-label="Cerrar">✕</button>'
      + '<p class="gpa-titulo" id="gpa-titulo">' + esc(o.titulo) + '</p>'
      + '<div class="gpa-texto">' + (o.html || "") + '</div>'
      + '<div class="gpa-botones">'
      + (b ? (b.href ? '<a class="gpa-b gpa-si" data-gpa="si" href="' + esc(b.href) + '">' + esc(b.texto) + '</a>'
                     : '<button type="button" class="gpa-b gpa-si" data-gpa="si">' + esc(b.texto) + '</button>') : "")
      + '<button type="button" class="gpa-b" data-gpa="ok">' + esc(o.entendido || "Entendido") + '</button></div></div>';
    document.body.appendChild(capa);
    if (document.body.classList) document.body.classList.add("gpa-abierto");
    var f = capa.querySelector(b ? '[data-gpa="si"]' : '[data-gpa="ok"]'); if (f && f.focus) f.focus();
    return true;
  }
  function cerrar() {
    if (!capa) return false;
    var o = actual;
    if (!(o.veces > 1)) marcar(o.clave, o.quien, o.almacen);   // (insistiendo, ya se apuntó al salir)
    if (capa.remove) capa.remove(); else if (capa.parentNode) capa.parentNode.removeChild(capa);
    capa = null; actual = null;
    if (document.body.classList) document.body.classList.remove("gpa-abierto");
    if (volverA && volverA.focus) { try { volverA.focus(); } catch (e) {} }
    volverA = null;
    return true;
  }

  document.addEventListener("click", function (ev) {
    if (!capa) return;
    var d = ev.target.closest && ev.target.closest("[data-gpa]"), que = d ? d.getAttribute("data-gpa") : (ev.target === capa ? "velo" : "");
    if (!que) return;   // (pulsar dentro no la cierra)
    var o = actual, b = o && o.boton;
    if (que === "si" && b && !b.href) ev.preventDefault();
    if (que !== "si") ev.preventDefault();
    cerrar();
    if (que === "si" && b && b.alPulsar) { try { b.alPulsar(); } catch (e) {} }
  });
  document.addEventListener("keydown", function (ev) { if (capa && ev.key === "Escape") { if (ev.stopPropagation) ev.stopPropagation(); cerrar(); } }, true);

  function copia(o) { var x = {}, k; for (k in o) x[k] = o[k]; return x; }
  function hecho(clave, quien, almacen) {
    marcar(clave, quien, almacen);
    if (capa && actual && actual.clave === clave && String(actual.quien || "").toLowerCase() === String(quien || "").toLowerCase()) cerrar();
  }

  window.GP.anuncio = { mostrar: mostrar, cerrar: cerrar, visto: visto, vez: vez, hecho: hecho, CSS: CSS };
})();
