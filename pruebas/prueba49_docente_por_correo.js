'use strict';
// 49 · EL DOCENTE ENTRA POR SU CORREO
// Norberto, 11-sep: «además del pin, el docente debe escribir su mail. De esta forma solo verá los
// grupos en los que está listado + el grupo demo. Si entra un docente sin grupo asignado aún, verá
// la clase demo para que pueda practicar y explorar».
//
// Lo que había antes y por qué era un problema: la sala pintaba un DESPLEGABLE con los nombres de
// todo el profesorado y cada uno elegía el suyo. Con el PIN en la mano, cualquiera veía la plantilla
// entera del máster y entraba como un compañero en dos clics. No por maldad: por curiosidad, o por
// elegir mal en un desplegable de veinte nombres.
//
// 🔴 Lo que esto NO es: seguridad. Quien tenga el PIN y sepa el correo de otro puede escribirlo.
// La puerta sigue siendo el PIN. Lo que se gana es que nadie entre por error en la clase de otro y
// que la lista de correos del equipo no salga nunca del servidor.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
console.log("\n▶ 49 · El docente entra por su correo");

const G = E.nuevoMundo();
E.crearPERDemo(G);                                        // «PRUEBA BANCO» → id prueba-banco
E.crearPERDemo(G, { nombre: "CLASE DEMO",                 // el grupo de prácticas
  docentes: [{ nombre: "Norberto Cuartero", correo: "n.cuartero.10@gmail.com", rol: "referente" }] });
E.crearPERDemo(G, { nombre: "GRUPO AJENO",                // uno donde NO está Mr Cuarter
  docentes: [{ nombre: "Otra Persona", correo: "otra@unir.net", rol: "imparte" }] });

const PIN = "0000";
G.PropertiesService.getScriptProperties().setProperty("PIN_PROFES", PIN);
const api = b => JSON.parse(G.doPost({ postData: { contents: JSON.stringify(b) } }).getContent());
const ids = r => (r.pers || []).map(p => p.id);

// ---------------------------------------------------------------- a) sin correo, todo igual que antes
// La demo sin PIN (clase.html?demo=1) entra así, y no se puede romper por el camino.
const todo = api({ accion: "pers", pin: PIN });
c(ids(todo).length >= 3, "sin correo siguen llegando todos los grupos (la demo sin PIN los necesita)");
c(todo.yo === undefined, "   y no se inventa un «yo» que nadie ha pedido");

// ---------------------------------------------------------------- b) con correo, solo lo suyo
const mio = api({ accion: "pers", pin: PIN, correo: "mrcuarter@gmail.com" });
c(ids(mio).indexOf("prueba-banco") >= 0, "🔴 con correo llega el grupo en el que SÍ está");
c(ids(mio).indexOf("grupo-ajeno") < 0, "🔴 y NO llega el grupo en el que no está");
igual(mio.yo.encontrado, true, "el servidor confirma que lo ha encontrado");
igual(mio.yo.nombre, "Mr Cuarter", "🔴 y devuelve su NOMBRE: ya no se teclea ni se elige de una lista");

// la clase de prácticas viaja siempre, también para quien sí tiene grupos
c(ids(mio).indexOf("clase-demo") >= 0, "🔴 la clase de prácticas se ve aunque ya tengas grupos");
c((mio.demo || []).indexOf("clase-demo") >= 0, "   y viene marcada como tal, para que la sala lo sepa");
// pero la suya va primero: al abrir la sala no puede caer en la demo teniendo clase de verdad
igual(ids(mio)[0], "prueba-banco", "🔴 los grupos propios van DELANTE de la demo");

// ---------------------------------------------------------------- c) sin grupo asignado → la demo
const nadie = api({ accion: "pers", pin: PIN, correo: "recien.llegada@unir.net" });
igual(nadie.yo.encontrado, false, "a quien no figura en ningún equipo se le dice que no se le encuentra");
igual(ids(nadie).join(","), "clase-demo", "🔴 y se le deja SOLO la clase de prácticas, no una sala vacía");

