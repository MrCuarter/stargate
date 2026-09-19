/**
 * BATERÍA 99 · EL TICKET POR TEMA Y LAS HERRAMIENTAS DE CLASE (20-sep)
 * ------------------------------------------------------------------------------------------------
 * Norberto, el 20-sep, sobre la sesión que se proyecta:
 *
 *   «Ticket de salida: al principio debe salir el resumen de respuestas del último ticket de salida
 *    (porcentajes, valoraciones). En la siguiente diapositiva, preguntas, dudas o comentarios que hayan
 *    hecho. La última diapositiva es el ticket de salida embebido… (se hace al acabar tema, no semana)».
 *
 *   «El Aula: es mucha info. Yo quería un botón sencillo, que no tape otros botones (ahora tapa) y lo que
 *    debe contener es: estudiantes activos en esa sesión (han fichado), poder lanzar pregunta en directo y
 *    votación, poder escoger aleatoriamente un estudiante, poder dar un premio concreto a un estudiante o a
 *    toda la clase… la sección de a quién cambia el nombre y usa dibujos e iconos… añade un enlace rápido
 *    para compartir por el chat de Teams. Lo que sobra: llamada a filas, "para nombrar en voz alta" y
 *    "tu escuadrón"».
 *
 * Esta batería vigila que eso siga así, y de paso las cinco cosas que estaban rotas en el ticket.
 */
const fs = require("fs"), path = require("path");
const raiz = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(raiz, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };
const igual = (a, b, txt) => c(JSON.stringify(a) === JSON.stringify(b), txt, "esperaba " + JSON.stringify(b) + " y fue " + JSON.stringify(a));

const SES = leer("assets/js/sesion.js");
const AULA = leer("assets/js/aula.js");
const CSS = leer("assets/css/stargate.css");
const HTML = leer("sesion.html");
const SEMJSON = JSON.parse(HTML.match(/window\.SG_SEMANAS=(\[.*?\]);window\./)[1]);
const TEMAS = JSON.parse(HTML.match(/window\.SG_TICKET_TEMAS=(\{[^}]*\})/)[1]);

// ── 1 · el ticket se rellena al ACABAR EL TEMA, y sus tres diapositivas están donde toca
c(/function diaTicketForm\(s\)/.test(SES) && /function diasTicket\(lista, i\)/.test(SES),
  "🔴 el ticket son tres diapositivas: el formulario al cerrar el tema, y el resumen + las dudas al abrir el siguiente");
c(/if\(primeraDelTema\(L, iS\)\) diasTicket\(L, iS\)/.test(SES), "   el resumen y las dudas, al empezar un tema");
c(/if\(ultimaDelTema\(L, iS\)\)\{ var tf=diaTicketForm\(s\); if\(tf\) ci\.push\(tf\); \}/.test(SES),
  "🔴 y el formulario, lo ÚLTIMO de la última sesión del tema (en el tramo de cierre)");
c(SES.indexOf("ci.push(tf)") > SES.indexOf("diasMisiones(s)"), "   detrás de las misiones y de los vídeos de cierre");
c(!/diaTicket\(\)/.test(SES), "   y ya no hay un ticket semanal suelto");

// las funciones que deciden dónde cae cada cosa, probadas contra el calendario de verdad
const tramo = SES.slice(SES.indexOf("function temaDe(s)"), SES.indexOf("function diaTicketForm(s)"));
const F = new Function("window", tramo + "\n return {temaDe:temaDe, iDe:iDe, ultimaDelTema:ultimaDelTema, primeraDelTema:primeraDelTema, opcionTema:opcionTema, esDelTema:esDelTema};")({ SG_TICKET_TEMAS: TEMAS });
const ultimas = SEMJSON.map((s, i) => (F.ultimaDelTema(SEMJSON, i) ? s.sem : 0)).filter(Boolean);
const primeras = SEMJSON.map((s, i) => (F.primeraDelTema(SEMJSON, i) ? s.sem : 0)).filter(Boolean);
igual(ultimas, [2, 4, 6, 8, 9, 10, 12, 14, 15], "🔴 cierran tema las semanas 2, 4, 6, 8, 9, 10, 12, 14 y 15 (ahí va el ticket)");
igual(primeras, [1, 3, 5, 7, 9, 10, 11, 13, 15], "   y abren tema las 1, 3, 5, 7, 9, 10, 11, 13 y 15 (ahí, el resumen)");
c(SEMJSON.every((s, i) => i === 0 || !(F.primeraDelTema(SEMJSON, i) && F.ultimaDelTema(SEMJSON, i)) || s.tema_n !== SEMJSON[i - 1].tema_n),
  "   un tema de una sola semana (el 5 y el 6) abre y cierra en la misma sesión, y eso está bien");

