/**
 * STARGATE · DATOS — el catálogo del juego, separado del motor.
 *
 * Aquí viven los retos, los temas, los cromos, los héroes, los niveles, las recompensas y lo que
 * hay que hacer en cada reto. Code.gs es la maquinaria; esto es lo que la maquinaria mueve.
 *
 * Se separó cuando Code.gs dejó de poder guardarse: Apps Script empezó a rechazar el fichero al
 * pasar de ~220 KB. La alternativa era recortar comentarios, que es justo lo contrario de lo que
 * necesita un proyecto que va a quedarse solo unos meses.
 *
 * 🔴 CASI TODO ESTO LO GENERA web-stargate/_build_site.py desde _site_data.py. No editar a mano lo
 * que esté entre marcas (CROMOS, HEROES, NIVELES, RECOMPENSAS, AYUDA, BONUS): se pierde al compilar.
 */

// 🔬 PUESTA EN ESCENA · los tres ítems que el alumnado responde en el ticket, tema a tema.
// No preguntan por la calidad del docente: preguntan por lo que PASÓ en clase, que es observable y
// no obliga a nadie a juzgar a su profesor. Llevan el prefijo «STARGATE ·» a propósito: es lo que
// permite que NO salgan proyectados en el panorama de clase (ver tickets.js).
// 🔴 El título es la CLAVE con la que se leen las respuestas (se leen por cabecera, no por posición),
// así que cambiarlo parte la serie en dos. Si hay que tocarlo: se añade uno nuevo y se jubila el viejo.
var TIT_PAG_TEMA = "Sobre el tema escogido";
// La bifurcación: los tres ítems de arriba solo tienen sentido si estuviste EN DIRECTO. Quien vio la
// grabación puede valorar el contenido igual de bien —esas escalas las responden todos— pero no
// puede saber si se enseñó el ranking en clase. Y de paso, «directo o diferido» por tema y por
// docente es un dato que hoy no está en ningún sitio.
var TIT_PAG_DIRECTO = "Sobre la clase en directo";
var TIT_COMO_SEGUIDA = "¿Cómo has seguido esta clase?";
var OPC_DIRECTO  = "La he seguido EN DIRECTO";
var OPC_DIFERIDO = "La he visto en diferido (la grabación)";
var PUESTA_EN_ESCENA = [
  ["STARGATE · En esta clase se ha hablado de la misión (ranking, insignias, planetas)",
   "Ni se ha mencionado", "Ha estado muy presente"],
  ["STARGATE · Se ha mostrado el tablero o el ranking durante la clase",
   "No se ha mostrado", "Sí, lo hemos visto"],
  ["STARGATE · Se ha reconocido en público el avance de alguien de la clase",
   "No", "Sí, varias veces"]
];

