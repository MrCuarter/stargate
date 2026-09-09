'use strict';
// 43 · LA PUERTA DEL PROFESORADO Y LO QUE TIENE QUE SEGUIR ABIERTO
// Norberto, 9-sep: «hay info que debería ser accesible SOLO después de poner el pin, como la
// carpeta de Geniallys». Tenía razón: la guía, la cronología, las actividades, los Geniallys del
// equipo y las instrucciones de instalación estaban abiertas de par en par.
// Lo que vigila esta batería son las DOS mitades del cambio, porque cualquiera de ellas se rompe
// sin hacer ruido: que lo del profesorado esté tapado, y —más importante— que lo del ALUMNADO siga
// abierto. Un PIN dentro del Genially de una clase sería un fallo mucho peor que el original.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
console.log("\n▶ 43 · La puerta del profesorado");

// ---------------------------------------------------------------- a) lo que va tapado
["guia.html", "cronologia.html", "actividades.html", "geniallys.html", "registro.html",
 "recursos.html", "grupos.html", "embed.html", "pasos.html"].forEach(function(f){
  const h = leer(f);
  c(h.indexOf("assets/js/puerta.js") >= 0, "🔒 " + f + " pide el PIN");
  c(h.indexOf('classList.add("cerrado")') >= 0,
    "   y nace tapada, sin enseñar el contenido un instante antes");
});

// ---------------------------------------------------------------- b) lo que NO puede pedirlo
// La Nave y el foro los abre el alumnado, que no tiene PIN. La portada es la cara del proyecto.
["index.html", "recluta.html", "foro.html", "panel.html"].forEach(function(f){
  c(leer(f).indexOf("assets/js/puerta.js") < 0,
    "🔴 " + f + " sigue ABIERTA: la usa el alumnado (o es la puerta principal)");
});

// ---------------------------------------------------------------- c) la excepción que salva el Genially
// registro.html es DOS cosas: la página del método (tapada) y el ranking público (&solo=1 / &embed=1),
// que se proyecta en clase y se incrusta en el Genially del alumnado.
const P = leer("assets/js/puerta.js");
c(/q\.get\('embed'\)\s*===\s*'1'/.test(P) && /q\.get\('solo'\)\s*===\s*'1'/.test(P),
  "🔴 la puerta se aparta con &embed=1 y &solo=1: si no, el alumnado vería un PIN dentro de su Genially");
c(/q\.get\('panorama'\)\s*===\s*'1'/.test(P), "y con el panorama de tickets, que se proyecta");
c(P.indexOf("sessionStorage.getItem('sgPin')") >= 0,
  "🔴 usa el MISMO PIN que «Mi clase» y los tickets: una sola vez por navegador, no una por página");

// ---------------------------------------------------------------- d) la portada bifurca
const I = leer("index.html");
c(/Soy estudiante/.test(I) && /Soy docente/.test(I), "la portada ofrece los dos caminos");
c(I.indexOf("recluta.html") >= 0, "y el del alumnado lleva a la Nave");
c(!/Puesto de mando del profesorado<\/title>/.test(I),
  "🔴 y ya no se presenta como «puesto de mando del profesorado»: es la entrada al proyecto");

// ---------------------------------------------------------------- e) los documentos reservados
// 🔴 Esto NO es cifrado y no debe venderse como tal: la URL deja de ser adivinable, nada más.
// Lo unico que reserva un documento de verdad es no tenerlo en el servidor publico.
const A = leer("actividades.html");
["Ejemplo_examen.pdf", "Rubrica_Actividad_1.xlsx", "Rubrica_Actividad_2_ePortfolio.xlsx"].forEach(function(f){
  c(A.indexOf('assets/docs/' + f) < 0, "🔴 " + f + " ya no cuelga de la ruta pública de siempre");
  c(!fs.existsSync(path.join(RAIZ, "assets", "docs", f)), "   y no está en assets/docs/ a pelo");
  const sub = fs.readFileSync(path.join(RAIZ, "_docs_reservados.txt"), "utf8").trim();
  c(fs.existsSync(path.join(RAIZ, "assets", "docs", sub, f)), "   sino en la carpeta reservada");
});
// y los del alumnado siguen donde estaban: son suyos
["Actividad_1_imagen_IA.docx", "Pautas_ePortfolio.docx", "Ejemplo_ePortfolio_alumnado.pdf"].forEach(function(f){
  c(fs.existsSync(path.join(RAIZ, "assets", "docs", f)),
    f + " sigue accesible: es material del alumnado, no del profesorado");
});

E.resumen("La puerta del profesorado");
