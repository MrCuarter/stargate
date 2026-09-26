// EL «SERVIDOR» DEL BORRADOR. En la versión de verdad esto lo hace una función de GamificaPro (stargateRuta):
// el navegador solo recibe el enunciado y las opciones barajadas, nunca cuál es la buena; responde por POSICIÓN y el
// servidor la traduce (como hoy hace stargateBatalla). La medalla y el premio también los decide el servidor.
// Aquí se imita con el banco local y la marca se guarda en el navegador (localStorage).
import { PREGUNTAS, FINAL } from './preguntas.js';

const barajar = (xs) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// 🔴 Una sola tabla de premios (la propuesta: la decide Norberto). Cada escalón se cobra UNA vez por misión.
export const PREMIOS = { bronce: { xp: 30, cr: 5 }, plata: { xp: 15, cr: 5 }, oro: { xp: 15, cr: 5 } };
export const ORDEN = ['nada', 'bronce', 'plata', 'oro'];
// qué pide cada medalla (lo comprueba el servidor: los aciertos los sabe él; la pericia la manda el navegador y se acota)
export const CRITERIOS = {
  oro: { aciertos: 2 / 3, precision: 0.35, escudo: 40 },
  plata: { aciertos: 1 / 2, precision: 0.2, escudo: 0 },
  bronce: { aciertos: 0, precision: 0, escudo: 0 }, // llegar al planeta
};

const partidas = new Map();
const CLAVE = 'sgRutaMarcas';
function marcas() { try { return JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch (e) { return {}; } }
function guardar(m) { try { localStorage.setItem(CLAVE, JSON.stringify(m)); } catch (e) { /* sin almacenamiento: no pasa nada */ } }

export const SERVIDOR = {
  async marcas() { return marcas(); },
  async empezar(mision) {
    const banco = mision.final ? barajar(FINAL) : barajar(PREGUNTAS[mision.tema] || []);
    const qs = banco.slice(0, mision.final ? 6 : 3);
    const id = 'p' + Date.now().toString(36);
    const buenas = {};
    const publicas = qs.map((q) => {
      const correcta = q.correctas[0];
      let ops = barajar(q.opciones.map((_, i) => i)).slice(0, 4);
      if (!ops.includes(correcta)) ops[Math.floor(Math.random() * ops.length)] = correcta;
      buenas[q.id] = { pos: ops.indexOf(correcta), correccion: q.correccion };
      return { id: q.id, enunciado: q.enunciado, opciones: ops.map((i) => q.opciones[i]) };
    });
    partidas.set(id, { mision: mision.id, buenas, aciertos: 0, respondidas: 0, vistas: new Set(), t0: Date.now() });
    return { partida: id, preguntas: publicas };
  },
  async responder(partida, qid, pos) {
    const p = partidas.get(partida); if (!p || p.vistas.has(qid)) return { ok: false, repetida: true };
    p.vistas.add(qid); p.respondidas++;
    const b = p.buenas[qid]; const ok = pos != null && b && pos === b.pos;
    if (ok) p.aciertos++;
    return { ok, correccion: b ? b.correccion : '' };
  },
  // datos: { llego, precision, escudo } · lo que no puede saber el servidor, acotado a lo posible
  async terminar(partida, datos) {
    const p = partidas.get(partida); if (!p) return { medalla: 'nada' };
    partidas.delete(partida);
    const segs = (Date.now() - p.t0) / 1000;
    const precision = Math.max(0, Math.min(1, Number(datos.precision) || 0));
    const escudo = Math.max(0, Math.min(100, Number(datos.escudo) || 0));
    const ratio = p.respondidas ? p.aciertos / p.respondidas : 0;
    let medalla = 'nada';
    if (datos.llego && segs > 20) {
      medalla = 'bronce';
      if (ratio >= CRITERIOS.plata.aciertos && precision >= CRITERIOS.plata.precision) medalla = 'plata';
      if (ratio >= CRITERIOS.oro.aciertos && precision >= CRITERIOS.oro.precision && escudo >= CRITERIOS.oro.escudo) medalla = 'oro';
    }
    const m = marcas(), antes = m[p.mision] || { medalla: 'nada', puntos: 0 };
    const premio = { xp: 0, cr: 0, escalones: [] };
    for (let i = ORDEN.indexOf(antes.medalla) + 1; i <= ORDEN.indexOf(medalla); i++) {
      const e = ORDEN[i]; premio.xp += PREMIOS[e].xp; premio.cr += PREMIOS[e].cr; premio.escalones.push(e);
    }
    const puntos = Math.round(Number(datos.puntos) || 0);
    m[p.mision] = { medalla: ORDEN.indexOf(medalla) > ORDEN.indexOf(antes.medalla) ? medalla : antes.medalla, puntos: Math.max(antes.puntos || 0, puntos) };
    guardar(m);
    return { medalla, premio, mejor: m[p.mision], aciertos: p.aciertos, respondidas: p.respondidas };
  },
};
