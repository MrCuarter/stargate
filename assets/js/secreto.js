/**
 * STARGATE · LA PALABRA DE UN RETO SECRETO (15-sep-2026)
 *
 * S7: «En la presentación del planeta Vínculo hay un enlace que no debería estar ahí. Encuéntralo,
 * resuelve el enigma que esconde y trae la PALABRA que Vaeon borró».
 *
 * 🔴 En el motor viejo la palabra la exigía el formulario de Google (PALABRA_HUEVO, Datos.gs). En el
 * nuevo nadie la pedía: S7 salía en «Mis retos» con su «Lo he hecho» y se regalaba con un clic
 * (150 xp y una insignia legendaria). Ahora la piden la Nave, validar.html y el propio enigma.
 *
 * La web no lleva la palabra escrita en ningún sitio: solo su huella (SG_SECRETOS, SHA-256 de la
 * palabra en mayúsculas y sin tildes). Vale si la palabra aparece entre otras (con su apellido), como
 * en el formulario de antes.
 */
(function () {
  "use strict";
  function palabras(t) {
    return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase()
      .split(/[^A-Z]+/).filter(Boolean);
  }
  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  function huella(p) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode(p)).then(hex); }
  function esSecreto(reto) { return !!(window.SG_SECRETOS || {})[reto]; }
  /** De lo escrito, cuál es la palabra (Promesa de la palabra en mayúsculas, o '' si no está). */
  function cual(reto, texto) {
    var h = (window.SG_SECRETOS || {})[reto], ps = palabras(texto);
    if (!h || !ps.length || !window.crypto || !crypto.subtle) return Promise.resolve("");
    return Promise.all(ps.map(huella)).then(function (hs) { var i = hs.indexOf(h); return i >= 0 ? ps[i] : ""; }, function () { return ""; });
  }
  /** ¿Trae la palabra? (Promesa de true/false; un reto que no es secreto, siempre true.) */
  function comprobar(reto, texto) {
    if (!(window.SG_SECRETOS || {})[reto]) return Promise.resolve(true);
    return cual(reto, texto).then(function (p) { return !!p; });
  }
  // La palabra que resuelve el enigma viaja a validar.html (la misma web, otra página) por el
  // almacén del navegador, dos horas como mucho; al registrarse el reto, se borra.
  function guardar(reto, texto) {
    try { localStorage.setItem("sgSecreto:" + reto, JSON.stringify({ t: String(texto || ""), f: Date.now() })); } catch (e) {}
  }
  function traida(reto) {
    try {
      var x = JSON.parse(localStorage.getItem("sgSecreto:" + reto) || "null");
      if (x && Date.now() - x.f < 72e5) return x.t;
    } catch (e) {}
    return "";
  }
  function olvidar(reto) { try { localStorage.removeItem("sgSecreto:" + reto); } catch (e) {} }
  window.SG_SECRETO = { esSecreto: esSecreto, comprobar: comprobar, cual: cual, guardar: guardar, traida: traida,
                        olvidar: olvidar, palabras: palabras };
})();
