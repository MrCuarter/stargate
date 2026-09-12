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
    // Los identificadores que guarda la ficha son de documento («grupo__A1»); la Nave habla en
    // identificadores de STARGATE («A1»). Se traducen con lo que ya trajo el tablero.
    var misRetos = function (f) {
      var porDoc = {};
      ((crudo && crudo.misiones) || []).forEach(function (m) { porDoc[m.docId] = m.id; });
      // 🔴 Una LISTA de identificadores, no un objeto. Es la forma exacta que devolvía el motor
      // viejo (`retos: Object.keys(yo.retos)`) y la que espera la Nave. Devolver un objeto no daba
      // error visible: la pestaña de retos se quedaba vacía y en blanco, sin decir por qué.
      return (f.completedMissionIds || []).map(function (doc) { return porDoc[doc] || doc; });
    };
    var esperarTraductor = function () {
      return new Promise(function (ok) {
        var mira = function () {
          if (window.SG && window.SG.TABLERO && window.SG_CATALOGO) return ok();
          setTimeout(mira, 60);
        };
        mira();
      });
    };
    // Mi ficha en este grupo. Se pide más de una vez por visita, así que se guarda: cada consulta a
    // Firestore es una ida y vuelta, y aquí no cambia nada entre una y otra.
    var cacheFicha = {};
    var crudo = null;
    var olvidarFicha = function () { cacheFicha = {}; };
    var miFicha = function (M, per, yo) {
      var k = per + "|" + yo.uid;
      if (cacheFicha[k]) return Promise.resolve(cacheFicha[k]);
      return M.getDocs(M.query(M.collection(M.db, "student_profiles"),
        M.where("projectId", "==", per), M.where("userId", "==", yo.uid)))
        .then(function (r) {
          if (r.empty) return null;
          cacheFicha[k] = Object.assign({ id: r.docs[0].id }, r.docs[0].data());
          return cacheFicha[k];
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
      tablero: function (per, fresco) {
        // 🔴 El tablero público se cachea 30 s en el servidor, y eso es lo que salva una clase de
        // 200 mirándolo a la vez. Pero justo después de marcar un reto esa caché es veneno: el
        // alumno pulsa, se registra, y su Nave le sigue enseñando lo de antes. Quien acaba de
        // escribir pide fresco; los 200 que solo miran, no.
        return fetch(PUBLICA + "?per=" + encodeURIComponent(per) + (fresco ? "&t=" + Date.now() : ""))
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.error) return d;
            return esperarTraductor().then(function () {
              d.catalogo = window.SG_CATALOGO;
              crudo = d;   // hace falta abajo para saber QUÉ retos tiene uno mismo
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
            return window.SG.FUENTE.tablero(per, true).then(function (t) {
              return miFicha(M, per, yo).then(function (f) {
                if (!f) return { error: "Todavía no te has alistado en este grupo.", sinFicha: true };
                var yo_ = t.reclutas.filter(function (x) { return x.alias === f.displayName; })[0];
                // 🔴 A CADA CUAL, LO SUYO. El tablero público no dice qué retos concretos ha hecho
                // nadie —y así se queda—, pero uno tiene derecho a ver los suyos: es lo que la Nave
                // necesita para saber qué casillas pintar hechas y cuáles ofrecer para marcar.
                // Sale de la ficha de quien pregunta, no del tablero de todos.
                if (yo_) yo_.retos = misRetos(f);
                return { yo: yo_, correo: yo.correo, verificado: true };
              });
            });
          });
        }).catch(function (e) { return { error: e.message }; });
      },
      /**
       * Las escrituras.
       *
       * El motor viejo tenía un solo buzón —«accion»— y el Apps Script decidía dentro. Aquí cada
       * cosa va por su camino: lo que mueve dinero, al servidor; lo que es puro disfraz, directo.
       *
       * 🔴 Y esa diferencia no es de estilo. Las reglas de Firestore PROHÍBEN que el navegador
       * escriba experiencia, monedas o inventario, así que registrar un reto tiene que pasar por
       * `completeMission` aunque sea más largo de escribir. Lo cosmético (qué figura llevas puesta)
       * sí lo escribe el navegador: falsearlo solo te cambia el disfraz a ti.
       */
      accion: function (cuerpo) {
        return esperar().then(function (M) {
          return M.sesion().then(function (yo) {
            if (!yo) return { error: "Entra con tu cuenta para poder hacer eso." };
            return miFicha(M, cuerpo.per, yo).then(function (ficha) {
              if (!ficha) return { error: "Todavía no te has alistado en este grupo." };

              // Lo que se escriba deja la ficha guardada obsoleta: se tira sin contemplaciones.
              olvidarFicha();
              if (cuerpo.accion === "registrar") {
                return M.getDocs(M.query(M.collection(M.db, "missions"),
                  M.where("projectId", "==", cuerpo.per), M.where("stargateId", "==", cuerpo.reto)))
                  .then(function (r) {
                    if (r.empty) return { error: "Ese reto no existe en tu grupo." };
                    var mid = r.docs[0].id;
                    // 🔴 `entregas` NO es donde va el enlace de evidencia. El servidor espera ahí un
                    // objeto con una entrada por cada «entregable» declarado en la misión, y las
                    // nuestras no declaran ninguno: mandarle una cadena hacía reventar la función
                    // con un «INTERNAL» que no decía absolutamente nada. La evidencia tiene su
                    // propio sitio —`mission_deliveries`— y ahí es donde la busca el profesorado.
                    return M.llamar("completeMission",
                      { projectId: cuerpo.per, missionId: mid, studentProfileId: ficha.id })
                      .then(function () {
                        var ev = String(cuerpo.evidencia || "").trim();
                        if (!ev) return { ok: true };
                        // Si la evidencia falla, el reto YA está registrado y así se queda: perder
                        // el enlace es molesto, perder el reto es injusto.
                        return M.setDoc(M.doc(M.db, "mission_deliveries", mid + "__" + ficha.id), {
                          projectId: cuerpo.per, missionId: mid, studentProfileId: ficha.id,
                          userId: yo.uid, stargateReto: cuerpo.reto, enlace: ev, createdAt: Date.now()
                        }).then(function () { return { ok: true }; })
                         .catch(function () { return { ok: true, avisoEvidencia: true }; });
                      });
                  });
              }

              if (cuerpo.accion === "vestir")
                return M.updateDoc(M.doc(M.db, "student_profiles", ficha.id),
                  { stargateViste: cuerpo.viste || "" }).then(function () { return { ok: true }; });

              /**
               * Canjear. Y si lo canjeado es un SOBRE, abrirlo en el mismo gesto.
               *
               * 🔴 En el motor un sobre es un consumible: se compra y luego se usa. Para el recluta
               * eso serían dos pasos y una pregunta («¿y ahora qué hago con esto?») donde antes
               * había uno. El catálogo lo promete así de claro —«se abre solo y tu álbum está en la
               * Nave»— y una promesa del catálogo no se rompe por una comodidad de implementación.
               */
              if (cuerpo.accion === "canje")
                return M.llamar("purchaseReward", { projectId: cuerpo.per, rewardId: cuerpo.recompensa,
                  studentProfileId: ficha.id })
                  .then(function () {
                    if (!cuerpo.abrir) return { ok: true };
                    return M.llamar("consumeItem", { projectId: cuerpo.per, rewardId: cuerpo.recompensa,
                      studentProfileId: ficha.id })
                      .then(function (r) { return { ok: true, botin: r && (r.botin || r.obtenido || null) }; })
                      // Si el sobre no se abre, ya está comprado y sigue en el inventario: se avisa,
                      // no se pierde nada y se puede abrir después.
                      .catch(function () { return { ok: true, sinAbrir: true }; });
                  });

              return { error: "Todavía no sé hacer eso con el motor nuevo: " + cuerpo.accion };
            });
          });
        }).catch(function (e) { return { error: e.message }; });
      }
    };
  }

  window.SG = window.SG || {};
  window.SG.FUENTE = CUAL === "firestore" ? firestore() : apps();
})();
