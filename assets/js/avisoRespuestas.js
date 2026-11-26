/**
 * LA VENTANA DE RESPUESTAS NUEVAS (26-nov-2026) · pieza del motor, común a STARGATE y DPG.
 *
 * Norberto (1-oct, en STARGATE): «¿cómo saben ellos que les has respondido? Necesito algo llamativo: que cuando tengan mensajes,
 * nada más entrar se les abra una ventana o algo que no puedan pasar por alto… y un botón de ¿He resuelto la pregunta?
 * ¿Necesitas algo más?». DPG la copió con su estética (correo.js, 2-oct) y el 25-nov llegó también al recluta de la Nave. Eran dos
 * copias de lo mismo; el 26-nov («haz la pieza común del aviso para STARGATE y DPG») la ventana pasa aquí y cada web pone lo suyo.
 *
 * Qué hace la pieza (lo mismo en todas las webs):
 *   · una ventana encima de la página (diálogo de verdad: el foco no se escapa con Tab, Escape la cierra), con cada respuesta, lo
 *     que se preguntó y quién contesta;
 *   · si la duda quedó resuelta: «¿Te ha resuelto la duda?» → «Sí, resuelta» (la tarjeta se desvanece y el título cuenta las que
 *     quedan; sin ninguna, se cierra) o «Necesito algo más» (escribe qué falta); si no: «Entendido» o «Contestar»;
 *   · la × (o Escape) la cierra SOLO en esta pestaña: en la próxima visita vuelve, mientras no pulse un botón. Se apunta en
 *     sessionStorage con la clave que da la web (`pestana`), para que la web no la vuelva a abrir en esta pestaña (`cerradas`).
 * Qué pone cada web: de dónde salen las respuestas y qué hace cada botón (`acciones`, con su buzón), los textos, los retratos,
 * el pie y la piel (`clases`: las clases de su hoja de estilos para cada parte). Sin `clases`, la pieza trae una piel neutra con
 * variables (--gpav-fondo, --gpav-borde, --gpav-texto, --gpav-suave, --gpav-acento, --gpav-capa).
 *
 *   GP.avisoRespuestas.abrir(o) → true si la ha abierto (con otra abierta, o sin nada que enseñar, no abre).
 *     o = {
 *       items: [{ id, tu?: { titulo, detalle? }, citas?: [texto], quien, retratoQuien?, t (ms), texto, resuelto? }],
 *       eti, retrato?, titulo?: function (n) → texto,
 *       pie?: { texto, boton?: { texto, href } | { texto, alPulsar } },   // alPulsar, después de cerrarla por ahora
 *       acciones: { si(x) → promesa, ok(x) → promesa o valor, enviar(x, texto, esMas) → promesa, contestar?(x) → true si lo hace ella },
 *       textos?: { gracias, anotado, enviado, fallo(motivo ya escapado) → html, falta, contestarEtiqueta, … (ver TEXTOS) },
 *       pestana (clave de sessionStorage), clases?, btn? ("btn"), btnPrincipal? ("btn primary"),
 *       dentro? (false: «Contestar» abre la caja debajo de los botones; true: la caja y el «gracias» ocupan su sitio),
 *       etiqueta? (false: lo que se pide va dentro de la caja; true: encima, a la vista), corte? (220: lo que se cita de su
 *       mensaje), maxlength? (1900), filas? (3), esperaCierre? (2600 ms), alQuitar?()   · x.anotado cambia el «Anotado» de una tarjeta
 *     }
 *   GP.avisoRespuestas.cerradas(pestana) → los id cerrados con la × en esta pestaña
 *   GP.avisoRespuestas.abierta() → true si hay una abierta
 *   GP.avisoRespuestas.cerrar() → la cierra por ahora (como la ×)
 *
 * Se copia en el build de cada web (como anuncio.js) y NO se edita allí: aquí. Prueba: tests/sdk/avisoRespuestas.test.ts.
 */
