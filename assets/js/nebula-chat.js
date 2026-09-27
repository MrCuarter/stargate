/*
 * STARGATE · «NEBULA RESPONDE» · el chat de dudas del alumnado (27-sep-2026).
 *
 *   SG.NEBULA_CHAT.montar(contenedor, { per })   → pinta el chat dentro de `contenedor` (un elemento o su id)
 *
 * Llama a GamificaPro: SG.MOTOR.llamar('stargateNebula', { projectId: per, pregunta, historial }) → { ok, respuesta, quedan }
 * o { ok:false, motivo }. NEBULA solo sabe de la asignatura, las fechas, el examen y cómo funciona STARGATE: no da
 * respuestas de los retos ni destripa la historia (lo decide el servidor; aquí solo se cuenta).
 * La conversación del día se guarda en sessionStorage (se pierde al cerrar la pestaña). Estilos propios, inyectados una vez.
 */
(function () {
  "use strict";
  window.SG = window.SG || {};

  var IMG = "assets/img/personajes/nebula.png";
  var CUPO = 15, MAX = 500, TURNOS = 6;
  var AVISO = "Pregúntame por la asignatura, las fechas, el examen o cómo funciona STARGATE. No doy respuestas de los retos ni destripo la historia.";
  var CAIDA = "NEBULA no está disponible ahora mismo. Prueba más tarde o pregunta a tu Comandante.";

  var CSS = [
    ".nbc{--nbc-fondo:#101a28;--nbc-borde:#1c2c40;--nbc-cian:#37e0ec;--nbc-texto:#e9f0f6;--nbc-apagado:#9fb2c2;",
    "box-sizing:border-box;width:100%;max-width:100%;background:var(--nbc-fondo);border:1px solid var(--nbc-borde);border-radius:14px;",
    "color:var(--nbc-texto);font-size:15px;line-height:1.45;display:flex;flex-direction:column;overflow:hidden}",
    ".nbc *{box-sizing:border-box}",
    ".nbc-cab{display:flex;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid var(--nbc-borde)}",
    ".nbc-cab img{width:52px;height:52px;border-radius:50%;object-fit:cover;flex:none;border:2px solid var(--nbc-cian);background:#0b131e}",
    ".nbc-cab h3{margin:0;font-size:17px;color:var(--nbc-cian);letter-spacing:.04em}",
    ".nbc-cab p{margin:2px 0 0;font-size:13px;color:var(--nbc-apagado)}",
    ".nbc-log{padding:14px 16px;display:flex;flex-direction:column;gap:10px;max-height:420px;min-height:120px;overflow-y:auto;overflow-x:hidden}",
    ".nbc-b{max-width:88%;padding:9px 12px;border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}",
    ".nbc-b.yo{align-self:flex-end;background:#16324a;border:1px solid #21507a;border-bottom-right-radius:4px}",
    ".nbc-b.nebula{align-self:flex-start;background:#0c2530;border:1px solid #1b4b58;border-bottom-left-radius:4px}",
    ".nbc-b.nebula b{display:block;font-size:12px;color:var(--nbc-cian);letter-spacing:.05em;margin-bottom:2px}",
    ".nbc-b.error{align-self:stretch;max-width:100%;background:#2a1a1a;border:1px solid #5a2e2e;color:#f3d6d6;font-size:14px}",
    ".nbc-vacio{color:var(--nbc-apagado);font-size:14px;text-align:center;margin:auto 0}",
    ".nbc-pensando{align-self:flex-start;color:var(--nbc-apagado);font-size:14px;font-style:italic}",
    ".nbc-pie{border-top:1px solid var(--nbc-borde);padding:12px 16px 14px}",
    ".nbc-form{display:flex;gap:8px;align-items:flex-end}",
    ".nbc-form textarea{flex:1;min-width:0;resize:vertical;min-height:44px;max-height:160px;background:#0b131e;color:var(--nbc-texto);",
    "border:1px solid var(--nbc-borde);border-radius:10px;padding:10px 12px;font:inherit;font-size:15px}",
    ".nbc-form textarea:focus{outline:2px solid var(--nbc-cian);outline-offset:1px;border-color:transparent}",
    ".nbc-form button{flex:none;min-height:44px;padding:0 16px;border-radius:10px;border:0;background:var(--nbc-cian);color:#06222a;",
    "font:inherit;font-size:15px;font-weight:700;cursor:pointer}",
    ".nbc-form button:disabled{opacity:.5;cursor:default}",
    ".nbc-form button:focus-visible{outline:2px solid var(--nbc-texto);outline-offset:2px}",
    ".nbc-info{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:6px;font-size:12px;color:var(--nbc-apagado)}",
    ".nbc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
    "@media (max-width:480px){.nbc-cab img{width:44px;height:44px}.nbc-b{max-width:94%}.nbc-form{flex-direction:column;align-items:stretch}",
    ".nbc-form button{width:100%}}"
  ].join("");

  function estilos() {
    if (document.getElementById("nebula-chat-css")) return;
    var s = document.createElement("style");
    s.id = "nebula-chat-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function hoy() {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }

  // ── la conversación del día, en sessionStorage (con try: en privado o bloqueado, el chat funciona igual)
  function clave(per) { return "sg-nebula-chat:" + per + ":" + hoy(); }
  function leer(per) {
    try {
      var d = JSON.parse(sessionStorage.getItem(clave(per)) || "null");
      if (d && Array.isArray(d.turnos)) return { turnos: d.turnos.filter(function (x) { return x && (x.r === "yo" || x.r === "nebula") && typeof x.t === "string"; }), quedan: typeof d.quedan === "number" ? d.quedan : null };
    } catch (e) { /* nada guardado */ }
    return { turnos: [], quedan: null };
  }
  function guardar(per, st) {
    try { sessionStorage.setItem(clave(per), JSON.stringify({ turnos: st.turnos.slice(-40), quedan: st.quedan })); } catch (e) { /* sin almacenamiento */ }
  }

  function motor() {
    return new Promise(function (ok) {
      if (window.SG.MOTOR && window.SG.MOTOR.llamar) return ok(window.SG.MOTOR);
      var hecho = false;
      function listo() { if (!hecho && window.SG.MOTOR && window.SG.MOTOR.llamar) { hecho = true; ok(window.SG.MOTOR); } }
      window.addEventListener("sg:motor", listo);
      var t = setInterval(function () { listo(); if (hecho) clearInterval(t); }, 300);
      setTimeout(function () { clearInterval(t); if (!hecho) { hecho = true; ok(null); } }, 15000);
    });
  }

  function mensajeDeError(e) {
    var code = String((e && e.code) || "");
    if (/unauthenticated/.test(code)) return "Entra con tu cuenta para hablar con NEBULA.";
    if (/permission-denied/.test(code)) return "NEBULA solo atiende a la tripulación de este grupo.";
    if (/not-found/.test(code)) return "No encuentro tu grupo. Recarga la página o pregunta a tu Comandante.";
    if (/failed-precondition/.test(code) && e.message) return e.message;
    return CAIDA;
  }

  function montar(contenedor, opciones) {
    var raiz = typeof contenedor === "string" ? document.getElementById(contenedor) : contenedor;
    var per = opciones && opciones.per;
    if (!raiz || !per) return null;
    estilos();
    var st = leer(per), ocupado = false;

    raiz.innerHTML = "";
    var caja = el("section", "nbc");
    caja.setAttribute("aria-label", "NEBULA responde: dudas de la asignatura");

    var cab = el("div", "nbc-cab");
    var img = el("img");
    img.src = IMG; img.alt = ""; img.width = 52; img.height = 52; img.loading = "lazy";
    var txt = el("div");
    txt.appendChild(el("h3", null, "NEBULA responde"));
    txt.appendChild(el("p", null, AVISO));
    cab.appendChild(img); cab.appendChild(txt);

    var log = el("div", "nbc-log");
    log.setAttribute("role", "log");
    log.setAttribute("aria-live", "polite");
    log.setAttribute("aria-relevant", "additions");
    log.setAttribute("aria-label", "Conversación con NEBULA");

    var pie = el("div", "nbc-pie");
    var form = el("form", "nbc-form");
    var idCampo = "nbc-q-" + Math.random().toString(36).slice(2, 8);
    var etiqueta = el("label", "nbc-sr", "Tu pregunta para NEBULA");
    etiqueta.setAttribute("for", idCampo);
    var campo = el("textarea");
    campo.id = idCampo; campo.rows = 2; campo.maxLength = MAX;
    campo.placeholder = "Escribe tu duda, recluta…";
    var boton = el("button", null, "Preguntar");
    boton.type = "submit";
    form.appendChild(etiqueta); form.appendChild(campo); form.appendChild(boton);
    var info = el("div", "nbc-info");
    var quedanEl = el("span");
    quedanEl.setAttribute("aria-live", "polite");
    var cuenta = el("span", null, "0/" + MAX);
    info.appendChild(quedanEl); info.appendChild(cuenta);
    pie.appendChild(form); pie.appendChild(info);

    caja.appendChild(cab); caja.appendChild(log); caja.appendChild(pie);
    raiz.appendChild(caja);

    function burbuja(r, t) {
      var b = el("div", "nbc-b " + r);
      if (r === "nebula") { b.appendChild(el("b", null, "NEBULA")); b.appendChild(document.createTextNode(t)); }
      else if (r === "yo") { b.appendChild(el("span", "nbc-sr", "Tú: ")); b.appendChild(document.createTextNode(t)); }
      else b.textContent = t;
      return b;
    }
    function pintar() {
      log.innerHTML = "";
      if (!st.turnos.length) log.appendChild(el("p", "nbc-vacio", "Aún no me has preguntado nada hoy."));
      st.turnos.forEach(function (x) { log.appendChild(burbuja(x.r, x.t)); });
      log.scrollTop = log.scrollHeight;
      pintarQuedan();
    }
    function pintarQuedan() {
      var q = st.quedan == null ? CUPO : st.quedan;
      quedanEl.textContent = q === 1 ? "Te queda 1 pregunta hoy" : "Te quedan " + q + " preguntas hoy";
      boton.disabled = ocupado || q <= 0;
      campo.disabled = q <= 0;
      if (q <= 0) campo.placeholder = "Hoy ya no quedan preguntas. Mañana, más.";
    }
    function poner(nodo) {
      var vacio = log.querySelector(".nbc-vacio");
      if (vacio) vacio.remove();
      log.appendChild(nodo);
      log.scrollTop = log.scrollHeight;
    }
    function error(t) { var b = burbuja("error", t); b.setAttribute("role", "status"); poner(b); }

    campo.addEventListener("input", function () { cuenta.textContent = campo.value.length + "/" + MAX; });
    campo.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (form.requestSubmit) form.requestSubmit(); else enviar(e); }
    });
    form.addEventListener("submit", enviar);

    function enviar(e) {
      if (e && e.preventDefault) e.preventDefault();
      if (ocupado) return;
      var pregunta = campo.value.replace(/\s+/g, " ").trim();
      if (!pregunta) { campo.focus(); return; }
      if (pregunta.length > MAX) { error("Tu pregunta es demasiado larga: como mucho " + MAX + " caracteres."); return; }
      var historial = st.turnos.slice(-TURNOS * 2);
      ocupado = true; pintarQuedan();
      st.turnos.push({ r: "yo", t: pregunta }); guardar(per, st);
      poner(burbuja("yo", pregunta));
      campo.value = ""; cuenta.textContent = "0/" + MAX;
      var pensando = el("p", "nbc-pensando", "NEBULA está pensando…");
      pensando.setAttribute("role", "status");
      poner(pensando);

      motor().then(function (M) {
        if (!M) throw { code: "sin-motor" };
        return M.llamar("stargateNebula", { projectId: per, pregunta: pregunta, historial: historial });
      }).then(function (r) {
        pensando.remove();
        if (r && typeof r.quedan === "number") st.quedan = r.quedan;
        if (r && r.ok && r.respuesta) {
          st.turnos.push({ r: "nebula", t: String(r.respuesta) });
          poner(burbuja("nebula", String(r.respuesta)));
        } else {
          st.turnos.pop();   // sin respuesta, la pregunta no queda en la conversación
          error((r && r.motivo) || CAIDA);
          campo.value = pregunta; cuenta.textContent = pregunta.length + "/" + MAX;
        }
      }).catch(function (err) {
        pensando.remove();
        st.turnos.pop();
        error(mensajeDeError(err));
        campo.value = pregunta; cuenta.textContent = pregunta.length + "/" + MAX;
      }).then(function () {
        ocupado = false; guardar(per, st); pintarQuedan();
        if (!campo.disabled) campo.focus();
      });
    }

    pintar();
    return { raiz: caja, limpiar: function () { st = { turnos: [], quedan: st.quedan }; guardar(per, st); pintar(); } };
  }

  window.SG.NEBULA_CHAT = { montar: montar };
})();
