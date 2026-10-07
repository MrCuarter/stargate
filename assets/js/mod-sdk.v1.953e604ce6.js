/* GamificaPro · mod-sdk v1 — GENERADO por scripts/build-sdk.mjs (npm run build:sdk) desde sdk/semanas.js, sdk/llamar.js, sdk/papel.js.
 * No se edita a mano ni en las webs: se cambian las piezas en GamificaPro y se genera otro paquete (otra huella).
 * Sin claves, sin textos y sin colores de ningún mod. Deja window.GP_SDK (o module.exports en Node):
 *   GP_SDK.semanas                         la receta de las semanas (la de window.SGSEMANAS)
 *   GP_SDK.llamador(nombre => callable)    → llamar(nombre, datos), con los errores marcados por código
 *   GP_SDK.errores                         { codigo, delServidor, sinDesplegar, es, CODIGOS }
 *   GP_SDK.papel(llamar)                   → { miPapel(uid), olvidar() };  GP_SDK.papelDe(respuesta, mod) → { vitalicio, mando }
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

var SDK = {
  version: "v1",
  piezas: ["semanas","llamar","papel"],
  semanas: semanas,
  llamador: llamar.llamador,
  errores: { codigo: llamar.codigo, delServidor: llamar.delServidor, sinDesplegar: llamar.sinDesplegar, es: llamar.es, CODIGOS: llamar.CODIGOS },
  papel: papel.crearPapel,
  papelDe: papel.papelDe
};
if (typeof module === "object" && module.exports) module.exports = SDK;
else raiz.GP_SDK = SDK;
})(typeof self !== "undefined" ? self : this);
