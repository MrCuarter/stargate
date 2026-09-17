/**
 * 17-sep · LA PÁGINA DE UN EJEMPLO · ejemplo.html?reto=A5
 *
 * Norberto: «si metemos el ejemplo dentro de la ficha del reto, se verá fatal… me gustaría que cada ejemplo tuviera su
 * página dedicada y abriera una pestaña en el navegador. Para estos ejemplos usa un estilo más académico… Incorpora un
 * botón para cerrar la pestaña».
 *
 * Todo sale de window.SG_EJ, que escribe _build_site.py desde _site_data.py (EJEMPLOS_RETOS): el caso, la captura, lo que
 * se lee mejor escrito que en una foto (tablas, la autoevaluación que se contesta, la línea de tiempo de un vídeo), sus
 * claves y el ejemplo publicado. Sin reto (o con uno que no tiene ejemplo): el índice de todos.
 * Sin sesión y sin motor: es una página para leer, y se abre igual desde la Nave que desde un enlace suelto.
 */
(function () {
  "use strict";
  var D = window.SG_EJ || { ejemplos: {}, retos: {}, consignas: {}, planetas: [] };
  var app = document.getElementById("ej-app");
  var id = (new URLSearchParams(location.search).get("reto") || "").toUpperCase();
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ── cerrar la pestaña (los navegadores solo dejan si la abrió un enlace o un script; si no, se dice cómo)
  var cerrar = document.getElementById("ej-cerrar"), nota = document.getElementById("ej-cerrar-nota");
  if (cerrar) cerrar.onclick = function () {
    window.close();
    setTimeout(function () { if (nota) nota.hidden = false; }, 300);
  };

  function tema(r) {
    var n = r && Number(r[4]), p = D.planetas[n - 1];
    return p ? "Tema " + n + " · " + p[1] + " (" + p[2].replace(/^T\d+\s*·\s*/, "") + ")" : "";
  }

  function indice() {
    document.title = "STARGATE · Ejemplos de los retos";
    var ids = Object.keys(D.ejemplos).sort(function (a, b) {
      var ra = D.retos[a] || [], rb = D.retos[b] || [];
      return (Number(ra[4]) || 99) - (Number(rb[4]) || 99) || a.localeCompare(b);
    });
    app.innerHTML = '<p class="ej-eyebrow">Máster en Tecnología Educativa · STARGATE</p><h1>Ejemplos de los retos</h1>' +
      '<p class="ej-reto">Un caso resuelto por cada reto: qué hizo una docente o un docente, con qué herramienta y dónde lo dejó.</p>' +
      (id ? '<p class="ej-nota">No hay ningún ejemplo para «' + esc(id) + '». Estos son todos:</p>' : "") +
      '<ul class="ej-indice">' + ids.map(function (k) {
        var r = D.retos[k] || [];
        return '<li><a href="ejemplo.html?reto=' + esc(k) + '"><b>' + esc(k) + '</b> · ' + esc(D.ejemplos[k].titulo) + '</a>' +
          '<small>' + esc(r[1] || "") + (tema(r) ? " · " + esc(tema(r)) : "") + '</small></li>';
      }).join("") + "</ul>";
  }

  // ── lo que se lee mejor escrito: tabla, autoevaluación y línea de tiempo (numeradas como en un artículo)
  var nFig = 0, nTab = 0;
  function tabla(b) {
    var huecos = (b.filas || []).some(function (f) { return f.some(function (c) { return c === ""; }); });
    nTab++;
    return '<figure class="ej-tabla' + (huecos ? " ej-matriz" : "") + ((b.cab || []).length >= 4 ? " ej-ancha" : "") + '">' +
      '<figcaption><b>Tabla ' + nTab + '.</b> ' + esc(b.titulo || "") + '</figcaption>' +
      '<div class="ej-scroll"><table><thead><tr>' + (b.cab || []).map(function (c) { return '<th scope="col">' + esc(c) + "</th>"; }).join("") +
      '</tr></thead><tbody>' + (b.filas || []).map(function (f) {
        return "<tr>" + f.map(function (c, j) {
          return j === 0 ? '<th scope="row">' + esc(c) + "</th>" : "<td" + (huecos && c ? ' class="lleno"' : "") + ">" + esc(c) + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>" + (b.nota ? '<p class="ej-nota">' + esc(b.nota) + "</p>" : "") + "</figure>";
  }
  function opciones(p) {
    return '<div class="ej-ops">' + (p.opciones || []).map(function (o, n) {
      return '<button type="button" class="ej-op" data-op="' + n + '" data-bien="' + p.bien + '">' + esc(o) + "</button>";
    }).join("") + "</div>";
  }
  function quiz(b) {
    return '<section class="ej-quiz" aria-label="Autoevaluación"><p class="ej-quiz-t">' + esc(b.titulo || "Pruébalo") + "</p>" +
      (b.preguntas || []).map(function (p) {
        return '<div class="ej-q" data-q><p class="ej-qq">' + esc(p.q) + "</p>" +
          (p.abierta ? '<button type="button" class="ej-op" data-ver>Ver la respuesta modelo</button>' : opciones(p)) +
          '<p class="ej-exp" data-exp="' + esc(p.explica || "") + '" hidden></p></div>';
      }).join("") + (b.nota ? '<p class="ej-nota">' + esc(b.nota) + "</p>" : "") + "</section>";
  }
  function linea(b) {
    var seg = function (t) { var x = String(t || "0:00").split(":"); return (+x[0] || 0) * 60 + (+x[1] || 0); }, total = seg(b.dura) || 1;
    nFig++;
    return '<figure class="ej-linea"><figcaption style="margin:0"><b>Figura ' + nFig + '.</b> ' + esc(b.titulo || "") + "</figcaption>" +
      '<div class="ej-eje"><span class="ini">0:00</span><span class="fin">' + esc(b.dura) + "</span>" +
      (b.marcas || []).map(function (m, k) {
        return '<button type="button" class="ej-marca' + (k ? "" : " on") + '" style="left:' + (seg(m.t) / total * 100).toFixed(1) + '%" data-marca="' + k + '" aria-label="La pregunta del minuto ' + esc(m.t) + '">' + esc(m.t) + "</button>";
      }).join("") + "</div>" +
      (b.marcas || []).map(function (m, k) {
        return '<div class="ej-q" data-q data-panel="' + k + '"' + (k ? " hidden" : "") + '><p class="ej-qq"><b>' + esc(m.t) + " · " + esc(m.paso) + "</b>. " + esc(m.q) + "</p>" +
          opciones(m) + '<p class="ej-exp" data-exp="' + esc(m.explica || "") + '" hidden></p></div>';
      }).join("") + "</figure>";
  }

  /**
   * 17-sep · LOS EJEMPLOS QUE DIO NORBERTO («usa esos cuando sea posible»): su enlace, incrustado arriba del todo. YouTube,
   * Genially y Edpuzzle se dejan meter en un iframe; si no se reconoce la dirección, se enlaza.
   */
  function incrustar(u) {
    var m;
    if ((m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/))) return "https://www.youtube-nocookie.com/embed/" + m[1] + "?rel=0";
    if ((m = u.match(/view\.genially\.com\/([0-9a-f]{24})/i))) return "https://view.genially.com/" + m[1];
    if ((m = u.match(/edpuzzle\.com\/media\/([0-9a-f]{24})/i))) return "https://edpuzzle.com/embed/media/" + m[1];
    return "";
  }
  function real(e, enlace) {
    var r = e.real, src = incrustar(enlace);
    nFig++;
    return "<h2>El ejemplo</h2>" + (r.por_que ? '<p class="ej-reto">' + esc(r.por_que) + "</p>" : "") +
      '<figure class="ej-real">' + (src ? '<div class="ej-marco"><iframe src="' + esc(src) + '" title="' + esc(r.titulo) + '" loading="lazy" allowfullscreen ' +
        'allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' : "") +
      "<figcaption><b>Figura " + nFig + ".</b> «" + esc(r.titulo) + "»" + (r.autor ? ", de " + esc(r.autor) : "") + (r.donde ? " (" + esc(r.donde) + ")" : "") +
      ' · <a href="' + esc(enlace) + '" target="_blank" rel="noopener">Abrirlo en ' + esc(r.donde || "su web") + " ↗</a></figcaption></figure>";
  }

  function ejemplo(e) {
    var r = D.retos[id] || [], enlace = e.enlace ? (/^https?:\/\//i.test(e.enlace) ? e.enlace : "https://" + e.enlace) : "";
    document.title = "STARGATE · Ejemplo del reto " + id;
    var html = '<p class="ej-eyebrow">Ejemplo del reto ' + esc(id) + (tema(r) ? " · " + esc(tema(r)) : "") + "</p>" +
      "<h1>" + esc(e.titulo) + "</h1>" +
      (r[1] ? '<p class="ej-reto">Reto: ' + esc(r[1]) + "</p>" : "");
    if (D.consignas[id]) html += "<h2>Lo que pide el reto</h2><div class=\"ej-consigna\"><p>" + esc(D.consignas[id]) + "</p></div>";
    var respuesta = (D.reflexion || []).indexOf(id) >= 0, conReal = !!(e.real && enlace);
    if (conReal) html += real(e, enlace);
    html += "<h2>" + (respuesta ? (conReal ? "Y una respuesta modelo para la caja del reto" : "Lo que escribió en la caja del reto")
                                : (conReal ? "Otro caso, paso a paso" : "El caso")) + "</h2>" + (e.texto ? '<p class="ej-caso">' + esc(e.texto) + "</p>" : "");
    if (e.imagen) {
      nFig++;
      html += '<figure><a href="assets/img/ejemplos/' + esc(e.imagen) + '" target="_blank" rel="noopener" title="Ver la imagen a tamaño completo">' +
        '<img src="assets/img/ejemplos/' + esc(e.imagen) + '" alt="' + esc(e.imagen_alt || "") + '" width="1200" height="800"></a>' +
        "<figcaption><b>Figura " + nFig + ".</b> " + esc(e.imagen_alt || "") + "</figcaption></figure>";
    }
    (e.vivo || []).forEach(function (b) { html += b.tipo === "tabla" ? tabla(b) : b.tipo === "quiz" ? quiz(b) : b.tipo === "linea" ? linea(b) : ""; });
    if (e.detalle && e.detalle.length) html += '<h2>Claves del ejemplo</h2><ul class="ej-claves">' + e.detalle.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    if (e.pua) html += '<h2>En los grupos PUA</h2><p class="ej-pua">' + esc(e.pua) + "</p>";
    if (enlace && !conReal) html += '<h2>Un ejemplo publicado</h2><p><a href="' + esc(enlace) + '" target="_blank" rel="noopener">' + esc(enlace.replace(/^https?:\/\//, "")) + " ↗</a></p>";
    html += '<p class="ej-aviso">' + (conReal ? "El ejemplo de arriba es real y público. " : "") + (conReal ? "El otro caso" : "Caso") + ' elaborado con fines didácticos: las personas y los centros son inventados; las herramientas y los pasos, reales.' +
      (e.imagen ? " Las capturas son recreaciones generadas con inteligencia artificial." : "") +
      ' · <a href="ejemplo.html">Ver todos los ejemplos</a></p>';
    app.innerHTML = html;
  }

  // ── contestar, ver la respuesta modelo y saltar de marca (un solo oyente)
  document.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest && ev.target.closest("[data-op],[data-ver],[data-marca]");
    if (!b) return;
    if (b.hasAttribute("data-marca")) {
      var fig = b.closest(".ej-linea"), k = b.getAttribute("data-marca");
      Array.prototype.forEach.call(fig.querySelectorAll(".ej-marca"), function (x) { x.classList.toggle("on", x === b); });
      Array.prototype.forEach.call(fig.querySelectorAll("[data-panel]"), function (x) { x.hidden = x.getAttribute("data-panel") !== k; });
      return;
    }
    var q = b.closest("[data-q]"), exp = q && q.querySelector(".ej-exp");
    if (!exp) return;
    if (b.hasAttribute("data-ver")) { exp.textContent = exp.getAttribute("data-exp"); exp.hidden = false; b.hidden = true; return; }
    var bien = b.getAttribute("data-op") === b.getAttribute("data-bien");
    Array.prototype.forEach.call(q.querySelectorAll(".ej-op"), function (x) { x.classList.remove("bien", "mal"); });
    b.classList.add(bien ? "bien" : "mal");
    exp.className = "ej-exp " + (bien ? "bien" : "mal");
    exp.textContent = bien ? "✓ " + exp.getAttribute("data-exp") : "No es esa: prueba otra.";
    exp.hidden = false;
  });

  var e = id && id !== "S7" ? D.ejemplos[id] : null;
  if (e) ejemplo(e); else indice();
})();
