'use strict';
/**
 * BATERÍA 113 · NEBULA RESPONDE SIN IA: LA BATERÍA DE PREGUNTAS Y SU BUSCADOR (27-sep)
 *
 * Norberto: «una gran batería de preguntas típicas (dónde registro, cómo compro, etc.). Si no sabes la respuesta, dices
 * que debes consultar con el Comandante y que le responderás en cuanto sepas la respuesta (menos de una hora)».
 *
 * Se cargan assets/js/nebula-faq.js y assets/js/nebula-chat.js (sin navegador) y se comprueba: la batería (≥ 150,
 * ids únicos, sin correos ni historia secreta, `ir` válidos) y el buscador (preguntas reales, con erratas y coloquiales,
 * que caen donde deben; y preguntas fuera de tema que no responden nada).
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

console.log("\n▶ 113 · NEBULA responde sin IA: la batería y el buscador");
const mundo = { console, setTimeout, clearTimeout, setInterval, clearInterval, Promise, Intl, Date, Math, JSON };
mundo.window = mundo; mundo.globalThis = mundo;
vm.createContext(mundo);
vm.runInContext(L("assets/js/nebula-faq.js"), mundo, { filename: "nebula-faq.js" });
vm.runInContext(L("assets/js/nebula-chat.js"), mundo, { filename: "nebula-chat.js" });
const F = mundo.SG_NEBULA_FAQ || [], N = mundo.SG && mundo.SG.NEBULA_CHAT;

console.log("\n  1 · la batería");
c(F.length >= 150, "🔴 al menos 150 preguntas típicas", F.length);
const ids = F.map((e) => e.id);
c(new Set(ids).size === ids.length, "   ids únicos", ids.filter((x, i) => ids.indexOf(x) !== i).join());
c(F.every((e) => e.id && Array.isArray(e.p) && e.p.length >= 2 && Array.isArray(e.claves) && e.claves.length && typeof e.r === "string" && e.r.length > 20),
  "   cada entrada: id, al menos dos formas de preguntarlo, claves y respuesta");
const IR = ["nave", "retos", "ruta", "simulador", "botin", "botin:cromos", "botin:heroes", "botin:insignias", "mercado", "zoco", "archivo", "rankings", "envivo"];
c(F.every((e) => !e.ir || IR.indexOf(e.ir) >= 0), "   cada «Ir a…» lleva a una pestaña o sección que existe en la Nave", F.filter((e) => e.ir && IR.indexOf(e.ir) < 0).map((e) => e.id).join());
c(!F.some((e) => /@/.test(e.r)), "🔴 ninguna respuesta lleva un correo ('@')", F.filter((e) => /@/.test(e.r)).map((e) => e.id).join());
// la lista de palabras prohibidas del generador del SABER (borradores/herramientas/saber_nebula.py), más dos nombres propios
let PROHIBIDAS = ["vaeon", "ander", "fragmento prohibido", "desenlace", "finale", "la verdad de la cero", "ciudadela gris",
  "la última noche", "decisión de quedarse", "se quedó", "propuso quedarse"];
try {
  const py = fs.readFileSync(path.join(R, "..", "borradores", "herramientas", "saber_nebula.py"), "utf8");
  const m = py.match(/PROHIBIDAS\s*=\s*\[([\s\S]*?)\]/);
  if (m) PROHIBIDAS = m[1].match(/"([^"]+)"/g).map((x) => x.slice(1, -1));
} catch (e) { /* el borrador no viaja con la web: se usa la copia de arriba */ }
PROHIBIDAS = PROHIBIDAS.concat(["tripulación cero"]);
const conSecreto = F.filter((e) => { const t = (e.r + " " + e.p.join(" ")).toLowerCase(); return PROHIBIDAS.some((p) => t.indexOf(p) >= 0); });
c(!conSecreto.length, "🔴 ninguna entrada toca la historia secreta (palabras prohibidas de saber_nebula.py)", conSecreto.map((e) => e.id).join());
c(!F.some((e) => /\b20\d\d\b|\b\d{1,2} de (septiembre|octubre|noviembre|diciembre|enero|febrero|marzo|abril|mayo|junio)\b/i.test(e.r)),
  "   sin fechas absolutas (cambian por grupo: se dice la semana)");