// ================= CATÁLOGO =================
// [id, etiqueta de la casilla, insignias, xp, tema]
var RETOS_REGULAR = [
  // v3.39 · el clásico que faltaba (30-ago): presentarse a la tripulación. Da la insignia de NEBULA,
  // que hasta hoy se regalaba al alistarse — ahora se GANA compartiendo tu cara con la clase.
  ["A0","Reto «Preséntate a tu tripulación» (vídeo de 60 s)",["E1_nebula"],100,1],
  ["A1","Reto A «El boceto sin quemar» (recupera a Bran)",["P1_bran"],100,1],
  ["B1","Reto B «La chispa» (imagen con IA)",["R1_la-chispa"],250,1],
  ["X1","Actividad 1 entregada (imagen con IA)",["H2_primera-forja","E2_capitan"],500,1],
  ["A2","Reto A «Un mensaje para quien faltó» (recupera a Tomás)",["P2_tomas"],100,2],
  ["B2","Reto B «El eco que enseña» (videotutorial + videoquiz)",["R2_el-eco-que-ensena"],250,2],
  ["A3","Reto A «Dos senderos» (recupera a Sylla)",["P3_sylla"],100,3],
  ["B3","Reto B «La matriz» (matriz 8×6)",["R3_la-matriz"],250,3],
  ["X2","Actividad 2 entregada (paisaje de aprendizaje)",["H3_cartografo"],500,3],
  ["A4","Reto A «Abre el canal» (recupera a Amara)",["P4_amara"],100,4],
  ["B4","Reto B «El entorno de aula» (aula virtual)",["R4_entorno-de-aula"],250,4],
  ["A5","Reto A «Mide con método» (recupera a Vera)",["P5_vera"],100,5],
  ["B5","Reto B «La Bitácora medida» (web de recursos + rúbrica)",["R5_bitacora-medida"],250,5],
  ["A6","Reto A «El Simulador de Joran» (recupera a Joran)",["P6_joran"],100,6],
  ["B6","Reto B «El juego» (juego digital)",["R6_el-juego"],250,6],
  ["A7","Reto A «Un porqué» (recupera a Mara)",["P7_mara"],100,7],
  ["B7","Reto B «La microgamificación»",["R7_microgamificacion"],250,7],
  // v3.41 · el huevo de Pascua: un enlace oculto en la presentación de Vínculo lleva a un
  // enigma; la palabra secreta del final es la evidencia (el formulario la valida solo).
  ["S7","Reto secreto «El Escape UNI»",["E3_vaeon"],150,7],
  ["A8","Reto A «La capa posible» (recupera a Noa)",["P8_noa"],100,8],
  ["B8","Reto B «El último umbral» (RA/RV + Bitácora publicada)",["R8_ultimo-umbral"],250,8]
];
// PUA: una insignia por tema (el personaje), ganada con la pieza productiva del tema
var RETOS_PUA = [
  ["A0","Reto «Preséntate a tu tripulación» (vídeo de 60 s)",["E1_nebula"],100,1],
  ["B1","La chispa: imagen con IA (recupera a Bran)",["P1_bran","R1_la-chispa"],300,1],
  ["X1","Actividad 1 entregada",["H2_primera-forja","E2_capitan"],500,1],
  ["B2","El eco que enseña: videotutorial (recupera a Tomás)",["P2_tomas","R2_el-eco-que-ensena"],300,2],
  ["B3","La matriz 8×6 (recupera a Sylla)",["P3_sylla","R3_la-matriz"],300,3],
  ["X2","Actividad 2 entregada",["H3_cartografo"],500,3],
  ["B4","El entorno de aula (recupera a Amara)",["P4_amara","R4_entorno-de-aula"],300,4],
  ["B5","La Bitácora medida (recupera a Vera)",["P5_vera","R5_bitacora-medida"],300,5],
  ["B6","El juego digital (recupera a Joran)",["P6_joran","R6_el-juego"],300,6],
  ["B7","La microgamificación (recupera a Mara)",["P7_mara","R7_microgamificacion"],300,7],
  // v3.41 · el huevo de Pascua: un enlace oculto en la presentación de Vínculo lleva a un
  // enigma; la palabra secreta del final es la evidencia (el formulario la valida solo).
  ["S7","Reto secreto «El Escape UNI»",["E3_vaeon"],150,7],
  ["B8","El último umbral: RA/RV + Bitácora publicada (recupera a Noa)",["P8_noa","R8_ultimo-umbral"],300,8]
];
// BONUS-INICIO · Los genera _build_site.py desde _site_data.py: NO editar a mano.
var BONUS_PLANETA = {"xp": 150, "creditos": 40};
var BONUS_RACHA = [[3, 40], [6, 80], [10, 150]];
var BONUS_TUTORIAL = {"creditos": 30};
var NOTA_MIN_PLANETAS = 4;
var BONUS_SERIE = {"creditos": 40};
var BONUS_ALBUM = {"xp": 300, "creditos": 200};
var BONUS_TRIPULACION = {"fraccion": 0.25, "creditos": 15, "semanas_activo": 4};
var BONUS_PASE = {"creditos": 5, "minutos": 50};
// BONUS-FIN
// 🔴 Los bonus se conceden UNA VEZ y quedan escritos en AJUSTES. No se recalculan: la racha BAJA al
// fallar una semana, y si el bonus se recalculara, quien llego a 6 y luego fallo perderia creditos
// que ya se ha gastado. Lo ganado, ganado.
function planetasCompletos_(retos, tipo) {
  var out = [];
  for (var t = 1; t <= 8; t++) {
    var suyos = retosDe_(tipo).filter(function(r){ return r[4] === t; });
    if (suyos.length && suyos.every(function(r){ return retos[r[0]]; })) out.push(t);
  }
  return out;
}
// Que bonus le tocan y todavia no tiene. Devuelve las claves ("planeta:3", "racha:6").
function bonusPendientes_(retos, tipo, racha, yaTiene) {
  var out = [];
  planetasCompletos_(retos, tipo).forEach(function(t){
    var k = "planeta:" + t; if (!yaTiene[k]) out.push(k);
  });
  BONUS_RACHA.forEach(function(b){
    var k = "racha:" + b[0]; if (racha >= b[0] && !yaTiene[k]) out.push(k);
  });
  return out;
}
function valorBonus_(clave) {
  if (clave.indexOf("planeta:") === 0) return { xp: BONUS_PLANETA.xp || 0, creditos: BONUS_PLANETA.creditos || 0 };
  if (clave === "tutorial") return { xp: 0, creditos: BONUS_TUTORIAL.creditos || 0 };
  if (clave.indexOf("serie:") === 0) return { xp: 0, creditos: BONUS_SERIE.creditos || 0 };
  if (clave === "album") return { xp: BONUS_ALBUM.xp || 0, creditos: BONUS_ALBUM.creditos || 0 };
  if (clave.indexOf("tripulacion:") === 0) return { xp: 0, creditos: bonusTripulacion_().creditos };
  if (clave.indexOf("pase:") === 0) return { xp: 0, creditos: cfgPase_().creditos };
  var m = clave.match(/^racha:(\d+)$/);
  if (m) { var b = BONUS_RACHA.filter(function(x){ return x[0] === Number(m[1]); })[0];
           if (b) return { xp: 0, creditos: b[1] }; }
  return { xp: 0, creditos: 0 };
}
// AYUDA-INICIO · QUE HAY QUE HACER EN CADA RETO. Va dentro del formulario, bajo la casilla de su
// tema, porque un alumno que no sabe que se le pide ESCRIBE UN CORREO. Lo genera _build_site.py
// desde _site_data.py (AYUDA_RETOS): NO editar a mano.
var AYUDA_RETOS = {
 "A0": "Graba un vídeo de MÁXIMO 60 segundos presentándote al resto de la tripulación y publícalo en la sección 📹 «Preséntate» del padlet de la clase (título = tu alias; primera línea = «Capitán: tu profe»). No hace falta guion de cine — si te da apuro, responde a tres o cuatro de estas: ¿quién eres y a qué te dedicas? ¿desde dónde te conectas? ¿por qué educación? ¿una herramienta que ames y una que sufras? ¿un dato curioso que nadie adivinaría? Grábalo del tirón con el móvil: natural gana a perfecto. Después copia el enlace de TU publicación (los tres puntos ⋮ → «Copiar el enlace a la publicación») y pégalo aquí. Sirve para ponernos cara desde el primer día — y NEBULA te da su insignia: lo que se comparte no se apaga.",
 "A1": "Saca del cajón algo que tengas a medias —o que dejaste a medias— tal como está: un recurso, una unidad, una idea que se quedó ahí. Escríbelo aquí mismo, en la caja del reto: qué es, en qué punto se quedó y qué te frenó para terminarlo. Si puedes, añade el enlace al propio archivo (con permiso de lectura). Tu tripulación leerá lo que escribas —y tú lo suyo—: no se corrige ni se puntúa; el único criterio es sacarlo del cajón y compartirlo sin terminar.",
 "A2": "Graba un clip corto (máx. 60 s) explicando un concepto como si se lo contaras a un alumno que hoy no pudo venir a clase. Súbelo donde quieras (YouTube en oculto, Drive con permiso de lectura, el padlet de la clase…) y pega su enlace. Criterio único: que funcione sin ti delante (se entiende solo).",
 "A3": "Crea un artefacto interactivo (un Genially o similar) con una bifurcación: un objetivo de aprendizaje y dos o tres actividades distintas para alcanzarlo, y que cada estudiante elija su sendero al empezar (p. ej. uno que aprende haciendo, otro leyendo, otro escuchando). Pega su enlace. Criterio: que cada sendero sea una actividad de verdad —no la misma con otro nombre— y que todos lleguen a la misma cima.",
 "A4": "Publica en tus redes (X, LinkedIn, Instagram…) una reflexión breve o un recurso del curso con el hashtag #mutecdstargate, en abierto. Vale un hilo corto, una imagen con dos líneas o el enlace a algo que hayas creado. Y guárdate el truco: una reflexión publicada con ese hashtag es evidencia válida también en otros retos de este viaje. Criterio: a tiempo por encima de perfecto — se publica hoy, se pule mañana.",
 "A5": "Elige un objetivo de aprendizaje que ya trabajes y crea una rúbrica para evaluarlo: 3 o 4 criterios, 3 o 4 niveles de logro y, en cada casilla, una descripción observable (qué hace el alumno, no un adjetivo). Compártela en un documento con permiso de lectura (Google Docs, Sheets, CoRubric…) y pega su enlace. Criterio: que otra persona pudiera usarla sin preguntarte — medir para cuidar, no para etiquetar.",
 "A6": "Joran dejó encendido su simulador de entrenamiento: RUTA AZUL, un rival hecho de luz que pregunta por todo lo que llevas recorrido (temas 1 al 5). Entra desde el botón del reto en tu Nave y gánale: no hay nada que entregar, se registra solo al vencerlo. Cómo se pelea: aciertas y eliges golpear o cubrirte; fallas y no pierdes escudo, pierdes tiempo (y esa pregunta vuelve). El rival ataca cada 25 segundos, así que responde sin dormirte. Llevas un kit de un uso: reparar el escudo, sobrecargar tu golpe e interferir su ataque. Cuando esté al 20 % llega el Remate: sin fallos cae de un golpe; con fallos, vuelven en cadena y hay que redimirlas. Si pierdes, vuelve a intentarlo: cada derrota lo cansa y ataca más despacio. Al ganar te llevas la insignia de Joran y el Simulador se queda en tu Nave para repasar tema a tema, con su ranking.",
 "A7": "Toma una tarea rutinaria de tu aula y crea la insignia que la reconoce: diséñala (con Genially, Canva, una IA o a mano) y pega su enlace. Y aquí mismo, en la caja del reto, escribe su «porqué» en 2–4 líneas: cómo se llama, qué acto significativo reconoce y la narrativa que convierte esa tarea en una causa —no un premio por obedecer, sino memoria de algo que importa.",
 "A8": "Busca un recurso de realidad aumentada o virtual QUE YA EXISTA (una app, una experiencia AR, un modelo 3D, un tour virtual…) y pega su enlace. Después, aquí mismo, en la caja del reto, cuenta en 3–4 líneas cómo lo usarías en una clase concreta: qué vería el alumnado, qué haría y qué añade esa «capa» que no da el libro. Aquí no se construye nada: se elige bien — no toda capa se levanta; algunas ya existen y solo esperan a que alguien las traiga al aula.",
 "B1": "Genera con una IA una imagen con finalidad didáctica (ilustración, organizador gráfico o infografía) para un nivel y tema que elijas. Requisitos mínimos: (1) prompt estructurado siguiendo un modelo tipo CRAFT/RITA (contexto educativo + tipo de imagen + finalidad); (2) al menos una iteración del prompt; (3) selección final con criterio docente justificada en 2–3 líneas; (4) evidencia del proceso (enlace al chat o capturas) y cita de la herramienta. El enlace puede ser un Google Doc con permiso de lectura para todos o una entrada de tu ePortfolio con la imagen, el prompt y tus criterios. Es la tabla técnica de la Actividad 1: guárdala, ya tienes hecho su núcleo.",
 "B2": "Crea un videotutorial de calidad (guion + grabación de pantalla + edición) sobre un procedimiento de tu área, y enriquécelo con 2–3 preguntas insertadas (videoquiz) para comprobar comprensión. Piénsalo para aula invertida. Pega su enlace y escribe aquí mismo, en la caja del reto, una reflexión breve: qué objetivo didáctico cubre y qué aprendiste al hacerlo (llévala también a tu Bitácora).",
 "B3": "Construye la matriz de programación de un paisaje de aprendizaje: una tabla de doble entrada que cruza las 8 inteligencias múltiples × 6 niveles de Bloom (48 casillas). Contextualiza una unidad didáctica real (nivel, área, objetivos) y rellena al menos 6 cruces variados en complejidad y en talento, con una actividad en cada uno (objetivo, tarea del alumno, recurso, evaluación, tiempo, tipo: obligatoria/optativa/voluntaria). Es el corazón de planificación de la Actividad 2.",
 "B4": "Monta tu aula virtual (Google Classroom, Moodle, Teams…): crea el aula, publica al menos una tarea o un material para tu alumnado y deja funcionando el canal de feedback y comunicación (tablón, comentarios, anuncios). Comparte un Google Doc con permiso de lectura con al menos 2 capturas de pantalla de tu aula y pega su enlace. Y aquí mismo, en la caja del reto, tu reflexión breve: cómo llega tu contenido al móvil del alumno y cómo mantienes la conversación viva. (La web de recursos es el reto del tema 5: aquí montas el AULA.)",
 "B5": "Monta el centro de recursos de tu alumnado: una web (Google Sites o un Genially) con al menos 3 recursos organizados con criterio (por unidad o por tipo), navegación clara y una página de cómo se evalúa, con tu rúbrica del reto anterior a la vista. Es el ESCAPARATE, distinto del aula virtual del tema 4: aquí el estudiante encuentra todo sin tener que pedirlo. Pega su enlace y enlázala desde tu ePortfolio (una entrada con evidencia → contexto → reflexión). Esta semana además cierras la Actividad 1 dentro de la Bitácora.",
 "B6": "Adapta un juego existente o crea uno digital a medida para un objetivo concreto de tu aula, algo más elaborado que un quiz suelto: con varios niveles de dificultad o varias formas de jugarlo (ruleta + preguntas, un escape por fases, un tablero con caminos…). En ABJ el juego ES la actividad: cada mecánica debe servir a un aprendizaje. Pega el enlace al juego y escribe aquí mismo, en la caja del reto, tu reflexión: qué objetivo cubre, qué cambia de un nivel a otro y cómo lo evalúas (y súbelo a tu Bitácora).",
 "B7": "Diseña una microgamificación de calidad: un toque de juego sobre una tarea que no es un juego y, sobre todo, la capa narrativa que la envuelve: quién es el alumnado en esa historia, qué misión tiene y por qué importa (una insignia, una barra de progreso o un tablero, pero dentro de un relato). Distíngue bien de ABJ: aquí no se juega, se toman elementos del juego para enganchar. Pega el enlace al recurso y escribe aquí mismo, en la caja del reto, tu reflexión: qué conducta refuerza, qué historia la envuelve y por qué (y súbelo a tu Bitácora).",
 "B8": "(1) Crea una experiencia de Realidad Aumentada o Virtual para tu materia: puede ser tan sencilla como un código QR que abre un modelo 3D o un vídeo sobre una lámina, o tan elaborada como una escena VR para practicar sin riesgo. Puede ser tu reto libre del ePortfolio. (2) Termina y publica la Bitácora: convierte tu paisaje de aprendizaje (Act 2) en una imagen interactiva publicada, revisa que las 5 páginas estén completas (Act 1, Act 2, videotutorial, microgamificación, reto libre) y pega el enlace único.",
 "S7": "🗝️ Hay una sala de la que no se sale sin pensar: el Escape UNI. Entra, resuelve sus enigmas y, al final, pulsa el botón que te espera: el reto se registra solo en tu Nave. Nadie va a darte las respuestas: los secretos de la gamificación se encuentran jugando.",
 "X1": "La Actividad 1 entregada donde te la pide tu profesor. Pulsa «Lo he hecho» cuando la hayas ENVIADO, no cuando la empieces, y pega el enlace o los enlaces que compartiste en tu actividad (es obligatorio; el «+» añade un segundo).",
 "X2": "La Actividad 2 entregada donde te la pide tu profesor. Igual: al ENVIARLA, y pega el enlace o los enlaces que compartiste en tu actividad (es obligatorio; el «+» añade un segundo)."
};
// AYUDA-FIN
// v3.19 · QUE HAY QUE HACER, DENTRO DEL FORMULARIO. Un alumno que no sabe que se le pide escribe un
// correo, y ese correo lo paga el profesorado. Google Forms no deja poner ayuda por opcion, asi que
// las lineas de los retos del tema se juntan bajo su casilla.
function ayudaDeTema_(o, t) {
  var L = ["Marca SOLO lo que ya has TERMINADO. Puedes volver a este formulario y añadir más cuando lo tengas: nunca se borra lo de antes."];
  retosDe_(o.tipo).forEach(function(r){
    if (r[4] !== t) return;
    var a = AYUDA_RETOS[r[0]] || "";
    L.push("\u25B8 " + r[1] + (a ? "\n   " + a : ""));
  });
  L.push("¿Sigues con dudas? Está todo explicado en tu Nave: " + WEB + "recluta.html?per=" + o.id);
  return L.join("\n\n");
}
// Una casilla por tema, pero el enlace de evidencia va APARTE en cada seccion y con nombre propio:
// si todas se llamaran igual, la hoja de respuestas tendria nueve columnas con el mismo titulo y
// leerFila_ (que indexa por nombre) se quedaria solo con la ultima.
var EVIDENCIA_PREF = "Enlace \u00b7 ";
function tituloEvidencia_(t) { return EVIDENCIA_PREF + (t >= 1 && t <= 8 ? "Tema " + t : "Batalla final"); }
var AYUDA_EVIDENCIA = "Pega el enlace de lo que acabas de marcar: tu Bitácora, el documento, el juego… " +
  "Ábrelo primero en una ventana de incógnito: si pide permiso para abrirse, tu profe no lo va a poder ver " +
  "y no cuenta. Si marcas varias cosas a la vez, vale el enlace de tu Bitácora.";
