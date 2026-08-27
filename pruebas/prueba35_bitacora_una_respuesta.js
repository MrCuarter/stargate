'use strict';
// 35 · LA BITÁCORA SE RELLENA UNA VEZ Y SE EDITA  (petición de Norberto, 27-ago)
//
// El problema, visto en vivo: al terminar de enviar, Google ofrecía «Modificar tu respuesta» Y
// «Enviar otra respuesta». Con 80 personas, el segundo botón significa alias distintos, avatares
// distintos y reclutas duplicados — porque quien lo pulsa rellena el formulario DESDE CERO.
//
// El 26-ago se había quitado el límite a propósito, porque Google enseña «Solo puedes rellenar este
// formulario una vez» y asusta. Pero editar SIGUE funcionando (setAllowResponseEdits), y el riesgo
// de duplicados es peor que un mensaje confuso. Norberto decidió: una respuesta, editable.
//
// Y la clave técnica: NO se pierde nada, porque la marca temporal del formulario no la usa nadie —
// cada evento se guarda con su propia fecha (ver `registrarEventos_`).
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 35 · La Bitácora: una respuesta, editable");

// ---------------------------------------------------------------- a) al crear el PER
let G = E.nuevoMundo();
E.crearPERDemo(G);
const o = G.perObj_(G.perFila_("prueba-banco").v);
const fb = G.formDelPER_(o, "B");

igual(fb.unaRespuesta, true, "🔴 la Bitácora se limita a UNA respuesta por cuenta de Google");
igual(fb.otraVez, false, "🔴 y NO se ofrece «enviar otra respuesta», que es el botón del desastre");

// el ticket y el canje se quedan como estaban: ahí varios envíos son lo correcto
igual(G.formDelPER_(o, "T").unaRespuesta, false, "el ticket de salida sigue admitiendo varios envíos (uno por clase)");
igual(G.formDelPER_(o, "C").unaRespuesta, false, "y el canje también: se canjea muchas veces");

// ---------------------------------------------------------------- b) el texto explica el flujo
// Si Google va a decir «solo puedes rellenar esto una vez», el formulario tiene que desmentirlo
// antes de que cunda el pánico.
contiene(fb.descripcion, "edítala", "la descripción dice que se EDITA la misma respuesta");
contiene(fb.confirmacion.toLowerCase(), "mismo enlace", "y el mensaje final recuerda por dónde se vuelve");

// ---------------------------------------------------------------- c) en un formulario YA creado
// Los grupos existentes no se recrean: se ponen al día desde el menú «Actualizar formularios».
G = E.nuevoMundo();
E.crearPERDemo(G);
const o2 = G.perObj_(G.perFila_("prueba-banco").v);
const viejo = G.formDelPER_(o2, "B");
viejo.setLimitOneResponsePerUser(false).setShowLinkToRespondAgain(true);   // como estaban hasta hoy
igual(viejo.unaRespuesta, false, "partimos de un formulario con el ajuste viejo");

G.actualizarFormularios_();
igual(G.formDelPER_(o2, "B").unaRespuesta, true, "🔴 «Actualizar formularios» lo corrige en los grupos ya creados");
igual(G.formDelPER_(o2, "B").otraVez, false, "y también quita el enlace de volver a empezar");

// ---------------------------------------------------------------- d) y sigue sin perderse nada
// La razón por la que esto es seguro: el registro es append-only y la fecha la pone el script.
G = E.nuevoMundo();
E.crearPERDemo(G);
E.enviarBitacora(G, "prueba-banco", { email: "uno@alumno.es", alias: "Uno", profe: "Mr Cuarter",
  marcados: { "Tema 1 · Lo que he completado": G.RETOS_REGULAR[0][1] } });
const fila = G._maestra.getSheetByName("B · prueba-banco").getLastRow();
const antes = G.tablero_("prueba-banco", true).reclutas[0];
igual(antes.n >= 2, true, "el primer envío registra su insignia");

// vuelve y marca otra cosa EDITANDO la misma fila (que es justo lo que hará ahora el alumnado)
E.enviarBitacora(G, "prueba-banco", { email: "uno@alumno.es",
  marcados: { "Tema 2 · Lo que he completado": G.RETOS_REGULAR[2][1] } }, fila);
const luego = G.tablero_("prueba-banco", true).reclutas[0];
c(luego.n > antes.n, "editar la MISMA respuesta añade lo nuevo (" + antes.n + " → " + luego.n + ")");
igual(luego.alias, "Uno", "y no le borra el alias que puso al alistarse");
// lo que de verdad importa: cada registro tiene SU fila con SU fecha, puesta por el script
const evs = G.hoja_(G.H.EV).getDataRange().getValues().slice(1).filter(v => v[2] === "uno@alumno.es");
igual(evs.length, 3, "quedan tres eventos: el reclutamiento y los dos retos");
c(evs.every(v => v[0] instanceof Date && !isNaN(v[0])), 
  "🔴 y cada uno lleva su fecha propia: por eso guardar UNA sola respuesta no pierde el histórico");



