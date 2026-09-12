'use strict';
// 54 · EL TRADUCTOR: MISMO TABLERO, OTRO MOTOR
//
// Por qué existe esta batería y no otra cosa: mudarse de Apps Script a Firestore podría hacerse
// reescribiendo la web entera. No se va a hacer así. Se va a escribir UN traductor que lea lo que
// guarda GamificaPro y devuelva **el mismo objeto** que devuelve hoy `tablero_()`. Si el objeto es
// el mismo, la Nave, la sala de clase, el panel y la sesión proyectable siguen funcionando sin que
// nadie las toque, y el cambio de motor es un interruptor en vez de una reescritura.
//
// 🔴 Y por eso la única prueba que vale es ESTA: darle a los dos motores exactamente los mismos
// hechos y comparar sus tableros campo por campo. Cualquier otra prueba diría que el traductor
// «funciona» sin decir si dice la verdad.
//
// La prueba de arriba abajo, sin red y sin cuenta de Google: el motor viejo corre en el mundo
// simulado de siempre; el nuevo recibe documentos de Firestore construidos a partir de LOS MISMOS
// registros.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const path = require("path");
const { catalogo } = require(path.join(__dirname, "..", "motor", "catalogo.js"));
const { paquete } = require(path.join(__dirname, "..", "motor", "paquete.js"));
const NUEVO = require(path.join(__dirname, "..", "motor", "tablero.js"));
console.log("\n▶ 54 · El traductor: mismo tablero, otro motor");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco";
const o = G.perObj_(G.perFila_(PER).v);
const cat = catalogo();

// ------------------------------------------------------------------ los mismos hechos, dos veces
// Tres reclutas con historias distintas a propósito: una que va lanzada, otro que se alistó y
// desapareció, y una tercera que empató en xp para que el desempate se note.
const GENTE = [
  { email: "ana@alumno.es",  alias: "Ana",  nombre: "Ana Ruiz",   retos: ["A0", "A1", "B1", "X1"] },
  { email: "luis@alumno.es", alias: "Luis", nombre: "Luis Paz",   retos: ["A0"] },
  { email: "eva@alumno.es",  alias: "Eva",  nombre: "Eva Sol",    retos: ["A0", "A1", "B1", "X1"] }
];
const RETOS = G.RETOS_REGULAR;
const etiqueta = id => RETOS.filter(r => r[0] === id)[0][1];
GENTE.forEach(p => {
  E.enviarBitacora(G, PER, { email: p.email, alias: p.alias, nombre: p.nombre, profe: "Mr Cuarter",
                             marcados: E.marcar(G, p.retos.map(etiqueta)) });
});

const viejo = G.tablero_(PER, true);
c(viejo.reclutas.length === 3, "el motor viejo ve a los tres reclutas");

// ------------------------------------------------------------------ el espejo en Firestore
// Se construyen los documentos a partir del MISMO tablero viejo: los xp, los créditos y las fechas
// no se recalculan aquí, se copian. Así la comparación mide el traductor, no una segunda
// implementación de la aritmética que podría equivocarse igual en los dos sitios.
const p = paquete({ id: PER, nombre: o.nombre, tipo: o.tipo, inicio: o.inicio,
                    referente: "norberto@unir.net",
                    docentes: E.DOCENTES_DEMO.map(d => ({ nombre: d.nombre, correo: d.correo, rol: d.rol })) }, cat);
const perfiles = [], privados = {};
viejo.reclutas.forEach(function (r, i) {
  const id = "perf" + i, sellos = {};
  Object.keys(r.retos).forEach(function (k) { sellos[k] = [new Date(r.retos[k].fecha).toISOString()]; });
  perfiles.push({ id: id, userId: "uid" + i, projectId: PER, displayName: r.alias,
                  totalPoints: r.xp, coins: r.creditos,
                  completedMissionIds: Object.keys(r.retos), missionTimestamps: sellos,
                  completedCampaignIds: (r.bonus || []).map(function (b) {
                    return b.indexOf("planeta:") === 0 ? "tema" + b.slice(8) : b; }),
                  inventory: [],
                  stargateProfe: r.profe, stargateCreditosGanados: r.creditos_ganados,
                  stargateCreditosGastados: r.creditos_gastados });
  privados[id] = { firstName: r.nombre.split(" ")[0], lastName: r.nombre.split(" ").slice(1).join(" "),
                   email: r.email, bitacora: r.bitacora, bio: r.bio };
});
const nuevo = NUEVO.tablero({ proyecto: Object.assign({ id: PER }, p.proyecto),
                              misiones: p.misiones, campanas: p.campanas, recompensas: p.recompensas,
                              perfiles: perfiles, privados: privados, vales: [], catalogo: cat }, true);

