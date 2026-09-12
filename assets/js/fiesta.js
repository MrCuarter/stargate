/**
 * STARGATE · LA FIESTA
 *
 * Lo que pasa cuando algo pasa. Un sistema puede estar perfecto por dentro y sentirse muerto por
 * fuera: marcas un reto, la página se recarga, y el número es otro. Nadie celebra un número que
 * cambia solo.
 *
 * Esto es lo contrario: los contadores ruedan, saltan cifras del punto donde has pulsado, suena una
 * moneda, y si has subido de nivel se para todo un segundo para decírtelo. Señales de «aquí ha
 * pasado algo» y «vas por buen camino».
 *
 * 🔴 Tres reglas que no se negocian:
 *
 * 1. El sonido lo enciende quien pulsa, nunca la página. Los navegadores lo exigen y, sobre todo,
 *    es de mala educación: mucha gente abre esto en clase, con el proyector puesto. Hay interruptor
 *    y se recuerda.
 * 2. `prefers-reduced-motion` manda. Hay quien se marea de verdad con esto. Si el sistema dice que
 *    no, no hay partículas ni contadores rodando: el número cambia y ya está. Nadie se queda sin
 *    saber lo que ha ganado.
 * 3. Nada de esto puede romper nada. Si falla la fiesta, el reto ya está registrado; se traga el
 *    error y sigue. Celebrar es lo último que debe importar cuando algo va mal.
 *
 * No carga ni un fichero: los sonidos se sintetizan con el propio navegador. Cero peticiones, cero
 * dependencias, y suena igual sin conexión.
 */
