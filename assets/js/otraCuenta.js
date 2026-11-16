/**
 * GAMIFICAPRO · ¿YA TE ALISTASTE Y NO VES TU CLASE? (16-nov-2026) — pieza del motor para los mods (STARGATE y DPG).
 *
 * Clase en directo de PER 16450: tres reclutas con ficha no podían fichar porque la web les pedía el código de clase. Entraban con
 * OTRA cuenta de Google (una se había hecho una nueva; otra tenía la ficha en la de su universidad). Norberto: una línea fija, «¿Ya
 * te habías alistado y no ves tu clase/personaje? Hay un 99 % de probabilidades de que estés en otra cuenta», y una ayuda: elige
 * su grupo (o pone su PER) y su alias si se acuerda, ve su avatar y, al pulsarlo, una PARTE de su correo; y un botón para salir y
 * entrar con esa cuenta.
 *
 * El servidor: `modPistaCuenta` (functions/modPistaCuenta.js): solo contesta a una cuenta sin ficha en ese grupo, el correo va
 * enmascarado y hay un tope por hora. Esta pieza es la línea y la ventana. 🔴 Si la función no responde (sin desplegar, sin red),
 * la ventana lo dice y deja el botón de entrar con otra cuenta: la línea de ayuda sigue valiendo sola.
 *
 * Sin textos ni colores de ningún mod: los textos son neutros y cada web los cambia (`textos`); la piel, en variables `--gpo-*` y en
 * las clases de botón de la web (`clases`). Ventana como «Leer más…» (CLAUDE.md, 6-oct): velo, × y Esc; pulsar dentro no la cierra;
 * en el móvil ocupa la pantalla. Los avatares, en rejilla de tarjetas iguales. Cada web la copia en su build (`guardas.copiar_pieza`)
 * y NO se edita allí: aquí.
 *
 *   var O = GP.otraCuenta.crear({
 *     llamar,                          // (nombre, datos) → data (GP_SDK.llamador, o el de la web)
 *     grupo: "per-16450",              // si se sabe (la Nave, alistarse); si no, se pregunta
 *     nombreGrupo: "PER 16450",        // (opcional) cómo se llama, para decirlo
 *     grupoDeTexto: function (t) {…},  // lo que teclea («16450», «PER 16450») → el id del grupo, o '' si no vale
 *     correo: "x@y.com",               // (opcional) la cuenta con la que ha entrado
 *     avatar: function (r) {…},        // { alias, avatar, xp } → la dirección de su imagen ('' = la inicial)
 *     entrarConOtra: function () {…},  // el selector de cuentas de Google (se llama dentro del clic)
 *     textos: { … }, clases: { boton: "btn primary", secundario: "btn" },
 *   });
 *   O.linea()            → el HTML de la línea fija, con su botón (data-gpo-abrir)
 *   O.montar(hueco)      → pinta la línea en `hueco` y engancha el botón
 *   O.abrir()            → abre la ventana
 * Pruebas: tests/sdk/otra-cuenta.test.ts. Lo del servidor, tests/functions/mod-pista-cuenta.test.ts.
 */
