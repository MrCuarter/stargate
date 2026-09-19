/**
 * STARGATE · EL FRAGMENTO PROHIBIDO (el reto secreto S7) — 15-sep-2026
 *
 * «En la presentación del planeta Vínculo hay un enlace que no debería estar ahí. Encuéntralo,
 * resuelve el enigma que esconde y trae la PALABRA que Vaeon borró.» Ese enlace lleva aquí.
 *
 * Tres escenas, y el tema 7 (Vínculo · Gamificación) dentro del juego:
 *   1 · EL TELAR: cuatro hilos unen cada tipo de jugador de Bartle con lo que le mueve en la Nave.
 *       Bien tensados, escriben la pista del sello.
 *   2 · EL SELLO: la inscripción está cifrada; el disco se gira hacia atrás tantas veces como
 *       planetas hay hasta Vínculo (el séptimo). Se lee la palabra y se escribe.
 *   3 · LA REVELACIÓN: el nombre que borró, con su carta. Y NEBULA le pone nombre a lo que acaba de
 *       sentir quien ha llegado hasta aquí: la motivación del explorador.
 * Al final, a validar.html (?reto=S7), que registra el reto con la palabra que trae de aquí.
 *
 * 🔴 La palabra no está escrita en ningún sitio de la web: la inscripción (cifrada) y el paso los
 * pone el build a partir de PALABRA_HUEVO (Datos.gs), y aquí solo se compara su huella (secreto.js).
 * Hasta la carta de la revelación se pide con la palabra que ha escrito quien juega.
 */
