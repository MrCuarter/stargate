/* GamificaPro · mod-sdk v1 — GENERADO por scripts/build-sdk.mjs (npm run build:sdk) desde sdk/semanas.js, sdk/llamar.js, sdk/papel.js, sdk/alistarse.js, sdk/premios.js, sdk/asistencia.js, sdk/votacion.js, sdk/retos.js, sdk/equipo.js, sdk/buzon.js, sdk/economia.js, sdk/efigie.js, sdk/mantenimiento.js, sdk/registro.js, sdk/sitio.js, sdk/conectar.js, sdk/grupos.js, sdk/llave.js, sdk/niveles.js.
 * No se edita a mano ni en las webs: se cambian las piezas en GamificaPro y se genera otro paquete (otra huella).
 * Sin claves, sin textos y sin colores de ningún mod. Deja window.GP_SDK (o module.exports en Node):
 *   GP_SDK.semanas                         la receta de las semanas (la de window.SGSEMANAS)
 *   GP_SDK.llamador(nombre => callable)    → llamar(nombre, datos), con los errores marcados por código
 *   GP_SDK.errores                         { codigo, delServidor, sinDesplegar, es, CODIGOS }
 *   GP_SDK.papel(llamar)                   → { miPapel(uid), olvidar() };  GP_SDK.papelDe(respuesta, mod) → { vitalicio, mando }
 *   GP_SDK.<pieza>.crear({ fs, llamar, sesion })   las piezas con ctx: alistarse, premios, asistencia, votacion, retos, equipo, buzon, economia, efigie, mantenimiento, registro, grupos
 *   GP_SDK.sitio(vieja, proyecto)          → { coleccion, nueva, id(), datos(), mod }: dónde van los datos de ese grupo
 *   GP_SDK.conectar({ mod, firebase, … })  → { EMU, app, auth, db, fns, google, entrar, entrarComo, salir }: Firebase, la entrada con Google
 *                                            y el candado del emulador (demo-<mod>); recibe las funciones de Firebase de la web
 */
