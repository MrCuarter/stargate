/**
 * GAMIFICAPRO · LA LECCIÓN: EL BLOQUE CENTRAL DE LA CLASE, SIN GENIALLY (11-nov-2026) — pieza del motor para cualquier mod.
 *
 * Norberto (11-nov): «Quiero hacer COMPLETAS las presentaciones… La parte central es Genially. Me gustaría poder prescindir de
 * Genially y hacerlo todo dentro de nuestra plataforma… clases muy prácticas con mínimo de teoría». Nació en STARGATE el mismo día
 * (la clase era esa tarde: excepción de urgencia) y se trajo aquí en la misma semana (docs/PLAN_CENTRALIZAR.md §6).
 *
 * Una lección son diapositivas que se pintan a partir de DATOS (el contenido es del mod). Cada diapositiva es un dict con `tipo`,
 * `titulo`, `rot` (su nombre en la barra), `kicker` (la etiqueta de arriba), `notas` (el guion del presentador, opcional) y lo suyo:
 *   tarjetas · tarjetas=[[titulo, texto]], pie                       todas iguales, una idea por tarjeta (la regla del aire)
 *   piezas   · talentos, niveles, pie                                 las columnas y las filas de la matriz, en chips y escalera
 *   matriz   · ejemplo (lo resuelve el mod: o.matriz.ejemplo), pie     la matriz pulsable: cada casilla con actividad se lee al lado
 *   ejemplos · ejemplos=[[titulo, quien, que, url, "aparte"?]]         «Verlo aquí» (visor dentro de la diapositiva, Esc lo cierra)
 *                                                                     y «Abrir aparte»; `url` puede ser una clave de o.enlaces
 *   manos    · pasos=[[titulo, texto]], minutos, consejo              manos a la obra: pasos numerados (el consejo, en el hueco del
 *                                                                     último) y el cronómetro; al lado, lo que añada el mod (extras)
 *   galeria  · (nada más: lo pone el mod en o.extras.galeria)        lo que ha creado la clase, con el mismo visor de los ejemplos
 *   ia       · prompt, criterio=[texto]                               el prompt para copiar y lo que decide el criterio docente
 *   lista    · items=[texto]                                          la lista de comprobación (se marca en pantalla; no se guarda)
 * En los textos, **así** va en negrita (o.fuerte); lo demás, texto (sin HTML de nadie).
 *
 * Lo puro (lo prueba tests/sdk/leccion.test.ts):
 *   GP.leccion.TIPOS                    → los tipos de diapositiva que sabe pintar.
 *   GP.leccion.elegir(lecciones, clave, { busqueda, aulas, per, quien, fuera, param }) → la lección de esa clave (p. ej., la semana)
 *       o null. Quién la ve es CONFIGURACIÓN del mod: `aulas` = [[grupo, docente]] (docente null = todo el grupo); `fuera` = este
 *       grupo no la lleva (p. ej., un tipo de grupo con otro calendario). En la URL, `?leccion=1` la enseña en cualquier grupo y
 *       `?leccion=0` la quita (`param` cambia el nombre).
 *   GP.leccion.dias(L, o)               → [{ k, tipo, rot, guion, html, montar? }] y lo de `o.base` (lo que el mod pone en cada
 *       diapositiva: su sección, su tiempo…). `montar(el)` engancha lo que se pulsa y devuelve con qué soltarlo (o null).
 *       Opciones (todas con valor por defecto; la piel es del mod):
 *         prefijo ("lc-"): la clave de cada diapositiva, prefijo + su número (las notas propias del docente van por clave).
 *         fondo (""): HTML que va detrás, dentro de la diapositiva.
 *         clases: { dia: "lc-dia lct-{tipo}", kicker: "lc-kicker", boton: "lc-btn lc-btn-base", botonPrincipal: "lc-btn lc-btn-base lc-btn-p" }
 *         icono(nombre) → HTML ("cabecera", "consejo", "reloj"): sin él, sin icono.
 *         fuerte(texto) → HTML: por defecto, escapa y pone **negritas**.
 *         matriz: { columnas, filas, corto: {columna: "abreviada"}, ejemplo(d) → { unidad: { fuerte, texto }, celdas: [{ col, fila,
 *                  titulo, texto, tipo, marca }] } }   (sin ejemplo o sin celdas, la diapositiva de la matriz no sale)
 *         enlaces: { CLAVE: url }: las direcciones que el dato nombra por clave (p. ej., la plantilla).
 *         cronometro: { html(min), montar(el) }: el reloj del mod; sin él, uno sencillo del motor (Empezar, Pausa, ↺).
 *         extras: { tipo: { html(d), montar(el) } }: lo que el mod añade a un tipo (11-nov, STARGATE: el tablero de la práctica en
 *                  vivo). En «manos», al lado del reloj; en «galeria», es su contenido (sin él, la galería no sale). Su montar va
 *                  junto al de la pieza y se suelta con él.
 *         textos: los de la interfaz (TEXTOS, abajo).
 *         estilos (true): mete GP.leccion.CSS en la página la primera vez (al final del <head>, como las demás piezas). La piel del
 *                  mod: las variables --gpl-* en el contenedor de la diapositiva y, para cambiar algo más, reglas más específicas.
 *
 * Cada web la copia en su build (assets/js/leccion.js) y NO se edita allí: aquí. La piel, con --gpl-* (valores por defecto abajo).
 */