// ================= v3.37 · UNA PREGUNTA POR RETO =================
// Petición de Norberto (29-ago). Hasta hoy cada tema era UNA casilla con todos sus retos dentro y UN
// solo enlace de evidencia para lo que marcaras. Problemas: el enunciado del reto no se veía (estaba
// apelotonado en la ayuda de la casilla) y la evidencia no se sabía de cuál era.
//
// Ahora cada reto es su propio bloque: título = el reto, ayuda = su enunciado, una casilla de
// «lo he completado» y SU enlace debajo.
//
// 🔴 El título de cada pregunta es la COLUMNA de la hoja de respuestas, así que estos dos nombres son
// contrato con el lector (`marcados_` y `registrarEventos_`): no se tocan a la ligera.
var OPC_HECHO = "\u2705 Lo he completado";
function tituloEvidenciaReto_(r) { return EVIDENCIA_PREF + r[1]; }
// «Planeta 3 · Sendara» en vez de «Tema 3 · Sendara»: en el juego son planetas, y el alumnado elige
// por el nombre del planeta, no por un número de tema que solo existe en la guía docente.
function tituloPlaneta_(t) { return t >= 1 && t <= 8 ? "Planeta " + t + " \u00b7 " + TEMAS[t][0] : "La batalla final"; }
function ayudaReto_(r) {
  var a = AYUDA_RETOS[r[0]] || "";
  var premio = r[3] ? "Da " + r[3] + " xp." : "";
  return (a ? a + "\n\n" : "") + (premio ? premio + " " : "") +
    "Marca la casilla SOLO cuando lo hayas TERMINADO. Puedes volver cuando quieras: lo de antes nunca se borra.";
}
// ================= v3.38 · LA EVIDENCIA, EXPLICADA POR TIPO DE RETO =================
// Petición de Norberto (30-ago): nada de un texto genérico — cada reto dice LA FORMA MÁS FÁCIL de
// compartir SU producto. Un reto de foro pide el enlace directo al mensaje (o captura a Drive
// compartido / postimages / la Bitácora); un juego o un vídeo publicado piden su propio enlace con
// la prueba del incógnito. El tipo se asigna a mano aquí; la batería 27 vigila que ningún reto de
// ningún catálogo se quede sin tipo, y que cada tipo tenga su texto.
// 30-ago · PADLET (petición de Norberto): los retos cuyo artefacto LUCE en un muro de clase pasan
// a tipo "padlet" — la imagen con IA (B1), la mecánica jugable (A6) y la insignia diseñada (A7).
// Los de texto ofrecen el padlet como alternativa y los de enlace lo sugieren como escaparate;
// foro y Actividades quedan como están (decisión explícita del usuario).
// v3.41 · la palabra del huevo de Pascua. El formulario la exige en la evidencia de S7 (validación
// del propio Google Forms, sin servidor). Es el nombre que Vaeon borró — la carta S1 del álbum.
var PALABRA_HUEVO = "ANDER";
var EVIDENCIA_TIPO = { A0:"padlet", A1:"foro", A2:"foro", A3:"texto", A4:"redes", A5:"texto", A6:"padlet",
  A7:"padlet", A8:"texto", B1:"padlet", B2:"enlace", B3:"documento", B4:"enlace", B5:"bitacora",
  B6:"enlace", B7:"enlace", B8:"enlace", X1:"actividad", X2:"actividad", S7:"secreto" };
