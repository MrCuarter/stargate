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
    var E = { ultimo: null, pedida: null, t: null, reintento: null, fallos: 0, parado: true };

    function avisar() { if (o.alCambiar) try { o.alCambiar({ fallos: E.fallos }); } catch (e) {} }
    function mandar(p) {
      var hecha;
      try { hecha = Promise.resolve(o.mandar(p.datos())); } catch (e) { hecha = Promise.reject(e); }
      return hecha.then(function () {
        if (E.fallos) { E.fallos = 0; avisar(); }
      }, function (e) {
        if (o.apuntar) try { o.apuntar(e); } catch (x) {}
        if (E.parado) return;
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

  return { ocurrencia: ocurrencia, indiceDe: indiceDe, dondeVa: dondeVa, firma: firma, emisor: emisor, SUENA: SUENA, dormir: dormir, despertar: despertar };
});
