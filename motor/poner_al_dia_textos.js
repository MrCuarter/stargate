'use strict';
/**
 * STARGATE · PONER AL DÍA LOS TEXTOS DE LOS GRUPOS YA CREADOS (1-oct-2026)
 *
 * Un grupo guarda las misiones, campañas y recompensas con las que nació. Si después el catálogo gana un texto (el 1-oct:
 * las fichas de La Bitácora en marcha, Mano rápida y Listo para la batalla, web 44d7a2d), los grupos viejos se quedan sin
 * él: B1 y XS sin descripción y la campaña de Mano rápida titulada «H6_mano-rapida» (la guardia lo vio contestando a Anita).
 *
 * Esto copia SOLO `title` y `description` del paquete de hoy a los documentos del grupo. No toca XP, créditos, insignias,
 * fechas, fichas, entregas ni nada del alumnado; no crea ni borra documentos.
 *   · En los grupos de verdad, solo rellena lo VACÍO o lo que es una clave sin traducir («H6_mano-rapida»): si un docente
 *     hubiera cambiado un texto a mano, se respeta.
 *   · En los de mentira (demo-stargate, nave-escuela) deja todo igual que el catálogo.
 *
 *   node motor/poner_al_dia_textos.js                → ensayo: dice qué cambiaría, grupo a grupo, y no toca nada
 *   node motor/poner_al_dia_textos.js --aplicar      → lo cambia (antes, copia de lo viejo en ~/.config/stargate-mando/copias/)
 *   … --id=per-16450                                 → solo ese grupo
 *   (con FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 va al emulador)
 */
const path = require("path"), fs = require("fs"), os = require("os");
const GP = "/Users/nor/Claude/vibewebs/gamificapro";
const admin = require(path.join(GP, "node_modules", "firebase-admin"));
const EMU = !!process.env.FIRESTORE_EMULATOR_HOST;
if (EMU) admin.initializeApp({ projectId: "demo-stargate" });
else admin.initializeApp({ credential: admin.credential.cert(require(path.join(GP, "service-account.json"))) });
const db = admin.firestore();
const { catalogo } = require("./catalogo.js");
const { paquete } = require("./paquete.js");

const APLICAR = process.argv.includes("--aplicar");
const SOLO = (process.argv.find(a => a.indexOf("--id=") === 0) || "").slice(5);
const DE_MENTIRA = ["demo-stargate", "nave-escuela"];
const CAMPOS = ["title", "description"];
const sinTraducir = v => v == null || String(v).trim() === "" || /^[A-Z]\d+_[a-z0-9-]+$/.test(String(v).trim());
const corto = v => { const s = JSON.stringify(v == null ? "" : v); return s.length > 60 ? s.slice(0, 57) + "…\"" : s; };

(async () => {
  const cat = catalogo();
  const grupos = (await db.collection("projects").get()).docs
    .filter(d => d.data().stargate && d.data().stargate.version && (!SOLO || d.id === SOLO));
  if (!grupos.length) { console.error("✗ No hay grupos de STARGATE" + (SOLO ? " con el id «" + SOLO + "»" : "") + "."); process.exit(2); }

  const cambios = [];   // { ref, col, docId, grupo, antes, despues }
  for (const g of grupos) {
    const sg = g.data().stargate, mentira = DE_MENTIRA.includes(g.id);
    const pq = paquete({ nombre: g.data().name, tipo: sg.tipo, inicio: sg.inicio, pausas: sg.pausas || [] }, cat);
    const antes = cambios.length;
    for (const [col, lista] of [["missions", pq.misiones], ["campaigns", pq.campanas], ["rewards", pq.recompensas]]) {
      for (const x of lista) {
        const ref = db.collection(col).doc(g.id + "__" + x.id), d = await ref.get();
        if (!d.exists) continue;   // no se crea nada: solo textos de lo que ya está
        const r = d.data(), nuevo = {}, viejo = {};
        for (const c of CAMPOS) {
          if (!(c in x) || x[c] === r[c] || sinTraducir(x[c])) continue;
          if (mentira || sinTraducir(r[c])) { nuevo[c] = x[c]; viejo[c] = r[c] == null ? null : r[c]; }
        }
        if (Object.keys(nuevo).length) cambios.push({ ref, col, docId: d.id, grupo: g.id, antes: viejo, despues: nuevo });
      }
    }
    const mios = cambios.slice(antes);
    console.log("\n  " + g.id + " · «" + g.data().name + "»" + (mentira ? " (de mentira)" : "") + (EMU ? " · EMULADOR" : "") +
                " · " + (mios.length ? mios.length + " documento(s)" : "al día"));
    mios.forEach(c => Object.keys(c.despues).forEach(k =>
      console.log("    " + c.col + " " + c.docId.split("__").pop() + " · " + k + ": " + corto(c.antes[k]) + " → " + corto(c.despues[k]))));
  }

  if (!cambios.length) { console.log("\n  ✓ Todo al día: nada que cambiar.\n"); process.exit(0); }
  if (!APLICAR) { console.log("\n  Ensayo: no se ha tocado nada. Para hacerlo, lo mismo con --aplicar.\n"); process.exit(0); }

  const dir = path.join(os.homedir(), ".config", "stargate-mando", "copias");
  fs.mkdirSync(dir, { recursive: true });
  const fich = path.join(dir, "textos-" + new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-") + (EMU ? "-emulador" : "") + ".json");
  fs.writeFileSync(fich, JSON.stringify(cambios.map(c => ({ col: c.col, id: c.docId, antes: c.antes, despues: c.despues })), null, 1));
  console.log("\n  ✓ copia de lo viejo en " + fich);
  for (let i = 0; i < cambios.length; i += 400) {
    const b = db.batch();
    cambios.slice(i, i + 400).forEach(c => b.update(c.ref, c.despues));
    await b.commit();
  }
  // comprobarlo leyendo otra vez
  let mal = 0;
  for (const c of cambios) { const r = (await c.ref.get()).data(); for (const k in c.despues) if (r[k] !== c.despues[k]) mal++; }
  console.log((mal ? "  ✗ " + mal + " campo(s) no han quedado bien" : "  ✓ " + cambios.length + " documento(s) al día, comprobado") + "\n");
  process.exit(mal ? 1 : 0);
})().catch(e => { console.error("✗ " + (e && e.message || e)); process.exit(1); });
