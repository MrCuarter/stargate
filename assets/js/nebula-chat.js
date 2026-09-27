/*
 * STARGATE · «NEBULA RESPONDE» · el chat de dudas del alumnado, SIN API de IA (27-sep-2026).
 *
 * Norberto: «una gran batería de preguntas típicas (dónde registro, cómo compro, etc.). Si no sabes la respuesta, dices
 * que debes consultar con el Comandante y que le responderás en cuanto sepas la respuesta (menos de una hora)».
 *
 *   SG.NEBULA_CHAT.montar(contenedor, { per, fichaId, alias })  → pinta el chat (contenedor = elemento o id)
 *   SG.NEBULA_CHAT.buscar(texto)      → [{ id, puntos }] (las mejores, de más a menos)
 *   SG.NEBULA_CHAT.decidir(texto)     → { tipo: 'respuesta'|'dudas'|'nada', ids: [...] }
 *   SG.NEBULA_CHAT.pendientes(per)    → Promise<n>: respuestas del Mando aún no vistas (para el aviso del botón)
 *
 * La batería vive en assets/js/nebula-faq.js (window.SG_NEBULA_FAQ); si la página no la ha cargado, se pide sola.
 * Lo que no está en la batería va al buzón del Mando (stargate_buzon, tipo 'recluta') SOLO si el recluta pulsa
 * «Enviar mi duda»; la respuesta vuelve aquí, en «Tus dudas al Comandante». Si el envío falla, la duda se guarda y se
 * reintenta al volver a abrir (no se pierde). La conversación del día, en sessionStorage.
 */
