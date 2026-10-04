// EL «SERVIDOR» DEL BORRADOR. En la versión de verdad esto lo hace una función de GamificaPro (stargateRuta):
// el navegador solo recibe el enunciado y las opciones barajadas, nunca cuál es la buena; responde por POSICIÓN y el
// servidor la traduce (como hoy hace stargateBatalla). La medalla y el premio también los decide el servidor.
// Aquí se imita con el banco local y la marca se guarda en el navegador (localStorage).
import { PREGUNTAS } from './preguntas.js?v=924230522c';

const barajar = (xs) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// 🔴 27-sep · el reparto que aprobó Norberto: el SABER da xp y la PERICIA da créditos. 30 xp y 20 ◈ por misión como
// mucho (300 xp y 200 ◈ el curso): la Ruta no puede llevar a Leyenda saltándose el viaje (entre el viaje, 5.260 xp, y
// Leyenda, 4.650, solo hay 610 de margen). Cada escalón se cobra UNA vez por misión.
export const PREMIOS = { bronce: { xp: 15, cr: 5 }, plata: { xp: 10, cr: 5 }, oro: { xp: 5, cr: 10 } };
export const ORDEN = ['nada', 'bronce', 'plata', 'oro'];
// qué pide cada medalla (lo comprueba el servidor: los aciertos los sabe él; la pericia la manda el navegador y se acota)
export const CRITERIOS = {
  oro: { aciertos: 2 / 3, precision: 0.35, escudo: 40 },
  plata: { aciertos: 1 / 2, precision: 0.2, escudo: 0 },
  bronce: { aciertos: 0, precision: 0, escudo: 0 }, // llegar al planeta
};
// EL SIMULADOR DE VUELO (el repaso de la sala de Joran): tres niveles. Sin xp ni créditos (repetir no puede ser una
// máquina de premios): solo la marca, que va al ranking de la sala. El multiplicador es el de la batalla antigua.
// `lectura` = segundos que tardan en llegar las puertas de una pregunta (solo el cliente: la cámara lenta se calcula
// para que dé tiempo a leer; 27-sep · Norberto: «en difícil no da tiempo a leer»). No toca puntos ni multiplicadores.
export const NIVELES = {
  facil: { n: 'Fácil', mult: 0.85, lectura: 17, daño: 0.7, ritmo: 0.8, que: 'Preguntas fáciles, más escudo y mucho tiempo para leer en las puertas.' },
  media: { n: 'Media', mult: 1, lectura: 15, daño: 1, ritmo: 1, que: 'La Ruta tal cual: preguntas medias.' },
  dificil: { n: 'Difícil', mult: 1.35, lectura: 14, daño: 1.3, ritmo: 1.3, que: 'Medias y difíciles (también las de varias correctas), más enemigos y más daño.' },
};

// Qué preguntas se pueden volar. Una respuesta y completar huecos, siempre (un hueco = una tanda de puertas); las de
// dibujo también (el dibujo sale en el panel). Las de VARIAS correctas, solo en el repaso difícil: hay que cruzar
// todas las buenas, una tanda por cada una, y eso es mucho pedir en la misión de clase.
export function sirve(q, conVarias = false) {
  if (!q || !Array.isArray(q.opciones) || !Array.isArray(q.correctas) || !q.correctas.length) return false;
  if (q.tipo === 'una') return q.correctas.length === 1;
  if (q.tipo === 'hueco') return q.opciones.length <= 6;
  if (q.tipo === 'varias') return conVarias && q.opciones.length <= 5;
  return false;
}
function candidatas(mision, nivel) {
  const temas = mision.tema === 'todo' || mision.final ? [1, 2, 3, 4, 5, 6, 7, 8] : [mision.tema];
  const todas = temas.flatMap((t) => PREGUNTAS[t] || []);
  if (!nivel) return todas.filter((q) => sirve(q) && (!mision.final || q.nivel !== 'facil'));
  const quiere = { facil: ['facil'], media: ['media'], dificil: ['media', 'dificil'] }[nivel];
  const buenas = barajar(todas.filter((q) => sirve(q, nivel === 'dificil') && quiere.includes(q.nivel)));
  // si un tema se queda corto en ese nivel, se completa con el de al lado
  return buenas.concat(barajar(todas.filter((q) => sirve(q) && !quiere.includes(q.nivel))));
}

const partidas = new Map();
const CLAVE = 'sgRutaMarcas', CLAVE_REPASO = 'sgRutaRepaso';
const leer = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; } };
const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: no pasa nada */ } };