(function (raiz) {
function pieza(cuerpo) { var module = { exports: {} }; cuerpo.call({}, module, module.exports); return module.exports; }
var semanas = pieza(function (module, exports) {
// ─── GP_SDK pieza «semanas» (sdk/semanas.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · LAS SEMANAS DEL CURSO, CON PAUSAS — la receta única del cliente (pieza del SDK v1, fase 5 de
 * docs/PLAN_CENTRALIZAR.md). Nació en STARGATE el 13-sep-2026 y DPG la copiaba letra a letra; desde el 7-oct vive aquí y las
 * webs la reciben en su build (no se edita allí: aquí).
 *
 * Norberto: «a veces hay cambios: en Navidad se retrasa una semana, o Semana Santa… Debe ser fácil para el referente
 * ajustar el calendario: una página dedicada con el calendario, con posibilidad de mover o congelar una semana».
 *
 * Una semana CONGELADA es una semana del calendario que no cuenta para el curso: mientras dura, el curso se queda en la
 * semana en la que estaba, y todo lo de detrás se corre una semana. Se guarda como la lista de días en que empiezan las
 * semanas congeladas (`pausas` del grupo), sobre la misma rejilla que la semana 1 (si el curso empieza un lunes, son lunes).
 *
 * 🔴 UNA SOLA RECETA. «¿En qué semana estamos?» se calculaba en seis sitios de una web con la misma cuenta copiada, y
 * después en dos webs. Ahora todas preguntan aquí. El servidor hace la misma cuenta en functions/semanas.js
 * (`semanaCruda`, `inicioDeSemana`): tests/sdk/semanas.test.ts compara las dos instante a instante.
 *
 * Y de paso: la cuenta vieja dividía milisegundos entre 7 días, y el lunes siguiente al cambio de hora de marzo salían
 * 7 días MENOS UNA HORA → la semana anterior durante todo ese lunes. Aquí se cuentan DÍAS (redondeando), así que el cambio
 * de hora no mueve nada. Cuenta en la hora del navegador (la del curso, Madrid, para casi todo el alumnado).
 *
 * Se usa igual en Node (pruebas, sembradores: module.exports), en el navegador suelta (window.SGSEMANAS) y dentro del
 * paquete del SDK (GP_SDK.semanas). Sin textos ni datos de ningún mod.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.SGSEMANAS = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var DIA = 864e5;

  function dos(n) { return (n < 10 ? "0" : "") + n; }
  /** Una fecha (Date, milisegundos o «AAAA-MM-DD») a las 00:00 de ese día, en hora local. */
  function fecha(x) {
    var d = x instanceof Date ? new Date(x.getTime())
          : typeof x === "number" ? new Date(x)
          : x ? new Date(String(x).slice(0, 10) + "T00:00:00") : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  // 🔴 Nada de toISOString: en Madrid pasaría la medianoche al día anterior (UTC va detrás).
  function iso(x) { var d = fecha(x); return d.getFullYear() + "-" + dos(d.getMonth() + 1) + "-" + dos(d.getDate()); }
  function masDias(dia, n) { var d = fecha(dia); d.setDate(d.getDate() + n); return iso(d); }
  /** Días enteros de `a` a `b` (redondeando: el cambio de hora no resta un día). */
  function dias(a, b) { return Math.round((fecha(b) - fecha(a)) / DIA); }

  /** Las pausas válidas: sobre la rejilla del curso, desde la semana 1, sin repetir y en orden. */
  function limpias(inicio, pausas) {
    if (!inicio || !Array.isArray(pausas)) return [];
    var vistas = {};
    return pausas.map(function (p) { return String(p || "").slice(0, 10); }).filter(function (p) {
      if (!/^\d{4}-\d\d-\d\d$/.test(p) || vistas[p]) return false;
      vistas[p] = true;
      var d = dias(inicio, p);
      return d >= 0 && d % 7 === 0;
    }).sort();
  }

  /**
   * La semana DEL CURSO en un día (hoy si no se dice). Las congeladas no cuentan: dentro de una
   * pausa sigue la semana anterior. Antes de empezar, 0 o menos (como siempre). Sin inicio, null.
   */
  function semanaDelCurso(inicio, pausas, cuando) {
    if (!inicio) return null;
    var d = dias(inicio, cuando == null ? new Date() : cuando);
    var cal = Math.floor(d / 7) + 1;
    if (d < 0) return cal;
    var hasta = iso(cuando == null ? new Date() : cuando);
    return cal - limpias(inicio, pausas).filter(function (p) { return p <= hasta; }).length;
  }

  /** Si ese día cae en una semana congelada, el día en que empieza la pausa; si no, "". */
  function pausaDe(inicio, pausas, cuando) {
    if (!inicio) return "";
    var d = dias(inicio, cuando == null ? new Date() : cuando);
    if (d < 0) return "";
    var ini = masDias(inicio, Math.floor(d / 7) * 7);
    return limpias(inicio, pausas).indexOf(ini) >= 0 ? ini : "";
  }

  /** El primer día de la semana N del curso, saltando las congeladas. */
  function inicioDeSemana(inicio, n, pausas) {
    n = Math.max(1, Math.floor(Number(n) || 1));
    var ps = limpias(inicio, pausas), cuenta = 0;
    for (var i = 0; i < 1000; i++) {
      var dia = masDias(inicio, i * 7);
      if (ps.indexOf(dia) >= 0) continue;
      if (++cuenta === n) return dia;
    }
    return masDias(inicio, (n - 1) * 7);
  }
  /** El último día (domingo si empieza en lunes) de la semana N del curso. */
  function finDeSemana(inicio, n, pausas) { return masDias(inicioDeSemana(inicio, n, pausas), 6); }

  /**
   * Las semanas del calendario, una a una, de la semana 1 al final del canje: las del curso (con su
   * número), las congeladas (sin número) y las de canje (después de la última, sin retos nuevos).
   */
  function calendario(inicio, pausas, total, extra) {
    var ps = limpias(inicio, pausas), out = [], n = 0, tope = total + (extra || 0);
    for (var i = 0; n < tope && i < 1000; i++) {
      var dia = masDias(inicio, i * 7), congelada = ps.indexOf(dia) >= 0;
      if (!congelada) n++;
      out.push({ inicio: dia, fin: masDias(dia, 6), semana: congelada ? null : n,
                 congelada: congelada, canje: !congelada && n > total });
    }
    return out;
  }

  /** El domingo de Pascua de un año (algoritmo anónimo gregoriano: Meeus/Jones/Butcher), «AAAA-MM-DD». */
  function pascua(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return y + "-" + dos(mes) + "-" + dos(dia);
  }
  /**
   * 15-sep · LAS SEMANAS FESTIVAS DE LA UNIR. Norberto: «son las dos de Navidad —la semana en que cae el 24 de
   * diciembre y la siguiente— y la semana en que caen el Jueves y el Viernes Santo… cuando crees un nuevo grupo
   * tendrás que saltarte esas semanas». Devuelve el día en que empieza cada una sobre la rejilla del curso (como
   * las pausas del referente), para las `total + extra` semanas que dura. Se repite hasta que no cambia: al
   * congelar, el curso se alarga y puede llegar a otro festivo (un curso de febrero alcanza la Semana Santa).
   */
  function festivosUNIR(inicio, total, extra) {
    if (!inicio) return [];
    var ps = [];
    var suSemana = function (dia) { var d = dias(inicio, dia); return d < 0 ? null : masDias(inicio, Math.floor(d / 7) * 7); };
    for (var vuelta = 0; vuelta < 8; vuelta++) {
      var cal = calendario(inicio, ps, total, extra || 0), desde = cal[0].inicio, hasta = cal[cal.length - 1].inicio, nuevas = [];
      for (var y = Number(desde.slice(0, 4)) - 1; y <= Number(hasta.slice(0, 4)); y++) {
        var p = pascua(y);
        // Navidad: la semana del 24 y la siguiente (la del 31); Semana Santa: la del jueves y la del viernes
        [y + "-12-24", y + "-12-31", masDias(p, -3), masDias(p, -2)].map(suSemana).forEach(function (sem) {
          if (sem && sem >= desde && sem <= hasta && ps.indexOf(sem) < 0 && nuevas.indexOf(sem) < 0) nuevas.push(sem);
        });
      }
      if (!nuevas.length) break;
      ps = ps.concat(nuevas).sort();
    }
    return ps;
  }

  return { fecha: fecha, iso: iso, masDias: masDias, dias: dias, limpias: limpias,
           semanaDelCurso: semanaDelCurso, pausaDe: pausaDe, inicioDeSemana: inicioDeSemana,
           finDeSemana: finDeSemana, calendario: calendario, pascua: pascua, festivosUNIR: festivosUNIR };
});
// ─── fin de la pieza «semanas» ───
});
var llamar = pieza(function (module, exports) {
// ─── GP_SDK pieza «llamar» (sdk/llamar.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · LLAMAR A LAS FUNCIONES DEL MOTOR, CON LOS ERRORES POR CÓDIGO (7-oct-2026) — pieza del SDK v1 (fase 5 de
 * docs/PLAN_CENTRALIZAR.md, §2d).
 *
 * Cada web llevaba su `llamar` (httpsCallable(fns, nombre)(datos).then(r => r.data)) y reconocía los errores a su manera,
 * mirando el texto: STARGATE daba una función por «sin desplegar» si el mensaje no llevaba tildes ni las palabras «recluta»
 * o «grupo» (`sinDesplegar`), y DPG si no decía «grupo no existe» (`ticketSinServidor`). Un «no» del servidor sin tildes
 * («No existe el reto») pasaba por función sin desplegar. Aquí se decide POR CÓDIGO:
 *
 *   · `codigo(e)`        el código sin el prefijo: «functions/not-found» → «not-found» (y «permission-denied» de Firestore,
 *                        que no lleva prefijo, sigue igual). Los de Firebase: unauthenticated, permission-denied, not-found,
 *                        failed-precondition, invalid-argument, already-exists, resource-exhausted, internal, unavailable…
 *   · `delServidor(e)`   el error lo escribió NUESTRA función (un HttpsError con su texto). Cuando la llamada no llega a la
 *                        función (no está desplegada: 404; sin red o sin CORS: «internal»), el cliente de Firebase pone de
 *                        mensaje el propio código («not-found», «internal»); si la función revienta sin HttpsError, el
 *                        servidor manda «INTERNAL». Ninguno de esos es un texto del servidor.
 *   · `sinDesplegar(e)`  la función no ha contestado con un texto suyo y el código es not-found, unimplemented o internal:
 *                        no está desplegada todavía, no hay red, o se ha caído sin decir nada. (Lo que STARGATE llamaba así.)
 *   · `es(e, código)`    atajo: ¿es este código?
 *
 * `llamador(hacer)` devuelve `llamar(nombre, datos)`. `hacer(nombre)` es lo que da la web: `(n) => httpsCallable(fns, n)`
 * (de verdad, del emulador o del simulador). El SDK no importa Firebase ni lleva claves: el repo de STARGATE es público.
 * Si falla, se lanza EL MISMO error de Firebase (mismo `code`, mismo `message`: lo que ya miran las webs sigue igual) con
 * estas marcas añadidas: `codigo`, `delServidor`, `sinDesplegar` y `funcion` (el nombre llamado).
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPLLAMAR = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  /** Los códigos de error de Firebase Functions (los de google.rpc.Code, en minúsculas y con guiones). */
  var CODIGOS = ["cancelled", "unknown", "invalid-argument", "deadline-exceeded", "not-found", "already-exists",
    "permission-denied", "unauthenticated", "resource-exhausted", "failed-precondition", "aborted", "out-of-range",
    "unimplemented", "internal", "unavailable", "data-loss"];
  var SIN_CONTESTAR = ["not-found", "unimplemented", "internal"];

  /** «functions/not-found» → «not-found». Sin código, "". */
  function codigo(e) { return String((e && e.code) || "").replace(/^[a-z-]+\//, ""); }
  /** ¿Es un error de una llamada a función (y no de Firestore, Auth…)? */
  function deFunciones(e) { return /^functions\//.test(String((e && e.code) || "")); }
  /** El nombre del estado en el servidor: «not-found» → «NOT_FOUND». */
  function estado(c) { return String(c).toUpperCase().replace(/-/g, "_"); }
  /** ¿El texto del error lo escribió la función (un HttpsError con su mensaje)? */
  function delServidor(e) {
    if (!deFunciones(e)) return false;
    var m = String((e && e.message) || ""), c = codigo(e);
    return m !== "" && m !== c && m !== estado(c);
  }
  /** ¿La función no ha llegado a contestar (sin desplegar, sin red) o se ha caído sin decir nada? */
  function sinDesplegar(e) {
    return deFunciones(e) && SIN_CONTESTAR.indexOf(codigo(e)) >= 0 && !delServidor(e);
  }
  function es(e, c) { return codigo(e) === String(c || ""); }

  /** El error, con sus marcas (el mismo objeto: quien mire `code` o `message` ve lo de siempre). */
  function marcar(e, nombre) {
    var x = e && typeof e === "object" ? e : new Error(String(e));
    try {
      x.codigo = codigo(x);
      x.delServidor = delServidor(x);
      x.sinDesplegar = sinDesplegar(x);
      x.funcion = String(nombre || "");
    } catch (_) { /* un error congelado: se lanza tal cual */ }
    return x;
  }

  /** `llamar(nombre, datos)` → lo que devuelve la función (`data`), o el error marcado. */
  function llamador(hacer) {
    if (typeof hacer !== "function") throw new Error("GP_SDK.llamador: falta la función que llama (nombre → callable)");
    return function llamar(nombre, datos) {
      var p;
      try { p = Promise.resolve(hacer(nombre)(datos)); }
      catch (e) { return Promise.reject(marcar(e, nombre)); }
      return p.then(function (r) { return r && r.data; }, function (e) { throw marcar(e, nombre); });
    };
  }

  return { CODIGOS: CODIGOS, codigo: codigo, delServidor: delServidor, sinDesplegar: sinDesplegar, es: es,
           marcar: marcar, llamador: llamador };
});
// ─── fin de la pieza «llamar» ───
});
var papel = pieza(function (module, exports) {
// ─── GP_SDK pieza «papel» (sdk/papel.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · ¿QUÉ PAPEL TENGO? (7-oct-2026) — pieza del SDK v1 (fase 5 de docs/PLAN_CENTRALIZAR.md, §2d).
 *
 * Las webs de los mods son públicas: no pueden llevar los correos de quien manda. Hasta ahora llevaban listas a mano (DPG,
 * las huellas FNV de los correos, `VITALICIOS_HUELLAS`; STARGATE, las suyas). Desde la fase 2 las personas de cada mod
 * viven en el servidor (functions/personasBase.js unidas a `config_mods/{mod}/privado/personas`, que Norberto edita en la
 * pestaña «Personas» de la app), y la callable `miPapel` (functions/modPersonas.js) dice qué papel tiene quien ha entrado:
 *
 *   miPapel({}) → { ok, mods: { stargate: { vitalicio, mando }, ceniza: { vitalicio, mando } } }
 *
 * Aquí:
 *   · `crearPapel(llamar)` → { miPapel(uid), olvidar() }. `miPapel(uid)` pregunta UNA vez por cuenta (se guarda la promesa;
 *     si falla, se olvida para poder reintentar) y devuelve { mods } limpio (todo booleano). `olvidar()` al salir o cambiar
 *     de cuenta. `llamar` es el de sdk/llamar.js: si falla, el error llega marcado (p. ej. `sinDesplegar`).
 *   · `papelDe(respuesta, mod)` → { vitalicio, mando } de ese mod (false si no viene).
 *
 * Lo que se puede hacer lo siguen decidiendo el servidor y las reglas: esto solo sirve para ENSEÑAR el papel.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPPAPEL = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  function papelDe(respuesta, mod) {
    var x = respuesta && respuesta.mods && respuesta.mods[mod];
    return { vitalicio: !!(x && x.vitalicio === true), mando: !!(x && x.mando === true) };
  }
  /** La respuesta del servidor, limpia: solo { mods: { mod: { vitalicio, mando } } }. */
  function limpiar(r) {
    var mods = {}, m = (r && r.mods) || {};
    Object.keys(m).forEach(function (k) { mods[k] = papelDe({ mods: m }, k); });
    return { mods: mods };
  }
  function crearPapel(llamar) {
    if (typeof llamar !== "function") throw new Error("GP_SDK.papel: falta `llamar` (GP_SDK.llamador)");
    var memo = {};
    return {
      miPapel: function (uid) {
        var k = "u:" + String(uid || "");
        if (!memo[k]) {
          memo[k] = llamar("miPapel", {}).then(limpiar, function (e) { delete memo[k]; throw e; });
        }
        return memo[k];
      },
      olvidar: function () { memo = {}; },
    };
  }
  return { crearPapel: crearPapel, papelDe: papelDe, limpiar: limpiar };
});
// ─── fin de la pieza «papel» ───
});
var alistarse = pieza(function (module, exports) {
// ─── GP_SDK pieza «alistarse» (sdk/alistarse.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · ALISTARSE Y EL ALIAS (7-oct-2026) — pieza del SDK v1 (fase 5 de docs/PLAN_CENTRALIZAR.md, paso 4).
 *
 * Las dos webs abrían la ficha del alumnado igual, cada una con su copia: la reserva del alias y la ficha en la MISMA escritura
 * (las reglas no dejan una sin la otra), la ficha a cero (las reglas lo exigen: `naceEnCero`; lo que se gana al alistarse lo paga
 * el servidor completando la misión del alta), el nombre y el correo aparte (`privado/datos`, que solo leen su dueño y su equipo
 * docente) y la misión del alta por `completeMission`. Aquí, una vez y sin piel:
 *
 *   · `clave(alias)`   LA CLAVE DE LA RESERVA, letra por letra la de las reglas (`aliasClave` en firestore.rules): `lower()` de
 *                      las reglas solo baja la A-Z, así que aquí también; las tildes se quitan en mayúscula y en minúscula. Si no
 *                      coincidiera, el servidor rechazaría la reserva (le pasó a «Olga Órbita» el 13-sep en STARGATE).
 *   · `plano(alias)`   para comparar alias a ojo: sin mayúsculas, sin tildes y sin espacios de más («Haló» = «halo»).
 *   · `COLECCION`      dónde viven las reservas: `stargate_alias/{grupo}__{clave}` (la de siempre, para los dos mods, hasta que
 *                      la migración en caliente la pase a `mod_alias`). 7-oct · un grupo de la versión definitiva (§1d del plan)
 *                      las tiene en `mod_alias`, con su `mod`: lo decide `ctx.sitio` (abajo).
 *   · `fichaNueva(uid, grupo, alias, extra)`  la ficha a cero de GamificaPro + los campos del mod (`extra`: la piel).
 *   · `crear(ctx)` → { ref, ocupado, reservar, alistar, cambiarAlias }, con `ctx = { fs, llamar, sesion }`:
 *       - `fs`      las funciones de Firestore de la web (las de verdad, las del emulador o las del simulador): db, doc, getDoc,
 *                   getDocs, setDoc, updateDoc, collection, query, where, writeBatch;
 *       - `llamar`  el de GP_SDK.llamador;
 *       - `sesion`  () → promesa de { uid, correo, nombre, anonimo } o null (la sesión de la web);
 *       - `sitio`   (opcional, 7-oct) (vieja, grupo) → el `GP_SDK.sitio(vieja, datos del grupo)` de ese grupo (o una promesa de
 *                   él): dónde va la reserva de ESE grupo. Sin él, la colección de siempre, exactamente como antes.
 *
 * 10-oct (noche) · «TODO ES TODO» (firestore.rules): el grupo entero (`projects/{id}`, con los correos del equipo docente y el
 * código) ya solo lo lee su equipo docente, el Mando y los vitalicios de su mod y el dueño. Para todo lo demás:
 *   · `leerGrupo(id)`  → promesa de algo como un `getDoc`: { id, exists(), data(), tarjeta }. El grupo entero si las reglas lo
 *                       dejan; si dicen que no, su TARJETA (`mod_grupos/{id}`: lo mismo sin correos ni código, la escribe el
 *                       servidor), con `tarjeta: true`. Lo que pinta el alumnado y quien se va a alistar sale de aquí.
 *   · `porCodigo(c)`   → promesa del id del grupo de ese código (o null): `mod_codigos/{CÓDIGO}`, solo por el código exacto.
 *   · `codigoEs(id, c)`→ promesa de true/false: ¿es ese el código de ese grupo? (sin leer el código del grupo).
 *   · la reserva de un alias de OTRA persona ya no se deja leer a quien no es del grupo: un «no» de las reglas al mirarla es
 *     «ocupado» (antes se leía y se veía de quién era).
 *
 * Los textos de los errores son de la web (cada mod habla con su voz): van en `textos`, con unos por defecto neutros. Lo que se
 * puede hacer lo deciden las reglas; esto solo lo prepara bien y lo cuenta con palabras.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPALISTARSE = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var COLECCION = "stargate_alias";
  // 10-oct · quién es de cada grupo (functions/modMiembros.js): `mod_miembros/{grupo}__{uid}`
  var MIEMBROS = "mod_miembros";
  // 10-oct (noche) · la tarjeta del grupo y a qué grupo lleva cada código (functions/modGrupoPublico.js)
  var GRUPOS = "mod_grupos", CODIGOS = "mod_codigos";
  /** El código como se busca: sin espacios, en mayúsculas ('' si no vale: corto o con «/»). Lo mismo que el servidor. */
  function normalizarCodigo(c) {
    var x = String(c == null ? "" : c).trim().toUpperCase();
    return (x.length < 4 || x.length > 40 || x.indexOf("/") >= 0 || x === "." || x === ".." || x.indexOf("__") === 0) ? "" : x;
  }

  function plano(t) {
    return String(t || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
  }
  function clave(a) {
    return String(a || "").replace(/[A-Z]+/g, function (m) { return m.toLowerCase(); }).trim()
      .replace(/[áàäâãÁÀÄÂÃ]/g, "a").replace(/[éèëêÉÈËÊ]/g, "e").replace(/[íìïîÍÌÏÎ]/g, "i")
      .replace(/[óòöôõÓÒÖÔÕ]/g, "o").replace(/[úùüûÚÙÜÛ]/g, "u").replace(/[ñÑ]/g, "n").replace(/[çÇ]/g, "c")
      .replace(/\//g, "-").replace(/ +/g, " ");
  }
  /** La ficha a cero de GamificaPro (lo que exigen las reglas al crearla) y, encima, lo del mod. */
  function fichaNueva(uid, grupo, alias, extra) {
    return Object.assign({
      userId: uid, projectId: grupo, displayName: alias, totalPoints: 0, coins: 0, inventory: [], earnedBadges: [],
      completedMissionIds: [], completedCampaignIds: [], currentPhase: 1, role: "student", createdAt: Date.now(),
    }, extra || {});
  }
  /**
   * 16-oct · LOS CAMPOS DEL MOD Y EL CÓDIGO DE CLASE: con un código que vale, `modCodigo` (normalizado, como lo comparan las reglas:
   * sin espacios y en mayúsculas); sin él, o si no vale, los campos tal cual.
   */
  function conCodigo(extra, codigo) {
    var k = normalizarCodigo(codigo);
    return k ? Object.assign({}, extra || {}, { modCodigo: k }) : extra;
  }
  /** ¿Es un «no» de las reglas? (el código de Firestore, o su texto en inglés en clientes viejos) */
  function denegado(e) { return /permission|insufficient/i.test(String(e && (e.code || e.message))); }

  var TEXTOS = {
    sinSesion: "Entra con tu cuenta antes de alistarte.",
    sinGrupo: "Ese grupo no existe.",
    yaEsta: "Ya estás alistado en este grupo.",
    ocupado: function (alias) { return "«" + alias + "» ya lo lleva alguien de tu grupo. Elige otro alias."; },
    sinFicha: "Esa ficha ya no está.",
  };
  function texto(t, k, x) { var v = (t && t[k] != null) ? t[k] : TEXTOS[k]; return typeof v === "function" ? v(x) : String(v); }

  function requiere(ctx, nombres) {
    var fs = ctx && ctx.fs;
    if (!fs) throw new Error("GP_SDK.alistarse: falta ctx.fs (las funciones de Firestore de la web)");
    nombres.forEach(function (n) { if (!fs[n]) throw new Error("GP_SDK.alistarse: falta ctx.fs." + n); });
    return fs;
  }

  function crear(ctx) {
    var fs = requiere(ctx, ["db", "doc", "getDoc", "getDocs", "setDoc", "updateDoc", "collection", "query", "where", "writeBatch"]);
    var db = fs.db;
    var sesion = ctx.sesion || function () { return Promise.resolve(null); };

    function ref(grupo, alias) { return fs.doc(db, COLECCION, grupo + "__" + clave(alias)); }

    // 10-oct (noche) · los grupos que las reglas no me dejan leer enteros (no soy de su equipo): ya no se pregunta otra vez
    var soloTarjeta = {};
    /** El grupo entero o, si las reglas dicen que no, su tarjeta (sin correos ni código). Ver arriba. */
    function leerGrupo(id) {
      id = String(id);
      var tarjeta = function () {
        return fs.getDoc(fs.doc(db, GRUPOS, id)).then(function (t) {
          var d = t.exists() ? Object.assign({}, t.data()) : null;
          if (d) delete d.modGrupo;
          return { id: id, ref: t.ref, tarjeta: true, exists: function () { return !!d; }, data: function () { return d ? Object.assign({}, d) : undefined; } };
        });
      };
      if (soloTarjeta[id]) return tarjeta();
      return fs.getDoc(fs.doc(db, "projects", id)).then(function (p) { return p; }, function (e) {
        if (!denegado(e)) throw e;
        soloTarjeta[id] = true;
        return tarjeta();
      });
    }
    /** El id del grupo de un código (o null), sin poder recorrerlos: solo el código exacto. */
    function porCodigo(c) {
      var k = normalizarCodigo(c);
      if (!k) return Promise.resolve(null);
      return fs.getDoc(fs.doc(db, CODIGOS, k)).then(function (r) {
        return r.exists() && r.data().projectId ? String(r.data().projectId) : null;
      });
    }
    /** ¿Es `c` el código del grupo `id`? */
    function codigoEs(id, c) {
      return porCodigo(c).then(function (g) { return !!g && g === String(id); });
    }
    /**
     * 7-oct · LA RESERVA DE ESTE GRUPO (§1d de docs/PLAN_CENTRALIZAR.md): → promesa de { ref, datos(d) }. Con `ctx.sitio`, donde
     * diga `sitio` para el grupo (en `mod_alias`, con su `mod`, si es de la definitiva); sin él, `ref` y los datos tal cual.
     */
    function reserva(grupo, alias) {
      if (!ctx.sitio) return Promise.resolve({ ref: ref(grupo, alias), datos: function (d) { return d; }, antes: null });
      return Promise.resolve(ctx.sitio(COLECCION, grupo)).then(function (s) {
        // 8-oct · `antes`: la de la vieja, si lo de antes de pasar sigue allí (pasada para su mod, hasta contraer)
        return { ref: fs.doc(db, s.coleccion, s.id(grupo + "__" + clave(alias))), datos: s.datos,
          antes: s.antes ? fs.doc(db, s.antes, grupo + "__" + clave(alias)) : null };
      });
    }

    /**
     * ¿Lo lleva otra persona del grupo? → el alias con el que lo lleva (para decirlo), o null.
     * `excepto`: { uid } (quien se alista o su dueño: sus cosas no cuentan) y/o { ficha } (la ficha que se corrige). Mira la
     * reserva y las fichas del grupo: un alias de antes del registro de alias no tiene reserva. Sin `uid`, cualquier reserva
     * cuenta (como el `aliasOcupado` de DPG), salvo al corregir una ficha (`{ ficha }` solo): esa reserva es de su dueño, y
     * quien corrige lo sabe por la ficha.
     */
    function ocupado(grupo, alias, excepto) {
      var e = excepto || {};
      var suya = (e.uid || !e.ficha)
        ? reserva(grupo, alias).then(function (x) { return fs.getDoc(x.ref); })
          .then(function (r) { return r && r.exists() && r.data().uid !== e.uid ? String(r.data().alias || alias) : null; },
            // 10-oct (noche) · la reserva de otra persona ya no se deja leer a quien no es del grupo: ese «no» es «ocupado»
            function (err) { return denegado(err) ? String(alias) : null; })
        : Promise.resolve(null);
      return suya.then(function (deOtro) {
        if (deOtro) return deOtro;
        return fs.getDocs(fs.query(fs.collection(db, "student_profiles"), fs.where("projectId", "==", grupo))).then(function (r) {
          var otro = r.docs.filter(function (d) {
            return d.id !== e.ficha && (!e.uid || d.data().userId !== e.uid) && plano(d.data().displayName) === plano(alias);
          })[0];
          return otro ? String(otro.data().displayName || alias) : null;
        }, function (err) {
          // 10-oct · las fichas de un grupo solo las lee su gente (firestore.rules → «LEER, SOLO EL GRUPO»): quien aún no se ha
          // alistado no las ve. No pasa nada: la reserva (arriba, y la de la escritura) es la que manda desde el 13-sep
          if (denegado(err)) return null;
          throw err;
        });
      });
    }

    /** Reserva el alias para `uid` DENTRO del lote que escribe la ficha. Si ya es suyo, nada; si es de otro, para con palabras. */
    function reservar(lote, grupo, uid, alias, textos) {
      return reserva(grupo, alias).then(function (x) {
        return fs.getDoc(x.ref).catch(function (e) {
          // 10-oct (noche) · la de otra persona no se deja leer a quien no es del grupo: ocupada
          if (denegado(e)) throw new Error(texto(textos, "ocupado", alias));
          return null;
        }).then(function (r) {
          if (r && r.exists()) {
            if (r.data().uid === uid) return false;
            throw new Error(texto(textos, "ocupado", alias));
          }
          lote.set(x.ref, x.datos({ projectId: grupo, uid: uid, alias: String(alias), creado: Date.now() }));
          return true;
        });
      });
    }

    /**
     * ALISTARSE en un grupo. o = {
     *   alias,                       el que elige (las webs miden antes su largo y su forma: es piel)
     *   ficha: {…},                  los campos del mod en la ficha (avatar, Comandante, escuadrón, `fantasma`…)
     *   privado: {…} | (yo) → {…},   lo que va a `privado/datos` (nombre, apellidos, correo…); sin esto, no se escribe
     *   privadoObligatorio: false,   true: si `privado/datos` falla, se lanza (si no, se avisa y la ficha sigue)
     *   misionAlta: "alta" | null,   el `stargateId` de la misión que se completa al alistarse (la paga el servidor)
     *   esDelMod: (proyecto) → bool, si el grupo no es del mod, `textos.sinGrupo`
     *   unaVez: true,                si ya tiene ficha en el grupo, `textos.yaEsta` (STARGATE lo comprueba en la pantalla)
     *   codigo: "ABC123",            16-oct · el código de clase con el que llega (el del enlace o el tecleado): la ficha nace con
     *                                `modCodigo` (normalizado). En los grupos con la pieza `codigoAlta` (DPG) las reglas lo exigen
     *                                (firestore.rules → codigoAlNacer); en los demás no se mira. Sin él, como antes
     *   textos: {…}, traducir: (e) → Error  (cómo se dice un error de la escritura que no es el alias),
     *   alAvanzar: (paso) → void     «grupo», «ficha», «privado», «alta»
     * } → { ficha: id, proyecto, avisos: [] }
     */
    function alistar(grupo, o) {
      o = o || {};
      var T = o.textos, alias = String(o.alias || "").trim(), avisos = [];
      var avisa = function (paso) { if (o.alAvanzar) o.alAvanzar(paso); };
      var yo, proyecto, fichaRef;
      return Promise.resolve(sesion()).then(function (s) {
        yo = s;
        if (!yo || !yo.uid) throw new Error(texto(T, "sinSesion"));
        avisa("grupo");
        // 10-oct (noche) · quien se alista aún no es del grupo: lee su tarjeta (su equipo docente, el grupo entero)
        return leerGrupo(grupo);
      }).then(function (p) {
        if (!p.exists()) throw new Error(texto(T, "sinGrupo"));
        proyecto = Object.assign({ id: p.id }, p.data());
        if (o.esDelMod && !o.esDelMod(proyecto)) throw new Error(texto(T, "sinGrupo"));
        if (o.unaVez === false) return null;
        return fs.getDocs(fs.query(fs.collection(db, "student_profiles"), fs.where("projectId", "==", grupo), fs.where("userId", "==", yo.uid)));
      }).then(function (ya) {
        if (ya && !ya.empty) throw new Error(texto(T, "yaEsta"));
        return ocupado(grupo, alias, { uid: yo.uid });
      }).then(function (otro) {
        if (otro) throw new Error(texto(T, "ocupado", alias));
        avisa("ficha");
        fichaRef = fs.doc(fs.collection(db, "student_profiles"));
        var lote = fs.writeBatch(db);
        var traducir = function (e) { return o.traducir ? o.traducir(e) : e; };
        return reservar(lote, grupo, yo.uid, alias, T).then(function () {
          lote.set(fichaRef, fichaNueva(yo.uid, grupo, alias, conCodigo(o.ficha, o.codigo)));
          // 10-oct · y que es de este grupo, en la misma escritura (functions/modMiembros.js): las reglas dejan leer lo del grupo
          // solo a su gente, y así lo lee desde la primera pantalla (sin esperar al disparador del servidor)
          lote.set(fs.doc(db, MIEMBROS, grupo + "__" + yo.uid), { projectId: grupo, uid: yo.uid, fichas: [fichaRef.id], creado: Date.now() });
          return lote.commit().catch(function (e) {
            if (!denegado(e)) throw traducir(e);
            // dos personas pulsando a la vez con el mismo alias: el servidor deja pasar a una sola
            return ocupado(grupo, alias, { uid: yo.uid }).then(function (otro) {
              if (otro) throw new Error(texto(T, "ocupado", alias));
              throw traducir(e);
            });
          });
        });
      }).then(function () {
        var privado = typeof o.privado === "function" ? o.privado(yo) : o.privado;
        if (!privado) return null;
        avisa("privado");
        return fs.setDoc(fs.doc(db, "student_profiles", fichaRef.id, "privado", "datos"), privado).catch(function (e) {
          if (o.privadoObligatorio) throw e;
          avisos.push("privado");
          if (typeof console !== "undefined") console.warn("[GP_SDK] los datos personales no han entrado:", e && e.message);
        });
      }).then(function () {
        if (!o.misionAlta || !ctx.llamar) return null;
        avisa("alta");
        // que falle la misión del alta no deja a nadie fuera: la ficha ya existe y su docente puede otorgársela a mano
        return fs.getDocs(fs.query(fs.collection(db, "missions"), fs.where("projectId", "==", grupo), fs.where("stargateId", "==", String(o.misionAlta))))
          .then(function (m) {
            if (!m.empty) return ctx.llamar("completeMission", { projectId: grupo, missionId: m.docs[0].id, studentProfileId: fichaRef.id });
          })
          .catch(function (e) {
            avisos.push("alta");
            if (typeof console !== "undefined") console.warn("[GP_SDK] la misión del alta no ha entrado:", e && e.message);
          });
      }).then(function () {
        return { ficha: fichaRef.id, proyecto: proyecto, avisos: avisos };
      });
    }

    /**
     * CAMBIAR EL ALIAS de una ficha (la corrección del profesorado): el nuevo, reservado a nombre de su dueño; el viejo, libre;
     * y la ficha, en el mismo lote. `extra`: otros campos de la ficha que se corrigen a la vez.
     */
    function cambiarAlias(grupo, fichaId, nuevo, extra, textos) {
      var fichaRef = fs.doc(db, "student_profiles", fichaId);
      return fs.getDoc(fichaRef).then(function (f) {
        if (!f.exists()) throw new Error(texto(textos, "sinFicha"));
        var uid = f.data().userId, viejo = f.data().displayName, lote = fs.writeBatch(db);
        var cambios = Object.assign({}, extra || {}, { displayName: nuevo });
        return reservar(lote, grupo, uid, nuevo, textos).then(function () {
          if (clave(viejo) === clave(nuevo)) return null;
          return reserva(grupo, viejo).then(function (x) {
            // 8-oct · el viejo queda libre en su sitio y, hasta contraer, también en la vieja
            var leer = function (r) { return r ? fs.getDoc(r).catch(function () { return null; }) : Promise.resolve(null); };
            return Promise.all([leer(x.ref), leer(x.antes)]);
          }).catch(function () { return []; }).then(function (rr) {
            rr.forEach(function (rv) { if (rv && rv.exists() && rv.data().uid === uid) lote.delete(rv.ref); });
          });
        }).then(function () {
          lote.update(fichaRef, cambios);
          return lote.commit();
        }).catch(function (e) {
          if (!denegado(e)) throw e;
          return ocupado(grupo, nuevo, { ficha: fichaId }).then(function (otro) {
            if (otro) throw new Error(texto(textos, "ocupado", nuevo));
            throw e;
          });
        });
      });
    }

    return { ref: ref, reserva: reserva, ocupado: ocupado, reservar: reservar, alistar: alistar, cambiarAlias: cambiarAlias,
      leerGrupo: leerGrupo, porCodigo: porCodigo, codigoEs: codigoEs };
  }

  return { COLECCION: COLECCION, GRUPOS: GRUPOS, CODIGOS: CODIGOS, plano: plano, clave: clave, normalizarCodigo: normalizarCodigo,
    fichaNueva: fichaNueva, conCodigo: conCodigo, TEXTOS: TEXTOS, crear: crear };
});
// ─── fin de la pieza «alistarse» ───
});
var premios = pieza(function (module, exports) {
// ─── GP_SDK pieza «premios» (sdk/premios.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · LOS PREMIOS POR ENLACE (7-oct-2026) — pieza del SDK v1 (fase 5 de docs/PLAN_CENTRALIZAR.md, paso 5).
 *
 * Un enlace con premio escondido (en clase, en un Genially, en un vídeo): los huevos y escondites de STARGATE, y los cofres del
 * camino, el gato de cada tema y el cofre de la clase de DPG. Las dos webs los hacían igual, cada una con su copia:
 *
 *   🔴 EL TOPE LO CUENTA EL SERVIDOR. Cada premio es una recompensa de GamificaPro con reclamación por enlace y quien cuenta
 *      es `claimLinkedReward`, dentro de una transacción (uno por persona, el tope total, el de cada escuadrón, la ventana de
 *      fechas). Contarlo en el navegador dejaba colarse a dos que pulsaran a la vez. Aquí solo se prepara, se pregunta antes y
 *      se abre lo que ya decidió el servidor.
 *   🔴 EL CÓDIGO NO VA EN NINGÚN DOCUMENTO PÚBLICO. En la recompensa, su huella (`claimLinkHash` = sha256("id:código"), la que
 *      comprueba functions/claimLinks.js); el código en claro, solo en `projects/{grupo}/privado/stargate.<catálogo>` (lo lee el
 *      equipo docente) y en el enlace.
 *
 * Puro:
 *   · `azar(n, abc)`        al azar de verdad (crypto); `ABC_ID` sin l, o, 0 ni 1 (se dicta y se teclea en clase; la «i» sí va, como siempre), `ABC_CODIGO`.
 *   · `huella(id, código)`  → promesa del sha256 en hexadecimal.
 *   · `estado(R, ahora)`    cómo está la recompensa antes de pulsar: abierto · pronto · cerrado · pausado · agotado · borrado.
 *   · `marca(ficha, rid)`   → { mio (ya lo reclamó), sinAbrir (reclamado y aún en su inventario) }.
 * Con `crear(ctx)` (ctx = { fs, llamar }):
 *   · `catalogo(grupo, campo)`, `guardar(grupo, { rid, item, recompensa, campo })`, `quitar(grupo, rid, campo, id)`,
 *     `gruposCon(grupos, ridDe)`, `leer(grupo, rid, fichaId)`, `quien(grupo, rid)`, `reclamar(rid, código)` y
 *     `abrir(grupo, rid, fichaId, usos)`.
 * Lo que se enseña (qué ha tocado, los textos, el orden del catálogo, cómo se arma la recompensa) es de cada web.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPPREMIOS = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var ABC_ID = "abcdefghijkmnpqrstuvwxyz23456789";
  var ABC_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  var PRIVADO = "stargate";   // projects/{grupo}/privado/stargate: lo que solo lee el equipo docente

  function cripto() {
    var c = typeof crypto !== "undefined" ? crypto : null;
    if (!c || !c.getRandomValues) throw new Error("GP_SDK.premios: sin crypto en este navegador");
    return c;
  }
  function azar(n, abc) {
    var A = abc || ABC_ID, r = new Uint32Array(n);
    cripto().getRandomValues(r);
    return Array.from(r, function (x) { return A[x % A.length]; }).join("");
  }
  function huella(id, codigo) {
    var datos = new TextEncoder().encode(String(id) + ":" + String(codigo));
    return cripto().subtle.digest("SHA-256", datos).then(function (b) {
      return Array.from(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, "0"); }).join("");
    });
  }
  /** Cómo está una recompensa por enlace ahora mismo (quien decide de verdad es el servidor al reclamar). */
  function estado(R, ahora) {
    var t = ahora == null ? Date.now() : ahora;
    if (!R || R.stargateBorrado) return "borrado";
    if (R.claimLinkEnabled === false) return "pausado";
    var desde = Number(R.claimLinkStartsAt) || 0, hasta = Number(R.claimLinkEndsAt) || 0;
    if (desde && t < desde) return "pronto";
    if (hasta && t > hasta) return "cerrado";
    var tope = Number(R.claimLinkMaxTotal) || 0;
    if (tope && (Number(R.claimLinkTotalClaimed) || 0) >= tope) return "agotado";
    return "abierto";
  }
  function marca(F, rid) {
    var f = F || {}, mio = Number((f.linkedRewardClaims || {})[rid] || 0) >= 1;
    return { mio: mio, sinAbrir: mio && (Array.isArray(f.inventory) ? f.inventory : []).indexOf(rid) >= 0 };
  }

  function requiere(ctx, nombres) {
    var fs = ctx && ctx.fs;
    if (!fs) throw new Error("GP_SDK.premios: falta ctx.fs (las funciones de Firestore de la web)");
    nombres.forEach(function (n) { if (!fs[n]) throw new Error("GP_SDK.premios: falta ctx.fs." + n); });
    return fs;
  }

  function crear(ctx) {
    var fs = requiere(ctx, ["db", "doc", "getDoc", "getDocs", "collection", "query", "where", "writeBatch", "deleteField"]);
    var db = fs.db;
    function llamar(n, d) {
      if (!ctx.llamar) return Promise.reject(new Error("GP_SDK.premios: falta ctx.llamar"));
      return ctx.llamar(n, d);
    }
    function privado(grupo) { return fs.doc(db, "projects", grupo, "privado", PRIVADO); }

    /** El catálogo de un grupo (`privado/stargate.<campo>`, con su código): solo lo lee su equipo docente. Si no puede, []. */
    function catalogo(grupo, campo) {
      return fs.getDoc(privado(grupo)).then(function (d) {
        var mapa = (d.exists() && d.data()[campo]) || {};
        return Object.keys(mapa).map(function (k) { return mapa[k]; }).filter(function (x) { return x && x.id; });
      }, function () { return []; });
    }
    /**
     * Guardar UN premio en UN grupo, en la misma escritura: su recompensa (con la huella del código, sin el código, y sin
     * borrar) y su entrada en lo privado. `recompensa` puede ser una función del premio ya fechado (`actualizado`). → el premio.
     */
    function guardar(grupo, o) {
      var item = Object.assign({}, o.item, { actualizado: Date.now() });
      return huella(item.id, item.codigo).then(function (h) {
        var R = typeof o.recompensa === "function" ? o.recompensa(item) : o.recompensa;
        var lote = fs.writeBatch(db), entrada = {}, cat = {};
        entrada[item.id] = item; cat[o.campo] = entrada;
        lote.set(fs.doc(db, "rewards", o.rid), Object.assign({}, R, { claimLinkHash: h, stargateBorrado: false }), { merge: true });
        lote.set(privado(grupo), cat, { merge: true });
        return lote.commit().then(function () { return item; });
      });
    }
    /** Quitarlo de un grupo: cerrado y marcado (borrar la recompensa solo puede el dueño); quien lo reclamó lo conserva. */
    function quitar(grupo, rid, campo, id) {
      var lote = fs.writeBatch(db), fuera = {};
      fuera[campo + "." + id] = fs.deleteField();
      lote.set(fs.doc(db, "rewards", rid), { claimLinkEnabled: false, stargateBorrado: true }, { merge: true });
      lote.update(privado(grupo), fuera);
      return lote.commit();
    }
    /** ¿En cuáles de estos grupos está? (el enlace no lleva el grupo: se deduce de quién pulsa) */
    function gruposCon(grupos, ridDe) {
      var gs = grupos || [];
      return Promise.all(gs.map(function (g) {
        return fs.getDoc(fs.doc(db, "rewards", ridDe(g))).then(function (d) { return d.exists() && !d.data().stargateBorrado; }, function () { return false; });
      })).then(function (hay) { return gs.filter(function (_, i) { return hay[i]; }); });
    }
    /** La recompensa y la ficha de quien mira (a la vez) → { R, F, mio, sinAbrir }. Sin ficha, F = {}. */
    function leer(grupo, rid, fichaId) {
      return Promise.all([fs.getDoc(fs.doc(db, "rewards", rid)), fichaId ? fs.getDoc(fs.doc(db, "student_profiles", fichaId)) : null])
        .then(function (r) {
          var R = r[0].exists() ? r[0].data() : null, F = r[1] && r[1].exists() ? r[1].data() : {}, m = marca(F, rid);
          return { R: R, F: F, mio: m.mio, sinAbrir: m.sinAbrir };
        });
    }
    /** El alias de quien se lo llevó (para «lo encontró Ada», no «otra persona»). "" si nadie o si no se puede leer. */
    function quien(grupo, rid) {
      return fs.getDocs(fs.query(fs.collection(db, "student_profiles"), fs.where("projectId", "==", grupo))).then(function (r) {
        var d = r.docs.filter(function (x) { return marca(x.data(), rid).mio; })[0];
        return d ? String(d.data().displayName || "") : "";
      }, function () { return ""; });
    }
    /**
     * Reclamarlo con su código (el servidor comprueba la huella y los topes) → { ok, respuesta } o { ya: true } (ya era suyo).
     * Si no se puede, el error del servidor con `motivo`: «agotado» (llegó tarde), «pronto» o «cerrado» (fuera de su ventana),
     * o "" (otro: la web lo dice con sus palabras).
     */
    function reclamar(rid, codigo) {
      return llamar("claimLinkedReward", { rewardId: rid, modo: "item", codigo: String(codigo || "") }).then(function (r) {
        return { ok: true, respuesta: r };
      }, function (e) {
        var m = String((e && e.message) || ""), c = String((e && e.code) || "");
        var motivo = /SOLD_OUT|resource-exhausted/i.test(m + " " + c) ? "agotado"
          : /límite de reclamos/i.test(m) ? "ya"
          : /aún no está abierto/i.test(m) ? "pronto"
          : /ya se ha cerrado/i.test(m) ? "cerrado" : "";
        if (motivo === "ya") return { ya: true };
        try { e.motivo = motivo; } catch (_) { /* congelado */ }
        throw e;
      });
    }
    /**
     * Abrirlo ya reclamado: se consume `usos` veces (un sobre, tres), EN SERIE (a la vez se pisarían) → { abiertos, resultados,
     * error }. Lo que no se abra se queda en el inventario: la web lo DICE (nunca «+25» con el saldo quieto).
     */
    function abrir(grupo, rid, fichaId, usos) {
      var n = Math.max(1, Number(usos) || 1), resultados = [], error = null;
      var i = 0;
      function otro() {
        if (i >= n) return Promise.resolve();
        i++;
        return llamar("consumeItem", { projectId: grupo, rewardId: rid, studentProfileId: fichaId })
          .then(function (c) { resultados.push(c); return otro(); }, function (e) { error = e; });
      }
      return otro().then(function () { return { abiertos: resultados.length, resultados: resultados, error: error }; });
    }

    return { privado: privado, catalogo: catalogo, guardar: guardar, quitar: quitar, gruposCon: gruposCon, leer: leer,
             quien: quien, reclamar: reclamar, abrir: abrir };
  }

  return { ABC_ID: ABC_ID, ABC_CODIGO: ABC_CODIGO, PRIVADO: PRIVADO, azar: azar, huella: huella, estado: estado, marca: marca, crear: crear };
});
// ─── fin de la pieza «premios» ───
});
var asistencia = pieza(function (module, exports) {
// ─── GP_SDK pieza «asistencia» (sdk/asistencia.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · LA LLAMADA A CLASE: ABRIR, FICHAR Y CERRAR (7-oct-2026) — pieza del SDK v1 (fase 5 de docs/PLAN_CENTRALIZAR.md,
 * paso 6).
 *
 * El pase de lista de GamificaPro, como lo usaban las dos webs: una sesión con ventana (`attendance_sessions`) que abre un
 * docente, y cada estudiante ficha una vez. Lo de las dos webs, aquí una vez:
 *
 *   🔴 No hay palabra secreta: en Firestore, un sitio donde el alumnado pudiera comprobarla es un sitio donde podría leerla. Lo
 *      que no se adivina es el MOMENTO: la ventana es corta y la abre el docente cuando quiere.
 *   🔴 Las cantidades no las decide el navegador del alumno: van EN LA SESIÓN (las elige el docente al abrirla) y las cobra el
 *      servidor (`modFichar`, functions/modAsistencia.js: registro y cobro en una transacción). `coinsReward` va SIEMPRE
 *      escrito: si falta, `applyXpDelta` paga 30.
 *   🔴 Se ESCUCHA (onSnapshot), no se pregunta cada X segundos: con 200 estudiantes, preguntar cada diez segundos son 1.200
 *      lecturas por minuto. `vigilar` devuelve la función para dejar de escuchar.
 *
 * Puro: `ms(t)` (Timestamp, Date, cadena o número → milisegundos; 0 si no hay), `fin(sesion)`, `COLECCIONES`, `CAMPO_CLASE`,
 * `marcas(porUid, prefijo)` y `reparto(o)` (abajo, «el histórico»).
 * Con `crear(ctx)` (ctx = { fs, llamar, sesion, registro? }; `registro` = GP_SDK.registro.crear(…): si lo hay, `vigilar` apunta ahí sus fallos): `abierta(grupo, elegir)`, `vigilar(grupo, alCambiar, elegir)`,
 * `abrir(grupo, o)`, `cerrar(id)`, `fichajes(sesionId)` (en orden de llegada), `yaFiche(sesionId, uid)`,
 * `fichar(grupo, fichaId, { tz })` e `historial(grupo)`. Cuánto se paga, a quién va la llamada (`restrictedFactionId`) y el
 * regalo son de cada web.
 *
 * EL HISTÓRICO DE UN GRUPO (7-oct, la deuda del §6 del plan: salió de DPG, web-camino → motor.js · asistenciaGrupo y
 * motor/asistencia.js, y da lo mismo, probado). Mi gente → Asistencia cuenta TODO fichaje de cada llamada, entre por donde
 * entre (la clase en directo, el enlace del chat, la diapositiva de la sesión): todos los escribe el servidor (`modFichar`) en
 * `attendance_records`. Y reparte cada llamada a UNA clase del curso del mod:
 *   1. la que lleva escrita (`modClase`, CAMPO_CLASE: la pone `abrir(grupo, { clase })` cuando quien abre sabe qué clase da);
 *   2. si no, la que dicen quienes ficharon en ella desde la clase en directo (`enClase`; gana la más votada de su semana);
 *   3. si tampoco, por el día: en una semana con varias clases, el primer día con llamada es la primera clase de la semana, el
 *      siguiente la segunda (las ya repartidas no se repiten; si se acaban, la última). El mismo día, la misma clase.
 * Lo de la clase en directo cuenta además. Quien ficha por dos puertas en la misma clase cuenta UNA vez.
 * Sin piel: cómo se llaman las clases y su semana (`clases`), el calendario (`dia`, `semanaDe`) y dónde vive la marca de la
 * clase en directo (la web la lee y la pasa; `marcas(porUid, prefijo)` la saca de un mapa de fichas con el prefijo del mod)
 * los da quien llama.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPASISTENCIA = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var COLECCIONES = { llamadas: "attendance_sessions", fichajes: "attendance_records" };
  /** El campo de la llamada con la clase que se da (lo escribe `abrir` con `o.clase`; el servidor no lo lee). */
  var CAMPO_CLASE = "modClase";

  /** Firestore devuelve Timestamp; de una exportación puede llegar cadena o número. */
  function ms(t) {
    if (!t) return 0;
    var d = t && t.toDate ? t.toDate() : new Date(t);
    var n = d.getTime();
    return isNaN(n) ? 0 : n;
  }
  function fin(x) { return ms(x && x.endTime); }

  function requiere(ctx, nombres) {
    var fs = ctx && ctx.fs;
    if (!fs) throw new Error("GP_SDK.asistencia: falta ctx.fs (las funciones de Firestore de la web)");
    nombres.forEach(function (n) { if (!fs[n]) throw new Error("GP_SDK.asistencia: falta ctx.fs." + n); });
    return fs;
  }

  function crear(ctx) {
    var fs = requiere(ctx, ["db", "doc", "getDocs", "addDoc", "updateDoc", "collection", "query", "where"]);
    var db = fs.db;
    var sesion = ctx.sesion || function () { return Promise.resolve(null); };

    function consulta(grupo) {
      return fs.query(fs.collection(db, COLECCIONES.llamadas), fs.where("projectId", "==", grupo), fs.where("active", "==", true));
    }
    /** Las vivas (activas y sin caducar), la que acaba más tarde primero. */
    function vivas(docs, ahora) {
      return docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })
        .filter(function (x) { return fin(x) > ahora; })
        .sort(function (a, b) { return fin(b) - fin(a); });
    }
    /**
     * La llamada abierta de un grupo, o null. `elegir` (opcional): cuál vale cuando hay varias (cada docente toca la de SU
     * escuadrón): una función, o "mia" (la que abrió quien mira). Sin elegir, la más reciente.
     */
    function abierta(grupo, elegir) {
      return fs.getDocs(consulta(grupo)).then(function (r) {
        var v = vivas(r.docs, Date.now());
        if (elegir === "mia") return Promise.resolve(sesion()).then(function (yo) { return v.filter(function (x) { return !!yo && x.teacherId === yo.uid; })[0] || null; });
        return (typeof elegir === "function" ? v.filter(elegir) : v)[0] || null;
      });
    }
    /** A la escucha de la llamada del grupo, en directo: alCambiar(la elegida o null, todas las vivas). → dejar de escuchar. */
    function vigilar(grupo, alCambiar, elegir) {
      if (!fs.onSnapshot) throw new Error("GP_SDK.asistencia: falta ctx.fs.onSnapshot");
      /*
       * 🔴 15-oct (mensaje yMpOY2GJZq7YPpAbTajk, PER 16450) · si la escucha falla (sesión caducada, red, permisos un instante), Firestore
       * la CIERRA y no vuelve sola: la pantalla se quedaba sin «Presente» (o sin la llamada abierta) hasta recargar. Ahora, tras
       * el aviso de «no hay llamada», se vuelve a escuchar (2 s, 4 s, 8 s… hasta 30 s) y se avisa en cuanto haya datos.
       */
      var parado = false, baja = null, espera = null, fallos = 0;
      function escuchar() {
        baja = fs.onSnapshot(consulta(grupo), function (r) {
          fallos = 0;
          var v = vivas(r.docs, Date.now());
          alCambiar((typeof elegir === "function" ? v.filter(elegir) : v)[0] || null, v);
        }, function (err) {
          // 15-oct · lo apunta el registro de fallos de infraestructura (GP_SDK.registro; ctx.registro es opcional: sin él, igual que antes)
          if (ctx.registro && typeof ctx.registro.apuntar === "function") { try { ctx.registro.apuntar(err, { pantalla: "asistencia" }); } catch (e) { /* nunca estorba */ } }
          alCambiar(null, []);
          if (parado) return;
          espera = setTimeout(escuchar, Math.min(30000, 2000 * Math.pow(2, fallos++)));
        });
      }
      escuchar();
      return function () { parado = true; if (espera) clearTimeout(espera); if (typeof baja === "function") baja(); };
    }
    /**
     * Abrir la llamada. o = { minutos (30 si no), xp, creditos (lo que paga: va en la sesión), nombre (quien la toca; si no, el
     * de la cuenta), clase (la clase que se da, para el histórico: va en `modClase`), extra: { restrictedFactionId,
     * stargateRegalo… } (lo del mod), textos: { sinSesion } } → { id, hasta (ms), minutos }.
     */
    function abrir(grupo, o) {
      o = o || {};
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo || !yo.uid) throw new Error((o.textos && o.textos.sinSesion) || "Entra con tu cuenta.");
        var minutos = Math.max(1, Number(o.minutos) || 30), ahora = new Date(), hasta = new Date(ahora.getTime() + minutos * 60000);
        var datos = Object.assign({
          projectId: grupo, teacherId: yo.uid, teacherDisplayName: o.nombre || yo.nombre || yo.correo,
          startTime: ahora, endTime: hasta, active: true,
          pointsReward: Math.max(0, Number(o.xp) || 0), coinsReward: Math.max(0, Number(o.creditos) || 0), autoReward: true,
        }, o.extra || {});
        if (o.clase != null && String(o.clase) !== "") datos[CAMPO_CLASE] = String(o.clase);
        return fs.addDoc(fs.collection(db, COLECCIONES.llamadas), datos).then(function (ref) {
          return { id: ref.id, hasta: hasta.getTime(), minutos: minutos };
        });
      });
    }
    /** Cerrarla antes de tiempo. */
    function cerrar(id) {
      return fs.updateDoc(fs.doc(db, COLECCIONES.llamadas, String(id)), { active: false, endTime: new Date() });
    }
    /** Quién ha fichado en una llamada, en orden de llegada (para verlo en directo desde la consola). */
    function fichajes(sesionId) {
      return fs.getDocs(fs.query(fs.collection(db, COLECCIONES.fichajes), fs.where("sessionId", "==", sesionId))).then(function (r) {
        return r.docs.map(function (d, i) { return { x: Object.assign({ id: d.id }, d.data()), i: i }; })
          .sort(function (a, b) { return (ms(a.x.registeredAt) - ms(b.x.registeredAt)) || (a.i - b.i); })
          .map(function (o) { return o.x; });
      });
    }
    /** ¿Ya fichó esta persona en esta llamada? (dos igualdades, una su uid: lo que dejan leer las reglas, sin índice nuevo) */
    function yaFiche(sesionId, uid) {
      if (!sesionId || !uid) return Promise.resolve(false);
      return fs.getDocs(fs.query(fs.collection(db, COLECCIONES.fichajes), fs.where("sessionId", "==", sesionId), fs.where("userId", "==", uid)))
        .then(function (r) { return !r.empty; });
    }
    /**
     * Fichar: lo hace el servidor (`modFichar`): busca la llamada de su escuadrón (o una para todo el grupo), mira que no haya
     * fichado ya hoy (en `tz`, si se da), escribe el registro y cobra en una transacción. → lo que contesta
     * ({ repetido } o { xp, creditos, racha, extra, regalo… }).
     */
    function fichar(grupo, fichaId, o) {
      if (!ctx.llamar) return Promise.reject(new Error("GP_SDK.asistencia: falta ctx.llamar"));
      var datos = { projectId: grupo, studentProfileId: fichaId };
      if (o && o.tz) datos.tz = String(o.tz);
      return ctx.llamar("modFichar", datos);
    }

    /**
     * El histórico de un grupo: todas sus llamadas y todos sus fichajes (dos lecturas, sin escuchar; los fichajes los dejan leer
     * las reglas a su equipo docente). → { llamadas: [{ id, inicio (ms), clase (lo escrito en `modClase`, o null) }],
     * fichajes: [{ sessionId, userId }] }, lo que pide `reparto`.
     */
    function historial(grupo) {
      var g = String(grupo);
      return Promise.all([
        fs.getDocs(fs.query(fs.collection(db, COLECCIONES.llamadas), fs.where("projectId", "==", g))),
        fs.getDocs(fs.query(fs.collection(db, COLECCIONES.fichajes), fs.where("projectId", "==", g))),
      ]).then(function (r) {
        return {
          llamadas: r[0].docs.map(function (d) {
            var x = d.data() || {};
            return { id: d.id, inicio: ms(x.startTime), clase: typeof x[CAMPO_CLASE] === "string" ? x[CAMPO_CLASE] : null };
          }),
          fichajes: r[1].docs.map(function (d) { var x = d.data() || {}; return { sessionId: String(x.sessionId || ""), userId: String(x.userId || "") }; }),
        };
      });
    }

    return { abierta: abierta, vigilar: vigilar, abrir: abrir, cerrar: cerrar, fichajes: fichajes, yaFiche: yaFiche, fichar: fichar,
      historial: historial };
  }

  /**
   * Las marcas de la clase en directo, del mapa de cada ficha: { uid: { "<prefijo><clase>": algo } } → { uid: { clase: true } }
   * (solo las que valen: lo demás de la ficha, fuera). El prefijo es del mod (DPG: «fich:», en su ficha de la clase).
   */
  function marcas(porUid, prefijo) {
    var p = String(prefijo || ""), o = {};
    if (!p) return o;
    Object.keys(porUid || {}).forEach(function (u) {
      var r = porUid[u] || {};
      Object.keys(r).forEach(function (k) {
        if (k.indexOf(p) === 0 && k.length > p.length && r[k]) (o[u] = o[u] || {})[k.slice(p.length)] = true;
      });
    });
    return o;
  }

  /**
   * Reparte cada llamada a su clase y dice quién vino a cada clase (ver arriba, «el histórico»).
   *   o = { clases: [{ id, sem }] (en su orden), llamadas: [{ id, inicio (ms), clase? }], fichajes: [{ sessionId, userId }],
   *         enClase: { uid: { clase: true } } (la clase en directo: `marcas`), dia(ms) → «AAAA-MM-DD», semanaDe(dia) → n | null }
   *   → { porUid: { uid: { clase: true } }, deLlamada: { llamada: clase } }
   * Una llamada sin clase escrita y fuera del curso (semanaDe → null) no es de ninguna.
   */
  function reparto(o) {
    o = o || {};
    var clases = o.clases || [], llamadas = o.llamadas || [], fichajes = o.fichajes || [], ec = o.enClase || {};
    var existe = {}, porSem = {};
    clases.forEach(function (c) { existe[c.id] = true; if (c.sem != null) (porSem[c.sem] = porSem[c.sem] || []).push(c.id); });
    var quienes = {};   // llamada → [uid] que ficharon en ella
    fichajes.forEach(function (f) { if (f && f.sessionId && f.userId) (quienes[f.sessionId] = quienes[f.sessionId] || []).push(f.userId); });

    // las llamadas, por semana y por día (en orden)
    var semanas = {};
    llamadas.slice().sort(function (a, b) { return (a.inicio || 0) - (b.inicio || 0); }).forEach(function (l) {
      if (!l || !l.id) return;
      var d = o.dia ? o.dia(l.inicio) : "", s = d && o.semanaDe ? o.semanaDe(d) : null;
      var marcada = l.clase && existe[l.clase] ? l.clase : null;
      if (s == null && !marcada) return;   // fuera del curso y sin clase escrita: no es de ninguna
      var w = semanas[s] || (semanas[s] = { dias: [], porDia: {} });
      if (!w.porDia[d]) { w.porDia[d] = []; w.dias.push(d); }
      w.porDia[d].push({ id: l.id, marcada: marcada });
    });

    var deLlamada = {};
    Object.keys(semanas).forEach(function (s) {
      var w = semanas[s], cands = porSem[s] || [], usadas = {}, delDia = {};
      // 1 · lo escrito y 2 · lo que dicen los votos de la clase en directo
      w.dias.forEach(function (d) {
        var ls = w.porDia[d], m = ls.filter(function (l) { return l.marcada; })[0];
        if (m) { delDia[d] = m.marcada; usadas[m.marcada] = true; return; }
        var votos = {};
        ls.forEach(function (l) {
          (quienes[l.id] || []).forEach(function (u) {
            var r = ec[u] || {};
            cands.forEach(function (c) { if (r[c]) votos[c] = (votos[c] || 0) + 1; });
          });
        });
        var mejor = cands.filter(function (c) { return votos[c]; }).sort(function (a, b) { return votos[b] - votos[a] || cands.indexOf(a) - cands.indexOf(b); })[0];
        if (mejor) { delDia[d] = mejor; usadas[mejor] = true; }
      });
      // 3 · por el día: la siguiente clase de la semana que no se haya llevado otro día (y, si se acaban, la última)
      w.dias.forEach(function (d) {
        if (delDia[d] || !cands.length) return;
        var libre = cands.filter(function (c) { return !usadas[c]; })[0] || cands[cands.length - 1];
        delDia[d] = libre; usadas[libre] = true;
      });
      w.dias.forEach(function (d) {
        w.porDia[d].forEach(function (l) { var c = l.marcada || delDia[d]; if (c) deLlamada[l.id] = c; });
      });
    });

    var porUid = {};
    var poner = function (u, c) { if (u && c && existe[c]) (porUid[u] = porUid[u] || {})[c] = true; };
    fichajes.forEach(function (f) { if (f) poner(f.userId, deLlamada[f.sessionId]); });
    Object.keys(ec).forEach(function (u) { Object.keys(ec[u] || {}).forEach(function (c) { if (ec[u][c]) poner(u, c); }); });
    return { porUid: porUid, deLlamada: deLlamada };
  }

  return { COLECCIONES: COLECCIONES, CAMPO_CLASE: CAMPO_CLASE, ms: ms, fin: fin, marcas: marcas, reparto: reparto, crear: crear };
});
// ─── fin de la pieza «asistencia» ───
});
var votacion = pieza(function (module, exports) {
// ─── GP_SDK pieza «votacion» (sdk/votacion.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · LAS VOTACIONES (7-oct-2026) — pieza del SDK v1 (fase 5 de docs/PLAN_CENTRALIZAR.md, paso 7).
 *
 * Las votaciones son las de GamificaPro de siempre: `projects/{grupo}/voting_events/{id}` con la forma que espera el motor
 * (`title`, `options` [{ id, title, totalFreeVotes, totalCoinsInvested }], `isActive`, `votesPerPerson`, `costPerVote`,
 * `maxPaidVotesPerPerson`, `eligibleFactionId`) y una papeleta por ficha en `votes/{ficha}` (`byOption`). Votar lo cuenta y lo
 * cobra el servidor (`castVote`: voto gratis o de pago, el «voto extra»); abrir y cerrar lo dejan las reglas a cualquier docente
 * del grupo. STARGATE (las del aula, en directo o en diferido) y DPG (Candelara y el rostro del Mentor) lo hacían igual:
 *
 * Puro: `opciones(textos)` (el id de cada opción es su posición, «o1», «o2»…, y no cambia nunca) y `votoDe(byOption)` (la opción
 * de una papeleta: la primera con algo).
 * Con `crear(ctx)` (ctx = { fs, llamar, sesion }): `ref(grupo, id)`, `votar(grupo, id, opción, tipo)`, `votos(grupo, id)`
 * ({ ficha: opción }), `leer(grupo, id)` ({ evento, votos }), `abrir(grupo, id, evento)` (con su id, una vez), `nueva(grupo,
 * evento)` (con id al azar), `cerrar(grupo, id, extra)`, `borrar(grupo, id)`, `lista(grupo)`, `vigilar(grupo, alCambiar)` (las
 * activas, en directo), `vigilarLigero(grupo, alCambiar)` (lo mismo para el alumnado, sin los recuentos de cada voto; 19-oct) y
 * `miPapeleta(grupo, id, ficha)`. Los campos propios del mod (la semana, el modo…) van en el evento.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPVOTACION = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  function opciones(textos) {
    return (textos || []).map(String).map(function (s) { return s.trim(); }).filter(Boolean)
      .map(function (titulo, i) { return { id: "o" + (i + 1), title: titulo, totalFreeVotes: 0, totalCoinsInvested: 0 }; });
  }
  function votoDe(b) {
    var x = b || {};
    return Object.keys(x).filter(function (k) { return Number(x[k]) > 0; })[0] || null;
  }
  function porCreado(a, b) { return Number(b.creado || 0) - Number(a.creado || 0); }

  function requiere(ctx, nombres) {
    var fs = ctx && ctx.fs;
    if (!fs) throw new Error("GP_SDK.votacion: falta ctx.fs (las funciones de Firestore de la web)");
    nombres.forEach(function (n) { if (!fs[n]) throw new Error("GP_SDK.votacion: falta ctx.fs." + n); });
    return fs;
  }

  function crear(ctx) {
    var fs = requiere(ctx, ["db", "doc", "getDoc", "getDocs", "setDoc", "updateDoc", "deleteDoc", "collection", "query", "where"]);
    var db = fs.db;
    var sesion = ctx.sesion || function () { return Promise.resolve(null); };
    function col(grupo) { return fs.collection(db, "projects", grupo, "voting_events"); }
    function ref(grupo, id) { return fs.doc(db, "projects", grupo, "voting_events", String(id)); }

    /** Votar: gratis («free») o pagando el voto extra («paid»). Lo cuenta y lo cobra el servidor. */
    function votar(grupo, id, opcion, tipo) {
      if (!ctx.llamar) return Promise.reject(new Error("GP_SDK.votacion: falta ctx.llamar"));
      return ctx.llamar("castVote", { projectId: grupo, eventId: id, optionId: opcion, voteType: tipo || "free" });
    }
    /** Las papeletas → { ficha: opción } (las que no votan nada no cuentan). */
    function votos(grupo, id) {
      return fs.getDocs(fs.collection(db, "projects", grupo, "voting_events", String(id), "votes")).then(function (r) {
        var v = {};
        r.docs.forEach(function (d) { var k = votoDe(d.data().byOption); if (k) v[d.id] = k; });
        return v;
      });
    }
    /** La votación y sus papeletas → { evento: { id, … } | null, votos }. Si nadie la ha abierto, { evento: null, votos: {} }. */
    function leer(grupo, id) {
      return fs.getDoc(ref(grupo, id)).then(function (ev) {
        if (!ev.exists()) return { evento: null, votos: {} };
        return votos(grupo, id).then(function (v) { return { evento: Object.assign({ id: ev.id }, ev.data()), votos: v }; });
      });
    }
    /**
     * Abrirla con SU id, una vez: si ya existe, se deja como está (sus opciones son las del momento de abrirla) → { ya: true };
     * si no, → { ok: true }. `evento`: el documento, o una función que lo da (o lanza si aún no se puede abrir).
     */
    function abrir(grupo, id, evento, textos) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo || !yo.uid) throw new Error((textos && textos.sinSesion) || "Entra con tu cuenta.");
        return fs.getDoc(ref(grupo, id)).then(function (ya) {
          if (ya.exists()) return { ya: true };
          // (una función: se pide solo si hay que abrirla; si no vale, que lance, y la que ya estaba abierta sigue contando)
          var ev = typeof evento === "function" ? evento() : evento;
          return fs.setDoc(ref(grupo, id), Object.assign({}, ev, { creado: Date.now(), creadoPor: yo.uid })).then(function () { return { ok: true }; });
        });
      });
    }
    /** Una nueva, con id al azar (las del aula) → su id. Sin dos opciones, no. */
    function nueva(grupo, evento) {
      var ev = evento || {};
      if (!Array.isArray(ev.options) || ev.options.length < 2) return Promise.reject(new Error("Una votación necesita al menos dos opciones."));
      return Promise.resolve(sesion()).then(function (yo) {
        var d = fs.doc(col(grupo));
        return fs.setDoc(d, Object.assign({ isActive: true, votesPerPerson: 1, costPerVote: 0, maxPaidVotesPerPerson: 0, eligibleFactionId: "", factionVoteTotals: {} },
          ev, { creado: Date.now(), creadoPor: yo ? yo.uid : null })).then(function () { return d.id; });
      });
    }
    /** Cerrarla: deja de aceptar votos. `extra`: la ganadora, cuándo… (lo que guarde cada mod). */
    function cerrar(grupo, id, extra) {
      return fs.updateDoc(ref(grupo, id), Object.assign({ isActive: false }, extra || {}));
    }
    function borrar(grupo, id) { return fs.deleteDoc(ref(grupo, id)); }
    /** Todas las del grupo, la más nueva primero. */
    function lista(grupo) {
      return fs.getDocs(col(grupo)).then(function (r) {
        return r.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }).sort(porCreado);
      });
    }
    /** Las activas, en directo (la más nueva primero) → dejar de escuchar. Si falla, []. */
    function vigilar(grupo, alCambiar) {
      if (!fs.onSnapshot) throw new Error("GP_SDK.votacion: falta ctx.fs.onSnapshot");
      return fs.onSnapshot(fs.query(col(grupo), fs.where("isActive", "==", true)), function (r) {
        alCambiar(r.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }).sort(porCreado));
      }, function () { alCambiar([]); });
    }
    /**
     * 19-oct · LAS ACTIVAS, PARA EL ALUMNADO, SIN N×N (S1 de docs/AHORRO_MODS.md; functions/modVotacionSenal.js). Lo mismo que
     * `vigilar` salvo los recuentos, que el alumnado no pinta: escucha la señal del grupo (`mod_votacion/{grupo}`, 1 documento que
     * el servidor solo toca cuando cambia algo que se ve) y, con cada cambio, pide las activas una vez. Un voto ya no le llega a
     * cada Nave abierta. Sin señal, con `ligero: false` (`scripts/votacion-ligera.mjs --apagar`) o si la señal falla, escucha las
     * votaciones enteras, como `vigilar`. → dejar de escuchar.
     */
    function vigilarLigero(grupo, alCambiar) {
      if (!fs.onSnapshot) throw new Error("GP_SDK.votacion: falta ctx.fs.onSnapshot");
      var parado = false, entero = null, vez = 0;
      function todo() { if (!entero) entero = vigilar(grupo, function (l) { if (!parado) alCambiar(l); }); }
      function pedir() {
        var mia = ++vez;
        fs.getDocs(fs.query(col(grupo), fs.where("isActive", "==", true))).then(function (r) {
          if (!parado && mia === vez) alCambiar(r.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }).sort(porCreado));
        }, function () { if (!parado && mia === vez) alCambiar([]); });
      }
      var pararSenal = fs.onSnapshot(fs.doc(db, "mod_votacion", grupo), function (s) {
        if (parado) return;
        if (!s.exists() || s.data().ligero === false) return todo();
        if (entero) { entero(); entero = null; }
        pedir();
      }, function () { if (!parado) todo(); });
      return function () { parado = true; pararSenal(); if (entero) { entero(); entero = null; } };
    }
    /** Lo que ya ha votado esa ficha en esa votación (`byOption`). */
    function miPapeleta(grupo, id, fichaId) {
      if (!fichaId) return Promise.resolve({});
      return fs.getDoc(fs.doc(db, "projects", grupo, "voting_events", String(id), "votes", String(fichaId)))
        .then(function (d) { return d.exists() ? (d.data().byOption || {}) : {}; });
    }

    return { ref: ref, votar: votar, votos: votos, leer: leer, abrir: abrir, nueva: nueva, cerrar: cerrar, borrar: borrar,
             lista: lista, vigilar: vigilar, vigilarLigero: vigilarLigero, miPapeleta: miPapeleta };
  }

  return { opciones: opciones, votoDe: votoDe, crear: crear };
});
// ─── fin de la pieza «votacion» ───
});
var retos = pieza(function (module, exports) {
// ─── GP_SDK pieza «retos» (sdk/retos.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · LOS RETOS: REGISTRAR, ANULAR, OTORGAR, LAS REFLEXIONES, LOS COMENTARIOS Y LOS AVISOS (7-oct-2026) — pieza del
 * SDK v1 (fase 5 de docs/PLAN_CENTRALIZAR.md, paso 8).
 *
 * Lo que movía las dos webs alrededor de un reto, aquí una vez:
 *   · REGISTRAR lo hace el servidor (`completeMission`): una misión la completa quien la hace, y con su entrega si el mod la
 *     tiene (DPG: el servidor la valida y la escribe en la misma transacción que paga). Los retos se buscan por su id corto
 *     (`stargateId`): el documento lleva el grupo delante.
 *   · ANULAR lo hace el servidor (`stargateAnularReto`), lo pida su dueño («no lo he hecho todavía», mientras conserve lo que
 *     le dio) o su docente (con un porqué de hasta 200 letras, que el servidor también corta).
 *   · OTORGAR a mano lo hace el servidor (`modOtorgarReto`): paga y marca en UNA transacción, con su asiento.
 *   · LAS REFLEXIONES (`stargate_reflexiones/{grupo__reto__ficha}`, una por ficha y reto; la escribe su dueño, la ve el grupo por
 *     su alias) y LOS COMENTARIOS (`stargate_comentarios`, cortos; los quitan su autor, el dueño de la reflexión o el
 *     profesorado). Las reglas viven en firestore.rules. En DPG las reflexiones las escribe el servidor al registrar.
 *   · LOS AVISOS al estudiante (`notifications`, la bandeja de GamificaPro: la crea cualquiera con sesión; la lee y la marca su
 *     destinatario): el porqué de validar o anular. Cada mod marca los suyos con su campo (`campo`: «stargate», «ceniza»…).
 *   · 7-oct · LOS MENSAJES DEL SISTEMA (functions/modMensajes.js, `enviarMensajeDelSistema`): los escribe el servidor, firmados
 *     por la voz de cada mod (STARGATE: NEBULA), con `modSistema: { voz, mod, para, fichaId… }`. Al estudiante le llega con la
 *     marca de su mod, como los demás; a su docente, otro aparte (`para: 'docente'`, sin la marca). Lo puro: `delSistema(x)` y
 *     `remitente(x, porDefecto)` (quién firma: «NEBULA» en vez de «tu Comandante»); para la consola del docente,
 *     `avisosDelSistema(grupo)` y `vigilarAvisosDelSistema(grupo, alCambiar, uid)` (los suyos sin leer de ese grupo).
 *
 * Con `crear(ctx)` (ctx = { fs, llamar, sesion, sitio? }). Los textos y los títulos son de cada web.
 * 7-oct · `ctx.sitio` (opcional): (vieja, grupo) → el `GP_SDK.sitio(vieja, datos del grupo)` de ese grupo (o una promesa de él).
 * Con él, las reflexiones y los comentarios de un grupo de la versión definitiva (§1d de docs/PLAN_CENTRALIZAR.md) van a
 * `mod_reflexiones` y `mod_comentarios`, con su `mod`; los de siempre, donde siempre. Sin él, exactamente como antes.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPRETOS = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var REFLEX = "stargate_reflexiones", COMENT = "stargate_comentarios";
  var TOPES = { reflexion: 2000, comentario: 400, enlace: 500, motivo: 200, aviso: 400 };
  var TEXTOS = {
    sinReto: "Ese reto no existe en tu grupo.",
    sinSesionReflexion: "Entra con tu cuenta para guardar tu reflexión.",
    reflexionVacia: "La reflexión está vacía.",
    sinSesionComentario: "Entra con tu cuenta para comentar.",
    comentarioVacio: "El comentario está vacío.",
    sinDestino: "No sé a quién mandárselo.",
  };
  function texto(t, k) { return (t && t[k] != null) ? String(t[k]) : TEXTOS[k]; }
  /** 7-oct · El bloque de un mensaje del sistema (`modSistema`), o null si lo escribió una persona. */
  function delSistema(x) { var s = x && x.modSistema; return s && typeof s === "object" && s.voz ? s : null; }
  /** Quién firma un aviso: la voz del sistema si es suyo; si no, `porDefecto` (lo de cada web: «tu Comandante», «tu docente»…). */
  function remitente(x, porDefecto) { var s = delSistema(x); return s ? String(s.voz) : porDefecto; }
  /** ¿Es la copia que recibe el docente (a quién se lo dijo la voz y qué)? */
  function paraDocente(x) { var s = delSistema(x); return !!(s && s.para === "docente"); }
  function idReflexion(grupo, reto, fichaId) { return grupo + "__" + reto + "__" + fichaId; }

  function requiere(ctx, nombres) {
    var fs = ctx && ctx.fs;
    if (!fs) throw new Error("GP_SDK.retos: falta ctx.fs (las funciones de Firestore de la web)");
    nombres.forEach(function (n) { if (!fs[n]) throw new Error("GP_SDK.retos: falta ctx.fs." + n); });
    return fs;
  }

  function crear(ctx) {
    var fs = requiere(ctx, ["db", "doc", "getDoc", "getDocs", "setDoc", "addDoc", "updateDoc", "deleteDoc", "collection", "query", "where"]);
    var db = fs.db;
    var sesion = ctx.sesion || function () { return Promise.resolve(null); };
    function llamar(n, d) {
      if (!ctx.llamar) return Promise.reject(new Error("GP_SDK.retos: falta ctx.llamar"));
      return ctx.llamar(n, d);
    }
    function porId(d) { return Object.assign({ id: d.id }, d.data()); }
    var igual = function (d) { return d; };
    /**
     * 7-oct · dónde va `vieja` en este grupo → promesa de { col, id(x), datos(d), leer(d), antes } (sin `ctx.sitio` o sin grupo,
     * la de siempre). 8-oct · `leer`: lo leído como lo daba la vieja; `antes`: la vieja, si lo de antes de pasar sigue allí.
     */
    function en(vieja, grupo) {
      if (!ctx.sitio || grupo == null) return Promise.resolve({ col: vieja, id: String, datos: igual, leer: igual, antes: null });
      return Promise.resolve(ctx.sitio(vieja, grupo)).then(function (s) {
        return { col: s.coleccion, id: s.id, datos: s.datos, leer: s.leer || igual, antes: s.antes || null };
      });
    }
    function conId(S) { return function (d) { return Object.assign({ id: d.id }, S.leer(d.data())); }; }
    /**
     * 8-oct · Borrar `id` en su sitio y, si lo de antes de pasar sigue en la vieja (`antes`), también allí (si existe y se deja):
     * si no, la copia de la vieja volvería a `mod_*` al comparar antes de contraer.
     */
    function borrarEnLosDos(S, id) {
      return fs.deleteDoc(fs.doc(db, S.col, S.id(id))).then(function () {
        if (!S.antes) return;
        return fs.getDoc(fs.doc(db, S.antes, String(id))).then(function (a) { if (a.exists()) return fs.deleteDoc(a.ref); }).catch(function () {});
      });
    }

    // ---------------------------------------------------------------- registrar, anular, otorgar
    /** El documento de un reto por su id corto (`stargateId`). */
    function idMision(grupo, retoId, textos) {
      return fs.getDocs(fs.query(fs.collection(db, "missions"), fs.where("projectId", "==", grupo), fs.where("stargateId", "==", retoId))).then(function (r) {
        if (r.empty) throw new Error(texto(textos, "sinReto"));
        return r.docs[0].id;
      });
    }
    /** Registrar un reto (lo paga el servidor). `entregas`: la entrega en la forma de su mod (si la tiene). */
    function registrar(grupo, fichaId, retoId, entregas, textos) {
      return idMision(grupo, retoId, textos).then(function (mid) {
        var datos = { projectId: grupo, missionId: mid, studentProfileId: fichaId };
        if (entregas) datos.entregas = entregas;
        return llamar("completeMission", datos);
      });
    }
    /**
     * 14-oct · Registrar un reto DESDE UNA DIAPOSITIVA de la sesión (el relámpago, en clase o en diferido). Lo mismo que `registrar`,
     * con la sesión y si es en directo apuntadas en la entrega. Hacerlo dos veces no paga dos veces: la segunda vuelve con
     * `yaCompletada: true` (la web dice «ya lo entregaste»).
     */
    function desdeLaSesion(grupo, fichaId, retoId, entregas, origen, textos) {
      var e = {}, k;
      for (k in (entregas || {})) if (Object.prototype.hasOwnProperty.call(entregas, k)) e[k] = entregas[k];
      e.origen = { sesion: String((origen && origen.sesion) || ""), directo: !!(origen && origen.directo) };
      return registrar(grupo, fichaId, retoId, e, textos);
    }
    /** Deshacer un reto (su dueño o su docente): el servidor devuelve lo que dio y quita la entrega. */
    function anular(grupo, fichaId, retoId, motivo) {
      return llamar("modAnularReto", { projectId: grupo, studentProfileId: fichaId, retoId: retoId, motivo: String(motivo || "").slice(0, TOPES.motivo) });
    }
    /** Validarlo a mano (el docente lo da por bueno): paga y marca el servidor, en una transacción. */
    function otorgar(grupo, fichaId, retoId) {
      return llamar("modOtorgarReto", { projectId: grupo, studentProfileId: fichaId, retoId: retoId });
    }

    // ---------------------------------------------------------------- los avisos al estudiante
    /**
     * Un aviso a la bandeja del estudiante. o = { accion («validado», «anulado»…), titulo, texto (hasta 400), campo (el del mod),
     * marca ({ reto, accion, de… }: lo que la web necesita para reconocer los suyos) } → su id.
     */
    function avisar(grupo, userId, o, textos) {
      var x = o || {};
      if (!userId) return Promise.reject(new Error(texto(textos, "sinDestino")));
      var d = { userId: userId, projectId: grupo, type: x.accion === "validado" ? "mission_validated" : "internal_message",
        title: String(x.titulo || ""), message: String(x.texto || "").trim().slice(0, TOPES.aviso), read: false, createdAt: Date.now() };
      if (x.campo) d[x.campo] = x.marca || {};
      return fs.addDoc(fs.collection(db, "notifications"), d).then(function (r) { return r.id; });
    }
    function consultaAvisos(grupo, uid) {
      return fs.query(fs.collection(db, "notifications"), fs.where("userId", "==", uid), fs.where("projectId", "==", grupo));
    }
    function sinLeer(docs, campo) { return ordenados(docs, campo, true); }
    function ordenados(docs, campo, soloSinLeer) {
      return docs.map(porId).filter(function (x) { return (!campo || x[campo]) && !(soloSinLeer && x.read); })
        .sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    }
    /** Mis avisos sin leer de este grupo (los de `campo`), el último arriba. Sin sesión, []. */
    function misAvisos(grupo, campo) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo || !yo.uid) return [];
        return fs.getDocs(consultaAvisos(grupo, yo.uid)).then(function (r) { return sinLeer(r.docs, campo); });
      });
    }
    /** Los mismos, en directo (para `uid`, el de quien ha entrado) → dejar de escuchar. Si falla, []. */
    function vigilarAvisos(grupo, campo, alCambiar, uid) {
      if (!uid) { alCambiar([]); return function () {}; }
      if (!fs.onSnapshot) throw new Error("GP_SDK.retos: falta ctx.fs.onSnapshot");
      return fs.onSnapshot(consultaAvisos(grupo, uid), function (r) { alCambiar(sinLeer(r.docs, campo)); }, function () { alCambiar([]); });
    }
    function avisoLeido(id) { return fs.updateDoc(fs.doc(db, "notifications", String(id)), { read: true }); }
    /**
     * 29-oct · EL HISTORIAL: todos mis avisos de este grupo (los de `campo`), leídos o no, el último arriba, hasta `tope` (de serie 30).
     * «Entendido» solo marca el aviso como leído (nunca se borra), pero ninguna web enseñaba los leídos: en DPG1 una estudiante le dio
     * sin querer a los dos del Mentor sobre su enlace y escribió al Correo para que se los volvieran a mandar. Sin sesión, [].
     */
    function historialAvisos(grupo, campo, tope) {
      var n = Math.max(1, Math.floor(Number(tope)) || 30);
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo || !yo.uid) return [];
        return fs.getDocs(consultaAvisos(grupo, yo.uid)).then(function (r) { return ordenados(r.docs, campo, false).slice(0, n); });
      });
    }
    /** 7-oct · Para la consola del docente: los mensajes del sistema sobre su alumnado de este grupo, sin leer, el último arriba. */
    function avisosDelSistema(grupo) {
      return misAvisos(grupo, null).then(function (l) { return l.filter(paraDocente); });
    }
    /** Los mismos, en directo (para `uid`, el de quien ha entrado) → dejar de escuchar. */
    function vigilarAvisosDelSistema(grupo, alCambiar, uid) {
      return vigilarAvisos(grupo, null, function (l) { alCambiar(l.filter(paraDocente)); }, uid);
    }

    // ---------------------------------------------------------------- las reflexiones
    function guardarReflexion(grupo, reto, fichaId, txt, enlace, textos) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo || !yo.uid) throw new Error(texto(textos, "sinSesionReflexion"));
        var t = String(txt || "").trim().slice(0, TOPES.reflexion);
        if (!t) throw new Error(texto(textos, "reflexionVacia"));
        return en(REFLEX, grupo).then(function (S) {
          var ref = fs.doc(db, S.col, S.id(idReflexion(grupo, reto, fichaId))), creado = Date.now();
          return fs.getDoc(ref).then(function (a) { if (a.exists()) creado = a.data().creado || creado; }, function () {}).then(function () {
            var d = { projectId: grupo, reto: reto, fichaId: fichaId, uid: yo.uid, texto: t, creado: creado, editado: Date.now() };
            var e = String(enlace || "").trim().slice(0, TOPES.enlace);
            if (e) d.enlace = e;
            return fs.setDoc(ref, S.datos(d)).then(function () { return ref.id; });
          });
        });
      });
    }
    /** El enlace de una reflexión que ya existe, al día. Si no hay reflexión (o falla), nada. */
    function enlaceDeReflexion(grupo, reto, fichaId, enlace) {
      return en(REFLEX, grupo).then(function (S) {
        var ref = fs.doc(db, S.col, S.id(idReflexion(grupo, reto, fichaId)));
        return fs.getDoc(ref).then(function (a) {
          if (!a.exists()) return;
          // 8-oct · por `datos`: una copia del espejo lleva lo suyo, que la regla de mod_* no deja reescribir
          return fs.setDoc(ref, S.datos(Object.assign({}, a.data(), { enlace: String(enlace || "").trim().slice(0, TOPES.enlace), editado: Date.now() })));
        });
      }).catch(function () {});
    }
    /** Lo de un reto del grupo (o todo lo del grupo) en `col`, cada uno como lo daba la vieja. */
    function deGrupo(col, grupo, reto) {
      return en(col, grupo).then(function (S) {
        var q = reto ? fs.query(fs.collection(db, S.col), fs.where("projectId", "==", grupo), fs.where("reto", "==", reto))
                     : fs.query(fs.collection(db, S.col), fs.where("projectId", "==", grupo));
        return fs.getDocs(q).then(function (r) { return r.docs.map(conId(S)); });
      });
    }
    /** Todas las de un reto del grupo (o todas las del grupo), la más nueva arriba. */
    function reflexionesDe(grupo, reto) {
      return deGrupo(REFLEX, grupo, reto).then(function (l) {
        return l.sort(function (a, b) { return (b.creado || 0) - (a.creado || 0); });
      });
    }
    function misReflexiones(grupo) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo || !yo.uid) return [];
        return en(REFLEX, grupo).then(function (S) {
          return fs.getDocs(fs.query(fs.collection(db, S.col), fs.where("projectId", "==", grupo), fs.where("uid", "==", yo.uid)))
            .then(function (r) { return r.docs.map(conId(S)); });
        });
      });
    }
    /** Quitar una reflexión: primero sus comentarios (no se quedan colgando de nada), luego ella. */
    function borrarReflexion(grupo, reto, fichaId) {
      var id = idReflexion(grupo, reto, fichaId);
      return Promise.all([en(REFLEX, grupo), en(COMENT, grupo)]).then(function (SS) {
        // 8-oct · sus comentarios, en su sitio y (hasta contraer) en la vieja
        var cols = [SS[1].col].concat(SS[1].antes ? [SS[1].antes] : []);
        return cols.reduce(function (p0, col) {
          return p0.then(function () {
            return fs.getDocs(fs.query(fs.collection(db, col), fs.where("projectId", "==", grupo), fs.where("reflexion", "==", SS[0].id(id))))
              .then(function (r) {
                return r.docs.reduce(function (p, d) { return p.then(function () { return fs.deleteDoc(d.ref).catch(function () {}); }); }, Promise.resolve());
              }, function () {});
          });
        }, Promise.resolve())
          .then(function () { return borrarEnLosDos(SS[0], id); });
      });
    }

    // ---------------------------------------------------------------- los comentarios
    /** Los comentarios de un reto del grupo (o todos), del más viejo al más nuevo: una conversación se lee así. */
    function comentariosDe(grupo, reto) {
      return deGrupo(COMENT, grupo, reto).then(function (l) {
        return l.sort(function (a, b) { return (a.creado || 0) - (b.creado || 0); });
      });
    }
    function comentar(grupo, reflexionId, reto, fichaId, txt, textos) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo || !yo.uid) throw new Error(texto(textos, "sinSesionComentario"));
        var t = String(txt || "").trim().slice(0, TOPES.comentario);
        if (!t) throw new Error(texto(textos, "comentarioVacio"));
        return en(COMENT, grupo).then(function (S) {
          return fs.addDoc(fs.collection(db, S.col), S.datos({ projectId: grupo, reflexion: reflexionId, reto: reto, fichaId: fichaId, uid: yo.uid, texto: t, creado: Date.now() }));
        }).then(function (r) { return r.id; });
      });
    }
    /** Quitar un comentario por su id. `grupo` (7-oct): el suyo, para buscarlo en su sitio; sin él, en la de siempre. */
    function borrarComentario(id, grupo) {
      return en(COMENT, grupo).then(function (S) { return borrarEnLosDos(S, String(id || "")); });
    }

    return { idMision: idMision, registrar: registrar, desdeLaSesion: desdeLaSesion, anular: anular, otorgar: otorgar,
             avisar: avisar, misAvisos: misAvisos, vigilarAvisos: vigilarAvisos, avisoLeido: avisoLeido, historialAvisos: historialAvisos,
             avisosDelSistema: avisosDelSistema, vigilarAvisosDelSistema: vigilarAvisosDelSistema,
             guardarReflexion: guardarReflexion, enlaceDeReflexion: enlaceDeReflexion, reflexionesDe: reflexionesDe,
             misReflexiones: misReflexiones, borrarReflexion: borrarReflexion,
             comentariosDe: comentariosDe, comentar: comentar, borrarComentario: borrarComentario };
  }

  return { REFLEX: REFLEX, COMENT: COMENT, TOPES: TOPES, TEXTOS: TEXTOS, idReflexion: idReflexion, crear: crear,
           delSistema: delSistema, remitente: remitente, paraDocente: paraDocente };
});
// ─── fin de la pieza «retos» ───
});
var equipo = pieza(function (module, exports) {
// ─── GP_SDK pieza «equipo» (sdk/equipo.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · EL EQUIPO DOCENTE: QUIÉN LLEVA EL GRUPO, LOS REFERENTES Y SUS INVITACIONES (7-oct-2026) — pieza del SDK v1
 * (fase 5 de docs/PLAN_CENTRALIZAR.md, paso 9).
 *
 * Lo que movían las dos webs alrededor del profesorado, aquí una vez:
 *   · EL EQUIPO DE UN GRUPO lo toca el servidor, solo para su referente: añadir o cambiar de rol y quitar (`stargateEquipo`, que
 *     escribe a la vez `coTeacherEmails` —lo que mira Firestore— y `privado.docentes` —lo que mira la interfaz—), lo mismo en
 *     varios grupos de una vez (`projectIds`), cambiar a un docente por otro en un solo gesto (`stargateCambiarDocente`, con
 *     `ceder` si sale el dueño), y congelar, descongelar, dar de baja o mover a un estudiante (`stargateAlumno`).
 *   · EL CÓDIGO PARA ALISTARSE: uno nuevo, de la receta de cada web (`generar`), en `projects.joinCode`.
 *   · LOS REFERENTES DEL MOD (pueden crear grupos) y SUS INVITACIONES: el Mando crea una invitación de un solo uso (su id es la
 *     clave: 24 letras al azar, sin las que se confunden) y quien la abre con su cuenta se apunta como referente en la MISMA
 *     escritura en que la marca como usada (las reglas lo atan con getAfter). Nadie borra: quitar a un referente es
 *     `activo: false`. Cada mod tiene sus colecciones (ser referente de uno no te hace referente de otro): van en `crear`.
 *
 * Con `crear(ctx, colecciones)` (ctx = { fs, llamar, sesion }; colecciones = { referentes, invitaciones }, por defecto las de
 * STARGATE). Quién es vitalicio, el enlace de la invitación y lo que se recuerda en el navegador son de cada web.
 * 8-oct (tanda 2b de «adelantar lo de Navidad») · cada colección, por su nombre (lo de siempre) o por su SITIO
 * (`GP_SDK.sitio(vieja, null)`, sdk/sitio.js): si está en `mod_*`, el id lleva delante su mod, lo escrito lleva su `mod`, las listas
 * piden solo las de su mod (`ctx.fs.query` y `where`), lo que se cambia quita lo del espejo (`ctx.fs.deleteField`) y lo leído
 * vuelve como lo daba la vieja (su id de siempre, sin `mod` ni lo del espejo). Quien llama ve lo mismo.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPEQUIPO = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var COLECCIONES = { referentes: "stargate_referentes", invitaciones: "stargate_invitaciones" };
  var ALFABETO = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var CADUCA = 14 * 864e5;
  var TEXTOS = {
    sinSesion: "Entra con tu cuenta.",
    sinSesionCanje: "Entra con tu cuenta de Google.",
    correoMalo: "Ese correo no parece un correo.",
  };
  function texto(t, k) { return (t && t[k] != null) ? String(t[k]) : TEXTOS[k]; }
  /** n letras al azar del alfabeto (sin l, I, O, 0 ni 1). */
  function aleatorio(n) {
    var a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (x) { return ALFABETO[x % ALFABETO.length]; }).join("");
  }
  function esCorreo(c) { return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(String(c || "")); }
  function minus(c) { return String(c || "").toLowerCase(); }

  function requiere(ctx, nombres) {
    var fs = ctx && ctx.fs;
    if (!fs) throw new Error("GP_SDK.equipo: falta ctx.fs (las funciones de Firestore de la web)");
    nombres.forEach(function (n) { if (!fs[n]) throw new Error("GP_SDK.equipo: falta ctx.fs." + n); });
    return fs;
  }

  function crear(ctx, colecciones) {
    var fs = requiere(ctx, ["db", "doc", "getDoc", "getDocs", "setDoc", "updateDoc", "collection", "writeBatch"]);
    var db = fs.db;
    var C = Object.assign({}, COLECCIONES, colecciones || {});
    var sesion = ctx.sesion || function () { return Promise.resolve(null); };
    function llamar(n, d) {
      if (!ctx.llamar) return Promise.reject(new Error("GP_SDK.equipo: falta ctx.llamar"));
      return ctx.llamar(n, d);
    }
    /** Dónde está cada cosa: un nombre de colección es la de siempre, tal cual; un sitio, lo que diga. */
    function lugar(c) {
      if (c && typeof c === "object") return c;
      var mismo = function (x) { return x; };
      return { coleccion: c, nueva: false, mod: null, id: String, idViejo: String, datos: mismo, leer: mismo, cambio: mismo };
    }
    var R = lugar(C.referentes), I = lugar(C.invitaciones);
    function ref(S, id) { return fs.doc(db, S.coleccion, S.id(id)); }
    function porId(S) { return function (d) { return Object.assign({ id: S.idViejo(d.id) }, S.leer(d.data())); }; }
    /** Toda la colección: en mod_*, solo lo de su mod (lo que dejan leer las reglas). */
    function todas(S) {
      var c = fs.collection(db, S.coleccion);
      if (!S.nueva) return c;
      if (!fs.query || !fs.where) throw new Error("GP_SDK.equipo: faltan ctx.fs.query y ctx.fs.where");
      return fs.query(c, fs.where("mod", "==", S.mod));
    }

    // ---------------------------------------------------------------- el equipo de un grupo (el servidor)
    /** Añadir a alguien o cambiarle el rol (`persona` = { correo, nombre, rol }). Devuelve la persona como quedó. */
    function anadirDocente(grupo, persona) {
      return llamar("modEquipo", { projectId: grupo, persona: persona || {} }).then(function (r) { return (r && r.persona) || persona; });
    }
    function quitarDocente(grupo, correo) {
      return llamar("modEquipo", { projectId: grupo, persona: { correo: minus(correo) }, quitar: true });
    }
    /** Referente en varios grupos de una vez: dice en cuáles ha podido y en cuáles no. */
    function referenteEnTodos(persona, grupos) {
      return llamar("modEquipo", { projectIds: grupos, persona: Object.assign({}, persona, { rol: "referente" }) })
        .then(function (r) { return { hechos: (r && r.hechos) || [], fallos: (r && r.fallos) || [] }; });
    }
    /** Quien entra ocupa el sitio de quien sale (papel, alumnado, familia). Si sale el dueño, `ceder: true`. */
    function cambiarDocente(grupo, sale, entra, ceder) {
      return llamar("modCambiarDocente", { projectId: grupo, sale: minus(sale), entra: entra || {}, ceder: ceder === true });
    }
    /** Congelar, descongelar, dar de baja o mover (`extra` = { destino }) a un estudiante: solo el referente. */
    function alumno(grupo, fichaId, accion, extra) {
      return llamar("modAlumno", Object.assign({ projectId: grupo, fichaId: fichaId, accion: accion }, extra || {}));
    }
    /**
     * 8-oct · CAMBIAR DE COMANDANTE (functions/modComandante.js): el escuadrón va con él y queda asiento para la guardia.
     *   cambiarComandante(grupo, comandante)            el estudiante, él mismo (la rueda dentada), si su mod lo deja
     *   moverAComandante(grupo, fichas, comandante, { escuadronNuevo, simular })   el referente, a varios (con aviso a cada uno)
     *   deshacerComandante(grupo, lote)                 el referente devuelve un lote
     * → { ok, simulado, lote, movidos: [{ fichaId, alias, de, a }], iguales, noEstan, escuadron: { id, name, nuevo } }
     */
    function cambiarComandante(grupo, comandante) {
      return llamar("modComandante", { projectId: grupo, comandante: String(comandante || "") });
    }
    function moverAComandante(grupo, fichas, comandante, opc) {
      opc = opc || {};
      return llamar("modComandante", Object.assign({ projectId: grupo, comandante: String(comandante || ""), fichas: fichas || [],
        simular: opc.simular === true }, opc.escuadronNuevo ? { escuadronNuevo: opc.escuadronNuevo } : {}));
    }
    function deshacerComandante(grupo, lote) {
      return llamar("modComandante", { projectId: grupo, deshacer: String(lote || "") });
    }
    /** Un código nuevo para alistarse, de la receta de la web (`generar()`). */
    function nuevoCodigo(grupo, generar) {
      var c = generar();
      return fs.updateDoc(fs.doc(db, "projects", grupo), { joinCode: c }).then(function () { return c; });
    }

    // ---------------------------------------------------------------- los referentes del mod y sus invitaciones
    /** ¿Puede crear grupos? Los vitalicios (`vitalicio(correo)`, de la web) siempre; si no, su registro activo. */
    function referenteGlobal(correo, vitalicio) {
      correo = minus(correo);
      if (vitalicio && vitalicio(correo)) return Promise.resolve(true);
      return Promise.resolve().then(function () { return fs.getDoc(ref(R, correo)); })
        .then(function (d) { return d.exists() && d.data().activo === true; }, function () { return false; });
    }
    /** Solo el Mando. `enlace(token)`: la dirección de la página de canje, de la web. → { token, enlace, caduca } */
    function crearInvitacion(nombre, enlace, textos) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo) throw new Error(texto(textos, "sinSesion"));
        var t = aleatorio(24), ahora = Date.now(), caduca = ahora + CADUCA;
        return fs.setDoc(ref(I, t), I.datos({ nombre: String(nombre || "").trim().slice(0, 80), rol: "referente", creado: ahora, caduca: caduca,
          por: yo.correo, usadoPor: null, usadoCorreo: null, usadoEn: null }))
          .then(function () { return { token: t, enlace: enlace ? enlace(t) : "", caduca: caduca }; });
      });
    }
    function leerInvitacion(t) {
      return fs.getDoc(ref(I, String(t || ""))).then(function (d) { return d.exists() ? porId(I)(d) : null; });
    }
    /**
     * Canjear: quien la abre con su cuenta queda como referente. → { ok, nombre } (recién canjeada), { ok, ya, nombre } (ya era
     * suya) o { error: "no-existe" | "usada" | "caducada" }.
     */
    function canjearInvitacion(t, textos) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo) throw new Error(texto(textos, "sinSesionCanje"));
        return leerInvitacion(t).then(function (inv) {
          if (!inv) return { error: "no-existe" };
          if (inv.usadoPor) return inv.usadoPor === yo.uid ? { ok: true, ya: true, nombre: inv.nombre } : { error: "usada" };
          if (Number(inv.caduca) < Date.now()) return { error: "caducada" };
          var b = fs.writeBatch(db), ahora = Date.now();
          b.set(ref(R, yo.correo), R.datos({ correo: yo.correo, nombre: yo.nombre || inv.nombre || yo.correo, activo: true, desde: ahora,
            por: "invitacion", invitacion: t, actualizado: ahora }));
          // (en mod_*, quitando lo del espejo si era una copia: ya es del motor)
          b.update(ref(I, t), I.cambio({ usadoPor: yo.uid, usadoCorreo: yo.correo, usadoEn: ahora }, fs.deleteField));
          return b.commit().then(function () { return { ok: true, nombre: inv.nombre }; });
        });
      });
    }
    /** Solo el Mando: las invitaciones (la más nueva primero) y los referentes. */
    function invitaciones() {
      return fs.getDocs(todas(I)).then(function (r) {
        return r.docs.map(porId(I)).sort(function (a, b) { return (b.creado || 0) - (a.creado || 0); });
      });
    }
    function referentes() {
      return fs.getDocs(todas(R)).then(function (r) { return r.docs.map(porId(R)); });
    }
    /** Solo el Mando: poner o quitar (`activo`) a un referente por su correo. Conserva su `desde` y, si no se da otro, su nombre. */
    function ponerReferente(correo, activo, nombre, textos) {
      return Promise.resolve(sesion()).then(function (yo) {
        correo = String(correo || "").trim().toLowerCase();
        if (!esCorreo(correo)) throw new Error(texto(textos, "correoMalo"));
        var r = ref(R, correo);
        return fs.getDoc(r).then(function (d) {
          var x = d.exists() ? d.data() : {};
          return fs.setDoc(r, R.datos({ correo: correo, nombre: String(nombre || x.nombre || correo), activo: !!activo, desde: x.desde || Date.now(),
            por: (yo && yo.correo) || "", actualizado: Date.now() }));
        });
      });
    }

    return { colecciones: C, anadirDocente: anadirDocente, quitarDocente: quitarDocente, referenteEnTodos: referenteEnTodos,
             cambiarDocente: cambiarDocente, alumno: alumno, nuevoCodigo: nuevoCodigo,
             cambiarComandante: cambiarComandante, moverAComandante: moverAComandante, deshacerComandante: deshacerComandante,
             referenteGlobal: referenteGlobal, crearInvitacion: crearInvitacion, leerInvitacion: leerInvitacion,
             canjearInvitacion: canjearInvitacion, invitaciones: invitaciones, referentes: referentes, ponerReferente: ponerReferente };
  }

  return { COLECCIONES: COLECCIONES, ALFABETO: ALFABETO, CADUCA: CADUCA, TEXTOS: TEXTOS, aleatorio: aleatorio, esCorreo: esCorreo, crear: crear };
});
// ─── fin de la pieza «equipo» ───
});
var buzon = pieza(function (module, exports) {
// ─── GP_SDK pieza «buzon» (sdk/buzon.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · EL BUZÓN DEL MANDO: ESCRIBIR, LEER Y CONTESTAR (7-oct-2026) — pieza del SDK v1 (fase 5 de
 * docs/PLAN_CENTRALIZAR.md, paso 10).
 *
 * El buzón de dudas, problemas e ideas del profesorado (y la duda del estudiante que el asistente no sabe, `tipo: "recluta"`, la
 * palabra que piden las reglas), como lo usaba STARGATE: cada cual escribe y ve lo suyo con sus respuestas; el Mando lo ve todo
 * y contesta. Lo resuelve un asistente que trabaja desde el servidor: aquí solo se escribe y se lee.
 *
 *   🔴 Un hilo no se reescribe: contestar AÑADE una respuesta (las reglas lo comprueban, `contestaSinReescribir`). Quien
 *      escribió solo puede dejarlo «nuevo» (el Mando lo vuelve a ver) o «resuelto»; el Mando, el estado que toque, y si
 *      contesta, el aviso de respuesta nueva se enciende (`visto: false`).
 *   🔴 Las capturas, solo de nuestro almacén (firebasestorage.googleapis.com), hasta tres, como piden las reglas.
 *   · 8-oct · y SUBIRLAS, para quien escriba (Norberto: «cuando se contacta con el mando o ayuda, debes incluir la opción de
 *     adjuntar captura de pantalla»; «escribas desde donde escribas, debería ir al mismo sitio»): `comprimir(fichero)` (lado
 *     mayor ≤ 1600 px, JPEG 0,85) y `adjuntar(blob)`, que la deja en `teacher_profiles/<uid>/buzon/<ms>.jpg`: LA MISMA carpeta
 *     y el mismo formato que la app (src/lib/buzonCapturas.ts). storage.rules ya deja escribir ahí a su dueño, docente o
 *     estudiante, sin reglas nuevas; y la guardia (`buzon.cjs capturas <id>`) baja las de nuestro Storage, vengan de donde vengan.
 *   · Sin índices compuestos: se ordena aquí, lo último tocado arriba.
 *
 * Puro: `TOPES`, `TEXTOS`, `adjuntos(lista)`, `rutaCaptura(uid, ms, tipo)`; en el navegador, `comprimir(fichero)`. Con
 * `crear(ctx, coleccion)` (ctx = { fs, sesion, subir, mod }; la colección, por defecto `stargate_buzon`): `enviar(m, textos)`,
 * `mios()`, `todos()`, `responder(id, texto, opciones, textos)`, `visto(id)`, `escuchar(fn)` (lo mío, en directo: 8-oct,
 * para el Correo de DPG) y `adjuntar(blob)` (con `ctx.subir(ruta, blob)` →
 * su dirección, que pone la web con su Storage). Los textos (y cómo se llama el estudiante sin alias) y las frases para valorar
 * una respuesta son de cada web.
 * 8-oct (tanda 2c de «adelantar lo de Navidad») · la colección, por su nombre (lo de siempre) o por su SITIO
 * (`GP_SDK.sitio("stargate_buzon", null)`, sdk/sitio.js): si está en `mod_*` (el mapa la ha pasado entera), lo escrito lleva su
 * `mod`, lo que se cambia quita lo del espejo (`ctx.fs.deleteField`) y lo leído vuelve como lo daba la vieja (sin `mod` ni lo del
 * espejo). Los ids son los de siempre. Quien llama ve lo mismo.
 * 9-oct (tanda 2d) · EL BUZÓN ES DE TODOS (el mapa lo marca `comun`): cada mensaje lleva el mod DESDE EL QUE SE ESCRIBE, que da la web
 * (`ctx.mod`, o `m.mod` en un mensaje), nunca el mapa: STARGATE `stargate` (también desde la Academia), DPG `ceniza` (desde un grupo o
 * desde su formación). Lo comprueban las reglas (`buzonAltaValida`). Sin él, en el común, `enviar` no escribe (error claro).
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPBUZON = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var COLECCION = "stargate_buzon";
  var TOPES = { texto: 2000, adjuntos: 3, enlace: 1024 };
  var TEXTOS = {
    sinSesion: "Entra con tu cuenta para escribir.",
    sinMensaje: "Ese mensaje ya no existe.",
    estudiante: "Estudiante",
  };
  function texto(t, k) { return (t && t[k] != null) ? String(t[k]) : TEXTOS[k]; }
  /** Las capturas que valen: de nuestro almacén, no muy largas, hasta tres. */
  function adjuntos(lista) {
    return (lista || []).map(String).filter(function (u) { return /^https:\/\/firebasestorage\.googleapis\.com\//.test(u) && u.length <= TOPES.enlace; })
      .slice(0, TOPES.adjuntos);
  }

  /**
   * Dónde va una captura: la carpeta de quien la sube, como en la app (lo que deja storage.rules a su dueño). JPEG (la app, STARGATE)
   * o, si la web la comprime en otro formato (DPG: webp), con su extensión.
   */
  function rutaCaptura(uid, ms, tipo) {
    var u = String(uid || ""), ext = { "image/webp": "webp", "image/png": "png" }[String(tipo || "")] || "jpg";
    if (!/^[A-Za-z0-9]{1,128}$/.test(u)) throw new Error("No sé dónde guardar la captura.");
    return "teacher_profiles/" + u + "/buzon/" + Math.floor(Number(ms) || 0) + "." + ext;
  }
  /** En el navegador: una imagen → JPEG con el lado mayor ≤ 1600 px y fondo blanco (una captura de móvil, de ~3 MB a ~250 KB). */
  function comprimir(f) {
    return new Promise(function (ok, mal) {
      if (!f || !/^image\//.test(f.type || "")) { mal(new Error("Solo imágenes (una captura, una foto).")); return; }
      var im = new Image(), u = URL.createObjectURL(f);
      im.onload = function () {
        var k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(im.naturalWidth * k)); cv.height = Math.max(1, Math.round(im.naturalHeight * k));
        var cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(u);
        cv.toBlob(function (b) { if (b) ok(b); else mal(new Error("Esa imagen no se ha podido leer.")); }, "image/jpeg", 0.85);
      };
      im.onerror = function () { URL.revokeObjectURL(u); mal(new Error("Esa imagen no se ha podido leer.")); };
      im.src = u;
    });
  }

  function requiere(ctx, nombres) {
    var fs = ctx && ctx.fs;
    if (!fs) throw new Error("GP_SDK.buzon: falta ctx.fs (las funciones de Firestore de la web)");
    nombres.forEach(function (n) { if (!fs[n]) throw new Error("GP_SDK.buzon: falta ctx.fs." + n); });
    return fs;
  }

  /** Dónde está: un nombre de colección es la de siempre, tal cual; un sitio, lo que diga. */
  function lugar(c) {
    if (c && typeof c === "object") return c;
    var mismo = function (x) { return x; };
    return { coleccion: c || COLECCION, nueva: false, datos: mismo, leer: mismo, cambio: mismo };
  }

  function crear(ctx, coleccion) {
    var S = lugar(coleccion);
    var fs = requiere(ctx, ["db", "doc", "getDoc", "getDocs", "addDoc", "updateDoc", "collection", "query", "where"].concat(S.nueva ? ["deleteField"] : []));
    var db = fs.db, B = S.coleccion;
    var sesion = ctx.sesion || function () { return Promise.resolve(null); };
    function porId(d) { return Object.assign({ id: d.id }, S.leer(d.data())); }
    /** Lo que se cambia: en mod_*, quitando lo del espejo si era una copia (ya es del motor). */
    function cambio(c) { return S.nueva ? S.cambio(c, fs.deleteField) : c; }
    function recientes(r) { return r.docs.map(porId).sort(function (a, b) { return (b.actualizado || 0) - (a.actualizado || 0); }); }

    /**
     * Escribir al Mando. `m` = { tipo, texto, urgente, projectId, grupo, contexto, autoayuda, adjuntos }. La duda de un estudiante
     * (`tipo: "recluta"`) va con su alias (`contexto.alias`) y nunca urgente. → el id del mensaje.
     */
    function enviar(m, textos) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo) throw new Error(texto(textos, "sinSesion"));
        var ahora = Date.now(), est = m.tipo === "recluta";
        var d = {
          uid: yo.uid, correo: yo.correo, nombre: est ? String((m.contexto || {}).alias || texto(textos, "estudiante")) : (yo.nombre || yo.correo),
          projectId: m.projectId || "", grupo: m.grupo || "",
          tipo: m.tipo, urgente: est ? false : !!m.urgente, texto: String(m.texto || "").trim().slice(0, TOPES.texto), contexto: m.contexto || {},
          estado: "nuevo", respuestas: [], creado: ahora, actualizado: ahora, visto: true, autoayuda: m.autoayuda || [],
        };
        var adj = adjuntos(m.adjuntos);
        if (adj.length) d.adjuntos = adj;
        if (S.comun) {
          var mod = m.mod || ctx.mod;
          if (!(typeof mod === "string" && /^[a-z][a-z0-9]*$/.test(mod))) throw new Error("GP_SDK.buzon: el buzón es de todos; falta ctx.mod (el mod de la web)");
          d.mod = mod;
        }
        return fs.addDoc(fs.collection(db, B), S.datos(d)).then(function (r) { return r.id; });
      });
    }
    /** Lo mío, lo último arriba. */
    function mios() {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo) return [];
        return fs.getDocs(fs.query(fs.collection(db, B), fs.where("uid", "==", yo.uid))).then(recientes);
      });
    }
    /** Todo (solo el Mando: las reglas no dejan a nadie más). */
    function todos() { return fs.getDocs(fs.collection(db, B)).then(recientes); }
    /**
     * Contestar en un hilo. Quien escribió añade una respuesta suya (y el hilo vuelve a «nuevo», o queda «resuelto» si lo
     * dice); el Mando (`opciones.comoMando`) responde como «mando» y le pone el estado que toque. Sin texto, solo el estado.
     */
    function responder(id, txt, opciones, textos) {
      var o = opciones || {}, ref = fs.doc(db, B, id);
      return fs.getDoc(ref).then(function (d) {
        if (!d.exists()) throw new Error(texto(textos, "sinMensaje"));
        var t = String(txt || "").trim().slice(0, TOPES.texto);
        var cambios = { actualizado: Date.now() };
        if (t) cambios.respuestas = (d.data().respuestas || []).concat([{ de: o.comoMando ? "mando" : "docente", texto: t, fecha: Date.now() }]);
        if (o.comoMando) { cambios.estado = o.estado || d.data().estado; if (t) cambios.visto = false; }
        else cambios.estado = o.estado === "resuelto" ? "resuelto" : "nuevo";
        return fs.updateDoc(ref, cambio(cambios));
      }).then(function () {});
    }
    /** «Ya lo he leído»: se apaga el aviso de respuesta nueva. Si falla, no pasa nada. */
    function visto(id) {
      return Promise.resolve().then(function () { return fs.updateDoc(fs.doc(db, B, id), cambio({ visto: true })); }).then(function () {}, function () {});
    }

    /** Subir una captura (ya comprimida) → su dirección, para `enviar({ adjuntos })`. Desde cualquier página y cualquier mod. */
    var ultimoMs = 0;
    function adjuntar(blob) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo) throw new Error(texto(null, "sinSesion"));
        if (!ctx.subir) throw new Error("GP_SDK.buzon: falta ctx.subir (el Storage de la web)");
        var ms = Math.max(Date.now(), ultimoMs + 1);   // dos en el mismo milisegundo, con nombres distintos
        ultimoMs = ms;
        return ctx.subir(rutaCaptura(yo.uid, ms, blob && blob.type), blob);
      });
    }
    /**
     * 8-oct · Lo mío, EN DIRECTO (lo último tocado arriba): `fn(lista)` cada vez que cambia (una respuesta nueva, un estado). → promesa
     * de la función que deja de escuchar (sin sesión, una que no hace nada). Necesita `ctx.fs.onSnapshot`.
     */
    function escuchar(fn) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo) return function () {};
        if (!fs.onSnapshot) throw new Error("GP_SDK.buzon: falta ctx.fs.onSnapshot");
        return fs.onSnapshot(fs.query(fs.collection(db, B), fs.where("uid", "==", yo.uid)), function (r) { fn(recientes(r)); }, function () {});
      });
    }

    return { coleccion: B, enviar: enviar, mios: mios, todos: todos, responder: responder, visto: visto, adjuntar: adjuntar, escuchar: escuchar };
  }

  return { COLECCION: COLECCION, TOPES: TOPES, TEXTOS: TEXTOS, adjuntos: adjuntos, rutaCaptura: rutaCaptura, comprimir: comprimir, crear: crear };
});
// ─── fin de la pieza «buzon» ───
});
var economia = pieza(function (module, exports) {
// ─── GP_SDK pieza «economia» (sdk/economia.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · VALES, SORTEOS Y OFERTAS (7-oct-2026) — pieza del SDK v1 (fase 5 de docs/PLAN_CENTRALIZAR.md, paso 11).
 *
 * Lo que mueve créditos entre el alumnado y el grupo lo decide el servidor; el navegador solo pide. Aquí, las peticiones, con
 * la forma que esperan las funciones:
 *   · VALES (`modVale`): aprobar o rechazar un vale pedido (`purchased_vouchers`). Una sola vez, devolviendo lo pagado al
 *     rechazar y con el suceso en el libro. El mensaje para el estudiante, hasta 500 letras (lo corta el servidor).
 *   · SORTEOS (`modSortear`): sortear ya (quien manda en el grupo; en la app, el equipo docente) → { ok, ganadores,
 *     participantes, participaciones, premio }. `sorteosPendientes` (`stargateSorteosPendientes`, con el candado `sorteo` del
 *     mod): los que ya han pasado su fecha se resuelven solos al entrar cualquiera del grupo.
 *   · OFERTAS (`stargateOferta`, con su `accion`): `semana` (la automática), `comprar` ({ ofertaId }), y del referente `auto`
 *     ({ on }), `crear` ({ que, pct, dias, unidades }), `extender` ({ ofertaId, dias }), `cancelar` ({ ofertaId }) y `unidades`
 *     ({ ofertaId, unidades }). Topes y descuentos, en el servidor.
 *
 * Con `crear(ctx)` (ctx = { llamar }: no lee Firestore). Cómo se crea un sorteo (sus dos recompensas) es del paquete de cada
 * web; los textos, también.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPECONOMIA = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var ACCIONES_OFERTA = ["semana", "comprar", "auto", "crear", "extender", "cancelar", "unidades"];

  function crear(ctx) {
    function llamar(n, d) {
      if (!ctx || !ctx.llamar) return Promise.reject(new Error("GP_SDK.economia: falta ctx.llamar"));
      return ctx.llamar(n, d);
    }
    /** Aprobar (`aprobar` verdadero) o rechazar un vale, con un mensaje para quien lo pidió. */
    function resolverVale(valeId, aprobar, mensaje) {
      return llamar("modVale", { voucherId: String(valeId), decision: aprobar ? "aprobar" : "rechazar", mensaje: mensaje || "" });
    }
    /**
     * 15-oct · VARIOS VALES A LA VEZ (la cola de notas del mercado, «en bloque»): uno tras otro, para que el oro vuelva y el suceso quede en
     * el libro de cada uno por separado. → { hechos: [id…], fallos: [{ id, error }] } (no se corta si uno falla).
     */
    function resolverVales(valeIds, aprobar, mensaje) {
      var hechos = [], fallos = [];
      return (valeIds || []).reduce(function (p, id) {
        return p.then(function () {
          return resolverVale(id, aprobar, mensaje).then(function () { hechos.push(id); }, function (e) { fallos.push({ id: id, error: String((e && e.message) || e) }); });
        });
      }, Promise.resolve()).then(function () { return { hechos: hechos, fallos: fallos }; });
    }
    /** Sortear ya (`ticketId`: el documento de la participación). */
    function sortear(grupo, ticketId) { return llamar("modSortear", { projectId: grupo, ticketId: ticketId }); }
    function sorteosPendientes(grupo) { return llamar("modSorteosPendientes", { projectId: grupo }); }
    /** Una acción de ofertas (ACCIONES_OFERTA) con sus datos. */
    function oferta(grupo, accion, datos) {
      return llamar("modOferta", Object.assign({ projectId: grupo, accion: accion }, datos || {}));
    }
    return { resolverVale: resolverVale, resolverVales: resolverVales, sortear: sortear, sorteosPendientes: sorteosPendientes, oferta: oferta };
  }

  return { ACCIONES_OFERTA: ACCIONES_OFERTA, crear: crear };
});
// ─── fin de la pieza «economia» ───
});
var efigie = pieza(function (module, exports) {
// ─── GP_SDK pieza «efigie» (sdk/efigie.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · LA EFIGIE PROPIA (15-oct-2026, plan DPG1, carril A2) — pieza del SDK v1. Solo peticiones a `modEfigie`
 * (functions/modEfigie.js); quién puede, el camino de la imagen y lo que ven las reglas, en functions/modEfigieLogica.js.
 *
 *   · `estado(grupo)`: ¿puedo subir mi propio personaje? → { puede, porque: 'taller' | 'concedida' | 'compra' | null, puedeSubir, estado:
 *     'sin' | 'pendiente' | 'aprobada' | 'devuelta', subidas, max, motivo, ruta: { grande, mini, carpeta } }. Si puede, el servidor abre la
 *     subida (lo que miran las reglas de Storage); la web sube sus dos imágenes (grande y mini, cuadradas) a esas rutas.
 *   · `enviar(grupo)`: ya subidas, la manda a su docente (queda pendiente; una subida y una resubida, no más). 15-oct (noche) · en un
 *     mod sin aprobación (`aprobacion: false`), es su personaje desde ya → { ok, estado: 'aprobada', avatar }.
 *   · Del equipo docente, en bloque: `aprobar(grupo, fichas)`, `devolver(grupo, fichas, motivo)`, `conceder(grupo, ficha)` y (15-oct,
 *     noche) `anular(grupo, fichas, motivo)`: quita la que ya lleva y vuelve el personaje de antes.
 *   · `idDe(ficha)` / `esEfigie(id)`: el id de personaje de una efigie (`v_efigie_<ficha>`; funciona con cualquier lugar que pinte
 *     personajes) y `rutaDe(ficha, mini)`: dónde está su imagen en Storage.
 *   · 15-oct · LA EFIGIE DEL RETO («Forja tu efigie», T3·R2 de DPG1): `estadoDelReto(grupo)` abre su subida (sin aprobación: al
 *     registrar el reto, el servidor la pone como personaje) → { ok, reto, hecho, puedeSubir, motivo?, ruta }. Va en su propia RANURA
 *     (`RANURA_RETO`, '_r'): el id `v_efigie_<ficha>_r` (`idDe(ficha, RANURA_RETO)`) y las imágenes `grande_r.webp` y `mini_r.webp`
 *     (`rutaDe(ficha, mini, RANURA_RETO)`). `partes(id)` → { ficha, ranura } de cualquier efigie.
 * Con `crear(ctx)` (ctx = { llamar }: no lee Firestore ni Storage).
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPEFIGIE = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var PREFIJO = "v_efigie_", CARPETA = "mod_efigies/", RANURA_RETO = "_r";
  function ranura(r) { return r === RANURA_RETO ? RANURA_RETO : ""; }
  function idDe(ficha, r) { return PREFIJO + String(ficha) + ranura(r); }
  function esEfigie(id) { return /^v_efigie_[A-Za-z0-9_-]{8,40}$/.test(String(id || "")); }
  /** La ficha a la que pertenece una efigie (su id de personaje), tal cual (con la ranura, si la lleva: `partes` la separa). */
  function fichaDe(id) { return esEfigie(id) ? String(id).slice(PREFIJO.length) : null; }
  /** 15-oct · { ficha, ranura } de una efigie (las fichas son ids de Firestore, sin «_»: un final «_r» es la ranura del reto). */
  function partes(id) {
    var f = fichaDe(id);
    if (f == null) return null;
    return f.length > RANURA_RETO.length + 7 && f.slice(-RANURA_RETO.length) === RANURA_RETO ? { ficha: f.slice(0, -RANURA_RETO.length), ranura: RANURA_RETO } : { ficha: f, ranura: "" };
  }
  function rutaDe(ficha, mini, r) { return CARPETA + String(ficha) + "/" + (mini ? "mini" : "grande") + ranura(r) + ".webp"; }

  function crear(ctx) {
    function llamar(d) {
      if (!ctx || !ctx.llamar) return Promise.reject(new Error("GP_SDK.efigie: falta ctx.llamar"));
      return ctx.llamar("modEfigie", d);
    }
    return {
      estado: function (grupo) { return llamar({ projectId: grupo, accion: "estado" }); },
      estadoDelReto: function (grupo) { return llamar({ projectId: grupo, accion: "estado", para: "reto" }); },
      enviar: function (grupo) { return llamar({ projectId: grupo, accion: "enviar" }); },
      aprobar: function (grupo, fichas) { return llamar({ projectId: grupo, accion: "aprobar", fichas: fichas }); },
      devolver: function (grupo, fichas, motivo) { return llamar({ projectId: grupo, accion: "devolver", fichas: fichas, motivo: motivo || "" }); },
      conceder: function (grupo, ficha) { return llamar({ projectId: grupo, accion: "conceder", ficha: ficha }); },
      anular: function (grupo, fichas, motivo) { return llamar({ projectId: grupo, accion: "anular", fichas: fichas, motivo: motivo || "" }); },
    };
  }

  return { PREFIJO: PREFIJO, CARPETA: CARPETA, RANURA_RETO: RANURA_RETO, idDe: idDe, esEfigie: esEfigie, fichaDe: fichaDe, partes: partes, rutaDe: rutaDe, crear: crear };
});
// ─── fin de la pieza «efigie» ───
});
var mantenimiento = pieza(function (module, exports) {
// ─── GP_SDK pieza «mantenimiento» (sdk/mantenimiento.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · EL AVISO DE «ACTUALIZANDO SERVIDORES» (15-oct-2026) — pieza del SDK v1, para cualquier mod.
 *
 * Norberto: «¿No se puede cambiar temporalmente la pantalla de STARGATE cuando haya un despliegue poniendo ACTUALIZANDO
 * SERVIDORES DE LA NAVE, vuelve en 30 minutos o algo parecido?» (mensajes del buzón yMpOY2GJZq7YPpAbTajk y r5ez4xYhv43MmlgF23Wr).
 * Mientras se suben las funciones y las reglas, una página abierta puede fallar un instante («permisos», «no se pudo»). Esta
 * pieza pone encima de la web una pantalla que lo explica, y se quita sola.
 *
 *   · El estado vive en UN documento, `mod_mantenimiento/estado` = { activo: true, hasta: <ms>, minutos, desde: <ms> }. Lo escribe
 *     solo el servidor (reglas: lectura pública, escritura nunca): `scripts/mantenimiento.mjs poner|quitar`, que llama
 *     scripts/desplegar.sh al empezar y al acabar cada subida de funciones o reglas.
 *   · 🔴 Caduca sola: el aviso solo se ve mientras `activo` y `hasta` > ahora. Si un despliegue muere a medias y nadie lo quita, a la
 *     hora marcada la pantalla vuelve sola. Y quien lo ve puede pulsar «Seguir de todos modos» (se acuerda hasta cerrar la pestaña).
 *   · Se ESCUCHA (onSnapshot): un solo documento, una lectura por cambio y por persona conectada.
 *
 * Con `crear(ctx)` (ctx = { fs: { db, doc, onSnapshot }, documento? }) → { activar(opciones), vista(estado, ahora), CAMPOS, TEXTOS }.
 *   activar({ textos: { titulo, detalle }, alCambiar }) → función para dejar de escuchar. `textos.detalle` puede llevar «{min}»
 *   (minutos que faltan, redondeados hacia arriba). Los colores van en variables CSS (--gpm-fondo, --gpm-texto, --gpm-acento).
 *   `vista(estado, ahora)` → { visible, minutos } es pura (la usan las pruebas y quien quiera pintarlo a su manera).
 * Sin textos, imágenes ni colores de ningún mod: los de la web se pasan en `textos` y en las variables CSS.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPMANTENIMIENTO = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var COLECCION = "mod_mantenimiento", DOC = "estado", CLAVE_SESION = "gpm-seguir";
  var TEXTOS = {
    titulo: "Actualizando servidores",
    detalle: "Estamos mejorando la web. Vuelve en unos {min} minutos: no pierdes nada de lo que ya tienes.",
    seguir: "Seguir de todos modos",
  };
  var CAMPOS = { activo: "activo", hasta: "hasta", minutos: "minutos", desde: "desde" };

  function ms(x) {
    if (x && typeof x.toMillis === "function") return x.toMillis();
    if (x && typeof x.toDate === "function") return x.toDate().getTime();
    var n = typeof x === "number" ? x : Date.parse(x);
    return isFinite(n) ? n : 0;
  }
  /** ¿Se ve el aviso ahora, y cuántos minutos faltan (hacia arriba)? Pura. */
  function vista(estado, ahora) {
    if (!estado || estado.activo !== true) return { visible: false, minutos: 0 };
    var falta = ms(estado.hasta) - ahora;
    if (!(falta > 0)) return { visible: false, minutos: 0 };
    return { visible: true, minutos: Math.max(1, Math.ceil(falta / 60000)) };
  }

  function crear(ctx) {
    var fs = ctx && ctx.fs;
    if (!fs || !fs.db || !fs.doc || !fs.onSnapshot) throw new Error("GP_SDK.mantenimiento: falta ctx.fs (db, doc, onSnapshot)");
    var documento = ctx.documento || (typeof document !== "undefined" ? document : null);

    function seguirYa() { try { return window.sessionStorage.getItem(CLAVE_SESION) === "1"; } catch (e) { return false; } }
    function recordarSeguir() { try { window.sessionStorage.setItem(CLAVE_SESION, "1"); } catch (e) { /* sin memoria: vale igual */ } }

    function activar(opciones) {
      var o = opciones || {}, t = Object.assign({}, TEXTOS, o.textos || {});
      var estado = null, capa = null, parar = null, reloj = null, descartado = seguirYa();

      function quitar() { if (capa && capa.remove) capa.remove(); capa = null; }
      function pinta() {
        var v = vista(estado, Date.now());
        if (!v.visible || descartado || !documento) { quitar(); if (o.alCambiar) o.alCambiar(v); return; }
        if (!capa) {
          capa = documento.createElement("div");
          capa.id = "gpm-capa";
          capa.setAttribute("role", "alert");
          capa.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;height:100dvh;z-index:2147483000;display:flex;" +
            "align-items:center;justify-content:center;box-sizing:border-box;text-align:center;overflow:auto;" +
            "padding:16px max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));" +
            "background:var(--gpm-fondo,rgba(8,10,22,.97));color:var(--gpm-texto,#fff);font-family:inherit;";
          var caja = documento.createElement("div");
          caja.style.cssText = "max-width:420px;min-width:0;width:100%;";
          var h = documento.createElement("h1");
          h.style.cssText = "font-size:clamp(20px,6vw,30px);line-height:1.2;margin:0 0 12px;overflow-wrap:anywhere;color:var(--gpm-acento,#ffd166);";
          h.textContent = t.titulo;
          var p = documento.createElement("p");
          p.id = "gpm-detalle"; p.style.cssText = "font-size:16px;line-height:1.5;margin:0 0 20px;overflow-wrap:anywhere;";
          var b = documento.createElement("button");
          b.type = "button"; b.textContent = t.seguir;
          b.style.cssText = "min-height:44px;padding:8px 16px;border-radius:10px;border:1px solid currentColor;background:transparent;color:inherit;font:inherit;cursor:pointer;max-width:100%;";
          b.onclick = function () { descartado = true; recordarSeguir(); quitar(); };
          caja.appendChild(h); caja.appendChild(p); caja.appendChild(b); capa.appendChild(caja);
          (documento.body || documento.documentElement).appendChild(capa);
        }
        var d = capa.querySelector ? capa.querySelector("#gpm-detalle") : null;
        if (d) d.textContent = String(t.detalle).replace("{min}", String(v.minutos));
        if (o.alCambiar) o.alCambiar(v);
      }

      parar = fs.onSnapshot(fs.doc(fs.db, COLECCION, DOC), function (s) {
        estado = s && s.exists && s.exists() ? s.data() : null;
        pinta();
      }, function () { /* sin el documento no hay aviso: la web sigue como siempre */ });
      reloj = setInterval(pinta, 30000);   // el reloj: baja los minutos y, al llegar `hasta`, quita el aviso aunque no cambie nada
      return function () { if (typeof parar === "function") parar(); clearInterval(reloj); quitar(); };
    }
    return { activar: activar, vista: vista, CAMPOS: CAMPOS, TEXTOS: TEXTOS };
  }

  return { COLECCION: COLECCION, DOC: DOC, vista: vista, crear: crear, CAMPOS: CAMPOS, TEXTOS: TEXTOS };
});
// ─── fin de la pieza «mantenimiento» ───
});
var registro = pieza(function (module, exports) {
// ─── GP_SDK pieza «registro» (sdk/registro.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · EL REGISTRO DE FALLOS DE INFRAESTRUCTURA (15-oct-2026) — pieza del SDK v1, para cualquier mod.
 *
 * PER 16450 (STARGATE) tuvo el 15-oct un error de permisos en la llamada a filas y estudiantes con error de acceso, y no quedó rastro
 * (Firestore no registra las denegaciones de las reglas). Norberto: «saber de un fallo en directo a los minutos, sin depender de que
 * la docente escriba». Esta pieza APUNTA en la web los fallos que son del sistema y los manda a la función `modErrores`
 * (functions/modErrores.js → `mod_errores`); scripts/vigilar-errores.mjs los lee cada 5 minutos y avisa por correo, sin gastar tokens.
 * (GP_SDK.errores ya es otra cosa —los códigos de las llamadas—: esta pieza se llama `registro`.)
 *
 *   · SOLO lo de infraestructura: permission-denied, unavailable, resource-exhausted, unauthenticated, deadline-exceeded y
 *     failed-precondition (de Firestore o de una función), y `red` (una llamada a función que no llega: sin desplegar, sin red, caída
 *     sin texto). Un «no» de nuestra función (con su texto), un fallo de la página o cualquier otra cosa: no se apunta.
 *   · SIN DATOS PERSONALES: sale el código, la pantalla, el grupo (projectId), el navegador resumido (familia y versión mayor) y la
 *     versión del SDK. NUNCA el texto del error (ni se lee), ni correo, ni uid: la cuenta, si la hay, la pone Firebase en la propia
 *     llamada y el servidor solo la usa para el tope por hora, sin guardarla.
 *   · TOPES en cada pestaña: 5 al minuto y 30 por sesión (lo que pase de ahí se descarta). Los repetidos (mismo código y pantalla) se
 *     agrupan en un solo envío con su cuenta `n`. Se manda a los 5 s del primero, de una vez.
 *   · Nunca estorba: si el envío falla, se descarta en silencio (un registro que da errores sería un círculo) y nada se lanza.
 *
 * Con `crear(ctx)` (ctx = { llamar, sesion, ventana?, sdk? }; `sesion` no se usa: la cuenta no se manda) → { instalar, apuntar, pendientes }.
 *   instalar({ grupo, pantalla })   escucha window «error» y «unhandledrejection» (una sola vez) → función que lo desinstala.
 *                                   `grupo` y `pantalla` pueden ser un texto o una función (el grupo se sabe al entrar).
 *   apuntar(err, contexto)          para las piezas (el onError de asistencia.vigilar, abrir, cerrar…): contexto = { pantalla } o texto.
 *                                   → true si lo ha apuntado, false si no es de infraestructura o ha pasado el tope.
 * Puro y suelto: `clasificar(err)` → código o '', `navegadorDe(ua)` → { familia, mayor }, `TOPES`, `CODIGOS`.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPREGISTRO = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  /** Los códigos que se apuntan (los mismos que acepta el servidor: ERRORES.codigos en functions/mods/index.js) y los topes de cada pestaña. */
  var CODIGOS = ["permission-denied", "unavailable", "resource-exhausted", "unauthenticated", "deadline-exceeded", "failed-precondition", "red"];
  var TOPES = { alMinuto: 5, porSesion: 30, esperaMs: 5000, porEnvio: 10 };
  var SIN_CONTESTAR = ["not-found", "unimplemented", "internal", "unknown"];

  /** «functions/not-found» → «not-found». */
  function codigoDe(e) { return String((e && e.code) || "").replace(/^[a-z-]+\//, ""); }
  /** ¿El texto del error lo escribió NUESTRA función? (el cliente de Firebase pone de mensaje el propio código si no llegó a contestar) */
  function delServidor(e, c) {
    var m = String((e && e.message) || "");
    return m !== "" && m !== c && m !== String(c).toUpperCase().replace(/-/g, "_");
  }
  /**
   * El código de infraestructura de un error, o "" si no lo es. No lee NUNCA el mensaje salvo para saber si lo escribió nuestra función
   * (y no lo guarda). Acepta un evento de «unhandledrejection» (su `reason`) y uno de «error» (su `error`).
   */
  function clasificar(err) {
    var e = err && err.reason !== undefined && !err.code ? err.reason : err && err.error !== undefined && !err.code ? err.error : err;
    if (!e || typeof e !== "object") return "";
    var c = codigoDe(e), deFunciones = /^functions\//.test(String(e.code || ""));
    if (deFunciones && SIN_CONTESTAR.indexOf(c) >= 0 && !delServidor(e, c)) return "red";   // la función no ha contestado
    // un «no» de nuestra función, con su texto (permisos de la clase, cupo, estado del grupo…), es una decisión de la web, no un fallo del sistema;
    // solo cuenta la sesión perdida (unauthenticated): la docente lo vive como «error de acceso»
    if (deFunciones && delServidor(e, c) && c !== "unauthenticated") return "";
    return CODIGOS.indexOf(c) >= 0 && c !== "red" ? c : "";
  }

  /** La familia del navegador y su versión mayor, del User-Agent (nada más). */
  function navegadorDe(ua) {
    var s = String(ua || ""), m;
    var casos = [[/Edg(?:e|A|iOS)?\/(\d+)/, "Edge"], [/OPR\/(\d+)/, "Opera"], [/SamsungBrowser\/(\d+)/, "Samsung"],
      [/(?:Firefox|FxiOS)\/(\d+)/, "Firefox"], [/(?:Chrome|CriOS)\/(\d+)/, "Chrome"], [/Version\/(\d+)[\d.]*.*Safari/, "Safari"]];
    for (var i = 0; i < casos.length; i++) { m = casos[i][0].exec(s); if (m) return { familia: casos[i][1], mayor: parseInt(m[1], 10) || 0 }; }
    return { familia: "otro", mayor: 0 };
  }

  function crear(ctx) {
    if (!ctx || typeof ctx.llamar !== "function") throw new Error("GP_SDK.registro: falta ctx.llamar");
    var llamar = ctx.llamar, sdk = ctx.sdk || "v1";
    var ventana = ctx.ventana || (typeof window !== "undefined" ? window : null);
    var cfg = { grupo: "", pantalla: "otra" };
    var marcas = [], totalSesion = 0, cola = {}, temporizador = null, instalado = null;

    function valor(x) { try { return typeof x === "function" ? x() : x; } catch (e) { return ""; } }
    function agenda() { if (!temporizador) temporizador = setTimeout(enviar, TOPES.esperaMs); }

    /** Manda lo apuntado, de una vez. Si no hay grupo todavía (sin entrar), se queda para la próxima. */
    function enviar() {
      temporizador = null;
      var grupo = String(valor(cfg.grupo) || "");
      var claves = Object.keys(cola);
      if (!claves.length) return;
      if (!grupo) { agenda(); return; }
      var eventos = claves.slice(0, TOPES.porEnvio).map(function (k) { var x = cola[k]; delete cola[k]; return x; });
      if (Object.keys(cola).length) agenda();
      var ua = ventana && ventana.navigator ? ventana.navigator.userAgent : (typeof navigator !== "undefined" ? navigator.userAgent : "");
      try {
        Promise.resolve(llamar("modErrores", { grupo: grupo, navegador: navegadorDe(ua), sdk: sdk, eventos: eventos })).catch(function () { /* se descarta */ });
      } catch (e) { /* se descarta */ }
    }

    function apuntar(err, contexto) {
      try {
        var codigo = clasificar(err);
        if (!codigo) return false;
        var ahora = Date.now();
        marcas = marcas.filter(function (t) { return ahora - t < 60000; });
        if (marcas.length >= TOPES.alMinuto || totalSesion >= TOPES.porSesion) return false;
        marcas.push(ahora); totalSesion++;
        var pantalla = String((contexto && contexto.pantalla) || (typeof contexto === "string" ? contexto : "") || valor(cfg.pantalla) || "otra");
        var k = codigo + "|" + pantalla;
        if (cola[k]) cola[k].n++; else cola[k] = { codigo: codigo, pantalla: pantalla, n: 1 };
        agenda();
        return true;
      } catch (e) { return false; }
    }

    function instalar(o) {
      if (instalado) return instalado;
      var op = o || {};
      cfg.grupo = op.grupo || ""; cfg.pantalla = op.pantalla || "otra";
      var alError = function (ev) { apuntar(ev); };
      var alRechazo = function (ev) { apuntar(ev); };
      if (ventana && ventana.addEventListener) {
        ventana.addEventListener("error", alError);
        ventana.addEventListener("unhandledrejection", alRechazo);
      }
      instalado = function () {
        if (ventana && ventana.removeEventListener) { ventana.removeEventListener("error", alError); ventana.removeEventListener("unhandledrejection", alRechazo); }
        if (temporizador) { clearTimeout(temporizador); temporizador = null; }
        instalado = null;
      };
      return instalado;
    }
    return { instalar: instalar, apuntar: apuntar, pendientes: function () { return Object.keys(cola).length; } };
  }

  return { crear: crear, clasificar: clasificar, navegadorDe: navegadorDe, CODIGOS: CODIGOS, TOPES: TOPES };
});
// ─── fin de la pieza «registro» ───
});
var sitio = pieza(function (module, exports) {
// ─── GP_SDK pieza «sitio» (sdk/sitio.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · ¿DÓNDE VAN LOS DATOS DE ESTE GRUPO? (7-oct-2026) — pieza del SDK v1 (paso V4 del §1d de
 * docs/PLAN_CENTRALIZAR.md: «cada grupo nuevo nace en la versión definitiva»).
 *
 * Un grupo de la versión definitiva (`modVersion` ≥ 2 en su proyecto, que solo pone el servidor) tiene lo suyo en las
 * colecciones `mod_*`; los de siempre, en las de siempre (`stargate_*`, `ceniza_*`), salvo en las que el mapa ya ha pasado
 * para su mod (`pasadaPara`, 8-oct): ahí, todos los grupos de ese mod, en `mod_*`. El servidor lo decide en
 * functions/modColeccion.js (`faseDe`) y las reglas lo exigen (firestore.rules → «los grupos de la versión definitiva»). La web
 * lo decide AQUÍ, con el MISMO mapa y las mismas novedades: el paquete los trae de functions/mods/colecciones.js y
 * functions/mods/versiones.js (scripts/build-sdk.mjs → datosDelSitio), y tests/sdk/sitio.test.ts compara esta decisión con la
 * del servidor caso a caso. Así cada web pasa `sitio(…)` donde antes escribía el nombre de la colección.
 *
 *   var sitio = GP_SDK.sitio;                       // (en Node: require('sdk/sitio.js').crear(datos))
 *   var s = sitio('stargate_alias', proyecto);      // proyecto: los datos de projects/{grupo} (o null: lo suelto)
 *   s.coleccion        'stargate_alias' o 'mod_alias'
 *   s.nueva            true si es la mod_*
 *   s.id(idViejo)      el id del documento (lo suelto en mod_* lleva delante su mod; lo de un grupo, el mismo)
 *   s.idViejo(id)      8-oct (tanda 2b) · al revés: el id de siempre de un documento leído (sin su mod delante)
 *   s.datos(d)         lo que se escribe: en mod_*, con el `mod` del grupo (si no lo traía); en la vieja, tal cual (el mismo objeto)
 *   s.mod              el `mod` que llevan los datos en mod_* (null en la vieja)
 *   s.leer(d)          8-oct · lo leído, como lo daba la vieja (en mod_*, sin `mod` ni lo del espejo)
 *   s.cambio(d, borrar)  8-oct (tanda 2b) · lo que se cambia (`update`): en mod_*, quitando lo del espejo (`borrar` = deleteField de
 *                      la web), como `c.cambio` del servidor: el documento ya es del motor y `migrar.mjs` no lo toma por una copia
 *   s.fusion(d, borrar)  lo que se mezcla (`set(…, { merge: true })`): `datos` y `cambio` a la vez
 *   s.antes            8-oct · la vieja, si lo de este grupo pudo quedarse también allí (pasada para su mod, hasta contraer): lo
 *                      que se borra, se borra en las dos; null en lo demás
 *   sitio(vieja, null) lo suelto (sin grupo): en mod_* si el mapa la ha pasado entera (8-oct, tanda 2b: `pasadaPara` con su mod)
 *   s.comun            9-oct (tanda 2d) · true en la de todos los mods (el buzón): `s.mod` es null y `s.datos` exige el `mod` de
 *                      quien escribe (el de su web), nunca el de la colección vieja
 *   sitio.modDe(proyecto)              el mod del grupo (la detección del servidor: modWebDe) o null
 *   sitio.version(proyecto)            su versión (1 sin marca o si no es de un mod)
 *   sitio.tiene(proyecto, novedad)     ¿tiene esa novedad? (modVersionTiene); una novedad que no existe, error
 *
 * Las subcolecciones (jugadores, eventos, r) cuelgan del documento que da `s`, con sus ids de siempre y sin `mod`.
 * Sin Firebase, sin textos y sin nombres de mod escritos: todo sale de los datos del paquete.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPSITIO = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var propio = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  /** Lo que añade el espejo (functions/modEspejoLogica.js → CAMPOS_DEL_ESPEJO). */
  var ESPEJO = ['espejoDe', 'espejoHora'];

  function crear(datos) {
    var mapa = (datos && datos.mapa) || {}, novedades = (datos && datos.novedades) || {}, mods = (datos && datos.mods) || [];
    var todas = [];
    Object.keys(novedades).forEach(function (k) { todas = todas.concat(novedades[k]); });

    function conVersion(p, mod) { return !!(p[mod] && p[mod].version); }
    /** El mod del grupo: los que se reconocen por su bloque, primero; los demás, por `mod` y su bloque (como modWebDe). */
    function modDe(p) {
      if (!p) return null;
      for (var i = 0; i < mods.length; i++) if (mods[i].reconocer === 'bloque' && conVersion(p, mods[i].mod)) return mods[i].mod;
      var m = p.mod;
      for (var j = 0; j < mods.length; j++) {
        if (typeof m === 'string' && mods[j].mod === m && mods[j].reconocer !== 'bloque' && conVersion(p, m)) return m;
      }
      return null;
    }
    function versionDe(p) {
      var v = p ? p.modVersion : undefined;
      return typeof v === 'number' && isFinite(v) && Math.floor(v) === v && v >= 1 ? v : 1;
    }
    function version(p) { return modDe(p) ? versionDe(p) : 1; }
    function tiene(p, novedad) {
      if (todas.indexOf(novedad) < 0) throw new Error('«' + novedad + '» no es una novedad de ninguna versión.');
      var v = version(p);
      return Object.keys(novedades).some(function (k) { return Number(k) <= v && novedades[k].indexOf(novedad) >= 0; });
    }

    function sitio(vieja, proyecto) {
      if (!propio(mapa, vieja)) throw new Error('«' + vieja + '» no está en el mapa de colecciones.');
      var e = mapa[vieja], grupo = proyecto || null;
      // 8-oct · o el mapa la ha pasado para el mod del grupo (`pasadaPara`), sea de la versión que sea (como faseDe)
      // 8-oct (tanda 2b) · o es una suelta que el mapa ha pasado entera (`pasadaPara` con su propio mod: `pasadaEntera`), de su mod
      // 9-oct (tanda 2d) · o es común, de todos los mods (el buzón: `comun`): entera, y cada documento con el mod desde el que se escribe
      var comun = !e.porGrupo && e.comun === true;
      var entera = comun || !!(!e.porGrupo && e.pasadaPara && e.pasadaPara.indexOf(e.mod) >= 0);
      var pasada = entera || !!(grupo && e.porGrupo && e.pasadaPara && e.pasadaPara.indexOf(modDe(grupo)) >= 0);
      var nueva = e.fase === 'nueva' || pasada || !!(grupo && e.porGrupo && tiene(grupo, 'coleccionesMod'));
      var mod = nueva && !comun ? ((!entera && grupo && modDe(grupo)) || e.mod) : null;
      // 8-oct · lo de antes de pasar sigue también en la vieja (el espejo lo copió) hasta contraer: lo que se BORRA, en los dos
      var antes = pasada && e.fase !== 'nueva' ? vieja : null;
      var s = {
        vieja: vieja, coleccion: nueva ? e.nueva : vieja, nueva: nueva, mod: mod, antes: antes, comun: comun,
        id: function (id) { return nueva && e.ids === 'suelto' ? e.mod + '__' + id : String(id); },
        // 8-oct (tanda 2b) · y al revés: el id de siempre de un documento leído (en mod_* y suelto, sin su mod delante)
        idViejo: function (id) {
          var p = e.mod + '__';
          return nueva && e.ids === 'suelto' && String(id).indexOf(p) === 0 ? String(id).slice(p.length) : String(id);
        },
        // en mod_*, con su `mod` y sin lo del espejo (`espejoDe`, `espejoHora`: lo que se reescribe a partir de una copia)
        datos: function (d) {
          if (!nueva) return d;
          var x = {};
          for (var k in d) if (propio(d, k) && ESPEJO.indexOf(k) < 0) x[k] = d[k];
          if (!(typeof x.mod === 'string' && x.mod)) {
            // 9-oct (tanda 2d) · en la común no hay uno por defecto: el de la colección vieja no dice desde dónde se escribe
            if (comun) throw new Error('«' + vieja + '» es de todos los mods: di desde cuál se escribe (`mod`).');
            x.mod = mod;
          }
          return x;
        },
        // 8-oct (tanda 2b) · lo que se cambia o se mezcla encima de lo que pudo copiar el espejo: sin lo del espejo (como el servidor)
        cambio: function (d, borrar) {
          if (!nueva) return d;
          if (typeof borrar !== 'function') throw new Error('sitio.cambio: falta borrar (deleteField de la web)');
          var x = {};
          for (var k in d) if (propio(d, k)) x[k] = d[k];
          ESPEJO.forEach(function (c) { x[c] = borrar(); });
          return x;
        },
        fusion: function (d, borrar) { return nueva ? s.cambio(s.datos(d), borrar) : d; },
        // 8-oct · lo leído, como lo daba la vieja: en mod_*, sin el `mod` y sin lo del espejo (como comoLaVieja del servidor)
        leer: function (d) {
          if (!nueva || !d) return d;
          var x = {};
          for (var k in d) if (propio(d, k) && k !== 'mod' && ESPEJO.indexOf(k) < 0) x[k] = d[k];
          return x;
        },
      };
      return s;
    }
    sitio.modDe = modDe;
    sitio.version = version;
    sitio.tiene = tiene;
    return sitio;
  }

  return { crear: crear };
});
// ─── fin de la pieza «sitio» ───
});
var conectar = pieza(function (module, exports) {
// ─── GP_SDK pieza «conectar» (sdk/conectar.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · CONECTAR: FIREBASE, LA ENTRADA CON GOOGLE Y EL CANDADO DEL EMULADOR (7-oct-2026) — pieza del SDK v1 (fase 5 de
 * docs/PLAN_CENTRALIZAR.md, §2d: «conectar({mod, firebase})»).
 *
 * Las dos centralitas (STARGATE y DPG, `assets/js/motor.js`) abrían Firebase igual, cada una con su copia: la app, Auth,
 * Firestore y Functions; el selector de cuentas de Google SIEMPRE (`prompt: select_account`: quien tiene dos cuentas, la de
 * docente y la de alumno, acababa dentro con la equivocada sin saberlo); y el laboratorio, que conecta los tres emuladores. Aquí,
 * una vez. El SDK no importa Firebase ni lleva claves: la web le pasa sus funciones (`firebase`), las de verdad o las del simulador.
 *
 *   var web = GP_SDK.conectar({
 *     mod: "stargate",                  // el mod: de aquí sale el proyecto del emulador, `demo-<mod>`
 *     firebase: { initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut,
 *                 getFirestore, getFunctions, connectAuthEmulator, connectFirestoreEmulator, connectFunctionsEmulator,
 *                 signInAnonymously, terminate },   // (la 1.ª, solo si la web deja entrar sin cuenta; la 2.ª, con cerrarAlSalir)
 *     config: window.SG_FIREBASE,       // la configuración de producción
 *     emu: window.SG_EMU === true,      // la página PIDE el laboratorio (el candado de abajo decide si se le hace caso)
 *   });
 *   → { mod, EMU, proyecto, app, auth, db, fns, google, entrar(), entrarInvitado()?, entrarComo(correo, nombre), salir() }
 *
 * 🔴 EL CANDADO DEL EMULADOR. Se conectan los emuladores (y se deja la configuración de verdad) solo si valen los TRES a la vez:
 *   1. la página se sirve desde 127.0.0.1 o localhost (`host`; por defecto, `location.hostname`);
 *   2. la web lo pide (`emu: true`);
 *   3. el proyecto se llama `demo-<mod>` (o `demo-<mod>-<algo>`, para varios laboratorios a la vez): Firebase garantiza que un id
 *      que empieza por «demo-» NUNCA habla con servicios reales. Si el proyecto pedido (`puertos.proyecto`) no cuadra, el SDK LANZA
 *      un error: antes de que la petición pudiera caer en el de verdad.
 *   Si falta el 1 o el 2, la página no está en el laboratorio: `EMU` es false y se usa `config` (si no hay y la web la exige con
 *   `exigirConfig`, error con `textos.sinConfig`).
 *
 * Opciones (cada una existe porque las dos webs de hoy hacían algo distinto a propósito):
 *   · `puertos`          { auth, firestore, functions, proyecto } de los emuladores. Por defecto, los estándar de Firebase
 *                        (9099, 8080, 5001) y `demo-<mod>`. DPG usa otros (9109, 8180, 5101) para no chocar con STARGATE.
 *   · `region`           la región de Functions (DPG: "us-central1"); sin ella, `getFunctions(app)` como STARGATE.
 *   · `conservarConfig`  en el laboratorio, mezcla `config` con lo demo (STARGATE); si no, solo lo demo (DPG).
 *   · `exigirConfig`     fuera del laboratorio, sin `config` es un error (DPG); si no, se sigue con `{}` (STARGATE).
 *   · `cerrarAlSalir`    en el laboratorio, cierra el cliente de Firestore al salir de la página (`pagehide`; DPG: el emulador
 *                        solo aguanta 6 conexiones HTTP/1.1 por servidor). Pide `firebase.terminate` y `ventana` (por defecto,
 *                        `window`).
 *   · `textos`           { sinConfig, soloLaboratorio } para decir lo mismo que decía cada web.
 * La escucha de la sesión (`onAuthStateChanged`) y lo que se recuerda al salir (localStorage) son de cada web: la sesión de
 * STARGATE no tiene invitados y la de DPG sí. `auth` va en el resultado para que cada una enganche la suya.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPCONECTAR = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var LOCAL = /^(127\.0\.0\.1|localhost)$/;
  var PUERTOS = { auth: 9099, firestore: 8080, functions: 5001 };
  var TEXTOS = {
    sinConfig: "GP_SDK.conectar: fuera del laboratorio hace falta la configuración de Firebase (`config`)",
    soloLaboratorio: "solo en el laboratorio",
  };

  function requiere(fb, nombres) {
    if (!fb) throw new Error("GP_SDK.conectar: falta `firebase` (las funciones de Firebase de la web)");
    nombres.forEach(function (n) { if (!fb[n]) throw new Error("GP_SDK.conectar: falta firebase." + n); });
    return fb;
  }
  /** El proyecto del emulador de ese mod: `demo-<mod>` o `demo-<mod>-<algo>`. */
  function proyectoValido(mod, proyecto) {
    var p = String(proyecto || ""), base = "demo-" + mod;
    return p === base || (p.indexOf(base + "-") === 0 && p.length > base.length + 1 && /^[a-z0-9-]+$/.test(p));
  }

  function conectar(o) {
    o = o || {};
    var mod = String(o.mod || "");
    if (!/^[a-z][a-z0-9]*$/.test(mod)) throw new Error("GP_SDK.conectar: falta `mod` (por ejemplo «stargate»)");
    var fb = requiere(o.firebase, ["initializeApp", "getAuth", "GoogleAuthProvider", "signInWithPopup", "signInWithCredential",
      "signOut", "getFirestore", "getFunctions", "connectAuthEmulator", "connectFirestoreEmulator", "connectFunctionsEmulator"]);
    var textos = Object.assign({}, TEXTOS, o.textos || {});
    var host = o.host != null ? String(o.host) : (typeof location !== "undefined" && location ? String(location.hostname || "") : "");

    // los tres cerrojos: en un sitio que no es de pruebas el laboratorio no existe
    var EMU = o.emu === true && LOCAL.test(host);
    var puertos = Object.assign({}, PUERTOS, { proyecto: "demo-" + mod }, o.puertos || {});
    if (EMU && !proyectoValido(mod, puertos.proyecto)) {
      throw new Error("GP_SDK.conectar: en el laboratorio el proyecto tiene que llamarse demo-" + mod + " (o demo-" + mod +
        "-algo), y no «" + puertos.proyecto + "»: solo un id «demo-…» garantiza que no se habla con servicios reales");
    }
    if (!EMU && o.exigirConfig === true && !o.config) throw new Error(textos.sinConfig);

    var cfg = EMU
      ? Object.assign({}, o.conservarConfig === true ? (o.config || {}) : {},
        { projectId: puertos.proyecto, apiKey: "demo-api-key", authDomain: puertos.proyecto + ".firebaseapp.com" })
      : (o.config || {});
    var app = fb.initializeApp(cfg);
    var auth = fb.getAuth(app);
    var db = fb.getFirestore(app);
    var fns = o.region ? fb.getFunctions(app, o.region) : fb.getFunctions(app);
    var google = new fb.GoogleAuthProvider();
    // 🔴 El selector de cuentas SIEMPRE: sin esto Google entra en silencio con la última cuenta usada.
    google.setCustomParameters({ prompt: "select_account" });
    if (EMU) {
      fb.connectAuthEmulator(auth, "http://127.0.0.1:" + puertos.auth, { disableWarnings: true });
      fb.connectFirestoreEmulator(db, "127.0.0.1", puertos.firestore);
      fb.connectFunctionsEmulator(fns, "127.0.0.1", puertos.functions);
      if (o.cerrarAlSalir === true) {
        if (!fb.terminate) throw new Error("GP_SDK.conectar: `cerrarAlSalir` pide firebase.terminate");
        var ventana = o.ventana || (typeof window !== "undefined" ? window : null);
        if (!ventana) throw new Error("GP_SDK.conectar: `cerrarAlSalir` pide `ventana`");
        ventana.addEventListener("pagehide", function () { fb.terminate(db).catch(function () {}); });
      }
    }

    var web = {
      mod: mod, EMU: EMU, proyecto: cfg.projectId, app: app, auth: auth, db: db, fns: fns, google: google,
      /** La ventana de Google, con el selector de cuentas. Si se cierra o se cancela, lanza el error de Firebase tal cual. */
      entrar: async function () { var r = await fb.signInWithPopup(auth, google); return r.user; },
      /**
       * Entrar como alguien, SIN ventana de Google: solo existe en el laboratorio. El emulador de Auth acepta un «token de
       * Google» que es un JSON sin firmar; en producción esto sería imposible. No hay contraseña ni cuenta real.
       */
      entrarComo: async function (correo, nombre) {
        if (!EMU) throw new Error(textos.soloLaboratorio);
        var sub = "emu-" + String(correo).toLowerCase().replace(/[^a-z0-9]/g, "");
        var cred = fb.GoogleAuthProvider.credential(JSON.stringify({ sub: sub, email: correo, email_verified: true, name: nombre || correo }));
        var r = await fb.signInWithCredential(auth, cred);
        return r.user;
      },
      /** Cierra la sesión de Firebase. Lo que la web recuerda (localStorage) lo borra ella antes. */
      salir: async function () { await fb.signOut(auth); },
    };
    // sin cuenta (Firebase anónimo): solo si la web lo trae
    if (fb.signInAnonymously) web.entrarInvitado = async function () { var r = await fb.signInAnonymously(auth); return r.user; };
    return web;
  }

  return { conectar: conectar, proyectoValido: proyectoValido, LOCAL: LOCAL, PUERTOS: PUERTOS, TEXTOS: TEXTOS };
});
// ─── fin de la pieza «conectar» ───
});
var grupos = pieza(function (module, exports) {
// ─── GP_SDK pieza «grupos» (sdk/grupos.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · MIS GRUPOS: LOS GRUPOS DE UN MOD EN LOS QUE FIGURO COMO DOCENTE (7-oct-2026) — pieza del SDK v1 (fase 5 de
 * docs/PLAN_CENTRALIZAR.md, §2d: «`misGrupos()`, filtrados por `modDe`»).
 *
 * `misPERs` (STARGATE) y `misGrupos` (DPG) hacían lo mismo con dos copias: los proyectos donde mi correo está en
 * `coTeacherEmails` (lo que mira Firestore para dejarme entrar), solo los del mod de la web, en orden (en marcha, por empezar, sin
 * fecha, pasados), con el equipo docente de cada uno (`privado/stargate.docentes`, que las reglas solo dan al equipo), si soy
 * referente, cómo me llamo en ese grupo y cuánta gente hay. Aquí, una vez:
 *
 *   var g = GP_SDK.grupos.crear(ctx, o);   // ctx = { fs, sesion }; o = las opciones de abajo
 *   var mios = await g.misGrupos(correo, opc);
 *   → [{ id, nombre, codigo, ownerId, teacherId, <mod>: bloque del mod del proyecto, …estado(), …extra(),
 *        soyReferente, equipo: [{ nombre, correo, rol }], miNombre, reclutas, cola? }]
 *
 * El filtro es `modDe` (GP_SDK.sitio.modDe: la detección del servidor, `modWebDe`): el grupo es de ESTE mod. Un proyecto de la app
 * (el de Elisabet), o de otro mod, no sale. Lo que decide cada web se lo pasa por opción:
 *   · `mod`, `modDe`      obligatorios. `mod` da también la clave del bloque (`x.stargate`, `x.ceniza`).
 *   · `estado(x)`         → { semana, estado, total, … }: cuándo está cada grupo. Cada web tiene su calendario (STARGATE: la gracia
 *                         y la recuperación; DPG: las semanas del grupo), y se queda en la web. El orden de la lista sale de aquí.
 *   · `filtro(x, opc)`    → false para dejar fuera un grupo que no es una clase (la Academia, la Escuela de Mentores…).
 *   · `extra(d)`          → campos de la web (STARGATE: `factions`; DPG: `mod`, `prueba`), `d` = datos del proyecto.
 *   · `esVitalicio(correo)`   la lista de personas que mandan en todo, de la web (por ahora; ver «miPapel»).
 *   · `duenoEsReferente`  (DPG) también es referente quien creó el grupo (`ownerId`/`teacherId` = la sesión).
 *   · `fantasmas`         (STARGATE) `reclutas` no cuenta las fichas del equipo docente jugando como recluta (`fantasma`).
 *   · `cola`              (STARGATE) `cola`: las subidas de nota que esperan (`purchased_vouchers` en `pending`).
 *   · `privado`           el documento de `projects/{id}/privado/` con el equipo (por defecto «stargate», compartido de hecho).
 * 🔴 Ante un fallo al leer el equipo se asume que NO eres referente (equivocarse hacia dar menos permisos deja sin un botón; al
 * revés, deja crear grupos que no tocan) y `equipo` queda en []. Un fallo al contar deja `reclutas` en null: «sin dato» es
 * mejor que un cero que parece verdad.
 * Lo que la web hace con la lista (la marca de docente en localStorage, «Crear grupo», anotar la conexión) es de la web.
 *
 * 10-oct (noche) · `todos(modGrupo)` → [{ id, datos }]: TODOS los grupos de un mod (profesores.html, la consola del Mando y de los
 * vitalicios). Las reglas ya no dejan listar `projects` entero (solo al dueño): se listan las tarjetas de ese mod
 * (`mod_grupos`, `where('modGrupo', '==', …)`: el Mando y los vitalicios de ESE mod) y se abre cada grupo por su id (eso sí lo
 * pueden). Si alguno no se deja abrir, va su tarjeta.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPGRUPOS = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var ORDEN = { "en marcha": 0, "por empezar": 1, "sin fecha": 2, "pasado": 3 };

  function requiere(ctx, nombres) {
    var fs = ctx && ctx.fs;
    if (!fs) throw new Error("GP_SDK.grupos: falta ctx.fs (las funciones de Firestore de la web)");
    nombres.forEach(function (n) { if (!fs[n]) throw new Error("GP_SDK.grupos: falta ctx.fs." + n); });
    return fs;
  }
  /** Lo que falle se queda en null (una promesa que falla o una función que lanza). */
  function aNull(hacer) {
    try { return Promise.resolve(hacer()).catch(function () { return null; }); } catch (e) { return Promise.resolve(null); }
  }

  function crear(ctx, o) {
    o = o || {};
    var mod = String(o.mod || "");
    if (!mod) throw new Error("GP_SDK.grupos: falta `mod`");
    if (typeof o.modDe !== "function") throw new Error("GP_SDK.grupos: falta `modDe` (GP_SDK.sitio.modDe)");
    var fs = requiere(ctx, ["db", "doc", "getDoc", "getDocs", "collection", "query", "where", "getCountFromServer"]);
    var db = fs.db, privado = o.privado || "stargate";
    var esVitalicio = o.esVitalicio || function () { return false; };
    var sesion = ctx.sesion || function () { return Promise.resolve(null); };

    function cuenta(coleccion, condiciones) {
      return fs.getCountFromServer(fs.query.apply(null, [fs.collection(db, coleccion)].concat(condiciones)));
    }
    /** Fichas del equipo docente jugando como recluta (modo fantasma): sin dato, cero (antes no había ninguna). */
    function fantasmasEn(id) {
      return aNull(function () { return cuenta("student_profiles", [fs.where("projectId", "==", id), fs.where("fantasma", "==", true)]); })
        .then(function (c) { return c ? c.data().count : 0; });
    }

    /** Los grupos de este mod en los que figuro como docente, en orden. `opc` llega a `filtro`. */
    async function misGrupos(correo, opc) {
      correo = String(correo || "").toLowerCase();
      var r = await fs.getDocs(fs.query(fs.collection(db, "projects"), fs.where("coTeacherEmails", "array-contains", correo)));
      // el bloque del mod viaja con el grupo, bajo el nombre del mod (`x.stargate`, `x.ceniza`)
      var mios = r.docs.filter(function (d) { return o.modDe(d.data()) === mod; }).map(function (d) {
        var p = d.data(), x = { id: d.id, nombre: p.name, codigo: p.joinCode || "", ownerId: p.ownerId || "", teacherId: p.teacherId || "" };
        x[mod] = p[mod] || {};
        return Object.assign(x, o.extra ? o.extra(p) : {});
      }).filter(function (x) { return o.filtro ? o.filtro(x, opc) !== false : true; })
        .map(function (x) { return o.estado ? Object.assign(x, o.estado(x)) : x; });
      // En marcha primero, luego los que van a empezar, y los pasados al final: así, cuando una pantalla tiene que elegir un grupo
      // por defecto, el primero ya es el correcto (en enero hay a la vez uno acabando y otro empezando).
      mios.sort(function (a, b) { return (ORDEN[a.estado] - ORDEN[b.estado]) || String(a.nombre || "").localeCompare(String(b.nombre || "")); });

      // ¿soy referente de este grupo?, el equipo y cómo me llamo en él: una lectura por grupo, a la vez
      var yo = o.duenoEsReferente === true ? await sesion() : null;
      await Promise.all(mios.map(async function (x) {
        var vitalicio = esVitalicio(correo);
        try {
          var pv = await fs.getDoc(fs.doc(db, "projects", x.id, "privado", privado));
          var eq = (pv.exists() ? pv.data().docentes : null) || x[mod].docentes || [];
          var mio = eq.filter(function (d) { return String(d.correo || "").toLowerCase() === correo; })[0];
          x.soyReferente = vitalicio || !!(yo && (x.ownerId === yo.uid || x.teacherId === yo.uid)) || !!(mio && mio.rol === "referente");
          x.equipo = eq.map(function (d) { return { nombre: d.nombre || "", correo: String(d.correo || "").toLowerCase(), rol: d.rol || "docente" }; });
          x.miNombre = (mio && mio.nombre) || "";
        } catch (e) { x.soyReferente = vitalicio; x.equipo = []; x.miNombre = ""; }
      }));
      // cuánta gente hay (getCountFromServer no se trae las fichas: devuelve el número) y, si la web lo pide, lo que espera
      await Promise.all(mios.map(async function (x) {
        var res = await Promise.all([
          aNull(function () { return cuenta("student_profiles", [fs.where("projectId", "==", x.id)]); }),
          o.fantasmas === true ? fantasmasEn(x.id) : 0,
          o.cola === true ? aNull(function () { return cuenta("purchased_vouchers", [fs.where("projectId", "==", x.id), fs.where("status", "==", "pending")]); }) : null,
        ]);
        x.reclutas = res[0] ? Math.max(0, res[0].data().count - res[1]) : null;
        if (o.cola === true) x.cola = res[2] ? res[2].data().count : 0;
      }));
      return mios;
    }
    /** Todos los grupos de un mod (ver arriba), en el orden en que llegan. */
    async function todos(modGrupo) {
      var r = await fs.getDocs(fs.query(fs.collection(db, "mod_grupos"), fs.where("modGrupo", "==", String(modGrupo))));
      return Promise.all(r.docs.map(async function (t) {
        var tarjeta = Object.assign({}, t.data()); delete tarjeta.modGrupo;
        try {
          var p = await fs.getDoc(fs.doc(db, "projects", t.id));
          return { id: t.id, datos: p.exists() ? p.data() : tarjeta };
        } catch (e) { return { id: t.id, datos: tarjeta }; }
      }));
    }
    return { misGrupos: misGrupos, todos: todos };
  }

  return { crear: crear, ORDEN: ORDEN };
});
// ─── fin de la pieza «grupos» ───
});
var llave = pieza(function (module, exports) {
// ─── GP_SDK pieza «llave» (sdk/llave.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · LA LLAVE DE LA SEMANA (14-oct-2026, plan DPG1) — pieza del SDK v1. La gemela del navegador de
 * functions/modLlaveLogica.js (la misma cuenta: tests/sdk/llave.test.ts las compara en cientos de instantes).
 *
 * Norberto: «una sesión NO se puede ver en diferido hasta que su docente la da en directo (por columna); lo mismo la
 * retaguardia y los minijuegos de esa semana. El viernes de esa semana a las 20:00 (Madrid) se abre todo».
 *
 * La web lee `mod_llaves/{grupo}` (lo escribe solo el servidor: `modLlave` «dar», al cerrar la clase en directo) y pregunta aquí:
 *
 *   GP_SDK.llave.abierta(cosa, columna, ahora, { llaves, cal, cfg }) → { abierta, por, red }
 *       cosa = { tipo: 'sesion', id, semana } | { tipo: 'semana', semana } (la retaguardia y los minijuegos de esa semana)
 *       columna = la `modColumna` de la ficha ('' sin columnas) · cal = el bloque del grupo (inicio, pausas, semanaForzada)
 *       cfg = la `llave` de la configuración de su mod (el paquete la lleva: GP_SDK.mods[mod].llave), o null: todo abierto
 *       por: 'pieza' | 'sin-semana' | 'dada' | 'red' | null (cerrada) · red: el instante del viernes a las 20:00 (ms) o null
 *   GP_SDK.llave.redDeLaSemana(cal, semana, ahora, cfg) → ms | null
 *   GP_SDK.llave.aperturaDeSemana(cal, semana, ahora) → { lunes, texto }: un reto cerrado, «Se abre el lunes 26 de octubre.»
 *   GP_SDK.llave.textoCerrado(que, red, cfg) → «Esta sesión se abre cuando tu docente dé la clase en directo, o el viernes 23 de octubre a las 20:00.»
 *       21-oct · con `cfg.docente === false` (DPG1: «el directo es un botón», la semana se abre sola el lunes): «Esta clase se abre el lunes 26 de octubre.»
 *
 * Las horas, en Madrid (Intl), sea cual sea la zona del navegador: el alumnado de Latinoamérica ve la misma llave. El equipo
 * docente lo ve todo siempre (eso lo decide la web: aquí no se sabe quién mira). Sin textos de ningún mod más que el de cerrado.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPLLAVE = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var DIA = 864e5, ZONA = "Europe/Madrid", SIN_COLUMNA = "_";
  var FMT = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });
  var FMT_HORA = new Intl.DateTimeFormat("en-GB", { timeZone: ZONA, hour: "2-digit", hour12: false });
  function plano(x) { return !!x && typeof x === "object" && !Array.isArray(x); }
  function dos(n) { return (n < 10 ? "0" : "") + n; }
  function esDia(x) { return typeof x === "string" && /^\d{4}-\d\d-\d\d$/.test(x); }
  function utc(dia) { return Date.UTC(Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1, Number(dia.slice(8, 10))); }
  function deUtc(ms) { var d = new Date(ms); return d.getUTCFullYear() + "-" + dos(d.getUTCMonth() + 1) + "-" + dos(d.getUTCDate()); }
  function masDias(dia, n) { return deUtc(utc(dia) + n * DIA); }
  function diasEntre(a, b) { return Math.round((utc(b) - utc(a)) / DIA); }
  function hoyEnMadrid(ahora) { return FMT.format(new Date(ahora)); }
  function lunesDe(dia) { return masDias(dia, -((new Date(utc(dia)).getUTCDay() + 6) % 7)); }
  function pausasLimpias(inicio, pausas) {
    if (!esDia(inicio) || !Array.isArray(pausas)) return [];
    var vistas = {};
    return pausas.map(function (p) { return String(p || "").slice(0, 10); }).filter(function (p) {
      if (!esDia(p) || vistas[p]) return false;
      vistas[p] = true;
      var d = diasEntre(inicio, p);
      return d >= 0 && d % 7 === 0;
    }).sort();
  }
  function inicioDeSemana(inicio, n, pausas) {
    n = Math.max(1, Math.floor(Number(n) || 1));
    var ps = pausasLimpias(inicio, pausas), cuenta = 0;
    for (var i = 0; i < 1000; i++) {
      var dia = masDias(inicio, i * 7);
      if (ps.indexOf(dia) >= 0) continue;
      if (++cuenta === n) return dia;
    }
    return masDias(inicio, (n - 1) * 7);
  }
  function medianocheMadrid(iso) {
    var base = Date.parse(iso + "T00:00:00Z");
    for (var h = 1; h <= 2; h++) {
      var t = base - h * 3600e3, hora = Number(FMT_HORA.format(new Date(t)));
      if (hora === 0 || hora === 24) return t;
    }
    return base - 2 * 3600e3;
  }
  function semanaValida(n) { var x = Number(n); return Number.isInteger(x) && x >= 1 && x <= 60 ? x : null; }
  function claveColumna(c) { return typeof c === "string" && /^[a-z0-9_-]{1,40}$/.test(c) ? c : SIN_COLUMNA; }

  function lunesDeSemanaN(cal, semana, ahora) {
    var n = semanaValida(semana);
    if (!n) return null;
    var c = cal || {}, forzada = Number(c.semanaForzada);
    if (isFinite(forzada) && forzada > 0) return masDias(lunesDe(hoyEnMadrid(ahora)), 7 * (n - forzada));
    if (esDia(c.inicio)) return inicioDeSemana(c.inicio, n, c.pausas);
    return null;
  }
  function redDeLaSemana(cal, semana, ahora, cfg) {
    var lunes = cfg ? lunesDeSemanaN(cal, semana, ahora) : null;
    return lunes ? medianocheMadrid(masDias(lunes, cfg.dia)) + cfg.hora * 3600e3 : null;
  }
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function textoApertura(lunes) { return esDia(lunes) ? "Se abre el lunes " + Number(lunes.slice(8, 10)) + " de " + MESES[Number(lunes.slice(5, 7)) - 1] + "." : null; }
  /** 14-oct · el lunes en que se abre lo de la semana N (un reto cerrado: «Se abre el lunes 26 de octubre.») → { lunes, texto } */
  function aperturaDeSemana(cal, semana, ahora) { var l = lunesDeSemanaN(cal, semana, ahora); return { lunes: l, texto: textoApertura(l) }; }
  function deLaColumna(llaves, columna) {
    var c = llaves && plano(llaves.columnas) ? llaves.columnas[claveColumna(columna)] : null;
    return { sesiones: c && plano(c.sesiones) ? c.sesiones : {}, semanas: c && plano(c.semanas) ? c.semanas : {} };
  }
  function abierta(cosa, columna, ahora, o) {
    o = o || {};
    if (!o.cfg) return { abierta: true, por: "pieza", red: null };
    var semana = semanaValida(cosa && cosa.semana);
    var red = semana ? redDeLaSemana(o.cal, semana, ahora, o.cfg) : null;
    var L = deLaColumna(o.llaves, columna), esSesion = !!cosa && cosa.tipo === "sesion";
    var dada = esSesion ? !!L.sesiones[String(cosa.id)] : !!(semana && L.semanas[String(semana)]);
    if (dada) return { abierta: true, por: "dada", red: red };
    if (!semana) return { abierta: !!cosa && !esSesion, por: !!cosa && !esSesion ? "sin-semana" : null, red: red };
    if (red != null && ahora >= red) return { abierta: true, por: "red", red: red };
    return { abierta: false, por: null, red: red };
  }
  function textoCerrado(que, red, cfg) {
    var sinDocente = !!cfg && cfg.docente === false;
    if (red == null) return que + (sinDocente ? " aún no ha llegado." : " se abre cuando tu docente dé la clase en directo.");
    var partes = new Intl.DateTimeFormat("es-ES", { timeZone: ZONA, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
      .formatToParts(new Date(red)), p = {};
    partes.forEach(function (x) { p[x.type] = x.value; });
    if (sinDocente) return que + " se abre el " + p.weekday + " " + p.day + " de " + p.month + (p.hour === "00" && p.minute === "00" ? "" : " a las " + p.hour + ":" + p.minute) + ".";
    return que + " se abre cuando tu docente dé la clase en directo, o el " + p.weekday + " " + p.day + " de " + p.month + " a las " + p.hour + ":" + p.minute + ".";
  }
  return { abierta: abierta, redDeLaSemana: redDeLaSemana, textoCerrado: textoCerrado, aperturaDeSemana: aperturaDeSemana,
    claveColumna: claveColumna, SIN_COLUMNA: SIN_COLUMNA };
});
// ─── fin de la pieza «llave» ───
});
var niveles = pieza(function (module, exports) {
// ─── GP_SDK pieza «niveles» (sdk/niveles.js), tal cual ───
'use strict';
/**
 * GAMIFICAPRO · LOS NIVELES (14-oct-2026, plan DPG1, carril «Niveles») — pieza del SDK v1. La gemela del navegador de
 * functions/modNivelesLogica.js (la misma cuenta: tests/sdk/niveles.test.ts las compara en miles de leguas y columnas).
 *
 * Norberto: «los niveles sustituyen a los rangos». Las leguas (o la XP de cada mod) dan un NIVEL y un TÍTULO por tramos, en
 * femenino o masculino según el personaje («/a» si no se sabe); pasada la cima, un sello de maestría cada `maestria.cada`. Se ven
 * desde la semana 1; las VENTAJAS se abren en `ventajas.semana`. Lo que mueve oro o leguas lo decide el servidor (modNiveles y
 * completeMission); aquí, solo lo que pinta la web:
 *
 *   GP_SDK.niveles.nivelDe(leguas, cfg)             → { nivel, desde, hasta, cima, sellos, faltan, titulo: { f, m, n } }
 *   GP_SDK.niveles.tituloDe(info | nivel, sexo, cfg) → «Porteadora» · «Porteador» · «Porteador/a» (sexo 'f' | 'm' | otro)
 *   GP_SDK.niveles.ventajasAbiertas(cfg, semana) · ventajasDe(nivel, cfg) · tieneVentaja(cfg, clave, nivel, semana)
 *   GP_SDK.niveles.mediana(lista) · conVientoAFavor({ cfg, nivel, columna, semana, usado }) («Viento a favor» esta semana)
 *   GP_SDK.niveles.guias(fichas, cfg, semana, columna?)       → las fichas con la insignia «Guía» (de su columna, si se dice)
 *   GP_SDK.niveles.estandartes(fichas, cfg, semana)            → { <columna>: ficha } quien lleva el estandarte de cada columna
 *       fichas = [{ id, leguas, columna, … }] (lo de cada web; `columna` '' sin columnas)
 *   GP_SDK.niveles.porMod[mod]                                 → la `niveles` de cada mod que tiene la pieza (functions/mods/<mod>.js)
 *   GP_SDK.niveles.cfg(mod | crudo)                            → la configuración normalizada (la que piden las demás), o null
 * Sin textos de ningún mod más que los títulos de su tabla.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPNIVELES = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var VENTAJAS = ["marco", "mano", "guia", "pregunta", "estandarte", "reto"];
  function plano(x) { return !!x && typeof x === "object" && !Array.isArray(x); }
  function texto(x) { return typeof x === "string" ? x.replace(/\s+/g, " ").trim() : ""; }
  function entero(x, def) { return typeof x === "number" && x >= 0 && Math.floor(x) === x ? x : def; }
  function num(x) { var n = Number(x); return isFinite(n) ? n : 0; }

  /** La configuración normalizada (la misma que nivelesDelMod del servidor), de la `niveles` cruda de un mod. null si no vale. */
  function normalizar(n) {
    if (!plano(n) || !Array.isArray(n.tabla) || !n.tabla.length) return null;
    var tabla = n.tabla.map(function (f) {
      var t = f.titulo || {};
      return { nivel: Number(f.nivel), desde: Number(f.desde), titulo: { f: texto(t.f), m: texto(t.m), n: texto(t.n) } };
    }).sort(function (a, b) { return a.desde - b.desde; });
    for (var i = 0; i < tabla.length; i++) {
      var f = tabla[i];
      if (Math.floor(f.nivel) !== f.nivel || !isFinite(f.desde)) return null;
      if (i && (f.desde <= tabla[i - 1].desde || f.nivel <= tabla[i - 1].nivel)) return null;
    }
    var V = plano(n.ventajas) ? n.ventajas : {};
    function v(k, extra) {
      if (!plano(V[k])) return null;
      var o = { nivel: entero(V[k].nivel, 0) }, e = extra ? extra(V[k]) : {};
      for (var c in e) o[c] = e[c];
      return o;
    }
    return {
      tabla: tabla,
      maestria: { cada: entero(n.maestria && n.maestria.cada, 0) },
      ventajas: {
        semana: entero(V.semana, 1),
        marco: v("marco", function (x) { return { colores: plano(x.colores) ? x.colores : {} }; }),
        mano: v("mano", function (x) { return { oro: entero(x.oro, 0), porSemana: entero(x.porSemana, 1), recibirPorSemana: entero(x.recibirPorSemana, 1) }; }),
        guia: v("guia"),
        pregunta: v("pregunta", function (x) { return { porSemana: entero(x.porSemana, 1) }; }),
        estandarte: v("estandarte"),
        reto: v("reto", function (x) { return { max: entero(x.max, 1) }; }),
        viento: plano(V.viento) ? { debajo: entero(V.viento.debajo, 3), extra: Number(V.viento.extra) > 0 ? Number(V.viento.extra) : 0, porSemana: entero(V.viento.porSemana, 1) } : null
      },
      asientos: { mano: texto(n.asientos && n.asientos.mano) || "mod_niveles_mano", viento: texto(n.asientos && n.asientos.viento) || "mod_niveles_viento" }
    };
  }

  function nivelDe(leguas, cfg) {
    var xp = Math.max(0, num(leguas)), T = cfg.tabla, i = 0;
    for (var k = 0; k < T.length; k++) if (xp >= T[k].desde) i = k;
    var f = T[i], sig = T[i + 1] || null, cada = cfg.maestria.cada, cima = !sig;
    var sellos = cima && cada > 0 ? Math.floor((xp - f.desde) / cada) : 0;
    var faltan = sig ? sig.desde - xp : cada > 0 ? cada - ((xp - f.desde) % cada) : 0;
    return { nivel: f.nivel, desde: f.desde, hasta: sig ? sig.desde : null, cima: cima, sellos: sellos, faltan: faltan, titulo: f.titulo };
  }
  function tituloDe(info, sexo, cfg) {
    var t;
    if (typeof info === "number") { var f = cfg.tabla.filter(function (x) { return x.nivel === info; })[0] || cfg.tabla[0]; t = f.titulo; }
    else t = info.titulo;
    return (sexo === "f" ? t.f : sexo === "m" ? t.m : "") || t.n || t.m || t.f;
  }
  function rangosDe(cfg) {
    var out = [];
    cfg.tabla.forEach(function (f) { if (!out.length || out[out.length - 1].titulo !== f.titulo.n) out.push({ leguas: f.desde, titulo: f.titulo.n }); });
    return out;
  }
  function ventajasAbiertas(cfg, semana) { return semana != null && isFinite(Number(semana)) && Number(semana) >= cfg.ventajas.semana; }
  function ventajasDe(nivel, cfg) { return VENTAJAS.filter(function (k) { return cfg.ventajas[k] && nivel >= cfg.ventajas[k].nivel; }); }
  function tieneVentaja(cfg, k, nivel, semana) { return !!cfg.ventajas[k] && ventajasAbiertas(cfg, semana) && nivel >= cfg.ventajas[k].nivel; }
  function mediana(lista) {
    var l = (lista || []).map(Number).filter(function (x) { return isFinite(x); }).sort(function (a, b) { return a - b; });
    if (!l.length) return null;
    var m = l.length >> 1;
    return l.length % 2 ? l[m] : (l[m - 1] + l[m]) / 2;
  }
  /** El extra del viento (lo mismo que `viento` del servidor): → { extra, mediana } */
  function viento(o) {
    var cfg = o.cfg, V = cfg.ventajas.viento, nada = { extra: 0, mediana: null };
    if (!V || !(V.extra > 0) || !(num(o.leguas) > 0) || !ventajasAbiertas(cfg, o.semana)) return nada;
    var u = o.usado;
    if (u && Number(u.semana) === Number(o.semana) && (Number(u.n) || 1) >= V.porSemana) return nada;
    var med = mediana(o.columna);
    if (med == null || !(med - o.nivel >= V.debajo)) return nada;
    return { extra: Math.round(num(o.leguas) * V.extra), mediana: med };
  }
  function conVientoAFavor(o) { return viento({ cfg: o.cfg, nivel: o.nivel, columna: o.columna, leguas: 100, semana: o.semana, usado: o.usado }).extra > 0; }

  /** Las fichas con la insignia «Guía» esa semana (de su columna, si se dice), de más a menos leguas. */
  function guias(fichas, cfg, semana, columna) {
    var G = cfg.ventajas.guia;
    if (!G || !ventajasAbiertas(cfg, semana)) return [];
    return (fichas || []).filter(function (r) {
      return (columna == null || String(r.columna || "") === String(columna || "")) && nivelDe(r.leguas, cfg).nivel >= G.nivel;
    }).sort(function (a, b) { return num(b.leguas) - num(a.leguas); });
  }
  /** Quién lleva el estandarte de cada columna: el de más nivel con la ventaja (a igual nivel, más leguas). → { columna: ficha } */
  function estandartes(fichas, cfg, semana) {
    var E = cfg.ventajas.estandarte, out = {};
    if (!E || !ventajasAbiertas(cfg, semana)) return out;
    (fichas || []).forEach(function (r) {
      if (nivelDe(r.leguas, cfg).nivel < E.nivel) return;
      var c = String(r.columna || ""), ya = out[c];
      if (!ya || num(r.leguas) > num(ya.leguas)) out[c] = r;
    });
    return out;
  }

  var API = {
    VENTAJAS: VENTAJAS, normalizar: normalizar, nivelDe: nivelDe, tituloDe: tituloDe, rangosDe: rangosDe, ventajasAbiertas: ventajasAbiertas,
    ventajasDe: ventajasDe, tieneVentaja: tieneVentaja, mediana: mediana, viento: viento, conVientoAFavor: conVientoAFavor,
    guias: guias, estandartes: estandartes, porMod: {}
  };
  /** La configuración normalizada de un mod (por su nombre, de `porMod`) o de una `niveles` cruda. */
  API.cfg = function (x) { return normalizar(typeof x === "string" ? API.porMod[x] : x); };
  return API;
});
// ─── fin de la pieza «niveles» ───
});

