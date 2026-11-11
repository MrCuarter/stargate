/**
 * GAMIFICAPRO · DE DÓNDE ERES: LA CIUDAD, EL PAÍS Y EL RANGO DE EDAD (16-oct-2026) — pieza del motor (pieza `origen` del servidor,
 * functions/modOrigen.js; el mapa, sdk/mapaMundo.js).
 *
 * Norberto (16-oct): «Al registrarse, el estudiante debe marcar su rango de edad y su ciudad/país de origen.» Decidido con la coordinación:
 * al alistarse son OBLIGATORIOS; la ciudad se escribe y se autocompleta, el país sale solo; si el nombre existe en varios países
 * (Santiago, Córdoba, Valencia, San José, Mérida…) se ofrecen todas con su región y su país; si no está, «Mi ciudad no está» con el país a
 * elegir. La lista es local (GeoNames, `sdk/ciudades.json`, la misma que valida el servidor) y se carga solo donde se pide, bajo demanda.
 * A quien ya estaba alistado se le pide una vez al entrar, con «Ahora no» que vuelve a preguntar una vez más (el servidor cuenta).
 * Cada web la copia en su build (`guardas.copiar_pieza`, con `ciudades.json`) y NO se edita allí: aquí. La piel: variables `--gpo-*`.
 *
 *   GP.origen.cargar(url)                    → Promise de la lista (una vez por página)
 *   GP.origen.buscar(lista, texto, max)      → [{ id, nombre, region, pais, nombrePais, otro }] (las que casan mejor y las más grandes primero;
 *                                              las ambiguas, todas con su región y su país). Sin tildes ni mayúsculas.
 *   GP.origen.paises(lista)                  → [{ pais, nombre, cerca }] (España, Portugal y Latinoamérica primero: `cerca`)
 *   GP.origen.EDADES                         → los rangos (los mismos del servidor)
 *   GP.origen.campos(el, o)                  → { valor() → lo que se manda a `guardar` | null, falta() → el texto de lo que falta | '',
 *                                              enfocar() } · o = { lista (la ya cargada) | url, inicial, alCambiar(), textos }
 *   GP.origen.guardar(o, valor)              → llama a modOrigen `guardar` (o = { llamar, projectId, via })
 *   GP.origen.pedir(o)                       → la ventana al entrar, si hace falta: o = { llamar, projectId, estado (la ficha: `modOrigen`),
 *                                              veces (2), excluir, url, alGuardar(r), clases, textos }. «Ahora no» → `aplazar`.
 *                                              11-nov: `modo` ('todo' | 'lugar' | 'edad'; sin él, `queFalta`), `directo` (al fichar en la clase
 *                                              en directo: solo la ciudad y el país, y «Ahora no» no cuenta) y `desde` (el aviso al entrar a
 *                                              quien no ha dicho nada, a partir de ese día: 'AAAA-MM-DD' o ms). En modo 'edad', su ciudad sale
 *                                              puesta (la pide con `mio`) y se puede cambiar.
 *   GP.origen.queFalta(estado, o)            → 'lugar' | 'edad' | 'todo' | '' (o = { veces, desde, directo, ahora }: lo mismo que el servidor)
 *   GP.origen.privacidad(el, o)              → el bloque de la ficha: dónde estás y «Mostrar solo mi país» (o = { llamar, projectId, url })
 *
 * 🔴 La edad nunca se enseña a nadie más: va al servidor y solo vuelve en cifras (Estadísticas). Pruebas: tests/sdk/origen.test.ts.
 */
