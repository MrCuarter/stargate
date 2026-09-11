'use strict';
// 47 · LA COLA DE SOLICITUDES DE NOTA
// Norberto, 11-sep: «el docente no puede subir manualmente la nota a 70 alumnos que quieren
// maquillar, es trabajar el doble y es tiempo no reflejado».
// El problema no era solo CUÁNTAS llegan —eso lo arreglan la semana 15 y los precios nuevos— sino
// CÓMO: concediéndose solas, una a una, con un correo cada vez. Trabajo a goteo y sin decidir nada.
// Ahora se acumulan y se resuelven de una sentada, con derecho a veto.
// 🔴 La regla que lo sostiene todo: LOS CRÉDITOS NO SE MUEVEN HASTA QUE SE APRUEBA. Así rechazar no
// cuesta nada a nadie y nadie pierde dinero por preguntar.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const fs = require("fs"), path = require("path");
console.log("\n▶ 47 · La cola de solicitudes de nota");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco", PIN = "0000";
G.PropertiesService.getScriptProperties().setProperty("PIN_PROFES", PIN);
const api = b => JSON.parse(G.doPost({ postData: { contents: JSON.stringify(b) } }).getContent());
const ficha = () => G.tablero_(PER, true).reclutas.filter(x => x.email === "ana@alumno.es")[0];

E.reclutaRico(G, PER, "ana@alumno.es");
const o = G.perObj_(G.perFila_(PER).v);
const shC = G._maestra.getSheetByName(o.tabC);
const P05 = G.recompensasCat_().filter(x => x.nombre === "Subir 0,5 en un entregable")[0];

// ---------------------------------------------------------------- a) pedirla no cuesta
const antes = ficha().creditos;
const r = E.enviarCanje(G, PER, { email: "ana@alumno.es",
  recompensa: P05.nombre + " — " + P05.coste + " créditos", actividad: "Actividad 1" });
igual(r.estado, "Pendiente de revisión", "🔴 un canje de nota NO se concede solo: queda pendiente");
igual(ficha().creditos, antes, "🔴 y NO se cobra nada al pedirlo");
// el mensaje que recibe el alumno no vuelve por la API del banco, así que se comprueba donde vive
const gs = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Code.gs"), "utf8");
c(/NO se te han cobrado los créditos/.test(gs),
  "y al alumno se le dice con todas las letras que no se le ha cobrado");
c(/avísale para retirarla/.test(gs),
  "🔴 y se le invita a retirarla si ya tiene el máximo: es el aviso que ahorra el trabajo");

// ---------------------------------------------------------------- b) sale en la cola con lo justo para decidir
const cola = api({ accion: "pendientes", per: PER, pin: PIN });
igual(cola.pendientes.length, 1, "aparece en la cola del profesorado");
const p0 = cola.pendientes[0];
igual(p0.coste, P05.coste, "   con lo que va a costar");
igual(p0.actividad, "Actividad 1", "   y a qué actividad se aplica");
igual(p0.puede, true, "   y si le siguen llegando los créditos");
c(p0.alias && p0.email, "   con quién es, para no tener que buscarlo");

// ---------------------------------------------------------------- c) una pendiente OCUPA EL SITIO
// Si no, se mandan cinco solicitudes iguales y la cola se llena de duplicados: justo el goteo que
// esto venía a evitar.
const dup = E.enviarCanje(G, PER, { email: "ana@alumno.es",
  recompensa: P05.nombre + " — " + P05.coste + " créditos", actividad: "Actividad 2" });
contiene(dup.estado, "Denegado", "🔴 pedir la MISMA dos veces se deniega: una pendiente ocupa el sitio");
igual(api({ accion: "pendientes", per: PER, pin: PIN }).pendientes.length, 1,
  "   y la cola sigue con una, no con dos");

// ---------------------------------------------------------------- d) rechazar no cuesta nada
const rech = api({ accion: "pendiente_resolver", per: PER, fila: p0.fila, profe: "Mr Cuarter",
                   aprueba: false, motivo: "ya tenías el máximo", pin: PIN });
