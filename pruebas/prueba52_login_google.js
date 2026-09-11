'use strict';
// 52 · ENTRAR CON GOOGLE: EL CORREO LO DICE GOOGLE, NO EL NAVEGADOR
//
// El agujero que cierra, y que llevaba abierto desde el principio: para ver la ficha de alguien en
// la Nave bastaba con TECLEAR SU CORREO. Nombre real, correo, progreso, insignias. El servidor se
// creía lo que le mandaran, y el correo de un compañero de máster no es ningún secreto.
//
// 🔴 Y la razón de que la comprobación viva en el SERVIDOR y no en la página: si el navegador
// verificara el token y luego pidiera la ficha «por correo», el troll se saltaría el primer paso y
// pediría la ficha directamente. La verificación solo vale donde no se puede esquivar.
//
// Probado de verdad, no leyendo el código: se simula la respuesta de Google (`Fetch.responde`) y se
// comprueba qué hace el servidor con un token bueno, con uno de otra aplicación y con uno cuyo
// correo Google no da por verificado.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const fs = require("fs"), path = require("path");
console.log("\n▶ 52 · Entrar con Google");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco";
const CID = "631545413622-ejemplo.apps.googleusercontent.com";
G.PropertiesService.getScriptProperties().setProperty("GOOGLE_CLIENT_ID", CID);
const api = b => JSON.parse(G.doPost({ postData: { contents: JSON.stringify(b) } }).getContent());

E.enviarBitacora(G, PER, { email: "ana@alumno.es", alias: "Ana", profe: "Mr Cuarter" });
E.enviarBitacora(G, PER, { email: "luis@alumno.es", alias: "Luis", profe: "Mr Cuarter" });

const googleDice = o => E.M.Fetch.responde("tokeninfo", JSON.stringify(o));
const bueno = correo => ({ aud: CID, email: correo, email_verified: "true" });

// ---------------------------------------------------------------- a) el camino bueno
googleDice(bueno("ana@alumno.es"));
const r = api({ accion: "quien", per: PER, token: "tok-de-ana" });
igual(r.yo && r.yo.alias, "Ana", "🔴 con un token bueno se devuelve la ficha de ESE correo");
igual(r.correo, "ana@alumno.es", "y se dice con qué identidad se ha entrado");

// ---------------------------------------------------------------- b) el token manda sobre el correo
// Aquí está el ataque real: mandar el token propio y el correo del vecino, a ver si cuela.
googleDice(bueno("luis@alumno.es"));
const suplanta = api({ accion: "quien", per: PER, token: "tok-de-luis", email: "ana@alumno.es" });
igual(suplanta.yo && suplanta.yo.alias, "Luis",
  "🔴 con token, el correo del navegador se IGNORA: vuelve la ficha de quien dice Google");
igual(suplanta.correo, "luis@alumno.es", "   y el correo devuelto es el verificado, no el pedido");

// ---------------------------------------------------------------- c) las tres comprobaciones
// Cada una tapa un ataque distinto. Sin la de `aud`, el token de cualquier otra web valdría aquí.
googleDice({ aud: "otra-app.apps.googleusercontent.com", email: "ana@alumno.es", email_verified: "true" });
const ajeno = api({ accion: "quien", per: PER, token: "tok-de-otra-web" });
c(!!ajeno.error, "🔴 un token emitido para OTRA aplicación se rechaza");
contiene(ajeno.error, "aplicacion", "   diciendo por qué");

googleDice({ aud: CID, email: "ana@alumno.es", email_verified: "false" });
const sinVerificar = api({ accion: "quien", per: PER, token: "tok-sin-verificar" });
c(!!sinVerificar.error, "🔴 un correo que Google no da por verificado se rechaza");

googleDice({ aud: CID, email_verified: "true" });
c(!!api({ accion: "quien", per: PER, token: "tok-sin-correo" }).error, "y un token sin correo, también");

// sin ID de cliente configurado no se verifica nada: mejor error claro que dar por buena una cuenta
G.PropertiesService.getScriptProperties().deleteProperty("GOOGLE_CLIENT_ID");
googleDice(bueno("ana@alumno.es"));
const sinCid = api({ accion: "quien", per: PER, token: "tok-de-ana" });
c(!!sinCid.error, "🔴 sin GOOGLE_CLIENT_ID no se valida nada: error, no pase libre");
G.PropertiesService.getScriptProperties().setProperty("GOOGLE_CLIENT_ID", CID);

