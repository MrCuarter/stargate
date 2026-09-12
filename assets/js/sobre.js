/**
 * STARGATE — ABRIR UN SOBRE, CARTA A CARTA.
 *
 * Norberto: «busca una forma visual y atractiva de presentar los 3 cromos ganados, uno detrás de
 * otro. Al hacer clic pasa al siguiente hasta que se ven todos».
 *
 * Tiene razón en lo que no dice: abrir un sobre es EL momento del juego de cartas, y hasta hoy se
 * resolvía con una línea de texto («Te ha tocado: Bran · Sylla · NEBULA»). Lo que engancha de un
 * sobre no es tener las cartas: es no saber cuál viene y darle la vuelta. Así que cada carta sale
 * boca abajo y se descubre con un toque; la rareza se nota ANTES de leer el nombre —por el brillo—,
 * y una legendaria se celebra como tal.
 *
 * Una sola pieza para los tres sitios donde se ganan cartas —el Mercado, el regalo de la llamada y
 * los escondites—, para que el momento se viva igual en los tres.
 *
 *   SG.SOBRE.revelar(cartas, { titulo, alAlbum }) → Promise (se resuelve al cerrar)
 *   cartas: [{ clave, nombre, rareza, tipo: "cromo"|"heroe", repetida }]  o ids «grupo__cromo_X»
 */
