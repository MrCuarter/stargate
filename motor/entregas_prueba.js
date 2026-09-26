'use strict';
/**
 * STARGATE · LO QUE ENTREGARON LOS RECLUTAS DE PRUEBA (17-sep-2026)
 *
 * Los grupos de prueba (`sembrar_prueba.js --id=…`) nacían con retos registrados pero sin nada entregado: ni un enlace ni
 * una reflexión. En la prueba humana, la ficha decía «sin enlace» en todo y no había reflexión que leer. Norberto:
 * «cuando una tarea tiene reflexión en vez de enlace, si hago clic, ¿puedo leer la reflexión? Debería». Para poder
 * comprobarlo, esto le da a cada recluta DE MENTIRA lo que habría entregado:
 *   · un ENLACE que abre de verdad (ejemplos públicos del curso) en cada reto que lo pide, y
 *   · su REFLEXIÓN en los retos que se responden en el propio reto (con el enlace, si el reto lo lleva también).
 * Uno de ellos lleva a propósito un enlace de Drive sin permisos: para ensayar «anular con un porqué».
 *
 * 🔴 26-sep · Y LA NAVE ESCUELA. Norberto: «Cometa… no veo el enlace que tienen». Sus reclutas nacían con los retos hechos y
 * sin entregar nada, y el docente que aprende ahí no veía cómo se revisa una entrega. El enlace de cada una es ahora
 * `ejemplo.html?reto=<R>&de=<alias>`: el ejemplo de ese reto con el aviso «La entrega de Cometa» (se abre de verdad, y en
 * un grupo de verdad sería su Bitácora o su Genially). El tercero, con uno de Drive sin permisos, sigue igual: para ensayar
 * «anular con un porqué».
 *
 * 🔴 Escribe en el Firestore de VERDAD. Solo en grupos `prueba-…`, `demo-…` o la `nave-escuela` de STARGATE, solo a los
 * reclutas de mentira (userId `prueba_…`/`demo_…`: la cuenta real no se toca) y sin pisar nada que ya exista. Guarda la
 * lista de lo creado en ~/.config/stargate-mando/copias/ por si hay que quitarlo.
 *   node motor/entregas_prueba.js --id=nave-escuela --ensayo      → cuenta lo que haría, sin escribir nada
 *   node motor/entregas_prueba.js --id=nave-escuela               → lo escribe
 *   node motor/entregas_prueba.js --id=prueba-semana-16 [--id=prueba-semana-8]
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node motor/entregas_prueba.js --id=lab-clase   (ensayo en el emulador)
 */
const path = require("path"), fs = require("fs"), os = require("os");
const { execFileSync } = require("child_process");
const GP = "/Users/nor/Claude/vibewebs/gamificapro";
const admin = require(path.join(GP, "node_modules", "firebase-admin"));
const EMU = !!process.env.FIRESTORE_EMULATOR_HOST;
if (EMU) admin.initializeApp({ projectId: "demo-stargate" });
else admin.initializeApp({ credential: admin.credential.cert(require(path.join(GP, "service-account.json"))) });
const db = admin.firestore();

const IDS = process.argv.filter(a => a.indexOf("--id=") === 0).map(a => a.slice(5));
const ENSAYO = process.argv.includes("--ensayo");   // 26-sep · cuenta y no escribe
if (!IDS.length) { console.error("✗ Falta --id=<grupo>"); process.exit(2); }
for (const id of IDS) {
  if (!/^[a-z0-9-]{3,40}$/.test(id) || !(EMU || /^(prueba|demo)-/.test(id) || id === "nave-escuela")) {
    console.error("✗ «" + id + "»: solo grupos de prueba (prueba-…, demo-… o nave-escuela). No se ha tocado nada."); process.exit(2);
  }
}

// un dato, un sitio: qué retos piden enlace y cuáles se responden en el propio reto
const WEB = JSON.parse(execFileSync("python3", ["-c",
  "import json,_site_data as D;print(json.dumps({'ev':D.EVIDENCIA_RETOS,'rf':D.REFLEXION_RETOS,'ej':D.EJEMPLOS_RETOS}))"],
  { cwd: path.resolve(__dirname, ".."), encoding: "utf8" }));

// Enlaces que abren: los ejemplos públicos del curso y la web de recursos
const ENLACES = Array.from(new Set(Object.values(WEB.ej).map(e => e.enlace).filter(Boolean)
  .concat(["https://stargate.mistercuarter.es/recursos.html"])));
