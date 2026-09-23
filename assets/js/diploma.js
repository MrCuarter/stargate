// STARGATE — EL DIPLOMA DE LA TRIPULACIÓN.  diploma.html?per=<grupo>
//
// Norberto (16-sep): «al finalizar la gamificación, un diploma con el alias del jugador, su nombre real, insignias
// completadas, porcentajes, etc… Un mensaje final del comandante y NEBULA, agradeciendo los servicios. Puede ser el
// broche de oro». Y eligió: se DESCARGA desde su Nave (nada de correos), con su nombre real y la firma de su Capitán.
//
// 🔴 Se dibuja en un <canvas> y no en HTML, por una razón muy concreta: lo que se ve es exactamente lo que se descarga.
// Un diploma que en pantalla queda bien y al guardarlo sale cortado (o con otra letra) no es un diploma, es un disgusto.
// Aquí el PNG que se baja es el mismo lienzo que está mirando, píxel a píxel, y además se puede imprimir.
//
// Todo sale de lo que YA tiene su ficha: nadie rellena nada y nadie puede ponerse un diploma que no es suyo (el nombre
// real vive en `privado/datos`, que solo leen esa persona y su equipo docente).
(function () {
  var app = document.getElementById("dp-app");
  if (!app) return;
  var U = new URLSearchParams(location.search);
  var PER = (U.get("per") || "").trim();
  if (U.get("embed") === "1") document.body.classList.add("embed");

  var M = null, YO = null, D = null, FICHA = null, PRIV = {}, TIPO = "REGULAR", LIENZO = null, MISIONES = [], CAMPANAS = [];
  var AB = window.SG_A_BORDO || { hitos: [] }, BT = window.SG_BATALLA || {}, SP = window.SG_SIN_PUA || { hitos: [] };
  var W = 2000, H = 1414;   // A4 apaisado a 170 ppp: se imprime sin pixelar y pesa poco

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pinta(h) { app.innerHTML = h; }

  function cargando(t) {
    pinta('<div class="dp-caja"><div class="dp-spin"><i></i></div><p class="muted">' + esc(t) + "</p></div>");
  }
  function fallo(msg) {
    pinta('<div class="dp-caja mal"><h2>No he podido preparar tu diploma</h2><p class="muted">' + esc(msg) + "</p></div>");
  }
  function puerta() {
    pinta('<div class="dp-caja bt-puerta"><div class="eyebrow amber">Bitácora Estelar</div><h2>Tu diploma</h2>'
      + '<p class="muted">El diploma de la Tripulación Cero lleva tu alias y tu nombre: entra con tu cuenta para verlo.</p>'
      + '<button class="btn epico" id="dp-entrar"><span class="ep-luz"></span><span class="ep-g">'
      + ((window.SG && window.SG.LOGO_G) || "") + '</span><span class="ep-txt">Entrar con Google</span></button></div>');
    document.getElementById("dp-entrar").onclick = function () {
      cargando("Abriendo…");
      M.entrar().then(mirar).catch(function (e) {
        if (/popup-closed|cancelled-popup/.test(String(e && e.code))) return puerta();
        fallo(e.message || e);
      });
    };
  }

  // ──────────────────────────────────────────────────────── los datos
  function hitosDelTipo() {
    return TIPO === "PUA" ? AB.hitos.filter(function (h) { return (SP.hitos || []).indexOf(h.clave) < 0; }) : AB.hitos;
  }
  function unicos(inv, marca) {
    var v = {};
    (inv || []).forEach(function (id) { if (String(id).indexOf(marca) >= 0) v[id] = 1; });
    return Object.keys(v).length;
  }
  function datos() {
    var p = FICHA || {}, d = D || {};
    var xp = Number(p.totalPoints || 0);
    var ni = (window.SG && SG.nivelInfo) ? SG.nivelInfo(xp, TIPO) : { nivel: 1, rangoNombre: "Recluta", titulo: "" };
    /**
     * 🔴 16-sep · RETOS E INSIGNIAS, COMO LOS CUENTA EL TABLERO. Antes: los retos contra una lista de 20 que ya no existe y
     * las insignias de `earnedBadges`, donde el servidor solo apunta la PRIMERA de cada reto (la Actividad 1 da dos) y
     * ninguna derivada. Ahora salen de las misiones y campañas del grupo, igual que en «Mi botín».
     */
    var misiones = MISIONES.filter(function (m) { return m.stargateId !== "H1"; });
    var retosTotal = misiones.length || 29;
    var suyas = p.completedMissionIds || [], campSuyas = p.completedCampaignIds || [];
    var hechos = misiones.filter(function (m) { return suyas.indexOf(m.__id) >= 0; }).length;
    var ins = {};
    misiones.forEach(function (m) { if (suyas.indexOf(m.__id) >= 0) (m.stargateBadges || (m.badge ? [m.badge] : [])).forEach(function (b) { ins[b] = 1; }); });
    if (suyas.length) ins.H1_reclutamiento = 1;
    CAMPANAS.forEach(function (c) { if (c.stargateInsignia && campSuyas.indexOf(c.__id) >= 0) ins[c.stargateInsignia] = 1; });
    (p.earnedBadges || []).forEach(function (b) { ins[b] = 1; });
    var orden = window.SG_BADGES || Object.keys(ins);
    var insLista = orden.filter(function (k) { return ins[k]; });
    var H2 = hitosDelTipo();
    var sim = p.stargateSimulador || {};
    var marcas = Object.keys((sim.marcas) || {}).map(function (k) { return Number(sim.marcas[k].p) || 0; });
    var esc7 = ((d.escuadrones || []).filter(function (e) { return String(e.comandante || "") === String(p.stargateProfe || ""); })[0]) || {};
    return {
      alias: p.displayName || "", nombre: [PRIV.firstName, PRIV.lastName].filter(Boolean).join(" "),
      grupo: d.nombre || PER, comandante: p.stargateProfe || "", escuadron: esc7.nombre || "",
      nivel: ni.nivel, rango: ni.rangoNombre, titulo: ni.titulo, xp: xp,
      retos: hechos, retosTotal: retosTotal,
      insignias: insLista.length, insigniasTotal: (window.SG_BADGES || []).length || 27,
      cartas: unicos(p.inventory, "__cromo_"), cartasTotal: (window.SG_CROMOS || []).length || 26,
      heroes: unicos(p.inventory, "__heroe_"), heroesTotal: (window.SG_HEROES || []).length || 30,
      logros: H2.filter(function (h) { return (p.stargateHitos || {})[h.clave]; }).length, logrosTotal: H2.length,
      contramaestre: !!(p.stargateCubiertas || {}).todo,
      dias: Number((p.stargateDias || {}).total || 0),
      joran: !!sim[BT.clave || "joran"], marca: marcas.length ? Math.max.apply(null, marcas) : 0,
      insigniasLista: insLista.slice(0, 27),
      avatar: (function () {
        var av = Object.assign({}, p.stargateAvatar || {}), v = String(p.stargateViste || "");
        if (v.indexOf("heroe:") === 0) av.heroe = v.slice(6);
        if (v.indexOf("skin:") === 0) av.skin = Number(v.slice(5));
        return av;
      })(),
      codigo: String(FICHA.__id || "").slice(0, 6).toUpperCase(),
      fecha: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
    };
  }

  // ──────────────────────────────────────────────────────── el lienzo
  function cargarImagen(src) {
    return new Promise(function (ok) {
      if (!src) return ok(null);
      var im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = function () { ok(null); };
      im.src = src;
    });
  }
  function redondo(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function texto(g, s, x, y, opts) {
    var o = opts || {};
    g.save();
    g.font = (o.peso || 600) + " " + (o.tam || 30) + 'px ' + (o.familia || '"DM Sans", sans-serif');
    g.fillStyle = o.color || "#E6F0F7";
    g.textAlign = o.ancla || "left";
    g.textBaseline = o.base || "alphabetic";
    if (o.espacio) g.letterSpacing = o.espacio;
    g.fillText(String(s == null ? "" : s), x, y);
    g.restore();
  }
  /** Parte un texto en líneas que quepan en `ancho`. */
  function parrafo(g, s, x, y, ancho, alto, opts) {
    var o = opts || {};
    g.save();
    g.font = (o.peso || 400) + " " + (o.tam || 26) + 'px "DM Sans", sans-serif';
    g.fillStyle = o.color || "#93A7BA";
    var palabras = String(s).split(" "), linea = "", n = 0;
    for (var i = 0; i < palabras.length; i++) {
      var prueba = linea ? linea + " " + palabras[i] : palabras[i];
      if (g.measureText(prueba).width > ancho && linea) { g.fillText(linea, x, y + n * alto); linea = palabras[i]; n++; }
      else linea = prueba;
    }
    if (linea) { g.fillText(linea, x, y + n * alto); n++; }
    g.restore();
    return n;
  }
  function cifra(g, x, y, w, valor, de, rotulo) {
    redondo(g, x, y, w, 132, 18);
    g.fillStyle = "rgba(13,24,36,.72)"; g.fill();
    g.strokeStyle = "rgba(55,224,236,.28)"; g.lineWidth = 2; g.stroke();
    texto(g, valor, x + w / 2, y + 62, { tam: 46, peso: 700, ancla: "center", familia: '"Unbounded","DM Sans",sans-serif' });
    if (de) texto(g, "de " + de, x + w / 2, y + 92, { tam: 20, peso: 400, ancla: "center", color: "#7d93a8" });
    texto(g, rotulo, x + w / 2, y + 118, { tam: 20, peso: 600, ancla: "center", color: "#93A7BA" });
  }

  async function dibujar(d) {
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var g = c.getContext("2d");

    // fondo: el espacio de la Nave, oscurecido, con un halo teal
    var fondo = await cargarImagen("assets/img/nave/canonica_espacio.jpg");
    g.fillStyle = "#070E17"; g.fillRect(0, 0, W, H);
    if (fondo) { g.globalAlpha = 0.5; g.drawImage(fondo, 0, 0, W, H); g.globalAlpha = 1; }
    var halo = g.createRadialGradient(W * 0.5, H * 0.1, 40, W * 0.5, H * 0.1, W * 0.75);
    halo.addColorStop(0, "rgba(55,224,236,.20)"); halo.addColorStop(1, "rgba(7,14,23,.92)");
    g.fillStyle = halo; g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(7,14,23,.55)"; g.fillRect(0, 0, W, H);

    // marco doble
    g.strokeStyle = "rgba(255,209,102,.75)"; g.lineWidth = 3;
    redondo(g, 44, 44, W - 88, H - 88, 26); g.stroke();
    g.strokeStyle = "rgba(55,224,236,.45)"; g.lineWidth = 1.5;
    redondo(g, 62, 62, W - 124, H - 124, 18); g.stroke();

    // cabecera
    texto(g, "◈ STARGATE", 110, 150, { tam: 40, peso: 700, familia: '"Unbounded","DM Sans",sans-serif', color: "#37E0EC" });
    texto(g, "LA BITÁCORA ESTELAR", 110, 192, { tam: 22, peso: 600, color: "#93A7BA", espacio: "6px" });
    texto(g, "Diploma de servicio", W - 110, 150, { tam: 34, peso: 600, ancla: "right", familia: '"Unbounded","DM Sans",sans-serif', color: "#FFD166" });
    texto(g, esc(d.grupo).toUpperCase(), W - 110, 192, { tam: 22, peso: 600, ancla: "right", color: "#93A7BA", espacio: "4px" });
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(110, 226); g.lineTo(W - 110, 226); g.stroke();

    // el retrato
    var av = (window.SG && SG.avatarSrc) ? SG.avatarSrc(d.avatar, d.alias, d.xp, TIPO) : { src: "" };
    var cara = await cargarImagen(av.src) || await cargarImagen(av.fallback);
    var cx = 300, cy = 470, r = 150;
    g.save();
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.closePath(); g.clip();
    g.fillStyle = "#12202E"; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    if (cara) g.drawImage(cara, cx - r, cy - r, r * 2, r * 2);
    g.restore();
    g.strokeStyle = "rgba(255,209,102,.9)"; g.lineWidth = 6;
    g.beginPath(); g.arc(cx, cy, r + 8, 0, Math.PI * 2); g.stroke();
    texto(g, d.rango, cx, cy + r + 58, { tam: 26, peso: 700, ancla: "center", color: "#FFD166", espacio: "3px" });
    texto(g, "Nivel " + d.nivel + " · " + d.xp.toLocaleString("es-ES") + " xp", cx, cy + r + 96, { tam: 24, peso: 400, ancla: "center", color: "#93A7BA" });

    // quién
    var x0 = 520;
    texto(g, "Se reconoce a", x0, 330, { tam: 24, peso: 500, color: "#93A7BA" });
    texto(g, d.alias, x0, 412, { tam: 78, peso: 700, familia: '"Unbounded","DM Sans",sans-serif' });
    if (d.nombre) texto(g, d.nombre, x0, 462, { tam: 32, peso: 500, color: "#C8DCEA" });
    texto(g, "por completar el viaje de la Tripulación Cero" + (d.escuadron ? " con el escuadrón " + d.escuadron : "")
      + (d.comandante ? ", a las órdenes de " + d.comandante : "") + ".", x0, 520, { tam: 26, peso: 400, color: "#93A7BA" });
    if (d.contramaestre)
      texto(g, "Contramaestre de la Nave", x0, 566, { tam: 26, peso: 700, color: "#FFD166" });

    // las cifras
    var gx = 520, gw = 216, gap = 20, gy = 610;
    cifra(g, gx, gy, gw, d.retos + "/" + d.retosTotal, null, "retos");
    cifra(g, gx + (gw + gap), gy, gw, d.insignias + "/" + d.insigniasTotal, null, "insignias");
    cifra(g, gx + 2 * (gw + gap), gy, gw, d.cartas + "/" + d.cartasTotal, null, "cartas");
    cifra(g, gx + 3 * (gw + gap), gy, gw, d.heroes + "/" + d.heroesTotal, null, "héroes");
    cifra(g, gx, gy + 152, gw, d.logros + "/" + d.logrosTotal, null, "logros de a bordo");
    cifra(g, gx + (gw + gap), gy + 152, gw, String(d.dias), null, "días a bordo");
    cifra(g, gx + 2 * (gw + gap), gy + 152, gw, d.joran ? String(d.marca || "✓") : "—", null, "Simulador de Joran");
    var pct = Math.round((d.retos / Math.max(1, d.retosTotal)) * 100);
    cifra(g, gx + 3 * (gw + gap), gy + 152, gw, pct + " %", null, "del viaje");

    // las insignias
    /**
     * 🔴 17-sep · EN FILAS IGUALES. Norberto: «el diploma es maravilloso; solo queda arreglar las insignias de la segunda
     * fila: que en la fila 1 y en la fila 2 haya el mismo número de insignias, o ±1». Iban 20 por fila (y no cabían 20
     * en el ancho): con 22, una fila de 20 y otra de 2 que además pisaba el mensaje del Capitán. Ahora se reparten a
     * partes iguales, la fila corta va centrada bajo la larga, y si con dos filas no caben antes del mensaje, se hacen
     * un poco más pequeñas.
     */
    var ix = 110, iy = 940, my = 1170;
    texto(g, "SUS INSIGNIAS", ix, iy, { tam: 20, peso: 700, color: "#93A7BA", espacio: "5px" });
    var imgs = (await Promise.all(d.insigniasLista.map(function (k) { return cargarImagen("assets/img/insignias/" + k + ".webp"); }))).filter(Boolean);
    var fila = colocarInsignias(imgs.length, W - 2 * ix, (my - 34 - 14) - (iy + 24));
    imgs.forEach(function (im, i) {
      var f = Math.floor(i / fila.porFila), enFila = Math.min(fila.porFila, imgs.length - f * fila.porFila);
      var px = ix + ((fila.porFila - enFila) * (fila.lado + fila.sep)) / 2 + (i - f * fila.porFila) * (fila.lado + fila.sep);
      g.drawImage(im, px, iy + 24 + f * (fila.lado + fila.sep), fila.lado, fila.lado);
    });

    // el mensaje y las firmas
    g.strokeStyle = "rgba(255,255,255,.12)";
    g.beginPath(); g.moveTo(110, my - 34); g.lineTo(W - 110, my - 34); g.stroke();
    parrafo(g, "«Recluta " + d.alias + ": cuando llegaste, la galaxia estaba perdiendo su memoria. Hoy tu Bitácora existe, "
      + "está abierta y se puede copiar. Eso es exactamente lo que vinimos a hacer. Gracias por tus servicios.»",
      110, my, 1100, 38, { tam: 26, color: "#C8DCEA" });
    parrafo(g, "NEBULA: «Lo que se comparte no se apaga. Tu viaje queda registrado aquí, y desde aquí seguirá enseñando.»",
      110, my + 96, 1100, 36, { tam: 24, color: "#93A7BA" });

    texto(g, (d.comandante || "El Capitán"), W - 110, my + 40, { tam: 30, peso: 700, ancla: "right", color: "#FFD166", familia: '"Unbounded","DM Sans",sans-serif' });
    texto(g, "Capitán" + (d.escuadron ? " · " + d.escuadron : ""), W - 110, my + 76, { tam: 22, peso: 400, ancla: "right", color: "#93A7BA" });
    texto(g, d.fecha + " · código " + d.codigo, W - 110, my + 116, { tam: 20, peso: 400, ancla: "right", color: "#6f8399" });

    return c;
  }

  /**
   * Cuántas por fila y de qué tamaño: se prueba con 1, 2 y 3 filas IGUALES (±1) y se queda la que deja las insignias más
   * grandes (a igualdad, la de menos filas), sin pasar de 78 px ni del ancho, ni del alto que hay antes del mensaje.
   */
  function colocarInsignias(n, ancho, alto) {
    var sep = 12, mejor = { lado: 0, sep: sep, filas: 1, porFila: Math.max(1, n) };
    for (var filas = 1; filas <= 3; filas++) {
      var porFila = Math.max(1, Math.ceil(n / filas));
      var lado = Math.min(78, Math.floor((ancho + sep) / porFila) - sep, Math.floor((alto - (filas - 1) * sep) / filas));
      if (lado > mejor.lado) mejor = { lado: lado, sep: sep, filas: filas, porFila: porFila };
      if (porFila === 1) break;
    }
    return mejor;
  }
  window.SG_DIPLOMA_FILAS = colocarInsignias;   // (lo prueba la batería 83)

  // ──────────────────────────────────────────────────────── la pantalla
  async function ver() {
    cargando("Preparando tu diploma…");
    var d = datos();
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
    LIENZO = await dibujar(d);
    pinta('<div class="dp-cab"><div class="eyebrow amber">Bitácora Estelar</div>'
      + "<h1>Tu diploma, " + esc(d.alias) + "</h1>"
      + '<p class="muted">Sale de tu ficha: no hay que rellenar nada. Descárgalo o imprímelo; el código de abajo lo identifica.</p>'
      + '<p class="dp-botones"><button class="btn primary" id="dp-png">Descargar</button>'
      + '<button class="btn" id="dp-print">Imprimir</button>'
      + '<a class="btn" href="recluta.html?per=' + esc(PER) + '"><img class=ico src=assets/img/iconos/p/cohete.png alt> Volver a mi Nave</a></p></div>'
      + '<div class="dp-lienzo" id="dp-lienzo"></div>');
    document.getElementById("dp-lienzo").appendChild(LIENZO);
    LIENZO.className = "dp-canvas";
    LIENZO.setAttribute("role", "img");
    // (las cifras también, para quien lo escucha con un lector de pantalla)
    LIENZO.setAttribute("aria-label", "Diploma de " + d.alias + ", " + d.rango + ", nivel " + d.nivel + ": " +
      d.retos + " de " + d.retosTotal + " retos y " + d.insignias + " de " + d.insigniasTotal + " insignias");
    document.getElementById("dp-png").onclick = function () {
      var a = document.createElement("a");
      a.href = LIENZO.toDataURL("image/png");
      a.download = "Diploma STARGATE · " + (d.alias || "recluta") + ".png";
      document.body.appendChild(a); a.click(); a.remove();
    };
    document.getElementById("dp-print").onclick = function () { window.print(); };
  }

  // ──────────────────────────────────────────────────────── arranque
  function cargar() {
    cargando("Buscando tu ficha…");
    return M.getDocs(M.query(M.collection(M.db, "student_profiles"), M.where("projectId", "==", PER), M.where("userId", "==", YO.uid)))
      .then(function (r) {
        if (r.empty) throw new Error("No tienes ficha en este grupo. Entra con la cuenta con la que te alistaste.");
        FICHA = Object.assign({ __id: r.docs[0].id }, r.docs[0].data());
        return Promise.all([
          M.getDoc(M.doc(M.db, "student_profiles", r.docs[0].id, "privado", "datos")).then(function (p) { PRIV = p.exists() ? p.data() : {}; }, function () { PRIV = {}; }),
          M.getDoc(M.doc(M.db, "projects", PER)).then(function (p) {
            var x = p.exists() ? p.data() : {};
            TIPO = ((x.stargate || {}).tipo === "PUA") ? "PUA" : "REGULAR";
            D = { nombre: x.name || PER, escuadrones: (x.factions || []).map(function (f) { return { id: f.id, nombre: f.name, comandante: f.teacherName }; }) };
          }, function () { D = { nombre: PER, escuadrones: [] }; }),
          // 16-sep · las misiones y campañas del grupo: de ahí salen los retos y las insignias, como en el tablero
          M.getDocs(M.query(M.collection(M.db, "missions"), M.where("projectId", "==", PER))).then(function (q) {
            MISIONES = q.docs.map(function (d) { return Object.assign({ __id: d.id }, d.data()); }); }, function () { MISIONES = []; }),
          M.getDocs(M.query(M.collection(M.db, "campaigns"), M.where("projectId", "==", PER))).then(function (q) {
            CAMPANAS = q.docs.map(function (d) { return Object.assign({ __id: d.id }, d.data()); }); }, function () { CAMPANAS = []; }),
        ]);
      }).then(ver);
  }
  function mirar(u) {
    var q = u ? u.uid : null; if (q === mirar._v) return; mirar._v = q;
    YO = u;
    if (!YO) return puerta();
    if (PER) return cargar().catch(function (e) { fallo(e.message || e); });
    cargando("Buscando tu grupo…");
    M.misGruposDeAlumno(YO.uid).then(function (g) {
      if (!g.length) return fallo("No encuentro tu ficha. Entra con la cuenta con la que te alistaste.");
      PER = g[0].per;
      return cargar();
    }).catch(function (e) { fallo(e.message || e); });
  }
  function arrancar() {
    M = window.SG.MOTOR;
    cargando("Comprobando quién eres…");
    M.sesion().then(mirar).catch(function () { puerta(); });
    document.addEventListener("sg:sesion", function (e) { mirar(e.detail); });
  }
  if (window.SG && window.SG.MOTOR) arrancar();
  else document.addEventListener("sg:motor", arrancar);
})();
