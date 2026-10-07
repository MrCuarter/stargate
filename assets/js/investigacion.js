/**
 * STARGATE · LA INVESTIGACIÓN DEL TICKET DE SALIDA (7-oct-2026) — lo común a la Nave (recluta.js) y al ticket (ticket.js).
 *
 * Norberto investiga con el ticket (tesis doctoral y publicaciones) y necesita enlazar los tickets de una misma persona a lo
 * largo del curso. El motor ya lo hace (GamificaPro, docs/INVESTIGACION_TICKET.md): quien ACEPTA, sus tickets llevan un
 * seudónimo que calcula el servidor con un secreto; el profesorado sigue viendo lo de siempre. Aquí solo se pregunta y se
 * enseña, con el texto aprobado (window.SG_INVESTIGACION, del build: _site_data.py → INVESTIGACION_*):
 *
 *   · `modConsentimiento({ projectId, studentProfileId })`                 → ¿participa? (consultar)
 *   · `modConsentimiento({ …, acepta: true, version })` / `{ acepta: false }` → aceptar / retirarse
 *   · `modOlvidarSeudonimo({ projectId, studentProfileId })`               → «Borrar mi código» (y se retira)
 *
 * 🔴 VOLUNTARIA DE VERDAD. Nunca una ventana obligatoria, nunca bloquea nada, y decir que no no cambia nada: «No, gracias» ni
 * siquiera llama al servidor (no hay nada que guardar). Se ofrece una vez: si la persona la cierra o dice que no, ESTE
 * navegador no se la vuelve a ofrecer (`sgInvVisto:<ficha>` = versión); y siempre puede cambiarlo desde su Nave o desde el
 * ticket. Lo de «no» no se guarda en ningún sitio que lea el profesorado: la plataforma no le dice quién participa.
 *
 * 🔴 SI EL SERVIDOR NO CONTESTA, NO SE ENSEÑA NADA. Antes de desplegar las funciones, en un grupo sin la pieza, sin red o
 * para un fantasma, `consultar` da null y la Nave y el ticket siguen exactamente como antes (GP_SDK.llamar marca el error,
 * `sinDesplegar`; aquí cualquier error vale lo mismo: no hay investigación que enseñar).
 *
 *   SG.INV.disponible()                    → hay texto y versión en esta página
 *   SG.INV.consultar(M, per, ficha)        → Promise<{ investigacion } | null>   (nunca falla; null = no se enseña nada)
 *   SG.INV.participa(e) / decidido(e)      → acepta hoy / ha decidido alguna vez (aceptado o retirado)
 *   SG.INV.ofrecer(e, ficha)               → toca ofrecerla (no ha decidido y este navegador no la ha visto)
 *   SG.INV.marcarVisto(ficha)              → no volver a ofrecerla aquí
 *   SG.INV.panel(caja, o)                  → pinta el texto y los botones dentro de `caja` y los cablea.
 *        o = { M, per, ficha, estado, alCambiar(estado), alCerrar(), cerrar: 'Cerrar' | null }
 *   SG.INV.ventana(o)                      → el mismo panel en una ventana encima de la página (la Nave): ×, Esc y velo
 */
