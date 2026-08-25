'use strict';
// 13 · CALENDARIO DEL PER (v3.14, petición del usuario 25-ago)
//      Los formularios abren UNA SEMANA ANTES de la semana 1, el registro de misiones cierra al
//      acabar la última semana, y el CANJE aguanta UNA SEMANA MÁS.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 13 · Calendario por defecto del PER (apertura y dos cierres)");

const G = E.nuevoMundo();
const triggersDe = fn => M.Guiones.getProjectTriggers().filter(t => t.getHandlerFunction() === fn);

// ---------------------------------------------------------------- las cuentas
igual(G.SEMANAS_PER, { REGULAR: 15, PUA: 8 }, "el viaje dura 15 semanas (8 en PUA)");
igual(G.SEMANAS_CANJE_EXTRA, 1, "el canje aguanta una semana más");
igual(G.DIAS_APERTURA_ANTES, 7, "y los formularios abren una semana antes");

let fx = G.fechasPER_("2026-09-14", "REGULAR");
igual(fx.apertura, "2026-09-07", "apertura = una semana antes de la semana 1");
igual(fx.cierreMisiones, "2026-12-27", "misiones hasta el último día de la semana 15");
igual(fx.cierreCanje, "2027-01-03", "y el canje una semana más");
igual(G.semanaDe_({ inicio: "2026-09-14" }) !== null, true, "semanaDe_ sigue funcionando");

fx = G.fechasPER_("2026-09-14", "PUA");
igual(fx.semanas, 8, "en PUA el viaje son 8 semanas");
igual(fx.cierreMisiones, "2026-11-08", "misiones hasta el último día de la semana 8");
igual(fx.cierreCanje, "2026-11-15", "y el canje hasta la 9");
igual(G.fechasPER_("", "REGULAR"), null, "sin fecha de semana 1 no hay calendario");

// la semana de desbloqueo escala igual que antes
igual(G.desdeEfectiva_(15, "PUA"), 8, "una recompensa de la semana 15 abre en la 8 en PUA");
igual(G.desdeEfectiva_(2, "REGULAR"), 2, "y en REGULAR no se toca");

// ---------------------------------------------------------------- al crear el PER
const r = E.crearPERDemo(G, { inicio: "2026-09-14", apertura: "", cierre: "" });
igual(r.apertura, "2026-09-07", "crearPER rellena la apertura sola");
igual(r.cierre, "2026-12-27", "y el cierre de misiones");
igual(r.cierreCanje, "2027-01-03", "y el del canje, una semana después");
igual(r.semanas, 15, "y dice cuántas semanas dura");

const fila = G.hoja_("PERs").getDataRange().getValues();
const cab = fila[0].map(String);
igual(cab[23], "Cierre del canje", "la hoja tiene su columna «Cierre del canje»");
c(!!fila[1][23], "y la fila la trae rellena");
igual(G.perObj_(fila[1]).cierreCanje, "2027-01-03", "perObj_ la lee");

igual(triggersDe("cerrarMisionesPorTrigger").length, 1, "se programa el cierre de misiones");
igual(triggersDe("cerrarPorTrigger").length, 1, "y el cierre del canje, aparte");

// ---------------------------------------------------------------- cerrar solo las misiones
const o = G.perObj_(G.perFila_("prueba-banco").v);
// la semana 1 es futura, así que el PER nace PROGRAMADO (todo cerrado): eso también se comprueba
igual(G.perObj_(G.perFila_("prueba-banco").v).estado, "Programado", "un PER que empieza en el futuro nace programado");
igual(G.formDelPER_(o, "B").isAcceptingResponses(), false, "con sus formularios cerrados hasta la apertura");
G.setAbierto_("prueba-banco", true);
G.setAbierto_("prueba-banco", false, ["B", "T"]);
igual(G.formDelPER_(o, "B").isAcceptingResponses(), false, "la Bitácora queda cerrada");
igual(G.formDelPER_(o, "T").isAcceptingResponses(), false, "el ticket también");
igual(G.formDelPER_(o, "C").isAcceptingResponses(), true, "🔴 pero el CANJE sigue abierto");
igual(G.perObj_(G.perFila_("prueba-banco").v).estado, "Solo canje", "y el estado lo dice: «Solo canje»");

G.setAbierto_("prueba-banco", false);
igual(G.perObj_(G.perFila_("prueba-banco").v).estado, "Cerrado", "cerrarlo todo deja «Cerrado»");
G.setAbierto_("prueba-banco", true);
igual(G.perObj_(G.perFila_("prueba-banco").v).estado, "Abierto", "y abrirlo todo, «Abierto»");

// el trigger de cierre de misiones no toca el canje
const t = triggersDe("cerrarMisionesPorTrigger")[0];
G.cerrarMisionesPorTrigger({ triggerUid: t.getUniqueId() });
igual(G.formDelPER_(o, "C").isAcceptingResponses(), true, "el trigger de misiones NO cierra el canje");
igual(G.formDelPER_(o, "B").isAcceptingResponses(), false, "pero sí la Bitácora");

// ---------------------------------------------------------------- lo ve el alumnado y el profesorado
const pub = G.tablero_("prueba-banco", false);
igual(pub.cierre_misiones, "2026-12-27", "el tablero público dice hasta cuándo se registran misiones");
igual(pub.cierre_canje, "2027-01-03", "y hasta cuándo se canjea");
igual(pub.apertura, "2026-09-07", "y desde cuándo está abierto");
igual(pub.semanas, 15, "y cuántas semanas dura el viaje");

// ---------------------------------------------------------------- mover la semana 1 mueve todo
M.Props.getScriptProperties().setProperty("PIN_PROFES", "sg2026");
const post = q => JSON.parse(G.doPost({ postData: { contents: JSON.stringify(q) } }).getContent());
const rr = post({ accion: "inicio", per: "prueba-banco", pin: "sg2026", inicio: "2026-10-05" });
igual(rr.ok, true, "cambiar la semana 1 responde ok");
igual(rr.calendario.apertura, "2026-09-28", "y recalcula la apertura");
igual(rr.calendario.cierreMisiones, "2027-01-17", "el cierre de misiones");
igual(rr.calendario.cierreCanje, "2027-01-24", "y el del canje");
igual(G.perObj_(G.perFila_("prueba-banco").v).cierreCanje, "2027-01-24", "y lo guarda en la hoja");
igual(triggersDe("cerrarMisionesPorTrigger").length, 1, "sin duplicar el trigger de misiones");
igual(triggersDe("cerrarPorTrigger").length, 1, "ni el del canje");

// ---------------------------------------------------------------- cierre a mano: el canje va detrás
const G2 = E.nuevoMundo();
const r2 = E.crearPERDemo(G2, { nombre: "A MANO", inicio: "2026-09-14", cierre: "2026-11-30" });
igual(r2.cierre, "2026-11-30", "un cierre puesto a mano manda");
igual(r2.cierreCanje, "2026-12-07", "y el canje se va una semana detrás, igual");

// ---------------------------------------------------------------- desbloqueos nuevos
const cat = {};
G2.RECOMPENSAS_INICIALES.forEach(x => { cat[x[0]] = x[4]; });
igual(cat["Cambio de avatar"], 2, "«Cambio de avatar» se adelanta a la semana 2");
igual(cat["Avatar personal (tu propia imagen)"], 5, "«Avatar personal» pasa de la 10 a la 5");
igual(cat["Sobre de cromos"], 2, "los cromos siguen en la 2");
igual(cat["Subir 0,5 en un entregable"], 14, "y las notas en la 14");

E.resumen("Calendario por defecto del PER");