(function () {
  if (typeof window === "undefined") return;
  window.GP = window.GP || {};
  if (window.GP.avisoRespuestas) return;   // (copiada en dos sitios de la misma página: una sola vez)

  var TEXTOS = {
    pregunta: "¿Te ha resuelto la duda?", si: "Sí, resuelta", mas: "Necesito algo más", ok: "Entendido", contestar: "Contestar",
    enviar: "Enviar", cerrar: "Cerrar por ahora", escribeAlgo: "Escribe algo primero.", enviando: "Enviando…",
    falta: "Cuéntanos qué te falta o qué no ha funcionado…", contestarEtiqueta: "Escribe tu respuesta…",
    gracias: "¡Gracias! Así sabemos que te sirve.", anotado: "Anotado. Si hay novedades, te avisamos aquí.", enviado: "Enviado.",
    fallo: function (motivo) { return "No ha salido (" + motivo + "). Prueba otra vez."; },
  };
  // las partes de la ventana: cada una lleva su clase gpav-… y, si la web la da, la de su piel
  var PARTES = ["fondo", "caja", "cab", "eti", "x", "lista", "m", "tu", "cita", "r", "quien", "acc", "q", "escribe", "falta", "botones",
                "st", "hecho", "error", "fuera", "pie"];
  var A = null;   // la abierta: { o, caja, items, antesFoco }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function parrafos(t) { return esc(t).replace(/\r?\n/g, "<br>"); }
  function cuando(ms) { try { return new Date(Number(ms)).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
  function corto(t, n) { t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; }
  function ss() { try { return window.sessionStorage || null; } catch (e) { return null; } }

  function cerradas(clave) {
    var S = ss(); if (!S || !clave) return [];
    try { var v = JSON.parse(S.getItem(clave) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function apuntarCerradas(clave, ids) {
    var S = ss(); if (!S || !clave) return;
    var c = cerradas(clave); ids.forEach(function (k) { if (c.indexOf(k) < 0) c.push(k); });
    try { S.setItem(clave, JSON.stringify(c)); } catch (e) {}
  }

  function css() {
    if (document.getElementById("gpav-css")) return;
    var s = document.createElement("style"); s.id = "gpav-css";
    s.textContent =
      ".gpav-fondo{position:fixed;inset:0;z-index:var(--gpav-capa,1900);background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px}" +
      ".gpav-caja{width:min(620px,100%);max-height:min(88vh,760px);display:flex;flex-direction:column;overflow:hidden;background:var(--gpav-fondo,#121722);color:var(--gpav-texto,#eee);border:2px solid var(--gpav-acento,#37e0ec);border-radius:16px}" +
      ".gpav-cab{display:flex;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid var(--gpav-borde,rgba(255,255,255,.18))}" +
      ".gpav-cab>img{width:48px;height:48px;border-radius:50%;object-fit:cover;flex:none}.gpav-cab h2{margin:2px 0 0;font-size:1.2rem}" +
      ".gpav-eti{font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--gpav-acento,#37e0ec)}" +
      ".gpav-x{margin-left:auto;align-self:flex-start;background:none;border:0;color:inherit;font-size:1.6rem;line-height:1;cursor:pointer;padding:2px 6px}" +
      ".gpav-lista{overflow:auto;padding:4px 16px}.gpav-m{padding:12px 0;border-bottom:1px solid var(--gpav-borde,rgba(255,255,255,.18))}.gpav-m:last-child{border-bottom:0}" +
      ".gpav-tu{margin:0;font-size:.85rem;color:var(--gpav-suave,#aab)}.gpav-cita{margin:4px 0 8px;padding:6px 10px;border-left:3px solid var(--gpav-borde,rgba(255,255,255,.18));color:var(--gpav-suave,#aab);font-style:italic}" +
      ".gpav-r{border:1px solid var(--gpav-borde,rgba(255,255,255,.18));border-radius:12px;padding:10px 12px}.gpav-r p{margin:6px 0 0;line-height:1.45}" +
      ".gpav-quien{display:flex;align-items:center;gap:8px;font-weight:700}.gpav-quien img{width:24px;height:24px;border-radius:50%;object-fit:cover}.gpav-quien time{margin-left:auto;font-weight:400;font-size:.8rem;color:var(--gpav-suave,#aab)}" +
      ".gpav-acc,.gpav-botones{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}.gpav-q{font-weight:700}" +
      ".gpav-falta{display:grid;gap:6px}.gpav-falta textarea{width:100%;min-height:72px;font:inherit}.gpav-hecho{margin:8px 0 0;font-weight:700}" +
      ".gpav-fuera{opacity:0;max-height:0!important;padding-top:0;padding-bottom:0;border-color:transparent;overflow:hidden;transition:opacity .3s,max-height .35s,padding .35s}" +
      ".gpav-pie{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 16px;border-top:1px solid var(--gpav-borde,rgba(255,255,255,.18));font-size:.85rem}" +
      "@media (max-width:600px){.gpav-fondo{align-items:flex-end;padding:0}.gpav-caja{border-radius:16px 16px 0 0;max-height:92dvh;padding-bottom:env(safe-area-inset-bottom,0px)}}";
    document.head.appendChild(s);
  }

  function abrir(o) {
    if (A || !o || !o.items || !o.items.length || !o.acciones) return false;
    var T = {}; Object.keys(TEXTOS).forEach(function (k) { T[k] = (o.textos && o.textos[k] != null) ? o.textos[k] : TEXTOS[k]; });
    var C = {}; PARTES.forEach(function (p) { C[p] = "gpav-" + (p === "caja" ? "caja" : p) + (o.clases && o.clases[p] ? " " + o.clases[p] : ""); });
    var BTN = o.btn || "btn", BTNP = o.btnPrincipal || "btn primary", corte = o.corte || 220, dentro = !!o.dentro;
    var titulo = o.titulo || function (n) { return n === 1 ? "Tienes una respuesta nueva" : "Tienes " + n + " respuestas nuevas"; };
    if (!o.clases) css();
    var items = o.items.slice();

    function botones(x) {
      return x.resuelto
        ? '<span class="' + C.q + '">' + esc(T.pregunta) + '</span><button type="button" class="' + BTNP + '" data-si>' + esc(T.si) + '</button><button type="button" class="' + BTN + '" data-mas>' + esc(T.mas) + '</button>'
        : '<button type="button" class="' + BTNP + '" data-ok>' + esc(T.ok) + '</button><button type="button" class="' + BTN + '" data-mas>' + esc(T.contestar) + '</button>';
    }
    function escribe(x) {
      var et = x.resuelto ? T.falta : T.contestarEtiqueta;
      return '<label class="' + C.falta + '">' + (o.etiqueta ? '<span>' + esc(et) + '</span><textarea' : '<textarea placeholder="' + esc(et) + '" aria-label="' + esc(et) + '"') +
        ' rows="' + (o.filas || 3) + '" maxlength="' + (o.maxlength || 1900) + '"></textarea></label>' +
        '<div class="' + C.botones + '"><button type="button" class="' + BTNP + '" data-enviar>' + esc(T.enviar) + '</button><span class="' + C.st + '" role="status"></span></div>';
    }
    function tarjeta(x, i) {
      var cab = "";
      if (x.tu) cab += '<p class="' + C.tu + '"><b>' + esc(x.tu.titulo) + '</b>' + (x.tu.detalle ? " · " + esc(x.tu.detalle) : "") + '</p>';
      (x.citas || []).forEach(function (c) { cab += '<p class="' + C.cita + '">«' + esc(corto(c, corte)) + '»</p>'; });
      return '<article class="' + C.m + '" data-i="' + i + '">' + cab +
        '<div class="' + C.r + '"><div class="' + C.quien + '">' + (x.retratoQuien ? '<img loading="lazy" decoding="async" src="' + esc(x.retratoQuien) + '" alt="">' : "") +
          esc(x.quien) + '<time>' + esc(cuando(x.t)) + '</time></div><p>' + parrafos(x.texto) + '</p></div>' +
        '<div class="' + C.acc + '" data-acc>' + botones(x) + '</div>' +
        (dentro ? "" : '<div class="' + C.escribe + '" data-escribe hidden>' + escribe(x) + '</div>') +
        '<p class="' + C.hecho + '" data-hecho hidden></p></article>';
    }

    var caja = document.createElement("div"); caja.className = C.fondo;
    var pie = o.pie ? '<footer class="' + C.pie + '"><span>' + esc(o.pie.texto) + '</span>' +
      (o.pie.boton ? (o.pie.boton.href ? '<a class="' + BTN + '" href="' + esc(o.pie.boton.href) + '">' + esc(o.pie.boton.texto) + '</a>'
                                       : '<button type="button" class="' + BTN + '" data-pie>' + esc(o.pie.boton.texto) + '</button>') : "") + '</footer>' : "";
    caja.innerHTML = '<div class="' + C.caja + '" role="dialog" aria-modal="true" aria-labelledby="gpav-t">' +
      '<header class="' + C.cab + '">' + (o.retrato ? '<img src="' + esc(o.retrato) + '" alt="">' : "") + '<div><div class="' + C.eti + '">' + esc(o.eti || "") + '</div>' +
        '<h2 id="gpav-t">' + esc(titulo(items.length)) + '</h2></div>' +
        '<button type="button" class="' + C.x + '" data-x aria-label="' + esc(T.cerrar) + '">&times;</button></header>' +
      '<div class="' + C.lista + '" data-lista>' + items.map(tarjeta).join("") + '</div>' + pie + '</div>';
    A = { o: o, caja: caja, items: items, antesFoco: document.activeElement };
    document.body.appendChild(caja);

    al(caja.querySelector("[data-x]"), cerrarPorAhora);   // la ×
    var bp = caja.querySelector("[data-pie]");
    if (bp) al(bp, function () { cerrarPorAhora(); try { o.pie.boton.alPulsar(); } catch (e) {} });
    caja.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { cerrarPorAhora(); return; }
      if (e.key !== "Tab") return;   // el foco no se escapa de la ventana
      var f = activos(caja, "button, textarea, a[href]"); if (!f.length) return;
      var pri = f[0], ult = f[f.length - 1];
      if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); } else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
    });
    Array.prototype.forEach.call(caja.querySelectorAll("article[data-i]"), function (art) { cablear(art, items[Number(art.getAttribute("data-i"))]); });
    enfocar(caja.querySelector("[data-si],[data-ok]"));
    var L = caja.querySelector("[data-lista]"); if (L) L.scrollTop = 0;

    function cablear(art, x) {
      var acc = art.querySelector("[data-acc]"), hecho = art.querySelector("[data-hecho]"), caj = art.querySelector("[data-escribe]");
      function apagar(si) { Array.prototype.forEach.call(art.querySelectorAll("button"), function (b) { b.disabled = !!si; }); }
      function listo(texto) {
        x.hecho = true;
        if (dentro) { acc.innerHTML = '<p class="' + C.hecho + '">' + esc(texto) + '</p>'; }
        else { acc.hidden = true; caj.hidden = true; hecho.hidden = false; hecho.className = C.hecho; hecho.textContent = texto; }
        if (A && A.caja === caja && items.every(function (y) { return y.hecho; })) setTimeout(function () { if (A && A.caja === caja) quitar(); }, o.esperaCierre || 2600);
      }
      function fallo(e) {
        apagar(false);
        var m = esc((e && (e.code || e.message)) || e), st = art.querySelector("[role=status]");
        if (dentro && st) { st.innerHTML = T.fallo(m); return; }
        hecho.hidden = false; hecho.className = C.hecho + " " + C.error; hecho.innerHTML = T.fallo(m);
      }
      function nada() { return Promise.resolve(); }
      function enviar(ta, st, esMas) {
        var t = String(ta.value || "").trim();
        if (!t) { if (st) st.textContent = T.escribeAlgo; ta.focus(); return; }
        apagar(true); if (st) st.textContent = T.enviando;
        Promise.resolve().then(function () { return o.acciones.enviar(x, t, esMas); }).then(function () { listo(T.enviado); }, fallo);
      }
      function abrirCaja() {
        if (dentro) {
          acc.innerHTML = escribe(x);
          var ta = acc.querySelector("textarea"), st = acc.querySelector("[role=status]");
          al(acc.querySelector("[data-enviar]"), function () { enviar(ta, st, !!x.resuelto); });
          enfocar(ta); return;
        }
        caj.hidden = false;
        var ta2 = caj.querySelector("textarea"), st2 = caj.querySelector("[role=status]");
        al(caj.querySelector("[data-enviar]"), function () { enviar(ta2, st2, !!x.resuelto); });
        enfocar(ta2);
      }
      var si = art.querySelector("[data-si]"), ok = art.querySelector("[data-ok]"), mas = art.querySelector("[data-mas]");
      if (si) al(si, function () {
        apagar(true);
        Promise.resolve().then(function () { return (o.acciones.si || nada)(x); }).then(function () { listo(T.gracias); retirar(art); }, fallo);
      });
      if (ok) al(ok, function () {
        apagar(true);
        Promise.resolve().then(function () { return (o.acciones.ok || nada)(x); }).then(function () { listo(x.anotado || T.anotado); }, fallo);
      });
      if (mas) al(mas, function () {
        if (!x.resuelto && o.acciones.contestar && o.acciones.contestar(x) === true) return;   // la web lo hace a su manera (p. ej., otra página)
        abrirCaja();
      });
    }

    /**
     * 10-oct · LO RESUELTO SE VA. Norberto: «cuando digo que sí está resuelta, me gustaría que desapareciese esa consulta, así da
     * sensación de que ya está zanjado (no borrar, que desapareciera de la pantalla y quedarán las respuestas sin resolver)». Tras
     * el «gracias», la tarjeta se desvanece; el título cuenta las que quedan y, sin ninguna, la ventana se cierra.
     */
    function retirar(art) {
      setTimeout(function () {
        if (!A || A.caja !== caja || !art.parentElement) return;
        var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        art.style.maxHeight = art.scrollHeight + "px"; void art.offsetHeight;   // desde su alto, para que la transición se vea
        C.fuera.split(" ").forEach(function (k) { art.classList.add(k); });
        setTimeout(function () {
          if (art.parentElement) art.remove();
          if (!A || A.caja !== caja) return;
          var n = caja.querySelectorAll("article[data-i]").length;
          if (!n) return quitar();
          caja.querySelector("#gpav-t").textContent = titulo(n);
          enfocar(activos(caja.querySelector("[data-lista]"), "button")[0]);
        }, quieto ? 0 : 380);
      }, o.retiro || 1300);
    }
    return true;
  }

  function al(el, fn) { if (el) el.addEventListener("click", fn); }
  /** Lo que se puede pulsar o escribir (sin lo apagado), en el orden de la página. */
  function activos(raiz, sel) { return Array.prototype.filter.call(raiz.querySelectorAll(sel), function (b) { return !b.disabled; }); }
  function enfocar(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) {} } }

  /** La × (o Escape): no vuelve a salir en esta pestaña; en la próxima visita, sí, mientras no pulse un botón. */
  function cerrarPorAhora() {
    if (!A) return false;
    apuntarCerradas(A.o.pestana, A.items.filter(function (x) { return !x.hecho; }).map(function (x) { return x.id; }));
    quitar();
    return true;
  }
  function quitar() {
    if (!A) return;
    var a = A; A = null;
    if (a.caja.parentElement) a.caja.remove();
    try { if (a.antesFoco && a.antesFoco.focus && (!document.contains || document.contains(a.antesFoco))) a.antesFoco.focus(); } catch (e) {}
    try { if (a.o.alQuitar) a.o.alQuitar(); } catch (e) {}
  }

  window.GP.avisoRespuestas = { abrir: abrir, cerradas: cerradas, abierta: function () { return !!A; }, cerrar: cerrarPorAhora, TEXTOS: TEXTOS };
})();
