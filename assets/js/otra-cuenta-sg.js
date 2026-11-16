/**
 * STARGATE · ¿YA TE ALISTASTE Y NO VES TU CLASE? (16-nov-2026). La piel de la pieza del motor (GamificaPro sdk/otraCuenta.js,
 * `GP.otraCuenta`; el servidor, `modPistaCuenta`).
 *
 * Clase en directo de PER 16450: tres reclutas tenían ficha, pero entraban con otra cuenta de Google y la web les pedía el código
 * de clase. Norberto: una línea fija («Hay un 99 % de probabilidades de que estés en otra cuenta») y una ayuda para encontrarla:
 * PER y alias, el avatar y, al pulsarlo, una parte del correo; y un botón para salir y entrar con esa cuenta.
 *
 *   SG.ayudaOtraCuenta(hueco, { per, nombreGrupo, correo, alEntrar })
 *     · hueco        dónde va la línea (con su botón «Encontrar mi cuenta»)
 *     · per          el grupo, si ya se sabe (la Nave y alistarse lo traen en la URL); sin él, se pregunta el PER
 *     · correo       la cuenta con la que ha entrado (para decírselo)
 *     · alEntrar     qué hacer después de elegir la otra cuenta en Google (de serie, recargar)
 * Se pinta en: la puerta (entrar.js, el paso del código), alistarse (alistarse.js, el código), la Nave sin ficha (recluta.js) y la
 * sesión (sesion.js, «esas credenciales no coinciden»). Sin la pieza cargada no pinta nada; sin la función desplegada, la ventana lo
 * dice y deja «Entrar con otra cuenta».
 */
(function () {
  window.SG = window.SG || {};
  function motor() { return window.SG && window.SG.MOTOR; }
  /** «16450», «PER 16450», «per-16450» → «per-16450». */
  function grupoDeTexto(t) {
    var s = String(t || "").trim().toLowerCase();
    if (/^per-[a-z0-9_-]{1,40}$/.test(s)) return s;
    var m = /(\d{4,6})/.exec(s);
    return m ? "per-" + m[1] : "";
  }
  function avatar(r) {
    try { return window.SG.avatarSrc(r.avatar || {}, String(r.alias || ""), Number(r.xp) || 0).src || ""; } catch (e) { return ""; }
  }
  function llamar(nombre, datos) {
    var M = motor();
    return M && M.llamar ? M.llamar(nombre, datos) : Promise.reject(new Error("sin motor"));
  }
  /** El selector de cuentas de Google (motor.js pide siempre `select_account`); elegida, a donde diga la página. */
  function entrarConOtra(alEntrar) {
    var M = motor();
    if (!M || !M.entrar) { location.href = "entrar.html"; return; }
    M.entrar().then(function () { if (alEntrar) alEntrar(); else location.reload(); }, function () { /* cerró la ventana de Google */ });
  }
  window.SG.otraCuentaGrupo = grupoDeTexto;
  window.SG.ayudaOtraCuenta = function (hueco, o) {
    if (!hueco || !window.GP || !window.GP.otraCuenta) return null;
    o = o || {};
    var A = window.GP.otraCuenta.crear({
      llamar: llamar, grupo: o.per || "", nombreGrupo: o.nombreGrupo || "", grupoDeTexto: grupoDeTexto, correo: o.correo || "",
      avatar: avatar, entrarConOtra: function () { entrarConOtra(o.alEntrar); },
      clases: { boton: "btn primary", secundario: "btn" },
      textos: {
        titulo: "Encuentra la cuenta con la que te alistaste",
        grupo: "Tu PER (el número de tu clase)",
        grupoEjemplo: "Por ejemplo, 16450",
        alias: "Tu alias de recluta (si te acuerdas)",
        vacio: "No hay más reclutas en este grupo.",
        noPista: "No puedo darte la pista de ese avatar. Si es el tuyo, díselo a tu Comandante.",
        "sin-grupo": "No encuentro ese PER. Mira el número de tu clase (por ejemplo, 16450).",
        "ya-estas": "Con esta cuenta ya estás en ese grupo: entra en tu Nave.",
      },
    });
    A.montar(hueco);
    return A;
  };
})();
