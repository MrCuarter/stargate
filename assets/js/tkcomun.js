/**
 * STARGATE — EL TICKET DE SALIDA, LEÍDO UNA SOLA VEZ (20-sep-2026).
 *
 * 🔴 POR QUÉ ESTE FICHERO. El ticket lo necesitan dos pantallas: la SESIÓN que se proyecta («Cómo os fue» y «Vuestras
 * dudas») y la NAVE del Comandante (la caja donde se repasan las respuestas y se decide qué se proyecta). Tenían el
 * mismo código dos veces —pedirlo, entender las columnas, sacar los porcentajes— y eso, tarde o temprano, son dos
 * verdades distintas sobre lo mismo. Un dato, un sitio: aquí.
 *
 * Lo que NO vive aquí: qué se fija y qué se oculta. Eso es de cada docente en cada grupo y se guarda en el motor
 * (`MOTOR.marcasTicket` / `MOTOR.marcarTicket`), porque viaja con la cuenta, no con el navegador.
 */
(function () {
  var TK = null, PROMESA = null;

  /**
   * Las respuestas del grupo, una vez por página. El lector vive en una hoja de Google (apps-script/LectorTickets.gs)
   * y desde el 20-sep pide identificarse: se le manda la credencial de la sesión. Si Google tarda, a los 12 segundos
   * se deja de esperar y se dice; la clase no puede pararse por esto.
   */
  function pedir(per) {
    if (!per) return Promise.resolve({ per: per, lista: [], error: true });
    if (PROMESA && TK && TK.per === per && !TK.error) return PROMESA;
    if (PROMESA && !TK) return PROMESA;
    var M = window.SG && window.SG.MOTOR;
    /**
     * 🔴 20-sep · PRIMERO SE MIRA EN EL PROPIO GRUPO. La Nave Escuela —el grupo para que el profesorado
     * trastee— lleva sus tickets sembrados en `privado/tickets`, porque sus respuestas no pueden ir a la hoja
     * de Google donde escribe el alumnado de verdad. Un grupo normal no tiene ese documento: la lectura
     * devuelve [] y se sale por la puerta de siempre. Se pregunta aquí, y no con una bandera que cada página
     * tendría que acordarse de pasar, porque la página que proyecta la sesión no siempre sabe todavía qué
     * grupo es cuando precarga los tickets.
     */
    var propios = (M && M.ticketsGuardados) ? M.ticketsGuardados(per) : Promise.resolve([]);
    // 🔴 5-oct · después, el ticket del motor (GamificaPro `modTicket`): sus respuestas, como filas de la hoja de antes
    var motor = propios.catch(function () { return []; }).then(function (filas) {
      if (filas && filas.length) return filas;
      return ((M && M.ticketsDelMotor) ? M.ticketsDelMotor(per) : Promise.resolve([])).then(filasDelMotor, function () { return []; });
    });
    var tope = new Promise(function (_, no) { setTimeout(function () { no(new Error("tarda demasiado")); }, 12000); });
    PROMESA = Promise.race([
      motor.then(function (filas) {
        if (filas && filas.length) return { tickets: filas, propios: true };
        if (!window.SG_TICKETS_API) return { error: "" };
        return ((M && M.credencial) ? M.credencial() : Promise.resolve("")).then(function (t) {
          return fetch(String(window.SG_TICKETS_API), { method: "POST", redirect: "follow",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ accion: "tickets", per: per, token: t || "" }) });
        }).then(function (r) { return r.json(); });
      }), tope])
      .then(function (d) { TK = { per: per, lista: (d && d.tickets) || [], error: !!(d && d.error), motivo: (d && d.error) || "" }; return TK; },
            function () { TK = { per: per, lista: [], error: true, motivo: "" }; return TK; });
    return PROMESA;
  }
  function limpiar() { TK = null; PROMESA = null; }

  /**
   * 🔴 5-oct · LAS PREGUNTAS DEL TICKET (la piel; el servidor, GamificaPro `modTicketLogica.js`, solo conoce sus ids y su
   * tipo: si se añade o se quita una, en los dos sitios). Los textos casan con `CORTO` de abajo, que les da su nombre corto.
   * «p» es la presentación de la asignatura; el resto de temas y el balance final («0») llevan las de siempre.
   * 10-oct · Norberto: en los temas, en vez de «¿Alguna duda o comentario?», dos: «Algo positivo» y «Algo a mejorar».
   * `RETIRADAS`: las que ya no se preguntan, pero tienen respuestas guardadas (y el servidor aún las acepta, por la web vieja
   * en caché). El formulario no las pinta (`preguntasDe`); los paneles sí las leen (`filasDelMotor`).
   */
  var SEGUIDO = { id: "seguido", tipo: "opcion", texto: "¿Cómo has seguido esta clase?",
    opciones: [["directo", "En DIRECTO"], ["diferido", "En diferido (la grabación)"]] };
  var PREGUNTAS = {
    p: [
      { id: "vibra", tipo: "escala", texto: "¿Qué vibraciones te ha transmitido la presentación?" },
      { id: "temario", tipo: "escala", texto: "Valora la utilidad que percibes del temario" },
      { id: "previos", tipo: "escala", texto: "Valora tus conocimientos iniciales sobre la asignatura" },
      SEGUIDO,
      { id: "espera", tipo: "texto", texto: "¿Qué esperas de la asignatura?" },
      { id: "duda", tipo: "texto", texto: "¿Alguna duda o comentario?" }],
    tema: [
      { id: "general", tipo: "escala", texto: "Valora la satisfacción general del desarrollo de la clase" },
      { id: "herramientas", tipo: "escala", texto: "Valora la utilidad de las herramientas vistas" },
      { id: "teoria", tipo: "escala", texto: "Valora los contenidos teóricos" },
      { id: "practica", tipo: "escala", texto: "Valora las estrategias prácticas" },
      SEGUIDO,
      { id: "positivo", tipo: "texto", texto: "Algo positivo: algo que has aprendido, que te ha sorprendido o que has descubierto" },
      { id: "mejorar", tipo: "texto", texto: "Algo a mejorar: una duda, un comentario, un problema o una sugerencia" }]
  };
  var RETIRADAS = { tema: [{ id: "duda", tipo: "texto", texto: "¿Alguna duda o comentario?" }] };
  function preguntasDe(tema) { return PREGUNTAS[String(tema)] || PREGUNTAS.tema; }
  /** Las preguntas con las que se LEE lo guardado de un tema: las de hoy y las retiradas. */
  function preguntasLeidas(tema) {
    var k = PREGUNTAS[String(tema)] ? String(tema) : "tema";
    return preguntasDe(tema).concat(RETIRADAS[k] || []);
  }

  /** Los documentos de `mod_tickets` → las filas de la hoja de antes ({ r: { columna: valor }, fila, fecha }). */
  function filasDelMotor(docs) {
    var T = window.SG_TICKET_TEMAS || {}, out = [];
    (docs || []).forEach(function (d) {
      var P = preguntasLeidas(d.tema);
      (d.filas || []).forEach(function (f) {
        var r = { "Selecciona el tema": T[String(d.tema)] || "", "Tu profesor o profesora": f.c || "" };
        P.forEach(function (q) {
          var v = (f.r || {})[q.id]; if (v == null || v === "") return;
          if (q.tipo === "opcion") { var o = (q.opciones || []).filter(function (x) { return x[0] === v; })[0]; v = o ? o[1] : v; }
          r[q.texto] = String(v);
        });
        out.push({ r: r, fila: f.k, fecha: "" });
      });
    });
    return out;
  }

  /**
   * Las columnas que no son ni una nota ni un comentario: la cabecera del formulario y las de elegir.
   * 🔴 «¿Cómo has seguido esta clase?» (en directo / en diferido) se colaba entre los comentarios porque su respuesta
   * es un texto largo. Manda la PREGUNTA, no lo larga que sea la respuesta.
   */
  var ELIGE = /Selecciona el tema|profesor o profesora|prefieres que transcurran|C[oó]mo has seguido/i;
  var CORTO = [[/^Algo positivo/i, "Lo positivo"], [/^Algo a mejorar/i, "A mejorar"], [/utilidad de las herramientas/i, "La utilidad de lo visto"], [/satisfacci[oó]n general del desarrollo/i, "La clase, en general"],
    [/contenidos te[oó]ricos/i, "La teoría"], [/estrategias pr[aá]cticas/i, "La práctica"], [/grado de participaci[oó]n/i, "Vuestra participación"],
    [/utilidad de la actividad/i, "La actividad, ¿os sirvió?"], [/calidad de la actividad que has entregado/i, "Vuestra entrega"],
    [/puntuaci[oó]n obtenida/i, "La nota"], [/vibraciones te ha transmitido/i, "La presentación"], [/utilidad que percibes del temario/i, "El temario"],
    [/conocimientos iniciales/i, "Lo que sabíais al empezar"], [/se ha hablado de la misi[oó]n/i, "Se habló de la misión"],
    [/tablero o el ranking/i, "Se vio el tablero"], [/reconocido en p[uú]blico/i, "Se reconoció a alguien"],
    [/satisfacci[oó]n con tu profesor/i, "Vuestro Comandante"], [/satisfacci[oó]n con la asignatura/i, "La asignatura"],
    [/Comparada con otras asignaturas/i, "Comparada con otras"], [/forma de seguir esta asignatura/i, "Cómo se sigue"],
    [/duda sobre la actividad/i, "Sobre la actividad"], [/Alguna duda/i, "Dudas y comentarios"], [/qu[eé] esperas/i, "Qué esperáis"],
    [/lo mejor/i, "Lo mejor"], [/lo peor/i, "Lo peor"], [/comentario a tu profesor/i, "Para su Comandante"]];
  function corto(c) {
    for (var k = 0; k < CORTO.length; k++) if (CORTO[k][0].test(c)) return CORTO[k][1];
    var t = String(c || "").replace(/^(Valora la satisfacci[oó]n (con|sobre|de)( la| el)?|Valora la|Valora tu|¿C[oó]mo valorar[ií]as tus?|STARGATE · )\s*/i, "");
    t = t.replace(/[¿?]/g, "").trim();
    return t.charAt(0).toUpperCase() + t.slice(1, 52);
  }
  function campo(r, frag) { for (var k in r) if (k.indexOf(frag) >= 0) return r[k]; return ""; }

  /** De las respuestas en bruto a lo que se proyecta: el reparto de cada nota, los textos y cómo siguieron la clase. */
  function analizar(filas) {
    var notas = {}, orden = [], textos = [], seguido = { directo: 0, diferido: 0 };
    filas.forEach(function (x) { Object.keys(x.r).forEach(function (c) {
      var v = String(x.r[c] == null ? "" : x.r[c]).trim(); if (!v) return;
      if (/C[oó]mo has seguido/i.test(c)) { if (/DIRECTO/i.test(v)) seguido.directo++; else if (/diferido|grabaci/i.test(v)) seguido.diferido++; return; }
      if (ELIGE.test(c)) return;
      if (/^[1-5]$/.test(v)) { if (!notas[c]) { notas[c] = [0, 0, 0, 0, 0]; orden.push(c); } notas[c][Number(v) - 1]++; return; }
      if (v.length > 2) textos.push({ c: c, v: v, fila: x.fila, id: idTexto({ fila: x.fila, c: c }) });
    }); });
    var lista = orden.map(function (c) {
      var n = notas[c], total = n.reduce(function (a, b) { return a + b; }, 0);
      return { c: c, corto: corto(c), n: n, total: total,
               media: total ? n.reduce(function (a, b, i) { return a + b * (i + 1); }, 0) / total : 0,
               pct: n.map(function (x) { return total ? Math.round(x * 100 / total) : 0; }) };
    }).filter(function (x) { return x.total; });
    return { notas: lista, textos: textos, seguido: seguido };
  }
  /** El nombre de un comentario, estable entre visitas: su fila en la hoja y de qué pregunta sale. */
  function idTexto(x) { return "f" + (x.fila || 0) + "·" + corto(x.c).slice(0, 24); }

  /**
   * ¿Esta respuesta es del tema de la semana `i`? El formulario tiene una opción por tema y otra por actividad, y las
   * actividades viven DENTRO de un tema: «Actividad 1» cuenta para el tema 1.
   */
  function esDelTema(v, lista, i) {
    var s = lista[i]; if (!s) return true;
    var n = Number(s.tema_n) || 0, t = String(v || "").trim();
    if (!t) return false;
    if (n === 0) return /^Repaso/i.test(t) || /^Presentaci/i.test(t);
    if (new RegExp("^Tema\\s*" + n + "\\b").test(t)) return true;
    var m = t.match(/^Actividad\s*(\d)/i); if (!m) return false;
    for (var k = 0; k < lista.length; k++) if ((Number(lista[k].tema_n) || 0) === n && new RegExp("Actividad\\s*" + m[1] + "\\b", "i").test(String(lista[k].sub || ""))) return true;
    return false;
  }
  /** Las respuestas de un tema y de un Comandante (vacío = todos). */
  function deTema(filas, lista, i, comandante) {
    var yo = String(comandante || "").trim();
    var mias = yo ? filas.filter(function (x) { return String(campo(x.r, "profesor o profesora")).trim() === yo; }) : filas;
    var delTema = function (L) { return L.filter(function (x) { return esDelTema(campo(x.r, "Selecciona el tema"), lista, i); }); };
    // 🔴 5-oct · un escuadrón con menos de 3 respuestas de ese tema no se enseña por separado: se adivinaría quién dijo qué
    var suyas = delTema(mias);
    return suyas.length >= 3 ? suyas : delTema(filas);
  }

  window.SG = window.SG || {};
  window.SG.TK = { pedir: pedir, limpiar: limpiar, PREGUNTAS: PREGUNTAS, RETIRADAS: RETIRADAS, preguntasDe: preguntasDe, preguntasLeidas: preguntasLeidas, filasDelMotor: filasDelMotor, corto: corto, analizar: analizar, esDelTema: esDelTema, deTema: deTema, idTexto: idTexto, campo: campo };
})();