// el tema del formulario va ya elegido, con el texto EXACTO de la opción de Google
c(/[?&]entry\.\d+=\{TEMA\}/.test(HTML), "🔴 el ticket lleva el hueco del TEMA");
SEMJSON.forEach(function (s) {
  if (!s.tema_n) return;
  c(F.opcionTema(s).indexOf("Tema " + s.tema_n + ":") === 0 || /^Actividad \d:/.test(F.opcionTema(s)),
    "   la semana " + s.sem + " sabe qué opción del formulario le toca", F.opcionTema(s));
});
c(F.esDelTema("Tema 2: El vídeo como recurso (Ecos)", SEMJSON, 3) === true, "   una respuesta del tema 2 cuenta para el tema 2");
c(F.esDelTema("Tema 3: Contenidos interactivos (Sendara)", SEMJSON, 3) === false, "   y la del 3, no");
c(F.esDelTema("Actividad 1: actividad didáctica a partir de una imagen con IA", SEMJSON, 1) === true,
  "🔴 las actividades cuentan para SU tema: «Actividad 1» es del tema 1");

// ── 2 · lo que se proyecta: porcentajes de cada nota, dudas aparte y el mensaje de cuando no hay nada
const tramo2 = SES.slice(SES.indexOf("var TK_ELIGE="), SES.indexOf("function montarTicket("));
const A = new Function("esc", tramo2 + "\n return {analizarTickets:analizarTickets, corto:corto, filaNota:filaNota};")(x => String(x));
const filas = [
  { r: { "Valora la satisfacción general del desarrollo de la clase": "5",
         "¿Cómo has seguido esta clase?": "La he seguido EN DIRECTO",
         "¿Alguna duda? ¿Te ha quedado alguna duda o quieres hacernos llegar algún comentario?": "No me quedó claro el vídeo interactivo",
         "El profesor o profesora que imparte tu clase...": "Capitana Vega",
         "Selecciona el tema o actividad que hemos trabajado y sobre el que quieres hacer una pregunta": "Tema 2: El vídeo como recurso (Ecos)" } },
  { r: { "Valora la satisfacción general del desarrollo de la clase": "3",
         "¿Cómo has seguido esta clase?": "La he visto en diferido (la grabación)" } }
];
const an = A.analizarTickets(filas);
igual(an.textos.length, 1, "🔴 «en directo / en diferido» NO es un comentario: solo cuenta lo que se escribe");
igual(an.textos[0].v, "No me quedó claro el vídeo interactivo", "   la duda, entera");
igual([an.seguido.directo, an.seguido.diferido], [1, 1], "   y quien la siguió en directo y quien en diferido, contados aparte");
igual(an.notas.length, 1, "una pregunta puntuada, una fila");
igual(an.notas[0].pct, [0, 0, 50, 0, 50], "🔴 con el REPARTO de cada nota en porcentaje, no una media suelta");
igual(an.notas[0].media, 4, "   y su media");
igual(an.notas[0].corto, "La clase, en general", "   con el nombre corto, que es lo que cabe proyectado");
c(!an.notas.some(x => /profesor o profesora|Selecciona el tema/.test(x.c)), "   la cabecera del formulario no se puntúa a sí misma");
c(/¡No hay comentarios!/.test(SES) && /Animadles a hacerlo en el ticket del tema que empieza hoy/.test(SES),
  "🔴 sin respuestas: «¡No hay comentarios!», animando a rellenarlo al acabar el tema");

