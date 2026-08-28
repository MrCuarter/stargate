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

// ---------------------------------------------------------------- el enlace tiene que ser PULSABLE
// 28-ago. «Documento de enlaces del PER» acababa en un `ui.alert("Documento creado:\n" + url)`, que
// en Apps Script sale como TEXTO PELADO: no se puede pulsar y hay que seleccionarlo a mano. El
// dossier y la consola ya abrían un diálogo con enlace; este se había quedado atrás. Ahora los tres
// pasan por `dialogoEnlace_`, y esto vigila que no vuelva a desviarse ninguno.
const G2 = E.nuevoMundo();
E.crearPERDemo(G2, { nombre: "GRUPO C" });
c(typeof G2.dialogoEnlace_ === "function", "existe el diálogo común de enlaces, dialogoEnlace_()");

[["documento del PER", function(){ const sh = G2.hoja_(G2.H.PERS);
                                   G2._maestra.setActiveSheet(sh);
                                   G2._maestra._rango = sh.getRange(2, 1);   // la fila del PER, como si la hubieras pulsado
                                   G2.documentoPERSeleccionado(); }],
 ["dossier",           function(){ G2.crearDossierProfesorado(); }],
 ["consola",           function(){ G2.abrirConsola(); }]
].forEach(function(par){
  M.UI.limpiar();
  try { par[1](); } catch (e) { c(false, par[0] + ": revienta — " + e.message); return; }
  const html = (M.UI.htmls || []).join("");
  c((M.UI.htmls || []).length > 0, par[0] + ": abre un diálogo, no un alert de texto");
  c(/<a [^>]*href="https?:\/\/[^"]+"/.test(html), "   " + par[0] + ": con un enlace de verdad, pulsable");
  c(/target="_blank"/.test(html), "   " + par[0] + ": que abre en otra pestaña");
  igual((M.UI.avisos || []).filter(x => /https?:\/\//.test(x)).length, 0,
    "🔴 " + par[0] + ": y NINGÚN ui.alert con la URL dentro (eso sale como texto pelado)");
});

// y en el fichero, que no se cuele otro alert con una URL
const fuente = require("fs").readFileSync(
  process.env.STARGATE_GS || require("path").join(__dirname, "..", "apps-script", "Code.gs"), "utf8");
igual((fuente.match(/alert\([^)]*"[^"]*\/\/" *\+|alert\([^)]*\burl\b/g) || []).length, 0,
  "🔴 no queda ningún ui.alert() que enseñe una URL");

E.resumen("Dossier del profesorado");
