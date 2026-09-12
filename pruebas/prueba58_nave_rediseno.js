'use strict';
// 58 · LA NAVE REDISEÑADA · lo que no puede volver atrás
//
// El 12-sep la Nave pasó de seis pestañas a cinco, de dos barras fijas a una, y estrenó el bloque de
// retos de la semana, el botín, ocho rankings y la llamada a filas. Esta batería no comprueba que
// «se vea bien» —eso se mira con los ojos— sino las decisiones que costaron pensarse y que una
// refactorización distraída desharía sin que saltara nada.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
const js = f => fs.readFileSync(path.join(__dirname, "..", "assets", "js", f), "utf8");
console.log("\n▶ 58 · La Nave rediseñada");

const NAVE = js("recluta.js"), TABLERO = js("tablero.js"), MOTOR = js("motor.js");
const AULA = js("aula.js"), LLAMADA = js("llamada.js"), CSS = fs.readFileSync(
  path.join(__dirname, "..", "assets", "css", "stargate.css"), "utf8");

// ---------------------------------------------------------------- a) cinco pestañas, y las viejas no rompen
igual((NAVE.match(/\['(nave|retos|botin|mercado|rankings)','/g) || []).length, 5,
  "🔴 cinco pestañas, ni una más: seis mezclaban hacer, tener y comprar");
c(/TABS_VIEJAS=\{ficha:'nave',semana:'nave',planetas:'retos',premios:'mercado',tablero:'rankings'\}/.test(NAVE),
  "🔴 y los identificadores VIEJOS siguen funcionando: un enlace guardado a #premios no puede dar error");
c(/if\(TABS_VIEJAS\[k\]\) k=TABS_VIEJAS\[k\];/.test(NAVE), "   la traducción ocurre antes de validar");

// ---------------------------------------------------------------- b) una sola barra, con los contadores dentro
// 🔴 12-sep · DOS FILAS, NO UNA. Norberto: «el menú quiero que esté fijo arriba desde el principio.
// En la línea de arriba del todo, donde pone STARGATE, añade la miniatura del personaje, nombre,
// dinero, exp, nivel. En la segunda fila los botones de las diferentes páginas, fijo».
// La primera fila ya existía y solo llevaba una marca: meter ahí la identidad deja la segunda
// entera para las secciones, y ya no hay que bajar para ver el saldo.
c(/function pestanas\(\)[\s\S]{0,2600}nave-barra-u/.test(NAVE), "la barra de secciones se sigue pintando");
c(/function pintarIdentidad/.test(NAVE), "🔴 y la identidad va arriba, en la línea del sitio");
c(/id="nb-xp"[\s\S]{0,400}id="nb-cr"/.test(NAVE),
  "🔴 con los MISMOS ids: son los que hace rodar la fiesta al ganar puntos, y cambiarlos habría dejado los contadores quietos justo cuando tienen que moverse");
c(/id="nb-xp"/.test(NAVE) && /id="nb-cr"/.test(NAVE),
  "🔴 los contadores viven en la barra: si no, marcar un reto desde otra pestaña celebra en una cifra que nadie mira");
const cssBarra = CSS.slice(CSS.indexOf(".nave-barra-u{"), CSS.indexOf(".nave-barra-u{") + 260);
c(/position:sticky;top:47px;z-index:15/.test(cssBarra),
  "🔴 la barra se pega DEBAJO del menú de la web (47 px) y por debajo en z: encima lo dejaba inalcanzable");
c(/body\.embed \.nave-barra-u\{top:0\}/.test(CSS),
  "   y arriba del todo cuando va incrustada, que ahí no hay menú");
c(NAVE.indexOf("function accesos()") < 0,
  "🔴 la parrilla de accesos ya no existe: era el puente a los formularios de Google");
c(/function menuMas\(\)/.test(NAVE), "   lo ocasional vive en el menú «···»");
c(/montarInterruptor\('nb-fiesta'\)/.test(NAVE), "   y el interruptor de sonido se mete ahí dentro");

// ---------------------------------------------------------------- c) los retos de la semana
c(/function retosDeLaSemana\(\)/.test(NAVE), "el bloque de retos de la semana existe");
c(/function pasosDeReto\(txt\)/.test(NAVE),
  "🔴 el paso a paso sale de PARTIR la explicación del catálogo, no de un texto escrito aparte");
c(/if\(out\.length && f\.length<42\)/.test(NAVE),
  "   y las frases cortas se pegan a la anterior: «Piénsalo para aula invertida.» no es un paso");
c(/rs-premio"><span class="p xp">\+'\+t\[3\]\+' xp/.test(NAVE), "cada reto enseña los xp que da");
c(/creditosDeReto\(t\[0\]\)/.test(NAVE), "   y los créditos");
c(/P\.creditosDe\(\{id:id\},tipo,cat\)/.test(NAVE),
  "🔴 los créditos los calcula la MISMA regla que siembra el grupo, no una copia que se desincronice");
c(/data-hecho="'\+esc\(t\[0\]\)/.test(NAVE), "y se marca desde ahí mismo");
c(/rs-atras[\s\S]{0,200}sin registrar de semanas anteriores/.test(NAVE),
  "🔴 y la línea de atrasados, que es el dato que más mueve y no estaba en ninguna parte");
const evid = NAVE.slice(NAVE.indexOf("function marcarReto"), NAVE.indexOf("function marcarReto") + 700);
c(/querySelectorAll\('\[data-ev="'\+id\+'"\]'\)/.test(evid),
  "🔴 la evidencia se busca en los DOS sitios donde puede estar (la tarjeta y la pestaña de retos)");

// ---------------------------------------------------------------- d) el botín, todo junto
c(/function botin\(\)/.test(NAVE), "«Mi botín» existe");
["🏅 Insignias", "🃏 Tu álbum", "🎭 Personajes"].forEach(function (t) {
  c(NAVE.indexOf(t) >= 0, "   y recoge «" + t + "»");
});
c(/function badgesCronologicos\(\)/.test(NAVE), "las insignias van en el orden en que se ganan");
c(/\(st\.semanas \|\| SEM \|\| \[\]\)\.forEach/.test(NAVE),
  "🔴 y ese orden sale del CALENDARIO, no de una lista aparte: mover un reto de semana reordena la colección sola");

// ---------------------------------------------------------------- e) ocho rankings, y el de equipos por media
const MODOS = (TABLERO.match(/\{k:'[a-z]+'/g) || []).length;
igual(MODOS, 8, "🔴 ocho rankings: no ocho veces el mismo dato, ocho datos distintos");
c(/porEquipos:true/.test(TABLERO), "uno compara escuadrones");
c(/Math\.round\(suma\/g\.length\)/.test(TABLERO),
  "🔴 por MEDIA por recluta: sumando ganaría siempre el más numeroso y la tabla mediría cuánta gente hay");
c(/soloSiSeQuienSoy:true/.test(TABLERO), "«Mi escuadrón» solo sale donde se sabe quién eres");
c(/window\.SG_YO_ALIAS/.test(TABLERO) && /window\.SG_YO_ALIAS/.test(NAVE),
  "   y la Nave se lo dice; en el tablero proyectado no hay nadie y por eso no aparece");
c(/window\.SG_RANKING_REPINTA/.test(TABLERO) && /SG_RANKING_REPINTA\(\)/.test(NAVE),
  "🔴 con un tirador para repintarlo: se pinta al cargar, antes de que la Nave sepa quién eres");
c(/escuadrones: \(\(P\.factions \|\| \[\]\)\)/.test(
    fs.readFileSync(path.join(__dirname, "..", "motor", "tablero.js"), "utf8")),
  "los escuadrones salen del tablero, con emblema y lema");

// ---------------------------------------------------------------- f) la llamada a filas
c(/attendance_sessions/.test(MOTOR) && /attendance_records/.test(MOTOR),
  "🔴 la llamada usa la asistencia que GamificaPro YA tenía: no se ha inventado un sistema paralelo");
c(/source: "attendance_session_auto_reward"/.test(MOTOR),
  "   y paga por la fuente que el servidor verifica");
c(/idempotencyKey: "xp_attendance_"/.test(MOTOR), "   con clave de idempotencia: fichar dos veces no cobra dos veces");
c(/restrictedFactionId/.test(MOTOR), "🔴 y se restringe al escuadrón de quien la toca, no a todo el grupo");
// La palabra solo aparece en el comentario que explica POR QUÉ no la hay. En el código, ni rastro.
const codigoMotor = MOTOR.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
c(codigoMotor.indexOf("palabra") < 0 && codigoMotor.indexOf("consigna") < 0,
  "🔴 sin palabra secreta: en Firestore, un sitio donde comprobarla es un sitio donde leerla antes");
c(/function vigilarLlamada/.test(MOTOR) && /onSnapshot/.test(MOTOR),
  "🔴 llega EN DIRECTO por escucha, no preguntando: con 200 alumnos serían 1.200 lecturas por minuto");
c(/function fichar\(\)/.test(NAVE) && /ficharLlamada\(per, st\.yo\.ficha\)/.test(NAVE),
  "la Nave ficha con su propia ficha");
c(/yo_\.ficha = f\.id/.test(js("fuente.js")),
  "🔴 y conoce su identificador porque se le da: el tablero público no lo trae, y así sigue");

// ---------------------------------------------------------------- g) los embeds, universales
[["llamada.js", LLAMADA], ["aula.js", AULA]].forEach(function (par) {
  c(/misPERs\(YO\.correo\)/.test(par[1]),
    "🔴 " + par[0] + " deduce el grupo de QUIÉN PULSA: el enlace no lo lleva dentro");
  c(/noEresComandante|noEresDocente/.test(par[1]),
    "   y explica al alumnado que eso no es suyo en vez de darle un error");
});
c(/noEresComandante/.test(LLAMADA),
  "🔴 el Genially se PROYECTA: a quien no es docente se le explica, no se le da un error");
["premiar", "regalarCromo"].forEach(function (f) {
  c(new RegExp("async function " + f).test(MOTOR), "el motor sabe «" + f + "»");
});
c(/perId \+ "__cromo_"/.test(MOTOR),
  "🔴 y la carta regalada se guarda con el identificador de DOCUMENTO, o el álbum no sabría leerla");

// ---------------------------------------------------------------- h) los rankings ordenan de verdad
// 🔴 `planetas_completos` es un ARRAY con los temas cerrados, no un contador. El ranking «Explorador»
// lo restaba como número: `[1,2] - [1]` es NaN, el `sort` no ordena nada y la tabla sale en el orden
// en que llegaron los datos — pareciendo un ranking. Sin error, claro.
c(/Array\.isArray\(v\)\?v\.length/.test(TABLERO),
  "🔴 el ranking de planetas cuenta la LONGITUD del array, no el array");
// Y de paso: ningún modo puede devolver algo que no sea un número.
const CAMPOS_VAL = TABLERO.match(/val:function\(p\)\{return [^}]+\}/g) || [];
c(CAMPOS_VAL.length >= 6, "hay un extractor de valor por ranking");
CAMPOS_VAL.forEach(function (f) {
  c(/\|\|\s*0|\?v\.length|p\.xp;|pctCol/.test(f),
    "   y todos se defienden de que falte el dato: " + f.slice(0, 46));
});

// ---------------------------------------------------------------- i) la puerta acepta la cuenta
// 🔴 La sala del docente enlaza «Proyectar la semana», y esa página está detrás de la puerta del
// profesorado, que pedía un PIN. Con el motor nuevo NO HAY PIN que repartir: un docente pulsaba su
// propio botón y se estrellaba. Ahora la cuenta es la llave.
const PUERTA = js("puerta.js");
c(/localStorage\.getItem\('sgEsDocente'\) === '1'/.test(PUERTA),
  "🔴 la puerta se abre si el motor ya reconoció a esa cuenta como docente");
c(/localStorage\.setItem\("sgEsDocente", "1"\)/.test(MOTOR),
  "   y la marca la pone `misPERs`, que es donde el SERVIDOR dice que sí");
c(/if \(mios\.length\)/.test(MOTOR),
  "🔴 solo si devuelve algún grupo: tener sesión no basta, un alumno también la tiene");
c(/localStorage\.removeItem\("sgEsDocente"\)/.test(MOTOR),
  "   y se borra al salir, o cerrar sesión no cerraría nada");
c(PUERTA.indexOf("sgEsDocente") > PUERTA.indexOf("sessionStorage.getItem('sgPin')"),
  "   el PIN de siempre sigue funcionando primero: los grupos viejos no se tocan");

// ---------------------------------------------------------------- j) nada que tumbe un móvil viejo
// 🔴 `split(/(?<=\.)\s+/)` era lo natural para partir por frases, pero el LOOKBEHIND es ES2018 y
// Safari no lo entendió hasta la 16.4. En un iPhone de hace tres años eso no es una función que
// falla: es un error de SINTAXIS que tumba el fichero entero y la Nave no carga. Y la Nave la abren
// doscientos móviles cualesquiera el primer día de clase.
const NO_MODULOS = ["recluta.js", "tablero.js", "clase.js", "aula.js", "llamada.js",
                    "alistarse.js", "consola.js", "crear.js", "tickets.js", "fuente.js",
                    "validar.js", "puerta.js", "fiesta.js"];
/**
 * Se miran solo las INSTRUCCIONES: fuera comentarios y fuera el texto entre comillas. Si no, salta
 * con el comentario que explica por qué no hay lookbehind, y con cada «???» que se pinte en pantalla.
 */
function soloCodigo(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, " ")
          .replace(/^\s*\/\/.*$/gm, " ")
          .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
          .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
}
NO_MODULOS.forEach(function (f) {
  const codigo = soloCodigo(js(f));
  c(!/\(\?<[=!]/.test(codigo), "🔴 " + f + " no usa lookbehind (Safari < 16.4 no carga el fichero)");
  c(!/\?\?/.test(codigo), "   ni el operador ?? (Safari < 13.1)");
  c(codigo.indexOf("?.") < 0, "   ni el encadenamiento opcional ?. en " + f);
});

// ---------------------------------------------------------------- k) TODO pasa por el interruptor
// 🔴 `perData` —lo que alimenta la sesión proyectable y el foro dinámico— iba SIEMPRE al Apps
// Script, saltándose el interruptor. En un grupo del motor nuevo la respuesta era «no existe» y
// ninguna de las dos daba error: se quedaban con sus valores por defecto y enseñaban la SEMANA 1
// estando en la 14. Un docente habría proyectado la clase equivocada sin enterarse.
const CAL = js("calendario.js");
c(/F\.nombre === 'firestore'/.test(CAL), "🔴 `perData` mira qué motor hay antes de pedir nada");
c(/\? F\.tablero\(per\)/.test(CAL), "   y con el nuevo pide por la fuente, no al Apps Script");
c(/'sgPerCache_'\+\(nuevo\?'fs_':''\)\+per/.test(CAL),
  "🔴 y la caché lleva el motor en la clave: si no, al cambiar de motor se leería la foto del otro");

// Nadie más puede hablar con el Apps Script a pelo desde una página que sirve a los dos motores.
["sesion.js", "foro.js"].forEach(function (f) {
  const t = soloCodigo(js(f));
  c(!/fetch\(\s*API\s*\+/.test(t), "   " + f + " no llama al Apps Script por su cuenta");
});

// ---------------------------------------------------------------- l) el aula no enseña gente ajena
// 🔴 Si el nombre del docente no cuadraba con ninguno, `mios()` devolvía TODO el grupo. En silencio.
// Un docente con el nombre escrito distinto en el equipo veía al alumnado de sus compañeros y podía
// premiar a alguien de otra clase creyendo que era suyo.
c(/return soyReferente\(\) \? \(D\.reclutas \|\| \[\]\) : \[\];/.test(AULA),
  "🔴 sin coincidencias solo ve el grupo entero quien es REFERENTE; un docente, nadie");
c(/function avisoDeQuienVeo\(\)/.test(AULA), "y se explica por qué la pantalla está vacía");
c(/No te enseño el alumnado de/.test(AULA), "   diciendo claramente que no se enseña lo ajeno");

// ---------------------------------------------------------------- m) los grupos nuevos, en el menú
// 🔴 `SG.pers` —que alimenta el desplegable «Grupos» del menú y la página de grupos— preguntaba solo
// al Apps Script. Un referente creaba un grupo desde la consola y NO LO VEÍA en el menú de su propia
// web, sin ningún error que lo explicara.
const ST = js("stargate.js");
c(/function delMotorNuevo\(\)/.test(ST), "🔴 `SG.pers` también pregunta al motor nuevo");
// 🔴 Y el motor se decide por la URL, no por si `SG.FUENTE` ya existe: los scripts van con `defer` y
// esta función la llaman páginas que arrancan antes de que la fuente esté cargada. Mirando el objeto,
// `nuevo` salía falso, se cacheaba la lista sin los grupos nuevos, y no volvían a aparecer hasta
// vaciar la caché a mano.
c(/q\.get\('motor'\)\|\|window\.SG_MOTOR/.test(ST),
  "🔴 y decide el motor por la URL, no por si la fuente ya ha cargado");
c(/function fuente\(\)/.test(ST) && /Date\.now\(\)-t0 > 6000/.test(ST),
  "   esperándola, pero sin colgarse si nunca llega");
const GRUPOS = js("grupos.js");
c(/SGCAL\.perData\(API, p\.id/.test(GRUPOS),
  "🔴 y la página de grupos pide los detalles por el calendario: al Apps Script a pelo, los grupos nuevos salían sin semana, sin fechas y sin enlaces");
c(/function juntar\(a,b\)/.test(ST), "   y junta las dos listas sin repetir");
c(/if\(fresco && !nuevo\) return;/.test(ST),
  "🔴 y con el motor nuevo refresca aunque la caché esté fresca: esa caché no conoce los grupos nuevos");
c(/nuevos\.length/.test(ST), "   sin API sigue habiendo grupos que enseñar, así que no se rinde");

// 🔴 Y LA TRAMPA QUE COSTÓ ENCONTRAR ESTO: `assets/js/stargate.js` NO se edita, se GENERA desde
// `_build_site.py`. Tocar el fichero y reconstruir borra el cambio sin decir nada — se ve porque el
// navegador sigue sirviendo la versión de antes. La fuente es el build.
const BUILD = fs.readFileSync(path.join(__dirname, "..", "_build_site.py"), "utf8");
c(/open\(os\.path\.join\(HERE,"assets","js","stargate.js"\),"w"/.test(BUILD),
  "🔴 stargate.js lo escribe la construcción: editarlo a mano no sirve de nada");
c(BUILD.indexOf("delMotorNuevo") > 0, "   por eso el cambio vive en _build_site.py, que es su fuente");

E.resumen("La Nave rediseñada");
