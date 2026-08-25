'use strict';
// 6 · La API: doGet público (alumnado), doPost con PIN (profesorado) y la ficha bidireccional
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 6 · API pública y privada");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco";
const post = q => JSON.parse(G.doPost({ postData: { contents: JSON.stringify(q) } }).getContent());
const get = p => JSON.parse(G.doGet({ parameter: p }).getContent());

E.enviarBitacora(G, PER, { email: "ana@alumno.es", alias: "Ana", nombre: "Ana Ruiz", profe: "Mr Cuarter", bitacora: "https://ana.example" });
E.enviarBitacora(G, PER, { email: "bea@alumno.es", alias: "Bea", nombre: "Bea Gil", profe: "Norberto Genially" });

// --- doGet: nunca filtra datos personales -------------------------------------------------------
const todos = get({ per: "all" });
igual(todos.pers.length, 1, "?per=all lista los PER activos");
igual(todos.pers[0].id, PER, "con su id");
c(todos.pers[0].referente === undefined, "y sin datos de más");

const tab = get({ per: PER });
igual(tab.reclutas.length, 2, "el tablero público trae a los 2 reclutas");
c(tab.reclutas.every(x => x.email === undefined), "🔒 el tablero público NO expone correos");
c(tab.reclutas.every(x => x.nombre === undefined), "🔒 ni nombres reales");
c(tab.reclutas.every(x => x.bitacora === undefined), "🔒 ni el enlace del ePortfolio");
c(tab.docentes_full === undefined, "🔒 ni los correos del equipo docente");
c(Array.isArray(tab.docentes) && tab.docentes.length === 3, "pero sí los nombres del equipo docente");
igual(tab.docentes.filter(d => d.referente).length, 1, "con un referente marcado");
igual(tab.docentes.filter(d => d.imparte).length, 3, "y los 3 imparten (el referente también)");

// --- identificación del recluta (sin PIN): solo SU ficha -----------------------------------------
const yo = post({ accion: "quien", per: PER, email: "ANA@alumno.es" });
igual(yo.yo.alias, "Ana", "«quien» devuelve la ficha del correo indicado");
c(yo.yo.email === undefined, "🔒 y no repite el correo");
c(yo.yo.nombre === undefined, "🔒 ni el nombre real");
igual(post({ accion: "quien", per: PER, email: "nadie@alumno.es" }).yo, null, "un correo desconocido devuelve null");

// --- PIN ------------------------------------------------------------------------------------------
igual(post({ accion: "alumnos", per: PER }).error, "PIN incorrecto", "sin PIN no se entra");
igual(post({ accion: "alumnos", per: PER, pin: "0000" }).error, "PIN incorrecto", "con un PIN cualquiera tampoco (no hay PIN puesto)");
require("./mocks.js").Props.getScriptProperties().setProperty("PIN_PROFES", "sg2026");
const pin = "sg2026";
const priv = post({ accion: "alumnos", per: PER, pin });
c(priv.reclutas.every(x => !!x.email), "con PIN sí llegan los correos");
c(!!priv.docentes_full[0].correo, "y el equipo docente con correo");

const pers = post({ accion: "pers", pin });
igual(pers.pers.length, 1, "«pers» lista los PER");
igual(pers.pers[0].docentes.length, 3, "con su equipo docente");
c(typeof pers.pers[0].semana === "number", "y la semana en curso");

// --- ficha bidireccional (el docente corrige desde clase.html) -------------------------------------
const r = post({ accion: "ficha", per: PER, pin, email: "bea@alumno.es",
  alias: "Bea la Rápida", profe: "Mr Cuarter", bitacora: "https://bea.example/nuevo", profe_edita: "Mr Cuarter" });
igual(r.ok, true, "la acción «ficha» responde ok");
c(r.tocados.indexOf("alias") >= 0 && r.tocados.indexOf("profe") >= 0, "y dice qué campos tocó");
const bea = G.tablero_(PER, true).reclutas.filter(x => x.email === "bea@alumno.es")[0];
igual(bea.alias, "Bea la Rápida", "el alias queda corregido en la Bitácora");
igual(bea.profe, "Mr Cuarter", "y el docente reasignado");
igual(bea.bitacora, "https://bea.example/nuevo", "y el ePortfolio");
const aj = G.hoja_("AJUSTES").getDataRange().getValues().slice(1).filter(x => x[3] === "FICHA");
igual(aj.length, 1, "queda registrado en AJUSTES quién lo tocó");
igual(post({ accion: "ficha", per: PER, pin, email: "nadie@x.es", alias: "X" }).error,
  "No encuentro a ese recluta en la Bitácora del grupo", "y un correo inexistente da un error claro");

// --- otorgar/anular, entregado y tickets ------------------------------------------------------------
post({ accion: "ajuste", per: PER, pin, email: "ana@alumno.es", reto_id: "A2", tipo: "otorgar", motivo: "en clase", profe: "Mr Cuarter" });
igual(G.tablero_(PER, true).reclutas.filter(x => x.email === "ana@alumno.es")[0].xp, 200, "el profe otorga un reto desde la web");

const tk = G._maestra.getSheetByName("T · " + PER);
tk.appendRow([new Date(), "Mr Cuarter", "Tema 1: Creación de contenido multimedia (Fôrge)", "", "", "", "", "", "No entiendo el punto 3"]);
const tks = post({ accion: "tickets", per: PER, pin });
igual(tks.tickets.length, 1, "los tickets llegan al panel");
igual(tks.tickets[0].resuelto, "", "sin resolver");
post({ accion: "ticket_resuelto", per: PER, pin, fila: tks.tickets[0].fila, valor: true, profe: "Mr Cuarter" });
contiene(post({ accion: "tickets", per: PER, pin }).tickets[0].resuelto, "Sí", "y se pueden marcar resueltos");

// --- archivar saca el PER de los listados del alumnado ------------------------------------------------
post({ accion: "archivar", per: PER, pin, valor: true });
igual(get({ per: "all" }).pers.length, 0, "un PER archivado desaparece del listado del alumnado");
igual(post({ accion: "pers", pin }).pers.length, 1, "pero el profesorado lo sigue viendo");
igual(get({ per: PER }).reclutas.length, 2, "y su enlace directo sigue funcionando (histórico)");

igual(post({ accion: "inventada", pin }).error, "Acción desconocida", "una acción desconocida da error claro");

E.resumen("API pública y privada");