export const SERVIDOR = {
  async marcas() { return leer(CLAVE); },
  async repaso() { return leer(CLAVE_REPASO); },
  // op = { nivel } solo en el repaso
  async empezar(mision, op = {}) {
    const nivel = op.nivel && NIVELES[op.nivel] ? op.nivel : null;
    const lista = nivel ? candidatas(mision, nivel) : barajar(candidatas(mision, null));
    const n = mision.final ? 14 : mision.tema === 'todo' ? 12 : 10; // 🔴 espejo de RUTA.PREGUNTAS… (stargateRutaLogica.js?v=924230522c)
    const qs = lista.slice(0, n);
    const id = 'p' + Date.now().toString(36);
    const buenas = {};
    const publicas = qs.map((q) => {
      let ops;
      if (q.tipo === 'una') { // cuatro opciones como mucho, y siempre con la buena
        ops = barajar(q.opciones.map((_, i) => i)).slice(0, 4);
        if (!ops.includes(q.correctas[0])) ops[Math.floor(Math.random() * ops.length)] = q.correctas[0];
      } else ops = barajar(q.opciones.map((_, i) => i));
      buenas[q.id] = { pos: q.correctas.map((c) => ops.indexOf(c)), orden: q.tipo === 'hueco', correccion: q.correccion };
      return { id: q.id, tipo: q.tipo, enunciado: q.enunciado, opciones: ops.map((i) => q.opciones[i]), pasos: q.correctas.length, visual: q.visual || null };
    });
    partidas.set(id, { mision: mision.id, nivel, buenas, aciertos: 0, respondidas: 0, vistas: new Set(), t0: Date.now() });
    return { partida: id, preguntas: publicas };
  },
  // pos = la posición elegida (una respuesta) o la lista de posiciones, una por tanda (huecos en orden; varias, en cualquiera)
  async responder(partida, qid, pos) {
    const p = partidas.get(partida); if (!p || p.vistas.has(qid)) return { ok: false, repetida: true };
    p.vistas.add(qid); p.respondidas++;
    const b = p.buenas[qid], dadas = (Array.isArray(pos) ? pos : [pos]).filter((x) => x != null);
    let ok = !!b && dadas.length === b.pos.length;
    if (ok) ok = b.orden ? b.pos.every((x, i) => dadas[i] === x) : b.pos.every((x) => dadas.includes(x));
    if (ok) p.aciertos++;
    return { ok, correccion: b ? b.correccion : '' };
  },
  // datos: { llego, precision, escudo, puntos } · lo que no puede saber el servidor, acotado a lo posible
  async terminar(partida, datos) {
    const p = partidas.get(partida); if (!p) return { medalla: 'nada' };
    partidas.delete(partida);
    const segs = (Date.now() - p.t0) / 1000;
    const precision = Math.max(0, Math.min(1, Number(datos.precision) || 0));
    const escudo = Math.max(0, Math.min(100, Number(datos.escudo) || 0));
    const ratio = p.respondidas ? p.aciertos / p.respondidas : 0;
    const puntos = Math.round(Number(datos.puntos) || 0);
    if (p.nivel) { // el repaso: sin medalla ni premio, solo la marca (con el multiplicador del nivel)
      const total = datos.llego && segs > 20 ? Math.round(puntos * NIVELES[p.nivel].mult) : 0;
      const r = leer(CLAVE_REPASO), k = p.mision + '|' + p.nivel, antes = r[k] || 0;
      r[k] = Math.max(antes, total); escribir(CLAVE_REPASO, r);
      return { repaso: true, nivel: p.nivel, total, record: total > antes, mejor: r[k], aciertos: p.aciertos, respondidas: p.respondidas };
    }
    let medalla = 'nada';
    if (datos.llego && segs > 20) {
      medalla = 'bronce';
      if (ratio >= CRITERIOS.plata.aciertos && precision >= CRITERIOS.plata.precision) medalla = 'plata';
      if (ratio >= CRITERIOS.oro.aciertos && precision >= CRITERIOS.oro.precision && escudo >= CRITERIOS.oro.escudo) medalla = 'oro';
    }
    const m = leer(CLAVE), antes = m[p.mision] || { medalla: 'nada', puntos: 0 };
    const premio = { xp: 0, cr: 0, escalones: [] };
    for (let i = ORDEN.indexOf(antes.medalla) + 1; i <= ORDEN.indexOf(medalla); i++) {
      const e = ORDEN[i]; premio.xp += PREMIOS[e].xp; premio.cr += PREMIOS[e].cr; premio.escalones.push(e);
    }
    m[p.mision] = { medalla: ORDEN.indexOf(medalla) > ORDEN.indexOf(antes.medalla) ? medalla : antes.medalla, puntos: Math.max(antes.puntos || 0, puntos) };
    escribir(CLAVE, m);
    return { medalla, premio, mejor: m[p.mision], aciertos: p.aciertos, respondidas: p.respondidas };
  },
};