var EVIDENCIA_TEXTOS = {
  foro: "Tu reto vive en el foro de UNIR: lo más fácil es pegar aquí el ENLACE DIRECTO a tu mensaje " +
    "(ábrelo en el foro y copia la URL de la barra). ¿El foro no te da enlace? Vale una captura subida " +
    "a una carpeta compartida de Drive o a postimages.org — o pégala en tu Bitácora y enlaza la Bitácora.",
  texto: "Es un reto de escribir: ponlo en tu Bitácora (o en el foro de UNIR) y pega aquí ese enlace " +
    "— si tu Bitácora es un Genially, marca «Compartir desde esta página» al copiar el enlace y se " +
    "abrirá justo por este reto. También vale una captura subida a Drive compartido o a postimages.org.",
  enlace: "Esto se comparte con su PROPIO enlace publicado: pégalo aquí tal cual. Ábrelo antes en una " +
    "ventana de incógnito: si pide permiso para abrirse, tu profe no lo va a poder ver y no cuenta.",
  documento: "Pega el enlace del documento (Drive/Docs) compartido en modo «cualquiera con el enlace " +
    "puede ver». Compruébalo en una ventana de incógnito: si pide permiso, no cuenta.",
  proceso: "Vale el enlace al chat con la IA (compártelo desde la propia herramienta) o unas capturas " +
    "del proceso subidas a Drive compartido o a postimages.org. Si ya lo tienes todo en tu Bitácora, " +
    "enlaza la Bitácora.",
  bitacora: "La prueba ES tu Bitácora: pega aquí su enlace público. Truco de Genially: al compartir, " +
    "marca «Compartir desde esta página» y el enlace abrirá JUSTO la página de este reto. " +
    "Ábrelo en una ventana de incógnito: si pide permiso, tu profe no lo verá.",
  // 30-ago · Norberto: las Actividades NO piden enlace — ya se suben a la plataforma de UNIR y el
  // profesorado las ve allí. Pedir evidencia de algo ya entregado solo genera dudas.
  actividad: "No hace falta enlace: la Actividad ya la entregas en la plataforma de UNIR y tu profe " +
    "la corrige allí. Marca la casilla y listo — puedes dejar esto vacío.",
  redes: "Pega el ENLACE DIRECTO a tu publicación con #mutecdstargate (ábrela y copia su URL). " +
    "Si tu perfil es privado, vale una captura subida a Drive compartido o a postimages.org.",
  secreto: "Escribe aquí la PALABRA SECRETA exacta que te da el enigma al resolverlo — no un enlace. " +
    "Sin la palabra correcta, el formulario no la acepta: así de celoso es Vaeon con su nombre."
  ,padlet_sin_url: "Compártelo en tu Bitácora (o una captura en Drive compartido / postimages.org) y " +
    "pega aquí el enlace. Si tu clase tiene padlet, aún mejor: publícalo allí y pega el enlace de tu publicación."
};
// La ayuda de la evidencia depende del reto Y del padlet del grupo. Con padlet configurado, los
// retos "padlet" mandan allí (y piden el enlace de TU publicación), los de texto lo ofrecen como
// alternativa y los de enlace lo sugieren como escaparate. Sin padlet, cada uno cae a su plan B.
function ayudaEvidenciaReto_(r, padletUrl) {
  var tipo = EVIDENCIA_TIPO[r[0]] || "";
  var u = String(padletUrl || "").trim();
  if (tipo === "padlet") {
    if (!u) return EVIDENCIA_TEXTOS.padlet_sin_url;
    return "Este reto luce en el PADLET de la clase: publica allí tu creación (la imagen, el vídeo o una " +
      "captura + una línea contando cómo lo hiciste) en SU sección, con este formato: TÍTULO = tu alias, " +
      "y en la primera línea «Capitán: (tu profe)». Después pega aquí el enlace de TU publicación " +
      "(ábrela en el padlet y copia su enlace). Así toda la clase se inspira. El padlet: " + u;
  }
  var base = EVIDENCIA_TEXTOS[tipo] || AYUDA_EVIDENCIA_RETO;
  if (u && tipo === "texto")
    base += " Y si lo publicas en el padlet de la clase (" + u + "), pega el enlace de tu publicación: tus compañeros lo verán.";
  if (u && tipo === "enlace")
    base += " ¿Quieres que lo vea la clase? Cuélgalo también en el padlet: " + u;
  return base;
}
var AYUDA_EVIDENCIA_RETO = "Pega el enlace de ESTE reto (tu Bitácora, el documento, el vídeo, el juego…). " +
  "Ábrelo antes en una ventana de inc\u00f3gnito: si pide permiso para abrirse, tu profe no lo va a poder ver y no cuenta.";

