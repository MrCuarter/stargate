/**
 * GAMIFICAPRO · LA CÁPSULA (5-oct-2026) — pieza del motor para cualquier mod (la primera de `sdk/`, docs/PLAN_CENTRALIZAR.md).
 *
 * Norberto: «una cápsula espacial, que al abrirla apareciera la recompensa con algún efecto molón… tiene que poder hacerse
 * desde GamificaPro, porque lo instauraremos también en DPG» (allí, un cofre de madera: la piel). Y después: «el efecto de
 * premio es muy cutre… la app es mucho mejor». Así que lleva la dinámica del cofre de la app (src/pages/Personaje.tsx: pasan
 * los premios posibles y se frena en el tuyo), en grande:
 *
 *   1. LO CERRADO flota y late. «Abrir».
 *   2. TIEMBLA cada vez más, se le escapa la luz y ESTALLA (destello).
 *   3. LA TIRA: pasan a toda velocidad todos los premios posibles, con su imagen y el color de su rareza, con un «tic» por
 *      cada uno que cruza la marca, y se frena hasta caer en el tuyo.
 *   4. LA REVELACIÓN: tu premio en grande, con rayos que giran detrás, su rareza, un brillo que lo recorre y confeti
 *      (más cuanto más raro). Un acorde al final.
 *
 * El premio YA lo ha decidido y pagado el servidor: esto solo lo enseña. Sin textos, imágenes ni colores de ningún mod: todo
 * llega en `o`. Cada web lo copia en su build (STARGATE: _build_site.py → assets/js/capsula.js) y NO se edita allí: aquí.
 * Con «menos movimiento» en el sistema: sin tira ni animaciones, el premio directamente.
 *
 *   GP.capsula.montar(el, {
 *     imagen, alt,                          // lo cerrado (se recorta al centro, cuadrado)
 *     antes, boton,                         // HTML bajo lo cerrado y el texto del botón
 *     casillas: [{ id, img, cifra, titulo, nivel }],   // TODOS los premios posibles (la tira); nivel 1-4
 *     ganadora: id,                         // la que ha tocado
 *     despues,                              // HTML bajo el premio
 *     rarezas: ["Común", "Raro", "Épico", "Legendario"],
 *     colores: { acento, acento2, rareza: [c1, c2, c3, c4] },
 *     sonido: true
 *   })
 */
