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
    // la semana en curso, con las semanas congeladas (motor/semanas.js: una cuenta para todos)
    var semanaDe = function (inicio, pausas) {
      if (!inicio) return null;
      return window.SGSEMANAS.semanaDelCurso(inicio, pausas);
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
            return { id: p.id, nombre: p.nombre, tipo: S.tipo || "REGULAR", inicio: S.inicio || "", pausas: S.pausas || [],
                     semana: semanaDe(S.inicio, S.pausas), archivado: S.archivado ? "sí" : "",
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
          // 🔴 13-sep · el alias nuevo tampoco puede llevarlo otro del grupo (mismo control que al alistarse)
          if (publico.displayName !== undefined)
            pasos.push(M.aliasOcupado(q.per, publico.displayName, { ficha: r.ficha }).then(function (otro) {
              if (otro) throw new Error("«" + publico.displayName + "» ya lo lleva otro recluta del grupo (" + otro + "). Elige otro alias.");
            }));
          return Promise.all(pasos).then(function () {
            var escrituras = [];
            // 🔴 el alias, con su reserva (las reglas no dejan cambiarlo sin ella): el resto va con él
            if (publico.displayName !== undefined) {
              var nuevo = publico.displayName; delete publico.displayName;
              escrituras.push(M.cambiarAlias(q.per, r.ficha, nuevo, publico));
            } else if (Object.keys(publico).length)
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
            if (!yo) return { error: "Entra con tu cuenta de Google para ver tu ficha.", sinSesion: true };
            return window.SG.FUENTE.tablero(per, true).then(function (t) {
              return miFicha(M, per, yo).then(function (f) {
                if (!f) return { error: "Todavía no te has alistado en este grupo.", sinFicha: true };
                // 🔴 13-sep · por la FICHA, no por el alias: con dos «Halo» en el grupo, uno veía la
                // Nave del otro. El alias solo sirve si el tablero es de antes de traer `fid`.
                var yo_ = t.reclutas.filter(function (x) { return x.fid && x.fid === f.id; })[0]
                       || t.reclutas.filter(function (x) { return !x.fid && x.alias === f.displayName; })[0];
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
                // 🔴 13-sep · los capítulos de NEBULA que ya vio (o se saltó): viven en SU ficha, así que
                // cambiar de ordenador no le hace verlos otra vez
                if (yo_) yo_.capitulos = f.stargateCapitulos || {};
                // 14-sep · sus participaciones en los sorteos (el tablero de todos no las trae)
                if (yo_) yo_.participaciones = f.lotteryEntries || {};
                // 14-sep · y si su referente le ha congelado la cuenta (mira, pero no toca)
                if (yo_) yo_.congelado = !!f.stargateCongelado;
                // 14-sep · las ofertas que ya ha comprado (una por persona)
                if (yo_) yo_.ofertas = f.stargateOfertas || {};
                /**
                 * 🔴 13-sep · Y SUS ENLACES. El estudiante entregaba un enlace con «Lo he hecho» y
                 * después, en «Mis retos», el campo le salía VACÍO («pégalo aquí»): parecía perdido y
                 * le invitaba a pegarlo otra vez. Son sus propias entregas (las reglas solo dejan
                 * leer las suyas), así que se leen y se enseñan.
                 */
                if (!yo_) return { yo: yo_, correo: yo.correo, verificado: true };
                return M.getDocs(M.query(M.collection(M.db, "mission_deliveries"),
                    M.where("userId", "==", yo.uid), M.where("projectId", "==", per)))
                  .then(function (r) {
                    var ev = {}; r.forEach(function (d) { var x = d.data(); if (x.stargateReto && x.enlace) ev[x.stargateReto] = x.enlace; });
                    yo_.evidencias = ev;
                    return { yo: yo_, correo: yo.correo, verificado: true };
                  })
                  .catch(function () { return { yo: yo_, correo: yo.correo, verificado: true }; });
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
                // 🔴 13-sep · El tope diario y la evidencia obligatoria, también aquí, en la puerta por
                // la que salen TODOS los registros: la Nave lo avisa antes, esto es el cerrojo.
                var TOPE = Number(window.SG_TOPE_DIA || 0), EV = window.SG_EVIDENCIA || {};
                if (TOPE) {
                  var hoy0 = new Date(); hoy0.setHours(0, 0, 0, 0);
                  var sellos = (ficha.missionTimestamps || {}), hoyN = 0;
                  Object.keys(sellos).forEach(function (k) {
                    // solo retos del propio recluta (A, B, X, S); los hitos (H…) se completan solos
                    if (!/^[ABXS]\d/.test(String(k).split("__").pop())) return;
                    var l = sellos[k]; var u = Array.isArray(l) ? l[l.length - 1] : l;
                    if (u && new Date(u) >= hoy0) hoyN++;
                  });
                  if (hoyN >= TOPE) return { error: "Hoy ya has registrado " + TOPE + " retos. Vuelve mañana." };
                }
                if (EV[cuerpo.reto] === "obligatoria" &&
                    !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(String(cuerpo.evidencia || "").trim()))
                  return { error: "Este reto necesita el enlace de lo que has hecho." };
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

              /**
               * 🔴 13-sep · UN CAPÍTULO DE NEBULA, VISTO O SALTADO. En su ficha (las reglas le dejan
               * escribirlo: no es economía) para que no se repita en otro ordenador y para que su
               * docente sepa quién ha visto qué. Solo la marca del capítulo que toca, nada más.
               */
              if (cuerpo.accion === "capitulo") {
                var cap = String(cuerpo.cap || "");
                if (!/^c\d{1,2}$/.test(cap)) return { error: "Ese capítulo no existe." };
                var marca = {};
                marca["stargateCapitulos." + cap] = { v: Number(cuerpo.v) || 1,
                  estado: cuerpo.estado === "saltado" ? "saltado" : "hecho", fecha: Date.now() };
                return M.updateDoc(M.doc(M.db, "student_profiles", ficha.id), marca)
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
              /**
               * 🔴 TRES REPETIDAS POR UN SOBRE, en el servidor (`stargateCambiarRepes`). Antes era un
               * `purchaseReward` de coste cero que no retiraba repetidas ni abría nada: cambios
               * infinitos que no daban nada. Ahora retira tres copias y entrega un sobre, que se abre
               * aquí mismo carta a carta, igual que uno comprado.
               */
              /**
               * 🔴 13-sep · DOS HÉROES REPETIDOS POR UNO AL AZAR (`stargateCambiarHeroesRepes`), la
               * mecánica que pidió Norberto en vez de «sin repetidos»: el azar del Mercado no se toca.
               * Mismo camino que los cromos: el servidor retira dos copias y entrega un «Héroe de la
               * Rebelión» del grupo, que se abre aquí mismo.
               */
              if (cuerpo.accion === "canje" && (cuerpo.tipo === "cromo_repes" || cuerpo.tipo === "heroe_repes"))
                return M.llamar(cuerpo.tipo === "heroe_repes" ? "stargateCambiarHeroesRepes" : "stargateCambiarRepes",
                                { projectId: cuerpo.per }).then(function (r) {
                  var sacadas = [];
                  var abrirUna = function (n) {
                    if (n <= 0) return Promise.resolve();
                    return M.llamar("consumeItem", { projectId: cuerpo.per, rewardId: r.rewardId, studentProfileId: ficha.id })
                      .then(function (c) { var b = c && (c.botin || c.obtenido); if (b) sacadas.push(b); return abrirUna(n - 1); });
                  };
                  return abrirUna(Number(r.usos || 1)).then(function () {
                    return { ok: true, botin: sacadas[0] || null, botines: sacadas, sinAbrir: !sacadas.length };
                  }).catch(function () { return { ok: true, botines: sacadas, sinAbrir: !sacadas.length }; });
                });

              // 14-sep · una OFERTA de la semana se compra por su puerta (una por persona) y se abre igual
              if (cuerpo.accion === "canje")
                return (/^oferta/.test(cuerpo.tipo || "")
                  ? M.llamar("stargateOferta", { projectId: cuerpo.per, accion: "comprar", ofertaId: cuerpo.recompensa })
                  : M.llamar("purchaseReward", { projectId: cuerpo.per, rewardId: cuerpo.recompensa,
                  studentProfileId: ficha.id }))
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

  /**
   * ════════ LA NAVE DEL COMANDANTE · el simulacro ════════   recluta.html?simulacro=1&per=<grupo>&semana=N
   *
   * 🔴 13-sep · Norberto: «en la diapositiva siguiente estaría genial embeber la demo del estudiante
   * con lo que se haya desbloqueado, para que el docente pueda interactuar… un estudiante demo que
   * controle el docente, o que el propio Comandante tenga su avatar dentro del juego y enseñe cómo
   * hacerlo». Se estudiaron las dos y se hizo la segunda, sin sus problemas:
   *   · un estudiante DE VERDAD que maneja el docente sale en el ranking, gasta plazas de los premios
   *     con tope, cuenta en los datos (y en la tesis) y solo enseña la semana de hoy;
   *   · esto es la Nave de verdad —las mismas pantallas y los mismos botones— con el Comandante como
   *     recluta, en la semana que se elija, y NADA SE GUARDA: cada acción se simula aquí, en memoria.
   * Lee el tablero PÚBLICO del grupo (lo que ya se proyecta en clase) y le añade una ficha: la suya.
   */
  function simulacro() {
    var per = q.get("per") || "", FID = "simulacro-comandante";
    var crudo = null, perfil = null, listo = null, nombre = "", evid = {};
    var cat = function () { return window.SG_CATALOGO || {}; };
    var avatar = function () {
      try { var a = JSON.parse(localStorage.getItem("sgComandante") || "null"); if (a && a.n) return a; } catch (e) {}
      return { n: 3, v: "f" };
    };
    var esperarTraductor = function () {
      return new Promise(function (ok) {
        (function mira() { if (window.SG && window.SG.TABLERO && window.SG_CATALOGO) return ok(); setTimeout(mira, 60); })();
      });
    };
    var alAzar = function (lista) {
      var total = lista.reduce(function (a, x) { return a + (Number(x.peso) || 1); }, 0), r = Math.random() * total;
      for (var i = 0; i < lista.length; i++) { r -= (Number(lista[i].peso) || 1); if (r <= 0) return lista[i]; }
      return lista[lista.length - 1];
    };
    var carta = function () { return per + "__cromo_" + alAzar(cat().cromos || []).clave; };
    var heroe = function () { return per + "__heroe_" + alAzar(cat().heroes || []).clave; };
    // 14-sep · de un cofre (los sobres y cápsulas nuevos): con SUS pesos, como lo sortea el servidor
    var delCofre = function (r) {
      var it = ((r.consumeEffects || {}).lootBox || {}).items || [], t = it.reduce(function (a, x) { return a + (Number(x.probability) || 0); }, 0);
      var z = Math.random() * t;
      for (var i = 0; i < it.length; i++) { z -= Number(it[i].probability) || 0; if (z <= 0) return it[i].rewardId; }
      return it.length ? it[it.length - 1].rewardId : carta();
    };
    var semanaFija = 0;
    var semanaSim = function () {
      var total = ((cat().semanas || {})[(crudo && crudo.proyecto && crudo.proyecto.stargate || {}).tipo === "PUA" ? "PUA" : "REGULAR"]) || 15;
      var S0 = (crudo.proyecto || {}).stargate || {};
      var f = semanaFija || parseInt(q.get("semana") || "0", 10) || (window.SGCAL && window.SGCAL.semanaActual(S0.inicio, S0.pausas)) || 1;
      return Math.max(1, Math.min(total, f));
    };
    var diaDe = function (sem) {
      var S1 = (crudo.proyecto || {}).stargate || {};
      if (!S1.inicio) return new Date().toISOString().slice(0, 10);
      return window.SGSEMANAS.masDias(window.SGSEMANAS.inicioDeSemana(S1.inicio, sem, S1.pausas), 2);
    };
    /** La ficha del Comandante como la tendría un recluta aplicado a estas alturas: lo de las semanas
     *  pasadas hecho, lo de esta pendiente (para enseñar «Lo he hecho»), y algo en el álbum. */
    var sembrar = function () {
      var s = semanaSim(), ms = crudo.misiones || [];
      var hechas = ms.filter(function (m) {
        return m.id === "H1" || (Number(m.stargateSemana) > 0 && Number(m.stargateSemana) < s && m.isMandatory !== false && !/^S/.test(m.id));
      });
      var sellos = {};
      hechas.forEach(function (m) { sellos[m.docId || m.id] = [diaDe(Number(m.stargateSemana) || 1)]; });
      var inv = [];
      if (s >= 2) { inv.push(carta(), carta(), carta(), carta()); inv.push(inv[0]); }
      if (s >= 3) { var h1 = heroe(), h2 = heroe(); inv.push(h1, h1, h2, h2); }
      var esc_ = ((crudo.proyecto || {}).factions || []).filter(function (f) { return f.teacherName === nombre; })[0]
              || ((crudo.proyecto || {}).factions || [])[0] || null;
      var a = avatar();
      perfil = { id: FID, userId: "simulacro", projectId: per, displayName: nombre,
        totalPoints: hechas.reduce(function (t, m) { return t + (Number(m.pointsReward) || Number(m.points) || 0); }, 0),
        coins: hechas.reduce(function (t, m) { return t + (Number(m.coinsReward) || 0); }, 0) + (s >= 2 ? 45 : 0),
        completedMissionIds: hechas.map(function (m) { return m.docId || m.id; }), missionTimestamps: sellos,
        completedCampaignIds: [], earnedBadges: [], inventory: inv, consumableUses: {},
        stargateAvatar: { tipo: "evo", n: a.n, v: a.v, url: "" }, stargateProfe: esc_ ? esc_.teacherName : nombre,
        squadId: esc_ ? esc_.id : null, factionId: esc_ ? esc_.id : null, stargateViste: "", stargateCapitulos: {} };
      evid = {};
    };
    var traducir = function () {
      var d = Object.assign({}, crudo, { perfiles: (crudo.perfiles || []).filter(function (p) { return p.id !== FID; }).concat([perfil]),
                                         catalogo: window.SG_CATALOGO });
      return window.SG.TABLERO.tablero(d, false);
    };
    var cargar = function () {
      if (listo) return listo;
      listo = fetch(PUBLICA + "?per=" + encodeURIComponent(per)).then(function (r) { return r.json(); }).then(function (d) {
        if (d.error) throw new Error(d.error);
        crudo = d;
        var M = window.SG && window.SG.MOTOR;
        var quien = M && M.sesion ? M.sesion().catch(function () { return null; }) : Promise.resolve(null);
        return Promise.all([esperarTraductor(), quien]).then(function (r) {
          var yo = r[1];
          // «Cmdte. Rita» si se sabe quién es; si no (sin sesión, dentro de un Genially), «Tu Comandante»
          nombre = q.get("comandante") || (yo && yo.nombre) || "";
          nombre = !nombre ? "Tu Comandante" : /^(cmdte|comandante)/i.test(nombre) ? nombre : "Cmdte. " + nombre.split(" ")[0];
          sembrar();
        });
      });
      return listo;
    };
    var yoDe = function (t) {
      var yo = (t.reclutas || []).filter(function (x) { return x.fid === FID; })[0] || null;
      if (yo) { yo.ficha = FID; yo.evidencias = Object.assign({}, evid); yo.capitulos = {};
        // los retos con su fecha (el tablero público no los trae de nadie; del Comandante, sí)
        var porDoc = {}; (crudo.misiones || []).forEach(function (m) { porDoc[m.docId] = m.id; });
        yo.retos = perfil.completedMissionIds.map(function (x) { return porDoc[x] || x; });
        var fe = {}; Object.keys(perfil.missionTimestamps).forEach(function (k) { fe[porDoc[k] || k] = perfil.missionTimestamps[k][0]; });
        yo.retos_fecha = fe;
        yo.participaciones = Object.assign({}, perfil.lotteryEntries || {});
        yo.ofertas = Object.assign({}, perfil.stargateOfertas || {}); }
      return yo;
    };
    var mision = function (id) { return (crudo.misiones || []).filter(function (m) { return m.id === id || m.docId === id; })[0]; };
    var premio = function (id) { return (crudo.recompensas || []).filter(function (r) { return r.docId === id || r.id === id; })[0]; };
    var quitaRepes = function (re, n) {
      var cuenta = {}; perfil.inventory.forEach(function (x) { if (re.test(x)) cuenta[x] = (cuenta[x] || 0) + 1; });
      var sobran = Object.keys(cuenta).reduce(function (a, k) { return a + cuenta[k] - 1; }, 0);
      if (sobran < n) return false;
      while (n > 0) {
        var k = Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a]; })[0];
        perfil.inventory.splice(perfil.inventory.lastIndexOf(k), 1); cuenta[k]--; n--;
      }
      return true;
    };
    // ── el Zoco simulado ──
    var zoco = null;
    var yoZ = function () { return { ficha: FID, uid: "simulacro", alias: nombre }; };
    var otros = function () { return (crudo.perfiles || []).filter(function (p) { return p.id !== FID && p.displayName; }); };
    var otroZ = function () { var o = otros(), x = o[Math.floor(Math.random() * o.length)] || { id: "sim-x", displayName: "Recluta" };
      return { ficha: x.id, uid: "sim-" + x.id, alias: x.displayName }; };
    var piezaDe = function (id) { return { id: id, tipo: /__heroe_/.test(id) ? "heroe" : /__sorteo[a-z0-9]*$/i.test(id) ? "participacion" : "cromo", clave: String(id).split("__").pop().replace(/^(heroe|cromo)_/, "") }; };
    var aviso_ = function () { try { document.dispatchEvent(new CustomEvent("sg:zoco")); } catch (e) {} };
    var zocoIni = function () {
      if (zoco) return;
      zoco = { n: 0, anuncios: [], tratos: [] };
      var s = semanaSim();
      [carta(), carta(), s >= 3 ? heroe() : carta(), s >= 3 ? heroe() : carta()].forEach(function (id) {
        zoco.anuncios.push({ id: "sa" + (++zoco.n), projectId: per, estado: "abierto", vende: otroZ(), pieza: piezaDe(id), creado: Date.now() - zoco.n * 36e5 });
      });
    };
    var cerrarZ = function (t, estado) {
      if (t.compra.uid === "simulacro") { perfil.coins += Number(t.ofrece.creditos) || 0; perfil.inventory = perfil.inventory.concat(t.ofrece.piezas || []); }
      t.estado = estado; t.actualizado = Date.now();
    };
    var cambiarZ = function (t, pago) {
      var an = zoco.anuncios.filter(function (a) { return a.id === t.anuncio; })[0];
      if (t.compra.uid === "simulacro") {
        // me vuelve lo apartado, pago lo acordado y recibo la pieza
        perfil.coins += Number(t.ofrece.creditos) || 0; perfil.inventory = perfil.inventory.concat(t.ofrece.piezas || []);
        if (perfil.coins < (Number(pago.creditos) || 0)) throw new Error("No te llega: te faltan " + ((Number(pago.creditos) || 0) - perfil.coins) + " ◈.");
        perfil.coins -= Number(pago.creditos) || 0;
        (pago.piezas || []).forEach(function (x) { var i = perfil.inventory.indexOf(x); if (i >= 0) perfil.inventory.splice(i, 1); });
        perfil.inventory.push(t.pieza.id);
      } else {
        // vendo lo mío: sale la pieza (una participación sale de sus papeletas), entra lo pagado
        if (t.pieza.tipo === "participacion") { perfil.lotteryEntries = perfil.lotteryEntries || {};
          perfil.lotteryEntries[t.pieza.id] = Math.max(0, (perfil.lotteryEntries[t.pieza.id] || 0) - 1); }
        else { var i = perfil.inventory.indexOf(t.pieza.id); if (i >= 0) perfil.inventory.splice(i, 1); }
        perfil.coins += Number(pago.creditos) || 0; perfil.inventory = perfil.inventory.concat(pago.piezas || []);
      }
      t.estado = "aceptado"; t.pagado = pago; t.actualizado = Date.now();
      if (an) an.estado = "cerrado";
    };
    var api = {
      nombre: "firestore", simulacro: true,
      lista: function () { return Promise.resolve([]); },
      tablero: function (p) { if (p) per = p; return cargar().then(traducir); },
      quien: function () { return cargar().then(function () { return { yo: yoDe(traducir()), correo: "comandante@simulacro", verificado: true }; }); },
      /** Todo lo que en la Nave de verdad escribe algo, aquí se apunta en memoria y ya está. */
      accion: function (c) {
        return cargar().then(function () {
          var P = perfil;
          if (c.accion === "registrar") {
            var m = mision(c.reto); if (!m) return { error: "Ese reto no existe en este grupo." };
            var k = m.docId || m.id; if (P.completedMissionIds.indexOf(k) >= 0) return { ok: true, repetido: true };
            P.completedMissionIds.push(k); P.missionTimestamps[k] = [new Date().toISOString().slice(0, 10)];
            P.totalPoints += Number(m.pointsReward) || Number(m.points) || 0; P.coins += Number(m.coinsReward) || 0;
            if (c.evidencia) evid[m.id] = c.evidencia;
            return { ok: true };
          }
          if (c.accion === "cancelar") {
            var m2 = mision(c.reto); if (!m2) return { ok: true };
            var k2 = m2.docId || m2.id, i2 = P.completedMissionIds.indexOf(k2); if (i2 < 0) return { ok: true };
            P.completedMissionIds.splice(i2, 1); delete P.missionTimestamps[k2];
            P.totalPoints = Math.max(0, P.totalPoints - (Number(m2.pointsReward) || Number(m2.points) || 0));
            P.coins = Math.max(0, P.coins - (Number(m2.coinsReward) || 0));
            return { ok: true };
          }
          if (c.accion === "evidencia") { evid[c.reto] = String(c.evidencia || ""); return { ok: true }; }
          if (c.accion === "vestir") { P.stargateViste = c.viste || ""; return { ok: true }; }
          if (c.accion === "adorno") {
            var campo = { titulo: "stargateTitulo", marco: "stargateMarco", fondo: "stargateFondo" }[c.campo];
            if (campo) P[campo] = String(c.valor || "").slice(0, 60);
            return { ok: true };
          }
          if (c.accion === "canje" && (c.tipo === "cromo_repes" || c.tipo === "heroe_repes")) {
            var esH = c.tipo === "heroe_repes";
            if (!quitaRepes(esH ? /__heroe_/ : /__cromo_/, esH ? 2 : 3))
              throw new Error(esH ? "Necesitas 2 héroes repetidos." : "Necesitas 3 cartas repetidas.");
            var nuevas = esH ? [heroe()] : [carta(), carta(), carta()];
            P.inventory = P.inventory.concat(nuevas);
            return { ok: true, botin: nuevas[0], botines: nuevas };
          }
          if (c.accion === "canje") {
            var r = premio(c.recompensa); if (!r) return { error: "Esa recompensa no existe en este grupo." };
            // 15-sep · LA OFERTA DE LA SEMANA, de mentira: a su precio rebajado, una por persona y abierta como
            // en la Nave de verdad (antes cobraba el precio entero y no abría nada)
            if (r.stargateTipo === "oferta") {
              var ko = r.docId || r.id, so = r.stargateOferta || {}, fo = r.flashOffer || {};
              perfil.stargateOfertas = perfil.stargateOfertas || {};
              if (perfil.stargateOfertas[ko]) throw new Error("Ya la tienes: una por persona.");
              if (so.cancelada || Date.now() > Number(fo.endsAt || 0)) throw new Error("Esta oferta ya ha terminado.");
              var pctO = Math.min(90, Math.max(1, Math.floor(Number(fo.discountPercent) || 0)));
              var precioO = Math.max(0, Math.floor((Number(r.cost) || 0) * (100 - pctO) / 100));
              if (P.coins < precioO) throw new Error("No tienes suficientes créditos (te faltan " + (precioO - P.coins) + " ◈).");
              P.coins -= precioO; perfil.stargateOfertas[ko] = Date.now();
              var sacO = [], nO = Math.max(1, Number(r.maxUses) || 1);
              for (var jo = 0; jo < nO; jo++) sacO.push(delCofre(r));
              P.inventory = P.inventory.concat(sacO);
              return { ok: true, botin: sacO[0], botines: sacO };
            }
            var coste = Number(r.cost) || 0;
            if (P.coins < coste) throw new Error("No tienes suficientes créditos (te faltan " + (coste - P.coins) + " ◈).");
            // 14-sep · una participación del sorteo: una papeleta más (como `purchaseReward`)
            if (r.systemEffect === "lottery_ticket") {
              var k = r.docId || r.id; P.lotteryEntries = P.lotteryEntries || {};
              if (r.maxPerUser && (P.lotteryEntries[k] || 0) >= r.maxPerUser) throw new Error("Ya tienes las " + r.maxPerUser + " participaciones que se permiten.");
              if (r.isRaffleCompleted) throw new Error("Este sorteo ya se ha hecho.");
              P.coins -= coste; P.lotteryEntries[k] = (P.lotteryEntries[k] || 0) + 1;
              return { ok: true };
            }
            P.coins -= coste;
            if (c.abrir && (r.stargateTipo === "cromo" || r.stargateTipo === "heroe" || /^(sobre|capsula)_/.test(r.stargateTipo || ""))) {
              var nuevo = /^(sobre|capsula)_/.test(r.stargateTipo || "");
              var n = nuevo ? Math.max(1, Number(r.maxUses) || Number(c.usos) || 1) : r.stargateTipo === "cromo" ? Math.max(1, Number(c.usos) || 3) : 1, sac = [];
              for (var j = 0; j < n; j++) sac.push(nuevo ? delCofre(r) : r.stargateTipo === "cromo" ? carta() : heroe());
              P.inventory = P.inventory.concat(sac);
              return { ok: true, botin: sac[0], botines: sac };
            }
            P.inventory.push(r.docId || r.id);
            return { ok: true };
          }
          return { ok: true };   // capítulos de NEBULA y lo demás: en un simulacro no se apunta nada
        });
      },
      /** La llamada a filas, de mentira: créditos y el sobre de regalo, como en clase. */
      fichar: function () {
        return cargar().then(function () {
          if (perfil._fichado) return { repetido: true };
          perfil._fichado = true;
          perfil.totalPoints += 15; perfil.coins += 30;
          var regalo = [carta(), carta(), carta()]; perfil.inventory = perfil.inventory.concat(regalo);
          return { ok: true, regalo: regalo, racha: 1 };
        });
      },
      reiniciar: function () { return cargar().then(function () { sembrar(); zoco = null; }); },
      /** Otra semana: la ficha se vuelve a sembrar para esa semana (lo de antes hecho, lo de esta por hacer). */
      ponSemana: function (n) { semanaFija = Math.max(1, Number(n) || 1); return cargar().then(function () { sembrar(); return semanaSim(); }); },
      /** Su personaje: se guarda en este navegador para la próxima vez. */
      ponAvatar: function (n, v) {
        try { localStorage.setItem("sgComandante", JSON.stringify({ n: n, v: v })); } catch (e) {}
        return cargar().then(function () { perfil.stargateAvatar = { tipo: "evo", n: n, v: v, url: "" }; });
      },
      comandante: function () { return nombre; },
      /**
       * EL ZOCO, DE MENTIRA: para enseñarlo en clase hace falta «otro recluta» al otro lado, y aquí lo
       * hace el simulacro. Si ofreces, a los dos segundos te contraoferta (paso 2: te toca la última
       * palabra); si pones algo tuyo, te llega una oferta. Los tres pasos, sin tocar a nadie de verdad.
       */
      zocoDatos: function () { return cargar().then(function () { zocoIni(); return { uid: "simulacro", anuncios: zoco.anuncios.filter(function (a) { return a.estado === "abierto"; }), tratos: zoco.tratos.slice() }; }); },
      zocoPoner: function (p, piezas) { return cargar().then(function () { zocoIni();
        piezas.forEach(function (id) {
          var an = { id: "sa" + (++zoco.n), projectId: per, estado: "abierto", vende: yoZ(), pieza: piezaDe(id), creado: Date.now() };
          zoco.anuncios.unshift(an);
          // alguien de la clase se interesa
          setTimeout(function () { if (an.estado !== "abierto") return;
            var oferta = { creditos: an.pieza.tipo === "heroe" ? 40 : 10, piezas: [carta()] };
            zoco.tratos.unshift({ id: "st" + (++zoco.n), anuncio: an.id, vende: yoZ(), compra: otroZ(), pieza: an.pieza, ofrece: oferta, pide: null,
              paso: 1, turno: "vendedor", estado: "abierto", mensajes: [{ de: "comprador", texto: "¡Me encanta! ¿Te vale esto?", fecha: Date.now() }], creado: Date.now(), actualizado: Date.now() });
            aviso_(); }, 2500);
        });
        return { ok: true };
      }); },
      zocoRetirar: function (id) { return cargar().then(function () { var an = zoco.anuncios.filter(function (a) { return a.id === id; })[0];
        if (an) { an.estado = "retirado"; zoco.tratos.filter(function (t) { return t.anuncio === id && t.estado === "abierto"; }).forEach(function (t) { cerrarZ(t, "retirado"); }); }
        return { ok: true }; }); },
      zocoOfertar: function (id, ofrece) { return cargar().then(function () {
        var an = zoco.anuncios.filter(function (a) { return a.id === id; })[0]; if (!an) throw new Error("Eso ya no está en el Zoco.");
        var q = { creditos: Math.max(0, Number(ofrece.creditos) || 0), piezas: (ofrece.piezas || []).slice() };
        if (q.creditos > perfil.coins) throw new Error("No tienes " + q.creditos + " ◈.");
        q.piezas.forEach(function (x) { var i = perfil.inventory.indexOf(x); if (i < 0) throw new Error("Ya no tienes esa pieza."); perfil.inventory.splice(i, 1); });
        perfil.coins -= q.creditos;                                   // apartado, como en el de verdad
        var t = { id: "st" + (++zoco.n), anuncio: id, vende: an.vende, compra: yoZ(), pieza: an.pieza, ofrece: q, pide: null,
          paso: 1, turno: "vendedor", estado: "abierto", mensajes: [], creado: Date.now(), actualizado: Date.now() };
        zoco.tratos.unshift(t);
        // quien lo vende contraoferta: un poco más
        setTimeout(function () { if (t.estado !== "abierto") return;
          t.paso = 2; t.turno = "comprador"; t.pide = { creditos: Math.min(q.creditos + 10, an.pieza.tipo === "heroe" ? 180 : 45), piezas: q.piezas.slice() };
          t.mensajes.push({ de: "vendedor", texto: "Casi… ¿le sumas 10 ◈?", fecha: Date.now() }); t.actualizado = Date.now(); aviso_(); }, 2000);
        return { ok: true, trato: t.id };
      }); },
      zocoResponder: function (id, accion, extra) { return cargar().then(function () {
        var t = zoco.tratos.filter(function (x) { return x.id === id; })[0]; if (!t || t.estado !== "abierto") throw new Error("Ese trato ya está cerrado.");
        var soyVende = t.vende.uid === "simulacro";
        if (extra && extra.mensaje) t.mensajes.push({ de: soyVende ? "vendedor" : "comprador", texto: String(extra.mensaje).slice(0, 140), fecha: Date.now() });
        if (accion === "rechazar" || accion === "retirar") { cerrarZ(t, accion === "retirar" ? "retirado" : "rechazado"); return { ok: true }; }
        if (accion === "contraofertar" && soyVende) { t.paso = 2; t.turno = "comprador"; t.pide = extra.pide;
          setTimeout(function () { if (t.estado === "abierto") { cambiarZ(t, t.pide); aviso_(); } }, 2000); return { ok: true, estado: "contraoferta" }; }
        if (accion === "aceptar") { cambiarZ(t, t.paso === 2 ? t.pide : t.ofrece); return { ok: true, estado: "aceptado" }; }
        throw new Error("Ahora no te toca.");
      }); },
      semana: function () { return crudo ? semanaSim() : 1; }
    };
    return api;
  }

  window.SG = window.SG || {};
  window.SG.FUENTE = q.get("simulacro") === "1" ? simulacro() : CUAL === "firestore" ? firestore() : apps();
})();
