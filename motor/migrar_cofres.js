'use strict';
/**
 * Los cofres de STARGATE, sin tope de verdad (ver `cofre()` en paquete.js para el porqué).
 * Solo toca recompensas de grupos de STARGATE (`stargate.version`): los cofres de otros proyectos
 * de GamificaPro llevan sus propias existencias y NO se tocan. Idempotente.
 *   node motor/migrar_cofres.js            → producción
 *   FIRESTORE_EMULATOR_HOST=… node …       → el laboratorio
 */
const path = require("path");
const GP = "/Users/nor/Claude/vibewebs/gamificapro";
const admin = require(path.join(GP, "node_modules", "firebase-admin"));
if (process.env.FIRESTORE_EMULATOR_HOST) admin.initializeApp({ projectId: "demo-stargate" });
else admin.initializeApp({ credential: admin.credential.cert(require(path.join(GP, "service-account.json"))) });
const db = admin.firestore();
const SIN_TOPE = 1000000;
(async () => {
  const proys = await db.collection("projects").get();
  const stargate = new Set(proys.docs.filter(p => (p.data().stargate || {}).version).map(p => p.id));
  const r = await db.collection("rewards").get();
  let n = 0;
  for (const d of r.docs) {
    const x = d.data();
    if (!stargate.has(x.projectId) || !x.consumeEffects || !x.consumeEffects.lootBox) continue;
    const items = (x.consumeEffects.lootBox.items || []).map(i => Object.assign({}, i, { maxStock: SIN_TOPE }));
    await d.ref.update({ "consumeEffects.lootBox.items": items });
    n++;
  }
  console.log("✓ cofres de STARGATE sin tope:", n, "(de", stargate.size, "grupos)");
  process.exit(0);
})().catch(e => { console.error("✗", e.message); process.exit(1); });
