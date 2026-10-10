/**
 * GAMIFICAPRO · EL PARTE DEL TICKET, EN LÍNEAS (11-oct-2026) — pieza del motor para cualquier mod con ticket de salida.
 *
 * El servidor (`modTicket({ accion: 'parte' })`, functions/modTicketParte.js) da cómo va el ticket de un tema, escuadrón por
 * escuadrón: [{ firma, respuestas, fichas, meta, umbral, llega, cobrado }] (en DPG, uno solo: la columna entera, sin firma).
 * Esta pieza lo pinta igual en todas las webs: «Tu escuadrón: 15 de 76 · la raya, 25 %», con su barra y LA RAYA. Hasta el
 * 10-oct estaba escrito dos veces (STARGATE, `SG.TK.lineasParte` en tkcomun.js y la frase de recluta.js; DPG, `lineaParte` en
 * tickets.js), con las mismas cuentas. Cada web la copia en su build (assets/js/parte.js, con `guardas.copiar_pieza`) y NO se
 * edita allí: aquí. La piel, con `clase` (el prefijo de las clases: STARGATE «tkp», DPG «tk-parte»; sin él, «gpp»).
 *
 *   GP.parte.raya(e)              → dónde va la raya, en % de las fichas del escuadrón: su umbral (con el mínimo de 3 y el
 *                                   redondeo hacia arriba del servidor), no su meta. Si el tema ya se cobró, el servidor da la
 *                                   meta con la que se juzgó, así que la raya es la que había que pasar.
 *   GP.parte.cifras(e)            → { firma, n, total, pct, meta (%), raya (%), llega }: nunca más respuestas que fichas
 *   GP.parte.barra(c, clase)      → la barra con su raya (de unas `cifras`)
 *   GP.parte.frase(c, quien)      → «quien: <b>15 de 76</b> · la raya, 25 %» (o «¡ya pasó la raya (25 %)!»). `quien` es HTML.
 *   GP.parte.linea(e, quien, clase) → la frase y la barra, juntas (la Marcha de DPG)
 *   GP.parte.lineas(esc, o)       → una fila por escuadrón: «Escuadrón de L. Carlota · Comandante L. Carlota · 34 de 86», la
 *                                   barra y la raya. o = { mio: la firma de quien mira (sale primera y destacada), nombres:
 *                                   { firma: nombre del escuadrón }, columna: deja pasar el que no tiene firma (con `titulo`,
 *                                   «La clase»), clase, textos: { de, jefe, tuyo, pasada } }. Los escuadrones sin fichas o sin
 *                                   Comandante (firma vacía) no salen.
 * Solo recuentos: nada de lo que se contestó. Prueba: tests/sdk/parte.test.ts (letra por letra lo que pintaban las dos webs).
 */
(function () {
  var TEXTOS = { de: "Escuadrón de ", jefe: "Comandante ", tuyo: "El tuyo · ", pasada: "¡pasó la raya!" };

  function escH(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function raya(e) {
    var total = e ? Math.max(0, Number(e.fichas) || 0) : 0;   // (con fichas negativas, que el servidor nunca da, al 100 %, como en DPG)
    return total ? Math.min(100, Math.round(Number(e.umbral) * 1000 / total) / 10) : 100;
  }
  function cifras(e) {
    var total = Math.max(0, Number(e.fichas) || 0), n = Math.min(Math.max(0, Number(e.respuestas) || 0), total);
    return { firma: e.firma, n: n, total: total, pct: total ? Math.round(n * 100 / total) : 0, meta: Math.round((Number(e.meta) || 0) * 100),
      raya: raya(e), llega: !!e.llega };
  }
  function barra(c, clase) {
    return '<span class="' + (clase || "gpp") + "-bar" + (c.llega ? " llega" : "") + '" role="img" aria-label="' + c.n + " de " + c.total + "; la raya, en el " + c.meta + ' %">'
      + '<i style="width:' + c.pct + '%"></i><s style="left:' + c.raya + '%"></s></span>';
  }
  function frase(c, quien) {
    return quien + ": <b>" + c.n + " de " + c.total + "</b> · " + (c.llega ? "¡ya pasó la raya (" + c.meta + " %)!" : "la raya, " + c.meta + " %");
  }
  function linea(e, quien, clase) {
    var c = cifras(e);
    return '<span class="' + (clase || "gpp") + '-l"><span>' + frase(c, quien) + "</span>" + barra(c, clase) + "</span>";
  }
  function lineas(esc, o) {
    o = o || {};
    var k = o.clase || "gpp", T = {}, x;
    for (x in TEXTOS) T[x] = (o.textos && o.textos[x] != null) ? o.textos[x] : TEXTOS[x];
    var quitaJefe = new RegExp("^" + T.jefe.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s+", "i");
    var L = (esc || []).filter(function (e) { return e && Number(e.fichas) > 0 && (o.columna || String(e.firma || "").trim()); }).map(cifras);
    L.sort(function (a, b) { return (b.firma === o.mio) - (a.firma === o.mio) || String((o.nombres || {})[a.firma] || a.firma).localeCompare(String((o.nombres || {})[b.firma] || b.firma), "es"); });
    return L.map(function (c) {
      var nom = (o.nombres || {})[c.firma], cmd = String(c.firma || "").replace(quitaJefe, "");
      return '<div class="' + k + "-f" + (c.firma === o.mio ? " mio" : "") + '">'
        + '<span class="' + k + '-n"><b>' + escH(o.columna ? (o.titulo || "La clase") : (nom || T.de + cmd)) + "</b>"
        + (o.columna ? "" : "<em>" + (c.firma === o.mio ? T.tuyo : "") + T.jefe + escH(cmd) + "</em>") + "</span>"
        + '<span class="' + k + '-c"><b>' + c.n + "</b> de " + c.total + "<em>" + (c.llega ? T.pasada : "la raya, " + c.meta + " %") + "</em></span>"
        + barra(c, k) + "</div>";
    }).join("");
  }

  var parte = { raya: raya, cifras: cifras, barra: barra, frase: frase, linea: linea, lineas: lineas };
  if (typeof window !== "undefined") { window.GP = window.GP || {}; window.GP.parte = parte; }
  if (typeof module === "object" && module.exports) module.exports = parte;
})();