// El enlace GENÉRICO de este envío: el de las columnas «Enlace - Tema N», que es como se pedía antes
// de la reforma del 29-ago (un enlace por planeta, valía para todo lo que marcaras en él).
// 🔴 Los enlaces POR RETO empiezan por el mismo prefijo, así que hay que excluirlos: si se colaran,
// el enlace de UN reto se copiaría como evidencia de todos los demás del mismo envío.
function evidenciaDe_(r) {
  var out = "";
  Object.keys(r).forEach(function(k){
    if (k.indexOf(EVIDENCIA_PREF) !== 0) return;
    var resto = k.substring(EVIDENCIA_PREF.length);
    if (!/^(Tema \d|Batalla final)$/.test(resto)) return;
    if (String(r[k] || "").trim()) out = String(r[k]).trim();
  });
  return out;
}
var XP_RECLUTAMIENTO = 100;
var DERIVADAS = [   // [insignia, xp, requisitos] · los créditos salen de CREDITOS.derivada
  ["H4_tripulacion-cero",300,["P1_bran","P2_tomas","P3_sylla","P4_amara","P5_vera","P6_joran","P7_mara","P8_noa"]],
  ["H5_la-liberacion",300,["R8_ultimo-umbral","H2_primera-forja","H3_cartografo"]]
];
var TEMAS = [null,
  ["Fôrge","Creación de contenido multimedia","p1_forge"],["Ecos","El vídeo como recurso","p2_ecos"],
  ["Sendara","Contenidos interactivos","p3_sendara"],["Reliae","M-learning","p4_reliae"],
  ["Umbral","Evaluación y ePortfolio","p5_umbral"],["Ludo","Aprendizaje Basado en el Juego","p6_ludo"],
  ["Vínculo","Gamificación","p7_vinculo"],["Liminar","Realidad Aumentada y Virtual","p8_liminar"]];
