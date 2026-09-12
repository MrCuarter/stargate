'use strict';
/**
 * STARGATE · DE CATÁLOGO A MOTOR
 *
 * Traduce el catálogo de STARGATE al vocabulario de GamificaPro. Un reto es una misión, un planeta
 * es una campaña, una recompensa es una recompensa. Nada de esto se inventa: se lee del catálogo
 * (que a su vez lee Datos.gs) y se pinta con los campos que el motor entiende.
 *
 * 🔴 Lo que NO se traduce, y por qué no pasa nada: la corona semanal, la racha, la Tripulación
 * Cero, el porcentaje de colección y los repetidos. GamificaPro no los conoce, pero tampoco los
 * necesita: guarda los HECHOS (qué misión completó quién y cuándo, qué lleva en el inventario) y
 * esas cinco cosas se calculan a partir de ellos. Van en el adaptador, del lado de la Nave.
 *
 * Lo único que sí exige servidor es REGALAR xp o créditos, porque las reglas de Firestore prohíben
 * que el navegador escriba en la economía. Por eso el bonus de planeta es una CAMPAÑA: el motor ya
 * sabe premiar al completar un conjunto de misiones, y lo hace desde dentro.
 *
 * Se usa igual en Node (las pruebas, el sembrador) y en el navegador (la consola del referente).
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else (raiz.SG = raiz.SG || {}).PAQUETE = fabrica();
})(typeof self !== "undefined" ? self : this, function () {

  /**
   * 🔴 LOS REFERENTES VITALICIOS. Dos cuentas mandan en TODOS los grupos, de este curso y de los que
   * vengan, sin que nadie tenga que acordarse de apuntarlas: la de Norberto y la de la universidad
   * (mutecdgami), que es la dueña del material y la que tiene que poder resolver cualquier lío. Van en el
   * código y no en un ajuste porque un ajuste se puede borrar sin querer, y el día que eso pasara
   * se quedaría fuera de su propio sistema — con la prioridad de «mantenimiento 0 mientras estoy de
   * baja», eso es inaceptable. Los co-referentes sí se añaden desde la app, por grupo o para todos.
   */
  var REFERENTES_VITALICIOS = [
    "n.cuartero.10@gmail.com",   // Norberto
    "mutecdgami@gmail.com"       // la cuenta de la universidad: dueña de todo el material
  ];

  var DIA = 864e5;

  // 🔴 Nada de `toISOString` aquí. La fecha se construye en hora local (T00:00:00) y en Madrid, con
  // horario de verano, pasarla a UTC la retrasa dos horas — o sea, al día ANTERIOR. La batería 54 lo
  // cazó porque el cierre de misiones salía un día antes que en el motor viejo: un día de menos para
  // registrar, regalado por una conversión de zona horaria que nadie había pedido.
  function masDias(iso, n) {
    var d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.getFullYear() + "-" + dos(d.getMonth() + 1) + "-" + dos(d.getDate());
  }
  function dos(n) { return (n < 10 ? "0" : "") + n; }
  // La semana 1 empieza el día de `inicio`. La semana N se abre N-1 semanas después.
  function inicioDeSemana(inicio, semana) { return masDias(inicio, (Math.max(1, semana) - 1) * 7); }
  function ms(iso) { return iso ? new Date(iso + "T00:00:00").getTime() : null; }

  /**
   * Un PUA dura 8 semanas y un REGULAR 15. Las puertas del catálogo están escritas en semanas de
   * REGULAR, así que en PUA se escalan proporcionalmente en vez de copiarse: si no, el Arsenal de
   * la semana 15 no se abriría nunca en un curso que acaba en la 8.
   */
  function semanaEnTipo(semanaRegular, tipo, cat) {
    if (tipo !== "PUA") return semanaRegular;
    var total = cat.semanas.REGULAR || 15, suyas = cat.semanas.PUA || 8;
    return Math.max(1, Math.min(suyas, Math.round(semanaRegular * suyas / total)));
  }

  // Los créditos de un reto salen de su forma, igual que en el motor viejo: lo dice el id.
  /** Seis caracteres legibles en voz alta. Sin I, O, 0 ni 1, que se confunden al dictarlos. */
  function codigoNuevo() {
    var abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", c = "";
    for (var i = 0; i < 6; i++) c += abc.charAt(Math.floor(Math.random() * abc.length));
    return c;
  }

  function creditosDe(reto, tipo, cat) {
    var c = cat.creditos;
    if (reto.id === "H1") return c.reclutamiento;
    if (reto.id.charAt(0) === "X") return c.actividad;
    if (reto.id.charAt(0) === "A") return c.retoA;
    if (reto.id.charAt(0) === "S") return c.retoA;
    if (reto.id.charAt(0) === "B") return tipo === "PUA" ? c.retoB_pua : c.retoB;
    return c.retoA;
  }

  /**
   * El paquete de un PER: el documento del proyecto, sus misiones, sus campañas y su tienda.
   *
   * `per` trae lo que el referente escribe en la consola: nombre, tipo, fecha de la semana 1,
   * equipo docente, el padlet y los Geniallys. Nada más: lo demás lo pone el catálogo.
   */
  function paquete(per, cat) {
    var tipo = per.tipo === "PUA" ? "PUA" : "REGULAR";
    var inicio = String(per.inicio || "").slice(0, 10);
    if (!inicio) throw new Error("Falta la fecha de la semana 1");
    var semanas = cat.semanas[tipo];
    var retos = cat.retos[tipo];
    // El último día de la semana n, y el canje una semana entera por detrás. Calculados los dos
    // desde el inicio —no el segundo desde el primero— para que sea imposible que se desincronicen.
    var cierre = masDias(inicio, semanas * 7 - 1);
    var cierreCanje = masDias(inicio, (semanas + (cat.semanasCanjeExtra || 1)) * 7 - 1);
    var docentes = (per.docentes || []).map(function (d) {
      return { nombre: String(d.nombre || "").trim(), correo: String(d.correo || "").toLowerCase().trim(),
               rol: d.rol || "docente", panel: String(d.panel || "").trim() };
    }).filter(function (d) { return d.nombre || d.correo; });

    /**
     * POR QUÉ EL VITALICIO SE ESCRIBE EN EL GRUPO Y NO SE COMPRUEBA EN CADA PANTALLA.
     *
     * La tentación era un «¿eres tú? pues pasa» en cada sitio. Eso son diez sitios donde acordarse
     * y uno donde olvidarse. Pero hay una razón más dura: `misPERs` le pregunta a FIRESTORE por los
     * proyectos donde tu correo está en `coTeacherEmails`, y esa pregunta la responde el servidor.
     * Un permiso que solo existiera en el navegador no le haría ver ni un grupo: se encontraría la
     * pantalla de «esta cuenta no lleva ningún grupo» en su propio sistema.
     *
     * Así que se escribe al sembrar: en `coTeacherEmails` (lo que mira Firestore para dejar entrar)
     * y en el equipo docente con rol de referente (lo que mira la interfaz). Un dato, un sitio, y
     * todas las pantallas funcionan sin saber nada de esto.
     *
     * 🔴 Se aplica DESPUÉS de repartir los escuadrones, a propósito: si entrara antes, contaría
     * como docente que imparte y se llevaría un escuadrón con alumnado que no es suyo.
     */
    var NOMBRE_VITALICIO = { "n.cuartero.10@gmail.com": "Mr. Cuarter",
                             "mutecdgami@gmail.com": "Mando UNIR" };
    var conVitalicio = function (lista) {
      var salida = lista.slice();
      REFERENTES_VITALICIOS.forEach(function (correo) {
        var i = salida.map(function (d) { return d.correo; }).indexOf(correo);
        // Si ya estaba puesto a mano se respeta su nombre, pero el rol no se le puede quitar.
        if (i >= 0) salida[i] = Object.assign({}, salida[i], { rol: "referente" });
        else salida = salida.concat([{ nombre: NOMBRE_VITALICIO[correo] || correo.split("@")[0],
                                       correo: correo, rol: "referente", panel: "" }]);
      });
      return salida;
    };

    // ---------------------------------------------------------------- los escuadrones
    // 🔴 Un escuadrón por docente, y el alumnado lo elige al alistarse. Eso mata dos pájaros: deja
    // de existir la pregunta «¿quién imparte tu clase?» —que era texto libre y por eso llegaba
    // escrito de siete maneras distintas— y a cambio cada grupo tiene nombre, lema e identidad
    // desde el primer día. Elegir profe deja de ser burocracia y pasa a ser elegir bando.
    var escuadrones = docentes.map(function (d, i) {
      var e = cat.escuadrones[i % cat.escuadrones.length];
      return { id: d.escuadron || e.clave, name: d.escuadronNombre || e.nombre, score: 0,
               assignedTeacherEmails: d.correo ? [d.correo] : [],
               teacherName: d.nombre, lema: e.lema, origen: e.origen,
               // `imageUrl` es el campo que ya usa GamificaPro para el emblema de una facción:
               // se guarda ahí y no en uno nuestro, para que su interfaz también lo pinte.
               imageUrl: e.emblema };
    });

    // ---------------------------------------------------------------- el proyecto
    // Todo lo que es NUESTRO va bajo `stargate`. GamificaPro no lee ahí, y sus 58 escrituras sobre
    // proyectos son `updateDoc` (nunca reemplazan el documento entero), así que este apartado
    // sobrevive a que un docente entre a su editor y toque lo que quiera.
    /**
     * EL CÓDIGO DE ACCESO. Seis caracteres que hay que saber para alistarse.
     *
     * 🔴 Qué protege y qué NO, dicho aquí para que nadie se confíe. Esto NO es seguridad: el código
     * vive en el documento del grupo, que cualquiera con cuenta puede leer si sabe cómo. Lo que
     * evita es que alguien que se tropiece con el enlace —o a quien se lo reenvíen por un grupo de
     * WhatsApp— entre sin más. El 90 % de los curiosos, no el 100 % de los decididos.
     *
     * Sin I, O, 0 ni 1: se dicta en voz alta en clase y esos cuatro se confunden siempre.
     */
    var proyecto = {
      joinCode: per.codigo || codigoNuevo(),
      name: per.nombre,
      description: per.descripcion || "Proyecto Gamificado del Máster en Tecnología Educativa de la UNIR.",
      active: true,
      editorMode: "simple",
      coTeacherEmails: conVitalicio(docentes).map(function (d) { return d.correo; }).filter(Boolean),
      avatarProgressionEnabled: true,
      characterStatsEnabled: false,
      // El alumnado elige su escuadrón al alistarse: `predefined` es justo eso.
      factionMode: escuadrones.length ? "predefined" : "none",
      squadTerminology: "Escuadrón",
      factions: escuadrones,
      levelSystem: cat.niveles.map(function (n) {
        return { level: n.nivel, xpRequired: escalaXp(n.xp, tipo, cat), title: n.titulo, phase: n.rango };
      }),
      // QUÉ VA AQUÍ Y QUÉ NO. El documento del proyecto lo puede leer cualquiera con sesión en
      // GamificaPro: es lo que necesitan el ranking, la galería y el salón de la fama. Así que aquí
      // solo va lo que ya es público de hecho —el calendario, el padlet de la clase, el panel de
      // VER y el NOMBRE de cada docente—, y nada más.
      //
      // El enlace de EDICIÓN del Genially y los correos del profesorado se guardan aparte, en
      // `privado`. No porque el enlace sirva de nada a un extraño —Genially comprueba permisos, así
      // que tenerlo no da acceso a editar— sino porque lo que solo le importa al equipo docente no
      // tiene por qué estar en el documento que lee todo el mundo. Cuesta cero y ordena.
      stargate: {
        version: cat.version,
        tipo: tipo,
        inicio: inicio,
        apertura: inicio,
        cierre: cierre,
        cierreCanje: cierreCanje,
        semanas: semanas,
        padlet: String(per.padlet || "").trim(),
        // 🔴 El ticket de salida sigue siendo un formulario de Google, y a propósito: tiene que ser
        // ANÓNIMO, y el motor guarda quién responde cada formulario suyo. Un enlace externo es la
        // única forma de prometer anonimato y cumplirlo. Lo duplica el referente, como el Genially.
        ticket: String(per.ticket || "").trim(),
        panelVer: String(per.panelVer || "").trim(),
        // El Genially propio de cada docente, si lo tiene. La Nave elige el del docente del alumno.
        // Es de ver, no de editar: por eso puede ir aquí.
        paneles: docentes.reduce(function (m, d) { if (d.panel) m[d.nombre] = d.panel; return m; }, {}),
        docentes: docentes.map(function (d) { return { nombre: d.nombre, rol: d.rol }; }),
        semanaDelTema: cat.semanaDelTema,
        temas: cat.temas
      }
    };

    // Lo que solo debe ver el equipo docente. Va a `projects/{id}/privado/stargate`, con su propia
    // regla. Es un camino NUEVO en las reglas de Firestore: añade, no cambia, así que no puede
    // romper nada de lo que GamificaPro ya hace.
    var privado = {
      referente: String(per.referente || "").toLowerCase().trim() || REFERENTES_VITALICIOS[0],
      panelEdit: String(per.panelEdit || "").trim(),
      docentes: conVitalicio(docentes)
    };

    // ---------------------------------------------------------------- las misiones
    // El id del documento es el id del reto (`A1`, `B3`, `X1`). Deliberado: así el adaptador puede
    // traducir de motor a motor sin una tabla de equivalencias que mantener, y los ajustes que el
    // profesorado hizo en la hoja vieja siguen nombrando lo mismo.
    // 🔴 Alistarse ES un reto. En el motor viejo no aparece en la tabla porque no hay que marcarlo
    // —se otorga solo al llegar la primera respuesta—, pero suma xp, créditos y la insignia de
    // Reclutamiento. Sin esta misión, el xp de la semana salía 100 por debajo y la corona podía
    // cambiar de dueño. Lo cazó la batería 54 comparando con el motor de siempre.
    var conAlta = [{ id: "H1", titulo: "Alistamiento: te unes a la tripulación",
                     insignias: ["H1_reclutamiento"], xp: cat.xpReclutamiento, tema: 0 }].concat(retos);
    var misiones = conAlta.map(function (r, i) {
      var semana = cat.semanaDelTema[String(r.tema)] || r.tema;
      return {
        id: r.id,
        order: i,
        title: r.titulo,
        description: descripcionDe(r, cat),
        points: r.xp,
        coinsReward: creditosDe(r, tipo, cat),
        badge: r.insignias[0] || "",
        // Las insignias extra de un reto (X1 da dos) viajan aparte: el motor solo pinta una.
        stargateBadges: r.insignias,
        stargateTema: r.tema,
        stargateSemana: semanaEnTipo(semana, tipo, cat),
        campaignId: r.tema ? "tema" + r.tema : null,
        // Manual y sin cola: marcar un reto es lo que hoy hace el formulario, y entonces tampoco
        // esperaba a nadie. La revisión del profesorado sigue existiendo — puede anularlo después.
        completionMethod: { type: "manual" },
        requiresTeacherValidation: false,
        enabled: true,
        isMandatory: r.id.charAt(0) !== "S"
      };
    });

    // ---------------------------------------------------------------- las campañas (los planetas)
    // Un planeta completo = bonus. El motor ya sabe premiar al terminar un conjunto de misiones,
    // así que el bonus de planeta deja de ser código nuestro y pasa a ser una regla suya.
    var campanas = cat.temas.map(function (t) {
      var mias = misiones.filter(function (m) { return m.stargateTema === t.n; });
      if (!mias.length) return null;
      var semana = semanaEnTipo(cat.semanaDelTema[String(t.n)] || t.n, tipo, cat);
      return {
        id: "tema" + t.n,
        order: t.n,
        title: "Tema " + t.n + " · " + t.planeta,
        description: t.materia,
        missionIds: mias.map(function (m) { return m.id; }),
        // El reto secreto no puede ser obligatorio para dar el planeta por completo: es un huevo
        // de Pascua, y quien no lo encuentre no puede quedarse sin su bonus.
        optionalMissionIds: mias.filter(function (m) { return m.id.charAt(0) === "S"; })
                                .map(function (m) { return m.id; }),
        // 🔴 El bonus de planeta deja de ser código nuestro: es la recompensa de la campaña, y la
        // paga el motor desde dentro. Mismos 150 xp y 40 créditos de siempre — salen del catálogo.
        rewards: [{ type: "xp_extra", value: (cat.bonus.planeta || {}).xp || 0 },
                  { type: "coins", value: (cat.bonus.planeta || {}).creditos || 0 }],
        enabled: true,
        visibleFromTimestamp: ms(inicioDeSemana(inicio, semana)),
        stargatePlaneta: t.clave
      };
    }).filter(Boolean);

    // Las insignias derivadas (Tripulación Cero, La Liberación) también son campañas: un conjunto
    // de misiones que, al completarse, da xp y una insignia. Mismo mecanismo, otro conjunto.
    cat.derivadas.forEach(function (d, i) {
      var necesita = misiones.filter(function (m) {
        return m.stargateBadges.some(function (b) { return d.requiere.indexOf(b) >= 0; });
      }).map(function (m) { return m.id; });
      if (!necesita.length) return;
      campanas.push({
        id: "derivada" + (i + 1),
        order: 100 + i,
        title: (cat.insignias[d.insignia] || {}).nombre || d.insignia,
        description: (cat.insignias[d.insignia] || {}).tarea || "",
        missionIds: necesita,
        rewards: [{ type: "xp_extra", value: d.xp }, { type: "coins", value: cat.creditos.derivada }],
        enabled: true,
        stargateInsignia: d.insignia
      });
    });

    // ---------------------------------------------------------------- la tienda
    var tienda = cat.recompensas.map(function (r, i) {
      var semana = semanaEnTipo(r.desdeSemana, tipo, cat);
      return {
        id: "rec" + (i + 1),
        title: r.nombre,
        description: r.descripcion,
        cost: r.coste,
        maxPerUser: r.maximo >= 99 ? null : r.maximo,
        // 🔴 La puerta de semana, que el motor viejo comprobaba a mano en tres sitios distintos.
        // Aquí es un campo: el Arsenal no existe hasta la semana 15 y punto.
        availableFrom: ms(inicioDeSemana(inicio, semana)),
        availableUntil: ms(cierreCanje),
        inStore: true,
        // 🔴 LA COLA DE NOTA. Las subidas de nota NO se conceden solas: generan un vale que el
        // docente aprueba en bloque, y los créditos no se mueven hasta entonces. Es exactamente lo
        // que diseñamos, y el motor ya lo trae de fábrica.
        requiresApproval: r.tipo === "nota",
        requiresDelivery: r.tipo === "nota",
        stargateTipo: r.tipo,
        stargateSemana: semana,
        icon: "gift"
      };
    });

    // ---------------------------------------------------------------- el álbum y el vestuario
    // Cada carta y cada héroe es una recompensa que NO está en la tienda: no se compran sueltos,
    // salen del sobre. Así el inventario del motor guarda lo que tiene cada recluta —incluidos los
    // repetidos, porque el inventario admite entradas iguales— y el álbum deja de ser cuenta aparte.
    var coleccionables = cat.cromos.map(function (c) {
      return { id: "cromo_" + c.clave, title: c.nombre, description: c.serie, cost: 0, inStore: false,
               rarity: rareza(c.rareza), stargateTipo: "cromo", stargateSerie: c.serie, icon: "sparkles" };
    }).concat(cat.heroes.map(function (h) {
      return { id: "heroe_" + h.clave, title: h.nombre, description: "Héroe de la Rebelión", cost: 0,
               inStore: false, rarity: rareza(h.rareza), stargateTipo: "heroe", icon: "user" };
    }));

    // El sobre y el sobre de héroes se convierten en cofres del motor: consumirlos da una pieza al
    // azar con los MISMOS pesos del catálogo. El sorteo deja de ser código nuestro.
    /**
     * 🔴 12-sep · `maxStock` NO PUEDE SER 0. En STARGATE se escribió 0 queriendo decir «sin tope»,
     * pero GamificaPro lo normaliza con `Math.max(1, …)` → UNO, y el contador de cartas repartidas
     * vive en el sobre del GRUPO, compartido por toda la clase. Resultado: cada carta salía una sola
     * vez por grupo, y en cuanto la clase había abierto las 26 (unos nueve sobres entre todos), TODOS
     * los sobres salían vacíos: pagabas 15 ◈ y NEBULA decía «no he podido abrirla». En la beta habría
     * pasado el primer día de Mercado. Lo destapó el laboratorio con un recluta que compró nueve
     * sobres seguidos. «Sin tope», en GamificaPro, se escribe con un número que no se alcanza nunca.
     */
    var SIN_TOPE = 1000000;
    function cofre(prefijo, piezas) {
      return { items: piezas.map(function (x) {
        return { rewardId: prefijo + x.clave, probability: x.peso, maxStock: SIN_TOPE };
      }) };
    }
    tienda.forEach(function (r) {
      /**
       * 🔴 TRES CARTAS POR SOBRE, no una. Con una, NADIE completaba el álbum jamás: simulando 3.000
       * álbumes con la economía real (800 ◈ en todo el viaje, sobre a 15 ◈), quien se lo gastaba
       * TODO en cromos terminaba con 4 huecos de media. Una colección que no se puede cerrar deja
       * de ser una colección.
       *
       * Con tres sale justo la curva que pidió Norberto —«no quiero que un estudiante que haga TODO
       * pueda completar TODO; es la gracia del juego»—: el que se especializa lo cierra el 55 % de
       * las veces, y el que reparte entre cromos, avatares y subir nota, un 6 %. Hay que ELEGIR.
       *
       * Se hace con `maxUses`, no abriendo tres veces: un sobre comprado son tres usos del mismo
       * consumible. Llamar tres veces a `consumeItem` gastaría tres sobres del inventario y solo se
       * compró uno.
       */
      if (r.stargateTipo === "cromo") { r.isConsumable = true; r.maxUses = 3;
        r.consumeEffects = { lootBox: cofre("cromo_", cat.cromos) }; }
      if (r.stargateTipo === "heroe") { r.isConsumable = true; r.maxUses = 1;
        r.consumeEffects = { lootBox: cofre("heroe_", cat.heroes) }; }
    });

    return { proyecto: proyecto, privado: privado, misiones: misiones, campanas: campanas,
             recompensas: tienda.concat(coleccionables), series: cat.series };
  }

  // El motor pinta el borde de la carta por rareza; nuestras palabras no son las suyas.
  function rareza(r) {
    return { "común": "common", "comun": "common", "rara": "rare",
             "épica": "epic", "epica": "epic", "legendaria": "legendary" }[String(r).toLowerCase()] || "common";
  }

  // Los xp de nivel están escritos para un REGULAR (4.750 de viaje). Un PUA recorre 4.350: si se
  // copiaran tal cual, en PUA sería imposible llegar a Leyenda por pura aritmética.
  function escalaXp(xp, tipo, cat) {
    if (tipo !== "PUA" || !cat.xpViaje || !cat.xpViaje.REGULAR) return xp;
    return Math.round(xp * cat.xpViaje.PUA / cat.xpViaje.REGULAR);
  }

  // El texto que ve el recluta: lo que pide el reto y qué insignia se lleva.
  function descripcionDe(reto, cat) {
    var fichas = reto.insignias.map(function (k) { return cat.insignias[k]; }).filter(Boolean);
    var tarea = fichas.map(function (f) { return f.tarea; }).filter(Boolean)[0] || "";
    var nombres = fichas.map(function (f) { return f.nombre; }).filter(Boolean);
    return tarea + (nombres.length ? "\n\nInsignia: " + nombres.join(" · ") : "");
  }

  /**
   * UN ESCONDITE, COMO RECOMPENSA DE GAMIFICAPRO. En un solo sitio porque lo escriben dos: la consola
   * del referente al guardar (navegador) y el sembrador de grupos de prueba (Node). Dos copias de
   * esta forma serían dos escondites que un día se comportan distinto.
   *
   * `h` es la línea de la lista del referente; `sobre` y `heroe`, las recompensas de la tienda del
   * grupo cuyo cofre se copia —mismo sorteo, mismas cartas que lo comprado—.
   * 🔴 Sin campo `id` dentro: GamificaPro lee {id: doc.id, ...data} y lo pisaría.
   */
  function premioDeHuevo(perId, h, sobre, heroe) {
    var tipo = h.premio === "heroe" ? "heroe" : h.premio === "bolsa" ? "bolsa" : h.premio === "xp" ? "xp" : "sobre";
    var cuanto = Math.max(1, Number(h.cantidad || h.creditos || (tipo === "xp" ? 100 : 50)));
    // 🔴 `attributes.addCoins`, no `addCoins` suelto: así lo lee `efectosDeConsumir` en el servidor.
    // Puesto un nivel más arriba, la bolsa decía «+50 ◈, ya está en tu cuenta» y no pagaba nada.
    // xp: Norberto lo pidió para los premios que configura el referente («una recompensa de xp,
    // dinero o material»). No para la asistencia, que enturbiaría la puntuación; esto lo decide él.
    var efecto = tipo === "bolsa" ? { attributes: { addCoins: cuanto } }
               : tipo === "xp" ? { attributes: { addPoints: cuanto } }
               : tipo === "heroe" ? (heroe ? heroe.consumeEffects : null)
               : (sobre ? sobre.consumeEffects : null);
    return {
      projectId: perId, title: h.nombre || ("Escondite " + h.id), description: "Un escondite de la Tripulación Cero.",
      cost: 0, inStore: false, type: "item", stargateTipo: "huevo", stargateId: "huevo_" + h.id,
      stargateHuevo: { id: String(h.id), premio: tipo, creditos: cuanto, cantidad: cuanto },
      isConsumable: true, maxUses: tipo === "sobre" ? Number((sobre && sobre.maxUses) || 3) : 1,
      consumeEffects: efecto || {},
      claimLinkEnabled: h.activo !== false,
      claimLinkMaxPerUser: 1,
      claimLinkMaxTotal: Number(h.limite) > 0 ? Number(h.limite) : null,
      claimLinkMaxPerSquad: Number(h.porEscuadron) > 0 ? Number(h.porEscuadron) : 0
    };
  }
  function idPremioHuevo(perId, huevoId) { return perId + "__huevo_" + String(huevoId); }

  return { paquete: paquete, masDias: masDias, inicioDeSemana: inicioDeSemana,
           semanaEnTipo: semanaEnTipo, creditosDe: creditosDe, escalaXp: escalaXp,
           codigoNuevo: codigoNuevo, premioDeHuevo: premioDeHuevo, idPremioHuevo: idPremioHuevo };
});
