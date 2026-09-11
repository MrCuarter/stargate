'use strict';
// 46 · NOMBRE Y APELLIDOS, SEPARADOS
// Norberto, 11-sep, revisando el formulario de alistarse: «creo que debemos separar Nombre y
// Apellidos, así será más fácil filtrar después». Tenía razón, y por una razón que no tiene vuelta:
// en español NO se puede partir a máquina. «José Luis García de la Torre» — ¿dónde acaba el nombre?
// Cualquier automatismo falla con nombres compuestos y dos apellidos. Si quieres dos campos
// limpios, hay que preguntar dos veces.
// Se hizo el 11-sep porque era el ÚNICO momento barato: los cinco grupos eran de prueba y no había
// ni un estudiante real. Con gente dentro, el mismo cambio significa perder datos o arrastrar dos
// formatos para siempre.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
console.log("\n▶ 46 · Nombre y apellidos, separados");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco";
const o = G.perObj_(G.perFila_(PER).v);

// ---------------------------------------------------------------- a) el formulario pregunta dos veces
const sh = G._maestra.getSheetByName(o.tabB);
const cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
c(cab.indexOf("Nombre") >= 0, "🔴 el formulario tiene un campo «Nombre»");
c(cab.indexOf("Apellidos") >= 0, "🔴 y otro «Apellidos»");
c(cab.indexOf("Nombre y apellidos") < 0, "   y ya no el campo único de antes");
c(cab.indexOf("Nombre") < cab.indexOf("Apellidos"), "   en ese orden: primero el nombre");

// ---------------------------------------------------------------- b) se leen los dos y se junta bien
E.enviarBitacora(G, PER, { email: "ana@alumno.es", alias: "Ana", nombre: "Ana Ruiz Pérez", profe: "Mr Cuarter" });
const ficha = () => G.tablero_(PER, true).reclutas.filter(x => x.email === "ana@alumno.es")[0];
igual(ficha().nombre, "Ana Ruiz Pérez", "🔴 el nombre ENTERO se sigue leyendo igual que siempre");
igual(ficha().nombre_pila, "Ana", "   y además el nombre de pila por separado");
igual(ficha().apellidos, "Ruiz Pérez", "   y los apellidos por separado");

// ---------------------------------------------------------------- c) son dato personal
// El endpoint público no manda el nombre; las dos mitades tampoco pueden colarse por ahí.
const pub = G.tablero_(PER, false).reclutas[0];
igual(pub.nombre, undefined, "🔴 el tablero público no manda el nombre…");
igual(pub.nombre_pila, undefined, "   …ni el nombre de pila…");
igual(pub.apellidos, undefined, "   …ni los apellidos");

// ---------------------------------------------------------------- d) ALUMNADO ordena por apellido
G.alumnado_();
const alu = G._maestra.getSheetByName("ALUMNADO").getDataRange().getValues();
const cA = alu[0].indexOf("Apellidos"), cN = alu[0].indexOf("Nombre");
c(cA >= 0 && cN >= 0, "ALUMNADO tiene las dos columnas");
c(cA < cN, "🔴 con el APELLIDO delante: es por lo que se ordena una lista de clase");
const fila = alu.slice(1).filter(v => String(v[alu[0].indexOf("Correo")]) === "ana@alumno.es")[0];
igual(fila[cA], "Ruiz Pérez", "   y cada mitad en su sitio");
igual(fila[cN], "Ana", "   ");

// ---------------------------------------------------------------- e) los grupos VIEJOS siguen leyéndose
// 🔴 Esto es lo que evita perder datos: una hoja creada antes del cambio tiene UNA columna. Si el
// sistema solo supiera leer el formato nuevo, esa gente se quedaría sin nombre de un día para otro.
const viejo = ["Marca temporal", "Dirección de correo electrónico", "Nombre y apellidos", "Alias de recluta (público)"];
igual(G.nombreCompleto_(viejo, ["", "x@y.es", "Luis Soto Vega", "Lu"]), "Luis Soto Vega",
  "🔴 una hoja del formato VIEJO se sigue leyendo entera");
const partidoViejo = G.nombrePartido_(viejo, ["", "x@y.es", "Luis Soto Vega", "Lu"]);
igual(partidoViejo.apellidos, "Luis Soto Vega",
  "   y como no se puede partir con garantías, va entero a la columna por la que se ordena");
igual(partidoViejo.nombre, "", "   sin inventarse dónde acababa el nombre");

// ---------------------------------------------------------------- f) la trampa de buscar por subcadena
// idx_ busca SUBCADENA: «nombre» casa con «Nombre y apellidos». Si los campos nuevos se buscaran
// así, en una hoja vieja se leería la columna equivocada sin avisar.
igual(G.idxExacto_(viejo, "Nombre"), -1,
  "🔴 la búsqueda EXACTA no confunde «Nombre» con «Nombre y apellidos»");
c(G.idx_(viejo, "nombre") >= 0, "   (la de subcadena sí lo haría: por eso no se usa aquí)");

// ---------------------------------------------------------------- g) y la ficha del docente, igual
const clase = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "clase.js"), "utf8");
c(/id="fNombre"/.test(clase) && /id="fApellidos"/.test(clase),
  "la ficha del docente también corrige los dos campos por separado");
c(/apellidos:\(document\.getElementById\('fApellidos'\)/.test(clase),
  "   y los manda los dos al guardar");

E.resumen("Nombre y apellidos, separados");
