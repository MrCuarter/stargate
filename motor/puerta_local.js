'use strict';
/**
 * La puerta pública (functions/stargate.js), servida desde este ordenador.
 *
 * Existe para poder VER la Nave sobre el motor nuevo antes de desplegar nada. Hace exactamente las
 * mismas consultas y devuelve exactamente la misma forma: si aquí se ve bien, en producción se ve
 * bien. No es un simulacro — lee el Firestore de verdad.
 */
const http = require("http");
const path = require("path");
const GP = "/Users/nor/Claude/vibewebs/gamificapro";
const admin = require(path.join(GP, "node_modules", "firebase-admin"));
admin.initializeApp({ credential: admin.credential.cert(require(path.join(GP, "service-account.json"))) });
const db = admin.firestore();

const PUBLICO = ["id","displayName","totalPoints","coins","earnedBadges","completedMissionIds",
  "completedCampaignIds","missionTimestamps","inventory","currentPhase","squadId","factionId",
  "stargateProfe","stargateAvatar","stargateBio","stargateViste","stargateTitulo","stargateMarco",
  "stargateFondo","stargateRepesGastados"];

const docs = async (col, per) => (await db.collection(col).where("projectId","==",per).get())
  .docs.map(d => Object.assign({}, d.data(), { id: d.data().stargateId || d.id, docId: d.id }));

http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const per = new URL(req.url, "http://x").searchParams.get("per") || "";
  if (!per) { res.writeHead(400, {"Content-Type":"application/json"}); return res.end('{"error":"Falta ?per="}'); }
  try {
    const p = await db.collection("projects").doc(per).get();
    if (!p.exists || !(p.data().stargate || {}).version) {
      res.writeHead(404, {"Content-Type":"application/json"});
      return res.end(JSON.stringify({ error: "No existe el grupo «" + per + "»" }));
    }
    const [misiones, campanas, recompensas, perfiles] = await Promise.all([
      docs("missions", per), docs("campaigns", per), docs("rewards", per),
      db.collection("student_profiles").where("projectId","==",per).get()
    ]);
    const d = p.data();
    res.writeHead(200, {"Content-Type":"application/json"});
    res.end(JSON.stringify({
      proyecto: { id: p.id, name: d.name, active: d.active, stargate: d.stargate,
                  factions: d.factions || [], levelSystem: d.levelSystem || [] },
      misiones, campanas, recompensas,
      perfiles: perfiles.docs.map(x => { const v = x.data(), o = { id: x.id };
        PUBLICO.forEach(k => { if (v[k] !== undefined) o[k] = v[k]; }); return o; })
    }));
  } catch (e) {
    res.writeHead(500, {"Content-Type":"application/json"});
    res.end(JSON.stringify({ error: e.message }));
  }
}).listen(8792, () => console.log("puerta local en http://localhost:8792/?per=<id>"));
