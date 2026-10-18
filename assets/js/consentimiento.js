/**
 * GAMIFICAPRO · EL CONSENTIMIENTO GENERAL, AL ENTRAR (10-oct-2026) — pieza del motor para cualquier mod con política de privacidad.
 *
 * Hasta el 10-oct vivía en STARGATE (web-stargate assets/js/recluta.js, `pedirConsentimiento` y `ventanaConsentimiento`, del
 * 5-oct) y DPG1 la necesitaba igual (Norberto, 10-oct: «política de privacidad y la ventana de consentimiento general al entrar,
 * como STARGATE»). Es la misma, letra por letra, con lo propio de cada mod por configuración: cada web la copia en su build
 * (assets/js/consentimiento.js, con `guardas.copiar_pieza`) y NO se edita allí: aquí. Lo que la web pone delante (del build):
 *
 *   window.GP_CONSENTIMIENTO = { v: la versión de la política publicada («2026-10-07»), pide?: la más antigua que vale sin volver a
 *     preguntar (18-oct; sin ella, solo `v`), texto: lo que se acepta (lleva
 *     «política de privacidad», que se convierte en el enlace), contacto: el correo para dejarlo, enlace: «privacidad.html»,
 *     piel: { no: el prefijo de «ya dijo que no en esta visita» en sessionStorage («sgConsNo_»),
 *             clases: { capa, caja, quien, txt, pie, boton, primario },
 *             textos: { quien (HTML, quien habla: «NEBULA» con su icono; vacío = nadie), titulo, intro (HTML), no, si, gracias
 *                       (HTML, el aviso tras aceptar), sinGuardar, salidaTitulo, salida (HTML; «{contacto}» = el enlace al
 *                       correo), volver, ok } } }
 *
 * 🔴 DÓNDE SE GUARDA: en lo privado de la ficha, `student_profiles/{ficha}/privado/datos.consentimiento = { v, t }` (la versión
 * aceptada y el momento). Lo leen su dueño y su equipo docente; lo escribe su dueño (si la cuenta no está congelada): las reglas
 * de siempre, sin nada nuevo. Alistarse lo firma en la misma escritura que la ficha (`firma()`); a quien ya estaba dentro, o tiene
 * otra versión, se le pregunta UNA vez al entrar. La pieza no sabe de Firestore: la web le da `leer()` (→ lo privado de la ficha)
 * y `guardar(firma)` (merge, sin pisar nombre, correo ni nada más).
 *
 *   GP.consentimiento.disponible()   → hay versión y texto en esta página
 *   GP.consentimiento.aceptado(dat)  → lo privado de la ficha lleva el sí a ESTA versión (o, con `pide`, a una desde `pide`)
 *   GP.consentimiento.firma()        → { v, t: ahora }: lo que se guarda al aceptar (y al alistarse)
 *   GP.consentimiento.textoHtml()    → el texto que se acepta, con «política de privacidad» enlazada (otra pestaña)
 *   GP.consentimiento.pedir(o)       → pregunta si hace falta y, si no, sigue. o = { per, ficha, excluir, leer(), guardar(firma),
 *        alLeer(dat), seguir(), aviso(html, mal) }. `excluir` = lo que la web sabe que NO se pregunta (la demo, el ensayo, la
 *        proyección, el equipo docente, un fantasma, una cuenta congelada…): entonces, `seguir()` sin más. Tampoco dentro de otra
 *        página (iframe) ni sin ficha.
 *          · ya aceptó esta versión → `seguir()`, sin ventana;
 *          · si no → la ventana: «Acepto» guarda `firma()` y sigue (sin red: se cierra igual, lo dice y se vuelve a preguntar la
 *            próxima vez); «No quiero participar» explica cómo dejarlo y NO escribe ni borra nada; en esta visita no se le insiste
 *            (y lo de después de entrar no sale), y la próxima vez que entre se le vuelve a preguntar.
 *   🔴 No se cierra pulsando fuera ni con Escape: es una respuesta, no un aviso (cerrarla sin querer sería un «no» que no ha dicho).
 * Pruebas: tests/sdk/consentimiento.test.ts (con la piel de STARGATE, LETRA POR LETRA lo que pintaba su recluta.js del 5-oct, el
 * dorado en tests/sdk/consentimiento/stargate-antes.js), la batería 134 de STARGATE y prueba_puras de DPG.
 */
