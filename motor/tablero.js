'use strict';
/**
 * STARGATE · EL TRADUCTOR
 *
 * Recibe documentos de Firestore tal y como los guarda GamificaPro y devuelve EXACTAMENTE el mismo
 * objeto que devuelve `tablero_()` en Apps Script. Ni un campo más, ni uno menos, ni con otro
 * nombre.
 *
 * 🔴 Esa obsesión es el plan entero. Si el objeto es el mismo, `recluta.js`, `clase.js`, `panel.js`
 * y `sesion.js` siguen funcionando sin tocarlos, las 53 baterías siguen siendo válidas y se puede
 * cambiar de motor con un interruptor en vez de con una reescritura. Es lo que convierte esto en un
 * MOD y no en «la versión 2, que ya veremos si sale».
 *
 * Aquí NO se habla con Firebase: entra un puñado de objetos y sale otro. Es una función pura, y por
 * eso se puede probar entera sin red, sin cuenta y sin esperar a nadie.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else (raiz.SG = raiz.SG || {}).TABLERO = fabrica();
})(typeof self !== "undefined" ? self : this, function () {

  // 13-sep · las semanas se cuentan en UN sitio (motor/semanas.js), con las semanas congeladas
  function SEM() { return typeof module === "object" && module.exports ? require("./semanas.js") : self.SGSEMANAS; }

  // Las campañas, igual que las misiones: la ficha guarda el identificador del DOCUMENTO y el resto
  // del sistema habla en el de STARGATE. Se aceptan los dos, en un solo sitio.
  function tieneCampana(p, c) {
    var suyas = p.completedCampaignIds || [];
    return suyas.indexOf(c.id) >= 0 || (c.docId && suyas.indexOf(c.docId) >= 0);
  }

  function ts(f) { if (!f) return 0; var t = new Date(f).getTime(); return isNaN(t) ? 0 : t; }
  function iso(ms) { return ms ? new Date(ms).toISOString().slice(0, 10) : ""; }

  // La semana del PER en la que cae una fecha. Habla el idioma del curso, no el del calendario
  // (las semanas congeladas no cuentan: lo registrado en una pausa cuenta para la semana anterior).
  function semanaDeFecha(inicio, fecha, pausas) {
    if (!inicio) return null;
    var t = ts(fecha); if (!t) return null;
    return SEM().semanaDelCurso(inicio, pausas, t);
  }
  function semanaDe(inicio, ahora, pausas) {
    if (!inicio) return null;
    return SEM().semanaDelCurso(inicio, pausas, ahora || Date.now());
  }

  function nivelInfo(xp, niveles, rangos) {
    var n = 1;
    for (var i = 0; i < niveles.length; i++) if (xp >= niveles[i].xp) n = niveles[i].nivel;
    var f = niveles[n - 1];
    var sig = n < niveles.length ? niveles[n][1] != null ? niveles[n].xp : null : null;
    if (n < niveles.length) sig = niveles[n].xp; else sig = null;
    return { nivel: n, rango: f.rango, rangoNombre: rangos[f.rango - 1], titulo: f.titulo,
             siguiente: sig, faltan: sig === null ? 0 : Math.max(0, sig - xp) };
  }

  /**
   * Semanas CONSECUTIVAS del PER con al menos un registro, contando hacia atrás desde la semana en
   * curso. Si esta semana aún no ha registrado nada se cuenta desde la anterior: a nadie se le
   * rompe la racha un lunes por la mañana.
   */
  function racha(inicio, fechas, ahora, pausas) {
    var sem = semanaDe(inicio, ahora, pausas);
    if (sem === null || !fechas || !fechas.length) return 0;
    var con = {};
    fechas.forEach(function (f) { var w = semanaDeFecha(inicio, f, pausas); if (w !== null && w >= 1) con[w] = true; });
    var w2 = con[sem] ? sem : sem - 1, n = 0;
    while (w2 >= 1 && con[w2]) { n++; w2--; }
    return n;
  }

  /**
   * El tablero de un PER.
   *
   * `datos` son documentos crudos de Firestore:
   *   proyecto    projects/{perId}                (con su apartado `stargate`)
   *   misiones    missions donde projectId == per
   *   campanas    campaigns donde projectId == per
   *   recompensas rewards   donde projectId == per
   *   perfiles    student_profiles donde projectId == per
   *   privados    { profileId: {firstName, lastName, email, bitacora, bio} }  · solo tras el PIN
   *   vales       purchased_vouchers donde projectId == per
   *
   * `conPrivados` decide si salen correo, nombre y el detalle. Igual que en el motor viejo: el
   * endpoint público NO ve ni un correo ni un nombre real, y eso lo comprueba una batería.
   */
  function tablero(datos, conPrivados, ahora) {
    var P = datos.proyecto || {}, S = P.stargate || {};
    var tipo = S.tipo === "PUA" ? "PUA" : "REGULAR";
    var inicio = S.inicio || "";
    var pausas = Array.isArray(S.pausas) ? S.pausas : [];
    /**
     * 🔴 LA DEMO QUE NO CADUCA. El grupo de demostración de la portada se sembró con fechas reales
     * y su semana avanza con el calendario como la de cualquier clase: en noviembre el visitante
     * vería un curso TERMINADO, sin retos de la semana y con la corona repartida hace un mes. Y
     * resembrarlo cada trimestre es exactamente el mantenimiento que no puede haber.
     *
     * Así que no se tocan las fechas: se le dice al tablero «haz como si hoy fuera la semana N».
     * Todo lo demás —rachas, corona semanal, retos de la semana, planetas abiertos— se calcula
     * igual que siempre desde ese «hoy», y como los registros sembrados conservan sus fechas, la
     * foto es coherente: nadie aparece con actividad en una semana que todavía no ha llegado.
     *
     * Solo lo activa un grupo que lleve `demoSemana` en su documento, y solo cuando nadie ha pedido
     * un «ahora» concreto. Una clase de verdad no lo tiene y no hay forma de que lo tenga sin querer.
     */
    if (!ahora && inicio && S.demoSemana > 0) {
      ahora = SEM().fecha(SEM().inicioDeSemana(inicio, S.demoSemana, pausas)).getTime() + 3.5 * 864e5;
    }
    var cat = datos.catalogo;
    // 🔴 Las misiones se buscan por LOS DOS identificadores: el de STARGATE («A1») y el del
    // documento («grupo__A1»). No es indecisión: la ficha de un alumno guarda el del documento
    // —es lo que escribe el motor al completar una misión— pero todo lo demás del sistema, los
    // ajustes del profesorado y los enlaces de los Geniallys hablan en el de STARGATE. Aceptar los
    // dos aquí, en un solo sitio, evita una tabla de conversión repartida por seis ficheros.
    var porId = {};
    (datos.misiones || []).forEach(function (m) {
      porId[m.id] = m;
      if (m.docId) porId[m.docId] = m;
    });
    var privados = datos.privados || {};
    // el título de cada recompensa de la tienda por su id corto («rec5»), para contar lo comprado
    var tituloTienda = {};
    (datos.recompensas || []).forEach(function (r) {
      if (r.inStore === false) return;
      var k = String(r.stargateId || r.docId || r.id || ""), i = k.lastIndexOf("__");
      if (i >= 0) k = k.slice(i + 2);
      if (k && r.title) tituloTienda[k] = r.title;
    });

    // 14-sep · los premios de los sorteos (fuera de la tienda) y cada participación con su premio
    var premioSorteo = {}, premioPorDoc = {};
    (datos.recompensas || []).forEach(function (r) {
      if (r.stargateTipo !== "premio_sorteo") return;
      var k = String(r.stargateId || r.docId || r.id || ""), i = k.lastIndexOf("__");
      premioSorteo[i >= 0 ? k.slice(i + 2) : k] = r;
      premioPorDoc[String(r.docId || r.id)] = r;
    });

    // Los vales de canje, agrupados por quien los compró. `studentId` es el uid del alumno.
    var valesDe = {};
    (datos.vales || []).forEach(function (v) {
      var k = String(v.studentId || "");
      (valesDe[k] = valesDe[k] || []).push(v);
    });

    var hace7 = (ahora || Date.now()) - 7 * 864e5;

    /**
     * CUÁNTA GENTE LLEVA CADA RETO. Un contador por reto y nada más: ni quién, ni cuándo.
     *
     * 🔴 Por qué un agregado y no el dato de cada uno. El tablero PÚBLICO no lleva los retos de
     * nadie (`out.retos` solo se rellena con `conPrivados`), y eso no es un descuido: saber qué ha
     * entregado cada compañero es información de su expediente. Pero «somos 18 y esto lo llevan 12»
     * sí es de todos, y es justo lo que hace que alguien no se sienta el único que va tarde.
     *
     * `activos` es el denominador honesto: quien ha registrado ALGO alguna vez. Contar sobre los
     * matriculados diría «3 %» en una clase donde la mitad ni ha entrado, y ese número no anima a
     * nadie: desmoraliza y encima es falso sobre quien de verdad está jugando.
     */
    var retosN = {}, activos = 0;

    var lista = (datos.perfiles || []).map(function (p) {
      var hechas = p.completedMissionIds || [];
      var sellos = p.missionTimestamps || {};
      // `retos` con la forma de siempre: { A1: {fecha, origen} }. La fecha es el ÚLTIMO registro.
      var retos = {}, fechas = [], eventos = [];
      hechas.forEach(function (guardado) {
        var m = porId[guardado];
        var id = m ? m.id : guardado;               // siempre el de STARGATE de cara afuera
        var marcas = sellos[guardado] || sellos[id] || [];
        var f = marcas.length ? marcas[marcas.length - 1] : "";
        retos[id] = { fecha: f, origen: "recluta", evidencia: "" };
        if (f) fechas.push(f);
        eventos.push({ fecha: f, reto_id: id, reto: m ? m.title : id,
                       xp: m ? m.points : 0, origen: "recluta", evidencia: "" });
      });

      if (Object.keys(retos).length) {
        activos++;
        Object.keys(retos).forEach(function (k) { retosN[k] = (retosN[k] || 0) + 1; });
      }

      // 🔴 El xp de LA SEMANA. Sale de los mismos retos que producen el xp total, cada uno con su
      // fecha — no de una lista de eventos aparte. Ese error ya se pagó una vez: quien tenía todo
      // validado por su profe salía con 0 y la corona se la llevaba otro.
      var xp7 = 0;
      hechas.forEach(function (guardado) {
        var m = porId[guardado]; if (!m) return;
        if (ts((retos[m.id] || {}).fecha) >= hace7) xp7 += m.points || 0;
      });
      // 🔴 Y los bonus. Un planeta completo da 150 xp que el motor ya sumó al total, pero Firestore
      // no guarda CUÁNDO se completó la campaña. No hace falta: un planeta se completa el día que
      // cae su última misión, así que la fecha se deduce de las misiones. Sin esto, quien remata un
      // planeta esta semana pierde 150 xp de cara a la corona — y la corona se la lleva otro.
      // (Lo cazó la batería 54 comparando con el motor de siempre: 1.200 contra 1.050.)
      (datos.campanas || []).forEach(function (cm) {
        if (!tieneCampana(p, cm)) return;
        var premio = (cm.rewards || []).filter(function (x) { return x.type === "xp_extra"; })[0];
        if (!premio || !premio.value) return;
        var cuando = 0;
        (cm.missionIds || []).forEach(function (mid) {
          if (retos[mid] && ts(retos[mid].fecha) > cuando) cuando = ts(retos[mid].fecha);
        });
        if (cuando >= hace7) xp7 += premio.value;
      });

      // Las insignias: las de cada reto hecho, más las derivadas cuyas campañas estén completas.
      var ins = {};
      hechas.forEach(function (g) {
        var m = porId[g]; if (!m) return;
        (m.stargateBadges || (m.badge ? [m.badge] : [])).forEach(function (b) { ins[b] = true; });
      });
      if (hechas.length) ins["H1_reclutamiento"] = true;
      (datos.campanas || []).forEach(function (c) {
        if (!c.stargateInsignia) return;
        if (tieneCampana(p, c)) ins[c.stargateInsignia] = true;
      });

      /**
       * El inventario: cartas, héroes y lo demás. Las entradas repetidas son, literalmente, repes.
       *
       * 🔴 12-sep · EL INVENTARIO GUARDA IDENTIFICADORES DE DOCUMENTO, y esos llevan el grupo
       * delante: «demo-motor__cromo_E1_nebula», no «cromo_E1_nebula». Este bucle buscaba el prefijo
       * corto, así que NO reconocía ni una carta: el álbum decía 0/20 con el álbum lleno y los
       * repetidos no se contaban nunca. No dio error, que es lo peor que puede pasar.
       *
       * Se quita lo que haya hasta el último «__». Sirve para las dos formas, por si alguna entrada
       * vieja se guardó sin prefijo.
       */
      var sinGrupo = function (x) {
        var t = String(x), i = t.lastIndexOf("__");
        return i >= 0 ? t.slice(i + 2) : t;
      };
      var inv = (p.inventory || []).map(sinGrupo), cromos = {}, heroes = [], repes = 0, heroesN = {}, heroesRepes = 0;
      inv.forEach(function (x) {
        if (String(x).indexOf("cromo_") === 0) {
          var k = String(x).slice(6);
          cromos[k] = (cromos[k] || 0) + 1;
          if (cromos[k] > 1) repes++;
        } else if (String(x).indexOf("heroe_") === 0) {
          var h = String(x).slice(6);
          if (heroes.indexOf(h) < 0) heroes.push(h);
          // 13-sep · las copias cuentan: dos héroes repetidos se cambian por uno al azar
          heroesN[h] = (heroesN[h] || 0) + 1;
          if (heroesN[h] > 1) heroesRepes++;
        }
      });
      var gastados = Number(p.stargateRepesGastados || 0);
      // 14-sep · lo ganado en un sorteo (la licencia): se enseña en su botín
      var premios = inv.filter(function (x) { return premioSorteo[x]; }).map(function (x) { return premioSorteo[x].title || x; });

      var xp = Number(p.totalPoints || 0);
      var ganados = 0;
      hechas.forEach(function (g) { var m = porId[g]; if (m) ganados += Number(m.coinsReward || 0); });
      (datos.campanas || []).forEach(function (cm) {
        if (!tieneCampana(p, cm)) return;
        (cm.rewards || []).forEach(function (x) { if (x.type === "coins") ganados += Number(x.value || 0); });
      });
      var niv = nivelInfo(xp, cat.niveles, cat.rangos);
      var skins = []; for (var r = 1; r <= niv.rango; r++) skins.push(r);

      var album = cat.series.filter(function (sr) {
        return cat.cromos.filter(function (cr) { return cr.serie === sr.serie; })
                          .every(function (cr) { return cromos[cr.clave]; });
      }).map(function (sr) { return sr.clave; });

      var coleccion = {
        cromos: { tengo: Object.keys(cromos).length, total: cat.cromos.length },
        heroes: { tengo: heroes.length, total: cat.heroes.length },
        skins:  { tengo: skins.length,  total: cat.rangos.length }
      };
      coleccion.tengo = coleccion.cromos.tengo + coleccion.heroes.tengo + coleccion.skins.tengo;
      coleccion.total = coleccion.cromos.total + coleccion.heroes.total + coleccion.skins.total;
      coleccion.pct = coleccion.total ? (coleccion.tengo * 100 / coleccion.total) : 0;
      // 14-sep · lo LEGENDARIO que tiene (héroes y cromos): la sesión reconoce a los coleccionistas
      // (Norberto: «es importante dar reconocimiento a los que van más avanzados con los cromos, avatares…»)
      var esLeyenda = function (x) { return /legend/i.test(String((x && x.rareza) || "")); };
      var leyendas = cat.heroes.filter(function (h) { return esLeyenda(h) && heroes.indexOf(h.clave) >= 0; }).map(function (h) { return h.nombre; })
        .concat(cat.cromos.filter(function (c) { return esLeyenda(c) && cromos[c.clave]; }).map(function (c) { return c.nombre; }));

      // Planetas completos: los temas cuyos retos obligatorios están todos hechos.
      var planetas = [];
      for (var t = 1; t <= 8; t++) {
        var suyos = (datos.misiones || []).filter(function (m) {
          return m.stargateTema === t && m.isMandatory !== false;
        });
        if (suyos.length && suyos.every(function (m) { return retos[m.id]; })) planetas.push(t);
      }

      var vales = valesDe[p.userId] || [];
      var veces = {};
      vales.forEach(function (v) { if (v.rewardTitle) veces[v.rewardTitle] = (veces[v.rewardTitle] || 0) + 1; });
      /**
       * 🔴 13-sep · LO COMPRADO TAMBIÉN SE CUENTA POR EL INVENTARIO. Con el motor nuevo, comprar un
       * marco lo mete en el inventario y NO deja vale; y el tablero público —el que lee la Nave del
       * estudiante— no trae vales de nadie. Resultado: el título, el fondo y el marco comprados no
       * aparecían nunca en «Mi botín» para ponérselos, y el Mercado no decía «Ya la tienes». Lo
       * destapó preparar el regalo de adornos desde el aula.
       */
      var enInv = {};
      inv.forEach(function (x) { var t = tituloTienda[x]; if (t) enInv[t] = (enInv[t] || 0) + 1; });
      Object.keys(enInv).forEach(function (t) { veces[t] = Math.max(veces[t] || 0, enInv[t]); });

      var priv = privados[p.id] || {};
      var puesto = String(p.stargateViste || "");
      var mH = puesto.match(/^heroe:(.+)$/), mS = puesto.match(/^skin:([1-5])$/);
      var valido = (mH && heroes.indexOf(mH[1]) >= 0) ? puesto
                 : (mS && skins.indexOf(Number(mS[1])) >= 0) ? puesto : "";
      var avatar = p.stargateAvatar || { tipo: null, n: null, url: "" };
      avatar.skin = valido.indexOf("skin:") === 0 ? Number(valido.slice(5)) : niv.rango;
      avatar.heroe = valido.indexOf("heroe:") === 0 ? valido.slice(6) : "";

      var out = {
        /**
         * 🔴 13-sep · `fid`: el id del documento de la ficha, también en el tablero público. La Nave
         * se buscaba a sí misma POR EL ALIAS, y con dos «Halo» en el grupo uno veía la Nave del otro.
         * No destapa nada nuevo: la puerta pública ya devuelve el `id` de cada ficha en crudo.
         */
        fid: p.id || "",
        alias: p.displayName || "", avatar: avatar, xp: xp, nivel: niv.nivel, rango: niv.rango,
        rango_nombre: niv.rangoNombre, coleccion: coleccion,
        bonus: (p.completedCampaignIds || []).slice(),
        planetas_completos: planetas, heroes: heroes, n_heroes: heroes.length, skins: skins,
        heroes_n: heroesN, heroes_repes: heroesRepes, premios: premios,
        viste: valido, repes: repes, repes_gastados: gastados,
        repes_disponibles: Math.max(0, repes - gastados),
        insignias_album: album, n_album: album.length, leyendas: leyendas,
        racha: racha(inicio, fechas, ahora, pausas),
        nivel_titulo: niv.titulo, xp_siguiente: niv.siguiente, xp_faltan: niv.faltan,
        creditos: Number(p.coins || 0),
        // 🔴 Ganados y gastados se DEDUCEN de lo que hizo, no se guardan en el perfil. Guardarlos
        // sería dejar dos campos que el propio alumno puede escribir desde la consola del navegador
        // (no están en la lista de campos protegidos de Firestore, y no pueden estarlo: no son
        // economía de verdad). Lo que se puede calcular no se guarda.
        creditos_ganados: ganados, creditos_gastados: Math.max(0, ganados - Number(p.coins || 0)),
        canjeados: veces, profe: p.stargateProfe || "",
        planeta: planetaDe(retos, datos.misiones, cat), tema: temaDe(retos, datos.misiones),
        insignias: Object.keys(ins), n: Object.keys(ins).length,
        titulo: p.stargateTitulo || "", marco: p.stargateMarco || "", fondo: p.stargateFondo || "",
        // 15-sep (noche) · los logros de a bordo (los apunta el servidor; el tablero público no los trae)
        hitos: p.stargateHitos || {}, cubiertas: p.stargateCubiertas || {}, dias: p.stargateDias || {},
        // 16-sep · el Simulador de Joran: quién le ganó y sus marcas (los rankings de cada tema y la sesión)
        simulador: p.stargateSimulador || {},
        cromos: cromos, xp7: xp7, bio: priv.bio || p.stargateBio || "",
        // 14-sep · qué misiones ha superado (sus ids de STARGATE): la sesión proyectada enseña quién
        // hizo cada misión de la semana pasada. No destapa nada que el ranking no enseñe ya.
        hechos: Object.keys(retos),
        ultima: fechas.length ? new Date(Math.max.apply(null, fechas.map(ts))) : ""
      };
      // 🔴 El correo y el nombre real solo aquí. El endpoint público no los ve, y eso no cambia
      // porque cambiemos de motor: en Firestore viven en `student_profiles/{id}/privado`, que las
      // reglas cierran a todo el mundo salvo el propio alumno y su equipo docente.
      if (conPrivados) {
        // 🔴 El identificador de la ficha viaja con ella. Sin esto, la consola tenía que emparejar
        // por ALIAS para saber a quién estaba editando, y dos reclutas con el mismo alias —que
        // pasa— significaban otorgarle un reto a la persona equivocada sin enterarse.
        out.ficha = p.id;
        // El uid es lo que ata a un recluta con sus vales de canje. Va en la rama privada, con el
        // correo: identifica a una persona y no tiene por qué salir del puesto de mando.
        out.uid = p.userId || "";
        out.email = priv.email || ""; out.nombre = [priv.firstName, priv.lastName].filter(Boolean).join(" ");
        out.nombre_pila = priv.firstName || ""; out.apellidos = priv.lastName || "";
        out.bitacora = priv.bitacora || ""; out.eventos = eventos; out.retos = retos;
        // 13-sep · los capítulos de NEBULA que ha visto: la columna «Bienvenida» de la consola
        out.capitulos = p.stargateCapitulos || {};
        // 14-sep · la cuenta congelada por su referente (quién y cuándo)
        out.congelado = p.stargateCongelado || null;
        // 🔴 `fila` era el número de fila en la hoja; aquí es el identificador del vale. Se sigue
        // llamando igual porque la sala del docente lo manda de vuelta tal cual para revertir un
        // canje o marcarlo entregado: renombrarlo obligaría a tocar la sala sin ganar nada.
        out.canjes = vales.map(function (v) {
          return { fila: v.id, fecha: v.createdAt ? new Date(v.createdAt) : "", recompensa: v.rewardTitle || "",
                   actividad: v.stargateActividad || "", entregado: v.deliveredAt || v.entregado ? "Sí" : "",
                   estado: v.status || "" };
        });
      }
      return out;
    });

    lista.sort(function (a, b) { return b.xp - a.xp || b.n - a.n || a.alias.localeCompare(b.alias); });
    lista.forEach(function (x, i) { x.pos = i + 1; });
    // La corona semanal: quien más xp ganó en los últimos 7 días. Puede haber empate.
    var maxSem = 0; lista.forEach(function (x) { if (x.xp7 > maxSem) maxSem = x.xp7; });
    lista.forEach(function (x) { x.corona = maxSem > 0 && x.xp7 === maxSem; });

    // Los nombres del profesorado son públicos (el alumnado necesita saber quién le imparte); los
    // correos y el enlace de edición solo llegan si Firestore ha dejado leer `privado`.
    var PRIV = datos.privadoPER || {};
    var docentes = (PRIV.docentes && PRIV.docentes.length) ? PRIV.docentes : (S.docentes || []);
    var res = {
      per: P.id, nombre: P.name || "", tipo: tipo,
      profesorado: docentes.map(function (d) { return d.nombre; }).join(", "),
      referente: PRIV.referente || "", estado: P.active === false ? "cerrado" : "abierto",
      inicio: inicio, reclutas: lista,
      retos_n: retosN, activos: activos,
      recompensas: (datos.recompensas || []).filter(function (r) { return r.inStore !== false; })
        .map(function (r) {
          // El identificador viaja con la recompensa: sin él, canjear habría que hacerlo POR NOMBRE,
          // y el día que alguien renombre «Sobre de cromos» se rompe en silencio.
          // 🔴 Los DOS identificadores, como con las misiones: el corto para hablar (y para que los
          // enlaces valgan en todos los grupos) y el del documento para que el servidor la encuentre.
          // 🔴 `desc` y `max`, NO `descripcion` y `maximo`. Este traductor promete devolver
          // EXACTAMENTE el objeto de `tablero_()` del Apps Script (ahí se llaman así, Code.gs:244)
          // y aquí se rebautizaron. Dos consecuencias, ninguna con error:
          //   · la Nave lee `x.desc` → el Mercado salía SIN una sola descripción, tarjetas con
          //     título y precio y nada que explicara qué compras.
          //   · la Nave lee `x.max` → `!x.max` era true, así que TODO parecía repetible: el aviso
          //     «Ya la tienes» no salía nunca y se podía volver a pulsar algo de una sola vez.
          //     (El servidor sí lo deniega, pero la pantalla mentía.)
          var out = { id: r.id, doc: r.docId || r.id, nombre: r.title, coste: r.cost,
                   max: r.maxPerUser == null ? 99 : r.maxPerUser,
                   desc: r.description, desde: r.stargateSemana || 0, tipo: r.stargateTipo || "",
                   // cuántas cartas trae un sobre (o usos un consumible): lo dice la recompensa, no la Nave
                   usos: Math.max(1, Number(r.maxUses || 1)) };
          // 14-sep · LA OFERTA DE LA SEMANA (o una del referente): la oferta flash de GamificaPro, con su
          // precio rebajado (la misma cuenta que cobra el servidor), sus unidades y hasta cuándo dura
          if (r.stargateTipo === "oferta") {
            var so = r.stargateOferta || {}, fo = r.flashOffer || {};
            var pctO = Math.min(90, Math.max(1, Math.floor(Number(fo.discountPercent) || 0))), baseO = Number(r.cost || 0);
            out.oferta = { base: baseO, precio: Math.max(0, Math.floor(baseO * (100 - pctO) / 100)), pct: pctO,
                           total: so.unidades == null ? null : Number(so.unidades),
                           quedan: r.isLimitedStock === true ? Math.max(0, Number(r.globalStock || 0)) : null,
                           vendidas: Number(fo.unitsSold || 0), desde: Number(so.desde || 0), fin: Number(fo.endsAt || so.fin || 0),
                           cancelada: !!so.cancelada, abre: so.abre || "sobre", nombre: so.nombre || r.title, rareza: so.rareza || "",
                           que: so.que || {}, auto: !!so.auto, semana: so.semana || null };
            out.coste = out.oferta.precio; out.desde = 0;
          }
          // 14-sep · EL GRAN SORTEO: qué se sortea, cuándo, cuántos ganan y, si ya se hizo, quiénes
          if (r.systemEffect === "lottery_ticket") {
            var pr = premioPorDoc[String(r.linkedItemId || "")] || {}, SS = r.stargateSorteo || {};
            out.tipo = out.tipo || "sorteo";
            out.sorteo = { premio: pr.title || SS.premio || "", ganadores: Number(pr.globalStockInitial || SS.ganadores || 1),
                           fecha: Number(r.ticketDeadline || SS.fecha || 0), desde: Number(r.availableFrom || 0),
                           hecho: r.isRaffleCompleted === true, ganadoresAlias: r.raffleWinnerNames || [],
                           ganadoresFichas: r.raffleWinnerIds || [], imagen: SS.imagen || "sorteo_generico.jpg" };
          }
          return out;
        }),
      semana: semanaDe(inicio, ahora, pausas), semanas: S.semanas || 15,
      // 13-sep · el calendario del referente: semanas congeladas y capítulos abiertos antes de tiempo
      pausas: SEM().limpias(inicio, pausas), pausa: SEM().pausaDe(inicio, pausas, ahora || Date.now()),
      capitulosAbiertos: S.capitulosAbiertos || {},
      panel: S.panelVer || "", paneles: S.paneles || {},
      apertura: S.apertura || "", cierre_misiones: S.cierre || "", cierre_canje: S.cierreCanje || "",
      padlet: S.padlet || "",
      // La web lleva llamándolo `formTicket` desde el primer día y en siete sitios distintos.
      // Renombrarlo aquí solo serviría para tener que tocar esos siete.
      //
      // 🔴 El enlace del ticket es UNO para todos los grupos y lleva huecos: {GRUPO} se rellena aquí
      // —lo sabe el tablero— y {COMANDANTE} lo pone la Nave, que es quien sabe de qué docente es
      // cada recluta. Así el mismo enlace vale en todos los grupos y en todos los años.
      formTicket: String(S.ticket || "").replace("{GRUPO}", encodeURIComponent(P.id || "")),
      // 🔴 Los escuadrones, para los rankings. Van SIN el correo de quien los comanda: el tablero se
      // proyecta en clase. `teacherName` ya es público —el alumnado necesita saber quién le imparte—
      // y es la llave que ata cada recluta (`profe`) con su escuadrón.
      escuadrones: ((P.factions || [])).map(function (f) {
        return { id: f.id, nombre: f.name, comandante: f.teacherName,
                 lema: f.lema || "", origen: f.origen || "", emblema: f.imageUrl || "" };
      }),
      docentes: docentes.map(function (d) {
        return { nombre: d.nombre, rol: d.rol, imparte: d.imparte || "",
                 referente: d.rol === "referente" };
      }),
      actualizado: new Date(ahora || Date.now())
    };
    if (conPrivados) {
      /**
       * LA COLA DE NOTA. Las subidas de nota no se conceden solas: se piden, los créditos quedan
       * retenidos y el profesorado decide. Vive aquí —y no en quien pregunta— porque la calculan
       * dos pantallas distintas (la consola del referente y la sala del docente) y dos copias de
       * la misma cuenta son dos oportunidades de que un día digan cosas distintas.
       *
       * `saldo` y `puede` son el motivo de que no baste con listar los vales: entre pedir y
       * aprobar pueden haberse gastado el dinero en otra cosa.
       */
      var porUid = {};
      lista.forEach(function (x) { if (x.uid) porUid[x.uid] = x; });
      res.pendientes = (datos.vales || [])
        .filter(function (v) { return (v.status || "pending") === "pending"; })
        .map(function (v) {
          var q = porUid[v.studentId] || porUid[v.userId] || {};
          var coste = Number(v.cost || 0);
          return { fila: v.id, fecha: v.createdAt ? new Date(v.createdAt) : "",
                   email: q.email || "", alias: q.alias || "", nombre: q.nombre || "",
                   recompensa: v.rewardTitle || "", coste: coste,
                   actividad: v.stargateActividad || "",
                   saldo: q.creditos == null ? null : q.creditos,
                   puede: q.creditos != null };
        });
      // El código de acceso, para que la sala del docente pueda dar el enlace de alistamiento
      // completo. Va en la rama PRIVADA: no es un secreto de verdad, pero tampoco hay razón para
      // repartirlo en el tablero que se proyecta.
      res.codigo = P.joinCode || "";
      res.docentes_full = docentes;
      res.sin_docente = lista.filter(function (x) { return !String(x.profe || "").trim(); }).length;
      res.docentes_sin_correo = docentes.filter(function (d) { return !d.correo; }).map(function (d) { return d.nombre; });
      res.panelEdit = PRIV.panelEdit || ""; res.panelPropio = !!(S.panelVer || PRIV.panelEdit);
      res.archivado = P.archived ? "sí" : "";
    }
    return res;
  }

  // El tema más alto que ha tocado, y su planeta. Igual que antes: el número mayor, no el último.
  function temaDe(retos, misiones) {
    var alto = 0;
    (misiones || []).forEach(function (m) {
      if (retos[m.id] && m.stargateTema > alto && m.stargateTema <= 8) alto = m.stargateTema;
    });
    return alto;
  }
  function planetaDe(retos, misiones, cat) {
    var t = temaDe(retos, misiones);
    var tema = (cat.temas || []).filter(function (x) { return x.n === t; })[0];
    return tema ? tema.planeta : "—";
  }

  return { tablero: tablero, racha: racha, semanaDe: semanaDe, semanaDeFecha: semanaDeFecha,
           nivelInfo: nivelInfo };
});
