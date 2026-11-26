/*
 * STARGATE · EL AVISO DE RESPUESTAS (1-oct-2026) · assets/js/aviso-buzon.js
 *
 * Norberto: «Cuando contestas a los profesores, ¿cómo saben ellos que les has respondido? Necesito algo llamativo: que cuando
 * tengan mensajes, nada más entrar se les abra una ventana o algo que no puedan pasar por alto. Además, junto con la respuesta,
 * un botón de ¿He resuelto la pregunta? ¿Necesitas algo más? Así analizamos la utilidad del buzón». Hasta hoy, una respuesta era
 * un numerito en «¿Dudas? ¿Algo falla?» y un correo: Caridad no vio la suya en un día.
 *
 * Lo pone la construcción (_build_site.py → AVISO_EN) en las páginas del docente: la consola, la Academia, Gestionar grupos,
 * Profesores y Crear un grupo. Nunca en lo que se proyecta (la sesión, el aula, la presentación), ni incrustado, ni en la consola
 * de ensayo, ni a un recluta (lo suyo le llega a su chat de NEBULA).
 *  - Del buzón (stargate_buzon): lo que el Mando o NEBULA le ha contestado y aún no ha leído (`visto === false`; lo ya abierto en
 *    el buzón de este navegador, `sgBzVistos`, no cuenta: la misma cuenta que la burbuja de la consola). Si el mensaje quedó
 *    «resuelto»: «¿Te ha resuelto la duda?» → «Sí» (una respuesta suya, «✓ Me ha resuelto la duda.», y se cierra) o «Necesito
 *    algo más» (escribe qué le falta; el mensaje vuelve a la guardia, que lo contesta en menos de 24 horas). Si quedó en marcha o anotado:
 *    «Entendido» o «Contestar».
 *  - De la Academia (stargate_formacion): lo que NEBULA o el Alto Mando le escribieron allí después de lo último que leyó en
 *    este navegador (`sgAcademia.claudeVisto`, la misma marca que la píldora) y en los últimos 7 días. «Entendido» o «Contestar».
 * La ventana vuelve a salir en cada visita hasta que conteste o pulse «Entendido»; la × la cierra solo en esta pestaña.
 * Las frases de la valoración son de motor.js (BUZON_VALORA): la guardia las cuenta con `buzon.cjs utilidad`.
 *
 * 25-nov · TAMBIÉN AL RECLUTA, en su Nave (recluta.html). Norberto: «sería interesante que siempre que NEBULA responda aparezca
 * un aviso y no se borrase hasta que se viera». Galán Carbajo no vio la respuesta de su matriz en Word: la Nave solo ponía un
 * numerito en el botón de NEBULA y el chat la daba por vista en cuanto se abría. En la Nave salen solo sus dudas de recluta, con
 * NEBULA de cara, y la ventana vuelve en cada visita hasta que pulse «Sí, resuelta», «Entendido» o conteste (la ×, solo en esta
 * pestaña). Todo sigue en NEBULA, en «Tus dudas al Comandante» (buzon.html es del profesorado: a un recluta no se le manda allí).
 *
 * 26-nov · LA VENTANA ES DEL MOTOR (GamificaPro sdk/avisoRespuestas.js → assets/js/avisoRespuestas.js, `GP.avisoRespuestas`, común
 * con DPG). Aquí queda lo de STARGATE: qué hay sin leer (el buzón y la Academia), quién contesta, los textos, lo que hace cada
 * botón con el motor y la piel (las clases sgav-… y sus estilos). Lo que se ve y cómo se comporta, igual que antes.
 */
