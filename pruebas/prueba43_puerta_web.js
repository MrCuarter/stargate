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
// 🔴 12-sep · `geniallys.html` ya no existe. Era una rejilla de OCHO huecos vacíos —los ocho
// `view` del catálogo están a `None`— es decir, una promesa incumplida enseñada como si fuera una
// página. Norberto: «eliminamos lo de Genially entonces, promesa incumplida». El enlace a la
// carpeta compartida, que es lo único que se usaba de ahí, vive en Recursos.
["guia.html", "cronologia.html", "actividades.html", "registro.html",
 "recursos.html", "grupos.html", "embed.html", "pasos.html"].forEach(function(f){
  const h = leer(f);
  c(h.indexOf("assets/js/puerta.js") >= 0, "🔒 " + f + " está tras la puerta del profesorado");
  c(h.indexOf('classList.add("cerrado")') >= 0,
    "   y nace tapada, sin enseñar el contenido un instante antes");
});

// ---------------------------------------------------------------- b) lo que NO puede pedirlo
// La Nave y el foro los abre el alumnado, que no tiene PIN. La portada es la cara del proyecto.
["index.html", "recluta.html", "foro.html", "panel.html", "ayuda.html", "comosehizo.html"].forEach(function(f){
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
// 🔴 12-sep · AQUÍ HABÍA una comprobación de que la puerta usaba el MISMO `sessionStorage.sgPin`
// que «Mi clase» y los tickets, para no pedirlo dos veces. Ya no aplica: NO HAY PIN. Lo zanjó
// Norberto —«el docente entra con su correo de Google, el que el profe referente ha escrito;
// entonces el sistema ya reconoce al docente y su grupo, ¿para qué PIN?»— y además el PIN se había
// quedado huérfano: nadie lo repartía en el sistema nuevo, así que era una caja pidiendo una clave
// que no existía. La llave es la cuenta, y la marca la pone el servidor.
c(!/sgPin/.test(P), "🔴 la puerta ya no sabe nada de PIN: la llave es la cuenta");
c(P.indexOf("sgEsDocente") >= 0, "   y se abre con la marca que pone el motor al reconocer a un docente");

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


// ---------------------------------------------------------------- la portada es PUBLICA de verdad
// 9-sep · Visto en una captura: la portada seguia enseñando el globo del Capitan «¿primera vez en
// el puesto de mando?». Vivia ahi de cuando index.html ERA el puesto de mando, y se lo preguntaba
// a cualquiera — a un estudiante, a alguien de fuera. Con el menu pasa igual.
const tour = leer("assets/js/tour.js");
c(/page\(\)==='guia\.html' && q===null/.test(tour),
  "🔴 la invitación del Capitán saluda en la guía, no en la portada pública");
c(!/page\(\)==='index\.html' && q===null/.test(tour),
  "   y ya no se dispara en index.html");

const port = leer("index.html");
["Mi clase", "tour-start", "modo docente"].forEach(function(t){
  c(port.indexOf(t) < 0, "🔴 la portada no lleva «" + t + "»: es la puerta de todos, no la del profesorado");
});
c(port.indexOf('href="recluta.html">🚀 Soy estudiante') >= 0 && port.indexOf('href="guia.html">🎓 Soy docente') >= 0,
  "🔴 y su menú son las dos puertas: estudiante y docente");

// ---------------------------------------------------------------- «Cómo se hizo» (11-sep)
// Norberto quiso contar en abierto con qué se hizo esto. Dos cosas que vigilar:
// 🔴 11-sep · SIN COMENTARIOS. La comprobacion de «lo dice la pagina» pasaba por un comentario
// HTML que el lector no ve nunca: el guardian daba verde por el motivo equivocado, que es lo mismo
// que no tener guardian. Desde aqui, todo lo que se comprueba es lo que se LEE.
// Y de paso se juntan los espacios: el HTML parte los parrafos en varias lineas, pero el lector ve
// una frase seguida. Comprobar contra el texto CON saltos obliga a escribir expresiones fragiles que
// se rompen cada vez que alguien reajusta un margen.
const sinComentarios = h => String(h).replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ");
const CSH = sinComentarios(leer("comosehizo.html"));
const como = sinComentarios((port.match(/<section id="comohizo"[\s\S]*?<\/section>/) || [""])[0]);
c(como.length > 0, "la portada cuenta cómo se hizo el proyecto");
["Claude", "OpenArt", "Magnific"].forEach(function(h){
  c(como.indexOf(h) >= 0, "   y nombra «" + h + "»");
});
// 🔴 La regla del proyecto: en comunicación pública NO se citan las herramientas del aula. Estas
// tres son de producción y las cita él a propósito; Genially es de aula y no puede colarse aquí.
c(como.indexOf("Genially") < 0,
  "🔴 y NO nombra Genially: en abierto no se citan las herramientas del aula");
// el botón de referido solo si hay enlace: uno vacío llevaría a ninguna parte
const datos = require("fs").readFileSync(require("path").join(RAIZ, "_site_data.py"), "utf8");
const conUrl = datos.slice(datos.indexOf("DIRECTOR = dict("), datos.indexOf("# Los numeros se leen"));
const urls = (conUrl.match(/url="[^"]*"/g) || []).filter(function(u){ return u !== 'url=""'; }).length;
const botones = (como.match(/Probar /g) || []).length;
igual(botones, urls, "🔬 hay tantos botones de apoyo como enlaces de referido puestos (" + urls + ")");
// 🔴 Si hay botones, hay que DECIR que son de referido. Ocultarlo seria lo contrario de un
// proyecto que va de dejar constancia — y la peticion se sostiene mejor dicha en voz alta.
// ---- la portada solo ADELANTA: el detalle vive en su propia pagina (peticion del 11-sep)
c(/href="comosehizo\.html"/.test(como), "🔴 la portada lleva a la página del «cómo se hizo»");

// ---- el director de orquesta, y que se vea que lo es
// 🔴 No es maquetacion bonita: las tres herramientas no se hablan entre ellas, hablan con el centro.
// Si algun dia esto vuelve a ser una fila de cuatro iguales, el proceso queda mal contado.
[["la portada", como], ["«cómo se hizo»", CSH]].forEach(function(par){
  const nom = par[0], doc = par[1];
  c(/class="director"/.test(doc), "en " + nom + " Claude va en su propio bloque, no en fila");
  c(doc.indexOf('class="director"') < doc.indexOf('class="grid cols-3 brazos"'),
    "   y ARRIBA: los tres brazos salen de él");
  c((doc.match(/class="card comohizo"/g) || []).length === 3, "   y los brazos son tres");
  c(/no es un paso que se pueda saltar/i.test(doc), "   dice por qué no se puede saltar");
  // el contrapeso: sin esto la pagina seria publicidad
  c(/la partitura la escribe el docente/i.test(doc),
    "🔴 y que la partitura la escribe el DOCENTE, que es lo que evita que esto sea un anuncio");
});
c((como.match(/class="paso"/g) || []).length === 0,
  "   y no repite ahí el detalle: para eso está la página");

if (botones > 0) {
  c(/enlaces de afiliado/.test(como), "🔴 y la página avisa de que son enlaces de afiliado");
  c(/descuento o un crédito de bienvenida/.test(como),
    "   diciendo qué gana quien entra por ahí…");
  c(/se reinvierten en seguir ampliando/.test(como), "   …y qué gana el proyecto");
}

// ---------------------------------------------------------------- la página «cómo se hizo»
// Es PUBLICA a proposito: es la cara del proyecto hacia fuera, como la portada. Si algun dia
// alguien le pone la puerta del profesorado, se rompe el motivo de existir.

c(CSH.indexOf("assets/js/puerta.js") < 0, "🔴 «cómo se hizo» NO pide PIN: es pública");
c(CSH.indexOf("Genially") < 0, "🔴 y tampoco nombra Genially");
c((CSH.match(/class="paso"/g) || []).length >= 7, "cuenta el proceso paso a paso (7 pasos)");

// ---- los logos: usarlos obliga a decir que no hay relacion con esas empresas
// 🔴 La politica de afiliados de OpenArt prohibe expresamente dar a entender una relacion que no
// existe. Un logo junto a un enlace de referido se lee como «partner oficial» si no se aclara.
const logos = ["claude", "openart", "magnific", "elevenlabs", "hostinger"];
logos.forEach(function(g){
  c(new RegExp("assets/img/logos/" + g).test(CSH), "lleva el logo de " + g);
  c(fs.existsSync(path.join(RAIZ, "assets", "img", "logos", g + (g === "magnific" || g === "elevenlabs" ? ".svg" : ".png"))),
    "   y el fichero existe de verdad");
});
c(/no está afiliado a ninguna de ellas/.test(CSH),
  "🔴 y dice CLARAMENTE que el proyecto no está afiliado ni respaldado por ellas");
// el mismo aviso que la portada, aqui tambien: es LA pagina de los enlaces, no puede decir menos
c(/enlaces de afiliado/.test(CSH), "🔴 la página avisa de que son enlaces de afiliado");
c(/descuento o un crédito de bienvenida/.test(CSH), "   dice qué gana quien entra por ahí…");
c(/se reinvierten en seguir ampliando/.test(CSH), "   …y qué gana el proyecto");
c(/Amara Sol/.test(CSH) && /recast/i.test(CSH), "   y no esconde los recasts del casting de voces");
c(/opening-v2/.test(CSH), "   ni los borradores («opening» y «opening-v2»)");
c((CSH.match(/<tr>/g) || []).length >= 10, "la tabla del casting tiene a los nueve y a NEBULA");
// 🔴 EL FALLO CLASICO DE ESTE PATRON: un marcador sin sustituir en una pagina publica.
c(!/\{piezas\}|\{masters\}|\{planos\}|\{voces\}/.test(CSH),
  "🔴 ningún marcador {…} se cuela sin sustituir");
const cifras = (CSH.match(/<div class="cifra"><b>(\d+)<\/b>/g) || []);
igual(cifras.length, 4, "las cuatro cifras del proceso están puestas");
c(cifras.every(function(x){ return Number(x.replace(/\D/g, "")) > 0; }),
  "🔴 y ninguna es cero: publicar un 0 sería peor que no contar");
// los ids internos de ElevenLabs no pintan nada en abierto
c(!/\(\s*\d{2,4}\s*\)/.test(CSH.split("casting")[1] || ""),
  "🔬 el casting publica NOMBRES de voz, no los ids internos");

// ---- la ayuda del alumnado (11-sep): los GIF salen de grabaciones reales, no de un dibujo
const AY = sinComentarios(leer("ayuda.html"));
["compartir-padlet.gif", "compartir-genially.gif"].forEach(function(g){
  c(AY.indexOf("assets/img/ayuda/" + g) >= 0, "la ayuda enseña " + g);
  c(fs.existsSync(path.join(RAIZ, "assets", "img", "ayuda", g)), "   y el fichero existe");
});
c(/Compartir desde esta página/.test(AY), "explica la casilla de Genially, que es la clave");
c(/Copiar el enlace a la publicación/.test(AY), "y la opción exacta de Padlet");
c(/loading="lazy"/.test(AY), "🔬 los GIF cargan en diferido: pesan 2 MB entre los dos");
// la Nave lleva a la ayuda: es donde el recluta esta cuando duda
c(/href="ayuda\.html"/.test(leer("assets/js/recluta.js")), "🔴 la Nave enlaza a la ayuda");
// 🔴 y el selector de grupo no enseña jerga de hoja de calculo
c(!/esc\(p\.tipo\)/.test(leer("assets/js/recluta.js")),
  "🔴 el selector de grupo NO enseña REGULAR/PUA: al alumnado no le dice nada");

E.resumen("La puerta del profesorado");
