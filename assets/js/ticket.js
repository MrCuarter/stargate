/**
 * STARGATE — EL TICKET DE SALIDA, YA DENTRO DE GAMIFICAPRO (5-oct-2026). Página: ticket.html?per=<grupo>&tema=<tema>.
 *
 * Norberto (5-oct): «el ticket de STARGATE, cuanto antes, prioridad 1». Sustituye al Google Form: la misma dirección se
 * incrusta donde antes iba el formulario (la última diapositiva de la sesión, la tarjeta de la Nave y la sala de espera de
 * En directo), y lo que se envía va a GamificaPro (`modTicket`), anónimo: el servidor guarda la respuesta sin nombre y
 * apunta aparte que ya lo enviaste. Las preguntas (la piel) están en tkcomun.js (`SG.TK.PREGUNTAS`).
 *
 * `tema` es la clave («p», «0», «1»…«8») o el texto de la opción del formulario de antes (SG_TICKET_TEMAS): las dos valen.
 * Sin tema, se elige. Al enviarlo se apunta en este navegador (`sgTicket:<grupo>:<opción>`), como hacía el formulario,
 * para que la Nave y la sesión lo den por hecho; y se avisa a la página madre (`sg-ticket-hecho`).
 */
(function () {
  var Q = new URLSearchParams(location.search);
  var PER = Q.get("per") || "", T = window.SG_TICKET_TEMAS || {};
  var EMBED = Q.has("embed") || Q.has("embedded") || window.self !== window.top;
  if (EMBED) document.documentElement.classList.add("tk-solo");
  var app = document.getElementById("ticket-app");
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  function claveDe(t) {
    t = String(t || "").trim(); if (!t) return "";
    if (Object.prototype.hasOwnProperty.call(T, t)) return t;
    for (var k in T) if (T[k] === t) return k;
    return "";
  }
  var TEMA = claveDe(Q.get("tema"));

  function pinta(html) { app.innerHTML = html; }
  function aviso(txt, mal) { pinta('<div class="card tk-aviso' + (mal ? " mal" : "") + '"><p>' + txt + "</p></div>"); }
  function marcarHecho() {
    try { localStorage.setItem("sgTicket:" + PER + ":" + (T[TEMA] || TEMA), "1"); } catch (e) { /* sin almacenamiento */ }
    try { if (window.parent !== window) window.parent.postMessage({ tipo: "sg-ticket-hecho", per: PER, tema: TEMA }, location.origin); } catch (e) { /* nada */ }
  }

  function elegirTema() {
    pinta('<div class="card"><h2>¿De qué tema es tu ticket?</h2><div class="tk-temas">' + Object.keys(T).map(function (k) {
      return '<button type="button" class="btn" data-tema="' + esc(k) + '">' + esc(T[k]) + "</button>";
    }).join("") + "</div></div>");
    Array.prototype.forEach.call(app.querySelectorAll("[data-tema]"), function (b) {
      b.onclick = function () { TEMA = b.getAttribute("data-tema"); arrancarTema(); };
    });
  }

  function formulario() {
    var P = window.SG.TK.preguntasDe(TEMA), R = {};
    var html = '<form class="card tk-form" id="tk-f" novalidate><div class="kicker"><img class=ico src="assets/img/iconos/p/ticket.png" alt=""> Ticket de salida</div>'
      + "<h2>" + esc(T[TEMA] || "El ticket") + '</h2><p class="small muted">Anónimo y en dos minutos: tu Comandante ve lo que dice la clase, '
      + 'nunca quién lo dijo. Al enviarlo te llega una <b>cápsula de suministros</b> con un premio al azar.</p>';
    P.forEach(function (q) {
      html += '<fieldset class="tk-q" data-q="' + esc(q.id) + '"><legend>' + esc(q.texto) + (q.tipo === "escala" ? "" : ' <span class="muted small">(opcional)</span>') + "</legend>";
      if (q.tipo === "escala") {
        html += '<div class="tk-escala">' + [1, 2, 3, 4, 5].map(function (n) {
          return '<button type="button" class="btn tk-v" data-v="' + n + '" aria-pressed="false">' + n + "</button>";
        }).join("") + '</div><div class="tk-extremos small muted"><span>Nada</span><span>Mucho</span></div>';
      } else if (q.tipo === "opcion") {
        html += '<div class="tk-escala">' + q.opciones.map(function (o) {
          return '<button type="button" class="btn tk-v" data-v="' + esc(o[0]) + '" aria-pressed="false">' + esc(o[1]) + "</button>";
        }).join("") + "</div>";
      } else {
        html += '<textarea class="tk-t" maxlength="500" rows="3" aria-label="' + esc(q.texto) + '"></textarea>';
      }
      html += "</fieldset>";
    });
    html += '<p class="tk-error" role="alert" hidden></p><button type="submit" class="btn primary">Enviar el ticket</button></form>';
    pinta(html);
    Array.prototype.forEach.call(app.querySelectorAll(".tk-q"), function (fs) {
      var id = fs.getAttribute("data-q");
      Array.prototype.forEach.call(fs.querySelectorAll(".tk-v"), function (b) {
        b.onclick = function () {
          var v = b.getAttribute("data-v"); R[id] = /^[1-5]$/.test(v) ? Number(v) : v;
          Array.prototype.forEach.call(fs.querySelectorAll(".tk-v"), function (x) { x.setAttribute("aria-pressed", String(x === b)); x.classList.toggle("primary", x === b); });
        };
      });
      var t = fs.querySelector(".tk-t"); if (t) t.oninput = function () { R[id] = t.value; };
    });
    var f = document.getElementById("tk-f"), err = f.querySelector(".tk-error"), boton = f.querySelector('button[type="submit"]');
    f.onsubmit = function (ev) {
      ev.preventDefault();
      var falta = P.filter(function (q) { return q.tipo === "escala" && !R[q.id]; })[0];
      if (falta) { err.hidden = false; err.textContent = "Te falta valorar: «" + falta.texto + "»."; return; }
      var envio = {}; P.forEach(function (q) { var v = R[q.id]; if (v != null && v !== "") envio[q.id] = v; });
      boton.disabled = true; boton.textContent = "Enviando…"; err.hidden = true;
      window.SG.MOTOR.llamar("modTicket", { accion: "enviar", projectId: PER, tema: TEMA, respuestas: envio }).then(function (r) {
        marcarHecho();
        capsula(r || {});
      }, function (e) {
        boton.disabled = false; boton.textContent = "Enviar el ticket";
        var m = String((e && e.message) || e || "");
        if (/already-exists|Ya enviaste/i.test(m) || (e && e.code === "functions/already-exists")) { marcarHecho(); return aviso("<b>Ya lo enviaste.</b> ¡Gracias!"); }
        err.hidden = false; err.textContent = "No se ha podido enviar: " + m.replace(/^FirebaseError:\s*/, "") + " Vuelve a probar en un momento.";
      });
    };
  }

  /**
   * 🔴 5-oct · LA CÁPSULA DE SUMINISTROS. Norberto: «una cápsula espacial, que al abrirla apareciera la recompensa con
   * algún efecto molón». El premio ya lo ha tirado y pagado el servidor (`modTicket`, la rueda de TICKETS_POR_MOD): aquí
   * solo se abre. Se abre al pulsar (la emoción es tuya), tiembla, se carga, estalla y enseña lo que había; cuanto más
   * raro, más fuegos. Con «menos movimiento» en el sistema, se abre sin animación.
   */
  var IMG_CAPSULA = "assets/img/canje/_raw/capsula_rescate.jpg";
  var IMG_SOBRE = { cromo: "assets/img/canje/_raw/sobre.jpg", sobre_grande: "assets/img/canje/_raw/sobre_grande.jpg",
    sobre_raro: "assets/img/canje/_raw/sobre_raro.jpg", sobre_epico: "assets/img/canje/_raw/sobre_epico.jpg" };
  var NOMBRE_SOBRE = { cromo: "Un sobre de cromos", sobre_grande: "Un sobre grande", sobre_raro: "Un sobre de raras", sobre_epico: "Un sobre épico" };
  var RAREZA = { c10: 1, c20: 1, c30: 1, sobre: 1, c50: 2, grande: 2, c100: 3, raro: 3, epico: 4 };
  var COLORES = { acento: "#37e0ec", acento2: "#f5b043", raro: "#b48cff", epico: "#ffd76a" };

  function tripulacionHtml(r) {
    return r.tripulacion > 0 ? '<p class="tk-tripu"><b>¡Parte de la tripulación!</b> Con tu ticket, más de la cuarta parte de la clase ha respondido: '
      + "hay premio para toda la tripulación.</p>" : "";
  }
  /** La piel de STARGATE sobre la cápsula del motor (GamificaPro sdk/capsula.js → assets/js/capsula.js). */
  function capsula(r) {
    var P = r.premio;
    if (!P || !window.GP || !window.GP.capsula) {
      return aviso("<b>¡Ticket enviado!</b> Gracias: lo que habéis dicho sale en la próxima clase."
        + (P ? " Te ha tocado " + (P.sobre ? esc(NOMBRE_SOBRE[P.tipo] || "un sobre").toLowerCase() : "+" + Number(P.creditos || 0) + " ◈") + "." : "") + tripulacionHtml(r));
    }
    var sobre = !!(P.sobre && P.tipo);
    pinta('<div class="card" id="tk-cap"></div>');
    window.GP.capsula.montar(document.getElementById("tk-cap"), {
      imagen: IMG_CAPSULA, alt: "La cápsula de suministros", boton: "Abrir la cápsula", nivel: RAREZA[P.casilla] || 1, colores: COLORES,
      antes: "<p><b>¡Ticket enviado!</b> Te llega una cápsula de suministros.</p>",
      premio: sobre ? { img: IMG_SOBRE[P.tipo] || IMG_SOBRE.cromo } : { cifra: "+" + Number(P.creditos || 0) + " ◈" },
      titulo: sobre ? "¡" + (NOMBRE_SOBRE[P.tipo] || "Un sobre") + "!" : "créditos",
      despues: "<p>" + (sobre ? "Lo tienes en tu <b>Botín</b>: ábrelo desde tu Nave." : "Ya están en tu Nave, para el Mercado.")
        + " Gracias: lo que habéis dicho sale en la próxima clase.</p>" + tripulacionHtml(r)
    });
  }

  function arrancarTema() {
    if (!TEMA) return elegirTema();
    aviso("Un momento…");
    window.SG.MOTOR.llamar("modTicket", { accion: "estado", projectId: PER, tema: TEMA }).then(function (r) {
      if (r && r.hecho) { marcarHecho(); return aviso("<b>Ya enviaste el ticket de este tema.</b> ¡Gracias!"); }
      formulario();
    }, function (e) {
      var m = String((e && e.message) || e || "");
      if (/permission-denied|alumnado del grupo/i.test(m)) return aviso("Este ticket es del alumnado del grupo. Entra con la cuenta con la que te alistaste.", true);
      if (/not-found|no existe|no tiene ticket/i.test(m)) return aviso("Este grupo no tiene ticket de salida.", true);
      aviso("No he podido abrir el ticket ahora mismo (" + esc(m.replace(/^FirebaseError:\s*/, "")) + "). Recarga en un momento.", true);
    });
  }

  function puerta() {
    pinta('<div class="card"><h2>El ticket de salida</h2><p>Entra con la cuenta de Google con la que te alistaste. Es anónimo: tu nombre no se guarda con lo que contestes.</p>'
      + '<button type="button" class="btn primary" id="tk-entrar">Entrar con Google</button></div>');
    document.getElementById("tk-entrar").onclick = function () {
      window.SG.MOTOR.entrar().catch(function (e) { aviso("No se ha podido entrar: " + esc((e && e.message) || e), true); });
    };
  }

  var lanzado = false;
  function arrancar() {
    if (!PER) return aviso("Falta el grupo en la dirección del ticket.", true);
    var M = window.SG.MOTOR;
    var una = function (yo) { if (!yo) return puerta(); if (lanzado) return; lanzado = true; arrancarTema(); };
    M.sesion().then(una);
    document.addEventListener("sg:sesion", function (e) { una(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
