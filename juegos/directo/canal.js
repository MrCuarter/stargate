// EL MODO EN DIRECTO · lo común de la pantalla del docente (proyector) y de los móviles (alumno).
// En el borrador se hablan por BroadcastChannel: todas las pestañas del MISMO navegador (una de proyector y una o varias de
// alumno). En la web será Firestore (GamificaPro), con la misma forma:
//   · el proyector escribe  directo/{sala}                → { fase, cfg, fin, equipos, escudo, baliza… }  (≈ 1 vez por segundo)
//   · cada alumno escribe   directo/{sala}/jugadores/{id} → { alias, avatar, puntos, stats }             (≈ 1 vez por segundo)
//   · y cada uno escucha lo del otro (onSnapshot). Las respuestas a las preguntas, por la función del servidor.
// Con 30 alumnos y 5 minutos: unas 20.000 lecturas y 2.000 escrituras (el plan gratuito da 50.000 y 20.000 al día).
// En la sesión, la sala es la de la clase (grupo + sesión): el recluta no escribe código. El código de 4 letras queda para
// quien entra desde la Nave sin la sesión abierta.
// 🔴 28-sep · EN LA WEB (dentro de la sesión o de la Nave, con ?per=): la sala del grupo por Firestore, a través del motor de
// la página que lo contiene (SG.MOTOR.directoCanal). Fuera (el borrador), BroadcastChannel entre pestañas.
export const PER = new URLSearchParams(location.search).get('per') || '';
// el motor está en la Nave o en la sesión: el juego va en su marco (o, en el Asedio, en un marco dentro de otro marco)
export function motor() {
  let w = window;
  for (let i = 0; i < 3 && w.parent && w.parent !== w; i++) {
    w = w.parent;
    try { const M = w.SG && w.SG.MOTOR; if (M && M.directoCanal) return M; } catch (e) { return null; }
  }
  return null;
}
// se espera al motor Y a la sesión iniciada (la cuenta llega un momento después de cargar la página)
export async function esperarMotor(ms = 8000) {
  for (let t = 0; t < ms; t += 150) { const M = motor(); if (M && M.auth && M.auth.currentUser) return M; await new Promise((r) => setTimeout(r, 150)); }
  return motor();
}
export const conServidor = () => !!(PER && motor());
export function conectar(codigo, alMensaje, { docente = false, yo = null } = {}) {
  const M = PER && motor();
  if (M) return M.directoCanal(PER, docente, yo, alMensaje);
  const bc = new BroadcastChannel('sg-directo-' + String(codigo).toUpperCase());
  bc.onmessage = (ev) => alMensaje(ev.data);
  return { enviar: (m) => bc.postMessage(m), cerrar: () => bc.close(), mio: async () => null };
}
// las preguntas en la web: las da el servidor (una partida «libre» de stargateRuta), sin la respuesta; se responde allí
export async function preguntasDelServidor(temas, n = 20) {
  const M = motor(); if (!M || !PER || !temas.length) return null;
  try { const r = await M.llamar('stargateRuta', { accion: 'empezar', projectId: PER, mision: 'libre', temas, n }); return { partida: r.partida, preguntas: r.preguntas || [] }; }
  catch (e) { return null; }
}
export async function responderAlServidor(partida, qid, pos) {
  const M = motor(); if (!M) return { ok: false };
  try { return await M.llamar('stargateRuta', { accion: 'responder', partida, qid, pos }); } catch (e) { return { ok: false }; }
}
export const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I ni O: no se confunden con 1 y 0
export const nuevoCodigo = () => Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');
export const EN_WEB = location.pathname.includes('/juegos/');
// el avatar: una clave del borrador (p3f_r2) o, en la web, la imagen de la ficha (la que pinta la Nave)
// 🔴 30-sep · el avatar llega de Firestore y cada jugador escribe el suyo: con comillas, < >, espacios o barras invertidas no
// es una imagen, es un intento de colar código en el proyector del docente (se pinta dentro de src="…"). Se descarta.
export const AV = (k) => { k = String(k || ''); if (/["'<>`\\\s]/.test(k)) k = ''; if (/^https?:\/\//.test(k)) return k; if (k.includes('/')) return (EN_WEB ? '../../' : '') + k;
  return (EN_WEB ? '../../assets/img/avatares/evo/' : '../sala-joran/img/av/') + (k || 'p3f_r2') + '.jpg'; };
export const AVATARES = ['p1f', 'p1m', 'p2f', 'p2m', 'p3f', 'p3m', 'p4f', 'p4m', 'p5f', 'p5m', 'p6f', 'p6m', 'p7f', 'p7m'].map((p) => p + '_r2');
export const TEMAS = ['', 'Fôrge', 'Ecos', 'Sendara', 'Reliae', 'Umbral', 'Ludo', 'Vínculo', 'Liminar'];

// ── LOS CUATRO MODOS: la misma mecánica (tocar lo que cae y contestar) con cuatro estructuras de meta distintas.
// Es la teoría de la asignatura jugada: cooperativa, individual (dos variantes) y por equipos.
export const MODOS = {
  defensa: { breve: 'Toda la clase contra la Estática: se gana o se pierde junta.', n: 'Defensa', largo: 'Simulacro de defensa', estructura: 'Cooperativa',
    que: 'La Estática ataca la Cero en oleadas y, al final, manda un destructor. El escudo es de todos: la clase gana o pierde junta. Acertar repara el escudo. Al final, los héroes de la defensa.' },
  carrera: { breve: 'El primero en llegar al planeta.', n: 'Carrera', largo: 'La carrera al planeta', estructura: 'Individual',
    que: 'Cada asteroide y cada acierto te acercan al planeta. Gana quien llega antes, o quien más cerca esté al acabar el tiempo.' },
  caza: { breve: 'Todos contra todos, a por puntos.', n: 'Caza', largo: 'La caza', estructura: 'Individual',
    que: 'Todos contra todos: el máximo de puntos en el tiempo. Los platillos dorados valen más. El más arcade.' },
  duelo: { breve: 'Dos escuadrones invitados, al azar: tirad de la baliza.', n: 'Duelo', largo: 'Duelo de escuadrillas', estructura: 'Por equipos',
    que: 'La clase se parte al azar en dos escuadrones invitados (dos de la flota que no son el vuestro) y tira de una baliza. Tras un acierto: empujar fuerte o sabotear al rival. Cuenta la media por miembro, así que da igual que un equipo tenga uno más.' },
};
// 🔴 en la web, los nombres y la línea de cada modo salen de _site_data.py → DIRECTO (el build escribe datos.js)
try { const D = (await import('./datos.js?v=3c17edc530')).DIRECTO; for (const [k, largo, estructura, breve] of D.modos) if (MODOS[k]) Object.assign(MODOS[k], { largo, estructura, breve }); } catch (e) { /* borrador: sin datos.js */ }
// ── LOS AJUSTES (lo que el docente puede tocar antes de lanzar)
export const DURACIONES = [120, 180, 240, 300];
export const PREGUNTAS = { no: 'Sin preguntas (solo reflejos)', semana: 'El tema de la semana', vistos: 'Los temas ya vistos', todo: 'Todo el viaje' };
export const FRECUENCIAS = [10, 15, 20]; // segundos entre pregunta y pregunta
export const INTENSIDAD = { suave: { n: 'Suave', k: 0.75 }, normal: { n: 'Normal', k: 1 }, tormenta: { n: 'Tormenta', k: 1.3 } };
// 🔴 27-sep · la DIFICULTAD EN CALIENTE: el docente la sube o la baja durante la partida (más/menos velocidad y daño de lo
// que cae). Va en cfg.dificultad (un factor sobre la intensidad elegida), así llega a los móviles con el estado.
export const DIFICULTAD = { min: 0.6, max: 1.8, paso: 0.2 };
export const kDe = (c) => (INTENSIDAD[c && c.intensidad] ? INTENSIDAD[c.intensidad].k : 1) * (Number(c && c.dificultad) || 1);
// lo que tiene el Comandante en cada partida: tres bombas (limpian la pantalla) y la reparación, que se recarga
export const MANDO = { bombas: 3, recargaCurar: 20, curaEscudo: 30, bombaJefe: 0.15 };
export const CFG_INICIAL = { modo: 'defensa', dur: 180, preguntas: 'semana', frecuencia: 15, intensidad: 'normal', dificultad: 1, potenciadores: true, oculto: false, premio: true };
// tres atajos para no pensar en clase
export const ATAJOS = [
  { k: 'rapido', n: 'Rápido', que: 'Caza, 2 min, sin preguntas', cfg: { modo: 'caza', dur: 120, preguntas: 'no', intensidad: 'normal' } },
  { k: 'clasico', n: 'Clásico', que: 'Defensa, 3 min, el tema de la semana', cfg: { modo: 'defensa', dur: 180, preguntas: 'semana', intensidad: 'normal' } },
  { k: 'final', n: 'Gran final', que: 'Duelo, 4 min, todo el viaje', cfg: { modo: 'duelo', dur: 240, preguntas: 'todo', intensidad: 'tormenta' } },
];
export const EQUIPOS = { A: { n: 'Escuadrilla Cian', corto: 'Cian', color: '#5ff4ff', k: '' }, B: { n: 'Escuadrilla Ámbar', corto: 'Ámbar', color: '#ffc24a', k: '' } };
// 🔴 27-sep · el Duelo, con DOS ESCUADRONES DE LA FLOTA que no son los del grupo (Norberto: mejor que «Cian» y «Ámbar»).
// La lista es la del Asedio (borradores/asedio → ESC). El color sigue siendo cian/ámbar: es lo que distingue los dos lados
// en la pantalla; el nombre y el emblema son del escuadrón. Lo elige la pantalla del docente y viaja en el estado (eqs).
export const ESCUADRONES = [['esc_yunques', 'Los Yunques'], ['esc_eco_largo', 'Eco Largo'], ['esc_cartografos', 'Los Cartógrafos'], ['esc_senal', 'Señal Abierta'],
  ['esc_faro', 'Faro Umbral'], ['esc_ruta_azul', 'Ruta Azul'], ['esc_porques', 'Los Porqués'], ['esc_capa', 'Capa Liminar'], ['esc_copistas', 'Los Copistas'], ['esc_guardia', 'Guardia Cero']];
export const IMG_ESC = (k) => (EN_WEB ? '../../assets/img/escuadrones/' : 'img/esc/') + k + '.png';
// «Los Yunques» → «Yunques» (para los sitios pequeños: el marcador del móvil, la base del duelo)
const sinArticulo = (n) => n.replace(/^(Los|Las|La|El)\s+/, '');
export function ponerEquipos(eqs) {
  for (const x of ['A', 'B']) {
    const e = eqs && eqs[x]; if (!e || !e.k || EQUIPOS[x].k === e.k) continue;
    const f = ESCUADRONES.find((z) => z[0] === e.k); const n = f ? f[1] : String(e.n || '').slice(0, 30);
    Object.assign(EQUIPOS[x], { k: e.k, n, corto: sinArticulo(n) });
  }
}
// el emblema, pequeño y en línea (sala de espera, final, móvil)
export const emblema = (x, tam = 28) => (EQUIPOS[x].k ? `<img src="${IMG_ESC(EQUIPOS[x].k)}" alt="" width="${tam}" height="${tam}" style="width:${tam}px;height:${tam}px;vertical-align:middle;object-fit:contain">` : '');

// ── cuánto vale cada cosa (lo mismo en todos los modos: cambia la META, no la mecánica)
export const VALOR = { asteroide: 1, dorado: 5, acierto: 8, reparacion: 6, empuje: 12 };
// las metas dependen de la duración: a buen ritmo (≈ 1,5 puntos por segundo con las preguntas) la carrera se gana
// hacia el final
export const metaCarrera = (seg) => Math.round(seg * 1.1 / 10) * 10; // 3 min → 200
export const BALIZA = 45; // diferencia de media por miembro que mete la baliza en la base rival
// qué temas entran según el ajuste de preguntas
export function temasDe(cfg, temaSemana) {
  if (cfg.preguntas === 'no') return [];
  if (cfg.preguntas === 'semana') return [temaSemana];
  if (cfg.preguntas === 'vistos') return Array.from({ length: temaSemana }, (_, i) => i + 1);
  return [1, 2, 3, 4, 5, 6, 7, 8];
}
// los premios simbólicos (propuesta): como el pase de lista, pequeños a propósito
export const PREMIO = { jugar: 5, ganarClase: 10, podio: 10, equipo: 10 };
// una imagen que se reintenta si no llega (el servidor local pierde alguna cuando se piden muchas a la vez)
export function imagen(url, alCargar) {
  const img = new Image(); let intentos = 0;
  img.onload = () => alCargar && alCargar(img);
  img.onerror = () => { if (++intentos <= 4) setTimeout(() => { img.src = url + (url.includes('?') ? '&' : '?') + 'r=' + intentos; }, 300 * intentos); };
  img.src = url; return img;
}