// ---------------------------------------------------------------- d) el interruptor, y apagado
// Mientras el login sea una prueba, escribir el correo tiene que seguir funcionando: si el botón de
// Google fallara, nadie puede quedarse sin ver su propia Nave.
E.M.Fetch.olvida();
igual(api({ accion: "quien", per: PER, email: "ana@alumno.es" }).yo.alias, "Ana",
  "con el interruptor apagado, escribir el correo sigue entrando (nadie se queda fuera)");
G.PropertiesService.getScriptProperties().setProperty("EXIGE_LOGIN", "si");
const exigido = api({ accion: "quien", per: PER, email: "ana@alumno.es" });
c(!!exigido.error, "🔴 con el interruptor encendido, el correo tecleado ya NO entra");
contiene(exigido.error, "Google", "   y se dice qué hacer en vez de eso");
googleDice(bueno("ana@alumno.es"));
igual(api({ accion: "quien", per: PER, token: "tok-de-ana" }).yo.alias, "Ana",
  "   pero el token sigue entrando, claro");
G.PropertiesService.getScriptProperties().deleteProperty("EXIGE_LOGIN");

// ---------------------------------------------------------------- e) lo que NO se le pide al alumnado
const gs = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Code.gs"), "utf8");
c(/oauth2\.googleapis\.com\/tokeninfo/.test(gs), "se le pregunta a Google, no se decodifica el token a mano");
c(!/jwt|atob\(|base64/i.test(gs.slice(gs.indexOf("function correoDeToken_"), gs.indexOf("function correoDeToken_") + 900)),
  "🔴 el servidor NO lee el token por su cuenta: leerlo sin comprobar la firma es fiarse del atacante");

// ---------------------------------------------------------------- f) la Nave
const R = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "recluta.js"), "utf8");
const CODIGO = R.replace(/^\s*\/\/.*$/gm, "");
// 🔴 12-sep · Esta comprobación se mudó de sitio, no desapareció. La Nave ya no habla con el Apps
// Script directamente: pide sus datos a `assets/js/fuente.js`, que decide si contesta el motor viejo
// o Firestore. El camino del token sigue existiendo igual —y sigue siendo el que manda— pero vive
// en la capa de transporte. Si algún día alguien lo quita de ahí, esta línea salta.
const F = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "fuente.js"), "utf8");
c(/accion: "quien", per: per, token: quien_\.token/.test(F),
  "🔴 con el motor viejo se manda el TOKEN, no el correo, cuando se entra con Google");
c(/SG\.FUENTE\.quien\(per,quien_\)/.test(CODIGO),
  "   y la Nave pide su ficha a la fuente, sin saber qué motor hay detrás");
// Y con Firestore el token deja de hacer falta: quien pide los datos ES quien inició sesión, y eso
// lo sabe el servidor sin que nadie se lo cuente. El correo tecleado desaparece del problema.
c(/M\.sesion\(\)/.test(F) && /No se puede|Entra con tu cuenta/.test(F),
  "🔴 y con el motor nuevo, sin sesión no hay ficha: no hay correo que verificar porque no se teclea");
c(/function identificarConGoogle/.test(R), "y tiene su camino propio de identificación");
c(/st\.verificado=true/.test(CODIGO), "que deja marcado que esa identidad está verificada");
c(/id="in-mail"/.test(R), "🔴 el campo de escribir el correo SIGUE estando: nadie se queda fuera si el botón falla");
c(/o escríbelo a mano/.test(R), "   y se ofrece como alternativa, no escondido");
c(/if\(!hueco\|\|!CID\) return/.test(CODIGO),
  "🔴 sin ID de cliente la Nave no habla con Google en absoluto: ni carga su librería");
c(/accounts\.google\.com\/gsi\/client/.test(R), "la librería de Google se carga desde Google");
c(/sc\.onerror/.test(CODIGO), "y si no carga, se dice y se ofrece el correo a mano");

// el ID de cliente tiene que llegar a la página, o el botón no existe
const html = fs.readFileSync(path.join(__dirname, "..", "recluta.html"), "utf8");
c(/window\.SG_GOOGLE_CLIENT_ID="[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com"/.test(html),
  "recluta.html lleva el ID de cliente puesto");

// ---------------------------------------------------------------- g) y hay una política que leer
const priv = fs.readFileSync(path.join(__dirname, "..", "privacidad.html"), "utf8");
c(/Pol[ií]tica de privacidad/i.test(priv), "existe la política de privacidad");
c(priv.indexOf("puerta.js") < 0, "🔴 y es PÚBLICA: una política detrás de un PIN no es una política");
c(/ver tu direcci[óo]n de correo/i.test(priv), "dice exactamente qué se pide a Google");
c(/tickets de salida/i.test(priv) && /an[óo]nimos/i.test(priv), "y que los tickets de salida son anónimos");

E.resumen("Entrar con Google");
