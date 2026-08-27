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
  ["A1","Reto A «El boceto sin quemar» (recupera a Bran)",["P1_bran"],100,1],
  ["B1","Reto B «La chispa» (imagen con IA)",["R1_la-chispa"],250,1],
  ["X1","Actividad 1 entregada (imagen con IA)",["H2_primera-forja","E2_capitan"],500,1],
  ["A2","Reto A «Un mensaje para quien faltó» (recupera a Tomás)",["P2_tomas"],100,2],
  ["B2","Reto B «El eco que enseña» (videotutorial + videoquiz)",["R2_el-eco-que-ensena"],250,2],
  ["A3","Reto A «Dos senderos» (recupera a Sylla)",["P3_sylla"],100,3],
  ["B3","Reto B «La matriz» (matriz 8×6)",["R3_la-matriz"],250,3],
  ["X2","Actividad 2 entregada (paisaje de aprendizaje)",["H3_cartografo"],500,3],
  ["A4","Reto A «Abre el canal» (recupera a Amara)",["P4_amara"],100,4],
  ["B4","Reto B «El entorno de aula»",["R4_entorno-de-aula"],250,4],
  ["A5","Reto A «Mide con método» (recupera a Vera)",["P5_vera"],100,5],
  ["B5","Reto B «La Bitácora medida» (rúbrica + ePortfolio)",["R5_bitacora-medida"],250,5],
  ["A6","Reto A «Ensaya jugando» (recupera a Joran)",["P6_joran"],100,6],
  ["B6","Reto B «El juego» (juego digital)",["R6_el-juego"],250,6],
  ["A7","Reto A «Un porqué» (recupera a Mara)",["P7_mara"],100,7],
  ["B7","Reto B «La microgamificación»",["R7_microgamificacion"],250,7],
  ["A8","Reto A «La capa posible» (recupera a Noa)",["P8_noa"],100,8],
  ["B8","Reto B «El último umbral» (RA/RV + Bitácora publicada)",["R8_ultimo-umbral"],250,8],
  ["XF","Batalla final: examen realizado",["E3_vaeon"],500,9]
];
// PUA: una insignia por tema (el personaje), ganada con la pieza productiva del tema
var RETOS_PUA = [
  ["B1","La chispa: imagen con IA (recupera a Bran)",["P1_bran","R1_la-chispa"],300,1],
  ["X1","Actividad 1 entregada",["H2_primera-forja","E2_capitan"],500,1],
  ["B2","El eco que enseña: videotutorial (recupera a Tomás)",["P2_tomas","R2_el-eco-que-ensena"],300,2],
  ["B3","La matriz 8×6 (recupera a Sylla)",["P3_sylla","R3_la-matriz"],300,3],
  ["X2","Actividad 2 entregada",["H3_cartografo"],500,3],
  ["B4","El entorno de aula (recupera a Amara)",["P4_amara","R4_entorno-de-aula"],300,4],
  ["B5","La Bitácora medida (recupera a Vera)",["P5_vera","R5_bitacora-medida"],300,5],
  ["B6","El juego digital (recupera a Joran)",["P6_joran","R6_el-juego"],300,6],
  ["B7","La microgamificación (recupera a Mara)",["P7_mara","R7_microgamificacion"],300,7],
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
  var m = clave.match(/^racha:(\d+)$/);
  if (m) { var b = BONUS_RACHA.filter(function(x){ return x[0] === Number(m[1]); })[0];
           if (b) return { xp: 0, creditos: b[1] }; }
  return { xp: 0, creditos: 0 };
}
// AYUDA-INICIO · QUE HAY QUE HACER EN CADA RETO. Va dentro del formulario, bajo la casilla de su
// tema, porque un alumno que no sabe que se le pide ESCRIBE UN CORREO. Lo genera _build_site.py
// desde _site_data.py (AYUDA_RETOS): NO editar a mano.
var AYUDA_RETOS = {
 "A1": "Publica en el foro de la plataforma de UNIR un borrador en bruto de algo que estés creando (una idea de recurso, un esquema a medias, un primer intento feo). Añade una frase: qué te daba reparo enseñarlo sin pulir. No se corrige ni se puntúa: el único criterio es compartirlo antes de terminarlo.",
 "A2": "Graba un clip corto (máx. 60 s) explicando un concepto como si se lo contaras a un alumno que hoy no pudo venir a clase. Súbelo o descríbelo en el foro de la plataforma de UNIR. Criterio único: que funcione sin ti delante (se entiende solo).",
 "A3": "Toma un objetivo de aprendizaje y describe dos rutas completamente distintas para alcanzarlo, pensadas para dos alumnos diferentes (p. ej. uno que aprende haciendo y otro que aprende leyendo). 4–6 líneas. Criterio: que las dos rutas lleguen a la misma cima.",
 "A4": "Comparte con tu clase o con el foro de la plataforma de UNIR un recurso útil en menos de 24 h, aunque no esté pulido. Añade una línea: qué habrías «guardado en el cajón para pulir» y por qué esta vez no lo hiciste. Criterio: a tiempo por encima de perfecto.",
 "A5": "Define un indicador que vayas a seguir de verdad sobre el aprendizaje de tus alumnos (algo observable), y acompáñalo de la pregunta que lo convierte en cuidado: «¿qué haré mañana mejor que hoy?». 3–4 líneas. Criterio: medir para cuidar, no para etiquetar.",
 "A6": "Coge algo que tus alumnos temen o les cuesta y conviértelo en un pequeño ensayo jugable (una mecánica: puntos, rutas, un enigma en cada paso…). Descríbelo en 4–6 líneas. Criterio: que el juego sirva a un objetivo, no que sea juego por juego.",
 "A7": "Toma una tarea rutinaria de tu aula y escribe el «porqué» / la narrativa que la convierte en una causa (2–4 líneas). Diseña una insignia con sentido para ella: no premio por obedecer, sino memoria de un acto significativo (nómbrala y di qué reconoce).",
 "A8": "Describe una «capa» sobre tu aula real: cómo sería tu clase si aprendiera a hablar de sí misma (qué mostraría, qué voces tendría). Y elige un compromiso: una cosa concreta que te llevas de todo el viaje. 4–6 líneas.",
 "B1": "Genera con una IA una imagen con finalidad didáctica (ilustración, organizador gráfico o infografía) para un nivel y tema que elijas. Requisitos mínimos: (1) prompt estructurado siguiendo un modelo tipo CRAFT/RITA (contexto educativo + tipo de imagen + finalidad); (2) al menos una iteración del prompt; (3) selección final con criterio docente justificada en 2–3 líneas; (4) evidencia del proceso (enlace al chat o capturas) y cita de la herramienta. Es la tabla técnica de la Actividad 1: guárdala, ya tienes hecho su núcleo.",
 "B2": "Crea un videotutorial de calidad (guion + grabación de pantalla + edición) sobre un procedimiento de tu área, y enriquécelo con 2–3 preguntas insertadas (videoquiz) para comprobar comprensión. Piénsalo para aula invertida. Súbelo a la Bitácora con una reflexión breve: qué objetivo didáctico cubre y qué aprendiste al hacerlo.",
 "B3": "Construye la matriz de programación de un paisaje de aprendizaje: una tabla de doble entrada que cruza las 8 inteligencias múltiples × 6 niveles de Bloom (48 casillas). Contextualiza una unidad didáctica real (nivel, área, objetivos) y rellena al menos 6 cruces variados en complejidad y en talento, con una actividad en cada uno (objetivo, tarea del alumno, recurso, evaluación, tiempo, tipo: obligatoria/optativa/voluntaria). Es el corazón de planificación de la Actividad 2.",
 "B4": "Monta un espacio digital de aula organizado (tipo Classroom, Sites, Moodle, Teams…) donde compartas materiales de forma clara y puedas dar feedback y comunicarte en diferido y en directo. Deja en la Bitácora el enlace/captura + reflexión breve: cómo llega tu contenido al móvil del alumno y cómo mantienes la conversación viva.",
 "B5": "(1) Diseña una rúbrica digital sencilla para evaluar uno de tus recursos (criterios + niveles). (2) Estructura formalmente tu ePortfolio: portada, secciones para Act 1 y Act 2, y una sección por reto (videotutorial / microgamificación / reto libre), cada una con el patrón evidencia → contexto → reflexión → autoevaluación. Esta semana además cierras la Actividad 1 dentro de la Bitácora.",
 "B6": "Adapta un juego existente o crea uno digital a medida para un objetivo concreto de tu aula (ruleta, quiz, sopa, encuentra las diferencias, escape…). En ABJ el juego ES la actividad: cada mecánica debe servir a un aprendizaje. Sube a la Bitácora el juego (enlace/captura) + reflexión: qué objetivo cubre y cómo lo evalúas.",
 "B7": "Diseña una microgamificación de calidad: un toque de juego sobre una tarea que no es un juego (una insignia, una barra de progreso, un tablero, un reto con narrativa). Distíngue bien de ABJ: aquí no se juega, se toman elementos del juego para enganchar. Sube a la Bitácora el recurso + reflexión: qué conducta refuerza y por qué.",
 "B8": "(1) Crea una experiencia de Realidad Aumentada o Virtual sencilla para tu materia (capa AR sobre un objeto/lámina, o una escena VR para practicar sin riesgo). Puede ser tu reto libre del ePortfolio. (2) Termina y publica la Bitácora: convierte tu paisaje de aprendizaje (Act 2) en una imagen interactiva publicada, revisa que las 5 páginas estén completas (Act 1, Act 2, videotutorial, microgamificación, reto libre) y comparte el enlace único.",
 "X1": "La Actividad 1 entregada donde te la pide tu profesor. Marca la casilla cuando la hayas ENVIADO, no cuando la empieces.",
 "X2": "La Actividad 2 entregada donde te la pide tu profesor. Igual: al enviarla.",
 "XF": "El examen hecho. Se marca después de haberlo presentado."
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
// El enlace que venga en ESTE envio, mire la seccion que mire.
function evidenciaDe_(r) {
  var out = "";
  Object.keys(r).forEach(function(k){
    if (k.indexOf(EVIDENCIA_PREF) === 0 && String(r[k] || "").trim()) out = String(r[k]).trim();
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
var XP_VIAJE = {"REGULAR": 5000, "PUA": 4100};
var CREDITOS = {"reclutamiento": 20, "retoA": 20, "retoB": 50, "retoB_pua": 55, "actividad": 100, "final": 100, "derivada": 60};
// Calendario del PER: apertura una semana antes de la 1, cierre al acabar la ultima,
// y el canje una semana mas. Generado desde _site_data.py: no editar a mano.
var SEMANAS_PER = {"REGULAR": 15, "PUA": 8};
var SEMANAS_CANJE_EXTRA = 1;
var DIAS_APERTURA_ANTES = 7;
// Insignia por serie completa. [clave, titulo de la serie tal y como aparece en CROMOS, nombre]
var SERIES_ALBUM = [
  ["A1_tripulacion","Serie I · La Tripulación Cero","La Tripulación Cero al completo"],
  ["A2_ecos","Serie II · Los Ecos","Los Ecos al completo"],
  ["A3_nave","Serie III · La Nave","La Nave al completo"],
  ["A4_sombra","Serie IV · La Sombra","La Sombra al completo"]
];
// NIVELES-FIN
// RECOMPENSAS-INICIO · [nombre, coste en créditos, máx por alumno, descripción, desde (semana
// REGULAR; en PUA se escala), tipo]. Generado desde _site_data.py: no editar a mano.
var RECOMPENSAS_INICIALES = [
  ["Sobre de cromos",15,99,"Una carta al azar de las 20 del álbum (4 series). Los tripulantes son comunes; los Ecos, NEBULA y el Capitán, raros; el Recluta y la Estática, épicos; y dos LEGENDARIOS: el General Vaeon (2 %) y Ander Vaeon, la identidad del villano, solo 1 de cada 100. Se abre solo y tu álbum está en la Nave.",2,"cromo"],
  ["Cambiar 3 repetidos por un sobre",0,99,"¿Cartas repetidas? Cámbialas. Por cada 3 repetidas te llevas un sobre nuevo, gratis. No cuesta créditos y se comprueba solo: si no llegas a 3, se te avisa y no pierdes nada.",2,"cromo_repes"],
  ["Título de recluta",40,3,"Un título narrativo bajo tu alias en el tablero y la Nave (elígelo en el formulario). Se aplica solo.",3,"titulo"],
  ["Fondo de ficha: tu planeta",35,1,"Tu ficha de la Nave con el planeta que elijas de fondo (indícalo en el formulario). Se aplica solo.",4,"fondo"],
  ["Marco dorado del avatar",60,1,"Tu avatar con marco y brillo dorados en el ranking y la Nave. Se aplica solo.",6,"marco"],
  ["Héroe de la Rebelión",60,99,"Un héroe AL AZAR del vestuario: 30 figuras de la Rebelión, cada una única. Se acumulan —cuantos más tengas, más donde elegir— y te lo pones y te lo quitas cuando quieras desde tu Nave, gratis. Los que aún no tienes salen en sombra. Y hay uno LEGENDARIO que no se deja ver hasta que cae.",2,"heroe"],
  ["Subir 0,5 en un entregable",320,1,"Se aplica a la actividad que elijas",14,"nota"],
  ["Subir 1 punto en un entregable",500,1,"Se aplica a la actividad que elijas",14,"nota"],
  ["Recalificar un trabajo entregado fuera de plazo",700,1,"Indica la actividad",14,"nota"],
  ["Recalificar un suspenso",950,1,"Indica la actividad",14,"nota"]
];
// RECOMPENSAS-FIN

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
  if (c === "A") return CREDITOS.retoA || 0;
  if (c === "B") return (tipo === "PUA" ? CREDITOS.retoB_pua : CREDITOS.retoB) || 0;
  return 0;
}
var H = { PERS:"PERs", REC:"RECOMPENSAS", EV:"EVENTOS", AJ:"AJUSTES", DATOS:"DATOS", RES:"RESUMEN", DOC:"DOCENTES",
          CONS:"CONSENTIMIENTO" };
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
  ["P1_bran","Bran Okafor",7,"común","Serie I · La Tripulación Cero"],
  ["P2_tomas","Tomás Reyer",7,"común","Serie I · La Tripulación Cero"],
  ["P3_sylla","Sylla Bren",7,"común","Serie I · La Tripulación Cero"],
  ["P4_amara","Amara Sol",7,"común","Serie I · La Tripulación Cero"],
  ["P5_vera","Vera Khal",7,"común","Serie I · La Tripulación Cero"],
  ["P6_joran","Joran Pike",7,"común","Serie I · La Tripulación Cero"],
  ["P7_mara","Mara Voss",7,"común","Serie I · La Tripulación Cero"],
  ["P8_noa","Noa Lieth",7,"común","Serie I · La Tripulación Cero"],
  ["L1_lena","Lena Reyer",4,"rara","Serie II · Los Ecos"],
  ["L2_kel","Kel Bren",4,"rara","Serie II · Los Ecos"],
  ["L3_copistas","Los Copistas de Fôrge",4,"rara","Serie II · Los Ecos"],
  ["L4_ilan","Ilan Kesh",4,"rara","Serie II · Los Ecos"],
  ["L5_ruta_azul","Los Niños de la Ruta Azul",4,"rara","Serie II · Los Ecos"],
  ["L6_oren","Oren Vash",4,"rara","Serie II · Los Ecos"],
  ["E1_nebula","NEBULA",5,"rara","Serie III · La Nave"],
  ["E2_capitan","El Capitán",5,"rara","Serie III · La Nave"],
  ["N1_recluta","El Recluta",3,"épica","Serie III · La Nave"],
  ["S2_estatica","La Estática",4,"épica","Serie IV · La Sombra"],
  ["E3_vaeon","General Vaeon",2,"LEGENDARIA","Serie IV · La Sombra"],
  ["S1_ander","Ander Vaeon",1,"LEGENDARIA","Serie IV · La Sombra"]
];
// CROMOS-FIN
var TITULOS = ["Cartógrafo/a estelar","Guardián/a de la Bitácora","Voz de NEBULA","Rompe-Estática",
  "Piloto de la Cero","Archivista estelar","Forjador/a de mundos","Centinela de Liminar",
  "Corazón de la tripulación","Cazador/a de constelaciones"];

function retosDe_(tipo){ return tipo === "PUA" ? RETOS_PUA : RETOS_REGULAR; }
function opcAvatares_(desde, hasta) {
  var opc = []; for (var pj = desde; pj <= hasta; pj++) { var et = pj !== 5 ? ["ella","él"] : ["modelo A","modelo B"];
    opc.push("Personaje " + pj + " · " + et[0] + " (evoluciona)"); opc.push("Personaje " + pj + " · " + et[1] + " (evoluciona)"); }
  return opc;
}
function opcIniciales_() { return opcAvatares_(1, AVATARES_INICIALES); }
function opcExclusivos_() { return opcAvatares_(AVATARES_INICIALES + 1, 7); }

