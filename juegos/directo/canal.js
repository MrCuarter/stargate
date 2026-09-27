// EL MODO EN DIRECTO · lo común de la pantalla del docente (proyector) y de los móviles (alumno).
// En el borrador se hablan por BroadcastChannel: todas las pestañas del MISMO navegador (una de proyector y una o varias de
// alumno). En la web será Firestore (GamificaPro), con la misma forma:
//   · el proyector escribe  directo/{sala}                → { fase, cfg, fin, equipos, escudo, baliza… }  (≈ 1 vez por segundo)
//   · cada alumno escribe   directo/{sala}/jugadores/{id} → { alias, avatar, puntos, stats }             (≈ 1 vez por segundo)
//   · y cada uno escucha lo del otro (onSnapshot). Las respuestas a las preguntas, por la función del servidor.
// Con 30 alumnos y 5 minutos: unas 20.000 lecturas y 2.000 escrituras (el plan gratuito da 50.000 y 20.000 al día).
// En la sesión, la sala es la de la clase (grupo + sesión): el recluta no escribe código. El código de 4 letras queda para
// quien entra desde la Nave sin la sesión abierta.
export function conectar(codigo, alMensaje) {
  const bc = new BroadcastChannel('sg-directo-' + String(codigo).toUpperCase());
  bc.onmessage = (ev) => alMensaje(ev.data);
  return { enviar: (m) => bc.postMessage(m), cerrar: () => bc.close() };
}
export const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I ni O: no se confunden con 1 y 0
export const nuevoCodigo = () => Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');
export const EN_WEB = location.pathname.includes('/juegos/');
export const AV = (k) => (EN_WEB ? '../../assets/img/avatares/evo/' : '../sala-joran/img/av/') + k + '.jpg';
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
  duelo: { breve: 'Cian contra Ámbar: tirad de la baliza.', n: 'Duelo', largo: 'Duelo de escuadrillas', estructura: 'Por equipos',
    que: 'Dos escuadrillas al azar, Cian y Ámbar, tiran de una baliza. Tras un acierto: empujar fuerte o sabotear al rival. Cuenta la media por miembro, así que da igual que un equipo tenga uno más.' },
};
// 🔴 en la web, los nombres y la línea de cada modo salen de _site_data.py → DIRECTO (el build escribe datos.js)
try { const D = (await import('./datos.js')).DIRECTO; for (const [k, largo, estructura, breve] of D.modos) if (MODOS[k]) Object.assign(MODOS[k], { largo, estructura, breve }); } catch (e) { /* borrador: sin datos.js */ }
// ── LOS AJUSTES (lo que el docente puede tocar antes de lanzar)
export const DURACIONES = [120, 180, 240, 300];
export const PREGUNTAS = { no: 'Sin preguntas (solo reflejos)', semana: 'El tema de la semana', vistos: 'Los temas ya vistos', todo: 'Todo el viaje' };
export const FRECUENCIAS = [10, 15, 20]; // segundos entre pregunta y pregunta
export const INTENSIDAD = { suave: { n: 'Suave', k: 0.75 }, normal: { n: 'Normal', k: 1 }, tormenta: { n: 'Tormenta', k: 1.3 } };
export const CFG_INICIAL = { modo: 'defensa', dur: 180, preguntas: 'semana', frecuencia: 15, intensidad: 'normal', potenciadores: true, oculto: false, premio: true };
// tres atajos para no pensar en clase
export const ATAJOS = [
  { k: 'rapido', n: 'Rápido', que: 'Caza, 2 min, sin preguntas', cfg: { modo: 'caza', dur: 120, preguntas: 'no', intensidad: 'normal' } },
  { k: 'clasico', n: 'Clásico', que: 'Defensa, 3 min, el tema de la semana', cfg: { modo: 'defensa', dur: 180, preguntas: 'semana', intensidad: 'normal' } },
  { k: 'final', n: 'Gran final', que: 'Duelo, 4 min, todo el viaje', cfg: { modo: 'duelo', dur: 240, preguntas: 'todo', intensidad: 'tormenta' } },
];
export const EQUIPOS = { A: { n: 'Escuadrilla Cian', corto: 'Cian', color: '#5ff4ff' }, B: { n: 'Escuadrilla Ámbar', corto: 'Ámbar', color: '#ffc24a' } };

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