// ---------------------------------------------------------------- d) ni un correo ajeno sale del servidor
// Este es el motivo por el que el filtro vive en el servidor y no en el navegador.
const crudo = JSON.stringify(mio);
["otra@unir.net", "norberto@genially.com", "n.cuartero.10@gmail.com"].forEach(function (m) {
  c(crudo.indexOf(m) < 0, "🔴 el correo de «" + m + "» NO viaja al navegador");
});
c(crudo.indexOf("mrcuarter@gmail.com") >= 0, "   el suyo sí, que es el que ha escrito él");
// y en la respuesta sin correo tampoco puede colarse ninguno
const crudoTodo = JSON.stringify(todo);
["otra@unir.net", "mrcuarter@gmail.com"].forEach(function (m) {
  c(crudoTodo.indexOf(m) < 0, "🔴 tampoco en la respuesta sin correo se cuela «" + m + "»");
});

// ---------------------------------------------------------------- e) el correo se compara con cabeza
// Un docente que teclea su correo con mayúsculas o un espacio detrás no puede quedarse fuera.
igual(api({ accion: "pers", pin: PIN, correo: "  MrCuarter@Gmail.com  " }).yo.encontrado, true,
  "🔴 mayúsculas y espacios no dejan a nadie fuera");

// ---------------------------------------------------------------- f) sigue haciendo falta el PIN
c(!!api({ accion: "pers", correo: "mrcuarter@gmail.com", pin: "malmal" }).error,
  "🔴 el correo NO sustituye al PIN: sin PIN no se entra");

// ---------------------------------------------------------------- g) qué es «de prácticas»
const gs = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Code.gs"), "utf8");
c(/function esDemo_/.test(gs), "hay UNA regla que decide qué grupo es de prácticas");
c(/\\bDEMO\\b/.test(gs.slice(gs.indexOf("function esDemo_"), gs.indexOf("function esDemo_") + 120)),
  "   y solo cuenta DEMO: los grupos «PRUEBA …» del referente no son para todo el profesorado");
// PRUEBA BANCO lleva «PRUEBA» en el nombre: si la regla lo aceptara, este grupo se le ofreceria a
// todos los docentes del master. Que salte aqui.
c(!api({ accion: "pers", pin: PIN, correo: "nadie@unir.net" }).pers.some(p => p.id === "prueba-banco"),
  "🔴 un grupo llamado «PRUEBA …» NO se ofrece como clase de prácticas");

// ---------------------------------------------------------------- h) y la sala lo usa
const clase = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "clase.js"), "utf8");
const CODIGO = clase.replace(/^\s*\/\/.*$/gm, "");
c(/function pedirCorreo/.test(clase), "la sala pide el correo");
c(/preferiblemente el de UNIR/.test(clase),
  "🔴 y lo pide como «preferiblemente el de UNIR», no como obligatorio: si no, quien figure con otro correo se queda fuera");
c(!/function elegirDocente/.test(CODIGO), "🔴 el desplegable con los nombres de todo el equipo ha desaparecido");
c(/accion:'pers', correo:st\.correo/.test(CODIGO), "y manda el correo al servidor, que es quien decide");
c(/st\.profe=st\.yo\.nombre/.test(CODIGO), "el nombre lo pone el servidor, no el navegador");
c(/clase de prácticas/.test(clase), "a quien no tiene grupo se le explica que le queda la clase de prácticas");
c(/function soloMiosReal/.test(clase),
  "🔴 en la clase de prácticas no se filtra por «solo mis alumnos»: el docente no figura en su equipo y la vería vacía");
c(/localStorage\.removeItem\('sgClaseCorreo'\)/.test(CODIGO), "y se puede cambiar de correo sin cerrar el navegador");
// el grupo que quedó guardado de antes puede no ser suyo: al cambiar de correo hay que soltarlo
c(/localStorage\.removeItem\('sgClasePer'\)/.test(CODIGO),
  "🔴 al cambiar de correo se suelta el grupo guardado: podría no ser de quien entra ahora");

E.resumen("El docente entra por su correo");