(function () {
  "use strict";
  if (window.top !== window || window.SG_ENSAYO || /[?&](embed|demo)=1(&|$)/.test(location.search)) return;
  var RECLUTA = window.SG_AVISO_RECLUTA === true || /(^|\/)recluta(\.html)?$/.test(location.pathname);
  var CERRADO = "sgAvisoCerrado", ACD = "sgAcademia.claudeVisto", SEMANA = 7 * 864e5;
  var M = null, ITEMS = [];
  function abierta() { return !!(window.GP && window.GP.avisoRespuestas && window.GP.avisoRespuestas.abierta()); }

  function cuando(ms) { try { return new Date(Number(ms)).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
  function leer(st, k, d) { try { var v = st.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function poner(st, k, v) { try { st.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function esperarMotor() {
    return new Promise(function (ok) {
      (function mira(i) {
        var m = window.SG && window.SG.MOTOR;
        if (m && m.buzonMios && m.sesion) return ok(m);
        if (i > 120) return ok(null);   // 30 s: sin motor (sin red, otro motor), no hay aviso
        setTimeout(function () { mira(i + 1); }, 250);
      })(0);
    });
  }

  /** Lo que tiene sin leer: [{ fuente: "buzon"|"academia", … }]. */
  function sinLeer() {
    return M.sesion().then(function (yo) {
      if (!yo) return [];
      return Promise.all([M.buzonMios().catch(function () { return []; }),
                          !RECLUTA && M.academiaMia ? M.academiaMia().catch(function () { return null; }) : null]).then(function (r) {
        var abiertos = leer(localStorage, "sgBzVistos", {}) || {}, cerrados = leer(sessionStorage, CERRADO, []) || [], out = [];
        (r[0] || []).forEach(function (m) {
          var rs = m.respuestas || [], ult = rs[rs.length - 1];
          if ((m.tipo === "recluta") !== RECLUTA || (m.contexto || {}).desde === "gamificapro") return;
          // al recluta le contesta NEBULA (la guardia) o su docente: las dos le salen en el chat (nebula-chat.js, respuestasMando)
          if (m.visto !== false || !ult || !(ult.de === "mando" || (RECLUTA && ult.de === "docente"))) return;
          if (rs.length <= Number(abiertos[m.id] || -1) || cerrados.indexOf(m.id) >= 0) return;
          out.push({ fuente: "buzon", id: m.id, m: m, r: ult, t: Number(ult.fecha) || Number(m.actualizado) || 0,
                     nebula: RECLUTA || m.projectId === (window.SG_PER_ACADEMIA || "academia-cero") });
        });
        var d = r[1];
        if (d) {
          var desde = Math.max(Number(leer(localStorage, ACD, 0)) || 0, Date.now() - SEMANA);
          [["claude", (d.claude || {}).mensajes], ["mando", (d.mando || {}).mensajes]].forEach(function (par) {
            var L = par[1] || {};
            Object.keys(L).forEach(function (k) {
              var x = L[k] || {}, t = Number(x.t) || Number(k) || 0, id = "acd:" + par[0] + ":" + k;
              if (t > desde && x.texto && cerrados.indexOf(id) < 0) out.push({ fuente: "academia", id: id, t: t, texto: x.texto, mando: par[0] === "mando", nebula: par[0] !== "mando" });
            });
          });
        }
        return out.sort(function (a, b) { return a.t - b.t; });
      });
    }).catch(function () { return []; });
  }

  /** La piel de STARGATE (la ventana es de GamificaPro: sdk/avisoRespuestas.js; aquí, sus clases y estos estilos). */
  function css() {
    if (document.getElementById("sgav-css")) return;
    var s = document.createElement("style"); s.id = "sgav-css";
    s.textContent =
      ".sgav-fondo{position:fixed;inset:0;z-index:10050;background:rgba(3,7,12,.78);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;animation:sgavIn .25s ease-out}" +
      "@keyframes sgavIn{from{opacity:0}to{opacity:1}}" +
      ".sgav{width:min(640px,100%);max-height:min(88vh,760px);display:flex;flex-direction:column;background:var(--panel,#101a28);border:2px solid var(--amber,#f5b043);border-radius:16px;box-shadow:0 0 0 6px rgba(245,176,67,.14),0 24px 60px rgba(0,0,0,.6);color:var(--ink,#e9f0f6);overflow:hidden}" +
      ".sgav-cab{display:flex;gap:12px;align-items:center;padding:14px 16px;background:linear-gradient(90deg,rgba(245,176,67,.18),rgba(55,224,236,.08));border-bottom:1px solid var(--line,#1c2c40)}" +
      ".sgav-cab img{width:44px;height:44px;border-radius:50%;object-fit:cover;flex:none;animation:sgavLatido 1.6s ease-in-out 3}" +
      "@keyframes sgavLatido{50%{transform:scale(1.12)}}" +
      ".sgav-eyebrow{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--amber,#f5b043);font-weight:700}" +
      ".sgav-cab h2{margin:2px 0 0;font-size:1.25rem;line-height:1.2}" +
      ".sgav-x{margin-left:auto;align-self:flex-start;background:none;border:0;color:var(--mut,#9fb2c2);font-size:1.6rem;line-height:1;cursor:pointer;padding:2px 6px}" +
      ".sgav-x:hover,.sgav-x:focus-visible{color:#fff}" +
      ".sgav-lista{overflow:auto;padding:4px 16px}" +
      ".sgav-m{padding:12px 0;border-bottom:1px solid var(--line,#1c2c40)}.sgav-m:last-child{border-bottom:0}" +
      ".sgav-tu{margin:0;font-size:.82rem;color:var(--mut,#9fb2c2)}" +
      ".sgav-cita{margin:4px 0 8px;padding:6px 10px;border-left:3px solid var(--line,#1c2c40);color:var(--mut,#9fb2c2);font-size:.9rem;font-style:italic}" +
      ".sgav-r{background:rgba(55,224,236,.07);border:1px solid rgba(55,224,236,.28);border-radius:12px;padding:10px 12px}" +
      ".sgav-quien{display:flex;align-items:center;gap:8px;font-weight:700;font-size:.9rem;color:var(--teal,#37e0ec)}" +
      ".sgav-quien img{width:22px;height:22px;border-radius:50%;object-fit:cover}.sgav-quien time{margin-left:auto;font-weight:400;font-size:.78rem;color:var(--mut,#9fb2c2)}" +
      ".sgav-r p{margin:6px 0 0;white-space:pre-wrap;line-height:1.45;font-size:.95rem}" +
      ".sgav-acc{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}" +
      ".sgav-q{font-weight:700;margin-right:4px}" +
      ".sgav .btn{padding:9px 14px;font-size:.88rem}" +
      ".sgav-escribe{margin-top:8px;display:flex;flex-direction:column;gap:8px}.sgav-escribe[hidden]{display:none}" +
      ".sgav-escribe textarea{width:100%;min-height:72px;resize:vertical;background:var(--bg2,#0d1420);color:var(--ink,#e9f0f6);border:1px solid var(--line,#1c2c40);border-radius:10px;padding:8px 10px;font:inherit}" +
      ".sgav-escribe .btn{align-self:flex-start}.sgav-escribe label{display:block}.sgav-escribe .gpav-botones{display:flex;flex-wrap:wrap;gap:8px;align-items:center}" +
      ".sgav-hecho{margin:8px 0 0;color:var(--teal,#37e0ec);font-weight:700}.sgav-error{color:var(--amber,#f5b043)}" +
      // 10-oct · lo resuelto se va de la ventana (no se borra: sigue en el buzón)
      ".sgav-m.sgav-fuera{opacity:0;max-height:0!important;padding-top:0;padding-bottom:0;margin:0;border-color:transparent;overflow:hidden;transition:opacity .3s,max-height .35s,padding .35s}" +
      ".sgav-pie{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 16px;border-top:1px solid var(--line,#1c2c40);font-size:.85rem;color:var(--mut,#9fb2c2)}" +
      "@media (max-width:560px){.sgav-fondo{align-items:flex-end;padding:0}.sgav{border-radius:16px 16px 0 0;max-height:92vh}.sgav-cab h2{font-size:1.08rem}}";
    document.head.appendChild(s);
  }
  var PIEL = { fondo: "sgav-fondo", caja: "sgav", cab: "sgav-cab", eti: "sgav-eyebrow", x: "sgav-x", lista: "sgav-lista", m: "sgav-m", tu: "sgav-tu",
               cita: "sgav-cita", r: "sgav-r", quien: "sgav-quien", acc: "sgav-acc", q: "sgav-q", escribe: "sgav-escribe", hecho: "sgav-hecho",
               error: "sgav-error", fuera: "sgav-fuera", pie: "sgav-pie" };

  function retrato(nebula) { return nebula ? "assets/img/personajes/nebula.png" : "assets/img/iconos/p/envivo.png"; }

  /** Lo de este navegador: lo leído en el buzón, con cuántas respuestas (la burbuja de la consola deja de contarlo), y la Academia. */
  function abierto(x, extra) {
    var a = leer(localStorage, "sgBzVistos", {}) || {}; a[x.id] = (x.m.respuestas || []).length + (extra || 0); poner(localStorage, "sgBzVistos", a);
  }
  function academiaLeida(x) { poner(localStorage, ACD, Math.max(Number(leer(localStorage, ACD, 0)) || 0, x.t)); }

  /** Lo que tiene sin leer, como lo pinta la ventana común. */
  function tarjeta(x) {
    var docente = x.fuente === "buzon" && RECLUTA && x.r.de === "docente";
    var quien = x.fuente === "academia" ? (x.mando ? "El Alto Mando" : "NEBULA") : docente ? "Tu Comandante" : (x.nebula ? "NEBULA" : "El Mando");
    x.quien = quien;
    x.retratoQuien = retrato((x.nebula && !docente) || (x.fuente === "academia" && !x.mando));
    if (x.fuente === "buzon") {
      x.tu = { titulo: "Tu mensaje", detalle: cuando(x.m.creado) + (x.m.grupo ? " · " + x.m.grupo : "") };
      x.citas = [x.m.texto]; x.texto = x.r.texto; x.resuelto = x.m.estado === "resuelto";
    } else { x.tu = { titulo: "En la Academia de la Cero" }; x.citas = []; x.resuelto = false; x.anotado = "Anotado."; }
    return x;
  }

  function pintar() {
    css();
    var V = M.BUZON_VALORA || {};
    var nebula = ITEMS.every(function (x) { return x.nebula || (x.fuente === "academia" && !x.mando); });
    window.GP.avisoRespuestas.abrir({
      items: ITEMS.map(tarjeta), pestana: CERRADO, clases: PIEL, btn: "btn", btnPrincipal: "btn primary", corte: 220, maxlength: 1900,
      eti: nebula ? "NEBULA te ha respondido" : "Frecuencia de mando", retrato: retrato(nebula),
      pie: RECLUTA
        ? { texto: "Tus dudas y sus respuestas, siempre en NEBULA: «Tus dudas al Comandante».", boton: { texto: "Abrir NEBULA", alPulsar: function () {
            // el chat de la Nave (recluta.js, ayudaNebula): sin dar nada por visto
            var b = document.getElementById("neb-ayuda-b"), cap = document.getElementById("neb-ayuda");
            if (b && (!cap || cap.hidden)) b.click();
          } } }
        : { texto: "Tus mensajes y respuestas, siempre en el buzón.", boton: { texto: "Ver todos mis mensajes", href: "buzon.html" } },
      textos: {
        gracias: RECLUTA ? "¡Gracias, recluta! Así sabemos que NEBULA te sirve." : "¡Gracias, Comandante! Nos ayuda a saber que el buzón sirve.",
        enviado: RECLUTA ? "Enviado. Te contestamos en NEBULA, en «Tus dudas al Comandante»." : "Enviado. Te contestamos aquí y por correo.",
        fallo: function (motivo) { return "No ha salido (" + motivo + "). " + (RECLUTA ? "Prueba desde NEBULA, en «Tus dudas al Comandante»." : "Prueba desde el <a href=\"buzon.html\">buzón</a>."); },
      },
      acciones: {
        si: function (x) {
          return M.buzonResponder(x.id, V.si || "✓ Me ha resuelto la duda.", { estado: "resuelto" })
            .then(function () { return M.buzonVisto(x.id); }).then(function () { abierto(x, 1); });
        },
        ok: function (x) {
          if (x.fuente === "academia") return academiaLeida(x);
          return M.buzonVisto(x.id).then(function () { abierto(x, 0); });
        },
        contestar: function (x) {
          if (x.fuente !== "academia") return false;
          academiaLeida(x); location.href = "buzon.html?desde=academia"; return true;
        },
        // «Necesito algo más» vuelve a la guardia (el mensaje pasa a «nuevo») con la frase delante: así se cuenta
        enviar: function (x, t, esMas) {
          return M.buzonResponder(x.id, (esMas ? (V.mas || "Necesito algo más: ") : "") + t, {})
            .then(function () { return M.buzonVisto(x.id); }).then(function () { abierto(x, 1); });
        },
      },
    });
  }

  function arrancar() {
    esperarMotor().then(function (m) {
      if (!m || !window.GP || !window.GP.avisoRespuestas) return;   // sin la ventana común (assets/js/avisoRespuestas.js), nada
      M = m;
      return sinLeer().then(function (L) { ITEMS = L; if (ITEMS.length && !abierta()) pintar(); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();
  // quien entra después de cargar la página («Entrar con Google»): se mira entonces
  document.addEventListener("sg:sesion", function (e) {
    if (!M || !e.detail || abierta() || ITEMS.length) return;
    sinLeer().then(function (L) { ITEMS = L; if (ITEMS.length && !abierta()) pintar(); });
  });
})();
