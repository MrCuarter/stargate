/**
 * GAMIFICAPRO · LA CÁPSULA (5-oct-2026) — pieza del motor para cualquier mod (la primera de `sdk/`, docs/PLAN_CENTRALIZAR.md).
 *
 * Norberto: «una cápsula espacial, que al abrirla apareciera la recompensa con algún efecto molón… tiene que poder hacerse
 * desde GamificaPro, porque lo instauraremos también en DPG». Un premio que YA ha decidido y pagado el servidor se enseña
 * así: la cápsula (o el cofre, o lo que diga la piel) → «Abrir» → tiembla y se carga de luz → estalla → sale el premio.
 * Cuanto más raro (nivel 1-4), más luz y más chispas. Con «menos movimiento» en el sistema, se abre sin animación.
 *
 * NO lleva textos, imágenes ni colores de ningún mod: todo llega en `o` (la piel). Cada web lo copia en su build
 * (STARGATE: _build_site.py → assets/js/capsula.js) y no se edita allí: se edita aquí.
 *
 *   GP.capsula.montar(el, {
 *     imagen, alt,                       // lo cerrado (una imagen cuadrada o que se recorta al centro)
 *     antes,                             // HTML bajo la cápsula antes de abrirla
 *     boton: "Abrir",                    // el texto del botón
 *     nivel: 1..4,
 *     premio: { img } | { cifra },       // lo que sale: una imagen o una cifra grande
 *     titulo,                            // el nombre del premio (texto)
 *     despues,                           // HTML bajo la cápsula ya abierta
 *     colores: { acento, acento2, raro, epico } // la piel (por defecto, unos neutros)
 *   })
 */
