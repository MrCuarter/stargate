/**
 * STARGATE · DE DÓNDE SALEN LOS DATOS
 *
 * La Nave, la sala de clase y el panel piden siempre lo mismo —el tablero de un PER, la ficha de
 * alguien, una escritura— y hasta hoy lo pedían siempre al mismo sitio: el Apps Script. Este módulo
 * pone un interruptor en medio.
 *
 * 🔴 Es la pieza que convierte el cambio de motor en algo reversible. Las páginas no saben con
 * quién hablan; si el motor nuevo diera problemas, se vuelve al viejo cambiando una palabra, sin
 * tocar una sola línea de la Nave. Un cambio grande que no se puede deshacer no es un cambio: es
 * una apuesta.
 *
 * Las dos fuentes devuelven EXACTAMENTE la misma forma de objeto. Eso no es casualidad: es el
 * trabajo del traductor (motor/tablero.js) y lo que comprueba la batería 54 comparando los dos
 * motores con los mismos hechos.
 */
(function () {
  "use strict";
  var API = (window.SG_TABLERO_API || "").trim();
  var q = new URLSearchParams(location.search);
  // El interruptor: la web entera (SG_MOTOR), o solo esta visita (?motor=firestore), que es como se
  // prueba el motor nuevo sin arriesgar nada de lo que ya funciona.
  var CUAL = (q.get("motor") || window.SG_MOTOR || "apps").toLowerCase();
  var PUBLICA = (window.SG_API_PUBLICA ||
    "https://us-central1-gamificapro-99e0a.cloudfunctions.net/tableroStargate");

  // ---------------------------------------------------------------- el motor viejo: Apps Script
  function apps() {
    var pedir = function (url) {
      return fetch(url, { redirect: "follow" }).then(function (r) { return r.json(); });
    };
    var enviar = function (cuerpo) {
      return fetch(API, { method: "POST", redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(cuerpo) })
        .then(function (r) { return r.json(); });
    };
    return {
      nombre: "apps",
      lista: function () { return pedir(API + "?per=all"); },
      tablero: function (per) { return pedir(API + "?per=" + encodeURIComponent(per)); },
      quien: function (per, quien_) {
        return enviar(quien_ && quien_.token
          ? { accion: "quien", per: per, token: quien_.token }
          : { accion: "quien", per: per, email: String(quien_ || "") });
      },
      accion: enviar
    };
  }

  // ---------------------------------------------------------------- el motor nuevo: Firestore
  function firestore() {
    // El traductor y el catálogo son ficheros normales; la puerta pública no necesita Firebase, así
    // que un tablero incrustado se pinta sin cargar el SDK entero.
    var esperarTraductor = function () {
      return new Promise(function (ok) {
        var mira = function () {
          if (window.SG && window.SG.TABLERO && window.SG_CATALOGO) return ok();
          setTimeout(mira, 60);
        };
        mira();
      });
    };
    var esperar = function () {
      return new Promise(function (ok) {
        if (window.SG && window.SG.MOTOR) return ok(window.SG.MOTOR);
        document.addEventListener("sg:motor", function () { ok(window.SG.MOTOR); });
      });
    };
    return {
      nombre: "firestore",
      lista: function () {
        // Sin sesión no se puede listar nada: Firestore no contesta a quien no ha entrado. Es
        // deliberado y es una mejora — el listado de grupos del motor viejo era público.
        return esperar().then(function (M) {
          return M.sesion().then(function (yo) {
            if (!yo) return { pers: [], necesitaSesion: true };
            return M.misPERs(yo.correo).then(function (ps) {
              return { pers: ps.map(function (p) { return { id: p.id, nombre: p.nombre, tipo: p.stargate.tipo }; }) };
            });
          });
        });
      },
      /**
       * El tablero público.
       *
       * 🔴 NO se lee de Firestore directamente, y no es un capricho: el tablero vive incrustado en
       * las presentaciones de Genially del profesorado, donde no hay sesión de nadie —lo mira una
       * clase entera con el proyector puesto—. Las reglas de Firestore exigen haber entrado, así que
       * leerlo desde el navegador rompería todos los Geniallys del curso. Hay una puerta pública de
       * solo lectura en el servidor (`tableroStargate`) que devuelve lo que ya era público: alias,
       * experiencia, insignias y avatar. Ni un nombre ni un correo.
       *
       * Y devuelve los documentos en crudo: la aritmética la hace el traductor, que vive en un solo
       * sitio. Dos copias de las mismas cuentas es garantizar que un día dicen cosas distintas.
       */
      tablero: function (per) {
        return fetch(PUBLICA + "?per=" + encodeURIComponent(per))
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.error) return d;
            return esperarTraductor().then(function () {
              d.catalogo = window.SG_CATALOGO;
              return window.SG.TABLERO.tablero(d, false);
            });
          })
          .catch(function (e) { return { error: "No he podido leer el grupo: " + e.message }; });
      },
      /**
       * La ficha de quien pregunta.
       *
       * 🔴 Aquí ya no hace falta el truco del token: con Firebase, quien pide los datos ES quien ha
       * iniciado sesión, y el servidor lo sabe sin que nadie se lo diga. El correo tecleado, que en
       * el motor viejo había que verificar contra Google para que nadie mirara la ficha del vecino,
       * simplemente deja de existir.
       */
      quien: function (per) {
        return esperar().then(function (M) {
          return M.sesion().then(function (yo) {
            if (!yo) return { error: "Entra con tu cuenta de Google para ver tu ficha." };
            return window.SG.FUENTE.tablero(per).then(function (t) {
              return M.getDocs(M.query(M.collection(M.db, "student_profiles"),
                M.where("projectId", "==", per), M.where("userId", "==", yo.uid)))
                .then(function (r) {
                  if (r.empty) return { error: "Todavía no te has alistado en este grupo.", sinFicha: true };
                  var alias = r.docs[0].data().displayName;
                  var yo_ = t.reclutas.filter(function (x) { return x.alias === alias; })[0];
                  return { yo: yo_, correo: yo.correo, verificado: true };
                });
            });
          });
        }).catch(function (e) { return { error: e.message }; });
      },
      accion: function (cuerpo) {
        return esperar().then(function (M) { return M.llamar(cuerpo.accion, cuerpo); })
          .catch(function (e) { return { error: e.message }; });
      }
    };
  }

  window.SG = window.SG || {};
  window.SG.FUENTE = CUAL === "firestore" ? firestore() : apps();
})();
