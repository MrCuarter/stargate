/*
 * 🔴 19-sep · EL MEDIDOR DE AIRE. Norberto: «no hago más que repetir que debemos reducir el aire». La regla (memoria
 * «feedback-regla-del-aire»): la altura de una caja la marca su texto; ninguna imagen más alta que lo que acompaña; los
 * botones pegados a lo suyo, nunca empujados al fondo.
 *
 * Se evalúa en la página (fotografo.cjs y el laboratorio) y devuelve los huecos VACÍOS de más de 40 px dentro de una
 * caja (lo que tiene borde o fondo propio: tarjetas, fichas, filas). Mira la columna de lo que hay dentro: junta lo que
 * se solapa en vertical (lo que va lado a lado cuenta como un solo tramo) y mide lo que queda en blanco entre tramos,
 * arriba y abajo. Así sale el caso de siempre: una insignia grande a un lado y, al otro, el texto arriba y los botones
 * empujados al fondo.
 */
(function () {
  var UMBRAL = 40, out = [];
  function visible(e) {
    var s = getComputedStyle(e);
    if (s.display === "none" || s.visibility === "hidden" || s.position === "fixed" || s.position === "absolute") return null;
    var r = e.getBoundingClientRect();
    return r.width > 2 && r.height > 2 ? r : null;
  }
  function esCaja(e, s) {
    if (/^(HTML|BODY|MAIN|SECTION|HEADER|FOOTER|NAV|DIALOG)$/.test(e.tagName)) return false;
    var fondo = s.backgroundColor !== "rgba(0, 0, 0, 0)" && s.backgroundColor !== "transparent" || s.backgroundImage !== "none";
    return fondo || (s.borderTopStyle !== "none" && parseFloat(s.borderTopWidth) > 0 && s.borderBottomStyle !== "none");
  }
  function nombre(e) {
    var c = typeof e.className === "string" ? e.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
    var n = e.tagName.toLowerCase() + (c ? "." + c : "") + (e.id ? "#" + e.id : "");
    // (un <div> sin clase no dice nada: se le pone dónde está)
    if (!c && !e.id && e.parentElement) { var p = e.parentElement, pc = typeof p.className === "string" ? p.className.trim().split(/\s+/)[0] : ""; n += " (en " + p.tagName.toLowerCase() + (pc ? "." + pc : "") + ")"; }
    return n;
  }
  function dentroDeCaja(e) {
    for (var p = e; p && p !== document.body; p = p.parentElement) if (esCaja(p, getComputedStyle(p))) return true;
    return false;
  }
  // cada elemento, con SUS hijos: así una columna estirada por una imagen de al lado enseña su hueco (juntar la ficha
  // entera lo tapaba: la insignia cubría toda la altura)
  [].slice.call(document.querySelectorAll("body *")).forEach(function (e) {
    if (/^(IMG|SVG|VIDEO|IFRAME|CANVAS|PICTURE|TEXTAREA|INPUT|SELECT|BUTTON|SUMMARY|P|UL|OL|LI|SPAN|B|EM|A|LABEL|FIGURE)$/.test(e.tagName)) return;
    var r = visible(e); if (!r || r.height < 90 || r.width < 100) return;
    if (e.closest("[aria-hidden='true'],.tour,.tour-invite,.sgp-capa,.cfg-capa,.nb-menu") || !dentroDeCaja(e)) return;   // (las ventanas flotantes, no)
    var s = getComputedStyle(e);
    if (s.overflowY === "auto" || s.overflowY === "scroll") return;
    var t = [];
    [].slice.call(e.children).forEach(function (h) {
      if (/^(SCRIPT|STYLE|TEMPLATE)$/.test(h.tagName)) return;
      var q = visible(h); if (q) t.push([q.top, q.bottom, nombre(h)]);
    });
    if (!t.length) return;
    var arriba = r.top + parseFloat(s.borderTopWidth) + parseFloat(s.paddingTop);
    var abajo = r.bottom - parseFloat(s.borderBottomWidth) - parseFloat(s.paddingBottom);
    t.sort(function (a, b) { return a[0] - b[0]; });
    var peor = 0, donde = "", hasta = arriba, antes = "arriba";
    t.forEach(function (x) {
      var g = x[0] - hasta;
      if (g > peor) { peor = g; donde = antes === "arriba" ? "arriba de " + x[2] : "entre " + antes + " y " + x[2]; }
      if (x[1] > hasta) { hasta = x[1]; antes = x[2]; }
    });
    if (abajo - hasta > peor) { peor = abajo - hasta; donde = "abajo, tras " + antes; }
    if (peor > UMBRAL) out.push(nombre(e) + " · " + Math.round(peor) + " px " + donde);
  });
  // (una caja con hueco suele estar dentro de otra que también lo hereda: se deja la más pequeña de cada rama)
  var vistos = {};
  return out.filter(function (x) { var k = x.split(" · ")[1]; if (vistos[k]) return false; vistos[k] = 1; return true; }).slice(0, 12);
})()
