/**
 * GAMIFICAPRO · LA CLASE EN DIRECTO: QUIEN SIGUE VE LO MISMO QUE QUIEN EMITE (16-oct-2026) — pieza del motor para cualquier mod.
 *
 * María Sierra (STARGATE, 84 reclutas): «en directo no ven la misma diapositiva». Norberto: «Es VITAL que el estudiante vea lo mismo
 * que está viendo el docente aunque lo haya cambiado». Se arregló en STARGATE el 16-oct (sesion.js, rama directo-mismo-mazo) y aquí
 * queda para todos (docs/PLAN_CENTRALIZAR.md §6): DPG (clase.js) y STARGATE (sesion.js) la usan igual; cada web pone su piel y sus
 * textos («Tu Comandante», «Tu Mentor/a»).
 *
 * Lo puro (lo prueba tests/sdk/directo.test.ts):
 *   GP.directo.ocurrencia(ks, i)      → { k, n }: la diapositiva `i` de la lista de claves `ks` y qué vez es (una clave puede repetirse).
 *   GP.directo.indiceDe(ks, k, n)     → la posición de la vez `n` de `k` en `ks`, o -1.
 *   GP.directo.dondeVa(ks, s)         → { i, exacto }: ADÓNDE VA QUIEN SIGUE (y nunca se queda quieto sin decirlo). `ks`, sus claves;
 *                                        `s`, lo que manda quien emite: `k` y `n` (la diapositiva), `i` (su posición) y `ks` (la
 *                                        lista de quien emite; vale también dentro de `s.mazo`). Lo normal, la misma (`exacto`). Si
 *                                        no la tiene (un mazo viejo, una página guardada de antes): la última que tienen los dos,
 *                                        con `exacto: false` (la web lo dice y ofrece ponerse al día); sin lista, -1 (no se mueve,
 *                                        pero también lo dice).
 *   GP.directo.firma(x)               → una huella corta y estable de `x` (no depende del orden de los campos): para no repintar
 *                                        ni volver a emitir lo mismo.
 *   GP.directo.SUENA                  la expresión de lo incrustado que puede seguir sonando al salir de su diapositiva: YouTube,
 *                                        Vimeo y (16-oct, L10 del laboratorio de DPG1) Genially.
 *
 * Quien emite:
 *   GP.directo.emisor({ mandar, alCambiar, apuntar, respiro, reloj })
 *       `mandar(datos)` → promesa: la escritura de cada web (STARGATE: modClase sala `envivo`, parte `sesion`; DPG: parte `estado`).
 *       → { emitir(firma, datos), parar(), olvidar(), fallos(), destruir() }
 *     · emitir(firma, datos): `datos` es una función (se llama al mandar, con la hora de ese momento). Con `firma`, lo que ya se
 *       mandó con esa firma no se repite; con `firma` null, se manda siempre. Con `respiro` (ms), pasar tres diapositivas seguidas es
 *       UNA escritura; con 0, al momento.
 *     · si falla: `fallos()` sube y `alCambiar({ fallos })` (la web pinta «Sin señal · reintentando»), `apuntar(error)` (el registro
 *       de fallos de la web) y se vuelve a mandar lo último pedido, con un respiro que crece (2, 4, 6… hasta 10 s). Al llegar, fallos
 *       a 0 y `alCambiar` otra vez.
 *     · (sin latido: desde el 16-oct el cierre solo del motor espera 90 minutos sin señal del docente, una clase de 60 con el Genially en
 *       medio, y una pestaña olvidada en el proyector se sigue cerrando sola; functions/modClaseViva.js, MINUTOS_SIN_SENAL)
 *     · parar(): deja de emitir (ni respiro ni reintento; fallos a 0). La web manda su cierre si lo tiene.
 *     · olvidar(): la próxima emisión se manda aunque tenga la misma firma (al volver a encender el directo).
 *
 * Y lo que se incrusta en una diapositiva:
 *   GP.directo.dormir(caja)    los iframes de `caja` que pueden sonar (SUENA) se descargan (`about:blank`, la dirección en
 *                              `data-gp-src`); GP.directo.despertar(caja) los vuelve a poner al volver.
 *
 * 🔴 17-oct · LO QUE SE CUENTA EN LA DIAPOSITIVA, IGUAL EN TODAS LAS PANTALLAS (prueba de Norberto con el grupo X: el docente veía
 * «1 de 1 han fichado» y la estudiante «0 de 1»; quien fichó por la llamada solo lo sabía la pantalla del docente). Quien emite manda
 * también la sala tal como la ve él, y quien sigue cuenta con esa:
 *   GP.directo.sala(gente, sid, max)  → [{ id, a, v, fi, f }]: quién está en la sala de la sesión `sid` (alias, personaje, ficha y si
 *                                        ha fichado), como mucho `max` (120). `gente`: [{ id, alias, vecino, fichaId, fich, sala }].
 *   GP.directo.deLaSala(lista, id)    → la entrada de `id` en esa lista, o null.
 *
 * 17-oct · LOS TRABAJOS DEL ALUMNADO EN PANTALLA (Norberto: «primero las de quienes están conectados, con un punto verde junto al
 * alias, y los huecos se rellenan con las de quienes la hicieron pero no están»):
 *   GP.directo.trabajos(lista, { max }) → la misma lista, primero quien está (`vivo`), luego el resto (cada grupo en su orden), y
 *                                        como mucho `max`. Cada web la pinta con su piel; el punto verde, GP.directo.punto(vivo).
 *
 * 17-oct · LO QUE TE DA TU DOCENTE EN CLASE TE LLEGA (antes se repartía y el estudiante no se enteraba): el servidor (modRegalar)
 * deja un aviso con `modRegalo` en la bandeja (`notifications`); la web lo escucha y lo enseña una vez, con confeti, en la clase y en
 * su panel, también si no estaba conectado:
 *   GP.directo.textoPremio(aviso)     → «+10 leguas y +5 de oro» (de `aviso.modRegalo`), o "".
 *   GP.directo.premios({ vigilar, mostrar, leido }) → dejar de escuchar. `vigilar(cb)` escucha la bandeja (→ dejar de escuchar);
 *                                        `mostrar(aviso, texto)` lo enseña; `leido(id)` lo marca. Cada aviso, una sola vez.
 *
 * Cada web la copia en su build (assets/js/directo.js, con `guardas.copiar_pieza`) y NO se edita allí: aquí.
 */