// ------------------------------------------------------------------ a) la cabecera del PER
igual(nuevo.per, viejo.per, "mismo id de PER");
igual(nuevo.tipo, viejo.tipo, "mismo tipo");
igual(nuevo.inicio, viejo.inicio, "misma fecha de inicio");
igual(nuevo.semanas, viejo.semanas, "mismo número de semanas");
igual(nuevo.semana, viejo.semana, "🔴 misma semana en curso (de esto cuelga la sesión proyectable)");
igual(nuevo.cierre_misiones, viejo.cierre_misiones, "mismo cierre de misiones");
igual(nuevo.cierre_canje, viejo.cierre_canje, "mismo cierre de canje");

// ------------------------------------------------------------------ b) el ranking, recluta a recluta
// El orden importa tanto como los números: el ranking es lo primero que mira el alumnado.
igual(nuevo.reclutas.map(x => x.alias), viejo.reclutas.map(x => x.alias),
  "🔴 el ranking sale en el MISMO orden, desempates incluidos");

const CAMPOS = ["xp", "nivel", "rango", "rango_nombre", "nivel_titulo", "xp_siguiente", "xp_faltan",
                "creditos", "creditos_ganados", "creditos_gastados", "n", "tema", "planeta",
                "xp7", "corona", "racha", "pos", "repes", "n_album", "n_heroes",
                "planetas_completos", "skins"];
viejo.reclutas.forEach(function (v, i) {
  const n = nuevo.reclutas[i];
  CAMPOS.forEach(function (k) { igual(n[k], v[k], v.alias + " · " + k); });
  // las insignias, como conjunto: el orden en que se descubren no es dato
  igual(n.insignias.slice().sort(), v.insignias.slice().sort(), v.alias + " · las mismas insignias");
});

// ------------------------------------------------------------------ c) la colección
// El porcentaje NO se redondea: con 55 piezas dos reclutas distintos caerían en el mismo entero y
// el ranking de colección los ordenaría al azar.
viejo.reclutas.forEach(function (v, i) {
  igual(nuevo.reclutas[i].coleccion.total, v.coleccion.total, v.alias + " · mismo total de colección");
  igual(nuevo.reclutas[i].coleccion.tengo, v.coleccion.tengo, v.alias + " · mismas piezas");
});

// ------------------------------------------------------------------ d) lo privado sigue siendo privado
// 🔴 El correo y el nombre real solo viajan tras el PIN. Que cambie el motor no puede cambiar esto:
// en Firestore viven en `student_profiles/{id}/privado`, una subcolección con su propia regla.
const publico = NUEVO.tablero({ proyecto: Object.assign({ id: PER }, p.proyecto),
                                misiones: p.misiones, campanas: p.campanas, recompensas: p.recompensas,
                                perfiles: perfiles, privados: privados, vales: [], catalogo: cat }, false);
publico.reclutas.forEach(function (r) {
  c(r.email === undefined, "el tablero público NO lleva el correo de " + r.alias);
  c(r.nombre === undefined, "   ni su nombre real");
  c(r.retos === undefined, "   ni el detalle de sus retos");
});
c(publico.docentes_full === undefined, "🔴 ni los correos del profesorado");
c(nuevo.reclutas[0].email === "ana@alumno.es", "y con PIN sí sale el correo, como siempre");

// ------------------------------------------------------------------ e) el catálogo no se copia
// Si alguien añade un reto a Datos.gs, el motor nuevo tiene que enterarse solo. Un catálogo
// duplicado a mano es una bomba de relojería: se actualiza uno y el otro no.
igual(p.misiones.length, RETOS.length + 1,
  "🔴 hay una misión por reto del catálogo REAL (más el alistamiento, que no se marca pero puntúa)");
igual(p.misiones.map(m => m.id).sort(), RETOS.map(r => r[0]).concat(["H1"]).sort(),
  "y con los mismos identificadores");
RETOS.forEach(function (r) {
  const m = p.misiones.filter(x => x.id === r[0])[0];
  igual(m.points, r[3], "misión " + r[0] + " · mismos xp que el catálogo");
  igual(m.coinsReward, G.creditosDe_(r[0], "REGULAR"), "misión " + r[0] + " · mismos créditos");
});

