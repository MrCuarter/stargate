'use strict';
// 10 · ENCARGO PENDIENTE · Dossier del profesorado: UN documento con TODOS los grupos, sus equipos
//      docentes y todos los enlaces, listo para mandar por correo y guardar.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 10 · Dossier del profesorado");

const G = E.nuevoMundo();
c(typeof G.crearDossierProfesorado === "function", "existe crearDossierProfesorado()");
c(typeof G.dossier_ === "function", "y su núcleo sin interfaz dossier_()");

E.crearPERDemo(G, { nombre: "GRUPO A", inicio: E.iso(E.haceSemanas(3)) });
E.crearPERDemo(G, { nombre: "GRUPO B", tipo: "PUA", inicio: E.iso(E.haceSemanas(1)), docentes: [
  { nombre: "Jefa Ana", correo: "jefa@x.es", rol: "referente" },
  { nombre: "Luis", correo: "", rol: "imparte" }] });
E.enviarBitacora(G, "grupo-a", { email: "u1@alumno.es", alias: "U1", nombre: "U U", profe: "Mr Cuarter" });
E.enviarBitacora(G, "grupo-a", { email: "u2@alumno.es", alias: "U2", nombre: "V V", profe: "" });

const url = G.dossier_();
c(/document/.test(url), "devuelve la URL de un Google Doc");
const id = M.Props.getScriptProperties().getProperty("DOSSIER_ID");
c(!!id, "y guarda su id en las propiedades: el enlace no cambia nunca");
const doc = M.Documento.registro[id];
c(!!doc, "el documento existe");
const txt = doc.getBody().getText();

contiene(txt, "Dossier del profesorado", "lleva su título");
contiene(txt, "GRUPO A", "una sección para el GRUPO A");
contiene(txt, "GRUPO B", "y otra para el GRUPO B");
contiene(txt, "REGULAR", "dice el tipo de cada grupo");
contiene(txt, "PUA", "también el PUA");
contiene(txt, "semana", "y por qué semana van");

// equipo docente con correos y roles
contiene(txt, "Norberto Cuartero", "lista al referente del grupo A");
contiene(txt, "n.cuartero.10@gmail.com", "con su correo");
contiene(txt, "mrcuarter@gmail.com", "y a los que imparten");
contiene(txt, "Jefa Ana", "y el equipo del grupo B");
contiene(txt, "SIN CORREO", "🔴 marca a quien no tiene correo (sin él no hay avisos)");

// todos los enlaces que necesita un profe
["registro.html?per=grupo-a", "recluta.html?per=grupo-a", "clase.html?per=grupo-a",
 "profes.html?per=grupo-a", "tickets.html?per=grupo-a", "foro.html?per=grupo-a"]
  .forEach(u => contiene(txt, u, "enlaza " + u.split("?")[0]));
contiene(txt, "forms", "y los formularios del grupo");
contiene(txt, "spreadsheets", "más la hoja maestra / la consola");

// alertas útiles para el referente
contiene(txt, "sin docente", "avisa de los reclutas sin docente asignado");

// se reescribe en el MISMO documento (el enlace que ya tienen los profes no se rompe)
const url2 = G.dossier_();
igual(url2, url, "volver a generarlo devuelve la misma URL");
igual(M.Documento.registro[id].getBody().getText().split("GRUPO A").length - 1,
      txt.split("GRUPO A").length - 1, "y no duplica el contenido");

// al crear un PER nuevo, el dossier se pone al día solo
E.crearPERDemo(G, { nombre: "GRUPO C" });
contiene(M.Documento.registro[id].getBody().getText(), "GRUPO C", "crear un PER refresca el dossier");

// enviarlo por correo al equipo docente
M.Correo.limpiar();
const envio = G.enviarDossier_();
c(envio.enviados.length >= 2, "se manda a todo el profesorado con correo (" + envio.enviados.length + ")");
c(envio.enviados.indexOf("n.cuartero.10@gmail.com") >= 0, "al referente del grupo A");
c(envio.enviados.indexOf("jefa@x.es") >= 0, "y al del grupo B");
igual(M.Correo.enviados.length, 1, "en un solo correo, no uno por PER");
contiene(M.Correo.enviados[0].cuerpo, url, "con el enlace del dossier");
c(envio.sinCorreo.indexOf("Luis") >= 0, "y dice quién se quedó fuera por no tener correo");

E.resumen("Dossier del profesorado");