(function (raiz, fabrica) {
  var hecho = fabrica();
  if (typeof module === "object" && module.exports) module.exports = hecho;
  if (raiz) { raiz.GP = raiz.GP || {}; if (!raiz.GP.otraCuenta) raiz.GP.otraCuenta = hecho; }
})(typeof window !== "undefined" ? window : null, function () {
  var TEXTOS = {
    pregunta: "¿Ya te habías alistado y no ves tu clase o tu personaje?",
    probable: "Hay un 99 % de probabilidades de que estés en otra cuenta.",
    abrir: "Encontrar mi cuenta",
    titulo: "Encuentra la cuenta con la que te alistaste",
    ahora: "Ahora estás en {correo}, y con ella no tienes ficha en este grupo.",
    explica: "Busca tu personaje: al pulsar tu avatar verás una parte del correo con el que te alistaste.",
    grupo: "Tu grupo",
    grupoEjemplo: "El número de tu clase",
    grupoFijo: "Grupo: {grupo}",
    alias: "Tu alias (si te acuerdas)",
    buscar: "Buscar",
    todos: "No me acuerdo: ver todos los avatares",
    buscando: "Buscando…",
    toca: "Pulsa tu avatar:",
    noAlias: "No encuentro ese alias. Busca tu avatar entre los de tu clase:",
    vacio: "No hay nadie más en este grupo.",
    tuCuenta: "Te alistaste con esta cuenta:",
    pistaNota: "Por privacidad solo se ve una parte. Si la reconoces, entra con ella.",
    noPista: "No puedo darte la pista de ese avatar. Si es el tuyo, díselo a tu docente.",
    entrarCon: "Salir y entrar con esa cuenta",
    noSoyYo: "No es el mío",
    otraCuenta: "Entrar con otra cuenta",
    cerrar: "Cerrar",
    quedan: "Te quedan {n} pistas esta hora.",
    "sin-cuenta": "Entra con tu cuenta de Google.",
    "sin-grupo": "No encuentro ese grupo. Mira el número de tu clase.",
    "ya-estas": "Con esta cuenta ya estás en ese grupo: entra en tu clase.",
    tope: "Has pedido muchas pistas seguidas. Vuelve a intentarlo dentro de {minutos} min.",
    sinServidor: "Ahora mismo no puedo buscarla. Pulsa «Entrar con otra cuenta» y prueba con las cuentas de Google que tengas.",
  };
  var CSS = ""
    + ".gpo-linea{margin:0}.gpo-linea b{display:block}"
    + ".gpo-velo{position:fixed;inset:0;z-index:var(--gpo-capa,70);background:var(--gpo-velo,rgba(0,0,0,.6));display:flex;"
    +   "align-items:flex-start;justify-content:center;padding:var(--gpo-arriba,24px) 16px;overflow-y:auto;box-sizing:border-box}"
    + ".gpo-ventana{position:relative;width:100%;max-width:var(--gpo-ancho,560px);box-sizing:border-box;padding:22px 20px 20px;"
    +   "background:var(--gpo-fondo,#fff);color:var(--gpo-tinta,#1b1b1b);border:1px solid var(--gpo-borde,rgba(0,0,0,.15));"
    +   "border-radius:var(--gpo-radio,14px);box-shadow:var(--gpo-sombra,0 20px 60px rgba(0,0,0,.4));font:inherit;line-height:1.45}"
    + ".gpo-ventana h2{margin:0 40px 10px 0;font-size:1.2em;line-height:1.25;overflow-wrap:anywhere}"
    + ".gpo-ventana p{margin:0 0 10px;overflow-wrap:anywhere}"
    + ".gpo-cerrar{position:absolute;top:10px;right:10px;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:22px;line-height:1;"
    +   "background:transparent;color:inherit;border:1px solid var(--gpo-borde,rgba(0,0,0,.2))}"
    + ".gpo-campo{display:block;margin:0 0 10px;min-width:0}.gpo-campo span{display:block;font-size:.9em;margin-bottom:4px;opacity:.85}"
    + ".gpo-campo input{width:100%;max-width:100%;box-sizing:border-box;min-height:44px;padding:8px 12px;font:inherit;border-radius:10px;"
    +   "border:1px solid var(--gpo-borde,rgba(0,0,0,.25));background:var(--gpo-campo-fondo,#fff);color:inherit}"
    + ".gpo-botones{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}"
    + ".gpo-b{min-height:44px;min-width:0;max-width:100%;white-space:normal;cursor:pointer}"
    + ".gpo-boton{padding:10px 16px;border-radius:10px;border:0;font:inherit;font-weight:600;background:var(--gpo-acento,#1d4ed8);color:var(--gpo-acento-tinta,#fff)}"
    + ".gpo-secundario{padding:10px 16px;border-radius:10px;font:inherit;background:transparent;color:inherit;border:1px solid var(--gpo-borde,rgba(0,0,0,.25))}"
    + ".gpo-b[disabled]{opacity:.6;cursor:default}"
    + ".gpo-aviso{padding:10px 12px;border-radius:10px;background:var(--gpo-aviso-fondo,rgba(220,38,38,.1));color:var(--gpo-aviso-tinta,inherit)}"
    + ".gpo-rejilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));grid-auto-rows:1fr;gap:10px;margin:8px 0 4px}"
    + ".gpo-av{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;height:100%;box-sizing:border-box;padding:8px 6px;"
    +   "cursor:pointer;font:inherit;color:inherit;border-radius:12px;border:1px solid var(--gpo-borde,rgba(0,0,0,.2));background:var(--gpo-tarjeta,transparent)}"
    + ".gpo-av:hover,.gpo-av:focus-visible{border-color:var(--gpo-acento,#1d4ed8)}"
    + ".gpo-cara{width:64px;height:64px;border-radius:50%;object-fit:cover;flex:none;display:flex;align-items:center;justify-content:center;"
    +   "font-weight:700;font-size:1.4em;background:var(--gpo-cara-fondo,rgba(0,0,0,.08))}"
    + ".gpo-av b{font-size:.85em;line-height:1.2;max-width:100%;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;"
    +   "overflow-wrap:anywhere;text-align:center}"
    + ".gpo-elegido{display:flex;align-items:center;gap:14px;margin:6px 0 12px;min-width:0}.gpo-elegido .gpo-cara{width:84px;height:84px}"
    + ".gpo-elegido b{font-size:1.1em;overflow-wrap:anywhere;min-width:0}"
    + ".gpo-pista{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:1.15em;font-weight:700;padding:10px 12px;border-radius:10px;"
    +   "background:var(--gpo-pista-fondo,rgba(0,0,0,.06));overflow-wrap:anywhere;letter-spacing:.02em}"
    + ".gpo-poco{font-size:.85em;opacity:.8}"
    + "@media (max-width:600px){.gpo-velo{padding:0}.gpo-ventana{max-width:none;min-height:100%;min-height:100dvh;border-radius:0;border:0;"
    +   "padding:18px 16px calc(18px + env(safe-area-inset-bottom))}}";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /** «{correo}» → el dato, escapado. */
  function poner(t, datos) { return esc(t).replace(/\{(\w+)\}/g, function (m, k) { return datos && datos[k] != null ? "<b>" + esc(datos[k]) + "</b>" : m; }); }
  /** «Haló  Mundo» → «halo mundo» (la misma cuenta que el servidor). */
  function plano(t) {
    return String(t || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
  }
  /** Los reclutas cuyo alias contiene lo tecleado (a ojo). Sin alias, todos. */
  function filtrar(reclutas, alias) {
    var a = plano(alias);
    return (reclutas || []).filter(function (r) { return !a || plano(r.alias).indexOf(a) >= 0; });
  }
  /** La respuesta del servidor que no puede ser → el texto (con los minutos del tope). */
  function textoDelMotivo(r, T) {
    var t = T[r && r.motivo] || (r && r.texto) || T.sinServidor;
    return poner(t, { minutos: (r && r.minutos) || 60 });
  }

  function crear(o) {
    o = o || {};
    var T = {}; var k; for (k in TEXTOS) T[k] = TEXTOS[k]; for (k in (o.textos || {})) T[k] = o.textos[k];
    var clases = o.clases || {};
    var grupoFijo = typeof o.grupo === "string" && o.grupo ? o.grupo : "";
    var deTexto = typeof o.grupoDeTexto === "function" ? o.grupoDeTexto : function (t) { return String(t || "").trim(); };
    var cache = {};   // grupo → reclutas (una lectura por grupo y ventana)
    var st = { grupo: grupoFijo, texto: "", alias: "", reclutas: null };

    function linea() {
      return '<p class="gpo-linea"><b>' + esc(T.pregunta) + "</b> " + esc(T.probable) + "</p>"
        + '<p class="gpo-linea-boton"><button type="button" class="gpo-b gpo-secundario ' + esc(clases.secundario || "") + '" data-gpo-abrir>'
        + esc(T.abrir) + "</button></p>";
    }
    function montar(hueco) {
      if (!hueco) return;
      hueco.innerHTML = linea();
      var b = hueco.querySelector("[data-gpo-abrir]");
      if (b) b.addEventListener("click", function () { abrir(); });
    }

    // ─── la ventana ───
    var velo = null, alTeclear = null;
    function estilo() {
      if (typeof document === "undefined" || document.getElementById("gpo-estilo")) return;
      var s = document.createElement("style"); s.id = "gpo-estilo"; s.textContent = CSS; document.head.appendChild(s);
    }
    function cerrar() {
      if (!velo) return;
      velo.remove(); velo = null;
      if (alTeclear) { document.removeEventListener("keydown", alTeclear); alTeclear = null; }
    }
    function abrir() {
      estilo();
      cerrar();
      velo = document.createElement("div");
      velo.className = "gpo-velo";
      velo.innerHTML = '<div class="gpo-ventana" role="dialog" aria-modal="true" aria-labelledby="gpo-titulo">'
        + '<button type="button" class="gpo-cerrar" aria-label="' + esc(T.cerrar) + '">×</button>'
        + '<h2 id="gpo-titulo">' + esc(T.titulo) + '</h2><div class="gpo-cuerpo"></div></div>';
      document.body.appendChild(velo);
      velo.addEventListener("click", function (ev) { if (ev.target === velo) cerrar(); });
      velo.querySelector(".gpo-cerrar").addEventListener("click", cerrar);
      alTeclear = function (ev) { if (ev.key === "Escape") cerrar(); };
      document.addEventListener("keydown", alTeclear);
      buscar();
      return velo;
    }
    function cuerpo() { return velo && velo.querySelector(".gpo-cuerpo"); }
    function boton(texto, principal, attr) {
      return '<button type="button" class="gpo-b ' + (principal ? "gpo-boton " + esc(clases.boton || "") : "gpo-secundario " + esc(clases.secundario || ""))
        + '" ' + attr + ">" + esc(texto) + "</button>";
    }
    function cara(r, img) {
      var src = "";
      try { src = typeof o.avatar === "function" ? String(o.avatar(r) || "") : ""; } catch (e) { src = ""; }
      return src ? '<img class="gpo-cara" src="' + esc(src) + '" alt="">'
        : '<span class="gpo-cara" aria-hidden="true">' + esc((String(r.alias || "?").trim().charAt(0) || "?").toUpperCase()) + "</span>";
    }
    function pieOtra() { return '<div class="gpo-botones">' + boton(T.otraCuenta, false, "data-gpo-otra") + boton(T.cerrar, false, "data-gpo-cerrar") + "</div>"; }
    function enganchar(v) {
      var otra = v.querySelector("[data-gpo-otra]"), c = v.querySelector("[data-gpo-cerrar]");
      if (otra) otra.addEventListener("click", function () { otra.disabled = true; cerrar(); if (o.entrarConOtra) o.entrarConOtra(); });
      if (c) c.addEventListener("click", cerrar);
    }

    /** Pantalla 1: grupo (si no se sabe), alias y los avatares. */
    function buscar(aviso, lista, nota) {
      var v = cuerpo(); if (!v) return;
      v.innerHTML = (o.correo ? "<p>" + poner(T.ahora, { correo: o.correo }) + "</p>" : "")
        + "<p>" + esc(T.explica) + "</p>"
        + (grupoFijo
          ? (o.nombreGrupo ? "<p>" + poner(T.grupoFijo, { grupo: o.nombreGrupo }) + "</p>" : "")
          : '<label class="gpo-campo"><span>' + esc(T.grupo) + '</span><input data-gpo-grupo inputmode="text" autocomplete="off" spellcheck="false" placeholder="'
            + esc(T.grupoEjemplo) + '" value="' + esc(st.texto) + '"></label>')
        + '<label class="gpo-campo"><span>' + esc(T.alias) + '</span><input data-gpo-alias autocomplete="off" spellcheck="false" value="' + esc(st.alias) + '"></label>'
        + '<div class="gpo-botones">' + boton(T.buscar, true, "data-gpo-buscar") + boton(T.todos, false, "data-gpo-todos") + "</div>"
        + (aviso ? '<p class="gpo-aviso">' + aviso + "</p>" : "")
        + (lista ? (nota ? "<p>" + esc(nota) + "</p>" : "")
          + (lista.length ? '<div class="gpo-rejilla">' + lista.map(function (r, i) {
            return '<button type="button" class="gpo-av" data-gpo-av="' + i + '">' + cara(r) + "<b>" + esc(r.alias) + "</b></button>";
          }).join("") + "</div>" : "<p>" + esc(T.vacio) + "</p>") : "")
        + pieOtra();
      enganchar(v);
      var ig = v.querySelector("[data-gpo-grupo]"), ia = v.querySelector("[data-gpo-alias]");
      var leer = function () { if (ig) st.texto = ig.value; st.alias = ia ? ia.value : ""; };
      var ir = function (conAlias) { leer(); if (!conAlias) { st.alias = ""; } cargar(); };
      v.querySelector("[data-gpo-buscar]").addEventListener("click", function () { ir(true); });
      v.querySelector("[data-gpo-todos]").addEventListener("click", function () { ir(false); });
      [ig, ia].forEach(function (i) { if (i) i.addEventListener("keydown", function (ev) { if (ev.key === "Enter") ir(true); }); });
      (lista || []).forEach(function (r, i) {
        var b = v.querySelector('[data-gpo-av="' + i + '"]');
        if (b) b.addEventListener("click", function () { pista(r); });
      });
    }
    function grupoElegido() { return grupoFijo || deTexto(st.texto) || ""; }
    function ocupado() {
      var b = velo && velo.querySelectorAll(".gpo-b");
      if (b) for (var i = 0; i < b.length; i++) b[i].disabled = true;
      var x = velo && velo.querySelector("[data-gpo-buscar]"); if (x) x.textContent = T.buscando;
    }
    function cargar() {
      var g = grupoElegido();
      if (!g) return buscar(esc(T["sin-grupo"]));
      ocupado();
      var listo = cache[g] ? Promise.resolve(cache[g]) : o.llamar("modPistaCuenta", { accion: "avatares", projectId: g });
      return Promise.resolve(listo).then(function (r) {
        if (!r || r.ok === false || !Array.isArray(r.reclutas)) return buscar(textoDelMotivo(r, T));
        cache[g] = r; st.grupo = g;
        var todos = r.reclutas, f = filtrar(todos, st.alias);
        if (st.alias && !f.length) return buscar("", todos, T.noAlias);
        buscar("", f, T.toca);
      }, function () { buscar(esc(T.sinServidor)); });
    }
    /** Pantalla 2: su avatar y la pista. */
    function pista(r) {
      ocupado();
      return Promise.resolve(o.llamar("modPistaCuenta", { accion: "pista", projectId: st.grupo, alias: r.alias })).then(function (p) {
        var v = cuerpo(); if (!v) return;
        if (!p || p.ok === false) return buscar(textoDelMotivo(p, T));
        var hay = p.encontrado === true && p.pista;
        v.innerHTML = '<div class="gpo-elegido">' + cara(hay ? p : r) + "<b>" + esc((hay ? p : r).alias) + "</b></div>"
          + (hay
            ? "<p>" + esc(T.tuCuenta) + '</p><p class="gpo-pista" data-gpo-pista>' + esc(p.pista) + "</p><p>" + esc(T.pistaNota) + "</p>"
              + '<div class="gpo-botones">' + boton(T.entrarCon, true, "data-gpo-entrar") + boton(T.noSoyYo, false, "data-gpo-volver") + "</div>"
            : '<p class="gpo-aviso">' + esc(T.noPista) + '</p><div class="gpo-botones">' + boton(T.noSoyYo, false, "data-gpo-volver")
              + boton(T.otraCuenta, false, "data-gpo-otra") + "</div>")
          + (typeof p.quedan === "number" && p.quedan <= 2 ? '<p class="gpo-poco">' + poner(T.quedan, { n: p.quedan }) + "</p>" : "");
        enganchar(v);
        var e = v.querySelector("[data-gpo-entrar]");
        if (e) e.addEventListener("click", function () { e.disabled = true; cerrar(); if (o.entrarConOtra) o.entrarConOtra(); });
        v.querySelector("[data-gpo-volver]").addEventListener("click", function () { cargar(); });
      }, function () { buscar(esc(T.sinServidor)); });
    }

    return { linea: linea, montar: montar, abrir: abrir, cerrar: cerrar };
  }

  return { crear: crear, plano: plano, filtrar: filtrar, TEXTOS: TEXTOS };
});