// ------------------------------------------------------------------ f) lo que el motor nuevo trae de fábrica
// Tres cosas que en Apps Script son código nuestro y aquí son un campo. Menos código nuestro es
// menos código que mantener durante una baja de paternidad.
const arsenal = p.recompensas.filter(r => r.stargateTipo === "nota");
c(arsenal.length === 4, "las cuatro recompensas del Arsenal están");
arsenal.forEach(function (r) {
  c(r.requiresApproval === true, "🔴 «" + r.title + "» exige aprobación del docente: la cola de nota");
  c(r.availableFrom > new Date(o.inicio + "T00:00:00").getTime(),
    "   y no existe desde el primer día: tiene puerta de semana");
});
const sobre = p.recompensas.filter(r => r.title === "Sobre de cromos")[0];
igual(sobre.consumeEffects.lootBox.items.length, cat.cromos.length,
  "🔴 el sorteo del sobre lo hace el motor: las 20 cartas, con sus pesos");
igual(sobre.consumeEffects.lootBox.items.reduce((a, b) => a + b.probability, 0), 100,
  "   y los pesos siguen sumando 100");

// ------------------------------------------------------------------ g) el PER es del referente, con sus enlaces
// La pregunta que abrió todo esto: si desaparece la hoja de cálculo, ¿dónde se crea un PER y dónde
// se ponen el Genially y el Padlet? Aquí: en el documento del proyecto, en un apartado propio.
const conEnlaces = paquete({ id: "x", nombre: "X", tipo: "REGULAR", inicio: "2026-09-15",
  referente: "REF@unir.net", padlet: "https://padlet.com/clase",
  panelVer: "https://view.genially.com/ver", panelEdit: "https://app.genially.com/editor/ed",
  docentes: [{ nombre: "Ana", correo: "ana@unir.net", panel: "https://view.genially.com/ana" }] }, cat);
igual(conEnlaces.proyecto.stargate.padlet, "https://padlet.com/clase", "🔴 el padlet del PER se guarda con el PER");
igual(conEnlaces.proyecto.stargate.panelVer, "https://view.genially.com/ver", "   y el Genially de la clase");
igual(conEnlaces.proyecto.stargate.paneles, { "Ana": "https://view.genially.com/ana" },
  "   y el Genially propio de cada docente, que es lo que pidió el profesorado");
igual(conEnlaces.privado.referente, "ref@unir.net", "el referente se guarda en minúsculas, como su correo");
igual(conEnlaces.proyecto.coTeacherEmails, ["ana@unir.net", "n.cuartero.10@gmail.com", "mutecdgami@gmail.com"],
  "🔴 y el equipo docente va TAMBIÉN en coTeacherEmails: es lo que mira la regla de Firestore para dejarles editar");
/**
 * 🔴 12-sep · EL SEGUNDO CORREO NO SOBRA: es el REFERENTE VITALICIO.
 *
 * Norberto lleva el proyecto entero y es referente de todos los grupos, siempre, sin que nadie
 * tenga que acordarse de apuntarlo al crear uno. Y tiene que ir AQUÍ, en el documento, no en una
 * comprobación del navegador: `misPERs` le pregunta a Firestore por los proyectos donde tu correo
 * está en `coTeacherEmails`, y esa pregunta la responde el SERVIDOR. Un permiso que solo existiera
 * en la página no le haría ver ni un grupo — se encontraría «esta cuenta no lleva ningún grupo» en
 * su propio sistema.
 */
c(conEnlaces.proyecto.coTeacherEmails.indexOf("n.cuartero.10@gmail.com") >= 0,
  "🔴 el referente vitalicio entra SIEMPRE, aunque no se le ponga en el equipo docente");
igual((conEnlaces.privado.docentes.filter(function (d) { return d.correo === "n.cuartero.10@gmail.com"; })[0] || {}).rol,
  "referente", "   y entra con rol de referente, no de docente que imparte");
igual(conEnlaces.proyecto.factions.length, 1,
  "🔴 pero NO se lleva un escuadrón: no imparte, y si contara tendría alumnado que no es suyo");

// ------------------------------------------------------------------ g bis) lo que NO puede ir en abierto
// El documento del proyecto lo lee cualquiera con sesión en GamificaPro —lo necesitan el ranking y
// el salón de la fama—, así que lo que se guarde ahí es público de hecho. El enlace de EDICIÓN del
// Genially no le sirve de nada a un extraño (Genially comprueba permisos por su cuenta), pero no
// pinta nada en el documento que lee todo el mundo; y los correos del profesorado, tampoco.
const enAbierto = JSON.stringify(conEnlaces.proyecto.stargate);
c(enAbierto.indexOf("app.genially.com/editor") < 0,
  "🔴 el enlace de EDICIÓN del Genially NO está en el documento abierto del proyecto");