/**
 * 🔴 10-oct · EL PARTE POR ESCUADRÓN, aparte del lector de arriba (y en su propio bloque, para no pisar la rama
 * `preguntas-ticket`, que cambia las preguntas): se cuelga de `SG.TK`.
 */
(function () {
  /* ── 🔴 10-oct · EL PARTE DE LA TRIPULACIÓN, ESCUADRÓN POR ESCUADRÓN ────────────────────────────────────────────────
   * Norberto (PER 16450): «la raya para la meta del 25 %… la idea es ir incrementando la raya». El servidor (GamificaPro
   * `modTicket`, functions/modTicketParte.js) cuenta el ticket de cada tema por escuadrón y cada uno tiene su meta: empieza en
   * el 25 % y sube 5 puntos cada vez que la pasa (tope, 50 %). Aquí, lo que necesitan la sala del docente, su Nave, la Nave del
   * recluta y la sesión: qué tickets están en juego, cómo va cada escuadrón (`parte`), si este recluta ya lo envió (`estado`)
   * y la línea con su barra y su raya. Solo recuentos: nada de lo que se contestó.
   */
  /** Los tickets del curso, en orden: el del embarque («p», semana 1) y el de cada tema con su última semana (`fin`, índice). */
  function ticketsDelCurso(L) {
    var out = [{ clave: "p", fin: 0 }];
    (L || []).forEach(function (s, i) {
      var k = String(Number(s && s.tema_n) || 0), ya = out.filter(function (x) { return x.clave === k; })[0];
      if (ya) ya.fin = i; else out.push({ clave: k, fin: i });
    });
    return out;
  }
  /**
   * Los tickets que ya se pueden enviar en la semana `i` (0 = la primera) de `L`, del más reciente al más antiguo: el del tema
   * que se cierra esa semana, los de los temas ya cerrados y el del embarque. En STARGATE el ticket no tiene ventana (el
   * servidor no le pone `VENTANA`): lo que se abre, no se cierra. Norberto: «cuando empiece la semana del tema dos, se puede
   * recordar hacer el del tema 1».
   */
  function ticketsAbiertos(L, i) {
    if (!(i >= 0) || !L || !L[i]) return [];
    return ticketsDelCurso(L).filter(function (x) { return x.fin <= i; }).map(function (x) { return x.clave; }).reverse();
  }
  /** Los dos que mira el docente en la semana `i`: el del tema de esa semana y el anterior (en la semana 1, el 1 y el embarque). */
  function ticketsDelDocente(L, i) {
    if (!(i >= 0) || !L || !L[i]) return [];
    var T = ticketsDelCurso(L), k = String(Number(L[i].tema_n) || 0), j = T.map(function (x) { return x.clave; }).indexOf(k);
    return j < 0 ? [] : [T[j], T[j - 1]].filter(Boolean).map(function (x) { return x.clave; });
  }
  /** El nombre corto de un ticket: «El embarque», «El repaso final» o «Tema 1 · Fôrge» (de SG_TICKET_TEMAS). */
  function nombreTicket(clave) {
    clave = String(clave);
    if (clave === "p") return "El embarque";
    if (clave === "0") return "El repaso final";
    var t = String((window.SG_TICKET_TEMAS || {})[clave] || ""), m = t.match(/^(Tema\s*\d+).*\(([^)]+)\)\s*$/);
    return m ? m[1] + " · " + m[2] : (t.split(":")[0] || "Tema " + clave);
  }
  /** «del embarque», «del repaso final», «de Tema 1 · Fôrge»: para «Ticket … : 34 de 86». */
  function delTicket(clave) { var n = nombreTicket(clave); return /^El /.test(n) ? "del " + n.slice(3).toLowerCase() : "de " + n; }

  /**
   * Cómo va el parte de un tema: los escuadrones del servidor ([{ firma, respuestas, fichas, meta, umbral, llega, cobrado }]) o
   * null si no contesta (sin desplegar, sin red, sin permiso). 🔴 Lee las ~300 fichas del grupo: UNA vez por página y tema, y
   * se guarda 10 minutos en esta pestaña (repintar, o volver a la Nave, no vuelve a preguntar).
   */
  var PARTES = {};
  function parte(per, tema, M) {
    var k = String(per) + "|" + String(tema), ss = null;
    if (PARTES[k]) return PARTES[k];
    try { ss = JSON.parse(sessionStorage.getItem("sgParte:" + k) || "null"); } catch (e) { ss = null; }
    if (ss && Array.isArray(ss.e) && Date.now() - Number(ss.t) < 10 * 60000) return (PARTES[k] = Promise.resolve(ss.e));
    M = M || (window.SG && window.SG.MOTOR);
    if (!per || !M || typeof M.llamar !== "function") return Promise.resolve(null);
    PARTES[k] = Promise.resolve().then(function () { return M.llamar("modTicket", { accion: "parte", projectId: per, tema: String(tema) }); })
      .then(function (r) {
        var e = r && r.ok && Array.isArray(r.escuadrones) ? r.escuadrones : null;
        if (e) try { sessionStorage.setItem("sgParte:" + k, JSON.stringify({ t: Date.now(), e: e })); } catch (x) { /* sin almacenamiento */ }
        return e;
      }, function () { return null; });
    return PARTES[k];
  }
  /**
   * ¿Este recluta ya envió el ticket de `tema`? true / false, o null si el servidor no contesta (y entonces no se le pide
   * nada). 🔴 Lo dice el servidor (`modTicket({ accion: 'estado' })`), no la marca vieja de este navegador (`sgTicket:…`,
   * que se ponía también al cargar el formulario de Google). Lo que el servidor ya ha dicho que sí se apunta con la ficha
   * (`sgTkHecho:<grupo>:<tema>:<ficha>`) y no se vuelve a preguntar: enviado, no se des-envía.
   */
  function claveHecho(per, tema, ficha) { return "sgTkHecho:" + per + ":" + tema + ":" + (ficha || ""); }
  function apuntarHecho(per, tema, ficha) { try { localStorage.setItem(claveHecho(per, tema, ficha), "1"); } catch (e) { /* sin almacenamiento */ } }
  function estado(per, tema, ficha, M) {
    try { if (localStorage.getItem(claveHecho(per, tema, ficha)) === "1") return Promise.resolve(true); } catch (e) { /* sin almacenamiento */ }
    M = M || (window.SG && window.SG.MOTOR);
    if (!per || !M || typeof M.llamar !== "function") return Promise.resolve(null);
    return Promise.resolve().then(function () { return M.llamar("modTicket", { accion: "estado", projectId: per, tema: String(tema) }); })
      .then(function (r) {
        if (!r || r.ok === false) return null;
        if (r.hecho) { apuntarHecho(per, tema, ficha); return true; }
        return r.abierto === false ? null : false;   // (con ventana, como en DPG: fuera de ella no se pide)
      }, function () { return null; });
  }
  /*
   * 🔴 LA RAYA Y LAS LÍNEAS DEL PARTE son del motor (11-oct; GamificaPro sdk/parte.js, `GP.parte`, que se carga antes que este
   * fichero; prueba: GamificaPro tests/sdk/parte.test.ts, letra por letra lo que se pintaba aquí). Aquí, solo su piel: «tkp».
   *   rayaDe(e)          dónde hay que llegar, en % del escuadrón: el umbral del servidor sobre sus fichas (si el tema ya se
   *                      cobró, el de la meta con la que se juzgó: así la diapositiva que se proyecta después pinta la raya
   *                      que había que pasar)
   *   cifrasDe(e)        { firma, n, total, pct, meta (%), raya (%), llega }
   *   barraParte(c)      la barra con su raya
   *   fraseParte(c, q)   «Tu escuadrón: <b>15 de 76</b> · la raya, 25 %»
   *   lineasParte(E, o)  una fila por escuadrón: o = { mio, nombres, columna, titulo } (ver la pieza)
   */
  var GPP = function () { return window.GP.parte; };
  function rayaDe(e) { return GPP().raya(e); }
  function cifrasDe(e) { return GPP().cifras(e); }
  function barraParte(c) { return GPP().barra(c, "tkp"); }
  function fraseParte(c, quien) { return GPP().frase(c, quien); }
  function lineasParte(esc, o) { var x = {}, k; for (k in (o || {})) x[k] = o[k]; x.clase = "tkp"; return GPP().lineas(esc, x); }

  window.SG = window.SG || {};
  window.SG.TK = window.SG.TK || {};
  var TK = window.SG.TK, nuevas = { ticketsDelCurso: ticketsDelCurso, ticketsAbiertos: ticketsAbiertos, ticketsDelDocente: ticketsDelDocente,
    nombreTicket: nombreTicket, delTicket: delTicket, parte: parte, estado: estado, apuntarHecho: apuntarHecho, rayaDe: rayaDe, cifrasDe: cifrasDe,
    barraParte: barraParte, fraseParte: fraseParte, lineasParte: lineasParte };
  for (var k in nuevas) TK[k] = nuevas[k];
})();