var WEB = "https://stargate.mistercuarter.es/";
// 🔴 El CDN de Hostinger cachea las imagenes SIETE DIAS (cache-control: max-age=604800). Al
// regenerar la lamina de personajes el 27-ago, el fichero nuevo ya estaba en el servidor pero el
// CDN seguia sirviendo el viejo — y este script se lo tragaba, asi que los formularios habrian
// seguido con la imagen desfasada una semana entera. Con un parametro que cambia en cada descarga,
// el CDN no puede devolver su copia. Son descargas puntuales (crear PER, actualizar imagenes), asi
// que saltarse la cache aqui no cuesta nada.
function sinCache_(url) { return url + (url.indexOf("?") >= 0 ? "&" : "?") + "t=" + new Date().getTime(); }
// NIVELES-INICIO · dos monedas: los XP SOLO SUBEN (dan nivel y evolución del avatar) y los
// CRÉDITOS son lo único que se gasta. Lo genera web-stargate/_build_site.py desde _site_data.py.
var MONEDA = "◈";
var RANGOS = ["Recluta", "Cadete", "Oficial", "Comandante", "Leyenda"];
var NIVELES = [   // [nivel, xp REGULAR, rango de arte 1-5, titulo]
  [1,0,1,"Recluta raso"],
  [2,300,1,"Recluta de guardia"],
  [3,700,2,"Cadete"],
  [4,1150,2,"Cadete de vuelo"],
  [5,1650,3,"Oficial"],
  [6,2200,3,"Oficial de puente"],
  [7,2800,3,"Oficial mayor"],
  [8,3450,4,"Comandante"],
  [9,4150,4,"Comandante de flota"],
  [10,5000,5,"Leyenda de la Cero"]
];
var XP_VIAJE = {"REGULAR": 4750, "PUA": 4350};
var CREDITOS = {"reclutamiento": 20, "retoA": 20, "retoB": 50, "retoB_pua": 55, "actividad": 100, "final": 100, "derivada": 60};
// Calendario del PER: los formularios abren el primer dia de la semana 1, el registro
// de misiones cierra al acabar la ultima semana y el canje aguanta una semana mas.
// Generado desde _site_data.py: no editar a mano.
var SEMANAS_PER = {"REGULAR": 15, "PUA": 8};
// Primera semana en que se abre cada tema. Generado desde el CRONO de la web: no editar a mano.
var SEMANA_DEL_TEMA = {"1": 1, "2": 3, "3": 5, "4": 7, "5": 9, "6": 10, "7": 11, "8": 13};
var SEMANAS_CANJE_EXTRA = 1;
// La semana en que se abre el ARSENAL DE BATALLA (recompensas de nota).
var SEMANA_ARSENAL = 15;
var DIAS_APERTURA_ANTES = 0;
// Insignia por serie completa. [clave, titulo de la serie tal y como aparece en CROMOS, nombre]
var SERIES_ALBUM = [
  ["A1_tripulacion","Serie I · La Tripulación Cero","La Tripulación Cero al completo"],
  ["A2_ecos","Serie II · Los Ecos","Los Ecos al completo"],
  ["A3_nave","Serie III · La Nave","La Nave al completo"],
  ["A4_sombra","Serie IV · La Sombra","La Sombra al completo"],
  ["A5_caida","Serie V · La caída de Vaeon","La caída de Vaeon al completo"]
];
// NIVELES-FIN
// ESCUADRONES-INICIO · [clave, nombre, lema, de quién sale]. Un escuadrón por docente. El
// estudiante NO elige escuadrón: elige COMANDANTE, que es lo único que conoce el primer día.
// Lo genera web-stargate/_build_site.py desde _site_data.py: NO editar a mano.
var ESCUADRONES = [
  ["esc_yunques", "Los Yunques", "Lo que se forja, aguanta.", "Bran Okafor · Fôrge"],
  ["esc_eco_largo", "Eco Largo", "Si ves esto, es que hoy no llegué a contártelo yo.", "Tomás Reyer · Ecos"],
  ["esc_cartografos", "Los Cartógrafos", "Dos senderos, una misma cima.", "Sylla Bren · Sendara"],
  ["esc_senal", "Señal Abierta", "A tiempo por encima de perfecto.", "Amara Sol · Reliae"],
  ["esc_faro", "Faro Umbral", "Medir es mirar con método a alguien que te importa.", "Vera Khal · Umbral"],
  ["esc_ruta_azul", "Ruta Azul", "Esta ya la hemos ganado cien veces.", "Joran Pike · Ludo"],
  ["esc_porques", "Los Porqués", "Una orden mueve cuerpos. Un porqué mueve personas.", "Mara Voss · Vínculo"],
  ["esc_capa", "Capa Liminar", "Un aula que aprende a hablar de sí misma.", "Noa Lieth · Liminar"],
  ["esc_copistas", "Los Copistas", "Cuarenta manos, un mismo trazo.", "Los Copistas de Fôrge"],
  ["esc_guardia", "Guardia Cero", "Que conste que nadie nos obligó. Elegimos.", "La Tripulación Cero"]
];
// ESCUADRONES-FIN
// RECOMPENSAS-INICIO · [nombre, coste en créditos, máx por alumno, descripción, desde (semana
// REGULAR; en PUA se escala), tipo]. Generado desde _site_data.py: no editar a mano.
var RECOMPENSAS_INICIALES = [
  ["Sobre de cromos",15,99,"TRES cartas al azar de las 26 del álbum (5 series). Los tripulantes son comunes; los Ecos, NEBULA y el Capitán, raros; el Recluta y la Estática, épicos; y dos LEGENDARIOS: el General Vaeon y Ander Vaeon, la identidad del villano. La serie V cuenta la caída de Vaeon, de niño a general.",2,"cromo"],
  ["Cambiar 3 repetidos por un sobre",0,99,"¿Cartas repetidas? Cámbialas. Por cada 3 repetidas te llevas un sobre nuevo, gratis. No cuesta créditos y se comprueba solo: si no llegas a 3, se te avisa y no pierdes nada.",2,"cromo_repes"],
  ["Título de recluta",40,3,"Un título narrativo bajo tu alias en el tablero y la Nave. Lo eliges tú en Mi botín.",4,"titulo"],
  ["Fondo de ficha: tu planeta",35,1,"Tu ficha de la Nave con el planeta que elijas de fondo. Eliges cuál de los ocho en Mi botín.",4,"fondo"],
  ["Marco dorado del avatar",60,1,"Tu avatar con marco y brillo dorados en el ranking y la Nave. Te lo pones (y te lo quitas) en Mi botín.",4,"marco"],
  ["Cápsula de rescate",60,99,"Una cápsula de rescate llega a tu Nave con UN héroe de la Rebelión dentro, al azar: 30 figuras en tres rangos. ⚔️ La Resistencia (56%): el grueso del ejército. 🔥 La Vanguardia (36%): van por delante, cuesta alcanzarlas. 🌟 Los MITOS (8%, ni uno de cada doce): ni siquiera se dejan ver hasta que caen. Se acumulan —cuantos más tengas, más donde elegir— y te los pones gratis desde tu Nave. ¿Repetido? Con 2 repetidos, uno nuevo al azar.",3,"heroe"],
  ["Sobre grande",25,99,"CINCO cartas al azar del álbum (en vez de tres), con las mismas probabilidades que el sobre de siempre: más cartas por cada crédito.",4,"sobre_grande"],
  ["Sobre de raras",35,99,"TRES cartas donde las comunes casi desaparecen: rara 64%, épica 18%, legendaria 6% (y común solo 12%). Para cerrar las series difíciles.",6,"sobre_raro"],
  ["Sobre épico",60,99,"TRES cartas y ninguna común: rara 45%, épica 39% y LEGENDARIA 16% en cada carta, cuatro veces más que en el sobre de siempre.",7,"sobre_epico"],
  ["Cápsula de élite",140,99,"En esta cápsula no viaja la Resistencia: un héroe de la Vanguardia (69%) o un MITO (31%, casi cuatro veces más que en la de rescate).",7,"capsula_elite"],
  ["Cápsula legendaria",320,99,"Un MITO seguro: uno de los héroes legendarios de la Rebelión, siempre. La cápsula más cara del hangar, y también la que tu docente puede esconder en una presentación o darte de premio.",7,"capsula_legendaria"],
  ["Subir 0,5 en un entregable",550,1,"⚔️ ARSENAL DE BATALLA · Medio punto más en una actividad ya entregada y corregida. 🔴 LEE ESTO ANTES: si ya tienes la nota máxima de evaluación continua, esto NO te sube nada — estarías tirando 550 créditos a la basura. Comprueba tu nota primero. Con esos créditos cierras media docena de sobres o te llevas nueve héroes.",15,"nota"],
  ["Subir 1 punto en un entregable",850,1,"⚔️ ARSENAL DE BATALLA · Un punto entero en una actividad ya entregada y corregida. 🔴 LEE ESTO ANTES: si ya tienes la nota máxima de evaluación continua, no te sube nada y pierdes los 850 créditos. Es la recompensa más cara del catálogo a propósito: elegirla significa renunciar a casi todo lo demás.",15,"nota"],
  ["Recalificar un trabajo entregado fuera de plazo",700,1,"⚔️ ARSENAL DE BATALLA · Que se te corrija un trabajo que entregaste tarde. No es un aprobado automático: es que se mire y se puntúe como si hubiera llegado a tiempo.",15,"nota"],
  ["Recalificar un suspenso",950,1,"⚔️ ARSENAL DE BATALLA · Una segunda oportunidad sobre un trabajo suspenso: lo rehaces y se vuelve a corregir. Pensada para quien ha trabajado y se le atragantó una entrega.",15,"nota"]
];
// RECOMPENSAS-FIN