(function () {
  window.SG = window.SG || {};

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var RAREZA = { "común": "comun", "comun": "comun", "rara": "rara", "épica": "epica", "epica": "epica",
                 "legendaria": "legendaria", "LEGENDARIA": "legendaria" };

  /** De «grupo__cromo_P1_bran» (lo que devuelve el servidor) a la ficha que pinta esta pantalla. */
  function normaliza(c) {
    if (c && typeof c === "object" && c.clave) return c;
    var id = typeof c === "string" ? c : String((c && (c.rewardId || c.id)) || "");
    var k = id.split("__").pop();
    var tipo = k.indexOf("heroe_") === 0 ? "heroe" : "cromo";
    var clave = k.replace(/^(cromo|heroe)_/, "");
    var fila = (tipo === "heroe" ? window.SG_HEROES : window.SG_CROMOS) || [];
    var f = fila.filter(function (x) { return x[0] === clave; })[0];
    // SG_CROMOS: [clave, nombre, serie, rareza, peso] · SG_HEROES: [clave, nombre, existencias, rareza]
    return { clave: clave, tipo: tipo, nombre: f ? f[1] : clave, rareza: f ? (tipo === "heroe" ? f[3] : f[3]) : "común" };
  }

  function arte(c) {
    if (c.tipo === "heroe") return "assets/img/heroes/" + c.clave + ".jpg";
    return "assets/img/tarjetas/" + c.clave + "_carta.png" + (window.SG_CARDV || "");
  }

  var capa = null;
  function cerrar(resolver) {
    if (!capa) return;
    capa.classList.add("sb-fuera");
    var c = capa; capa = null;
    document.removeEventListener("keydown", teclas, true);
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); resolver(); }, 220);
  }
  var teclas = null;

  function revelar(lista, opts) {
    opts = opts || {};
    var cartas = (lista || []).map(normaliza).filter(function (c) { return c && c.clave; });
    if (!cartas.length) return Promise.resolve();
    if (capa) { try { capa.parentNode.removeChild(capa); } catch (e) {} capa = null; }
    var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return new Promise(function (resolver) {
      var i = 0, girada = false;
      capa = document.createElement("div");
      capa.className = "sb-capa";
      capa.setAttribute("role", "dialog"); capa.setAttribute("aria-modal", "true");
      capa.setAttribute("aria-label", opts.titulo || "Tu sobre");
      document.body.appendChild(capa);

      function pintarCarta() {
        var c = cartas[i], r = RAREZA[c.rareza] || "comun";
        capa.className = "sb-capa r-" + r;
        girada = false;
        capa.innerHTML =
          '<div class="sb-cab"><div class="sb-titulo">' + esc(opts.titulo || "Tu sobre") + '</div>' +
            '<div class="sb-puntos">' + cartas.map(function (_, j) {
              return '<i class="' + (j < i ? "vista" : j === i ? "ahora" : "") + '"></i>'; }).join("") + '</div></div>' +
          '<div class="sb-escena"><div class="sb-halo" aria-hidden="true"></div>' +
            '<button class="sb-carta' + (c.tipo === "heroe" ? " heroe" : "") + '" type="button" aria-label="Darle la vuelta a la carta ' + (i + 1) + ' de ' + cartas.length + '">' +
              '<span class="sb-cara sb-dorso" aria-hidden="true"><span class="sb-sello">◈</span><span class="sb-marca">STARGATE</span></span>' +
              '<span class="sb-cara sb-frente"><img src="' + esc(arte(c)) + '" alt="' + esc(c.nombre) + '"></span>' +
            '</button></div>' +
          '<div class="sb-info" aria-live="polite"><p class="sb-pista">Toca la carta para darle la vuelta</p></div>' +
          '<div class="sb-pie"><button class="btn primary grande sb-sig" type="button">Darle la vuelta</button>' +
            (cartas.length > 1 ? '<button class="sb-saltar" type="button">Verlas todas</button>' : '') + '</div>';
        capa.querySelector(".sb-carta").onclick = accion;
        capa.querySelector(".sb-sig").onclick = accion;
        var s = capa.querySelector(".sb-saltar"); if (s) s.onclick = resumen;
        capa.querySelector(".sb-sig").focus();
      }

      function girar() {
        var c = cartas[i], r = RAREZA[c.rareza] || "comun";
        girada = true;
        capa.querySelector(".sb-carta").classList.add("girada");
        capa.querySelector(".sb-info").innerHTML =
          '<h3 class="sb-nombre">' + esc(c.nombre) + '</h3>' +
          '<span class="sb-rareza">' + esc(r === "legendaria" ? "LEGENDARIA" : c.rareza || "común") + '</span>' +
          (c.repetida ? '<p class="sb-extra">🔁 Repetida: con tres repetidas, un sobre nuevo gratis.</p>'
                      : '<p class="sb-extra nueva">✨ Nueva en tu álbum</p>');
        capa.querySelector(".sb-sig").textContent = i < cartas.length - 1 ? "Siguiente carta →" : "Ver las " + cartas.length;
        if (cartas.length === 1) capa.querySelector(".sb-sig").textContent = "Guardarla";
        // una legendaria se celebra como tal: chispas doradas y el sonido de subir de nivel
        if (r === "legendaria" || r === "epica") {
          try {
            var b = capa.querySelector(".sb-carta").getBoundingClientRect();
            if (window.SG.FIESTA && SG.FIESTA.chispas) SG.FIESTA.chispas(b.left + b.width / 2, b.top + b.height / 3,
              r === "legendaria" ? ["#ffd166", "#f5b043", "#fff3c4", "#ffffff"] : ["#c79be6", "#8e6bff", "#ffffff"]);
            if (r === "legendaria" && window.SG.FIESTA && SG.FIESTA.sonar) SG.FIESTA.sonar("nivel");
          } catch (e) {}
        }
      }

      function accion() {
        if (!girada) return girar();
        if (i < cartas.length - 1) {
          var carta = capa.querySelector(".sb-carta");
          if (quieto) { i++; return pintarCarta(); }
          carta.classList.add("sale");
          setTimeout(function () { i++; pintarCarta(); }, 260);
          return;
        }
        if (cartas.length === 1) return cerrar(resolver);
        resumen();
      }

      function resumen() {
        capa.className = "sb-capa sb-resumen";
        capa.innerHTML =
          '<div class="sb-cab"><div class="sb-titulo">' + esc(opts.titulo || "Tu sobre") + '</div></div>' +
          '<div class="sb-abanico">' + cartas.map(function (c, j) {
            var r = RAREZA[c.rareza] || "comun";
            return '<figure class="sb-mini r-' + r + '" style="--j:' + j + ';--n:' + cartas.length + '">' +
              '<img src="' + esc(arte(c)) + '" alt=""><figcaption>' + esc(c.nombre) + '</figcaption></figure>'; }).join("") + '</div>' +
          '<p class="sb-guardadas">Guardadas en tu álbum.</p>' +
          '<div class="sb-pie">' +
            (opts.alAlbum ? '<button class="btn grande sb-album" type="button">Ver mi álbum</button>' : '') +
            '<button class="btn primary grande sb-fin" type="button">Seguir</button></div>';
        capa.querySelector(".sb-fin").onclick = function () { cerrar(resolver); };
        var a = capa.querySelector(".sb-album");
        if (a) a.onclick = function () { cerrar(function () { resolver(); try { opts.alAlbum(); } catch (e) {} }); };
        capa.querySelector(".sb-fin").focus();
      }

      teclas = function (e) {
        if (!capa) return;
        if (e.key === "Escape") { e.preventDefault(); if (capa.classList.contains("sb-resumen")) cerrar(resolver); else resumen(); }
      };
      document.addEventListener("keydown", teclas, true);
      pintarCarta();
    });
  }

  window.SG.SOBRE = { revelar: revelar, normaliza: normaliza };
})();
