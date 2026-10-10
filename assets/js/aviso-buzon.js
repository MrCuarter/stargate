/*
 * STARGATE · EL AVISO DE RESPUESTAS (1-oct-2026) · assets/js/aviso-buzon.js
 *
 * Norberto: «Cuando contestas a los profesores, ¿cómo saben ellos que les has respondido? Necesito algo llamativo: que cuando
 * tengan mensajes, nada más entrar se les abra una ventana o algo que no puedan pasar por alto. Además, junto con la respuesta,
 * un botón de ¿He resuelto la pregunta? ¿Necesitas algo más? Así analizamos la utilidad del buzón». Hasta hoy, una respuesta era
 * un numerito en «¿Dudas? ¿Algo falla?» y un correo: Caridad no vio la suya en un día.
 *
 * Lo pone la construcción (_build_site.py → AVISO_EN) en las páginas del docente: la consola, la Academia, Gestionar grupos,
 * Profesores y Crear un grupo. Nunca en lo que se proyecta (la sesión, el aula, la presentación), ni incrustado, ni en la consola
 * de ensayo, ni a un recluta (lo suyo le llega a su chat de NEBULA).
 *  - Del buzón (stargate_buzon): lo que el Mando o NEBULA le ha contestado y aún no ha leído (`visto === false`; lo ya abierto en
 *    el buzón de este navegador, `sgBzVistos`, no cuenta: la misma cuenta que la burbuja de la consola). Si el mensaje quedó
 *    «resuelto»: «¿Te ha resuelto la duda?» → «Sí» (una respuesta suya, «✓ Me ha resuelto la duda.», y se cierra) o «Necesito
 *    algo más» (escribe qué le falta; el mensaje vuelve a la guardia, que lo contesta en menos de 24 horas). Si quedó en marcha o anotado:
 *    «Entendido» o «Contestar».
 *  - De la Academia (stargate_formacion): lo que NEBULA o el Alto Mando le escribieron allí después de lo último que leyó en
 *    este navegador (`sgAcademia.claudeVisto`, la misma marca que la píldora) y en los últimos 7 días. «Entendido» o «Contestar».
 * La ventana vuelve a salir en cada visita hasta que conteste o pulse «Entendido»; la × la cierra solo en esta pestaña.
 * Las frases de la valoración son de motor.js (BUZON_VALORA): la guardia las cuenta con `buzon.cjs utilidad`.
 */