(function () {
  "use strict";
  var W = typeof window !== "undefined" ? window : globalThis;
  W.SG = W.SG || {};

  var IMG = "assets/img/personajes/nebula.png";
  var MAX = 500;
  var HORARIO = "de 8 a 22 h";
  var FRECUENTES = ["reto_registrar", "enlace_abre", "comprar", "no_presente", "evaluacion", "examen"];
  var NOMBRE_IR = { nave: "Ir a Mi nave", retos: "Ir a Retos", ruta: "Ir a la Ruta", simulador: "Ir al Simulador de Joran",
    botin: "Ir a tu Botín", "botin:cromos": "Ir a tus cromos", "botin:heroes": "Ir a tus héroes", "botin:insignias": "Ir a tus insignias",
    mercado: "Ir al Bazar", zoco: "Ir al Zoco", archivo: "Ir al Archivo", rankings: "Ir a Rankings", envivo: "Ir a En vivo" };

  // ═══════════════════════════════════ EL BUSCADOR (sin dependencias) ═══════════════════════════════════
  var VACIAS = ("a al algo algun alguna ante asi aqui cada como con cual cuales de del donde desde el ella ello en entre " +
    "era es esa ese eso esta este esto estoy estan esta ha han has hay he hola la las le les lo los me mi mis muy mas " +
    "no nos o os para pero por porque puedo puede pueden q que quien se ser si sin sobre su sus tambien te " +
    "tengo tiene tienen ti tu tus un una uno unos unas y ya yo gracias oye porfa favor saber quiero " +
    "sale me dice decir va voy vas cosa cosas eh pues bueno sea algo alguien todo toda todos todas mundo vea").split(" ");
  var VACIA = {}; VACIAS.forEach(function (w) { VACIA[w] = 1; });
  // las que casi no pesan, pero distinguen («cuándo» / «cuánto»)
  var LIGERAS = { cuando: 0.35, cuanto: 0.35, cuanta: 0.35, cuantos: 0.35, cuantas: 0.35, donde: 0.25, dnd: 0.25 };
  // grupos de sinónimos: todas las formas se reducen a la raíz de la primera
  var SINONIMOS = [
    ["comprar", "canjear", "gastar", "pagar", "adquirir", "compra", "canje", "gasto"],
    ["registrar", "entregar", "subir", "enviar", "mandar", "colgar", "registro", "entrega"],
    ["xp", "experiencia", "exp", "puntos", "puntuacion"],
    ["creditos", "monedas", "credito", "moneda", "pasta", "dinero", "◈"],
    ["comandante", "docente", "profesor", "profe", "profesora", "tutor", "tutora", "maestro"],
    ["recluta", "alumno", "alumna", "estudiante"],
    ["reto", "mision", "desafio", "tarea"],
    ["enlace", "link", "url", "vinculo"],
    ["mercado", "tienda", "bazar"],
    ["cromos", "cartas", "carta", "cromo", "estampas"],
    ["examen", "examenes"],
    ["nota", "calificacion", "puntua", "notas", "evaluar"],
    ["alistarse", "alistar", "apuntar", "inscribir", "darme", "alta", "unirme"],
    ["entrar", "acceder", "login", "loguear", "conectar"],
    ["ver", "veo", "encuentro", "encontrar", "aparece", "sale", "salen"],
    ["zoco", "trueque", "intercambiar", "cambiar"],
    ["bitacora", "eportfolio", "portfolio", "portafolio"],
    ["sorteo", "rifa", "loteria"],
    ["ranking", "rankings", "clasificacion", "tablero"],
    ["presente", "fichaje", "fichado", "asistir"],
    ["congelado", "colgado", "bloqueado", "pillado", "trabado"],
    ["video", "videos", "grabacion", "grabada", "grabado"]
  ];
  var CANON = {};

  function sinTildes(s) {
    return String(s || "").toLowerCase().replace(/◈/g, " creditos ").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/ñ/g, "n");
  }
  function palabras(s) {
    return sinTildes(s).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  }
  // raíz ligera del español: basta con que «gasto/gastar/gastas» o «registro/registrar» caigan juntas
  var FINALES = ["aciones", "amientos", "imientos", "amiento", "imiento", "acion", "aciones", "amente", "mente", "ando",
    "iendo", "ados", "adas", "idos", "idas", "ado", "ada", "ido", "ida", "aran", "eran", "iran", "ar", "er", "ir",
    "as", "es", "os", "an", "en", "o", "a", "e", "s"];
  function raiz(w) {
    if (w.length <= 3 || /^\d+$/.test(w)) return w;
    for (var i = 0; i < FINALES.length; i++) {
      var f = FINALES[i];
      if (w.length - f.length >= 3 && w.slice(-f.length) === f) return w.slice(0, -f.length);
    }
    return w;
  }
  SINONIMOS.forEach(function (g) {
    var c = raiz(palabras(g[0])[0] || g[0]);
    g.forEach(function (w) { palabras(w).forEach(function (x) { CANON[raiz(x)] = c; CANON[x] = c; }); });
  });
  function canon(w) { var r = raiz(w); return CANON[w] || CANON[r] || r; }
  /** texto → [{ r: raíz canónica, w: palabra, peso }] (sin palabras vacías) */
  function fichas(s) {
    var out = [];
    palabras(s).forEach(function (w) {
      if (LIGERAS[w]) { out.push({ r: w === "dnd" ? "donde" : w, w: w, peso: LIGERAS[w] }); return; }
      if (VACIA[w]) return;
      out.push({ r: canon(w), w: w, peso: 1 });
    });
    return out;
  }
  // distancia de edición con transposición (una errata = 1)
  function dist1(a, b) {
    if (a === b) return 0;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return 9;
    var d = [], i, j;
    for (i = 0; i <= la; i++) { d[i] = [i]; }
    for (j = 0; j <= lb; j++) d[0][j] = j;
    for (i = 1; i <= la; i++) for (j = 1; j <= lb; j++) {
      var c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[la][lb];
  }

  var IDX = null, IDX_DE = null;
  function faq() { return Array.isArray(W.SG_NEBULA_FAQ) ? W.SG_NEBULA_FAQ : []; }
  function indice() {
    var F = faq();
    if (IDX && IDX_DE === F) return IDX;
    var df = {}, vocab = {}, docs = F.map(function (e) {
      var cl = {}, pt = {}, frases = [];
      (e.claves || []).forEach(function (k) { fichas(k).forEach(function (t) { cl[t.r] = 1; vocab[t.w] = t.r; }); });
      (e.p || []).forEach(function (p) {
        var t = fichas(p);
        t.forEach(function (x) { pt[x.r] = 1; vocab[x.w] = x.r; });
        frases.push(t.map(function (x) { return x.r; }));
      });
      var todas = {}; Object.keys(cl).concat(Object.keys(pt)).forEach(function (r) { todas[r] = 1; });
      Object.keys(todas).forEach(function (r) { df[r] = (df[r] || 0) + 1; });
      return { e: e, cl: cl, pt: pt, frases: frases };
    });
    IDX = { docs: docs, df: df, vocab: vocab, n: Math.max(1, docs.length) };
    IDX_DE = F;
    return IDX;
  }
  function idf(r) { var I = indice(); return Math.log(1 + I.n / (I.df[r] || 0.5)); }
  /** Lo escrito, en fichas; las palabras largas que no conoce se corrigen si están a una errata de una que sí (y pesan menos). */
  function consulta(texto) {
    var I = indice();
    return fichas(texto).map(function (t) {
      if (I.df[t.r] || t.w.length < 5 || t.peso < 1) return t;
      var mejor = null;
      for (var f in I.vocab) { if (f.length >= 4 && dist1(t.w, f) <= 1) { mejor = I.vocab[f]; if (I.df[mejor]) break; } }
      return mejor ? { r: mejor, w: t.w, peso: 1, errata: true } : t;
    });
  }

  /** Puntúa cada entrada contra el texto. → [{ id, puntos, cobertura }] ordenado (solo > 0), como mucho 8 */
  function buscar(texto) {
    var I = indice(), q = consulta(texto);
    if (!q.length) return [];
    var fuertes = q.filter(function (t) { return t.peso === 1; }).length || 1;
    var qr = q.map(function (t) { return t.r; });
    var out = I.docs.map(function (d) {
      var s = 0, tocadas = 0, vistas = {};
      q.forEach(function (t) {
        if (vistas[t.r]) return; vistas[t.r] = 1;
        var m = d.cl[t.r] ? 3 : d.pt[t.r] ? 1.5 : 0;
        if (!m) return;
        var f = t.errata ? 0.8 : 1;
        s += m * idf(t.r) * t.peso * f;
        if (t.peso === 1) tocadas += t.errata ? 0.5 : 1;
      });
      if (!s) return { id: d.e.id, puntos: 0, cobertura: 0 };
      // frases completas: una forma de la pregunta entera dentro de lo escrito (y más, si es justo eso)
      var bonus = 0;
      d.frases.forEach(function (f) {
        if (!f.length) return;
        var dentro = f.filter(function (r) { return qr.indexOf(r) >= 0; }).length;
        if (dentro === f.length && qr.length === f.length) bonus = Math.max(bonus, 4 + 2 * f.length);
        else if (dentro === f.length && f.length >= 2) bonus = Math.max(bonus, 2 + f.length);
        else if (f.length >= 2 && dentro >= 2) bonus = Math.max(bonus, dentro * 0.8);
      });
      var cobertura = Math.min(1, tocadas / fuertes);
      return { id: d.e.id, puntos: Math.round((s + bonus) * (0.35 + 0.65 * cobertura) * 100) / 100, cobertura: cobertura };
    }).filter(function (x) { return x.puntos > 0; });
    out.sort(function (a, b) { return b.puntos - a.puntos; });
    return out.slice(0, 8);
  }
  var UMBRAL = 6, COBERTURA = 0.5, PARECIDA = 0.85;
  /** La decisión: responder, preguntar «¿Te refieres a…?» o pasar la duda al Comandante. */
  function decidir(texto) {
    var r = buscar(texto);
    if (!r.length || r[0].puntos < UMBRAL || r[0].cobertura < COBERTURA) return { tipo: "nada", ids: r.slice(0, 3).map(function (x) { return x.id; }) };
    var cerca = r.filter(function (x, i) { return i > 0 && x.puntos >= r[0].puntos * PARECIDA; });
    if (cerca.length) return { tipo: "dudas", ids: [r[0].id].concat(cerca.slice(0, 2).map(function (x) { return x.id; })) };
    return { tipo: "respuesta", ids: [r[0].id] };
  }
  function entrada(id) { var F = faq(); for (var i = 0; i < F.length; i++) if (F[i].id === id) return F[i]; return null; }

  // ═══════════════════════════════════ LA BATERÍA, SI LA PÁGINA NO LA HA CARGADO ═══════════════════════════════════
  var SRC_FAQ = (function () {
    try {
      var s = document.currentScript && document.currentScript.src;
      if (s && /nebula-chat\.js/.test(s)) return s.replace("nebula-chat.js", "nebula-faq.js");
    } catch (e) { /* fuera del navegador */ }
    return "assets/js/nebula-faq.js";
  })();
  var cargandoFaq = null;
  function conFaq() {
    if (faq().length) return Promise.resolve(true);
    if (cargandoFaq) return cargandoFaq;
    cargandoFaq = new Promise(function (ok) {
      try {
        var s = document.createElement("script");
        s.src = SRC_FAQ; s.async = true;
        s.onload = function () { ok(faq().length > 0); };
        s.onerror = function () { cargandoFaq = null; ok(false); };
        document.head.appendChild(s);
      } catch (e) { ok(false); }
    });
    return cargandoFaq;
  }

  // ═══════════════════════════════════ EL MOTOR (buzón) ═══════════════════════════════════
  function motor(ms) {
    return new Promise(function (ok) {
      function listo() { return W.SG.MOTOR && W.SG.MOTOR.buzonEnviar ? W.SG.MOTOR : null; }
      if (listo()) return ok(listo());
      var hecho = false;
      function mira() { if (!hecho && listo()) { hecho = true; ok(listo()); } }
      try { W.addEventListener("sg:motor", mira); } catch (e) { /* sin eventos */ }
      var t = setInterval(function () { mira(); if (hecho) clearInterval(t); }, 300);
      setTimeout(function () { clearInterval(t); if (!hecho) { hecho = true; ok(null); } }, ms || 12000);
    });
  }
  function respuestasMando(m) { return (m.respuestas || []).filter(function (x) { return x && (x.de === "mando" || x.de === "docente") && x.texto; }); }
  function misDudas(per) {
    return motor().then(function (M) {
      if (!M || !M.buzonMios) return null;
      return M.buzonMios().then(function (l) {
        return (l || []).filter(function (m) { return m && m.tipo === "recluta" && m.projectId === per; });
      });
    });
  }
  function pendientes(per) {
    return misDudas(per).then(function (l) {
      return (l || []).filter(function (m) { return m.visto === false && respuestasMando(m).length; }).length;
    }).catch(function () { return 0; });
  }

  // ═══════════════════════════════════ LA INTERFAZ ═══════════════════════════════════
  var CSS = [
    ".nbc{--nbc-fondo:#101a28;--nbc-borde:#1c2c40;--nbc-cian:#37e0ec;--nbc-texto:#e9f0f6;--nbc-apagado:#9fb2c2;",
    "box-sizing:border-box;width:100%;max-width:100%;background:var(--nbc-fondo);border:1px solid var(--nbc-borde);border-radius:14px;",
    "color:var(--nbc-texto);font-size:15px;line-height:1.45;display:flex;flex-direction:column;overflow:hidden}",
    ".nbc *{box-sizing:border-box}",
    ".nbc a{color:var(--nbc-cian);text-decoration:underline;overflow-wrap:anywhere}",
    ".nbc-cab{display:flex;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid var(--nbc-borde)}",
    ".nbc-cab img{width:52px;height:52px;border-radius:50%;object-fit:cover;flex:none;border:2px solid var(--nbc-cian);background:#0b131e}",
    ".nbc-cab h3{margin:0;font-size:17px;color:var(--nbc-cian);letter-spacing:.04em}",
    ".nbc-cab p{margin:2px 0 0;font-size:13px;color:var(--nbc-apagado)}",
    ".nbc-mias{border-bottom:1px solid var(--nbc-borde);padding:0 16px}",
    ".nbc-mias>summary{cursor:pointer;padding:10px 0;font-size:14px;font-weight:700;color:var(--nbc-texto);list-style-position:inside}",
    ".nbc-mias>summary:focus-visible{outline:2px solid var(--nbc-cian);outline-offset:2px}",
    ".nbc-nueva{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:99px;background:var(--nbc-cian);color:#06222a;font-size:12px;font-weight:700}",
    ".nbc-mias ul{list-style:none;margin:0 0 12px;padding:0;display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto}",
    ".nbc-duda{background:#0b131e;border:1px solid var(--nbc-borde);border-radius:10px;padding:8px 10px;font-size:14px}",
    ".nbc-duda q{display:block;quotes:none;white-space:pre-wrap;overflow-wrap:anywhere}",
    ".nbc-est{display:inline-block;margin-top:4px;font-size:12px;font-weight:700;padding:1px 8px;border-radius:99px;border:1px solid #3a4d63;color:var(--nbc-apagado)}",
    ".nbc-est.si{border-color:#1b6b58;color:#7fe7c4}",
    ".nbc-resp{margin-top:6px;padding:6px 8px;border-left:3px solid var(--nbc-cian);background:#0c2530;white-space:pre-wrap;overflow-wrap:anywhere}",
    ".nbc-resp b{display:block;font-size:12px;color:var(--nbc-cian)}",
    ".nbc-log{padding:14px 16px;display:flex;flex-direction:column;gap:10px;max-height:420px;min-height:120px;overflow-y:auto;overflow-x:hidden}",
    ".nbc-b{max-width:88%;padding:9px 12px;border-radius:12px;overflow-wrap:anywhere;word-break:break-word}",
    ".nbc-b.yo{align-self:flex-end;background:#16324a;border:1px solid #21507a;border-bottom-right-radius:4px;white-space:pre-wrap}",
    ".nbc-b.nebula{align-self:flex-start;background:#0c2530;border:1px solid #1b4b58;border-bottom-left-radius:4px}",
    ".nbc-b.nebula>b.nbc-quien{display:block;font-size:12px;color:var(--nbc-cian);letter-spacing:.05em;margin-bottom:2px}",
    ".nbc-b.error{align-self:stretch;max-width:100%;background:#2a1a1a;border:1px solid #5a2e2e;color:#f3d6d6;font-size:14px}",
    ".nbc-acc{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center}",
    ".nbc-acc span{font-size:13px;color:var(--nbc-apagado)}",
    ".nbc-btn{min-height:36px;padding:6px 12px;border-radius:99px;border:1px solid var(--nbc-cian);background:transparent;color:var(--nbc-cian);",
    "font:inherit;font-size:14px;cursor:pointer;text-align:left}",
    ".nbc-btn.lleno{background:var(--nbc-cian);color:#06222a;font-weight:700}",
    ".nbc-btn:disabled{opacity:.5;cursor:default}",
    ".nbc-btn:focus-visible{outline:2px solid var(--nbc-texto);outline-offset:2px}",
    ".nbc-pie{border-top:1px solid var(--nbc-borde);padding:12px 16px 14px}",
    ".nbc-form{display:flex;gap:8px;align-items:flex-end}",
    ".nbc-form textarea{flex:1;min-width:0;resize:vertical;min-height:44px;max-height:160px;background:#0b131e;color:var(--nbc-texto);",
    "border:1px solid var(--nbc-borde);border-radius:10px;padding:10px 12px;font:inherit;font-size:15px}",
    ".nbc-form textarea:focus{outline:2px solid var(--nbc-cian);outline-offset:1px;border-color:transparent}",
    ".nbc-form button{flex:none;min-height:44px;padding:0 16px;border-radius:10px;border:0;background:var(--nbc-cian);color:#06222a;",
    "font:inherit;font-size:15px;font-weight:700;cursor:pointer}",
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
  function boton(txt, cls, fn) {
    var b = el("button", "nbc-btn" + (cls ? " " + cls : ""), txt);
    b.type = "button"; b.addEventListener("click", fn);
    return b;
  }
  function hoy() {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function horaMadrid() {
    try { return Number(new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "numeric", hour12: false }).format(new Date())); }
    catch (e) { return new Date().getHours(); }
  }
  function fuera() { var h = horaMadrid(); return h < 8 || h >= 22; }
  function fechaCorta(ms) {
    try { return new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(ms)); }
    catch (e) { return ""; }
  }

  // ── almacenamiento (con try: en privado o bloqueado, el chat funciona igual)
  function claveDia(per) { return "sg-nebula-chat:" + per + ":" + hoy(); }
  function claveCola(per) { return "sg-nebula-cola:" + per; }
  function leer(per) {
    try {
      var d = JSON.parse(sessionStorage.getItem(claveDia(per)) || "null");
      if (d && Array.isArray(d.turnos)) return d.turnos.filter(function (x) { return x && (x.r === "yo" || x.r === "nebula"); });
    } catch (e) { /* nada guardado */ }
    return [];
  }
  function guardar(per, turnos) { try { sessionStorage.setItem(claveDia(per), JSON.stringify({ turnos: turnos.slice(-60) })); } catch (e) { /* sin almacenamiento */ } }
  function leerCola(per) { try { var c = JSON.parse(localStorage.getItem(claveCola(per)) || "[]"); return Array.isArray(c) ? c : []; } catch (e) { return []; } }
  function guardarCola(per, c) { try { if (c.length) localStorage.setItem(claveCola(per), JSON.stringify(c.slice(-10))); else localStorage.removeItem(claveCola(per)); } catch (e) { /* sin almacenamiento */ } }

  var TXT_NADA = "Eso no lo tengo en mis registros. Se lo consulto a tu Comandante y te respondo aquí en menos de una hora (" + HORARIO + ").";

  function montar(contenedor, opciones) {
    var raiz = typeof contenedor === "string" ? document.getElementById(contenedor) : contenedor;
    var o = opciones || {}, per = o.per;
    if (!raiz || !per) return null;
    estilos();
    var turnos = leer(per), ultimoRefresco = 0, vistasEnviadas = {};

    raiz.innerHTML = "";
    var caja = el("section", "nbc");
    caja.setAttribute("aria-label", "NEBULA responde: dudas de STARGATE y de la asignatura");

    var cab = el("div", "nbc-cab");
    var img = el("img");
    img.src = IMG; img.alt = ""; img.width = 52; img.height = 52; img.loading = "lazy";
    var txt = el("div");
    txt.appendChild(el("h3", null, "NEBULA responde"));
    txt.appendChild(el("p", null, "Pregúntame cómo funciona STARGATE, tu Nave o la asignatura. Lo que no sepa, se lo consulto a tu Comandante."));
    cab.appendChild(img); cab.appendChild(txt);

    var mias = el("details", "nbc-mias");
    mias.hidden = true;
    var miasSum = el("summary");
    var miasLista = el("ul");
    mias.appendChild(miasSum); mias.appendChild(miasLista);
    mias.addEventListener("toggle", function () { if (mias.open) marcarVistas(); });

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
    var enviarB = el("button", null, "Preguntar");
    enviarB.type = "submit";
    form.appendChild(etiqueta); form.appendChild(campo); form.appendChild(enviarB);
    var info = el("div", "nbc-info");
    var estado = el("span", null, "");
    estado.setAttribute("aria-live", "polite");
    var cuenta = el("span", null, "0/" + MAX);
    info.appendChild(estado); info.appendChild(cuenta);
    pie.appendChild(form); pie.appendChild(info);

    caja.appendChild(cab); caja.appendChild(mias); caja.appendChild(log); caja.appendChild(pie);
    raiz.appendChild(caja);

    // ── las burbujas (se repintan desde `turnos`, así que la conversación guardada vuelve igual)
    function bNebula() {
      var b = el("div", "nbc-b nebula");
      b.appendChild(el("b", "nbc-quien", "NEBULA"));
      return b;
    }
    function cuerpo(b, html) { var d = el("div"); d.innerHTML = html; b.appendChild(d); return d; }   // solo textos de nebula-faq.js
    function texto(b, t) { var d = el("div"); d.textContent = t; b.appendChild(d); return d; }
    function irA(ir) {
      try { location.hash = "#" + ir; } catch (e) { /* sin navegación */ }
      var panel = caja.closest && caja.closest(".neb-ayuda");
      var x = panel && panel.querySelector(".neb-ayuda-x");
      if (x) x.click();
    }
    function bienvenida() {
      var b = bNebula();
      texto(b, "Hola, recluta. Pregúntame lo que quieras de la Nave o de la asignatura. Lo que más me preguntan:");
      var acc = el("div", "nbc-acc");
      FRECUENTES.forEach(function (id) {
        var e = entrada(id); if (!e) return;
        acc.appendChild(boton(e.p[0].charAt(0).toUpperCase() + e.p[0].slice(1) + "?", null, function () { preguntar(e.p[0].charAt(0).toUpperCase() + e.p[0].slice(1) + "?", id); }));
      });
      b.appendChild(acc);
      return b;
    }
    function burbuja(x, i) {
      if (x.r === "yo") {
        var y = el("div", "nbc-b yo");
        y.appendChild(el("span", "nbc-sr", "Tú: "));
        y.appendChild(document.createTextNode(x.t));
        return y;
      }
      var b = bNebula(), acc;
      if (x.k === "faq") {
        var e = entrada(x.id);
        if (!e) { texto(b, "Esa respuesta ya no está en mis registros."); return b; }
        cuerpo(b, e.r);
        acc = el("div", "nbc-acc");
        if (e.ir) acc.appendChild(boton(NOMBRE_IR[e.ir] || "Ir a " + e.ir, "lleno", function () { irA(e.ir); }));
        b.appendChild(acc);
        var util = el("div", "nbc-acc");
        if (x.util === "si") util.appendChild(el("span", null, "Me alegro, recluta."));
        else if (x.util === "no") util.appendChild(el("span", null, "Duda enviada a tu Comandante."));
        else {
          util.appendChild(el("span", null, "¿Te ha servido?"));
          util.appendChild(boton("Sí", null, function () { x.util = "si"; guardar(per, turnos); pintar(); }));
          util.appendChild(boton("No, pregúntaselo al Comandante", null, function () {
            enviarDuda(x.q || "", [x.id], function (okEnv) { if (okEnv) { x.util = "no"; guardar(per, turnos); pintar(); } });
          }));
        }
        b.appendChild(util);
      } else if (x.k === "dudas") {
        texto(b, "¿Te refieres a…?");
        acc = el("div", "nbc-acc");
        (x.ids || []).forEach(function (id) {
          var e = entrada(id); if (!e) return;
          acc.appendChild(boton(e.p[0].charAt(0).toUpperCase() + e.p[0].slice(1) + "?", null, function () { responder(id, x.q); }));
        });
        acc.appendChild(boton("Ninguna: pregúntaselo al Comandante", null, function () { nada(x.q, x.ids); }));
        b.appendChild(acc);
      } else if (x.k === "nada") {
        texto(b, TXT_NADA + (fuera() && !x.enviada ? " Ahora es fuera de horario: te respondo a partir de las 8." : ""));
        acc = el("div", "nbc-acc");
        if (x.enviada) acc.appendChild(el("span", null, "Enviada. La respuesta saldrá aquí, en «Tus dudas al Comandante»."));
        else if (x.cola) {
          acc.appendChild(el("span", null, "No he podido enviarla aún: la guardo y lo reintento al volver a abrir."));
          acc.appendChild(boton("Reintentar ahora", null, function () { vaciarCola(true); }));
        } else {
          var bEnv = boton("Enviar mi duda", "lleno", function () {
            bEnv.disabled = true;
            enviarDuda(x.q, x.ids || [], function (okEnv) { if (okEnv) x.enviada = true; else x.cola = true; guardar(per, turnos); pintar(); });
          });
          acc.appendChild(bEnv);
        }
        b.appendChild(acc);
      } else if (x.k === "error") {
        b.className = "nbc-b error"; texto(b, x.t || "");
      } else texto(b, x.t || "");
      return b;
    }
    function pintar() {
      log.innerHTML = "";
      log.appendChild(bienvenida());
      turnos.forEach(function (x, i) { log.appendChild(burbuja(x, i)); });
      log.scrollTop = log.scrollHeight;
    }
    function empujar(t) { turnos.push(t); guardar(per, turnos); pintar(); }

    // ── el recorrido de una pregunta
    function responder(id, q) { empujar({ r: "nebula", k: "faq", id: id, q: q || "" }); }
    function nada(q, ids) { empujar({ r: "nebula", k: "nada", q: q, ids: (ids || []).slice(0, 3) }); }
    function preguntar(q, idDirecto) {
      q = String(q || "").replace(/\s+/g, " ").trim();
      if (!q) return;
      turnos.push({ r: "yo", t: q });
      conFaq().then(function () {
        if (idDirecto && entrada(idDirecto)) return responder(idDirecto, q);
        // un saludo o un «gracias» no es una duda: no se ofrece mandarlo al Comandante
        if (!fichas(q).some(function (t) { return t.peso === 1; })) {
          return empujar({ r: "nebula", k: "texto", t: /gracias|genial|perfecto|vale|ok/i.test(q)
            ? "A mandar, recluta. Aquí estoy para lo que necesites."
            : "Aquí estoy, recluta. Escríbeme tu duda con alguna palabra clave (reto, enlace, créditos, examen…) o elige una de las preguntas de arriba." });
        }
        var d = decidir(q);
        if (d.tipo === "respuesta") responder(d.ids[0], q);
        else if (d.tipo === "dudas") empujar({ r: "nebula", k: "dudas", ids: d.ids, q: q });
        else nada(q, d.ids);
      });
    }

    // ── el buzón: enviar (solo al pulsar), la cola si falla, y «Tus dudas al Comandante»
    function enviarDuda(q, ids, fin) {
      q = String(q || "").trim();
      if (!q) { fin(false); return; }
      estado.textContent = "Enviando tu duda…";
      var carta = { projectId: per, tipo: "recluta", urgente: false, texto: q,
        contexto: { fichaId: o.fichaId || "", alias: o.alias || "", origen: "nebula", faq: (ids || []).slice(0, 3) } };
      motor().then(function (M) {
        if (!M) throw new Error("sin motor");
        return M.buzonEnviar(carta);
      }).then(function () {
        estado.textContent = "Duda enviada. Te respondo aquí en menos de una hora (" + HORARIO + ").";
        fin(true); refrescar(true);
      }).catch(function () {
        var c = leerCola(per); c.push(carta); guardarCola(per, c);
        estado.textContent = "No he podido enviarla ahora. La guardo y la reintento al volver a abrir el chat.";
        fin(false);
      });
    }
    function vaciarCola(avisar) {
      var c = leerCola(per);
      if (!c.length) return Promise.resolve();
      return motor().then(function (M) {
        if (!M) throw new Error("sin motor");
        var quedan = [];
        return c.reduce(function (p, carta) {
          return p.then(function () { return M.buzonEnviar(carta).catch(function () { quedan.push(carta); }); });
        }, Promise.resolve()).then(function () {
          guardarCola(per, quedan);
          if (!quedan.length) {
            turnos.forEach(function (x) { if (x.k === "nada" && x.cola) { x.cola = false; x.enviada = true; } });
            guardar(per, turnos); pintar();
            if (avisar) estado.textContent = "Listo: tus dudas guardadas ya han llegado al Comandante.";
          } else if (avisar) estado.textContent = "Sigo sin poder enviarlas. Lo reintento más tarde.";
        });
      }).catch(function () { if (avisar) estado.textContent = "Sigo sin poder enviarlas. Lo reintento más tarde."; });
    }
    var dudas = [];
    function pintarMias() {
      miasLista.innerHTML = "";
      if (!dudas.length) { mias.hidden = true; return; }
      mias.hidden = false;
      var nuevas = dudas.filter(function (m) { return m.visto === false && respuestasMando(m).length; }).length;
      miasSum.textContent = "Tus dudas al Comandante (" + dudas.length + ")";
      if (nuevas) miasSum.appendChild(el("span", "nbc-nueva", nuevas === 1 ? "1 respuesta nueva" : nuevas + " respuestas nuevas"));
      dudas.forEach(function (m) {
        var li = el("li", "nbc-duda"), rs = respuestasMando(m);
        li.appendChild(el("q", null, m.texto || ""));
        var est = el("span", "nbc-est" + (rs.length ? " si" : ""), rs.length ? "Respondida" : "Pendiente");
        li.appendChild(est);
        if (m.creado) li.appendChild(document.createTextNode(" " + fechaCorta(m.creado)));
        rs.forEach(function (r) {
          var d = el("div", "nbc-resp");
          d.appendChild(el("b", null, "Tu Comandante" + (r.fecha ? " · " + fechaCorta(r.fecha) : "")));
          d.appendChild(document.createTextNode(r.texto));
          li.appendChild(d);
        });
        miasLista.appendChild(li);
      });
      if (nuevas) mias.open = true;
      if (mias.open) marcarVistas();
    }
    function visible() { try { return caja.offsetParent !== null && !caja.closest("[hidden]"); } catch (e) { return true; } }
    function marcarVistas() {
      if (!visible()) return;
      var M = W.SG.MOTOR;
      if (!M || !M.buzonVisto) return;
      dudas.forEach(function (m) {
        if (m.visto === false && respuestasMando(m).length && !vistasEnviadas[m.id]) {
          vistasEnviadas[m.id] = 1; M.buzonVisto(m.id); m.visto = true;
        }
      });
    }
    function refrescar(forzar) {
      if (!forzar && Date.now() - ultimoRefresco < 15000) return Promise.resolve();
      ultimoRefresco = Date.now();
      vaciarCola(false);
      return misDudas(per).then(function (l) { if (l) { dudas = l; pintarMias(); } }).catch(function () { /* sin buzón */ });
    }

    campo.addEventListener("input", function () { cuenta.textContent = campo.value.length + "/" + MAX; });
    campo.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (form.requestSubmit) form.requestSubmit(); else alEnviar(e); }
    });
    form.addEventListener("submit", alEnviar);
    function alEnviar(e) {
      if (e && e.preventDefault) e.preventDefault();
      var q = campo.value.replace(/\s+/g, " ").trim();
      if (!q) { campo.focus(); return; }
      campo.value = ""; cuenta.textContent = "0/" + MAX;
      preguntar(q.slice(0, MAX));
      campo.focus();
    }

    // al abrirse (el panel pasa de oculto a visible), se refresca solo
    try {
      if ("IntersectionObserver" in W) {
        new IntersectionObserver(function (ent) { if (ent.some(function (x) { return x.isIntersecting; })) refrescar(false); }).observe(caja);
      }
      W.addEventListener("focus", function () { if (visible()) refrescar(false); });
    } catch (e) { /* sin observadores */ }

    conFaq().then(pintar);
    pintar();
    refrescar(true);
    return { raiz: caja, refrescar: function () { return refrescar(true); },
      limpiar: function () { turnos = []; guardar(per, turnos); pintar(); } };
  }

  W.SG.NEBULA_CHAT = { montar: montar, buscar: buscar, decidir: decidir, pendientes: pendientes,
    _norm: fichas, _umbral: UMBRAL };
})();