(function (raiz, fabrica) {
  var L = fabrica(raiz);
  if (typeof module === "object" && module.exports) module.exports = L;
  if (raiz) { raiz.GP = raiz.GP || {}; if (!raiz.GP.leccion) raiz.GP.leccion = L; }
})(typeof window !== "undefined" ? window : null, function (W) {
  "use strict";
  var TIPOS = ["tarjetas", "piezas", "matriz", "ejemplos", "manos", "galeria", "ia", "lista"];
  var TEXTOS = {
    verAqui: "Verlo aquí", aparte: "Abrir aparte ↗", cerrar: "Cerrar", visor: "Ejemplo", visorGaleria: "Lo que ha creado",
    pista: "Pulsa una casilla de color para leer su actividad.", matrizAria: "Matriz de programación",
    prompt: "El prompt", copiar: "Copiar", copiado: "Copiado", copiaAMano: "Selecciónalo y cópialo", criterio: "Y lo decide tu criterio",
    listo: "Todo listo: ya puedes entregarlo.", cuenta: function (n, t) { return n + " de " + t + " comprobado" + (n === 1 ? "" : "s"); },
    tipos: { obligatoria: "Obligatoria", optativa: "Optativa", voluntaria: "Voluntaria" },
    reloj: "El reloj de la práctica", empezar: "▶ Empezar", pausa: "Pausa", reiniciar: "Reiniciar"
  };
  var CLASES = { dia: "lc-dia lct-{tipo}", kicker: "lc-kicker", boton: "lc-btn lc-btn-base", botonPrincipal: "lc-btn lc-btn-base lc-btn-p" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function fuerteBase(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
  function mmss(seg) { var m = Math.floor(seg / 60), s = seg % 60; return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function mezcla(a, b) { var r = {}, k; for (k in a) r[k] = a[k]; for (k in (b || {})) if (b[k] !== undefined) r[k] = b[k]; return r; }
  function cierra(el, sel) { return function (e) { return e.target && e.target.closest ? e.target.closest(sel) : null; }; }

  // ─────────────────────────────────────────────────────────── quién la ve
  function elegir(lecciones, clave, o) {
    o = o || {};
    var L = (lecciones || {})[String(clave)];
    if (!L || !L.dias || !L.dias.length) return null;
    var p = String(o.param || "leccion").replace(/[^\w-]/g, ""), q = String(o.busqueda || "");
    if (new RegExp("[?&]" + p + "=0\\b").test(q)) return null;
    if (new RegExp("[?&]" + p + "=1\\b").test(q)) return L;
    if (o.fuera) return null;
    var per = String(o.per || ""), quien = String(o.quien || "").trim();
    return (o.aulas || []).some(function (a) { return a && a[0] === per && (!a[1] || a[1] === quien); }) ? L : null;
  }

  // ─────────────────────────────────────────────────────────── las diapositivas
  function dias(L, o) {
    o = o || {};
    if (o.estilos !== false) estilo();
    var c = {
      T: mezcla(TEXTOS, o.textos), K: mezcla(CLASES, o.clases), fondo: o.fondo || "", fuerte: o.fuerte || fuerteBase,
      icono: function (n) { var x = o.icono ? o.icono(n) : ""; return x ? x + " " : ""; },
      matriz: o.matriz || {}, enlaces: o.enlaces || {}, cronometro: o.cronometro || null, extras: o.extras || {}
    };
    c.T.tipos = mezcla(TEXTOS.tipos, o.textos && o.textos.tipos);
    var prefijo = o.prefijo == null ? "lc-" : o.prefijo;
    return ((L && L.dias) || []).map(function (d, i) {
      var x = dia(L, d, c);
      if (!x) return null;
      var r = mezcla({ k: prefijo + (i + 1) }, o.base);
      r.tipo = d.tipo; r.rot = d.rot || d.titulo; r.guion = d.notas || null; r.html = x.html;
      if (x.montar) r.montar = x.montar;
      return r;
    }).filter(Boolean);
  }

  function dia(L, d, c) {
    var T = c.T, K = c.K, f = c.fuerte;
    var abre = '<div class="' + esc(K.dia.replace(/\{tipo\}/g, d.tipo)) + '">' + c.fondo + '<div class="lc-caja">' +
      '<div class="' + esc(K.kicker) + '">' + c.icono("cabecera") + esc(L.parte) + " · " + esc(d.kicker || "") + "</div><h2>" + esc(d.titulo) + "</h2>";
    var fin = "</div></div>", pie = d.pie ? '<p class="lc-pie">' + f(d.pie) + "</p>" : "";
    var M = c.matriz, X = c.extras[d.tipo] || null, xhtml = X && X.html ? X.html(d) || "" : "";

    if (d.tipo === "tarjetas") return { html: abre +
      '<div class="lc-tarjetas" style="--n:' + (d.tarjetas || []).length + '">' + (d.tarjetas || []).map(function (t, i) {
        return '<div class="lc-tarjeta" style="--i:' + i + '"><b class="lc-num">' + (i + 1) + "</b><h3>" + esc(t[0]) + "</h3><p>" + f(t[1]) + "</p></div>"; }).join("") + "</div>" +
      pie + fin };

    if (d.tipo === "piezas") {
      var cols = M.columnas || [], filas = (M.filas || []).slice().reverse();
      return { html: abre + '<div class="lc-piezas">' +
        '<div class="lc-pieza"><p class="lc-pieza-t">' + f(d.talentos) + '</p><ul class="lc-chips">' + cols.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" +
        '<div class="lc-pieza"><p class="lc-pieza-t">' + f(d.niveles) + '</p><ol class="lc-escalera">' + filas.map(function (x, i) {
          return '<li style="--i:' + i + '"><span>' + (i + 1) + "</span>" + esc(x) + "</li>"; }).join("") + "</ol></div>" +
        "</div>" + pie + fin };
    }

    if (d.tipo === "matriz") {
      var EJ = (M.ejemplo && M.ejemplo(d)) || {}, A = (EJ.celdas || []).filter(Boolean);
      if (!A.length) return null;
      var IMs = M.columnas || [], BL = M.filas || [], corto = M.corto || {};
      var celda = function (im, bl) { return A.filter(function (a) { return a.col === im && a.fila === bl; })[0]; };
      var tabla = '<div class="lc-mz" role="grid" aria-label="' + esc(T.matrizAria) + '">' +
        '<div class="lc-mz-esq"></div>' + IMs.map(function (im) {
          return '<div class="lc-mz-col" title="' + esc(im) + '"><span class="lc-largo">' + esc(im) + '</span><span class="lc-corto">' + esc(corto[im] || im) + "</span></div>"; }).join("");
      BL.forEach(function (bl) {
        tabla += '<div class="lc-mz-fila">' + esc(bl) + "</div>";
        IMs.forEach(function (im) {
          var a = celda(im, bl);
          tabla += a ? '<button type="button" class="lc-mz-c con t-' + esc(a.tipo) + '" data-lc-a="' + A.indexOf(a) + '" aria-label="' + esc(a.titulo + " · " + im + " × " + bl) + '"><span>' + esc(a.titulo) + "</span></button>"
                     : '<div class="lc-mz-c"></div>';
        });
      });
      tabla += "</div>";
      var U = EJ.unidad || {};
      return { montar: montarMatriz(A, T), html: abre +
        (U.fuerte || U.texto ? '<p class="lc-unidad"><b>' + esc(U.fuerte || "") + "</b>" + esc(U.texto || "") + "</p>" : "") +
        '<div class="lc-mz-zona">' + tabla + '<div class="lc-mz-det" aria-live="polite"><p class="lc-mz-pista">' + esc(T.pista) + "</p></div></div>" +
        '<p class="lc-leyenda">' + Object.keys(T.tipos).map(function (k) { return '<span class="t-' + esc(k) + '"><i></i>' + esc(T.tipos[k]) + "</span>"; }).join("") + "</p>" +
        pie + fin };
    }

    if (d.tipo === "ejemplos") {
      var E = (d.ejemplos || []).map(function (e) {
        var u = Object.prototype.hasOwnProperty.call(c.enlaces, e[3]) ? c.enlaces[e[3]] : e[3];
        return { t: e[0], quien: e[1], que: e[2], url: u, aparte: e[4] === "aparte" };
      }).filter(function (e) { return e.url; });
      return { montar: montarVisor, html: abre +
        '<div class="lc-tarjetas lc-ejemplos" style="--n:' + E.length + '">' + E.map(function (e, i) {
          return '<div class="lc-tarjeta" style="--i:' + i + '"><h3>' + esc(e.t) + '</h3><p class="lc-quien">' + esc(e.quien) + "</p><p>" + esc(e.que) + "</p>" +
            '<div class="lc-bots">' + (e.aparte ? "" : '<button type="button" class="' + esc(K.botonPrincipal) + '" data-lc-ver="' + esc(e.url) + '" data-lc-tit="' + esc(e.t) + '">' + esc(T.verAqui) + "</button>") +
            '<a class="' + esc(K.boton) + '" href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(T.aparte) + "</a></div></div>"; }).join("") + "</div>" +
        visor(T, K, T.visor) + fin };
    }

    if (d.tipo === "manos") {
      var min = Number(d.minutos) || 20, R = c.cronometro;
      var reloj = R ? R.html(min) : cronoBase(min, T, K, c.icono("reloj"));
      return { montar: juntos(R ? R.montar : montarCronoBase, X && X.montar), html: abre +
        '<div class="lc-manos"><ol class="lc-pasos">' + (d.pasos || []).map(function (p, i) {
          return '<li style="--i:' + i + '"><b class="lc-num">' + (i + 1) + "</b><div><b>" + esc(p[0]) + "</b> " + f(p[1]) + "</div></li>"; }).join("") +
        // (el consejo, en el hueco que dejan los pasos en dos columnas: el lado queda para el reloj y lo del mod)
        (d.consejo ? '<li class="lc-consejo" style="--i:' + (d.pasos || []).length + '">' + c.icono("consejo") + "<div>" + f(d.consejo) + "</div></li>" : "") + "</ol>" +
        '<div class="lc-lado">' + reloj + xhtml + "</div></div>" + fin };
    }

    if (d.tipo === "galeria") {
      if (!X) return null;
      return { montar: juntos(montarVisor, X.montar), html: abre + xhtml + visor(T, K, T.visorGaleria) + fin };
    }

    if (d.tipo === "ia") return { montar: montarCopiar(T), html: abre +
      '<div class="lc-ia"><div class="lc-prompt"><div class="lc-prompt-t"><b>' + esc(T.prompt) + '</b><button type="button" class="' + esc(K.boton) + '" data-lc-copiar>' + esc(T.copiar) + "</button></div>" +
      '<p class="lc-prompt-x">' + esc(d.prompt) + "</p></div>" +
      '<div class="lc-criterio"><b>' + esc(T.criterio) + "</b><ul>" + (d.criterio || []).map(function (x) { return "<li>" + f(x) + "</li>"; }).join("") + "</ul></div></div>" + fin };

    if (d.tipo === "lista") return { montar: montarLista(T), html: abre +
      '<ul class="lc-lista">' + (d.items || []).map(function (it, i) {
        return '<li><label><input type="checkbox" data-lc-i="' + i + '"> <span>' + f(it) + "</span></label></li>"; }).join("") + "</ul>" +
      '<p class="lc-pie lc-cuenta" aria-live="polite"></p>' + fin };

    return null;
  }

  function visor(T, K, titulo) {
    return '<div class="lc-visor" hidden><div class="lc-visor-barra"><b class="lc-visor-t"></b><a class="' + esc(K.boton) + ' lc-visor-ap" target="_blank" rel="noopener">' + esc(T.aparte) + "</a>" +
      '<button type="button" class="' + esc(K.boton) + ' lc-visor-x">' + esc(T.cerrar) + '</button></div><iframe title="' + esc(titulo) + '" allowfullscreen allow="fullscreen"></iframe></div>';
  }
  // dos montajes en uno (el de la pieza y el del mod), con su limpieza
  function juntos(f, g) {
    if (!g) return f;
    return function (el) { var a = f(el), b = g(el); return function () { if (a) a(); if (b) b(); }; };
  }

  // ─────────────────────────────────────────────────────────── lo que se pulsa
  // (cada clic que es de la lección no sigue hacia arriba: la presentación no pasa de diapositiva)
  function montarMatriz(A, T) {
    return function (el) {
      var det = el.querySelector(".lc-mz-det"); if (!det) return null;
      var dentro = cierra(el, "[data-lc-a]");
      el.addEventListener("click", function (e) {
        var b = dentro(e); if (!b) return;
        e.stopPropagation();
        var a = A[Number(b.getAttribute("data-lc-a"))]; if (!a) return;
        Array.prototype.forEach.call(el.querySelectorAll(".lc-mz-c.sel"), function (x) { x.classList.remove("sel"); });
        b.classList.add("sel");
        det.innerHTML = '<div class="lc-mz-cruce">' + esc(a.col) + " × " + esc(a.fila) + "</div><h3>" + (a.marca ? esc(a.marca) + " · " : "") + esc(a.titulo) + "</h3><p>" + esc(a.texto) + "</p>" +
          '<span class="lc-tipo t-' + esc(a.tipo) + '">' + esc(T.tipos[a.tipo] || a.tipo) + "</span>";
      });
      return null;
    };
  }
  function montarVisor(el) {
    var v = el.querySelector(".lc-visor"); if (!v) return null;
    var fr = v.querySelector("iframe"), t = v.querySelector(".lc-visor-t"), ap = v.querySelector(".lc-visor-ap");
    var cerrar = function () { v.hidden = true; fr.removeAttribute("src"); el.classList.remove("lc-con-visor"); };
    var tecla = function (e) { if (e.key === "Escape" && !v.hidden) { e.stopPropagation(); cerrar(); } };
    el.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-lc-ver]");
      if (b) { e.stopPropagation(); var u = b.getAttribute("data-lc-ver"); t.textContent = b.getAttribute("data-lc-tit") || ""; ap.href = u; fr.src = u; v.hidden = false; el.classList.add("lc-con-visor"); return; }
      if (e.target.closest && e.target.closest(".lc-visor-x")) { e.stopPropagation(); cerrar(); }
    });
    var doc = el.ownerDocument || (W && W.document);
    doc.addEventListener("keydown", tecla, true);
    return function () { doc.removeEventListener("keydown", tecla, true); cerrar(); };
  }
  function montarCopiar(T) {
    return function (el) {
      var b = el.querySelector("[data-lc-copiar]"), x = el.querySelector(".lc-prompt-x"); if (!b || !x) return null;
      var nav = W && W.navigator;
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var ok = function () { b.textContent = T.copiado; setTimeout(function () { b.textContent = T.copiar; }, 2000); };
        var txt = x.textContent;
        if (nav && nav.clipboard && nav.clipboard.writeText) nav.clipboard.writeText(txt).then(ok, function () { b.textContent = T.copiaAMano; });
        else b.textContent = T.copiaAMano;
      });
      return null;
    };
  }
  function montarLista(T) {
    return function (el) {
      var cajas = el.querySelectorAll("[data-lc-i]"), cuenta = el.querySelector(".lc-cuenta"); if (!cajas.length) return null;
      var pinta = function () {
        var n = 0; Array.prototype.forEach.call(cajas, function (c) { if (c.checked) n++; });
        cuenta.textContent = n === cajas.length ? T.listo : T.cuenta(n, cajas.length);
      };
      el.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("label")) e.stopPropagation(); });
      el.addEventListener("change", pinta);
      pinta();
      return null;
    };
  }
  // el cronómetro sencillo del motor (si el mod no trae el suyo)
  function cronoBase(min, T, K, ico) {
    return '<div class="lc-crono" data-min="' + min + '"><div class="lc-crono-t">' + ico + esc(T.reloj) + "</div>" +
      '<div class="lc-crono-r" aria-live="polite">' + mmss(min * 60) + "</div>" +
      '<div class="lc-crono-b"><button type="button" class="' + esc(K.botonPrincipal) + '" data-lc-crono="go">' + esc(T.empezar) + "</button>" +
      '<button type="button" class="' + esc(K.boton) + '" data-lc-crono="pausa">' + esc(T.pausa) + "</button>" +
      '<button type="button" class="' + esc(K.boton) + '" data-lc-crono="reset" aria-label="' + esc(T.reiniciar) + '">↺</button></div></div>';
  }
  function montarCronoBase(el) {
    var c = el.querySelector(".lc-crono"); if (!c) return null;
    var total = Number(c.getAttribute("data-min") || 20) * 60, queda = total, tic = null, r = c.querySelector(".lc-crono-r");
    var pinta = function () { r.textContent = mmss(Math.max(0, queda)); c.classList.toggle("fin", queda <= 0); c.classList.toggle("ultimo", queda > 0 && queda <= 60); };
    var para = function () { if (tic) { clearInterval(tic); tic = null; } c.classList.remove("corre"); };
    c.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-lc-crono]"); if (!b) return;
      e.stopPropagation();
      var a = b.getAttribute("data-lc-crono");
      if (a === "go" && !tic && queda > 0) { c.classList.add("corre"); tic = setInterval(function () { queda--; pinta(); if (queda <= 0) para(); }, 1000); }
      else if (a === "pausa") para();
      else if (a === "reset") { para(); queda = total; pinta(); }
    });
    pinta();
    return para;
  }

  // ─────────────────────────────────────────────────────────── la piel por defecto (--gpl-*)
  // Tarjetas iguales en rejilla (la regla del aire, minmax(0,1fr)); zonas de pulsar de 40 px; en pantallas pequeñas, una columna.
  var CSS =
    "@keyframes gpl-sube{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}" +
    ".lc-dia{position:relative}" +
    ".lc-caja{display:flex;flex-direction:column;gap:12px;min-width:0;flex:0 1 auto}" +
    ".lc-kicker{font-size:.8rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--gpl-acento2,#5ad0eb)}" +
    ".lc-tarjetas{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:14px;align-items:stretch}" +
    ".lc-tarjeta{background:var(--gpl-tarjeta,rgba(13,20,32,.82));border:1px solid var(--gpl-linea,#1c2c40);border-radius:16px;padding:18px 18px 16px;min-width:0;" +
      "display:flex;flex-direction:column;gap:6px;animation:gpl-sube .5s both;animation-delay:calc(var(--i,0)*110ms)}" +
    ".lc-tarjeta h3{margin:0;font-size:clamp(1rem,1.7vw,1.25rem);color:var(--gpl-titulo,#eafcff)}" +
    ".lc-tarjeta p{margin:0;font-size:clamp(.98rem,1.45vw,1.12rem);line-height:1.5;color:var(--gpl-texto,#d5e2ec)}" +
    ".lc-tarjeta b{color:var(--gpl-fuerte,#fff)}" +
    ".lc-num{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--gpl-acento-fondo,rgba(55,224,236,.14));" +
      "color:var(--gpl-acento,#37e0ec);font-family:var(--gpl-letra-num,inherit);font-size:.95rem;flex:none}" +
    ".lc-pie{margin:2px 0 0;color:var(--gpl-suave,#9fb2c2);font-size:clamp(.95rem,1.35vw,1.08rem);line-height:1.5}" +
    ".lc-pie b{color:var(--gpl-tinta,#e9f0f6)}" +
    ".lc-quien{color:var(--gpl-calido,#f5b043)!important;font-size:.92rem!important;font-weight:700}" +
    ".lc-bots{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:8px}" +
    ".lc-bots .lc-btn{min-height:40px}" +
    ".lc-btn-base{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid var(--gpl-linea,#1c2c40);" +
      "background:transparent;color:inherit;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}" +
    ".lc-btn-base.lc-btn-p{background:var(--gpl-acento,#37e0ec);border-color:var(--gpl-acento,#37e0ec);color:#05101a}" +
    /* las dos piezas */
    ".lc-piezas{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:16px}" +
    ".lc-pieza{background:var(--gpl-tarjeta,rgba(13,20,32,.82));border:1px solid var(--gpl-linea,#1c2c40);border-radius:16px;padding:16px 18px;min-width:0}" +
    ".lc-pieza-t{margin:0 0 10px;color:var(--gpl-texto,#d5e2ec);font-size:1.02rem}" +
    ".lc-chips{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}" +
    ".lc-chips li{padding:9px 12px;border-radius:10px;background:var(--gpl-chip,rgba(55,224,236,.1));border:1px solid var(--gpl-chip-borde,rgba(55,224,236,.25));font-weight:700;" +
      "font-size:1rem;overflow-wrap:anywhere}" +
    ".lc-escalera{list-style:none;margin:0;padding:0;display:flex;flex-direction:column-reverse;gap:6px}" +
    ".lc-escalera li{display:flex;gap:10px;align-items:center;padding:8px 12px;border-radius:10px;background:var(--gpl-peldano,rgba(245,176,67,.1));" +
      "border:1px solid var(--gpl-peldano-borde,rgba(245,176,67,.28));font-weight:700;margin-left:calc(var(--i,0)*4%)}" +
    ".lc-escalera span{color:var(--gpl-calido,#f5b043);font-family:var(--gpl-letra-num,inherit);font-size:.85rem}" +
    /* la matriz */
    ".lc-unidad{margin:0;color:var(--gpl-texto,#d5e2ec);font-size:1rem}" +
    ".lc-unidad b{color:var(--gpl-calido,#f5b043)}" +
    ".lc-mz-zona{display:grid;grid-template-columns:minmax(0,1fr) minmax(200px,26%);gap:14px;align-items:stretch;min-height:0}" +
    ".lc-mz{display:grid;grid-template-columns:minmax(96px,1fr) repeat(8,minmax(0,1fr));gap:3px;font-size:.78rem;min-width:0}" +
    ".lc-mz-col{padding:4px 2px;text-align:center;color:var(--gpl-acento2,#5ad0eb);font-weight:800;line-height:1.15;overflow-wrap:anywhere;align-self:end}" +
    ".lc-mz-col .lc-largo{display:none}" +
    "@media (min-width:1400px){ .lc-mz-col .lc-largo{display:inline} .lc-mz-col .lc-corto{display:none} }" +
    ".lc-mz-fila{padding:4px 6px;color:var(--gpl-calido,#f5b043);font-weight:800;display:flex;align-items:center}" +
    ".lc-mz-c{min-height:44px;border-radius:7px;background:var(--gpl-celda,rgba(255,255,255,.04));border:1px solid var(--gpl-celda-borde,rgba(255,255,255,.06));min-width:0}" +
    "button.lc-mz-c{font:inherit;color:var(--gpl-fuerte,#fff);cursor:pointer;padding:3px;display:flex;align-items:center;justify-content:center;text-align:center;" +
      "line-height:1.15;font-weight:700;overflow:hidden}" +
    "button.lc-mz-c span{overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow-wrap:anywhere}" +
    ".lc-mz-c.t-obligatoria,.lc-leyenda .t-obligatoria i,.lc-tipo.t-obligatoria{background:var(--gpl-obligatoria,rgba(95,207,122,.32));border-color:var(--gpl-obligatoria-borde,#5fcf7a)}" +
    ".lc-mz-c.t-optativa,.lc-leyenda .t-optativa i,.lc-tipo.t-optativa{background:var(--gpl-optativa,rgba(74,168,255,.32));border-color:var(--gpl-optativa-borde,#4aa8ff)}" +
    ".lc-mz-c.t-voluntaria,.lc-leyenda .t-voluntaria i,.lc-tipo.t-voluntaria{background:var(--gpl-voluntaria,rgba(245,197,66,.3));border-color:var(--gpl-voluntaria-borde,#f5c542)}" +
    "button.lc-mz-c:hover,button.lc-mz-c.sel{outline:2px solid var(--gpl-fuerte,#fff);outline-offset:1px}" +
    ".lc-mz-det{background:var(--gpl-detalle,rgba(13,20,32,.88));border:1px solid var(--gpl-linea,#1c2c40);border-radius:14px;padding:14px 16px;min-width:0}" +
    ".lc-mz-det h3{margin:4px 0 6px;font-size:1.1rem}" +
    ".lc-mz-det p{margin:0 0 10px;color:var(--gpl-texto,#d5e2ec);line-height:1.5}" +
    ".lc-mz-pista{color:var(--gpl-suave,#9fb2c2)!important}" +
    ".lc-mz-cruce{color:var(--gpl-acento2,#5ad0eb);font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em}" +
    ".lc-tipo{display:inline-block;padding:3px 10px;border-radius:999px;border:1px solid;font-weight:700;font-size:.85rem}" +
    ".lc-leyenda{display:flex;flex-wrap:wrap;gap:14px;margin:0;color:var(--gpl-suave,#9fb2c2);font-size:.92rem}" +
    ".lc-leyenda span{display:inline-flex;align-items:center;gap:6px}" +
    ".lc-leyenda i{width:14px;height:14px;border-radius:4px;border:1px solid;display:inline-block}" +
    /* el visor de ejemplos, dentro de la diapositiva */
    ".lc-visor{position:absolute;inset:10px;z-index:5;display:flex;flex-direction:column;background:var(--gpl-visor,#05080e);border:1px solid var(--gpl-linea,#1c2c40);border-radius:14px;overflow:hidden}" +
    ".lc-visor[hidden]{display:none}" +
    ".lc-visor-barra{display:flex;gap:8px;align-items:center;padding:8px 10px;border-bottom:1px solid var(--gpl-linea,#1c2c40)}" +
    ".lc-visor-t{margin-right:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".lc-visor iframe{flex:1;width:100%;border:0;background:#000}" +
    /* manos a la obra */
    ".lc-manos{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;align-items:start}" +
    ".lc-pasos{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-flow:column;grid-template-rows:repeat(4,auto);gap:8px 12px}" +
    ".lc-pasos li{display:flex;gap:12px;align-items:flex-start;background:var(--gpl-tarjeta,rgba(13,20,32,.82));border:1px solid var(--gpl-linea,#1c2c40);border-radius:12px;" +
      "padding:6px 12px;font-size:clamp(.95rem,1.3vw,1.04rem);line-height:1.35;animation:gpl-sube .45s both;animation-delay:calc(var(--i,0)*70ms)}" +
    ".lc-pasos li>div{min-width:0}" +
    ".lc-pasos li>div>b:first-child{display:block;color:var(--gpl-fuerte,#fff)}" +
    ".lc-pasos .lc-num{width:28px;height:28px;font-size:.8rem}" +
    ".lc-lado{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:12px;min-width:0;align-items:stretch}" +
    ".lc-pasos li.lc-consejo{border:0;border-left:3px solid var(--gpl-calido,#f5b043);border-radius:0 12px 12px 0;align-items:center;margin:0;padding:8px 14px;" +
      "background:var(--gpl-consejo,rgba(245,176,67,.08));line-height:1.5}" +
    ".lc-crono{padding:14px 18px;border-radius:16px;border:1px solid var(--gpl-linea,#1c2c40);background:var(--gpl-tarjeta,rgba(13,20,32,.82));display:grid;gap:8px;min-width:0}" +
    ".lc-crono-t{color:var(--gpl-acento2,#5ad0eb);font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em}" +
    ".lc-crono-r{font-family:var(--gpl-letra-num,inherit);font-size:clamp(2rem,5vw,3.2rem);font-weight:800;font-variant-numeric:tabular-nums;line-height:1}" +
    ".lc-crono.ultimo .lc-crono-r{color:var(--gpl-calido,#f5b043)}.lc-crono.fin .lc-crono-r{color:#ff8a8a}" +
    ".lc-crono-b{display:flex;flex-wrap:wrap;gap:8px}.lc-crono-b .lc-btn{min-height:40px}" +
    /* la IA de ayudante */
    ".lc-ia{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:16px;align-items:start}" +
    ".lc-prompt{background:var(--gpl-prompt,rgba(5,8,14,.9));border:1px solid var(--gpl-prompt-borde,#2a4a66);border-radius:14px;padding:14px 16px;min-width:0}" +
    ".lc-prompt-t{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;color:var(--gpl-acento2,#5ad0eb)}" +
    ".lc-prompt-t .lc-btn{min-height:40px}" +
    ".lc-prompt-x{margin:0;font-family:ui-monospace,Menlo,monospace;font-size:clamp(.9rem,1.3vw,1.02rem);line-height:1.55;color:var(--gpl-prompt-tinta,#eaf6ff);white-space:pre-wrap;overflow-wrap:anywhere}" +
    ".lc-criterio{background:var(--gpl-tarjeta,rgba(13,20,32,.82));border:1px solid var(--gpl-linea,#1c2c40);border-radius:14px;padding:14px 16px;min-width:0}" +
    ".lc-criterio ul{margin:8px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px;line-height:1.5}" +
    /* la lista */
    ".lc-lista{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}" +
    ".lc-lista label{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:12px;background:var(--gpl-tarjeta,rgba(13,20,32,.82));border:1px solid var(--gpl-linea,#1c2c40);" +
      "cursor:pointer;min-height:44px;line-height:1.45;font-size:clamp(.95rem,1.35vw,1.06rem)}" +
    ".lc-lista input{width:22px;height:22px;flex:none;margin-top:1px;accent-color:var(--gpl-acento,#37e0ec)}" +
    ".lc-lista label:has(input:checked){border-color:var(--gpl-acento,#37e0ec);background:var(--gpl-marcada,rgba(55,224,236,.08))}" +
    "@media (max-width:900px){" +
      ".lc-tarjetas{grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))}" +
      ".lc-piezas,.lc-manos,.lc-ia,.lc-mz-zona,.lc-lado{grid-template-columns:minmax(0,1fr)}" +
      ".lc-pasos{grid-template-columns:minmax(0,1fr);grid-auto-flow:row;grid-template-rows:none}" +
    "}" +
    "@media (max-width:620px){" +
      ".lc-lista,.lc-chips{grid-template-columns:minmax(0,1fr)}" +
      ".lc-mz{grid-template-columns:76px repeat(8,minmax(0,1fr));gap:2px;font-size:.75rem}" +
      ".lc-mz-col{writing-mode:vertical-rl;transform:rotate(180deg);justify-self:center;max-height:70px}" +
      "button.lc-mz-c span{display:none}" +
      ".lc-mz-c{min-height:34px}" +
      ".lc-mz-fila{padding:2px 3px}" +
    "}" +
    "@media (prefers-reduced-motion:reduce){ .lc-tarjeta,.lc-pasos li{animation:none} }" +
    /* en pantallas pequeñas o bajas, el visor ocupa la pantalla */
    "@media (max-width:900px),(max-height:560px){ .lc-visor{position:fixed;inset:8px;z-index:50} }";

  function estilo() {
    var D = W && W.document;
    if (!D || !D.head || D.getElementById("gp-leccion-estilo")) return;
    var s = D.createElement("style"); s.id = "gp-leccion-estilo"; s.textContent = CSS;
    D.head.appendChild(s);   // al final, como las demás piezas: la piel del mod manda con más especificidad (p. ej. «.mi-dia .lc-tarjeta») o con --gpl-*
  }

  return { TIPOS: TIPOS, TEXTOS: TEXTOS, CLASES: CLASES, CSS: CSS, elegir: elegir, dias: dias, estilo: estilo, fuerte: fuerteBase, esc: esc };
});