(function () {
  "use strict";
  if (window.top !== window || window.SG_ENSAYO || /[?&](embed|demo)=1(&|$)/.test(location.search)) return;
  var CERRADO = "sgAvisoCerrado", ACD = "sgAcademia.claudeVisto", SEMANA = 7 * 864e5;
  var M = null, ITEMS = [], caja = null, antesFoco = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function cuando(ms) { try { return new Date(Number(ms)).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
  function corto(t, n) { t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; }
  function leer(st, k, d) { try { var v = st.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function poner(st, k, v) { try { st.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function esperarMotor() {
    return new Promise(function (ok) {
      (function mira(i) {
        var m = window.SG && window.SG.MOTOR;
        if (m && m.buzonMios && m.sesion) return ok(m);
        if (i > 120) return ok(null);   // 30 s: sin motor (sin red, otro motor), no hay aviso
        setTimeout(function () { mira(i + 1); }, 250);
      })(0);
    });
  }

  /** Lo que tiene sin leer: [{ fuente: "buzon"|"academia", … }]. */
  function sinLeer() {
    return M.sesion().then(function (yo) {
      if (!yo) return [];
      return Promise.all([M.buzonMios().catch(function () { return []; }),
                          M.academiaMia ? M.academiaMia().catch(function () { return null; }) : null]).then(function (r) {
        var abiertos = leer(localStorage, "sgBzVistos", {}) || {}, cerrados = leer(sessionStorage, CERRADO, []) || [], out = [];
        (r[0] || []).forEach(function (m) {
          var rs = m.respuestas || [], ult = rs[rs.length - 1];
          if (m.tipo === "recluta" || (m.contexto || {}).desde === "gamificapro") return;
          if (m.visto !== false || !ult || ult.de !== "mando") return;
          if (rs.length <= Number(abiertos[m.id] || -1) || cerrados.indexOf(m.id) >= 0) return;
          out.push({ fuente: "buzon", id: m.id, m: m, r: ult, t: Number(ult.fecha) || Number(m.actualizado) || 0,
                     nebula: m.projectId === (window.SG_PER_ACADEMIA || "academia-cero") });
        });
        var d = r[1];
        if (d) {
          var desde = Math.max(Number(leer(localStorage, ACD, 0)) || 0, Date.now() - SEMANA);
          [["claude", (d.claude || {}).mensajes], ["mando", (d.mando || {}).mensajes]].forEach(function (par) {
            var L = par[1] || {};
            Object.keys(L).forEach(function (k) {
              var x = L[k] || {}, t = Number(x.t) || Number(k) || 0, id = "acd:" + par[0] + ":" + k;
              if (t > desde && x.texto && cerrados.indexOf(id) < 0) out.push({ fuente: "academia", id: id, t: t, texto: x.texto, mando: par[0] === "mando", nebula: par[0] !== "mando" });
            });
          });
        }
        return out.sort(function (a, b) { return a.t - b.t; });
      });
    }).catch(function () { return []; });
  }

  function css() {
    if (document.getElementById("sgav-css")) return;
    var s = document.createElement("style"); s.id = "sgav-css";
    s.textContent =
      ".sgav-fondo{position:fixed;inset:0;z-index:10050;background:rgba(3,7,12,.78);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;animation:sgavIn .25s ease-out}" +
      "@keyframes sgavIn{from{opacity:0}to{opacity:1}}" +
      ".sgav{width:min(640px,100%);max-height:min(88vh,760px);display:flex;flex-direction:column;background:var(--panel,#101a28);border:2px solid var(--amber,#f5b043);border-radius:16px;box-shadow:0 0 0 6px rgba(245,176,67,.14),0 24px 60px rgba(0,0,0,.6);color:var(--ink,#e9f0f6);overflow:hidden}" +
      ".sgav-cab{display:flex;gap:12px;align-items:center;padding:14px 16px;background:linear-gradient(90deg,rgba(245,176,67,.18),rgba(55,224,236,.08));border-bottom:1px solid var(--line,#1c2c40)}" +
      ".sgav-cab img{width:44px;height:44px;border-radius:50%;object-fit:cover;flex:none;animation:sgavLatido 1.6s ease-in-out 3}" +
      "@keyframes sgavLatido{50%{transform:scale(1.12)}}" +
      ".sgav-eyebrow{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--amber,#f5b043);font-weight:700}" +
      ".sgav-cab h2{margin:2px 0 0;font-size:1.25rem;line-height:1.2}" +
      ".sgav-x{margin-left:auto;align-self:flex-start;background:none;border:0;color:var(--mut,#9fb2c2);font-size:1.6rem;line-height:1;cursor:pointer;padding:2px 6px}" +
      ".sgav-x:hover,.sgav-x:focus-visible{color:#fff}" +
      ".sgav-lista{overflow:auto;padding:4px 16px}" +
      ".sgav-m{padding:12px 0;border-bottom:1px solid var(--line,#1c2c40)}.sgav-m:last-child{border-bottom:0}" +
      ".sgav-tu{margin:0;font-size:.82rem;color:var(--mut,#9fb2c2)}" +
      ".sgav-cita{margin:4px 0 8px;padding:6px 10px;border-left:3px solid var(--line,#1c2c40);color:var(--mut,#9fb2c2);font-size:.9rem;font-style:italic}" +
      ".sgav-r{background:rgba(55,224,236,.07);border:1px solid rgba(55,224,236,.28);border-radius:12px;padding:10px 12px}" +
      ".sgav-quien{display:flex;align-items:center;gap:8px;font-weight:700;font-size:.9rem;color:var(--teal,#37e0ec)}" +
      ".sgav-quien img{width:22px;height:22px;border-radius:50%;object-fit:cover}.sgav-quien time{margin-left:auto;font-weight:400;font-size:.78rem;color:var(--mut,#9fb2c2)}" +
      ".sgav-r p{margin:6px 0 0;white-space:pre-wrap;line-height:1.45;font-size:.95rem}" +
      ".sgav-acc{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}" +
      ".sgav-q{font-weight:700;margin-right:4px}" +
      ".sgav .btn{padding:9px 14px;font-size:.88rem}" +
      ".sgav-escribe{margin-top:8px;display:flex;flex-direction:column;gap:8px}.sgav-escribe[hidden]{display:none}" +
      ".sgav-escribe textarea{width:100%;min-height:72px;resize:vertical;background:var(--bg2,#0d1420);color:var(--ink,#e9f0f6);border:1px solid var(--line,#1c2c40);border-radius:10px;padding:8px 10px;font:inherit}" +
      ".sgav-escribe .btn{align-self:flex-start}" +
      ".sgav-hecho{margin:8px 0 0;color:var(--teal,#37e0ec);font-weight:700}.sgav-error{color:var(--amber,#f5b043)}" +
      // 10-oct · lo resuelto se va de la ventana (no se borra: sigue en el buzón)
      ".sgav-m.sgav-fuera{opacity:0;max-height:0!important;padding-top:0;padding-bottom:0;margin:0;border-color:transparent;overflow:hidden;transition:opacity .3s,max-height .35s,padding .35s}" +
      ".sgav-pie{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 16px;border-top:1px solid var(--line,#1c2c40);font-size:.85rem;color:var(--mut,#9fb2c2)}" +
      "@media (max-width:560px){.sgav-fondo{align-items:flex-end;padding:0}.sgav{border-radius:16px 16px 0 0;max-height:92vh}.sgav-cab h2{font-size:1.08rem}}";
    document.head.appendChild(s);
  }

  function retrato(nebula) { return nebula ? "assets/img/personajes/nebula.png" : "assets/img/iconos/p/envivo.png"; }

  function tarjeta(x, i) {
    var quien = x.fuente === "academia" ? (x.mando ? "El Alto Mando" : "NEBULA") : (x.nebula ? "NEBULA" : "El Mando");
    var resuelto = x.fuente === "buzon" && x.m.estado === "resuelto";
    var cab = x.fuente === "buzon"
      ? '<p class="sgav-tu"><b>Tu mensaje</b> · ' + esc(cuando(x.m.creado)) + (x.m.grupo ? " · " + esc(x.m.grupo) : "") + '</p><p class="sgav-cita">«' + esc(corto(x.m.texto, 220)) + '»</p>'
      : '<p class="sgav-tu"><b>En la Academia de la Cero</b></p>';
    var acc = resuelto
      ? '<span class="sgav-q">¿Te ha resuelto la duda?</span><button type="button" class="btn primary" data-si>Sí, resuelta</button><button type="button" class="btn" data-mas>Necesito algo más</button>'
      : '<button type="button" class="btn primary" data-ok>Entendido</button><button type="button" class="btn" data-mas>Contestar</button>';
    return '<article class="sgav-m" data-i="' + i + '">' + cab +
      '<div class="sgav-r"><div class="sgav-quien"><img src="' + retrato(x.nebula || (x.fuente === "academia" && !x.mando)) + '" alt="">' + quien + '<time>' + esc(cuando(x.t)) + '</time></div>' +
        '<p>' + esc(x.fuente === "buzon" ? x.r.texto : x.texto) + '</p></div>' +
      '<div class="sgav-acc">' + acc + '</div>' +
      '<div class="sgav-escribe" hidden><textarea maxlength="1900" placeholder="' + (resuelto ? "Cuéntanos qué te falta o qué no ha funcionado…" : "Escribe tu respuesta…") + '" aria-label="Tu respuesta"></textarea>' +
        '<button type="button" class="btn primary" data-enviar>Enviar</button></div>' +
      '<p class="sgav-hecho" hidden></p></article>';
  }

  function pintar() {
    css();
    var n = ITEMS.length, nebula = ITEMS.every(function (x) { return x.nebula || (x.fuente === "academia" && !x.mando); });
    antesFoco = document.activeElement;
    caja = document.createElement("div"); caja.className = "sgav-fondo";
    caja.innerHTML = '<div class="sgav" role="dialog" aria-modal="true" aria-labelledby="sgav-t">' +
      '<header class="sgav-cab"><img src="' + retrato(nebula) + '" alt=""><div><div class="sgav-eyebrow">' + (nebula ? "NEBULA te ha respondido" : "Frecuencia de mando") + '</div>' +
        '<h2 id="sgav-t">' + (n === 1 ? "Tienes una respuesta nueva" : "Tienes " + n + " respuestas nuevas") + '</h2></div>' +
        '<button type="button" class="sgav-x" aria-label="Cerrar por ahora">&times;</button></header>' +
      '<div class="sgav-lista">' + ITEMS.map(tarjeta).join("") + '</div>' +
      '<footer class="sgav-pie"><span>Tus mensajes y respuestas, siempre en el buzón.</span><a class="btn" href="buzon.html">Ver todos mis mensajes</a></footer></div>';
    document.body.appendChild(caja);
    caja.querySelector(".sgav-x").onclick = cerrarPorAhora;
    caja.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarPorAhora(); });
    Array.prototype.forEach.call(caja.querySelectorAll(".sgav-m"), cablear);
    var f = caja.querySelector("[data-si],[data-ok]"); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
    caja.querySelector(".sgav-lista").scrollTop = 0;
  }

  /**
   * 10-oct · LO RESUELTO SE VA. Norberto: «cuando digo que sí está resuelta, me gustaría que desapareciese esa consulta, así da
   * sensación de que ya está zanjado (no borrar, que desapareciera de la pantalla y quedarán las respuestas sin resolver)». Tras el
   * «¡Gracias!», la tarjeta se desvanece; el título cuenta las que quedan y, si no queda ninguna, la ventana se cierra. El mensaje
   * sigue entero en el buzón.
   */
  function retirar(art) {
    setTimeout(function () {
      if (!caja || !art.parentNode) return;
      var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      art.style.maxHeight = art.scrollHeight + "px"; void art.offsetHeight;   // desde su alto, para que la transición se vea
      art.classList.add("sgav-fuera");
      setTimeout(function () {
        if (art.parentNode) art.parentNode.removeChild(art);
        if (!caja) return;
        var n = caja.querySelectorAll(".sgav-m").length;
        if (!n) return quitar();
        caja.querySelector("#sgav-t").textContent = n === 1 ? "Tienes una respuesta nueva" : "Tienes " + n + " respuestas nuevas";
        var f = caja.querySelector(".sgav-m button:not([disabled])"); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
      }, quieto ? 0 : 380);
    }, 1300);
  }

  /** La × (o Escape): no vuelve a salir en esta pestaña; en la próxima visita, sí, mientras no conteste. */
  function cerrarPorAhora() {
    var c = leer(sessionStorage, CERRADO, []) || [];
    ITEMS.forEach(function (x) { if (!x.hecho && c.indexOf(x.id) < 0) c.push(x.id); });
    poner(sessionStorage, CERRADO, c);
    quitar();
  }
  function quitar() {
    if (caja && caja.parentNode) caja.parentNode.removeChild(caja);
    caja = null;
    try { if (antesFoco && antesFoco.focus) antesFoco.focus(); } catch (e) {}
  }

  function cablear(art) {
    var x = ITEMS[Number(art.getAttribute("data-i"))], esc_ = art.querySelector(".sgav-escribe"), ta = art.querySelector("textarea");
    var hecho = art.querySelector(".sgav-hecho"), acc = art.querySelector(".sgav-acc");
    var V = M.BUZON_VALORA || {}, resuelto = x.fuente === "buzon" && x.m.estado === "resuelto";
    function listo(html) {
      x.hecho = true; acc.hidden = true; esc_.hidden = true; hecho.hidden = false; hecho.classList.remove("sgav-error"); hecho.innerHTML = html;
      if (ITEMS.every(function (y) { return y.hecho; })) setTimeout(quitar, 2600);
    }
    function fallo(e) {
      hecho.hidden = false; hecho.classList.add("sgav-error");
      hecho.innerHTML = "No ha salido (" + esc((e && (e.code || e.message)) || e) + "). Prueba desde el <a href=\"buzon.html\">buzón</a>.";
      Array.prototype.forEach.call(art.querySelectorAll("button"), function (b) { b.disabled = false; });
    }
    function apagar() { Array.prototype.forEach.call(art.querySelectorAll("button"), function (b) { b.disabled = true; }); }
    // lo leído en el buzón de este navegador, con cuántas respuestas: la burbuja de la consola deja de contarlo
    function abierto(extra) {
      var a = leer(localStorage, "sgBzVistos", {}) || {}; a[x.id] = (x.m.respuestas || []).length + (extra || 0); poner(localStorage, "sgBzVistos", a);
    }
    function academiaLeida() { poner(localStorage, ACD, Math.max(Number(leer(localStorage, ACD, 0)) || 0, x.t)); }

    var si = art.querySelector("[data-si]"), ok = art.querySelector("[data-ok]"), mas = art.querySelector("[data-mas]"), env = art.querySelector("[data-enviar]");
    if (si) si.onclick = function () {
      apagar();
      M.buzonResponder(x.id, V.si || "✓ Me ha resuelto la duda.", { estado: "resuelto" })
        .then(function () { return M.buzonVisto(x.id); })
        .then(function () { abierto(1); listo("¡Gracias, Comandante! Nos ayuda a saber que el buzón sirve."); retirar(art); }, fallo);
    };
    if (ok) ok.onclick = function () {
      if (x.fuente === "academia") { academiaLeida(); return listo("Anotado."); }
      apagar();
      M.buzonVisto(x.id).then(function () { abierto(0); listo("Anotado. Si hay novedades, te avisamos aquí."); }, fallo);
    };
    if (mas) mas.onclick = function () {
      if (x.fuente === "academia") { academiaLeida(); location.href = "buzon.html?desde=academia"; return; }
      esc_.hidden = false; ta.focus();
    };
    if (env) env.onclick = function () {
      var t = ta.value.trim();
      if (!t) { ta.focus(); return; }
      apagar();
      // «Necesito algo más» vuelve a la guardia (el mensaje pasa a «nuevo») con la frase delante: así se cuenta
      M.buzonResponder(x.id, (resuelto ? (V.mas || "Necesito algo más: ") : "") + t, {})
        .then(function () { return M.buzonVisto(x.id); })
        .then(function () { abierto(1); listo("Enviado. Te contestamos aquí y por correo en menos de 24 horas."); }, fallo);
    };
  }

  function arrancar() {
    esperarMotor().then(function (m) {
      if (!m) return;
      M = m;
      return sinLeer().then(function (L) { ITEMS = L; if (ITEMS.length && !caja) pintar(); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();
  // quien entra después de cargar la página («Entrar con Google»): se mira entonces
  document.addEventListener("sg:sesion", function (e) {
    if (!M || !e.detail || caja || ITEMS.length) return;
    sinLeer().then(function (L) { ITEMS = L; if (ITEMS.length && !caja) pintar(); });
  });
})();
