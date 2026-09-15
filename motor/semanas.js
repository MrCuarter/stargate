'use strict';
/**
 * STARGATE · LAS SEMANAS DEL CURSO, CON PAUSAS (13-sep-2026)
 *
 * Norberto: «a veces hay cambios: en Navidad se retrasa una semana, o Semana Santa… Debe ser fácil
 * para el referente ajustar el calendario: una página dedicada con el calendario, con posibilidad
 * de mover o congelar una semana».
 *
 * Una semana CONGELADA es una semana del calendario que no cuenta para el curso: mientras dura, el
 * curso se queda en la semana en la que estaba, y todo lo de detrás se corre una semana. Se guarda
 * como la lista de días en que empiezan las semanas congeladas (`projects.stargate.pausas`), sobre
 * la misma rejilla que la semana 1 (si el curso empieza un lunes, son lunes).
 *
 * 🔴 UNA SOLA RECETA. «¿En qué semana estamos?» se calculaba en SEIS sitios (la Nave, la sesión, la
 * consola, el traductor, el paquete, el foro) con la misma cuenta copiada. Añadir las pausas a seis
 * copias era garantizar que un día dos pantallas dijeran semanas distintas. Ahora todas preguntan
 * aquí. (El servidor del Zoco hace la misma cuenta en GamificaPro: stargateZoco.js → semanaDelCurso.)
 *
 * Y de paso: la cuenta vieja dividía milisegundos entre 7 días, y el lunes siguiente al cambio de
 * hora de marzo salían 7 días MENOS UNA HORA → la semana anterior durante todo ese lunes. Aquí se
 * cuentan DÍAS (redondeando), así que el cambio de hora no mueve nada.
 *
 * Se usa igual en Node (pruebas, sembrador) y en el navegador (window.SGSEMANAS).
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