// SORTEOS-INICIO · El Gran Sorteo (14-sep). [id, premio, descripción, ganadores, coste ◈ de la
// participación, máx por persona, desde semana (venta), semana del sorteo, imagen]. Lo REGENERA
// _build_site.py desde SORTEOS de _site_data.py — no editar a mano. Solo lo usa el motor nuevo.
var SORTEOS = [
  ["sorteo1","Licencia de Genially (un año completo)","Se sortean dos licencias de Genially de un año completo entre toda la tripulación. Cada participación es una papeleta: cuantas más tengas, más posibilidades. Como en una lotería, lo que pagas no se devuelve: si te toca, enhorabuena. Se sortea SOLO en la semana 16 (la del canje); ese día, al entrar en tu Nave, verás el resultado. Nadie gana dos.",2,20,0,6,16,"sorteo.jpg"]
];
// SORTEOS-FIN

// COFRES-INICIO · Los sobres y las cápsulas (14-sep): cuántas piezas trae cada tipo y cuánto pesa
// cada rareza (× sobre el peso del catálogo; 0 = no sale). Lo REGENERA _build_site.py desde COFRES de
// _site_data.py — no editar a mano. Solo lo usa el motor nuevo (motor/paquete.js).
var COFRES = {"cromo": {"piezas": "cromos", "usos": 3}, "sobre_grande": {"piezas": "cromos", "usos": 5}, "sobre_raro": {"piezas": "cromos", "usos": 3, "pesos": {"común": 0.25, "rara": 2, "épica": 2, "legendaria": 1.5}}, "sobre_epico": {"piezas": "cromos", "usos": 3, "pesos": {"común": 0, "rara": 1, "épica": 3, "legendaria": 3}}, "heroe": {"piezas": "heroes", "usos": 1}, "capsula_elite": {"piezas": "heroes", "usos": 1, "pesos": {"rara": 0, "épica": 1, "legendaria": 2}}, "capsula_legendaria": {"piezas": "heroes", "usos": 1, "pesos": {"rara": 0, "épica": 0, "legendaria": 1}}};
// COFRES-FIN

// La imagen que enseña el formulario de canje ANTES de confirmar cada recompensa: se ve lo que te
// llevas por tus créditos. Se empareja por NOMBRE con el catálogo y lo REGENERA _build_site.py desde
// IMG_RECOMPENSA de _site_data.py — no editar a mano. Si una recompensa no está aquí (porque el
// profesorado la renombró en la hoja), su sección sale sin imagen y el formulario sigue funcionando.
var IMG_RECOMPENSA = {
  "Sobre de cromos": "sobre.jpg",
  "Cambiar 3 repetidos por un sobre": "repetidos.jpg",
  "Título de recluta": "titulo.jpg",
  "Fondo de ficha: tu planeta": "planeta.jpg",
  "Marco dorado del avatar": "marco.jpg",
  "Cápsula de rescate": "capsula_rescate.jpg",
  "Sobre grande": "sobre_grande.jpg",
  "Sobre de raras": "sobre_raro.jpg",
  "Sobre épico": "sobre_epico.jpg",
  "Cápsula de élite": "capsula_elite.jpg",
  "Cápsula legendaria": "capsula_legendaria.jpg",
  "Subir 0,5 en un entregable": "nota_05.jpg",
  "Subir 1 punto en un entregable": "nota_1punto.jpg",
  "Recalificar un trabajo entregado fuera de plazo": "nota_plazo.jpg",
  "Recalificar un suspenso": "nota_suspenso.jpg"
};
// IMG-RECOMPENSA-FIN

// Nivel (1-10) y rango de arte (1-5) a partir de los xp. En PUA los umbrales se escalan por el
// total del viaje, para que el camino se sienta igual de largo.
function escalaXP_(tipo) { var r = XP_VIAJE.REGULAR || 1; return (XP_VIAJE[tipo] || r) / r; }
function nivelDe_(xp, tipo) { var k = escalaXP_(tipo), n = 1;
  for (var i = 0; i < NIVELES.length; i++) if (xp >= NIVELES[i][1] * k) n = NIVELES[i][0];
  return n; }
function nivelInfo_(xp, tipo) { var n = nivelDe_(xp, tipo), f = NIVELES[n-1], k = escalaXP_(tipo);
  var sig = n < NIVELES.length ? Math.round(NIVELES[n][1] * k) : null;
  return { nivel:n, rango:f[2], rangoNombre:RANGOS[f[2]-1], titulo:f[3], siguiente:sig,
           faltan: sig === null ? 0 : Math.max(0, sig - xp) }; }
// Créditos que da cada logro (el xp lo sigue fijando la tabla de retos de arriba)
function creditosDe_(id, tipo) {
  if (id === "H1") return CREDITOS.reclutamiento || 0;
  var c = String(id).charAt(0);
  if (id === "XF") return CREDITOS.final || 0;
  if (c === "X") return CREDITOS.actividad || 0;
  if (c === "A" || c === "S") return CREDITOS.retoA || 0;
  if (c === "B") return (tipo === "PUA" ? CREDITOS.retoB_pua : CREDITOS.retoB) || 0;
  return 0;
}
var H = { PERS:"PERs", REC:"RECOMPENSAS", EV:"EVENTOS", AJ:"AJUSTES", DATOS:"DATOS", RES:"RESUMEN", DOC:"DOCENTES",
          CONS:"CONSENTIMIENTO",
          // v3.36 · ALUMNADO: la vista operativa de las personas, con nombre y correo. No confundir
          // con DATOS/RESUMEN, que son las de investigacion y salen seudonimizadas a proposito.
          ALU:"ALUMNADO",
          // v3.36 · el archivo. Al archivar un PER sus registros se MUDAN aqui: EVENTOS y AJUSTES
          // se quedan solo con los grupos vivos, y el historico sigue entero y consultable.
          EVA:"EVENTOS ARCHIVADOS", AJA:"AJUSTES ARCHIVADOS" };