(function () {
  var CSS = ""
    + ".gpc{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}"
    + ".gpc-escena{position:relative;width:100%;max-width:440px;aspect-ratio:1/1;border-radius:18px;overflow:hidden;background:radial-gradient(circle at 50% 45%,#0c1a26,#03060b 75%);isolation:isolate}"
    + ".gpc-cerrada{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}"
    + ".gpc-img{width:100%;height:100%;object-fit:cover;animation:gpcFlota 3.2s ease-in-out infinite;filter:drop-shadow(0 0 18px var(--gpc-a))}"
    + ".gpc-halo{position:absolute;inset:12%;border-radius:50%;box-shadow:0 0 60px 10px var(--gpc-a);opacity:.35;animation:gpcLate 1.6s ease-in-out infinite;pointer-events:none}"
    + ".gpc-fuga{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 50%,#fff 0,var(--gpc-a) 18%,transparent 55%);mix-blend-mode:screen;transition:opacity 1.2s ease-in}"
    + ".gpc-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:5}"
    + ".gpc-chispas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:6}"
    + ".gpc.abriendo .gpc-img{animation:gpcTiembla .09s linear infinite;filter:brightness(1.3) saturate(1.4) drop-shadow(0 0 30px var(--gpc-a))}"
    + ".gpc.abriendo .gpc-fuga{opacity:.95}"
    + ".gpc.abriendo .gpc-halo{animation:gpcLate .3s ease-in-out infinite;opacity:.8}"
    + ".gpc.estalla .gpc-flash{animation:gpcFlash .8s ease-out forwards}"
    // la tira
    + ".gpc-tira{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);height:46%;display:none;z-index:3;-webkit-mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)}"
    + ".gpc.tirando .gpc-tira{display:block}.gpc.tirando .gpc-cerrada{display:none}"
    + ".gpc-pista{position:absolute;top:0;bottom:0;left:0;display:flex;gap:10px;will-change:transform}"
    + ".gpc-c{flex:none;width:var(--gpc-w);height:100%;border-radius:12px;overflow:hidden;position:relative;background:#0b1420;border:2px solid var(--r);box-shadow:inset 0 -30px 40px -10px var(--r)}"
    + ".gpc-c img{width:100%;height:100%;object-fit:cover;opacity:.92}"
    + ".gpc-c b{position:absolute;left:0;right:0;bottom:0;padding:4px 2px;font-size:12px;letter-spacing:.02em;background:linear-gradient(transparent,rgba(0,0,0,.85));color:#fff}"
    + ".gpc-c .gpc-cf{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#fff;text-shadow:0 2px 10px #000,0 0 18px var(--r)}"
    + ".gpc-marca{position:absolute;top:-6px;bottom:-6px;left:50%;width:3px;margin-left:-1.5px;background:var(--gpc-b);box-shadow:0 0 14px var(--gpc-b);z-index:4;display:none}"
    + ".gpc-marca:before,.gpc-marca:after{content:'';position:absolute;left:50%;margin-left:-9px;border:9px solid transparent}"
    + ".gpc-marca:before{top:-2px;border-top-color:var(--gpc-b)}.gpc-marca:after{bottom:-2px;border-bottom-color:var(--gpc-b)}"
    + ".gpc.tirando .gpc-marca{display:block}"
    // la revelación
    + ".gpc-revela{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:2}"
    + ".gpc.revelada .gpc-revela{display:flex}.gpc.revelada .gpc-tira,.gpc.revelada .gpc-marca,.gpc.revelada .gpc-cerrada{display:none}"
    + ".gpc-rayos{position:absolute;inset:-30%;background:repeating-conic-gradient(from 0deg,var(--r) 0deg 7deg,transparent 7deg 20deg);opacity:.33;-webkit-mask:radial-gradient(circle,#000 18%,transparent 62%);mask:radial-gradient(circle,#000 18%,transparent 62%);animation:gpcGira 14s linear infinite}"
    + ".gpc-gana{position:relative;width:64%;aspect-ratio:3/4;border-radius:16px;overflow:hidden;border:3px solid var(--r);box-shadow:0 0 50px var(--r),0 0 120px -20px var(--r);animation:gpcSale .8s cubic-bezier(.18,1.5,.4,1) both;background:#0b1420}"
    + ".gpc-gana img{width:100%;height:100%;object-fit:cover}"
    + ".gpc-gana .gpc-cf{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:54px;font-weight:800;color:#fff;text-shadow:0 3px 14px #000,0 0 30px var(--r)}"
    + ".gpc-gana:after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);transform:translateX(-120%);animation:gpcBrillo 1.6s .7s ease-in-out 2}"
    + ".gpc-rz{position:absolute;top:10px;left:0;right:0;margin:0 auto;width:max-content;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;background:var(--r);color:#05080d;z-index:2;animation:gpcSale .5s .5s both}"
    + ".gpc-tit{position:absolute;left:0;right:0;bottom:0;padding:22px 8px 10px;font-size:19px;font-weight:800;background:linear-gradient(transparent,rgba(0,0,0,.9));color:#fff}"
    + ".gpc-tx{margin:0;font-size:16px;min-height:1em}"
    + "@keyframes gpcFlota{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.015)}}"
    + "@keyframes gpcLate{0%,100%{opacity:.25}50%{opacity:.6}}"
    + "@keyframes gpcTiembla{0%{transform:translate(0,0) rotate(0)}25%{transform:translate(-5px,3px) rotate(-2deg)}50%{transform:translate(4px,-4px) rotate(1.5deg)}75%{transform:translate(-3px,-2px) rotate(-1deg)}100%{transform:translate(0,0) rotate(0)}}"
    + "@keyframes gpcFlash{0%{opacity:0}15%{opacity:1}100%{opacity:0}}"
    + "@keyframes gpcSale{0%{transform:scale(.2) rotate(-8deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}"
    + "@keyframes gpcGira{to{transform:rotate(360deg)}}"
    + "@keyframes gpcBrillo{to{transform:translateX(120%)}}"
    + "@media (prefers-reduced-motion:reduce){.gpc *{animation:none!important;transition:none!important}}";
  var QUIETO = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  function estilo() {
    if (document.getElementById("gpc-css")) return;
    var st = document.createElement("style"); st.id = "gpc-css"; st.textContent = CSS; document.head.appendChild(st);
  }

  // ── el sonido, sin ficheros (Web Audio): el «tic» de la tira, el estallido y el acorde final ──
  var AC = null;
  function audio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); return AC; } catch (e) { return null; } }
  function tono(f, dur, vol, tipo, cuando) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (cuando || 0), o = a.createOscillator(), g = a.createGain();
    o.type = tipo || "square"; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function estallido() {
    var a = audio(); if (!a) return;
    var n = a.sampleRate * 0.5, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    var s = a.createBufferSource(), g = a.createGain(); g.gain.value = 0.25; s.buffer = b; s.connect(g); g.connect(a.destination); s.start();
  }
  function acorde(nivel) {
    var base = [523.25, 659.25, 783.99, 1046.5];
    base.slice(0, 2 + Math.min(2, nivel)).forEach(function (f, i) { tono(f, 0.7 + nivel * 0.15, 0.06, "triangle", i * 0.09); });
  }

  function chispas(cv, nivel, cols) {
    var ctx = cv.getContext && cv.getContext("2d"); if (!ctx) return;
    var W = cv.width = cv.offsetWidth * 2, H = cv.height = cv.offsetHeight * 2;
    var P = [], n = [70, 110, 170, 260][nivel - 1];
    var lanzar = function (x0, y0, ang, abre, k) {
      for (var i = 0; i < k; i++) {
        var a = ang + (Math.random() - 0.5) * abre, v = (4 + Math.random() * 9) * (1 + nivel * 0.2);
        P.push({ x: x0, y: y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 4 + Math.random() * 7, h: 3 + Math.random() * 5,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cols[i % cols.length], vida: 70 + Math.random() * 60, t0: P.length % 3 });
      }
    };
    lanzar(W / 2, H / 2, 0, Math.PI * 2, n);
    if (nivel >= 3) { lanzar(0, H, -Math.PI / 3, 0.9, n / 3); lanzar(W, H, -Math.PI * 2 / 3, 0.9, n / 3); }
    var t = 0;
    (function paso() {
      ctx.clearRect(0, 0, W, H); var vivas = 0;
      P.forEach(function (p) {
        if (t > p.vida) return; vivas++;
        p.x += p.vx; p.y += p.vy; p.vy += 0.16; p.vx *= 0.985; p.rot += p.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t / p.vida); ctx.fillStyle = p.c; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.t0) ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); else { ctx.beginPath(); ctx.arc(0, 0, p.h / 1.4, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      t++; if (vivas) requestAnimationFrame(paso); else ctx.clearRect(0, 0, W, H);
    })();
  }

  function tarjeta(c, col) {
    return '<div class="gpc-c" style="--r:' + col + '">' + (c.img ? '<img src="' + esc(c.img) + '" alt="">' : "")
      + (c.cifra ? '<span class="gpc-cf">' + esc(c.cifra) + "</span>" : "") + "<b>" + esc(c.titulo || "") + "</b></div>";
  }

  function montar(el, o) {
    estilo();
    var col = Object.assign({ acento: "#37e0ec", acento2: "#f5b043", rareza: ["#9fb3c8", "#3fa9ff", "#b48cff", "#ffc94a"] }, o.colores || {});
    var RZ = o.rarezas || ["Común", "Raro", "Épico", "Legendario"];
    var casillas = (o.casillas || []).filter(Boolean);
    var gana = casillas.filter(function (c) { return c.id === o.ganadora; })[0] || casillas[0] || { titulo: "", nivel: 1 };
    var nivel = Math.min(4, Math.max(1, Number(gana.nivel) || 1)), colGana = col.rareza[nivel - 1];
    el.innerHTML = '<div class="gpc" style="--gpc-a:' + col.acento + '99;--gpc-b:' + col.acento2 + '">'
      + '<div class="gpc-escena">'
      + '<div class="gpc-cerrada"><img class="gpc-img" src="' + esc(o.imagen) + '" alt="' + esc(o.alt || "") + '"><div class="gpc-halo"></div><div class="gpc-fuga"></div></div>'
      + '<div class="gpc-tira"><div class="gpc-pista"></div></div><div class="gpc-marca"></div>'
      + '<div class="gpc-revela" style="--r:' + colGana + '"><div class="gpc-rayos"></div><div class="gpc-gana"></div></div>'
      + '<div class="gpc-flash"></div><canvas class="gpc-chispas"></canvas></div>'
      + '<div class="gpc-tx">' + (o.antes || "") + '</div><button type="button" class="btn primary grande gpc-abrir">' + esc(o.boton || "Abrir") + "</button></div>";
    var caja = el.querySelector(".gpc"), escena = caja.querySelector(".gpc-escena");
    var conSonido = o.sonido !== false;

    var revelar = function () {
      caja.querySelector(".gpc-gana").innerHTML = '<span class="gpc-rz">' + esc(RZ[nivel - 1]) + "</span>"
        + (gana.img ? '<img src="' + esc(gana.img) + '" alt="">' : "") + (gana.cifra ? '<span class="gpc-cf">' + esc(gana.cifra) + "</span>" : "")
        + '<div class="gpc-tit">' + esc(gana.titulo || "") + "</div>";
      caja.classList.remove("tirando"); caja.classList.add("revelada");
      caja.querySelector(".gpc-tx").innerHTML = o.despues || "";
      if (!QUIETO) chispas(caja.querySelector(".gpc-chispas"), nivel, [colGana, col.acento, col.acento2, "#ffffff"]);
      if (conSonido) acorde(nivel);
    };

    var tirar = function () {
      caja.classList.add("tirando");
      var pista = caja.querySelector(".gpc-pista"), W = escena.offsetWidth, w = Math.round(W * 0.34), gap = 10, paso = w + gap;
      escena.style.setProperty("--gpc-w", w + "px");
      // 44 tarjetas al azar; la ganadora en la 38 (después hay más: no se ve el final)
      var lista = [], N = 44, I = 38;
      for (var i = 0; i < N; i++) lista.push(i === I ? gana : casillas[Math.floor(Math.random() * casillas.length)]);
      pista.innerHTML = lista.map(function (c) { return tarjeta(c, col.rareza[Math.min(4, Math.max(1, c.nivel || 1)) - 1]); }).join("");
      var desvio = (Math.random() - 0.5) * w * 0.6, fin = -(I * paso - (W / 2 - w / 2)) - desvio, ini = W * 0.6;
      var dur = 4800, t0 = performance.now(), ult = -1;
      (function paso_() {
        var k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 4), x = ini + (fin - ini) * e;
        pista.style.transform = "translateX(" + x + "px)";
        var bajo = Math.floor((W / 2 - x) / paso);
        if (bajo !== ult) { ult = bajo; if (conSonido) tono(1400 - k * 600, 0.035, 0.04, "square"); }
        if (k < 1) requestAnimationFrame(paso_); else setTimeout(revelar, 450);
      })();
    };

    caja.querySelector(".gpc-abrir").onclick = function () {
      this.remove();
      if (conSonido) audio();
      if (QUIETO) return revelar();
      caja.classList.add("abriendo");
      if (conSonido) [0, .25, .5, .7, .85, 1, 1.1, 1.2].forEach(function (s) { tono(90 + s * 160, 0.12, 0.05, "sawtooth", s); });
      setTimeout(function () {
        caja.classList.add("estalla"); if (conSonido) estallido();
        setTimeout(function () { caja.classList.remove("abriendo"); tirar(); }, 220);
      }, 1400);
    };
  }

  window.GP = window.GP || {};
  window.GP.capsula = { montar: montar };
})();
