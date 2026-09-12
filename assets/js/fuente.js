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
    /**
     * CUÁNDO registró cada reto. La Nave lo pinta desde el principio —«✓ Registrado · 12/09/2026»—
     * pero NINGÚN motor lo producía: ni el viejo ni este. La fecha no salía nunca y nadie lo notó,
     * porque un campo que falta no deja hueco, simplemente no escribe nada.
     * Aquí sí se puede: los sellos de tiempo están en `missionTimestamps`, indexados por el id de
     * DOCUMENTO («grupo__A1»), y hay que traducirlos al id corto que usa la Nave.
     */
    var misFechas = function (f) {
      var porDoc = {};
      ((crudo && crudo.misiones) || []).forEach(function (m) { porDoc[m.docId] = m.id; });
      var sellos = f.missionTimestamps || {}, fechas = {};
      Object.keys(sellos).forEach(function (doc) {
        var marcas = sellos[doc] || [];
        if (!marcas.length) return;
        var ultima = marcas[marcas.length - 1];
        // Firestore devuelve Timestamp; de una exportación puede llegar una cadena o un número.
        var d = ultima && ultima.toDate ? ultima.toDate() : new Date(ultima);
        if (isNaN(d.getTime())) return;
        fechas[porDoc[doc] || doc] = d.toISOString().slice(0, 10);
      });
      return fechas;
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
    /**
     * LO QUE PIDE LA SALA DEL DOCENTE.
     *
     * `clase.html` llevaba trece peticiones sin traducir y enseñaba un cartel de «esta sala todavía
     * no habla con el motor nuevo». No eran trece problemas: eran uno. Todas pasan por el mismo
     * buzón que usa el alumnado, y ese buzón empezaba buscando la ficha de recluta de quien
     * pregunta. Un docente no tiene ficha en su propio grupo, así que recibía «todavía no te has
     * alistado» a todo.
     *
     * 🔴 Aquí NO se comprueba quién manda. Parece un descuido y es lo contrario: quien decide es
     * Firestore, que sabe si tu correo está en `coTeacherEmails` y no se puede engañar desde el
     * navegador. Una comprobación aquí daría sensación de puerta sin serlo, que es peor que no
     * tenerla — la lección del PIN del motor viejo.
     */
    var SEMANA_MS = 7 * 24 * 3600 * 1000;
    var semanaDe = function (inicio) {
      if (!inicio) return null;
      var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      return Math.floor((hoy - new Date(inicio + "T00:00:00")) / SEMANA_MS) + 1;
    };
    /**
     * EL TABLERO CON LO PRIVADO. No es `FUENTE.tablero`, y la diferencia costó una prueba en falso.
     *
     * 🔴 `FUENTE.tablero(per, fresco)` sale por la puerta PÚBLICA del servidor, que no manda correos
     * ni nombres ni el detalle de los retos de nadie — es la que usan los Geniallys proyectados, sin
     * sesión. Su segundo argumento es «sáltate la caché», no «tráeme lo privado». Pedirle datos
     * privados devuelve fichas sin correo y sin identificador, en silencio.
     *
     * El puesto de mando lee por la otra puerta: Firestore directamente, con la sesión del docente,
     * y Firestore decide si le deja. Es la misma lectura que hace la consola del referente.
     */
    var tableroPrivado = function (M, per) {
      return M.leerPER(per, true).then(function (datos) {
        return window.SG.TABLERO.tablero(datos, true);
      });
    };
    // La ficha de un recluta por su correo. El correo vive en la subcolección privada, así que hay
    // que pasar por el tablero con privados: es la única lectura que lo trae.
    var fichaPorCorreo = function (M, per, correo) {
      return tableroPrivado(M, per).then(function (t) {
        var c = String(correo || "").toLowerCase().trim();
        var r = (t.reclutas || []).filter(function (x) { return String(x.email || "").toLowerCase() === c; })[0];
        if (!r) throw new Error("No encuentro a nadie con ese correo en el grupo");
        if (!r.ficha) throw new Error("Esa ficha no trae identificador: recarga la sala");
        return r;
      });
    };
    var DOCENTE = {
      /**
       * Mis grupos. El motor viejo miraba una hoja con todos y tachaba los ajenos; aquí Firestore
       * solo devuelve aquellos en cuyo `coTeacherEmails` está tu correo, así que la lista ya llega
       * filtrada por el servidor y no hay nada que tachar.
       */
      pers: function (M, yo) {
        return M.misPERs(yo.correo).then(function (ps) {
          var mio = "";
          var pers = ps.map(function (p) {
            var S = p.stargate || {};
            (S.docentes || []).forEach(function (d) {
              // El nombre con el que firmas los ajustes sale de tu correo, no de un desplegable:
              // así nadie puede otorgarse retos firmando con el nombre de un compañero.
              if (String(d.correo || "").toLowerCase() === yo.correo && !mio) mio = d.nombre;
            });
            return { id: p.id, nombre: p.nombre, tipo: S.tipo || "REGULAR", inicio: S.inicio || "",
                     semana: semanaDe(S.inicio), archivado: S.archivado ? "sí" : "",
                     docentes: (S.docentes || []).map(function (d) {
                       return { nombre: d.nombre, rol: d.rol, panel: (S.paneles || {})[d.nombre] || "" }; }) };
          });
          // 🔴 El nombre puede no estar en el proyecto abierto: los correos del equipo viven en
          // `privado`, que solo lee el profesorado. Si el listado no lo trajo, se pregunta allí.
          if (mio || !pers.length) return { pers: pers, demo: [], yo: { correo: yo.correo, nombre: mio, encontrado: !!pers.length } };
          return Promise.all(pers.map(function (p) {
            return M.getDoc(M.doc(M.db, "projects", p.id, "privado", "stargate"))
              .then(function (d) { return d.exists() ? d.data() : null; }).catch(function () { return null; });
          })).then(function (privs) {
            privs.forEach(function (pr) {
              ((pr && pr.docentes) || []).forEach(function (d) {
                if (String(d.correo || "").toLowerCase() === yo.correo && !mio) mio = d.nombre; });
            });
            return { pers: pers, demo: [], yo: { correo: yo.correo, nombre: mio, encontrado: true } };
          });
        });
      },

      // El tablero entero con lo privado. Es la misma lectura que hace la consola: una sola.
      alumnos: function (M, yo, q) { return tableroPrivado(M, q.per); },

      /**
       * Otorgar o anular un reto a mano. Lo que en la hoja era apuntar una fila en AJUSTES aquí
       * mueve la experiencia de verdad, con su asiento en el libro del motor.
       */
      ajuste: function (M, yo, q) {
        return fichaPorCorreo(M, q.per, q.email).then(function (r) {
          var dar = String(q.tipo || "") === "dar";
          return (dar ? M.otorgarReto(q.per, r.ficha, q.reto_id)
                      : M.anularReto(q.per, r.ficha, q.reto_id, q.motivo || "desde la sala"))
            .then(function () { return { ok: true }; });
        });
      },

      /**
       * Corregir la ficha de alguien: el alias que sale en el tablero, su nombre real, de quién es
       * alumno y el enlace de su Bitácora.
       *
       * 🔴 Va a DOS sitios a propósito. El alias y el Comandante son públicos —los ve la clase—; el
       * nombre, los apellidos y la Bitácora viven en la subcolección privada, que el alumnado ajeno
       * no puede leer. Escribirlo todo junto en el documento abierto habría tirado por tierra la
       * separación que costó montar.
       */
      ficha: function (M, yo, q) {
        return fichaPorCorreo(M, q.per, q.email).then(function (r) {
          var publico = {}, privado = {}, tocados = [];
          if (q.alias !== undefined && q.alias !== r.alias) { publico.displayName = q.alias; tocados.push("alias"); }
          if (q.profe !== undefined && q.profe !== r.profe) { publico.stargateProfe = q.profe; tocados.push("profe"); }
          if (q.nombre !== undefined) { privado.firstName = q.nombre; tocados.push("nombre"); }
          if (q.apellidos !== undefined) { privado.lastName = q.apellidos; tocados.push("apellidos"); }
          if (q.bitacora !== undefined) { privado.bitacora = q.bitacora; tocados.push("bitacora"); }
          // Cambiar de Comandante cambia de escuadrón: el emblema tiene que seguir al alumno o el
          // tablero enseñaría un escudo que ya no es el suyo.
          var pasos = [];
          if (publico.stargateProfe !== undefined) {
            pasos.push(M.getDoc(M.doc(M.db, "projects", q.per)).then(function (pd) {
              var f = ((pd.data() || {}).factions || []).filter(function (x) { return x.teacherName === q.profe; })[0];
              publico.squadId = f ? f.id : null; publico.factionId = f ? f.id : null;
            }));
          }
          return Promise.all(pasos).then(function () {
            var escrituras = [];
            if (Object.keys(publico).length)
              escrituras.push(M.updateDoc(M.doc(M.db, "student_profiles", r.ficha), publico));
            if (Object.keys(privado).length)
              escrituras.push(M.setDoc(M.doc(M.db, "student_profiles", r.ficha, "privado", "datos"), privado, { merge: true }));
            return Promise.all(escrituras).then(function () { return { ok: true, tocados: tocados }; });
          });
        });
      },

      // El Genially propio de cada docente, que sustituye al oficial en su sala.
      mi_panel: function (M, yo, q) {
        return M.getDoc(M.doc(M.db, "projects", q.per)).then(function (pd) {
          var S = (pd.data() || {}).stargate || {}, paneles = Object.assign({}, S.paneles || {});
          var nombre = String(q.profe || "").trim();
          if (!nombre) return { ok: false, error: "No sé quién eres en este grupo." };
          if (String(q.url || "").trim()) paneles[nombre] = String(q.url).trim();
          else delete paneles[nombre];
          return M.updateDoc(M.doc(M.db, "projects", q.per), { "stargate.paneles": paneles })
            .then(function () { return { ok: true, panel: String(q.url || "").trim() }; });
        });
      },

      // La cola de subidas de nota. El tablero ya la trae: no hay que volver a preguntarla.
      pendientes: function (M, yo, q) {
        return tableroPrivado(M, q.per).then(function (t) {
          return { pendientes: (t.pendientes || []) };
        });
      },
      pendiente_resolver: function (M, yo, q) {
        var si = q.aprueba === true || q.aprueba === "true";
        return M.resolverVale(q.fila, si, q.motivo || "").then(function () { return { ok: true }; });
      },

      // Marcar una recompensa como entregada en mano, y deshacer un canje.
      entregado: function (M, yo, q) {
        return M.updateDoc(M.doc(M.db, "purchased_vouchers", String(q.fila)),
          { entregado: !!q.valor, entregadoPor: q.profe || "", entregadoEl: Date.now() })
          .then(function () { return { ok: true }; });
      },
      canje_revertir: function (M, yo, q) {
        return M.resolverVale(String(q.fila), false, "Revertido por " + (q.profe || "el profesorado"))
          .then(function () { return { ok: true }; });
      }
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
                if (yo_) yo_.retos_fecha = misFechas(f);
                // 🔴 Y su propio identificador de ficha. El tablero público no lo trae —y así se
                // queda—, pero uno tiene derecho a saber cuál es la suya: es lo que hace falta para
                // fichar en la llamada a filas. Es SU ficha, no la de nadie más.
                if (yo_) yo_.ficha = f.id;
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
            // 🔴 Lo del PROFESORADO va ANTES de buscar ficha. Un docente no tiene ficha de recluta
            // en su propio grupo, así que el `miFicha` de abajo le contestaría «todavía no te has
            // alistado» a todo lo que pidiera. Esa era la razón —y la única— de que la sala de
            // clase no hablara con el motor nuevo.
            if (DOCENTE[cuerpo.accion]) return DOCENTE[cuerpo.accion](M, yo, cuerpo);
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

              /**
               * CANCELAR UNA ENTREGA PROPIA.
               *
               * 🔴 Norberto lo vio venir y tiene razón: «muchos estudiantes darán a completado solo
               * por probar». Sin una salida, ese clic es irreversible y cada duda acaba siendo un
               * mensaje al docente. Con salida, probar deja de dar miedo.
               *
               * Se reutiliza `anularReto`, que es exactamente lo que hace el profesorado: devuelve
               * el xp y los créditos y quita el reto. El nivel baja SOLO, porque el nivel no se
               * guarda: se deduce del xp. Y se anota quién lo canceló, que no es lo mismo que lo
               * anule un docente.
               *
               * 🔴 LO QUE HOY NO PUEDE HACER, dicho aquí para que no se dé por hecho: si ya se gastó
               * el dinero, el saldo NO queda negativo. `applyXpDelta` de GamificaPro recorta a cero
               * (`Math.max(0, …)`), así que ahí hay un agujero real —marcar, comprar, cancelar— que
               * se cierra con un cambio en esa función y su despliegue.
               */
              if (cuerpo.accion === "cancelar")
                return M.anularReto(cuerpo.per, ficha.id, cuerpo.reto,
                                    "cancelado por el propio recluta")
                  .then(function () {
                    // La evidencia se va con el reto: dejarla colgada sin entrega es basura que
                    // luego aparece en la sala del docente como si hubiera algo entregado.
                    return M.getDocs(M.query(M.collection(M.db, "missions"),
                      M.where("projectId", "==", cuerpo.per), M.where("stargateId", "==", cuerpo.reto)))
                      .then(function (r) {
                        if (r.empty) return { ok: true };
                        return M.deleteDoc(M.doc(M.db, "mission_deliveries", r.docs[0].id + "__" + ficha.id))
                          .then(function () { return { ok: true }; })
                          .catch(function () { return { ok: true }; });
                      });
                  });

              /**
               * AÑADIR O CAMBIAR LA EVIDENCIA sin tocar el reto.
               *
               * 🔴 Antes, para pegar un enlace que se te había olvidado había que CANCELAR la
               * entrega y volver a hacerla: mover xp, créditos y puede que el nivel arriba y abajo
               * por un campo de texto. Absurdo y arriesgado.
               */
              if (cuerpo.accion === "evidencia")
                return M.getDocs(M.query(M.collection(M.db, "missions"),
                  M.where("projectId", "==", cuerpo.per), M.where("stargateId", "==", cuerpo.reto)))
                  .then(function (r) {
                    if (r.empty) return { error: "Ese reto no existe en tu grupo." };
                    var mid = r.docs[0].id;
                    return M.setDoc(M.doc(M.db, "mission_deliveries", mid + "__" + ficha.id), {
                      projectId: cuerpo.per, missionId: mid, studentProfileId: ficha.id,
                      userId: yo.uid, stargateReto: cuerpo.reto,
                      enlace: String(cuerpo.evidencia || "").trim(), createdAt: Date.now()
                    }, { merge: true }).then(function () { return { ok: true }; });
                  });

              /**
               * PONERSE UN ADORNO COMPRADO (título, marco, fondo de planeta).
               *
               * 🔴 EL FALLO QUE ESTO CIERRA, y es el peor de todos: Norberto compró los tres y «no
               * ha tenido ningún efecto». Sus descripciones decían «elígelo en el formulario» —el
               * flujo del sistema viejo—. Con el motor nuevo NO hay formulario, así que tres de las
               * diez recompensas de la tienda cobraban créditos y no hacían absolutamente nada.
               *
               * La ficha ya sabía pintarlos (`r.titulo`, `r.marco`, `r.fondo`) y los campos ya
               * existían en el perfil: lo único que faltaba era poder escribirlos.
               *
               * No se comprueba aquí si la compró: lo peor que puede pasar es que alguien se ponga
               * un marco sin pagarlo, que es cosmético y se deshace en un clic — la misma razón por
               * la que `vestir` tampoco lo comprueba.
               */
              if (cuerpo.accion === "adorno") {
                var CAMPO = { titulo: "stargateTitulo", marco: "stargateMarco", fondo: "stargateFondo" };
                var campo = CAMPO[cuerpo.campo];
                if (!campo) return { error: "Ese adorno no existe." };
                var cambio = {};
                cambio[campo] = String(cuerpo.valor || "").slice(0, 60);
                return M.updateDoc(M.doc(M.db, "student_profiles", ficha.id), cambio)
                  .then(function () { return { ok: true }; });
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
                    /**
                     * 🔴 UN SOBRE SON TRES CARTAS, así que se abre tres veces. `maxUses` deja tres
                     * usos en el inventario por cada sobre comprado; consumirlos de golpe es lo que
                     * el catálogo promete («tres cartas al azar») y lo que evita que el recluta se
                     * quede con dos usos colgando sin saber que los tiene.
                     *
                     * En SERIE, no en paralelo: `consumeItem` lee y escribe el mismo perfil, y tres
                     * llamadas a la vez se pisarían la última escritura entre ellas — dos cartas
                     * pagadas y una sola guardada.
                     */
                    var usos = Number(cuerpo.usos || 1), sacadas = [];
                    var abrirUna = function (n) {
                      if (n <= 0) return Promise.resolve();
                      return M.llamar("consumeItem", { projectId: cuerpo.per, rewardId: cuerpo.recompensa,
                        studentProfileId: ficha.id })
                        .then(function (r) {
                          var b = r && (r.botin || r.obtenido || null);
                          if (b) sacadas.push(b);
                          return abrirUna(n - 1);
                        });
                    };
                    return abrirUna(usos)
                      .then(function () {
                        // Si alguna no se abrió, sigue en el inventario: se avisa y se abre después.
                        return { ok: true, botin: sacadas[0] || null, botines: sacadas,
                                 sinAbrir: sacadas.length < usos && !sacadas.length };
                      })
                      .catch(function () {
                        return sacadas.length
                          ? { ok: true, botin: sacadas[0], botines: sacadas }
                          : { ok: true, sinAbrir: true };
                      });
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