(function () {
  var SG = window.SG = window.SG || {};
  if (SG.INV) return;
  var C = window.SG_INVESTIGACION || null;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  function disponible() { return !!(C && C.v && Array.isArray(C.texto) && C.texto.length); }
  function participa(e) { return !!(e && e.investigacion && e.investigacion.acepta === true); }
  function decidido(e) { return !!(e && e.investigacion); }
  var clave = function (ficha) { return "sgInvVisto:" + ficha; };
  function visto(ficha) { try { return !!C && localStorage.getItem(clave(ficha)) === C.v; } catch (e) { return false; } }
  function marcarVisto(ficha) { try { if (C && ficha) localStorage.setItem(clave(ficha), C.v); } catch (e) { /* sin almacenamiento */ } }
  function ofrecer(e, ficha) { return !!e && !decidido(e) && !visto(ficha); }

  /** ¿Participa? Nunca falla: con cualquier error (sin desplegar, sin la pieza, sin red) o si tarda, null = no se enseña nada. */
  function consultar(M, per, ficha, tope) {
    if (!disponible() || !M || typeof M.llamar !== "function" || !per || !ficha) return Promise.resolve(null);
    var p = Promise.resolve().then(function () { return M.llamar("modConsentimiento", { projectId: per, studentProfileId: ficha }); })
      .then(function (r) { return r && r.ok ? { investigacion: r.investigacion || null } : null; }, function () { return null; });
    return Promise.race([p, new Promise(function (res) { setTimeout(function () { res(null); }, tope || 8000); })]);
  }
  function fecha(t) {
    var d = new Date(Number(t) || 0);
    return isNaN(d.getTime()) || !t ? "" : d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  }
  var limpio = function (e) { return String((e && e.message) || e || "").replace(/^FirebaseError:\s*/, ""); };

  /**
   * El panel: el texto entero (se lee antes de decidir; nada de letra pequeña) y, debajo, lo que se puede hacer.
   *   · no participa → la casilla SIN marcar y «No, gracias» / «Sí, participo» (este, apagado hasta marcarla)
   *   · participa    → desde cuándo, «Retirarme» y «Borrar mi código»
   *   · ha decidido alguna vez → también «Borrar mi código» (quien se retiró puede querer quitarlo de lo ya enviado)
   */
  function panel(caja, o) {
    var estado = o.estado || { investigacion: null };
    function salir() { if (o.alCerrar) o.alCerrar(); }
    function cambia(nuevo) { estado = nuevo; if (o.alCambiar) o.alCambiar(nuevo); }
    function pie(html) { return '<div class="sgp-bot inv-bot">' + html + "</div>"; }
    var cerrar = o.cerrar === null ? "" : '<button type="button" class="btn min" data-inv="cerrar">' + esc(o.cerrar || "Cerrar") + "</button>";

    function leer(msg, mal) {
      var si = participa(estado), inv = estado.investigacion || {};
      var html = '<h3 class="inv-tit">' + esc(C.titulo || "Investigación sobre el ticket de salida") + "</h3>"
        + '<div class="inv-texto">' + C.texto.map(function (p) { return "<p>" + p + "</p>"; }).join("") + "</div>";
      if (si) {
        html += '<p class="inv-estado"><b>Participas</b>' + (fecha(inv.fecha) ? " desde el " + esc(fecha(inv.fecha)) : "")
          + ": tus tickets llevan tu seudónimo.</p>"
          + (msg ? '<p class="inv-msg' + (mal ? " mal" : "") + '" role="status">' + msg + "</p>" : "")
          + pie('<button type="button" class="btn min inv-peligro" data-inv="borrar">Borrar mi código</button>'
            + '<button type="button" class="btn min" data-inv="retirar">Retirarme</button>' + cerrar);
      } else {
        html += (decidido(estado) ? '<p class="inv-estado">Ahora <b>no participas</b>: tus tickets van sin código.</p>' : "")
          + '<label class="inv-acepto"><input type="checkbox" data-inv="casilla"> <span>' + esc(C.acepto) + "</span></label>"
          + (msg ? '<p class="inv-msg' + (mal ? " mal" : "") + '" role="status">' + msg + "</p>" : "")
          + pie((decidido(estado) ? '<button type="button" class="btn min inv-peligro" data-inv="borrar">Borrar mi código</button>' : "")
            + '<button type="button" class="btn min" data-inv="no">' + (decidido(estado) ? "Dejarlo así" : "No, gracias") + "</button>"
            + '<button type="button" class="btn min primary" data-inv="si" disabled>Sí, participo</button>');
      }
      caja.innerHTML = html;
      var casilla = caja.querySelector('[data-inv="casilla"]'), bSi = caja.querySelector('[data-inv="si"]');
      if (casilla && bSi) casilla.onchange = function () { bSi.disabled = !casilla.checked; };
      cablear();
    }
    function borrarPregunta() {
      caja.innerHTML = '<h3 class="inv-tit">¿Borrar tu código?</h3>'
        + '<div class="inv-texto"><p>Se quitará tu código de <b>todos los tickets que ya enviaste</b>, en todos tus grupos de '
        + "STARGATE, y dejarás de participar. <b>No se puede deshacer.</b> Tus respuestas siguen ahí, sin código, como las de "
        + "quien no participa.</p></div>"
        + pie('<button type="button" class="btn min" data-inv="volver">Volver</button>'
          + '<button type="button" class="btn min primary inv-peligro" data-inv="borrar-si">Sí, bórralo</button>');
      cablear();
      enfocar('[data-inv="volver"]');
    }
    function hecho(txt) {
      caja.innerHTML = '<h3 class="inv-tit">' + esc(C.titulo || "Investigación sobre el ticket de salida") + "</h3>"
        + '<p class="inv-msg" role="status">' + txt + "</p>" + pie(cerrar || '<button type="button" class="btn min" data-inv="volver">Volver</button>');
      cablear();
      enfocar('[data-inv="cerrar"],[data-inv="volver"]');
    }
    function ocupado(b, txt) {
      Array.prototype.forEach.call(caja.querySelectorAll("button,input"), function (x) { x.disabled = true; });
      if (b) b.textContent = txt;
    }
    function llamar(nombre, datos) {
      return Promise.resolve().then(function () { return o.M.llamar(nombre, Object.assign({ projectId: o.per, studentProfileId: o.ficha }, datos || {})); });
    }
    function cablear() {
      Array.prototype.forEach.call(caja.querySelectorAll("[data-inv]"), function (b) {
        var que = b.getAttribute("data-inv");
        if (que === "casilla") return;
        b.onclick = function () {
          if (que === "cerrar") return salir();
          if (que === "volver") return leer();
          if (que === "borrar") return borrarPregunta();
          if (que === "no") {
            // 🔴 «No, gracias» no llama al servidor: no hay nada que guardar. Solo no se vuelve a ofrecer en este navegador.
            marcarVisto(o.ficha);
            if (decidido(estado)) return salir();
            return hecho("Sin problema: no participas y tus tickets van sin código, como siempre. Si cambias de idea, lo tienes en tu Nave y en la página del ticket.");
          }
          if (que === "si") {
            var casilla = caja.querySelector('[data-inv="casilla"]');
            if (!casilla || !casilla.checked) return;
            ocupado(b, "Guardando…");
            return llamar("modConsentimiento", { acepta: true, version: C.v }).then(function (r) {
              marcarVisto(o.ficha);
              cambia({ investigacion: (r && r.investigacion) || { acepta: true, version: C.v, fecha: Date.now() } });
              hecho("<b>¡Gracias!</b> Desde ahora tus tickets llevan tu seudónimo. Puedes retirarte cuando quieras, aquí mismo.");
            }, function (e) { leer("No se ha podido guardar: " + esc(limpio(e)) + " Vuelve a probar en un momento.", true); });
          }
          if (que === "retirar") {
            ocupado(b, "Guardando…");
            return llamar("modConsentimiento", { acepta: false }).then(function (r) {
              cambia({ investigacion: (r && r.investigacion) || { acepta: false, fecha: Date.now() } });
              leer("Hecho: ya no participas. Tus tickets nuevos van sin código. Si quieres quitarlo también de los que ya enviaste, pulsa «Borrar mi código».");
            }, function (e) { leer("No se ha podido guardar: " + esc(limpio(e)) + " Vuelve a probar en un momento.", true); });
          }
          if (que === "borrar-si") {
            ocupado(b, "Borrando…");
            return llamar("modOlvidarSeudonimo").then(function (r) {
              cambia({ investigacion: { acepta: false, fecha: Date.now(), olvido: { fecha: Date.now() } } });
              hecho(r && r.sinSecreto ? "No había ningún código que borrar. Ya no participas: tus tickets van sin código."
                : "Hecho: tu código ya no está en ningún ticket. Ya no participas: tus tickets van sin código.");
            }, function (e) { leer("No se ha podido borrar: " + esc(limpio(e)) + " Vuelve a probar en un momento.", true); });
          }
        };
      });
    }
    function enfocar(sel) { setTimeout(function () { var f = caja.querySelector(sel); try { if (f) f.focus({ preventScroll: true }); } catch (e) { /* nada */ } }, 30); }
    leer();
  }

  /** La ventana (la Nave): el panel encima de la página, con velo, × y Esc. Se cierra al pulsar fuera; dentro, no. */
  function ventana(o) {
    var antes = document.activeElement;
    var capa = document.createElement("div"); capa.className = "sgp-capa inv-capa";
    capa.innerHTML = '<div class="sgp-caja inv-caja" role="dialog" aria-modal="true" aria-label="' + esc(C.titulo || "Investigación") + '">'
      + '<button type="button" class="inv-x" aria-label="Cerrar">×</button><div class="inv-dentro"></div></div>';
    var caja = capa.firstChild, cerrada = false;
    function cerrar() {
      if (cerrada) return; cerrada = true;
      document.removeEventListener("keydown", tecla, true);
      capa.classList.add("cerrando");
      setTimeout(function () { if (capa.parentNode) capa.parentNode.removeChild(capa); }, 130);
      try { if (antes && antes.focus) antes.focus({ preventScroll: true }); } catch (e) { /* nada */ }
      if (o.alCerrar) o.alCerrar();
    }
    function tecla(ev) {
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); cerrar(); return; }
      if (ev.key !== "Tab") return;
      var fs = [].slice.call(caja.querySelectorAll("button:not([disabled]), input:not([disabled]), a[href]")), i = fs.indexOf(document.activeElement);
      if (!fs.length) return;
      ev.preventDefault(); fs[(i + (ev.shiftKey ? -1 : 1) + fs.length) % fs.length].focus();
    }
    capa.addEventListener("click", function (ev) { if (ev.target === capa) cerrar(); });
    caja.querySelector(".inv-x").onclick = cerrar;
    document.addEventListener("keydown", tecla, true);
    panel(caja.querySelector(".inv-dentro"), Object.assign({}, o, { alCerrar: cerrar }));
    document.body.appendChild(capa);
    setTimeout(function () { var f = caja.querySelector('[data-inv="casilla"]') || caja.querySelector(".inv-x"); try { f.focus({ preventScroll: true }); } catch (e) { /* nada */ } }, 30);
    return { cerrar: cerrar };
  }

  SG.INV = { disponible: disponible, consultar: consultar, participa: participa, decidido: decidido, ofrecer: ofrecer,
             visto: visto, marcarVisto: marcarVisto, panel: panel, ventana: ventana, version: C ? C.v : "" };
})();