(function (raiz, fabrica) {
  var hecho = fabrica(raiz);
  if (typeof module === "object" && module.exports) module.exports = hecho;
  if (raiz) { raiz.GP = raiz.GP || {}; if (!raiz.GP.origen) raiz.GP.origen = hecho; }
})(typeof window !== "undefined" ? window : null, function (W) {
  var EDADES = [["18-24", "18-24"], ["25-34", "25-34"], ["35-44", "35-44"], ["45-54", "45-54"], ["55+", "55 o más"], ["nd", "Prefiero no decirlo"]];
  var CERCA = ["ES", "PT", "AD", "GQ", "MX", "GT", "SV", "HN", "NI", "CR", "PA", "CU", "DO", "PR", "CO", "VE", "EC", "PE", "BO", "CL", "AR", "UY", "PY"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function normaliza(s) { return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9ñ]+/g, " ").trim(); }

  // ── la lista: un índice plano para buscar deprisa (una vez)
  var INDICES = typeof WeakMap === "function" ? new WeakMap() : null;
  function indice(L) {
    var ya = INDICES && INDICES.get(L); if (ya) return ya;
    var filas = [];
    Object.keys(L.ciudades || {}).forEach(function (p) {
      var R = (L.regiones || {})[p] || [], np = ((L.paises || {})[p] || [p])[0];
      L.ciudades[p].forEach(function (c) {
        filas.push({ id: c[0], nombre: c[1], otro: c[2] || "", region: c[3] >= 0 ? R[c[3]] || "" : "", pais: p, nombrePais: np, t: c[6] || 0,
          n: normaliza(c[1]), o: c[2] ? normaliza(c[2]) : "" });
      });
    });
    if (INDICES) INDICES.set(L, filas);
    return filas;
  }
  function buscar(L, texto, max) {
    var q = normaliza(texto); max = max || 8;
    if (q.length < 2 || !L) return [];
    var out = [];
    indice(L).forEach(function (f) {
      var r = -1;
      [f.n, f.o].forEach(function (s) {
        if (!s) return;
        var k = s === q ? 0 : s.indexOf(q) === 0 ? 1 : s.indexOf(" " + q) >= 0 ? 2 : s.indexOf(q) >= 0 ? 3 : -1;
        if (k >= 0 && (r < 0 || k < r)) r = k;
      });
      // lo que pesa: cómo casa (exacta 12, empieza así 6, una palabra empieza así 4, la contiene por dentro −10), lo grande que es (10·log10 de sus
      // habitantes) y, a igualdad, España, Portugal y Latinoamérica (+5): «Santiago» da Santiago de Chile y Santiago de Compostela
      // antes que un Santiago de 5.000 habitantes
      if (r >= 0) out.push({ r: [12, 6, 4, -10][r] + f.t + (CERCA.indexOf(f.pais) >= 0 ? 5 : 0), f: f });
    });
    out.sort(function (a, b) { return b.r - a.r || a.f.nombre.localeCompare(b.f.nombre, "es"); });
    return out.slice(0, max).map(function (x) { var f = x.f; return { id: f.id, nombre: f.nombre, otro: f.otro, region: f.region, pais: f.pais, nombrePais: f.nombrePais }; });
  }
  function paises(L) {
    return Object.keys((L && L.paises) || {}).map(function (k) { return { pais: k, nombre: L.paises[k][0], cerca: CERCA.indexOf(k) >= 0 }; })
      .sort(function (a, b) { return (b.cerca - a.cerca) || a.nombre.localeCompare(b.nombre, "es"); });
  }
  var CARGAS = {};
  function cargar(url) {
    url = url || "assets/js/ciudades.json";
    if (!CARGAS[url]) {
      CARGAS[url] = fetch(url, { cache: "force-cache" }).then(function (r) { if (!r.ok) throw new Error("ciudades " + r.status); return r.json(); });
      CARGAS[url].catch(function () { delete CARGAS[url]; });
    }
    return CARGAS[url];
  }

  // ── el estilo (piel: --gpo-*)
  var CSS = [
    ".gpo{display:grid;gap:14px;min-width:0}",
    ".gpo-et{display:block;font-weight:700;margin:0 0 6px}",
    ".gpo-ayuda{margin:4px 0 0;font-size:.9em;opacity:.8}",
    ".gpo-caja{position:relative;min-width:0}",
    ".gpo-in,.gpo-sel{width:100%;min-height:44px;padding:8px 12px;border-radius:10px;border:1px solid var(--gpo-borde,#b9b2a3);background:var(--gpo-campo,#fff);color:inherit;font:inherit;font-size:16px;box-sizing:border-box}",
    ".gpo-in[aria-invalid=true],.gpo-sel[aria-invalid=true]{border-color:var(--gpo-mal,#b3261e);box-shadow:0 0 0 2px color-mix(in srgb,var(--gpo-mal,#b3261e) 25%,transparent)}",
    ".gpo-lista{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:30;margin:0;padding:4px;list-style:none;max-height:min(320px,50vh);overflow:auto;border-radius:12px;background:var(--gpo-campo,#fff);color:var(--gpo-tinta,#1f2933);box-shadow:0 10px 28px rgba(0,0,0,.25)}",
    ".gpo-lista li{display:block;min-height:44px;padding:8px 10px;border-radius:8px;cursor:pointer;line-height:1.25;overflow-wrap:anywhere}",
    ".gpo-lista li small{display:block;opacity:.75}",
    ".gpo-lista li[aria-selected=true],.gpo-lista li:hover{background:var(--gpo-marca,rgba(201,162,39,.2))}",
    ".gpo-elegida{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;padding:8px 12px;border-radius:10px;background:var(--gpo-marca,rgba(201,162,39,.2));min-width:0}",
    ".gpo-elegida span{min-width:0;overflow-wrap:anywhere}",
    ".gpo-b{min-height:40px;padding:6px 12px;border-radius:999px;border:1px solid var(--gpo-borde,#b9b2a3);background:transparent;color:inherit;font:inherit;cursor:pointer}",
    ".gpo-enlace{border:0;background:transparent;color:inherit;text-decoration:underline;font:inherit;cursor:pointer;padding:8px 0;min-height:40px}",
    ".gpo-otra{display:grid;gap:8px;margin-top:8px}",
    ".gpo-edades{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}",
    "@media (max-width:420px){.gpo-edades{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    ".gpo-edad{min-height:44px;padding:6px 8px;border-radius:10px;border:1px solid var(--gpo-borde,#b9b2a3);background:var(--gpo-campo,#fff);color:inherit;font:inherit;cursor:pointer;line-height:1.15;overflow-wrap:anywhere}",
    ".gpo-edad[aria-pressed=true]{background:var(--gpo-activo,#1f2933);color:var(--gpo-activo-tinta,#fff);border-color:transparent}",
    ".gpo-edades.gpo-falta .gpo-edad{border-color:var(--gpo-mal,#b3261e)}",
    ".gpo-capa{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:rgba(10,8,4,.6)}",
    ".gpo-ventana{width:min(560px,100%);max-height:calc(100dvh - 32px);overflow:auto;padding:20px;border-radius:16px;background:var(--gpo-fondo,#fff);color:var(--gpo-tinta,#1f2933);box-shadow:0 20px 60px rgba(0,0,0,.4);box-sizing:border-box}",
    ".gpo-ventana h2{margin:0 0 6px;font-size:1.3em;line-height:1.2}",
    ".gpo-pie{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;margin-top:14px}",
    ".gpo-pie .gpo-b{min-height:44px}",
    ".gpo-error{margin:8px 0 0;color:var(--gpo-mal,#b3261e);font-weight:600}",
    ".gpo-priv{display:grid;gap:8px}",
    ".gpo-check{display:flex;gap:10px;align-items:flex-start;min-height:40px;cursor:pointer}",
    ".gpo-check input{width:22px;height:22px;flex:none;margin:2px 0 0}",
    "@media (max-width:520px){.gpo-capa{padding:0;place-items:stretch}.gpo-ventana{width:100%;max-height:100dvh;border-radius:0}}",
  ].join("\n");
  function ponerCss(doc) {
    if (!doc || doc.getElementById("gpo-css")) return;
    var s = doc.createElement("style"); s.id = "gpo-css"; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s);
  }
  var T0 = {
    ciudad: "¿De qué ciudad eres?", ciudadAyuda: "Escribe tu ciudad y elígela de la lista: el país sale solo.", buscar: "Por ejemplo: Sevilla, Bogotá, Mérida…",
    cargando: "Cargando las ciudades…", sinRed: "No se han podido cargar las ciudades. Elige «Mi ciudad no está» y tu país.",
    noEsta: "Mi ciudad no está", volverBuscar: "Buscar mi ciudad otra vez", pais: "Tu país", elige: "Elige tu país",
    otraNombre: "Tu ciudad (opcional; no se enseña)", cambiar: "Cambiar", ninguna: "Ninguna ciudad con ese nombre. Prueba de otra forma o pulsa «Mi ciudad no está».",
    cerca: "España, Portugal y Latinoamérica", resto: "Resto del mundo",
    edad: "¿Qué edad tienes?", edadAyuda: "Solo para las cifras del grupo: nadie verá la tuya.",
    faltaCiudad: "Elige tu ciudad de la lista (o «Mi ciudad no está» y tu país).", faltaPais: "Elige tu país.", faltaEdad: "Elige tu rango de edad (o «Prefiero no decirlo»).",
    tituloLugar: "¿De dónde eres?", introLugar: "Tu ciudad se enciende en el mapa de la clase, con tu personaje. Solo tu ciudad y tu país.",
    tituloEdad: "Una última cosa", introEdad: "Ya sales en el mapa de la clase. ¿Qué edad tienes? Nadie verá la tuya: solo cuenta para las cifras del grupo. Si tu ciudad no es esa, cámbiala aquí.",
    titulo: "¿Desde dónde caminas?", intro: "Tu ciudad sale en el mapa de tu clase, con tu personaje. Tu edad no la ve nadie: solo sirve para las cifras del grupo.",
    guardar: "Guardar", ahoraNo: "Ahora no", gracias: "¡Hecho! Ya estás en el mapa.", sinGuardar: "No se ha podido guardar. Inténtalo de nuevo.",
    soloPais: "Mostrar solo mi país en el mapa (sin la ciudad)", estas: "En el mapa sales en", nada: "Aún no has dicho de dónde eres.",
    decirlo: "Decirlo ahora", cambiarlo: "Cambiar mi ciudad o mi edad",
  };

  function opcionesPais(L, T) {
    var P = paises(L), cerca = P.filter(function (x) { return x.cerca; }), resto = P.filter(function (x) { return !x.cerca; });
    var op = function (x) { return '<option value="' + esc(x.pais) + '">' + esc(x.nombre) + "</option>"; };
    return '<option value="">' + esc(T.elige) + '</option><optgroup label="' + esc(T.cerca) + '">' + cerca.map(op).join("") + '</optgroup><optgroup label="' + esc(T.resto) + '">' + resto.map(op).join("") + "</optgroup>";
  }

  var N = 0;
  /** Los campos (la ciudad con su lista, «Mi ciudad no está» con el país, el rango de edad). */
  function campos(el, o) {
    o = o || {};
    var doc = el.ownerDocument, T = Object.assign({}, T0, o.textos || {}), id = "gpo" + (++N);
    ponerCss(doc);
    var L = o.lista || null, ini = o.inicial || {};
    var st = { ciudad: null, otra: !!(ini.otra || (ini.pais && !ini.ciudadId)), pais: ini.pais || "", otraNombre: ini.otra || "", edad: ini.edad || "", res: [], sel: -1 };
    if (ini.ciudadId) st.ciudad = { id: ini.ciudadId, nombre: ini.ciudad, region: ini.region || "", pais: ini.pais, nombrePais: "" };
    el.classList.add("gpo");
    function nombreP(c) { return L && L.paises && L.paises[c] ? L.paises[c][0] : c; }
    function pintar() {
      var h = '<div><label class="gpo-et" for="' + id + '-c">' + esc(T.ciudad) + "</label>";
      if (st.otra) {
        h += '<div class="gpo-otra"><select class="gpo-sel" id="' + id + '-p" aria-label="' + esc(T.pais) + '">' + (L ? opcionesPais(L, T) : '<option value="">' + esc(T.cargando) + "</option>") + "</select>" +
          '<input class="gpo-in" id="' + id + '-o" maxlength="60" autocomplete="address-level2" placeholder="' + esc(T.otraNombre) + '" value="' + esc(st.otraNombre) + '">' +
          '<button type="button" class="gpo-enlace" data-gpo="buscar">' + esc(T.volverBuscar) + "</button></div>";
      } else if (st.ciudad) {
        h += '<div class="gpo-elegida"><span><b>' + esc(st.ciudad.nombre) + "</b> · " + esc([st.ciudad.region, st.ciudad.nombrePais || nombreP(st.ciudad.pais)].filter(Boolean).join(", ")) + "</span>" +
          '<button type="button" class="gpo-b" data-gpo="cambiar">' + esc(T.cambiar) + "</button></div>";
      } else {
        h += '<div class="gpo-caja"><input class="gpo-in" id="' + id + '-c" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="' + id + '-l" autocomplete="off" ' +
          'spellcheck="false" placeholder="' + esc(L ? T.buscar : T.cargando) + '"><ul class="gpo-lista" id="' + id + '-l" role="listbox" hidden></ul></div>' +
          '<p class="gpo-ayuda" id="' + id + '-a">' + esc(T.ciudadAyuda) + '</p><button type="button" class="gpo-enlace" data-gpo="otra">' + esc(T.noEsta) + "</button>";
      }
      if (o.sinEdad) { el.innerHTML = h + "</div>"; var s0 = el.querySelector("#" + id + "-p"); if (s0) s0.value = st.pais; return; }
      h += "</div><div><span class=\"gpo-et\" id=\"" + id + '-e">' + esc(T.edad) + '</span><div class="gpo-edades" role="group" aria-labelledby="' + id + '-e">' +
        EDADES.map(function (e) { return '<button type="button" class="gpo-edad" data-gpo-edad="' + esc(e[0]) + '" aria-pressed="' + (st.edad === e[0]) + '">' + esc(e[1]) + "</button>"; }).join("") +
        '</div><p class="gpo-ayuda">' + esc(T.edadAyuda) + "</p></div>";
      el.innerHTML = h;
      var s = el.querySelector("#" + id + "-p"); if (s) s.value = st.pais;
    }
    function lista() { return el.querySelector("#" + id + "-l"); }
    function entrada() { return el.querySelector("#" + id + "-c"); }
    function pintarLista() {
      var ul = lista(), inp = entrada(); if (!ul || !inp) return;
      var q = inp.value;
      if (normaliza(q).length < 2) { ul.hidden = true; inp.setAttribute("aria-expanded", "false"); return; }
      // las del mismo nombre en varios sitios: con su región y su país, siempre (Mérida de España, de México, de Venezuela…)
      ul.innerHTML = st.res.length ? st.res.map(function (c, i) {
        return '<li role="option" id="' + id + "-o" + i + '" data-gpo-i="' + i + '" aria-selected="' + (i === st.sel) + '"><b>' + esc(c.nombre) + "</b>" +
          (c.otro && normaliza(c.otro).indexOf(normaliza(q)) >= 0 ? " (" + esc(c.otro) + ")" : "") + "<small>" + esc([c.region, c.nombrePais].filter(Boolean).join(", ")) + "</small></li>";
      }).join("") : '<li role="option" aria-disabled="true">' + esc(T.ninguna) + "</li>";
      ul.hidden = false; inp.setAttribute("aria-expanded", "true");
      if (st.sel >= 0) inp.setAttribute("aria-activedescendant", id + "-o" + st.sel); else inp.removeAttribute("aria-activedescendant");
    }
    function elegir(i) {
      var c = st.res[i]; if (!c) return;
      st.ciudad = c; st.pais = c.pais; st.res = []; st.sel = -1; pintar(); cambio();
      var b = el.querySelector('[data-gpo="cambiar"]'); if (b && b.focus) b.focus();
    }
    function cambio() { if (o.alCambiar) o.alCambiar(api.valor()); }
    el.addEventListener("input", function (ev) {
      var t = ev.target;
      if (t.id === id + "-c") { st.res = buscar(L, t.value, 8); st.sel = st.res.length ? 0 : -1; t.removeAttribute("aria-invalid"); pintarLista(); }
      if (t.id === id + "-o") { st.otraNombre = t.value; }
    });
    el.addEventListener("change", function (ev) { if (ev.target.id === id + "-p") { st.pais = ev.target.value; ev.target.removeAttribute("aria-invalid"); cambio(); } });
    el.addEventListener("keydown", function (ev) {
      if (ev.target.id !== id + "-c" || !st.res.length) return;
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") { ev.preventDefault(); st.sel = (st.sel + (ev.key === "ArrowDown" ? 1 : -1) + st.res.length) % st.res.length; pintarLista(); }
      else if (ev.key === "Enter") { ev.preventDefault(); if (st.sel >= 0) elegir(st.sel); }
      else if (ev.key === "Escape") { var ul = lista(); if (ul) ul.hidden = true; }
    });
    el.addEventListener("click", function (ev) {
      var t = ev.target, b;
      if ((b = t.closest("[data-gpo-i]"))) return elegir(Number(b.getAttribute("data-gpo-i")));
      if ((b = t.closest("[data-gpo-edad]"))) {
        st.edad = b.getAttribute("data-gpo-edad");
        Array.prototype.forEach.call(el.querySelectorAll("[data-gpo-edad]"), function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        var g = el.querySelector(".gpo-edades"); if (g) g.classList.remove("gpo-falta");
        return cambio();
      }
      if ((b = t.closest("[data-gpo]"))) {
        var a = b.getAttribute("data-gpo");
        if (a === "otra") { st.otra = true; st.ciudad = null; }
        if (a === "buscar") { st.otra = false; }
        if (a === "cambiar") { st.ciudad = null; }
        pintar(); cambio();
        var f = el.querySelector("#" + id + (st.otra ? "-p" : "-c")); if (f && f.focus) f.focus();
      }
    });
    el.addEventListener("focusout", function () {
      setTimeout(function () { var ul = lista(); if (ul && !el.contains(doc.activeElement)) ul.hidden = true; }, 150);
    });

    var api = {
      /** Lo que se manda a `guardar` (sin el grupo), o null si falta algo. */
      valor: function () {
        if (!st.edad && !o.sinEdad) return null;
        var v = st.otra ? (st.pais ? { otra: { pais: st.pais, nombre: st.otraNombre.trim().slice(0, 60) } } : null) : (st.ciudad ? { ciudad: st.ciudad.id, pais: st.ciudad.pais } : null);
        if (v && o.sinEdad) v.sinEdad = true; else if (v) v.edad = st.edad;
        return v;
      },
      /** El texto de lo que falta ('' si nada) y marca el campo. */
      falta: function () {
        var g = el.querySelector(".gpo-edades");
        if (!st.otra && !st.ciudad) { var i = entrada(); if (i) i.setAttribute("aria-invalid", "true"); return T.faltaCiudad; }
        if (st.otra && !st.pais) { var s = el.querySelector("#" + id + "-p"); if (s) s.setAttribute("aria-invalid", "true"); return T.faltaPais; }
        if (!st.edad && !o.sinEdad) { if (g) g.classList.add("gpo-falta"); return T.faltaEdad; }
        return "";
      },
      enfocar: function () {
        var f = (!st.otra && !st.ciudad) ? entrada() : (st.otra && !st.pais) ? el.querySelector("#" + id + "-p") : el.querySelector("[data-gpo-edad]");
        if (f) { if (f.scrollIntoView) f.scrollIntoView({ block: "center" }); if (f.focus) f.focus(); }
      },
      /** (para las pruebas) */
      _estado: function () { return st; },
    };
    pintar();
    if (!L) {
      cargar(o.url).then(function (x) { L = x; var v = (entrada() || {}).value || ""; pintar(); var i = entrada(); if (i && v) { i.value = v; st.res = buscar(L, v, 8); st.sel = st.res.length ? 0 : -1; pintarLista(); } },
        function () { st.otra = true; pintar(); var a = el.querySelector(".gpo-otra"); if (a) a.insertAdjacentHTML("afterbegin", '<p class="gpo-error">' + esc(T.sinRed) + "</p>"); });
    }
    return api;
  }

  function guardar(o, valor) {
    return o.llamar("modOrigen", Object.assign({}, valor, { accion: "guardar", projectId: String(o.projectId), via: o.via || "web" }));
  }
  /** 'AAAA-MM-DD' (medianoche de Madrid) o ms → ms; 0 = sin fecha. */
  function desdeDe(x) {
    if (typeof x === "number" && isFinite(x)) return x;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(x || ""));
    return m ? Date.parse(m[1] + "-" + m[2] + "-" + m[3] + "T00:00:00+01:00") : 0;
  }
  /** Qué falta por preguntar (lo mismo que `queFalta` del servidor, functions/modOrigenLogica.js). */
  function queFalta(estado, o) {
    var e = estado || {}; o = o || {};
    var veces = o.veces == null ? 2 : o.veces, desde = desdeDe(o.desde), ahora = o.ahora || Date.now();
    if (e.listo) return "";
    if (o.directo) return e.lugar ? "" : "lugar";
    if ((Number(e.aplazado) || 0) >= veces) return "";
    if (e.lugar) return "edad";
    if (desde && ahora < desde) return "";
    return "todo";
  }
  function hayQuePreguntar(estado, veces) { return queFalta(estado, { veces: veces }) !== ""; }

  /** La ventana al entrar (a quien ya estaba alistado y aún no lo ha dicho). Se cierra solo con sus botones: es una pregunta. */
  var abierta = false;
  function pedir(o) {
    var modo = o && (o.modo || queFalta(o.estado, { veces: o.veces, desde: o.desde, directo: o.directo }));
    if (!W || abierta || o.excluir || W.top !== W.self || !o.projectId || typeof o.llamar !== "function" || !modo) return false;
    abierta = true;
    // en modo 'edad', su ciudad ya puesta (es suya: `mio`); si no llega, se abre igual con la ciudad por elegir
    if (modo === "edad" && !o.inicial) {
      Promise.resolve(o.llamar("modOrigen", { accion: "mio", projectId: String(o.projectId) })).then(function (r) { return r && r.data ? r.data : r; }, function () { return null; })
        .then(function (r) { abierta = false; pedir(Object.assign({}, o, { modo: "edad", inicial: (r && r.origen) || {} })); });
      return true;
    }
    var doc = W.document, T = Object.assign({}, T0, o.textos || {}), K = Object.assign({ capa: "", ventana: "", boton: "", primario: "" }, o.clases || {});
    var tit = modo === "lugar" ? T.tituloLugar : modo === "edad" ? T.tituloEdad : T.titulo, intro = modo === "lugar" ? T.introLugar : modo === "edad" ? T.introEdad : T.intro;
    var sinAplazar = o.sinAplazar || modo === "lugar";
    ponerCss(doc);
    var capa = doc.createElement("div"); capa.className = "gpo-capa " + K.capa;
    capa.innerHTML = '<div class="gpo-ventana ' + K.ventana + '" role="dialog" aria-modal="true" aria-labelledby="gpo-v-t"><h2 id="gpo-v-t">' + esc(tit) + "</h2><p>" + esc(intro) + "</p>" +
      '<div class="gpo-v-campos"></div><p class="gpo-error" hidden></p><div class="gpo-pie"><button type="button" class="gpo-b ' + K.boton + '" data-gpo-v="no">' + esc(T.ahoraNo) + "</button>" +
      '<button type="button" class="gpo-b ' + K.boton + " " + K.primario + '" data-gpo-v="si">' + esc(T.guardar) + "</button></div></div>";
    doc.body.appendChild(capa);
    var f = campos(capa.querySelector(".gpo-v-campos"), { url: o.url, lista: o.lista, textos: o.textos, inicial: o.inicial, sinEdad: modo === "lugar" });
    var err = capa.querySelector(".gpo-error");
    function cerrar() { capa.remove(); abierta = false; }
    capa.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-gpo-v]"); if (!b) return;
      if (b.getAttribute("data-gpo-v") === "no") {
        if (sinAplazar) { cerrar(); if (o.alCerrar) o.alCerrar(); return; }   // (desde la ficha o en el directo: «Ahora no» no cuenta)
        b.disabled = true;
        Promise.resolve(o.llamar("modOrigen", { accion: "aplazar", projectId: String(o.projectId) })).catch(function () {}).then(function () { cerrar(); if (o.alAplazar) o.alAplazar(); });
        return;
      }
      var falta = f.falta();
      if (falta) { err.textContent = falta; err.hidden = false; f.enfocar(); return; }
      b.disabled = true; err.hidden = true;
      guardar({ llamar: o.llamar, projectId: o.projectId, via: modo === "lugar" ? "directo" : "entrar" }, f.valor()).then(function (r) { cerrar(); if (o.alGuardar) o.alGuardar(r); },
        function (e) { b.disabled = false; err.textContent = (e && e.message) || T.sinGuardar; err.hidden = false; });
    });
    return true;
  }

  /** El bloque de los ajustes de la ficha: dónde sale y «Mostrar solo mi país» (y cambiarlo, con los mismos campos). */
  function privacidad(el, o) {
    var doc = el.ownerDocument, T = Object.assign({}, T0, o.textos || {});
    ponerCss(doc);
    el.classList.add("gpo-priv");
    var mio = null;
    function pintar() {
      if (!mio) { el.innerHTML = "<p>" + esc(T.nada) + '</p><button type="button" class="gpo-b" data-gpo-p="cambiar">' + esc(T.decirlo) + "</button>"; return; }
      var donde = mio.ciudad ? mio.ciudad + (mio.region ? ", " + mio.region : "") : mio.paisNombre || mio.pais;
      el.innerHTML = "<p>" + esc(T.estas) + " <b>" + esc(mio.soloPais || !mio.ciudad ? (mio.paisNombre || mio.pais) : donde) + "</b>.</p>" +
        (mio.ciudad ? '<label class="gpo-check"><input type="checkbox" data-gpo-p="solo"' + (mio.soloPais ? " checked" : "") + "><span>" + esc(T.soloPais) + "</span></label>" : "") +
        '<button type="button" class="gpo-enlace" data-gpo-p="cambiar">' + esc(T.cambiarlo) + '</button><p class="gpo-error" hidden></p>';
    }
    function leer() {
      return o.llamar("modOrigen", { accion: "mio", projectId: String(o.projectId) }).then(function (r) {
        mio = r && r.origen;
        if (mio) { try { mio.paisNombre = new Intl.DisplayNames(["es"], { type: "region" }).of(mio.pais); } catch (e) { mio.paisNombre = mio.pais; } }
        pintar();
      }, function () { el.innerHTML = '<p class="gpo-error">' + esc(T.sinGuardar) + "</p>"; });
    }
    el.addEventListener("change", function (ev) {
      if (ev.target.getAttribute("data-gpo-p") !== "solo") return;
      var c = ev.target; c.disabled = true;
      o.llamar("modOrigen", { accion: "privacidad", projectId: String(o.projectId), soloPais: c.checked }).then(function () { mio.soloPais = c.checked; pintar(); },
        function () { c.checked = !c.checked; c.disabled = false; var e = el.querySelector(".gpo-error"); if (e) { e.textContent = T.sinGuardar; e.hidden = false; } });
    });
    el.addEventListener("click", function (ev) {
      if (!ev.target.closest('[data-gpo-p="cambiar"]')) return;
      pedir({ llamar: o.llamar, projectId: o.projectId, modo: "todo", url: o.url, textos: Object.assign({ ahoraNo: "Cancelar" }, o.textos || {}), clases: o.clases,
        inicial: mio || {}, sinAplazar: true, alGuardar: function () { leer(); } });
    });
    el.innerHTML = "<p>…</p>";
    return leer();
  }

  return { EDADES: EDADES, CERCA: CERCA, normaliza: normaliza, buscar: buscar, paises: paises, cargar: cargar, campos: campos, guardar: guardar,
    hayQuePreguntar: hayQuePreguntar, queFalta: queFalta, desdeDe: desdeDe, pedir: pedir, privacidad: privacidad, CSS: CSS };
});
