// QUIÉN HACE DE SERVIDOR. Dentro de la web (la sesión o la Nave, que cargan el motor), el de verdad: la función
// stargateRuta de GamificaPro, que da las preguntas SIN la respuesta, comprueba cada puerta y decide la medalla y el
// premio. Fuera (el borrador) o si la función aún no está desplegada, el de ensayo (servidor-local.js?v=4443d42b89): nada cuenta.
import { SERVIDOR as LOCAL } from './servidor-local.js?v=4443d42b89';

const QS = new URLSearchParams(location.search);
const per = QS.get('per') || '';
// el motor está en la Nave o en la sesión (la Ruta va en su marco; el Simulador de vuelo, en el marco de la sala)
function motor() {
  let w = window;
  for (let i = 0; i < 3 && w.parent && w.parent !== w; i++) { w = w.parent; try { if (w.SG && w.SG.MOTOR && w.SG.MOTOR.llamar) return w.SG.MOTOR; } catch (e) { return null; } }
  return null;
}
const llamar = (datos) => motor().llamar('stargateRuta', datos);

let modo = motor() && per ? 'remoto' : 'local';
export const enEnsayo = () => modo === 'local';
let marcas0 = null;
const susMarcas = () => (marcas0 = marcas0 || llamar({ accion: 'marcas', projectId: per }).then((r) => r.marcas || {}).catch(() => null));

export const SERVIDOR = {
  // las medallas del mapa y las marcas del repaso: en la web, las de tu ficha (una sola llamada para las dos)
  async marcas() { if (modo === 'remoto') { const m = await susMarcas(); if (m) { const { repaso, ...rest } = m; return rest; } } return LOCAL.marcas(); },
  async repaso() { if (modo === 'remoto') { const m = await susMarcas(); if (m) return m.repaso || {}; } return LOCAL.repaso(); },
  // op.nivel = el repaso del Simulador de vuelo (sin premio)
  async empezar(mision, op = {}) {
    if (modo === 'remoto') {
      try { const r = await llamar({ accion: 'empezar', projectId: per, mision: mision.id, nivel: op.nivel || null }); return { partida: r.partida, preguntas: r.preguntas, ensayo: !!r.ensayo }; }
      catch (e) { console.warn('La Ruta, sin servidor: vuelo de ensayo.', e && e.message); modo = 'local'; }
    }
    return LOCAL.empezar(mision, op);
  },
  async responder(partida, qid, pos) {
    if (modo === 'remoto') { try { return await llamar({ accion: 'responder', partida, qid, pos }); } catch (e) { return { ok: false, correccion: '' }; } }
    return LOCAL.responder(partida, qid, pos);
  },
  async terminar(partida, datos) {
    marcas0 = null; // al volver al mapa, las medallas de nuevo
    if (modo === 'remoto') {
      try { const r = await llamar({ accion: 'terminar', partida, llego: !!datos.llego, precision: datos.precision, escudo: datos.escudo, puntos: Math.round(datos.puntos || 0) });
        return r.repaso ? r : { medalla: r.medalla, premio: r.premio || { xp: 0, cr: 0, escalones: [] }, mejor: r.mejor }; }
      catch (e) { return { medalla: 'nada', premio: { xp: 0, cr: 0, escalones: [] }, error: true }; }
    }
    return LOCAL.terminar(partida, datos);
  },
};
