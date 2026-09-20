/**
 * STARGATE — EL TICKET DE SALIDA, LEÍDO UNA SOLA VEZ (20-sep-2026).
 *
 * 🔴 POR QUÉ ESTE FICHERO. El ticket lo necesitan dos pantallas: la SESIÓN que se proyecta («Cómo os fue» y «Vuestras
 * dudas») y la NAVE del Comandante (la caja donde se repasan las respuestas y se decide qué se proyecta). Tenían el
 * mismo código dos veces —pedirlo, entender las columnas, sacar los porcentajes— y eso, tarde o temprano, son dos
 * verdades distintas sobre lo mismo. Un dato, un sitio: aquí.
 *
 * Lo que NO vive aquí: qué se fija y qué se oculta. Eso es de cada docente en cada grupo y se guarda en el motor
 * (`MOTOR.marcasTicket` / `MOTOR.marcarTicket`), porque viaja con la cuenta, no con el navegador.
 */
(function () {
  var TK = null, PROMESA = null;

  /**
   * Las respuestas del grupo, una vez por página. El lector vive en una hoja de Google (apps-script/LectorTickets.gs)
   * y desde el 20-sep pide identificarse: se le manda la credencial de la sesión. Si Google tarda, a los 12 segundos
   * se deja de esperar y se dice; la clase no puede pararse por esto.
   */
  function pedir(per) {
    if (!per || !window.SG_TICKETS_API) return Promise.resolve({ per: per, lista: [], error: true });
    if (PROMESA && TK && TK.per === per && !TK.error) return PROMESA;
    if (PROMESA && !TK) return PROMESA;
    var M = window.SG && window.SG.MOTOR, llave = (M && M.credencial) ? M.credencial() : Promise.resolve("");
    var tope = new Promise(function (_, no) { setTimeout(function () { no(new Error("tarda demasiado")); }, 12000); });
    PROMESA = Promise.race([
      llave.then(function (t) {
        return fetch(String(window.SG_TICKETS_API), { method: "POST", redirect: "follow",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ accion: "tickets", per: per, token: t || "" }) });
      }).then(function (r) { return r.json(); }), tope])
      .then(function (d) { TK = { per: per, lista: (d && d.tickets) || [], error: !!(d && d.error), motivo: (d && d.error) || "" }; return TK; },
            function () { TK = { per: per, lista: [], error: true, motivo: "" }; return TK; });
    return PROMESA;
  }
  function limpiar() { TK = null; PROMESA = null; }

  /**
   * Las columnas que no son ni una nota ni un comentario: la cabecera del formulario y las de elegir.
   * 🔴 «¿Cómo has seguido esta clase?» (en directo / en diferido) se colaba entre los comentarios porque su respuesta
   * es un texto largo. Manda la PREGUNTA, no lo larga que sea la respuesta.
   */
  var ELIGE = /Selecciona el tema|profesor o profesora|prefieres que transcurran|C[oó]mo has seguido/i;
  var CORTO = [[/utilidad de las herramientas/i, "La utilidad de lo visto"], [/satisfacci[oó]n general del desarrollo/i, "La clase, en general"],
    [/contenidos te[oó]ricos/i, "La teoría"], [/estrategias pr[aá]cticas/i, "La práctica"], [/grado de participaci[oó]n/i, "Vuestra participación"],
    [/utilidad de la actividad/i, "La actividad, ¿os sirvió?"], [/calidad de la actividad que has entregado/i, "Vuestra entrega"],
    [/puntuaci[oó]n obtenida/i, "La nota"], [/vibraciones te ha transmitido/i, "La presentación"], [/utilidad que percibes del temario/i, "El temario"],
    [/conocimientos iniciales/i, "Lo que sabíais al empezar"], [/se ha hablado de la misi[oó]n/i, "Se habló de la misión"],
    [/tablero o el ranking/i, "Se vio el tablero"], [/reconocido en p[uú]blico/i, "Se reconoció a alguien"],
    [/satisfacci[oó]n con tu profesor/i, "Vuestro Comandante"], [/satisfacci[oó]n con la asignatura/i, "La asignatura"],
    [/Comparada con otras asignaturas/i, "Comparada con otras"], [/forma de seguir esta asignatura/i, "Cómo se sigue"],
    [/duda sobre la actividad/i, "Sobre la actividad"], [/Alguna duda/i, "Dudas y comentarios"], [/qu[eé] esperas/i, "Qué esperáis"],
    [/lo mejor/i, "Lo mejor"], [/lo peor/i, "Lo peor"], [/comentario a tu profesor/i, "Para su Comandante"]];
  function corto(c) {
    for (var k = 0; k < CORTO.length; k++) if (CORTO[k][0].test(c)) return CORTO[k][1];
    var t = String(c || "").replace(/^(Valora la satisfacci[oó]n (con|sobre|de)( la| el)?|Valora la|Valora tu|¿C[oó]mo valorar[ií]as tus?|STARGATE · )\s*/i, "");
    t = t.replace(/[¿?]/g, "").trim();
    return t.charAt(0).toUpperCase() + t.slice(1, 52);
  }
  function campo(r, frag) { for (var k in r) if (k.indexOf(frag) >= 0) return r[k]; return ""; }

  /** De las respuestas en bruto a lo que se proyecta: el reparto de cada nota, los textos y cómo siguieron la clase. */
  function analizar(filas) {
    var notas = {}, orden = [], textos = [], seguido = { directo: 0, diferido: 0 };
    filas.forEach(function (x) { Object.keys(x.r).forEach(function (c) {
      var v = String(x.r[c] == null ? "" : x.r[c]).trim(); if (!v) return;
      if (/C[oó]mo has seguido/i.test(c)) { if (/DIRECTO/i.test(v)) seguido.directo++; else if (/diferido|grabaci/i.test(v)) seguido.diferido++; return; }
      if (ELIGE.test(c)) return;
      if (/^[1-5]$/.test(v)) { if (!notas[c]) { notas[c] = [0, 0, 0, 0, 0]; orden.push(c); } notas[c][Number(v) - 1]++; return; }
      if (v.length > 2) textos.push({ c: c, v: v, fila: x.fila, id: idTexto({ fila: x.fila, c: c }) });
    }); });
    var lista = orden.map(function (c) {
      var n = notas[c], total = n.reduce(function (a, b) { return a + b; }, 0);
      return { c: c, corto: corto(c), n: n, total: total,
               media: total ? n.reduce(function (a, b, i) { return a + b * (i + 1); }, 0) / total : 0,
               pct: n.map(function (x) { return total ? Math.round(x * 100 / total) : 0; }) };
    }).filter(function (x) { return x.total; });
    return { notas: lista, textos: textos, seguido: seguido };
  }
  /** El nombre de un comentario, estable entre visitas: su fila en la hoja y de qué pregunta sale. */
  function idTexto(x) { return "f" + (x.fila || 0) + "·" + corto(x.c).slice(0, 24); }

  /**
   * ¿Esta respuesta es del tema de la semana `i`? El formulario tiene una opción por tema y otra por actividad, y las
   * actividades viven DENTRO de un tema: «Actividad 1» cuenta para el tema 1.
   */
  function esDelTema(v, lista, i) {
    var s = lista[i]; if (!s) return true;
    var n = Number(s.tema_n) || 0, t = String(v || "").trim();
    if (!t) return false;
    if (n === 0) return /^Repaso/i.test(t) || /^Presentaci/i.test(t);
    if (new RegExp("^Tema\\s*" + n + "\\b").test(t)) return true;
    var m = t.match(/^Actividad\s*(\d)/i); if (!m) return false;
    for (var k = 0; k < lista.length; k++) if ((Number(lista[k].tema_n) || 0) === n && new RegExp("Actividad\\s*" + m[1] + "\\b", "i").test(String(lista[k].sub || ""))) return true;
    return false;
  }
  /** Las respuestas de un tema y de un Comandante (vacío = todos). */
  function deTema(filas, lista, i, comandante) {
    var yo = String(comandante || "").trim();
    var mias = yo ? filas.filter(function (x) { return String(campo(x.r, "profesor o profesora")).trim() === yo; }) : filas;
    if (!mias.length) mias = filas;
    var suyas = mias.filter(function (x) { return esDelTema(campo(x.r, "Selecciona el tema"), lista, i); });
    return suyas;
  }

  window.SG = window.SG || {};
  window.SG.TK = { pedir: pedir, limpiar: limpiar, corto: corto, analizar: analizar, esDelTema: esDelTema, deTema: deTema, idTexto: idTexto, campo: campo };
})();