igual(rech.ok, true, "el profesorado la rechaza");
igual(ficha().creditos, antes, "🔴 y el alumno se queda con su dinero ENTERO");
igual(api({ accion: "pendientes", per: PER, pin: PIN }).pendientes.length, 0, "   y sale de la cola");
// y como ya no ocupa sitio, puede volver a pedirla
const otra = E.enviarCanje(G, PER, { email: "ana@alumno.es",
  recompensa: P05.nombre + " — " + P05.coste + " créditos", actividad: "Actividad 1" });
igual(otra.estado, "Pendiente de revisión", "🔬 y rechazada deja de ocupar: puede volver a pedirla");

// ---------------------------------------------------------------- e) aprobar cobra, y solo entonces
const fila2 = shC.getLastRow();
const antes2 = ficha().creditos;
const apr = api({ accion: "pendiente_resolver", per: PER, fila: fila2, profe: "Mr Cuarter",
                  aprueba: true, pin: PIN });
igual(apr.ok, true, "el profesorado la aprueba");
igual(ficha().creditos, antes2 - P05.coste, "🔴 AHORA se cobra: al aprobar, no al pedir");
igual(api({ accion: "pendiente_resolver", per: PER, fila: fila2, profe: "Mr Cuarter", aprueba: true, pin: PIN }).yaEstaba,
  true, "🔬 aprobar dos veces no cobra dos veces");

// ---------------------------------------------------------------- f) no se aprueba lo que ya no puede pagar
// Entre pedirlo y aprobarlo puede haberse gastado los créditos en sobres. Aprobar a ciegas lo
// dejaría en negativo, y un saldo negativo no se ve venir.
const pobre = "dani@alumno.es";
E.enviarBitacora(G, PER, { email: pobre, alias: "Dani", nombre: "Dani D", profe: "Mr Cuarter" });
E.enviarBitacora(G, PER, { email: pobre, marcados: E.marcar(G, G.retosDe_("REGULAR")) }, 3);
E.enviarCanje(G, PER, { email: pobre, recompensa: P05.nombre + " — " + P05.coste + " créditos", actividad: "Actividad 1" });
const filaP = shC.getLastRow();
// se gasta el dinero en otra cosa antes de que el docente mire la cola
const sobre = G.recompensasCat_().filter(x => x.tipo === "cromo" && x.coste > 0)[0];
const yo = () => G.tablero_(PER, true).reclutas.filter(x => x.email === pobre)[0];
while (yo().creditos >= P05.coste)
  E.enviarCanje(G, PER, { email: pobre, recompensa: sobre.nombre + " — " + sobre.coste + " créditos" });
const noPuede = api({ accion: "pendiente_resolver", per: PER, fila: filaP, profe: "Mr Cuarter",
                      aprueba: true, pin: PIN });
igual(noPuede.ok, false, "🔴 no se aprueba si ya no le llegan los créditos");
contiene(noPuede.error, "créditos", "   y se dice por qué, con las cifras");
igual(yo().creditos >= 0, true, "🔴 y NUNCA se le deja en negativo");

// ---------------------------------------------------------------- g) es acción de DOCENTE, no de referente
// Quien corrige a ese grupo es quien decide si le sube la nota. El nivel de referente es para lo
// que afecta al grupo entero.
G.PropertiesService.getScriptProperties().setProperty("PIN_REFERENTE", "12345678");
const sinPin = api({ accion: "pendientes", per: PER, pin: "malmal" });
c(!!sinPin.error, "🔴 sin PIN no se ve la cola: lleva nombres y correos");

// ---------------------------------------------------------------- h) y el panel la enseña
const clase = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "clase.js"), "utf8");
c(/function bloqueCola\(\)/.test(clase), "la sala del docente tiene su bloque de cola");
c(/bloqueCola\(\)\+bloquePase/.test(clase), "🔴 y va ARRIBA: es lo único con alguien esperando respuesta");
c(/los créditos se cobran al aprobar/.test(clase), "   diciendo que no se ha cobrado nada todavía");
c(/tú<\/b> aplicarás la nota/i.test(clase) || /aplicarás la nota/.test(clase),
  "🔴 y que aprobar significa que la nota la aplica el docente: el sistema no toca ninguna nota");

E.resumen("La cola de solicitudes de nota");
