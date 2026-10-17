/**
 * GAMIFICAPRO · LAS NOTAS DEL DOCENTE, FUERA DE LO QUE SE PROYECTA (17-oct-2026) — pieza del motor para cualquier mod.
 *
 * Norberto (17-oct): el docente comparte su pantalla en clase, así que las notas de cada diapositiva no pueden ir en ella. «La
 * mayoría van a ir a pelo… cuando lleguen a la diapositiva no sabrán qué hacer; un guion o unas recomendaciones de cómo interactuar
 * con esa diapositiva sería fantástico». Dos salidas, las dos siguen la diapositiva en directo:
 *   · «Notas en otra ventana»: una ventana aparte (window.open), para llevarla a la pantalla que NO se comparte. Habla con la
 *     presentación por BroadcastChannel (el mismo navegador: al momento y sin servidor); si no le llega nada, por la nube.
 *     Mientras está abierta, la web esconde su panel de notas de la pantalla proyectada (`alCambiar({ ventana })`).
 *   · «Mandarlas al móvil o al iPad»: un QR y un enlace a la misma vista en otro dispositivo. La presentación escribe la diapositiva
 *     que va en `mod_notas/{grupo}` y la vista la escucha. Solo entra quien inicia sesión y es del equipo docente del grupo: las
 *     reglas (firestore.rules → mod_notas) no dejan leerla a nadie más; el alumnado, nunca.
 * Sirve igual en directo, en la vista previa y en el simulacro (ahí, sin nube: solo la ventana).
 *
 * El GUION de cada diapositiva (Norberto: qué hacer, qué decir o preguntar y qué herramienta enseñar, con su enlace; breve: de 2 a 4
 * líneas) es una lista de líneas «Haz: …», «Di: «…»», «Pregunta: …», «Enseña: [ClassDojo](https://…) …». La etiqueta va en negrita y
 * los enlaces [texto](https://…) se abren aparte; nada más se interpreta (todo lo demás, texto).
 *
 * Lo puro (lo prueba tests/sdk/notas.test.ts):
 *   GP.notas.lineas(g)              → el guion como lista limpia (de una lista o de un texto con saltos de línea), como mucho MAX.lineas.
 *   GP.notas.html(g, o)             → el guion en HTML seguro (<ul class="gpn-guion">), o "". Con `o.acciones`, cada enlace lleva «Copiar»
 *                                     y, con `o.chat`, «Al chat» (17-oct, Norberto: «cada enlace, listo para compartir»).
 *   GP.notas.enlaces(g)             → [{ texto, url }] del guion.
 *   GP.notas.paquete(d, sig, extra) → lo que viaja: { i, de, titulo, guion, nota, sesion, sig: { titulo, guion, nota } } recortado a
 *                                     MAX (= firestore.rules → notasValidas). `d` y `sig`: { titulo, guion, nota } de esta diapositiva
 *                                     y de la siguiente; `extra`: { i, de, sesion }.
 *   GP.notas.firma(p)               → para no volver a escribir lo mismo.
 *   GP.notas.enlace(base, per)      → la dirección de la vista (base = la carpeta de la web, con su barra final).
 *   GP.notas.canal(per)             → el nombre del BroadcastChannel del grupo.
 *
 * Lo de la web (navegador):
 *   GP.notas.conectarFirestore({ db, doc, setDoc, onSnapshot, serverTimestamp }) → la nube de la web (sus funciones de Firestore, como
 *       GP.prompt). Sin conectar, solo la ventana del mismo navegador.
 *   GP.notas.emisor({ per, url, alCambiar, alChat }) → { publicar(p), abrir(), cerrar(), remoto(on), estado(), destruir() }
 *     · alChat(texto): si la web tiene chat de clase, lo que pide la vista con «Al chat» (la ventana, por el mismo navegador; el móvil,
 *       con un `pedido` en mod_notas que la presentación escucha mientras la nube está encendida). Cada pedido, una vez.
 *     · publicar(p): la diapositiva que va (un `paquete`): a la ventana al momento; a la nube, si está encendida, con un respiro.
 *     · abrir(): abre la ventana de notas (false si el navegador la bloquea). estado().ventana dice si sigue abierta (la ventana late
 *       cada 4 s: vale también si se recarga la presentación).
 *     · remoto(on): enciende o apaga la nube (se recuerda en este navegador, por grupo). estado().remoto, estado().fallo.
 *     · alCambiar(estado) cada vez que cambia algo de eso.
 *   GP.notas.ventanaQR({ emisor, url, QR, alCerrar }) → la ventana del QR (encima, con velo, × y Esc). Al abrirla se enciende la nube.
 *       `QR`: el constructor de qrcodejs (window.QRCode) si la página lo carga; sin él, el enlace.
 *   GP.notas.vista(caja, { per, ventana }) → { nube(), destruir() }: la vista de notas (la ventana y el móvil). `nube()`, ya con la
 *       sesión iniciada, empieza a escuchar `mod_notas/{grupo}`; si las reglas no la dejan, lo dice.
 *
 * Cada web la copia en su build (assets/js/notas.js) y NO se edita allí: aquí. La piel, con --gpn-* (valores por defecto abajo).
 */
