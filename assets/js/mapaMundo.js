/**
 * GAMIFICAPRO · EL MAPAMUNDI DE LA CLASE (16-oct-2026) — pieza del motor para cualquier mod (pieza `origen` del servidor).
 *
 * Norberto (16-oct): «Cuando haga una clase en directo, mientras se conectan, podría aparecer el mapamundi con los avatares de los que
 * se conectan en sus ciudades. También en Mi gente podría ver el mapa completo de dónde son los estudiantes.» Este fichero es el mapa:
 * un SVG propio y ligero (Natural Earth 110m, en `sdk/mapaMundoTierra.js`, que genera `scripts/origen/generar.mjs`), sin servicios de
 * mapas de fuera. Cada web lo copia en su build (`guardas.copiar_pieza`, con su tierra) y NO se edita allí: aquí. La piel (colores,
 * letras, el marco) es del mod: variables CSS `--gpmm-*` sobre el contenedor.
 *
 *   GP.mapaMundo.proyectar(lat, lon)        → [x, y] en las unidades del mapa (Natural Earth I, de 56° S a 84° N: sin la Antártida)
 *   GP.mapaMundo.ANCHO / ALTO                → el tamaño del mapa entero, en esas unidades
 *   GP.mapaMundo.porCiudad(personas)         → las personas de la misma ciudad (mismas coordenadas), juntas
 *   GP.mapaMundo.agrupar(sitios, radio)      → los sitios a menos de `radio` (px) unos de otros, en una burbuja con su número
 *   GP.mapaMundo.encuadre(xy, aspecto, o)    → [x, y, ancho, alto]: lo que se ve para que quepan todos (o el mundo, sin nadie)
 *   GP.mapaMundo.resumenPaises(personas)     → [{ pais, nombre, n }] de más a menos
 *   GP.mapaMundo.crear(el, o)                → { poner(personas), encuadrar('auto' | 'mundo'), vista([v]), destruir() }
 *       19-oct · ZOOM Y ARRASTRE (Norberto, en la clase 1 de DPG: «Estaría genial poder hacer zoom o arrastrar. Muchos estudiantes serán de
 *       Ecuador; como no haga zoom, no veo de dónde son»): con `mover` (de serie, sí) la rueda y el pellizco acercan y alejan donde está el
 *       ratón o los dedos, arrastrar con el ratón o el dedo mueve el mapa (sin salir del mundo, de `zoomMax` veces el mundo a el mundo
 *       entero) y los controles llevan «+» y «−». En el lienzo, `touch-action: none`: el dedo mueve el mapa y no la página (la página se
 *       mueve fuera del mapa). `vista()` → 'auto' | 'mundo' | [x, y, ancho, alto] (lo que se ve, en unidades del mapa); `vista(v)` lo pone
 *       (otra pantalla con otra proporción ve lo mismo, centrado) SIN avisar; `o.alCambiar(v)` avisa cuando lo cambia la persona (al
 *       soltar, al parar la rueda y con los botones): así quien proyecta manda su vista a la presentación y a quien le sigue.
 *       o = { tierra (GP_MAPA_TIERRA), aspecto (16/9; con `llenar`, el alto del contenedor), encuadre ('auto'), controles (true),
 *             mover (true), zoomMax (14), alCambiar(v),
 *             resumen (false: la lista por país debajo), avisar (false: «Alias · Ciudad» un momento al llegar alguien),
 *             tam (px del avatar; si no, según el ancho), textos, nombrePais(codigo) }
 *       personas = [{ id, alias, img, lat, lon, pais, ciudad }] (la ciudad '' = «solo mi país»: sale en el centro del país)
 *       Quien llega en un `poner` posterior aparece con una animación (y la burbuja donde cae late). Los de la misma ciudad (o tan cerca
 *       que se tapan) van en una burbuja con su número; al pulsarla se abre la lista. Nada depende de pasar el ratón.
 *
 *       10-nov · EL GLOBO (Norberto, tras su primera clase en directo: «¿Podías hacer que el mapa de la sesión en vivo fuera 3D, brillaran
 *       los puntos y se pudiera rotar?»): con `o.globo` (true o { lon, lat, acercar, ascuas }) el mapa es una esfera dibujada en un lienzo
 *       (canvas 2D propio: ni WebGL ni librerías; la tierra es la misma, vuelta a la esfera con `desproyectar`). Se gira arrastrando con el
 *       ratón o el dedo (con su inercia), la rueda y el pellizco acercan, y cuando nadie lo toca se mece sobre su gente o, con el mundo
 *       entero, da la vuelta despacio. Cada sitio es un ascua que late con su onda; quien llega, con un destello; los avatares van clavados
 *       un poco por encima del suelo (se nota al girar) y se esconden al pasar detrás. «Plano» / «Globo» cambia de forma. Con
 *       `prefers-reduced-motion`, quieto (solo se mueve si lo mueven). Sin canvas, el mapa plano. `o.brillo`: el halo de los avatares
 *       (también en plano). La piel: `--gpmm-espacio` (el fondo) y `--gpmm-globo-mar|mar2|tierra|borde|hay|halo|brasa|brasa2|nucleo|estrella`.
 *       `vista()` en el globo: 'auto' | 'mundo' | { g: [lon, lat, s] }; con el globo puesto en plano, { f: 'plano', v: lo de siempre }.
 *       GP.mapaMundo.desproyectar(x, y) → [lat, lon] · encuadreGlobo(puntos, ancho, alto, o) → { lon, lat, s, gira }
 *
 * 🔴 Privacidad: el mapa solo pinta lo que se le da. Las coordenadas llegan ya redondeadas a la ciudad (o al país), la edad nunca
 * llega aquí (functions/modOrigen.js) y de cada cual solo sale su alias y su avatar, lo mismo que ya ve su grupo.
 * Pruebas: tests/sdk/origen.test.ts, tests/sdk/mapaMundoZoom.test.ts y tests/sdk/mapaMundoGlobo.test.ts.
 */