// ── 3 · los tres fallos del ticket que venían de antes
c(/split\('\{GRUPO\}'\)\.join\(encodeURIComponent\(st\.per\|\|''\)\)/.test(SES),
  "🔴 el hueco «Grupo» lleva el ID del grupo, no su nombre (con el nombre, las respuestas no aparecían)");
c(/function elComandante\(\)\{ return String\(\(!st\.alumno&&st\.miNombre\)\|\|st\.profeMio\|\|''\)/.test(SES),
  "🔴 el Comandante se rellena también cuando la sesión la sigue un recluta (antes se quedaba vacío)");
c(/if\(!todo\.length\) todo=\[\{k:'vacio'/.test(SES),
  "🔴 un tramo sin diapositivas (?tramo=cierre en una semana sin cierre) ya no deja la pantalla en negro");

// ── 4 · el enlace para el chat de la clase: entra, ficha solo y sigue la presentación
c(/var FICHAR = q\.get\('fichar'\) === '1'/.test(SES), "🔴 ?fichar=1 · quien entra por el enlace del chat ficha solo");
c(/if\(FICHAR\) return fichar\(\);/.test(SES), "   en cuanto la llamada está abierta, sin botón que pulsar");
c(/u\.searchParams\.set\('seguir','1'\); u\.searchParams\.set\('fichar','1'\)/.test(SES), "   y ve la presentación al ritmo de la clase");
c(/id="ses-chat"/.test(SES) && /Copiar el enlace para el chat/.test(SES) && /!st\.alumno&&st\.per&&st\.yo\?'<p class="pt-chat">/.test(SES),
  "🔴 el botón de copiarlo está en la PRIMERA diapositiva, y solo lo ve quien da la clase");
c(/function enlaceSesion\(\)/.test(AULA) && /id="au-chat-c"/.test(AULA), "   y también a mano en las herramientas de clase");

// ── 5 · las herramientas de clase: solo lo de directo
c(/var TABS = \[\["clase", "envivo", "En clase"\], \["premios", "premios", "Premiar"\],\s*\n?\s*\["pregunta", "pregunta", "Pregunta"\], \["voto", "voto", "Votación"\], \["tiempo", "tiempo", "Tiempo"\]\]/.test(AULA),
  "🔴 cinco pestañas: En clase, Premiar, Pregunta, Votación y Tiempo");
c(!/function vistaGente\(/.test(AULA), "   fuera «Mi gente» («para nombrar en voz alta»: ya tiene sus diapositivas)");
c(!/function vistaRanking\(/.test(AULA), "   fuera «Ranking» («tu escuadrón»: también las tiene)");
c(!/au-tocar/.test(AULA) && !/Tocar llamada/.test(AULA), "🔴 fuera la llamada a filas: está dentro de la presentación, no hace falta dos veces");
c(/En clase hoy · ' \+ hoy\.length/.test(AULA) && /au-caras mini/.test(AULA), "   y queda quién ha fichado hoy, con su cara");
c(/id="au-ir-azar"/.test(AULA) && /function sortear\(marcar\)/.test(AULA), "   elegir a alguien al azar");
c(/¿Quién se lo lleva\?/.test(AULA) && !/<h3>¿A quién\?<\/h3>/.test(AULA), "🔴 «¿A quién?» ahora se llama «¿Quién se lo lleva?»");
c(/id="au-todos">' \+ \(FUENTE_P === "hoy" \? "Todos los presentes" : "Toda la clase"\)/.test(AULA),
  "🔴 se premia a uno, a los presentes o a toda la clase");
c(/var IMG_PREMIO = \{/.test(AULA) && /function imgPremio\(k\)/.test(AULA) && /class="au-pr-i"/.test(AULA),
  "🔴 cada premio con su DIBUJO (el mismo que le llega al recluta), no solo texto");
["assets/img/canje/sobre.jpg", "assets/img/canje/heroe.jpg", "assets/img/canje/marco.jpg", "assets/img/canje/titulo.jpg",
 "assets/img/canje/capsula_legendaria.jpg", "assets/img/tarjetas/N1_recluta_carta.png"].forEach(function (f) {
  c(AULA.indexOf(f) > 0 && fs.existsSync(path.join(raiz, f)), "   y la imagen existe: " + f);
});
c(!/<img class=ico src=assets\/img\/iconos\/p\/\w+\.png alt> (Una carta|Cápsula|Sobre)/.test(AULA),
  "   sin iconos pegados al nombre: la imagen ya lo dice");

// ── 6 · el lector del ticket ya no le contesta a cualquiera
const GS = leer("apps-script/LectorTickets.gs"), MOTOR = leer("assets/js/motor.js"), TK = leer("assets/js/tickets.js");
c(/function usuarioDelToken_\(token\)/.test(GS) && /identitytoolkit\.googleapis\.com\/v1\/accounts:lookup/.test(GS),
  "🔴 el lector de la hoja comprueba con Firebase quién le pregunta");
c(/var quien = usuarioDelToken_\(q\.token\);\s*\n\s*if \(!quien\) return json_\(/.test(GS),
  "   y si no vale el token, no contesta NADA (ni leer ni marcar resuelto)");
c(/async function credencial\(\)/.test(MOTOR) && /entrar, salir, sesion, credencial,/.test(MOTOR), "   el motor sabe dar esa credencial");
c(/token:t\|\|''/.test(SES) && /token:t\|\|''/.test(TK), "   y la mandan la sesión y el panel de tickets");
c(/function sinSesion\(msg\)/.test(TK), "   sin sesión, el panel lo dice en vez de quedarse en blanco");
c(/VOLVER A HACERLO/.test(GS), "🔴 y el fichero avisa de que hay que volver a desplegarlo para que sirva de algo");

// ── 7 · el grupo de ejemplo, en un solo sitio (y existiendo)
const AULA_JS = AULA, CONS = leer("assets/js/consola.js"), SITE = leer("_site_data.py"), BUILD = leer("_build_site.py"), GUIA = leer("guia.html");
c(/^PER_DEMO = "demo-stargate"$/m.test(SITE), "🔴 el grupo de las pantallas de ejemplo se escribe UNA vez (_site_data.PER_DEMO)");
c(/window\.SG_PER_DEMO=/.test(BUILD) && ["consola.html", "aula.html", "sesion.html"].every(f => /SG_PER_DEMO/.test(leer(f))),
  "   y viaja a las páginas que lo usan");
["assets/js/aula.js", "assets/js/consola.js", "assets/js/sesion.js", "guia.html", "_capturas_pasos.py", "_build_site.py"].forEach(function (f) {
  c(leer(f).indexOf("demo-motor") < 0, "🔴 nadie apunta ya a «demo-motor», que ya no existe: " + f);
});
c(/per=demo-stargate/.test(GUIA), "   «Probar la Nave como estudiante» lleva a un grupo que existe");
c(/window\.SG_PER_DEMO \|\| "demo-stargate"/.test(AULA_JS) && /window\.SG_PER_DEMO \|\| "demo-stargate"/.test(CONS),
  "   y si algún día no llegara, el respaldo es el mismo");

// ── 8 · el botón, donde no tapa nada
c(/\.ses-aula-b\{display:flex/.test(CSS) && !/\.ses-aula-b\{position:absolute/.test(CSS),
  "🔴 el botón de las herramientas ya no flota encima de la barra de pasos");
c(/\.tk-nota\{display:grid/.test(CSS) && /\.tk-n-b \.v1/.test(CSS), "   y el resumen del ticket tiene su barra de colores");
c(/\.tk-nada\{/.test(CSS), "   y el «¡No hay comentarios!», su recuadro");

console.log("\n  Batería 99 · el ticket por tema y las herramientas de clase (20-sep)");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