(function () {
  var W = window, GP = W.GP = W.GP || {};
  if (GP.consentimiento) return;
  var C = W.GP_CONSENTIMIENTO || null;
  var P = (C && C.piel) || {};
  var K = Object.assign({ capa: "gpcs-capa", caja: "gpcs-caja", quien: "gpcs-quien", txt: "gpcs-txt", pie: "gpcs-pie", boton: "gpcs-btn",
                          primario: "gpcs-primario" }, P.clases || {});
  var T = Object.assign({
    quien: "", titulo: "Antes de seguir, una cosa importante",
    intro: "<p>Hemos puesto al día la política de privacidad. Para seguir necesitamos que nos confirmes esto:</p>",
    no: "No quiero participar", si: "Acepto", gracias: "<b>Gracias.</b> Ya puedes seguir.",
    sinGuardar: "No se ha podido guardar tu respuesta. Te lo volveremos a preguntar la próxima vez que entres.",
    salidaTitulo: "Sin problema: participar es voluntario",
    salida: "<p>Para darte de baja y que se borren tus datos, <b>díselo a tu docente</b> o escribe a {contacto}.</p>"
      + "<p>Mientras no lo pidas, tu ficha se queda como está: <b>no se borra nada por sí solo</b>. Si cambias de idea, te lo "
      + "volveremos a preguntar la próxima vez que entres.</p>",
    volver: "Volver", ok: "Entendido",
  }, P.textos || {});
  var NO = P.no || "gpConsNo_";
  // (el mismo escape que tenía STARGATE: & < > ", para que salga letra por letra lo de antes)
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  function disponible() { return !!(C && C.v && C.texto); }
  // 18-oct · `pide` (opcional): la versión más antigua que vale. Una política que cambia en algo que no hay que volver a aceptar se
  // publica con su versión nueva (lo que se firma desde hoy) sin sacar la ventana a quien aceptó desde `pide` (STARGATE, 18-oct)
  function aceptado(dat) {
    var v = C && dat && dat.consentimiento && dat.consentimiento.v;
    if (!v) return false;
    return C.pide ? String(v) >= String(C.pide) : v === C.v;
  }
  function firma() { return { v: C ? C.v : "", t: Date.now() }; }
  function textoHtml() {
    return esc((C && C.texto) || "").replace("política de privacidad",
      '<a href="' + esc((C && C.enlace) || "privacidad.html") + '" target="_blank" rel="noopener">política de privacidad</a>');
  }

  var preguntando = false;   // (la sesión de una web puede avisar dos veces al cargar: una sola ventana)
  function pedir(o) {
    var seguir = o.seguir || function () {}, dicho = false;
    try { dicho = sessionStorage.getItem(NO + o.per) === (C && C.v); } catch (e) { /* sin almacenamiento */ }
    if (!disponible() || o.excluir || W.top !== W.self || !o.ficha || typeof o.leer !== "function" || typeof o.guardar !== "function") return seguir();
    if (dicho) return;             // ya dijo que no en esta visita: ni pregunta ni lo de después de entrar
    if (preguntando) return;
    preguntando = true;
    o.leer().then(function (dat) {
      dat = dat || {};
      if (o.alLeer) o.alLeer(dat);
      if (aceptado(dat)) { preguntando = false; return seguir(); }
      ventana(o);
    }, function () { preguntando = false; seguir(); });
  }

  function ventana(o) {
    var seguir = o.seguir || function () {}, aviso = o.aviso || function () {};
    var texto = textoHtml(), contacto = esc((C && C.contacto) || "");
    var quien = T.quien ? '<p class="' + K.quien + '">' + T.quien + "</p>" : "";
    var capa = document.createElement("div"); capa.className = K.capa + " cons-capa";
    capa.innerHTML = '<div class="' + K.caja + ' cons-caja" role="dialog" aria-modal="true" aria-labelledby="cons-t"></div>';
    var caja = capa.firstChild;
    function boton(que, txt, primario) {
      return '<button type="button" class="' + K.boton + (primario ? " " + K.primario : "") + '" data-cons-' + que + ">" + txt + "</button>";
    }
    function enfocar(que) { setTimeout(function () { var f = caja.querySelector("[data-cons-" + que + "]"); try { f.focus({ preventScroll: true }); } catch (e) { /* nada */ } }, 30); }
    function pregunta() {
      caja.innerHTML = quien
        + '<h3 id="cons-t">' + T.titulo + "</h3>"
        + '<div class="' + K.txt + '">' + T.intro + "</div>"
        + '<p class="cons-texto">' + texto + "</p>"
        + '<div class="' + K.pie + '">' + boton("no", T.no) + boton("si", T.si, true) + "</div>";
      caja.querySelector("[data-cons-si]").onclick = function () {
        var b = this; b.disabled = true; b.textContent = "Guardando…";
        o.guardar(firma()).then(function () {
          cerrar(); aviso(T.gracias); seguir();
        }, function () {
          // si no se ha podido guardar (sin red), se cierra igual y se le vuelve a preguntar la próxima vez
          cerrar(); aviso(T.sinGuardar, true); seguir();
        });
      };
      caja.querySelector("[data-cons-no]").onclick = salida;
      enfocar("si");
    }
    function salida() {
      caja.innerHTML = quien
        + '<h3 id="cons-t">' + T.salidaTitulo + "</h3>"
        + '<div class="' + K.txt + '">' + T.salida.split("{contacto}").join('<a href="mailto:' + contacto + '">' + contacto + "</a>") + "</div>"
        + '<div class="' + K.pie + '">' + boton("volver", T.volver) + boton("ok", T.ok, true) + "</div>";
      caja.querySelector("[data-cons-volver]").onclick = pregunta;
      caja.querySelector("[data-cons-ok]").onclick = function () {
        try { sessionStorage.setItem(NO + o.per, C.v); } catch (e) { /* sin almacenamiento */ }
        cerrar();
      };
      enfocar("ok");
    }
    function cerrar() { preguntando = false; capa.classList.add("cerrando"); setTimeout(function () { if (capa.parentNode) capa.parentNode.removeChild(capa); }, 130); }
    // 🔴 no se cierra pulsando fuera ni con Escape: es una respuesta, no un aviso (cerrarla sin querer sería un «no» que no ha dicho)
    capa.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); return; }
      if (ev.key !== "Tab") return;
      var fs = [].slice.call(caja.querySelectorAll("button:not([disabled]), a[href]")), i = fs.indexOf(document.activeElement);
      ev.preventDefault(); fs[(i + (ev.shiftKey ? -1 : 1) + fs.length) % fs.length].focus();
    });
    pregunta();
    document.body.appendChild(capa);
  }

  GP.consentimiento = { disponible: disponible, aceptado: aceptado, firma: firma, textoHtml: textoHtml, pedir: pedir, ventana: ventana,
                        version: C ? C.v : "" };
})();