const SIN_PERMISOS = "https://drive.google.com/file/d/1sinPermisos-borrador-de-prueba/view";
// 26-sep · la entrega de ejemplo de un recluta: la página del ejemplo de su reto, con su alias (ejemplo.html?reto=&de=)
const WEB_URL = "https://stargate.mistercuarter.es/";
const entregaDe = (reto, alias) => WEB.ej[reto] && reto !== "S7"
  ? WEB_URL + "ejemplo.html?reto=" + encodeURIComponent(reto) + "&de=" + encodeURIComponent(alias || "un recluta") : null;

// Reflexiones creíbles, varias por reto (se reparten por recluta). Cumplen el mínimo de caracteres de cada una.
const TEXTOS = {
  A1: ["Tengo a medias una unidad de ciencias con experimentos en casa: se quedó en el segundo tema porque no encontraba cómo recoger las evidencias sin que fuera un examen.",
       "Un blog de aula que abrí en octubre y dejé en tres entradas. Me frenó el tiempo, pero sobre todo no saber qué publicar para que el alumnado quisiera volver.",
       "Empecé un banco de actividades de comprensión lectora en Genially. Lo dejé cuando vi que cada una me llevaba dos tardes y no tenía claro si las iban a usar.",
       "Un proyecto de radio escolar: grabamos dos programas y se paró al cambiar de trimestre. Me faltó una rutina fija y alguien que se encargara de editar."],
  B2: ["Mi videotutorial enseña a resolver ecuaciones de primer grado paso a paso. Cubre el objetivo de aplicar el procedimiento sin memorizarlo, y aprendí que cinco minutos es el límite real de atención.",
       "Grabé cómo buscar fuentes fiables en internet. El objetivo es que distingan información contrastada de opinión; al hacerlo aprendí a escribir el guion antes de grabar, que me ahorró tres tomas.",
       "Es un tutorial sobre el uso del microscopio antes de la práctica de laboratorio. Cubre la seguridad y el enfoque; descubrí que los subtítulos ayudan más de lo que pensaba.",
       "Expliqué cómo se hace un comentario de texto. Aprendí que enseñar la pantalla mientras hablo funciona mejor que salir yo, y que conviene cortar cada paso en un clip."],
  B4: ["Mi aula en Classroom manda cada lunes una píldora de dos minutos y una pregunta abierta en el tablón. La conversación sigue viva porque respondo a las tres primeras respuestas del día.",
       "El contenido llega al móvil por la app de Classroom con notificaciones. Para mantener la conversación uso una pregunta de la semana y comento las respuestas en la clase siguiente.",
       "He montado el aula con materiales cortos y un cuestionario al final de cada tema. En el móvil se ven bien porque todo son vídeos verticales y textos de menos de un párrafo.",
       "Uso la tarea con rúbrica y un foro por tema. La clave para que no muera es que cada semana alguien del grupo tiene el encargo de abrir el debate con una duda real."],
  B6: ["Mi juego cubre el vocabulario del tema 3. En el nivel 1 se reconoce la palabra, en el 2 se usa en una frase y en el 3 se explica a otro. Lo evalúo con la puntuación final y una pregunta de salida.",
       "Es un escape de fracciones con tres niveles: equivalencias, suma con distinto denominador y problemas. Cada nivel añade una pista menos, y evalúo con el tiempo y los errores registrados.",
       "El juego repasa la Edad Media con preguntas que suben de dificultad. Del nivel 1 al 3 pasan de fechas a causas; la evaluación es una tabla de logros que completan en su cuaderno.",
       "Un juego de lógica para programación: el nivel 1 ordena bloques, el 2 usa bucles y el 3 condicionales. Lo evalúo viendo si resuelven el último sin pedir ayuda."],
  A7: ["Mi insignia se llama «Guardián del silencio»: reconoce al equipo que mantiene el aula en calma durante la lectura. La historia es que el faro solo se enciende si nadie hace ruido.",
       "«Cartógrafa del error»: reconoce a quien corrige un fallo propio y explica por qué se equivocó. La tarea deja de ser corregir y se convierte en dibujar el mapa para los demás.",
       "La insignia «Mano tendida» premia ayudar a un compañero a terminar su tarea. La envuelvo en la historia de la tripulación: nadie llega a puerto si alguien se queda atrás.",
       "«Reloj de arena»: reconoce entregar a tiempo tres semanas seguidas. La causa es la del mensajero que debe llegar antes de que caiga el último grano."],
  B7: ["Refuerzo la conducta de traer el material a clase. La historia es una expedición: cada mochila completa suma provisiones al campamento y, con todas, el grupo avanza de etapa.",
       "Mi microgamificación refuerza pedir el turno de palabra. La envuelvo en un consejo de sabios donde solo habla quien tiene el bastón, y funciona porque el bastón es un objeto real.",
       "Busco que revisen su trabajo antes de entregarlo. La historia es un taller de relojería: nada sale del taller sin la marca del revisor, y cada marca es un sello en su pasaporte.",
       "Refuerzo la puntualidad al entrar de recreo. La causa es una nave que despega a su hora: si toda la tripulación está a tiempo, el grupo gana un minuto de misterio al final."],
  A8: ["Usaría la capa de realidad aumentada del cuerpo humano en la clase de sistemas del organismo. El alumnado vería los órganos sobre su propio pupitre, los señalaría y explicaría la función de cada uno a su pareja. La capa añade escala y movimiento, que el libro no tiene.",
       "El recurso de AR de monumentos lo usaría al empezar el tema del arte románico: cada grupo coloca la iglesia en el patio, busca tres elementos y los fotografía. Añade la sensación de estar dentro y obliga a mirar con detalle, no a copiar del libro.",
       "Usaría la app de constelaciones en una clase de física sobre la luz. Verían el cielo sobre el aula, identificarían tres estrellas y calcularían cuánto tarda su luz en llegar. La capa convierte un dato abstracto en algo que se señala con el dedo.",
       "Con el recurso de AR del ciclo del agua, cada equipo proyecta la maqueta en su mesa, sigue una gota y narra su recorrido en un audio corto. Lo que añade es poder parar, girar y ver lo que en un dibujo plano se pierde."],
  L2: ["ANTES: ven un vídeo de cinco minutos y responden dos preguntas en el formulario. DURANTE: resolvemos las dudas del formulario, trabajan en parejas un caso y cerramos con un ticket de salida.",
       "ANTES: leen una infografía y apuntan una duda. DURANTE: agrupo las dudas en la pizarra, hacen una práctica guiada por estaciones y presentan en dos minutos lo que han descubierto.",
       "ANTES: juegan un cuestionario corto para activar lo que saben. DURANTE: explico solo lo que falló, trabajan un reto por equipos y cada equipo sube su resultado al padlet."],
  L3: ["Un itinerario es un camino con orden: el alumnado avanza por pasos que ya he decidido. Un paisaje es un mapa abierto con recursos donde cada cual elige por dónde entrar según lo que necesita. El itinerario guía; el paisaje da libertad dentro de unos límites.",
       "El itinerario marca una secuencia fija de actividades hacia un objetivo. El paisaje de aprendizaje ofrece varias rutas y niveles, a menudo con elección y recompensas. Los dos organizan recursos, pero en el paisaje decide más el alumnado.",
       "Itinerario: una ruta lineal, como un tren con estaciones. Paisaje: un parque con caminos, donde eliges la actividad según tu nivel o tu interés. En el paisaje suele haber matriz de inteligencias o de dificultad; en el itinerario, no."],
  L6: ["Mi recurso es un Genially interactivo de fracciones pensado para aula invertida. Aporta explicaciones cortas que el alumnado ve en casa a su ritmo y un cuestionario que me dice quién llega con dudas. Se usa antes de la sesión, para que en clase dediquemos el tiempo a resolver problemas. Lo elegí porque con esta metodología lo importante es que la teoría no ocupe la clase, y este formato permite pausar, repetir y comprobar sin mi presencia. Además, recoge datos que uso para formar los grupos del día.",
       "Justifico mi escape room digital desde el aprendizaje basado en juegos. Aporta una meta clara, retroalimentación inmediata en cada candado y trabajo en equipo. Se usa al cerrar el tema, como repaso antes de la prueba. Lo elegí porque convierte la revisión de contenidos en un reto con sentido y el error no penaliza: solo obliga a pensar otra vez. En diez minutos veo qué candados atascan a más grupos y eso me dice qué repasar.",
       "Mi recurso es una web de recursos con itinerarios por niveles, justificada desde el aprendizaje personalizado. Aporta tres caminos para un mismo objetivo, con materiales de distinta dificultad. Se usa durante las sesiones de práctica autónoma. Lo elegí porque en un grupo tan diverso una única explicación deja fuera a la mitad, y aquí cada estudiante avanza desde donde está. La elección del camino también me da información sobre cómo se ven a sí mismos."],
};

