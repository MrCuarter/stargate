'use strict';
/**
 * Los escondites que ya existían en `stargate.huevos` pasan a ser recompensas de verdad del servidor.
 *
 * 🔴 12-sep · Los escondites se reclaman ahora con `claimLinkedReward` (servidor, transacción, topes
 * por persona / total / escuadrón). Los grupos sembrados antes tenían la LISTA pero no las
 * recompensas, y sin ellas un escondite dice «no existe en tu grupo». Esto las crea, con la misma
 * forma que escribe la consola al guardar (`premioDeHuevo`, en paquete.js). Idempotente: se puede
 * lanzar las veces que haga falta.
 *   node motor/migrar_huevos.js            → producción
 */
const path = require("path");
const GP = "/Users/nor/Claude/vibewebs/gamificapro";
const admin = require(path.join(GP, "node_modules", "firebase-admin"));
const { premioDeHuevo, idPremioHuevo } = require("./paquete.js");
admin.initializeApp({ credential: admin.credential.cert(require(path.join(GP, "service-account.json"))) });
const db = admin.firestore();

(async () => {
  const proys = await db.collection("projects").get();
  let n = 0;
  for (const p of proys.docs) {
    const S = p.data().stargate || {};
    if (!S.version || !Array.isArray(S.huevos) || !S.huevos.length) continue;
    const premios = await db.collection("rewards").where("projectId", "==", p.id).get();
    const conCofre = premios.docs.map(d => Object.assign({ id: d.id }, d.data())).filter(r => r.consumeEffects && r.consumeEffects.lootBox);
    const sobre = conCofre.find(r => r.stargateTipo === "cromo"), heroe = conCofre.find(r => r.stargateTipo === "heroe");
    const lote = db.batch();
    S.huevos.forEach(h => lote.set(db.collection("rewards").doc(idPremioHuevo(p.id, h.id)), premioDeHuevo(p.id, h, sobre, heroe), { merge: true }));
    await lote.commit();
    n += S.huevos.length;
    console.log("✓", p.id, "·", S.huevos.length, "escondites · sobre:", sobre ? sobre.id : "—", "· héroe:", heroe ? heroe.id : "—");
  }
  console.log("hecho:", n, "escondites con su recompensa");
  process.exit(0);
})().catch(e => { console.error("✗", e.message); process.exit(1); });