(function (raiz, fabrica) {
  var hecho = fabrica(raiz);
  if (typeof module === "object" && module.exports) module.exports = hecho;
  if (raiz) { raiz.GP = raiz.GP || {}; if (!raiz.GP.mapaMundo) raiz.GP.mapaMundo = hecho; }
})(typeof window !== "undefined" ? window : null, function (W) {
  var LAT_N = 84, LAT_S = -56, RAD = Math.PI / 180;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  /** Natural Earth I (la de d3-geo, `geoNaturalEarth1`): se ve bien apaisada y no deforma tanto como Mercator. */
  function ne1(lat, lon) {
    var l = lon * RAD, p = lat * RAD, p2 = p * p, p4 = p2 * p2;
    return [l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))),
      p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))];
  }
  var XMAX = ne1(0, 180)[0], YN = ne1(LAT_N, 0)[1], YS = ne1(LAT_S, 0)[1];
  var ANCHO = 1000, K = ANCHO / (2 * XMAX), ALTO = Math.round((YN - YS) * K);
  function proyectar(lat, lon) {
    var q = ne1(clamp(Number(lat) || 0, LAT_S, LAT_N), clamp(Number(lon) || 0, -180, 180));
    return [(q[0] + XMAX) * K, (YN - q[1]) * K];
  }
  function valida(p) { return p && isFinite(Number(p.lat)) && isFinite(Number(p.lon)) && !(Number(p.lat) === 0 && Number(p.lon) === 0 && !p.pais); }

  /** Las personas de la misma ciudad (mismas coordenadas y país), juntas: [{ lat, lon, pais, ciudad, gente: [...] }]. */
  function porCiudad(personas) {
    var m = {}, orden = [];
    (personas || []).filter(valida).forEach(function (p) {
      var k = Number(p.lat).toFixed(2) + "," + Number(p.lon).toFixed(2) + "," + (p.pais || "");
      if (!m[k]) { m[k] = { lat: Number(p.lat), lon: Number(p.lon), pais: p.pais || "", ciudad: p.ciudad || "", gente: [] }; orden.push(k); }
      if (!m[k].ciudad && p.ciudad) m[k].ciudad = p.ciudad;
      m[k].gente.push(p);
    });
    return orden.map(function (k) { return m[k]; });
  }
  /**
   * Los sitios que se tapan (a menos de `radio` px), en una burbuja: se queda en el sitio con más gente (no en el medio, para que
   * siga en una ciudad de verdad). sitios = [{ x, y, gente, … }] → [{ x, y, sitios: [...], gente: [...] }]
   */
  function agrupar(sitios, radio) {
    var r2 = radio * radio, out = [];
    (sitios || []).slice().sort(function (a, b) { return b.gente.length - a.gente.length || a.x - b.x; }).forEach(function (s) {
      for (var i = 0; i < out.length; i++) {
        var dx = out[i].x - s.x, dy = out[i].y - s.y, dz = (out[i].z || 0) - (s.z || 0);   // (z: en el globo, los sitios son puntos de la esfera)
        if (dx * dx + dy * dy + dz * dz < r2) { out[i].sitios.push(s); out[i].gente = out[i].gente.concat(s.gente); return; }
      }
      out.push({ x: s.x, y: s.y, z: s.z || 0, sitios: [s], gente: s.gente.slice() });
    });
    return out;
  }
  /**
   * Lo que se ve: el recuadro de los puntos (en unidades del mapa) con su margen, de ancho mínimo `minAncho` (que nadie quede solo en
   * medio de un mar enorme ni con el mapa a nivel de calle), estirado al `aspecto` del contenedor y dentro del mundo. Sin puntos, el mundo.
   */
  function encuadre(xy, aspecto, o) {
    o = o || {};
    var a = aspecto > 0 ? aspecto : 16 / 9, margen = o.margen == null ? 0.18 : o.margen, minAncho = o.minAncho || 170;
    var x0, y0, x1, y1;
    if (!xy || !xy.length) { x0 = 0; y0 = 0; x1 = ANCHO; y1 = ALTO; margen = 0; minAncho = 0; }
    else {
      x0 = x1 = xy[0][0]; y0 = y1 = xy[0][1];
      xy.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    }
    var w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    w = Math.max(w * (1 + 2 * margen), minAncho); h = Math.max(h * (1 + 2 * margen), minAncho / a);
    if (w / h > a) h = w / a; else w = h * a;
    // dentro del mundo: si cabe, se mueve; si no cabe (más ancho que el mundo), se centra
    var x = cx - w / 2, y = cy - h / 2;
    x = w >= ANCHO ? (ANCHO - w) / 2 : clamp(x, 0, ANCHO - w);
    y = h >= ALTO ? (ALTO - h) / 2 : clamp(y, 0, ALTO - h);
    return [x, y, w, h].map(function (v) { return Math.round(v * 10) / 10; });
  }

  // ─────────────────────────────────────────────── el globo (10-nov): lo puro
  /** Lo contrario de `proyectar`: de las unidades del mapa a [lat, lon] (Newton sobre la Natural Earth I, como d3-geo). */
  function desproyectar(x, y) {
    var q1 = YN - y / K, p = q1, i = 0, d, p2, p4;
    do {
      p2 = p * p; p4 = p2 * p2;
      d = (p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4))) - q1) /
        (1.007226 + p2 * (0.045255 + p4 * (-0.311325 + 0.259866 * p2 - 0.065076 * p4)));
      p -= d;
    } while (Math.abs(d) > 1e-7 && ++i < 12);
    p2 = p * p; p4 = p2 * p2;
    var l = (x / K - XMAX) / (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
    return [clamp(p / RAD, -90, 90), clamp(l / RAD, -180, 180)];
  }
  /** El punto de la esfera (radio 1): x hacia el meridiano 0, y hacia el 90° E, z hacia el norte. */
  function vec(lat, lon) { var p = lat * RAD, l = lon * RAD, c = Math.cos(p); return [c * Math.cos(l), c * Math.sin(l), Math.sin(p)]; }
  /** Cómo se mira el globo con (lon0, lat0) en el centro: la matriz que lleva la esfera a la pantalla (x derecha, y arriba, z hacia quien mira). */
  function matrizDe(lon0, lat0) {
    var l = lon0 * RAD, p = lat0 * RAD, sl = Math.sin(l), cl = Math.cos(l), sp = Math.sin(p), cp = Math.cos(p);
    return [-sl, cl, 0, -sp * cl, -sp * sl, cp, cp * cl, cp * sl, sp];
  }
  function girar(v, lon0, lat0) {
    var m = matrizDe(lon0, lat0);
    return [m[0] * v[0] + m[1] * v[1], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
  }
  function normLon(l) { return ((l + 180) % 360 + 360) % 360 - 180; }
  /** De `b` a `a` por el camino corto, en grados (con signo). */
  function dLon(a, b) { return normLon(a - b); }
  var G_LAT0 = -55, G_LAT1 = 78, TAU = Math.PI * 2;
  function r2(n) { return Math.round(n * 100) / 100; }
  /**
   * Cómo se mira el globo para que quepan todos: { lon, lat, s, gira }. El centro, en medio de la gente; `s` (1 = el globo entero en el
   * lienzo) acerca hasta que caben con su margen, sin pasar de `sMax` ni de un globo tan grande que deje de verse su borde. Sin nadie, o con
   * gente a los dos lados del mundo, el globo entero y girando (`gira`), para que pasen todos por delante.
   */
  function encuadreGlobo(puntos, w, h, o) {
    o = o || {};
    var lon0 = o.lon == null ? -20 : o.lon, lat0 = o.lat == null ? 18 : o.lat, sMax = o.sMax || 7;
    var P = (puntos || []).filter(function (p) { return p && isFinite(p[0]) && isFinite(p[1]); });
    if (!P.length) return { lon: lon0, lat: lat0, s: 1, gira: true };
    var sx = 0, sy = 0, sz = 0, V = P.map(function (p) { var v = vec(p[0], p[1]); sx += v[0]; sy += v[1]; sz += v[2]; return v; });
    var L = Math.sqrt(sx * sx + sy * sy + sz * sz);
    if (L / P.length < 0.12) return { lon: lon0, lat: lat0, s: 1, gira: true };
    var lat = clamp(Math.asin(clamp(sz / L, -1, 1)) / RAD, G_LAT0 + 15, G_LAT1 - 15), lon = Math.atan2(sy, sx) / RAD;
    var r0 = Math.max(16, Math.min(w, h) * 0.45), mg = o.margen == null ? Math.min(w, h) * 0.14 : o.margen;
    var hw = Math.max(20, w / 2 - mg), hh = Math.max(20, h / 2 - mg), R = Infinity, atras = false;
    V.forEach(function (v) {
      var c = girar(v, lon, lat);
      if (c[2] < 0.3) atras = true;
      if (Math.abs(c[0]) > 1e-3) R = Math.min(R, hw / Math.abs(c[0]));
      if (Math.abs(c[1]) > 1e-3) R = Math.min(R, hh / Math.abs(c[1]));
    });
    if (atras) return { lon: r2(lon), lat: r2(lat), s: 1, gira: true };
    var tope = Math.min(sMax, Math.max(1, 0.48 * Math.max(w, h) / r0));
    var s = R === Infinity ? Math.min(3, tope) : clamp(R / r0, 1, tope);
    return { lon: r2(lon), lat: r2(lat), s: Math.round(s * 1000) / 1000, gira: false };
  }
  /**
   * Los países para el globo: los trazos de la tierra (en unidades del mapa plano) vueltos a su sitio en la esfera, una vez por tierra.
   * Cada anillo: { c (país), n, p (xyz de cada punto), f (1 = el tramo que llega a ese punto no se dibuja: la costura del meridiano 180),
   * cap y cs (su centro y el seno de su radio, para saltarse lo que queda detrás), X, Y, Z (donde cae cada punto al pintar) }.
   */
  function anillosDe(tierra) {
    if (!tierra) return [];
    if (tierra._globo) return tierra._globo;
    var out = [], paises = tierra.paises || {}, re = /M(-?[\d.]+) (-?[\d.]+)l([^zM]*)z/g;
    Object.keys(paises).forEach(function (c) {
      var m, d = String(paises[c]);
      re.lastIndex = 0;
      while ((m = re.exec(d))) {
        var x = Number(m[1]), y = Number(m[2]), nums = m[3].trim().split(/\s+/), ll = [desproyectar(x, y)], i;
        for (i = 0; i + 1 < nums.length; i += 2) { x += Number(nums[i]); y += Number(nums[i + 1]); ll.push(desproyectar(x, y)); }
        if (ll.length < 3) continue;
        var pts = [], fl = [], n = ll.length;
        for (i = 0; i < n; i++) {
          var a = ll[(i + n - 1) % n], b = ll[i], costura = Math.abs(a[1]) > 179.4 && Math.abs(b[1]) > 179.4 ? 1 : 0;
          var tramos = Math.min(24, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / 3)) || 1, k;
          for (k = 1; k <= tramos; k++) { pts.push(vec(a[0] + (b[0] - a[0]) * k / tramos, a[1] + (b[1] - a[1]) * k / tramos)); fl.push(costura); }
        }
        var N = pts.length, p = new Float32Array(N * 3), cx = 0, cy = 0, cz = 0;
        pts.forEach(function (v, j) { p[3 * j] = v[0]; p[3 * j + 1] = v[1]; p[3 * j + 2] = v[2]; cx += v[0]; cy += v[1]; cz += v[2]; });
        var L = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1, cap = [cx / L, cy / L, cz / L], min = 1;
        pts.forEach(function (v) { min = Math.min(min, v[0] * cap[0] + v[1] * cap[1] + v[2] * cap[2]); });
        out.push({ c: c, n: N, p: p, f: fl, cap: cap, cs: min > 0 ? Math.sqrt(1 - min * min) : 1, X: new Float32Array(N), Y: new Float32Array(N), Z: new Float32Array(N), ve: false });
      }
    });
    try { Object.defineProperty(tierra, "_globo", { value: out, enumerable: false }); } catch (e) { /* una tierra congelada: se rehace cada vez */ }
    return out;
  }
  var RETICULA = null;
  /** Los meridianos (cada 30°) y los paralelos (cada 20°) del globo, como líneas de puntos de la esfera. */
  function reticula() {
    if (RETICULA) return RETICULA;
    var L = [], lon, lat, a;
    for (lon = -180; lon < 180; lon += 30) { a = []; for (lat = -80; lat <= 80; lat += 5) a.push.apply(a, vec(lat, lon)); L.push(new Float32Array(a)); }
    for (lat = -60; lat <= 60; lat += 20) { a = []; for (lon = -180; lon <= 180; lon += 6) a.push.apply(a, vec(lat, lon)); L.push(new Float32Array(a)); }
    RETICULA = L; return L;
  }
  /** Un color de la piel (el que sea: #hex, rgb(), el nombre) → [r, g, b]; lo lee el propio lienzo. Si no lo entiende, el de serie. */
  function rgbDe(ctx, color, defecto) {
    if (!color) return defecto;
    try {
      ctx.fillStyle = "#010203"; ctx.fillStyle = color;
      var s = String(ctx.fillStyle), m = /^#([0-9a-f]{6})$/i.exec(s), n;
      if (m) { n = parseInt(m[1], 16); if (n === 0x010203 && !/^#?010203$/i.test(String(color).trim())) return defecto; return [n >> 16, (n >> 8) & 255, n & 255]; }
      if ((m = /rgba?\(([^)]+)\)/.exec(s))) { var a = m[1].split(",").map(Number); if (a.length >= 3 && a.slice(0, 3).every(isFinite)) return [a[0], a[1], a[2]]; }
    } catch (e) { /* el de serie */ }
    return defecto;
  }
  function col(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (a < 0 ? 0 : a > 1 ? 1 : Math.round(a * 1000) / 1000) + ")"; }

  var DN = null;
  function nombrePaisDe(c) {
    try { if (!DN && W && W.Intl && Intl.DisplayNames) DN = new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { DN = null; }
    if (!DN && typeof Intl !== "undefined" && Intl.DisplayNames) { try { DN = new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { /* sin nombres */ } }
    try { return (DN && c && DN.of(c)) || c || ""; } catch (e) { return c || ""; }
  }
  /** Cuántos de cada país, de más a menos (y por nombre a igualdad). */
  function resumenPaises(personas, nombrePais) {
    var m = {}, np = nombrePais || nombrePaisDe;
    (personas || []).filter(valida).forEach(function (p) { if (p.pais) m[p.pais] = (m[p.pais] || 0) + 1; });
    return Object.keys(m).map(function (k) { return { pais: k, nombre: np(k), n: m[k] }; })
      .sort(function (a, b) { return b.n - a.n || a.nombre.localeCompare(b.nombre, "es"); });
  }

  // ─────────────────────────────────────────────── la parte visual
  var CSS = [
    ".gpmm{position:relative;min-width:0;color:var(--gpmm-tinta,#1f2933);font:inherit}",
    ".gpmm-lienzo{position:relative;width:100%;overflow:hidden;border-radius:var(--gpmm-radio,14px);background:var(--gpmm-mar,#dfe9f3);touch-action:manipulation}",
    ".gpmm-mueve .gpmm-lienzo{touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}",
    ".gpmm-mueve .gpmm-lienzo.gpmm-arrastra{cursor:grabbing}",
    ".gpmm-mueve .gpmm-pin,.gpmm-mueve .gpmm-ctrl,.gpmm-mueve .gpmm-pop{cursor:auto}",
    ".gpmm-llena,.gpmm-llena .gpmm-lienzo{height:100%}",
    ".gpmm-svg{position:absolute;inset:0;width:100%;height:100%;display:block}",
    ".gpmm-pais{fill:var(--gpmm-tierra,#f4f1ea);stroke:var(--gpmm-borde,#b9b2a3);stroke-width:var(--gpmm-trazo,.6);vector-effect:non-scaling-stroke;stroke-linejoin:round;transition:fill .6s}",
    ".gpmm-pais.gpmm-hay{fill:var(--gpmm-hay,#ead9a8)}",
    ".gpmm-pines{position:absolute;inset:0}",
    ".gpmm-pin{position:absolute;left:0;top:0;width:var(--t,34px);height:var(--t,34px);margin:calc(var(--t,34px) / -2) 0 0 calc(var(--t,34px) / -2);padding:0;border:0;border-radius:50%;background:transparent;cursor:pointer}",
    ".gpmm-pin:focus-visible{outline:3px solid var(--gpmm-aro,#c9a227);outline-offset:3px}",
    ".gpmm-pin img,.gpmm-pin .gpmm-sin{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 12%;border:2px solid var(--gpmm-aro,#c9a227);background:var(--gpmm-fondo-cara,#fff);box-shadow:0 2px 6px rgba(0,0,0,.35);box-sizing:border-box}",
    ".gpmm-pin .gpmm-sin,.gpmm-pop li i{display:flex;align-items:center;justify-content:center;background:var(--gpmm-aro,#c9a227);color:var(--gpmm-sin-tinta,#1f2933);font-style:normal;font-weight:700;font-size:max(12px,calc(var(--t,34px) * .45))}",
    ".gpmm-n{position:absolute;right:-.35em;top:-.35em;min-width:1.55em;height:1.55em;padding:0 .3em;border-radius:1em;background:var(--gpmm-numero,#8a1c1c);color:var(--gpmm-numero-tinta,#fff);font-size:max(11px,calc(var(--t,34px) * .34));font-weight:700;line-height:1.55em;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.4);box-sizing:border-box}",
    ".gpmm-nuevo{animation:gpmm-llega .9s cubic-bezier(.2,1.4,.4,1) both}",
    ".gpmm-nuevo::after{content:'';position:absolute;inset:-2px;border-radius:50%;border:3px solid var(--gpmm-aro,#c9a227);animation:gpmm-onda 1.6s ease-out .3s 2 both;pointer-events:none}",
    ".gpmm-late{animation:gpmm-late .7s ease-out}",
    "@keyframes gpmm-llega{0%{transform:translateY(-40%) scale(.2);opacity:0}60%{opacity:1}100%{transform:none;opacity:1}}",
    "@keyframes gpmm-onda{0%{transform:scale(1);opacity:.9}100%{transform:scale(2.4);opacity:0}}",
    "@keyframes gpmm-late{0%{transform:scale(1)}40%{transform:scale(1.25)}100%{transform:scale(1)}}",
    "@media (prefers-reduced-motion:reduce){.gpmm-nuevo,.gpmm-late,.gpmm-nuevo::after{animation:none}}",
    ".gpmm-cartel{position:absolute;left:50%;top:0;transform:translate(-50%,calc(-100% - .55em));white-space:nowrap;max-width:60vw;overflow:hidden;text-overflow:ellipsis;padding:.25em .6em;border-radius:.6em;background:var(--gpmm-cartel,rgba(20,16,10,.85));color:var(--gpmm-cartel-tinta,#fff);font-size:max(12px,calc(var(--t,34px) * .38));font-weight:600;pointer-events:none;animation:gpmm-cartel 4.2s ease both}",
    "@keyframes gpmm-cartel{0%{opacity:0}10%{opacity:1}80%{opacity:1}100%{opacity:0}}",
    ".gpmm-ctrl{position:absolute;right:.5em;bottom:.5em;display:flex;flex-wrap:wrap-reverse;justify-content:flex-end;gap:.35em;max-width:calc(100% - 1em);z-index:2}",
    ".gpmm-ctrl button{min-height:40px;min-width:40px;padding:0 .8em;border-radius:999px;border:1px solid var(--gpmm-borde,#b9b2a3);background:var(--gpmm-boton,rgba(255,255,255,.92));color:inherit;font:inherit;font-size:14px;font-weight:600;cursor:pointer}",
    ".gpmm-ctrl button[data-gpmm-z]{padding:0;font-size:20px;line-height:1}",
    ".gpmm-ctrl button[aria-pressed=true]{background:var(--gpmm-boton-activo,#1f2933);color:var(--gpmm-boton-activo-tinta,#fff)}",
    ".gpmm-vacio{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:80%;text-align:center;padding:.6em 1em;border-radius:.8em;background:var(--gpmm-boton,rgba(255,255,255,.9));font-weight:600}",
    ".gpmm-pop{position:absolute;z-index:3;width:min(300px,calc(100% - 16px));max-height:min(320px,calc(100% - 16px));overflow:auto;padding:.6em;border-radius:12px;background:var(--gpmm-pop,#fff);color:var(--gpmm-pop-tinta,#1f2933);box-shadow:0 8px 28px rgba(0,0,0,.35);box-sizing:border-box}",
    ".gpmm-pop h4{margin:0 2.2em .4em 0;font-size:15px;line-height:1.25;overflow-wrap:anywhere}",
    ".gpmm-pop ul{list-style:none;margin:0;padding:0;display:grid;gap:.3em}",
    ".gpmm-pop li{display:grid;grid-template-columns:36px minmax(0,1fr);gap:.5em;align-items:center;font-size:14px;min-width:0}",
    ".gpmm-pop li img,.gpmm-pop li i{width:36px;height:36px;border-radius:50%;object-fit:cover;object-position:50% 12%;background:var(--gpmm-aro,#c9a227)}",
    ".gpmm-pop li b,.gpmm-pop li small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".gpmm-pop li small{opacity:.75}",
    ".gpmm-pop .gpmm-x{position:absolute;right:.3em;top:.3em;width:40px;height:40px;border:0;border-radius:50%;background:transparent;color:inherit;font-size:22px;line-height:1;cursor:pointer}",
    ".gpmm-resumen{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.4em;margin:.6em 0 0;padding:0;list-style:none}",
    ".gpmm-resumen li{display:flex;justify-content:space-between;gap:.5em;min-width:0;padding:.45em .7em;border-radius:10px;background:var(--gpmm-chip,rgba(0,0,0,.05))}",
    ".gpmm-resumen li span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}",
    ".gpmm-resumen li b{flex:none}",
    // 10-nov · el globo (un lienzo de dibujo encima del mar) y los puntos que brillan
    ".gpmm-globo{position:absolute;inset:0;width:100%;height:100%;display:block}",
    ".gpmm-globo[hidden],.gpmm-svg[hidden],.gpmm-pista[hidden],.gpmm-ctrl button[hidden]{display:none}",
    ".gpmm-en-globo>.gpmm-lienzo{background:var(--gpmm-espacio,radial-gradient(ellipse at 50% 45%,#16233a,#05080f 78%))}",
    ".gpmm-en-globo .gpmm-vacio{top:auto;bottom:.6em;transform:translateX(-50%)}",
    // (en el globo los botones van en columna, a la derecha: el globo queda en el centro y abajo suele haber gente)
    ".gpmm-en-globo .gpmm-ctrl{flex-direction:column;flex-wrap:wrap-reverse;align-items:stretch;align-content:flex-end;justify-content:flex-end;top:.5em;max-width:none;pointer-events:none}",
    ".gpmm-en-globo .gpmm-ctrl button{pointer-events:auto}",
    ".gpmm-e0,.gpmm-e1{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none}.gpmm-e1{left:100%}",
    ".gpmm-pista{position:absolute;left:.6em;top:.6em;max-width:calc(100% - 1.2em);margin:0;padding:.45em .9em;border-radius:999px;background:var(--gpmm-boton,rgba(255,255,255,.92));font-size:13px;font-weight:600;line-height:1.2;pointer-events:none;z-index:2;animation:gpmm-pista 10s ease both;transition:opacity .6s}",
    ".gpmm-pista.gpmm-fuera{opacity:0!important;animation:none}",
    "@keyframes gpmm-pista{0%{opacity:0}8%{opacity:.95}85%{opacity:.95}100%{opacity:0}}",
    ".gpmm-mini .gpmm-ctrl,.gpmm-mini .gpmm-pista{display:none}",
    ".gpmm-brilla .gpmm-pin{isolation:isolate}",
    ".gpmm-brilla .gpmm-pin img,.gpmm-brilla .gpmm-pin .gpmm-sin{box-shadow:0 0 calc(var(--t,34px) * .4) calc(var(--t,34px) * .07) var(--gpmm-brillo,rgba(255,176,64,.8)),0 2px 6px rgba(0,0,0,.45)}",
    ".gpmm-brilla .gpmm-pin::before{content:'';position:absolute;inset:-32%;border-radius:50%;background:radial-gradient(closest-side,var(--gpmm-brillo,rgba(255,176,64,.8)),transparent);z-index:-1;opacity:.55;pointer-events:none;animation:gpmm-halo 2.6s ease-in-out var(--d,0s) infinite}",
    "@keyframes gpmm-halo{0%,100%{transform:scale(.82);opacity:.35}50%{transform:scale(1.18);opacity:.8}}",
    "@media (prefers-reduced-motion:reduce){.gpmm-brilla .gpmm-pin::before,.gpmm-pista{animation:none}}",
  ].join("\n");
  var T0 = {
    mundo: "Mundo", acercar: "Acercar", mas: "Acercar más", menos: "Alejar", vacio: "Aún no hay nadie en el mapa.", cerrar: "Cerrar",
    personas: "{n} personas", enCiudad: "{n} en {sitio}", soloPais: "{pais}", etiquetaMapa: "Mapa de dónde es la gente del grupo",
    plano: "Plano", globo: "Globo", verPlano: "Ver el mapa plano", verGlobo: "Ver el globo", pista: "Arrastra para girar",
  };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /** La inicial del alias (para quien aún no tiene personaje): la primera letra, sin espacios delante. */
  function inicial(s) { var m = String(s == null ? "" : s).trim().match(/./u); return m ? m[0].toUpperCase() : ""; }
  function ponerCss(doc) {
    if (!doc || doc.getElementById("gpmm-css")) return;
    var s = doc.createElement("style"); s.id = "gpmm-css"; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s);
  }
  function svgTierra(tierra, hay) {
    var p = (tierra && tierra.paises) || {};
    return Object.keys(p).map(function (c) { return '<path class="gpmm-pais' + (hay[c] ? " gpmm-hay" : "") + '" data-p="' + esc(c) + '" d="' + p[c] + '"/>'; }).join("");
  }

  /**
   * 🔴 11-nov · EL PULSO DE LAS ANIMACIONES. Norberto, con dos pantallas: «la de compartir con el estudiante no se movía ni se veía nada
   * en la bola del mundo». La ventana de la presentación, compartida desde detrás del mando (o en otro escritorio), el navegador la da
   * por escondida: no le da fotogramas (requestAnimationFrame) aunque quien la comparte sí la sigue viendo, y frena sus setTimeout a uno
   * por segundo. Así que: a la vista, requestAnimationFrame; escondida, el reloj de un worker (los relojes de un worker no se frenan) y,
   * sin worker, setTimeout. GP.mapaMundo.pulso(f) → id (f(t) una vez, como requestAnimationFrame) · GP.mapaMundo.quitarPulso(id).
   */
  var pulso = (function () {
    var cola = {}, n = 0, hay = 0, raf = 0, wk = null, sinWk = false, reloj = false, to = 0, doc = W && W.document, PASO = 33;
    function oculta() { return !!(doc && (doc.hidden === true || doc.visibilityState === "hidden")); }
    function ahora() { return W && W.performance && W.performance.now ? W.performance.now() : Date.now(); }
    function correr() {
      raf = 0; to = 0;
      var l = cola, t = ahora(); cola = {}; hay = 0;
      Object.keys(l).forEach(function (k) { try { l[k](t); } catch (e) { /* una que falle no para a las demás */ } });
      if (!hay) apagarReloj();
    }
    function trabajador() {
      if (wk || sinWk) return wk;
      try {
        var url = W.URL.createObjectURL(new W.Blob(["var i=0;onmessage=function(e){clearInterval(i);i=e.data?setInterval(function(){postMessage(0)},e.data):0}"], { type: "text/javascript" }));
        wk = new W.Worker(url); wk.onmessage = function () { if (reloj && hay) correr(); };
      } catch (e) { wk = null; sinWk = true; }
      return wk;
    }
    function encenderReloj() {
      if (reloj) return; reloj = true;
      var w = trabajador();
      if (w) try { w.postMessage(PASO); return; } catch (e) { /* sin worker: setTimeout */ }
      (function vuelta() { if (!reloj) return; to = setTimeout(function () { if (reloj && hay) correr(); if (reloj) vuelta(); }, PASO); })();
    }
    function apagarReloj() {
      if (!reloj) return; reloj = false;
      if (wk) try { wk.postMessage(0); } catch (e) { /* nada */ }
      if (to) { clearTimeout(to); to = 0; }
    }
    function mover() {
      if (!hay) { if (raf) { W.cancelAnimationFrame(raf); raf = 0; } apagarReloj(); return; }
      if (oculta()) { if (raf) { W.cancelAnimationFrame(raf); raf = 0; } encenderReloj(); }
      else { apagarReloj(); if (!raf) raf = W.requestAnimationFrame(correr); }
    }
    if (doc && doc.addEventListener) doc.addEventListener("visibilitychange", mover);
    return {
      puede: function () { return !!(W && W.requestAnimationFrame); },
      pedir: function (f) { var id = ++n; cola[id] = f; hay++; mover(); return id; },
      quitar: function (id) { if (id && cola[id]) { delete cola[id]; hay--; } if (!hay) mover(); },
    };
  })();

  function crear(el, o) {
    o = o || {};
    var doc = el.ownerDocument, T = Object.assign({}, T0, o.textos || {}), np = o.nombrePais || nombrePaisDe;
    var tierra = o.tierra || (W && W.GP_MAPA_TIERRA) || { paises: {} };
    var modo = o.encuadre === "mundo" ? "mundo" : "auto", controles = o.controles !== false, mover = o.mover !== false, libre = null, libreG = null;
    var gente = [], vistos = null, vb = [0, 0, ANCHO, ALTO], anim = 0, nuevos = {}, avisos = {}, zMax = o.zoomMax || 14;
    var rafG = pulso.puede() ? pulso.pedir : null;   // (11-nov · el pulso: también con la ventana escondida que se comparte)
    function reducido() { return !!(W && W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches); }
    function ahora() { return W && W.performance && W.performance.now ? W.performance.now() : Date.now(); }
    // 10-nov · EL GLOBO: lo pide `o.globo` (true o { lon, lat, acercar, ascuas }). Sin lienzo de dibujo (canvas 2D), el mapa plano de siempre.
    var GC = o.globo ? Object.assign({ lon: -20, lat: 18, acercar: 7, ascuas: false }, o.globo === true ? {} : o.globo) : null, puede = false;
    if (GC) { try { var prueba = doc.createElement("canvas"); puede = !!(prueba && prueba.getContext && prueba.getContext("2d")); } catch (e) { puede = false; } }
    ponerCss(doc);
    el.classList.add("gpmm"); if (o.llenar) el.classList.add("gpmm-llena"); if (mover) el.classList.add("gpmm-mueve"); if (o.brillo) el.classList.add("gpmm-brilla");
    el.innerHTML = '<div class="gpmm-lienzo" role="group" aria-label="' + esc(T.etiquetaMapa) + '"' + (o.llenar ? "" : ' style="aspect-ratio:' + (o.aspecto || 16 / 9) + '"') + ">" +
      '<svg class="gpmm-svg" viewBox="0 0 ' + ANCHO + " " + ALTO + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="gpmm-tierra"></g></svg>' +
      (puede ? '<canvas class="gpmm-globo" aria-hidden="true" hidden></canvas>' : "") +
      '<div class="gpmm-pines"></div><p class="gpmm-vacio" hidden>' + esc(T.vacio) + "</p>" +
      (puede && mover ? '<p class="gpmm-pista" hidden>' + esc(T.pista) + "</p>" : "") +
      (controles ? '<div class="gpmm-ctrl">' + (mover ? '<button type="button" data-gpmm-z="1" aria-label="' + esc(T.mas) + '" title="' + esc(T.mas) + '">+</button><button type="button" data-gpmm-z="-1" aria-label="' + esc(T.menos) + '" title="' + esc(T.menos) + '">−</button>' : "") +
        '<button type="button" data-gpmm="auto">' + esc(T.acercar) + '</button><button type="button" data-gpmm="mundo">' + esc(T.mundo) + "</button>" +
        (puede ? '<button type="button" data-gpmm-f="1"></button>' : "") + "</div>" : "") +
      '<div class="gpmm-pop" role="dialog" hidden></div><i class="gpmm-e0" aria-hidden="true"></i><i class="gpmm-e1" aria-hidden="true"></i></div>' + (o.resumen ? '<ul class="gpmm-resumen"></ul>' : "");
    var lienzo = el.querySelector(".gpmm-lienzo"), svg = el.querySelector(".gpmm-svg"), g = el.querySelector(".gpmm-tierra"),
      pines = el.querySelector(".gpmm-pines"), pop = el.querySelector(".gpmm-pop"), vacio = el.querySelector(".gpmm-vacio"), res = el.querySelector(".gpmm-resumen");
    var e0 = el.querySelector(".gpmm-e0"), e1 = el.querySelector(".gpmm-e1");
    var lienzoG = puede ? el.querySelector(".gpmm-globo") : null, pista = el.querySelector(".gpmm-pista"), bForma = el.querySelector("[data-gpmm-f]");
    var tierraHay = "";
    var G = null;
    if (lienzoG) {
      try { G = { ctx: lienzoG.getContext("2d") }; } catch (e) { G = null; }
      if (G && !G.ctx) G = null;
      if (G) Object.assign(G, { base: null, ver: null, off: { lon: 0, lat: 0 }, fase: 0, tr: null, vel: null, quieto: 0, t: 0, tPint: 0, raf: 0, llegada: {}, sitios: [],
        sAgr: 1, pal: null, estrellas: null, w: 0, h: 0, cx: 0, cy: 0, r0: 1, dpr: 1, m: matrizDe(0, 0), hay: {}, tocado: false, anillos: null });
    }
    var formaBase = G ? "globo" : "plano", forma = "plano";

    // (el tamaño de la maqueta, no el de la pantalla: dentro de una diapositiva escalada o girada, los avatares siguen en su sitio)
    function medidas() { return { w: lienzo.clientWidth || 0, h: lienzo.clientHeight || 0 }; }
    function tam(m) { return o.tam || Math.round(clamp(m.w / 26, 24, 58)); }
    function xyDe(p) { return proyectar(p.lat, p.lon); }
    function destino(m) { if (modo === "libre" && libre) return ajustar(libre, m); return modo === "mundo" || !gente.length ? encuadre([], m.w / (m.h || 1)) : encuadre(gente.filter(valida).map(xyDe), m.w / (m.h || 1), { minAncho: o.minAncho }); }
    function pintarTierra() {
      var hay = {}; gente.forEach(function (p) { if (p.pais) hay[p.pais] = 1; });
      if (G) G.hay = hay;
      var k = Object.keys(hay).sort().join(",");
      if (k === tierraHay && g.firstChild) return;
      tierraHay = k; g.innerHTML = svgTierra(tierra, hay);
    }
    /** Los avatares (uno por burbuja). `conSitio`: con su sitio escrito (el mapa plano); en el globo los coloca cada fotograma. */
    function htmlPines(grupos, t, conAnim, conSitio) {
      return grupos.map(function (b, i) {
        var p0 = b.gente[0], n = b.gente.length, nuevo = conAnim && b.gente.some(function (p) { return nuevos[p.id]; });
        var todosNuevos = nuevo && b.gente.every(function (p) { return nuevos[p.id]; });
        var sitio = b.sitios.length === 1 ? (b.sitios[0].ciudad || np(b.sitios[0].pais)) : "";
        var etq = n === 1 ? p0.alias + (sitio ? ", " + sitio : "") : T.enCiudad.replace("{n}", n).replace("{sitio}", sitio || T.personas.replace("{n}", n));
        var aviso = b.gente.filter(function (p) { return avisos[p.id]; })[0];
        return '<button type="button" class="gpmm-pin' + (todosNuevos ? " gpmm-nuevo" : nuevo ? " gpmm-late" : "") + '" data-gpmm-b="' + i + '" style="--t:' + t + "px;--d:-" + ((i % 7) * 0.37).toFixed(2) + "s;" +
          (conSitio ? "left:" + Math.round(b.x) + "px;top:" + Math.round(b.y) + "px;" : "visibility:hidden;") + "animation-delay:" + (todosNuevos && o._escalonar ? Math.min(i, 20) * 60 : 0) + 'ms" aria-label="' + esc(etq) + '">' +
          (p0.img ? '<img src="' + esc(p0.img) + '" alt="" loading="lazy" draggable="false">' : '<i class="gpmm-sin">' + esc(inicial(p0.alias)) + "</i>") + (n > 1 ? '<b class="gpmm-n">' + n + "</b>" : "") +
          (aviso ? '<span class="gpmm-cartel">' + esc(aviso.alias + ((aviso.ciudad || aviso.pais) ? " · " + (aviso.ciudad || np(aviso.pais)) : "")) + "</span>" : "") + "</button>";
      }).join("");
    }
    function pintarPines(m, conAnim) {
      var t = tam(m), sx = m.w / vb[2], sy = m.h / vb[3];
      var sitios = porCiudad(gente).map(function (s) { var q = proyectar(s.lat, s.lon); s.x = (q[0] - vb[0]) * sx; s.y = (q[1] - vb[1]) * sy; return s; });
      var grupos = agrupar(sitios, t * 0.8);
      pines.innerHTML = htmlPines(grupos, t, conAnim, true);
      pines._grupos = grupos; pines._firma = "";
      vacio.hidden = gente.some(valida);
    }
    function ponerVb(v) { vb = v; svg.setAttribute("viewBox", v.join(" ")); }
    // 🔴 11-nov · SIN TAMAÑO TODAVÍA (la caja escondida al crearlo: p. ej. la ventana de la presentación con la página aún cerrada): antes
    // solo lo arreglaba el ResizeObserver, que con la ventana escondida (compartida desde detrás) no salta, y el globo no se pintaba nunca.
    // Ahora, además, se vuelve a mirar cada poco hasta que tenga tamaño (o se destruya).
    var esperaTam = 0, muerto = false, pidiendo = false;
    function esperarTam() {
      if (esperaTam || muerto || pidiendo) return;
      pidiendo = true;   // (un setTimeout que contestara en el acto no da vueltas sin fin)
      esperaTam = setTimeout(function () { esperaTam = 0; if (!muerto && !pidiendo) maquetar(false); }, 400);
      pidiendo = false;
    }
    function maquetar(conAnim) {
      var mm = medidas(); if (mm.w && mm.h) el.classList.toggle("gpmm-mini", mm.w < 240 || mm.h < 120); else esperarTam();   // en miniatura (la diapositiva en pequeño) no caben los botones
      if (forma === "globo") return gMaquetar(conAnim);
      var m = medidas(); if (!m.w || !m.h) return;
      var d = destino(m), desde = vb.slice();
      if (anim) { (W && W.cancelAnimationFrame || clearTimeout)(anim); anim = 0; }
      var igual = desde.every(function (v, i) { return Math.abs(v - d[i]) < 0.5; });
      var raf = W && W.requestAnimationFrame;
      if (igual || !raf || reducido() || !vistosAntes) { ponerVb(d); pintarPines(m, conAnim); vistosAntes = true; return; }
      var t0 = 0, dur = 700;
      pintarPines(m, conAnim);
      var paso = function (ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        ponerVb(desde.map(function (v, i) { return v + (d[i] - v) * e; }));
        // los avatares siguen al mapa mientras se mueve (sin reagrupar: al final, sí)
        var sx = m.w / vb[2], sy = m.h / vb[3];
        (pines._grupos || []).forEach(function (b, i) {
          var q = proyectar(b.sitios[0].lat, b.sitios[0].lon), e2 = pines.children[i];
          if (e2) { e2.style.left = Math.round((q[0] - vb[0]) * sx) + "px"; e2.style.top = Math.round((q[1] - vb[1]) * sy) + "px"; }
        });
        if (k < 1) anim = raf(paso); else { anim = 0; pintarPines(m, false); }
      };
      anim = raf(paso);
    }
    var vistosAntes = false;
    function pintarResumen() {
      if (!res) return;
      res.innerHTML = resumenPaises(gente, np).map(function (x) { return "<li><span>" + esc(x.nombre) + "</span><b>" + x.n + "</b></li>"; }).join("");
    }
    function marcarBotones() {
      Array.prototype.forEach.call(el.querySelectorAll("[data-gpmm]"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-gpmm") === modo)); });
    }
    function abrir(i, boton) {
      var b = (pines._grupos || [])[i]; if (!b) return;
      var sitios = b.sitios.map(function (s) { return s.ciudad || np(s.pais); }).filter(function (x, k, a) { return x && a.indexOf(x) === k; });
      var titulo = b.gente.length === 1 ? b.gente[0].alias : T.enCiudad.replace("{n}", b.gente.length).replace("{sitio}", sitios.join(", ") || T.personas.replace("{n}", b.gente.length));
      pop.innerHTML = '<button type="button" class="gpmm-x" aria-label="' + esc(T.cerrar) + '">×</button><h4>' + esc(titulo) + "</h4><ul>" +
        b.gente.slice().sort(function (a, c) { return String(a.alias).localeCompare(String(c.alias), "es"); }).map(function (p) {
          var donde = p.ciudad ? p.ciudad + (p.pais ? " (" + np(p.pais) + ")" : "") : np(p.pais);
          return "<li>" + (p.img ? '<img src="' + esc(p.img) + '" alt="" loading="lazy">' : "<i>" + esc(inicial(p.alias)) + "</i>") + "<span><b>" + esc(p.alias) + "</b><small>" + esc(donde) + "</small></span></li>";
        }).join("") + "</ul>";
      pop.hidden = false;
      var m = medidas(), pw = pop.offsetWidth || 260, ph = pop.offsetHeight || 160;
      var x = clamp(b.x - pw / 2, 8, Math.max(8, m.w - pw - 8)), y = b.y + tam(m) / 2 + 8;
      if (y + ph > m.h - 8) y = Math.max(8, b.y - tam(m) / 2 - 8 - ph);
      pop.style.left = Math.round(x) + "px"; pop.style.top = Math.round(y) + "px";
      pop._boton = boton; var x2 = pop.querySelector(".gpmm-x"); if (x2 && x2.focus) x2.focus();
    }
    // 19-oct · lo que se ve, libre: con la proporción del lienzo (centrado en lo pedido), de `zoomMax` veces el mundo al mundo, y dentro de él
    function ajustar(v, m) {
      var a = m.w / (m.h || 1) || 16 / 9, cx = v[0] + v[2] / 2, cy = v[1] + v[3] / 2, w = Math.max(v[2], v[3] * a);
      w = clamp(w, ANCHO / zMax, Math.max(ANCHO, ALTO * a)); var h = w / a;
      var x = w >= ANCHO ? (ANCHO - w) / 2 : clamp(cx - w / 2, 0, ANCHO - w), y = h >= ALTO ? (ALTO - h) / 2 : clamp(cy - h / 2, 0, ALTO - h);
      return [x, y, w, h].map(function (n) { return Math.round(n * 10) / 10; });
    }
    function verLibre(v) {
      var m = medidas(); if (!m.w || !m.h) return;
      if (anim) { (W && W.cancelAnimationFrame || clearTimeout)(anim); anim = 0; }
      modo = "libre"; libre = ajustar(v, m); ponerVb(libre); pintarPines(m, false); marcarBotones(); vistosAntes = true;
    }
    function avisarCambio() { if (o.alCambiar) try { o.alCambiar(api.vista()); } catch (e) { /* lo de la web no para el mapa */ } }
    // acercar (f < 1) o alejar (f > 1) con el punto (px, py) del lienzo quieto
    function zoom(f, px, py) {
      var m = medidas(); if (!m.w || !m.h) return;
      var ux = vb[0] + (px == null ? m.w / 2 : px) / m.w * vb[2], uy = vb[1] + (py == null ? m.h / 2 : py) / m.h * vb[3];
      var w = vb[2] * f, h = vb[3] * f, rx = (ux - vb[0]) / vb[2], ry = (uy - vb[1]) / vb[3];
      verLibre([ux - rx * w, uy - ry * h, w, h]);
    }

    // ─────────────────────────────────────────────── 10-nov · EL GLOBO
    // Lo que se ve es { lon, lat, s }: el punto del mundo que queda en el centro y cuánto se acerca (1 = el globo entero). `G.base` es donde
    // está parado (lo que se manda a las otras pantallas); encima, mientras nadie lo toca, se mece (o da la vuelta, con `gira`): `G.off`.
    /** De lo que se ve en el globo al recuadro del mapa plano, y al revés (para cambiar de forma sin perder el sitio). */
    function aPlano(v) { var c = proyectar(v[1], v[0]), w = clamp(ANCHO * 0.5 / v[2], ANCHO / zMax, ANCHO), h = w * 9 / 16; return [c[0] - w / 2, c[1] - h / 2, w, h]; }
    function aGlobo(v) { var q = desproyectar(v[0] + v[2] / 2, v[1] + v[3] / 2); return [r2(q[1]), r2(clamp(q[0], G_LAT0, G_LAT1)), clamp(ANCHO * 0.5 / v[2], 1, zMax)]; }
    function ponerForma(f) {
      f = f === "globo" && G ? "globo" : "plano";
      if (f === forma) return;
      forma = f;
      el.classList.toggle("gpmm-en-globo", f === "globo");
      if (lienzoG) lienzoG.hidden = f !== "globo";
      if (f === "globo") svg.setAttribute("hidden", ""); else svg.removeAttribute("hidden");   // (un SVG no tiene la propiedad `hidden`: el atributo)
      if (pista) pista.hidden = f !== "globo";
      pines._firma = ""; vistosAntes = false;
      if (anim) { (W && W.cancelAnimationFrame || clearTimeout)(anim); anim = 0; }
      if (G && f !== "globo" && G.raf) { pulso.quitar(G.raf); G.raf = 0; }
      marcarForma();
    }
    function marcarForma() {
      if (!bForma) return;
      bForma.textContent = forma === "globo" ? T.plano : T.globo;
      bForma.setAttribute("aria-label", forma === "globo" ? T.verPlano : T.verGlobo); bForma.setAttribute("title", forma === "globo" ? T.verPlano : T.verGlobo);
    }
    function gPaleta() {
      var cs = null; try { cs = W && W.getComputedStyle ? W.getComputedStyle(el) : null; } catch (e) { cs = null; }
      function v(n, d) { var x = cs && cs.getPropertyValue ? cs.getPropertyValue(n) : ""; return rgbDe(G.ctx, x && String(x).trim(), d); }
      G.pal = { mar: v("--gpmm-globo-mar", [13, 24, 42]), mar2: v("--gpmm-globo-mar2", [36, 66, 104]), tierra: v("--gpmm-globo-tierra", [52, 76, 98]),
        borde: v("--gpmm-globo-borde", [136, 174, 210]), hay: v("--gpmm-globo-hay", [240, 207, 119]), halo: v("--gpmm-globo-halo", [110, 176, 255]),
        brasa: v("--gpmm-globo-brasa", [255, 190, 96]), brasa2: v("--gpmm-globo-brasa2", [255, 120, 40]), nucleo: v("--gpmm-globo-nucleo", [255, 250, 230]),
        estrella: v("--gpmm-globo-estrella", [255, 240, 214]) };
    }
    function gTam(m) {
      var d = Math.min(2, (W && W.devicePixelRatio) || 1), cw = Math.round(m.w * d), ch = Math.round(m.h * d);
      if (lienzoG.width !== cw || lienzoG.height !== ch) { lienzoG.width = cw; lienzoG.height = ch; G.pal = null; }
      G.dpr = d; G.w = m.w; G.h = m.h; G.cx = m.w / 2; G.cy = m.h / 2; G.r0 = Math.max(16, Math.min(m.w, m.h) * 0.45);
      if (!G.pal) gPaleta();
      if (!G.anillos) G.anillos = anillosDe(tierra);
      var n = Math.round(clamp(m.w * m.h / 7000, 24, 150));
      if (!G.estrellas || G.estrellas.length !== n) {   // el cielo: [x, y, radio, hondura, subida, fase], siempre el mismo (sin azar de verdad)
        var sem = 7, az = function () { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
        G.estrellas = []; for (var i = 0; i < n; i++) G.estrellas.push([az(), az(), 0.5 + az() * 1.1, 0.25 + az() * 0.75, 0.006 + az() * 0.02, az() * TAU]);
      }
    }
    function gDestino(m) {
      if (modo === "libre" && libreG) return { lon: normLon(libreG[0]), lat: clamp(libreG[1], G_LAT0, G_LAT1), s: clamp(libreG[2], 1, zMax), gira: false };
      var pts = gente.filter(valida);
      if (modo === "mundo" || !pts.length) return { lon: G.ver ? normLon(G.ver.lon) : GC.lon, lat: GC.lat, s: 1, gira: true };
      return encuadreGlobo(pts.map(function (p) { return [Number(p.lat), Number(p.lon)]; }), m.w, m.h, { lon: GC.lon, lat: GC.lat, sMax: GC.acercar, margen: tam(m) * 1.5 });
    }
    function gMaquetar(conAnim) {
      var m = medidas(); if (!m.w || !m.h) return;
      gTam(m);
      var d = gDestino(m), b = G.base;
      if (!b) {   // la primera vez llega girando desde lejos (con movimiento reducido, ya en su sitio)
        G.base = d; G.ver = { lon: d.lon, lat: d.lat, s: d.s }; G.quieto = ahora();
        if (!reducido() && rafG) { G.ver = { lon: d.lon - 75, lat: d.lat, s: d.s * 0.7 }; gIr(d, 1700); }
      } else if (b.gira !== d.gira || Math.abs(d.lat - b.lat) > 0.3 || Math.abs(d.s / b.s - 1) > 0.01 || (!d.gira && Math.abs(dLon(d.lon, b.lon)) > 0.3)) gIr(d, 900);
      gPines(conAnim);
      vistosAntes = true;
      gArranca();
    }
    function gIr(d, dur) {
      var de = { lon: G.ver.lon, lat: G.ver.lat, s: G.ver.s };
      cerrar();
      G.base = { lon: normLon(d.lon), lat: d.lat, s: d.s, gira: !!d.gira }; G.off = { lon: 0, lat: 0 }; G.fase = 0; G.vel = null;
      if (reducido() || !rafG || !(dur > 0)) { G.tr = null; G.ver = { lon: G.base.lon, lat: G.base.lat, s: G.base.s }; G.quieto = ahora(); }
      else G.tr = { de: de, dlon: dLon(d.lon, de.lon), t0: ahora(), dur: dur };
      gArranca();
    }
    /** Alguien lo coge: se queda donde se ve (lo que se mecía pasa a ser su sitio) y deja de moverse solo. */
    function gToca() {
      var v = G.ver;
      G.base = { lon: normLon(v.lon), lat: clamp(v.lat, G_LAT0, G_LAT1), s: clamp(v.s, 1, zMax), gira: false };
      G.ver = { lon: G.base.lon, lat: G.base.lat, s: G.base.s }; G.off = { lon: 0, lat: 0 }; G.fase = 0; G.tr = null; G.vel = null;
    }
    function gLibre() { modo = "libre"; libreG = [r2(G.base.lon), r2(G.base.lat), Math.round(G.base.s * 1000) / 1000]; G.quieto = ahora(); marcarBotones(); }
    function gFueraPista() { if (G.tocado) return; G.tocado = true; if (pista) pista.classList.add("gpmm-fuera"); }
    function claveSitio(s) { return Number(s.lat).toFixed(2) + "," + Number(s.lon).toFixed(2); }
    /** Las burbujas del globo: se juntan los sitios que se taparían mirándolos de frente (no cambia al girar: solo al acercar o alejar). */
    function gPines(conAnim) {
      var m = medidas(), t = tam(m), R = G.r0 * G.base.s;
      var sitios = porCiudad(gente).map(function (s) { var v = vec(s.lat, s.lon); s.v = v; s.k = claveSitio(s); s.x = v[0] * R; s.y = v[1] * R; s.z = v[2] * R; return s; });
      var grupos = agrupar(sitios, t * 0.8);
      grupos.forEach(function (b) { b.v = b.sitios[0].v; });
      G.sitios = sitios; G.sAgr = G.base.s;
      var firma = t + "|" + grupos.map(function (b) { return b.gente.map(function (p) { return p.id + ":" + (p.img || ""); }).join(","); }).join(";");
      if (firma !== pines._firma || (conAnim && Object.keys(nuevos).length)) { pines.innerHTML = htmlPines(grupos, t, conAnim, false); pines._firma = firma; }
      pines._grupos = grupos;
      vacio.hidden = gente.some(valida);
      gColoca();
    }
    /** Cada avatar, en su sitio de la pantalla: clavado un poco por encima del suelo (se nota al girar) y fuera cuando queda detrás. */
    function gColoca() {
      var gs = pines._grupos || [], v = G.ver, R = G.r0 * v.s, m = G.m = matrizDe(v.lon, v.lat), t = tam({ w: G.w }), a = 1 + clamp(R * 0.07, 8, t * 0.7) / R, i;
      for (i = 0; i < gs.length; i++) {
        var b = gs[i], e = pines.children[i], p = b.v; if (!e || !p) continue;
        var x = m[0] * p[0] + m[1] * p[1], y = m[3] * p[0] + m[4] * p[1] + m[5] * p[2], z = m[6] * p[0] + m[7] * p[1] + m[8] * p[2];
        b.sx = G.cx + R * x; b.sy = G.cy - R * y; b.x = G.cx + R * x * a; b.y = G.cy - R * y * a; b.z = z;
        var op = clamp((z + 0.05) / 0.2, 0, 1), st = e.style;
        st.left = b.x.toFixed(1) + "px"; st.top = b.y.toFixed(1) + "px"; st.opacity = op.toFixed(2);
        st.visibility = op <= 0 ? "hidden" : "visible"; st.pointerEvents = op < 0.4 ? "none" : "";
      }
    }
    function gOnda(c, px, py, x, y, z, radio, alfa, color) {
      if (alfa <= 0.01 || radio <= 0.5) return;
      c.strokeStyle = col(color, alfa); c.beginPath();
      if (c.ellipse) c.ellipse(px, py, radio * Math.max(z, 0.1), radio, Math.atan2(-y, x), 0, TAU); else c.arc(px, py, radio, 0, TAU);
      c.stroke();
    }
    function gPinta(t) {
      var c = G.ctx, P = G.pal, v = G.ver, R = G.r0 * v.s, cx = G.cx, cy = G.cy, m = G.m, red = reducido(), seg = t / 1000, i, j, x, y, z, k, gr;
      c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); c.clearRect(0, 0, G.w, G.h);
      c.globalCompositeOperation = "source-over";
      // el cielo: se corre al girar (lo de lejos, menos) y, con `ascuas`, sube despacio
      var E = G.estrellas || [];
      c.fillStyle = col(P.estrella, 1);
      for (i = 0; i < E.length; i++) {
        var e = E[i], ex = e[0] - v.lon / 360 * e[3] * 0.6, ey = e[1] - (GC.ascuas && !red ? seg * e[4] : 0);
        c.globalAlpha = red ? 0.45 : 0.18 + 0.62 * (0.5 + 0.5 * Math.sin(seg * (0.5 + e[3]) + e[5]));
        c.beginPath(); c.arc((ex - Math.floor(ex)) * G.w, (ey - Math.floor(ey)) * G.h, e[2], 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
      // el resplandor de alrededor
      var late = red ? 1 : 0.86 + 0.14 * Math.sin(seg * 0.8);
      gr = c.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.26);
      gr.addColorStop(0, col(P.halo, 0.5 * late)); gr.addColorStop(0.3, col(P.halo, 0.2 * late)); gr.addColorStop(1, col(P.halo, 0));
      c.fillStyle = gr; c.beginPath(); c.arc(cx, cy, R * 1.26, 0, TAU); c.fill();
      // el mar, con la luz arriba a la izquierda
      gr = c.createRadialGradient(cx - R * 0.38, cy - R * 0.42, R * 0.04, cx, cy, R);
      gr.addColorStop(0, col(P.mar2, 1)); gr.addColorStop(1, col(P.mar, 1));
      c.fillStyle = gr; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
      // meridianos y paralelos
      var L = reticula(), pluma;
      c.strokeStyle = col(P.borde, 0.14); c.lineWidth = 1; c.beginPath();
      for (i = 0; i < L.length; i++) {
        var q = L[i]; pluma = false;
        for (j = 0; j < q.length; j += 3) {
          z = m[6] * q[j] + m[7] * q[j + 1] + m[8] * q[j + 2];
          if (z <= 0) { pluma = false; continue; }
          x = cx + R * (m[0] * q[j] + m[1] * q[j + 1]); y = cy - R * (m[3] * q[j] + m[4] * q[j + 1] + m[5] * q[j + 2]);
          if (pluma) c.lineTo(x, y); else c.moveTo(x, y);
          pluma = true;
        }
      }
      c.stroke();
      // los países: lo que queda detrás se pega al borde (así el relleno no se sale) y su línea no se dibuja
      var A = G.anillos || [], hay = G.hay || {}, a, n, X, Y, Z, p;
      for (i = 0; i < A.length; i++) {
        a = A[i];
        if (m[6] * a.cap[0] + m[7] * a.cap[1] + m[8] * a.cap[2] < -a.cs) { a.ve = false; continue; }
        p = a.p; n = a.n; X = a.X; Y = a.Y; Z = a.Z; a.ve = false;
        for (j = 0; j < n; j++) {
          var vx = p[3 * j], vy = p[3 * j + 1], vz = p[3 * j + 2];
          x = m[0] * vx + m[1] * vy; y = m[3] * vx + m[4] * vy + m[5] * vz; z = m[6] * vx + m[7] * vy + m[8] * vz;
          if (z < 0) { k = 1 / Math.sqrt(x * x + y * y || 1e-9); x *= k; y *= k; } else a.ve = true;
          X[j] = cx + R * x; Y[j] = cy - R * y; Z[j] = z;
        }
      }
      for (var pasada = 0; pasada < 2; pasada++) {
        c.beginPath();
        for (i = 0; i < A.length; i++) {
          a = A[i]; if (!a.ve || !!hay[a.c] !== (pasada === 1)) continue;
          X = a.X; Y = a.Y; c.moveTo(X[0], Y[0]);
          for (j = 1; j < a.n; j++) c.lineTo(X[j], Y[j]);
          c.closePath();
        }
        c.fillStyle = col(pasada ? P.hay : P.tierra, 1); c.fill();
      }
      c.beginPath();
      for (i = 0; i < A.length; i++) {
        a = A[i]; if (!a.ve) continue;
        X = a.X; Y = a.Y; Z = a.Z; n = a.n; pluma = false;
        for (j = 1; j <= n; j++) {
          var u = j % n, w = j - 1;
          if (Z[u] < 0 || Z[w] < 0 || a.f[u]) { pluma = false; continue; }
          if (!pluma) c.moveTo(X[w], Y[w]);
          c.lineTo(X[u], Y[u]); pluma = true;
        }
      }
      c.strokeStyle = col(P.borde, 0.8); c.lineWidth = 0.8; c.lineJoin = "round"; c.stroke();
      // el volumen: la sombra hacia el borde y un brillo donde da la luz
      gr = c.createRadialGradient(cx - R * 0.32, cy - R * 0.36, R * 0.1, cx, cy, R);
      gr.addColorStop(0, "rgba(255,240,210,.13)"); gr.addColorStop(0.5, "rgba(0,0,0,0)"); gr.addColorStop(0.84, "rgba(0,0,0,.3)"); gr.addColorStop(1, "rgba(0,0,0,.68)");
      c.fillStyle = gr; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
      c.strokeStyle = col(P.halo, 0.55); c.lineWidth = 1.2; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      // los puntos: brillan (un ascua que late y su onda sobre el suelo); quien acaba de llegar, con un destello
      var S = G.sitios || [], gs = pines._grupos || [];
      c.globalCompositeOperation = "lighter"; c.lineWidth = 1.6;
      for (i = 0; i < S.length; i++) {
        var s = S[i], sv = s.v, tl = G.llegada[s.k];
        if (tl != null && t < tl) continue;   // aún no ha llegado (los del principio entran uno detrás de otro)
        x = m[0] * sv[0] + m[1] * sv[1]; y = m[3] * sv[0] + m[4] * sv[1] + m[5] * sv[2]; z = m[6] * sv[0] + m[7] * sv[1] + m[8] * sv[2];
        var ll = tl == null ? -1 : (t - tl) / 2800;
        if (ll >= 1) { delete G.llegada[s.k]; ll = -1; }
        if (z < 0.03) continue;
        var f = clamp(z / 0.3, 0, 1), px = cx + R * x, py = cy - R * y;
        var rr0 = clamp(R * 0.013, Math.min(3.5, R * 0.05), 8), rr = rr0 * (1 + 0.3 * Math.min(4, Math.log(s.gente.length) / Math.LN2));
        var pulso = red ? 0.6 : 0.5 + 0.5 * Math.sin(seg * 2.4 + i * 1.7), rg = rr * (3.4 + pulso * 1.4);
        gr = c.createRadialGradient(px, py, 0, px, py, rg);
        gr.addColorStop(0, col(P.nucleo, 0.95 * f)); gr.addColorStop(0.16, col(P.brasa, 0.8 * f)); gr.addColorStop(0.5, col(P.brasa2, 0.24 * f)); gr.addColorStop(1, col(P.brasa2, 0));
        c.fillStyle = gr; c.beginPath(); c.arc(px, py, rg, 0, TAU); c.fill();
        if (!red) { var on = (seg * 0.42 + i * 0.37) % 1; gOnda(c, px, py, x, y, z, rr * (2 + 7 * on), (1 - on) * (1 - on) * 0.55 * f, P.brasa); }
        if (ll >= 0) {
          var ap = 1 - ll, rd = rr0 * (6 + 13 * ll);
          gr = c.createRadialGradient(px, py, 0, px, py, rd);
          gr.addColorStop(0, col(P.nucleo, ap * ap * f)); gr.addColorStop(0.25, col(P.brasa, 0.7 * ap * ap * f)); gr.addColorStop(1, col(P.brasa2, 0));
          c.fillStyle = gr; c.beginPath(); c.arc(px, py, rd, 0, TAU); c.fill();
          gOnda(c, px, py, x, y, z, rr0 * (3 + 26 * ll), ap * 0.9 * f, P.nucleo);
          gOnda(c, px, py, x, y, z, rr0 * (2 + 15 * ll), ap * 0.7 * f, P.brasa);
        }
      }
      // el tallo de luz, del suelo al avatar
      for (i = 0; i < gs.length; i++) {
        var b = gs[i]; if (b.z == null || b.z < 0.03) continue;
        var dx = b.x - b.sx, dy = b.y - b.sy; if (dx * dx + dy * dy < 9) continue;
        gr = c.createLinearGradient(b.sx, b.sy, b.x, b.y);
        gr.addColorStop(0, col(P.brasa, 0.9 * clamp(b.z / 0.3, 0, 1))); gr.addColorStop(1, col(P.brasa, 0.1));
        c.strokeStyle = gr; c.beginPath(); c.moveTo(b.sx, b.sy); c.lineTo(b.x, b.y); c.stroke();
      }
      c.globalCompositeOperation = "source-over";
    }
    function gArranca() {
      if (!G || forma !== "globo" || G.raf) return;
      if (rafG) G.raf = rafG(gPaso); else gPaso();
    }
    function gPaso() {
      G.raf = 0;
      if (forma !== "globo" || !G.base) return;
      var m = medidas(); if (!m.w || !m.h) { esperarTam(); return; }   // sin tamaño: se para y se vuelve a mirar cada poco (esperarTam)
      var t = ahora(), red = reducido(), vivo = !!(G.tr || G.vel || gesto);
      if (!vivo && G.tPint && t - G.tPint < 30 && rafG) { G.raf = rafG(gPaso); return; }   // parado solo late: con 30 fotogramas va de sobra
      var dt = Math.min(80, Math.max(0, t - (G.t || t))), b = G.base; G.t = t;
      if (G.tr) {
        var k = clamp((t - G.tr.t0) / G.tr.dur, 0, 1), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, de = G.tr.de;
        G.ver = { lon: de.lon + G.tr.dlon * e, lat: de.lat + (b.lat - de.lat) * e, s: de.s * Math.pow(b.s / de.s, e) };
        if (k >= 1) { G.tr = null; G.quieto = t; G.ver = { lon: b.lon, lat: b.lat, s: b.s }; if (Math.abs(Math.log(b.s / G.sAgr)) > 0.02) gPines(false); }
      } else {
        if (G.vel) {   // lo han soltado girando: sigue un poco y se va parando
          b.lon = normLon(b.lon + G.vel.lon * dt); b.lat = clamp(b.lat + G.vel.lat * dt, G_LAT0, G_LAT1);
          var fr = Math.exp(-dt / 280); G.vel.lon *= fr; G.vel.lat *= fr;
          if (Math.abs(G.vel.lon) + Math.abs(G.vel.lat) < 0.004) { G.vel = null; gLibre(); avisarCambio(); }
        } else if (!gesto && pop.hidden && !red) {   // nadie lo toca: da la vuelta despacio (el mundo entero) o se mece sobre su gente
          var calma = clamp((t - G.quieto - 1200) / 2500, 0, 1);
          if (b.gira) { G.off.lon += 4.5 * dt / 1000 * calma; G.off.lat = 0; }
          else { G.fase += dt / 1000 * calma; var am = Math.min(12, 24 / b.s); G.off.lon = am * Math.sin(TAU * G.fase / 34); G.off.lat = am * 0.28 * Math.sin(TAU * G.fase / 47); }
        }
        G.ver = { lon: b.lon + G.off.lon, lat: clamp(b.lat + G.off.lat, G_LAT0 - 5, G_LAT1 + 5), s: b.s };
      }
      gColoca(); gPinta(t); G.tPint = t;
      if (rafG && (!red || G.tr || G.vel || gesto)) G.raf = rafG(gPaso);
    }
    function gMover(ids) {
      var dos = ids.length >= 2 && gesto.p.length >= 2, g0, s, dx, dy;
      if (!dos && !gesto.movido && Math.abs(dedos[ids[0]][0] - gesto.p[0][0]) + Math.abs(dedos[ids[0]][1] - gesto.p[0][1]) < 4) return;
      if (!gesto.g) { gToca(); gesto.g = { lon: G.base.lon, lat: G.base.lat, s: G.base.s }; }   // hasta que no se mueve de verdad, sigue a lo suyo
      g0 = gesto.g; s = g0.s;
      if (dos) {   // pellizco: acerca o aleja, y gira con el centro de los dedos
        var a = dedos[ids[0]], b = dedos[ids[1]], a0 = gesto.p[0], b0 = gesto.p[1];
        var d0 = Math.hypot(a0[0] - b0[0], a0[1] - b0[1]) || 1, d1 = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
        s = clamp(g0.s * d1 / d0, 1, zMax); dx = (a[0] + b[0] - a0[0] - b0[0]) / 2; dy = (a[1] + b[1] - a0[1] - b0[1]) / 2;
      } else {
        var p0 = gesto.p[0], p = dedos[ids[0]]; dx = p[0] - p0[0]; dy = p[1] - p0[1];
        lienzo.classList.add("gpmm-arrastra");
      }
      var R = G.r0 * s;
      G.base.lon = normLon(g0.lon - dx / R / RAD); G.base.lat = clamp(g0.lat + dy / R / RAD, G_LAT0, G_LAT1); G.base.s = s;
      G.ver = { lon: G.base.lon, lat: G.base.lat, s: s };
      gesto.muestras.push([ahora(), G.base.lon, G.base.lat]); if (gesto.muestras.length > 8) gesto.muestras.shift();
      gesto.movido = true; cerrar(); gLibre(); gFueraPista();
      if (Math.abs(Math.log(s / G.sAgr)) > 0.14) gPines(false);
      gArranca();
    }
    function gSuelta(g) {
      var ms = (g && g.muestras) || [], u = ms[ms.length - 1], a = null, t = ahora(), i;
      for (i = ms.length - 2; i >= 0 && u; i--) if (u[0] - ms[i][0] >= 40) { a = ms[i]; break; }
      gLibre();
      if (Math.abs(Math.log(G.base.s / G.sAgr)) > 0.02) gPines(false);
      if (a && t - u[0] < 90 && !reducido() && rafG) {
        var dt = u[0] - a[0], vl = dLon(u[1], a[1]) / dt, vp = (u[2] - a[2]) / dt;   // grados por milisegundo
        if (Math.abs(vl) + Math.abs(vp) > 0.012) { G.vel = { lon: clamp(vl, -0.22, 0.22), lat: clamp(vp, -0.22, 0.22) }; gArranca(); return; }   // avisa al pararse
      }
      avisarCambio();
    }
    function gZoom(f) { gToca(); gIr({ lon: G.base.lon, lat: G.base.lat, s: clamp(G.base.s * f, 1, zMax) }, 320); gLibre(); gPines(false); gFueraPista(); }

    var dedos = {}, gesto = null, reloj = 0;
    /**
     * Dónde cae el ratón o el dedo, en las medidas de la maqueta. 10-nov · dentro de una diapositiva escalada o tumbada (en el móvil, la
     * clase a pantalla completa va girada) la caja del lienzo no sirve: dos marcas en sus esquinas de arriba dicen hacia dónde va su
     * eje y cuánto mide en la pantalla. Sin ellas (o sin tamaño), como siempre.
     */
    function enLienzo(ev) {
      try {
        var a = e0.getBoundingClientRect(), b = e1.getBoundingClientRect(), w = lienzo.clientWidth, ux = (b.left - a.left) / w, uy = (b.top - a.top) / w, n = ux * ux + uy * uy;
        if (w && n > 1e-6) { var px = ev.clientX - a.left, py = ev.clientY - a.top; return [(px * ux + py * uy) / n, (py * ux - px * uy) / n]; }
      } catch (e) { /* como siempre */ }
      var r = lienzo.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top];
    }
    function nuevoGesto(ids, movido) {
      return { vb: vb.slice(), p: ids.map(function (k) { return dedos[k].slice(); }), movido: !!movido, g: null, muestras: [] };
    }
    function alBajar(ev) {
      if (ev.button > 0 || (ev.target.closest && ev.target.closest(".gpmm-pin,.gpmm-ctrl,.gpmm-pop"))) return;
      dedos[ev.pointerId] = enLienzo(ev);
      try { lienzo.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
      gesto = nuevoGesto(Object.keys(dedos), gesto && gesto.movido);
      if (forma === "globo") gArranca();
    }
    function alMover(ev) {
      if (!gesto || !dedos[ev.pointerId]) return;
      dedos[ev.pointerId] = enLienzo(ev);
      var m = medidas(), ids = Object.keys(dedos), v = gesto.vb, sx = v[2] / m.w, sy = v[3] / m.h;
      if (forma === "globo") return gMover(ids);
      if (ids.length >= 2 && gesto.p.length >= 2) {   // pellizco: la distancia entre los dedos, y el centro que se mueve
        var a = dedos[ids[0]], b = dedos[ids[1]], a0 = gesto.p[0], b0 = gesto.p[1];
        var d0 = Math.hypot(a0[0] - b0[0], a0[1] - b0[1]) || 1, d1 = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, f = d0 / d1;
        var c0 = [(a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2], c1 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        var ux = v[0] + c0[0] * sx, uy = v[1] + c0[1] * sy, w = v[2] * f, h = v[3] * f;
        verLibre([ux - c1[0] / m.w * w, uy - c1[1] / m.h * h, w, h]);
      } else {
        var p0 = gesto.p[0], p = dedos[ids[0]], dx = p[0] - p0[0], dy = p[1] - p0[1];
        if (!gesto.movido && Math.abs(dx) + Math.abs(dy) < 4) return;
        gesto.movido = true; lienzo.classList.add("gpmm-arrastra");
        verLibre([v[0] - dx * sx, v[1] - dy * sy, v[2], v[3]]);
      }
      gesto.movido = true; cerrar();
    }
    function alSoltar(ev) {
      if (!dedos[ev.pointerId]) return;
      delete dedos[ev.pointerId];
      try { lienzo.releasePointerCapture(ev.pointerId); } catch (e) { /* nada */ }
      var antes = gesto, movido = gesto && gesto.movido, ids = Object.keys(dedos);
      gesto = ids.length ? nuevoGesto(ids, movido) : null;
      if (!ids.length) {
        lienzo.classList.remove("gpmm-arrastra");
        if (forma === "globo") { G.quieto = ahora(); if (movido) gSuelta(antes); }
        else if (movido) avisarCambio();
      }
    }
    function alRueda(ev) {
      if (!ev.deltaY) return;
      ev.preventDefault();
      if (forma === "globo") {
        gToca(); G.base.s = G.ver.s = clamp(G.base.s * Math.pow(1.0018, -clamp(ev.deltaY, -240, 240)), 1, zMax);
        gLibre(); cerrar(); gFueraPista();
        if (Math.abs(Math.log(G.base.s / G.sAgr)) > 0.14) gPines(false);
        gArranca();
      } else { var q = enLienzo(ev); zoom(Math.pow(1.0018, clamp(ev.deltaY, -240, 240)), q[0], q[1]); }
      clearTimeout(reloj); reloj = setTimeout(function () { if (forma === "globo" && Math.abs(Math.log(G.base.s / G.sAgr)) > 0.02) gPines(false); avisarCambio(); }, 250);
    }
    function cerrar() { if (pop.hidden) return; pop.hidden = true; if (G) G.quieto = ahora(); if (pop._boton && pop._boton.focus && doc.contains(pop._boton)) pop._boton.focus(); }
    /** De una forma a la otra (el botón «Plano» / «Globo»), sin perder lo que se estaba mirando. */
    function cambiarForma(f) {
      if (f === "globo" && !G) return;
      if (modo === "libre") { if (f === "globo") libreG = aGlobo(libre || vb); else libre = aPlano(libreG || [G.base.lon, G.base.lat, G.base.s]); }
      ponerForma(f); maquetar(false);
    }

    var alClic = function (ev) {
      var t = ev.target, b;
      if (t.closest(".gpmm-x")) return cerrar();
      if ((b = t.closest("[data-gpmm-z]"))) {
        cerrar();
        if (forma === "globo") gZoom(Number(b.getAttribute("data-gpmm-z")) > 0 ? 1 / 0.6 : 0.6); else zoom(Number(b.getAttribute("data-gpmm-z")) > 0 ? 0.6 : 1 / 0.6);
        return avisarCambio();
      }
      if (gesto && gesto.movido) return;
      if ((b = t.closest("[data-gpmm-f]"))) { cerrar(); cambiarForma(forma === "globo" ? "plano" : "globo"); return avisarCambio(); }
      if ((b = t.closest("[data-gpmm]"))) { modo = b.getAttribute("data-gpmm"); libre = null; libreG = null; marcarBotones(); cerrar(); maquetar(false); return avisarCambio(); }
      if ((b = t.closest("[data-gpmm-b]"))) return abrir(Number(b.getAttribute("data-gpmm-b")), b);
      if (!t.closest(".gpmm-pop")) cerrar();
    };
    var alTecla = function (ev) { if (ev.key === "Escape") cerrar(); };
    el.addEventListener("click", alClic); doc.addEventListener("keydown", alTecla);
    if (mover) {
      lienzo.addEventListener("pointerdown", alBajar); lienzo.addEventListener("pointermove", alMover);
      lienzo.addEventListener("pointerup", alSoltar); lienzo.addEventListener("pointercancel", alSoltar);
      lienzo.addEventListener("wheel", alRueda, { passive: false });
    }
    var ro = W && W.ResizeObserver ? new W.ResizeObserver(function () { cerrar(); maquetar(false); }) : null;
    if (ro) ro.observe(lienzo); else if (W) W.addEventListener("resize", alTamano);
    function alTamano() { maquetar(false); }
    marcarBotones();
    ponerForma(formaBase); marcarForma();
    if (bForma && !G) bForma.hidden = true;
    function recuadro(v) { return Array.isArray(v) && v.length === 4 && v.every(function (n) { return isFinite(Number(n)); }) && Number(v[2]) > 0 && Number(v[3]) > 0; }

    var api = {
      /** Las personas que se ven. Quien no estaba en el `poner` anterior aparece con su animación (el primero, sin ella). */
      poner: function (lista) {
        var limpia = (lista || []).filter(function (p) { return p && p.id != null; });
        nuevos = {}; avisos = {};
        var primera = vistos === null;
        if (!primera) limpia.forEach(function (p) { if (!vistos[p.id] && valida(p)) { nuevos[p.id] = 1; if (o.avisar) avisos[p.id] = 1; } });
        else if (o.animarAlEmpezar) limpia.forEach(function (p) { nuevos[p.id] = 1; });
        vistos = {}; limpia.forEach(function (p) { vistos[p.id] = 1; });
        gente = limpia;
        o._escalonar = primera;
        if (G && !reducido() && Object.keys(nuevos).length) {   // en el globo, el sitio de quien llega da un destello (los del principio, uno detrás de otro)
          var t0 = ahora() + (primera ? 900 : 0);
          porCiudad(limpia).forEach(function (s, i) { if (s.gente.some(function (p) { return nuevos[p.id]; })) G.llegada[claveSitio(s)] = t0 + (primera ? Math.min(i, 20) * 90 : 0); });
        }
        pintarTierra(); pintarResumen(); maquetar(true);
        return api;
      },
      encuadrar: function (m) { modo = m === "mundo" ? "mundo" : "auto"; libre = null; libreG = null; marcarBotones(); maquetar(false); return api; },
      /**
       * 19-oct · sin nada: lo que se ve; con algo, lo pone sin avisar (lo que manda otra pantalla). En el mapa plano: 'auto', 'mundo' o
       * [x, y, ancho, alto]. 10-nov · con el globo: 'auto', 'mundo' o { g: [lon, lat, s] }; y, si quien manda lo ha puesto plano,
       * { f: 'plano', v: lo del mapa plano }. Un recuadro suelto (lo que manda un mapa sin globo) se ve en plano.
       */
      vista: function (v) {
        if (!arguments.length) {
          if (forma === "globo") return modo === "libre" && libreG ? { g: [r2(G.base.lon), r2(G.base.lat), Math.round(G.base.s * 1000) / 1000] } : modo;
          var pl = modo === "libre" && libre ? vb.slice() : modo;
          return formaBase === "globo" ? { f: "plano", v: pl } : pl;
        }
        var f = formaBase;
        if (v && typeof v === "object" && !Array.isArray(v)) {
          if (v.f === "plano") { f = "plano"; v = v.v; }
          else if (Array.isArray(v.g) && v.g.length === 3 && v.g.every(function (n) { return isFinite(Number(n)); }) && Number(v.g[2]) > 0) {
            if (G) { ponerForma("globo"); libreG = v.g.map(Number); libre = null; modo = "libre"; marcarBotones(); maquetar(false); return api; }
            v = aPlano(v.g.map(Number));
          } else v = "auto";
        } else if (Array.isArray(v)) f = "plano";
        ponerForma(f);
        if (recuadro(v)) { libre = v.map(Number); libreG = null; modo = "libre"; }
        else { modo = v === "mundo" ? "mundo" : "auto"; libre = null; libreG = null; }
        marcarBotones(); maquetar(false);
        return api;
      },
      destruir: function () {
        el.removeEventListener("click", alClic); doc.removeEventListener("keydown", alTecla); clearTimeout(reloj); muerto = true; clearTimeout(esperaTam);
        if (ro) ro.disconnect(); else if (W) W.removeEventListener("resize", alTamano);
        if (anim && W && W.cancelAnimationFrame) W.cancelAnimationFrame(anim);
        if (G && G.raf) { pulso.quitar(G.raf); G.raf = 0; }
        forma = "plano";
        el.innerHTML = ""; ["gpmm", "gpmm-llena", "gpmm-mueve", "gpmm-en-globo", "gpmm-brilla"].forEach(function (c) { el.classList.remove(c); });
      },
      /** (para las pruebas) lo que se ve y las burbujas pintadas */
      _estado: function () {
        return { vb: vb.slice(), modo: modo, forma: forma, globo: G && G.base ? { lon: G.base.lon, lat: G.base.lat, s: G.base.s, gira: G.base.gira } : null,
          burbujas: (pines._grupos || []).map(function (b) { return b.gente.map(function (p) { return p.id; }); }) };
      },
    };
    return api;
  }

  return { proyectar: proyectar, ANCHO: ANCHO, ALTO: ALTO, LAT_N: LAT_N, LAT_S: LAT_S, porCiudad: porCiudad, agrupar: agrupar, encuadre: encuadre,
    resumenPaises: resumenPaises, nombrePais: nombrePaisDe, crear: crear, CSS: CSS,
    desproyectar: desproyectar, vec: vec, girar: girar, encuadreGlobo: encuadreGlobo, anillosDe: anillosDe,
    pulso: pulso.pedir, quitarPulso: pulso.quitar };
});