(function (raiz, fabrica) {
  var N = fabrica(raiz);
  if (typeof module === "object" && module.exports) module.exports = N;
  if (raiz) { raiz.GP = raiz.GP || {}; if (!raiz.GP.notas) raiz.GP.notas = N; }
})(typeof window !== "undefined" ? window : null, function (W) {
  "use strict";
  var COLECCION = "mod_notas";
  // = firestore.rules → notasValidas
  var MAX = { titulo: 160, nota: 3000, linea: 400, lineas: 8, sesion: 160 };
  var ETIQUETA = /^(Haz|Di|Pregunta|Enseña|Recomienda|Ojo|Muestra|Pide|Abre|Lee)\s*:\s*/i;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function corta(s, n) { s = String(s == null ? "" : s).replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function lineas(g) {
    var l = Array.isArray(g) ? g : (typeof g === "string" ? g.split(/\n+/) : []);
    return l.map(function (x) { return corta(String(x == null ? "" : x).replace(/^\s*[-·•*]\s*/, ""), MAX.linea); })
      .filter(Boolean).slice(0, MAX.lineas);
  }
  // [texto](https://…) → enlace; lo demás, texto (sin HTML de nadie)
  // (17-oct · con `o.acciones`, cada enlace lleva «Al chat» —si `o.chat`— y «Copiar»: Norberto, «cada enlace, listo para compartir»)
  function enLinea(s, o) {
    var out = "", re = /\[([^\]]{1,200})\]\((https?:\/\/[^\s)]{1,400})\)/g, ult = 0, m;
    while ((m = re.exec(s))) {
      out += esc(s.slice(ult, m.index)) + '<a href="' + esc(m[2]) + '" target="_blank" rel="noopener noreferrer">' + esc(m[1]) + "</a>";
      if (o && o.acciones) {
        var txt = esc(m[1] + ": " + m[2]);
        out += '<span class="gpn-acc">' + (o.chat ? '<button type="button" data-gpn-chat="' + txt + '">Al chat</button>' : "") +
          '<button type="button" data-gpn-copiar="' + txt + '">Copiar</button></span>';
      }
      ult = m.index + m[0].length;
    }
    return out + esc(s.slice(ult));
  }
  function html(g, o) {
    var l = lineas(g); if (!l.length) return "";
    return '<ul class="gpn-guion">' + l.map(function (x) {
      var m = ETIQUETA.exec(x);
      return "<li>" + (m ? "<b>" + esc(m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()) + ":</b> " + enLinea(x.slice(m[0].length), o) : enLinea(x, o)) + "</li>";
    }).join("") + "</ul>";
  }
  /** Los enlaces de un guion: [{ texto, url }] (para el chat y para copiar). */
  function enlaces(g) {
    var out = [];
    lineas(g).forEach(function (x) { var re = /\[([^\]]{1,200})\]\((https?:\/\/[^\s)]{1,400})\)/g, m; while ((m = re.exec(x))) out.push({ texto: m[1], url: m[2] }); });
    return out;
  }
  function parte(d) {
    d = d || {};
    return { titulo: corta(d.titulo, MAX.titulo), guion: lineas(d.guion), nota: corta(d.nota, MAX.nota) };
  }
  function paquete(d, sig, extra) {
    var x = extra || {}, p = parte(d);
    p.i = Math.max(0, Math.floor(Number(x.i) || 0));
    p.de = Math.max(0, Math.floor(Number(x.de) || 0));
    p.sesion = corta(x.sesion, MAX.sesion);
    p.ses = corta(x.ses, 40);       // la sesión y la clave de la diapositiva (para editar su guion)
    p.clave = corta(x.clave, 80);
    p.chat = !!x.chat;              // la clase tiene chat: «Al chat» en cada enlace
    // lo de cada docente (`efectivo`): si lleva las suyas, el borrador por defecto va en `base`, y si ha cambiado desde que las editó, `cambiado`
    if (x.propio) { p.propio = true; p.base = lineas(x.base); p.cambiado = !!x.cambiado; }
    if (x.tiene) p.tiene = true;
    p.sig = sig ? parte(sig) : null;
    return p;
  }
  function firma(p) { return JSON.stringify(p || null); }
  /** Una huella corta del guion (para saber si el borrador por defecto ha cambiado desde que el docente lo editó). */
  function huella(g) {
    var t = lineas(g).join("\n"), h = 5381;
    for (var i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  /**
   * 17-oct · LAS NOTAS DE CADA DOCENTE (Norberto: «tú haces el borrador por defecto y cada docente las adapta… se guarda en SU PERFIL
   * y vale para todos sus grupos»; un interruptor «Por defecto / Personalizadas» por sesión, como el del mazo). `perfil`: su
   * mod_profes ({ notas, notasOn, notasBase }). → { guion, propio, tiene, base, cambiado } para `paquete`.
   */
  function efectivo(defecto, perfil, ses, clave) {
    var P = perfil || {}, mias = ((P.notas || {})[ses] || {}), suyas = mias[clave], on = !!((P.notasOn || {})[ses]);
    var tiene = Object.keys(mias).length > 0;
    if (!on || !Array.isArray(suyas)) return { guion: lineas(defecto), propio: false, tiene: tiene };
    var vista = ((P.notasBase || {})[ses] || {})[clave];
    return { guion: lineas(suyas), propio: true, tiene: true, base: lineas(defecto), cambiado: !!vista && vista !== huella(defecto) };
  }
  function enlace(base, per) { return String(base || "") + "notas.html?per=" + encodeURIComponent(String(per || "")); }
  function canal(per) { return "gp-notas:" + String(per || ""); }

  // ── la nube de la web (sus funciones de Firestore)
  var NUBE = null;
  function conectarFirestore(o) {
    conectarNube(o);
    OYENTES.forEach(enganchar);
  }
  function conectarNube(o) {
    if (!o || !o.db) { NUBE = null; return; }
    // el perfil del docente (mod_profes/{mod}__{uid}): con `uid`, `correo` y `mod` (lo que piden las reglas para escribirlo)
    var PERFIL = o.uid && o.mod ? o.doc(o.db, "mod_profes", String(o.mod) + "__" + String(o.uid)) : null;
    var firmaPerfil = function () { return { uid: String(o.uid), correo: String(o.correo || ""), mod: String(o.mod) }; };
    NUBE = {
      perfil: !!PERFIL,
      escucharPerfil: function (fn) {
        if (!PERFIL) { fn(null); return function () {}; }
        return o.onSnapshot(PERFIL, function (s) { var d = s && s.exists() ? s.data() : {}; fn({ notas: d.notas || {}, notasOn: d.notasOn || {}, notasBase: d.notasBase || {} }); }, function () { fn(null); });
      },
      // guardar las suyas de una diapositiva (`lin` vacío: quitarlas) y encender «Personalizadas» en esa sesión
      guardarMia: function (ses, clave, lin, base) {
        if (!PERFIL) return Promise.reject(new Error("Entra con tu cuenta"));
        var n = {}, b = {}, on = {}, l = lineas(lin);
        n[ses] = {}; n[ses][clave] = l.length ? l : o.deleteField(); b[ses] = {}; b[ses][clave] = l.length ? huella(base) : o.deleteField(); on[ses] = true;
        return o.setDoc(PERFIL, Object.assign(firmaPerfil(), { notas: n, notasBase: b, notasOn: on }), { merge: true });
      },
      // el interruptor de una sesión: «Personalizadas» (true) o «Por defecto» (false, sin perder las suyas)
      modo: function (ses, on) {
        if (!PERFIL) return Promise.reject(new Error("Entra con tu cuenta"));
        var m = {}; m[ses] = !!on;
        return o.setDoc(PERFIL, Object.assign(firmaPerfil(), { notasOn: m }), { merge: true });
      },
      // (con merge: el `pedido` del móvil se queda hasta que la presentación lo recoge)
      guardar: function (per, p) {
        var datos = Object.assign({}, p, { projectId: String(per), t: o.serverTimestamp() });
        return o.setDoc(o.doc(o.db, COLECCION, String(per)), datos, { merge: true });
      },
      // 17-oct · «Al chat» desde el móvil: el pedido va al documento y la presentación (que lo escucha) lo manda al chat de la clase
      pedir: function (per, texto) {
        var pedido = { texto: String(texto || "").slice(0, 600), id: Math.random().toString(36).slice(2, 12), ms: Date.now() };
        return o.setDoc(o.doc(o.db, COLECCION, String(per)), { projectId: String(per), pedido: pedido, t: o.serverTimestamp() }, { merge: true });
      },
      escuchar: function (per, fn, fallo) {
        return o.onSnapshot(o.doc(o.db, COLECCION, String(per)), function (s) { fn(s && s.exists() ? s.data() : null); }, fallo);
      },
    };
  }

  // ── la piel por defecto (cada web la cambia con --gpn-*)
  var CSS = ".gpn{--gpn-fondo:#14110d;--gpn-tinta:#f3ead8;--gpn-suave:#b9ab90;--gpn-acento:#e2b65c;--gpn-linea:rgba(255,255,255,.14);--gpn-escala:1;" +
    "box-sizing:border-box;min-height:100svh;background:var(--gpn-fondo);color:var(--gpn-tinta);padding:14px 16px calc(16px + env(safe-area-inset-bottom));" +
    "font-size:calc(19px * var(--gpn-escala));line-height:1.45;display:flex;flex-direction:column;gap:12px}" +
    ".gpn *{box-sizing:border-box}.gpn a{color:var(--gpn-acento)}" +
    ".gpn-cab{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font-size:15px;color:var(--gpn-suave);border-bottom:1px solid var(--gpn-linea);padding-bottom:10px}" +
    ".gpn-num{font-weight:700;color:var(--gpn-tinta);font-size:18px;white-space:nowrap}.gpn-ses{flex:1 1 140px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".gpn-estado{white-space:nowrap}.gpn-estado i{display:inline-block;width:9px;height:9px;border-radius:50%;background:#7a7a7a;margin-right:6px;vertical-align:1px}" +
    ".gpn-estado.on i{background:#4cc46a;box-shadow:0 0 0 3px rgba(76,196,106,.25)}" +
    ".gpn-letra{display:flex;gap:6px}.gpn-letra button{min-width:44px;min-height:40px;border-radius:10px;border:1px solid var(--gpn-linea);background:transparent;color:var(--gpn-tinta);font:inherit;font-size:15px;cursor:pointer}" +
    ".gpn-tit{margin:0;font-size:1.35em;line-height:1.2;overflow-wrap:anywhere}" +
    ".gpn-guion{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:.55em}" +
    ".gpn-guion li{padding:.55em .7em;border-left:4px solid var(--gpn-acento);background:rgba(255,255,255,.05);border-radius:0 10px 10px 0;overflow-wrap:anywhere}" +
    ".gpn-guion b{color:var(--gpn-acento)}" +
    ".gpn-propia{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:15px}.gpn-suave{color:var(--gpn-suave);font-size:15px}" +
    ".gpn-b{min-height:40px;padding:0 14px;border-radius:10px;border:1px solid var(--gpn-linea);background:transparent;color:var(--gpn-tinta);font:inherit;font-size:15px;cursor:pointer}" +
    ".gpn-b.gpn-pri{border-color:var(--gpn-acento);background:var(--gpn-acento);color:var(--gpn-fondo);font-weight:700}" +
    ".gpn-sw{display:inline-flex;border:1px solid var(--gpn-linea);border-radius:10px;overflow:hidden}.gpn-sw button{min-height:40px;padding:0 12px;border:0;background:transparent;color:var(--gpn-suave);font:inherit;font-size:14px;cursor:pointer}" +
    ".gpn-sw button[aria-pressed=true]{background:var(--gpn-acento);color:var(--gpn-fondo);font-weight:700}" +
    ".gpn-aviso{margin:0;color:var(--gpn-acento);font-size:15px}.gpn-ed{width:100%;min-height:12em;border-radius:10px;border:1px solid var(--gpn-linea);background:rgba(0,0,0,.25);color:var(--gpn-tinta);font:inherit;font-size:16px;padding:10px;resize:vertical}" +
    ".gpn-acc{display:inline-flex;gap:6px;margin:0 .35em;vertical-align:.1em}.gpn-acc button{min-height:40px;padding:0 12px;border-radius:999px;border:1px solid var(--gpn-acento);" +
    "background:transparent;color:var(--gpn-tinta);font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}.gpn-acc button[disabled]{opacity:.75}" +
    ".gpn-nota{margin:0;overflow-wrap:anywhere}.gpn-mas{font-size:.82em;color:var(--gpn-suave)}.gpn-mas summary{cursor:pointer;min-height:40px;display:flex;align-items:center;color:var(--gpn-tinta)}" +
    ".gpn-mas summary::before{content:\"▸\";margin-right:.45em;color:var(--gpn-acento)}.gpn-mas[open] summary::before{content:\"▾\"}" +
    ".gpn-sig{margin-top:auto;border-top:1px dashed var(--gpn-linea);padding-top:10px;font-size:.78em;color:var(--gpn-suave);opacity:.85}" +
    ".gpn-sig b{color:var(--gpn-tinta)}.gpn-sig p{margin:.3em 0 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
    ".gpn-vacio{margin:auto 0;text-align:center;color:var(--gpn-suave)}.gpn-vacio b{display:block;color:var(--gpn-tinta);font-size:1.2em;margin-bottom:.4em}" +
    // la ventana del QR
    ".gpnq-velo{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".gpnq{--gpn-fondo:#1b1712;--gpn-tinta:#f3ead8;--gpn-suave:#b9ab90;--gpn-acento:#e2b65c;position:relative;width:min(440px,100%);max-height:calc(100dvh - 32px);overflow:auto;" +
    "background:var(--gpn-fondo);color:var(--gpn-tinta);border-radius:16px;padding:22px 20px;box-shadow:0 20px 60px rgba(0,0,0,.5);font-size:16px;line-height:1.45}" +
    ".gpnq h2{margin:0 36px 8px 0;font-size:20px}.gpnq p{margin:0 0 10px;color:var(--gpn-suave)}.gpnq b{color:var(--gpn-tinta)}" +
    ".gpnq-x{position:absolute;top:8px;right:8px;width:40px;height:40px;border:0;border-radius:50%;background:transparent;color:var(--gpn-tinta);font-size:26px;cursor:pointer}" +
    ".gpnq-qr{background:#fff;border-radius:12px;padding:12px;width:244px;max-width:100%;margin:6px auto 12px;display:flex;justify-content:center}.gpnq-qr img,.gpnq-qr canvas{max-width:100%;height:auto}" +
    ".gpnq-url{display:flex;gap:8px}.gpnq-url input{flex:1;min-width:0;min-height:40px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.25);color:inherit;padding:0 10px;font:inherit;font-size:14px}" +
    ".gpnq button.gpnq-b{min-height:40px;border-radius:10px;border:1px solid var(--gpn-acento);background:transparent;color:var(--gpn-tinta);padding:0 14px;font:inherit;font-size:15px;cursor:pointer}" +
    ".gpnq-estado{margin-top:12px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:space-between}.gpnq-estado.mal span{color:#ff9a8a}";
  function estilo(doc) {
    doc = doc || (W && W.document); if (!doc || doc.getElementById("gpn-css")) return;
    var s = doc.createElement("style"); s.id = "gpn-css"; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s);
  }
  function guardado(k, v) {
    try { if (v === undefined) return W.localStorage.getItem(k); if (v === null) W.localStorage.removeItem(k); else W.localStorage.setItem(k, v); } catch (e) { /* sin almacén */ }
    return null;
  }
  function nuevoCanal(per) {
    try { return W && W.BroadcastChannel ? new W.BroadcastChannel(canal(per)) : null; } catch (e) { return null; }
  }

  // ── la presentación: publica la diapositiva que va
  function emisor(o) {
    o = o || {};
    var per = String(o.per || ""), bc = nuevoCanal(per), ultimo = null, win = null, latido = 0, vigia = null;
    var LLAVE = "gpNotasRemoto:" + per;
    var st = { ventana: false, remoto: !!per && guardado(LLAVE) === "1", fallo: "" };
    var escrito = "", pendiente = null, reloj = null;
    function avisar() {
      var v = (!!win && !win.closed) || (Date.now() - latido < 10000);
      st.ventana = v;
      if (typeof o.alCambiar === "function") o.alCambiar({ ventana: st.ventana, remoto: st.remoto, fallo: st.fallo });
    }
    function mandarVentana() { if (bc && ultimo) try { bc.postMessage({ tipo: "notas", datos: Object.assign({ t: Date.now() }, ultimo) }); } catch (e) { /* nada */ } }
    function escribir() {
      reloj = null;
      if (!st.remoto || !NUBE || !per || !pendiente) return;
      var p = pendiente, f = firma(p); pendiente = null;
      if (f === escrito) return;
      escrito = f;
      NUBE.guardar(per, p).then(function () { if (st.fallo) { st.fallo = ""; avisar(); } }, function (e) {
        escrito = "";
        var sinPermiso = /permission|insufficient/i.test(String((e && (e.code || e.message)) || e));
        st.fallo = sinPermiso ? "Este grupo no te deja mandar las notas: solo su equipo docente." : "Sin señal: lo reintento con la próxima diapositiva.";
        if (sinPermiso) { st.remoto = false; guardado(LLAVE, null); }
        avisar();
      });
    }
    function alChat(t) { if (typeof o.alChat === "function" && t) try { o.alChat(String(t).slice(0, 600)); } catch (e) { /* nada */ } }
    if (bc) bc.onmessage = function (ev) {
      var m = ev && ev.data; if (!m) return;
      if (m.tipo === "hola") { latido = Date.now(); mandarVentana(); avisar(); }
      else if (m.tipo === "adios") { latido = 0; setTimeout(avisar, 50); }
      else if (m.tipo === "chat") alChat(m.texto);
    };
    // lo que pide el móvil («Al chat»): con la nube encendida, se escucha el documento y cada pedido nuevo se manda una vez
    var oyendo = null, vistos = null;
    function oir() {
      if (oyendo || !st.remoto || !NUBE || !per || typeof o.alChat !== "function") return;
      oyendo = NUBE.escuchar(per, function (d) {
        var p = d && d.pedido; if (!p || !p.id) { if (!vistos) vistos = {}; return; }
        if (!vistos) { vistos = {}; vistos[p.id] = 1; return; }   // (lo de antes de abrir no se repite)
        if (vistos[p.id]) return; vistos[p.id] = 1; alChat(p.texto);
      }, function () { oyendo = null; });
    }
    function callar() { if (oyendo) try { oyendo(); } catch (e) { /* nada */ } oyendo = null; vistos = null; }
    // (la ventana late cada 4 s: si se cierra sin despedirse, a los 10 s ya no cuenta)
    vigia = setInterval(function () { var antes = st.ventana; var v = (!!win && !win.closed) || (Date.now() - latido < 10000); if (v !== antes) avisar(); }, 2000);
    return {
      publicar: function (p) {
        if (!p) return;
        if (typeof o.alChat === "function") p.chat = true;
        ultimo = p; mandarVentana(); oir();
        if (st.remoto && NUBE && per) { pendiente = p; if (!reloj) reloj = setTimeout(escribir, 400); }
      },
      abrir: function () {
        var u = String(o.url || "") + (String(o.url || "").indexOf("?") >= 0 ? "&" : "?") + "ventana=1";
        try { win = W.open(u, "gpnotas_" + per.replace(/\W/g, "_"), "popup=yes,width=620,height=860"); } catch (e) { win = null; }
        if (!win) return false;
        try { win.focus(); } catch (e) { /* nada */ }
        avisar(); setTimeout(mandarVentana, 600);
        return true;
      },
      cerrar: function () { try { if (win) win.close(); } catch (e) { /* nada */ } win = null; latido = 0; if (bc) try { bc.postMessage({ tipo: "cierra" }); } catch (e) { /* nada */ } avisar(); },
      remoto: function (on) {
        st.remoto = !!on && !!per && !!NUBE; st.fallo = on && !NUBE ? "Aquí no hay nube: usa la ventana de este navegador." : "";
        guardado(LLAVE, st.remoto ? "1" : null);
        if (st.remoto && ultimo) { escrito = ""; pendiente = ultimo; escribir(); }
        if (st.remoto) oir(); else callar();
        avisar();
      },
      estado: function () { return { ventana: st.ventana, remoto: st.remoto, fallo: st.fallo, nube: !!NUBE }; },
      destruir: function () { clearInterval(vigia); callar(); if (reloj) clearTimeout(reloj); if (bc) try { bc.close(); } catch (e) { /* nada */ } },
    };
  }

  // ── la ventana del QR, encima de la página
  function ventanaQR(o) {
    o = o || {}; var doc = W.document, em = o.emisor; estilo(doc);
    if (em) em.remoto(true);
    var velo = doc.createElement("div"); velo.className = "gpnq-velo";
    velo.innerHTML = '<div class="gpnq" role="dialog" aria-modal="true" aria-label="Las notas en tu móvil o tu iPad">' +
      '<button type="button" class="gpnq-x" aria-label="Cerrar">×</button>' +
      "<h2>Las notas en tu móvil o tu iPad</h2>" +
      "<p>Escanéalo (o abre el enlace) y <b>entra con tu cuenta de docente</b>: verás la nota de cada diapositiva, en directo, mientras pasas.</p>" +
      '<div class="gpnq-qr"></div>' +
      '<div class="gpnq-url"><input type="text" readonly aria-label="Enlace a las notas"><button type="button" class="gpnq-b" data-c>Copiar</button></div>' +
      "<p style=\"margin-top:10px;font-size:14px\">Si la clase ve este QR, no le sirve: solo entra el equipo docente del grupo.</p>" +
      '<div class="gpnq-estado"><span></span><button type="button" class="gpnq-b" data-r></button></div></div>';
    var caja = velo.firstChild, inp = caja.querySelector("input"), qr = caja.querySelector(".gpnq-qr");
    inp.value = String(o.url || "");
    if (typeof o.QR === "function") { try { new o.QR(qr, { text: inp.value, width: 220, height: 220, correctLevel: o.QR.CorrectLevel ? o.QR.CorrectLevel.M : undefined }); } catch (e) { qr.hidden = true; } }
    else qr.hidden = true;
    function pintar() {
      var e = em ? em.estado() : { remoto: false }, fila = caja.querySelector(".gpnq-estado"), b = caja.querySelector("[data-r]");
      fila.classList.toggle("mal", !!e.fallo);
      fila.firstChild.textContent = e.fallo || (e.remoto ? "Mandando las notas a la nube." : "No se están mandando.");
      b.textContent = e.remoto ? "Dejar de mandarlas" : "Mandarlas";
    }
    caja.querySelector("[data-r]").onclick = function () { if (em) em.remoto(!em.estado().remoto); pintar(); };
    caja.querySelector("[data-c]").onclick = function (ev) {
      var b = ev.currentTarget; inp.select();
      var ok = function () { b.textContent = "Copiado"; setTimeout(function () { b.textContent = "Copiar"; }, 1500); };
      try { W.navigator.clipboard.writeText(inp.value).then(ok, function () { doc.execCommand("copy"); ok(); }); } catch (e) { try { doc.execCommand("copy"); ok(); } catch (e2) { /* nada */ } }
    };
    function cerrar() { doc.removeEventListener("keydown", tecla, true); clearInterval(t); velo.remove(); if (typeof o.alCerrar === "function") o.alCerrar(); }
    function tecla(ev) { if (ev.key === "Escape") { ev.stopPropagation(); cerrar(); } }
    caja.querySelector(".gpnq-x").onclick = cerrar;
    velo.addEventListener("click", function (ev) { if (ev.target === velo) cerrar(); });
    caja.addEventListener("keydown", function (ev) { ev.stopPropagation(); });   // (las flechas no pasan de diapositiva detrás)
    doc.addEventListener("keydown", tecla, true);
    var t = setInterval(pintar, 1500); pintar();
    doc.body.appendChild(velo);
    return { cerrar: cerrar };
  }

  // ── la vista de notas (la ventana aparte y el móvil)
  function vista(caja, o) {
    o = o || {}; var doc = caja.ownerDocument || W.document, per = String(o.per || ""); estilo(doc);
    var bc = nuevoCanal(per), datos = null, de = "", tDatos = 0, dejar = null, latir = null, bloqueo = null;
    var LETRA = "gpNotasLetra", escala = Number(guardado(LETRA)) || 1, aviso = "";
    caja.classList.add("gpn");
    var ED = null;   // la diapositiva que se está editando: { ses, clave, base, titulo, lineas }
    function puedeEditar() { return !!(NUBE && NUBE.perfil && datos && datos.ses && datos.clave); }
    function barraPropia() {
      if (!datos || !datos.ses || !datos.clave) return "";
      var sw = datos.tiene || datos.propio ? '<span class="gpn-sw" role="group" aria-label="Las notas de esta clase">' +
        '<button type="button" data-gpn-modo="0" aria-pressed="' + !datos.propio + '">Por defecto</button>' +
        '<button type="button" data-gpn-modo="1" aria-pressed="' + !!datos.propio + '">Personalizadas</button></span>' : "";
      var av = datos.cambiado ? '<p class="gpn-aviso">El borrador por defecto de esta diapositiva ha cambiado desde que la editaste.</p>' +
        '<details class="gpn-mas"><summary>Ver el borrador por defecto</summary>' + html(datos.base) + "</details>" : "";
      return '<div class="gpn-propia">' + (puedeEditar() ? '<button type="button" class="gpn-b" data-gpn-editar>Editar esta nota</button>' :
        '<span class="gpn-suave">Entra con tu cuenta de docente para adaptar estas notas.</span>') + sw + "</div>" + av;
    }
    function pintarEdicion() {
      caja.innerHTML = '<header class="gpn-cab"><span class="gpn-num">Tus notas</span><span class="gpn-ses">' + esc(ED.titulo) + "</span></header>" +
        '<p class="gpn-suave">Una idea por línea (hasta 8). Empieza por «Haz:», «Di:», «Pregunta:», «Enseña:», «Recomienda:» u «Ojo:». Enlaces: [texto](https://…). ' +
        "Se guardan en tu perfil y valen para todos tus grupos.</p>" +
        '<textarea class="gpn-ed" rows="9" aria-label="Tus notas de esta diapositiva">' + esc(ED.lineas.join("\n")) + "</textarea>" +
        '<div class="gpn-propia"><button type="button" class="gpn-b gpn-pri" data-gpn-guardar>Guardar</button><button type="button" class="gpn-b" data-gpn-cancelar>Cancelar</button>' +
        (ED.propio ? '<button type="button" class="gpn-b" data-gpn-quitar>Quitar las mías de esta diapositiva</button>' : "") + '</div><p class="gpn-aviso" data-gpn-msg hidden></p>';
      var t = caja.querySelector("textarea"); try { t.focus(); } catch (e) { /* nada */ }
    }
    function pintar() {
      if (ED) return;   // (mientras edita, no se le cambia la diapositiva debajo)
      caja.style.setProperty("--gpn-escala", String(escala));
      var cab = '<header class="gpn-cab"><span class="gpn-num">' + (datos && datos.de ? (datos.i + 1) + " / " + datos.de : "Notas") + "</span>" +
        '<span class="gpn-ses">' + esc(datos ? datos.sesion : "") + "</span>" +
        '<span class="gpn-estado' + (datos ? " on" : "") + '"><i></i>' + (datos ? (de === "ventana" ? "En directo" : "En directo · nube") : "Esperando") + "</span>" +
        '<span class="gpn-letra"><button type="button" data-l="-1" aria-label="Letra más pequeña">A−</button><button type="button" data-l="1" aria-label="Letra más grande">A+</button></span></header>';
      if (!datos) {
        caja.innerHTML = cab + '<div class="gpn-vacio"><b>' + esc(aviso ? aviso : "Esperando a la presentación") + "</b>" +
          (aviso ? "" : "En cuanto pases de diapositiva, su nota sale aquí.") + "</div>";
        return;
      }
      var g = html(datos.guion, { acciones: true, chat: !!datos.chat }), n = esc(datos.nota), s = datos.sig;
      var cuerpo = '<h1 class="gpn-tit">' + esc(datos.titulo || "Diapositiva " + (datos.i + 1)) + "</h1>" +
        (g ? g + (n ? '<details class="gpn-mas"><summary>La nota completa</summary><p class="gpn-nota">' + n + "</p></details>" : "")
           : (n ? '<p class="gpn-nota">' + n + "</p>" : '<p class="gpn-nota" style="opacity:.7">Esta diapositiva no lleva nota.</p>'));
      var sig = s && (s.titulo || s.nota || (s.guion && s.guion.length)) ?
        '<section class="gpn-sig"><small>Después' + (datos.de ? " · " + (datos.i + 2) : "") + "</small> <b>" + esc(s.titulo) + "</b><p>" +
        esc((s.guion && s.guion[0]) || s.nota || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") + "</p></section>" : "";
      caja.innerHTML = cab + cuerpo + barraPropia() + sig;
    }
    function terminar(promesa, msg) {
      var m = caja.querySelector("[data-gpn-msg]");
      Array.prototype.forEach.call(caja.querySelectorAll(".gpn-propia button"), function (b) { b.disabled = true; });
      promesa.then(function () { ED = null; pintar(); }, function (e) {
        Array.prototype.forEach.call(caja.querySelectorAll(".gpn-propia button"), function (b) { b.disabled = false; });
        if (m) { m.hidden = false; m.textContent = msg + ": " + String((e && e.message) || e); }
      });
    }
    function hecho(b, t) { var antes = b.textContent; b.textContent = t; b.disabled = true; setTimeout(function () { b.textContent = antes; b.disabled = false; }, 1600); }
    function copiar(b, t) {
      var ok = function () { hecho(b, "Copiado"); }, mal = function () { hecho(b, "No se pudo"); };
      try { W.navigator.clipboard.writeText(t).then(ok, function () { try { var x = doc.createElement("textarea"); x.value = t; doc.body.appendChild(x); x.select(); doc.execCommand("copy"); x.remove(); ok(); } catch (e) { mal(); } }); } catch (e) { mal(); }
    }
    function alChat(b, t) {
      if (de === "ventana" && bc) { try { bc.postMessage({ tipo: "chat", texto: t }); hecho(b, "Enviado"); } catch (e) { hecho(b, "No se pudo"); } return; }
      if (!NUBE || !NUBE.pedir || !per) { hecho(b, "Sin conexión"); return; }
      NUBE.pedir(per, t).then(function () { hecho(b, "Enviado"); }, function () { hecho(b, "No se pudo"); });
    }
    caja.addEventListener("click", function (ev) {
      var e = ev.target.closest && ev.target.closest("[data-gpn-editar],[data-gpn-guardar],[data-gpn-cancelar],[data-gpn-quitar],[data-gpn-modo]");
      if (e) {
        if (e.hasAttribute("data-gpn-editar") && puedeEditar()) {
          ED = { ses: datos.ses, clave: datos.clave, titulo: datos.titulo, propio: !!datos.propio, base: datos.propio ? datos.base : datos.guion, lineas: lineas(datos.guion) };
          pintarEdicion();
        } else if (e.hasAttribute("data-gpn-cancelar")) { ED = null; pintar(); }
        else if (e.hasAttribute("data-gpn-guardar")) terminar(guardarMia(ED.ses, ED.clave, caja.querySelector("textarea").value, ED.base), "No se ha guardado");
        else if (e.hasAttribute("data-gpn-quitar")) terminar(guardarMia(ED.ses, ED.clave, [], ED.base), "No se ha quitado");
        else if (e.hasAttribute("data-gpn-modo") && datos && datos.ses) modo(datos.ses, e.getAttribute("data-gpn-modo") === "1").then(null, function () {});
        return;
      }
      var a = ev.target.closest && ev.target.closest("[data-gpn-chat],[data-gpn-copiar]");
      if (a) { if (a.hasAttribute("data-gpn-chat")) alChat(a, a.getAttribute("data-gpn-chat")); else copiar(a, a.getAttribute("data-gpn-copiar")); return; }
      var b = ev.target.closest && ev.target.closest("[data-l]"); if (!b) return;
      escala = Math.max(0.7, Math.min(2, Math.round((escala + 0.15 * Number(b.getAttribute("data-l"))) * 100) / 100));
      guardado(LETRA, String(escala)); caja.style.setProperty("--gpn-escala", String(escala));
    });
    function llega(d, fuente) {
      if (!d) return;
      if (fuente === "nube" && de === "ventana" && Date.now() - tDatos < 15000) return;   // (la ventana del mismo navegador manda: llega antes)
      datos = d; de = fuente; tDatos = Date.now(); aviso = ""; pintar();
    }
    function hola() { if (bc) try { bc.postMessage({ tipo: "hola", ventana: !!o.ventana }); } catch (e) { /* nada */ } }
    if (bc) {
      bc.onmessage = function (ev) {
        var m = ev && ev.data; if (!m) return;
        if (m.tipo === "notas") llega(m.datos, "ventana");
        else if (m.tipo === "cierra" && o.ventana) try { W.close(); } catch (e) { /* nada */ }
      };
      hola(); latir = setInterval(hola, 4000);
      W.addEventListener("pagehide", function () { try { bc.postMessage({ tipo: "adios", ventana: !!o.ventana }); } catch (e) { /* nada */ } });
    }
    // que la pantalla del móvil no se apague mientras se da la clase
    function despierta() { try { if (W.navigator.wakeLock && doc.visibilityState === "visible") W.navigator.wakeLock.request("screen").then(function (b) { bloqueo = b; }, function () {}); } catch (e) { /* nada */ } }
    doc.addEventListener("visibilitychange", despierta); despierta();
    pintar();
    return {
      nube: function () {
        if (dejar || !NUBE || !per) return !!dejar;
        dejar = NUBE.escuchar(per, function (d) { llega(d, "nube"); }, function (e) {
          var sinPermiso = /permission|insufficient/i.test(String((e && (e.code || e.message)) || e));
          aviso = sinPermiso ? "Estas notas son del equipo docente de este grupo" : "Sin señal: vuelve a cargar la página";
          dejar = null; if (!datos || sinPermiso) { datos = null; pintar(); }
        });
        return true;
      },
      aviso: function (t) { aviso = String(t || ""); if (!datos) pintar(); },
      destruir: function () { if (latir) clearInterval(latir); if (dejar) try { dejar(); } catch (e) { /* nada */ } if (bc) try { bc.close(); } catch (e) { /* nada */ } if (bloqueo) try { bloqueo.release(); } catch (e) { /* nada */ } },
    };
  }

  // (quien escucha el perfil antes de que la web abra sesión sigue escuchando: al conectar, se engancha; al cambiar de cuenta, se re-engancha)
  var OYENTES = [];
  function enganchar(x) { if (x.dejar) try { x.dejar(); } catch (e) { /* nada */ } x.dejar = NUBE && NUBE.perfil ? NUBE.escucharPerfil(x.fn) : null; if (!x.dejar) x.fn(null); }
  function escucharPerfil(fn) {
    var x = { fn: fn, dejar: null }; OYENTES.push(x); enganchar(x);
    return function () { if (x.dejar) try { x.dejar(); } catch (e) { /* nada */ } OYENTES = OYENTES.filter(function (y) { return y !== x; }); };
  }
  function guardarMia(ses, clave, lin, base) { return NUBE && NUBE.guardarMia ? NUBE.guardarMia(ses, clave, lin, base) : Promise.reject(new Error("Entra con tu cuenta")); }
  function modo(ses, on) { return NUBE && NUBE.modo ? NUBE.modo(ses, on) : Promise.reject(new Error("Entra con tu cuenta")); }

  return { COLECCION: COLECCION, MAX: MAX, lineas: lineas, html: html, enlaces: enlaces, huella: huella, efectivo: efectivo,
    escucharPerfil: escucharPerfil, guardarMia: guardarMia, modo: modo, paquete: paquete, firma: firma, enlace: enlace, canal: canal,
    conectarFirestore: conectarFirestore, emisor: emisor, ventanaQR: ventanaQR, vista: vista, estilo: estilo };
});