(function () {
  var CSS = ""
    + ".gpc{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}"
    + ".gpc-escena{position:relative;width:100%;max-width:420px;aspect-ratio:1/1;border-radius:16px;overflow:hidden;background:#04070d}"
    + ".gpc-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 45%;transform:scale(1.55);transition:transform .5s,filter .5s,opacity .4s}"
    + ".gpc-luz{position:absolute;inset:0;transition:background .6s}"
    + ".gpc-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}"
    + ".gpc-chispas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}"
    + ".gpc-premio{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:8px;font-size:22px;font-weight:700}"
    + ".gpc-premio img{width:78%;border-radius:12px;box-shadow:0 0 40px var(--gpc-a)}"
    + ".gpc-cifra{font-size:64px;line-height:1;color:var(--gpc-b);text-shadow:0 0 24px var(--gpc-b)}"
    + ".gpc-tx{margin:0;font-size:16px}"
    + ".gpc.abriendo .gpc-img{animation:gpcTiembla .12s linear infinite;filter:brightness(1.25) saturate(1.3)}"
    + ".gpc.abriendo .gpc-luz{background:radial-gradient(circle at 50% 48%,#ffffffd0 0,var(--gpc-a) 30%,transparent 62%)}"
    + ".gpc.n3.abriendo .gpc-luz{background:radial-gradient(circle at 50% 48%,#fff4d0e6 0,var(--gpc-r) 32%,transparent 64%)}"
    + ".gpc.n4.abriendo .gpc-luz{background:radial-gradient(circle at 50% 48%,#fff6d8 0,var(--gpc-e) 34%,transparent 66%)}"
    + ".gpc.estalla .gpc-flash{animation:gpcFlash .7s ease-out forwards}"
    + ".gpc.abierta .gpc-img{transform:scale(2.6);opacity:0;animation:none}"
    + ".gpc.abierta .gpc-luz{background:radial-gradient(circle at 50% 50%,var(--gpc-a) 0,transparent 70%);opacity:.45}"
    + ".gpc.abierta .gpc-premio{display:flex;animation:gpcSale .6s cubic-bezier(.2,1.4,.4,1) both}"
    + ".gpc.n4.abierta .gpc-premio img{box-shadow:0 0 60px var(--gpc-b)}"
    + "@keyframes gpcTiembla{0%{transform:scale(1.55)}25%{transform:scale(1.57) translate(-4px,2px) rotate(-1.5deg)}50%{transform:scale(1.56) translate(3px,-3px) rotate(1deg)}75%{transform:scale(1.58) translate(-2px,-2px) rotate(-.5deg)}100%{transform:scale(1.55)}}"
    + "@keyframes gpcFlash{0%{opacity:0}20%{opacity:1}100%{opacity:0}}"
    + "@keyframes gpcSale{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}"
    + "@media (prefers-reduced-motion:reduce){.gpc *{animation:none!important;transition:none!important}}";
  var QUIETO = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  function estilo() {
    if (document.getElementById("gpc-css")) return;
    var st = document.createElement("style"); st.id = "gpc-css"; st.textContent = CSS; document.head.appendChild(st);
  }

  function chispas(cv, nivel, col) {
    var ctx = cv.getContext && cv.getContext("2d"); if (!ctx) return;
    var W = cv.width = cv.offsetWidth * 2, H = cv.height = cv.offsetHeight * 2;
    var COL = [[col.acento, "#ffffff"], [col.acento, col.acento2], [col.acento2, col.raro, col.acento], [col.epico, col.acento2, col.raro, "#ffffff"]][nivel - 1];
    var P = [], n = [60, 90, 130, 200][nivel - 1];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = (2 + Math.random() * 7) * (1 + nivel * 0.25);
      P.push({ x: W / 2, y: H / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, r: 2 + Math.random() * 4, c: COL[i % COL.length], vida: 60 + Math.random() * 50 });
    }
    var t = 0;
    (function paso() {
      ctx.clearRect(0, 0, W, H); var vivas = 0;
      P.forEach(function (p) {
        if (t > p.vida) return; vivas++;
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.985;
        ctx.globalAlpha = Math.max(0, 1 - t / p.vida); ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      t++; if (vivas) requestAnimationFrame(paso); else ctx.clearRect(0, 0, W, H);
    })();
  }

  function montar(el, o) {
    estilo();
    var col = Object.assign({ acento: "#37e0ec", acento2: "#f5b043", raro: "#b48cff", epico: "#ffd76a" }, o.colores || {});
    var nivel = Math.min(4, Math.max(1, Number(o.nivel) || 1));
    el.innerHTML = '<div class="gpc n' + nivel + '" style="--gpc-a:' + col.acento + '88;--gpc-b:' + col.acento2 + ';--gpc-r:' + col.raro + '88;--gpc-e:' + col.epico + 'aa">'
      + '<div class="gpc-escena"><img class="gpc-img" src="' + esc(o.imagen) + '" alt="' + esc(o.alt || "") + '"><div class="gpc-luz"></div>'
      + '<div class="gpc-flash"></div><canvas class="gpc-chispas"></canvas><div class="gpc-premio"></div></div>'
      + '<div class="gpc-tx">' + (o.antes || "") + '</div><button type="button" class="btn primary grande gpc-abrir">' + esc(o.boton || "Abrir") + "</button></div>";
    var caja = el.querySelector(".gpc");
    caja.querySelector(".gpc-abrir").onclick = function () {
      this.remove();
      var revelar = function () {
        var P = o.premio || {};
        caja.querySelector(".gpc-premio").innerHTML = (P.img ? '<img src="' + esc(P.img) + '" alt="">' : '<span class="gpc-cifra">' + esc(P.cifra) + "</span>")
          + "<span>" + esc(o.titulo || "") + "</span>";
        caja.classList.add("abierta");
        caja.querySelector(".gpc-tx").innerHTML = o.despues || "";
        if (!QUIETO) chispas(caja.querySelector(".gpc-chispas"), nivel, col);
      };
      if (QUIETO) return revelar();
      caja.classList.add("abriendo");
      setTimeout(function () { caja.classList.add("estalla"); setTimeout(revelar, 260); }, 1500);
    };
  }

  window.GP = window.GP || {};
  window.GP.capsula = { montar: montar };
})();
