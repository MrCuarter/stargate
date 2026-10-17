/**
 * GAMIFICAPRO · RESPUESTAS QUE APORTAN (17-oct-2026) — pieza del motor para proyectar lo que escribió el alumnado (el ticket
 * de salida, «Lo que escribisteis»; vale para cualquier texto libre que se enseñe en clase).
 *
 * Norberto, 17-oct: «quita sola las respuestas que no aportan («No.», «Ninguna», «De momento no»…); no enseñar ninguna respuesta
 * de menos de 3 palabras. El "Y 65 más" tiene que contar solo las que pasan el filtro». Antes salían tal cual y la diapositiva
 * se llenaba de «No.» y «Ninguna». Cada web la copia en su build (assets/js/respuestasUtiles.js, con `guardas.copiar_pieza`) y
 * NO se edita allí: aquí.
 *
 *   GP.respuestasUtiles.palabras(t)         → nº de palabras (las letras y números sueltos cuentan; los signos, no)
 *   GP.respuestasUtiles.sinAporte(t)        → true si es una negativa o un «nada que decir»: «No», «Ninguna», «De momento no»,
 *                                             «No tengo dudas», «Nada que añadir», «Todo bien»… (cortas: hasta 6 palabras)
 *   GP.respuestasUtiles.util(t, minimo)     → true si aporta: tiene `minimo` palabras (3 por defecto) y no es un «nada que decir»
 *   GP.respuestasUtiles.filtrar(lista, o)   → la lista sin lo que no aporta, en su orden. o = { texto: fn(x) → string (por
 *                                             defecto x.t, luego x.v), minimo, salvar: fn(x) → true para lo que el docente fijó
 *                                             (esas salen siempre) }
 *
 * Solo mira el texto; no guarda nada y no toca los datos: lo que se filtra sigue en el ticket (y el docente lo ve en su Nave).
 * Prueba: tests/sdk/respuestasUtiles.test.ts.
 */
(function () {
  var MINIMO = 3;

  function limpia(t) {
    return String(t == null ? "" : t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9ñ\s]/g, " ").replace(/\s+/g, " ").trim();
  }
  function palabras(t) {
    var l = limpia(t);
    return l ? l.split(" ").length : 0;
  }
  // Una negativa sola («no», «ninguna», «nada», «ni idea», «de momento no», «todo bien»…)…
  var SOLA = /^(?:(?:de momento|por ahora|por el momento|ahora mismo|hasta ahora|de momento por ahora)\s+)?(?:no|nop|nada|ninguna?|ninguno|ni idea|todo (?:bien|ok|genial|perfecto|correcto)|sin (?:dudas?|comentarios?|nada)|n a|na|nope|bien|ok|vale|gracias|no gracias|no sabe no contesta|ns nc)(?:\s+(?:de momento|por ahora|por el momento|gracias))?$/;
  // …o «no tengo dudas», «nada que añadir», «ninguna duda por ahora»: negativa + el tipo de cosa que se pedía.
  var CON_COSA = /^(?:no|nada|ninguna?|ninguno)\b.*\b(?:dudas?|comentarios?|preguntas?|sugerencias?|observaciones?|anadir|decir|comentar|mejorar|destacar|aportar|mencionar)\b/;
  function sinAporte(t) {
    var l = limpia(t);
    if (!l) return true;
    if (SOLA.test(l)) return true;
    return l.split(" ").length <= 6 && CON_COSA.test(l);
  }
  function util(t, minimo) {
    var m = Number(minimo); if (!(m >= 1)) m = MINIMO;
    return palabras(t) >= m && !sinAporte(t);
  }
  function filtrar(lista, o) {
    o = o || {};
    var texto = typeof o.texto === "function" ? o.texto : function (x) { return x && (x.t != null ? x.t : x.v); };
    return (Array.isArray(lista) ? lista : []).filter(function (x) {
      return (typeof o.salvar === "function" && o.salvar(x)) || util(texto(x), o.minimo);
    });
  }

  var pieza = { MINIMO: MINIMO, palabras: palabras, sinAporte: sinAporte, util: util, filtrar: filtrar };
  if (typeof window !== "undefined") { window.GP = window.GP || {}; window.GP.respuestasUtiles = pieza; }
  if (typeof module === "object" && module.exports) module.exports = pieza;
})();
