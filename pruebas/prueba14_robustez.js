'use strict';
// 14 · LO QUE SALIÓ DE LA PRUEBA EN VIVO DEL 25-AGO
//   a) el Estado del canje se escribe ANTES que los correos (si el aviso falla, el canje NO se pierde)
//   b) los triggers no se duplican (había dos: cada envío se procesaba dos veces)
//   c) los orbes se cachean en Drive y no se insiste 8 veces si la web está caída (504)
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 14 · Robustez: el canje no depende del correo, triggers únicos, orbes cacheados");

// ---------------------------------------------------------------- a) el canje sobrevive a un correo roto
let G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "rico@alumno.es");

const enviarOriginal = M.Correo.sendEmail;
M.Correo.sendEmail = function(){ throw new Error("Service invoked too many times: email"); };
let r = E.enviarCanje(G, "prueba-banco", { email: "rico@alumno.es",
  recompensa: E.etiqueta(G, "Subir 0,5 en un entregable"), actividad: "Actividad 1 · imagen con IA" });
M.Correo.sendEmail = enviarOriginal;

igual(r.estado, "Concedido", "🔴 el canje se concede aunque el correo reviente");
const t = G.tablero_("prueba-banco", true).reclutas[0];
const precio05 = G.recompensasCat_().filter(x => x.nombre === "Subir 0,5 en un entregable")[0].coste;
igual(t.creditos_gastados, precio05, "y se cobra igual: el estado en la hoja es lo que manda");
igual(t.canjeados["Subir 0,5 en un entregable"], 1, "y cuenta para el tope por alumno");

// el aviso al docente también va detrás del estado
G.avisarDocente_ = function(){ throw new Error("boom"); };
E.reclutaRico(G, "prueba-banco", "otro@alumno.es");
r = E.enviarCanje(G, "prueba-banco", { email: "otro@alumno.es",
  recompensa: E.etiqueta(G, "Subir 1 punto en un entregable"), actividad: "Actividad 2 · paisaje de aprendizaje" });
igual(r.estado, "Concedido", "🔴 y aunque reviente el aviso al docente");

// ---------------------------------------------------------------- b) triggers sin duplicados
G = E.nuevoMundo();
M.Guiones.newTrigger("alRecibirRespuesta").forSpreadsheet(G._maestra).onFormSubmit().create();
M.Guiones.newTrigger("alRecibirRespuesta").forSpreadsheet(G._maestra).onFormSubmit().create();
M.Guiones.newTrigger("fotoNocturna").timeBased().atHour(4).everyDays(1).create();
M.Guiones.newTrigger("fotoNocturna").timeBased().atHour(4).everyDays(1).create();
igual(M.Guiones.getProjectTriggers().length, 4, "partimos de 4 triggers, dos de ellos duplicados");
G.asegurarTriggers_();
const porFn = {};
M.Guiones.getProjectTriggers().forEach(x => { porFn[x.getHandlerFunction()] = (porFn[x.getHandlerFunction()] || 0) + 1; });
igual(porFn["alRecibirRespuesta"], 1, "🔴 queda UN solo trigger de envío (antes se procesaba dos veces cada respuesta)");
igual(porFn["fotoNocturna"], 1, "y una sola foto nocturna");
G.asegurarTriggers_();
igual(M.Guiones.getProjectTriggers().length, 2, "llamarlo otra vez no crea ni borra de más");

// ---------------------------------------------------------------- c) orbes: caché y web caída
G = E.nuevoMundo();
M.Fetch.llamadas = [];
E.crearPERDemo(G);
const bajadas1 = M.Fetch.llamadas.filter(u => /planetas/.test(u)).length;
igual(bajadas1, 8, "el primer PER descarga los 8 orbes");

M.Fetch.llamadas = [];
E.crearPERDemo(G, { nombre: "SEGUNDO GRUPO" });
igual(M.Fetch.llamadas.filter(u => /planetas/.test(u)).length, 0,
  "🔴 el segundo PER no toca internet: los orbes salen de la copia de Drive");
const o2 = G.perObj_(G.perFila_("segundo-grupo").v);
const PLAN = [1,2,3,4,5,6,7,8].map(t => G.TEMAS[t][0]);
igual(G.formDelPER_(o2, "B").getItems("IMAGE").map(i => i.getTitle()).filter(x => PLAN.indexOf(x) >= 0).length, 8,
  "y aun así quedan los 8 puestos");

// la web caída no se lleva la ejecución por delante
G = E.nuevoMundo();
M.Fetch.codigo = 504;
M.Fetch.llamadas = [];
const rr = E.crearPERDemo(G, { nombre: "WEB CAIDA" });
const intentos = M.Fetch.llamadas.filter(u => /planetas/.test(u)).length;
c(intentos <= 3, "🔴 con la web devolviendo 504 se para a los 2-3 intentos, no insiste 8 veces (" + intentos + ")");
c(!!rr.id, "el PER se crea igual");
igual(rr.pendiente && rr.pendiente.imagenes, true, "y los orbes quedan PENDIENTES, no dados por hechos");

M.Fetch.codigo = 200;
G.continuarAltaPER();
igual(G.progreso_("alta"), null, "cuando la web vuelve, la continuación los coloca y cierra el asunto");
const o3 = G.perObj_(G.perFila_("web-caida").v);
igual(G.formDelPER_(o3, "B").getItems("IMAGE").map(i => i.getTitle()).filter(x => PLAN.indexOf(x) >= 0).length, 8,
  "los 8 orbes acaban puestos");

// ---------------------------------------------------------------- d) una fila se resuelve UNA vez
// VISTO EN VIVO: con dos triggers, un solo sobre de cromos dio DOS cartas.
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "col@alumno.es");
const r2 = E.enviarCanje(G, "prueba-banco", { email: "col@alumno.es", recompensa: E.etiqueta(G, "Sobre de cromos") });
igual(r2.estado, "Concedido", "el sobre se concede");
const antes = G.tablero_("prueba-banco", true).reclutas[0];
const nCromos = Object.keys(antes.cromos).reduce((a, k) => a + antes.cromos[k], 0);
igual(nCromos, 1, "y da UNA carta");

// el mismo envío se procesa otra vez (trigger duplicado / reintento de Google)
const shC = G._maestra.getSheetByName("C · prueba-banco");
const o4 = G.perObj_(G.perFila_("prueba-banco").v);
G.resolverCanje_(o4, shC, r2.fila);
G.resolverCanje_(o4, shC, r2.fila);
const luego = G.tablero_("prueba-banco", true).reclutas[0];
igual(Object.keys(luego.cromos).reduce((a, k) => a + luego.cromos[k], 0), 1,
  "🔴 reprocesar la MISMA fila no reparte más cartas");
igual(luego.creditos_gastados, antes.creditos_gastados, "ni vuelve a cobrar");
igual(luego.canjeados["Sobre de cromos"], 1, "ni cuenta doble para el tope");

E.resumen("Robustez de la prueba en vivo");
