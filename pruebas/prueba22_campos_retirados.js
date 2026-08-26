'use strict';
// 22 · El formulario de canje no puede ofrecer lo que ya no existe
// Con el vestuario se retiraron tres recompensas: «Cambio de avatar», «Personaje exclusivo» y
// «Avatar personal». El personaje ya no se compra: se desbloquea por nivel y se elige en la Nave.
// Al retirarlas, la lista de personajes exclusivos se quedó VACÍA y crearPER se cayó en producción
// con «La matriz está vacía: values» — un mensaje que no dice dónde está el problema. Esta batería
// vigila las dos cosas: que las preguntas retiradas no vuelvan, y que si alguna lista se queda sin
// opciones el error diga QUÉ pregunta y por qué.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 22 · Preguntas retiradas del canje y listas sin opciones");

const G = E.nuevoMundo();
const per = E.crearPERDemo(G);
const canje = G.FormApp.openByUrl(G.perObj_(G.perFila_(per.id).v).formCanjeEdit);
const titulos = () => canje.getItems().map(i => i.getTitle());

// ---------------------------------------------------------------- a) recién creado
c(titulos().indexOf("Recompensa") >= 0, "el canje pregunta qué recompensa quieres");
igual(titulos().indexOf(G.TIT_NUEVO_AVATAR), -1, "🔴 no pregunta por «Cambio de avatar»: está retirada");
igual(titulos().indexOf(G.TIT_EXCLUSIVO), -1, "🔴 ni por el personaje exclusivo");
igual(titulos().indexOf(G.TIT_URL_AVATAR), -1, "🔴 ni pide una URL de avatar propia");
c(titulos().indexOf(G.TIT_TITULO) >= 0, "pero sí por el título de recluta, que sigue viva");
c(titulos().indexOf(G.TIT_FONDO) >= 0, "y por el planeta de fondo");

// las recompensas ofrecidas son las del catálogo, con el héroe dentro
const opc = canje.getItems().filter(i => i.getTitle() === "Recompensa")[0].getChoices().map(o => o.getValue());
c(opc.some(x => x.indexOf("Héroe de la Rebelión") === 0), "«Héroe de la Rebelión» se puede pedir");
c(!opc.some(x => x.indexOf("Cambio de avatar") === 0), "🔴 y «Cambio de avatar» ya no aparece en la lista");

// ---------------------------------------------------------------- b) idempotente
const antes = titulos().length;
G.anadirCamposAvatar_(canje);
G.anadirCamposAvatar_(canje);
igual(titulos().length, antes, "🔴 pasarla dos veces no duplica preguntas (la ejecuta crearPER y también Mantenimiento)");

// ---------------------------------------------------------------- c) limpia formularios viejos
const viejo = G.FormApp.create("canje antiguo");
viejo.addListItem().setTitle(G.TIT_NUEVO_AVATAR).setChoiceValues(["Personaje 1"]);
viejo.addTextItem().setTitle(G.TIT_URL_AVATAR);
viejo.addListItem().setTitle(G.TIT_EXCLUSIVO).setChoiceValues(["Personaje 8"]);
c(viejo.getItems().length === 3, "un formulario de antes tiene las tres preguntas retiradas");
G.anadirCamposAvatar_(viejo);
const t2 = viejo.getItems().map(i => i.getTitle());
igual(t2.filter(x => G.CAMPOS_AVATAR_RETIRADOS.indexOf(x) >= 0).length, 0,
  "🔴 al actualizarlo se le QUITAN: nadie puede canjear algo que ya no existe");
c(t2.indexOf(G.TIT_TITULO) >= 0 && t2.indexOf(G.TIT_FONDO) >= 0, "y se le ponen las dos que sí siguen");

// ---------------------------------------------------------------- d) el error, cuando toca, se entiende
let msg = "";
try { G.ponerOpciones_(G.FormApp.create("x").addListItem().setTitle("Prueba"), [], "Personaje exclusivo"); }
catch (e) { msg = e.message; }
contiene(msg, "Personaje exclusivo", "🔴 si una lista se queda sin opciones, el error DICE cuál");
contiene(msg, "catalogo", "y adónde mirar");
c(msg.indexOf("matriz") < 0, "en vez del «La matriz está vacía: values» de Google, que no dice nada");

// y las listas vacías siguen siendo un error de verdad, no algo que se traga
let reventado = false;
try { G.FormApp.create("y").addListItem().setChoiceValues([]); } catch (e) { reventado = true; }
c(reventado, "🔴 el simulador reproduce el fallo de Google: sin esto el banco no lo habría visto");

// ---------------------------------------------------------------- e) los textos del mundo viejo
// El canje se paga en CREDITOS. Los xp miden el viaje y NUNCA bajan: si el formulario dice «cambia
// tus xp», el alumnado cree que comprar le baja de nivel, que es justo lo contrario de lo que pasa.
const desc = canje.descripcion || "";
contiene(desc, "CRÉDITOS", "el canje dice que se paga en CRÉDITOS");
c(desc.indexOf("Cambia tus xp") < 0, "🔴 y ya no dice «cambia tus xp por ventajas»: son dos monedas distintas");
const act = canje.getItems().filter(i => i.getTitle() === G.TIT_ACTIVIDAD)[0].getChoices().map(o => o.getValue());
c(!act.some(x => x.indexOf("canje de avatar") >= 0), "🔴 ni ofrece «no aplica (canje de avatar)»: el avatar ya no se canjea");

// el texto del avatar en la Bitácora tampoco puede prometer lo retirado
c(G.AYUDA_AVATAR.indexOf("EXCLUSIVOS") < 0, "🔴 la ayuda del avatar no dice que haya personajes exclusivos");
c(G.AYUDA_AVATAR.indexOf("tu propia") < 0, "ni que puedas poner tu propia imagen");
c(G.AYUDA_AVATAR.indexOf("cambiar de avatar cuesta") < 0, "ni que cambiar de avatar cueste créditos");
contiene(G.AYUDA_AVATAR, "no se cambia", "dice la verdad: el personaje te acompaña todo el viaje");

// ---------------------------------------------------------------- f) y un PER ya creado los recibe
canje.setDescription("Cambia tus xp por ventajas.");            // como lo dejó una version vieja
canje.getItems().filter(i => i.getTitle() === G.TIT_ACTIVIDAD)[0].setChoiceValues(["No aplica (canje de avatar)"]);
let v = 0; let rr = G.actualizarFormularios_();
while (!rr.terminado && v < 20) { rr = G.actualizarFormularios_(); v++; }
contiene(canje.descripcion, "CRÉDITOS", "🔴 «Actualizar formularios» arregla la descripción de un PER ya creado");
const act2 = canje.getItems().filter(i => i.getTitle() === G.TIT_ACTIVIDAD)[0].getChoices().map(o => o.getValue());
c(!act2.some(x => x.indexOf("canje de avatar") >= 0), "🔴 y tambien sus opciones: no hace falta rehacer el PER");

E.resumen("Preguntas retiradas del canje");
