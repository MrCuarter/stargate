/* GamificaPro · mod-sdk v1 — GENERADO por scripts/build-sdk.mjs (npm run build:sdk) desde sdk/semanas.js, sdk/llamar.js, sdk/papel.js, sdk/alistarse.js, sdk/premios.js, sdk/asistencia.js, sdk/votacion.js, sdk/retos.js, sdk/equipo.js, sdk/buzon.js, sdk/economia.js.
 * No se edita a mano ni en las webs: se cambian las piezas en GamificaPro y se genera otro paquete (otra huella).
 * Sin claves, sin textos y sin colores de ningún mod. Deja window.GP_SDK (o module.exports en Node):
 *   GP_SDK.semanas                         la receta de las semanas (la de window.SGSEMANAS)
 *   GP_SDK.llamador(nombre => callable)    → llamar(nombre, datos), con los errores marcados por código
 *   GP_SDK.errores                         { codigo, delServidor, sinDesplegar, es, CODIGOS }
 *   GP_SDK.papel(llamar)                   → { miPapel(uid), olvidar() };  GP_SDK.papelDe(respuesta, mod) → { vitalicio, mando }
 *   GP_SDK.<pieza>.crear({ fs, llamar, sesion })   las piezas con ctx: alistarse, premios, asistencia, votacion, retos, equipo, buzon, economia
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
 *                      la migración en caliente la pase a `mod_alias`).
 *   · `fichaNueva(uid, grupo, alias, extra)`  la ficha a cero de GamificaPro + los campos del mod (`extra`: la piel).
 *   · `crear(ctx)` → { ref, ocupado, reservar, alistar, cambiarAlias }, con `ctx = { fs, llamar, sesion }`:
 *       - `fs`      las funciones de Firestore de la web (las de verdad, las del emulador o las del simulador): db, doc, getDoc,
 *                   getDocs, setDoc, updateDoc, collection, query, where, writeBatch;
 *       - `llamar`  el de GP_SDK.llamador;
 *       - `sesion`  () → promesa de { uid, correo, nombre, anonimo } o null (la sesión de la web).
 *
 * Los textos de los errores son de la web (cada mod habla con su voz): van en `textos`, con unos por defecto neutros. Lo que se
 * puede hacer lo deciden las reglas; esto solo lo prepara bien y lo cuenta con palabras.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPALISTARSE = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var COLECCION = "stargate_alias";

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

    /**
     * ¿Lo lleva otra persona del grupo? → el alias con el que lo lleva (para decirlo), o null.
     * `excepto`: { uid } (quien se alista o su dueño: sus cosas no cuentan) y/o { ficha } (la ficha que se corrige). Mira la
     * reserva y las fichas del grupo: un alias de antes del registro de alias no tiene reserva. Sin `uid`, cualquier reserva
     * cuenta (como el `aliasOcupado` de DPG), salvo al corregir una ficha (`{ ficha }` solo): esa reserva es de su dueño, y
     * quien corrige lo sabe por la ficha.
     */
    function ocupado(grupo, alias, excepto) {
      var e = excepto || {};
      var reserva = (e.uid || !e.ficha)
        ? fs.getDoc(ref(grupo, alias)).then(function (r) { return r && r.exists() && r.data().uid !== e.uid ? String(r.data().alias || alias) : null; }, function () { return null; })
        : Promise.resolve(null);
      return reserva.then(function (deOtro) {
        if (deOtro) return deOtro;
        return fs.getDocs(fs.query(fs.collection(db, "student_profiles"), fs.where("projectId", "==", grupo))).then(function (r) {
          var otro = r.docs.filter(function (d) {
            return d.id !== e.ficha && (!e.uid || d.data().userId !== e.uid) && plano(d.data().displayName) === plano(alias);
          })[0];
          return otro ? String(otro.data().displayName || alias) : null;
        });
      });
    }

    /** Reserva el alias para `uid` DENTRO del lote que escribe la ficha. Si ya es suyo, nada; si es de otro, para con palabras. */
    function reservar(lote, grupo, uid, alias, textos) {
      return fs.getDoc(ref(grupo, alias)).catch(function () { return null; }).then(function (r) {
        if (r && r.exists()) {
          if (r.data().uid === uid) return false;
          throw new Error(texto(textos, "ocupado", alias));
        }
        lote.set(ref(grupo, alias), { projectId: grupo, uid: uid, alias: String(alias), creado: Date.now() });
        return true;
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
        return fs.getDoc(fs.doc(db, "projects", grupo));
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
          lote.set(fichaRef, fichaNueva(yo.uid, grupo, alias, o.ficha));
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
          return fs.getDoc(ref(grupo, viejo)).catch(function () { return null; }).then(function (rv) {
            if (rv && rv.exists() && rv.data().uid === uid) lote.delete(rv.ref);
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

    return { ref: ref, ocupado: ocupado, reservar: reservar, alistar: alistar, cambiarAlias: cambiarAlias };
  }

  return { COLECCION: COLECCION, plano: plano, clave: clave, fichaNueva: fichaNueva, TEXTOS: TEXTOS, crear: crear };
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
 * Puro: `ms(t)` (Timestamp, Date, cadena o número → milisegundos; 0 si no hay), `fin(sesion)`, `COLECCIONES`.
 * Con `crear(ctx)` (ctx = { fs, llamar, sesion }): `abierta(grupo, elegir)`, `vigilar(grupo, alCambiar, elegir)`,
 * `abrir(grupo, o)`, `cerrar(id)`, `fichajes(sesionId)` (en orden de llegada), `yaFiche(sesionId, uid)` y
 * `fichar(grupo, fichaId, { tz })`. Cuánto se paga, a quién va la llamada (`restrictedFactionId`) y el regalo son de cada web.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.GPASISTENCIA = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  var COLECCIONES = { llamadas: "attendance_sessions", fichajes: "attendance_records" };

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
      return fs.onSnapshot(consulta(grupo), function (r) {
        var v = vivas(r.docs, Date.now());
        alCambiar((typeof elegir === "function" ? v.filter(elegir) : v)[0] || null, v);
      }, function () { alCambiar(null, []); });
    }
    /**
     * Abrir la llamada. o = { minutos (30 si no), xp, creditos (lo que paga: va en la sesión), nombre (quien la toca; si no, el
     * de la cuenta), extra: { restrictedFactionId, stargateRegalo… } (lo del mod), textos: { sinSesion } }
     * → { id, hasta (ms), minutos }.
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

    return { abierta: abierta, vigilar: vigilar, abrir: abrir, cerrar: cerrar, fichajes: fichajes, yaFiche: yaFiche, fichar: fichar };
  }

  return { COLECCIONES: COLECCIONES, ms: ms, fin: fin, crear: crear };
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
 * activas, en directo) y `miPapeleta(grupo, id, ficha)`. Los campos propios del mod (la semana, el modo…) van en el evento.
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
    /** Lo que ya ha votado esa ficha en esa votación (`byOption`). */
    function miPapeleta(grupo, id, fichaId) {
      if (!fichaId) return Promise.resolve({});
      return fs.getDoc(fs.doc(db, "projects", grupo, "voting_events", String(id), "votes", String(fichaId)))
        .then(function (d) { return d.exists() ? (d.data().byOption || {}) : {}; });
    }

    return { ref: ref, votar: votar, votos: votos, leer: leer, abrir: abrir, nueva: nueva, cerrar: cerrar, borrar: borrar,
             lista: lista, vigilar: vigilar, miPapeleta: miPapeleta };
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
 *
 * Con `crear(ctx)` (ctx = { fs, llamar, sesion }). Los textos y los títulos son de cada web.
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
    /** Deshacer un reto (su dueño o su docente): el servidor devuelve lo que dio y quita la entrega. */
    function anular(grupo, fichaId, retoId, motivo) {
      return llamar("stargateAnularReto", { projectId: grupo, studentProfileId: fichaId, retoId: retoId, motivo: String(motivo || "").slice(0, TOPES.motivo) });
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
    function sinLeer(docs, campo) {
      return docs.map(porId).filter(function (x) { return (!campo || x[campo]) && !x.read; })
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

    // ---------------------------------------------------------------- las reflexiones
    function guardarReflexion(grupo, reto, fichaId, txt, enlace, textos) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo || !yo.uid) throw new Error(texto(textos, "sinSesionReflexion"));
        var t = String(txt || "").trim().slice(0, TOPES.reflexion);
        if (!t) throw new Error(texto(textos, "reflexionVacia"));
        var ref = fs.doc(db, REFLEX, idReflexion(grupo, reto, fichaId)), creado = Date.now();
        return fs.getDoc(ref).then(function (a) { if (a.exists()) creado = a.data().creado || creado; }, function () {}).then(function () {
          var d = { projectId: grupo, reto: reto, fichaId: fichaId, uid: yo.uid, texto: t, creado: creado, editado: Date.now() };
          var e = String(enlace || "").trim().slice(0, TOPES.enlace);
          if (e) d.enlace = e;
          return fs.setDoc(ref, d).then(function () { return ref.id; });
        });
      });
    }
    /** El enlace de una reflexión que ya existe, al día. Si no hay reflexión (o falla), nada. */
    function enlaceDeReflexion(grupo, reto, fichaId, enlace) {
      var ref = fs.doc(db, REFLEX, idReflexion(grupo, reto, fichaId));
      return fs.getDoc(ref).then(function (a) {
        if (!a.exists()) return;
        return fs.setDoc(ref, Object.assign({}, a.data(), { enlace: String(enlace || "").trim().slice(0, TOPES.enlace), editado: Date.now() }));
      }).catch(function () {});
    }
    function deGrupo(col, grupo, reto) {
      return reto ? fs.query(fs.collection(db, col), fs.where("projectId", "==", grupo), fs.where("reto", "==", reto))
                  : fs.query(fs.collection(db, col), fs.where("projectId", "==", grupo));
    }
    /** Todas las de un reto del grupo (o todas las del grupo), la más nueva arriba. */
    function reflexionesDe(grupo, reto) {
      return fs.getDocs(deGrupo(REFLEX, grupo, reto)).then(function (r) {
        return r.docs.map(porId).sort(function (a, b) { return (b.creado || 0) - (a.creado || 0); });
      });
    }
    function misReflexiones(grupo) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo || !yo.uid) return [];
        return fs.getDocs(fs.query(fs.collection(db, REFLEX), fs.where("projectId", "==", grupo), fs.where("uid", "==", yo.uid)))
          .then(function (r) { return r.docs.map(porId); });
      });
    }
    /** Quitar una reflexión: primero sus comentarios (no se quedan colgando de nada), luego ella. */
    function borrarReflexion(grupo, reto, fichaId) {
      var id = idReflexion(grupo, reto, fichaId);
      return fs.getDocs(fs.query(fs.collection(db, COMENT), fs.where("projectId", "==", grupo), fs.where("reflexion", "==", id)))
        .then(function (r) {
          return r.docs.reduce(function (p, d) { return p.then(function () { return fs.deleteDoc(d.ref).catch(function () {}); }); }, Promise.resolve());
        }, function () {})
        .then(function () { return fs.deleteDoc(fs.doc(db, REFLEX, id)); });
    }

    // ---------------------------------------------------------------- los comentarios
    /** Los comentarios de un reto del grupo (o todos), del más viejo al más nuevo: una conversación se lee así. */
    function comentariosDe(grupo, reto) {
      return fs.getDocs(deGrupo(COMENT, grupo, reto)).then(function (r) {
        return r.docs.map(porId).sort(function (a, b) { return (a.creado || 0) - (b.creado || 0); });
      });
    }
    function comentar(grupo, reflexionId, reto, fichaId, txt, textos) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo || !yo.uid) throw new Error(texto(textos, "sinSesionComentario"));
        var t = String(txt || "").trim().slice(0, TOPES.comentario);
        if (!t) throw new Error(texto(textos, "comentarioVacio"));
        return fs.addDoc(fs.collection(db, COMENT), { projectId: grupo, reflexion: reflexionId, reto: reto, fichaId: fichaId, uid: yo.uid, texto: t, creado: Date.now() })
          .then(function (r) { return r.id; });
      });
    }
    function borrarComentario(id) { return fs.deleteDoc(fs.doc(db, COMENT, String(id || ""))); }

    return { idMision: idMision, registrar: registrar, anular: anular, otorgar: otorgar,
             avisar: avisar, misAvisos: misAvisos, vigilarAvisos: vigilarAvisos, avisoLeido: avisoLeido,
             guardarReflexion: guardarReflexion, enlaceDeReflexion: enlaceDeReflexion, reflexionesDe: reflexionesDe,
             misReflexiones: misReflexiones, borrarReflexion: borrarReflexion,
             comentariosDe: comentariosDe, comentar: comentar, borrarComentario: borrarComentario };
  }

  return { REFLEX: REFLEX, COMENT: COMENT, TOPES: TOPES, TEXTOS: TEXTOS, idReflexion: idReflexion, crear: crear };
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
    function porId(d) { return Object.assign({ id: d.id }, d.data()); }

    // ---------------------------------------------------------------- el equipo de un grupo (el servidor)
    /** Añadir a alguien o cambiarle el rol (`persona` = { correo, nombre, rol }). Devuelve la persona como quedó. */
    function anadirDocente(grupo, persona) {
      return llamar("stargateEquipo", { projectId: grupo, persona: persona || {} }).then(function (r) { return (r && r.persona) || persona; });
    }
    function quitarDocente(grupo, correo) {
      return llamar("stargateEquipo", { projectId: grupo, persona: { correo: minus(correo) }, quitar: true });
    }
    /** Referente en varios grupos de una vez: dice en cuáles ha podido y en cuáles no. */
    function referenteEnTodos(persona, grupos) {
      return llamar("stargateEquipo", { projectIds: grupos, persona: Object.assign({}, persona, { rol: "referente" }) })
        .then(function (r) { return { hechos: (r && r.hechos) || [], fallos: (r && r.fallos) || [] }; });
    }
    /** Quien entra ocupa el sitio de quien sale (papel, alumnado, familia). Si sale el dueño, `ceder: true`. */
    function cambiarDocente(grupo, sale, entra, ceder) {
      return llamar("stargateCambiarDocente", { projectId: grupo, sale: minus(sale), entra: entra || {}, ceder: ceder === true });
    }
    /** Congelar, descongelar, dar de baja o mover (`extra` = { destino }) a un estudiante: solo el referente. */
    function alumno(grupo, fichaId, accion, extra) {
      return llamar("stargateAlumno", Object.assign({ projectId: grupo, fichaId: fichaId, accion: accion }, extra || {}));
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
      return Promise.resolve().then(function () { return fs.getDoc(fs.doc(db, C.referentes, correo)); })
        .then(function (d) { return d.exists() && d.data().activo === true; }, function () { return false; });
    }
    /** Solo el Mando. `enlace(token)`: la dirección de la página de canje, de la web. → { token, enlace, caduca } */
    function crearInvitacion(nombre, enlace, textos) {
      return Promise.resolve(sesion()).then(function (yo) {
        if (!yo) throw new Error(texto(textos, "sinSesion"));
        var t = aleatorio(24), ahora = Date.now(), caduca = ahora + CADUCA;
        return fs.setDoc(fs.doc(db, C.invitaciones, t), { nombre: String(nombre || "").trim().slice(0, 80), rol: "referente", creado: ahora, caduca: caduca,
          por: yo.correo, usadoPor: null, usadoCorreo: null, usadoEn: null })
          .then(function () { return { token: t, enlace: enlace ? enlace(t) : "", caduca: caduca }; });
      });
    }
    function leerInvitacion(t) {
      return fs.getDoc(fs.doc(db, C.invitaciones, String(t || ""))).then(function (d) { return d.exists() ? porId(d) : null; });
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
          b.set(fs.doc(db, C.referentes, yo.correo), { correo: yo.correo, nombre: yo.nombre || inv.nombre || yo.correo, activo: true, desde: ahora,
            por: "invitacion", invitacion: t, actualizado: ahora });
          b.update(fs.doc(db, C.invitaciones, t), { usadoPor: yo.uid, usadoCorreo: yo.correo, usadoEn: ahora });
          return b.commit().then(function () { return { ok: true, nombre: inv.nombre }; });
        });
      });
    }
    /** Solo el Mando: las invitaciones (la más nueva primero) y los referentes. */
    function invitaciones() {
      return fs.getDocs(fs.collection(db, C.invitaciones)).then(function (r) {
        return r.docs.map(porId).sort(function (a, b) { return (b.creado || 0) - (a.creado || 0); });
      });
    }
    function referentes() {
      return fs.getDocs(fs.collection(db, C.referentes)).then(function (r) { return r.docs.map(porId); });
    }
    /** Solo el Mando: poner o quitar (`activo`) a un referente por su correo. Conserva su `desde` y, si no se da otro, su nombre. */
    function ponerReferente(correo, activo, nombre, textos) {
      return Promise.resolve(sesion()).then(function (yo) {
        correo = String(correo || "").trim().toLowerCase();
        if (!esCorreo(correo)) throw new Error(texto(textos, "correoMalo"));
        var ref = fs.doc(db, C.referentes, correo);
        return fs.getDoc(ref).then(function (d) {
          var x = d.exists() ? d.data() : {};
          return fs.setDoc(ref, { correo: correo, nombre: String(nombre || x.nombre || correo), activo: !!activo, desde: x.desde || Date.now(),
            por: (yo && yo.correo) || "", actualizado: Date.now() });
        });
      });
    }

    return { colecciones: C, anadirDocente: anadirDocente, quitarDocente: quitarDocente, referenteEnTodos: referenteEnTodos,
             cambiarDocente: cambiarDocente, alumno: alumno, nuevoCodigo: nuevoCodigo,
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
 *   · Sin índices compuestos: se ordena aquí, lo último tocado arriba.
 *
 * Puro: `TOPES`, `TEXTOS`, `adjuntos(lista)`. Con `crear(ctx, coleccion)` (ctx = { fs, sesion }; la colección, por defecto
 * `stargate_buzon`, la única que abren hoy las reglas): `enviar(m, textos)`, `mios()`, `todos()`, `responder(id, texto,
 * opciones, textos)` y `visto(id)`. Los textos (y cómo se llama el estudiante sin alias) y las frases para valorar una
 * respuesta son de cada web.
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

  function requiere(ctx, nombres) {
    var fs = ctx && ctx.fs;
    if (!fs) throw new Error("GP_SDK.buzon: falta ctx.fs (las funciones de Firestore de la web)");
    nombres.forEach(function (n) { if (!fs[n]) throw new Error("GP_SDK.buzon: falta ctx.fs." + n); });
    return fs;
  }

  function crear(ctx, coleccion) {
    var fs = requiere(ctx, ["db", "doc", "getDoc", "getDocs", "addDoc", "updateDoc", "collection", "query", "where"]);
    var db = fs.db, B = coleccion || COLECCION;
    var sesion = ctx.sesion || function () { return Promise.resolve(null); };
    function porId(d) { return Object.assign({ id: d.id }, d.data()); }
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
        return fs.addDoc(fs.collection(db, B), d).then(function (r) { return r.id; });
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
        return fs.updateDoc(ref, cambios);
      }).then(function () {});
    }
    /** «Ya lo he leído»: se apaga el aviso de respuesta nueva. Si falla, no pasa nada. */
    function visto(id) {
      return Promise.resolve().then(function () { return fs.updateDoc(fs.doc(db, B, id), { visto: true }); }).then(function () {}, function () {});
    }

    return { coleccion: B, enviar: enviar, mios: mios, todos: todos, responder: responder, visto: visto };
  }

  return { COLECCION: COLECCION, TOPES: TOPES, TEXTOS: TEXTOS, adjuntos: adjuntos, crear: crear };
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
    /** Sortear ya (`ticketId`: el documento de la participación). */
    function sortear(grupo, ticketId) { return llamar("modSortear", { projectId: grupo, ticketId: ticketId }); }
    function sorteosPendientes(grupo) { return llamar("stargateSorteosPendientes", { projectId: grupo }); }
    /** Una acción de ofertas (ACCIONES_OFERTA) con sus datos. */
    function oferta(grupo, accion, datos) {
      return llamar("stargateOferta", Object.assign({ projectId: grupo, accion: accion }, datos || {}));
    }
    return { resolverVale: resolverVale, sortear: sortear, sorteosPendientes: sorteosPendientes, oferta: oferta };
  }

  return { ACCIONES_OFERTA: ACCIONES_OFERTA, crear: crear };
});
// ─── fin de la pieza «economia» ───
});

var SDK = {
  version: "v1",
  piezas: ["semanas","llamar","papel","alistarse","premios","asistencia","votacion","retos","equipo","buzon","economia"],
  semanas: semanas,
  llamador: llamar.llamador,
  errores: { codigo: llamar.codigo, delServidor: llamar.delServidor, sinDesplegar: llamar.sinDesplegar, es: llamar.es, CODIGOS: llamar.CODIGOS },
  papel: papel.crearPapel,
  papelDe: papel.papelDe,
  alistarse: alistarse,
  premios: premios,
  asistencia: asistencia,
  votacion: votacion,
  retos: retos,
  equipo: equipo,
  buzon: buzon,
  economia: economia
};
if (typeof module === "object" && module.exports) module.exports = SDK;
else raiz.GP_SDK = SDK;
})(typeof self !== "undefined" ? self : this);