c(!F.some((e) => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(e.r + e.p.join(""))), "   sin emojis");
c(!F.some((e) => /<(script|img|iframe|style)|on\w+=|javascript:/i.test(e.r)), "   HTML sencillo: sin scripts, imágenes ni manejadores");
c(F.every((e) => (e.r.match(/href="([^"]+)"/g) || []).every((h) => !/^href="(https?:)?\/\//.test(h))), "   los enlaces son relativos a la web");
const HTMLS = F.map((e) => e.r).join(" ").match(/href="([a-z-]+\.html)/g) || [];
c(HTMLS.every((h) => fs.existsSync(path.join(R, h.slice(6)))), "   y las páginas enlazadas existen", HTMLS.filter((h) => !fs.existsSync(path.join(R, h.slice(6)))).join());
const temas = { acceso: /^(alistarse|entrar|codigo_clase|contrasena|otra_cuenta|no_veo_nave|dos_fichas|alias_|comandante_|personaje_|bitacora_|voluntario|cuenta_nota|que_es|quien_nebula|hablar_)/,
  nave: /^(pestanas|mi_nave|pestana_cerrada|capitulo|menu_puntos|guia|orden_semana|fechas_grupo|movil)/, retos: /^(reto_|relampago|reflexiones|evidencia|retos_)/,
  enlace: /^enlace_/, progreso: /^(xp_|niveles|rangos|leyenda|bonus_|racha|carrera|cuantos_)/,
  mercado: /^(creditos_|comprar|precios|mercado_|no_creditos|compra_|oferta|cromos|sobres|abrir_sobre|repetidos|carta_|heroe|capsulas|adorno|sorteo|zoco|arsenal)/,
  botin: /^(insignias|logros)/, clase: /^(llamada|no_presente|asistencia|envivo|votacion|clase_directo|diferido|ticket|juego_directo)/,
  rankings: /^(rankings|nombre_real|escuadron)/, juegos: /^(ruta|joran|asedio)/, archivo: /^(archivo|fragmentos|spoiler|estatica|sesiones|video_)/,
  asignatura: /^(asignatura|temas|semanas|tema_semana|pua|dudas_asig|temario|actividades|act\d|prompt|entregar|rubrica|errores|ortografia|apa|ia_|retraso|notas_|plantilla)/,
  evaluacion: /^(evaluacion|tests|examen)/, tecnico: /^(congelado|no_actualiza|error_|navegador|sonido|notificaciones)/, privacidad: /^(privacidad|permisos|correo_)/ };
const reparto = Object.keys(temas).map((k) => k + " " + F.filter((e) => temas[k].test(e.id)).length);
console.log("     reparto: " + reparto.join(" · "));
c(Object.keys(temas).every((k) => F.some((e) => temas[k].test(e.id))), "   cubre todos los temas: acceso, Nave, retos, enlace, progreso, Mercado, botín, clase, rankings, juegos, Archivo, asignatura, evaluación, técnica y privacidad");

console.log("\n  2 · el buscador");
c(N && typeof N.buscar === "function" && typeof N.decidir === "function" && typeof N.pendientes === "function" && typeof N.montar === "function",
  "🔴 SG.NEBULA_CHAT expone montar, buscar, decidir y pendientes");
// preguntas de verdad, redactadas de otra forma (erratas, coloquiales, sin tildes) → la entrada que debe responder
const CASOS = [
  ["donde subo el reto", "reto_registrar"], ["como compro un sobre de cromos", "sobres"], ["donde compro cromos", "sobres"],
  ["como compro en el zoco", "zoco_comprar"],
  ["me he equivocado de enlace", "reto_equivocado"], ["cuantos temas hay", "temas"], ["el examen es tipo test", "examen"], ["que pasa si pierdo en la ruta", "ruta_repetir"], ["como gasto las monedas", "comprar"], ["no me sale presente", "no_presente"],
  ["cuanto vale el examen", "examen_valor"], ["q es el zoco", "zoco"], ["como me apunto a esto", "alistarse"],
  ["he entrado con el correo del curro y no veo nada", ["otra_cuenta", "no_veo_nave"]], ["olvide la contraseña", "contrasena"],
  ["mi enlace lo puede ver el profe?", "enlace_abre"], ["como comparto el drive para que lo vea todo el mundo", "enlace_drive"],
  ["cuando hay que entregar la actividad 1", "act1_fechas"], ["fecha de entrega de la act 2", "act2_fechas"],
  ["cuantas paginas maximo la actividad 1", "act1_pdf"], ["que es la matriz 8x6", "act2_matriz"],
  ["el juego cuenta pa nota?", "cuenta_nota"], ["es obligatorio jugar a stargate", "voluntario"],
  ["como subo de nivel", "niveles"], ["puedo perder experiencia si compro", "xp_perder"],
  ["que hago con las cartas repetidas", "repetidos"], ["como consigo heroes", "heroes"],
  ["cuando es el sorteo de genially", "sorteo_cuando"], ["como vendo un cromo en el zoco", "zoco_vender"],
  ["donde veo mis insignias", "insignias"], ["no pude ir a clase, donde esta la grabacion", "diferido"],
  ["el ticket es anonimo?", "ticket"], ["quien ve mi nombre de verdad", "nombre_real"],
  ["como desbloqueo la siguiente maquina de joran", "joran_desbloquear"], ["que es el modo desafio", "joran_modos"],
  ["como saco oro en la ruta", "ruta_medallas"], ["cuando es el asedio", "asedio"],
  ["se me ha quedado congelada la pagina", "congelado"], ["me equivoque al marcar un reto", "reto_equivocado"],
  ["como cambio el link del reto", "reto_cambiar_enlace"], ["puedo subir nota con creditos", "arsenal"],
  ["como es el examen final", "examen"], ["cuanto cuenta la asistencia", "asistencia_nota"],
  ["que son los xp", "xp_que"], ["cuanto cuesta un sobre", "precios"], ["como me pongo un marco en la ficha", "adorno_poner"],
  ["ese alias ya existe que hago", "alias_existe"], ["donde pongo mi portafolio", "bitacora_enlazar"],
  ["cual es mi escuadron", "escuadron"], ["como se juega al juego de clase con el movil", "juego_directo"],
  ["dame las respuestas del test", "tests_respuestas"], ["como acaba la historia", "spoiler"],
  ["cual es el correo del profesor", "correo_profe"], ["que datos guardais de mi", "privacidad"],
  ["regsitrar reto", "reto_registrar"], ["cromos repetdos", "repetidos"], ["que es la bitacroa", "bitacora_que"],
  ["donde estan las diapositivas de clase", "sesiones"], ["que es el relampago", "relampago"],
  ["cuales son los temas de la asignatura", "temas"], ["dnd se entregan las actividades", "entregar_donde"],
];
const mal = [];
CASOS.forEach(([q, id]) => {
  const d = N.decidir(q), top = (N.buscar(q)[0] || {}).id, vale = [].concat(id);
  // (con dos respuestas igual de buenas, vale cualquiera de ellas, y también que pregunte «¿Te refieres a…?» entre ellas)
  if (!(d.tipo !== "nada" && vale.indexOf(d.ids[0]) >= 0 && vale.indexOf(top) >= 0)) mal.push(q + " → " + d.tipo + ":" + d.ids.join("/") + " (esperaba " + id + ")");
});
c(CASOS.length >= 40, "   al menos 40 preguntas reales de prueba", CASOS.length);
c(!mal.length, "🔴 cada pregunta real cae en su entrada (" + (CASOS.length - mal.length) + "/" + CASOS.length + ")", mal.join(" | "));
const directas = CASOS.filter(([q]) => N.decidir(q).tipo === "respuesta").length;
c(directas >= CASOS.length * 0.8, "   y la gran mayoría se responden directamente, sin «¿Te refieres a…?»", directas + "/" + CASOS.length);
// fuera de tema: no se responde nada (va al Comandante si el recluta quiere)
const FUERA = ["cual es la capital de francia", "receta de tortilla de patatas", "quien gano el mundial de 2010",
  "me recomiendas una serie de netflix", "cuanto es 7 por 8", "que tiempo hara manana en valencia"];
const respondidas = FUERA.filter((q) => N.decidir(q).tipo !== "nada");
c(!respondidas.length, "🔴 las preguntas fuera de tema no responden nada (" + FUERA.length + ")", respondidas.map((q) => q + " → " + N.decidir(q).ids.join("/")).join(" | "));
c(N.decidir("").tipo === "nada" && N.decidir("??? !!!").tipo === "nada" && Array.isArray(N.buscar("")), "   vacío o solo signos: nada (y sin romperse)");
c(N.buscar("¿Dónde REGISTRO el reto?")[0].id === N.buscar("donde registro el reto")[0].id, "   normaliza mayúsculas, tildes y signos");

console.log("\n  3 · el chat");
const CH = L("assets/js/nebula-chat.js");
c(!/llamar\(\s*["']stargateNebula/.test(CH) && !/anthropic|openai|claude/i.test(CH), "🔴 ya no llama a ninguna IA");
c(/buzonEnviar\(carta\)/.test(CH) && /tipo: "recluta"/.test(CH) && /origen: "nebula"/.test(CH) && /urgente: false/.test(CH), "🔴 la duda va al buzón del Mando como 'recluta' (origen nebula, no urgente)");
c(/"Enviar mi duda"/.test(CH) && !/preguntar[\s\S]{0,400}enviarDuda\(q/.test(CH.slice(CH.indexOf("function preguntar"), CH.indexOf("function enviarDuda"))), "   y solo al pulsar «Enviar mi duda» (preguntar no envía nada)");
c(/menos de una hora \(" \+ HORARIO/.test(CH) && /de 8 a 22 h/.test(CH), "   promete respuesta en menos de una hora, de 8 a 22 h");
c(/guardarCola/.test(CH) && /vaciarCola/.test(CH), "   si el envío falla, la duda se guarda y se reintenta (no se pierde)");
c(/Tus dudas al Comandante/.test(CH) && /buzonVisto\(m\.id\)/.test(CH) && /m\.projectId === per/.test(CH), "   «Tus dudas al Comandante»: las suyas de este grupo, y al verlas, buzonVisto");
c(/¿Te ha servido\?/.test(CH) && /No, pregúntaselo al Comandante/.test(CH) && /¿Te refieres a…\?/.test(CH), "   «¿Te ha servido? Sí · No, pregúntaselo al Comandante» y «¿Te refieres a…?»");
c(/location\.hash = "#" \+ ir/.test(CH) && /NOMBRE_IR\[e\.ir\]/.test(CH) && /mercado: "Ir al Bazar"/.test(CH), "   el botón «Ir a …» navega con location.hash");
c(/sessionStorage/.test(CH) && !/CUPO|preguntas hoy/.test(CH), "   la conversación del día en sessionStorage, y sin cupo diario");
c(/FRECUENTES = \[/.test(CH) && (CH.match(/FRECUENTES = \[([^\]]*)\]/)[1].split(",").length >= 4), "   al abrir, 4-6 preguntas frecuentes como botones");
c((CH.match(/FRECUENTES = \[([^\]]*)\]/)[1].match(/"([^"]+)"/g) || []).every((x) => ids.indexOf(x.slice(1, -1)) >= 0), "   y todas existen en la batería");
c(/aria-live/.test(CH) && /max-width:480px/.test(CH) && !/font-size:(\d|1[01])px/.test(CH), "   aria-live, móvil y letra de 12 px o más");
c(!/[\u{1F300}-\u{1FAFF}]/u.test(CH), "   sin emojis");

console.log("\n  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