var SDK = {
  version: "v1",
  piezas: ["semanas","llamar","papel","alistarse","premios","asistencia","votacion","retos","equipo","buzon","economia","efigie","mantenimiento","registro","sitio","conectar","grupos","llave","niveles"],
  semanas: semanas,
  llamador: llamar.llamador,
  errores: { codigo: llamar.codigo, delServidor: llamar.delServidor, sinDesplegar: llamar.sinDesplegar, es: llamar.es, CODIGOS: llamar.CODIGOS },
  papel: papel.crearPapel,
  papelDe: papel.papelDe,
  conectar: conectar.conectar,
  alistarse: alistarse,
  premios: premios,
  asistencia: asistencia,
  votacion: votacion,
  retos: retos,
  equipo: equipo,
  buzon: buzon,
  economia: economia,
  efigie: efigie,
  mantenimiento: mantenimiento,
  registro: registro,
  grupos: grupos,
  sitio: sitio.crear({"mapa":{"stargate_alias":{"nueva":"mod_alias","mod":"stargate","ids":"grupo","porGrupo":true,"fase":"vieja","pasadaPara":["stargate","ceniza"]},"stargate_anulaciones":{"nueva":"mod_anulaciones","mod":"stargate","ids":"azar","porGrupo":true,"fase":"nueva"},"stargate_asistencia":{"nueva":"mod_asistencia","mod":"stargate","ids":"azar","porGrupo":true,"fase":"nueva"},"stargate_batallas":{"nueva":"mod_batallas","mod":"stargate","ids":"azar","porGrupo":true,"fase":"nueva"},"stargate_buzon":{"nueva":"mod_buzon","mod":"stargate","ids":"azar","porGrupo":false,"fase":"vieja","comun":true},"stargate_comentarios":{"nueva":"mod_comentarios","mod":"stargate","ids":"azar","porGrupo":true,"fase":"vieja","pasadaPara":["stargate","ceniza"]},"stargate_congelados":{"nueva":"mod_congelados","mod":"stargate","ids":"grupo","porGrupo":true,"fase":"nueva"},"stargate_directo":{"nueva":"mod_directo","mod":"stargate","ids":"grupo","porGrupo":true,"fase":"vieja"},"stargate_envivo":{"nueva":"mod_envivo","mod":"stargate","ids":"grupo","porGrupo":true,"fase":"vieja"},"stargate_formacion":{"nueva":"mod_formacion","mod":"stargate","ids":"suelto","porGrupo":false,"fase":"vieja","pasadaPara":["stargate"]},"stargate_invitaciones":{"nueva":"mod_invitaciones","mod":"stargate","ids":"suelto","porGrupo":false,"fase":"vieja","pasadaPara":["stargate"]},"stargate_profes":{"nueva":"mod_profes","mod":"stargate","ids":"suelto","porGrupo":false,"fase":"vieja","pasadaPara":["stargate"]},"stargate_referentes":{"nueva":"mod_referentes","mod":"stargate","ids":"suelto","porGrupo":false,"fase":"vieja","pasadaPara":["stargate"]},"stargate_reflexiones":{"nueva":"mod_reflexiones","mod":"stargate","ids":"grupo","porGrupo":true,"fase":"vieja","pasadaPara":["stargate","ceniza"]},"stargate_respuestas":{"nueva":"mod_respuestas","mod":"stargate","ids":"grupo","porGrupo":true,"fase":"vieja"},"stargate_rutas":{"nueva":"mod_rutas","mod":"stargate","ids":"azar","porGrupo":true,"fase":"nueva"},"stargate_tratos":{"nueva":"mod_tratos","mod":"stargate","ids":"azar","porGrupo":true,"fase":"vieja","pasadaPara":["stargate"]},"stargate_zoco":{"nueva":"mod_zoco","mod":"stargate","ids":"azar","porGrupo":true,"fase":"vieja","pasadaPara":["stargate"]},"stargate_asedio":{"nueva":"mod_asedio","mod":"stargate","ids":"grupo","porGrupo":true,"fase":"nueva"},"stargate_asedio_ataques":{"nueva":"mod_asedio_ataques","mod":"stargate","ids":"azar","porGrupo":true,"fase":"nueva"},"stargate_galeria":{"nueva":"mod_galeria","mod":"stargate","ids":"grupo","porGrupo":true,"fase":"nueva"},"stargate_fama":{"nueva":"mod_fama","mod":"stargate","ids":"suelto","porGrupo":false,"fase":"nueva"},"ceniza_clase":{"nueva":"mod_clase","mod":"ceniza","ids":"grupo","porGrupo":true,"fase":"vieja"},"ceniza_formacion":{"nueva":"mod_formacion","mod":"ceniza","ids":"suelto","porGrupo":false,"fase":"vieja"},"ceniza_invitaciones":{"nueva":"mod_invitaciones","mod":"ceniza","ids":"suelto","porGrupo":false,"fase":"vieja","pasadaPara":["ceniza"]},"ceniza_referentes":{"nueva":"mod_referentes","mod":"ceniza","ids":"suelto","porGrupo":false,"fase":"vieja","pasadaPara":["ceniza"]},"ceniza_profes":{"nueva":"mod_profes","mod":"ceniza","ids":"suelto","porGrupo":false,"fase":"vieja","pasadaPara":["ceniza"]},"ceniza_juegos":{"nueva":"mod_juegos","mod":"ceniza","ids":"azar","porGrupo":true,"fase":"nueva"},"ceniza_mesa":{"nueva":"mod_mesa","mod":"ceniza","ids":"suelto","porGrupo":false,"fase":"vieja","pasadaPara":["ceniza"]},"ceniza_respuestas":{"nueva":"mod_repaso","mod":"ceniza","ids":"azar","porGrupo":true,"fase":"nueva"},"ceniza_retaguardia_partidas":{"nueva":"mod_retaguardia_partidas","mod":"ceniza","ids":"azar","porGrupo":true,"fase":"nueva"},"ceniza_retaguardias":{"nueva":"mod_retaguardias","mod":"ceniza","ids":"azar","porGrupo":true,"fase":"nueva"},"ceniza_publico":{"nueva":"mod_publico","mod":"ceniza","ids":"suelto","porGrupo":false,"fase":"vieja","pasadaPara":["ceniza"]},"ceniza_publico_opiniones":{"nueva":"mod_publico_opiniones","mod":"ceniza","ids":"azar","porGrupo":false,"fase":"vieja","pasadaPara":["ceniza"]}},"novedades":{"2":["coleccionesMod","economiaSoloServidor","ticketMotor","medianocheUnica","bancoMotor","retaguardiaMotor"]},"mods":[{"mod":"stargate","reconocer":"bloque"},{"mod":"ceniza","reconocer":null}]}),
  llave: Object.assign({}, llave, { porMod: {"ceniza":{"dia":0,"hora":0,"docente":false}} }),
  niveles: (function () { niveles.porMod = {"ceniza":{"tabla":[{"nivel":0,"desde":0,"titulo":{"f":"Vagabunda","m":"Vagabundo","n":"Vagabundo/a"}},{"nivel":1,"desde":30,"titulo":{"f":"Vagabunda","m":"Vagabundo","n":"Vagabundo/a"}},{"nivel":2,"desde":70,"titulo":{"f":"Vagabunda","m":"Vagabundo","n":"Vagabundo/a"}},{"nivel":3,"desde":120,"titulo":{"f":"Caminante","m":"Caminante","n":"Caminante"}},{"nivel":4,"desde":180,"titulo":{"f":"Caminante","m":"Caminante","n":"Caminante"}},{"nivel":5,"desde":260,"titulo":{"f":"Porteadora","m":"Porteador","n":"Porteador/a"}},{"nivel":6,"desde":350,"titulo":{"f":"Porteadora","m":"Porteador","n":"Porteador/a"}},{"nivel":7,"desde":460,"titulo":{"f":"Rastreadora","m":"Rastreador","n":"Rastreador/a"}},{"nivel":8,"desde":590,"titulo":{"f":"Rastreadora","m":"Rastreador","n":"Rastreador/a"}},{"nivel":9,"desde":740,"titulo":{"f":"Guía de familia","m":"Guía de familia","n":"Guía de familia"}},{"nivel":10,"desde":910,"titulo":{"f":"Guía de familia","m":"Guía de familia","n":"Guía de familia"}},{"nivel":11,"desde":1100,"titulo":{"f":"Cartógrafa","m":"Cartógrafo","n":"Cartógrafo/a"}},{"nivel":12,"desde":1320,"titulo":{"f":"Cartógrafa","m":"Cartógrafo","n":"Cartógrafo/a"}},{"nivel":13,"desde":1570,"titulo":{"f":"Abanderada","m":"Abanderado","n":"Abanderado/a"}},{"nivel":14,"desde":1860,"titulo":{"f":"Abanderada","m":"Abanderado","n":"Abanderado/a"}},{"nivel":15,"desde":2200,"titulo":{"f":"Maestra de obras","m":"Maestro de obras","n":"Maestro/a de obras"}},{"nivel":16,"desde":2600,"titulo":{"f":"Arquitecta del Camino","m":"Arquitecto del Camino","n":"Arquitecto/a del Camino"}}],"maestria":{"cada":150},"ventajas":{"semana":9,"marco":{"nivel":3,"colores":{"ambar":"#d39b2a","burdeos":"#8e2f3c","pizarra":"#4a6378","musgo":"#5f7a3a","cobre":"#b5653a","hueso":"#e8dcc0","noche":"#2c2f4a","ceniza":"#8a8580"}},"mano":{"nivel":5,"oro":5,"porSemana":1,"recibirPorSemana":2},"guia":{"nivel":9},"pregunta":{"nivel":11,"porSemana":1},"estandarte":{"nivel":13},"reto":{"nivel":16,"max":2},"viento":{"debajo":3,"extra":0.5,"porSemana":1}},"asientos":{"mano":"mod_niveles_mano","viento":"mod_niveles_viento"}}}; return niveles; })()
};
if (typeof module === "object" && module.exports) module.exports = SDK;
else raiz.GP_SDK = SDK;
})(typeof self !== "undefined" ? self : this);
