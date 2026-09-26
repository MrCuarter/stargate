// QUIÉN HACE DE SERVIDOR. Dentro de la web (la sesión o la Nave, que cargan el motor), el de verdad: la función
// stargateRuta de GamificaPro, que da las preguntas SIN la respuesta, comprueba cada puerta y decide la medalla y el
// premio. Fuera (el borrador) o si la función aún no está desplegada, el de ensayo (servidor-local.js): nada cuenta.
import { SERVIDOR as LOCAL } from './servidor-local.js';

const QS = new URLSearchParams(location.search);
const per = QS.get('per') || '';
function motor() { try { return window.parent !== window && window.parent.SG && window.parent.SG.MOTOR && window.parent.SG.MOTOR.llamar ? window.parent.SG.MOTOR : null; } catch (e) { return null; } }
const llamar = (datos) => motor().llamar('stargateRuta', datos);

let modo = motor() && per ? 'remoto' : 'local';
export const enEnsayo = () => modo === 'local';

export const SERVIDOR = {
  async marcas() { return LOCAL.marcas(); },
  async empezar(mision) {
    if (modo === 'remoto') {
      try { const r = await llamar({ accion: 'empezar', projectId: per, mision: mision.id }); return { partida: r.partida, preguntas: r.preguntas, ensayo: !!r.ensayo }; }
      catch (e) { console.warn('La Ruta, sin servidor: vuelo de ensayo.', e && e.message); modo = 'local'; }
    }
    return LOCAL.empezar(mision);
  },
  async responder(partida, qid, pos) {
    if (modo === 'remoto') { try { return await llamar({ accion: 'responder', partida, qid, pos }); } catch (e) { return { ok: false, correccion: '' }; } }
    return LOCAL.responder(partida, qid, pos);
  },
  async terminar(partida, datos) {
    if (modo === 'remoto') {
      try { const r = await llamar({ accion: 'terminar', partida, llego: !!datos.llego, precision: datos.precision, escudo: datos.escudo, puntos: Math.round(datos.puntos || 0) });
        return { medalla: r.medalla, premio: r.premio || { xp: 0, cr: 0, escalones: [] }, mejor: r.mejor }; }
      catch (e) { return { medalla: 'nada', premio: { xp: 0, cr: 0, escalones: [] }, error: true }; }
    }
    return LOCAL.terminar(partida, datos);
  },
};