(function (raiz, fabrica) {
  var D = fabrica();
  if (typeof module === "object" && module.exports) module.exports = D;
  if (raiz) { raiz.GP = raiz.GP || {}; if (!raiz.GP.directo) raiz.GP.directo = D; }
})(typeof window !== "undefined" ? window : null, function () {
  var SUENA = /^https?:\/\/([a-z0-9-]+\.)*(youtube(-nocookie)?\.com|youtu\.be|vimeo\.com|genially\.com)\//i;

  function ocurrencia(ks, i) {
    if (!Array.isArray(ks) || i == null || i < 0 || i >= ks.length) return null;
    var n = 0; for (var j = 0; j < i; j++) if (ks[j] === ks[i]) n++;
    return { k: ks[i], n: n };
  }
  function indiceDe(ks, k, n) {
    var c = -1;
    for (var i = 0; i < (ks || []).length; i++) { if (ks[i] === k) { c++; if (c === Number(n || 0)) return i; } }
    return -1;
  }
  function dondeVa(ks, s) {
    s = s || {};
    var i = indiceDe(ks, s.k, s.n); if (i >= 0) return { i: i, exacto: true };
    var suyas = Array.isArray(s.ks) ? s.ks : (s.mazo && Array.isArray(s.mazo.ks) ? s.mazo.ks : null), j = Number(s.i);
    if (suyas && j >= 0 && j < suyas.length) {
      for (var b = j - 1; b >= 0; b--) { var o = ocurrencia(suyas, b), x = indiceDe(ks, o.k, o.n); if (x >= 0) return { i: x, exacto: false }; }
      return { i: 0, exacto: false };
    }
    return { i: -1, exacto: false };
  }

  /** JSON con las claves ordenadas: la misma cosa da la misma firma, venga como venga. */
  function canonico(x) {
    if (Array.isArray(x)) return "[" + x.map(canonico).join(",") + "]";
    if (x && typeof x === "object") return "{" + Object.keys(x).sort().filter(function (k) { return x[k] !== undefined; })
      .map(function (k) { return JSON.stringify(k) + ":" + canonico(x[k]); }).join(",") + "}";
    return JSON.stringify(x === undefined ? null : x);
  }
  function firma(x) {
    var t = canonico(x), h1 = 5381, h2 = 52711;
    for (var i = 0; i < t.length; i++) { var ch = t.charCodeAt(i); h1 = (h1 * 33) ^ ch; h2 = (h2 * 33) ^ ch; }
    return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36) + t.length.toString(36);
  }

  function emisor(o) {
    o = o || {};
    var R = o.reloj || { poner: function (f, ms) { return setTimeout(f, ms); }, quitar: function (t) { clearTimeout(t); } };
    var respiro = o.respiro == null ? 350 : Math.max(0, Number(o.respiro) || 0);
    // 18-oct · `n`: el número de cada envío; `hecho`: el más nuevo que ya ha llegado (ver mandar)
    var E = { ultimo: null, pedida: null, t: null, reintento: null, fallos: 0, parado: true, n: 0, hecho: 0 };

    function avisar() { if (o.alCambiar) try { o.alCambiar({ fallos: E.fallos }); } catch (e) {} }
    /*
     * 🔴 18-oct · LOS ENVÍOS QUE LLEGAN DESORDENADOS (laboratorio previo al estreno de DPG1). Sin respiro, cada diapositiva sale al momento y
     * sin esperar a la anterior; si la primera tarda (la función del servidor, en frío) y el docente ya ha pasado a otra, la vieja llega
     * DESPUÉS y pisa a la nueva: la clase se quedaba en la diapositiva de antes hasta el siguiente cambio. Ahora cada envío lleva su número
     * y, si uno llega cuando ya había llegado otro más nuevo, se vuelve a mandar lo último pedido (sin esperar ni bloquear nada). Y si el
     * que falla es uno viejo ya superado, ni «Sin señal» ni reintento: lo nuevo ya está.
     */
    function mandar(p) {
      var hecha, n = ++E.n;
      try { hecha = Promise.resolve(o.mandar(p.datos())); } catch (e) { hecha = Promise.reject(e); }
      return hecha.then(function () {
        if (E.fallos) { E.fallos = 0; avisar(); }
        if (n < E.hecho && !E.parado && E.pedida) { mandar(E.pedida); return; }
        if (n > E.hecho) E.hecho = n;
      }, function (e) {
        if (o.apuntar) try { o.apuntar(e); } catch (x) {}
        if (E.parado || n < E.hecho) return;
        if (p.firma != null && E.ultimo === p.firma) E.ultimo = null;   // (el reintento la vuelve a mandar)
        E.fallos++; avisar();
        R.quitar(E.reintento);
        E.reintento = R.poner(function () { E.reintento = null; if (!E.parado && E.pedida) emitir(E.pedida.firma, E.pedida.datos); }, Math.min(2000 * E.fallos, 10000));
      });
    }
    function emitir(f, datos) {
      if (typeof datos !== "function") return;
      var p = { firma: f == null ? null : String(f), datos: datos };
      E.parado = false; E.pedida = p;
      // (volver a la que ya se mandó antes de que salga la otra: la otra ya no sale; en STARGATE, hasta el 16-oct, salía)
      if (p.firma != null && p.firma === E.ultimo) { R.quitar(E.t); E.t = null; return; }
      var ya = function () { E.t = null; if (E.parado) return; if (p.firma != null) E.ultimo = p.firma; mandar(p); };
      R.quitar(E.t); E.t = null;
      if (respiro) E.t = R.poner(ya, respiro); else ya();
    }
    function parar() {
      E.parado = true; R.quitar(E.t); R.quitar(E.reintento); E.t = E.reintento = null;
      if (E.fallos) { E.fallos = 0; avisar(); }
    }
    return {
      emitir: emitir,
      parar: parar,
      olvidar: function () { E.ultimo = null; },
      fallos: function () { return E.fallos; },
      destruir: function () { parar(); E.pedida = null; },
    };
  }

  function iframes(caja) { return caja && caja.querySelectorAll ? [].slice.call(caja.querySelectorAll("iframe")) : []; }
  function dormir(caja) {
    iframes(caja).forEach(function (f) { var u = f.getAttribute("src") || ""; if (SUENA.test(u)) { f.setAttribute("data-gp-src", u); f.setAttribute("src", "about:blank"); } });
  }
  function despertar(caja) {
    iframes(caja).forEach(function (f) { var u = f.getAttribute("data-gp-src"); if (u) { f.setAttribute("src", u); f.removeAttribute("data-gp-src"); } });
  }

  // ── la sala, tal como la ve quien emite
  function sala(gente, sid, max) {
    var tope = Math.max(1, Number(max) || 120), r = [];
    (Array.isArray(gente) ? gente : []).forEach(function (p) {
      if (!p || !p.id || !p.alias || r.length >= tope) return;
      var f = !!(p.fich && p.fich[sid]), dentro = f || !!(p.sala && p.sala[sid]);
      if (!dentro) return;
      var x = { id: String(p.id), a: String(p.alias).slice(0, 40), v: String(p.vecino || "").slice(0, 60), f: f ? 1 : 0 };
      if (p.fichaId) x.fi = String(p.fichaId).slice(0, 60);
      r.push(x);
    });
    return r;
  }
  function deLaSala(lista, id) {
    var L = Array.isArray(lista) ? lista : [];
    for (var i = 0; i < L.length; i++) if (L[i] && L[i].id === id) return L[i];
    return null;
  }

  // ── los trabajos del alumnado: primero quien está
  function trabajos(lista, o) {
    var L = Array.isArray(lista) ? lista.filter(Boolean) : [], max = o && Number(o.max) > 0 ? Number(o.max) : Infinity;
    return L.filter(function (x) { return !!x.vivo; }).concat(L.filter(function (x) { return !x.vivo; })).slice(0, max);
  }
  function punto(vivo) { return vivo ? '<i class="gp-vivo" title="Conectado ahora" aria-label="Conectado ahora"></i>' : ""; }

  // ── los premios de clase que te llegan
  function textoPremio(av) {
    var g = av && av.modRegalo; if (!g || typeof g !== "object") return "";
    var xp = Number(g.xp) || 0, m = Number(g.monedas) || 0;
    return [xp ? "+" + xp + " " + (g.nombreXp || "puntos") : "", m ? "+" + m + " " + (g.nombreMonedas || "monedas") : ""].filter(Boolean).join(" y ");
  }
  function premios(o) {
    o = o || {};
    var vistos = {};
    if (typeof o.vigilar !== "function") return function () {};
    var parar = o.vigilar(function (lista) {
      (Array.isArray(lista) ? lista : []).slice().sort(function (a, b) { return (a.createdAt || 0) - (b.createdAt || 0); }).forEach(function (av) {
        if (!av || !av.id || vistos[av.id] || av.read || !av.modRegalo) return;
        var t = textoPremio(av); if (!t) return;
        vistos[av.id] = true;
        try { if (o.mostrar) o.mostrar(av, t); } catch (e) {}
        try { if (o.leido) Promise.resolve(o.leido(av.id)).catch(function () {}); } catch (e) {}
      });
    });
    return typeof parar === "function" ? parar : function () {};
  }

  return { ocurrencia: ocurrencia, indiceDe: indiceDe, dondeVa: dondeVa, firma: firma, emisor: emisor, SUENA: SUENA, dormir: dormir, despertar: despertar,
           sala: sala, deLaSala: deLaSala, trabajos: trabajos, punto: punto, textoPremio: textoPremio, premios: premios };
});