// ---------------------------------------------------------------- e) el doble check del correo
// El formulario pide el correo a mano aunque Google ya sepa quién eres: es a propósito (en clase se
// les dice que pongan el mismo). Pero hasta hoy NADIE comparaba los dos.
G = E.nuevoMundo();
E.crearPERDemo(G);
const M = E.M;
const shB = G._maestra.getSheetByName("B · prueba-banco");
// la pregunta «Correo» viene de la plantilla, así que aquí se añade la columna a mano
shB.getRange(1, shB.getLastColumn() + 1).setValue("Correo");
M.Correo.limpiar();

E.enviarBitacora(G, "prueba-banco", { email: "buena@alumno.es", alias: "Coincide", profe: "Mr Cuarter" });
let fB = shB.getLastRow();
shB.getRange(fB, shB.getRange(1,1,1,shB.getLastColumn()).getValues()[0].map(String).indexOf("Correo") + 1)
   .setValue("buena@alumno.es");
G.registrarEventos_(G.perObj_(G.perFila_("prueba-banco").v), shB, fB);
igual(M.Correo.enviados.filter(x => /revisa el correo/i.test(x.asunto)).length, 0,
  "si el correo escrito coincide con la cuenta, no se molesta a nadie");

// y ahora uno que escribe otro distinto
E.enviarBitacora(G, "prueba-banco", { email: "cuenta@alumno.es", alias: "NoCoincide", profe: "Mr Cuarter" });
fB = shB.getLastRow();
shB.getRange(fB, shB.getRange(1,1,1,shB.getLastColumn()).getValues()[0].map(String).indexOf("Correo") + 1)
   .setValue("el.que.creia@otro.com");
M.Correo.limpiar();
G.registrarEventos_(G.perObj_(G.perFila_("prueba-banco").v), shB, fB);
const aviso = M.Correo.enviados.filter(x => /revisa el correo/i.test(x.asunto));
igual(aviso.length, 1, "🔴 si NO coincide, se le avisa a él, que es quien puede arreglarlo");
contiene(aviso[0].para, "cuenta@alumno.es", "el aviso va a la cuenta de verdad, no a la inventada");
contiene(aviso[0].cuerpo, "el.que.creia@otro.com", "y le dice exactamente qué escribió");
contiene(aviso[0].cuerpo, "NO has perdido nada", "sin alarmarle: su registro está guardado");
const traza = G.hoja_(G.H.AJ).getDataRange().getValues().slice(1).filter(v => v[4] === "correo");
igual(traza.length, 1, "y queda traza en AJUSTES para el profesorado");

// lo importante: el recluta se crea con el correo de la CUENTA, no con el que escribió
const quien = G.tablero_("prueba-banco", true).reclutas.filter(x => x.alias === "NoCoincide")[0];
igual(quien.email, "cuenta@alumno.es", "🔴 el sistema sigue usando el correo de Google: ese no se falsea");



// ---------------------------------------------------------------- f) el desplegable, sin «(evoluciona)»
// Sobra en la opción (lo explica el texto de ayuda) y alarga cada línea. Lo que NO puede pasar es
// que deje de reconocerse el avatar de quien se alistó antes del cambio.
G = E.nuevoMundo();
const opc = G.opcIniciales_();
igual(opc.length, 14, "siguen siendo los 7 personajes en dos versiones");
igual(opc[0], "Personaje 1 · ella", "la opción ya no arrastra el «(evoluciona)»");
c(opc.every(x => x.indexOf("(evoluciona)") < 0), "ninguna lo lleva");

const nuevoAv = G.parseAvatar_("Personaje 3 · ella");
const viejoAv = G.parseAvatar_("Personaje 3 · ella (evoluciona)");
igual([nuevoAv.tipo, nuevoAv.n, nuevoAv.v], ["evo", 3, "f"], "el formato nuevo se lee bien");
igual([viejoAv.tipo, viejoAv.n, viejoAv.v], ["evo", 3, "f"],
  "🔴 y el VIEJO también: quien se alistó antes del cambio no pierde su personaje");
igual(G.parseAvatar_("Personaje 5 · modelo B").v, "m", "y el modelo B del personaje 5 sigue siendo el masculino");

E.resumen("La Bitácora: una respuesta, editable");