c(enAbierto.indexOf("@unir.net") < 0,
  "🔴 ni un solo correo del profesorado en el documento abierto");
c(conEnlaces.proyecto.stargate.docentes.every(d => d.correo === undefined),
  "   los docentes salen con nombre y rol, sin correo");
igual(conEnlaces.proyecto.stargate.docentes, [{ nombre: "Ana", rol: "docente" }],
  "   porque el alumnado sí necesita saber quién le imparte");
igual(conEnlaces.privado.panelEdit, "https://app.genially.com/editor/ed",
  "y lo de editar vive en `privado`, con su propia regla");
c(conEnlaces.privado.docentes[0].correo === "ana@unir.net", "   junto con los correos");

// el tablero que ve el alumnado no puede enseñar ni el enlace de edición ni un correo
const sinPin = JSON.stringify(publico);
c(sinPin.indexOf("app.genially.com/editor") < 0, "🔴 y el tablero público tampoco lo enseña");
c(sinPin.indexOf("@") < 0 || sinPin.indexOf("unir.net") < 0, "   ni un correo del equipo docente");

// ------------------------------------------------------------------ h) PUA no es REGULAR recortado
// 15 semanas y 8 semanas no son la misma escala. Copiar las puertas tal cual dejaría el Arsenal de
// la semana 15 fuera de un curso que acaba en la 8: inalcanzable por aritmética, no por diseño.
const pua = paquete({ id: "p", nombre: "P", tipo: "PUA", inicio: "2026-09-15", docentes: [] }, cat);
igual(pua.proyecto.stargate.semanas, cat.semanas.PUA, "un PUA dura las semanas de un PUA");
const arsPua = pua.recompensas.filter(r => r.stargateTipo === "nota")[0];
c(arsPua.stargateSemana <= cat.semanas.PUA,
  "🔴 el Arsenal se abre DENTRO del curso corto (semana " + arsPua.stargateSemana + " de " + cat.semanas.PUA + ")");
c(pua.proyecto.levelSystem[9].xpRequired < p.proyecto.levelSystem[9].xpRequired,
  "y llegar a Leyenda cuesta menos xp en PUA, porque el viaje da menos");

// ------------------------------------------------------------------ i) los dos identificadores
// 🔴 Esto casi se cuela en producción. Las colecciones de GamificaPro son comunes a todos los
// proyectos, así que el documento de una misión se llama «grupo__A1» — y eso es lo que escribe
// `completeMission` en la ficha del alumno. Pero el resto del sistema (los ajustes del
// profesorado, los enlaces de los Geniallys, este banco) habla en «A1». Si el traductor solo
// entendiera uno de los dos, el tablero saldría en blanco para todo el mundo: cero xp, cero
// insignias, cero retos hechos, sin un solo error por ninguna parte.
const conDoc = perfiles.map(function (f) {
  const copia = JSON.parse(JSON.stringify(f));
  copia.completedMissionIds = f.completedMissionIds.map(function (x) { return PER + "__" + x; });
  copia.missionTimestamps = {};
  Object.keys(f.missionTimestamps).forEach(function (k) {
    copia.missionTimestamps[PER + "__" + k] = f.missionTimestamps[k];
  });
  return copia;
});
const misionesConDoc = p.misiones.map(function (m) {
  return Object.assign({}, m, { docId: PER + "__" + m.id });
});
const largo = NUEVO.tablero({ proyecto: Object.assign({ id: PER }, p.proyecto),
  misiones: misionesConDoc, campanas: p.campanas, recompensas: p.recompensas,
  perfiles: conDoc, privados: privados, vales: [], catalogo: cat }, true);
igual(largo.reclutas.map(x => [x.alias, x.xp, x.n]), nuevo.reclutas.map(x => [x.alias, x.xp, x.n]),
  "🔴 con identificadores de DOCUMENTO sale exactamente el mismo tablero que con los cortos");
igual(Object.keys(largo.reclutas[0].retos).sort(), Object.keys(nuevo.reclutas[0].retos).sort(),
  "   y los retos se devuelven SIEMPRE con el identificador de STARGATE, venga como venga guardado");
c(Object.keys(largo.reclutas[0].retos).every(k => k.indexOf("__") < 0),
  "   nunca con el del documento: la Nave y los Geniallys hablan en «A1», no en «grupo__A1»");

E.resumen("El traductor: mismo tablero, otro motor");