(async () => {
  const hechos = [];
  for (const ID of IDS) {
    const p = await db.collection("projects").doc(ID).get();
    if (!p.exists || !(p.data().stargate || {}).version) { console.error("✗ «" + ID + "» no es un grupo de STARGATE. No se ha tocado."); continue; }
    const fichas = (await db.collection("student_profiles").where("projectId", "==", ID).get()).docs
      .filter(d => /^(prueba|demo)_/.test(String(d.data().userId || "")));
    let nEnl = 0, nRf = 0, k = 0, roto = false;
    for (const d of fichas) {
      const f = d.data(), sellos = f.missionTimestamps || {};
      for (const mid of (f.completedMissionIds || [])) {
        const reto = String(mid).split("__").pop(), rf = WEB.rf[reto], pide = WEB.ev[reto] === "obligatoria";
        if (!pide && !rf) continue;
        const cuando = Date.parse((sellos[mid] || [])[0] || "") || Date.now() - 864e5;
        let enlace = "";
        if (pide || (rf && rf.modo === "ambos")) {
          // (el tercero de la lista lleva uno sin permisos en su último reto con enlace: para ensayar «No es público»)
          enlace = entregaDe(reto, f.displayName)
            || ENLACES[(k + reto.charCodeAt(0) + (parseInt(reto.slice(1), 10) || 0)) % ENLACES.length];   // (XS no lleva número)
          const ref = db.collection("mission_deliveries").doc(mid + "__" + d.id);
          if (!(await ref.get()).exists) {
            if (!ENSAYO) await ref.set({ projectId: ID, missionId: mid, studentProfileId: d.id, userId: f.userId, stargateReto: reto, enlace, createdAt: cuando });
            hechos.push("mission_deliveries/" + ref.id); nEnl++;
          }
        }
        if (rf && TEXTOS[reto]) {
          const ref = db.collection("stargate_reflexiones").doc(ID + "__" + reto + "__" + d.id);
          if (!(await ref.get()).exists) {
            const dat = { projectId: ID, reto, fichaId: d.id, uid: f.userId, texto: TEXTOS[reto][k % TEXTOS[reto].length], creado: cuando, editado: cuando };
            if (enlace) dat.enlace = enlace;
            if (!ENSAYO) await ref.set(dat);
            hechos.push("stargate_reflexiones/" + ref.id); nRf++;
          }
        }
      }
      if (k === 2 && !roto) {
        const conEnlace = (f.completedMissionIds || []).map(m => String(m).split("__").pop()).filter(r => WEB.ev[r] === "obligatoria").pop();
        if (conEnlace) {
          if (!ENSAYO) await db.collection("mission_deliveries").doc(ID + "__" + conEnlace + "__" + d.id).set({ enlace: SIN_PERMISOS }, { merge: true });
          roto = true; console.log("   " + f.displayName + " · " + conEnlace + " lleva el enlace sin permisos (para ensayar «anular con un porqué»)");
        }
      }
      k++;
    }
    console.log((ENSAYO ? "· ENSAYO (no se ha escrito nada) · " : "✓ ") + ID + " · " + fichas.length + " reclutas de prueba · " + nEnl + " enlaces · " + nRf + " reflexiones");
    if (ENSAYO && fichas[0]) {
      const f0 = fichas[0].data(), r0 = (f0.completedMissionIds || []).map(m => String(m).split("__").pop()).filter(r => entregaDe(r, f0.displayName))[0];
      if (r0) console.log("  por ejemplo, " + f0.displayName + " · " + r0 + " → " + entregaDe(r0, f0.displayName));
    }
  }
  if (!EMU && !ENSAYO && hechos.length) {
    const dir = path.join(os.homedir(), ".config", "stargate-mando", "copias");
    fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, "entregas-prueba-" + new Date().toISOString().slice(0, 16).replace(/:/g, "") + ".json");
    fs.writeFileSync(f, JSON.stringify({ grupos: IDS, creados: hechos }, null, 1));
    console.log("  (lo creado, por si hay que quitarlo: " + f + ")");
  }
  process.exit(0);
})().catch(e => { console.error("✗", e.message); process.exit(1); });