(function () {
  "use strict";
  var KEY_SON = "sgSonido";
  var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------- el sonido
  var ctx = null;
  function audio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    return ctx;
  }
  function suena() { return localStorage.getItem(KEY_SON) !== "no"; }

  /** Una nota. `tipo` es la forma de onda; el resto es envolvente. */
  function nota(frec, ini, dur, vol, tipo) {
    var a = audio(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = tipo || "sine";
    o.frequency.setValueAtTime(frec, a.currentTime + ini);
    // Ataque muy corto y caída exponencial: es lo que hace que suene a «pling» y no a pitido.
    g.gain.setValueAtTime(0.0001, a.currentTime + ini);
    g.gain.exponentialRampToValueAtTime(vol, a.currentTime + ini + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + ini + dur);
    o.connect(g); g.connect(a.destination);
    o.start(a.currentTime + ini); o.stop(a.currentTime + ini + dur + 0.02);
  }

  var SONIDOS = {
    // Dos notas que suben: «has ganado algo».
    xp: function () { nota(660, 0, .14, .10, "triangle"); nota(990, .07, .16, .08, "triangle"); },
    // La moneda de toda la vida: dos tonos altos muy juntos, el segundo más agudo.
    moneda: function () { nota(1180, 0, .09, .09, "square"); nota(1720, .06, .13, .07, "square"); },
    // Gastar suena al revés: baja.
    gasto: function () { nota(880, 0, .10, .07, "triangle"); nota(560, .07, .16, .06, "triangle"); },
    // Subir de nivel: un arpegio de cuatro notas. Es el único momento que se celebra a lo grande.
    nivel: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { nota(f, i * .10, .34, .10, "triangle"); });
    },
    // Insignia: un brillo, más agudo y con cola.
    insignia: function () { nota(1568, 0, .22, .07, "sine"); nota(2093, .09, .30, .05, "sine"); },
    error: function () { nota(320, 0, .18, .07, "sawtooth"); }
  };

  function sonar(cual) {
    if (!suena() || !SONIDOS[cual]) return;
    try { var a = audio(); if (a && a.state === "suspended") a.resume(); SONIDOS[cual](); } catch (e) {}
  }

  // ---------------------------------------------------------------- los contadores que ruedan
  /**
   * Lleva un número de `desde` a `hasta` en `ms`.
   *
   * Con reducción de movimiento se planta en el valor final: lo que no puede pasar es que alguien
   * se quede sin ver cuánto tiene.
   */
  function rodar(el, desde, hasta, ms) {
    if (!el) return;
    if (quieto || desde === hasta) { el.textContent = hasta; return; }
    var t0 = performance.now(), d = hasta - desde;
    el.classList.add("rodando");
    (function paso(t) {
      var k = Math.min(1, (t - t0) / (ms || 900));
      // Frena al final (easeOutCubic): un contador a velocidad constante parece roto.
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(desde + d * e);
      if (k < 1) requestAnimationFrame(paso);
      else { el.textContent = hasta; el.classList.remove("rodando"); }
    })(t0);
  }

  // ---------------------------------------------------------------- las cifras que saltan
  /** «+250 xp» saliendo del sitio donde has pulsado. */
  function salta(x, y, texto, clase) {
    if (quieto) return;
    var e = document.createElement("div");
    e.className = "salta " + (clase || "");
    e.textContent = texto;
    e.style.left = x + "px"; e.style.top = y + "px";
    document.body.appendChild(e);
    setTimeout(function () { e.remove(); }, 1400);
  }

  // ---------------------------------------------------------------- las chispas
  /**
   * Un estallido de partículas. En canvas y no en DOM: cuarenta elementos animándose a la vez hacen
   * sudar a un portátil de clase, y estas páginas se abren en portátiles de clase.
   */
  function chispas(x, y, colores) {
    if (quieto) return;
    var c = document.createElement("canvas");
    c.className = "chispas"; c.width = 360; c.height = 360;
    c.style.left = (x - 180) + "px"; c.style.top = (y - 180) + "px";
    document.body.appendChild(c);
    var g = c.getContext("2d"), P = [], N = 34;
    for (var i = 0; i < N; i++) {
      var a = (Math.PI * 2 * i) / N + Math.random() * .4, v = 2.4 + Math.random() * 3.6;
      P.push({ x: 180, y: 180, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.1,
               r: 1.6 + Math.random() * 2.4, c: colores[i % colores.length], vida: 1 });
    }
    (function paso() {
      g.clearRect(0, 0, 360, 360);
      var vivas = 0;
      P.forEach(function (p) {
        if (p.vida <= 0) return;
        vivas++;
        p.x += p.vx; p.y += p.vy; p.vy += 0.13; p.vx *= 0.985; p.vida -= 0.022;
        g.globalAlpha = Math.max(0, p.vida);
        g.fillStyle = p.c;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.284); g.fill();
      });
      if (vivas) requestAnimationFrame(paso); else c.remove();
    })();
  }

  // ---------------------------------------------------------------- subir de nivel
  /** El único momento que para la pantalla. Si subir de nivel no se nota, no es subir de nivel. */
  function nivelNuevo(nivel, rango, titulo) {
    sonar("nivel");
    var d = document.createElement("div");
    d.className = "nivel-arriba";
    d.innerHTML = '<div class="na-caja">' +
      '<span class="na-eyebrow">Has subido de nivel</span>' +
      '<b class="na-n">' + nivel + '</b>' +
      '<span class="na-rango">' + String(rango || "") + '</span>' +
      (titulo ? '<span class="na-titulo">' + String(titulo) + '</span>' : "") +
      '</div>';
    document.body.appendChild(d);
    if (!quieto) setTimeout(function () {
      chispas(innerWidth / 2, innerHeight / 2, ["#37e0ec", "#f5b043", "#ffffff", "#aa66cc"]);
    }, 180);
    var fuera = function () { d.classList.add("se-va"); setTimeout(function () { d.remove(); }, 420); };
    d.onclick = fuera;
    setTimeout(fuera, quieto ? 2200 : 3400);
  }

  // ---------------------------------------------------------------- lo que llama la Nave
  /**
   * Celebra un reto registrado.
   *
   * `antes` y `ahora` son la ficha de antes y la de después. De la comparación sale todo: cuánto
   * has ganado, qué insignias son nuevas y si has cambiado de nivel. Así el que llama no tiene que
   * calcular nada ni acordarse de pasar seis cosas.
   */
  function reto(antes, ahora, origen) {
    try {
      antes = antes || {}; ahora = ahora || {};
      var dxp = (ahora.xp || 0) - (antes.xp || 0);
      var dcr = (ahora.creditos || 0) - (antes.creditos || 0);
      var p = punto(origen);

      if (dxp > 0) { salta(p.x, p.y - 10, "+" + dxp + " xp", "xp"); sonar("xp"); }
      if (dcr !== 0) setTimeout(function () {
        salta(p.x + 54, p.y + 14, (dcr > 0 ? "+" : "") + dcr + " ◈", dcr > 0 ? "cred" : "gasto");
        sonar(dcr > 0 ? "moneda" : "gasto");
      }, 260);
      chispas(p.x, p.y, ["#37e0ec", "#f5b043", "#ffffff"]);

      contadores(antes, ahora);

      var nuevas = (ahora.insignias || []).filter(function (k) {
        return (antes.insignias || []).indexOf(k) < 0;
      });
      if (nuevas.length) setTimeout(function () { insignias(nuevas); }, 620);

      if ((ahora.nivel || 0) > (antes.nivel || 0))
        setTimeout(function () { nivelNuevo(ahora.nivel, ahora.rango_nombre, ahora.nivel_titulo); },
                   nuevas.length ? 1500 : 760);
    } catch (e) { /* la fiesta nunca puede tumbar lo que ya está guardado */ }
  }

  /** Celebra un canje. Los créditos bajan, así que el sonido baja. */
  function canje(antes, ahora, origen, botin) {
    try {
      var p = punto(origen);
      var dcr = (ahora.creditos || 0) - (antes.creditos || 0);
      if (dcr < 0) { salta(p.x, p.y, dcr + " ◈", "gasto"); sonar("gasto"); }
      if (botin) setTimeout(function () {
        salta(p.x, p.y - 26, "¡" + botin + "!", "botin");
        chispas(p.x, p.y, ["#aa66cc", "#f5b043", "#ffffff"]);
        sonar("insignia");
      }, 420);
      contadores(antes, ahora);
    } catch (e) {}
  }

  function insignias(claves) {
    var nombres = window.SG_BADGE_NAMES || {};
    claves.slice(0, 3).forEach(function (k, i) {
      setTimeout(function () {
        var d = document.createElement("div");
        d.className = "insignia-gana";
        d.innerHTML = '<img src="assets/img/insignias/' + k + '.png" alt="" width="86" height="86">' +
          '<div><span class="ig-eyebrow">Insignia conseguida</span>' +
          '<b>' + (nombres[k] || k) + '</b></div>';
        document.body.appendChild(d);
        sonar("insignia");
        setTimeout(function () { d.classList.add("se-va"); setTimeout(function () { d.remove(); }, 420); }, 2600);
      }, i * 700);
    });
  }

  /** Rueda los dos contadores de la ficha, si están en pantalla. */
  function contadores(antes, ahora) {
    var xp = document.querySelector(".monedas .m.xp b");
    var cr = document.querySelector(".monedas .m.cred b");
    rodar(xp, antes.xp || 0, ahora.xp || 0, 1000);
    rodar(cr, antes.creditos || 0, ahora.creditos || 0, 800);
  }

  /**
   * Dónde ha pulsado. Acepta un elemento o unas coordenadas ya tomadas.
   *
   * 🔴 Lo segundo hace falta de verdad: entre el clic y la celebración la Nave se repinta entera,
   * así que el botón que se pulsó ya no está en el documento y su rectángulo mide cero. Quien llama
   * toma las coordenadas ANTES de repintar y las pasa aquí.
   */
  function punto(el) {
    if (el && typeof el.x === "number" && typeof el.y === "number") return el;
    if (el && el.getBoundingClientRect) {
      var r = el.getBoundingClientRect();
      if (r.width || r.height) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return { x: innerWidth / 2, y: innerHeight / 3 };
  }

  // ---------------------------------------------------------------- el interruptor del sonido
  function montarInterruptor() {
    if (document.getElementById("sg-son")) return;
    var b = document.createElement("button");
    b.id = "sg-son"; b.type = "button";
    var pinta = function () {
      b.textContent = suena() ? "🔊" : "🔇";
      b.title = suena() ? "Silenciar los sonidos" : "Activar los sonidos";
      b.setAttribute("aria-label", b.title);
      b.classList.toggle("mudo", !suena());
    };
    b.onclick = function () {
      localStorage.setItem(KEY_SON, suena() ? "no" : "si");
      pinta();
      if (suena()) sonar("xp");
    };
    pinta();
    document.body.appendChild(b);
  }

  window.SG = window.SG || {};
  window.SG.FIESTA = { reto: reto, canje: canje, nivelNuevo: nivelNuevo, insignias: insignias,
                       sonar: sonar, rodar: rodar, chispas: chispas, salta: salta,
                       montarInterruptor: montarInterruptor, quieto: quieto };
})();
