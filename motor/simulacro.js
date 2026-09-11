'use strict';
/**
 * Un PER de mentira en Firestore, para poder probar el traductor sin red ni cuenta.
 * Devuelve exactamente la forma que tendrán los documentos de verdad.
 */
const { catalogo } = require("./catalogo.js");
const { paquete } = require("./paquete.js");

function mundo(per, reclutas, ahora) {
  const cat = catalogo();
  const p = paquete(per, cat);
  const perfiles = [], privados = {}, vales = [];
  (reclutas || []).forEach(function (r, i) {
    const id = "perf" + (i + 1), uid = "uid" + (i + 1);
    const hechas = r.retos || [];
    const sellos = {};
    hechas.forEach(function (x) { sellos[x.id] = [x.fecha]; });
    const xp = hechas.reduce(function (a, x) {
      const m = p.misiones.filter(function (y) { return y.id === x.id; })[0];
      return a + (m ? m.points : 0);
    }, 0);
    const cred = hechas.reduce(function (a, x) {
      const m = p.misiones.filter(function (y) { return y.id === x.id; })[0];
      return a + (m ? m.coinsReward : 0);
    }, 0);
    perfiles.push({
      id: id, userId: uid, projectId: per.id || "per", displayName: r.alias,
      totalPoints: xp, coins: cred - (r.gastado || 0),
      completedMissionIds: hechas.map(function (x) { return x.id; }),
      missionTimestamps: sellos,
      completedCampaignIds: r.campanas || [],
      inventory: r.inventario || [],
      stargateProfe: r.profe || "", stargateCreditosGanados: cred,
      stargateCreditosGastados: r.gastado || 0, stargateViste: r.viste || ""
    });
    privados[id] = { firstName: r.nombre || "", lastName: r.apellidos || "",
                     email: r.email || "", bitacora: r.bitacora || "", bio: r.bio || "" };
    (r.canjes || []).forEach(function (c, k) {
      vales.push({ id: "v" + i + k, projectId: per.id || "per", studentId: uid,
                   rewardTitle: c.recompensa, createdAt: ahora, status: c.estado || "approved" });
    });
  });
  return { proyecto: Object.assign({ id: per.id || "per" }, p.proyecto),
           misiones: p.misiones, campanas: p.campanas, recompensas: p.recompensas,
           perfiles: perfiles, privados: privados, vales: vales, catalogo: cat };
}
module.exports = { mundo };
