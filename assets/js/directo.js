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
 * 🔴 20-oct · EMPEZAR DE CERO TRAS UNA PRUEBA (Norberto: «lanzamos la sesión de prueba y se quedó guardado con mi usuario falso, mis
 * respuestas… Lo importante es poder vaciar el chat o resultados si el docente lo desea»; Fernando abrió la sesión al día siguiente con
 * la meta en «5 de 5» y el chat de la prueba). Nació como arreglo urgente en DPG (web-camino, 20-oct) y aquí queda para todos
 * (docs/PLAN_CENTRALIZAR.md §6). Vale para las salas de forma 'mapa' de modClase (las respuestas de cada persona en un mapa de claves:
 * hoy, DPG); las claves de una sesión son las MISMAS que borra la acción `borrarSesion` (functions/modClase.js → clavesDeSesion):
 * «fich:», «sala:» y «sorteo:» + sesión, «sesión:…» y «chat:sesión:…». Si cambia una, cambia la otra (lo vigila tests/sdk/directo.test.ts).
 *   GP.directo.restos(docs, sid, o)   → null si la sesión `sid` no tiene nada, o { alias: [quien], estudiantes, docente, chat, t, prueba }.
 *                                        `docs`: las fichas de la sala ({ fichaId, alias, t, r, dif }); `o.campo` (el mapa, "r") y
 *                                        `o.diferido` (el mapa de lo hecho a su ritmo, p. ej. "dif": también lo borra el servidor, así que
 *                                        también cuenta). `prueba`: como mucho `o.max` estudiantes (3) y nada en los últimos `o.minutos`
 *                                        (45): una clase de verdad nunca lo cumple, y recargar en mitad de la clase tampoco. Las fichas
 *                                        sin `fichaId` son del equipo docente; las de `inv:` (visitas) no cuentan como estudiantes.
 *   GP.directo.textoRestos(R, o)      → { titulo, texto, si, no }: la pregunta, con `o.textos` para poner la voz de cada web y `o.fecha(t)`.
 *   GP.directo.empezarDeCero(o)       → promesa de "nada" | "visto" | "ocupado" | "dejada" | "borrada". `docs`, `sid`, `ahora` y los de
 *                                        restos; `vistos` (un objeto de la web: una vez por sesión y visita); `ocupado()` (otra ventana
 *                                        abierta: espera, "ocupado", y la web lo reintenta); `preguntar(t)` → promesa de sí/no (la
 *                                        ventana de la web); `borrar(sid)` → promesa (modClase `borrarSesion`: no toca leguas ni
 *                                        llamada); `alBorrar()` (el «Borrando…»). Si borrar falla, la promesa falla: la web lo dice.
 *
 * 🔴 20-oct · ¿HAY CLASE EN DIRECTO AHORA? (la 1.ª clase de DPG1 se quedó sin directo: una prueba del 19-oct a las 11:53 la dio por
 * terminada —`modLlave` «dar»— y al día siguiente el aviso «En directo» no salió; los 27 estudiantes entraron por «Repasar a tu ritmo»,
 * sin seguir la diapositiva y sin fichar). Una sesión dada en tu columna es su diferido, SALVO que su docente la esté dando otra vez
 * después: si la señal de la clase (`estado.t`) es posterior a la hora en que se dio, vuelve a ser directo.
 *   GP.directo.enDirecto(sala, ahora, o) → { s, t } o null. `sala`: el documento de la sala (`estado` = { s, t }, lo firma quien emite);
 *                                        `o.llaves`: `mod_llaves/{grupo}` (GamificaPro modLlave); `o.columna`: la de la ficha ('' sin
 *                                        columnas: «_», como la apunta el servidor); `o.minutos`: sin señal en ese tiempo, la clase acabó
 *                                        (30, los de functions/modClaseViva.js).
 *
 * 🔴 20-oct · FICHAR VA POR LLAMADA, NO POR SESIÓN (DPG1, la clase partida de Fernando: a las 22:00 retomó la c1 con una llamada nueva
 * y a los 13 que habían fichado a las 16:00 no les salió fichar; la web miraba «fich:c1», la marca de la sesión). El servidor ya
 * cuenta una vez POR LLAMADA (modFichar: `attendance_records/{llamada}__{uid}`); la web guarda en la marca de la sesión la llamada en
 * la que fichó y vuelve a fichar cuando la abierta es otra (el mismo día o en otro). La cara en la sala sigue saliendo con la marca.
 *   GP.directo.porFichar(llamada, marca, ahora) → true si `llamada` ({ id, active?, hasta | endTime }) está abierta y `marca` (lo
 *                                        guardado en «fich:<sesión>») no es ella. Una marca vieja (1, true) o de otra llamada → true:
 *                                        si de verdad ya fichó en esta, el servidor contesta «repetido» y no cobra dos veces.
 *   GP.directo.marcaFichaje(llamada)   → lo que se guarda en la marca al fichar (el id de la llamada; sin llamada, 1).
 *
 * 🔴 21-oct · EL DIRECTO ES UN BOTÓN (Norberto, tras la clase partida de DPG1 del 20-oct: «la llave deja de mandar en el directo»).
 * Antes, «en directo» era una sesión con señal reciente y NO dada en tu columna (`mod_llaves`, «Terminar la clase»): una prueba la
 * daba y la clase de verdad salía «a su ritmo». Ahora el docente pulsa «Empezar el directo», elige cuánto dura (1 h o 2 h) y sus
 * columnas, y eso abre a la vez la llamada (`attendance_sessions`, con `endTime` = inicio + duración) y el directo: EL DIRECTO ES LA
 * LLAMADA. Se cierra sola al acabar el tiempo («Terminar ya» la cierra antes: GP_SDK.asistencia.cerrar). Se ficha UNA vez por
 * directo, sea cual sea la sesión (o el cambio de sesión). Sin piel ni textos de ningún mod (salvo cuánto queda).
 * 🔴🔴 26-oct · LA HORA DEL DIRECTO ES SOLO LA DE FICHAR (Norberto, tras la c3 de DPG1: a las 18:10 se acabó la hora y el alumnado salió
 * «a su ritmo» a cuatro diapositivas del final): «la hora del directo es el periodo por el que los estudiantes pueden fichar y OBTENER
 * la recompensa, una por día máximo. En ningún caso se cierra la sesión o se impide entrar a un estudiante». Con la llamada abierta,
 * como siempre; sin ella (acabada, «Terminar ya» o sin abrir), la clase SIGUE en directo mientras el docente la mueve: su señal de
 * los últimos `o.sigue` minutos (30). Lo que se responde ahí cuenta como directo; solo no se ficha. El tope de una al día lo pone el
 * servidor (`modFichar`, `llamada.unaVezAlDia` del mod).
 *   GP.directo.DURACIONES             [60, 120]: los minutos que se ofrecen (un mod puede dar los suyos en `o.duraciones`).
 *   GP.directo.nuevo(o)               → { minutos, columnas, extra } para GP_SDK.asistencia.abrir(grupo, { minutos, extra, … }), o null si
 *                                        la duración no es de las que valen. `o.columnas`: las elegidas; sin elegir, `o.mias` (las del
 *                                        docente); sin ninguna, todo el grupo (sin `modColumnas`). `extra` = { modDirecto, modColumnas }.
 *   GP.directo.vivo(l, ahora)          → ¿esta llamada está abierta? (activa, ya empezada y sin caducar; sin fin escrito, abierta).
 *   GP.directo.deColumna(l, columna)   → ¿es de esa columna? Sin `modColumnas` en la llamada, de todo el grupo; sin columna (''), cualquiera.
 *   GP.directo.directoDe(ls, col, ahora) → de las llamadas `ls`, la abierta de esa columna que acaba más tarde, o null.
 *   GP.directo.paraColumna(col)        → el filtro para GP_SDK.asistencia.vigilar(grupo, alCambiar, elegir): solo las de esa columna.
 *   GP.directo.cubre(l, columnas)      → ¿la llamada abierta `l` vale para TODAS esas columnas? (el aviso «No hay directo» del docente)
 *   GP.directo.queda(l, ahora)         → los ms que le quedan (0 si ya no está abierta; Infinity sin fin escrito).
 *   GP.directo.textoQueda(ms)          → «1 h 42 min», «25 min», «menos de 1 min».
 *   GP.directo.ficharEn(l, r, ahora)   → true si `l` está abierta y ninguna marca «fich:…» del mapa `r` (lo de la ficha en la sala) es ella:
 *                                        una vez por directo, entre en la sesión que entre. (porFichar, por sesión, sigue para quien la use.)
 *   GP.directo.enDirecto(sala, ahora, { directo }) → con `directo` (lo de directoDe; null: no hay), la llave ya no se mira:
 *                                        { s, t, llamada } si hay directo, o null. `s`: la sesión del `estado` de la sala si su señal es
 *                                        de este directo (o de los `o.antes` minutos de antes de abrirlo, 15); si no, null (el docente aún
 *                                        no ha pasado ninguna diapositiva: quien entra espera en la clase y la sigue en cuanto empiece).
 *                                        🔴 26-oct · sin llamada abierta (`directo` null o caducado), la clase sigue en directo si la
 *                                        señal del docente es de los últimos `o.sigue` min (30): { s, t, llamada: null }. Si no, null.
 *                                        Con `estado.cols` (las columnas que da su docente) y `o.columna`, solo si es una de ellas.
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

  // ── ¿hay clase en directo ahora? (20-oct; 21-oct: con `o.directo`, el directo es la llamada)
  function enDirecto(sala, ahora, o) {
    o = o || {};
    if (o.directo !== undefined) return enElDirecto(sala, o.directo, ahora, o);
    var e = sala && sala.estado, t = e && Number(e.t), min = o.minutos == null ? 30 : Number(o.minutos);
    if (!e || !e.s || !t || Number(ahora) - t > min * 60000) return null;
    var col = typeof o.columna === "string" && /^[a-z0-9_-]{1,40}$/.test(o.columna) ? o.columna : "_";
    var cols = o.llaves && o.llaves.columnas && typeof o.llaves.columnas === "object" ? o.llaves.columnas : {}, c = cols[col];
    var dada = c && c.sesiones && typeof c.sesiones === "object" ? c.sesiones[e.s] : null;
    // (dada con su hora: solo si la señal es de antes o de ese momento; sin hora —una marca vieja—, como siempre: dada)
    if (dada && !(typeof dada === "number" && dada > 0 && dada < t)) return null;
    return { s: String(e.s), t: t };
  }

  // ── fichar va por llamada (20-oct)
  function finLlamada(l) {
    var t = l.hasta || l.endTime, n = !t ? 0 : typeof t === "number" ? t : t.toMillis ? t.toMillis() : t.toDate ? t.toDate().getTime() : new Date(t).getTime();
    return isNaN(n) ? 0 : n;
  }
  function porFichar(l, marca, ahora) {
    if (!l || !l.id || l.active === false) return false;
    var fin = finLlamada(l);
    if (fin && Number(ahora) > fin) return false;
    return marca !== String(l.id);
  }
  function marcaFichaje(l) { return l && l.id ? String(l.id) : 1; }

  // ── 21-oct · el directo es un botón (y la llamada, a la vez)
  var DURACIONES = [60, 120];
  function columnasLimpias(cs) {
    var r = [];
    (Array.isArray(cs) ? cs : []).forEach(function (c) { c = String(c == null ? "" : c); if (/^[a-z0-9_-]{1,40}$/.test(c) && r.indexOf(c) < 0) r.push(c); });
    return r;
  }
  function nuevo(o) {
    o = o || {};
    var vale = Array.isArray(o.duraciones) && o.duraciones.length ? o.duraciones.map(Number) : DURACIONES, minutos = Number(o.minutos);
    if (!(minutos > 0) || vale.indexOf(minutos) < 0) return null;
    var cols = columnasLimpias(o.columnas);
    if (!cols.length) cols = columnasLimpias(o.mias);
    var extra = { modDirecto: true };
    if (cols.length) extra.modColumnas = cols;
    return { minutos: minutos, columnas: cols, extra: extra };
  }
  function vivo(l, ahora) {
    if (!l || !l.id || l.active === false) return false;
    var fin = finLlamada(l), ini = inicioLlamada(l);
    return (!fin || Number(ahora) < fin) && (!ini || Number(ahora) >= ini - 60000);   // (un minuto de holgura: el reloj de cada cual)
  }
  function deColumna(l, columna) {
    if (!l) return false;
    var cs = Array.isArray(l.modColumnas) ? l.modColumnas : [];
    return !cs.length || !columna || cs.indexOf(String(columna)) >= 0;
  }
  function paraColumna(columna) { return function (l) { return deColumna(l, columna); }; }
  function directoDe(ls, columna, ahora) {
    var r = null, rf = -1;
    (Array.isArray(ls) ? ls : []).forEach(function (l) {
      if (!vivo(l, ahora) || !deColumna(l, columna)) return;
      var f = finLlamada(l) || Infinity;
      if (f > rf) { r = l; rf = f; }
    });
    return r;
  }
  function cubre(l, columnas) {
    if (!l) return false;
    var cs = columnasLimpias(columnas);
    return !cs.length ? deColumna(l, "") : cs.every(function (c) { return deColumna(l, c); });
  }
  function queda(l, ahora) {
    if (!vivo(l, ahora)) return 0;
    var fin = finLlamada(l);
    return fin ? fin - Number(ahora) : Infinity;
  }
  function textoQueda(ms) {
    var m = Math.floor(Number(ms) / 60000);
    if (!(m >= 1)) return "menos de 1 min";
    if (!isFinite(m)) return "";
    var h = Math.floor(m / 60), r = m % 60;
    return h ? h + " h" + (r ? " " + r + " min" : "") : m + " min";
  }
  function inicioLlamada(l) {
    var t = l && (l.desde || l.startTime), n = !t ? 0 : typeof t === "number" ? t : t.toMillis ? t.toMillis() : t.toDate ? t.toDate().getTime() : new Date(t).getTime();
    return isNaN(n) ? 0 : n;
  }
  function ficharEn(l, r, ahora) {
    if (!vivo(l, ahora)) return false;
    var id = String(l.id), m = r && typeof r === "object" ? r : {};
    return !Object.keys(m).some(function (k) { return k.indexOf("fich:") === 0 && String(m[k]) === id; });
  }
  function enElDirecto(sala, l, ahora, o) {
    if (!vivo(l, ahora)) return sigueLaClase(sala, ahora, o);
    var e = sala && sala.estado, t = e && Number(e.t), ini = inicioLlamada(l), antes = (o.antes == null ? 15 : Number(o.antes)) * 60000;
    var suya = !!(e && e.s && t && (!ini || t >= ini - antes));
    return { s: suya ? String(e.s) : null, t: suya ? t : 0, llamada: String(l.id) };
  }

  /** 26-oct · sin hora de fichar, la clase sigue mientras el docente la mueve (su señal, de los últimos `o.sigue` min). */
  function sigueLaClase(sala, ahora, o) {
    var e = sala && sala.estado, t = e && Number(e.t), min = o.sigue == null ? 30 : Number(o.sigue);
    if (!(min > 0) || !e || !e.s || !t || Number(ahora) - t > min * 60000) return null;
    // (la sala es una por grupo: si la señal dice qué columnas da su docente —`cols`—, solo para ellas; `o.columna` '' o sin decir, todas)
    var cols = Array.isArray(e.cols) ? e.cols.map(String) : [], col = typeof o.columna === "string" ? o.columna : "";
    if (cols.length && col && cols.indexOf(col) < 0) return null;
    return { s: String(e.s), t: t, llamada: null };
  }

  // ── lo que queda de una prueba en una sesión (20-oct)
  function restos(docs, sid, o) {
    o = o || {};
    sid = String(sid || "");
    if (!sid) return null;
    var max = o.max == null ? 3 : Number(o.max), espera = (o.minutos == null ? 45 : Number(o.minutos)) * 60000, ahora = Number(o.ahora) || Date.now();
    var campos = [o.campo || "r"]; if (o.diferido) campos.push(o.diferido);
    var exactas = {}, R = { alias: [], estudiantes: 0, docente: false, chat: 0, t: 0 }, hay = false;
    exactas["fich:" + sid] = exactas["sala:" + sid] = exactas["sorteo:" + sid] = 1;
    (Array.isArray(docs) ? docs : []).forEach(function (x) {
      if (!x) return;
      var ks = [], chat = 0;
      campos.forEach(function (c) {
        var m = x[c]; if (!m || typeof m !== "object") return;
        Object.keys(m).forEach(function (k) {
          if (!(exactas[k] || k.indexOf(sid + ":") === 0 || k.indexOf("chat:" + sid + ":") === 0)) return;
          ks.push(k); if (k.indexOf("chat:") === 0) chat++;
        });
      });
      if (!ks.length) return;
      hay = true;
      R.chat += chat;
      R.t = Math.max(R.t, Number(x.t) || 0);
      var ficha = String(x.fichaId || "");
      if (!ficha) { R.docente = true; return; }
      if (!/^inv:/.test(ficha)) R.estudiantes++;
      var a = String(x.alias || "").trim(); if (a && R.alias.indexOf(a) < 0) R.alias.push(a);
    });
    if (!hay) return null;
    R.prueba = R.estudiantes <= max && (!R.t || ahora - R.t >= espera);
    return R;
  }
  function textoRestos(R, o) {
    o = o || {};
    var T = o.textos || {}, quien = R.alias.length ? R.alias.join(", ") : R.estudiantes ? R.estudiantes + (R.estudiantes === 1 ? " estudiante" : " estudiantes") : "";
    if (R.docente) quien = quien ? quien + " y tus pruebas como docente" : "tus pruebas como docente";
    var cuando = "";
    if (R.t) { try { cuando = typeof o.fecha === "function" ? o.fecha(R.t) : new Date(R.t).toLocaleString("es-ES", { weekday: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { cuando = ""; } }
    return {
      titulo: T.titulo || "Esta clase ya tiene respuestas",
      texto: "Quedan respuestas de " + quien + (cuando ? " (" + cuando + ")" : "") + (R.chat ? ", con " + R.chat + (R.chat === 1 ? " mensaje" : " mensajes") + " en el chat" : "") +
        (T.texto || ". Si fue una prueba, bórralas y la clase empieza de cero: la meta, el chat y la sala.\nLas leguas y la llamada no se tocan."),
      si: T.si || "Empezar de cero", no: T.no || "Dejarlas", peligro: true,
    };
  }
  function empezarDeCero(o) {
    o = o || {};
    var sid = String(o.sid || "");
    if (!sid || typeof o.preguntar !== "function" || typeof o.borrar !== "function") return Promise.resolve("nada");
    if (o.vistos && o.vistos[sid]) return Promise.resolve("visto");
    if (typeof o.ocupado === "function" && o.ocupado()) return Promise.resolve("ocupado");
    if (o.vistos) o.vistos[sid] = true;
    var R = restos(o.docs, sid, o); if (!R || !R.prueba) return Promise.resolve("nada");
    return Promise.resolve(o.preguntar(textoRestos(R, o))).then(function (ok) {
      if (!ok) return "dejada";
      if (typeof o.alBorrar === "function") { try { o.alBorrar(); } catch (e) {} }
      return Promise.resolve(o.borrar(sid)).then(function () { return "borrada"; });
    });
  }

  return { ocurrencia: ocurrencia, indiceDe: indiceDe, dondeVa: dondeVa, firma: firma, emisor: emisor, SUENA: SUENA, dormir: dormir, despertar: despertar,
           sala: sala, deLaSala: deLaSala, trabajos: trabajos, punto: punto, textoPremio: textoPremio, premios: premios,
           restos: restos, textoRestos: textoRestos, empezarDeCero: empezarDeCero, enDirecto: enDirecto, porFichar: porFichar, marcaFichaje: marcaFichaje,
           DURACIONES: DURACIONES, nuevo: nuevo, vivo: vivo, deColumna: deColumna, paraColumna: paraColumna, directoDe: directoDe, cubre: cubre,
           queda: queda, textoQueda: textoQueda, ficharEn: ficharEn };
});