(function () {
  "use strict";
  var app = document.getElementById("fr-app");
  if (!app) return;
  var F = window.SG_FRAGMENTO || {};
  var INSC = String(F.inscripcion || "").toUpperCase(), PASO = Number(F.paso) || 7;
  var AB = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  var EMBED = new URLSearchParams(location.search).get("embed") === "1";
  var LS = "sgFragmento";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // Los cuatro jugadores de Bartle (1996) y, en la Nave, lo que mueve a cada uno. Las filas no van
  // en el orden de los tipos: si no, bastaría con bajar en diagonal.
  var TIPOS = [
    { k: "triunfador", n: "Triunfador", ico: "<img class=ico src=assets/img/iconos/p/medalla.png alt>", d: "Completar, coleccionar, subir de nivel." },
    { k: "explorador", n: "Explorador", ico: "<img class=ico src=assets/img/iconos/p/brujula.png alt>", d: "Descubrir lo que nadie le ha contado." },
    { k: "socializador", n: "Socializador", ico: "<img class=ico src=assets/img/iconos/p/gente.png alt>", d: "Estar con los suyos: el grupo es el juego." },
    { k: "competidor", n: "Competidor", ico: "<img class=ico src=assets/img/iconos/p/diana.png alt>", d: "Medirse con los demás y ganar." }
  ];
  var HILOS = [
    { t: "El ranking de la semana y el duelo con quien tienes al lado", k: "competidor" },
    { t: "Completar el álbum de cromos, carta a carta", k: "triunfador" },
    { t: "Hacer piña con tu escuadrón", k: "socializador" },
    { t: "Un enlace escondido que nadie te ha contado", k: "explorador" }
  ];

  // ── lo que lleva hecho (en su navegador: recargar no le devuelve al principio)
  var st = { paso: 0, hilos: [null, null, null, null], intentosTelar: 0, giro: 0, intentosSello: 0, palabra: "" };
  try { var g = JSON.parse(localStorage.getItem(LS) || "null"); if (g && typeof g.paso === "number") st = Object.assign(st, g, { palabra: "" }); } catch (e) {}
  if (st.paso > 2) st.paso = 2;            // la revelación pide la palabra otra vez: no se guarda
  function guardar() { try { localStorage.setItem(LS, JSON.stringify({ paso: st.paso, hilos: st.hilos, intentosTelar: st.intentosTelar, giro: st.giro, intentosSello: st.intentosSello })); } catch (e) {} }

  var ultima = "";
  function escena(fondo, html, clase) {
    // (el fondo, en el propio elemento: una url() dentro de una variable CSS se resuelve desde la hoja
    // de estilos —assets/css/— y no cargaba)
    app.innerHTML = '<section class="fr-escena ' + (clase || "") + '" style="background-image:linear-gradient(180deg,rgba(8,12,20,.45),rgba(8,12,20,.9)),url(\'assets/img/fragmento/' + fondo + '.jpg\')">'
      + '<div class="fr-panel">' + html + '</div></section>'
      + '<p class="fr-pie">' + (st.paso ? '<button type="button" class="fr-reset" id="fr-reset">↺ Empezar el enigma de nuevo</button> · ' : '')
      + 'STARGATE · Proyecto Gamificado del Máster en Tecnología Educativa de la UNIR</p>';
    var r = document.getElementById("fr-reset");
    if (r) r.onclick = function () {
      if (!confirm("¿Empezar el enigma desde el principio?")) return;
      st = { paso: 0, hilos: [null, null, null, null], intentosTelar: 0, giro: 0, intentosSello: 0, palabra: "" }; guardar(); pintar();
    };
    // arriba y el foco en el título solo al CAMBIAR de escena (no en cada clic dentro de la misma)
    if (ultima !== clase) {
      window.scrollTo(0, 0);
      var h = app.querySelector("h1,h2"); if (h) { h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch (e) {} }
    }
    ultima = clase;
  }
  function nebula(txt) {
    return '<div class="fr-nebula"><img src="assets/img/personajes/nebula.png" alt=""><p><b>NEBULA</b>' + txt + '</p></div>';
  }

  // ── 0 · el enlace que no debía estar
  function portada() {
    escena("puerto",
      '<div class="kicker">Canal sin registrar</div><h1>El Fragmento Prohibido</h1>'
      + nebula('No deberías estar aquí. Este enlace no sale en ningún mapa de la Nave: alguien lo escondió en Vínculo '
        + 'para quien mira donde nadie mira. Detrás hay un archivo de Ashan que <b>Vaeon selló con su propia mano</b>. '
        + 'Si lo abres, sabrás algo que nadie más a bordo sabe.')
      + '<p class="fr-acciones"><button type="button" class="btn primary grande" id="fr-seguir">Entrar en el archivo →</button></p>',
      "portada");
    document.getElementById("fr-seguir").onclick = function () { st.paso = 1; guardar(); pintar(); };
  }

  // ── 1 · el telar de Vínculo
  function telar(resuelto) {
    var mostrarBien = st.intentosTelar >= 2;
    escena("telar",
      '<div class="kicker"><img class=ico src=assets/img/iconos/p/enlace.png alt> 1 de 2 · La sala de los vínculos</div><h2>El telar de Vínculo</h2>'
      + '<p class="fr-sub">El archivo está atado a un telar. Cada hilo une un <b>tipo de jugador</b> con lo que le hace volver a la Nave. '
      + 'Vaeon los cruzó todos. Pon cada uno en su sitio y el telar abrirá el paso.</p>'
      + '<div class="fr-tipos">' + TIPOS.map(function (t) {
          return '<div class="fr-tipo"><span class="fr-ico">' + t.ico + '</span><b>' + t.n + '</b><em>' + t.d + '</em></div>'; }).join("") + '</div>'
      + '<ol class="fr-hilos">' + HILOS.map(function (h, i) {
          var bien = mostrarBien && st.hilos[i] === h.k;
          return '<li class="fr-hilo' + (resuelto || bien ? " bien" : "") + '"><span class="fr-hilo-t">' + esc(h.t) + '</span>'
            + '<span class="fr-opciones" role="group" aria-label="¿Qué jugador?">' + TIPOS.map(function (t) {
                var on = st.hilos[i] === t.k;
                return '<button type="button" class="fr-op' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-h="' + i + '" data-t="' + t.k + '"'
                  + (resuelto ? " disabled" : "") + '>' + t.ico + ' ' + t.n + '</button>'; }).join("") + '</span></li>';
        }).join("") + '</ol>'
      + (resuelto
        ? '<div class="fr-revela"><p>El telar se tensa y un hilo de luz escribe en el aire:</p>'
          + '<blockquote>«El sello gira hacia atrás tantas veces como planetas has pisado para llegar hasta aquí.»</blockquote></div>'
          + '<p class="fr-acciones"><button type="button" class="btn primary grande" id="fr-seguir">Ir al sello →</button></p>'
        : '<p class="fr-acciones"><button type="button" class="btn primary grande" id="fr-tensar">Tensar los hilos</button></p>'
          + '<p class="fr-msg" id="fr-msg" aria-live="polite"></p>'),
      "telar");
    if (resuelto) { document.getElementById("fr-seguir").onclick = function () { st.paso = 2; guardar(); pintar(); }; return; }
    Array.prototype.forEach.call(app.querySelectorAll(".fr-op"), function (b) {
      b.onclick = function () {      // se marca sin repintar: el foco se queda donde estaba
        var i = Number(b.getAttribute("data-h")); st.hilos[i] = b.getAttribute("data-t"); guardar();
        Array.prototype.forEach.call(app.querySelectorAll('.fr-op[data-h="' + i + '"]'), function (x) {
          var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); });
      };
    });
    document.getElementById("fr-tensar").onclick = function () {
      var falta = st.hilos.filter(function (x) { return !x; }).length;
      var msg = document.getElementById("fr-msg");
      if (falta) { msg.textContent = "Aún " + (falta === 1 ? "queda un hilo suelto" : "quedan " + falta + " hilos sueltos") + ": elige un jugador en cada fila."; return; }
      var mal = HILOS.filter(function (h, i) { return st.hilos[i] !== h.k; }).length;
      if (!mal) return telar(true);
      st.intentosTelar++; guardar();
      telar(false);
      try { document.getElementById("fr-tensar").focus(); } catch (e) {}
      document.getElementById("fr-msg").innerHTML = "El telar se destensa: " + (mal === 1 ? "hay un hilo cruzado" : "hay " + mal + " hilos cruzados") + "."
        + (st.intentosTelar >= 2 ? " Los que están bien ya brillan." : "")
        + (st.intentosTelar >= 3 ? " Pista de NEBULA: el que busca lo que nadie le ha contado… es quien ha llegado hasta aquí." : "");
    };
  }

  // ── 2 · el sello de Vaeon (el disco cifrador)
  function leer(giro) {            // lo que dice la inscripción con el disco girado `giro` posiciones
    return INSC.split("").map(function (c) { var i = AB.indexOf(c); return i < 0 ? c : AB[(i - giro + 260) % 26]; }).join("");
  }
  function disco(giro) {
    var R1 = 132, R2 = 92, C = 160, paso = 360 / 26, marca = {};
    INSC.split("").forEach(function (c) { marca[c] = true; });
    var fuera = AB.map(function (l, i) {
      return '<text class="fr-l ext' + (marca[l] ? " clave" : "") + '" transform="rotate(' + (i * paso) + ' ' + C + ' ' + C + ')" x="' + C + '" y="' + (C - R1 + 6) + '">' + l + '</text>'; }).join("");
    var dentro = AB.map(function (l, i) {
      return '<text class="fr-l int" transform="rotate(' + (i * paso) + ' ' + C + ' ' + C + ')" x="' + C + '" y="' + (C - R2 + 6) + '">' + l + '</text>'; }).join("");
    return '<svg class="fr-disco" viewBox="0 0 320 320" role="img" aria-label="Disco cifrador: el anillo de fuera es lo que está escrito; el de dentro, lo que significa. Girado ' + giro + ' posiciones.">'
      + '<circle cx="160" cy="160" r="152" class="fr-aro1"/><circle cx="160" cy="160" r="112" class="fr-aro2"/><circle cx="160" cy="160" r="72" class="fr-aro3"/>'
      + '<g>' + fuera + '</g>'
      + '<g class="fr-int" style="transform:rotate(' + (giro * paso) + 'deg)">' + dentro + '</g>'
      + '<text class="fr-centro" x="160" y="156">GIROS</text><text class="fr-centro n" x="160" y="186">' + giro + '</text></svg>';
  }
  function sello(aviso, foco) {
    var g0 = ((st.giro % 26) + 26) % 26, lee = leer(g0);
    escena("sello",
      '<div class="kicker"><img class=ico src=assets/img/iconos/p/candado.png alt> 2 de 2 · El sello de Vaeon</div><h2>La inscripción sellada</h2>'
      + '<p class="fr-sub">Vaeon escribió el nombre al revés del mundo. Gira el disco: el anillo de <b>fuera</b> es lo que está escrito; '
      + 'el de <b>dentro</b>, lo que significa.</p>'
      + '<div class="fr-insc" aria-label="Inscripción">' + INSC.split("").map(function (c) { return '<span>' + esc(c) + '</span>'; }).join("") + '</div>'
      + '<div class="fr-sello-cuerpo"><div class="fr-disco-caja">' + disco(g0)
      + '<p class="fr-giros"><button type="button" class="btn grande" id="fr-atras" aria-label="Girar una hacia atrás">↶ Una atrás</button>'
      + '<button type="button" class="btn grande" id="fr-alante" aria-label="Girar una hacia delante">Una adelante ↷</button></p></div>'
      + '<div class="fr-sello-der"><p class="fr-lee-t">Con el disco así, el sello dice:</p>'
      + '<div class="fr-lee" aria-live="polite">' + lee.split("").map(function (c) { return '<span>' + esc(c) + '</span>'; }).join("") + '</div>'
      + '<label class="fr-campo">La palabra que borró Vaeon<input id="fr-palabra" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>'
      + '<p class="fr-acciones"><button type="button" class="btn primary grande" id="fr-romper">Romper el sello</button></p>'
      + (aviso ? '<div class="fr-vaeon"><img src="assets/img/fragmento/vaeon_mofa.png" alt="Vaeon se ríe"><p>' + aviso + '</p></div>' : '')
      + (st.intentosSello >= 3 ? nebula('Cuenta los planetas del viaje: Forge, Ecos, Sendara, Reliae, Umbral, Ludo… y Vínculo.') : '')
      + '</div></div>',
      "sello");
    if (foco) try { document.getElementById(foco).focus(); } catch (e) {}
    var girar = function (d, id) { st.giro = (((st.giro + d) % 26) + 26) % 26; guardar(); sello(null, id); };
    document.getElementById("fr-atras").onclick = function () { girar(1, "fr-atras"); };
    document.getElementById("fr-alante").onclick = function () { girar(-1, "fr-alante"); };
    var inp = document.getElementById("fr-palabra"), b = document.getElementById("fr-romper");
    inp.onkeydown = function (e) { if (e.key === "Enter") b.click(); };
    b.onclick = function () {
      var v = inp.value.trim();
      if (!v) { inp.focus(); return; }
      b.disabled = true; b.textContent = "Comprobando…";
      window.SG_SECRETO.cual("S7", v).then(function (p) {
        if (p) { st.palabra = p; st.paso = 3; guardar(); return pintar(); }
        st.intentosSello++; guardar();
        sello("«¿" + esc(v) + "? Nadie recuerda ya ese nombre. Ni siquiera tú.»", "fr-palabra");
      });
    };
  }

  // ── 3 · el nombre que borró
  function revelacion() {
    var P = String(st.palabra || "").toUpperCase(), p = P.toLowerCase();
    escena("puente",
      '<div class="fr-rev"><div class="fr-carta"><img id="fr-carta" src="assets/img/tarjetas/S1_' + esc(p) + '_carta.png" alt="La carta del nombre que borró"></div>'
      + '<div class="fr-rev-txt"><div class="kicker"><img class=ico src=assets/img/iconos/p/abierto.png alt> El sello se rompe</div><h2 class="fr-nombre">' + esc(P) + '</h2>'
      + '<p class="fr-sub">Así se llamaba antes de ser Vaeon. <b>' + esc(P.charAt(0) + p.slice(1)) + '</b>, el Archivista Mayor de Ashan, '
      + 'custodio de la memoria de un mundo. Cuando la Estática se llevó a los suyos, releerlos no lo consoló: lo rompió. '
      + 'Y el primer archivo que selló bajo llave fue su propio nombre. Ahora lo sabes tú.</p>'
      + nebula('¿Te has fijado? Este reto no lo pedía nadie y no hacía falta para acabar el planeta. Lo has buscado porque había un secreto. '
        + 'En gamificación, eso es la <b>motivación del explorador</b>: pocos diseños la cuidan y es de las que más enganchan. Guárdala para el tuyo.')
      + '<p class="fr-premio"><img class=ico src=assets/img/iconos/p/medalla.png alt> Registra el reto: <b>+' + (Number(F.xp) || 150) + ' xp</b> y la insignia legendaria <b>' + esc(F.insignia || "") + '</b>.</p>'
      + '<p class="fr-acciones"><button type="button" class="btn primary grande" id="fr-registrar">Registrar el reto secreto</button></p>'
      + '<p class="fr-nota">No se lo cuentes a nadie: los secretos se encuentran jugando.</p></div></div>',
      "revelacion");
    var img = document.getElementById("fr-carta");
    img.onerror = function () { img.onerror = null; img.src = "assets/img/insignias/" + (F.insigniaClave || "E3_vaeon") + ".png"; };
    document.getElementById("fr-registrar").onclick = function () {
      window.SG_SECRETO.guardar("S7", P);
      location.href = "validar.html?reto=S7" + (EMBED ? "&embed=1" : "");
    };
  }

  function pintar() {
    if (!INSC || !window.SG_SECRETO) { app.innerHTML = '<p class="fr-sub">Este archivo está dañado. Vuelve a intentarlo más tarde.</p>'; return; }
    if (st.paso === 3 && st.palabra) return revelacion();
    if (st.paso >= 2) return sello();
    if (st.paso === 1) return telar(false);
    portada();
  }
  if (window.SG_SECRETO) pintar(); else document.addEventListener("DOMContentLoaded", pintar);
})();