// v3.16 · los SIETE personajes se eligen al alistarse. Los 5-7 eran "exclusivos" de pago, pero
// eran personas normales y nadie paga por eso: quien quiera algo especial va al vestuario de heroes.
var AVATARES_INICIALES = 7;
// HEROES-INICIO · [clave, nombre, peso, rareza]. Los pesos suman 100. Lo genera
// web-stargate/_build_site.py desde _site_data.py (HEROES): NO editar a mano.
var HEROES = [
  ["H01_custodio","Custodio de Fôrge",3,"épica"],
  ["H02_custodia","Custodia de Fôrge",3,"épica"],
  ["H03_xeno","Xeno de Liminar",4,"rara"],
  ["H04_xena","Xena de Liminar",4,"rara"],
  ["H05_eco","Eco de la Cero",3,"épica"],
  ["H06_eca","Eca de la Cero",3,"épica"],
  ["H07_tejedor","Tejedor de Sendara",4,"rara"],
  ["H08_tejedora","Tejedora de Sendara",4,"rara"],
  ["H09_pregonero","El Pregonero de Ecos",4,"rara"],
  ["H10_pregonera","La Pregonera de Ecos",4,"rara"],
  ["H11_emisario","El Emisario de Reliae",4,"rara"],
  ["H12_emisaria","La Emisaria de Reliae",4,"rara"],
  ["H13_agrimensor","El Agrimensor de Umbral",3,"épica"],
  ["H14_agrimensora","La Agrimensora de Umbral",3,"épica"],
  ["H15_croupier","El Croupier de Ludo",4,"rara"],
  ["H16_croupiera","La Croupier de Ludo",4,"rara"],
  ["H17_abanderado","El Abanderado de Vínculo",3,"épica"],
  ["H18_abanderada","La Abanderada de Vínculo",3,"épica"],
  ["H19_relojero","El Relojero de la Cero",3,"épica"],
  ["H20_relojera","La Relojera de la Cero",3,"épica"],
  ["H21_cartografo","El Cartógrafo de lo que no existe",3,"épica"],
  ["H22_cartografa","La Cartógrafa de lo que no existe",3,"épica"],
  ["H23_bardo","El Último Bardo",4,"rara"],
  ["H24_juglar","La Última Juglar",4,"rara"],
  ["H27_silencioso","El Silencioso de Fôrge",4,"rara"],
  ["H28_silenciosa","La Silenciosa de Fôrge",4,"rara"],
  ["H25_desertor","El Desertor de la Estática",2,"LEGENDARIA"],
  ["H26_desertora","La Desertora de la Estática",2,"LEGENDARIA"],
  ["H29_heredero","Heredero de la Sombra",2,"LEGENDARIA"],
  ["H30_heredera","Heredera de la Sombra",2,"LEGENDARIA"]
];
// HEROES-FIN
// Un h\u00e9roe al azar de los que NO tiene todav\u00eda. Sin repetidos a prop\u00f3sito: repetir un h\u00e9roe no
// aporta nada (no hay album que completar con duplicados) y frustra; que no repita mantiene el
// picoteo hasta el final. Devuelve null cuando ya los tiene todos.
function esHeroe_(clave) {
  for (var i = 0; i < HEROES.length; i++) if (HEROES[i][0] === clave) return true;
  return false;
}
function sortearHeroe_(yaTiene) {
  var tengo = {}; (yaTiene || []).forEach(function(k){ tengo[k] = true; });
  var bolsa = [];
  HEROES.forEach(function(h, i){ if (!tengo[h[0]]) for (var w = 0; w < h[2]; w++) bolsa.push(i); });
  if (!bolsa.length) return null;
  return HEROES[bolsa[Math.floor(Math.random() * bolsa.length)]];
}
// La skin es el tramo de arte del personaje propio (1-5). Se desbloquea POR NIVEL: son las mismas
// cinco versiones de siempre, pero ahora se ELIGEN en vez de imponerse. rangoDe_ dice cual es la
// mas alta disponible con esos xp.
function skinsDe_(xp, tipo) {
  var alto = nivelInfo_(xp, tipo).rango, out = [];
  for (var r = 1; r <= alto; r++) out.push(r);
  return out;
}
// CROMOS-INICIO · [clave de carta, nombre, peso, rareza, serie]. Los pesos suman 100.
// Lo genera web-stargate/_build_site.py desde _site_data.py (CROMOS): NO editar a mano.
var CROMOS = [
  ["P1_bran","Bran Okafor",5,"común","Serie I · La Tripulación Cero"],
  ["P2_tomas","Tomás Reyer",5,"común","Serie I · La Tripulación Cero"],
  ["P3_sylla","Sylla Bren",5,"común","Serie I · La Tripulación Cero"],
  ["P4_amara","Amara Sol",5,"común","Serie I · La Tripulación Cero"],
  ["P5_vera","Vera Khal",5,"común","Serie I · La Tripulación Cero"],
  ["P6_joran","Joran Pike",5,"común","Serie I · La Tripulación Cero"],
  ["P7_mara","Mara Voss",5,"común","Serie I · La Tripulación Cero"],
  ["P8_noa","Noa Lieth",5,"común","Serie I · La Tripulación Cero"],
  ["L1_lena","Lena Reyer",3,"rara","Serie II · Los Ecos"],
  ["L2_kel","Kel Bren",3,"rara","Serie II · Los Ecos"],
  ["L3_copistas","Los Copistas de Fôrge",3,"rara","Serie II · Los Ecos"],
  ["L4_ilan","Ilan Kesh",3,"rara","Serie II · Los Ecos"],
  ["L5_ruta_azul","Los Niños de la Ruta Azul",3,"rara","Serie II · Los Ecos"],
  ["L6_oren","Oren Vash",3,"rara","Serie II · Los Ecos"],
  ["E1_nebula","NEBULA",5,"rara","Serie III · La Nave"],
  ["E2_capitan","El Capitán",5,"rara","Serie III · La Nave"],
  ["N1_recluta","El Recluta",3,"épica","Serie III · La Nave"],
  ["S2_estatica","La Estática",4,"épica","Serie IV · La Sombra"],
  ["E3_vaeon","General Vaeon",2,"LEGENDARIA","Serie IV · La Sombra"],
  ["S1_ander","Ander Vaeon",1,"LEGENDARIA","Serie IV · La Sombra"],
  ["V1_nino","Ander, el niño que preguntaba",6,"común","Serie V · La caída de Vaeon"],
  ["V2_aprendiz","Ander, el aprendiz",5,"común","Serie V · La caída de Vaeon"],
  ["V3_archivista","Ander, Archivista Mayor",4,"rara","Serie V · La caída de Vaeon"],
  ["V4_noche","La noche de la Estática",3,"rara","Serie V · La caída de Vaeon"],
  ["V5_relectura","La relectura",3,"épica","Serie V · La caída de Vaeon"],
  ["V6_sello","El primer sello",1,"LEGENDARIA","Serie V · La caída de Vaeon"]
];
// CROMOS-FIN
var TITULOS = ["Cartógrafo/a estelar","Guardián/a de la Bitácora","Voz de NEBULA","Rompe-Estática",
  "Piloto de la Cero","Archivista estelar","Forjador/a de mundos","Centinela de Liminar",
  "Corazón de la tripulación","Cazador/a de constelaciones"];

function retosDe_(tipo){ return tipo === "PUA" ? RETOS_PUA : RETOS_REGULAR; }
function opcAvatares_(desde, hasta) {
  // 27-ago · sin el «(evoluciona)» del final: sobra en el desplegable —lo cuenta el texto de ayuda—
  // y solo alarga cada opcion. 🔴 Es seguro cambiarlo: parseAvatar_ reconoce el avatar con
  // /Personaje (\d) · (ella|él|modelo A|modelo B)/, que NO exige ese sufijo, asi que las respuestas
  // antiguas (que si lo llevan) se siguen leyendo igual.
  var opc = []; for (var pj = desde; pj <= hasta; pj++) { var et = pj !== 5 ? ["ella","él"] : ["modelo A","modelo B"];
    opc.push("Personaje " + pj + " · " + et[0]); opc.push("Personaje " + pj + " · " + et[1]); }
  return opc;
}
function opcIniciales_() { return opcAvatares_(1, AVATARES_INICIALES); }
function opcExclusivos_() { return opcAvatares_(AVATARES_INICIALES + 1, 7); }

